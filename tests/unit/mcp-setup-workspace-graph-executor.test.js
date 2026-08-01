'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  runWorkspaceGraphBuild,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-executor.cjs');
const { GRAPHIFY_OUT_DIRNAME } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-provider-runners.cjs');
const {
  LIFECYCLE_LOCK_BASENAME,
  LIFECYCLE_PID_ENV,
  LIFECYCLE_TOKEN_ENV,
  acquireWorkspaceGraphLifecycleLease,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-lifecycle-lease.cjs');
const {
  INTERNAL_CODEGRAPH_COMMAND_ENV,
  INTERNAL_GRAPHIFY_COMMAND_ENV,
  INTERNAL_REFRESH_ONLY_ENV,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-child-hook.cjs');
const {
  STATUS_BASENAME,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wexec-')));
}
function initRepo(root, rel) {
  const repo = path.resolve(root, rel);
  fs.mkdirSync(repo, { recursive: true });
  spawnSync('git', ['-C', repo, 'init', '-q']);
  return repo;
}
function fakeExec(command, args) {
  const commandName = path.basename(command);
  if (commandName === 'graphify' && args[0] === 'extract') {
    const outDir = args[args.indexOf('--out') + 1];
    const graphPath = path.join(outDir, GRAPHIFY_OUT_DIRNAME, 'graph.json');
    fs.mkdirSync(path.dirname(graphPath), { recursive: true });
    fs.writeFileSync(graphPath, '{}');
  } else if (commandName === 'graphify' && args[0] === 'merge-graphs') {
    fs.writeFileSync(args[args.indexOf('--out') + 1], '{}');
  } else if (commandName === 'codegraph' && args[0] === 'init') {
    fs.mkdirSync(path.join(args[1], '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(args[1], '.codegraph', 'codegraph.db'), 'x');
  }
  return { status: 0, stdout: '', stderr: '' };
}

describe('runWorkspaceGraphBuild — composed capability', () => {
  test('manifest-declared repos build to complete; git stays clean; merged graph exists', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'web');
    fs.mkdirSync(path.join(ws, '.spec-first'), { recursive: true });
    fs.writeFileSync(path.join(ws, '.spec-first', 'workspace.yaml'),
      'schema_version: workspace-manifest.v1\nrepos:\n  - path: api\n  - path: web\n');

    const result = runWorkspaceGraphBuild({ cwd: ws, allowDiscovery: false, exec: fakeExec });
    expect(result.status).toBe('complete');
    expect(result.build.merge.status).toBe('merged');
    expect(fs.existsSync(result.build.merge.merged_graph_path)).toBe(true);
    for (const rel of ['api', 'web']) {
      const st = spawnSync('git', ['-C', path.join(ws, rel), 'status', '--porcelain'], { encoding: 'utf8' }).stdout;
      expect(st.trim()).toBe('');
    }
  });

  test('uses one initial state writer and one final executor state writer per complete build', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const originalWriteFileSync = fs.writeFileSync;
    let stateWriteCount = 0;
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation((target, ...args) => {
      if (String(target).includes('workspace-graph-state.json.tmp-')) stateWriteCount += 1;
      return originalWriteFileSync.call(fs, target, ...args);
    });

    let result;
    try {
      result = runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    } finally {
      writeSpy.mockRestore();
    }

    expect(result.status).toBe('complete');
    expect(stateWriteCount).toBe(2);
  });

  test('discovered-only repos are not built without confirmation', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const result = runWorkspaceGraphBuild({ cwd: ws, allowDiscovery: true, exec: fakeExec });
    expect(result.status).toBe('needs-confirmation');
    expect(result.reason_code).toBe('workspace-repos-need-confirmation');
    expect(result.pending_confirm).toEqual(['api']);
    expect(result.build).toBeNull();
  });

  test('confirmed repos plus discovered candidates remain partial until confirmation', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'web');
    const result = runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: true, exec: fakeExec });
    expect(result.build.status).toBe('complete');
    expect(result.status).toBe('partial');
    expect(result.reason_code).toBe('workspace-repos-need-confirmation');
    expect(result.pending_confirm).toEqual(['web']);
    expect(result.build.state.state.operation_status).toBe('partial');
    expect(result.build.state.state.reason_code).toBe('workspace-repos-need-confirmation');

    const status = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs')
      .runWorkspaceGraphStatus({ cwd: ws, allowDiscovery: true });
    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-repos-need-confirmation');
  });

  test('invalid manifest blocks a CLI-confirmed build before provider mutation', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    fs.mkdirSync(path.join(ws, '.spec-first'), { recursive: true });
    fs.writeFileSync(path.join(ws, '.spec-first', 'workspace.yaml'), [
      'schema_version: workspace-manifest.v1',
      'owner: team',
      '',
    ].join('\n'));
    let called = false;
    const result = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => { called = true; return { status: 0 }; },
    });
    expect(result.status).toBe('failed');
    expect(result.reason_code).toBe('workspace-manifest-schema-invalid');
    expect(result.build).toBeNull();
    expect(called).toBe(false);
  });

  test('nested manifest repos block build before provider mutation', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'platform');
    initRepo(ws, 'platform/service');
    fs.mkdirSync(path.join(ws, '.spec-first'), { recursive: true });
    fs.writeFileSync(path.join(ws, '.spec-first', 'workspace.yaml'),
      'schema_version: workspace-manifest.v1\nrepos:\n  - path: platform\n  - path: platform/service\n');
    let called = false;

    const result = runWorkspaceGraphBuild({
      cwd: ws,
      allowDiscovery: false,
      exec: () => { called = true; return { status: 0 }; },
    });

    expect(result.status).toBe('failed');
    expect(result.reason_code).toBe('workspace-targets-ambiguous');
    expect(result.build).toBeNull();
    expect(called).toBe(false);
  });

  test('CLI-declared repos build even when discovery is off', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'svc');
    const result = runWorkspaceGraphBuild({ cwd: ws, repos: ['svc'], allowDiscovery: false, exec: fakeExec });
    expect(result.status).toBe('complete');
    expect(result.build.merge.status).toBe('single-source');
  });

  test('cwd that is a git repo is skipped as not-eligible', () => {
    const ws = mkWorkspace();
    initRepo(ws, '.');
    const result = runWorkspaceGraphBuild({ cwd: ws, exec: fakeExec });
    expect(result.status).toBe('skipped');
    expect(result.topology).toBe('cwd-is-git-repo');
    expect(result.build).toBeNull();
  });

  test('a complete build injects the routing block into workspace host entry docs', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    // Pin the child's effective hooks root inside the child so classification is deterministic
    // regardless of any ambient global core.hooksPath on the host running the suite.
    spawnSync('git', ['-C', api, 'config', '--local', 'core.hooksPath', '.git/hooks']);
    const result = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
      hosts: ['claude', 'codex'],
    });
    expect(result.status).toBe('complete');
    expect(result.routing).not.toBeNull();
    // Workspace merged-graph commit-time：spec-first 自有子仓 hook 触发异步 merged 重建。
    expect(result.hooks).not.toBeNull();
    expect(result.hooks.status).toBe('installed');
    expect(result.refresh.mode).toBe('commit-hook-spec-first-async');
    const hook = fs.readFileSync(path.join(api, '.git', 'hooks', 'post-commit'), 'utf8');
    expect(hook).toContain('spec-first-graphify-workspace-refresh start');
    expect(hook).toContain('workspace-async-refresh.cjs');
    expect(hook).toContain('--workspace-graph');
    const claude = fs.readFileSync(path.join(ws, 'CLAUDE.md'), 'utf8');
    const agents = fs.readFileSync(path.join(ws, 'AGENTS.md'), 'utf8');
    expect(claude).toContain('projectPath');
    expect(agents).toContain('merged-graph.json');
  });

  test('a workspace child whose effective hooks root is external is not written; merged degrades', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    const outsideHooks = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wexec-ext-hooks-')));
    spawnSync('git', ['-C', api, 'config', '--local', 'core.hooksPath', outsideHooks]);
    const before = fs.readdirSync(outsideHooks);
    const result = runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
    expect(result.status).toBe('complete');
    expect(result.hooks.status).toBe('blocked');
    expect(result.hooks.repos[0]).toMatchObject({ repo_id: 'api', hook_status: 'blocked' });
    expect(result.refresh.mode).toBe('explicit');
    // 绝不写外部 hooks root。
    expect(fs.readdirSync(outsideHooks)).toEqual(before);
    expect(JSON.stringify(result.hooks)).not.toContain(outsideHooks);
  });

  test('injectRouting=false leaves host docs untouched', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const result = runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec, injectRouting: false });
    expect(result.routing).toBeNull();
    expect(fs.existsSync(path.join(ws, 'CLAUDE.md'))).toBe(false);
  });

  test('provider failure on one repo yields partial, not a throw', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'web');
    const failWeb = (command, args) => {
      if (command === 'graphify' && args[0] === 'extract' && args[1].endsWith('web')) {
        return { status: 1, stdout: '', stderr: 'fail' };
      }
      return fakeExec(command, args);
    };
    const result = runWorkspaceGraphBuild({ cwd: ws, repos: ['api', 'web'], allowDiscovery: false, exec: failWeb });
    expect(result.status).toBe('partial');
    const web = result.build.repos.find((r) => r.repo_id === 'web');
    expect(web.graphify_status).toBe('failed');
  });

  test('a competing lifecycle writer blocks an explicit build before provider mutation', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const active = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: ws,
      operation: 'async-refresh',
      pid: process.pid,
    });
    let called = false;

    const result = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => { called = true; return { status: 0 }; },
    });

    expect(result).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-graph-lifecycle-busy',
      active_operation: 'async-refresh',
      build: null,
    });
    expect(called).toBe(false);
    expect(fs.existsSync(path.join(ws, 'graphify-out'))).toBe(false);
    expect(fs.existsSync(path.join(ws, 'api', '.codegraph'))).toBe(false);
    active.release();
  });

  test('a retained release failure persists partial state before a bounded release retry', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const originalRmSync = fs.rmSync;
    let injected = false;
    const rmSpy = jest.spyOn(fs, 'rmSync').mockImplementation((target, options) => {
      if (!injected && String(target).includes(`${LIFECYCLE_LOCK_BASENAME}.quarantine-`)) {
        injected = true;
        const error = new Error('injected lifecycle release cleanup failure');
        error.code = 'EACCES';
        throw error;
      }
      return originalRmSync.call(fs, target, options);
    });

    let result;
    try {
      result = runWorkspaceGraphBuild({
        cwd: ws,
        repos: ['api'],
        allowDiscovery: false,
        exec: fakeExec,
      });
    } finally {
      rmSpy.mockRestore();
    }

    expect(injected).toBe(true);
    expect(result).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-graph-lifecycle-release-failed',
      lifecycle_release: {
        ok: false,
        status: 'failed',
        reason_code: 'workspace-graph-lifecycle-release-failed',
        ownership_retained: true,
      },
      lifecycle_release_retry: {
        ok: true,
        status: 'released',
      },
      build: {
        state: {
          state: {
            operation_status: 'partial',
            reason_code: 'workspace-graph-lifecycle-release-failed',
          },
        },
      },
    });
    expect(fs.existsSync(path.join(ws, '.spec-first', LIFECYCLE_LOCK_BASENAME))).toBe(false);

    const status = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs')
      .runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-graph-lifecycle-release-failed');
  });

  test('a retained release failure keeps the lease when partial state persistence fails', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const originalRmSync = fs.rmSync;
    const originalWriteFileSync = fs.writeFileSync;
    let releaseFailureInjected = false;
    let stateWriteCount = 0;
    const rmSpy = jest.spyOn(fs, 'rmSync').mockImplementation((target, options) => {
      if (!releaseFailureInjected && String(target).includes(`${LIFECYCLE_LOCK_BASENAME}.quarantine-`)) {
        releaseFailureInjected = true;
        const error = new Error('injected lifecycle release cleanup failure');
        error.code = 'EACCES';
        throw error;
      }
      return originalRmSync.call(fs, target, options);
    });
    const writeSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation((target, ...args) => {
      if (String(target).includes('workspace-graph-state.json.tmp-')) {
        stateWriteCount += 1;
        if (stateWriteCount === 3) {
          const error = new Error('injected partial state persistence failure');
          error.code = 'EACCES';
          throw error;
        }
      }
      return originalWriteFileSync.call(fs, target, ...args);
    });

    let result;
    try {
      result = runWorkspaceGraphBuild({
        cwd: ws,
        repos: ['api'],
        allowDiscovery: false,
        exec: fakeExec,
      });
    } finally {
      writeSpy.mockRestore();
      rmSpy.mockRestore();
    }

    expect(releaseFailureInjected).toBe(true);
    expect(stateWriteCount).toBe(3);
    expect(result).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-graph-lifecycle-release-failed',
      lifecycle_release: {
        ok: false,
        status: 'failed',
        ownership_retained: true,
      },
      build: {
        state: {
          ok: false,
          reason_code: 'workspace-state-write-failed',
        },
      },
    });
    expect(result).not.toHaveProperty('lifecycle_release_retry');

    const statePath = path.join(ws, 'graphify-out', 'workspace-graph-state.json');
    expect(JSON.parse(fs.readFileSync(statePath, 'utf8')).operation_status).toBe('complete');
    const lifecyclePath = path.join(ws, '.spec-first', LIFECYCLE_LOCK_BASENAME);
    expect(fs.existsSync(lifecyclePath)).toBe(true);
    const status = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs')
      .runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-graph-lifecycle-busy');
    let providerCalled = false;
    const blockedBuild = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => {
        providerCalled = true;
        return { status: 0, stdout: '', stderr: '' };
      },
    });
    expect(blockedBuild).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-graph-lifecycle-busy',
      build: null,
    });
    expect(providerCalled).toBe(false);
    fs.rmSync(lifecyclePath, { force: true });
  });

  test('a retained release failure retries even when the provider result is already partial', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const originalRmSync = fs.rmSync;
    let injected = false;
    const rmSpy = jest.spyOn(fs, 'rmSync').mockImplementation((target, options) => {
      if (!injected && String(target).includes(`${LIFECYCLE_LOCK_BASENAME}.quarantine-`)) {
        injected = true;
        const error = new Error('injected lifecycle release cleanup failure');
        error.code = 'EACCES';
        throw error;
      }
      return originalRmSync.call(fs, target, options);
    });
    const partialExec = (command, args) => {
      if (path.basename(command) === 'graphify' && args[0] === 'extract') {
        return { status: 1, stdout: '', stderr: 'provider failed' };
      }
      return fakeExec(command, args);
    };

    let result;
    try {
      result = runWorkspaceGraphBuild({
        cwd: ws,
        repos: ['api'],
        allowDiscovery: false,
        exec: partialExec,
      });
    } finally {
      rmSpy.mockRestore();
    }

    expect(injected).toBe(true);
    expect(result).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-graphify-build-partial',
      lifecycle_release: {
        ok: false,
        ownership_retained: true,
      },
      lifecycle_release_retry: {
        ok: true,
        status: 'released',
      },
      build: {
        state: {
          state: {
            operation_status: 'partial',
            reason_code: 'workspace-graphify-build-partial',
          },
        },
      },
    });
    expect(fs.existsSync(path.join(ws, '.spec-first', LIFECYCLE_LOCK_BASENAME))).toBe(false);
  });

  test('a successor-owned release failure leaves state untouched and status reports lifecycle residue', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const originalRmSync = fs.rmSync;
    let successor = null;
    let injected = false;
    const rmSpy = jest.spyOn(fs, 'rmSync').mockImplementation((target, options) => {
      if (!injected && String(target).includes(`${LIFECYCLE_LOCK_BASENAME}.quarantine-`)) {
        injected = true;
        successor = acquireWorkspaceGraphLifecycleLease({
          workspaceRoot: ws,
          operation: 'successor-clean',
          pid: process.pid,
          releaseRemove: originalRmSync,
        });
        const error = new Error('injected successor race during lifecycle release');
        error.code = 'EACCES';
        throw error;
      }
      return originalRmSync.call(fs, target, options);
    });

    let result;
    try {
      result = runWorkspaceGraphBuild({
        cwd: ws,
        repos: ['api'],
        allowDiscovery: false,
        exec: fakeExec,
      });
    } finally {
      rmSpy.mockRestore();
    }

    expect(injected).toBe(true);
    expect(successor).toMatchObject({ ok: true, acquired: true });
    expect(result).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-graph-lifecycle-release-failed',
      lifecycle_release: {
        ok: false,
        status: 'failed',
        reason_code: 'workspace-graph-lifecycle-release-failed',
        ownership_retained: false,
      },
      build: {
        state: {
          state: {
            operation_status: 'complete',
          },
        },
      },
    });
    expect(result).not.toHaveProperty('lifecycle_release_retry');

    const { runWorkspaceGraphStatus } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs');
    let status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.status).toBe('partial');
    expect(status.reason_code).toBe('workspace-graph-lifecycle-busy');

    expect(successor.release()).toMatchObject({ ok: true, status: 'released' });
    status = runWorkspaceGraphStatus({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(status.status).toBe('ready');
    expect(status.reason_code).toBe('');
  });

  test('an async child validates and reuses its parent lifecycle lease', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const parent = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: ws,
      operation: 'async-refresh',
      pid: process.pid,
    });

    const result = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      lifecycleCredential: parent.credential,
    });

    expect(result.status).toBe('complete');
    expect(parent.assertOwned('after-inherited-build')).toMatchObject({ operation: 'async-refresh' });
    parent.release();
  });

  test('refresh-only requires an inherited lifecycle credential before provider mutation', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    let called = false;

    const result = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => { called = true; return { status: 0 }; },
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      refreshOnly: true,
    });

    expect(result).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-graph-refresh-credential-required',
      build: null,
    });
    expect(called).toBe(false);
    expect(fs.existsSync(path.join(ws, 'graphify-out'))).toBe(false);
  });

  test('refresh-only rejects a PATH-resolved Graphify command before provider mutation', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const parent = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: ws,
      operation: 'async-refresh',
      pid: process.pid,
    });
    let called = false;

    const result = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => { called = true; return { status: 0 }; },
      graphifyCommand: 'graphify',
      lifecycleCredential: parent.credential,
      refreshOnly: true,
    });

    expect(result).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-graph-refresh-launcher-invalid',
      build: null,
    });
    expect(called).toBe(false);
    parent.release();
  });

  test('refresh-only does not erase non-recoverable partial state such as pending confirmation', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    spawnSync('git', ['-C', api, 'config', '--local', 'core.hooksPath', '.git/hooks']);
    const initial = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    expect(initial.status).toBe('complete');
    const statePath = path.join(ws, 'graphify-out', 'workspace-graph-state.json');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    state.operation_status = 'partial';
    state.reason_code = 'workspace-repos-need-confirmation';
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);

    const parent = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: ws,
      operation: 'async-refresh',
      pid: process.pid,
    });
    let called = false;
    const result = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => { called = true; return { status: 0 }; },
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      lifecycleCredential: parent.credential,
      refreshOnly: true,
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });

    expect(result).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-graph-refresh-baseline-invalid',
      build: null,
    });
    expect(called).toBe(false);
    parent.release();
  });

  test('refresh-only syncs CodeGraph, rebuilds Graphify, and preserves routing and managed hooks', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    spawnSync('git', ['-C', api, 'config', '--local', 'core.hooksPath', '.git/hooks']);
    const initial = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    expect(initial.status).toBe('complete');
    const initialState = JSON.parse(fs.readFileSync(
      path.join(ws, 'graphify-out', 'workspace-graph-state.json'),
      'utf8',
    ));
    expect(initialState.refresh_hook).toMatchObject({
      schema_version: 'workspace-child-hook-contract.v2',
      managed_block_sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
    const routingPath = path.join(ws, 'AGENTS.md');
    const hookPath = path.join(api, '.git', 'hooks', 'post-commit');
    const before = [routingPath, hookPath].map((file) => ({
      contents: fs.readFileSync(file, 'utf8'),
      mtimeMs: fs.statSync(file).mtimeMs,
    }));
    const parent = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: ws,
      operation: 'async-refresh',
      pid: process.pid,
    });
    const calls = [];
    const inherited = {
      REVIEW_SENTINEL_SECRET: 'must-not-reach-provider',
      [INTERNAL_REFRESH_ONLY_ENV]: '1',
      [INTERNAL_CODEGRAPH_COMMAND_ENV]: '/verified/bin/codegraph',
      [INTERNAL_GRAPHIFY_COMMAND_ENV]: '/verified/bin/graphify',
      [LIFECYCLE_TOKEN_ENV]: parent.credential.token,
      [LIFECYCLE_PID_ENV]: String(parent.credential.owner_pid),
    };
    const previous = Object.fromEntries(Object.keys(inherited).map((key) => [key, process.env[key]]));
    Object.assign(process.env, inherited);
    let refreshed;
    try {
      refreshed = runWorkspaceGraphBuild({
        cwd: ws,
        repos: ['api'],
        allowDiscovery: false,
        exec: (command, args, options = {}) => {
          const effectiveEnv = { ...process.env, ...(options.env || {}) };
          for (const name of options.unsetEnv || []) delete effectiveEnv[name];
          calls.push({ command, args, effectiveEnv });
          return fakeExec(command, args, options);
        },
        codegraphCommand: '/verified/bin/codegraph',
        graphifyCommand: '/verified/bin/graphify',
        lifecycleCredential: parent.credential,
        refreshOnly: true,
        runtimeHost: 'codex',
        bundledVersion: '1.13.2',
      });
    } finally {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }

    expect(refreshed.status).toBe('complete');
    expect(refreshed.refresh.mode).toBe('commit-hook-spec-first-async');
    expect(refreshed.build.state.state.refresh_hook).toEqual(initialState.refresh_hook);
    expect(calls.some(({ args }) => args[0] === 'install' || args[0] === 'init')).toBe(false);
    expect(calls.filter(({ command, args }) => (
      path.basename(command) === 'codegraph' && args[0] === 'sync'
    ))).toEqual([
      expect.objectContaining({ args: ['sync', api] }),
    ]);
    expect(calls.filter(({ args }) => args[0] === 'extract')).toHaveLength(1);
    expect(calls.filter(({ args }) => args[0] === 'merge-graphs')).toHaveLength(1);
    for (const call of calls) {
      expect(call.effectiveEnv).not.toHaveProperty('REVIEW_SENTINEL_SECRET');
      expect(call.effectiveEnv).not.toHaveProperty(INTERNAL_REFRESH_ONLY_ENV);
      expect(call.effectiveEnv).not.toHaveProperty(INTERNAL_CODEGRAPH_COMMAND_ENV);
      expect(call.effectiveEnv).not.toHaveProperty(INTERNAL_GRAPHIFY_COMMAND_ENV);
      expect(call.effectiveEnv).not.toHaveProperty(LIFECYCLE_TOKEN_ENV);
      expect(call.effectiveEnv).not.toHaveProperty(LIFECYCLE_PID_ENV);
    }
    expect([routingPath, hookPath].map((file) => ({
      contents: fs.readFileSync(file, 'utf8'),
      mtimeMs: fs.statSync(file).mtimeMs,
    }))).toEqual(before);
    expect(parent.assertOwned('after-refresh-only')).toMatchObject({ operation: 'async-refresh' });
    parent.release();
  });

  test('refresh-only CodeGraph sync failure stays partial even when Graphify succeeds', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    spawnSync('git', ['-C', api, 'config', '--local', 'core.hooksPath', '.git/hooks']);
    const initial = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    expect(initial.status).toBe('complete');
    const parent = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: ws,
      operation: 'async-refresh',
      pid: process.pid,
    });
    const calls = [];

    const refreshed = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: (command, args, options = {}) => {
        calls.push({ command, args, options });
        if (path.basename(command) === 'codegraph' && args[0] === 'sync') {
          return { status: 1, stdout: '', stderr: 'sync failed' };
        }
        return fakeExec(command, args, options);
      },
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      lifecycleCredential: parent.credential,
      refreshOnly: true,
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });

    expect(refreshed).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-codegraph-sync-partial',
      build: {
        merge: { status: 'single-source' },
        repos: [{
          repo_id: 'api',
          codegraph_status: 'failed',
          graphify_status: 'ready',
          reason_code: 'codegraph-sync-failed',
        }],
        state: {
          state: {
            operation_status: 'partial',
            reason_code: 'workspace-codegraph-sync-partial',
          },
        },
      },
    });
    expect(calls.some(({ args }) => args[0] === 'install' || args[0] === 'init')).toBe(false);
    expect(calls.filter(({ args }) => args[0] === 'sync')).toHaveLength(1);
    expect(calls.filter(({ args }) => args[0] === 'extract')).toHaveLength(1);
    expect(calls.filter(({ args }) => args[0] === 'merge-graphs')).toHaveLength(1);
    parent.release();

    const recoveryLease = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: ws,
      operation: 'async-refresh',
      pid: process.pid,
    });
    const recovered = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      lifecycleCredential: recoveryLease.credential,
      refreshOnly: true,
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });

    expect(recovered).toMatchObject({
      status: 'complete',
      reason_code: '',
      build: {
        repos: [{
          repo_id: 'api',
          codegraph_status: 'ready',
          graphify_status: 'ready',
          reason_code: '',
        }],
        state: {
          state: {
            operation_status: 'complete',
            reason_code: '',
          },
        },
      },
    });
    recoveryLease.release();
  });

  test('a complete build clears the unchanged async failure receipt', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    fs.mkdirSync(path.join(ws, 'graphify-out'), { recursive: true });
    const statusPath = path.join(ws, 'graphify-out', STATUS_BASENAME);
    fs.writeFileSync(statusPath, '{"attempt_id":"old-failure","ok":false}\n');

    const result = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
    });

    expect(result.status).toBe('complete');
    expect(fs.existsSync(statusPath)).toBe(false);
  });

  test('a partial build preserves the prior async failure receipt', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    fs.mkdirSync(path.join(ws, 'graphify-out'), { recursive: true });
    const statusPath = path.join(ws, 'graphify-out', STATUS_BASENAME);
    fs.writeFileSync(statusPath, '{"attempt_id":"old-failure","ok":false}\n');
    const failingExec = (command, args) => {
      if (command === 'graphify' && args[0] === 'extract') return { status: 1, stdout: '', stderr: 'fail' };
      return fakeExec(command, args);
    };

    const result = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: failingExec,
    });

    expect(result.status).toBe('partial');
    expect(JSON.parse(fs.readFileSync(statusPath, 'utf8')).attempt_id).toBe('old-failure');
  });

  test('a complete build preserves a newer receipt written after its starting snapshot', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    fs.mkdirSync(path.join(ws, 'graphify-out'), { recursive: true });
    const statusPath = path.join(ws, 'graphify-out', STATUS_BASENAME);
    fs.writeFileSync(statusPath, '{"attempt_id":"observed-old","ok":false}\n');
    let replaced = false;
    const replacingExec = (command, args) => {
      if (!replaced) {
        fs.writeFileSync(statusPath, '{"attempt_id":"concurrent-new","ok":false}\n');
        replaced = true;
      }
      return fakeExec(command, args);
    };

    const result = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: replacingExec,
    });

    expect(result.status).toBe('complete');
    expect(JSON.parse(fs.readFileSync(statusPath, 'utf8')).attempt_id).toBe('concurrent-new');
  });

  test('a receipt cleanup failure is persisted as partial before the final state is published', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    fs.mkdirSync(path.join(ws, 'graphify-out'), { recursive: true });
    const statusPath = path.join(ws, 'graphify-out', STATUS_BASENAME);
    fs.writeFileSync(statusPath, '{"attempt_id":"old-failure","ok":false}\n');
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

    let result;
    try {
      result = runWorkspaceGraphBuild({
        cwd: ws,
        repos: ['api'],
        allowDiscovery: false,
        exec: fakeExec,
      });
    } finally {
      readSpy.mockRestore();
    }

    expect(injected).toBe(true);
    expect(result).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-async-refresh-status-clear-failed',
      async_status_cleanup: {
        ok: false,
        reason_code: 'workspace-async-refresh-status-clear-failed',
      },
      build: {
        state: {
          state: {
            operation_status: 'partial',
            reason_code: 'workspace-async-refresh-status-clear-failed',
          },
        },
      },
    });
    expect(JSON.parse(fs.readFileSync(statusPath, 'utf8')).attempt_id).toBe('old-failure');
    expect(fs.readdirSync(path.dirname(statusPath)).filter((name) => name.startsWith(`${STATUS_BASENAME}.clear-`))).toEqual([]);
  });

  test('a successful explicit build reclaims a dead async lease snapshot', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    fs.mkdirSync(path.join(ws, 'graphify-out'), { recursive: true });
    const lockPath = path.join(ws, 'graphify-out', 'workspace-async-refresh.lock');
    fs.writeFileSync(lockPath, `${JSON.stringify({
      schema_version: 'workspace-async-refresh-lock.v2',
      token: 'dead-token',
      state: 'running',
      owner_pid: 999999999,
      started_at_ms: Date.now(),
      updated_at_ms: Date.now(),
    })}\n`);

    const result = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
    });

    expect(result.status).toBe('complete');
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  test('a successful provider build is partial when stale async lock cleanup fails', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    fs.mkdirSync(path.join(ws, 'graphify-out'), { recursive: true });
    const lockPath = path.join(ws, 'graphify-out', 'workspace-async-refresh.lock');
    fs.writeFileSync(lockPath, `${JSON.stringify({
      schema_version: 'workspace-async-refresh-lock.v2',
      token: 'dead-token',
      state: 'running',
      owner_pid: 999999999,
      started_at_ms: Date.now(),
      updated_at_ms: Date.now(),
    })}\n`);
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
      result = runWorkspaceGraphBuild({
        cwd: ws,
        repos: ['api'],
        allowDiscovery: false,
        exec: fakeExec,
      });
    } finally {
      renameSpy.mockRestore();
    }

    expect(result).toMatchObject({
      status: 'partial',
      reason_code: 'workspace-async-refresh-lock-cleanup-failed',
      async_lock_cleanup: {
        ok: false,
        changed: false,
        reason_code: 'workspace-async-refresh-lock-cleanup-failed',
      },
      build: {
        state: {
          state: {
            operation_status: 'partial',
            reason_code: 'workspace-async-refresh-lock-cleanup-failed',
          },
        },
      },
    });
    expect(fs.existsSync(lockPath)).toBe(true);
  });
});
