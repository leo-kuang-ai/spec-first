'use strict';

// Workspace graph 的 build/status/clean 共用 writer lease。锁位于 `.spec-first/`，因此
// clean 删除 `graphify-out/` 时仍受保护；async wrapper 持锁，setup child 只校验继承 token。

const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const {
  assertContainedPath,
  ensureContainedDirectory,
  reasonError,
} = require('./path-safety.cjs');
const { processAlive, sleepSync } = require('./process-utils.cjs');
const {
  publishRegularFileNoClobber,
  restoreRegularFileNoClobber,
} = require('./regular-file-publication.cjs');

const LIFECYCLE_LOCK_BASENAME = 'workspace-graph-lifecycle.lock';
const LIFECYCLE_OWNER_BASENAME = 'owner.json';
const LIFECYCLE_LOCK_SCHEMA_VERSION = 'workspace-graph-lifecycle-lock.v2';
const LEGACY_LIFECYCLE_LOCK_SCHEMA_VERSION = 'workspace-graph-lifecycle-lock.v1';
const LIFECYCLE_TOKEN_ENV = 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPH_LEASE_TOKEN';
const LIFECYCLE_PID_ENV = 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPH_LEASE_PID';
const LIFECYCLE_START_ENV = 'SPEC_FIRST_INTERNAL_WORKSPACE_GRAPH_LEASE_START';
const ORPHANED_LOCK_GRACE_MS = 10 * 1000;

function processStartMarker(pid) {
  if (!Number.isInteger(Number(pid)) || Number(pid) <= 0) return null;
  const normalizedPid = Number(pid);
  if (process.platform === 'linux') {
    try {
      const raw = fs.readFileSync(`/proc/${normalizedPid}/stat`, 'utf8');
      const commandEnd = raw.lastIndexOf(')');
      if (commandEnd < 0) return null;
      const fields = raw.slice(commandEnd + 2).trim().split(/\s+/);
      const startTicks = fields[19];
      return startTicks ? `linux:${startTicks}` : null;
    } catch (_error) {
      return null;
    }
  }
  if (process.platform === 'win32') {
    const result = childProcess.spawnSync('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `(Get-Process -Id ${normalizedPid} -ErrorAction Stop).StartTime.ToUniversalTime().Ticks`,
    ], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 1500,
      windowsHide: true,
    });
    const marker = String(result.stdout || '').trim();
    return result.status === 0 && marker ? `win32:${marker}` : null;
  }
  const result = childProcess.spawnSync('ps', ['-p', String(normalizedPid), '-o', 'lstart='], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 1000,
    windowsHide: true,
  });
  const marker = String(result.stdout || '').trim().replace(/\s+/g, ' ');
  return result.status === 0 && marker ? `${process.platform}:${marker}` : null;
}

function processIdentityState(pid, expectedStartMarker) {
  if (!processAlive(Number(pid))) return 'dead';
  if (typeof expectedStartMarker !== 'string' || !expectedStartMarker) return 'unknown';
  const actual = processStartMarker(Number(pid));
  if (!actual) return 'unknown';
  return actual === expectedStartMarker ? 'matched' : 'mismatched';
}

function lifecycleLockPath(workspaceRoot) {
  const controlRoot = ensureContainedDirectory(
    workspaceRoot,
    path.join(workspaceRoot, '.spec-first'),
    { reasonCode: 'workspace-graph-lifecycle-path-invalid' },
  );
  return assertContainedPath(
    workspaceRoot,
    path.join(controlRoot, LIFECYCLE_LOCK_BASENAME),
    { reasonCode: 'workspace-graph-lifecycle-path-invalid' },
  );
}

function inspectWorkspaceGraphLifecycle(workspaceRoot, {
  now = Date.now,
  processIdentity = processIdentityState,
} = {}) {
  let controlRoot;
  let lockPath;
  try {
    controlRoot = assertContainedPath(
      workspaceRoot,
      path.join(workspaceRoot, '.spec-first'),
      { reasonCode: 'workspace-graph-lifecycle-path-invalid' },
    );
    lockPath = assertContainedPath(
      workspaceRoot,
      path.join(controlRoot, LIFECYCLE_LOCK_BASENAME),
      { reasonCode: 'workspace-graph-lifecycle-path-invalid' },
    );
  } catch (error) {
    return {
      status: 'invalid',
      reason_code: error.reason_code || 'workspace-graph-lifecycle-path-invalid',
      active_operation: null,
      quarantine_count: 0,
    };
  }

  const inspectSnapshot = (snapshot, quarantineCount) => {
    const stale = snapshotIsStale(snapshot, Number(now()), processIdentity);
    return {
      status: stale ? 'abandoned' : 'active',
      reason_code: stale
        ? 'workspace-graph-lifecycle-abandoned'
        : 'workspace-graph-lifecycle-busy',
      active_operation: snapshot.owner && snapshot.owner.operation
        ? snapshot.owner.operation
        : 'unknown',
      quarantine_count: quarantineCount,
    };
  };
  const countQuarantines = () => fs.readdirSync(controlRoot)
    .filter((name) => name.startsWith(`${LIFECYCLE_LOCK_BASENAME}.quarantine-`))
    .length;

  let quarantineCount = 0;
  try {
    if (fs.existsSync(controlRoot)) {
      const control = fs.lstatSync(controlRoot);
      if (!control.isDirectory() || control.isSymbolicLink()) {
        return {
          status: 'invalid',
          reason_code: 'workspace-graph-lifecycle-path-invalid',
          active_operation: null,
          quarantine_count: 0,
        };
      }
      quarantineCount = countQuarantines();
    }
  } catch (_error) {
    return {
      status: 'invalid',
      reason_code: 'workspace-graph-lifecycle-path-invalid',
      active_operation: null,
      quarantine_count: 0,
    };
  }

  const after = readSnapshot(lockPath);
  if (after) return inspectSnapshot(after, quarantineCount);

  try {
    if (fs.existsSync(controlRoot)) quarantineCount = Math.max(quarantineCount, countQuarantines());
  } catch (_error) {
    return {
      status: 'invalid',
      reason_code: 'workspace-graph-lifecycle-path-invalid',
      active_operation: null,
      quarantine_count: quarantineCount,
    };
  }
  const finalSnapshot = readSnapshot(lockPath);
  if (finalSnapshot) return inspectSnapshot(finalSnapshot, quarantineCount);
  if (fs.existsSync(lockPath)) {
    return {
      status: 'abandoned',
      reason_code: 'workspace-graph-lifecycle-abandoned',
      active_operation: 'unknown',
      quarantine_count: quarantineCount,
    };
  }
  if (quarantineCount > 0) {
    return {
      status: 'cleanup-incomplete',
      reason_code: 'workspace-graph-lifecycle-cleanup-incomplete',
      active_operation: null,
      quarantine_count: quarantineCount,
    };
  }
  return {
    status: 'none',
    reason_code: '',
    active_operation: null,
    quarantine_count: 0,
  };
}

function lifecycleStagingPath(workspaceRoot, lockPath, token) {
  return assertContainedPath(
    workspaceRoot,
    `${lockPath}.pending-${process.pid}-${token}`,
    { reasonCode: 'workspace-graph-lifecycle-path-invalid' },
  );
}

function readOwner(lockPath, lockStat = null) {
  try {
    const item = lockStat || fs.lstatSync(lockPath);
    if (item.isSymbolicLink()) return null;
    const ownerPath = item.isDirectory()
      ? path.join(lockPath, LIFECYCLE_OWNER_BASENAME)
      : lockPath;
    const ownerItem = fs.lstatSync(ownerPath);
    if (!ownerItem.isFile() || ownerItem.isSymbolicLink()) return null;
    return JSON.parse(fs.readFileSync(ownerPath, 'utf8'));
  } catch (_error) {
    return null;
  }
}

function readSnapshot(lockPath) {
  try {
    const stat = fs.lstatSync(lockPath);
    return {
      owner: readOwner(lockPath, stat),
      stat: {
        dev: stat.dev,
        ino: stat.ino,
        mtime_ms: stat.mtimeMs,
        size: stat.size,
      },
    };
  } catch (_error) {
    return null;
  }
}

function ownerFingerprint(owner) {
  if (!owner || typeof owner !== 'object') return null;
  return JSON.stringify({
    schema_version: owner.schema_version || null,
    token: owner.token || null,
    owner_pid: owner.owner_pid || null,
    owner_start_marker: owner.owner_start_marker || null,
    operation: owner.operation || null,
    created_at_ms: owner.created_at_ms || null,
  });
}

function snapshotsMatch(expected, actual) {
  return Boolean(expected && actual)
    && ownerFingerprint(expected.owner) === ownerFingerprint(actual.owner)
    && expected.stat.dev === actual.stat.dev
    && expected.stat.ino === actual.stat.ino
    && expected.stat.mtime_ms === actual.stat.mtime_ms
    && expected.stat.size === actual.stat.size;
}

function snapshotIsStale(snapshot, nowMs, processIdentity = processIdentityState) {
  if (!snapshot) return false;
  const owner = snapshot.owner;
  if (owner
    && (owner.schema_version === LIFECYCLE_LOCK_SCHEMA_VERSION
      || owner.schema_version === LEGACY_LIFECYCLE_LOCK_SCHEMA_VERSION)
    && typeof owner.token === 'string'
    && owner.token.length > 0
    && Number.isInteger(Number(owner.owner_pid))) {
    const identity = processIdentity(Number(owner.owner_pid), owner.owner_start_marker);
    if (identity === 'dead' || identity === 'mismatched') return true;
    // PID 仍存活但 start marker 无法确认时保持 fail closed。按年龄回收会在长任务、
    // 受限 ps/PowerShell 环境或 marker 短暂不可用时偷走真实 writer lease。
    return false;
  }
  return Math.max(0, nowMs - snapshot.stat.mtime_ms) > ORPHANED_LOCK_GRACE_MS;
}

function quarantineStaleLock(lockPath, snapshot, token, { remove = fs.rmSync } = {}) {
  const quarantinePath = `${lockPath}.quarantine-${process.pid}-${token}`;
  try {
    fs.renameSync(lockPath, quarantinePath);
  } catch (error) {
    if (error && error.code === 'ENOENT') return { status: 'contended' };
    return { status: 'failed', reason_code: 'workspace-graph-lifecycle-stale-lock-quarantine-failed' };
  }

  const quarantined = readSnapshot(quarantinePath);
  if (!snapshotsMatch(snapshot, quarantined)) {
    const restoration = restoreRegularFileNoClobber(quarantinePath, lockPath);
    if (restoration.status === 'contended') {
      try { fs.rmSync(quarantinePath, { recursive: true, force: true }); } catch (_error) { /* successor remains authoritative */ }
    } else if (restoration.status === 'failed') {
      return { status: 'failed', reason_code: 'workspace-graph-lifecycle-stale-lock-restore-failed' };
    }
    return { status: 'contended' };
  }

  try {
    remove(quarantinePath, { recursive: true, force: true });
    return { status: 'recovered' };
  } catch (_error) {
    const restoration = restoreRegularFileNoClobber(quarantinePath, lockPath);
    const ownershipRetained = restoration.status === 'restored'
      && ownerFingerprint(snapshot.owner) === ownerFingerprint(readOwner(lockPath));
    return {
      status: 'failed',
      reason_code: 'workspace-graph-lifecycle-stale-lock-cleanup-failed',
      ownership_retained: ownershipRetained,
    };
  }
}

function cleanupLifecycleQuarantines(lockPath, { remove = fs.rmSync } = {}) {
  const controlRoot = path.dirname(lockPath);
  const prefix = `${path.basename(lockPath)}.quarantine-`;
  let names;
  try {
    names = fs.readdirSync(controlRoot).filter((name) => name.startsWith(prefix));
  } catch (_error) {
    return { ok: false, reason_code: 'workspace-graph-lifecycle-quarantine-cleanup-failed' };
  }
  for (const name of names) {
    try {
      const target = assertContainedPath(controlRoot, path.join(controlRoot, name), {
        reasonCode: 'workspace-graph-lifecycle-path-invalid',
      });
      remove(target, { recursive: true, force: true });
    } catch (_error) {
      return { ok: false, reason_code: 'workspace-graph-lifecycle-quarantine-cleanup-failed' };
    }
  }
  return { ok: true, changed: names.length > 0, reason_code: null };
}

function ownerMatches(owner, credential) {
  return Boolean(owner && credential)
    && owner.schema_version === LIFECYCLE_LOCK_SCHEMA_VERSION
    && owner.token === credential.token
    && Number(owner.owner_pid) === Number(credential.owner_pid)
    && (owner.owner_start_marker || null) === (credential.owner_start_marker || null);
}

function publishOwnedLock({ workspaceRoot, lockPath, owner, token, beforePublish }) {
  const stagingPath = lifecycleStagingPath(workspaceRoot, lockPath, token);
  try {
    fs.writeFileSync(
      stagingPath,
      `${JSON.stringify(owner, null, 2)}\n`,
      { encoding: 'utf8', flag: 'wx', mode: 0o600 },
    );
  } catch (_error) {
    try { fs.rmSync(stagingPath, { recursive: true, force: true }); } catch (_ignored) { /* own staging only */ }
    return { status: 'failed', reason_code: 'workspace-graph-lifecycle-owner-write-failed' };
  }

  try {
    if (typeof beforePublish === 'function') beforePublish({ lockPath, stagingPath, owner });
  } catch (_error) {
    try { fs.rmSync(stagingPath, { recursive: true, force: true }); } catch (_ignored) { /* own staging only */ }
    if (fs.existsSync(lockPath)) return { status: 'contended' };
    return { status: 'failed', reason_code: 'workspace-graph-lifecycle-create-failed' };
  }
  // hard-link publication is preferred; exclusive copy preserves no-clobber
  // semantics on filesystems that reject hard links.
  const publication = publishRegularFileNoClobber(stagingPath, lockPath);
  try { fs.rmSync(stagingPath, { force: true }); } catch (_error) { /* canonical lease is already authoritative */ }
  if (publication.status === 'contended') return { status: 'contended' };
  if (publication.status !== 'published') {
    return { status: 'failed', reason_code: 'workspace-graph-lifecycle-create-failed' };
  }
  return { status: 'published' };
}

function ownedHandle({ lockPath, owner, inherited, releaseRemove = fs.rmSync }) {
  let releaseResult = null;
  const credential = Object.freeze({
    token: owner.token,
    owner_pid: owner.owner_pid,
    owner_start_marker: owner.owner_start_marker || null,
  });
  return {
    ok: true,
    acquired: !inherited,
    inherited: Boolean(inherited),
    reason_code: inherited
      ? 'workspace-graph-lifecycle-inherited'
      : 'workspace-graph-lifecycle-acquired',
    active_operation: owner.operation,
    lock_path: lockPath,
    credential,
    assertOwned(stage) {
      const current = readOwner(lockPath);
      const ownerIsUsable = ownerMatches(current, credential)
        && (!inherited || processAlive(Number(current.owner_pid)));
      if (ownerIsUsable) return current;
      throw reasonError(
        'workspace-graph-lifecycle-ownership-lost',
        `workspace graph lifecycle ownership lost at ${stage || 'unknown'}`,
        { lock_stage: stage || 'unknown' },
      );
    },
    release() {
      if (inherited) {
        return {
          ok: false,
          status: 'skipped',
          reason_code: 'workspace-graph-lifecycle-inherited-release-denied',
        };
      }
      if (releaseResult && releaseResult.status !== 'failed') return releaseResult;
      const snapshot = readSnapshot(lockPath);
      if (!snapshot || !ownerMatches(snapshot.owner, credential)) {
        releaseResult = {
          ok: false,
          status: 'skipped',
          reason_code: 'workspace-graph-lifecycle-owner-changed',
        };
        return releaseResult;
      }
      const priorCleanup = cleanupLifecycleQuarantines(lockPath, { remove: releaseRemove });
      if (!priorCleanup.ok) {
        releaseResult = {
          ok: false,
          status: 'failed',
          reason_code: 'workspace-graph-lifecycle-release-failed',
          ownership_retained: true,
        };
        return releaseResult;
      }
      const removal = quarantineStaleLock(lockPath, snapshot, crypto.randomUUID(), {
        remove: releaseRemove,
      });
      if (removal.status === 'recovered') {
        releaseResult = {
          ok: true,
          status: 'released',
          reason_code: 'workspace-graph-lifecycle-released',
        };
      } else if (removal.status === 'contended') {
        releaseResult = {
          ok: false,
          status: 'skipped',
          reason_code: 'workspace-graph-lifecycle-owner-changed',
        };
      } else {
        releaseResult = {
          ok: false,
          status: 'failed',
          reason_code: 'workspace-graph-lifecycle-release-failed',
          ownership_retained: removal.ownership_retained === true,
        };
      }
      return releaseResult;
    },
  };
}

function acquireWorkspaceGraphLifecycleLease({
  workspaceRoot,
  operation,
  pid = process.pid,
  now = Date.now,
  monotonicNow = monotonicNowMs,
  timeoutMs = 0,
  intervalMs = 25,
  sleep = sleepSync,
  releaseRemove = fs.rmSync,
  beforePublish = null,
  processIdentity = processIdentityState,
} = {}) {
  if (!workspaceRoot || !operation || !Number.isInteger(Number(pid)) || Number(pid) <= 0) {
    return { ok: false, acquired: false, reason_code: 'workspace-graph-lifecycle-input-invalid' };
  }

  let lockPath;
  try {
    lockPath = lifecycleLockPath(workspaceRoot);
  } catch (error) {
    return {
      ok: false,
      acquired: false,
      reason_code: error.reason_code || 'workspace-graph-lifecycle-path-invalid',
    };
  }

  const token = crypto.randomUUID();
  const ownerStartMarker = processStartMarker(Number(pid));
  const startedAtMs = monotonicNow();
  const normalizedTimeoutMs = Math.max(0, timeoutMs);
  const initialIntervalMs = Math.max(1, intervalMs);
  let nextIntervalMs = initialIntervalMs;
  let reclaimed = false;
  let shouldPublish = true;
  let contended = false;
  while (true) {
    if (shouldPublish) {
      if (contended
        && normalizedTimeoutMs > 0
        && monotonicNow() - startedAtMs >= normalizedTimeoutMs) {
        return lifecycleBusy(lockPath);
      }
      const owner = {
        schema_version: LIFECYCLE_LOCK_SCHEMA_VERSION,
        token,
        owner_pid: Number(pid),
        owner_start_marker: ownerStartMarker,
        operation,
        created_at_ms: now(),
      };
      const publication = publishOwnedLock({
        workspaceRoot,
        lockPath,
        owner,
        token,
        beforePublish,
      });
      if (publication.status === 'published') {
        return {
          ...ownedHandle({ lockPath, owner, inherited: false, releaseRemove }),
          reclaimed_stale_lock: reclaimed,
        };
      }
      if (publication.status === 'failed') {
        return { ok: false, acquired: false, reason_code: publication.reason_code };
      }
      contended = true;
      shouldPublish = false;
    }

    let nowMs = now();
    const snapshot = readSnapshot(lockPath);
    if (!snapshot) {
      shouldPublish = true;
      continue;
    }
    if (snapshotIsStale(snapshot, nowMs, processIdentity)) {
      const recovery = quarantineStaleLock(lockPath, snapshot, token);
      if (recovery.status === 'recovered') {
        reclaimed = true;
        shouldPublish = true;
        continue;
      }
      if (recovery.status === 'failed') {
        return { ok: false, acquired: false, reason_code: recovery.reason_code };
      }
      nowMs = now();
    }

    const elapsedMs = monotonicNow() - startedAtMs;
    if (elapsedMs >= normalizedTimeoutMs) {
      return lifecycleBusy(lockPath);
    }
    const remainingMs = Math.max(1, normalizedTimeoutMs - elapsedMs);
    sleep(Math.min(nextIntervalMs, remainingMs));
    nextIntervalMs = Math.min(nextIntervalMs * 2, 1000);
  }
}

function monotonicNowMs() {
  return performance.now();
}

function lifecycleBusy(lockPath) {
  const active = readOwner(lockPath);
  return {
    ok: false,
    acquired: false,
    reason_code: 'workspace-graph-lifecycle-busy',
    active_operation: active && active.operation ? active.operation : 'unknown',
  };
}

function validateWorkspaceGraphLifecycleLease({ workspaceRoot, credential } = {}) {
  if (!workspaceRoot || !credential || !credential.token || !credential.owner_pid) {
    return { ok: false, acquired: false, reason_code: 'workspace-graph-lifecycle-credential-invalid' };
  }
  let lockPath;
  try {
    lockPath = lifecycleLockPath(workspaceRoot);
  } catch (error) {
    return {
      ok: false,
      acquired: false,
      reason_code: error.reason_code || 'workspace-graph-lifecycle-path-invalid',
    };
  }
  const owner = readOwner(lockPath);
  const identity = owner && ownerMatches(owner, credential)
    ? processIdentityState(Number(owner.owner_pid), owner.owner_start_marker)
    : 'mismatched';
  if (!ownerMatches(owner, credential) || identity === 'dead' || identity === 'mismatched') {
    return { ok: false, acquired: false, reason_code: 'workspace-graph-lifecycle-ownership-lost' };
  }
  return ownedHandle({ lockPath, owner, inherited: true });
}

function workspaceGraphLifecycleEnv(lease, baseEnv = process.env) {
  const credential = lease && lease.credential;
  if (!credential) return { ...baseEnv };
  return {
    ...baseEnv,
    [LIFECYCLE_TOKEN_ENV]: credential.token,
    [LIFECYCLE_PID_ENV]: String(credential.owner_pid),
    ...(credential.owner_start_marker
      ? { [LIFECYCLE_START_ENV]: credential.owner_start_marker }
      : {}),
  };
}

function workspaceGraphLifecycleCredentialFromEnv(env = process.env) {
  const token = env && env[LIFECYCLE_TOKEN_ENV];
  const rawPid = env && env[LIFECYCLE_PID_ENV];
  const startMarker = env && env[LIFECYCLE_START_ENV];
  if (!token && !rawPid && !startMarker) return null;
  return {
    token: typeof token === 'string' ? token : '',
    owner_pid: Number(rawPid),
    owner_start_marker: typeof startMarker === 'string' && startMarker ? startMarker : null,
  };
}

module.exports = {
  LIFECYCLE_LOCK_BASENAME,
  LIFECYCLE_LOCK_SCHEMA_VERSION,
  LIFECYCLE_PID_ENV,
  LIFECYCLE_START_ENV,
  LIFECYCLE_TOKEN_ENV,
  ORPHANED_LOCK_GRACE_MS,
  acquireWorkspaceGraphLifecycleLease,
  inspectWorkspaceGraphLifecycle,
  processIdentityState,
  processStartMarker,
  validateWorkspaceGraphLifecycleLease,
  workspaceGraphLifecycleCredentialFromEnv,
  workspaceGraphLifecycleEnv,
};
