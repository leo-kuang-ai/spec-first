'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { parseEntrypointOptions } = require('../../skills/spec-runtime-setup/scripts/lib/args.cjs');
const { buildActionPlan } = require('../../skills/spec-runtime-setup/scripts/lib/mode-policy.cjs');
const { runWorkspaceGraphClean } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-clean.cjs');
const { runWorkspaceGraphBuild } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-executor.cjs');
const { runWorkspaceGraphStatus } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs');
const { writeWorkspaceGraphState } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-graph-state.cjs');
const { resolveRuntimeProjectionTargets } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-runtime-preflight.cjs');
const { buildParentWorkspaceDiagnostic } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-parent-diagnostic.cjs');
const { renderHumanSummary } = require('../../skills/spec-runtime-setup/scripts/lib/renderer.cjs');
const { configureOrInspectHost, buildHostConfigReceipt } = require('../../skills/spec-runtime-setup/scripts/lib/runtime-executor.cjs');
const { runWorkspaceBatch } = require('../../skills/spec-runtime-setup/scripts/lib/workspace-executor.cjs');

let root;
beforeEach(() => { root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-lib-scope-'))); });
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

function put(relative, content) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function initRepo(id) {
  const dir = path.join(root, id);
  execFileSync('git', ['init', '-q', dir]);
  execFileSync('git', ['-C', dir, 'config', '--local', 'core.hooksPath', '.git/hooks']);
  put(`${id}/.codegraph/codegraph.db`, id);
  return { repo_id: id, git_root: dir };
}

test.each([[false, false], [true, false], [false, true]])('部分选择保留另一仓与共享资产：发现=%s，清单=%s', (allowDiscovery, manifest) => {
  const members = ['A', 'B'].map(initRepo);
  const state = writeWorkspaceGraphState({ workspaceRoot: root, operationStatus: 'complete', repos: members });
  expect(state.ok).toBe(true);
  if (manifest) put('.spec-first/workspace.yaml', 'schema_version: workspace-manifest.v1\nrepos:\n  - path: A\n  - path: B\n');
  put('graphify-out/B/graph.json', '{"repo":"B"}');
  put('.graphify/merged-graph.json', '{}');
  const routing = '<!-- spec-first:workspace-routing start -->\nroute\n<!-- spec-first:workspace-routing end -->\n';
  put('AGENTS.md', routing);
  const clean = runWorkspaceGraphClean({ cwd: root, repos: ['A'], allowDiscovery });
  expect(clean).toMatchObject({ status: 'partial', pending_confirm: ['B'], workspace_graphify_status: 'preserved' });
  expect(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8')).toBe(routing);
  for (const file of ['B/.codegraph/codegraph.db', 'graphify-out/B/graph.json', 'graphify-out/workspace-graph-state.json', '.graphify/merged-graph.json']) {
    expect(fs.existsSync(path.join(root, file))).toBe(true);
  }
});

test.each(['cli', 'manifest'])('不能静默略过显式无效目标：%s', (source) => {
  initRepo('A');
  const repos = source === 'cli' ? ['A', 'missing'] : [];
  if (source === 'manifest') put('.spec-first/workspace.yaml', 'schema_version: workspace-manifest.v1\nrepos:\n  - path: A\n  - path: missing\n');
  const exec = jest.fn(() => ({ status: 1 }));
  const options = { cwd: root, repos, exec };
  for (const [operation, status] of [[runWorkspaceGraphBuild, 'failed'], [runWorkspaceGraphClean, 'failed'], [runWorkspaceGraphStatus, 'invalid']]) {
    expect(operation(options)).toMatchObject({ status, reason_code: 'workspace-declared-targets-rejected', rejected: [{ path: 'missing', source, reason_code: 'declared-repo-not-found' }] });
  }
  expect(resolveRuntimeProjectionTargets({ cwd: root, actionPlan: { mode: 'workspace-graph-build', args: { repos } } }).targets).toEqual([]);
  expect(exec).not.toHaveBeenCalled();
  expect(fs.existsSync(path.join(root, 'A/.codegraph/codegraph.db'))).toBe(true);
  expect(fs.existsSync(path.join(root, 'graphify-out'))).toBe(false);
});

test('缺收据时也不能丢弃已移出清单的子图', () => {
  initRepo('A');
  put('graphify-out/old-repo/graphify-out/graph.json', '{}');
  expect(runWorkspaceGraphClean({ cwd: root, repos: ['A'], allowDiscovery: false })).toMatchObject({
    status: 'partial', reason_code: 'workspace-graph-directory-unconfirmed', unconfirmed_paths: [path.join('graphify-out', 'old-repo')],
  });
  expect(fs.existsSync(path.join(root, 'A/.codegraph/codegraph.db'))).toBe(true);
  expect(fs.existsSync(path.join(root, 'graphify-out/old-repo/graphify-out/graph.json'))).toBe(true);
});

test('版本缺值不能进入默认安装模式', () => {
  for (const argv of [['--version'], ['--version', '--check'], ['--version', '']]) {
    const plan = buildActionPlan({ argv: parseEntrypointOptions(argv).modeArgv });
    expect(plan).toMatchObject({ blocked: true, mutation: false, reason_code: 'missing-option-value' });
  }
  expect(parseEntrypointOptions(['--version', '1.2', '--plan'])).toMatchObject({ options: { pluginVersion: '1.2' }, modeArgv: ['--plan'] });
});

test.each(['restore', 'release'])('配置事务的恢复动作保留在结果、收据与人读输出：%s', (kind) => {
  const backup = path.join(root, 'backup');
  const action = kind === 'restore' ? `恢复 ${backup}` : '核对有无活跃写入者再处理锁';
  const transaction = kind === 'restore'
    ? { ok: false, reason_code: 'host-config-restore-failed', backup_path: backup, recovery: { status: 'manual-required', next_action: action } }
    : { ok: true, lock_release_status: 'failed', lock_release_reason_code: 'host-config-lock-release-failed', lock_path: 'example.lock', lock_release_next_action: action };
  const entry = { id: 'example', detection: { key: 'example' }, host_config: { command: 'example', args: [], targets: { project: { config_path: 'host.json', config_format: 'json' } } } };
  const context = { host: 'cursor', homeDir: root, authority: { host: 'cursor', explicit: true, mutation_allowed: true }, effectiveRegistry: { tools: [entry] }, actionPlan: { args: {}, capabilities: ['write-host-config'] }, hostConfigApplier: () => {
    if (kind === 'release') put('host.json', JSON.stringify({ mcpServers: { example: { command: 'example', args: [] } } }));
    return { ...transaction, error: 'private-diagnostic' };
  } };
  const results = configureOrInspectHost(context, root, { applyMutation: true, selectedIds: [] });
  const row = results.get('example');
  const expected = { next_action: action, ...(kind === 'restore' ? { backup_path: backup } : { lock_release_status: 'failed', lock_path: 'example.lock' }) };
  expect(row).toMatchObject({ configured_status: 'action-required', ...expected });
  expect(buildHostConfigReceipt(results)[0]).toMatchObject(expected);
  expect(JSON.stringify(row)).not.toContain('private-diagnostic');
  expect(renderHumanSummary({ toolFacts: { items: [{ ...row, id: 'example', result: 'action-required' }] } })).toContain(action);
});

test('父诊断保留自动发现的待确认状态，建议状态/计划而非修复', () => {
  const child = initRepo('repo A');
  const diagnostic = buildParentWorkspaceDiagnostic({ cwd: root, target: { candidates: [{ ...child, repo_label: 'repo A' }] } });
  expect(diagnostic).toMatchObject({ pending_confirm: ['repo A'], workspace_graph: { status: 'needs-confirmation' } });
  expect(diagnostic.dual_paths.child_provider_setup.commands[0]).toContain('--plan');
  expect(diagnostic.next_actions.join('\n')).not.toContain('--repair-host-config');
  expect(diagnostic.next_actions.join('\n')).toContain("'repo A'");
});

test.each(['installation', 'subset'])('人读下一步保留 folder、选择和执行范围：%s', (scope) => {
  const facts = { target: { target_kind: 'non-git-folder', target_root: root }, provider_readiness: ['graphify', 'codegraph'].map((provider) => ({ provider, lifecycle: { installed: true }, next_actions: [`构图 ${provider}`] })) };
  const text = renderHumanSummary({ toolFacts: facts, runtimeCapabilities: { repo_root: root } }, { executionSummary: { scope, overall_status: 'action-required', selected_ids: ['graphify'] } }).split('后续步骤')[1];
  expect(text).toContain(`--folder ${root}`);
  expect(text).toContain('--only graphify');
  expect(text).not.toMatch(/codegraph|--repo /);
  if (scope === 'installation') {
    expect(text).toContain('--installation-only');
    expect(text).not.toContain('构图');
  }
});

test.each([
  ['current', 'subset-setup-complete', true, 0],
  ['stale', 'subset-setup-complete', true, 1],
  ['current', 'unexpected-partial', true, 1],
  ['current', 'subset-setup-complete', false, 1],
])('批验证按请求范围判定：%s %s configured=%s', (manifest, reason, configured, expectedExit) => {
  put('.codex/spec-first/state.json', '{"manifestVersion":"1"}');
  const child = initRepo('A');
  const actionPlan = buildActionPlan({ argv: ['--verify-only'], defaultIds: ['graphify'] });
  const result = runWorkspaceBatch({ host: 'codex', homeDir: root, bundledVersion: '1', actionPlan, target: { workspace_root: root, candidates: [{ ...child, repo_label: 'A', workspace_relative_path: 'A', git_health: { status: 'ok' } }] } }, { runSingleTarget: () => ({ exit_code: 0, payload: {
    execution_summary: { overall_status: 'partial', scope: 'installation', reason_code: reason, selected_ids: ['graphify'] },
    tool_facts: { provider_readiness: [{ provider: 'graphify', readiness_status: 'installation-ready', lifecycle: { installed: true, configured } }] },
    runtime_capabilities: { setup_summary: { baseline_ready: true, host_runtime_ready: true, generated_runtime_manifest: { status: manifest } } },
  } }) });
  expect(result.exit_code).toBe(expectedExit);
  if (!expectedExit) {
    expect(result.payload.counts).toMatchObject({ ready: 1, action_required: 0 });
    expect(result.payload.results[0].result.execution_summary).toMatchObject({ overall_status: 'partial', scope: 'installation' });
  }
});

test('普通非空 DB 仅证明存在，不证明查询结果或新鲜度', () => {
  initRepo('A');
  const status = runWorkspaceGraphStatus({ cwd: root, repos: ['A'] });
  expect(status.repos[0]).toMatchObject({ codegraph_present: true, freshness: { freshness: 'unknown', empty_meaning: 'unknown', negative_authority: false } });
});

test.each(['missing', 'stale'])('manifest=%s 时不同时建议初始化与继续 workflow', (status) => {
  const text = renderHumanSummary({ runtimeCapabilities: { setup_summary: { baseline_ready: true, host_runtime_ready: true, generated_runtime_manifest: { status } } } }, {
    executionSummary: { overall_status: 'ready', scope: 'full', reason_code: 'setup-ready' },
  });
  expect(text).toContain('spec-first init');
  expect(text).not.toContain('继续目标 spec-* workflow');
});
