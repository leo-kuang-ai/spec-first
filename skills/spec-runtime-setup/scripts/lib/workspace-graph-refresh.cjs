'use strict';

// Workspace Graphify 子图位于需求父目录的 out-of-tree 路径。Graphify 0.9.x
// 原生 hook 只重建 child 默认 output，无法同时重收敛 workspace merged graph，
// 因此 v1 诚实报告显式刷新 contract，不安装会产生错误承诺的 hook。

function workspaceGraphRefreshPosture(hooks = null) {
  // 无 hooks 参数（或未安装任何 spec-first 自有子仓 hook）→ 显式刷新 posture（兼容既有调用）。
  // 有 spec-first 自有子仓 hook 安装 → commit-time async posture：子仓 commit 后台触发 merged 重建。
  const anyInstalled = hooks && Array.isArray(hooks.repos)
    && hooks.repos.some((repo) => repo.hook_status === 'installed');
  if (anyInstalled) {
    const allInstalled = hooks.repos.every((repo) => repo.hook_status === 'installed');
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
