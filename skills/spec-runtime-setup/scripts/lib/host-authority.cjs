'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const CANONICAL_HOSTS = Object.freeze(['claude', 'codex', 'cursor', 'kiro', 'opencode', 'qoder']);
const CANONICAL_HOST_SET = new Set(CANONICAL_HOSTS);
const HOST_SKILL_SURFACES = Object.freeze({
  claude: '.claude/skills',
  codex: '.agents/skills',
  cursor: '.cursor/skills',
  kiro: '.kiro/skills',
  qoder: '.qoder/skills',
  opencode: '.opencode/skills',
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
      const verificationStatus = !loadedSurface
        ? 'unverified'
        : (loadedSurface.host === pin ? 'confirmed' : 'rejected');
      const reasonCode = !loadedSurface
        ? 'host-invocation-surface-unverified'
        : (loadedSurface.host === pin
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
    canonicalRoot = fs.realpathSync.native
      ? fs.realpathSync.native(path.resolve(skillRoot))
      : fs.realpathSync(path.resolve(skillRoot));
  } catch (_error) {
    return null;
  }
  const normalized = canonicalRoot.split(path.sep).join('/').replace(/\/$/, '');
  for (const [host, surfaceId] of Object.entries(HOST_SKILL_SURFACES)) {
    if (normalized.endsWith(`/${surfaceId}/spec-runtime-setup`)) {
      return { host, surface_id: surfaceId, skill_root: canonicalRoot };
    }
  }
  return null;
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
