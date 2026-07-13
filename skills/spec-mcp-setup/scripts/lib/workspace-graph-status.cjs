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
const { resolveWorkspaceTargets } = require('./workspace-target.cjs');
const {
  resolveContainedProjectPath,
  classifyGraphFreshness,
} = require('./workspace-graph-scope.cjs');
const { BLOCK_START } = require('./workspace-routing-instruction.cjs');

function runWorkspaceGraphStatus({
  cwd = process.cwd(),
  repos = [],
  allowDiscovery = true,
  manifestPath = null,
} = {}) {
  const targets = resolveWorkspaceTargets({ cwd, repos, allowDiscovery, manifestPath });
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

  const workspaceRoot = targets.workspace_root;
  const confirmed = targets.repos.filter((repo) => !repo.needs_confirm);
  const pendingConfirm = targets.repos.filter((repo) => repo.needs_confirm);

  const repoFacts = confirmed.map((repo) => {
    const codegraphDir = path.join(repo.git_root, '.codegraph');
    const codegraphPresent = fs.existsSync(codegraphDir);
    const projectPathCheck = resolveContainedProjectPath(workspaceRoot, repo.git_root);
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
      project_path: projectPathCheck.ok ? projectPathCheck.project_path : null,
      project_path_contained: projectPathCheck.ok,
      project_path_enforcement: 'advisory',
      freshness,
    };
  });

  const mergedPath = path.join(workspaceRoot, '.graphify', 'merged-graph.json');
  const graphifyDir = path.join(workspaceRoot, '.graphify');
  const graphifyPresent = fs.existsSync(graphifyDir);
  const mergedPresent = fs.existsSync(mergedPath);
  const workspaceFreshness = classifyGraphFreshness({
    scope_id: path.basename(workspaceRoot),
    scope_kind: 'workspace',
    provider: 'graphify',
    freshness: mergedPresent ? 'complete' : (graphifyPresent ? 'partial' : 'unknown'),
    hasResults: mergedPresent ? true : null,
    limitations: mergedPresent
      ? []
      : ['no-merged-graph — run --workspace-graph to build'],
  });

  // Default projectPath for CR10 doctor check: first confirmed child if any.
  // The global MCP server root itself has no index; agents must pass projectPath.
  let defaultProjectPath = null;
  let defaultProjectPathContained = false;
  if (confirmed.length > 0) {
    const check = resolveContainedProjectPath(workspaceRoot, confirmed[0].git_root);
    defaultProjectPath = check.ok ? check.project_path : null;
    defaultProjectPathContained = check.ok;
  }

  const routing = inspectRoutingPresence(workspaceRoot);

  const anyGraph = repoFacts.some((r) => r.codegraph_present) || mergedPresent;
  const allChildGraphs = repoFacts.length > 0 && repoFacts.every((r) => r.codegraph_present);
  let status = 'absent';
  if (anyGraph && allChildGraphs && mergedPresent) status = 'ready';
  else if (anyGraph) status = 'partial';
  if (pendingConfirm.length > 0 && confirmed.length === 0) status = 'needs-confirmation';

  return {
    schema_version: 'workspace-graph-status.v1',
    status,
    topology: targets.topology,
    reason_code: status === 'ready' ? '' : status,
    workspace_root: workspaceRoot,
    pending_confirm: pendingConfirm.map((r) => r.repo_id),
    repos: repoFacts,
    workspace: {
      graphify_dir: graphifyDir,
      graphify_present: graphifyPresent,
      merged_graph_path: mergedPath,
      merged_present: mergedPresent,
      freshness: workspaceFreshness,
    },
    routing,
    // CR10: doctor-facing default projectPath (first child). Not a hard gate.
    default_project_path: defaultProjectPath,
    default_project_path_contained: defaultProjectPathContained,
    server_root_default_note:
      'CodeGraph global MCP server root has no workspace index; agents must pass projectPath. Default below is the first confirmed child (advisory).',
  };
}

function inspectRoutingPresence(workspaceRoot) {
  const files = ['CLAUDE.md', 'AGENTS.md'];
  const entries = [];
  for (const rel of files) {
    const abs = path.join(workspaceRoot, rel);
    if (!fs.existsSync(abs)) {
      entries.push({ entry_file: rel, present: false, has_routing_block: false });
      continue;
    }
    const body = fs.readFileSync(abs, 'utf8');
    entries.push({
      entry_file: rel,
      present: true,
      has_routing_block: body.includes(BLOCK_START),
    });
  }
  return { entries };
}

module.exports = {
  runWorkspaceGraphStatus,
};
