'use strict';

// U6 — Workspace graph clean (lifecycle counterpart to the build).
//
// Removes only spec-first-managed workspace graph state, idempotently and
// containment-checked (CR13, D5):
//   - per child: delete `.codegraph/` (contained), remove the managed
//     `.git/info/exclude` block (self-only); current explicit-refresh builds do
//     not install hooks, while legacy/no-state cleanup asks Graphify to uninstall
//     any older native hook;
//   - delete the workspace `.graphify/` artifact tree (contained);
//   - surface a CodeGraph daemon-cleanup action (spec-first does not force-kill
//     provider daemons; it reports the action).
//
// Deleting the requirement folder itself removes everything (per-需求 isolation,
// no machine-global residue). `exec` is injectable for tests.

const fs = require('node:fs');
const path = require('node:path');
const { assertContainedPath } = require('./path-safety.cjs');
const { resolveGitPath } = require('./git-path.cjs');
const { removeManagedExclude } = require('./workspace-git-exclude.cjs');
const { resolveWorkspaceTargets } = require('./workspace-target.cjs');
const { stripRoutingInstruction } = require('./workspace-routing-inject.cjs');
const { defaultWorkspaceExec } = require('./workspace-exec.cjs');
const { readWorkspaceGraphState, resolveStateRepoIds } = require('./workspace-graph-state.cjs');
const { CANONICAL_HOSTS } = require('./host-authority.cjs');

function runWorkspaceGraphClean({
  cwd = process.cwd(),
  repos = [],
  allowDiscovery = true,
  exec = defaultWorkspaceExec,
  graphifyCommand = 'graphify',
  stripRouting = true,
  hosts = [...CANONICAL_HOSTS],
} = {}) {
  const stateResult = readWorkspaceGraphState(cwd);
  const explicitRefreshState = stateResult.status === 'ready'
    && stateResult.state.refresh_mode === 'explicit';
  const effectiveRepos = repos.length > 0 ? repos : resolveStateRepoIds(stateResult);
  const targets = resolveWorkspaceTargets({
    cwd,
    repos: effectiveRepos,
    allowDiscovery,
  });
  if (targets.topology !== 'requirement-workspace') {
    return {
      schema_version: 'workspace-graph-clean.v1',
      status: 'skipped',
      topology: targets.topology,
      reason_code: targets.reason_code || 'workspace-not-eligible',
      workspace_root: targets.workspace_root,
      repos: [],
      routing: null,
    };
  }
  if (targets.manifest_error) {
    return {
      schema_version: 'workspace-graph-clean.v1',
      status: 'failed',
      topology: targets.topology,
      reason_code: targets.manifest_error,
      workspace_root: targets.workspace_root,
      repos: [],
      routing: null,
    };
  }
  if (targets.ambiguous.length > 0) {
    return {
      schema_version: 'workspace-graph-clean.v1',
      status: 'failed',
      topology: targets.topology,
      reason_code: 'workspace-targets-ambiguous',
      workspace_root: targets.workspace_root,
      repos: [],
      routing: null,
    };
  }

  const workspaceRoot = targets.workspace_root;
  const confirmed = targets.repos.filter((repo) => !repo.needs_confirm);
  const pendingConfirm = targets.repos.filter((repo) => repo.needs_confirm);
  if (confirmed.length === 0 && pendingConfirm.length > 0) {
    return {
      schema_version: 'workspace-graph-clean.v1',
      status: 'needs-confirmation',
      topology: targets.topology,
      reason_code: 'workspace-repos-need-confirmation',
      workspace_root: workspaceRoot,
      pending_confirm: pendingConfirm.map((repo) => repo.repo_id),
      repos: [],
      routing: null,
    };
  }
  const repoResults = [];

  for (const repo of confirmed) {
    const entry = {
      repo_id: repo.repo_id,
      codegraph_status: 'absent',
      codegraph_removed: false,
      exclude_status: 'absent',
      exclude_removed: false,
      hook_status: 'skipped',
      reason_code: '',
    };

    // 1. 删除 contained 的 per-child .codegraph/。
    const codegraphDir = path.join(repo.git_root, '.codegraph');
    const codegraph = safeRemoveDir(workspaceRoot, codegraphDir);
    entry.codegraph_status = codegraph.status;
    entry.codegraph_removed = codegraph.removed;
    if (!codegraph.ok) entry.reason_code = codegraph.reason_code;

    // 2. 幂等移除自身管理的 exclude block。
    const excl = safe(() => removeManagedExclude(repo.git_root, workspaceRoot));
    entry.exclude_status = excl && excl.ok ? (excl.changed ? 'removed' : 'absent') : 'failed';
    entry.exclude_removed = Boolean(excl && excl.ok && excl.changed);
    if (entry.exclude_status === 'failed' && !entry.reason_code) {
      entry.reason_code = excl && excl.reason_code ? excl.reason_code : 'exclude-remove-failed';
    }

    // 3. 当前 explicit-refresh build 不安装 hook；但 contained git dir 中可能
    // 仍有旧版本遗留 marker，此时继续调用 provider-native uninstall。
    const hooks = resolveHooksPath(repo.git_root);
    let shouldUninstallLegacyHook = !explicitRefreshState;
    if (explicitRefreshState) {
      if (hooks.ok && isContained(workspaceRoot, hooks.absolute)) {
        shouldUninstallLegacyHook = hasGraphifyManagedHook(hooks.absolute);
      }
      entry.hook_status = shouldUninstallLegacyHook ? 'skipped' : 'not-installed';
    } else {
      if (!hooks.ok) {
        entry.hook_status = 'failed';
        if (!entry.reason_code) entry.reason_code = hooks.reason_code;
      } else {
        try {
          assertContainedPath(workspaceRoot, hooks.absolute, { reasonCode: 'hook-target-escapes-workspace' });
        } catch (error) {
          entry.hook_status = 'blocked';
          if (!entry.reason_code) entry.reason_code = error.reason_code || 'hook-target-escapes-workspace';
        }
      }
    }
    if (entry.hook_status === 'skipped' && shouldUninstallLegacyHook && typeof exec === 'function') {
      const result = safe(() => exec(graphifyCommand, ['hook', 'uninstall'], { cwd: repo.git_root }));
      entry.hook_status = result && result.status === 0 ? 'uninstalled' : 'failed';
      if (entry.hook_status === 'failed' && !entry.reason_code) entry.reason_code = 'graphify-hook-uninstall-failed';
    }
    entry.hook_uninstalled = entry.hook_status;
    repoResults.push(entry);
  }

  // 4. 只剥离 workspace host 入口文档中的 managed routing block。
  let routing = null;
  if (stripRouting) {
    routing = safe(() => stripRoutingInstruction({ workspaceRoot, hosts }));
  }

  // Legacy hook 清理属于请求的生命周期；containment block 必须返回 partial，
  // 同时保持外部路径不变。
  const repoFailed = repoResults.some((repo) => (
    repo.codegraph_status === 'failed'
    || repo.exclude_status === 'failed'
    || ['failed', 'blocked'].includes(repo.hook_status)
  ));
  const routingFailed = stripRouting
    ? (!routing || routing.entries.some((entry) => entry.status === 'failed'))
    : false;
  const childOrRoutingFailed = repoFailed || routingFailed;

  // 5. 只有 child/routing 已清理成功才删除 state/tree；否则保留 receipt 供裸重试。
  const graphifyOut = path.join(workspaceRoot, '.graphify');
  const graphify = childOrRoutingFailed
    ? { ok: true, status: 'preserved', removed: false, reason_code: '' }
    : safeRemoveDir(workspaceRoot, graphifyOut);
  const failed = childOrRoutingFailed || !graphify.ok;
  const needsConfirmation = pendingConfirm.length > 0;

  return {
    schema_version: 'workspace-graph-clean.v1',
    status: failed || needsConfirmation ? 'partial' : 'complete',
    topology: targets.topology,
    workspace_root: workspaceRoot,
    repos: repoResults,
    pending_confirm: pendingConfirm.map((repo) => repo.repo_id),
    workspace_graphify_status: graphify.status,
    workspace_graphify_removed: graphify.removed,
    routing,
    // spec-first does not force-kill provider daemons; report the action for the user/host.
    codegraph_daemon_action: 'run `codegraph daemon` to stop any watcher bound to a removed workspace',
    reason_code: failed
      ? 'workspace-clean-partial'
      : (needsConfirmation ? 'workspace-repos-need-confirmation' : ''),
  };
}

function resolveHooksPath(repoRoot) {
  return resolveGitPath(repoRoot, 'hooks');
}

function isContained(workspaceRoot, target) {
  try {
    assertContainedPath(workspaceRoot, target, { reasonCode: 'hook-target-escapes-workspace' });
    return true;
  } catch (_error) {
    return false;
  }
}

function hasGraphifyManagedHook(hooksDir) {
  return ['post-commit', 'post-checkout'].some((name) => {
    try {
      return fs.readFileSync(path.join(hooksDir, name), 'utf8').includes('Installed by: graphify hook install');
    } catch (_error) {
      return false;
    }
  });
}

function safeRemoveDir(workspaceRoot, dir) {
  if (!fs.existsSync(dir)) return { ok: true, status: 'absent', removed: false, reason_code: '' };
  try {
    assertContainedPath(workspaceRoot, dir, { reasonCode: 'clean-target-escapes-workspace' });
  } catch (error) {
    return { ok: false, status: 'failed', removed: false, reason_code: error.reason_code || 'clean-target-escapes-workspace' };
  }
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    return { ok: true, status: 'removed', removed: true, reason_code: '' };
  } catch (_error) {
    return { ok: false, status: 'failed', removed: false, reason_code: 'clean-remove-failed' };
  }
}

function safe(fn) {
  try {
    return fn();
  } catch (_error) {
    return null;
  }
}

module.exports = {
  runWorkspaceGraphClean,
};
