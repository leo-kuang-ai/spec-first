import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { detectHostPaths, formatHostPathSummary } from '../../src/shared/host-paths.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-host-paths');

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
});

describe('detectHostPaths', () => {
  it('should honor explicit environment overrides', () => {
    const paths = detectHostPaths({
      homeDir: join(TMP, 'home'),
      platform: 'linux',
      env: {
        CODEX_HOME: join(TMP, 'custom-codex'),
        CODEX_CONFIG_PATH: join(TMP, 'custom-codex-config', 'config.toml'),
        CODEX_SKILLS_DIR: join(TMP, 'custom-codex-skills'),
        CLAUDE_HOME: join(TMP, 'custom-claude'),
        CLAUDE_CODE_CONFIG_DIR: join(TMP, 'custom-claude-config'),
        CLAUDE_COMMANDS_DIR: join(TMP, 'custom-claude-commands'),
        CLAUDE_SKILLS_DIR: join(TMP, 'custom-claude-skills'),
        AGENTS_HOME: join(TMP, 'custom-agents'),
        SPEC_FIRST_GENERIC_HOME: join(TMP, 'custom-generic-home'),
        SPEC_FIRST_GENERIC_SKILLS_DIR: join(TMP, 'custom-generic-skills'),
        SPEC_FIRST_BOOTSTRAP_CACHE: join(TMP, 'custom-cache'),
      } as NodeJS.ProcessEnv,
    });

    expect(paths.codexRoot).toBe(join(TMP, 'custom-codex'));
    expect(paths.codexConfigPath).toBe(join(TMP, 'custom-codex-config', 'config.toml'));
    expect(paths.codexSkillsDir).toBe(join(TMP, 'custom-codex-skills'));
    expect(paths.claudeConfigDir).toBe(join(TMP, 'custom-claude-config'));
    expect(paths.claudeCommandsDir).toBe(join(TMP, 'custom-claude-commands'));
    expect(paths.claudeSkillsDir).toBe(join(TMP, 'custom-claude-skills'));
    expect(paths.agentsSkillsDir).toBe(join(TMP, 'custom-agents', 'skills'));
    expect(paths.genericHomeDir).toBe(join(TMP, 'custom-generic-home'));
    expect(paths.genericSkillsDir).toBe(join(TMP, 'custom-generic-skills'));
    expect(paths.bootstrapCacheDir).toBe(join(TMP, 'custom-cache'));
  });

  it('should detect windows-style existing paths by markers', () => {
    const appData = join(TMP, 'AppData', 'Roaming');
    const codexRoot = join(appData, 'codex');
    const claudeConfigDir = join(appData, 'claude-code');
    const claudeHome = join(appData, 'claude');

    mkdirSync(join(codexRoot, 'skills'), { recursive: true });
    writeFileSync(join(codexRoot, 'config.toml'), '', 'utf-8');
    mkdirSync(claudeConfigDir, { recursive: true });
    writeFileSync(join(claudeConfigDir, 'mcp.json'), '{}', 'utf-8');
    mkdirSync(join(claudeHome, 'skills'), { recursive: true });

    const paths = detectHostPaths({
      homeDir: join(TMP, 'home'),
      platform: 'win32',
      env: {
        APPDATA: appData,
      } as NodeJS.ProcessEnv,
    });

    expect(paths.codexRoot).toBe(codexRoot);
    expect(paths.claudeConfigDir).toBe(claudeConfigDir);
    expect(paths.claudeHomeDir).toBe(claudeHome);
  });

  it('should prefer explicit claude config override over marker-based auto-detection', () => {
    const homeDir = join(TMP, 'home');
    const explicitConfigDir = join(TMP, 'explicit-claude-config');
    const detectedConfigDir = join(homeDir, '.config', 'claude-code');

    mkdirSync(detectedConfigDir, { recursive: true });
    writeFileSync(join(detectedConfigDir, 'mcp.json'), '{}', 'utf-8');

    const paths = detectHostPaths({
      homeDir,
      platform: 'linux',
      env: {
        HOME: homeDir,
        CLAUDE_CODE_CONFIG_DIR: explicitConfigDir,
      } as NodeJS.ProcessEnv,
    });

    expect(paths.claudeConfigDir).toBe(explicitConfigDir);
  });

  it('should format host path summary for diagnostics', () => {
    const paths = detectHostPaths({
      homeDir: join(TMP, 'home'),
      platform: 'linux',
      env: {
        CODEX_CONFIG_PATH: join(TMP, 'codex', 'config.toml'),
        CODEX_SKILLS_DIR: join(TMP, 'codex', 'skills'),
        CLAUDE_CODE_CONFIG_DIR: join(TMP, 'claude-code'),
        CLAUDE_COMMANDS_DIR: join(TMP, 'claude', 'commands'),
        CLAUDE_SKILLS_DIR: join(TMP, 'claude', 'skills'),
      } as NodeJS.ProcessEnv,
    });

    const lines = formatHostPathSummary(paths);
    expect(lines).toContain(`Codex 配置: ${join(TMP, 'codex', 'config.toml')}`);
    expect(lines).toContain(`Codex skills: ${join(TMP, 'codex', 'skills')}`);
    expect(lines).toContain(`Claude 配置目录: ${join(TMP, 'claude-code')}`);
    expect(lines).toContain(`Claude 命令目录: ${join(TMP, 'claude', 'commands')}`);
    expect(lines).toContain(`Claude skills: ${join(TMP, 'claude', 'skills')}`);
    expect(lines).toContain(`Generic skills: ${join(TMP, 'home', '.spec-first', 'generic', 'skills')}`);
  });
});
