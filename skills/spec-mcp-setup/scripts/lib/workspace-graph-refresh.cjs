'use strict';

// U3 — Auto-refresh wiring.
//
// CodeGraph: `serve --mcp` runs a default file watcher (provider-native); spec-
// first does NOT start a watcher — it only consumes/reports that fact.
// Graphify: install per-child git hooks so a child commit refreshes that child's
// subgraph, then re-run merge-graphs so the workspace merged graph re-converges.
//
// Both git-metadata writes (hook install here, and the exclude line in U2) are
// the CR13-authorized exception: the resolved `.git/hooks` target is
// containment-checked (via git rev-parse --git-path, correct for `.git`-as-file
// worktrees) before install. Non-git / hook-unavailable children fall back to
// Graphify `watch` or explicit refresh with honest freshness (CR9).

const { assertContainedPath } = require('./path-safety.cjs');
const { resolveGitPath } = require('./workspace-git-exclude.cjs');

// Install the graphify git hook in each child, containment-checked. `exec` is
// injected. Returns per-repo hook status; never throws.
function installChildHooks({ workspaceRoot, repos = [], exec, graphifyCommand = 'graphify' } = {}) {
  if (typeof exec !== 'function') throw new Error('installChildHooks requires an exec function');
  const results = [];
  for (const repo of repos) {
    const entry = { repo_id: repo.repo_id, hook_status: 'skipped', reason_code: '' };
    const hooks = resolveGitPath(repo.git_root, 'hooks');
    if (!hooks.ok) {
      entry.hook_status = 'failed';
      entry.reason_code = hooks.reason_code;
      entry.fallback = 'graphify-watch-or-explicit-refresh';
      results.push(entry);
      continue;
    }
    try {
      // Also catches a global/repo `core.hooksPath` redirecting hooks outside the
      // workspace — installing there would leak a hook beyond per-需求 isolation.
      assertContainedPath(workspaceRoot, hooks.absolute, { reasonCode: 'hook-target-escapes-workspace' });
    } catch (error) {
      entry.hook_status = 'failed';
      entry.reason_code = error.reason_code || 'hook-target-escapes-workspace';
      entry.fallback = 'graphify-watch-or-explicit-refresh';
      results.push(entry);
      continue;
    }
    const result = safe(() => exec(graphifyCommand, ['hook', 'install'], { cwd: repo.git_root }));
    if (result && result.status === 0) {
      entry.hook_status = 'installed';
    } else {
      entry.hook_status = 'failed';
      entry.reason_code = 'graphify-hook-install-failed';
      // CR9 fallback: without a working hook, freshness relies on watch/explicit refresh.
      entry.fallback = 'graphify-watch-or-explicit-refresh';
    }
    results.push(entry);
  }
  return { schema_version: 'workspace-graph-hooks.v1', workspace_root: workspaceRoot, repos: results };
}

// Re-run merge-graphs to re-converge the workspace merged graph after one or
// more child subgraphs changed. Zero/one/many mirror the build merge semantics.
function reconvergeMerge({ subgraphPaths = [], mergedGraphPath, exec, graphifyCommand = 'graphify' } = {}) {
  if (typeof exec !== 'function') throw new Error('reconvergeMerge requires an exec function');
  if (subgraphPaths.length === 0) {
    return { status: 'not-applicable', reason_code: 'no-eligible-subgraphs', merged_graph_path: null };
  }
  const result = safe(() => exec(graphifyCommand, ['merge-graphs', ...subgraphPaths, '--out', mergedGraphPath], {}));
  if (result && result.status === 0) {
    return {
      status: subgraphPaths.length === 1 ? 'single-source' : 'merged',
      merged_graph_path: mergedGraphPath,
      cross_repo_layer: subgraphPaths.length > 1,
    };
  }
  return { status: 'failed', reason_code: 'merge-reconverge-failed', merged_graph_path: null };
}

// Describe the CodeGraph refresh posture without starting anything. `watcherFact`
// is a provider-untrusted live fact spec-first only reports.
function codegraphRefreshPosture(watcherFact = 'unknown') {
  return {
    provider: 'codegraph',
    refresh_owner: 'provider-native',
    mechanism: 'serve --mcp default watcher (delayed auto-sync)',
    spec_first_starts_watcher: false,
    watcher_fact: watcherFact,
    trust: 'provider_untrusted',
  };
}

function safe(fn) {
  try {
    return fn();
  } catch (_error) {
    return null;
  }
}

module.exports = {
  installChildHooks,
  reconvergeMerge,
  codegraphRefreshPosture,
};
