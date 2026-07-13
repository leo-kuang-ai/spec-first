'use strict';

// U5 — cwd-aware routing instruction content (A2 / CR10).
//
// spec-first injects this best-effort guidance block into each supported host's
// managed runtime asset so an interactive agent, launched from a requirement
// workspace, uses the right graph:
//   - pass CodeGraph `projectPath` for the child the cwd is inside;
//   - use the workspace merged Graphify graph for cross-repo questions;
//   - launch-from-child / missing-projectPath fallback → default to the
//     enclosing child;
//   - framed as best-effort/advisory (not a deterministic resolver);
//   - honest CodeGraph degradation note for hosts the provider can't cover.
//
// This module owns the CONTENT + a stable managed-block wrapper. The per-host
// injection (writing into each adapter's managed asset) is done by the adapter
// layer; this keeps the content single-sourced and testable.

const path = require('node:path');

const BLOCK_START = '<!-- spec-first:workspace-routing start -->';
const BLOCK_END = '<!-- spec-first:workspace-routing end -->';
const CODEGRAPH_DEGRADED_HOSTS = new Set(['kiro', 'qoder']);

function renderRoutingInstruction({ workspaceRoot, repos = [], host = null } = {}) {
  const label = workspaceRoot ? path.basename(workspaceRoot) : 'workspace';
  const repoList = repos.length
    ? repos.map((r) => `  - \`${r.repo_id || r.workspace_relative_path}\``).join('\n')
    : '  - (none resolved yet — run workspace graph setup)';
  const degraded = host && CODEGRAPH_DEGRADED_HOSTS.has(String(host).toLowerCase());

  const lines = [
    BLOCK_START,
    `## Workspace code graphs (per-requirement: ${label})`,
    '',
    'This folder is a multi-repo requirement workspace. Graphs are advisory candidates — confirm important conclusions against source.',
    '',
    '- **Tactical (per repo):** query CodeGraph with `projectPath` set to the child repo your cwd is inside. This is **best-effort routing**, not a deterministic resolver.',
    '- **Cross-repo:** for questions spanning repos, use Graphify CLI against `.graphify/merged-graph.json` (`query` / `path` / `explain`). **Do not cat** `graph.json` or `merged-graph.json` into context (files may be tens or hundreds of MB).',
    '- **Fallback:** if launched from inside a child and `projectPath` is omitted, default to that enclosing child. If launched from the **parent root**, there is **no safe default** — pick an explicit child `projectPath` or use the merged Graphify graph for cross-repo questions. Never query the CodeGraph server root (no index).',
    '- **Isolation:** stay within this workspace; do not pass a `projectPath` pointing at another requirement folder.',
    '',
    'Child repos in this workspace:',
    repoList,
  ];
  if (degraded) {
    lines.push(
      '',
      `- **Note (${host}):** CodeGraph is running in honest-degraded mode on this host (provider install does not natively cover it); rely on Graphify + direct source reads for tactical questions.`,
    );
  }
  lines.push(BLOCK_END);
  return lines.join('\n');
}

// Idempotent upsert of the managed routing block into an existing document body.
function upsertRoutingBlock(existing, block) {
  const body = typeof existing === 'string' ? existing : '';
  const stripped = stripRoutingBlock(body);
  const base = stripped.length && !stripped.endsWith('\n') ? `${stripped}\n` : stripped;
  const sep = base.length ? '\n' : '';
  return `${base}${sep}${block}\n`;
}

function stripRoutingBlock(contents) {
  if (!contents.includes(BLOCK_START)) return contents;
  const start = contents.indexOf(BLOCK_START);
  const endIdx = contents.indexOf(BLOCK_END);
  if (endIdx === -1) return contents;
  const before = contents.slice(0, start).replace(/\n+$/, '');
  const after = contents.slice(endIdx + BLOCK_END.length).replace(/^\n+/, '');
  return [before, after].filter(Boolean).join('\n');
}

module.exports = {
  renderRoutingInstruction,
  upsertRoutingBlock,
  stripRoutingBlock,
  BLOCK_START,
  BLOCK_END,
  CODEGRAPH_DEGRADED_HOSTS,
};
