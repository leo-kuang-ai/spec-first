'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

const brainstorm = read('skills/spec-brainstorm/SKILL.md');
const pressure = read('skills/spec-brainstorm/references/product-pressure-test.md');
const sections = read('skills/spec-brainstorm/references/brainstorm-sections.md');
const handoff = read('skills/spec-brainstorm/references/handoff.md');

describe('spec-brainstorm clarification, scenarios, and resume contract', () => {
  test('classifies load-bearing gaps without adding a persistent state table', () => {
    expect(brainstorm).toContain('source fact');
    expect(brainstorm).toContain('current-user decision');
    expect(brainstorm).toContain('open exploration');
    expect(brainstorm).toContain('planning-owned HOW');
    expect(brainstorm).toContain('source_attempt: not-applicable');
    expect(brainstorm).toContain('Product Contract write target');
    expect(brainstorm).toContain('not a persistent gap table');
  });

  test('runs a relevance-driven scenario pass with durable landing', () => {
    expect(pressure).toContain('role/permission');
    expect(pressure).toContain('state transition');
    expect(pressure).toContain('failure/degraded');
    expect(pressure).toContain('negative acceptance');
    expect(pressure).toContain('cross-context handoff');
    expect(pressure).toContain('Acceptance Example');
    expect(pressure).toContain('Resolve Before Planning / Outstanding Question');
    expect(pressure).toContain('explicit assumption');
    expect(pressure).toContain('Non-Goal');
    expect(pressure).toContain('Do not generate a Cartesian product');
  });

  test('persists source freshness and the next question for pause or resume', () => {
    expect(sections).toContain('source snapshot or observed version');
    expect(sections).toContain('limitation');
    expect(sections).toMatch(/invalidation\s+condition/);
    expect(sections).toContain('next highest-impact question');
    expect(handoff).toContain('next highest-impact question');
    expect(handoff).toContain('source refs, snapshots, limitations, and invalidation conditions');
    expect(brainstorm).toContain('`/tmp` dossier is unavailable');
  });

  test('keeps the current user as the sole product confirmer', () => {
    expect(brainstorm).toContain('current conversation user is the only human product confirmer');
    expect(brainstorm).toContain('one highest-impact independent product question at a time');
    expect(brainstorm).toContain('specialist material is evidence, not a second confirmation route');
  });
});
