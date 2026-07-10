'use strict';

const { buildReport } = require('../../skills/spec-prd/scripts/check-prd-artifact');
const { buildFinalizeReceipt } = require('../../skills/spec-prd/scripts/finalize-prd-artifact');
const { BLOCKING_REASON_CODES } = require('../../skills/spec-prd/scripts/lib/reason-codes');

function prd({
  writeMode,
  nextAction,
  canEnterSpecPlan,
  clarificationEvidence = 'source-proven-no-ask',
}) {
  return [
    '---',
    'spec_id: 2026-07-10-001-decision-card',
    'artifact_kind: prd-requirements',
    'target_surface: generic',
    'status: draft',
    'evidence_grade: mixed',
    'source_authority: mixed',
    'readiness_authority: engineering-owned',
    'created: 2026-07-10',
    '---',
    '# Decision Card Fixture',
    '',
    '## Summary',
    '用户需要一个可验证的 Decision Card 一致性合同。',
    '',
    '## Change Delta',
    '| item | current | target | delta | evidence |',
    '| --- | --- | --- | --- | --- |',
    '| decision card | path unchecked | path checked | extend | confirmed-source |',
    '',
    '## Requirements',
    '| id | priority | requirement | rationale/source |',
    '| --- | --- | --- | --- |',
    '| R-01 | P0 | write_mode 与 next_action 必须一致 | confirmed-source |',
    '',
    '## Acceptance Examples',
    'AE-01（对应 R-01）',
    'Given Decision Card 已声明',
    'When checker 运行',
    'Then 路径冲突被阻断',
    '',
    '## Scope Boundaries',
    'In scope: Decision Card 路径一致性。',
    'Out of scope: 产品语义充分性评分。',
    '',
    '## Evidence And Assumptions',
    '| claim | tag | source | note |',
    '| --- | --- | --- | --- |',
    '| 当前 checker 可确定性读取两个字段 | confirmed-source | checker source | none |',
    '',
    '## Outstanding Questions',
    '| id | question | PRD write target | owner_status | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended_default/deferred_reason |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    '',
    '## Owner Decision Trace',
    '| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |',
    '| --- | --- | --- | --- | --- | --- |',
    '',
    '## Design Source Coverage',
    'design_source_inventory:',
    '- none',
    'design_sources_read:',
    '- none',
    'design_sources_unread:',
    '- none',
    'design_source_coverage: not-applicable',
    'design_degraded_owner_acceptance_ref: none',
    '',
    '## Readiness Self-Check',
    `write_mode: ${writeMode}`,
    `clarification_evidence: ${clarificationEvidence}`,
    'preflight_sweep_closure: closed',
    'decision_card_highest_risk_gap: Decision Card path mismatch',
    `decision_card_next_action: ${nextAction}`,
    'decision_card_why_no_invention: checker blocks contradictory path declarations',
    'design_source_coverage: not-applicable',
    `can_enter_spec_plan: ${canEnterSpecPlan}`,
    'why_not: none',
    '',
  ].join('\n');
}

function reasonCodes(report) {
  return report.findings.map((finding) => finding.reason_code);
}

describe('spec-prd Decision Card deterministic consistency', () => {
  test('blocks final-prd when can_enter_spec_plan remains no', () => {
    const receipt = buildFinalizeReceipt(
      'docs/brainstorms/decision-card-requirements.md',
      prd({ writeMode: 'final-prd', nextAction: 'final-prd', canEnterSpecPlan: 'no' }),
      [],
      { checkOnly: true },
    );

    expect(receipt.blocking_reason_codes).toContain('finalize_required');
    expect(receipt.should_block_closeout).toBe(true);
  });

  test('blocks final-prd when clarification evidence was skipped', () => {
    const text = prd({
      writeMode: 'final-prd',
      nextAction: 'final-prd',
      canEnterSpecPlan: 'yes',
      clarificationEvidence: 'skipped',
    });
    const receipt = buildFinalizeReceipt(
      'docs/brainstorms/decision-card-requirements.md',
      text,
      [],
      { checkOnly: true },
    );

    expect(receipt.checker.reason_codes).toContain('clarification_trace_absent');
    expect(receipt.blocking_reason_codes).toContain('clarification_trace_absent');
    expect(receipt.should_block_closeout).toBe(true);
  });

  test('blocks checkpoint-prd when it claims can_enter_spec_plan=yes', () => {
    const text = prd({
      writeMode: 'checkpoint-prd',
      nextAction: 'checkpoint-prd',
      canEnterSpecPlan: 'yes',
    });
    const receipt = buildFinalizeReceipt(
      'docs/brainstorms/decision-card-requirements.md',
      text,
      [],
      { checkOnly: true },
    );

    expect(receipt.checker.reason_codes).toContain('checkpoint_claims_ready');
    expect(receipt.blocking_reason_codes).toContain('checkpoint_claims_ready');
    expect(receipt.should_block_closeout).toBe(true);
  });

  test.each([
    ['final-prd', 'checkpoint-prd', 'yes'],
    ['checkpoint-prd', 'final-prd', 'no'],
    ['ask-owner-first', 'checkpoint-prd', 'no'],
  ])('blocks write_mode=%s with next_action=%s', (writeMode, nextAction, canEnterSpecPlan) => {
    const text = prd({ writeMode, nextAction, canEnterSpecPlan });
    const receipt = buildFinalizeReceipt(
      'docs/brainstorms/decision-card-requirements.md',
      text,
      [],
      { checkOnly: true },
    );

    expect(receipt.checker.reason_codes).toContain('decision_card_path_mismatch');
    expect(receipt.blocking_reason_codes).toContain('decision_card_path_mismatch');
    expect(receipt.should_block_closeout).toBe(true);
  });

  test.each([
    ['final-prd', 'final-prd', 'yes'],
    ['checkpoint-prd', 'checkpoint-prd', 'no'],
    ['ask-owner-first', 'ask-owner-first', 'no'],
    ['route-out', 'route-out', 'no'],
  ])('accepts aligned write_mode=%s and next_action=%s', (writeMode, nextAction, canEnterSpecPlan) => {
    const report = buildReport(
      'docs/brainstorms/decision-card-requirements.md',
      prd({ writeMode, nextAction, canEnterSpecPlan }),
    );

    expect(reasonCodes(report)).not.toContain('decision_card_path_mismatch');
  });

  test('classifies the mismatch as a blocking deterministic reason code', () => {
    expect(BLOCKING_REASON_CODES.has('decision_card_path_mismatch')).toBe(true);
  });
});
