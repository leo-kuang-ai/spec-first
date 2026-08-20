'use strict';

const fs = require('node:fs');

function read(file) { return fs.readFileSync(file, 'utf8'); }

const OLD_PLAN = 'docs/plans/2026-08-19-002-refactor-ce-post-3-20-skill-sync-scope-clarification.md';
const CURRENT_PLAN = 'docs/plans/2026-08-19-003-refactor-ce-post-3-20-full-window-sync-plan.md';
const CORRECTIVE_PLAN = 'docs/plans/2026-08-20-001-fix-ce-full-window-review-findings.md';

describe('CE post-3.20 calibration boundaries', () => {
  test('canonical plan keeps reconciliation enums, evidence schema, and host claims executable', () => {
    const plan = read(CURRENT_PLAN);
    expect(plan).not.toContain('`compose-equivalent`');
    expect(plan).toContain('ce-upstream-adjudication/v1');
    expect(plan).toContain('ce-upstream-adjudication-input/v1');
    expect(plan).toContain('adjudication-input.json');
    expect(plan).toContain('path+upstream+target-source');
    expect(plan).toContain('target_source_snapshot');
    expect(plan).toContain('`target_action`');
    expect(plan).toContain('`evidence_status`');
    expect(plan).toContain('`closure_profile`');
    expect(plan).toContain('`implementation_targets[]`');
    expect(plan).toContain('`source_refs[]`');
    expect(plan).toContain('`test_refs[]`');
    expect(plan).toContain('`limitations[]`');
    expect(plan).toContain('517/517');
    expect(plan).toContain('generated-runtime-preview');
    expect(plan).toContain('evidence-exceptions.json');
    expect(plan).toContain('would-change');
    expect(plan).toContain('apply-failed');
    expect(plan).toContain('not-run');
  });

  test('path/package/unit tables expose explicit ownership and one synchronized progress field', () => {
    const plan = read(CURRENT_PLAN);
    expect(plan).toContain('| P | CE package / surface | changed (+/-) | canonical_owner | implementation_unit | implementation_targets[] | target_action | closure_profile | 开发进展 |');
    expect(plan).toContain('| Status | Path or rename pair | Group | package_id | Surface | Role | closure_profile | canonical_owner | implementation_unit | implementation_targets[] |');
    expect(plan).toContain('| U-ID | Title | Primary source/test surfaces | 开发进展 | Depends on |');
    expect(plan).toContain('| 波次 | 单元 | 开始条件 | 开发进展 | 完成条件 |');
    expect(plan).toContain('`开发进展`只由 owner unit 提议');
    expect(plan).toContain('P01 | ce-babysit-pr');
    expect(plan).toContain('product-excluded');
    expect(plan).toContain('| U0 | Freeze adjudication, target snapshot and v2 baseline');
    expect(plan).toContain('| U2a | Close mutation, worker and worktree safety');
    expect(plan).toContain('| U2b | Close shipping, handoff and feedback consumers');
    expect(plan).toContain('| U5a | Close knowledge and quality owners');
    expect(plan).toContain('| U5b | Close signal and output owners');
    expect(plan).toContain('| U5c | Close QA adapters');
    expect(plan).toContain('| U8 | Merge ledger/evidence patches as single writer');
    expect(plan).toContain('| W3 单写者聚合 | U8 |');
  });

  test('the plan has a 517-row explicit path ledger and no rollback design', () => {
    const plan = read(CURRENT_PLAN);
    const header = '| Status | Path or rename pair | Group | package_id | Surface | Role | closure_profile | canonical_owner | implementation_unit | implementation_targets[] | target_action | evidence_status | degraded | source_refs[] | test_owner | test_refs[] | limitations[] |';
    const start = plan.indexOf(header);
    const end = plan.indexOf('\n## Implementation Units', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const rows = plan.slice(start, end).split('\n').filter((line) => /^\| (?:M|A|D|R\d{3}) \|/.test(line));
    expect(rows).toHaveLength(517);
    expect(plan).not.toMatch(/rollback|revert|reversible|回滚|撤销|可撤销/i);
    expect(plan).toContain('failed source change keeps its owning unit incomplete');
  });

  test('003 is completed and 002 is preserved as superseded history', () => {
    const oldPlan = read(OLD_PLAN);
    const currentPlan = read(CURRENT_PLAN);
    expect(oldPlan).toMatch(/^status: superseded$/m);
    expect(oldPlan).toContain(`superseded_by: ${CURRENT_PLAN}`);
    expect(oldPlan).toContain('当前执行与开发进展统一以 003 的完整 517-path 窗口为准');
    expect(currentPlan).toMatch(/^status: completed$/m);
    expect(currentPlan).toContain(`supersedes: ${OLD_PLAN}`);
    expect(currentPlan).toContain('旧方案只允许更新 lifecycle frontmatter 与替代说明');
  });

  test('completed plan findings use a separate lifecycle-managed corrective plan', () => {
    const original = read(CURRENT_PLAN);
    const corrective = read(CORRECTIVE_PLAN);
    expect(original).toMatch(/^status: completed$/m);
    expect(corrective).toMatch(/^status: completed$/m);
    expect(corrective).toContain(`amends: ${CURRENT_PLAN}`);
    expect(corrective).toContain('review_run_id: ce-full-window-deep-review-20260820');
    expect(corrective).toContain('F-01 至 F-07');
    expect(corrective).toContain('## Closeout Evidence');
    expect(corrective).toContain('不把原 completed 计划静默改回 active');
  });

  test('worker and worktree contracts forbid linked-worktree index writes', () => {
    const strategy = read('skills/spec-work/references/execution-strategy.md');
    const worktree = read('skills/spec-worktree/SKILL.md');
    for (const source of [strategy, worktree]) {
      expect(source).toContain('linked worktree');
      expect(source).toContain('git add');
      expect(source).toContain('shared Git index');
      expect(source).toContain('EPERM');
    }
  });

  test('scratch and review contracts preserve portability and identity limits', () => {
    const strategy = read('skills/spec-work/references/execution-strategy.md');
    const review = read('skills/spec-code-review/references/cross-model-review.md');
    expect(strategy).toContain('TMPDIR');
    expect(strategy).toContain('native Windows');
    expect(review).toContain('provider_serving_receipt_unavailable');
    expect(review).toContain('requested/actual provider/model');
    expect(review).toContain('provider_untrusted');
  });

  test('planning, authoring, and compounding stay current-source first', () => {
    expect(read('skills/spec-ideate/SKILL.md')).toContain('External research, issue-tracker access, and provider calls are opt-in');
    expect(read('skills/spec-write-skill/SKILL.md')).toContain('source-first');
    expect(read('skills/spec-compound/SKILL.md')).toContain('Current source is the authority');
    expect(read('skills/spec-compound-refresh/SKILL.md')).toContain('current-source anchored');
  });

  test('workflow owners keep context adapters local and cross-model work fail-closed', () => {
    const owners = [
      read('skills/spec-brainstorm/references/handoff.md'),
      read('skills/spec-plan/references/plan-handoff.md'),
      read('skills/spec-ideate/SKILL.md'),
      read('skills/spec-work/references/execution-strategy.md'),
    ];
    for (const owner of owners) {
      expect(owner).toContain('context_facts_adapter/v1');
      expect(owner).toContain('source_identity');
      expect(owner).toContain('freshness');
      expect(owner).toContain('limitations');
      expect(owner).toContain('spec-write-skill');
    }
    const work = owners[3];
    expect(work).toContain('provider-serving-receipt/v2');
    expect(work).toContain('provider_serving_receipt_unverified');
    expect(work).toContain('start no peer subprocess');
    expect(work).toContain('claim no independent or cross-model coverage');
  });
});
