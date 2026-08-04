
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function canonicalizeExistingPath(targetPath) {
  const resolved = path.resolve(targetPath);
  try {
    return fs.realpathSync.native(resolved);
  } catch (_error) {
    return resolved;
  }
}

function isPathWithin(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function toWorkspaceRelativePath(childPath, workspaceRoot) {
  const relative = path.relative(workspaceRoot, childPath);
  return relative === '' ? '.' : relative.split(path.sep).join('/');
}

function validateContainedWorkspaceWritePath(workspaceRoot, filePath) {
  const rootReal = fs.realpathSync.native(path.resolve(workspaceRoot));
  const nearest = nearestExistingPath(filePath);
  const nearestReal = fs.realpathSync.native(nearest);
  if (!isPathWithin(nearestReal, rootReal)) {
    return {
      ok: false,
      reason_code: 'workspace-summary-symlink-escape',
    };
  }
  return { ok: true, reason_code: null };
}

function nearestExistingPath(targetPath) {
  let current = path.resolve(targetPath);
  while (true) {
    if (fs.existsSync(current)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return current;
    }
    current = path.dirname(current);
  }
}

module.exports = {
  canonicalizeExistingPath,
  isPathWithin,
  nearestExistingPath,
  toWorkspaceRelativePath,
  validateContainedWorkspaceWritePath,
};
