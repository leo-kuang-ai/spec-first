'use strict';

const fs = require('node:fs');

const ideate = fs.readFileSync('skills/spec-ideate/SKILL.md', 'utf8');
const handoff = fs.readFileSync('skills/spec-ideate/references/post-ideation-workflow.md', 'utf8');

describe('spec-ideate focused clarification handoff', () => {
  test('keeps the seed focused while carrying snapshot and limitations', () => {
    expect(handoff).toContain('Source snapshot:');
    expect(handoff).toContain('Evidence limitations:');
    expect(handoff).toContain('Unverified assumptions:');
    expect(handoff).toContain('Relevant rejected alternative:');
    expect(handoff).toContain('dirty/unknown');
    expect(handoff).toContain('stale');
    expect(handoff).toContain('one directly adjacent rejected alternative');
    expect(handoff).toContain('Do **not** pass the whole file');
    expect(handoff).not.toContain('complete rejection table in the seed');
  });

  test('keeps ideation out of requirements and planning', () => {
    expect(ideate).toContain('does **not** produce requirements, plans, or code');
    expect(ideate).toContain('Do not skip to planning from ideation output');
    expect(handoff).toContain('do **not** skip brainstorming and go straight to `spec-plan`');
    expect(handoff).toContain('Do not include implementation HOW or start any browser helper from the seed');
  });
});
