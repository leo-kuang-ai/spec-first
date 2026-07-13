'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { parseArgs } = require('../../skills/spec-mcp-setup/scripts/lib/args.cjs');
const { runSetup } = require('../../skills/spec-mcp-setup/scripts/setup.cjs');
const { GRAPHIFY_OUT_ENV } = require('../../skills/spec-mcp-setup/scripts/lib/workspace-provider-runners.cjs');

const skillRoot = path.resolve(__dirname, '../../skills/spec-mcp-setup');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-entry-')));
}
function initRepo(root, rel) {
  const repo = path.resolve(root, rel);
  fs.mkdirSync(repo, { recursive: true });
  spawnSync('git', ['-C', repo, 'init', '-q']);
  // Isolate from developer-global core.hooksPath (e.g. ~/.githooks).
  spawnSync('git', ['-C', repo, 'config', '--local', 'core.hooksPath', '.git/hooks']);
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

describe('args — workspace-graph flags', () => {
  test('parses --workspace-graph and comma-separated --repos', () => {
    expect(parseArgs(['--only=codegraph,graphify', '--workspace-graph', '--repos', 'api,web'])).toMatchObject({
      only: ['codegraph', 'graphify'],
      workspaceGraph: true,
      repos: ['api', 'web'],
      errors: [],
    });
  });

  test('parses --workspace-graph-clean and --workspace-graph-status', () => {
    expect(parseArgs(['--workspace-graph-clean', '--workspace-graph-status'])).toMatchObject({
      workspaceGraphClean: true,
      workspaceGraphStatus: true,
      errors: [],
    });
  });

  test('defaults are false/empty when flags absent', () => {
    expect(parseArgs(['--check'])).toMatchObject({
      workspaceGraph: false,
      workspaceGraphClean: false,
      workspaceGraphStatus: false,
      repos: [],
    });
  });
});

describe('runSetup — workspace-graph dispatch', () => {
  test('help documents workspace graph actions and conflicts', () => {
    const result = runSetup({ argv: ['--help'] });
    expect(result.human).toContain('--workspace-graph');
    expect(result.human).toContain('--workspace-graph-status');
    expect(result.human).toContain('--workspace-graph-clean');
    expect(result.human).toContain('--repos <a,b>');
    expect(result.human).toContain('不可与 --all-repos 组合');
  });
  test('non-Git workspace + --workspace-graph builds the two-layer graph via injected exec', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'web');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-home-'));

    const result = runSetup({
      argv: ['--only', 'codegraph,graphify', '--workspace-graph', '--repos', 'api,web'],
      cwd: ws,
      skillRoot,
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir,
      workspaceExec: fakeExec,
    });

    expect(result.payload.schema_version).toBe('workspace-graph-executor.v1');
    expect(result.payload.status).toBe('complete');
    expect(result.exit_code).toBe(0);
    // Merged graph is out-of-tree under <ws>/.graphify/.
    expect(result.payload.build.merge.merged_graph_path).toBe(path.join(ws, '.graphify', 'merged-graph.json'));
    // Children stay git-clean (managed exclude applied).
    for (const rel of ['api', 'web']) {
      const st = spawnSync('git', ['-C', path.join(ws, rel), 'status', '--porcelain'], { encoding: 'utf8' }).stdout;
      expect(st.trim()).toBe('');
    }
  });

  test('without --workspace-graph, the same invocation does NOT hit the graph handler', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-home2-'));
    const result = runSetup({
      argv: ['--only', 'codegraph,graphify', '--repos', 'api'],
      cwd: ws,
      skillRoot,
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir,
      workspaceExec: fakeExec,
    });
    // Whatever the existing workspace batch returns, it is NOT the graph executor envelope.
    expect(result.payload && result.payload.schema_version).not.toBe('workspace-graph-executor.v1');
  });

  test('workspace graph confirmation and partial outcomes use non-zero exit codes', () => {
    const needsWs = mkWorkspace();
    initRepo(needsWs, 'api');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-exit-home-'));
    const needs = runSetup({
      argv: ['--only', 'codegraph,graphify', '--workspace-graph'],
      cwd: needsWs,
      skillRoot,
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir,
      workspaceExec: fakeExec,
    });
    expect(needs.payload.status).toBe('needs-confirmation');
    expect(needs.exit_code).toBe(2);
    expect(needs.human).toContain('--repos api');

    const partialWs = mkWorkspace();
    initRepo(partialWs, 'api');
    initRepo(partialWs, 'web');
    const failWeb = (command, args, opts) => {
      if (command === 'graphify' && args[0] === 'extract' && args[1].endsWith('web')) {
        return { status: 1, stdout: '', stderr: 'fail' };
      }
      return fakeExec(command, args, opts);
    };
    const partial = runSetup({
      argv: ['--only', 'codegraph,graphify', '--workspace-graph', '--repos', 'api,web'],
      cwd: partialWs,
      skillRoot,
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir,
      workspaceExec: failWeb,
    });
    expect(partial.payload.status).toBe('partial');
    expect(partial.exit_code).toBe(1);
  });

  test('build → status → clean → status via CLI flags (injected exec)', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'web');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-home3-'));
    const common = {
      cwd: ws,
      skillRoot,
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir,
      workspaceExec: fakeExec,
    };

    const built = runSetup({
      ...common,
      argv: ['--only', 'codegraph,graphify', '--workspace-graph', '--repos', 'api,web'],
    });
    expect(built.payload.schema_version).toBe('workspace-graph-executor.v1');
    expect(built.payload.status).toBe('complete');
    expect(fs.existsSync(path.join(ws, '.graphify', 'merged-graph.json'))).toBe(true);
    expect(fs.readFileSync(path.join(ws, 'AGENTS.md'), 'utf8')).toContain('projectPath');

    const statusReady = runSetup({
      ...common,
      argv: ['--only', 'codegraph,graphify', '--workspace-graph-status', '--repos', 'api,web'],
    });
    expect(statusReady.payload.schema_version).toBe('workspace-graph-status.v1');
    expect(statusReady.payload.status).toBe('ready');
    expect(statusReady.exit_code).toBe(0);
    expect(statusReady.human).toContain('no default index');

    const cleaned = runSetup({
      ...common,
      argv: ['--only', 'codegraph,graphify', '--workspace-graph-clean', '--repos', 'api,web'],
    });
    expect(cleaned.payload.schema_version).toBe('workspace-graph-clean.v1');
    expect(cleaned.payload.status).toBe('complete');
    expect(fs.existsSync(path.join(ws, 'api', '.codegraph'))).toBe(false);
    expect(fs.existsSync(path.join(ws, '.graphify'))).toBe(false);
    // Managed routing block stripped; user file may remain empty.
    if (fs.existsSync(path.join(ws, 'AGENTS.md'))) {
      expect(fs.readFileSync(path.join(ws, 'AGENTS.md'), 'utf8')).not.toContain('spec-first:workspace-routing start');
    }

    const statusAbsent = runSetup({
      ...common,
      argv: ['--only', 'codegraph,graphify', '--workspace-graph-status', '--repos', 'api,web'],
    });
    expect(statusAbsent.payload.status).toBe('absent');
    expect(statusAbsent.exit_code).toBe(0);
  });
});
