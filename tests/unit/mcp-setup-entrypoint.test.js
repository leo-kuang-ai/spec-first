'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const skillRoot = path.join(repoRoot, 'skills', 'spec-runtime-setup');

function tempRepo(label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-entry-${label}-`));
  initializeGitRepo(root);
  writeRuntimeState(root, 'codex', '1.13.2');
  writeRuntimeState(root, 'qoder', '1.13.2');
  return root;
}

function childRepo(workspace, relativePath) {
  const root = path.join(workspace, relativePath);
  fs.mkdirSync(root, { recursive: true });
  initializeGitRepo(root);
  return root;
}

function initializeGitRepo(root) {
  const result = spawnSync('git', ['init', '-q', root], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`git init failed: ${result.stderr || result.stdout}`);
  const hooks = spawnSync('git', ['-C', root, 'config', '--local', 'core.hooksPath', '.git/hooks'], { encoding: 'utf8' });
  if (hooks.status !== 0) throw new Error(`git config failed: ${hooks.stderr || hooks.stdout}`);
}

function installGlobalSkill(homeDir, skillName) {
  const root = path.join(homeDir, '.agents', 'skills', skillName);
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'SKILL.md'), `# ${skillName}\n`);
}

function writeRuntimeState(root, host, manifestVersion) {
  const stateDir = path.join(root, `.${host}`, 'spec-first');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'state.json'), `${JSON.stringify({ manifestVersion })}\n`);
}

function snapshot(root) {
  const entries = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (entry.isDirectory()) {
        entries.push(`${relative}/`);
        visit(absolute);
      } else {
        entries.push(`${relative}:${fs.readFileSync(absolute).toString('base64')}`);
      }
    }
  }
  visit(root);
  return entries;
}

function snapshotFiles(root, excludedPrefixes = []) {
  const entries = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join('/');
      if (entry.isDirectory()) visit(absolute);
      else if (!excludedPrefixes.some((prefix) => relative === prefix || relative.startsWith(`${prefix}/`))) {
        entries.push(`${relative}:${fs.readFileSync(absolute).toString('base64')}`);
      }
    }
  }
  visit(root);
  return entries;
}

function createReadOnlyAuditRunner() {
  const calls = [];
  const violations = [];
  const runner = (command, args, options = {}) => {
    calls.push([command, ...args]);
    const providerMutation = command === 'graphify'
      && (['install', 'extract', 'update'].includes(args[0]) || (args[0] === 'hook' && args[1] === 'install'));
    const codegraphMutation = command === 'codegraph' && ['sync', 'index', 'init'].includes(args[0]);
    const packageExecution = command === 'npx' && !(args.length === 1 && args[0] === '--version');
    const packageMutation = command === 'npm' && ['install', 'add', 'update', 'uninstall'].includes(args[0]);
    const installMutation = packageExecution
      || packageMutation
      || ['install', 'add'].includes(args[0])
      || args.includes('--global')
      || args.includes('-g');
    if (providerMutation || codegraphMutation || installMutation) {
      const violation = { command, args: [...args] };
      violations.push(violation);
      throw new Error(`read-only runner rejected mutation: ${command} ${args.join(' ')}`);
    }
    return fakeRunner(command, args, options);
  };
  return { calls, runner, violations };
}

function fakeRunner(command, args, options = {}) {
  const cwd = options.cwd || process.cwd();
  const graphifyCommand = path.basename(command).replace(/\.(?:exe|cmd)$/i, '') === 'graphify';
  if (command === 'uv' && args[0] === 'tool' && args[1] === 'install') {
    const home = options.env && options.env.HOME;
    if (home) {
      const binDir = path.join(home, '.local', 'bin');
      const toolDir = path.join(home, '.local', 'share', 'uv', 'tools', 'graphifyy', 'bin');
      fs.mkdirSync(binDir, { recursive: true });
      fs.mkdirSync(toolDir, { recursive: true });
      const interpreter = path.join(toolDir, 'python');
      const launcher = path.join(binDir, 'graphify');
      fs.writeFileSync(interpreter, '#!/bin/sh\n');
      fs.writeFileSync(launcher, `#!${interpreter}\n`);
      fs.chmodSync(interpreter, 0o755);
      fs.chmodSync(launcher, 0o755);
    }
  }
  if (command === 'npx' && args.includes('ast-grep/agent-skill')) {
    const home = options.env && options.env.HOME;
    if (home) {
      const skillDir = path.join(home, '.agents', 'skills', 'ast-grep');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# ast-grep\n');
    }
  }
  if (graphifyCommand && args[0] === 'install' && args[1] === '--project') {
    const platform = args[3] || 'codex';
    const roots = {
      claude: '.claude/skills/graphify',
      cursor: '.cursor/skills/graphify',
      kiro: '.kiro/skills/graphify',
      qoder: '.qoder/skills/graphify',
    };
    const skillDir = path.join(cwd, roots[platform] || '.codex/skills/graphify');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Graphify\nUse graphify-out/graph.json\n');
    const instruction = platform === 'claude' ? 'CLAUDE.md' : 'AGENTS.md';
    fs.writeFileSync(path.join(cwd, instruction), '## graphify\nUse graphify-out/graph.json\n');
    if (platform === 'codex') {
      fs.mkdirSync(path.join(cwd, '.codex'), { recursive: true });
      fs.writeFileSync(path.join(cwd, '.codex', 'hooks.json'), JSON.stringify({
        hooks: { PreToolUse: [{ hooks: [{ type: 'command', command: '/wrong/graphify hook-check' }] }] },
      }));
    }
  }
  if (graphifyCommand && args[0] === 'extract') {
    const envOut = options.env && options.env.GRAPHIFY_OUT ? options.env.GRAPHIFY_OUT : '.graphify';
    const artifactRoot = path.resolve(cwd, envOut);
    fs.mkdirSync(artifactRoot, { recursive: true });
    fs.writeFileSync(path.join(artifactRoot, 'graph.json'), JSON.stringify({ nodes: [{ id: 'fixture' }], links: [] }));
  }
  if (graphifyCommand && args[0] === 'hook' && args[1] === 'install') {
    const interpreter = path.join((options.env && options.env.HOME) || os.homedir(), '.local', 'share', 'uv', 'tools', 'graphifyy', 'bin', 'python');
    const hooksRoot = options.env && options.env.GIT_CONFIG_VALUE_0
      ? options.env.GIT_CONFIG_VALUE_0
      : path.join(cwd, '.git', 'hooks');
    fs.mkdirSync(hooksRoot, { recursive: true });
    for (const [name, markers] of Object.entries({
      'post-commit': ['# graphify-hook-start', '# graphify-hook-end'],
      'post-checkout': ['# graphify-checkout-hook-start', '# graphify-checkout-hook-end'],
    })) {
      fs.writeFileSync(path.join(hooksRoot, name), [
        '#!/bin/sh', markers[0], '# Installed by: graphify hook install',
        `_PINNED='${interpreter}'`, "_out = os.environ.get('GRAPHIFY_OUT', 'graphify-out')",
        'from graphify.watch import _rebuild_code', markers[1], '',
      ].join('\n'));
    }
  }
  return {
    command,
    argv: args,
    args,
    exit_code: 0,
    signal: null,
    timed_out: false,
    timeout: false,
    stdout: /^python(?:3(?:\.\d+)?)?$/.test(path.basename(command)) && args[0] === '-c'
      ? (String(args[1]).includes('importlib.metadata')
        ? JSON.stringify({ version: '0.9.17', packages: [['graphifyy', '0.9.17']] })
        : '3.12.1')
      : (graphifyCommand && args[0] === '--version'
        ? 'graphify 0.9.17'
        : (command === 'uv' && args.join(' ') === 'tool dir --bin'
          ? path.join((options.env && options.env.HOME) || os.homedir(), '.local', 'bin')
          : (args[0] === 'status' ? 'ready' : 'ok'))),
    stderr: '',
    error: null,
  };
}

function visibleHostRunner(visibleHost) {
  const commands = {
    claude: ['claude'],
    codex: ['codex'],
    cursor: ['agent'],
    kiro: ['kiro'],
    qoder: ['qodercli', 'qoder'],
  };
  const hostCommands = new Set(Object.values(commands).flat());
  return (command, args, options = {}) => {
    if (hostCommands.has(command) && args.length === 1 && args[0] === '--version') {
      const visible = commands[visibleHost] && commands[visibleHost].includes(command);
      return {
        command,
        argv: args,
        args,
        exit_code: visible ? 0 : 127,
        signal: null,
        timed_out: false,
        timeout: false,
        stdout: visible ? `${visibleHost} ready` : '',
        stderr: visible ? '' : 'not found',
        error: visible ? null : { code: 'ENOENT' },
      };
    }
    return fakeRunner(command, args, options);
  };
}

describe('spec-runtime-setup unified Node entrypoint', () => {
  test.each([
    [[], 'bare'],
    [['--check'], 'check'],
    [['--plan', '--only', 'graphify'], 'plan'],
  ])('%j is read-only', (argv, expectedMode) => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo(`readonly-${expectedMode}`);
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    const before = snapshot(target);
    const homeBefore = snapshot(homeDir);
    const audit = createReadOnlyAuditRunner();
    const result = runSetup({
      argv,
      cwd: target,
      skillRoot,
      runner: audit.runner,
      env: {},
      homeDir,
    });

    expect(audit.violations).toEqual([]);
    expect(result.exit_code).toBe(0);
    expect(result.mode).toBe(expectedMode);
    expect(snapshot(target)).toEqual(before);
    expect(snapshot(homeDir)).toEqual(homeBefore);
    if (expectedMode === 'plan') {
      expect(result.payload).toMatchObject({
        schema_version: 'setup-install-plan.v1',
        mutation: false,
        reason_code: 'setup-install-plan-ready',
        optional_provider_selection: { selected_ids: ['graphify'] },
        provider_selection: [expect.objectContaining({ provider: 'graphify', selected: true })],
      });
      expect(result.payload.planned_operations.map((entry) => entry.kind)).toEqual(expect.arrayContaining([
        'warmup-tool',
        'write-host-config',
        'verify-helper',
        'install-helper',
        'install-project-skill',
        'write-setup-facts',
      ]));
      expect(result.payload.safety.map((entry) => entry.id)).toEqual(expect.arrayContaining([
        'context7',
        'sequential-thinking',
        'gh',
        'ast-grep-skill',
        'graphify',
      ]));
    }
  });

  test('previews an explicit Graphify refresh without mutating the project', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('readonly-graphify-refresh-plan');
    fs.mkdirSync(path.join(target, '.graphify'), { recursive: true });
    fs.writeFileSync(path.join(target, '.graphify', 'graph.json'), '{"nodes":[{"id":"main"}],"edges":[]}\n');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    const before = snapshot(target);
    const homeBefore = snapshot(homeDir);
    const audit = createReadOnlyAuditRunner();

    const result = runSetup({
      argv: ['--plan', '--only', 'graphify', '--refresh'],
      cwd: target,
      skillRoot,
      runner: audit.runner,
      env: {},
      homeDir,
    });

    expect(audit.violations).toEqual([]);
    expect(result).toMatchObject({ exit_code: 0, mode: 'plan' });
    expect(result.payload.planned_operations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'refresh',
        provider: 'graphify',
        args: ['update', '.'],
        graphify_out: '.graphify',
      }),
    ]));
    expect(snapshot(target)).toEqual(before);
    expect(snapshot(homeDir)).toEqual(homeBefore);
  });

  test('blocks plan before installation on host config conflict and previews explicit repair', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('plan-host-conflict');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    const configPath = path.join(homeDir, '.codex', 'config.toml');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, [
      '[mcp_servers.context7]',
      'command = "user-owned"',
      'args = []',
      '',
    ].join('\n'));
    const before = snapshot(homeDir);

    const blocked = runSetup({
      argv: ['--plan', '--only', 'graphify'],
      cwd: target,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir,
    });
    expect(blocked).toMatchObject({
      exit_code: 2,
      mode: 'plan',
      reason_code: 'host-config-conflict',
      payload: {
        blocked: true,
        next_action: 'spec-runtime-setup --only graphify --repair-host-config',
      },
    });
    expect(blocked.payload.planned_operations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        tool: 'context7',
        planned: false,
        blocked_reason: 'host-config-conflict',
        conflict_fields: expect.arrayContaining(['command', 'args']),
      }),
    ]));
    expect(snapshot(homeDir)).toEqual(before);

    const repairPlan = runSetup({
      argv: ['--plan', '--only', 'graphify', '--repair-host-config'],
      cwd: target,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir,
    });
    expect(repairPlan).toMatchObject({ exit_code: 0, mode: 'plan' });
    expect(repairPlan.payload.planned_operations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'repair-host-config',
        tool: 'context7',
        planned: true,
        action_reason_code: 'host-config-repair-authorized',
      }),
    ]));
    expect(snapshot(homeDir)).toEqual(before);
  });

  test('repairs only conflicting managed Codex MCP entries with explicit authorization', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('apply-host-conflict-repair');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    installGlobalSkill(homeDir, 'ast-grep');
    const configPath = path.join(homeDir, '.codex', 'config.toml');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, [
      'model = "gpt-5"',
      '',
      '[mcp_servers.context7]',
      'command = "user-owned"',
      'args = []',
      '',
      '[mcp_servers.unrelated]',
      'command = "keep-me"',
      'args = ["--safe"]',
      '',
    ].join('\n'));

    const result = runSetup({
      argv: ['--repair-host-config'],
      cwd: target,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir,
      bundledVersion: '1.13.2',
    });
    const updated = fs.readFileSync(configPath, 'utf8');

    expect(result).toMatchObject({ exit_code: 0, mode: 'host-config-repair' });
    expect(updated).toContain('model = "gpt-5"');
    expect(updated).toContain('[mcp_servers.unrelated]');
    expect(updated).toContain('command = "keep-me"');
    expect(updated).toContain('[mcp_servers.context7]');
    expect(updated).toContain('@upstash/context7-mcp@latest');
    expect(updated).toContain('[mcp_servers.sequential-thinking]');
    expect(updated).toContain('@modelcontextprotocol/server-sequential-thinking@latest');
    expect(updated).not.toContain('command = "user-owned"');
  });

  test('default diagnostic output exposes actionable tools, skills, project, setup, providers, and public next actions', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('human-diagnostic');
    const result = runSetup({
      argv: [],
      cwd: target,
      skillRoot,
      runner: visibleHostRunner('codex'),
      env: { CODEX_THREAD_ID: 'thread-1' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
    });

    expect(result.exit_code).toBe(0);
    expect(result.payload.host).toMatchObject({ host: 'codex', authority: 'advisory' });
    expect(result.payload.next_actions).toEqual(expect.arrayContaining([
      expect.stringContaining('required baseline、CodeGraph 与 Graphify'),
    ]));
    for (const heading of ['MCP servers', '工具', '技能', '项目设置', '设置事实', 'Provider 状态', '后续操作']) {
      expect(result.human).toContain(heading);
    }
    expect(result.human).toContain('gh');
    expect(result.human).toContain('ast-grep-skill');
  });

  test('check reconciles CodeGraph readiness from an explicitly pinned read-only host config', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('check-codegraph-configured');
    fs.mkdirSync(path.join(target, '.codegraph'), { recursive: true });
    fs.writeFileSync(path.join(target, '.codegraph', 'codegraph.db'), 'db');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    const configPath = path.join(homeDir, '.codex', 'config.toml');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, [
      '[mcp_servers.codegraph]',
      'command = "codegraph"',
      'args = ["serve", "--mcp"]',
      '',
    ].join('\n'));
    const before = snapshot(target);
    const homeBefore = snapshot(homeDir);
    const runner = (command, args, options) => {
      if (command === 'codegraph' && args[0] === '--version') {
        return { ...fakeRunner(command, args, options), stdout: 'codegraph 1.4.1' };
      }
      if (command === 'codegraph' && args[0] === 'status') {
        return { ...fakeRunner(command, args, options), stdout: 'index ready' };
      }
      return fakeRunner(command, args, options);
    };

    const result = runSetup({
      argv: ['--check'],
      cwd: target,
      skillRoot,
      runner,
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir,
    });

    expect(result.payload.provider_readiness.find((entry) => entry.provider === 'codegraph'))
      .toMatchObject({
        readiness_status: 'fresh',
        lifecycle: { configured: true, query_verified: true },
      });
    expect(result.payload.mcp_servers.find((entry) => entry.id === 'codegraph')).toMatchObject({
      dependency_status: 'ready',
      configured_status: 'ready',
      result: 'ready',
    });
    expect(snapshot(target)).toEqual(before);
    expect(snapshot(homeDir)).toEqual(homeBefore);
  });

  test('check reports a current missing baseline MCP dependency instead of relying on saved facts', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('check-live-mcp-missing');
    const runner = (command, args, options) => {
      if (command === 'npx' && args.length === 1 && args[0] === '--version') {
        return {
          ...fakeRunner(command, args, options),
          exit_code: 127,
          stdout: '',
          stderr: 'npx missing',
        };
      }
      return fakeRunner(command, args, options);
    };

    const result = runSetup({
      argv: ['--check'],
      cwd: target,
      skillRoot,
      runner,
      env: {},
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
    });

    expect(result.payload.next_actions).toContain('Install or repair: npx');
    expect(result.payload.mcp_servers.find((entry) => entry.id === 'context7')).toMatchObject({
      dependency_status: 'missing',
      result: 'action-required',
      reason_code: 'missing_dependency',
    });
    expect(result.payload.next_actions.some((action) => action.includes('继续目标'))).toBe(false);
  });

  test.each([
    [{ CODEX_THREAD_ID: 'thread-1' }, 'codex'],
    [{ CLAUDE_CODE_SESSION_ID: 'session-1' }, 'claude'],
  ])('uses runtime markers only as read-only advisory host evidence', (env, expectedHost) => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo(`advisory-marker-${expectedHost}`);
    const result = runSetup({ argv: ['--check'], cwd: target, skillRoot, runner: fakeRunner, env });
    expect(result).toMatchObject({ exit_code: 0, payload: { host: { host: expectedHost, authority: 'advisory' } } });

    const mutationTarget = tempRepo(`advisory-marker-mutation-${expectedHost}`);
    expect(runSetup({ argv: ['--verify-only'], cwd: mutationTarget, skillRoot, runner: fakeRunner, env }))
      .toMatchObject({ exit_code: 2, reason_code: 'host-authority-required' });
  });

  test('uses a uniquely visible host CLI as advisory evidence for bare diagnostics', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('advisory-cli');
    const result = runSetup({ argv: [], cwd: target, skillRoot, runner: visibleHostRunner('claude'), env: {} });
    expect(result).toMatchObject({ exit_code: 0, payload: { host: { host: 'claude', authority: 'advisory' } } });
  });

  test('stops advisory CLI probing once multiple visible hosts make the result ambiguous', () => {
    const {
      advisoryHostCandidates,
    } = require('../../skills/spec-runtime-setup/scripts/lib/human-output.cjs');
    const commands = [];
    const runner = (command) => {
      commands.push(command);
      return {
        exit_code: ['claude', 'codex'].includes(command) ? 0 : 1,
        signal: null,
        timed_out: false,
      };
    };

    expect(advisoryHostCandidates({ env: {}, runner })).toEqual([]);
    expect(commands).toEqual(['claude', 'codex']);
  });

  test('verify-only writes setup-owned facts and no host/provider/project config', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const { buildActionPlan } = require('../../skills/spec-runtime-setup/scripts/lib/mode-policy.cjs');
    const target = tempRepo('verify');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    const repoBefore = snapshotFiles(target, ['.spec-first/config', '.spec-first/workspace/scenario-fingerprint-setup.json']);
    const audit = createReadOnlyAuditRunner();
    const result = runSetup({
      argv: ['--verify-only'],
      cwd: target,
      skillRoot,
      runner: audit.runner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir,
      bundledVersion: '1.13.2',
    });

    expect(buildActionPlan({ argv: ['--verify-only'], knownIds: ['codegraph', 'graphify'] })).toMatchObject({
      mode: 'verify',
      capabilities: ['write-setup-facts'],
    });
    expect(audit.violations).toEqual([]);
    expect(result).toMatchObject({ exit_code: 1, reason_code: 'missing_dependency' });
    expect(fs.existsSync(path.join(target, '.spec-first', 'config', 'tool-facts.json'))).toBe(true);
    expect(fs.existsSync(path.join(target, '.spec-first', 'config', 'runtime-capabilities.json'))).toBe(true);
    expect(fs.existsSync(path.join(target, '.qoder', 'settings.local.json'))).toBe(false);
    expect(fs.existsSync(path.join(target, '.graphify'))).toBe(false);
    expect(fs.existsSync(path.join(target, '.spec-first', 'config.local.example.yaml'))).toBe(false);
    const toolFacts = JSON.parse(fs.readFileSync(path.join(target, '.spec-first', 'config', 'tool-facts.json'), 'utf8'));
    const runtimeCapabilities = JSON.parse(fs.readFileSync(path.join(target, '.spec-first', 'config', 'runtime-capabilities.json'), 'utf8'));
    expect(toolFacts.scenario_fingerprint_setup).toMatchObject({
      status: 'written',
      schema_version: 'developer-scenario-fingerprint-setup.v1',
      advisory: true,
    });
    expect(runtimeCapabilities.scenario_fingerprint_setup).toEqual(toolFacts.scenario_fingerprint_setup);
    const hostLedgerPath = path.join(homeDir, '.qoder', 'spec-first', 'host-setup.json');
    expect(runtimeCapabilities.host_ledger_pointer).toMatchObject({
      host: 'qoder',
      path: hostLedgerPath,
      schema_version: 'v2',
    });
    expect(JSON.parse(fs.readFileSync(hostLedgerPath, 'utf8'))).toMatchObject({
      schema_version: 'v2',
      host: 'qoder',
      runtime_capabilities_path: path.join(target, '.spec-first', 'config', 'runtime-capabilities.json'),
    });
    expect(result.payload).toMatchObject({
      execution_summary: {
        overall_status: 'action-required',
        scope: 'full',
        selected_ids: ['codegraph', 'graphify'],
        required_provider_ids: ['codegraph', 'graphify'],
      },
      write_result: { status: 'ready', complete: true },
      host_ledger_write_result: { status: 'ready', reason_code: 'host-readiness-ledger-written' },
    });
    expect(result.human).toContain('整体状态：action-required');
    expect(result.human).toContain('spec-runtime-setup --only');
    expect(result.human).not.toContain('继续目标 spec-* workflow');
    expect(fs.existsSync(path.join(target, '.spec-first', 'workspace', 'scenario-fingerprint-setup.json'))).toBe(true);
    expect(snapshotFiles(target, ['.spec-first/config', '.spec-first/workspace/scenario-fingerprint-setup.json']))
      .toEqual(repoBefore);
  });

  test('fails completion with a structured outcome when the host readiness ledger cannot be written', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('host-ledger-failure');
    const result = runSetup({
      argv: ['--verify-only'],
      cwd: target,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
      hostLedgerWriter() {
        throw new Error('injected host ledger write failure');
      },
    });

    expect(result).toMatchObject({
      exit_code: 1,
      reason_code: 'host-readiness-ledger-write-failed',
      payload: {
        write_result: { status: 'ready', complete: false },
        host_ledger_write_result: {
          status: 'failed',
          reason_code: 'host-readiness-ledger-write-failed',
          complete: false,
        },
      },
    });
  });

  test('preserves a host inspection failure even when setup facts are written', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('host-failure');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    installGlobalSkill(homeDir, 'ast-grep');
    fs.mkdirSync(path.join(target, '.qoder'), { recursive: true });
    fs.writeFileSync(path.join(target, '.qoder', 'settings.local.json'), '{ invalid json');

    const result = runSetup({
      argv: ['--verify-only'],
      cwd: target,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir,
      bundledVersion: '1.13.2',
    });

    expect(result).toMatchObject({
      exit_code: 1,
      reason_code: 'host-config-json-invalid',
      payload: { write_result: { status: 'ready' } },
    });
    expect(fs.existsSync(path.join(target, '.spec-first', 'config', 'tool-facts.json'))).toBe(true);
  });

  test('blocks selected providers before project mutation when host config verification fails', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('provider-host-gate');
    const calls = [];
    fs.mkdirSync(path.join(target, '.qoder'), { recursive: true });
    fs.writeFileSync(path.join(target, '.qoder', 'settings.local.json'), '{ invalid json');
    const runner = (command, args, options) => {
      calls.push([command, ...args]);
      return fakeRunner(command, args, options);
    };

    const result = runSetup({
      argv: ['--only', 'graphify'],
      cwd: target,
      skillRoot,
      runner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    });

    expect(calls.some(([command, action, subcommand]) => command === 'graphify'
      && (['install', 'extract', 'update'].includes(action) || (action === 'hook' && subcommand === 'install')))).toBe(false);
    expect(fs.existsSync(path.join(target, '.graphify'))).toBe(false);
    expect(result).toMatchObject({ exit_code: 1, reason_code: 'host-config-json-invalid' });
    expect(result.payload.tool_facts.provider_readiness.find((entry) => entry.provider === 'graphify'))
      .toMatchObject({ readiness_status: 'degraded', first_generation: { status: 'failed' } });
  });

  test('fails when facts cannot be committed after otherwise successful setup', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('facts-write-failure');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-facts-outside-'));
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    fs.mkdirSync(path.join(target, '.spec-first'), { recursive: true });
    fs.symlinkSync(outside, path.join(target, '.spec-first', 'config'), process.platform === 'win32' ? 'junction' : 'dir');

    const result = runSetup({
      argv: ['--only', 'graphify'],
      cwd: target,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir,
      bundledVersion: '1.13.2',
    });

    expect(result).toMatchObject({
      exit_code: 1,
      reason_code: 'setup-facts-write-failed',
      payload: { write_result: { status: 'failed', reason_code: 'setup-facts-write-failed' } },
    });
    expect(fs.readdirSync(outside)).toEqual([]);
  });

  test('keeps scenario fingerprint containment failures advisory and records degraded status', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('scenario-fingerprint-failure');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-scenario-outside-'));
    fs.mkdirSync(path.join(target, '.spec-first'), { recursive: true });
    fs.symlinkSync(outside, path.join(target, '.spec-first', 'workspace'), process.platform === 'win32' ? 'junction' : 'dir');

    const result = runSetup({
      argv: ['--only', 'graphify'],
      cwd: target,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    });

    expect(result).toMatchObject({
      exit_code: 0,
      reason_code: 'setup-facts-written',
      payload: {
        tool_facts: {
          scenario_fingerprint_setup: {
            status: 'failed',
            reason_code: 'artifact-output-symlink-escape',
            advisory: true,
          },
        },
        runtime_capabilities: {
          scenario_fingerprint_setup: {
            status: 'failed',
            reason_code: 'artifact-output-symlink-escape',
            advisory: true,
          },
        },
      },
    });
    const persisted = JSON.parse(fs.readFileSync(path.join(target, '.spec-first', 'config', 'runtime-capabilities.json'), 'utf8'));
    expect(persisted.scenario_fingerprint_setup).toMatchObject({
      status: 'failed',
      reason_code: 'artifact-output-symlink-escape',
    });
    expect(fs.readdirSync(outside)).toEqual([]);
  });

  test('keeps the primary outcome when the scenario status ledger rewrite fails', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('scenario-ledger-failure');
    let writes = 0;
    const factsWriter = (filePath, payload) => {
      writes += 1;
      if (writes > 2) throw new Error('injected scenario ledger rewrite failure');
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, payload);
    };

    const result = runSetup({
      argv: ['--only', 'graphify'],
      cwd: target,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
      factsWriter,
    });

    expect(result).toMatchObject({
      exit_code: 0,
      reason_code: 'setup-facts-written',
      payload: {
        tool_facts: {
          scenario_fingerprint_setup: {
            status: 'failed',
            reason_code: 'scenario-fingerprint-ledger-update-failed',
          },
        },
        runtime_capabilities: {
          scenario_fingerprint_setup: {
            status: 'failed',
            reason_code: 'scenario-fingerprint-ledger-update-failed',
          },
        },
      },
    });
    expect(fs.existsSync(path.join(target, '.spec-first', 'workspace', 'scenario-fingerprint-setup.json'))).toBe(true);
    const persisted = JSON.parse(fs.readFileSync(path.join(target, '.spec-first', 'config', 'runtime-capabilities.json'), 'utf8'));
    expect(persisted.scenario_fingerprint_setup).toBeUndefined();
  });

  test('project-config writes only project-local config surfaces without host authority', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const { buildActionPlan } = require('../../skills/spec-runtime-setup/scripts/lib/mode-policy.cjs');
    const target = tempRepo('project-config');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    const repoBefore = snapshotFiles(target, ['.spec-first/config.local.example.yaml', '.gitignore']);
    const homeBefore = snapshot(homeDir);
    const audit = createReadOnlyAuditRunner();
    const result = runSetup({
      argv: ['--project-config'],
      cwd: target,
      skillRoot,
      runner: audit.runner,
      env: {},
      homeDir,
    });

    expect(buildActionPlan({ argv: ['--project-config'], knownIds: ['codegraph', 'graphify'] })).toMatchObject({
      mode: 'project-config',
      capabilities: ['write-project-config'],
    });
    expect(result.exit_code).toBe(0);
    expect(fs.existsSync(path.join(target, '.spec-first', 'config.local.example.yaml'))).toBe(true);
    expect(fs.readFileSync(path.join(target, '.gitignore'), 'utf8')).toContain('.spec-first/*.local.yaml');
    expect(fs.existsSync(path.join(target, '.spec-first', 'config', 'tool-facts.json'))).toBe(false);
    expect(fs.existsSync(path.join(target, '.qoder', 'settings.local.json'))).toBe(false);
    expect(fs.existsSync(path.join(target, '.graphify'))).toBe(false);
    expect(snapshotFiles(target, ['.spec-first/config.local.example.yaml', '.gitignore'])).toEqual(repoBefore);
    expect(snapshot(homeDir)).toEqual(homeBefore);
    expect(audit.violations).toEqual([]);
  });

  test('blocks selected child setup before host, provider, or facts mutation when this host projection is missing', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-preflight-workspace-'));
    const child = childRepo(workspace, 'apps/child');
    const calls = [];
    const runner = (command, args, options) => {
      calls.push([command, ...args]);
      return fakeRunner(command, args, options);
    };

    const result = runSetup({
      argv: ['--only', 'graphify', '--repo', 'apps/child'],
      cwd: workspace,
      skillRoot,
      runner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    });

    expect(result).toMatchObject({
      exit_code: 2,
      mode: 'only',
      reason_code: 'generated-runtime-projection-preflight-blocked',
      payload: {
        schema_version: 'workspace-runtime-projection-preflight.v1',
        confirmed: true,
        host: 'qoder',
        overall_status: 'action-required',
        results: [expect.objectContaining({
          repo_root: child,
          generated_runtime_manifest: expect.objectContaining({
            status: 'missing',
            reason_code: 'runtime-state-missing',
          }),
          next_action: expect.stringContaining('spec-first init --qoder --repo'),
        })],
      },
    });
    expect(calls.some(([command, action]) => command === 'graphify' && ['install', 'extract', 'update'].includes(action))).toBe(false);
    expect(fs.existsSync(path.join(child, '.qoder', 'settings.local.json'))).toBe(false);
    expect(fs.existsSync(path.join(child, '.spec-first', 'config', 'tool-facts.json'))).toBe(false);
  });

  test('runtime projection preflight reads only the active host and permits a current selected child', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-preflight-current-'));
    const child = childRepo(workspace, 'apps/child');
    writeRuntimeState(child, 'qoder', '1.13.2');
    writeRuntimeState(child, 'codex', '0.0.1');

    const result = runSetup({
      argv: ['--only', 'graphify', '--repo', 'apps/child'],
      cwd: workspace,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    });

    expect(result.exit_code).toBe(0);
    expect(fs.existsSync(path.join(child, '.graphify', 'graph.json'))).toBe(true);
  });

  test('blocks stale projection but leaves check, plan, verify-only, and project-config outside the mutation gate', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-preflight-modes-'));
    const staleChild = childRepo(workspace, 'apps/stale');
    const missingChild = childRepo(workspace, 'apps/missing');
    writeRuntimeState(staleChild, 'qoder', '1.12.0');
    const baseInput = {
      cwd: workspace,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    };

    expect(runSetup({ ...baseInput, argv: ['--only', 'graphify', '--repo', 'apps/stale'] })).toMatchObject({
      exit_code: 2,
      reason_code: 'generated-runtime-projection-preflight-blocked',
      payload: {
        results: [expect.objectContaining({
          generated_runtime_manifest: expect.objectContaining({ status: 'stale' }),
        })],
      },
    });
    for (const argv of [
      ['--check', '--repo', 'apps/missing'],
      ['--plan', '--only', 'graphify', '--repo', 'apps/missing'],
      ['--verify-only', '--repo', 'apps/missing'],
      ['--project-config', '--repo', 'apps/missing'],
    ]) {
      const result = runSetup({ ...baseInput, argv });
      expect(result.reason_code).not.toBe('generated-runtime-projection-preflight-blocked');
    }
    expect(fs.existsSync(path.join(missingChild, '.spec-first', 'config', 'tool-facts.json'))).toBe(true);
    expect(fs.existsSync(path.join(missingChild, '.spec-first', 'config.local.example.yaml'))).toBe(true);
  });

  test('blocks unreadable current-host projection before provider, host, or facts mutation', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-preflight-unreadable-'));
    const child = childRepo(workspace, 'apps/child');
    writeRuntimeState(child, 'qoder', '1.13.2');
    fs.writeFileSync(path.join(child, '.qoder', 'spec-first', 'state.json'), '{bad json\n');
    const calls = [];

    const result = runSetup({
      argv: ['--only', 'graphify', '--repo', 'apps/child'],
      cwd: workspace,
      skillRoot,
      runner(command, args, options) {
        calls.push([command, ...args]);
        return fakeRunner(command, args, options);
      },
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    });

    expect(result).toMatchObject({
      exit_code: 2,
      reason_code: 'generated-runtime-projection-preflight-blocked',
      payload: {
        results: [expect.objectContaining({
          blocked: true,
          generated_runtime_manifest: expect.objectContaining({
            status: 'unknown',
            reason_code: 'runtime-state-unreadable',
          }),
          next_action: expect.stringContaining('spec-first init --qoder --repo'),
        })],
      },
    });
    expect(calls.some(([command, action]) => command === 'graphify' && ['install', 'extract', 'update'].includes(action))).toBe(false);
    expect(fs.existsSync(path.join(child, '.qoder', 'settings.local.json'))).toBe(false);
    expect(fs.existsSync(path.join(child, '.spec-first', 'config', 'tool-facts.json'))).toBe(false);
  });

  test('blocks the all-repos mutation before any child provider or facts write when one child projection is missing', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-preflight-batch-'));
    const currentChild = childRepo(workspace, 'apps/current');
    const missingChild = childRepo(workspace, 'apps/missing');
    writeRuntimeState(currentChild, 'qoder', '1.13.2');
    const calls = [];
    const result = runSetup({
      argv: ['--only', 'graphify'],
      cwd: workspace,
      skillRoot,
      runner(command, args, options) {
        calls.push([command, ...args]);
        return fakeRunner(command, args, options);
      },
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    });

    expect(result).toMatchObject({
      exit_code: 2,
      reason_code: 'generated-runtime-projection-preflight-blocked',
      payload: {
        results: expect.arrayContaining([
          expect.objectContaining({ repo_root: currentChild, blocked: false }),
          expect.objectContaining({
            repo_root: missingChild,
            blocked: true,
            next_action: expect.stringContaining('spec-first init --qoder --repo'),
          }),
        ]),
      },
    });
    expect(calls.some(([command, action]) => command === 'graphify' && ['install', 'extract', 'update'].includes(action))).toBe(false);
    for (const child of [currentChild, missingChild]) {
      expect(fs.existsSync(path.join(child, '.spec-first', 'config', 'tool-facts.json'))).toBe(false);
      expect(fs.existsSync(path.join(child, '.qoder', 'settings.local.json'))).toBe(false);
    }
  });

  test('explicit graphify setup applies baseline host config, provider mutation, and post-probe facts', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('graphify');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    const result = runSetup({
      argv: ['--only', 'graphify'],
      cwd: target,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir,
      bundledVersion: '1.13.2',
    });

    expect(result.exit_code).toBe(0);
    expect(result.payload.execution_summary).toEqual({
      overall_status: 'partial',
      reason_code: 'subset-setup-complete',
      scope: 'subset',
      selected_ids: ['graphify'],
      required_provider_ids: ['codegraph', 'graphify'],
    });
    expect(result.human).toContain('整体状态：partial (subset-setup-complete)');
    expect(result.human).toContain('当前仅完成 selected subset');
    expect(result.human).not.toContain('继续目标 spec-* workflow');
    const hostConfig = JSON.parse(fs.readFileSync(path.join(target, '.qoder', 'settings.local.json'), 'utf8'));
    expect(Object.keys(hostConfig.mcpServers).sort()).toEqual(['context7', 'sequential-thinking']);
    expect(fs.existsSync(path.join(target, '.graphify', 'graph.json'))).toBe(true);
    const facts = JSON.parse(fs.readFileSync(path.join(target, '.spec-first', 'config', 'tool-facts.json'), 'utf8'));
    expect(facts.provider_readiness.find((entry) => entry.provider === 'graphify')).toMatchObject({
      readiness_status: 'fresh',
      lifecycle: { query_verified: true },
    });
    const scenarioFingerprintPath = path.join(target, '.spec-first', 'workspace', 'scenario-fingerprint-setup.json');
    expect(result.payload.runtime_capabilities.scenario_fingerprint_setup).toMatchObject({
      status: 'written',
      path: scenarioFingerprintPath,
    });
    expect(JSON.parse(fs.readFileSync(scenarioFingerprintPath, 'utf8'))).toMatchObject({
      schema_version: 'developer-scenario-fingerprint-setup.v1',
      advisory: true,
      layer: 'setup',
      target_root: target.split(path.sep).join('/'),
    });
    expect(result.payload.tool_facts.configured_dependencies.find((entry) => entry.id === 'mcp-config:context7'))
      .toMatchObject({
        dependency_status: 'ready',
        configured_status: 'ready',
        result: 'ready',
      });
  });

  test('full required setup stays ready when the effective Graphify hooks root is external', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('graphify-external-hooks-full');
    const outsideHooks = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-external-hooks-'));
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    fs.writeFileSync(path.join(outsideHooks, 'sentinel'), 'preserve\n');
    const configured = spawnSync('git', ['-C', target, 'config', '--local', 'core.hooksPath', outsideHooks], { encoding: 'utf8' });
    if (configured.status !== 0) throw new Error(configured.stderr || configured.stdout);
    const before = snapshot(outsideHooks);
    const calls = [];
    const runner = (command, args, options = {}) => {
      calls.push({ command, args: [...args], env: { ...(options.env || {}) } });
      if (command === 'codegraph' && args[0] === '--version') {
        return { ...fakeRunner(command, args, options), stdout: 'codegraph 1.4.1' };
      }
      if (command === 'codegraph' && args[0] === 'init') {
        fs.mkdirSync(path.join(target, '.codegraph'), { recursive: true });
        fs.writeFileSync(path.join(target, '.codegraph', 'codegraph.db'), 'db');
        return fakeRunner(command, args, options);
      }
      if (command === 'codegraph' && args[0] === 'status') {
        return { ...fakeRunner(command, args, options), stdout: 'index ready' };
      }
      return fakeRunner(command, args, options);
    };

    const result = runSetup({
      argv: ['--only', 'codegraph,graphify'],
      cwd: target,
      skillRoot,
      runner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir,
      bundledVersion: '1.13.2',
    });

    expect(result).toMatchObject({
      exit_code: 0,
      reason_code: 'setup-facts-written',
      payload: {
        execution_summary: {
          overall_status: 'ready',
          reason_code: 'setup-ready',
          scope: 'full',
          selected_ids: ['codegraph', 'graphify'],
          required_provider_ids: ['codegraph', 'graphify'],
        },
      },
    });
    expect(calls.filter((call) => path.basename(call.command) === 'graphify' && call.args[0] === 'hook')).toEqual([]);
    expect(snapshot(outsideHooks)).toEqual(before);
    expect(result.payload.tool_facts.provider_readiness.find((entry) => entry.provider === 'graphify')).toMatchObject({
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
    expect(result.human).toContain('整体状态：ready (setup-ready)');
    expect(result.human).toContain('optional_auto_refresh: unavailable-by-project-boundary');
    expect(result.human).toContain('继续目标 spec-* workflow');
    expect(result.human).not.toContain(outsideHooks);
  });

  test('reconciles CodeGraph configured lifecycle from the post-write host config probe', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('codegraph-configured');
    const runner = (command, args, options) => {
      if (command === 'codegraph' && args[0] === '--version') {
        return { ...fakeRunner(command, args, options), stdout: 'codegraph 1.4.1' };
      }
      if (command === 'codegraph' && args[0] === 'init') {
        fs.mkdirSync(path.join(target, '.codegraph'), { recursive: true });
        fs.writeFileSync(path.join(target, '.codegraph', 'codegraph.db'), 'db');
      }
      if (command === 'codegraph' && args[0] === 'status') {
        return { ...fakeRunner(command, args, options), stdout: 'index ready' };
      }
      return fakeRunner(command, args, options);
    };
    const result = runSetup({
      argv: ['--only', 'codegraph'],
      cwd: target,
      skillRoot,
      runner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    });

    const hostConfig = JSON.parse(fs.readFileSync(path.join(target, '.qoder', 'settings.local.json'), 'utf8'));
    expect(hostConfig.mcpServers.codegraph).toMatchObject({ command: 'codegraph', args: ['serve', '--mcp'] });
    expect(result.payload.tool_facts.provider_readiness.find((entry) => entry.provider === 'codegraph'))
      .toMatchObject({
        readiness_status: 'fresh',
        lifecycle: { installed: true, configured: true, initialized: true, indexed: true },
      });
  });

  test('repairs a missing baseline helper through structured argv operations before provider setup', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('helper-repair');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    const calls = [];
    let ghReady = false;
    const runner = (command, args, options) => {
      calls.push([command, ...args]);
      if (command === 'gh') {
        return ghReady
          ? fakeRunner(command, args, options)
          : { exit_code: 1, stdout: '', stderr: 'missing', timed_out: false, error: null };
      }
      if (command === 'brew' && args.join(' ') === 'install gh') {
        ghReady = true;
        return fakeRunner(command, args, options);
      }
      return fakeRunner(command, args, options);
    };

    const result = runSetup({
      argv: ['--only', 'graphify'],
      cwd: target,
      skillRoot,
      runner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir,
      platform: 'darwin',
      bundledVersion: '1.13.2',
    });

    expect(calls).toContainEqual(['brew', 'install', 'gh']);
    expect(result.payload.tool_facts.items.find((entry) => entry.id === 'gh')).toMatchObject({
      result: 'ready',
      verification_source: 'post-mutation-probe',
    });
    expect(fs.existsSync(path.join(target, '.graphify', 'graph.json'))).toBe(true);
  });

  test('preserves the first baseline helper install failure after facts reconciliation', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('helper-failure');
    const calls = [];
    const runner = (command, args, options) => {
      calls.push([command, ...args]);
      if (command === 'gh') {
        return { exit_code: 1, stdout: '', stderr: 'missing', timed_out: false, error: null };
      }
      if (command === 'brew' && args.join(' ') === 'install gh') {
        return { exit_code: 1, stdout: '', stderr: 'install failed', timed_out: false, error: null };
      }
      return fakeRunner(command, args, options);
    };

    const result = runSetup({
      argv: ['--only', 'graphify'],
      cwd: target,
      skillRoot,
      runner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      platform: 'darwin',
      bundledVersion: '1.13.2',
    });

    expect(result).toMatchObject({
      exit_code: 1,
      reason_code: 'helper-install-failed',
      payload: { write_result: { status: 'ready' } },
    });
    expect(calls.some((call) => call[0] === 'graphify' && ['install', 'extract', 'update'].includes(call[1]))).toBe(false);
  });

  test('reuses verified warmup cache entries on repeated explicit setup', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('warmup-cache');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    const calls = [];
    const runner = (command, args, options) => {
      calls.push([command, ...args]);
      return fakeRunner(command, args, options);
    };
    const input = {
      argv: ['--only', 'graphify'],
      cwd: target,
      skillRoot,
      runner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir,
      bundledVersion: '1.13.2',
    };

    expect(runSetup(input).exit_code).toBe(0);
    const warmupsAfterFirst = calls.filter((call) =>
      call[0] === 'npx' && call.some((arg) => String(arg).includes('@modelcontextprotocol/server-sequential-thinking')
        || String(arg).includes('@upstash/context7-mcp'))
    ).length;
    expect(warmupsAfterFirst).toBe(2);

    expect(runSetup(input).exit_code).toBe(0);
    const warmupsAfterSecond = calls.filter((call) =>
      call[0] === 'npx' && call.some((arg) => String(arg).includes('@modelcontextprotocol/server-sequential-thinking')
        || String(arg).includes('@upstash/context7-mcp'))
    ).length;
    expect(warmupsAfterSecond).toBe(2);
    expect(fs.existsSync(path.join(
      target,
      '.spec-first',
      'cache',
      'mcp-warmup',
      'qoder',
      process.platform === 'darwin' ? 'macos' : (process.platform === 'win32' ? 'windows' : 'linux'),
      'context7.json',
    ))).toBe(true);
  });

  test('uses the npm mirror only after primary install failures and persists install provenance', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('mirror-success');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    const calls = [];
    const failed = (command, args, message) => ({
      command,
      argv: args,
      args,
      exit_code: 1,
      signal: null,
      timed_out: false,
      timeout: false,
      stdout: '',
      stderr: message,
      error: null,
    });
    const runner = (command, args, options = {}) => {
      const env = { ...(options.env || {}) };
      calls.push({ command, args: [...args], env });
      const mirror = env.NPM_CONFIG_REGISTRY === 'https://registry.npmmirror.com'
        && env.npm_config_registry === 'https://registry.npmmirror.com';
      const context7Install = command === 'npx'
        && args.some((arg) => String(arg).includes('@upstash/context7-mcp'));
      const skillInstall = command === 'npx' && args.includes('ast-grep/agent-skill');
      if ((context7Install || skillInstall) && !mirror) {
        return failed(command, args, 'injected primary registry failure');
      }
      return fakeRunner(command, args, options);
    };

    const result = runSetup({
      argv: ['--only', 'graphify'],
      cwd: target,
      skillRoot,
      runner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir,
      bundledVersion: '1.13.2',
    });

    expect(result.exit_code).toBe(0);
    const facts = result.payload.tool_facts;
    for (const id of ['context7', 'ast-grep-skill']) {
      expect(facts.items.find((entry) => entry.id === id)).toMatchObject({
        result: 'ready',
        install_source: 'mirror',
        mirror_used: true,
        attempts: [
          expect.objectContaining({ exit_code: 1 }),
          expect.objectContaining({ exit_code: 0 }),
        ],
        verification_source: 'post-mutation-probe',
      });
    }
    expect(facts.provider_readiness.find((entry) => entry.provider === 'graphify')).toMatchObject({
      readiness_status: 'fresh',
      install_source: 'official',
      mirror_used: false,
      attempts: [
        expect.objectContaining({ command: 'uv', exit_code: 0 }),
      ],
    });
    const retriedInstalls = calls.filter((call) => (
      (call.command === 'npx' && call.args.some((arg) => String(arg).includes('@upstash/context7-mcp')))
      || (call.command === 'npx' && call.args.includes('ast-grep/agent-skill'))
    ));
    expect(retriedInstalls).toHaveLength(4);
    for (let index = 0; index < retriedInstalls.length; index += 2) {
      expect(retriedInstalls[index].env).not.toHaveProperty('NPM_CONFIG_REGISTRY');
      expect(retriedInstalls[index].env).not.toHaveProperty('npm_config_registry');
      expect(retriedInstalls[index + 1].env).toMatchObject({
        NPM_CONFIG_REGISTRY: 'https://registry.npmmirror.com',
        npm_config_registry: 'https://registry.npmmirror.com',
      });
    }
    const mirrorCalls = calls.filter((call) => (
      Object.prototype.hasOwnProperty.call(call.env, 'NPM_CONFIG_REGISTRY')
      || Object.prototype.hasOwnProperty.call(call.env, 'npm_config_registry')
    ));
    expect(mirrorCalls).toEqual(retriedInstalls.filter((_call, index) => index % 2 === 1));
  });

  test('preserves both failed npm attempts without promoting install success', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('mirror-both-failed');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    installGlobalSkill(homeDir, 'ast-grep');
    const attempts = [];
    const runner = (command, args, options = {}) => {
      if (command === 'npx' && args.some((arg) => String(arg).includes('@upstash/context7-mcp'))) {
        attempts.push({ env: { ...(options.env || {}) } });
        return {
          command,
          argv: args,
          args,
          exit_code: 1,
          signal: null,
          timed_out: false,
          timeout: false,
          stdout: '',
          stderr: 'injected registry failure',
          error: null,
        };
      }
      return fakeRunner(command, args, options);
    };

    const result = runSetup({
      argv: ['--only', 'graphify'],
      cwd: target,
      skillRoot,
      runner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir,
      bundledVersion: '1.13.2',
    });

    expect(attempts).toHaveLength(2);
    expect(attempts[0].env).not.toHaveProperty('NPM_CONFIG_REGISTRY');
    expect(attempts[1].env).toMatchObject({
      NPM_CONFIG_REGISTRY: 'https://registry.npmmirror.com',
      npm_config_registry: 'https://registry.npmmirror.com',
    });
    expect(result).toMatchObject({ exit_code: 1, reason_code: 'tool-install-failed' });
    expect(result.payload.tool_facts.items.find((entry) => entry.id === 'context7')).toMatchObject({
      result: 'action-required',
      install_source: 'both-failed',
      mirror_used: true,
      attempts: [
        expect.objectContaining({ exit_code: 1 }),
        expect.objectContaining({ exit_code: 1 }),
      ],
      verification_source: 'post-mutation-probe',
    });
  });

  test('treats a signaled install as failed and retries it through the configured mirror', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('mirror-signal-retry');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    installGlobalSkill(homeDir, 'ast-grep');
    const attempts = [];
    const runner = (command, args, options = {}) => {
      if (command === 'npx' && args.some((arg) => String(arg).includes('@upstash/context7-mcp'))) {
        attempts.push({ ...options });
        if (attempts.length === 1) {
          return {
            command,
            argv: args,
            args,
            exit_code: null,
            signal: 'SIGTERM',
            timed_out: false,
            timeout: false,
            stdout: '',
            stderr: 'terminated',
            error: null,
          };
        }
      }
      return fakeRunner(command, args, options);
    };

    const result = runSetup({
      argv: ['--only', 'graphify'],
      cwd: target,
      skillRoot,
      runner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir,
      bundledVersion: '1.13.2',
    });

    expect(attempts).toHaveLength(2);
    expect(attempts[0]).toMatchObject({ mirrorAttempt: false, invocationSource: 'official-registry' });
    expect(attempts[1]).toMatchObject({
      mirrorAttempt: true,
      invocationSource: 'configured-mirror',
      env: {
        NPM_CONFIG_REGISTRY: 'https://registry.npmmirror.com',
        npm_config_registry: 'https://registry.npmmirror.com',
      },
    });
    expect(result.exit_code).toBe(0);
    expect(result.payload.tool_facts.items.find((entry) => entry.id === 'context7')).toMatchObject({
      result: 'ready',
      install_source: 'mirror',
      mirror_used: true,
      attempts: [
        expect.objectContaining({ exit_code: null, signal: 'SIGTERM' }),
        expect.objectContaining({ exit_code: 0 }),
      ],
      verification_source: 'post-mutation-probe',
    });
  });

  test('parent verification writes contained summaries and quarantines parent repo-local artifacts', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-workspace-'));
    const first = childRepo(workspace, 'apps/first');
    const second = childRepo(workspace, 'packages/second');
    const parentConfigDir = path.join(workspace, '.spec-first', 'config');
    fs.mkdirSync(parentConfigDir, { recursive: true });
    for (const [name, schemaVersion] of [
      ['tool-facts.json', 'tool-facts.v2'],
      ['runtime-capabilities.json', 'runtime-capabilities.v1'],
    ]) {
      fs.writeFileSync(path.join(parentConfigDir, name), `${JSON.stringify({
        schema_version: schemaVersion,
        generated_at: '2026-07-11T04:00:00.000Z',
        repo_root: first,
      })}\n`);
    }

    const result = runSetup({
      argv: ['--verify-only'],
      cwd: workspace,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    });

    expect(result).toMatchObject({
      exit_code: 1,
      mode: 'verify',
      payload: {
        schema_version: 'workspace-mcp-verify-summary.v1',
        selection_source: 'workspace-default-all-repos',
        parent_writes_repo_local_artifacts: false,
        parent_workspace_pollution_count: 2,
        quarantine_write_status: 'ready',
        counts: { total: 2, ready: 0, action_required: 2 },
      },
    });
    expect(result.payload.results).toEqual(expect.arrayContaining([
      expect.objectContaining({
        overall_status: 'action-required',
        reason_code: 'missing_dependency',
      }),
    ]));
    expect(fs.existsSync(path.join(first, '.spec-first', 'config', 'tool-facts.json'))).toBe(true);
    expect(fs.existsSync(path.join(second, '.spec-first', 'config', 'tool-facts.json'))).toBe(true);
    const summaryDir = path.join(workspace, '.spec-first', 'workspace');
    expect(JSON.parse(fs.readFileSync(path.join(summaryDir, 'parent-artifact-quarantine.json'), 'utf8')))
      .toMatchObject({ schema_version: 'parent-artifact-quarantine.v1' });
    expect(JSON.parse(fs.readFileSync(path.join(summaryDir, 'mcp-verify-summary.json'), 'utf8')))
      .toMatchObject({ schema_version: 'workspace-mcp-verify-summary.v1' });
    expect(fs.readdirSync(summaryDir).some((name) => name.endsWith('.tmp'))).toBe(false);
  });

  test('parent setup consumes selected provider failures and preserves legacy partial summary fields', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-workspace-provider-'));
    const first = childRepo(workspace, 'apps/first');
    const second = childRepo(workspace, 'packages/second');
    writeRuntimeState(first, 'qoder', '1.13.2');
    writeRuntimeState(second, 'qoder', '1.13.2');
    const runner = (command, args, options) => {
      if (options.cwd === first
        && path.basename(command).replace(/\.(?:exe|cmd)$/i, '') === 'graphify'
        && ['extract', 'update'].includes(args[0])) {
        return {
          command,
          argv: args,
          exit_code: 1,
          signal: null,
          timed_out: false,
          stdout: '',
          stderr: 'injected first-generation failure',
          error: null,
        };
      }
      return fakeRunner(command, args, options);
    };

    const result = runSetup({
      argv: ['--only', 'graphify'],
      cwd: workspace,
      skillRoot,
      runner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    });

    expect(result).toMatchObject({
      exit_code: 1,
      reason_code: 'all-repos-partial-or-action-required',
      payload: {
        schema_version: 'workspace-mcp-setup-summary.v1',
        counts: { total: 2, ready: 0, partial: 1, action_required: 1 },
        overall_status: 'partial',
        reason_code: 'all-repos-partial-or-action-required',
        next_action: '检查每个 child 的 reason_code，并为 action-required repo 重新运行 setup。',
      },
    });
    expect(result.payload.results.find((entry) => entry.repo_label === 'apps/first')).toMatchObject({
      exit_code: 1,
      overall_status: 'action-required',
      reason_code: 'graphify-first-generation-failed',
      workspace_relative_path: 'apps/first',
    });
    expect(result.payload.results.every((entry) => !entry.workspace_relative_path.includes('\\'))).toBe(true);
    expect(fs.existsSync(path.join(first, '.spec-first', 'workspace', 'scenario-fingerprint-setup.json'))).toBe(true);
    expect(fs.existsSync(path.join(workspace, 'packages', 'second', '.spec-first', 'workspace', 'scenario-fingerprint-setup.json'))).toBe(true);
    expect(fs.existsSync(path.join(workspace, '.spec-first', 'workspace', 'scenario-fingerprint-setup.json'))).toBe(false);
    expect(fs.existsSync(path.join(workspace, '.spec-first', 'workspace', 'parent-artifact-quarantine.json'))).toBe(false);
  });

  test('parent --plan previews every selected child without writing workspace receipts, facts, host config, or provider artifacts', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-workspace-plan-'));
    const first = childRepo(workspace, 'apps/first');
    const second = childRepo(workspace, 'packages/second');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    const before = snapshot(workspace);
    const homeBefore = snapshot(homeDir);
    const audit = createReadOnlyAuditRunner();

    const result = runSetup({
      argv: ['--plan', '--only', 'graphify', '--all-repos'],
      cwd: workspace,
      skillRoot,
      runner: audit.runner,
      env: {},
      homeDir,
    });

    expect(result).toMatchObject({
      exit_code: 0,
      mode: 'plan',
      payload: {
        schema_version: 'workspace-mcp-plan-summary.v1',
        mutation: false,
        workflow_mode: 'all-repos',
        selection_source: 'explicit-all-repos',
      },
    });
    expect(result.payload.results).toEqual(expect.arrayContaining([
      expect.objectContaining({
        repo_label: 'apps/first',
        workspace_relative_path: 'apps/first',
        result: expect.objectContaining({ schema_version: 'setup-install-plan.v1' }),
      }),
      expect.objectContaining({
        repo_label: 'packages/second',
        workspace_relative_path: 'packages/second',
        result: expect.objectContaining({ schema_version: 'setup-install-plan.v1' }),
      }),
    ]));
    expect(audit.violations).toEqual([]);
    expect(snapshot(workspace)).toEqual(before);
    expect(snapshot(homeDir)).toEqual(homeBefore);
    expect(fs.existsSync(path.join(first, '.spec-first', 'config', 'tool-facts.json'))).toBe(false);
    expect(fs.existsSync(path.join(second, '.graphify', 'graph.json'))).toBe(false);
  });

  test('parent --plan preserves child-specific blockers without falling through to a parent plan', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-workspace-plan-blocker-'));
    const blockedChild = childRepo(workspace, 'apps/blocked');
    const readyChild = childRepo(workspace, 'packages/ready');
    const configPath = path.join(blockedChild, '.qoder', 'settings.local.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({
      mcpServers: { context7: { command: 'user-owned', args: [] } },
    }, null, 2));
    const before = snapshot(workspace);
    const result = runSetup({
      argv: ['--plan', '--only', 'graphify', '--all-repos'],
      cwd: workspace,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
    });

    expect(result).toMatchObject({
      exit_code: 2,
      reason_code: 'workspace-install-plan-blocked',
      payload: { schema_version: 'workspace-mcp-plan-summary.v1', blocked: true },
    });
    expect(result.payload.results).toEqual(expect.arrayContaining([
      expect.objectContaining({
        repo_label: 'apps/blocked',
        exit_code: 2,
        reason_code: 'host-config-conflict',
        result: expect.objectContaining({ target: expect.objectContaining({ target_root: blockedChild }) }),
      }),
      expect.objectContaining({
        repo_label: 'packages/ready',
        exit_code: 0,
        result: expect.objectContaining({ target: expect.objectContaining({ target_root: readyChild }) }),
      }),
    ]));
    expect(snapshot(workspace)).toEqual(before);
    expect(fs.existsSync(path.join(workspace, '.spec-first', 'workspace', 'mcp-setup-summary.json'))).toBe(false);
  });

  test('runs a Codex user-scope host phase once before child mutations and records shared receipts', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const { applyHostConfig } = require('../../skills/spec-runtime-setup/scripts/lib/host-config.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-workspace-shared-host-'));
    const first = childRepo(workspace, 'apps/first');
    const second = childRepo(workspace, 'packages/second');
    writeRuntimeState(first, 'codex', '1.13.2');
    writeRuntimeState(second, 'codex', '1.13.2');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    installGlobalSkill(homeDir, 'ast-grep');
    const calls = [];

    const result = runSetup({
      argv: ['--only', 'graphify', '--all-repos'],
      cwd: workspace,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir,
      bundledVersion: '1.13.2',
      hostConfigApplier(options) {
        calls.push(options.target.config_path);
        return applyHostConfig(options);
      },
    });

    expect(result.exit_code).toBe(1);
    expect(calls).toHaveLength(2);
    expect(new Set(calls)).toEqual(new Set([path.join(homeDir, '.codex', 'config.toml')]));
    expect(result.payload.host_config_phases).toEqual(expect.arrayContaining([
      expect.objectContaining({
        phase: 'shared',
        scope: 'user',
        repo_root: workspace,
        outcome: 'ready',
        config_path: path.join(homeDir, '.codex', 'config.toml'),
      }),
    ]));
    const sharedReceipts = result.payload.host_config_phases.filter((receipt) => receipt.phase === 'shared');
    expect(sharedReceipts).toHaveLength(new Set(sharedReceipts.map((receipt) => receipt.tool)).size);
    expect(result.payload.results.every((entry) => entry.host_config_receipt.every((receipt) => receipt.phase === 'shared'))).toBe(true);
  });

  test('does not enter child mutation when the shared host phase fails', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-workspace-shared-host-failure-'));
    const first = childRepo(workspace, 'apps/first');
    const second = childRepo(workspace, 'packages/second');
    writeRuntimeState(first, 'codex', '1.13.2');
    writeRuntimeState(second, 'codex', '1.13.2');
    const providerCalls = [];

    const result = runSetup({
      argv: ['--only', 'graphify', '--all-repos'],
      cwd: workspace,
      skillRoot,
      runner(command, args, options) {
        if (path.basename(command) === 'graphify' && ['install', 'extract', 'update'].includes(args[0])) {
          providerCalls.push({ command, args, options });
        }
        return fakeRunner(command, args, options);
      },
      env: { MCP_SETUP_HOST: 'codex' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
      hostConfigApplier() {
        return { ok: false, reason_code: 'shared-host-config-injected-failure' };
      },
    });

    expect(result).toMatchObject({
      exit_code: 1,
      reason_code: 'shared-host-config-injected-failure',
      payload: {
        overall_status: 'action-required',
        shared_host_phase: expect.objectContaining({
          status: 'failed',
          reason_code: 'shared-host-config-injected-failure',
          continue_children_on_shared_failure: false,
        }),
      },
    });
    expect(result.payload.results).toHaveLength(2);
    expect(result.payload.results.every((entry) => entry.reason_code === 'shared-host-config-injected-failure')).toBe(true);
    expect(providerCalls).toEqual([]);
    expect(fs.existsSync(path.join(first, '.spec-first', 'config', 'tool-facts.json'))).toBe(false);
    expect(fs.existsSync(path.join(second, '.graphify', 'graph.json'))).toBe(false);
    const summaryPath = path.join(workspace, '.spec-first', 'workspace', 'mcp-setup-summary.json');
    expect(JSON.parse(fs.readFileSync(summaryPath, 'utf8'))).toMatchObject({
      reason_code: 'shared-host-config-injected-failure',
      shared_host_phase: expect.objectContaining({ status: 'failed' }),
      host_config_phases: expect.arrayContaining([
        expect.objectContaining({ phase: 'shared', outcome: 'action-required' }),
      ]),
    });
  });

  test('keeps Qoder local host config mutation in each child phase', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const { applyHostConfig } = require('../../skills/spec-runtime-setup/scripts/lib/host-config.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-workspace-local-host-'));
    const first = childRepo(workspace, 'apps/first');
    const second = childRepo(workspace, 'packages/second');
    writeRuntimeState(first, 'qoder', '1.13.2');
    writeRuntimeState(second, 'qoder', '1.13.2');
    const calls = [];

    const result = runSetup({
      argv: ['--only', 'graphify', '--all-repos'],
      cwd: workspace,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
      hostConfigApplier(options) {
        calls.push(options.target.config_path);
        return applyHostConfig(options);
      },
    });

    expect(result.exit_code).toBe(1);
    expect(calls).toHaveLength(4);
    expect(new Set(calls)).toEqual(new Set([
      path.join(first, '.qoder', 'settings.local.json'),
      path.join(second, '.qoder', 'settings.local.json'),
    ]));
    expect(result.payload.shared_host_phase).toMatchObject({ status: 'skipped', reason_code: 'no-shared-host-config-target' });
    expect(result.payload.results).toEqual(expect.arrayContaining([
      expect.objectContaining({
        repo_label: 'apps/first',
        host_config_receipt: expect.arrayContaining([expect.objectContaining({ phase: 'per_child', scope: 'local', repo_root: first })]),
      }),
      expect.objectContaining({
        repo_label: 'packages/second',
        host_config_receipt: expect.arrayContaining([expect.objectContaining({ phase: 'per_child', scope: 'local', repo_root: second })]),
      }),
    ]));
  });

  test('parent verification reports child manifest counts and manifest-specific next action', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-workspace-manifest-'));
    const first = childRepo(workspace, 'apps/first');
    const second = childRepo(workspace, 'packages/second');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-'));
    const baseInput = {
      argv: ['--only', 'graphify'],
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir,
      bundledVersion: '1.13.2',
    };
    writeRuntimeState(first, 'qoder', '1.13.2');
    writeRuntimeState(second, 'qoder', '1.13.2');
    expect(runSetup({ ...baseInput, cwd: first }).exit_code).toBe(0);
    expect(runSetup({ ...baseInput, cwd: second }).exit_code).toBe(0);
    writeRuntimeState(workspace, 'qoder', '1.13.2');
    writeRuntimeState(first, 'qoder', '1.13.2');
    writeRuntimeState(second, 'qoder', '1.12.0');

    const result = runSetup({
      argv: ['--verify-only'],
      cwd: workspace,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir,
      bundledVersion: '1.13.2',
    });

    expect(result).toMatchObject({
      exit_code: 1,
      reason_code: 'generated-runtime-manifest-refresh-required',
      payload: {
        schema_version: 'workspace-mcp-verify-summary.v1',
        parent_generated_runtime_manifest: { status: 'current' },
        counts: {
          total: 2,
          ready: 0,
          action_required: 2,
          generated_runtime_manifest: { current: 1, stale: 1, missing: 0, unknown: 0 },
        },
        overall_status: 'action-required',
        reason_code: 'generated-runtime-manifest-refresh-required',
        next_action: '从 parent workspace 运行 spec-first init --qoder -y -u <name> 刷新 parent runtime，或对 stale child repo 运行 spec-first init --qoder --repo <child> -y -u <name>，然后重新 verify。',
      },
    });
    expect(result.payload.results.find((entry) => entry.repo_label === 'packages/second')).toMatchObject({
      overall_status: 'action-required',
      reason_code: 'host-config-entry-missing',
      result: {
        schema_version: 'mcp-verify-child-result.v1',
        generated_runtime_manifest: { status: 'stale' },
      },
    });
  });

  test('parent verification fails closed when the workspace summary directory is a symlink', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-workspace-symlink-'));
    childRepo(workspace, 'child');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-summary-outside-'));
    fs.mkdirSync(path.join(workspace, '.spec-first'), { recursive: true });
    fs.symlinkSync(outside, path.join(workspace, '.spec-first', 'workspace'), process.platform === 'win32' ? 'junction' : 'dir');

    const result = runSetup({
      argv: ['--verify-only'],
      cwd: workspace,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    });

    expect(result).toMatchObject({
      exit_code: 1,
      reason_code: 'workspace-summary-symlink-escape',
    });
    expect(fs.readdirSync(outside)).toEqual([]);
  });

  test('continues later child repos and writes a partial summary after one child throws', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-workspace-partial-'));
    const first = childRepo(workspace, 'a');
    const second = childRepo(workspace, 'b');
    fs.mkdirSync(path.join(first, '.gitignore'));

    const result = runSetup({
      argv: ['--verify-only'],
      cwd: workspace,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    });

    expect(result.exit_code).toBe(1);
    expect(result.payload.results.find((entry) => entry.repo_label === 'a')).toMatchObject({
      exit_code: 1,
      overall_status: 'action-required',
      reason_code: 'child-setup-execution-failed',
    });
    expect(fs.existsSync(path.join(second, '.spec-first', 'config', 'tool-facts.json'))).toBe(true);
    expect(fs.existsSync(path.join(workspace, '.spec-first', 'workspace', 'mcp-verify-summary.json'))).toBe(true);
  });

  test('preserves child evidence and fails when the workspace summary cannot be committed', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-workspace-summary-failure-'));
    childRepo(workspace, 'apps/first');
    childRepo(workspace, 'packages/second');
    const result = runSetup({
      argv: ['--verify-only'],
      cwd: workspace,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
      workspaceSummaryWriter() {
        const error = new Error('injected workspace summary failure');
        error.reason_code = 'workspace-summary-injected-failure';
        throw error;
      },
    });

    expect(result).toMatchObject({
      exit_code: 1,
      reason_code: 'workspace-summary-injected-failure',
      payload: {
        schema_version: 'workspace-mcp-verify-summary.v1',
        counts: { total: 2 },
        overall_status: 'action-required',
        summary_write_status: 'failed',
        summary_write_reason_code: 'workspace-summary-injected-failure',
      },
    });
    expect(result.payload.results).toHaveLength(2);
  });

  test('propagates blocked provider plans without running fallback verification as mutation success', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const previewTarget = tempRepo('blocked-provider-preview');
    const previewBefore = snapshot(previewTarget);
    const preview = runSetup({
      argv: ['--plan', '--only', 'graphify', '--requirement-workspace', '../outside'],
      cwd: previewTarget,
      skillRoot,
      runner: fakeRunner,
      env: {},
    });
    expect(preview).toMatchObject({
      exit_code: 2,
      reason_code: 'requirement-workspace-escape',
      payload: {
        schema_version: 'setup-install-plan.v1',
        mutation: false,
        blocked: true,
        reason_code: 'requirement-workspace-escape',
      },
    });
    expect(snapshot(previewTarget)).toEqual(previewBefore);

    const applyTarget = tempRepo('blocked-provider-apply');
    const applied = runSetup({
      argv: ['--only', 'graphify', '--requirement-workspace', '../outside'],
      cwd: applyTarget,
      skillRoot,
      runner: fakeRunner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    });
    expect(fs.existsSync(path.join(applyTarget, '.graphify'))).toBe(false);
    expect(applied).toMatchObject({
      exit_code: 1,
      reason_code: 'requirement-workspace-escape',
    });
    expect(applied.payload.tool_facts.provider_readiness.find((entry) => entry.provider === 'graphify'))
      .toMatchObject({
        readiness_status: 'degraded',
        first_generation: { status: 'failed' },
      });
  });

  test('stops dependent host and provider mutations after a baseline install failure', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const target = tempRepo('baseline-install-failure');
    const calls = [];
    const runner = (command, args, options) => {
      calls.push([command, ...args]);
      if (command === 'npx' && args.some((arg) => String(arg).includes('@upstash/context7-mcp'))) {
        return {
          command,
          argv: args,
          exit_code: 1,
          signal: null,
          timed_out: false,
          stdout: '',
          stderr: 'injected context7 warmup failure',
          error: null,
        };
      }
      return fakeRunner(command, args, options);
    };
    const result = runSetup({
      argv: ['--only', 'graphify'],
      cwd: target,
      skillRoot,
      runner,
      env: { MCP_SETUP_HOST: 'qoder' },
      homeDir: fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-entry-home-')),
      bundledVersion: '1.13.2',
    });

    expect(fs.existsSync(path.join(target, '.graphify'))).toBe(false);
    expect(calls.some((call) => call[0] === 'graphify' && ['install', 'extract', 'update'].includes(call[1]))).toBe(false);
    const hostConfig = JSON.parse(fs.readFileSync(path.join(target, '.qoder', 'settings.local.json'), 'utf8'));
    expect(Object.keys(hostConfig.mcpServers)).toEqual(['sequential-thinking']);
    expect(result.payload.tool_facts.items.find((entry) => entry.id === 'context7')).toMatchObject({
      result: 'action-required',
      reason_code: 'tool-install-failed',
    });
    expect(result.payload.tool_facts.provider_readiness.find((entry) => entry.provider === 'graphify'))
      .toMatchObject({ readiness_status: 'degraded' });
    expect(result).toMatchObject({
      exit_code: 1,
      reason_code: 'tool-install-failed',
    });
  });

  test('unknown provider and missing mutation host fail closed with zero writes', () => {
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const unknownTarget = tempRepo('unknown');
    const unknownBefore = snapshot(unknownTarget);
    expect(runSetup({
      argv: ['--only', 'unknown'],
      cwd: unknownTarget,
      skillRoot,
      runner: fakeRunner,
      env: {},
    })).toMatchObject({ exit_code: 2, reason_code: 'unknown-optional-provider-selection' });
    expect(snapshot(unknownTarget)).toEqual(unknownBefore);

    const noHostTarget = tempRepo('no-host');
    const noHostBefore = snapshot(noHostTarget);
    expect(runSetup({
      argv: ['--verify-only'],
      cwd: noHostTarget,
      skillRoot,
      runner: fakeRunner,
      env: {},
    })).toMatchObject({ exit_code: 2, reason_code: 'host-authority-required' });
    expect(snapshot(noHostTarget)).toEqual(noHostBefore);
  });
});
