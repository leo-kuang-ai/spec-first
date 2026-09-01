const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const pkg = require('../../../package.json');
const { getAdapter, getSupportedPlatforms } = require('../adapters');
const {
  discoverChildGitRepos,
  findGitRoot,
} = require('./init');
const {
  clearCliVersionReminderCooldown,
} = require('../version-reminder');
const { runNpm } = require('../../../scripts/lib/npm-cli.cjs');
const { resolveUserLanguage } = require('../cli-lang');
const { detectColorSupport, renderFullArt } = require('../brand');

const PACKAGE_NAME = pkg.name;
const UPGRADE_COMMAND = `npm install -g ${PACKAGE_NAME}@latest`;
// 用户旅程文案双语；reason_code、npm 退出码等技术事实保留原文。
const UPDATE_MESSAGES = {
  zh: {
    upgrading: (command) => `正在通过以下命令升级 ${PACKAGE_NAME}: ${command}`,
    npmMissing: '无法运行 npm：PATH 上未找到 `npm`。',
    npmMissingFix: '请先安装 Node.js/npm（或用你自己的包管理器执行升级），然后重试。',
    upgradeFailed: (status) => `升级失败（npm 退出码 ${status}）。`,
    retryManually: (command) => `可手动重试: ${command}`,
    upgradedTo: (name, version) => `✅ ${name} 已升级到 v${version}。`,
    upgraded: (name) => `✅ ${name} 升级完成。`,
    refreshSkipped: 'Runtime 刷新：已跳过（无法安全确定刷新范围）。',
    refreshing: (command) => `正在刷新 runtime assets: ${command}`,
    refreshDegraded: (reason) => `Runtime 刷新：降级（${reason}）。`,
    refreshDegradedMissingCli: 'Runtime 刷新：降级（升级后在 PATH 上找不到 `spec-first`）。',
    refreshDegradedExit: (status) => `Runtime 刷新：降级（spec-first init 退出码 ${status}）。`,
    refreshCompleted: 'Runtime 刷新完成。',
    pluginNote1: '注意：如果你是以 Claude Code plugin（而非 npm -g）方式安装 spec-first，',
    pluginNote2: '请改用 `claude plugin update` 升级——npm -g 管理的是另一份副本。',
  },
  en: {
    upgrading: (command) => `Upgrading ${PACKAGE_NAME} via: ${command}`,
    npmMissing: 'Could not run npm: `npm` was not found on your PATH.',
    npmMissingFix: 'Install Node.js/npm (or run the upgrade with your own package manager), then retry.',
    upgradeFailed: (status) => `Upgrade failed (npm exited with code ${status}).`,
    retryManually: (command) => `You can retry manually with: ${command}`,
    upgradedTo: (name, version) => `✅ ${name} upgraded to v${version}.`,
    upgraded: (name) => `✅ ${name} upgraded.`,
    refreshSkipped: 'Runtime refresh: skipped (scope could not be determined safely).',
    refreshing: (command) => `Refreshing runtime assets via: ${command}`,
    refreshDegraded: (reason) => `Runtime refresh: degraded (${reason}).`,
    refreshDegradedMissingCli: 'Runtime refresh: degraded (`spec-first` was not found on PATH after upgrade).',
    refreshDegradedExit: (status) => `Runtime refresh: degraded (spec-first init exited with code ${status}).`,
    refreshCompleted: 'Runtime refresh completed.',
    pluginNote1: 'Note: if you installed spec-first as a Claude Code plugin (not via npm -g),',
    pluginNote2: '  upgrade it with `claude plugin update` instead — npm -g manages a separate copy.',
  },
};


/**
 * `spec-first update` — 实际执行 CLI 包升级。
 *
 * 设计边界(见 docs/plans/2026-06-12-003-feat-update-perform-upgrade-plan.md):
 * - 无条件直跑 `npm install -g spec-first@latest`:不查版本、不检测安装方式。
 *   npm 自身幂等,已是最新会自动 no-op。
 * - 升级成功后启动 fresh `spec-first init` 子进程刷新本地 runtime,避免旧进程
 *   直接跑新生成逻辑的版本错位。
 * - 已知风险(用户确认接受):非 npm-global 安装(Claude plugin / pnpm / volta 等)
 *   会被装出冲突副本;以一条静态 caveat 提示缓解,不做分支检测。
 * - 退出码:0=升级成功;1=升级失败(npm 未找到或返回非 0);2=用法错误。
 */
async function runUpdate(argv, deps = {}) {
  const args = [...argv];

  if (args.includes('-h') || args.includes('--help')) {
    printHelp();
    return 0;
  }

  // `--json` / `--claude` / `--codex` 等旧 check-only flag 已移除,视为用法错误。
  if (args.length > 0) {
    console.error(`Usage: spec-first update [-h|--help]`);
    return 2;
  }

  const runInstall = deps.runInstall || defaultRunInstall;
  const runRuntimeRefresh = deps.runRuntimeRefresh || defaultRunRuntimeRefresh;
  const resolveRuntimeRefresh = deps.resolveRuntimeRefreshCommand || resolveRuntimeRefreshCommand;
  const resolveInstalledCli = deps.resolveInstalledCliPath || resolveInstalledCliPath;
  const clearVersionReminderCooldown = deps.clearVersionReminderCooldown || clearCliVersionReminderCooldown;
  const cwd = deps.cwd || process.cwd();
  const messages = UPDATE_MESSAGES[
    (deps.resolveLang || resolveUserLanguage)() === 'en' ? 'en' : 'zh'
  ];

  // 更新入口展示完整 logo：版本升级是低频、值得仪式感的时刻。
  console.log(renderFullArt(pkg.version, { useColor: detectColorSupport() }).trimEnd());
  console.log(messages.upgrading(UPGRADE_COMMAND));
  console.log('');

  const result = runInstall();

  if (result && result.errorCode === 'ENOENT') {
    console.error('');
    console.error(messages.npmMissing);
    console.error(messages.npmMissingFix);
    return 1;
  }

  if (!result || result.status !== 0) {
    const status = result && Number.isInteger(result.status) ? result.status : 1;
    console.error('');
    console.error(messages.upgradeFailed(status));
    console.error(messages.retryManually(UPGRADE_COMMAND));
    return status || 1;
  }

  console.log('');
  // 升级后解析一次全局安装位置：既用于新版本展示，也供 runtime refresh
  // 复用（避免重复执行 npm root -g）。
  const installedCli = resolveInstalledCli();
  const installedVersion = readInstalledVersion(installedCli && installedCli.cliPath);
  console.log(installedVersion
    ? messages.upgradedTo(PACKAGE_NAME, installedVersion)
    : messages.upgraded(PACKAGE_NAME));
  const refresh = resolveRuntimeRefresh(cwd);
  if (!refresh || !Array.isArray(refresh.args)) {
    console.log(messages.refreshSkipped);
    printRuntimeRefreshFallback(refresh);
  } else {
    if (!installedCli || !installedCli.ok || !installedCli.cliPath) {
      const reasonCode = installedCli && installedCli.reason_code
        ? installedCli.reason_code
        : 'global-package-cli-unresolved';
      console.error('');
      console.error(messages.refreshDegraded(reasonCode));
      printRuntimeRefreshFallback(refresh);
      return 1;
    }
    console.log(messages.refreshing(formatSpecFirstCommand(refresh.args)));
    const refreshResult = runRuntimeRefresh(refresh.args, {
      cwd: refresh.cwd || cwd,
      cliPath: installedCli.cliPath,
    });
    if (refreshResult && refreshResult.errorCode === 'ENOENT') {
      console.error('');
      console.error(messages.refreshDegradedMissingCli);
      printRuntimeRefreshFallback(refresh);
      return 1;
    }
    if (!refreshResult || refreshResult.status !== 0) {
      const status = refreshResult && Number.isInteger(refreshResult.status) ? refreshResult.status : 1;
      console.error('');
      console.error(messages.refreshDegradedExit(status));
      printRuntimeRefreshFallback(refresh);
      return 1;
    }
    console.log(messages.refreshCompleted);
  }
  console.log('');
  console.log(messages.pluginNote1);
  console.log(messages.pluginNote2);
  try {
    clearVersionReminderCooldown();
  } catch {
    // 缓存清理失败不能把成功升级变成失败命令。
  }
  return 0;
}

// 从已解析的全局 cli 路径（bin/spec-first.js）读安装清单中的新版本号；
// 纯文件读取、可注入、不重复执行 npm root -g（全局根已由
// resolveInstalledCliPath 解析一次）。读取失败静默回退旧措辞——
// 版本展示是增强信息，不构成升级流程的一部分。
function readInstalledVersion(cliPath, options = {}) {
  try {
    if (!cliPath) return '';
    const readFileSync = options.readFileSync || fs.readFileSync;
    const manifestPath = path.resolve(path.dirname(path.dirname(cliPath)), 'package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    return typeof manifest.version === 'string' ? manifest.version : '';
  } catch (_error) {
    return '';
  }
}

// 默认 install 执行器:跨平台调用 npm,stdio 直通让 npm 进度直达用户。
// 返回 { status, errorCode },便于测试注入替身。
// Node >=20.12 (CVE-2024-27980) 拒绝 shell:false 下 spawn `.cmd`,直接 spawn `npm.cmd` 会 EINVAL;
// 复用仓库既有的 npm CLI JavaScript resolver,统一走 `node npm-cli.js`。
function defaultRunInstall() {
  try {
    const result = runNpm(['install', '-g', `${PACKAGE_NAME}@latest`], { stdio: 'inherit' });
    return {
      status: result.status,
      errorCode: result.error ? result.error.code : null,
    };
  } catch (error) {
    return {
      status: typeof error.status === 'number' ? error.status : 1,
      errorCode: error.code || 'npm-cli-unresolved',
    };
  }
}

// 同上:不按 PATH 猜 `spec-first.cmd`,直接用当前 Node 执行刚升级的 global package bin。
function defaultRunRuntimeRefresh(args, options = {}) {
  if (!options.cliPath) {
    return { status: 1, errorCode: 'global-package-cli-unresolved' };
  }
  const result = spawnSync(process.execPath, [options.cliPath, ...args], {
    cwd: options.cwd || process.cwd(),
    stdio: 'inherit',
    windowsHide: true,
  });
  return {
    status: result.status,
    errorCode: result.error ? result.error.code : null,
  };
}

function resolveInstalledCliPath(options = {}) {
  const runNpmCommand = options.runNpm || runNpm;
  let result;
  try {
    result = runNpmCommand(['root', '-g'], { encoding: 'utf8' });
  } catch (_error) {
    return { ok: false, cliPath: null, reason_code: 'global-npm-root-unavailable' };
  }
  if (!result || result.error || result.status !== 0) {
    return { ok: false, cliPath: null, reason_code: 'global-npm-root-unavailable' };
  }
  const globalRoot = String(result.stdout || '').trim();
  if (!globalRoot) {
    return { ok: false, cliPath: null, reason_code: 'global-npm-root-empty' };
  }
  return resolvePackageCliFromGlobalRoot(globalRoot, options);
}

function resolvePackageCliFromGlobalRoot(globalRoot, options = {}) {
  const existsSync = options.existsSync || fs.existsSync;
  const readFileSync = options.readFileSync || fs.readFileSync;
  const statSync = options.statSync || fs.statSync;
  const packageRoot = path.resolve(globalRoot, ...PACKAGE_NAME.split('/'));
  const manifestPath = path.join(packageRoot, 'package.json');
  if (!existsSync(manifestPath)) {
    return { ok: false, cliPath: null, reason_code: 'global-package-manifest-missing' };
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (_error) {
    return { ok: false, cliPath: null, reason_code: 'global-package-manifest-invalid' };
  }
  if (!manifest || manifest.name !== PACKAGE_NAME) {
    return { ok: false, cliPath: null, reason_code: 'global-package-identity-mismatch' };
  }
  const binEntry = typeof manifest.bin === 'string'
    ? manifest.bin
    : manifest.bin && typeof manifest.bin === 'object'
      ? manifest.bin[PACKAGE_NAME]
      : null;
  if (typeof binEntry !== 'string' || !binEntry || path.isAbsolute(binEntry) || path.win32.isAbsolute(binEntry)) {
    return { ok: false, cliPath: null, reason_code: 'global-package-bin-invalid' };
  }
  const cliPath = path.resolve(packageRoot, binEntry);
  if (!isPathWithin(packageRoot, cliPath)) {
    return { ok: false, cliPath: null, reason_code: 'global-package-bin-outside-package' };
  }
  try {
    if (!statSync(cliPath).isFile()) {
      return { ok: false, cliPath: null, reason_code: 'global-package-bin-not-file' };
    }
  } catch (_error) {
    return { ok: false, cliPath: null, reason_code: 'global-package-bin-missing' };
  }
  return {
    ok: true,
    cliPath,
    globalRoot: path.resolve(globalRoot),
    reason_code: 'global-package-cli-resolved',
  };
}

function isPathWithin(root, candidate) {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function resolveRuntimeRefreshCommand(cwd = process.cwd()) {
  const root = path.resolve(cwd);
  // 必须用 findGitRoot 的返回值:从子目录执行时 cwd 不是 repo root,platform detection 会一律为空并
  // 静默回落到 `init -y` 默认宿主,反而制造本步骤要修的 drift。
  const gitRoot = findGitRoot(root);
  if (gitRoot) {
    return {
      args: buildRuntimeRefreshArgs(gitRoot),
      cwd: gitRoot,
      reason_code: 'single-git-repo',
    };
  }

  const childRepos = discoverChildGitRepos(root);
  if (childRepos.length > 0) {
    // 父 workspace 自身装了 host runtime 时按父范围刷新;否则回落到 child host 驱动的 --all-repos。
    const parentPlatforms = detectInstalledRuntimePlatforms(root);
    const parentHasOwnHostState = parentPlatforms.length > 0;
    const childPlatforms = detectInstalledRuntimePlatformsInRoots(childRepos.map((repo) => repo.git_root));
    return {
      args: parentHasOwnHostState || childPlatforms.length === 0
        ? buildRuntimeRefreshArgsForPlatforms(parentPlatforms)
        : buildRuntimeRefreshArgsForPlatforms(childPlatforms, ['--all-repos']),
      cwd: root,
      reason_code: 'parent-workspace',
      child_repo_count: childRepos.length,
    };
  }

  return {
    args: null,
    cwd: root,
    reason_code: 'scope-undetermined',
  };
}

function buildRuntimeRefreshArgs(root) {
  const platforms = detectInstalledRuntimePlatforms(root);
  return buildRuntimeRefreshArgsForPlatforms(platforms);
}

function buildRuntimeRefreshArgsForPlatforms(platforms, targetArgs = []) {
  if (platforms.length === 0) {
    return ['init', ...targetArgs, '-y'];
  }
  return ['init', ...platforms.map((platform) => `--${platform}`), ...targetArgs, '-y'];
}

function detectInstalledRuntimePlatforms(root) {
  return detectInstalledRuntimePlatformsInRoots([root]);
}

function detectInstalledRuntimePlatformsInRoots(roots) {
  const installed = new Set();
  for (const root of roots) {
    for (const platform of getSupportedPlatforms()) {
      const adapter = getAdapter(platform);
      if (fs.existsSync(path.join(root, adapter.stateFile))) {
        installed.add(platform);
      }
    }
  }
  return getSupportedPlatforms()
    .filter((platform) => installed.has(platform));
}

function printRuntimeRefreshFallback(refresh = {}) {
  const args = Array.isArray(refresh.args) ? refresh.args : null;
  const singleArgs = args && args.length > 0 ? stripInitTargetArgs(args) : ['init', '-y'];
  const parentArgs = args && args.length > 0 ? args : ['init', '-y'];
  const childArgs = args && args.length > 0
    ? insertInitTargetArgs(stripInitTargetArgs(args), ['--repo', '<path>'])
    : ['init', '--repo', '<path>', '-y'];
  console.error('Fallback commands:');
  console.error(`  Single repo: ${formatSpecFirstCommand(withDeveloperPlaceholder(singleArgs))}`);
  console.error(`  Parent workspace: ${formatSpecFirstCommand(withDeveloperPlaceholder(parentArgs))}`);
  console.error(`  Child repo: ${formatSpecFirstCommand(withDeveloperPlaceholder(childArgs))}`);
}

function stripInitTargetArgs(args) {
  const output = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--all-repos') {
      continue;
    }
    if (arg === '--repo') {
      index += 1;
      continue;
    }
    if (arg.startsWith('--repo=')) {
      continue;
    }
    output.push(arg);
  }
  return output;
}

function insertInitTargetArgs(args, targetArgs) {
  const output = [...args];
  const yesIndex = output.findIndex((arg) => arg === '-y' || arg === '--yes');
  const insertAt = yesIndex >= 0 ? yesIndex : output.length;
  output.splice(insertAt, 0, ...targetArgs);
  return output;
}

function withDeveloperPlaceholder(args) {
  if (!Array.isArray(args)) return ['init', '-y', '-u', '<name>'];
  if (args.includes('-u') || args.includes('--user')) return args;
  const output = [...args];
  const yesIndex = output.findIndex((arg) => arg === '-y' || arg === '--yes');
  const insertAt = yesIndex >= 0 ? yesIndex + 1 : output.length;
  output.splice(insertAt, 0, '-u', '<name>');
  return output;
}

function formatSpecFirstCommand(args) {
  return `spec-first ${args.join(' ')}`;
}

function printHelp() {
  console.log([
    '🔄 spec-first update — upgrade the spec-first CLI package',
    '',
    `Runs \`${UPGRADE_COMMAND}\` to upgrade the globally installed spec-first CLI,`,
    'then runs a fresh `spec-first init` subprocess to refresh this project\'s runtime assets.',
    'If refresh cannot run safely, it prints copy-ready fallback init commands.',
    '',
    '📘 Usage:',
    '  spec-first update',
    '',
    '⚙️  Options:',
    '  -h, --help      Show help',
    '',
    '🔢 Exit codes:',
    '  0  upgrade succeeded and runtime refresh completed, or refresh was skipped with fallback guidance',
    '  1  upgrade failed or automatic runtime refresh failed',
    '  2  usage error (unexpected argument)',
    '',
    'Note: this upgrades the npm-installed spec-first package. If you use spec-first as a',
    'Claude Code plugin, upgrade it with `claude plugin update` inside Claude Code instead —',
    'npm -g manages a separate copy.',
    '',
    'Per-requirement multi-repo graphs are not rebuilt by `update`. After upgrading, re-run',
    '`spec-runtime-setup --only codegraph,graphify --workspace-graph` from the requirement folder',
    'to rebuild graphs, or `spec-first clean --workspace-graph` to remove managed graph assets.',
    '',
    '🔗 Repository:',
    '  https://github.com/sunrain520/spec-first',
  ].join('\n'));
}

module.exports = {
  buildRuntimeRefreshArgs,
  detectInstalledRuntimePlatforms,
  insertInitTargetArgs,
  readInstalledVersion,
  resolveInstalledCliPath,
  resolvePackageCliFromGlobalRoot,
  resolveRuntimeRefreshCommand,
  runUpdate,
  stripInitTargetArgs,
  withDeveloperPlaceholder,
};
