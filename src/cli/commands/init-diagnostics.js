
'use strict';

function printInitDiagnostics(plan) {
  const diagnostics = collectInitDiagnostics(plan);
  for (const diagnostic of diagnostics) {
    const message = diagnostic && diagnostic.message ? diagnostic.message : String(diagnostic);
    if (diagnostic.level === 'warn') {
      console.warn(message);
    } else {
      console.log(message);
    }
  }
}

function collectInitDiagnostics(plan) {
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
