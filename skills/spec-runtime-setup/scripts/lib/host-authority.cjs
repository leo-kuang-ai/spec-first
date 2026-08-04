'use strict';

const CANONICAL_HOSTS = Object.freeze(['claude', 'codex', 'cursor', 'kiro', 'opencode', 'qoder']);
const CANONICAL_HOST_SET = new Set(CANONICAL_HOSTS);

function resolveHostAuthority({
  env = process.env,
  mutationRequested = false,
  candidates = [],
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
  resolveHostAuthority,
};
