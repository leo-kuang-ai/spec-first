'use strict';

// U5 — Workspace spec-first-owned child commit hook (R6/KTD5/KTD8).
//
// Graphify 0.9.x native hook 只重建 child 默认输出，无法重收敛父目录 out-of-tree merged graph，
// 因此 workspace 用 spec-first 自有 child hook：commit 后调用 workspace-async-refresh `--trigger`，
// 后台对全部 confirmed child 执行 bounded CodeGraph sync，再 re-extract Graphify 子图并 merge；
// commit 立即返回。
//
// 授权边界（KTD1/KTD2/KTD8，与单仓 verify-or-prompt 对称）：
//   - 有效 hooks root 在 child 内且可写 → 安装自有 managed hook（`installed`）。
//   - 有效 hooks root 在 child 外 → 绝不写；只读检测已有 marker，报 `blocked`（merged 降级 advisory）。
//   - 非 Git / 路径不安全 → `skipped` / `blocked`，不写。
// 自有 hook 内嵌 verified 绝对 node + async-refresh 脚本 + setup 脚本 + workspace root（KTD5），
// 不依赖 commit 环境的 PATH。安装 idempotent：只替换 spec-first managed block，保留其他 hook 内容。

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  assertContainedPath,
  isAbsolutePath,
  isPathWithin,
  reasonError,
} = require('./path-safety.cjs');
const { readStableRegularFile } = require('./regular-file-snapshot.cjs');
const { resolveGitPath } = require('./git-path.cjs');
const { CANONICAL_HOSTS } = require('./host-authority.cjs');
const {
  INTERNAL_CODEGRAPH_COMMAND_ENV,
  INTERNAL_GRAPHIFY_COMMAND_ENV,
  INTERNAL_REFRESH_ONLY_ENV,
  WORKSPACE_REFRESH_ENV_ALLOWLIST,
} = require('./workspace-refresh-contract.cjs');

const HOOK_NAMES = ['post-commit', 'post-checkout'];
const BLOCK_START = '# >>> spec-first-graphify-workspace-refresh start >>>';
const BLOCK_END = '# <<< spec-first-graphify-workspace-refresh end <<<';
const HOOK_MARKER = 'Installed by: spec-first (workspace merged-graph async refresh)';
const CREATED_HOOK_MARKER = 'Owned file: spec-first-created';
const GRAPHIFY_NATIVE_MARKER = 'Installed by: graphify hook install';

function classifyChildHookTarget(childGitRoot) {
  const resolved = resolveGitPath(childGitRoot, 'hooks');
  if (!resolved.ok) {
    if (resolved.reason_code === 'not-a-git-repo') {
      return { classification: 'not-applicable', reason_code: 'not-a-git-repo' };
    }
    return { classification: 'unsafe', reason_code: 'workspace-child-hook-path-resolve-failed' };
  }
  if (!isPathWithin(resolved.absolute, childGitRoot)) {
    return { classification: 'external', reason_code: 'workspace-child-hook-path-outside-child', absolute: resolved.absolute };
  }
  try {
    const absolute = assertContainedPath(childGitRoot, resolved.absolute, {
      reasonCode: 'workspace-child-hook-symlink-escape',
    });
    return { classification: 'child-contained', reason_code: null, absolute };
  } catch (error) {
    return { classification: 'unsafe', reason_code: error.reason_code || 'workspace-child-hook-symlink-escape' };
  }
}

function renderWorkspaceRefreshHookBlock({
  node,
  asyncRefreshScript,
  setupScript,
  codegraphCommand,
  graphifyCommand,
  runtimeHost,
  bundledVersion,
  workspaceRoot,
}) {
  const rebuildArgs = ['--only', 'codegraph,graphify', '--workspace-graph'];
  const commandArgs = JSON.stringify([setupScript, ...rebuildArgs]);
  const controlEnvironment = [
    codegraphCommand ? `${INTERNAL_CODEGRAPH_COMMAND_ENV}=${shellQuote(codegraphCommand)}` : null,
    graphifyCommand ? `${INTERNAL_REFRESH_ONLY_ENV}=${shellQuote('1')}` : null,
    graphifyCommand ? `${INTERNAL_GRAPHIFY_COMMAND_ENV}=${shellQuote(graphifyCommand)}` : null,
    runtimeHost ? `MCP_SETUP_HOST=${shellQuote(runtimeHost)}` : null,
    bundledVersion ? `SPEC_FIRST_BUNDLED_VERSION=${shellQuote(bundledVersion)}` : null,
  ].filter(Boolean).join(' ');
  const invocation = [
    controlEnvironment,
    shellQuote(node),
    shellQuote(asyncRefreshScript),
    '--trigger',
  ]
    .filter(Boolean)
    .join(' ');
  // 这里只调用固化的绝对 Node 与 source script，不解析 commit PATH 中的辅助程序。
  // async-refresh 入口会在执行 trigger/run 逻辑前原地收敛 process.env，后继子进程
  // 继续使用相同 allowlist，因此无需在 shell 中枚举或解析任意环境变量值。
  // 所有动态值都编码成一个严格的 POSIX 双引号 shell word；JSON 可合法包含单引号，
  // 不能假设 `'${...}'` 安全。shellQuote 同时转义双引号、反斜杠、$ 与反引号。
  return [
    BLOCK_START,
    `# ${HOOK_MARKER}`,
    '# spec-first 受管块；请勿手改。重装/修复：spec-runtime-setup --only codegraph,graphify --workspace-graph',
    `${invocation} \\`,
    `  --workspace ${shellQuote(workspaceRoot)} \\`,
    `  --command ${shellQuote(node)} \\`,
    `  --args ${shellQuote(commandArgs)} >/dev/null 2>&1 || true`,
    BLOCK_END,
    '',
  ].join('\n');
}

function shellQuote(value) {
  return `"${String(value).replace(/(["\\$`])/g, '\\$1')}"`;
}

function stripManagedBlock(contents) {
  const inventory = managedBlockInventory(contents);
  if (inventory.blocks.length === 0) return contents;
  let cursor = 0;
  let stripped = '';
  for (const block of inventory.blocks) {
    stripped += contents.slice(cursor, block.start);
    cursor = block.end;
  }
  stripped += contents.slice(cursor);
  return stripped.replace(/^\n/, '');
}

function managedBlock(contents) {
  const first = managedBlockInventory(contents).blocks[0];
  return first ? first.value : null;
}

function managedBlockInventory(contents) {
  const blocks = [];
  let cursor = 0;
  while (cursor < contents.length) {
    const start = contents.indexOf(BLOCK_START, cursor);
    if (start === -1) break;
    const endMarker = contents.indexOf(BLOCK_END, start + BLOCK_START.length);
    if (endMarker === -1) break;
    const end = endMarker + BLOCK_END.length;
    blocks.push({ start, end, value: contents.slice(start, end) });
    cursor = end;
  }
  const startCount = countOccurrences(contents, BLOCK_START);
  const endCount = countOccurrences(contents, BLOCK_END);
  return {
    blocks,
    malformed: startCount !== endCount || blocks.length !== startCount,
  };
}

function countOccurrences(contents, marker) {
  let count = 0;
  let cursor = 0;
  while (cursor < contents.length) {
    const index = contents.indexOf(marker, cursor);
    if (index === -1) break;
    count += 1;
    cursor = index + marker.length;
  }
  return count;
}

function shellInterpreterSupported(contents) {
  const base = stripManagedBlock(contents).trim();
  if (!base) return true;
  const firstLine = base.split(/\r?\n/, 1)[0].trim();
  if (!firstLine.startsWith('#!')) return false;
  const tokens = firstLine.slice(2).trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  let interpreter = path.basename(tokens[0]);
  if (interpreter === 'env') {
    interpreter = tokens
      .slice(1)
      .find((token) => !token.startsWith('-'));
    interpreter = interpreter ? path.basename(interpreter) : '';
  }
  return ['sh', 'bash', 'dash', 'ksh', 'zsh'].includes(interpreter);
}

function inspectInstallTarget(childGitRoot, hooksRoot, hookName) {
  const containedRoot = assertContainedPath(childGitRoot, hooksRoot, {
    reasonCode: 'workspace-child-hook-symlink-escape',
  });
  fs.mkdirSync(containedRoot, { recursive: true });
  const target = assertContainedPath(childGitRoot, path.join(containedRoot, hookName), {
    reasonCode: 'workspace-child-hook-symlink-escape',
  });
  const snapshot = readStableRegularFile(target, {
    read: (descriptor) => fs.readFileSync(descriptor, 'utf8'),
  });
  if (snapshot.status === 'missing') return { ok: true, target };
  if (!snapshot.ok) {
    return { ok: false, target, reason_code: 'workspace-child-hook-symlink-escape' };
  }
  const contents = snapshot.value;
  if (managedBlockInventory(contents).malformed) {
    return { ok: false, target, reason_code: 'workspace-child-hook-managed-block-stale' };
  }
  return shellInterpreterSupported(contents)
    ? { ok: true, target }
    : { ok: false, target, reason_code: 'workspace-child-hook-interpreter-unsupported' };
}

function installChildHookFile(childGitRoot, hooksRoot, hookName, block) {
  const containedRoot = assertContainedPath(childGitRoot, hooksRoot, {
    reasonCode: 'workspace-child-hook-symlink-escape',
  });
  fs.mkdirSync(containedRoot, { recursive: true });
  const target = assertContainedPath(childGitRoot, path.join(containedRoot, hookName), {
    reasonCode: 'workspace-child-hook-symlink-escape',
  });
  let existing = '';
  let existed = false;
  let existingItem = null;
  const snapshot = readStableRegularFile(target, {
    read: (descriptor) => fs.readFileSync(descriptor, 'utf8'),
  });
  if (snapshot.status !== 'missing') {
    if (!snapshot.ok) {
      throw reasonError('workspace-child-hook-symlink-escape', 'child hook 不是普通文件');
    }
    existed = true;
    existingItem = snapshot.stat;
    existing = snapshot.value;
  }
  const previousBlocks = managedBlockInventory(existing).blocks;
  const createdBySpecFirst = !existed
    || previousBlocks.some((entry) => entry.value.includes(CREATED_HOOK_MARKER));
  let base = stripManagedBlock(existing).replace(/\s*$/, '');
  if (!base) base = '#!/bin/sh';
  const ownedBlock = createdBySpecFirst
    ? block.replace(BLOCK_START, BLOCK_START + '\n# ' + CREATED_HOOK_MARKER)
    : block;
  const next = placeManagedBlockAfterShebang(base, ownedBlock);
  if (existed && next === existing) {
    if (process.platform !== 'win32') {
      try {
        fs.accessSync(target, fs.constants.X_OK);
      } catch (_error) {
        fs.chmodSync(target, (existingItem.mode & 0o777) | 0o100);
      }
    }
    return;
  }
  const temp = `${target}.spec-first.tmp`;
  const targetMode = existed ? ((existingItem.mode & 0o777) | 0o100) : 0o755;
  assertContainedPath(childGitRoot, temp, { reasonCode: 'workspace-child-hook-symlink-escape' });
  try {
    fs.writeFileSync(temp, next, 'utf8');
    fs.chmodSync(temp, targetMode);
    fs.renameSync(temp, target);
  } finally {
    try { fs.rmSync(temp, { force: true }); } catch (_error) { /* preserve the install result */ }
  }
}

function placeManagedBlockAfterShebang(base, ownedBlock) {
  const firstLineEnd = base.indexOf('\n');
  const shebang = (firstLineEnd === -1 ? base : base.slice(0, firstLineEnd)).replace(/\r$/, '');
  const body = firstLineEnd === -1
    ? ''
    : base.slice(firstLineEnd + 1).replace(/^(?:[ \t]*\r?\n)+/, '');
  return body
    ? `${shebang}\n\n${ownedBlock}${body}\n`
    : `${shebang}\n\n${ownedBlock}`;
}

// 对称反转：移除 spec-first 自有 managed block（contained only）。idempotent；只改 hook 文件的
// managed 段；只有安装时明确标记为 spec-first 创建的空 shell hook 才删除文件，
// 用户预存的空文件、shebang 与其他内容始终保留。
function removeWorkspaceChildHook(childGitRoot, hooksRoot) {
  let changed = false;
  for (const name of HOOK_NAMES) {
    let target;
    try {
      target = assertContainedPath(childGitRoot, path.join(hooksRoot, name), {
        reasonCode: 'workspace-child-hook-symlink-escape',
      });
    } catch (error) {
      return { ok: false, changed, reason_code: error.reason_code || 'workspace-child-hook-symlink-escape' };
    }
    if (!fs.existsSync(target)) continue;
    if (fs.lstatSync(target).isSymbolicLink()) continue;
    const existing = fs.readFileSync(target, 'utf8');
    const inventory = managedBlockInventory(existing);
    if (inventory.malformed) {
      return {
        ok: false,
        changed,
        reason_code: 'workspace-child-hook-managed-block-stale',
      };
    }
    if (inventory.blocks.length === 0) continue;
    const blocks = inventory.blocks;
    const createdBySpecFirst = blocks.some((entry) => entry.value.includes(CREATED_HOOK_MARKER));
    const stripped = stripManagedBlock(existing).replace(/\s*$/, '');
    changed = true;
    if (createdBySpecFirst && (!stripped || stripped === '#!/bin/sh')) {
      fs.rmSync(target, { force: true });
    } else if (!stripped || stripped === '#!/bin/sh') {
      fs.writeFileSync(target, stripped ? stripped + '\n' : '', 'utf8');
      fs.chmodSync(target, 0o755);
    } else {
      fs.writeFileSync(target, `${stripped}\n`, 'utf8');
      fs.chmodSync(target, 0o755);
    }
  }
  return { ok: true, changed, reason_code: null };
}

function probeChildHookMarker(hooksRoot) {
  const detected = {
    ok: true,
    spec_first: false,
    graphify_native: false,
    reason_code: null,
    failures: [],
  };
  for (const name of HOOK_NAMES) {
    const file = path.join(hooksRoot, name);
    const snapshot = readStableRegularFile(file, {
      read: (descriptor) => fs.readFileSync(descriptor, 'utf8'),
    });
    if (!snapshot.ok) {
      if (snapshot.status === 'missing') continue;
      const reasonCode = ['not-regular', 'unsafe-path', 'unstable'].includes(snapshot.status)
        ? 'workspace-child-hook-symlink-escape'
        : 'workspace-child-hook-unreadable';
      detected.ok = false;
      detected.reason_code = detected.reason_code || reasonCode;
      detected.failures.push({ hook_name: name, status: snapshot.status, reason_code: reasonCode });
      continue;
    }
    if (snapshot.value.includes(HOOK_MARKER)
      || snapshot.value.includes(BLOCK_START)
      || snapshot.value.includes(BLOCK_END)) detected.spec_first = true;
    if (snapshot.value.includes(GRAPHIFY_NATIVE_MARKER)) detected.graphify_native = true;
  }
  return detected;
}

function inspectWorkspaceChildHookPosture({
  child,
  workspaceRoot,
  bundledVersion = '',
  expectedHookContract = null,
  preparedHookInspection = null,
} = {}) {
  if (!child || !child.git_root || !workspaceRoot) {
    return { hook_status: 'blocked', reason_code: 'workspace-child-hook-inspection-invalid' };
  }
  const target = classifyChildHookTarget(child.git_root);
  if (target.classification !== 'child-contained') {
    return {
      hook_status: target.classification === 'not-applicable' ? 'missing' : 'blocked',
      reason_code: target.reason_code || 'workspace-child-hook-unavailable',
    };
  }
  const inspection = preparedHookInspection || prepareWorkspaceChildHookInspection({
    workspaceRoot,
    bundledVersion,
    expectedHookContract,
  });
  if (!inspection.ok) return { hook_status: inspection.hook_status, reason_code: inspection.reason_code };
  for (const name of HOOK_NAMES) {
    const file = path.join(target.absolute, name);
    const snapshot = readStableRegularFile(file, {
      accessMode: process.platform === 'win32' ? null : fs.constants.X_OK,
      read: (descriptor) => fs.readFileSync(descriptor, 'utf8'),
    });
    if (!snapshot.ok) {
      if (snapshot.status === 'missing') {
        return { hook_status: 'missing', reason_code: 'workspace-child-hook-missing' };
      }
      if (snapshot.status === 'access-denied') {
        return { hook_status: 'blocked', reason_code: 'workspace-child-hook-not-executable' };
      }
      if (snapshot.status === 'not-regular' || snapshot.status === 'unstable') {
        return { hook_status: 'blocked', reason_code: 'workspace-child-hook-symlink-escape' };
      }
      return { hook_status: 'blocked', reason_code: 'workspace-child-hook-unreadable' };
    }
    const contents = snapshot.value;
    if (!shellInterpreterSupported(contents)) {
      return { hook_status: 'blocked', reason_code: 'workspace-child-hook-interpreter-unsupported' };
    }
    const inventory = managedBlockInventory(contents);
    if (inventory.malformed || inventory.blocks.length !== 1) {
      return { hook_status: 'stale', reason_code: 'workspace-child-hook-managed-block-stale' };
    }
    if (managedBlockSha256(inventory.blocks[0].value) !== inspection.contract.managed_block_sha256) {
      return { hook_status: 'stale', reason_code: 'workspace-child-hook-managed-block-stale' };
    }
  }
  if (!inspection.runtime_available) {
    return { hook_status: 'blocked', reason_code: 'workspace-child-hook-runtime-path-unavailable' };
  }
  return { hook_status: 'installed', reason_code: null };
}

function prepareWorkspaceChildHookInspection({
  workspaceRoot,
  bundledVersion = '',
  expectedHookContract = null,
} = {}) {
  const contract = validateWorkspaceRefreshHookContract(expectedHookContract, {
    workspaceRoot,
    bundledVersion,
  });
  if (!contract.ok) {
    return {
      ok: false,
      hook_status: 'stale',
      reason_code: 'workspace-child-hook-managed-block-stale',
      contract: null,
    };
  }
  if (!runtimeFileAvailable(contract.value.node, fs.constants.X_OK)
    || !runtimeFileAvailable(contract.value.async_refresh_script, fs.constants.R_OK)
    || !runtimeFileAvailable(contract.value.setup_script, fs.constants.R_OK)
    || !runtimeFileAvailable(contract.value.codegraph_command, fs.constants.X_OK)
    || !runtimeFileAvailable(contract.value.graphify_command, fs.constants.X_OK)) {
    return { ok: true, runtime_available: false, contract: contract.value };
  }
  return { ok: true, runtime_available: true, contract: contract.value };
}

function canonicalManagedBlock(block) {
  return block.replace(`${BLOCK_START}\n# ${CREATED_HOOK_MARKER}`, BLOCK_START);
}

function managedBlockSha256(block) {
  return crypto.createHash('sha256').update(canonicalManagedBlock(block)).digest('hex');
}

function createWorkspaceRefreshHookContract({
  node,
  asyncRefreshScript,
  setupScript,
  codegraphCommand,
  graphifyCommand,
  runtimeHost,
  bundledVersion,
  workspaceRoot,
}) {
  const block = managedBlock(renderWorkspaceRefreshHookBlock({
    node,
    asyncRefreshScript,
    setupScript,
    codegraphCommand,
    graphifyCommand,
    runtimeHost,
    bundledVersion,
    workspaceRoot,
  }));
  return {
    schema_version: 'workspace-child-hook-contract.v2',
    managed_block_sha256: managedBlockSha256(block),
    node,
    async_refresh_script: asyncRefreshScript,
    setup_script: setupScript,
    codegraph_command: codegraphCommand,
    graphify_command: graphifyCommand,
    runtime_host: runtimeHost,
    bundled_version: bundledVersion,
  };
}

function validateWorkspaceRefreshHookContract(contract, { workspaceRoot, bundledVersion = '' } = {}) {
  if (!contract
    || contract.schema_version !== 'workspace-child-hook-contract.v2'
    || !/^[0-9a-f]{64}$/.test(contract.managed_block_sha256 || '')
    || !validHookRuntimeContext({
      node: contract.node,
      asyncRefreshScript: contract.async_refresh_script,
      setupScript: contract.setup_script,
      codegraphCommand: contract.codegraph_command,
      graphifyCommand: contract.graphify_command,
      runtimeHost: contract.runtime_host,
      bundledVersion: contract.bundled_version,
    })
    || (bundledVersion && contract.bundled_version !== bundledVersion)) {
    return { ok: false, value: null };
  }
  const expected = createWorkspaceRefreshHookContract({
    node: contract.node,
    asyncRefreshScript: contract.async_refresh_script,
    setupScript: contract.setup_script,
    codegraphCommand: contract.codegraph_command,
    graphifyCommand: contract.graphify_command,
    runtimeHost: contract.runtime_host,
    bundledVersion: contract.bundled_version,
    workspaceRoot,
  });
  return expected.managed_block_sha256 === contract.managed_block_sha256
    ? { ok: true, value: contract }
    : { ok: false, value: null };
}

function runtimeFileAvailable(filePath, mode) {
  if (!isAbsolutePath(filePath)) return false;
  try {
    const item = fs.statSync(filePath);
    if (!item.isFile()) return false;
    fs.accessSync(filePath, mode);
    return true;
  } catch (_error) {
    return false;
  }
}

function applyChildHookPosture({
  child,
  node,
  asyncRefreshScript,
  setupScript,
  codegraphCommand,
  graphifyCommand,
  runtimeHost,
  bundledVersion,
  workspaceRoot,
  install = true,
}) {
  const target = classifyChildHookTarget(child.git_root);
  const base = { repo_id: child.repo_id, fallback: 'explicit-workspace-graph-refresh' };
  if (target.classification === 'not-applicable') {
    return { ...base, hook_status: 'skipped', reason_code: target.reason_code };
  }
  if (target.classification === 'external') {
    // 绝不写外部；只读检测已有 marker，供诚实报告，但 merged 仍降级 advisory。
    const marker = target.absolute ? probeChildHookMarker(target.absolute) : { spec_first: false, graphify_native: false };
    return {
      ...base,
      hook_status: marker.spec_first || marker.graphify_native ? 'verified-external' : 'blocked',
      reason_code: target.reason_code,
    };
  }
  if (target.classification !== 'child-contained') {
    return { ...base, hook_status: 'blocked', reason_code: target.reason_code };
  }
  if (!install) {
    return { ...base, hook_status: 'not-installed', reason_code: 'workspace-child-hook-install-disabled' };
  }
  if (!validHookRuntimeContext({
    node,
    asyncRefreshScript,
    setupScript,
    codegraphCommand,
    graphifyCommand,
    runtimeHost,
    bundledVersion,
  })) {
    return { ...base, hook_status: 'blocked', reason_code: 'workspace-child-hook-runtime-context-incomplete' };
  }
  let inspections;
  try {
    inspections = HOOK_NAMES.map((name) => inspectInstallTarget(child.git_root, target.absolute, name));
  } catch (error) {
    return { ...base, hook_status: 'failed', reason_code: error.reason_code || 'workspace-child-hook-install-failed' };
  }
  const blocked = inspections.find((entry) => !entry.ok);
  if (blocked) {
    return {
      ...base,
      hook_status: 'blocked',
      reason_code: blocked.reason_code || 'workspace-child-hook-install-blocked',
    };
  }
  const block = renderWorkspaceRefreshHookBlock({
    node,
    asyncRefreshScript,
    setupScript,
    codegraphCommand,
    graphifyCommand,
    runtimeHost,
    bundledVersion,
    workspaceRoot,
  });
  try {
    for (const name of HOOK_NAMES) installChildHookFile(child.git_root, target.absolute, name, block);
    return { ...base, hook_status: 'installed', reason_code: null };
  } catch (error) {
    return { ...base, hook_status: 'failed', reason_code: error.reason_code || 'workspace-child-hook-install-failed' };
  }
}

function validHookRuntimeContext({
  node,
  asyncRefreshScript,
  setupScript,
  codegraphCommand,
  graphifyCommand,
  runtimeHost,
  bundledVersion,
}) {
  return isAbsolutePath(node)
    && isAbsolutePath(asyncRefreshScript)
    && isAbsolutePath(setupScript)
    && isAbsolutePath(codegraphCommand)
    && isAbsolutePath(graphifyCommand)
    && CANONICAL_HOSTS.includes(runtimeHost)
    && typeof bundledVersion === 'string'
    && bundledVersion.length > 0;
}

function installWorkspaceChildHooks({
  workspaceRoot,
  repos = [],
  node,
  asyncRefreshScript,
  setupScript,
  codegraphCommand,
  graphifyCommand,
  runtimeHost,
  bundledVersion,
  install = true,
}) {
  const results = repos.map((child) => applyChildHookPosture({
    child,
    node,
    asyncRefreshScript,
    setupScript,
    codegraphCommand,
    graphifyCommand,
    runtimeHost,
    bundledVersion,
    workspaceRoot,
    install,
  }));
  const anyInstalled = results.some((entry) => entry.hook_status === 'installed');
  const allInstalled = results.length > 0 && results.every((entry) => entry.hook_status === 'installed');
  let status = 'not-installed';
  if (allInstalled) status = 'installed';
  else if (anyInstalled) status = 'partial';
  else if (results.every((entry) => entry.hook_status === 'not-installed')) status = 'not-installed';
  else if (results.some((entry) => entry.hook_status === 'failed')) status = 'failed';
  else if (results.every((entry) => entry.hook_status === 'skipped')) status = 'skipped';
  else status = 'blocked';
  return {
    schema_version: 'workspace-graph-hooks.v1',
    status,
    reason_code: anyInstalled ? 'workspace-graph-commit-hook-async' : 'workspace-graph-child-hooks-unavailable',
    hook_contract: anyInstalled ? createWorkspaceRefreshHookContract({
      node,
      asyncRefreshScript,
      setupScript,
      codegraphCommand,
      graphifyCommand,
      runtimeHost,
      bundledVersion,
      workspaceRoot,
    }) : null,
    repos: results,
  };
}

module.exports = {
  HOOK_NAMES,
  BLOCK_START,
  BLOCK_END,
  HOOK_MARKER,
  INTERNAL_REFRESH_ONLY_ENV,
  INTERNAL_CODEGRAPH_COMMAND_ENV,
  INTERNAL_GRAPHIFY_COMMAND_ENV,
  WORKSPACE_REFRESH_ENV_ALLOWLIST,
  classifyChildHookTarget,
  renderWorkspaceRefreshHookBlock,
  stripManagedBlock,
  probeChildHookMarker,
  inspectWorkspaceChildHookPosture,
  prepareWorkspaceChildHookInspection,
  createWorkspaceRefreshHookContract,
  applyChildHookPosture,
  installWorkspaceChildHooks,
  removeWorkspaceChildHook,
};
