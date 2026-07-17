'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { runWorkspaceGraphStatus } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs');
const { runWorkspaceGraphBuild } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-executor.cjs');
const { GRAPHIFY_OUT_ENV } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-provider-runners.cjs');
const {
  inspectRepoSnapshot,
  writeWorkspaceGraphState,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-state.cjs');

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
    const graphPath = path.join(outDir, GRAPHIFY_OUT_ENV, 'graph.json');
    fs.mkdirSync(path.dirname(graphPath), { recursive: true });
    fs.writeFileSync(graphPath, '{}');
  } else if (command === 'graphify' && args[0] === 'merge-graphs') {
    fs.writeFileSync(args[args.indexOf('--out') + 1], '{}');
  } else if (command === 'codegraph' && args[0] === 'init') {
    fs.mkdirSync(path.join(args[1], '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(args[1], '.codegraph', 'db'), 'x');
  }
  return { status: 0, stdout: '', stderr: '' };
}

describe('runWorkspaceGraphStatus — async refresh consume-side honesty (U6)', () => {
  const { runWorkspaceGraphStatus } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs');

  test('surfaces a failed background merged rebuild without triggering one', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    fs.writeFileSync(
      path.join(ws, '.graphify', 'workspace-async-refresh-status.json'),
      JSON.stringify({ schema_version: 'workspace-async-refresh-status.v1', ok: false, reason_code: 'workspace-async-refresh-nonzero-exit' }),
    );
    const rebuildExec = jest.fn(() => ({ status: 0 }));
    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: rebuildExec });
    expect(status.workspace.async_refresh).toMatchObject({ status: 'failed', reason_code: 'workspace-async-refresh-nonzero-exit' });
    // 消费侧只读：绝不触发 merged 重建。
    expect(rebuildExec.mock.calls.filter(([, args]) => Array.isArray(args) && args.includes('--workspace-graph'))).toEqual([]);
  });

  test('reports in-flight while the async lock is held', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    fs.writeFileSync(path.join(ws, '.graphify', 'workspace-async-refresh.lock'), JSON.stringify({ pid: process.pid, started_at_ms: 0 }));
    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: () => ({ status: 0 }) });
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
      exec: fakeExec,
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

  test('empty child artifacts cannot satisfy ready', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    fs.rmSync(path.join(api, '.codegraph'), { recursive: true, force: true });
    fs.mkdirSync(path.join(api, '.codegraph'));
    const state = JSON.parse(fs.readFileSync(path.join(ws, '.graphify', 'workspace-graph-state.json'), 'utf8'));
    fs.writeFileSync(path.join(ws, state.repos[0].subgraph_path), '');
    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.status).toBe('partial');
    expect(status.repos[0].codegraph_present).toBe(false);
    expect(status.repos[0].graphify_subgraph_present).toBe(false);
  });

  test('malformed Graphify artifacts cannot satisfy ready', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    const state = JSON.parse(fs.readFileSync(path.join(ws, '.graphify', 'workspace-graph-state.json'), 'utf8'));
    fs.writeFileSync(path.join(ws, state.repos[0].subgraph_path), '{broken');
    fs.writeFileSync(path.join(ws, '.graphify', 'merged-graph.json'), '{broken');

    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });

    expect(status.status).toBe('partial');
    expect(status.repos[0].graphify_subgraph_present).toBe(false);
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
    fs.mkdirSync(path.join(ws, '.graphify'), { recursive: true });
    fs.writeFileSync(path.join(ws, '.graphify', 'merged-graph.json'), '{}');

    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });

    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-graph-state-missing');
    expect(status.workspace.freshness.freshness).toBe('unknown');
  });

  test('an incomplete state receipt cannot report ready', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    const statePath = path.join(ws, '.graphify', 'workspace-graph-state.json');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state.operation_status = 'partial';
    state.reason_code = 'workspace-routing-injection-failed';
    fs.writeFileSync(statePath, JSON.stringify(state));
    const status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-routing-injection-failed');
  });

  test('changed merged artifact and missing subgraph invalidate the receipt', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    fs.writeFileSync(path.join(ws, '.graphify', 'merged-graph.json'), '{"changed":true}');
    let status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.reason_code).toBe('workspace-merged-artifact-changed');

    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    const state = JSON.parse(fs.readFileSync(path.join(ws, '.graphify', 'workspace-graph-state.json'), 'utf8'));
    fs.rmSync(path.join(ws, state.repos[0].subgraph_path));
    status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.reason_code).toBe('workspace-subgraph-missing');
  });

  test('repo-set drift and invalid state JSON cannot report ready', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    initRepo(ws, 'web');
    let status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api', 'web'], allowDiscovery: false });
    expect(status.reason_code).toBe('workspace-repo-set-changed');

    fs.writeFileSync(path.join(ws, '.graphify', 'workspace-graph-state.json'), '{bad json');
    status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.reason_code).toBe('workspace-graph-state-invalid');

    fs.writeFileSync(path.join(ws, '.graphify', 'workspace-graph-state.json'), JSON.stringify({
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
