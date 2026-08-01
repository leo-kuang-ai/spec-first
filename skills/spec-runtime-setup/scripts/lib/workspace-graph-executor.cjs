'use strict';

// U2 — Callable workspace graph capability.
//
// Composes the verified vertical into the single unit `setup.cjs` invokes for a
// non-Git requirement-workspace graph build:
//   resolveWorkspaceTargets (U1) -> makeWorkspaceRunners (U2) -> buildWorkspaceGraphs (U2).
//
// `exec` is injectable (default: spawnSync) so the composition is contract-
// testable with fake binaries. Returns a single workspace result envelope that
// the renderer/doctor (U4) and clean (U6) consume; never throws for a per-repo
// provider failure — those are isolated in the build layer.

const path = require('node:path');
const { isAbsolutePath } = require('./path-safety.cjs');
const { resolveWorkspaceTargets } = require('./workspace-target.cjs');
const { buildWorkspaceGraphs } = require('./workspace-graph-build.cjs');
const { makeWorkspaceRunners } = require('./workspace-provider-runners.cjs');
const { injectRoutingInstruction } = require('./workspace-routing-inject.cjs');
const { defaultWorkspaceExec } = require('./workspace-exec.cjs');
const { workspaceGraphRefreshPosture } = require('./workspace-graph-refresh.cjs');
const { CANONICAL_HOSTS } = require('./host-authority.cjs');
const { readWorkspaceGraphState, writeWorkspaceGraphState } = require('./workspace-graph-state.cjs');
const { installWorkspaceChildHooks } = require('./workspace-child-hook.cjs');
const {
  clearAsyncRefreshStatus,
  clearStaleAsyncRefreshLock,
  readAsyncRefreshStatusGeneration,
  workspaceRefreshProcessEnv,
} = require('./workspace-async-refresh.cjs');
const {
  acquireWorkspaceGraphLifecycleLease,
  validateWorkspaceGraphLifecycleLease,
} = require('./workspace-graph-lifecycle-lease.cjs');
const { workspaceRefreshStateEligible } = require('./workspace-refresh-contract.cjs');

const defaultExec = defaultWorkspaceExec;

function runWorkspaceGraphBuild({
  cwd = process.cwd(),
  repos = [],
  allowDiscovery = true,
  manifestPath = null,
  exec = defaultExec,
  codegraphCommand = 'codegraph',
  graphifyCommand = 'graphify',
  hosts = [...CANONICAL_HOSTS],
  injectRouting = true,
  installHooks = true,
  lifecycleCredential = null,
  refreshOnly = false,
  runtimeHost = null,
  bundledVersion = '',
  resolvedTargets = null,
} = {}) {
  const targets = resolvedTargets || resolveWorkspaceTargets({ cwd, repos, allowDiscovery, manifestPath });

  if (targets.topology !== 'requirement-workspace') {
    return {
      schema_version: 'workspace-graph-executor.v1',
      status: 'skipped',
      topology: targets.topology,
      reason_code: targets.reason_code || 'workspace-not-eligible',
      workspace_root: targets.workspace_root,
      targets,
      build: null,
    };
  }
  if (targets.manifest_error) {
    return {
      schema_version: 'workspace-graph-executor.v1',
      status: 'failed',
      topology: targets.topology,
      reason_code: targets.manifest_error,
      workspace_root: targets.workspace_root,
      targets,
      pending_confirm: [],
      build: null,
    };
  }
  if (targets.ambiguous.length > 0) {
    return {
      schema_version: 'workspace-graph-executor.v1',
      status: 'failed',
      topology: targets.topology,
      reason_code: 'workspace-targets-ambiguous',
      workspace_root: targets.workspace_root,
      targets,
      pending_confirm: [],
      build: null,
    };
  }

  // Confirmed targets: manifest + cli. Auto-discovered candidates that still
  // need confirmation are surfaced but not built without confirmation.
  const confirmed = targets.repos.filter((repo) => !repo.needs_confirm);
  const pendingConfirm = targets.repos.filter((repo) => repo.needs_confirm);

  if (confirmed.length === 0) {
    return {
      schema_version: 'workspace-graph-executor.v1',
      status: 'needs-confirmation',
      topology: targets.topology,
      reason_code: pendingConfirm.length ? 'workspace-repos-need-confirmation' : (targets.reason_code || 'workspace-no-review-targets'),
      workspace_root: targets.workspace_root,
      targets,
      pending_confirm: pendingConfirm.map((r) => r.repo_id),
      build: null,
    };
  }

  if (refreshOnly && !lifecycleCredential) {
    return failedBeforeWorkspaceBuild({
      targets,
      pendingConfirm,
      reasonCode: 'workspace-graph-refresh-credential-required',
    });
  }
  if (refreshOnly && (!isAbsolutePath(codegraphCommand) || !isAbsolutePath(graphifyCommand))) {
    return failedBeforeWorkspaceBuild({
      targets,
      pendingConfirm,
      reasonCode: 'workspace-graph-refresh-launcher-invalid',
    });
  }
  let refreshHookContract = null;
  if (refreshOnly) {
    const baseline = readWorkspaceGraphState(targets.workspace_root);
    if (!workspaceRefreshStateEligible(baseline)) {
      return failedBeforeWorkspaceBuild({
        targets,
        pendingConfirm,
        reasonCode: 'workspace-graph-refresh-baseline-invalid',
      });
    }
    refreshHookContract = baseline.state.refresh_hook;
  }

  const lifecycle = lifecycleCredential
    ? validateWorkspaceGraphLifecycleLease({
      workspaceRoot: targets.workspace_root,
      credential: lifecycleCredential,
    })
    : acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: targets.workspace_root,
      operation: 'explicit-build',
    });
  if (!lifecycle.ok) {
    return {
      schema_version: 'workspace-graph-executor.v1',
      status: 'failed',
      topology: targets.topology,
      reason_code: lifecycle.reason_code,
      active_operation: lifecycle.active_operation || null,
      workspace_root: targets.workspace_root,
      targets,
      pending_confirm: pendingConfirm.map((r) => r.repo_id),
      build: null,
    };
  }

  let result;
  let release = null;
  let releaseRetry = null;
  try {
    result = runWorkspaceGraphBuildOwned({
      targets,
      confirmed,
      pendingConfirm,
      exec,
      codegraphCommand,
      graphifyCommand,
      hosts,
      injectRouting,
      installHooks,
      lifecycle,
      refreshOnly,
      runtimeHost,
      bundledVersion,
      refreshHookContract,
    });
  } finally {
    if (!lifecycle.inherited) release = lifecycle.release();
  }
  if (release && !release.ok) {
    const reasonCode = release.reason_code || 'workspace-graph-lifecycle-release-failed';
    const rewriteCompleteState = result.status === 'complete';
    if (rewriteCompleteState) {
      result.status = 'partial';
      result.reason_code = reasonCode;
    }
    if (release.ownership_retained === true) {
      lifecycle.assertOwned('after-build-release-failure');
      if (rewriteCompleteState) {
        result.build.state = writeExecutorState({
          targets: result.targets,
          build: result.build,
          refresh: result.refresh,
          operationStatus: 'partial',
          reasonCode,
          refreshHook: result.build && result.build.state && result.build.state.state
            ? result.build.state.state.refresh_hook
            : null,
        });
      }
      const persistedOperationStatus = result.build
        && result.build.state
        && result.build.state.ok === true
        && result.build.state.state
        && result.build.state.state.operation_status;
      if (persistedOperationStatus && persistedOperationStatus !== 'complete') {
        try {
          releaseRetry = lifecycle.release();
        } catch (error) {
          releaseRetry = {
            ok: false,
            status: 'failed',
            reason_code: error.reason_code || 'workspace-graph-lifecycle-release-failed',
          };
        }
      }
    }
  }
  if (release) result.lifecycle_release = release;
  if (releaseRetry) result.lifecycle_release_retry = releaseRetry;
  return result;
}

function runWorkspaceGraphBuildOwned({
  targets,
  confirmed,
  pendingConfirm,
  exec,
  codegraphCommand,
  graphifyCommand,
  hosts,
  injectRouting,
  installHooks,
  lifecycle,
  refreshOnly,
  runtimeHost,
  bundledVersion,
  refreshHookContract,
}) {
  lifecycle.assertOwned('before-provider-build');
  const asyncStatusGeneration = readAsyncRefreshStatusGeneration(targets.workspace_root);
  const providerEnv = refreshOnly
    ? workspaceRefreshProcessEnv(process.env, { includeControl: false })
    : {};
  const providerUnsetEnv = refreshOnly
    ? Object.keys(process.env).filter((key) => !Object.prototype.hasOwnProperty.call(providerEnv, key))
    : [];
  const runners = makeWorkspaceRunners({
    exec,
    codegraphCommand,
    graphifyCommand,
    baseEnv: providerEnv,
    unsetEnv: providerUnsetEnv,
  });
  const build = buildWorkspaceGraphs({
    workspaceRoot: targets.workspace_root,
    repos: confirmed,
    runners,
    refreshOnly,
    refreshMode: refreshOnly ? 'commit-hook-spec-first-async' : 'explicit',
    refreshHook: refreshOnly ? refreshHookContract : null,
    deferFinalState: true,
  });

  // A2/CR10: inject best-effort routing guidance into the workspace host entry
  // docs so an agent launched here uses the right graph. Only when the build
  // produced usable graphs (complete/partial).
  let routing = null;
  if (!refreshOnly && injectRouting && (build.status === 'complete' || build.status === 'partial')) {
    lifecycle.assertOwned('before-routing-injection');
    routing = injectRoutingInstruction({ workspaceRoot: targets.workspace_root, repos: confirmed, hosts });
  }

  // spec-first 自有子仓 commit hook：仅当 build 产出可用图（complete/partial）时安装，
  // 且只写有效 hooks root 在 child 内的子仓（external/unsafe 绝不写，merged 降级 advisory）。
  let hooks = null;
  if (!refreshOnly) {
    const canInstallHooks = installHooks && (build.status === 'complete' || build.status === 'partial');
    lifecycle.assertOwned('before-hook-installation');
    hooks = installWorkspaceChildHooks({
      workspaceRoot: targets.workspace_root,
      repos: confirmed,
      node: process.execPath,
      asyncRefreshScript: path.join(__dirname, 'workspace-async-refresh.cjs'),
      setupScript: path.resolve(__dirname, '..', 'setup.cjs'),
      codegraphCommand,
      graphifyCommand,
      runtimeHost,
      bundledVersion,
      install: canInstallHooks,
    });
  }
  const refresh = workspaceGraphRefreshPosture(hooks, { preserveAsync: refreshOnly });
  const refreshHook = refreshOnly
    ? refreshHookContract
    : (hooks && hooks.hook_contract ? hooks.hook_contract : null);

  let status = build.status;
  let reasonCode = build.reason_code;
  const routingFailed = routing && routing.entries.some((entry) => entry.status === 'failed');
  if (status === 'complete' && routingFailed) {
    status = 'partial';
    reasonCode = 'workspace-routing-injection-failed';
  }
  if (status === 'complete' && pendingConfirm.length > 0) {
    status = 'partial';
    reasonCode = 'workspace-repos-need-confirmation';
  }

  let asyncLockCleanup = null;
  if (status === 'complete') {
    lifecycle.assertOwned('before-stale-async-lock-clear');
    asyncLockCleanup = clearStaleAsyncRefreshLock(targets.workspace_root);
    if (!asyncLockCleanup.ok) {
      status = 'partial';
      reasonCode = asyncLockCleanup.reason_code || 'workspace-async-refresh-lock-cleanup-failed';
    }
  }

  let asyncStatusCleanup = null;
  if (status === 'complete') {
    lifecycle.assertOwned('before-async-status-clear');
    try {
      asyncStatusCleanup = clearAsyncRefreshStatus(targets.workspace_root, {
        expectedGeneration: asyncStatusGeneration,
      });
    } catch (error) {
      status = 'partial';
      reasonCode = error.reason_code || 'workspace-async-refresh-status-clear-failed';
      asyncStatusCleanup = {
        ok: false,
        changed: false,
        reason_code: reasonCode,
      };
    }
  }

  lifecycle.assertOwned('before-state-write');
  const finalState = writeExecutorState({
    targets,
    build,
    refresh,
    operationStatus: status,
    reasonCode,
    refreshHook,
    expectedRepos: build.expected_repos,
  });
  build.state = finalState;
  if (finalState.ok && finalState.state.operation_status !== status) {
    status = finalState.state.operation_status;
    reasonCode = finalState.state.reason_code;
  }
  if (!finalState.ok && status !== 'failed') {
    status = 'partial';
    reasonCode = finalState.reason_code || 'workspace-state-write-failed';
  }
  return {
    schema_version: 'workspace-graph-executor.v1',
    status,
    topology: targets.topology,
    reason_code: reasonCode,
    workspace_root: targets.workspace_root,
    targets,
    pending_confirm: pendingConfirm.map((r) => r.repo_id),
    build,
    routing,
    hooks,
    refresh,
    async_lock_cleanup: asyncLockCleanup,
    async_status_cleanup: asyncStatusCleanup,
  };
}

function writeExecutorState({
  targets,
  build,
  refresh,
  operationStatus,
  reasonCode,
  refreshHook = null,
  expectedRepos = null,
}) {
  return writeWorkspaceGraphState({
    workspaceRoot: targets.workspace_root,
    operationStatus,
    reasonCode,
    repos: build.repos,
    merge: build.merge,
    mergedArtifactReceipt: build.merged_artifact_receipt || null,
    refreshMode: refresh.mode,
    refreshHook,
    expectedRepos,
  });
}

function failedBeforeWorkspaceBuild({ targets, pendingConfirm, reasonCode }) {
  return {
    schema_version: 'workspace-graph-executor.v1',
    status: 'failed',
    topology: targets.topology,
    reason_code: reasonCode,
    workspace_root: targets.workspace_root,
    targets,
    pending_confirm: pendingConfirm.map((repo) => repo.repo_id),
    build: null,
  };
}

module.exports = {
  runWorkspaceGraphBuild,
  defaultExec,
};
