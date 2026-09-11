'use strict';

const path = require('node:path');

module.exports = function codegraphStatus(repoRoot, overrides = {}) {
  return JSON.stringify({
    initialized: true,
    version: '1.6.0',
    projectPath: repoRoot,
    indexPath: path.join(repoRoot, '.codegraph'),
    pendingChanges: { added: 0, modified: 0, removed: 0 },
    worktreeMismatch: null,
    index: { state: 'complete', pendingRefs: 0, reindexRecommended: false },
    ...overrides,
  });
};
