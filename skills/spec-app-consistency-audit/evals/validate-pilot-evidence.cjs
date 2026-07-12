#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const SCHEMA_VERSION = 'app-assurance-promotion-evidence.v1';
const ARMS = ['current_code_review', 'current_app_audit', 'candidate_compiler'];
const VERDICTS = new Set(['promote', 'continue_trial', 'contract_to_lens']);
const METRICS = [
  'incremental_confirmed_findings', 'pre_runtime_fixable_count', 'confirmed_precision',
  'runtime_escape_count', 'critical_journey_coverage', 'verification_plan_executability',
  'human_review_minutes', 'duration_ms', 'tokens', 'artifact_bytes',
  'high_impact_false_positives', 'permission_violations',
];
const COUNT_METRICS = new Set([
  'incremental_confirmed_findings', 'pre_runtime_fixable_count', 'runtime_escape_count',
  'human_review_minutes', 'duration_ms', 'tokens', 'artifact_bytes',
  'high_impact_false_positives', 'permission_violations',
]);
const RATIO_METRICS = new Set(['confirmed_precision', 'critical_journey_coverage', 'verification_plan_executability']);

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function safeRelative(value) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value)) return false;
  return !value.replace(/\\/g, '/').split('/').some((part) => part === '..' || part === '');
}

function hasSymlinkSegment(bundleRoot, relativePath) {
  let current = bundleRoot;
  for (const segment of relativePath.replace(/\\/g, '/').split('/')) {
    current = path.join(current, segment);
    try { if (fs.lstatSync(current).isSymbolicLink()) return true; } catch { return false; }
  }
  return false;
}

function validateRef(bundleRoot, ref, label, errors) {
  if (!ref || !safeRelative(ref.path) || !/^[a-f0-9]{64}$/.test(ref.sha256 || '')) {
    errors.push(`${label} must contain a safe path and lowercase SHA-256`);
    return;
  }
  const absolute = path.resolve(bundleRoot, ref.path);
  const relative = path.relative(bundleRoot, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    errors.push(`${label}.path escapes bundle root`);
    return;
  }
  if (hasSymlinkSegment(bundleRoot, ref.path)) {
    errors.push(`${label}.path must not contain symlinks`);
    return;
  }
  try {
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('not regular');
    const realRoot = fs.realpathSync(bundleRoot);
    const realFile = fs.realpathSync(absolute);
    const realRelative = path.relative(realRoot, realFile);
    if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) throw new Error('realpath escape');
    if (sha256File(absolute) !== ref.sha256) errors.push(`${label}.sha256 mismatch`);
  } catch {
    errors.push(`${label}.path must reference a regular file`);
  }
}

function validateMetrics(metrics, label, errors) {
  if (!metrics || typeof metrics !== 'object') {
    errors.push(`${label}.metrics is required`);
    return;
  }
  for (const field of METRICS) {
    if (typeof metrics[field] !== 'number' || !Number.isFinite(metrics[field]) || metrics[field] < 0) {
      errors.push(`${label}.metrics.${field} must be a non-negative number`);
    } else if (COUNT_METRICS.has(field) && !Number.isInteger(metrics[field])) {
      errors.push(`${label}.metrics.${field} must be an integer`);
    } else if (RATIO_METRICS.has(field) && metrics[field] > 1) {
      errors.push(`${label}.metrics.${field} must be between 0 and 1`);
    }
  }
}

function validatePilotEvidence(manifest, bundleRoot) {
  const errors = [];
  const blockers = [];
  if (!manifest || manifest.schema_version !== SCHEMA_VERSION) errors.push(`schema_version must be ${SCHEMA_VERSION}`);
  if (!VERDICTS.has(manifest.verdict)) errors.push('verdict must be promote, continue_trial, or contract_to_lens');
  if (!manifest.decision || typeof manifest.decision.owner !== 'string' || !manifest.decision.owner
    || typeof manifest.decision.rationale !== 'string' || !manifest.decision.rationale) {
    errors.push('decision owner and rationale are required');
  }
  validateRef(bundleRoot, manifest.inputs && manifest.inputs.case_set, 'inputs.case_set', errors);
  validateRef(bundleRoot, manifest.inputs && manifest.inputs.rubric, 'inputs.rubric', errors);

  const samples = Array.isArray(manifest.samples) ? manifest.samples : [];
  let candidateIncrementalFindings = 0;
  let candidatePreRuntimeFixable = 0;
  let candidateExecutablePlans = 0;
  if (samples.length < 3 || samples.length > 5) blockers.push('representative_sample_count_not_met');
  const ids = new Set();
  for (const [index, sample] of samples.entries()) {
    const label = `samples[${index}]`;
    if (!sample || typeof sample.sample_id !== 'string' || !sample.sample_id || ids.has(sample.sample_id)) {
      errors.push(`${label}.sample_id must be unique`);
      continue;
    }
    ids.add(sample.sample_id);
    if (!['real_app', 'historical_app', 'authorized_redacted', 'synthetic_fixture'].includes(sample.provenance)) {
      errors.push(`${label}.provenance is invalid`);
    }
    if (sample.provenance === 'synthetic_fixture') blockers.push('field_sample_evidence_missing');
    if (!/^sha256:[a-f0-9]{64}$/.test(sample.source_hash || '')) errors.push(`${label}.source_hash is invalid`);
    if (!Array.isArray(sample.allowed_evidence) || sample.allowed_evidence.length === 0) errors.push(`${label}.allowed_evidence is required`);
    const arms = sample.arms || {};
    for (const armId of ARMS) {
      const arm = arms[armId];
      if (!arm) {
        errors.push(`${label}.arms.${armId} is required`);
        continue;
      }
      if (arm.source_hash !== sample.source_hash) errors.push(`${label}.arms.${armId}.source_hash mismatch`);
      if (JSON.stringify(arm.allowed_evidence) !== JSON.stringify(sample.allowed_evidence)) {
        errors.push(`${label}.arms.${armId}.allowed_evidence mismatch`);
      }
      if (!Number.isInteger(arm.repeat_count) || arm.repeat_count < 1) errors.push(`${label}.arms.${armId}.repeat_count must be >= 1`);
      validateRef(bundleRoot, arm.output, `${label}.arms.${armId}.output`, errors);
      validateMetrics(arm.metrics, `${label}.arms.${armId}`, errors);
      if (armId === 'candidate_compiler' && arm.metrics) {
        candidateIncrementalFindings += arm.metrics.incremental_confirmed_findings || 0;
        candidatePreRuntimeFixable += arm.metrics.pre_runtime_fixable_count || 0;
        candidateExecutablePlans += arm.metrics.verification_plan_executability || 0;
      }
      if ((arm.metrics && arm.metrics.high_impact_false_positives > 0)) blockers.push('high_impact_false_positive_observed');
      if ((arm.metrics && arm.metrics.permission_violations > 0)) blockers.push('permission_violation_observed');
    }
  }

  const blindReview = manifest.blind_review || {};
  if (blindReview.identity_revealed_before_scoring !== false) errors.push('blind_review must keep identity hidden until scoring');
  const reviewers = Array.isArray(blindReview.reviewers) ? blindReview.reviewers : [];
  if (reviewers.length < 2) blockers.push('independent_blind_review_missing');
  const reviewerIds = new Set();
  reviewers.forEach((reviewer, index) => {
    if (!reviewer || typeof reviewer.reviewer_id !== 'string' || !reviewer.reviewer_id || reviewerIds.has(reviewer.reviewer_id)
      || reviewer.independent_from_implementation !== true || reviewer.arm_identity_hidden_until_scoring !== true
      || !Array.isArray(reviewer.sample_ids) || reviewer.sample_ids.length !== ids.size
      || reviewer.sample_ids.some((id) => !ids.has(id)) || new Set(reviewer.sample_ids).size !== ids.size
      || !Array.isArray(reviewer.arm_labels) || reviewer.arm_labels.length !== ARMS.length
      || new Set(reviewer.arm_labels).size !== ARMS.length) {
      blockers.push('independent_blind_review_invalid');
    } else {
      reviewerIds.add(reviewer.reviewer_id);
    }
    validateRef(bundleRoot, reviewer && reviewer.receipt, `blind_review.reviewers[${index}].receipt`, errors);
  });

  const adoption = manifest.independent_developer_adoption || {};
  if (adoption.status !== 'passed') blockers.push('independent_developer_adoption_missing');
  if (adoption.status === 'passed' && (adoption.independent_from_implementation !== true
    || adoption.public_entry_invoked !== true
    || adoption.selected_inputs_without_coaching !== true
    || adoption.explained_limitations !== true
    || adoption.next_action_correct !== true)) {
    blockers.push('independent_developer_adoption_invalid');
  }
  if (adoption.receipt) validateRef(bundleRoot, adoption.receipt, 'independent_developer_adoption.receipt', errors);
  if (!adoption.receipt && adoption.status === 'passed') errors.push('passed adoption requires a receipt');

  const controls = manifest.generation_controls || {};
  if (controls.known_defect_labels_withheld !== true) blockers.push('known_defect_isolation_unproven');
  if (candidateIncrementalFindings <= 0) blockers.push('incremental_confirmed_value_missing');
  if (candidatePreRuntimeFixable <= 0) blockers.push('pre_runtime_fixable_value_missing');
  if (candidateExecutablePlans <= 0) blockers.push('verification_executability_missing');
  if (!manifest.decision || manifest.decision.cost_accepted !== true) blockers.push('owner_cost_acceptance_missing');
  if (!manifest.decision || manifest.decision.owner_acceptance !== true) blockers.push('owner_acceptance_missing');

  const uniqueBlockers = [...new Set(blockers)];
  if (manifest.verdict === 'promote' && uniqueBlockers.length > 0) {
    errors.push(`promote blocked: ${uniqueBlockers.join(', ')}`);
  }
  if (manifest.verdict === 'continue_trial') {
    if (!manifest.closeout || !manifest.closeout.reevaluate_by
      || !Array.isArray(manifest.closeout.required_evidence) || manifest.closeout.required_evidence.length === 0
      || manifest.decision.integration_authorized !== false) {
      errors.push('continue_trial requires reevaluation evidence and integration_authorized:false');
    }
  }
  if (manifest.verdict === 'contract_to_lens' && (!manifest.closeout || manifest.closeout.action !== 'contract_to_lens')) {
    errors.push('contract_to_lens requires an explicit closeout action');
  }

  return {
    schema_version: 'app-assurance-promotion-validation.v1',
    valid: errors.length === 0,
    verdict: manifest.verdict || null,
    promotion_eligible: errors.length === 0 && manifest.verdict === 'promote' && uniqueBlockers.length === 0,
    integration_authorized: errors.length === 0 && manifest.decision && manifest.decision.integration_authorized === true,
    blockers: uniqueBlockers,
    errors,
  };
}

function main(argv) {
  const bundleIndex = argv.indexOf('--bundle');
  const manifestIndex = argv.indexOf('--manifest');
  if (bundleIndex < 0) throw new Error('usage: validate-pilot-evidence.cjs --bundle <dir> [--manifest <file>]');
  const bundleRoot = path.resolve(argv[bundleIndex + 1]);
  const manifestPath = manifestIndex >= 0 ? path.resolve(argv[manifestIndex + 1]) : path.join(bundleRoot, 'manifest.json');
  const result = validatePilotEvidence(JSON.parse(fs.readFileSync(manifestPath, 'utf8')), bundleRoot);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.valid) process.exitCode = 1;
}

if (require.main === module) {
  try { main(process.argv.slice(2)); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}

module.exports = { ARMS, COUNT_METRICS, METRICS, RATIO_METRICS, SCHEMA_VERSION, hasSymlinkSegment, sha256File, validatePilotEvidence };
