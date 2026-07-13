'use strict';

const {
  workspaceGraphRefreshPosture,
  codegraphRefreshPosture,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-refresh.cjs');

describe('workspaceGraphRefreshPosture — out-of-tree Graphify uses explicit refresh', () => {
  test('does not claim that a native child hook refreshes the merged workspace graph', () => {
    const posture = workspaceGraphRefreshPosture();
    expect(posture.mode).toBe('explicit');
    expect(posture.native_hook_installed).toBe(false);
    expect(posture.reason_code).toBe('workspace-graph-native-hook-incompatible-with-out-of-tree-artifacts');
    expect(posture.next_action).toContain('--workspace-graph');
  });
});

describe('codegraphRefreshPosture — provider-native, spec-first does not start watcher', () => {
  test('reports watcher fact without starting anything', () => {
    const posture = codegraphRefreshPosture('running');
    expect(posture.spec_first_starts_watcher).toBe(false);
    expect(posture.refresh_owner).toBe('provider-native');
    expect(posture.watcher_fact).toBe('running');
    expect(posture.trust).toBe('provider_untrusted');
  });
});
