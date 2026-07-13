'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  buildParentArtifactQuarantine,
} = require('./facts.cjs');
const {
  assertContainedPath,
  ensureContainedDirectory,
  reasonError,
} = require('./path-safety.cjs');
const {
  applyProjectConfigBatch,
  planProjectConfig,
} = require('./project-config.cjs');
const {
  renderJson,
} = require('./renderer.cjs');
const {
  computeGeneratedRuntimeManifestHealth,
  firstSelectedProviderFailure,
  requireCapability,
} = require('./runtime-executor.cjs');

function runWorkspaceBatch(context, dependencies = {}) {
  const { runSingleTarget } = dependencies;
  const candidates = context.target.candidates || [];
  if (context.actionPlan.mode === 'project-config') {
    requireCapability(context, 'write-project-config');
    const explicitActions = context.parsed.refreshExample
      || context.parsed.createLocal
      || context.parsed.ensureGitignore
      || context.parsed.deleteLegacyMarkdown;
    const plans = candidates.map((candidate) => {
      if (!candidate.git_health || candidate.git_health.status !== 'ok') {
        return {
          schema_version: 'project-config-action-plan.v1',
          repo_root: candidate.git_root,
          mutation: false,
          blocked: true,
          reason_code: candidate.git_health
            ? candidate.git_health.reason_code
            : 'git-health-not-reported',
          actions: [],
        };
      }
      return planProjectConfig({
        repoRoot: candidate.git_root,
        refreshExample: context.parsed.refreshExample || !explicitActions,
        createLocal: context.parsed.createLocal,
        ensureGitignore: context.parsed.ensureGitignore || !explicitActions,
        deleteLegacyMarkdown: context.parsed.deleteLegacyMarkdown,
      });
    });
    const payload = applyProjectConfigBatch({
      workspaceRoot: context.target.workspace_root,
      selectionSource: context.target.selection_source,
      plans,
      templatePath: path.join(context.skillRoot, 'references', 'config-template.yaml'),
    });
    return {
      exit_code: payload.overall_status === 'ready' ? 0 : 1,
      mode: 'project-config',
      reason_code: payload.reason_code || 'workspace-project-config-ready',
      payload,
      human: renderJson(payload),
      target: context.target,
    };
  }

  const results = candidates.map((candidate) => {
    try {
      const gitHealth = candidate.git_health || { status: 'unknown', reason_code: 'git-health-not-reported' };
      if (gitHealth.status !== 'ok') {
        return failedChildResult(candidate, gitHealth.reason_code || 'child-git-health-action-required', {
          schema_version: 'project-target.v2',
          git_health: gitHealth,
        });
      }
      const childTarget = {
        ...context.target,
        mode: 'git-repo',
        target_kind: 'git-repo',
        selection_source: context.target.selection_source,
        state_write_allowed: true,
        git_health: gitHealth,
        target_root: candidate.git_root,
        selected_repo_root: candidate.git_root,
        repo_label: candidate.repo_label,
        candidates: [],
      };
      const child = runSingleTarget({ ...context, target: childTarget }, candidate.git_root);
      const childStatus = summarizeChildExecution(child, {
        mode: context.actionPlan.mode,
        selectedIds: context.actionPlan.selected_ids,
      }, firstSelectedProviderFailure);
      return {
        repo_label: candidate.repo_label,
        workspace_relative_path: portableWorkspacePath(candidate.workspace_relative_path),
        exit_code: child.exit_code,
        overall_status: childStatus.overall_status,
        reason_code: childStatus.reason_code,
        result: context.actionPlan.mode === 'verify'
          ? buildVerifyChildResult(child, candidate, context)
          : child.payload,
      };
    } catch (error) {
      return failedChildResult(
        candidate,
        error.reason_code || 'child-setup-execution-failed',
        {
          schema_version: 'spec-mcp-setup-error.v1',
          diagnostic: String(error && error.message ? error.message : error).slice(0, 2000),
        },
      );
    }
  });
  const payload = context.actionPlan.mode === 'verify'
    ? buildWorkspaceVerifySummary(context, results, computeGeneratedRuntimeManifestHealth)
    : buildWorkspaceSetupSummary(context, results);
  try {
    const summaryWriter = context.workspaceSummaryWriter || writeWorkspaceSummary;
    summaryWriter(context.target.workspace_root, payload);
  } catch (error) {
    payload.overall_status = 'action-required';
    payload.summary_write_status = 'failed';
    payload.summary_write_reason_code = error.reason_code || 'workspace-summary-write-failed';
    return {
      exit_code: 1,
      mode: context.actionPlan.mode,
      reason_code: payload.summary_write_reason_code,
      payload,
      human: renderJson(payload),
      target: context.target,
    };
  }
  return {
    exit_code: payload.overall_status === 'ready' ? 0 : 1,
    mode: context.actionPlan.mode,
    reason_code: payload.reason_code || 'workspace-ready',
    payload,
    human: renderJson(payload),
    target: context.target,
  };
}

function failedChildResult(candidate, reasonCode, result) {
  return {
    repo_label: candidate.repo_label,
    workspace_relative_path: portableWorkspacePath(candidate.workspace_relative_path),
    exit_code: 1,
    overall_status: 'action-required',
    reason_code: reasonCode,
    result,
  };
}

function summarizeChildExecution(child, { mode, selectedIds = [] } = {}, firstSelectedProviderFailure) {
  if (!child || child.exit_code !== 0) {
    return {
      overall_status: 'action-required',
      reason_code: child && child.reason_code ? child.reason_code : 'child-execution-failed',
    };
  }
  const executionSummary = child.payload && child.payload.execution_summary;
  if (executionSummary && executionSummary.overall_status !== 'ready') {
    return {
      overall_status: executionSummary.overall_status,
      reason_code: executionSummary.reason_code || 'child-setup-partial',
    };
  }
  const providerFailure = firstSelectedProviderFailure(
    child.payload && child.payload.tool_facts
      ? child.payload.tool_facts.provider_readiness
      : [],
    selectedIds,
  );
  if (providerFailure) {
    return {
      overall_status: 'action-required',
      reason_code: providerFailure.reason_code,
    };
  }
  const setupSummary = child.payload
    && child.payload.runtime_capabilities
    && child.payload.runtime_capabilities.setup_summary;
  if (!setupSummary || setupSummary.baseline_ready !== true) {
    return {
      overall_status: 'action-required',
      reason_code: 'child-baseline-action-required',
    };
  }
  if (setupSummary.host_runtime_ready !== true) {
    return {
      overall_status: 'action-required',
      reason_code: 'child-host-runtime-action-required',
    };
  }
  if (mode !== 'verify') {
    const relevantItems = ((child.payload.tool_facts && child.payload.tool_facts.items) || [])
      .filter((entry) => entry.baseline_blocking === true || selectedIds.includes(entry.id));
    const actionRequired = relevantItems.find((entry) => entry.result === 'action-required');
    if (actionRequired) {
      return {
        overall_status: 'action-required',
        reason_code: actionRequired.reason_code || 'child-setup-action-required',
      };
    }
    const partial = relevantItems.find((entry) => entry.result !== 'ready');
    if (partial) {
      return {
        overall_status: 'partial',
        reason_code: partial.reason_code || 'child-setup-partial',
      };
    }
    return { overall_status: 'ready', reason_code: null };
  }
  const manifest = setupSummary.generated_runtime_manifest || {};
  if (['stale', 'missing'].includes(manifest.status)) {
    return {
      overall_status: 'action-required',
      reason_code: 'generated-runtime-manifest-refresh-required',
    };
  }
  return { overall_status: 'ready', reason_code: null };
}

function buildVerifyChildResult(child, candidate, context) {
  const payload = child && child.payload ? child.payload : {};
  const setupSummary = payload.runtime_capabilities && payload.runtime_capabilities.setup_summary
    ? payload.runtime_capabilities.setup_summary
    : {};
  const manifest = { ...(setupSummary.generated_runtime_manifest || {
    status: 'unknown',
    reason_code: 'not-reported',
  }) };
  const manifestRefreshRequired = ['stale', 'missing'].includes(manifest.status);
  const childRuntimeAction = runtimeInitAction(context.host, {
    repo: portableWorkspacePath(candidate.workspace_relative_path),
  });
  if (manifestRefreshRequired) manifest.next_action = childRuntimeAction;
  const nextActions = [];
  for (const item of (payload.tool_facts && payload.tool_facts.items) || []) {
    if (item.next_action) nextActions.push(item.next_action);
  }
  for (const readiness of (payload.tool_facts && payload.tool_facts.provider_readiness) || []) {
    nextActions.push(...(readiness.next_actions || []));
  }
  if (manifestRefreshRequired) nextActions.push(childRuntimeAction);
  return {
    schema_version: 'mcp-verify-child-result.v1',
    baseline_ready: setupSummary.baseline_ready === true,
    generated_runtime_manifest: manifest,
    tool_facts_status: payload.write_result && payload.write_result.status
      ? payload.write_result.status
      : 'unknown',
    runtime_capabilities_status: payload.write_result && payload.write_result.status
      ? payload.write_result.status
      : 'unknown',
    reason_code: child && child.reason_code ? child.reason_code : '',
    next_actions: [...new Set(nextActions.filter(Boolean))],
  };
}

function buildWorkspaceSetupSummary(context, results) {
  const counts = countWorkspaceResults(results, { includePartial: true });
  let overallStatus = 'ready';
  if (counts.total === 0 || counts.action_required === counts.total) overallStatus = 'action-required';
  else if (counts.partial > 0 || counts.action_required > 0) overallStatus = 'partial';
  return {
    schema_version: 'workspace-mcp-setup-summary.v1',
    generated_at: new Date().toISOString(),
    advisory: true,
    workflow_mode: 'all-repos',
    selection_source: context.target.selection_source,
    workspace_root: context.target.workspace_root,
    parent_writes_repo_local_artifacts: false,
    results,
    counts,
    overall_status: overallStatus,
    reason_code: counts.total === 0
      ? 'workspace-no-git-candidates'
      : (overallStatus === 'ready' ? null : 'all-repos-partial-or-action-required'),
    next_action: overallStatus === 'ready'
      ? '所有 child repo 均已完成 MCP setup。若需父目录双层图，再跑：spec-mcp-setup --only codegraph,graphify --workspace-graph --repos <a,b,...>（不要用 --workspace-graph --all-repos）。'
      : (counts.action_required > 0
        ? '检查每个 child 的 reason_code，并为 action-required repo 重新运行 setup。'
        : '当前 child repo 仅完成 selected subset；运行标准 spec-mcp-setup 并用 --verify-only 复核完整 readiness。'),
    dual_path_hint: {
      child_batch: 'spec-mcp-setup --only codegraph,graphify --all-repos',
      workspace_graph: 'spec-mcp-setup --only codegraph,graphify --workspace-graph --repos <a,b,...>',
      ban: 'Do not combine --workspace-graph with --all-repos as the graph confirm path.',
    },
  };
}

function buildWorkspaceVerifySummary(context, results, computeGeneratedRuntimeManifestHealth) {
  const workspaceRoot = context.target.workspace_root;
  const quarantine = buildParentArtifactQuarantine({
    workspaceRoot,
    homeDir: context.homeDir,
  });
  let quarantineWriteStatus = 'ready';
  let quarantineWriteReasonCode = null;
  try {
    writeWorkspaceSummary(workspaceRoot, quarantine);
  } catch (error) {
    quarantineWriteStatus = 'degraded';
    quarantineWriteReasonCode = error.reason_code || 'workspace-quarantine-write-failed';
  }
  const parentRuntimeAction = runtimeInitAction(context.host);
  const childRuntimeAction = runtimeInitAction(context.host, { repo: '<child>' });
  const allReposRuntimeAction = runtimeInitAction(context.host, { allRepos: true });
  const parentManifest = computeGeneratedRuntimeManifestHealth(context, workspaceRoot);
  const parentManifestRefreshRequired = ['stale', 'missing'].includes(parentManifest.status);
  if (parentManifestRefreshRequired) parentManifest.next_action = parentRuntimeAction;
  const counts = countWorkspaceResults(results, { includeManifests: true });
  const manifestCounts = counts.generated_runtime_manifest;
  const childManifestRefreshRequired = manifestCounts.stale + manifestCounts.missing > 0;
  let overallStatus;
  if (counts.total === 0) overallStatus = 'action-required';
  else if (parentManifestRefreshRequired) overallStatus = counts.ready > 0 ? 'partial' : 'action-required';
  else if (counts.action_required === 0) overallStatus = 'ready';
  else overallStatus = counts.ready > 0 ? 'partial' : 'action-required';
  const manifestRefreshRequired = parentManifestRefreshRequired || childManifestRefreshRequired;
  const pollutionCount = quarantine.quarantined_paths.length;
  const runtimeHints = [];
  if (pollutionCount > 0 && quarantineWriteStatus === 'ready') {
    runtimeHints.push(`- 检测到 workspace 污染：已写入 .spec-first/workspace/parent-artifact-quarantine.json（quarantine ${pollutionCount} 条路径）。运行 \`spec-first clean --workspace-orphans\` 进行只读检查。`);
  }
  if (manifestRefreshRequired) {
    runtimeHints.push(`- Parent workspace 或一个以上 child repo 的 generated runtime manifest 已 stale 或缺失。对 parent workspace runtime 运行 \`${parentRuntimeAction}\`；对 stale child repo 使用 \`${childRuntimeAction}\`，或显式运行 \`${allReposRuntimeAction}\` 批量刷新 child root。`);
  }
  return {
    schema_version: 'workspace-mcp-verify-summary.v1',
    generated_at: new Date().toISOString(),
    advisory: true,
    workflow_mode: 'all-repos',
    selection_source: context.target.selection_source,
    workspace_root: workspaceRoot,
    parent_workspace_advisory: {
      git_health: context.target.git_health || null,
      coverage_gap: context.target.coverage_gap || null,
      candidates_diagnostics: context.target.candidates_diagnostics || [],
      repair_action_available: context.target.git_health
        && context.target.git_health.status === 'broken-worktree',
      repair_command: context.target.git_health
        && context.target.git_health.status === 'broken-worktree'
        ? 'spec-first repair-worktree --dry-run'
        : null,
      diagnostic_action_available: context.target.git_health
        && context.target.git_health.status === 'corrupted-gitdir',
      diagnostic_command: context.target.git_health
        && context.target.git_health.status === 'corrupted-gitdir'
        ? 'git fsck'
        : null,
    },
    parent_writes_repo_local_artifacts: false,
    parent_generated_runtime_manifest: parentManifest,
    results,
    counts,
    overall_status: overallStatus,
    reason_code: counts.total === 0
      ? 'workspace-no-git-candidates'
      : (manifestRefreshRequired
        ? 'generated-runtime-manifest-refresh-required'
        : (overallStatus === 'ready' ? null : 'all-repos-partial-or-action-required')),
    parent_workspace_pollution_count: pollutionCount,
    quarantine_write_status: quarantineWriteStatus,
    quarantine_write_reason_code: quarantineWriteReasonCode,
    runtime_hints: runtimeHints,
    next_action: manifestRefreshRequired
      ? `从 parent workspace 运行 ${parentRuntimeAction} 刷新 parent runtime，或对 stale child repo 运行 ${childRuntimeAction}，然后重新 verify。`
      : (overallStatus === 'ready'
        ? '所有 child repo 均已验证必需 MCP/helper dependency readiness。父目录双层图请用 --workspace-graph --repos <清单> 构建/复核（勿用 --workspace-graph --all-repos）。'
        : '检查每个 child 的 reason_code，并为 action-required repo 重新运行 setup/verify。'),
    dual_path_hint: {
      child_batch_verify: 'spec-mcp-setup --verify-only --all-repos',
      workspace_graph_status: 'spec-mcp-setup --workspace-graph-status --repos <a,b,...>',
      ban: 'Do not combine --workspace-graph with --all-repos as the graph confirm path.',
    },
  };
}

function countWorkspaceResults(results, { includePartial = false, includeManifests = false } = {}) {
  const counts = {
    total: results.length,
    ready: 0,
    action_required: 0,
  };
  if (includePartial) counts.partial = 0;
  const manifests = includeManifests
    ? { current: 0, stale: 0, missing: 0, unknown: 0 }
    : null;
  for (const entry of results) {
    if (entry.overall_status === 'ready') counts.ready += 1;
    else if (!includePartial) counts.action_required += 1;
    else if (entry.overall_status === 'partial') counts.partial += 1;
    else if (entry.overall_status === 'action-required') counts.action_required += 1;

    if (manifests) {
      const status = entry.result
        && entry.result.generated_runtime_manifest
        && entry.result.generated_runtime_manifest.status;
      if (Object.prototype.hasOwnProperty.call(manifests, status)) manifests[status] += 1;
      else manifests.unknown += 1;
    }
  }
  if (manifests) counts.generated_runtime_manifest = manifests;
  return counts;
}

function runtimeInitAction(host, { repo = '', allRepos = false } = {}) {
  const hostFlag = host ? `--${host} ` : '';
  if (allRepos) return `spec-first init ${hostFlag}--all-repos -y -u <name>`;
  if (repo) {
    const repoArg = repo === '<child>' ? repo : quoteRuntimeExampleArg(repo);
    return `spec-first init ${hostFlag}--repo ${repoArg} -y -u <name>`;
  }
  return `spec-first init ${hostFlag}-y -u <name>`;
}

function quoteRuntimeExampleArg(value) {
  const normalized = String(value || '');
  return /^[A-Za-z0-9_./:\\-]+$/.test(normalized) ? normalized : JSON.stringify(normalized);
}

function portableWorkspacePath(value) {
  return String(value || '').replaceAll('\\', '/');
}

function writeWorkspaceSummary(workspaceRoot, payload) {
  const root = path.resolve(workspaceRoot);
  const initialRoot = fs.statSync(root);
  const canonicalRoot = fs.realpathSync.native(root);
  const directory = ensureContainedDirectory(root, path.join(root, '.spec-first', 'workspace'), {
    reasonCode: 'workspace-summary-symlink-escape',
    mode: 0o700,
  });
  const names = {
    'parent-artifact-quarantine.v1': 'parent-artifact-quarantine.json',
    'workspace-mcp-setup-summary.v1': 'mcp-setup-summary.json',
    'workspace-mcp-verify-summary.v1': 'mcp-verify-summary.json',
  };
  const name = names[payload.schema_version];
  if (!name) {
    throw reasonError('workspace-summary-schema-unsupported', `不支持的 workspace summary schema：${payload.schema_version}`);
  }
  const target = path.join(directory, name);
  assertContainedPath(root, target, { reasonCode: 'workspace-summary-symlink-escape' });
  const temp = path.join(directory, `.${name}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  assertContainedPath(root, temp, { reasonCode: 'workspace-summary-symlink-escape' });
  try {
    fs.writeFileSync(temp, renderJson(payload), { flag: 'wx', mode: 0o600 });
    assertWorkspaceRootUnchanged(root, canonicalRoot, initialRoot);
    assertContainedPath(root, directory, { reasonCode: 'workspace-summary-symlink-escape' });
    assertContainedPath(root, target, { reasonCode: 'workspace-summary-symlink-escape' });
    assertContainedPath(root, temp, { reasonCode: 'workspace-summary-symlink-escape' });
    fs.renameSync(temp, target);
    assertContainedPath(root, target, { reasonCode: 'workspace-summary-symlink-escape' });
    return target;
  } finally {
    try {
      if (fs.existsSync(temp)) fs.unlinkSync(temp);
    } catch (_error) {
      // 主写入错误仍是权威结果。
    }
  }
}

function assertWorkspaceRootUnchanged(root, canonicalRoot, initialStat) {
  const currentStat = fs.statSync(root);
  if (fs.realpathSync.native(root) !== canonicalRoot
    || currentStat.dev !== initialStat.dev
    || currentStat.ino !== initialStat.ino) {
    throw reasonError('workspace-summary-symlink-escape', '写入 summary 期间 workspace root 已发生变化');
  }
}

module.exports = {
  buildWorkspaceSetupSummary,
  buildWorkspaceVerifySummary,
  runWorkspaceBatch,
};
