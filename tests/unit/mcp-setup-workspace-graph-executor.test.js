'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  runWorkspaceGraphBuild,
} = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-executor.cjs');
const { GRAPHIFY_OUT_DIRNAME } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-provider-runners.cjs');

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
  if (command === 'graphify' && args[0] === 'extract') {
    const outDir = args[args.indexOf('--out') + 1];
    const graphPath = path.join(outDir, GRAPHIFY_OUT_DIRNAME, 'graph.json');
    fs.mkdirSync(path.dirname(graphPath), { recursive: true });
    fs.writeFileSync(graphPath, '{}');
  } else if (command === 'graphify' && args[0] === 'merge-graphs') {
    fs.writeFileSync(args[args.indexOf('--out') + 1], '{}');
  } else if (command === 'codegraph' && args[0] === 'init') {
    fs.mkdirSync(path.join(args[1], '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(args[1], '.codegraph', 'db'), 'x');
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
    const result = runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec, hosts: ['claude', 'codex'] });
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
});
