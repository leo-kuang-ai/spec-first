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

    expect(agent).toContain('Before going online, check if curated knowledge already exists in skills');
    expect(agent).toContain('If the current environment provides an `AGENTS.md` skill inventory');
    expect(agent).toContain('Documentation → available durable-learning, documentation, or writing guidance');
    expect(agent).toContain('File operations → available file-operation or worktree guidance');
    expect(agent).toContain('Context7 MCP');
    expect(agent).toContain('`ctx7` CLI');
    expect(agent).not.toContain('andrew-kane-gem-writer');
    expect(agent).not.toContain('dspy-ruby');
    expect(agent).not.toContain('every-style-editor');
    expect(agent).not.toContain('rclone');
    expect(agent).not.toContain('ce-best-practices-researcher');
  });
});
