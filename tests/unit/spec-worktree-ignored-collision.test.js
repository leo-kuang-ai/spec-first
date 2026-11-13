'use strict';

// 回归测试：SUP-01 - linked worktree 原地切换覆盖被忽略文件
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:134-143

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const scriptPath = path.join(__dirname, '../../skills/spec-worktree/scripts/worktree-manager.sh');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sup01-'));
}

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed in ${cwd}: ${result.stderr}`);
  }
  return result.stdout.trim();
}

function setupRepo(root) {
  git(root, ['init', '-b', 'main']);
  git(root, ['config', 'user.name', 'test']);
  git(root, ['config', 'user.email', 'test@test']);
}

// 根工作区停在 scratch 分支，把 main 留给 linked worktree 独占检出。
function checkoutScratchInRoot(root) {
  git(root, ['checkout', '-b', 'scratch']);
}

function runIsolate(repoDir, targetRef) {
  const result = spawnSync('bash', [scriptPath, 'isolate', targetRef], {
    cwd: repoDir,
    encoding: 'utf8',
    timeout: 10000,
    env: { ...process.env, HOME: repoDir },
  });

  return {
    exitCode: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

describe('Worktree ignored file collision protection — SUP-01', () => {
  test('拒绝原地切换会覆盖被忽略本地文件的分支', () => {
    const root = tmpDir();
    try {
      setupRepo(root);

      // main：.gitignore 忽略 collision.txt
      fs.writeFileSync(path.join(root, '.gitignore'), 'collision.txt\n');
      fs.writeFileSync(path.join(root, 'main.txt'), 'main content\n');
      git(root, ['add', '.gitignore', 'main.txt']);
      git(root, ['commit', '-m', 'main']);

      // target：用 -f 跟踪 collision.txt
      git(root, ['checkout', '-b', 'target']);
      fs.writeFileSync(path.join(root, 'collision.txt'), 'target tracked\n');
      git(root, ['add', '-f', 'collision.txt']);
      git(root, ['commit', '-m', 'target with collision']);

      checkoutScratchInRoot(root);

      const worktreeDir = path.join(root, '.spec-first-worktrees', 'worker');
      git(root, ['worktree', 'add', worktreeDir, 'main']);

      // 在 worktree 中写入被忽略的本地文件
      const collisionPath = path.join(worktreeDir, 'collision.txt');
      fs.writeFileSync(collisionPath, 'user ignored content\n');

      const result = runIsolate(worktreeDir, 'target');

      // 应该失败，保护本地内容
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr + result.stdout).toMatch(/would be overwritten|not overwritten|overwrite/i);

      // 验证本地文件未被覆盖
      expect(fs.readFileSync(collisionPath, 'utf8')).toBe('user ignored content\n');

      // 验证分支未切换
      expect(git(worktreeDir, ['branch', '--show-current'])).toBe('main');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('允许原地切换到不会覆盖被忽略文件的分支', () => {
    const root = tmpDir();
    try {
      setupRepo(root);

      fs.writeFileSync(path.join(root, '.gitignore'), 'local.txt\n');
      fs.writeFileSync(path.join(root, 'main.txt'), 'main\n');
      git(root, ['add', '.gitignore', 'main.txt']);
      git(root, ['commit', '-m', 'main']);

      // target 不跟踪 local.txt
      git(root, ['checkout', '-b', 'target']);
      fs.writeFileSync(path.join(root, 'target.txt'), 'target\n');
      git(root, ['add', 'target.txt']);
      git(root, ['commit', '-m', 'target']);

      checkoutScratchInRoot(root);

      const worktreeDir = path.join(root, '.spec-first-worktrees', 'worker');
      git(root, ['worktree', 'add', worktreeDir, 'main']);

      const localPath = path.join(worktreeDir, 'local.txt');
      fs.writeFileSync(localPath, 'user local content\n');

      const result = runIsolate(worktreeDir, 'target');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Worktree ready');

      // 本地被忽略文件仍然存在且未被修改
      expect(fs.readFileSync(localPath, 'utf8')).toBe('user local content\n');

      expect(git(worktreeDir, ['branch', '--show-current'])).toBe('target');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('保护 detached HEAD 原地切换时的被忽略文件', () => {
    const root = tmpDir();
    try {
      setupRepo(root);

      fs.writeFileSync(path.join(root, '.gitignore'), 'local.txt\n');
      fs.writeFileSync(path.join(root, 'main.txt'), 'main\n');
      git(root, ['add', '.gitignore', 'main.txt']);
      git(root, ['commit', '-m', 'main']);

      // feature：跟踪 local.txt
      git(root, ['checkout', '-b', 'feature']);
      fs.writeFileSync(path.join(root, 'local.txt'), 'tracked in feature\n');
      git(root, ['add', '-f', 'local.txt']);
      git(root, ['commit', '-m', 'feature tracks local.txt']);
      const featureCommit = git(root, ['rev-parse', 'HEAD']);

      checkoutScratchInRoot(root);

      const worktreeDir = path.join(root, '.spec-first-worktrees', 'worker');
      git(root, ['worktree', 'add', worktreeDir, 'main']);

      const localPath = path.join(worktreeDir, 'local.txt');
      fs.writeFileSync(localPath, 'user local content\n');

      const result = runIsolate(worktreeDir, featureCommit);

      expect(result.exitCode).not.toBe(0);
      expect(fs.readFileSync(localPath, 'utf8')).toBe('user local content\n');

      // 未进入 detached HEAD，仍在 main
      expect(git(worktreeDir, ['branch', '--show-current'])).toBe('main');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
