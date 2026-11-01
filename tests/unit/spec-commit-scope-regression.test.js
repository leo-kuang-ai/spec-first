'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

test('canonical argv commit recipe preserves literal messages and unrelated staged content', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-commit-scope-'));
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-commit-message-'));
  const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.toUpperCase().startsWith('GIT_'))),
    HOME: scratch, USERPROFILE: scratch, GIT_CONFIG_NOSYSTEM: '1' };
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
    const recipe = source.match(/```text\n(git add -- file1[\s\S]*?)```/)[1].trim().split('\n');
    const message = 'fix(fixture): preserve literal message (U3)\n\nKeep `$HOME`, $(touch injected), "double" and \'single\' quotes literal.\n\nSecond paragraph.\n';
    const messagePath = path.join(scratch, 'message with spaces.txt');
    fs.writeFileSync(messagePath, message, { mode: 0o600 });
    for (const line of recipe) {
      const [program, ...args] = line.split(' ');
      const result = spawnSync(program, args.map((arg) => arg === '<message-file>' ? messagePath : arg),
        { cwd: dir, env, encoding: 'utf8' });
      expect(result.status).toBe(0);
    }
    expect(git('diff-tree', '--no-commit-id', '--name-only', '-r', 'HEAD').trim().split('\n')).toEqual(['file1', 'file2', 'file3']);
    expect(git('diff', '--cached', '--name-only')).toBe('unrelated.txt\n');
    expect(fs.readFileSync(path.join(dir, 'unrelated.txt'), 'utf8')).toBe('unrelated.txt\n');
    expect(git('log', '-1', '--format=%B').trim()).toBe(message.trim());
    expect(fs.existsSync(path.join(dir, 'injected'))).toBe(false);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(scratch, { recursive: true, force: true });
  }
});
