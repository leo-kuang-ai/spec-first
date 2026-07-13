#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const DEFAULT_TEST_COMMAND_TIMEOUT_MS = 15 * 60 * 1000;
const MCP_SETUP_TEST_PATHS = Object.freeze([
  'tests/unit/host-runtime-projection-contracts.test.js',
  'tests/unit/mcp-setup-config-consumers.test.js',
  'tests/unit/mcp-setup-contracts.test.js',
  'tests/unit/mcp-setup-entrypoint.test.js',
  'tests/unit/mcp-setup-facts-renderer.test.js',
  'tests/unit/mcp-setup-host-config.test.js',
  'tests/unit/mcp-setup-mode-target.test.js',
  'tests/unit/mcp-setup-node-contracts.test.js',
  'tests/unit/mcp-setup-powershell-contracts.test.js',
  'tests/unit/mcp-setup-preflight.test.js',
  'tests/unit/mcp-setup-process-runner.test.js',
  'tests/unit/mcp-setup-project-config.test.js',
  'tests/unit/mcp-setup-providers.test.js',
  'tests/unit/mcp-setup-registry.test.js',
  'tests/unit/mcp-setup-workspace-git-exclude.test.js',
  'tests/unit/mcp-setup-workspace-graph-build.test.js',
  'tests/unit/mcp-setup-workspace-graph-clean.test.js',
  'tests/unit/mcp-setup-workspace-graph-entry.test.js',
  'tests/unit/mcp-setup-workspace-graph-executor.test.js',
  'tests/unit/mcp-setup-workspace-graph-refresh.test.js',
  'tests/unit/mcp-setup-workspace-graph-scope.test.js',
  'tests/unit/mcp-setup-workspace-graph-status.test.js',
  'tests/unit/mcp-setup-workspace-parent-diagnostic.test.js',
  'tests/unit/mcp-setup-workspace-provider-runners.test.js',
  'tests/unit/mcp-setup-workspace-routing-inject.test.js',
  'tests/unit/mcp-setup-workspace-routing-instruction.test.js',
  'tests/unit/mcp-setup-workspace-target.test.js',
  'tests/unit/plugin-modules.test.js',
]);

function resolveTestCommandTimeoutMs(env = process.env) {
  const raw = env.SPEC_FIRST_TEST_COMMAND_TIMEOUT_MS;
  const value = Number.parseInt(raw || '', 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_TEST_COMMAND_TIMEOUT_MS;
}

function run(command, args, options = {}) {
  const timeout = Number.isFinite(options.timeout) && options.timeout > 0
    ? options.timeout
    : resolveTestCommandTimeoutMs(options.env || process.env);
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    env: options.env || process.env,
    encoding: 'utf8',
    shell: false,
    stdio: options.stdio || 'inherit',
    timeout,
    windowsHide: true,
  });

  const rendered = [command, ...args].join(' ');
  if (result.error && result.error.code === 'ETIMEDOUT') {
    const error = new Error(`${rendered} 在 ${timeout}ms 后超时`);
    error.status = 124;
    throw error;
  }
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const error = new Error(`${rendered} 失败，状态为 ${result.status}`);
    error.status = result.status || 1;
    throw error;
  }
}

function runNode(args, options = {}) {
  run(process.execPath, args, options);
}

function runJest(args) {
  const jestBin = path.join(repoRoot, 'node_modules', 'jest', 'bin', 'jest.js');
  if (!fs.existsSync(jestBin)) {
    throw new Error('未安装 Jest。请先运行 npm ci，再执行测试。');
  }
  runNode([jestBin, ...args]);
}

function assertTestPathsExist(testPaths) {
  const missing = testPaths.filter((testPath) => !fs.existsSync(path.join(repoRoot, testPath)));
  if (missing.length > 0) {
    const error = new Error(`声明的测试路径不存在：${missing.join(', ')}`);
    error.status = 1;
    throw error;
  }
}

function runJestFiles(testPaths, extraArgs = []) {
  assertTestPathsExist(testPaths);
  runJest([...testPaths, ...extraArgs]);
}

function runUnit() {
  runJest(['tests/unit', '--runInBand']);
}

function runMcpSetup() {
  runJestFiles(MCP_SETUP_TEST_PATHS, ['--runInBand']);
}

function runSmoke() {
  runJestFiles(['tests/smoke/cli-smoke.test.js'], ['--runInBand']);
}

function runIntegration() {
  runJestFiles([
    'tests/integration/qoder-runtime-lifecycle.integration.test.js',
    'tests/integration/init-five-host-lifecycle.integration.test.js',
    'tests/integration/workspace-graph-lifecycle.integration.test.js',
    'tests/integration/workspace-graph-five-host-projection.integration.test.js',
  ], ['--runInBand']);
}

function runReleaseGovernance() {
  runNode(['scripts/check-release-continuity.cjs']);
}

function runRelease() {
  runReleaseGovernance();
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['pack', '--dry-run']);
}

function runAll() {
  runUnit();
  runSmoke();
  runIntegration();
}

function main() {
  const suite = process.argv[2] || 'all';
  const suites = {
    all: runAll,
    unit: runUnit,
    'mcp-setup': runMcpSetup,
    smoke: runSmoke,
    integration: runIntegration,
    release: runRelease,
    'release-governance': runReleaseGovernance,
  };

  if (!suites[suite]) {
    console.error(`未知测试 suite：${suite}`);
    console.error(`可用 suite：${Object.keys(suites).join(', ')}`);
    return 2;
  }

  try {
    suites[suite]();
    return 0;
  } catch (error) {
    console.error(error && error.stack ? error.stack : String(error));
    return Number.isInteger(error && error.status) ? error.status : 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  DEFAULT_TEST_COMMAND_TIMEOUT_MS,
  MCP_SETUP_TEST_PATHS,
  main,
  run,
  assertTestPathsExist,
  runJest,
  resolveTestCommandTimeoutMs,
  runJestFiles,
};
