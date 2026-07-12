#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');

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

const ACTION_KEY_PATTERN = /^(?:command|commands|tool|tools|tool_call|tool_calls|network|mutation|write_files?)$/i;
const RAW_CONTEXT_KEY_PATTERN = /(?:raw_excerpt|raw_content|prompt_context|system_prompt|instructions?|chain_of_thought|transcript|recommendation_rationale)/i;
const CONCLUSION_CAP_ORDER = ['out_of_scope', 'advisory', 'candidate'];
const LENS_BY_CATEGORY = {
  permission_lifecycle: 'permission_lifecycle',
  network_recovery: 'network_lifecycle',
  lifecycle_recovery: 'network_lifecycle',
  accessibility: 'accessibility',
  i18n: 'accessibility_i18n',
};

function normalizeCounterexamples(raw, options = {}) {
  const model = options.behaviorModel;
  const obligations = options.proofObligations;
  const modelHash = options.behaviorModelHash || hashObject(model);
  const proofHash = options.proofObligationsHash || hashObject(obligations);
  const rawHash = options.rawInputHash || hashObject(raw);
  for (const [name, artifact, expected] of [
    ['behavior_model', model, 'app-behavior-model'],
    ['proof_obligations', obligations, 'proof-obligations'],
  ]) {
    const result = validateArtifact(artifact);
    if (!result.valid || artifact.artifact_id !== expected) throw new Error(`counterexample_${name}_invalid: validated current-run artifact required.`);
  }
  if (model.run_id !== obligations.run_id || model.prepare_fingerprint !== obligations.prepare_fingerprint) {
    throw new Error('counterexample_input_fingerprint_mismatch: Behavior IR and obligations must belong to the same prepared run.');
  }
  const modelRef = obligations.behavior_model_ref || {};
  if (modelRef.artifact_id !== model.artifact_id || modelRef.schema_version !== model.schema_version
    || modelRef.run_id !== model.run_id || modelRef.prepare_fingerprint !== model.prepare_fingerprint
    || modelRef.content_hash !== modelHash) {
    throw new Error('counterexample_proof_model_binding_invalid: proof obligations do not bind the current Behavior IR hash/run/fingerprint.');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('counterexample_invalid_json: raw counterexamples must be an object.');
  if (JSON.stringify(raw).length > 2_000_000) throw new Error('counterexample_input_budget_exceeded: raw counterexamples exceed 2 MB.');
  assertNoActionOrRawContext(raw);
  if (raw.run_id !== model.run_id || raw.prepare_fingerprint !== model.prepare_fingerprint) {
    throw new Error('counterexample_run_mismatch: raw counterexamples do not match the prepared run.');
  }
  if (!raw.producer_receipt || typeof raw.producer_receipt.producer_kind !== 'string') {
    throw new Error('counterexample_producer_receipt_required: producer kind is required; hashes are script-computed.');
  }

  const budgetCaps = normalizeBudgetCaps(options.budget);
  const usage = normalizeBudgetUsage(options.usageReceipt);
  if (usage.authority === 'caller_receipt' && usage.tokenCount > budgetCaps.tokenLimit) throw new Error('counterexample_token_budget_exceeded: generation exceeded the caller-owned token cap.');
  if (usage.authority === 'caller_receipt' && usage.timeMs > budgetCaps.timeLimitMs) throw new Error('counterexample_time_budget_exceeded: generation exceeded the caller-owned time cap.');

  const obligationById = new Map(obligations.obligations.map((entry) => [entry.id, entry]));
  const evidenceIds = new Set(model.evidence_catalog.map((entry) => entry.id));
  const modelIds = collectModelIds(model);
  validateObligationRefs(obligations.obligations, modelIds, evidenceIds);
  const triggeredLenses = new Set(obligations.coverage.triggered_lenses || []);
  const normalized = (Array.isArray(raw.counterexamples) ? raw.counterexamples : []).map((entry) => normalizeCounterexample(entry, {
    obligationById,
    evidenceIds,
    modelIds,
    triggeredLenses,
  }));
  const deduped = dedupeCounterexamples(normalized, obligationById);
  const allowedJourneyRefs = new Set((model.scope.selected_journey_refs || []).slice(0, budgetCaps.maxJourneys));
  const journeyFiltered = deduped.filter((entry) => entry.model_refs.some((ref) => allowedJourneyRefs.has(ref)));
  const journeyOmitted = deduped.filter((entry) => !journeyFiltered.includes(entry));
  const maxCounterexamples = budgetCaps.maxCounterexamples;
  const emitted = journeyFiltered.slice(0, maxCounterexamples);
  const omittedCounterexamples = [...journeyOmitted, ...journeyFiltered.slice(maxCounterexamples)].map((entry) => ({
    counterexample_id: entry.id,
    obligation_ref: entry.obligation_ref,
    reason_code: 'counterexample_budget_exhausted',
  }));
  const searched = unique(emitted.map((entry) => entry.obligation_ref));
  const omittedObligations = obligations.obligations
    .filter((entry) => !searched.includes(entry.id))
    .map((entry) => ({ obligation_ref: entry.id, reason_code: omittedCounterexamples.length > 0 ? 'counterexample_budget_exhausted' : 'counterexample_not_selected' }));

  const artifact = {
    schema_version: 'app-counterexamples.v1',
    artifact_id: 'counterexamples',
    generated_at: new Date().toISOString(),
    source_inputs: model.source_inputs,
    consumers: ['evidence-adjudicator', 'verification-compiler', 'report-writer'],
    contract_status: 'candidate',
    artifact_authority: 'generated_advisory',
    data_sensitivity: model.data_sensitivity,
    retention_class: 'run_local',
    run_id: model.run_id,
    prepare_fingerprint: model.prepare_fingerprint,
    behavior_model_ref: obligations.behavior_model_ref,
    proof_obligations_ref: {
      artifact_id: obligations.artifact_id,
      schema_version: obligations.schema_version,
      run_id: obligations.run_id,
      prepare_fingerprint: obligations.prepare_fingerprint,
      content_hash: proofHash,
    },
    search_receipt: {
      producer_kind: raw.producer_receipt.producer_kind,
      input_hashes: [modelHash, proofHash, rawHash],
      hash_authority: 'script_computed',
      context_isolation: 'generation_only',
      status: 'complete',
      usage: { authority: usage.authority, token_count: usage.tokenCount, time_ms: usage.timeMs },
      limitations: textArray(raw.producer_receipt.limitations),
    },
    coverage: {
      searched_obligation_refs: searched,
      omitted_obligations: omittedObligations,
      omitted_counterexamples: omittedCounterexamples,
      triggered_lenses: [...triggeredLenses].sort(),
      budget: {
        max_journeys: budgetCaps.maxJourneys,
        max_counterexamples: maxCounterexamples,
        token_limit: budgetCaps.tokenLimit,
        time_limit_ms: budgetCaps.timeLimitMs,
        observed_token_count: usage.tokenCount,
        observed_time_ms: usage.timeMs,
        emitted: emitted.length,
        exhausted: omittedCounterexamples.length > 0,
      },
    },
    counterexamples: emitted,
    limitations: textArray(raw.limitations),
  };
  const result = validateArtifact(artifact);
  if (!result.valid) {
    const first = result.errors[0] || { code: 'counterexamples_invalid', path: 'artifact', message: 'invalid' };
    throw new Error(`${first.code}: ${first.path}: ${first.message}`);
  }
  return artifact;
}

function normalizeCounterexample(entry, context) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('counterexample_entry_invalid: candidate must be an object.');
  if (entry.status && entry.status !== 'candidate') throw new Error('counterexample_candidate_only: U3 counterexamples must remain candidate.');
  const obligation = context.obligationById.get(entry.obligation_ref);
  if (!obligation) throw new Error(`counterexample_dangling_obligation_ref: ${entry.obligation_ref || '<missing>'}`);
  const modelRefs = stringArray(entry.model_refs);
  const evidenceRefs = stringArray(entry.direct_evidence_refs);
  requireKnownRefs(modelRefs, context.modelIds, 'counterexample_dangling_model_ref');
  requireKnownRefs(evidenceRefs, context.evidenceIds, 'counterexample_dangling_evidence_ref');
  const requiredLens = LENS_BY_CATEGORY[obligation.category];
  if (requiredLens && !context.triggeredLenses.has(requiredLens)) {
    throw new Error(`counterexample_lens_not_triggered: ${requiredLens}`);
  }
  const minimumVerification = normalizeMinimumVerification(entry.minimum_verification || obligation.minimum_verification);
  const candidate = {
    id: entry.id || `counterexample-${safeId(entry.obligation_ref)}-${hashKey(entry.expected_invariant, entry.hypothesized_break)}`,
    obligation_ref: entry.obligation_ref,
    model_refs: modelRefs,
    platform_scope: normalizePlatform(entry.platform_scope || obligation.platform_scope),
    preconditions: textArray(entry.preconditions),
    action_sequence: textArray(entry.action_sequence),
    expected_invariant: safeText(entry.expected_invariant),
    hypothesized_break: safeText(entry.hypothesized_break),
    direct_evidence_refs: evidenceRefs,
    missing_evidence: textArray(entry.missing_evidence),
    minimum_verification: minimumVerification,
    status: 'candidate',
    conclusion_cap: normalizeConclusionCap(entry.conclusion_cap),
    dedupe_key: '',
    limitations: textArray(entry.limitations),
  };
  if (candidate.direct_evidence_refs.length === 0) {
    candidate.conclusion_cap = restrictiveCap(candidate.conclusion_cap, 'advisory');
    candidate.limitations = unique([...candidate.limitations, 'counterexample_direct_evidence_missing']);
  }
  if (obligation.assessment_authority !== 'script_confirmed') {
    candidate.conclusion_cap = restrictiveCap(candidate.conclusion_cap, 'candidate');
  }
  candidate.dedupe_key = buildDedupeKey(candidate, obligation);
  return candidate;
}

function dedupeCounterexamples(values, obligationById) {
  const byKey = new Map();
  for (const value of values) {
    const obligation = obligationById.get(value.obligation_ref);
    value.dedupe_key = buildDedupeKey(value, obligation);
    const existing = byKey.get(value.dedupe_key);
    if (!existing) {
      byKey.set(value.dedupe_key, value);
      continue;
    }
    existing.direct_evidence_refs = unique([...existing.direct_evidence_refs, ...value.direct_evidence_refs]);
    existing.missing_evidence = unique([...existing.missing_evidence, ...value.missing_evidence]);
    existing.limitations = unique([...existing.limitations, ...value.limitations]);
    existing.conclusion_cap = restrictiveCap(existing.conclusion_cap, value.conclusion_cap);
    existing.status = 'candidate';
  }
  return [...byKey.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function buildDedupeKey(candidate, obligation) {
  const raw = [
    candidate.obligation_ref,
    obligation.category,
    [...candidate.model_refs].sort().join(','),
    candidate.platform_scope,
    normalizeKeyText(candidate.expected_invariant),
    normalizeKeyText(candidate.hypothesized_break),
  ].join('|');
  return `sha256:${crypto.createHash('sha256').update(raw).digest('hex')}`;
}

function collectModelIds(model) {
  const result = new Set();
  for (const values of Object.values(model.entities || {})) {
    for (const entry of values || []) if (entry && typeof entry.id === 'string') result.add(entry.id);
  }
  return result;
}

function assertNoActionOrRawContext(value, trail = 'artifact') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoActionOrRawContext(entry, `${trail}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (ACTION_KEY_PATTERN.test(key)) throw new Error(`counterexample_prompt_action_rejected: ${trail}.${key}`);
    if (RAW_CONTEXT_KEY_PATTERN.test(key)) throw new Error(`counterexample_raw_context_rejected: ${trail}.${key}`);
    assertNoActionOrRawContext(child, `${trail}.${key}`);
  }
}

function normalizeMinimumVerification(value) {
  const input = value && typeof value === 'object' ? value : {};
  const kinds = new Set(['static_proof', 'compiler_lint', 'unit', 'state_transition', 'navigation_component', 'visual_capture', 'runtime_interaction', 'human_judgment']);
  const environments = new Set(['none', 'host', 'build', 'simulator', 'real_device', 'human']);
  return {
    kind: kinds.has(input.kind) ? input.kind : 'static_proof',
    environment_constraints: stringArray(input.environment_constraints).filter((entry) => environments.has(entry)),
    rationale: safeText(input.rationale || 'Minimum verification remains an advisory hint until U5.'),
  };
}

function normalizePlatform(value) {
  return ['shared', 'android', 'ios', 'multi', 'unknown'].includes(value) ? value : 'unknown';
}

function normalizeConclusionCap(value) {
  return CONCLUSION_CAP_ORDER.includes(value) ? value : 'candidate';
}

function restrictiveCap(left, right) {
  return CONCLUSION_CAP_ORDER[Math.min(CONCLUSION_CAP_ORDER.indexOf(left), CONCLUSION_CAP_ORDER.indexOf(right))];
}

function requireKnownRefs(values, allowed, code) {
  const unknown = values.find((entry) => !allowed.has(entry));
  if (unknown) throw new Error(`${code}: ${unknown}`);
}

function normalizeKeyText(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function hashKey(...values) {
  return crypto.createHash('sha256').update(values.join('|')).digest('hex').slice(0, 12);
}

function safeId(value) {
  return String(value || 'unknown').replace(/[^A-Za-z0-9._:-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'unknown';
}

function safeText(value) {
  return redactForArtifactText(String(value || ''), { maxLength: 500 });
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

function normalizeBudgetCaps(value) {
  const input = value && typeof value === 'object' ? value : {};
  return {
    maxJourneys: boundedInteger(input.maxJourneys, 1, 20, 3),
    maxCounterexamples: boundedInteger(input.maxCounterexamples, 1, 200, 50),
    tokenLimit: boundedInteger(input.tokenLimit, 1000, 200000, 40000),
    timeLimitMs: boundedInteger(input.timeLimitMs, 1000, 3600000, 900000),
  };
}

function normalizeBudgetUsage(value) {
  if (!value) return { authority: 'unverified', tokenCount: null, timeMs: null };
  if (typeof value !== 'object' || value.authority !== 'caller_receipt'
    || !Number.isInteger(value.token_count) || value.token_count < 0
    || !Number.isInteger(value.time_ms) || value.time_ms < 0) {
    throw new Error('counterexample_budget_usage_receipt_invalid: caller receipt requires non-negative token_count and time_ms.');
  }
  return { authority: 'caller_receipt', tokenCount: value.token_count, timeMs: value.time_ms };
}

function validateObligationRefs(values, modelIds, evidenceIds) {
  for (const obligation of values || []) {
    requireKnownRefs(stringArray(obligation.model_refs), modelIds, 'counterexample_proof_dangling_model_ref');
    requireKnownRefs(stringArray(obligation.evidence_refs), evidenceIds, 'counterexample_proof_dangling_evidence_ref');
    if (obligation.absence_claim) {
      requireKnownRefs(stringArray(obligation.absence_claim.expected_evidence_refs), evidenceIds, 'counterexample_proof_absence_evidence_ref_invalid');
    }
  }
}

function hashObject(value) {
  return `sha256:${crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}

function hashFile(filePath) {
  return `sha256:${crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')}`;
}

function parseArgs(argv) {
  const options = parseCommonArgs(argv);
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--input') options.inputPath = argv[++index];
    if (argv[index] === '--behavior-model') options.behaviorModelPath = argv[++index];
    if (argv[index] === '--proof-obligations') options.proofObligationsPath = argv[++index];
    if (argv[index] === '--max-journeys') options.maxJourneys = Number(argv[++index]);
    if (argv[index] === '--max-counterexamples') options.maxCounterexamples = Number(argv[++index]);
    if (argv[index] === '--token-limit') options.tokenLimit = Number(argv[++index]);
    if (argv[index] === '--time-limit-ms') options.timeLimitMs = Number(argv[++index]);
    if (argv[index] === '--usage-receipt') options.usageReceiptPath = argv[++index];
  }
  return options;
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (!options.inputPath || !options.behaviorModelPath || !options.proofObligationsPath || !options.runDir || !options.output) {
      throw new Error('counterexample_cli_usage: --input, --behavior-model, --proof-obligations, --run-dir and --output are required.');
    }
    const repoRoot = resolveRepoRoot(options);
    const runDir = resolveRunDir(options).runDir;
    const inputPath = resolvePathAgainstRoot(repoRoot, options.inputPath);
    const behaviorModelPath = resolvePathAgainstRoot(repoRoot, options.behaviorModelPath);
    const proofObligationsPath = resolvePathAgainstRoot(repoRoot, options.proofObligationsPath);
    const outputPath = resolvePathAgainstRoot(repoRoot, options.output);
    const usageReceiptPath = options.usageReceiptPath ? resolvePathAgainstRoot(repoRoot, options.usageReceiptPath) : null;
    assertManagedRunCliContainment({ repoRoot, runDir, ephemeralInputs: [inputPath, usageReceiptPath], runArtifacts: [behaviorModelPath, proofObligationsPath], outputPath, reasonPrefix: 'counterexample' });
    const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const behaviorModel = JSON.parse(fs.readFileSync(behaviorModelPath, 'utf8'));
    const proofObligations = JSON.parse(fs.readFileSync(proofObligationsPath, 'utf8'));
    const usageReceipt = usageReceiptPath ? JSON.parse(fs.readFileSync(usageReceiptPath, 'utf8')) : null;
    const budget = { maxJourneys: options.maxJourneys, maxCounterexamples: options.maxCounterexamples, tokenLimit: options.tokenLimit, timeLimitMs: options.timeLimitMs };
    writeJsonOutput(normalizeCounterexamples(raw, {
      behaviorModel, proofObligations, budget, usageReceipt,
      behaviorModelHash: hashFile(behaviorModelPath),
      proofObligationsHash: hashFile(proofObligationsPath),
      rawInputHash: hashFile(inputPath),
    }), outputPath, options);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  assertCounterexampleCliContainment: assertManagedRunCliContainment,
  normalizeCounterexamples,
};
