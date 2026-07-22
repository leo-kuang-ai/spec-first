#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { getEnvValue, runNpmChecked } = require('./lib/npm-cli.cjs');

const repoRoot = path.resolve(__dirname, '..');

function parsePackResult(stdout) {
  const payload = JSON.parse(String(stdout || ''));
  if (!Array.isArray(payload) || !payload[0] || typeof payload[0].filename !== 'string') {
    throw new Error('npm pack --json 返回了无效结果。');
  }
  return payload[0];
}

function quoteCmdArg(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function buildCmdCommandLine(command, args) {
  return ['call', quoteCmdArg(command), ...args.map(quoteCmdArg)].join(' ');
}

function runChecked(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: options.env || process.env,
    stdio: options.stdio || 'pipe',
    windowsHide: true,
    windowsVerbatimArguments: options.windowsVerbatimArguments,
  });
  if (result.error || result.status !== 0) {
    const detail = String(result.stderr || result.stdout || (result.error && result.error.message) || '').trim();
    throw new Error(`${command} ${args.join(' ')} 运行失败${detail ? `: ${detail}` : ''}`);
  }
  return result;
}

function runInstalledShim(shimPath) {
  if (process.platform === 'win32') {
    const comspec = getEnvValue(process.env, 'ComSpec') || 'cmd.exe';
    return runChecked(comspec, ['/d', '/c', buildCmdCommandLine(shimPath, ['--help'])], {
      windowsVerbatimArguments: true,
    });
  }
  return runChecked(shimPath, ['--help']);
}

function writeSummary(summary) {
  const outputDir = process.env.SPEC_FIRST_SMOKE_ARTIFACT_DIR;
  if (!outputDir) return;
  const absolute = path.resolve(outputDir);
  fs.mkdirSync(absolute, { recursive: true });
  fs.writeFileSync(path.join(absolute, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
}

function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-npm-install-'));
  const packDir = path.join(tempRoot, 'pack');
  const prefix = path.join(tempRoot, 'prefix');
  fs.mkdirSync(packDir, { recursive: true });

  try {
    const pack = runNpmChecked(['pack', '--json', '--pack-destination', packDir], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    const packResult = parsePackResult(pack.stdout);
    const tarball = path.join(packDir, packResult.filename);
    if (!fs.existsSync(tarball)) throw new Error(`npm pack 未生成 tarball：${tarball}`);

    runNpmChecked(['install', '--global', '--prefix', prefix, tarball], {
      cwd: repoRoot,
      stdio: 'inherit',
    });
    const globalRootResult = runNpmChecked(['root', '--global', '--prefix', prefix], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    const installedRoot = path.join(String(globalRootResult.stdout || '').trim(), packResult.name);
    const installedCli = path.join(installedRoot, 'bin', 'spec-first.js');
    if (!fs.existsSync(installedCli)) throw new Error(`安装包缺少 CLI：${installedCli}`);
    runChecked(process.execPath, [installedCli, '--help']);

    const shimPath = process.platform === 'win32'
      ? path.join(prefix, 'spec-first.cmd')
      : path.join(prefix, 'bin', 'spec-first');
    if (!fs.existsSync(shimPath)) throw new Error(`全局安装缺少 shim：${shimPath}`);
    runInstalledShim(shimPath);

    writeSummary({
      schema_version: 'npm-install-matrix-smoke.v1',
      status: 'passed',
      os: process.platform,
      arch: process.arch,
      node: process.version,
      package: `${packResult.name}@${packResult.version}`,
      checks: ['pack', 'global-install', 'direct-cli-help', 'installed-shim-help'],
    });
    console.log(`npm install matrix smoke passed: ${packResult.name}@${packResult.version} ${process.platform} ${process.version}`);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    writeSummary({
      schema_version: 'npm-install-matrix-smoke.v1',
      status: 'failed',
      os: process.platform,
      arch: process.arch,
      node: process.version,
      reason: error.message,
    });
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  buildCmdCommandLine,
  main,
  parsePackResult,
  quoteCmdArg,
  runInstalledShim,
};
