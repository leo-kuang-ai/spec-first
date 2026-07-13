'use strict';

// U2 — Eager two-layer graph build orchestration.
//
// Given the resolved child repos (U1), build:
//   - per-child CodeGraph tactical graph (工程N/.codegraph/), then add the
//     managed `.git/info/exclude` line so `git status` stays clean;
//   - per-child Graphify subgraph, out-of-tree at <ws>/.graphify/<repo_id>;
//   - one workspace merged Graphify graph at <ws>/.graphify/merged-graph.json;
//   - a single global CodeGraph MCP install.
//
// Provider invocation is injected (`runners`) so the orchestration contract —
// ordering, out-of-tree paths, merge behavior (zero/single/many), per-repo
// failure isolation, and global-install-once — is unit-testable without real
// codegraph/graphify binaries. The real runners live in the providers; this
// module owns the workspace-level sequencing and never lets one child's failure
// fail the batch.

const fs = require('node:fs');
const path = require('node:path');
const { assertContainedPath } = require('./path-safety.cjs');
const { addManagedExclude } = require('./workspace-git-exclude.cjs');
const { writeWorkspaceGraphState } = require('./workspace-graph-state.cjs');

const GRAPHIFY_OUT_DIRNAME = '.graphify';
const MERGED_GRAPH_BASENAME = 'merged-graph.json';

function buildWorkspaceGraphs({
  workspaceRoot,
  repos = [],
  runners = {},
  excludeWriter = addManagedExclude,
  stateWriter = writeWorkspaceGraphState,
} = {}) {
  const graphifyOut = path.join(workspaceRoot, GRAPHIFY_OUT_DIRNAME);
  assertContainedPath(workspaceRoot, graphifyOut, { reasonCode: 'graphify-out-escapes-workspace' });
  fs.mkdirSync(graphifyOut, { recursive: true });
  const initialState = safe(() => stateWriter({
    workspaceRoot,
    operationStatus: 'building',
    reasonCode: 'workspace-build-in-progress',
    repos,
  })) || { ok: false, reason_code: 'workspace-state-write-failed' };

  // Global CodeGraph MCP install happens once, not per child (KTD2).
  let globalInstall = { ok: true, skipped: true };
  if (typeof runners.codegraphInstallGlobal === 'function') {
    globalInstall = safe(() => runners.codegraphInstallGlobal()) || { ok: false, reason_code: 'codegraph-install-threw' };
  }

  const repoResults = [];
  const subgraphs = [];

  for (const repo of repos) {
    const repoResult = {
      repo_id: repo.repo_id,
      git_root: repo.git_root,
      codegraph_status: 'skipped',
      exclude_status: 'skipped',
      graphify_status: 'skipped',
      subgraph_path: null,
      reason_code: '',
    };

    // 1. CodeGraph per-child init (isolated failure).
    const cg = runProvider(runners.codegraphInit, repo.git_root);
    repoResult.codegraph_status = cg.ok ? 'ready' : 'failed';
    if (!cg.ok) repoResult.reason_code = cg.reason_code || 'codegraph-init-failed';

    // 2. Managed exclude (only meaningful once .codegraph/ can exist; still safe to add first).
    const excl = safe(() => excludeWriter(repo.git_root, workspaceRoot)) || { ok: false, reason_code: 'exclude-threw' };
    repoResult.exclude_status = excl.ok ? 'applied' : 'failed';
    if (!excl.ok && !repoResult.reason_code) repoResult.reason_code = excl.reason_code || 'exclude-failed';

    // 3. Graphify per-child subgraph, out-of-tree.
    const outDir = path.join(graphifyOut, sanitizeRepoDir(repo.repo_id));
    let outSafe = true;
    try {
      assertContainedPath(workspaceRoot, outDir, { reasonCode: 'graphify-subgraph-escapes-workspace' });
    } catch (_error) {
      outSafe = false;
    }
    if (!outSafe) {
      repoResult.graphify_status = 'failed';
      if (!repoResult.reason_code) repoResult.reason_code = 'graphify-subgraph-escapes-workspace';
    } else {
      const gf = runProvider(runners.graphifyExtract, repo.git_root, outDir);
      if (gf.ok) {
        const subgraphPath = gf.graphPath || path.join(outDir, GRAPHIFY_OUT_DIRNAME, 'graph.json');
        try {
          assertContainedPath(workspaceRoot, subgraphPath, { reasonCode: 'graphify-subgraph-escapes-workspace' });
          if (!fs.existsSync(subgraphPath)) throw new Error('graphify-subgraph-missing');
          repoResult.graphify_status = 'ready';
          repoResult.subgraph_path = subgraphPath;
          subgraphs.push(subgraphPath);
        } catch (error) {
          repoResult.graphify_status = 'failed';
          if (!repoResult.reason_code) {
            repoResult.reason_code = error.reason_code || error.message || 'graphify-subgraph-missing';
          }
        }
      } else {
        repoResult.graphify_status = 'failed';
        if (!repoResult.reason_code) repoResult.reason_code = gf.reason_code || 'graphify-extract-failed';
      }
    }

    repoResults.push(repoResult);
  }

  // 4. Workspace merged graph. Zero → skip; single → from the lone subgraph; many → merge.
  // Runner ok alone is not enough: require the merged artifact to exist on disk.
  const mergedPath = path.join(graphifyOut, MERGED_GRAPH_BASENAME);
  let merge;
  if (subgraphs.length === 0) {
    merge = { status: 'not-applicable', reason_code: 'no-eligible-subgraphs', merged_graph_path: null };
  } else if (subgraphs.length === 1) {
    merge = finalizeMergeResult(
      runMerge(runners.graphifyMerge, subgraphs, mergedPath),
      mergedPath,
      { status: 'single-source', cross_repo_layer: false },
    );
  } else {
    merge = finalizeMergeResult(
      runMerge(runners.graphifyMerge, subgraphs, mergedPath),
      mergedPath,
      { status: 'merged', cross_repo_layer: true },
    );
  }

  const outcome = deriveWorkspaceBuildOutcome({ repoResults, merge, globalInstall });
  const finalState = safe(() => stateWriter({
    workspaceRoot,
    operationStatus: outcome.status,
    reasonCode: outcome.reason_code,
    repos: repoResults,
    merge,
  })) || { ok: false, reason_code: 'workspace-state-write-failed' };
  if (!finalState.ok) {
    outcome.status = outcome.status === 'failed' ? 'failed' : 'partial';
    outcome.reason_code = finalState.reason_code || 'workspace-state-write-failed';
  }

  return {
    schema_version: 'workspace-graph-build.v1',
    workspace_root: workspaceRoot,
    graphify_out: graphifyOut,
    global_codegraph_install: globalInstall,
    repos: repoResults,
    merge,
    state: finalState,
    initial_state: initialState,
    status: outcome.status,
    reason_code: outcome.reason_code,
  };
}

function deriveWorkspaceBuildOutcome({ repoResults, merge, globalInstall }) {
  const anyReady = repoResults.some((repo) => (
    repo.codegraph_status === 'ready' || repo.graphify_status === 'ready'
  ));
  const globalReady = globalInstall && globalInstall.ok === true;
  const childrenReady = repoResults.length > 0 && repoResults.every((repo) => (
    repo.codegraph_status === 'ready'
    && repo.exclude_status === 'applied'
    && repo.graphify_status === 'ready'
  ));
  const mergeReady = merge && ['merged', 'single-source'].includes(merge.status);
  if (globalReady && childrenReady && mergeReady) {
    return { status: 'complete', reason_code: '' };
  }

  let reasonCode = 'workspace-build-partial';
  if (!globalReady) reasonCode = 'workspace-codegraph-install-failed';
  else if (repoResults.some((repo) => repo.exclude_status === 'failed')) reasonCode = 'workspace-exclude-failed';
  else if (merge && merge.status === 'failed') reasonCode = 'workspace-merge-failed';
  else if (repoResults.some((repo) => repo.codegraph_status === 'failed')) reasonCode = 'workspace-codegraph-build-partial';
  else if (repoResults.some((repo) => repo.graphify_status === 'failed')) reasonCode = 'workspace-graphify-build-partial';
  else if (!mergeReady) reasonCode = 'workspace-merge-unavailable';

  return {
    status: anyReady ? 'partial' : 'failed',
    reason_code: anyReady ? reasonCode : 'workspace-build-failed',
  };
}

function runProvider(fn, ...args) {
  if (typeof fn !== 'function') return { ok: false, reason_code: 'provider-runner-missing' };
  const result = safe(() => fn(...args));
  if (!result) return { ok: false, reason_code: 'provider-runner-threw' };
  return result;
}

function runMerge(fn, inputs, outPath) {
  if (typeof fn !== 'function') return { ok: false, reason_code: 'merge-runner-missing' };
  const result = safe(() => fn(inputs, outPath));
  if (!result) return { ok: false, reason_code: 'merge-runner-threw' };
  return result;
}

function finalizeMergeResult(result, mergedPath, successShape) {
  if (!result || !result.ok) {
    return {
      status: 'failed',
      reason_code: (result && result.reason_code) || 'merge-failed',
      merged_graph_path: null,
    };
  }
  if (!fs.existsSync(mergedPath)) {
    return {
      status: 'failed',
      reason_code: 'workspace-merged-graph-missing',
      merged_graph_path: null,
    };
  }
  return {
    status: successShape.status,
    merged_graph_path: mergedPath,
    cross_repo_layer: successShape.cross_repo_layer,
  };
}

function safe(fn) {
  try {
    return fn();
  } catch (_error) {
    return null;
  }
}

function sanitizeRepoDir(repoId) {
  // repo_id is a workspace-relative POSIX path; keep it as a nested dir under .graphify/
  // but never allow it to climb out.
  return String(repoId).replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.\.(\/|$)/g, '');
}

module.exports = {
  buildWorkspaceGraphs,
  deriveWorkspaceBuildOutcome,
  GRAPHIFY_OUT_DIRNAME,
  MERGED_GRAPH_BASENAME,
};
