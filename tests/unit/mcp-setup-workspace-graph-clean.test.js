'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { runWorkspaceGraphClean } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-clean.cjs');
const { runWorkspaceGraphBuild } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-executor.cjs');
const { GRAPHIFY_OUT_DIRNAME } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-provider-runners.cjs');
const {
  BLOCK_END,
  HOOK_MARKER,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-child-hook.cjs');
const {
  acquireWorkspaceGraphLifecycleLease,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-lifecycle-lease.cjs');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-clean-')));
}
function initRepo(root, rel) {
  const repo = path.resolve(root, rel);
  fs.mkdirSync(repo, { recursive: true });
  spawnSync('git', ['-C', repo, 'init', '-q']);
  spawnSync('git', ['-C', repo, 'config', '--local', 'core.hooksPath', '.git/hooks']);
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
function status(repo) {
  return spawnSync('git', ['-C', repo, 'status', '--porcelain'], { encoding: 'utf8' }).stdout.trim();
}

describe('runWorkspaceGraphClean — reverses the build, self-only and idempotent', () => {
  test('after build, clean removes .codegraph, graphify-out, exclude block, and routing', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'web');

    const build = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api', 'web'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
      hosts: ['claude', 'codex'],
    });
    expect(build.status).toBe('complete');
    expect(fs.existsSync(path.join(ws, 'api', '.codegraph'))).toBe(true);
    expect(fs.existsSync(path.join(ws, 'graphify-out'))).toBe(true);
    expect(fs.readFileSync(path.join(ws, 'CLAUDE.md'), 'utf8')).toContain('projectPath');

    const uninstalls = [];
    const cleanExec = (command, args, opts) => { uninstalls.push({ command, args, cwd: opts && opts.cwd }); return { status: 0 }; };
    const clean = runWorkspaceGraphClean({ cwd: ws, repos: ['api', 'web'], allowDiscovery: false, exec: cleanExec });

    expect(clean.status).toBe('complete');
    expect(fs.existsSync(path.join(ws, 'api', '.codegraph'))).toBe(false);
    expect(fs.existsSync(path.join(ws, 'web', '.codegraph'))).toBe(false);
    expect(fs.existsSync(path.join(ws, 'graphify-out'))).toBe(false);
    expect(clean.workspace_graphify_removed).toBe(true);
    // build 安装了 spec-first 自有子仓 hook（children contained）；clean 对称移除 managed block，
    // 绝不调用 graphify hook uninstall。
    expect(uninstalls.filter((u) => u.args.join(' ') === 'hook uninstall').length).toBe(0);
    expect(clean.repos.every((repo) => repo.hook_status === 'uninstalled')).toBe(true);
    // Managed routing block stripped.
    expect(clean.routing).not.toBeNull();
    expect(clean.routing.entries.some((e) => e.status === 'stripped')).toBe(true);
    if (fs.existsSync(path.join(ws, 'CLAUDE.md'))) {
      expect(fs.readFileSync(path.join(ws, 'CLAUDE.md'), 'utf8')).not.toContain('spec-first:workspace-routing start');
    }
    // git stays clean (exclude block removed AND .codegraph gone → nothing untracked).
    for (const rel of ['api', 'web']) expect(status(path.join(ws, rel))).toBe('');
  });

  test('preserves user-authored exclude lines; idempotent second run is a no-op', () => {
    const ws = mkWorkspace();
    const repo = initRepo(ws, 'api');
    // user rule in the same repo's info/exclude
    const { resolveExcludePath } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-git-exclude.cjs');
    const excludePath = resolveExcludePath(repo).absolute;
    fs.writeFileSync(excludePath, '# user\n*.tmp\n');

    runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    runWorkspaceGraphClean({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: () => ({ status: 0 }) });

    const contents = fs.readFileSync(excludePath, 'utf8');
    expect(contents).toContain('*.tmp');
    expect(contents).not.toContain('.codegraph/');

    // Second clean: nothing left to remove.
    const again = runWorkspaceGraphClean({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: () => ({ status: 0 }) });
    expect(again.status).toBe('complete');
    expect(again.workspace_graphify_removed).toBe(false);
    expect(again.repos[0].codegraph_removed).toBe(false);
  });

  test('removes a legacy workspace .graphify tree instead of reporting a false complete', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    fs.mkdirSync(path.join(ws, '.graphify'), { recursive: true });
    fs.writeFileSync(path.join(ws, '.graphify', 'merged-graph.json'), '{}');

    const clean = runWorkspaceGraphClean({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => ({ status: 0 }),
    });

    expect(clean.status).toBe('complete');
    expect(clean.workspace_graphify_status).toBe('removed');
    expect(clean.workspace_graphify_removed).toBe(true);
    expect(fs.existsSync(path.join(ws, '.graphify'))).toBe(false);
  });

  test('cwd that is a git repo is skipped', () => {
    const ws = mkWorkspace();
    initRepo(ws, '.');
    const clean = runWorkspaceGraphClean({ cwd: ws });
    expect(clean.status).toBe('skipped');
    expect(clean.topology).toBe('cwd-is-git-repo');
  });

  test('discovery-only clean requires confirmation and performs no child mutation', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    fs.mkdirSync(path.join(api, '.codegraph'), { recursive: true });
    let execCalled = false;

    const clean = runWorkspaceGraphClean({
      cwd: ws,
      allowDiscovery: true,
      exec: () => { execCalled = true; return { status: 0 }; },
    });

    expect(clean.status).toBe('needs-confirmation');
    expect(clean.pending_confirm).toEqual(['api']);
    expect(execCalled).toBe(false);
    expect(fs.existsSync(path.join(api, '.codegraph'))).toBe(true);
  });

  test('ambiguous nested manifest repos block clean before child mutation', () => {
    const ws = mkWorkspace();
    const platform = initRepo(ws, 'platform');
    initRepo(ws, 'platform/service');
    fs.mkdirSync(path.join(platform, '.codegraph'), { recursive: true });
    fs.mkdirSync(path.join(ws, '.spec-first'), { recursive: true });
    fs.writeFileSync(path.join(ws, '.spec-first', 'workspace.yaml'),
      'schema_version: workspace-manifest.v1\nrepos:\n  - path: platform\n  - path: platform/service\n');

    const clean = runWorkspaceGraphClean({
      cwd: ws,
      allowDiscovery: false,
      exec: () => ({ status: 0 }),
    });

    expect(clean.status).toBe('failed');
    expect(clean.reason_code).toBe('workspace-targets-ambiguous');
    expect(fs.existsSync(path.join(platform, '.codegraph'))).toBe(true);
  });

  test('confirmed cleanup with an additional discovered repo remains partial', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const web = initRepo(ws, 'web');
    fs.mkdirSync(path.join(web, '.codegraph'), { recursive: true });
    const clean = runWorkspaceGraphClean({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: true,
      exec: () => ({ status: 0 }),
    });
    expect(clean.status).toBe('partial');
    expect(clean.reason_code).toBe('workspace-repos-need-confirmation');
    expect(clean.pending_confirm).toEqual(['web']);
    expect(fs.existsSync(path.join(web, '.codegraph'))).toBe(true);
  });

  test('invalid manifest blocks clean before child mutation', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    fs.mkdirSync(path.join(api, '.codegraph'), { recursive: true });
    fs.mkdirSync(path.join(ws, '.spec-first'), { recursive: true });
    fs.writeFileSync(path.join(ws, '.spec-first', 'workspace.yaml'), 'schema_version: workspace-manifest.v1\nunknown: value\n');
    const clean = runWorkspaceGraphClean({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(clean.status).toBe('failed');
    expect(clean.reason_code).toBe('workspace-manifest-schema-invalid');
    expect(fs.existsSync(path.join(api, '.codegraph'))).toBe(true);
  });

  test('partial child cleanup preserves the state receipt for a bare retry', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    fs.mkdirSync(path.join(ws, '.graphify'), { recursive: true });
    fs.writeFileSync(path.join(ws, '.graphify', 'legacy-receipt.json'), '{}');
    const { resolveExcludePath, MANAGED_BLOCK_START } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-git-exclude.cjs');
    const excludePath = resolveExcludePath(api).absolute;
    fs.writeFileSync(excludePath, `${MANAGED_BLOCK_START}\n.codegraph/\n`);
    const first = runWorkspaceGraphClean({ cwd: ws, repos: ['api'], allowDiscovery: false });
    expect(first.status).toBe('partial');
    expect(first.workspace_graphify_status).toBe('preserved');
    expect(fs.existsSync(path.join(ws, 'graphify-out', 'workspace-graph-state.json'))).toBe(true);
    expect(fs.existsSync(path.join(ws, '.graphify', 'legacy-receipt.json'))).toBe(true);

    fs.writeFileSync(excludePath, '# repaired\n');
    const retry = runWorkspaceGraphClean({ cwd: ws, allowDiscovery: true, exec: () => ({ status: 0 }) });
    expect(retry.repos.map((repo) => repo.repo_id)).toEqual(['api']);
    expect(retry.status).toBe('complete');
  });

  test('clean without --repos reuses the last managed state repo set', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });

    const clean = runWorkspaceGraphClean({
      cwd: ws,
      allowDiscovery: true,
      exec: () => ({ status: 0 }),
    });

    expect(clean.status).toBe('complete');
    expect(clean.repos.map((repo) => repo.repo_id)).toEqual(['api']);
    expect(fs.existsSync(path.join(ws, 'api', '.codegraph'))).toBe(false);
  });

  test('native Graphify hook uninstall failure makes clean partial', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
      installHooks: false,
    });
    fs.rmSync(path.join(ws, 'graphify-out', 'workspace-graph-state.json'));
    fs.writeFileSync(
      path.join(api, '.git', 'hooks', 'post-commit'),
      '#!/bin/sh\n# Installed by: graphify hook install\n',
    );

    const clean = runWorkspaceGraphClean({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => ({ status: 1 }),
    });

    expect(clean.status).toBe('partial');
    expect(clean.reason_code).toBe('workspace-clean-partial');
    expect(clean.repos[0].hook_status).toBe('failed');
  });

  test('native Graphify hook uninstall zero-exit no-op makes clean partial', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
      installHooks: false,
    });
    const hookPath = path.join(api, '.git', 'hooks', 'post-commit');
    fs.writeFileSync(hookPath, '#!/bin/sh\n# Installed by: graphify hook install\n');

    const clean = runWorkspaceGraphClean({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => ({ status: 0 }),
    });

    expect(clean.status).toBe('partial');
    expect(clean.repos[0]).toMatchObject({
      hook_status: 'failed',
      reason_code: 'graphify-hook-uninstall-incomplete',
    });
    expect(clean.workspace_graphify_status).toBe('preserved');
    expect(fs.readFileSync(hookPath, 'utf8')).toContain('Installed by: graphify hook install');
  });

  test('mixed spec-first and native hook uninstall zero-exit no-op makes clean partial', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    const hookPath = path.join(api, '.git', 'hooks', 'post-commit');
    fs.appendFileSync(hookPath, '\n# Installed by: graphify hook install\n');

    const clean = runWorkspaceGraphClean({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => ({ status: 0 }),
    });

    expect(clean.status).toBe('partial');
    expect(clean.repos[0]).toMatchObject({
      hook_status: 'failed',
      reason_code: 'graphify-hook-uninstall-incomplete',
    });
    expect(clean.workspace_graphify_status).toBe('preserved');
    const remaining = fs.readFileSync(hookPath, 'utf8');
    expect(remaining).not.toContain(HOOK_MARKER);
    expect(remaining).toContain('Installed by: graphify hook install');
  });

  test.each(['explicit', 'invalid', 'missing'])(
    'an unreadable contained hook in %s state makes clean partial',
    (stateMode) => {
      const ws = mkWorkspace();
      const api = initRepo(ws, 'api');
      runWorkspaceGraphBuild({
        cwd: ws,
        repos: ['api'],
        allowDiscovery: false,
        exec: fakeExec,
        codegraphCommand: '/verified/bin/codegraph',
        graphifyCommand: '/verified/bin/graphify',
        runtimeHost: 'codex',
        bundledVersion: '1.13.2',
        installHooks: false,
      });
      const statePath = path.join(ws, 'graphify-out', 'workspace-graph-state.json');
      if (stateMode === 'invalid') fs.writeFileSync(statePath, '{broken');
      if (stateMode === 'missing') fs.rmSync(statePath);
      const hookPath = path.join(api, '.git', 'hooks', 'post-commit');
      fs.writeFileSync(hookPath, '#!/bin/sh\n# Installed by: graphify hook install\n');
      const originalOpenSync = fs.openSync;
      const openSpy = jest.spyOn(fs, 'openSync').mockImplementation((filePath, ...args) => {
        if (typeof filePath === 'string' && path.resolve(filePath) === hookPath) {
          const error = new Error('hook unreadable');
          error.code = 'EACCES';
          throw error;
        }
        return originalOpenSync(filePath, ...args);
      });

      let clean;
      try {
        clean = runWorkspaceGraphClean({
          cwd: ws,
          repos: ['api'],
          allowDiscovery: false,
          exec: () => ({ status: 0 }),
        });
      } finally {
        openSpy.mockRestore();
      }

      expect(clean.status).toBe('partial');
      expect(clean.repos[0]).toMatchObject({
        hook_status: 'blocked',
        reason_code: 'workspace-child-hook-unreadable',
      });
      expect(clean.workspace_graphify_status).toBe('preserved');
      expect(fs.existsSync(path.join(ws, 'graphify-out'))).toBe(true);
    },
  );

  test.each(['workspace-graph-state.v1', 'workspace-graph-state.v2'])(
    'an unreadable %s receipt still removes contained spec-first managed hooks',
    (schemaVersion) => {
      const ws = mkWorkspace();
      const api = initRepo(ws, 'api');
      const hookPath = path.join(api, '.git', 'hooks', 'post-commit');
      fs.writeFileSync(hookPath, '#!/bin/sh\necho user-hook\n');
      const build = runWorkspaceGraphBuild({
        cwd: ws,
        repos: ['api'],
        allowDiscovery: false,
        exec: fakeExec,
        codegraphCommand: '/verified/bin/codegraph',
        graphifyCommand: '/verified/bin/graphify',
        runtimeHost: 'codex',
        bundledVersion: '1.13.2',
      });
      expect(build.status).toBe('complete');
      const statePath = path.join(ws, 'graphify-out', 'workspace-graph-state.json');
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      state.schema_version = schemaVersion;
      fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
      let nativeUninstallCalls = 0;

      const clean = runWorkspaceGraphClean({
        cwd: ws,
        repos: ['api'],
        allowDiscovery: false,
        exec: () => { nativeUninstallCalls += 1; return { status: 0 }; },
      });

      expect(clean.status).toBe('complete');
      expect(clean.repos[0].hook_status).toBe('uninstalled');
      expect(nativeUninstallCalls).toBe(0);
      const cleanedHook = fs.readFileSync(hookPath, 'utf8');
      expect(cleanedHook).toContain('#!/bin/sh');
      expect(cleanedHook).toContain('echo user-hook');
      expect(cleanedHook).not.toContain(HOOK_MARKER);
    },
  );

  test('a malformed managed hook makes clean partial and preserves the workspace receipt', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    const build = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    expect(build.status).toBe('complete');
    const hookPath = path.join(api, '.git', 'hooks', 'post-commit');
    fs.writeFileSync(hookPath, fs.readFileSync(hookPath, 'utf8').replace(BLOCK_END, ''));

    const clean = runWorkspaceGraphClean({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => ({ status: 0 }),
    });

    expect(clean.status).toBe('partial');
    expect(clean.reason_code).toBe('workspace-clean-partial');
    expect(clean.repos[0]).toMatchObject({
      hook_status: 'failed',
      reason_code: 'workspace-child-hook-managed-block-stale',
    });
    expect(clean.workspace_graphify_status).toBe('preserved');
    expect(fs.existsSync(path.join(ws, 'graphify-out', 'workspace-graph-state.json'))).toBe(true);
  });

  test('explicit state still removes a contained legacy Graphify hook marker', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    // installHooks:false → build 保持 explicit refresh state（不装 spec-first 自有 hook），
    // 从而走 legacy 分支：contained + graphify marker → provider-native uninstall。
    runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
      installHooks: false,
    });
    const hooks = path.join(api, '.git', 'hooks');
    fs.writeFileSync(path.join(hooks, 'post-commit'), '#!/bin/sh\n# Installed by: graphify hook install\n');
    let calls = 0;
    const clean = runWorkspaceGraphClean({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => {
        calls += 1;
        fs.rmSync(path.join(hooks, 'post-commit'), { force: true });
        return { status: 0 };
      },
    });
    expect(clean.status).toBe('complete');
    expect(clean.repos[0].hook_status).toBe('uninstalled');
    expect(calls).toBe(1);
  });

  test('hook uninstall is blocked when core.hooksPath escapes the workspace', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-clean-hooks-outside-'));
    spawnSync('git', ['-C', api, 'config', '--local', 'core.hooksPath', outside]);
    let execCalled = false;

    const clean = runWorkspaceGraphClean({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => { execCalled = true; return { status: 0 }; },
    });

    // Legacy/no-state cleanup cannot safely touch an escaping hooksPath.
    expect(clean.status).toBe('partial');
    expect(clean.repos[0].hook_status).toBe('blocked');
    expect(clean.repos[0].reason_code).toBe('hook-target-escapes-workspace');
    expect(execCalled).toBe(false);
  });

  test('an active build blocks clean before any managed asset is removed', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      codegraphCommand: '/verified/bin/codegraph',
      graphifyCommand: '/verified/bin/graphify',
      runtimeHost: 'codex',
      bundledVersion: '1.13.2',
    });
    const mergedPath = path.join(ws, 'graphify-out', 'merged-graph.json');
    const hookPath = path.join(api, '.git', 'hooks', 'post-commit');
    const active = acquireWorkspaceGraphLifecycleLease({
      workspaceRoot: ws,
      operation: 'async-refresh',
      pid: process.pid,
    });

    const clean = runWorkspaceGraphClean({
      cwd: ws,
      repos: ['api'],
      allowDiscovery: false,
      exec: () => ({ status: 0 }),
    });

    expect(clean).toMatchObject({
      status: 'failed',
      reason_code: 'workspace-graph-lifecycle-busy',
      active_operation: 'async-refresh',
    });
    expect(fs.existsSync(mergedPath)).toBe(true);
    expect(fs.readFileSync(hookPath, 'utf8')).toContain('spec-first-graphify-workspace-refresh');
    expect(fs.existsSync(path.join(api, '.codegraph'))).toBe(true);
    active.release();
  });
});
