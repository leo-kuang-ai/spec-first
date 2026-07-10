'use strict';

const fs = require('node:fs');
const path = require('node:path');

const skill = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-work/SKILL.md'), 'utf8');

describe('spec-work current contracts', () => {
  test('gates execution on implementation-ready code plans', () => {
    expect(skill).toContain('artifact_readiness: implementation-ready');
    expect(skill).toContain('execution: code');
  });

  test('tracks execution outside the plan body', () => {
    expect(skill).toMatch(/do not (?:edit|mutate).*plan/i);
    expect(skill).toMatch(/progress.*git/i);
  });

  test('keeps review report-only and caller-owned fixes explicit', () => {
    expect(skill).toContain('spec-code-review');
    expect(skill).toContain('mode:agent');
    expect(skill).toContain('`spec-code-review` is review-only');
    expect(skill).toContain('**Apply fixes**');
    expect(skill).toContain('The orchestrator merges diffs, runs tests, and commits');
  });
});
