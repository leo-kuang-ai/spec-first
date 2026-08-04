'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  buildWorkspaceReadinessView,
  buildDoctorCommonChecks,
} = require('../../src/cli/commands/doctor');

function mkWorkspace() {
  return fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-doctor-readiness-')));
}

function initRepo(workspace, name) {
  const repo = path.join(workspace, name);
  fs.mkdirSync(repo, { recursive: true });
  const result = spawnSync('git', ['-C', repo, 'init', '-q']);
  if (result.status !== 0) throw new Error(result.stderr);
  return repo;
}

function confirmWorkspace(workspace, repoIds) {
  fs.mkdirSync(path.join(workspace, '.spec-first'), { recursive: true });
  fs.writeFileSync(
    path.join(workspace, '.spec-first', 'workspace.yaml'),
    `schema_version: workspace-manifest.v1\nrepos:\n${repoIds.map((id) => `  - path: ${id}\n`).join('')}`,
  );
}

function writeRuntimeState(repo, host, version) {
  const file = path.join(repo, `.${host}`, 'spec-first', 'state.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({
    manifestVersion: version,
    platform: host,
    commands: [],
    skills: [],
    workflowSkills: [],
    agents: [],
    agentSupportFiles: [],
  }));
}

function writeSetupFacts(repo, host, manifestStatus = 'current', target = null) {
  const config = path.join(repo, '.spec-first', 'config');
  fs.mkdirSync(config, { recursive: true });
  const generatedAt = '2026-07-14T00:00:00.000Z';
  fs.writeFileSync(path.join(config, 'tool-facts.json'), JSON.stringify({
    schema_version: 'tool-facts.v2',
    generated_at: generatedAt,
    repo_root: repo,
    host,
    target,
  }));
  fs.writeFileSync(path.join(config, 'runtime-capabilities.json'), JSON.stringify({
    schema_version: 'runtime-capabilities.v1',
    generated_at: generatedAt,
    repo_root: repo,
    host,
    setup_summary: {
      baseline_ready: true,
      host_runtime_ready: true,
      generated_runtime_manifest: { status: manifestStatus },
    },
  }));
}

describe('doctor workspace readiness view', () => {
  test('keeps projection, managed facts, optional graph, and external MCP as separate layers', () => {
    const workspace = mkWorkspace();
    const api = initRepo(workspace, 'api');
    const web = initRepo(workspace, 'web');
    confirmWorkspace(workspace, ['api', 'web']);
    for (const repo of [api, web]) {
      writeRuntimeState(repo, 'codex', 'test-version');
      writeSetupFacts(repo, 'codex', 'current', { mode: 'git-repo', candidates: [] });
    }

    const view = buildWorkspaceReadinessView({
      projectRoot: workspace,
      platforms: ['codex'],
      bundledManifestVersion: 'test-version',
      runWorkspaceGraphStatus: () => ({
        status: 'absent',
        workspace_root: workspace,
        repos: [{ repo_id: 'api' }, { repo_id: 'web' }],
        workspace: { merged_present: false, freshness: { freshness: 'unknown' } },
      }),
    });

    expect(view).toMatchObject({
      selection: {
        workspace_root: workspace,
        child_ids: ['api', 'web'],
        hosts: ['codex'],
        confirmed: true,
      },
      managed_ready: true,
      ready_denominator: ['projection', 'managed_runtime'],
      excluded_from_ready_denominator: ['workspace_graph', 'external_mcp'],
    });
    expect(view.layers.projection).toMatchObject({
      status: 'ready', freshness: 'current', reason_code: null,
    });
    expect(view.layers.managed_runtime).toMatchObject({
      status: 'ready', freshness: 'current', reason_code: null,
    });
    expect(view.layers.workspace_graph).toMatchObject({
      status: 'absent', readiness_eligible: false,
    });
    expect(view.layers.external_mcp).toMatchObject({
      status: 'not_evaluated', freshness: 'not_evaluated', readiness_eligible: false,
      reason_code: 'external-mcp-unmanaged',
    });
  });

  test('does not promote host-mismatched setup facts or stale projection to ready', () => {
    const workspace = mkWorkspace();
    const api = initRepo(workspace, 'api');
    confirmWorkspace(workspace, ['api']);
    writeRuntimeState(api, 'codex', 'old-version');
    writeSetupFacts(api, 'claude');

    const view = buildWorkspaceReadinessView({
      projectRoot: workspace,
      platforms: ['codex'],
      bundledManifestVersion: 'test-version',
      runWorkspaceGraphStatus: () => null,
    });

    expect(view.managed_ready).toBe(false);
    expect(view.layers.projection).toMatchObject({
      status: 'action_required', freshness: 'stale',
      reason_code: 'runtime-projection-incomplete',
    });
    expect(view.layers.managed_runtime).toMatchObject({
      status: 'unknown', freshness: 'unknown',
      reason_code: 'setup-facts-host-mismatch',
    });
  });

  test('fails closed when child selection is discovery-only instead of treating old child facts as ready', () => {
    const workspace = mkWorkspace();
    const api = initRepo(workspace, 'api');
    writeRuntimeState(api, 'codex', 'test-version');
    writeSetupFacts(api, 'codex');

    const view = buildWorkspaceReadinessView({
      projectRoot: workspace,
      platforms: ['codex'],
      bundledManifestVersion: 'test-version',
      runWorkspaceGraphStatus: () => null,
    });

    expect(view.selection.confirmed).toBe(false);
    expect(view.managed_ready).toBe(false);
    expect(view.layers.projection).toMatchObject({
      status: 'unknown', freshness: 'unknown',
      reason_code: 'workspace-repos-need-confirmation',
    });
    expect(view.layers.managed_runtime).toMatchObject({
      status: 'unknown', freshness: 'unknown',
      reason_code: 'workspace-repos-need-confirmation',
    });
  });

  test('does not use a setup receipt whose selected child set no longer matches current topology', () => {
    const workspace = mkWorkspace();
    const api = initRepo(workspace, 'api');
    const web = initRepo(workspace, 'web');
    confirmWorkspace(workspace, ['api', 'web']);
    const oldTarget = {
      mode: 'workspace-all-repos',
      workspace_root: workspace,
      candidates: [{ workspace_relative_path: 'api' }],
    };
    for (const repo of [api, web]) {
      writeRuntimeState(repo, 'codex', 'test-version');
      writeSetupFacts(repo, 'codex', 'current', oldTarget);
    }

    const view = buildWorkspaceReadinessView({
      projectRoot: workspace,
      platforms: ['codex'],
      bundledManifestVersion: 'test-version',
      runWorkspaceGraphStatus: () => null,
    });

    expect(view.managed_ready).toBe(false);
    expect(view.layers.managed_runtime).toMatchObject({
      status: 'unknown', freshness: 'unknown', reason_code: 'setup-facts-selection-mismatch',
    });
  });

  test('projects all four layers into doctor common checks without counting external MCP as readiness', () => {
    const workspace = mkWorkspace();
    initRepo(workspace, 'api');
    confirmWorkspace(workspace, ['api']);

    const checks = buildDoctorCommonChecks(workspace, {
      platforms: ['codex'],
      bundledManifestVersion: 'test-version',
      runWorkspaceGraphStatus: () => null,
    });

    const readinessChecks = checks.filter((check) => check.workspace_readiness_layer);
    expect(readinessChecks.map((check) => check.name)).toEqual([
      'workspace projection',
      'workspace managed runtime',
      'workspace graph',
      'external MCP',
    ]);
    expect(readinessChecks.at(-1)).toMatchObject({
      level: 'PASS',
      workspace_readiness_layer: { readiness_eligible: false, status: 'not_evaluated' },
    });
    expect(readinessChecks.find((check) => check.name === 'workspace projection')).toMatchObject({
      level: 'WARNING',
      disposition: 'action_required',
    });
    expect(readinessChecks.find((check) => check.name === 'workspace managed runtime')).toMatchObject({
      level: 'WARNING',
      disposition: 'known_limitation',
    });
    expect(readinessChecks.find((check) => check.name === 'workspace graph')).toMatchObject({
      level: 'WARNING',
      disposition: 'optional',
    });
  });

  test('keeps confirmed stale workspace projection action-required', () => {
    const workspace = mkWorkspace();
    const api = initRepo(workspace, 'api');
    confirmWorkspace(workspace, ['api']);
    writeRuntimeState(api, 'codex', 'old-version');
    writeSetupFacts(api, 'codex');

    const checks = buildDoctorCommonChecks(workspace, {
      platforms: ['codex'],
      bundledManifestVersion: 'test-version',
      runWorkspaceGraphStatus: () => null,
    });

    expect(checks.find((check) => check.name === 'workspace projection')).toMatchObject({
      level: 'WARNING',
      disposition: 'action_required',
      reasonCode: 'runtime-projection-incomplete',
    });
  });
});
