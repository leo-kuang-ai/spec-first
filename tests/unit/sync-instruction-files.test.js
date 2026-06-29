'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  LANG_START,
  HOST_RULES,
  deriveAgentsContent,
} = require('../../scripts/sync-instruction-files');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CLAUDE_PATH = path.join(REPO_ROOT, 'CLAUDE.md');
const AGENTS_PATH = path.join(REPO_ROOT, 'AGENTS.md');

const FAKE_MANAGED = `${LANG_START}\nmanaged body\n<!-- spec-first:lang:end -->\n`;

function fakeClaude(managed = FAKE_MANAGED) {
  return [
    '# CLAUDE.md',
    '',
    '本文件为 Claude Code 在本仓库工作时提供项目级执行指引。它不是完整角色契约。',
    '',
    'substantial work 前先判断。完整入口策略由 skills 维护。',
    '',
    managed,
  ].join('\n');
}

describe('sync-instruction-files derive', () => {
  test('applies all required host rules', () => {
    const claudeManaged = FAKE_MANAGED;
    // AGENTS managed 区故意不同,验证派生保留 AGENTS 自己的 managed 区
    const agentsManaged = `${LANG_START}\ncodex managed body\n<!-- spec-first:lang:end -->\n`;
    const derived = deriveAgentsContent(fakeClaude(claudeManaged), fakeClaude(agentsManaged));

    expect(derived).toContain('# Repository Guidelines');
    expect(derived).not.toContain('# CLAUDE.md');
    expect(derived).toContain('本文件为 Codex 和其他 AI agent 在本仓库工作时提供项目级执行指引。');
    expect(derived).not.toContain('本文件为 Claude Code 在本仓库工作时提供项目级执行指引。');
    expect(derived).toContain('从 CLAUDE.md 自动派生');
  });

  test('preserves AGENTS managed region verbatim, never CLAUDE managed region', () => {
    const claudeManaged = `${LANG_START}\nCLAUDE managed body\n<!-- spec-first:lang:end -->\n`;
    const agentsManaged = `${LANG_START}\nCODEX managed body\n<!-- spec-first:lang:end -->\n`;
    const derived = deriveAgentsContent(fakeClaude(claudeManaged), fakeClaude(agentsManaged));

    expect(derived).toContain('CODEX managed body');
    expect(derived).not.toContain('CLAUDE managed body');
    expect(derived.endsWith(agentsManaged)).toBe(true);
  });

  test('fails loud when a host rule source string drifts', () => {
    const driftedClaude = fakeClaude().replace(
      '本文件为 Claude Code 在本仓库工作时提供项目级执行指引。',
      '本文件为 Claude 在本仓库提供指引。',
    );
    expect(() => deriveAgentsContent(driftedClaude, fakeClaude())).toThrow(/role-intro/);
  });

  test('fails loud when managed marker is missing', () => {
    const noMarker = '# CLAUDE.md\n\n本文件为 Claude Code 在本仓库工作时提供项目级执行指引。\n';
    expect(() => deriveAgentsContent(noMarker, fakeClaude())).toThrow(/缺少 managed 标记/);
  });

  test('all host rules are required and present in real CLAUDE.md', () => {
    const claudeContent = fs.readFileSync(CLAUDE_PATH, 'utf8');
    const handwritten = claudeContent.slice(0, claudeContent.indexOf(LANG_START));
    for (const rule of HOST_RULES) {
      expect(handwritten.includes(rule.from)).toBe(true);
    }
  });
});

describe('sync-instruction-files repo state', () => {
  test('AGENTS.md on disk matches CLAUDE.md derivation', () => {
    const claudeContent = fs.readFileSync(CLAUDE_PATH, 'utf8');
    const agentsContent = fs.readFileSync(AGENTS_PATH, 'utf8');
    expect(deriveAgentsContent(claudeContent, agentsContent)).toBe(agentsContent);
  });
});
