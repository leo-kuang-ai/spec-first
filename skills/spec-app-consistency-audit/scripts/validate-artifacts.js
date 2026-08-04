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
const REJECTED_ISSUE_REASON_ACTIONS = new Set(['rejected', 'preserved']);
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
  validateKnownContractArtifact(artifact, errors);

  return {
    valid: errors.length === 0,
    errors,
  };
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
    artifact.rejected_issues.forEach((issue, index) => validateRejectedIssue(issue, index, errors, options));
  }
  if (!Array.isArray(artifact.scope_and_degraded_modes)) {
    errors.push(error('scope_and_degraded_modes', 'scope_degraded_modes_required', 'audit report must expose scope_and_degraded_modes.'));
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
  if (!Array.isArray(artifact.issues)) {
    errors.push(error('issues', 'issues_array_required', 'issues artifact must include issues array.'));
  } else {
    artifact.issues.forEach((issue, index) => validateAuditIssue(issue, index, errors, { ...options, strictIssues: true }));
  }
  if (!Array.isArray(artifact.rejected_issues)) {
    errors.push(error('rejected_issues', 'rejected_issues_array_required', 'issues artifact must include rejected_issues array.'));
  } else {
    artifact.rejected_issues.forEach((issue, index) => validateRejectedIssue(issue, index, errors, options));
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
}

// rejected_issues is the deterministic evidence gate's own degradation output: the inputs it
// exists to absorb (no evidence, no claim_family) can never satisfy the strict issue schema, so
// strict validation here would make the graceful path unreachable and fail the whole run.
// Validate identity, the rejection reason_code, and redaction instead, so a headless audit can
// finish and report the degradation honestly.
function validateRejectedIssue(issue, index, errors, options = {}) {
  const prefix = options.issuePrefix || `rejected_issues[${index}]`;
  if (!issue || typeof issue !== 'object' || Array.isArray(issue)) {
    errors.push(error(prefix, 'issue_not_object', 'rejected issue must be an object.'));
    return;
  }
  for (const field of ['title', 'severity', 'data_sensitivity']) {
    requireString(issue, field, errors, prefix);
  }
  if (typeof issue.severity === 'string' && !ISSUE_SEVERITIES.has(issue.severity)) {
    errors.push(error(`${prefix}.severity`, 'invalid_issue_severity', `${prefix}.severity is invalid.`));
  }
  if (issue.contract_status !== 'rejected') {
    errors.push(error(`${prefix}.contract_status`, 'rejected_issue_contract_status_required', 'rejected issue contract_status must be rejected.'));
  }
  if (issue.static_confirmed !== false) {
    errors.push(error(`${prefix}.static_confirmed`, 'rejected_issue_must_not_be_static_confirmed', 'rejected issue must set static_confirmed to false.'));
  }
  if (!rejectedIssueReasonCode(issue)) {
    errors.push(error(
      `${prefix}.evidence_gate.reason`,
      'rejected_issue_reason_code_required',
      'rejected issue must carry a rejection reason_code in evidence_gate.reason or review_lifecycle.',
    ));
  }
  if (!Array.isArray(issue.review_lifecycle) || issue.review_lifecycle.length === 0) {
    errors.push(error(`${prefix}.review_lifecycle`, 'review_lifecycle_required', 'rejected issue must include review_lifecycle.'));
  }
  validateArtifactText(issue.title, `${prefix}.title`, errors, 240);
  for (const field of ['impact', 'recommendation']) {
    const value = issue[field];
    if (Array.isArray(value)) {
      value.forEach((entry, entryIndex) => validateArtifactText(entry, `${prefix}.${field}[${entryIndex}]`, errors, 500));
    } else {
      validateArtifactText(value, `${prefix}.${field}`, errors, 500);
    }
  }
  if (Array.isArray(issue.provenance)) {
    issue.provenance.forEach((entry, entryIndex) => validateTraceableEvidenceEntry(
      entry,
      `${prefix}.provenance[${entryIndex}]`,
      errors,
      { requireSource: false, requireTrace: false },
    ));
  }
  validateEvidenceArtifactText(issue.evidence, `${prefix}.evidence`, errors, {
    requireSource: false,
    requireTrace: false,
  });
  if (issue.affected_surface && typeof issue.affected_surface === 'object' && !Array.isArray(issue.affected_surface)) {
    validateArtifactPath(issue.affected_surface.file, `${prefix}.affected_surface.file`, errors);
  }
}

function rejectedIssueReasonCode(issue) {
  const gate = issue.evidence_gate;
  if (gate && typeof gate === 'object' && !Array.isArray(gate)
    && typeof gate.reason === 'string' && gate.reason.length > 0) {
    return gate.reason;
  }
  if (!Array.isArray(issue.review_lifecycle)) return '';
  const entry = issue.review_lifecycle.find((current) => current
    && typeof current === 'object'
    && REJECTED_ISSUE_REASON_ACTIONS.has(current.action)
    && typeof current.reason_code === 'string'
    && current.reason_code.length > 0);
  return entry ? entry.reason_code : '';
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

function validateEvidenceArtifactText(evidence, prefix, errors, options = {}) {
  const requireSource = options.requireSource !== false;
  const requireTrace = options.requireTrace !== false;
  if (Array.isArray(evidence)) {
    evidence.forEach((entry, index) => {
      validateTraceableEvidenceEntry(entry, `${prefix}[${index}]`, errors, { requireSource, requireTrace });
    });
    return;
  }
  if (!evidence || typeof evidence !== 'object') return;
  for (const [bucket, values] of Object.entries(evidence)) {
    if (!Array.isArray(values)) continue;
    values.forEach((entry, index) => {
      validateTraceableEvidenceEntry(entry, `${prefix}.${bucket}[${index}]`, errors, { bucket, requireTrace });
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
  if (options.requireTrace !== false && !hasTraceableEvidenceField(entry)) {
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
  validateAuditIssue,
  validateAuditReportArtifact,
  validatePreflightArtifact,
  validateRejectedIssue,
};
