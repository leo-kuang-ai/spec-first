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

const GRAPHIFY_OUT_DIRNAME = '.graphify';
const MERGED_GRAPH_BASENAME = 'merged-graph.json';

function buildWorkspaceGraphs({ workspaceRoot, repos = [], runners = {} } = {}) {
  const graphifyOut = path.join(workspaceRoot, GRAPHIFY_OUT_DIRNAME);
  assertContainedPath(workspaceRoot, graphifyOut, { reasonCode: 'graphify-out-escapes-workspace' });
  fs.mkdirSync(graphifyOut, { recursive: true });

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
    const excl = safe(() => addManagedExclude(repo.git_root, workspaceRoot)) || { ok: false, reason_code: 'exclude-threw' };
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
      repoResult.graphify_status = gf.ok ? 'ready' : 'failed';
      if (gf.ok) {
        const subgraphPath = gf.graphPath || path.join(outDir, GRAPHIFY_OUT_DIRNAME, 'graph.json');
        repoResult.subgraph_path = subgraphPath;
        subgraphs.push(subgraphPath);
      } else if (!repoResult.reason_code) {
        repoResult.reason_code = gf.reason_code || 'graphify-extract-failed';
      }
    }

    repoResults.push(repoResult);
  }

  // 4. Workspace merged graph. Zero → skip; single → from the lone subgraph; many → merge.
  const mergedPath = path.join(graphifyOut, MERGED_GRAPH_BASENAME);
  let merge;
  if (subgraphs.length === 0) {
    merge = { status: 'not-applicable', reason_code: 'no-eligible-subgraphs', merged_graph_path: null };
  } else if (subgraphs.length === 1) {
    const single = runMerge(runners.graphifyMerge, subgraphs, mergedPath);
    merge = single.ok
      ? { status: 'single-source', merged_graph_path: mergedPath, cross_repo_layer: false }
      : { status: 'failed', reason_code: single.reason_code || 'merge-failed', merged_graph_path: null };
  } else {
    const many = runMerge(runners.graphifyMerge, subgraphs, mergedPath);
    merge = many.ok
      ? { status: 'merged', merged_graph_path: mergedPath, cross_repo_layer: true }
      : { status: 'failed', reason_code: many.reason_code || 'merge-failed', merged_graph_path: null };
  }

  const anyReady = repoResults.some((r) => r.codegraph_status === 'ready' || r.graphify_status === 'ready');
  const allReady = repoResults.length > 0
    && repoResults.every((r) => r.codegraph_status === 'ready' && r.graphify_status === 'ready');

  return {
    schema_version: 'workspace-graph-build.v1',
    workspace_root: workspaceRoot,
    graphify_out: graphifyOut,
    global_codegraph_install: globalInstall,
    repos: repoResults,
    merge,
    status: allReady ? 'complete' : (anyReady ? 'partial' : 'failed'),
    reason_code: allReady ? '' : (anyReady ? 'workspace-build-partial' : 'workspace-build-failed'),
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
  GRAPHIFY_OUT_DIRNAME,
  MERGED_GRAPH_BASENAME,
};
