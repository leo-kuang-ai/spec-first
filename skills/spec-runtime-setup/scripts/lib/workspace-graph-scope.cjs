'use strict';

// U4 — Workspace scope containment + freshness fact shaping.
//
// Two responsibilities, both advisory/deterministic:
//   1. `resolveContainedProjectPath` — CR6 enforcement point. A projectPath
//      handed to CodeGraph must resolve inside the current workspace root;
//      cross-workspace paths (another requirement folder) are rejected. This is
//      a spec-first-side advisory validation (facts/doctor + injected routing),
//      NOT a hard gate on the shared global MCP server (which spec-first does
//      not own) — callers must treat it accordingly.
//   2. `classifyGraphFreshness` — shapes a per-scope freshness fact where empty
//      / partial / stale / unknown results carry NO negative authority (CR12):
//      "no caller found" is never promoted to "no caller exists".

const path = require('node:path');
const { assertContainedPath } = require('./path-safety.cjs');

const FRESHNESS = Object.freeze(['complete', 'partial', 'stale', 'unknown']);

// Returns { ok, project_path } on success, or { ok:false, reason_code } when the
// requested projectPath escapes the workspace root. `enforcement` is always
// 'advisory' — documents that this is not a hard query-time gate.
function resolveContainedProjectPath(workspaceRoot, requested) {
  if (!requested || typeof requested !== 'string') {
    return { ok: false, reason_code: 'project-path-missing', enforcement: 'advisory' };
  }
  const absolute = path.isAbsolute(requested)
    ? path.resolve(requested)
    : path.resolve(workspaceRoot, requested);
  try {
    assertContainedPath(workspaceRoot, absolute, { reasonCode: 'project-path-outside-workspace' });
  } catch (error) {
    return {
      ok: false,
      reason_code: error.reason_code || 'project-path-outside-workspace',
      enforcement: 'advisory',
      requested,
    };
  }
  return { ok: true, project_path: absolute, enforcement: 'advisory' };
}

// Shape a per-scope freshness fact. `provider_status` is provider_untrusted
// input; `hasResults` false NEVER downgrades to a negative claim.
function classifyGraphFreshness({
  scope_id,
  scope_kind, // 'child' | 'workspace'
  provider, // 'codegraph' | 'graphify'
  freshness = 'unknown',
  limitations = [],
  hasResults = null,
} = {}) {
  const normalizedFreshness = FRESHNESS.includes(freshness) ? freshness : 'unknown';
  const negativeAuthority = false; // empty/partial/stale/unknown never prove absence.
  const emptyMeaning = hasResults === false
    ? 'no-results-not-absence'
    : (hasResults === true ? 'has-results' : 'unknown');
  return {
    schema_version: 'workspace-graph-freshness.v1',
    scope_id,
    scope_kind,
    provider,
    freshness: normalizedFreshness,
    negative_authority: negativeAuthority,
    empty_meaning: emptyMeaning,
    limitations: Array.isArray(limitations) ? limitations.slice() : [],
    // Only script-observed facts are confirmed; provider content stays advisory.
    trust: 'provider_untrusted',
  };
}

module.exports = {
  resolveContainedProjectPath,
  classifyGraphFreshness,
  FRESHNESS,
};
