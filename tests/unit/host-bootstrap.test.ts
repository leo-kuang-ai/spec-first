import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const TMP = join(process.cwd(), 'tests/fixtures/.tmp-host-bootstrap');

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(() => ''),
}));

vi.mock('../../src/shared/host-paths.js', () => ({
  detectHostPaths: () => ({
    homeDir: TMP,
    codexRoot: join(TMP, 'codex'),
    codexConfigPath: join(TMP, 'codex', 'config.toml'),
    codexSkillsDir: join(TMP, 'codex', 'skills'),
    codexSystemSkillsDir: join(TMP, 'codex', 'skills', '.system'),
    claudeHomeDir: join(TMP, 'claude-home'),
    claudeSkillsDir: join(TMP, 'claude-home', 'skills'),
    claudeCommandsDir: join(TMP, 'claude-home', 'commands'),
    claudeConfigDir: join(TMP, 'claude-config'),
    claudeConfigFiles: [
      join(TMP, 'claude-config', 'mcp.json'),
      join(TMP, 'claude-config', 'settings.json'),
    ],
    geminiHomeDir: join(TMP, 'gemini'),
    geminiConfigDir: join(TMP, 'gemini', 'config'),
    geminiSettingsPath: join(TMP, 'gemini', 'settings.json'),
    cursorHomeDir: join(TMP, 'cursor'),
    cursorConfigDir: join(TMP, 'cursor', 'config'),
    cursorSettingsPath: join(TMP, 'cursor', 'settings.json'),
    cursorMcpConfigPath: join(TMP, 'cursor', 'mcp.json'),
    agentsSkillsDir: join(TMP, 'agents', 'skills'),
    genericHomeDir: join(TMP, 'generic'),
    genericSkillsDir: join(TMP, 'generic', 'skills'),
    specFirstSkillsDir: join(TMP, 'spec-first', 'skills'),
    bootstrapCacheDir: join(TMP, 'bootstrap-cache'),
  }),
}));

import { ensureHostBootstrap } from '../../src/shared/host-bootstrap.js';

const ORIGINAL_VITEST = process.env.VITEST;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const ORIGINAL_SKIP = process.env.SPEC_FIRST_SKIP_BOOTSTRAP;

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(join(TMP, 'agents', 'skills', 'find-skills'), { recursive: true });
  mkdirSync(join(TMP, 'agents', 'skills', 'skill-creator'), { recursive: true });
  writeFileSync(join(TMP, 'agents', 'skills', 'find-skills', 'SKILL.md'), '# find-skills\n', 'utf-8');
  writeFileSync(join(TMP, 'agents', 'skills', 'skill-creator', 'SKILL.md'), '# skill-creator\n', 'utf-8');

  delete process.env.VITEST;
  process.env.NODE_ENV = 'development';
  delete process.env.SPEC_FIRST_SKIP_BOOTSTRAP;
  vi.mocked(execFileSync).mockClear();
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  if (ORIGINAL_VITEST === undefined) delete process.env.VITEST;
  else process.env.VITEST = ORIGINAL_VITEST;
  if (ORIGINAL_NODE_ENV === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = ORIGINAL_NODE_ENV;
  if (ORIGINAL_SKIP === undefined) delete process.env.SPEC_FIRST_SKIP_BOOTSTRAP;
  else process.env.SPEC_FIRST_SKIP_BOOTSTRAP = ORIGINAL_SKIP;
});

describe('ensureHostBootstrap', () => {
  it('should skip bootstrap when SPEC_FIRST_SKIP_BOOTSTRAP=1', () => {
    process.env.SPEC_FIRST_SKIP_BOOTSTRAP = '1';
    const result = ensureHostBootstrap();
    expect(result.ok).toBe(true);
    expect(result.results).toHaveLength(0);
  });

  it('should evaluate host bootstrap in dry-run mode', () => {
    const result = ensureHostBootstrap({ dryRun: true });
    expect(result.ok).toBe(true);
    expect(result.results.some((item) => item.category === 'MCP')).toBe(true);
    expect(result.results.some((item) => item.category === 'Skill')).toBe(true);
    expect(result.results.some((item) => item.requiredByDefault)).toBe(true);
    expect(result.results.some((item) => item.impact)).toBe(true);
    expect(result.results.some((item) => item.category === 'Binary')).toBe(false);
    expect(vi.mocked(execFileSync).mock.calls.length).toBe(0);
  });

  it('should run binary checks only when checkBinaries=true', () => {
    const result = ensureHostBootstrap({ dryRun: true, checkBinaries: true });
    expect(result.ok).toBe(true);
    expect(result.results.some((item) => item.category === 'Binary')).toBe(true);
    expect(vi.mocked(execFileSync).mock.calls.length).toBeGreaterThan(0);
  });

  it('should create backup when rewriting codex config', () => {
    const codexConfig = join(TMP, 'codex', 'config.toml');
    mkdirSync(join(TMP, 'codex'), { recursive: true });
    writeFileSync(codexConfig, '[mcp_servers]\n', 'utf-8');

    const result = ensureHostBootstrap();
    expect(result.ok).toBe(true);
    expect(existsSync(`${codexConfig}.bak`)).toBe(true);
    expect(readFileSync(`${codexConfig}.bak`, 'utf-8')).toContain('[mcp_servers]');
    expect(result.results.some((item) => item.name === 'config.toml.backup')).toBe(true);
  });

  it('should write gemini and cursor MCP configs when host env is enabled', () => {
    process.env.GEMINI_HOME = join(TMP, 'gemini');
    process.env.CURSOR_HOME = join(TMP, 'cursor');

    const result = ensureHostBootstrap({ hosts: ['gemini', 'cursor'] });
    expect(result.ok).toBe(true);
    expect(existsSync(join(TMP, 'gemini', 'settings.json'))).toBe(true);
    expect(existsSync(join(TMP, 'cursor', 'mcp.json'))).toBe(true);
    expect(readFileSync(join(TMP, 'gemini', 'settings.json'), 'utf-8')).toContain('"mcpServers"');
    expect(readFileSync(join(TMP, 'cursor', 'mcp.json'), 'utf-8')).toContain('"context7"');
  });

  it('should not manage experimental hosts by default', () => {
    process.env.GEMINI_HOME = join(TMP, 'gemini');
    process.env.CURSOR_HOME = join(TMP, 'cursor');

    const result = ensureHostBootstrap();
    const touchedHosts = new Set(result.results.map((item) => item.host));

    expect(touchedHosts.has('Gemini CLI')).toBe(false);
    expect(touchedHosts.has('Cursor')).toBe(false);
    expect(existsSync(join(TMP, 'gemini', 'settings.json'))).toBe(false);
    expect(existsSync(join(TMP, 'cursor', 'mcp.json'))).toBe(false);
  });

  it('should limit bootstrap actions to selected hosts', () => {
    process.env.GEMINI_HOME = join(TMP, 'gemini');
    process.env.CURSOR_HOME = join(TMP, 'cursor');

    const result = ensureHostBootstrap({ dryRun: true, hosts: ['gemini', 'cursor'] });
    const touchedHosts = new Set(result.results.map((item) => item.host));

    expect(touchedHosts.has('Gemini CLI')).toBe(true);
    expect(touchedHosts.has('Cursor')).toBe(true);
    expect(touchedHosts.has('Codex')).toBe(false);
    expect(touchedHosts.has('Claude Code')).toBe(false);
  });

  it('should migrate legacy gemini mcp_servers into mcpServers', () => {
    process.env.GEMINI_HOME = join(TMP, 'gemini');
    mkdirSync(join(TMP, 'gemini'), { recursive: true });
    writeFileSync(
      join(TMP, 'gemini', 'settings.json'),
      JSON.stringify({
        mcp_servers: {
          legacy: {
            command: 'legacy-cmd',
            args: ['--legacy'],
          },
        },
      }),
      'utf-8',
    );

    const result = ensureHostBootstrap({ hosts: ['gemini'] });
    expect(result.ok).toBe(true);
    const settings = readFileSync(join(TMP, 'gemini', 'settings.json'), 'utf-8');
    expect(settings).toContain('"mcpServers"');
    expect(settings).toContain('"legacy"');
    expect(settings).not.toContain('"mcp_servers"');
  });

  it('should migrate legacy cursor servers into mcpServers', () => {
    process.env.CURSOR_HOME = join(TMP, 'cursor');
    mkdirSync(join(TMP, 'cursor'), { recursive: true });
    writeFileSync(
      join(TMP, 'cursor', 'mcp.json'),
      JSON.stringify({
        servers: {
          legacy: {
            command: 'legacy-cmd',
            args: ['--legacy'],
          },
        },
      }),
      'utf-8',
    );

    const result = ensureHostBootstrap({ hosts: ['cursor'] });
    expect(result.ok).toBe(true);
    const settings = readFileSync(join(TMP, 'cursor', 'mcp.json'), 'utf-8');
    expect(settings).toContain('"mcpServers"');
    expect(settings).toContain('"legacy"');
    expect(settings).not.toContain('"servers"');
  });

  it('should preserve named gemini MCP entries and report pass', () => {
    process.env.GEMINI_HOME = join(TMP, 'gemini');
    mkdirSync(join(TMP, 'gemini'), { recursive: true });
    writeFileSync(
      join(TMP, 'gemini', 'settings.json'),
      JSON.stringify({
        mcpServers: {
          context7: {
            command: 'custom-context7',
            args: ['--custom'],
          },
        },
      }),
      'utf-8',
    );

    const result = ensureHostBootstrap({ hosts: ['gemini'] });
    const settings = readFileSync(join(TMP, 'gemini', 'settings.json'), 'utf-8');
    const conflict = result.results.find(
      (item) => item.host === 'Gemini CLI' && item.name === 'context7'
    );

    expect(result.ok).toBe(true);
    expect(settings).toContain('"custom-context7"');
    expect(conflict?.level).toBe('PASS');
    expect(conflict?.detail).toContain('已配置');
  });

  it('should preserve named cursor MCP entries and report pass', () => {
    process.env.CURSOR_HOME = join(TMP, 'cursor');
    mkdirSync(join(TMP, 'cursor'), { recursive: true });
    writeFileSync(
      join(TMP, 'cursor', 'mcp.json'),
      JSON.stringify({
        mcpServers: {
          context7: {
            command: 'custom-context7',
            args: ['--custom'],
          },
        },
      }),
      'utf-8',
    );

    const result = ensureHostBootstrap({ hosts: ['cursor'] });
    const settings = readFileSync(join(TMP, 'cursor', 'mcp.json'), 'utf-8');
    const conflict = result.results.find(
      (item) => item.host === 'Cursor' && item.name === 'context7'
    );

    expect(result.ok).toBe(true);
    expect(settings).toContain('"custom-context7"');
    expect(conflict?.level).toBe('PASS');
    expect(conflict?.detail).toContain('已配置');
  });
});
