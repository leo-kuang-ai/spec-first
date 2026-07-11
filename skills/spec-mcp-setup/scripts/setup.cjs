#!/usr/bin/env node
'use strict';

const os = require('node:os');
const path = require('node:path');
const {
  buildActionPlan,
} = require('./lib/mode-policy.cjs');
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
  dependencyFor,
  interpolateArgs,
  probeHelper,
  probeRegistry,
  resolveInstallation,
  warmupCacheHit,
} = require('./lib/installation-executor.cjs');
const {
  providerContext,
  requireCapability,
  resolveBundledVersion,
  runVerificationOrMutation,
  verifyProviders,
} = require('./lib/runtime-executor.cjs');
const providers = require('./providers/registry.cjs');

const OUTPUT_FLAGS = new Set([
  '--json',
  '--help',
  '-h',
  '--refresh-example',
  '--create-local',
  '--ensure-gitignore',
  '--delete-legacy-markdown',
]);

function parseEntrypointOptions(argv = []) {
  const modeArgv = [];
  const options = {
    json: false,
    help: false,
    pluginVersion: '',
    refreshExample: false,
    createLocal: false,
    ensureGitignore: false,
    deleteLegacyMarkdown: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = String(argv[index]);
    if (token === '--json') options.json = true;
    else if (token === '--help' || token === '-h') options.help = true;
    else if (token === '--refresh-example') options.refreshExample = true;
    else if (token === '--create-local') options.createLocal = true;
    else if (token === '--ensure-gitignore') options.ensureGitignore = true;
    else if (token === '--delete-legacy-markdown') options.deleteLegacyMarkdown = true;
    else if (token === '--version') {
      const value = argv[index + 1];
      if (value !== undefined && !String(value).startsWith('--')) {
        options.pluginVersion = String(value);
        index += 1;
      }
    } else if (!OUTPUT_FLAGS.has(token)) {
      modeArgv.push(token);
    }
  }
  return { options, modeArgv };
}

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
  if (!target.state_write_allowed && !['bare', 'check', 'plan'].includes(actionPlan.mode)) {
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

  const mutationNeedsHost = ['verify', 'only', 'graphify-refresh', 'host-config-repair'].includes(actionPlan.mode);
  const runner = input.runner || runCommandSync;
  const candidates = advisoryHostCandidates({ env, runner });
  const authority = resolveHostAuthority({
    env,
    mutationRequested: mutationNeedsHost,
    candidates,
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
      || (mutationNeedsHost ? parsed.options.pluginVersion || resolveBundledVersion({ skillRoot, env, runner }) : ''),
    setupScriptDir: __dirname,
  };

  try {
    if (target.mode === 'workspace-all-repos' && !['bare', 'check', 'plan'].includes(actionPlan.mode)) {
      return runWorkspaceBatch(context, { runSingleTarget });
    }
    return runSingleTarget(context, target.target_root || cwd);
  } catch (error) {
    return failedResult(error.reason_code || 'setup-execution-failed', error, 1, {
      mode: actionPlan.mode,
      target,
    });
  }
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
      refresh: false,
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
          requireWritable: false,
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
        planned: blockedReason === null,
        reason_code: repairAuthorized ? 'host-config-repair-authorized' : null,
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
  const probes = probeRegistry(context, repoRoot, { selectedIds: [] });
  const providerResults = verifyProviders(context, repoRoot, []);
  const snapshot = readSetupSnapshot({ repoRoot });
  const projectStatus = inspectProjectConfig({
    repoRoot,
    templatePath: path.join(context.skillRoot, 'references', 'config-template.yaml'),
  });
  const payload = renderDiagnostic({
    preflight: buildPreflightProjection({
      registry: context.effectiveRegistry,
      helperResults: probes.helperResults,
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
  payload.next_actions = diagnosticNextActions(payload);
  return {
    exit_code: 0,
    mode: context.actionPlan.mode,
    reason_code: 'diagnostic-ready',
    payload,
    human: renderDiagnosticHuman(payload, context.parsed.pluginVersion),
    target: context.target,
  };
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
      schema_version: 'spec-mcp-setup-error.v1',
      reason_code: reasonCode,
      diagnostic: String(error && error.message ? error.message : error).slice(0, 2000),
    },
    human: `Runtime 设置失败：${reasonCode}\n`,
    target: extra.target || null,
  };
}

function main(argv = process.argv.slice(2)) {
  const parsed = parseEntrypointOptions(argv);
  const result = runSetup({ argv });
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
