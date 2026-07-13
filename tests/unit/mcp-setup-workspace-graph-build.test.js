'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  buildWorkspaceGraphs,
  GRAPHIFY_OUT_DIRNAME,
  MERGED_GRAPH_BASENAME,
} = require('../../skills/spec-mcp-setup/scripts/lib/workspace-graph-build.cjs');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-build-')));
}

function initRepo(root, rel) {
  const repo = path.resolve(root, rel);
  fs.mkdirSync(repo, { recursive: true });
  const r = spawnSync('git', ['-C', repo, 'init', '-q'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('git init failed');
  return { repo_id: rel, git_root: repo };
}

// Fake runners that record calls and succeed by default; per-repo failure is
// controlled by `failGraphifyFor` / `failCodegraphFor` sets of repo_id.
function makeRunners(ws, opts = {}) {
  const calls = { install: 0, codegraphInit: [], graphifyExtract: [], merge: [] };
  const failGraphify = new Set(opts.failGraphifyFor || []);
  const failCodegraph = new Set(opts.failCodegraphFor || []);
  return {
    calls,
    runners: {
      codegraphInstallGlobal() {
        calls.install += 1;
        return opts.failInstall
          ? { ok: false, reason_code: 'codegraph-install-failed' }
          : { ok: true };
      },
      codegraphInit(repoRoot) {
        calls.codegraphInit.push(repoRoot);
        const id = path.basename(repoRoot);
        if (failCodegraph.has(id)) return { ok: false, reason_code: 'codegraph-init-failed' };
        fs.mkdirSync(path.join(repoRoot, '.codegraph'), { recursive: true });
        fs.writeFileSync(path.join(repoRoot, '.codegraph', 'codegraph.db'), 'x');
        return { ok: true };
      },
      graphifyExtract(repoRoot, outDir) {
        calls.graphifyExtract.push({ repoRoot, outDir });
        const id = path.basename(repoRoot);
        if (failGraphify.has(id)) return { ok: false, reason_code: 'graphify-extract-failed' };
        const graphPath = path.join(outDir, GRAPHIFY_OUT_DIRNAME, 'graph.json');
        fs.mkdirSync(path.dirname(graphPath), { recursive: true });
        fs.writeFileSync(graphPath, JSON.stringify({ nodes: [] }));
        return { ok: true, graphPath };
      },
      graphifyMerge(inputs, outPath) {
        calls.merge.push({ inputs: inputs.slice(), outPath });
        if (opts.failMerge) return { ok: false, reason_code: 'graphify-merge-failed' };
        fs.writeFileSync(outPath, JSON.stringify({ merged: inputs.length }));
        return { ok: true };
      },
    },
  };
}

describe('buildWorkspaceGraphs — orchestration contract', () => {
  test('all children succeed: complete status, global install once, merged graph, out-of-tree paths', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web'), initRepo(ws, 'worker')];
    const { runners, calls } = makeRunners(ws);

    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });

    expect(result.status).toBe('complete');
    expect(calls.install).toBe(1); // once, not per child
    expect(result.merge.status).toBe('merged');
    expect(result.merge.cross_repo_layer).toBe(true);
    expect(result.merge.merged_graph_path).toBe(path.join(ws, GRAPHIFY_OUT_DIRNAME, MERGED_GRAPH_BASENAME));
    // Graphify subgraphs are out-of-tree under <ws>/.graphify/, not inside child repos.
    for (const call of calls.graphifyExtract) {
      expect(call.outDir.startsWith(path.join(ws, GRAPHIFY_OUT_DIRNAME))).toBe(true);
    }
    // Each child got the managed exclude → git status clean.
    for (const repo of repos) {
      const st = spawnSync('git', ['-C', repo.git_root, 'status', '--porcelain'], { encoding: 'utf8' }).stdout;
      expect(st.trim()).toBe('');
    }
  });

  test('one child graphify failure is isolated: batch partial, merge from remaining subgraphs', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const { runners, calls } = makeRunners(ws, { failGraphifyFor: ['web'] });

    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });

    expect(result.status).toBe('partial');
    const web = result.repos.find((r) => r.repo_id === 'web');
    const api = result.repos.find((r) => r.repo_id === 'api');
    expect(web.graphify_status).toBe('failed');
    expect(api.graphify_status).toBe('ready');
    // Merge ran over the single remaining subgraph → single-source.
    expect(result.merge.status).toBe('single-source');
    expect(calls.merge.length).toBe(1);
    expect(calls.merge[0].inputs.length).toBe(1);
  });

  test('single eligible child: merge status single-source, cross_repo_layer false', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'solo')];
    const { runners } = makeRunners(ws);
    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });
    expect(result.merge.status).toBe('single-source');
    expect(result.merge.cross_repo_layer).toBe(false);
  });

  test('zero eligible subgraphs (graphify all fail, codegraph ok): merge not-applicable, batch partial', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'a'), initRepo(ws, 'b')];
    const { runners, calls } = makeRunners(ws, { failGraphifyFor: ['a', 'b'] });
    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });
    expect(result.merge.status).toBe('not-applicable');
    expect(result.merge.merged_graph_path).toBeNull();
    expect(calls.merge.length).toBe(0);
    // CodeGraph tactical layer still built → partial, not failed.
    expect(result.status).toBe('partial');
  });

  test('both layers fail for every child: batch failed', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'a'), initRepo(ws, 'b')];
    const { runners } = makeRunners(ws, { failGraphifyFor: ['a', 'b'], failCodegraphFor: ['a', 'b'] });
    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });
    expect(result.status).toBe('failed');
    expect(result.merge.status).toBe('not-applicable');
  });

  test('codegraph failure on one child does not abort the batch', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const { runners } = makeRunners(ws, { failCodegraphFor: ['api'] });
    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });
    const api = result.repos.find((r) => r.repo_id === 'api');
    expect(api.codegraph_status).toBe('failed');
    expect(api.reason_code).toBe('codegraph-init-failed');
    // web still built, so batch is partial not failed
    expect(result.status).toBe('partial');
  });

  test('merge runner ok without writing merged-graph cannot be promoted to complete', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const { runners } = makeRunners(ws);
    runners.graphifyMerge = () => ({ ok: true });

    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });

    expect(result.merge.status).toBe('failed');
    expect(result.merge.reason_code).toBe('workspace-merged-graph-invalid');
    expect(result.status).toBe('partial');
    expect(result.reason_code).toBe('workspace-merge-failed');
  });

  test('a zero-exit merge that writes an empty graph cannot produce a complete receipt', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const { runners } = makeRunners(ws);
    runners.graphifyMerge = (_inputs, outPath) => {
      fs.writeFileSync(outPath, '');
      return { ok: true };
    };

    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });

    expect(result.status).toBe('partial');
    expect(result.merge).toEqual(expect.objectContaining({
      status: 'failed',
      reason_code: 'workspace-merged-graph-invalid',
    }));
    expect(fs.existsSync(path.join(ws, '.graphify', MERGED_GRAPH_BASENAME))).toBe(false);
  });

  test('a malformed Graphify subgraph cannot satisfy a successful provider result', () => {
    const ws = mkWorkspace();
    const repo = initRepo(ws, 'api');
    const result = buildWorkspaceGraphs({
      workspaceRoot: ws,
      repos: [repo],
      runners: {
        codegraphInstallGlobal: () => ({ ok: true }),
        codegraphInit: () => {
          fs.mkdirSync(path.join(repo.git_root, '.codegraph'), { recursive: true });
          fs.writeFileSync(path.join(repo.git_root, '.codegraph', 'db'), 'x');
          return { ok: true };
        },
        graphifyExtract: (_root, outDir) => {
          const graphPath = path.join(outDir, '.graphify', 'graph.json');
          fs.mkdirSync(path.dirname(graphPath), { recursive: true });
          fs.writeFileSync(graphPath, '{broken');
          return { ok: true, graphPath };
        },
        graphifyMerge: () => ({ ok: true }),
      },
    });
    expect(result.status).toBe('partial');
    expect(result.repos[0]).toEqual(expect.objectContaining({
      graphify_status: 'failed',
      reason_code: 'graphify-subgraph-invalid',
    }));
  });

  test('zero-exit no-op providers cannot reuse stale graph artifacts', () => {
    const ws = mkWorkspace();
    const repo = initRepo(ws, 'api');
    fs.mkdirSync(path.join(repo.git_root, '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(repo.git_root, '.codegraph', 'old.db'), 'old');
    const staleSubgraph = path.join(ws, '.graphify', 'api', '.graphify', 'graph.json');
    fs.mkdirSync(path.dirname(staleSubgraph), { recursive: true });
    fs.writeFileSync(staleSubgraph, '{"old":true}');
    const result = buildWorkspaceGraphs({
      workspaceRoot: ws,
      repos: [repo],
      runners: {
        codegraphInstallGlobal: () => ({ ok: true }),
        codegraphInit: () => ({ ok: true }),
        graphifyExtract: () => ({ ok: true }),
        graphifyMerge: () => ({ ok: true }),
      },
    });
    expect(result.status).toBe('failed');
    expect(result.repos[0].codegraph_status).toBe('failed');
    expect(result.repos[0].graphify_status).toBe('failed');
    expect(fs.readFileSync(path.join(repo.git_root, '.codegraph', 'old.db'), 'utf8')).toBe('old');
    expect(fs.readFileSync(staleSubgraph, 'utf8')).toContain('old');
  });

  test('empty artifacts cannot satisfy a successful provider result', () => {
    const ws = mkWorkspace();
    const repo = initRepo(ws, 'api');
    const result = buildWorkspaceGraphs({
      workspaceRoot: ws,
      repos: [repo],
      runners: {
        codegraphInstallGlobal: () => ({ ok: true }),
        codegraphInit: () => {
          fs.mkdirSync(path.join(repo.git_root, '.codegraph'), { recursive: true });
          return { ok: true };
        },
        graphifyExtract: (_root, outDir) => {
          const graphPath = path.join(outDir, '.graphify', 'graph.json');
          fs.mkdirSync(path.dirname(graphPath), { recursive: true });
          fs.writeFileSync(graphPath, '');
          return { ok: true, graphPath };
        },
        graphifyMerge: () => ({ ok: true }),
      },
    });
    expect(result.status).toBe('failed');
    expect(result.repos[0].codegraph_status).toBe('failed');
    expect(result.repos[0].graphify_status).toBe('failed');
  });

  test('source changed during build cannot produce a complete receipt', () => {
    const ws = mkWorkspace();
    const repo = initRepo(ws, 'api');
    const { runners } = makeRunners(ws);
    const originalExtract = runners.graphifyExtract;
    runners.graphifyExtract = (...args) => {
      const result = originalExtract(...args);
      fs.writeFileSync(path.join(repo.git_root, 'changed-during-build.js'), 'x');
      return result;
    };
    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos: [repo], runners });
    expect(result.status).toBe('partial');
    expect(result.reason_code).toBe('workspace-source-changed-during-build');
    expect(result.state.state.operation_status).toBe('partial');
  });

  test('merge failure cannot be promoted to complete when all child providers are ready', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const { runners } = makeRunners(ws, { failMerge: true });

    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });

    expect(result.merge.status).toBe('failed');
    expect(result.status).toBe('partial');
    expect(result.reason_code).toBe('workspace-merge-failed');
  });

  test('exclude failure cannot be promoted to complete', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api')];
    const { runners } = makeRunners(ws);

    const result = buildWorkspaceGraphs({
      workspaceRoot: ws,
      repos,
      runners,
      excludeWriter: () => ({ ok: false, reason_code: 'exclude-write-failed' }),
    });

    expect(result.repos[0].exclude_status).toBe('failed');
    expect(result.status).toBe('partial');
    expect(result.reason_code).toBe('workspace-exclude-failed');
  });

  test('global CodeGraph install failure cannot be promoted to complete', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api')];
    const { runners } = makeRunners(ws, { failInstall: true });

    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });

    expect(result.status).toBe('partial');
    expect(result.reason_code).toBe('workspace-codegraph-install-failed');
  });

  test('state receipt write failure cannot be promoted to complete', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api')];
    const { runners } = makeRunners(ws);
    let writes = 0;

    const result = buildWorkspaceGraphs({
      workspaceRoot: ws,
      repos,
      runners,
      stateWriter: () => {
        writes += 1;
        return writes === 1
          ? { ok: true }
          : { ok: false, reason_code: 'workspace-state-write-failed' };
      },
    });

    expect(result.status).toBe('partial');
    expect(result.reason_code).toBe('workspace-state-write-failed');
  });
});
