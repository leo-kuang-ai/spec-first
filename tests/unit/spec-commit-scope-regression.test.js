'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

test('canonical commit recipe preserves unrelated staged content outside the commit', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-commit-scope-'));
  const env = { ...process.env, GIT_CONFIG_GLOBAL: path.join(dir, 'no-global-config'), GIT_CONFIG_NOSYSTEM: '1' };
  const git = (...args) => execFileSync('git', args, { cwd: dir, env, encoding: 'utf8' });
  try {
    git('init', '-q');
    git('config', 'user.name', 'Fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    git('config', 'commit.gpgsign', 'false');
    git('commit', '--allow-empty', '-m', 'baseline');
    for (const file of ['file1', 'file2', 'file3', 'unrelated.txt']) fs.writeFileSync(path.join(dir, file), `${file}\n`);
    git('add', '--', 'unrelated.txt');
    const source = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-commit/SKILL.md'), 'utf8');
    const recipe = source.match(/```bash\n(COMMIT_MSG=[\s\S]*?)```/)[1];
    const result = spawnSync('bash', ['-eu', '-c', recipe], { cwd: dir, env: { ...env, TMPDIR: dir }, encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(git('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD').trim().split('\n')).toEqual(['file1', 'file2', 'file3']);
    expect(git('diff', '--cached', '--name-only')).toBe('unrelated.txt\n');
    expect(fs.readFileSync(path.join(dir, 'unrelated.txt'), 'utf8')).toBe('unrelated.txt\n');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
