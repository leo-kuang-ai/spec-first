import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
}));

vi.mock('../../src/shared/host-paths.js', () => ({
  detectHostPaths: () => ({
    claudeCommandsDir: '/tmp/claude/commands',
    codexSkillsDir: '/tmp/codex/skills',
    claudeConfigDir: '/tmp/claude/config',
    ccSwitchInstalled: false,
    ccSwitchDataDir: '/tmp/cc-switch',
    ccSwitchSkillsDir: '/tmp/cc-switch/skills',
  }),
}));

import { execFileSync } from 'node:child_process';
import { isGlobalInstall, runPostinstallMain } from '../../src/postinstall.js';

describe('postinstall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger update during global install', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    runPostinstallMain({
      env: { npm_config_global: 'true' },
      argv: ['node', '/tmp/spec-first/dist/postinstall.js'],
      onGlobalInstall: () => true,
      skillStatus: {
        claude: false,
        codex: false,
        claudePath: '/tmp/claude/commands/spec-first',
        codexPath: '/tmp/codex/skills',
      },
      claudeInstallation: {
        installed: true,
        configDir: '/tmp/claude/config',
        commandsDir: '/tmp/claude/commands',
      },
      ccSwitchInstallation: {
        installed: false,
        dataDir: '/tmp/cc-switch',
        skillsDir: '/tmp/cc-switch/skills',
      },
      hostStatuses: [],
    });

    expect(execFileSync).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should print install guide when not globally installed and baseline is missing', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    runPostinstallMain({
      env: {},
      argv: ['node', '/tmp/spec-first/dist/postinstall.js'],
      onGlobalInstall: () => false,
      skillStatus: {
        claude: false,
        codex: false,
        claudePath: '/tmp/claude/commands/spec-first',
        codexPath: '/tmp/codex/skills',
      },
      claudeInstallation: {
        installed: false,
        configDir: '/tmp/claude/config',
        commandsDir: '/tmp/claude/commands',
      },
      ccSwitchInstallation: {
        installed: false,
        dataDir: '/tmp/cc-switch',
        skillsDir: '/tmp/cc-switch/skills',
      },
      hostStatuses: [
        {
          id: 'claude',
          detected: true,
          capabilities: undefined,
          summary: 'claude baseline=ready',
          maturity: 'stable',
          remediation: '如需刷新 Claude 基线能力，运行 spec-first update --host claude',
          baselineState: 'ready',
          missingBaseline: [],
        },
        {
          id: 'gemini',
          detected: true,
          capabilities: undefined,
          summary: 'gemini home=/tmp/gemini config=/tmp/gemini/config baseline=partial',
          maturity: 'experimental',
          remediation: '运行 spec-first update --host gemini 补齐缺失的 skills / MCP',
          baselineState: 'partial',
          missingBaseline: ['skills', 'mcp'],
        },
      ],
    });

    const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(execFileSync).not.toHaveBeenCalled();
    expect(output).toContain('spec-first | 安装后提示');
    expect(output).toContain('spec-first update');
    expect(output).toContain('基线能力尚未完整注册到 Claude Code / Codex。');
    expect(output).toContain('稳定宿主状态:');
    expect(output).toContain('claude: detected, baseline=ready, missing=(none)');
    expect(output).toContain('实验宿主提示:');
    expect(output).toContain('gemini: detected, baseline=partial, missing=skills+mcp');
  });

  it('should keep printing install guide when only one stable host is registered', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    runPostinstallMain({
      env: {},
      argv: ['node', '/tmp/spec-first/dist/postinstall.js'],
      onGlobalInstall: () => false,
      skillStatus: {
        claude: true,
        codex: false,
        claudePath: '/tmp/claude/commands/spec-first',
        codexPath: '/tmp/codex/skills',
      },
      claudeInstallation: {
        installed: true,
        configDir: '/tmp/claude/config',
        commandsDir: '/tmp/claude/commands',
      },
      ccSwitchInstallation: {
        installed: false,
        dataDir: '/tmp/cc-switch',
        skillsDir: '/tmp/cc-switch/skills',
      },
      hostStatuses: [],
    });

    const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(output).toContain('基线能力尚未完整注册到 Claude Code / Codex。');
    expect(output).toContain('spec-first update');
  });

  it('should stay silent when both stable hosts are already registered', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    runPostinstallMain({
      env: {},
      argv: ['node', '/tmp/spec-first/dist/postinstall.js'],
      onGlobalInstall: () => false,
      skillStatus: {
        claude: true,
        codex: true,
        claudePath: '/tmp/claude/commands/spec-first',
        codexPath: '/tmp/codex/skills',
      },
      claudeInstallation: {
        installed: true,
        configDir: '/tmp/claude/config',
        commandsDir: '/tmp/claude/commands',
      },
      ccSwitchInstallation: {
        installed: false,
        dataDir: '/tmp/cc-switch',
        skillsDir: '/tmp/cc-switch/skills',
      },
      hostStatuses: [],
    });

    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should not treat local pnpm source install as global', () => {
    expect(
      isGlobalInstall({
        env: {
          PNPM_HOME: '/Users/test/Library/pnpm',
          INIT_CWD: '/work/spec-first',
        },
        argv: ['node', '/work/spec-first/dist/postinstall.js'],
        execPath: '/Users/test/Library/pnpm/node',
        currentFile: '/work/spec-first/dist/postinstall.js',
        pathExists: (target) => target === '/work/spec-first/package.json',
      }),
    ).toBe(false);
  });

  it('should honor injected env when detecting global install', () => {
    expect(
      isGlobalInstall({
        env: {
          npm_config_global: 'true',
        },
        argv: ['node', '/work/spec-first/dist/postinstall.js'],
        execPath: '/usr/local/bin/node',
        currentFile: '/work/spec-first/dist/postinstall.js',
        pathExists: () => false,
      }),
    ).toBe(true);
  });
});
