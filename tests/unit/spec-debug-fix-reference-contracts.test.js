'use strict';

const fs = require('node:fs');

const read = (file) => fs.readFileSync(file, 'utf8');

describe('spec-debug fix reference contract', () => {
  test('entry keeps the trigger while fix reference owns test-first mechanics', () => {
    const skill = read('skills/spec-debug/SKILL.md');
    const fix = read('skills/spec-debug/references/fix.md');
    expect(skill).toContain('Read `references/fix.md` before writing Phase 2');
    expect(skill).toMatch(/regression starts from existing tests/i);
    expect(skill).toMatch(/deliberately reversed expectation/i);
    expect(skill).not.toContain('Inspect existing tests for the affected behavior before adding coverage.');
    expect(fix).toContain('Inspect existing tests for the affected behavior before adding coverage.');
    expect(fix).toContain('confirmed defect');
    expect(fix).toContain('Three failed fix attempts trigger smart escalation');
  });
});
