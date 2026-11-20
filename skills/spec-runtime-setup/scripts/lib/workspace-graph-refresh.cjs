'use strict';

// Workspace Graphify subgraph is located in an out-of-tree path under the requirements parent directory. Graphify 0.9.x
// The native hook only reconstructs the child's default output and cannot simultaneously re-converge the workspace merged graph.
// Therefore, the workspace build installs the spec-first custom asynchronous hook only when the runtime context is complete.
// Fails to securely install or maintain the current context; falls back to explicit refresh.

function workspaceGraphRefreshPosture(hooks = null, { preserveAsync = false } = {}) {
  // No hooks parameter (or no spec-first self-sub-repo hook installed) → explicitly refresh posture (compatible with existing calls).
  // spec-first with custom sub-repository hook installation → commit-time async posture: after sub-repository commit, a merged rebuild is triggered in the background.
  const anyInstalled = preserveAsync || (hooks && Array.isArray(hooks.repos)
    && hooks.repos.some((repo) => repo.hook_status === 'installed'));
  if (anyInstalled) {
    const allInstalled = preserveAsync || hooks.repos.every((repo) => repo.hook_status === 'installed');
    return {
      provider: 'graphify',
      refresh_owner: 'spec-first-workspace-hook',
      mechanism: 'spec-first child post-commit triggers async merged rebuild',
      mode: 'commit-hook-spec-first-async',
      native_hook_installed: false,
      reason_code: allInstalled
        ? 'workspace-graph-commit-hook-async'
        : 'workspace-graph-commit-hook-async-partial',
      next_action: '子仓 commit 后台异步重建 merged 图；未安装 hook 的子仓或需要即时刷新时，运行 `spec-runtime-setup --only codegraph,graphify --workspace-graph --repos <a,b,...>`。',
      trust: 'confirmed-local-contract',
    };
  }
  return {
    provider: 'graphify',
    refresh_owner: 'spec-first-explicit-command',
    mechanism: 're-run workspace graph build after child source changes',
    mode: 'explicit',
    native_hook_installed: false,
    reason_code: 'workspace-graph-native-hook-incompatible-with-out-of-tree-artifacts',
    next_action: '运行 `spec-runtime-setup --only codegraph,graphify --workspace-graph --repos <a,b,...>`。',
    trust: 'confirmed-local-contract',
  };
}

function codegraphRefreshPosture(watcherFact = 'unknown') {
  return {
    provider: 'codegraph',
    refresh_owner: 'provider-native',
    mechanism: 'serve --mcp watcher for the server default project only',
    watcher_scope: 'default-project-only',
    workspace_refresh_owner: 'spec-first-workspace-hook',
    workspace_mechanism: 'bounded codegraph sync for every confirmed workspace child',
    spec_first_starts_watcher: false,
    watcher_fact: watcherFact,
    trust: 'provider_untrusted',
  };
}

module.exports = {
  workspaceGraphRefreshPosture,
  codegraphRefreshPosture,
};
