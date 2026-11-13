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
const {
  LOCAL_CONFIG_CONSUMERS,
} = require('../../skills/spec-runtime-setup/scripts/lib/project-config.cjs');
const localizationProducer = require('../../scripts/check-ce-localization-review.cjs');
const Ajv2020 = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const { buildInvocationReceipt } = require('../../skills/spec-runtime-setup/scripts/lib/host-authority.cjs');

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
  test('binds every registered local key to an exact current source anchor without creating a global gate', () => {
    const { preflight } = localizationProducer.buildArtifacts();
    const inventory = preflight.consumer_inventory;

    expect(inventory.status).toBe('confirmed');
    expect(inventory.missing_keys).toEqual([]);
    expect(inventory.rows.map((entry) => entry.key).sort()).toEqual(
      Object.keys(LOCAL_CONFIG_CONSUMERS).sort(),
    );
    for (const row of inventory.rows) {
      expect(row).toMatchObject({
        source_ref: expect.any(String),
        source_line: expect.any(Number),
        source_excerpt: expect.stringContaining(row.key),
        fallback_boundary: 'consumer-owned',
        blocking_scope: 'consumer-local-only',
      });
      expect(row.source_line).toBeGreaterThan(0);
    }
  });

  test('每个已注册 local key 都有注释示例且模板不激活设置', () => {
    const template = read('skills/spec-runtime-setup/references/config-template.yaml');
    const documented = [...template.matchAll(/^# ([a-z][a-z0-9_]*):/gm)].map((match) => match[1]);
    expect([...new Set(documented)].sort()).toEqual(Object.keys(LOCAL_CONFIG_CONSUMERS).sort());
    expect(template).not.toMatch(/^[a-z][a-z0-9_]*:/m);
  });

  test('documents every active Product Pulse scheduling key', () => {
    const template = read('skills/spec-runtime-setup/references/config-template.yaml');
    const pulse = read('skills/spec-product-pulse/SKILL.md');

    expect(pulse).toContain('pulse_schedule');
    expect(template).toContain('# pulse_schedule: manual');
    expect(template).toContain('daily | weekly | manual | ask-again-after-3-runs');
  });

  test('classifies every document rendering output key by its active workflow consumer', () => {
    const setup = read('skills/spec-runtime-setup/SKILL.md');
    const template = read('skills/spec-runtime-setup/references/config-template.yaml');
    const plan = read('skills/spec-plan/references/output-mode.md');
    const brainstorm = read('skills/spec-brainstorm/references/output-mode.md');
    const ideate = read('skills/spec-ideate/references/output-mode.md');

    expect(plan).toContain('active (non-commented)** `plan_output:`');
    expect(brainstorm).toContain('active (non-commented)** `brainstorm_output:`');
    expect(ideate).toContain('active (non-commented)** `ideate_output:`');
    expect(setup).toContain('`plan_output`、`brainstorm_output` 和 `ideate_output`');
    expect(setup).toContain('分别由 `spec-plan`、`spec-brainstorm` 和 `spec-ideate` 读取');
    expect(setup).toContain('分别回退到 `spec-plan=md`、`spec-brainstorm=md`、`spec-ideate=html`');
    expect(setup).toContain('Pipeline override 仍由各 consumer 自己决定');
    expect(setup).toContain('不调用对应 workflow');
    expect(setup).not.toContain('reserved future hints');
    expect(template).toContain('# plan_output: html       # active: md | html');
    expect(template).toContain('# brainstorm_output: html # active: md | html');
    expect(template).toContain('# ideate_output: html     # active: md | html');
    expect(template).not.toMatch(/^(plan_output|brainstorm_output|ideate_output):/m);
    expect(template).not.toContain('reserved: md | html');
  });

  test('does not expose retired browser runtime profile configuration', () => {
    const setup = read('skills/spec-runtime-setup/SKILL.md');
    const template = read('skills/spec-runtime-setup/references/config-template.yaml');

    expect(setup).not.toContain('browser_runtime_profile_path');
    expect(setup).not.toContain('browser runtime profile');
    expect(template).not.toContain('browser_runtime_profile_path');
    expect(template).not.toContain('Browser runtime autonomy');
  });
});

describe('spec-runtime-setup active Node consumers', () => {
  test('loads helper metadata from setup-registry v11 without jq', () => {
    const registry = loadRegistry({ skillRoot: path.join(repoRoot, 'skills', 'spec-runtime-setup') });
    expect(registry.schema_version).toBe('setup-registry.v11');
    expect(registry.helpers.map((entry) => entry.id)).not.toContain('jq');

    const helpers = new Map(registry.helpers.map((entry) => [entry.id, entry]));
    expect(helpers.get('gh')).toMatchObject({ id: 'gh', baseline_blocking: false, readiness_policy: 'workflow-required' });
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

  test('queries effective registry data for every setup-registry host', () => {
    const registry = loadRegistry({ skillRoot: path.join(repoRoot, 'skills', 'spec-runtime-setup') });
    const registryHosts = Object.keys(registry.hosts);
    expect(registryHosts.length).toBeGreaterThan(0);
    for (const host of registryHosts) {
      const effective = getEffectiveRegistry(registry, { host, platform: 'linux' });
      expect(effective.host_definition.id).toBe(host);
      expect(effective.tools.find((entry) => entry.id === 'context7').host_config.targets)
        .toBeDefined();
    }
    // setup-registry 覆盖面与受支持宿主一致。pi 曾按 pi-host-support 计划 KTD5
    // （2026-09-04）被有意排除——当时 MCP 仅 extension 生态且配置面未文档化；
    // 2026-09-11 owner 决策推翻 KTD5 接入 pi：pi.dev 官方 registry 的
    // pi-mcp-extension 已文档化 `.pi/mcp.json`（项目）/`~/.pi/agent/mcp.json`
    // （全局）配置面与 `mcpServers` 容器，setup 据此写入（扩展未装时配置 inert，
    // 见 SKILL.md 前置说明）。pi 核心原生 MCP 出现时按原生面重评。
    expect(getSupportedPlatforms().filter((platform) => !registryHosts.includes(platform)))
      .toEqual([]);
    // 反向：setup 侧手工宿主清单不得出现 registry 已退役/拼错的宿主（⊆ 关系）。
    // pi 的排除是 KTD5 的有意子集，只约束方向不强制全集。
    const { CANONICAL_HOSTS } = require('../../skills/spec-runtime-setup/scripts/lib/host-authority.cjs');
    expect(CANONICAL_HOSTS.filter((host) => !getSupportedPlatforms().includes(host))).toEqual([]);
  });

  test('host-authority surfaces stay bound to every setup host projection root', () => {
    const { getAdapter } = require('../../src/cli/adapters');
    const {
      CANONICAL_HOSTS,
      HOST_SKILL_SURFACES,
      resolveLoadedHostSurface,
    } = require('../../skills/spec-runtime-setup/scripts/lib/host-authority.cjs');

    // surface 登记面必须恰好覆盖 setup 支持宿主：多登记=放宽 fail-closed 绑定，
    // 少登记=该宿主 mutation 全部被 host-invocation-surface-unverified 阻断
    // （claude workflows 根 drift 曾导致此回归）。
    expect(Object.keys(HOST_SKILL_SURFACES).sort()).toEqual([...CANONICAL_HOSTS].sort());

    for (const host of CANONICAL_HOSTS) {
      const adapter = getAdapter(host);
      const surfaces = HOST_SKILL_SURFACES[host];
      expect(Array.isArray(surfaces)).toBe(true);
      // adapter 的 workflow 投射根（spec-runtime-setup 的实际生成面）必须登记。
      expect(surfaces).toContain(adapter.workflowsRoot);
      for (const surface of surfaces) {
        expect(surface).toBe(adapter.workflowsRoot);
      }
    }

    // 共享面语义：.agents/skills 同时确认 codex、zcode 与 pi。
    const sharedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-surface-guard-'));
    const sharedSkillRoot = path.join(sharedRoot, '.agents', 'skills', 'spec-runtime-setup');
    fs.mkdirSync(sharedSkillRoot, { recursive: true });
    const loaded = resolveLoadedHostSurface(sharedSkillRoot);
    expect(loaded).toMatchObject({
      surface_id: '.agents/skills',
      hosts: ['codex', 'zcode', 'pi'],
    });

    // receipt schema 的 host enum 必须与 CANONICAL_HOSTS 同步
    // （zcode 接入时曾遗漏，confirmed zcode receipt 会违反已发布 schema）。
    const receiptSchema = JSON.parse(read('docs/contracts/verification/host-invocation-receipt.schema.json'));
    expect(receiptSchema.properties.host.enum.sort()).toEqual([...CANONICAL_HOSTS].sort());
  });

  test('routes Graphify project-skill installation through the trusted provider map', () => {
    expect(Object.keys(providers).sort()).toEqual(['codegraph', 'graphify']);
    const dependency = {
      ecosystem: 'pypi',
      package: 'graphifyy',
      version: '0.9.57',
      distribution: {
        wheel_url: 'https://files.pythonhosted.org/packages/c8/c2/d1ce4a567a5bf4c36054cede2c70f745a239ed5080b70d7934c5c738b583/graphifyy-0.9.57-py3-none-any.whl',
        sha256: 'f35c86410e7d92ace69a50ac8dbed568903c880482c656f43437ca657fee8c37',
        index_url: 'https://pypi.org/simple',
      },
    };
    const runner = (command) => command === 'python3'
      ? { exit_code: 0, status: 0, stdout: '3.12.4', stderr: '', signal: null, error: null, timed_out: false }
      : (command === 'uv'
        ? { exit_code: 0, status: 0, stdout: 'uv 0.8.0', stderr: '', signal: null, error: null, timed_out: false }
        : { exit_code: 1, status: 1, stdout: '', stderr: 'missing', signal: null, error: null, timed_out: false });
    const registryHosts = Object.keys(loadRegistry({ skillRoot: path.join(repoRoot, 'skills', 'spec-runtime-setup') }).hosts);
    for (const host of registryHosts) {
      const planRepoRoot = tempRepo(host);
      const plan = providers.graphify.plan({ selected: true, repoRoot: planRepoRoot, host, dependency, runner });
      if (host === 'qoder') {
        expect(plan.actions).toContainEqual(expect.objectContaining({ kind: 'install-qoder-adapter', command: null }));
        expect(plan.actions.some((entry) => entry.kind === 'install-project-skill')).toBe(false);
        continue;
      }
      const installSkill = plan.actions.find((entry) => entry.kind === 'install-project-skill');
      const expectedPlatform = host === 'zcode' || host === 'pi' ? 'agents' : host;
      expect(installSkill).toMatchObject({
        command: 'graphify',
        args: ['install', '--project', '--platform', expectedPlatform],
      });
    }
  });

  test('validates producer receipts including shared-host surface_hosts', () => {
    const schema = JSON.parse(read('docs/contracts/verification/host-invocation-receipt.schema.json'));
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const receipt = buildInvocationReceipt({
      host: 'pi',
      loadedSurface: {
        host: 'codex',
        hosts: ['codex', 'zcode', 'pi'],
        surface_id: '.agents/skills',
        skill_root: '/tmp/.agents/skills/spec-runtime-setup',
      },
      skillRoot: '/tmp/.agents/skills/spec-runtime-setup',
      targetIdentity: '/tmp/repo',
      verificationStatus: 'confirmed',
      reasonCode: 'host-authority-loaded-root-bound',
      now: new Date('2026-09-21T10:00:00Z'),
    });
    expect(validate(receipt)).toBe(true);
    expect(receipt.surface_hosts).toEqual(['codex', 'zcode', 'pi']);
    const duplicate = { ...receipt, surface_hosts: ['codex', 'pi', 'pi'] };
    expect(validate(duplicate)).toBe(false);
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
