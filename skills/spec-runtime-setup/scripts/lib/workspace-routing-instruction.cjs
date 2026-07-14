'use strict';

// U5 — cwd-aware routing instruction content (A2 / CR10).
//
// spec-first injects this best-effort guidance block into the requirement
// workspace's host entry files so an interactive agent launched there uses the
// right graph:
//   - pass CodeGraph `projectPath` for the child the cwd is inside;
//   - use the workspace merged Graphify graph for cross-repo questions;
//   - launch-from-child / missing-projectPath fallback → default to the
//     enclosing child;
//   - framed as best-effort/advisory (not a deterministic resolver);
//   - honest CodeGraph degradation note for hosts the provider can't cover.
//
// This module owns the content plus a stable managed-block wrapper. The
// workspace-root writer lives in workspace-routing-inject.cjs; keeping content
// here makes both grouped entry files consistent and testable.

const path = require('node:path');

const BLOCK_START = '<!-- spec-first:workspace-routing start -->';
const BLOCK_END = '<!-- spec-first:workspace-routing end -->';
const CODEGRAPH_DEGRADED_HOSTS = new Set(['kiro', 'qoder']);

// 此片段保持为静态 source asset：可放入子仓文档，但不宣称 workspace graph、成员关系或
// CodeGraph provider 已获确认。受管 child routing 生命周期不属于本模块的合同。
function renderMemberGuidanceSnippet() {
  return [
    '### 子仓代码图引导',
    '',
    '- 问题只涉及当前子仓时，如 Provider 可用，以当前子仓作为 `projectPath` 使用 CodeGraph；其结果只是导航候选，重要结论仍需由源码、测试、diff 或日志确认。',
    '- 问题跨多个子仓时，回到非 Git 的需求父工作区。仅当 workspace graph 状态和目标仓范围均已确认时才使用 Graphify；随后直接检查候选子仓。',
    '- 不要假设 workspace graph 存在或仍然 current，不要从此片段推断成员关系，也不要把任一 Provider 输出当作语义证明。',
  ].join('\n');
}

function renderRoutingInstruction({ workspaceRoot, repos = [], host = null, hosts = [] } = {}) {
  const label = escapeMarkdownText(workspaceRoot ? path.basename(workspaceRoot) : 'workspace');
  const repoList = repos.length
    ? repos.map((r) => `  - ${renderInlineCode(r.repo_id || r.workspace_relative_path)}`).join('\n')
    : '  - (none resolved yet — run workspace graph setup)';
  const selectedHosts = [...new Set([
    ...(Array.isArray(hosts) ? hosts : []),
    ...(host ? [host] : []),
  ].map((entry) => String(entry).toLowerCase()))];
  const degradedHosts = selectedHosts.filter((entry) => CODEGRAPH_DEGRADED_HOSTS.has(entry));

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
    '- **Freshness gate:** run `spec-runtime-setup --workspace-graph-status` before graph use. Use graph candidates only when status is `ready`; on `partial`/`stale`, fall back to direct source reads and refresh with `spec-runtime-setup --only codegraph,graphify --workspace-graph --repos <a,b,...>`.',
    '',
    'Child repos in this workspace:',
    repoList,
  ];
  if (degradedHosts.length > 0) {
    lines.push(
      '',
      `- **Note (${degradedHosts.join('/')}):** CodeGraph is running in honest-degraded mode on these hosts (provider install does not natively cover them); rely on Graphify + direct source reads for tactical questions.`,
    );
  }
  lines.push(BLOCK_END);
  return lines.join('\n');
}

function escapeMarkdownText(value) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/([\\`*_[\]<>#])/g, '\\$1');
}

function renderInlineCode(value) {
  const text = String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ');
  const longest = Math.max(0, ...Array.from(text.matchAll(/`+/g), (match) => match[0].length));
  const fence = '`'.repeat(longest + 1);
  const padding = text.startsWith('`') || text.endsWith('`') ? ' ' : '';
  return `${fence}${padding}${text}${padding}${fence}`;
}

// Idempotent upsert of the managed routing block into an existing document body.
function upsertRoutingBlock(existing, block) {
  const body = typeof existing === 'string' ? existing : '';
  assertRoutingBlockShape(body);
  const stripped = stripRoutingBlock(body);
  const base = stripped.length && !stripped.endsWith('\n') ? `${stripped}\n` : stripped;
  const sep = base.length ? '\n' : '';
  return `${base}${sep}${block}\n`;
}

function stripRoutingBlock(contents) {
  const shape = assertRoutingBlockShape(contents);
  if (!shape.present) return contents;
  const start = shape.start;
  const endIdx = shape.end;
  const before = contents.slice(0, start).replace(/\n+$/, '');
  const after = contents.slice(endIdx + BLOCK_END.length).replace(/^\n+/, '');
  return [before, after].filter(Boolean).join('\n');
}

function assertRoutingBlockShape(contents) {
  const starts = Array.from(contents.matchAll(new RegExp(escapeRegex(BLOCK_START), 'g')), (match) => match.index);
  const ends = Array.from(contents.matchAll(new RegExp(escapeRegex(BLOCK_END), 'g')), (match) => match.index);
  if (starts.length === 0 && ends.length === 0) return { present: false, start: -1, end: -1 };
  if (starts.length !== 1 || ends.length !== 1 || starts[0] >= ends[0]) {
    const error = new Error('workspace-routing-block-malformed');
    error.reason_code = 'workspace-routing-block-malformed';
    throw error;
  }
  return { present: true, start: starts[0], end: ends[0] };
}

// Status must validate the shared routing contract, not the exact host subset
// that happened to write the block. A partial host projection is valid for the
// hosts it targets; Kiro/Qoder only add an informational degradation note.
function isRoutingInstructionCurrent(contents, { workspaceRoot, repos = [] } = {}) {
  let shape;
  try {
    shape = assertRoutingBlockShape(contents);
  } catch (_error) {
    return false;
  }
  if (!shape.present) return false;

  const actual = contents.slice(shape.start, shape.end + BLOCK_END.length);
  const expected = renderRoutingInstruction({ workspaceRoot, repos, hosts: [] });
  return normalizeRoutingContract(actual) === normalizeRoutingContract(expected);
}

function normalizeRoutingContract(block) {
  return String(block)
    .split('\n')
    .filter((line) => line && !line.startsWith('- **Note ('))
    .join('\n');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  renderRoutingInstruction,
  renderMemberGuidanceSnippet,
  upsertRoutingBlock,
  stripRoutingBlock,
  BLOCK_START,
  BLOCK_END,
  CODEGRAPH_DEGRADED_HOSTS,
  assertRoutingBlockShape,
  isRoutingInstructionCurrent,
};
