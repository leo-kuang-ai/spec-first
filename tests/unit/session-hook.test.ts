import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-session-hook');
const CLAUDE_HOME = join(TMP, '.claude');

vi.mock('../../src/shared/host-paths.js', () => ({
  detectHostPaths: () => ({ claudeHomeDir: CLAUDE_HOME }),
}));

import { registerSessionHooks } from '../../src/core/tool-integration/session-hook.js';

beforeEach(() => mkdirSync(CLAUDE_HOME, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('registerSessionHooks', () => {
  it('should write SessionStart hook under hooks wrapper', () => {
    registerSessionHooks();
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings).toHaveProperty('hooks');
    expect(settings.hooks).toHaveProperty('SessionStart');
    expect(settings).not.toHaveProperty('SessionStart');
    const entry = settings.hooks.SessionStart[0];
    expect(entry.matcher).toBe('*');
    expect(entry.hooks[0].type).toBe('command');
    expect(entry.hooks[0].command).toContain('viewer open');
    expect(entry.hooks[0].command).not.toContain('--project-root');
    expect(entry.hooks[0].timeout).toBe(15);
  });

  it('should be idempotent — no duplicates on second call', () => {
    registerSessionHooks();
    registerSessionHooks();
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings.hooks.SessionStart).toHaveLength(1);
  });

  it('should not write files when dryRun is true', () => {
    const result = registerSessionHooks({ dryRun: true });
    expect(result.registered).toContain('SessionStart');
    expect(existsSync(join(CLAUDE_HOME, 'settings.json'))).toBe(false);
  });

  it('should migrate legacy top-level SessionStart into hooks wrapper', () => {
    const legacy = {
      SessionStart: [{ matcher: '*', hooks: [{ type: 'command', command: 'echo legacy' }] }],
    };
    writeFileSync(join(CLAUDE_HOME, 'settings.json'), JSON.stringify(legacy));
    registerSessionHooks();
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings).not.toHaveProperty('SessionStart');
    expect(settings.hooks.SessionStart).toHaveLength(2);
    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe('echo legacy');
    expect(settings.hooks.SessionStart[1].hooks[0].command).toContain('viewer open');
  });

  it('should preserve other settings keys', () => {
    writeFileSync(join(CLAUDE_HOME, 'settings.json'), JSON.stringify({ customKey: 'value' }));
    registerSessionHooks();
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings.customKey).toBe('value');
    expect(settings.hooks.SessionStart).toHaveLength(1);
  });

  it('should not remove non-spec-first viewer hooks', () => {
    writeFileSync(join(CLAUDE_HOME, 'settings.json'), JSON.stringify({
      hooks: {
        SessionStart: [
          { matcher: '*', hooks: [{ type: 'command', command: 'other-tool viewer open --background' }] },
        ],
      },
    }));

    registerSessionHooks();
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings.hooks.SessionStart).toHaveLength(2);
    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe('other-tool viewer open --background');
    expect(settings.hooks.SessionStart[1].hooks[0].command).toContain('spec-first');
  });
});
