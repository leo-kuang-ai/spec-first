'use strict';

const MAX_REPAIR_ATTEMPTS = 2;

const DEFAULT_REPAIR_ACTIONS = Object.freeze({
  'graphify-scope-provenance-artifact-mismatch': 'graphify-refresh',
  'graphify-query-verification-failed': 'graphify-refresh',
  'codegraph-query-probe-failed': 'codegraph-reprobe',
});

function defaultRepairFor(reasonCode) {
  return DEFAULT_REPAIR_ACTIONS[reasonCode] || null;
}

/**
 * 执行 registry 提供的有界修复；修复动作本身由调用方执行，避免 loop
 * 越权推断命令。每次尝试后必须重新读取 readiness/probe 结果。
 */
function runBoundedRepairLoop({ initial, repairFor, apply, verify, maxAttempts = MAX_REPAIR_ATTEMPTS } = {}) {
  let state = initial;
  const attempts = [];
  let previousReason = null;
  for (let index = 0; index <= maxAttempts; index += 1) {
    if (state && state.ready === true) return { state, attempts, status: 'ready' };
    const reasonCode = state && state.reason_code;
    if (!reasonCode || reasonCode === previousReason || index === maxAttempts) {
      return { state, attempts, status: 'action-required' };
    }
    const action = repairFor(reasonCode, state);
    if (!action) return { state, attempts, status: 'blocked' };
    const entry = { attempt: index + 1, reason_code: reasonCode, action };
    const result = apply(action, state);
    entry.exit_code = result && Number.isInteger(result.exit_code) ? result.exit_code : null;
    entry.applied = Boolean(result && result.ok);
    if (!entry.applied) { attempts.push(entry); return { state, attempts, status: 'action-required' }; }
    state = verify(action, result);
    entry.post_probe = state && state.ready === true ? 'verified' : 'not-ready';
    attempts.push(entry);
    previousReason = reasonCode;
  }
  return { state, attempts, status: 'action-required' };
}

module.exports = { DEFAULT_REPAIR_ACTIONS, MAX_REPAIR_ATTEMPTS, defaultRepairFor, runBoundedRepairLoop };
