'use strict';

const LIFECYCLE_READY_FIELDS = [
  'installed',
  'configured',
  'initialized',
  'indexed',
  'artifact_exists',
];

function providerDisplayFacts(provider = {}) {
  const lifecycle = provider.lifecycle || {};
  const installIndexReady = LIFECYCLE_READY_FIELDS.every((field) => lifecycle[field] === true);
  const queryVerified = lifecycle.query_verified === true;
  const serverReachable = lifecycle.server_reachable === true;
  const status = provider.readiness_status || 'unknown';
  return {
    readiness_scope: installIndexReady ? 'install-index-ready' : 'install-index-incomplete',
    probe_status: serverReachable && queryVerified
      ? 'server-and-query-verified'
      : (queryVerified ? 'query-verified' : 'query-unverified'),
    currentness_status: status,
    reason_code: provider.reason_code
      || (status === 'unknown' && installIndexReady
        ? 'currentness-not-verified-in-read-only-check'
        : (status === 'fresh' ? 'ready' : 'status-not-reported')),
  };
}

module.exports = { providerDisplayFacts };
