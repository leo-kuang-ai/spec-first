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
  const hasLifecycleEvidence = Object.keys(lifecycle).length > 0;
  const projectState = !hasLifecycleEvidence ? null : (!lifecycle.installed
    ? 'provider-not-installed'
    : (!lifecycle.initialized || !lifecycle.artifact_exists
      ? 'project-not-initialized'
      : (!lifecycle.indexed ? 'project-not-indexed' : (!queryVerified ? 'query-unverified' : null))));
  return {
    readiness_scope: provider.readiness_scope === 'installation'
      ? (lifecycle.installed && lifecycle.configured ? 'installation-ready' : 'installation-incomplete')
      : (installIndexReady ? 'install-index-ready' : 'install-index-incomplete'),
    probe_status: serverReachable && queryVerified
      ? 'server-and-query-verified'
      : (queryVerified ? 'query-verified' : 'query-unverified'),
    currentness_status: status,
    reason_code: provider.reason_code
      || projectState
      || (status === 'unknown' && installIndexReady
        ? 'currentness-not-verified-in-read-only-check'
        : (status === 'fresh' ? 'ready' : 'status-not-reported')),
  };
}

function providerHeadline(provider, display) {
  const name = provider.provider || provider.id || 'unknown';
  const lifecycle = provider.lifecycle || {};
  const query = lifecycle.query_verified === true ? '已验证' : '未验证';
  const server = name === 'codegraph' ? `；MCP 连通性${lifecycle.server_reachable === true ? '已验证' : '未验证'}` : '';
  const freshness = display.currentness_status === 'unknown' ? '未验证' : display.currentness_status;
  return `- ${name}: CLI 查询${query}；索引新鲜度：${freshness}${server} (${display.reason_code})`;
}

module.exports = { providerDisplayFacts, providerHeadline };
