import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-uninstall');
const CLAUDE_HOME = join(TMP, '.claude');
const CODEX_SKILLS = join(TMP, '.codex', 'skills');
const SF_SKILLS = join(TMP, '.spec-first', 'skills');
const PROJECT = join(TMP, 'project');

vi.mock('../../src/shared/host-paths.js', () => ({
  detectHostPaths: () => ({
    claudeHomeDir: CLAUDE_HOME,
    claudeCommandsDir: join(CLAUDE_HOME, 'commands'),
    codexSkillsDir: CODEX_SKILLS,
    specFirstSkillsDir: SF_SKILLS,
    claudeConfigDir: join(TMP, '.config', 'claude-code'),
    claudeConfigFiles: [
      join(TMP, '.config', 'claude-code', 'mcp.json'),
      join(TMP, '.config', 'claude-code', 'settings.json'),
    ],
    codexConfigPath: join(TMP, '.codex', 'config.toml'),
  }),
}));

import { handleUninstall } from '../../src/cli/commands/uninstall.js';

function setupFixtures(): void {
  // Skills cache
  mkdirSync(join(SF_SKILLS, 'spec-first', '01-init'), { recursive: true });
  writeFileSync(join(SF_SKILLS, 'spec-first', '01-init', 'SKILL.md'), '# init');

  // Claude commands
  mkdirSync(join(CLAUDE_HOME, 'commands', 'spec-first'), { recursive: true });
  writeFileSync(join(CLAUDE_HOME, 'commands', 'spec-first', 'init.md'), 'cmd');

  // Codex skills
  mkdirSync(join(CODEX_SKILLS, 'spec-first', 'init'), { recursive: true });
  writeFileSync(join(CODEX_SKILLS, 'spec-first', 'init', 'SKILL.md'), '# init');

  // Global settings with SessionStart hook
  writeFileSync(join(CLAUDE_HOME, 'settings.json'), JSON.stringify({
    hooks: {
      SessionStart: [
        { matcher: '*', hooks: [{ type: 'command', command: 'spec-first viewer open --print-url --background' }] },
        { matcher: '*', hooks: [{ type: 'command', command: 'other-tool viewer open --background' }] },
        { matcher: '*', hooks: [{ type: 'command', command: 'echo other-tool' }] },
      ],
    },
  }));

  // Project .claude/settings.json with AI hooks
  mkdirSync(join(PROJECT, '.claude'), { recursive: true });
  writeFileSync(join(PROJECT, '.claude', 'settings.json'), JSON.stringify({
    hooks: {
      PreToolUse: [{ matcher: 'write|edit', hooks: [{ type: 'command', command: 'npx spec-first gate check' }] }],
      PostToolUse: [{ matcher: 'write|edit', hooks: [{ type: 'command', command: 'npx spec-first matrix check' }] }],
      Stop: [{ hooks: [{ type: 'command', command: 'npx spec-first ai stats' }] }],
    },
  }));
}

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
  setupFixtures();
  vi.spyOn(process, 'cwd').mockReturnValue(PROJECT);
});

afterEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('handleUninstall', () => {
  it('should show help with --help', () => {
    const code = handleUninstall(['--help']);
    expect(code).toBe(0);
  });

  it('should not delete files in dry-run mode', () => {
    handleUninstall(['--dry-run']);
    expect(existsSync(join(SF_SKILLS, 'spec-first'))).toBe(true);
    expect(existsSync(join(CLAUDE_HOME, 'commands', 'spec-first'))).toBe(true);
    expect(existsSync(join(CODEX_SKILLS, 'spec-first'))).toBe(true);
  });

  it('should remove skills cache directory', () => {
    handleUninstall([]);
    expect(existsSync(join(SF_SKILLS, 'spec-first'))).toBe(false);
  });

  it('should remove claude commands directory', () => {
    handleUninstall([]);
    expect(existsSync(join(CLAUDE_HOME, 'commands', 'spec-first'))).toBe(false);
  });

  it('should remove codex skills directory', () => {
    handleUninstall([]);
    expect(existsSync(join(CODEX_SKILLS, 'spec-first'))).toBe(false);
  });

  it('should remove spec-first SessionStart hook but keep others', () => {
    handleUninstall([]);
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings.hooks.SessionStart).toHaveLength(2);
    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe('other-tool viewer open --background');
    expect(settings.hooks.SessionStart[1].hooks[0].command).toBe('echo other-tool');
  });

  it('should remove AI runtime hooks from project settings', () => {
    handleUninstall([]);
    const settings = JSON.parse(readFileSync(join(PROJECT, '.claude', 'settings.json'), 'utf-8'));
    expect(settings.hooks.PreToolUse).toBeUndefined();
    expect(settings.hooks.PostToolUse).toBeUndefined();
    expect(settings.hooks.Stop).toBeUndefined();
  });
});
