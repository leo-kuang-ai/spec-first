import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleUpdate } from '../../src/cli/commands/update.js';
import { handleDoctor } from '../../src/cli/commands/doctor.js';

const TMP = join(import.meta.dirname, '../fixtures/.tmp-update-doctor-baseline');
const originalCwd = process.cwd;
const originalEnv = {
  HOME: process.env.HOME,
  AGENTS_HOME: process.env.AGENTS_HOME,
  CODEX_HOME: process.env.CODEX_HOME,
  CODEX_SKILLS_DIR: process.env.CODEX_SKILLS_DIR,
  SPEC_FIRST_SKILLS_DIR: process.env.SPEC_FIRST_SKILLS_DIR,
  CLAUDE_HOME: process.env.CLAUDE_HOME,
  CLAUDE_SKILLS_DIR: process.env.CLAUDE_SKILLS_DIR,
  CLAUDE_COMMANDS_DIR: process.env.CLAUDE_COMMANDS_DIR,
  CLAUDE_CODE_CONFIG_DIR: process.env.CLAUDE_CODE_CONFIG_DIR,
  CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR,
  GEMINI_HOME: process.env.GEMINI_HOME,
  GEMINI_CONFIG_DIR: process.env.GEMINI_CONFIG_DIR,
  CURSOR_HOME: process.env.CURSOR_HOME,
  CURSOR_CONFIG_DIR: process.env.CURSOR_CONFIG_DIR,
  VITEST: process.env.VITEST,
  NODE_ENV: process.env.NODE_ENV,
};

beforeEach(() => {
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(join(TMP, 'specs'), { recursive: true });
  mkdirSync(join(TMP, 'agents-home', 'skills', 'find-skills'), { recursive: true });
  mkdirSync(join(TMP, 'agents-home', 'skills', 'skill-creator'), { recursive: true });
  writeFileSync(join(TMP, 'agents-home', 'skills', 'find-skills', 'SKILL.md'), '# find-skills\n', 'utf-8');
  writeFileSync(join(TMP, 'agents-home', 'skills', 'skill-creator', 'SKILL.md'), '# skill-creator\n', 'utf-8');

  process.env.HOME = join(TMP, 'home');
  process.env.AGENTS_HOME = join(TMP, 'agents-home');
  process.env.CODEX_HOME = join(TMP, 'home', '.codex');
  process.env.CODEX_SKILLS_DIR = join(TMP, 'home', '.codex', 'skills');
  process.env.SPEC_FIRST_SKILLS_DIR = join(TMP, 'home', '.spec-first', 'skills');
  process.env.CLAUDE_HOME = join(TMP, 'home', '.claude');
  process.env.CLAUDE_SKILLS_DIR = join(TMP, 'home', '.claude', 'skills');
  process.env.CLAUDE_COMMANDS_DIR = join(TMP, 'home', '.claude', 'commands');
  process.env.CLAUDE_CODE_CONFIG_DIR = join(TMP, 'home', '.config', 'claude-code');
  process.env.CLAUDE_CONFIG_DIR = join(TMP, 'home', '.config', 'claude-code');
  process.env.GEMINI_HOME = join(TMP, 'home', '.gemini');
  process.env.GEMINI_CONFIG_DIR = join(TMP, 'home', '.gemini', 'config');
  process.env.CURSOR_HOME = join(TMP, 'home', '.cursor');
  process.env.CURSOR_CONFIG_DIR = join(TMP, 'home', '.cursor', 'config');
  delete process.env.VITEST;
  process.env.NODE_ENV = 'development';
  process.cwd = () => TMP;
});

afterEach(() => {
  process.cwd = originalCwd;
  rmSync(TMP, { recursive: true, force: true });
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('update and doctor baseline integration', () => {
  it('should keep update and doctor aligned on baseline capabilities', async () => {
    const updateCode = await handleUpdate([]);
    expect(updateCode).toBe(0);

    expect(existsSync(join(TMP, 'home', '.codex', 'config.toml'))).toBe(true);
    expect(existsSync(join(TMP, 'home', '.claude', 'settings.json'))).toBe(true);

    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map((arg) => String(arg)).join(' '));
    };

    let doctorCode = 1;
    try {
      doctorCode = handleDoctor([]);
    } finally {
      console.log = originalLog;
    }

    expect(doctorCode).toBe(0);
    const output = lines.join('\n');
    expect(output).toContain('Host Capability:claude');
    expect(output).toContain('Tool Policy:claude:external-research');
    expect(output).toContain('fetch, context7');
    expect(output).toContain('Tool Policy:codex:browser-verification');

    const claudeSettings = readFileSync(join(TMP, 'home', '.claude', 'settings.json'), 'utf-8');
    expect(claudeSettings).toContain('viewer open');
    expect(claudeSettings).toContain('1%规则');
  });

  it('should install spec-first skills into gemini and cursor homes when explicitly targeted', async () => {
    const updateCode = await handleUpdate(['--host', 'gemini,cursor', '--skip-mcp', '--skip-hooks']);
    expect(updateCode).toBe(0);

    expect(existsSync(join(TMP, 'home', '.gemini', 'skills', 'doctor', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(TMP, 'home', '.cursor', 'skills', 'doctor', 'SKILL.md'))).toBe(true);

    const geminiSkill = readFileSync(
      join(TMP, 'home', '.gemini', 'skills', 'doctor', 'SKILL.md'),
      'utf-8',
    );
    const cursorSkill = readFileSync(
      join(TMP, 'home', '.cursor', 'skills', 'doctor', 'SKILL.md'),
      'utf-8',
    );
    expect(geminiSkill).toContain('# Skill: doctor');
    expect(cursorSkill).toContain('# Skill: doctor');
    expect(geminiSkill).toContain('诊断项目环境与宿主配置');
    expect(cursorSkill).toContain('诊断项目环境与宿主配置');
    expect(existsSync(join(TMP, 'home', '.claude', 'settings.json'))).toBe(false);
  });

  it('should limit bootstrap MCP writes to selected gemini and cursor hosts', async () => {
    const updateCode = await handleUpdate(['--host', 'gemini,cursor', '--skip-hooks']);
    expect(updateCode).toBe(0);

    expect(existsSync(join(TMP, 'home', '.gemini', 'settings.json'))).toBe(true);
    expect(existsSync(join(TMP, 'home', '.cursor', 'mcp.json'))).toBe(true);
    expect(existsSync(join(TMP, 'home', '.codex', 'config.toml'))).toBe(false);
    expect(existsSync(join(TMP, 'home', '.config', 'claude-code', 'mcp.json'))).toBe(false);
    expect(existsSync(join(TMP, 'home', '.claude', 'settings.json'))).toBe(false);
  });

  it('should only install viewer session hook when component=viewer', async () => {
    const updateCode = await handleUpdate(['--component', 'viewer']);
    expect(updateCode).toBe(0);

    const claudeSettings = readFileSync(join(TMP, 'home', '.claude', 'settings.json'), 'utf-8');
    expect(claudeSettings).toContain('viewer open');
    expect(existsSync(join(TMP, '.git', 'hooks'))).toBe(false);
    expect(existsSync(join(TMP, '.claude', 'settings.json'))).toBe(true);
  });

  it('should only install hooks when component=hooks', async () => {
    mkdirSync(join(TMP, '.git', 'hooks'), { recursive: true });

    const updateCode = await handleUpdate(['--component', 'hooks']);
    expect(updateCode).toBe(0);

    const projectSettings = readFileSync(join(TMP, '.claude', 'settings.json'), 'utf-8');
    expect(projectSettings).toContain('npx spec-first gate check');
    expect(existsSync(join(TMP, 'home', '.claude', 'settings.json'))).toBe(false);
    expect(existsSync(join(TMP, '.git', 'hooks', 'pre-commit'))).toBe(true);
  });
});
