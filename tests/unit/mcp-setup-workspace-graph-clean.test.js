'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { runWorkspaceGraphClean } = require('../../skills/spec-mcp-setup/scripts/lib/workspace-graph-clean.cjs');
const { runWorkspaceGraphBuild } = require('../../skills/spec-mcp-setup/scripts/lib/workspace-graph-executor.cjs');
const { GRAPHIFY_OUT_ENV } = require('../../skills/spec-mcp-setup/scripts/lib/workspace-provider-runners.cjs');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-clean-')));
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
    const graphPath = path.join(outDir, GRAPHIFY_OUT_ENV, 'graph.json');
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
function status(repo) {
  return spawnSync('git', ['-C', repo, 'status', '--porcelain'], { encoding: 'utf8' }).stdout.trim();
}

describe('runWorkspaceGraphClean — reverses the build, self-only and idempotent', () => {
  test('after build, clean removes .codegraph, .graphify, exclude block, and routing', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'web');

    const build = runWorkspaceGraphBuild({
      cwd: ws,
      repos: ['api', 'web'],
      allowDiscovery: false,
      exec: fakeExec,
      hosts: ['claude', 'codex'],
    });
    expect(build.status).toBe('complete');
    expect(fs.existsSync(path.join(ws, 'api', '.codegraph'))).toBe(true);
    expect(fs.existsSync(path.join(ws, '.graphify'))).toBe(true);
    expect(fs.readFileSync(path.join(ws, 'CLAUDE.md'), 'utf8')).toContain('projectPath');

    const uninstalls = [];
    const cleanExec = (command, args, opts) => { uninstalls.push({ command, args, cwd: opts && opts.cwd }); return { status: 0 }; };
    const clean = runWorkspaceGraphClean({ cwd: ws, repos: ['api', 'web'], allowDiscovery: false, exec: cleanExec });

    expect(clean.status).toBe('complete');
    expect(fs.existsSync(path.join(ws, 'api', '.codegraph'))).toBe(false);
    expect(fs.existsSync(path.join(ws, 'web', '.codegraph'))).toBe(false);
    expect(fs.existsSync(path.join(ws, '.graphify'))).toBe(false);
    expect(clean.workspace_graphify_removed).toBe(true);
    // graphify hook uninstall invoked per child, in the child cwd.
    expect(uninstalls.filter((u) => u.args.join(' ') === 'hook uninstall').length).toBe(2);
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
    const { resolveExcludePath } = require('../../skills/spec-mcp-setup/scripts/lib/workspace-git-exclude.cjs');
    const excludePath = resolveExcludePath(repo).absolute;
    fs.writeFileSync(excludePath, '# user\n*.tmp\n');

    runWorkspaceGraphBuild({ cwd: ws, repos: ['api'], allowDiscovery: false, exec: fakeExec });
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

  test('cwd that is a git repo is skipped', () => {
    const ws = mkWorkspace();
    initRepo(ws, '.');
    const clean = runWorkspaceGraphClean({ cwd: ws });
    expect(clean.status).toBe('skipped');
    expect(clean.topology).toBe('cwd-is-git-repo');
  });
});
