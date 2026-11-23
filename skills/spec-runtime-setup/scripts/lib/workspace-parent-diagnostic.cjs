'use strict';

// Parent-workspace diagnostic for non-Git multi-repo requirement folders.
//
// bare/check on a requirement parent must NOT look like a single-repo setup
// failure (facts missing / providers not-reported). Parent does not write
// repo-local setup facts; use dual-path next_actions instead.

const path = require('node:path');
const { renderCommand } = require('./command-display.cjs');
const {
  runWorkspaceGraphStatus,
} = require('./workspace-graph-status.cjs');

function buildParentWorkspaceDiagnostic({
  cwd = process.cwd(),
  target = null,
  host = null,
  repos = [],
  runStatus = runWorkspaceGraphStatus,
} = {}) {
  const workspaceRoot = (target && target.workspace_root) || cwd;
  const candidates = Array.isArray(target && target.candidates) ? target.candidates : [];
  const candidateIds = candidates.map((c) => c.repo_label || c.workspace_relative_path || path.basename(c.git_root || '')).filter(Boolean);
  const reposArg = Array.isArray(repos) ? repos.filter(Boolean) : [];
  const status = typeof runStatus === 'function'
    ? runStatus({
      cwd: workspaceRoot,
      repos: reposArg,
      allowDiscovery: reposArg.length === 0,
    })
    : null;

  const statusCommand = renderCommand(['spec-runtime-setup', '--workspace-graph-status', ...(reposArg.length ? ['--repos', reposArg.join(',')] : [])]);
  const buildIds = reposArg.length ? reposArg : [...new Set([
    ...((status && status.repos) || []).map((repo) => repo.repo_id), ...((status && status.pending_confirm) || []),
  ])];
  const buildCommand = renderCommand(['spec-runtime-setup', '--only', 'codegraph,graphify', '--workspace-graph', ...(buildIds.length ? ['--repos', buildIds.join(',')] : [])]);
  const dualPaths = {
    child_provider_setup: {
      purpose: 'per-child CodeGraph/Graphify/MCP/host config',
      commands: [
        ...(reposArg.length
          ? reposArg.map((repo) => renderCommand(['spec-runtime-setup', '--plan', '--only', 'codegraph,graphify', '--repo', repo]))
          : [renderCommand(['spec-runtime-setup', '--plan', '--only', 'codegraph,graphify', '--all-repos'])]),
      ],
    },
    workspace_two_layer_graph: {
      purpose: 'per-child CodeGraph + workspace Graphify merged graph + routing block',
      commands: [
        buildCommand,
        statusCommand,
        'spec-first clean --workspace-graph [--repos a,b] [--dry-run]',
      ],
      do_not: [
        'Do not use --workspace-graph --all-repos together as the graph confirm path; --all-repos is for child batch only. Confirm the repo set with --repos or .spec-first/workspace.yaml.',
      ],
    },
  };

  const nextActions = [];
  nextActions.push(
    'This is a non-Git multi-repo requirement parent: parent-local tool-facts/provider rows are not_applicable (not a failure).',
  );
  nextActions.push(
    `先核对双层图状态：${statusCommand}`,
    ...dualPaths.child_provider_setup.commands.map((command) => `逐仓预览 provider 配置：${command}`),
  );
  if (status && status.status === 'ready') {
    nextActions.push(
      `Workspace two-layer graph is ready (merged). Recheck: ${dualPaths.workspace_two_layer_graph.commands[1]}`,
    );
  } else if (status && status.status === 'needs-confirmation') {
    nextActions.push(
      'Discovered child repos need confirmation before building the workspace graph.',
    );
    nextActions.push(
      `Confirm repos then build: ${dualPaths.workspace_two_layer_graph.commands[0]}`,
    );
  } else if (status && (status.status === 'absent' || status.status === 'partial')) {
    nextActions.push(`核对仓清单并确认需要构建后：${buildCommand}`);
  } else if (status && status.status === 'invalid') {
    nextActions.push(`先修正工作区声明：${status.reason_code}。`);
    for (const entry of status.rejected || []) nextActions.push(`${entry.path}: ${entry.reason_code}`);
  } else {
    nextActions.push(
      `Workspace two-layer graph: ${dualPaths.workspace_two_layer_graph.commands[0]}`,
    );
  }
  nextActions.push(...dualPaths.workspace_two_layer_graph.do_not);

  const overallStatus = deriveParentOverallStatus(status);

  return {
    schema_version: 'workspace-parent-diagnostic.v1',
    topology: 'requirement-workspace',
    workspace_root: workspaceRoot,
    host: host || null,
    parent_repo_local_facts: 'not_applicable',
    parent_provider_readiness: 'not_applicable',
    parent_facts_reason_code: 'parent-workspace-does-not-write-repo-local-setup-facts',
    selection_source: target && target.selection_source ? target.selection_source : '',
    discovered_repos: candidateIds,
    pending_confirm: status && Array.isArray(status.pending_confirm) ? status.pending_confirm : [],
    dual_paths: dualPaths,
    workspace_graph: status,
    next_actions: nextActions,
    overall_status: overallStatus,
    reason_code: overallStatus === 'ready'
      ? 'requirement-workspace-parent-diagnostic'
      : `workspace-graph-${status && status.status ? status.status : 'status-unavailable'}`,
  };
}

function deriveParentOverallStatus(status) {
  if (status && status.status === 'ready') return 'ready';
  if (status && status.status === 'partial') return 'partial';
  return 'action-required';
}

function renderParentWorkspaceDiagnosticHuman(payload) {
  const lines = [
    'Requirement workspace parent diagnostic (non-Git multi-repo)',
    `  topology: ${payload.topology}`,
    `  root: ${payload.workspace_root}`,
    `  parent repo-local facts: ${payload.parent_repo_local_facts} (${payload.parent_facts_reason_code})`,
    `  parent provider readiness: ${payload.parent_provider_readiness}`,
  ];
  if (payload.discovered_repos && payload.discovered_repos.length) {
    lines.push(`  discovered children: ${payload.discovered_repos.join(', ')}`);
  }
  if (payload.workspace_graph) {
    const wg = payload.workspace_graph;
    lines.push(`  workspace graph status: ${wg.status || 'unknown'}`);
    if (wg.workspace && wg.workspace.merged_size_bytes != null) {
      lines.push(`  merged graph size: ${wg.workspace.merged_size_bytes} bytes`);
    }
  }
  lines.push('', 'Two paths (do not confuse):');
  lines.push('  1) Child provider/MCP setup → --all-repos or --repo <child>');
  lines.push('  2) Parent two-layer graph → --workspace-graph --repos a,b (or workspace.yaml)');
  lines.push('  Do NOT use --workspace-graph --all-repos as the graph confirm path.');
  lines.push('', 'Next actions:');
  for (const action of payload.next_actions || []) {
    lines.push(`  - ${action}`);
  }
  return `${lines.join('\n')}\n`;
}

module.exports = {
  buildParentWorkspaceDiagnostic,
  renderParentWorkspaceDiagnosticHuman,
};
