'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('spec-brainstorm unified plan producer contract', () => {
  test('writes active lifecycle metadata only for Markdown software unified plans', () => {
    const skill = read('skills/spec-brainstorm/SKILL.md');
    const sections = read('skills/spec-brainstorm/references/brainstorm-sections.md');

    expect(skill).toContain('execution: code');
    expect(skill).toContain('status: active');
    expect(skill).toMatch(/only when `OUTPUT_FORMAT=md`/i);
    expect(sections).toContain('artifact_contract: spec-unified-plan/v1');
    expect(sections).toContain('artifact_readiness: requirements-only');
    expect(sections).toContain('execution: code');
    expect(sections).toContain('Markdown software unified plan');
    expect(sections).toContain('status: active');
  });

  test('keeps readiness orthogonal to lifecycle and excludes non-applicable outputs', () => {
    const sections = read('skills/spec-brainstorm/references/brainstorm-sections.md');

    expect(sections).toMatch(/Do not use `active`, `in_progress`, `completed`,\s+or `done`/);
    expect(sections).toMatch(/document\s+completeness, not lifecycle progress/);
    expect(sections).toContain('HTML output does not carry `status`');
    expect(sections).toMatch(/universal-brainstorming route does\s+not carry `status`/);
  });
});
