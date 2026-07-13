'use strict';

// Workspace Graphify 子图位于需求父目录的 out-of-tree 路径。Graphify 0.9.x
// 原生 hook 只重建 child 默认 output，无法同时重收敛 workspace merged graph，
// 因此 v1 诚实报告显式刷新 contract，不安装会产生错误承诺的 hook。

function workspaceGraphRefreshPosture() {
  return {
    provider: 'graphify',
    refresh_owner: 'spec-first-explicit-command',
    mechanism: 're-run workspace graph build after child source changes',
    mode: 'explicit',
    native_hook_installed: false,
    reason_code: 'workspace-graph-native-hook-incompatible-with-out-of-tree-artifacts',
    next_action: 'Run `spec-mcp-setup --only codegraph,graphify --workspace-graph --repos <a,b,...>`.',
    trust: 'confirmed-local-contract',
  };
}

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

module.exports = {
  workspaceGraphRefreshPosture,
  codegraphRefreshPosture,
};
