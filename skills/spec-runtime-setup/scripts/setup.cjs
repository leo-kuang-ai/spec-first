#!/usr/bin/env node
'use strict';

const os = require('node:os');
const path = require('node:path');
const { parseEntrypointOptions } = require('./lib/args.cjs');
const { isAbsolutePath } = require('./lib/path-safety.cjs');
const {
  buildActionPlan,
} = require('./lib/mode-policy.cjs');
const {
  isBaselineBlocking,
} = require('./lib/baseline-policy.cjs');
const {
  resolveHostAuthority,
} = require('./lib/host-authority.cjs');
const {
  resolveProjectTarget,
} = require('./lib/project-target.cjs');
const {
  detectRuntimePlatform,
  getDiagnosticRegistry,
  getEffectiveRegistry,
  loadRegistry,
} = require('./lib/registry.cjs');
const { inspectHostConfig, resolveHostConfigTarget } = require('./lib/host-config.cjs');
const {
  applyProjectConfig,
  inspectProjectConfig,
  planProjectConfig,
} = require('./lib/project-config.cjs');
const { readSetupSnapshot } = require('./lib/facts.cjs');
const {
  buildPreflightProjection,
} = require('./lib/preflight.cjs');
const {
  advisoryHostCandidates,
  diagnosticNextActions,
  renderDiagnosticHuman,
} = require('./lib/human-output.cjs');
const {
  renderBlocked,
  renderDiagnostic,
  renderInstallPlan,
  renderJson,
} = require('./lib/renderer.cjs');
const {
  runCommandSync,
} = require('./lib/process-runner.cjs');
const {
  runWorkspaceBatch,
} = require('./lib/workspace-executor.cjs');
const {
  buildProviderPlanSelections,
  buildWorkspaceRuntimePreflight,
  requiresRuntimeProjectionPreflight,
  resolveRuntimeProjectionTargets,
} = require('./lib/workspace-runtime-preflight.cjs');
const {
  runWorkspaceGraphBuild,
} = require('./lib/workspace-graph-executor.cjs');
const {
  runWorkspaceGraphClean,
} = require('./lib/workspace-graph-clean.cjs');
const {
  runWorkspaceGraphStatus,
} = require('./lib/workspace-graph-status.cjs');
const {
  INTERNAL_CODEGRAPH_COMMAND_ENV,
  INTERNAL_GRAPHIFY_COMMAND_ENV,
  INTERNAL_REFRESH_ONLY_ENV,
} = require('./lib/workspace-refresh-contract.cjs');
const {
  workspaceGraphLifecycleCredentialFromEnv,
} = require('./lib/workspace-graph-lifecycle-lease.cjs');
const {
  buildParentWorkspaceDiagnostic,
  renderParentWorkspaceDiagnosticHuman,
} = require('./lib/workspace-parent-diagnostic.cjs');
const {
  dependencyFor,
  interpolateArgs,
  probeHelper,
  probeRegistry,
  resolveInstallation,
  warmupCacheHit,
} = require('./lib/installation-executor.cjs');
const {
  configureOrInspectHost,
  computeGeneratedRuntimeManifestHealth,
  providerContext,
  reconcileProviderHostConfig,
  requireCapability,
  resolveBundledVersion,
  runVerificationOrMutation,
  verifyProviders,
} = require('./lib/runtime-executor.cjs');
const providers = require('./providers/registry.cjs');

function runSetup(input = {}) {
  const argv = Array.isArray(input.argv) ? input.argv.map(String) : [];
  const cwd = path.resolve(input.cwd || process.cwd());
  const env = input.env || process.env;
  const skillRoot = path.resolve(input.skillRoot || path.join(__dirname, '..'));
  const homeDir = path.resolve(input.homeDir || os.homedir());
  const platform = detectRuntimePlatform({
    platform: input.platform || process.platform,
    env,
    procVersion: input.procVersion,
  });
  const parsed = parseEntrypointOptions(argv);
  if (parsed.options.help) return helpResult();

  let registry;
  try {
    registry = input.registry || loadRegistry({ skillRoot });
  } catch (error) {
    return failedResult('registry-load-failed', error, 2);
  }
  const knownIds = registry.providers.map((entry) => entry.id);
  const defaultIds = registry.providers
    .filter((entry) => entry.setup_required === true)
    .map((entry) => entry.id);
  const actionPlan = buildActionPlan({ argv: parsed.modeArgv, knownIds, defaultIds });
  if (actionPlan.blocked) {
    return {
      exit_code: 2,
      mode: 'blocked',
      reason_code: actionPlan.reason_code,
      payload: renderBlocked(actionPlan),
      human: `Runtime 设置被阻止：${actionPlan.reason_code}\n`,
      target: null,
    };
  }

  const target = resolveProjectTarget({
    cwd,
    repo: actionPlan.args.repo,
    folder: actionPlan.args.folder,
    allRepos: actionPlan.args.allRepos,
  });
  if (target.mode === 'invalid-target' || (!target.state_write_allowed && actionPlan.mutation)) {
    return {
      exit_code: 2,
      mode: actionPlan.mode,
      reason_code: target.reason_code || 'workspace-target-required',
      payload: {
        schema_version: 'project-target.v2',
        ...target,
      },
      human: `${target.next_action || 'mutation 前请选择目标 repo。'}\n`,
      target,
    };
  }

  const mutationNeedsHost = ['verify', 'only', 'graphify-refresh', 'host-config-repair', 'workspace-graph-build'].includes(actionPlan.mode);
  const runner = input.runner || runCommandSync;
  const candidates = advisoryHostCandidates({ env, runner });
  const internalWorkspaceRefresh = isInternalWorkspaceGraphRefreshInvocation({ actionPlan, env });
  const authority = resolveHostAuthority({
    env,
    mutationRequested: mutationNeedsHost,
    candidates,
    skillRoot,
    targetIdentity: target.target_root || target.workspace_root || cwd,
    // Detached workspace refresh is launched from canonical source, not a host
    // Skill mirror. Its mutation authority is the validated lifecycle lease.
    enforceSurfaceBinding: input.enforceSurfaceBinding === true && !internalWorkspaceRefresh,
    now: input.now,
  });
  if (authority.status === 'blocked') {
    return {
      exit_code: 2,
      mode: actionPlan.mode,
      reason_code: authority.reason_code,
      payload: authority,
      human: `Runtime 设置被阻止：${authority.reason_code}\n`,
      target,
    };
  }

  const host = authority.host || candidates[0] || null;
  const effectiveRegistry = host
    ? getEffectiveRegistry(registry, { host, platform })
    : getDiagnosticRegistry(registry, { platform });
  const needsBundledVersion = mutationNeedsHost || actionPlan.mode === 'workspace-graph-status';
  const context = {
    ...input,
    argv,
    cwd,
    env,
    skillRoot,
    homeDir,
    platform,
    parsed: parsed.options,
    registry,
    effectiveRegistry,
    actionPlan,
    target,
    authority,
    host,
    runner,
    bundledVersion: input.bundledVersion
      || (needsBundledVersion
        ? parsed.options.pluginVersion || resolveBundledVersion({ skillRoot, env, runner })
        : ''),
    setupScriptDir: __dirname,
  };

  try {
    if (actionPlan.args.workspaceGraphStatus) {
      return runWorkspaceGraphStatusSetup(context);
    }
    const runtimeProjectionSelection = requiresRuntimeProjectionPreflight(actionPlan)
      ? resolveRuntimeProjectionTargets(context)
      : null;
    const runtimePreflight = buildRuntimeProjectionPreflight(context, runtimeProjectionSelection);
    if (runtimePreflight && runtimePreflight.overall_status === 'action-required') {
      return blockedRuntimeProjectionResult(context, runtimePreflight);
    }
    if (target.mode === 'workspace-all-repos') {
      // Clean/status/build under the workspace-graph domain (mutation modes + bare/check status).
      if (actionPlan.args.workspaceGraphClean) {
        return runWorkspaceGraphCleanSetup(context);
      }
      if (actionPlan.args.workspaceGraph) {
        return runWorkspaceGraphSetup(
          context,
          runtimeProjectionSelection,
        );
      }
      if (!['bare', 'check'].includes(actionPlan.mode)) {
        return runWorkspaceBatch(context, { runSingleTarget });
      }
      // bare/check on a requirement parent: dual-path diagnostic (not single-repo facts).
      if (actionPlan.mode === 'bare' || actionPlan.mode === 'check') {
        return runParentWorkspaceDiagnostic(context);
      }
    }
    return runSingleTarget(context, target.target_root || cwd);
  } catch (error) {
    return failedResult(error.reason_code || 'setup-execution-failed', error, 1, {
      mode: actionPlan.mode,
      target,
    });
  }
}

function isInternalWorkspaceGraphRefreshInvocation({ actionPlan, env = {} } = {}) {
  if (!actionPlan || actionPlan.mode !== 'workspace-graph-build') return false;
  const credential = workspaceGraphLifecycleCredentialFromEnv(env);
  return env[INTERNAL_REFRESH_ONLY_ENV] === '1'
    && isAbsolutePath(env[INTERNAL_CODEGRAPH_COMMAND_ENV])
    && isAbsolutePath(env[INTERNAL_GRAPHIFY_COMMAND_ENV])
    && Boolean(credential && credential.token && credential.owner_pid);
}

function buildRuntimeProjectionPreflight(context, selection = null) {
  if (!requiresRuntimeProjectionPreflight(context.actionPlan)) return null;
  const resolvedSelection = selection || resolveRuntimeProjectionTargets(context);
  const { targets } = resolvedSelection;
  if (targets.length === 0) return null;
  return buildWorkspaceRuntimePreflight({
    context,
    targets,
    computeHealth: computeGeneratedRuntimeManifestHealth,
  });
}

function blockedRuntimeProjectionResult(context, payload) {
  const nextAction = payload.next_action || '运行 spec-first init 刷新当前 host runtime projection，然后重试 setup。';
  return {
    exit_code: 2,
    mode: context.actionPlan.mode,
    reason_code: payload.reason_code,
    payload,
    human: `Runtime 设置被阻止：${payload.reason_code}\n下一步：${nextAction}\n`,
    target: context.target,
  };
}

function runParentWorkspaceDiagnostic(context) {
  const { actionPlan, cwd, target, host } = context;
  const payload = buildParentWorkspaceDiagnostic({
    cwd,
    target,
    host,
    repos: actionPlan.args.repos || [],
  });
  return {
    exit_code: payload.overall_status === 'ready' ? 0 : 1,
    mode: actionPlan.mode,
    reason_code: payload.reason_code,
    payload,
    human: renderParentWorkspaceDiagnosticHuman(payload),
    target,
  };
}

function runWorkspaceGraphSetup(context, runtimeProjectionSelection) {
  const { actionPlan, cwd, target } = context;
  const workspaceGraphTargets = runtimeProjectionSelection
    ? runtimeProjectionSelection.workspaceGraphTargets
    : null;
  const executionContext = !runtimeProjectionSelection || runtimeProjectionSelection.targets.length > 0
    ? resolveWorkspaceGraphExecutionContext(context)
    : {
      ok: true,
      refreshOnly: false,
      codegraphCommand: 'codegraph',
      graphifyCommand: 'graphify',
      lifecycleCredential: null,
    };
  if (!executionContext.ok) {
    return {
      exit_code: 2,
      mode: actionPlan.mode,
      reason_code: executionContext.reason_code,
      payload: executionContext,
      human: `Workspace 双层图构建被阻止：${executionContext.reason_code}\n`,
      target,
    };
  }
  const result = runWorkspaceGraphBuild({
    cwd,
    repos: actionPlan.args.repos || [],
    // exec is injectable for tests; undefined falls back to spawnSync inside the executor.
    exec: context.workspaceExec,
    codegraphCommand: executionContext.codegraphCommand,
    graphifyCommand: executionContext.graphifyCommand,
    lifecycleCredential: executionContext.lifecycleCredential,
    refreshOnly: executionContext.refreshOnly,
    runtimeHost: context.host,
    bundledVersion: context.bundledVersion,
    resolvedTargets: workspaceGraphTargets,
  });
  const exitCode = workspaceMutationExitCode(result.status);
  const detail = result.reason_code ? ` (${result.reason_code})` : '';
  const pending = Array.isArray(result.pending_confirm) ? result.pending_confirm : [];
  const confirmation = result.status === 'needs-confirmation' && pending.length > 0
    ? `\n  pending_confirm: ${pending.join(', ')}\n  confirm: spec-runtime-setup --only codegraph,graphify --workspace-graph --repos ${pending.join(',')}`
    : '';
  return {
    exit_code: exitCode,
    mode: actionPlan.mode,
    reason_code: result.reason_code || (result.status === 'complete' ? '' : result.status),
    payload: result,
    human: `Workspace 双层图构建：${result.status}${detail}${confirmation}\n`,
    target,
  };
}

function resolveWorkspaceGraphExecutionContext(context) {
  const env = context.env || {};
  const lifecycleCredential = workspaceGraphLifecycleCredentialFromEnv(env);
  const refreshMarker = env[INTERNAL_REFRESH_ONLY_ENV];
  const pinnedCodegraphCommand = env[INTERNAL_CODEGRAPH_COMMAND_ENV];
  const pinnedGraphifyCommand = env[INTERNAL_GRAPHIFY_COMMAND_ENV];
  const hasInternalInput = refreshMarker !== undefined
    || pinnedCodegraphCommand !== undefined
    || pinnedGraphifyCommand !== undefined
    || lifecycleCredential !== null;

  if (hasInternalInput) {
    if (refreshMarker !== '1') {
      return {
        ok: false,
        reason_code: 'workspace-graph-refresh-context-invalid',
      };
    }
    if (!lifecycleCredential) {
      return {
        ok: false,
        reason_code: 'workspace-graph-refresh-credential-required',
      };
    }
    if (!isAbsolutePath(pinnedCodegraphCommand) || !isAbsolutePath(pinnedGraphifyCommand)) {
      return {
        ok: false,
        reason_code: 'workspace-graph-refresh-launcher-invalid',
      };
    }
    return {
      ok: true,
      reason_code: null,
      refreshOnly: true,
      codegraphCommand: pinnedCodegraphCommand,
      graphifyCommand: pinnedGraphifyCommand,
      lifecycleCredential,
    };
  }

  const codegraphResolutionContext = providerContext(context, context.cwd, 'codegraph', { selected: true });
  const codegraphResolver = typeof context.resolveWorkspaceCodegraphCommand === 'function'
    ? context.resolveWorkspaceCodegraphCommand
    : (providerCtx, repoRoot) => providers.codegraph.resolveCodegraphCommand(
      providerCtx,
      repoRoot,
      providerCtx.dependency,
    );
  let resolvedCodegraph;
  try {
    resolvedCodegraph = codegraphResolver(codegraphResolutionContext, context.cwd);
  } catch (_error) {
    resolvedCodegraph = null;
  }
  if (!resolvedCodegraph || !resolvedCodegraph.ok || !isAbsolutePath(resolvedCodegraph.command)) {
    return {
      ok: false,
      reason_code: (resolvedCodegraph && resolvedCodegraph.reason_code)
        || 'workspace-graph-codegraph-launcher-unverified',
    };
  }

  const resolutionContext = providerContext(context, context.cwd, 'graphify', { selected: true });
  const resolver = typeof context.resolveWorkspaceGraphifyCommand === 'function'
    ? context.resolveWorkspaceGraphifyCommand
    : (providerCtx, repoRoot) => providers.graphify.resolvePythonGraphifyCommand(
      providerCtx,
      repoRoot,
      providerCtx.dependency,
    );
  let resolved;
  try {
    resolved = resolver(resolutionContext, context.cwd);
  } catch (_error) {
    resolved = null;
  }
  if (!resolved || !resolved.ok || !isAbsolutePath(resolved.command)) {
    return {
      ok: false,
      reason_code: (resolved && resolved.reason_code) || 'workspace-graph-graphify-launcher-unverified',
    };
  }
  return {
    ok: true,
    reason_code: null,
    refreshOnly: false,
    codegraphCommand: resolvedCodegraph.command,
    graphifyCommand: resolved.command,
    lifecycleCredential: null,
  };
}

function workspaceMutationExitCode(status) {
  if (status === 'complete') return 0;
  if (status === 'needs-confirmation' || status === 'skipped') return 2;
  return 1;
}

function runWorkspaceGraphCleanSetup(context) {
  const { actionPlan, cwd, target } = context;
  const result = runWorkspaceGraphClean({
    cwd,
    repos: actionPlan.args.repos || [],
    exec: context.workspaceExec,
  });
  const exitCode = workspaceMutationExitCode(result.status);
  const detail = result.reason_code ? ` (${result.reason_code})` : '';
  return {
    exit_code: exitCode,
    mode: actionPlan.mode,
    reason_code: result.reason_code || (result.status === 'complete' ? '' : result.status),
    payload: result,
    human: `Workspace 双层图清理：${result.status}${detail}\n`,
    target,
  };
}

function runWorkspaceGraphStatusSetup(context) {
  const { actionPlan, cwd, target, bundledVersion } = context;
  const result = runWorkspaceGraphStatus({
    cwd,
    repos: actionPlan.args.repos || [],
    bundledVersion,
  });
  // Status is diagnostic: absent/partial still exit 0 so doctor-style consumers can read the envelope.
  return {
    exit_code: result.status === 'invalid' ? 1 : 0,
    mode: actionPlan.mode,
    reason_code: result.reason_code || '',
    payload: result,
    human: renderWorkspaceGraphStatusHuman(result),
    target,
  };
}

function renderWorkspaceGraphStatusHuman(result) {
  if (result.status === 'skipped') {
    return `Workspace 双层图状态：skipped (${result.reason_code || result.topology})\n`;
  }
  const lines = [
    `Workspace 双层图状态：${result.status}${result.reason_code ? ` (${result.reason_code})` : ''}`,
    `  root: ${result.workspace_root}`,
  ];
  for (const repo of result.repos || []) {
    lines.push(
      `  child ${repo.repo_id}: codegraph=${repo.codegraph_present ? 'yes' : 'no'}`
        + ` graphify_subgraph=${repo.graphify_subgraph_present ? 'yes' : 'no'}`
        + ` projectPath_contained=${repo.project_path_contained}`
        + `${repo.last_reason_code ? ` reason=${repo.last_reason_code}` : ''}`,
    );
  }
  if (result.workspace) {
    const sizeNote = result.workspace.merged_size_bytes != null
      ? ` size=${result.workspace.merged_size_bytes}B`
      : '';
    lines.push(
      `  workspace graphify: ${result.workspace.merged_present ? 'merged' : (result.workspace.graphify_present ? 'partial' : 'absent')}${sizeNote}`,
    );
    lines.push(
      `  state: ${result.workspace.state_status || 'unknown'}`
        + ` freshness=${result.workspace.freshness && result.workspace.freshness.freshness
          ? result.workspace.freshness.freshness
          : 'unknown'}`
        + ` refresh=${result.workspace.refresh_mode || 'unknown'}`,
    );
    const lifecycle = result.workspace.lifecycle;
    if (lifecycle && lifecycle.status && lifecycle.status !== 'none') {
      lines.push(
        `  lifecycle: ${lifecycle.status}`
          + `${lifecycle.active_operation ? ` operation=${lifecycle.active_operation}` : ''}`
          + `${lifecycle.reason_code ? ` reason=${lifecycle.reason_code}` : ''}`
          + `${lifecycle.quarantine_count ? ` quarantine=${lifecycle.quarantine_count}` : ''}`,
      );
    }
  }
  if (Array.isArray(result.pending_confirm) && result.pending_confirm.length > 0) {
    lines.push(`  pending_confirm: ${result.pending_confirm.join(', ')}`);
  }
  if (result.default_project_path) {
    lines.push(
      `  advisory projectPath hint: ${result.default_project_path}`
        + ' (cwd 位于 confirmed child 内时使用 enclosing child)',
    );
  }
  lines.push(`  note: ${result.server_root_default_note || 'pass projectPath for CodeGraph queries'}`);
  lines.push('  note: do not cat graphify-out/graph.json or merged-graph.json; use Graphify CLI query/path/explain');
  return `${lines.join('\n')}\n`;
}

function runSingleTarget(context, repoRoot) {
  const { actionPlan } = context;
  if (actionPlan.mode === 'project-config') return runProjectConfig(context, repoRoot);
  if (actionPlan.mode === 'plan') return runPlan(context, repoRoot);
  if (actionPlan.mode === 'bare' || actionPlan.mode === 'check') return runDiagnostic(context, repoRoot);
  return runVerificationOrMutation(context, repoRoot);
}

function runProjectConfig(context, repoRoot) {
  requireCapability(context, 'write-project-config');
  const explicitActions = context.parsed.refreshExample
    || context.parsed.createLocal
    || context.parsed.ensureGitignore
    || context.parsed.deleteLegacyMarkdown;
  const plan = planProjectConfig({
    repoRoot,
    targetKind: context.target.target_kind,
    refreshExample: context.parsed.refreshExample || !explicitActions,
    createLocal: context.parsed.createLocal,
    ensureGitignore: context.parsed.ensureGitignore || !explicitActions,
    deleteLegacyMarkdown: context.parsed.deleteLegacyMarkdown,
  });
  const result = applyProjectConfig({
    plan,
    templatePath: path.join(context.skillRoot, 'references', 'config-template.yaml'),
  });
  return {
    exit_code: result.overall_status === 'ready' ? 0 : 1,
    mode: 'project-config',
    reason_code: result.reason || 'project-config-ready',
    payload: result,
    human: `${renderProjectConfig(result)}\n`,
    target: context.target,
  };
}

function runPlan(context, repoRoot) {
  const providerPlans = [];
  for (const id of context.actionPlan.selected_ids) {
    const module = providers[id];
    if (!module) continue;
    providerPlans.push(module.plan(providerContext(context, repoRoot, id, {
      selected: true,
      refresh: context.actionPlan.args.refresh === true,
    })));
  }
  const providerBlock = providerPlans.find((entry) => entry.blocked);
  const previewActions = buildInstallPreviewActions(context, repoRoot, providerPlans);
  const hostConfigBlock = previewActions.find((entry) =>
    entry.blocked_reason && entry.blocked_reason !== 'host-undetermined-advisory'
  );
  const blockedEntry = providerBlock || hostConfigBlock;
  const payload = renderInstallPlan({
    ...context.actionPlan,
    blocked: Boolean(blockedEntry),
    reason_code: blockedEntry ? blockedEntry.reason_code || blockedEntry.blocked_reason : 'setup-install-plan-ready',
    target: context.target,
    host: context.host,
    provider_selection: buildProviderPlanSelections({ context, repoRoot, providerPlans }),
    actions: previewActions,
    safety: previewSafety(context),
    next_action: providerBlock
      ? '修复被阻止的 Provider 目标或路径，然后重新运行 plan。'
      : hostConfigBlock
        ? hostConfigBlock.next_action || '修复 Host 配置冲突，然后重新运行 plan。'
      : '审查计划中的 mutation，然后使用相同选择且不带 --plan 重新运行。',
  });
  return {
    exit_code: blockedEntry ? 2 : 0,
    mode: 'plan',
    reason_code: payload.reason_code || 'install-plan-ready',
    payload,
    human: renderJson(payload),
    target: context.target,
  };
}

function buildInstallPreviewActions(context, repoRoot, providerPlans) {
  const actions = [];
  for (const entry of context.effectiveRegistry.tools || []) {
    if (entry.setup_required === true && !context.actionPlan.selected_ids.includes(entry.id)) continue;
    if (entry.required === false && !context.actionPlan.selected_ids.includes(entry.id)) continue;
    const installation = resolveInstallation(entry, context.platform);
    if (installation && installation.command) {
      const args = interpolateArgs(installation.args || [], dependencyFor(context, entry.dependency_ref));
      actions.push({
        kind: installation.kind === 'warmup' ? 'warmup-tool' : 'install-tool',
        tool: entry.id,
        command: installation.command,
        args,
        planned: !context.host
          || !warmupCacheHit(context, repoRoot, entry, installation.command, args),
      });
    }
    if (entry.host_config_required !== false) {
      let target = null;
      let inspection = null;
      if (context.host) {
        target = resolveHostConfigTarget({
          entry,
          host: context.host,
          authority: context.authority,
          repoRoot,
          homeDir: context.homeDir,
          env: context.env,
          userScope: context.actionPlan.args.userScope,
          requireWritable: true,
        });
        if (target.ok) inspection = inspectHostConfig({ entry, target });
      }
      const repairableConflict = inspection && inspection.reason_code === 'host-config-conflict';
      const repairAuthorized = repairableConflict && context.actionPlan.args.repairHostConfig === true;
      const blockedReason = target && !target.ok
        ? target.reason_code
        : (inspection && (!inspection.ok || inspection.conflict) && !repairAuthorized
          ? inspection.reason_code
          : null);
      actions.push({
        kind: repairAuthorized ? 'repair-host-config' : 'write-host-config',
        tool: entry.id,
        host: context.host,
        scope: target && target.ok ? target.scope : null,
        target_path: target && target.ok ? target.config_path : null,
        config_key: target && target.ok ? target.key : null,
        conflict_fields: inspection && inspection.conflict_fields ? inspection.conflict_fields : [],
        blocking_scope: inspection && inspection.blocking_scope ? inspection.blocking_scope : null,
        blocking_path: inspection && inspection.blocking_path ? inspection.blocking_path : null,
        planned: blockedReason === null && !(inspection && inspection.ok && inspection.configured),
        reason_code: repairAuthorized
          ? 'host-config-repair-authorized'
          : (inspection && inspection.ok && inspection.configured ? inspection.reason_code : null),
        blocked_reason: blockedReason || (context.host ? null : 'host-undetermined-advisory'),
        next_action: blockedReason === 'host-config-conflict'
          ? hostConfigRepairCommand(context)
          : null,
      });
    }
  }
  for (const entry of context.effectiveRegistry.helpers || []) {
    if (entry.baseline_blocking !== true) continue;
    const readiness = probeHelper(context, repoRoot, entry);
    const operations = entry.installation && Array.isArray(entry.installation.operations)
      ? entry.installation.operations
      : [];
    if (readiness.status === 'ready') {
      actions.push({ kind: 'verify-helper', helper: entry.id, planned: false, reason_code: 'already-ready' });
    } else if (operations.length > 0) {
      for (const operation of operations) {
        actions.push({
          kind: 'install-helper',
          helper: entry.id,
          command: operation.command,
          args: operation.args,
          planned: true,
        });
      }
    } else {
      actions.push({
        kind: 'manual-helper-action',
        helper: entry.id,
        planned: false,
        reason_code: 'helper-install-manual-action-required',
        next_action: entry.installation && entry.installation.next_action,
      });
    }
  }
  for (const plan of providerPlans) {
    for (const operation of plan.actions || []) {
      actions.push({ ...operation, provider: plan.provider, planned: !plan.blocked });
    }
  }
  actions.push({ kind: 'write-setup-facts', planned: true });
  return actions;
}

function hostConfigRepairCommand(context) {
  const args = ['spec-runtime-setup'];
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

function previewSafety(context) {
  const selected = new Set(context.actionPlan.selected_ids);
  const entries = [
    ...(context.effectiveRegistry.tools || []).filter((entry) => entry.required !== false || selected.has(entry.id)),
    ...(context.effectiveRegistry.helpers || []).filter((entry) => entry.baseline_blocking === true),
    ...(context.effectiveRegistry.providers || []).filter((entry) => selected.has(entry.id)),
  ];
  return entries.map((entry) => ({ id: entry.id, ...(entry.safety || {}) }));
}

function runDiagnostic(context, repoRoot) {
  const requiredProviderIds = (context.effectiveRegistry.providers || [])
    .filter((entry) => entry.setup_required === true)
    .map((entry) => entry.id);
  const probes = probeRegistry(context, repoRoot, { selectedIds: requiredProviderIds });
  const providerResults = verifyProviders(context, repoRoot, []);
  let hostConfigResults = new Map();
  if (context.authority.status === 'ready') {
    hostConfigResults = configureOrInspectHost(context, repoRoot, {
      applyMutation: false,
      selectedIds: requiredProviderIds,
      providerResults,
      installResults: new Map(),
    });
    reconcileProviderHostConfig(providerResults, hostConfigResults);
  }
  const snapshot = readSetupSnapshot({ repoRoot });
  const projectStatus = inspectProjectConfig({
    repoRoot,
    templatePath: path.join(context.skillRoot, 'references', 'config-template.yaml'),
  });
  const payload = renderDiagnostic({
    preflight: buildPreflightProjection({
      registry: context.effectiveRegistry,
      toolResults: probes.toolResults,
      helperResults: probes.helperResults,
      hostConfigResults,
      projectConfigStatus: projectStatus,
      insideGitRepo: context.target && context.target.repo_status === 'git-repo',
      platform: context.platform,
    }),
    snapshot: {
      ...snapshot,
      provider_readiness: providerResults,
    },
    target: context.target,
    host: context.host ? { host: context.host, authority: context.authority.status } : context.authority,
  });
  payload.next_actions = diagnosticNextActions(payload, {
    liveBaselineFailures: collectDiagnosticBaselineFailures(context, probes, hostConfigResults),
    requiredProviderIds,
  });
  return {
    exit_code: 0,
    mode: context.actionPlan.mode,
    reason_code: 'diagnostic-ready',
    payload,
    human: renderDiagnosticHuman(payload, context.parsed.pluginVersion),
    target: context.target,
  };
}

function collectDiagnosticBaselineFailures(context, probes, hostConfigResults) {
  const toolResults = new Map((probes.toolResults || []).map((entry) => [entry.id, entry]));
  const helperResults = new Map((probes.helperResults || []).map((entry) => [entry.id, entry]));
  const failures = [];
  for (const entry of context.effectiveRegistry.tools || []) {
    if (!isBaselineBlocking(entry)) continue;
    const observed = toolResults.get(entry.id);
    if (!observed || observed.status !== 'ready') {
      failures.push(observed || { next_action: `运行标准 spec-runtime-setup，修复 ${entry.id}。` });
      continue;
    }
    const hostResult = hostConfigResults.get(entry.id);
    if (hostResult && hostResult.configured_status !== 'ready') {
      failures.push({
        ...hostResult,
        id: entry.id,
        next_action: hostResult.next_action || `运行标准 spec-runtime-setup，修复 ${entry.id} host config。`,
      });
    }
  }
  for (const entry of context.effectiveRegistry.helpers || []) {
    if (!isBaselineBlocking(entry)) continue;
    const observed = helperResults.get(entry.id);
    if (!observed || observed.status !== 'ready') {
      failures.push(observed || { next_action: `运行标准 spec-runtime-setup，修复 ${entry.id}。` });
    }
  }
  return failures;
}

function renderProjectConfig(result) {
  return [
    '项目配置 bootstrap 已完成。',
    `  示例配置：${result.project.example_config_status}`,
    `  本地配置：${result.project.local_config_status}`,
    `  本地配置 gitignore：${result.project.local_config_gitignore_status}`,
    `  旧版 Markdown：${result.legacy.legacy_markdown_status}`,
    `  旧版配置：${result.legacy.legacy_local_config_status}`,
  ].join('\n');
}

function helpResult() {
  const human = [
    '用法：node <loaded-skill-root>/scripts/setup.cjs [options]',
    '',
    '模式：--check | --verify-only | --refresh-facts | --plan | --project-config | --only <ids> | --repair-host-config',
    'Graphify 刷新：--only graphify --refresh',
    '目标：--repo <path> | --folder <path> | --all-repos',
    '  --repo 仅接受精确 Git root；--folder 接受精确逻辑目录且不要求 Git。',
    '  folder 内的 Provider artifact/facts 不会提升到父 Git root；仅 generated runtime 可复用父 root。',
    'Workspace 双层图构建：--only codegraph,graphify --workspace-graph [--repos <a,b>]',
    'Workspace 双层图状态：--workspace-graph-status [--repos <a,b>]',
    'Workspace 双层图清理：--workspace-graph-clean [--repos <a,b>]',
    '约束：workspace-graph action 互斥，且不可与 --all-repos 组合；contained child Git 事件异步刷新，hook 不可用、失败或需即时刷新时显式重跑。',
    '',
  ].join('\n');
  return { exit_code: 0, mode: 'help', reason_code: 'help', payload: { help: human }, human, target: null };
}

function failedResult(reasonCode, error, exitCode = 1, extra = {}) {
  return {
    exit_code: exitCode,
    mode: extra.mode || 'failed',
    reason_code: reasonCode,
    payload: {
      schema_version: 'spec-runtime-setup-error.v1',
      reason_code: reasonCode,
      diagnostic: String(error && error.message ? error.message : error).slice(0, 2000),
    },
    human: `Runtime 设置失败：${reasonCode}\n`,
    target: extra.target || null,
  };
}

function main(argv = process.argv.slice(2)) {
  const parsed = parseEntrypointOptions(argv);
  const result = runSetup({
    argv,
    enforceSurfaceBinding: true,
  });
  const scenarioFingerprintSetup = result.payload
    && result.payload.runtime_capabilities
    && result.payload.runtime_capabilities.scenario_fingerprint_setup;
  if (scenarioFingerprintSetup && scenarioFingerprintSetup.status === 'failed') {
    process.stderr.write('警告：setup 场景指纹生成失败；已保留主执行结果并继续。\n');
  }
  if (parsed.options.json || result.mode === 'plan' || ['blocked', 'failed'].includes(result.mode)) {
    process.stdout.write(renderJson(result.payload));
  } else {
    process.stdout.write(result.human || renderJson(result.payload));
  }
  return result.exit_code;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  main,
  runSetup,
};
