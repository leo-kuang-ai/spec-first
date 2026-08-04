'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  deriveInstructionContents,
  normalizeGraphifySection,
} = require('../../scripts/sync-instruction-files.js');
const {
  renderGraphifyInstructionSection,
} = require('../../skills/spec-runtime-setup/scripts/providers/graphify.cjs');

const REPO_ROOT = path.join(__dirname, '..', '..');

function fixture(title, graphifyBody) {
  return [
    `${title}\n`,
    '<!-- spec-first:lang:start -->\n',
    'managed host content\n',
    '<!-- spec-first:lang:end -->\n',
    '\n## graphify\n\n',
    `${graphifyBody}\n`,
  ].join('');
}

describe('sync-instruction-files Graphify contract', () => {
  test('normalizes the Graphify section from the canonical host renderer', () => {
    const normalized = normalizeGraphifySection(fixture('# AGENTS.md', 'stale .graphify/'), 'codex');

    expect(normalized).toContain(`${renderGraphifyInstructionSection('codex')}\n`);
    expect(normalized).not.toContain('stale .graphify/');
  });

  test('derives both checked-in host entry files without treating AGENTS.md as source', () => {
    const claude = fixture(
      '# CLAUDE.md',
      'stale claude graphify section',
    ).replace(
      '# CLAUDE.md\n',
      '# CLAUDE.md\n本文件为 Claude Code 在本仓库工作时提供项目级执行指引。\n',
    );
    const agents = fixture('# Repository Guidelines', 'stale agents graphify section');

    const derived = deriveInstructionContents(claude, agents);

    expect(derived.claude).toContain(`${renderGraphifyInstructionSection('claude')}\n`);
    expect(derived.agents).toContain(`${renderGraphifyInstructionSection('codex')}\n`);
    expect(derived.agents).toContain('本文件为 Codex 和其他 AI agent 在本仓库工作时提供项目级执行指引。');
    expect(derived.agents).not.toContain('stale agents graphify section');
  });

  test('checked-in CLAUDE.md and AGENTS.md equal their generated expectations', () => {
    const claude = fs.readFileSync(path.join(REPO_ROOT, 'CLAUDE.md'), 'utf8');
    const agents = fs.readFileSync(path.join(REPO_ROOT, 'AGENTS.md'), 'utf8');
    const derived = deriveInstructionContents(claude, agents);

    expect(claude).toBe(derived.claude);
    expect(agents).toBe(derived.agents);
  });
});
