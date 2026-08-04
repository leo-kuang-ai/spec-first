'use strict';

// U6 — Workspace graph clean (lifecycle counterpart to the build).
//
// Removes only spec-first-managed workspace graph state, idempotently and
// containment-checked (CR13, D5):
//   - per child: delete `.codegraph/` (contained), remove the managed
//     `.git/info/exclude` block (self-only); current explicit-refresh builds do
//     not install hooks, while legacy/no-state cleanup asks Graphify to uninstall
//     any older native hook;
//   - delete the workspace current `graphify-out/` tree and legacy `.graphify/`
//     tree (contained), so clean cannot report complete while a retired root remains;
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
const {
  probeChildHookMarker,
  removeWorkspaceChildHook,
} = require('./workspace-child-hook.cjs');
const { CANONICAL_HOSTS } = require('./host-authority.cjs');
const {
  acquireWorkspaceGraphLifecycleLease,
} = require('./workspace-graph-lifecycle-lease.cjs');

function runWorkspaceGraphClean({
  cwd = process.cwd(),
  repos = [],
  allowDiscovery = true,
  exec = defaultWorkspaceExec,
  graphifyCommand = 'graphify',
  stripRouting = true,
  hosts = [...CANONICAL_HOSTS],
} = {}) {
  const initial = resolveCleanContext({ cwd, repos, allowDiscovery });
  if (initial.targets.topology !== 'requirement-workspace') {
    return ineligibleCleanResult(initial.targets);
  }

  const lifecycle = acquireWorkspaceGraphLifecycleLease({
    workspaceRoot: initial.targets.workspace_root,
    operation: 'clean',
  });
  if (!lifecycle.ok) {
    return {
      schema_version: 'workspace-graph-clean.v1',
      status: 'failed',
      topology: initial.targets.topology,
      reason_code: lifecycle.reason_code,
      active_operation: lifecycle.active_operation || null,
      workspace_root: initial.targets.workspace_root,
      repos: [],
      routing: null,
    };
  }

  let result;
  let release = null;
  try {
    lifecycle.assertOwned('before-clean-resolution');
    result = runWorkspaceGraphCleanOwned({
      context: resolveCleanContext({ cwd, repos, allowDiscovery }),
      exec,
      graphifyCommand,
      stripRouting,
      hosts,
      lifecycle,
    });
  } finally {
    release = lifecycle.release();
  }
  if (!release.ok && result.status === 'complete') {
    result.status = 'partial';
    result.reason_code = release.reason_code || 'workspace-graph-lifecycle-release-failed';
  }
  result.lifecycle_release = release;
  return result;
}

function resolveCleanContext({ cwd, repos, allowDiscovery }) {
  const stateResult = readWorkspaceGraphState(cwd);
  const effectiveRepos = repos.length > 0 ? repos : resolveStateRepoIds(stateResult);
  const targets = resolveWorkspaceTargets({ cwd, repos: effectiveRepos, allowDiscovery });
  return {
    stateResult,
    targets,
    explicitRefreshState: stateResult.status === 'ready'
      && stateResult.state.refresh_mode === 'explicit',
    specFirstHookState: stateResult.status === 'ready'
      && stateResult.state.refresh_mode === 'commit-hook-spec-first-async',
  };
}

function runWorkspaceGraphCleanOwned({
  context,
  exec,
  graphifyCommand,
  stripRouting,
  hosts,
  lifecycle,
}) {
  const {
    targets,
    explicitRefreshState,
    specFirstHookState,
  } = context;
  if (targets.topology !== 'requirement-workspace') {
    return ineligibleCleanResult(targets);
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

  lifecycle.assertOwned('before-child-clean');
  for (const repo of confirmed) {
    lifecycle.assertOwned(`before-child-clean:${repo.repo_id}`);
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

    // 3. State 只提供已知 posture；实际 cleanup 还会探测 contained hook marker，
    //    因而旧/损坏 receipt 也不会让 spec-first managed block 变成孤儿。
    const hooks = resolveHooksPath(repo.git_root);
    let shouldUninstallLegacyHook = false;
    if (!hooks.ok) {
      if (explicitRefreshState) {
        entry.hook_status = 'not-installed';
      } else {
        entry.hook_status = 'failed';
        if (!entry.reason_code) entry.reason_code = hooks.reason_code;
      }
    } else if (!isContained(workspaceRoot, hooks.absolute)) {
      if (explicitRefreshState) {
        entry.hook_status = 'not-installed';
      } else {
        entry.hook_status = 'blocked';
        if (!entry.reason_code) entry.reason_code = 'hook-target-escapes-workspace';
      }
    } else {
      let markers = probeChildHookMarker(hooks.absolute);
      if (!markers.ok) {
        entry.hook_status = 'blocked';
        if (!entry.reason_code) entry.reason_code = markers.reason_code || 'workspace-child-hook-unreadable';
      } else {
        if (specFirstHookState || markers.spec_first) {
          const removal = safe(() => removeWorkspaceChildHook(repo.git_root, hooks.absolute));
          if (removal && removal.ok) {
            entry.hook_status = removal.changed ? 'uninstalled' : 'not-installed';
            markers = probeChildHookMarker(hooks.absolute);
            if (!markers.ok) {
              entry.hook_status = 'blocked';
              if (!entry.reason_code) entry.reason_code = markers.reason_code || 'workspace-child-hook-unreadable';
            }
          } else {
            entry.hook_status = 'failed';
            if (!entry.reason_code) entry.reason_code = (removal && removal.reason_code) || 'workspace-child-hook-remove-failed';
          }
        }
        if (!['failed', 'blocked'].includes(entry.hook_status)) {
          shouldUninstallLegacyHook = markers.graphify_native;
          if (shouldUninstallLegacyHook) entry.hook_status = 'skipped';
          else if (entry.hook_status === 'skipped') entry.hook_status = 'not-installed';
        }
      }
    }
    if (entry.hook_status === 'skipped' && shouldUninstallLegacyHook && typeof exec === 'function') {
      const result = safe(() => exec(graphifyCommand, ['hook', 'uninstall'], { cwd: repo.git_root }));
      if (result && result.status === 0) {
        const remaining = probeChildHookMarker(hooks.absolute);
        if (!remaining.ok) {
          entry.hook_status = 'blocked';
          if (!entry.reason_code) entry.reason_code = remaining.reason_code || 'workspace-child-hook-unreadable';
        } else if (remaining.graphify_native) {
          entry.hook_status = 'failed';
          if (!entry.reason_code) entry.reason_code = 'graphify-hook-uninstall-incomplete';
        } else {
          entry.hook_status = 'uninstalled';
        }
      } else {
        entry.hook_status = 'failed';
        if (!entry.reason_code) entry.reason_code = 'graphify-hook-uninstall-failed';
      }
    }
    entry.hook_uninstalled = entry.hook_status;
    repoResults.push(entry);
  }

  // 4. 只剥离 workspace host 入口文档中的 managed routing block。
  let routing = null;
  if (stripRouting) {
    lifecycle.assertOwned('before-routing-clean');
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
  const graphifyRoots = [
    path.join(workspaceRoot, 'graphify-out'),
    path.join(workspaceRoot, '.graphify'),
  ];
  lifecycle.assertOwned('before-workspace-artifact-clean');
  const graphify = childOrRoutingFailed
    ? { ok: true, status: 'preserved', removed: false, reason_code: '' }
    : removeWorkspaceGraphRoots(workspaceRoot, graphifyRoots);
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

function ineligibleCleanResult(targets) {
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

function removeWorkspaceGraphRoots(workspaceRoot, roots) {
  const outcomes = roots.map((root) => safeRemoveDir(workspaceRoot, root));
  const failed = outcomes.find((outcome) => !outcome.ok);
  if (failed) return failed;
  const removed = outcomes.some((outcome) => outcome.removed);
  return {
    ok: true,
    status: removed ? 'removed' : 'absent',
    removed,
    reason_code: '',
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
