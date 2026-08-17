'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const {
  inspectGitHealth,
} = require('./worktree-health.cjs');
const {
  isPathWithin,
} = require('./path-safety.cjs');

const IGNORED_DIRECTORY_NAMES = new Set([
  '.git',
  '.worktrees',
  'node_modules',
  'vendor',
  '.claude',
  '.codex',
  '.cursor',
  '.kiro',
  '.opencode',
  '.qoder',
  '.agents',
  '.spec-first',
  'build',
  '.cache',
  '.direnv',
  '.venv',
]);

function resolveProjectTarget({
  cwd = process.cwd(),
  repo = '',
  folder = '',
  allRepos = false,
  scanDepth = 3,
} = {}) {
  const invocationCwd = absoluteDirectory(cwd);
  if (!invocationCwd) {
    return invalidTarget(baseResult(path.resolve(cwd)), 'invocation-cwd-unavailable');
  }

  const cwdGitRoot = findGitRoot(invocationCwd);
  const workspaceRoot = cwdGitRoot || invocationCwd;
  const base = baseResult(invocationCwd, workspaceRoot, cwdGitRoot);

  if (repo && folder) return invalidTarget(base, 'repo-and-folder');
  if (repo && allRepos) return invalidTarget(base, 'repo-and-all-repos');
  if (folder && allRepos) return invalidTarget(base, 'folder-and-all-repos');

  if (repo) return resolveExplicitRepo(base, String(repo), cwdGitRoot);
  if (folder) return resolveExplicitFolder(base, String(folder));
  if (allRepos) return resolveAllRepos(base, scanDepth, true, cwdGitRoot);
  if (cwdGitRoot) return currentRepoResult(base, cwdGitRoot);
  return resolveAllRepos(base, scanDepth, false, null);
}

function resolveExplicitRepo(base, requested, cwdGitRoot) {
  const target = inspectExplicitPath(base.workspace_root, base.invocation_cwd, requested, 'repo');
  if (!target.ok) return invalidTarget(base, target.reason_code);

  const gitRoot = findGitRoot(target.real_path);
  if (!gitRoot) return invalidTarget(base, 'repo-target-not-git');
  if (path.resolve(gitRoot) !== path.resolve(target.real_path)) {
    return invalidTarget(base, 'repo-target-not-git-root', {
      requested_repo_root: target.real_path,
      resolved_git_root: gitRoot,
      next_action: `--repo 必须指向 Git repository root；当前路径位于 ${gitRoot}。请选择父仓，或用 --folder ${target.real_path} 保持精确目录边界。`,
    });
  }
  if (!isPathWithin(gitRoot, base.workspace_root) || !isCanonicalPathWithin(gitRoot, base.workspace_root)) {
    return invalidTarget(base, 'repo-target-outside-workspace');
  }
  if (cwdGitRoot && gitRoot !== cwdGitRoot) {
    return invalidTarget(base, 'repo-target-outside-workspace');
  }

  return gitRepoResult({
    ...base,
    selection_source: 'explicit-repo',
    selected_repo_root: gitRoot,
    target_root: gitRoot,
    repo_label: relativeLabel(gitRoot, base.workspace_root),
  }, gitRoot);
}

function resolveExplicitFolder(base, requested) {
  const target = inspectExplicitPath(base.workspace_root, base.invocation_cwd, requested, 'folder');
  if (!target.ok) return invalidTarget(base, target.reason_code);
  if (hasGitMarker(target.real_path)) {
    return invalidTarget(base, 'folder-target-is-git-repo');
  }
  return nonGitFolderResult(base, target.real_path, 'explicit-folder');
}

function resolveAllRepos(base, scanDepth, explicit, cwdGitRoot) {
  const selectionSource = explicit ? 'explicit-all-repos' : 'workspace-default-all-repos';
  if (cwdGitRoot) {
    return invalidTarget({ ...base, selection_source: selectionSource }, 'all-repos-requires-parent-workspace');
  }

  const candidates = discoverChildRepos(base.workspace_root, scanDepth);
  if (candidates.length === 0) {
    if (!explicit) {
      return nonGitFolderResult(base, base.invocation_cwd, 'cwd-non-git-folder');
    }
    return {
      ...base,
      mode: 'workspace-no-git-candidates',
      target_kind: 'workspace',
      selection_source: explicit ? selectionSource : '',
      state_write_allowed: false,
      candidates: [],
      reason_code: 'workspace-no-git-candidates',
      next_action: '请从 Git repo 中运行，或使用 --repo <child> 选择已有的 child repo。',
    };
  }

  return {
    ...base,
    mode: 'workspace-all-repos',
    target_kind: 'workspace',
    selection_source: selectionSource,
    state_write_allowed: true,
    candidates,
    reason_code: '',
    next_action: '',
  };
}

function currentRepoResult(base, gitRoot) {
  return gitRepoResult({
    ...base,
    selection_source: 'cwd-git-root',
    workspace_root: gitRoot,
    selected_repo_root: gitRoot,
    target_root: gitRoot,
    repo_label: path.basename(gitRoot),
  }, gitRoot);
}

function nonGitFolderResult(base, folderRoot, selectionSource) {
  const enclosingGitRoot = findGitRoot(folderRoot);
  const label = relativeLabel(folderRoot, base.workspace_root);
  return {
    ...base,
    mode: 'non-git-folder',
    repo_status: 'not-git-repo',
    target_kind: 'non-git-folder',
    selection_source: selectionSource,
    state_write_allowed: true,
    selected_repo_root: null,
    selected_folder_root: folderRoot,
    target_root: folderRoot,
    artifact_root: folderRoot,
    runtime_projection_root: enclosingGitRoot || folderRoot,
    enclosing_git_root: enclosingGitRoot,
    repo_label: label,
    folder_label: label,
    git_health: { status: 'not-git', reason_code: 'not-git', git_entry_type: 'missing' },
    reason_code: '',
    next_action: '',
  };
}

function inspectExplicitPath(workspaceRoot, invocationCwd, requested, kind) {
  const absolute = path.resolve(invocationCwd, requested);
  if (!isPathWithin(absolute, workspaceRoot)) {
    return { ok: false, reason_code: `${kind}-target-outside-workspace` };
  }
  if (!fs.existsSync(absolute)) {
    return { ok: false, reason_code: `${kind}-target-not-found` };
  }
  let stat;
  try {
    stat = fs.statSync(absolute);
  } catch (_error) {
    return { ok: false, reason_code: `${kind}-target-unreadable` };
  }
  if (!stat.isDirectory()) {
    return { ok: false, reason_code: `${kind}-target-not-directory` };
  }
  if (containsSymlinkComponent(workspaceRoot, absolute)) {
    return { ok: false, reason_code: `${kind}-target-symlink-escape` };
  }
  if (!isCanonicalPathWithin(absolute, workspaceRoot)) {
    return { ok: false, reason_code: `${kind}-target-symlink-escape` };
  }
  return { ok: true, real_path: absolute };
}

function discoverChildRepos(workspaceRoot, scanDepth) {
  const maxDepth = Number.isInteger(scanDepth) && scanDepth >= 0 ? scanDepth : 3;
  const roots = [];

  function visit(directory, depth) {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true })
        .sort((left, right) => left.name.localeCompare(right.name));
    } catch (_error) {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink() || IGNORED_DIRECTORY_NAMES.has(entry.name)) continue;
      const child = path.join(directory, entry.name);
      if (isSymbolicLink(child)) continue;

      if (hasGitMarker(child)) {
        const gitRoot = findGitRoot(child);
        if (gitRoot && isPathWithin(gitRoot, workspaceRoot) && !containsSymlinkComponent(workspaceRoot, gitRoot)) {
          addCandidate(roots, gitRoot);
        }
        continue;
      }

      if (depth < maxDepth) visit(child, depth + 1);
    }
  }

  visit(workspaceRoot, 0);
  roots.sort((left, right) => left.localeCompare(right));
  return roots.map((gitRoot) => ({
    repo_label: relativeLabel(gitRoot, workspaceRoot),
    git_root: gitRoot,
    workspace_relative_path: relativeLabel(gitRoot, workspaceRoot),
    relationship: 'child_git_repo',
    git_health: inspectGitHealth(gitRoot),
  }));
}

function addCandidate(roots, candidate) {
  for (const existing of roots) {
    if (existing === candidate || isPathWithin(candidate, existing)) return;
  }
  for (let index = roots.length - 1; index >= 0; index -= 1) {
    if (isPathWithin(roots[index], candidate)) roots.splice(index, 1);
  }
  roots.push(candidate);
}

function findGitRoot(startPath) {
  let cursor = path.resolve(startPath);
  while (cursor) {
    if (hasGitMarker(cursor)) return cursor;
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }

  const commandResult = spawnSync('git', ['-C', startPath, 'rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 3000,
    windowsHide: true,
  });
  if (commandResult.status === 0) {
    const output = String(commandResult.stdout || '').trim();
    if (output && fs.existsSync(output)) return path.resolve(output);
  }
  return null;
}

function hasGitMarker(directory) {
  try {
    const stat = fs.lstatSync(path.join(directory, '.git'));
    return stat.isDirectory() || stat.isFile();
  } catch (_error) {
    return false;
  }
}

function containsSymlinkComponent(root, target) {
  if (!isPathWithin(target, root)) return true;
  if (isSymbolicLink(root)) return true;
  const relative = path.relative(root, target);
  if (!relative) return isSymbolicLink(target);
  let cursor = root;
  for (const part of relative.split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    if (isSymbolicLink(cursor)) return true;
  }
  return false;
}

function isSymbolicLink(candidate) {
  try {
    return fs.lstatSync(candidate).isSymbolicLink();
  } catch (_error) {
    return false;
  }
}

function isCanonicalPathWithin(child, parent) {
  const canonicalChild = safeRealpath(child);
  const canonicalParent = safeRealpath(parent);
  if (!canonicalChild || !canonicalParent) return false;
  return isPathWithin(canonicalChild, canonicalParent);
}

function absoluteDirectory(candidate) {
  const resolved = path.resolve(candidate);
  try {
    return fs.statSync(resolved).isDirectory() ? resolved : null;
  } catch (_error) {
    return null;
  }
}

function safeRealpath(candidate) {
  try {
    const realpath = fs.realpathSync.native || fs.realpathSync;
    return realpath(candidate);
  } catch (_error) {
    return null;
  }
}

function relativeLabel(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative ? relative.split(path.sep).join('/') : '.';
}

function baseResult(invocationCwd, workspaceRoot = invocationCwd, cwdGitRoot = null) {
  const gitHealth = cwdGitRoot
    ? inspectGitHealth(cwdGitRoot)
    : { status: 'not-git', reason_code: 'not-git', git_entry_type: 'missing' };
  return {
    schema_version: 'project-target.v2',
    mode: '',
    repo_status: cwdGitRoot ? 'git-repo' : 'not-git-repo',
    target_kind: '',
    selection_source: '',
    state_write_allowed: false,
    invocation_cwd: invocationCwd,
    workspace_root: workspaceRoot,
    selected_repo_root: null,
    selected_folder_root: null,
    target_root: null,
    artifact_root: null,
    runtime_projection_root: null,
    enclosing_git_root: cwdGitRoot,
    repo_label: '',
    folder_label: '',
    candidates: [],
    git_health: gitHealth,
    reason_code: '',
    next_action: '',
  };
}

function gitRepoResult(base, gitRoot) {
  const gitHealth = inspectGitHealth(gitRoot);
  const writable = gitHealth.status === 'ok';
  return {
    ...base,
    mode: 'git-repo',
    repo_status: 'git-repo',
    target_kind: 'git-repo',
    state_write_allowed: writable,
    artifact_root: base.artifact_root || gitRoot,
    runtime_projection_root: base.runtime_projection_root || gitRoot,
    enclosing_git_root: gitRoot,
    git_health: gitHealth,
    reason_code: writable ? '' : gitHealth.reason_code,
    next_action: writable ? '' : gitHealthNextAction(gitHealth),
  };
}

function gitHealthNextAction(gitHealth) {
  if (gitHealth.status === 'broken-worktree') {
    return '运行 `spec-first repair-worktree --dry-run`，并在 setup mutation 前恢复缺失的 gitdir metadata。';
  }
  if (gitHealth.status === 'corrupted-gitdir') {
    return '检查 `.git`，并在 setup mutation 前从可信 checkout 运行 `git fsck`。';
  }
  return '请在 setup mutation 前恢复有效的 Git repository。';
}

function invalidTarget(base, reasonCode, details = {}) {
  return {
    ...base,
    ...details,
    mode: 'invalid-target',
    target_kind: 'invalid',
    state_write_allowed: false,
    target_root: null,
    reason_code: reasonCode,
    next_action: details.next_action || '请选择 invocation workspace 内的目标，然后重试。',
  };
}

module.exports = {
  resolveProjectTarget,
};
