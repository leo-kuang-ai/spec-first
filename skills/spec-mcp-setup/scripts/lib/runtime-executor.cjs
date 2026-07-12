'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  isBaselineBlocking,
} = require('./baseline-policy.cjs');
const {
  scanConfiguredDependencies,
} = require('./configured-dependencies.cjs');
const {
  collectSetupFacts,
  prepareHostReadinessLedger,
  writeHostReadinessLedger,
  writeSetupFacts,
} = require('./facts.cjs');
const {
  applyHostConfig,
  inspectHostConfig,
  resolveHostConfigTarget,
} = require('./host-config.cjs');
const {
  commandSucceeded,
} = require('./process-runner.cjs');
const {
  inspectProjectConfig,
} = require('./project-config.cjs');
const {
  renderHumanSummary,
} = require('./renderer.cjs');
const {
  applyInstallProvenance,
  combinedInstallProvenance,
  dependencyFor,
  executeInstallWithMirror,
  installBaselineHelpers,
  installBaselineTools,
  probeRegistry,
} = require('./installation-executor.cjs');
const {
  generateSetupScenarioFingerprint,
  scenarioFingerprintFailure,
} = require('./scenario-fingerprint.cjs');
const providers = require('../providers/registry.cjs');
const {
  providerLimitation,
  providerResult,
} = require('../providers/common.cjs');

function runVerificationOrMutation(context, repoRoot) {
  const selectedIds = context.actionPlan.selected_ids;
  const applyInstallMutation = ['only', 'graphify-refresh'].includes(context.actionPlan.mode);
  const applyHostConfigMutation = applyInstallMutation || context.actionPlan.mode === 'host-config-repair';
  let installResults = new Map();
  let helperInstallResults = new Map();
  if (applyInstallMutation) {
    requireCapability(context, 'install-tools');
    installResults = installBaselineTools(context, repoRoot, selectedIds);
    helperInstallResults = installBaselineHelpers(context, repoRoot);
  }
  const baselineInstallFailed = [...installResults.values(), ...helperInstallResults.values()]
    .some((entry) => entry.status !== 'ready');

  const providerDependencyResults = applyInstallMutation && !baselineInstallFailed
    ? installSelectedProviderDependencies(context, repoRoot, selectedIds)
    : new Map();
  let providerResults = applyInstallMutation && baselineInstallFailed
    ? blockedSelectedProviders(context, repoRoot, selectedIds, 'baseline-install-failed')
    : verifyProviders(context, repoRoot, selectedIds);

  const hostConfigResults = configureOrInspectHost(context, repoRoot, {
    applyMutation: applyHostConfigMutation,
    selectedIds,
    providerResults,
    installResults,
  });
  if (applyInstallMutation && !baselineInstallFailed) {
    const dependencyFailure = firstProviderDependencyFailure(providerDependencyResults, selectedIds);
    const hostFailure = firstHostConfigFailure(context, hostConfigResults, selectedIds);
    if (dependencyFailure || hostFailure) {
      providerResults = blockedSelectedProviders(
        context,
        repoRoot,
        selectedIds,
        (dependencyFailure || hostFailure).reason_code,
      );
    } else {
      providerResults = applySelectedProviders(context, repoRoot, selectedIds);
    }
  }
  for (const readiness of providerResults) {
    applyInstallProvenance(readiness, providerDependencyResults.get(readiness.provider));
  }
  reconcileProviderHostConfig(providerResults, hostConfigResults);
  const probes = probeRegistry(context, repoRoot, { selectedIds });
  for (const result of probes.toolResults) {
    const installResult = installResults.get(result.id);
    if (installResult && installResult.status !== 'ready') Object.assign(result, installResult);
    else {
      applyInstallProvenance(result, installResult);
      const hostResult = hostConfigResults.get(result.id);
      if (hostResult) Object.assign(result, hostResult);
    }
    if (applyHostConfigMutation) result.source = 'post-mutation-probe';
  }
  if (applyInstallMutation) {
    for (const result of probes.helperResults) {
      const installResult = helperInstallResults.get(result.id);
      if (installResult && installResult.status !== 'ready') Object.assign(result, installResult);
      else applyInstallProvenance(result, installResult);
      result.source = 'post-mutation-probe';
    }
  }

  const projectStatus = inspectProjectConfig({
    repoRoot,
    templatePath: path.join(context.skillRoot, 'references', 'config-template.yaml'),
  });
  const generatedRuntimeManifest = computeGeneratedRuntimeManifestHealth(context, repoRoot);
  const ripgrepProbe = context.runner('rg', ['--version'], { cwd: repoRoot, timeoutMs: 10000 });
  const factsNow = new Date();
  const baseFactInputs = {
    repoRoot,
    host: context.host,
    platform: context.platform,
    registry: context.effectiveRegistry,
    toolResults: probes.toolResults,
    helperResults: probes.helperResults,
    providerResults: providerResults.map((readiness) => ({
      readiness,
      verified: true,
      source: applyHostConfigMutation ? 'post-mutation-probe' : 'read-only-probe',
    })),
    generatedRuntimeManifest,
    directEvidence: {
      ripgrep: commandSucceeded(ripgrepProbe),
    },
    projectConfigStatus: projectStatus,
    target: context.target,
    now: factsNow,
  };
  const preliminaryBundle = collectSetupFacts(baseFactInputs);
  const configuredScan = scanConfiguredDependencies({
    repoRoot,
    registry: context.effectiveRegistry,
    env: context.env,
    factsTools: preliminaryBundle.toolFacts.tools,
    factsSourcePath: path.join(repoRoot, '.spec-first', 'config', 'tool-facts.json'),
  });
  const bundle = collectSetupFacts({
    ...baseFactInputs,
    configuredDependencies: configuredScan.configured_dependencies,
    configuredScanStatus: configuredScan.status,
  });
  const executionOutcome = reduceExecutionOutcome({
    context,
    probes,
    providerResults,
    hostConfigResults,
    installResults,
    helperInstallResults,
    bundle,
  });
  requireCapability(context, 'write-setup-facts');
  let hostLedgerPreparation = null;
  let hostLedgerWriteResult = null;
  if (context.host) {
    hostLedgerPreparation = prepareHostReadinessLedger({
      repoRoot,
      homeDir: context.homeDir,
      host: context.host,
      toolFacts: bundle.toolFacts,
      runtimeCapabilities: bundle.runtimeCapabilities,
      target: context.target,
    });
    bundle.runtimeCapabilities = hostLedgerPreparation.runtimeCapabilities;
  }
  const writeResult = writeSetupFacts({ repoRoot, ...bundle, writer: context.factsWriter });
  const scenarioFingerprintSetup = writeResult.status === 'ready'
    ? generateSetupScenarioFingerprint(context, repoRoot, bundle)
    : scenarioFingerprintFailure(
      'scenario-fingerprint-facts-unavailable',
      'Setup facts 未提交，因此未生成 setup scenario fingerprint。',
    );
  bundle.toolFacts.scenario_fingerprint_setup = scenarioFingerprintSetup;
  bundle.runtimeCapabilities.scenario_fingerprint_setup = scenarioFingerprintSetup;
  if (hostLedgerPreparation) {
    hostLedgerPreparation.hostLedger.scenario_fingerprint_setup = scenarioFingerprintSetup;
  }
  if (writeResult.status === 'ready') {
    const scenarioLedgerWrite = writeSetupFacts({ repoRoot, ...bundle, writer: context.factsWriter });
    if (scenarioLedgerWrite.status !== 'ready') {
      const ledgerFailure = scenarioFingerprintFailure(
        'scenario-fingerprint-ledger-update-failed',
        scenarioLedgerWrite.diagnostic || scenarioLedgerWrite.reason_code,
        scenarioFingerprintSetup.path ? { path: scenarioFingerprintSetup.path } : {},
      );
      bundle.toolFacts.scenario_fingerprint_setup = ledgerFailure;
      bundle.runtimeCapabilities.scenario_fingerprint_setup = ledgerFailure;
    } else if (hostLedgerPreparation) {
      hostLedgerWriteResult = writeHostReadinessLedger({
        homeDir: context.homeDir,
        host: context.host,
        hostLedger: hostLedgerPreparation.hostLedger,
        writer: context.hostLedgerWriter,
      });
    }
  }
  const writeFailure = writeResult.status === 'ready'
    ? null
    : { reason_code: writeResult.reason_code || 'setup-facts-write-failed' };
  const hostLedgerFailure = hostLedgerWriteResult && hostLedgerWriteResult.status !== 'ready'
    ? { reason_code: hostLedgerWriteResult.reason_code || 'host-readiness-ledger-write-failed' }
    : null;
  const failedOutcome = hostLedgerFailure || executionOutcome || writeFailure;
  const effectiveWriteResult = hostLedgerFailure
    ? { ...writeResult, complete: false }
    : writeResult;
  const executionSummary = buildExecutionSummary({ context, failedOutcome });
  return {
    exit_code: failedOutcome ? 1 : 0,
    mode: context.actionPlan.mode,
    reason_code: failedOutcome ? failedOutcome.reason_code : writeResult.reason_code,
    payload: {
      schema_version: 'spec-mcp-setup-execution.v1',
      mode: context.actionPlan.mode,
      mutation: true,
      target: context.target,
      host: context.host,
      execution_summary: executionSummary,
      tool_facts: bundle.toolFacts,
      runtime_capabilities: bundle.runtimeCapabilities,
      write_result: effectiveWriteResult,
      host_ledger_write_result: hostLedgerWriteResult,
    },
    human: renderHumanSummary(bundle, { executionSummary }),
    target: context.target,
  };
}

function buildExecutionSummary({ context, failedOutcome } = {}) {
  const selectedIds = context && context.actionPlan
    ? [...(context.actionPlan.selected_ids || [])]
    : [];
  const requiredProviderIds = context && context.effectiveRegistry
    ? (context.effectiveRegistry.providers || [])
      .filter((entry) => entry.setup_required === true)
      .map((entry) => entry.id)
    : [];
  const mode = context && context.actionPlan ? context.actionPlan.mode : 'unknown';
  const coversRequiredProviders = requiredProviderIds.every((id) => selectedIds.includes(id));
  const partialScope = ['only', 'graphify-refresh', 'host-config-repair'].includes(mode)
    && !coversRequiredProviders;
  const overallStatus = failedOutcome
    ? 'action-required'
    : (partialScope ? 'partial' : 'ready');
  return {
    overall_status: overallStatus,
    reason_code: failedOutcome && failedOutcome.reason_code
      ? failedOutcome.reason_code
      : (partialScope ? 'subset-setup-complete' : 'setup-ready'),
    scope: partialScope ? 'subset' : 'full',
    selected_ids: selectedIds,
    required_provider_ids: requiredProviderIds,
  };
}

function reduceExecutionOutcome({
  context,
  probes,
  providerResults,
  hostConfigResults,
  installResults,
  helperInstallResults,
  bundle,
}) {
  const tools = new Map((probes.toolResults || []).map((entry) => [entry.id, entry]));
  const helpers = new Map((probes.helperResults || []).map((entry) => [entry.id, entry]));
  const selectedIds = context.actionPlan.selected_ids || [];

  for (const entry of context.effectiveRegistry.tools || []) {
    if (!isBaselineBlocking(entry)) continue;
    if (entry.setup_required === true && !selectedIds.includes(entry.id)) continue;
    const installResult = installResults.get(entry.id);
    if (installResult && installResult.status !== 'ready') {
      return failureOutcome(installResult.reason_code, 'tool-install-failed');
    }
    const observed = tools.get(entry.id);
    if (!observed || observed.status !== 'ready') {
      return failureOutcome(probeFailureReason(observed), 'missing_dependency');
    }
  }

  for (const entry of context.effectiveRegistry.helpers || []) {
    if (!isBaselineBlocking(entry)) continue;
    const installResult = helperInstallResults.get(entry.id);
    if (installResult && installResult.status !== 'ready') {
      return failureOutcome(installResult.reason_code, 'helper-install-failed');
    }
    const observed = helpers.get(entry.id);
    if (!observed || observed.status !== 'ready') {
      return failureOutcome(probeFailureReason(observed), 'missing_dependency');
    }
  }

  for (const entry of context.effectiveRegistry.tools || []) {
    if (entry.host_config_required === false) continue;
    if (entry.setup_required === true && !selectedIds.includes(entry.id)) continue;
    if (entry.required === false && !selectedIds.includes(entry.id)) continue;
    const hostResult = hostConfigResults.get(entry.id);
    if (hostResult && !hostConfigReady(hostResult.configured_status)) {
      return failureOutcome(hostResult.reason_code, 'host-config-action-required');
    }
  }

  const selectedProviderFailure = firstSelectedProviderFailure(providerResults, selectedIds, {
    requireConfigured: false,
  });
  if (selectedProviderFailure) return selectedProviderFailure;

  const selectedProviderConfigFailure = firstSelectedProviderFailure(providerResults, selectedIds, {
    configuredOnly: true,
  });
  if (selectedProviderConfigFailure) return selectedProviderConfigFailure;

  const setupSummary = bundle.runtimeCapabilities && bundle.runtimeCapabilities.setup_summary;
  if (!setupSummary || setupSummary.baseline_ready !== true) {
    return failureOutcome('baseline-action-required');
  }
  if (setupSummary.host_runtime_ready !== true) {
    return failureOutcome('host-runtime-action-required');
  }
  return null;
}

function probeFailureReason(observed) {
  if (!observed) return 'probe-not-run';
  if (observed.status === 'missing') return 'missing_dependency';
  if (observed.status === 'failed') return observed.reason_code || 'probe-failed';
  if (observed.status === 'blocked') return observed.reason_code || 'probe-blocked';
  if (observed.status === 'degraded') return observed.reason_code || 'baseline-degraded';
  if (observed.status === 'skipped') return observed.reason_code || 'required-runtime-skipped';
  return observed.reason_code || 'probe-not-ready';
}

function hostConfigReady(status) {
  return ['ready', 'not-applicable', 'not-required', 'fallback-active'].includes(status);
}

function firstSelectedProviderFailure(providerResults, selectedIds, options = {}) {
  const byId = new Map((providerResults || []).map((entry) => [entry.provider, entry]));
  for (const id of selectedIds || []) {
    const readiness = byId.get(id);
    if (!readiness) return failureOutcome(`${id}-provider-result-missing`);
    const lifecycle = readiness.lifecycle || {};
    if (options.configuredOnly) {
      if (lifecycle.configured !== true) {
        return failureOutcome(providerFailureReason(readiness, 'configured'));
      }
      continue;
    }
    if (['degraded', 'failed', 'blocked'].includes(readiness.readiness_status)) {
      return failureOutcome(providerFailureReason(readiness));
    }
    if (readiness.first_generation
      && ['failed', 'blocked'].includes(readiness.first_generation.status)) {
      return failureOutcome(providerFailureReason(readiness, 'first-generation'));
    }
    for (const field of ['installed', 'initialized', 'indexed', 'artifact_exists']) {
      if (lifecycle[field] !== true) {
        return failureOutcome(providerFailureReason(readiness, field));
      }
    }
    if (options.requireConfigured !== false && lifecycle.configured !== true) {
      return failureOutcome(providerFailureReason(readiness, 'configured'));
    }
  }
  return null;
}

function providerFailureReason(readiness, failedField = '') {
  if (readiness && readiness.reason_code) return readiness.reason_code;
  const hook = readiness && readiness.steady_state ? readiness.steady_state : {};
  if (hook.hook_skipped_reason && ['failed', 'blocked'].includes(hook.hook_status)) {
    return hook.hook_skipped_reason;
  }
  for (const limitation of (readiness && readiness.limitations) || []) {
    const match = String(limitation).match(/(?:failed|blocked):\s*([a-z0-9-]+)\.?/i);
    if (match) return match[1];
  }
  const id = readiness && readiness.provider ? readiness.provider : 'selected-provider';
  if (hook.hook_status === 'failed') return `${id}-hook-verification-failed`;
  if (id === 'graphify'
    && readiness.first_generation
    && readiness.first_generation.status === 'completed'
    && readiness.lifecycle
    && readiness.lifecycle.query_verified !== true) {
    return 'graphify-query-verification-failed';
  }
  if (failedField === 'first-generation') return `${id}-first-generation-failed`;
  if (failedField) return `${id}-lifecycle-${failedField}-not-ready`;
  return `${id}-readiness-degraded`;
}

function failureOutcome(reasonCode, fallback = 'setup-action-required') {
  return { reason_code: reasonCode || fallback };
}

function configureOrInspectHost(context, repoRoot, {
  applyMutation,
  selectedIds,
  providerResults,
  installResults,
}) {
  if (applyMutation) requireCapability(context, 'write-host-config');
  const results = new Map();
  const providerReadiness = new Map((providerResults || []).map((entry) => [entry.provider, entry]));
  for (const entry of context.effectiveRegistry.tools || []) {
    if (entry.host_config_required === false) continue;
    if (entry.setup_required === true && !selectedIds.includes(entry.id)) continue;
    if (entry.required === false && !selectedIds.includes(entry.id)) continue;
    const installResult = installResults && installResults.get(entry.id);
    if (applyMutation && installResult && installResult.status !== 'ready') {
      results.set(entry.id, {
        configured_status: 'action-required',
        reason_code: installResult.reason_code || 'tool-install-failed',
      });
      continue;
    }
    if (applyMutation && entry.required === false && selectedIds.includes(entry.id)) {
      const readiness = providerReadiness.get(entry.id);
      if (readiness && !(readiness.lifecycle && readiness.lifecycle.installed)) {
        results.set(entry.id, {
          configured_status: 'action-required',
          reason_code: 'provider-dependency-not-ready',
        });
        continue;
      }
    }
    const target = resolveHostConfigTarget({
      entry,
      host: context.host,
      authority: context.authority,
      repoRoot,
      homeDir: context.homeDir,
      env: context.env,
      userScope: context.actionPlan.args.userScope,
      requireWritable: applyMutation,
    });
    if (!target.ok) {
      results.set(entry.id, {
        configured_status: target.reason_code === 'host-config-higher-precedence-conflict'
          ? 'precedence-blocked'
          : 'action-required',
        reason_code: target.reason_code,
      });
      continue;
    }
    let inspection = inspectHostConfig({ entry, target });
    const repairAuthorized = context.actionPlan.args.repairHostConfig === true
      && inspection.reason_code === 'host-config-conflict';
    if (applyMutation
      && !inspection.configured
      && (inspection.ok || repairAuthorized)
      && (!inspection.conflict || repairAuthorized)) {
      const applied = applyHostConfig({ entry, target, overwrite: repairAuthorized });
      if (applied.ok) inspection = inspectHostConfig({ entry, target });
      else inspection = { ok: false, configured: false, reason_code: applied.reason_code };
    }
    results.set(entry.id, {
      configured_status: inspection.ok && inspection.configured
        ? 'ready'
        : (inspection.reason_code === 'host-config-higher-precedence-conflict' ? 'precedence-blocked' : 'action-required'),
      reason_code: inspection.reason_code,
      config_key: target.key,
      config_path: inspection.effective_path || target.config_path,
      effective_scope: inspection.effective_scope || target.scope,
      blocking_scope: inspection.blocking_scope || null,
      blocking_path: inspection.blocking_path || null,
      conflict_fields: inspection.conflict_fields || [],
      repair_authorized: repairAuthorized,
      next_action: inspection.reason_code === 'host-config-conflict'
        ? hostConfigRepairCommand(context)
        : null,
    });
  }
  return results;
}

function hostConfigRepairCommand(context) {
  const args = ['spec-mcp-setup'];
  if (context.actionPlan.selected_ids.length > 0) {
    args.push('--only', context.actionPlan.selected_ids.join(','));
  }
  if (context.actionPlan.mode === 'graphify-refresh' || context.actionPlan.args.refresh) args.push('--refresh');
  if (context.actionPlan.args.repo) args.push('--repo', context.actionPlan.args.repo);
  if (context.actionPlan.args.folder) args.push('--folder', context.actionPlan.args.folder);
  if (context.actionPlan.args.allRepos) args.push('--all-repos');
  if (context.actionPlan.args.userScope) args.push('--user-scope');
  if (context.actionPlan.args.requirementWorkspace) {
    args.push('--requirement-workspace', context.actionPlan.args.requirementWorkspace);
  }
  args.push('--repair-host-config');
  return args.join(' ');
}

function installSelectedProviderDependencies(context, repoRoot, selectedIds) {
  const results = new Map();
  for (const id of selectedIds) {
    const module = providers[id];
    if (!module) continue;
    const providerCtx = providerContext(context, repoRoot, id, {
      selected: true,
      refresh: context.actionPlan.mode === 'graphify-refresh',
    });
    let plan = module.plan(providerCtx);
    if (plan.blocked) {
      results.set(id, {
        status: 'failed',
        reason_code: plan.reason_code || `${id}-provider-plan-blocked`,
      });
      continue;
    }
    const dependencyActions = (plan.actions || []).filter((action) => action.kind === 'install-dependency');
    let failedReason = null;
    const actionResults = [];
    for (const action of dependencyActions) {
      const result = executeInstallWithMirror(context, action.command, action.args, {
        cwd: repoRoot,
        timeoutMs: 120000,
        env: action.env,
        inheritEnv: action.inheritEnv,
      });
      actionResults.push(result);
      if (!commandSucceeded(result)) {
        failedReason = `${id}-install-failed`;
        break;
      }
    }
    if (failedReason) {
      results.set(id, {
        status: 'failed',
        reason_code: failedReason,
        ...combinedInstallProvenance(actionResults),
      });
      continue;
    }
    if (dependencyActions.length > 0) {
      plan = module.plan(providerCtx);
      if (plan.blocked) {
        results.set(id, {
          status: 'failed',
          reason_code: plan.reason_code || `${id}-provider-plan-blocked`,
          ...combinedInstallProvenance(actionResults),
        });
      } else if ((plan.actions || []).some((action) => action.kind === 'install-dependency')) {
        results.set(id, {
          status: 'failed',
          reason_code: `${id}-version-pin-mismatch`,
          ...combinedInstallProvenance(actionResults),
        });
      } else {
        results.set(id, {
          status: 'ready',
          reason_code: 'ready',
          ...combinedInstallProvenance(actionResults),
        });
      }
    }
  }
  return results;
}

function firstProviderDependencyFailure(results, selectedIds) {
  for (const id of selectedIds) {
    const result = results.get(id);
    if (result && result.status !== 'ready') {
      return failureOutcome(result.reason_code, `${id}-dependency-not-ready`);
    }
  }
  return null;
}

function firstHostConfigFailure(context, hostConfigResults, selectedIds) {
  for (const entry of context.effectiveRegistry.tools || []) {
    if (entry.host_config_required === false) continue;
    if (entry.required === false && !selectedIds.includes(entry.id)) continue;
    const result = hostConfigResults.get(entry.id);
    if (result && !hostConfigReady(result.configured_status)) {
      return failureOutcome(result.reason_code, 'host-config-action-required');
    }
  }
  return null;
}

function blockedSelectedProviders(context, repoRoot, selectedIds, reasonCode) {
  const selected = selectedIds.map((id) => {
    const entry = (context.effectiveRegistry.providers || []).find((candidate) => candidate.id === id) || { id };
    return blockedProviderReadiness(entry, { reason_code: reasonCode });
  });
  const selectedSet = new Set(selectedIds);
  for (const entry of context.effectiveRegistry.providers || []) {
    if (!selectedSet.has(entry.id) && providers[entry.id]) {
      selected.push(providers[entry.id].verify(providerContext(context, repoRoot, entry.id, { selected: false })));
    }
  }
  return selected;
}

function reconcileProviderHostConfig(providerResults, hostConfigResults) {
  for (const readiness of providerResults || []) {
    const hostResult = hostConfigResults.get(readiness.provider);
    if (!hostResult || !readiness.lifecycle) continue;
    const provider = providers[readiness.provider];
    if (provider && typeof provider.reconcileConfigured === 'function') {
      provider.reconcileConfigured(readiness, hostResult);
    } else {
      readiness.lifecycle.configured = hostResult.configured_status === 'ready';
    }
  }
}

function verifyProviders(context, repoRoot, selectedIds) {
  const ids = new Set([
    ...selectedIds,
    ...(context.effectiveRegistry.providers || []).map((entry) => entry.id),
  ]);
  const results = [];
  for (const id of ids) {
    const module = providers[id];
    if (!module) continue;
    results.push(module.verify(providerContext(context, repoRoot, id, {
      selected: selectedIds.includes(id),
    })));
  }
  return results;
}

function applySelectedProviders(context, repoRoot, selectedIds) {
  requireCapability(
    context,
    context.actionPlan.mode === 'graphify-refresh' ? 'provider-refresh' : 'provider-mutation',
  );
  const results = [];
  for (const id of selectedIds) {
    const module = providers[id];
    if (!module) continue;
    const providerCtx = providerContext(context, repoRoot, id, {
      selected: true,
      refresh: context.actionPlan.mode === 'graphify-refresh',
    });
    const plan = module.plan(providerCtx);
    if (plan.blocked) {
      results.push(blockedProviderReadiness(providerCtx.registryEntry, plan));
      continue;
    }
    results.push(context.actionPlan.mode === 'graphify-refresh' && id === 'graphify'
      ? module.refresh(providerCtx, plan)
      : module.apply(providerCtx, plan));
  }
  for (const entry of context.effectiveRegistry.providers || []) {
    if (!selectedIds.includes(entry.id) && providers[entry.id]) {
      results.push(providers[entry.id].verify(providerContext(context, repoRoot, entry.id, { selected: false })));
    }
  }
  return results;
}

function blockedProviderReadiness(entry, plan) {
  return providerResult(entry, {
    installed: false,
    configured: false,
    initialized: false,
    indexed: false,
    artifactExists: false,
    readinessStatus: 'degraded',
    firstGenerationStatus: 'failed',
    limitations: [providerLimitation('blocked', plan.reason_code, 'Provider mutation 被阻止。')],
    nextActions: ['修复被阻止的 Provider 目标或路径，然后重新运行显式 setup 命令。'],
    hookStatus: 'blocked',
    hookSkippedReason: plan.reason_code,
  });
}

function providerContext(context, repoRoot, id, extra = {}) {
  const entry = (context.effectiveRegistry.providers || []).find((candidate) => candidate.id === id) || {};
  const dependencyRef = entry.dependency_ref
    || (entry.installation && entry.installation.dependency_ref)
    || id;
  return {
    repoRoot,
    host: context.host,
    homeDir: context.homeDir,
    env: context.env,
    platform: context.platform,
    runner: context.runner,
    registryEntry: entry,
    dependency: dependencyFor(context, dependencyRef),
    probeDependency: true,
    requirementWorkspace: context.actionPlan.args.requirementWorkspace || '',
    ...extra,
  };
}

function requireCapability(context, capability) {
  if (context.actionPlan.capabilities.includes(capability)) return;
  const error = new Error(`setup action capability 被拒绝：${capability}`);
  error.reason_code = 'setup-capability-denied';
  throw error;
}

function computeGeneratedRuntimeManifestHealth(context, repoRoot) {
  const statePath = runtimeStatePath(context.host, repoRoot);
  const result = {
    status: 'unknown',
    reason_code: 'unknown-runtime-manifest-health',
    host: context.host,
    state_path: statePath,
    recorded_manifest_version: null,
    bundled_manifest_version: context.bundledVersion || null,
    evidence_basis: '比较 state.manifestVersion 与 bundled manifest.version',
    next_action: `spec-first init --${context.host} -y`,
  };
  if (!context.host || !statePath) {
    result.reason_code = 'missing-host-or-target-root';
    return result;
  }
  if (!fs.existsSync(statePath)) {
    result.status = 'missing';
    result.reason_code = 'runtime-state-missing';
    return result;
  }
  try {
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    result.recorded_manifest_version = state.manifestVersion || null;
    if (!result.recorded_manifest_version) {
      result.status = 'missing';
      result.reason_code = 'runtime-manifest-version-missing';
    } else if (!result.bundled_manifest_version) {
      result.reason_code = 'bundled-manifest-version-unknown';
    } else if (result.recorded_manifest_version === result.bundled_manifest_version) {
      result.status = 'current';
      result.reason_code = null;
      result.next_action = null;
    } else {
      result.status = 'stale';
      result.reason_code = 'runtime-manifest-version-stale';
    }
  } catch (_error) {
    result.reason_code = 'runtime-state-unreadable';
  }
  return result;
}

function runtimeStatePath(host, repoRoot) {
  const roots = {
    claude: '.claude/spec-first/state.json',
    codex: '.codex/spec-first/state.json',
    cursor: '.cursor/spec-first/state.json',
    kiro: '.kiro/spec-first/state.json',
    qoder: '.qoder/spec-first/state.json',
  };
  return roots[host] ? path.join(repoRoot, roots[host]) : null;
}

function resolveBundledVersion({ skillRoot, env, runner }) {
  if (env.SPEC_FIRST_BUNDLED_VERSION) return String(env.SPEC_FIRST_BUNDLED_VERSION);
  let cursor = path.resolve(skillRoot);
  for (let depth = 0; depth < 5; depth += 1) {
    const packagePath = path.join(cursor, 'package.json');
    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        if (pkg.name === 'spec-first' && pkg.version) return String(pkg.version);
      } catch (_error) { /* continue */ }
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  const result = runner('spec-first', ['--version'], { timeoutMs: 10000 });
  if (commandSucceeded(result)) {
    const match = String(result.stdout || '').match(/Spec-First v([0-9A-Za-z._-]+)/);
    if (match) return match[1];
  }
  return '';
}

module.exports = {
  computeGeneratedRuntimeManifestHealth,
  configureOrInspectHost,
  firstSelectedProviderFailure,
  providerContext,
  reconcileProviderHostConfig,
  requireCapability,
  resolveBundledVersion,
  runVerificationOrMutation,
  verifyProviders,
};
