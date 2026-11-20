'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const CANONICAL_HOSTS = Object.freeze(['claude', 'codex', 'cursor', 'kiro', 'opencode', 'qoder', 'zcode', 'pi']);
const CANONICAL_HOST_SET = new Set(CANONICAL_HOSTS);
// Each host registers all generated projected roots of spec-runtime-setup (relative paths under the repo root, separated by forward slashes).
// Claude projects the workflow_command to the root of managed workflows; the roots of other host workflows are accordingly.
// skills rootSynchronize with src/cli adapters' skillsRoot/workflowsRoot——
// tests/unit/mcp-setup-config-consumers.test.js"'s drift-guard test case enforces this consistency.
const HOST_SKILL_SURFACES = Object.freeze({
  claude: Object.freeze(['.claude/spec-first/workflows']),
  codex: Object.freeze(['.agents/skills']),
  cursor: Object.freeze(['.cursor/skills']),
  kiro: Object.freeze(['.kiro/skills']),
  qoder: Object.freeze(['.qoder/skills']),
  opencode: Object.freeze(['.opencode/skills']),
  // ZCode discovers skills from the same shared AGENTS.md-ecosystem root Codex
  // projects to; resolveLoadedHostSurface returns every host bound to the
  // matched surface so a zcode pin confirms against the shared root.
  zcode: Object.freeze(['.agents/skills']),
  // Pi's official project-level skills discovery also includes shared .agents/skills (current working directory and ancestor directories).
  // Therefore, pi pin is verified similarly to codex/zcode through shared root confirmation.
  pi: Object.freeze(['.agents/skills']),
});

function resolveHostAuthority({
  env = process.env,
  mutationRequested = false,
  candidates = [],
  skillRoot = null,
  targetIdentity = null,
  enforceSurfaceBinding = false,
  now = new Date(),
} = {}) {
  const advisoryCandidates = uniqueCanonicalHosts(candidates);
  const pin = typeof env.MCP_SETUP_HOST === 'string' ? env.MCP_SETUP_HOST : '';

  if (pin && !CANONICAL_HOST_SET.has(pin)) {
    return {
      status: mutationRequested ? 'blocked' : 'advisory',
      host: null,
      candidates: advisoryCandidates,
      authority_source: null,
      mutation_authorized: false,
      reason_code: 'host-authority-invalid',
    };
  }

  if (pin) {
    if (enforceSurfaceBinding) {
      const loadedSurface = resolveLoadedHostSurface(skillRoot);
      // Shared surfaces (e.g. `.agents/skills/` bound to both codex and zcode)
      // confirm the pin when the pinned host is among the surface's owners;
      // the receipt keeps the first-match host for stable evidence display.
      const pinBoundToSurface = Boolean(loadedSurface && Array.isArray(loadedSurface.hosts)
        && loadedSurface.hosts.includes(pin));
      const verificationStatus = !loadedSurface
        ? 'unverified'
        : (pinBoundToSurface ? 'confirmed' : 'rejected');
      const reasonCode = !loadedSurface
        ? 'host-invocation-surface-unverified'
        : (pinBoundToSurface
          ? 'host-authority-loaded-root-bound'
          : 'host-invocation-surface-mismatch');
      const receipt = buildInvocationReceipt({
        host: pin,
        loadedSurface,
        skillRoot,
        targetIdentity,
        verificationStatus,
        reasonCode,
        now,
      });
      if (verificationStatus !== 'confirmed') {
        return {
          status: mutationRequested ? 'blocked' : 'advisory',
          host: null,
          candidates: advisoryCandidates,
          authority_source: 'MCP_SETUP_HOST+loaded-skill-root',
          mutation_authorized: false,
          reason_code: reasonCode,
          invocation_receipt: receipt,
        };
      }
      return {
        status: 'ready',
        host: pin,
        candidates: advisoryCandidates,
        authority_source: 'MCP_SETUP_HOST+loaded-skill-root',
        mutation_authorized: true,
        reason_code: reasonCode,
        invocation_receipt: receipt,
      };
    }
    return {
      status: 'ready',
      host: pin,
      candidates: advisoryCandidates,
      authority_source: 'MCP_SETUP_HOST',
      mutation_authorized: true,
      reason_code: 'host-authority-ready',
    };
  }

  if (mutationRequested) {
    return {
      status: 'blocked',
      host: null,
      candidates: advisoryCandidates,
      authority_source: null,
      mutation_authorized: false,
      reason_code: 'host-authority-required',
    };
  }

  return {
    status: 'advisory',
    host: null,
    candidates: advisoryCandidates,
    authority_source: null,
    mutation_authorized: false,
    reason_code: advisoryCandidates.length > 0
      ? 'host-candidate-advisory'
      : 'host-undetermined-advisory',
  };
}

function resolveLoadedHostSurface(skillRoot) {
  if (typeof skillRoot !== 'string' || !skillRoot) return null;
  let canonicalRoot;
  try {
    // Use Node's platform-compatible spelling so Windows 8.3 aliases remain
    // consistent with paths returned by the host runtime and tests.
    canonicalRoot = fs.realpathSync(path.resolve(skillRoot));
  } catch (_error) {
    return null;
  }
  const normalized = canonicalRoot.split(path.sep).join('/').replace(/\/$/, '');
  let matchedSurfaceId = null;
  for (const surfaceIds of Object.values(HOST_SKILL_SURFACES)) {
    for (const surfaceId of surfaceIds) {
      if (normalized.endsWith(`/${surfaceId}/spec-runtime-setup`)) {
        matchedSurfaceId = surfaceId;
        break;
      }
    }
    if (matchedSurfaceId !== null) break;
  }
  if (matchedSurfaceId === null) {
    return null;
  }
  // Shared face (e.g. `.agents/skills/` simultaneously binding to codex and zcode) returns all bindings to this face
  // Host; different surface suffixes are mutually exclusive, and at most one surfaceId can match per path.
  const hosts = Object.entries(HOST_SKILL_SURFACES)
    .filter(([, surfaceIds]) => surfaceIds.includes(matchedSurfaceId))
    .map(([host]) => host);
  if (hosts.length === 0) {
    return null;
  }
  return { host: hosts[0], hosts, surface_id: matchedSurfaceId, skill_root: canonicalRoot };
}

function buildInvocationReceipt({
  host,
  loadedSurface,
  skillRoot,
  targetIdentity,
  verificationStatus,
  reasonCode,
  now,
}) {
  const issuedAt = now instanceof Date ? now : new Date(now);
  const receipt = {
    schema_version: 'host-invocation-receipt/v1',
    producer: 'skills/spec-runtime-setup/scripts/setup.cjs',
    verification_status: verificationStatus,
    reason_code: reasonCode,
    host,
    loaded_host: loadedSurface ? loadedSurface.host : null,
    // When a shared face (such as .agents/skills binding both codex/zcode) is involved, the receipt must prove the PIN.
    // The host is indeed bound to this face; otherwise, the consumer would only see the first-match host and mistakenly reject the pin.
    surface_hosts: loadedSurface && Array.isArray(loadedSurface.hosts)
      ? [...loadedSurface.hosts]
      : [],
    surface_id: loadedSurface ? loadedSurface.surface_id : null,
    skill_root: loadedSurface ? loadedSurface.skill_root : path.resolve(String(skillRoot || '.')),
    canonical_entry_name: 'spec-runtime-setup',
    target_identity: targetIdentity ? String(targetIdentity) : 'unresolved',
    issued_at: issuedAt.toISOString(),
    freshness_expires_at: new Date(issuedAt.getTime() + (5 * 60 * 1000)).toISOString(),
    enforcement_status: loadedSurface ? 'loaded-root-checked' : 'loaded-root-unverified',
  };
  return {
    ...receipt,
    receipt_sha256: crypto.createHash('sha256').update(JSON.stringify(receipt)).digest('hex'),
  };
}

function uniqueCanonicalHosts(candidates) {
  const result = [];
  const seen = new Set();
  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    const value = String(candidate);
    if (!CANONICAL_HOST_SET.has(value) || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

module.exports = {
  CANONICAL_HOSTS,
  HOST_SKILL_SURFACES,
  buildInvocationReceipt,
  resolveHostAuthority,
  resolveLoadedHostSurface,
};
