'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  installChildHooks,
  reconvergeMerge,
  codegraphRefreshPosture,
} = require('../../skills/spec-mcp-setup/scripts/lib/workspace-graph-refresh.cjs');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-refresh-')));
}
function initRepo(root, rel) {
  const repo = path.resolve(root, rel);
  fs.mkdirSync(repo, { recursive: true });
  spawnSync('git', ['-C', repo, 'init', '-q']);
  // Neutralize any global core.hooksPath so hooks resolve inside the repo,
  // making the test deterministic across machines.
  spawnSync('git', ['-C', repo, 'config', '--local', 'core.hooksPath', '.git/hooks']);
  return { repo_id: rel, git_root: repo };
}
function initRepoWithCommit(root, rel) {
  const r = initRepo(root, rel);
  spawnSync('git', ['-C', r.git_root, 'config', 'user.email', 't@e.com']);
  spawnSync('git', ['-C', r.git_root, 'config', 'user.name', 'T']);
  fs.writeFileSync(path.join(r.git_root, 'README.md'), '# x');
  spawnSync('git', ['-C', r.git_root, 'add', '.']);
  spawnSync('git', ['-C', r.git_root, 'commit', '-q', '-m', 'init']);
  return r;
}

describe('installChildHooks — containment-checked git hook install (CR13/CR8)', () => {
  test('installs graphify hook per child in the child cwd', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const calls = [];
    const exec = (command, args, opts) => { calls.push({ command, args, cwd: opts.cwd }); return { status: 0 }; };
    const result = installChildHooks({ workspaceRoot: ws, repos, exec });
    expect(result.repos.every((r) => r.hook_status === 'installed')).toBe(true);
    expect(calls.filter((c) => c.args.join(' ') === 'hook install').length).toBe(2);
    expect(calls[0].cwd).toBe(repos[0].git_root);
  });

  test('hook install failure records fallback, does not throw', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api')];
    const exec = () => ({ status: 1, stderr: 'boom' });
    const result = installChildHooks({ workspaceRoot: ws, repos, exec });
    expect(result.repos[0].hook_status).toBe('failed');
    expect(result.repos[0].fallback).toBe('graphify-watch-or-explicit-refresh');
  });

  test('.git-as-file worktree: hooks dir resolves and passes containment', () => {
    const ws = mkWorkspace();
    const main = initRepoWithCommit(ws, 'main');
    const worktree = path.join(ws, 'wt');
    spawnSync('git', ['-C', main.git_root, 'worktree', 'add', '-q', worktree]);
    spawnSync('git', ['-C', worktree, 'config', '--local', 'core.hooksPath', '.git/hooks']);
    const repos = [{ repo_id: 'wt', git_root: worktree }];
    const exec = () => ({ status: 0 });
    const result = installChildHooks({ workspaceRoot: ws, repos, exec });
    expect(result.repos[0].hook_status).toBe('installed');
  });

  test('core.hooksPath redirecting hooks outside the workspace is rejected (containment)', () => {
    const ws = mkWorkspace();
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-outside-hooks-'));
    const repo = initRepo(ws, 'api');
    // Redirect this repo's hooks outside the workspace.
    spawnSync('git', ['-C', repo.git_root, 'config', '--local', 'core.hooksPath', outside]);
    let execCalled = false;
    const exec = () => { execCalled = true; return { status: 0 }; };
    const result = installChildHooks({ workspaceRoot: ws, repos: [repo], exec });
    expect(result.repos[0].hook_status).toBe('failed');
    expect(result.repos[0].reason_code).toBe('hook-target-escapes-workspace');
    expect(result.repos[0].fallback).toBe('graphify-watch-or-explicit-refresh');
    expect(execCalled).toBe(false); // never ran hook install into an out-of-workspace dir
  });
});

describe('reconvergeMerge — workspace merged graph re-converges', () => {
  test('many subgraphs → merged; one → single-source; zero → not-applicable', () => {
    const calls = [];
    const exec = (command, args) => { calls.push(args); return { status: 0 }; };
    expect(reconvergeMerge({ subgraphPaths: ['/a', '/b'], mergedGraphPath: '/m', exec }).status).toBe('merged');
    expect(reconvergeMerge({ subgraphPaths: ['/a'], mergedGraphPath: '/m', exec }).status).toBe('single-source');
    expect(reconvergeMerge({ subgraphPaths: [], mergedGraphPath: '/m', exec }).status).toBe('not-applicable');
    // merge command shape
    expect(calls[0]).toEqual(['merge-graphs', '/a', '/b', '--out', '/m']);
  });

  test('merge failure surfaces reason_code, not a throw', () => {
    const exec = () => ({ status: 1 });
    expect(reconvergeMerge({ subgraphPaths: ['/a', '/b'], mergedGraphPath: '/m', exec })).toEqual(
      expect.objectContaining({ status: 'failed', reason_code: 'merge-reconverge-failed' }),
    );
  });
});

describe('codegraphRefreshPosture — provider-native, spec-first does not start watcher', () => {
  test('reports watcher fact without starting anything', () => {
    const posture = codegraphRefreshPosture('running');
    expect(posture.spec_first_starts_watcher).toBe(false);
    expect(posture.refresh_owner).toBe('provider-native');
    expect(posture.watcher_fact).toBe('running');
    expect(posture.trust).toBe('provider_untrusted');
  });
});
