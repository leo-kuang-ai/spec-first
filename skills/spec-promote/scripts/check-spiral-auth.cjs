#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');

const SCHEMA_VERSION = 'spec-promote-spiral-auth-probe/v1';
const TIMEOUT_MS = 3000;

function fact(status, reasonCode, authenticated, commandAttempted) {
  return {
    schema_version: SCHEMA_VERSION,
    provider: 'spiral',
    status,
    reason_code: reasonCode,
    authenticated,
    command_attempted: commandAttempted,
  };
}

function probeAuth(options = {}) {
  const spawn = options.spawnSync || spawnSync;
  const result = spawn('spiral', ['auth', 'status', '--json'], {
    encoding: 'utf8',
    env: options.env || process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: TIMEOUT_MS,
    windowsHide: true,
  });

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      return fact('unavailable', 'spiral-cli-unavailable', null, false);
    }
    if (result.error.code === 'ETIMEDOUT') {
      return fact('unverified', 'spiral-auth-probe-timeout', null, true);
    }
    return fact('unverified', 'spiral-auth-probe-failed', null, true);
  }
  if (result.status !== 0) {
    return fact('unverified', 'spiral-auth-command-failed', null, true);
  }

  let payload;
  try {
    payload = JSON.parse(String(result.stdout || ''));
  } catch (_error) {
    return fact('unverified', 'spiral-auth-output-invalid', null, true);
  }

  if (payload && (payload.authenticated === true || payload.status === 'authenticated')) {
    return fact('ready', 'spiral-authenticated', true, true);
  }
  if (payload && payload.authenticated === false) {
    return fact('not-ready', 'spiral-not-authenticated', false, true);
  }
  if (payload && payload.status === 'pending') {
    return fact('not-ready', 'spiral-authentication-pending', false, true);
  }
  return fact('unverified', 'spiral-auth-output-invalid', null, true);
}

function main() {
  process.stdout.write(`${JSON.stringify(probeAuth())}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  SCHEMA_VERSION,
  probeAuth,
};
