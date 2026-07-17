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
const { resolveWorkspaceTargets } = require('./workspace-target.cjs');
const { buildWorkspaceGraphs } = require('./workspace-graph-build.cjs');
const { makeWorkspaceRunners } = require('./workspace-provider-runners.cjs');
const { injectRoutingInstruction } = require('./workspace-routing-inject.cjs');
const { defaultWorkspaceExec } = require('./workspace-exec.cjs');
const { workspaceGraphRefreshPosture } = require('./workspace-graph-refresh.cjs');
const { CANONICAL_HOSTS } = require('./host-authority.cjs');
const { writeWorkspaceGraphState } = require('./workspace-graph-state.cjs');
const { installWorkspaceChildHooks } = require('./workspace-child-hook.cjs');

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
} = {}) {
  const targets = resolveWorkspaceTargets({ cwd, repos, allowDiscovery, manifestPath });

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

  const runners = makeWorkspaceRunners({ exec, codegraphCommand, graphifyCommand });
  const build = buildWorkspaceGraphs({
    workspaceRoot: targets.workspace_root,
    repos: confirmed,
    runners,
  });

  // A2/CR10: inject best-effort routing guidance into the workspace host entry
  // docs so an agent launched here uses the right graph. Only when the build
  // produced usable graphs (complete/partial).
  let routing = null;
  if (injectRouting && (build.status === 'complete' || build.status === 'partial')) {
    routing = injectRoutingInstruction({ workspaceRoot: targets.workspace_root, repos: confirmed, hosts });
  }

  // spec-first 自有子仓 commit hook：仅当 build 产出可用图（complete/partial）时安装，
  // 且只写有效 hooks root 在 child 内的子仓（external/unsafe 绝不写，merged 降级 advisory）。
  const canInstallHooks = installHooks && (build.status === 'complete' || build.status === 'partial');
  const hooks = installWorkspaceChildHooks({
    workspaceRoot: targets.workspace_root,
    repos: confirmed,
    node: process.execPath,
    asyncRefreshScript: path.join(__dirname, 'workspace-async-refresh.cjs'),
    setupScript: path.resolve(__dirname, '..', 'setup.cjs'),
    install: canInstallHooks,
  });
  const refresh = workspaceGraphRefreshPosture(hooks);

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

  const finalState = writeWorkspaceGraphState({
    workspaceRoot: targets.workspace_root,
    operationStatus: status,
    reasonCode,
    repos: build.repos,
    merge: build.merge,
    refreshMode: refresh.mode,
    expectedRepos: build.state && build.state.state ? build.state.state.repos : null,
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
  };
}

module.exports = {
  runWorkspaceGraphBuild,
  defaultExec,
};
