'use strict';

const { assertProofCliContainment, buildProofObligations } = require('../../skills/spec-app-consistency-audit/scripts/build-proof-obligations');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateArtifact } = require('../../skills/spec-app-consistency-audit/scripts/validate-artifacts');
const { behaviorModel } = require('./helpers/app-assurance-behavior-fixture');

function semanticObligation(overrides = {}) {
  return {
    id: 'obligation-absence-route',
    category: 'navigation_reachability',
    statement: 'Expected route implementation is present.',
    model_refs: ['journey-checkout'],
    platform_scope: 'multi',
    assessment_authority: 'llm_advisory',
    assessment: 'disproven',
    required_evidence: [{ source_family: 'code', claim: 'Route implementation.' }],
    evidence_refs: ['ev-code'],
    freshness: 'current-run',
    limitations: [],
    conclusion_cap: 'candidate',
    minimum_verification: { kind: 'static_proof', environment_constraints: ['host'], rationale: 'Search source.' },
    ...overrides,
  };
}

function semanticEnvelope(obligations) {
  return {
    run_id: 'run-u3', prepare_fingerprint: `sha256:${'a'.repeat(64)}`,
    producer_receipt: { producer_kind: 'fresh_host_llm', input_hashes: [`sha256:${'f'.repeat(64)}`] },
    obligations,
  };
}

describe('App proof obligations v1', () => {
  test('keeps mechanical authority per item and semantic templates unassessed', () => {
    const artifact = buildProofObligations({ behaviorModel: behaviorModel() });
    expect(validateArtifact(artifact).valid).toBe(true);
    expect(artifact.artifact_authority).toBe('mixed_per_item');
    expect(artifact.obligations.find((entry) => entry.category === 'reference_integrity')).toMatchObject({
      producer_kind: 'script', assessment_authority: 'script_confirmed', assessment: 'proven',
    });
    expect(artifact.obligations.find((entry) => entry.category === 'duplicate_submit')).toMatchObject({
      assessment_authority: 'not_assessed', assessment: 'unresolved', conclusion_cap: 'candidate',
    });
  });

  test('rejects LLM authority escalation', () => {
    expect(() => buildProofObligations({
      behaviorModel: behaviorModel(),
      semanticObligations: semanticEnvelope([semanticObligation({ assessment_authority: 'script_confirmed' })]),
    })).toThrow('proof_llm_authority_escalation');
  });

  test('caps incomplete absence claims at unresolved with auditable reason codes', () => {
    const artifact = buildProofObligations({
      behaviorModel: behaviorModel(),
      semanticObligations: semanticEnvelope([semanticObligation({
        absence_claim: {
          expected_evidence_refs: ['ev-code'],
          coverage_cap: 'complete',
          negative_evidence_scope: {
            source_roots: ['shared'], file_patterns: ['**/*.kt'], symbols: ['CheckoutRoute'], tools: ['source_scan'],
            platform_sources: ['android'], scanned_file_count: 10, max_file_count: 10, truncated: true,
            generated_code_covered: false, dynamic_routes_covered: false, di_bindings_covered: false,
            provider_status: 'degraded',
          },
        },
      })]),
    });
    const obligation = artifact.obligations.find((entry) => entry.id === 'obligation-absence-route');
    expect(obligation.assessment).toBe('unresolved');
    expect(obligation.absence_claim.coverage_cap).toBe('partial');
    expect(obligation.absence_claim.reason_codes).toEqual(expect.arrayContaining([
      'absence_scan_truncated', 'absence_generated_code_not_covered', 'absence_platform_source_missing',
    ]));
  });

  test('records omitted obligations when the deterministic budget is exhausted', () => {
    const artifact = buildProofObligations({ behaviorModel: behaviorModel(), maxObligations: 1 });
    expect(artifact.coverage.budget).toMatchObject({ max_obligations: 1, emitted: 1, exhausted: true });
    expect(artifact.coverage.omitted_obligations.length).toBeGreaterThan(0);
  });

  test('dedupe never upgrades conflicting authority', () => {
    const artifact = buildProofObligations({
      behaviorModel: behaviorModel(),
      semanticObligations: semanticEnvelope([semanticObligation({
        id: 'llm-duplicate-submit', category: 'duplicate_submit', assessment: 'proven',
      })]),
    });
    const duplicate = artifact.obligations.find((entry) => entry.category === 'duplicate_submit');
    expect(duplicate).toMatchObject({ assessment_authority: 'not_assessed', assessment: 'unresolved', conclusion_cap: 'candidate' });
  });

  test('binds semantic input to run/fingerprint and script-computes hashes', () => {
    const wrongRun = semanticEnvelope([semanticObligation()]);
    wrongRun.run_id = 'run-other';
    expect(() => buildProofObligations({ behaviorModel: behaviorModel(), semanticObligations: wrongRun })).toThrow('proof_semantic_input_run_mismatch');
    const untrustedHashes = semanticEnvelope([semanticObligation()]);
    untrustedHashes.producer_receipt.input_hashes = ['forged'];
    const artifact = buildProofObligations({ behaviorModel: behaviorModel(), semanticObligations: untrustedHashes });
    expect(artifact.semantic_input_receipt).toMatchObject({ hash_authority: 'script_computed' });
    expect(artifact.semantic_input_receipt.input_hashes).toHaveLength(2);
    expect(artifact.semantic_input_receipt.input_hashes).not.toContain('forged');
  });

  test('caps LLM semantic obligations at candidate even when assessed proven', () => {
    const artifact = buildProofObligations({
      behaviorModel: behaviorModel(),
      semanticObligations: semanticEnvelope([semanticObligation({ assessment: 'proven', conclusion_cap: 'confirmed' })]),
    });
    const obligation = artifact.obligations.find((entry) => entry.id === 'obligation-absence-route');
    expect(obligation).toMatchObject({ assessment_authority: 'llm_advisory', assessment: 'proven', conclusion_cap: 'candidate' });
  });

  test('complete absence coverage requires known expectation, non-empty scan and both platforms', () => {
    const complete = semanticObligation({
      absence_claim: {
        expected_evidence_refs: ['ev-code'], coverage_cap: 'complete',
        negative_evidence_scope: {
          source_roots: ['shared'], file_patterns: ['**/*.kt'], symbols: ['Route'], tools: ['source_scan'],
          platform_sources: ['android', 'ios'], scanned_file_count: 10, max_file_count: 10, truncated: false,
          generated_code_covered: true, dynamic_routes_covered: true, di_bindings_covered: true, provider_status: 'ready',
        },
      },
    });
    const artifact = buildProofObligations({ behaviorModel: behaviorModel(), semanticObligations: semanticEnvelope([complete]) });
    expect(artifact.obligations.find((entry) => entry.id === complete.id).absence_claim.coverage_cap).toBe('complete');
    complete.absence_claim.expected_evidence_refs = ['missing-evidence'];
    expect(() => buildProofObligations({ behaviorModel: behaviorModel(), semanticObligations: semanticEnvelope([complete]) })).toThrow('proof_absence_expected_evidence_ref_invalid');
  });

  test('CLI containment rejects a symlinked managed run', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'proof-boundary-'));
    const runs = path.join(repoRoot, '.spec-first/app-audit/runs');
    const outsideRun = path.join(repoRoot, 'outside-run');
    fs.mkdirSync(path.join(outsideRun, 'input'), { recursive: true });
    fs.mkdirSync(runs, { recursive: true });
    const runDir = path.join(runs, 'run-1');
    fs.symlinkSync(outsideRun, runDir);
    expect(() => assertProofCliContainment({ repoRoot, runDir, ephemeralInputs: [], runArtifacts: [], outputPath: path.join(runDir, 'proof-obligations.json'), reasonPrefix: 'proof' })).toThrow('proof_run_boundary_invalid');
  });

  test('rejects unsafe or secret-bearing absence scope entries', () => {
    const unsafe = semanticObligation({
      absence_claim: {
        expected_evidence_refs: ['ev-code'], coverage_cap: 'partial',
        negative_evidence_scope: { source_roots: ['/Users/example/app'], file_patterns: ['**/*.kt'], symbols: [], tools: ['scan'], platform_sources: [] },
      },
    });
    expect(() => buildProofObligations({ behaviorModel: behaviorModel(), semanticObligations: semanticEnvelope([unsafe]) })).toThrow('proof_absence_scope_path_rejected');
    unsafe.absence_claim.negative_evidence_scope.source_roots = ['shared'];
    unsafe.absence_claim.negative_evidence_scope.tools = ['token=secret'];
    expect(() => buildProofObligations({ behaviorModel: behaviorModel(), semanticObligations: semanticEnvelope([unsafe]) })).toThrow('proof_absence_scope_text_rejected');
  });
});
