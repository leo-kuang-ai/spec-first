'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  LOCK_BASENAME,
  LOCK_SCHEMA_VERSION,
  STATUS_BASENAME,
  PENDING_BASENAME,
  STARTING_LOCK_GRACE_MS,
  REBUILD_TIMEOUT_MS,
  triggerMergedRebuildAsync,
  runMergedRebuildForeground,
  readAsyncRefreshStatus,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs');

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
  startedAtMs = 0,
  updatedAtMs = startedAtMs,
} = {}) {
  fs.mkdirSync(path.join(root, 'graphify-out'), { recursive: true });
  fs.writeFileSync(graphifyFile(root, LOCK_BASENAME), `${JSON.stringify({
    schema_version: LOCK_SCHEMA_VERSION,
    token,
    state,
    owner_pid: ownerPid,
    started_at_ms: startedAtMs,
    updated_at_ms: updatedAtMs,
  })}\n`);
  return token;
}

describe('workspace async merged refresh', () => {
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

  test('foreground worker claims the lease, records success, and releases only its token', () => {
    const root = mkWorkspace();
    const token = writeLock(root, { token: 'worker-token', ownerPid: 4242, startedAtMs: 6000 });
    const calls = [];
    const outcome = runMergedRebuildForeground({
      workspaceRoot: root,
      command: '/abs/launcher',
      args: ['--workspace-graph'],
      exec: (command, args, options) => {
        calls.push({ command, args, cwd: options.cwd });
        return ok();
      },
      now: () => 7000,
      pid: 4242,
      lockToken: token,
    });

    expect(outcome).toEqual({ iterations: 1 });
    expect(calls).toEqual([{ command: '/abs/launcher', args: ['--workspace-graph'], cwd: root }]);
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(false);
    const status = JSON.parse(fs.readFileSync(graphifyFile(root, STATUS_BASENAME), 'utf8'));
    expect(status).toMatchObject({ ok: true, reason_code: null, iterations: 1, pid: 4242 });
    expect(readAsyncRefreshStatus(root)).toMatchObject({ status: 'succeeded', last_result_ok: true });
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
    writeLock(root, { token: 'in-flight-token' });
    expect(readAsyncRefreshStatus(root)).toMatchObject({ status: 'in-flight' });
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
});
