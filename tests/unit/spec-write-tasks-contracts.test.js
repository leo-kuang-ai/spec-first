'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const skill = fs.readFileSync(path.join(repoRoot, 'skills/spec-write-tasks/SKILL.md'), 'utf8');
const casesPath = path.join(repoRoot, 'skills/spec-write-tasks/evals/output-quality-cases.json');

describe('spec-write-tasks current contracts', () => {
  test('keeps the plan canonical and task packs derived', () => {
    expect(skill).toContain('Keep the plan as single source of truth');
    expect(skill).toContain('Task Pack Contract');
    expect(skill).toContain('tasks are derived and optional');
  });

  test('requires real CLI evidence before deterministic handoff claims', () => {
    expect(skill).toContain('run `spec-first tasks validate <task-pack-path> --json`');
    expect(skill).toContain('run `spec-first tasks hash <plan-path>`');
    expect(skill).toContain('before reporting `deterministic_handoff`');
  });

  test('high-risk review remains an authorized bounded handoff', () => {
    expect(skill).toContain('next_action: review-task-pack');
    expect(skill).toContain('dispatch_authorization: missing');
    expect(skill).toContain('Do not auto-dispatch review');
  });

  test('output-quality cases are parseable and reference current source', () => {
    const fixture = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
    expect(fixture.cases.length).toBeGreaterThan(0);
    for (const sourceRef of fixture.source_refs) {
      expect(fs.existsSync(path.join(repoRoot, sourceRef))).toBe(true);
    }
  });
});
