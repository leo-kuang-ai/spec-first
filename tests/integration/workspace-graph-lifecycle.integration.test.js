'use strict';

// Integration (injectable providers): non-Git multi-repo parent
// build → status → host-level clean --workspace-graph → status absent.
// Real provider binaries are not required; exec is injected. Complements the
// real-binary build receipt under docs/validation/.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { runWorkspaceGraphBuild } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-executor.cjs');
const { runWorkspaceGraphStatus } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs');
const { runClean } = require('../../src/cli/commands/clean');
const { GRAPHIFY_OUT_DIRNAME } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-provider-runners.cjs');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-integ-')));
}
function initRepo(root, rel) {
  const repo = path.resolve(root, rel);
  fs.mkdirSync(repo, { recursive: true });
  spawnSync('git', ['-C', repo, 'init', '-q']);
  spawnSync('git', ['-C', repo, 'config', 'user.email', 'test@example.com']);
  spawnSync('git', ['-C', repo, 'config', 'user.name', 'Test']);
  spawnSync('git', ['-C', repo, 'config', '--local', 'core.hooksPath', '.git/hooks']);
  fs.writeFileSync(path.join(repo, 'index.js'), 'module.exports = { main() { return 1; } };\n');
  spawnSync('git', ['-C', repo, 'add', 'index.js']);
  spawnSync('git', ['-C', repo, 'commit', '-q', '-m', 'init']);
  return repo;
}
function fakeExec(command, args) {
  if (command === 'graphify' && args[0] === 'extract') {
    const outDir = args[args.indexOf('--out') + 1];
    const graphPath = path.join(outDir, GRAPHIFY_OUT_DIRNAME, 'graph.json');
    fs.mkdirSync(path.dirname(graphPath), { recursive: true });
    fs.writeFileSync(graphPath, JSON.stringify({ nodes: [{ id: 'n1' }], edges: [] }));
  } else if (command === 'graphify' && args[0] === 'merge-graphs') {
    fs.mkdirSync(path.dirname(args[args.indexOf('--out') + 1]), { recursive: true });
    fs.writeFileSync(args[args.indexOf('--out') + 1], JSON.stringify({ merged: true }));
  } else if (command === 'codegraph' && args[0] === 'init') {
    fs.mkdirSync(path.join(args[1], '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(args[1], '.codegraph', 'codegraph.db'), 'x');
  }
  return { status: 0, stdout: '', stderr: '' };
}

describe('workspace graph lifecycle (integration)', () => {
  test('zero / single / multi child + host clean --workspace-graph', () => {
    // Zero confirmed repos → needs confirmation when only discovery.
    const empty = mkWorkspace();
    initRepo(empty, 'lone');
    const discovered = runWorkspaceGraphBuild({ cwd: empty, allowDiscovery: true, exec: fakeExec });
    expect(discovered.status).toBe('needs-confirmation');

    // Single child → complete + single-source merge.
    const singleWs = mkWorkspace();
    initRepo(singleWs, 'api');
    const single = runWorkspaceGraphBuild({
      cwd: singleWs,
      repos: ['api'],
      allowDiscovery: false,
      exec: fakeExec,
      hosts: ['claude', 'codex'],
    });
    expect(single.status).toBe('complete');
    expect(single.build.merge.status).toBe('single-source');

    // Multi child → merged + host clean.
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'web');
    const built = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api', 'web'],
      allowDiscovery: false,
      exec: fakeExec,
      hosts: ['claude', 'codex'],
    });
    expect(built.status).toBe('complete');
    expect(built.build.merge.status).toBe('merged');
    expect(fs.existsSync(path.join(ws, 'graphify-out', 'merged-graph.json'))).toBe(true);

    const ready = runWorkspaceGraphStatus({ cwd: ws, repos: ['api', 'web'], allowDiscovery: false });
    expect(ready.status).toBe('ready');

    const code = runClean(['--workspace-graph', '--repos', 'api,web'], {
      cwd: ws,
      workspaceExec: fakeExec,
    });
    expect(code).toBe(0);
    expect(fs.existsSync(path.join(ws, 'api', '.codegraph'))).toBe(false);
    expect(fs.existsSync(path.join(ws, 'graphify-out'))).toBe(false);

    const absent = runWorkspaceGraphStatus({ cwd: ws, repos: ['api', 'web'], allowDiscovery: false });
    expect(absent.status).toBe('absent');
  });
});
