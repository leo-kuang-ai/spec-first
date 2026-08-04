'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const consumers = [
  'spec-brainstorm',
  'spec-code-review',
  'spec-compound',
  'spec-compound-refresh',
  'spec-debug',
  'spec-dogfood',
  'spec-ideate',
  'spec-optimize',
  'spec-plan',
  'spec-prd',
  'spec-work',
];

describe('host-neutral Skill invocation arguments', () => {
  test.each(consumers)('%s does not depend on a host-specific argument variable', (skill) => {
    const source = fs.readFileSync(path.join(repoRoot, 'skills', skill, 'SKILL.md'), 'utf8');
    expect(source).not.toContain('$ARGUMENTS');
    expect(source).toMatch(/invocation arguments/i);
  });

  test('token parsers preserve quoted and platform-specific input shapes', () => {
    for (const skill of ['spec-code-review', 'spec-compound', 'spec-compound-refresh', 'spec-dogfood']) {
      const source = fs.readFileSync(path.join(repoRoot, 'skills', skill, 'SKILL.md'), 'utf8');
      expect(source).toMatch(/preserv(?:e|ing).*quoted|quoted paths\/tokens/i);
    }
    const review = fs.readFileSync(path.join(repoRoot, 'skills/spec-code-review/SKILL.md'), 'utf8');
    expect(review).toContain('Windows drive paths');
    expect(review).toContain('URLs');
  });
});
