
'use strict';

function buildProjectInitResult(exitCode) {
  return { exit_code: exitCode };
}

function normalizeProjectInitResult(result) {
  if (typeof result === 'number') {
    return buildProjectInitResult(result);
  }
  if (result && typeof result === 'object') {
    return {
      exit_code: Number.isFinite(result.exit_code) ? result.exit_code : 1,
    };
  }
  return buildProjectInitResult(1);
}

function getInitExitCode(result) {
  return normalizeProjectInitResult(result).exit_code;
}

module.exports = {
  buildProjectInitResult,
  getInitExitCode,
  normalizeProjectInitResult,
};
