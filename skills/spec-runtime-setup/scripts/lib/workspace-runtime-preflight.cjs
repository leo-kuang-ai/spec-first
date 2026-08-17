'use strict';

const path = require('node:path');

const { resolveWorkspaceTargets } = require('./workspace-target.cjs');
const { readWorkspaceGraphState, resolveStateRepoIds } = require('./workspace-graph-state.cjs');
const { INTERNAL_REFRESH_ONLY_ENV } = require('./workspace-refresh-contract.cjs');
const { buildRuntimeInitRemediation } = require('./runtime-remediation.cjs');

const MUTATION_MODES = new Set([
  'only',
  'graphify-refresh',
  'host-config-repair',
  'workspace-graph-build',
]);

function requiresRuntimeProjectionPreflight(actionPlan) {
  return Boolean(actionPlan && MUTATION_MODES.has(actionPlan.mode));
}

function selectedRuntimeProjectionTargets(target) {
  if (!target || typeof target !== 'object') return [];
  if (target.mode === 'workspace-all-repos') {
    return (target.candidates || []).map((candidate) => ({
      repo_root: candidate.git_root,
      execution_root: candidate.git_root,
      runtime_projection_root: candidate.git_root,
      artifact_root: candidate.git_root,
      repo_label: candidate.repo_label || candidate.workspace_relative_path || path.basename(candidate.git_root || ''),
      workspace_relative_path: candidate.workspace_relative_path || '',
    })).filter((candidate) => candidate.repo_root);
  }
  if (!target.target_root || !target.runtime_projection_root) return [];
  return [{
    repo_root: target.runtime_projection_root,
    execution_root: target.target_root,
    runtime_projection_root: target.runtime_projection_root,
    artifact_root: target.artifact_root || target.target_root,
    repo_label: target.repo_label || path.basename(target.target_root),
    workspace_relative_path: '',
  }];
}

function resolveRuntimeProjectionTargets(context = {}) {
  const actionPlan = context.actionPlan || {};
  if (actionPlan.mode !== 'workspace-graph-build') {
    return {
      targets: selectedRuntimeProjectionTargets(context.target),
      workspaceGraphTargets: null,
    };
  }
  const internalRefresh = context.env && context.env[INTERNAL_REFRESH_ONLY_ENV] === '1';
  const baseline = internalRefresh ? readWorkspaceGraphState(context.cwd) : null;
  const baselineRepos = baseline && baseline.status === 'ready'
    ? resolveStateRepoIds(baseline)
    : [];
  const workspaceGraphTargets = resolveWorkspaceTargets({
    cwd: context.cwd,
    repos: internalRefresh
      ? baselineRepos
      : (actionPlan.args && actionPlan.args.repos ? actionPlan.args.repos : []),
    allowDiscovery: !internalRefresh,
  });
  const eligible = workspaceGraphTargets.topology === 'requirement-workspace'
    && !workspaceGraphTargets.manifest_error
    && workspaceGraphTargets.ambiguous.length === 0;
  const targets = eligible
    ? workspaceGraphTargets.repos
      .filter((repo) => !repo.needs_confirm)
      .map((repo) => ({
        repo_root: repo.git_root,
        execution_root: repo.git_root,
        runtime_projection_root: repo.git_root,
        artifact_root: repo.git_root,
        repo_label: repo.alias || repo.repo_id || path.basename(repo.git_root || ''),
        workspace_relative_path: repo.workspace_relative_path || repo.repo_id || '',
      }))
      .filter((repo) => repo.repo_root)
    : [];
  return { targets, workspaceGraphTargets };
}

function buildProviderPlanSelections({ context = {}, repoRoot, providerPlans = [] } = {}) {
  const target = context.target || {};
  const actionPlan = context.actionPlan || {};
  const args = actionPlan.args || {};
  const registryProviders = context.effectiveRegistry && Array.isArray(context.effectiveRegistry.providers)
    ? context.effectiveRegistry.providers
    : [];
  return providerPlans.map((providerPlan) => {
    const registryEntry = registryProviders.find((entry) => entry.id === providerPlan.provider) || {};
    const firstGeneration = registryEntry.first_generation || {};
    const executionRoot = path.resolve(providerPlan.repo_root || repoRoot);
    const runtimeProjectionRoot = target.target_root
      && path.resolve(target.target_root) === executionRoot
      && target.runtime_projection_root
      ? path.resolve(target.runtime_projection_root)
      : executionRoot;
    const graphifyInputScope = providerPlan.provider === 'graphify'
      ? path.resolve(
        providerPlan.requirement_workspace
          || path.join(executionRoot, providerPlan.requirement_workspace_path
            || args.requirementWorkspace
            || '.'),
      )
      : null;
    const artifactRoot = providerPlan.artifact_root
      || providerPlan.artifact_root_relative
      || firstGeneration.artifact_root
      || null;
    return {
      provider: providerPlan.provider,
      selected: true,
      selection_source: actionPlan.selection_source || 'explicit-only',
      execution_root: executionRoot,
      runtime_projection_root: runtimeProjectionRoot,
      graphify_input_scope: graphifyInputScope,
      artifact_root: artifactRoot ? path.resolve(executionRoot, artifactRoot) : null,
    };
  });
}

function buildWorkspaceRuntimePreflight({ context, targets, computeHealth } = {}) {
  const host = context && context.host ? context.host : '';
  const healthFor = typeof computeHealth === 'function' ? computeHealth : () => ({
    status: 'unknown',
    reason_code: 'runtime-manifest-health-unavailable',
  });
  const results = (targets || []).map((target) => {
    const health = healthFor(context, target.repo_root) || {
      status: 'unknown',
      reason_code: 'runtime-manifest-health-unavailable',
    };
    const blocked = health.status !== 'current';
    const runtimeProjectionRoot = target.runtime_projection_root || target.repo_root;
    const remediation = blocked
      ? buildRuntimeInitRemediation({ host, cwd: runtimeProjectionRoot })
      : {};
    return {
      repo_root: target.repo_root,
      execution_root: target.execution_root || target.repo_root,
      runtime_projection_root: runtimeProjectionRoot,
      artifact_root: target.artifact_root || target.execution_root || target.repo_root,
      repo_label: target.repo_label || path.basename(target.repo_root),
      workspace_relative_path: target.workspace_relative_path || '',
      generated_runtime_manifest: health,
      blocked,
      next_action: null,
      next_action_command: null,
      next_action_headless_command: null,
      ...remediation,
    };
  });
  const blocked = results.filter((result) => result.blocked);
  return {
    schema_version: 'workspace-runtime-projection-preflight.v1',
    confirmed: true,
    host: host || null,
    evaluated_target_count: results.length,
    results,
    overall_status: blocked.length > 0 ? 'action-required' : 'ready',
    reason_code: blocked.length > 0 ? 'generated-runtime-projection-preflight-blocked' : null,
    next_action: blocked.length > 0 ? blocked[0].next_action : null,
    next_action_command: blocked.length > 0 ? blocked[0].next_action_command : null,
    next_action_headless_command: blocked.length > 0 ? blocked[0].next_action_headless_command : null,
  };
}

module.exports = {
  buildProviderPlanSelections,
  buildWorkspaceRuntimePreflight,
  requiresRuntimeProjectionPreflight,
  resolveRuntimeProjectionTargets,
};
