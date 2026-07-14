'use strict';

const path = require('node:path');

const MUTATION_MODES = new Set([
  'only',
  'graphify-refresh',
  'host-config-repair',
]);

function requiresRuntimeProjectionPreflight(actionPlan) {
  return Boolean(actionPlan && MUTATION_MODES.has(actionPlan.mode));
}

function selectedRuntimeProjectionTargets(target) {
  if (!target || typeof target !== 'object') return [];
  if (target.mode === 'workspace-all-repos') {
    return (target.candidates || []).map((candidate) => ({
      repo_root: candidate.git_root,
      repo_label: candidate.repo_label || candidate.workspace_relative_path || path.basename(candidate.git_root || ''),
      workspace_relative_path: candidate.workspace_relative_path || '',
    })).filter((candidate) => candidate.repo_root);
  }
  if (target.target_kind !== 'git-repo' || !target.target_root) return [];
  return [{
    repo_root: target.target_root,
    repo_label: target.repo_label || path.basename(target.target_root),
    workspace_relative_path: '',
  }];
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
    return {
      repo_root: target.repo_root,
      repo_label: target.repo_label || path.basename(target.repo_root),
      workspace_relative_path: target.workspace_relative_path || '',
      generated_runtime_manifest: health,
      blocked,
      next_action: blocked ? runtimeInitAction(host, target.repo_root) : null,
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
  };
}

function runtimeInitAction(host, repoRoot) {
  const hostFlag = host ? ` --${host}` : '';
  return `spec-first init${hostFlag} --repo ${quoteCommandArgument(repoRoot)} -y`;
}

function quoteCommandArgument(value) {
  const normalized = String(value || '');
  return /^[A-Za-z0-9_./:\\-]+$/.test(normalized) ? normalized : JSON.stringify(normalized);
}

module.exports = {
  buildWorkspaceRuntimePreflight,
  requiresRuntimeProjectionPreflight,
  selectedRuntimeProjectionTargets,
};
