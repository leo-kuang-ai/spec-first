'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { assertContainedPath } = require('./path-safety.cjs');

const STATE_BASENAME = 'workspace-graph-state.json';

function workspaceGraphStatePath(workspaceRoot) {
  return path.join(workspaceRoot, '.graphify', STATE_BASENAME);
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
      observed: false,
    };
  }

  const head = runGit(gitRoot, ['rev-parse', 'HEAD']);
  const worktree = runGit(gitRoot, ['status', '--porcelain', '--untracked-files=all']);
  return {
    repo_id: repoId || '',
    head_sha: head.status === 0 ? head.stdout.trim() : null,
    head_state: head.status === 0 ? 'commit' : 'unborn',
    worktree_clean: worktree.status === 0 ? worktree.stdout.trim() === '' : null,
    observed: worktree.status === 0,
  };
}

function writeWorkspaceGraphState({
  workspaceRoot,
  operationStatus,
  reasonCode = '',
  repos = [],
  merge = null,
  refreshMode = 'explicit',
} = {}) {
  const graphifyDir = path.join(workspaceRoot, '.graphify');
  const target = workspaceGraphStatePath(workspaceRoot);
  let tempPath = null;
  try {
    assertContainedPath(workspaceRoot, graphifyDir, { reasonCode: 'workspace-state-path-escapes-workspace' });
    fs.mkdirSync(graphifyDir, { recursive: true });
    assertContainedPath(workspaceRoot, target, { reasonCode: 'workspace-state-path-escapes-workspace' });

    const repoRecords = repos.map((repo) => ({
      ...inspectRepoSnapshot(repo),
      subgraph_path: repo.subgraph_path ? relativePath(workspaceRoot, repo.subgraph_path) : null,
    }));
    const mergedArtifact = inspectMergedArtifact(workspaceRoot, merge && merge.merged_graph_path);
    const payload = {
      schema_version: 'workspace-graph-state.v1',
      generated_at: new Date().toISOString(),
      operation_status: operationStatus || 'unknown',
      reason_code: reasonCode || '',
      refresh_mode: refreshMode,
      repos: repoRecords,
      merge: merge ? {
        status: merge.status || 'unknown',
        reason_code: merge.reason_code || '',
        merged_graph_path: merge.merged_graph_path
          ? relativePath(workspaceRoot, merge.merged_graph_path)
          : null,
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
    if (!state || state.schema_version !== 'workspace-graph-state.v1' || !Array.isArray(state.repos)) {
      return { status: 'invalid', path: target, state: null, reason_code: 'workspace-graph-state-invalid' };
    }
    return { status: 'ready', path: target, state, reason_code: '' };
  } catch (_error) {
    return { status: 'invalid', path: target, state: null, reason_code: 'workspace-graph-state-invalid' };
  }
}

function resolveStateRepoIds(stateResult) {
  if (!stateResult || stateResult.status !== 'ready') return [];
  return stateResult.state.repos.map((repo) => repo.repo_id).filter(Boolean);
}

function inspectMergedArtifact(workspaceRoot, mergedPath) {
  if (!mergedPath || !fs.existsSync(mergedPath)) return null;
  try {
    const stat = fs.statSync(mergedPath);
    return {
      path: relativePath(workspaceRoot, mergedPath),
      size_bytes: stat.size,
      mtime_ms: stat.mtimeMs,
    };
  } catch (_error) {
    return null;
  }
}

function relativePath(root, target) {
  return path.relative(root, target).split(path.sep).join('/');
}

function runGit(cwd, args) {
  const result = spawnSync('git', ['-C', cwd, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 5000,
    windowsHide: true,
  });
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
