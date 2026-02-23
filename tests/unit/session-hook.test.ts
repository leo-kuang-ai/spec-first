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
  it('should write SessionStart hook in official format', () => {
    registerSessionHooks();
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings).not.toHaveProperty('hooks');
    expect(settings).toHaveProperty('SessionStart');
    const entry = settings.SessionStart[0];
    expect(entry.matcher).toBe('*');
    expect(entry.hooks[0].type).toBe('command');
    expect(entry.hooks[0].command).toContain('spec-first viewer');
    expect(entry.hooks[0].timeout).toBe(10);
  });

  it('should be idempotent — no duplicates on second call', () => {
    registerSessionHooks();
    registerSessionHooks();
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings.SessionStart).toHaveLength(1);
  });

  it('should not write files when dryRun is true', () => {
    const result = registerSessionHooks({ dryRun: true });
    expect(result.registered).toContain('SessionStart');
    expect(existsSync(join(CLAUDE_HOME, 'settings.json'))).toBe(false);
  });

  it('should preserve other settings keys', () => {
    writeFileSync(join(CLAUDE_HOME, 'settings.json'), JSON.stringify({ customKey: 'value' }));
    registerSessionHooks();
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings.customKey).toBe('value');
    expect(settings.SessionStart).toHaveLength(1);
  });
});
