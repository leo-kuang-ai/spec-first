#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
const forcePosixOnWindows = process.env.SPEC_FIRST_FORCE_POSIX_TESTS === '1';
const DEFAULT_TEST_COMMAND_TIMEOUT_MS = 15 * 60 * 1000;

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
    const error = new Error(`${rendered} timed out after ${timeout}ms`);
    error.status = 124;
    throw error;
  }
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const error = new Error(`${rendered} failed with status ${result.status}`);
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
    throw new Error('Jest is not installed. Run npm ci before running tests.');
  }
  runNode([jestBin, ...args]);
}

function runBash(scriptPath) {
  if (isWindows && !forcePosixOnWindows) {
    console.log(`skip POSIX shell test on native Windows: ${scriptPath}`);
    return;
  }
  run('bash', [scriptPath]);
}

function runUnit() {
  runBash('tests/unit/developer.sh');
  runBash('tests/unit/lang-policy.sh');
  runMcpSetup();
  runBash('tests/unit/version-reminder.sh');
  runJest(['tests/unit', '--runInBand']);
}

function runMcpSetup() {
  if (isWindows && !forcePosixOnWindows) {
    runJest(['tests/unit/mcp-setup-powershell-contracts.test.js', '--runInBand']);
    return;
  }
  runBash('tests/unit/mcp-setup.sh');
}

function runSmoke() {
  runBash('tests/smoke/install-local.sh');
  runBash('tests/smoke/cli.sh');
}

function runIntegration() {
  runJest([
    'tests/integration/verification-gate.integration.test.js',
    'tests/integration/spec-work-closeout-producer.test.js',
    '--runInBand',
  ]);
}

function runReleaseGovernance() {
  runNode(['scripts/check-release-continuity.cjs']);
  runBash('tests/smoke/release-dual-host-governance.sh');
}

function runReleaseInstall() {
  runBash('tests/smoke/install-tarball.sh');
}

function runRelease() {
  runReleaseGovernance();
  runReleaseInstall();
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
    'release-install': runReleaseInstall,
  };

  if (!suites[suite]) {
    console.error(`Unknown test suite: ${suite}`);
    console.error(`Available suites: ${Object.keys(suites).join(', ')}`);
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
  main,
  run,
  runBash,
  runJest,
  resolveTestCommandTimeoutMs,
};
