'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const probePath = path.resolve(
  __dirname,
  '../../skills/spec-promote/scripts/check-spiral-auth.cjs',
);

function fakeSpiral(stdout, stderr = '', exitCode = 0) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-promote-spiral-'));
  const executable = path.join(root, 'spiral');
  fs.writeFileSync(executable, [
    '#!/bin/sh',
    `printf '%s' '${stdout.replace(/'/g, `'"'"'`)}'`,
    `printf '%s' '${stderr.replace(/'/g, `'"'"'`)}' >&2`,
    `exit ${exitCode}`,
    '',
  ].join('\n'));
  fs.chmodSync(executable, 0o755);
  return root;
}

function runProbe(fakeBin) {
  return spawnSync(process.execPath, [probePath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${fakeBin}${path.delimiter}${process.env.PATH || ''}`,
    },
  });
}

describe('spec-promote Spiral auth probe', () => {
  test('emits only allowlisted readiness fields and contains provider secrets', () => {
    const sentinel = 'SECRET_SENTINEL_SHOULD_NOT_ESCAPE';
    const fakeBin = fakeSpiral(
      JSON.stringify({ authenticated: true, token: sentinel, nested: { raw: sentinel } }),
      sentinel,
    );

    const result = runProbe(fakeBin);
    const payload = JSON.parse(result.stdout);

    expect(result.status).toBe(0);
    expect(result.stdout).not.toContain(sentinel);
    expect(result.stderr).not.toContain(sentinel);
    expect(payload).toEqual({
      schema_version: 'spec-promote-spiral-auth-probe/v1',
      provider: 'spiral',
      status: 'ready',
      reason_code: 'spiral-authenticated',
      authenticated: true,
      command_attempted: true,
    });
    expect(fs.readdirSync(fakeBin).sort()).toEqual(['spiral']);
  });

  test('treats non-JSON and non-zero provider output as unverified without echoing it', () => {
    const sentinel = 'SECRET_SENTINEL_INVALID_OUTPUT';
    for (const [stdout, stderr, exitCode, reasonCode] of [
      [sentinel, sentinel, 0, 'spiral-auth-output-invalid'],
      ['', sentinel, 7, 'spiral-auth-command-failed'],
    ]) {
      const result = runProbe(fakeSpiral(stdout, stderr, exitCode));
      const payload = JSON.parse(result.stdout);

      expect(result.status).toBe(0);
      expect(result.stdout).not.toContain(sentinel);
      expect(result.stderr).not.toContain(sentinel);
      expect(payload.status).toBe('unverified');
      expect(payload.reason_code).toBe(reasonCode);
      expect(payload.authenticated).toBeNull();
    }
  });
});
