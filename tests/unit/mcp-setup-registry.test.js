'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  canonicalize,
  detectRuntimePlatform,
  getDiagnosticRegistry,
  getEffectiveEntry,
  getEffectiveRegistry,
  loadRegistry,
  mergeLayers,
} = require('../../skills/spec-runtime-setup/scripts/lib/registry.cjs');

const repoRoot = path.resolve(__dirname, '..', '..');
const skillRoot = path.join(repoRoot, 'skills', 'spec-runtime-setup');
const effectiveFixture = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'tests', 'fixtures', 'mcp-setup', 'effective-registry', 'legacy-effective-queries.json'),
  'utf8',
));

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function byId(entries) {
  return Object.fromEntries(entries.map((entry) => [entry.id, entry]));
}

function withoutKeys(value, keys) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)));
}

function withRegistryMutation(mutator) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-registry-'));
  const registry = readJson('skills/spec-runtime-setup/setup-registry.json');
  mutator(registry);
  fs.writeFileSync(
    path.join(tempRoot, 'setup-registry.json'),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8',
  );
  fs.copyFileSync(
    path.join(skillRoot, 'setup-registry.schema.json'),
    path.join(tempRoot, 'setup-registry.schema.json'),
  );
  return {
    tempRoot,
    cleanup() {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    },
  };
}

function expectRegistryError(mutator, code) {
  const fixture = withRegistryMutation(mutator);
  try {
    expect(() => loadRegistry({ skillRoot: fixture.tempRoot })).toThrow();
    try {
      loadRegistry({ skillRoot: fixture.tempRoot });
    } catch (error) {
      expect(error.code).toBe(code);
    }
  } finally {
    fixture.cleanup();
  }
}

describe('spec-runtime-setup registry v11', () => {
  test('detects WSL from the real Linux runtime signals', () => {
    expect(detectRuntimePlatform({
      platform: 'linux',
      env: { WSL_DISTRO_NAME: 'Ubuntu' },
      procVersion: 'Linux version generic',
    })).toBe('wsl');
    expect(detectRuntimePlatform({
      platform: 'linux',
      env: {},
      procVersion: 'Linux version 6.1.0-microsoft-standard-WSL2',
    })).toBe('wsl');
    expect(detectRuntimePlatform({
      platform: 'linux',
      env: {},
      procVersion: 'Linux version 6.8.0-generic',
    })).toBe('linux');
  });

  test('兼容 v10 旧 registry，保留未知条目的旧阻断语义', () => {
    const fixture = withRegistryMutation((registry) => {
      registry.schema_version = 'setup-registry.v10';
      for (const entry of [...registry.tools, ...registry.helpers]) delete entry.readiness_policy;
      registry.helpers.find((entry) => entry.id === 'gh').baseline_blocking = true;
    });
    try {
      const registry = loadRegistry({ skillRoot: fixture.tempRoot });
      const { applyReadinessPolicy } = require('../../skills/spec-runtime-setup/scripts/lib/baseline-policy.cjs');
      const effective = applyReadinessPolicy(getEffectiveRegistry(registry, { host: 'codex', platform: 'linux' }));
      expect(effective.helpers.find((entry) => entry.id === 'gh')).toMatchObject({
        required: true, baseline_blocking: true,
        demand: { migration_warning: 'legacy-readiness-policy' },
      });
    } finally { fixture.cleanup(); }
  });

  test('v10 兼容读取不触发 host override 覆盖不变量（真实 v10 形态）', () => {
    const fixture = withRegistryMutation((registry) => {
      registry.schema_version = 'setup-registry.v10';
      for (const entry of [...registry.tools, ...registry.helpers]) delete entry.readiness_policy;
      for (const entry of registry.tools) delete entry.host_overrides.zcode;
      delete registry.providers.find((provider) => provider.id === 'codegraph').host_overrides.zcode;
    });
    try {
      const registry = loadRegistry({ skillRoot: fixture.tempRoot });
      expect(registry.schema_version).toBe('setup-registry.v10');
      expect(byId(registry.tools)['sequential-thinking'].host_overrides.zcode).toBeUndefined();
    } finally {
      fixture.cleanup();
    }
  });

  test('v11 禁止遗漏 readiness policy 或写入未知 enum', () => {
    expectRegistryError((registry) => { delete registry.helpers[0].readiness_policy; }, 'registry_readiness_policy_missing');
    expectRegistryError((registry) => { registry.helpers[0].readiness_policy = 'maybe'; }, 'registry_schema_invalid');
  });

  test('matches the captured legacy inventory while retiring the jq helper', () => {
    const registry = loadRegistry({ skillRoot });

    expect(registry.schema_version).toBe('setup-registry.v11');
    expect(registry.install_mirrors).toEqual({
      npm: {
        endpoint: 'https://registry.npmmirror.com',
        environment: {
          NPM_CONFIG_REGISTRY: 'https://registry.npmmirror.com',
          npm_config_registry: 'https://registry.npmmirror.com',
        },
      },
    });
    expect(registry.external_dependencies).toEqual([
      {
        id: 'codegraph',
        ecosystem: 'npm',
        package: '@colbymchenry/codegraph',
        version: '1.6.0',
        integrity: 'sha512-nCN40MqmYxF7gH1QTKqlxJ1d2mzwhw3fzSdGV2wjnQKsymjM3JZnH/5rpGqhBkcUEom0qWq0WjDRvOZh2t8mFA==',
        source: 'npmjs',
        command: 'codegraph',
      },
      {
        id: 'graphify',
        ecosystem: 'pypi',
        package: 'graphifyy',
        version: '0.9.57',
        command: 'graphify',
        python: {
          requires: '>=3.10',
          allow_managed_download: false,
        },
        installers: {
          preference: ['uv', 'pipx'],
          plain_pip_allowed: false,
        },
        distribution: {
          wheel_url: 'https://files.pythonhosted.org/packages/c8/c2/d1ce4a567a5bf4c36054cede2c70f745a239ed5080b70d7934c5c738b583/graphifyy-0.9.57-py3-none-any.whl',
          sha256: 'f35c86410e7d92ace69a50ac8dbed568903c880482c656f43437ca657fee8c37',
          index_url: 'https://pypi.org/simple',
        },
        hook_normalization_contract: 'graphify-python-hook-normalization.v1',
      },
    ]);
    expect(registry.summary_columns).toEqual([
      'tool',
      'type',
      'required',
      'dependency',
      'host_config',
      'project_bootstrap',
      'result',
      'next_action',
    ]);
    expect(registry.tools.map((entry) => entry.id)).toEqual([
      'codegraph',
      'context7',
      'sequential-thinking',
    ]);
    expect(registry.helpers.map((entry) => entry.id)).toEqual([
      'agent-browser',
      'ast-grep',
      'ast-grep-skill',
      'ffmpeg',
      'gh',
      'silicon',
      'vhs',
    ]);
    expect(registry.helpers.some((entry) => entry.id === 'jq')).toBe(false);
    expect(registry.providers.map((entry) => entry.id)).toEqual(['codegraph', 'graphify']);
  });

  test('keeps complete host and artifact contracts at the top level', () => {
    const registry = loadRegistry({ skillRoot });
    expect(Object.keys(registry.hosts)).toEqual(['claude', 'codex', 'cursor', 'kiro', 'opencode', 'pi', 'qoder', 'zcode']);
    for (const host of Object.values(registry.hosts)) {
      expect(host.defaults.tool.host_config.targets).toBeDefined();
      expect(host.defaults.tool.host_config.fallback_order).toBeDefined();
      expect(host.defaults.tool.host_config.uninstall_targets).toBeDefined();
    }
    expect(registry.artifact_contracts.map((entry) => entry.schema_version).sort()).toEqual([
      'mcp-verify-child-result.v1',
      'parent-artifact-quarantine.v1',
      'project-config-bootstrap.v1',
      'project-local-config-status.v1',
      'provider-readiness.v2',
      'runtime-capabilities.v1',
      'setup-install-plan.v1',
      'spec-runtime-setup-diagnostic-snapshot.v1',
      'spec-runtime-setup-preflight.v2',
      'tool-facts.v2',
      'workspace-mcp-setup-summary.v1',
      'workspace-mcp-verify-summary.v1',
      'workspace-project-config-bootstrap-summary.v1',
    ].sort());
    for (const artifact of registry.artifact_contracts) {
      expect(artifact.path).toEqual(expect.any(String));
      expect(artifact.producer).toEqual(expect.any(String));
      expect(artifact.consumers.length).toBeGreaterThan(0);
    }
  });

  test('covers every declared host with a buildable server command for host-config entries', () => {
    const registry = loadRegistry({ skillRoot });
    for (const host of Object.keys(registry.hosts)) {
      const effective = getEffectiveRegistry(registry, { host, platform: 'macos' });
      for (const tool of effective.tools) {
        if (tool.host_config_required === false) continue;
        expect(tool.host_config.command).toEqual(expect.any(String));
        expect(tool.host_config.command.length).toBeGreaterThan(0);
      }
      expect(byId(effective.providers).codegraph.host_config.command).toBe('codegraph');
    }
    const zcode = getEffectiveRegistry(registry, { host: 'zcode', platform: 'macos' });
    expect(zcode.host_definition.host_config).toMatchObject({
      scope: 'workspace',
      json_container_path: ['mcp', 'servers'],
    });
    expect(byId(zcode.tools)['sequential-thinking'].host_config).toMatchObject({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking@2026.8.31'],
      json_container_path: ['mcp', 'servers'],
    });
    expect(byId(zcode.tools).context7.host_config).toMatchObject({
      command: 'npx',
      args: ['-y', '@upstash/context7-mcp@4.0.7'],
    });
    expect(byId(zcode.tools).codegraph.host_config).toMatchObject({
      command: 'codegraph',
      args: ['serve', '--mcp'],
    });
    const pi = getEffectiveRegistry(registry, { host: 'pi', platform: 'macos' });
    expect(pi.host_definition.host_config).toMatchObject({
      scope: 'project',
      json_container_path: ['mcpServers'],
    });
    expect(byId(pi.tools)['sequential-thinking'].host_config).toMatchObject({
      command: 'npx',
      json_container_path: ['mcpServers'],
    });
    expect(byId(pi.tools).context7.host_config).toMatchObject({
      command: 'npx',
      json_container_path: ['mcpServers'],
    });
    expect(byId(pi.providers).codegraph.host_config).toMatchObject({
      command: 'codegraph',
      args: ['serve', '--mcp'],
      json_container_path: ['mcpServers'],
      targets: { project: { config_path: '.pi/mcp.json' } },
    });
  });

  test('fails closed when a declared host lacks a host override command', () => {
    expectRegistryError((registry) => {
      delete registry.tools.find((tool) => tool.id === 'sequential-thinking').host_overrides.zcode;
    }, 'registry_host_override_missing');
    expectRegistryError((registry) => {
      delete registry.providers.find((provider) => provider.id === 'codegraph').host_overrides.zcode;
    }, 'registry_host_override_missing');
  });

  test('matches the captured legacy effective queries for every host and platform', () => {
    const registry = loadRegistry({ skillRoot });
    for (const fixture of effectiveFixture.host_cases) {
      const effective = getEffectiveRegistry(registry, fixture);
      expect(effective.host_definition.host_config).toEqual(fixture.host_definition);
      const tools = byId(effective.tools);
      for (const [id, hostConfig] of Object.entries(fixture.tool_host_config)) {
        expect(tools[id].host_config).toEqual(hostConfig);
      }
    }

    for (const fixture of effectiveFixture.platform_cases) {
      const effective = getEffectiveRegistry(registry, { host: 'codex', platform: fixture.platform });
      const tools = byId(effective.tools);
      const helpers = byId(effective.helpers);
      const providers = byId(effective.providers);
      for (const [id, expected] of Object.entries(fixture.tools)) {
        expect(tools[id].installation).toEqual(expected.installation);
        expect(tools[id].project_bootstrap).toEqual(expected.project_bootstrap);
      }
      for (const [id, expected] of Object.entries(fixture.helpers)) {
        expect(withoutKeys(helpers[id].installation, ['operations'])).toEqual(expected.installation);
        expect(helpers[id].platform_required_tools).toEqual(expected.platform_required_tools);
      }
      expect(providers.codegraph.installation).toEqual(fixture.providers.codegraph.installation);
      expect(providers.codegraph.project_bootstrap).toEqual(fixture.providers.codegraph.project_bootstrap);
      expect(providers.graphify.installation).toEqual(fixture.providers.graphify.installation);
    }
  });

  test('declares the OpenCode native config container, representation, targets, and tool entries', () => {
    const registry = loadRegistry({ skillRoot });
    const effective = getEffectiveRegistry(registry, { host: 'opencode', platform: 'macos' });
    const context7 = byId(effective.tools).context7;

    expect(effective.host_definition.host_config).toMatchObject({
      scope: 'project',
      json_container_path: ['mcp'],
      server_representation: 'opencode-local',
      permission_policy: { kind: 'opencode-governed-assets-v1' },
      fallback_order: ['project'],
      uninstall_targets: ['project', 'user'],
      targets: {
        project: {
          config_path: 'opencode.json',
          config_format: 'json',
          precedence: 100,
          precedence_guards: [expect.objectContaining({
            config_path: 'opencode.jsonc',
            config_format: 'jsonc',
            precedence: 110,
          })],
        },
        user: {
          config_path: '${XDG_CONFIG_HOME}/opencode/opencode.json',
          precedence: 50,
          requires_user_scope_opt_in: true,
          precedence_guards: [expect.objectContaining({
            config_path: '${XDG_CONFIG_HOME}/opencode/opencode.jsonc',
            config_format: 'jsonc',
            precedence: 60,
          })],
        },
      },
    });
    expect(context7.host_config).toMatchObject({
      command: 'npx',
      args: ['-y', '@upstash/context7-mcp@4.0.7'],
      json_container_path: ['mcp'],
      server_representation: 'opencode-local',
      permission_policy: { kind: 'opencode-governed-assets-v1' },
    });
  });

  test('builds a host-neutral diagnostic registry while preserving platform overrides', () => {
    const registry = loadRegistry({ skillRoot });
    const linux = getDiagnosticRegistry(registry, { platform: 'linux' });
    const windows = getDiagnosticRegistry(registry, { platform: 'windows' });

    expect(linux.host).toBeNull();
    expect(linux).not.toHaveProperty('host_definition');
    expect(linux.tools.every((entry) => entry.host_config === undefined)).toBe(true);
    expect(byId(linux.helpers)['agent-browser'].installation.command).toContain('CI=true npm install');
    expect(byId(linux.helpers)['agent-browser'].usage_note).toContain('dependency 安装状态与 browser execution readiness');
    expect(byId(linux.helpers)['agent-browser'].usage_note).toContain('Spec-First controlled exact-origin conformance passed');
    expect(byId(windows.helpers)['agent-browser'].installation.command).toContain("$env:CI='true'");
  });

  test('implements recursive object merge, scalar replacement, array replacement, and missing inheritance', () => {
    expect(mergeLayers(
      { nested: { keep: true, scalar: 'base' }, list: ['base'], inherited: 1 },
      { nested: { scalar: 'override', added: true }, list: ['override'] },
    )).toEqual({
      inherited: 1,
      list: ['override'],
      nested: { added: true, keep: true, scalar: 'override' },
    });
    expect(() => mergeLayers({ allowed: true }, { allowed: null })).toThrow(
      expect.objectContaining({ code: 'registry_null_not_allowed' }),
    );
  });

  test('returns canonical stable key and entry ordering', () => {
    expect(Object.keys(canonicalize({ z: 1, a: { z: 2, a: 3 } }))).toEqual(['a', 'z']);
    expect(Object.keys(canonicalize({ z: 1, a: { z: 2, a: 3 } }).a)).toEqual(['a', 'z']);
    const registry = loadRegistry({ skillRoot });
    expect(registry.tools.map((entry) => entry.id)).toEqual(['codegraph', 'context7', 'sequential-thinking']);
    expect(registry.helpers.map((entry) => entry.id)).toEqual([
      'agent-browser',
      'ast-grep',
      'ast-grep-skill',
      'ffmpeg',
      'gh',
      'silicon',
      'vhs',
    ]);
  });

  test('rejects schema drift, duplicate ids, duplicate host targets, and illegal nulls', () => {
    expectRegistryError((registry) => {
      delete registry.artifact_contracts;
    }, 'registry_schema_invalid');
    expectRegistryError((registry) => {
      registry.tools.push({ ...registry.tools[0] });
    }, 'registry_duplicate_id');
    expectRegistryError((registry) => {
      registry.hosts.cursor.defaults.tool.host_config.targets.user.config_path = '.cursor/mcp.json';
    }, 'registry_duplicate_host_target');
    expectRegistryError((registry) => {
      registry.tools[0].required = null;
    }, 'registry_null_not_allowed');
    expectRegistryError((registry) => {
      delete registry.install_mirrors.npm.environment.NPM_CONFIG_REGISTRY;
    }, 'registry_schema_invalid');
    expectRegistryError((registry) => {
      registry.hosts.opencode.defaults.tool.host_config.json_container_path = [];
    }, 'registry_schema_invalid');
    expectRegistryError((registry) => {
      registry.hosts.opencode.defaults.tool.host_config.server_representation = 'unknown';
    }, 'registry_schema_invalid');
    expectRegistryError((registry) => {
      registry.hosts.opencode.defaults.tool.host_config.permission_policy.kind = 'global-permission-dsl';
    }, 'registry_schema_invalid');
    expectRegistryError((registry) => {
      delete registry.hosts.opencode.defaults.tool.host_config.permission_policy;
    }, 'registry_opencode_permission_policy_invalid_owner');
    expectRegistryError((registry) => {
      registry.hosts.codex.defaults.tool.host_config.permission_policy = {
        kind: 'opencode-governed-assets-v1',
      };
    }, 'registry_opencode_permission_policy_invalid_owner');
    expectRegistryError((registry) => {
      registry.hosts.opencode.defaults.tool.host_config.targets = {};
    }, 'registry_schema_invalid');
  });

  test('rejects precedence-guard duplicates and fallback/uninstall references to unknown targets', () => {    // guard-vs-target:target user 的 guard 与 target project 在同一路径指纹上重复。
    expectRegistryError((registry) => {
      registry.hosts.cursor.defaults.tool.host_config.targets.user.precedence_guards = [{
        config_path: '.cursor/mcp.json',
        config_format: 'jsonc',
        precedence: 10,
        reason_code: 'higher-priority-user-config',
      }];
    }, 'registry_duplicate_host_target');
    // guard-vs-guard:同一 target 上两个 guard 解析到同一路径。
    expectRegistryError((registry) => {
      registry.hosts.cursor.defaults.tool.host_config.targets.user.precedence_guards = [
        {
          config_path: '$HOME/.cursor/rules/x.jsonc',
          config_format: 'jsonc',
          precedence: 10,
          reason_code: 'higher-priority-user-config',
        },
        {
          config_path: '$HOME/.cursor/rules/x.jsonc',
          config_format: 'jsonc',
          precedence: 20,
          reason_code: 'higher-priority-user-config',
        },
      ];
    }, 'registry_duplicate_host_target');
    // fallback_order 引用未声明 target。
    expectRegistryError((registry) => {
      registry.hosts.cursor.defaults.tool.host_config.fallback_order = ['project', 'undeclared-target'];
    }, 'registry_unknown_host_target');
    // uninstall_targets 引用未声明 target。
    expectRegistryError((registry) => {
      registry.hosts.cursor.defaults.tool.host_config.uninstall_targets = ['project', 'user', 'undeclared-target'];
    }, 'registry_unknown_host_target');
  });

  test('rejects provider_readiness metadata drifting from its provider entry', () => {
    // tools[].provider_readiness 与 providers[] 同 id 条目的共享元数据必须同批更新
    // (lane finding DR-001);单独改任一段在加载期 fail-closed。
    expectRegistryError((registry) => {
      const codegraphTool = registry.tools.find((entry) => entry.id === 'codegraph');
      codegraphTool.provider_readiness.usage_note = codegraphTool.provider_readiness.usage_note + ' drifted';
    }, 'registry_provider_metadata_drift');
    expectRegistryError((registry) => {
      const codegraphTool = registry.tools.find((entry) => entry.id === 'codegraph');
      codegraphTool.provider_readiness.fallback_methods = ['rg'];
    }, 'registry_provider_metadata_drift');
    expectRegistryError((registry) => {
      const codegraphProvider = registry.providers.find((entry) => entry.id === 'codegraph');
      codegraphProvider.first_generation = { ...codegraphProvider.first_generation, extra: true };
    }, 'registry_provider_metadata_drift');
  });

  test('rejects schema keywords outside the validator dialect', () => {
    // validator 只实现方言白名单内的关键字;schema 引入未实现关键字会在加载期
    // fail-closed,防止校验强度静默下降(lane finding DR-017)。
    const fixture = withRegistryMutation(() => {});
    try {
      const schemaPath = path.join(fixture.tempRoot, 'setup-registry.schema.json');
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      schema.$defs.installationSpec.properties.kind.maximum = 5;
      fs.writeFileSync(schemaPath, `${JSON.stringify(schema, null, 2)}\n`);
      expect(() => loadRegistry({ skillRoot: fixture.tempRoot })).toThrow();
      try {
        loadRegistry({ skillRoot: fixture.tempRoot });
      } catch (error) {
        expect(error.code).toBe('registry_schema_dialect_keyword_unsupported');
      }
    } finally {
      fixture.cleanup();
    }
  });

  test('allows only schema-declared nullable provider workspace paths', () => {
    const registry = loadRegistry({ skillRoot });
    expect(getEffectiveEntry(registry, {
      kind: 'provider',
      id: 'codegraph',
      host: 'codex',
      platform: 'linux',
    }).first_generation.requirement_workspace_path).toBeNull();
    expectRegistryError((candidate) => {
      candidate.providers[0].first_generation.artifact_root = null;
    }, 'registry_null_not_allowed');
  });

  test('fails closed for unknown query dimensions', () => {
    const registry = loadRegistry({ skillRoot });
    expect(() => getEffectiveRegistry(registry, { host: 'unknown', platform: 'linux' })).toThrow(
      expect.objectContaining({ code: 'registry_unknown_host' }),
    );
    expect(() => getEffectiveEntry(registry, {
      kind: 'tool',
      id: 'unknown',
      host: 'codex',
      platform: 'linux',
    })).toThrow(expect.objectContaining({ code: 'registry_unknown_entry' }));
    expect(() => getEffectiveRegistry(registry, { host: 'codex', platform: 'solaris' })).toThrow(
      expect.objectContaining({ code: 'registry_unknown_platform' }),
    );
  });
});
