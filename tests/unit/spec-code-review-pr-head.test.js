'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

describe('PR 审查 head 身份绑定', () => {
  test.each(['fork', 'same-repo', 'mismatch'])('%s 只使用与 metadata 一致的 PR head', (scenario) => {
    const doc = fs.readFileSync('skills/spec-code-review/references/scope.md', 'utf8');
    const block = [...doc.matchAll(/```bash\n([\s\S]*?)```/g)].map((m) => m[1]).find((s) => s.includes('PR_HEAD_OID'));
    expect(block).toBeDefined();
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-pr-head-'));
    const base = path.join(root, 'base');
    const review = path.join(root, 'review');
    fs.mkdirSync(base);
    const git = (cwd, ...args) => {
      const r = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8' });
      if (r.status !== 0) throw new Error(r.stderr);
      return r.stdout.trim();
    };
    try {
      git(base, 'init', '-q', '-b', 'main');
      git(base, 'config', 'user.name', 'Fixture');
      git(base, 'config', 'user.email', 'fixture@example.invalid');
      fs.writeFileSync(path.join(base, 'source.txt'), 'base\n');
      git(base, 'add', '.'); git(base, 'commit', '-qm', 'base');
      const baseSha = git(base, 'rev-parse', 'HEAD');
      git(base, 'branch', 'topic');
      git(root, 'clone', '-q', base, review);
      fs.writeFileSync(path.join(base, 'source.txt'), 'PR head\n');
      git(base, 'commit', '-qam', 'PR head');
      const headSha = git(base, 'rev-parse', 'HEAD');
      git(base, 'update-ref', 'refs/pull/7/head', headSha);
      if (scenario === 'same-repo') git(base, 'update-ref', 'refs/heads/topic', headSha);
      const result = spawnSync('bash', ['-e', '-c', `${block}\nprintf '%s' "$PR_HEAD_REF"`], {
        cwd: review, encoding: 'utf8',
        env: { ...process.env, PR_NUMBER: '7', PR_REPO_URL: base, PR_HEAD_OID: scenario === 'mismatch' ? baseSha : headSha },
      });
      if (scenario === 'mismatch') {
        expect(result.status).not.toBe(0);
        expect(result.stderr).toContain('pr_head_identity_mismatch');
      } else {
        expect(result.status).toBe(0);
        expect(result.stdout).toBe(headSha);
        expect(git(review, 'show', `${result.stdout}:source.txt`)).toBe('PR head');
      }
      expect(git(review, 'rev-parse', 'HEAD')).toBe(baseSha);
      expect(fs.readFileSync(path.join(review, 'source.txt'), 'utf8')).toBe('base\n');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
