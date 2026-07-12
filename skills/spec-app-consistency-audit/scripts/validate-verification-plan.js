#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { parseCommonArgs, redactForArtifactText, resolvePathAgainstRoot, resolveRepoRoot, resolveRunDir, writeJsonOutput } = require('./lib/audit-utils');
const { assertManagedRunCliContainment } = require('./lib/managed-run-boundary');
const { validateArtifact } = require('./validate-artifacts');

const MATRIX = new Map([
  ['static_proof|none', 0], ['static_proof|host', 1], ['compiler_lint|build', 2], ['unit|build', 3],
  ['state_transition|host', 4], ['navigation_component|host', 5], ['visual_capture|host', 6],
  ['state_transition|simulator', 7], ['navigation_component|simulator', 8], ['visual_capture|simulator', 9],
  ['end_to_end|simulator', 10], ['visual_capture|real_device', 11], ['end_to_end|real_device', 12],
  ['human_judgment|human_only', 13],
]);
const ALWAYS_HUMAN = new Set(['oauth_consent', 'captcha', 'credential_entry', 'store_release', 'production_mutation']);
const CHECKPOINT_HUMAN = new Set(['biometric_confirmation', 'system_permission_confirmation', 'payment_transaction_confirmation']);
const SENSITIVE_TEXT = /(https?:\/\/|Authorization\s*[:=]|Bearer\s+|(?:token|secret|password|passwd|api[_-]?key|access[_-]?token)\s*[:=])/i;

function validateVerificationPlan(raw, options = {}) {
  const { behaviorModel: model, proofObligations: proofs, counterexamples, issues, capabilitySnapshot } = options;
  for (const [name, artifact, id] of [['model', model, 'app-behavior-model'], ['proofs', proofs, 'proof-obligations'], ['counterexamples', counterexamples, 'counterexamples']]) {
    const result = validateArtifact(artifact);
    if (!result.valid || artifact.artifact_id !== id) throw new Error(`verification_${name}_invalid: current normalized artifact required.`);
  }
  if (!issues || issues.artifact_id !== 'issues' || issues.semantic_adjudication_status !== 'complete') {
    throw new Error('verification_issues_not_adjudicated: completed U4 issues artifact is required.');
  }
  const runIds = new Set([model.run_id, proofs.run_id, counterexamples.run_id]);
  const fingerprints = new Set([model.prepare_fingerprint, proofs.prepare_fingerprint, counterexamples.prepare_fingerprint]);
  if (runIds.size !== 1 || fingerprints.size !== 1) throw new Error('verification_input_binding_invalid: semantic artifacts must share run and fingerprint.');
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.run_id !== model.run_id || raw.prepare_fingerprint !== model.prepare_fingerprint) {
    throw new Error('verification_raw_binding_invalid: raw plan must match the prepared run.');
  }
  if (!raw.producer_receipt || typeof raw.producer_receipt.producer_kind !== 'string') throw new Error('verification_producer_receipt_required: producer kind required.');
  assertNoUnsafeFields(raw);

  const hashes = options.inputHashes || [model, proofs, counterexamples, issues, capabilitySnapshot].map(hashObject);
  if (hashes.length !== 5 || hashes.some((entry) => !/^sha256:[a-f0-9]{64}$/.test(entry))) throw new Error('verification_input_hashes_invalid: five script-computed hashes required.');
  const claims = buildClaimCatalog(proofs, counterexamples, issues);
  const capabilities = normalizeCapabilities(capabilitySnapshot);
  const normalizedTasks = (Array.isArray(raw.tasks) ? raw.tasks : []).map((task) => normalizeTask(task, { claims, capabilities }));
  validateHumanCheckpoints(normalizedTasks);
  const blockedCount = normalizedTasks.filter((entry) => entry.status === 'blocked').length;
  const humanCount = normalizedTasks.filter((entry) => entry.verification_kind === 'human_judgment').length;
  const compilerStatus = blockedCount > 0 || capabilitySnapshot.freshness !== 'current-run' ? 'degraded' : 'generated';

  const artifact = {
    schema_version: 'verification-plan.v1', artifact_id: 'verification-plan', generated_at: new Date().toISOString(),
    source_inputs: model.source_inputs, consumers: ['report-writer', 'runtime-verification-executor'],
    contract_status: 'candidate', artifact_authority: 'generated_advisory', execution_authority: 'not_run',
    data_sensitivity: model.data_sensitivity, retention_class: 'run_local', run_id: model.run_id,
    prepare_fingerprint: model.prepare_fingerprint,
    input_refs: {
      behavior_model: ref(model, hashes[0]), proof_obligations: ref(proofs, hashes[1]),
      counterexamples: ref(counterexamples, hashes[2]), issues: ref(issues, hashes[3]),
    },
    compiler_receipt: {
      producer_kind: raw.producer_receipt.producer_kind, hash_authority: 'script_computed', input_hashes: hashes,
      context_isolation: 'verification_compilation_only', status: 'complete', limitations: textArray(raw.producer_receipt.limitations),
    },
    capability_snapshot: { content_hash: hashes[4], freshness: capabilitySnapshot.freshness, limitations: textArray(capabilitySnapshot.limitations) },
    verification_compiler_status: compilerStatus, verification_execution_status: 'not_run',
    coverage: {
      included_claim_refs: unique(normalizedTasks.flatMap((entry) => entry.claim_refs.map((refValue) => `${refValue.type}:${refValue.id}`))),
      omitted_claims: Array.isArray(raw.omitted_claims) ? raw.omitted_claims.map(normalizeOmission) : [],
      not_evaluable_claims: [], blocked_task_count: blockedCount, task_count: normalizedTasks.length,
      human_checkpoint_count: humanCount, limitations: textArray(raw.limitations),
    },
    tasks: normalizedTasks, limitations: unique([...textArray(raw.limitations), ...(compilerStatus === 'degraded' ? ['Verification plan has blocked tasks or degraded capability freshness.'] : [])]),
  };
  const result = validateArtifact(artifact);
  if (!result.valid) {
    const first = result.errors[0] || { code: 'verification_plan_invalid', path: 'artifact', message: 'invalid' };
    throw new Error(`${first.code}: ${first.path}: ${first.message}`);
  }
  return artifact;
}

function normalizeTask(task, context) {
  if (!task || typeof task !== 'object' || Array.isArray(task)) throw new Error('verification_task_invalid: task must be object.');
  if (task.status && !['not_run', 'blocked'].includes(task.status)) throw new Error('verification_execution_claim_rejected: tasks cannot claim execution.');
  const key = `${task.verification_kind}|${task.execution_environment}`;
  if (!MATRIX.has(key)) throw new Error(`verification_combination_invalid: ${key}`);
  if (task.cost_rank !== undefined && task.cost_rank !== MATRIX.get(key)) throw new Error('verification_cost_rank_invalid: cost rank must match matrix.');
  const claimRefs = normalizeClaimRefs(task.claim_refs, context.claims);
  const capabilityIds = stringArray(task.required_capabilities);
  if (!['static_proof', 'human_judgment'].includes(task.verification_kind) && capabilityIds.length === 0) {
    throw new Error('verification_capability_required: non-static automated tasks require capability facts.');
  }
  const selectedCapabilities = capabilityIds.map((id) => context.capabilities.get(id)).filter(Boolean);
  if (capabilityIds.length !== selectedCapabilities.length) throw new Error('verification_capability_ref_invalid: unknown capability.');
  const readinessMissing = selectedCapabilities.some((capability) => capability.readiness !== 'ready'
    || !capability.verification_kinds.includes(task.verification_kind)
    || !capability.environments.includes(task.execution_environment)
    || !capability.platforms.includes(task.target_platform));
  const status = readinessMissing ? 'blocked' : (task.status || 'not_run');
  if (status === 'blocked' && (!task.blocked_reason || typeof task.blocked_reason.reason_code !== 'string')) {
    throw new Error('verification_blocked_reason_required: blocked task requires reason code.');
  }
  const lower = Array.isArray(task.lower_cost_rejections) ? task.lower_cost_rejections.map(normalizeLowerCostRejection) : [];
  if (MATRIX.get(key) > 0 && lower.length === 0 && task.verification_kind !== 'human_judgment') throw new Error('verification_lower_cost_rejection_required: selected non-minimal combination requires rejected lower-cost rationale.');
  if (lower.some((entry) => entry.cost_rank >= MATRIX.get(key))) throw new Error('verification_lower_cost_rank_invalid: rejected alternatives must be cheaper than the selected combination.');
  const expectedPermission = permissionForEnvironment(task.execution_environment);
  if (task.permission !== expectedPermission) throw new Error('verification_permission_environment_mismatch: permission must match execution environment.');
  const actions = textArray(task.actions);
  if (actions.length === 0) throw new Error('verification_actions_required: executable actions required.');
  const oracle = normalizeOracle(task.oracle);
  const sensitiveClass = task.sensitive_action_class || 'none';
  if (ALWAYS_HUMAN.has(sensitiveClass) && key !== 'human_judgment|human_only') throw new Error('verification_human_only_gate_required: sensitive action must be human-only.');

  return {
    id: safeId(task.id), claim_refs: claimRefs, verification_kind: task.verification_kind,
    execution_environment: task.execution_environment, target_platform: task.target_platform,
    preconditions: textArray(task.preconditions), inputs: normalizeInputs(task.inputs), actions, oracle,
    required_capabilities: capabilityIds, capability_evidence_refs: stringArray(task.capability_evidence_refs),
    permission: task.permission, data_sensitivity: task.data_sensitivity || 'internal', parallelizable: Boolean(task.parallelizable),
    cost_rank: MATRIX.get(key), lower_cost_rejections: lower, sensitive_action_class: sensitiveClass,
    human_checkpoint_ref: typeof task.human_checkpoint_ref === 'string' ? task.human_checkpoint_ref : null,
    status, blocked_reason: status === 'blocked' ? task.blocked_reason : null, limitations: textArray(task.limitations),
  };
}

function buildClaimCatalog(proofs, counterexamples, issues) {
  const result = new Map();
  for (const obligation of proofs.obligations || []) if (['unresolved', 'not_evaluable'].includes(obligation.assessment)) result.set(`obligation:${obligation.id}`, obligation);
  for (const candidate of counterexamples.counterexamples || []) result.set(`counterexample:${candidate.id}`, candidate);
  for (const issue of issues.issues || []) if (issue.semantic_adjudication && issue.semantic_adjudication.status === 'accepted' && issue.requires_runtime_verification) result.set(`finding:${issue.id}`, issue);
  return result;
}

function normalizeClaimRefs(values, claims) {
  if (!Array.isArray(values) || values.length === 0) throw new Error('verification_claim_refs_required: task needs claim refs.');
  return values.map((entry) => {
    if (!entry || !['obligation', 'counterexample', 'finding'].includes(entry.type) || typeof entry.id !== 'string' || !claims.has(`${entry.type}:${entry.id}`)) {
      throw new Error('verification_claim_ref_invalid: only unresolved obligations and accepted runtime risks are eligible.');
    }
    return { type: entry.type, id: entry.id };
  });
}

function normalizeCapabilities(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || !['current-run', 'partial', 'stale'].includes(snapshot.freshness) || !Array.isArray(snapshot.capabilities)) {
    throw new Error('verification_capability_snapshot_invalid: capability facts required.');
  }
  return new Map(snapshot.capabilities.map((entry) => [entry.id, {
    ...entry, verification_kinds: stringArray(entry.verification_kinds), environments: stringArray(entry.environments), platforms: stringArray(entry.platforms),
  }]));
}

function validateHumanCheckpoints(tasks) {
  const byId = new Map(tasks.map((entry) => [entry.id, entry]));
  for (const task of tasks) {
    if (task.verification_kind === 'human_judgment') {
      if (task.execution_environment !== 'human_only' || task.permission !== 'human_only' || task.status !== 'blocked'
        || !task.blocked_reason || task.blocked_reason.reason_code !== 'human_action_required' || task.parallelizable) {
        throw new Error('verification_human_checkpoint_invalid: human checkpoints must be blocked, non-parallel human-only tasks.');
      }
    }
    if (CHECKPOINT_HUMAN.has(task.sensitive_action_class) && task.verification_kind !== 'human_judgment') {
      const checkpoint = byId.get(task.human_checkpoint_ref);
      if (!checkpoint || checkpoint.verification_kind !== 'human_judgment' || checkpoint.execution_environment !== 'human_only') {
        throw new Error('verification_human_checkpoint_required: sensitive device action requires a human-only checkpoint.');
      }
    }
  }
}

function normalizeLowerCostRejection(entry) {
  const key = `${entry.verification_kind}|${entry.execution_environment}`;
  if (!MATRIX.has(key)) throw new Error('verification_lower_cost_combination_invalid: rejected combination must be valid.');
  return { verification_kind: entry.verification_kind, execution_environment: entry.execution_environment, cost_rank: MATRIX.get(key), reason_code: entry.reason_code, rationale: safeText(entry.rationale) };
}

function permissionForEnvironment(environment) {
  return {
    none: 'read_only', host: 'read_only', build: 'build', simulator: 'simulator_control',
    real_device: 'device_control', human_only: 'human_only',
  }[environment];
}

function normalizeOracle(value) {
  if (!value || typeof value !== 'object') throw new Error('verification_oracle_required: oracle object required.');
  for (const field of ['observable', 'pass_condition', 'failure_condition']) if (typeof value[field] !== 'string' || value[field].length === 0) throw new Error('verification_oracle_required: complete oracle required.');
  return { observable: safeText(value.observable), pass_condition: safeText(value.pass_condition), failure_condition: safeText(value.failure_condition) };
}

function normalizeInputs(values) {
  return (Array.isArray(values) ? values : []).map((entry) => {
    if (!entry || typeof entry.ref !== 'string' || path.isAbsolute(entry.ref) || entry.ref.split(/[\\/]/).includes('..')) throw new Error('verification_input_ref_unsafe: inputs must use safe run/repo-relative refs.');
    return { type: safeText(entry.type || 'artifact'), ref: safeText(entry.ref), summary: safeText(entry.summary || entry.ref) };
  });
}

function assertNoUnsafeFields(value, trail = 'artifact') {
  if (Array.isArray(value)) return value.forEach((entry, index) => assertNoUnsafeFields(entry, `${trail}[${index}]`));
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && (value.length > 1000 || SENSITIVE_TEXT.test(value))) throw new Error(`verification_sensitive_text_rejected: ${trail}`);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (/(?:raw_excerpt|transcript|chain_of_thought|execution_receipt|test_log)/i.test(key)) throw new Error(`verification_forbidden_field: ${trail}.${key}`);
    assertNoUnsafeFields(child, `${trail}.${key}`);
  }
}

function ref(artifact, contentHash) { return { artifact_id: artifact.artifact_id, schema_version: artifact.schema_version, run_id: artifact.run_id || null, prepare_fingerprint: artifact.prepare_fingerprint || null, content_hash: contentHash }; }
function normalizeOmission(entry) { return { claim_ref: safeText(entry.claim_ref), reason_code: safeText(entry.reason_code) }; }
function safeId(value) { const result = String(value || '').replace(/[^A-Za-z0-9._:-]+/g, '-'); if (result.length < 3) throw new Error('verification_task_id_invalid: task ID required.'); return result.slice(0, 128); }
function safeText(value) { return redactForArtifactText(String(value || ''), { maxLength: 500 }); }
function stringArray(value) { return Array.isArray(value) ? value.filter((entry) => typeof entry === 'string' && entry.length > 0) : []; }
function textArray(value) { return stringArray(value).map(safeText); }
function unique(values) { return [...new Set(values)]; }
function hashObject(value) { return `sha256:${crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')}`; }
function hashFile(filePath) { return `sha256:${crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')}`; }

function parseArgs(argv) {
  const options = parseCommonArgs(argv);
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--input') options.inputPath = argv[++index];
    else if (arg === '--behavior-model') options.behaviorModelPath = argv[++index];
    else if (arg === '--proof-obligations') options.proofPath = argv[++index];
    else if (arg === '--counterexamples') options.counterPath = argv[++index];
    else if (arg === '--issues') options.issuesPath = argv[++index];
    else if (arg === '--capabilities') options.capabilitiesPath = argv[++index];
  }
  return options;
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (!options.runDir || !options.inputPath || !options.behaviorModelPath || !options.proofPath || !options.counterPath || !options.issuesPath || !options.capabilitiesPath || !options.output) throw new Error('verification_cli_usage: run-dir, input, semantic artifacts, capabilities and output are required.');
    const repoRoot = resolveRepoRoot(options); const runDir = resolveRunDir(options).runDir;
    const paths = Object.fromEntries(['inputPath', 'behaviorModelPath', 'proofPath', 'counterPath', 'issuesPath', 'capabilitiesPath'].map((key) => [key, resolvePathAgainstRoot(repoRoot, options[key])]));
    const outputPath = resolvePathAgainstRoot(repoRoot, options.output);
    assertManagedRunCliContainment({ repoRoot, runDir, ephemeralInputs: [paths.inputPath], runArtifacts: [paths.behaviorModelPath, paths.proofPath, paths.counterPath, paths.issuesPath, paths.capabilitiesPath], outputPath, reasonPrefix: 'verification' });
    const values = Object.fromEntries(Object.entries(paths).map(([key, filePath]) => [key, JSON.parse(fs.readFileSync(filePath, 'utf8'))]));
    const inputHashes = [paths.behaviorModelPath, paths.proofPath, paths.counterPath, paths.issuesPath, paths.capabilitiesPath].map(hashFile);
    writeJsonOutput(validateVerificationPlan(values.inputPath, { behaviorModel: values.behaviorModelPath, proofObligations: values.proofPath, counterexamples: values.counterPath, issues: values.issuesPath, capabilitySnapshot: values.capabilitiesPath, inputHashes }), outputPath, options);
  } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}

module.exports = { MATRIX, assertVerificationCliContainment: assertManagedRunCliContainment, validateVerificationPlan };
