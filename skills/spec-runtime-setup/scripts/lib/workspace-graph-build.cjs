'use strict';

// U2 — Eager two-layer graph build orchestration.
//
// Given the resolved child repos (U1), build:
//   - per-child CodeGraph tactical graph (工程N/.codegraph/), then add the
//     managed `.git/info/exclude` line so `git status` stays clean;
//   - per-child Graphify subgraph, out-of-tree at <ws>/graphify-out/<repo_id>;
//   - one workspace merged Graphify graph at <ws>/graphify-out/merged-graph.json;
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
const {
  inspectRepoSnapshot,
  readWorkspaceGraphState,
  writeWorkspaceGraphState,
} = require('./workspace-graph-state.cjs');
const {
  codegraphArtifactHasContent,
  jsonFileHasContent,
  jsonFileReceipt,
} = require('./workspace-graph-artifacts.cjs');

const GRAPHIFY_OUT_DIRNAME = 'graphify-out';
const MERGED_GRAPH_BASENAME = 'merged-graph.json';

function buildWorkspaceGraphs({
  workspaceRoot,
  repos = [],
  runners = {},
  excludeWriter = addManagedExclude,
  stateWriter = writeWorkspaceGraphState,
  refreshOnly = false,
  refreshMode = 'explicit',
  refreshHook = null,
  deferFinalState = false,
} = {}) {
  const graphifyOut = path.join(workspaceRoot, GRAPHIFY_OUT_DIRNAME);
  assertContainedPath(workspaceRoot, graphifyOut, { reasonCode: 'graphify-out-escapes-workspace' });
  fs.mkdirSync(graphifyOut, { recursive: true });
  const stagingRoot = path.join(graphifyOut, `.build-${process.pid}-${Date.now()}`);
  assertContainedPath(workspaceRoot, stagingRoot, { reasonCode: 'graphify-staging-escapes-workspace' });
  fs.mkdirSync(stagingRoot, { recursive: true });
  const previousState = refreshOnly ? readWorkspaceGraphState(workspaceRoot) : null;
  const previousRepos = new Map(
    previousState && previousState.status === 'ready'
      ? previousState.state.repos.map((repo) => [repo.repo_id, repo])
      : [],
  );
  const stateRepos = refreshOnly
    ? repos.map((repo) => ({ ...repo, ...preservedCodegraphState(previousRepos.get(repo.repo_id)) }))
    : repos;
  const initialState = refreshOnly
    ? {
      ok: true,
      path: previousState && previousState.path ? previousState.path : null,
      state: { repos: repos.map((repo) => inspectRepoSnapshot(repo)) },
    }
    : (safe(() => stateWriter({
      workspaceRoot,
      operationStatus: 'building',
      reasonCode: 'workspace-build-in-progress',
      repos: stateRepos,
      refreshMode,
      refreshHook,
    })) || { ok: false, reason_code: 'workspace-state-write-failed' });

  // Global CodeGraph MCP install happens once, not per child (KTD2).
  let globalInstall = {
    ok: true,
    skipped: true,
    reason_code: refreshOnly ? 'workspace-refresh-only' : null,
  };
  if (!refreshOnly && typeof runners.codegraphInstallGlobal === 'function') {
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
      promotion_cleanup_pending: false,
      promotion_cleanup_reason_code: '',
      reason_code: '',
    };

    if (refreshOnly) {
      const preserved = preservedCodegraphState(previousRepos.get(repo.repo_id));
      const cg = syncExistingCodegraph(
        runners.codegraphSync,
        repo.git_root,
        workspaceRoot,
      );
      repoResult.codegraph_status = cg.ok ? 'ready' : 'failed';
      repoResult.exclude_status = preserved.exclude_status;
      if (!cg.ok) repoResult.reason_code = cg.reason_code || 'codegraph-sync-failed';
      else if (preserved.exclude_status !== 'applied') repoResult.reason_code = preserved.reason_code;
    } else {
      // 1. CodeGraph per-child init (isolated failure).
      const cg = runFreshCodegraph(runners.codegraphInit, repo.git_root, workspaceRoot);
      repoResult.codegraph_status = cg.ok ? 'ready' : 'failed';
      if (!cg.ok) repoResult.reason_code = cg.reason_code || 'codegraph-init-failed';

      // 2. Managed exclude (only meaningful once .codegraph/ can exist; still safe to add first).
      const excl = safe(() => excludeWriter(repo.git_root, workspaceRoot)) || { ok: false, reason_code: 'exclude-threw' };
      repoResult.exclude_status = excl.ok ? 'applied' : 'failed';
      if (!excl.ok && !repoResult.reason_code) repoResult.reason_code = excl.reason_code || 'exclude-failed';
    }

    // 3. Graphify per-child subgraph, out-of-tree.
    const repoOutputName = sanitizeRepoDir(repo.repo_id);
    const outDir = path.join(stagingRoot, repoOutputName);
    const finalOutDir = path.join(graphifyOut, repoOutputName);
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
          if (!jsonFileHasContent(subgraphPath, workspaceRoot)) throw reasonError('graphify-subgraph-invalid');
          const relativeSubgraphPath = path.relative(outDir, subgraphPath);
          const finalSubgraphPath = path.join(finalOutDir, relativeSubgraphPath);
          const promoted = promotePath(outDir, finalOutDir, {
            validateTarget: () => {
              assertContainedPath(workspaceRoot, finalSubgraphPath, {
                reasonCode: 'graphify-subgraph-escapes-workspace',
              });
              return jsonFileHasContent(finalSubgraphPath, workspaceRoot);
            },
          });
          repoResult.promotion_cleanup_pending = promoted.cleanup_pending === true;
          repoResult.promotion_cleanup_reason_code = promoted.cleanup_reason_code || '';
          if (!promoted.ok) throw reasonError('graphify-subgraph-promote-failed');
          repoResult.graphify_status = 'ready';
          repoResult.subgraph_path = finalSubgraphPath;
          subgraphs.push(finalSubgraphPath);
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
  const stagedMergedPath = path.join(stagingRoot, MERGED_GRAPH_BASENAME);
  let merge;
  let mergePromotion = null;
  if (subgraphs.length === 0) {
    merge = { status: 'not-applicable', reason_code: 'no-eligible-subgraphs', merged_graph_path: null };
  } else if (subgraphs.length === 1) {
    mergePromotion = promoteMerge(runners.graphifyMerge, subgraphs, stagedMergedPath, mergedPath, workspaceRoot);
    merge = finalizeMergeResult(
      mergePromotion,
      mergedPath,
      { status: 'single-source', cross_repo_layer: false },
      workspaceRoot,
    );
  } else {
    mergePromotion = promoteMerge(runners.graphifyMerge, subgraphs, stagedMergedPath, mergedPath, workspaceRoot);
    merge = finalizeMergeResult(
      mergePromotion,
      mergedPath,
      { status: 'merged', cross_repo_layer: true },
      workspaceRoot,
    );
  }
  const mergedArtifactReceipt = mergePromotion && mergePromotion.artifact_receipt
    ? mergePromotion.artifact_receipt
    : null;

  const outcome = deriveWorkspaceBuildOutcome({
    repoResults,
    merge,
    globalInstall,
    refreshOnly,
  });
  const sourceSnapshotCheck = inspectSourceSnapshots(initialState, repos);
  if (outcome.status === 'complete' && !sourceSnapshotCheck.stable) {
    outcome.status = 'partial';
    outcome.reason_code = 'workspace-source-changed-during-build';
  }
  const finalState = deferFinalState
    ? { ok: true, deferred: true, path: initialState.path || null, state: null }
    : (safe(() => stateWriter({
      workspaceRoot,
      operationStatus: outcome.status,
      reasonCode: outcome.reason_code,
      repos: repoResults,
      merge,
      mergedArtifactReceipt,
      refreshMode,
      refreshHook,
      expectedRepos: sourceSnapshotCheck.repos,
    })) || { ok: false, reason_code: 'workspace-state-write-failed' });
  if (!deferFinalState && finalState.ok && finalState.state
    && finalState.state.operation_status !== outcome.status) {
    outcome.status = finalState.state.operation_status;
    outcome.reason_code = finalState.state.reason_code;
  } else if (!finalState.ok) {
    outcome.status = outcome.status === 'failed' ? 'failed' : 'partial';
    outcome.reason_code = finalState.reason_code || 'workspace-state-write-failed';
  }
  safe(() => fs.rmSync(stagingRoot, { recursive: true, force: true }));

  const result = {
    schema_version: 'workspace-graph-build.v1',
    workspace_root: workspaceRoot,
    graphify_out: graphifyOut,
    global_codegraph_install: globalInstall,
    repos: repoResults,
    merge,
    state: finalState,
    initial_state: initialState,
    expected_repos: sourceSnapshotCheck.repos,
    status: outcome.status,
    reason_code: outcome.reason_code,
  };
  Object.defineProperty(result, 'merged_artifact_receipt', {
    value: mergedArtifactReceipt,
    enumerable: false,
  });
  return result;
}

function preservedCodegraphState(previous) {
  if (!previous) {
    return {
      codegraph_status: 'unknown',
      exclude_status: 'unknown',
      reason_code: 'workspace-refresh-baseline-missing',
    };
  }
  const codegraphStatus = previous.codegraph_status || 'unknown';
  const excludeStatus = previous.exclude_status || 'unknown';
  return {
    codegraph_status: codegraphStatus,
    exclude_status: excludeStatus,
    reason_code: codegraphStatus === 'ready' && excludeStatus === 'applied'
      ? ''
      : (previous.reason_code || 'workspace-refresh-codegraph-baseline-not-ready'),
  };
}

function inspectSourceSnapshots(initialState, repos) {
  const current = repos.map((repo) => inspectRepoSnapshot(repo));
  if (!initialState.ok || !initialState.state || !Array.isArray(initialState.state.repos)) {
    return { stable: false, repos: current };
  }
  const initialById = new Map(initialState.state.repos.map((repo) => [repo.repo_id, repo]));
  return {
    stable: current.every((after) => {
      const before = initialById.get(after.repo_id);
      return before
        && before.observed
        && after.observed
        && before.head_state === after.head_state
        && before.head_sha === after.head_sha
        && before.worktree_fingerprint === after.worktree_fingerprint;
    }),
    repos: current,
  };
}

function runFreshCodegraph(fn, repoRoot, workspaceRoot) {
  const target = path.join(repoRoot, '.codegraph');
  const backup = `${target}.spec-first-previous-${process.pid}-${Date.now()}`;
  try {
    assertContainedPath(workspaceRoot, target, { reasonCode: 'codegraph-target-escapes-workspace' });
    if (fs.existsSync(target)) fs.renameSync(target, backup);
    const result = runProvider(fn, repoRoot);
    if (!result.ok || !codegraphArtifactHasContent(repoRoot, workspaceRoot)) {
      fs.rmSync(target, { recursive: true, force: true });
      if (fs.existsSync(backup)) fs.renameSync(backup, target);
      return result.ok ? { ok: false, reason_code: 'codegraph-artifact-missing' } : result;
    }
    fs.rmSync(backup, { recursive: true, force: true });
    return result;
  } catch (error) {
    safe(() => fs.rmSync(target, { recursive: true, force: true }));
    if (fs.existsSync(backup)) safe(() => fs.renameSync(backup, target));
    return { ok: false, reason_code: error.reason_code || 'codegraph-refresh-failed' };
  }
}

function syncExistingCodegraph(fn, repoRoot, workspaceRoot) {
  const target = path.join(repoRoot, '.codegraph');
  try {
    assertContainedPath(workspaceRoot, target, { reasonCode: 'codegraph-target-escapes-workspace' });
    if (!codegraphArtifactHasContent(repoRoot, workspaceRoot)) {
      return { ok: false, reason_code: 'codegraph-artifact-missing' };
    }
    const result = runProvider(fn, repoRoot);
    if (!result.ok) return result;
    return codegraphArtifactHasContent(repoRoot, workspaceRoot)
      ? result
      : { ok: false, reason_code: 'codegraph-artifact-missing' };
  } catch (error) {
    return { ok: false, reason_code: error.reason_code || 'codegraph-sync-failed' };
  }
}

function promoteMerge(fn, inputs, stagedPath, finalPath, workspaceRoot) {
  const result = runMerge(fn, inputs, stagedPath);
  if (!result.ok) return result;
  if (!jsonFileHasContent(stagedPath, workspaceRoot)) {
    return { ok: false, reason_code: 'workspace-merged-graph-invalid' };
  }
  let artifactReceipt = null;
  const promoted = promotePath(stagedPath, finalPath, {
    validateTarget: () => {
      artifactReceipt = jsonFileReceipt(finalPath, workspaceRoot);
      return artifactReceipt !== null;
    },
  });
  return promoted.ok
    ? {
      ok: true,
      artifact_receipt: artifactReceipt,
      promotion_cleanup_pending: promoted.cleanup_pending === true,
      promotion_cleanup_reason_code: promoted.cleanup_reason_code || '',
    }
    : {
      ok: false,
      reason_code: 'workspace-merge-promote-failed',
      promotion_cleanup_pending: promoted.cleanup_pending === true,
      promotion_cleanup_reason_code: promoted.cleanup_reason_code || '',
    };
}

function promotePath(source, target, { validateTarget = () => true } = {}) {
  const backup = `${target}.spec-first-previous-${process.pid}-${Date.now()}`;
  let descriptor = null;
  let backupCreated = false;
  let sourcePromoted = false;
  try {
    const sourceItem = fs.lstatSync(source);
    if (sourceItem.isSymbolicLink() || (!sourceItem.isDirectory() && !sourceItem.isFile())) {
      return { ok: false };
    }
    if (process.platform !== 'win32' || sourceItem.isFile()) {
      const flags = fs.constants.O_RDONLY
        | (fs.constants.O_NOFOLLOW || 0)
        | (sourceItem.isDirectory() ? (fs.constants.O_DIRECTORY || 0) : 0);
      descriptor = fs.openSync(source, flags);
      const opened = fs.fstatSync(descriptor);
      if (!samePathIdentity(sourceItem, opened)) return { ok: false };
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    try {
      fs.renameSync(target, backup);
      backupCreated = true;
    } catch (error) {
      if (!error || error.code !== 'ENOENT') throw error;
    }
    fs.renameSync(source, target);
    sourcePromoted = true;
    const promotedItem = fs.lstatSync(target);
    const sourceIdentity = descriptor === null ? sourceItem : fs.fstatSync(descriptor);
    if (promotedItem.isSymbolicLink()
      || !samePathIdentity(sourceItem, sourceIdentity)
      || !samePathIdentity(sourceIdentity, promotedItem)
      || validateTarget() !== true) {
      throw new Error('promoted artifact generation changed');
    }
    let backupCleanupPending = false;
    if (backupCreated) {
      try {
        fs.rmSync(backup, { recursive: true, force: true });
        backupCreated = false;
      } catch (_error) {
        backupCleanupPending = true;
      }
    }
    return {
      ok: true,
      backup_cleanup_pending: backupCleanupPending,
      cleanup_pending: backupCleanupPending,
      cleanup_reason_code: backupCleanupPending ? 'promotion-backup-cleanup-pending' : '',
    };
  } catch (_error) {
    const rollback = rollbackPromotedPath({ target, backup, sourcePromoted, backupCreated });
    return {
      ok: false,
      rollback_status: rollback.status,
      rollback_reason_code: rollback.reason_code,
      cleanup_pending: rollback.cleanup_pending === true,
      cleanup_reason_code: rollback.cleanup_pending === true ? rollback.reason_code : '',
    };
  } finally {
    if (descriptor !== null) safe(() => fs.closeSync(descriptor));
  }
}

function rollbackPromotedPath({ target, backup, sourcePromoted, backupCreated }) {
  if (!sourcePromoted) {
    if (!backupCreated) return { status: 'not-needed', reason_code: null, cleanup_pending: false };
    try {
      fs.renameSync(backup, target);
      return { status: 'restored', reason_code: null, cleanup_pending: false };
    } catch (_error) {
      return {
        status: 'failed',
        reason_code: 'promotion-rollback-restore-failed',
        cleanup_pending: true,
      };
    }
  }
  const quarantine = `${target}.spec-first-rejected-${process.pid}-${Date.now()}`;
  let quarantined = false;
  try {
    fs.renameSync(target, quarantine);
    quarantined = true;
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      return {
        status: 'failed',
        reason_code: 'promotion-rollback-quarantine-failed',
        cleanup_pending: true,
      };
    }
  }

  if (backupCreated) {
    try {
      fs.renameSync(backup, target);
    } catch (_error) {
      return {
        status: 'failed',
        reason_code: 'promotion-rollback-restore-failed',
        cleanup_pending: true,
      };
    }
  }
  if (quarantined) {
    try {
      fs.rmSync(quarantine, { recursive: true, force: true });
    } catch (_error) {
      return {
        status: 'restored-with-cleanup-pending',
        reason_code: 'promotion-rollback-quarantine-cleanup-pending',
        cleanup_pending: true,
      };
    }
  }
  return { status: 'restored', reason_code: null, cleanup_pending: false };
}

function samePathIdentity(left, right) {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.mode === right.mode;
}

function reasonError(reasonCode) {
  const error = new Error(reasonCode);
  error.reason_code = reasonCode;
  return error;
}

function deriveWorkspaceBuildOutcome({ repoResults, merge, globalInstall, refreshOnly = false }) {
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
    const cleanupPending = repoResults.some((repo) => repo.promotion_cleanup_pending === true)
      || merge.promotion_cleanup_pending === true;
    if (cleanupPending) {
      return { status: 'partial', reason_code: 'workspace-artifact-backup-cleanup-pending' };
    }
    return { status: 'complete', reason_code: '' };
  }

  let reasonCode = 'workspace-build-partial';
  if (!globalReady) reasonCode = 'workspace-codegraph-install-failed';
  else if (repoResults.some((repo) => repo.exclude_status === 'failed')) reasonCode = 'workspace-exclude-failed';
  else if (merge && merge.status === 'failed') reasonCode = 'workspace-merge-failed';
  else if (repoResults.some((repo) => repo.codegraph_status === 'failed')) {
    reasonCode = refreshOnly
      ? 'workspace-codegraph-sync-partial'
      : 'workspace-codegraph-build-partial';
  }
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

function finalizeMergeResult(result, mergedPath, successShape, workspaceRoot = null) {
  if (!result || !result.ok) {
    return {
      status: 'failed',
      reason_code: (result && result.reason_code) || 'merge-failed',
      merged_graph_path: null,
      promotion_cleanup_pending: Boolean(result && result.promotion_cleanup_pending),
      promotion_cleanup_reason_code: (result && result.promotion_cleanup_reason_code) || '',
    };
  }
  if (!result.artifact_receipt && !jsonFileHasContent(mergedPath, workspaceRoot)) {
    return {
      status: 'failed',
      reason_code: 'workspace-merged-graph-invalid',
      merged_graph_path: null,
    };
  }
  return {
    status: successShape.status,
    merged_graph_path: mergedPath,
    cross_repo_layer: successShape.cross_repo_layer,
    promotion_cleanup_pending: result.promotion_cleanup_pending === true,
    promotion_cleanup_reason_code: result.promotion_cleanup_reason_code || '',
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
  // repo_id is a workspace-relative POSIX path; keep it as a nested dir under graphify-out/
  // but never allow it to climb out.
  return String(repoId).replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.\.(\/|$)/g, '');
}

module.exports = {
  buildWorkspaceGraphs,
  deriveWorkspaceBuildOutcome,
  GRAPHIFY_OUT_DIRNAME,
  MERGED_GRAPH_BASENAME,
};
