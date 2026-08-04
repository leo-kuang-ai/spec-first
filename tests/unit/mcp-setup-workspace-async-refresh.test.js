'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  LOCK_BASENAME,
  LOCK_SCHEMA_VERSION,
  STATUS_BASENAME,
  PENDING_BASENAME,
  PENDING_SCHEMA_VERSION,
  STARTING_LOCK_GRACE_MS,
  MALFORMED_LOCK_GRACE_MS,
  REBUILD_TIMEOUT_MS,
  triggerMergedRebuildAsync,
  runMergedRebuildForeground,
  readAsyncRefreshStatus,
  clearStaleAsyncRefreshLock,
  clearAsyncRefreshStatus,
  readAsyncRefreshStatusGeneration,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs');
const {
  LIFECYCLE_LOCK_BASENAME,
  LIFECYCLE_PID_ENV,
  LIFECYCLE_TOKEN_ENV,
  acquireWorkspaceGraphLifecycleLease,
  processStartMarker,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-lifecycle-lease.cjs');

const asyncRefreshScript = path.resolve(
  __dirname,
  '../../skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs',
);

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-async-refresh-')));
}

function graphifyFile(root, basename) {
  return path.join(root, 'graphify-out', basename);
}

function ok() {
  return { status: 0 };
}

function writeLock(root, {
  token = 'lock-token',
  state = 'starting',
    ownerPid = process.pid,
    ownerStartMarker = processStartMarker(ownerPid),
    startedAtMs = 0,
  updatedAtMs = startedAtMs,
} = {}) {
  fs.mkdirSync(path.join(root, 'graphify-out'), { recursive: true });
  fs.writeFileSync(graphifyFile(root, LOCK_BASENAME), `${JSON.stringify({
    schema_version: LOCK_SCHEMA_VERSION,
    token,
    state,
    owner_pid: ownerPid,
    owner_start_marker: ownerStartMarker,
    started_at_ms: startedAtMs,
    updated_at_ms: updatedAtMs,
  })}\n`);
  return token;
}

describe('workspace async merged refresh', () => {
  test('publishes pending before attempting to acquire the event lease', () => {
    const root = mkWorkspace();
    const events = [];
    const lockPath = graphifyFile(root, LOCK_BASENAME);
    const pendingPath = graphifyFile(root, PENDING_BASENAME);
    const originalWriteFileSync = fs.writeFileSync;
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation((target, ...args) => {
      if (target === pendingPath) events.push('pending');
      if (target === lockPath && args[1] && args[1].flag === 'wx') events.push('lock');
      return originalWriteFileSync.call(fs, target, ...args);
    });

    try {
      expect(triggerMergedRebuildAsync({
        workspaceRoot: root,
        command: '/abs/launcher',
        spawnDetached: () => ({ pid: process.pid }),
      })).toMatchObject({ status: 'spawned' });
    } finally {
      writeSpy.mockRestore();
    }

    expect(events.slice(0, 2)).toEqual(['pending', 'lock']);
    expect(fs.existsSync(pendingPath)).toBe(false);
  });

  test('acquires a starting lease, passes the token to the detached worker, and promotes worker PID ownership', () => {
    const root = mkWorkspace();
    const spawned = [];
    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/spec-runtime-setup',
      args: ['--only', 'codegraph,graphify', '--workspace-graph', '--repos', 'a,b'],
      now: () => 1000,
      pid: 4242,
      spawnDetached: (workspaceRoot, command, commandArgs, context) => {
        spawned.push({ workspaceRoot, command, commandArgs, context });
        return { pid: 5151 };
      },
    });

    expect(result).toMatchObject({ status: 'spawned' });
    expect(spawned).toHaveLength(1);
    expect(spawned[0].context.lockToken).toMatch(/^[0-9a-f-]{36}$/i);
    const lock = JSON.parse(fs.readFileSync(graphifyFile(root, LOCK_BASENAME), 'utf8'));
    expect(lock).toMatchObject({
      schema_version: LOCK_SCHEMA_VERSION,
      token: spawned[0].context.lockToken,
      state: 'running',
      owner_pid: 5151,
    });
    expect(fs.existsSync(graphifyFile(root, PENDING_BASENAME))).toBe(false);
  });

  test('coalesces a concurrent trigger instead of dispatching a second worker', () => {
    const root = mkWorkspace();
    const spawned = [];
    const opts = {
      workspaceRoot: root,
      command: '/abs/spec-runtime-setup',
      args: ['--workspace-graph'],
      now: () => 2000,
      pid: process.pid,
      spawnDetached: (_workspaceRoot, _command, _commandArgs, context) => {
        spawned.push(context.lockToken);
        return { pid: process.pid };
      },
    };

    expect(triggerMergedRebuildAsync(opts)).toMatchObject({ status: 'spawned' });
    expect(triggerMergedRebuildAsync(opts)).toMatchObject({ status: 'coalesced' });
    expect(spawned).toHaveLength(1);
    expect(fs.existsSync(graphifyFile(root, PENDING_BASENAME))).toBe(true);
  });

  test('keeps a dead trigger starting lease during the worker handoff grace', () => {
    const root = mkWorkspace();
    writeLock(root, {
      token: 'starting-token',
      state: 'starting',
      ownerPid: 999999999,
      startedAtMs: 1000,
    });
    const spawned = [];

    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/launcher',
      now: () => 1000 + STARTING_LOCK_GRACE_MS - 1,
      pid: 4242,
      spawnDetached: () => spawned.push(true),
    });

    expect(result).toMatchObject({ status: 'coalesced' });
    expect(spawned).toHaveLength(0);
    expect(JSON.parse(fs.readFileSync(graphifyFile(root, LOCK_BASENAME), 'utf8')).token)
      .toBe('starting-token');
  });

  test('reclaims a dead starting lease only after the handoff grace', () => {
    const root = mkWorkspace();
    writeLock(root, {
      token: 'stale-starting-token',
      state: 'starting',
      ownerPid: 999999999,
      startedAtMs: 1000,
    });
    const spawned = [];

    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/launcher',
      now: () => 1000 + STARTING_LOCK_GRACE_MS + 1,
      pid: 4242,
      spawnDetached: () => {
        spawned.push(true);
        return { pid: 5252 };
      },
    });

    expect(result).toMatchObject({ status: 'spawned', reclaimed_stale_lock: true });
    expect(spawned).toHaveLength(1);
  });

  test('atomic stale reclaim never deletes a successor event lease', () => {
    const root = mkWorkspace();
    writeLock(root, {
      token: 'stale-starting-token',
      state: 'starting',
      ownerPid: 999999999,
      startedAtMs: 1000,
    });
    const lockPath = graphifyFile(root, LOCK_BASENAME);
    const originalRenameSync = fs.renameSync;
    let successorInstalled = false;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      const result = originalRenameSync.call(fs, source, target);
      if (source === lockPath && !successorInstalled) {
        writeLock(root, {
          token: 'successor-token',
          state: 'running',
          ownerPid: process.pid,
          startedAtMs: 2000,
        });
        successorInstalled = true;
      }
      return result;
    });

    let result;
    try {
      result = triggerMergedRebuildAsync({
        workspaceRoot: root,
        command: '/abs/launcher',
        now: () => 1000 + STARTING_LOCK_GRACE_MS + 1,
        pid: 4242,
        spawnDetached: () => { throw new Error('successor must retain the lease'); },
      });
    } finally {
      renameSpy.mockRestore();
    }

    expect(successorInstalled).toBe(true);
    expect(result).toMatchObject({ status: 'coalesced' });
    expect(JSON.parse(fs.readFileSync(lockPath, 'utf8'))).toMatchObject({
      token: 'successor-token',
      owner_pid: process.pid,
    });
  });

  test('mismatch restoration never overwrites a successor event lease', () => {
    const root = mkWorkspace();
    writeLock(root, {
      token: 'stale-restore-token',
      state: 'starting',
      ownerPid: 999999999,
      startedAtMs: 1000,
    });
    const lockPath = graphifyFile(root, LOCK_BASENAME);
    const originalRenameSync = fs.renameSync;
    const originalLinkSync = fs.linkSync;
    let quarantinePath = null;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      const result = originalRenameSync.call(fs, source, target);
      if (source === lockPath) {
        quarantinePath = target;
        const changed = JSON.parse(fs.readFileSync(target, 'utf8'));
        changed.token = 'changed-after-quarantine';
        fs.writeFileSync(target, `${JSON.stringify(changed)}\n`);
      }
      return result;
    });
    const linkSpy = jest.spyOn(fs, 'linkSync').mockImplementation((source, target) => {
      if (source === quarantinePath && target === lockPath) {
        writeLock(root, {
          token: 'successor-token',
          state: 'running',
          ownerPid: process.pid,
          startedAtMs: 2000,
        });
      }
      return originalLinkSync.call(fs, source, target);
    });

    let result;
    try {
      result = triggerMergedRebuildAsync({
        workspaceRoot: root,
        command: '/abs/launcher',
        now: () => 1000 + STARTING_LOCK_GRACE_MS + 1,
        pid: 4242,
        spawnDetached: () => { throw new Error('successor must retain the lease'); },
      });
    } finally {
      renameSpy.mockRestore();
      linkSpy.mockRestore();
    }

    expect(result).toMatchObject({ status: 'coalesced' });
    expect(JSON.parse(fs.readFileSync(lockPath, 'utf8'))).toMatchObject({
      token: 'successor-token',
      owner_pid: process.pid,
    });
  });

  test('falls back to exclusive copy when event-lock hard-link restoration is unavailable', () => {
    const root = mkWorkspace();
    writeLock(root, {
      token: 'stale-copy-fallback-token',
      state: 'starting',
      ownerPid: 999999999,
      startedAtMs: 1000,
    });
    const lockPath = graphifyFile(root, LOCK_BASENAME);
    const originalRenameSync = fs.renameSync;
    const originalLinkSync = fs.linkSync;
    let quarantinePath = null;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      const result = originalRenameSync.call(fs, source, target);
      if (source === lockPath) {
        quarantinePath = target;
        const changed = JSON.parse(fs.readFileSync(target, 'utf8'));
        changed.token = 'changed-before-copy-fallback';
        fs.writeFileSync(target, `${JSON.stringify(changed)}\n`);
      }
      return result;
    });
    const linkSpy = jest.spyOn(fs, 'linkSync').mockImplementation((source, target) => {
      if (source === quarantinePath && target === lockPath) {
        const error = new Error('hard links unavailable');
        error.code = 'EPERM';
        throw error;
      }
      return originalLinkSync.call(fs, source, target);
    });

    let result;
    try {
      result = triggerMergedRebuildAsync({
        workspaceRoot: root,
        command: '/abs/launcher',
        now: () => 1000 + STARTING_LOCK_GRACE_MS + 1,
        pid: 4242,
        spawnDetached: () => { throw new Error('mismatched lease must be restored'); },
      });
    } finally {
      renameSpy.mockRestore();
      linkSpy.mockRestore();
    }

    expect(result).toMatchObject({ status: 'coalesced' });
    expect(JSON.parse(fs.readFileSync(lockPath, 'utf8')).token)
      .toBe('changed-before-copy-fallback');
    expect(fs.existsSync(quarantinePath)).toBe(false);
  });

  test('reports an event-lock error when every no-clobber restoration method fails', () => {
    const root = mkWorkspace();
    writeLock(root, {
      token: 'stale-restore-failure-token',
      state: 'starting',
      ownerPid: 999999999,
      startedAtMs: 1000,
    });
    const lockPath = graphifyFile(root, LOCK_BASENAME);
    const originalRenameSync = fs.renameSync;
    const originalLinkSync = fs.linkSync;
    const originalCopyFileSync = fs.copyFileSync;
    let quarantinePath = null;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      const result = originalRenameSync.call(fs, source, target);
      if (source === lockPath) {
        quarantinePath = target;
        const changed = JSON.parse(fs.readFileSync(target, 'utf8'));
        changed.token = 'changed-before-restore-failure';
        fs.writeFileSync(target, `${JSON.stringify(changed)}\n`);
      }
      return result;
    });
    const linkSpy = jest.spyOn(fs, 'linkSync').mockImplementation((source, target) => {
      if (source === quarantinePath && target === lockPath) {
        const error = new Error('hard links unavailable');
        error.code = 'EPERM';
        throw error;
      }
      return originalLinkSync.call(fs, source, target);
    });
    const copySpy = jest.spyOn(fs, 'copyFileSync').mockImplementation((source, target, mode) => {
      if (source === quarantinePath && target === lockPath) {
        const error = new Error('exclusive copy unavailable');
        error.code = 'EACCES';
        throw error;
      }
      return originalCopyFileSync.call(fs, source, target, mode);
    });

    let result;
    try {
      result = triggerMergedRebuildAsync({
        workspaceRoot: root,
        command: '/abs/launcher',
        now: () => 1000 + STARTING_LOCK_GRACE_MS + 1,
        pid: 4242,
      });
    } finally {
      renameSpy.mockRestore();
      linkSpy.mockRestore();
      copySpy.mockRestore();
    }

    expect(result).toMatchObject({
      status: 'error',
      reason_code: 'workspace-async-refresh-lock-restore-failed',
    });
    expect(fs.existsSync(lockPath)).toBe(false);
    expect(fs.existsSync(quarantinePath)).toBe(true);
    expect(readAsyncRefreshStatus(root)).toMatchObject({
      status: 'failed',
      last_reason_code: 'workspace-async-refresh-lock-restore-failed',
    });
  });

  test('keeps a fresh malformed lease during the torn-write grace', () => {
    const root = mkWorkspace();
    const lockPath = graphifyFile(root, LOCK_BASENAME);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(lockPath, '{"schema_version":');
    fs.utimesSync(lockPath, new Date(1000), new Date(1000));
    const spawned = [];

    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/launcher',
      now: () => 1000 + MALFORMED_LOCK_GRACE_MS - 1,
      pid: 4242,
      spawnDetached: () => spawned.push(true),
    });

    expect(result).toMatchObject({ status: 'coalesced' });
    expect(spawned).toHaveLength(0);
    expect(fs.readFileSync(lockPath, 'utf8')).toBe('{"schema_version":');
  });

  test('reclaims a stale malformed lease without permanently blocking dispatch', () => {
    const root = mkWorkspace();
    const lockPath = graphifyFile(root, LOCK_BASENAME);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(lockPath, '{"schema_version":');
    fs.utimesSync(lockPath, new Date(1000), new Date(1000));
    const spawned = [];

    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/launcher',
      now: () => 1000 + MALFORMED_LOCK_GRACE_MS + 1,
      pid: 4242,
      spawnDetached: (_workspaceRoot, _command, _args, context) => {
        spawned.push(context.lockToken);
        return { pid: 5353 };
      },
    });

    expect(result).toMatchObject({ status: 'spawned', reclaimed_stale_lock: true });
    expect(spawned).toHaveLength(1);
    expect(JSON.parse(fs.readFileSync(lockPath, 'utf8'))).toMatchObject({
      schema_version: LOCK_SCHEMA_VERSION,
      state: 'running',
      owner_pid: 5353,
    });
  });

  test('explicit stale-lock recovery removes an expired malformed lease', () => {
    const root = mkWorkspace();
    const lockPath = graphifyFile(root, LOCK_BASENAME);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(lockPath, '{"schema_version":');
    fs.utimesSync(lockPath, new Date(1000), new Date(1000));

    expect(clearStaleAsyncRefreshLock(root, {
      now: () => 1000 + MALFORMED_LOCK_GRACE_MS - 1,
    })).toMatchObject({
      ok: true,
      changed: false,
      reason_code: 'workspace-async-refresh-lock-live',
    });
    expect(clearStaleAsyncRefreshLock(root, {
      now: () => 1000 + MALFORMED_LOCK_GRACE_MS + 1,
    })).toMatchObject({
      ok: true,
      changed: true,
      reason_code: null,
    });
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  test('explicit stale-lock recovery reports a same-generation cleanup failure', () => {
    const root = mkWorkspace();
    const lockPath = graphifyFile(root, LOCK_BASENAME);
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    fs.writeFileSync(lockPath, '{"schema_version":');
    fs.utimesSync(lockPath, new Date(1000), new Date(1000));
    const originalRenameSync = fs.renameSync;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      if (source === lockPath) {
        const error = new Error('rename blocked');
        error.code = 'EACCES';
        throw error;
      }
      return originalRenameSync.call(fs, source, target);
    });

    let result;
    try {
      result = clearStaleAsyncRefreshLock(root, {
        now: () => 1000 + MALFORMED_LOCK_GRACE_MS + 1,
      });
    } finally {
      renameSpy.mockRestore();
    }

    expect(result).toMatchObject({
      ok: false,
      changed: false,
      reason_code: 'workspace-async-refresh-lock-cleanup-failed',
    });
    expect(fs.existsSync(lockPath)).toBe(true);
  });

  test('does not reclaim a live running worker solely because the rebuild is old', () => {
    const root = mkWorkspace();
    writeLock(root, {
      token: 'live-running-token',
      state: 'running',
      ownerPid: process.pid,
      startedAtMs: 0,
    });

    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/launcher',
      now: () => REBUILD_TIMEOUT_MS + 60 * 60 * 1000,
      pid: 4242,
      spawnDetached: () => { throw new Error('must not spawn'); },
    });

    expect(result).toMatchObject({ status: 'coalesced' });
    expect(JSON.parse(fs.readFileSync(graphifyFile(root, LOCK_BASENAME), 'utf8')).token)
      .toBe('live-running-token');
  });

  test('reports a reused live PID with a mismatched process-start identity as abandoned', () => {
    const root = mkWorkspace();
    writeLock(root, {
      token: 'reused-worker-token',
      state: 'running',
      ownerPid: process.pid,
      ownerStartMarker: null,
      startedAtMs: Date.now(),
    });

    expect(readAsyncRefreshStatus(root, {
      processIdentity: () => 'mismatched',
    })).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-async-refresh-abandoned',
    });
  });

  test('foreground worker claims the lease, records success, and releases only its token', () => {
    const root = mkWorkspace();
    const token = writeLock(root, { token: 'worker-token', ownerPid: 4242, startedAtMs: 6000 });
    const calls = [];
    const previousSecret = process.env.REVIEW_SENTINEL_SECRET;
    process.env.REVIEW_SENTINEL_SECRET = 'must-not-reach-setup-child';
    let outcome;
    try {
      outcome = runMergedRebuildForeground({
        workspaceRoot: root,
        command: '/abs/launcher',
        args: ['--workspace-graph'],
        exec: (command, args, options) => {
          calls.push({ command, args, cwd: options.cwd, env: options.env });
          return ok();
        },
        now: () => 7000,
        pid: 4242,
        lockToken: token,
      });
    } finally {
      if (previousSecret === undefined) delete process.env.REVIEW_SENTINEL_SECRET;
      else process.env.REVIEW_SENTINEL_SECRET = previousSecret;
    }

    expect(outcome).toEqual({ iterations: 1 });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ command: '/abs/launcher', args: ['--workspace-graph'], cwd: root });
    expect(calls[0].env[LIFECYCLE_TOKEN_ENV]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(calls[0].env[LIFECYCLE_PID_ENV]).toBe('4242');
    expect(calls[0].env).not.toHaveProperty('REVIEW_SENTINEL_SECRET');
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(false);
    expect(fs.existsSync(path.join(root, '.spec-first', LIFECYCLE_LOCK_BASENAME))).toBe(false);
    const status = JSON.parse(fs.readFileSync(graphifyFile(root, STATUS_BASENAME), 'utf8'));
    expect(status).toMatchObject({ ok: true, reason_code: null, iterations: 1, pid: 4242 });
    expect(readAsyncRefreshStatus(root)).toMatchObject({ status: 'succeeded', last_result_ok: true });
  });

  test('records a real spawnSync timeout as timeout instead of spawn error', () => {
    const root = mkWorkspace();
    const token = writeLock(root, { token: 'timeout-worker-token', ownerPid: process.pid });

    runMergedRebuildForeground({
      workspaceRoot: root,
      command: process.execPath,
      args: ['-e', 'setTimeout(() => {}, 1000)'],
      exec: (command, args, options) => spawnSync(command, args, {
        cwd: options.cwd,
        env: options.env,
        encoding: 'utf8',
        timeout: 20,
      }),
      pid: process.pid,
      lockToken: token,
    });

    expect(readAsyncRefreshStatus(root)).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-async-refresh-timeout',
      last_reason_code: 'workspace-async-refresh-timeout',
    });
  });

  test('foreground worker waits for parent PID promotion instead of writing the handoff itself', () => {
    const root = mkWorkspace();
    const token = writeLock(root, {
      token: 'parent-handoff-token',
      ownerPid: 4242,
      startedAtMs: 6500,
    });
    let waitedForParent = false;

    const outcome = runMergedRebuildForeground({
      workspaceRoot: root,
      command: '/abs/launcher',
      exec: ok,
      now: () => 7000,
      pid: 5151,
      lockToken: token,
      awaitWorkerClaim: (lockFile, context) => {
        waitedForParent = true;
        expect(JSON.parse(fs.readFileSync(lockFile, 'utf8'))).toMatchObject({
          token,
          state: 'starting',
          owner_pid: 4242,
        });
        fs.writeFileSync(lockFile, `${JSON.stringify({
          schema_version: LOCK_SCHEMA_VERSION,
          token,
          state: 'running',
          owner_pid: context.pid,
          started_at_ms: 6500,
          updated_at_ms: 7000,
        })}\n`);
        return true;
      },
    });

    expect(waitedForParent).toBe(true);
    expect(outcome).toEqual({ iterations: 1 });
    expect(readAsyncRefreshStatus(root)).toMatchObject({ status: 'succeeded' });
  });

  test('foreground worker records failure while it still owns the lease', () => {
    const root = mkWorkspace();
    const token = writeLock(root, { token: 'failure-token', ownerPid: 4242, startedAtMs: 7000 });
    runMergedRebuildForeground({
      workspaceRoot: root,
      command: '/abs/launcher',
      args: [],
      exec: () => ({ status: 1 }),
      now: () => 8000,
      pid: 4242,
      lockToken: token,
    });
    const status = JSON.parse(fs.readFileSync(graphifyFile(root, STATUS_BASENAME), 'utf8'));
    expect(status).toMatchObject({ ok: false, reason_code: 'workspace-async-refresh-nonzero-exit' });
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(false);
  });

  test('preserves a stale event signal when the worker cannot acquire the lifecycle lease', () => {
    const root = mkWorkspace();
    const deadWorkerPid = 999999999;
    const token = writeLock(root, {
      token: 'lifecycle-busy-token',
      ownerPid: deadWorkerPid,
      startedAtMs: 7500,
    });

    let error;
    try {
      runMergedRebuildForeground({
        workspaceRoot: root,
        command: '/abs/launcher',
        exec: ok,
        now: () => 8000,
        pid: deadWorkerPid,
        lockToken: token,
        acquireLifecycleLease: () => ({
          ok: false,
          reason_code: 'workspace-graph-lifecycle-busy',
        }),
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({ reason_code: 'workspace-graph-lifecycle-busy' });
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(true);
    expect(readAsyncRefreshStatus(root)).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-async-refresh-abandoned',
    });
  });

  test('downgrades a successful build receipt when lifecycle release cannot be confirmed', () => {
    const root = mkWorkspace();
    const token = writeLock(root, {
      token: 'release-failure-token',
      ownerPid: 4242,
      startedAtMs: 7600,
    });
    let releaseCalls = 0;
    const lifecycle = {
      ok: true,
      inherited: false,
      credential: { token: 'lifecycle-token', owner_pid: 4242 },
      assertOwned: () => ({ operation: 'async-refresh' }),
      release: () => {
        releaseCalls += 1;
        return releaseCalls === 1
          ? {
            ok: false,
            status: 'failed',
            reason_code: 'workspace-graph-lifecycle-release-failed',
          }
          : {
            ok: true,
            status: 'released',
            reason_code: 'workspace-graph-lifecycle-released',
          };
      },
    };

    let error;
    try {
      runMergedRebuildForeground({
        workspaceRoot: root,
        command: '/abs/launcher',
        exec: ok,
        now: () => 8100,
        pid: 4242,
        lockToken: token,
        acquireLifecycleLease: () => lifecycle,
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({ reason_code: 'workspace-graph-lifecycle-release-failed' });
    expect(releaseCalls).toBe(2);
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(false);
    expect(JSON.parse(fs.readFileSync(graphifyFile(root, STATUS_BASENAME), 'utf8'))).toMatchObject({
      ok: false,
      reason_code: 'workspace-graph-lifecycle-release-failed',
      iterations: 1,
    });
  });

  test('coalesced pending marker triggers exactly one extra run', () => {
    const root = mkWorkspace();
    const token = writeLock(root, { token: 'pending-token', ownerPid: 4242, startedAtMs: 8000 });
    let runCount = 0;
    const outcome = runMergedRebuildForeground({
      workspaceRoot: root,
      command: '/abs/launcher',
      args: [],
      exec: () => {
        runCount += 1;
        if (runCount === 1) fs.writeFileSync(graphifyFile(root, PENDING_BASENAME), '1');
        return ok();
      },
      now: () => 9000,
      pid: 4242,
      lockToken: token,
    });
    expect(outcome).toEqual({ iterations: 2 });
    expect(runCount).toBe(2);
    expect(fs.existsSync(graphifyFile(root, PENDING_BASENAME))).toBe(false);
  });

  test('hands off a trigger that arrives after the loop exits but before lock release', () => {
    const root = mkWorkspace();
    const token = writeLock(root, { token: 'release-window-token', ownerPid: process.pid, startedAtMs: 8500 });
    const spawned = [];
    let releaseWindowTrigger;

    const outcome = runMergedRebuildForeground({
      workspaceRoot: root,
      command: '/abs/launcher',
      args: ['--workspace-graph'],
      exec: ok,
      now: () => 9000,
      pid: process.pid,
      lockToken: token,
      beforeRelease: () => {
        releaseWindowTrigger = triggerMergedRebuildAsync({
          workspaceRoot: root,
          command: '/abs/launcher',
          args: ['--workspace-graph'],
          now: () => 9000,
          pid: process.pid,
          spawnDetached: (_workspaceRoot, _command, _args, context) => {
            spawned.push(context.lockToken);
            return { pid: 6262 };
          },
        });
      },
      spawnDetached: (_workspaceRoot, _command, _args, context) => {
        spawned.push(context.lockToken);
        return { pid: 6262 };
      },
    });

    expect(releaseWindowTrigger).toMatchObject({ status: 'coalesced' });
    expect(outcome).toMatchObject({
      iterations: 1,
      handoff: { status: 'spawned' },
    });
    expect(spawned).toHaveLength(1);
    expect(fs.existsSync(graphifyFile(root, PENDING_BASENAME))).toBe(false);
    expect(JSON.parse(fs.readFileSync(graphifyFile(root, LOCK_BASENAME), 'utf8'))).toMatchObject({
      state: 'running',
      owner_pid: 6262,
    });
  });

  test('a trigger takes over when the worker releases after acquire miss but before pending is written', () => {
    const root = mkWorkspace();
    writeLock(root, {
      token: 'exiting-worker-token',
      state: 'running',
      ownerPid: process.pid,
      startedAtMs: 9000,
    });
    const lockFile = graphifyFile(root, LOCK_BASENAME);
    const pendingFile = graphifyFile(root, PENDING_BASENAME);
    const spawned = [];
    const originalWriteFileSync = fs.writeFileSync;
    let workerExited = false;
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation((target, ...args) => {
      if (target === pendingFile && !workerExited) {
        fs.rmSync(lockFile, { force: true });
        expect(fs.existsSync(pendingFile)).toBe(false);
        workerExited = true;
      }
      return originalWriteFileSync.call(fs, target, ...args);
    });

    let result;
    try {
      result = triggerMergedRebuildAsync({
        workspaceRoot: root,
        command: '/abs/launcher',
        args: ['--workspace-graph'],
        now: () => 10000,
        pid: process.pid,
        spawnDetached: (_workspaceRoot, _command, _args, context) => {
          spawned.push(context.lockToken);
          return { pid: 6363 };
        },
      });
    } finally {
      writeSpy.mockRestore();
    }

    expect(workerExited).toBe(true);
    expect(result).toMatchObject({ status: 'spawned' });
    expect(spawned).toHaveLength(1);
    expect(fs.existsSync(pendingFile)).toBe(false);
    expect(JSON.parse(fs.readFileSync(lockFile, 'utf8'))).toMatchObject({
      state: 'running',
      owner_pid: 6363,
    });
  });

  test('an old worker cannot write status or delete a successor lock', () => {
    const root = mkWorkspace();
    const token = writeLock(root, { token: 'old-token', ownerPid: 4242, startedAtMs: 9000 });

    expect(() => runMergedRebuildForeground({
      workspaceRoot: root,
      command: '/abs/launcher',
      args: [],
      exec: () => {
        writeLock(root, {
          token: 'successor-token',
          state: 'running',
          ownerPid: process.pid,
          startedAtMs: 10000,
        });
        return ok();
      },
      now: () => 10000,
      pid: 4242,
      lockToken: token,
    })).toThrow('lock ownership changed');

    expect(JSON.parse(fs.readFileSync(graphifyFile(root, LOCK_BASENAME), 'utf8')).token)
      .toBe('successor-token');
    expect(fs.existsSync(graphifyFile(root, STATUS_BASENAME))).toBe(false);
  });

  test('reports in-flight while the lock is held and none when idle with no status', () => {
    const root = mkWorkspace();
    expect(readAsyncRefreshStatus(root)).toMatchObject({ status: 'none' });
    writeLock(root, { token: 'in-flight-token', state: 'running', ownerPid: process.pid });
    expect(readAsyncRefreshStatus(root)).toMatchObject({ status: 'in-flight' });
  });

  test('reports a dead worker lease as abandoned instead of in-flight', () => {
    const root = mkWorkspace();
    writeLock(root, {
      token: 'dead-worker-token',
      state: 'running',
      ownerPid: 999999999,
      startedAtMs: Date.now(),
    });
    expect(readAsyncRefreshStatus(root)).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-async-refresh-abandoned',
    });
  });

  test('keeps an aged coalesced pending marker in-flight while a live worker owns the lock', () => {
    const root = mkWorkspace();
    writeLock(root, {
      token: 'live-worker-with-pending-token',
      state: 'running',
      ownerPid: process.pid,
      startedAtMs: 0,
    });
    const pendingFile = graphifyFile(root, PENDING_BASENAME);
    fs.writeFileSync(pendingFile, '1');
    const old = new Date(Date.now() - STARTING_LOCK_GRACE_MS - 1000);
    fs.utimesSync(pendingFile, old, old);

    expect(readAsyncRefreshStatus(root)).toMatchObject({
      status: 'in-flight',
      reason_code: null,
    });
  });

  test('reports an aged pending marker without a live lock as abandoned', () => {
    const root = mkWorkspace();
    fs.mkdirSync(path.join(root, 'graphify-out'), { recursive: true });
    const pendingFile = graphifyFile(root, PENDING_BASENAME);
    fs.writeFileSync(pendingFile, '1');
    const old = new Date(Date.now() - STARTING_LOCK_GRACE_MS - 1000);
    fs.utimesSync(pendingFile, old, old);

    expect(readAsyncRefreshStatus(root)).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-async-refresh-abandoned',
    });
  });

  test('a real hook trigger skips when clean has removed the auto-refresh state', () => {
    const root = mkWorkspace();
    const spawned = [];
    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/launcher',
      requireActiveState: true,
      isRefreshEnabled: () => false,
      spawnDetached: () => spawned.push(true),
    });

    expect(result).toMatchObject({
      status: 'skipped',
      reason_code: 'workspace-auto-refresh-disabled',
    });
    expect(spawned).toHaveLength(0);
    expect(fs.existsSync(path.join(root, 'graphify-out'))).toBe(false);
  });

  test('the real trigger entrypoint rejects malformed args without dispatching a false-success worker', () => {
    const root = mkWorkspace();
    const graphDir = path.join(root, 'graphify-out');
    fs.mkdirSync(graphDir, { recursive: true });
    fs.writeFileSync(path.join(graphDir, 'workspace-graph-state.json'), `${JSON.stringify({
      schema_version: 'workspace-graph-state.v3',
      generated_at: new Date().toISOString(),
      operation_status: 'complete',
      reason_code: '',
      refresh_mode: 'commit-hook-spec-first-async',
      refresh_hook: {
        schema_version: 'workspace-child-hook-contract.v2',
        managed_block_sha256: '0'.repeat(64),
        node: process.execPath,
        async_refresh_script: asyncRefreshScript,
        setup_script: path.join(root, 'setup.cjs'),
        codegraph_command: process.execPath,
        graphify_command: process.execPath,
        runtime_host: 'codex',
        bundled_version: '1.13.2',
      },
      repos: [],
      merge: null,
      merged_artifact: null,
    })}\n`);

    const result = spawnSync(process.execPath, [
      asyncRefreshScript,
      '--trigger',
      '--workspace', root,
      '--command', process.execPath,
      '--args', '{bad-json',
    ], {
      encoding: 'utf8',
      timeout: 5000,
    });

    expect(result.status).toBe(2);
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(false);
    expect(fs.existsSync(graphifyFile(root, PENDING_BASENAME))).toBe(false);
    expect(readAsyncRefreshStatus(root)).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-async-refresh-args-invalid',
    });
  });

  test('a trigger that races with clean rechecks state before spawn and removes only empty event artifacts', () => {
    const root = mkWorkspace();
    const spawned = [];
    let checks = 0;

    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/launcher',
      requireActiveState: true,
      isRefreshEnabled: () => {
        checks += 1;
        return checks === 1;
      },
      spawnDetached: () => spawned.push(true),
    });

    expect(result).toMatchObject({
      status: 'skipped',
      reason_code: 'workspace-auto-refresh-disabled',
    });
    expect(checks).toBe(2);
    expect(spawned).toHaveLength(0);
    expect(fs.existsSync(path.join(root, 'graphify-out'))).toBe(false);
  });

  test('a delayed worker rechecks enablement after lifecycle acquisition and does not rebuild', () => {
    const root = mkWorkspace();
    const token = writeLock(root, { token: 'delayed-worker-token', ownerPid: process.pid });
    let checks = 0;
    let execCalled = false;

    const outcome = runMergedRebuildForeground({
      workspaceRoot: root,
      command: '/abs/launcher',
      lockToken: token,
      pid: process.pid,
      requireActiveState: true,
      isRefreshEnabled: () => {
        checks += 1;
        return checks === 1;
      },
      exec: () => { execCalled = true; return ok(); },
    });

    expect(outcome).toMatchObject({
      iterations: 0,
      status: 'skipped',
      reason_code: 'workspace-auto-refresh-disabled',
    });
    expect(checks).toBe(2);
    expect(execCalled).toBe(false);
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(false);
    expect(fs.existsSync(graphifyFile(root, STATUS_BASENAME))).toBe(false);
  });

  test('a worker racing with clean does not recreate an empty graphify-out directory', () => {
    const root = mkWorkspace();
    const token = writeLock(root, { token: 'clean-race-worker-token', ownerPid: process.pid });
    let checks = 0;

    const outcome = runMergedRebuildForeground({
      workspaceRoot: root,
      command: '/abs/launcher',
      lockToken: token,
      pid: process.pid,
      requireActiveState: true,
      isRefreshEnabled: () => {
        checks += 1;
        if (checks === 1) {
          fs.rmSync(path.join(root, 'graphify-out'), { recursive: true, force: true });
          return true;
        }
        return false;
      },
      exec: () => { throw new Error('disabled worker must not rebuild'); },
    });

    expect(outcome).toMatchObject({
      iterations: 0,
      status: 'skipped',
      reason_code: 'workspace-auto-refresh-disabled',
    });
    expect(checks).toBe(2);
    expect(fs.existsSync(path.join(root, 'graphify-out'))).toBe(false);
  });

  test('an old disabled worker preserves a successor lock and pending generation', () => {
    const root = mkWorkspace();
    const oldToken = writeLock(root, {
      token: 'old-clean-race-worker-token',
      ownerPid: process.pid,
    });
    const pendingFile = graphifyFile(root, PENDING_BASENAME);
    let checks = 0;

    const outcome = runMergedRebuildForeground({
      workspaceRoot: root,
      command: '/abs/launcher',
      lockToken: oldToken,
      pid: process.pid,
      requireActiveState: true,
      isRefreshEnabled: () => {
        checks += 1;
        if (checks === 1) return true;
        fs.rmSync(path.join(root, 'graphify-out'), { recursive: true, force: true });
        writeLock(root, {
          token: 'successor-clean-race-token',
          state: 'running',
          ownerPid: process.pid,
        });
        fs.writeFileSync(pendingFile, `${JSON.stringify({
          schema_version: PENDING_SCHEMA_VERSION,
          token: 'successor-pending-token',
        })}\n`);
        return false;
      },
      exec: () => { throw new Error('disabled worker must not rebuild'); },
    });

    expect(outcome).toMatchObject({
      iterations: 0,
      status: 'skipped',
      reason_code: 'workspace-auto-refresh-disabled',
    });
    expect(checks).toBe(2);
    expect(JSON.parse(fs.readFileSync(graphifyFile(root, LOCK_BASENAME), 'utf8')).token)
      .toBe('successor-clean-race-token');
    expect(JSON.parse(fs.readFileSync(pendingFile, 'utf8')).token)
      .toBe('successor-pending-token');
  });

  test('claim waiting stops when clean disables refresh after the pre-claim checks', () => {
    const root = mkWorkspace();
    const token = writeLock(root, { token: 'claim-clean-race-token', ownerPid: 4242 });
    let checks = 0;

    const outcome = runMergedRebuildForeground({
      workspaceRoot: root,
      command: '/abs/launcher',
      lockToken: token,
      pid: 5151,
      requireActiveState: true,
      isRefreshEnabled: () => {
        checks += 1;
        if (checks < 3) return true;
        fs.rmSync(path.join(root, 'graphify-out'), { recursive: true, force: true });
        return false;
      },
      exec: () => { throw new Error('disabled worker must not rebuild'); },
    });

    expect(outcome).toMatchObject({
      iterations: 0,
      status: 'skipped',
      reason_code: 'workspace-auto-refresh-disabled',
    });
    expect(checks).toBe(3);
    expect(fs.existsSync(path.join(root, 'graphify-out'))).toBe(false);
  });

  test('status cleanup removes only the generation observed by the successful build', () => {
    const root = mkWorkspace();
    fs.mkdirSync(path.join(root, 'graphify-out'), { recursive: true });
    const statusPath = graphifyFile(root, STATUS_BASENAME);
    fs.writeFileSync(statusPath, `${JSON.stringify({
      schema_version: 'workspace-async-refresh-status.v1',
      attempt_id: 'old-attempt',
      ok: false,
      reason_code: 'old-failure',
    })}\n`);
    const oldGeneration = readAsyncRefreshStatusGeneration(root);

    fs.writeFileSync(statusPath, `${JSON.stringify({
      schema_version: 'workspace-async-refresh-status.v1',
      attempt_id: 'new-attempt',
      ok: false,
      reason_code: 'new-failure',
    })}\n`);
    expect(clearAsyncRefreshStatus(root, { expectedGeneration: oldGeneration })).toMatchObject({
      ok: true,
      changed: false,
      reason_code: 'workspace-async-refresh-status-generation-changed',
    });
    expect(JSON.parse(fs.readFileSync(statusPath, 'utf8')).attempt_id).toBe('new-attempt');

    const newGeneration = readAsyncRefreshStatusGeneration(root);
    expect(clearAsyncRefreshStatus(root, { expectedGeneration: newGeneration })).toMatchObject({
      ok: true,
      changed: true,
    });
    expect(fs.existsSync(statusPath)).toBe(false);
  });

  test('status cleanup reports an atomic rename failure without deleting the receipt', () => {
    const root = mkWorkspace();
    fs.mkdirSync(path.join(root, 'graphify-out'), { recursive: true });
    const statusPath = graphifyFile(root, STATUS_BASENAME);
    fs.writeFileSync(statusPath, '{"attempt_id":"kept","ok":false}\n');
    const generation = readAsyncRefreshStatusGeneration(root);
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementationOnce(() => {
      const error = new Error('rename blocked');
      error.code = 'EACCES';
      throw error;
    });

    let error;
    try {
      clearAsyncRefreshStatus(root, { expectedGeneration: generation });
    } catch (caught) {
      error = caught;
    } finally {
      renameSpy.mockRestore();
    }
    expect(error).toMatchObject({ reason_code: 'workspace-async-refresh-status-clear-failed' });
    expect(fs.existsSync(statusPath)).toBe(true);
  });

  test('status cleanup restores the receipt when a post-rename read fails', () => {
    const root = mkWorkspace();
    fs.mkdirSync(path.join(root, 'graphify-out'), { recursive: true });
    const statusPath = graphifyFile(root, STATUS_BASENAME);
    fs.writeFileSync(statusPath, '{"attempt_id":"kept-after-read-error","ok":false}\n');
    const generation = readAsyncRefreshStatusGeneration(root);
    const originalReadFileSync = fs.readFileSync;
    let injected = false;
    const readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((target, ...args) => {
      if (!injected && String(target).startsWith(`${statusPath}.clear-`)) {
        injected = true;
        const error = new Error('quarantine read blocked');
        error.code = 'EIO';
        throw error;
      }
      return originalReadFileSync.call(fs, target, ...args);
    });

    let error;
    try {
      clearAsyncRefreshStatus(root, { expectedGeneration: generation });
    } catch (caught) {
      error = caught;
    } finally {
      readSpy.mockRestore();
    }

    expect(injected).toBe(true);
    expect(error).toMatchObject({ reason_code: 'workspace-async-refresh-status-clear-failed' });
    expect(JSON.parse(fs.readFileSync(statusPath, 'utf8')).attempt_id).toBe('kept-after-read-error');
    expect(fs.readdirSync(path.dirname(statusPath)).filter((name) => name.startsWith(`${STATUS_BASENAME}.clear-`))).toEqual([]);
  });

  test('status generation restoration never overwrites a concurrent successor receipt', () => {
    const root = mkWorkspace();
    fs.mkdirSync(path.join(root, 'graphify-out'), { recursive: true });
    const statusPath = graphifyFile(root, STATUS_BASENAME);
    fs.writeFileSync(statusPath, '{"attempt_id":"observed-a","ok":false}\n');
    const generation = readAsyncRefreshStatusGeneration(root);
    const originalRenameSync = fs.renameSync;
    const originalLinkSync = fs.linkSync;
    let quarantinePath = null;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      const result = originalRenameSync.call(fs, source, target);
      if (source === statusPath) {
        quarantinePath = target;
        fs.writeFileSync(target, '{"attempt_id":"changed-a","ok":false}\n');
      }
      return result;
    });
    const linkSpy = jest.spyOn(fs, 'linkSync').mockImplementation((source, target) => {
      if (source === quarantinePath && target === statusPath) {
        fs.writeFileSync(statusPath, '{"attempt_id":"successor-b","ok":false}\n');
      }
      return originalLinkSync.call(fs, source, target);
    });

    let result;
    try {
      result = clearAsyncRefreshStatus(root, { expectedGeneration: generation });
    } finally {
      renameSpy.mockRestore();
      linkSpy.mockRestore();
    }

    expect(result).toMatchObject({
      ok: true,
      changed: false,
      reason_code: 'workspace-async-refresh-status-generation-changed',
    });
    expect(JSON.parse(fs.readFileSync(statusPath, 'utf8')).attempt_id).toBe('successor-b');
  });

  test('status cleanup fails loudly when every no-clobber restoration method fails', () => {
    const root = mkWorkspace();
    fs.mkdirSync(path.join(root, 'graphify-out'), { recursive: true });
    const statusPath = graphifyFile(root, STATUS_BASENAME);
    fs.writeFileSync(statusPath, '{"attempt_id":"observed","ok":false}\n');
    const generation = readAsyncRefreshStatusGeneration(root);
    const originalRenameSync = fs.renameSync;
    const originalLinkSync = fs.linkSync;
    const originalCopyFileSync = fs.copyFileSync;
    let quarantinePath = null;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      const result = originalRenameSync.call(fs, source, target);
      if (source === statusPath) {
        quarantinePath = target;
        fs.writeFileSync(target, '{"attempt_id":"changed","ok":false}\n');
      }
      return result;
    });
    const linkSpy = jest.spyOn(fs, 'linkSync').mockImplementation((source, target) => {
      if (source === quarantinePath && target === statusPath) {
        const error = new Error('hard links unavailable');
        error.code = 'EPERM';
        throw error;
      }
      return originalLinkSync.call(fs, source, target);
    });
    const copySpy = jest.spyOn(fs, 'copyFileSync').mockImplementation((source, target, mode) => {
      if (source === quarantinePath && target === statusPath) {
        const error = new Error('exclusive copy unavailable');
        error.code = 'EACCES';
        throw error;
      }
      return originalCopyFileSync.call(fs, source, target, mode);
    });

    let error;
    try {
      clearAsyncRefreshStatus(root, { expectedGeneration: generation });
    } catch (caught) {
      error = caught;
    } finally {
      renameSpy.mockRestore();
      linkSpy.mockRestore();
      copySpy.mockRestore();
    }

    expect(error).toMatchObject({
      reason_code: 'workspace-async-refresh-status-clear-failed',
    });
    expect(fs.existsSync(statusPath)).toBe(false);
    expect(fs.existsSync(quarantinePath)).toBe(true);
  });

  test('status reports an orphaned clear residue as an abandoned refresh', () => {
    const root = mkWorkspace();
    fs.mkdirSync(path.join(root, 'graphify-out'), { recursive: true });
    fs.writeFileSync(
      graphifyFile(root, `${STATUS_BASENAME}.clear-${process.pid}-orphan`),
      '{"attempt_id":"orphan","ok":false}\n',
    );

    expect(readAsyncRefreshStatus(root)).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-async-refresh-abandoned',
      last_result_ok: false,
      last_reason_code: 'workspace-async-refresh-abandoned',
    });
  });

  test('releases only the trigger-owned lease and records failure when detached dispatch throws', () => {
    const root = mkWorkspace();
    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/launcher',
      args: [],
      now: () => 10000,
      pid: 4242,
      spawnDetached: () => { throw new Error('spawn boom'); },
    });
    expect(result).toMatchObject({ status: 'error', reason_code: 'workspace-async-refresh-spawn-error' });
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(false);
    expect(readAsyncRefreshStatus(root)).toMatchObject({ status: 'failed' });
  });

  test('dispatch failure hands a concurrent coalesced trigger to one successor worker', () => {
    const root = mkWorkspace();
    let nested = null;
    let spawnCalls = 0;
    let spawnDetached;
    const trigger = () => triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/launcher',
      pid: process.pid,
      spawnDetached,
    });
    spawnDetached = () => {
      spawnCalls += 1;
      if (spawnCalls === 1) {
        nested = trigger();
        throw new Error('first dispatch fails after successor coalesces');
      }
      return { pid: process.pid };
    };

    const first = trigger();

    expect(nested).toMatchObject({ status: 'coalesced' });
    expect(first).toMatchObject({
      status: 'error',
      reason_code: 'workspace-async-refresh-spawn-error',
      handoff: { status: 'spawned' },
    });
    expect(spawnCalls).toBe(2);
    expect(fs.existsSync(graphifyFile(root, PENDING_BASENAME))).toBe(false);
    expect(JSON.parse(fs.readFileSync(graphifyFile(root, LOCK_BASENAME), 'utf8'))).toMatchObject({
      state: 'running',
      owner_pid: process.pid,
    });
  });

  test('preserves the owned event lease when dispatch failure status cannot be written', () => {
    const root = mkWorkspace();
    const statusPath = graphifyFile(root, STATUS_BASENAME);
    const originalWriteFileSync = fs.writeFileSync;
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation((target, ...args) => {
      if (String(target).startsWith(`${statusPath}.tmp-`)) {
        const error = new Error('status write blocked');
        error.code = 'EACCES';
        throw error;
      }
      return originalWriteFileSync.call(fs, target, ...args);
    });

    let result;
    try {
      result = triggerMergedRebuildAsync({
        workspaceRoot: root,
        command: '/abs/launcher',
        now: () => 0,
        pid: 999999999,
        spawnDetached: () => { throw new Error('spawn boom'); },
      });
    } finally {
      writeSpy.mockRestore();
    }

    expect(result).toMatchObject({
      status: 'error',
      reason_code: 'workspace-async-refresh-spawn-error',
    });
    expect(fs.existsSync(statusPath)).toBe(false);
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(true);
    expect(readAsyncRefreshStatus(root)).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-async-refresh-abandoned',
    });
  });

  test('preserves an abandoned event signal when dispatch failure cannot acquire the status lease', () => {
    const root = mkWorkspace();
    const active = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'explicit-build',
      pid: process.pid,
    });

    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/launcher',
      pid: 999999999,
      now: () => 0,
      spawnDetached: () => { throw new Error('spawn boom'); },
    });

    expect(result).toMatchObject({ status: 'error', reason_code: 'workspace-async-refresh-spawn-error' });
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(true);
    expect(readAsyncRefreshStatus(root)).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-async-refresh-abandoned',
    });
    expect(active.release()).toMatchObject({ ok: true, status: 'released' });
  });

  test('rejects a detached dispatch that does not return a valid PID', () => {
    const root = mkWorkspace();
    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/launcher',
      spawnDetached: () => ({ pid: 0 }),
    });

    expect(result).toMatchObject({
      status: 'error',
      reason_code: 'workspace-async-refresh-spawn-invalid-pid',
    });
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(false);
    expect(readAsyncRefreshStatus(root)).toMatchObject({
      status: 'failed',
      last_reason_code: 'workspace-async-refresh-spawn-invalid-pid',
    });
  });

  test('rejects worker handoff when the spawned PID cannot claim the async lease', () => {
    const root = mkWorkspace();
    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/launcher',
      spawnDetached: () => ({ pid: 6464 }),
      claimWorker: () => false,
    });

    expect(result).toMatchObject({
      status: 'error',
      reason_code: 'workspace-async-refresh-lock-claim-failed',
    });
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(false);
  });
});
