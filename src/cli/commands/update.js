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

const PACKAGE_NAME = pkg.name;
const UPGRADE_COMMAND = `npm install -g ${PACKAGE_NAME}@latest`;

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
  const clearVersionReminderCooldown = deps.clearVersionReminderCooldown || clearCliVersionReminderCooldown;
  const cwd = deps.cwd || process.cwd();

  console.log(`Upgrading ${PACKAGE_NAME} via: ${UPGRADE_COMMAND}`);
  console.log('');

  const result = runInstall();

  if (result && result.errorCode === 'ENOENT') {
    console.error('');
    console.error('Could not run npm: `npm` was not found on your PATH.');
    console.error('Install Node.js/npm (or run the upgrade with your own package manager), then retry.');
    return 1;
  }

  if (!result || result.status !== 0) {
    const status = result && Number.isInteger(result.status) ? result.status : 1;
    console.error('');
    console.error(`Upgrade failed (npm exited with code ${status}).`);
    console.error(`You can retry manually with: ${UPGRADE_COMMAND}`);
    return status || 1;
  }

  console.log('');
  console.log(`✅ ${PACKAGE_NAME} upgraded.`);
  const refresh = resolveRuntimeRefresh(cwd);
  if (!refresh || !Array.isArray(refresh.args)) {
    console.log('Runtime refresh: skipped (scope could not be determined safely).');
    printRuntimeRefreshFallback(refresh);
  } else {
    console.log(`Refreshing runtime assets via: ${formatSpecFirstCommand(refresh.args)}`);
    const refreshResult = runRuntimeRefresh(refresh.args, { cwd: refresh.cwd || cwd });
    if (refreshResult && refreshResult.errorCode === 'ENOENT') {
      console.error('');
      console.error('Runtime refresh: degraded (`spec-first` was not found on PATH after upgrade).');
      printRuntimeRefreshFallback(refresh);
      return 1;
    }
    if (!refreshResult || refreshResult.status !== 0) {
      const status = refreshResult && Number.isInteger(refreshResult.status) ? refreshResult.status : 1;
      console.error('');
      console.error(`Runtime refresh: degraded (spec-first init exited with code ${status}).`);
      printRuntimeRefreshFallback(refresh);
      return 1;
    }
    console.log('Runtime refresh completed.');
  }
  console.log('');
  console.log('Note: if you installed spec-first as a Claude Code plugin (not via npm -g),');
  console.log('upgrade it with `claude plugin update` instead — npm -g manages a separate copy.');
  try {
    clearVersionReminderCooldown();
  } catch {
    // 缓存清理失败不能把成功升级变成失败命令。
  }
  return 0;
}

// 默认 install 执行器:跨平台调用 npm,stdio 直通让 npm 进度直达用户。
// 返回 { status, errorCode },便于测试注入替身。
function defaultRunInstall() {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['install', '-g', `${PACKAGE_NAME}@latest`], {
    stdio: 'inherit',
    windowsHide: true,
  });
  return {
    status: result.status,
    errorCode: result.error ? result.error.code : null,
  };
}

function defaultRunRuntimeRefresh(args, options = {}) {
  const specFirstCommand = process.platform === 'win32' ? 'spec-first.cmd' : 'spec-first';
  const result = spawnSync(specFirstCommand, args, {
    cwd: options.cwd || process.cwd(),
    stdio: 'inherit',
    windowsHide: true,
  });
  return {
    status: result.status,
    errorCode: result.error ? result.error.code : null,
  };
}

function resolveRuntimeRefreshCommand(cwd = process.cwd()) {
  const root = path.resolve(cwd);
  if (findGitRoot(root)) {
    return {
      args: buildRuntimeRefreshArgs(root),
      cwd: root,
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
    '🔗 Repository:',
    '  https://github.com/sunrain520/spec-first',
  ].join('\n'));
}

module.exports = {
  buildRuntimeRefreshArgs,
  detectInstalledRuntimePlatforms,
  insertInitTargetArgs,
  resolveRuntimeRefreshCommand,
  runUpdate,
  stripInitTargetArgs,
  withDeveloperPlaceholder,
};
