'use strict';

const { normalizeBehaviorModel } = require('../../../skills/spec-app-consistency-audit/scripts/normalize-behavior-model');

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

function behaviorModel() {
  const fingerprint = `sha256:${'a'.repeat(64)}`;
  const raw = {
    run_id: 'run-u3',
    prepare_fingerprint: fingerprint,
    producer_receipt: { producer_kind: 'fresh_host_llm', input_hashes: [`sha256:${'d'.repeat(64)}`] },
    scope: {
      changed_feature_refs: ['feature-checkout'],
      selected_journey_refs: ['journey-checkout'],
      platform_scope: ['android', 'ios'],
      selection_source: 'user_override',
      selection_rationale: ['Explicit changed journey.'],
      omitted_journey_candidates: [],
    },
    evidence_catalog: [{
      id: 'ev-code', source_kind: 'code', path: 'shared/CheckoutViewModel.kt',
      source_hash: `sha256:${'b'.repeat(64)}`, freshness: 'current-worktree',
      summary: 'Checkout state reducer.', limitations: [],
    }],
    entities: {
      features: [semantic('feature-checkout')],
      journeys: [{
        ...semantic('journey-checkout'), feature_ref: 'feature-checkout',
        entry: { surface_ref: 'surface-checkout', state_ref: 'state-ready', preconditions: [] },
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
    identity_candidates: [], contradictions: [],
    extensions: { state_semantics: [{ state_ref: 'state-error', lifecycle: 'transient', recoverability: 'recoverable' }] },
    coverage: {
      included_sources: ['code'], omitted_sources: ['figma'], platforms_evaluable: ['android', 'ios'],
      platforms_not_evaluable: [], design_alignment: 'not_evaluable',
      conclusion_caps: ['design_alignment:not_evaluable'], limitations: ['No Figma.'],
    },
  };
  return normalizeBehaviorModel(raw, {
    metadata: { run_id: 'run-u3', prepare_fingerprint: fingerprint, data_sensitivity: 'internal' },
  });
}

module.exports = { behaviorModel };
