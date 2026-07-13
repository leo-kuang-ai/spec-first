'use strict';

function isBaselineBlocking(entry = {}) {
  if (entry.baseline_blocking !== undefined) return entry.baseline_blocking === true;
  return entry.required !== false;
}

module.exports = {
  isBaselineBlocking,
};
