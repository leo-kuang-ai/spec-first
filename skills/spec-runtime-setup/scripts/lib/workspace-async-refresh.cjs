'use strict';

// U4 — Workspace merged-graph 异步刷新原语（R7/R8/R9/KTD6）。
//
// spec-first 自有子仓 commit hook 在 commit 时触发全部 confirmed child 的 CodeGraph sync，
// 以及父目录 Graphify 子图/merged graph 重建。刷新昂贵，必须异步（commit 立即返回）、
// 并发安全（同一 workspace 绝不两个 writer 并行，否则 provider artifacts 可能 corrupt）、
// 失败可见（后台失败落盘 reason_code 供消费侧读取）。
//
// 边界：event coalesce 写 `<workspaceRoot>/graphify-out/` 下的 lock/status/pending；实际
// build/status writer 另持 `.spec-first/workspace-graph-lifecycle.lock`，与显式 build/clean
// 串行。路径均做 containment；重建命令由调用方传入 verified 绝对 launcher，本模块不解析 PATH。
//
// 协作契约（coalesce）：
//   - trigger：先发布 pending，再尝试 `wx` 独占创建带随机 token 的 starting lease。成功后
//     消费自己的 marker、detached 派发 wrapper 并把 owner 交接为 worker PID；已存在→starting
//     lease 先保留短 grace，running lease 只在 owner 进程已死时回收，否则返回 coalesced，
//     表示「有重建在跑，跑完请再来一轮」。
//   - wrapper（runMergedRebuildForeground）：先用 token claim worker ownership，再执行
//     do { 清 pending; 跑重建; 写 status } while(pending)；每次写 status 和最终释放前都核对
//     token/PID。这样连续 commit 只在当前重建结束后再补跑一轮，旧 worker 也不能删除后继锁。
//   - release handoff：wrapper 退出循环后先释放 owned lock，再检查 pending。释放前到达的
//     trigger 会写 pending，由旧 worker 重新走 single-flight trigger；释放后到达的 trigger
//     会自行获得 lock。两条路径竞争时仍只有一个后继 worker，关闭最后一次唤醒丢失窗口。

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const { assertContainedPath, reasonError } = require('./path-safety.cjs');
const { sleepSync } = require('./process-utils.cjs');
const { restoreRegularFileNoClobber } = require('./regular-file-publication.cjs');
const { readWorkspaceGraphState } = require('./workspace-graph-state.cjs');
const {
  INTERNAL_CODEGRAPH_COMMAND_ENV,
  INTERNAL_GRAPHIFY_COMMAND_ENV,
  INTERNAL_REFRESH_ONLY_ENV,
  WORKSPACE_REFRESH_ENV_ALLOWLIST,
  workspaceRefreshStateEligible,
} = require('./workspace-refresh-contract.cjs');
const {
  acquireWorkspaceGraphLifecycleLease,
  processIdentityState,
  processStartMarker,
  workspaceGraphLifecycleEnv,
} = require('./workspace-graph-lifecycle-lease.cjs');

const LOCK_BASENAME = 'workspace-async-refresh.lock';
const STATUS_BASENAME = 'workspace-async-refresh-status.json';
const PENDING_BASENAME = 'workspace-async-refresh.pending';
const LOCK_SCHEMA_VERSION = 'workspace-async-refresh-lock.v3';
const PENDING_SCHEMA_VERSION = 'workspace-async-refresh-pending.v1';
const LEGACY_LOCK_SCHEMA_VERSION = 'workspace-async-refresh-lock.v2';
const STARTING_LOCK_GRACE_MS = 10 * 1000;
const MALFORMED_LOCK_GRACE_MS = 10 * 1000;
const STARTING_LOCK_MAX_MS = 2 * 60 * 1000;
const REBUILD_TIMEOUT_MS = 20 * 60 * 1000;
const WORKER_CLAIM_POLL_MS = 5;
const WORKER_CLAIM_TIMEOUT_MS = STARTING_LOCK_GRACE_MS;

function graphifyDir(workspaceRoot) {
  return assertContainedPath(workspaceRoot, path.join(workspaceRoot, 'graphify-out'), {
    reasonCode: 'workspace-async-refresh-path-escapes-workspace',
  });
}

function containedFile(workspaceRoot, basename) {
  return assertContainedPath(workspaceRoot, path.join(workspaceRoot, 'graphify-out', basename), {
    reasonCode: 'workspace-async-refresh-path-escapes-workspace',
  });
}

function ensureGraphifyDir(workspaceRoot) {
  const dir = graphifyDir(workspaceRoot);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function readLockSnapshot(lockFile) {
  let descriptor = null;
  try {
    descriptor = fs.openSync(lockFile, 'r');
    const raw = fs.readFileSync(descriptor, 'utf8');
    const stat = fs.fstatSync(descriptor);
    let lock = null;
    let error = null;
    try {
      lock = JSON.parse(raw);
    } catch (parseError) {
      error = parseError;
    }
    return {
      raw,
      lock,
      error,
      stat: {
        dev: stat.dev,
        ino: stat.ino,
        mtime_ms: stat.mtimeMs,
        size: stat.size,
      },
    };
  } catch (error) {
    return { raw: null, lock: null, stat: null, error };
  } finally {
    if (descriptor !== null) {
      try { fs.closeSync(descriptor); } catch (_error) { /* preserve snapshot result */ }
    }
  }
}

function lockOwnerPid(lock) {
  return Number(lock && (lock.owner_pid || lock.pid));
}

function lockSnapshotIsStale(
  snapshot,
  nowMs,
  processIdentity = processIdentityState,
) {
  if (!snapshot || snapshot.raw === null || !snapshot.stat) return false;
  const lock = snapshot.lock;
  const snapshotAge = Math.max(0, nowMs - snapshot.stat.mtime_ms);
  if (!lock || !Number.isFinite(Number(lock.started_at_ms))) {
    return snapshotAge > MALFORMED_LOCK_GRACE_MS;
  }

  const ownerPid = lockOwnerPid(lock);
  if (lock.schema_version !== LOCK_SCHEMA_VERSION
    && lock.schema_version !== LEGACY_LOCK_SCHEMA_VERSION) {
    return processIdentity(ownerPid, null) === 'dead'
      && snapshotAge > MALFORMED_LOCK_GRACE_MS;
  }

  const identity = processIdentity(ownerPid, lock.owner_start_marker);

  if (lock.state === 'starting') {
    const age = Math.max(0, nowMs - Number(lock.started_at_ms));
    if (age <= STARTING_LOCK_GRACE_MS) return false;
    if (age > STARTING_LOCK_MAX_MS) return true;
    return identity === 'dead' || identity === 'mismatched';
  }
  if (lock.state === 'running') {
    if (identity === 'dead' || identity === 'mismatched') return true;
    if (lock.schema_version === LOCK_SCHEMA_VERSION && lock.owner_start_marker) return false;
    return snapshotAge > REBUILD_TIMEOUT_MS + MALFORMED_LOCK_GRACE_MS;
  }
  return snapshotAge > MALFORMED_LOCK_GRACE_MS;
}

function lockIsStale(lockFile, nowMs, processIdentity = processIdentityState) {
  return lockSnapshotIsStale(readLockSnapshot(lockFile), nowMs, processIdentity);
}

function lockOwnedBy(lockFile, { token, pid } = {}) {
  const lock = readLockSnapshot(lockFile).lock;
  if (!lock || lock.schema_version !== LOCK_SCHEMA_VERSION || lock.token !== token) return false;
  return pid === undefined || lockOwnerPid(lock) === pid;
}

function removeLockIfOwned(lockFile, { token, pid } = {}) {
  const snapshot = readLockSnapshot(lockFile);
  const lock = snapshot.lock;
  if (!lock || lock.schema_version !== LOCK_SCHEMA_VERSION || lock.token !== token) return false;
  if (pid !== undefined && lockOwnerPid(lock) !== pid) return false;
  return removeLockIfSnapshotMatches(lockFile, snapshot);
}

function lockRestoreError() {
  return reasonError(
    'workspace-async-refresh-lock-restore-failed',
    'workspace async refresh lock restoration failed',
  );
}

function pendingRestoreError() {
  return reasonError(
    'workspace-async-refresh-pending-restore-failed',
    'workspace async refresh pending restoration failed',
  );
}

function discardQuarantinedFile(source) {
  try { fs.rmSync(source, { force: true }); } catch (_error) { /* successor remains authoritative */ }
}

function snapshotsMatch(expected, observed) {
  return Boolean(expected && observed)
    && expected.raw !== null
    && observed.raw === expected.raw
    && expected.stat
    && observed.stat
    && observed.stat.dev === expected.stat.dev
    && observed.stat.ino === expected.stat.ino
    && observed.stat.mtime_ms === expected.stat.mtime_ms
    && observed.stat.size === expected.stat.size;
}

function removeSnapshotFileAtomically(file, snapshot) {
  if (!snapshot || snapshot.raw === null || !snapshot.stat) {
    return { status: 'generation-changed' };
  }
  const quarantine = `${file}.quarantine-${process.pid}-${crypto.randomUUID()}`;
  try {
    fs.renameSync(file, quarantine);
  } catch (error) {
    return {
      status: error && error.code === 'ENOENT'
        ? 'generation-changed'
        : 'rename-failed',
    };
  }

  const quarantined = readLockSnapshot(quarantine);
  if (!snapshotsMatch(snapshot, quarantined)) {
    const restoration = restoreRegularFileNoClobber(quarantine, file);
    if (restoration.status === 'contended') discardQuarantinedFile(quarantine);
    if (restoration.status === 'failed') return { status: 'restore-failed' };
    return { status: 'generation-changed' };
  }

  try {
    fs.rmSync(quarantine, { force: true });
    return { status: 'removed' };
  } catch (_error) {
    const restoration = restoreRegularFileNoClobber(quarantine, file);
    if (restoration.status === 'contended') discardQuarantinedFile(quarantine);
    if (restoration.status === 'failed') return { status: 'restore-failed' };
    return { status: 'cleanup-failed' };
  }
}

function removeLockIfSnapshotMatches(lockFile, snapshot, { returnResult = false } = {}) {
  const outcome = removeSnapshotFileAtomically(lockFile, snapshot);
  if (outcome.status === 'restore-failed') throw lockRestoreError();
  const changed = outcome.status === 'removed';
  const reasonCode = changed
    ? null
    : (outcome.status === 'generation-changed'
      ? 'workspace-async-refresh-lock-generation-changed'
      : 'workspace-async-refresh-lock-cleanup-failed');
  return returnResult ? { changed, reason_code: reasonCode } : changed;
}

function removePendingIfSnapshotMatches(pendingFile, snapshot) {
  const outcome = removeSnapshotFileAtomically(pendingFile, snapshot);
  if (outcome.status === 'restore-failed' || outcome.status === 'rename-failed') {
    throw pendingRestoreError();
  }
  return outcome.status === 'removed';
}

function writeLockIfOwned(lockFile, token, lock) {
  let descriptor = null;
  try {
    descriptor = fs.openSync(lockFile, 'r+');
    const currentRaw = fs.readFileSync(descriptor, 'utf8');
    const current = JSON.parse(currentRaw);
    if (current.schema_version !== LOCK_SCHEMA_VERSION || current.token !== token) return false;
    const opened = fs.fstatSync(descriptor);
    const payload = `${JSON.stringify(lock)}\n`;
    fs.ftruncateSync(descriptor, 0);
    fs.writeSync(descriptor, payload, 0, 'utf8');
    fs.fsyncSync(descriptor);

    // A stale reclaimer may have renamed this inode while it was open. Writing
    // through the descriptor is safe, but ownership transfers only if the path
    // still names the same generation; a successor path is never overwritten.
    const currentPath = readLockSnapshot(lockFile);
    return Boolean(currentPath.stat)
      && currentPath.stat.dev === opened.dev
      && currentPath.stat.ino === opened.ino
      && currentPath.lock
      && currentPath.lock.token === token
      && lockOwnerPid(currentPath.lock) === lockOwnerPid(lock);
  } catch (_error) {
    return false;
  } finally {
    if (descriptor !== null) {
      try { fs.closeSync(descriptor); } catch (_error) { /* preserve ownership result */ }
    }
  }
}

function lockPayload({ token, state, ownerPid, ownerStartMarker, startedAtMs, updatedAtMs }) {
  return {
    schema_version: LOCK_SCHEMA_VERSION,
    token,
    state,
    owner_pid: ownerPid,
    owner_start_marker: ownerStartMarker || null,
    started_at_ms: startedAtMs,
    updated_at_ms: updatedAtMs,
  };
}

function acquireLock(workspaceRoot, { pid, nowMs, token = crypto.randomUUID() }) {
  const lockFile = containedFile(workspaceRoot, LOCK_BASENAME);
  const lock = lockPayload({
    token,
    state: 'starting',
    ownerPid: pid,
    ownerStartMarker: processStartMarker(pid),
    startedAtMs: nowMs,
    updatedAtMs: nowMs,
  });
  const payload = `${JSON.stringify(lock)}\n`;
  try {
    fs.writeFileSync(lockFile, payload, { flag: 'wx' });
    return { acquired: true, lockFile, token };
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const staleSnapshot = readLockSnapshot(lockFile);
    if (lockSnapshotIsStale(staleSnapshot, nowMs)) {
      const recovery = removeLockIfSnapshotMatches(lockFile, staleSnapshot, { returnResult: true });
      if (recovery.changed) {
        try {
          fs.writeFileSync(lockFile, payload, { flag: 'wx' });
          return { acquired: true, lockFile, token, reclaimed: true };
        } catch (retryError) {
          if (retryError.code !== 'EEXIST') throw retryError;
        }
      } else if (recovery.reason_code === 'workspace-async-refresh-lock-cleanup-failed') {
        throw reasonError(
          recovery.reason_code,
          'workspace async refresh stale lock cleanup failed',
        );
      }
    }
    return { acquired: false, lockFile };
  }
}

function claimLockForWorker(workspaceRoot, { token, pid, nowMs }) {
  const lockFile = containedFile(workspaceRoot, LOCK_BASENAME);
  const current = readLockSnapshot(lockFile).lock;
  if (!current || current.token !== token) return false;
  return writeLockIfOwned(lockFile, token, lockPayload({
    token,
    state: 'running',
    ownerPid: pid,
    ownerStartMarker: processStartMarker(pid),
    startedAtMs: Number(current.started_at_ms) || nowMs,
    updatedAtMs: nowMs,
  }));
}

function waitForWorkerClaim(lockFile, {
  token,
  pid,
  timeoutMs = WORKER_CLAIM_TIMEOUT_MS,
  pollMs = WORKER_CLAIM_POLL_MS,
  shouldAbort = null,
} = {}) {
  const deadline = Date.now() + Math.max(0, timeoutMs);
  while (true) {
    if (lockOwnedBy(lockFile, { token, pid })) return true;
    if (typeof shouldAbort === 'function' && shouldAbort()) return false;
    if (Date.now() >= deadline) return false;
    sleepSync(Math.min(Math.max(1, pollMs), Math.max(1, deadline - Date.now())));
  }
}

function markPending(workspaceRoot, token) {
  fs.writeFileSync(containedFile(workspaceRoot, PENDING_BASENAME), `${JSON.stringify({
    schema_version: PENDING_SCHEMA_VERSION,
    token,
  })}\n`);
}

function consumePending(workspaceRoot, { expectedToken } = {}) {
  const pendingFile = containedFile(workspaceRoot, PENDING_BASENAME);
  const snapshot = readLockSnapshot(pendingFile);
  if (snapshot.raw === null) return false;
  if (expectedToken
    && (!snapshot.lock
      || snapshot.lock.schema_version !== PENDING_SCHEMA_VERSION
      || snapshot.lock.token !== expectedToken)) {
    return false;
  }
  return removePendingIfSnapshotMatches(pendingFile, snapshot);
}

function writeStatus(workspaceRoot, status) {
  const target = containedFile(workspaceRoot, STATUS_BASENAME);
  const temp = `${target}.tmp-${status.pid || process.pid}`;
  const payload = {
    ...status,
    attempt_id: status.attempt_id || crypto.randomUUID(),
  };
  assertContainedPath(workspaceRoot, temp, { reasonCode: 'workspace-async-refresh-path-escapes-workspace' });
  try {
    fs.writeFileSync(temp, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    fs.renameSync(temp, target);
  } finally {
    if (fs.existsSync(temp)) {
      try { fs.rmSync(temp, { force: true }); } catch (_error) { /* keep primary result */ }
    }
  }
}

function writeRefreshReceipt(workspaceRoot, {
  ok,
  reasonCode,
  finishedAtMs,
  pid,
  iterations,
}) {
  writeStatus(workspaceRoot, {
    schema_version: 'workspace-async-refresh-status.v1',
    ok,
    reason_code: reasonCode,
    finished_at_ms: finishedAtMs,
    pid,
    iterations,
  });
}

function readEventFailureSignal(workspaceRoot, nowMs = Date.now()) {
  const dir = graphifyDir(workspaceRoot);
  if (!fs.existsSync(dir)) return { quarantined: false, pending: false, pending_stale: false };
  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch (_error) {
    return { quarantined: true, pending: false, pending_stale: false };
  }
  const quarantined = entries.some((name) => (
    name.startsWith(`${LOCK_BASENAME}.quarantine-`)
    || name.startsWith(`${PENDING_BASENAME}.quarantine-`)
    || name.startsWith(`${STATUS_BASENAME}.clear-`)
  ));
  const pending = readLockSnapshot(containedFile(workspaceRoot, PENDING_BASENAME));
  const pendingAge = pending.stat ? Math.max(0, nowMs - pending.stat.mtime_ms) : 0;
  return {
    quarantined,
    pending: pending.raw !== null,
    pending_stale: pending.raw !== null && pendingAge > STARTING_LOCK_GRACE_MS,
  };
}

function readAsyncRefreshStatus(workspaceRoot, {
  now = Date.now,
  processIdentity = processIdentityState,
} = {}) {
  try {
    const target = containedFile(workspaceRoot, STATUS_BASENAME);
    const lockFile = containedFile(workspaceRoot, LOCK_BASENAME);
    const lockExists = fs.existsSync(lockFile);
    const nowMs = Number(now());
    const eventSignal = readEventFailureSignal(workspaceRoot, nowMs);
    const liveLock = lockExists && !lockIsStale(lockFile, nowMs, processIdentity);
    const inFlight = liveLock
      || (!lockExists && eventSignal.pending && !eventSignal.pending_stale);
    const staleLock = lockExists && !liveLock && fs.existsSync(lockFile);
    const abandoned = staleLock
      || eventSignal.quarantined
      || (!liveLock && eventSignal.pending_stale);
    if (!fs.existsSync(target)) {
      if (abandoned) {
        return {
          status: 'failed',
          reason_code: 'workspace-async-refresh-abandoned',
          last_result_ok: false,
          last_reason_code: 'workspace-async-refresh-abandoned',
        };
      }
      return { status: inFlight ? 'in-flight' : 'none', reason_code: null };
    }
    const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
    if (abandoned) {
      return {
        status: 'failed',
        reason_code: 'workspace-async-refresh-abandoned',
        last_result_ok: parsed.ok === true,
        last_reason_code: parsed.reason_code || null,
      };
    }
    return {
      status: inFlight ? 'in-flight' : (parsed.ok ? 'succeeded' : 'failed'),
      reason_code: parsed.ok ? null : (parsed.reason_code || 'workspace-async-refresh-failed'),
      last_result_ok: parsed.ok === true,
      last_reason_code: parsed.reason_code || null,
    };
  } catch (_error) {
    return { status: 'unknown', reason_code: 'workspace-async-refresh-status-unreadable' };
  }
}

function clearStaleAsyncRefreshLock(workspaceRoot, { now = defaultNow } = {}) {
  const lockFile = containedFile(workspaceRoot, LOCK_BASENAME);
  const snapshot = readLockSnapshot(lockFile);
  if (snapshot.raw === null) return { ok: true, changed: false, reason_code: null };
  if (!lockSnapshotIsStale(snapshot, now())) {
    return { ok: true, changed: false, reason_code: 'workspace-async-refresh-lock-live' };
  }
  const recovery = removeLockIfSnapshotMatches(lockFile, snapshot, { returnResult: true });
  return {
    ok: recovery.reason_code !== 'workspace-async-refresh-lock-cleanup-failed',
    changed: recovery.changed,
    reason_code: recovery.reason_code,
  };
}

function readAsyncRefreshStatusSnapshot(workspaceRoot) {
  const target = containedFile(workspaceRoot, STATUS_BASENAME);
  try {
    const raw = fs.readFileSync(target, 'utf8');
    return {
      target,
      raw,
      generation: crypto.createHash('sha256').update(raw).digest('hex'),
    };
  } catch (error) {
    if (error && error.code === 'ENOENT') return { target, raw: null, generation: null };
    throw error;
  }
}

function readAsyncRefreshStatusGeneration(workspaceRoot) {
  return readAsyncRefreshStatusSnapshot(workspaceRoot).generation;
}

function restoreAsyncStatusQuarantineOrThrow(source, target) {
  const restoration = restoreRegularFileNoClobber(source, target);
  if (restoration.status === 'contended') discardQuarantinedFile(source);
  if (restoration.status === 'failed') {
    throw reasonError(
      'workspace-async-refresh-status-clear-failed',
      'workspace async refresh status restoration failed',
    );
  }
}

function clearAsyncRefreshStatus(workspaceRoot, options = {}) {
  const snapshot = readAsyncRefreshStatusSnapshot(workspaceRoot);
  if (snapshot.raw === null) return { ok: true, changed: false, reason_code: null };
  const hasExpectedGeneration = Object.prototype.hasOwnProperty.call(options, 'expectedGeneration');
  if (hasExpectedGeneration && options.expectedGeneration !== snapshot.generation) {
    return {
      ok: true,
      changed: false,
      reason_code: 'workspace-async-refresh-status-generation-changed',
    };
  }

  const quarantine = `${snapshot.target}.clear-${process.pid}-${crypto.randomUUID()}`;
  assertContainedPath(workspaceRoot, quarantine, {
    reasonCode: 'workspace-async-refresh-path-escapes-workspace',
  });
  let moved = false;
  try {
    fs.renameSync(snapshot.target, quarantine);
    moved = true;
    const movedRaw = fs.readFileSync(quarantine, 'utf8');
    if (movedRaw !== snapshot.raw) {
      restoreAsyncStatusQuarantineOrThrow(quarantine, snapshot.target);
      moved = false;
      return {
        ok: true,
        changed: false,
        reason_code: 'workspace-async-refresh-status-generation-changed',
      };
    }
    fs.rmSync(quarantine, { force: true });
    moved = false;
    return { ok: true, changed: true, reason_code: null };
  } catch (error) {
    if (moved) {
      restoreAsyncStatusQuarantineOrThrow(quarantine, snapshot.target);
      moved = false;
    }
    error.reason_code = error.reason_code || 'workspace-async-refresh-status-clear-failed';
    throw error;
  }
}

function workspaceAutoRefreshEnabled(workspaceRoot) {
  return workspaceRefreshStateEligible(readWorkspaceGraphState(workspaceRoot));
}

function workspaceRefreshProcessEnv(source = process.env, { includeControl = true } = {}) {
  const allowed = new Set(WORKSPACE_REFRESH_ENV_ALLOWLIST);
  if (includeControl) {
    allowed.add(INTERNAL_REFRESH_ONLY_ENV);
    allowed.add(INTERNAL_CODEGRAPH_COMMAND_ENV);
    allowed.add(INTERNAL_GRAPHIFY_COMMAND_ENV);
    allowed.add('MCP_SETUP_HOST');
    allowed.add('SPEC_FIRST_BUNDLED_VERSION');
  }
  const env = {};
  for (const key of allowed) {
    if (source && source[key] !== undefined) env[key] = source[key];
  }
  return env;
}

function restrictCurrentProcessEnv(target = process.env) {
  const allowed = workspaceRefreshProcessEnv(target);
  for (const key of Object.keys(target)) {
    if (!Object.prototype.hasOwnProperty.call(allowed, key)) delete target[key];
  }
  Object.assign(target, allowed);
}

function removeExistingAsyncLock(workspaceRoot, { token, pid } = {}) {
  const dir = path.join(workspaceRoot, 'graphify-out');
  if (!fs.existsSync(dir)) return false;
  try {
    return removeLockIfOwned(containedFile(workspaceRoot, LOCK_BASENAME), { token, pid });
  } catch (_error) {
    return false;
  }
}

function discardDisabledTriggerArtifacts(workspaceRoot, { lock, token, pid } = {}) {
  if (lock && lock.acquired) {
    try { removeLockIfOwned(lock.lockFile, { token, pid }); } catch (_error) { /* best-effort */ }
  } else if (token) {
    removeExistingAsyncLock(workspaceRoot, { token, pid });
  }
  try { consumePending(workspaceRoot, { expectedToken: token }); } catch (_error) { /* best-effort */ }
  try { fs.rmdirSync(graphifyDir(workspaceRoot)); } catch (_error) { /* remove only an empty event directory */ }
  return {
    status: 'skipped',
    reason_code: 'workspace-auto-refresh-disabled',
  };
}

function recordTriggerFailure({
  workspaceRoot,
  lock,
  token,
  pid,
  reasonCode,
  now,
  requireActiveState,
  isRefreshEnabled,
}) {
  const lifecycle = acquireWorkspaceGraphLifecycleLease({
    workspaceRoot,
    operation: 'async-trigger-failure',
    pid,
  });
  try {
    if (lifecycle.ok) {
      if (requireActiveState && !isRefreshEnabled(workspaceRoot)) {
        return discardDisabledTriggerArtifacts(workspaceRoot, { lock, token, pid });
      }
      lifecycle.assertOwned('before-dispatch-failure-status');
      try {
        ensureGraphifyDir(workspaceRoot);
        writeRefreshReceipt(workspaceRoot, {
          ok: false,
          reasonCode,
          finishedAtMs: now(),
          pid,
          iterations: 0,
        });
      } catch (_error) {
        return { recorded: false, reason_code: 'workspace-async-refresh-status-write-failed' };
      }
      lifecycle.assertOwned('before-dispatch-failure-event-cleanup');
      let eventLeaseAvailable = !lock || !lock.acquired;
      if (lock && lock.acquired) {
        try {
          const removed = removeLockIfOwned(lock.lockFile, { token, pid });
          eventLeaseAvailable = removed || !fs.existsSync(lock.lockFile);
        } catch (_error) { /* receipt remains authoritative */ }
      }
      if (token) {
        try {
          consumePending(workspaceRoot, { expectedToken: token });
        } catch (_error) { /* receipt remains authoritative */ }
      }
      return {
        recorded: true,
        reason_code: reasonCode,
        handoff_required: Boolean(token)
          && eventLeaseAvailable
          && fs.existsSync(containedFile(workspaceRoot, PENDING_BASENAME)),
      };
    }
  } finally {
    if (lifecycle.ok && !lifecycle.inherited) lifecycle.release();
  }
  // 未取得 writer lease 时禁止写 status；保留 owned event lock，使进程退出后
  // 自然成为可观察、可回收的 abandoned signal。
  return { recorded: false, reason_code: lifecycle.reason_code || 'workspace-graph-lifecycle-busy' };
}

// 同步执行体：detached 子进程调用（或测试直接调用）。跑重建、写 status、按 pending 合并、释放锁。
function runMergedRebuildForeground({
  workspaceRoot,
  command,
  args = [],
  exec = defaultExec,
  now = defaultNow,
  pid = process.pid,
  lockToken,
  beforeRelease = null,
  spawnDetached = defaultSpawnDetached,
  requireActiveState = false,
  isRefreshEnabled = workspaceAutoRefreshEnabled,
  acquireLifecycleLease = acquireWorkspaceGraphLifecycleLease,
  lifecycleTimeoutMs = REBUILD_TIMEOUT_MS,
  awaitWorkerClaim = waitForWorkerClaim,
  workerClaimTimeoutMs = WORKER_CLAIM_TIMEOUT_MS,
} = {}) {
  const lockFile = containedFile(workspaceRoot, LOCK_BASENAME);
  if (requireActiveState && !isRefreshEnabled(workspaceRoot)) {
    return {
      iterations: 0,
      ...discardDisabledTriggerArtifacts(workspaceRoot, { token: lockToken, pid }),
    };
  }
  let refreshDisabledDuringClaim = false;
  const claimed = Boolean(lockToken) && awaitWorkerClaim(lockFile, {
    token: lockToken,
    pid,
    timeoutMs: workerClaimTimeoutMs,
    shouldAbort: requireActiveState
      ? () => {
        refreshDisabledDuringClaim = !isRefreshEnabled(workspaceRoot);
        return refreshDisabledDuringClaim;
      }
      : null,
  });
  if (!claimed) {
    if (requireActiveState
      && (refreshDisabledDuringClaim || !isRefreshEnabled(workspaceRoot))) {
      return {
        iterations: 0,
        ...discardDisabledTriggerArtifacts(workspaceRoot, { token: lockToken, pid }),
      };
    }
    throw reasonError(
      'workspace-async-refresh-lock-ownership-lost',
      'workspace async refresh lock ownership is unavailable',
    );
  }
  let iterations = 0;
  let handoff = null;
  let lifecycle = null;
  let disabled = false;
  let bodyError = null;
  let releaseError = null;
  let beforeReleaseError = null;
  let preserveAsyncLock = false;
  try {
    lifecycle = acquireLifecycleLease({
      workspaceRoot,
      operation: 'async-refresh',
      pid,
      timeoutMs: lifecycleTimeoutMs,
    });
    if (!lifecycle.ok) {
      throw reasonError(
        lifecycle.reason_code || 'workspace-graph-lifecycle-busy',
        'workspace graph lifecycle lease is unavailable',
      );
    }
    if (requireActiveState && !isRefreshEnabled(workspaceRoot)) {
      disabled = true;
    }
    while (!disabled) {
      if (!lockOwnedBy(lockFile, { token: lockToken, pid })) {
        throw reasonError(
          'workspace-async-refresh-lock-ownership-lost',
          'workspace async refresh lock ownership changed',
        );
      }
      consumePending(workspaceRoot);
      iterations += 1;
      lifecycle.assertOwned('before-async-rebuild');
      let result;
      try {
        result = exec(command, args, {
          cwd: workspaceRoot,
          env: workspaceGraphLifecycleEnv(lifecycle, workspaceRefreshProcessEnv(process.env)),
        });
      } catch (error) {
        result = { status: null, error };
      }
      const ok = Boolean(result) && result.status === 0 && !result.error && !result.signal;
      if (!lockOwnedBy(lockFile, { token: lockToken, pid })) {
        throw reasonError(
          'workspace-async-refresh-lock-ownership-lost',
          'workspace async refresh lock ownership changed',
        );
      }
      lifecycle.assertOwned('before-async-status-write');
      writeRefreshReceipt(workspaceRoot, {
        ok,
        reasonCode: ok ? null : reasonForResult(result),
        finishedAtMs: now(),
        pid,
        iterations,
      });
      if (!consumePending(workspaceRoot)) break;
    }
  } catch (error) {
    bodyError = error;
    preserveAsyncLock = true;
  } finally {
    if (lifecycle && lifecycle.ok && !lifecycle.inherited) {
      let release;
      try {
        release = lifecycle.release();
      } catch (error) {
        release = {
          ok: false,
          status: 'failed',
          reason_code: error.reason_code || 'workspace-graph-lifecycle-release-failed',
        };
      }
      if (!release || release.ok !== true) {
        const reasonCode = (release && release.reason_code)
          || 'workspace-graph-lifecycle-release-failed';
        releaseError = reasonError(
          reasonCode,
          'workspace graph lifecycle release could not be confirmed',
        );
        preserveAsyncLock = true;

        const mayWriteFailure = !disabled
          && (!requireActiveState || isRefreshEnabled(workspaceRoot));
        if (mayWriteFailure) {
          try {
            lifecycle.assertOwned('after-async-release-failure');
            writeRefreshReceipt(workspaceRoot, {
              ok: false,
              reasonCode,
              finishedAtMs: now(),
              pid,
              iterations,
            });
            const retry = lifecycle.release();
            if (retry && retry.ok === true) preserveAsyncLock = false;
          } catch (_error) { /* preserve the event lock as the fallback failure signal */ }
        }
      }
    }
    if (typeof beforeRelease === 'function') {
      try { beforeRelease(); } catch (error) { beforeReleaseError = error; }
    }
    let released = false;
    if (disabled) preserveAsyncLock = false;
    if (!preserveAsyncLock) {
      try { released = removeLockIfOwned(lockFile, { token: lockToken, pid }); } catch (_error) { /* best-effort */ }
    }
    if (!disabled && released && fs.existsSync(containedFile(workspaceRoot, PENDING_BASENAME))) {
      handoff = triggerMergedRebuildAsync({
        workspaceRoot,
        command,
        args,
        now,
        pid,
        spawnDetached,
        requireActiveState,
        isRefreshEnabled,
      });
    }
  }
  if (bodyError) throw bodyError;
  if (releaseError) throw releaseError;
  if (beforeReleaseError) throw beforeReleaseError;
  if (disabled) {
    return {
      iterations,
      status: 'skipped',
      reason_code: 'workspace-auto-refresh-disabled',
    };
  }
  return handoff ? { iterations, handoff } : { iterations };
}

function reasonForResult(result) {
  if (!result) return 'workspace-async-refresh-no-result';
  if ((result.error && result.error.code === 'ETIMEDOUT') || result.timeout || result.timed_out) {
    return 'workspace-async-refresh-timeout';
  }
  if (result.error) return 'workspace-async-refresh-spawn-error';
  if (result.signal) return 'workspace-async-refresh-signal-terminated';
  return 'workspace-async-refresh-nonzero-exit';
}

// 触发：trigger 端。producer-first pending + acquire-or-coalesce，acquired 时 detached 派发 wrapper。
function triggerMergedRebuildAsync({
  workspaceRoot,
  command,
  args = [],
  now = defaultNow,
  pid = process.pid,
  spawnDetached = defaultSpawnDetached,
  requireActiveState = false,
  isRefreshEnabled = workspaceAutoRefreshEnabled,
  claimWorker = claimLockForWorker,
} = {}) {
  if (!workspaceRoot || !command) {
    return { status: 'skipped', reason_code: 'workspace-async-refresh-invalid-input' };
  }
  if (requireActiveState && !isRefreshEnabled(workspaceRoot)) {
    return { status: 'skipped', reason_code: 'workspace-auto-refresh-disabled' };
  }
  ensureGraphifyDir(workspaceRoot);
  const nowMs = now();
  const token = crypto.randomUUID();
  markPending(workspaceRoot, token);
  let lock;
  const finishFailure = (reasonCode, failedLock) => {
    const record = recordTriggerFailure({
      workspaceRoot,
      lock: failedLock,
      token,
      pid,
      reasonCode,
      now,
      requireActiveState,
      isRefreshEnabled,
    });
    const result = { status: 'error', reason_code: reasonCode };
    if (record && record.handoff_required) {
      result.handoff = triggerMergedRebuildAsync({
        workspaceRoot,
        command,
        args,
        now,
        pid,
        spawnDetached,
        requireActiveState,
        isRefreshEnabled,
        claimWorker,
      });
    }
    return result;
  };
  try {
    lock = acquireLock(workspaceRoot, { pid, nowMs, token });
  } catch (error) {
    const reasonCode = error.reason_code || 'workspace-async-refresh-lock-failed';
    return finishFailure(reasonCode, null);
  }
  if (requireActiveState && !isRefreshEnabled(workspaceRoot)) {
    return discardDisabledTriggerArtifacts(workspaceRoot, { lock, token, pid });
  }
  if (!lock.acquired) return { status: 'coalesced', reason_code: null };
  try {
    consumePending(workspaceRoot, { expectedToken: token });
    const spawned = spawnDetached(workspaceRoot, command, args, { lockToken: token, requireActiveState });
    const workerPid = Number.isInteger(spawned)
      ? spawned
      : Number(spawned && spawned.pid);
    if (!Number.isInteger(workerPid) || workerPid <= 0) {
      throw reasonError(
        'workspace-async-refresh-spawn-invalid-pid',
        'detached refresh did not return a valid worker PID',
      );
    }
    let claimed = false;
    try {
      claimed = claimWorker(workspaceRoot, { token, pid: workerPid, nowMs: now() });
    } catch (_error) {
      claimed = false;
    }
    if (!claimed && !lockOwnedBy(lock.lockFile, { token, pid: workerPid })) {
      throw reasonError(
        'workspace-async-refresh-lock-claim-failed',
        'detached refresh worker could not claim the async lease',
      );
    }
    return { status: 'spawned', reclaimed_stale_lock: lock.reclaimed === true };
  } catch (error) {
    const reasonCode = error.reason_code || 'workspace-async-refresh-spawn-error';
    return finishFailure(reasonCode, lock);
  }
}

function defaultSpawnDetached(workspaceRoot, command, args, { lockToken } = {}) {
  const child = childProcess.spawn(
    process.execPath,
    [
      __filename,
      '--run',
      '--workspace',
      workspaceRoot,
      '--command',
      command,
      '--args',
      JSON.stringify(args || []),
      '--lock-token',
      lockToken,
    ],
    {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env: workspaceRefreshProcessEnv(process.env),
    },
  );
  child.unref();
  return child.pid;
}

function defaultExec(command, args, options) {
  return childProcess.spawnSync(command, args, {
    cwd: options && options.cwd,
    env: options && options.env ? options.env : process.env,
    encoding: 'utf8',
    stdio: 'ignore',
    timeout: REBUILD_TIMEOUT_MS,
    windowsHide: true,
  });
}

function defaultNow() {
  return Date.now();
}

function parseRunArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--workspace') out.workspaceRoot = argv[i + 1];
    else if (argv[i] === '--command') out.command = argv[i + 1];
    else if (argv[i] === '--args') {
      try {
        const parsedArgs = JSON.parse(argv[i + 1]);
        if (!Array.isArray(parsedArgs) || parsedArgs.some((value) => typeof value !== 'string')) {
          throw new Error('args must be a string array');
        }
        out.args = parsedArgs;
      } catch (_error) {
        out.reason_code = 'workspace-async-refresh-args-invalid';
      }
    }
    else if (argv[i] === '--lock-token') out.lockToken = argv[i + 1];
  }
  return out;
}

if (require.main === module) {
  restrictCurrentProcessEnv(process.env);
  const argv = process.argv.slice(2);
  const parsed = parseRunArgs(argv);
  if (parsed.reason_code) {
    if (parsed.workspaceRoot && parsed.command) {
      try {
        recordTriggerFailure({
          workspaceRoot: parsed.workspaceRoot,
          lock: null,
          token: null,
          pid: process.pid,
          reasonCode: parsed.reason_code,
          now: defaultNow,
          requireActiveState: true,
          isRefreshEnabled: workspaceAutoRefreshEnabled,
        });
      } catch (_error) { /* non-zero exit remains the deterministic fallback */ }
    }
    process.exitCode = 2;
  } else if (argv.includes('--run') && parsed.workspaceRoot && parsed.command) {
    // Detached wrapper：跑重建、写 status、按 pending 合并、释放锁。
    try {
      runMergedRebuildForeground({ ...parsed, requireActiveState: true });
    } catch (_error) {
      process.exitCode = 1;
    }
  } else if (argv.includes('--trigger') && parsed.workspaceRoot && parsed.command) {
    // 子仓 commit hook 入口：acquire-or-coalesce 后立即返回（重建在后台）。
    try {
      const result = triggerMergedRebuildAsync({ ...parsed, requireActiveState: true });
      if (result.status === 'error') process.exitCode = 1;
    } catch (_error) {
      process.exitCode = 1;
    }
  }
}

module.exports = {
  LOCK_BASENAME,
  STATUS_BASENAME,
  PENDING_BASENAME,
  LOCK_SCHEMA_VERSION,
  PENDING_SCHEMA_VERSION,
  STARTING_LOCK_GRACE_MS,
  MALFORMED_LOCK_GRACE_MS,
  STARTING_LOCK_MAX_MS,
  REBUILD_TIMEOUT_MS,
  lockIsStale,
  lockOwnedBy,
  removeLockIfOwned,
  triggerMergedRebuildAsync,
  runMergedRebuildForeground,
  readAsyncRefreshStatus,
  readAsyncRefreshStatusGeneration,
  clearAsyncRefreshStatus,
  clearStaleAsyncRefreshLock,
  workspaceRefreshProcessEnv,
};
