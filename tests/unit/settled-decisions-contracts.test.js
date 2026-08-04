const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8');

describe('settled decision continuity', () => {
  const brainstormRef = read('skills/spec-brainstorm/references/settled-decisions.md');
  const planRef = read('skills/spec-plan/references/settled-decisions.md');
  const brainstorm = read('skills/spec-brainstorm/SKILL.md');
  const plan = read('skills/spec-plan/SKILL.md');
  const ideateHandoff = read('skills/spec-ideate/references/post-ideation-workflow.md');

  test('brainstorm and plan use one byte-identical settlement protocol', () => {
    expect(planRef).toBe(brainstormRef);
    expect(brainstormRef).toContain('session-settled:');
    expect(brainstormRef).toContain('user-directed');
    expect(brainstormRef).toContain('user-approved');
    expect(brainstormRef).toContain('No self-settling');
  });

  test('product and technical decisions retain distinct single owners', () => {
    expect(brainstorm).toMatch(/Key Decision entry is the single owner/is);
    expect(plan).toMatch(/Product decisions remain owned by the Product Contract/is);
    expect(plan).toMatch(/implementation decisions are owned once.*Key Technical Decisions/is);
  });

  test('ideate passes only user-examined choices and does not mint settlement', () => {
    expect(ideateHandoff).toContain('transient settled-decision brief entry');
    expect(ideateHandoff).toContain('Do not label an agent-ranked idea as settled');
    expect(ideateHandoff).toMatch(/spec-brainstorm.*single durable owner/is);
  });
});
