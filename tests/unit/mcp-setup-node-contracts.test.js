'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const skillRoot = path.join(repoRoot, 'skills', 'spec-runtime-setup');

function historicalBaselinePath(sourcePath) {
  return String(sourcePath || '').replace(
    /^skills\/spec-runtime-setup(?=\/|$)/,
    'skills/spec-mcp-setup',
  );
}

function readFixture(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'tests', 'fixtures', 'mcp-setup', relativePath), 'utf8'));
}

function confirmedMismatchesFor(platformDifferences, platform) {
  return platformDifferences.decisions
    .filter((entry) => Array.isArray(entry.confirmed_mismatches)
      && (!Array.isArray(entry.platforms) || entry.platforms.includes(platform)))
    .flatMap((entry) => entry.confirmed_mismatches);
}

function initializeGitRepo(root) {
  const result = spawnSync('git', ['init', '-q', root], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  const hooks = spawnSync('git', ['-C', root, 'config', '--local', 'core.hooksPath', '.git/hooks'], { encoding: 'utf8' });
  if (hooks.status !== 0) throw new Error(hooks.stderr || hooks.stdout);
}

function tempRepo(label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-parity-${label}-`));
  initializeGitRepo(root);
  return root;
}

function writeCurrentRuntimeState(repoRoot, host = 'qoder') {
  const runtimeRoots = {
    claude: '.claude',
    codex: '.codex',
    cursor: '.cursor',
    kiro: '.kiro',
    qoder: '.qoder',
  };
  const statePath = path.join(repoRoot, runtimeRoots[host], 'spec-first', 'state.json');
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, '{"manifestVersion":"1.13.2"}\n');
}

function fileSnapshot(root) {
  const result = new Map();
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else result.set(path.relative(root, absolute).split(path.sep).join('/'), fs.readFileSync(absolute).toString('base64'));
    }
  }
  visit(root);
  return result;
}

function changedPaths(before, after) {
  return [...new Set([...before.keys(), ...after.keys()])]
    .filter((entry) => before.get(entry) !== after.get(entry));
}

function parityRunner(calls) {
  return (command, args, options = {}) => {
    calls.push([command, ...args]);
    const cwd = options.cwd || process.cwd();
    const graphifyCommand = path.basename(command).replace(/\.(?:exe|cmd)$/i, '') === 'graphify';
    if (command === 'uv' && args[0] === 'tool' && args[1] === 'install') {
      const home = options.env && options.env.HOME;
      const binDir = path.join(home, '.local', 'bin');
      const toolBin = path.join(home, '.local', 'share', 'uv', 'tools', 'graphifyy', 'bin');
      fs.mkdirSync(binDir, { recursive: true });
      fs.mkdirSync(toolBin, { recursive: true });
      fs.writeFileSync(path.join(toolBin, 'python'), '#!/bin/sh\n');
      fs.writeFileSync(path.join(binDir, 'graphify'), `#!${path.join(toolBin, 'python')}\n`);
      fs.chmodSync(path.join(toolBin, 'python'), 0o755);
      fs.chmodSync(path.join(binDir, 'graphify'), 0o755);
    }
    if (graphifyCommand && args[0] === 'install' && args[1] === '--project') {
      const platform = args[3] || 'codex';
      const roots = { claude: '.claude', cursor: '.cursor', kiro: '.kiro', qoder: '.qoder' };
      const skillDir = path.join(cwd, roots[platform] || '.codex', 'skills', 'graphify');
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Graphify\n');
    }
    if (graphifyCommand && ['extract', 'update'].includes(args[0])) {
      const artifact = path.resolve(cwd, (options.env && options.env.GRAPHIFY_OUT) || 'graphify-out');
      fs.mkdirSync(artifact, { recursive: true });
      fs.writeFileSync(path.join(artifact, 'graph.json'), JSON.stringify({ nodes: [{ id: 'fixture' }], links: [] }));
    }
    if (graphifyCommand && args[0] === 'hook' && args[1] === 'install') {
      const interpreter = path.join(options.env.HOME, '.local', 'share', 'uv', 'tools', 'graphifyy', 'bin', 'python');
      const hooks = options.env && options.env.GIT_CONFIG_VALUE_0
        ? options.env.GIT_CONFIG_VALUE_0
        : path.join(cwd, '.git', 'hooks');
      fs.mkdirSync(hooks, { recursive: true });
      for (const [name, markers] of Object.entries({ 'post-commit': ['# graphify-hook-start', '# graphify-hook-end'], 'post-checkout': ['# graphify-checkout-hook-start', '# graphify-checkout-hook-end'] })) {
        fs.writeFileSync(path.join(hooks, name), ['#!/bin/sh', markers[0], `_PINNED='${interpreter}'`, "_out = os.environ.get('GRAPHIFY_OUT', 'graphify-out')", 'from graphify.watch import _rebuild_code', markers[1]].join('\n'));
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
          ? JSON.stringify({ version: '0.9.29', packages: [['graphifyy', '0.9.29']] })
          : '3.12.1')
        : (graphifyCommand && args[0] === '--version'
          ? 'graphify 0.9.29'
          : (command === 'uv' && args.join(' ') === 'tool dir --bin'
            ? path.join(options.env.HOME, '.local', 'bin')
            : (args[0] === 'status' ? 'ready' : 'ok'))),
      stderr: '',
      error: null,
    };
  };
}

function classifyEffects(repoBefore, repoAfter, homeBefore, homeAfter, calls) {
  const paths = changedPaths(repoBefore, repoAfter);
  const homePaths = changedPaths(homeBefore, homeAfter);
  const effects = new Set();
  if (paths.some((entry) => entry.startsWith('.spec-first/config/') || entry === '.spec-first/workspace/scenario-fingerprint-setup.json')) {
    effects.add('setup-facts');
  }
  if (paths.some((entry) => entry === '.spec-first/config.local.example.yaml'
    || entry === '.spec-first/config.local.yaml'
    || entry === '.gitignore'
    || entry === 'compound-engineering.local.md')) {
    effects.add('project-config');
  }
  if (paths.some((entry) => /^\.(?:claude|codex|cursor|kiro|opencode|qoder)\//.test(entry))) effects.add('host-config');
  if (calls.some(([command, first, second]) => path.basename(command).replace(/\.(?:exe|cmd)$/i, '') === 'graphify'
    && (['install', 'extract', 'update'].includes(first) || (first === 'hook' && second === 'install')))) {
    effects.add('provider-mutation');
  }
  const hostLedgerPattern = /^\.(?:claude|codex|cursor|kiro|opencode|qoder)\/spec-first\/host-setup\.json$/;
  if (homePaths.some((entry) => hostLedgerPattern.test(entry))) effects.add('setup-facts');
  if (homePaths.some((entry) => !hostLedgerPattern.test(entry))) effects.add('home');
  return [...effects].sort();
}

function runModeCharacterization(platform, contract) {
  const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
  const target = tempRepo(`${platform}-${contract.artifact_schema}`);
  const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-parity-home-'));
  const skillDir = path.join(homeDir, '.agents', 'skills', 'ast-grep');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# ast-grep\n');
  // 该套件刻画 legacy mode 的既有合同行为；current projection 由专属
  // preflight 测试覆盖，避免把缺失 runtime state 误当作 legacy mode 语义变更。
  writeCurrentRuntimeState(target);
  if (contract.argv.includes('--refresh')) {
    fs.mkdirSync(path.join(target, 'graphify-out'), { recursive: true });
    fs.writeFileSync(path.join(target, 'graphify-out', 'graph.json'), '{}\n');
  }
  const repoBefore = fileSnapshot(target);
  const homeBefore = fileSnapshot(homeDir);
  const calls = [];
  const result = runSetup({
    argv: contract.argv,
    cwd: target,
    skillRoot,
    runner: parityRunner(calls),
    env: { MCP_SETUP_HOST: 'qoder' },
    homeDir,
    bundledVersion: '1.13.2',
    platform: platform === 'windows' ? 'win32' : 'linux',
  });
  return {
    result,
    effects: classifyEffects(repoBefore, fileSnapshot(target), homeBefore, fileSnapshot(homeDir), calls),
    target,
  };
}

function expectFields(value, fields) {
  expect(value).toBeTruthy();
  expect(Object.keys(value)).toEqual(expect.arrayContaining(fields));
}

function runWorkspaceCharacterization(argv, label) {
  const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-parity-workspace-${label}-`));
  const child = path.join(workspace, 'child');
  fs.mkdirSync(child, { recursive: true });
  initializeGitRepo(child);
  writeCurrentRuntimeState(child);
  const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-parity-home-'));
  const skillDir = path.join(homeDir, '.agents', 'skills', 'ast-grep');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# ast-grep\n');
  return runSetup({
    argv: [...argv, '--all-repos'],
    cwd: workspace,
    skillRoot,
    runner: parityRunner([]),
    env: { MCP_SETUP_HOST: 'qoder' },
    homeDir,
    bundledVersion: '1.13.2',
  });
}

describe('spec-runtime-setup unified Node contract', () => {
  test('uses helper-specific detection argv instead of assuming --version', () => {
    const { probeHelper } = require('../../skills/spec-runtime-setup/scripts/lib/installation-executor.cjs');
    const calls = [];
    const result = probeHelper({
      homeDir: os.homedir(),
      runner: (command, args) => {
        calls.push([command, ...args]);
        return {
          command,
          argv: args,
          args,
          exit_code: args[0] === '-version' ? 0 : 1,
          signal: null,
          timed_out: false,
          timeout: false,
          stdout: 'ffmpeg version 8.1.2',
          stderr: '',
          error: null,
        };
      },
    }, process.cwd(), {
      id: 'ffmpeg',
      kind: 'cli',
      detection: { kind: 'command', command: 'ffmpeg', args: ['-version'] },
      installation: { next_action: '安装 ffmpeg' },
    });

    expect(calls).toEqual([['ffmpeg', '-version']]);
    expect(result).toMatchObject({ status: 'ready', reason_code: 'ready' });
  });

  test('keeps agent-browser dependency ready while exact-origin execution remains blocked', () => {
    const { probeHelper } = require('../../skills/spec-runtime-setup/scripts/lib/installation-executor.cjs');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-agent-browser-home-'));
    fs.mkdirSync(path.join(homeDir, '.agent-browser'), { recursive: true });
    fs.writeFileSync(path.join(homeDir, '.agent-browser', 'spec-first-install.json'), '{}\n');
    fs.mkdirSync(path.join(homeDir, '.agents', 'skills', 'agent-browser'), { recursive: true });
    fs.writeFileSync(path.join(homeDir, '.agents', 'skills', 'agent-browser', 'SKILL.md'), '# agent-browser\n');
    const help = [
      'open <url>', 'snapshot', 'get <what>', 'console', 'network <action>', 'vitals [url]',
      'set <setting> [value]', 'viewport <w> <h>', 'screenshot [path]', 'close',
      '--session <name>', '--namespace <name>', '--config <path>', '--content-boundaries',
      '--max-output <chars>', '--allowed-domains <list>', '--action-policy <path>',
      '--screenshot-dir <path>', '--json',
    ].join('\n');
    const calls = [];

    const result = probeHelper({
      homeDir,
      env: {},
      runner: (command, args) => {
        calls.push([command, ...args]);
        return {
          exit_code: 0,
          signal: null,
          timed_out: false,
          timeout: false,
          stdout: args.includes('--version') ? 'agent-browser 0.33.1\n' : help,
          stderr: '',
          error: null,
        };
      },
    }, process.cwd(), {
      id: 'agent-browser',
      kind: 'browser-helper',
      detection: { kind: 'agent-browser', command: 'agent-browser', skill_name: 'agent-browser' },
      installation: { next_action: '安装 agent-browser' },
    });

    expect(result).toMatchObject({
      status: 'degraded',
      dependency_status: 'ready',
      execution_readiness: 'blocked',
      conformance_status: 'not_run',
      repair_scope: 'provider',
      reason_code: 'exact-origin-capability-unavailable',
    });
    expect(result.next_action).toContain('request-time exact-origin');
    expect(calls).toEqual([
      ['agent-browser', '--version'],
      ['agent-browser', '--help'],
    ]);
  });

  test('keeps the entrypoint thin and exposes explicit runtime owner modules', () => {
    const setupPath = path.join(skillRoot, 'scripts', 'setup.cjs');
    const owners = [
      ['baseline-policy.cjs', ['isBaselineBlocking']],
      ['scenario-fingerprint.cjs', ['generateSetupScenarioFingerprint', 'scenarioFingerprintFailure']],
      ['human-output.cjs', ['advisoryHostCandidates', 'diagnosticNextActions', 'renderDiagnosticHuman']],
      ['workspace-executor.cjs', ['runWorkspaceBatch', 'buildWorkspaceSetupSummary', 'buildWorkspaceVerifySummary']],
      ['installation-executor.cjs', ['installBaselineTools', 'installBaselineHelpers', 'probeRegistry']],
      ['runtime-executor.cjs', ['runVerificationOrMutation', 'computeGeneratedRuntimeManifestHealth', 'firstSelectedProviderFailure']],
    ];

    expect(fs.readFileSync(setupPath, 'utf8').split(/\r?\n/).length).toBeLessThan(900);
    for (const [fileName, exportedNames] of owners) {
      const ownerPath = path.join(skillRoot, 'scripts', 'lib', fileName);
      expect(fs.existsSync(ownerPath)).toBe(true);
      const owner = require(ownerPath);
      for (const exportedName of exportedNames) expect(typeof owner[exportedName]).toBe('function');
    }
  });

  test('loads one schema v9 registry without jq', () => {
    const { loadRegistry } = require('../../skills/spec-runtime-setup/scripts/lib/registry.cjs');
    const registry = loadRegistry({ skillRoot });

    expect(registry.schema_version).toBe('setup-registry.v9');
    expect(registry.tools.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['sequential-thinking', 'context7', 'codegraph']),
    );
    expect(registry.helpers.map((entry) => entry.id)).not.toContain('jq');
    expect(registry.providers.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['codegraph', 'graphify']),
    );
  });

  test('逐项消费 legacy source、jq reference 与 active consumer inventory', () => {
    const inventory = readFixture('active-consumers.json');
    const owners = new Map(inventory.entries.map((entry) => [entry.id, entry]));

    expect(inventory).toMatchObject({
      schema_version: 'mcp-setup-active-consumers.v2',
      baseline_commit: 'a574194b13ee3e53e1d7cd36bbfc86ac058db0cc',
    });
    expect(new Set(inventory.legacy_source_inventory.map((entry) => entry.path)).size).toBe(46);
    expect(inventory.legacy_source_inventory.filter((entry) => entry.path.endsWith('.sh'))).toHaveLength(19);
    expect(inventory.legacy_source_inventory.filter((entry) => entry.path.endsWith('.ps1'))).toHaveLength(19);
    expect(inventory.legacy_source_inventory.filter((entry) => entry.path.endsWith('.cjs'))).toHaveLength(5);
    expect(inventory.legacy_source_inventory.filter((entry) =>
      /\/(?:mcp-tools|helper-tools|provider-tools)\.json$/.test(entry.path)
    )).toHaveLength(3);

    for (const item of inventory.legacy_source_inventory) {
      const owner = owners.get(item.owner_id);
      expect(owner).toBeDefined();
      expect(owner.classification).toBe(item.classification);
      expect(owner.replacement_owner).not.toEqual([]);
      for (const replacement of owner.replacement_owner) {
        if (/^(?:skills|src|scripts|templates|tests|\.github)\//.test(replacement)) {
          expect(fs.existsSync(path.join(repoRoot, replacement))).toBe(true);
        }
      }
      expect(fs.existsSync(path.join(repoRoot, item.path))).toBe(false);
      const baseline = spawnSync(
        'git',
        ['cat-file', '-e', `${inventory.baseline_commit}:${historicalBaselinePath(item.path)}`],
        { cwd: repoRoot, encoding: 'utf8' },
      );
      expect(baseline.status).toBe(0);
    }

    const activeConsumers = new Set(inventory.entries.flatMap((entry) => entry.active_consumers));
    for (const surface of inventory.required_consumer_surfaces) {
      expect(fs.existsSync(path.join(repoRoot, surface.path))).toBe(true);
      expect(activeConsumers.has(surface.path)).toBe(true);
    }

    const jqOwner = owners.get(inventory.jq_reference_inventory.owner_id);
    expect(jqOwner).toMatchObject({ classification: 'retire' });
    expect(inventory.jq_reference_inventory.source_paths).toHaveLength(20);
    for (const sourcePath of inventory.jq_reference_inventory.source_paths) {
      const baseline = spawnSync(
        'git',
        ['show', `${inventory.baseline_commit}:${historicalBaselinePath(sourcePath)}`],
        { cwd: repoRoot, encoding: 'utf8' },
      );
      expect(baseline.status).toBe(0);
      expect(baseline.stdout).toMatch(/(^|[^A-Za-z0-9_])jq([^A-Za-z0-9_]|$)/);
    }
  });

  test.each(['posix', 'windows'])('builds the same explicit mode policy for %s fixtures', (platform) => {
    const { buildActionPlan } = require('../../skills/spec-runtime-setup/scripts/lib/mode-policy.cjs');
    const fixture = readFixture(`legacy-parity/${platform}/runtime-contracts.json`);
    expect(fixture.schema_version).toBe('mcp-setup-legacy-parity.v2');
    expect(fixture.provenance).toMatchObject({
      source_sha: expect.stringMatching(/^[0-9a-f]{40}$/),
      capture_status: 'partial',
      authority_level: 'confirmed-runtime',
      reason_code: 'legacy-runtime-reason-unavailable',
      capture_command: expect.stringContaining(`--platform ${platform}`),
      ci_validation_command: expect.stringContaining('mcp-setup-node-contracts.test.js'),
    });
    if (platform === 'windows') {
      expect(fixture.provenance).toMatchObject({
        capture_run_id: 29153023637,
        capture_run_url: 'https://github.com/sunrain520/spec-first/actions/runs/29153023637',
        capture_matrix: ['node-20', 'node-22'],
        normalized_capture_sha256: '7b4e2376b801792f2c5a8d05c7fcdd86eab0af95841fa163e6fcb578acb341aa',
      });
    }
    expect(fixture.provenance.limitations).not.toEqual([]);
    expect(fixture.provenance.source_files.length).toBeGreaterThan(0);
    for (const source of fixture.provenance.source_files) {
      const replay = spawnSync('git', ['show', `${fixture.provenance.source_sha}:${historicalBaselinePath(source.path)}`], {
        cwd: repoRoot,
        encoding: null,
      });
      expect(replay.status).toBe(0);
      expect(crypto.createHash('sha256').update(replay.stdout).digest('hex')).toBe(source.sha256);
    }
    for (const [expectedMode, contract] of Object.entries(fixture.modes)) {
      expect(contract.runtime_capture).toMatchObject({
        owner: expect.any(String),
      });
      expect(['confirmed', 'degraded']).toContain(contract.runtime_capture.capture_status);
      expect(Number.isInteger(contract.runtime_capture.raw_exit_code)).toBe(true);
      expect(contract.runtime_capture).toHaveProperty('raw_reason_code');
      expect(contract.runtime_capture).toHaveProperty('raw_artifact_schema');
      expect(Array.isArray(contract.runtime_capture.raw_artifact_schemas)).toBe(true);
      const plan = buildActionPlan({ argv: contract.argv, knownIds: ['codegraph', 'graphify'] });
      expect(plan.blocked).toBe(false);
      expect(plan.mode).toBe(expectedMode);
      expect(plan.mutation).toBe(contract.mutation);
      expect(plan.capabilities).toEqual(contract.capabilities);

      const observed = runModeCharacterization(platform, contract);
      expect(observed.result.exit_code).toBe(contract.exit_code);
      expect(observed.result.reason_code).toBe(contract.reason_code);
      expect(observed.result.payload.schema_version).toBe(contract.artifact_schema);
      const expectedEffects = [...contract.side_effect_categories];
      if (['only', 'graphify-refresh'].includes(expectedMode)) expectedEffects.push('home');
      expect(observed.effects).toEqual([...new Set(expectedEffects)].sort());
      expectFields(observed.result.payload, fixture.artifacts[contract.artifact_schema]);
      if (observed.result.payload.runtime) {
        expectFields(observed.result.payload.runtime, fixture.artifacts['spec-runtime-setup-diagnostic-snapshot.v1']);
      }
      if (observed.result.payload.tool_facts) {
        expectFields(observed.result.payload.tool_facts, fixture.artifacts['tool-facts.v2']);
        expectFields(observed.result.payload.runtime_capabilities, fixture.artifacts['runtime-capabilities.v1']);
      }
    }
  });

  test.each(['posix', 'windows'])('fails closed for every invalid %s characterization case', (platform) => {
    const { buildActionPlan } = require('../../skills/spec-runtime-setup/scripts/lib/mode-policy.cjs');
    const { runSetup } = require('../../skills/spec-runtime-setup/scripts/setup.cjs');
    const fixture = readFixture(`legacy-parity/${platform}/runtime-contracts.json`);

    for (const contract of fixture.invalid) {
      expect(contract.runtime_capture).toMatchObject({
        owner: expect.any(String),
      });
      expect(['confirmed', 'degraded']).toContain(contract.runtime_capture.capture_status);
      expect(Number.isInteger(contract.runtime_capture.raw_exit_code)).toBe(true);
      expect(contract.runtime_capture).toHaveProperty('raw_reason_code');
      expect(contract.runtime_capture).toHaveProperty('raw_artifact_schema');
      expect(Array.isArray(contract.runtime_capture.raw_artifact_schemas)).toBe(true);
      expect(buildActionPlan({ argv: contract.argv, knownIds: ['codegraph', 'graphify'] })).toMatchObject({
        blocked: true,
        reason_code: contract.reason_code,
        mutation: false,
      });
      const target = tempRepo(`invalid-${platform}-${contract.id}`);
      const before = fileSnapshot(target);
      const result = runSetup({ argv: contract.argv, cwd: target, skillRoot, runner: parityRunner([]), env: {} });
      expect(result).toMatchObject({ exit_code: contract.exit_code, reason_code: contract.reason_code });
      expect(result.payload.schema_version).toBe(contract.artifact_schema);
      expectFields(result.payload, fixture.artifacts[contract.artifact_schema]);
      expect(changedPaths(before, fileSnapshot(target))).toEqual(contract.side_effect_categories);
    }
  });

  (process.platform === 'win32' ? test.skip : test)('materializes and executes the baseline POSIX canonical owners', () => {
    const { replay } = require('../fixtures/mcp-setup/legacy-parity/replay-runtime-contracts.cjs');
    const fixture = readFixture('legacy-parity/posix/runtime-contracts.json');
    const platformDifferences = readFixture('platform-differences.json');
    const result = replay({ repoRoot, platform: 'posix', source: fixture.provenance.source_sha });

    expect(result).toMatchObject({
      capture_status: 'partial',
      authority_level: 'confirmed-runtime',
      runtime_replay: 'executed',
      reason_code: 'legacy-runtime-scenario-degraded',
      capture_reason_code: 'legacy-runtime-reason-unavailable',
      fixture_capture_verified: true,
    });
    expect(result.source_files_materialized).toBeGreaterThan(52);
    expect(result.modes.plan.capture_status).toBe('confirmed');
    for (const mode of ['bare', 'check', 'verify', 'project-config', 'only', 'graphify-refresh']) {
      expect(result.modes[mode]).toMatchObject({
        capture_status: 'degraded',
        capture_reason_code: 'legacy-runtime-reason-unavailable',
        raw_reason_code: null,
        reason_code: null,
      });
    }
    expect(result.modes.verify).toMatchObject({
      raw_exit_code: 0,
      raw_artifact_schema: null,
      raw_artifact_schemas: ['runtime-capabilities.v1', 'tool-facts.v2', 'v2'],
    });
    expect(result.invalid['refresh-without-only-graphify']).toMatchObject({
      capture_status: 'degraded',
      capture_reason_code: 'legacy-runtime-reason-unavailable',
      raw_exit_code: 0,
      raw_reason_code: null,
      side_effect_categories: ['host-config'],
    });
    expect(result.invalid['repo-and-all-repos']).toMatchObject({
      capture_status: 'confirmed',
      raw_reason_code: 'all-repos-conflicts-with-repo',
      reason_code: 'repo-and-all-repos',
      raw_artifact_schema: 'workspace-mcp-setup-summary.v1',
    });
    const adjudications = platformDifferences.decisions
      .filter((entry) => Array.isArray(entry.confirmed_mismatches)
        && (!Array.isArray(entry.platforms) || entry.platforms.includes('posix')));
    expect(adjudications).toEqual([
      expect.objectContaining({
        id: 'verify-readiness-exit-code',
        classification: 'legacy-defect',
        confirmed_mismatches: ['verify:exit_code:0!=1'],
        canonical_expected_result: expect.stringContaining('非零退出'),
        rationale: expect.stringContaining('fail closed'),
      }),
      expect.objectContaining({
        id: 'refresh-requires-explicit-graphify-selection',
        classification: 'legacy-defect',
        confirmed_mismatches: [
          'refresh-without-only-graphify:invalid-outcome',
          'refresh-without-only-graphify:mutated-state',
        ],
        canonical_expected_result: expect.stringContaining('零副作用'),
        rationale: expect.stringContaining('fail closed'),
      }),
    ]);
    expect(result.contract_mismatches).toEqual(
      confirmedMismatchesFor(platformDifferences, 'posix'),
    );
    expect(platformDifferences.decisions).toContainEqual(expect.objectContaining({
      id: 'windows-project-config-new-item-literalpath',
      platforms: ['windows'],
      classification: 'legacy-defect',
      confirmed_mismatches: ['project-config:exit_code:1!=0'],
      canonical_expected_result: expect.stringContaining('以 0 退出'),
    }));
  }, 60000);

  test('executes Windows replay only on win32 CI', () => {
    const { replay } = require('../fixtures/mcp-setup/legacy-parity/replay-runtime-contracts.cjs');
    const fixture = readFixture('legacy-parity/windows/runtime-contracts.json');
    const platformDifferences = readFixture('platform-differences.json');
    const result = replay({ repoRoot, platform: 'windows', source: fixture.provenance.source_sha });

    if (process.platform === 'win32') {
      const adjudicatedMismatches = confirmedMismatchesFor(platformDifferences, 'windows');
      expect(result).toMatchObject({
        authority_level: 'confirmed-runtime',
        runtime_replay: 'executed',
        fixture_capture_verified: true,
      });
      expect(Object.values(result.modes).every((entry) => Number.isInteger(entry.raw_exit_code))).toBe(true);
      for (const mode of ['verify', 'only', 'graphify-refresh']) {
        expect(result.modes[mode].raw_stderr).not.toContain('Cannot find module');
      }
      expect([...result.contract_mismatches].sort()).toEqual([...adjudicatedMismatches].sort());
    } else {
      expect(result).toMatchObject({
        capture_status: 'skipped',
        runtime_replay: 'windows-ci-only',
        reason_code: 'windows-runtime-required',
        capture_reason_code: 'windows-runtime-required',
        fixture_capture_verified: false,
      });
    }
  }, 60000);

  test('consumes every recorded artifact field set against a Node producer', () => {
    const fixture = readFixture('legacy-parity/posix/runtime-contracts.json');
    const samples = {};
    for (const mode of ['bare', 'plan', 'verify', 'project-config']) {
      const observed = runModeCharacterization('posix', fixture.modes[mode]);
      samples[observed.result.payload.schema_version] = observed.result.payload;
      if (observed.result.payload.runtime) {
        samples[observed.result.payload.runtime.schema_version] = observed.result.payload.runtime;
      }
      if (observed.result.payload.tool_facts) {
        samples[observed.result.payload.tool_facts.schema_version] = observed.result.payload.tool_facts;
        samples[observed.result.payload.runtime_capabilities.schema_version] = observed.result.payload.runtime_capabilities;
      }
    }
    for (const [argv, label] of [
      [['--only', 'graphify'], 'setup'],
      [['--verify-only'], 'verify'],
      [['--project-config'], 'project-config'],
    ]) {
      const result = runWorkspaceCharacterization(argv, label);
      samples[result.payload.schema_version] = result.payload;
    }
    const { inspectProjectConfig } = require('../../skills/spec-runtime-setup/scripts/lib/project-config.cjs');
    const projectStatus = inspectProjectConfig({
      repoRoot: tempRepo('project-status'),
      templatePath: path.join(skillRoot, 'references', 'config-template.yaml'),
    });
    samples[projectStatus.schema_version] = projectStatus;

    expect(Object.keys(samples).sort()).toEqual(Object.keys(fixture.artifacts).sort());
    for (const [schema, fields] of Object.entries(fixture.artifacts)) {
      expectFields(samples[schema], fields);
    }
  });

  test('treats host auto-detection as advisory and requires an explicit pin for mutation', () => {
    const { resolveHostAuthority } = require('../../skills/spec-runtime-setup/scripts/lib/host-authority.cjs');

    expect(resolveHostAuthority({ env: {}, mutationRequested: false, candidates: ['codex'] })).toMatchObject({
      status: 'advisory',
      host: null,
      candidates: ['codex'],
    });
    expect(resolveHostAuthority({ env: {}, mutationRequested: true, candidates: ['codex'] })).toMatchObject({
      status: 'blocked',
      reason_code: 'host-authority-required',
    });
    expect(resolveHostAuthority({ env: { MCP_SETUP_HOST: 'qoder' }, mutationRequested: true })).toMatchObject({
      status: 'ready',
      host: 'qoder',
      authority_source: 'MCP_SETUP_HOST',
    });
    expect(resolveHostAuthority({ env: { MCP_SETUP_HOST: 'opencode' }, mutationRequested: true })).toMatchObject({
      status: 'ready',
      host: 'opencode',
      authority_source: 'MCP_SETUP_HOST',
    });
  });

  test('resolves a selected repo and blocks paths outside the invocation workspace', () => {
    const { resolveProjectTarget } = require('../../skills/spec-runtime-setup/scripts/lib/project-target.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-mcp-target-'));
    const child = path.join(workspace, 'child');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-mcp-outside-'));
    const initialized = spawnSync('git', ['init', '-q', child], { encoding: 'utf8' });
    expect(initialized.status).toBe(0);

    expect(resolveProjectTarget({ cwd: workspace, repo: child })).toMatchObject({
      mode: 'git-repo',
      selection_source: 'explicit-repo',
      state_write_allowed: true,
      target_root: child,
    });
    expect(resolveProjectTarget({ cwd: workspace, repo: outside })).toMatchObject({
      mode: 'invalid-target',
      reason_code: 'repo-target-outside-workspace',
      state_write_allowed: false,
    });
  });
});
