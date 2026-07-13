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
const { assertContainedPath } = require('./path-safety.cjs');
const { removeManagedExclude } = require('./workspace-git-exclude.cjs');
const { resolveWorkspaceTargets } = require('./workspace-target.cjs');
const { stripRoutingInstruction } = require('./workspace-routing-inject.cjs');

function runWorkspaceGraphClean({
  cwd = process.cwd(),
  repos = [],
  allowDiscovery = true,
  exec = null,
  graphifyCommand = 'graphify',
  stripRouting = true,
  hosts = ['claude', 'codex', 'cursor', 'kiro', 'qoder'],
} = {}) {
  const targets = resolveWorkspaceTargets({ cwd, repos, allowDiscovery });
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

  const workspaceRoot = targets.workspace_root;
  const repoResults = [];

  for (const repo of targets.repos) {
    const entry = { repo_id: repo.repo_id, codegraph_removed: false, exclude_removed: false, hook_uninstalled: 'skipped' };

    // 1. Delete per-child .codegraph/ (contained).
    const codegraphDir = path.join(repo.git_root, '.codegraph');
    entry.codegraph_removed = safeRemoveDir(workspaceRoot, codegraphDir);

    // 2. Remove managed exclude block (self-only, idempotent).
    const excl = safe(() => removeManagedExclude(repo.git_root, workspaceRoot));
    entry.exclude_removed = Boolean(excl && excl.ok && excl.changed);

    // 3. Uninstall graphify git hook via its own command (native block).
    if (typeof exec === 'function') {
      const result = safe(() => exec(graphifyCommand, ['hook', 'uninstall'], { cwd: repo.git_root }));
      entry.hook_uninstalled = result && result.status === 0 ? 'uninstalled' : 'failed';
    }
    repoResults.push(entry);
  }

  // 4. Delete workspace .graphify/ tree (contained).
  const graphifyOut = path.join(workspaceRoot, '.graphify');
  const graphifyRemoved = safeRemoveDir(workspaceRoot, graphifyOut);

  // 5. Strip the managed routing block from workspace host entry docs (self-only).
  let routing = null;
  if (stripRouting) {
    routing = safe(() => stripRoutingInstruction({ workspaceRoot, hosts }));
  }

  return {
    schema_version: 'workspace-graph-clean.v1',
    status: 'complete',
    topology: targets.topology,
    workspace_root: workspaceRoot,
    repos: repoResults,
    workspace_graphify_removed: graphifyRemoved,
    routing,
    // spec-first does not force-kill provider daemons; report the action for the user/host.
    codegraph_daemon_action: 'run `codegraph daemon` to stop any watcher bound to a removed workspace',
    reason_code: '',
  };
}

function safeRemoveDir(workspaceRoot, dir) {
  if (!fs.existsSync(dir)) return false;
  try {
    assertContainedPath(workspaceRoot, dir, { reasonCode: 'clean-target-escapes-workspace' });
  } catch (_error) {
    return false;
  }
  try {
    fs.rmSync(dir, { recursive: true, force: true });
    return true;
  } catch (_error) {
    return false;
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
