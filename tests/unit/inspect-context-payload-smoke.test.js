'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const script = path.join(repoRoot, 'skills/spec-write-skill/scripts/inspect-context.cjs');

describe('spec-write-skill payload smoke rendering', () => {
  test('renders unreadable payload manifests as a human-readable failure', () => {
    const result = spawnSync(process.execPath, [
      script,
      '--payload-smoke', 'missing-payload',
      '--runtime-file-set', 'missing-runtime-file-set.json',
    ], { cwd: repoRoot, encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Target payload smoke: fail');
    expect(result.stdout).toContain('runtime_file_set_unreadable');
  });
});
