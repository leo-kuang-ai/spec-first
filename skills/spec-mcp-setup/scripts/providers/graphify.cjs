'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  assertContainedPath,
  ensureContainedDirectory,
  isPathWithin,
  reasonError,
} = require('../lib/path-safety.cjs');
const {
  artifactExists,
  isSpecFirstSourceRepo,
  providerLimitation,
  providerResult,
  run,
  succeeded,
  text,
  versionOutputMatches,
} = require('./common.cjs');

const ARTIFACTS = ['.graphify/graph.json', '.graphify/GRAPH_REPORT.md'];
const LEGACY_ARTIFACTS = ['graphify-out/graph.json', 'graphify-out/GRAPH_REPORT.md'];
const GRAPHIFY_HOOK_NAMES = ['post-commit', 'post-checkout'];
const HOOK_PATH_BLOCK_START = '# spec-first graphify path repair start';
const HOOK_PATH_BLOCK_END = '# spec-first graphify path repair end';
const HOOK_ARTIFACT_BLOCK_START = '# spec-first graphify artifact env start';
const HOOK_ARTIFACT_BLOCK_END = '# spec-first graphify artifact env end';
const HOOK_CREDENTIAL_BLOCK_START = '# spec-first graphify credential isolation start';
const HOOK_CREDENTIAL_BLOCK_END = '# spec-first graphify credential isolation end';
const GRAPHIFY_HOOK_MARKER = 'Installed by: graphify hook install';
const PYTHON_HOOK_MARKERS = {
  'post-commit': ['# graphify-hook-start', '# graphify-hook-end'],
  'post-checkout': ['# graphify-checkout-hook-start', '# graphify-checkout-hook-end'],
};
const METADATA = {
  id: 'graphify',
  kind: 'project-graph',
  profile: 'minimal',
  capability_class: 'project-graph',
  capabilities: ['project-graph'],
  native_interfaces: ['cli'],
  first_generation: {
    owner: 'runtime-setup',
    status: 'not-run',
    scope: 'project',
    requires_explicit_gate: false,
    requirement_workspace_path: null,
    artifact_root: '.graphify',
  },
  steady_state: {
    refresh_owner: 'provider-native',
    refresh_mode: 'skill-cli-hook-on-demand',
    hook_default: true,
    usage_owner: 'downstream-skill',
  },
  fallback: {
    available: true,
    methods: ['docs', 'rg', 'direct-source-read'],
    reason_code: 'project-graph-provider-unavailable',
  },
  usage_note: '使用 Graphify query/path/explain 获取 project-graph candidate，再通过 source、test、log、contract 或 owner evidence 确认结论。',
};

function plan(context = {}) {
  const repoRoot = path.resolve(context.repoRoot || process.cwd());
  if (!context.selected) {
    return {
      schema_version: 'provider-action-plan.v1',
      provider: 'graphify',
      mutation: false,
      blocked: false,
      reason_code: 'provider-not-selected',
      actions: [],
      non_actions: ['Bare/check/plan/verify 路径不会安装、生成、刷新或 hook Graphify。'],
    };
  }
  const resolved = resolveProviderPaths(context, repoRoot);
  if (!resolved.ok) return blockedPlan(repoRoot, resolved.reason_code);
  const workspace = resolved.workspace;
  try {
    assertGraphifyMutationSurfaces(repoRoot, context.host, resolved.artifact_root, context.dependency && context.dependency.ecosystem);
  } catch (error) {
    return blockedPlan(repoRoot, error.reason_code || 'provider-mutation-surface-unsafe');
  }

  const nonActions = [
    '不得安装 Graphify MCP 或启动 Graphify watch mode。',
    '不得编辑 shell profile；需要时报告手动配置 PATH 可见性。',
  ];
  if (isSpecFirstSourceRepo(repoRoot)) {
    nonActions.push('不得在 spec-first source repo 中 normalize 或重写 source-owned AGENTS.md/CLAUDE.md。');
  }
  nonActions.push('不得自动运行 npm uninstall -g、删除 graphify-out/ 或改写原始 PATH command。');
  const actions = [];
  const resolvedDependency = context.probeDependency === true
    ? resolveGraphifyCommand(context, repoRoot, context.dependency && context.dependency.version)
    : { ok: false, reason_code: 'provider-dependency-not-probed' };
  if (!resolvedDependency.ok && context.dependency && context.dependency.package && context.dependency.version) {
    if (context.dependency.ecosystem === 'pypi') {
      const installAction = buildPythonInstallAction(context, repoRoot, context.dependency);
      if (!installAction.ok) return blockedPlan(repoRoot, installAction.reason_code);
      actions.push(installAction.action);
    } else {
      actions.push({
        kind: 'install-dependency',
        command: 'npm',
        args: ['install', '-g', `${context.dependency.package}@${context.dependency.version}`, '--no-audit', '--no-fund', '--loglevel=error'],
      });
    }
  }
  if (!isSpecFirstSourceRepo(repoRoot) && context.host !== 'qoder') {
    actions.push({ kind: 'install-project-skill', command: 'graphify', args: ['install', '--project', '--platform', context.host || 'codex'] });
  } else if (!isSpecFirstSourceRepo(repoRoot) && context.host === 'qoder') {
    actions.push({ kind: 'install-qoder-adapter', command: null, args: [] });
  }
  const hasCurrent = currentArtifactRefs(repoRoot, resolved.artifact_root).length > 0;
  const pythonProvider = context.dependency && context.dependency.ecosystem === 'pypi';
  if (context.refresh && hasCurrent) {
    actions.push({
      kind: 'refresh',
      command: 'graphify',
      args: pythonProvider
        ? (workspace === repoRoot ? ['extract', '.', '--code-only'] : ['extract', workspace, '--out', repoRoot, '--code-only'])
        : (workspace === repoRoot ? ['update', '.'] : ['extract', workspace, '--out', repoRoot]),
      clean_rebuild: pythonProvider,
    });
  } else if (!hasCurrent) {
    actions.push({
      kind: 'first-generation',
      command: 'graphify',
      args: pythonProvider
        ? (workspace === repoRoot ? ['extract', '.', '--code-only'] : ['extract', workspace, '--out', repoRoot, '--code-only'])
        : (workspace === repoRoot ? ['extract', '.'] : ['extract', workspace, '--out', repoRoot]),
      allow_code_only_fallback: !pythonProvider && workspace === repoRoot,
    });
  }
  actions.push({
    kind: 'verify-query',
    command: 'graphify',
    args: pythonProvider ? ['query', 'main', '--graph', '.graphify/graph.json'] : ['query', 'main'],
  });
  if (fs.existsSync(path.join(repoRoot, '.git'))) {
    actions.push({ kind: 'verify-hook', command: 'graphify', args: ['hook', 'status'] });
  }
  return {
    schema_version: 'provider-action-plan.v1',
    provider: 'graphify',
    repo_root: repoRoot,
    requirement_workspace: workspace,
    requirement_workspace_path: resolved.workspace_relative,
    artifact_root: resolved.artifact_root,
    artifact_root_relative: resolved.artifact_root_relative,
    dependency_package: context.dependency && context.dependency.package ? context.dependency.package : null,
    dependency_version: context.dependency && context.dependency.version ? context.dependency.version : null,
    dependency_ecosystem: context.dependency && context.dependency.ecosystem ? context.dependency.ecosystem : null,
    dependency_ready: resolvedDependency.ok,
    resolved_graphify_command: resolvedDependency.ok ? resolvedDependency.command : null,
    resolved_graphify_interpreter: resolvedDependency.ok ? (resolvedDependency.interpreter || null) : null,
    resolved_graphify_installer: resolvedDependency.ok ? (resolvedDependency.installer || null) : null,
    resolved_graphify_collision_state: resolvedDependency.ok ? (resolvedDependency.collision_state || 'none') : null,
    resolved_graphify_inventory_count: resolvedDependency.ok && resolvedDependency.installed_inventory
      ? (resolvedDependency.installed_inventory.count || null)
      : null,
    resolved_graphify_on_original_path: resolvedDependency.ok ? resolvedDependency.on_original_path : null,
    original_path_graphify_command: resolvedDependency.original_path_command || null,
    incumbent_state: resolvedDependency.collision_state || 'none',
    incumbent_cleanup_action: resolvedDependency.collision_state === 'npm-incumbent'
      ? '确认其他项目不再依赖后，显式运行 npm uninstall -g @sentropic/graphify；否则保留并继续使用 verified absolute Python launcher。'
      : null,
    mutation: true,
    blocked: false,
    reason_code: null,
    refresh: context.refresh === true,
    existing_artifact: hasCurrent,
    legacy_artifact: artifactExists(repoRoot, LEGACY_ARTIFACTS),
    actions,
    non_actions: nonActions,
  };
}

function blockedPlan(repoRoot, reasonCode) {
  return {
    schema_version: 'provider-action-plan.v1',
    provider: 'graphify',
    repo_root: repoRoot,
    mutation: false,
    blocked: true,
    reason_code: reasonCode,
    actions: [],
    non_actions: ['Workspace containment 未确认时，不得运行任何 Provider 命令。'],
  };
}

function verify(context = {}) {
  const repoRoot = path.resolve(context.repoRoot || process.cwd());
  const resolved = resolveProviderPaths({ ...context, requirementWorkspace: '' }, repoRoot);
  if (!resolved.ok) return unsafeReadiness(context, repoRoot, resolved.reason_code);
  try {
    assertGraphifyMutationSurfaces(repoRoot, context.host, resolved.artifact_root, context.dependency && context.dependency.ecosystem);
  } catch (error) {
    return unsafeReadiness(context, repoRoot, error.reason_code || 'provider-mutation-surface-unsafe');
  }
  const resolvedCommand = resolveGraphifyCommand(
    context,
    repoRoot,
    context.dependency && context.dependency.version,
  );
  const runtimeContext = resolvedCommand.ok
    ? {
      ...context,
      graphifyCommand: resolvedCommand.command,
      graphifyInterpreter: resolvedCommand.interpreter || null,
      graphifyInstaller: resolvedCommand.installer || null,
      graphifyCollisionState: resolvedCommand.collision_state || 'none',
      graphifyInventoryCount: resolvedCommand.installed_inventory ? (resolvedCommand.installed_inventory.count || null) : null,
    }
    : context;
  const installed = resolvedCommand.ok;
  const artifactRefs = currentArtifactRefs(repoRoot, resolved.artifact_root);
  const hasCurrent = artifactRefs.length > 0;
  const pythonProvider = Boolean(context.dependency && context.dependency.ecosystem === 'pypi');
  const graphIntegrity = pythonProvider && hasCurrent
    ? inspectGraphIntegrity(resolved.artifact_root, hasSupportedCodeFile(repoRoot))
    : { ok: hasCurrent };
  const artifactUsable = hasCurrent && graphIntegrity.ok;
  const hasLegacy = artifactExists(repoRoot, LEGACY_ARTIFACTS);
  const query = installed && artifactUsable
    ? runGraphify(runtimeContext, ['query', 'main'], { cwd: repoRoot, timeoutMs: 30000 })
    : null;
  const queryVerified = Boolean(query && succeeded(query));
  const gitState = graphifyGitState(repoRoot);
  const hook = installed && gitState.is_git_repo
    ? runGraphify(runtimeContext, ['hook', 'status'], { cwd: repoRoot, timeoutMs: 30000 })
    : null;
  const hookVerified = Boolean(hook && succeeded(hook))
    && (!pythonProvider
      || verifyPythonGraphifyHooks(repoRoot, runtimeContext).ok);
  const configured = isSpecFirstSourceRepo(repoRoot) || (pythonProvider
    ? pythonHostIntegrationConfigured(repoRoot, context.host, runtimeContext).ok
    : projectSkillConfigured(repoRoot, context.host));
  const nextActions = [];
  if (!installed) nextActions.push('运行 spec-mcp-setup --only graphify，安装 pinned Provider。');
  if (hasLegacy && !hasCurrent) nextActions.push('运行 spec-mcp-setup --only graphify --refresh，重新生成 provider-native .graphify/。');
  if (hasCurrent) nextActions.push('运行 spec-mcp-setup --only graphify --refresh，执行显式 incremental refresh。');
  if (installed && hasCurrent && !queryVerified) nextActions.push('依赖 graph candidate 前，先运行真实的 Graphify query probe。');
  if (gitState.is_git_repo && !hookVerified) nextActions.push('检查 Graphify hook 状态，并重新运行显式 setup。');
  if (!configured) nextActions.push('重新运行显式 setup，修复 Graphify host integration。');
  if (hasCurrent && !graphIntegrity.ok) nextActions.push(`修复 ${graphIntegrity.reason_code} 后重新生成 .graphify/。`);
  const degraded = installed && (!configured || (hasCurrent && !graphIntegrity.ok)
    || (artifactUsable && !queryVerified) || (gitState.is_git_repo && !hookVerified));
  return providerResult(METADATA, {
    installed,
    configured,
    initialized: artifactUsable,
    indexed: artifactUsable,
    artifactExists: hasCurrent,
    queryVerified,
    serverReachable: false,
    readinessStatus: !installed ? 'not-run' : (degraded ? 'degraded' : (hasCurrent && queryVerified ? 'fresh' : 'unknown')),
    repoAligned: 'unknown',
    firstGenerationStatus: artifactUsable ? 'completed' : 'not-run',
    artifactRefs,
    nextActions,
    hookInstalled: hookVerified,
    hookVerified,
    hookStatus: gitState.is_git_repo ? (hookVerified ? 'verified' : 'failed') : 'skipped',
    hookSkippedReason: gitState.is_git_repo ? null : 'not-a-git-repo',
  });
}

function apply(context = {}, actionPlan = plan(context)) {
  if (!actionPlan || actionPlan.blocked || !actionPlan.mutation) return verify(context);
  const repoRoot = path.resolve(context.repoRoot || actionPlan.repo_root || process.cwd());
  const recovery = recoverGraphifyMigration(repoRoot);
  if (!recovery.ok) return unsafeReadiness(context, repoRoot, recovery.reason_code);
  if (recovery.recovered) {
    actionPlan = plan({ ...context, selected: true, refresh: actionPlan.refresh === true });
    if (!actionPlan || actionPlan.blocked || !actionPlan.mutation) {
      return actionPlan && actionPlan.blocked
        ? unsafeReadiness(context, repoRoot, actionPlan.reason_code)
        : verify(context);
    }
  }
  try {
    assertGraphifyMutationSurfaces(repoRoot, context.host, actionPlan.artifact_root || path.join(repoRoot, '.graphify'), context.dependency && context.dependency.ecosystem);
  } catch (error) {
    return unsafeReadiness(context, repoRoot, error.reason_code || 'provider-mutation-surface-unsafe');
  }
  let fallbackUsed = false;
  let mutationFailure = null;
  const pythonProvider = Boolean(context.dependency && context.dependency.ecosystem === 'pypi');
  let pathRepair = { status: 'not-evaluated', reason_code: null };
  let runtimeContext = actionPlan.resolved_graphify_command
    ? {
      ...context,
      graphifyCommand: actionPlan.resolved_graphify_command,
      graphifyInterpreter: actionPlan.resolved_graphify_interpreter || null,
      graphifyInstaller: actionPlan.resolved_graphify_installer || null,
      graphifyCollisionState: actionPlan.resolved_graphify_collision_state || 'none',
      graphifyInventoryCount: actionPlan.resolved_graphify_inventory_count || null,
      graphifyOnOriginalPath: actionPlan.resolved_graphify_on_original_path,
      graphifyOriginalPathCommand: actionPlan.original_path_graphify_command,
    }
    : context;
  const resolutionContext = actionPlan.dependency_ecosystem
    ? { ...context, dependency: { ...(context.dependency || {}), ecosystem: actionPlan.dependency_ecosystem } }
    : context;

  function adoptResolvedCommand(resolved) {
    pathRepair = pythonProvider
      ? { status: 'report-only', reason_code: resolved.collision_state === 'none' ? null : 'graphify-cli-shadowed-by-npm-incumbent' }
      : repairGraphifyPathSymlinkIfSafe(context, resolved, actionPlan.dependency_version);
    runtimeContext = {
      ...context,
      graphifyCommand: resolved.command,
      graphifyInterpreter: resolved.interpreter || null,
      graphifyInstaller: resolved.installer || null,
      graphifyCollisionState: resolved.collision_state || 'none',
      graphifyInventoryCount: resolved.installed_inventory ? (resolved.installed_inventory.count || null) : null,
      graphifyOnOriginalPath: resolved.on_original_path || pathRepair.status === 'repaired',
      graphifyOriginalPathCommand: resolved.original_path_command || null,
    };
  }

  if (actionPlan.resolved_graphify_command) {
    adoptResolvedCommand({
      ok: true,
      command: actionPlan.resolved_graphify_command,
      interpreter: actionPlan.resolved_graphify_interpreter || null,
      installer: actionPlan.resolved_graphify_installer || null,
      collision_state: actionPlan.resolved_graphify_collision_state || 'none',
      installed_inventory: actionPlan.resolved_graphify_inventory_count
        ? { status: 'recorded', count: actionPlan.resolved_graphify_inventory_count }
        : null,
      on_original_path: actionPlan.resolved_graphify_on_original_path === true,
      original_path_command: actionPlan.original_path_graphify_command || null,
    });
  }

  for (const action of actionPlan.actions || []) {
    try {
      assertGraphifyMutationSurfaces(repoRoot, context.host, actionPlan.artifact_root || path.join(repoRoot, '.graphify'), context.dependency && context.dependency.ecosystem);
    } catch (error) {
      mutationFailure = error.reason_code || 'provider-mutation-surface-unsafe';
      break;
    }
    if (['verify-query', 'verify-hook'].includes(action.kind)) continue;
    if (!['install-dependency', 'install-qoder-adapter'].includes(action.kind) && !runtimeContext.graphifyCommand) {
      const resolved = resolveGraphifyCommand(resolutionContext, repoRoot, actionPlan.dependency_version);
      if (!resolved.ok) {
        mutationFailure = resolved.reason_code;
        break;
      }
      adoptResolvedCommand(resolved);
    }
    if (action.kind === 'install-dependency') {
      const result = run(context, action.command, action.args, {
        cwd: repoRoot,
        timeoutMs: 120000,
        env: graphifyProcessEnv(context),
        inheritEnv: false,
      });
      if (!succeeded(result)) mutationFailure = 'graphify-install-failed';
      else {
        const resolved = resolveGraphifyCommand(resolutionContext, repoRoot, actionPlan.dependency_version);
        if (!resolved.ok) mutationFailure = resolved.reason_code;
        else adoptResolvedCommand(resolved);
      }
    } else if (action.kind === 'install-qoder-adapter') {
      installQoderGraphifyAdapter(repoRoot);
    } else if (action.kind === 'install-project-skill') {
      const result = runGraphify(runtimeContext, action.args, { cwd: repoRoot, timeoutMs: 60000 });
      if (!succeeded(result)) mutationFailure = 'graphify-project-skill-install-failed';
      else {
        try {
          if (pythonProvider) {
            normalizePythonHostIntegration(repoRoot, context.host, runtimeContext);
          } else {
            normalizeGraphifyInstructionSection(repoRoot, context.host);
          }
        } catch (error) {
          mutationFailure = error.reason_code || 'graphify-instruction-normalization-failed';
        }
      }
    } else if (action.kind === 'first-generation') {
      const extract = runGraphify(runtimeContext, action.args, {
        cwd: repoRoot,
        timeoutMs: 120000,
      });
      if (!succeeded(extract) && action.allow_code_only_fallback) {
        fallbackUsed = true;
        const update = runGraphify(runtimeContext, ['update', '.'], {
          cwd: repoRoot,
          timeoutMs: 120000,
        });
        if (!succeeded(update)) mutationFailure = 'graphify-first-generation-failed';
      } else if (!succeeded(extract)) {
        mutationFailure = 'graphify-first-generation-failed';
      }
    } else if (action.kind === 'refresh' && action.clean_rebuild) {
      const refreshed = journaledCleanRefresh(runtimeContext, repoRoot, actionPlan, action);
      if (!refreshed.ok) mutationFailure = refreshed.reason_code;
    } else if (action.kind === 'refresh') {
      const refresh = runGraphify(runtimeContext, action.args, {
        cwd: repoRoot,
        timeoutMs: 120000,
      });
      if (!succeeded(refresh)) {
        const diagnostic = text(refresh);
        const incrementalUpdate = action.args[0] === 'update';
        if (incrementalUpdate && /Refusing to overwrite/i.test(diagnostic) && /--force|force/i.test(diagnostic)) {
          const force = runGraphify(runtimeContext, [...action.args, '--force'], {
            cwd: repoRoot,
            timeoutMs: 120000,
          });
          if (!succeeded(force)) mutationFailure = 'graphify-refresh-force-failed';
        } else {
          mutationFailure = 'graphify-refresh-failed';
        }
      }
    }
    if (mutationFailure) break;
  }

  let queryVerified = false;
  try {
    assertGraphifyMutationSurfaces(repoRoot, context.host, actionPlan.artifact_root || path.join(repoRoot, '.graphify'), context.dependency && context.dependency.ecosystem);
  } catch (error) {
    mutationFailure = error.reason_code || 'provider-mutation-surface-unsafe';
  }
  const artifactRefs = currentArtifactRefs(repoRoot, actionPlan.artifact_root || path.join(repoRoot, '.graphify'));
  let graphIntegrity = null;
  if (!mutationFailure && pythonProvider && artifactRefs.length > 0) {
    const supportedCodePresent = hasSupportedCodeFile(actionPlan.requirement_workspace || repoRoot);
    graphIntegrity = inspectGraphIntegrity(actionPlan.artifact_root || path.join(repoRoot, '.graphify'), supportedCodePresent);
    if (!graphIntegrity.ok) mutationFailure = graphIntegrity.reason_code;
  }
  if (!mutationFailure && artifactRefs.length > 0) {
    const queryArgs = pythonProvider
      ? ['query', 'main', '--graph', '.graphify/graph.json']
      : ['query', 'main'];
    queryVerified = succeeded(runGraphify(runtimeContext, queryArgs, { cwd: repoRoot, timeoutMs: 30000 }));
  }
  const gitState = graphifyGitState(repoRoot);
  let hookInstalled = false;
  let hookVerified = false;
  let hookStatus = gitState.is_git_repo ? 'unknown' : 'skipped';
  let hookSkippedReason = gitState.is_git_repo ? null : 'not-a-git-repo';
  if (!mutationFailure && gitState.is_git_repo) {
    let hook = null;
    try {
      assertGraphifyMutationSurfaces(repoRoot, context.host, actionPlan.artifact_root || path.join(repoRoot, '.graphify'), context.dependency && context.dependency.ecosystem);
      if (!pythonProvider) repairGraphifyHookPathVisibility(repoRoot, runtimeContext);
      hook = runGraphify(runtimeContext, ['hook', 'status'], { cwd: repoRoot, timeoutMs: 30000 });
      const pythonHooksMissing = pythonProvider
        ? !pythonHookMarkersPresent(repoRoot)
        : false;
      if ((!succeeded(hook) || pythonHooksMissing) && gitState.hook_mutation_allowed) {
        const installHook = runGraphify(runtimeContext, ['hook', 'install'], { cwd: repoRoot, timeoutMs: 60000 });
        hookInstalled = succeeded(installHook);
        if (hookInstalled) {
          assertGraphifyMutationSurfaces(repoRoot, context.host, actionPlan.artifact_root || path.join(repoRoot, '.graphify'), context.dependency && context.dependency.ecosystem);
          if (!pythonProvider) repairGraphifyHookPathVisibility(repoRoot, runtimeContext);
        }
      } else if (!succeeded(hook)) {
        hookSkippedReason = gitState.hook_skipped_reason;
      }
      if (succeeded(hook) || hookInstalled) {
        if (pythonProvider) {
          normalizePythonGraphifyHooks(repoRoot, runtimeContext);
        }
        hook = runGraphify(runtimeContext, ['hook', 'status'], { cwd: repoRoot, timeoutMs: 30000 });
      }
    } catch (error) {
      mutationFailure = error.reason_code || 'graphify-hook-path-repair-failed';
      hookSkippedReason = mutationFailure;
    }
    hookVerified = succeeded(hook) && (!pythonProvider
      || verifyPythonGraphifyHooks(repoRoot, runtimeContext).ok);
    hookInstalled = hookInstalled || hookVerified;
    hookStatus = hookVerified ? 'verified' : (hookInstalled ? 'installed' : 'failed');
  }
  const hasArtifact = artifactRefs.length > 0;
  const configured = isSpecFirstSourceRepo(repoRoot) || (pythonProvider
    ? pythonHostIntegrationConfigured(repoRoot, context.host, runtimeContext).ok
    : projectSkillConfigured(repoRoot, context.host));
  if (!mutationFailure && !configured) mutationFailure = 'graphify-project-skill-post-probe-failed';
  const degraded = Boolean(mutationFailure) || !hasArtifact || !queryVerified || (gitState.is_git_repo && !hookVerified);
  const nextActions = [];
  if (mutationFailure) nextActions.push(`检查 ${mutationFailure} 的 Graphify diagnostic，并重新运行显式 setup。`);
  if (hasArtifact && !actionPlan.refresh) nextActions.push('运行 spec-mcp-setup --only graphify --refresh，执行显式 incremental refresh。');
  if (hasArtifact && !queryVerified) nextActions.push('依赖 graph candidate 前，先运行真实的 Graphify query probe。');
  if (gitState.is_git_repo && !hookVerified) nextActions.push('检查 Graphify hook 状态，并重新运行显式 setup。');
  const pathVisibilityAction = graphifyPathVisibilityAction(runtimeContext, pathRepair);
  if (pathVisibilityAction) nextActions.push(pathVisibilityAction);
  return providerResult(METADATA, {
    installed: !mutationFailure || hasArtifact,
    configured,
    initialized: hasArtifact,
    indexed: hasArtifact,
    artifactExists: hasArtifact,
    queryVerified,
    fallbackUsed,
    readinessStatus: degraded ? 'degraded' : 'fresh',
    repoAligned: 'unknown',
    firstGenerationStatus: hasArtifact ? 'completed' : (mutationFailure ? 'failed' : 'not-run'),
    requirementWorkspacePath: actionPlan.requirement_workspace_path || null,
    artifactRefs,
    limitations: mutationFailure
      ? [providerLimitation('failed', mutationFailure, 'Graphify setup 失败。')]
      : pythonProviderLimitations(runtimeContext, graphIntegrity),
    nextActions,
    hookInstalled,
    hookVerified,
    hookStatus,
    hookSkippedReason,
  });
}

function refresh(context = {}, actionPlan = plan({ ...context, selected: true, refresh: true })) {
  if (!actionPlan.refresh) {
    return providerResult(METADATA, {
      installed: false,
      readinessStatus: 'degraded',
      limitations: [providerLimitation(
        'blocked',
        'graphify-refresh-plan-required',
        'Graphify refresh 需要显式 refresh action plan。',
      )],
      nextActions: ['使用 spec-mcp-setup --only graphify --refresh 重新运行。'],
      hookStatus: 'unknown',
    });
  }
  return apply(context, actionPlan);
}

function uninstall(context = {}) {
  return {
    schema_version: 'provider-action-plan.v1',
    provider: 'graphify',
    repo_root: path.resolve(context.repoRoot || process.cwd()),
    mutation: false,
    blocked: false,
    reason_code: 'provider-artifacts-retained',
    actions: [],
    non_actions: [
      '没有独立的显式移除 contract 时，setup 不会删除 .graphify/、Provider 安装的 project skill、instruction 或 git hook。',
    ],
  };
}

function runGraphify(context, args, options) {
  return run(context, context.graphifyCommand || 'graphify', args, {
    ...options,
    env: graphifyProcessEnv(context, options && options.env),
    inheritEnv: false,
  });
}

function resolveGraphifyCommand(context, repoRoot, versionPin) {
  if (context.dependency && context.dependency.ecosystem === 'pypi') {
    return resolvePythonGraphifyCommand(context, repoRoot, context.dependency);
  }
  const homeDir = path.resolve(context.homeDir || os.homedir());
  const windows = context.platform === 'windows' || process.platform === 'win32';
  const names = windows
    ? ['graphify.cmd', 'graphify.exe', 'graphify']
    : ['graphify'];
  const originalPath = providerOriginalPath(context);
  const originalPathCommand = originalPath
    ? commandFromSearchPath('graphify', originalPath, windows, context.env)
    : null;
  const pathCandidate = originalPathCommand || 'graphify';
  const pathProbe = run(context, pathCandidate, ['--version'], {
    cwd: repoRoot,
    timeoutMs: 10000,
    env: originalPath ? { PATH: originalPath } : undefined,
  });
  let sawVersionMismatch = false;
  let observedOriginalPathCommand = originalPathCommand;
  if (succeeded(pathProbe)) {
    observedOriginalPathCommand = observedOriginalPathCommand || pathCandidate;
    if (versionOutputMatches(text(pathProbe), versionPin)) {
      return {
        ok: true,
        command: pathCandidate,
        version_result: pathProbe,
        on_original_path: true,
        original_path_command: observedOriginalPathCommand,
      };
    }
    sawVersionMismatch = true;
  }

  const candidates = [];
  for (const name of names) {
    const candidate = path.join(homeDir, '.local', 'bin', name);
    if (fs.existsSync(candidate)) candidates.push(candidate);
  }

  for (const candidate of candidates) {
    if (candidate === pathCandidate) continue;
    const result = run(context, candidate, ['--version'], { cwd: repoRoot, timeoutMs: 10000 });
    if (!succeeded(result)) continue;
    if (versionOutputMatches(text(result), versionPin)) {
      return {
        ok: true,
        command: candidate,
        version_result: result,
        on_original_path: false,
        original_path_command: observedOriginalPathCommand,
      };
    }
    sawVersionMismatch = true;
  }

  const prefixResult = run(context, 'npm', ['prefix', '-g'], { cwd: repoRoot, timeoutMs: 10000 });
  if (succeeded(prefixResult)) {
    const prefix = String(prefixResult.stdout || '').split(/\r?\n/).map((line) => line.trim()).find(Boolean);
    if (prefix && (path.isAbsolute(prefix) || path.win32.isAbsolute(prefix))) {
      for (const name of names) {
        const candidate = process.platform === 'win32'
          ? path.join(prefix, name)
          : path.join(prefix, 'bin', name);
        if (!fs.existsSync(candidate)) continue;
        const result = run(context, candidate, ['--version'], { cwd: repoRoot, timeoutMs: 10000 });
        if (!succeeded(result)) continue;
        if (versionOutputMatches(text(result), versionPin)) {
          return {
            ok: true,
            command: candidate,
            version_result: result,
            on_original_path: false,
            original_path_command: observedOriginalPathCommand,
          };
        }
        sawVersionMismatch = true;
      }
    }
  }
  return {
    ok: false,
    reason_code: sawVersionMismatch ? 'graphify-version-pin-mismatch' : 'graphify-cli-not-found',
  };
}

function resolvePythonGraphifyCommand(context, repoRoot, dependency) {
  const python = resolveCompatiblePython(context, repoRoot);
  if (!python.ok) return python;
  const manager = resolvePythonToolManager(context, repoRoot);
  if (!manager.ok) return manager;
  const homeDir = path.resolve(context.homeDir || os.homedir());
  const windows = context.platform === 'windows' || process.platform === 'win32';
  const originalPath = providerOriginalPath(context);
  const originalPathCommand = commandFromSearchPath('graphify', originalPath, windows, context.env || {});
  const collisionState = originalPathCommand
    ? classifyOriginalGraphifyCommand(context, repoRoot, originalPathCommand)
    : 'none';
  const candidateNames = windows ? ['graphify.exe', 'graphify.cmd', 'graphify'] : ['graphify'];
  const binDirectories = manager.kind === 'uv'
    ? resolveUvBinDirectories(context, repoRoot, homeDir)
    : resolvePipxBinDirectories(context, repoRoot, homeDir);
  const candidates = [];
  for (const directory of binDirectories) {
    for (const name of candidateNames) {
      const candidate = path.resolve(directory, name);
      if (isExecutableCommandFile(candidate, windows) && !candidates.includes(candidate)) candidates.push(candidate);
    }
  }
  let mismatch = false;
  const managedInterpreter = resolveManagedToolInterpreter(context, repoRoot, manager.kind, dependency.package);
  for (const candidate of candidates) {
    const identity = probePythonDistributionIdentity(
      context,
      repoRoot,
      candidate,
      dependency,
      managedInterpreter || python.command,
    );
    if (!identity.ok) {
      mismatch = mismatch || identity.reason_code === 'graphify-package-version-mismatch';
      continue;
    }
    const versionResult = run(context, candidate, ['--version'], {
      cwd: repoRoot,
      timeoutMs: 10000,
      env: graphifyProcessEnv(context),
      inheritEnv: false,
    });
    if (!succeeded(versionResult) || !versionOutputMatches(text(versionResult), dependency.version)) {
      mismatch = true;
      continue;
    }
    return {
      ok: true,
      command: candidate,
      interpreter: identity.interpreter,
      installer: manager.kind,
      package_identity: identity,
      installed_inventory: identity.inventory,
      version_result: versionResult,
      on_original_path: Boolean(originalPathCommand && path.resolve(originalPathCommand) === path.resolve(candidate)),
      original_path_command: originalPathCommand,
      collision_state: originalPathCommand && path.resolve(originalPathCommand) !== path.resolve(candidate)
        ? collisionState
        : 'none',
    };
  }
  return {
    ok: false,
    reason_code: mismatch ? 'graphify-package-version-mismatch' : 'graphify-package-identity-unverified',
    installer: manager.kind,
    interpreter: python.command,
    original_path_command: originalPathCommand,
  };
}

function classifyOriginalGraphifyCommand(context, repoRoot, command) {
  const result = run(context, 'npm', ['prefix', '-g'], {
    cwd: repoRoot,
    timeoutMs: 10000,
    env: graphifyProcessEnv(context),
    inheritEnv: false,
  });
  if (!succeeded(result)) return 'other-command';
  const prefix = firstAbsoluteLine(text(result));
  if (!prefix) return 'other-command';
  const npmBin = process.platform === 'win32' ? prefix : path.join(prefix, 'bin');
  return isPathWithin(command, npmBin) ? 'npm-incumbent' : 'other-command';
}

function buildPythonInstallAction(context, repoRoot, dependency) {
  const python = resolveCompatiblePython(context, repoRoot);
  if (!python.ok) return python;
  const manager = resolvePythonToolManager(context, repoRoot);
  if (!manager.ok) return manager;
  const distribution = dependency.distribution || {};
  if (!/^https:\/\/files\.pythonhosted\.org\/.+\.whl$/.test(distribution.wheel_url || '')
    || !/^[a-f0-9]{64}$/.test(distribution.sha256 || '')
    || distribution.index_url !== 'https://pypi.org/simple') {
    return { ok: false, reason_code: 'graphify-distribution-provenance-unverified' };
  }
  const requirement = `${dependency.package} @ ${distribution.wheel_url}#sha256=${distribution.sha256}`;
  const args = manager.kind === 'uv'
    ? ['tool', 'install', '--no-python-downloads', '--python', python.command, '--default-index', distribution.index_url, requirement]
    : ['install', '--python', python.command, '--index-url', distribution.index_url, requirement];
  return {
    ok: true,
    action: {
      kind: 'install-dependency',
      command: manager.kind,
      args,
      installer: manager.kind,
      interpreter: python.command,
      distribution_sha256: distribution.sha256,
      env: graphifyProcessEnv(context),
      inheritEnv: false,
    },
  };
}

function journaledCleanRefresh(context, repoRoot, actionPlan, action) {
  const artifactRoot = path.resolve(actionPlan.artifact_root || path.join(repoRoot, '.graphify'));
  const nonce = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const stagingRoot = path.join(repoRoot, `.graphify.staging-${nonce}`);
  const backupRoot = path.join(repoRoot, `.graphify.backup-${nonce}`);
  const journalPath = path.join(repoRoot, '.graphify-migration-journal.json');
  for (const candidate of [stagingRoot, backupRoot, journalPath]) {
    assertContainedPath(repoRoot, candidate, { reasonCode: 'graphify-artifact-root-escape' });
  }
  const journal = {
    schema_version: 'graphify-migration-journal.v1',
    phase: 'staging',
    current: relativeRef(repoRoot, artifactRoot),
    staged: relativeRef(repoRoot, stagingRoot),
    backup: relativeRef(repoRoot, backupRoot),
  };
  writeJsonAtomic(journalPath, journal);
  try {
    const result = run(context, context.graphifyCommand || 'graphify', action.args, {
      cwd: repoRoot,
      timeoutMs: 120000,
      env: graphifyProcessEnv(context, { GRAPHIFY_OUT: relativeRef(repoRoot, stagingRoot) }),
      inheritEnv: false,
    });
    if (!succeeded(result)) throw reasonError('graphify-refresh-extract-failed', text(result));
    const integrity = inspectGraphIntegrity(stagingRoot, hasSupportedCodeFile(actionPlan.requirement_workspace || repoRoot));
    if (!integrity.ok) throw reasonError(integrity.reason_code, 'staged Graphify artifact 未通过机械完整性检查');
    const query = run(context, context.graphifyCommand || 'graphify', ['query', 'main', '--graph', relativeRef(repoRoot, path.join(stagingRoot, 'graph.json'))], {
      cwd: repoRoot,
      timeoutMs: 30000,
      env: graphifyProcessEnv(context, { GRAPHIFY_OUT: relativeRef(repoRoot, stagingRoot) }),
      inheritEnv: false,
    });
    if (!succeeded(query)) throw reasonError('graphify-refresh-query-failed', text(query));
    journal.phase = 'promoting';
    writeJsonAtomic(journalPath, journal);
    fs.renameSync(artifactRoot, backupRoot);
    journal.phase = 'backed-up';
    writeJsonAtomic(journalPath, journal);
    fs.renameSync(stagingRoot, artifactRoot);
    journal.phase = 'completed';
    writeJsonAtomic(journalPath, journal);
    fs.rmSync(journalPath, { force: true });
    return { ok: true, backup_root: backupRoot };
  } catch (error) {
    if (!fs.existsSync(artifactRoot) && fs.existsSync(backupRoot)) fs.renameSync(backupRoot, artifactRoot);
    if (fs.existsSync(stagingRoot)) fs.rmSync(stagingRoot, { recursive: true, force: true });
    journal.phase = 'failed';
    journal.reason_code = error.reason_code || 'graphify-refresh-failed';
    writeJsonAtomic(journalPath, journal);
    return { ok: false, reason_code: journal.reason_code };
  }
}

function recoverGraphifyMigration(repoRoot) {
  const journalPath = path.join(repoRoot, '.graphify-migration-journal.json');
  if (!fs.existsSync(journalPath)) return { ok: true, recovered: false };
  try {
    if (fs.lstatSync(journalPath).isSymbolicLink()) {
      return { ok: false, reason_code: 'graphify-migration-journal-path-unsafe' };
    }
  } catch (_error) {
    return { ok: false, reason_code: 'graphify-migration-journal-invalid' };
  }
  let journal;
  try {
    journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  } catch (_error) {
    return { ok: false, reason_code: 'graphify-migration-journal-invalid' };
  }
  if (journal.schema_version !== 'graphify-migration-journal.v1'
    || !['staging', 'promoting', 'backed-up', 'completed', 'failed'].includes(journal.phase)) {
    return { ok: false, reason_code: 'graphify-migration-journal-invalid' };
  }
  if (journal.current !== '.graphify'
    || !/^\.graphify\.staging-[A-Za-z0-9._-]+$/.test(journal.staged || '')
    || !/^\.graphify\.backup-[A-Za-z0-9._-]+$/.test(journal.backup || '')
    || new Set([journal.current, journal.staged, journal.backup]).size !== 3) {
    return { ok: false, reason_code: 'graphify-migration-journal-path-unsafe' };
  }
  const current = resolveJournalPath(repoRoot, journal.current);
  const staged = resolveJournalPath(repoRoot, journal.staged);
  const backup = resolveJournalPath(repoRoot, journal.backup);
  if (!current || !staged || !backup) return { ok: false, reason_code: 'graphify-migration-journal-path-unsafe' };
  try {
    for (const controlled of [current, staged, backup]) {
      if (fs.existsSync(controlled) && fs.lstatSync(controlled).isSymbolicLink()) {
        return { ok: false, reason_code: 'graphify-migration-journal-path-unsafe' };
      }
    }
    if (!fs.existsSync(current) && journal.phase === 'backed-up'
      && fs.existsSync(staged) && inspectGraphIntegrity(staged, false).ok) {
      fs.renameSync(staged, current);
    } else if (!fs.existsSync(current) && fs.existsSync(backup)) {
      fs.renameSync(backup, current);
    }
    if (!fs.existsSync(current)) return { ok: false, reason_code: 'graphify-migration-recovery-incomplete' };
    if (fs.existsSync(staged)) fs.rmSync(staged, { recursive: true, force: true });
    fs.rmSync(journalPath, { force: true });
    return { ok: true, recovered: true };
  } catch (_error) {
    return { ok: false, reason_code: 'graphify-migration-recovery-failed' };
  }
}

function resolveJournalPath(repoRoot, relativePath) {
  if (!relativePath || path.isAbsolute(relativePath) || path.win32.isAbsolute(relativePath)) return null;
  const resolved = path.resolve(repoRoot, relativePath);
  if (!isPathWithin(resolved, repoRoot)) return null;
  try {
    assertContainedPath(repoRoot, resolved, { reasonCode: 'graphify-migration-journal-path-unsafe' });
    return resolved;
  } catch (_error) {
    return null;
  }
}

function inspectGraphIntegrity(artifactRoot, supportedCodePresent = true) {
  const graphPath = path.join(artifactRoot, 'graph.json');
  if (!fs.existsSync(graphPath)) return { ok: false, reason_code: 'graphify-artifact-missing' };
  try {
    const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
    const nodes = Array.isArray(graph.nodes) ? graph.nodes.length : null;
    if (nodes === null) return { ok: false, reason_code: 'graphify-artifact-contract-mismatch' };
    if (nodes === 0 && supportedCodePresent) return { ok: false, reason_code: 'graphify-extract-integrity-failed' };
    return { ok: true, node_count: nodes, supported_code_present: supportedCodePresent, empty_corpus: !supportedCodePresent };
  } catch (_error) {
    return { ok: false, reason_code: 'graphify-artifact-contract-mismatch' };
  }
}

function hasSupportedCodeFile(workspace) {
  const supported = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.py', '.go', '.rs', '.java', '.c', '.h', '.cc', '.cpp', '.cs',
    '.rb', '.php', '.swift', '.kt', '.kts', '.scala', '.sh', '.bash', '.lua', '.ex', '.exs', '.jl',
    '.f', '.f90', '.groovy', '.m', '.mm', '.ps1', '.v', '.sv', '.zig',
  ]);
  const visit = (current) => {
    let item;
    try {
      item = fs.lstatSync(current);
    } catch (_error) {
      return false;
    }
    if (item.isSymbolicLink()) return false;
    if (item.isDirectory()) {
      if (['.git', '.graphify', 'graphify-out', 'node_modules', 'vendor', '.spec-first', '.claude', '.codex', '.cursor', '.kiro', '.qoder', '.agents'].includes(path.basename(current))) return false;
      return fs.readdirSync(current).some((name) => visit(path.join(current, name)));
    } else if (item.isFile() && supported.has(path.extname(current).toLowerCase())) {
      return true;
    }
    return false;
  };
  return visit(workspace);
}

function pythonProviderLimitations(runtimeContext, graphIntegrity) {
  if (!runtimeContext || !runtimeContext.graphifyInstaller) return undefined;
  const limitations = [
    `verified Python Provider: installer=${runtimeContext.graphifyInstaller}, interpreter=${runtimeContext.graphifyInterpreter || 'unknown'}, launcher=${runtimeContext.graphifyCommand}.`,
    'degraded capability: code-only graph 不包含 docs/images semantic extraction；Graphify 输出仍是 advisory candidate。',
    runtimeContext.graphifyInventoryCount
      ? `recorded inventory: isolated tool environment包含${runtimeContext.graphifyInventoryCount}个distributions；仅direct graphifyy wheel经过固定hash验证。`
      : 'degraded supply-chain visibility: installed transitive inventory未能读取；不得表述为fully hash-locked。',
    'degraded supply-chain assurance: pip-audit不是required setup依赖，本次未把absence或finding伪装成全量安全证明。',
  ];
  if (runtimeContext.graphifyOnOriginalPath === false) {
    limitations.push('degraded visibility: 原始 PATH 中存在其他 graphify command；setup 使用 verified absolute Python launcher。');
  }
  if (graphIntegrity && graphIntegrity.empty_corpus) limitations.push('degraded capability: workspace 没有 Provider 支持的代码文件，生成空 code graph。');
  return limitations;
}

function writeJsonAtomic(target, value) {
  const temporary = `${target}.tmp-${process.pid}-${crypto.randomBytes(4).toString('hex')}`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
  }
}

function resolveCompatiblePython(context, repoRoot) {
  const commands = [...new Set([
    context.pythonCommand,
    'python3.14', 'python3.13', 'python3.12', 'python3.11', 'python3.10', 'python3', 'python',
  ].filter(Boolean))];
  let observedUnsupported = null;
  for (const command of commands) {
    const result = run(context, command, ['-c', 'import sys; print("%d.%d.%d" % sys.version_info[:3])'], {
      cwd: repoRoot,
      timeoutMs: 10000,
      env: graphifyProcessEnv(context),
      inheritEnv: false,
    });
    if (!succeeded(result)) continue;
    const match = text(result).match(/(^|\s)(\d+)\.(\d+)\.(\d+)(\s|$)/);
    if (!match) continue;
    const supported = Number(match[2]) > 3 || (Number(match[2]) === 3 && Number(match[3]) >= 10);
    if (!supported) {
      observedUnsupported = `${match[2]}.${match[3]}.${match[4]}`;
      continue;
    }
    return { ok: true, command, version: `${match[2]}.${match[3]}.${match[4]}` };
  }
  return observedUnsupported
    ? { ok: false, reason_code: 'graphify-python-version-unsupported', version: observedUnsupported }
    : { ok: false, reason_code: 'graphify-python-missing' };
}

function resolvePythonToolManager(context, repoRoot) {
  for (const kind of ['uv', 'pipx']) {
    const result = run(context, kind, ['--version'], {
      cwd: repoRoot,
      timeoutMs: 10000,
      env: graphifyProcessEnv(context),
      inheritEnv: false,
    });
    if (succeeded(result)) return { ok: true, kind, version_result: result };
  }
  return { ok: false, reason_code: 'graphify-tool-manager-missing' };
}

function resolveUvBinDirectories(context, repoRoot, homeDir) {
  return resolveToolBinDirectories(context, repoRoot, homeDir, 'uv', ['tool', 'dir', '--bin']);
}

function resolvePipxBinDirectories(context, repoRoot, homeDir) {
  return resolveToolBinDirectories(context, repoRoot, homeDir, 'pipx', ['environment', '--value', 'PIPX_BIN_DIR']);
}

function resolveToolBinDirectories(context, repoRoot, homeDir, command, args) {
  const result = run(context, command, args, {
    cwd: repoRoot,
    timeoutMs: 10000,
    env: graphifyProcessEnv(context),
    inheritEnv: false,
  });
  const reported = succeeded(result) ? firstAbsoluteLine(text(result)) : null;
  return [...new Set([reported, path.join(homeDir, '.local', 'bin')].filter(Boolean))];
}

function resolveManagedToolInterpreter(context, repoRoot, manager, packageName) {
  const windows = context.platform === 'windows' || process.platform === 'win32';
  const query = manager === 'uv'
    ? ['uv', ['tool', 'dir']]
    : ['pipx', ['environment', '--value', 'PIPX_HOME']];
  const result = run(context, query[0], query[1], {
    cwd: repoRoot,
    timeoutMs: 10000,
    env: graphifyProcessEnv(context),
    inheritEnv: false,
  });
  const root = succeeded(result) ? firstAbsoluteLine(text(result)) : null;
  if (!root) return null;
  const pathApi = windows && /^(?:[A-Za-z]:[\\/]|\\\\)/.test(root) ? path.win32 : path;
  const environmentRoot = manager === 'uv'
    ? pathApi.resolve(root, packageName)
    : pathApi.resolve(root, 'venvs', packageName);
  const candidates = windows
    ? [pathApi.join(environmentRoot, 'Scripts', 'python.exe'), pathApi.join(environmentRoot, 'python.exe')]
    : [pathApi.join(environmentRoot, 'bin', 'python')];
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0] || null;
}

function probePythonDistributionIdentity(context, repoRoot, launcher, dependency, fallbackInterpreter) {
  const interpreter = launcherInterpreter(launcher) || fallbackInterpreter;
  if (!interpreter) return { ok: false, reason_code: 'graphify-package-identity-unverified' };
  const script = 'import importlib.metadata as m, json; p=sorted({d.metadata.get("Name", "").lower(): d.version for d in m.distributions() if d.metadata.get("Name")}.items()); print(json.dumps({"version": m.version("graphifyy"), "packages": p}))';
  const result = run(context, interpreter, ['-c', script], {
    cwd: repoRoot,
    timeoutMs: 10000,
    env: graphifyProcessEnv(context),
    inheritEnv: false,
  });
  if (!succeeded(result)) return { ok: false, reason_code: 'graphify-package-identity-unverified', interpreter };
  let payload;
  try {
    payload = JSON.parse(text(result));
  } catch (_error) {
    return { ok: false, reason_code: 'graphify-package-identity-unverified', interpreter };
  }
  const version = payload.version || '';
  if (version !== dependency.version) {
    return { ok: false, reason_code: 'graphify-package-version-mismatch', interpreter, package: 'graphifyy', version };
  }
  const packages = Array.isArray(payload.packages) ? payload.packages : [];
  return {
    ok: true,
    package: 'graphifyy',
    version,
    interpreter,
    inventory: { status: 'recorded', packages, count: packages.length },
  };
}

function launcherInterpreter(launcher) {
  if (path.extname(launcher).toLowerCase() === '.exe') return null;
  try {
    const firstLine = fs.readFileSync(launcher, 'utf8').split(/\r?\n/, 1)[0];
    const match = firstLine.match(/^#!\s*(\S+)/);
    return match && (path.isAbsolute(match[1]) || path.win32.isAbsolute(match[1])) ? match[1] : null;
  } catch (_error) {
    return null;
  }
}

function firstAbsoluteLine(output) {
  return String(output || '').split(/\r?\n/).map((line) => line.trim()).find((line) => path.isAbsolute(line) || path.win32.isAbsolute(line)) || null;
}

function graphifyProcessEnv(context, additions = {}) {
  const source = context.env && typeof context.env === 'object' ? context.env : process.env;
  const allowed = [
    'HOME', 'USERPROFILE', 'PATH', 'PATHEXT', 'LANG', 'LC_ALL', 'LC_CTYPE',
    'TMPDIR', 'TMP', 'TEMP', 'SYSTEMROOT', 'COMSPEC',
    'UV_TOOL_DIR', 'UV_TOOL_BIN_DIR', 'PIPX_HOME', 'PIPX_BIN_DIR',
  ];
  const env = {};
  for (const key of allowed) {
    if (source[key] !== undefined) env[key] = source[key];
  }
  if (!env.HOME && context.homeDir) env.HOME = context.homeDir;
  if (!env.USERPROFILE && context.homeDir && (context.platform === 'windows' || process.platform === 'win32')) {
    env.USERPROFILE = context.homeDir;
  }
  if (!env.PATH && process.env.PATH) env.PATH = process.env.PATH;
  for (const [key, value] of Object.entries(additions || {})) {
    if (key === 'GRAPHIFY_OUT' || allowed.includes(key)) env[key] = value;
  }
  env.GRAPHIFY_OUT = additions && additions.GRAPHIFY_OUT ? additions.GRAPHIFY_OUT : '.graphify';
  return env;
}

function providerOriginalPath(context) {
  const env = context.env && typeof context.env === 'object' ? context.env : null;
  if (!env) return '';
  return String(env.SPEC_FIRST_PROVIDER_ORIGINAL_PATH || env.PATH || '');
}

function commandFromSearchPath(command, searchPath, windows, env = {}) {
  if (!searchPath) return null;
  const extensions = windows
    ? String(env.PATHEXT || '.COM;.EXE;.BAT;.CMD')
      .split(';')
      .filter(Boolean)
      .map((extension) => extension.toLowerCase())
    : [''];
  const hasExtension = windows && path.extname(command).length > 0;
  for (const rawDirectory of String(searchPath).split(path.delimiter)) {
    const directory = rawDirectory.replace(/^"|"$/g, '') || '.';
    const names = windows && !hasExtension
      ? [command, ...extensions.map((extension) => `${command}${extension}`)]
      : [command];
    for (const name of names) {
      const candidate = path.resolve(directory, name);
      if (isExecutableCommandFile(candidate, windows)) return candidate;
    }
  }
  return null;
}

function isExecutableCommandFile(candidate, windows) {
  try {
    if (!fs.statSync(candidate).isFile()) return false;
    fs.accessSync(candidate, windows ? fs.constants.F_OK : fs.constants.X_OK);
    return true;
  } catch (_error) {
    return false;
  }
}

function repairGraphifyPathSymlinkIfSafe(context, resolved, versionPin) {
  if (!resolved || !resolved.ok || resolved.on_original_path) {
    return { status: 'not-needed', reason_code: null };
  }
  if (repairDisabled(context)) {
    return { status: 'report-only', reason_code: 'graphify-path-symlink-repair-disabled' };
  }

  const pathCommand = resolved.original_path_command;
  const pinnedCommand = resolved.command;
  if (!pathCommand || !path.isAbsolute(pathCommand) || !path.isAbsolute(pinnedCommand)) {
    return { status: 'report-only', reason_code: 'graphify-path-command-ambiguous' };
  }
  if (path.resolve(pathCommand) === path.resolve(pinnedCommand)) {
    return { status: 'not-needed', reason_code: null };
  }

  const pathItem = lstatOrNull(pathCommand);
  if (!pathItem || !pathItem.isSymbolicLink()) {
    return { status: 'report-only', reason_code: 'graphify-path-command-not-symlink' };
  }
  const windows = context.platform === 'windows' || process.platform === 'win32';
  if (!isExecutableCommandFile(pinnedCommand, windows)) {
    return { status: 'report-only', reason_code: 'graphify-pinned-command-not-executable' };
  }
  const pinnedProbe = run(context, pinnedCommand, ['--version'], { timeoutMs: 10000 });
  if (!succeeded(pinnedProbe) || !versionOutputMatches(text(pinnedProbe), versionPin)) {
    return { status: 'report-only', reason_code: 'graphify-pinned-command-not-confirmed' };
  }

  const parent = path.dirname(pathCommand);
  try {
    if (!fs.statSync(parent).isDirectory()) {
      return { status: 'report-only', reason_code: 'graphify-path-parent-not-directory' };
    }
    fs.accessSync(parent, fs.constants.W_OK);
  } catch (_error) {
    return { status: 'report-only', reason_code: 'graphify-path-parent-not-writable' };
  }

  const parentRealPath = fs.realpathSync.native(parent);
  const backupPath = nextGraphifyBackupPath(pathCommand);
  try {
    const currentItem = lstatOrNull(pathCommand);
    if (!currentItem
      || !currentItem.isSymbolicLink()
      || currentItem.dev !== pathItem.dev
      || currentItem.ino !== pathItem.ino
      || fs.realpathSync.native(parent) !== parentRealPath
      || lstatOrNull(backupPath)) {
      return { status: 'report-only', reason_code: 'graphify-path-command-changed-before-repair' };
    }
    fs.renameSync(pathCommand, backupPath);
    try {
      if (windows) fs.symlinkSync(pinnedCommand, pathCommand, 'file');
      else fs.symlinkSync(pinnedCommand, pathCommand);
    } catch (error) {
      if (!lstatOrNull(pathCommand) && lstatOrNull(backupPath)) {
        fs.renameSync(backupPath, pathCommand);
      }
      throw error;
    }
    return {
      status: 'repaired',
      reason_code: 'graphify-path-symlink-repaired',
      path_command: pathCommand,
      pinned_command: pinnedCommand,
      backup_path: backupPath,
    };
  } catch (_error) {
    return { status: 'report-only', reason_code: 'graphify-path-symlink-repair-skipped' };
  }
}

function repairDisabled(context) {
  const env = context.env && typeof context.env === 'object' ? context.env : {};
  return ['false', 'no', '0'].includes(String(env.SPEC_FIRST_PROVIDER_GRAPHIFY_REPAIR_PATH_SYMLINK || '').toLowerCase());
}

function nextGraphifyBackupPath(pathCommand) {
  let candidate = `${pathCommand}.old`;
  let index = 1;
  while (lstatOrNull(candidate)) {
    candidate = `${pathCommand}.old.${index}`;
    index += 1;
  }
  return candidate;
}

function graphifyPathVisibilityAction(runtimeContext, pathRepair) {
  if (!runtimeContext.graphifyCommand || runtimeContext.graphifyOnOriginalPath === true) return null;
  if (pathRepair && pathRepair.status === 'repaired') return null;
  const command = runtimeContext.graphifyCommand;
  if (runtimeContext.graphifyCollisionState === 'npm-incumbent') {
    return 'Python Graphify 已通过 absolute launcher 验证；确认其他项目不再依赖后，可显式运行 npm uninstall -g @sentropic/graphify，setup 不会自动卸载。';
  }
  if (!path.isAbsolute(command)) {
    return '让 pinned Graphify CLI 在原始 PATH 中可见，然后重新运行显式 setup。';
  }
  const binDirectory = path.dirname(command);
  if (runtimeContext.graphifyOriginalPathCommand && path.isAbsolute(runtimeContext.graphifyOriginalPathCommand)) {
    return `将 ${binDirectory} 加入原始 PATH，或手动修复 ${runtimeContext.graphifyOriginalPathCommand}。`;
  }
  return `将 ${binDirectory} 加入原始 PATH，使 shell 和 project hook 能够解析 Graphify。`;
}

function lstatOrNull(candidate) {
  try {
    return fs.lstatSync(candidate);
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) return null;
    throw error;
  }
}

function resolveProviderPaths(context, repoRoot) {
  const workspaceInput = context.requirementWorkspace || '.';
  const workspaceValidation = validateRelativeProviderPath(
    workspaceInput,
    'requirement-workspace-absolute',
    'requirement-workspace-escape',
  );
  if (!workspaceValidation.ok) return workspaceValidation;
  const workspace = path.resolve(repoRoot, workspaceValidation.relative_path);
  if (!isPathWithin(workspace, repoRoot)) {
    return { ok: false, reason_code: 'requirement-workspace-escape' };
  }
  try {
    assertContainedPath(repoRoot, workspace, { reasonCode: 'provider-workspace-symlink-escape' });
  } catch (error) {
    return { ok: false, reason_code: error.reason_code || 'provider-workspace-symlink-escape' };
  }
  if (!fs.existsSync(workspace) || !fs.statSync(workspace).isDirectory()) {
    return { ok: false, reason_code: 'requirement-workspace-missing' };
  }

  const artifactInput = context.registryEntry
    && context.registryEntry.first_generation
    && context.registryEntry.first_generation.artifact_root
    ? context.registryEntry.first_generation.artifact_root
    : '.graphify';
  const artifactValidation = validateRelativeProviderPath(
    artifactInput,
    'graphify-artifact-root-absolute',
    'graphify-artifact-root-escape',
  );
  if (!artifactValidation.ok) return artifactValidation;
  const artifactRoot = path.resolve(repoRoot, artifactValidation.relative_path);
  try {
    assertContainedPath(repoRoot, artifactRoot, { reasonCode: 'graphify-artifact-symlink-escape' });
  } catch (error) {
    return { ok: false, reason_code: error.reason_code || 'graphify-artifact-symlink-escape' };
  }
  return {
    ok: true,
    workspace,
    workspace_relative: relativeRef(repoRoot, workspace) || '.',
    artifact_root: artifactRoot,
    artifact_root_relative: relativeRef(repoRoot, artifactRoot),
  };
}

function validateRelativeProviderPath(value, absoluteReason, escapeReason) {
  const raw = String(value || '.');
  if (path.isAbsolute(raw) || path.win32.isAbsolute(raw)) {
    return { ok: false, reason_code: absoluteReason };
  }
  const parts = raw.replaceAll('\\', '/').split('/').filter((part) => part && part !== '.');
  if (parts.includes('..')) return { ok: false, reason_code: escapeReason };
  return { ok: true, relative_path: parts.length > 0 ? path.join(...parts) : '.' };
}

function assertGraphifyMutationSurfaces(repoRoot, host, artifactRoot, ecosystem) {
  assertGraphifyArtifactSurface(repoRoot, artifactRoot);
  if (!isSpecFirstSourceRepo(repoRoot)) {
    for (const candidate of projectMutationSurfaces(repoRoot, host, ecosystem)) {
      assertContainedPath(repoRoot, candidate, { reasonCode: 'graphify-project-surface-symlink-escape' });
    }
  }
  const gitEntry = path.join(repoRoot, '.git');
  const gitItem = lstatOrNull(gitEntry);
  if (gitItem) {
    if (gitItem.isSymbolicLink()) throw graphifySafetyError('graphify-hook-symlink-escape', `不安全的 Graphify git entry：${gitEntry}`);
    assertContainedPath(repoRoot, gitEntry, { reasonCode: 'graphify-hook-symlink-escape' });
    if (gitItem.isDirectory()) {
      const hooksRoot = path.join(gitEntry, 'hooks');
      const hooksItem = lstatOrNull(hooksRoot);
      if (hooksItem && hooksItem.isSymbolicLink()) {
        throw graphifySafetyError('graphify-hook-symlink-escape', `不安全的 Graphify hooks root：${hooksRoot}`);
      }
      assertContainedPath(repoRoot, hooksRoot, { reasonCode: 'graphify-hook-symlink-escape' });
      for (const name of GRAPHIFY_HOOK_NAMES) {
        assertGraphifyHookLeaf(repoRoot, path.join(hooksRoot, name));
      }
    }
  }
}

function projectMutationSurfaces(repoRoot, host, ecosystem) {
  if (ecosystem === 'pypi') {
    const pythonPaths = {
      claude: ['.claude/skills/graphify/SKILL.md', '.claude/CLAUDE.md', 'CLAUDE.md', '.claude/settings.json'],
      codex: ['.codex/skills/graphify/SKILL.md', 'AGENTS.md', '.codex/hooks.json'],
      cursor: ['.cursor/rules/graphify.mdc'],
      kiro: ['.kiro/skills/graphify/SKILL.md', '.kiro/steering/graphify.md'],
      qoder: ['.qoder/rules/spec-first.md'],
    }[host] || ['.codex/skills/graphify/SKILL.md', 'AGENTS.md', '.codex/hooks.json'];
    return pythonPaths.map((relativePath) => path.join(repoRoot, relativePath));
  }
  const instruction = host === 'claude' ? 'CLAUDE.md' : 'AGENTS.md';
  const relativePaths = {
    claude: ['.claude/skills/graphify/SKILL.md', '.claude/hooks.json'],
    cursor: ['.cursor/skills/graphify/SKILL.md'],
    kiro: ['.kiro/skills/graphify/SKILL.md'],
    qoder: ['.qoder/skills/graphify/SKILL.md'],
  }[host] || ['.codex/skills/graphify/SKILL.md', '.agents/skills/graphify/SKILL.md', '.codex/hooks.json'];
  return [...relativePaths, instruction].map((relativePath) => path.join(repoRoot, relativePath));
}

function projectSkillConfigured(repoRoot, host, ecosystem) {
  if (isSpecFirstSourceRepo(repoRoot)) return true;
  if (ecosystem === 'pypi') {
    const required = {
      claude: ['.claude/skills/graphify/SKILL.md', '.claude/CLAUDE.md', 'CLAUDE.md', '.claude/settings.json'],
      codex: ['.codex/skills/graphify/SKILL.md', 'AGENTS.md', '.codex/hooks.json'],
      cursor: ['.cursor/rules/graphify.mdc'],
      kiro: ['.kiro/skills/graphify/SKILL.md', '.kiro/steering/graphify.md'],
      qoder: ['.qoder/rules/spec-first.md'],
    }[host] || ['.codex/skills/graphify/SKILL.md', 'AGENTS.md', '.codex/hooks.json'];
    return required.every((relativePath) => fs.existsSync(path.join(repoRoot, relativePath)));
  }
  const candidates = {
    claude: ['.claude/skills/graphify/SKILL.md'],
    cursor: ['.cursor/skills/graphify/SKILL.md', '.codex/skills/graphify/SKILL.md', '.agents/skills/graphify/SKILL.md'],
    kiro: ['.kiro/skills/graphify/SKILL.md'],
    qoder: ['.qoder/skills/graphify/SKILL.md'],
  }[host] || ['.codex/skills/graphify/SKILL.md', '.agents/skills/graphify/SKILL.md'];
  return candidates.some((relativePath) => fs.existsSync(path.join(repoRoot, relativePath)));
}

function normalizeGraphifyInstructionSection(repoRoot, host) {
  if (isSpecFirstSourceRepo(repoRoot)) return { changed: false, reason_code: 'source-repo-protected' };
  const target = path.join(repoRoot, host === 'claude' ? 'CLAUDE.md' : 'AGENTS.md');
  if (!fs.existsSync(target)) return { changed: false, reason_code: 'instruction-file-missing' };
  assertContainedPath(repoRoot, target, { reasonCode: 'graphify-instruction-symlink-escape' });
  const current = fs.readFileSync(target, 'utf8');
  const section = `${renderGraphifyInstructionSection(host).trimEnd()}\n`;
  const pattern = /\n*## graphify\n[\s\S]*?(?=\n## |\n<!-- spec-first:[^>]+:start -->|$)/;
  let next;
  if (current.includes('## graphify')) {
    next = current.replace(pattern, (match, offset) => `${offset === 0 ? '' : '\n\n'}${section}`);
  } else {
    const separator = current.length === 0 || current.endsWith('\n') ? '' : '\n';
    next = `${current}${separator}\n${section}`;
  }
  if (next === current) return { changed: false, reason_code: 'instruction-section-current' };
  writeContainedText(repoRoot, target, next, 'graphify-instruction-symlink-escape');
  return { changed: true, reason_code: 'instruction-section-normalized' };
}

function installQoderGraphifyAdapter(repoRoot) {
  const target = path.join(repoRoot, '.qoder', 'rules', 'spec-first.md');
  const section = `${renderGraphifyInstructionSection('qoder').trimEnd()}\n`;
  let current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  const pattern = /\n*## graphify\n[\s\S]*?(?=\n## |$)/;
  const next = current.includes('## graphify')
    ? current.replace(pattern, (match, offset) => `${offset === 0 ? '' : '\n\n'}${section}`)
    : `${current}${current && !current.endsWith('\n') ? '\n' : ''}${current ? '\n' : ''}${section}`;
  if (next !== current) writeContainedText(repoRoot, target, next, 'graphify-project-surface-symlink-escape');
}

function renderGraphifyInstructionSection(host) {
  const lines = [
    '## graphify',
    '',
    '本项目在 .graphify/ 中维护 knowledge graph，包含 god node、community structure 与跨文件关系。',
    '',
  ];
  if (host !== 'claude') {
    lines.push('当用户输入 `/graphify` 时，先调用 `skill` 工具并设置 `skill: "graphify"`，再执行其他操作。', '');
  }
  lines.push(
    '规则：',
    '- 当 `.graphify/graph.json` 存在且 runtime 可见 Graphify CLI 时，将 Graphify 用作 architecture relationship、impact analysis 与宽范围 codebase navigation 的 exploration-tier 定向工具。用 `query` 做宽范围定向，用 `path "<A>" "<B>"` 查看关系，用 `explain "<concept>"` 聚焦概念。',
    '- 简单事实问答、当前上下文总结、用户提供的单文档工作或已限定范围的文件读取，默认不使用 Graphify；使用 `rg` 或 bounded source read。',
    '- 如果 `.graphify/graph.json` 存在但 Graphify CLI 不可见，不得把 artifact 当作 runtime readiness。改用 bounded direct source read，并将 `spec-mcp-setup --only graphify` 作为修复路径。',
    '- Hook 或 incremental update 后 `.graphify/` 出现 dirty 文件属于预期现象，不能仅因此跳过 Graphify。',
    '- 如果 `.graphify/wiki/index.md` 存在，用它进行宽范围导航。只有 query/path/explain 未提供足够上下文时，才读取 `.graphify/GRAPH_REPORT.md`。',
    '- 将旧版 `graphify-out/` 仅视为 compatibility evidence；优先运行 `spec-mcp-setup --only graphify --refresh`，重新生成 provider-native `.graphify/`。',
    '- 将 Graphify/code-graph 输出视为 `provider_untrusted` advisory navigation；重要结论必须由 source、test、log、contract 或 owner evidence 确认。',
    '- 普通 workflow 不会在代码变更后刷新 project graph。仅在显式 refresh 时运行 `spec-mcp-setup --only graphify --refresh`。',
  );
  return lines.join('\n');
}

function writeContainedText(repoRoot, target, contents, reasonCode) {
  const directory = ensureContainedDirectory(repoRoot, path.dirname(target), {
    reasonCode,
    mode: 0o700,
  });
  assertContainedPath(repoRoot, target, { reasonCode });
  const mode = fs.existsSync(target) ? (fs.statSync(target).mode & 0o777) : 0o600;
  const temp = path.join(directory, `.${path.basename(target)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  assertContainedPath(repoRoot, temp, { reasonCode });
  try {
    fs.writeFileSync(temp, contents, { flag: 'wx', mode });
    assertContainedPath(repoRoot, target, { reasonCode });
    assertContainedPath(repoRoot, temp, { reasonCode });
    fs.renameSync(temp, target);
    fs.chmodSync(target, mode);
  } finally {
    try {
      if (fs.existsSync(temp)) fs.rmSync(temp, { force: true });
    } catch (_error) {
      // 保留主 mutation 错误。
    }
  }
}

function graphifySafetyError(reasonCode, message) {
  return reasonError(reasonCode, message);
}

function normalizePythonHostIntegration(repoRoot, host, runtimeContext) {
  if (!runtimeContext.graphifyCommand || !path.isAbsolute(runtimeContext.graphifyCommand)) {
    throw graphifySafetyError('graphify-host-launcher-ambiguous', 'Host integration 需要 verified absolute Graphify launcher。');
  }
  if (host === 'claude' || host === 'codex') normalizeGraphifyInstructionSection(repoRoot, host);
  const providerOwnedSurfaces = {
    claude: ['.claude/skills/graphify', '.claude/CLAUDE.md'],
    codex: ['.codex/skills/graphify'],
    cursor: ['.cursor/rules/graphify.mdc'],
    kiro: ['.kiro/skills/graphify', '.kiro/steering/graphify.md'],
  }[host] || [];
  for (const relativePath of providerOwnedSurfaces) {
    const surface = path.join(repoRoot, relativePath);
    if (!fs.existsSync(surface)) continue;
    const targets = fs.statSync(surface).isDirectory() ? providerOwnedTextFiles(repoRoot, surface) : [surface];
    for (const target of targets) {
    assertContainedPath(repoRoot, target, { reasonCode: 'graphify-project-surface-symlink-escape' });
    const current = fs.readFileSync(target, 'utf8');
    const next = current.replaceAll('graphify-out/', '.graphify/').replaceAll('graphify-out', '.graphify');
    if (next !== current) writeContainedText(repoRoot, target, next, 'graphify-project-surface-symlink-escape');
    }
  }
  const configPath = {
    claude: '.claude/settings.json',
    codex: '.codex/hooks.json',
  }[host];
  if (configPath) normalizePythonHostHookConfig(repoRoot, path.join(repoRoot, configPath), runtimeContext.graphifyCommand);
}

function providerOwnedTextFiles(repoRoot, directory) {
  const files = [];
  const visit = (current) => {
    assertContainedPath(repoRoot, current, { reasonCode: 'graphify-project-surface-symlink-escape' });
    const item = fs.lstatSync(current);
    if (item.isSymbolicLink()) throw graphifySafetyError('graphify-project-surface-symlink-escape', `Provider surface 不得包含 symlink：${current}`);
    if (item.isDirectory()) {
      for (const name of fs.readdirSync(current)) visit(path.join(current, name));
    } else if (item.isFile() && /(?:\.md|\.mdc|SKILL\.md)$/.test(current)) {
      files.push(current);
    }
  };
  visit(directory);
  return files;
}

function normalizePythonHostHookConfig(repoRoot, target, launcher) {
  if (!fs.existsSync(target)) throw graphifySafetyError('graphify-host-hook-config-missing', `缺少 ${relativeRef(repoRoot, target)}。`);
  assertContainedPath(repoRoot, target, { reasonCode: 'graphify-project-surface-symlink-escape' });
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
  } catch (_error) {
    throw graphifySafetyError('graphify-host-hook-config-invalid', `${relativeRef(repoRoot, target)} 不是合法 JSON。`);
  }
  let matches = 0;
  const visit = (value, key = null) => {
    if (Array.isArray(value)) return value.map((child) => visit(child));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([childKey, child]) => [childKey, visit(child, childKey)]));
    }
    if (key !== 'command' || typeof value !== 'string' || !value.includes('hook-check')) return value;
    const commandLauncher = parseHookCheckLauncher(value);
    const basename = commandLauncher
      ? (path.win32.isAbsolute(commandLauncher) && !path.isAbsolute(commandLauncher)
        ? path.win32.basename(commandLauncher)
        : path.basename(commandLauncher)).replace(/\.(?:exe|cmd)$/i, '')
      : '';
    if (!commandLauncher || basename !== 'graphify') {
      throw graphifySafetyError('graphify-host-hook-command-unexpected', `拒绝修改 unexpected Graphify host hook command：${value}`);
    }
    matches += 1;
    return renderHookCheckCommand(launcher);
  };
  const normalized = { ...parsed, hooks: visit(parsed.hooks) };
  if (matches !== 1) throw graphifySafetyError('graphify-host-hook-cardinality-invalid', 'Graphify host hook entry 必须恰好出现一次。');
  const next = `${JSON.stringify(normalized, null, 2)}\n`;
  if (next !== fs.readFileSync(target, 'utf8')) writeContainedText(repoRoot, target, next, 'graphify-project-surface-symlink-escape');
}

function renderHookCheckCommand(launcher) {
  if (path.win32.isAbsolute(launcher) && !path.isAbsolute(launcher)) {
    return `"${launcher.replaceAll('"', '\\"')}" hook-check`;
  }
  return `'${launcher.replaceAll("'", "'\\''")}' hook-check`;
}

function parseHookCheckLauncher(command) {
  const match = String(command).match(/^(?:'([^']*)'|"((?:[^"\\]|\\.)*)"|(\S+))\s+hook-check$/);
  if (!match) return null;
  if (match[1] !== undefined) return match[1];
  if (match[2] !== undefined) return match[2].replace(/\\(["\\])/g, '$1');
  return match[3];
}

function pythonHostIntegrationConfigured(repoRoot, host, runtimeContext) {
  if (host === 'qoder') {
    const adapter = path.join(repoRoot, '.qoder', 'rules', 'spec-first.md');
    if (!fs.existsSync(adapter)) return { ok: false, reason_code: 'graphify-qoder-adapter-missing' };
    const contents = fs.readFileSync(adapter, 'utf8');
    return contents.includes('.graphify/') && contents.includes('graphify')
      ? { ok: true, mode: 'spec-first-adapter' }
      : { ok: false, reason_code: 'graphify-qoder-adapter-invalid' };
  }
  const required = {
    claude: ['.claude/skills/graphify/SKILL.md', '.claude/CLAUDE.md', 'CLAUDE.md', '.claude/settings.json'],
    codex: ['.codex/skills/graphify/SKILL.md', 'AGENTS.md', '.codex/hooks.json'],
    cursor: ['.cursor/rules/graphify.mdc'],
    kiro: ['.kiro/skills/graphify/SKILL.md', '.kiro/steering/graphify.md'],
  }[host] || [];
  if (required.length === 0 || required.some((relativePath) => !fs.existsSync(path.join(repoRoot, relativePath)))) {
    return { ok: false, reason_code: 'graphify-project-integration-missing' };
  }
  for (const relativePath of required.filter((entry) => /(?:SKILL\.md|\.mdc|\.md)$/.test(entry))) {
    const contents = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    if (/knowledge graph at graphify-out|Read graphify-out\/graph|first run graphify-out/i.test(contents)) {
      return { ok: false, reason_code: 'graphify-host-artifact-contract-mismatch' };
    }
  }
  const providerOwnedRoots = {
    claude: ['.claude/skills/graphify', '.claude/CLAUDE.md'],
    codex: ['.codex/skills/graphify'],
    cursor: ['.cursor/rules/graphify.mdc'],
    kiro: ['.kiro/skills/graphify', '.kiro/steering/graphify.md'],
  }[host] || [];
  for (const relativePath of providerOwnedRoots) {
    const surface = path.join(repoRoot, relativePath);
    const targets = fs.statSync(surface).isDirectory() ? providerOwnedTextFiles(repoRoot, surface) : [surface];
    if (targets.some((target) => fs.readFileSync(target, 'utf8').includes('graphify-out/'))) {
      return { ok: false, reason_code: 'graphify-host-artifact-contract-mismatch' };
    }
  }
  if (host === 'claude' || host === 'codex') {
    const configPath = path.join(repoRoot, host === 'claude' ? '.claude/settings.json' : '.codex/hooks.json');
    const expected = runtimeContext.graphifyCommand ? renderHookCheckCommand(runtimeContext.graphifyCommand) : null;
    let commands;
    try {
      commands = graphifyHostHookCommands(JSON.parse(fs.readFileSync(configPath, 'utf8')));
    } catch (_error) {
      return { ok: false, reason_code: 'graphify-host-hook-config-invalid' };
    }
    if (!runtimeContext.graphifyCommand
      || !(path.isAbsolute(runtimeContext.graphifyCommand) || path.win32.isAbsolute(runtimeContext.graphifyCommand))
      || commands.length !== 1
      || commands[0] !== expected) {
      return { ok: false, reason_code: 'graphify-host-launcher-mismatch' };
    }
  }
  return { ok: true, mode: 'provider-native' };
}

function graphifyHostHookCommands(parsed) {
  const commands = [];
  const events = parsed && parsed.hooks && Array.isArray(parsed.hooks.PreToolUse)
    ? parsed.hooks.PreToolUse
    : [];
  for (const event of events) {
    const entries = event && Array.isArray(event.hooks) ? event.hooks : [];
    for (const entry of entries) {
      if (entry && entry.type === 'command' && typeof entry.command === 'string'
        && parseHookCheckLauncher(entry.command)) commands.push(entry.command);
    }
  }
  return commands;
}

function normalizePythonGraphifyHooks(repoRoot, runtimeContext) {
  if (!runtimeContext.graphifyCommand || !path.isAbsolute(runtimeContext.graphifyCommand)) {
    throw graphifySafetyError('graphify-hook-launcher-ambiguous', 'Python Graphify hook normalization 需要 verified absolute launcher。');
  }
  if (!runtimeContext.graphifyInterpreter || !path.isAbsolute(runtimeContext.graphifyInterpreter)) {
    throw graphifySafetyError('graphify-hook-interpreter-stale', 'Python Graphify hook normalization 需要 verified absolute interpreter。');
  }
  const hooksRoot = path.join(repoRoot, '.git', 'hooks');
  let changed = false;
  for (const hookName of GRAPHIFY_HOOK_NAMES) {
    const hookPath = path.join(hooksRoot, hookName);
    const item = assertGraphifyHookLeaf(repoRoot, hookPath);
    if (!item || !item.isFile()) throw graphifySafetyError('graphify-provider-hook-not-found', `${hookName} 未安装。`);
    const current = fs.readFileSync(hookPath, 'utf8');
    const markers = PYTHON_HOOK_MARKERS[hookName];
    const block = extractUniqueMarkerBlock(current, markers[0], markers[1]);
    let normalized = block.text
      .replaceAll('graphify-out/', '.graphify/')
      .replaceAll("'graphify-out'", "'.graphify'")
      .replaceAll('"graphify-out"', '".graphify"');
    const envBlock = [
      HOOK_ARTIFACT_BLOCK_START,
      "export GRAPHIFY_OUT='.graphify'",
      HOOK_ARTIFACT_BLOCK_END,
      '',
    ].join('\n');
    normalized = renderHookWithManagedBlock(normalized, HOOK_ARTIFACT_BLOCK_START, HOOK_ARTIFACT_BLOCK_END, envBlock, markers[0]);
    const credentialBlock = [
      HOOK_CREDENTIAL_BLOCK_START,
      "case $- in *x*) _spec_first_restore_xtrace=1; set +x ;; esac",
      "while IFS= read -r _spec_first_env_line; do",
      "  _spec_first_env_name=${_spec_first_env_line#export }",
      "  _spec_first_env_name=${_spec_first_env_name%%=*}",
      "  case \"$_spec_first_env_name\" in",
      "    HOME|USERPROFILE|PATH|PATHEXT|LANG|LC_ALL|LC_CTYPE|TMPDIR|TMP|TEMP|SYSTEMROOT|COMSPEC|GIT_DIR|GIT_WORK_TREE|GIT_PREFIX|GRAPHIFY_OUT) ;;",
      "    *) unset \"$_spec_first_env_name\" ;;",
      '  esac',
      'done <<SPEC_FIRST_GRAPHIFY_ENV',
      '$(export -p)',
      'SPEC_FIRST_GRAPHIFY_ENV',
      'unset _spec_first_env_line _spec_first_env_name',
      "if [ \"${_spec_first_restore_xtrace:-0}\" = 1 ]; then unset _spec_first_restore_xtrace; set -x; fi",
      HOOK_CREDENTIAL_BLOCK_END,
      '',
    ].join('\n');
    normalized = renderHookWithManagedBlock(normalized, HOOK_CREDENTIAL_BLOCK_START, HOOK_CREDENTIAL_BLOCK_END, credentialBlock, markers[0]);
    if (!hookBlockHasInterpreter(normalized, runtimeContext.graphifyInterpreter)) {
      throw graphifySafetyError('graphify-hook-interpreter-stale', `${hookName} 未引用 verified interpreter。`);
    }
    const next = `${current.slice(0, block.start)}${normalized}${current.slice(block.end)}`;
    if (next !== current) {
      writeContainedText(repoRoot, hookPath, next, 'graphify-hook-symlink-escape');
      changed = true;
    }
  }
  return { changed, reason_code: changed ? 'graphify-hook-normalized' : 'graphify-hook-current' };
}

function verifyPythonGraphifyHooks(repoRoot, runtimeContext) {
  try {
    for (const hookName of GRAPHIFY_HOOK_NAMES) {
      const hookPath = path.join(repoRoot, '.git', 'hooks', hookName);
      const item = assertGraphifyHookLeaf(repoRoot, hookPath);
      if (!item || !item.isFile()) return { ok: false, reason_code: 'graphify-provider-hook-not-found' };
      const current = fs.readFileSync(hookPath, 'utf8');
      const markers = PYTHON_HOOK_MARKERS[hookName];
      const block = extractUniqueMarkerBlock(current, markers[0], markers[1]).text;
      if (block.split(HOOK_ARTIFACT_BLOCK_START).length - 1 !== 1
        || block.split(HOOK_ARTIFACT_BLOCK_END).length - 1 !== 1
        || !block.includes("export GRAPHIFY_OUT='.graphify'")
        || block.includes('graphify-out/')
        || block.includes("'graphify-out'")
        || block.includes('"graphify-out"')) {
        return { ok: false, reason_code: 'graphify-hook-artifact-contract-mismatch' };
      }
      if (block.split(HOOK_CREDENTIAL_BLOCK_START).length - 1 !== 1
        || block.split(HOOK_CREDENTIAL_BLOCK_END).length - 1 !== 1
        || !block.includes('GIT_WORK_TREE|GIT_PREFIX|GRAPHIFY_OUT')
        || !block.includes('*) unset')) {
        return { ok: false, reason_code: 'graphify-hook-credential-isolation-missing' };
      }
      if (!hookBlockHasInterpreter(block, runtimeContext.graphifyInterpreter)) {
        return { ok: false, reason_code: 'graphify-hook-interpreter-stale' };
      }
      if (!block.includes('from graphify.watch import _rebuild_code')) {
        return { ok: false, reason_code: 'graphify-hook-command-unexpected' };
      }
    }
    return { ok: true, reason_code: null };
  } catch (error) {
    return { ok: false, reason_code: error.reason_code || 'graphify-hook-structure-invalid' };
  }
}

function pythonHookMarkersPresent(repoRoot) {
  try {
    for (const hookName of GRAPHIFY_HOOK_NAMES) {
      const hookPath = path.join(repoRoot, '.git', 'hooks', hookName);
      if (!fs.existsSync(hookPath)) return false;
      const contents = fs.readFileSync(hookPath, 'utf8');
      const markers = PYTHON_HOOK_MARKERS[hookName];
      extractUniqueMarkerBlock(contents, markers[0], markers[1]);
    }
    return true;
  } catch (_error) {
    return false;
  }
}

function hookBlockHasInterpreter(block, expectedInterpreter) {
  const match = block.match(/_PINNED=(?:'([^']+)'|"([^"]+)")/);
  if (!match || !expectedInterpreter) return false;
  return sameExecutablePath(match[1] || match[2], expectedInterpreter);
}

function sameExecutablePath(left, right) {
  if (path.resolve(left) === path.resolve(right)) return true;
  try {
    return fs.realpathSync.native(left) === fs.realpathSync.native(right);
  } catch (_error) {
    return false;
  }
}

function extractUniqueMarkerBlock(contents, startMarker, endMarker) {
  const starts = markerOffsets(contents, startMarker);
  const ends = markerOffsets(contents, endMarker);
  if (starts.length !== 1 || ends.length !== 1 || ends[0] <= starts[0]) {
    throw graphifySafetyError('graphify-hook-marker-ambiguous', `Graphify hook marker ${startMarker} / ${endMarker} 必须各出现一次。`);
  }
  const end = ends[0] + endMarker.length;
  return { start: starts[0], end, text: contents.slice(starts[0], end) };
}

function markerOffsets(contents, marker) {
  const offsets = [];
  let cursor = 0;
  while (cursor < contents.length) {
    const offset = contents.indexOf(marker, cursor);
    if (offset === -1) break;
    offsets.push(offset);
    cursor = offset + marker.length;
  }
  return offsets;
}

function renderHookWithManagedBlock(current, startMarker, endMarker, block, insertAfterMarker) {
  const startCount = current.split(startMarker).length - 1;
  const endCount = current.split(endMarker).length - 1;
  if (startCount !== endCount || startCount > 1) {
    throw graphifySafetyError('graphify-hook-managed-block-ambiguous', 'Graphify hook managed block 存在歧义。');
  }
  if (startCount === 1) {
    const pattern = new RegExp(`${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}(?:\\r?\\n)?`);
    return current.replace(pattern, block);
  }
  const markerEnd = current.indexOf(insertAfterMarker) + insertAfterMarker.length;
  const lineEnd = current.indexOf('\n', markerEnd);
  const insertAt = lineEnd === -1 ? current.length : lineEnd + 1;
  return `${current.slice(0, insertAt)}${block}${current.slice(insertAt)}`;
}

function repairGraphifyHookPathVisibility(repoRoot, runtimeContext) {
  if (runtimeContext.graphifyOnOriginalPath !== false) {
    return { changed: false, reason_code: 'graphify-cli-visible-on-original-path' };
  }
  const graphifyCommand = runtimeContext.graphifyCommand;
  if (!graphifyCommand || !path.isAbsolute(graphifyCommand)) {
    return { changed: false, reason_code: 'graphify-hook-path-command-ambiguous' };
  }
  const graphifyBinDirectory = path.dirname(graphifyCommand);
  try {
    if (!fs.statSync(graphifyBinDirectory).isDirectory()) {
      return { changed: false, reason_code: 'graphify-hook-path-directory-missing' };
    }
  } catch (_error) {
    return { changed: false, reason_code: 'graphify-hook-path-directory-missing' };
  }

  const hooksRoot = path.join(repoRoot, '.git', 'hooks');
  const hooksItem = lstatOrNull(hooksRoot);
  if (!hooksItem) return { changed: false, reason_code: 'graphify-hooks-directory-missing' };
  if (hooksItem.isSymbolicLink() || !hooksItem.isDirectory()) {
    throw graphifySafetyError('graphify-hook-symlink-escape', `不安全的 Graphify hooks root：${hooksRoot}`);
  }
  assertContainedPath(repoRoot, hooksRoot, { reasonCode: 'graphify-hook-symlink-escape' });

  const escapedDirectory = graphifyBinDirectory.replaceAll("'", "'\\''");
  const repairBlock = [
    HOOK_PATH_BLOCK_START,
    `export PATH='${escapedDirectory}':"$PATH"`,
    HOOK_PATH_BLOCK_END,
    '',
  ].join('\n');
  let changed = false;
  let providerHookFound = false;
  for (const hookName of GRAPHIFY_HOOK_NAMES) {
    const hookPath = path.join(hooksRoot, hookName);
    const hookItem = assertGraphifyHookLeaf(repoRoot, hookPath);
    if (!hookItem) continue;
    if (!hookItem.isFile()) {
      throw graphifySafetyError('graphify-hook-leaf-unsafe', `Graphify hook 不是普通文件：${hookPath}`);
    }
    const current = fs.readFileSync(hookPath, 'utf8');
    if (!current.includes(GRAPHIFY_HOOK_MARKER)) continue;
    providerHookFound = true;
    const next = renderHookWithManagedPathBlock(current, repairBlock);
    if (next === current) continue;
    writeContainedText(repoRoot, hookPath, next, 'graphify-hook-symlink-escape');
    assertGraphifyHookLeaf(repoRoot, hookPath);
    changed = true;
  }
  return {
    changed,
    reason_code: changed
      ? 'graphify-hook-path-repaired'
      : (providerHookFound ? 'graphify-hook-path-current' : 'graphify-provider-hook-not-found'),
  };
}

function renderHookWithManagedPathBlock(current, repairBlock) {
  const startCount = current.split(HOOK_PATH_BLOCK_START).length - 1;
  const endCount = current.split(HOOK_PATH_BLOCK_END).length - 1;
  if (startCount !== endCount || startCount > 1) {
    throw graphifySafetyError('graphify-hook-path-block-ambiguous', 'Graphify hook PATH managed block 存在歧义。');
  }
  if (startCount === 1) {
    const pattern = new RegExp(`${escapeRegExp(HOOK_PATH_BLOCK_START)}[\\s\\S]*?${escapeRegExp(HOOK_PATH_BLOCK_END)}(?:\\r?\\n)?`);
    return current.replace(pattern, repairBlock);
  }
  const shebang = /^#![^\r\n]*(?:\r?\n|$)/.exec(current);
  const insertAt = shebang ? shebang[0].length : 0;
  return `${current.slice(0, insertAt)}${repairBlock}${current.slice(insertAt)}`;
}

function assertGraphifyHookLeaf(repoRoot, hookPath) {
  const hookItem = lstatOrNull(hookPath);
  if (hookItem && hookItem.isSymbolicLink()) {
    throw reasonError('graphify-hook-symlink-escape', `不安全的 Graphify hook leaf：${hookPath}`);
  }
  assertContainedPath(repoRoot, hookPath, { reasonCode: 'graphify-hook-symlink-escape' });
  return hookItem;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function graphifyGitState(repoRoot) {
  const gitEntry = path.join(repoRoot, '.git');
  if (!fs.existsSync(gitEntry)) {
    return {
      is_git_repo: false,
      hook_mutation_allowed: false,
      hook_skipped_reason: 'not-a-git-repo',
    };
  }
  const directory = fs.lstatSync(gitEntry).isDirectory();
  return {
    is_git_repo: true,
    hook_mutation_allowed: directory,
    hook_skipped_reason: directory ? null : 'worktree-gitdir-hook-mutation-not-contained',
  };
}

function currentArtifactRefs(repoRoot, artifactRoot) {
  try {
    assertGraphifyArtifactSurface(repoRoot, artifactRoot);
  } catch (_error) {
    return [];
  }
  return ['graph.json', 'GRAPH_REPORT.md']
    .map((name) => path.join(artifactRoot, name))
    .filter((candidate) => fs.existsSync(candidate))
    .map((candidate) => relativeRef(repoRoot, candidate));
}

function assertGraphifyArtifactSurface(repoRoot, artifactRoot) {
  assertContainedPath(repoRoot, artifactRoot, { reasonCode: 'graphify-artifact-symlink-escape' });
  for (const name of ['graph.json', 'GRAPH_REPORT.md']) {
    assertContainedPath(repoRoot, path.join(artifactRoot, name), {
      reasonCode: 'graphify-artifact-symlink-escape',
    });
  }
}

function relativeRef(repoRoot, candidate) {
  return path.relative(repoRoot, candidate).split(path.sep).join('/');
}

function unsafeReadiness(context, repoRoot, reasonCode) {
  return providerResult(METADATA, {
    installed: false,
    configured: false,
    initialized: false,
    indexed: false,
    artifactExists: false,
    queryVerified: false,
    readinessStatus: 'degraded',
    firstGenerationStatus: 'failed',
    limitations: [providerLimitation('blocked', reasonCode, 'Graphify setup 被阻止。')],
    nextActions: ['替换不安全的 Provider symlink 或路径，然后重新运行显式 setup。'],
    hookStatus: 'blocked',
    hookSkippedReason: reasonCode,
  });
}

module.exports = {
  apply,
  graphifyProcessEnv,
  normalizePythonHostIntegration,
  normalizePythonGraphifyHooks,
  plan,
  recoverGraphifyMigration,
  refresh,
  resolvePythonGraphifyCommand,
  uninstall,
  pythonHostIntegrationConfigured,
  verifyPythonGraphifyHooks,
  verify,
};
