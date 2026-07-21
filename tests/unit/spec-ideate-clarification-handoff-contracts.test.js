'use strict';

const fs = require('node:fs');

const ideate = fs.readFileSync('skills/spec-ideate/SKILL.md', 'utf8');
const handoff = fs.readFileSync('skills/spec-ideate/references/post-ideation-workflow.md', 'utf8');
const universalIdeation = fs.readFileSync(
  'skills/spec-ideate/references/universal-ideation.md',
  'utf8',
);
const universalBrainstorm = fs.readFileSync(
  'skills/spec-brainstorm/references/universal-brainstorming.md',
  'utf8',
);

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

  test('lets brainstorm own an explicit universal plan handoff without creating an ideate shortcut', () => {
    expect(universalIdeation).toContain('not an automatic implementation chain');
    expect(universalIdeation).toContain('`spec-brainstorm` wrap-up');
    expect(universalIdeation).toContain('explicitly chooses **Create a plan**');
    expect(universalIdeation).toContain('universal/knowledge-work `spec-plan`');
    expect(universalIdeation).toContain('does not offer `spec-work`');
    expect(universalIdeation).not.toContain('there is no `spec-plan` → `spec-work` after');
    expect(universalBrainstorm).toContain('**Create a plan**');
    expect(universalBrainstorm).toContain('hand off to `spec-plan`');
  });
});
