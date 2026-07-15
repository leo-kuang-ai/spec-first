'use strict';

const fs = require('node:fs');
const path = require('node:path');

const skill = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-work/SKILL.md'), 'utf8');
const shipping = fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-work/references/shipping-workflow.md'),
  'utf8',
);
const engines = fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-work/references/execution-engines.md'),
  'utf8',
);

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

  test('allows status mutation only at shipping closeout and assigns the correct source owner', () => {
    expect(skill).toContain('shipping closeout');
    expect(skill).toMatch(/leaf workers, reviewers, and subagents never mutate plan status/i);
    expect(shipping).toContain('Final Validation, required review, and Residual Work Gate');
    expect(shipping).toContain('internal plan-status complete');
    expect(shipping).toContain('task pack');
    expect(shipping).toContain('source_plan');
    expect(shipping).toContain('Return-to-Caller');
    expect(shipping).toContain('plan_status_completion_candidate');
    expect(skill).toContain('plan_status_completion_degraded_reason');
    expect(shipping).toContain('legacy-plan-lifecycle-degraded');
    expect(shipping).toContain('html-plan-lifecycle-degraded');
    expect(shipping).toContain('do not invalidate development completion');
    expect(shipping).toContain('artifact_contract: spec-unified-plan/v1');
    expect(shipping).toContain('type: feat | fix | refactor');
  });

  test('requires scope, blockers, and verification to close before return-to-caller completion', () => {
    expect(skill).toContain('every in-scope unit/task is accounted for and completed');
    expect(skill).toContain('`blockers` is empty');
    expect(skill).toContain('Failed, not-run, vague, or missing required verification cannot return complete');
  });

  test('keeps goal terminal completion behind the same closeout owner', () => {
    expect(engines).toContain('before terminal goal completion');
    expect(engines).toContain('active → completed');
    expect(engines).toContain('Return-to-Caller');
  });
});
