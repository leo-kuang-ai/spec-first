import { beforeEach, describe, expect, it, vi } from 'vitest';

const { existsSyncMock, readFileSyncMock } = vi.hoisted(() => ({
  existsSyncMock: vi.fn((path: string) =>
    path.includes('/tmp/gemini') ||
    path.includes('/tmp/cursor') ||
    path.includes('/tmp/claude') ||
    path.includes('/tmp/codex')
  ),
  readFileSyncMock: vi.fn((path: string) =>
    path === '/tmp/codex/config.toml'
      ? [
          '[mcp_servers.context7]',
          '[mcp_servers.sequential-thinking]',
          '[mcp_servers.serena]',
          '[mcp_servers.fetch]',
          '[mcp_servers.playwright-mcp]',
        ].join('\n')
      : JSON.stringify({
          mcpServers: {
            context7: { command: 'npx', args: ['-y', 'context7-mcp-server'] },
            'sequential-thinking': {
              command: 'npx',
              args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
            },
            serena: {
              command: 'uvx',
              args: [
                '--from',
                'git+https://github.com/oraios/serena',
                'serena',
                'start-mcp-server',
                '--context',
                'ide-assistant',
              ],
            },
            fetch: { command: 'uvx', args: ['mcp-server-fetch'] },
            'playwright-mcp': { command: 'npx', args: ['-y', '@playwright/mcp@latest'] },
          },
        })
  ),
}));

const { detectHostPathsMock } = vi.hoisted(() => ({
  detectHostPathsMock: vi.fn(() => ({
    codexConfigPath: '/tmp/codex/config.toml',
    codexSkillsDir: '/tmp/codex/skills',
    claudeCommandsDir: '/tmp/claude/commands',
    claudeConfigDir: '/tmp/claude/config',
    claudeConfigFiles: ['/tmp/claude/config/mcp.json', '/tmp/claude/config/settings.json'],
    geminiHomeDir: '/tmp/gemini',
    geminiConfigDir: '/tmp/gemini/config',
    geminiSettingsPath: '/tmp/gemini/settings.json',
    cursorHomeDir: '/tmp/cursor',
    cursorConfigDir: '/tmp/cursor/config',
    cursorMcpConfigPath: '/tmp/cursor/mcp.json',
  })),
}));

vi.mock('node:fs', () => ({
  existsSync: existsSyncMock,
  readFileSync: readFileSyncMock,
}));

vi.mock('../../src/shared/host-paths.js', () => ({
  detectHostPaths: detectHostPathsMock,
}));

import { listHostAdapters, resolveHostAdapterStatuses } from '../../src/core/host-adapters/registry.js';
import { getHostCapability } from '../../src/core/tool-integration/capability-matrix.js';

describe('host adapters', () => {
  beforeEach(() => {
    detectHostPathsMock.mockClear();
    existsSyncMock.mockImplementation((path: string) =>
      path.includes('/tmp/gemini') ||
      path.includes('/tmp/cursor') ||
      path.includes('/tmp/claude') ||
      path.includes('/tmp/codex')
    );
    readFileSyncMock.mockImplementation((path: string) =>
      path === '/tmp/codex/config.toml'
        ? [
            '[mcp_servers.context7]',
            '[mcp_servers.sequential-thinking]',
            '[mcp_servers.serena]',
            '[mcp_servers.fetch]',
            '[mcp_servers.playwright-mcp]',
          ].join('\n')
        : JSON.stringify({
            mcpServers: {
              context7: { command: 'npx', args: ['-y', 'context7-mcp-server'] },
              'sequential-thinking': {
                command: 'npx',
                args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
              },
              serena: {
                command: 'uvx',
                args: [
                  '--from',
                  'git+https://github.com/oraios/serena',
                  'serena',
                  'start-mcp-server',
                  '--context',
                  'ide-assistant',
                ],
              },
              fetch: { command: 'uvx', args: ['mcp-server-fetch'] },
              'playwright-mcp': { command: 'npx', args: ['-y', '@playwright/mcp@latest'] },
            },
          })
    );
  });

  it('should register current and planned adapters', () => {
    const ids = listHostAdapters().map((adapter) => adapter.id);
    expect(ids).toEqual(['claude', 'codex', 'gemini', 'cursor']);
  });

  it('should not expose mutable registry state through listHostAdapters', () => {
    const adapters = listHostAdapters();
    adapters.pop();

    expect(listHostAdapters().map((adapter) => adapter.id)).toEqual([
      'claude',
      'codex',
      'gemini',
      'cursor',
    ]);
  });

  it('should expose capability matrix entries', () => {
    expect(getHostCapability('claude')?.supportsMcp).toBe(true);
    expect(getHostCapability('codex')?.supportsSkills).toBe(true);
    expect(getHostCapability('generic')?.supportsSkills).toBe(true);
    expect(getHostCapability('generic')?.supportsMcp).toBe(false);
    expect(getHostCapability('gemini')?.supportsMcp).toBe(true);
    expect(getHostCapability('gemini')?.supportsSkills).toBe(true);
    expect(getHostCapability('cursor')?.supportsSkills).toBe(true);
  });

  it('should resolve detected adapter statuses including gemini and cursor', () => {
    const statuses = resolveHostAdapterStatuses();
    expect(statuses.find((entry) => entry.id === 'gemini')?.detected).toBe(true);
    expect(statuses.find((entry) => entry.id === 'cursor')?.detected).toBe(true);
    expect(statuses.find((entry) => entry.id === 'gemini')?.maturity).toBe('experimental');
    expect(statuses.find((entry) => entry.id === 'gemini')?.remediation).toContain('spec-first update --host gemini');
    expect(statuses.find((entry) => entry.id === 'gemini')?.baselineState).toBe('ready');
  });

  it('should reuse host path detection while resolving adapter statuses', () => {
    resolveHostAdapterStatuses();

    expect(detectHostPathsMock).toHaveBeenCalledTimes(1);
  });

  it('should distinguish missing baseline assets for gemini and cursor', () => {
    existsSyncMock.mockImplementation((path: string) => {
      if (path === '/tmp/gemini/settings.json') return false;
      if (path === '/tmp/cursor/mcp.json') return false;
      if (path === '/tmp/gemini/skills/spec-first') return false;
      if (path === '/tmp/cursor/skills/spec-first') return false;
      return (
        path.includes('/tmp/gemini') ||
        path.includes('/tmp/cursor') ||
        path.includes('/tmp/claude') ||
        path.includes('/tmp/codex')
      );
    });

    const statuses = resolveHostAdapterStatuses();
    expect(statuses.find((entry) => entry.id === 'gemini')?.missingBaseline).toEqual(['mcp', 'skills']);
    expect(statuses.find((entry) => entry.id === 'cursor')?.missingBaseline).toEqual(['mcp', 'skills']);
    expect(statuses.find((entry) => entry.id === 'gemini')?.remediation).toContain('补齐缺失的 skills / MCP');
    expect(statuses.find((entry) => entry.id === 'cursor')?.remediation).toContain('补齐缺失的 skills / MCP');
  });

  it('should not mark stable hosts as detected on a clean machine', () => {
    existsSyncMock.mockReturnValue(false);

    const statuses = resolveHostAdapterStatuses();
    expect(statuses.find((entry) => entry.id === 'claude')?.detected).toBe(false);
    expect(statuses.find((entry) => entry.id === 'codex')?.detected).toBe(false);
    expect(statuses.find((entry) => entry.id === 'claude')?.baselineState).toBe('unknown');
    expect(statuses.find((entry) => entry.id === 'codex')?.baselineState).toBe('unknown');
  });

  it('should treat named gemini and cursor MCP configs as ready even if command differs', () => {
    readFileSyncMock.mockImplementation((path: string) => {
      if (path === '/tmp/gemini/settings.json' || path === '/tmp/cursor/mcp.json') {
        return JSON.stringify({
          mcpServers: {
            context7: {
              command: 'custom-context7',
              args: ['--custom'],
            },
            'sequential-thinking': {
              command: 'custom-sequential-thinking',
              args: ['--custom'],
            },
            serena: {
              command: 'custom-serena',
              args: ['--custom'],
            },
            fetch: {
              command: 'custom-fetch',
              args: ['--custom'],
            },
            'playwright-mcp': {
              command: 'custom-playwright',
              args: ['--custom'],
            },
          },
        });
      }
      return '{}';
    });

    const statuses = resolveHostAdapterStatuses();
    expect(statuses.find((entry) => entry.id === 'gemini')?.missingBaseline).not.toContain('mcp');
    expect(statuses.find((entry) => entry.id === 'cursor')?.missingBaseline).not.toContain('mcp');
    expect(statuses.find((entry) => entry.id === 'gemini')?.baselineState).toBe('ready');
    expect(statuses.find((entry) => entry.id === 'cursor')?.baselineState).toBe('ready');
  });
});
