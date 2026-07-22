'use strict';

// U4 — Workspace merged-graph 异步刷新原语（R7/R8/R9/KTD6）。
//
// spec-first 自有子仓 commit hook 在 commit 时触发父目录 merged graph 重建。重建
// 昂贵，必须异步（commit 立即返回）、并发安全（同一 workspace 绝不两个重建并行，
// 否则 merged graph 可能 corrupt）、失败可见（后台失败落盘 reason_code 供消费侧读取）。
//
// 边界：本模块只写 `<workspaceRoot>/.graphify/` 下的 lock/status/pending 三个受控文件，
// 全部经 assertContainedPath 校验；绝不写外部路径、绝不 follow symlink out。重建命令本身
// 由调用方以 verified 绝对 launcher + workspace root 传入（KTD5），本模块不解析 PATH。
//
// 协作契约（coalesce）：
//   - trigger：尝试 `wx` 独占创建带随机 token 的 starting lease。成功→detached 派发
//     wrapper 并把 owner 交接为 worker PID；已存在→starting lease 先保留短 grace，running
//     lease 只在 owner 进程已死时回收，否则写 pending 标记并返回 coalesced，
//     表示「有重建在跑，跑完请再来一轮」。
//   - wrapper（runMergedRebuildForeground）：先用 token claim worker ownership，再执行
//     do { 清 pending; 跑重建; 写 status } while(pending)；每次写 status 和最终释放前都核对
//     token/PID。这样连续 commit 只在当前重建结束后再补跑一轮，旧 worker 也不能删除后继锁。
//   - 已知残留窗口：wrapper 退出循环到释放锁之间到达的 commit 可能丢失唤醒；这是 best-effort
//     图刷新的诚实代价，由消费侧只读新鲜度（U6）报告 stale 兜底，不在此补偿。

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const childProcess = require('node:child_process');
const { assertContainedPath } = require('./path-safety.cjs');

const LOCK_BASENAME = 'workspace-async-refresh.lock';
const STATUS_BASENAME = 'workspace-async-refresh-status.json';
const PENDING_BASENAME = 'workspace-async-refresh.pending';
const LOCK_SCHEMA_VERSION = 'workspace-async-refresh-lock.v2';
const STARTING_LOCK_GRACE_MS = 10 * 1000;
const STARTING_LOCK_MAX_MS = 2 * 60 * 1000;
const REBUILD_TIMEOUT_MS = 20 * 60 * 1000;

function graphifyDir(workspaceRoot) {
  return assertContainedPath(workspaceRoot, path.join(workspaceRoot, '.graphify'), {
    reasonCode: 'workspace-async-refresh-path-escapes-workspace',
  });
}

function containedFile(workspaceRoot, basename) {
  return assertContainedPath(workspaceRoot, path.join(workspaceRoot, '.graphify', basename), {
    reasonCode: 'workspace-async-refresh-path-escapes-workspace',
  });
}

function ensureGraphifyDir(workspaceRoot) {
  const dir = graphifyDir(workspaceRoot);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function processAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // ESRCH → dead; EPERM → alive but not ours (still counts as alive).
    return error && error.code === 'EPERM';
  }
}

function readLockSnapshot(lockFile) {
  try {
    const raw = fs.readFileSync(lockFile, 'utf8');
    return { raw, lock: JSON.parse(raw) };
  } catch (error) {
    return { raw: null, lock: null, error };
  }
}

function lockOwnerPid(lock) {
  return Number(lock && (lock.owner_pid || lock.pid));
}

function lockIsStale(lockFile, nowMs) {
  const snapshot = readLockSnapshot(lockFile);
  const lock = snapshot.lock;
  if (!lock || !Number.isFinite(Number(lock.started_at_ms))) return true;

  const ownerPid = lockOwnerPid(lock);
  if (lock.schema_version !== LOCK_SCHEMA_VERSION) {
    return !processAlive(ownerPid);
  }

  if (lock.state === 'starting') {
    const age = Math.max(0, nowMs - Number(lock.started_at_ms));
    if (age <= STARTING_LOCK_GRACE_MS) return false;
    if (age > STARTING_LOCK_MAX_MS) return true;
    return !processAlive(ownerPid);
  }
  if (lock.state === 'running') return !processAlive(ownerPid);
  return true;
}

function lockOwnedBy(lockFile, { token, pid } = {}) {
  const lock = readLockSnapshot(lockFile).lock;
  if (!lock || lock.schema_version !== LOCK_SCHEMA_VERSION || lock.token !== token) return false;
  return pid === undefined || lockOwnerPid(lock) === pid;
}

function removeLockIfOwned(lockFile, { token, pid } = {}) {
  if (!lockOwnedBy(lockFile, { token, pid })) return false;
  fs.rmSync(lockFile, { force: true });
  return true;
}

function removeLockIfSnapshotMatches(lockFile, snapshot) {
  if (!snapshot || snapshot.raw === null) return false;
  let current;
  try {
    current = fs.readFileSync(lockFile, 'utf8');
  } catch (_error) {
    return false;
  }
  if (current !== snapshot.raw) return false;
  fs.rmSync(lockFile, { force: true });
  return true;
}

function writeLockIfOwned(lockFile, token, lock) {
  if (!lockOwnedBy(lockFile, { token })) return false;
  const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex').slice(0, 16);
  const temp = `${lockFile}.tmp-${process.pid}-${tokenHash}`;
  assertContainedPath(path.dirname(path.dirname(lockFile)), temp, {
    reasonCode: 'workspace-async-refresh-path-escapes-workspace',
  });
  try {
    fs.writeFileSync(temp, `${JSON.stringify(lock)}\n`, { flag: 'wx' });
    if (!lockOwnedBy(lockFile, { token })) return false;
    fs.renameSync(temp, lockFile);
    return true;
  } finally {
    if (fs.existsSync(temp)) fs.rmSync(temp, { force: true });
  }
}

function lockPayload({ token, state, ownerPid, startedAtMs, updatedAtMs }) {
  return {
    schema_version: LOCK_SCHEMA_VERSION,
    token,
    state,
    owner_pid: ownerPid,
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
    if (lockIsStale(lockFile, nowMs) && removeLockIfSnapshotMatches(lockFile, staleSnapshot)) {
      try {
        fs.writeFileSync(lockFile, payload, { flag: 'wx' });
        return { acquired: true, lockFile, token, reclaimed: true };
      } catch (retryError) {
        if (retryError.code !== 'EEXIST') throw retryError;
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
    startedAtMs: Number(current.started_at_ms) || nowMs,
    updatedAtMs: nowMs,
  }));
}

function markPending(workspaceRoot) {
  fs.writeFileSync(containedFile(workspaceRoot, PENDING_BASENAME), '1');
}

function consumePending(workspaceRoot) {
  const pendingFile = containedFile(workspaceRoot, PENDING_BASENAME);
  if (!fs.existsSync(pendingFile)) return false;
  fs.rmSync(pendingFile, { force: true });
  return true;
}

function writeStatus(workspaceRoot, status) {
  const target = containedFile(workspaceRoot, STATUS_BASENAME);
  const temp = `${target}.tmp-${status.pid || process.pid}`;
  assertContainedPath(workspaceRoot, temp, { reasonCode: 'workspace-async-refresh-path-escapes-workspace' });
  try {
    fs.writeFileSync(temp, `${JSON.stringify(status, null, 2)}\n`, 'utf8');
    fs.renameSync(temp, target);
  } finally {
    if (fs.existsSync(temp)) {
      try { fs.rmSync(temp, { force: true }); } catch (_error) { /* keep primary result */ }
    }
  }
}

function readAsyncRefreshStatus(workspaceRoot) {
  try {
    const target = containedFile(workspaceRoot, STATUS_BASENAME);
    if (!fs.existsSync(target)) {
      const inFlight = fs.existsSync(containedFile(workspaceRoot, LOCK_BASENAME));
      return { status: inFlight ? 'in-flight' : 'none', reason_code: null };
    }
    const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
    const inFlight = fs.existsSync(containedFile(workspaceRoot, LOCK_BASENAME));
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

// 同步执行体：detached 子进程调用（或测试直接调用）。跑重建、写 status、按 pending 合并、释放锁。
function runMergedRebuildForeground({
  workspaceRoot,
  command,
  args = [],
  exec = defaultExec,
  now = defaultNow,
  pid = process.pid,
  lockToken,
} = {}) {
  ensureGraphifyDir(workspaceRoot);
  const lockFile = containedFile(workspaceRoot, LOCK_BASENAME);
  if (!lockToken || !claimLockForWorker(workspaceRoot, { token: lockToken, pid, nowMs: now() })) {
    const error = new Error('workspace async refresh lock ownership is unavailable');
    error.reason_code = 'workspace-async-refresh-lock-ownership-lost';
    throw error;
  }
  let iterations = 0;
  try {
    do {
      if (!lockOwnedBy(lockFile, { token: lockToken, pid })) {
        const error = new Error('workspace async refresh lock ownership changed');
        error.reason_code = 'workspace-async-refresh-lock-ownership-lost';
        throw error;
      }
      consumePending(workspaceRoot);
      iterations += 1;
      let result;
      try {
        result = exec(command, args, { cwd: workspaceRoot });
      } catch (error) {
        result = { status: null, error };
      }
      const ok = Boolean(result) && result.status === 0 && !result.error && !result.signal;
      if (!lockOwnedBy(lockFile, { token: lockToken, pid })) {
        const error = new Error('workspace async refresh lock ownership changed');
        error.reason_code = 'workspace-async-refresh-lock-ownership-lost';
        throw error;
      }
      writeStatus(workspaceRoot, {
        schema_version: 'workspace-async-refresh-status.v1',
        ok,
        reason_code: ok ? null : reasonForResult(result),
        finished_at_ms: now(),
        pid,
        iterations,
      });
    } while (consumePending(workspaceRoot));
  } finally {
    try { removeLockIfOwned(lockFile, { token: lockToken, pid }); } catch (_error) { /* best-effort */ }
  }
  return { iterations };
}

function reasonForResult(result) {
  if (!result) return 'workspace-async-refresh-no-result';
  if (result.error) return 'workspace-async-refresh-spawn-error';
  if (result.signal) return 'workspace-async-refresh-signal-terminated';
  if (result.timeout || result.timed_out) return 'workspace-async-refresh-timeout';
  return 'workspace-async-refresh-nonzero-exit';
}

// 触发：trigger 端。acquire-or-coalesce，acquired 时 detached 派发 wrapper。
function triggerMergedRebuildAsync({
  workspaceRoot,
  command,
  args = [],
  now = defaultNow,
  pid = process.pid,
  spawnDetached = defaultSpawnDetached,
} = {}) {
  if (!workspaceRoot || !command) {
    return { status: 'skipped', reason_code: 'workspace-async-refresh-invalid-input' };
  }
  ensureGraphifyDir(workspaceRoot);
  const nowMs = now();
  const token = crypto.randomUUID();
  let lock;
  try {
    lock = acquireLock(workspaceRoot, { pid, nowMs, token });
  } catch (error) {
    return { status: 'error', reason_code: error.reason_code || 'workspace-async-refresh-lock-failed' };
  }
  if (!lock.acquired) {
    markPending(workspaceRoot);
    return { status: 'coalesced', reason_code: null };
  }
  try {
    const spawned = spawnDetached(workspaceRoot, command, args, { lockToken: token });
    const workerPid = Number.isInteger(spawned)
      ? spawned
      : Number(spawned && spawned.pid);
    if (Number.isInteger(workerPid) && workerPid > 0) {
      claimLockForWorker(workspaceRoot, { token, pid: workerPid, nowMs: now() });
    }
    return { status: 'spawned', reclaimed_stale_lock: lock.reclaimed === true };
  } catch (error) {
    // 派发失败：释放锁，落盘失败，避免锁泄漏。
    try { removeLockIfOwned(lock.lockFile, { token, pid }); } catch (_error) { /* best-effort */ }
    writeStatus(workspaceRoot, {
      schema_version: 'workspace-async-refresh-status.v1',
      ok: false,
      reason_code: 'workspace-async-refresh-spawn-error',
      finished_at_ms: now(),
      pid,
      iterations: 0,
    });
    return { status: 'error', reason_code: 'workspace-async-refresh-spawn-error' };
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
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  child.unref();
  return child.pid;
}

function defaultExec(command, args, options) {
  return childProcess.spawnSync(command, args, {
    cwd: options && options.cwd,
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
      try { out.args = JSON.parse(argv[i + 1] || '[]'); } catch (_error) { out.args = []; }
    }
    else if (argv[i] === '--lock-token') out.lockToken = argv[i + 1];
  }
  return out;
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const parsed = parseRunArgs(argv);
  if (argv.includes('--run') && parsed.workspaceRoot && parsed.command) {
    // Detached wrapper：跑重建、写 status、按 pending 合并、释放锁。
    try {
      runMergedRebuildForeground(parsed);
    } catch (_error) {
      process.exitCode = 1;
    }
  } else if (argv.includes('--trigger') && parsed.workspaceRoot && parsed.command) {
    // 子仓 commit hook 入口：acquire-or-coalesce 后立即返回（重建在后台）。
    try {
      triggerMergedRebuildAsync(parsed);
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
  STARTING_LOCK_GRACE_MS,
  STARTING_LOCK_MAX_MS,
  REBUILD_TIMEOUT_MS,
  lockIsStale,
  lockOwnedBy,
  removeLockIfOwned,
  triggerMergedRebuildAsync,
  runMergedRebuildForeground,
  readAsyncRefreshStatus,
};
