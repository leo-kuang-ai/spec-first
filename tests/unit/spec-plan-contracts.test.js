'use strict';

const fs = require('node:fs');
const path = require('node:path');

const skill = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-plan/SKILL.md'), 'utf8');

describe('spec-plan current contracts', () => {
  test('enriches requirements-only unified plans in place', () => {
    expect(skill).toContain('planning should enrich it in place');
    expect(skill).toContain('artifact_readiness: implementation-ready');
    expect(skill).toContain('execution: code');
  });

  test('consumes legacy brainstorm requirements without migration', () => {
    expect(skill).toContain('docs/brainstorms/*-requirements.{md,html}');
    expect(skill).toContain('These remain readable historical inputs; do not migrate or rewrite them.');
    expect(skill).toContain('create a new unified plan in `docs/plans/`');
  });

  test('keeps execution and progress ownership in spec-work', () => {
    expect(skill).toContain('Plans do not carry per-unit progress state');
    expect(skill).toContain('Start `/spec-work`');
    expect(skill).toContain('`spec-work` owns engine selection and the tail');
  });
});
