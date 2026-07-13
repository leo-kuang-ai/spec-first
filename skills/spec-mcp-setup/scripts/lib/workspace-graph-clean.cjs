'use strict';

// U6 — Workspace graph clean (lifecycle counterpart to the build).
//
// Removes only spec-first-managed workspace graph state, idempotently and
// containment-checked (CR13, D5):
//   - per child: delete `.codegraph/` (contained), remove the managed
//     `.git/info/exclude` block (self-only), uninstall the graphify git hook via
//     graphify's own `hook uninstall` (the hook block is graphify-native, not
//     spec-first-authored);
//   - delete the workspace `.graphify/` artifact tree (contained);
//   - surface a CodeGraph daemon-cleanup action (spec-first does not force-kill
//     provider daemons; it reports the action).
//
// Deleting the requirement folder itself removes everything (per-需求 isolation,
// no machine-global residue). `exec` is injectable for tests.

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { assertContainedPath } = require('./path-safety.cjs');
const { removeManagedExclude, resolveGitPath } = require('./workspace-git-exclude.cjs');
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

    // 1. Delete per-child .codegraph/ (contained).
    const codegraphDir = path.join(repo.git_root, '.codegraph');
    const codegraph = safeRemoveDir(workspaceRoot, codegraphDir);
    entry.codegraph_status = codegraph.status;
    entry.codegraph_removed = codegraph.removed;
    if (!codegraph.ok) entry.reason_code = codegraph.reason_code;

    // 2. Remove managed exclude block (self-only, idempotent).
    const excl = safe(() => removeManagedExclude(repo.git_root, workspaceRoot));
    entry.exclude_status = excl && excl.ok ? (excl.changed ? 'removed' : 'absent') : 'failed';
    entry.exclude_removed = Boolean(excl && excl.ok && excl.changed);
    if (entry.exclude_status === 'failed' && !entry.reason_code) {
      entry.reason_code = excl && excl.reason_code ? excl.reason_code : 'exclude-remove-failed';
    }

    // 3. Current explicit-refresh builds never install a hook. Without a
    // current state receipt, preserve legacy cleanup for older installations.
    if (explicitRefreshState) {
      entry.hook_status = 'not-installed';
    } else {
      const hooks = resolveHooksPath(repo.git_root);
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
      if (entry.hook_status === 'skipped' && typeof exec === 'function') {
        const result = safe(() => exec(graphifyCommand, ['hook', 'uninstall'], { cwd: repo.git_root }));
        entry.hook_status = result && result.status === 0 ? 'uninstalled' : 'failed';
        if (entry.hook_status === 'failed' && !entry.reason_code) entry.reason_code = 'graphify-hook-uninstall-failed';
      }
    }
    entry.hook_uninstalled = entry.hook_status;
    repoResults.push(entry);
  }

  // 4. Delete workspace .graphify/ tree (contained).
  const graphifyOut = path.join(workspaceRoot, '.graphify');
  const graphify = safeRemoveDir(workspaceRoot, graphifyOut);

  // 5. Strip the managed routing block from workspace host entry docs (self-only).
  let routing = null;
  if (stripRouting) {
    routing = safe(() => stripRoutingInstruction({ workspaceRoot, hosts }));
  }

  // Legacy hook cleanup is part of the requested lifecycle. A containment block
  // is not success: surface partial while leaving the external path untouched.
  const repoFailed = repoResults.some((repo) => (
    repo.codegraph_status === 'failed'
    || repo.exclude_status === 'failed'
    || ['failed', 'blocked'].includes(repo.hook_status)
  ));
  const routingFailed = stripRouting
    ? (!routing || routing.entries.some((entry) => entry.status === 'failed'))
    : false;
  const failed = repoFailed || !graphify.ok || routingFailed;

  return {
    schema_version: 'workspace-graph-clean.v1',
    status: failed ? 'partial' : 'complete',
    topology: targets.topology,
    workspace_root: workspaceRoot,
    repos: repoResults,
    pending_confirm: pendingConfirm.map((repo) => repo.repo_id),
    workspace_graphify_status: graphify.status,
    workspace_graphify_removed: graphify.removed,
    routing,
    // spec-first does not force-kill provider daemons; report the action for the user/host.
    codegraph_daemon_action: 'run `codegraph daemon` to stop any watcher bound to a removed workspace',
    reason_code: failed ? 'workspace-clean-partial' : '',
  };
}

function resolveHooksPath(repoRoot) {
  const configured = spawnSync('git', ['-C', repoRoot, 'config', '--path', '--get', 'core.hooksPath'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 5000,
    windowsHide: true,
  });
  if (configured.status === 0 && String(configured.stdout || '').trim()) {
    const raw = String(configured.stdout).trim();
    return { ok: true, absolute: path.isAbsolute(raw) ? raw : path.resolve(repoRoot, raw) };
  }
  return resolveGitPath(repoRoot, 'hooks');
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
