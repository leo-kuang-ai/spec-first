'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  LIFECYCLE_LOCK_BASENAME,
  LIFECYCLE_LOCK_SCHEMA_VERSION,
  acquireWorkspaceGraphLifecycleLease,
  inspectWorkspaceGraphLifecycle,
  processStartMarker,
  validateWorkspaceGraphLifecycleLease,
  workspaceGraphLifecycleCredentialFromEnv,
  workspaceGraphLifecycleEnv,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-lifecycle-lease.cjs');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-lifecycle-')));
}

describe('workspace graph lifecycle lease', () => {
  test('serializes writers and releases only the current owner', () => {
    const root = mkWorkspace();
    const first = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'explicit-build',
      pid: process.pid,
      now: () => 1000,
    });
    expect(first).toMatchObject({ ok: true, acquired: true });

    const competing = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'clean',
      pid: process.pid,
      now: () => 1001,
    });
    expect(competing).toMatchObject({
      ok: false,
      acquired: false,
      reason_code: 'workspace-graph-lifecycle-busy',
      active_operation: 'explicit-build',
    });

    expect(first.release()).toMatchObject({ ok: true, status: 'released' });
    expect(first.release()).toMatchObject({ ok: true, status: 'released' });
    const afterRelease = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'clean',
      pid: process.pid,
      now: () => 1002,
    });
    expect(afterRelease).toMatchObject({ ok: true, acquired: true });
    expect(afterRelease.release()).toMatchObject({ ok: true, status: 'released' });
  });

  test('waits read-only with backoff while a live lease remains contended', () => {
    const root = mkWorkspace();
    const first = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'explicit-build',
      pid: process.pid,
      now: () => 0,
    });
    let nowMs = 1;
    const sleeps = [];
    const originalWriteFileSync = fs.writeFileSync;
    let stagingWriteCount = 0;
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation((target, ...args) => {
      if (String(target).includes('.pending-')) stagingWriteCount += 1;
      return originalWriteFileSync.call(fs, target, ...args);
    });

    let competing;
    try {
      competing = acquireWorkspaceGraphLifecycleLease({
        workspaceRoot: root,
        operation: 'clean',
        pid: process.pid,
        now: () => nowMs,
        monotonicNow: () => nowMs,
        timeoutMs: 80,
        intervalMs: 5,
        sleep: (milliseconds) => {
          sleeps.push(milliseconds);
          nowMs += milliseconds;
        },
      });
    } finally {
      writeSpy.mockRestore();
    }

    expect(competing).toMatchObject({
      ok: false,
      acquired: false,
      reason_code: 'workspace-graph-lifecycle-busy',
    });
    expect(stagingWriteCount).toBe(1);
    expect(sleeps.length).toBeGreaterThan(1);
    expect(sleeps.some((value, index) => index > 0 && value > sleeps[index - 1])).toBe(true);
    expect(first.release()).toMatchObject({ ok: true, status: 'released' });
  });

  test('uses a monotonic timeout budget when the wall clock moves backward', () => {
    const root = mkWorkspace();
    const first = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'explicit-build',
      pid: process.pid,
      now: () => 1000,
    });
    let wallNowMs = 1001;
    let monotonicNowMs = 0;
    let sleepCount = 0;

    let competing;
    try {
      competing = acquireWorkspaceGraphLifecycleLease({
        workspaceRoot: root,
        operation: 'clean',
        pid: process.pid,
        now: () => wallNowMs,
        monotonicNow: () => monotonicNowMs,
        timeoutMs: 20,
        intervalMs: 5,
        sleep: (milliseconds) => {
          sleepCount += 1;
          if (sleepCount > 6) throw new Error('timeout budget was not enforced');
          monotonicNowMs += milliseconds;
          wallNowMs -= 1000;
        },
      });
    } finally {
      first.release();
    }

    expect(competing).toMatchObject({
      ok: false,
      acquired: false,
      reason_code: 'workspace-graph-lifecycle-busy',
    });
    expect(monotonicNowMs).toBe(20);
    expect(sleepCount).toBe(3);
  });

  test('does not publish a lease after the contention deadline has elapsed', () => {
    const root = mkWorkspace();
    const first = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'explicit-build',
      pid: process.pid,
      now: () => 0,
    });
    let nowMs = 1;
    let monotonicNowMs = 1;
    let released = false;
    let publicationAttempts = 0;

    const competing = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'clean',
      pid: process.pid,
      now: () => nowMs,
      monotonicNow: () => monotonicNowMs,
      timeoutMs: 10,
      intervalMs: 5,
      beforePublish: () => { publicationAttempts += 1; },
      sleep: () => {
        nowMs = 100;
        monotonicNowMs = 100;
        released = true;
        expect(first.release()).toMatchObject({ ok: true, status: 'released' });
      },
    });

    expect(released).toBe(true);
    expect(publicationAttempts).toBe(1);
    expect(competing).toMatchObject({
      ok: false,
      acquired: false,
      reason_code: 'workspace-graph-lifecycle-busy',
    });
    const successor = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'clean',
      pid: process.pid,
      now: () => 101,
    });
    expect(successor).toMatchObject({ ok: true, acquired: true });
    expect(successor.release()).toMatchObject({ ok: true, status: 'released' });
  });

  test('validates inherited ownership without letting the child release the parent lease', () => {
    const root = mkWorkspace();
    const parent = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'async-refresh',
      pid: process.pid,
      now: () => 2000,
    });
    const env = workspaceGraphLifecycleEnv(parent, {});
    const credential = workspaceGraphLifecycleCredentialFromEnv(env);
    const inherited = validateWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      credential,
    });

    expect(inherited).toMatchObject({
      ok: true,
      acquired: false,
      inherited: true,
      active_operation: 'async-refresh',
    });
    expect(inherited.release()).toMatchObject({
      ok: false,
      status: 'skipped',
      reason_code: 'workspace-graph-lifecycle-inherited-release-denied',
    });
    expect(parent.assertOwned('after-child')).toMatchObject({ operation: 'async-refresh' });

    const wrong = validateWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      credential: { ...credential, token: 'wrong-token' },
    });
    expect(wrong).toMatchObject({
      ok: false,
      reason_code: 'workspace-graph-lifecycle-ownership-lost',
    });
    parent.release();
  });

  test('reclaims a lease whose recorded owner is dead', () => {
    const root = mkWorkspace();
    const dead = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'async-refresh',
      pid: 999999999,
      now: () => 3000,
    });
    expect(dead.ok).toBe(true);

    const recovered = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'explicit-build',
      pid: process.pid,
      now: () => 3001,
    });
    expect(recovered).toMatchObject({ ok: true, acquired: true, reclaimed_stale_lock: true });
    expect(dead.release()).toMatchObject({
      ok: false,
      status: 'skipped',
      reason_code: 'workspace-graph-lifecycle-owner-changed',
    });
    recovered.release();
  });

  test('keeps the lease outside graphify-out so graph cleanup cannot delete it', () => {
    const root = mkWorkspace();
    const lease = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'clean',
      pid: process.pid,
    });
    fs.mkdirSync(path.join(root, 'graphify-out'), { recursive: true });
    fs.rmSync(path.join(root, 'graphify-out'), { recursive: true, force: true });

    expect(lease.assertOwned('after-graph-clean')).toMatchObject({ operation: 'clean' });
    expect(fs.existsSync(path.join(root, '.spec-first', LIFECYCLE_LOCK_BASENAME))).toBe(true);
    lease.release();
  });

  test('restores ownership after release cleanup fails and allows a bounded retry', () => {
    const root = mkWorkspace();
    let removeCalls = 0;
    const lease = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'async-refresh',
      pid: process.pid,
      releaseRemove: (target, options) => {
        removeCalls += 1;
        if (removeCalls === 1) {
          const error = new Error('injected cleanup failure');
          error.code = 'EACCES';
          throw error;
        }
        fs.rmSync(target, options);
      },
    });

    expect(lease.release()).toMatchObject({
      ok: false,
      status: 'failed',
      reason_code: 'workspace-graph-lifecycle-release-failed',
      ownership_retained: true,
    });
    expect(lease.assertOwned('after-failed-release')).toMatchObject({ operation: 'async-refresh' });
    expect(lease.release()).toMatchObject({ ok: true, status: 'released' });
    expect(removeCalls).toBe(2);
  });

  test('inspection detects a quarantine created after its first directory snapshot', () => {
    const root = mkWorkspace();
    const controlRoot = path.join(root, '.spec-first');
    const lease = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'explicit-build',
      pid: process.pid,
      releaseRemove: () => {
        const error = new Error('injected quarantine cleanup failure');
        error.code = 'EACCES';
        throw error;
      },
    });
    const originalReaddirSync = fs.readdirSync;
    const originalLinkSync = fs.linkSync;
    const originalCopyFileSync = fs.copyFileSync;
    let release = null;
    let releaseStarted = false;
    const readdirSpy = jest.spyOn(fs, 'readdirSync').mockImplementation((target, options) => {
      const entries = originalReaddirSync.call(fs, target, options);
      if (!releaseStarted && path.resolve(target) === path.resolve(controlRoot)) {
        releaseStarted = true;
        release = lease.release();
      }
      return entries;
    });
    const linkSpy = jest.spyOn(fs, 'linkSync').mockImplementation((source, target) => {
      if (String(target).endsWith(LIFECYCLE_LOCK_BASENAME)) {
        const error = new Error('injected restore failure');
        error.code = 'EPERM';
        throw error;
      }
      return originalLinkSync.call(fs, source, target);
    });
    const copySpy = jest.spyOn(fs, 'copyFileSync').mockImplementation((source, target, flags) => {
      if (String(target).endsWith(LIFECYCLE_LOCK_BASENAME)) {
        const error = new Error('injected restore failure');
        error.code = 'EPERM';
        throw error;
      }
      return originalCopyFileSync.call(fs, source, target, flags);
    });

    let inspection;
    try {
      inspection = inspectWorkspaceGraphLifecycle(root);
    } finally {
      readdirSpy.mockRestore();
      linkSpy.mockRestore();
      copySpy.mockRestore();
    }

    expect(release).toMatchObject({
      ok: false,
      status: 'failed',
      reason_code: 'workspace-graph-lifecycle-release-failed',
      ownership_retained: false,
    });
    expect(inspection).toMatchObject({
      status: 'cleanup-incomplete',
      reason_code: 'workspace-graph-lifecycle-cleanup-incomplete',
      quarantine_count: 1,
    });

    const successor = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'successor-clean',
      pid: process.pid,
    });
    expect(successor).toMatchObject({ ok: true, acquired: true });
    expect(successor.release()).toMatchObject({ ok: true, status: 'released' });
    expect(inspectWorkspaceGraphLifecycle(root)).toMatchObject({
      status: 'none',
      reason_code: '',
      quarantine_count: 0,
    });
  });

  test('preserves no-clobber lifecycle publication and restoration when hard links are unavailable', () => {
    const root = mkWorkspace();
    const originalLinkSync = fs.linkSync;
    const linkSpy = jest.spyOn(fs, 'linkSync').mockImplementation((source, target) => {
      if (target.endsWith(LIFECYCLE_LOCK_BASENAME)) {
        const error = new Error('hard links unavailable');
        error.code = 'EPERM';
        throw error;
      }
      return originalLinkSync.call(fs, source, target);
    });
    let removeCalls = 0;
    let lease;

    try {
      lease = acquireWorkspaceGraphLifecycleLease({
        workspaceRoot: root,
        operation: 'async-refresh',
        pid: process.pid,
        releaseRemove: (target, options) => {
          removeCalls += 1;
          if (removeCalls === 1) {
            const error = new Error('injected cleanup failure');
            error.code = 'EACCES';
            throw error;
          }
          fs.rmSync(target, options);
        },
      });

      expect(lease).toMatchObject({ ok: true, acquired: true });
      expect(lease.release()).toMatchObject({
        ok: false,
        status: 'failed',
        reason_code: 'workspace-graph-lifecycle-release-failed',
        ownership_retained: true,
      });
      expect(lease.assertOwned('after-copy-restoration')).toMatchObject({
        operation: 'async-refresh',
      });
      expect(lease.release()).toMatchObject({ ok: true, status: 'released' });
    } finally {
      linkSpy.mockRestore();
    }

    expect(removeCalls).toBe(2);
  });

  test('a delayed publisher cannot delete a successor lifecycle lease', () => {
    const root = mkWorkspace();
    let successor = null;

    const delayed = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'delayed-build',
      pid: process.pid,
      beforePublish: () => {
        successor = acquireWorkspaceGraphLifecycleLease({
          workspaceRoot: root,
          operation: 'successor-clean',
          pid: process.pid,
        });
      },
    });

    expect(successor).toMatchObject({ ok: true, acquired: true });
    expect(delayed).toMatchObject({
      ok: false,
      acquired: false,
      reason_code: 'workspace-graph-lifecycle-busy',
      active_operation: 'successor-clean',
    });
    expect(successor.assertOwned('after-delayed-publisher')).toMatchObject({
      operation: 'successor-clean',
    });
    expect(successor.release()).toMatchObject({ ok: true, status: 'released' });
  });

  test('does not replace a fresh empty canonical lock during atomic publication', () => {
    const root = mkWorkspace();
    let canonicalLockPath = null;

    const lease = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'explicit-build',
      pid: process.pid,
      now: () => 1000,
      beforePublish: ({ lockPath }) => {
        canonicalLockPath = lockPath;
        fs.mkdirSync(lockPath, { mode: 0o700 });
      },
    });

    expect(lease).toMatchObject({
      ok: false,
      acquired: false,
      reason_code: 'workspace-graph-lifecycle-busy',
      active_operation: 'unknown',
    });
    expect(fs.lstatSync(canonicalLockPath).isDirectory()).toBe(true);
    expect(fs.readdirSync(canonicalLockPath)).toEqual([]);
  });

  test('reclaims a live PID whose process-start identity no longer matches', () => {
    const root = mkWorkspace();
    const stale = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'crashed-old-owner',
      pid: process.pid,
    });
    expect(stale).toMatchObject({ ok: true, acquired: true });

    const lockPath = path.join(root, '.spec-first', LIFECYCLE_LOCK_BASENAME);
    const ownerPath = fs.lstatSync(lockPath).isDirectory()
      ? path.join(lockPath, 'owner.json')
      : lockPath;
    const owner = JSON.parse(fs.readFileSync(ownerPath, 'utf8'));
    owner.owner_start_marker = null;
    fs.writeFileSync(ownerPath, `${JSON.stringify(owner, null, 2)}\n`);

    const recovered = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'successor-clean',
      pid: process.pid,
      processIdentity: () => 'mismatched',
    });

    expect(recovered).toMatchObject({
      ok: true,
      acquired: true,
      reclaimed_stale_lock: true,
    });
    expect(stale.release()).toMatchObject({
      ok: false,
      status: 'skipped',
      reason_code: 'workspace-graph-lifecycle-owner-changed',
    });
    expect(recovered.release()).toMatchObject({ ok: true, status: 'released' });
  });

  test('keeps a live lease busy when process identity cannot be confirmed, regardless of age', () => {
    const root = mkWorkspace();
    const lease = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'long-running-build',
      pid: process.pid,
      now: () => 0,
    });
    expect(lease).toMatchObject({ ok: true, acquired: true });
    const lockPath = path.join(root, '.spec-first', LIFECYCLE_LOCK_BASENAME);
    const owner = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    owner.owner_start_marker = null;
    owner.created_at_ms = 0;
    fs.writeFileSync(lockPath, `${JSON.stringify(owner, null, 2)}\n`);

    const competing = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'clean',
      pid: process.pid,
      now: () => (3 * 60 * 60 * 1000),
    });

    expect(competing).toMatchObject({
      ok: false,
      acquired: false,
      reason_code: 'workspace-graph-lifecycle-busy',
      active_operation: 'long-running-build',
    });
    fs.rmSync(lockPath, { force: true });
  });

  test('quarantine restoration never overwrites a successor lifecycle lease', () => {
    const root = mkWorkspace();
    const lease = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: root,
      operation: 'old-owner',
      pid: process.pid,
    });
    const lockPath = path.join(root, '.spec-first', LIFECYCLE_LOCK_BASENAME);
    const originalRenameSync = fs.renameSync;
    const originalLinkSync = fs.linkSync;
    let quarantinePath = null;
    const renameSpy = jest.spyOn(fs, 'renameSync').mockImplementation((source, target) => {
      const result = originalRenameSync.call(fs, source, target);
      if (source === lockPath) {
        quarantinePath = target;
        const changed = JSON.parse(fs.readFileSync(target, 'utf8'));
        changed.operation = 'changed-after-quarantine';
        fs.writeFileSync(target, `${JSON.stringify(changed, null, 2)}\n`);
      }
      return result;
    });
    const successor = {
      schema_version: LIFECYCLE_LOCK_SCHEMA_VERSION,
      token: 'successor-token',
      owner_pid: process.pid,
      owner_start_marker: processStartMarker(process.pid),
      operation: 'successor-clean',
      created_at_ms: Date.now(),
    };
    const linkSpy = jest.spyOn(fs, 'linkSync').mockImplementation((source, target) => {
      if (source === quarantinePath && target === lockPath) {
        fs.writeFileSync(lockPath, `${JSON.stringify(successor, null, 2)}\n`, { flag: 'wx' });
      }
      return originalLinkSync.call(fs, source, target);
    });

    let release;
    try {
      release = lease.release();
    } finally {
      renameSpy.mockRestore();
      linkSpy.mockRestore();
    }

    expect(release).toMatchObject({
      ok: false,
      status: 'skipped',
      reason_code: 'workspace-graph-lifecycle-owner-changed',
    });
    expect(JSON.parse(fs.readFileSync(lockPath, 'utf8'))).toMatchObject({
      token: 'successor-token',
      operation: 'successor-clean',
    });
    fs.rmSync(lockPath, { force: true });
  });
});
