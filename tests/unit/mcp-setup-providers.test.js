'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateAgainstSchema } = require('../../src/contracts/schema-validator');

const repoRoot = path.resolve(__dirname, '..', '..');
const providerSchema = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs', 'contracts', 'provider-readiness.schema.json'), 'utf8'));

function tempRepo(label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-${label}-`));
  fs.mkdirSync(path.join(root, '.git'), { recursive: true });
  return root;
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

describe('spec-mcp-setup provider registry', () => {
  test('uses a static trusted provider map', () => {
    const providers = require('../../skills/spec-mcp-setup/scripts/providers/registry.cjs');
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
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/codegraph.cjs');
    const target = tempRepo('codegraph');
    const calls = [];
    let statusCount = 0;
    const runner = (command, args) => {
      calls.push([command, ...args]);
      if (args[0] === '--version') return success('codegraph 1.4.1');
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
      dependency: { package: '@colbymchenry/codegraph', version: '1.4.1' },
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
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/codegraph.cjs');
    const target = tempRepo(`codegraph-config-${expected}`);
    fs.mkdirSync(path.join(target, '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(target, '.codegraph', 'codegraph.db'), 'db');
    const runner = (_command, args) => {
      if (args[0] === '--version') return success('codegraph 1.4.1');
      if (args[0] === 'status') return success('index ready');
      if (args[0] === 'query') return success('{}');
      return success();
    };

    const result = provider.verify({
      repoRoot: target,
      runner,
      configured,
      dependency: { version: '1.4.1' },
    });

    expect(result.readiness_status).toBe(expected);
    expect(result.lifecycle.configured).toBe(configured === true);
  });

  test('replaces the unknown configuration action with the confirmed repair action', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/codegraph.cjs');
    const readiness = {
      readiness_status: 'unknown',
      lifecycle: {
        installed: true,
        configured: false,
        initialized: true,
        indexed: true,
        query_verified: true,
      },
      next_actions: ['通过当前 host 的 spec-mcp-setup --verify-only 确认 CodeGraph MCP 配置。'],
    };

    provider.reconcileConfigured(readiness, {
      configured_status: 'action-required',
      next_action: 'spec-mcp-setup --only codegraph --repair-host-config',
    });

    expect(readiness).toMatchObject({
      readiness_status: 'degraded',
      lifecycle: { configured: false },
      next_actions: ['spec-mcp-setup --only codegraph --repair-host-config'],
    });
  });

  test('reports an actionable setup command when an existing CodeGraph index is not ready', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/codegraph.cjs');
    const target = tempRepo('codegraph-index-not-ready');
    fs.mkdirSync(path.join(target, '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(target, '.codegraph', 'codegraph.db'), 'db');
    const runner = (_command, args) => {
      if (args[0] === '--version') return success('codegraph 1.4.1');
      if (args[0] === 'status') return success('pending changes; run codegraph sync');
      return success();
    };

    const result = provider.verify({
      repoRoot: target,
      runner,
      configured: true,
      dependency: { version: '1.4.1' },
    });

    expect(result.readiness_status).toBe('degraded');
    expect(result.next_actions).toContain(
      '运行 spec-mcp-setup --only codegraph，修复 CodeGraph index/query readiness。',
    );
  });

  test('degrades when the real CodeGraph query probe fails after indexing', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/codegraph.cjs');
    const target = tempRepo('codegraph-query-failure');
    fs.mkdirSync(path.join(target, '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(target, '.codegraph', 'codegraph.db'), 'db');
    const runner = (_command, args) => {
      if (args[0] === '--version') return success('codegraph 1.4.1');
      if (args[0] === 'status') return success('index ready');
      if (args[0] === 'query') return failure('query failed');
      return success();
    };
    const context = {
      selected: true,
      repoRoot: target,
      dependency: { package: '@colbymchenry/codegraph', version: '1.4.1' },
      runner,
    };

    const result = provider.apply(context, provider.plan(context));

    expect(result.readiness_status).toBe('degraded');
    expect(result.lifecycle.query_verified).toBe(false);
    expect(result.limitations).toContain('failed: codegraph-query-probe-failed. CodeGraph setup 失败。');
  });

  test('blocks a symlinked artifact root before running any mutation command', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/codegraph.cjs');
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
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/codegraph.cjs');
    const target = tempRepo(`codegraph-residual-${reasonCode}`);
    const runner = (command, args) => {
      if (args[0] === '--version') return success('codegraph 1.4.1');
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
      dependency: { package: '@colbymchenry/codegraph', version: '1.4.1' },
    });
    const result = provider.apply({ repoRoot: target, runner }, plan);
    expect(result.readiness_status).toBe('degraded');
    expect(result.limitations).toContain(`failed: ${reasonCode}. CodeGraph setup 失败。`);
    expect(result.lifecycle.indexed).toBe(false);
  });

  test('does not report signal-terminated CodeGraph probes as ready', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/codegraph.cjs');
    const target = tempRepo('codegraph-signal');
    fs.mkdirSync(path.join(target, '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(target, '.codegraph', 'codegraph.db'), 'db');
    const runner = (_command, args) => signalTermination(
      args[0] === '--version' ? 'codegraph 1.4.1' : 'index ready',
    );

    const result = provider.verify({
      repoRoot: target,
      dependency: { version: '1.4.1' },
      runner,
    });

    expect(result.readiness_status).toBe('not-run');
    expect(result.lifecycle).toMatchObject({ installed: false, indexed: false });
  });
});

describe('Graphify provider', () => {
  test('does not report signal-terminated Graphify probes as ready', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-signal');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-home-'));
    fs.mkdirSync(path.join(target, '.graphify'), { recursive: true });
    fs.writeFileSync(path.join(target, '.graphify', 'graph.json'), '{}');
    const runner = (_command, args) => signalTermination(
      args[0] === '--version' ? 'graphify 0.17.1' : 'ok',
    );

    const result = provider.verify({
      repoRoot: target,
      homeDir,
      dependency: { version: '0.17.1' },
      runner,
    });

    expect(result.readiness_status).toBe('not-run');
    expect(result.lifecycle).toMatchObject({ installed: false, query_verified: false });
  });

  test('backs up and repoints only a stale graphify symlink on the original PATH', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-path-symlink');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-home-'));
    const originalBin = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-path-'));
    const oldCommand = path.join(originalBin, 'graphify-old');
    const pathCommand = path.join(originalBin, 'graphify');
    const pinnedCommand = path.join(homeDir, '.local', 'bin', 'graphify');
    fs.mkdirSync(path.dirname(pinnedCommand), { recursive: true });
    fs.writeFileSync(oldCommand, '#!/bin/sh\n');
    fs.writeFileSync(pinnedCommand, '#!/bin/sh\n');
    fs.chmodSync(oldCommand, 0o755);
    fs.chmodSync(pinnedCommand, 0o755);
    fs.symlinkSync(oldCommand, pathCommand);
    fs.mkdirSync(path.join(target, '.graphify'), { recursive: true });
    fs.writeFileSync(path.join(target, '.graphify', 'graph.json'), '{}');

    const runner = (command, args) => {
      materializeGraphifyProjectSkill(target, args);
      if (args[0] === '--version') {
        return success(command === pinnedCommand ? 'graphify 0.17.1' : 'graphify 0.16.0');
      }
      return success('ok');
    };
    const context = {
      selected: true,
      repoRoot: target,
      host: 'codex',
      homeDir,
      env: {
        PATH: originalBin,
        SPEC_FIRST_PROVIDER_ORIGINAL_PATH: originalBin,
      },
      dependency: { package: '@sentropic/graphify', version: '0.17.1' },
      probeDependency: true,
      runner,
    };
    const result = provider.apply(context, provider.plan(context));

    expect(fs.readlinkSync(pathCommand)).toBe(pinnedCommand);
    expect(fs.lstatSync(`${pathCommand}.old`).isSymbolicLink()).toBe(true);
    expect(fs.readlinkSync(`${pathCommand}.old`)).toBe(oldCommand);
    expect(result.readiness_status).toBe('fresh');
  });

  test('keeps a stale ordinary graphify command report-only when a pinned fallback exists', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-path-file');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-home-'));
    const originalBin = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-path-'));
    const pathCommand = path.join(originalBin, 'graphify');
    const pinnedCommand = path.join(homeDir, '.local', 'bin', 'graphify');
    fs.mkdirSync(path.dirname(pinnedCommand), { recursive: true });
    fs.writeFileSync(pathCommand, '#!/bin/sh\n');
    fs.writeFileSync(pinnedCommand, '#!/bin/sh\n');
    fs.chmodSync(pathCommand, 0o755);
    fs.chmodSync(pinnedCommand, 0o755);
    fs.mkdirSync(path.join(target, '.graphify'), { recursive: true });
    fs.writeFileSync(path.join(target, '.graphify', 'graph.json'), '{}');

    const runner = (command, args) => {
      materializeGraphifyProjectSkill(target, args);
      if (args[0] === '--version') {
        return success(command === pinnedCommand ? 'graphify 0.17.1' : 'graphify 0.16.0');
      }
      return success('ok');
    };
    const context = {
      selected: true,
      repoRoot: target,
      host: 'codex',
      homeDir,
      env: {
        PATH: originalBin,
        SPEC_FIRST_PROVIDER_ORIGINAL_PATH: originalBin,
      },
      dependency: { package: '@sentropic/graphify', version: '0.17.1' },
      probeDependency: true,
      runner,
    };
    const result = provider.apply(context, provider.plan(context));

    expect(fs.lstatSync(pathCommand).isSymbolicLink()).toBe(false);
    expect(fs.existsSync(`${pathCommand}.old`)).toBe(false);
    expect(result.next_actions).toContain(
      `将 ${path.dirname(pinnedCommand)} 加入原始 PATH，或手动修复 ${pathCommand}。`,
    );
  });

  test('repairs the managed PATH block before each off-PATH Graphify hook verification', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-hook-path');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-home-'));
    const originalBin = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-empty-path-'));
    const pinnedCommand = path.join(homeDir, '.local', 'bin', 'graphify');
    const hook = path.join(target, '.git', 'hooks', 'post-commit');
    fs.mkdirSync(path.dirname(pinnedCommand), { recursive: true });
    fs.writeFileSync(pinnedCommand, '#!/bin/sh\n');
    fs.chmodSync(pinnedCommand, 0o755);
    fs.mkdirSync(path.dirname(hook), { recursive: true });
    fs.writeFileSync(hook, [
      '#!/bin/sh',
      '# spec-first graphify path repair start',
      "export PATH='/stale/graphify/bin':\"$PATH\"",
      '# spec-first graphify path repair end',
      '# Installed by: graphify hook install',
      'graphify update .',
      '',
    ].join('\n'));
    fs.chmodSync(hook, 0o755);
    fs.mkdirSync(path.join(target, '.graphify'), { recursive: true });
    fs.writeFileSync(path.join(target, '.graphify', 'graph.json'), '{}');
    const hookSnapshots = [];
    let hookStatusCount = 0;
    const runner = (command, args) => {
      materializeGraphifyProjectSkill(target, args);
      if (args[0] === '--version') {
        return command === pinnedCommand ? success('graphify 0.17.1') : failure('not found');
      }
      if (args[0] === 'hook' && args[1] === 'status') {
        hookSnapshots.push(fs.readFileSync(hook, 'utf8'));
        hookStatusCount += 1;
        return hookStatusCount === 1 ? failure('hook needs reinstall') : success('installed');
      }
      if (args[0] === 'hook' && args[1] === 'install') {
        fs.writeFileSync(hook, [
          '#!/bin/sh',
          '# Installed by: graphify hook install',
          'graphify update .',
          '',
        ].join('\n'));
        fs.chmodSync(hook, 0o755);
        return success('installed');
      }
      return success('ok');
    };
    const context = {
      selected: true,
      repoRoot: target,
      host: 'codex',
      homeDir,
      env: {
        PATH: originalBin,
        SPEC_FIRST_PROVIDER_ORIGINAL_PATH: originalBin,
      },
      dependency: { package: '@sentropic/graphify', version: '0.17.1' },
      probeDependency: true,
      runner,
    };
    const result = provider.apply(context, provider.plan(context));

    expect(hookSnapshots).toHaveLength(2);
    for (const snapshot of hookSnapshots) {
      expect(snapshot).toContain(`export PATH='${path.dirname(pinnedCommand)}':\"$PATH\"`);
      expect(snapshot.match(/# spec-first graphify path repair start/g)).toHaveLength(1);
    }
    expect(hookSnapshots[0]).not.toContain('/stale/graphify/bin');
    expect(result.steady_state).toMatchObject({ hook_status: 'verified', hook_verified: true });
  });

  test('does not regenerate an existing graph without explicit refresh', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-existing');
    fs.mkdirSync(path.join(target, '.graphify'), { recursive: true });
    fs.writeFileSync(path.join(target, '.graphify', 'graph.json'), '{}');
    fs.writeFileSync(path.join(target, 'AGENTS.md'), [
      '# Project',
      '',
      '## graphify',
      '',
      'stale provider instructions',
      '',
      '## Local rules',
      '',
      'keep this section',
      '',
    ].join('\n'));
    const calls = [];
    const runner = (command, args) => {
      calls.push([command, ...args]);
      materializeGraphifyProjectSkill(target, args);
      if (args[0] === 'hook' && args[1] === 'status') return success('installed');
      return success('ok');
    };
    const plan = provider.plan({ selected: true, repoRoot: target, host: 'codex', refresh: false });
    const result = provider.apply({ repoRoot: target, host: 'codex', runner }, plan);

    expect(result.readiness_status).toBe('fresh');
    expect(calls.some((call) => ['extract', 'update'].includes(call[1]))).toBe(false);
    expect(result.next_actions).toContain('运行 spec-mcp-setup --only graphify --refresh，执行显式 incremental refresh。');
    const instructions = fs.readFileSync(path.join(target, 'AGENTS.md'), 'utf8');
    expect(instructions).toContain('provider_untrusted');
    expect(instructions).toContain('## Local rules\n\nkeep this section');
    expect(instructions).not.toContain('stale provider instructions');
  });

  test('uses update --force only after an exact overwrite refusal and degrades on hook failure', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-refresh');
    fs.mkdirSync(path.join(target, '.graphify'), { recursive: true });
    fs.writeFileSync(path.join(target, '.graphify', 'graph.json'), '{}');
    const calls = [];
    let updateCount = 0;
    const runner = (command, args) => {
      calls.push([command, ...args]);
      materializeGraphifyProjectSkill(target, args);
      if (args[0] === 'update') {
        updateCount += 1;
        if (updateCount === 1) return failure('Refusing to overwrite existing graph; rerun with --force');
        return success('updated');
      }
      if (args[0] === 'hook') return failure('hook unavailable');
      return success('ok');
    };
    const plan = provider.plan({ selected: true, repoRoot: target, host: 'codex', refresh: true });
    const result = provider.refresh({ repoRoot: target, host: 'codex', runner }, plan);

    expect(calls.filter((call) => call.join(' ') === 'graphify update .')).toHaveLength(1);
    expect(calls.filter((call) => call.join(' ') === 'graphify update . --force')).toHaveLength(1);
    expect(result.readiness_status).toBe('degraded');
    expect(result.steady_state).toMatchObject({ hook_status: 'failed', hook_verified: false });
  });

  test('stops project mutation when the installed CLI does not match the registry pin', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-pin-mismatch');
    const calls = [];
    const runner = (command, args) => {
      calls.push([command, ...args]);
      if (command === 'npm' && args[0] === 'install') return success('installed');
      if (command === 'graphify' && args[0] === '--version') return success('graphify 0.16.0');
      return failure('unavailable');
    };
    const plan = provider.plan({
      selected: true,
      repoRoot: target,
      host: 'codex',
      dependency: { package: '@sentropic/graphify', version: '0.17.1' },
    });
    const result = provider.apply({ repoRoot: target, host: 'codex', runner }, plan);

    expect(result.readiness_status).toBe('degraded');
    expect(result.limitations).toContain('failed: graphify-version-pin-mismatch. Graphify setup 失败。');
    expect(calls.some((call) => call[1] === 'install' && call[2] === '--project')).toBe(false);
    expect(fs.existsSync(path.join(target, '.graphify'))).toBe(false);
  });

  test('falls back from first-generation extract to code-only update and blocks escaping workspaces', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-first-generation');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-outside-'));
    const calls = [];
    const runner = (command, args) => {
      calls.push([command, ...args]);
      materializeGraphifyProjectSkill(target, args);
      if (args[0] === 'extract') return failure('semantic extraction unavailable');
      if (args[0] === 'update') {
        fs.mkdirSync(path.join(target, '.graphify'), { recursive: true });
        fs.writeFileSync(path.join(target, '.graphify', 'graph.json'), '{}');
        return success('updated');
      }
      return success('ok');
    };

    expect(provider.plan({ selected: true, repoRoot: target, requirementWorkspace: outside })).toMatchObject({
      mutation: false,
      blocked: true,
      reason_code: 'requirement-workspace-absolute',
    });
    const plan = provider.plan({ selected: true, repoRoot: target, host: 'codex' });
    const result = provider.apply({ repoRoot: target, host: 'codex', runner }, plan);
    expect(calls.some((call) => call.join(' ') === 'graphify extract .')).toBe(true);
    expect(calls.some((call) => call.join(' ') === 'graphify update .')).toBe(true);
    expect(result.lifecycle.fallback_used).toBe(true);
  });

  test('records source-repo instruction protection as a non-action', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-source-repo');
    fs.mkdirSync(path.join(target, 'skills', 'spec-mcp-setup'), { recursive: true });
    fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({ name: 'spec-first' }));

    expect(provider.plan({ selected: true, repoRoot: target, host: 'codex' }).non_actions).toContain(
      '不得在 spec-first source repo 中 normalize 或重写 source-owned AGENTS.md/CLAUDE.md。',
    );
  });

  test('blocks symlinked provider surfaces and keeps nested first generation rooted in the repo', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const unsafe = tempRepo('graphify-symlink');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-symlink-outside-'));
    fs.symlinkSync(outside, path.join(unsafe, '.graphify'), process.platform === 'win32' ? 'junction' : 'dir');
    expect(provider.plan({ selected: true, repoRoot: unsafe, host: 'codex' })).toMatchObject({
      mutation: false,
      blocked: true,
      reason_code: 'graphify-artifact-symlink-escape',
    });

    const unsafeLeaf = tempRepo('graphify-leaf-symlink');
    const victim = path.join(outside, 'graphify-victim.json');
    fs.writeFileSync(victim, 'keep');
    fs.mkdirSync(path.join(unsafeLeaf, '.graphify'));
    fs.symlinkSync(victim, path.join(unsafeLeaf, '.graphify', 'graph.json'), process.platform === 'win32' ? 'file' : 'file');
    expect(provider.plan({ selected: true, repoRoot: unsafeLeaf, host: 'codex', refresh: true })).toMatchObject({
      mutation: false,
      blocked: true,
      reason_code: 'graphify-artifact-symlink-escape',
    });
    expect(fs.readFileSync(victim, 'utf8')).toBe('keep');

    const target = tempRepo('graphify-nested');
    const requirementWorkspace = path.join(target, 'requirements', 'mobile');
    fs.mkdirSync(requirementWorkspace, { recursive: true });
    const calls = [];
    const runner = (command, args) => {
      calls.push([command, ...args]);
      materializeGraphifyProjectSkill(target, args);
      if (args[0] === 'extract') {
        fs.mkdirSync(path.join(target, '.graphify'), { recursive: true });
        fs.writeFileSync(path.join(target, '.graphify', 'graph.json'), '{}');
      }
      return success('ok');
    };
    const plan = provider.plan({
      selected: true,
      repoRoot: target,
      host: 'codex',
      requirementWorkspace: 'requirements/mobile',
    });
    expect(plan.actions).toContainEqual(expect.objectContaining({
      kind: 'first-generation',
      args: ['extract', requirementWorkspace, '--out', target],
      allow_code_only_fallback: false,
    }));
    const result = provider.apply({ repoRoot: target, host: 'codex', runner }, plan);
    expect(result.readiness_status).toBe('fresh');
    expect(calls.some((call) => call[1] === 'update')).toBe(false);
    expect(result.first_generation.requirement_workspace_path).toBe('requirements/mobile');
  });

  test('refreshes a nested requirement workspace through canonical repo-root extraction', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-nested-refresh');
    const requirementWorkspace = path.join(target, 'requirements', 'mobile');
    const canonicalGraph = path.join(target, '.graphify', 'graph.json');
    fs.mkdirSync(requirementWorkspace, { recursive: true });
    fs.mkdirSync(path.dirname(canonicalGraph), { recursive: true });
    fs.writeFileSync(canonicalGraph, 'stale-root-graph');
    const calls = [];
    const runner = (command, args, options = {}) => {
      calls.push({ command, args: [...args], options: { ...options } });
      materializeGraphifyProjectSkill(target, args);
      if (args[0] === 'extract') {
        fs.writeFileSync(canonicalGraph, 'fresh-canonical-graph');
      }
      if (args[0] === 'query') {
        return options.cwd === target && fs.readFileSync(canonicalGraph, 'utf8') === 'fresh-canonical-graph'
          ? success('query ready')
          : failure('canonical graph not refreshed');
      }
      return success('ok');
    };
    const context = {
      selected: true,
      refresh: true,
      repoRoot: target,
      host: 'codex',
      requirementWorkspace: 'requirements/mobile',
      runner,
    };
    const plan = provider.plan(context);

    expect(plan.actions).toContainEqual(expect.objectContaining({
      kind: 'refresh',
      args: ['extract', requirementWorkspace, '--out', target],
    }));
    const result = provider.refresh(context, plan);
    const extractCall = calls.find((call) => call.args[0] === 'extract');

    expect(extractCall).toMatchObject({
      args: ['extract', requirementWorkspace, '--out', target],
      options: { cwd: target },
    });
    expect(calls.some((call) => call.args[0] === 'update')).toBe(false);
    expect(fs.readFileSync(canonicalGraph, 'utf8')).toBe('fresh-canonical-graph');
    expect(fs.existsSync(path.join(requirementWorkspace, '.graphify'))).toBe(false);
    expect(result.readiness_status).toBe('fresh');
    expect(result.first_generation).toMatchObject({
      requirement_workspace_path: 'requirements/mobile',
      artifact_refs: ['.graphify/graph.json'],
    });
  });

  test('keeps first-generation behavior when refresh is requested without a canonical artifact', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-refresh-without-artifact');
    const requirementWorkspace = path.join(target, 'requirements', 'mobile');
    fs.mkdirSync(requirementWorkspace, { recursive: true });
    const calls = [];
    const runner = (command, args, options = {}) => {
      calls.push({ command, args: [...args], options: { ...options } });
      materializeGraphifyProjectSkill(target, args);
      if (args[0] === 'extract') {
        fs.mkdirSync(path.join(target, '.graphify'), { recursive: true });
        fs.writeFileSync(path.join(target, '.graphify', 'graph.json'), '{}');
      }
      return success(args[0] === 'query' ? 'query ready' : 'ok');
    };
    const context = {
      selected: true,
      refresh: true,
      repoRoot: target,
      host: 'codex',
      requirementWorkspace: 'requirements/mobile',
      runner,
    };
    const plan = provider.plan(context);

    expect(plan.actions).toContainEqual(expect.objectContaining({
      kind: 'first-generation',
      args: ['extract', requirementWorkspace, '--out', target],
    }));
    expect(plan.actions.some((action) => action.kind === 'refresh')).toBe(false);

    const result = provider.apply(context, plan);

    expect(calls.some((call) => call.args[0] === 'update')).toBe(false);
    expect(calls.find((call) => call.args[0] === 'extract')).toMatchObject({
      args: ['extract', requirementWorkspace, '--out', target],
      options: { cwd: target },
    });
    expect(result.readiness_status).toBe('fresh');
    expect(result.first_generation.requirement_workspace_path).toBe('requirements/mobile');
  });

  test('does not install hooks through an uncontained worktree gitdir pointer', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-worktree-hook');
    fs.rmSync(path.join(target, '.git'), { recursive: true, force: true });
    fs.writeFileSync(path.join(target, '.git'), 'gitdir: /outside/main/.git/worktrees/demo\n');
    fs.mkdirSync(path.join(target, '.graphify'), { recursive: true });
    fs.writeFileSync(path.join(target, '.graphify', 'graph.json'), '{}');
    const calls = [];
    const runner = (command, args) => {
      calls.push([command, ...args]);
      materializeGraphifyProjectSkill(target, args);
      if (args[0] === 'hook' && args[1] === 'status') return failure('hook unavailable');
      return success('ok');
    };

    const plan = provider.plan({ selected: true, repoRoot: target, host: 'codex' });
    const result = provider.apply({ repoRoot: target, host: 'codex', runner }, plan);
    expect(calls.some((call) => call.join(' ') === 'graphify hook install')).toBe(false);
    expect(result.steady_state).toMatchObject({
      hook_status: 'failed',
      hook_skipped_reason: 'worktree-gitdir-hook-mutation-not-contained',
    });
  });

  test('blocks a symlinked Graphify hook leaf before provider mutation', () => {
    const provider = require('../../skills/spec-mcp-setup/scripts/providers/graphify.cjs');
    const target = tempRepo('graphify-hook-leaf-symlink');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-graphify-hook-outside-'));
    const victim = path.join(outside, 'post-commit');
    const hook = path.join(target, '.git', 'hooks', 'post-commit');
    fs.mkdirSync(path.dirname(hook), { recursive: true });
    fs.writeFileSync(victim, '#!/bin/sh\n# Installed by: graphify hook install\n');
    fs.symlinkSync(victim, hook, process.platform === 'win32' ? 'file' : 'file');
    const runner = jest.fn(() => success('graphify 0.17.1'));

    expect(provider.plan({ selected: true, repoRoot: target, host: 'codex', runner })).toMatchObject({
      mutation: false,
      blocked: true,
      reason_code: 'graphify-hook-symlink-escape',
    });
    expect(runner).not.toHaveBeenCalled();
    expect(fs.readFileSync(victim, 'utf8')).toContain('Installed by: graphify hook install');
  });
});
