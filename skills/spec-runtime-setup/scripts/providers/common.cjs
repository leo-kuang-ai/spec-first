'use strict';

const fs = require('node:fs');
const path = require('node:path');

function run(context, command, args, options = {}) {
  if (typeof context.runner === 'function') return context.runner(command, args, options);
  const processRunner = require('../lib/process-runner.cjs');
  const runner = processRunner.runProcessSync || processRunner.runProcess;
  if (typeof runner !== 'function') throw new Error('process runner 未暴露 runProcessSync 或 runProcess');
  return runner({ command, args, ...options });
}

function exitCode(result) {
  if (Number.isInteger(result && result.exit_code)) return result.exit_code;
  if (Number.isInteger(result && result.status)) return result.status;
  return null;
}

function succeeded(result) {
  return Boolean(result)
    && exitCode(result) === 0
    && !result.signal
    && !result.error
    && !result.timeout
    && !result.timed_out;
}

function text(result) {
  return `${result && result.stdout ? result.stdout : ''}\n${result && result.stderr ? result.stderr : ''}`.trim();
}

function versionOutputMatches(output, versionPin) {
  if (!versionPin) return true;
  const escaped = String(versionPin).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^0-9A-Za-z.])${escaped}([^0-9A-Za-z.]|$)`).test(String(output || ''));
}

function providerLimitation(outcome, reasonCode, message) {
  return `${outcome}: ${reasonCode}. ${message}`;
}

function providerResult(metadata, options = {}) {
  const installed = Boolean(options.installed);
  const configured = Boolean(options.configured);
  const initialized = Boolean(options.initialized);
  const indexed = Boolean(options.indexed);
  const artifactExists = Boolean(options.artifactExists);
  const serverReachable = Boolean(options.serverReachable);
  const queryVerified = Boolean(options.queryVerified);
  const fallbackUsed = Boolean(options.fallbackUsed);
  const firstGeneration = metadata.first_generation || {};
  const steadyState = metadata.steady_state || {};
  return {
    schema_version: 'provider-readiness.v2',
    provider: metadata.id,
    kind: metadata.kind || 'generic',
    profile: metadata.profile || 'optional',
    readiness_status: options.readinessStatus || (installed ? 'unknown' : 'not-run'),
    lifecycle: {
      installed,
      configured,
      initialized,
      indexed,
      server_reachable: serverReachable,
      artifact_exists: artifactExists,
      query_verified: queryVerified,
      fallback_used: fallbackUsed,
    },
    repo_aligned: options.repoAligned || 'unknown',
    capabilities: metadata.capabilities || [metadata.capability_class].filter(Boolean),
    limitations: options.limitations || [
      'Provider candidate 仅为 advisory，必须通过 source、test、log、contract 或 owner evidence 确认。',
    ],
    source_read_required: true,
    fallback: metadata.fallback || {
      available: true,
      methods: ['rg', 'direct-source-read'],
      reason_code: 'provider-unavailable',
    },
    next_actions: (options.nextActions || []).filter(Boolean),
    native_interfaces: Array.isArray(metadata.native_interfaces) ? metadata.native_interfaces : [],
    first_generation: {
      owner: firstGeneration.owner || 'unknown',
      status: options.firstGenerationStatus || firstGeneration.status || 'unknown',
      scope: firstGeneration.scope || 'unknown',
      requires_explicit_gate: firstGeneration.requires_explicit_gate === true,
      requirement_workspace_path: options.requirementWorkspacePath === undefined
        ? (firstGeneration.requirement_workspace_path || null)
        : options.requirementWorkspacePath,
      artifact_root: firstGeneration.artifact_root || null,
      artifact_refs: options.artifactRefs || [],
      next_action: options.firstGenerationNextAction || null,
    },
    steady_state: {
      refresh_owner: steadyState.refresh_owner || 'unknown',
      refresh_mode: options.refreshMode || steadyState.refresh_mode || 'unknown',
      hook_default: steadyState.hook_default === true,
      usage_owner: steadyState.usage_owner || 'unknown',
      hook_installed: Boolean(options.hookInstalled),
      hook_verified: Boolean(options.hookVerified),
      hook_status: options.hookStatus || (options.hookVerified ? 'verified' : 'unknown'),
      hook_skipped_reason: options.hookSkippedReason || null,
    },
    usage_note: metadata.usage_note || '使用 provider-native interface 获取 advisory candidate，并通过 direct evidence 确认结论。',
  };
}

function artifactExists(repoRoot, candidates) {
  return candidates.some((relativePath) => fs.existsSync(path.join(repoRoot, relativePath)));
}

function isSpecFirstSourceRepo(repoRoot) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
    return packageJson.name === 'spec-first'
      && fs.existsSync(path.join(repoRoot, 'skills', 'spec-runtime-setup'));
  } catch (_error) {
    return false;
  }
}

module.exports = {
  artifactExists,
  isSpecFirstSourceRepo,
  providerLimitation,
  providerResult,
  run,
  succeeded,
  text,
  versionOutputMatches,
};
