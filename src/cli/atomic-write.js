const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// Windows rename-over-existing is not atomic and can transiently fail with EPERM/EACCES/
// EBUSY when the destination is briefly held by an antivirus real-time scan, the search
// indexer, or another open handle. POSIX rename() has no such contention. Retry the rename
// a few times with a short backoff on those Windows-transient codes before giving up.
const RENAME_RETRY_CODES = new Set(['EPERM', 'EACCES', 'EBUSY']);
const RENAME_RETRY_ATTEMPTS = 10;
const RENAME_RETRY_DELAY_MS = 20;

function createAtomicTempPath(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const suffix = crypto.randomBytes(6).toString('hex');
  return path.join(dir, `.${base}.${process.pid}.${Date.now()}.${suffix}.tmp`);
}

function sleepMsBlocking(ms) {
  // Synchronous backoff without adding an async signature to the shared write helper.
  // Atomicity of the rename retry does not benefit from yielding the event loop here, and
  // the callers (init/state writes) are already synchronous.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function renameWithWindowsRetry(tmpPath, filePath) {
  // Only the destination-contention codes are retried; all other errors (ENOENT, ENOSPC,
  // cross-device, etc.) throw immediately so real failures are not masked by the backoff.
  if (process.platform !== 'win32') {
    fs.renameSync(tmpPath, filePath);
    return;
  }
  for (let attempt = 1; ; attempt += 1) {
    try {
      fs.renameSync(tmpPath, filePath);
      return;
    } catch (error) {
      if (!RENAME_RETRY_CODES.has(error && error.code) || attempt >= RENAME_RETRY_ATTEMPTS) {
        throw error;
      }
      sleepMsBlocking(RENAME_RETRY_DELAY_MS);
    }
  }
}

function writeFileAtomic(filePath, contents, encoding = 'utf8') {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = createAtomicTempPath(filePath);
  try {
    fs.writeFileSync(tmpPath, contents, encoding);
    renameWithWindowsRetry(tmpPath, filePath);
  } catch (error) {
    fs.rmSync(tmpPath, { force: true });
    throw error;
  }
}

function writeFileAtomicIfAbsent(filePath, contents, encoding = 'utf8') {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmpPath = createAtomicTempPath(filePath);
  let linked = false;
  try {
    fs.writeFileSync(tmpPath, contents, encoding);
    fs.linkSync(tmpPath, filePath);
    linked = true;
  } catch (error) {
    fs.rmSync(tmpPath, { force: true });
    throw error;
  }
  if (linked) {
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch (_error) {
      // The final artifact is already linked; leftover temp cleanup is best-effort.
    }
  }
}

module.exports = {
  createAtomicTempPath,
  writeFileAtomic,
  writeFileAtomicIfAbsent,
};
