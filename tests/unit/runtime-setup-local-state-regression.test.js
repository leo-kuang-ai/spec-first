'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { inspectProjectConfig, planProjectConfig, applyProjectConfig } = require('../../skills/spec-runtime-setup/scripts/lib/project-config.cjs');
const { buildPreflightProjection } = require('../../skills/spec-runtime-setup/scripts/lib/preflight.cjs');
const { diagnosticNextActions } = require('../../skills/spec-runtime-setup/scripts/lib/human-output.cjs');
const { scanConfiguredDependencies } = require('../../skills/spec-runtime-setup/scripts/lib/configured-dependencies.cjs');
const { compareMcpSection, upsertMcpSection } = require('../../skills/spec-runtime-setup/scripts/lib/toml-section-editor.cjs');
const { renderWorkspaceRefreshHookBlock, removeWorkspaceChildHook } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-child-hook.cjs');
const { STATUS_BASENAME, readAsyncRefreshStatus } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-async-refresh.cjs');

const templatePath = require.resolve('../../skills/spec-runtime-setup/references/config-template.yaml');
let root;
beforeEach(() => { root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'setup-state-'))); });
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

test('a diagnostic retains the local YAML error and its recovery instruction', () => {
  execFileSync('git', ['init', '-q', root]);
  fs.mkdirSync(path.join(root, '.spec-first'));
  fs.writeFileSync(path.join(root, '.spec-first/config.local.yaml'), 'plan_output: [\n');
  fs.copyFileSync(templatePath, path.join(root, '.spec-first/config.local.example.yaml'));
  fs.writeFileSync(path.join(root, '.gitignore'), '.spec-first/*.local.yaml\n');
  const status = inspectProjectConfig({ repoRoot: root, templatePath });
  const { project } = buildPreflightProjection({ registry: { helpers: [] }, helperResults: [], insideGitRepo: true, projectConfigStatus: status });
  expect(project.local_config_status).toBe('invalid');
  const runtime = { setup_facts_status: 'ready', runtime_capabilities_status: 'ready', baseline_ready: true, host_runtime_ready: true };
  expect(diagnosticNextActions({ project, runtime, generated_runtime_manifest: { status: 'current' } })).toEqual([status.local_config.next_action]);
});

test.each(['negated', 'tracked'])('ignore repair preserves the owner choice: %s', kind => {
  execFileSync('git', ['init', '-q', root]);
  const relative = '.spec-first/config.local.yaml';
  fs.mkdirSync(path.join(root, '.spec-first'));
  fs.writeFileSync(path.join(root, relative), 'plan_output: md\n');
  const rules = kind === 'negated' ? `.spec-first/*.local.yaml\n!${relative}\n` : 'dist/\n';
  fs.writeFileSync(path.join(root, '.gitignore'), rules);
  if (kind === 'tracked') execFileSync('git', ['-C', root, 'add', '--', relative]);
  const plan = planProjectConfig({ repoRoot: root, ensureGitignore: true });
  expect(() => applyProjectConfig({ plan, templatePath })).toThrow(expect.objectContaining({ reason_code: kind === 'tracked' ? 'local-config-already-tracked' : 'local-config-explicitly-included' }));
  expect(fs.readFileSync(path.join(root, '.gitignore'), 'utf8')).toBe(rules);
});

test('a malformed data source does not hide a valid deny policy or request installation', () => {
  fs.writeFileSync(path.join(root, 'package.json'), 'null');
  fs.mkdirSync(path.join(root, '.claude'));
  fs.writeFileSync(path.join(root, '.claude/settings.json'), JSON.stringify({ permissions: { deny: ['Bash(unused-tool)'] } }));
  const scan = scanConfiguredDependencies({ repoRoot: root, env: { PATH: '' } });
  expect(scan.status).toBe('scan-failed');
  expect(scan.configured_dependencies).toEqual(expect.arrayContaining([
    expect.objectContaining({ configured_status: 'denied', result: 'not-applicable' }),
    expect.objectContaining({ source_path: path.join(root, 'package.json'), result: 'action-required' }),
  ]));
});

test('removing a managed hook section preserves the user script and its current mode', () => {
  const hooks = path.join(root, 'hooks');
  fs.mkdirSync(hooks);
  const target = path.join(hooks, 'post-commit');
  const original = '#!/bin/sh\necho local\n';
  const block = renderWorkspaceRefreshHookBlock({ node: 'node', asyncRefreshScript: 'refresh', setupScript: 'setup', workspaceRoot: root, repoIds: [] });
  fs.writeFileSync(target, original + block, { mode: 0o700 });
  const before = fs.statSync(target).mode;
  expect(removeWorkspaceChildHook(root, hooks)).toMatchObject({ ok: true, changed: true });
  expect(fs.readFileSync(target, 'utf8')).toBe(original);
  expect(fs.statSync(target).mode).toBe(before);
});

test('TOML map order is immaterial but argument order is not', () => {
  const config = { command: 'tool', args: ['one', 'two'], env: { Z: 'last', A: 'first' } };
  const { text } = upsertMcpSection('', 'example', config);
  expect(compareMcpSection(text, 'example', config).matches).toBe(true);
  expect(compareMcpSection(text, 'example', { ...config, args: ['two', 'one'] }).drift_fields).toEqual(['args']);
});

test('a receipt without a boolean result cannot confirm an async refresh', () => {
  fs.mkdirSync(path.join(root, 'graphify-out'));
  const receipt = path.join(root, 'graphify-out', STATUS_BASENAME);
  for (const [value, expected] of [['false', 'unknown'], [false, 'failed'], [true, 'succeeded']]) {
    fs.writeFileSync(receipt, JSON.stringify({ ok: value }));
    expect(readAsyncRefreshStatus(root).status).toBe(expected);
  }
});
