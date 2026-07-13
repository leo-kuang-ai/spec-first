'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  checkWorkspaceGraphStatus,
} = require('../../src/cli/commands/doctor');

function mkTmp(prefix) {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), prefix)));
}

function initRepo(root, rel) {
  const repo = path.resolve(root, rel);
  fs.mkdirSync(repo, { recursive: true });
  spawnSync('git', ['-C', repo, 'init', '-q']);
  return repo;
}

describe('doctor workspace-graph common check', () => {
  test('skips (null) when cwd is a normal git repo', () => {
    const root = mkTmp('spec-first-doctor-wg-git-');
    initRepo(root, '.');
    expect(checkWorkspaceGraphStatus(root)).toBeNull();
  });

  test('skips when not a multi-repo requirement workspace', () => {
    const root = mkTmp('spec-first-doctor-wg-empty-');
    // empty non-git dir without child repos
    const check = checkWorkspaceGraphStatus(root);
    // resolveWorkspaceTargets may skip or needs-confirmation depending on discovery;
    // non-requirement topologies return null.
    if (check) {
      expect(check.name).toBe('workspace graph');
      expect(check.level).not.toBe('ERROR');
    } else {
      expect(check).toBeNull();
    }
  });

  test('reports WARNING absent for requirement workspace without graphs', () => {
    const ws = mkTmp('spec-first-doctor-wg-abs-');
    initRepo(ws, 'api');
    initRepo(ws, 'web');
    const check = checkWorkspaceGraphStatus(ws, {
      runWorkspaceGraphStatus: () => ({
        status: 'absent',
        workspace_root: ws,
        repos: [
          { repo_id: 'api', codegraph_present: false },
          { repo_id: 'web', codegraph_present: false },
        ],
        workspace: { merged_present: false },
        default_project_path: path.join(ws, 'api'),
        default_project_path_contained: true,
        server_root_default_note: 'pass projectPath',
      }),
    });
    expect(check).toMatchObject({
      level: 'WARNING',
      name: 'workspace graph',
      reasonCode: 'workspace-graph-absent',
      advisory: true,
    });
    expect(check.fix).toContain('--workspace-graph');
    expect(check.workspace_graph.default_project_path_contained).toBe(true);
  });

  test('reports PASS ready with advisory default projectPath', () => {
    const ws = mkTmp('spec-first-doctor-wg-ready-');
    const check = checkWorkspaceGraphStatus(ws, {
      runWorkspaceGraphStatus: () => ({
        status: 'ready',
        workspace_root: ws,
        repos: [
          { repo_id: 'api', codegraph_present: true },
          { repo_id: 'web', codegraph_present: true },
        ],
        workspace: { merged_present: true },
        default_project_path: path.join(ws, 'api'),
        default_project_path_contained: true,
        server_root_default_note: 'pass projectPath',
      }),
    });
    expect(check).toMatchObject({
      level: 'PASS',
      name: 'workspace graph',
      reasonCode: 'workspace-graph-ready',
      advisory: true,
    });
    expect(check.message).toContain('Advisory only');
    expect(check.workspace_graph.merged_present).toBe(true);
  });

  test('never escalates partial to ERROR', () => {
    const check = checkWorkspaceGraphStatus('/tmp/ws', {
      runWorkspaceGraphStatus: () => ({
        status: 'partial',
        workspace_root: '/tmp/ws',
        repos: [{ repo_id: 'api', codegraph_present: true }],
        workspace: { merged_present: false },
        default_project_path: '/tmp/ws/api',
        default_project_path_contained: true,
      }),
    });
    expect(check.level).toBe('WARNING');
    expect(check.reasonCode).toBe('workspace-graph-partial');
    expect(check.message).toContain('no negative authority');
  });
});
