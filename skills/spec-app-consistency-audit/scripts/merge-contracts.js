#!/usr/bin/env node
'use strict';

const path = require('node:path');

const {
  ISSUE_SYNTHESIS_STATUSES,
  makeArtifact,
  parseCommonArgs,
  redactForArtifactText,
  readArtifact,
  sourceInputFromFile,
  unavailableSourceInput,
  publicPath,
  unique,
  writeJsonOutput,
} = require('./lib/audit-utils');

const PROJECT_EVIDENCE_SOURCES = new Set([
  'prd',
  'product',
  'figma',
  'design',
  'code',
  'git_diff',
  'route',
  'architecture',
  'engineering_quality',
  'analytics',
  'i18n',
  'tech_plan',
  'task_doc',
  'runtime_validation',
]);

const SEVERITY_ORDER = {
  blocker: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};
const CLAIM_FAMILY_REQUIREMENTS = {
  product_alignment: [['prd', 'product'], ['code']],
  design_alignment: [['figma', 'design'], ['code']],
  product_design_code_alignment: [['prd', 'product'], ['figma', 'design'], ['code']],
  architecture_static: [['code', 'route', 'architecture', 'engineering_quality', 'contract']],
  architecture_intent_conformance: [['tech_plan'], ['code', 'architecture']],
  task_fidelity: [['task_doc'], ['code', 'git_diff']],
  analytics_static: [['analytics', 'code']],
  analytics_requirement_alignment: [['prd', 'product'], ['analytics', 'code']],
  i18n_static: [['i18n', 'code']],
  industry_compliance: [['code', 'route', 'analytics', 'i18n', 'architecture']],
  runtime_behavior: [['runtime_validation']],
};
const CODE_REVIEW_SEVERITY = {
  blocker: 'P1',
  high: 'P1',
  medium: 'P2',
  low: 'P3',
  info: 'P3',
};
const TRACEABLE_EVIDENCE_FIELDS = ['file', 'path', 'artifact_id', 'node_id', 'route', 'event', 'key'];
const CONFIRMED_INDUSTRY_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const CONFIRMED_CONFIDENCE_THRESHOLD = 0.75;

function mergeContracts(options = {}) {
  const artifactPaths = options.artifacts || [];
  const artifacts = artifactPaths.map((filePath) => ({
    file: path.resolve(filePath),
    artifact: readArtifact(filePath),
  }));
  const mergedSourceInputs = artifacts.flatMap((entry) => entry.artifact.source_inputs || []);
  const degradedModes = artifacts.flatMap((entry) => entry.artifact.degraded_modes || []);

  return makeArtifact({
    schemaVersion: 'merged-app-audit-context.v1',
    artifactId: 'merged-app-audit-context',
    sourceInputs: mergedSourceInputs.length > 0
      ? mergedSourceInputs
      : [unavailableSourceInput('artifacts', 'artifacts', 'artifact_inputs_missing')],
    body: {
      artifact_count: artifacts.length,
      artifacts: artifacts.map((entry) => ({
        artifact_id: entry.artifact.artifact_id || null,
        schema_version: entry.artifact.schema_version || null,
        contract_status: entry.artifact.contract_status || null,
        file: publicPath(options.repoRoot || process.cwd(), entry.file, 'artifact-outside-repo'),
      })),
      coverage: buildCoverage(artifacts.map((entry) => entry.artifact)),
      degraded_modes: degradedModes,
      extraction_notes: [
        'Merged context preserves source artifact status and does not promote candidate facts to confirmed issues.',
      ],
    },
  });
}

function applyEvidenceGate(issues, options = {}) {
  return issues.map((inputIssue) => {
    const issue = normalizeIssue(inputIssue, options);
    const allEvidence = collectIssueEvidence(issue);
    const projectEvidence = collectProjectEvidence(issue);
    const rulePackEvidence = collectRulePackEvidence(issue);
    if (allEvidence.length === 0) {
      return rejectIssue(issue, {
        reason: 'issue_requires_evidence_or_provenance',
        projectEvidence,
        rulePackEvidence,
      });
    }
    if (issue.contract_status === 'confirmed' && !issue.claim_family) {
      return rejectIssue(issue, {
        reason: 'confirmed_issue_requires_claim_family',
        projectEvidence,
        rulePackEvidence,
      });
    }
    if (issue.contract_status === 'confirmed' && projectEvidence.length === 0) {
      return rejectIssue(issue, {
        reason: 'confirmed_issue_requires_project_specific_evidence',
        projectEvidence,
        rulePackEvidence,
      });
    }
    if (issue.contract_status === 'confirmed'
      && issue.claim_family === 'industry_compliance'
      && !isIndustryConfirmed(issue, options)) {
      return rejectIssue(issue, {
        reason: 'industry_confirmed_issue_requires_confirmed_industry_profile',
        projectEvidence,
        rulePackEvidence,
      });
    }
    if (issue.contract_status === 'confirmed' && issue.confidence < CONFIRMED_CONFIDENCE_THRESHOLD) {
      return {
        ...issue,
        contract_status: 'candidate',
        static_confirmed: false,
        evidence_gate: {
          passed: false,
          reason: 'confirmed_issue_confidence_below_threshold',
          project_evidence_count: projectEvidence.length,
          rule_pack_evidence_count: rulePackEvidence.length,
          confidence_threshold: CONFIRMED_CONFIDENCE_THRESHOLD,
        },
        review_lifecycle: appendLifecycle(issue, {
          stage: 'deterministic_evidence_gate',
          action: 'downgraded',
          reason_code: 'confirmed_issue_confidence_below_threshold',
          confidence_threshold: CONFIRMED_CONFIDENCE_THRESHOLD,
        }),
      };
    }
    const missingEvidenceSources = missingRequiredEvidenceSources(issue);
    if (issue.contract_status === 'confirmed' && missingEvidenceSources.length > 0) {
      return {
        ...issue,
        contract_status: 'candidate',
        static_confirmed: false,
        missing_evidence_sources: missingEvidenceSources,
        evidence_gate: {
          passed: false,
          reason: 'claim_family_required_evidence_missing',
          project_evidence_count: projectEvidence.length,
          rule_pack_evidence_count: rulePackEvidence.length,
        },
        review_lifecycle: appendLifecycle(issue, {
          stage: 'deterministic_evidence_gate',
          action: 'downgraded',
          reason_code: 'claim_family_required_evidence_missing',
          missing_evidence_sources: missingEvidenceSources,
        }),
      };
    }
    return {
      ...issue,
      missing_evidence_sources: [],
      evidence_gate: {
        passed: true,
        reason: projectEvidence.length > 0
          ? 'project_specific_evidence_present'
          : 'non_confirmed_issue_has_advisory_evidence_only',
        project_evidence_count: projectEvidence.length,
        rule_pack_evidence_count: rulePackEvidence.length,
      },
      review_lifecycle: appendLifecycle(issue, {
        stage: 'deterministic_evidence_gate',
        action: 'accepted',
        reason_code: projectEvidence.length > 0
          ? 'project_specific_evidence_present'
          : 'advisory_evidence_only',
      }),
    };
  });
}

function buildAuditReport(options = {}) {
  const artifacts = (options.artifacts || []).map((filePath) => readArtifact(filePath));
  const pilotValidation = options.pilotValidation ? readArtifact(options.pilotValidation) : null;
  const inputIssueArtifacts = (options.issues || []).map((filePath) => readArtifact(filePath));
  const gatedIssues = gateInputIssues(options);
  const acceptedIssues = gatedIssues.filter((issue) => issue.contract_status !== 'rejected');
  const rejectedIssues = gatedIssues.filter((issue) => issue.contract_status === 'rejected');
  const scopeAndDegradedModes = artifacts.flatMap((artifact) => artifact.degraded_modes || []);
  const writebackPreview = buildWritebackPreview(artifacts, acceptedIssues, options);
  const sourceInputs = [
    ...artifacts.flatMap((artifact) => artifact.source_inputs || []),
    ...(options.issues || []).map((filePath) => sourceInputFromFile('issues', filePath, options.repoRoot || process.cwd())),
    ...(options.pilotValidation ? [sourceInputFromFile('pilot-validation', options.pilotValidation, options.repoRoot || process.cwd())] : []),
  ];

  return makeArtifact({
    schemaVersion: 'spec-app-consistency-audit-report.v1',
    artifactId: 'audit-report',
    sourceInputs: sourceInputs.length > 0
      ? sourceInputs
      : [unavailableSourceInput('artifacts', 'artifacts', 'artifact_inputs_missing')],
    body: {
      issue_synthesis_status: resolveIssueSynthesisStatus(options, inputIssueArtifacts),
      summary: summarizeIssues(acceptedIssues, rejectedIssues),
      scope_and_degraded_modes: scopeAndDegradedModes,
      issues: sortIssues(acceptedIssues),
      rejected_issues: rejectedIssues,
      section_coverage: buildCoverage(artifacts),
      regression_suggestions: buildRegressionSuggestions(acceptedIssues),
      writeback_preview: writebackPreview,
      mvp_validation: buildMvpValidationGate({
        issues: acceptedIssues,
        scope_and_degraded_modes: scopeAndDegradedModes,
        section_coverage: buildCoverage(artifacts),
        writeback_preview: writebackPreview,
        pilot_validation: pilotValidation,
      }),
    },
  });
}

function buildIssuesArtifact(options = {}) {
  const inputIssueArtifacts = (options.issues || []).map((filePath) => readArtifact(filePath));
  const gatedIssues = gateInputIssues(options);
  const acceptedIssues = gatedIssues.filter((issue) => issue.contract_status !== 'rejected');
  const rejectedIssues = gatedIssues.filter((issue) => issue.contract_status === 'rejected');
  const sourceInputs = (options.issues || []).map((filePath) => sourceInputFromFile('issues', filePath, options.repoRoot || process.cwd()));
  return makeArtifact({
    schemaVersion: 'spec-app-consistency-audit-issues.v1',
    artifactId: 'issues',
    sourceInputs: sourceInputs.length > 0
      ? sourceInputs
      : [unavailableSourceInput('issues', 'issues', 'issue_inputs_missing')],
    consumers: ['report-writer'],
    body: {
      issue_synthesis_status: resolveIssueSynthesisStatus(options, inputIssueArtifacts),
      issues: sortIssues(acceptedIssues),
      rejected_issues: rejectedIssues,
      summary: summarizeIssues(acceptedIssues, rejectedIssues),
    },
  });
}

function resolveIssueSynthesisStatus(options, inputArtifacts) {
  if (options && typeof options.issueSynthesisStatus === 'string'
    && ISSUE_SYNTHESIS_STATUSES.has(options.issueSynthesisStatus)) {
    return options.issueSynthesisStatus;
  }
  for (const artifact of inputArtifacts || []) {
    if (artifact && typeof artifact.issue_synthesis_status === 'string'
      && ISSUE_SYNTHESIS_STATUSES.has(artifact.issue_synthesis_status)) {
      return artifact.issue_synthesis_status;
    }
  }
  return 'not_run';
}

function gateInputIssues(options = {}) {
  const inputArtifacts = (options.issues || []).map((filePath) => readArtifact(filePath));
  const rawIssues = inputArtifacts.flatMap((input) => {
    return Array.isArray(input) ? input : (input.issues || []);
  });
  const upstreamRejected = inputArtifacts.flatMap((input) => {
    if (Array.isArray(input)) return [];
    return Array.isArray(input.rejected_issues) ? input.rejected_issues : [];
  });
  const gatedIssues = applyEvidenceGate(rawIssues, {
    fromCodeReview: options.fromCodeReview,
    repoRoot: options.repoRoot,
    source: options.source,
    runId: options.runId,
    confirmedIndustry: options.confirmedIndustry,
  });
  const rejectedIssues = upstreamRejected.map((issue) => normalizeRejectedIssue(issue, options));
  return [...gatedIssues, ...rejectedIssues];
}

function normalizeRejectedIssue(issue, options = {}) {
  const normalized = normalizeIssue({
    ...issue,
    contract_status: 'rejected',
    static_confirmed: false,
  }, options);
  return {
    ...normalized,
    contract_status: 'rejected',
    static_confirmed: false,
    evidence_gate: normalized.evidence_gate || {
      passed: false,
      reason: 'rejected_by_upstream_issues_artifact',
      project_evidence_count: collectProjectEvidence(normalized).length,
      rule_pack_evidence_count: collectRulePackEvidence(normalized).length,
    },
    review_lifecycle: appendLifecycle(normalized, {
      stage: 'deterministic_evidence_gate',
      action: 'preserved',
      reason_code: 'rejected_by_upstream_issues_artifact',
    }),
  };
}

function buildMvpValidationGate(report) {
  const coverage = report.section_coverage || {};
  const issues = report.issues || [];
  const writeback = report.writeback_preview || {};
  const pilot = buildPilotValidationGate(report);
  const localGate = {
    static_first: true,
    has_page_route_section: Boolean(coverage.page_routes),
    has_engineering_quality_section: Boolean(coverage.engineering_quality),
    has_static_result: issues.length === 0 || issues.every((issue) => issue.evidence_gate && issue.evidence_gate.passed),
    writeback_preview_only: writeback.mode === 'preview_only' && writeback.auto_apply === false,
    evidence_gate_enforced: issues.every((issue) => !issue.evidence_gate || issue.evidence_gate.passed),
  };
  return {
    ...localGate,
    pilot_validation: pilot,
    ready_for_v0_2: Object.values(localGate).every(Boolean) && pilot.ready_for_v0_2,
  };
}

function buildPilotValidationGate(report) {
  const pilot = report.pilot_validation || null;
  if (!pilot) {
    return {
      pilot_recorded: false,
      has_real_or_historical_sample: false,
      has_static_confirmed_issue: false,
      has_two_source_evidence_issue: false,
      has_issue_counts: false,
      has_manual_confirmation_metrics: false,
      has_pre_runtime_fix_count: false,
      rule_pack_only_hits_downgraded: false,
      ready_for_v0_2: false,
    };
  }

  const issues = Array.isArray(pilot.static_confirmed_issues) && pilot.static_confirmed_issues.length > 0
    ? pilot.static_confirmed_issues
    : (report.issues || []);
  const hasTwoSourceEvidenceIssue = issues.some((issue) => {
    const sources = new Set(collectProjectEvidence(issue).map((entry) => entry.source));
    const matched = ['prd', 'figma', 'code'].filter((source) => sources.has(source));
    return issue.static_confirmed === true && matched.length >= 2;
  });
  const hasIssueCounts = ['confirmed_issue_count', 'rejected_issue_count', 'advisory_issue_count']
    .every((key) => Number.isFinite(pilot[key]));
  const hasManualConfirmationMetrics = Number.isFinite(pilot.manual_confirmation_rate)
    && Array.isArray(pilot.false_positive_reasons);

  const result = {
    pilot_recorded: true,
    has_real_or_historical_sample: pilot.sample_type === 'real_app' || pilot.sample_type === 'historical_app',
    has_static_confirmed_issue: issues.some((issue) => issue.static_confirmed === true),
    has_two_source_evidence_issue: hasTwoSourceEvidenceIssue,
    has_issue_counts: hasIssueCounts,
    has_manual_confirmation_metrics: hasManualConfirmationMetrics,
    has_pre_runtime_fix_count: Number.isFinite(pilot.pre_runtime_fixable_count),
    rule_pack_only_hits_downgraded: pilot.rule_pack_only_hits_downgraded === true,
  };

  return {
    ...result,
    ready_for_v0_2: Object.values(result).every(Boolean),
  };
}

function normalizeIssue(issue, options = {}) {
  const normalized = {
    ...pickIssueScalarFields(issue),
    title: redactForArtifactText(issue.title || issue.id || 'App consistency audit finding', { maxLength: 240 }),
    severity: normalizeSeverity(issue.severity),
    contract_status: issue.contract_status || 'candidate',
    confidence: normalizeConfidence(issue.confidence),
    impact: normalizeTextArray(issue.impact || 'App consistency risk requires review.').map((entry) => redactForArtifactText(entry, { maxLength: 500 })),
    recommendation: normalizeTextArray(issue.recommendation || 'Review and align the affected App contract.').map((entry) => redactForArtifactText(entry, { maxLength: 500 })),
    affected_surface: issue.affected_surface && typeof issue.affected_surface === 'object' && !Array.isArray(issue.affected_surface)
      ? sanitizeAffectedSurface(issue.affected_surface, options)
      : { type: 'unknown', id: issue.id || 'unknown', file: 'unknown' },
    evidence: sanitizeEvidence(issue.evidence, options),
    provenance: sanitizeEvidenceArray(issue.provenance, undefined, options),
    related_rule_packs: Array.isArray(issue.related_rule_packs) ? issue.related_rule_packs : [],
    runtime_verification: issue.runtime_verification && typeof issue.runtime_verification === 'object'
      ? sanitizeRuntimeVerification(issue.runtime_verification)
      : { required: Boolean(issue.requires_runtime_verification), level: 'simulator', reason: 'Runtime verification requirement was not specified.' },
    validation_status: issue.validation_status || 'not_required',
    data_sensitivity: issue.data_sensitivity || 'internal',
    review_lifecycle: appendLifecycle(issue, {
      stage: 'normalize',
      action: 'accepted',
      reason_code: 'required_fields_normalized',
    }),
  };
  if (typeof normalized.static_confirmed !== 'boolean') {
    normalized.static_confirmed = normalized.contract_status === 'confirmed';
  }
  if (normalized.contract_status !== 'confirmed') {
    normalized.static_confirmed = false;
  } else if (normalized.static_confirmed !== true) {
    normalized.static_confirmed = true;
  }
  if (typeof normalized.requires_runtime_verification !== 'boolean') {
    normalized.requires_runtime_verification = Boolean(normalized.runtime_verification.required);
  }
  if (typeof normalized.requires_real_device !== 'boolean') {
    normalized.requires_real_device = normalized.runtime_verification.level === 'real_device';
  }
  if ((options.fromCodeReview || issue.code_review_handoff) && (!issue.code_review_handoff || issue.code_review_handoff.enabled !== false)) {
    normalized.code_review_handoff = buildCodeReviewHandoff(normalized, options);
  }
  if (issue.evidence_gate && typeof issue.evidence_gate === 'object' && !Array.isArray(issue.evidence_gate)) {
    normalized.evidence_gate = sanitizeIssueObject(issue.evidence_gate, options);
  }
  if (Array.isArray(issue.missing_evidence_sources)) {
    normalized.missing_evidence_sources = normalizeTextArray(issue.missing_evidence_sources)
      .map((entry) => redactForArtifactText(entry, { maxLength: 160 }));
  }
  return normalized;
}

function pickIssueScalarFields(issue) {
  const result = {};
  for (const field of ['id', 'category', 'claim_family', 'claim_type', 'expert']) {
    if (typeof issue[field] === 'string' && issue[field].length > 0) {
      result[field] = redactForArtifactText(issue[field], { maxLength: 240 });
    }
  }
  for (const field of ['static_confirmed', 'requires_runtime_verification', 'requires_real_device']) {
    if (typeof issue[field] === 'boolean') {
      result[field] = issue[field];
    }
  }
  return result;
}

function rejectIssue(issue, details) {
  return {
    ...issue,
    contract_status: 'rejected',
    static_confirmed: false,
    evidence_gate: {
      passed: false,
      reason: details.reason,
      project_evidence_count: details.projectEvidence.length,
      rule_pack_evidence_count: details.rulePackEvidence.length,
    },
    review_lifecycle: appendLifecycle(issue, {
      stage: 'deterministic_evidence_gate',
      action: 'rejected',
      reason_code: details.reason,
    }),
  };
}

function appendLifecycle(issue, entry) {
  const lifecycle = Array.isArray(issue.review_lifecycle) ? issue.review_lifecycle : [];
  const key = `${entry.stage}:${entry.action}:${entry.reason_code || entry.reason || ''}`;
  const exists = lifecycle.some((current) => `${current.stage}:${current.action}:${current.reason_code || current.reason || ''}` === key);
  return exists ? lifecycle : [...lifecycle, entry];
}

function missingRequiredEvidenceSources(issue) {
  const requirements = CLAIM_FAMILY_REQUIREMENTS[issue.claim_family] || [];
  if (requirements.length === 0) return [];
  const evidenceSources = new Set(collectProjectEvidence(issue).map((entry) => entry.source));
  return requirements
    .filter((aliases) => !aliases.some((source) => evidenceSources.has(source)))
    .map((aliases) => aliases.join('|'));
}

function isIndustryConfirmed(issue, options) {
  return typeof options.confirmedIndustry === 'string'
    && CONFIRMED_INDUSTRY_PATTERN.test(options.confirmedIndustry);
}

function buildCodeReviewHandoff(issue, options = {}) {
  return {
    enabled: true,
    severity: CODE_REVIEW_SEVERITY[normalizeSeverity(issue.severity)] || 'P2',
    autofix_class: issue.severity === 'low' || issue.severity === 'info' ? 'advisory' : 'manual',
    owner: issue.severity === 'low' || issue.severity === 'info' ? 'human' : 'downstream-resolver',
    requires_verification: Boolean(issue.requires_runtime_verification || (issue.runtime_verification && issue.runtime_verification.required)),
    summary: redactForArtifactText(issue.title || issue.id || 'App consistency audit finding', { maxLength: 240 }),
    source_run_id: options.runId || issue.source_run_id || null,
    source_issue_id: issue.id || null,
  };
}

function normalizeSeverity(value) {
  const normalized = String(value || 'medium').toLowerCase();
  return SEVERITY_ORDER[normalized] === undefined ? 'medium' : normalized;
}

function normalizeConfidence(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'high') return 0.85;
  if (normalized === 'medium') return 0.6;
  if (normalized === 'low') return 0.35;
  return 0.5;
}

function normalizeTextArray(value) {
  if (Array.isArray(value)) return value.filter((entry) => typeof entry === 'string' && entry.length > 0);
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
}

function collectProjectEvidence(issue) {
  const entries = [];
  const evidence = issue.evidence || {};
  if (Array.isArray(evidence)) {
    entries.push(...evidence.filter(isProjectEvidence));
  }
  for (const [source, values] of Object.entries(evidence)) {
    if (Array.isArray(values)) {
      entries.push(...values.map((entry) => ({ source, ...entry })).filter(isProjectEvidence));
    }
  }
  const provenance = Array.isArray(issue.provenance) ? issue.provenance : [];
  for (const entry of provenance) {
    if (isProjectEvidence(entry)) entries.push(entry);
  }
  return entries;
}

function collectRulePackEvidence(issue) {
  const evidence = issue.evidence || {};
  const entries = [];
  if (Array.isArray(evidence)) {
    entries.push(...evidence.filter(isRulePackEvidence));
  }
  if (evidence && typeof evidence === 'object' && !Array.isArray(evidence)) {
    for (const [source, values] of Object.entries(evidence)) {
      if (Array.isArray(values)) {
        entries.push(...values.map((entry) => ({ source, ...entry })).filter(isRulePackEvidence));
      }
    }
  }
  if (Array.isArray(evidence.rule_pack)) entries.push(...evidence.rule_pack);
  if (Array.isArray(evidence.rule_pack_selection)) entries.push(...evidence.rule_pack_selection);
  if (Array.isArray(issue.related_rule_packs)) entries.push(...issue.related_rule_packs.map((name) => ({ source: 'rule_pack', name })));
  return entries;
}

function collectIssueEvidence(issue) {
  const evidence = issue.evidence || {};
  const entries = [];
  if (Array.isArray(evidence)) entries.push(...evidence);
  if (evidence && typeof evidence === 'object' && !Array.isArray(evidence)) {
    for (const [source, values] of Object.entries(evidence)) {
      if (Array.isArray(values)) entries.push(...values.map((entry) => ({ source, ...entry })));
    }
  }
  if (Array.isArray(issue.provenance)) entries.push(...issue.provenance);
  return entries.filter((entry) => entry && typeof entry === 'object');
}

function isProjectEvidence(entry) {
  if (!entry || typeof entry !== 'object') return false;
  if (isRulePackEvidence(entry)) return false;
  if (PROJECT_EVIDENCE_SOURCES.has(entry.source)) return hasTraceableEvidenceField(entry);
  if (entry.source !== 'contract') return false;
  return hasTraceableEvidenceField(entry);
}

function hasTraceableEvidenceField(entry) {
  return TRACEABLE_EVIDENCE_FIELDS.some((field) => {
    const value = entry[field];
    return typeof value === 'string' && value.length > 0;
  });
}

function isRulePackEvidence(entry) {
  if (!entry || typeof entry !== 'object') return false;
  return entry.source === 'rule_pack'
    || entry.source === 'rule_pack_selection'
    || Boolean(entry.rule_pack || entry.rule_pack_name);
}

function buildCoverage(artifacts) {
  return {
    product: artifacts.some((artifact) => artifact.artifact_id === 'product-contract'),
    figma: artifacts.some((artifact) => artifact.artifact_id === 'figma-design-contract'),
    code: artifacts.some((artifact) => artifact.artifact_id === 'codebase-contract'),
    page_routes: artifacts.some((artifact) => artifact.artifact_id === 'page-route-contract'),
    architecture: artifacts.some((artifact) => artifact.artifact_id === 'kmp-architecture-contract'),
    engineering_quality: artifacts.some((artifact) => artifact.artifact_id === 'engineering-quality-contract'),
    components: artifacts.some((artifact) => artifact.artifact_id === 'component-contract'),
    modules: artifacts.some((artifact) => artifact.artifact_id === 'module-contract'),
    analytics: artifacts.some((artifact) => artifact.artifact_id === 'analytics-contract'),
    i18n: artifacts.some((artifact) => artifact.artifact_id === 'i18n-contract'),
    industry: artifacts.some((artifact) => artifact.artifact_id === 'industry-profile'),
    rule_packs: artifacts.some((artifact) => artifact.artifact_id === 'rule-pack-selection'),
  };
}

function summarizeIssues(issues, rejectedIssues) {
  return {
    blocker_count: issues.filter((issue) => issue.severity === 'blocker').length,
    high_count: issues.filter((issue) => issue.severity === 'high').length,
    medium_count: issues.filter((issue) => issue.severity === 'medium').length,
    low_count: issues.filter((issue) => issue.severity === 'low').length,
    rejected_count: rejectedIssues.length,
    static_confirmed_count: issues.filter((issue) => issue.static_confirmed === true).length,
    candidate_count: issues.filter((issue) => issue.contract_status === 'candidate').length,
    code_review_handoff_count: issues.filter((issue) => issue.code_review_handoff && issue.code_review_handoff.enabled).length,
  };
}

function sortIssues(issues) {
  return [...issues].sort((left, right) => {
    const severity = (SEVERITY_ORDER[left.severity] ?? 99) - (SEVERITY_ORDER[right.severity] ?? 99);
    if (severity !== 0) return severity;
    return String(left.id || left.title || '').localeCompare(String(right.id || right.title || ''));
  });
}

function buildRegressionSuggestions(issues) {
  return issues.map((issue) => ({
    issue_id: issue.id || null,
    category: issue.category || 'app_consistency',
    suggestion: `Add regression coverage for: ${issue.title || issue.category || 'app consistency issue'}`,
    evidence_sources: unique(collectProjectEvidence(issue).map((entry) => entry.source)),
    status: 'candidate',
  }));
}

function buildWritebackPreview(artifacts, issues, options = {}) {
  const domains = buildCoverage(artifacts);
  const repoRoot = options.repoRoot || options.source || process.cwd();
  const inferredRunDir = options.runDir || (options.output ? path.dirname(path.resolve(options.output)) : '');
  const base = inferredRunDir
    ? publicPath(repoRoot, inferredRunDir, 'run-outside-repo')
    : path.posix.join('.spec-first/app-audit/runs', options.runId || '<run-id>');
  const previewBase = path.posix.join(base, 'writeback-preview');
  return {
    mode: 'preview_only',
    auto_apply: false,
    paths: [
      path.posix.join(previewBase, 'repo-profile.patch.yaml'),
      path.posix.join(previewBase, 'suggested-standards.md'),
    ],
    suggested_profile_updates: {
      app_audit_domains_seen: Object.entries(domains).filter(([, present]) => present).map(([domain]) => domain),
      issue_categories_seen: unique(issues.map((issue) => issue.category || 'uncategorized')),
    },
  };
}

function sanitizeAffectedSurface(surface, options = {}) {
  return {
    type: redactForArtifactText(surface.type || 'unknown', { maxLength: 120 }),
    id: redactForArtifactText(surface.id || 'unknown', { maxLength: 240 }),
    file: sanitizePathLike(surface.file || 'unknown', options),
  };
}

function sanitizeEvidence(evidence, options = {}) {
  if (Array.isArray(evidence)) return sanitizeEvidenceArray(evidence, undefined, options);
  if (!evidence || typeof evidence !== 'object') return evidence;
  return Object.fromEntries(Object.entries(evidence)
    .filter(([, values]) => Array.isArray(values))
    .map(([source, values]) => [source, sanitizeEvidenceArray(values, source, options)]));
}

function sanitizeEvidenceArray(values, source, options = {}) {
  if (!Array.isArray(values)) return [];
  return values
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => sanitizeEvidenceEntry(source ? { source, ...entry } : entry, options));
}

function sanitizeEvidenceEntry(entry, options = {}) {
  const sanitized = {};
  for (const field of ['source', 'summary', 'file', 'path', 'artifact_id', 'node_id', 'route', 'event', 'key', 'rule_pack', 'rule_pack_name', 'name']) {
    if (typeof entry[field] === 'string') {
      sanitized[field] = field === 'file' || field === 'path'
        ? sanitizePathLike(entry[field], options)
        : redactForArtifactText(entry[field], { maxLength: field === 'summary' ? 500 : 240 });
    }
  }
  return sanitized;
}

function sanitizePathLike(value, options = {}) {
  const raw = String(value || '');
  const redacted = redactForArtifactText(raw, { maxLength: 240 });
  if (redacted !== raw) return redacted;
  if (/^[A-Za-z]:[\\/]/.test(raw)) return '<issue-path:redacted>';
  if (path.isAbsolute(raw)) {
    return publicPath(options.repoRoot || options.source || process.cwd(), raw, 'issue-outside-repo');
  }
  return redacted;
}

function sanitizeRuntimeVerification(runtimeVerification) {
  return {
    required: Boolean(runtimeVerification.required),
    reason: redactForArtifactText(runtimeVerification.reason || '', { maxLength: 500 }),
    level: redactForArtifactText(runtimeVerification.level || 'simulator', { maxLength: 80 }),
  };
}

function sanitizeIssueObject(value, options = {}) {
  if (Array.isArray(value)) return value.map((entry) => sanitizeIssueObject(entry, options));
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string') return redactForArtifactText(value, { maxLength: 500 });
    return value;
  }
  return Object.fromEntries(Object.entries(value).map(([key, child]) => {
    if (key === 'file' || key === 'path') return [key, sanitizePathLike(child, options)];
    return [key, sanitizeIssueObject(child, options)];
  }));
}

if (require.main === module) {
  try {
    const options = parseCommonArgs(process.argv.slice(2));
    const result = options.issuesArtifact
      ? buildIssuesArtifact(options)
      : (options.issue || options.issues ? buildAuditReport(options) : mergeContracts(options));
    writeJsonOutput(result, options.output, options);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  applyEvidenceGate,
  buildAuditReport,
  buildCodeReviewHandoff,
  buildIssuesArtifact,
  buildMvpValidationGate,
  buildPilotValidationGate,
  mergeContracts,
  normalizeIssue,
};
