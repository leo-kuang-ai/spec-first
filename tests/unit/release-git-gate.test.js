'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  assertPublishableGitState,
  recordReleaseCommitAndTag,
} = require('../../scripts/lib/release-git.cjs');

function runGitIn(dir, args) {
  return spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
}

function createGitRepo(dir, { branch = 'main' } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  runGitIn(dir, ['init', '-q']);
  // 空仓库（unborn HEAD）上用 symbolic-ref 指定首个 commit 的分支名，
  // 避免 checkout -b 与默认分支名冲突。
  runGitIn(dir, ['symbolic-ref', 'HEAD', `refs/heads/${branch}`]);
  runGitIn(dir, ['config', 'user.name', 'Release Gate Test']);
  runGitIn(dir, ['config', 'user.email', 'release-gate@example.com']);
  // 隔离宿主环境：禁用可能配置在全局的 hooks（例如会在 commit 时生成
  // graphify-out/ 的 hook）与全局 excludesfile，保证 porcelain 输出只反映 fixture 自身。
  const disabledHooksDir = path.join(dir, '.githooks-disabled');
  fs.mkdirSync(disabledHooksDir, { recursive: true });
  runGitIn(dir, ['config', 'core.hooksPath', disabledHooksDir]);
  runGitIn(dir, ['config', 'core.excludesfile', path.join(dir, '.gitignore-nonexistent')]);
  fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"gate-fixture","version":"1.0.0"}\n');
  runGitIn(dir, ['add', 'package.json']);
  const committed = runGitIn(dir, ['commit', '-q', '-m', 'init']);
  if (committed.status !== 0) {
    throw new Error(`fixture commit failed: ${committed.stderr}`);
  }
  return dir;
}

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-release-git-test-'));
}

describe('assertPublishableGitState', () => {
  let repoDir;

  beforeEach(() => {
    repoDir = createGitRepo(makeTempDir());
  });

  afterEach(() => {
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  test('clean repo on main passes and reports the branch', () => {
    const result = assertPublishableGitState({ cwd: repoDir });
    expect(result.ok).toBe(true);
    expect(result.branch).toBe('main');
  });

  test('master is accepted as a release branch', () => {
    const masterRepo = createGitRepo(makeTempDir(), { branch: 'master' });
    try {
      const result = assertPublishableGitState({ cwd: masterRepo });
      expect(result.ok).toBe(true);
      expect(result.branch).toBe('master');
    } finally {
      fs.rmSync(masterRepo, { recursive: true, force: true });
    }
  });

  test('dirty worktree (untracked or modified) fails with dirty-worktree', () => {
    fs.writeFileSync(path.join(repoDir, 'dirty.txt'), 'untracked\n');
    const untrackedResult = assertPublishableGitState({ cwd: repoDir });
    expect(untrackedResult.ok).toBe(false);
    expect(untrackedResult.reason_code).toBe('dirty-worktree');

    fs.rmSync(path.join(repoDir, 'dirty.txt'));
    fs.writeFileSync(path.join(repoDir, 'package.json'), '{"name":"gate-fixture","version":"1.0.1"}\n');
    const modifiedResult = assertPublishableGitState({ cwd: repoDir });
    expect(modifiedResult.ok).toBe(false);
    expect(modifiedResult.reason_code).toBe('dirty-worktree');
  });

  test('staged changes also fail the dirty-worktree gate', () => {
    fs.writeFileSync(path.join(repoDir, 'staged.txt'), 'staged\n');
    runGitIn(repoDir, ['add', 'staged.txt']);
    const result = assertPublishableGitState({ cwd: repoDir });
    expect(result.ok).toBe(false);
    expect(result.reason_code).toBe('dirty-worktree');
  });

  test('branch resolution failure is reported as git-branch-unavailable', () => {
    const runGit = (args) => {
      if (args[1] === '--is-inside-work-tree') {
        return { status: 0, stdout: 'true\n', stderr: '' };
      }
      if (args[0] === 'status') {
        return { status: 0, stdout: '', stderr: '' };
      }
      if (args[0] === 'rev-parse' && args[1] === '--abbrev-ref') {
        return { status: 128, stdout: '', stderr: 'ref explosion' };
      }
      return { status: 0, stdout: '', stderr: '' };
    };
    const result = assertPublishableGitState({ cwd: repoDir, runGit });
    expect(result.ok).toBe(false);
    expect(result.reason_code).toBe('git-branch-unavailable');
    expect(result.message).toContain('ref explosion');
  });

  test('allowedBranches option widens the release branch whitelist', () => {
    runGitIn(repoDir, ['checkout', '-q', '-b', 'release/1.0']);
    const defaultResult = assertPublishableGitState({ cwd: repoDir });
    expect(defaultResult.ok).toBe(false);
    expect(defaultResult.reason_code).toBe('unexpected-branch');

    const widened = assertPublishableGitState({
      cwd: repoDir,
      allowedBranches: ['main', 'release/1.0'],
    });
    expect(widened.ok).toBe(true);
    expect(widened.branch).toBe('release/1.0');
  });

  test('non-release branch fails with unexpected-branch', () => {
    runGitIn(repoDir, ['checkout', '-q', '-b', 'feature-branch']);
    const result = assertPublishableGitState({ cwd: repoDir });
    expect(result.ok).toBe(false);
    expect(result.reason_code).toBe('unexpected-branch');
    expect(result.message).toContain('feature-branch');
  });

  test('detached HEAD fails with detached-head', () => {
    const head = runGitIn(repoDir, ['rev-parse', 'HEAD']);
    runGitIn(repoDir, ['checkout', '-q', '--detach', head.stdout.trim()]);
    const result = assertPublishableGitState({ cwd: repoDir });
    expect(result.ok).toBe(false);
    expect(result.reason_code).toBe('detached-head');
  });

  test('directory outside a git worktree fails with git-worktree-unavailable', () => {
    const plainDir = makeTempDir();
    try {
      const result = assertPublishableGitState({ cwd: plainDir });
      expect(result.ok).toBe(false);
      expect(result.reason_code).toBe('git-worktree-unavailable');
    } finally {
      fs.rmSync(plainDir, { recursive: true, force: true });
    }
  });

  test('git status failure is reported instead of crashing', () => {
    const failingGit = () => ({ status: 128, stdout: '', stderr: 'boom' });
    // rev-parse 成功、status 失败：注入的执行器按命令分发。
    const runGit = (args) => (
      args[0] === 'rev-parse' && args[1] === '--is-inside-work-tree'
        ? { status: 0, stdout: 'true\n', stderr: '' }
        : failingGit()
    );
    const result = assertPublishableGitState({ cwd: repoDir, runGit });
    expect(result.ok).toBe(false);
    expect(result.reason_code).toBe('git-status-unavailable');
  });
});

describe('recordReleaseCommitAndTag', () => {
  let repoDir;

  beforeEach(() => {
    repoDir = createGitRepo(makeTempDir());
  });

  afterEach(() => {
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  test('commits package.json and creates the version tag on success', () => {
    fs.writeFileSync(
      path.join(repoDir, 'package.json'),
      '{"name":"gate-fixture","version":"1.0.1"}\n',
    );
    const result = recordReleaseCommitAndTag({ cwd: repoDir, version: '1.0.1' });

    expect(result.ok).toBe(true);
    expect(result.tagName).toBe('v1.0.1');
    expect(result.commitMessage).toBe('chore(release): v1.0.1');

    const headMessage = runGitIn(repoDir, ['log', '-1', '--pretty=%s']);
    expect(headMessage.stdout.trim()).toBe('chore(release): v1.0.1');

    const tags = runGitIn(repoDir, ['tag', '-l']);
    expect(tags.stdout).toContain('v1.0.1');

    const status = runGitIn(repoDir, ['status', '--porcelain']);
    expect(status.stdout.trim()).toBe('');
  });

  test('existing tag fails with manual remediation commands and no partial commit loss', () => {
    runGitIn(repoDir, ['tag', 'v1.0.1']);
    fs.writeFileSync(
      path.join(repoDir, 'package.json'),
      '{"name":"gate-fixture","version":"1.0.1"}\n',
    );

    const result = recordReleaseCommitAndTag({ cwd: repoDir, version: '1.0.1' });

    expect(result.ok).toBe(false);
    expect(result.reason_code).toBe('git-record-failed');
    expect(result.failedCommand).toEqual(['tag', 'v1.0.1']);
    // add 与 commit 已完成（result.completed）；手动命令只覆盖失败步骤及之后。
    expect(result.completed).toEqual([
      ['add', 'package.json'],
      ['commit', '-m', 'chore(release): v1.0.1'],
    ]);
    expect(result.manualCommands).toEqual(['git tag v1.0.1']);
    // commit 已落盘：版本 bump 不会因为 tag 失败而丢失。
    const headMessage = runGitIn(repoDir, ['log', '-1', '--pretty=%s']);
    expect(headMessage.stdout.trim()).toBe('chore(release): v1.0.1');
  });

  test('commit failure keeps manual commands starting from the failed step', () => {
    const runGit = (args) => {
      if (args[0] === 'add') {
        return { status: 0, stdout: '', stderr: '' };
      }
      return { status: 1, stdout: '', stderr: 'commit blocked' };
    };
    const result = recordReleaseCommitAndTag({ cwd: repoDir, version: '2.0.0', runGit });

    expect(result.ok).toBe(false);
    expect(result.failedCommand[0]).toBe('commit');
    expect(result.completed).toEqual([['add', 'package.json']]);
    expect(result.manualCommands).toEqual([
      "git commit -m 'chore(release): v2.0.0'",
      'git tag v2.0.0',
    ]);
    expect(result.message).toContain('commit blocked');
  });

  test('missing version is rejected without running git', () => {
    const runGit = jest.fn();
    const result = recordReleaseCommitAndTag({ cwd: repoDir, runGit });
    expect(result.ok).toBe(false);
    expect(result.reason_code).toBe('invalid-version');
    expect(runGit).not.toHaveBeenCalled();
  });
});
