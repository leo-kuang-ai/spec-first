'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const { projectFindingCore } = require('../../scripts/project-ecc-finding-core');
const { routeCandidates } = require('../../scripts/route-ecc-agent-candidates');
const {
  prepareSynthesisBrief,
} = require('../../scripts/prepare-ecc-synthesis-brief');

const REPO_ROOT = path.join(__dirname, '..', '..');
const CONTRACT_DIR = path.join(REPO_ROOT, 'src', 'cli', 'contracts', 'agent-registry');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function codeReviewNative(reviewer, findingOverrides = {}) {
  return {
    reviewer,
    findings: [
      {
        title: 'Session refresh lacks permission boundary',
        severity: 'P1',
        file: 'src/auth/session.ts',
        line: 42,
        why_it_matters: 'Session refresh may bypass permission checks.',
        autofix_class: 'gated_auto',
        owner: 'human',
        requires_verification: true,
        suggested_fix: 'Add an explicit permission check before refresh.',
        confidence: 75,
        evidence: ['src/auth/session.ts:42 refresh proceeds before permission evidence'],
        pre_existing: false,
        ...findingOverrides,
      },
    ],
    residual_risks: [],
    testing_gaps: [],
  };
}

describe('ECC synthesis brief projection', () => {
  test('prepares merge and rank hints from Finding Core projections without final verdicts', () => {
    const outputSchema = readJson(path.join(CONTRACT_DIR, 'synthesis-brief.schema.json'));
    const securityProjection = projectFindingCore(codeReviewNative('security'), {
      workflow: 'spec-code-review',
      agentId: 'spec-security-reviewer',
    });
    const contractProjection = projectFindingCore(codeReviewNative('api-contract'), {
      workflow: 'spec-code-review',
      agentId: 'spec-api-contract-reviewer',
    });
    const routerCandidates = routeCandidates({
      workflow: 'spec-code-review',
      changed_files: ['src/auth/session.ts'],
      risk_signals: ['runtime_code_changed'],
    });

    const output = prepareSynthesisBrief({
      workflow: 'spec-code-review',
      projections: [securityProjection, contractProjection],
      router_candidates: routerCandidates,
    });

    expect(validateAgainstSchema(outputSchema, output).errors).toEqual([]);
    expect(output).not.toHaveProperty('final_verdict');
    expect(output).not.toHaveProperty('selected_agents');
    expect(output.requires_skill_synthesis).toBe(true);
    expect(output.synthesis_decision_slots).toMatchObject({
      must_be_filled_by_skill: true,
      merge: [],
      adopt: [],
      reject: [],
      downgrade: [],
      upgrade: [],
      final_summary: null,
    });
    expect(output.merge_candidate_groups).toHaveLength(1);
    expect(output.merge_candidate_groups[0]).toMatchObject({
      reason_code: 'same_target_and_title_fingerprint',
      requires_skill_decision: true,
      finding_refs: ['F1', 'F2'],
      agent_ids: ['spec-api-contract-reviewer', 'spec-security-reviewer'],
    });
    expect(output.rank_bucket_hints.high_attention_refs).toEqual(['F1', 'F2']);
    expect(output.finding_facts[0].native_preserved).toMatchObject({
      autofix_class: 'gated_auto',
      owner: 'human',
      requires_verification: true,
      pre_existing: false,
    });
    expect(output.attention_hints.verification_required_refs).toEqual(['F1', 'F2']);
    expect(output.attention_hints.finding_agent_outside_router_refs).toContain('F2');
  });

  test('keeps degraded and pre-existing findings as attention hints instead of decisions', () => {
    const projected = projectFindingCore(codeReviewNative('correctness', {
      title: 'Legacy edge case may be stale',
      severity: 'P1',
      suggested_fix: null,
      confidence: 0,
      evidence: ['legacy branch existed before this diff'],
      pre_existing: true,
    }), {
      workflow: 'spec-code-review',
      agentId: 'spec-correctness-reviewer',
    });
    projected.finding_core[0].evidence = [];

    const output = prepareSynthesisBrief({
      workflow: 'spec-code-review',
      projections: [projected],
    });

    expect(output.finding_facts[0].rank_hint.bucket).toBe('advisory_attention');
    expect(output.finding_facts[0].attention_flags).toEqual(expect.arrayContaining([
      'missing_evidence',
      'missing_recommendation',
      'pre_existing',
      'projection_degraded',
      'rejected_by_native_confidence',
    ]));
    expect(output.attention_hints.degraded_refs).toEqual(['F1']);
    expect(output.attention_hints.pre_existing_refs).toEqual(['F1']);
    expect(output.attention_hints.rejected_by_native_confidence_refs).toEqual(['F1']);
    expect(output.synthesis_decision_slots.reject).toEqual([]);
  });

  test('preserves doc-review section targets and deferred workflow boundary', () => {
    const docProjection = projectFindingCore({
      reviewer: 'coherence',
      findings: [
        {
          title: 'Plan omits rollback boundary',
          severity: 'P2',
          section: 'Rollout',
          why_it_matters: 'Implementers cannot tell when to stop or revert.',
          finding_type: 'omission',
          autofix_class: 'manual',
          suggested_fix: null,
          confidence: 50,
          evidence: ['Rollout section lists deploy steps but no rollback condition.'],
        },
      ],
      residual_risks: ['deployment owner not confirmed'],
      deferred_questions: ['Who owns rollback approval?'],
    }, {
      workflow: 'spec-doc-review',
      agentId: 'spec-coherence-reviewer',
    });

    const output = prepareSynthesisBrief({
      workflow: 'spec-doc-review',
      projections: [docProjection],
    });

    expect(output.finding_facts[0].target).toEqual({
      kind: 'section',
      value: 'Rollout',
    });
    expect(output.finding_facts[0].rank_hint.bucket).toBe('medium_attention');
    expect(output.finding_facts[0].native_preserved).toMatchObject({
      section: 'Rollout',
      finding_type: 'omission',
      autofix_class: 'manual',
      suggested_fix: null,
    });
    expect(output.attention_hints.missing_recommendation_refs).toEqual(['F1']);
  });

  test('rejects workflow mismatch instead of mixing synthesis contexts', () => {
    const docProjection = projectFindingCore({
      reviewer: 'coherence',
      findings: [],
      residual_risks: [],
      deferred_questions: [],
    }, {
      workflow: 'spec-doc-review',
      agentId: 'spec-coherence-reviewer',
    });

    expect(() => prepareSynthesisBrief({
      workflow: 'spec-code-review',
      projections: [docProjection],
    })).toThrow('workflow mismatch');
  });
});
