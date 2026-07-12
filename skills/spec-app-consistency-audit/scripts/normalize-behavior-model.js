#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  parseCommonArgs,
  redactForArtifactText,
  resolvePathAgainstRoot,
  resolveRepoRoot,
  resolveRunDir,
  writeJsonOutput,
} = require('./lib/audit-utils');
const { validateArtifact } = require('./validate-artifacts');

const ACTION_KEY_PATTERN = /^(?:command|commands|tool|tools|tool_call|tool_calls|action|actions|network|mutation|write_files?)$/i;
const RAW_CONTEXT_KEY_PATTERN = /(?:raw_excerpt|raw_content|prompt_context|system_prompt|instructions?|chain_of_thought|transcript)/i;
const COLLECTIONS = ['features', 'journeys', 'surfaces', 'states', 'events', 'transitions', 'navigations', 'platform_ownership'];
const BASE_FIELDS = ['id', 'label', 'platform_scope', 'semantic_status', 'evidence_refs', 'freshness', 'confidence', 'limitations'];
const EXTRA_FIELDS = {
  journeys: ['feature_ref', 'entry', 'ordered_step_refs', 'happy_exit', 'failure_or_cancel_exits'],
  transitions: ['journey_ref', 'source_state_ref', 'event_ref', 'target_state_ref', 'surface_ref'],
  navigations: ['source_surface_ref', 'target_surface_ref', 'trigger_event_ref', 'navigation_kind'],
  platform_ownership: ['subject_ref', 'ownership', 'bindings'],
};

function normalizeBehaviorModel(rawModel, options = {}) {
  const metadata = options.metadata;
  if (!metadata || typeof metadata !== 'object') {
    throw new Error('behavior_model_metadata_required: prepared metadata is required.');
  }
  if (metadata.data_sensitivity === 'restricted') {
    throw new Error('behavior_model_restricted_input: restricted data must not be persisted or normalized.');
  }
  if (!rawModel || typeof rawModel !== 'object' || Array.isArray(rawModel)) {
    throw new Error('behavior_model_invalid_json: raw behavior model must be a JSON object.');
  }
  if (JSON.stringify(rawModel).length > 2_000_000) {
    throw new Error('behavior_model_input_budget_exceeded: raw behavior model exceeds the 2 MB normalization budget.');
  }
  assertNoActionFields(rawModel);
  if (rawModel.run_id !== metadata.run_id) {
    throw new Error('behavior_model_run_id_mismatch: raw model does not belong to the prepared run.');
  }
  if (rawModel.prepare_fingerprint !== metadata.prepare_fingerprint) {
    throw new Error('behavior_model_prepare_fingerprint_mismatch: raw model does not match the prepared facts bundle.');
  }
  if (!rawModel.producer_receipt || typeof rawModel.producer_receipt.producer_kind !== 'string'
    || rawModel.producer_receipt.producer_kind.trim().length === 0
    || !Array.isArray(rawModel.producer_receipt.input_hashes)) {
    throw new Error('behavior_model_producer_receipt_required: staged behavior model requires producer kind and input hashes.');
  }

  const entities = {};
  for (const collection of COLLECTIONS) {
    entities[collection] = normalizeCollection(rawModel.entities && rawModel.entities[collection], [...BASE_FIELDS, ...(EXTRA_FIELDS[collection] || [])]);
  }
  const evidenceCatalog = normalizeCollection(rawModel.evidence_catalog, [
    'id', 'source_kind', 'path', 'source_hash', 'source_hash_unavailable_reason', 'freshness', 'summary', 'limitations',
  ]).map((entry) => ({
    ...entry,
    summary: redactForArtifactText(entry.summary, { maxLength: 500 }),
    limitations: normalizeTextArray(entry.limitations),
  }));
  const sourceInputs = evidenceCatalog.map((entry) => ({
    type: entry.source_kind || 'contract',
    path: entry.path,
    ...(entry.source_hash ? { source_hash: entry.source_hash } : {
      source_hash_unavailable_reason: entry.source_hash_unavailable_reason || 'evidence_hash_unavailable',
    }),
    freshness: entry.freshness || 'unavailable',
  }));

  const normalized = {
    schema_version: 'app-behavior-model.v1',
    artifact_id: 'app-behavior-model',
    generated_at: new Date().toISOString(),
    source_inputs: sourceInputs,
    consumers: ['proof-obligation-builder', 'counterexample-searcher', 'report-writer'],
    contract_status: 'candidate',
    artifact_authority: 'generated_advisory',
    data_sensitivity: metadata.data_sensitivity || 'internal',
    retention_class: 'run_local',
    run_id: rawModel.run_id,
    prepare_fingerprint: rawModel.prepare_fingerprint,
    scope: normalizeScope(rawModel.scope),
    evidence_catalog: evidenceCatalog,
    entities,
    identity_candidates: normalizeCollection(rawModel.identity_candidates, [...BASE_FIELDS, 'left_ref', 'right_ref', 'match_status']),
    contradictions: normalizeContradictions(rawModel.contradictions),
    extensions: normalizeExtensions(rawModel.extensions),
    coverage: normalizeCoverage(rawModel.coverage),
  };

  const result = validateArtifact(normalized);
  if (!result.valid) {
    const first = result.errors.find((entry) => entry.code.startsWith('behavior_model_'))
      || result.errors[0]
      || { code: 'behavior_model_schema_invalid', message: 'Behavior model is invalid.' };
    const code = first.code.startsWith('behavior_model_') ? first.code : 'behavior_model_schema_invalid';
    throw new Error(`${code}: ${first.path}: ${first.message}`);
  }
  return normalized;
}

function normalizeScope(value) {
  const scope = normalizeObject(value);
  return {
    changed_feature_refs: normalizeStringArray(scope.changed_feature_refs),
    selected_journey_refs: normalizeStringArray(scope.selected_journey_refs),
    platform_scope: normalizeStringArray(scope.platform_scope),
    selection_source: scope.selection_source,
    selection_rationale: normalizeTextArray(scope.selection_rationale),
    omitted_journey_candidates: normalizeCollection(scope.omitted_journey_candidates, ['id', 'label', 'reason_code', 'evidence_refs', 'limitations']),
  };
}

function normalizeCoverage(value) {
  const coverage = normalizeObject(value);
  return {
    included_sources: normalizeStringArray(coverage.included_sources),
    omitted_sources: normalizeStringArray(coverage.omitted_sources),
    platforms_evaluable: normalizeStringArray(coverage.platforms_evaluable),
    platforms_not_evaluable: normalizeStringArray(coverage.platforms_not_evaluable),
    design_alignment: coverage.design_alignment,
    conclusion_caps: normalizeTextArray(coverage.conclusion_caps),
    limitations: normalizeTextArray(coverage.limitations),
  };
}

function normalizeCollection(value, allowedFields = null) {
  if (!Array.isArray(value)) return [];
  if (value.length > 500) throw new Error('behavior_model_collection_budget_exceeded: behavior model collection exceeds 500 entries.');
  return value.map((entry) => {
    if (!allowedFields || !entry || typeof entry !== 'object' || Array.isArray(entry)) return normalizeValue(entry);
    return Object.fromEntries(allowedFields.filter((field) => Object.hasOwn(entry, field)).map((field) => [field, normalizeValue(entry[field], field)]));
  }).sort((left, right) => String(left.id || '').localeCompare(String(right.id || '')));
}

function normalizeExtensions(value) {
  const source = normalizeObject(value);
  const fields = {
    state_semantics: ['state_ref', 'kind', 'rendered_outcome', 'available_event_refs', 'disabled_event_refs', 'entry_conditions', 'exit_conditions', 'lifecycle', 'recoverability', 'evidence_refs', 'limitations'],
    side_effects: ['id', 'transition_ref', 'kind', 'platform_scope', 'evidence_refs', 'limitations'],
    guards_permissions: ['id', 'transition_ref', 'guard_kind', 'platform_scope', 'evidence_refs', 'limitations'],
    cross_cutting_obligation_refs: ['model_ref', 'obligation_ref', 'limitations'],
    decision_branches: ['id', 'source_state_ref', 'event_ref', 'target_state_refs', 'evidence_refs', 'limitations'],
    back_navigation: ['navigation_ref', 'expected_target_ref', 'evidence_refs', 'limitations'],
    reentry_resume: ['journey_ref', 'source_state_ref', 'resume_state_ref', 'evidence_refs', 'limitations'],
  };
  return Object.fromEntries(Object.entries(fields).filter(([key]) => Array.isArray(source[key])).map(([key, allowed]) => [key, normalizeCollection(source[key], allowed)]));
}

function normalizeContradictions(value) {
  return normalizeCollection(value, [...BASE_FIELDS, 'subject_refs', 'claim', 'source_positions', 'resolution_status']).map((entry) => ({
    ...entry,
    source_positions: normalizeCollection(entry.source_positions, ['evidence_ref', 'assertion']),
  }));
}

function normalizeObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return normalizeValue(value);
}

function normalizeValue(value, key = '') {
  if (Array.isArray(value)) return value.map((entry) => normalizeValue(entry, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, entry]) => [childKey, normalizeValue(entry, childKey)]));
  }
  if (typeof value !== 'string') return value;
  if (/(?:^|_)(?:id|ref|refs|hash|fingerprint|path|status|scope|kind|source|authority|class)$/.test(key)) return value;
  return redactForArtifactText(value, { maxLength: key === 'summary' ? 500 : 240 });
}

function normalizeStringArray(value) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === 'string' && entry.length > 0) : [];
}

function normalizeTextArray(value) {
  return Array.isArray(value)
    ? value.filter((entry) => typeof entry === 'string' && entry.length > 0).map((entry) => redactForArtifactText(entry, { maxLength: 500 }))
    : [];
}

function assertNoActionFields(value, trail = 'artifact') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoActionFields(entry, `${trail}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if (ACTION_KEY_PATTERN.test(key)) {
      throw new Error(`behavior_model_prompt_action_rejected: untrusted action field at ${trail}.${key}.`);
    }
    if (RAW_CONTEXT_KEY_PATTERN.test(key)) {
      throw new Error(`behavior_model_raw_context_rejected: raw prompt/source context field at ${trail}.${key}.`);
    }
    assertNoActionFields(entry, `${trail}.${key}`);
  }
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function realParent(filePath) {
  let current = path.resolve(filePath);
  while (!fs.existsSync(current)) current = path.dirname(current);
  return fs.realpathSync(fs.statSync(current).isDirectory() ? current : path.dirname(current));
}

function assertCliContainment({ repoRoot, runDir, inputPath, metadataPath, outputPath }) {
  const realRepo = fs.realpathSync(repoRoot);
  const managedRoot = path.join(realRepo, '.spec-first', 'app-audit', 'runs');
  if (!fs.existsSync(managedRoot) || !fs.existsSync(runDir) || fs.lstatSync(runDir).isSymbolicLink()) {
    throw new Error('behavior_model_run_boundary_invalid: managed run directory must exist and not be a symlink.');
  }
  const realManaged = fs.realpathSync(managedRoot);
  const realRun = fs.realpathSync(runDir);
  if (!isInside(realRepo, realManaged) || realManaged === realRepo || !isInside(realManaged, realRun) || realRun === realManaged) {
    throw new Error('behavior_model_run_boundary_escape: run directory resolves outside the managed root.');
  }
  const realInput = fs.realpathSync(inputPath);
  const realMetadata = fs.realpathSync(metadataPath);
  const inputRoot = fs.realpathSync(path.join(realRun, 'input'));
  if (!isInside(realRun, inputRoot) || inputRoot === realRun) throw new Error('behavior_model_input_root_escape: run input directory resolves outside the run.');
  if (!isInside(inputRoot, realInput) || realInput === inputRoot) throw new Error('behavior_model_input_outside_ephemeral_boundary: raw input must be staged under run-dir/input.');
  if (realMetadata !== path.join(realRun, 'metadata.json')) throw new Error('behavior_model_metadata_outside_run_boundary: metadata must be the current run metadata.json.');
  if (fs.existsSync(outputPath) && fs.lstatSync(outputPath).isSymbolicLink()) throw new Error('behavior_model_output_symlink_rejected: normalized output must not be a symlink.');
  const outputParent = realParent(outputPath);
  if (!isInside(realRun, outputParent) || isInside(inputRoot, outputParent)) throw new Error('behavior_model_output_outside_run_boundary: normalized output must be run-local and outside input/.');
}

function parseArgs(argv) {
  const options = parseCommonArgs(argv);
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--input') options.input = argv[++index];
  }
  return options;
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (!options.input || !options.metadata || !options.runDir || !options.output) {
      throw new Error('behavior_model_cli_usage: --input, --metadata, --run-dir and --output are required.');
    }
    const repoRoot = resolveRepoRoot(options);
    const resolvedRun = resolveRunDir(options);
    const runDir = resolvedRun.runDir;
    const inputPath = resolvePathAgainstRoot(repoRoot, options.input);
    const metadataPath = resolvePathAgainstRoot(repoRoot, options.metadata);
    const outputPath = resolvePathAgainstRoot(repoRoot, options.output);
    assertCliContainment({ repoRoot, runDir, inputPath, metadataPath, outputPath });
    const rawModel = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    writeJsonOutput(normalizeBehaviorModel(rawModel, { metadata }), outputPath, options);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  normalizeBehaviorModel,
};
