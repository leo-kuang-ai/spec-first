import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ExitCode } from '../../src/shared/types.js';

vi.mock('../../src/shared/skill-commands.js', () => ({
  ensureSkillCommands: vi.fn(() => ({ claude: [], codex: [], generic: [], codexWarnings: [] })),
}));
vi.mock('../../src/shared/host-bootstrap.js', () => ({
  ensureHostBootstrap: vi.fn(() => ({ ok: true, results: [] })),
}));
vi.mock('../../src/core/tool-integration/hook-installer.js', () => ({
  installHooks: vi.fn(() => []),
}));
vi.mock('../../src/core/tool-integration/ai-runtime-hook.js', () => ({
  registerAIHooks: vi.fn(() => ({ registered: [], warnings: [] })),
}));
vi.mock('../../src/core/tool-integration/session-hook.js', () => ({
  registerSessionHooks: vi.fn(() => ({ registered: [], warnings: [] })),
}));

import { handleUpdate } from '../../src/cli/commands/update.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-update-scaffold');
const originalCwd = process.cwd;

beforeEach(() => {
  vi.clearAllMocks();
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  mkdirSync(join(TMP, 'specs'), { recursive: true });
  process.cwd = () => TMP;
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  process.cwd = originalCwd;
});

describe('update project scaffold', () => {
  it('should create .spec-first/meta/config.yaml and .claude/settings.json when missing', async () => {
    const code = await handleUpdate(['--skip-mcp', '--skip-hooks']);
    expect(code).toBe(ExitCode.SUCCESS);

    const configPath = join(TMP, '.spec-first', 'meta', 'config.yaml');
    const settingsPath = join(TMP, '.claude', 'settings.json');
    expect(existsSync(configPath)).toBe(true);
    expect(existsSync(settingsPath)).toBe(true);
    expect(readFileSync(configPath, 'utf-8')).toContain('pilot_mode: false');
    expect(readFileSync(configPath, 'utf-8')).toContain('kv_cache_hard_gate: false');
    expect(readFileSync(settingsPath, 'utf-8')).toContain('"hooks"');
  });

  it('should not create scaffold files in dry-run mode', async () => {
    const code = await handleUpdate(['--dry-run', '--skip-mcp', '--skip-hooks']);
    expect(code).toBe(ExitCode.SUCCESS);
    expect(existsSync(join(TMP, '.spec-first', 'meta', 'config.yaml'))).toBe(false);
    expect(existsSync(join(TMP, '.claude', 'settings.json'))).toBe(false);
  });
});
