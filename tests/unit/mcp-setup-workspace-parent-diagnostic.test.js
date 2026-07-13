'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  buildParentWorkspaceDiagnostic,
  renderParentWorkspaceDiagnosticHuman,
} = require('../../skills/spec-mcp-setup/scripts/lib/workspace-parent-diagnostic.cjs');
const { runSetup } = require('../../skills/spec-mcp-setup/scripts/setup.cjs');
const { parseArgs } = require('../../skills/spec-mcp-setup/scripts/lib/args.cjs');

const skillRoot = path.resolve(__dirname, '../../skills/spec-mcp-setup');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-parent-diag-')));
}
function initRepo(root, rel) {
  const repo = path.resolve(root, rel);
  fs.mkdirSync(repo, { recursive: true });
  spawnSync('git', ['-C', repo, 'init', '-q']);
  return repo;
}

describe('parent workspace diagnostic (bare/check)', () => {
  test('buildParentWorkspaceDiagnostic marks parent facts not_applicable and dual paths', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'web');
    const payload = buildParentWorkspaceDiagnostic({
      cwd: ws,
      host: 'claude',
      target: {
        workspace_root: ws,
        selection_source: 'workspace-default-all-repos',
        candidates: [
          { repo_label: 'api', git_root: path.join(ws, 'api') },
          { repo_label: 'web', git_root: path.join(ws, 'web') },
        ],
      },
      runStatus: () => ({
        status: 'needs-confirmation',
        pending_confirm: ['api', 'web'],
        workspace: { merged_present: false },
      }),
    });
    expect(payload.schema_version).toBe('workspace-parent-diagnostic.v1');
    expect(payload.parent_repo_local_facts).toBe('not_applicable');
    expect(payload.parent_provider_readiness).toBe('not_applicable');
    expect(payload.overall_status).toBe('action-required');
    expect(payload.reason_code).toBe('workspace-graph-needs-confirmation');
    expect(payload.dual_paths.workspace_two_layer_graph.do_not.join(' ')).toContain('--workspace-graph --all-repos');
    expect(payload.next_actions.some((a) => a.includes('--workspace-graph --repos'))).toBe(true);
    expect(payload.next_actions.some((a) => a.includes('--all-repos'))).toBe(true);
    const human = renderParentWorkspaceDiagnosticHuman(payload);
    expect(human).toContain('not_applicable');
    expect(human).toContain('Two paths');
  });

  test('runSetup bare on non-Git multi-repo parent returns parent diagnostic, not single-repo missing facts', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'api');
    initRepo(ws, 'web');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-parent-home-'));
    const result = runSetup({
      argv: [],
      cwd: ws,
      skillRoot,
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir,
    });
    expect(result.exit_code).toBe(1);
    expect(result.payload.schema_version).toBe('workspace-parent-diagnostic.v1');
    expect(result.payload.parent_repo_local_facts).toBe('not_applicable');
    expect(result.human).toContain('not_applicable');
    expect(result.human).not.toMatch(/工具事实：missing/i);
  });

  test('runSetup --check on parent also uses parent diagnostic', () => {
    const ws = mkWorkspace();
    initRepo(ws, 'svc');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-parent-home2-'));
    const result = runSetup({
      argv: ['--check'],
      cwd: ws,
      skillRoot,
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir,
    });
    expect(result.payload.schema_version).toBe('workspace-parent-diagnostic.v1');
    expect(parseArgs(['--check']).check).toBe(true);
  });
});
