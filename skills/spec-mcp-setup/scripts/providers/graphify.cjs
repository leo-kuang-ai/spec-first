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
const GRAPHIFY_HOOK_MARKER = 'Installed by: graphify hook install';
const METADATA = {
  id: 'graphify',
  kind: 'project-graph',
  profile: 'optional',
  capability_class: 'project-graph',
  capabilities: ['project-graph'],
  native_interfaces: ['cli'],
  first_generation: {
    owner: 'runtime-setup',
    status: 'not-run',
    scope: 'project',
    requires_explicit_gate: true,
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
    assertGraphifyMutationSurfaces(repoRoot, context.host, resolved.artifact_root);
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
  const actions = [];
  const resolvedDependency = context.probeDependency === true
    ? resolveGraphifyCommand(context, repoRoot, context.dependency && context.dependency.version)
    : { ok: false, reason_code: 'provider-dependency-not-probed' };
  if (!resolvedDependency.ok && context.dependency && context.dependency.package && context.dependency.version) {
    actions.push({
      kind: 'install-dependency',
      command: 'npm',
      args: ['install', '-g', `${context.dependency.package}@${context.dependency.version}`, '--no-audit', '--no-fund', '--loglevel=error'],
    });
  }
  if (!isSpecFirstSourceRepo(repoRoot)) {
    actions.push({ kind: 'install-project-skill', command: 'graphify', args: ['install', '--project', '--platform', context.host || 'codex'] });
  }
  const hasCurrent = currentArtifactRefs(repoRoot, resolved.artifact_root).length > 0;
  if (context.refresh && hasCurrent) {
    actions.push({
      kind: 'refresh',
      command: 'graphify',
      args: workspace === repoRoot
        ? ['update', '.']
        : ['extract', workspace, '--out', repoRoot],
    });
  } else if (!hasCurrent) {
    actions.push({
      kind: 'first-generation',
      command: 'graphify',
      args: workspace === repoRoot
        ? ['extract', '.']
        : ['extract', workspace, '--out', repoRoot],
      allow_code_only_fallback: workspace === repoRoot,
    });
  }
  actions.push({ kind: 'verify-query', command: 'graphify', args: ['query', 'main'] });
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
    dependency_ready: resolvedDependency.ok,
    resolved_graphify_command: resolvedDependency.ok ? resolvedDependency.command : null,
    resolved_graphify_on_original_path: resolvedDependency.ok ? resolvedDependency.on_original_path : null,
    original_path_graphify_command: resolvedDependency.original_path_command || null,
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
    assertGraphifyMutationSurfaces(repoRoot, context.host, resolved.artifact_root);
  } catch (error) {
    return unsafeReadiness(context, repoRoot, error.reason_code || 'provider-mutation-surface-unsafe');
  }
  const resolvedCommand = resolveGraphifyCommand(
    context,
    repoRoot,
    context.dependency && context.dependency.version,
  );
  const runtimeContext = resolvedCommand.ok
    ? { ...context, graphifyCommand: resolvedCommand.command }
    : context;
  const installed = resolvedCommand.ok;
  const artifactRefs = currentArtifactRefs(repoRoot, resolved.artifact_root);
  const hasCurrent = artifactRefs.length > 0;
  const hasLegacy = artifactExists(repoRoot, LEGACY_ARTIFACTS);
  const query = installed && hasCurrent
    ? runGraphify(runtimeContext, ['query', 'main'], { cwd: repoRoot, timeoutMs: 30000 })
    : null;
  const queryVerified = Boolean(query && succeeded(query));
  const gitState = graphifyGitState(repoRoot);
  const hook = installed && gitState.is_git_repo
    ? runGraphify(runtimeContext, ['hook', 'status'], { cwd: repoRoot, timeoutMs: 30000 })
    : null;
  const hookVerified = Boolean(hook && succeeded(hook));
  const nextActions = [];
  if (!installed) nextActions.push('运行 spec-mcp-setup --only graphify，安装 pinned Provider。');
  if (hasLegacy && !hasCurrent) nextActions.push('运行 spec-mcp-setup --only graphify --refresh，重新生成 provider-native .graphify/。');
  if (hasCurrent) nextActions.push('运行 spec-mcp-setup --only graphify --refresh，执行显式 incremental refresh。');
  if (installed && hasCurrent && !queryVerified) nextActions.push('依赖 graph candidate 前，先运行真实的 Graphify query probe。');
  if (gitState.is_git_repo && !hookVerified) nextActions.push('检查 Graphify hook 状态，并重新运行显式 setup。');
  const degraded = installed && ((hasCurrent && !queryVerified) || (gitState.is_git_repo && !hookVerified));
  return providerResult(METADATA, {
    installed,
    configured: isSpecFirstSourceRepo(repoRoot) || projectSkillConfigured(repoRoot, context.host),
    initialized: hasCurrent,
    indexed: hasCurrent,
    artifactExists: hasCurrent,
    queryVerified,
    serverReachable: false,
    readinessStatus: !installed ? 'not-run' : (degraded ? 'degraded' : (hasCurrent && queryVerified ? 'fresh' : 'unknown')),
    repoAligned: 'unknown',
    firstGenerationStatus: hasCurrent ? 'completed' : 'not-run',
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
  try {
    assertGraphifyMutationSurfaces(repoRoot, context.host, actionPlan.artifact_root || path.join(repoRoot, '.graphify'));
  } catch (error) {
    return unsafeReadiness(context, repoRoot, error.reason_code || 'provider-mutation-surface-unsafe');
  }
  let fallbackUsed = false;
  let mutationFailure = null;
  let pathRepair = { status: 'not-evaluated', reason_code: null };
  let runtimeContext = actionPlan.resolved_graphify_command
    ? {
      ...context,
      graphifyCommand: actionPlan.resolved_graphify_command,
      graphifyOnOriginalPath: actionPlan.resolved_graphify_on_original_path,
      graphifyOriginalPathCommand: actionPlan.original_path_graphify_command,
    }
    : context;

  function adoptResolvedCommand(resolved) {
    pathRepair = repairGraphifyPathSymlinkIfSafe(context, resolved, actionPlan.dependency_version);
    runtimeContext = {
      ...context,
      graphifyCommand: resolved.command,
      graphifyOnOriginalPath: resolved.on_original_path || pathRepair.status === 'repaired',
      graphifyOriginalPathCommand: resolved.original_path_command || null,
    };
  }

  if (actionPlan.resolved_graphify_command) {
    adoptResolvedCommand({
      ok: true,
      command: actionPlan.resolved_graphify_command,
      on_original_path: actionPlan.resolved_graphify_on_original_path === true,
      original_path_command: actionPlan.original_path_graphify_command || null,
    });
  }

  for (const action of actionPlan.actions || []) {
    try {
      assertGraphifyMutationSurfaces(repoRoot, context.host, actionPlan.artifact_root || path.join(repoRoot, '.graphify'));
    } catch (error) {
      mutationFailure = error.reason_code || 'provider-mutation-surface-unsafe';
      break;
    }
    if (['verify-query', 'verify-hook'].includes(action.kind)) continue;
    if (action.kind !== 'install-dependency' && !runtimeContext.graphifyCommand) {
      const resolved = resolveGraphifyCommand(context, repoRoot, actionPlan.dependency_version);
      if (!resolved.ok) {
        mutationFailure = resolved.reason_code;
        break;
      }
      adoptResolvedCommand(resolved);
    }
    if (action.kind === 'install-dependency') {
      const result = run(context, action.command, action.args, { cwd: repoRoot, timeoutMs: 120000 });
      if (!succeeded(result)) mutationFailure = 'graphify-install-failed';
      else {
        const resolved = resolveGraphifyCommand(context, repoRoot, actionPlan.dependency_version);
        if (!resolved.ok) mutationFailure = resolved.reason_code;
        else adoptResolvedCommand(resolved);
      }
    } else if (action.kind === 'install-project-skill') {
      const result = runGraphify(runtimeContext, action.args, { cwd: repoRoot, timeoutMs: 60000 });
      if (!succeeded(result)) mutationFailure = 'graphify-project-skill-install-failed';
      else {
        try {
          normalizeGraphifyInstructionSection(repoRoot, context.host);
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
    assertGraphifyMutationSurfaces(repoRoot, context.host, actionPlan.artifact_root || path.join(repoRoot, '.graphify'));
  } catch (error) {
    mutationFailure = error.reason_code || 'provider-mutation-surface-unsafe';
  }
  const artifactRefs = currentArtifactRefs(repoRoot, actionPlan.artifact_root || path.join(repoRoot, '.graphify'));
  if (!mutationFailure && artifactRefs.length > 0) {
    queryVerified = succeeded(runGraphify(runtimeContext, ['query', 'main'], { cwd: repoRoot, timeoutMs: 30000 }));
  }
  const gitState = graphifyGitState(repoRoot);
  let hookInstalled = false;
  let hookVerified = false;
  let hookStatus = gitState.is_git_repo ? 'unknown' : 'skipped';
  let hookSkippedReason = gitState.is_git_repo ? null : 'not-a-git-repo';
  if (!mutationFailure && gitState.is_git_repo) {
    let hook = null;
    try {
      assertGraphifyMutationSurfaces(repoRoot, context.host, actionPlan.artifact_root || path.join(repoRoot, '.graphify'));
      repairGraphifyHookPathVisibility(repoRoot, runtimeContext);
      hook = runGraphify(runtimeContext, ['hook', 'status'], { cwd: repoRoot, timeoutMs: 30000 });
      if (!succeeded(hook) && gitState.hook_mutation_allowed) {
        const installHook = runGraphify(runtimeContext, ['hook', 'install'], { cwd: repoRoot, timeoutMs: 60000 });
        hookInstalled = succeeded(installHook);
        if (hookInstalled) {
          assertGraphifyMutationSurfaces(repoRoot, context.host, actionPlan.artifact_root || path.join(repoRoot, '.graphify'));
          repairGraphifyHookPathVisibility(repoRoot, runtimeContext);
          hook = runGraphify(runtimeContext, ['hook', 'status'], { cwd: repoRoot, timeoutMs: 30000 });
        }
      } else if (!succeeded(hook)) {
        hookSkippedReason = gitState.hook_skipped_reason;
      }
    } catch (error) {
      mutationFailure = error.reason_code || 'graphify-hook-path-repair-failed';
      hookSkippedReason = mutationFailure;
    }
    hookVerified = succeeded(hook);
    hookInstalled = hookInstalled || hookVerified;
    hookStatus = hookVerified ? 'verified' : (hookInstalled ? 'installed' : 'failed');
  }
  const hasArtifact = artifactRefs.length > 0;
  const configured = isSpecFirstSourceRepo(repoRoot) || projectSkillConfigured(repoRoot, context.host);
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
      : undefined,
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
  return run(context, context.graphifyCommand || 'graphify', args, options);
}

function resolveGraphifyCommand(context, repoRoot, versionPin) {
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

function assertGraphifyMutationSurfaces(repoRoot, host, artifactRoot) {
  assertGraphifyArtifactSurface(repoRoot, artifactRoot);
  if (!isSpecFirstSourceRepo(repoRoot)) {
    for (const candidate of projectMutationSurfaces(repoRoot, host)) {
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

function projectMutationSurfaces(repoRoot, host) {
  const instruction = host === 'claude' ? 'CLAUDE.md' : 'AGENTS.md';
  const relativePaths = {
    claude: ['.claude/skills/graphify/SKILL.md', '.claude/hooks.json'],
    cursor: ['.cursor/skills/graphify/SKILL.md'],
    kiro: ['.kiro/skills/graphify/SKILL.md'],
    qoder: ['.qoder/skills/graphify/SKILL.md'],
  }[host] || ['.codex/skills/graphify/SKILL.md', '.agents/skills/graphify/SKILL.md', '.codex/hooks.json'];
  return [...relativePaths, instruction].map((relativePath) => path.join(repoRoot, relativePath));
}

function projectSkillConfigured(repoRoot, host) {
  if (isSpecFirstSourceRepo(repoRoot)) return true;
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
  plan,
  refresh,
  uninstall,
  verify,
};
