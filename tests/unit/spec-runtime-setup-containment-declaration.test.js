'use strict';

// 回归测试：SUP-25 - 系统级配置缺少 containment 声明
// 证据：docs/validation/2026-11-09-harness-full-code-deep-review.md:230-235
//
// 核心修复验证：
// 1. Claude managed 目标的绝对路径配置必须有 containment_root
// 2. Codex system 目标的绝对路径配置必须有 containment_root
// 3. containment_root 提供窄边界，不应是整个文件系统

const fs = require('node:fs');
const path = require('node:path');

describe('System config containment declaration — SUP-25', () => {
  const registryPath = path.join(__dirname, '../../skills/spec-runtime-setup/setup-registry.json');
  let registry;

  beforeAll(() => {
    const content = fs.readFileSync(registryPath, 'utf8');
    registry = JSON.parse(content);
  });

  test('Claude managed 目标声明 containment_root', () => {
    const claudeDefaults = registry.hosts.claude.defaults;

    // 检查 tool.host_config.targets.managed
    const toolManaged = claudeDefaults.tool.host_config.targets.managed;
    expect(toolManaged.config_path).toBeDefined();
    expect(toolManaged.containment_root).toBeDefined();

    // 验证每个平台都有 containment_root
    const platforms = ['macos', 'linux', 'wsl', 'windows'];
    for (const platform of platforms) {
      expect(toolManaged.config_path[platform]).toBeDefined();
      expect(toolManaged.containment_root[platform]).toBeDefined();

      // 验证 containment_root 是 config_path 的父目录
      const configPath = toolManaged.config_path[platform];
      const containmentRoot = toolManaged.containment_root[platform];

      // 对于绝对路径，containment_root 必须是其前缀
      if (configPath.startsWith('/') || (configPath.length > 2 && configPath[1] === ':')) {
        expect(configPath.startsWith(containmentRoot)).toBe(true);
      }
    }

    // 检查 provider.host_config.targets.managed
    const providerManaged = claudeDefaults.provider.host_config.targets.managed;
    expect(providerManaged.config_path).toBeDefined();
    expect(providerManaged.containment_root).toBeDefined();
  });

  test('Codex system 目标声明 containment_root', () => {
    const codexDefaults = registry.hosts.codex.defaults;

    // 检查 tool.host_config.targets.system
    const toolSystem = codexDefaults.tool.host_config.targets.system;
    expect(toolSystem.config_path).toBe('/etc/codex/config.toml');
    expect(toolSystem.containment_root).toBe('/etc/codex');

    // 验证 containment_root 是 config_path 的父目录
    expect(toolSystem.config_path.startsWith(toolSystem.containment_root)).toBe(true);

    // 检查 provider.host_config.targets.system
    const providerSystem = codexDefaults.provider.host_config.targets.system;
    expect(providerSystem.config_path).toBe('/etc/codex/config.toml');
    expect(providerSystem.containment_root).toBe('/etc/codex');
  });

  test('containment_root 提供窄边界而非整个文件系统', () => {
    // 验证没有使用 "/" 或 "C:\" 作为 containment_root
    const claudeToolManaged = registry.hosts.claude.defaults.tool.host_config.targets.managed;

    expect(claudeToolManaged.containment_root.macos).not.toBe('/');
    expect(claudeToolManaged.containment_root.linux).not.toBe('/');
    expect(claudeToolManaged.containment_root.wsl).not.toBe('/');
    expect(claudeToolManaged.containment_root.windows).not.toMatch(/^[A-Z]:\\$/);

    // 验证是具体的目录路径
    expect(claudeToolManaged.containment_root.macos).toContain('ClaudeCode');
    expect(claudeToolManaged.containment_root.linux).toContain('claude-code');

    const codexToolSystem = registry.hosts.codex.defaults.tool.host_config.targets.system;
    expect(codexToolSystem.containment_root).not.toBe('/');
    expect(codexToolSystem.containment_root).toBe('/etc/codex');
  });

  test('所有绝对路径目标都有 containment_root', () => {
    // 遍历所有 hosts 和 targets，确保绝对路径都有 containment_root
    for (const [hostId, hostConfig] of Object.entries(registry.hosts)) {
      if (!hostConfig.defaults) continue;

      for (const section of ['tool', 'helper', 'provider']) {
        const sectionConfig = hostConfig.defaults[section];
        if (!sectionConfig || !sectionConfig.host_config || !sectionConfig.host_config.targets) {
          continue;
        }

        for (const [targetName, target] of Object.entries(sectionConfig.host_config.targets)) {
          if (!target.config_path) continue;

          const configPath = target.config_path;

          // 检查是否使用绝对路径（config_path 可能是按平台分组的对象）
          let hasAbsolutePath = false;
          if (typeof configPath === 'string') {
            hasAbsolutePath = configPath.startsWith('/') || (configPath.length > 2 && configPath[1] === ':');
          } else if (typeof configPath === 'object') {
            hasAbsolutePath = Object.values(configPath).some(p =>
              p.startsWith('/') || (p.length > 2 && p[1] === ':')
            );
          }

          // 如果使用绝对路径，必须有 containment_root
          if (hasAbsolutePath) {
            expect(target.containment_root).toBeDefined();
            expect(target.containment_root).not.toBeNull();
          }
        }
      }
    }
  });
});
