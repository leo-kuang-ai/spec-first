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

const { spawnSync } = require('node:child_process');
const { resolveWorkspaceTargets } = require('./workspace-target.cjs');
const { buildWorkspaceGraphs } = require('./workspace-graph-build.cjs');
const { makeWorkspaceRunners } = require('./workspace-provider-runners.cjs');
const { injectRoutingInstruction } = require('./workspace-routing-inject.cjs');
const { installChildHooks } = require('./workspace-graph-refresh.cjs');

function defaultExec(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: opts.cwd,
    env: { ...process.env, ...(opts.env || {}) },
    encoding: 'utf8',
    timeout: opts.timeoutMs || 300000,
    windowsHide: true,
  });
  return {
    status: typeof result.status === 'number' ? result.status : 1,
    stdout: String(result.stdout || ''),
    stderr: String(result.stderr || ''),
  };
}

function runWorkspaceGraphBuild({
  cwd = process.cwd(),
  repos = [],
  allowDiscovery = true,
  manifestPath = null,
  exec = defaultExec,
  codegraphCommand = 'codegraph',
  graphifyCommand = 'graphify',
  hosts = ['claude', 'codex'],
  injectRouting = true,
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

  // U3/CR8: install per-child Graphify git hooks so a child commit refreshes its
  // subgraph. Best-effort and non-fatal — a hook that can't be installed
  // (e.g. core.hooksPath redirects outside the workspace) records a CR9 fallback
  // and does not change the build status.
  let hooks = null;
  if (build.status === 'complete' || build.status === 'partial') {
    hooks = installChildHooks({ workspaceRoot: targets.workspace_root, repos: confirmed, exec });
  }

  return {
    schema_version: 'workspace-graph-executor.v1',
    status: build.status, // complete | partial | failed
    topology: targets.topology,
    reason_code: build.reason_code,
    workspace_root: targets.workspace_root,
    targets,
    pending_confirm: pendingConfirm.map((r) => r.repo_id),
    build,
    routing,
    hooks,
  };
}

module.exports = {
  runWorkspaceGraphBuild,
  defaultExec,
};
