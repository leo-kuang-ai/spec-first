'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  buildWorkspaceGraphs,
  GRAPHIFY_OUT_DIRNAME,
  MERGED_GRAPH_BASENAME,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-build.cjs');

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
  const calls = {
    install: 0,
    codegraphInit: [],
    codegraphSync: [],
    graphifyExtract: [],
    merge: [],
  };
  const failGraphify = new Set(opts.failGraphifyFor || []);
  const failCodegraph = new Set(opts.failCodegraphFor || []);
  const failCodegraphSync = new Set(opts.failCodegraphSyncFor || []);
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
      codegraphSync(repoRoot) {
        calls.codegraphSync.push(repoRoot);
        const id = path.basename(repoRoot);
        if (failCodegraphSync.has(id)) {
          return { ok: false, reason_code: 'codegraph-sync-failed' };
        }
        fs.appendFileSync(path.join(repoRoot, '.codegraph', 'codegraph.db'), `\nsync:${id}`);
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
    // Graphify subgraphs are out-of-tree under <ws>/graphify-out/, not inside child repos.
    for (const call of calls.graphifyExtract) {
      expect(call.outDir.startsWith(path.join(ws, GRAPHIFY_OUT_DIRNAME))).toBe(true);
    }
    // Each child got the managed exclude → git status clean.
    for (const repo of repos) {
      const st = spawnSync('git', ['-C', repo.git_root, 'status', '--porcelain'], { encoding: 'utf8' }).stdout;
      expect(st.trim()).toBe('');
    }
  });

  test('refresh-only syncs existing CodeGraph indexes and rebuilds Graphify without install/init/exclude mutation', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const initial = makeRunners(ws);
    expect(buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners: initial.runners }).status).toBe('complete');
    const beforeCodegraph = repos.map((repo) => fs.readFileSync(
      path.join(repo.git_root, '.codegraph', 'codegraph.db'),
      'utf8',
    ));
    const refresh = makeRunners(ws);
    const excludeWriter = jest.fn(() => ({ ok: true }));

    const result = buildWorkspaceGraphs({
      workspaceRoot: ws,
      repos,
      runners: refresh.runners,
      excludeWriter,
      refreshOnly: true,
      refreshMode: 'commit-hook-spec-first-async',
    });

    expect(result.status).toBe('complete');
    expect(refresh.calls.install).toBe(0);
    expect(refresh.calls.codegraphInit).toEqual([]);
    expect(refresh.calls.codegraphSync).toEqual(repos.map((repo) => repo.git_root));
    expect(excludeWriter).not.toHaveBeenCalled();
    expect(refresh.calls.graphifyExtract).toHaveLength(2);
    expect(repos.map((repo) => fs.readFileSync(
      path.join(repo.git_root, '.codegraph', 'codegraph.db'),
      'utf8',
    ))).toEqual(beforeCodegraph.map((value, index) => `${value}\nsync:${repos[index].repo_id}`));
    expect(result.state.state.refresh_mode).toBe('commit-hook-spec-first-async');
  });

  test('refresh-only keeps the last completed state readable until the final state is published', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const initial = makeRunners(ws);
    expect(buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners: initial.runners }).status).toBe('complete');
    const refresh = makeRunners(ws);
    const originalExtract = refresh.runners.graphifyExtract;
    const observedStatuses = [];
    refresh.runners.graphifyExtract = (...args) => {
      observedStatuses.push(JSON.parse(fs.readFileSync(
        path.join(ws, 'graphify-out', 'workspace-graph-state.json'),
        'utf8',
      )).operation_status);
      return originalExtract(...args);
    };

    const result = buildWorkspaceGraphs({
      workspaceRoot: ws,
      repos,
      runners: refresh.runners,
      refreshOnly: true,
      refreshMode: 'commit-hook-spec-first-async',
    });

    expect(result.status).toBe('complete');
    expect(observedStatuses).toEqual(['complete', 'complete']);
  });

  test('refresh-only keeps Graphify output but reports partial when a child CodeGraph sync fails', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const initial = makeRunners(ws);
    expect(buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners: initial.runners }).status).toBe('complete');
    const refresh = makeRunners(ws, { failCodegraphSyncFor: ['web'] });

    const result = buildWorkspaceGraphs({
      workspaceRoot: ws,
      repos,
      runners: refresh.runners,
      refreshOnly: true,
      refreshMode: 'commit-hook-spec-first-async',
    });

    expect(result.status).toBe('partial');
    expect(result.reason_code).toBe('workspace-codegraph-sync-partial');
    expect(result.merge.status).toBe('merged');
    expect(result.repos.find((repo) => repo.repo_id === 'web')).toMatchObject({
      codegraph_status: 'failed',
      graphify_status: 'ready',
      reason_code: 'codegraph-sync-failed',
    });
    expect(refresh.calls.install).toBe(0);
    expect(refresh.calls.codegraphInit).toEqual([]);
    expect(refresh.calls.codegraphSync).toEqual(repos.map((repo) => repo.git_root));
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
    expect(fs.existsSync(path.join(ws, 'graphify-out', MERGED_GRAPH_BASENAME))).toBe(false);
  });

  test('a valid Graphify artifact larger than 1 MiB still satisfies the complete gate', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const { runners } = makeRunners(ws);
    runners.graphifyMerge = (_inputs, outPath) => {
      fs.writeFileSync(outPath, JSON.stringify({ padding: 'x'.repeat((1024 * 1024) + 64) }));
      return { ok: true };
    };

    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });

    expect(result.status).toBe('complete');
    expect(result.merge.status).toBe('merged');
  });

  test('a successful merged graph opens the final artifact only for validation and hashing', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const { runners } = makeRunners(ws);
    const mergedPath = path.join(ws, GRAPHIFY_OUT_DIRNAME, MERGED_GRAPH_BASENAME);
    const originalOpenSync = fs.openSync;
    let finalArtifactOpens = 0;
    const openSpy = jest.spyOn(fs, 'openSync').mockImplementation((filePath, ...args) => {
      if (typeof filePath === 'string' && path.resolve(filePath) === mergedPath) {
        finalArtifactOpens += 1;
      }
      return originalOpenSync(filePath, ...args);
    });

    let result;
    try {
      result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });
    } finally {
      openSpy.mockRestore();
    }

    expect(result.status).toBe('complete');
    expect(finalArtifactOpens).toBe(2);
  });

  test('backup cleanup failure cannot roll back an already validated merged graph', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const initial = makeRunners(ws);
    initial.runners.graphifyMerge = (_inputs, outPath) => {
      fs.writeFileSync(outPath, '{"version":1}');
      return { ok: true };
    };
    expect(buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners: initial.runners }).status).toBe('complete');

    const next = makeRunners(ws);
    next.runners.graphifyMerge = (_inputs, outPath) => {
      fs.writeFileSync(outPath, '{"version":2}');
      return { ok: true };
    };
    const mergedPath = path.join(ws, GRAPHIFY_OUT_DIRNAME, MERGED_GRAPH_BASENAME);
    const originalRmSync = fs.rmSync;
    let cleanupBlocked = false;
    const rmSpy = jest.spyOn(fs, 'rmSync').mockImplementation((target, ...args) => {
      if (typeof target === 'string' && target.startsWith(`${mergedPath}.spec-first-previous-`)) {
        cleanupBlocked = true;
        const error = new Error('backup cleanup blocked');
        error.code = 'EACCES';
        throw error;
      }
      return originalRmSync(target, ...args);
    });

    let result;
    try {
      result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners: next.runners });
    } finally {
      rmSpy.mockRestore();
    }

    expect(cleanupBlocked).toBe(true);
    expect(result.status).toBe('partial');
    expect(result.reason_code).toBe('workspace-artifact-backup-cleanup-pending');
    expect(result.merge.promotion_cleanup_pending).toBe(true);
    expect(result.state.state).toMatchObject({
      operation_status: 'partial',
      reason_code: 'workspace-artifact-backup-cleanup-pending',
    });
    expect(JSON.parse(fs.readFileSync(mergedPath, 'utf8'))).toEqual({ version: 2 });
    expect(fs.readdirSync(path.dirname(mergedPath)).some((name) => (
      name.startsWith(`${MERGED_GRAPH_BASENAME}.spec-first-previous-`)
    ))).toBe(true);
  });

  test('provider partial cannot hide promotion cleanup pending from durable state', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const initial = makeRunners(ws);
    expect(buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners: initial.runners }).status).toBe('complete');

    const next = makeRunners(ws, { failCodegraphFor: ['web'] });
    const graphifyOut = path.join(ws, GRAPHIFY_OUT_DIRNAME);
    const originalRmSync = fs.rmSync;
    let blockedCleanupCount = 0;
    const rmSpy = jest.spyOn(fs, 'rmSync').mockImplementation((target, ...args) => {
      if (typeof target === 'string'
        && target.startsWith(graphifyOut)
        && target.includes('.spec-first-previous-')) {
        blockedCleanupCount += 1;
        const error = new Error('backup cleanup blocked');
        error.code = 'EACCES';
        throw error;
      }
      return originalRmSync(target, ...args);
    });

    let result;
    try {
      result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners: next.runners });
    } finally {
      rmSpy.mockRestore();
    }

    expect(blockedCleanupCount).toBeGreaterThan(0);
    expect(result).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-codegraph-build-partial',
    });
    expect(result.state.state.repos).toEqual(expect.arrayContaining([
      expect.objectContaining({
        repo_id: 'web',
        promotion_cleanup_pending: true,
        promotion_cleanup_reason_code: 'promotion-backup-cleanup-pending',
      }),
    ]));
    expect(result.state.state.merge).toMatchObject({
      promotion_cleanup_pending: true,
      promotion_cleanup_reason_code: 'promotion-backup-cleanup-pending',
    });
  });

  test('rollback reports rejected quarantine cleanup pending after restoring the previous merged graph', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const initial = makeRunners(ws);
    initial.runners.graphifyMerge = (_inputs, outPath) => {
      fs.writeFileSync(outPath, '{"version":1}');
      return { ok: true };
    };
    expect(buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners: initial.runners }).status).toBe('complete');

    const next = makeRunners(ws);
    next.runners.graphifyMerge = (_inputs, outPath) => {
      fs.writeFileSync(outPath, '{"version":2}');
      return { ok: true };
    };
    const mergedPath = path.join(ws, GRAPHIFY_OUT_DIRNAME, MERGED_GRAPH_BASENAME);
    const originalRenameSync = fs.renameSync;
    const originalRmSync = fs.rmSync;
    let invalidated = false;
    let rejectedCleanupBlocked = false;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      const result = originalRenameSync(source, target);
      if (!invalidated
        && typeof source === 'string'
        && source.includes(`${path.sep}.build-`)
        && path.resolve(target) === mergedPath) {
        fs.writeFileSync(mergedPath, '{broken');
        invalidated = true;
      }
      return result;
    });
    const rmSpy = jest.spyOn(fs, 'rmSync').mockImplementation((target, ...args) => {
      if (typeof target === 'string' && target.startsWith(`${mergedPath}.spec-first-rejected-`)) {
        rejectedCleanupBlocked = true;
        const error = new Error('rejected cleanup blocked');
        error.code = 'EACCES';
        throw error;
      }
      return originalRmSync(target, ...args);
    });

    let result;
    try {
      result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners: next.runners });
    } finally {
      rmSpy.mockRestore();
      renameSpy.mockRestore();
    }

    expect(invalidated).toBe(true);
    expect(rejectedCleanupBlocked).toBe(true);
    expect(result).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-merge-failed',
      merge: {
        status: 'failed',
        promotion_cleanup_pending: true,
        promotion_cleanup_reason_code: 'promotion-rollback-quarantine-cleanup-pending',
      },
    });
    expect(result.state.state.merge).toMatchObject({
      promotion_cleanup_pending: true,
      promotion_cleanup_reason_code: 'promotion-rollback-quarantine-cleanup-pending',
    });
    expect(JSON.parse(fs.readFileSync(mergedPath, 'utf8'))).toEqual({ version: 1 });
    expect(fs.readdirSync(path.dirname(mergedPath)).some((name) => (
      name.startsWith(`${MERGED_GRAPH_BASENAME}.spec-first-rejected-`)
    ))).toBe(true);
  });

  test('a merged graph changed after promotion validation cannot receive a complete state receipt', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const { runners } = makeRunners(ws);
    const mergedPath = path.join(ws, GRAPHIFY_OUT_DIRNAME, MERGED_GRAPH_BASENAME);
    const originalOpenSync = fs.openSync;
    let finalArtifactOpens = 0;
    const openSpy = jest.spyOn(fs, 'openSync').mockImplementation((filePath, ...args) => {
      if (typeof filePath === 'string' && path.resolve(filePath) === mergedPath) {
        finalArtifactOpens += 1;
        if (finalArtifactOpens === 2) fs.writeFileSync(mergedPath, '{broken');
      }
      return originalOpenSync(filePath, ...args);
    });

    let result;
    try {
      result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });
    } finally {
      openSpy.mockRestore();
    }

    expect(finalArtifactOpens).toBe(2);
    expect(result.status).toBe('partial');
    expect(result.reason_code).toBe('workspace-merged-artifact-changed-before-state');
    expect(result.state.state).toMatchObject({
      operation_status: 'partial',
      reason_code: 'workspace-merged-artifact-changed-before-state',
    });
  });

  test('directory validation failure quarantines the new target before restoring the previous subgraph', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api')];
    const initial = makeRunners(ws);
    initial.runners.graphifyExtract = (_repoRoot, outDir) => {
      const graphPath = path.join(outDir, GRAPHIFY_OUT_DIRNAME, 'graph.json');
      fs.mkdirSync(path.dirname(graphPath), { recursive: true });
      fs.writeFileSync(graphPath, '{"version":1}');
      return { ok: true, graphPath };
    };
    expect(buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners: initial.runners }).status).toBe('complete');

    const next = makeRunners(ws);
    next.runners.graphifyExtract = (_repoRoot, outDir) => {
      const graphPath = path.join(outDir, GRAPHIFY_OUT_DIRNAME, 'graph.json');
      fs.mkdirSync(path.dirname(graphPath), { recursive: true });
      fs.writeFileSync(graphPath, '{"version":2}');
      return { ok: true, graphPath };
    };
    const finalOutDir = path.join(ws, GRAPHIFY_OUT_DIRNAME, 'api');
    const finalGraphPath = path.join(finalOutDir, GRAPHIFY_OUT_DIRNAME, 'graph.json');
    const originalRenameSync = fs.renameSync;
    const originalRmSync = fs.rmSync;
    let invalidated = false;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      const result = originalRenameSync(source, target);
      if (!invalidated
        && typeof source === 'string'
        && source.includes(`${path.sep}.build-`)
        && path.resolve(target) === finalOutDir) {
        fs.writeFileSync(finalGraphPath, '{broken');
        invalidated = true;
      }
      return result;
    });
    const rmSpy = jest.spyOn(fs, 'rmSync').mockImplementation((target, ...args) => {
      if (typeof target === 'string' && path.resolve(target) === finalOutDir) {
        const error = new Error('canonical target deletion blocked');
        error.code = 'EACCES';
        throw error;
      }
      return originalRmSync(target, ...args);
    });

    let result;
    try {
      result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners: next.runners });
    } finally {
      rmSpy.mockRestore();
      renameSpy.mockRestore();
    }

    expect(invalidated).toBe(true);
    expect(result.repos[0].graphify_status).toBe('failed');
    expect(JSON.parse(fs.readFileSync(finalGraphPath, 'utf8'))).toEqual({ version: 1 });
  });

  test('source promotion failure restores the previous target after creating a backup', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api')];
    const initial = makeRunners(ws);
    initial.runners.graphifyExtract = (_repoRoot, outDir) => {
      const graphPath = path.join(outDir, GRAPHIFY_OUT_DIRNAME, 'graph.json');
      fs.mkdirSync(path.dirname(graphPath), { recursive: true });
      fs.writeFileSync(graphPath, '{"version":1}');
      return { ok: true, graphPath };
    };
    expect(buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners: initial.runners }).status).toBe('complete');

    const next = makeRunners(ws);
    const finalOutDir = path.join(ws, GRAPHIFY_OUT_DIRNAME, 'api');
    const finalGraphPath = path.join(finalOutDir, GRAPHIFY_OUT_DIRNAME, 'graph.json');
    const originalRenameSync = fs.renameSync;
    let promotionBlocked = false;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      if (!promotionBlocked
        && typeof source === 'string'
        && source.includes(`${path.sep}.build-`)
        && path.resolve(target) === finalOutDir) {
        promotionBlocked = true;
        const error = new Error('promotion blocked');
        error.code = 'EACCES';
        throw error;
      }
      return originalRenameSync(source, target);
    });

    let result;
    try {
      result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners: next.runners });
    } finally {
      renameSpy.mockRestore();
    }

    expect(promotionBlocked).toBe(true);
    expect(result.repos[0].graphify_status).toBe('failed');
    expect(JSON.parse(fs.readFileSync(finalGraphPath, 'utf8'))).toEqual({ version: 1 });
  });

  test('a large merged graph with valid braces but invalid middle content cannot be promoted', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const { runners } = makeRunners(ws);
    runners.graphifyMerge = (_inputs, outPath) => {
      fs.writeFileSync(outPath, `{"nodes":[${' '.repeat((1024 * 1024) + 64)}broken]}`);
      return { ok: true };
    };

    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });

    expect(result.status).toBe('partial');
    expect(result.merge).toEqual(expect.objectContaining({
      status: 'failed',
      reason_code: 'workspace-merged-graph-invalid',
    }));
    expect(fs.existsSync(path.join(ws, 'graphify-out', MERGED_GRAPH_BASENAME))).toBe(false);
  });

  test('a large subgraph with valid braces but invalid middle content cannot be promoted', () => {
    const ws = mkWorkspace();
    const repo = initRepo(ws, 'api');
    const { runners } = makeRunners(ws);
    runners.graphifyExtract = (_repoRoot, outDir) => {
      const graphPath = path.join(outDir, 'graphify-out', 'graph.json');
      fs.mkdirSync(path.dirname(graphPath), { recursive: true });
      fs.writeFileSync(graphPath, `{"nodes":[${' '.repeat((1024 * 1024) + 64)}broken]}`);
      return { ok: true, graphPath };
    };

    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos: [repo], runners });

    expect(result.status).toBe('partial');
    expect(result.repos[0]).toEqual(expect.objectContaining({
      graphify_status: 'failed',
      reason_code: 'graphify-subgraph-invalid',
    }));
  });

  const posixArtifactSymlinkTest = process.platform === 'win32' ? test.skip : test;
  posixArtifactSymlinkTest('a merge provider symlink cannot be promoted as a regular artifact', () => {
    const ws = mkWorkspace();
    const repos = [initRepo(ws, 'api'), initRepo(ws, 'web')];
    const { runners } = makeRunners(ws);
    const outside = path.join(mkWorkspace(), 'external-merged.json');
    fs.writeFileSync(outside, '{"external":true}');
    runners.graphifyMerge = (_inputs, outPath) => {
      fs.symlinkSync(outside, outPath);
      return { ok: true };
    };

    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos, runners });

    expect(result.status).toBe('partial');
    expect(result.merge).toEqual(expect.objectContaining({
      status: 'failed',
      reason_code: 'workspace-merged-graph-invalid',
    }));
  });

  posixArtifactSymlinkTest('a validated subgraph directory swapped to an external symlink cannot be promoted', () => {
    const ws = mkWorkspace();
    const repo = initRepo(ws, 'api');
    const { runners } = makeRunners(ws);
    const outside = mkWorkspace();
    const outsideGraph = path.join(outside, GRAPHIFY_OUT_DIRNAME, 'graph.json');
    fs.mkdirSync(path.dirname(outsideGraph), { recursive: true });
    fs.writeFileSync(outsideGraph, '{"outside":true}');
    let stagedOutDir = null;
    const originalExtract = runners.graphifyExtract;
    runners.graphifyExtract = (...args) => {
      stagedOutDir = args[1];
      return originalExtract(...args);
    };

    const originalRenameSync = fs.renameSync;
    let swapped = false;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      if (!swapped
        && stagedOutDir
        && path.resolve(source) === path.resolve(stagedOutDir)
        && path.resolve(target) === path.join(ws, GRAPHIFY_OUT_DIRNAME, 'api')) {
        originalRenameSync(source, `${source}.before-swap`);
        fs.symlinkSync(outside, source, 'dir');
        swapped = true;
      }
      return originalRenameSync(source, target);
    });

    let result;
    try {
      result = buildWorkspaceGraphs({ workspaceRoot: ws, repos: [repo], runners });
    } finally {
      renameSpy.mockRestore();
    }

    const finalOutDir = path.join(ws, GRAPHIFY_OUT_DIRNAME, 'api');
    expect(swapped).toBe(true);
    expect(result.status).toBe('partial');
    expect(result.repos[0]).toEqual(expect.objectContaining({
      graphify_status: 'failed',
      reason_code: 'graphify-subgraph-promote-failed',
    }));
    expect(fs.existsSync(finalOutDir) && fs.lstatSync(finalOutDir).isSymbolicLink()).toBe(false);
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
          fs.writeFileSync(path.join(repo.git_root, '.codegraph', 'codegraph.db'), 'x');
          return { ok: true };
        },
        graphifyExtract: (_root, outDir) => {
          const graphPath = path.join(outDir, 'graphify-out', 'graph.json');
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
    const staleSubgraph = path.join(ws, 'graphify-out', 'api', 'graphify-out', 'graph.json');
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
          const graphPath = path.join(outDir, 'graphify-out', 'graph.json');
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

  test('junk-only or empty CodeGraph output cannot satisfy a successful provider result', () => {
    for (const artifact of ['diagnostic.log', 'codegraph.db']) {
      const ws = mkWorkspace();
      const repo = initRepo(ws, 'api');
      const { runners } = makeRunners(ws);
      runners.codegraphInit = () => {
        fs.mkdirSync(path.join(repo.git_root, '.codegraph'), { recursive: true });
        fs.writeFileSync(path.join(repo.git_root, '.codegraph', artifact), artifact === 'codegraph.db' ? '' : 'ok');
        return { ok: true };
      };

      const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos: [repo], runners });

      expect(result.repos[0].codegraph_status).toBe('failed');
      expect(result.repos[0].reason_code).toBe('codegraph-artifact-missing');
      expect(result.status).toBe('partial');
    }
  });

  posixArtifactSymlinkTest('a CodeGraph database symlink cannot satisfy a successful provider result', () => {
    const ws = mkWorkspace();
    const repo = initRepo(ws, 'api');
    const { runners } = makeRunners(ws);
    const outside = path.join(mkWorkspace(), 'external-codegraph.db');
    fs.writeFileSync(outside, 'external');
    runners.codegraphInit = () => {
      fs.mkdirSync(path.join(repo.git_root, '.codegraph'), { recursive: true });
      fs.symlinkSync(outside, path.join(repo.git_root, '.codegraph', 'codegraph.db'));
      return { ok: true };
    };

    const result = buildWorkspaceGraphs({ workspaceRoot: ws, repos: [repo], runners });

    expect(result.repos[0].codegraph_status).toBe('failed');
    expect(result.repos[0].reason_code).toBe('codegraph-artifact-missing');
    expect(result.status).toBe('partial');
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
