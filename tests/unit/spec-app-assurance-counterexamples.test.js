'use strict';

const { buildProofObligations } = require('../../skills/spec-app-consistency-audit/scripts/build-proof-obligations');
const { assertCounterexampleCliContainment, normalizeCounterexamples } = require('../../skills/spec-app-consistency-audit/scripts/normalize-counterexamples');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateArtifact } = require('../../skills/spec-app-consistency-audit/scripts/validate-artifacts');
const { behaviorModel } = require('./helpers/app-assurance-behavior-fixture');

function semanticEnvelope(obligations) {
  return {
    run_id: 'run-u3', prepare_fingerprint: `sha256:${'a'.repeat(64)}`,
    producer_receipt: { producer_kind: 'fresh_host_llm', input_hashes: [`sha256:${'f'.repeat(64)}`] },
    obligations,
  };
}

function rawCounterexamples(obligationRef, overrides = {}) {
  return {
    run_id: 'run-u3',
    prepare_fingerprint: `sha256:${'a'.repeat(64)}`,
    producer_receipt: { producer_kind: 'fresh_host_llm', input_hashes: [`sha256:${'e'.repeat(64)}`], limitations: [] },
    budget_usage: { token_count: 1000, time_ms: 100 },
    budget: { max_counterexamples: 10 },
    counterexamples: [{
      id: 'counterexample-duplicate-submit', obligation_ref: obligationRef,
      model_refs: ['journey-checkout'], platform_scope: 'multi',
      preconditions: ['Checkout is ready.'], action_sequence: ['Submit twice before completion.'],
      expected_invariant: 'Only one side effect is committed.',
      hypothesized_break: 'Two submissions commit duplicate effects.',
      direct_evidence_refs: ['ev-code'], missing_evidence: ['Runtime idempotency receipt.'],
      minimum_verification: { kind: 'state_transition', environment_constraints: ['host'], rationale: 'Drive the reducer twice.' },
      status: 'candidate', conclusion_cap: 'candidate', limitations: [],
    }],
    limitations: [],
    ...overrides,
  };
}

describe('App counterexamples v1', () => {
  test('normalizes candidate-only output and recomputes the dedupe key', () => {
    const model = behaviorModel();
    const proofs = buildProofObligations({ behaviorModel: model });
    const obligation = proofs.obligations.find((entry) => entry.category === 'duplicate_submit');
    const raw = rawCounterexamples(obligation.id);
    raw.counterexamples[0].dedupe_key = 'forged';
    const artifact = normalizeCounterexamples(raw, { behaviorModel: model, proofObligations: proofs, budget: { maxCounterexamples: 1 } });
    expect(validateArtifact(artifact).valid).toBe(true);
    expect(artifact.counterexamples[0].status).toBe('candidate');
    expect(artifact.counterexamples[0].dedupe_key).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(artifact.counterexamples[0].dedupe_key).not.toBe('forged');
    expect(artifact.search_receipt).toMatchObject({ hash_authority: 'script_computed', usage: { authority: 'unverified', token_count: null, time_ms: null } });
    expect(artifact.search_receipt.input_hashes).toHaveLength(3);
  });

  test('rejects adjudicated status in the U3 generation stage', () => {
    const model = behaviorModel();
    const proofs = buildProofObligations({ behaviorModel: model });
    const obligation = proofs.obligations.find((entry) => entry.category === 'duplicate_submit');
    const raw = rawCounterexamples(obligation.id);
    raw.counterexamples[0].status = 'accepted_for_verification';
    expect(() => normalizeCounterexamples(raw, { behaviorModel: model, proofObligations: proofs })).toThrow('counterexample_candidate_only');
  });

  test('dedupes candidates without raising conclusion authority', () => {
    const model = behaviorModel();
    const proofs = buildProofObligations({ behaviorModel: model });
    const obligation = proofs.obligations.find((entry) => entry.category === 'duplicate_submit');
    const raw = rawCounterexamples(obligation.id);
    raw.counterexamples.push({
      ...raw.counterexamples[0], id: 'counterexample-duplicate-submit-copy',
      direct_evidence_refs: [], conclusion_cap: 'advisory', limitations: ['Second pass.'],
    });
    const artifact = normalizeCounterexamples(raw, { behaviorModel: model, proofObligations: proofs });
    expect(artifact.counterexamples).toHaveLength(1);
    expect(artifact.counterexamples[0].conclusion_cap).toBe('advisory');
    expect(artifact.counterexamples[0].limitations).toContain('Second pass.');
  });

  test('records budget omissions instead of silently truncating', () => {
    const model = behaviorModel();
    const proofs = buildProofObligations({ behaviorModel: model });
    const obligation = proofs.obligations.find((entry) => entry.category === 'duplicate_submit');
    const raw = rawCounterexamples(obligation.id, { budget: { max_counterexamples: 1 } });
    raw.counterexamples.push({
      ...raw.counterexamples[0], id: 'counterexample-different',
      hypothesized_break: 'The retry commits a second side effect after the first response is lost.',
    });
    const artifact = normalizeCounterexamples(raw, { behaviorModel: model, proofObligations: proofs, budget: { maxCounterexamples: 1 } });
    expect(artifact.coverage.budget).toMatchObject({ max_counterexamples: 1, emitted: 1, exhausted: true });
    expect(artifact.coverage.omitted_counterexamples).toHaveLength(1);
  });

  test('rejects an extension candidate when its lens was not triggered', () => {
    const model = behaviorModel();
    const proofs = buildProofObligations({
      behaviorModel: model,
      semanticObligations: semanticEnvelope([{
        id: 'obligation-a11y', category: 'accessibility', statement: 'Error state is announced.',
        model_refs: ['journey-checkout'], platform_scope: 'multi', assessment_authority: 'llm_advisory',
        assessment: 'unresolved', required_evidence: [], evidence_refs: ['ev-code'], freshness: 'current-run',
        limitations: [], conclusion_cap: 'candidate',
        minimum_verification: { kind: 'visual_capture', environment_constraints: ['simulator'], rationale: 'Inspect accessibility state.' },
      }]),
    });
    proofs.coverage.triggered_lenses = proofs.coverage.triggered_lenses.filter((entry) => entry !== 'accessibility');
    const raw = rawCounterexamples('obligation-a11y');
    expect(() => normalizeCounterexamples(raw, { behaviorModel: model, proofObligations: proofs })).toThrow('counterexample_lens_not_triggered');
  });

  test('uses caller-owned count/token/time caps and ignores raw budget claims', () => {
    const model = behaviorModel();
    const proofs = buildProofObligations({ behaviorModel: model });
    const obligation = proofs.obligations.find((entry) => entry.category === 'duplicate_submit');
    const raw = rawCounterexamples(obligation.id, { budget: { max_counterexamples: 999 } });
    raw.counterexamples.push({ ...raw.counterexamples[0], id: 'counterexample-second', hypothesized_break: 'A distinct retry break.' });
    const artifact = normalizeCounterexamples(raw, {
      behaviorModel: model, proofObligations: proofs,
      budget: { maxJourneys: 1, maxCounterexamples: 1, tokenLimit: 2000, timeLimitMs: 1000 },
    });
    expect(artifact.coverage.budget).toMatchObject({ max_journeys: 1, max_counterexamples: 1, token_limit: 2000, time_limit_ms: 1000 });
    expect(artifact.counterexamples).toHaveLength(1);
    raw.budget_usage.token_count = 1;
    expect(() => normalizeCounterexamples(raw, {
      behaviorModel: model, proofObligations: proofs, budget: { tokenLimit: 2000, timeLimitMs: 1000 },
      usageReceipt: { authority: 'caller_receipt', token_count: 2001, time_ms: 100 },
    })).toThrow('counterexample_token_budget_exceeded');
  });

  test('dedupe identity includes obligation_ref', () => {
    const model = behaviorModel();
    const proofs = buildProofObligations({ behaviorModel: model });
    const original = proofs.obligations.find((entry) => entry.category === 'duplicate_submit');
    original.id = 'obligation-a';
    proofs.obligations.push({ ...original, id: 'obligation-b' });
    proofs.coverage.budget.emitted += 1;
    const raw = rawCounterexamples('obligation-a');
    raw.counterexamples.push({ ...raw.counterexamples[0], id: 'counterexample-b', obligation_ref: 'obligation-b' });
    const artifact = normalizeCounterexamples(raw, { behaviorModel: model, proofObligations: proofs });
    expect(artifact.counterexamples).toHaveLength(2);
    expect(new Set(artifact.counterexamples.map((entry) => entry.dedupe_key)).size).toBe(2);
  });

  test('CLI containment rejects symlink output', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'counterexample-boundary-'));
    const runDir = path.join(repoRoot, '.spec-first/app-audit/runs/run-1');
    fs.mkdirSync(path.join(runDir, 'input'), { recursive: true });
    for (const file of ['app-behavior-model.json', 'proof-obligations.json']) fs.writeFileSync(path.join(runDir, file), '{}');
    fs.writeFileSync(path.join(runDir, 'input/raw-counterexamples.json'), '{}');
    const outside = path.join(repoRoot, 'outside.json');
    fs.writeFileSync(outside, '{}');
    const output = path.join(runDir, 'counterexamples.json');
    fs.symlinkSync(outside, output);
    expect(() => assertCounterexampleCliContainment({
      repoRoot, runDir, ephemeralInputs: [path.join(runDir, 'input/raw-counterexamples.json')],
      runArtifacts: [path.join(runDir, 'app-behavior-model.json'), path.join(runDir, 'proof-obligations.json')],
      outputPath: output, reasonPrefix: 'counterexample',
    })).toThrow('counterexample_output_symlink_rejected');
  });

  test('revalidates proof model binding and every obligation ref', () => {
    const model = behaviorModel();
    const proofs = buildProofObligations({ behaviorModel: model });
    const obligation = proofs.obligations.find((entry) => entry.category === 'duplicate_submit');
    const raw = rawCounterexamples(obligation.id);
    proofs.behavior_model_ref.content_hash = `sha256:${'0'.repeat(64)}`;
    expect(() => normalizeCounterexamples(raw, { behaviorModel: model, proofObligations: proofs })).toThrow('counterexample_proof_model_binding_invalid');

    const validProofs = buildProofObligations({ behaviorModel: model });
    validProofs.obligations[0].model_refs = ['missing-model-ref'];
    expect(() => normalizeCounterexamples(rawCounterexamples(validProofs.obligations[0].id), {
      behaviorModel: model, proofObligations: validProofs,
    })).toThrow('counterexample_proof_dangling_model_ref');
  });
});
