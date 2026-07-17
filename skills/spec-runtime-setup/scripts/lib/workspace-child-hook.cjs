'use strict';

// U5 — Workspace spec-first-owned child commit hook (R6/KTD5/KTD8).
//
// Graphify 0.9.x native hook 只重建 child 默认输出，无法重收敛父目录 out-of-tree merged graph，
// 因此 workspace 用 spec-first 自有 child hook：commit 后调用 workspace-async-refresh `--trigger`，
// 后台异步重建整个 workspace（re-extract 各 child + merge），commit 立即返回。
//
// 授权边界（KTD1/KTD2/KTD8，与单仓 verify-or-prompt 对称）：
//   - 有效 hooks root 在 child 内且可写 → 安装自有 managed hook（`installed`）。
//   - 有效 hooks root 在 child 外 → 绝不写；只读检测已有 marker，报 `blocked`（merged 降级 advisory）。
//   - 非 Git / 路径不安全 → `skipped` / `blocked`，不写。
// 自有 hook 内嵌 verified 绝对 node + async-refresh 脚本 + setup 脚本 + workspace root（KTD5），
// 不依赖 commit 环境的 PATH。安装 idempotent：只替换 spec-first managed block，保留其他 hook 内容。

const fs = require('node:fs');
const path = require('node:path');
const { isPathWithin, assertContainedPath } = require('./path-safety.cjs');
const { resolveGitPath } = require('./git-path.cjs');

const HOOK_NAMES = ['post-commit', 'post-checkout'];
const BLOCK_START = '# >>> spec-first-graphify-workspace-refresh start >>>';
const BLOCK_END = '# <<< spec-first-graphify-workspace-refresh end <<<';
const HOOK_MARKER = 'Installed by: spec-first (workspace merged-graph async refresh)';
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

function renderWorkspaceRefreshHookBlock({ node, asyncRefreshScript, setupScript, workspaceRoot, repoIds }) {
  const rebuildArgs = ['--only', 'codegraph,graphify', '--workspace-graph'];
  if (Array.isArray(repoIds) && repoIds.length > 0) {
    rebuildArgs.push('--repos', repoIds.join(','));
  }
  const commandArgs = JSON.stringify([setupScript, ...rebuildArgs]);
  // 单引号包裹 JSON（内部无单引号），避免 shell 变量展开与二次转义。
  return [
    BLOCK_START,
    `# ${HOOK_MARKER}`,
    '# spec-first 受管块；请勿手改。重装/修复：spec-runtime-setup --only codegraph,graphify --workspace-graph',
    `${shellQuote(node)} ${shellQuote(asyncRefreshScript)} --trigger \\`,
    `  --workspace ${shellQuote(workspaceRoot)} \\`,
    `  --command ${shellQuote(node)} \\`,
    `  --args '${commandArgs}' >/dev/null 2>&1 || true`,
    BLOCK_END,
    '',
  ].join('\n');
}

function shellQuote(value) {
  return `"${String(value).replace(/(["\\$`])/g, '\\$1')}"`;
}

function stripManagedBlock(contents) {
  const start = contents.indexOf(BLOCK_START);
  if (start === -1) return contents;
  const end = contents.indexOf(BLOCK_END, start);
  if (end === -1) return contents;
  const after = end + BLOCK_END.length;
  const tail = contents.slice(after).replace(/^\n/, '');
  return `${contents.slice(0, start)}${tail}`;
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
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isSymbolicLink()) {
      throw Object.assign(new Error('child hook 是 symlink'), { reason_code: 'workspace-child-hook-symlink-escape' });
    }
    existing = fs.readFileSync(target, 'utf8');
  }
  let base = stripManagedBlock(existing).replace(/\s*$/, '');
  if (!base) base = '#!/bin/sh';
  const next = `${base}\n\n${block}`;
  const temp = `${target}.spec-first.tmp`;
  assertContainedPath(childGitRoot, temp, { reasonCode: 'workspace-child-hook-symlink-escape' });
  fs.writeFileSync(temp, next, 'utf8');
  fs.chmodSync(temp, 0o755);
  fs.renameSync(temp, target);
}

// 对称反转：移除 spec-first 自有 managed block（contained only）。idempotent；只改 hook 文件的
// managed 段，保留其他内容；块移除后若 hook 文件只剩空 shebang 则删除该 hook 文件。
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
    if (!existing.includes(BLOCK_START)) continue;
    const stripped = stripManagedBlock(existing).replace(/\s*$/, '');
    changed = true;
    if (!stripped || stripped === '#!/bin/sh') {
      fs.rmSync(target, { force: true });
    } else {
      fs.writeFileSync(target, `${stripped}\n`, 'utf8');
      fs.chmodSync(target, 0o755);
    }
  }
  return { ok: true, changed, reason_code: null };
}

function probeChildHookMarker(hooksRoot) {
  const detected = { spec_first: false, graphify_native: false };
  for (const name of HOOK_NAMES) {
    const file = path.join(hooksRoot, name);
    try {
      if (!fs.lstatSync(file).isFile()) continue;
      const contents = fs.readFileSync(file, 'utf8');
      if (contents.includes(HOOK_MARKER)) detected.spec_first = true;
      if (contents.includes(GRAPHIFY_NATIVE_MARKER)) detected.graphify_native = true;
    } catch (_error) {
      // 缺失/不可读 → 未命中；只读探测绝不抛出。
    }
  }
  return detected;
}

function applyChildHookPosture({ child, node, asyncRefreshScript, setupScript, workspaceRoot, repoIds, install = true }) {
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
  const block = renderWorkspaceRefreshHookBlock({ node, asyncRefreshScript, setupScript, workspaceRoot, repoIds });
  try {
    for (const name of HOOK_NAMES) installChildHookFile(child.git_root, target.absolute, name, block);
    return { ...base, hook_status: 'installed', reason_code: null };
  } catch (error) {
    return { ...base, hook_status: 'failed', reason_code: error.reason_code || 'workspace-child-hook-install-failed' };
  }
}

function installWorkspaceChildHooks({ workspaceRoot, repos = [], node, asyncRefreshScript, setupScript, install = true }) {
  const repoIds = repos.map((repo) => repo.repo_id).filter(Boolean);
  const results = repos.map((child) => applyChildHookPosture({
    child, node, asyncRefreshScript, setupScript, workspaceRoot, repoIds, install,
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
    repos: results,
  };
}

module.exports = {
  HOOK_NAMES,
  BLOCK_START,
  BLOCK_END,
  HOOK_MARKER,
  classifyChildHookTarget,
  renderWorkspaceRefreshHookBlock,
  stripManagedBlock,
  probeChildHookMarker,
  applyChildHookPosture,
  installWorkspaceChildHooks,
  removeWorkspaceChildHook,
};
