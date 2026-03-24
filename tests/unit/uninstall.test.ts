import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ExitCode } from '../../src/shared/types.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-uninstall');
const CLAUDE_HOME = join(TMP, '.claude');
const CODEX_SKILLS = join(TMP, '.codex', 'skills');
const GEMINI_HOME = join(TMP, '.gemini');
const CURSOR_HOME = join(TMP, '.cursor');
const GENERIC_HOME = join(TMP, '.spec-first', 'generic');
const SF_SKILLS = join(TMP, '.spec-first', 'skills');
const CC_SWITCH_SKILLS = join(TMP, '.cc-switch', 'skills');
const PROJECT = join(TMP, 'project');

vi.mock('../../src/shared/host-paths.js', () => ({
  detectHostPaths: () => ({
    claudeHomeDir: CLAUDE_HOME,
    claudeCommandsDir: join(CLAUDE_HOME, 'commands'),
    codexSkillsDir: CODEX_SKILLS,
    specFirstSkillsDir: SF_SKILLS,
    genericSkillsDir: join(GENERIC_HOME, 'skills'),
    claudeConfigDir: join(TMP, '.config', 'claude-code'),
    claudeConfigFiles: [
      join(TMP, '.config', 'claude-code', 'mcp.json'),
      join(TMP, '.config', 'claude-code', 'settings.json'),
    ],
    codexConfigPath: join(TMP, '.codex', 'config.toml'),
    geminiHomeDir: GEMINI_HOME,
    geminiSettingsPath: join(GEMINI_HOME, 'settings.json'),
    cursorHomeDir: CURSOR_HOME,
    cursorMcpConfigPath: join(CURSOR_HOME, 'mcp.json'),
    ccSwitchInstalled: true,
    ccSwitchSkillsDir: CC_SWITCH_SKILLS,
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

  // Gemini skills
  mkdirSync(join(GEMINI_HOME, 'skills', 'spec-first', 'init'), { recursive: true });
  writeFileSync(join(GEMINI_HOME, 'skills', 'spec-first', 'init', 'SKILL.md'), '# init');

  // Cursor skills
  mkdirSync(join(CURSOR_HOME, 'skills', 'spec-first', 'init'), { recursive: true });
  writeFileSync(join(CURSOR_HOME, 'skills', 'spec-first', 'init', 'SKILL.md'), '# init');

  // Generic skills
  mkdirSync(join(GENERIC_HOME, 'skills', 'spec-first', 'init'), { recursive: true });
  writeFileSync(join(GENERIC_HOME, 'skills', 'spec-first', 'init', 'SKILL.md'), '# init');

  // CC Switch skills
  mkdirSync(join(CC_SWITCH_SKILLS, 'spec-first', 'init'), { recursive: true });
  writeFileSync(join(CC_SWITCH_SKILLS, 'spec-first', 'init', 'SKILL.md'), '# init');

  // Global settings with SessionStart hook
  writeFileSync(join(CLAUDE_HOME, 'settings.json'), JSON.stringify({
    hooks: {
      SessionStart: [
        {
          matcher: '*',
          hooks: [{
            type: 'command',
            command: "SPEC_FIRST_MANAGED_SESSION=1 SPEC_FIRST_BIN_FALLBACK='/tmp/sf' sh -c '\"$SPEC_FIRST_BIN_FALLBACK\" viewer open --print-url --background 2>/dev/null || true'",
          }],
        },
        { matcher: '*', hooks: [{ type: 'command', command: 'spec-first viewer open --print-url --background' }] },
        { matcher: '*', hooks: [{ type: 'command', command: "'/tmp/sf' viewer open --print-url --background >/dev/null 2>&1 || true", timeout: 15 }] },
        { matcher: '*', hooks: [{ type: 'command', command: 'other-tool viewer open --background' }] },
        { matcher: '*', hooks: [{ type: 'command', command: "'/tmp/other-tool' viewer open --print-url --background >/dev/null 2>&1 || true" }] },
        { matcher: '*', hooks: [{ type: 'command', command: 'other-tool viewer open --print-url --background' }] },
        { matcher: '*', hooks: [{ type: 'command', command: 'echo other-tool' }] },
      ],
    },
  }));

  // Project .claude/settings.json with AI hooks
  mkdirSync(join(PROJECT, '.claude'), { recursive: true });
  writeFileSync(join(PROJECT, '.claude', 'settings.json'), JSON.stringify({
    hooks: {
      PreToolUse: [{ matcher: 'write|edit', hooks: [{ type: 'command', command: 'npx spec-first gate check' }] }],
      PostToolUse: [{ matcher: 'write|edit', hooks: [{ type: 'command', command: 'npx spec-first docs validate' }] }],
      Stop: [{ hooks: [{ type: 'command', command: 'npx spec-first ai stats' }] }],
      SessionStart: [
        { matcher: '*', hooks: [{ type: 'command', command: "SPEC_FIRST_MANAGED_SESSION=1 '/tmp/sf' viewer open --print-url --background 2>/dev/null || true" }] },
        { matcher: '*', hooks: [{ type: 'command', command: 'echo project-other' }] },
      ],
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

  it('should reject --host without a value', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const code = handleUninstall(['--host']);
    expect(code).toBe(ExitCode.CONFIG_ERROR);
    expect(errSpy).toHaveBeenCalledWith(
      'uninstall 失败：参数错误：--host 需要一个目标值（claude|codex|gemini|cursor|generic|all）'
    );
  });

  it('should reject unknown host values', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const code = handleUninstall(['--host', 'gemni']);
    expect(code).toBe(ExitCode.CONFIG_ERROR);
    expect(errSpy).toHaveBeenCalledWith(
      'uninstall 失败：参数错误：未知 host "gemni"，可选值: claude|codex|gemini|cursor|generic|all'
    );
  });

  it('should not delete files in dry-run mode', () => {
    handleUninstall(['--dry-run']);
    expect(existsSync(join(SF_SKILLS, 'spec-first'))).toBe(true);
    expect(existsSync(join(CLAUDE_HOME, 'commands', 'spec-first'))).toBe(true);
    expect(existsSync(join(CODEX_SKILLS, 'spec-first'))).toBe(true);
    expect(existsSync(join(GEMINI_HOME, 'skills', 'spec-first'))).toBe(true);
    expect(existsSync(join(CURSOR_HOME, 'skills', 'spec-first'))).toBe(true);
    expect(existsSync(join(GENERIC_HOME, 'skills', 'spec-first'))).toBe(true);
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

  it('should remove gemini and cursor skills directories', () => {
    handleUninstall([]);
    expect(existsSync(join(GEMINI_HOME, 'skills', 'spec-first'))).toBe(false);
    expect(existsSync(join(CURSOR_HOME, 'skills', 'spec-first'))).toBe(false);
    expect(existsSync(join(GENERIC_HOME, 'skills', 'spec-first'))).toBe(false);
  });

  it('should only remove selected host artifacts when --host gemini,cursor is provided', () => {
    handleUninstall(['--host', 'gemini,cursor']);
    expect(existsSync(join(GEMINI_HOME, 'skills', 'spec-first'))).toBe(false);
    expect(existsSync(join(CURSOR_HOME, 'skills', 'spec-first'))).toBe(false);
    expect(existsSync(join(CLAUDE_HOME, 'commands', 'spec-first'))).toBe(true);
    expect(existsSync(join(CODEX_SKILLS, 'spec-first'))).toBe(true);
    expect(existsSync(join(GENERIC_HOME, 'skills', 'spec-first'))).toBe(true);
  });

  it('should keep shared skills cache and cc-switch skills when uninstall is scoped by --host', () => {
    handleUninstall(['--host', 'gemini,cursor']);
    expect(existsSync(join(SF_SKILLS, 'spec-first'))).toBe(true);
    expect(existsSync(join(CC_SWITCH_SKILLS, 'spec-first'))).toBe(true);
  });

  it('should remove generic skills directory when --host generic is provided', () => {
    handleUninstall(['--host', 'generic']);
    expect(existsSync(join(GENERIC_HOME, 'skills', 'spec-first'))).toBe(false);
    expect(existsSync(join(CLAUDE_HOME, 'commands', 'spec-first'))).toBe(true);
    expect(existsSync(join(CODEX_SKILLS, 'spec-first'))).toBe(true);
  });

  it('should treat --host all as full uninstall', () => {
    handleUninstall(['--host', 'all']);
    expect(existsSync(join(SF_SKILLS, 'spec-first'))).toBe(false);
    expect(existsSync(join(CC_SWITCH_SKILLS, 'spec-first'))).toBe(false);
    expect(existsSync(join(CLAUDE_HOME, 'commands', 'spec-first'))).toBe(false);
    expect(existsSync(join(CODEX_SKILLS, 'spec-first'))).toBe(false);
    expect(existsSync(join(GEMINI_HOME, 'skills', 'spec-first'))).toBe(false);
    expect(existsSync(join(CURSOR_HOME, 'skills', 'spec-first'))).toBe(false);
  });

  it('should keep claude session hook when selected hosts exclude claude', () => {
    handleUninstall(['--host', 'gemini,cursor']);
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings.hooks.SessionStart).toHaveLength(7);
  });

  it('should keep project-local hooks when uninstall is scoped by --host', () => {
    handleUninstall(['--host', 'gemini,cursor']);
    const settings = JSON.parse(readFileSync(join(PROJECT, '.claude', 'settings.json'), 'utf-8'));
    expect(settings.hooks.PreToolUse).toHaveLength(1);
    expect(settings.hooks.PreToolUse[0].hooks[0].command).toBe('npx spec-first gate check');
  });

  it('should remove claude session hook when selected hosts include claude', () => {
    handleUninstall(['--host', 'claude']);
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings.hooks.SessionStart).toHaveLength(4);
  });

  it('should remove spec-first SessionStart hook but keep others', () => {
    handleUninstall([]);
    const settings = JSON.parse(readFileSync(join(CLAUDE_HOME, 'settings.json'), 'utf-8'));
    expect(settings.hooks.SessionStart).toHaveLength(4);
    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe('other-tool viewer open --background');
    expect(settings.hooks.SessionStart[1].hooks[0].command).toBe("'/tmp/other-tool' viewer open --print-url --background >/dev/null 2>&1 || true");
    expect(settings.hooks.SessionStart[2].hooks[0].command).toBe('other-tool viewer open --print-url --background');
    expect(settings.hooks.SessionStart[3].hooks[0].command).toBe('echo other-tool');
  });

  it('should remove AI runtime hooks from project settings', () => {
    handleUninstall([]);
    const settings = JSON.parse(readFileSync(join(PROJECT, '.claude', 'settings.json'), 'utf-8'));
    expect(settings.hooks.PreToolUse).toBeUndefined();
    expect(settings.hooks.PostToolUse).toBeUndefined();
    expect(settings.hooks.Stop).toBeUndefined();
    expect(settings.hooks.SessionStart).toHaveLength(1);
    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe('echo project-other');
  });
});
