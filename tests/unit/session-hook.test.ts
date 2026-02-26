import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-session-hook');
const CLAUDE_HOME = join(TMP, '.claude');
const ORIGINAL_SPEC_FIRST_BIN = process.env.SPEC_FIRST_BIN;

vi.mock('../../src/shared/host-paths.js', () => ({
  detectHostPaths: () => ({ claudeHomeDir: CLAUDE_HOME }),
}));

import { registerSessionHooks } from '../../src/core/tool-integration/session-hook.js';

beforeEach(() => mkdirSync(CLAUDE_HOME, { recursive: true }));
afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  if (ORIGINAL_SPEC_FIRST_BIN === undefined) {
    delete process.env.SPEC_FIRST_BIN;
  } else {
    process.env.SPEC_FIRST_BIN = ORIGINAL_SPEC_FIRST_BIN;
  }
});

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
    expect(entry.hooks[0].command).toContain('ai catchup');
    expect(entry.hooks[0].command).toContain('TRIGGER=prompt');
    expect(entry.hooks[0].command).toContain('case "$CFG_TRIGGER" in auto|prompt|off');
    expect(entry.hooks[0].command).toContain('if [ "$TRIGGER" = "auto" ]');
    expect(entry.hooks[0].command).toContain('SPEC_FIRST_MANAGED_SESSION=1');
    expect(entry.hooks[0].command).not.toContain('--project-root');
    expect(entry.hooks[0].timeout).toBe(15);
    // Superpowers P0-1: 技能路由表 + 1% 规则
    expect(entry.hooks[0].command).toContain('技能路由表');
    expect(entry.hooks[0].command).toContain('1%规则');
    expect(entry.hooks[0].command).toContain('init→spec→design→task→code→code-review→verify→catchup');
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

  it('should inject resolved CLI path as SessionStart fallback binary', () => {
    process.env.SPEC_FIRST_BIN = '/tmp/spec first/bin/spec-first';
    registerSessionHooks();

    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    const command = settings.hooks.SessionStart[0].hooks[0].command as string;
    expect(command).toContain("SPEC_FIRST_BIN_FALLBACK='/tmp/spec first/bin/spec-first' sh -c");
    expect(command).toContain('SPEC_FIRST_BIN_RESOLVED=${SPEC_FIRST_BIN:-$SPEC_FIRST_BIN_FALLBACK};');
    expect(command).toContain('"$SPEC_FIRST_BIN_RESOLVED" viewer open --print-url --background');
    expect(command).toContain('"$SPEC_FIRST_BIN_RESOLVED" ai catchup "$FEAT"');
  });

  it('should replace legacy managed viewer command without spec-first token', () => {
    writeFileSync(join(CLAUDE_HOME, 'settings.json'), JSON.stringify({
      hooks: {
        SessionStart: [
          {
            matcher: '*',
            hooks: [{ type: 'command', command: "'/tmp/sf'  viewer open --print-url --background >/dev/null 2>&1 || true", timeout: 15 }],
          },
        ],
      },
    }));

    registerSessionHooks();
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings.hooks.SessionStart).toHaveLength(1);
    expect(settings.hooks.SessionStart[0].hooks[0].command).toContain('SPEC_FIRST_MANAGED_SESSION=1');
  });

  it('should not remove non-spec-first viewer hooks', () => {
    writeFileSync(join(CLAUDE_HOME, 'settings.json'), JSON.stringify({
      hooks: {
        SessionStart: [
          { matcher: '*', hooks: [{ type: 'command', command: 'other-tool viewer open --background' }] },
          { matcher: '*', hooks: [{ type: 'command', command: "'/tmp/other-tool' viewer open --print-url --background >/dev/null 2>&1 || true" }] },
        ],
      },
    }));

    registerSessionHooks();
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings.hooks.SessionStart).toHaveLength(3);
    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe('other-tool viewer open --background');
    expect(settings.hooks.SessionStart[1].hooks[0].command).toBe("'/tmp/other-tool' viewer open --print-url --background >/dev/null 2>&1 || true");
    expect(settings.hooks.SessionStart[2].hooks[0].command).toContain('spec-first');
  });
});
