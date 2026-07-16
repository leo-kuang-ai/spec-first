'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const cliPath = path.join(repoRoot, 'bin', 'spec-first.js');
const realDogfood = process.env.SPEC_FIRST_REAL_GRAPHIFY_DOGFOOD === '1';
const roots = new Set();

afterEach(() => {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
  roots.clear();
});

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout: options.timeout || 300000,
    ...options,
  });
  if (result.error) throw result.error;
  return result;
}

function requireCommand(command, args = ['--version']) {
  const result = run(command, args, { timeout: 30000 });
  if (result.status !== 0) throw new Error(`${command} 不可用：${result.stderr || result.stdout}`);
  return result;
}

function createFixture(label) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-real-graphify-${label}-`)));
  roots.add(root);
  const project = path.join(root, 'project');
  const home = path.join(root, 'home');
  fs.mkdirSync(path.join(project, 'src'), { recursive: true });
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(path.join(project, 'src', 'index.js'), 'module.exports = function ready() { return true; };\n');
  const initialized = run('git', ['init', '-q', project]);
  if (initialized.status !== 0) throw new Error(initialized.stderr || initialized.stdout);
  run('git', ['-C', project, 'config', 'user.email', 'dogfood@example.com']);
  run('git', ['-C', project, 'config', 'user.name', 'Runtime Setup Dogfood']);
  const skillDir = path.join(home, '.agents', 'skills', 'ast-grep');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# ast-grep\n');
  return { root, project, home };
}

function realToolEnvironment(home) {
  const graphifyVersion = requireCommand('graphify').stdout.trim();
  if (!graphifyVersion.includes('0.9.17')) throw new Error(`需要 graphify 0.9.17，实际为 ${graphifyVersion}`);
  requireCommand('codegraph');
  requireCommand('uv');
  const uvBin = run('uv', ['tool', 'dir', '--bin'], { timeout: 30000 });
  const uvTools = run('uv', ['tool', 'dir'], { timeout: 30000 });
  if (uvBin.status !== 0 || uvTools.status !== 0) throw new Error('无法解析真实 uv tool 目录');
  return {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    MCP_SETUP_HOST: 'qoder',
    UV_TOOL_BIN_DIR: uvBin.stdout.trim(),
    UV_TOOL_DIR: uvTools.stdout.trim(),
    npm_config_cache: path.join(home, '.npm-cache'),
  };
}

function initializeRuntime(fixture, env) {
  const result = run(process.execPath, [
    cliPath,
    'init',
    '--qoder',
    '-y',
    '-u',
    'Runtime Setup Dogfood',
    '--lang',
    'zh',
    '--no-sync-user-language',
  ], {
    cwd: fixture.project,
    env,
    timeout: 180000,
  });
  if (result.status !== 0) throw new Error(`spec-first init 失败：\n${result.stdout}\n${result.stderr}`);
}

function runProjectedSetup(fixture, env, args) {
  const setup = path.join(fixture.project, '.qoder', 'skills', 'spec-runtime-setup', 'scripts', 'setup.cjs');
  const result = run(process.execPath, [setup, ...args, '--json', '--repo', fixture.project], {
    cwd: fixture.project,
    env,
    timeout: 300000,
  });
  return {
    ...result,
    json: result.stdout.trim() ? JSON.parse(result.stdout) : null,
  };
}

function snapshotTree(root) {
  const entries = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (entry.isDirectory()) visit(absolute);
      else entries.push(`${relative}:${crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex')}`);
    }
  }
  visit(root);
  return entries;
}

function fileHash(target) {
  return crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
}

function waitFor(predicate, timeoutMs = 60000, intervalMs = 250) {
  const deadline = Date.now() + timeoutMs;
  const signal = new Int32Array(new SharedArrayBuffer(4));
  while (Date.now() < deadline) {
    if (predicate()) return true;
    Atomics.wait(signal, 0, 0, intervalMs);
  }
  return predicate();
}

(realDogfood ? test : test.skip)('真实 Graphify 在 external hooksPath 下保持完整 setup ready 且外部目录字节不变', () => {
  const fixture = createFixture('external');
  const externalHooks = path.join(fixture.root, 'external-hooks');
  fs.mkdirSync(externalHooks, { recursive: true });
  fs.writeFileSync(path.join(externalHooks, 'sentinel'), 'preserve\n');
  const env = realToolEnvironment(fixture.home);
  const configured = run('git', ['config', '--global', 'core.hooksPath', externalHooks], { env });
  if (configured.status !== 0) throw new Error(configured.stderr || configured.stdout);
  initializeRuntime(fixture, env);
  const before = snapshotTree(externalHooks);

  const result = runProjectedSetup(fixture, env, ['--only', 'codegraph,graphify']);
  if (result.status !== 0) throw new Error(`external setup 失败：\n${result.stdout}\n${result.stderr}`);
  expect(result.status).toBe(0);
  expect(result.json.execution_summary).toMatchObject({
    overall_status: 'ready',
    reason_code: 'setup-ready',
    scope: 'full',
  });
  const graphify = result.json.tool_facts.provider_readiness.find((entry) => entry.provider === 'graphify');
  expect(graphify).toMatchObject({
    readiness_status: 'fresh',
    lifecycle: {
      configured: true,
      initialized: true,
      indexed: true,
      artifact_exists: true,
      query_verified: true,
    },
    first_generation: { status: 'completed' },
    steady_state: {
      refresh_mode: 'manual-only',
      hook_installed: false,
      hook_verified: false,
      hook_status: 'blocked',
      hook_skipped_reason: 'graphify-hook-path-outside-project',
    },
  });
  expect(snapshotTree(externalHooks)).toEqual(before);
  expect(result.stdout).not.toContain(externalHooks);
  expect(result.stderr).not.toContain(externalHooks);

  const repeated = runProjectedSetup(fixture, env, ['--only', 'graphify']);
  if (repeated.status !== 0) throw new Error(`external repeated setup 失败：\n${repeated.stdout}\n${repeated.stderr}`);
  const repeatedGraphify = repeated.json.tool_facts.provider_readiness.find((entry) => entry.provider === 'graphify');
  expect(repeatedGraphify).toMatchObject({
    readiness_status: 'unknown',
    lifecycle: {
      configured: true,
      initialized: true,
      indexed: true,
      artifact_exists: true,
      query_verified: true,
    },
    steady_state: {
      refresh_mode: 'manual-only',
      hook_status: 'blocked',
      hook_skipped_reason: 'graphify-hook-path-outside-project',
    },
  });
  expect(snapshotTree(externalHooks)).toEqual(before);

  const graphPath = path.join(fixture.project, '.graphify', 'graph.json');
  const beforeRefreshHash = fileHash(graphPath);
  fs.appendFileSync(
    path.join(fixture.project, 'src', 'index.js'),
    'module.exports.addedByManualRefresh = function addedByManualRefresh() { return 3; };\n',
  );
  const refreshed = runProjectedSetup(fixture, env, ['--only', 'graphify', '--refresh']);
  if (refreshed.status !== 0) throw new Error(`external explicit refresh 失败：\n${refreshed.stdout}\n${refreshed.stderr}`);
  const refreshedGraphify = refreshed.json.tool_facts.provider_readiness.find((entry) => entry.provider === 'graphify');
  expect(refreshedGraphify).toMatchObject({
    readiness_status: 'fresh',
    lifecycle: {
      configured: true,
      initialized: true,
      indexed: true,
      artifact_exists: true,
      query_verified: true,
    },
    steady_state: {
      refresh_mode: 'manual-only',
      hook_status: 'blocked',
      hook_skipped_reason: 'graphify-hook-path-outside-project',
    },
  });
  expect(fileHash(graphPath)).not.toBe(beforeRefreshHash);
  expect(fs.readdirSync(fixture.project).filter((name) => name.startsWith('.graphify.backup-'))).toEqual([]);
  expect(fs.readdirSync(fixture.project).filter((name) => name.startsWith('.graphify.staging-'))).toEqual([]);
  expect(fs.existsSync(path.join(fixture.project, '.graphify-migration-journal.json'))).toBe(false);
  expect(snapshotTree(externalHooks)).toEqual(before);
  const query = run('graphify', ['query', 'addedByManualRefresh', '--graph', '.graphify/graph.json'], {
    cwd: fixture.project,
    env,
    timeout: 30000,
  });
  if (query.status !== 0) throw new Error(query.stderr || query.stdout);
}, 360000);

(realDogfood ? test : test.skip)('真实 Graphify 在 contained hooksPath 下安装并验证 commit refresh hook', () => {
  const fixture = createFixture('contained');
  const env = realToolEnvironment(fixture.home);
  const configured = run('git', ['-C', fixture.project, 'config', '--local', 'core.hooksPath', '.githooks'], { env });
  if (configured.status !== 0) throw new Error(configured.stderr || configured.stdout);
  const staged = run('git', ['-C', fixture.project, 'add', 'src/index.js'], { env });
  if (staged.status !== 0) throw new Error(staged.stderr || staged.stdout);
  const baseline = run('git', ['-C', fixture.project, 'commit', '-m', 'test: baseline'], { env });
  if (baseline.status !== 0) throw new Error(baseline.stderr || baseline.stdout);
  initializeRuntime(fixture, env);

  const result = runProjectedSetup(fixture, env, ['--only', 'graphify']);
  if (result.status !== 0) throw new Error(`contained setup 失败：\n${result.stdout}\n${result.stderr}`);
  expect(result.status).toBe(0);
  const graphify = result.json.tool_facts.provider_readiness.find((entry) => entry.provider === 'graphify');
  expect(graphify).toMatchObject({
    readiness_status: 'fresh',
    steady_state: {
      refresh_mode: 'skill-cli-hook-on-demand',
      hook_installed: true,
      hook_verified: true,
      hook_status: 'verified',
      hook_skipped_reason: null,
    },
  });
  for (const hookName of ['post-commit', 'post-checkout']) {
    const hook = fs.readFileSync(path.join(fixture.project, '.githooks', hookName), 'utf8');
    expect(hook).toContain('Installed by: graphify hook install');
    expect(hook).toContain("export GRAPHIFY_OUT='.graphify'");
    expect(hook).toContain('# spec-first graphify credential isolation start');
  }

  const graphPath = path.join(fixture.project, '.graphify', 'graph.json');
  const beforeCommitHash = fileHash(graphPath);
  fs.appendFileSync(
    path.join(fixture.project, 'src', 'index.js'),
    'module.exports.addedByCommit = function addedByCommit() { return 2; };\n',
  );
  const restaged = run('git', ['-C', fixture.project, 'add', 'src/index.js'], { env });
  if (restaged.status !== 0) throw new Error(restaged.stderr || restaged.stdout);
  const committed = run('git', ['-C', fixture.project, 'commit', '-m', 'test: trigger graph refresh'], {
    env,
    timeout: 30000,
  });
  if (committed.status !== 0) throw new Error(committed.stderr || committed.stdout);
  const refreshed = waitFor(() => fs.existsSync(graphPath) && fileHash(graphPath) !== beforeCommitHash);
  if (!refreshed) {
    const rebuildLog = path.join(fixture.home, '.cache', 'graphify-rebuild.log');
    const diagnostic = fs.existsSync(rebuildLog) ? fs.readFileSync(rebuildLog, 'utf8') : 'missing rebuild log';
    throw new Error(`commit 后 Graphify graph 未刷新：\n${diagnostic}`);
  }
  const query = run('graphify', ['query', 'addedByCommit', '--graph', '.graphify/graph.json'], {
    cwd: fixture.project,
    env,
    timeout: 30000,
  });
  if (query.status !== 0) throw new Error(query.stderr || query.stdout);
}, 360000);
