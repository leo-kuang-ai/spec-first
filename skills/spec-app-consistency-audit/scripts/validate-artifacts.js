#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  APP_AUDIT_METADATA_HOSTS,
  ISSUE_SYNTHESIS_STATUSES,
  isGeneratedOrControlPath,
} = require('./lib/audit-utils');

const ARTIFACT_CONTRACT_STATUSES = new Set(['candidate', 'confirmed', 'rejected', 'degraded']);
const DATA_SENSITIVITY_VALUES = new Set(['public', 'internal', 'confidential', 'restricted']);
const RUNTIME_MODES = new Set(['static_only', 'runtime_suggested', 'real_device_suggested']);
const ISSUE_SEVERITIES = new Set(['blocker', 'high', 'medium', 'low', 'info']);
const ISSUE_CONTRACT_STATUSES = new Set(['candidate', 'confirmed', 'rejected']);
const VALIDATION_STATUSES = new Set(['not_required', 'validated', 'validator_rejected', 'validator_unavailable']);
const SENSITIVE_TEXT_PATTERN = /(https?:\/\/|Authorization\s*[:=]|Bearer\s+|Cookie\s*[:=]|(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|token|secret|password|passwd|session(?:id)?|jwt)\s*[:=])/i;
const METADATA_HOSTS = new Set(APP_AUDIT_METADATA_HOSTS);
const DIFF_SCOPE_KINDS = new Set(['git_diff', 'working_tree', 'source_snapshot']);
const METADATA_STATUSES = new Set(['started', 'complete', 'degraded', 'failed']);
const TRACEABLE_EVIDENCE_FIELDS = ['file', 'path', 'artifact_id', 'node_id', 'route', 'event', 'key'];
const PUBLIC_PLACEHOLDER_PATTERN = /^<[A-Za-z0-9._:-]+>$/;
const FIGMA_REFERENCE_PATH_PATTERN = /^figma-(?:ref|node|file):[a-f0-9]{12}$/;
const SECRET_PATH_PATTERN = /(?:^|\/)(?:\.env(?:\.|$)|\.npmrc$|\.pypirc$|\.netrc$|\.git-credentials$|.*(?:token|secret|credentials|password|apikey|api_key).*|.*\.(?:pem|key|p12|pfx|keystore|kdbx|mobileprovision|cer)$)/i;

function validateArtifact(artifact, options = {}) {
  const errors = [];
  const requireCandidate = options.requireCandidate !== false;

  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    return {
      valid: false,
      errors: [error('artifact', 'artifact_not_object', 'Artifact must be a JSON object.')],
    };
  }

  requireString(artifact, 'schema_version', errors);
  requireString(artifact, 'artifact_id', errors);
  requireString(artifact, 'generated_at', errors);
  if (typeof artifact.generated_at === 'string' && Number.isNaN(Date.parse(artifact.generated_at))) {
    errors.push(error('generated_at', 'invalid_timestamp', 'generated_at must be an ISO-compatible timestamp.'));
  }

  if (!Array.isArray(artifact.source_inputs) || artifact.source_inputs.length === 0) {
    errors.push(error('source_inputs', 'source_inputs_required', 'source_inputs must be a non-empty array.'));
  } else {
    artifact.source_inputs.forEach((source, index) => validateSourceInput(source, index, errors));
  }

  if (!Array.isArray(artifact.consumers) || artifact.consumers.length === 0) {
    errors.push(error('consumers', 'consumers_required', 'consumers must be a non-empty array.'));
  } else if (artifact.consumers.some((consumer) => typeof consumer !== 'string' || consumer.length === 0)) {
    errors.push(error('consumers', 'invalid_consumer', 'consumers must contain non-empty strings.'));
  }

  if (!ARTIFACT_CONTRACT_STATUSES.has(artifact.contract_status)) {
    errors.push(error('contract_status', 'invalid_contract_status', 'contract_status is invalid.'));
  }
  if (requireCandidate && artifact.contract_status !== 'candidate') {
    errors.push(error('contract_status', 'script_artifact_must_be_candidate', 'Script-produced artifacts must stay candidate.'));
  }

  if (!DATA_SENSITIVITY_VALUES.has(artifact.data_sensitivity)) {
    errors.push(error('data_sensitivity', 'invalid_data_sensitivity', 'data_sensitivity is invalid.'));
  }

  if (artifact.artifact_id === 'preflight' || artifact.schema_version === 'spec-app-consistency-audit-preflight.v1') {
    validatePreflightArtifact(artifact, errors);
  }
  if (artifact.artifact_id === 'audit-report' || artifact.schema_version === 'spec-app-consistency-audit-report.v1') {
    validateAuditReportArtifact(artifact, errors, options);
  }
  if (artifact.artifact_id === 'issues' || artifact.schema_version === 'spec-app-consistency-audit-issues.v1') {
    validateIssuesArtifact(artifact, errors, options);
  }
  if (artifact.artifact_id === 'app-behavior-model' || artifact.schema_version === 'app-behavior-model.v1') {
    validateAppBehaviorModelArtifact(artifact, errors);
  }
  if (artifact.artifact_id === 'proof-obligations' || artifact.schema_version === 'app-proof-obligations.v1') {
    validateProofObligationsArtifact(artifact, errors);
  }
  if (artifact.artifact_id === 'counterexamples' || artifact.schema_version === 'app-counterexamples.v1') {
    validateCounterexamplesArtifact(artifact, errors);
  }
  if (artifact.artifact_id === 'verification-plan' || artifact.schema_version === 'verification-plan.v1') {
    validateVerificationPlanArtifact(artifact, errors);
  }
  validateKnownContractArtifact(artifact, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateVerificationPlanArtifact(artifact, errors) {
  requireSchemaVersion(artifact, 'verification-plan.v1', errors);
  if (artifact.artifact_id !== 'verification-plan') errors.push(error('artifact_id', 'verification_artifact_id_invalid', 'artifact_id must be verification-plan.'));
  if (artifact.artifact_authority !== 'generated_advisory' || artifact.execution_authority !== 'not_run'
    || artifact.verification_execution_status !== 'not_run') {
    errors.push(error('execution_authority', 'verification_execution_authority_invalid', 'Generated verification plans must remain not_run advisory artifacts.'));
  }
  requireObject(artifact, 'input_refs', errors);
  requireObject(artifact, 'compiler_receipt', errors);
  requireObject(artifact, 'capability_snapshot', errors);
  requireObject(artifact, 'coverage', errors);
  requireArray(artifact, 'tasks', errors);
  for (const [index, task] of (artifact.tasks || []).entries()) {
    const prefix = `tasks[${index}]`;
    for (const field of ['id', 'verification_kind', 'execution_environment', 'target_platform', 'permission', 'data_sensitivity', 'sensitive_action_class', 'status']) requireString(task, field, errors, prefix);
    for (const field of ['claim_refs', 'preconditions', 'inputs', 'actions', 'required_capabilities', 'capability_evidence_refs', 'lower_cost_rejections', 'limitations']) requireArray(task, field, errors, prefix);
    requireObject(task, 'oracle', errors, prefix);
    if (!['not_run', 'blocked'].includes(task.status)) errors.push(error(`${prefix}.status`, 'verification_execution_claim_rejected', 'Task status must remain not_run or blocked.'));
  }
}

function validateProofObligationsArtifact(artifact, errors) {
  requireSchemaVersion(artifact, 'app-proof-obligations.v1', errors);
  if (artifact.artifact_id !== 'proof-obligations') errors.push(error('artifact_id', 'proof_artifact_id_invalid', 'artifact_id must be proof-obligations.'));
  if (artifact.artifact_authority !== 'mixed_per_item') errors.push(error('artifact_authority', 'proof_container_authority_invalid', 'Proof authority must remain per obligation.'));
  if (artifact.retention_class !== 'run_local') errors.push(error('retention_class', 'proof_retention_invalid', 'Proof obligations must be run_local.'));
  requireString(artifact, 'run_id', errors);
  requireString(artifact, 'prepare_fingerprint', errors);
  requireObject(artifact, 'behavior_model_ref', errors);
  requireObject(artifact, 'semantic_input_receipt', errors);
  requireObject(artifact, 'coverage', errors);
  requireArray(artifact, 'obligations', errors);
  requireArray(artifact, 'limitations', errors);
  if (artifact.behavior_model_ref && !/^sha256:[a-f0-9]{64}$/.test(artifact.behavior_model_ref.content_hash || '')) {
    errors.push(error('behavior_model_ref.content_hash', 'proof_behavior_model_hash_invalid', 'Proof obligations require a script-computed Behavior IR hash.'));
  }
  if (artifact.semantic_input_receipt) {
    if (artifact.semantic_input_receipt.hash_authority !== 'script_computed') errors.push(error('semantic_input_receipt.hash_authority', 'proof_receipt_hash_authority_invalid', 'Input hashes must be script-computed.'));
    if (!Array.isArray(artifact.semantic_input_receipt.input_hashes) || artifact.semantic_input_receipt.input_hashes.length === 0
      || artifact.semantic_input_receipt.input_hashes.some((entry) => !/^sha256:[a-f0-9]{64}$/.test(entry))) {
      errors.push(error('semantic_input_receipt.input_hashes', 'proof_receipt_hash_invalid', 'Input receipt requires SHA-256 hashes.'));
    }
  }
  const ids = new Set();
  for (const [index, obligation] of (artifact.obligations || []).entries()) {
    const prefix = `obligations[${index}]`;
    for (const field of ['id', 'category', 'statement', 'platform_scope', 'producer_kind', 'assessment_authority', 'assessment', 'freshness', 'conclusion_cap']) {
      requireString(obligation, field, errors, prefix);
    }
    requireArray(obligation, 'model_refs', errors, prefix);
    requireArray(obligation, 'required_evidence', errors, prefix);
    requireArray(obligation, 'evidence_refs', errors, prefix);
    requireArray(obligation, 'limitations', errors, prefix);
    requireObject(obligation, 'minimum_verification', errors, prefix);
    if (ids.has(obligation.id)) errors.push(error(`${prefix}.id`, 'proof_duplicate_id', `Duplicate obligation ID: ${obligation.id}.`));
    ids.add(obligation.id);
    if (obligation.assessment_authority === 'script_confirmed'
      && (obligation.producer_kind !== 'script' || !['reference_integrity', 'evidence_integrity', 'freshness_integrity'].includes(obligation.category))) {
      errors.push(error(`${prefix}.assessment_authority`, 'proof_authority_escalation', 'script_confirmed is limited to script-produced mechanical obligations.'));
    }
    if (obligation.assessment_authority === 'not_assessed' && obligation.assessment !== 'unresolved') {
      errors.push(error(`${prefix}.assessment`, 'proof_unassessed_must_be_unresolved', 'Unassessed obligations must remain unresolved.'));
    }
    validateAbsenceClaim(obligation, prefix, errors);
  }
  if (artifact.coverage && artifact.coverage.budget) {
    const budget = artifact.coverage.budget;
    if (budget.emitted !== (artifact.obligations || []).length) errors.push(error('coverage.budget.emitted', 'proof_budget_count_mismatch', 'Budget emitted count must match obligations length.'));
    if (budget.exhausted !== ((artifact.coverage.omitted_obligations || []).length > 0)) errors.push(error('coverage.budget.exhausted', 'proof_budget_exhaustion_mismatch', 'Budget exhausted must match omitted obligations.'));
  }
}

function validateAbsenceClaim(obligation, prefix, errors) {
  const absence = obligation.absence_claim;
  if (absence === null || absence === undefined) return;
  if (!absence || typeof absence !== 'object' || Array.isArray(absence)) {
    errors.push(error(`${prefix}.absence_claim`, 'proof_absence_claim_invalid', 'absence_claim must be an object or null.'));
    return;
  }
  requireArray(absence, 'expected_evidence_refs', errors, `${prefix}.absence_claim`);
  requireObject(absence, 'negative_evidence_scope', errors, `${prefix}.absence_claim`);
  requireString(absence, 'coverage_cap', errors, `${prefix}.absence_claim`);
  requireArray(absence, 'reason_codes', errors, `${prefix}.absence_claim`);
  const scope = absence.negative_evidence_scope || {};
  for (const field of ['source_roots', 'file_patterns', 'symbols', 'tools', 'platform_sources']) {
    if (!Array.isArray(scope[field]) || scope[field].length > 100) {
      errors.push(error(`${prefix}.absence_claim.negative_evidence_scope.${field}`, 'proof_absence_scope_array_invalid', `${field} must be an array with at most 100 entries.`));
      continue;
    }
    scope[field].forEach((entry, index) => {
      const entryPath = `${prefix}.absence_claim.negative_evidence_scope.${field}[${index}]`;
      validateArtifactText(entry, entryPath, errors, 240);
      if (['source_roots', 'file_patterns'].includes(field)
        && (path.isAbsolute(entry) || /^[A-Za-z]:[\\/]/.test(entry) || entry.split(/[\\/]/).includes('..') || SECRET_PATH_PATTERN.test(entry))) {
        errors.push(error(entryPath, 'proof_absence_scope_path_unsafe', 'Absence search paths must be safe, repo-relative and non-secret.'));
      }
    });
  }
  const incomplete = (absence.expected_evidence_refs || []).length === 0
    || !Array.isArray(scope.source_roots) || scope.source_roots.length === 0
    || !Array.isArray(scope.file_patterns) || scope.file_patterns.length === 0
    || !Array.isArray(scope.tools) || scope.tools.length === 0
    || !Number.isInteger(scope.scanned_file_count) || scope.scanned_file_count <= 0
    || !Number.isInteger(scope.max_file_count) || scope.max_file_count < scope.scanned_file_count
    || !Array.isArray(scope.platform_sources) || scope.platform_sources.length === 0
    || scope.truncated === true
    || scope.generated_code_covered !== true
    || scope.dynamic_routes_covered !== true
    || scope.di_bindings_covered !== true
    || scope.provider_status !== 'ready';
  if (absence.coverage_cap === 'complete' && incomplete) {
    errors.push(error(`${prefix}.absence_claim.coverage_cap`, 'proof_absence_complete_scope_invalid', 'Complete absence coverage requires positive expectation and all deterministic coverage dimensions.'));
  }
  if (incomplete && obligation.assessment !== 'unresolved') {
    errors.push(error(`${prefix}.assessment`, 'proof_absence_incomplete_must_be_unresolved', 'Incomplete absence coverage must remain unresolved.'));
  }
}

function validateCounterexamplesArtifact(artifact, errors) {
  requireSchemaVersion(artifact, 'app-counterexamples.v1', errors);
  if (artifact.artifact_id !== 'counterexamples') errors.push(error('artifact_id', 'counterexample_artifact_id_invalid', 'artifact_id must be counterexamples.'));
  if (artifact.artifact_authority !== 'generated_advisory') errors.push(error('artifact_authority', 'counterexample_authority_invalid', 'Counterexamples must remain generated_advisory.'));
  if (artifact.retention_class !== 'run_local') errors.push(error('retention_class', 'counterexample_retention_invalid', 'Counterexamples must be run_local.'));
  requireObject(artifact, 'behavior_model_ref', errors);
  requireObject(artifact, 'proof_obligations_ref', errors);
  requireObject(artifact, 'search_receipt', errors);
  requireObject(artifact, 'coverage', errors);
  requireArray(artifact, 'counterexamples', errors);
  requireArray(artifact, 'limitations', errors);
  if (artifact.search_receipt && artifact.search_receipt.context_isolation !== 'generation_only') {
    errors.push(error('search_receipt.context_isolation', 'counterexample_context_isolation_invalid', 'U3 search receipt must be generation_only.'));
  }
  if (artifact.search_receipt) {
    if (artifact.search_receipt.hash_authority !== 'script_computed') errors.push(error('search_receipt.hash_authority', 'counterexample_receipt_hash_authority_invalid', 'Counterexample input hashes must be script-computed.'));
    if (!Array.isArray(artifact.search_receipt.input_hashes) || artifact.search_receipt.input_hashes.length !== 3
      || artifact.search_receipt.input_hashes.some((entry) => !/^sha256:[a-f0-9]{64}$/.test(entry))) {
      errors.push(error('search_receipt.input_hashes', 'counterexample_receipt_hash_invalid', 'Counterexample receipt requires model, proof and raw SHA-256 hashes.'));
    }
  }
  if (!artifact.proof_obligations_ref || !/^sha256:[a-f0-9]{64}$/.test(artifact.proof_obligations_ref.content_hash || '')) {
    errors.push(error('proof_obligations_ref.content_hash', 'counterexample_proof_hash_invalid', 'Counterexamples require the current proof artifact hash.'));
  }
  const ids = new Set();
  const keys = new Set();
  for (const [index, candidate] of (artifact.counterexamples || []).entries()) {
    const prefix = `counterexamples[${index}]`;
    for (const field of ['id', 'obligation_ref', 'platform_scope', 'expected_invariant', 'hypothesized_break', 'status', 'conclusion_cap', 'dedupe_key']) {
      requireString(candidate, field, errors, prefix);
    }
    for (const field of ['model_refs', 'preconditions', 'action_sequence', 'direct_evidence_refs', 'missing_evidence', 'limitations']) {
      requireArray(candidate, field, errors, prefix);
    }
    requireObject(candidate, 'minimum_verification', errors, prefix);
    if (candidate.status !== 'candidate') errors.push(error(`${prefix}.status`, 'counterexample_candidate_only', 'U3 counterexamples must remain candidate.'));
    if (ids.has(candidate.id)) errors.push(error(`${prefix}.id`, 'counterexample_duplicate_id', `Duplicate counterexample ID: ${candidate.id}.`));
    if (keys.has(candidate.dedupe_key)) errors.push(error(`${prefix}.dedupe_key`, 'counterexample_duplicate_key', 'Normalized counterexamples must have unique dedupe keys.'));
    ids.add(candidate.id);
    keys.add(candidate.dedupe_key);
  }
  if (artifact.coverage && artifact.coverage.budget) {
    const budget = artifact.coverage.budget;
    if (budget.emitted !== (artifact.counterexamples || []).length) errors.push(error('coverage.budget.emitted', 'counterexample_budget_count_mismatch', 'Budget emitted count must match candidate count.'));
    if (budget.exhausted !== ((artifact.coverage.omitted_counterexamples || []).length > 0)) errors.push(error('coverage.budget.exhausted', 'counterexample_budget_exhaustion_mismatch', 'Budget exhausted must match omitted candidates.'));
  }
}

function validateAppBehaviorModelArtifact(artifact, errors) {
  requireSchemaVersion(artifact, 'app-behavior-model.v1', errors);
  if (artifact.artifact_id !== 'app-behavior-model') {
    errors.push(error('artifact_id', 'invalid_behavior_model_artifact_id', 'artifact_id must be app-behavior-model.'));
  }
  if (artifact.artifact_authority !== 'generated_advisory') {
    errors.push(error('artifact_authority', 'behavior_model_authority_invalid', 'Behavior IR must remain generated_advisory.'));
  }
  if (artifact.retention_class !== 'run_local') {
    errors.push(error('retention_class', 'behavior_model_retention_invalid', 'Normalized Behavior IR must use run_local retention.'));
  }
  requireString(artifact, 'run_id', errors);
  if (typeof artifact.prepare_fingerprint !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(artifact.prepare_fingerprint)) {
    errors.push(error('prepare_fingerprint', 'behavior_model_prepare_fingerprint_invalid', 'prepare_fingerprint must be a SHA-256 fingerprint.'));
  }
  requireObject(artifact, 'scope', errors);
  requireArray(artifact, 'evidence_catalog', errors);
  requireObject(artifact, 'entities', errors);
  requireArray(artifact, 'identity_candidates', errors);
  requireArray(artifact, 'contradictions', errors);
  requireObject(artifact, 'extensions', errors);
  requireObject(artifact, 'coverage', errors);
  if (!artifact.entities || typeof artifact.entities !== 'object') return;

  const collections = ['features', 'journeys', 'surfaces', 'states', 'events', 'transitions', 'navigations', 'platform_ownership'];
  for (const collection of collections) requireArray(artifact.entities, collection, errors, 'entities');
  const evidenceIds = new Set();
  const evidenceById = new Map();
  for (const [index, entry] of (artifact.evidence_catalog || []).entries()) {
    const prefix = `evidence_catalog[${index}]`;
    requireString(entry, 'id', errors, prefix);
    requireString(entry, 'source_kind', errors, prefix);
    requireString(entry, 'path', errors, prefix);
    requireString(entry, 'freshness', errors, prefix);
    requireString(entry, 'summary', errors, prefix);
    if (typeof entry.path === 'string' && !isSafeSourceInputPath(entry.path)) {
      errors.push(error(`${prefix}.path`, 'behavior_model_unsafe_path', 'Evidence path must be safe repo-relative provenance or a redacted placeholder.'));
    }
    if (evidenceIds.has(entry.id)) errors.push(error(`${prefix}.id`, 'behavior_model_duplicate_id', `Duplicate evidence ID: ${entry.id}.`));
    evidenceIds.add(entry.id);
    evidenceById.set(entry.id, entry);
    validateArtifactText(entry.summary, `${prefix}.summary`, errors, 500);
  }

  const byCollection = {};
  const allIds = new Set(evidenceIds);
  for (const collection of collections) {
    byCollection[collection] = new Set();
    for (const [index, entry] of (artifact.entities[collection] || []).entries()) {
      const prefix = `entities.${collection}[${index}]`;
      validateBehaviorSemanticEntry(entry, prefix, evidenceIds, evidenceById, errors);
      if (allIds.has(entry.id)) errors.push(error(`${prefix}.id`, 'behavior_model_duplicate_id', `Duplicate Behavior IR ID: ${entry.id}.`));
      allIds.add(entry.id);
      byCollection[collection].add(entry.id);
    }
  }
  for (const [collection, values] of Object.entries({
    identity_candidates: artifact.identity_candidates || [],
    contradictions: artifact.contradictions || [],
  })) {
    values.forEach((entry, index) => {
      const prefix = `${collection}[${index}]`;
      validateBehaviorSemanticEntry(entry, prefix, evidenceIds, evidenceById, errors);
      if (allIds.has(entry.id)) errors.push(error(`${prefix}.id`, 'behavior_model_duplicate_id', `Duplicate Behavior IR ID: ${entry.id}.`));
      allIds.add(entry.id);
      if (collection === 'identity_candidates' && entry.match_status === 'supported' && entry.semantic_status !== 'observed') {
        errors.push(error(`${prefix}.match_status`, 'behavior_model_identity_support_requires_observation', 'Supported identity requires observed semantic evidence.'));
      }
      if (collection === 'identity_candidates' && entry.match_status === 'supported') {
        const sourceKinds = new Set((entry.evidence_refs || []).map((ref) => evidenceById.get(ref)).filter(Boolean).map((evidence) => evidence.source_kind));
        if (typeof entry.left_ref !== 'string' || typeof entry.right_ref !== 'string' || sourceKinds.size < 2) {
          errors.push(error(`${prefix}.match_status`, 'behavior_model_identity_support_requires_cross_source_evidence', 'Supported identity requires both sides and at least two source kinds.'));
        }
      }
    });
  }

  for (const [index, transition] of (artifact.entities.transitions || []).entries()) {
    const prefix = `entities.transitions[${index}]`;
    requireBehaviorRef(transition.journey_ref, byCollection.journeys, `${prefix}.journey_ref`, errors);
    requireBehaviorRef(transition.source_state_ref, byCollection.states, `${prefix}.source_state_ref`, errors);
    requireBehaviorRef(transition.target_state_ref, byCollection.states, `${prefix}.target_state_ref`, errors);
    requireBehaviorRef(transition.event_ref, byCollection.events, `${prefix}.event_ref`, errors);
    requireBehaviorRef(transition.surface_ref, byCollection.surfaces, `${prefix}.surface_ref`, errors);
  }
  for (const [index, navigation] of (artifact.entities.navigations || []).entries()) {
    const prefix = `entities.navigations[${index}]`;
    requireBehaviorRef(navigation.source_surface_ref, byCollection.surfaces, `${prefix}.source_surface_ref`, errors);
    requireBehaviorRef(navigation.target_surface_ref, byCollection.surfaces, `${prefix}.target_surface_ref`, errors);
    requireBehaviorRef(navigation.trigger_event_ref, byCollection.events, `${prefix}.trigger_event_ref`, errors);
  }
  for (const [index, ownership] of (artifact.entities.platform_ownership || []).entries()) {
    const allowed = new Set([...byCollection.surfaces, ...byCollection.states, ...byCollection.events, ...byCollection.transitions]);
    requireBehaviorRef(ownership.subject_ref, allowed, `entities.platform_ownership[${index}].subject_ref`, errors);
  }
  for (const [index, journey] of (artifact.entities.journeys || []).entries()) {
    const prefix = `entities.journeys[${index}]`;
    requireBehaviorRef(journey.feature_ref, byCollection.features, `${prefix}.feature_ref`, errors);
    if (!journey.entry || typeof journey.entry !== 'object') {
      errors.push(error(`${prefix}.entry`, 'behavior_model_incomplete_journey', 'Journey must include entry and preconditions.'));
    } else {
      requireBehaviorRef(journey.entry.surface_ref, byCollection.surfaces, `${prefix}.entry.surface_ref`, errors);
      requireBehaviorRef(journey.entry.state_ref, byCollection.states, `${prefix}.entry.state_ref`, errors);
      if (!Array.isArray(journey.entry.preconditions)) errors.push(error(`${prefix}.entry.preconditions`, 'behavior_model_incomplete_journey', 'Journey preconditions must be an array.'));
    }
    if (!Array.isArray(journey.ordered_step_refs) || journey.ordered_step_refs.length === 0) {
      errors.push(error(`${prefix}.ordered_step_refs`, 'behavior_model_incomplete_journey', 'Journey must include ordered transition steps.'));
    } else {
      journey.ordered_step_refs.forEach((ref, refIndex) => requireBehaviorRef(ref, byCollection.transitions, `${prefix}.ordered_step_refs[${refIndex}]`, errors));
      const journeyTransitions = (artifact.entities.transitions || []).filter((entry) => entry.journey_ref === journey.id);
      const transitionById = new Map(journeyTransitions.map((entry) => [entry.id, entry]));
      journey.ordered_step_refs.forEach((ref, refIndex) => {
        if (!transitionById.has(ref)) {
          errors.push(error(`${prefix}.ordered_step_refs[${refIndex}]`, 'behavior_model_cross_journey_transition', 'Ordered transition must belong to the current journey.'));
        }
      });
      const steps = journey.ordered_step_refs.map((ref) => transitionById.get(ref)).filter(Boolean);
      if (journey.entry && steps[0] && steps[0].source_state_ref !== journey.entry.state_ref) {
        errors.push(error(`${prefix}.ordered_step_refs[0]`, 'behavior_model_transition_chain_invalid', 'First transition must start at the journey entry state.'));
      }
      if (journey.entry && steps[0] && steps[0].surface_ref !== journey.entry.surface_ref) {
        errors.push(error(`${prefix}.ordered_step_refs[0]`, 'behavior_model_transition_chain_invalid', 'First transition must start on the journey entry surface.'));
      }
      for (let stepIndex = 1; stepIndex < steps.length; stepIndex += 1) {
        if (steps[stepIndex - 1].target_state_ref !== steps[stepIndex].source_state_ref) {
          errors.push(error(`${prefix}.ordered_step_refs[${stepIndex}]`, 'behavior_model_transition_chain_invalid', 'Ordered transitions must form a continuous state chain.'));
        }
      }
      const reachableStates = new Set([journey.entry && journey.entry.state_ref].filter(Boolean));
      let changed = true;
      while (changed) {
        changed = false;
        for (const transition of journeyTransitions) {
          if (reachableStates.has(transition.source_state_ref) && !reachableStates.has(transition.target_state_ref)) {
            reachableStates.add(transition.target_state_ref);
            changed = true;
          }
        }
      }
      const exitStates = [journey.happy_exit, ...(journey.failure_or_cancel_exits || [])].filter(Boolean).map((entry) => entry.state_ref);
      if (exitStates.some((stateRef) => !reachableStates.has(stateRef))) {
        errors.push(error(`${prefix}.happy_exit`, 'behavior_model_exit_unreachable', 'Every journey exit must be reachable from ordered transitions.'));
      }
    }
    validateBehaviorExit(journey.happy_exit, `${prefix}.happy_exit`, byCollection, errors, false);
    if (!Array.isArray(journey.failure_or_cancel_exits) || journey.failure_or_cancel_exits.length === 0) {
      errors.push(error(`${prefix}.failure_or_cancel_exits`, 'behavior_model_incomplete_journey', 'Journey must include at least one failure or cancel exit.'));
    } else {
      journey.failure_or_cancel_exits.forEach((entry, exitIndex) => validateBehaviorExit(entry, `${prefix}.failure_or_cancel_exits[${exitIndex}]`, byCollection, errors, true));
    }
  }

  for (const [index, ref] of ((artifact.scope && artifact.scope.changed_feature_refs) || []).entries()) {
    requireBehaviorRef(ref, byCollection.features, `scope.changed_feature_refs[${index}]`, errors);
  }
  for (const [index, ref] of ((artifact.scope && artifact.scope.selected_journey_refs) || []).entries()) {
    requireBehaviorRef(ref, byCollection.journeys, `scope.selected_journey_refs[${index}]`, errors);
  }

  const figmaMissing = artifact.coverage && Array.isArray(artifact.coverage.omitted_sources)
    && artifact.coverage.omitted_sources.includes('figma');
  if (figmaMissing && artifact.coverage.design_alignment !== 'not_evaluable') {
    errors.push(error('coverage.design_alignment', 'behavior_model_missing_figma_cap_required', 'Missing Figma requires design_alignment:not_evaluable.'));
  }
}

function validateBehaviorSemanticEntry(entry, prefix, evidenceIds, evidenceById, errors) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(error(prefix, 'behavior_model_entry_not_object', 'Behavior IR entry must be an object.'));
    return;
  }
  for (const field of ['id', 'label', 'platform_scope', 'semantic_status', 'freshness']) requireString(entry, field, errors, prefix);
  if (typeof entry.confidence !== 'number' || entry.confidence < 0 || entry.confidence > 1) {
    errors.push(error(`${prefix}.confidence`, 'behavior_model_confidence_invalid', 'confidence must be a number between 0 and 1.'));
  }
  if (!Array.isArray(entry.evidence_refs)) errors.push(error(`${prefix}.evidence_refs`, 'array_required', 'evidence_refs must be an array.'));
  else entry.evidence_refs.forEach((ref, index) => requireBehaviorRef(ref, evidenceIds, `${prefix}.evidence_refs[${index}]`, errors));
  if (!Array.isArray(entry.limitations)) errors.push(error(`${prefix}.limitations`, 'array_required', 'limitations must be an array.'));
  if (['inferred', 'contradicted', 'unknown'].includes(entry.semantic_status)
    && (!Array.isArray(entry.limitations) || entry.limitations.length === 0)) {
    errors.push(error(`${prefix}.limitations`, 'behavior_model_limitations_required', `${entry.semantic_status} entries require limitations.`));
  }
  if (entry.semantic_status === 'observed' && (!Array.isArray(entry.evidence_refs) || entry.evidence_refs.length === 0)) {
    errors.push(error(`${prefix}.evidence_refs`, 'behavior_model_observed_evidence_required', 'Observed entries require direct evidence refs.'));
  }
  if (entry.semantic_status === 'observed' && Array.isArray(entry.evidence_refs)) {
    const currentEvidence = entry.evidence_refs.map((ref) => evidenceById.get(ref)).filter((evidence) => evidence
      && evidence.freshness !== 'unavailable' && typeof evidence.source_hash === 'string');
    if (currentEvidence.length === 0) {
      errors.push(error(`${prefix}.evidence_refs`, 'behavior_model_observed_current_evidence_required', 'Observed entries require current traceable evidence with a source hash.'));
    }
    if (entry.freshness !== 'current-run') {
      errors.push(error(`${prefix}.freshness`, 'behavior_model_observed_current_freshness_required', 'Observed entries must be current-run; partial/stale/unavailable entries remain inferred or unknown.'));
    }
  }
}

function validateBehaviorExit(exitValue, prefix, byCollection, errors, requireKind) {
  if (!exitValue || typeof exitValue !== 'object' || Array.isArray(exitValue)) {
    errors.push(error(prefix, 'behavior_model_incomplete_journey', 'Journey exit must be an object.'));
    return;
  }
  if (requireKind && !['failure', 'cancel'].includes(exitValue.kind)) {
    errors.push(error(`${prefix}.kind`, 'behavior_model_incomplete_journey', 'Non-happy exit kind must be failure or cancel.'));
  }
  requireBehaviorRef(exitValue.state_ref, byCollection.states, `${prefix}.state_ref`, errors);
  if (exitValue.navigation_ref !== null && exitValue.navigation_ref !== undefined) {
    requireBehaviorRef(exitValue.navigation_ref, byCollection.navigations, `${prefix}.navigation_ref`, errors);
  }
}

function requireBehaviorRef(value, allowed, pathName, errors) {
  if (typeof value !== 'string' || !allowed.has(value)) {
    errors.push(error(pathName, 'behavior_model_dangling_ref', `Unknown Behavior IR reference: ${value || '<missing>'}.`));
  }
}

function validateSourceInput(source, index, errors) {
  const prefix = `source_inputs[${index}]`;
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    errors.push(error(prefix, 'source_input_not_object', 'source input must be an object.'));
    return;
  }
  requireString(source, 'type', errors, prefix);
  if (typeof source.path !== 'string' || source.path.length === 0) {
    errors.push(error(`${prefix}.path`, 'source_path_required', 'source input path is required.'));
  } else if (!isSafeSourceInputPath(source.path)) {
    errors.push(error(`${prefix}.path`, 'unsafe_source_path', 'source input path must be repo-relative safe provenance or a redacted placeholder.'));
  }
  const hasHash = typeof source.source_hash === 'string' && /^sha256:[a-f0-9]{64}$/.test(source.source_hash);
  const hasReason = typeof source.source_hash_unavailable_reason === 'string'
    && source.source_hash_unavailable_reason.length > 0;
  if (!hasHash && !hasReason) {
    errors.push(error(
      `${prefix}.source_hash`,
      'source_hash_or_reason_required',
      'source input must include source_hash or source_hash_unavailable_reason.',
    ));
  }
  requireString(source, 'freshness', errors, prefix);
}

function isSafeSourceInputPath(value) {
  const sourcePath = String(value);
  if (sourcePath === '.') return true;
  if (PUBLIC_PLACEHOLDER_PATTERN.test(sourcePath)) return true;
  if (FIGMA_REFERENCE_PATH_PATTERN.test(sourcePath)) return true;
  if (
    sourcePath.startsWith('/')
    || /^[A-Za-z]:/.test(sourcePath)
    || sourcePath.startsWith('~')
    || sourcePath.includes('\\')
    || sourcePath.includes('//')
    || /[\x00-\x1F\x7F*?[\]{}]/.test(sourcePath)
    || sourcePath.split('/').includes('.')
    || sourcePath.split('/').includes('..')
  ) {
    return false;
  }
  if (isGeneratedOrControlPath(sourcePath)) return false;
  if (SECRET_PATH_PATTERN.test(sourcePath)) return false;
  return true;
}

function validatePreflightArtifact(artifact, errors) {
  if (artifact.schema_version !== 'spec-app-consistency-audit-preflight.v1') {
    errors.push(error('schema_version', 'invalid_preflight_schema', 'preflight schema_version is invalid.'));
  }
  if (artifact.artifact_id !== 'preflight') {
    errors.push(error('artifact_id', 'invalid_preflight_artifact_id', 'preflight artifact_id must be preflight.'));
  }
  requireString(artifact, 'project_type', errors);
  if (!Array.isArray(artifact.platforms)) {
    errors.push(error('platforms', 'platforms_array_required', 'platforms must be an array.'));
  }
  if (!Array.isArray(artifact.architecture_candidates)) {
    errors.push(error('architecture_candidates', 'architecture_candidates_array_required', 'architecture_candidates must be an array.'));
  }
  for (const field of [
    'has_prd',
    'has_figma_context',
    'has_figma_reference',
    'has_figma_materialized_context',
    'has_analytics',
    'has_i18n',
    'has_component_system',
    'has_modular_structure',
    'has_testability_signals',
    'has_local_cache_or_storage',
    'has_security_sensitive_surfaces',
    'requires_device_by_default',
  ]) {
    if (typeof artifact[field] !== 'boolean') {
      errors.push(error(field, 'boolean_required', `${field} must be boolean.`));
    }
  }
  if (!RUNTIME_MODES.has(artifact.default_runtime_mode)) {
    errors.push(error('default_runtime_mode', 'invalid_runtime_mode', 'default_runtime_mode is invalid.'));
  }
  if (typeof artifact.figma_context_mode === 'string'
    && !['none', 'mcp_reference_only', 'materialized_json'].includes(artifact.figma_context_mode)) {
    errors.push(error('figma_context_mode', 'invalid_figma_context_mode', 'figma_context_mode is invalid.'));
  }
  if (!Array.isArray(artifact.degraded_modes)) {
    errors.push(error('degraded_modes', 'degraded_modes_array_required', 'degraded_modes must be an array.'));
  } else {
    artifact.degraded_modes.forEach((mode, index) => {
      const prefix = `degraded_modes[${index}]`;
      if (!mode || typeof mode !== 'object' || Array.isArray(mode)) {
        errors.push(error(prefix, 'degraded_mode_not_object', 'degraded mode must be an object.'));
        return;
      }
      requireString(mode, 'code', errors, prefix);
      requireString(mode, 'severity', errors, prefix);
      requireString(mode, 'summary', errors, prefix);
    });
  }
  requireObject(artifact, 'inputs', errors);
}

function validateAuditReportArtifact(artifact, errors, options = {}) {
  if (artifact.schema_version !== 'spec-app-consistency-audit-report.v1') {
    errors.push(error('schema_version', 'invalid_audit_report_schema', 'audit report schema_version is invalid.'));
  }
  if (artifact.artifact_id !== 'audit-report') {
    errors.push(error('artifact_id', 'invalid_audit_report_artifact_id', 'audit report artifact_id must be audit-report.'));
  }
  validateIssueSynthesisStatus(artifact, 'audit-report', errors);
  if (!artifact.summary || typeof artifact.summary !== 'object' || Array.isArray(artifact.summary)) {
    errors.push(error('summary', 'summary_object_required', 'audit report summary must be an object.'));
  }
  if (!Array.isArray(artifact.issues)) {
    errors.push(error('issues', 'issues_array_required', 'audit report issues must be an array.'));
  } else {
    artifact.issues.forEach((issue, index) => validateAuditIssue(issue, index, errors, { ...options, strictIssues: true }));
  }
  if (!Array.isArray(artifact.rejected_issues)) {
    errors.push(error('rejected_issues', 'rejected_issues_array_required', 'audit report must include rejected_issues array.'));
  } else {
    artifact.rejected_issues.forEach((issue, index) => validateAuditIssue(issue, index, errors, {
      ...options,
      strictIssues: true,
      issuePrefix: `rejected_issues[${index}]`,
    }));
  }
  if (!Array.isArray(artifact.scope_and_degraded_modes)) {
    errors.push(error('scope_and_degraded_modes', 'scope_degraded_modes_required', 'audit report must expose scope_and_degraded_modes.'));
  }
  if (!['not_run', 'complete', 'degraded', 'invalid_isolation', 'stale'].includes(artifact.semantic_adjudication_status)) {
    errors.push(error('semantic_adjudication_status', 'semantic_adjudication_status_invalid', 'audit report must expose a valid semantic adjudication status.'));
  }
  if (!['not_run', 'generated', 'degraded'].includes(artifact.verification_compiler_status)) {
    errors.push(error('verification_compiler_status', 'verification_compiler_status_invalid', 'Report must expose a valid verification compiler status.'));
  }
  if (artifact.verification_execution_status !== 'not_run') {
    errors.push(error('verification_execution_status', 'verification_execution_status_invalid', 'Report cannot claim verification execution.'));
  }
  for (const field of ['changed_journeys', 'unresolved_obligations', 'coverage_caps', 'report_limitations', 'verification_task_refs']) {
    if (!Array.isArray(artifact[field])) errors.push(error(field, 'array_required', `${field} must be an array.`));
  }
  if (artifact.verification_compiler_status === 'not_run'
    && Array.isArray(artifact.verification_task_refs) && artifact.verification_task_refs.length > 0) {
    errors.push(error('verification_task_refs', 'verification_task_refs_without_plan', 'not_run compiler status cannot contain verification task refs.'));
  }
  if (artifact.verification_compiler_status !== 'not_run' && !artifact.verification_plan_ref) {
    errors.push(error('verification_plan_ref', 'verification_plan_ref_required', 'Generated/degraded compiler status requires a current plan ref.'));
  }
  if (artifact.result_interpretation === 'no_findings_after_completed_adjudication'
    && (artifact.semantic_adjudication_status !== 'complete' || artifact.issues.length > 0)) {
    errors.push(error('result_interpretation', 'zero_findings_claim_invalid', 'No-findings interpretation requires completed adjudication and an empty issue set.'));
  }
}

function validateIssuesArtifact(artifact, errors, options = {}) {
  if (artifact.schema_version !== 'spec-app-consistency-audit-issues.v1') {
    errors.push(error('schema_version', 'invalid_issues_schema', 'issues artifact schema_version is invalid.'));
  }
  if (artifact.artifact_id !== 'issues') {
    errors.push(error('artifact_id', 'invalid_issues_artifact_id', 'issues artifact_id must be issues.'));
  }
  validateIssueSynthesisStatus(artifact, 'issues', errors);
  if (artifact.semantic_adjudication_status !== undefined
    && !['not_run', 'complete', 'degraded', 'invalid_isolation', 'stale'].includes(artifact.semantic_adjudication_status)) {
    errors.push(error('semantic_adjudication_status', 'semantic_adjudication_status_invalid', 'issues artifact semantic adjudication status is invalid.'));
  }
  if (!Array.isArray(artifact.issues)) {
    errors.push(error('issues', 'issues_array_required', 'issues artifact must include issues array.'));
  } else {
    artifact.issues.forEach((issue, index) => validateAuditIssue(issue, index, errors, { ...options, strictIssues: true }));
  }
  if (!Array.isArray(artifact.rejected_issues)) {
    errors.push(error('rejected_issues', 'rejected_issues_array_required', 'issues artifact must include rejected_issues array.'));
  } else {
    artifact.rejected_issues.forEach((issue, index) => validateAuditIssue(issue, index, errors, {
      ...options,
      strictIssues: true,
      issuePrefix: `rejected_issues[${index}]`,
    }));
  }
}

function validateIssueSynthesisStatus(artifact, artifactKind, errors) {
  if (typeof artifact.issue_synthesis_status !== 'string' || artifact.issue_synthesis_status.length === 0) {
    errors.push(error('issue_synthesis_status', 'issue_synthesis_status_required', `${artifactKind} must include issue_synthesis_status.`));
    return;
  }
  if (!ISSUE_SYNTHESIS_STATUSES.has(artifact.issue_synthesis_status)) {
    errors.push(error('issue_synthesis_status', 'invalid_issue_synthesis_status', `issue_synthesis_status must be one of ${[...ISSUE_SYNTHESIS_STATUSES].join(', ')}.`));
  }
}

function validateAuditIssue(issue, index, errors, options = {}) {
  const prefix = options.issuePrefix || `issues[${index}]`;
  if (!issue || typeof issue !== 'object' || Array.isArray(issue)) {
    errors.push(error(prefix, 'issue_not_object', 'audit report issue must be an object.'));
    return;
  }
  for (const field of ['id', 'title', 'severity', 'category', 'expert', 'contract_status', 'data_sensitivity']) {
    requireString(issue, field, errors, prefix);
  }
  if (typeof issue.severity === 'string' && !ISSUE_SEVERITIES.has(issue.severity)) {
    errors.push(error(`${prefix}.severity`, 'invalid_issue_severity', `${prefix}.severity is invalid.`));
  }
  if (typeof issue.contract_status === 'string' && !ISSUE_CONTRACT_STATUSES.has(issue.contract_status)) {
    errors.push(error(`${prefix}.contract_status`, 'invalid_issue_contract_status', `${prefix}.contract_status is invalid.`));
  }
  validateConfidence(issue, prefix, errors);
  validateStringOrStringArray(issue, 'impact', prefix, errors);
  validateStringOrStringArray(issue, 'recommendation', prefix, errors);
  for (const field of ['static_confirmed', 'requires_runtime_verification', 'requires_real_device']) {
    if (typeof issue[field] !== 'boolean') {
      errors.push(error(`${prefix}.${field}`, 'boolean_required', `${prefix}.${field} must be boolean.`));
    }
  }
  if (typeof issue.static_confirmed === 'boolean' && typeof issue.contract_status === 'string') {
    if (issue.contract_status === 'confirmed' && issue.static_confirmed !== true) {
      errors.push(error(`${prefix}.static_confirmed`, 'static_confirmed_contract_status_mismatch', 'confirmed issues must set static_confirmed to true.'));
    }
    if (issue.contract_status !== 'confirmed' && issue.static_confirmed !== false) {
      errors.push(error(`${prefix}.static_confirmed`, 'static_confirmed_contract_status_mismatch', 'candidate or rejected issues must set static_confirmed to false.'));
    }
  }
  if (!Array.isArray(issue.provenance) || issue.provenance.length === 0) {
    errors.push(error(`${prefix}.provenance`, 'provenance_required', 'audit report issue must include non-empty provenance.'));
  }
  if (!hasIssueEvidence(issue.evidence)) {
    errors.push(error(`${prefix}.evidence`, 'evidence_required', 'audit report issue must include non-empty evidence.'));
  }
  if (!Array.isArray(issue.related_rule_packs)) {
    errors.push(error(`${prefix}.related_rule_packs`, 'related_rule_packs_array_required', 'related_rule_packs must be an array.'));
  }
  if (!issue.runtime_verification || typeof issue.runtime_verification !== 'object' || Array.isArray(issue.runtime_verification)) {
    errors.push(error(`${prefix}.runtime_verification`, 'runtime_verification_required', 'runtime_verification must be an object.'));
  }
  if (options.strictIssues) {
    validateStrictIssueFields(issue, prefix, errors, options);
  }
  if (issue.contract_status === 'confirmed') {
    for (const field of ['model_refs', 'obligation_refs', 'counterexample_refs']) {
      if (!Array.isArray(issue[field]) || issue[field].length === 0) {
        errors.push(error(`${prefix}.${field}`, 'semantic_refs_required', `confirmed issue requires non-empty ${field}.`));
      }
    }
    if (!issue.semantic_adjudication || issue.semantic_adjudication.status !== 'accepted') {
      errors.push(error(`${prefix}.semantic_adjudication`, 'semantic_adjudication_required', 'confirmed issue requires accepted fresh adjudication.'));
    }
  }
}

function validateStrictIssueFields(issue, prefix, errors, options = {}) {
  for (const field of ['claim_family', 'claim_type', 'validation_status']) {
    requireString(issue, field, errors, prefix);
  }
  validateArtifactText(issue.title, `${prefix}.title`, errors, 240);
  if (typeof issue.confidence !== 'number' || issue.confidence < 0 || issue.confidence > 1) {
    errors.push(error(`${prefix}.confidence`, 'strict_confidence_number_required', 'strict issue confidence must be a number between 0 and 1.'));
  }
  if (!Array.isArray(issue.impact) || issue.impact.length === 0) {
    errors.push(error(`${prefix}.impact`, 'strict_impact_array_required', 'strict issue impact must be a non-empty array.'));
  } else {
    issue.impact.forEach((entry, index) => validateArtifactText(entry, `${prefix}.impact[${index}]`, errors, 500));
  }
  if (!Array.isArray(issue.recommendation) || issue.recommendation.length === 0) {
    errors.push(error(`${prefix}.recommendation`, 'strict_recommendation_array_required', 'strict issue recommendation must be a non-empty array.'));
  } else {
    issue.recommendation.forEach((entry, index) => validateArtifactText(entry, `${prefix}.recommendation[${index}]`, errors, 500));
  }
  if (!issue.affected_surface || typeof issue.affected_surface !== 'object' || Array.isArray(issue.affected_surface)) {
    errors.push(error(`${prefix}.affected_surface`, 'affected_surface_required', 'strict issue must include affected_surface object.'));
  } else {
    for (const field of ['type', 'id', 'file']) {
      requireString(issue.affected_surface, field, errors, `${prefix}.affected_surface`);
    }
  }
  if (!VALIDATION_STATUSES.has(issue.validation_status)) {
    errors.push(error(`${prefix}.validation_status`, 'invalid_validation_status', 'validation_status is invalid.'));
  }
  if (!Array.isArray(issue.review_lifecycle) || issue.review_lifecycle.length === 0) {
    errors.push(error(`${prefix}.review_lifecycle`, 'review_lifecycle_required', 'strict issue must include review_lifecycle.'));
  }
  if (options.requireCodeReviewHandoff && (!issue.code_review_handoff || issue.code_review_handoff.enabled !== true)) {
    errors.push(error(`${prefix}.code_review_handoff`, 'code_review_handoff_required', 'code-review handoff issue must include enabled code_review_handoff.'));
  }
  validateStrictIssueArtifactText(issue, prefix, errors);
}

function validateArtifactText(value, pathName, errors, maxLength) {
  if (typeof value !== 'string') return;
  if (value.length > maxLength) {
    errors.push(error(pathName, 'artifact_text_too_long', `artifact text must be at most ${maxLength} characters.`));
  }
  if (SENSITIVE_TEXT_PATTERN.test(value)) {
    errors.push(error(pathName, 'artifact_text_not_redacted', 'artifact text must not contain raw URLs or secret-bearing tokens.'));
  }
}

function validateArtifactPath(value, pathName, errors) {
  if (typeof value !== 'string' || value.length === 0) return;
  validateArtifactText(value, pathName, errors, 240);
  if (path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value)) {
    errors.push(error(pathName, 'artifact_path_not_public', 'artifact paths must be repo-relative or redacted public paths.'));
  }
}

function validateStrictIssueArtifactText(issue, prefix, errors) {
  if (Array.isArray(issue.provenance)) {
    issue.provenance.forEach((entry, index) => {
      validateTraceableEvidenceEntry(entry, `${prefix}.provenance[${index}]`, errors, { requireSource: true });
    });
  }
  validateEvidenceArtifactText(issue.evidence, `${prefix}.evidence`, errors);
  if (issue.runtime_verification && typeof issue.runtime_verification === 'object' && !Array.isArray(issue.runtime_verification)) {
    validateArtifactText(issue.runtime_verification.reason, `${prefix}.runtime_verification.reason`, errors, 500);
    validateArtifactText(issue.runtime_verification.level, `${prefix}.runtime_verification.level`, errors, 80);
  }
  if (issue.affected_surface && typeof issue.affected_surface === 'object' && !Array.isArray(issue.affected_surface)) {
    validateArtifactPath(issue.affected_surface.file, `${prefix}.affected_surface.file`, errors);
  }
}

function validateEvidenceArtifactText(evidence, prefix, errors) {
  if (Array.isArray(evidence)) {
    evidence.forEach((entry, index) => {
      validateTraceableEvidenceEntry(entry, `${prefix}[${index}]`, errors, { requireSource: true });
    });
    return;
  }
  if (!evidence || typeof evidence !== 'object') return;
  for (const [bucket, values] of Object.entries(evidence)) {
    if (!Array.isArray(values)) continue;
    values.forEach((entry, index) => {
      validateTraceableEvidenceEntry(entry, `${prefix}.${bucket}[${index}]`, errors, { bucket });
    });
  }
}

function validateTraceableEvidenceEntry(entry, pathName, errors, options = {}) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(error(pathName, 'evidence_entry_not_object', 'evidence entry must be an object.'));
    return;
  }
  if (options.requireSource && (typeof entry.source !== 'string' || entry.source.length === 0)) {
    errors.push(error(`${pathName}.source`, 'evidence_source_required', 'array-shaped evidence entries must include source.'));
  }
  if (!hasTraceableEvidenceField(entry)) {
    errors.push(error(pathName, 'evidence_trace_required', 'evidence entry must include a traceable field.'));
  }
  validateArtifactPath(entry.file, `${pathName}.file`, errors);
  validateArtifactPath(entry.path, `${pathName}.path`, errors);
  validateArtifactText(entry.summary, `${pathName}.summary`, errors, 500);
}

function hasTraceableEvidenceField(entry) {
  return TRACEABLE_EVIDENCE_FIELDS.some((field) => typeof entry[field] === 'string' && entry[field].length > 0);
}

function validateKnownContractArtifact(artifact, errors) {
  switch (artifact.artifact_id) {
    case 'product-contract':
      requireSchemaVersion(artifact, 'product-contract.v1', errors);
      requireArray(artifact, 'features', errors);
      requireArray(artifact, 'pages', errors);
      requireArray(artifact, 'degraded_modes', errors);
      break;
    case 'figma-design-contract':
      requireSchemaVersion(artifact, 'figma-design-contract.v1', errors);
      requireArray(artifact, 'screens', errors);
      requireArray(artifact, 'components', errors);
      if (typeof artifact.raw_label_policy === 'string'
        && !['strict', 'internal', 'none'].includes(artifact.raw_label_policy)) {
        errors.push(error('raw_label_policy', 'invalid_raw_label_policy', 'raw_label_policy is invalid.'));
      }
      validateFigmaContractRedaction(artifact, errors);
      break;
    case 'codebase-contract':
      requireSchemaVersion(artifact, 'codebase-contract.v1', errors);
      requireArray(artifact, 'screens', errors);
      requireArray(artifact, 'routes', errors);
      requireArray(artifact, 'view_models', errors);
      break;
    case 'page-route-contract':
      requireSchemaVersion(artifact, 'page-route-contract.v1', errors);
      requireArray(artifact, 'routes', errors);
      requireArray(artifact, 'coverage_gaps', errors);
      break;
    case 'kmp-architecture-contract':
      requireSchemaVersion(artifact, 'kmp-architecture-contract.v1', errors);
      requireArray(artifact, 'source_sets', errors);
      requireArray(artifact, 'layers', errors);
      requireArray(artifact, 'source_imports', errors);
      requireArray(artifact, 'boundary_candidates', errors);
      break;
    case 'engineering-quality-contract':
      requireSchemaVersion(artifact, 'engineering-quality-contract.v1', errors);
      requireArray(artifact, 'candidates', errors);
      if (typeof artifact.candidate_count !== 'number') {
        errors.push(error('candidate_count', 'number_required', 'candidate_count must be a number.'));
      }
      break;
    case 'component-contract':
      requireSchemaVersion(artifact, 'component-contract.v1', errors);
      requireArray(artifact, 'code_components', errors);
      requireArray(artifact, 'figma_components', errors);
      requireArray(artifact, 'component_mappings', errors);
      break;
    case 'module-contract':
      requireSchemaVersion(artifact, 'module-contract.v1', errors);
      requireArray(artifact, 'modules', errors);
      requireArray(artifact, 'dependencies', errors);
      requireArray(artifact, 'dependency_cycles', errors);
      requireArray(artifact, 'dependency_metrics', errors);
      requireArray(artifact, 'boundary_candidates', errors);
      break;
    case 'analytics-contract':
      requireSchemaVersion(artifact, 'analytics-contract.v1', errors);
      requireArray(artifact, 'events', errors);
      if (!artifact.key_path_coverage || typeof artifact.key_path_coverage !== 'object' || Array.isArray(artifact.key_path_coverage)) {
        errors.push(error('key_path_coverage', 'object_required', 'key_path_coverage must be an object.'));
      }
      break;
    case 'i18n-contract':
      requireSchemaVersion(artifact, 'i18n-contract.v1', errors);
      requireArray(artifact, 'string_resources', errors);
      requireArray(artifact, 'hardcoded_text_candidates', errors);
      requireArray(artifact, 'locale_risk_candidates', errors);
      break;
    case 'industry-profile':
      requireSchemaVersion(artifact, 'industry-profile.v1', errors);
      requireArray(artifact, 'industry_candidates', errors);
      if (typeof artifact.preview_only !== 'boolean') {
        errors.push(error('preview_only', 'boolean_required', 'preview_only must be boolean.'));
      }
      break;
    case 'rule-pack-selection':
      requireSchemaVersion(artifact, 'rule-pack-selection.v1', errors);
      requireArray(artifact, 'selected_rule_packs', errors);
      if (!artifact.confirmed_issue_policy || typeof artifact.confirmed_issue_policy !== 'object' || Array.isArray(artifact.confirmed_issue_policy)) {
        errors.push(error('confirmed_issue_policy', 'object_required', 'confirmed_issue_policy must be an object.'));
      }
      break;
    case 'merged-app-audit-context':
      requireSchemaVersion(artifact, 'merged-app-audit-context.v1', errors);
      requireArray(artifact, 'artifacts', errors);
      if (!artifact.coverage || typeof artifact.coverage !== 'object' || Array.isArray(artifact.coverage)) {
        errors.push(error('coverage', 'object_required', 'coverage must be an object.'));
      }
      break;
    case 'app-audit-context':
      requireSchemaVersion(artifact, 'spec-app-consistency-audit-context.v1', errors);
      requireString(artifact, 'artifacts_dir', errors);
      requireArray(artifact, 'artifacts', errors);
      requireArray(artifact, 'validation', errors);
      if (typeof artifact.artifact_count !== 'number') {
        errors.push(error('artifact_count', 'number_required', 'artifact_count must be a number.'));
      } else if (Array.isArray(artifact.artifacts) && artifact.artifact_count !== artifact.artifacts.length) {
        errors.push(error('artifact_count', 'artifact_count_mismatch', 'artifact_count must match artifacts.length.'));
      }
      if (typeof artifact.valid !== 'boolean') {
        errors.push(error('valid', 'boolean_required', 'valid must be boolean.'));
      }
      break;
    case 'impact-facts':
      requireSchemaVersion(artifact, 'spec-app-consistency-audit-impact-facts.v1', errors);
      requireString(artifact, 'mode', errors);
      requireObject(artifact, 'diff_scope', errors);
      requireArray(artifact, 'changed_files', errors);
      requireArray(artifact, 'candidate_signals', errors);
      requireArray(artifact, 'interaction_surface_changed', errors);
      requireObject(artifact, 'available_context', errors);
      requireObject(artifact, 'coverage_capabilities', errors);
      requireObject(artifact, 'input_expectations', errors);
      requireString(artifact, 'audit_verdict_scope', errors);
      break;
    case 'metadata':
      requireSchemaVersion(artifact, 'spec-app-consistency-audit-metadata.v1', errors);
      for (const field of ['run_id', 'host', 'mode', 'head_sha', 'diff_hash', 'diff_scope_kind', 'worktree_fingerprint', 'audit_verdict_scope', 'run_dir', 'summary_path', 'issues_path', 'status', 'started_at']) {
        requireString(artifact, field, errors);
      }
      if (typeof artifact.host === 'string' && !METADATA_HOSTS.has(artifact.host)) {
        errors.push(error('host', 'invalid_metadata_host', `metadata host must be one of: ${APP_AUDIT_METADATA_HOSTS.join(', ')}.`));
      }
      if (typeof artifact.status === 'string' && !METADATA_STATUSES.has(artifact.status)) {
        errors.push(error('status', 'invalid_metadata_status', 'metadata status is invalid.'));
      }
      if (typeof artifact.diff_scope_kind === 'string' && !DIFF_SCOPE_KINDS.has(artifact.diff_scope_kind)) {
        errors.push(error('diff_scope_kind', 'invalid_diff_scope_kind', 'diff_scope_kind is invalid.'));
      }
      requireArray(artifact, 'status_reason_codes', errors);
      requireObject(artifact, 'coverage_capabilities', errors);
      requireObject(artifact, 'input_expectations', errors);
      break;
    case 'artifact-manifest':
      requireSchemaVersion(artifact, 'spec-app-consistency-audit-artifact-manifest.v1', errors);
      requireString(artifact, 'run_id', errors);
      requireString(artifact, 'run_dir', errors);
      requireArray(artifact, 'artifacts', errors);
      if (typeof artifact.artifact_count !== 'number') {
        errors.push(error('artifact_count', 'number_required', 'artifact_count must be a number.'));
      } else if (Array.isArray(artifact.artifacts) && artifact.artifact_count !== artifact.artifacts.length) {
        errors.push(error('artifact_count', 'artifact_count_mismatch', 'artifact_count must match artifacts.length.'));
      }
      if (Array.isArray(artifact.artifacts)) {
        artifact.artifacts.forEach((entry, index) => validateManifestEntry(entry, index, errors));
      }
      break;
    case 'audit-plan':
      requireSchemaVersion(artifact, 'spec-app-consistency-audit-plan.v1', errors);
      requireObject(artifact, 'planner_guardrails', errors);
      requireArray(artifact, 'planner_decisions', errors);
      requireArray(artifact, 'selected_experts', errors);
      requireArray(artifact, 'skipped_experts', errors);
      break;
    default:
      break;
  }
}

function validateManifestEntry(entry, index, errors) {
  const prefix = `artifacts[${index}]`;
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    errors.push(error(prefix, 'manifest_entry_not_object', 'manifest entry must be an object.'));
    return;
  }
  for (const field of ['path', 'schema_version', 'artifact_id', 'producer', 'freshness', 'data_sensitivity', 'contract_status']) {
    requireString(entry, field, errors, prefix);
  }
  if (!Array.isArray(entry.consumers)) {
    errors.push(error(`${prefix}.consumers`, 'array_required', `${prefix}.consumers must be an array.`));
  }
  if (typeof entry.sha256 !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(entry.sha256)) {
    errors.push(error(`${prefix}.sha256`, 'invalid_sha256', 'manifest entry sha256 is invalid.'));
  }
}

function validateFigmaContractRedaction(artifact, errors) {
  for (const [collectionName, values] of Object.entries({
    screens: artifact.screens,
    components: artifact.components,
  })) {
    if (!Array.isArray(values)) continue;
    values.forEach((entry, index) => validateFigmaTextNode(entry, `${collectionName}[${index}]`, errors));
  }
}

function validateFigmaTextNode(value, pathName, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    const childPath = `${pathName}.${key}`;
    if (['name', 'raw_label', 'text'].includes(key)) {
      validateArtifactText(entry, childPath, errors, key === 'text' ? 500 : 240);
      continue;
    }
    if (Array.isArray(entry)) {
      entry.forEach((child, index) => validateFigmaTextNode(child, `${childPath}[${index}]`, errors));
    } else if (entry && typeof entry === 'object') {
      validateFigmaTextNode(entry, childPath, errors);
    }
  }
}

function validateConfidence(issue, prefix, errors) {
  if (typeof issue.confidence === 'string' && issue.confidence.length > 0) return;
  if (typeof issue.confidence === 'number' && issue.confidence >= 0 && issue.confidence <= 1) return;
  errors.push(error(`${prefix}.confidence`, 'confidence_required', `${prefix}.confidence must be a non-empty string or a number between 0 and 1.`));
}

function validateStringOrStringArray(object, field, prefix, errors) {
  const key = `${prefix}.${field}`;
  const value = object[field];
  if (typeof value === 'string' && value.length > 0) return;
  if (Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === 'string' && entry.length > 0)) return;
  errors.push(error(key, 'string_or_string_array_required', `${key} must be a non-empty string or non-empty string array.`));
}

function hasIssueEvidence(evidence) {
  if (Array.isArray(evidence)) return evidence.length > 0;
  if (!evidence || typeof evidence !== 'object') return false;
  return Object.values(evidence).some((value) => Array.isArray(value) && value.length > 0);
}

function validateArtifactFile(filePath, options = {}) {
  const absolutePath = path.resolve(filePath);
  const artifact = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  return {
    file: absolutePath,
    ...validateArtifact(artifact, options),
  };
}

function requireString(object, field, errors, prefix = '') {
  const key = prefix ? `${prefix}.${field}` : field;
  if (typeof object[field] !== 'string' || object[field].length === 0) {
    errors.push(error(key, 'string_required', `${key} must be a non-empty string.`));
  }
}

function requireSchemaVersion(artifact, expected, errors) {
  if (artifact.schema_version !== expected) {
    errors.push(error('schema_version', 'invalid_schema_version', `schema_version must be ${expected}.`));
  }
}

function requireArray(object, field, errors, prefix = '') {
  const key = prefix ? `${prefix}.${field}` : field;
  if (!Array.isArray(object[field])) {
    errors.push(error(key, 'array_required', `${key} must be an array.`));
  }
}

function requireObject(object, field, errors, prefix = '') {
  const key = prefix ? `${prefix}.${field}` : field;
  if (!object[field] || typeof object[field] !== 'object' || Array.isArray(object[field])) {
    errors.push(error(key, 'object_required', `${key} must be an object.`));
  }
}

function error(pathExpression, code, message) {
  return { path: pathExpression, code, message };
}

function parseArgs(argv) {
  const options = { files: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--file') options.files.push(argv[++index]);
    else if (arg === '--allow-confirmed') options.requireCandidate = false;
    else if (arg === '--strict-issues') options.strictIssues = true;
    else if (arg === '--require-code-review-handoff') options.requireCodeReviewHandoff = true;
    else if (!arg.startsWith('--')) options.files.push(arg);
  }
  return options;
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.files.length === 0) throw new Error('Usage: validate-artifacts.js <artifact.json> [...]');
    const results = options.files.map((filePath) => validateArtifactFile(filePath, options));
    const valid = results.every((result) => result.valid);
    process.stdout.write(`${JSON.stringify({ valid, results }, null, 2)}\n`);
    if (!valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  validateArtifact,
  validateArtifactFile,
  validateAppBehaviorModelArtifact,
  validateCounterexamplesArtifact,
  validateProofObligationsArtifact,
  validateVerificationPlanArtifact,
  validateAuditIssue,
  validateAuditReportArtifact,
  validatePreflightArtifact,
};
