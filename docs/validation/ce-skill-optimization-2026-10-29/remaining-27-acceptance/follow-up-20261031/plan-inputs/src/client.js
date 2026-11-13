'use strict';

function failure(code, message) {
  return Object.assign(new Error(message), { code });
}

function createClient(outcomes = []) {
  let attempts = 0;
  const applied = [];
  return {
    get attempts() { return attempts; },
    get applied() { return applied.slice(); },
    async send(rows) {
      const outcome = outcomes[attempts++] || 'ok';
      if (!Array.isArray(rows) || rows.some((row) => !row || typeof row.id !== 'string' || !row.id.trim())) {
        throw failure('INVALID_ORDER', 'Invalid order rows');
      }
      if (outcome === 'transient') throw failure('TRANSIENT_BEFORE_SEND', 'Request not sent');
      if (outcome === 'auth') throw failure('AUTH_FAILED', 'Access denied');
      if (outcome === 'unknown') throw failure('UNCLASSIFIED', 'Unclassified failure');
      applied.push(...rows.map((row) => row.id));
      if (outcome === 'ambiguous') throw failure('OUTCOME_UNKNOWN', 'Response unavailable');
      return { imported: rows.length };
    },
  };
}

module.exports = { createClient };
