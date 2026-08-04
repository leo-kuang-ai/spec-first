
'use strict';

function buildRuntimeUntrackSummary(untrackDiagnostic = {}, applyResult = null) {
  const plannedReason = untrackDiagnostic.reason_code || 'none-tracked';
  const applied = applyResult && applyResult.runtime_untrack ? applyResult.runtime_untrack : null;
  const count = applied && plannedReason === 'untracked-runtime'
    ? applied.applied_count
    : Number(untrackDiagnostic.count || 0);
  const reasonCode = applied && plannedReason === 'untracked-runtime'
    ? applied.reason_code
    : plannedReason;

  return {
    count,
    reason_code: reasonCode || 'none-tracked',
    sample_paths: Array.isArray(untrackDiagnostic.sample_paths) ? untrackDiagnostic.sample_paths : [],
    diagnostic: applied && applied.diagnostic ? applied.diagnostic : (untrackDiagnostic.diagnostic || ''),
  };
}

function buildProjectInitResult(exitCode, untrackDiagnostic = {}) {
  return {
    exit_code: exitCode,
    runtime_untrack: buildRuntimeUntrackSummary(untrackDiagnostic),
  };
}

function normalizeProjectInitResult(result) {
  if (typeof result === 'number') {
    return buildProjectInitResult(result);
  }
  if (result && typeof result === 'object') {
    return {
      exit_code: Number.isFinite(result.exit_code) ? result.exit_code : 1,
      runtime_untrack: buildRuntimeUntrackSummary(result.runtime_untrack),
    };
  }
  return buildProjectInitResult(1);
}

function getInitExitCode(result) {
  return normalizeProjectInitResult(result).exit_code;
}

module.exports = {
  buildProjectInitResult,
  buildRuntimeUntrackSummary,
  getInitExitCode,
  normalizeProjectInitResult,
};
