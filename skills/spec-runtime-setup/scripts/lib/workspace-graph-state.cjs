'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { assertContainedPath } = require('./path-safety.cjs');
const { defaultWorkspaceExec } = require('./workspace-exec.cjs');
const { validateSchemaValue } = require('./registry.cjs');
const {
  jsonFileReceiptMatches,
  sha256File,
} = require('./workspace-graph-artifacts.cjs');
const stateSchema = require('../contracts/workspace-graph-state.schema.json');

const STATE_BASENAME = 'workspace-graph-state.json';
const STATE_SCHEMA_VERSION = stateSchema.properties.schema_version.const;

function workspaceGraphStatePath(workspaceRoot) {
  return path.join(workspaceRoot, 'graphify-out', STATE_BASENAME);
}

function inspectRepoSnapshot(repo) {
  const gitRoot = repo && repo.git_root;
  const repoId = repo && repo.repo_id;
  if (!gitRoot) {
    return {
      repo_id: repoId || '',
      head_sha: null,
      head_state: 'unknown',
      worktree_clean: null,
      worktree_fingerprint: null,
      observed: false,
    };
  }

  const head = runGit(gitRoot, ['rev-parse', 'HEAD']);
  const worktree = runGit(gitRoot, ['status', '--porcelain', '--untracked-files=all']);
  const fingerprint = inspectWorktreeFingerprint(gitRoot, head.status === 0);
  return {
    repo_id: repoId || '',
    head_sha: head.status === 0 ? head.stdout.trim() : null,
    head_state: head.status === 0 ? 'commit' : 'unborn',
    worktree_clean: worktree.status === 0 ? worktree.stdout.trim() === '' : null,
    worktree_fingerprint: worktree.status === 0 && fingerprint.ok ? fingerprint.value : null,
    observed: worktree.status === 0 && fingerprint.ok,
  };
}

function inspectWorktreeFingerprint(gitRoot, hasHead) {
  const diffs = hasHead
    ? [runGit(gitRoot, ['diff', '--binary', 'HEAD', '--'])]
    : [runGit(gitRoot, ['diff', '--binary', '--cached']), runGit(gitRoot, ['diff', '--binary'])];
  const untracked = runGit(gitRoot, ['ls-files', '--others', '--exclude-standard', '-z']);
  if (diffs.some((result) => result.status !== 0) || untracked.status !== 0) return { ok: false, value: null };

  const hash = crypto.createHash('sha256');
  for (const diff of diffs) hash.update(diff.stdout);
  for (const relativePath of untracked.stdout.split('\0').filter(Boolean).sort()) {
    const absolute = path.resolve(gitRoot, relativePath);
    hash.update(`untracked:${relativePath}\0`);
    try {
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) hash.update(`symlink:${fs.readlinkSync(absolute)}`);
      else if (stat.isFile()) hash.update(fs.readFileSync(absolute));
      else hash.update(`type:${stat.mode}`);
    } catch (_error) {
      return { ok: false, value: null };
    }
  }
  return { ok: true, value: hash.digest('hex') };
}

function writeWorkspaceGraphState({
  workspaceRoot,
  operationStatus,
  reasonCode = '',
  repos = [],
  merge = null,
  mergedArtifactReceipt = null,
  refreshMode = 'explicit',
  refreshHook = null,
  expectedRepos = null,
} = {}) {
  const graphifyDir = path.join(workspaceRoot, 'graphify-out');
  const target = workspaceGraphStatePath(workspaceRoot);
  let tempPath = null;
  try {
    assertContainedPath(workspaceRoot, graphifyDir, { reasonCode: 'workspace-state-path-escapes-workspace' });
    fs.mkdirSync(graphifyDir, { recursive: true });
    assertContainedPath(workspaceRoot, target, { reasonCode: 'workspace-state-path-escapes-workspace' });

    const repoRecords = repos.map((repo) => ({
      ...inspectRepoSnapshot(repo),
      subgraph_path: repo.subgraph_path ? relativePath(workspaceRoot, repo.subgraph_path) : null,
      codegraph_status: repo.codegraph_status || 'unknown',
      exclude_status: repo.exclude_status || 'unknown',
      graphify_status: repo.graphify_status || 'unknown',
      promotion_cleanup_pending: repo.promotion_cleanup_pending === true,
      promotion_cleanup_reason_code: repo.promotion_cleanup_reason_code || '',
      reason_code: repo.reason_code || '',
    }));
    const mergedPath = merge && merge.merged_graph_path;
    const mergedArtifact = inspectMergedArtifact(workspaceRoot, mergedPath, mergedArtifactReceipt);
    const sourceChanged = Array.isArray(expectedRepos)
      && !repoSnapshotsMatch(expectedRepos, repoRecords);
    const mergedArtifactChanged = Boolean(mergedPath && mergedArtifactReceipt && !mergedArtifact);
    const forcedPartialReason = sourceChanged
      ? 'workspace-source-changed-during-build'
      : (mergedArtifactChanged ? 'workspace-merged-artifact-changed-before-state' : null);
    const payload = {
      schema_version: STATE_SCHEMA_VERSION,
      generated_at: new Date().toISOString(),
      operation_status: forcedPartialReason ? 'partial' : (operationStatus || 'unknown'),
      reason_code: forcedPartialReason || reasonCode || '',
      refresh_mode: refreshMode,
      refresh_hook: refreshHook,
      repos: repoRecords,
      merge: merge ? {
        status: merge.status || 'unknown',
        reason_code: merge.reason_code || '',
        merged_graph_path: merge.merged_graph_path
          ? relativePath(workspaceRoot, merge.merged_graph_path)
          : null,
        promotion_cleanup_pending: merge.promotion_cleanup_pending === true,
        promotion_cleanup_reason_code: merge.promotion_cleanup_reason_code || '',
      } : null,
      merged_artifact: mergedArtifact,
    };

    tempPath = `${target}.tmp-${process.pid}-${Date.now()}`;
    assertContainedPath(workspaceRoot, tempPath, { reasonCode: 'workspace-state-path-escapes-workspace' });
    fs.writeFileSync(tempPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    replaceFile(tempPath, target);
    return { ok: true, path: target, state: payload };
  } catch (error) {
    return {
      ok: false,
      path: target,
      reason_code: error && error.reason_code ? error.reason_code : 'workspace-state-write-failed',
    };
  } finally {
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.rmSync(tempPath, { force: true });
      } catch (_error) {
        // 主写入结果已经携带可操作的失败原因。
      }
    }
  }
}

function repoSnapshotsMatch(expected, observed) {
  const observedById = new Map(observed.map((repo) => [repo.repo_id, repo]));
  return expected.length === observed.length && expected.every((repo) => {
    const current = observedById.get(repo.repo_id);
    return current
      && repo.observed
      && current.observed
      && repo.head_state === current.head_state
      && repo.head_sha === current.head_sha
      && repo.worktree_fingerprint === current.worktree_fingerprint;
  });
}

function replaceFile(source, target) {
  try {
    fs.renameSync(source, target);
  } catch (error) {
    if (process.platform !== 'win32' || !['EEXIST', 'EPERM', 'EACCES'].includes(error.code)) throw error;
    fs.rmSync(target, { force: true });
    fs.renameSync(source, target);
  }
}

function readWorkspaceGraphState(workspaceRoot) {
  const target = workspaceGraphStatePath(workspaceRoot);
  if (!fs.existsSync(target)) {
    return { status: 'missing', path: target, state: null, reason_code: 'workspace-graph-state-missing' };
  }
  try {
    assertContainedPath(workspaceRoot, target, { reasonCode: 'workspace-state-path-escapes-workspace' });
    const state = JSON.parse(fs.readFileSync(target, 'utf8'));
    validateSchemaValue(state, stateSchema, stateSchema);
    return { status: 'ready', path: target, state, reason_code: '' };
  } catch (_error) {
    return { status: 'invalid', path: target, state: null, reason_code: 'workspace-graph-state-invalid' };
  }
}

function resolveStateRepoIds(stateResult) {
  if (!stateResult || stateResult.status !== 'ready') return [];
  return stateResult.state.repos.map((repo) => repo.repo_id).filter(Boolean);
}

function inspectMergedArtifact(workspaceRoot, mergedPath, receipt = null) {
  if (!mergedPath || !fs.existsSync(mergedPath)) return null;
  try {
    if (receipt) {
      if (!jsonFileReceiptMatches(mergedPath, receipt, workspaceRoot)) return null;
      return {
        path: relativePath(workspaceRoot, mergedPath),
        size_bytes: receipt.generation.size,
        mtime_ms: receipt.generation.mtime_ms,
        sha256: receipt.sha256,
      };
    }
    const stat = fs.statSync(mergedPath);
    return {
      path: relativePath(workspaceRoot, mergedPath),
      size_bytes: stat.size,
      mtime_ms: stat.mtimeMs,
      sha256: sha256File(mergedPath),
    };
  } catch (_error) {
    return null;
  }
}

function relativePath(root, target) {
  return path.relative(root, target).split(path.sep).join('/');
}

function runGit(cwd, args) {
  const result = defaultWorkspaceExec('git', ['-C', cwd, ...args], { timeoutMs: 5000 });
  return {
    status: typeof result.status === 'number' ? result.status : 1,
    stdout: String(result.stdout || ''),
  };
}

module.exports = {
  STATE_BASENAME,
  inspectRepoSnapshot,
  readWorkspaceGraphState,
  resolveStateRepoIds,
  workspaceGraphStatePath,
  writeWorkspaceGraphState,
};
