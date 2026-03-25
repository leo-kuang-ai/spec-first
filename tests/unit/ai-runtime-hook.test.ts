import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { registerAIHooks } from '../../src/core/tool-integration/ai-runtime-hook.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-ai-hook');

beforeEach(() => mkdirSync(join(TMP, '.claude'), { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('registerAIHooks', () => {
  it('should write settings with hooks wrapper layer', () => {
    registerAIHooks(TMP);
    const settings = JSON.parse(readFileSync(join(TMP, '.claude', 'settings.json'), 'utf-8'));
    // Claude Code requires hooks nested under "hooks" key
    expect(settings).toHaveProperty('hooks');
    expect(settings.hooks).toHaveProperty('PreToolUse');
    expect(settings.hooks).toHaveProperty('PostToolUse');
    expect(settings.hooks).toHaveProperty('Stop');
    expect(settings).not.toHaveProperty('PreToolUse');
    expect(existsSync(join(TMP, '.spec-first', 'hooks', 'task-context.sh'))).toBe(true);
    expect(existsSync(join(TMP, '.spec-first', 'hooks', 'stop-guard.sh'))).toBe(true);
    expect(existsSync(join(TMP, '.spec-first', 'hooks', 'progress-sync.sh'))).toBe(true);
  });

  it('should use official nested format { matcher, hooks: [{ type, command }] }', () => {
    registerAIHooks(TMP);
    const settings = JSON.parse(readFileSync(join(TMP, '.claude', 'settings.json'), 'utf-8'));
    const preEntries = settings.hooks.PreToolUse;
    expect(preEntries).toHaveLength(2);
    expect(preEntries[0].matcher).toContain('write');
    expect(preEntries[0].matcher).toContain('multi_edit');
    expect(preEntries[1].matcher).toBe(preEntries[0].matcher);
    expect(preEntries[0].hooks[0]).toHaveProperty('type', 'command');
    expect(preEntries[0].hooks[0].command).toContain('task-context.sh');
    expect(preEntries[1].hooks[0].command).toContain('npx spec-first status');

    const stopEntries = settings.hooks.Stop;
    expect(stopEntries).toHaveLength(2);
    expect(stopEntries[0]).not.toHaveProperty('matcher');
    expect(stopEntries[1]).not.toHaveProperty('matcher');
  });

  it('should be idempotent — no duplicate entries on second call', () => {
    registerAIHooks(TMP);
    registerAIHooks(TMP);
    const settings = JSON.parse(readFileSync(join(TMP, '.claude', 'settings.json'), 'utf-8'));
    expect(settings.hooks.PreToolUse).toHaveLength(2);
    expect(settings.hooks.PostToolUse).toHaveLength(2);
    expect(settings.hooks.Stop).toHaveLength(2);
  });

  it('should preserve non-spec-first entries', () => {
    const existing = {
      hooks: {
        PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo custom' }] }],
      },
    };
    writeFileSync(join(TMP, '.claude', 'settings.json'), JSON.stringify(existing));
    registerAIHooks(TMP);
    const settings = JSON.parse(readFileSync(join(TMP, '.claude', 'settings.json'), 'utf-8'));
    expect(settings.hooks.PreToolUse).toHaveLength(3);
    expect(settings.hooks.PreToolUse[0].hooks[0].command).toBe('echo custom');
  });

  it('should migrate legacy top-level hook entries into hooks wrapper', () => {
    const legacy = {
      PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo legacy' }] }],
    };
    writeFileSync(join(TMP, '.claude', 'settings.json'), JSON.stringify(legacy));
    registerAIHooks(TMP);
    const settings = JSON.parse(readFileSync(join(TMP, '.claude', 'settings.json'), 'utf-8'));
    expect(settings).not.toHaveProperty('PreToolUse');
    expect(settings.hooks.PreToolUse).toHaveLength(3);
    expect(settings.hooks.PreToolUse[0].hooks[0].command).toBe('echo legacy');
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

  it('should merge enabled extension hook configs', () => {
    const extDir = join(TMP, '.spec-first', 'extensions', 'qa-pack');
    mkdirSync(extDir, { recursive: true });
    writeFileSync(join(extDir, 'extension.yaml'), `
namespace: qa
version: 1.0.0
enabled: true
hooks:
  - type: Stop
    command: echo ext-stop
`, 'utf-8');

    registerAIHooks(TMP);
    const settings = JSON.parse(readFileSync(join(TMP, '.claude', 'settings.json'), 'utf-8'));
    const stopEntries = settings.hooks.Stop;
    expect(stopEntries.some((entry: { hooks: Array<{ command: string }> }) =>
      entry.hooks[0].command.includes('extension-hook.mjs'))).toBe(true);
    expect(existsSync(join(TMP, '.spec-first', 'hooks', 'extension-hook.mjs'))).toBe(true);
  });

  it('should generate stop-guard with reminder-only semantics', () => {
    const featureId = 'TEST-001';
    const specsDir = join(TMP, 'specs', featureId);
    mkdirSync(specsDir, { recursive: true });

    writeFileSync(join(specsDir, 'stage-state.json'), JSON.stringify({
      currentStage: '04_implement'
    }), 'utf-8');

    writeFileSync(join(specsDir, 'task_plan.md'), `
| TASK-001 | Test Task | in_progress |
`, 'utf-8');

    mkdirSync(join(TMP, '.spec-first'), { recursive: true });
    writeFileSync(join(TMP, '.spec-first', 'current'), featureId, 'utf-8');

    registerAIHooks(TMP);

    const scriptPath = join(TMP, '.spec-first', 'hooks', 'stop-guard.sh');
    const scriptContent = readFileSync(scriptPath, 'utf-8');

    expect(scriptContent).toContain('04_implement');
    expect(scriptContent).toContain('in_progress');
    expect(scriptContent).toContain('exit 0');
    expect(scriptContent).not.toContain('exit 2');
  });

  it('should generate stop-guard that uses correct variable names', () => {
    registerAIHooks(TMP);
    const scriptContent = readFileSync(join(TMP, '.spec-first', 'hooks', 'stop-guard.sh'), 'utf-8');

    expect(scriptContent).toContain('STAGE_FILE=');
    expect(scriptContent).toContain('TASK_FILE=');
    expect(scriptContent).toContain('IN_PROGRESS_IDS=');
  });
});
