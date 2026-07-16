'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  addManagedExclude,
  removeManagedExclude,
  resolveExcludePath,
  MANAGED_BLOCK_START,
  MANAGED_BLOCK_END,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-git-exclude.cjs');
const { resolveGitPath } = require('../../skills/spec-runtime-setup/scripts/lib/git-path.cjs');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-exclude-')));
}

function git(cwd, args) {
  const result = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  return result.stdout;
}

function initRepoWithCommit(root, relativePath) {
  const repo = path.resolve(root, relativePath);
  fs.mkdirSync(repo, { recursive: true });
  git(repo, ['init', '-q']);
  git(repo, ['config', 'user.email', 'test@example.com']);
  git(repo, ['config', 'user.name', 'Test']);
  fs.writeFileSync(path.join(repo, 'README.md'), '# repo\n');
  git(repo, ['add', '.']);
  git(repo, ['commit', '-q', '-m', 'init']);
  return repo;
}

function status(repo) {
  return spawnSync('git', ['-C', repo, 'status', '--porcelain'], { encoding: 'utf8' }).stdout;
}

describe('workspace-git-exclude — managed .git/info/exclude writer', () => {
  test('adds .codegraph/ and keeps git status clean; idempotent', () => {
    const ws = mkWorkspace();
    const repo = initRepoWithCommit(ws, 'api');

    const first = addManagedExclude(repo, ws);
    expect(first.ok).toBe(true);
    expect(first.changed).toBe(true);

    // Create the artifact dir git would otherwise show as untracked.
    fs.mkdirSync(path.join(repo, '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(repo, '.codegraph', 'codegraph.db'), 'x');
    expect(status(repo).trim()).toBe('');

    const second = addManagedExclude(repo, ws);
    expect(second.ok).toBe(true);
    expect(second.changed).toBe(false);

    const excludeContents = fs.readFileSync(first.target, 'utf8');
    expect(excludeContents.split(MANAGED_BLOCK_START).length - 1).toBe(1);
  });

  test('preserves pre-existing user exclude lines; remove strips only the managed block', () => {
    const ws = mkWorkspace();
    const repo = initRepoWithCommit(ws, 'web');
    const excludePath = resolveExcludePath(repo).absolute;
    fs.writeFileSync(excludePath, '# user rule\n*.log\n');

    addManagedExclude(repo, ws);
    let contents = fs.readFileSync(excludePath, 'utf8');
    expect(contents).toContain('*.log');
    expect(contents).toContain('.codegraph/');

    const removed = removeManagedExclude(repo, ws);
    expect(removed.ok).toBe(true);
    expect(removed.changed).toBe(true);
    contents = fs.readFileSync(excludePath, 'utf8');
    expect(contents).toContain('*.log');
    expect(contents).not.toContain('.codegraph/');
    expect(contents).not.toContain(MANAGED_BLOCK_START);

    // Removal is idempotent.
    const removedAgain = removeManagedExclude(repo, ws);
    expect(removedAgain.changed).toBe(false);
  });

  test('.git-as-file worktree: resolves via git rev-parse, not a stray <repo>/.git/info/exclude', () => {
    const ws = mkWorkspace();
    const main = initRepoWithCommit(ws, 'main');
    const worktree = path.join(ws, 'wt');
    git(main, ['worktree', 'add', '-q', worktree]);
    // Sanity: a linked worktree has a .git FILE, not a directory.
    expect(fs.lstatSync(path.join(worktree, '.git')).isFile()).toBe(true);

    const result = addManagedExclude(worktree, ws);
    expect(result.ok).toBe(true);
    // Must NOT have created a literal <worktree>/.git/info/exclude (that path's .git is a file).
    expect(result.target).not.toBe(path.join(worktree, '.git', 'info', 'exclude'));

    fs.mkdirSync(path.join(worktree, '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(worktree, '.codegraph', 'db'), 'x');
    expect(status(worktree).trim()).toBe('');
  });

  test('resolveExcludePath returns an absolute path for a normal repo', () => {
    const ws = mkWorkspace();
    const repo = initRepoWithCommit(ws, 'svc');
    const resolved = resolveExcludePath(repo);
    expect(resolved.ok).toBe(true);
    expect(path.isAbsolute(resolved.absolute)).toBe(true);
    expect(resolved.absolute.endsWith(path.join('info', 'exclude'))).toBe(true);
  });

  test('shared Git path resolver follows effective hooksPath and distinguishes non-Git roots', () => {
    const ws = mkWorkspace();
    const repo = initRepoWithCommit(ws, 'svc');
    git(repo, ['config', '--local', 'core.hooksPath', '.project-hooks']);
    expect(resolveGitPath(repo, 'hooks')).toEqual({
      ok: true,
      absolute: path.join(repo, '.project-hooks'),
    });

    const nonGit = path.join(ws, 'plain');
    fs.mkdirSync(nonGit);
    expect(resolveGitPath(nonGit, 'hooks')).toEqual({
      ok: false,
      reason_code: 'not-a-git-repo',
    });
  });

  test('shared Git path resolver exposes linked-worktree metadata outside the worktree root', () => {
    const ws = mkWorkspace();
    const main = initRepoWithCommit(ws, 'main');
    const worktree = path.join(ws, 'wt-hooks');
    git(main, ['worktree', 'add', '-q', worktree]);
    const sharedHooks = path.join(main, '.git', 'hooks');
    git(main, ['config', '--local', 'core.hooksPath', sharedHooks]);
    const resolved = resolveGitPath(worktree, 'hooks');
    expect(resolved).toEqual({ ok: true, absolute: sharedHooks });
    expect(resolved.absolute.startsWith(worktree + path.sep)).toBe(false);
  });

  test('remove rejects an exclude symlink escaping the workspace', () => {
    const ws = mkWorkspace();
    const repo = initRepoWithCommit(ws, 'svc');
    const excludePath = resolveExcludePath(repo).absolute;
    const outside = path.join(mkWorkspace(), 'outside-exclude');
    fs.writeFileSync(outside, `${MANAGED_BLOCK_START}\n.codegraph/\n${MANAGED_BLOCK_END}\n`);
    fs.rmSync(excludePath, { force: true });
    try {
      fs.symlinkSync(outside, excludePath);
    } catch (_error) {
      return;
    }
    const result = removeManagedExclude(repo, ws);
    expect(result).toEqual(expect.objectContaining({
      ok: false,
      reason_code: 'exclude-target-escapes-workspace',
    }));
    expect(fs.readFileSync(outside, 'utf8')).toContain(MANAGED_BLOCK_START);
  });

  test.each([
    ['missing end', `${MANAGED_BLOCK_START}\n.codegraph/\n`],
    ['duplicate start', `${MANAGED_BLOCK_START}\n${MANAGED_BLOCK_START}\n${MANAGED_BLOCK_END}\n`],
    ['reversed markers', `${MANAGED_BLOCK_END}\n${MANAGED_BLOCK_START}\n`],
  ])('malformed managed block (%s) fails closed and preserves user content', (_name, contents) => {
    const ws = mkWorkspace();
    const repo = initRepoWithCommit(ws, 'svc');
    const excludePath = resolveExcludePath(repo).absolute;
    fs.writeFileSync(excludePath, `# user\n${contents}`);
    const remove = removeManagedExclude(repo, ws);
    expect(remove).toEqual(expect.objectContaining({ ok: false, reason_code: 'exclude-managed-block-malformed' }));
    expect(fs.readFileSync(excludePath, 'utf8')).toBe(`# user\n${contents}`);
    const add = addManagedExclude(repo, ws);
    expect(add).toEqual(expect.objectContaining({ ok: false, reason_code: 'exclude-managed-block-malformed' }));
    expect(fs.readFileSync(excludePath, 'utf8')).toBe(`# user\n${contents}`);
  });
});
