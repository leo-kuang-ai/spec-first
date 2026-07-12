'use strict';

const { applyEvidenceGate, buildIssuesArtifact } = require('../../skills/spec-app-consistency-audit/scripts/merge-contracts');

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
    model_refs: ['journey-checkout'],
    obligation_refs: ['obligation-checkout'],
    counterexample_refs: ['counterexample-checkout'],
    conclusion_cap: 'confirmed',
    semantic_adjudication: {
      status: 'accepted', producer_kind: 'fresh_host_llm_adjudicator', assessment_authority: 'llm_advisory',
      challenge_summary: 'Direct evidence survived an isolated challenge.', challenged_fields: ['claim', 'severity', 'impact', 'recommendation'],
      reason_codes: [], missing_evidence: [], limitations: [],
    },
    ...overrides,
  };
}

function semanticArtifacts(overrides = {}) {
  return {
    behaviorModel: {
      run_id: 'run-1', prepare_fingerprint: `sha256:${'a'.repeat(64)}`,
      entities: { journeys: [{ id: 'journey-checkout', semantic_status: 'observed' }], features: [], surfaces: [], states: [], events: [], transitions: [], navigations: [], platform_ownership: [] },
    },
    proofObligations: { run_id: 'run-1', prepare_fingerprint: `sha256:${'a'.repeat(64)}`, obligations: [{ id: 'obligation-checkout', assessment_authority: 'llm_advisory', assessment: 'unresolved' }] },
    counterexamples: { run_id: 'run-1', prepare_fingerprint: `sha256:${'a'.repeat(64)}`, counterexamples: [{ id: 'counterexample-checkout', status: 'candidate' }] },
    adjudicationReceipt: {
      producer_kind: 'fresh_host_llm_adjudicator', generation_context_id: 'generation-1', adjudication_context_id: 'challenge-1',
      context_isolation_status: 'isolated', input_hashes: [`sha256:${'b'.repeat(64)}`],
      excluded_inputs: ['generation_transcript', 'chain_of_thought', 'generation_recommendation_rationale'], limitations: [],
    },
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

  test('isolated fresh adjudication and valid current-run refs preserve a directly evidenced confirmed issue', () => {
    const [result] = applyEvidenceGate([issue()], semanticArtifacts());
    expect(result).toMatchObject({ contract_status: 'confirmed', static_confirmed: true });
    expect(result.review_lifecycle).toEqual(expect.arrayContaining([
      expect.objectContaining({ stage: 'fresh_semantic_adjudication', action: 'accepted' }),
    ]));
  });

  test.each([
    ['dangling model ref', issue({ model_refs: ['missing'] }), semanticArtifacts(), 'semantic_model_ref_invalid'],
    ['same context self-review', issue(), semanticArtifacts({ adjudicationReceipt: { ...semanticArtifacts().adjudicationReceipt, adjudication_context_id: 'generation-1' } }), 'semantic_adjudication_isolation_invalid'],
    ['unverified isolation', issue(), semanticArtifacts({ adjudicationReceipt: { ...semanticArtifacts().adjudicationReceipt, context_isolation_status: 'unverified' } }), 'semantic_adjudication_isolation_invalid'],
  ])('%s cannot remain confirmed', (_label, input, options, reason) => {
    const [result] = applyEvidenceGate([input], options);
    expect(result.contract_status).not.toBe('confirmed');
    expect(result.review_lifecycle).toEqual(expect.arrayContaining([expect.objectContaining({ reason_code: reason })]));
  });

  test('inferred-only IR caps an otherwise plausible issue at candidate', () => {
    const artifacts = semanticArtifacts();
    artifacts.behaviorModel.entities.journeys[0].semantic_status = 'inferred';
    const [result] = applyEvidenceGate([issue()], artifacts);
    expect(result).toMatchObject({ contract_status: 'candidate', static_confirmed: false, conclusion_cap: 'candidate' });
  });

  test('fresh challenge may reject a plausible counterexample without deleting lifecycle evidence', () => {
    const [result] = applyEvidenceGate([issue({
      contract_status: 'candidate', static_confirmed: false,
      semantic_adjudication: { ...issue().semantic_adjudication, status: 'rejected', reason_codes: ['unsupported_counterexample'] },
    })], semanticArtifacts());
    expect(result.contract_status).toBe('rejected');
    expect(result.review_lifecycle).toEqual(expect.arrayContaining([expect.objectContaining({ stage: 'fresh_semantic_adjudication', action: 'rejected' })]));
  });

  test('completed challenge input rejects generation transcript leakage', () => {
    expect(() => buildIssuesArtifact({
      issueArtifactsData: [{ semantic_adjudication_status: 'complete', generation_transcript: 'hidden generation context', issues: [], rejected_issues: [] }],
    })).toThrow('semantic_adjudication_forbidden_input');
  });
});
