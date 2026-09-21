'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const read = (filePath) => fs.readFileSync(filePath, 'utf8');

describe('spec-commit-push-pr context reference contract', () => {
  test('checkout collision 的默认恢复保留混合暂存、无关文件和未跟踪文件', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-branch-collision-'));
    const git = (...args) => {
      const result = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', ...args], { cwd: root, encoding: 'utf8' });
      if (result.status !== 0) throw new Error(result.stderr);
      return result.stdout;
    };
    try {
      git('init', '-q', '-b', 'main');
      git('config', 'user.name', 'Fixture');
      git('config', 'user.email', 'fixture@example.invalid');
      const lines = Array.from({ length: 30 }, (_, i) => `line ${i}`);
      const writeShared = () => fs.writeFileSync(path.join(root, 'shared.txt'), `${lines.join('\n')}\n`);
      writeShared();
      fs.writeFileSync(path.join(root, 'unrelated.txt'), 'original\n');
      git('add', '.');
      git('commit', '-qm', 'base');
      git('checkout', '-qb', 'target');
      lines[0] = 'remote base'; writeShared(); git('commit', '-qam', 'target');
      git('checkout', '-q', 'main');
      lines[0] = 'line 0'; lines[27] = 'staged own edit'; writeShared(); git('add', 'shared.txt');
      lines[29] = 'unstaged own edit'; writeShared();
      fs.writeFileSync(path.join(root, 'unrelated.txt'), 'user staged\n'); git('add', 'unrelated.txt');
      fs.writeFileSync(path.join(root, 'new.txt'), 'user untracked\n');
      const snapshot = () => ({
        branch: git('branch', '--show-current'),
        index: git('diff', '--cached', '--binary'),
        worktree: git('diff', '--binary'),
        untracked: read(path.join(root, 'new.txt')),
        stash: git('stash', 'list'),
      });
      const before = snapshot();
      const checkout = spawnSync('git', ['checkout', '-b', 'feature', 'target'], { cwd: root, encoding: 'utf8' });
      expect(checkout.status).not.toBe(0);
      expect(checkout.stderr).toContain('would be overwritten');
      const doc = read('skills/spec-commit-push-pr/references/branch-creation.md');
      const recovery = doc.split('**Checkout fails because uncommitted changes would be overwritten:**')[1].split('## Fetch Failure Fallback')[0];
      for (const block of recovery.matchAll(/```bash\n([\s\S]*?)```/g)) {
        const result = spawnSync('bash', ['-e', '-c', block[1]], {
          cwd: root, encoding: 'utf8', env: { ...process.env, BRANCH_NAME: 'feature', BASE_REF: 'target' },
        });
        expect(result.status).toBe(0);
      }
      expect(snapshot()).toEqual(before);
      expect(recovery).toContain('return blocked');
      expect(recovery).not.toMatch(/git stash (push|pop)/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('keeps context probes and consequential rechecks in a required-read reference', () => {
    const skill = read('skills/spec-commit-push-pr/SKILL.md');
    const context = read('skills/spec-commit-push-pr/references/context.md');
    const commit = read('skills/spec-commit-push-pr/references/commit-and-push.md');
    const compose = read('skills/spec-commit-push-pr/references/compose.md');

    expect(skill).toContain('Read `references/context.md` before Step 1');
    expect(skill).toContain('Read `references/commit-and-push.md`');
    expect(skill).toContain('`references/compose.md`');
    expect(context).toContain('exit-0 `[]` means none; non-zero is unknown');
    expect(context).toContain('Pass the branch name only');
    expect(context.toLowerCase()).toContain('re-check the live branch');
    expect(commit).toContain('Never use `git add -A` or `git add .`');
    expect(commit).toContain('commit_authorization: authorized');
    expect(compose).toContain('Classify evidence by runtime purpose');
    expect(compose).toContain('`--body-file`');
  });

  test('requires apply-time identity, body read-back, and scoped commit semantics', () => {
    const skill = read('skills/spec-commit-push-pr/SKILL.md');
    const context = read('skills/spec-commit-push-pr/references/context.md');
    const commit = read('skills/spec-commit-push-pr/references/commit-and-push.md');
    const apply = read('skills/spec-commit-push-pr/references/apply-and-handoff.md');
    expect(skill).toContain('Read `references/apply-and-handoff.md` before any PR or archive write');
    expect(context).toContain('Do not take index 0');
    expect(context).toContain('do not assume `main`');
    expect(commit).toMatch(/does not preserve hunk\s+selection/);
    expect(commit).toContain('git commit -F <message-file> -- <owned-file-1> <owned-file-2>');
    expect(apply).toContain('Non-zero, malformed, or ambiguous results block creation');
    expect(apply).toContain('Identical content is a no-op');
    expect(apply).toContain('verify that the remote title/body match the intended content');
    expect(apply).toContain('query the\nPR state before any retry');
    expect(apply).toContain('`spec-explain` skill and the concept as input');
    expect(apply).toContain('do not invent a command entrypoint for a standalone skill');
  });
});
