'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const {
  SETUP_FACTS_MAX_AGE_MS,
  computeDecisionInputHealth,
  normalizeSetupFacts,
  normalizeSetupFactsFile,
} = require('../../src/cli/helpers/setup-facts');

const repoRoot = path.resolve(__dirname, '../..');
const helperRegistryPath = path.join(repoRoot, 'skills/spec-mcp-setup/helper-tools.json');
const providerToolsPath = path.join(repoRoot, 'skills/spec-mcp-setup/provider-tools.json');
const helperRegistryPathForMirror = path.join(repoRoot, 'skills/spec-mcp-setup/helper-tools.json');
const mcpToolsPath = path.join(repoRoot, 'skills/spec-mcp-setup/mcp-tools.json');
const providerRendererPath = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/provider-readiness-renderer.cjs');
const scanConfiguredDepsPath = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/scan-configured-deps.cjs');
const installHelpersPath = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/install-helpers.sh');
const installMcpPath = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/install-mcp.sh');
const setupPlanRendererPath = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/setup-plan-renderer.cjs');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function externalDependency(id) {
  const dependency = readJson(mcpToolsPath).external_dependencies.find((entry) => entry.id === id);
  if (!dependency) throw new Error(`missing external dependency: ${id}`);
  return dependency;
}

const graphifyDependency = externalDependency('graphify');
const codegraphDependency = externalDependency('codegraph');
const GRAPHIFY_PACKAGE = graphifyDependency.package;
const GRAPHIFY_VERSION = graphifyDependency.version;
const GRAPHIFY_PACKAGE_SPEC = graphifyDependency.ecosystem === 'npm'
  ? `${GRAPHIFY_PACKAGE}@${GRAPHIFY_VERSION}`
  : `${GRAPHIFY_PACKAGE}==${GRAPHIFY_VERSION}`;
const CODEGRAPH_PACKAGE = codegraphDependency.package;
const CODEGRAPH_VERSION = codegraphDependency.version;

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-readiness-'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function providerFixture(overrides = {}) {
  return {
    schema_version: 'provider-readiness.v2',
    provider: 'generic',
    kind: 'generic',
    profile: 'optional',
    readiness_status: 'not-run',
    lifecycle: {
      installed: false,
      configured: false,
      initialized: false,
      indexed: false,
      server_reachable: false,
      artifact_exists: false,
      query_verified: false,
      fallback_used: true,
    },
    repo_aligned: 'unknown',
    capabilities: [],
    limitations: [],
    source_read_required: true,
    fallback: {
      available: true,
      methods: ['rg', 'direct-source-read'],
      reason_code: 'provider-not-run',
    },
    next_actions: [],
    native_interfaces: [],
    first_generation: {
      owner: 'unknown',
      status: 'unknown',
      scope: 'unknown',
      requires_explicit_gate: false,
      requirement_workspace_path: null,
      artifact_root: null,
      artifact_refs: [],
      next_action: null,
    },
    steady_state: {
      refresh_owner: 'unknown',
      refresh_mode: 'unknown',
      hook_default: false,
      usage_owner: 'unknown',
      hook_installed: false,
      hook_verified: false,
      hook_status: 'unknown',
      hook_skipped_reason: null,
    },
    usage_note: '',
    ...overrides,
  };
}

function toolFactsFixture(overrides = {}) {
  return {
    schema_version: 'tool-facts.v2',
    generated_at: '2026-06-04T00:00:00Z',
    repo_root: '/tmp/project',
    host: 'codex',
    platform: 'darwin',
    profile: 'minimal',
    tools: {
      context7: { status: 'ready' },
    },
    helper_tools: {
      'agent-browser': {
        dependency_status: 'missing',
        required: true,
        baseline_blocking: false,
        result: 'skipped',
        reason_code: 'optional-skipped',
      },
    },
    provider_readiness: [providerFixture()],
    items: [
      {
        id: 'context7',
        kind: 'mcp',
        profile: 'minimal',
        required: true,
        baseline_blocking: true,
        dependency_status: 'ready',
        configured_status: 'ready',
        result: 'ready',
        reason_code: 'ready',
        installed: true,
        missing_dependency_reason: null,
        next_action: '',
      },
    ],
    configured_dependencies: [],
    schema_capabilities: ['items', 'configured_dependencies', 'schema_capabilities', 'tool-existence'],
    ...overrides,
  };
}

describe('dependency readiness baseline contracts', () => {
  test('helper registry schema validates the single helper source', () => {
    const schema = readJson(path.join(repoRoot, 'docs/contracts/helper-tools-registry.schema.json'));
    const registry = readJson(helperRegistryPath);

    expect(validateAgainstSchema(schema, registry).errors).toEqual([]);
    expect(registry.helpers.map((helper) => helper.id)).toEqual([
      'agent-browser',
      'gh',
      'jq',
      'vhs',
      'silicon',
      'ffmpeg',
      'ast-grep',
      'ast-grep-skill',
    ]);
    expect(registry.helpers.find((helper) => helper.id === 'agent-browser')).toMatchObject({
      required: true,
      baseline_blocking: false,
    });
    expect(registry.helpers.every((helper) => helper.safety && helper.platform_required_tools && helper.runner_kind)).toBe(true);
    expect(registry.helpers.every((helper) => helper.safety.source_repo && helper.safety.source_repo.length > 0)).toBe(true);

    const invalid = {
      ...registry,
      helpers: [{ ...registry.helpers[0], profiles: ['team'] }],
    };
    expect(validateAgainstSchema(schema, invalid).errors).toContain('root.helpers[0].profiles[0]: value "team" not in enum');
  });

  test('check-health reads helper project URLs from the helper registry', () => {
    const registry = readJson(helperRegistryPath);
    const checkHealth = fs.readFileSync(
      path.join(repoRoot, 'skills/spec-mcp-setup/scripts/check-health'),
      'utf8',
    );
    const libSh = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/lib-helper-registry.sh');

    expect(checkHealth).toContain('helper_registry_source_repo "$name"');
    expect(checkHealth).not.toMatch(/https:\/\/cli\.github\.com|https:\/\/jqlang\.github\.io\/jq\/|https:\/\/ffmpeg\.org\/download\.html/);

    for (const helper of registry.helpers) {
      const result = spawnSync('bash', ['-c', `source '${libSh}'; helper_registry_source_repo '${helper.id}'`], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      expect(result.status).toBe(0);
      expect(result.stdout.trim()).toBe(helper.safety.source_repo);
    }
  });

  test('check-health can report jq missing before jq is available', () => {
    const binDir = makeTempDir();
    const checkHealth = path.join(repoRoot, 'skills/spec-mcp-setup/scripts/check-health');
    const linkCommand = (name, target) => {
      const linkPath = path.join(binDir, name);
      try {
        fs.symlinkSync(target, linkPath);
      } catch (_error) {
        fs.writeFileSync(linkPath, `#!/bin/sh\nexec "${target}" "$@"\n`, 'utf8');
        fs.chmodSync(linkPath, 0o755);
      }
    };

    try {
      linkCommand('bash', '/bin/bash');
      linkCommand('node', process.execPath);
      for (const command of ['dirname', 'pwd', 'uname', 'git']) {
        linkCommand(command, `/usr/bin/${command}`);
      }

      const result = spawnSync('bash', [checkHealth, '--json'], {
        cwd: repoRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: binDir,
        },
      });
      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');

      const payload = JSON.parse(result.stdout);
      const jqTool = payload.tools.find((tool) => tool.id === 'jq');
      expect(jqTool).toMatchObject({
        dependency_status: 'missing',
        result: 'action-required',
      });
    } finally {
      fs.rmSync(binDir, { recursive: true, force: true });
    }
  });

  test('tool facts and provider readiness schemas reject drifted enums', () => {
    const toolFactsSchema = readJson(path.join(repoRoot, 'docs/contracts/tool-facts.schema.json'));
    const providerSchema = readJson(path.join(repoRoot, 'docs/contracts/provider-readiness.schema.json'));
    const providerToolsSchema = readJson(path.join(repoRoot, 'docs/contracts/provider-tools-registry.schema.json'));
    const providerTools = readJson(providerToolsPath);

    expect(validateAgainstSchema(toolFactsSchema, toolFactsFixture()).errors).toEqual([]);
    expect(validateAgainstSchema(providerSchema, providerFixture({ readiness_status: 'fresh' })).errors).toEqual([]);
    expect(validateAgainstSchema(providerSchema, providerFixture({ readiness_status: 'unavailable' })).errors).toContain(
      'root.readiness_status: value "unavailable" not in enum',
    );
    expect(validateAgainstSchema(providerToolsSchema, providerTools).errors).toEqual([]);
    const duplicatedProviderPin = JSON.parse(JSON.stringify(providerTools));
    duplicatedProviderPin.providers[0].installation.package = GRAPHIFY_PACKAGE;
    duplicatedProviderPin.providers[0].installation.version_pin = GRAPHIFY_VERSION;
    expect(validateAgainstSchema(providerToolsSchema, duplicatedProviderPin).errors).toContain(
      'root.providers[0].installation: value matched 0 oneOf schemas',
    );
    expect(providerTools.providers).toHaveLength(1);
    expect(providerTools.providers[0]).toMatchObject({
      id: 'graphify',
      kind: 'project-graph',
      profile: 'optional',
      native_interfaces: ['cli'],
      install_route: 'install-helpers',
      first_generation: {
        owner: 'runtime-setup',
        status: 'not-run',
        scope: 'project',
        requires_explicit_gate: true,
      },
      steady_state: {
        refresh_owner: 'provider-native',
        refresh_mode: 'skill-cli-hook-on-demand',
        hook_default: true,
        usage_owner: 'downstream-skill',
      },
      installation: {
        strategy: 'npm-global',
        dependency_ref: 'graphify',
      },
      readiness: {
        fresh_self_report_maps_to: 'unknown',
        stale_self_report_maps_to: 'stale',
      },
    });
    expect(providerTools.providers[0].safety.risk_flags).toEqual(expect.arrayContaining([
      'global-npm-install',
      'package-migration:graphifyy->@sentropic/graphify',
      'single-maintainer-bus-factor',
      'project-runtime-skill-write',
      'git-hook-write',
    ]));
    expect(providerTools.providers[0].usage_note).toContain('current-host project skill');
    expect(providerTools.providers[0].usage_note).toContain('project-root `.graphify/`');
    expect(providerTools.providers[0].usage_note).toContain('Explicit refresh runs `graphify update .` (code-only, no LLM semantic extraction)');
    expect(providerTools.providers[0].safety.install_effect).toContain('graphify install --project --platform codex');
    expect(providerTools.providers[0].safety.install_effect).toContain('graphify update .');
    expect(providerTools.providers[0].safety.install_effect).toContain('explicit incremental refresh next action');
    expect(providerTools.providers[0].safety.install_effect).toContain('graphify hook install');
    expect(providerTools.generic_provider_readiness.schema_version).toBe('provider-readiness.v2');
    expect(providerTools.generic_provider_readiness.readiness_status_values).toEqual([
      'fresh',
      'stale',
      'degraded',
      'not-run',
      'unknown',
    ]);
  });

  test('provider readiness renderer maps helper self-reports conservatively', () => {
    const tempDir = makeTempDir();
    const binDir = path.join(tempDir, 'bin');
    fs.mkdirSync(binDir, { recursive: true });
    const graphifyBin = path.join(binDir, process.platform === 'win32' ? 'graphify.cmd' : 'graphify');
    fs.writeFileSync(graphifyBin, process.platform === 'win32'
      ? `@echo off\r\nif "%1"=="--version" echo graphify ${GRAPHIFY_VERSION}& exit /b 0\r\nexit /b 0\r\n`
      : `#!/bin/sh\nif [ "$1" = "--version" ]; then printf "graphify ${GRAPHIFY_VERSION}\\n"; exit 0; fi\nexit 0\n`, 'utf8');
    fs.chmodSync(graphifyBin, 0o755);

    const baseEnv = {
      ...process.env,
      PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
    };
    const freshResult = spawnSync(process.execPath, [providerRendererPath, '--source', 'helper', '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...baseEnv,
        SPEC_FIRST_PROVIDER_GRAPHIFY_SELF_REPORTED_STATUS: 'fresh',
      },
    });
    expect(freshResult.status).toBe(0);
    const freshProvider = JSON.parse(freshResult.stdout)[0];
    expect(freshProvider).toMatchObject({
      schema_version: 'provider-readiness.v2',
      provider: 'graphify',
      profile: 'optional',
      readiness_status: 'degraded',
      lifecycle: {
        installed: true,
        configured: false,
      },
      native_interfaces: ['cli'],
      first_generation: {
        owner: 'runtime-setup',
        status: 'not-run',
        scope: 'project',
        requires_explicit_gate: true,
        next_action: 'graphify-first-generation-required',
      },
      steady_state: {
        refresh_owner: 'provider-native',
        refresh_mode: 'skill-cli-hook-on-demand',
        hook_status: 'unknown',
      },
    });
    expect(freshProvider.next_actions).toContain(
      'Generate provider-native project-root .graphify/ with graphify extract or graphify update . before using this provider as architecture navigation.',
    );
    expect(freshProvider.next_actions.join('\n')).not.toContain('check in project-graph artifacts');

    const staleResult = spawnSync(process.execPath, [providerRendererPath, '--source', 'helper', '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...baseEnv,
        SPEC_FIRST_PROVIDER_GRAPHIFY_SELF_REPORTED_STATUS: 'stale',
      },
    });
    expect(staleResult.status).toBe(0);
    expect(JSON.parse(staleResult.stdout)[0]).toMatchObject({
      provider: 'graphify',
      readiness_status: 'stale',
    });
  });

  test('provider readiness renderer treats graphify-out as legacy refresh-needed evidence', () => {
    const tempDir = makeTempDir();
    const binDir = path.join(tempDir, 'bin');
    fs.mkdirSync(binDir, { recursive: true });
    fs.mkdirSync(path.join(tempDir, 'graphify-out'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.agents/skills/graphify'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'graphify-out/graph.json'), '{}\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.agents/skills/graphify/SKILL.md'), '# graphify\n', 'utf8');
    const graphifyBin = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyBin, `#!/bin/sh\nif [ "$1" = "--version" ]; then printf "graphify ${GRAPHIFY_VERSION}\\n"; fi\nexit 0\n`, 'utf8');
    fs.chmodSync(graphifyBin, 0o755);

    const result = spawnSync(process.execPath, [providerRendererPath, '--source', 'helper', '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        SPEC_FIRST_PROVIDER_HOST: 'codex',
      },
    });

    expect(result.status).toBe(0);
    const graphify = JSON.parse(result.stdout)[0];
    expect(graphify.lifecycle).toMatchObject({
      installed: true,
      configured: true,
      initialized: false,
      indexed: false,
      artifact_exists: false,
    });
    expect(graphify.first_generation).toMatchObject({
      status: 'not-run',
      artifact_root: '.graphify',
      artifact_refs: [],
      next_action: 'graphify-first-generation-required',
    });
    expect(graphify.next_actions.join('\n')).toContain('Legacy Graphify artifact detected at graphify-out/graph.json');
    expect(graphify.next_actions.join('\n')).toContain('regenerate provider-native .graphify/');
  });

  test('provider readiness renderer reports Graphify query probe advisory only when unverified', () => {
    const tempDir = makeTempDir();
    const binDir = path.join(tempDir, 'bin');
    fs.mkdirSync(binDir, { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.graphify'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.agents/skills/graphify'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.graphify/graph.json'), '{}\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.agents/skills/graphify/SKILL.md'), '# graphify\n', 'utf8');
    const graphifyBin = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyBin, `#!/bin/sh\nif [ "$1" = "--version" ]; then printf "graphify ${GRAPHIFY_VERSION}\\n"; fi\nexit 0\n`, 'utf8');
    fs.chmodSync(graphifyBin, 0o755);

    const base = {
      ...process.env,
      PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
      SPEC_FIRST_PROVIDER_HOST: 'codex',
    };
    const unverified = spawnSync(process.execPath, [providerRendererPath, '--source', 'helper', '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: base,
    });
    expect(unverified.status).toBe(0);
    const unverifiedGraphify = JSON.parse(unverified.stdout)[0];
    expect(unverifiedGraphify.lifecycle.query_verified).toBe(false);
    expect(unverifiedGraphify.next_actions.join('\n')).toContain('Graphify query probe has not confirmed CLI/artifact usability');
    expect(unverifiedGraphify.next_actions.join('\n')).toContain('spec-mcp-setup --only graphify');
    expect(unverifiedGraphify.next_actions.join('\n')).toContain('graphify explain');
    expect(unverifiedGraphify.next_actions.join('\n')).not.toContain('recall quality failed');
    expect(unverifiedGraphify.next_actions.join('\n')).not.toContain('is broken');

    const verified = spawnSync(process.execPath, [providerRendererPath, '--source', 'helper', '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...base,
        SPEC_FIRST_PROVIDER_GRAPHIFY_QUERY_VERIFIED: 'true',
      },
    });
    expect(verified.status).toBe(0);
    const verifiedGraphify = JSON.parse(verified.stdout)[0];
    expect(verifiedGraphify.lifecycle.query_verified).toBe(true);
    expect(verifiedGraphify.next_actions.join('\n')).not.toContain('Graphify query probe has not confirmed CLI/artifact usability');
  });

  test('provider renderers run from generated runtime mirror without source-relative src requires', () => {
    const tempDir = makeTempDir();
    const mirrorSkill = path.join(tempDir, '.agents/skills/spec-mcp-setup');
    const mirrorScripts = path.join(mirrorSkill, 'scripts');
    fs.mkdirSync(mirrorScripts, { recursive: true });
    fs.copyFileSync(setupPlanRendererPath, path.join(mirrorScripts, 'setup-plan-renderer.cjs'));
    fs.copyFileSync(providerRendererPath, path.join(mirrorScripts, 'provider-readiness-renderer.cjs'));
    fs.copyFileSync(helperRegistryPathForMirror, path.join(mirrorSkill, 'helper-tools.json'));
    fs.copyFileSync(mcpToolsPath, path.join(mirrorSkill, 'mcp-tools.json'));
    fs.copyFileSync(providerToolsPath, path.join(mirrorSkill, 'provider-tools.json'));

    const plan = spawnSync(process.execPath, [path.join(mirrorScripts, 'setup-plan-renderer.cjs'), '--mode', 'plan', '--repo-root', tempDir], {
      cwd: tempDir,
      encoding: 'utf8',
    });
    expect(plan.status).toBe(0);
    expect(JSON.parse(plan.stdout)).toMatchObject({
      schema_version: 'setup-install-plan.v1',
      overall_status: 'ready',
    });

    const emptyBinDir = path.join(tempDir, 'empty-bin');
    fs.mkdirSync(emptyBinDir, { recursive: true });
    const readiness = spawnSync(process.execPath, [path.join(mirrorScripts, 'provider-readiness-renderer.cjs'), '--source', 'helper', '--repo-root', tempDir], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: path.join(tempDir, 'home'),
        PATH: emptyBinDir,
      },
    });
    expect(readiness.status).toBe(0);
    expect(JSON.parse(readiness.stdout)[0]).toMatchObject({
      provider: 'graphify',
      readiness_status: 'not-run',
    });
  });

  test('provider readiness renderer detects Graphify in known uv path, project skill, and hooks', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const emptyBinDir = path.join(tempDir, 'empty-bin');
    const graphifyBinDir = path.join(homeDir, '.local/bin');
    fs.mkdirSync(graphifyBinDir, { recursive: true });
    fs.mkdirSync(emptyBinDir, { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.claude/skills/graphify'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.graphify'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.claude/skills/graphify/SKILL.md'), '# graphify\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.graphify/graph.json'), '{}\n', 'utf8');
    const graphifyBin = path.join(graphifyBinDir, 'graphify');
    fs.writeFileSync(graphifyBin, `#!/bin/sh
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
if [ "$1" = "hook" ] && [ "$2" = "status" ]; then
  printf '%s\\n' 'post-commit: installed' 'post-checkout: installed'
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(graphifyBin, 0o755);

    const result = spawnSync(process.execPath, [providerRendererPath, '--source', 'helper', '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: emptyBinDir,
        SPEC_FIRST_PROVIDER_HOST: 'claude',
      },
    });

    expect(result.status).toBe(0);
    const graphify = JSON.parse(result.stdout)[0];
    expect(graphify).toMatchObject({
      provider: 'graphify',
      lifecycle: {
        installed: true,
        configured: true,
        initialized: true,
        indexed: true,
        artifact_exists: true,
      },
      first_generation: {
        status: 'completed',
        artifact_refs: ['.graphify/graph.json'],
      },
      steady_state: {
        hook_installed: true,
        hook_verified: true,
        hook_status: 'verified',
      },
    });
    expect(graphify.next_actions.join('\n')).toContain('not on PATH');
  });

  test('provider readiness renderer does not treat env-only or wrong-host Graphify runtime as configured', () => {
    const tempDir = makeTempDir();
    const binDir = path.join(tempDir, 'bin');
    fs.mkdirSync(path.join(tempDir, '.graphify'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.claude/skills/graphify'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.graphify/graph.json'), '{}\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.claude/skills/graphify/SKILL.md'), '# graphify\n', 'utf8');
    const graphifyBin = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyBin, `#!/bin/sh
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(graphifyBin, 0o755);

    const codexResult = spawnSync(process.execPath, [providerRendererPath, '--source', 'helper', '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        SPEC_FIRST_PROVIDER_HOST: 'codex',
        SPEC_FIRST_PROVIDER_GRAPHIFY_CONFIGURED: 'true',
      },
    });
    expect(codexResult.status).toBe(0);
    const codexGraphify = JSON.parse(codexResult.stdout)[0];
    expect(codexGraphify).toMatchObject({
      provider: 'graphify',
      lifecycle: {
        installed: true,
        configured: false,
        artifact_exists: true,
      },
    });
    expect(codexGraphify.next_actions.join('\n')).toContain('spec-mcp-setup --only graphify');
    expect(codexGraphify.next_actions.join('\n')).toContain('codex');

    const claudeResult = spawnSync(process.execPath, [providerRendererPath, '--source', 'helper', '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: path.join(tempDir, 'home'),
        PATH: binDir,
        SPEC_FIRST_PROVIDER_HOST: 'claude',
      },
    });
    expect(claudeResult.status).toBe(0);
    expect(JSON.parse(claudeResult.stdout)[0]).toMatchObject({
      provider: 'graphify',
      lifecycle: {
        configured: true,
      },
    });
  });

  test('provider readiness renderer gives Claude-specific Graphify repair actions', () => {
    const tempDir = makeTempDir();
    const binDir = path.join(tempDir, 'bin');
    fs.mkdirSync(path.join(tempDir, '.graphify'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.graphify/graph.json'), '{}\n', 'utf8');
    const graphifyBin = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyBin, `#!/bin/sh
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(graphifyBin, 0o755);

    const result = spawnSync(process.execPath, [providerRendererPath, '--source', 'helper', '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        SPEC_FIRST_PROVIDER_HOST: 'claude',
      },
    });

    expect(result.status).toBe(0);
    const graphify = JSON.parse(result.stdout)[0];
    expect(graphify).toMatchObject({
      provider: 'graphify',
      readiness_status: 'degraded',
      lifecycle: {
        installed: true,
        configured: false,
        artifact_exists: true,
      },
    });
    expect(graphify.next_actions.join('\n')).toContain('spec-mcp-setup --only graphify');
  });

  test('provider readiness renderer prefers pinned provider-standard Graphify over stale PATH command', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const graphifyBinDir = path.join(homeDir, '.local/bin');
    fs.mkdirSync(path.join(tempDir, '.graphify'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.codex/skills/graphify'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.mkdirSync(graphifyBinDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.graphify/graph.json'), '{}\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.codex/skills/graphify/SKILL.md'), '# graphify\n', 'utf8');
    const staleGraphify = path.join(binDir, 'graphify');
    fs.writeFileSync(staleGraphify, '#!/bin/sh\nprintf "graphify 0.1.0\\n"\n', 'utf8');
    fs.chmodSync(staleGraphify, 0o755);
    const pinnedGraphify = path.join(graphifyBinDir, 'graphify');
    fs.writeFileSync(pinnedGraphify, `#!/bin/sh\nprintf "graphify ${GRAPHIFY_VERSION}\\n"\n`, 'utf8');
    fs.chmodSync(pinnedGraphify, 0o755);

    const result = spawnSync(process.execPath, [providerRendererPath, '--source', 'helper', '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: binDir,
        SPEC_FIRST_PROVIDER_ORIGINAL_PATH: binDir,
        SPEC_FIRST_PROVIDER_HOST: 'codex',
      },
    });

    expect(result.status).toBe(0);
    const graphify = JSON.parse(result.stdout)[0];
    expect(graphify.lifecycle.installed).toBe(true);
    expect(graphify.next_actions.join('\n')).toContain(`setup is using ${pinnedGraphify}`);
    expect(graphify.next_actions.join('\n')).toContain(`Graphify CLI on PATH at ${staleGraphify} does not match pinned ${GRAPHIFY_PACKAGE_SPEC}`);
    expect(graphify.next_actions.join('\n')).not.toContain('Graphify CLI version does not match pinned');
  });

  test('provider readiness renderer resolves Unix PATH without login shell mutation', () => {
    if (process.platform === 'win32') return;

    const source = fs.readFileSync(providerRendererPath, 'utf8');
    expect(source).toContain("spawnSync('/bin/sh', ['-c',");
    expect(source).not.toContain("spawnSync('/bin/sh', ['-lc',");
  });

  test('install-helpers repairs stale Graphify symlink on PATH when pinned npm CLI is available', () => {
    if (process.platform === 'win32') return;

    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const oldToolDir = path.join(tempDir, 'old-tool');
    const npmPrefix = path.join(tempDir, 'npm-global');
    const capturePath = path.join(tempDir, 'graphify-args.txt');
    fs.mkdirSync(path.join(homeDir, '.agents/skills/ast-grep'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.codex/skills/graphify'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.graphify'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.mkdirSync(oldToolDir, { recursive: true });
    fs.mkdirSync(path.join(npmPrefix, 'bin'), { recursive: true });
    fs.writeFileSync(path.join(homeDir, '.agents/skills/ast-grep/SKILL.md'), '# ast-grep\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.codex/skills/graphify/SKILL.md'), '# graphify\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.graphify/graph.json'), '{}\n', 'utf8');
    spawnSync('git', ['init'], { cwd: tempDir, encoding: 'utf8' });

    for (const command of ['gh', 'vhs', 'silicon', 'ffmpeg', 'ast-grep']) {
      const commandPath = path.join(binDir, command);
      fs.writeFileSync(commandPath, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(commandPath, 0o755);
    }

    const npmPath = path.join(binDir, 'npm');
    fs.writeFileSync(npmPath, `#!/bin/sh
if [ "$1" = "prefix" ] && [ "$2" = "-g" ]; then
  printf '%s\\n' "${npmPrefix}"
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(npmPath, 0o755);

    const oldGraphifyTarget = path.join(oldToolDir, 'graphify');
    fs.writeFileSync(oldGraphifyTarget, '#!/bin/sh\nprintf "graphify 0.8.39\\n"\n', 'utf8');
    fs.chmodSync(oldGraphifyTarget, 0o755);
    const pathGraphify = path.join(binDir, 'graphify');
    fs.symlinkSync(oldGraphifyTarget, pathGraphify);

    const pinnedGraphify = path.join(npmPrefix, 'bin', 'graphify');
    fs.writeFileSync(pinnedGraphify, `#!/bin/sh
printf '%s\\n' "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
if [ "$1" = "query" ]; then
  exit 0
fi
if [ "$1" = "hook" ]; then
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(pinnedGraphify, 0o755);

    const result = spawnSync('bash', [installHelpersPath, '--install'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        GRAPHIFY_CAPTURE: capturePath,
        SPEC_FIRST_PROVIDER_REPO_ROOT: tempDir,
        SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT: 'approved',
        SPEC_FIRST_PROVIDER_HOST: 'codex',
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).provider_readiness.find((entry) => entry.provider === 'graphify')).toMatchObject({
      lifecycle: {
        installed: true,
        query_verified: true,
      },
    });
    expect(fs.lstatSync(pathGraphify).isSymbolicLink()).toBe(true);
    expect(fs.readlinkSync(pathGraphify)).toBe(pinnedGraphify);
    expect(fs.lstatSync(path.join(binDir, 'graphify.old')).isSymbolicLink()).toBe(true);
    expect(fs.readlinkSync(path.join(binDir, 'graphify.old'))).toBe(oldGraphifyTarget);
    expect(fs.readFileSync(capturePath, 'utf8')).toContain('query spec-first setup readiness --graph');
    expect(result.stderr).toContain('repaired stale PATH symlink');
  });

  test('install-helpers does not overwrite stale non-symlink Graphify command on PATH', () => {
    if (process.platform === 'win32') return;

    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const npmPrefix = path.join(tempDir, 'npm-global');
    const capturePath = path.join(tempDir, 'graphify-args.txt');
    fs.mkdirSync(path.join(homeDir, '.agents/skills/ast-grep'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.codex/skills/graphify'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.graphify'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.mkdirSync(path.join(npmPrefix, 'bin'), { recursive: true });
    fs.writeFileSync(path.join(homeDir, '.agents/skills/ast-grep/SKILL.md'), '# ast-grep\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.codex/skills/graphify/SKILL.md'), '# graphify\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.graphify/graph.json'), '{}\n', 'utf8');
    spawnSync('git', ['init'], { cwd: tempDir, encoding: 'utf8' });

    for (const command of ['gh', 'vhs', 'silicon', 'ffmpeg', 'ast-grep']) {
      const commandPath = path.join(binDir, command);
      fs.writeFileSync(commandPath, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(commandPath, 0o755);
    }

    const npmPath = path.join(binDir, 'npm');
    fs.writeFileSync(npmPath, `#!/bin/sh
if [ "$1" = "prefix" ] && [ "$2" = "-g" ]; then
  printf '%s\\n' "${npmPrefix}"
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(npmPath, 0o755);

    const pathGraphify = path.join(binDir, 'graphify');
    const staleGraphifyBody = '#!/bin/sh\nprintf "graphify 0.8.39\\n"\n';
    fs.writeFileSync(pathGraphify, staleGraphifyBody, 'utf8');
    fs.chmodSync(pathGraphify, 0o755);

    const pinnedGraphify = path.join(npmPrefix, 'bin', 'graphify');
    fs.writeFileSync(pinnedGraphify, `#!/bin/sh
printf '%s\\n' "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
if [ "$1" = "query" ]; then
  exit 0
fi
if [ "$1" = "hook" ]; then
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(pinnedGraphify, 0o755);

    const result = spawnSync('bash', [installHelpersPath, '--install'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        GRAPHIFY_CAPTURE: capturePath,
        SPEC_FIRST_PROVIDER_REPO_ROOT: tempDir,
        SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT: 'approved',
        SPEC_FIRST_PROVIDER_HOST: 'codex',
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).provider_readiness.find((entry) => entry.provider === 'graphify')).toMatchObject({
      lifecycle: {
        installed: true,
        query_verified: true,
      },
    });
    expect(fs.lstatSync(pathGraphify).isFile()).toBe(true);
    expect(fs.readFileSync(pathGraphify, 'utf8')).toBe(staleGraphifyBody);
    expect(fs.existsSync(path.join(binDir, 'graphify.old'))).toBe(false);
    expect(fs.readFileSync(capturePath, 'utf8')).toContain('query spec-first setup readiness --graph');
    expect(result.stderr).not.toContain('repaired stale PATH symlink');
  });

  test('provider readiness renderer degrades Graphify when hook setup failed', () => {
    const tempDir = makeTempDir();
    const binDir = path.join(tempDir, 'bin');
    fs.mkdirSync(path.join(tempDir, '.graphify'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.graphify/graph.json'), '{}\n', 'utf8');
    const graphifyBin = path.join(binDir, process.platform === 'win32' ? 'graphify.cmd' : 'graphify');
    fs.writeFileSync(graphifyBin, process.platform === 'win32'
      ? `@echo off\r\nif "%1"=="--version" echo graphify ${GRAPHIFY_VERSION}& exit /b 0\r\nexit /b 0\r\n`
      : `#!/bin/sh\nif [ "$1" = "--version" ]; then printf "graphify ${GRAPHIFY_VERSION}\\n"; exit 0; fi\nexit 0\n`, 'utf8');
    fs.chmodSync(graphifyBin, 0o755);

    const result = spawnSync(process.execPath, [providerRendererPath, '--source', 'helper', '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_INSTALLED: 'false',
        SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_VERIFIED: 'false',
        SPEC_FIRST_PROVIDER_GRAPHIFY_HOOK_STATUS: 'failed',
      },
    });

    expect(result.status).toBe(0);
    const graphify = JSON.parse(result.stdout)[0];
    expect(graphify).toMatchObject({
      provider: 'graphify',
      readiness_status: 'degraded',
      steady_state: {
        hook_installed: false,
        hook_verified: false,
        hook_status: 'failed',
      },
    });
    expect(graphify.next_actions.join('\n')).toContain('Graphify hook setup failed');
  });

  test('provider readiness renderer degrades Graphify when CLI version does not match the pin', () => {
    const tempDir = makeTempDir();
    const binDir = path.join(tempDir, 'bin');
    fs.mkdirSync(path.join(tempDir, '.graphify'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.graphify/graph.json'), '{}\n', 'utf8');
    const graphifyBin = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyBin, `#!/bin/sh
if [ "$1" = "--version" ]; then
  printf 'graphify 0.8.35\\n'
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(graphifyBin, 0o755);

    const result = spawnSync(process.execPath, [providerRendererPath, '--source', 'helper', '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: path.join(tempDir, 'home'),
        PATH: binDir,
      },
    });

    expect(result.status).toBe(0);
    const graphify = JSON.parse(result.stdout)[0];
    expect(graphify).toMatchObject({
      provider: 'graphify',
      readiness_status: 'degraded',
      lifecycle: {
        installed: true,
        artifact_exists: true,
      },
    });
    expect(graphify.next_actions.join('\n')).toContain(GRAPHIFY_PACKAGE_SPEC);
  });

  test('install-helpers runs native Graphify project skill, graph generation, hook, and query probe', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const workspace = path.join(tempDir, '.spec-first/workspace/requirements/demo');
    const capturePath = path.join(tempDir, 'graphify-args.txt');
    fs.mkdirSync(path.join(homeDir, '.agents/skills/ast-grep'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.mkdirSync(workspace, { recursive: true });
    fs.writeFileSync(path.join(homeDir, '.agents/skills/ast-grep/SKILL.md'), '# ast-grep\n', 'utf8');
    spawnSync('git', ['init'], { cwd: tempDir, encoding: 'utf8' });

    for (const command of ['gh', 'vhs', 'silicon', 'ffmpeg', 'ast-grep']) {
      const commandPath = path.join(binDir, command);
      fs.writeFileSync(commandPath, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(commandPath, 0o755);
    }
    const graphifyPath = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyPath, `#!/bin/sh
printf '%s\\n' "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
if [ "$1" = "install" ]; then
  mkdir -p .codex/skills/graphify
  printf '# graphify\\n' > .codex/skills/graphify/SKILL.md
  cat > AGENTS.md <<'GRAPHIFY'
## graphify

Rules:
- For codebase questions, first run \`graphify query "<question>"\` when .graphify/graph.json exists.
- After modifying code, run \`graphify update .\` to keep the graph current (AST-only, no API cost).
GRAPHIFY
  exit 0
fi
if [ "$1" = "query" ]; then
  exit 0
fi
if [ "$1" = "hook" ]; then
  exit 0
fi
out=''
while [ "$#" -gt 0 ]; do
  if [ "$1" = "--out" ]; then
    out="$2/.graphify"
    shift 2
    continue
  fi
  shift
done
if [ -z "$out" ]; then
  out=".graphify"
fi
mkdir -p "$out"
printf '{}\\n' > "$out/graph.json"
printf '# report\\n' > "$out/GRAPH_REPORT.md"
exit 0
`, 'utf8');
    fs.chmodSync(graphifyPath, 0o755);

    const result = spawnSync('bash', [installHelpersPath, '--install', '--requirement-workspace', '.spec-first/workspace/requirements/demo'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        GRAPHIFY_CAPTURE: capturePath,
        SPEC_FIRST_PROVIDER_REPO_ROOT: tempDir,
        SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT: 'approved',
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    const captured = fs.readFileSync(capturePath, 'utf8');
    expect(captured).toContain('install --project --platform codex');
    expect(captured).toContain('extract');
    expect(captured).toContain('hook install');
    expect(captured).toContain('hook status');
    expect(captured).toContain('query spec-first setup readiness --graph');
    expect(captured.match(/query spec-first setup readiness --graph/g) || []).toHaveLength(1);
    expect(captured).not.toContain('--no-cluster');
    const payload = JSON.parse(result.stdout);
    const graphify = payload.provider_readiness.find((entry) => entry.provider === 'graphify');
    expect(graphify).toMatchObject({
      lifecycle: {
        installed: true,
        configured: true,
        initialized: true,
        indexed: true,
        artifact_exists: true,
        query_verified: true,
      },
      first_generation: {
        status: 'completed',
        requirement_workspace_path: '.spec-first/workspace/requirements/demo',
        artifact_root: '.graphify',
        artifact_refs: ['.graphify/graph.json'],
      },
      steady_state: {
        hook_installed: true,
        hook_verified: true,
        hook_status: 'verified',
      },
    });
  });

  test('install-helpers verify-only probes existing Graphify artifact with pinned CLI', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const graphifyBinDir = path.join(homeDir, '.local/bin');
    const capturePath = path.join(tempDir, 'graphify-args.txt');
    fs.mkdirSync(path.join(homeDir, '.agents/skills/ast-grep'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.agents/skills/graphify'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.graphify'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.mkdirSync(graphifyBinDir, { recursive: true });
    fs.writeFileSync(path.join(homeDir, '.agents/skills/ast-grep/SKILL.md'), '# ast-grep\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.agents/skills/graphify/SKILL.md'), '# graphify\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.graphify/graph.json'), '{}\n', 'utf8');

    for (const command of ['gh', 'vhs', 'silicon', 'ffmpeg', 'ast-grep']) {
      const commandPath = path.join(binDir, command);
      fs.writeFileSync(commandPath, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(commandPath, 0o755);
    }
    const staleGraphifyPath = path.join(binDir, 'graphify');
    fs.writeFileSync(staleGraphifyPath, `#!/bin/sh
printf 'PATH:%s\\n' "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify 0.1.0\\n'
  exit 0
fi
if [ "$1" = "query" ]; then
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(staleGraphifyPath, 0o755);
    const pinnedGraphifyPath = path.join(graphifyBinDir, 'graphify');
    fs.writeFileSync(pinnedGraphifyPath, `#!/bin/sh
printf 'PINNED:%s\\n' "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
if [ "$1" = "query" ]; then
  exit 9
fi
exit 0
`, 'utf8');
    fs.chmodSync(pinnedGraphifyPath, 0o755);

    const result = spawnSync('bash', [installHelpersPath, '--verify-only'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        SPEC_FIRST_PROVIDER_ORIGINAL_PATH: binDir,
        GRAPHIFY_CAPTURE: capturePath,
        SPEC_FIRST_PROVIDER_REPO_ROOT: tempDir,
        SPEC_FIRST_PROVIDER_HOST: 'codex',
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
        SPEC_FIRST_PROBE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    const captured = fs.readFileSync(capturePath, 'utf8');
    expect(captured).toContain('PINNED:query spec-first setup readiness --graph');
    expect(captured).not.toContain('PATH:query spec-first setup readiness --graph');
    const payload = JSON.parse(result.stdout);
    const graphify = payload.provider_readiness.find((entry) => entry.provider === 'graphify');
    expect(graphify).toMatchObject({
      lifecycle: {
        installed: true,
        configured: true,
        artifact_exists: true,
        query_verified: false,
      },
    });
    expect(graphify.next_actions.join('\n')).toContain('Graphify query probe has not confirmed CLI/artifact usability');
    expect(graphify.next_actions.join('\n')).toContain(`does not match pinned ${GRAPHIFY_PACKAGE_SPEC}`);
  });

  test('install-helpers invokes provider-standard off-PATH Graphify while preserving manual visibility next action', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const graphifyBinDir = path.join(homeDir, '.local/bin');
    const capturePath = path.join(tempDir, 'graphify-args.txt');
    fs.mkdirSync(path.join(homeDir, '.agents/skills/ast-grep'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.mkdirSync(graphifyBinDir, { recursive: true });
    fs.writeFileSync(path.join(homeDir, '.agents/skills/ast-grep/SKILL.md'), '# ast-grep\n', 'utf8');
    spawnSync('git', ['init'], { cwd: tempDir, encoding: 'utf8' });

    for (const command of ['gh', 'vhs', 'silicon', 'ffmpeg', 'ast-grep']) {
      const commandPath = path.join(binDir, command);
      fs.writeFileSync(commandPath, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(commandPath, 0o755);
    }
    const staleGraphifyPath = path.join(binDir, 'graphify');
    fs.writeFileSync(staleGraphifyPath, `#!/bin/sh
printf '%s %s\\n' "$0" "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify 0.1.0\\n'
  exit 0
fi
exit 1
`, 'utf8');
    fs.chmodSync(staleGraphifyPath, 0o755);
    const graphifyPath = path.join(graphifyBinDir, 'graphify');
    fs.writeFileSync(graphifyPath, `#!/bin/sh
printf '%s %s\\n' "$0" "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
if [ "$1" = "install" ]; then
  mkdir -p .codex/skills/graphify
  printf '# graphify\\n' > .codex/skills/graphify/SKILL.md
  cat > AGENTS.md <<'GRAPHIFY'
## graphify

Rules:
- For codebase questions, first run \`graphify query "<question>"\` when .graphify/graph.json exists.
- After modifying code, run \`graphify update .\` to keep the graph current (AST-only, no API cost).
GRAPHIFY
  exit 0
fi
if [ "$1" = "query" ]; then
  exit 0
fi
if [ "$1" = "hook" ]; then
  if [ "$2" = "install" ]; then
    mkdir -p .git/hooks
    cat > .git/hooks/post-commit <<'HOOK'
#!/bin/sh
# graphify-hook-start
# Installed by: graphify hook install
command -v graphify >/dev/null 2>&1
HOOK
    cat > .git/hooks/post-checkout <<'HOOK'
#!/bin/sh
# graphify-checkout-hook-start
# Installed by: graphify hook install
command -v graphify >/dev/null 2>&1
HOOK
    chmod +x .git/hooks/post-commit .git/hooks/post-checkout
    exit 0
  fi
  if [ "$2" = "status" ]; then
    PATH="/usr/bin:/bin" .git/hooks/post-commit >/dev/null 2>&1 || exit 1
    PATH="/usr/bin:/bin" .git/hooks/post-checkout >/dev/null 2>&1 || exit 1
    exit 0
  fi
  exit 0
fi
if [ "$1" = "extract" ]; then
  mkdir -p .graphify
  printf '{}\\n' > .graphify/graph.json
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(graphifyPath, 0o755);

    const result = spawnSync('bash', [installHelpersPath, '--install'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        SPEC_FIRST_PROVIDER_ORIGINAL_PATH: binDir,
        GRAPHIFY_CAPTURE: capturePath,
        SPEC_FIRST_PROVIDER_REPO_ROOT: tempDir,
        SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT: 'approved',
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    const captured = fs.readFileSync(capturePath, 'utf8');
    expect(captured).toContain(`${staleGraphifyPath} --version`);
    expect(captured).not.toContain(`${staleGraphifyPath} install --project --platform codex`);
    expect(captured).toContain(`${graphifyPath} install --project --platform codex`);
    expect(captured).toContain(`${graphifyPath} extract .`);
    expect(captured).toContain(`${graphifyPath} query spec-first setup readiness --graph`);
    expect(captured).toContain(`${graphifyPath} hook install`);
    expect(captured).toContain(`${graphifyPath} hook status`);
    const payload = JSON.parse(result.stdout);
    const graphify = payload.provider_readiness.find((entry) => entry.provider === 'graphify');
    expect(graphify).toMatchObject({
      lifecycle: {
        installed: true,
        configured: true,
        initialized: true,
        indexed: true,
        artifact_exists: true,
        query_verified: true,
      },
      steady_state: {
        hook_installed: true,
        hook_verified: true,
        hook_status: 'verified',
      },
    });
    expect(graphify.next_actions.join('\n')).toContain('not on PATH');
    const agents = fs.readFileSync(path.join(tempDir, 'AGENTS.md'), 'utf8');
    expect(agents).toContain('Graphify CLI is runtime-visible');
    expect(agents).toContain('Use Graphify as exploration-tier orientation');
    expect(agents).toContain('reading source first is always valid');
    expect(agents).toContain('Use `query` for broad orientation');
    expect(agents).toContain('scoped candidate subgraph');
    expect(agents).toContain('spec-mcp-setup --only graphify');
    expect(agents).toContain('docs/contracts/project-graph-consumption.md');
    expect(agents).toContain('Ordinary workflows do not refresh project graphs after code changes');
    expect(agents).not.toContain('Use Graphify first only');
    expect(agents).not.toContain('first run `graphify query "<question>"`');
    expect(agents).not.toContain('run `"<resolved-graphify>" update .`');
    const postCommitHook = fs.readFileSync(path.join(tempDir, '.git/hooks/post-commit'), 'utf8');
    expect(postCommitHook).toContain('# spec-first graphify path repair start');
    expect(postCommitHook).toContain(`export PATH='${graphifyBinDir}':"$PATH"`);
  });

  test('install-helpers verifies existing Graphify artifact and recommends explicit incremental refresh', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const capturePath = path.join(tempDir, 'graphify-args.txt');
    fs.mkdirSync(path.join(homeDir, '.agents/skills/ast-grep'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.codex/skills/graphify'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.graphify'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(homeDir, '.agents/skills/ast-grep/SKILL.md'), '# ast-grep\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.codex/skills/graphify/SKILL.md'), '# graphify\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, 'AGENTS.md'), '## graphify\n\nold provider text\n\n<!-- spec-first:bootstrap:start -->\n## Workflow 入口治理\n\nkeep\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.graphify/graph.json'), '{}\n', 'utf8');
    spawnSync('git', ['init'], { cwd: tempDir, encoding: 'utf8' });

    for (const command of ['gh', 'vhs', 'silicon', 'ffmpeg', 'ast-grep']) {
      const commandPath = path.join(binDir, command);
      fs.writeFileSync(commandPath, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(commandPath, 0o755);
    }
    const graphifyPath = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyPath, `#!/bin/sh
printf '%s\\n' "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
if [ "$1" = "query" ]; then
  exit 0
fi
if [ "$1" = "hook" ] && [ "$2" = "status" ]; then
  printf 'post-commit: installed\\npost-checkout: installed\\n'
  exit 0
fi
if [ "$1" = "install" ] || [ "$1" = "extract" ] || [ "$1" = "update" ]; then
  exit 3
fi
exit 0
`, 'utf8');
    fs.chmodSync(graphifyPath, 0o755);

    const result = spawnSync('bash', [installHelpersPath, '--install'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        GRAPHIFY_CAPTURE: capturePath,
        SPEC_FIRST_PROVIDER_REPO_ROOT: tempDir,
        SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT: 'approved',
        SPEC_FIRST_PROVIDER_HOST: 'codex',
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
        SPEC_FIRST_PROBE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    const captured = fs.readFileSync(capturePath, 'utf8');
    expect(captured).toContain('query spec-first setup readiness --graph');
    expect(captured).toContain('hook status');
    expect(captured).not.toContain('install --project --platform codex');
    expect(captured).not.toContain('extract .');
    expect(captured).not.toContain('update .');
    const payload = JSON.parse(result.stdout);
    const graphify = payload.provider_readiness.find((entry) => entry.provider === 'graphify');
    expect(graphify).toMatchObject({
      lifecycle: {
        installed: true,
        configured: true,
        artifact_exists: true,
        query_verified: true,
      },
      first_generation: {
        status: 'skipped',
        next_action: 'graphify-refresh-recommended',
        artifact_refs: ['.graphify/graph.json'],
      },
      steady_state: {
        hook_installed: true,
        hook_verified: true,
        hook_status: 'verified',
      },
    });
    expect(graphify.next_actions.join('\n')).toContain('spec-mcp-setup --only graphify --refresh');
    expect(graphify.next_actions.join('\n')).toContain('incrementally refresh .graphify');
    expect(graphify.next_actions.join('\n')).toContain('runs `graphify update .`, no full semantic extraction');
    const agents = fs.readFileSync(path.join(tempDir, 'AGENTS.md'), 'utf8');
    expect(agents).toContain('Use Graphify as exploration-tier orientation');
    expect(agents).not.toContain('old provider text');
    expect(agents).toContain('<!-- spec-first:bootstrap:start -->\n## Workflow 入口治理');
    expect(agents).toContain('keep');
  });

  test('install-helpers normalizes provider-written Claude Graphify instructions', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const capturePath = path.join(tempDir, 'graphify-args.txt');
    fs.mkdirSync(path.join(homeDir, '.agents/skills/ast-grep'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(homeDir, '.agents/skills/ast-grep/SKILL.md'), '# ast-grep\n', 'utf8');
    spawnSync('git', ['init'], { cwd: tempDir, encoding: 'utf8' });

    for (const command of ['gh', 'vhs', 'silicon', 'ffmpeg', 'ast-grep']) {
      const commandPath = path.join(binDir, command);
      fs.writeFileSync(commandPath, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(commandPath, 0o755);
    }
    const graphifyPath = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyPath, `#!/bin/sh
printf '%s %s\\n' "$0" "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
if [ "$1" = "install" ]; then
  mkdir -p .claude/skills/graphify
  printf '# graphify\\n' > .claude/skills/graphify/SKILL.md
  cat > CLAUDE.md <<'GRAPHIFY'
# Project

## graphify

Rules:
- For codebase questions, first run \`graphify query "<question>"\` when .graphify/graph.json exists.
- After modifying code, run \`graphify update .\` to keep the graph current (AST-only, no API cost).
GRAPHIFY
  exit 0
fi
if [ "$1" = "query" ]; then
  exit 0
fi
if [ "$1" = "hook" ]; then
  exit 0
fi
if [ "$1" = "extract" ]; then
  mkdir -p .graphify
  printf '{}\\n' > .graphify/graph.json
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(graphifyPath, 0o755);

    const result = spawnSync('bash', [installHelpersPath, '--install'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        GRAPHIFY_CAPTURE: capturePath,
        SPEC_FIRST_PROVIDER_HOST: 'claude',
        SPEC_FIRST_PROVIDER_REPO_ROOT: tempDir,
        SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT: 'approved',
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    const captured = fs.readFileSync(capturePath, 'utf8');
    expect(captured).toContain(`${graphifyPath} install --project --platform claude`);
    const payload = JSON.parse(result.stdout);
    const graphify = payload.provider_readiness.find((entry) => entry.provider === 'graphify');
    expect(graphify.lifecycle.configured).toBe(true);
    const claude = fs.readFileSync(path.join(tempDir, 'CLAUDE.md'), 'utf8');
    expect(claude).toContain('# Project');
    expect(claude).toContain('Graphify CLI is runtime-visible');
    expect(claude).toContain('Use Graphify as exploration-tier orientation');
    expect(claude).toContain('reading source first is always valid');
    expect(claude).toContain('Use `query` for broad orientation');
    expect(claude).toContain('scoped candidate subgraph');
    expect(claude).toContain('spec-mcp-setup --only graphify');
    expect(claude).toContain('docs/contracts/project-graph-consumption.md');
    expect(claude).toContain('Ordinary workflows do not refresh project graphs after code changes');
    expect(claude).not.toContain('Use Graphify first only');
    expect(claude).not.toContain('first run `graphify query "<question>"`');
    expect(claude).not.toContain('run `"<resolved-graphify>" update .`');
  });

  test('install-helpers rejects escaped Graphify requirement workspace without running first generation', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const capturePath = path.join(tempDir, 'graphify-args.txt');
    fs.mkdirSync(path.join(homeDir, '.agents/skills/ast-grep'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(homeDir, '.agents/skills/ast-grep/SKILL.md'), '# ast-grep\n', 'utf8');

    for (const command of ['gh', 'vhs', 'silicon', 'ffmpeg', 'ast-grep']) {
      const commandPath = path.join(binDir, command);
      fs.writeFileSync(commandPath, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(commandPath, 0o755);
    }
    const graphifyPath = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyPath, `#!/bin/sh
printf '%s\\n' "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(graphifyPath, 0o755);

    const result = spawnSync('bash', [installHelpersPath, '--install', '--requirement-workspace', '../outside'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        GRAPHIFY_CAPTURE: capturePath,
        SPEC_FIRST_PROVIDER_REPO_ROOT: tempDir,
        SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT: 'approved',
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    const captured = fs.existsSync(capturePath) ? fs.readFileSync(capturePath, 'utf8') : '';
    expect(captured).toContain('install --project --platform codex');
    expect(captured).not.toContain('extract');
    expect(captured).not.toContain('hook install');
    const payload = JSON.parse(result.stdout);
    const graphify = payload.provider_readiness.find((entry) => entry.provider === 'graphify');
    expect(graphify).toMatchObject({
      first_generation: {
        status: 'skipped',
        next_action: 'requirement-workspace-escape',
      },
      steady_state: {
        hook_installed: false,
        hook_verified: false,
        hook_status: 'skipped',
        hook_skipped_reason: 'first-generation-not-completed',
      },
    });
  });

  test('install-helpers falls back to code-only Graphify update when extract fails', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const capturePath = path.join(tempDir, 'graphify-args.txt');
    fs.mkdirSync(path.join(homeDir, '.agents/skills/ast-grep'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(homeDir, '.agents/skills/ast-grep/SKILL.md'), '# ast-grep\n', 'utf8');
    spawnSync('git', ['init'], { cwd: tempDir, encoding: 'utf8' });

    for (const command of ['gh', 'vhs', 'silicon', 'ffmpeg', 'ast-grep']) {
      const commandPath = path.join(binDir, command);
      fs.writeFileSync(commandPath, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(commandPath, 0o755);
    }
    const graphifyPath = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyPath, `#!/bin/sh
printf '%s\\n' "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
if [ "$1" = "install" ]; then
  mkdir -p .codex/skills/graphify
  printf '# graphify\\n' > .codex/skills/graphify/SKILL.md
  exit 0
fi
if [ "$1" = "extract" ]; then
  exit 2
fi
if [ "$1" = "update" ]; then
  mkdir -p .graphify
  printf '{}\\n' > .graphify/graph.json
  exit 0
fi
if [ "$1" = "query" ]; then
  exit 0
fi
if [ "$1" = "hook" ]; then
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(graphifyPath, 0o755);

    const result = spawnSync('bash', [installHelpersPath, '--install'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        GRAPHIFY_CAPTURE: capturePath,
        SPEC_FIRST_PROVIDER_REPO_ROOT: tempDir,
        SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT: 'approved',
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    const captured = fs.readFileSync(capturePath, 'utf8');
    expect(captured).toContain('install --project --platform codex');
    expect(captured).toContain('extract .');
    expect(captured).toContain('update .');
    expect(captured).toContain('hook install');
    expect(captured).toContain('hook status');
    const payload = JSON.parse(result.stdout);
    const graphify = payload.provider_readiness.find((entry) => entry.provider === 'graphify');
    expect(graphify).toMatchObject({
      first_generation: {
        status: 'completed',
        next_action: 'graphify-code-only-fallback-used',
        artifact_refs: ['.graphify/graph.json'],
      },
      steady_state: {
        hook_installed: true,
        hook_verified: true,
        hook_status: 'verified',
      },
    });
  });

  test('provider readiness renderer derives CodeGraph lifecycle from MCP facts', () => {
    const tempDir = makeTempDir();
    const factsPath = path.join(tempDir, 'facts.json');
    writeJson(factsPath, {
      tools: {
        codegraph: {
          required: false,
          dependency_status: 'ready',
          host_config_status: 'ready',
          project_status: 'ready',
          configured: true,
          result: 'ready',
          reason_code: 'ready',
        },
      },
    });

    const result = spawnSync(process.execPath, [providerRendererPath, '--source', 'mcp', '--facts-file', factsPath, '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        SPEC_FIRST_PROVIDER_CODEGRAPH_SELF_REPORTED_STATUS: 'fresh',
        SPEC_FIRST_PROVIDER_CODEGRAPH_SERVER_REACHABLE: '1',
        SPEC_FIRST_PROVIDER_CODEGRAPH_QUERY_VERIFIED: '1',
      },
    });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)[0]).toMatchObject({
      schema_version: 'provider-readiness.v2',
      provider: 'codegraph',
      kind: 'code-structure',
      profile: 'optional',
      readiness_status: 'unknown',
      lifecycle: {
        installed: true,
        configured: true,
        indexed: true,
        server_reachable: true,
        query_verified: true,
      },
      native_interfaces: ['mcp', 'cli'],
      first_generation: {
        owner: 'runtime-setup',
        status: 'completed',
        scope: 'project',
        requires_explicit_gate: true,
        artifact_root: '.codegraph',
      },
      steady_state: {
        refresh_owner: 'provider-native',
        refresh_mode: 'watcher',
      },
    });

    const configuredOnlyResult = spawnSync(process.execPath, [providerRendererPath, '--source', 'mcp', '--facts-file', factsPath, '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        SPEC_FIRST_PROVIDER_CODEGRAPH_SELF_REPORTED_STATUS: 'fresh',
      },
    });
    expect(configuredOnlyResult.status).toBe(0);
    expect(JSON.parse(configuredOnlyResult.stdout)[0]).toMatchObject({
      provider: 'codegraph',
      lifecycle: {
        installed: true,
        configured: true,
        indexed: true,
        server_reachable: false,
        query_verified: false,
      },
    });
  });

  test('install-mcp default install skips unselected optional MCP entries', () => {
    const tempDir = makeTempDir();
    const binDir = path.join(tempDir, 'bin');
    fs.mkdirSync(binDir, { recursive: true });
    const npxPath = path.join(binDir, 'npx');
    fs.writeFileSync(npxPath, '#!/bin/sh\nexit 0\n', 'utf8');
    fs.chmodSync(npxPath, 0o755);

    const result = spawnSync('bash', [installMcpPath, '--repo', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: tempDir,
        MCP_SETUP_HOST: 'codex',
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
        SPEC_FIRST_WARMUP_CACHE_DIR: path.join(tempDir, 'warmup-cache'),
      },
    });

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.results.map((entry) => entry.tool_id)).toEqual(['sequential-thinking', 'context7']);
    expect(payload.results.some((entry) => entry.tool_id === 'codegraph')).toBe(false);
  });

  test('install-helpers retries Graphify update with force after overwrite refusal', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const capturePath = path.join(tempDir, 'graphify-args.txt');
    fs.mkdirSync(path.join(homeDir, '.agents/skills/ast-grep'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(homeDir, '.agents/skills/ast-grep/SKILL.md'), '# ast-grep\n', 'utf8');
    spawnSync('git', ['init'], { cwd: tempDir, encoding: 'utf8' });

    for (const command of ['gh', 'vhs', 'silicon', 'ffmpeg', 'ast-grep']) {
      const commandPath = path.join(binDir, command);
      fs.writeFileSync(commandPath, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(commandPath, 0o755);
    }
    const graphifyPath = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyPath, `#!/bin/sh
printf '%s\\n' "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
if [ "$1" = "install" ]; then
  mkdir -p .codex/skills/graphify
  printf '# graphify\\n' > .codex/skills/graphify/SKILL.md
  exit 0
fi
if [ "$1" = "extract" ]; then
  exit 2
fi
if [ "$1" = "update" ] && [ "$2" = "." ] && [ "$3" = "--force" ]; then
  mkdir -p .graphify
  printf '{}\\n' > .graphify/graph.json
  exit 0
fi
if [ "$1" = "update" ]; then
  printf 'AST extraction: 6157/6157 files (100%%)\\n'
  printf '[graphify] WARNING: new graph has 101070 nodes but existing graph.json has 102771. Refusing to overwrite — you may be missing chunk files from a previous session. Pass --force to override.\\n'
  exit 1
fi
if [ "$1" = "query" ]; then
  exit 0
fi
if [ "$1" = "hook" ]; then
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(graphifyPath, 0o755);

    const result = spawnSync('bash', [installHelpersPath, '--install'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        GRAPHIFY_CAPTURE: capturePath,
        SPEC_FIRST_PROVIDER_REPO_ROOT: tempDir,
        SPEC_FIRST_PROVIDER_GRAPHIFY_CONSENT: 'approved',
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    const captured = fs.readFileSync(capturePath, 'utf8');
    expect(captured).toContain('extract .');
    expect(captured).toContain('update .');
    expect(captured).toContain('update . --force');
    expect(captured.indexOf('update .')).toBeLessThan(captured.indexOf('update . --force'));
    const payload = JSON.parse(result.stdout);
    const graphify = payload.provider_readiness.find((entry) => entry.provider === 'graphify');
    expect(graphify).toMatchObject({
      first_generation: {
        status: 'completed',
        next_action: 'graphify-force-overwrite-used',
        artifact_refs: ['.graphify/graph.json'],
      },
      steady_state: {
        hook_installed: true,
        hook_verified: true,
        hook_status: 'verified',
      },
    });
  });

  test('install-mcp --only graphify internally approves Graphify and defaults to project workspace', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const capturePath = path.join(tempDir, 'graphify-args.txt');
    fs.mkdirSync(path.join(homeDir, '.agents/skills/ast-grep'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name":"fixture"}\n', 'utf8');
    fs.writeFileSync(path.join(homeDir, '.agents/skills/ast-grep/SKILL.md'), '# ast-grep\n', 'utf8');
    spawnSync('git', ['init'], { cwd: tempDir, encoding: 'utf8' });

    for (const command of ['gh', 'vhs', 'silicon', 'ffmpeg', 'ast-grep']) {
      const commandPath = path.join(binDir, command);
      fs.writeFileSync(commandPath, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(commandPath, 0o755);
    }
    const graphifyPath = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyPath, `#!/bin/sh
printf '%s\\n' "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
if [ "$1" = "install" ]; then
  mkdir -p .codex/skills/graphify
  printf '# graphify\\n' > .codex/skills/graphify/SKILL.md
  exit 0
fi
if [ "$1" = "query" ]; then
  exit 0
fi
if [ "$1" = "hook" ]; then
  exit 0
fi
out=''
while [ "$#" -gt 0 ]; do
  if [ "$1" = "--out" ]; then
    out="$2/.graphify"
    shift 2
    continue
  fi
  shift
done
if [ -z "$out" ]; then
  out=".graphify"
fi
mkdir -p "$out"
printf '{}\\n' > "$out/graph.json"
printf '# report\\n' > "$out/GRAPH_REPORT.md"
exit 0
`, 'utf8');
    fs.chmodSync(graphifyPath, 0o755);

    const result = spawnSync('bash', [installMcpPath, '--only', 'graphify'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        MCP_SETUP_HOST: 'codex',
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        GRAPHIFY_CAPTURE: capturePath,
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    const capturedGraphifyArgs = fs.readFileSync(capturePath, 'utf8');
    expect(capturedGraphifyArgs).toContain('install --project --platform codex');
    expect(capturedGraphifyArgs).toContain('extract');
    expect(capturedGraphifyArgs).toContain('hook install');
    expect(capturedGraphifyArgs).toContain('hook status');
    expect(capturedGraphifyArgs).toContain('query spec-first setup readiness --graph');
    expect(capturedGraphifyArgs).not.toContain('.spec-first/workspace/providers/graphify/.graphify');
    const payload = JSON.parse(result.stdout);
    expect(payload.results).toEqual([]);
    expect(payload.provider_apply).toMatchObject({
      selected: ['graphify'],
      route: 'install-helpers',
      status: 'ready',
    });
    const graphify = payload.provider_readiness.find((entry) => entry.provider === 'graphify');
    expect(graphify).toMatchObject({
      first_generation: {
        status: 'completed',
        requirement_workspace_path: '.',
        artifact_root: '.graphify',
        artifact_refs: ['.graphify/graph.json'],
      },
      steady_state: {
        hook_installed: true,
        hook_verified: true,
        hook_status: 'verified',
      },
    });
  });

  test('install-mcp --only graphify --refresh incrementally refreshes existing Graphify artifact', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const capturePath = path.join(tempDir, 'graphify-args.txt');
    fs.mkdirSync(path.join(homeDir, '.agents/skills/ast-grep'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.codex/skills/graphify'), { recursive: true });
    fs.mkdirSync(path.join(tempDir, '.graphify'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name":"fixture"}\n', 'utf8');
    fs.writeFileSync(path.join(homeDir, '.agents/skills/ast-grep/SKILL.md'), '# ast-grep\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.codex/skills/graphify/SKILL.md'), '# graphify\n', 'utf8');
    fs.writeFileSync(path.join(tempDir, '.graphify/graph.json'), '{}\n', 'utf8');
    spawnSync('git', ['init'], { cwd: tempDir, encoding: 'utf8' });

    for (const command of ['gh', 'vhs', 'silicon', 'ffmpeg', 'ast-grep']) {
      const commandPath = path.join(binDir, command);
      fs.writeFileSync(commandPath, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(commandPath, 0o755);
    }
    const graphifyPath = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyPath, `#!/bin/sh
printf '%s\\n' "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
if [ "$1" = "query" ]; then
  exit 0
fi
if [ "$1" = "hook" ]; then
  exit 0
fi
if [ "$1" = "update" ]; then
  mkdir -p .graphify
  printf '{"refreshed":true}\\n' > .graphify/graph.json
  exit 0
fi
if [ "$1" = "extract" ] || [ "$1" = "install" ]; then
  exit 4
fi
exit 0
`, 'utf8');
    fs.chmodSync(graphifyPath, 0o755);

    const result = spawnSync('bash', [installMcpPath, '--only', 'graphify', '--refresh'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        MCP_SETUP_HOST: 'codex',
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        GRAPHIFY_CAPTURE: capturePath,
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    const capturedGraphifyArgs = fs.readFileSync(capturePath, 'utf8');
    expect(capturedGraphifyArgs).toContain('update .');
    expect(capturedGraphifyArgs).toContain('query spec-first setup readiness --graph');
    expect(capturedGraphifyArgs).toContain('hook install');
    expect(capturedGraphifyArgs).toContain('hook status');
    expect(capturedGraphifyArgs).not.toContain('extract .');
    expect(capturedGraphifyArgs).not.toContain('install --project --platform codex');
    const payload = JSON.parse(result.stdout);
    const graphify = payload.provider_readiness.find((entry) => entry.provider === 'graphify');
    expect(graphify).toMatchObject({
      first_generation: {
        status: 'completed',
        next_action: 'graphify-refresh-used',
        requirement_workspace_path: '.',
        artifact_root: '.graphify',
        artifact_refs: ['.graphify/graph.json'],
      },
    });
  });

  test('install-mcp --all-repos --only graphify --refresh propagates refresh to child repos', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const childDir = path.join(tempDir, 'child-app');
    const capturePath = path.join(tempDir, 'graphify-args.txt');
    fs.mkdirSync(path.join(homeDir, '.agents/skills/ast-grep'), { recursive: true });
    fs.mkdirSync(path.join(childDir, '.codex/skills/graphify'), { recursive: true });
    fs.mkdirSync(path.join(childDir, '.graphify'), { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(childDir, 'package.json'), '{"name":"child-app"}\n', 'utf8');
    fs.writeFileSync(path.join(homeDir, '.agents/skills/ast-grep/SKILL.md'), '# ast-grep\n', 'utf8');
    fs.writeFileSync(path.join(childDir, '.codex/skills/graphify/SKILL.md'), '# graphify\n', 'utf8');
    fs.writeFileSync(path.join(childDir, '.graphify/graph.json'), '{}\n', 'utf8');
    spawnSync('git', ['init'], { cwd: childDir, encoding: 'utf8' });

    for (const command of ['gh', 'vhs', 'silicon', 'ffmpeg', 'ast-grep']) {
      const commandPath = path.join(binDir, command);
      fs.writeFileSync(commandPath, '#!/bin/sh\nexit 0\n', 'utf8');
      fs.chmodSync(commandPath, 0o755);
    }
    const graphifyPath = path.join(binDir, 'graphify');
    fs.writeFileSync(graphifyPath, `#!/bin/sh
printf '%s:%s\\n' "$PWD" "$*" >> "$GRAPHIFY_CAPTURE"
if [ "$1" = "--version" ]; then
  printf 'graphify ${GRAPHIFY_VERSION}\\n'
  exit 0
fi
if [ "$1" = "query" ]; then
  exit 0
fi
if [ "$1" = "hook" ]; then
  exit 0
fi
if [ "$1" = "update" ]; then
  mkdir -p .graphify
  printf '{"refreshed":true}\\n' > .graphify/graph.json
  exit 0
fi
if [ "$1" = "extract" ] || [ "$1" = "install" ]; then
  exit 4
fi
exit 0
`, 'utf8');
    fs.chmodSync(graphifyPath, 0o755);

    const result = spawnSync('bash', [installMcpPath, '--all-repos', '--only', 'graphify', '--refresh'], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        MCP_SETUP_HOST: 'codex',
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        GRAPHIFY_CAPTURE: capturePath,
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    const capturedGraphifyArgs = fs.readFileSync(capturePath, 'utf8');
    const childRealPath = fs.realpathSync(childDir);
    expect(capturedGraphifyArgs).toContain(`${childRealPath}:update .`);
    expect(capturedGraphifyArgs).toContain(`${childRealPath}:hook install`);
    expect(capturedGraphifyArgs).not.toContain(`${childRealPath}:extract .`);
    const payload = JSON.parse(result.stdout);
    expect(payload).toMatchObject({
      workflow_mode: 'all-repos',
      overall_status: 'ready',
      counts: {
        total: 1,
        ready: 1,
      },
    });
    const childGraphify = payload.results[0].result.provider_readiness.find((entry) => entry.provider === 'graphify');
    expect(childGraphify.first_generation).toMatchObject({
      status: 'completed',
      next_action: 'graphify-refresh-used',
      artifact_refs: ['.graphify/graph.json'],
    });
  });

  test('install-mcp syncs CodeGraph when status reports pending changes', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const capturePath = path.join(tempDir, 'codegraph-args.txt');
    fs.mkdirSync(homeDir, { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name":"fixture"}\n', 'utf8');
    spawnSync('git', ['init'], { cwd: tempDir, encoding: 'utf8' });

    const npmPath = path.join(binDir, 'npm');
    fs.writeFileSync(npmPath, '#!/bin/sh\nexit 0\n', 'utf8');
    fs.chmodSync(npmPath, 0o755);

    const codegraphPath = path.join(binDir, 'codegraph');
    fs.writeFileSync(codegraphPath, `#!/bin/sh
printf '%s\\n' "$*" >> "$CODEGRAPH_CAPTURE"
if [ "$1" = "--version" ]; then
  printf '${CODEGRAPH_VERSION}\\n'
  exit 0
fi
if [ "$1" = "init" ]; then
  mkdir -p .codegraph
  printf 'db\\n' > .codegraph/codegraph.db
  exit 0
fi
if [ "$1" = "status" ]; then
  if [ -f .codegraph/synced ]; then
    printf 'CodeGraph Status\\nIndex Statistics\\n'
  else
    printf 'CodeGraph Status\\nPending Changes:\\n  Modified: 1 files\\nRun "codegraph sync" to update the index\\n'
  fi
  exit 0
fi
if [ "$1" = "sync" ]; then
  mkdir -p .codegraph
  printf 'ok\\n' > .codegraph/synced
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(codegraphPath, 0o755);

    const result = spawnSync('bash', [installMcpPath, '--only', 'codegraph', '--repo', tempDir], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        MCP_SETUP_HOST: 'codex',
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        CODEGRAPH_CAPTURE: capturePath,
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    const captured = fs.readFileSync(capturePath, 'utf8');
    expect(captured).toContain('--version');
    expect(captured).toContain('init');
    expect(captured).toContain('status');
    expect(captured).toContain('sync');
    const payload = JSON.parse(result.stdout);
    expect(payload.results.find((entry) => entry.tool_id === 'codegraph')).toMatchObject({
      status: 'ready',
      last_action: 'project-bootstrapped-status-synced',
    });
  });

  test('install-mcp runs one CodeGraph full reindex after sync cannot clear old-engine advisory', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const capturePath = path.join(tempDir, 'codegraph-args.txt');
    fs.mkdirSync(homeDir, { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name":"fixture"}\n', 'utf8');
    spawnSync('git', ['init'], { cwd: tempDir, encoding: 'utf8' });

    const npmPath = path.join(binDir, 'npm');
    fs.writeFileSync(npmPath, '#!/bin/sh\nexit 0\n', 'utf8');
    fs.chmodSync(npmPath, 0o755);

    const codegraphPath = path.join(binDir, 'codegraph');
    fs.writeFileSync(codegraphPath, `#!/bin/sh
printf '%s\\n' "$*" >> "$CODEGRAPH_CAPTURE"
if [ "$1" = "--version" ]; then
  printf '${CODEGRAPH_VERSION}\\n'
  exit 0
fi
if [ "$1" = "init" ]; then
  mkdir -p .codegraph
  printf 'db\\n' > .codegraph/codegraph.db
  exit 0
fi
if [ "$1" = "status" ]; then
  if [ -f .codegraph/reindexed ]; then
    printf 'CodeGraph Status\\nIndex is up to date\\n'
  else
    printf 'CodeGraph Status\\nIndex is up to date\\nRun "codegraph index -f" (full rebuild) or "codegraph sync"\\n'
  fi
  exit 0
fi
if [ "$1" = "sync" ]; then
  mkdir -p .codegraph
  printf 'already up to date\\n'
  exit 0
fi
if [ "$1" = "index" ] && [ "$2" = "-f" ]; then
  mkdir -p .codegraph
  printf 'ok\\n' > .codegraph/reindexed
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(codegraphPath, 0o755);

    const result = spawnSync('bash', [installMcpPath, '--only', 'codegraph', '--repo', tempDir], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        MCP_SETUP_HOST: 'codex',
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        CODEGRAPH_CAPTURE: capturePath,
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    const capturedLines = fs.readFileSync(capturePath, 'utf8').trim().split('\n');
    expect(capturedLines).toEqual(expect.arrayContaining([
      '--version',
      'init',
      'status',
      'sync',
      'index -f',
    ]));
    expect(capturedLines.join(' > ')).toContain('status > sync > status > index -f > status');
    expect(JSON.parse(result.stdout).results.find((entry) => entry.tool_id === 'codegraph')).toMatchObject({
      status: 'ready',
      last_action: 'project-status-full-reindexed',
      reason_code: 'codegraph-full-reindex-used',
    });
  });

  test('install-mcp reinstalls CodeGraph when existing CLI version does not match the pin', () => {
    const tempDir = makeTempDir();
    const homeDir = path.join(tempDir, 'home');
    const binDir = path.join(tempDir, 'bin');
    const codegraphCapturePath = path.join(tempDir, 'codegraph-args.txt');
    const npmCapturePath = path.join(tempDir, 'npm-args.txt');
    const versionMarker = path.join(tempDir, 'codegraph-upgraded');
    fs.mkdirSync(homeDir, { recursive: true });
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'package.json'), '{"name":"fixture"}\n', 'utf8');
    spawnSync('git', ['init'], { cwd: tempDir, encoding: 'utf8' });

    const npmPath = path.join(binDir, 'npm');
    fs.writeFileSync(npmPath, `#!/bin/sh
printf '%s\\n' "$*" >> "$NPM_CAPTURE"
touch "$CODEGRAPH_VERSION_MARKER"
exit 0
`, 'utf8');
    fs.chmodSync(npmPath, 0o755);

    const codegraphPath = path.join(binDir, 'codegraph');
    fs.writeFileSync(codegraphPath, `#!/bin/sh
printf '%s\\n' "$*" >> "$CODEGRAPH_CAPTURE"
if [ "$1" = "--version" ]; then
  if [ -f "$CODEGRAPH_VERSION_MARKER" ]; then
    printf '${CODEGRAPH_VERSION}\\n'
  else
    printf '0.9.8\\n'
  fi
  exit 0
fi
if [ "$1" = "init" ]; then
  mkdir -p .codegraph
  printf 'db\\n' > .codegraph/codegraph.db
  exit 0
fi
if [ "$1" = "status" ]; then
  printf 'CodeGraph Status\\nIndex Statistics\\n'
  exit 0
fi
exit 0
`, 'utf8');
    fs.chmodSync(codegraphPath, 0o755);

    const result = spawnSync('bash', [installMcpPath, '--only', 'codegraph', '--repo', tempDir], {
      cwd: tempDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        HOME: homeDir,
        MCP_SETUP_HOST: 'codex',
        PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
        CODEGRAPH_CAPTURE: codegraphCapturePath,
        NPM_CAPTURE: npmCapturePath,
        CODEGRAPH_VERSION_MARKER: versionMarker,
        SPEC_FIRST_STAGE_TIMEOUT_SECONDS: '5',
      },
    });

    expect(result.status).toBe(0);
    expect(fs.readFileSync(npmCapturePath, 'utf8')).toContain(`install -g ${CODEGRAPH_PACKAGE}@${CODEGRAPH_VERSION}`);
    const captured = fs.readFileSync(codegraphCapturePath, 'utf8');
    expect(captured.match(/--version/g).length).toBeGreaterThanOrEqual(2);
    expect(JSON.parse(result.stdout).results.find((entry) => entry.tool_id === 'codegraph')).toMatchObject({
      status: 'ready',
      last_action: 'project-bootstrapped-status-checked',
    });
  });

  test('normalizer surfaces configured scan status so scan failures are not silently empty', () => {
    const scanFailed = normalizeSetupFacts(toolFactsFixture({ configured_scan_status: 'scan-failed' }));
    expect(scanFailed.configured_scan_status).toBe('scan-failed');

    const scanOk = normalizeSetupFacts(toolFactsFixture({ configured_scan_status: 'ok' }));
    expect(scanOk.configured_scan_status).toBe('ok');

    // 旧 facts 缺字段时归为 unknown,不伪装成 ok。
    const legacy = normalizeSetupFacts(toolFactsFixture());
    expect(legacy.configured_scan_status).toBe('unknown');
  });

  test('normalizer provider projection satisfies the provider-readiness.v2 schema it claims', () => {
    const providerSchema = readJson(path.join(repoRoot, 'docs/contracts/provider-readiness.schema.json'));
    // 从稀疏输入(仅 provider + readiness_status)归一化,确认默认填充后仍满足自己宣称的 schema。
    const projection = normalizeSetupFacts(toolFactsFixture({
      provider_readiness: [{
        provider: 'graphify',
        readiness_status: 'not-run',
        steady_state: {
          refresh_owner: 'provider-native',
          refresh_mode: 'skill-cli-hook-on-demand',
          hook_default: true,
          usage_owner: 'downstream-skill',
          hook_installed: true,
          hook_verified: true,
          hook_status: 'verified',
          hook_skipped_reason: null,
        },
      }],
    }));
    const entry = projection.provider_readiness[0];
    expect(entry.schema_version).toBe('provider-readiness.v2');
    expect(entry.profile).toBe('optional');
    expect(entry.first_generation).toMatchObject({
      owner: 'unknown',
      status: 'unknown',
      scope: 'unknown',
    });
    expect(entry.steady_state).toMatchObject({
      refresh_owner: 'provider-native',
      refresh_mode: 'skill-cli-hook-on-demand',
      hook_installed: true,
      hook_verified: true,
      hook_status: 'verified',
    });
    expect(validateAgainstSchema(providerSchema, entry).errors).toEqual([]);
  });

  test('normalizer keeps v1 compatible and deterministic', () => {
    const legacyFacts = {
      schema_version: 'tool-facts.v1',
      generated_at: '2026-06-04T00:00:00Z',
      tools: {
        context7: { status: 'ready' },
      },
      helper_tools: {
        'agent-browser': { status: 'missing', required: true, baseline_blocking: false },
      },
    };

    const first = normalizeSetupFacts(legacyFacts, { now: new Date('2026-06-04T00:01:00Z') });
    const second = normalizeSetupFacts(legacyFacts, { now: new Date('2026-06-04T00:01:00Z') });

    expect(second).toEqual(first);
    expect(first.schema_versions.tool_facts).toBe('tool-facts.v1');
    expect(first.items.find((item) => item.id === 'context7')).toMatchObject({
      kind: 'mcp',
      result: 'ready',
      installed: true,
    });
    expect(first.items.find((item) => item.id === 'agent-browser')).toMatchObject({
      profile: 'minimal',
      configured_status: 'not-checked',
      baseline_blocking: false,
      missing_dependency_reason: 'missing_dependency',
    });
  });

  test('normalizer repairs contradictory ready result from stale setup facts', () => {
    const projection = normalizeSetupFacts(toolFactsFixture({
      host: 'claude',
      provider_readiness: [],
      items: [
        {
          id: 'context7',
          kind: 'mcp',
          profile: 'minimal',
          required: true,
          baseline_blocking: true,
          dependency_status: 'ready',
          configured_status: 'action-required',
          result: 'ready',
          reason_code: 'ready',
          installed: true,
          missing_dependency_reason: null,
          next_action: 'configure host',
        },
      ],
    }), { now: new Date('2026-06-04T00:01:00Z') });

    expect(projection.items.find((item) => item.id === 'context7')).toMatchObject({
      configured_status: 'action-required',
      result: 'action-required',
      reason_code: 'host-config-action-required',
    });
    expect(projection.counts.required_action).toBe(1);
  });

  test('normalizer treats registry args drift as degraded, not required action', () => {
    const projection = normalizeSetupFacts(toolFactsFixture({
      provider_readiness: [],
      items: [
        {
          id: 'context7',
          kind: 'mcp',
          profile: 'minimal',
          required: true,
          baseline_blocking: true,
          dependency_status: 'ready',
          configured_status: 'registry-args-drift',
          result: 'degraded',
          reason_code: 'host-config-version-drift',
          installed: true,
          missing_dependency_reason: null,
          next_action: '',
        },
      ],
    }), { now: new Date('2026-06-04T00:01:00Z') });

    expect(projection.items.find((item) => item.id === 'context7')).toMatchObject({
      result: 'degraded',
      reason_code: 'host-config-version-drift',
    });
    expect(projection.counts.required_action).toBe(0);
    expect(projection.counts.degraded).toBe(1);
  });

  test('normalizer reports unreadable, invalid, and unsupported facts distinctly', () => {
    const tmp = makeTempDir();
    try {
      const invalidPath = path.join(tmp, 'invalid.json');
      const unsupportedPath = path.join(tmp, 'unsupported.json');
      fs.writeFileSync(invalidPath, '{', 'utf8');
      writeJson(unsupportedPath, { schema_version: 'tool-facts.v999' });

      expect(normalizeSetupFactsFile(path.join(tmp, 'missing.json')).reason_code).toBe('setup-facts-missing');
      expect(normalizeSetupFactsFile(invalidPath).reason_code).toBe('setup-facts-unreadable');
      expect(normalizeSetupFactsFile(unsupportedPath).reason_code).toBe('setup-facts-schema-unsupported');
      expect(normalizeSetupFacts(null).reason_code).toBe('setup-facts-invalid');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('doctor decision input health is computed from setup facts', () => {
    const tmp = makeTempDir();
    try {
      const factsPath = path.join(tmp, '.spec-first/config/tool-facts.json');
      const now = new Date('2026-06-04T00:00:00Z');

      expect(computeDecisionInputHealth({ projectRoot: tmp, platforms: [] })).toMatchObject({
        status: 'not_checked',
        basis: { reason_code: 'no-host-selected' },
      });
      expect(computeDecisionInputHealth({ projectRoot: tmp, platforms: ['codex'] })).toMatchObject({
        status: 'missing',
        basis: { reason_code: 'setup-facts-missing' },
      });

      writeJson(factsPath, toolFactsFixture({
        host: 'claude',
        generated_at: '2026-06-04T00:00:00Z',
        provider_readiness: [],
      }));
      expect(computeDecisionInputHealth({ projectRoot: tmp, platforms: ['codex'], now })).toMatchObject({
        status: 'missing',
        basis: {
          reason_code: 'setup-facts-host-mismatch',
          facts_host: 'claude',
          requested_platforms: ['codex'],
          next_action: 'Run `spec-mcp-setup` from codex to refresh host-aligned setup facts.',
        },
      });
      expect(computeDecisionInputHealth({ projectRoot: tmp, platforms: ['claude'], now })).toMatchObject({
        status: 'pass',
        basis: { reason_code: 'setup-facts-ready' },
      });

      fs.mkdirSync(path.dirname(factsPath), { recursive: true });
      fs.writeFileSync(factsPath, '{', 'utf8');
      expect(computeDecisionInputHealth({ projectRoot: tmp, platforms: ['codex'], now })).toMatchObject({
        status: 'error',
        basis: { reason_code: 'setup-facts-invalid' },
      });

      writeJson(factsPath, toolFactsFixture({
        generated_at: '2026-05-01T00:00:00Z',
        provider_readiness: [],
      }));
      expect(computeDecisionInputHealth({ projectRoot: tmp, platforms: ['codex'], now })).toMatchObject({
        status: 'stale',
        basis: { reason_code: 'setup-facts-stale' },
      });

      writeJson(factsPath, toolFactsFixture({
        generated_at: '2026-06-04T00:00:00Z',
        provider_readiness: [],
        items: [
          {
            id: 'context7',
            kind: 'mcp',
            profile: 'minimal',
            required: true,
            baseline_blocking: true,
            dependency_status: 'missing',
            configured_status: 'missing',
            result: 'action-required',
            reason_code: 'missing_dependency',
            installed: false,
            missing_dependency_reason: 'missing_dependency',
            next_action: 'install context7',
          },
        ],
      }));
      expect(computeDecisionInputHealth({ projectRoot: tmp, platforms: ['codex'], now })).toMatchObject({
        status: 'error',
        basis: { reason_code: 'required-runtime-action-required' },
      });

      writeJson(factsPath, toolFactsFixture({
        generated_at: '2026-06-04T00:00:00Z',
        provider_readiness: [providerFixture({ readiness_status: 'stale' })],
      }));
      expect(computeDecisionInputHealth({ projectRoot: tmp, platforms: ['codex'], now })).toMatchObject({
        status: 'warn',
        basis: {
          reason_code: 'optional-capability-degraded',
          next_action: 'Rerun `spec-mcp-setup` from codex to refresh degraded optional capability facts.',
        },
      });

      writeJson(factsPath, toolFactsFixture({
        host: 'claude',
        generated_at: '2026-06-04T00:00:00Z',
        provider_readiness: [
          providerFixture({
            provider: 'graphify',
            kind: 'project-graph',
            readiness_status: 'degraded',
            lifecycle: {
              installed: true,
              configured: false,
              initialized: true,
              indexed: true,
              server_reachable: false,
              artifact_exists: true,
              query_verified: false,
              fallback_used: false,
            },
            next_actions: ['Install the current-host Graphify project skill with `spec-mcp-setup --only graphify` for claude.'],
          }),
        ],
      }));
      expect(computeDecisionInputHealth({ projectRoot: tmp, platforms: ['claude'], now })).toMatchObject({
        status: 'warn',
        basis: {
          reason_code: 'optional-capability-degraded',
          next_action: 'Rerun `spec-mcp-setup` from claude to refresh degraded optional capability facts.',
        },
      });

      // configured scan 失败必须降级 health(warn)并在 basis 暴露 configured_scan_status,
      // 不得静默 pass(否则 M3 的诚实降级信号没有 consumer,等于未交付)。
      writeJson(factsPath, toolFactsFixture({
        generated_at: '2026-06-04T00:00:00Z',
        provider_readiness: [],
        configured_scan_status: 'scan-failed',
      }));
      expect(computeDecisionInputHealth({ projectRoot: tmp, platforms: ['codex'], now })).toMatchObject({
        status: 'warn',
        basis: {
          reason_code: 'configured-scan-degraded',
          configured_scan_status: 'scan-failed',
        },
      });

      writeJson(factsPath, toolFactsFixture({
        generated_at: '2026-06-04T00:00:00Z',
        provider_readiness: [],
      }));
      const ready = computeDecisionInputHealth({ projectRoot: tmp, platforms: ['codex'], now });
      expect(ready).toMatchObject({
        status: 'pass',
        basis: { reason_code: 'setup-facts-ready' },
      });
      expect(ready.basis.artifact_refs).toEqual([factsPath]);
      expect(ready.basis.freshness.max_age_ms).toBe(SETUP_FACTS_MAX_AGE_MS);
      // 该 fixture 未带 configured_scan_status,归一化为 'unknown'(不伪装 ok),仍 pass。
      expect(ready.basis.configured_scan_status).toBe('unknown');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('configured dependency scanner covers hooks, allowlist, setup scripts, mcp facts, and verification commands', () => {
    const tmp = makeTempDir();
    try {
      writeJson(path.join(tmp, 'package.json'), {
        scripts: {
          setup: 'definitely-missing-setup-tool --init',
          test: 'node test.js',
        },
      });
      writeJson(path.join(tmp, '.claude/settings.json'), {
        mcpServers: {
          local: { command: 'node', args: ['server.js'] },
        },
        permissions: {
          allow: ['Bash(definitely-missing-allow-tool check *)', 'Read(*)'],
        },
        hooks: {
          SessionStart: [
            {
              matcher: 'startup',
              hooks: [
                // spec-first managed runtime hook:不应被扫成 configured dependency。
                { type: 'command', command: '"$CLAUDE_PROJECT_DIR"/.claude/hooks/session-start' },
                // 用户配置的真外部 hook 工具:仍必须被扫成 undeclared。
                { type: 'command', command: 'definitely-missing-hook-tool --run' },
              ],
            },
          ],
        },
      });
      writeJson(path.join(tmp, 'spec-first.verification.json'), {
        schema_version: 'verification-profile.v1',
        default_profile: 'default',
        profiles: {
          default: {
            services: ['root'],
            checks: ['lint'],
          },
        },
        services: {
          root: {
            path: '.',
            stack: 'node',
            required: true,
          },
        },
        stacks: {
          node: {
            detect: ['package.json'],
            commands: {
              lint: 'definitely-missing-verifier --strict',
            },
            runner_kind: {
              lint: 'custom',
            },
            required_tools: {
              lint: ['definitely-missing-verifier'],
            },
          },
        },
      });
      const factsPath = path.join(tmp, 'facts.json');
      writeJson(factsPath, {
        tools: {
          context7: { status: 'ready', host_config_status: 'ready' },
          'sequential-thinking': { dependency_status: 'ready', host_config_status: 'registry-args-drift' },
        },
      });

      const result = spawnSync('node', [scanConfiguredDepsPath, '--repo-root', tmp, '--facts-file', factsPath], {
        cwd: repoRoot,
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      const payload = JSON.parse(result.stdout);
      const byKind = new Map(payload.configured_dependencies.map((entry) => [entry.kind, entry]));
      expect(payload.configured_dependencies.find((entry) => entry.id === 'mcp-config:context7')).toMatchObject({
        command: 'context7',
        result: 'ready',
      });
      expect(payload.configured_dependencies.find((entry) => entry.id === 'mcp-config:sequential-thinking')).toMatchObject({
        configured_status: 'registry-args-drift',
        result: 'degraded',
        reason_code: 'host-config-version-drift',
      });
      expect(payload.configured_dependencies.find((entry) => entry.id === 'mcp-config:local')).toMatchObject({
        kind: 'mcp-config',
        command: 'node',
        declared_status: 'declared',
      });
      // spec-first managed runtime hook(.claude/hooks/)被跳过,不产生 hook 条目;
      // 但用户配置的真外部 hook 工具仍被扫成 undeclared,证明未过度跳过。
      const hookEntries = payload.configured_dependencies.filter((entry) => entry.kind === 'hook');
      expect(hookEntries.every((entry) => !/session-start/.test(entry.command))).toBe(true);
      expect(hookEntries.find((entry) => entry.command === 'definitely-missing-hook-tool')).toMatchObject({
        command: 'definitely-missing-hook-tool',
        result: 'action-required',
        reason_code: 'configured-dependency-undeclared',
      });
      expect(byKind.get('permission-allowlist')).toMatchObject({
        command: 'definitely-missing-allow-tool',
        result: 'action-required',
        reason_code: 'configured-dependency-undeclared',
      });
      expect(byKind.get('setup-script')).toMatchObject({
        command: 'definitely-missing-setup-tool',
        result: 'action-required',
        reason_code: 'configured-dependency-undeclared',
      });
      expect(byKind.get('verification-command')).toMatchObject({
        command: 'definitely-missing-verifier',
        result: 'action-required',
        reason_code: 'configured-dependency-undeclared',
      });
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('configured dependency scanner emits verification required tools independently from wrapper commands', () => {
    const tmp = makeTempDir();
    try {
      writeJson(path.join(tmp, 'spec-first.verification.json'), {
        schema_version: 'verification-profile.v1',
        default_profile: 'default',
        profiles: {
          default: {
            services: ['root'],
            checks: ['e2e'],
          },
        },
        services: {
          root: {
            path: '.',
            stack: 'node',
            required: true,
          },
        },
        stacks: {
          node: {
            detect: ['package.json'],
            commands: {
              e2e: 'npm run test:e2e',
            },
            runner_kind: {
              e2e: 'npm-script',
            },
            required_tools: {
              e2e: ['definitely-missing-verifier'],
            },
          },
        },
      });

      const result = spawnSync('node', [scanConfiguredDepsPath, '--repo-root', tmp], {
        cwd: repoRoot,
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.configured_dependencies.find((entry) => entry.id === 'verification-command:e2e')).toMatchObject({
        kind: 'verification-command',
        command: 'npm',
      });
      expect(payload.configured_dependencies.find((entry) => entry.id === 'verification-required-tool:e2e:definitely-missing-verifier')).toMatchObject({
        kind: 'verification-required-tool',
        command: 'definitely-missing-verifier',
        result: 'action-required',
        reason_code: 'configured-dependency-undeclared',
      });
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('configured dependency scanner reports invalid verification profiles instead of silently dropping them', () => {
    const tmp = makeTempDir();
    try {
      writeJson(path.join(tmp, 'spec-first.verification.json'), {
        schema_version: 'verification-profile.v1',
        default_profile: 'default',
        profiles: {
          default: {
            services: ['root'],
            checks: ['missing-check'],
          },
        },
        services: {
          root: {
            path: '.',
            stack: 'node',
            required: true,
          },
        },
        stacks: {
          node: {
            detect: ['package.json'],
            commands: {},
            runner_kind: {},
            required_tools: {},
          },
        },
      });

      const result = spawnSync('node', [scanConfiguredDepsPath, '--repo-root', tmp], {
        cwd: repoRoot,
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.configured_dependencies).toEqual([
        expect.objectContaining({
          id: 'verification-profile:spec-first.verification.json',
          kind: 'verification-profile',
          result: 'action-required',
          reason_code: 'profile-resolution-invalid',
        }),
      ]);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('configured dependency scanner reports unreadable verification profile JSON', () => {
    const tmp = makeTempDir();
    try {
      fs.writeFileSync(path.join(tmp, 'spec-first.verification.json'), '{', 'utf8');

      const result = spawnSync('node', [scanConfiguredDepsPath, '--repo-root', tmp], {
        cwd: repoRoot,
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      const payload = JSON.parse(result.stdout);
      expect(payload.configured_dependencies).toEqual([
        expect.objectContaining({
          id: 'verification-profile:spec-first.verification.json',
          kind: 'verification-profile',
          result: 'action-required',
          reason_code: 'profile-unreadable',
        }),
      ]);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('scan rejects when --repo-root is missing instead of falling back to cwd (C1)', () => {
    const result = spawnSync('node', [scanConfiguredDepsPath], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/--repo-root required/);
  });

  it('scan includes Codex host configured hooks for dual-host parity (C2/Req18)', () => {
    const tmp = makeTempDir();
    try {
      writeJson(path.join(tmp, '.codex/hooks.json'), {
        hooks: {
          SessionStart: [
            {
              matcher: 'startup',
              hooks: [
                // spec-first managed runtime hook(.codex/hooks/):双宿主对等跳过,不报 undeclared。
                { type: 'command', command: '"$CODEX_PROJECT_DIR"/.codex/hooks/session-start' },
                { type: 'command', command: 'bash "C:/Users/spec/project/.codex/hooks/session-start"' },
                { type: 'command', command: 'definitely-missing-codex-hook --flag' },
              ],
            },
          ],
        },
      });
      const result = spawnSync('node', [scanConfiguredDepsPath, '--repo-root', tmp], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      expect(result.status).toBe(0);
      const payload = JSON.parse(result.stdout);
      const codexHooks = payload.configured_dependencies.filter((entry) => entry.host === 'codex');
      // managed runtime hook 不出现;仅外部 hook 工具被标记。
      expect(codexHooks.every((entry) => !/session-start/.test(entry.command))).toBe(true);
      expect(codexHooks.find((entry) => entry.command === 'definitely-missing-codex-hook')).toMatchObject({
        kind: 'hook',
        host: 'codex',
        command: 'definitely-missing-codex-hook',
        result: 'action-required',
        reason_code: 'configured-dependency-undeclared',
      });
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('normalizes unknown source.status to "unknown" result, not pass-through (C5)', () => {
    const projection = normalizeSetupFacts({
      schema_version: 'tool-facts.v2',
      items: [
        // dependency ready 但 status 是非枚举自定义值：不得透传为 result
        { id: 'weird', dependency_status: 'ready', status: 'some-custom-state', required: true },
      ],
    });
    const item = projection.items.find((entry) => entry.id === 'weird');
    expect(['ready', 'degraded', 'skipped', 'action-required', 'unsupported', 'unknown']).toContain(item.result);
    expect(item.result).not.toBe('some-custom-state');
  });

  // 回归:items[].result 的未知值不得绕过 required_action 计数。曾因 inferItemResult
  // 在「依赖非 ready」分支直接透传 source.result(只排除 'ready'),使 result:"bogus"
  // 这类未知值逃过 isRequiredAction 的 'action-required' 枚举判断,baseline blocker
  // 缺失却 required_action=0。修复后未知 result 在该分支回落 action-required 并被计数。
  it('does not let an unknown items[].result value bypass required_action counting', () => {
    const projection = normalizeSetupFacts({
      schema_version: 'tool-facts.v2',
      items: [
        {
          id: 'evil',
          kind: 'cli',
          profile: 'minimal',
          required: true,
          baseline_blocking: true,
          dependency_status: 'missing',
          configured_status: 'not-applicable',
          result: 'bogus',
          reason_code: 'x',
          installed: false,
          next_action: '',
        },
      ],
    });
    const item = projection.items.find((entry) => entry.id === 'evil');
    expect(item.result).toBe('action-required');
    expect(item.result).not.toBe('bogus');
    expect(projection.counts.required_action).toBe(1);
  });

  it('verify-tools status table defines all 9 required sections (C4/Req7)', () => {
    const verifyTools = fs.readFileSync(
      path.join(repoRoot, 'skills/spec-mcp-setup/scripts/verify-tools.sh'),
      'utf8',
    );
    const requiredSections = [
      'Execution result',
      'MCP servers',
      'Helper tools',
      'Provider tools',
      'Host configured dependencies',
      'Install safety',
      'Project setup facts',
      'Verification profile',
      'Next steps',
    ];
    for (const title of requiredSections) {
      expect(verifyTools).toContain(`title: "${title}"`);
    }
  });

  it('verify-tools provider table separates readiness scope from probe verification', () => {
    const verifyTools = fs.readFileSync(
      path.join(repoRoot, 'skills/spec-mcp-setup/scripts/verify-tools.sh'),
      'utf8',
    );
    expect(verifyTools).toContain('"readiness_scope"');
    expect(verifyTools).toContain('"probe_status"');
    expect(verifyTools).toContain('def provider_readiness_scope:');
    expect(verifyTools).toContain('def provider_probe_status:');
    expect(verifyTools).toContain('"index-ready"');
    expect(verifyTools).toContain('"not-verified"');
  });

  // 回归:install-helpers.sh 的 global-skill 循环必须真实迭代 registry 中的
  // skill 条目。曾因循环漏写 `done < <(helper_registry_skill_ids)` 而从空 stdin
  // 读取、零次执行,导致缺失的 baseline skill(ast-grep-skill)被兜底成 ready,
  // 这条伪事实会经 setup-facts → doctor.decision_input_health 传播。
  test('install-helpers verify-only reports missing baseline skill as action-required', () => {
    const emptyHome = makeTempDir();
    const result = spawnSync('bash', [installHelpersPath, '--verify-only'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, HOME: emptyHome },
    });
    expect(result.status).toBe(0);

    const payload = JSON.parse(result.stdout);
    const skillFacts = Object.values(payload.helper_tools).filter((fact) => fact.kind === 'global-skill');
    expect(skillFacts).toHaveLength(1);
    expect(skillFacts[0]).toMatchObject({
      baseline_blocking: true,
      dependency_status: 'missing',
      result: 'action-required',
    });
  });

  test('install-helpers verify-only reports installed baseline skill as ready', () => {
    const installedHome = makeTempDir();
    const skillDir = path.join(installedHome, '.agents', 'skills', 'ast-grep');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# ast-grep skill\n', 'utf8');

    const result = spawnSync('bash', [installHelpersPath, '--verify-only'], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: { ...process.env, HOME: installedHome },
    });
    expect(result.status).toBe(0);

    const payload = JSON.parse(result.stdout);
    const skillFacts = Object.values(payload.helper_tools).filter((fact) => fact.kind === 'global-skill');
    expect(skillFacts).toHaveLength(1);
    expect(skillFacts[0]).toMatchObject({
      dependency_status: 'ready',
      result: 'ready',
    });
  });

  // 回归:install safety lens 必须尊重 registry 显式 review_required,
  // 并让 package-manager 来源的非高风险 helper 落入 safe 分支(此前 pin_status=latest
  // 一刀切盖过 review_required,导致 safe 不可达、reason_code 兜底成 global-install)。
  test('install safety lens honors review_required and derives accurate reason codes', () => {
    const result = spawnSync('node', [setupPlanRendererPath], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);

    const plan = JSON.parse(result.stdout);
    const byId = Object.fromEntries(plan.planned_operations.map((op) => [op.id, op]));

    // package-manager 来源且 review_required=false → safe(safe 分支可达)
    for (const id of ['gh', 'jq', 'ffmpeg']) {
      expect(byId[id]).toMatchObject({ safety_result: 'safe', reason_code: 'install-safety-ready' });
    }
    expect(plan.planned_operations.some((op) => op.safety_result === 'safe')).toBe(true);

    // 高风险 helper → review-required,reason_code 反映真实 risk flag(机械事实)
    expect(byId['agent-browser']).toMatchObject({ safety_result: 'review-required', reason_code: 'global-npm-install' });
    expect(byId['silicon']).toMatchObject({ safety_result: 'review-required', reason_code: 'global-cargo-install' });
    expect(byId['ast-grep-skill']).toMatchObject({ safety_result: 'review-required', reason_code: 'unpinned-npx' });

    // reason_code 必须是机械事实:当它是某个 risk flag 名时,该 flag 必须真实存在于
    // 该 helper 的 risk_flags 中,不得兜底成与来源不符的 flag(此前 gh/jq 被错标 global-install)。
    const syntheticReasons = new Set(['install-safety-ready', 'review-required-by-registry']);
    for (const op of plan.planned_operations) {
      if (op.safety_result === 'review-required' && !syntheticReasons.has(op.reason_code)) {
        expect(op.risk_flags).toContain(op.reason_code);
      }
    }
  });

  test('setup plan renderer exposes bare default provider pack without confirmation gate', () => {
    const tempDir = makeTempDir();
    const guided = spawnSync('node', [setupPlanRendererPath, '--mode', 'guided-apply', '--repo-root', tempDir], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    expect(guided.status).toBe(0);
    const guidedPlan = JSON.parse(guided.stdout);
    expect(guidedPlan.optional_provider_selection).toMatchObject({
      selection_source: 'bare-default-provider-pack',
      selected_ids: ['codegraph', 'graphify'],
      requires_confirmation: false,
      confirmation_prompt: null,
    });
    const graphify = guidedPlan.provider_selection.find((entry) => entry.provider === 'graphify');
    expect(graphify).toMatchObject({
      selected: true,
      requires_confirmation: false,
      tool_install_root: null,
      artifact_root: path.join(tempDir, '.graphify'),
      first_generation_display: 'resolved graphify CLI -> verify/install current-host project skill; if .graphify exists, verify install state and recommend incremental --refresh; legacy graphify-out is compatibility-only refresh-needed evidence; otherwise graphify extract .; explicit --refresh runs graphify update . code-only/no-LLM (if provider refuses overwrite and suggests --force, one graphify update . --force repair)',
      auto_refresh_display: 'resolved graphify CLI -> graphify hook install (git repo only; provider-owned post-commit/post-checkout refresh)',
      command_visibility_display: 'setup resolves graphify from the original PATH or provider-standard/npm global bin candidates; after npm install/upgrade, a stale PATH symlink may be backed up and repointed to the pinned CLI, while ordinary files stay report-only.',
      instruction_section_display: 'after provider project install, setup normalizes the AGENTS.md/CLAUDE.md ## graphify section to resolved CLI/manual-visibility/direct-source-fallback wording.',
    });
    const codegraph = guidedPlan.provider_selection.find((entry) => entry.provider === 'codegraph');
    expect(codegraph).toMatchObject({
      requires_confirmation: false,
    });
    expect(codegraph.first_generation_display).toContain('codegraph sync first');
    expect(codegraph.first_generation_display).toContain('one codegraph index -f repair');
    expect(graphify.writes_display.provider_runtime).toEqual(expect.arrayContaining([
      '.codex/skills/graphify/',
      '.codex/hooks.json',
      'AGENTS.md',
      '.claude/skills/graphify/',
      'CLAUDE.md',
    ]));
    expect(graphify.gitignore_policy).toContain('spec-first init managed block ignores .codegraph/, the provider-native .graphify/ artifact directory, and legacy graphify-out/ artifacts');
    expect(graphify.gitignore_policy).toContain('does not auto-add, auto-commit, or promote Graphify output to source truth');
    expect(graphify.will_not_do).toEqual(expect.arrayContaining([
      'will not install Graphify MCP server',
      'will not start graphify watch',
      'will not auto-add or auto-commit .graphify',
    ]));

    const unknown = spawnSync('node', [setupPlanRendererPath, '--mode', 'plan', '--repo-root', tempDir, '--only', 'unknown'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    expect(unknown.status).toBe(1);
    expect(JSON.parse(unknown.stdout)).toMatchObject({
      overall_status: 'action-required',
      reason_code: 'unknown-optional-provider-selection',
      optional_provider_selection: {
        unknown_ids: ['unknown'],
      },
    });
  });
});
