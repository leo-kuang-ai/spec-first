'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');

describe('spec-runtime-setup cross-platform Node runner contracts', () => {
  test.each([
    ['primary entrypoint', 'setup.cjs'],
    ['compatibility shim', 'check-health'],
  ])('executes the %s with Node on Windows and POSIX', (_label, fileName) => {
    const entrypoint = path.join(repoRoot, 'skills', 'spec-runtime-setup', 'scripts', fileName);
    expect(fs.existsSync(entrypoint)).toBe(true);

    const result = spawnSync(process.execPath, [entrypoint, '--help'], {
      cwd: repoRoot,
      encoding: 'utf8',
      shell: false,
      windowsHide: true,
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      '用法：node <loaded-skill-root>/scripts/setup.cjs [options]',
    );
    expect(result.stderr).toBe('');
  });
});
