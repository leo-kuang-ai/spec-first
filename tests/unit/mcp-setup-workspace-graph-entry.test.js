'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { parseArgs } = require('../../skills/spec-runtime-setup/scripts/lib/args.cjs');
const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
const { GRAPHIFY_OUT_ENV } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-provider-runners.cjs');

const skillRoot = path.resolve(__dirname, '../../skills/spec-runtime-setup');

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

function installProviderShims(binDir) {
  fs.mkdirSync(binDir, { recursive: true });
  const source = [
    '#!/usr/bin/env node',
    "'use strict';",
    "const fs = require('node:fs');",
    "const path = require('node:path');",
    "const command = path.basename(process.argv[1]);",
    'const args = process.argv.slice(2);',
    "if (process.env.WORKSPACE_EXEC_LOG) fs.appendFileSync(process.env.WORKSPACE_EXEC_LOG, `${command} ${args.join(' ')}\\n`);",
    "if (command === 'codegraph' && args[0] === 'init') {",
    "  fs.mkdirSync(path.join(args[1], '.codegraph'), { recursive: true });",
    "  fs.writeFileSync(path.join(args[1], '.codegraph', 'db'), 'x');",
    '}',
    "if (command === 'graphify' && args[0] === 'extract') {",
    "  const out = args[args.indexOf('--out') + 1];",
    "  fs.mkdirSync(path.join(out, '.graphify'), { recursive: true });",
    "  fs.writeFileSync(path.join(out, '.graphify', 'graph.json'), '{}');",
    '}',
    "if (command === 'graphify' && args[0] === 'merge-graphs') {",
    "  fs.writeFileSync(args[args.indexOf('--out') + 1], '{}');",
    '}',
    '',
  ].join('\n');
  for (const name of ['codegraph', 'graphify']) {
    const target = path.join(binDir, name);
    fs.writeFileSync(target, source);
    fs.chmodSync(target, 0o755);
  }
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

  test('status remains read-only and reports absent in an empty non-Git folder', () => {
    const ws = mkWorkspace();
    const result = runSetup({
      argv: ['--workspace-graph-status'],
      cwd: ws,
      skillRoot,
      env: {},
    });
    expect(result.exit_code).toBe(0);
    expect(result.payload).toEqual(expect.objectContaining({
      schema_version: 'workspace-graph-status.v1',
      status: 'absent',
    }));
  });

  test('workspace mutations skipped from a Git cwd return a non-zero usage result', () => {
    const ws = mkWorkspace();
    initRepo(ws, '.');
    const result = runSetup({
      argv: ['--only', 'codegraph,graphify', '--workspace-graph', '--repos', 'api'],
      cwd: ws,
      skillRoot,
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-git-home-')),
    });
    expect(result.exit_code).not.toBe(0);
  });

  test('invalid manifest status returns non-zero while preserving the diagnostic envelope', () => {
    const ws = mkWorkspace();
    fs.mkdirSync(path.join(ws, '.spec-first'), { recursive: true });
    fs.writeFileSync(path.join(ws, '.spec-first', 'workspace.yaml'), 'schema_version: workspace-manifest.v1\nunknown: value\n');
    const result = runSetup({ argv: ['--workspace-graph-status'], cwd: ws, skillRoot, env: {} });
    expect(result.exit_code).toBe(1);
    expect(result.payload.status).toBe('invalid');
    expect(result.payload.reason_code).toBe('workspace-manifest-schema-invalid');
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

  test('production default executor runs PATH provider commands for build and legacy clean', () => {
    if (process.platform === 'win32') return;
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-wg-shims-'));
    const binDir = path.join(root, 'bin');
    const logPath = path.join(root, 'calls.log');
    installProviderShims(binDir);
    const previousPath = process.env.PATH;
    const previousLog = process.env.WORKSPACE_EXEC_LOG;
    process.env.PATH = `${binDir}${path.delimiter}${previousPath || ''}`;
    process.env.WORKSPACE_EXEC_LOG = logPath;
    try {
      const common = {
        cwd: ws,
        skillRoot,
        env: { MCP_SETUP_HOST: 'codex' },
        homeDir: path.join(root, 'home'),
      };
      const build = runSetup({
        ...common,
        argv: ['--only', 'codegraph,graphify', '--workspace-graph', '--repos', 'api'],
      });
      expect(build.payload.status).toBe('complete');
      fs.rmSync(path.join(ws, '.graphify', 'workspace-graph-state.json'));
      const clean = runSetup({
        ...common,
        argv: ['--workspace-graph-clean', '--repos', 'api'],
      });
      expect(clean.payload.status).toBe('complete');
      const calls = fs.readFileSync(logPath, 'utf8');
      expect(calls).toContain('codegraph init');
      expect(calls).toContain('codegraph install');
      expect(calls).toContain('graphify extract');
      expect(calls).toContain('graphify merge-graphs');
      expect(calls).toContain('graphify hook uninstall');
    } finally {
      process.env.PATH = previousPath;
      if (previousLog === undefined) delete process.env.WORKSPACE_EXEC_LOG;
      else process.env.WORKSPACE_EXEC_LOG = previousLog;
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
