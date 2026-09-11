'use strict';

function legacyBlocking(entry) {
  if (entry.baseline_blocking !== undefined) return entry.baseline_blocking === true;
  return entry.required !== false;
}

function resolveReadinessPolicy(entry = {}, { selectedIds = [], workflows = [] } = {}) {
  const policy = entry.readiness_policy;
  let blocking = false;
  let demandSource = 'not-requested';
  let matchedRule = null;
  if (selectedIds.includes(entry.id)) {
    blocking = true;
    demandSource = 'explicit-selection';
    matchedRule = entry.id;
  } else if (!policy) {
    blocking = legacyBlocking(entry);
    demandSource = 'legacy';
  } else if (policy === 'always-required') {
    blocking = true;
    demandSource = 'baseline';
    matchedRule = policy;
  } else if (policy === 'workflow-required') {
    matchedRule = (entry.required_for || []).find((id) => workflows.includes(id)) || null;
    blocking = matchedRule !== null;
    if (blocking) demandSource = 'workflow';
  } else if (policy !== 'advisory') {
    throw new Error(`未知 readiness policy：${policy}`);
  }
  return {
    blocking,
    demand_source: demandSource,
    matched_rule: matchedRule,
    reason_code: blocking ? 'capability-required-for-scope' : 'capability-not-requested',
    migration_warning: policy ? null : 'legacy-readiness-policy',
  };
}

function applyReadinessPolicy(registry, context = {}) {
  const normalize = (entry) => {
    const policy = resolveReadinessPolicy(entry, context);
    return {
      ...entry,
      required: policy.blocking,
      baseline_blocking: policy.blocking,
      demand: policy,
    };
  };
  return { ...registry, tools: (registry.tools || []).map(normalize), helpers: (registry.helpers || []).map(normalize) };
}

function isBaselineBlocking(entry = {}) {
  return entry.demand ? entry.demand.blocking === true : resolveReadinessPolicy(entry).blocking;
}

module.exports = { isBaselineBlocking, resolveReadinessPolicy, applyReadinessPolicy };
