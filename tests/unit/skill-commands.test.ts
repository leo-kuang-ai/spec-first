import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, lstatSync, mkdirSync, readFileSync, readlinkSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureSkillCommands } from '../../src/shared/skill-commands.js';

const TMP = join(import.meta.dirname, '../../tests/fixtures/.tmp-skill-commands');

const ENV_KEYS = [
  'CODEX_SKILLS_DIR',
  'CLAUDE_COMMANDS_DIR',
  'CLAUDE_SKILLS_DIR',
  'CLAUDE_CODE_CONFIG_DIR',
];

const envBackup: Record<string, string | undefined> = {};

beforeEach(() => {
  mkdirSync(TMP, { recursive: true });
  for (const key of ENV_KEYS) {
    envBackup[key] = process.env[key];
  }
  process.env.CODEX_SKILLS_DIR = join(TMP, 'codex-skills');
  process.env.CLAUDE_COMMANDS_DIR = join(TMP, 'claude-commands');
  process.env.CLAUDE_SKILLS_DIR = join(TMP, 'claude-skills');
  process.env.CLAUDE_CODE_CONFIG_DIR = join(TMP, 'claude-code-config');
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = envBackup[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  rmSync(TMP, { recursive: true, force: true });
});

describe('ensureSkillCommands', () => {
  it('should recreate broken codex symlink in global mode', () => {
    const first = ensureSkillCommands(TMP, { global: true });
    expect(first.codex.length).toBeGreaterThan(0);

    const commandName = first.codex[0];
    const skillName = commandName.split(':')[1];
    const target = join(process.env.CODEX_SKILLS_DIR as string, 'spec-first', skillName);
    expect(existsSync(target)).toBe(true);

    unlinkSync(target);
    symlinkSync(join(TMP, 'missing-target'), target);
    const brokenLinkTarget = readlinkSync(target);
    expect(brokenLinkTarget).toContain('missing-target');

    const second = ensureSkillCommands(TMP, { global: true });
    expect(second.codex).toContain(commandName);
    expect(lstatSync(target).isSymbolicLink()).toBe(true);
    const repairedLinkTarget = readlinkSync(target);
    expect(repairedLinkTarget).not.toContain('missing-target');
  });

  it('should write safe Claude frontmatter descriptions', () => {
    const result = ensureSkillCommands(TMP, { global: true });
    expect(result.claude).toContain('spec-first:doctor');

    const doctorCommand = join(process.env.CLAUDE_COMMANDS_DIR as string, 'spec-first', 'doctor.md');
    expect(existsSync(doctorCommand)).toBe(true);
    const content = readFileSync(doctorCommand, 'utf-8');
    expect(content).toContain('description: "定位项目与宿主配置并执行环境诊断"');
    expect(content).not.toContain('(`Codex` + `Claude`)');
  });

  it('should cleanup legacy flat command aliases', () => {
    const legacyClaude = join(process.env.CLAUDE_COMMANDS_DIR as string, 'spec-first-init.md');
    const legacyCodex = join(process.env.CODEX_SKILLS_DIR as string, 'spec-first-init');
    mkdirSync(process.env.CLAUDE_COMMANDS_DIR as string, { recursive: true });
    mkdirSync(process.env.CODEX_SKILLS_DIR as string, { recursive: true });
    writeFileSync(legacyClaude, 'legacy', 'utf-8');
    mkdirSync(legacyCodex, { recursive: true });

    ensureSkillCommands(TMP, { global: true });

    expect(existsSync(legacyClaude)).toBe(false);
    expect(existsSync(legacyCodex)).toBe(false);
  });

  it('should replace non-symlink codex skill directory with symlink', () => {
    ensureSkillCommands(TMP, { global: true });
    const skillName = 'doctor';
    const target = join(process.env.CODEX_SKILLS_DIR as string, 'spec-first', skillName);
    const src = readlinkSync(target);

    unlinkSync(target);
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, 'SKILL.md'), '# stale', 'utf-8');

    ensureSkillCommands(TMP, { global: true });
    expect(lstatSync(target).isSymbolicLink()).toBe(true);
    expect(readlinkSync(target)).toBe(src);
  });
});
