import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { registerAIHooks } from '../../src/core/tool-integration/ai-runtime-hook.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-ai-hook');

beforeEach(() => mkdirSync(join(TMP, '.claude'), { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('registerAIHooks', () => {
  it('should write settings without hooks wrapper layer', () => {
    registerAIHooks(TMP);
    const settings = JSON.parse(readFileSync(join(TMP, '.claude', 'settings.json'), 'utf-8'));
    // No "hooks" wrapper — event names are top-level keys
    expect(settings).not.toHaveProperty('hooks');
    expect(settings).toHaveProperty('PreToolUse');
    expect(settings).toHaveProperty('PostToolUse');
    expect(settings).toHaveProperty('Stop');
  });

  it('should use official nested format { matcher, hooks: [{ type, command }] }', () => {
    registerAIHooks(TMP);
    const settings = JSON.parse(readFileSync(join(TMP, '.claude', 'settings.json'), 'utf-8'));
    const entry = settings.PreToolUse[0];
    expect(entry).toHaveProperty('matcher');
    expect(entry).toHaveProperty('hooks');
    expect(Array.isArray(entry.hooks)).toBe(true);
    expect(entry.hooks[0]).toHaveProperty('type', 'command');
    expect(entry.hooks[0]).toHaveProperty('command');
    expect(entry.hooks[0].command).toContain('npx spec-first');
  });

  it('should be idempotent — no duplicate entries on second call', () => {
    registerAIHooks(TMP);
    registerAIHooks(TMP);
    const settings = JSON.parse(readFileSync(join(TMP, '.claude', 'settings.json'), 'utf-8'));
    expect(settings.PreToolUse).toHaveLength(1);
    expect(settings.PostToolUse).toHaveLength(1);
    expect(settings.Stop).toHaveLength(1);
  });

  it('should preserve non-spec-first entries', () => {
    const existing = {
      PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo custom' }] }],
    };
    writeFileSync(join(TMP, '.claude', 'settings.json'), JSON.stringify(existing));
    registerAIHooks(TMP);
    const settings = JSON.parse(readFileSync(join(TMP, '.claude', 'settings.json'), 'utf-8'));
    expect(settings.PreToolUse).toHaveLength(2);
    expect(settings.PreToolUse[0].hooks[0].command).toBe('echo custom');
  });

  it('should not write files when dryRun is true', () => {
    const result = registerAIHooks(TMP, { dryRun: true });
    expect(result.registered).toHaveLength(3);
    const settingsPath = join(TMP, '.claude', 'settings.json');
    // settings.json should not exist (was not written)
    expect(() => readFileSync(settingsPath, 'utf-8')).toThrow();
  });

  it('should return warnings when .claude dir missing', () => {
    rmSync(join(TMP, '.claude'), { recursive: true, force: true });
    const result = registerAIHooks(TMP);
    expect(result.registered).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
