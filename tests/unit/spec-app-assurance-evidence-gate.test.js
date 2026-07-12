'use strict';

const { applyEvidenceGate } = require('../../skills/spec-app-consistency-audit/scripts/merge-contracts');

function issue(overrides = {}) {
  return {
    id: 'APP-ASSURANCE-001',
    title: '候选问题',
    severity: 'high',
    category: 'app_consistency',
    claim_family: 'architecture_static',
    claim_type: 'missing_state',
    affected_surface: { type: 'view_model', id: 'CheckoutViewModel', file: 'CheckoutViewModel.kt' },
    expert: 'engineering-quality-expert',
    static_confirmed: true,
    contract_status: 'confirmed',
    confidence: 0.82,
    evidence: { code: [{ source: 'code', file: 'CheckoutViewModel.kt', summary: '未发现失败状态。' }] },
    related_rule_packs: ['common-app'],
    ...overrides,
  };
}

describe('App Assurance 当前 evidence gate characterization', () => {
  test('拒绝只有 rule-pack 证据的 confirmed issue', () => {
    const [result] = applyEvidenceGate([issue({
      evidence: { rule_pack: [{ source: 'rule_pack', summary: '通用规则要求失败状态。' }] },
    })]);

    expect(result).toEqual(expect.objectContaining({ contract_status: 'rejected', static_confirmed: false }));
    expect(result.evidence_gate.reason).toBe('confirmed_issue_requires_project_specific_evidence');
  });

  test('拒绝缺少证据的 candidate', () => {
    const [result] = applyEvidenceGate([issue({
      contract_status: 'candidate',
      static_confirmed: false,
      evidence: undefined,
      provenance: undefined,
    })]);

    expect(result.evidence_gate.reason).toBe('issue_requires_evidence_or_provenance');
  });

  test('低置信度 confirmed issue 降级为 candidate', () => {
    const [result] = applyEvidenceGate([issue({ confidence: 0.4 })]);

    expect(result.contract_status).toBe('candidate');
    expect(result.static_confirmed).toBe(false);
    expect(result.evidence_gate.reason).toBe('confirmed_issue_confidence_below_threshold');
  });
});
