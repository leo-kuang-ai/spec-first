'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { getSupportedPlatforms } = require('../../src/cli/adapters');
const {
  maskAllowedCodexOtherHostPaths,
} = require('../../src/cli/host-comparative-workflows');
const {
  normalizeSetupFacts,
} = require('../../src/cli/helpers/setup-facts');
const { WORKFLOW_RUNTIME_CONTRACT_TESTS } = require('../../scripts/run-ai-dev-quality-gate');
const { collectSetupFacts } = require('../../skills/spec-runtime-setup/scripts/lib/facts.cjs');
const {
  getEffectiveEntry,
  getEffectiveRegistry,
  loadRegistry,
} = require('../../skills/spec-runtime-setup/scripts/lib/registry.cjs');
const providers = require('../../skills/spec-runtime-setup/scripts/providers/registry.cjs');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function tempRepo(label) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `spec-first-config-consumer-${label}-`));
  fs.mkdirSync(path.join(root, '.git'), { recursive: true });
  return root;
}

describe('spec-runtime-setup active config consumers', () => {
  test('documents every active Product Pulse scheduling key', () => {
    const template = read('skills/spec-runtime-setup/references/config-template.yaml');
    const pulse = read('skills/spec-product-pulse/SKILL.md');

    expect(pulse).toContain('pulse_schedule');
    expect(template).toContain('# pulse_schedule: manual');
    expect(template).toContain('daily | weekly | manual | ask-again-after-3-runs');
  });

  test('classifies ideate_output as active while plan and brainstorm remain reserved', () => {
    const setup = read('skills/spec-runtime-setup/SKILL.md');
    const template = read('skills/spec-runtime-setup/references/config-template.yaml');
    const ideate = read('skills/spec-ideate/SKILL.md');

    expect(ideate).toContain('active (non-commented)** `ideate_output:`');
    expect(setup).toContain('`ideate_output` is active');
    expect(setup).toContain('`plan_output` and `brainstorm_output` are reserved future hints');
    expect(template).toContain('# ideate_output: html     # active: md | html');
    expect(template).toContain('# plan_output: html       # reserved: md | html');
    expect(template).toContain('# brainstorm_output: html # reserved: md | html');
  });
});

describe('spec-runtime-setup active Node consumers', () => {
  test('loads helper metadata from setup-registry v8 without jq', () => {
    const registry = loadRegistry({ skillRoot: path.join(repoRoot, 'skills', 'spec-runtime-setup') });
    expect(registry.schema_version).toBe('setup-registry.v8');
    expect(registry.helpers.map((entry) => entry.id)).not.toContain('jq');

    const helpers = new Map(registry.helpers.map((entry) => [entry.id, entry]));
    expect(helpers.get('gh')).toMatchObject({ id: 'gh', baseline_blocking: true });
    for (const platform of ['macos', 'linux', 'windows']) {
      expect(getEffectiveEntry(registry, {
        kind: 'helper',
        id: 'agent-browser',
        host: 'codex',
        platform,
      }).installation.command).toEqual(expect.any(String));
    }
  });

  test('keeps downstream tool-facts normalization stable when fed by the Node facts owner', () => {
    const registry = loadRegistry({ skillRoot: path.join(repoRoot, 'skills', 'spec-runtime-setup') });
    const toolResults = registry.tools.map((entry) => ({
      id: entry.id,
      status: entry.required ? 'ready' : 'skipped',
      verified: true,
      source: 'post-mutation-probe',
    }));
    const helperResults = registry.helpers.map((entry) => ({
      id: entry.id,
      status: 'ready',
      verified: true,
      source: 'post-mutation-probe',
    }));
    const bundle = collectSetupFacts({
      repoRoot: '/repo',
      host: 'codex',
      platform: 'linux',
      registry,
      toolResults,
      helperResults,
      providerResults: [],
      configuredDependencies: [],
      now: new Date('2026-07-11T04:00:00.000Z'),
    });

    expect(normalizeSetupFacts(bundle.toolFacts, {
      now: new Date('2026-07-11T04:00:01.000Z'),
    })).toMatchObject({
      status: 'ready',
      reason_code: 'setup-facts-normalized',
      schema_versions: { tool_facts: 'tool-facts.v2' },
      host: 'codex',
      platform: 'linux',
      counts: { required_action: 0 },
    });
  });

  test('queries effective registry data for every supported host', () => {
    const registry = loadRegistry({ skillRoot: path.join(repoRoot, 'skills', 'spec-runtime-setup') });
    for (const host of getSupportedPlatforms()) {
      const effective = getEffectiveRegistry(registry, { host, platform: 'linux' });
      expect(effective.host_definition.id).toBe(host);
      expect(effective.tools.find((entry) => entry.id === 'context7').host_config.targets)
        .toBeDefined();
    }
  });

  test('routes Graphify project-skill installation through the trusted provider map', () => {
    expect(Object.keys(providers).sort()).toEqual(['codegraph', 'graphify']);
    const dependency = {
      ecosystem: 'pypi',
      package: 'graphifyy',
      version: '0.9.17',
      distribution: {
        wheel_url: 'https://files.pythonhosted.org/packages/39/37/a28af8342d78d322511b6307fac2760ca7b9b3c859fa2dcfbaf7c4b5ddf9/graphifyy-0.9.17-py3-none-any.whl',
        sha256: 'ef60768aaee7e315d2e2d7da89e971bc1f445f5c8d73ebe4fed550e40a1d687e',
        index_url: 'https://pypi.org/simple',
      },
    };
    const runner = (command) => command === 'python3'
      ? { exit_code: 0, status: 0, stdout: '3.12.4', stderr: '', signal: null, error: null, timed_out: false }
      : (command === 'uv'
        ? { exit_code: 0, status: 0, stdout: 'uv 0.8.0', stderr: '', signal: null, error: null, timed_out: false }
        : { exit_code: 1, status: 1, stdout: '', stderr: 'missing', signal: null, error: null, timed_out: false });
    for (const host of getSupportedPlatforms()) {
      const repoRoot = tempRepo(host);
      const plan = providers.graphify.plan({ selected: true, repoRoot, host, dependency, runner });
      if (host === 'qoder') {
        expect(plan.actions).toContainEqual(expect.objectContaining({ kind: 'install-qoder-adapter', command: null }));
        expect(plan.actions.some((entry) => entry.kind === 'install-project-skill')).toBe(false);
        continue;
      }
      const installSkill = plan.actions.find((entry) => entry.kind === 'install-project-skill');
      expect(installSkill).toMatchObject({
        command: 'graphify',
        args: ['install', '--project', '--platform', host],
      });
    }
  });

  test('masks only the unified Node entrypoint as comparative Claude runtime prose', () => {
    const nodePath = '.claude/spec-first/workflows/spec-runtime-setup/scripts/setup.cjs';
    expect(maskAllowedCodexOtherHostPaths(nodePath, 'spec-code-review')).toBe(
      '[allowed spec-code-review other-host path]',
    );
  });

  test('quality gate covers Node setup contracts without binding PowerShell assets', () => {
    expect(WORKFLOW_RUNTIME_CONTRACT_TESTS.some((file) => /powershell/i.test(file))).toBe(false);
    expect(WORKFLOW_RUNTIME_CONTRACT_TESTS).toEqual(expect.arrayContaining([
      'tests/unit/mcp-setup-node-contracts.test.js',
      'tests/unit/mcp-setup-entrypoint.test.js',
      'tests/unit/mcp-setup-registry.test.js',
      'tests/unit/mcp-setup-facts-renderer.test.js',
      'tests/unit/mcp-setup-providers.test.js',
    ]));
  });
});
