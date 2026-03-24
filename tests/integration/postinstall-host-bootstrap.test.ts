import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
}));

import * as postinstall from '../../src/postinstall.js';
import { execFileSync } from 'node:child_process';

describe('postinstall host bootstrap integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should trigger update on global install', () => {
    postinstall.runPostinstallMain({
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
    });

    expect(execFileSync).toHaveBeenCalledTimes(1);
  });

  it('should print remediation guidance when baseline is missing in non-global install', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    postinstall.runPostinstallMain({
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
    });

    const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(execFileSync).not.toHaveBeenCalled();
    expect(output).toContain('spec-first update');
    expect(output).toContain('基线能力');
  });
});
