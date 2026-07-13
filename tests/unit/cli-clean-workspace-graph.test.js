'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  runClean,
  parseCleanArgs,
} = require('../../src/cli/commands/clean');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-cli-wclean-')));
}
function initRepo(root, rel) {
  const repo = path.resolve(root, rel);
  fs.mkdirSync(repo, { recursive: true });
  spawnSync('git', ['-C', repo, 'init', '-q']);
  return repo;
}

describe('spec-first clean --workspace-graph', () => {
  test('parseCleanArgs accepts --workspace-graph and --repos', () => {
    expect(parseCleanArgs(['--workspace-graph', '--repos', 'api,web', '--dry-run'])).toMatchObject({
      workspaceGraph: true,
      repos: ['api', 'web'],
      dryRun: true,
      unknown: [],
    });
  });

  test('dry-run previews managed removals without mutating the workspace', () => {
    const ws = mkWorkspace();
    const api = initRepo(ws, 'api');
    fs.mkdirSync(path.join(api, '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(api, '.codegraph', 'db'), 'x');
    fs.mkdirSync(path.join(ws, '.graphify'), { recursive: true });
    fs.writeFileSync(path.join(ws, '.graphify', 'merged-graph.json'), '{}');
    fs.writeFileSync(
      path.join(ws, 'AGENTS.md'),
      '<!-- spec-first:workspace-routing start -->\nroute\n<!-- spec-first:workspace-routing end -->\n',
    );

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => { logs.push(args.join(' ')); };
    try {
      const code = runClean(['--workspace-graph', '--repos', 'api', '--dry-run'], { cwd: ws });
      expect(code).toBe(0);
    } finally {
      console.log = originalLog;
    }
    expect(logs.join('\n')).toContain('Dry run: spec-first clean --workspace-graph');
    expect(logs.join('\n')).toContain('.codegraph');
    // Dry-run must not delete.
    expect(fs.existsSync(path.join(api, '.codegraph'))).toBe(true);
    expect(fs.existsSync(path.join(ws, '.graphify'))).toBe(true);
  });

  test('apply removes managed graph assets via injectable clean dependency', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    const calls = [];
    const fakeClean = (opts) => {
      calls.push(opts);
      return {
        schema_version: 'workspace-graph-clean.v1',
        status: 'complete',
        topology: 'requirement-workspace',
        workspace_root: ws,
        repos: [{
          repo_id: 'api',
          codegraph_removed: true,
          exclude_removed: true,
          hook_uninstalled: 'uninstalled',
        }],
        workspace_graphify_removed: true,
        routing: { entries: [{ entry_file: 'AGENTS.md', status: 'stripped' }] },
        codegraph_daemon_action: 'run `codegraph daemon` to stop any watcher bound to a removed workspace',
        reason_code: '',
      };
    };

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => { logs.push(args.join(' ')); };
    let code;
    try {
      code = runClean(['--workspace-graph', '--repos', 'api'], {
        cwd: ws,
        runWorkspaceGraphClean: fakeClean,
      });
    } finally {
      console.log = originalLog;
    }
    expect(code).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0].repos).toEqual(['api']);
    expect(logs.join('\n')).toContain('Workspace graph clean: complete');
    expect(logs.join('\n')).toContain('codegraph_removed=true');
  });

  test('rejects combining --workspace-graph with a host flag', () => {
    const errors = [];
    const originalError = console.error;
    console.error = (...args) => { errors.push(args.join(' ')); };
    let code;
    try {
      code = runClean(['--workspace-graph', '--claude']);
    } finally {
      console.error = originalError;
    }
    expect(code).toBe(2);
    expect(errors.join('\n')).toContain('cannot be combined with host flags');
  });
});
