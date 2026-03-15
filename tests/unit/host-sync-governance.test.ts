import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureSkillCommands } from '../../src/shared/skill-commands.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-host-sync-governance');
const ENV_KEYS = [
  'CODEX_SKILLS_DIR',
  'CLAUDE_COMMANDS_DIR',
  'CLAUDE_SKILLS_DIR',
  'CLAUDE_CODE_CONFIG_DIR',
  'GEMINI_HOME',
  'CURSOR_HOME',
  'SPEC_FIRST_GENERIC_SKILLS_DIR',
  'SPEC_FIRST_SKILLS_DIR',
];
const envBackup: Record<string, string | undefined> = {};

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
  for (const key of ENV_KEYS) envBackup[key] = process.env[key];
  process.env.CODEX_SKILLS_DIR = join(TMP, 'codex-skills');
  process.env.CLAUDE_COMMANDS_DIR = join(TMP, 'claude-commands');
  process.env.CLAUDE_SKILLS_DIR = join(TMP, 'claude-skills');
  process.env.CLAUDE_CODE_CONFIG_DIR = join(TMP, 'claude-code-config');
  process.env.GEMINI_HOME = join(TMP, 'gemini-home');
  process.env.CURSOR_HOME = join(TMP, 'cursor-home');
  process.env.SPEC_FIRST_GENERIC_SKILLS_DIR = join(TMP, 'generic-skills');
  process.env.SPEC_FIRST_SKILLS_DIR = join(TMP, 'spec-first-skills');
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = envBackup[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  rmSync(TMP, { recursive: true, force: true });
});

describe('host sync governance', () => {
  it('cleans removed legacy skill entries from host directories', () => {
    const legacyClaudeDir = join(process.env.CLAUDE_COMMANDS_DIR as string, 'spec-first');
    const legacyCodexDir = join(process.env.CODEX_SKILLS_DIR as string, 'spec-first');
    mkdirSync(legacyClaudeDir, { recursive: true });
    mkdirSync(legacyCodexDir, { recursive: true });

    writeFileSync(join(legacyClaudeDir, 'test.md'), 'legacy', 'utf-8');
    writeFileSync(join(legacyClaudeDir, 'feature-list.md'), 'legacy', 'utf-8');
    mkdirSync(join(legacyCodexDir, 'test'), { recursive: true });
    mkdirSync(join(legacyCodexDir, 'feature-switch'), { recursive: true });

    const result = ensureSkillCommands(TMP, { global: true });

    expect(result.claude).not.toContain('spec-first:test');
    expect(result.codex).not.toContain('spec-first:test');
    expect(existsSync(join(legacyClaudeDir, 'test.md'))).toBe(false);
    expect(existsSync(join(legacyClaudeDir, 'feature-list.md'))).toBe(false);
    expect(existsSync(join(legacyCodexDir, 'test'))).toBe(false);
    expect(existsSync(join(legacyCodexDir, 'feature-switch'))).toBe(false);
  });
});
