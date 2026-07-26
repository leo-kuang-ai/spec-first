'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateAgainstSchema } = require('../../src/contracts/schema-validator');

const repoRoot = path.resolve(__dirname, '..', '..');
const toolFactsSchema = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs', 'contracts', 'tool-facts.schema.json'), 'utf8'));
const canonicalHosts = ['claude', 'codex', 'cursor', 'kiro', 'qoder'];

function tempRepo(label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-${label}-`));
  fs.mkdirSync(path.join(root, '.git'), { recursive: true });
  return root;
}

function registryFixture() {
  return {
    tools: [
      { id: 'context7', required: true, baseline_blocking: true, category: 'mcp' },
      { id: 'codegraph', required: false, baseline_blocking: false, category: 'mcp' },
    ],
    helpers: [
      { id: 'gh', required: true, baseline_blocking: true, kind: 'cli', profiles: ['minimal'] },
    ],
  };
}

describe('spec-runtime-setup facts reconciliation', () => {
  test('scans configured commands and reports undeclared dependencies or degraded scan visibility', () => {
    const { scanConfiguredDependencies } = require('../../skills/spec-runtime-setup/scripts/lib/configured-dependencies.cjs');
    const target = tempRepo('configured-scan');
    fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({
      scripts: {
        setup: 'unknown-setup-cli --prepare',
        test: 'node test.js',
      },
    }));
    const registry = registryFixture();
    const scanned = scanConfiguredDependencies({
      repoRoot: target,
      registry,
      env: process.env,
      factsTools: {
        context7: {
          dependency_status: 'ready',
          configured_status: 'ready',
        },
        codegraph: {
          dependency_status: 'ready',
          configured_status: 'registry-args-drift',
        },
      },
    });
    expect(scanned).toMatchObject({
      schema_version: 'configured-dependency-scan.v1',
      status: 'ok',
    });
    expect(scanned.configured_dependencies).toContainEqual(expect.objectContaining({
      id: 'setup-script:setup',
      command: 'unknown-setup-cli',
      declared_status: 'undeclared',
      result: 'action-required',
      reason_code: 'configured-dependency-undeclared',
    }));
    expect(scanned.configured_dependencies).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'mcp-config:context7',
        kind: 'mcp-config',
        result: 'ready',
        reason_code: 'configured-dependency-from-mcp-registry',
      }),
      expect.objectContaining({
        id: 'mcp-config:codegraph',
        result: 'degraded',
        reason_code: 'host-config-version-drift',
      }),
    ]));

    fs.mkdirSync(path.join(target, '.codex'), { recursive: true });
    fs.writeFileSync(path.join(target, '.codex', 'hooks.json'), '{ invalid');
    expect(scanConfiguredDependencies({ repoRoot: target, registry, env: process.env })).toMatchObject({
      status: 'scan-failed',
      reason_code: 'configured-dependency-scan-failed',
      configured_dependencies: expect.arrayContaining([
        expect.objectContaining({ reason_code: 'configured-source-unreadable' }),
      ]),
    });
  });

  test('resolves repeated configured commands once per scan', () => {
    const { scanConfiguredDependencies } = require('../../skills/spec-runtime-setup/scripts/lib/configured-dependencies.cjs');
    const target = tempRepo('configured-scan-cache');
    const binDirectory = path.join(target, 'bin');
    fs.mkdirSync(binDirectory);
    fs.writeFileSync(path.join(binDirectory, process.platform === 'win32' ? 'node.cmd' : 'node'), '');
    fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({
      scripts: {
        setup: 'node setup.js',
        prepare: 'node prepare.js',
      },
    }));
    const existsSpy = jest.spyOn(fs, 'existsSync');

    try {
      const scanned = scanConfiguredDependencies({
        repoRoot: target,
        registry: registryFixture(),
        env: { ...process.env, PATH: binDirectory },
      });
      expect(scanned.configured_dependencies).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'setup-script:setup', dependency_status: 'ready' }),
        expect.objectContaining({ id: 'setup-script:prepare', dependency_status: 'ready' }),
      ]));
      const nodePathChecks = existsSpy.mock.calls.filter(([candidate]) =>
        path.dirname(candidate) === binDirectory && /^node(?:\.(?:exe|cmd|ps1))?$/.test(path.basename(candidate))
      );
      expect(nodePathChecks).toHaveLength(process.platform === 'win32' ? 3 : 1);
    } finally {
      existsSpy.mockRestore();
    }
  });

  test('only promotes confirmed post-probe results to ready', () => {
    const { collectSetupFacts } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
    const bundle = collectSetupFacts({
      repoRoot: '/repo',
      host: 'codex',
      platform: 'linux',
      registry: registryFixture(),
      toolResults: [
        { id: 'context7', status: 'ready', verified: true, source: 'post-mutation-probe' },
        { id: 'codegraph', status: 'ready', verified: false, source: 'attempted-action' },
      ],
      helperResults: [
        { id: 'gh', status: 'missing', verified: true, source: 'post-mutation-probe' },
      ],
      providerResults: [],
      configuredDependencies: [],
      generatedRuntimeManifest: { status: 'current', reason_code: 'manifest-current' },
      now: new Date('2026-07-11T04:00:00.000Z'),
    });

    expect(bundle.toolFacts.schema_version).toBe('tool-facts.v2');
    expect(validateAgainstSchema(toolFactsSchema, bundle.toolFacts)).toEqual({ valid: true, errors: [] });
    expect(bundle.toolFacts.items.find((entry) => entry.id === 'context7')).toMatchObject({
      result: 'ready',
      reason_code: 'ready',
      installed: true,
    });
    expect(bundle.toolFacts.items.find((entry) => entry.id === 'codegraph')).toMatchObject({
      result: 'degraded',
      reason_code: 'unconfirmed-probe',
      installed: false,
    });
    expect(bundle.runtimeCapabilities).toMatchObject({
      schema_version: 'runtime-capabilities.v1',
      setup_summary: {
        baseline_ready: false,
        generated_runtime_manifest: { status: 'current' },
        reason_code: 'setup-facts-ready',
      },
    });
  });

  test.each([
    ['action-required', 'not-applicable', 'action-required', 'host-config-action-required'],
    ['precedence-blocked', 'not-applicable', 'action-required', 'host-config-precedence-blocked'],
    ['registry-args-drift', 'not-applicable', 'degraded', 'host-config-version-drift'],
    ['ready', 'pending', 'action-required', 'project-bootstrap-pending'],
    ['ready', 'failed', 'action-required', 'project-bootstrap-failed'],
  ])('keeps ready dependency separate from %s host/project state', (
    configuredStatus,
    projectStatus,
    expectedResult,
    expectedReason,
  ) => {
    const { collectSetupFacts } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
    const bundle = collectSetupFacts({
      repoRoot: '/repo',
      host: 'codex',
      registry: { tools: [registryFixture().tools[0]], helpers: [] },
      toolResults: [{
        id: 'context7',
        status: 'ready',
        verified: true,
        source: 'post-mutation-probe',
        configured_status: configuredStatus,
        project_status: projectStatus,
      }],
    });

    expect(bundle.toolFacts.items[0]).toMatchObject({
      dependency_status: 'ready',
      configured_status: configuredStatus,
      project_status: projectStatus,
      result: expectedResult,
      reason_code: expectedReason,
      installed: true,
      missing_dependency_reason: null,
    });
    expect(bundle.runtimeCapabilities.setup_summary.baseline_ready).toBe(false);
  });

  test('preserves actionable host conflict evidence and repair command', () => {
    const { collectSetupFacts } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
    const bundle = collectSetupFacts({
      repoRoot: '/repo',
      host: 'codex',
      registry: { tools: [registryFixture().tools[0]], helpers: [] },
      toolResults: [{
        id: 'context7',
        status: 'ready',
        verified: true,
        source: 'post-mutation-probe',
        configured_status: 'action-required',
        reason_code: 'host-config-conflict',
        config_key: 'context7',
        config_path: '/home/user/.codex/config.toml',
        conflict_fields: ['command', 'args'],
        next_action: 'spec-runtime-setup --repair-host-config',
      }],
      helperResults: [],
      providerResults: [],
      configuredDependencies: [],
      generatedRuntimeManifest: { status: 'current', reason_code: 'manifest-current' },
    });

    expect(bundle.toolFacts.items[0]).toMatchObject({
      result: 'action-required',
      reason_code: 'host-config-conflict',
      conflict_fields: ['command', 'args'],
      next_action: 'spec-runtime-setup --repair-host-config',
    });
  });

  test.each(canonicalHosts)('writes %s readiness ledger v2 under an isolated HOME', (host) => {
    const {
      collectSetupFacts,
      prepareHostReadinessLedger,
      writeHostReadinessLedger,
      writeSetupFacts,
    } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
    const target = tempRepo(`host-ledger-${host}`);
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-home-${host}-`));
    const targetFacts = {
      mode: 'git-repo',
      target_kind: 'git-repo',
      workspace_root: target,
      selected_repo_root: target,
      target_root: target,
      candidates: [],
      reason_code: '',
    };
    const bundle = collectSetupFacts({
      repoRoot: target,
      host,
      platform: 'linux',
      registry: registryFixture(),
      toolResults: [
        { id: 'context7', status: 'ready', verified: true, source: 'post-mutation-probe', configured_status: 'ready' },
        { id: 'codegraph', status: 'skipped', verified: true, source: 'post-mutation-probe' },
      ],
      helperResults: [{ id: 'gh', status: 'ready', verified: true, source: 'post-mutation-probe' }],
      generatedRuntimeManifest: { status: 'current', reason_code: null },
      target: targetFacts,
      now: new Date('2026-07-11T06:00:00.000Z'),
    });
    const prepared = prepareHostReadinessLedger({
      repoRoot: target,
      homeDir,
      host,
      toolFacts: bundle.toolFacts,
      runtimeCapabilities: bundle.runtimeCapabilities,
      target: targetFacts,
      now: new Date('2026-07-11T06:00:00.000Z'),
    });

    expect(writeSetupFacts({
      repoRoot: target,
      toolFacts: bundle.toolFacts,
      runtimeCapabilities: prepared.runtimeCapabilities,
    })).toMatchObject({ status: 'ready' });
    expect(writeHostReadinessLedger({
      homeDir,
      host,
      hostLedger: prepared.hostLedger,
    })).toMatchObject({
      status: 'ready',
      reason_code: 'host-readiness-ledger-written',
      artifact_ref: path.join(homeDir, `.${host}`, 'spec-first', 'host-setup.json'),
    });

    const persistedRuntime = JSON.parse(fs.readFileSync(
      path.join(target, '.spec-first', 'config', 'runtime-capabilities.json'),
      'utf8',
    ));
    const persistedLedger = JSON.parse(fs.readFileSync(prepared.hostLedgerPath, 'utf8'));
    expect(persistedRuntime).toMatchObject({
      setup_summary: { reason_code: 'setup-facts-ready' },
      host_ledger_pointer: { host, path: prepared.hostLedgerPath, schema_version: 'v2' },
      host_pointer_reconciliation: null,
    });
    expect(persistedLedger).toMatchObject({
      schema_version: 'v2',
      host,
      overall_status: 'ready',
      baseline_ready: true,
      host_runtime_ready: true,
      host_ledger_pointer: { host, path: prepared.hostLedgerPath, schema_version: 'v2' },
      host_pointer_reconciliation: null,
      tool_facts_path: path.join(target, '.spec-first', 'config', 'tool-facts.json'),
      runtime_capabilities_path: path.join(target, '.spec-first', 'config', 'runtime-capabilities.json'),
    });
  });

  test('keeps an existing host ledger when the write fails before a backup is captured', () => {
    const { writeHostReadinessLedger } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
    const homeDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-home-ledger-keep-')));
    const ledgerPath = path.join(homeDir, '.claude', 'spec-first', 'host-setup.json');
    fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
    fs.writeFileSync(ledgerPath, JSON.stringify({ schema_version: 'v2', host: 'claude' }), 'utf8');

    // Payload validation throws before the rollback backup exists; the failure must not be
    // mistaken for "the ledger did not exist" and delete the ledger that was never written.
    expect(writeHostReadinessLedger({
      homeDir,
      host: 'claude',
      hostLedger: { schema_version: 'v1', host: 'codex' },
    })).toMatchObject({
      status: 'failed',
      reason_code: 'host-readiness-ledger-write-failed',
    });

    expect(fs.existsSync(ledgerPath)).toBe(true);
    expect(JSON.parse(fs.readFileSync(ledgerPath, 'utf8'))).toMatchObject({
      schema_version: 'v2',
      host: 'claude',
    });
  });

  test('reconciles a previous host pointer into both runtime capabilities and the host ledger', () => {
    const {
      collectSetupFacts,
      prepareHostReadinessLedger,
    } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
    const target = tempRepo('host-ledger-reconciliation');
    const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-home-reconciliation-'));
    const bundle = collectSetupFacts({ repoRoot: target, host: 'codex', registry: { tools: [], helpers: [] } });
    const prepared = prepareHostReadinessLedger({
      repoRoot: target,
      homeDir,
      host: 'codex',
      toolFacts: bundle.toolFacts,
      runtimeCapabilities: bundle.runtimeCapabilities,
      previousRuntimeCapabilities: {
        host_ledger_pointer: {
          host: 'qoder',
          path: '/previous/home/.qoder/spec-first/host-setup.json',
          schema_version: 'v2',
        },
      },
      now: new Date('2026-07-11T06:30:00.000Z'),
    });

    const expected = {
      schema_version: 'host-pointer-reconciliation.v1',
      from_host: 'qoder',
      to_host: 'codex',
      from_marker_path: '/previous/home/.qoder/spec-first/host-setup.json',
      to_marker_path: path.join(homeDir, '.codex', 'spec-first', 'host-setup.json'),
      reconciled_at: '2026-07-11T06:30:00.000Z',
    };
    expect(prepared.runtimeCapabilities.host_pointer_reconciliation).toMatchObject(expected);
    expect(prepared.hostLedger.host_pointer_reconciliation).toMatchObject(expected);
  });

  test('writes both primary artifacts atomically and reads a diagnostic snapshot', () => {
    const {
      collectSetupFacts,
      readSetupSnapshot,
      writeSetupFacts,
    } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
    const target = tempRepo('facts-write');
    const bundle = collectSetupFacts({
      repoRoot: target,
      host: 'claude',
      platform: 'macos',
      registry: registryFixture(),
      toolResults: [{ id: 'context7', status: 'ready', verified: true, source: 'post-mutation-probe' }],
      helperResults: [{ id: 'gh', status: 'ready', verified: true, source: 'post-mutation-probe' }],
      providerResults: [],
      configuredDependencies: [],
      generatedRuntimeManifest: { status: 'stale', reason_code: 'manifest-version-drift' },
    });

    const result = writeSetupFacts({ repoRoot: target, ...bundle });
    expect(result).toMatchObject({
      status: 'ready',
      reason_code: 'setup-facts-written',
    });
    expect(result.artifact_refs).toHaveLength(2);
    expect(fs.readdirSync(path.join(target, '.spec-first', 'config')).some((name) => name.endsWith('.tmp'))).toBe(false);

    expect(readSetupSnapshot({ repoRoot: target })).toMatchObject({
      schema_version: 'spec-runtime-setup-diagnostic-snapshot.v1',
      setup_facts_status: 'ready',
      setup_facts_reason_code: 'setup-facts-present',
      runtime_capabilities_status: 'ready',
      runtime_capabilities_reason_code: 'runtime-capabilities-present',
      generated_runtime_manifest: { status: 'stale' },
    });
  });

  test.each([
    ['present', 'ready', 'setup-facts-present', 'ready', 'runtime-capabilities-present'],
    ['missing', 'missing', 'setup-facts-missing', 'missing', 'runtime-capabilities-missing'],
    ['unreadable', 'error', 'setup-facts-unreadable', 'error', 'runtime-capabilities-unreadable'],
  ])('preserves artifact-specific snapshot reason codes for %s files', (
    state,
    expectedFactsStatus,
    expectedFactsReason,
    expectedRuntimeStatus,
    expectedRuntimeReason,
  ) => {
    const { readSetupSnapshot } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
    const target = tempRepo(`snapshot-${state}`);
    if (state !== 'missing') {
      const configDir = path.join(target, '.spec-first', 'config');
      fs.mkdirSync(configDir, { recursive: true });
      const contents = state === 'present'
        ? JSON.stringify({ schema_version: 'tool-facts.v2' })
        : '{ invalid';
      const runtimeContents = state === 'present'
        ? JSON.stringify({ schema_version: 'runtime-capabilities.v1', setup_summary: {} })
        : '{ invalid';
      fs.writeFileSync(path.join(configDir, 'tool-facts.json'), contents);
      fs.writeFileSync(path.join(configDir, 'runtime-capabilities.json'), runtimeContents);
    }

    expect(readSetupSnapshot({ repoRoot: target })).toMatchObject({
      setup_facts_status: expectedFactsStatus,
      setup_facts_reason_code: expectedFactsReason,
      runtime_capabilities_status: expectedRuntimeStatus,
      runtime_capabilities_reason_code: expectedRuntimeReason,
    });
  });

  test('does not claim completion when either artifact write fails', () => {
    const { writeSetupFacts } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
    const target = tempRepo('facts-failure');
    const writer = jest.fn((filePath) => {
      if (filePath.endsWith('runtime-capabilities.json')) {
        const error = new Error('injected rename failure');
        error.code = 'EIO';
        throw error;
      }
    });
    const result = writeSetupFacts({
      repoRoot: target,
      toolFacts: { schema_version: 'tool-facts.v2' },
      runtimeCapabilities: { schema_version: 'runtime-capabilities.v1' },
      writer,
    });

    expect(result).toMatchObject({
      status: 'failed',
      reason_code: 'setup-facts-write-failed',
      complete: false,
    });
  });

  test('builds the parent-workspace quarantine from repo-local artifact pollution', () => {
    const { buildParentArtifactQuarantine } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
    const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-parent-quarantine-'));
    const foreignRepo = tempRepo('foreign-fingerprint');
    const configDir = path.join(workspace, '.spec-first', 'config');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'tool-facts.json'), JSON.stringify({
      schema_version: 'tool-facts.v2',
      generated_at: '2026-07-11T04:00:00.000Z',
      repo_root: foreignRepo,
    }));
    fs.writeFileSync(path.join(configDir, 'runtime-capabilities.json'), JSON.stringify({
      schema_version: 'runtime-capabilities.v1',
      generated_at: '2026-07-11T04:01:00.000Z',
      repo_root: workspace,
    }));

    const quarantine = buildParentArtifactQuarantine({
      workspaceRoot: workspace,
      now: new Date('2026-07-11T05:00:00.000Z'),
    });

    expect(quarantine).toMatchObject({
      schema_version: 'parent-artifact-quarantine.v1',
      topology: 'multi-repo-workspace',
      advisory: true,
      authority_level: 'advisory',
      freshness: 'generated',
      generated_at: '2026-07-11T05:00:00.000Z',
      generated_by: 'spec-runtime-setup',
    });
    expect(quarantine.quarantined_paths).toEqual([
      expect.objectContaining({
        path: '.spec-first/config/tool-facts.json',
        reason_code: 'repo_root-mismatches-workspace-root',
        stale_indicator: foreignRepo,
        fingerprint_origin: foreignRepo,
      }),
      expect.objectContaining({
        path: '.spec-first/config/runtime-capabilities.json',
        reason_code: 'parent-workspace-must-not-have-repo-local-setup-artifact',
        stale_indicator: 'parent-workspace-repo-local-artifact-present',
        fingerprint_origin: workspace,
      }),
    ]);
  });
});

describe('spec-runtime-setup renderer', () => {
  test('renders a mutation-free install preview with blocked reasons and safety facts', () => {
    const { renderInstallPlan } = require('../../skills/spec-runtime-setup/scripts/lib/renderer.cjs');
    const output = renderInstallPlan({
      mode: 'plan',
      blocked: false,
      mutation: false,
      selected_ids: ['graphify'],
      actions: [
        { kind: 'install-provider', provider: 'graphify', planned: true },
      ],
      provider_selection: [{
        provider: 'graphify',
        name: 'Graphify',
        kind: 'project-graph',
        route: 'install-helpers',
      }],
      safety: [{
        id: 'graphify',
        review_required: true,
        risk_flags: ['global-npm-install'],
        source: 'npm',
        version_policy: { pin_status: 'pinned' },
        install_effect: 'global CLI and project artifacts',
      }],
    });

    expect(output).toMatchObject({
      schema_version: 'setup-install-plan.v1',
      mutation: false,
      blocked: false,
      overall_status: 'ready',
      optional_provider_selection: {
        selection_source: 'explicit-only',
        selected_ids: ['graphify'],
        unknown_ids: [],
        requires_confirmation: false,
        confirmation_prompt: null,
        blocked: [],
      },
      provider_selection: [{
        provider: 'graphify',
        name: 'Graphify',
        kind: 'project-graph',
        route: 'install-helpers',
        selected: true,
        selection_source: 'explicit-only',
        risk_flags: ['global-npm-install'],
        source: 'npm',
        pin_status: 'pinned',
        review_required: true,
        install_effect: 'global CLI and project artifacts',
        safety_result: 'review-required',
        reason_code: 'global-npm-install',
      }],
      planned_operations: [{
        id: 'graphify',
        kind: 'install-provider',
        risk_flags: ['global-npm-install'],
        source: 'npm',
        pin_status: 'pinned',
        review_required: true,
        install_effect: 'global CLI and project artifacts',
        safety_result: 'review-required',
        reason_code: 'global-npm-install',
      }],
    });
  });

  test('human summary keeps dependency readiness separate from runtime freshness', () => {
    const { renderHumanSummary } = require('../../skills/spec-runtime-setup/scripts/lib/renderer.cjs');
    const text = renderHumanSummary({
      toolFacts: {
        items: [
          { id: 'context7', kind: 'mcp', result: 'ready', reason_code: 'ready', next_action: '' },
        ],
        provider_readiness: [],
        configured_dependencies: [],
      },
      runtimeCapabilities: {
        setup_summary: {
          baseline_ready: true,
          host_runtime_ready: true,
          generated_runtime_manifest: { status: 'stale', reason_code: 'manifest-version-drift' },
        },
      },
    });

    expect(text).toContain('必需 MCP/helper 依赖：ready');
    expect(text).toContain('Generated runtime manifest：stale (manifest-version-drift)');
    expect(text).not.toContain('setup complete');
  });

  test('human summary renders provider actions and never continues after action-required', () => {
    const { renderHumanSummary } = require('../../skills/spec-runtime-setup/scripts/lib/renderer.cjs');
    const text = renderHumanSummary({
      toolFacts: {
        items: [],
        provider_readiness: [{
          provider: 'graphify',
          readiness_status: 'degraded',
          reason_code: 'graphify-artifact-missing',
          next_actions: ['运行 spec-runtime-setup --only graphify。'],
        }],
        configured_dependencies: [],
      },
      runtimeCapabilities: {
        setup_summary: {
          baseline_ready: true,
          host_runtime_ready: true,
          generated_runtime_manifest: { status: 'current' },
        },
      },
    }, {
      executionSummary: {
        overall_status: 'action-required',
        reason_code: 'graphify-artifact-missing',
        scope: 'full',
        selected_ids: ['codegraph', 'graphify'],
        required_provider_ids: ['codegraph', 'graphify'],
      },
    });

    expect(text).toContain('整体状态：action-required (graphify-artifact-missing)');
    expect(text).toContain('运行 spec-runtime-setup --only graphify。');
    expect(text).not.toContain('继续目标 spec-* workflow');
  });

  test('human summary suppresses stale install and maintenance actions for ready rows', () => {
    const { renderHumanSummary } = require('../../skills/spec-runtime-setup/scripts/lib/renderer.cjs');
    const text = renderHumanSummary({
      toolFacts: {
        items: [{
          id: 'ffmpeg',
          kind: 'cli',
          result: 'ready',
          reason_code: 'ready',
          next_action: '安装 ffmpeg',
        }],
        provider_readiness: [{
          provider: 'graphify',
          readiness_status: 'fresh',
          next_actions: ['运行 spec-runtime-setup --only graphify --refresh。'],
        }],
        configured_dependencies: [],
      },
      runtimeCapabilities: {
        setup_summary: {
          baseline_ready: true,
          host_runtime_ready: true,
          generated_runtime_manifest: { status: 'current' },
        },
      },
    }, {
      executionSummary: {
        overall_status: 'ready',
        reason_code: 'setup-ready',
        scope: 'full',
        selected_ids: ['codegraph', 'graphify'],
        required_provider_ids: ['codegraph', 'graphify'],
      },
    });

    expect(text).toContain('ffmpeg [cli]: ready (ready)');
    expect(text).toContain('graphify: fresh (ready)');
    expect(text).not.toContain('安装 ffmpeg');
    expect(text).not.toContain('graphify --refresh');
    expect(text).toContain('继续目标 spec-* workflow');
  });

  test('human summary keeps a blocked project hook visible without turning core readiness into failure', () => {
    const { renderHumanSummary } = require('../../skills/spec-runtime-setup/scripts/lib/renderer.cjs');
    const ownerAction = '项目外 Git hook 策略未被修改；否则使用 spec-runtime-setup --only graphify --refresh 显式刷新。';
    const text = renderHumanSummary({
      toolFacts: {
        items: [],
        provider_readiness: [{
          provider: 'graphify',
          readiness_status: 'fresh',
          lifecycle: {
            installed: true,
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
          next_actions: [ownerAction],
        }],
        configured_dependencies: [],
      },
      runtimeCapabilities: {
        setup_summary: {
          baseline_ready: true,
          host_runtime_ready: true,
          generated_runtime_manifest: { status: 'current' },
        },
      },
    }, {
      executionSummary: {
        overall_status: 'ready',
        reason_code: 'setup-ready',
        scope: 'full',
        selected_ids: ['codegraph', 'graphify'],
        required_provider_ids: ['codegraph', 'graphify'],
      },
    });

    expect(text).toContain('整体状态：ready (setup-ready)');
    expect(text).toContain('optional_auto_refresh: unavailable-by-project-boundary; refresh=manual-only; external_hook_execution=unverified; hook_fact=blocked (graphify-hook-path-outside-project)');
    expect(text).toContain(ownerAction);
    expect(text).toContain('继续目标 spec-* workflow');
    expect(text).not.toContain('/Users/');
  });

  test('diagnostic accepts core-ready unknown freshness and treats an external hook action as optional', () => {
    const { diagnosticNextActions } = require('../../skills/spec-runtime-setup/scripts/lib/human-output.cjs');
    const ownerAction = '项目外 Git hook 策略未被修改；使用显式 --refresh。';
    const actions = diagnosticNextActions({
      project: {
        inside_git_repo: true,
        example_config_status: 'ok',
        local_config_gitignore_status: 'ok',
      },
      runtime: {
        setup_facts_status: 'ready',
        runtime_capabilities_status: 'ready',
        baseline_ready: true,
        host_runtime_ready: true,
      },
      generated_runtime_manifest: { status: 'current' },
      provider_readiness: [{
        provider: 'graphify',
        readiness_status: 'unknown',
        lifecycle: {
          installed: true,
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
        next_actions: [ownerAction],
      }],
    }, { requiredProviderIds: ['graphify'] });

    expect(actions).toEqual([
      ownerAction,
      '必需设置项已就绪，继续目标 spec-* workflow。',
    ]);
    expect(actions.some((action) => action.includes('--verify-only'))).toBe(false);
  });

  test('diagnostic does not treat unknown freshness as core-ready when the query probe is unverified', () => {
    const { diagnosticNextActions } = require('../../skills/spec-runtime-setup/scripts/lib/human-output.cjs');
    const actions = diagnosticNextActions({
      project: {
        inside_git_repo: true,
        example_config_status: 'ok',
        local_config_gitignore_status: 'ok',
      },
      runtime: {
        setup_facts_status: 'ready',
        runtime_capabilities_status: 'ready',
        baseline_ready: true,
        host_runtime_ready: true,
      },
      generated_runtime_manifest: { status: 'current' },
      provider_readiness: [{
        provider: 'graphify',
        readiness_status: 'unknown',
        lifecycle: {
          installed: true,
          configured: true,
          initialized: true,
          indexed: true,
          artifact_exists: true,
          query_verified: false,
        },
        next_actions: ['重新运行真实 Graphify query probe。'],
      }],
    }, { requiredProviderIds: ['graphify'] });

    expect(actions).toEqual(['重新运行真实 Graphify query probe。']);
    expect(actions.some((action) => action.includes('继续目标'))).toBe(false);
  });

  test('diagnostic next actions continue only when runtime and required providers are ready', () => {
    const { diagnosticNextActions } = require('../../skills/spec-runtime-setup/scripts/lib/human-output.cjs');
    const actions = diagnosticNextActions({
      project: {
        inside_git_repo: true,
        example_config_status: 'ok',
        local_config_gitignore_status: 'ok',
      },
      runtime: {
        setup_facts_status: 'ready',
        runtime_capabilities_status: 'ready',
        baseline_ready: true,
        host_runtime_ready: true,
      },
      generated_runtime_manifest: { status: 'current' },
      provider_readiness: [
        { provider: 'codegraph', readiness_status: 'fresh' },
        { provider: 'graphify', readiness_status: 'fresh' },
      ],
    });

    expect(actions).toEqual(['必需设置项已就绪，继续目标 spec-* workflow。']);
  });

  test('diagnostic next actions report repair without also suggesting continuation', () => {
    const { diagnosticNextActions } = require('../../skills/spec-runtime-setup/scripts/lib/human-output.cjs');
    const actions = diagnosticNextActions({
      project: {
        inside_git_repo: true,
        example_config_status: 'ok',
        local_config_gitignore_status: 'ok',
      },
      runtime: {
        setup_facts_status: 'ready',
        runtime_capabilities_status: 'ready',
        baseline_ready: true,
        host_runtime_ready: true,
      },
      generated_runtime_manifest: { status: 'current' },
      provider_readiness: [
        { provider: 'codegraph', readiness_status: 'unknown' },
        { provider: 'graphify', readiness_status: 'fresh' },
      ],
    });

    expect(actions).toContain('运行当前 host 的 spec-runtime-setup --verify-only，确认 required Provider readiness。');
    expect(actions.some((action) => action.includes('继续目标'))).toBe(false);
  });

  test('diagnostic next actions prefer current baseline probes over stale ready facts', () => {
    const { diagnosticNextActions } = require('../../skills/spec-runtime-setup/scripts/lib/human-output.cjs');
    const actions = diagnosticNextActions({
      project: {
        inside_git_repo: true,
        example_config_status: 'ok',
        local_config_gitignore_status: 'ok',
      },
      tools: [{
        id: 'ffmpeg',
        baseline_blocking: true,
        result: 'action-required',
        next_action: 'brew install ffmpeg',
      }],
      skills: [],
      runtime: {
        setup_facts_status: 'ready',
        runtime_capabilities_status: 'ready',
        baseline_ready: true,
        host_runtime_ready: true,
      },
      generated_runtime_manifest: { status: 'current' },
      provider_readiness: [
        { provider: 'codegraph', readiness_status: 'fresh' },
        { provider: 'graphify', readiness_status: 'fresh' },
      ],
    }, { requiredProviderIds: ['codegraph', 'graphify'] });

    expect(actions).toContain('brew install ffmpeg');
    expect(actions.some((action) => action.includes('继续目标'))).toBe(false);
  });

  test('diagnostic next actions consume registry-derived required provider ids', () => {
    const { diagnosticNextActions } = require('../../skills/spec-runtime-setup/scripts/lib/human-output.cjs');
    const actions = diagnosticNextActions({
      project: {
        inside_git_repo: true,
        example_config_status: 'ok',
        local_config_gitignore_status: 'ok',
      },
      tools: [],
      skills: [],
      runtime: {
        setup_facts_status: 'ready',
        runtime_capabilities_status: 'ready',
        baseline_ready: true,
        host_runtime_ready: true,
      },
      generated_runtime_manifest: { status: 'current' },
      provider_readiness: [
        { provider: 'graphify', readiness_status: 'degraded' },
        { provider: 'new-required', readiness_status: 'fresh' },
      ],
    }, { requiredProviderIds: ['new-required'] });

    expect(actions).toEqual(['必需设置项已就绪，继续目标 spec-* workflow。']);
  });

  test('diagnostic next actions prefer a required provider repair over verify-only', () => {
    const { diagnosticNextActions } = require('../../skills/spec-runtime-setup/scripts/lib/human-output.cjs');
    const repair = '运行 spec-runtime-setup --only codegraph，修复 CodeGraph index/query readiness。';
    const actions = diagnosticNextActions({
      project: {
        inside_git_repo: true,
        example_config_status: 'ok',
        local_config_gitignore_status: 'ok',
      },
      tools: [],
      skills: [],
      runtime: {
        setup_facts_status: 'ready',
        runtime_capabilities_status: 'ready',
        baseline_ready: true,
        host_runtime_ready: true,
      },
      generated_runtime_manifest: { status: 'current' },
      provider_readiness: [{
        provider: 'codegraph',
        readiness_status: 'degraded',
        next_actions: [repair],
      }],
    }, { requiredProviderIds: ['codegraph'] });

    expect(actions).toContain(repair);
    expect(actions.some((action) => action.includes('--verify-only'))).toBe(false);
  });

  test('diagnostic next actions report baseline and provider repairs together', () => {
    const { diagnosticNextActions } = require('../../skills/spec-runtime-setup/scripts/lib/human-output.cjs');
    const actions = diagnosticNextActions({
      project: {
        inside_git_repo: true,
        example_config_status: 'ok',
        local_config_gitignore_status: 'ok',
      },
      runtime: {
        setup_facts_status: 'ready',
        runtime_capabilities_status: 'ready',
        baseline_ready: true,
        host_runtime_ready: true,
      },
      generated_runtime_manifest: { status: 'current' },
      provider_readiness: [{
        provider: 'codegraph',
        readiness_status: 'degraded',
        next_actions: ['repair codegraph'],
      }],
    }, {
      liveBaselineFailures: [{ id: 'ffmpeg', next_action: 'install ffmpeg' }],
      requiredProviderIds: ['codegraph'],
    });

    expect(actions).toEqual(expect.arrayContaining(['install ffmpeg', 'repair codegraph']));
    expect(actions.some((action) => action.includes('继续目标'))).toBe(false);
  });
});
