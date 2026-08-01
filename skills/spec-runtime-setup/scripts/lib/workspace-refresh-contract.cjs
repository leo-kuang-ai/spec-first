'use strict';

const INTERNAL_REFRESH_ONLY_ENV = 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPH_REFRESH_ONLY';
const INTERNAL_CODEGRAPH_COMMAND_ENV = 'SPEC_FIRST_INTERNAL_WORKSPACE_CODEGRAPH_COMMAND';
const INTERNAL_GRAPHIFY_COMMAND_ENV = 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPHIFY_COMMAND';
const WORKSPACE_REFRESH_ENV_ALLOWLIST = Object.freeze([
  'HOME', 'USERPROFILE', 'PATH', 'PATHEXT', 'LANG', 'LC_ALL', 'LC_CTYPE',
  'TMPDIR', 'TMP', 'TEMP', 'SYSTEMROOT', 'COMSPEC',
  'UV_TOOL_DIR', 'UV_TOOL_BIN_DIR', 'PIPX_HOME', 'PIPX_BIN_DIR',
]);
const RECOVERABLE_PARTIAL_REASON_CODES = new Set([
  'workspace-codegraph-sync-partial',
  'workspace-graphify-build-partial',
  'workspace-merge-failed',
  'workspace-source-changed-during-build',
  'workspace-async-refresh-status-clear-failed',
]);

function workspaceRefreshStateEligible(stateResult) {
  if (!stateResult || stateResult.status !== 'ready') return false;
  const state = stateResult.state;
  if (!state
    || state.refresh_mode !== 'commit-hook-spec-first-async'
    || !state.refresh_hook
    || state.refresh_hook.schema_version !== 'workspace-child-hook-contract.v2') {
    return false;
  }
  if (state.operation_status === 'complete') return true;
  return state.operation_status === 'partial'
    && RECOVERABLE_PARTIAL_REASON_CODES.has(state.reason_code);
}

module.exports = {
  INTERNAL_CODEGRAPH_COMMAND_ENV,
  INTERNAL_GRAPHIFY_COMMAND_ENV,
  INTERNAL_REFRESH_ONLY_ENV,
  WORKSPACE_REFRESH_ENV_ALLOWLIST,
  workspaceRefreshStateEligible,
};
