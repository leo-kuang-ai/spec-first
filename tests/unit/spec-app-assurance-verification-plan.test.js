'use strict';

const { buildProofObligations } = require('../../skills/spec-app-consistency-audit/scripts/build-proof-obligations');
const { normalizeCounterexamples } = require('../../skills/spec-app-consistency-audit/scripts/normalize-counterexamples');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { assertVerificationCliContainment, validateVerificationPlan } = require('../../skills/spec-app-consistency-audit/scripts/validate-verification-plan');
const { validateArtifact } = require('../../skills/spec-app-consistency-audit/scripts/validate-artifacts');
const { behaviorModel } = require('./helpers/app-assurance-behavior-fixture');

function inputs() {
  const model = behaviorModel();
  const proofs = buildProofObligations({ behaviorModel: model });
  const obligation = proofs.obligations.find((entry) => entry.category === 'duplicate_submit');
  const counterexamples = normalizeCounterexamples({
    run_id: model.run_id, prepare_fingerprint: model.prepare_fingerprint,
    producer_receipt: { producer_kind: 'fresh_host_llm', limitations: [] },
    counterexamples: [{
      id: 'counterexample-submit', obligation_ref: obligation.id, model_refs: ['journey-checkout'], platform_scope: 'multi',
      preconditions: [], action_sequence: ['Submit twice.'], expected_invariant: 'One side effect.', hypothesized_break: 'Duplicate effect.',
      direct_evidence_refs: ['ev-code'], missing_evidence: [], minimum_verification: { kind: 'state_transition', environment_constraints: ['host'], rationale: 'Reducer test.' },
      status: 'candidate', conclusion_cap: 'candidate', limitations: [],
    }], limitations: [],
  }, { behaviorModel: model, proofObligations: proofs });
  const issues = { artifact_id: 'issues', schema_version: 'spec-app-consistency-audit-issues.v1', semantic_adjudication_status: 'complete', issues: [], rejected_issues: [] };
  const capabilities = {
    freshness: 'current-run', limitations: [], capabilities: [
      { id: 'kmp-compiler', verification_kinds: ['compiler_lint'], environments: ['build'], platforms: ['shared'], readiness: 'ready' },
      { id: 'device-e2e', verification_kinds: ['end_to_end'], environments: ['real_device'], platforms: ['android'], readiness: 'ready' },
    ],
  };
  return { model, proofs, counterexamples, issues, capabilities, obligation };
}

function task(overrides = {}) {
  return {
    id: 'task-static', claim_refs: [{ type: 'obligation', id: overrides.obligationId }],
    verification_kind: 'static_proof', execution_environment: 'none', target_platform: 'multi',
    preconditions: [], inputs: [{ type: 'artifact', ref: 'proof-obligations.json', summary: 'Current proof.' }],
    actions: ['Read the current obligation evidence.'],
    oracle: { observable: 'Referenced evidence exists.', pass_condition: 'Evidence directly proves the claim.', failure_condition: 'Evidence is absent or indirect.' },
    required_capabilities: [], capability_evidence_refs: [], permission: 'read_only', data_sensitivity: 'internal',
    parallelizable: true, cost_rank: 0, lower_cost_rejections: [], sensitive_action_class: 'none',
    human_checkpoint_ref: null, status: 'not_run', blocked_reason: null, limitations: [], ...overrides,
  };
}

function rawPlan(tasks) {
  return { run_id: 'run-u3', prepare_fingerprint: `sha256:${'a'.repeat(64)}`, producer_receipt: { producer_kind: 'fresh_host_llm_verification_compiler', limitations: [] }, tasks, omitted_claims: [], limitations: [] };
}

describe('Verification Plan v1', () => {
  test('validates static proof while keeping all execution authority not_run', () => {
    const value = inputs();
    const plan = validateVerificationPlan(rawPlan([task({ obligationId: value.obligation.id })]), {
      behaviorModel: value.model, proofObligations: value.proofs, counterexamples: value.counterexamples,
      issues: value.issues, capabilitySnapshot: value.capabilities,
    });
    expect(validateArtifact(plan).valid).toBe(true);
    expect(plan).toMatchObject({ artifact_authority: 'generated_advisory', execution_authority: 'not_run', verification_execution_status: 'not_run' });
    expect(plan.tasks[0].status).toBe('not_run');
  });

  test('accepts compiler_lint × build with ready capability and lower-cost rejection', () => {
    const value = inputs();
    const compilerTask = task({
      id: 'task-compiler', obligationId: value.obligation.id, verification_kind: 'compiler_lint', execution_environment: 'build',
      target_platform: 'shared', required_capabilities: ['kmp-compiler'], permission: 'build', cost_rank: 2,
      lower_cost_rejections: [{ verification_kind: 'static_proof', execution_environment: 'none', reason_code: 'compiler_semantics_required', rationale: 'Source inspection cannot prove expect/actual compilation.' }],
    });
    const plan = validateVerificationPlan(rawPlan([compilerTask]), { behaviorModel: value.model, proofObligations: value.proofs, counterexamples: value.counterexamples, issues: value.issues, capabilitySnapshot: value.capabilities });
    expect(plan.tasks[0]).toMatchObject({ verification_kind: 'compiler_lint', execution_environment: 'build', cost_rank: 2, status: 'not_run' });
  });

  test('rejects invalid matrix combinations and forged execution claims', () => {
    const value = inputs();
    const context = { behaviorModel: value.model, proofObligations: value.proofs, counterexamples: value.counterexamples, issues: value.issues, capabilitySnapshot: value.capabilities };
    expect(() => validateVerificationPlan(rawPlan([task({ obligationId: value.obligation.id, verification_kind: 'end_to_end', execution_environment: 'host' })]), context)).toThrow('verification_combination_invalid');
    expect(() => validateVerificationPlan(rawPlan([task({ obligationId: value.obligation.id, status: 'passed' })]), context)).toThrow('verification_execution_claim_rejected');
  });

  test('degraded readiness produces an explicit blocked task', () => {
    const value = inputs();
    value.capabilities.capabilities[0].readiness = 'unavailable';
    const blocked = task({
      id: 'task-blocked', obligationId: value.obligation.id, verification_kind: 'compiler_lint', execution_environment: 'build', target_platform: 'shared',
      required_capabilities: ['kmp-compiler'], permission: 'build', cost_rank: 2, status: 'blocked',
      blocked_reason: { reason_code: 'capability_unavailable', capability_id: 'kmp-compiler' },
      lower_cost_rejections: [{ verification_kind: 'static_proof', execution_environment: 'none', reason_code: 'compiler_semantics_required', rationale: 'Compiler receipt required.' }],
    });
    const plan = validateVerificationPlan(rawPlan([blocked]), { behaviorModel: value.model, proofObligations: value.proofs, counterexamples: value.counterexamples, issues: value.issues, capabilitySnapshot: value.capabilities });
    expect(plan).toMatchObject({ verification_compiler_status: 'degraded', verification_execution_status: 'not_run' });
    expect(plan.tasks[0].status).toBe('blocked');
  });

  test('enforces human-only hard gates and referenced checkpoints', () => {
    const value = inputs();
    const human = task({
      id: 'task-human', obligationId: value.obligation.id, verification_kind: 'human_judgment', execution_environment: 'human_only',
      target_platform: 'android', permission: 'human_only', parallelizable: false, cost_rank: 13,
      sensitive_action_class: 'system_permission_confirmation', status: 'blocked', blocked_reason: { reason_code: 'human_action_required' },
    });
    const device = task({
      id: 'task-device', obligationId: value.obligation.id, verification_kind: 'end_to_end', execution_environment: 'real_device',
      target_platform: 'android', permission: 'device_control', required_capabilities: ['device-e2e'], cost_rank: 12,
      lower_cost_rejections: [{ verification_kind: 'end_to_end', execution_environment: 'simulator', reason_code: 'system_dialog_requires_device', rationale: 'Device-only permission behavior.' }],
      sensitive_action_class: 'system_permission_confirmation', human_checkpoint_ref: 'task-human',
    });
    const context = { behaviorModel: value.model, proofObligations: value.proofs, counterexamples: value.counterexamples, issues: value.issues, capabilitySnapshot: value.capabilities };
    const plan = validateVerificationPlan(rawPlan([device, human]), context);
    expect(plan.coverage.human_checkpoint_count).toBe(1);
    device.human_checkpoint_ref = null;
    expect(() => validateVerificationPlan(rawPlan([device, human]), context)).toThrow('verification_human_checkpoint_required');
  });

  test('rejects unsafe inputs and dangling claims', () => {
    const value = inputs();
    const context = { behaviorModel: value.model, proofObligations: value.proofs, counterexamples: value.counterexamples, issues: value.issues, capabilitySnapshot: value.capabilities };
    expect(() => validateVerificationPlan(rawPlan([task({ obligationId: 'missing' })]), context)).toThrow('verification_claim_ref_invalid');
    expect(() => validateVerificationPlan(rawPlan([task({ obligationId: value.obligation.id, inputs: [{ type: 'source', ref: '/Users/example/secret', summary: 'secret' }] })]), context)).toThrow('verification_input_ref_unsafe');
  });

  test('rejects non-human OAuth and invalid lower-cost or permission claims', () => {
    const value = inputs();
    const context = { behaviorModel: value.model, proofObligations: value.proofs, counterexamples: value.counterexamples, issues: value.issues, capabilitySnapshot: value.capabilities };
    expect(() => validateVerificationPlan(rawPlan([task({ obligationId: value.obligation.id, sensitive_action_class: 'oauth_consent' })]), context)).toThrow('verification_human_only_gate_required');
    expect(() => validateVerificationPlan(rawPlan([task({ obligationId: value.obligation.id, permission: 'build' })]), context)).toThrow('verification_permission_environment_mismatch');
  });

  test('requires five trusted input hashes and managed-run output containment', () => {
    const value = inputs();
    expect(() => validateVerificationPlan(rawPlan([task({ obligationId: value.obligation.id })]), {
      behaviorModel: value.model, proofObligations: value.proofs, counterexamples: value.counterexamples,
      issues: value.issues, capabilitySnapshot: value.capabilities, inputHashes: [`sha256:${'1'.repeat(64)}`],
    })).toThrow('verification_input_hashes_invalid');

    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'verification-boundary-'));
    const runDir = path.join(repoRoot, '.spec-first/app-audit/runs/run-1');
    fs.mkdirSync(path.join(runDir, 'input'), { recursive: true });
    const input = path.join(runDir, 'input/raw-verification-plan.json');
    fs.writeFileSync(input, '{}');
    const outside = path.join(repoRoot, 'outside.json'); fs.writeFileSync(outside, '{}');
    const output = path.join(runDir, 'verification-plan.json'); fs.symlinkSync(outside, output);
    expect(() => assertVerificationCliContainment({ repoRoot, runDir, ephemeralInputs: [input], runArtifacts: [], outputPath: output, reasonPrefix: 'verification' })).toThrow('verification_output_symlink_rejected');
  });
});
