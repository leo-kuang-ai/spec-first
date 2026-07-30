'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const {
  assertContainedPath,
  ensureContainedDirectory,
  isPathWithin,
  reasonError,
} = require('../lib/path-safety.cjs');
const { resolveGitPath } = require('../lib/git-path.cjs');
const {
  isSpecFirstSourceRepo,
  providerLimitation,
  providerResult,
  run,
  succeeded,
  text,
  versionOutputMatches,
} = require('./common.cjs');

const CURRENT_ARTIFACT_ROOT = 'graphify-out';
const LEGACY_ARTIFACT_ROOT = '.graphify';
const GRAPHIFY_HOOK_NAMES = ['post-commit', 'post-checkout'];
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
    artifact_root: CURRENT_ARTIFACT_ROOT,
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
  if (!context.dependency || context.dependency.ecosystem !== 'pypi') {
    return blockedPlan(repoRoot, 'graphify-python-provider-required');
  }
  const resolved = resolveProviderPaths(context, repoRoot);
  if (!resolved.ok) return blockedPlan(repoRoot, resolved.reason_code);
  const workspace = resolved.workspace;
  try {
    assertGraphifyMutationSurfaces(repoRoot, context.host, resolved.artifact_root, context.dependency && context.dependency.ecosystem);
  } catch (error) {
    return blockedPlan(repoRoot, error.reason_code || 'provider-mutation-surface-unsafe');
  }
  const hookTarget = resolveGraphifyHookTarget(repoRoot);

  const nonActions = [
    '不得安装 Graphify MCP 或启动 Graphify watch mode。',
    '不得编辑 shell profile；需要时报告手动配置 PATH 可见性。',
    '已有图的显式 refresh 使用 Provider-native update 原位更新，不创建 spec-first staging 或 backup 目录。',
  ];
  if (isSpecFirstSourceRepo(repoRoot)) {
    nonActions.push('不得在 spec-first source repo 中 normalize 或重写 source-owned AGENTS.md/CLAUDE.md。');
  }
  nonActions.push('不得在Python Provider未完整verified前卸载npm incumbent；不得删除current graphify-out/或改写非npm-owned PATH command。');
  const actions = [];
  const resolvedDependency = context.probeDependency === true
    ? resolveGraphifyCommand(context, repoRoot, context.dependency && context.dependency.version)
    : { ok: false, reason_code: 'provider-dependency-not-probed' };
  if (!resolvedDependency.ok && context.dependency.package && context.dependency.version) {
    const installAction = buildPythonInstallAction(context, repoRoot, context.dependency);
    if (!installAction.ok) return blockedPlan(repoRoot, installAction.reason_code);
    actions.push(installAction.action);
  }
  if (!isSpecFirstSourceRepo(repoRoot) && context.host !== 'qoder') {
    actions.push({ kind: 'install-project-skill', command: 'graphify', args: ['install', '--project', '--platform', context.host || 'codex'] });
  } else if (!isSpecFirstSourceRepo(repoRoot) && context.host === 'qoder') {
    actions.push({ kind: 'install-qoder-adapter', command: null, args: [] });
  }
  const currentArtifactRoot = resolved.artifact_root;
  const legacyArtifactRoot = path.join(repoRoot, LEGACY_ARTIFACT_ROOT);
  const currentRootEntry = lstatOrNull(currentArtifactRoot);
  const legacyRootEntry = lstatOrNull(legacyArtifactRoot);
  const currentRootExists = Boolean(currentRootEntry);
  const legacyRootExists = Boolean(legacyRootEntry);
  if (currentRootExists && legacyRootExists) {
    return blockedPlan(repoRoot, 'graphify-artifact-root-conflict');
  }
  if (legacyRootEntry && (legacyRootEntry.isSymbolicLink() || !legacyRootEntry.isDirectory())) {
    return blockedPlan(repoRoot, 'graphify-artifact-migration-path-unsafe');
  }
  const hasCurrent = currentArtifactRefs(repoRoot, currentArtifactRoot).length > 0;
  const hasLegacy = currentArtifactRefs(repoRoot, legacyArtifactRoot).length > 0;
  const pythonProvider = true;
  if (!currentRootExists && legacyRootExists) {
    actions.push({
      kind: 'migrate-artifact-root',
      command: null,
      args: [],
      from: LEGACY_ARTIFACT_ROOT,
      to: CURRENT_ARTIFACT_ROOT,
    });
  }
  if (context.refresh && (hasCurrent || hasLegacy)) {
    const graphifyOut = workspace === repoRoot
      ? null
      : (path.relative(workspace, resolved.artifact_root) || CURRENT_ARTIFACT_ROOT);
    actions.push({
      kind: 'refresh',
      command: 'graphify',
      args: ['update', workspace === repoRoot ? '.' : resolved.workspace_relative],
      ...(graphifyOut ? { graphify_out: graphifyOut } : {}),
    });
  } else if (!hasCurrent && !hasLegacy) {
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
    args: ['query', 'main'],
  });
  if (hookTarget.classification === 'project-contained') {
    actions.push({
      kind: 'ensure-hook',
      command: 'graphify',
      args: ['hook', 'status'],
      hook_root: hookTarget.root_relative,
      hook_names: [...GRAPHIFY_HOOK_NAMES],
    });
  } else if (hookTarget.classification === 'external') {
    nonActions.push('有效 Git hooks root 位于当前项目外；setup 不运行 Graphify hook 命令，也不读取或修改该目录。');
  } else if (hookTarget.classification === 'unsafe') {
    nonActions.push('项目内 hooks root 未通过 no-follow containment；setup 不运行 Graphify hook 命令。');
  } else if (hookTarget.classification === 'not-applicable') {
    nonActions.push('当前目录不是 Git 仓库；Graphify 自动刷新 hook 不适用。');
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
      ? 'Python Provider完整verified后，setup默认移除已确认归属@sentropic/graphify的全局npm incumbent与旧launcher symlink。'
      : null,
    mutation: true,
    blocked: false,
    reason_code: null,
    refresh: context.refresh === true,
    existing_artifact: hasCurrent,
    legacy_artifact: legacyRootExists,
    hook_target: publicGraphifyHookTarget(hookTarget),
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
  if (!context.dependency || context.dependency.ecosystem !== 'pypi') {
    return unsafeReadiness(context, repoRoot, 'graphify-python-provider-required');
  }
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
  const currentRootExists = Boolean(lstatOrNull(resolved.artifact_root));
  const legacyArtifactRoot = path.join(repoRoot, LEGACY_ARTIFACT_ROOT);
  const legacyRootEntry = lstatOrNull(legacyArtifactRoot);
  const legacyRootExists = Boolean(legacyRootEntry);
  const legacyRootUnsafe = Boolean(legacyRootEntry
    && (legacyRootEntry.isSymbolicLink() || !legacyRootEntry.isDirectory()));
  const rootConflict = currentRootExists && legacyRootExists;
  const artifactRefs = currentArtifactRefs(repoRoot, resolved.artifact_root);
  const hasCurrent = artifactRefs.length > 0;
  const pythonProvider = Boolean(context.dependency && context.dependency.ecosystem === 'pypi');
  const graphIntegrity = pythonProvider && hasCurrent
    ? inspectGraphIntegrity(resolved.artifact_root, hasSupportedCodeFile(repoRoot))
    : { ok: hasCurrent };
  const artifactUsable = hasCurrent && graphIntegrity.ok && !rootConflict && !legacyRootUnsafe;
  const query = installed && artifactUsable
    ? runGraphify(runtimeContext, ['query', 'main'], { cwd: repoRoot, timeoutMs: 30000 })
    : null;
  const queryVerified = Boolean(query && succeeded(query));
  const hookTarget = resolveGraphifyHookTarget(repoRoot);
  const hookOutcome = verifyGraphifyHookCapability(repoRoot, runtimeContext, hookTarget, installed, pythonProvider);
  const configured = isSpecFirstSourceRepo(repoRoot) || (pythonProvider
    ? pythonHostIntegrationConfigured(repoRoot, context.host, runtimeContext).ok
    : projectSkillConfigured(repoRoot, context.host));
  const nextActions = [];
  if (!installed) nextActions.push('运行 spec-runtime-setup --only graphify，安装 pinned Provider。');
  if (legacyRootUnsafe) nextActions.push('旧 .graphify 路径不是可迁移的 contained 实体目录；先由 owner 解析该路径，setup 不会跟随 symlink 或覆盖文件。');
  else if (rootConflict) nextActions.push('同时存在 .graphify/ 与 graphify-out/；先由 owner 解析 artifact root 冲突，setup 不会静默选择。');
  else if (legacyRootExists && !hasCurrent) nextActions.push('运行 spec-runtime-setup --only graphify，将旧 .graphify/ 原子迁移为 provider-native graphify-out/。');
  if (installed && hasCurrent && !queryVerified) nextActions.push('依赖 graph candidate 前，先运行真实的 Graphify query probe。');
  // KTD5a consume-side：仅当 spec-first 基线存在且 HEAD 已移动（图落后）时给 advisory；只读，不触发重建。
  if (hasCurrent && readSingleRepoGraphFreshness(repoRoot, resolved.artifact_root).state === 'head-moved') {
    nextActions.push('Graphify 图基线落后当前 HEAD：如需消费前的当轮 currentness，运行 spec-runtime-setup --only graphify --refresh；项目内/已验证的 commit-time hook 若在位会自动刷新。');
  }
  nextActions.push(...graphifyHookNextActions(hookOutcome));
  if (!configured) nextActions.push('重新运行显式 setup，修复 Graphify host integration。');
  if (hasCurrent && !graphIntegrity.ok) nextActions.push(`修复 ${graphIntegrity.reason_code} 后重新生成 graphify-out/。`);
  const degraded = installed && (legacyRootUnsafe || rootConflict || !configured || (hasCurrent && !graphIntegrity.ok)
    || (artifactUsable && !queryVerified));
  return providerResult(METADATA, {
    installed,
    configured,
    initialized: artifactUsable,
    indexed: artifactUsable,
    artifactExists: hasCurrent,
    queryVerified,
    serverReachable: false,
    readinessStatus: !installed ? 'not-run' : (degraded ? 'degraded' : 'unknown'),
    repoAligned: 'unknown',
    firstGenerationStatus: artifactUsable ? 'completed' : 'not-run',
    artifactRefs,
    limitations: graphifyProviderLimitations(
      runtimeContext,
      graphIntegrity,
      null,
      hookOutcome,
      legacyRootUnsafe ? 'graphify-artifact-migration-path-unsafe' : (rootConflict ? 'graphify-artifact-root-conflict' : null),
    ),
    nextActions,
    refreshMode: hookOutcome.refresh_mode,
    hookInstalled: hookOutcome.installed,
    hookVerified: hookOutcome.verified,
    hookStatus: hookOutcome.status,
    hookSkippedReason: hookOutcome.reason_code,
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
    assertGraphifyMutationSurfaces(repoRoot, context.host, actionPlan.artifact_root || path.join(repoRoot, CURRENT_ARTIFACT_ROOT), context.dependency && context.dependency.ecosystem);
  } catch (error) {
    return unsafeReadiness(context, repoRoot, error.reason_code || 'provider-mutation-surface-unsafe');
  }
  let fallbackUsed = false;
  let mutationFailure = null;
  const pythonProvider = true;
  const pathRepair = { status: 'report-only', reason_code: null };
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
      assertGraphifyMutationSurfaces(repoRoot, context.host, actionPlan.artifact_root || path.join(repoRoot, CURRENT_ARTIFACT_ROOT), context.dependency && context.dependency.ecosystem);
    } catch (error) {
      mutationFailure = error.reason_code || 'provider-mutation-surface-unsafe';
      break;
    }
    if (['verify-query', 'verify-hook', 'ensure-hook'].includes(action.kind)) continue;
    if (!['install-dependency', 'install-qoder-adapter', 'migrate-artifact-root'].includes(action.kind) && !runtimeContext.graphifyCommand) {
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
    } else if (action.kind === 'migrate-artifact-root') {
      const migrated = migrateArtifactRoot(repoRoot, action.from, action.to);
      if (!migrated.ok) mutationFailure = migrated.reason_code;
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
    } else if (action.kind === 'refresh') {
      const refresh = runGraphify(runtimeContext, action.args, {
        cwd: repoRoot,
        timeoutMs: 120000,
        ...(action.graphify_out ? { env: { GRAPHIFY_OUT: action.graphify_out } } : {}),
      });
      if (!succeeded(refresh)) mutationFailure = 'graphify-refresh-failed';
    }
    if (mutationFailure) break;
  }

  let queryVerified = false;
  try {
    assertGraphifyMutationSurfaces(repoRoot, context.host, actionPlan.artifact_root || path.join(repoRoot, CURRENT_ARTIFACT_ROOT), context.dependency && context.dependency.ecosystem);
  } catch (error) {
    mutationFailure = error.reason_code || 'provider-mutation-surface-unsafe';
  }
  const artifactRefs = currentArtifactRefs(repoRoot, actionPlan.artifact_root || path.join(repoRoot, CURRENT_ARTIFACT_ROOT));
  let graphIntegrity = null;
  if (!mutationFailure && pythonProvider && artifactRefs.length > 0) {
    const supportedCodePresent = hasSupportedCodeFile(actionPlan.requirement_workspace || repoRoot);
    graphIntegrity = inspectGraphIntegrity(actionPlan.artifact_root || path.join(repoRoot, CURRENT_ARTIFACT_ROOT), supportedCodePresent);
    if (!graphIntegrity.ok) mutationFailure = graphIntegrity.reason_code;
  }
  if (!mutationFailure && artifactRefs.length > 0) {
    queryVerified = succeeded(runGraphify(runtimeContext, ['query', 'main'], { cwd: repoRoot, timeoutMs: 30000 }));
  }
  const hookTarget = resolveGraphifyHookTarget(repoRoot);
  const hookOutcome = !mutationFailure
    ? applyGraphifyHookCapability(repoRoot, runtimeContext, hookTarget, pythonProvider)
    : defaultGraphifyHookOutcome(hookTarget);
  const hasArtifact = artifactRefs.length > 0;
  const generatedThisRun = !mutationFailure && (actionPlan.actions || []).some(
    (action) => ['first-generation', 'refresh'].includes(action.kind),
  );
  // KTD5a：spec-first 自己生成图时写单仓基线快照，供消费侧只读比对当前 HEAD。
  if (generatedThisRun && hasArtifact) writeSingleRepoGraphBaseline(repoRoot, path.join(repoRoot, CURRENT_ARTIFACT_ROOT));
  const configured = isSpecFirstSourceRepo(repoRoot) || (pythonProvider
    ? pythonHostIntegrationConfigured(repoRoot, context.host, runtimeContext).ok
    : projectSkillConfigured(repoRoot, context.host));
  if (!mutationFailure && !configured) mutationFailure = 'graphify-project-skill-post-probe-failed';
  let incumbentCleanup = { status: 'not-needed', reason_code: null };
  if (!mutationFailure && pythonProvider
    && (hookTarget.classification === 'not-applicable' || hookOutcome.verified)
    && runtimeContext.graphifyCollisionState === 'npm-incumbent') {
    incumbentCleanup = cleanupNpmGraphifyIncumbent(runtimeContext, repoRoot);
    if (!incumbentCleanup.ok) mutationFailure = incumbentCleanup.reason_code;
    else runtimeContext = { ...runtimeContext, graphifyCollisionState: 'none', graphifyOriginalPathCommand: null };
  }
  const degraded = Boolean(mutationFailure) || !hasArtifact || !queryVerified;
  const nextActions = [];
  if (mutationFailure) nextActions.push(`检查 ${mutationFailure} 的 Graphify diagnostic，并重新运行显式 setup。`);
  if (hasArtifact && !queryVerified) nextActions.push('依赖 graph candidate 前，先运行真实的 Graphify query probe。');
  nextActions.push(...graphifyHookNextActions(hookOutcome));
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
    readinessStatus: degraded ? 'degraded' : (generatedThisRun ? 'fresh' : 'unknown'),
    repoAligned: 'unknown',
    firstGenerationStatus: hasArtifact ? 'completed' : (mutationFailure ? 'failed' : 'not-run'),
    requirementWorkspacePath: actionPlan.requirement_workspace_path || null,
    artifactRefs,
    limitations: mutationFailure
      ? [providerLimitation('failed', mutationFailure, 'Graphify setup 失败。')]
      : graphifyProviderLimitations(runtimeContext, graphIntegrity, incumbentCleanup, hookOutcome),
    nextActions,
    refreshMode: hookOutcome.refresh_mode,
    hookInstalled: hookOutcome.installed,
    hookVerified: hookOutcome.verified,
    hookStatus: hookOutcome.status,
    hookSkippedReason: hookOutcome.reason_code,
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
      nextActions: ['使用 spec-runtime-setup --only graphify --refresh 重新运行。'],
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
      '没有独立的显式移除 contract 时，setup 不会删除 graphify-out/、Provider 安装的 project skill、instruction 或 git hook。',
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

function resolveGraphifyHookTarget(repoRoot) {
  const resolved = resolveGitPath(repoRoot, 'hooks');
  if (!resolved.ok) {
    if (resolved.reason_code === 'not-a-git-repo') {
      return {
        classification: 'not-applicable',
        reason_code: 'not-a-git-repo',
      };
    }
    return {
      classification: 'unsafe',
      reason_code: 'graphify-hook-path-resolve-failed',
    };
  }
  if (!isPathWithin(resolved.absolute, repoRoot)) {
    return {
      classification: 'external',
      reason_code: 'graphify-hook-path-outside-project',
      // 仅供 external 只读 marker 验证（R3/KTD2）；publicGraphifyHookTarget 不暴露此绝对路径。
      absolute: resolved.absolute,
    };
  }
  try {
    const absolute = assertContainedPath(repoRoot, resolved.absolute, {
      reasonCode: 'graphify-hook-symlink-escape',
    });
    return {
      classification: 'project-contained',
      reason_code: null,
      absolute,
      root_relative: relativeRef(repoRoot, absolute) || '.',
    };
  } catch (error) {
    return {
      classification: 'unsafe',
      reason_code: error.reason_code || 'graphify-hook-symlink-escape',
    };
  }
}

function publicGraphifyHookTarget(target) {
  if (target.classification === 'project-contained') {
    return {
      classification: target.classification,
      reason_code: null,
      root_relative: target.root_relative,
      hook_names: [...GRAPHIFY_HOOK_NAMES],
    };
  }
  return {
    classification: target.classification,
    reason_code: target.reason_code,
  };
}

function defaultGraphifyHookOutcome(target) {
  if (target.classification === 'not-applicable') {
    return {
      installed: false,
      verified: false,
      status: 'skipped',
      reason_code: target.reason_code,
      refresh_mode: 'manual-only',
    };
  }
  if (target.classification !== 'project-contained') {
    return {
      installed: false,
      verified: false,
      status: 'blocked',
      reason_code: target.reason_code,
      refresh_mode: 'manual-only',
    };
  }
  return {
    installed: false,
    verified: false,
    status: 'unknown',
    reason_code: null,
    refresh_mode: 'manual-only',
  };
}

function probeExternalGraphifyHookMarker(hooksRoot) {
  // 只读验证（R3/KTD2）：仅读取有效 hooks root 下的 post-commit / post-checkout 两个文件，
  // 只检测 Graphify managed marker 是否存在。绝不 execute、write、`graphify hook status`，
  // 不读其他文件；非普通文件（symlink/目录）无法证明 project-owned，按未命中处理，避免 follow-out。
  const detected = { post_commit: false, post_checkout: false };
  for (const name of GRAPHIFY_HOOK_NAMES) {
    const file = path.join(hooksRoot, name);
    try {
      const stat = fs.lstatSync(file);
      if (!stat.isFile()) continue;
      if (fs.readFileSync(file, 'utf8').includes(GRAPHIFY_HOOK_MARKER)) {
        if (name === 'post-commit') detected.post_commit = true;
        else if (name === 'post-checkout') detected.post_checkout = true;
      }
    } catch (_error) {
      // 文件缺失或不可读 → 未命中；只读探测绝不抛到外部。
    }
  }
  detected.any = detected.post_commit || detected.post_checkout;
  return detected;
}

function externalGraphifyHookOutcome(target) {
  const marker = target && target.absolute
    ? probeExternalGraphifyHookMarker(target.absolute)
    : { any: false };
  if (marker.any) {
    // 只读确认有效 hooks root（项目外）存在 Graphify commit hook。
    // KTD3：verified-external ≠ project-owned verified；hook_installed/hook_verified 保持 false，
    // external hook execution 由 Git 负责、未经 spec-first 结构验证。
    return {
      installed: false,
      verified: false,
      status: 'verified-external',
      reason_code: 'graphify-hook-external-verified',
      refresh_mode: 'commit-hook-external-verified',
    };
  }
  return {
    installed: false,
    verified: false,
    status: 'blocked',
    reason_code: 'graphify-hook-path-outside-project',
    refresh_mode: 'manual-only',
  };
}

function graphifyHookTargetMatches(repoRoot, expectedRoot) {
  const current = resolveGraphifyHookTarget(repoRoot);
  return current.classification === 'project-contained'
    && path.resolve(current.absolute) === path.resolve(expectedRoot);
}

function runProjectGraphifyHookCommand(runtimeContext, repoRoot, hooksRoot, args, timeoutMs) {
  if (!graphifyHookTargetMatches(repoRoot, hooksRoot)) {
    return { ok: false, reason_code: 'graphify-hook-target-changed' };
  }
  const result = runGraphify(runtimeContext, args, {
    cwd: repoRoot,
    timeoutMs,
    env: {
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'core.hooksPath',
      GIT_CONFIG_VALUE_0: hooksRoot,
    },
  });
  if (!graphifyHookTargetMatches(repoRoot, hooksRoot)) {
    return { ok: false, reason_code: 'graphify-hook-target-changed' };
  }
  return { ok: true, result };
}

function blockedGraphifyHookOutcome(reasonCode) {
  return {
    installed: false,
    verified: false,
    status: 'blocked',
    reason_code: reasonCode,
    refresh_mode: 'manual-only',
  };
}

function failedGraphifyHookOutcome(reasonCode, installed = false) {
  return {
    installed,
    verified: false,
    status: installed ? 'installed' : 'failed',
    reason_code: reasonCode,
    refresh_mode: 'manual-only',
  };
}

function verifyGraphifyHookCapability(repoRoot, runtimeContext, target, installed, pythonProvider) {
  // 项目外有效 hooks root：只读验证 commit hook 是否携带 Graphify marker（R3），
  // 无论 provider 是否安装都可报告 verified-external / blocked；绝不 execute/write/status。
  if (target.classification === 'external') return externalGraphifyHookOutcome(target);
  const outcome = defaultGraphifyHookOutcome(target);
  if (!installed || target.classification !== 'project-contained') return outcome;
  const hook = runProjectGraphifyHookCommand(runtimeContext, repoRoot, target.absolute, ['hook', 'status'], 30000);
  if (!hook.ok) return blockedGraphifyHookOutcome(hook.reason_code);
  if (!succeeded(hook.result)) return failedGraphifyHookOutcome('graphify-hook-status-failed');
  const structural = pythonProvider
    ? verifyPythonGraphifyHooks(repoRoot, runtimeContext, target.absolute)
    : { ok: true, reason_code: null };
  return structural.ok
    ? {
      installed: true,
      verified: true,
      status: 'verified',
      reason_code: null,
      refresh_mode: METADATA.steady_state.refresh_mode,
    }
    : failedGraphifyHookOutcome(structural.reason_code, true);
}

function applyGraphifyHookCapability(repoRoot, runtimeContext, target, pythonProvider) {
  if (target.classification === 'external') return externalGraphifyHookOutcome(target);
  if (target.classification !== 'project-contained') return defaultGraphifyHookOutcome(target);
  const hooksRoot = target.absolute;
  let hookInstalled = false;
  let hook = runProjectGraphifyHookCommand(runtimeContext, repoRoot, hooksRoot, ['hook', 'status'], 30000);
  if (!hook.ok) return blockedGraphifyHookOutcome(hook.reason_code);
  const pythonHooksMissing = pythonProvider
    ? !pythonHookMarkersPresent(repoRoot, hooksRoot)
    : false;
  const pythonHookProbe = pythonProvider && !pythonHooksMissing
    ? verifyPythonGraphifyHooks(repoRoot, runtimeContext, hooksRoot)
    : { ok: false, reason_code: 'graphify-provider-hook-not-found' };
  const pythonHooksNeedReinstall = pythonProvider
    && pythonHookProbe.reason_code === 'graphify-hook-interpreter-stale';
  if (pythonHooksNeedReinstall) {
    const uninstall = runProjectGraphifyHookCommand(runtimeContext, repoRoot, hooksRoot, ['hook', 'uninstall'], 60000);
    if (!uninstall.ok) return blockedGraphifyHookOutcome(uninstall.reason_code);
    if (!succeeded(uninstall.result)) return failedGraphifyHookOutcome('graphify-hook-uninstall-failed');
    const install = runProjectGraphifyHookCommand(runtimeContext, repoRoot, hooksRoot, ['hook', 'install'], 60000);
    if (!install.ok) return blockedGraphifyHookOutcome(install.reason_code);
    hookInstalled = succeeded(install.result);
    if (!hookInstalled) return failedGraphifyHookOutcome('graphify-hook-install-failed');
  } else if (!succeeded(hook.result) || pythonHooksMissing) {
    const install = runProjectGraphifyHookCommand(runtimeContext, repoRoot, hooksRoot, ['hook', 'install'], 60000);
    if (!install.ok) return blockedGraphifyHookOutcome(install.reason_code);
    hookInstalled = succeeded(install.result);
    if (!hookInstalled) return failedGraphifyHookOutcome('graphify-hook-install-failed');
  }
  if (!succeeded(hook.result) && !hookInstalled) {
    return failedGraphifyHookOutcome('graphify-hook-status-failed');
  }
  if (!graphifyHookTargetMatches(repoRoot, hooksRoot)) {
    return blockedGraphifyHookOutcome('graphify-hook-target-changed');
  }
  try {
    if (pythonProvider) normalizePythonGraphifyHooks(repoRoot, runtimeContext, hooksRoot);
  } catch (error) {
    return failedGraphifyHookOutcome(error.reason_code || 'graphify-hook-path-repair-failed', hookInstalled || succeeded(hook.result));
  }
  hook = runProjectGraphifyHookCommand(runtimeContext, repoRoot, hooksRoot, ['hook', 'status'], 30000);
  if (!hook.ok) return blockedGraphifyHookOutcome(hook.reason_code);
  const structural = pythonProvider
    ? verifyPythonGraphifyHooks(repoRoot, runtimeContext, hooksRoot)
    : { ok: true, reason_code: null };
  const verified = succeeded(hook.result) && structural.ok;
  return verified
    ? {
      installed: true,
      verified: true,
      status: 'verified',
      reason_code: null,
      refresh_mode: METADATA.steady_state.refresh_mode,
    }
    : failedGraphifyHookOutcome(
      succeeded(hook.result) ? structural.reason_code : 'graphify-hook-status-failed',
      hookInstalled || succeeded(hook.result),
    );
}

// 单仓 consume-side 新鲜度（R10/R11/KTD5a）：spec-first 只在自己生成图时写基线快照；
// 消费侧只读比对当前 HEAD，产出 advisory 事实，绝不触发重建。external/native hook 刷新的图
// 无基线时降级 no-baseline，沿用 verify() 既有 unknown 诚实信号。
const SINGLE_REPO_GRAPH_BASELINE = 'spec-first-graph-baseline.json';

function readGitHeadSha(repoRoot) {
  const result = spawnSync('git', ['-C', path.resolve(repoRoot), 'rev-parse', 'HEAD'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000, windowsHide: true,
  });
  if (result.error || result.status !== 0) return null;
  return String(result.stdout || '').trim() || null;
}

function writeSingleRepoGraphBaseline(repoRoot, artifactRoot) {
  try {
    const head = readGitHeadSha(repoRoot);
    if (!head) return;
    ensureContainedDirectory(repoRoot, artifactRoot, { reasonCode: 'graphify-baseline-symlink-escape' });
    const target = assertContainedPath(repoRoot, path.join(artifactRoot, SINGLE_REPO_GRAPH_BASELINE), {
      reasonCode: 'graphify-baseline-symlink-escape',
    });
    fs.writeFileSync(target, `${JSON.stringify({ schema_version: 'graphify-single-repo-baseline.v1', head_sha: head }, null, 2)}\n`, 'utf8');
  } catch (_error) {
    // 基线是 advisory；写失败绝不阻塞核心 setup。
  }
}

function readSingleRepoGraphFreshness(repoRoot, artifactRoot) {
  try {
    const target = path.join(artifactRoot, SINGLE_REPO_GRAPH_BASELINE);
    if (!fs.existsSync(target)) return { state: 'no-baseline' };
    const baseline = JSON.parse(fs.readFileSync(target, 'utf8'));
    const head = readGitHeadSha(repoRoot);
    if (!head || !baseline || !baseline.head_sha) return { state: 'unknown' };
    return { state: head === baseline.head_sha ? 'reflects-head' : 'head-moved' };
  } catch (_error) {
    return { state: 'unknown' };
  }
}

function graphifyHookNextActions(outcome) {
  if (!outcome || outcome.verified) return [];
  if (outcome.status === 'verified-external') {
    return [
      'commit-time 自动刷新已只读验证：有效 Git hooks root（项目外）存在 Graphify commit hook，其执行由 Git 负责、未经 spec-first 结构验证；核心图查询可正常使用，图内容仍需回源确认。',
    ];
  }
  if (outcome.status === 'blocked' && outcome.reason_code === 'graphify-hook-path-outside-project') {
    return [
      '可选 commit-time 自动刷新未检测到：有效 Git hooks root（项目外）未见 Graphify commit hook，setup 不读取其余内容、也不写入外部 hook。若要启用，只有仓库 owner 确认不会绕过现有 commit-msg/pre-commit/pre-push 等策略后，可在项目内设置 core.hooksPath 并运行 spec-runtime-setup --only graphify（安装只写项目内路径），或自行在其全局 hook 中加入 graphify。核心图查询不受影响。',
    ];
  }
  if (outcome.status === 'blocked' && outcome.reason_code === 'graphify-hook-target-changed') {
    return ['Git hooks root 在 hook 操作期间发生变化；setup 已停止 normalize、cleanup 和 verified claim，请确认项目 Git 配置后重试。'];
  }
  if (outcome.status === 'blocked') {
    return ['Graphify project-local hook 未通过路径安全检查；未修改 Git hook 策略，稳态刷新使用显式 --refresh。'];
  }
  if (outcome.status === 'skipped') {
    return ['当前目录没有可用的 project-local Git hook；Graphify 稳态刷新使用显式 --refresh。'];
  }
  return ['Project-local Graphify 自动刷新未验证；如需该增强可重新运行显式 setup，核心图查询不受影响。'];
}

function resolveGraphifyCommand(context, repoRoot) {
  return resolvePythonGraphifyCommand(context, repoRoot, context.dependency);
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
  const managedEnvironment = resolveManagedToolEnvironment(context, repoRoot, manager.kind, dependency.package);
  if (managedEnvironment && isExecutableCommandFile(managedEnvironment.launcher, windows)
    && !candidates.includes(managedEnvironment.launcher)) candidates.push(managedEnvironment.launcher);
  let mismatch = false;
  const managedInterpreter = managedEnvironment && managedEnvironment.interpreter;
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
      && fs.existsSync(staged) && inspectGraphIntegrity(staged, { status: 'absent', reason_code: 'migration-staged-artifact' }).ok) {
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

function migrateArtifactRoot(repoRoot, fromRelative, toRelative) {
  if (fromRelative !== LEGACY_ARTIFACT_ROOT || toRelative !== CURRENT_ARTIFACT_ROOT) {
    return { ok: false, reason_code: 'graphify-artifact-migration-path-invalid' };
  }
  const source = path.join(repoRoot, fromRelative);
  const target = path.join(repoRoot, toRelative);
  try {
    assertContainedPath(repoRoot, source, { reasonCode: 'graphify-artifact-migration-path-unsafe' });
    assertContainedPath(repoRoot, target, { reasonCode: 'graphify-artifact-migration-path-unsafe' });
    if (!fs.existsSync(source)) return { ok: false, reason_code: 'graphify-legacy-artifact-missing' };
    if (fs.lstatSync(source).isSymbolicLink() || !fs.lstatSync(source).isDirectory()) {
      return { ok: false, reason_code: 'graphify-artifact-migration-path-unsafe' };
    }
    if (fs.existsSync(target)) return { ok: false, reason_code: 'graphify-artifact-root-conflict' };
    fs.renameSync(source, target);
    return { ok: true, migrated: true };
  } catch (error) {
    return {
      ok: false,
      reason_code: error.reason_code || 'graphify-artifact-migration-failed',
    };
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

function inspectGraphIntegrity(artifactRoot, supportedCodeFact = { status: 'present', reason_code: null }) {
  const graphPath = path.join(artifactRoot, 'graph.json');
  if (!fs.existsSync(graphPath)) return { ok: false, reason_code: 'graphify-artifact-missing' };
  const sourceFact = typeof supportedCodeFact === 'boolean'
    ? { status: supportedCodeFact ? 'present' : 'absent', reason_code: null }
    : supportedCodeFact;
  if (!sourceFact || !['present', 'absent'].includes(sourceFact.status)) {
    return {
      ok: false,
      reason_code: sourceFact && sourceFact.reason_code
        ? sourceFact.reason_code
        : 'graphify-source-scan-unavailable',
      source_scan_status: 'unknown',
    };
  }
  const supportedCodePresent = sourceFact.status === 'present';
  try {
    const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
    const nodes = Array.isArray(graph.nodes) ? graph.nodes.length : null;
    if (nodes === null) return { ok: false, reason_code: 'graphify-artifact-contract-mismatch' };
    if (nodes === 0 && supportedCodePresent) return { ok: false, reason_code: 'graphify-extract-integrity-failed' };
    return {
      ok: true,
      node_count: nodes,
      supported_code_present: supportedCodePresent,
      source_scan_status: sourceFact.status,
      empty_corpus: sourceFact.status === 'absent',
    };
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
      return { status: 'unknown', reason_code: 'graphify-source-scan-unavailable' };
    }
    if (item.isSymbolicLink()) return { status: 'absent', reason_code: null };
    if (item.isDirectory()) {
      if (['.git', '.graphify', 'graphify-out', 'node_modules', 'vendor', '.spec-first', '.claude', '.codex', '.cursor', '.kiro', '.qoder', '.agents'].includes(path.basename(current))) {
        return { status: 'absent', reason_code: null };
      }
      let names;
      try {
        names = fs.readdirSync(current);
      } catch (_error) {
        return { status: 'unknown', reason_code: 'graphify-source-scan-unavailable' };
      }
      let unknown = null;
      for (const name of names) {
        const result = visit(path.join(current, name));
        if (result.status === 'present') return result;
        if (result.status === 'unknown') unknown = result;
      }
      return unknown || { status: 'absent', reason_code: null };
    } else if (item.isFile() && supported.has(path.extname(current).toLowerCase())) {
      return { status: 'present', reason_code: null };
    }
    return { status: 'absent', reason_code: null };
  };
  return visit(workspace);
}

function pythonProviderLimitations(runtimeContext, graphIntegrity, incumbentCleanup) {
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
  if (incumbentCleanup && incumbentCleanup.status === 'removed') {
    limitations.push(`migration cleanup: 已移除 ${incumbentCleanup.package}@${incumbentCleanup.version} 与确认归属该package的旧launcher symlink。`);
  }
  return limitations;
}

function graphifyProviderLimitations(runtimeContext, graphIntegrity, incumbentCleanup, hookOutcome, readinessFailureReason = null) {
  const limitations = pythonProviderLimitations(runtimeContext, graphIntegrity, incumbentCleanup) || [];
  if (readinessFailureReason) {
    limitations.push(providerLimitation(
      'degraded',
      readinessFailureReason,
      'Graphify artifact root 不满足唯一、contained、真实目录约束；setup 已 fail closed。',
    ));
  }
  if (hookOutcome && hookOutcome.status === 'blocked') {
    limitations.push(providerLimitation(
      'blocked',
      hookOutcome.reason_code,
      '项目外或不安全的 Git hook 策略未被修改；Graphify 核心图查询仍可用，自动刷新降级为 manual-only。',
    ));
  } else if (hookOutcome && hookOutcome.status === 'skipped') {
    limitations.push(providerLimitation(
      'skipped',
      hookOutcome.reason_code,
      '当前项目没有可用的 project-local Git hook；Graphify 稳态刷新使用显式命令。',
    ));
  } else if (hookOutcome && hookOutcome.status === 'verified-external') {
    limitations.push(providerLimitation(
      'verified-external',
      hookOutcome.reason_code || 'graphify-hook-external-verified',
      'commit-time 自动刷新已只读验证：项目外 Git hooks root 存在 Graphify commit hook；其执行未经 spec-first 结构验证，图内容仍需回源确认。',
    ));
  } else if (hookOutcome && !hookOutcome.verified) {
    limitations.push(providerLimitation(
      'degraded',
      hookOutcome.reason_code || 'graphify-project-hook-not-verified',
      'Project-local Graphify 自动刷新未验证；Graphify 核心图查询仍可用。',
    ));
  }
  return limitations.length > 0 ? limitations : undefined;
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

function resolveManagedToolEnvironment(context, repoRoot, manager, packageName) {
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
  const interpreterCandidates = windows
    ? [pathApi.join(environmentRoot, 'Scripts', 'python.exe'), pathApi.join(environmentRoot, 'python.exe')]
    : [pathApi.join(environmentRoot, 'bin', 'python')];
  const launcherCandidates = windows
    ? [pathApi.join(environmentRoot, 'Scripts', 'graphify.exe'), pathApi.join(environmentRoot, 'Scripts', 'graphify.cmd')]
    : [pathApi.join(environmentRoot, 'bin', 'graphify')];
  return {
    root: environmentRoot,
    interpreter: interpreterCandidates.find((candidate) => fs.existsSync(candidate)) || interpreterCandidates[0] || null,
    launcher: launcherCandidates.find((candidate) => fs.existsSync(candidate)) || launcherCandidates[0] || null,
  };
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
  const payload = parseJsonStdout(result);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
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

function parseJsonStdout(result) {
  try {
    return JSON.parse(String(result && result.stdout ? result.stdout : ''));
  } catch (_error) {
    return null;
  }
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
    if (key === 'GRAPHIFY_OUT'
      || allowed.includes(key)
      || key === 'GIT_CONFIG_COUNT'
      || /^GIT_CONFIG_(?:KEY|VALUE)_\d+$/.test(key)) {
      env[key] = value;
    }
  }
  return env;
}

function cleanupNpmGraphifyIncumbent(context, repoRoot) {
  const packageName = '@sentropic/graphify';
  const list = run(context, 'npm', ['list', '-g', packageName, '--depth=0', '--json'], {
    cwd: repoRoot,
    timeoutMs: 30000,
    env: graphifyProcessEnv(context),
    inheritEnv: false,
  });
  if (!succeeded(list)) return { ok: false, status: 'failed', reason_code: 'graphify-npm-incumbent-identity-unverified' };
  const payload = parseJsonStdout(list);
  const installedVersion = payload && payload.dependencies && payload.dependencies[packageName]
    ? payload.dependencies[packageName].version
    : '';
  if (!installedVersion) return { ok: false, status: 'failed', reason_code: 'graphify-npm-incumbent-identity-unverified' };
  const rootResult = run(context, 'npm', ['root', '-g'], {
    cwd: repoRoot,
    timeoutMs: 10000,
    env: graphifyProcessEnv(context),
    inheritEnv: false,
  });
  const npmRoot = succeeded(rootResult) ? firstAbsoluteLine(text(rootResult)) : null;
  if (!npmRoot) return { ok: false, status: 'failed', reason_code: 'graphify-npm-incumbent-root-unverified' };
  const packageRoot = path.resolve(npmRoot, '@sentropic', 'graphify');
  if (!fs.existsSync(packageRoot)) return { ok: false, status: 'failed', reason_code: 'graphify-npm-incumbent-root-unverified' };
  const packageRealpath = fs.realpathSync.native(packageRoot);
  const originalCommand = context.graphifyOriginalPathCommand;
  let originalRealpath;
  try {
    originalRealpath = originalCommand ? fs.realpathSync.native(originalCommand) : null;
  } catch (_error) {
    return { ok: false, status: 'failed', reason_code: 'graphify-npm-incumbent-launcher-unverified' };
  }
  if (!originalRealpath || !isPathWithin(originalRealpath, packageRealpath)) {
    return { ok: false, status: 'failed', reason_code: 'graphify-npm-incumbent-launcher-unverified' };
  }
  const staleLinks = [];
  const homeDir = path.resolve(context.homeDir || os.homedir());
  for (const name of ['graphify', 'graphify.cmd', 'graphify.exe']) {
    const candidate = path.join(homeDir, '.local', 'bin', name);
    const item = lstatOrNull(candidate);
    if (!item || !item.isSymbolicLink()) continue;
    try {
      const realpath = fs.realpathSync.native(candidate);
      if (isPathWithin(realpath, packageRealpath)) staleLinks.push({ path: candidate, target: fs.readlinkSync(candidate) });
    } catch (_error) {
      return { ok: false, status: 'failed', reason_code: 'graphify-npm-incumbent-symlink-unverified' };
    }
  }
  const removed = run(context, 'npm', ['uninstall', '-g', packageName], {
    cwd: repoRoot,
    timeoutMs: 120000,
    env: graphifyProcessEnv(context),
    inheritEnv: false,
  });
  if (!succeeded(removed)) return { ok: false, status: 'failed', reason_code: 'graphify-npm-incumbent-uninstall-failed' };
  for (const stale of staleLinks) {
    const item = lstatOrNull(stale.path);
    if (!item) continue;
    if (!item.isSymbolicLink() || fs.readlinkSync(stale.path) !== stale.target) {
      return { ok: false, status: 'failed', reason_code: 'graphify-npm-incumbent-symlink-changed' };
    }
    fs.rmSync(stale.path);
  }
  return {
    ok: true,
    status: 'removed',
    reason_code: 'graphify-npm-incumbent-removed',
    package: packageName,
    version: installedVersion,
    removed_symlinks: staleLinks.map((entry) => entry.path),
  };
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

function graphifyPathVisibilityAction(runtimeContext, pathRepair) {
  if (!runtimeContext.graphifyCommand || runtimeContext.graphifyOnOriginalPath === true) return null;
  if (pathRepair && pathRepair.status === 'repaired') return null;
  const command = runtimeContext.graphifyCommand;
  if (runtimeContext.graphifyCollisionState === 'npm-incumbent') {
    return '重新运行Graphify mutation setup；Python Provider完整verified后会清理已确认归属npm incumbent的全局package与旧launcher symlink。';
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
    : CURRENT_ARTIFACT_ROOT;
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
    '本项目在 Graphify 原生默认目录 graphify-out/ 中维护 knowledge graph，包含 god node、community structure 与跨文件关系。',
    '',
  ];
  if (host !== 'claude') {
    lines.push('当用户输入 `/graphify` 时，先调用 `skill` 工具并设置 `skill: "graphify"`，再执行其他操作。', '');
  }
  lines.push(
    '规则：',
    '- 当 `graphify-out/graph.json` 存在且 runtime 可见 Graphify CLI 时，将 Graphify 用作 architecture relationship、impact analysis 与宽范围 codebase navigation 的 exploration-tier 定向工具。直接使用 Provider 原生命令：用 `graphify query "<question>"` 做宽范围定向，用 `graphify path "<A>" "<B>"` 查看关系，用 `graphify explain "<concept>"` 聚焦概念。',
    '- 简单事实问答、当前上下文总结、用户提供的单文档工作或已限定范围的文件读取，默认不使用 Graphify；使用 `rg` 或 bounded source read。',
    '- 如果 `graphify-out/graph.json` 存在但 Graphify CLI 不可见，不得把 artifact 当作 runtime readiness。改用 bounded direct source read，并将 `spec-runtime-setup --only graphify` 作为修复路径。',
    '- Hook 或 incremental update 后 `graphify-out/` 出现 dirty 文件属于预期现象，不能仅因此跳过 Graphify。',
    '- 如果 `graphify-out/wiki/index.md` 存在，用它进行宽范围导航。只有 query/path/explain 未提供足够上下文时，才读取 `graphify-out/GRAPH_REPORT.md`。',
    '- `.graphify/` 是 spec-first 旧版适配目录，只作 migration evidence；运行 `spec-runtime-setup --only graphify` 将其原子迁移为唯一 current artifact `graphify-out/`。',
    '- 将 Graphify/code-graph 输出视为 `provider_untrusted` advisory navigation；重要结论必须由 source、test、log、contract 或 owner evidence 确认。',
    '- 普通 workflow 不会在代码变更后刷新 project graph。仅在显式 refresh 时运行 `spec-runtime-setup --only graphify --refresh`。',
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
    const next = current.replaceAll('.graphify/', 'graphify-out/').replaceAll('at .graphify', 'at graphify-out');
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

// Graphify host hooks (provider-native):
// - legacy / Codex-shaped: `<launcher> hook-check` (exactly one was historical)
// - graphifyy 0.9.12 Claude: `<launcher> hook-guard search` + `<launcher> hook-guard read`
//   (two PreToolUse matchers). Spec-first rewrites only the launcher path and keeps
//   the provider-owned verb/mode; it never collapses multi-entry 0.9.12 shapes to 1.
const GRAPHIFY_HOST_HOOK_VERBS = new Set(['hook-check', 'hook-guard']);
const GRAPHIFY_HOST_HOOK_GUARD_MODES = new Set(['search', 'read']);

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
    if (key !== 'command' || typeof value !== 'string') return value;
    if (!/\bhook-(?:check|guard)\b/.test(value)) return value;
    const parsedCommand = parseGraphifyHostHookCommand(value);
    if (!parsedCommand || !isGraphifyLauncherBasename(parsedCommand.launcher)) {
      throw graphifySafetyError('graphify-host-hook-command-unexpected', `拒绝修改 unexpected Graphify host hook command：${value}`);
    }
    matches += 1;
    return renderGraphifyHostHookCommand(launcher, parsedCommand.verb, parsedCommand.mode);
  };
  const normalized = { ...parsed, hooks: visit(parsed.hooks) };
  if (matches < 1) {
    throw graphifySafetyError(
      'graphify-host-hook-cardinality-invalid',
      'Graphify host hook entry 至少出现一次（hook-check 或 hook-guard）。',
    );
  }
  const next = `${JSON.stringify(normalized, null, 2)}\n`;
  if (next !== fs.readFileSync(target, 'utf8')) writeContainedText(repoRoot, target, next, 'graphify-project-surface-symlink-escape');
}

function renderHookCheckCommand(launcher) {
  return renderGraphifyHostHookCommand(launcher, 'hook-check', null);
}

function renderGraphifyHostHookCommand(launcher, verb, mode) {
  const quoted = quoteGraphifyLauncher(launcher);
  if (verb === 'hook-guard') {
    const guardMode = mode && GRAPHIFY_HOST_HOOK_GUARD_MODES.has(mode) ? mode : 'search';
    return `${quoted} hook-guard ${guardMode}`;
  }
  return `${quoted} hook-check`;
}

function quoteGraphifyLauncher(launcher) {
  if (path.win32.isAbsolute(launcher) && !path.isAbsolute(launcher)) {
    return `"${String(launcher).replaceAll('"', '\\"')}"`;
  }
  return `'${String(launcher).replaceAll("'", "'\\''")}'`;
}

function isGraphifyLauncherBasename(commandLauncher) {
  if (!commandLauncher) return false;
  const basename = (path.win32.isAbsolute(commandLauncher) && !path.isAbsolute(commandLauncher)
    ? path.win32.basename(commandLauncher)
    : path.basename(commandLauncher)).replace(/\.(?:exe|cmd)$/i, '');
  return basename === 'graphify';
}

// Returns { launcher, verb, mode } for graphify host-hook commands, else null.
// Supports: `… hook-check` and `… hook-guard <search|read>` (graphifyy 0.9.12+).
function parseGraphifyHostHookCommand(command) {
  const match = String(command).match(
    /^(?:'([^']*)'|"((?:[^"\\]|\\.)*)"|(\S+))\s+(hook-check|hook-guard)(?:\s+(\S+))?$/,
  );
  if (!match) return null;
  const launcher = match[1] !== undefined
    ? match[1]
    : (match[2] !== undefined ? match[2].replace(/\\(["\\])/g, '$1') : match[3]);
  const verb = match[4];
  if (!GRAPHIFY_HOST_HOOK_VERBS.has(verb)) return null;
  const mode = match[5] || null;
  if (verb === 'hook-guard') {
    if (!mode || !GRAPHIFY_HOST_HOOK_GUARD_MODES.has(mode)) return null;
  } else if (mode) {
    return null;
  }
  return { launcher, verb, mode };
}

function parseHookCheckLauncher(command) {
  const parsed = parseGraphifyHostHookCommand(command);
  return parsed ? parsed.launcher : null;
}

function pythonHostIntegrationConfigured(repoRoot, host, runtimeContext) {
  if (host === 'qoder') {
    const adapter = path.join(repoRoot, '.qoder', 'rules', 'spec-first.md');
    if (!fs.existsSync(adapter)) return { ok: false, reason_code: 'graphify-qoder-adapter-missing' };
    const contents = fs.readFileSync(adapter, 'utf8');
    return contents.includes('graphify-out/') && contents.includes('graphify')
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
    if (/knowledge graph at \.graphify|Read \.graphify\/graph|first run \.graphify/i.test(contents)) {
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
    if (targets.some((target) => fs.readFileSync(target, 'utf8').includes('.graphify/'))) {
      return { ok: false, reason_code: 'graphify-host-artifact-contract-mismatch' };
    }
  }
  if (host === 'claude' || host === 'codex') {
    const configPath = path.join(repoRoot, host === 'claude' ? '.claude/settings.json' : '.codex/hooks.json');
    if (!runtimeContext.graphifyCommand
      || !(path.isAbsolute(runtimeContext.graphifyCommand) || path.win32.isAbsolute(runtimeContext.graphifyCommand))) {
      return { ok: false, reason_code: 'graphify-host-launcher-mismatch' };
    }
    let hooks;
    try {
      hooks = graphifyHostHookEntries(JSON.parse(fs.readFileSync(configPath, 'utf8')));
    } catch (_error) {
      return { ok: false, reason_code: 'graphify-host-hook-config-invalid' };
    }
    if (hooks.length < 1) {
      return { ok: false, reason_code: 'graphify-host-launcher-mismatch' };
    }
    // Every graphify host-hook entry must use the verified launcher. Verb/mode stay
    // provider-owned (hook-check vs hook-guard search|read).
    const expectedLauncher = runtimeContext.graphifyCommand;
    const allLaunchersMatch = hooks.every((entry) => entry.launcher === expectedLauncher);
    if (!allLaunchersMatch) {
      return { ok: false, reason_code: 'graphify-host-launcher-mismatch' };
    }
  }
  return { ok: true, mode: 'provider-native' };
}

function graphifyHostHookCommands(parsed) {
  return graphifyHostHookEntries(parsed).map((entry) => entry.command);
}

function graphifyHostHookEntries(parsed) {
  const entries = [];
  const events = parsed && parsed.hooks && Array.isArray(parsed.hooks.PreToolUse)
    ? parsed.hooks.PreToolUse
    : [];
  for (const event of events) {
    const hooks = event && Array.isArray(event.hooks) ? event.hooks : [];
    for (const entry of hooks) {
      if (!(entry && entry.type === 'command' && typeof entry.command === 'string')) continue;
      const parsedCommand = parseGraphifyHostHookCommand(entry.command);
      if (!parsedCommand) continue;
      entries.push({
        command: entry.command,
        launcher: parsedCommand.launcher,
        verb: parsedCommand.verb,
        mode: parsedCommand.mode,
      });
    }
  }
  return entries;
}

function normalizePythonGraphifyHooks(repoRoot, runtimeContext, hooksRoot = path.join(repoRoot, '.git', 'hooks')) {
  if (!runtimeContext.graphifyCommand || !path.isAbsolute(runtimeContext.graphifyCommand)) {
    throw graphifySafetyError('graphify-hook-launcher-ambiguous', 'Python Graphify hook normalization 需要 verified absolute launcher。');
  }
  if (!runtimeContext.graphifyInterpreter || !path.isAbsolute(runtimeContext.graphifyInterpreter)) {
    throw graphifySafetyError('graphify-hook-interpreter-stale', 'Python Graphify hook normalization 需要 verified absolute interpreter。');
  }
  let changed = false;
  for (const hookName of GRAPHIFY_HOOK_NAMES) {
    const hookPath = path.join(hooksRoot, hookName);
    const item = assertGraphifyHookLeaf(repoRoot, hookPath);
    if (!item || !item.isFile()) throw graphifySafetyError('graphify-provider-hook-not-found', `${hookName} 未安装。`);
    const current = fs.readFileSync(hookPath, 'utf8');
    const markers = PYTHON_HOOK_MARKERS[hookName];
    const block = extractUniqueMarkerBlock(current, markers[0], markers[1]);
    let normalized = block.text
      .replaceAll('.graphify/', 'graphify-out/')
      .replaceAll("'.graphify'", "'graphify-out'")
      .replaceAll('".graphify"', '"graphify-out"');
    normalized = renderHookWithManagedBlock(normalized, HOOK_ARTIFACT_BLOCK_START, HOOK_ARTIFACT_BLOCK_END, '', markers[0]);
    const credentialBlock = [
      HOOK_CREDENTIAL_BLOCK_START,
      "case $- in *x*) _spec_first_restore_xtrace=1; set +x ;; esac",
      "while IFS= read -r _spec_first_env_line; do",
      "  _spec_first_env_name=${_spec_first_env_line#export }",
      "  _spec_first_env_name=${_spec_first_env_name%%=*}",
      "  case \"$_spec_first_env_name\" in",
      "    HOME|USERPROFILE|PATH|PATHEXT|LANG|LC_ALL|LC_CTYPE|TMPDIR|TMP|TEMP|SYSTEMROOT|COMSPEC|GIT_DIR|GIT_WORK_TREE|GIT_PREFIX) ;;",
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

function verifyPythonGraphifyHooks(repoRoot, runtimeContext, hooksRoot = path.join(repoRoot, '.git', 'hooks')) {
  try {
    for (const hookName of GRAPHIFY_HOOK_NAMES) {
      const hookPath = path.join(hooksRoot, hookName);
      const item = assertGraphifyHookLeaf(repoRoot, hookPath);
      if (!item || !item.isFile()) return { ok: false, reason_code: 'graphify-provider-hook-not-found' };
      const current = fs.readFileSync(hookPath, 'utf8');
      const markers = PYTHON_HOOK_MARKERS[hookName];
      const block = extractUniqueMarkerBlock(current, markers[0], markers[1]).text;
      if (block.includes(HOOK_ARTIFACT_BLOCK_START)
        || block.includes(HOOK_ARTIFACT_BLOCK_END)
        || block.includes("export GRAPHIFY_OUT=")
        || block.includes('.graphify/')) {
        return { ok: false, reason_code: 'graphify-hook-artifact-contract-mismatch' };
      }
      if (block.split(HOOK_CREDENTIAL_BLOCK_START).length - 1 !== 1
        || block.split(HOOK_CREDENTIAL_BLOCK_END).length - 1 !== 1
        || !block.includes('GIT_WORK_TREE|GIT_PREFIX)')
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

function pythonHookMarkersPresent(repoRoot, hooksRoot = path.join(repoRoot, '.git', 'hooks')) {
  try {
    for (const hookName of GRAPHIFY_HOOK_NAMES) {
      const hookPath = path.join(hooksRoot, hookName);
      const item = assertGraphifyHookLeaf(repoRoot, hookPath);
      if (!item || !item.isFile()) return false;
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
  cleanupNpmGraphifyIncumbent,
  graphifyProcessEnv,
  hasSupportedCodeFile,
  inspectGraphIntegrity,
  normalizePythonHostIntegration,
  normalizePythonGraphifyHooks,
  plan,
  parseJsonStdout,
  recoverGraphifyMigration,
  refresh,
  resolveGraphifyHookTarget,
  resolvePythonGraphifyCommand,
  uninstall,
  pythonHostIntegrationConfigured,
  verifyPythonGraphifyHooks,
  verify,
};
