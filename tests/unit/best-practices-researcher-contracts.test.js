'use strict';

const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..', '..');
const AGENT_PATH = path.join(
  REPO_ROOT,
  'skills/spec-plan/references/agents/best-practices-researcher.md',
);

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('best-practices-researcher contracts', () => {
  test('source agent keeps curated skill discovery aligned with current skills and source attribution explicit', () => {
    const agent = read(AGENT_PATH);

    expect(agent).toContain('Documentation → `spec-compound`');
    expect(agent).toContain('File operations → `spec-worktree`');
    expect(agent).toContain('current project/workspace skill directories');
    expect(agent).toContain('Treat `.codex/skills/` and `~/.codex/skills/` as legacy cleanup signals only');
    expect(agent).not.toContain('project/workspace skill directories in `.claude/skills/**/SKILL.md`, `.codex/skills/**/SKILL.md`');
    expect(agent).not.toContain('user/home skill directories in `~/.claude/skills/**/SKILL.md`, `~/.codex/skills/**/SKILL.md`');
    expect(agent).not.toContain('andrew-kane-gem-writer');
    expect(agent).not.toContain('dspy-ruby');
    expect(agent).not.toContain('every-style-editor');
    expect(agent).not.toContain('rclone');
    expect(agent).not.toContain('The relevant skill recommends...');
  });
});
