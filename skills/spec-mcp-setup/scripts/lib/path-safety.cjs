'use strict';

const fs = require('node:fs');
const path = require('node:path');

function reasonError(reasonCode, message, details = {}) {
  const error = new Error(message);
  error.reason_code = reasonCode;
  Object.assign(error, details);
  return error;
}

function isPathWithin(childPath, parentPath) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(childPath));
  return relative === '' || (
    relative !== '..'
    && !relative.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relative)
  );
}

function nearestExistingPath(candidatePath) {
  let current = path.resolve(candidatePath);
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) return current;
    current = parent;
  }
  return current;
}

function assertNoSymlinkSegments(rootPath, candidatePath, reasonCode) {
  const root = path.resolve(rootPath);
  const candidate = path.resolve(candidatePath);
  const relative = path.relative(root, candidate);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw reasonError(reasonCode, `路径越出 trusted root：${candidate}`, { root, candidate });
  }

  let current = root;
  const segments = relative === '' ? [] : relative.split(path.sep);
  for (const segment of segments) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) continue;
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) {
      throw reasonError(reasonCode, `路径使用 symlink segment：${current}`, { root, candidate, segment: current });
    }
  }
}

function assertContainedPath(rootPath, candidatePath, options = {}) {
  const reasonCode = options.reasonCode || 'path-containment-failed';
  const root = path.resolve(rootPath);
  const candidate = path.resolve(candidatePath);
  if (!isPathWithin(candidate, root)) {
    throw reasonError(reasonCode, `路径越出 trusted root：${candidate}`, { root, candidate });
  }
  if (!fs.existsSync(root)) {
    throw reasonError(reasonCode, `trusted root 不存在：${root}`, { root, candidate });
  }
  if (fs.lstatSync(root).isSymbolicLink()) {
    throw reasonError(reasonCode, `trusted root 不得是 symlink：${root}`, { root, candidate });
  }

  const realRoot = fs.realpathSync.native(root);
  const nearest = nearestExistingPath(candidate);
  const realNearest = fs.realpathSync.native(nearest);
  if (!isPathWithin(realNearest, realRoot)) {
    throw reasonError(reasonCode, `路径通过 symlink 越出 trusted root：${candidate}`, {
      root,
      candidate,
      nearest,
      real_root: realRoot,
      real_nearest: realNearest,
    });
  }
  assertNoSymlinkSegments(root, candidate, reasonCode);
  return candidate;
}

function ensureContainedDirectory(rootPath, directoryPath, options = {}) {
  const absolute = assertContainedPath(rootPath, directoryPath, options);
  fs.mkdirSync(absolute, { recursive: true, mode: options.mode || 0o700 });
  assertContainedPath(rootPath, absolute, options);
  if (fs.lstatSync(absolute).isSymbolicLink()) {
    throw reasonError(options.reasonCode || 'path-containment-failed', `目录已变为 symlink：${absolute}`);
  }
  return absolute;
}

module.exports = {
  assertContainedPath,
  ensureContainedDirectory,
  isPathWithin,
  nearestExistingPath,
  reasonError,
};
