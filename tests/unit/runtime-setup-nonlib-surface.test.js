'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { execFileSync } = require('node:child_process');
const graphify = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
const { versionOutputMatches } = require('../../skills/spec-runtime-setup/scripts/providers/common.cjs');

let root;
beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-surface-')); });
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

function write(relative, content) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function fixtureGraph(confirmedScope = true) {
  const graph = JSON.stringify({ nodes: [{ id: 'main' }] });
  write('graphify-out/graph.json', graph);
  if (confirmedScope) write('graphify-out/spec-first-graph-scope.json', JSON.stringify({
    schema_version: 'graphify-scope-provenance.v1', provider: 'graphify', operation: 'first-generation',
    artifact_root: 'graphify-out', requirement_workspace_path: '.', graph_sha256: createHash('sha256').update(graph).digest('hex'),
  }));
}

function applyFixture({ query = true, stable = true, generate = false } = {}) {
  write('.qoder/rules/spec-first.md', 'graphify query: graphify-out/graph.json\n');
  const calls = [];
  const launcher = path.join(root, 'bin', 'graphify');
  const interpreter = path.join(root, 'bin', 'python');
  let probes = 0;
  const result = graphify.apply({ repoRoot: root, homeDir: root, host: 'qoder', env: { HOME: root },
    targetKind: generate ? 'git-repo' : 'non-git-folder', dependency: { ecosystem: 'pypi', version: '0.9.57' },
    runner(command, args) {
      calls.push([command, ...args]);
      if (command === interpreter) {
        probes += 1;
        return { exit_code: 0, stdout: JSON.stringify({ version: '0.9.57', packages: [['helper', stable ? '1' : String(probes)]] }) };
      }
      if (command === launcher && args[0] === 'query') return { exit_code: query ? 0 : 1, stdout: query ? 'main' : '' };
      if (command === launcher && args[0] === 'extract') { fixtureGraph(false); return { exit_code: 0 }; }
      return { exit_code: 1 };
    } }, { mutation: true, artifact_root: path.join(root, 'graphify-out'), resolved_graphify_command: launcher,
    resolved_graphify_interpreter: interpreter, resolved_graphify_installer: 'uv', resolved_graphify_collision_state: 'npm-incumbent',
    actions: generate ? [{ kind: 'first-generation', args: ['extract', '.', '--code-only'] }] : [] });
  return { calls, result };
}

test.each([['查询失败', false, true, true], ['安装身份变更', true, false, true], ['范围无收据', true, true, false]])('%s 时不进入旧工具清理', (_label, query, stable, scope) => {
  fixtureGraph(scope);
  const { calls, result } = applyFixture({ query, stable });
  expect(result.lifecycle.query_verified).toBe(query);
  expect(calls.some(([command]) => command === 'npm')).toBe(false);
});

test('项目内可选 hook 安装失败只降级自动刷新，不重复安装或清理旧工具', () => {
  execFileSync('git', ['init', '--template=', '-q', root]);
  execFileSync('git', ['-C', root, 'config', '--local', 'core.hooksPath', '.git/hooks']);
  const { calls, result } = applyFixture({ generate: true });
  expect(result.lifecycle.query_verified).toBe(true);
  expect(result.readiness_status).not.toBe('degraded');
  expect(result.steady_state).toMatchObject({ refresh_mode: 'manual-only', hook_verified: false, hook_skipped_reason: 'graphify-hook-install-failed' });
  expect(calls.filter(([, operation, action]) => operation === 'hook' && action === 'install')).toHaveLength(1);
  expect(calls.some(([command]) => command === 'npm')).toBe(false);
});

test('共享宿主说明只处理独立 Graphify 段，OpenCode 的共享配置不做路径替换', () => {
  const userSection = '## Team\n参考 .graphify/team\n';
  write('.claude/CLAUDE.md', `## graphify\nRead .graphify/graph.json\n${userSection}`);
  write('CLAUDE.md', userSection);
  write('.claude/skills/graphify/SKILL.md', 'Read .graphify/graph.json\n');
  const otherHook = { type: 'command', command: 'team-tool hook-check' };
  const postHook = [{ hooks: [{ type: 'command', command: 'graphify hook-check' }] }];
  write('.claude/settings.json', JSON.stringify({ hooks: { PreToolUse: [{ hooks: [{ type: 'command', command: 'graphify hook-check' }, otherHook] }], PostToolUse: postHook } }));
  const context = { graphifyCommand: path.join(root, 'graphify') };
  graphify.normalizePythonHostIntegration(root, 'claude', context);
  expect(fs.readFileSync(path.join(root, '.claude/CLAUDE.md'), 'utf8')).toBe(`## graphify\nRead graphify-out/graph.json\n${userSection}`);
  expect(graphify.pythonHostIntegrationConfigured(root, 'claude', context).ok).toBe(true);
  const settings = JSON.parse(fs.readFileSync(path.join(root, '.claude/settings.json'), 'utf8'));
  expect(settings.hooks.PreToolUse[0].hooks[1]).toEqual(otherHook);
  expect(settings.hooks.PostToolUse).toEqual(postHook);
  const sharedJson = '{ "plugin": [".opencode/plugins/graphify.js"], "instructions": [".graphify/team.md"] }\n';
  write('.opencode/opencode.json', sharedJson);
  graphify.normalizePythonHostIntegration(root, 'opencode', context);
  expect(fs.readFileSync(path.join(root, '.opencode/opencode.json'), 'utf8')).toBe(sharedJson);
});

test('父目录 bare 与 check 同为诊断，但子仓 bare 和父目录显式安装仍需写权限', () => {
  const child = path.join(root, 'api');
  execFileSync('git', ['init', '--template=', '-q', child]);
  const run = (cwd, argv) => runSetup({ cwd, argv, env: {}, homeDir: root, runner: () => ({ exit_code: 1 }), enforceSurfaceBinding: true });
  const diagnostic = run(root, ['--check']);
  for (const argv of [[], ['--all-repos']]) {
    expect(run(root, argv)).toMatchObject({ exit_code: diagnostic.exit_code, reason_code: diagnostic.reason_code, target: { mode: 'workspace-all-repos' } });
  }
  expect(run(child, []).reason_code).toBe('host-authority-required');
  expect(run(root, ['--installation-only', '--all-repos']).reason_code).toBe('host-authority-required');
});

test('版本验证区分正式版和预发布；Qoder 模板不要求加载未安装的 Skill', () => {
  expect(versionOutputMatches('codegraph v1.6.0', '1.6.0')).toBe(true);
  expect(versionOutputMatches('codegraph 1.6.0-beta.1', '1.6.0')).toBe(false);
  expect(graphify.renderGraphifyInstructionSection('qoder')).not.toContain('skill: "graphify"');
});
