import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExitCode } from '../../src/shared/types.js';

vi.mock('../../src/shared/skill-commands.js', () => ({
  ensureSkillCommands: vi.fn(() => ({
    claude: ['a', 'b'],
    codex: ['a'],
    gemini: [],
    cursor: [],
    generic: [],
    codexWarnings: [],
  })),
}));
vi.mock('../../src/shared/host-bootstrap.js', () => ({
  ensureHostBootstrap: vi.fn(() => ({ ok: true, results: [] })),
}));
vi.mock('../../src/core/tool-integration/hook-installer.js', () => ({
  installHooks: vi.fn(() => ['pre-commit', 'commit-msg']),
}));
vi.mock('../../src/core/tool-integration/ai-runtime-hook.js', () => ({
  registerAIHooks: vi.fn(() => ({ registered: ['PreToolUse', 'PostToolUse', 'Stop'], warnings: [] })),
}));
vi.mock('../../src/core/tool-integration/session-hook.js', () => ({
  registerSessionHooks: vi.fn(() => ({ registered: ['SessionStart'], warnings: [] })),
}));

import { handleUpdate } from '../../src/cli/commands/update.js';
import { ensureSkillCommands } from '../../src/shared/skill-commands.js';
import { ensureHostBootstrap } from '../../src/shared/host-bootstrap.js';
import { registerAIHooks } from '../../src/core/tool-integration/ai-runtime-hook.js';
import { installHooks } from '../../src/core/tool-integration/hook-installer.js';
import { registerSessionHooks } from '../../src/core/tool-integration/session-hook.js';
import * as hostAdapterRegistry from '../../src/core/host-adapters/registry.js';

beforeEach(() => vi.clearAllMocks());

describe('handleUpdate', () => {
  it('should return SUCCESS for --help', async () => {
    expect(await handleUpdate(['--help'])).toBe(ExitCode.SUCCESS);
  });

  it('should call all 5 core functions', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleUpdate([]);
    expect(ensureSkillCommands).toHaveBeenCalled();
    expect(ensureHostBootstrap).toHaveBeenCalled();
    expect(registerAIHooks).toHaveBeenCalled();
    expect(registerSessionHooks).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('should pass dryRun to core functions with --dry-run', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleUpdate(['--dry-run']);
    expect(ensureSkillCommands).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ dryRun: true }),
    );
    expect(registerAIHooks).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ dryRun: true }),
    );
    expect(registerSessionHooks).toHaveBeenCalledWith(
      expect.objectContaining({ dryRun: true }),
    );
    vi.restoreAllMocks();
  });

  it('should keep hooks and viewer enabled by default when no component is specified', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleUpdate([]);
    expect(registerAIHooks).toHaveBeenCalled();
    expect(registerSessionHooks).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('should skip MCP with --skip-mcp', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleUpdate(['--skip-mcp']);
    expect(ensureHostBootstrap).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('should skip hooks with --skip-hooks', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleUpdate(['--skip-hooks']);
    expect(installHooks).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('should pass selected hosts to ensureSkillCommands', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleUpdate(['--host', 'generic,codex,gemini,cursor']);
    expect(ensureSkillCommands).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ hosts: ['generic', 'codex', 'gemini', 'cursor'] }),
    );
    vi.restoreAllMocks();
  });

  it('should pass selected hosts to ensureHostBootstrap', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleUpdate(['--host', 'gemini,cursor']);
    expect(ensureHostBootstrap).toHaveBeenCalledWith(
      expect.objectContaining({ hosts: ['gemini', 'cursor'], checkBinaries: false })
    );
    vi.restoreAllMocks();
  });

  it('should skip session hook when selected hosts exclude claude', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleUpdate(['--host', 'gemini,cursor']);
    expect(registerSessionHooks).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('should keep session hook when selected hosts include claude', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleUpdate(['--host', 'claude']);
    expect(registerSessionHooks).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('should accept component flag while keeping baseline bootstrap', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleUpdate(['--component', 'viewer']);
    expect(ensureHostBootstrap).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('should accept component plan entries for baseline and optional layers', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleUpdate(['--component', 'skills,mcp,hooks,viewer']);
    const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');

    expect(ensureHostBootstrap).toHaveBeenCalled();
    expect(output).toContain('Component Plan:');
    expect(output).toContain('baseline=skills, mcp');
    expect(output).toContain('optional=hooks, viewer');
    vi.restoreAllMocks();
  });

  it('should only run viewer session hook when component=viewer', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleUpdate(['--component', 'viewer']);
    expect(installHooks).not.toHaveBeenCalled();
    expect(registerAIHooks).not.toHaveBeenCalled();
    expect(registerSessionHooks).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('should only run hook installers when component=hooks', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await handleUpdate(['--component', 'hooks']);
    expect(installHooks).toHaveBeenCalled();
    expect(registerAIHooks).toHaveBeenCalled();
    expect(registerSessionHooks).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('should print remediation for hosts that remain partial after update', async () => {
    vi.spyOn(hostAdapterRegistry, 'resolveHostAdapterStatuses').mockReturnValue([
      {
        id: 'gemini',
        detected: true,
        capabilities: undefined,
        summary: 'Gemini CLI detected',
        maturity: 'experimental',
        remediation: '运行 spec-first update --host gemini',
        baselineState: 'partial',
        missingBaseline: ['skills', 'mcp'],
      },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await handleUpdate([]);

    const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(output).toContain('gemini: detected baseline=partial missing=skills+mcp');
    expect(output).toContain('运行 spec-first update --host gemini');
    vi.restoreAllMocks();
  });

  it('should render host summary using final status after bootstrap fixes missing MCP', async () => {
    let baselineState: 'partial' | 'ready' = 'partial';
    vi.mocked(ensureHostBootstrap).mockImplementation(() => {
      baselineState = 'ready';
      return {
        ok: true,
        results: [
          {
            host: 'Cursor',
            category: 'MCP',
            name: 'context7',
            level: 'FIXED',
            detail: 'fixed',
          },
        ],
      };
    });
    vi.spyOn(hostAdapterRegistry, 'resolveHostAdapterStatuses').mockImplementation(() => [
      {
        id: 'cursor',
        detected: true,
        capabilities: undefined,
        summary: `cursor baseline=${baselineState}`,
        maturity: 'experimental',
        remediation: '运行 spec-first update --host cursor',
        baselineState,
        missingBaseline: baselineState === 'ready' ? [] : ['mcp'],
      },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await handleUpdate(['--host', 'cursor']);

    const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(output).toContain('cursor: detected baseline=ready');
    expect(output).not.toContain('cursor: detected baseline=partial missing=mcp');

    vi.mocked(ensureHostBootstrap).mockReturnValue({ ok: true, results: [] });
    vi.restoreAllMocks();
  });

  it('should summarize baseline bootstrap using only required MCP host entries', async () => {
    vi.mocked(ensureHostBootstrap).mockReturnValue({
      ok: true,
      results: [
        {
          host: 'Claude Code',
          category: 'MCP',
          name: 'sequential-thinking',
          level: 'PASS',
          detail: 'ok',
        },
        {
          host: 'Claude Code',
          category: 'MCP',
          name: 'context7',
          level: 'FIXED',
          detail: 'fixed',
        },
        {
          host: 'Claude Code',
          category: 'MCP',
          name: 'config.toml.backup',
          level: 'PASS',
          detail: 'backup',
        },
        {
          host: 'Common',
          category: 'MCP',
          name: 'CODEX_HOME',
          level: 'WARNING',
          detail: 'ignored',
        },
      ],
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await handleUpdate([]);

    const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(output).toContain('mcp: 2/5 host entries checked, 1 fixed, 0 warnings, 0 errors');

    vi.mocked(ensureHostBootstrap).mockReturnValue({ ok: true, results: [] });
    vi.restoreAllMocks();
  });

  it('should include warning counts in baseline bootstrap summary', async () => {
    vi.mocked(ensureHostBootstrap).mockReturnValue({
      ok: true,
      results: [
        {
          host: 'Cursor',
          category: 'MCP',
          name: 'fetch',
          level: 'WARNING',
          detail: 'conflict',
        },
      ],
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await handleUpdate(['--host', 'cursor']);

    const output = logSpy.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(output).toContain('mcp: 1/5 host entries checked, 0 fixed, 1 warnings, 0 errors');

    vi.mocked(ensureHostBootstrap).mockReturnValue({ ok: true, results: [] });
    vi.restoreAllMocks();
  });

  it('should return UNKNOWN_ERROR on throw without --from-postinstall', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(ensureSkillCommands).mockImplementation(() => { throw new Error('boom'); });
    expect(await handleUpdate([])).toBe(ExitCode.UNKNOWN_ERROR);
    vi.mocked(ensureSkillCommands).mockReturnValue({
      claude: [],
      codex: [],
      gemini: [],
      cursor: [],
      generic: [],
      codexWarnings: [],
    });
    vi.restoreAllMocks();
  });

  it('should return SUCCESS in --from-postinstall even on error', async () => {
    vi.mocked(ensureSkillCommands).mockImplementation(() => { throw new Error('fail'); });
    expect(await handleUpdate(['--from-postinstall'])).toBe(ExitCode.SUCCESS);
    vi.mocked(ensureSkillCommands).mockReturnValue({
      claude: [],
      codex: [],
      gemini: [],
      cursor: [],
      generic: [],
      codexWarnings: [],
    });
  });
});
