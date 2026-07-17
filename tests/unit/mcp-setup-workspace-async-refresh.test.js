'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  LOCK_BASENAME,
  STATUS_BASENAME,
  PENDING_BASENAME,
  triggerMergedRebuildAsync,
  runMergedRebuildForeground,
  readAsyncRefreshStatus,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-async-refresh-')));
}
function graphifyFile(root, basename) {
  return path.join(root, '.graphify', basename);
}
function ok() {
  return { status: 0 };
}

describe('workspace async merged refresh', () => {
  test('acquires the lock and detached-dispatches the wrapper once when idle', () => {
    const root = mkWorkspace();
    const spawned = [];
    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/spec-runtime-setup',
      args: ['--only', 'codegraph,graphify', '--workspace-graph', '--repos', 'a,b'],
      now: () => 1000,
      pid: 4242,
      spawnDetached: (workspaceRoot, command, commandArgs) => spawned.push({ workspaceRoot, command, commandArgs }),
    });
    expect(result).toMatchObject({ status: 'spawned' });
    expect(spawned).toEqual([
      {
        workspaceRoot: root,
        command: '/abs/spec-runtime-setup',
        commandArgs: ['--only', 'codegraph,graphify', '--workspace-graph', '--repos', 'a,b'],
      },
    ]);
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(true);
    expect(fs.existsSync(graphifyFile(root, PENDING_BASENAME))).toBe(false);
  });

  test('coalesces a concurrent trigger into a pending marker instead of a second spawn', () => {
    const root = mkWorkspace();
    const spawned = [];
    const spawnDetached = (workspaceRoot, command, commandArgs) => spawned.push({ command, commandArgs });
    const opts = {
      workspaceRoot: root,
      command: '/abs/spec-runtime-setup',
      args: ['--workspace-graph'],
      now: () => 2000,
      pid: process.pid, // alive → lock not stale
      spawnDetached,
    };
    expect(triggerMergedRebuildAsync(opts)).toMatchObject({ status: 'spawned' });
    const second = triggerMergedRebuildAsync(opts);
    expect(second).toMatchObject({ status: 'coalesced' });
    expect(spawned).toHaveLength(1);
    expect(fs.existsSync(graphifyFile(root, PENDING_BASENAME))).toBe(true);
  });

  test('reclaims a stale lock whose owner process is dead', () => {
    const root = mkWorkspace();
    fs.mkdirSync(path.join(root, '.graphify'), { recursive: true });
    // pid 999999999 is not a live process; lock is reclaimable.
    fs.writeFileSync(graphifyFile(root, LOCK_BASENAME), JSON.stringify({ pid: 999999999, started_at_ms: 0 }));
    const spawned = [];
    const result = triggerMergedRebuildAsync({
      workspaceRoot: root,
      command: '/abs/launcher',
      args: [],
      now: () => 5000,
      pid: 4242,
      spawnDetached: () => spawned.push(true),
    });
    expect(result).toMatchObject({ status: 'spawned', reclaimed_stale_lock: true });
    expect(spawned).toHaveLength(1);
  });

  test('foreground wrapper runs the rebuild, records success, and releases the lock', () => {
    const root = mkWorkspace();
    fs.mkdirSync(path.join(root, '.graphify'), { recursive: true });
    fs.writeFileSync(graphifyFile(root, LOCK_BASENAME), JSON.stringify({ pid: process.pid, started_at_ms: 0 }));
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
    });
    expect(outcome).toEqual({ iterations: 1 });
    expect(calls).toEqual([{ command: '/abs/launcher', args: ['--workspace-graph'], cwd: root }]);
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(false);
    const status = JSON.parse(fs.readFileSync(graphifyFile(root, STATUS_BASENAME), 'utf8'));
    expect(status).toMatchObject({ ok: true, reason_code: null, iterations: 1 });
    expect(readAsyncRefreshStatus(root)).toMatchObject({ status: 'succeeded', last_result_ok: true });
  });

  test('foreground wrapper records a failure reason without throwing', () => {
    const root = mkWorkspace();
    fs.mkdirSync(path.join(root, '.graphify'), { recursive: true });
    fs.writeFileSync(graphifyFile(root, LOCK_BASENAME), JSON.stringify({ pid: process.pid, started_at_ms: 0 }));
    runMergedRebuildForeground({
      workspaceRoot: root,
      command: '/abs/launcher',
      args: [],
      exec: () => ({ status: 1 }),
      now: () => 8000,
      pid: 4242,
    });
    const status = JSON.parse(fs.readFileSync(graphifyFile(root, STATUS_BASENAME), 'utf8'));
    expect(status).toMatchObject({ ok: false, reason_code: 'workspace-async-refresh-nonzero-exit' });
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(false);
    expect(readAsyncRefreshStatus(root)).toMatchObject({ status: 'failed', reason_code: 'workspace-async-refresh-nonzero-exit' });
  });

  test('coalesced pending marker triggers exactly one extra run, not overlap', () => {
    const root = mkWorkspace();
    fs.mkdirSync(path.join(root, '.graphify'), { recursive: true });
    fs.writeFileSync(graphifyFile(root, LOCK_BASENAME), JSON.stringify({ pid: process.pid, started_at_ms: 0 }));
    let runCount = 0;
    const outcome = runMergedRebuildForeground({
      workspaceRoot: root,
      command: '/abs/launcher',
      args: [],
      exec: () => {
        runCount += 1;
        // A commit arrives during the first run → a concurrent trigger set pending.
        if (runCount === 1) fs.writeFileSync(graphifyFile(root, PENDING_BASENAME), '1');
        return ok();
      },
      now: () => 9000,
      pid: 4242,
    });
    expect(outcome).toEqual({ iterations: 2 });
    expect(runCount).toBe(2);
    expect(fs.existsSync(graphifyFile(root, PENDING_BASENAME))).toBe(false);
    expect(fs.existsSync(graphifyFile(root, LOCK_BASENAME))).toBe(false);
  });

  test('reports in-flight while the lock is held and none when idle with no status', () => {
    const root = mkWorkspace();
    expect(readAsyncRefreshStatus(root)).toMatchObject({ status: 'none' });
    fs.mkdirSync(path.join(root, '.graphify'), { recursive: true });
    fs.writeFileSync(graphifyFile(root, LOCK_BASENAME), JSON.stringify({ pid: process.pid, started_at_ms: 0 }));
    expect(readAsyncRefreshStatus(root)).toMatchObject({ status: 'in-flight' });
  });

  test('releases the lock and records failure when detached dispatch throws', () => {
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
