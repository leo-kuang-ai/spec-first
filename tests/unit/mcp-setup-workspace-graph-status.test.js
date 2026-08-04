'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { runWorkspaceGraphStatus } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs');
const { runWorkspaceGraphBuild } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-executor.cjs');
const { GRAPHIFY_OUT_DIRNAME } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-provider-runners.cjs');
const {
  inspectRepoSnapshot,
  writeWorkspaceGraphState,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-state.cjs');
const {
  acquireWorkspaceGraphLifecycleLease,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-lifecycle-lease.cjs');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-status-')));
}
function initRepo(root, rel) {
  const repo = path.resolve(root, rel);
  fs.mkdirSync(repo, { recursive: true });
  spawnSync('git', ['-C', repo, 'init', '-q']);
  return repo;
}
function fakeExec(command, args) {
  if (command === 'graphify' && args[0] === 'extract') {
    const outDir = args[args.indexOf('--out') + 1];
    const graphPath = path.join(outDir, GRAPHIFY_OUT_DIRNAME, 'graph.json');
    fs.mkdirSync(path.dirname(graphPath), { recursive: true });
    fs.writeFileSync(graphPath, '{}');
  } else if (command === 'graphify' && args[0] === 'merge-graphs') {
    fs.writeFileSync(args[args.indexOf('--out') + 1], '{}');
  } else if (command === 'codegraph' && args[0] === 'init') {
    fs.mkdirSync(path.join(args[1], '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(args[1], '.codegraph', 'codegraph.db'), 'x');
  }
  return { status: 0, stdout: '', stderr: '' };
}

function makeExecutable(root, name = 'graphify') {
  const target = path.join(root, name);
  fs.writeFileSync(target, '#!/bin/sh\nexit 0\n');
  fs.chmodSync(target, 0o755);
  return target;
}

describe('runWorkspaceGraphStatus — async refresh consume-side honesty (U6)', () => {
  const { runWorkspaceGraphStatus } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs');

  test('surfaces a failed background merged rebuild without triggering one', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    fs.writeFileSync(
      path.join(ws, 'graphify-out', 'workspace-async-refresh-status.json'),
      JSON.stringify({ schema_version: 'workspace-async-refresh-status.v1', ok: false, reason_code: 'workspace-async-refresh-nonzero-exit' }),
    );
    const rebuildExec = jest.fn(() => ({ status: 0 }));
    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: rebuildExec });
    expect(status).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-async-refresh-nonzero-exit',
      workspace: {
        freshness: expect.objectContaining({ freshness: 'stale' }),
      },
    });
    expect(status.workspace.async_refresh).toMatchObject({ status: 'failed', reason_code: 'workspace-async-refresh-nonzero-exit' });
    // 消费侧只读：绝不触发 merged 重建。
    expect(rebuildExec.mock.calls.filter(([, args]) => Array.isArray(args) && args.includes('--workspace-graph'))).toEqual([]);
  });

  test('a clear residue prevents a complete state receipt from reporting ready', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const build = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
    });
    expect(build.status).toBe('complete');
    fs.writeFileSync(
      path.join(ws, 'graphify-out', 'workspace-async-refresh-status.json.clear-test-residue'),
      '{"attempt_id":"orphan","ok":false}\n',
    );

    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });

    expect(status).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-async-refresh-abandoned',
      workspace: {
        async_refresh: {
          status: 'failed',
          reason_code: 'workspace-async-refresh-abandoned',
        },
      },
    });
  });

  test('reports in-flight while the async lock is held', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    fs.writeFileSync(path.join(ws, 'graphify-out', 'workspace-async-refresh.lock'), JSON.stringify({ pid: process.pid, started_at_ms: 0 }));
    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: () => ({ status: 0 }) });
    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-async-refresh-in-flight');
    expect(status.workspace.freshness.freshness).toBe('stale');
    expect(status.workspace.async_refresh.status).toBe('in-flight');
  });
});

describe('runWorkspaceGraphStatus — read-only doctor facts', () => {
  test('after a complete build, status reports ready; parent cwd has no invented default projectPath', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'web');
    const build = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api', 'web'],
      allowDiscovery: false,
      exec: (command, args) => fakeExec(path.basename(command), args),
    });
    expect(build.status).toBe('complete');

    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api', 'web'], allowDiscovery: false });
    expect(status.schema_version).toBe('workspace-graph-status.v1');
    expect(status.status).toBe('ready');
    expect(status.repos.map((r) => r.repo_id).sort()).toEqual(['api', 'web']);
    expect(status.repos.every((r) => r.codegraph_present && r.project_path_contained)).toBe(true);
    expect(status.workspace.merged_present).toBe(true);
    expect(status.workspace.merged_size_bytes).toEqual(expect.any(Number));
    // At parent root: no lexicographic "main" repo default.
    expect(status.default_project_path_policy).toBe('none-at-parent-root');
    expect(status.default_project_path).toBeNull();
    // Freshness carries no negative authority.
    expect(status.repos[0].freshness.negative_authority).toBe(false);
    expect(status.workspace.freshness.negative_authority).toBe(false);
    // Routing block should be present after build inject.
    expect(status.routing.entries.some((e) => e.has_routing_block)).toBe(true);
  });

  test('surfaces promotion cleanup pending alongside the primary partial reason', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'web');
    const build = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api', 'web'],
      allowDiscovery: false,
      exec: (command, args) => fakeExec(path.basename(command), args),
    });
    expect(build.status).toBe('complete');

    const statePath = path.join(ws, 'graphify-out', 'workspace-graph-state.json');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state.operation_status = 'partial';
    state.reason_code = 'workspace-codegraph-build-partial';
    state.repos[0].promotion_cleanup_pending = true;
    state.repos[0].promotion_cleanup_reason_code = 'promotion-backup-cleanup-pending';
    state.merge.promotion_cleanup_pending = true;
    state.merge.promotion_cleanup_reason_code = 'promotion-rollback-quarantine-cleanup-pending';
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');

    const status = runWorkspaceGraphStatus({
      cwd: ws,
      repos: ['api', 'web'],
      allowDiscovery: false,
    });

    expect(status).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-codegraph-build-partial',
      workspace: {
        promotion_cleanup_pending: true,
        promotion_cleanup_reason_codes: [
          'promotion-backup-cleanup-pending:repo:api',
          'promotion-rollback-quarantine-cleanup-pending:merge',
        ],
      },
    });
    expect(status.repos[0]).toMatchObject({
      promotion_cleanup_pending: true,
      promotion_cleanup_reason_code: 'promotion-backup-cleanup-pending',
    });
  });

  test('a lifecycle writer that starts after the first probe blocks the ready exit', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    const originalReadFileSync = fs.readFileSync;
    let lease = null;
    const readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((target, options) => {
      if (!lease && path.basename(String(target)) === 'AGENTS.md') {
        lease = acquireWorkspaceGraphLifecycleLease({
          workspaceRoot: ws,
          operation: 'successor-clean',
          pid: process.pid,
        });
      }
      return originalReadFileSync.call(fs, target, options);
    });

    let status;
    try {
      status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    } finally {
      readSpy.mockRestore();
    }

    expect(lease).toMatchObject({ ok: true, acquired: true });
    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-graph-lifecycle-busy');
    expect(lease.release()).toMatchObject({ ok: true, status: 'released' });
  });

  test('missing managed child hooks downgrade an async receipt to explicit refresh', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    spawnSync('git', ['-C', api, 'config', '--local', 'core.hooksPath', '.git/hooks']);
    const build = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: (command, args) => fakeExec(path.basename(command), args),
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    expect(build).toMatchObject({
      status: 'complete',
      refresh: { mode: 'commit-hook-spec-first-async' },
    });

    fs.rmSync(path.join(api, '.git', 'hooks', 'post-commit'));
    fs.rmSync(path.join(api, '.git', 'hooks', 'post-checkout'));

    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });

    expect(status).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-auto-refresh-hook-incomplete',
      repos: [{
        repo_id: 'api',
        auto_refresh_hook_status: 'missing',
        auto_refresh_hook_reason_code: 'workspace-child-hook-missing',
      }],
      workspace: {
        configured_refresh_mode: 'commit-hook-spec-first-async',
        refresh_mode: 'explicit',
      },
    });
  });

  test('managed child hook runtime-path drift downgrades async refresh to explicit', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    spawnSync('git', ['-C', api, 'config', '--local', 'core.hooksPath', '.git/hooks']);
    const codegraphCommand = makeExecutable(ws, 'codegraph');
    const graphifyCommand = makeExecutable(ws);
    const build = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: (command, args) => fakeExec(path.basename(command), args),
      codegraphCommand,
      graphifyCommand,
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    expect(build.status).toBe('complete');
    const state = JSON.parse(fs.readFileSync(
      path.join(ws, 'graphify-out', 'workspace-graph-state.json'),
      'utf8',
    ));
    expect(state.refresh_hook).toMatchObject({
      schema_version: 'workspace-child-hook-contract.v2',
      managed_block_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
      codegraph_command: codegraphCommand,
      graphify_command: graphifyCommand,
      bundled_version: '1.13.2',
    });

    const asyncRefreshScript = require.resolve(
      '../../skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs',
    );
    for (const name of ['post-commit', 'post-checkout']) {
      const hookPath = path.join(api, '.git', 'hooks', name);
      const contents = fs.readFileSync(hookPath, 'utf8');
      fs.writeFileSync(hookPath, contents.replace(asyncRefreshScript, `${asyncRefreshScript}.missing`));
    }

    const status = runWorkspaceGraphStatus({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      bundledVersion: '1.13.2',
    });

    expect(status).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-auto-refresh-hook-incomplete',
      repos: [{
        repo_id: 'api',
        auto_refresh_hook_status: 'stale',
        auto_refresh_hook_reason_code: 'workspace-child-hook-managed-block-stale',
      }],
      workspace: { refresh_mode: 'explicit' },
    });
  });

  test('a missing pinned hook runtime launcher downgrades async refresh to explicit', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    spawnSync('git', ['-C', api, 'config', '--local', 'core.hooksPath', '.git/hooks']);
    const codegraphCommand = makeExecutable(ws, 'codegraph');
    const graphifyCommand = makeExecutable(ws);
    const build = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: (command, args) => fakeExec(path.basename(command), args),
      codegraphCommand,
      graphifyCommand,
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    expect(build.status).toBe('complete');
    fs.rmSync(graphifyCommand);

    const status = runWorkspaceGraphStatus({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      bundledVersion: '1.13.2',
    });

    expect(status).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-auto-refresh-hook-incomplete',
      repos: [{
        repo_id: 'api',
        auto_refresh_hook_status: 'blocked',
        auto_refresh_hook_reason_code: 'workspace-child-hook-runtime-path-unavailable',
      }],
      workspace: { refresh_mode: 'explicit' },
    });
  });

  test('a bundled-version upgrade marks the installed hook contract stale', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    spawnSync('git', ['-C', api, 'config', '--local', 'core.hooksPath', '.git/hooks']);
    const build = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: (command, args) => fakeExec(path.basename(command), args),
      codegraphCommand: makeExecutable(ws, 'codegraph'),
      graphifyCommand: makeExecutable(ws),
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    expect(build.status).toBe('complete');

    const status = runWorkspaceGraphStatus({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      bundledVersion: '1.14.0',
    });

    expect(status).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-auto-refresh-hook-incomplete',
      repos: [{
        repo_id: 'api',
        auto_refresh_hook_status: 'stale',
        auto_refresh_hook_reason_code: 'workspace-child-hook-managed-block-stale',
      }],
      workspace: { refresh_mode: 'explicit' },
    });
  });

  const posixHookModeTest = process.platform === 'win32' ? test.skip : test;
  posixHookModeTest('a non-executable managed child hook cannot satisfy async readiness', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    spawnSync('git', ['-C', api, 'config', '--local', 'core.hooksPath', '.git/hooks']);
    const build = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: (command, args) => fakeExec(path.basename(command), args),
      codegraphCommand: makeExecutable(ws, 'codegraph'),
      graphifyCommand: makeExecutable(ws),
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    expect(build.status).toBe('complete');
    fs.chmodSync(path.join(api, '.git', 'hooks', 'post-commit'), 0o644);

    const status = runWorkspaceGraphStatus({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      bundledVersion: '1.13.2',
    });

    expect(status).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-auto-refresh-hook-incomplete',
      repos: [{
        repo_id: 'api',
        auto_refresh_hook_status: 'blocked',
        auto_refresh_hook_reason_code: 'workspace-child-hook-not-executable',
      }],
      workspace: { refresh_mode: 'explicit' },
    });
  });

  test('when cwd is inside a child, default projectPath is that enclosing child', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    initRepo(ws, 'web');
    runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api', 'web'],
      allowDiscovery: false,
      exec: fakeExec,
      injectRouting: false,
    });
    // Topology resolves from parent root; pathHintCwd simulates agent cwd inside a child.
    const status = runWorkspaceGraphStatus({
      cwd: ws,
      pathHintCwd: api,
      repos: ['api', 'web'],
      allowDiscovery: false,
    });
    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-routing-incomplete');
    expect(status.default_project_path_policy).toBe('cwd-enclosing-child');
    expect(status.default_project_path).toBe(api);
    expect(status.default_project_path_contained).toBe(true);
  });

  test('stale or truncated routing blocks cannot satisfy ready', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    fs.writeFileSync(path.join(ws, 'AGENTS.md'), '<!-- spec-first:workspace-routing start -->\nstale\n');
    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-routing-incomplete');
    expect(status.routing.entries.find((entry) => entry.entry_file === 'AGENTS.md').routing_current).toBe(false);
  });

  test('junk-only child artifacts cannot satisfy ready', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    fs.rmSync(path.join(api, '.codegraph'), { recursive: true, force: true });
    fs.mkdirSync(path.join(api, '.codegraph'));
    fs.writeFileSync(path.join(api, '.codegraph', 'diagnostic.log'), 'provider exited zero');
    const state = JSON.parse(fs.readFileSync(path.join(ws, 'graphify-out', 'workspace-graph-state.json'), 'utf8'));
    fs.writeFileSync(path.join(ws, state.repos[0].subgraph_path), '');
    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.status).toBe('partial');
    expect(status.repos[0].codegraph_present).toBe(false);
    expect(status.repos[0].graphify_subgraph_present).toBe(false);
  });

  const posixCodegraphSymlinkTest = process.platform === 'win32' ? test.skip : test;
  posixCodegraphSymlinkTest('a CodeGraph database symlink cannot satisfy ready', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    fs.rmSync(path.join(api, '.codegraph'), { recursive: true, force: true });
    fs.mkdirSync(path.join(api, '.codegraph'));
    const outside = path.join(mkWorkspace(), 'external-codegraph.db');
    fs.writeFileSync(outside, 'external');
    fs.symlinkSync(outside, path.join(api, '.codegraph', 'codegraph.db'));

    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });

    expect(status.status).toBe('partial');
    expect(status.repos[0].codegraph_present).toBe(false);
  });

  test('malformed Graphify artifacts cannot satisfy ready', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    const state = JSON.parse(fs.readFileSync(path.join(ws, 'graphify-out', 'workspace-graph-state.json'), 'utf8'));
    fs.writeFileSync(path.join(ws, state.repos[0].subgraph_path), '{broken');
    fs.writeFileSync(path.join(ws, 'graphify-out', 'merged-graph.json'), '{broken');

    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });

    expect(status.status).toBe('partial');
    expect(status.repos[0].graphify_subgraph_present).toBe(false);
    expect(status.workspace.merged_present).toBe(false);
  });

  test('a forged receipt cannot make a large malformed merged graph ready', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    const statePath = path.join(ws, 'graphify-out', 'workspace-graph-state.json');
    const mergedPath = path.join(ws, 'graphify-out', 'merged-graph.json');
    fs.writeFileSync(mergedPath, `{"nodes":[${' '.repeat((1024 * 1024) + 64)}broken]}`);
    const mergedStat = fs.statSync(mergedPath);
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state.merged_artifact = {
      path: 'graphify-out/merged-graph.json',
      size_bytes: mergedStat.size,
      mtime_ms: mergedStat.mtimeMs,
      sha256: crypto.createHash('sha256').update(fs.readFileSync(mergedPath)).digest('hex'),
    };
    fs.writeFileSync(statePath, JSON.stringify(state));

    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });

    expect(status.status).toBe('partial');
    expect(status.workspace.merged_present).toBe(false);
  });

  test('empty workspace reports absent without inventing graphs', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.status).toBe('absent');
    expect(status.repos[0].codegraph_present).toBe(false);
    expect(status.workspace.merged_present).toBe(false);
  });

  test('a child source change after build makes the workspace graph stale instead of ready', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
    });
    fs.writeFileSync(path.join(api, 'changed.js'), 'module.exports = 1;\n');

    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });

    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-graph-stale');
    expect(status.workspace.freshness.freshness).toBe('stale');
  });

  test('an explicit rebuild of unchanged dirty source converges to ready', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    fs.writeFileSync(path.join(api, 'changed.js'), 'module.exports = 1;\n');
    const build = runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    expect(build.status).toBe('complete');
    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.status).toBe('ready');
  });

  test('changing dirty file content without changing porcelain paths makes status stale', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    const changed = path.join(api, 'changed.js');
    fs.writeFileSync(changed, 'module.exports = 1;\n');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    fs.writeFileSync(changed, 'module.exports = 2;\n');
    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-graph-stale');
  });

  test('state writer downgrades a source change that races final receipt creation', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    const repo = { repo_id: 'api', git_root: api };
    const expected = [inspectRepoSnapshot(repo)];
    fs.writeFileSync(path.join(api, 'raced.js'), 'x');
    const receipt = writeWorkspaceGraphState({
      workspaceRoot: ws,
      operationStatus: 'complete',
      repos: [repo],
      expectedRepos: expected,
    });
    expect(receipt.ok).toBe(true);
    expect(receipt.state.operation_status).toBe('partial');
    expect(receipt.state.reason_code).toBe('workspace-source-changed-during-build');
  });

  test('status without --repos reuses the repo set recorded by the last build', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });

    const status = runWorkspaceGraphStatus({ cwd: ws, allowDiscovery: true });

    expect(status.status).toBe('ready');
    expect(status.repos.map((repo) => repo.repo_id)).toEqual(['api']);
  });

  test('a legacy merged file without a state receipt is not sufficient for ready', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    fs.mkdirSync(path.join(api, '.codegraph'), { recursive: true });
    fs.mkdirSync(path.join(ws, 'graphify-out'), { recursive: true });
    fs.writeFileSync(path.join(ws, 'graphify-out', 'merged-graph.json'), '{}');

    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });

    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-graph-state-missing');
    expect(status.workspace.freshness.freshness).toBe('unknown');
  });

  test('an incomplete state receipt cannot report ready', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    const statePath = path.join(ws, 'graphify-out', 'workspace-graph-state.json');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state.operation_status = 'partial';
    state.reason_code = 'workspace-routing-injection-failed';
    fs.writeFileSync(statePath, JSON.stringify(state));
    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-routing-injection-failed');
  });

  test('does not hash the merged graph after a cheaper state gate already fails', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    const statePath = path.join(ws, 'graphify-out', 'workspace-graph-state.json');
    const mergedPath = path.join(ws, 'graphify-out', 'merged-graph.json');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state.operation_status = 'partial';
    state.reason_code = 'workspace-routing-injection-failed';
    fs.writeFileSync(statePath, JSON.stringify(state));
    const originalOpenSync = fs.openSync;
    let mergedOpenCount = 0;
    const mergedOpenSpy = jest.spyOn(fs, 'openSync').mockImplementation((target, ...args) => {
      if (path.resolve(String(target)) === path.resolve(mergedPath)) {
        mergedOpenCount += 1;
      }
      return originalOpenSync.call(fs, target, ...args);
    });

    let status;
    try {
      status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    } finally {
      mergedOpenSpy.mockRestore();
    }

    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-routing-injection-failed');
    expect(mergedOpenCount).toBe(0);
  });

  test('changed merged artifact and missing subgraph invalidate the receipt', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    fs.writeFileSync(path.join(ws, 'graphify-out', 'merged-graph.json'), '{"changed":true}');
    let status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.reason_code).toBe('workspace-merged-artifact-changed');

    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    const state = JSON.parse(fs.readFileSync(path.join(ws, 'graphify-out', 'workspace-graph-state.json'), 'utf8'));
    fs.rmSync(path.join(ws, state.repos[0].subgraph_path));
    status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.reason_code).toBe('workspace-subgraph-missing');
  });

  test('same-size merged artifact replacement cannot retain ready by restoring mtime', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    const mergedPath = path.join(ws, 'graphify-out', 'merged-graph.json');
    const original = fs.statSync(mergedPath);

    fs.writeFileSync(mergedPath, '[]');
    fs.utimesSync(mergedPath, original.atime, original.mtime);

    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });

    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-merged-artifact-changed');
  });

  const symlinkArtifactTest = process.platform === 'win32' ? test.skip : test;
  symlinkArtifactTest('an external merged-artifact symlink cannot retain ready or be hashed', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    const mergedPath = path.join(ws, 'graphify-out', 'merged-graph.json');
    const original = fs.statSync(mergedPath);
    const outsideRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-external-')));
    const outsideArtifact = path.join(outsideRoot, 'merged-graph.json');
    fs.copyFileSync(mergedPath, outsideArtifact);
    fs.utimesSync(outsideArtifact, original.atime, original.mtime);
    fs.rmSync(mergedPath);
    fs.symlinkSync(outsideArtifact, mergedPath);

    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });

    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-merged-artifact-changed');
    expect(status.workspace.merged_present).toBe(false);
  });

  symlinkArtifactTest('a merged artifact swapped to an external symlink during digest cannot retain ready', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    const mergedPath = path.join(ws, 'graphify-out', 'merged-graph.json');
    const outsideRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-swap-')));
    const outsideArtifact = path.join(outsideRoot, 'merged-graph.json');
    fs.copyFileSync(mergedPath, outsideArtifact);
    const originalOpenSync = fs.openSync;
    let mergedOpenCount = 0;
    let swapped = false;
    const openSpy = jest.spyOn(fs, 'openSync').mockImplementation((target, ...args) => {
      if (path.resolve(String(target)) === path.resolve(mergedPath)) {
        mergedOpenCount += 1;
        if (!swapped && mergedOpenCount === 2) {
          swapped = true;
          fs.rmSync(mergedPath);
          fs.symlinkSync(outsideArtifact, mergedPath);
        }
      }
      return originalOpenSync.call(fs, target, ...args);
    });

    let status;
    try {
      status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    } finally {
      openSpy.mockRestore();
    }

    expect(swapped).toBe(true);
    expect(mergedOpenCount).toBe(2);
    expect(fs.lstatSync(mergedPath).isSymbolicLink()).toBe(true);
    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-merged-artifact-changed');
  });

  test('repo-set drift and invalid state JSON cannot report ready', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    initRepo(ws, 'web');
    let status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api', 'web'], allowDiscovery: false });
    expect(status.reason_code).toBe('workspace-repo-set-changed');

    fs.writeFileSync(path.join(ws, 'graphify-out', 'workspace-graph-state.json'), '{bad json');
    status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.reason_code).toBe('workspace-graph-state-invalid');

    fs.writeFileSync(path.join(ws, 'graphify-out', 'workspace-graph-state.json'), JSON.stringify({
      schema_version: 'workspace-graph-state.v1',
      repos: [],
    }));
    status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.reason_code).toBe('workspace-graph-state-invalid');
  });

  test('git cwd is skipped', () => {
    const ws = mkWorkspace();
    initRepo(ws, '.');
    const status = runWorkspaceGraphStatus({ cwd: ws });
    expect(status.status).toBe('skipped');
    expect(status.topology).toBe('cwd-is-git-repo');
  });
});
