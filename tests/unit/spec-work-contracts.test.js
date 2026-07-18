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

  test('accepts validated task packs while keeping the source plan authoritative', () => {
    expect(skill).toContain('type: task-pack');
    expect(skill).toContain('work-intake-and-task-pack.md');
    expect(skill).toContain('Task Pack Contract');
    expect(skill).toContain('source plan remains authoritative');
    expect(skill).toContain('task pack stays `status: derived`');
  });

  test('fails closed on duplicate, missing, or conflicting unified metadata', () => {
    expect(skill).toMatch(/declared unified artifact.*duplicate.*critical metadata/is);
    expect(skill).toMatch(/missing.*artifact_readiness.*execution/is);
    expect(skill).toMatch(/conflict.*visible HTML metadata.*content shape/is);
    expect(skill).toMatch(/fail closed.*spec-plan.*repair/is);
    expect(skill).toMatch(/do not normalize.*guess/is);
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
    expect(skill).toMatch(/orchestrator integrates and tests/i);
    expect(skill).toContain('Commit only with `commit_authorization: authorized`');
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
    expect(skill).toContain('Failed, degraded, not-run, vague, or missing required verification/review cannot return complete');
  });

  test('keeps goal terminal completion behind the same closeout owner', () => {
    expect(engines).toContain('before terminal goal completion');
    expect(engines).toContain('active → completed');
    expect(engines).toContain('Return-to-Caller');
  });

  test('shipping performs report-only plan review with before/after hash and P0/P1 disposition', () => {
    expect(shipping).toContain('Source Plan Semantic Review (before Final Validation)');
    expect(shipping).toContain('node "$SKILL_DIR/scripts/source-plan-file-hash.cjs" "<source-plan>"');
    expect(shipping).toMatch(/当前已加载的 `spec-work\/SKILL\.md` 所在目录解析 `SKILL_DIR`/);
    expect(shipping).toMatch(/不得从 project cwd.*source checkout 路径定位 bundled helper/is);
    expect(shipping).not.toContain('spec-first tasks hash <source-plan> --repo <artifact-root> --json');
    expect(shipping).toContain('spec-doc-review mode:headless mutation:report-only output:json <source-plan>');
    expect(shipping).toContain('doc-review-json-invalid');
    expect(shipping).toContain('plan-changed-during-review');
    expect(shipping).toMatch(/P0\/P1.*阻断 Final Validation/is);
    expect(shipping).toContain('fixes_applied: 0');
    expect(shipping).toMatch(/recompose.*source-plan\/task-pack intake/is);
    expect(shipping).toMatch(/重新生成或验证 task pack.*semantic-fit/is);
    expect(shipping).toMatch(/重跑受影响的实现验证与 code review/is);
    expect(shipping).toMatch(/不得 patch hash.*签名\/DACL\/sealed pipeline/is);
  });
});
