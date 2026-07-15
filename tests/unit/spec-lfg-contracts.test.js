'use strict';

const fs = require('node:fs');
const path = require('node:path');

const skill = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-lfg/SKILL.md'), 'utf8');

describe('spec-lfg current contracts', () => {
  test('owns plan completion after return-to-caller gates close', () => {
    expect(skill).toContain('plan_status_completion_candidate');
    expect(skill).toContain('internal plan-status complete');
    expect(skill).toContain('active → completed');
    expect(skill).toMatch(/after simplification, required review, residual handoff, and final verification/i);
    expect(skill).toContain('task pack');
    expect(skill).toContain('source_plan');
    expect(skill).toContain('plan_status_completion_degraded_reason');
    expect(skill).toContain('legacy-plan-lifecycle-degraded');
    expect(skill).toContain('html-plan-lifecycle-degraded');
    expect(skill).toMatch(/skip mutation.*preserve the verified development result/i);
    expect(skill).toContain('all in-scope U-IDs/tasks accounted for and completed');
    expect(skill).toContain('an empty blocker list');
    expect(skill).toMatch(/failed, not-run, missing, or indeterminate result blocks lifecycle mutation/i);
  });
});
