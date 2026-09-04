'use strict';

// U4 — Workspace graph status / doctor-facing facts (read-only).
//
// Observes filesystem state under a non-Git requirement workspace and returns a
// workspace-graph envelope the CLI renderer (and a future doctor path) can print.
// No provider binaries are invoked; no mutation. Freshness facts are shaped via
// classifyGraphFreshness so empty/partial/stale carry NO negative authority.
//
// projectPath containment is advisory (CR6) — this module reports the default
// child projectPath and whether it is contained, but does not hard-gate queries.

const fs = require('node:fs');
const path = require('node:path');
const { assertContainedPath } = require('./path-safety.cjs');
const { resolveWorkspaceTargets } = require('./workspace-target.cjs');
const {
  resolveContainedProjectPath,
  classifyGraphFreshness,
} = require('./workspace-graph-scope.cjs');
const {
  BLOCK_START,
  isRoutingInstructionCurrent,
} = require('./workspace-routing-instruction.cjs');
const {
  inspectRepoSnapshot,
  readWorkspaceGraphState,
  resolveStateRepoIds,
} = require('./workspace-graph-state.cjs');
const {
  inspectWorkspaceChildHookPosture,
  prepareWorkspaceChildHookInspection,
} = require('./workspace-child-hook.cjs');
const { readAsyncRefreshStatus } = require('./workspace-async-refresh.cjs');
const {
  codegraphArtifactHasContent,
  jsonFileDescriptorHasContent,
  jsonFileHasContent,
  sha256FileDescriptor,
} = require('./workspace-graph-artifacts.cjs');
const { inspectWorkspaceGraphLifecycle } = require('./workspace-graph-lifecycle-lease.cjs');
const { readStableRegularFile } = require('./regular-file-snapshot.cjs');

function runWorkspaceGraphStatus({
  cwd = process.cwd(),
  repos = [],
  allowDiscovery = true,
  manifestPath = null,
  bundledVersion = '',
  // Optional path used only for enclosing-child projectPath hint (defaults to cwd).
  // Topology is always resolved from `cwd` (must be the requirement parent).
  pathHintCwd = null,
} = {}) {
  const stateResult = readWorkspaceGraphState(cwd);
  const stateRepoIds = resolveStateRepoIds(stateResult);
  const effectiveRepos = repos.length > 0 ? repos : stateRepoIds;
  const targets = resolveWorkspaceTargets({
    cwd,
    repos: effectiveRepos,
    allowDiscovery,
    manifestPath,
  });
  if (targets.topology !== 'requirement-workspace') {
    return {
      schema_version: 'workspace-graph-status.v1',
      status: 'skipped',
      topology: targets.topology,
      reason_code: targets.reason_code || 'workspace-not-eligible',
      workspace_root: targets.workspace_root,
      repos: [],
      workspace: null,
      routing: null,
      default_project_path: null,
    };
  }
  if (targets.manifest_error) {
    return {
      schema_version: 'workspace-graph-status.v1',
      status: 'invalid',
      topology: targets.topology,
      reason_code: targets.manifest_error,
      workspace_root: targets.workspace_root,
      repos: [],
      workspace: null,
      routing: null,
      default_project_path: null,
    };
  }
  if (targets.ambiguous.length > 0) {
    return {
      schema_version: 'workspace-graph-status.v1',
      status: 'invalid',
      topology: targets.topology,
      reason_code: 'workspace-targets-ambiguous',
      workspace_root: targets.workspace_root,
      repos: [],
      workspace: null,
      routing: null,
      default_project_path: null,
    };
  }

  const workspaceRoot = targets.workspace_root;
  const confirmed = targets.repos.filter((repo) => !repo.needs_confirm);
  const pendingConfirm = targets.repos.filter((repo) => repo.needs_confirm);
  const configuredRefreshMode = stateResult.status === 'ready'
    ? stateResult.state.refresh_mode
    : 'unknown';

  const stateRepos = new Map(
    stateResult.status === 'ready'
      ? stateResult.state.repos.map((repo) => [repo.repo_id, repo])
      : [],
  );
  const preparedHookInspection = configuredRefreshMode === 'commit-hook-spec-first-async'
    ? prepareWorkspaceChildHookInspection({
      workspaceRoot,
      bundledVersion,
      expectedHookContract: stateResult.status === 'ready' ? stateResult.state.refresh_hook : null,
    })
    : null;
  const repoFacts = confirmed.map((repo) => {
    const codegraphPresent = codegraphArtifactHasContent(repo.git_root, workspaceRoot);
    const stateRepo = stateRepos.get(repo.repo_id) || null;
    const subgraphPath = resolveStateArtifactPath(workspaceRoot, stateRepo && stateRepo.subgraph_path);
    const subgraphPresent = Boolean(subgraphPath && jsonFileHasContent(subgraphPath));
    const projectPathCheck = resolveContainedProjectPath(workspaceRoot, repo.git_root);
    const autoRefreshHook = configuredRefreshMode === 'commit-hook-spec-first-async'
      ? inspectWorkspaceChildHookPosture({
        child: repo,
        workspaceRoot,
        bundledVersion,
        expectedHookContract: stateResult.status === 'ready' ? stateResult.state.refresh_hook : null,
        preparedHookInspection,
      })
      : { hook_status: 'not-applicable', reason_code: null };
    const freshness = classifyGraphFreshness({
      scope_id: repo.repo_id,
      scope_kind: 'child',
      provider: 'codegraph',
      freshness: codegraphPresent ? 'complete' : 'unknown',
      hasResults: codegraphPresent ? true : null,
      limitations: codegraphPresent
        ? []
        : ['no-.codegraph-directory — run --workspace-graph to build'],
    });
    return {
      repo_id: repo.repo_id,
      git_root: repo.git_root,
      codegraph_present: codegraphPresent,
      graphify_subgraph_path: subgraphPath,
      graphify_subgraph_present: subgraphPresent,
      last_codegraph_status: stateRepo ? stateRepo.codegraph_status : 'unknown',
      last_exclude_status: stateRepo ? stateRepo.exclude_status : 'unknown',
      last_graphify_status: stateRepo ? stateRepo.graphify_status : 'unknown',
      promotion_cleanup_pending: Boolean(stateRepo && stateRepo.promotion_cleanup_pending),
      promotion_cleanup_reason_code: stateRepo ? stateRepo.promotion_cleanup_reason_code : '',
      last_reason_code: stateRepo ? stateRepo.reason_code : '',
      auto_refresh_hook_status: autoRefreshHook.hook_status,
      auto_refresh_hook_reason_code: autoRefreshHook.reason_code,
      project_path: projectPathCheck.ok ? projectPathCheck.project_path : null,
      project_path_contained: projectPathCheck.ok,
      project_path_enforcement: 'advisory',
      freshness,
    };
  });
  const promotionCleanup = summarizePromotionCleanup(stateResult, repoFacts);

  const mergedPath = path.join(workspaceRoot, 'graphify-out', 'merged-graph.json');
  const graphifyDir = path.join(workspaceRoot, 'graphify-out');
  const graphifyPresent = fs.existsSync(graphifyDir);
  const mergedArtifact = inspectFileArtifact(workspaceRoot, mergedPath, {
    validateContent: stateResult.status === 'ready'
      && stateResult.state.operation_status === 'complete',
  });
  const mergedPresent = mergedArtifact.present;
  const mergedSizeBytes = mergedArtifact.size_bytes;
  const asyncRefresh = readAsyncRefreshStatus(workspaceRoot);
  const initialLifecycle = inspectWorkspaceGraphLifecycle(workspaceRoot);
  const stateEvaluation = evaluateWorkspaceState({
    workspaceRoot,
    stateResult,
    confirmed,
    repoFacts,
    mergedPath,
    mergedPresent,
    mergedArtifact,
  });
  const limitations = stateEvaluation.limitations.slice();
  limitations.push(...promotionCleanup.reason_codes);
  const autoRefreshHooksReady = configuredRefreshMode !== 'commit-hook-spec-first-async'
    || repoFacts.every((repo) => repo.auto_refresh_hook_status === 'installed');
  const autoRefreshHookReasonCode = autoRefreshHooksReady
    ? ''
    : 'workspace-auto-refresh-hook-incomplete';
  if (autoRefreshHookReasonCode) {
    limitations.push(autoRefreshHookReasonCode);
    for (const repo of repoFacts.filter((entry) => entry.auto_refresh_hook_status !== 'installed')) {
      limitations.push(
        (repo.auto_refresh_hook_reason_code || 'workspace-child-hook-unavailable')
          + ':' + repo.repo_id,
      );
    }
  }
  if (mergedSizeBytes != null && mergedSizeBytes > 50 * 1024 * 1024) {
    limitations.push('merged-graph-large — do not cat full file; use Graphify CLI query/path');
  }
  if (!mergedPresent) limitations.push('no-merged-graph — run --workspace-graph to build');
  const asyncReasonCode = asyncRefreshReasonCode(asyncRefresh);
  if (asyncReasonCode) limitations.push(asyncReasonCode);

  // Advisory projectPath hint: only when pathHintCwd (or cwd) is inside a confirmed child.
  // Parent-root status intentionally has no default — do not invent a lexicographic "main" repo.
  let defaultProjectPath = null;
  let defaultProjectPathContained = false;
  const hintBase = pathHintCwd || cwd;
  const cwdChild = confirmed.find((repo) => {
    const root = repo.git_root;
    if (!root) return false;
    const rel = path.relative(root, hintBase);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  });
  const hintRepo = cwdChild || null;
  if (hintRepo) {
    const check = resolveContainedProjectPath(workspaceRoot, hintRepo.git_root);
    defaultProjectPath = check.ok ? check.project_path : null;
    defaultProjectPathContained = check.ok;
  }

  const routing = inspectRoutingPresence(workspaceRoot, confirmed);
  const lifecycle = initialLifecycle.status === 'none'
    ? inspectWorkspaceGraphLifecycle(workspaceRoot)
    : initialLifecycle;
  const lifecycleReasonCode = lifecycle.status === 'none' ? '' : lifecycle.reason_code;
  if (lifecycleReasonCode) limitations.push(lifecycleReasonCode);
  const effectiveFreshness = (
    asyncReasonCode
    || lifecycleReasonCode
    || autoRefreshHookReasonCode
  ) && mergedPresent
    ? 'stale'
    : stateEvaluation.freshness;
  const workspaceFreshness = classifyGraphFreshness({
    scope_id: path.basename(workspaceRoot),
    scope_kind: 'workspace',
    provider: 'graphify',
    freshness: effectiveFreshness,
    hasResults: mergedPresent ? true : null,
    limitations,
  });

  const anyGraph = repoFacts.some((repo) => repo.codegraph_present || repo.graphify_subgraph_present) || mergedPresent;
  const allChildGraphs = repoFacts.length > 0 && repoFacts.every((r) => r.codegraph_present);
  const allSubgraphs = repoFacts.length > 0 && repoFacts.every((repo) => repo.graphify_subgraph_present);
  const routingReady = routing.entries.length === 2 && routing.entries.every((entry) => entry.routing_current);
  let status = 'absent';
  let reasonCode = 'absent';
  if (anyGraph
    && allChildGraphs
    && allSubgraphs
    && mergedPresent
    && stateEvaluation.ready
    && !promotionCleanup.pending
    && autoRefreshHooksReady
    && routingReady) {
    status = 'ready';
    reasonCode = '';
  }
  else if (anyGraph) status = 'partial';
  if (status === 'partial') {
    reasonCode = partialWorkspaceReason({
      stateEvaluation,
      promotionCleanup,
      autoRefreshHooksReady,
      autoRefreshHookReasonCode,
      routingReady,
    });
  }
  if (pendingConfirm.length > 0) {
    status = confirmed.length === 0 ? 'needs-confirmation' : 'partial';
    reasonCode = 'workspace-repos-need-confirmation';
  }
  if (status === 'ready' && asyncReasonCode) {
    status = 'partial';
    reasonCode = asyncReasonCode;
  }
  if (status === 'ready' && lifecycleReasonCode) {
    status = 'partial';
    reasonCode = lifecycleReasonCode;
  }

  return {
    schema_version: 'workspace-graph-status.v1',
    status,
    topology: targets.topology,
    reason_code: reasonCode,
    workspace_root: workspaceRoot,
    pending_confirm: pendingConfirm.map((r) => r.repo_id),
    repos: repoFacts,
    workspace: {
      graphify_dir: graphifyDir,
      graphify_present: graphifyPresent,
      merged_graph_path: mergedPath,
      merged_present: mergedPresent,
      merged_size_bytes: mergedSizeBytes,
      freshness: workspaceFreshness,
      state_path: stateResult.path,
      state_status: stateResult.status,
      promotion_cleanup_pending: promotionCleanup.pending,
      promotion_cleanup_reason_codes: promotionCleanup.reason_codes,
      configured_refresh_mode: configuredRefreshMode,
      refresh_mode: autoRefreshHooksReady ? configuredRefreshMode : 'explicit',
      // 消费侧只读事实（R10/U6）：commit 触发的 merged 重建异步执行，此处只报告其在途/失败/成功，
      // 绝不在消费时触发重建。in-flight 表示图可能落后当前 HEAD；failed 表示后台重建失败需关注。
      async_refresh: asyncRefresh,
      lifecycle,
    },
    routing,
    // CR10: doctor-facing advisory projectPath when cwd is inside a child.
    // When cwd is the parent root, null — do not invent a "main" repo.
    default_project_path: defaultProjectPath,
    default_project_path_contained: defaultProjectPathContained,
    default_project_path_policy: hintRepo ? 'cwd-enclosing-child' : 'none-at-parent-root',
    server_root_default_note:
      'CodeGraph global MCP server root has no workspace index; agents must pass projectPath for the child cwd is inside. At parent root there is no default index — do not query the server root. Do not cat merged-graph.json; use Graphify CLI query/path/explain.',
  };
}

function asyncRefreshReasonCode(asyncRefresh) {
  if (!asyncRefresh || asyncRefresh.status === 'none' || asyncRefresh.status === 'succeeded') return '';
  if (asyncRefresh.status === 'in-flight') return 'workspace-async-refresh-in-flight';
  return asyncRefresh.reason_code || 'workspace-async-refresh-status-unknown';
}

function partialWorkspaceReason({
  stateEvaluation,
  promotionCleanup,
  autoRefreshHooksReady,
  autoRefreshHookReasonCode,
  routingReady,
}) {
  if (!stateEvaluation.ready) return stateEvaluation.reason_code;
  if (promotionCleanup.pending) return 'workspace-artifact-cleanup-pending';
  if (!autoRefreshHooksReady) return autoRefreshHookReasonCode;
  if (!routingReady) return 'workspace-routing-incomplete';
  return 'workspace-graph-partial';
}

function summarizePromotionCleanup(stateResult, repoFacts) {
  if (!stateResult || stateResult.status !== 'ready') {
    return { pending: false, reason_codes: [] };
  }
  const reasonCodes = repoFacts
    .filter((repo) => repo.promotion_cleanup_pending)
    .map((repo) => (
      `${repo.promotion_cleanup_reason_code || 'promotion-cleanup-pending'}:repo:${repo.repo_id}`
    ));
  const merge = stateResult.state.merge;
  if (merge && merge.promotion_cleanup_pending) {
    reasonCodes.push(
      `${merge.promotion_cleanup_reason_code || 'promotion-cleanup-pending'}:merge`,
    );
  }
  return {
    pending: reasonCodes.length > 0,
    reason_codes: reasonCodes,
  };
}

function evaluateWorkspaceState({
  workspaceRoot,
  stateResult,
  confirmed,
  repoFacts,
  mergedPath,
  mergedPresent,
  mergedArtifact,
}) {
  if (stateResult.status !== 'ready') {
    return {
      ready: false,
      freshness: 'unknown',
      reason_code: stateResult.reason_code,
      limitations: [stateResult.reason_code],
    };
  }

  const state = stateResult.state;
  if (state.operation_status !== 'complete') {
    return {
      ready: false,
      freshness: mergedPresent ? 'stale' : 'partial',
      reason_code: state.reason_code || 'workspace-last-build-incomplete',
      limitations: [state.reason_code || 'workspace-last-build-incomplete'],
    };
  }

  const expectedIds = state.repos.map((repo) => repo.repo_id).sort();
  const actualIds = confirmed.map((repo) => repo.repo_id).sort();
  if (expectedIds.join('\n') !== actualIds.join('\n')) {
    return {
      ready: false,
      freshness: 'stale',
      reason_code: 'workspace-repo-set-changed',
      limitations: ['workspace-repo-set-changed'],
    };
  }

  if (!mergedArtifactMetadataMatches(workspaceRoot, state.merged_artifact, mergedPath, mergedArtifact)) {
    return {
      ready: false,
      freshness: 'stale',
      reason_code: 'workspace-merged-artifact-changed',
      limitations: ['workspace-merged-artifact-changed'],
    };
  }

  const confirmedById = new Map(confirmed.map((repo) => [repo.repo_id, repo]));
  for (const previous of state.repos) {
    const repo = confirmedById.get(previous.repo_id);
    const current = inspectRepoSnapshot(repo);
    if (!previous.observed || !current.observed) {
      return {
        ready: false,
        freshness: 'unknown',
        reason_code: 'workspace-source-snapshot-unavailable',
        limitations: ['workspace-source-snapshot-unavailable'],
      };
    }
    if (previous.head_state !== current.head_state || previous.head_sha !== current.head_sha) {
      return {
        ready: false,
        freshness: 'stale',
        reason_code: 'workspace-graph-stale',
        limitations: [`child-head-changed:${previous.repo_id}`],
      };
    }
    if (previous.worktree_fingerprint !== current.worktree_fingerprint) {
      return {
        ready: false,
        freshness: 'stale',
        reason_code: 'workspace-graph-stale',
        limitations: [`child-worktree-changed:${previous.repo_id}`],
      };
    }
  }

  if (!repoFacts.every((repo) => repo.graphify_subgraph_present)) {
    return {
      ready: false,
      freshness: 'partial',
      reason_code: 'workspace-subgraph-missing',
      limitations: ['workspace-subgraph-missing'],
    };
  }

  if (!mergedArtifactDigestMatches(state.merged_artifact, mergedPath, mergedArtifact)) {
    return {
      ready: false,
      freshness: 'stale',
      reason_code: 'workspace-merged-artifact-changed',
      limitations: ['workspace-merged-artifact-changed'],
    };
  }

  return { ready: true, freshness: 'complete', reason_code: '', limitations: [] };
}

function mergedArtifactMetadataMatches(workspaceRoot, artifact, mergedPath, observed) {
  if (!artifact || !observed.present) return false;
  const expectedPath = path.resolve(workspaceRoot, artifact.path || '');
  if (expectedPath !== path.resolve(mergedPath)) return false;
  if (artifact.size_bytes !== observed.size_bytes) return false;
  if (Math.abs(Number(artifact.mtime_ms) - observed.mtime_ms) >= 1) return false;
  return true;
}

function mergedArtifactDigestMatches(artifact, mergedPath, observed) {
  const snapshot = readStableRegularFile(mergedPath, {
    read: (descriptor) => sha256FileDescriptor(descriptor),
  });
  return snapshot.ok
    && snapshot.stat.dev === observed.dev
    && snapshot.stat.ino === observed.ino
    && snapshot.stat.size === observed.size_bytes
    && snapshot.stat.mtime_ms === observed.mtime_ms
    && artifact.sha256 === snapshot.value;
}

function inspectFileArtifact(workspaceRoot, filePath, { validateContent = true } = {}) {
  try {
    assertContainedPath(workspaceRoot, filePath, {
      reasonCode: 'workspace-merged-artifact-escapes-workspace',
    });
    if (validateContent) {
      const snapshot = readStableRegularFile(filePath, {
        read: (descriptor, stat) => jsonFileDescriptorHasContent(descriptor, stat),
      });
      if (!snapshot.ok || !snapshot.value) {
        return { present: false, size_bytes: null, mtime_ms: null, sha256: null };
      }
      return {
        present: true,
        size_bytes: snapshot.stat.size,
        mtime_ms: snapshot.stat.mtime_ms,
        dev: snapshot.stat.dev,
        ino: snapshot.stat.ino,
      };
    }
    const stat = fs.lstatSync(filePath);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size === 0) {
      return { present: false, size_bytes: null, mtime_ms: null, sha256: null };
    }
    return {
      present: true,
      size_bytes: stat.size,
      mtime_ms: stat.mtimeMs,
      dev: stat.dev,
      ino: stat.ino,
    };
  } catch (_error) {
    return { present: false, size_bytes: null, mtime_ms: null };
  }
}

function resolveStateArtifactPath(workspaceRoot, relativePath) {
  if (!relativePath) return null;
  const candidate = path.resolve(workspaceRoot, relativePath);
  try {
    assertContainedPath(workspaceRoot, candidate, { reasonCode: 'workspace-state-artifact-escapes-workspace' });
    return candidate;
  } catch (_error) {
    return null;
  }
}

function inspectRoutingPresence(workspaceRoot, repos) {
  const files = [
    { entry_file: 'CLAUDE.md', hosts: ['claude'] },
    { entry_file: 'AGENTS.md', hosts: ['codex', 'cursor', 'kiro', 'opencode', 'qoder', 'zcode'] },
  ];
  const entries = [];
  for (const target of files) {
    const rel = target.entry_file;
    const abs = path.join(workspaceRoot, rel);
    if (!fs.existsSync(abs)) {
      entries.push({ entry_file: rel, present: false, has_routing_block: false, routing_current: false });
      continue;
    }
    const body = fs.readFileSync(abs, 'utf8');
    entries.push({
      entry_file: rel,
      present: true,
      has_routing_block: body.includes(BLOCK_START),
      routing_current: isRoutingInstructionCurrent(body, { workspaceRoot, repos }),
    });
  }
  return { entries };
}

module.exports = {
  runWorkspaceGraphStatus,
};
