'use strict';

const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const skillRoot = path.join(repoRoot, 'skills', 'spec-mcp-setup');

describe('spec-mcp-setup preflight v2 projection', () => {
  test('keeps CLI and browser helpers in tools, global skills in skills, and MCP entries out', () => {
    const { loadRegistry } = require('../../skills/spec-mcp-setup/scripts/lib/registry.cjs');
    const { buildPreflightProjection } = require('../../skills/spec-mcp-setup/scripts/lib/preflight.cjs');
    const registry = loadRegistry({ skillRoot });
    const helperResults = [
      { id: 'agent-browser', status: 'skipped', reason_code: 'agent-browser-manual-setup-incomplete' },
      { id: 'ast-grep', status: 'degraded', reason_code: 'helper-fallback-active' },
      { id: 'ast-grep-skill', status: 'missing', reason_code: 'global-skill-missing' },
      { id: 'ffmpeg', status: 'ready', reason_code: 'ready' },
      { id: 'gh', status: 'missing', reason_code: 'missing_dependency' },
      { id: 'silicon', status: 'missing', reason_code: 'missing_dependency' },
      { id: 'vhs', status: 'missing', reason_code: 'missing_dependency' },
    ];
    const projectConfigStatus = {
      example_config: { status: 'current' },
      local_config: { status: 'present' },
      local_config_gitignore: { status: 'ignored' },
      legacy_markdown_config: { status: 'present' },
      legacy_local_config: { status: 'retired' },
    };

    const preflight = buildPreflightProjection({
      registry,
      helperResults,
      projectConfigStatus,
      insideGitRepo: true,
      platform: 'macos',
    });

    expect(preflight.tools.map((entry) => entry.id)).toEqual([
      'agent-browser',
      'ast-grep',
      'ffmpeg',
      'gh',
      'silicon',
      'vhs',
    ]);
    expect(preflight.tools.map((entry) => entry.id)).not.toEqual(expect.arrayContaining([
      'context7',
      'sequential-thinking',
    ]));
    expect(preflight.skills).toHaveLength(1);
    expect(preflight.skills[0]).toMatchObject({
      id: 'ast-grep-skill',
      skill_name: 'ast-grep',
      dependency_status: 'missing',
      result: 'action-required',
      reason_code: 'required-runtime-action-required',
    });
    expect(preflight.tools.find((entry) => entry.id === 'agent-browser')).toMatchObject({
      required: true,
      dependency_status: 'ready',
      result: 'skipped',
      reason_code: 'optional-skipped',
      install_command: expect.stringContaining('agent-browser'),
    });
    expect(preflight.tools.find((entry) => entry.id === 'ast-grep')).toMatchObject({
      dependency_status: 'missing',
      result: 'degraded',
      next_action: '缺少 ast-grep；回退到 rg',
    });
    expect(preflight.tools.find((entry) => entry.id === 'gh')).toMatchObject({
      baseline_blocking: true,
      dependency_status: 'missing',
      result: 'action-required',
      install_command: 'brew install gh',
    });
    expect(preflight.tools.find((entry) => entry.id === 'vhs')).toMatchObject({
      baseline_blocking: false,
      result: 'degraded',
    });
    expect(preflight.project).toEqual({
      inside_git_repo: true,
      local_config_status: 'ok',
      local_config_gitignore_status: 'ok',
      example_config_status: 'ok',
    });
    expect(preflight.legacy).toEqual({
      legacy_markdown_status: 'present',
      legacy_local_config_status: 'retired',
    });
  });

  test('preserves outside-repo skip vocabulary on POSIX and Windows', () => {
    const { buildPreflightProjection } = require('../../skills/spec-mcp-setup/scripts/lib/preflight.cjs');
    const base = {
      registry: { helpers: [] },
      helperResults: [],
      projectConfigStatus: null,
      insideGitRepo: false,
    };

    expect(buildPreflightProjection({ ...base, platform: 'linux' })).toMatchObject({
      project: {
        inside_git_repo: false,
        local_config_status: 'skip',
        local_config_gitignore_status: 'skip',
        example_config_status: 'skip',
      },
      legacy: {
        legacy_markdown_status: 'skip',
        legacy_local_config_status: 'retired',
      },
    });
    expect(buildPreflightProjection({ ...base, platform: 'windows' }).legacy).toEqual({
      legacy_markdown_status: 'skip',
      legacy_local_config_status: 'skip',
    });
  });

  test('keeps legacy compact project statuses distinct from project-local-config v1 statuses', () => {
    const { buildPreflightProjection } = require('../../skills/spec-mcp-setup/scripts/lib/preflight.cjs');
    const preflight = buildPreflightProjection({
      registry: { helpers: [] },
      helperResults: [],
      projectConfigStatus: {
        example_config: { status: 'outdated' },
        local_config: { status: 'missing' },
        local_config_gitignore: { status: 'ready-for-local-config' },
        legacy_markdown_config: { status: 'missing' },
      },
      insideGitRepo: true,
      platform: 'linux',
    });

    expect(preflight.project).toEqual({
      inside_git_repo: true,
      local_config_status: 'missing',
      local_config_gitignore_status: 'skip',
      example_config_status: 'outdated',
    });
    expect(preflight.legacy).toEqual({
      legacy_markdown_status: 'missing',
      legacy_local_config_status: 'retired',
    });
  });

  test('reports a missing local override as defaults-active and keeps ignore readiness visible', () => {
    const { buildPreflightProjection } = require('../../skills/spec-mcp-setup/scripts/lib/preflight.cjs');
    const preflight = buildPreflightProjection({
      registry: { helpers: [] },
      helperResults: [],
      projectConfigStatus: {
        example_config: { status: 'current' },
        local_config: { status: 'defaults-active' },
        local_config_gitignore: { status: 'ready-for-local-config' },
        legacy_markdown_config: { status: 'missing' },
      },
      insideGitRepo: true,
      platform: 'linux',
    });

    expect(preflight.project).toEqual({
      inside_git_repo: true,
      local_config_status: 'defaults-active',
      local_config_gitignore_status: 'ok',
      example_config_status: 'ok',
    });
  });
});
