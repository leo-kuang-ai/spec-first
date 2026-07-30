'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { validateAgainstSchema } = require('../../src/contracts/schema-validator');

const repoRoot = path.resolve(__dirname, '..', '..');
const providerSchema = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs', 'contracts', 'provider-readiness.schema.json'), 'utf8'));

function tempRepo(label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-${label}-`));
  fs.mkdirSync(path.join(root, '.git'), { recursive: true });
  return root;
}

function initializeGitRepo(root) {
  const result = spawnSync('git', ['init', '-q', root], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
}

function success(stdout = '') {
  return { command: '', args: [], exit_code: 0, stdout, stderr: '', timeout: false, signal: null };
}

function failure(stderr = 'failed') {
  return { command: '', args: [], exit_code: 1, stdout: '', stderr, timeout: false, signal: null };
}

function signalTermination(stdout = '') {
  return {
    command: '',
    args: [],
    exit_code: null,
    stdout,
    stderr: '',
    timeout: false,
    timed_out: false,
    signal: 'SIGTERM',
    error: null,
  };
}

function materializeGraphifyProjectSkill(target, args) {
  if (args[0] !== 'install' || args[1] !== '--project') return;
  const platform = args[3] || 'codex';
  const roots = {
    claude: '.claude/skills/graphify',
    cursor: '.cursor/skills/graphify',
    kiro: '.kiro/skills/graphify',
    qoder: '.qoder/skills/graphify',
  };
  const skillDir = path.join(target, roots[platform] || '.codex/skills/graphify');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Graphify\n');
}

function materializePythonGraphifyHooks(
  target,
  interpreter,
  userCommand = '',
  hooksRoot = path.join(target, '.git', 'hooks'),
) {
  fs.mkdirSync(hooksRoot, { recursive: true });
  const bodies = {
    'post-commit': [
      '#!/bin/sh',
      userCommand,
      '# graphify-hook-start',
      '# Installed by: graphify hook install',
      "_out = os.environ.get('GRAPHIFY_OUT', 'graphify-out')",
      "_PINNED='" + interpreter + "'",
      'from graphify.watch import _rebuild_code',
      "_GFY_PYTHON_FILE='graphify-out/.graphify_python'",
      '# graphify-hook-end',
      '',
    ],
    'post-checkout': [
      '#!/bin/sh',
      '# graphify-checkout-hook-start',
      '# Installed by: graphify hook install',
      '[ ! -d "graphify-out" ] && exit 0',
      "_out = os.environ.get('GRAPHIFY_OUT', 'graphify-out')",
      "_PINNED='" + interpreter + "'",
      'from graphify.watch import _rebuild_code',
      '# graphify-checkout-hook-end',
      '',
    ],
  };
  for (const [name, lines] of Object.entries(bodies)) {
    const hookPath = path.join(hooksRoot, name);
    fs.writeFileSync(hookPath, lines.filter((line) => line !== '').join('\n') + '\n');
    fs.chmodSync(hookPath, 0o755);
  }
}

function createGraphifyApplyFixture(label) {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-graphify-${label}-`));
  const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-graphify-${label}-home-`));
  initializeGitRepo(target);
  const binDir = path.join(homeDir, '.local', 'bin');
  const toolRoot = path.join(homeDir, '.local', 'share', 'uv', 'tools', 'graphifyy', 'bin');
  const launcher = path.join(binDir, 'graphify');
  const interpreter = path.join(toolRoot, 'python');
  fs.mkdirSync(binDir, { recursive: true });
  fs.mkdirSync(toolRoot, { recursive: true });
  fs.writeFileSync(launcher, `#!${interpreter}\n`);
  fs.writeFileSync(interpreter, '#!/bin/sh\n');
  fs.chmodSync(launcher, 0o755);
  fs.chmodSync(interpreter, 0o755);
  const hookCalls = [];
  const graphifyCalls = [];
  let onHookCommand = null;
  const runner = (command, args, options = {}) => {
    if (command === 'python3' && args[0] === '-c') return success('3.12.4');
    if (command === 'uv' && args[0] === '--version') return success('uv 0.8.0');
    if (command === 'uv' && args.join(' ') === 'tool dir --bin') return success(binDir);
    if (command === 'uv' && args.join(' ') === 'tool dir') return success(path.dirname(toolRoot));
    if (command === interpreter && args[0] === '-c') {
      return success(JSON.stringify({ version: '0.9.12', packages: [['graphifyy', '0.9.12']] }));
    }
    if (command === launcher && args[0] === '--version') return success('graphify 0.9.12');
    if (command === launcher) graphifyCalls.push({ args: [...args], env: { ...(options.env || {}) } });
    if (command === launcher && args[0] === 'extract') {
      fs.mkdirSync(path.join(target, 'graphify-out'), { recursive: true });
      fs.writeFileSync(path.join(target, 'graphify-out', 'graph.json'), JSON.stringify({ nodes: [{ id: 'fixture' }], links: [] }));
      return success('generated');
    }
    if (command === launcher && args[0] === 'update') {
      fs.mkdirSync(path.join(target, 'graphify-out'), { recursive: true });
      fs.writeFileSync(
        path.join(target, 'graphify-out', 'graph.json'),
        JSON.stringify({ nodes: [{ id: 'fixture-refreshed' }], links: [] }),
      );
      return success('updated');
    }
    if (command === launcher && args[0] === 'query') return success('query ok');
    if (command === launcher && args[0] === 'hook') {
      const call = { args: [...args], env: { ...(options.env || {}) } };
      hookCalls.push(call);
      const hooksRoot = call.env.GIT_CONFIG_VALUE_0 || path.join(target, '.git', 'hooks');
      if (args[1] === 'install') materializePythonGraphifyHooks(target, interpreter, '', hooksRoot);
      if (typeof onHookCommand === 'function') onHookCommand(call);
      if (args[1] === 'status') {
        const installed = ['post-commit', 'post-checkout'].every((name) => fs.existsSync(path.join(hooksRoot, name)));
        return installed ? success('installed') : failure('missing');
      }
      return success('ok');
    }
    return failure(`unexpected ${command} ${args.join(' ')}`);
  };
  const dependency = { ecosystem: 'pypi', package: 'graphifyy', version: '0.9.12', command: 'graphify' };
  const context = {
    selected: true,
    probeDependency: true,
    repoRoot: target,
    homeDir,
    host: 'qoder',
    dependency,
    env: {
      HOME: homeDir,
      PATH: binDir,
      GIT_CONFIG_COUNT: '2',
      GIT_CONFIG_KEY_0: 'credential.helper',
      GIT_CONFIG_VALUE_0: 'inherited-secret-helper',
      GIT_CONFIG_KEY_1: 'core.hooksPath',
      GIT_CONFIG_VALUE_1: '/inherited/outside/hooks',
    },
    runner,
  };
  return {
    target,
    homeDir,
    launcher,
    interpreter,
    hookCalls,
    graphifyCalls,
    context,
    setHookCommandCallback(callback) {
      onHookCommand = callback;
    },
  };
}

describe('spec-runtime-setup provider registry', () => {
  test('uses a static trusted provider map', () => {
    const providers = require('../../skills/spec-runtime-setup/scripts/providers/registry.cjs');
    expect(Object.keys(providers).sort()).toEqual(['codegraph', 'graphify']);
    for (const provider of Object.values(providers)) {
      expect(provider).toEqual(expect.objectContaining({
        plan: expect.any(Function),
        verify: expect.any(Function),
        apply: expect.any(Function),
        refresh: expect.any(Function),
      }));
    }
  });
});

describe('CodeGraph provider', () => {
  test('requires explicit selection and performs bounded sync/reindex before confirmed readiness', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
    const target = tempRepo('codegraph');
    const calls = [];
    let statusCount = 0;
    const runner = (command, args) => {
      calls.push([command, ...args]);
      if (args[0] === '--version') return success('codegraph 1.5.0');
      if (args[0] === 'init') {
        fs.mkdirSync(path.join(target, '.codegraph'), { recursive: true });
        fs.writeFileSync(path.join(target, '.codegraph', 'codegraph.db'), 'db');
        return success();
      }
      if (args[0] === 'status') {
        statusCount += 1;
        if (statusCount === 1) return success('pending changes; run codegraph sync');
        if (statusCount === 2) return success('full rebuild recommended; run codegraph index -f');
        return success('index ready');
      }
      return success();
    };

    expect(provider.plan({ selected: false, repoRoot: target })).toMatchObject({ mutation: false, blocked: false });
    const plan = provider.plan({
      selected: true,
      repoRoot: target,
      dependency: { package: '@colbymchenry/codegraph', version: '1.5.0' },
    });
    expect(plan).toMatchObject({ mutation: true, blocked: false, provider: 'codegraph' });

    const result = provider.apply({ repoRoot: target, runner, configured: true }, plan);
    expect(validateAgainstSchema(providerSchema, result)).toEqual({ valid: true, errors: [] });
    expect(result.readiness_status).toBe('fresh');
    expect(result.lifecycle).toMatchObject({
      installed: true,
      initialized: true,
      indexed: true,
      query_verified: true,
    });
    expect(calls.filter((call) => call.join(' ') === 'codegraph sync')).toHaveLength(1);
    expect(calls.filter((call) => call.join(' ') === 'codegraph index -f')).toHaveLength(1);
    expect(calls.filter((call) => call.join(' ') === 'codegraph query __spec_first_readiness_probe__ --limit 1 --json')).toHaveLength(1);
  });

  test.each([
    ['unknown', undefined, 'unknown'],
    ['not configured', false, 'degraded'],
    ['configured', true, 'fresh'],
  ])('reports indexed CLI readiness as %s when host configuration is %s', (_label, configured, expected) => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
    const target = tempRepo(`codegraph-config-${expected}`);
    fs.mkdirSync(path.join(target, '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(target, '.codegraph', 'codegraph.db'), 'db');
    const runner = (_command, args) => {
      if (args[0] === '--version') return success('codegraph 1.5.0');
      if (args[0] === 'status') return success('index ready');
      if (args[0] === 'query') return success('{}');
      return success();
    };

    const result = provider.verify({
      repoRoot: target,
      runner,
      configured,
      dependency: { version: '1.5.0' },
    });

    expect(result.readiness_status).toBe(expected);
    expect(result.lifecycle.configured).toBe(configured === true);
  });

  test('replaces the unknown configuration action with the confirmed repair action', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
    const readiness = {
      readiness_status: 'unknown',
      lifecycle: {
        installed: true,
        configured: false,
        initialized: true,
        indexed: true,
        query_verified: true,
      },
      next_actions: ['通过当前 host 的 spec-runtime-setup --verify-only 确认 CodeGraph MCP 配置。'],
    };

    provider.reconcileConfigured(readiness, {
      configured_status: 'action-required',
      next_action: 'spec-runtime-setup --only codegraph --repair-host-config',
    });

    expect(readiness).toMatchObject({
      readiness_status: 'degraded',
      lifecycle: { configured: false },
      next_actions: ['spec-runtime-setup --only codegraph --repair-host-config'],
    });
  });

  test('reports an actionable setup command when an existing CodeGraph index is not ready', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
    const target = tempRepo('codegraph-index-not-ready');
    fs.mkdirSync(path.join(target, '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(target, '.codegraph', 'codegraph.db'), 'db');
    const runner = (_command, args) => {
      if (args[0] === '--version') return success('codegraph 1.5.0');
      if (args[0] === 'status') return success('pending changes; run codegraph sync');
      return success();
    };

    const result = provider.verify({
      repoRoot: target,
      runner,
      configured: true,
      dependency: { version: '1.5.0' },
    });

    expect(result.readiness_status).toBe('degraded');
    expect(result.next_actions).toContain(
      '运行 spec-runtime-setup --only codegraph，修复 CodeGraph index/query readiness。',
    );
  });

  test('degrades when the real CodeGraph query probe fails after indexing', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
    const target = tempRepo('codegraph-query-failure');
    fs.mkdirSync(path.join(target, '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(target, '.codegraph', 'codegraph.db'), 'db');
    const runner = (_command, args) => {
      if (args[0] === '--version') return success('codegraph 1.5.0');
      if (args[0] === 'status') return success('index ready');
      if (args[0] === 'query') return failure('query failed');
      return success();
    };
    const context = {
      selected: true,
      repoRoot: target,
      dependency: { package: '@colbymchenry/codegraph', version: '1.5.0' },
      runner,
    };

    const result = provider.apply(context, provider.plan(context));

    expect(result.readiness_status).toBe('degraded');
    expect(result.lifecycle.query_verified).toBe(false);
    expect(result.limitations).toContain('failed: codegraph-query-probe-failed. CodeGraph setup 失败。');
  });

  test('blocks a symlinked artifact root before running any mutation command', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
    const target = tempRepo('codegraph-symlink');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-codegraph-outside-'));
    fs.symlinkSync(outside, path.join(target, '.codegraph'), process.platform === 'win32' ? 'junction' : 'dir');
    const runner = jest.fn(() => success());

    expect(provider.plan({ selected: true, repoRoot: target })).toMatchObject({
      mutation: false,
      blocked: true,
      reason_code: 'codegraph-artifact-symlink-escape',
    });
    const result = provider.apply({ selected: true, repoRoot: target, runner });
    expect(result.readiness_status).toBe('degraded');
    expect(fs.readdirSync(outside)).toEqual([]);
    expect(runner).toHaveBeenCalledTimes(1);
    expect(runner.mock.calls[0].slice(0, 2)).toEqual(['codegraph', ['--version']]);

    const leafTarget = tempRepo('codegraph-leaf-symlink');
    const victim = path.join(outside, 'codegraph-victim.db');
    fs.writeFileSync(victim, 'keep');
    fs.mkdirSync(path.join(leafTarget, '.codegraph'));
    fs.symlinkSync(victim, path.join(leafTarget, '.codegraph', 'codegraph.db'), process.platform === 'win32' ? 'file' : 'file');
    expect(provider.plan({ selected: true, repoRoot: leafTarget })).toMatchObject({
      mutation: false,
      blocked: true,
      reason_code: 'codegraph-artifact-symlink-escape',
    });
    expect(fs.readFileSync(victim, 'utf8')).toBe('keep');
  });

  test.each([
    ['pending changes remain after sync', 'pending changes; run codegraph sync', 'codegraph-sync-incomplete'],
    ['full rebuild remains after reindex', 'full rebuild recommended; run codegraph index -f', 'codegraph-post-mutation-probe-failed'],
  ])('degrades when %s', (_label, statusOutput, reasonCode) => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
    const target = tempRepo(`codegraph-residual-${reasonCode}`);
    const runner = (command, args) => {
      if (args[0] === '--version') return success('codegraph 1.5.0');
      if (args[0] === 'init') {
        fs.mkdirSync(path.join(target, '.codegraph'), { recursive: true });
        fs.writeFileSync(path.join(target, '.codegraph', 'codegraph.db'), 'db');
        return success();
      }
      if (args[0] === 'status') return success(statusOutput);
      return success();
    };
    const plan = provider.plan({
      selected: true,
      repoRoot: target,
      dependency: { package: '@colbymchenry/codegraph', version: '1.5.0' },
    });
    const result = provider.apply({ repoRoot: target, runner }, plan);
    expect(result.readiness_status).toBe('degraded');
    expect(result.limitations).toContain(`failed: ${reasonCode}. CodeGraph setup 失败。`);
    expect(result.lifecycle.indexed).toBe(false);
  });

  test('does not report signal-terminated CodeGraph probes as ready', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/codegraph.cjs');
    const target = tempRepo('codegraph-signal');
    fs.mkdirSync(path.join(target, '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(target, '.codegraph', 'codegraph.db'), 'db');
    const runner = (_command, args) => signalTermination(
      args[0] === '--version' ? 'codegraph 1.5.0' : 'index ready',
    );

    const result = provider.verify({
      repoRoot: target,
      dependency: { version: '1.5.0' },
      runner,
    });

    expect(result.readiness_status).toBe('not-run');
    expect(result.lifecycle).toMatchObject({ installed: false, indexed: false });
  });
});

describe('Graphify provider', () => {
  test('keeps an external effective hooks path read-only and preserves core readiness', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('external-hooks');
    const { target, context, hookCalls } = fixture;
    const outsideHooks = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-user-hooks-'));
    fs.writeFileSync(path.join(outsideHooks, 'sentinel'), 'preserve\n');
    const configured = spawnSync('git', ['-C', target, 'config', '--local', 'core.hooksPath', outsideHooks], { encoding: 'utf8' });
    if (configured.status !== 0) throw new Error(configured.stderr || configured.stdout);
    const before = fs.readdirSync(outsideHooks).map((name) => [name, fs.readFileSync(path.join(outsideHooks, name), 'utf8')]);

    const outsideProbes = [];
    const originalExistsSync = fs.existsSync;
    const originalLstatSync = fs.lstatSync;
    const originalReadFileSync = fs.readFileSync;
    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation((candidate) => {
      if (String(candidate).startsWith(outsideHooks)) outsideProbes.push(['existsSync', candidate]);
      return originalExistsSync(candidate);
    });
    const lstatSpy = jest.spyOn(fs, 'lstatSync').mockImplementation((candidate, options) => {
      if (String(candidate).startsWith(outsideHooks)) outsideProbes.push(['lstatSync', candidate]);
      return originalLstatSync(candidate, options);
    });
    const readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((candidate, options) => {
      if (String(candidate).startsWith(outsideHooks)) outsideProbes.push(['readFileSync', candidate]);
      return originalReadFileSync(candidate, options);
    });
    let actionPlan;
    let result;
    try {
      expect(provider.resolveGraphifyHookTarget(target)).toMatchObject({
        classification: 'external',
        reason_code: 'graphify-hook-path-outside-project',
      });

      actionPlan = provider.plan(context);
      expect(actionPlan).toMatchObject({
        blocked: false,
        hook_target: {
          classification: 'external',
          reason_code: 'graphify-hook-path-outside-project',
        },
      });
      expect(JSON.stringify(actionPlan)).not.toContain(outsideHooks);

      result = provider.apply(context, actionPlan);
    } finally {
      existsSpy.mockRestore();
      lstatSpy.mockRestore();
      readSpy.mockRestore();
    }
    // R3 放宽：external 从「零 probe」变为「只读验证」——仅 lstat/read 两个 hook 文件，
    // 绝不 write/execute，绝不触碰其余文件（如 sentinel）。此 fixture 无 marker → 仅 lstat（文件不存在即止）。
    expect(outsideProbes.map(([op, candidate]) => [op, path.basename(String(candidate))])).toEqual([
      ['lstatSync', 'post-commit'],
      ['lstatSync', 'post-checkout'],
    ]);
    expect(hookCalls).toEqual([]);
    expect(fs.readdirSync(outsideHooks).map((name) => [name, fs.readFileSync(path.join(outsideHooks, name), 'utf8')])).toEqual(before);
    expect(result).toMatchObject({
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
    expect(validateAgainstSchema(providerSchema, result)).toEqual({ valid: true, errors: [] });

    const verified = provider.verify(context);
    expect(hookCalls).toEqual([]);
    expect(verified).toMatchObject({
      readiness_status: 'unknown',
      lifecycle: { configured: true, artifact_exists: true, query_verified: true },
      steady_state: {
        refresh_mode: 'manual-only',
        hook_status: 'blocked',
        hook_skipped_reason: 'graphify-hook-path-outside-project',
      },
    });
    expect(verified.next_actions).toEqual([
      expect.stringContaining('可选 commit-time 自动刷新未检测到'),
    ]);
    expect(verified.next_actions.join('\n')).toContain('也不写入外部 hook');
    expect(verified.next_actions.join('\n')).not.toContain('执行显式 incremental refresh');
  });

  test('read-only verifies an external commit hook carrying the Graphify marker as verified-external', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('external-hooks-verified');
    const { target, context, hookCalls } = fixture;
    const outsideHooks = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-verified-user-hooks-'));
    fs.writeFileSync(
      path.join(outsideHooks, 'post-commit'),
      '#!/bin/sh\n# graphify-hook-start\n# Installed by: graphify hook install\ngraphify update .\n# graphify-hook-end\n',
    );
    fs.chmodSync(path.join(outsideHooks, 'post-commit'), 0o755);
    const configured = spawnSync('git', ['-C', target, 'config', '--local', 'core.hooksPath', outsideHooks], { encoding: 'utf8' });
    if (configured.status !== 0) throw new Error(configured.stderr || configured.stdout);
    const before = fs.readdirSync(outsideHooks).map((name) => [name, fs.readFileSync(path.join(outsideHooks, name), 'utf8')]);

    const writeSpy = jest.spyOn(fs, 'writeFileSync');
    let result;
    try {
      const actionPlan = provider.plan(context);
      result = provider.apply(context, actionPlan);
    } finally {
      writeSpy.mockRestore();
    }
    // 零写入外部 hooks root、零 hook 子命令、外部目录逐字节不变。
    expect(writeSpy.mock.calls.filter(([candidate]) => String(candidate).startsWith(outsideHooks))).toEqual([]);
    expect(hookCalls).toEqual([]);
    expect(fs.readdirSync(outsideHooks).map((name) => [name, fs.readFileSync(path.join(outsideHooks, name), 'utf8')])).toEqual(before);
    expect(result).toMatchObject({
      steady_state: {
        refresh_mode: 'commit-hook-external-verified',
        hook_installed: false,
        hook_verified: false,
        hook_status: 'verified-external',
        hook_skipped_reason: 'graphify-hook-external-verified',
      },
    });
    expect(validateAgainstSchema(providerSchema, result)).toEqual({ valid: true, errors: [] });
    expect(JSON.stringify(result)).not.toContain(outsideHooks);

    const verified = provider.verify(context);
    expect(hookCalls).toEqual([]);
    expect(verified.steady_state).toMatchObject({
      refresh_mode: 'commit-hook-external-verified',
      hook_status: 'verified-external',
    });
    expect(verified.next_actions.join('\n')).toContain('commit-time 自动刷新已只读验证');
  });

  test('writes a single-repo graph baseline on generation and surfaces a head-moved advisory (U6b)', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('single-repo-baseline');
    const { target, context } = fixture;
    const gitEnv = {
      ...process.env,
      GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@e', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@e',
    };
    const commit = (msg) => spawnSync('git', ['-C', target, 'commit', '--allow-empty', '--no-gpg-sign', '-m', msg], { env: gitEnv, encoding: 'utf8' });
    commit('c1');

    const result = provider.apply(context, provider.plan(context));
    const baselinePath = path.join(target, 'graphify-out', 'spec-first-graph-baseline.json');
    expect(fs.existsSync(baselinePath)).toBe(true);
    expect(result.first_generation.status).toBe('completed');

    // Same HEAD → no head-moved advisory (consume-side read-only, never triggers a rebuild).
    const graphifyCallsBefore = fixture.graphifyCalls.length;
    const v1 = provider.verify(context);
    expect(v1.next_actions.join('\n')).not.toContain('图基线落后当前 HEAD');

    // HEAD moves → head-moved advisory appears; still no rebuild command issued by verify.
    commit('c2');
    const v2 = provider.verify(context);
    expect(v2.next_actions.join('\n')).toContain('图基线落后当前 HEAD');
    expect(fixture.graphifyCalls.filter((c) => c.args[0] === 'update' || c.args[0] === 'extract').length)
      .toBe(fixture.graphifyCalls.slice(0, graphifyCallsBefore).filter((c) => c.args[0] === 'update' || c.args[0] === 'extract').length);
  });

  test('does not claim fresh when ordinary setup only probes an existing Graphify artifact', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('existing-artifact');
    const outsideHooks = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-existing-user-hooks-'));
    fs.mkdirSync(path.join(fixture.target, 'graphify-out'), { recursive: true });
    fs.writeFileSync(
      path.join(fixture.target, 'graphify-out', 'graph.json'),
      JSON.stringify({ nodes: [{ id: 'existing' }], links: [] }),
    );
    const configured = spawnSync(
      'git',
      ['-C', fixture.target, 'config', '--local', 'core.hooksPath', outsideHooks],
      { encoding: 'utf8' },
    );
    if (configured.status !== 0) throw new Error(configured.stderr || configured.stdout);

    const actionPlan = provider.plan(fixture.context);
    expect(actionPlan.actions.some((action) => ['first-generation', 'refresh'].includes(action.kind))).toBe(false);

    const result = provider.apply(fixture.context, actionPlan);
    expect(fixture.hookCalls).toEqual([]);
    expect(result).toMatchObject({
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
  });

  test('refreshes an existing Graphify graph in place without spec-first staging or backup artifacts', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('incremental-refresh');
    const outsideHooks = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-refresh-user-hooks-'));
    fs.mkdirSync(path.join(fixture.target, 'graphify-out'), { recursive: true });
    fs.writeFileSync(
      path.join(fixture.target, 'graphify-out', 'graph.json'),
      JSON.stringify({ nodes: [{ id: 'existing' }], links: [] }),
    );
    const configured = spawnSync(
      'git',
      ['-C', fixture.target, 'config', '--local', 'core.hooksPath', outsideHooks],
      { encoding: 'utf8' },
    );
    if (configured.status !== 0) throw new Error(configured.stderr || configured.stdout);

    const refreshContext = { ...fixture.context, refresh: true };
    const actionPlan = provider.plan(refreshContext);
    expect(actionPlan.actions.find((action) => action.kind === 'refresh')).toMatchObject({
      args: ['update', '.'],
    });
    expect(actionPlan.actions.find((action) => action.kind === 'refresh')).not.toHaveProperty('clean_rebuild');

    const result = provider.refresh(refreshContext, actionPlan);
    expect(result).toMatchObject({
      readiness_status: 'fresh',
      lifecycle: { artifact_exists: true, query_verified: true },
      steady_state: {
        refresh_mode: 'manual-only',
        hook_status: 'blocked',
        hook_skipped_reason: 'graphify-hook-path-outside-project',
      },
    });
    expect(fixture.graphifyCalls.filter((call) => call.args[0] === 'update')).toEqual([
      expect.objectContaining({ args: ['update', '.'], env: expect.not.objectContaining({ GRAPHIFY_OUT: expect.anything() }) }),
    ]);
    expect(JSON.parse(fs.readFileSync(path.join(fixture.target, 'graphify-out', 'graph.json'), 'utf8')))
      .toMatchObject({ nodes: [{ id: 'fixture-refreshed' }] });
    expect(fs.readdirSync(fixture.target).filter((name) => name.startsWith('.graphify.backup-'))).toEqual([]);
    expect(fs.readdirSync(fixture.target).filter((name) => name.startsWith('.graphify.staging-'))).toEqual([]);
    expect(fs.existsSync(path.join(fixture.target, '.graphify-migration-journal.json'))).toBe(false);
  });

  test('migrates the retired .graphify artifact root to provider-native graphify-out without rebuilding', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('provider-native-artifact-migration');
    fs.mkdirSync(path.join(fixture.target, '.graphify'), { recursive: true });
    fs.writeFileSync(
      path.join(fixture.target, '.graphify', 'graph.json'),
      JSON.stringify({ nodes: [{ id: 'legacy-preserved' }], links: [] }),
    );

    const actionPlan = provider.plan(fixture.context);

    expect(actionPlan.artifact_root).toBe(path.join(fixture.target, 'graphify-out'));
    expect(actionPlan.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'migrate-artifact-root',
        from: '.graphify',
        to: 'graphify-out',
      }),
    ]));
    expect(actionPlan.actions.some((action) => action.kind === 'first-generation')).toBe(false);

    const result = provider.apply(fixture.context, actionPlan);

    expect(result).toMatchObject({
      lifecycle: { artifact_exists: true, query_verified: true },
      first_generation: {
        artifact_root: 'graphify-out',
        artifact_refs: ['graphify-out/graph.json'],
      },
    });
    expect(fs.existsSync(path.join(fixture.target, '.graphify'))).toBe(false);
    expect(JSON.parse(fs.readFileSync(path.join(fixture.target, 'graphify-out', 'graph.json'), 'utf8')))
      .toMatchObject({ nodes: [{ id: 'legacy-preserved' }] });
  });

  test('fails closed when both artifact roots exist even if the current root is empty', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('artifact-root-conflict');
    fs.mkdirSync(path.join(fixture.target, 'graphify-out'), { recursive: true });
    fs.mkdirSync(path.join(fixture.target, '.graphify'), { recursive: true });
    fs.writeFileSync(
      path.join(fixture.target, '.graphify', 'graph.json'),
      JSON.stringify({ nodes: [{ id: 'legacy' }], links: [] }),
    );

    expect(provider.plan(fixture.context)).toMatchObject({
      blocked: true,
      reason_code: 'graphify-artifact-root-conflict',
      actions: [],
    });
    expect(provider.verify(fixture.context)).toMatchObject({
      readiness_status: 'degraded',
      limitations: expect.arrayContaining([expect.stringContaining('graphify-artifact-root-conflict')]),
      next_actions: expect.arrayContaining([expect.stringContaining('同时存在 .graphify/ 与 graphify-out/')]),
    });
  });

  test('migrates an empty legacy root before first generation so no second root is left behind', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('empty-legacy-artifact-root');
    fs.mkdirSync(path.join(fixture.target, '.graphify'), { recursive: true });

    const actionPlan = provider.plan(fixture.context);
    expect(actionPlan.actions.map((action) => action.kind)).toEqual(expect.arrayContaining([
      'migrate-artifact-root',
      'first-generation',
    ]));

    const result = provider.apply(fixture.context, actionPlan);
    expect(result).toMatchObject({
      readiness_status: 'fresh',
      lifecycle: { artifact_exists: true, query_verified: true },
    });
    expect(fs.existsSync(path.join(fixture.target, '.graphify'))).toBe(false);
    expect(fs.existsSync(path.join(fixture.target, 'graphify-out', 'graph.json'))).toBe(true);
  });

  test('rejects a legacy artifact root that is not a real directory', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('unsafe-legacy-artifact-root');
    fs.writeFileSync(path.join(fixture.target, '.graphify'), 'not-a-directory\n');

    expect(provider.plan(fixture.context)).toMatchObject({
      blocked: true,
      reason_code: 'graphify-artifact-migration-path-unsafe',
    });
    expect(provider.verify(fixture.context)).toMatchObject({
      readiness_status: 'degraded',
      limitations: expect.arrayContaining([expect.stringContaining('graphify-artifact-migration-path-unsafe')]),
    });
  });

  test('preserves the Graphify shrink guard instead of retrying refresh with force', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('incremental-refresh-shrink-guard');
    fs.mkdirSync(path.join(fixture.target, 'graphify-out'), { recursive: true });
    fs.writeFileSync(
      path.join(fixture.target, 'graphify-out', 'graph.json'),
      JSON.stringify({ nodes: [{ id: 'existing' }], links: [] }),
    );
    const baseRunner = fixture.context.runner;
    const updateCalls = [];
    const refreshContext = {
      ...fixture.context,
      refresh: true,
      runner(command, args, options) {
        if (command === fixture.launcher && args[0] === 'update') {
          updateCalls.push({ args: [...args], env: { ...((options && options.env) || {}) } });
          return failure('Refusing to overwrite. Pass --force to override.');
        }
        return baseRunner(command, args, options);
      },
    };
    const actionPlan = provider.plan(refreshContext);

    const result = provider.refresh(refreshContext, actionPlan);

    expect(updateCalls).toEqual([
      expect.objectContaining({
        args: ['update', '.'],
        env: expect.not.objectContaining({ GRAPHIFY_OUT: expect.anything() }),
      }),
    ]);
    expect(result).toMatchObject({
      readiness_status: 'degraded',
      limitations: expect.arrayContaining([expect.stringContaining('graphify-refresh-failed')]),
    });
  });

  test('keeps the project artifact root when refreshing a nested requirement workspace', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('nested-workspace-refresh');
    fs.mkdirSync(path.join(fixture.target, 'packages', 'api'), { recursive: true });
    fs.mkdirSync(path.join(fixture.target, 'graphify-out'), { recursive: true });
    fs.writeFileSync(
      path.join(fixture.target, 'graphify-out', 'graph.json'),
      JSON.stringify({ nodes: [{ id: 'existing' }], links: [] }),
    );

    const refreshContext = {
      ...fixture.context,
      refresh: true,
      requirementWorkspace: path.join('packages', 'api'),
    };
    const actionPlan = provider.plan(refreshContext);
    expect(actionPlan.actions.find((action) => action.kind === 'refresh')).toMatchObject({
      args: ['update', 'packages/api'],
      graphify_out: path.join('..', '..', 'graphify-out'),
    });
    expect(actionPlan.artifact_root).toBe(path.join(fixture.target, 'graphify-out'));

    const result = provider.refresh(refreshContext, actionPlan);

    expect(fixture.graphifyCalls.find((call) => call.args[0] === 'update')).toMatchObject({
      args: ['update', 'packages/api'],
      env: expect.objectContaining({ GRAPHIFY_OUT: path.join('..', '..', 'graphify-out') }),
    });
    expect(result).toMatchObject({
      readiness_status: 'fresh',
      lifecycle: { artifact_exists: true, query_verified: true },
    });
  });

  test('pins Graphify hook commands to a contained custom hooks root and verifies that root', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('contained-hooks');
    const customHooks = path.join(fixture.target, '.project-hooks');
    const configured = spawnSync('git', ['-C', fixture.target, 'config', '--local', 'core.hooksPath', '.project-hooks'], { encoding: 'utf8' });
    if (configured.status !== 0) throw new Error(configured.stderr || configured.stdout);

    const actionPlan = provider.plan(fixture.context);
    expect(actionPlan).toMatchObject({
      hook_target: {
        classification: 'project-contained',
        reason_code: null,
        root_relative: '.project-hooks',
        hook_names: ['post-commit', 'post-checkout'],
      },
      actions: expect.arrayContaining([
        expect.objectContaining({
          kind: 'ensure-hook',
          hook_root: '.project-hooks',
          hook_names: ['post-commit', 'post-checkout'],
        }),
      ]),
    });

    const result = provider.apply(fixture.context, actionPlan);
    expect(fixture.hookCalls.length).toBeGreaterThan(0);
    for (const call of fixture.hookCalls) {
      expect(call.env).toMatchObject({
        GIT_CONFIG_COUNT: '1',
        GIT_CONFIG_KEY_0: 'core.hooksPath',
        GIT_CONFIG_VALUE_0: customHooks,
      });
      expect(call.env).not.toHaveProperty('GIT_CONFIG_KEY_1');
      expect(call.env).not.toHaveProperty('GIT_CONFIG_VALUE_1');
      expect(Object.values(call.env)).not.toContain('inherited-secret-helper');
      expect(Object.values(call.env)).not.toContain('/inherited/outside/hooks');
    }
    expect(fs.existsSync(path.join(customHooks, 'post-commit'))).toBe(true);
    expect(fs.existsSync(path.join(fixture.target, '.git', 'hooks', 'post-commit'))).toBe(false);
    expect(result).toMatchObject({
      readiness_status: 'fresh',
      steady_state: {
        refresh_mode: 'skill-cli-hook-on-demand',
        hook_installed: true,
        hook_verified: true,
        hook_status: 'verified',
        hook_skipped_reason: null,
      },
    });
    expect(validateAgainstSchema(providerSchema, result)).toEqual({ valid: true, errors: [] });
  });

  test('re-resolves a stale plan before hook mutation and blocks a newly external target', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('plan-apply-drift');
    const outsideHooks = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-plan-drift-outside-'));
    spawnSync('git', ['-C', fixture.target, 'config', '--local', 'core.hooksPath', '.project-hooks']);
    const actionPlan = provider.plan(fixture.context);
    expect(actionPlan.hook_target.classification).toBe('project-contained');
    spawnSync('git', ['-C', fixture.target, 'config', '--local', 'core.hooksPath', outsideHooks]);

    const result = provider.apply(fixture.context, actionPlan);
    expect(fixture.hookCalls).toEqual([]);
    expect(result).toMatchObject({
      readiness_status: 'fresh',
      steady_state: {
        refresh_mode: 'manual-only',
        hook_status: 'blocked',
        hook_skipped_reason: 'graphify-hook-path-outside-project',
      },
    });
  });

  test('stops normalization and verified claims when the effective target changes after a hook command', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('postflight-drift');
    const outsideHooks = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-postflight-outside-'));
    const customHooks = path.join(fixture.target, '.project-hooks');
    spawnSync('git', ['-C', fixture.target, 'config', '--local', 'core.hooksPath', '.project-hooks']);
    fixture.setHookCommandCallback((call) => {
      if (call.args[1] === 'install') {
        spawnSync('git', ['-C', fixture.target, 'config', '--local', 'core.hooksPath', outsideHooks]);
      }
    });

    const result = provider.apply(fixture.context, provider.plan(fixture.context));
    expect(fixture.hookCalls.map((call) => call.args.join(' '))).toEqual(['hook status', 'hook install']);
    expect(fs.readFileSync(path.join(customHooks, 'post-commit'), 'utf8')).not.toContain('# spec-first graphify artifact env start');
    expect(result).toMatchObject({
      readiness_status: 'fresh',
      steady_state: {
        refresh_mode: 'manual-only',
        hook_verified: false,
        hook_status: 'blocked',
        hook_skipped_reason: 'graphify-hook-target-changed',
      },
    });
  });

  test('blocks a contained hooks root that escapes through a symlink without reading the external target', () => {
    if (process.platform === 'win32') return;
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const fixture = createGraphifyApplyFixture('hook-symlink');
    const outsideHooks = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-symlink-outside-'));
    fs.writeFileSync(path.join(outsideHooks, 'sentinel'), 'preserve\n');
    fs.symlinkSync(outsideHooks, path.join(fixture.target, '.project-hooks'));
    spawnSync('git', ['-C', fixture.target, 'config', '--local', 'core.hooksPath', '.project-hooks']);

    const actionPlan = provider.plan(fixture.context);
    expect(actionPlan.hook_target).toEqual({
      classification: 'unsafe',
      reason_code: 'graphify-hook-symlink-escape',
    });
    expect(JSON.stringify(actionPlan)).not.toContain(outsideHooks);
    const result = provider.apply(fixture.context, actionPlan);
    expect(fixture.hookCalls).toEqual([]);
    expect(fs.readFileSync(path.join(outsideHooks, 'sentinel'), 'utf8')).toBe('preserve\n');
    expect(result).toMatchObject({
      readiness_status: 'fresh',
      steady_state: {
        refresh_mode: 'manual-only',
        hook_status: 'blocked',
        hook_skipped_reason: 'graphify-hook-symlink-escape',
      },
    });
  });

  test('resolves a pinned Python Graphify launcher through uv and excludes credentials', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-python-uv');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-home-'));
    const binDir = path.join(homeDir, '.local', 'bin');
    const launcher = path.join(binDir, 'graphify');
    const interpreter = path.join(homeDir, 'uv-tools', 'graphifyy', 'bin', 'python');
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(launcher, `#!${interpreter}\n`);
    fs.chmodSync(launcher, 0o755);
    const observedEnvironments = [];
    const runner = (command, args, options = {}) => {
      observedEnvironments.push(options.env || {});
      if (command === 'python3' && args[0] === '-c') return success('3.12.4');
      if (command === 'uv' && args[0] === '--version') return success('uv 0.8.0');
      if (command === 'uv' && args.join(' ') === 'tool dir --bin') return success(binDir);
      if (command === interpreter && args[0] === '-c') return success(JSON.stringify({ version: '0.9.12', packages: [['graphifyy', '0.9.12']] }));
      if (command === launcher && args[0] === '--version') return success('graphify 0.9.12');
      return failure('missing');
    };
    const dependency = {
      ecosystem: 'pypi',
      package: 'graphifyy',
      version: '0.9.12',
      command: 'graphify',
    };

    const result = provider.resolvePythonGraphifyCommand({
      repoRoot: target,
      homeDir,
      dependency,
      env: {
        HOME: homeDir,
        PATH: binDir,
        OPENAI_API_KEY: 'secret-openai',
        HTTPS_PROXY: 'https://user:pass@example.test',
      },
      runner,
    }, target, dependency);

    expect(result).toMatchObject({
      ok: true,
      command: launcher,
      interpreter,
      installer: 'uv',
      package_identity: { package: 'graphifyy', version: '0.9.12' },
    });
    expect(observedEnvironments.every((env) => !('OPENAI_API_KEY' in env) && !('HTTPS_PROXY' in env))).toBe(true);
  });

  test('uses pipx only when uv is unavailable and creates a hashed direct-wheel install plan', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-python-pipx');
    const dependency = {
      ecosystem: 'pypi',
      package: 'graphifyy',
      version: '0.9.12',
      command: 'graphify',
      distribution: {
        wheel_url: 'https://files.pythonhosted.org/packages/76/0c/5c52d9e5b535d22c529417e219e23ad2c04532d4d9ca239abc21518f111a/graphifyy-0.9.12-py3-none-any.whl',
        sha256: '94f9d0d7ef68455a2055c7623fb9574c7a781afb1473d26c7936d1abfc14d62c',
        index_url: 'https://pypi.org/simple',
      },
    };
    const runner = (command, args) => {
      if (command === 'python3') return success('3.11.9');
      if (command === 'uv') return failure('missing');
      if (command === 'pipx' && args[0] === '--version') return success('1.7.1');
      if (command === 'pipx' && args[0] === 'environment') return success('/tmp/empty-bin');
      return failure('missing');
    };

    const result = provider.plan({
      selected: true,
      probeDependency: true,
      repoRoot: target,
      host: 'qoder',
      dependency,
      runner,
    });

    expect(result.blocked).toBe(false);
    expect(result.actions[0]).toMatchObject({
      kind: 'install-dependency',
      command: 'pipx',
      installer: 'pipx',
    });
    expect(result.actions[0].args.join(' ')).toContain('#sha256=94f9d0d7ef68455a2055c7623fb9574c7a781afb1473d26c7936d1abfc14d62c');
    expect(result.actions[0].args).toContain('https://pypi.org/simple');
  });

  test('uses the uv tool environment interpreter to verify a Windows exe launcher', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-python-windows-uv');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-windows-home-'));
    const binDir = path.join(homeDir, 'bin with spaces');
    const toolRoot = path.join(homeDir, 'uv tools');
    const launcher = path.join(binDir, 'graphify.exe');
    const interpreter = path.join(toolRoot, 'graphifyy', 'Scripts', 'python.exe');
    fs.mkdirSync(path.dirname(interpreter), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(launcher, 'fixture');
    fs.writeFileSync(interpreter, 'fixture');
    const dependency = { ecosystem: 'pypi', package: 'graphifyy', version: '0.9.12', command: 'graphify' };
    const runner = (command, args) => {
      if (command === 'python3') return success('3.12.4');
      if (command === 'uv' && args[0] === '--version') return success('uv 0.8.0');
      if (command === 'uv' && args.join(' ') === 'tool dir --bin') return success(binDir);
      if (command === 'uv' && args.join(' ') === 'tool dir') return success(toolRoot);
      if (command === interpreter && args[0] === '-c') return success(JSON.stringify({ version: '0.9.12', packages: [['graphifyy', '0.9.12']] }));
      if (command === launcher && args[0] === '--version') return success('graphify 0.9.12');
      return failure('missing');
    };

    expect(provider.resolvePythonGraphifyCommand({
      repoRoot: target,
      homeDir,
      platform: 'windows',
      dependency,
      env: { HOME: homeDir, PATH: binDir, PATHEXT: '.EXE;.CMD' },
      runner,
    }, target, dependency)).toMatchObject({ ok: true, command: launcher, interpreter, installer: 'uv' });
  });

  test('keeps verify degraded when Python host integration is missing or a supported corpus has zero nodes', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-python-verify-gates');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-verify-home-'));
    const binDir = path.join(homeDir, '.local', 'bin');
    const toolRoot = path.join(homeDir, 'uv-tools');
    const launcher = path.join(binDir, 'graphify');
    const interpreter = path.join(toolRoot, 'graphifyy', 'bin', 'python');
    fs.mkdirSync(binDir, { recursive: true });
    fs.mkdirSync(path.dirname(interpreter), { recursive: true });
    fs.writeFileSync(launcher, `#!${interpreter}\n`);
    fs.chmodSync(launcher, 0o755);
    fs.writeFileSync(interpreter, 'fixture');
    fs.mkdirSync(path.join(target, 'graphify-out'), { recursive: true });
    fs.writeFileSync(path.join(target, 'graphify-out', 'graph.json'), JSON.stringify({ nodes: [], links: [] }));
    fs.writeFileSync(path.join(target, 'main.py'), 'print("supported")\n');
    const dependency = { ecosystem: 'pypi', package: 'graphifyy', version: '0.9.12', command: 'graphify' };
    const runner = (command, args) => {
      if (command === 'python3') return success('3.12.4');
      if (command === 'uv' && args[0] === '--version') return success('uv 0.8.0');
      if (command === 'uv' && args.join(' ') === 'tool dir --bin') return success(binDir);
      if (command === 'uv' && args.join(' ') === 'tool dir') return success(toolRoot);
      if (command === interpreter && args[0] === '-c') return success(JSON.stringify({ version: '0.9.12', packages: [['graphifyy', '0.9.12']] }));
      if (command === launcher && args[0] === '--version') return success('graphify 0.9.12');
      if (command === launcher && args[0] === 'query') return success('query ok');
      return failure('missing');
    };

    const result = provider.verify({ repoRoot: target, homeDir, host: 'codex', dependency, env: { HOME: homeDir, PATH: binDir }, runner });
    expect(result.readiness_status).toBe('degraded');
    expect(result.lifecycle).toMatchObject({ configured: false, initialized: false, indexed: false, query_verified: false });
  });

  test('blocks Python Graphify setup when no isolated tool manager exists', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-python-no-manager');
    const dependency = {
      ecosystem: 'pypi',
      package: 'graphifyy',
      version: '0.9.12',
      command: 'graphify',
      distribution: {
        wheel_url: 'https://files.pythonhosted.org/packages/76/0c/5c52d9e5b535d22c529417e219e23ad2c04532d4d9ca239abc21518f111a/graphifyy-0.9.12-py3-none-any.whl',
        sha256: '94f9d0d7ef68455a2055c7623fb9574c7a781afb1473d26c7936d1abfc14d62c',
        index_url: 'https://pypi.org/simple',
      },
    };
    const runner = (command) => command === 'python3' ? success('3.12.1') : failure('missing');

    expect(provider.plan({ selected: true, probeDependency: true, repoRoot: target, dependency, runner })).toMatchObject({
      blocked: true,
      mutation: false,
      reason_code: 'graphify-tool-manager-missing',
    });
  });

  test('normalizes only Python Provider marker blocks and verifies interpreter plus artifact contract', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-python-hooks');
    const launcher = path.join(target, 'tools with spaces', 'graphify');
    const interpreter = path.join(target, 'tools', 'graphifyy', 'bin', 'python');
    fs.mkdirSync(path.dirname(launcher), { recursive: true });
    fs.mkdirSync(path.dirname(interpreter), { recursive: true });
    fs.writeFileSync(launcher, `#!${interpreter}\n`);
    fs.chmodSync(launcher, 0o755);
    materializePythonGraphifyHooks(target, interpreter, 'echo user-release-command');

    expect(provider.normalizePythonGraphifyHooks(target, {
      graphifyCommand: launcher,
      graphifyInterpreter: interpreter,
    })).toMatchObject({ changed: true });
    expect(provider.verifyPythonGraphifyHooks(target, {
      graphifyCommand: launcher,
      graphifyInterpreter: interpreter,
    })).toEqual({ ok: true, reason_code: null });

    const postCommit = fs.readFileSync(path.join(target, '.git', 'hooks', 'post-commit'), 'utf8');
    const postCheckout = fs.readFileSync(path.join(target, '.git', 'hooks', 'post-checkout'), 'utf8');
    expect(postCommit).toContain('echo user-release-command');
    expect(postCommit).not.toContain('export GRAPHIFY_OUT=');
    expect(postCommit).toContain('# spec-first graphify credential isolation start');
    expect(postCommit).toContain('*) unset');
    expect(postCheckout).not.toContain('export GRAPHIFY_OUT=');
    expect(postCommit).toContain('graphify-out/');
    expect(postCheckout).toContain('graphify-out');
    expect(provider.normalizePythonGraphifyHooks(target, {
      graphifyCommand: launcher,
      graphifyInterpreter: interpreter,
    })).toMatchObject({ changed: false });
  });

  (process.platform === 'win32' ? test.skip : test)('executes only the normalized Provider marker and waits for a detached credential-isolated rebuild receipt', async () => {
    const { spawnSync } = require('node:child_process');
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-python-detached-hook');
    const launcher = path.join(target, 'tools with spaces', 'graphify');
    const interpreter = path.join(target, 'tools', 'python');
    const outsideMarker = path.join(target, 'user-command-ran');
    const receipt = path.join(target, 'graphify-out', 'hook-receipt');
    fs.mkdirSync(path.dirname(launcher), { recursive: true });
    fs.mkdirSync(path.dirname(interpreter), { recursive: true });
    fs.mkdirSync(path.dirname(receipt), { recursive: true });
    fs.writeFileSync(launcher, `#!${interpreter}\n`);
    fs.writeFileSync(interpreter, 'fixture');
    fs.chmodSync(launcher, 0o755);
    const hooksRoot = path.join(target, '.git', 'hooks');
    fs.mkdirSync(hooksRoot, { recursive: true });
    for (const [name, markers] of Object.entries({
      'post-commit': ['# graphify-hook-start', '# graphify-hook-end'],
      'post-checkout': ['# graphify-checkout-hook-start', '# graphify-checkout-hook-end'],
    })) {
      fs.writeFileSync(path.join(hooksRoot, name), [
        '#!/bin/sh',
        'set -x',
        `touch '${outsideMarker}'`,
        markers[0],
        '# Installed by: graphify hook install',
        `_PINNED='${interpreter}'`,
        '# from graphify.watch import _rebuild_code',
        `( if [ -z \"$OPENAI_API_KEY$ANTHROPIC_API_KEY$AWS_ACCESS_KEY_ID$HTTPS_PROXY$GOOGLE_APPLICATION_CREDENTIALS$GITHUB_PAT$DOCKER_CONFIG\" ]; then sleep 0.1; printf rebuilt > '${receipt}'; else printf leaked > '${receipt}'; fi ) &`,
        markers[1],
        '',
      ].join('\n'));
      fs.chmodSync(path.join(hooksRoot, name), 0o755);
    }
    provider.normalizePythonGraphifyHooks(target, { graphifyCommand: launcher, graphifyInterpreter: interpreter });
    const contents = fs.readFileSync(path.join(hooksRoot, 'post-commit'), 'utf8');
    const block = contents.slice(contents.indexOf('# graphify-hook-start'), contents.indexOf('# graphify-hook-end') + '# graphify-hook-end'.length);
    const smoke = path.join(target, 'provider-marker-smoke.sh');
    fs.writeFileSync(smoke, `#!/bin/sh\nset -x\n${block}\n`);
    fs.chmodSync(smoke, 0o755);
    const launched = spawnSync('/bin/sh', [smoke], {
      cwd: target,
      env: {
        ...process.env,
        OPENAI_API_KEY: 'sentinel',
        ANTHROPIC_API_KEY: 'sentinel',
        AWS_ACCESS_KEY_ID: 'sentinel',
        HTTPS_PROXY: 'https://user:pass@example.test',
        GOOGLE_APPLICATION_CREDENTIALS: '/tmp/sentinel.json',
        GITHUB_PAT: 'sentinel',
        DOCKER_CONFIG: '/tmp/sentinel-docker',
      },
      encoding: 'utf8',
      timeout: 5000,
    });
    expect(launched.status).toBe(0);
    expect(launched.stderr).not.toContain('sentinel');
    expect(launched.stderr).not.toContain('user:pass');
    const deadline = Date.now() + 3000;
    while (!fs.existsSync(receipt) && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    expect(fs.readFileSync(receipt, 'utf8')).toBe('rebuilt');
    expect(fs.existsSync(outsideMarker)).toBe(false);
  });

  test('normalizes Python Codex host surfaces to the selected launcher and current artifact root', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-python-codex-host');
    const launcher = path.join(target, 'tools', 'graphify');
    fs.mkdirSync(path.join(target, '.codex', 'skills', 'graphify'), { recursive: true });
    fs.writeFileSync(path.join(target, '.codex', 'skills', 'graphify', 'SKILL.md'), 'Read .graphify/graph.json\n');
    fs.writeFileSync(path.join(target, 'AGENTS.md'), 'Team rules\n\n## graphify\nUse .graphify/\n\n## Other\nKeep me\n');
    fs.writeFileSync(path.join(target, '.codex', 'hooks.json'), JSON.stringify({
      hooks: { PreToolUse: [{ hooks: [{ type: 'command', command: '/wrong/graphify hook-check' }] }] },
      note: '/user/graphify hook-check',
    }));

    provider.normalizePythonHostIntegration(target, 'codex', { graphifyCommand: launcher });

    expect(fs.readFileSync(path.join(target, '.codex', 'skills', 'graphify', 'SKILL.md'), 'utf8')).toContain('graphify-out/graph.json');
    expect(fs.readFileSync(path.join(target, 'AGENTS.md'), 'utf8')).toContain('## Other\nKeep me');
    expect(JSON.parse(fs.readFileSync(path.join(target, '.codex', 'hooks.json'), 'utf8'))
      .hooks.PreToolUse[0].hooks[0].command).toBe(`'${launcher}' hook-check`);
    expect(JSON.parse(fs.readFileSync(path.join(target, '.codex', 'hooks.json'), 'utf8')).note).toBe('/user/graphify hook-check');
    expect(provider.pythonHostIntegrationConfigured(target, 'codex', { graphifyCommand: launcher })).toMatchObject({
      ok: true,
      mode: 'provider-native',
    });
    const stale = JSON.parse(fs.readFileSync(path.join(target, '.codex', 'hooks.json'), 'utf8'));
    stale.hooks.PreToolUse[0].hooks[0].command = "'/stale/graphify' hook-check";
    stale.note = `'${launcher}' hook-check`;
    fs.writeFileSync(path.join(target, '.codex', 'hooks.json'), JSON.stringify(stale));
    expect(provider.pythonHostIntegrationConfigured(target, 'codex', { graphifyCommand: launcher })).toMatchObject({
      ok: false,
      reason_code: 'graphify-host-launcher-mismatch',
    });
    stale.hooks = { Bogus: [{ hooks: [{ type: 'command', command: `'${launcher}' hook-check` }] }] };
    fs.writeFileSync(path.join(target, '.codex', 'hooks.json'), JSON.stringify(stale));
    expect(provider.pythonHostIntegrationConfigured(target, 'codex', { graphifyCommand: launcher })).toMatchObject({
      ok: false,
      reason_code: 'graphify-host-launcher-mismatch',
    });
  });

  test('accepts graphifyy 0.9.12 Claude dual hook-guard entries and rewrites only the launcher', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-python-claude-hook-guard');
    const launcher = path.join(target, 'tools', 'graphify');
    fs.mkdirSync(path.join(target, '.claude', 'skills', 'graphify'), { recursive: true });
    fs.writeFileSync(path.join(target, '.claude', 'skills', 'graphify', 'SKILL.md'), 'Read .graphify/graph.json\n');
    fs.writeFileSync(path.join(target, '.claude', 'CLAUDE.md'), 'Use .graphify/\n');
    fs.writeFileSync(path.join(target, 'CLAUDE.md'), '## graphify\nUse .graphify/\n');
    // Real graphifyy@0.9.12 shape observed in dogfood: two PreToolUse matchers, hook-guard search|read.
    fs.writeFileSync(path.join(target, '.claude', 'settings.json'), JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [{ type: 'command', command: '/wrong/bin/graphify hook-guard search' }],
          },
          {
            matcher: 'Read|Glob',
            hooks: [{ type: 'command', command: '/wrong/bin/graphify hook-guard read' }],
          },
        ],
      },
    }));

    provider.normalizePythonHostIntegration(target, 'claude', { graphifyCommand: launcher });

    const settings = JSON.parse(fs.readFileSync(path.join(target, '.claude', 'settings.json'), 'utf8'));
    const commands = settings.hooks.PreToolUse.flatMap((event) => event.hooks.map((h) => h.command));
    expect(commands).toEqual([
      `'${launcher}' hook-guard search`,
      `'${launcher}' hook-guard read`,
    ]);
    expect(provider.pythonHostIntegrationConfigured(target, 'claude', { graphifyCommand: launcher })).toMatchObject({
      ok: true,
      mode: 'provider-native',
    });

    // Stale launcher on only one of the two entries still fails.
    settings.hooks.PreToolUse[1].hooks[0].command = `'/stale/graphify' hook-guard read`;
    fs.writeFileSync(path.join(target, '.claude', 'settings.json'), JSON.stringify(settings));
    expect(provider.pythonHostIntegrationConfigured(target, 'claude', { graphifyCommand: launcher })).toMatchObject({
      ok: false,
      reason_code: 'graphify-host-launcher-mismatch',
    });
  });

  test('treats Cursor as rule-only and Qoder as a spec-first adapter', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const cursor = tempRepo('graphify-python-cursor-host');
    fs.mkdirSync(path.join(cursor, '.cursor', 'rules'), { recursive: true });
    fs.writeFileSync(path.join(cursor, '.cursor', 'rules', 'graphify.mdc'), 'Use graphify-out/graph.json\n');
    provider.normalizePythonHostIntegration(cursor, 'cursor', { graphifyCommand: '/tools/graphify' });
    expect(provider.pythonHostIntegrationConfigured(cursor, 'cursor', { graphifyCommand: '/tools/graphify' })).toMatchObject({ ok: true });
    expect(fs.existsSync(path.join(cursor, '.cursor', 'skills', 'graphify', 'SKILL.md'))).toBe(false);

    const qoder = tempRepo('graphify-python-qoder-host');
    fs.mkdirSync(path.join(qoder, '.qoder', 'rules'), { recursive: true });
    fs.writeFileSync(path.join(qoder, '.qoder', 'rules', 'spec-first.md'), 'Use graphify query against graphify-out/graph.json; fallback to source.\n');
    expect(provider.pythonHostIntegrationConfigured(qoder, 'qoder', { graphifyCommand: '/tools/graphify' })).toEqual({
      ok: true,
      mode: 'spec-first-adapter',
    });
  });

  test('fails Python hook readiness for duplicate markers or a stale interpreter', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-python-hook-invalid');
    const launcher = path.join(target, 'tools', 'graphify');
    const interpreter = path.join(target, 'tools', 'python');
    fs.mkdirSync(path.dirname(launcher), { recursive: true });
    fs.writeFileSync(launcher, `#!${interpreter}\n`);
    fs.chmodSync(launcher, 0o755);
    materializePythonGraphifyHooks(target, '/stale/python');

    expect(provider.verifyPythonGraphifyHooks(target, {
      graphifyCommand: launcher,
      graphifyInterpreter: interpreter,
    })).toMatchObject({ ok: false, reason_code: 'graphify-hook-credential-isolation-missing' });
    expect(() => provider.normalizePythonGraphifyHooks(target, {
      graphifyCommand: launcher,
      graphifyInterpreter: interpreter,
    })).toThrow(/verified interpreter/);

    materializePythonGraphifyHooks(target, interpreter);
    const postCommitPath = path.join(target, '.git', 'hooks', 'post-commit');
    fs.appendFileSync(postCommitPath, '# graphify-hook-start\n# graphify-hook-end\n');
    expect(provider.verifyPythonGraphifyHooks(target, {
      graphifyCommand: launcher,
      graphifyInterpreter: interpreter,
    })).toMatchObject({ ok: false, reason_code: 'graphify-hook-marker-ambiguous' });
  });

  test('recovers the current graph from a staged or backup journal before Provider mutation', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-python-recovery');
    const staged = path.join(target, '.graphify.staging-test');
    const backup = path.join(target, '.graphify.backup-test');
    fs.mkdirSync(staged, { recursive: true });
    fs.mkdirSync(backup, { recursive: true });
    fs.writeFileSync(path.join(staged, 'graph.json'), JSON.stringify({ nodes: [{ id: 'new' }], links: [] }));
    fs.writeFileSync(path.join(backup, 'graph.json'), JSON.stringify({ nodes: [{ id: 'old' }], links: [] }));
    fs.writeFileSync(path.join(target, '.graphify-migration-journal.json'), JSON.stringify({
      schema_version: 'graphify-migration-journal.v1',
      phase: 'backed-up',
      current: '.graphify',
      staged: '.graphify.staging-test',
      backup: '.graphify.backup-test',
    }));

    expect(provider.recoverGraphifyMigration(target)).toEqual({ ok: true, recovered: true });
    expect(JSON.parse(fs.readFileSync(path.join(target, '.graphify', 'graph.json'), 'utf8')).nodes[0].id).toBe('new');
    expect(fs.existsSync(path.join(target, '.graphify-migration-journal.json'))).toBe(false);
    expect(fs.existsSync(staged)).toBe(false);
  });

  test('rejects a forged migration journal before deleting repository source', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-python-forged-journal');
    fs.mkdirSync(path.join(target, '.graphify'), { recursive: true });
    fs.mkdirSync(path.join(target, 'src'), { recursive: true });
    fs.writeFileSync(path.join(target, '.graphify', 'graph.json'), JSON.stringify({ nodes: [{ id: 'safe' }], links: [] }));
    fs.writeFileSync(path.join(target, 'src', 'keep.js'), 'module.exports = true;\n');
    fs.writeFileSync(path.join(target, '.graphify-migration-journal.json'), JSON.stringify({
      schema_version: 'graphify-migration-journal.v1',
      phase: 'backed-up',
      current: '.graphify',
      staged: 'src',
      backup: '.graphify.backup-test',
    }));

    expect(provider.recoverGraphifyMigration(target)).toMatchObject({ ok: false, reason_code: 'graphify-migration-journal-path-unsafe' });
    expect(fs.existsSync(path.join(target, 'src', 'keep.js'))).toBe(true);
  });

  test('removes a verified npm incumbent and only its owned stale launcher symlink', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-npm-cleanup');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-cleanup-home-'));
    const prefix = path.join(target, 'npm-prefix');
    const npmRoot = path.join(prefix, 'lib', 'node_modules');
    const packageRoot = path.join(npmRoot, '@sentropic', 'graphify');
    const packageCli = path.join(packageRoot, 'dist', 'cli.js');
    const npmLauncher = path.join(prefix, 'bin', 'graphify');
    const staleLauncher = path.join(homeDir, '.local', 'bin', 'graphify');
    fs.mkdirSync(path.dirname(packageCli), { recursive: true });
    fs.mkdirSync(path.dirname(npmLauncher), { recursive: true });
    fs.mkdirSync(path.dirname(staleLauncher), { recursive: true });
    fs.writeFileSync(packageCli, '#!/usr/bin/env node\n');
    fs.symlinkSync(packageCli, npmLauncher);
    fs.symlinkSync(npmLauncher, staleLauncher);
    const runner = (command, args) => {
      if (command === 'npm' && args[0] === 'list') {
        return success(JSON.stringify({ dependencies: { '@sentropic/graphify': { version: '0.17.1' } } }));
      }
      if (command === 'npm' && args.join(' ') === 'root -g') return success(npmRoot);
      if (command === 'npm' && args[0] === 'uninstall') {
        fs.rmSync(npmLauncher, { force: true });
        fs.rmSync(packageRoot, { recursive: true, force: true });
        return success('removed');
      }
      return failure('unexpected');
    };

    expect(provider.cleanupNpmGraphifyIncumbent({
      repoRoot: target,
      homeDir,
      graphifyOriginalPathCommand: staleLauncher,
      env: { HOME: homeDir, PATH: path.dirname(staleLauncher) },
      runner,
    }, target)).toMatchObject({ ok: true, status: 'removed', version: '0.17.1' });
    expect(fs.existsSync(staleLauncher)).toBe(false);
    expect(fs.existsSync(packageRoot)).toBe(false);
  });

  test('rejects npm Graphify as a Provider dependency instead of offering a rollback path', () => {
    const provider = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-npm-provider-rejected');
    const dependency = { ecosystem: 'npm', package: '@sentropic/graphify', version: '0.17.1' };
    const runner = jest.fn();

    expect(provider.plan({ selected: true, repoRoot: target, dependency, runner })).toMatchObject({
      mutation: false,
      blocked: true,
      reason_code: 'graphify-python-provider-required',
    });
    expect(provider.verify({ repoRoot: target, dependency, runner })).toMatchObject({
      readiness_status: 'degraded',
      limitations: ['blocked: graphify-python-provider-required. Graphify setup 被阻止。'],
    });
    expect(runner).not.toHaveBeenCalled();
  });
});
