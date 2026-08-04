'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function getEnvValue(env, name) {
  if (!env || typeof env !== 'object') return '';
  if (Object.prototype.hasOwnProperty.call(env, name)) return String(env[name] || '');
  const matched = Object.keys(env).find((key) => key.toLowerCase() === name.toLowerCase());
  return matched ? String(env[matched] || '') : '';
}

function selectPathApi(filePath) {
  const value = String(filePath || '');
  return /^[A-Za-z]:[\\/]/.test(value) || value.includes('\\') ? path.win32 : path;
}

function resolveNpmCliPath(options = {}) {
  const env = options.env || process.env;
  const execPath = options.execPath || process.execPath;
  const existsSync = options.existsSync || fs.existsSync;
  const pathApi = selectPathApi(execPath);
  const nodeDir = pathApi.dirname(execPath);
  const envExecPath = getEnvValue(env, 'npm_execpath');
  const candidates = [];

  if (envExecPath && pathApi.basename(envExecPath).toLowerCase() === 'npm-cli.js') {
    candidates.push(envExecPath);
  }
  candidates.push(
    pathApi.join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    pathApi.join(nodeDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
    pathApi.join(nodeDir, '..', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
  );

  return [...new Set(candidates)].find((candidate) => existsSync(candidate)) || '';
}

function runNpm(args, options = {}) {
  const npmCliPath = resolveNpmCliPath(options);
  if (!npmCliPath) {
    const error = new Error('无法定位 npm CLI JavaScript 入口；拒绝通过 shell 或 npm.cmd 猜测执行。');
    error.status = 1;
    throw error;
  }
  const spawn = options.spawnSync || spawnSync;
  return spawn(options.execPath || process.execPath, [npmCliPath, ...args], {
    cwd: options.cwd,
    encoding: options.encoding,
    env: options.env || process.env,
    input: options.input,
    maxBuffer: options.maxBuffer,
    stdio: options.stdio || 'pipe',
    windowsHide: true,
  });
}

function runNpmChecked(args, options = {}) {
  const result = runNpm(args, options);
  if (result.error) {
    const error = new Error(`npm ${args.join(' ')} 运行失败: ${result.error.message}`);
    error.status = 1;
    throw error;
  }
  if (result.status !== 0) {
    const detail = String(result.stderr || result.stdout || '').trim();
    const error = new Error(`npm ${args.join(' ')} 运行失败${detail ? `: ${detail}` : ''}`);
    error.status = Number.isInteger(result.status) ? result.status : 1;
    throw error;
  }
  return result;
}

module.exports = {
  getEnvValue,
  resolveNpmCliPath,
  runNpm,
  runNpmChecked,
  selectPathApi,
};
