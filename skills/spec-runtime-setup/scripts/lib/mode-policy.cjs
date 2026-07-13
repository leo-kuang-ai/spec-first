'use strict';

const { parseArgs } = require('./args.cjs');

const ACTIONS_BY_MODE = Object.freeze({
  bare: [
    action('diagnose', 'read-only', false),
  ],
  check: [
    action('check-readiness', 'read-only', false),
  ],
  verify: [
    action('verify-readiness', 'read-only', false),
    action('write-setup-facts', 'write-setup-facts', true),
  ],
  plan: [
    action('render-install-plan', 'read-only', false),
  ],
  'project-config': [
    action('inspect-project-config', 'read-only', false),
    action('write-project-config', 'write-project-config', true),
  ],
  'host-config-repair': [
    action('repair-host-config', 'write-host-config', true),
    action('write-setup-facts', 'write-setup-facts', true),
  ],
  only: [
    action('install-tools', 'install-tools', true),
    action('write-host-config', 'write-host-config', true),
    action('provider-mutation', 'provider-mutation', true),
    action('write-setup-facts', 'write-setup-facts', true),
  ],
  'graphify-refresh': [
    action('install-tools', 'install-tools', true),
    action('write-host-config', 'write-host-config', true),
    action('provider-refresh', 'provider-refresh', true),
    action('write-setup-facts', 'write-setup-facts', true),
  ],
  'workspace-graph-build': [
    action('build-workspace-graphs', 'provider-mutation', true),
  ],
  'workspace-graph-clean': [
    action('clean-workspace-graphs', 'provider-mutation', true),
  ],
  'workspace-graph-status': [
    action('inspect-workspace-graphs', 'read-only', false),
  ],
});

function action(id, capability, mutation) {
  return Object.freeze({ id, capability, mutation });
}

function buildActionPlan({ argv = [], knownIds = [], defaultIds = [] } = {}) {
  const args = parseArgs(argv);
  if (args.errors.length > 0) {
    return blockedPlan(args.errors[0].reason_code, args);
  }

  if (args.repo && args.folder) return blockedPlan('repo-and-folder', args);
  if (args.repo && args.allRepos) return blockedPlan('repo-and-all-repos', args);
  if (args.folder && args.allRepos) return blockedPlan('folder-and-all-repos', args);

  const workspaceActions = [
    args.workspaceGraph && 'workspace-graph-build',
    args.workspaceGraphClean && 'workspace-graph-clean',
    args.workspaceGraphStatus && 'workspace-graph-status',
  ].filter(Boolean);
  if (workspaceActions.length > 1) return blockedPlan('workspace-graph-action-conflict', args);
  if (args.repos.length > 0 && workspaceActions.length === 0) {
    return blockedPlan('repos-requires-workspace-graph-action', args);
  }
  if (workspaceActions.length > 0 && args.allRepos) {
    return blockedPlan('workspace-graph-all-repos-conflict', args);
  }
  if (workspaceActions.length > 0 && (args.repo || args.folder)) {
    return blockedPlan('workspace-graph-target-conflict', args);
  }
  if (workspaceActions.length > 0 && (
    args.check
    || args.verifyOnly
    || args.refreshFacts
    || args.plan
    || args.projectConfig
    || args.repairHostConfig
    || args.refresh
    || args.requirementWorkspace
  )) return blockedPlan('workspace-graph-mode-conflict', args);
  if (workspaceActions.length > 0 && args.only.length > 0 && !hasWorkspaceProviders(args.only)) {
    return blockedPlan('workspace-graph-provider-selection-invalid', args);
  }
  if (args.workspaceGraph && !hasWorkspaceProviders(args.only)) {
    return blockedPlan('workspace-graph-requires-codegraph-graphify', args);
  }

  if (args.repairHostConfig && (args.check || args.verifyOnly || args.refreshFacts || args.projectConfig)) {
    return blockedPlan('repair-host-config-mode-conflict', args);
  }

  const selectedModes = [
    ...workspaceActions,
    args.check && 'check',
    (args.verifyOnly || args.refreshFacts) && 'verify',
    args.plan && 'plan',
    args.projectConfig && 'project-config',
    args.only.length > 0 && !args.plan && workspaceActions.length === 0 && 'only',
    args.repairHostConfig && args.only.length === 0 && !args.plan && 'host-config-repair',
  ].filter(Boolean);
  if (new Set(selectedModes).size > 1) {
    return blockedPlan('mode-conflict', args);
  }

  if (args.only.length > 0) {
    const known = new Set(Array.isArray(knownIds) ? knownIds.map(String) : []);
    const unknownIds = args.only.filter((id) => !known.has(id));
    if (unknownIds.length > 0) {
      return blockedPlan('unknown-optional-provider-selection', args, { unknown_ids: unknownIds });
    }
  }

  if (args.refresh && (
    args.only.length !== 1
    || args.only[0] !== 'graphify'
    || args.check
    || args.verifyOnly
    || args.refreshFacts
    || args.projectConfig
  )) {
    return blockedPlan('refresh-without-only-graphify', args);
  }

  let mode = selectedModes[0] || 'bare';
  if (args.refresh && !args.plan) mode = 'graphify-refresh';
  const actions = ACTIONS_BY_MODE[mode].map((entry) => ({ ...entry }));
  const capabilities = actions
    .filter((entry) => entry.mutation)
    .map((entry) => entry.capability);

  return {
    blocked: false,
    mode,
    mutation: actions.some((entry) => entry.mutation),
    capabilities,
    reason_code: 'action-plan-ready',
    actions,
    args,
    selection_source: args.only.length > 0
      ? 'explicit-only'
      : (['verify', 'plan'].includes(mode) ? 'default-required' : 'not-selected'),
    selected_ids: args.only.length > 0
      ? [...args.only]
      : (['verify', 'plan'].includes(mode) ? [...defaultIds] : []),
  };
}

function hasWorkspaceProviders(ids) {
  return ids.length === 2 && ids.includes('codegraph') && ids.includes('graphify');
}

function blockedPlan(reasonCode, args, extra = {}) {
  return {
    blocked: true,
    mode: 'blocked',
    mutation: false,
    capabilities: [],
    reason_code: reasonCode,
    actions: [],
    args,
    selected_ids: [...args.only],
    ...extra,
  };
}

module.exports = {
  buildActionPlan,
};
