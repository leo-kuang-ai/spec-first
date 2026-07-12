const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { buildAuditContext } = require('../../skills/spec-app-consistency-audit/scripts/build-audit-context');
const { normalizeBehaviorModel } = require('../../skills/spec-app-consistency-audit/scripts/normalize-behavior-model');
const { validateArtifact } = require('../../skills/spec-app-consistency-audit/scripts/validate-artifacts');

function semantic(id, overrides = {}) {
  return {
    id,
    label: id,
    platform_scope: 'multi',
    semantic_status: 'observed',
    evidence_refs: ['ev-code'],
    freshness: 'current-run',
    confidence: 0.8,
    limitations: [],
    ...overrides,
  };
}

function rawModel(overrides = {}) {
  return {
    schema_version: 'app-behavior-model.v1',
    artifact_id: 'app-behavior-model',
    run_id: 'run-1',
    prepare_fingerprint: `sha256:${'a'.repeat(64)}`,
    producer_receipt: {
      producer_kind: 'fresh_host_llm',
      input_hashes: [`sha256:${'d'.repeat(64)}`],
      status: 'complete',
      limitations: [],
    },
    scope: {
      changed_feature_refs: ['feature-checkout'],
      selected_journey_refs: ['journey-checkout'],
      platform_scope: ['android', 'ios'],
      selection_source: 'user_override',
      selection_rationale: ['Explicit changed journey.'],
      omitted_journey_candidates: [],
    },
    evidence_catalog: [{
      id: 'ev-code',
      source_kind: 'code',
      path: 'shared/CheckoutViewModel.kt',
      source_hash: `sha256:${'b'.repeat(64)}`,
      freshness: 'current-worktree',
      summary: 'Checkout submission state reducer.',
      limitations: [],
    }],
    entities: {
      features: [semantic('feature-checkout')],
      journeys: [{
        ...semantic('journey-checkout'),
        feature_ref: 'feature-checkout',
        entry: { surface_ref: 'surface-checkout', state_ref: 'state-ready', preconditions: ['Checkout data is available.'] },
        ordered_step_refs: ['transition-submit', 'transition-fail'],
        happy_exit: { state_ref: 'state-success', navigation_ref: null },
        failure_or_cancel_exits: [{ kind: 'failure', state_ref: 'state-error', navigation_ref: null }],
      }],
      surfaces: [semantic('surface-checkout')],
      states: [semantic('state-ready'), semantic('state-submitting'), semantic('state-error'), semantic('state-success')],
      events: [semantic('event-submit'), semantic('event-failure'), semantic('event-success')],
      transitions: [
        { ...semantic('transition-submit'), journey_ref: 'journey-checkout', source_state_ref: 'state-ready', event_ref: 'event-submit', target_state_ref: 'state-submitting', surface_ref: 'surface-checkout' },
        { ...semantic('transition-fail'), journey_ref: 'journey-checkout', source_state_ref: 'state-submitting', event_ref: 'event-failure', target_state_ref: 'state-error', surface_ref: 'surface-checkout' },
        { ...semantic('transition-success'), journey_ref: 'journey-checkout', source_state_ref: 'state-submitting', event_ref: 'event-success', target_state_ref: 'state-success', surface_ref: 'surface-checkout' },
      ],
      navigations: [],
      platform_ownership: [{ ...semantic('ownership-checkout'), subject_ref: 'surface-checkout', ownership: 'split', bindings: [] }],
    },
    identity_candidates: [],
    contradictions: [],
    extensions: {
      state_semantics: [{ state_ref: 'state-error', lifecycle: 'transient', recoverability: 'recoverable' }],
      side_effects: [],
    },
    coverage: {
      included_sources: ['code'],
      omitted_sources: ['figma'],
      platforms_evaluable: ['android', 'ios'],
      platforms_not_evaluable: [],
      design_alignment: 'not_evaluable',
      conclusion_caps: ['design_alignment:not_evaluable'],
      limitations: ['No materialized Figma input.'],
    },
    ...overrides,
  };
}

describe('App Behavior Model v1', () => {
  test('normalizes a minimal changed-feature journey without upgrading advisory authority', () => {
    const model = normalizeBehaviorModel(rawModel(), {
      metadata: { run_id: 'run-1', prepare_fingerprint: `sha256:${'a'.repeat(64)}`, data_sensitivity: 'internal' },
    });

    expect(model.contract_status).toBe('candidate');
    expect(model.artifact_authority).toBe('generated_advisory');
    expect(model.retention_class).toBe('run_local');
    expect(validateArtifact(model).valid).toBe(true);
    expect(model.entities.transitions.map((entry) => entry.id)).toEqual(['transition-fail', 'transition-submit', 'transition-success']);
  });

  test.each([
    ['duplicate ID', (model) => model.entities.states.push({ ...model.entities.states[0] }), 'behavior_model_duplicate_id'],
    ['dangling transition ref', (model) => { model.entities.transitions[0].target_state_ref = 'state-missing'; }, 'behavior_model_dangling_ref'],
    ['cross-journey transition', (model) => { model.entities.transitions[0].journey_ref = 'journey-missing'; }, 'behavior_model_dangling_ref'],
    ['cross-run fingerprint', (model) => { model.prepare_fingerprint = `sha256:${'c'.repeat(64)}`; }, 'behavior_model_prepare_fingerprint_mismatch'],
    ['missing producer receipt', (model) => { delete model.producer_receipt; }, 'behavior_model_producer_receipt_required'],
    ['incomplete journey', (model) => { model.entities.journeys[0].failure_or_cancel_exits = []; }, 'behavior_model_incomplete_journey'],
    ['disconnected transition chain', (model) => { model.entities.transitions.find((entry) => entry.id === 'transition-fail').source_state_ref = 'state-ready'; }, 'behavior_model_transition_chain_invalid'],
    ['dangling scope ref', (model) => { model.scope.changed_feature_refs = ['feature-missing']; }, 'behavior_model_dangling_ref'],
  ])('rejects %s', (_label, mutate, reasonCode) => {
    const model = rawModel();
    mutate(model);
    expect(() => normalizeBehaviorModel(model, {
      metadata: { run_id: 'run-1', prepare_fingerprint: `sha256:${'a'.repeat(64)}`, data_sensitivity: 'internal' },
    })).toThrow(reasonCode);
  });

  test('same-name source identities remain candidates and inferred nodes keep limitations', () => {
    const model = rawModel({
      identity_candidates: [{
        ...semantic('identity-checkout', { semantic_status: 'inferred', limitations: ['Name match alone is not identity evidence.'] }),
        left_ref: 'prd:Checkout',
        right_ref: 'code:CheckoutScreen',
        match_status: 'candidate',
      }],
    });
    const normalized = normalizeBehaviorModel(model, {
      metadata: { run_id: 'run-1', prepare_fingerprint: `sha256:${'a'.repeat(64)}`, data_sensitivity: 'internal' },
    });
    expect(normalized.identity_candidates[0].match_status).toBe('candidate');
    expect(normalized.identity_candidates[0].semantic_status).toBe('inferred');
  });

  test('observed nodes cannot carry stale freshness', () => {
    const model = rawModel();
    model.entities.states[0].freshness = 'stale';
    expect(() => normalizeBehaviorModel(model, {
      metadata: { run_id: 'run-1', prepare_fingerprint: `sha256:${'a'.repeat(64)}`, data_sensitivity: 'internal' },
    })).toThrow('behavior_model_observed_current_freshness_required');
  });

  test('missing Figma caps only design alignment and does not fabricate design nodes', () => {
    const normalized = normalizeBehaviorModel(rawModel(), {
      metadata: { run_id: 'run-1', prepare_fingerprint: `sha256:${'a'.repeat(64)}`, data_sensitivity: 'internal' },
    });
    expect(normalized.coverage.design_alignment).toBe('not_evaluable');
    expect(normalized.coverage.platforms_evaluable).toEqual(['android', 'ios']);
  });

  test('rejects restricted persistence, prompt action fields and unsafe evidence paths', () => {
    expect(() => normalizeBehaviorModel(rawModel(), {
      metadata: { run_id: 'run-1', prepare_fingerprint: `sha256:${'a'.repeat(64)}`, data_sensitivity: 'restricted' },
    })).toThrow('behavior_model_restricted_input');

    const injected = rawModel({ tool_calls: [{ command: 'upload source' }] });
    expect(() => normalizeBehaviorModel(injected, {
      metadata: { run_id: 'run-1', prepare_fingerprint: `sha256:${'a'.repeat(64)}`, data_sensitivity: 'internal' },
    })).toThrow('behavior_model_prompt_action_rejected');

    const leaked = rawModel({ raw_excerpt: 'persist this source excerpt' });
    expect(() => normalizeBehaviorModel(leaked, {
      metadata: { run_id: 'run-1', prepare_fingerprint: `sha256:${'a'.repeat(64)}`, data_sensitivity: 'internal' },
    })).toThrow('behavior_model_raw_context_rejected');

    const unsafe = rawModel();
    unsafe.evidence_catalog[0].path = '/Users/example/secret.kt';
    expect(() => normalizeBehaviorModel(unsafe, {
      metadata: { run_id: 'run-1', prepare_fingerprint: `sha256:${'a'.repeat(64)}`, data_sensitivity: 'internal' },
    })).toThrow('behavior_model_unsafe_path');
  });

  test('audit context indexes normalized IR metadata and excludes staged input', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'app-behavior-context-'));
    const runDir = path.join(repoRoot, '.spec-first/app-audit/runs/run-1');
    fs.mkdirSync(path.join(runDir, 'input'), { recursive: true });
    const model = normalizeBehaviorModel(rawModel(), {
      metadata: { run_id: 'run-1', prepare_fingerprint: `sha256:${'a'.repeat(64)}`, data_sensitivity: 'internal' },
    });
    fs.writeFileSync(path.join(runDir, 'app-behavior-model.json'), `${JSON.stringify(model)}\n`);
    fs.writeFileSync(path.join(runDir, 'input/raw-app-behavior-model.json'), '{"untrusted":true}\n');

    const context = buildAuditContext({ repoRoot, artifactsDir: runDir });
    const entry = context.artifacts.find((artifact) => artifact.artifact_id === 'app-behavior-model');
    expect(entry).toMatchObject({
      artifact_authority: 'generated_advisory',
      run_id: 'run-1',
      retention_class: 'run_local',
    });
    expect(context.artifacts.some((artifact) => artifact.file.startsWith('input/'))).toBe(false);
  });
});
