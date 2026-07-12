#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

const {
  parseCommonArgs,
  redactForArtifactText,
  resolvePathAgainstRoot,
  resolveRepoRoot,
  resolveRunDir,
  writeJsonOutput,
} = require('./lib/audit-utils');
const { assertManagedRunCliContainment } = require('./lib/managed-run-boundary');
const { validateArtifact } = require('./validate-artifacts');

const MECHANICAL_CATEGORIES = new Set(['reference_integrity', 'evidence_integrity', 'freshness_integrity']);
const CORE_CATEGORIES = new Set(['failure_recovery', 'duplicate_submit', 'navigation_reachability', 'platform_ownership']);
const EXTENSION_LENS_BY_CATEGORY = {
  permission_lifecycle: 'permission_lifecycle',
  network_recovery: 'network_lifecycle',
  lifecycle_recovery: 'network_lifecycle',
  accessibility: 'accessibility',
  i18n: 'accessibility_i18n',
};
const CONCLUSION_CAP_ORDER = ['out_of_scope', 'advisory', 'candidate', 'confirmed'];

function buildProofObligations(options = {}) {
  const model = options.behaviorModel;
  const behaviorModelHash = options.behaviorModelHash || hashObject(model);
  const validation = validateArtifact(model);
  if (!validation.valid || model.artifact_id !== 'app-behavior-model') {
    const first = validation.errors[0] || { code: 'proof_behavior_model_invalid' };
    throw new Error(`proof_behavior_model_invalid: ${first.code}`);
  }
  if (model.data_sensitivity === 'restricted') {
    throw new Error('proof_restricted_input: restricted Behavior IR cannot be persisted into obligations.');
  }

  const maxObligations = boundedInteger(options.maxObligations, 1, 500, 100);
  const evidenceIds = new Set(model.evidence_catalog.map((entry) => entry.id));
  const modelIds = collectModelIds(model);
  const selectedJourneys = model.scope.selected_journey_refs || [];
  const generated = [];

  for (const journeyRef of selectedJourneys) {
    const journey = model.entities.journeys.find((entry) => entry.id === journeyRef);
    if (!journey) continue;
    generated.push(mechanicalIntegrityObligation(journey));
    generated.push(semanticTemplate(journey, 'failure_recovery', 'The journey failure or cancel exit preserves a recoverable and truthful user state.', 'state_transition'));
    if (journeyHasSignal(model, journey, /submit|confirm|pay|order|commit|checkout/i)) {
      generated.push(semanticTemplate(journey, 'duplicate_submit', 'Repeated submit-like events cannot create duplicate effects or contradictory in-flight states.', 'state_transition'));
    }
    if (journeyHasNavigation(model, journey)) {
      generated.push(semanticTemplate(journey, 'navigation_reachability', 'Every journey navigation and return path is reachable with the expected guard and state.', 'navigation_component'));
    }
    if (new Set(model.scope.platform_scope || []).size > 1) {
      generated.push(semanticTemplate(journey, 'platform_ownership', 'Shared and platform-specific behavior ownership is explicit and intentional for this journey.', 'compiler_lint'));
    }
  }

  const semanticInputHash = options.semanticInputHash || (options.semanticObligations ? hashObject(options.semanticObligations) : null);
  const semanticInput = normalizeSemanticInput(options.semanticObligations, model);
  const normalizedSemantic = semanticInput.map((entry) => normalizeSemanticObligation(entry, {
    model,
    modelIds,
    evidenceIds,
  }));
  const deduped = dedupeObligations([...generated, ...normalizedSemantic]);
  const emitted = deduped.slice(0, maxObligations);
  const omitted = deduped.slice(maxObligations).map((entry) => ({
    obligation_id: entry.id,
    reason_code: 'proof_obligation_budget_exhausted',
  }));
  const triggeredLenses = collectTriggeredLenses(model, emitted);

  const artifact = {
    schema_version: 'app-proof-obligations.v1',
    artifact_id: 'proof-obligations',
    generated_at: new Date().toISOString(),
    source_inputs: model.source_inputs,
    consumers: ['counterexample-searcher', 'evidence-adjudicator', 'report-writer'],
    contract_status: 'candidate',
    artifact_authority: 'mixed_per_item',
    data_sensitivity: model.data_sensitivity,
    retention_class: 'run_local',
    run_id: model.run_id,
    prepare_fingerprint: model.prepare_fingerprint,
    behavior_model_ref: {
      artifact_id: model.artifact_id,
      schema_version: model.schema_version,
      run_id: model.run_id,
      prepare_fingerprint: model.prepare_fingerprint,
      content_hash: behaviorModelHash,
    },
    semantic_input_receipt: {
      hash_authority: 'script_computed',
      input_hashes: [behaviorModelHash, semanticInputHash].filter(Boolean),
      producer_kind: options.semanticObligations && options.semanticObligations.producer_receipt
        ? options.semanticObligations.producer_receipt.producer_kind
        : 'script_only',
    },
    coverage: {
      included_journey_refs: selectedJourneys,
      omitted_obligations: omitted,
      budget: {
        max_obligations: maxObligations,
        emitted: emitted.length,
        exhausted: omitted.length > 0,
      },
      triggered_lenses: triggeredLenses,
      conclusion_caps: unique([...(model.coverage.conclusion_caps || []), ...emitted.map((entry) => `${entry.id}:${entry.conclusion_cap}`)]),
    },
    obligations: emitted,
    limitations: unique(model.coverage.limitations || []),
  };

  const result = validateArtifact(artifact);
  if (!result.valid) {
    const first = result.errors[0] || { code: 'proof_obligations_invalid', path: 'artifact', message: 'invalid' };
    throw new Error(`${first.code}: ${first.path}: ${first.message}`);
  }
  return artifact;
}

function mechanicalIntegrityObligation(journey) {
  return {
    id: `obligation-integrity-${safeId(journey.id)}`,
    category: 'reference_integrity',
    statement: 'The selected journey and its current-run evidence references passed the Behavior IR structural gate.',
    model_refs: [journey.id],
    platform_scope: journey.platform_scope || 'unknown',
    producer_kind: 'script',
    assessment_authority: 'script_confirmed',
    assessment: 'proven',
    required_evidence: [{ source_family: 'contract', claim: 'Validated current-run Behavior IR receipt.' }],
    evidence_refs: unique(journey.evidence_refs || []),
    freshness: journey.freshness || 'unavailable',
    limitations: ['This proves structural/reference integrity only, not semantic journey adequacy.'],
    conclusion_cap: 'confirmed',
    minimum_verification: {
      kind: 'static_proof',
      environment_constraints: ['none'],
      rationale: 'The claim is limited to deterministic artifact/reference validation.',
    },
    absence_claim: null,
  };
}

function semanticTemplate(journey, category, statement, verificationKind) {
  return {
    id: `obligation-${category}-${safeId(journey.id)}`,
    category,
    statement,
    model_refs: [journey.id],
    platform_scope: journey.platform_scope || 'unknown',
    producer_kind: 'script',
    assessment_authority: 'not_assessed',
    assessment: 'unresolved',
    required_evidence: [{ source_family: 'code', claim: 'Direct behavior implementation or test evidence.' }],
    evidence_refs: unique(journey.evidence_refs || []),
    freshness: journey.freshness || 'unavailable',
    limitations: ['A script generated this proof question but did not judge semantic adequacy.'],
    conclusion_cap: 'candidate',
    minimum_verification: {
      kind: verificationKind,
      environment_constraints: verificationKind === 'compiler_lint' ? ['build'] : ['host'],
      rationale: 'U3 records only the minimum verification hint; U5 owns executable tasks and oracles.',
    },
    absence_claim: null,
  };
}

function normalizeSemanticObligation(entry, context) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new Error('proof_semantic_obligation_invalid: semantic obligation must be an object.');
  }
  if (entry.assessment_authority === 'script_confirmed') {
    throw new Error('proof_llm_authority_escalation: LLM semantic obligation cannot claim script_confirmed authority.');
  }
  const modelRefs = stringArray(entry.model_refs);
  const evidenceRefs = stringArray(entry.evidence_refs);
  requireKnownRefs(modelRefs, context.modelIds, 'proof_dangling_model_ref');
  requireKnownRefs(evidenceRefs, context.evidenceIds, 'proof_dangling_evidence_ref');
  const normalized = {
    id: entry.id || `obligation-llm-${safeId(entry.category || 'semantic')}-${modelRefs.map(safeId).join('-')}`,
    category: entry.category || 'semantic_claim',
    statement: safeText(entry.statement || 'Semantic proof obligation requires review.'),
    model_refs: modelRefs,
    platform_scope: normalizePlatform(entry.platform_scope),
    producer_kind: 'llm',
    assessment_authority: 'llm_advisory',
    assessment: normalizeAssessment(entry.assessment),
    required_evidence: Array.isArray(entry.required_evidence) ? entry.required_evidence.map(normalizeRequiredEvidence) : [],
    evidence_refs: evidenceRefs,
    freshness: normalizeFreshness(entry.freshness),
    limitations: textArray(entry.limitations),
    conclusion_cap: restrictiveCap(normalizeConclusionCap(entry.conclusion_cap), 'candidate'),
    minimum_verification: normalizeMinimumVerification(entry.minimum_verification),
    absence_claim: normalizeAbsenceClaim(entry.absence_claim, {
      platformScope: normalizePlatform(entry.platform_scope),
      expectedEvidenceRefs: evidenceRefs,
      evidenceIds: context.evidenceIds,
    }),
  };
  applyAbsenceCap(normalized);
  return normalized;
}

function normalizeAbsenceClaim(value, context) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const scope = value.negative_evidence_scope && typeof value.negative_evidence_scope === 'object'
    ? value.negative_evidence_scope
    : {};
  const expectedEvidenceRefs = stringArray(value.expected_evidence_refs || context.expectedEvidenceRefs);
  requireKnownRefs(expectedEvidenceRefs, context.evidenceIds || new Set(expectedEvidenceRefs), 'proof_absence_expected_evidence_ref_invalid');
  return {
    expected_evidence_refs: expectedEvidenceRefs,
    negative_evidence_scope: {
      source_roots: safeScopeArray(scope.source_roots, 'source_roots'),
      file_patterns: safeScopeArray(scope.file_patterns, 'file_patterns'),
      symbols: safeScopeArray(scope.symbols, 'symbols'),
      tools: safeScopeArray(scope.tools, 'tools'),
      platform_sources: stringArray(scope.platform_sources),
      scanned_file_count: nonNegativeInteger(scope.scanned_file_count),
      max_file_count: nonNegativeInteger(scope.max_file_count),
      truncated: scope.truncated === true,
      generated_code_covered: scope.generated_code_covered === true,
      dynamic_routes_covered: scope.dynamic_routes_covered === true,
      di_bindings_covered: scope.di_bindings_covered === true,
      provider_status: ['ready', 'unavailable', 'degraded'].includes(scope.provider_status) ? scope.provider_status : 'degraded',
    },
    coverage_cap: value.coverage_cap === 'complete' ? 'complete' : (value.coverage_cap === 'partial' ? 'partial' : 'unknown'),
    reason_codes: stringArray(value.reason_codes),
  };
}

function applyAbsenceCap(obligation) {
  const absence = obligation.absence_claim;
  if (!absence) return;
  const scope = absence.negative_evidence_scope;
  const reasons = [];
  if (absence.expected_evidence_refs.length === 0) reasons.push('absence_positive_expectation_missing');
  if (scope.source_roots.length === 0 || scope.file_patterns.length === 0 || scope.tools.length === 0) reasons.push('absence_search_scope_empty');
  if (scope.scanned_file_count <= 0 || scope.max_file_count < scope.scanned_file_count) reasons.push('absence_scan_count_invalid');
  if (scope.truncated) reasons.push('absence_scan_truncated');
  if (!scope.generated_code_covered) reasons.push('absence_generated_code_not_covered');
  if (!scope.dynamic_routes_covered) reasons.push('absence_dynamic_routes_not_covered');
  if (!scope.di_bindings_covered) reasons.push('absence_di_bindings_not_covered');
  if (scope.provider_status !== 'ready') reasons.push(`absence_provider_${scope.provider_status}`);
  if (!platformCoverageComplete(scope.platform_sources, obligation.platform_scope)) reasons.push('absence_platform_source_missing');
  if (reasons.length > 0) {
    absence.coverage_cap = absence.coverage_cap === 'unknown' ? 'unknown' : 'partial';
    absence.reason_codes = unique([...absence.reason_codes, ...reasons]);
    obligation.assessment = 'unresolved';
    obligation.conclusion_cap = restrictiveCap(obligation.conclusion_cap, 'candidate');
    obligation.limitations = unique([...obligation.limitations, ...reasons]);
  }
}

function dedupeObligations(values) {
  const byKey = new Map();
  for (const value of values) {
    const key = `${value.category}|${[...value.model_refs].sort().join(',')}|${value.platform_scope}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, value);
      continue;
    }
    existing.evidence_refs = unique([...existing.evidence_refs, ...value.evidence_refs]);
    existing.limitations = unique([...existing.limitations, ...value.limitations]);
    existing.conclusion_cap = restrictiveCap(existing.conclusion_cap, value.conclusion_cap);
    if (existing.assessment_authority !== value.assessment_authority || existing.assessment !== value.assessment) {
      existing.assessment_authority = 'not_assessed';
      existing.assessment = 'unresolved';
    }
  }
  return [...byKey.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function collectTriggeredLenses(model, obligations) {
  const lenses = new Set();
  const serialized = JSON.stringify({ entities: model.entities, extensions: model.extensions }).toLowerCase();
  if (/permission|authorization|denied|settings-return|revoked/.test(serialized)) lenses.add('permission_lifecycle');
  if (Array.isArray(model.extensions.reentry_resume) && model.extensions.reentry_resume.length > 0) lenses.add('network_lifecycle');
  for (const obligation of obligations) {
    if (CORE_CATEGORIES.has(obligation.category)) lenses.add('critical_journey_core');
    if (EXTENSION_LENS_BY_CATEGORY[obligation.category]) lenses.add(EXTENSION_LENS_BY_CATEGORY[obligation.category]);
  }
  return [...lenses].sort();
}

function collectModelIds(model) {
  const ids = new Set();
  for (const values of Object.values(model.entities || {})) {
    for (const entry of values || []) if (entry && typeof entry.id === 'string') ids.add(entry.id);
  }
  return ids;
}

function journeyHasSignal(model, journey, pattern) {
  const refs = new Set([journey.id, ...(journey.ordered_step_refs || [])]);
  const entries = Object.values(model.entities).flat().filter((entry) => entry && (refs.has(entry.id) || entry.journey_ref === journey.id));
  return pattern.test(entries.map((entry) => `${entry.id} ${entry.label || ''}`).join(' '));
}

function journeyHasNavigation(model, journey) {
  const transitionRefs = new Set(journey.ordered_step_refs || []);
  const eventRefs = new Set(model.entities.transitions.filter((entry) => transitionRefs.has(entry.id)).map((entry) => entry.event_ref));
  return model.entities.navigations.some((entry) => eventRefs.has(entry.trigger_event_ref))
    || [journey.happy_exit, ...(journey.failure_or_cancel_exits || [])].some((entry) => entry && entry.navigation_ref);
}

function normalizeSemanticInput(value, model) {
  if (value === undefined || value === null) return [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('proof_semantic_input_envelope_required: semantic obligations require a staged envelope.');
  }
  if (value.run_id !== model.run_id || value.prepare_fingerprint !== model.prepare_fingerprint) {
    throw new Error('proof_semantic_input_run_mismatch: semantic obligations do not match the prepared run.');
  }
  if (!value.producer_receipt || typeof value.producer_receipt.producer_kind !== 'string') {
    throw new Error('proof_semantic_input_receipt_invalid: producer kind is required; hashes are script-computed.');
  }
  if (Array.isArray(value.obligations)) return value.obligations;
  return [];
}

function normalizeMinimumVerification(value) {
  const input = value && typeof value === 'object' ? value : {};
  const kinds = new Set(['static_proof', 'compiler_lint', 'unit', 'state_transition', 'navigation_component', 'visual_capture', 'runtime_interaction', 'human_judgment']);
  const environments = new Set(['none', 'host', 'build', 'simulator', 'real_device', 'human']);
  return {
    kind: kinds.has(input.kind) ? input.kind : 'static_proof',
    environment_constraints: stringArray(input.environment_constraints).filter((entry) => environments.has(entry)),
    rationale: safeText(input.rationale || 'Minimum verification is advisory until U5 compiles an executable task.'),
  };
}

function normalizeRequiredEvidence(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { source_family: 'code', claim: 'Direct project evidence.' };
  return {
    source_family: safeText(value.source_family || 'code'),
    claim: safeText(value.claim || 'Direct project evidence.'),
  };
}

function requireKnownRefs(values, allowed, code) {
  const unknown = values.find((entry) => !allowed.has(entry));
  if (unknown) throw new Error(`${code}: ${unknown}`);
}

function normalizeAssessment(value) {
  return ['proven', 'disproven', 'unresolved', 'not_evaluable'].includes(value) ? value : 'unresolved';
}

function normalizeConclusionCap(value) {
  return CONCLUSION_CAP_ORDER.includes(value) ? value : 'candidate';
}

function normalizeFreshness(value) {
  return ['current-run', 'partial', 'stale', 'unavailable'].includes(value) ? value : 'unavailable';
}

function normalizePlatform(value) {
  return ['shared', 'android', 'ios', 'multi', 'unknown'].includes(value) ? value : 'unknown';
}

function platformCoverageComplete(platforms, platformScope) {
  const values = new Set(platforms);
  if (platformScope === 'android') return values.has('android');
  if (platformScope === 'ios') return values.has('ios');
  if (platformScope === 'shared') return values.has('shared');
  if (platformScope === 'multi') return values.has('android') && values.has('ios');
  return false;
}

function restrictiveCap(left, right) {
  return CONCLUSION_CAP_ORDER[Math.min(CONCLUSION_CAP_ORDER.indexOf(left), CONCLUSION_CAP_ORDER.indexOf(right))];
}

function safeId(value) {
  return String(value || 'unknown').replace(/[^A-Za-z0-9._:-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'unknown';
}

function safeText(value) {
  return redactForArtifactText(String(value || ''), { maxLength: 500 });
}

function safeScopeArray(value, field) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' || entry.length === 0)) {
    throw new Error(`proof_absence_scope_array_invalid: ${field}`);
  }
  const values = value;
  if (values.length > 100) throw new Error(`proof_absence_scope_budget_exceeded: ${field}`);
  return values.map((entry) => {
    if (entry.length > 240 || /https?:\/\/|Authorization\s*[:=]|Bearer\s+|(?:token|secret|password|api[_-]?key)\s*[:=]/i.test(entry)) {
      throw new Error(`proof_absence_scope_text_rejected: ${field}`);
    }
    if (['source_roots', 'file_patterns'].includes(field)
      && (path.isAbsolute(entry) || /^[A-Za-z]:[\\/]/.test(entry) || entry.split(/[\\/]/).includes('..')
        || /(?:^|\/)(?:\.env|\.npmrc|\.netrc|.*(?:token|secret|credentials|password|apikey).*)/i.test(entry))) {
      throw new Error(`proof_absence_scope_path_rejected: ${field}`);
    }
    return safeText(entry);
  });
}

function hashObject(value) {
  return `sha256:${crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}

function hashFile(filePath) {
  return `sha256:${crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')}`;
}

function stringArray(value) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === 'string' && entry.length > 0) : [];
}

function textArray(value) {
  return stringArray(value).map(safeText);
}

function unique(values) {
  return [...new Set(values)];
}

function boundedInteger(value, min, max, fallback) {
  return Number.isInteger(value) ? Math.max(min, Math.min(max, value)) : fallback;
}

function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function parseArgs(argv) {
  const options = parseCommonArgs(argv);
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--behavior-model') options.behaviorModelPath = argv[++index];
    if (argv[index] === '--semantic-input') options.semanticInputPath = argv[++index];
    if (argv[index] === '--max-obligations') options.maxObligations = Number(argv[++index]);
  }
  return options;
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (!options.behaviorModelPath || !options.runDir || !options.output) throw new Error('proof_cli_usage: --behavior-model, --run-dir and --output are required.');
    const repoRoot = resolveRepoRoot(options);
    const runDir = resolveRunDir(options).runDir;
    const behaviorModelPath = resolvePathAgainstRoot(repoRoot, options.behaviorModelPath);
    const semanticInputPath = options.semanticInputPath ? resolvePathAgainstRoot(repoRoot, options.semanticInputPath) : null;
    const outputPath = resolvePathAgainstRoot(repoRoot, options.output);
    assertManagedRunCliContainment({ repoRoot, runDir, ephemeralInputs: [semanticInputPath], runArtifacts: [behaviorModelPath], outputPath, reasonPrefix: 'proof' });
    const behaviorModel = JSON.parse(fs.readFileSync(behaviorModelPath, 'utf8'));
    const semanticObligations = semanticInputPath ? JSON.parse(fs.readFileSync(semanticInputPath, 'utf8')) : undefined;
    writeJsonOutput(buildProofObligations({
      behaviorModel,
      semanticObligations,
      maxObligations: options.maxObligations,
      behaviorModelHash: hashFile(behaviorModelPath),
      semanticInputHash: semanticInputPath ? hashFile(semanticInputPath) : null,
    }), outputPath, options);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  assertProofCliContainment: assertManagedRunCliContainment,
  buildProofObligations,
  normalizeAbsenceClaim,
};
