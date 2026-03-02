import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExitCode } from '../../src/shared/types.js';

vi.mock('../../src/shared/skill-commands.js', () => ({
  ensureSkillCommands: vi.fn(() => ({ claude: ['a', 'b'], codex: ['a'], generic: [], codexWarnings: [] })),
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
    await handleUpdate(['--host', 'generic,codex']);
    expect(ensureSkillCommands).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ hosts: ['generic', 'codex'] }),
    );
    vi.restoreAllMocks();
  });

  it('should return UNKNOWN_ERROR on throw without --from-postinstall', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(ensureSkillCommands).mockImplementation(() => { throw new Error('boom'); });
    expect(await handleUpdate([])).toBe(ExitCode.UNKNOWN_ERROR);
    vi.mocked(ensureSkillCommands).mockReturnValue({ claude: [], codex: [], generic: [], codexWarnings: [] });
    vi.restoreAllMocks();
  });

  it('should return SUCCESS in --from-postinstall even on error', async () => {
    vi.mocked(ensureSkillCommands).mockImplementation(() => { throw new Error('fail'); });
    expect(await handleUpdate(['--from-postinstall'])).toBe(ExitCode.SUCCESS);
    vi.mocked(ensureSkillCommands).mockReturnValue({ claude: [], codex: [], generic: [], codexWarnings: [] });
  });
});
