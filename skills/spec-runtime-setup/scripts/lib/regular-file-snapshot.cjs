'use strict';

const fs = require('node:fs');
const path = require('node:path');

function readStableRegularFile(filePath, {
  accessMode = null,
  read = (descriptor) => fs.readFileSync(descriptor),
  rootPath = null,
} = {}) {
  const pathChainBefore = rootPath === null
    ? null
    : snapshotDirectoryChain(rootPath, filePath);
  if (pathChainBefore && !pathChainBefore.ok) {
    return { ok: false, status: 'unsafe-path', error: pathChainBefore.error };
  }
  let descriptor = null;
  try {
    const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0);
    descriptor = fs.openSync(filePath, flags);
  } catch (error) {
    return failedOpen(error);
  }

  try {
    const before = fs.fstatSync(descriptor);
    if (!before.isFile()) return { ok: false, status: 'not-regular', error: null };
    if (accessMode !== null) {
      try {
        fs.accessSync(filePath, accessMode);
      } catch (error) {
        return { ok: false, status: 'access-denied', error };
      }
    }

    const value = read(descriptor, before);
    const after = fs.fstatSync(descriptor);
    let current;
    try {
      current = fs.lstatSync(filePath);
    } catch (error) {
      return { ok: false, status: 'unstable', error };
    }
    if (!sameGeneration(before, after)
      || !current.isFile()
      || current.isSymbolicLink()
      || !sameGeneration(after, current)) {
      return { ok: false, status: 'unstable', error: null };
    }
    if (pathChainBefore) {
      const pathChainAfter = snapshotDirectoryChain(rootPath, filePath);
      if (!pathChainAfter.ok || !sameDirectoryChain(pathChainBefore.entries, pathChainAfter.entries)) {
        return { ok: false, status: 'unstable', error: pathChainAfter.error || null };
      }
    }
    return { ok: true, status: 'stable', value, stat: snapshotStat(after) };
  } catch (error) {
    return { ok: false, status: 'unreadable', error };
  } finally {
    if (descriptor !== null) {
      try { fs.closeSync(descriptor); } catch (_error) { /* preserve the snapshot result */ }
    }
  }
}

function snapshotDirectoryChain(rootPath, filePath) {
  const root = path.resolve(rootPath);
  const target = path.resolve(filePath);
  const relative = path.relative(root, target);
  if (relative === ''
    || relative === '..'
    || relative.startsWith(`..${path.sep}`)
    || path.isAbsolute(relative)) {
    return { ok: false, entries: [], error: null };
  }

  const directories = [root];
  let current = root;
  for (const segment of relative.split(path.sep).slice(0, -1)) {
    current = path.join(current, segment);
    directories.push(current);
  }
  try {
    const entries = directories.map((directory) => {
      const stat = fs.lstatSync(directory);
      if (!stat.isDirectory() || stat.isSymbolicLink()) {
        throw new Error(`unsafe directory segment: ${directory}`);
      }
      return { path: directory, stat };
    });
    return { ok: true, entries, error: null };
  } catch (error) {
    return { ok: false, entries: [], error };
  }
}

function sameDirectoryChain(before, after) {
  return before.length === after.length && before.every((entry, index) => (
    entry.path === after[index].path && sameDirectoryIdentity(entry.stat, after[index].stat)
  ));
}

function sameDirectoryIdentity(left, right) {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.mode === right.mode;
}

function failedOpen(error) {
  if (error && error.code === 'ENOENT') return { ok: false, status: 'missing', error };
  if (error && ['ELOOP', 'EISDIR'].includes(error.code)) {
    return { ok: false, status: 'not-regular', error };
  }
  return { ok: false, status: 'unreadable', error };
}

function sameGeneration(left, right) {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.size === right.size
    && left.mode === right.mode
    && left.mtimeMs === right.mtimeMs
    && left.ctimeMs === right.ctimeMs;
}

function snapshotStat(stat) {
  return {
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode,
    size: stat.size,
    mtime_ms: stat.mtimeMs,
    ctime_ms: stat.ctimeMs,
  };
}

module.exports = {
  readStableRegularFile,
};
