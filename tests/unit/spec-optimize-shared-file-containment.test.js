'use strict';

// 回归测试：SUP-02 - 优化实验共享文件复制在 containment 校验前创建目录
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:145-152

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const scriptPath = path.join(__dirname, '../../skills/spec-optimize/scripts/experiment-worktree.sh');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sup02-'));
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
  fs.writeFileSync(path.join(root, 'baseline.txt'), 'baseline\n');
  git(root, ['add', 'baseline.txt']);
  git(root, ['commit', '-m', 'baseline']);
}

function runCreate(root, sharedFiles) {
  return spawnSync('bash', [scriptPath, 'create', 'review', '1', 'HEAD', ...sharedFiles], {
    cwd: root,
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, HOME: root },
  });
}

describe('Experiment worktree shared file containment — SUP-02', () => {
  test('拒绝越界 shared_file 时不在外部目录创建路径', () => {
    const root = tmpDir();
    const outsideDir = tmpDir();

    try {
      setupRepo(root);

      // 基线提交：shared 是指向外部目录的符号链接
      fs.symlinkSync(outsideDir, path.join(root, 'shared'));
      git(root, ['add', '-f', 'shared']);
      git(root, ['commit', '-m', 'shared symlink baseline']);

      // 当前源树：shared 是真实目录，包含嵌套文件（可复制源）
      fs.rmSync(path.join(root, 'shared'));
      fs.mkdirSync(path.join(root, 'shared', 'nested'), { recursive: true });
      fs.writeFileSync(path.join(root, 'shared', 'nested', 'data.txt'), 'current data\n');

      // 外部目录初始为空
      expect(fs.readdirSync(outsideDir)).toEqual([]);

      // 实验 worktree 从基线创建，仍保留符号链接，shared/nested 解析到外部
      const result = runCreate(root, ['shared/nested/data.txt']);

      // 应失败并给出 containment 拒绝，而不是 node 堆栈
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/destination resolves outside experiment worktree/);
      expect(result.stderr).not.toMatch(/node:fs|at Object/);

      // 外部目录完全未被修改（不应出现 nested/）
      expect(fs.readdirSync(outsideDir)).toEqual([]);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(outsideDir, { recursive: true, force: true });
    }
  });

  test('允许合法边界内的 shared_file 复制', () => {
    const root = tmpDir();

    try {
      setupRepo(root);

      // 当前源树：shared 是真实目录（基线不含 shared，worktree 内可自由创建）
      fs.mkdirSync(path.join(root, 'shared', 'nested'), { recursive: true });
      fs.writeFileSync(path.join(root, 'shared', 'nested', 'data.txt'), 'current data\n');

      const result = runCreate(root, ['shared/nested/data.txt']);

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/\.worktrees\/optimize-review-exp-001/);

      const worktreePath = path.join(root, '.worktrees', 'optimize-review-exp-001');
      expect(fs.existsSync(worktreePath)).toBe(true);

      const copiedFile = path.join(worktreePath, 'shared', 'nested', 'data.txt');
      expect(fs.existsSync(copiedFile)).toBe(true);
      expect(fs.readFileSync(copiedFile, 'utf8')).toBe('current data\n');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('拒绝相对路径逃逸的 shared_file 且不产生外部副作用', () => {
    const root = tmpDir();
    const outsideDir = tmpDir();

    try {
      setupRepo(root);
      fs.mkdirSync(path.join(root, 'shared'));
      fs.writeFileSync(path.join(root, 'shared', 'data.txt'), 'test\n');

      const outsideTarget = path.join(outsideDir, 'escaped');
      fs.mkdirSync(outsideTarget);
      const initialCount = fs.readdirSync(outsideTarget).length;

      const escapePath = `../../../${path.relative('/', outsideTarget)}/evil.txt`;
      const result = runCreate(root, [escapePath]);

      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/repo-relative path|outside|escape/i);
      expect(fs.readdirSync(outsideTarget).length).toBe(initialCount);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
      fs.rmSync(outsideDir, { recursive: true, force: true });
    }
  });
});
