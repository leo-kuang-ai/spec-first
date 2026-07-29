
'use strict';

const { getInitMessages } = require('../init-i18n');

function printInitDiagnostics(plan, options = {}) {
  const messages = getInitMessages(options.lang || 'en');
  const diagnostics = collectInitDiagnostics(plan);
  const seen = new Set();
  for (const diagnostic of diagnostics) {
    const normalized = diagnostic && typeof diagnostic === 'object'
      ? diagnostic
      : { message: String(diagnostic) };
    const knownMessage = knownDiagnosticMessage(normalized.code, messages);
    const message = knownMessage || normalized.message || String(diagnostic);
    const dedupeKey = knownMessage
      ? `known:${normalized.code}`
      : `raw:${normalized.code || ''}:${message}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    if (normalized.level === 'warn') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }
}

function collectInitDiagnostics(plan) {
  if (Array.isArray(plan)) {
    return plan.flatMap((entry) => collectInitDiagnostics(entry));
  }
  if (!plan || typeof plan !== 'object') {
    return [];
  }
  if (plan.mode === 'all-repos') {
    return [
      ...(plan.parentPlan ? collectInitDiagnostics(plan.parentPlan) : []),
      ...(Array.isArray(plan.childPlans)
        ? plan.childPlans.flatMap((entry) => collectInitDiagnostics(entry.plan))
        : []),
    ];
  }
  return Array.isArray(plan.diagnostics) ? plan.diagnostics : [];
}

function knownDiagnosticMessage(code, messages) {
  if (code === 'cursor_generated_runtime_preview') {
    return messages.diagnosticCursorGeneratedRuntimePreview;
  }
  if (code === 'qoder_hook_activation_unverified') {
    return messages.diagnosticQoderHookActivationUnverified;
  }
  if (code === 'opencode_generated_runtime_preview') {
    return messages.diagnosticOpenCodeGeneratedRuntimePreview;
  }
  return '';
}

function collectInitErrors(plan) {
  if (!plan || typeof plan !== 'object') {
    return [];
  }
  if (plan.mode === 'all-repos') {
    return [
      ...(plan.parentPlan ? collectInitErrors(plan.parentPlan) : []),
      ...(Array.isArray(plan.childPlans)
        ? plan.childPlans.flatMap((entry) => collectInitErrors(entry.plan))
        : []),
    ];
  }
  return Array.isArray(plan.errors) ? plan.errors : [];
}

function collectPlanErrorMessages(plan) {
  return (Array.isArray(plan.errors) ? plan.errors : [])
    .map((error) => error.message || String(error))
    .filter(Boolean)
    .join('\n');
}

module.exports = {
  collectInitDiagnostics,
  collectInitErrors,
  collectPlanErrorMessages,
  printInitDiagnostics,
};
