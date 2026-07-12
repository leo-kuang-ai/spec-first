'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { assemblePilotManifest } = require('../../skills/spec-app-consistency-audit/evals/run-pilot.cjs');
const { validatePilotEvidence } = require('../../skills/spec-app-consistency-audit/evals/validate-pilot-evidence.cjs');

const HASH = `sha256:${'a'.repeat(64)}`;

function metrics() {
  return {
    incremental_confirmed_findings: 0, pre_runtime_fixable_count: 0, confirmed_precision: 0,
    runtime_escape_count: 0, critical_journey_coverage: 0.5, verification_plan_executability: 0.5,
    human_review_minutes: 5, duration_ms: 1000, tokens: 100, artifact_bytes: 0,
    high_impact_false_positives: 0, permission_violations: 0,
  };
}

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'app-pilot-'));
  for (const file of ['cases.json', 'rubric.md', 'code-review.md', 'app-audit.md', 'candidate.md']) {
    fs.writeFileSync(path.join(root, file), `${file}\n`);
  }
  const arms = Object.fromEntries([
    ['current_code_review', 'code-review.md'], ['current_app_audit', 'app-audit.md'], ['candidate_compiler', 'candidate.md'],
  ].map(([id, output]) => [id, { source_hash: HASH, allowed_evidence: ['source'], repeat_count: 1, output, metrics: metrics() }]));
  const spec = {
    schema_version: 'app-assurance-promotion-evidence.v1', verdict: 'continue_trial',
    decision: { owner: 'project-owner', rationale: 'Field evidence is incomplete.', integration_authorized: false },
    inputs: { case_set: 'cases.json', rubric: 'rubric.md' },
    samples: [{ sample_id: 'synthetic-one', provenance: 'synthetic_fixture', source_hash: HASH, allowed_evidence: ['source'], arms }],
    blind_review: { identity_revealed_before_scoring: false, reviewers: [] },
    independent_developer_adoption: { status: 'not_run', reason_code: 'external_app_developer_unavailable' },
    closeout: { action: 'continue_trial', reevaluate_by: '2026-08-12', required_evidence: ['3-5 representative samples', 'independent developer adoption'] },
  };
  return { root, spec };
}

describe('App Assurance promotion evidence', () => {
  test('accepts an honest continue_trial bundle while exposing promotion blockers', () => {
    const { root, spec } = fixture();
    const manifest = assemblePilotManifest(spec, root);
    const result = validatePilotEvidence(manifest, root);
    expect(result.valid).toBe(true);
    expect(result.promotion_eligible).toBe(false);
    expect(result.integration_authorized).toBe(false);
    expect(result.blockers).toEqual(expect.arrayContaining([
      'representative_sample_count_not_met', 'field_sample_evidence_missing',
      'independent_blind_review_missing', 'independent_developer_adoption_missing',
    ]));
  });

  test('fails closed when the same incomplete evidence claims promote', () => {
    const { root, spec } = fixture();
    spec.verdict = 'promote';
    spec.decision.integration_authorized = true;
    const result = validatePilotEvidence(assemblePilotManifest(spec, root), root);
    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('promote blocked');
  });

  test('rejects formal promotion evidence that has no incremental or executable value', () => {
    const { root, spec } = fixture();
    fs.writeFileSync(path.join(root, 'reviewer-1.md'), 'blind review 1\n');
    fs.writeFileSync(path.join(root, 'reviewer-2.md'), 'blind review 2\n');
    fs.writeFileSync(path.join(root, 'adoption.md'), 'independent adoption\n');
    spec.verdict = 'promote';
    spec.decision = {
      owner: 'project-owner', rationale: 'promote', integration_authorized: true,
      cost_accepted: true, owner_acceptance: true,
    };
    spec.generation_controls = { known_defect_labels_withheld: true };
    spec.samples[0].provenance = 'historical_app';
    spec.samples.push(
      { ...JSON.parse(JSON.stringify(spec.samples[0])), sample_id: 'historical-two' },
      { ...JSON.parse(JSON.stringify(spec.samples[0])), sample_id: 'historical-three' },
    );
    spec.samples.forEach((sample) => { sample.arms.candidate_compiler.metrics.verification_plan_executability = 0; });
    spec.blind_review.reviewers = [
      { reviewer_id: 'r1', independent_from_implementation: true, arm_identity_hidden_until_scoring: true, sample_ids: ['synthetic-one', 'historical-two', 'historical-three'], arm_labels: ['x', 'y', 'z'], receipt: 'reviewer-1.md' },
      { reviewer_id: 'r2', independent_from_implementation: true, arm_identity_hidden_until_scoring: true, sample_ids: ['synthetic-one', 'historical-two', 'historical-three'], arm_labels: ['x', 'y', 'z'], receipt: 'reviewer-2.md' },
    ];
    spec.independent_developer_adoption = {
      status: 'passed', independent_from_implementation: true, public_entry_invoked: true, selected_inputs_without_coaching: true,
      explained_limitations: true, next_action_correct: true, receipt: 'adoption.md',
    };
    const result = validatePilotEvidence(assemblePilotManifest(spec, root), root);
    expect(result.valid).toBe(false);
    expect(result.blockers).toEqual(expect.arrayContaining([
      'incremental_confirmed_value_missing', 'pre_runtime_fixable_value_missing', 'verification_executability_missing',
    ]));
  });

  test('rejects different evidence allowances across arms and tampered hashes', () => {
    const { root, spec } = fixture();
    const manifest = assemblePilotManifest(spec, root);
    manifest.samples[0].arms.current_code_review.allowed_evidence = ['different'];
    fs.appendFileSync(path.join(root, 'candidate.md'), 'tampered\n');
    const result = validatePilotEvidence(manifest, root);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.stringContaining('allowed_evidence mismatch'),
      expect.stringContaining('sha256 mismatch'),
    ]));
  });

  test('rejects execution metrics or missing repeats that cannot support comparison', () => {
    const { root, spec } = fixture();
    spec.samples[0].arms.candidate_compiler.repeat_count = 0;
    spec.samples[0].arms.current_app_audit.metrics.tokens = -1;
    spec.samples[0].arms.current_code_review.metrics.confirmed_precision = 1.5;
    const result = validatePilotEvidence(assemblePilotManifest(spec, root), root);
    expect(result.valid).toBe(false);
    expect(result.errors.join('\n')).toContain('repeat_count must be >= 1');
    expect(result.errors.join('\n')).toContain('metrics.tokens must be a non-negative number');
    expect(result.errors.join('\n')).toContain('metrics.confirmed_precision must be between 0 and 1');
  });

  test('rejects a symlinked output even when its target is a regular file', () => {
    const { root, spec } = fixture();
    fs.writeFileSync(path.join(root, 'outside.md'), 'outside\n');
    fs.symlinkSync(path.join(root, 'outside.md'), path.join(root, 'linked.md'));
    spec.samples[0].arms.candidate_compiler.output = 'linked.md';
    expect(() => assemblePilotManifest(spec, root)).toThrow('pilot_ref_symlink_rejected');
  });
});
