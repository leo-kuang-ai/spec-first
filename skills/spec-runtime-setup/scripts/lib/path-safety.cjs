'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

function lstatIfPresent(filename) {
  try { return fs.lstatSync(filename); } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function reasonError(reasonCode, message, details = {}) {
  const error = new Error(message);
  error.reason_code = reasonCode;
  Object.assign(error, details);
  return error;
}

function isAbsolutePath(value) {
  return typeof value === 'string'
    && (path.isAbsolute(value) || path.win32.isAbsolute(value));
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
  while (!lstatIfPresent(current)) {
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
    const stat = lstatIfPresent(current);
    if (stat && stat.isSymbolicLink()) {
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

  // Inspect each segment with lstat; dangling links are not absent paths.
  assertNoSymlinkSegments(root, candidate, reasonCode);
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
  return candidate;
}

function writeContainedFile(rootPath, filename, contents, options = {}) {
  const absolute = assertContainedPath(rootPath, filename, options);
  const reasonCode = options.reasonCode || 'path-containment-failed';
  const initial = lstatIfPresent(absolute);
  if (initial && !initial.isFile()) throw reasonError(reasonCode, `Target is not a regular file: ${absolute}`);
  const temporary = path.join(path.dirname(absolute), `.spec-first-write-${randomUUID()}`);
  let created = false;
  try {
    // Exclusive same-directory staging and rename avoid following the destination leaf or modifying hardlink peers.
    const descriptor = fs.openSync(temporary, 'wx', initial ? initial.mode & 0o777 : 0o600);
    created = true;
    try {
      fs.writeFileSync(descriptor, contents, 'utf8');
      if (initial) fs.fchmodSync(descriptor, initial.mode & 0o777);
    } finally {
      fs.closeSync(descriptor);
    }
    assertContainedPath(rootPath, absolute, options);
    const current = lstatIfPresent(absolute);
    if (initial ? (!current || current.dev !== initial.dev || current.ino !== initial.ino || current.mtimeMs !== initial.mtimeMs || current.size !== initial.size) : current) {
      throw reasonError(reasonCode, `Target changed before publication: ${absolute}`);
    }
    fs.renameSync(temporary, absolute);
    created = false;
  } finally {
    if (created) fs.unlinkSync(temporary);
  }
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
  isAbsolutePath,
  isPathWithin,
  nearestExistingPath,
  reasonError,
  writeContainedFile,
};
