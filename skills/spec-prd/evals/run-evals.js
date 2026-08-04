#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const {
  isExactRepoRelativePath,
} = require('../../../src/cli/helpers/secret-deny-patterns');
const {
  assertExactRelativePath,
  createRootContext,
  parseJsonBytes,
  resolveConfinedPath,
} = require('./lib/contract-reset-safety');
const {
  CONTRACT_RESET_ARMS,
  CONTRACT_RESET_PATCH_CHAINS,
  ISOLATION_DENY_CODES,
  ISOLATION_PRIMITIVES,
  ISOLATION_PROBE_NAMES,
  RETAINED_EVIDENCE_FILE_CONTRACTS,
  RUN_AUDIT_TOP_LEVEL_CONTRACTS,
} = require('./lib/contract-reset-contract');

const DEFAULT_FIXTURE = path.join(__dirname, 'examples.json');
const SCHEMA_VERSION = 'spec-prd-eval-run.v1';
const FIXTURE_SCHEMA_VERSION = 'spec-prd-evals.v1';
const VALID_INTENTS = new Set(['create', 'refine', 'validate']);
const ISOLATION_DENY_CODE_SET = new Set(ISOLATION_DENY_CODES);
const ISOLATION_PRIMITIVE_SET = new Set(ISOLATION_PRIMITIVES);

function parseArgs(argv) {
  const args = {
    fixture: DEFAULT_FIXTURE,
    runDir: null,
    requireRunAudit: false,
    json: false,
    help: false,
    error: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--fixture') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) {
        args.error = 'missing value for --fixture';
        break;
      }
      args.fixture = argv[i + 1];
      i += 1;
    } else if (arg === '--run-dir') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) {
        args.error = 'missing value for --run-dir';
        break;
      }
      args.runDir = argv[i + 1];
      i += 1;
    } else if (arg === '--json') {
      args.json = true;
    } else if (arg === '--require-run-audit') {
      args.requireRunAudit = true;
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else {
      args.error = `unknown argument: ${arg}`;
      break;
    }
  }

  return args;
}

function usage() {
  return [
    'usage: run-evals.js [--fixture <path> | --run-dir <path>] [--require-run-audit] [--json]',
    '',
    'Checks spec-prd eval fixture structure, coverage buckets, and reason-code facts.',
    'With --run-dir, validates frozen Contract Reset manifests, patches, sessions, isolation facts, and retained evidence without materializing or invoking a model.',
    'It does not run PRD generation, call an LLM, or judge semantic output quality.',
  ].join('\n');
}

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${stableJson(value[key])}`
    )).join(',')}}`;
  }
  return JSON.stringify(value);
}

function computeMaterializationContractHash(manifest) {
  const patches = Object.fromEntries(
    Object.entries(manifest.patches || {})
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([patchId, patch]) => [patchId, {
        path: patch && patch.path,
        sha256: patch && patch.sha256,
      }]),
  );
  const sourceFiles = (manifest.source_files || []).map((entry) => ({
    path: entry && entry.path,
    tracked: entry && entry.tracked,
    baseline_present: entry && entry.baseline_present !== false,
  }));
  const arms = Object.fromEntries(CONTRACT_RESET_ARMS.map((arm) => [arm, {
    patch_chain: manifest.arms && manifest.arms[arm] && manifest.arms[arm].patch_chain,
    tree_hash: manifest.arms && manifest.arms[arm] && manifest.arms[arm].tree_hash,
  }]));
  return sha256(stableJson({
    schema_version: manifest.schema_version,
    artifact_type: manifest.artifact_type,
    parent_revision: manifest.parent_revision,
    patches,
    source_files: sourceFiles,
    arms,
  }));
}

function deriveExpectedSchedule(cases) {
  const contract = cases && cases.run_contract;
  if (!contract
    || !Array.isArray(cases.cases)
    || !Number.isInteger(contract.repeats_per_arm)
    || contract.repeats_per_arm < 1
    || !Array.isArray(contract.balanced_orders)
    || contract.balanced_orders.length === 0
    || contract.balanced_orders.some((order) => !Array.isArray(order))) {
    return [];
  }
  const rows = [];
  for (const entry of cases.cases.filter((item) => item.gate_role !== 'trigger_matrix')) {
    for (let repeat = 1; repeat <= contract.repeats_per_arm; repeat += 1) {
      const order = contract.balanced_orders[(repeat - 1) % contract.balanced_orders.length];
      order.forEach((arm, index) => {
        rows.push({
          case_id: entry.id,
          arm,
          repeat,
          order_position: index + 1,
        });
      });
    }
  }
  return rows;
}

function scheduleKey(entry) {
  return [entry.case_id, entry.arm, entry.repeat, entry.order_position].join('\u0000');
}

function sessionKey(entry) {
  return `${scheduleKey(entry)}\u0000${entry.session_id}`;
}

function isOpaqueSessionId(value) {
  return isNonEmptyString(value) && !/(?:baseline|phase1[_-]?control|candidate)/i.test(value);
}

function sameFrozenSchedule(actual, expected, options = {}) {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false;
  const expectedKeys = new Set(expected.map(scheduleKey));
  const seenScheduleKeys = new Set();
  const seenSessionIds = new Set();
  for (const entry of actual) {
    if (!entry || !expectedKeys.has(scheduleKey(entry)) || seenScheduleKeys.has(scheduleKey(entry))) {
      return false;
    }
    seenScheduleKeys.add(scheduleKey(entry));
    if (options.requireSessionIds !== false) {
      if (!isOpaqueSessionId(entry.session_id) || seenSessionIds.has(entry.session_id)) return false;
      seenSessionIds.add(entry.session_id);
    }
  }
  return seenScheduleKeys.size === expectedKeys.size;
}

function sameSessionSchedule(actual, expected) {
  if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) return false;
  const expectedBySchedule = new Map(expected.map((entry) => [scheduleKey(entry), entry.session_id]));
  const seen = new Set();
  for (const entry of actual) {
    const key = scheduleKey(entry || {});
    if (seen.has(key) || expectedBySchedule.get(key) !== (entry && entry.session_id)) return false;
    seen.add(key);
  }
  return seen.size === expectedBySchedule.size;
}

function isPassedIsolationEvidence(isolation) {
  if (!isolation
    || isolation.status !== 'passed'
    || isolation.artifact_type !== 'confirmed'
    || !ISOLATION_PRIMITIVE_SET.has(isolation.primitive)
    || isolation.reason_code !== 'isolation_probe_passed'
    || !isolation.probes
    || typeof isolation.probes !== 'object'
    || Array.isArray(isolation.probes)) {
    return false;
  }
  const names = Object.keys(isolation.probes).sort();
  if (JSON.stringify(names) !== JSON.stringify([...ISOLATION_PROBE_NAMES].sort())) return false;
  return ISOLATION_PROBE_NAMES.every((name) => {
    const probe = isolation.probes[name];
    return probe && probe.denied === true && ISOLATION_DENY_CODE_SET.has(probe.code);
  });
}

function createReport(fixture) {
  return {
    schema_version: SCHEMA_VERSION,
    status: 'failed',
    fixture,
    case_count: 0,
    coverage: {},
    case_types: {},
    missing_required_buckets: [],
    invalid_cases: [],
    reason_code: 'fixture_contract_failed',
  };
}

function addInvalid(report, id, reasonCode, field, message) {
  report.invalid_cases.push({
    id,
    reason_code: reasonCode,
    field,
    message,
  });
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function increment(map, key) {
  map[key] = (map[key] || 0) + 1;
}

function missingRequiredStrings(actual, required) {
  if (!Array.isArray(required) || required.length === 0) return [];
  const actualSet = new Set(Array.isArray(actual) ? actual : []);
  return required.filter((value) => !actualSet.has(value));
}

function validateFixture(fixture, fixturePath) {
  const report = createReport(fixturePath);

  if (!fixture || typeof fixture !== 'object' || Array.isArray(fixture)) {
    addInvalid(report, '<fixture>', 'fixture_not_object', 'root', 'fixture must be a JSON object');
    return report;
  }

  if (fixture.schema_version !== FIXTURE_SCHEMA_VERSION) {
    addInvalid(
      report,
      '<fixture>',
      'schema_version_invalid',
      'schema_version',
      `expected ${FIXTURE_SCHEMA_VERSION}`,
    );
  }

  const contract = fixture.case_contract;
  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    addInvalid(report, '<fixture>', 'case_contract_missing', 'case_contract', 'case contract is required');
  }

  const allowedCaseTypes = new Set(
    contract && Array.isArray(contract.case_types) ? contract.case_types : [],
  );
  const requiredBuckets = contract && Array.isArray(contract.required_quality_buckets)
    ? contract.required_quality_buckets
    : [];
  const mustNotRequiredBuckets = new Set(
    contract && Array.isArray(contract.must_not_required_quality_buckets)
      ? contract.must_not_required_quality_buckets
      : [],
  );

  if (allowedCaseTypes.size === 0) {
    addInvalid(report, '<fixture>', 'case_types_missing', 'case_contract.case_types', 'case types are required');
  }
  if (requiredBuckets.length === 0) {
    addInvalid(
      report,
      '<fixture>',
      'required_quality_buckets_missing',
      'case_contract.required_quality_buckets',
      'required quality buckets are required',
    );
  }

  if (!Array.isArray(fixture.cases)) {
    addInvalid(report, '<fixture>', 'cases_missing', 'cases', 'cases must be an array');
    return report;
  }

  report.case_count = fixture.cases.length;
  const ids = new Set();
  const casesById = new Map();

  fixture.cases.forEach((entry, index) => {
    const id = isNonEmptyString(entry && entry.id) ? entry.id : `<case:${index}>`;

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      addInvalid(report, id, 'case_not_object', 'case', 'case must be an object');
      return;
    }
    if (!isNonEmptyString(entry.id)) {
      addInvalid(report, id, 'id_missing', 'id', 'id must be a non-empty string');
    } else if (ids.has(entry.id)) {
      addInvalid(report, entry.id, 'id_duplicate', 'id', 'id must be unique');
    } else {
      ids.add(entry.id);
      casesById.set(entry.id, entry);
    }

    if (!VALID_INTENTS.has(entry.intent)) {
      addInvalid(report, id, 'intent_invalid', 'intent', 'intent must be create, refine, or validate');
    }
    if (!allowedCaseTypes.has(entry.case_type)) {
      addInvalid(report, id, 'case_type_invalid', 'case_type', 'case_type must be declared by case_contract');
    } else {
      increment(report.case_types, entry.case_type);
    }
    if (!isNonEmptyString(entry.input_shape)) {
      addInvalid(report, id, 'input_shape_missing', 'input_shape', 'input_shape must be a non-empty string');
    }
    if (!isStringArray(entry.expected)) {
      addInvalid(report, id, 'expected_invalid', 'expected', 'expected must be a non-empty string array');
    }
    if (!isStringArray(entry.coverage_tags)) {
      addInvalid(report, id, 'coverage_tags_invalid', 'coverage_tags', 'coverage_tags must be a non-empty string array');
    }
    if (!isStringArray(entry.quality_buckets)) {
      addInvalid(report, id, 'quality_buckets_invalid', 'quality_buckets', 'quality_buckets must be a non-empty string array');
    } else {
      entry.quality_buckets.forEach((bucket) => {
        if (!/^[a-z0-9][a-z0-9-]*$/.test(bucket)) {
          addInvalid(report, id, 'quality_bucket_invalid', 'quality_buckets', `invalid quality bucket: ${bucket}`);
        }
        increment(report.coverage, bucket);
      });

      const requiresMustNot = entry.quality_buckets.some((bucket) => mustNotRequiredBuckets.has(bucket));
      if (requiresMustNot && !isStringArray(entry.must_not)) {
        addInvalid(
          report,
          id,
          'must_not_missing',
          'must_not',
          'must_not is required for high-risk quality buckets',
        );
      }
    }
  });

  const sentinelCases = contract && Array.isArray(contract.sentinel_cases)
    ? contract.sentinel_cases
    : [];
  sentinelCases.forEach((sentinel, index) => {
    const sentinelId = isNonEmptyString(sentinel && sentinel.id)
      ? sentinel.id
      : `<sentinel:${index}>`;
    if (!sentinel || typeof sentinel !== 'object' || Array.isArray(sentinel)) {
      addInvalid(report, sentinelId, 'sentinel_case_invalid', 'case_contract.sentinel_cases', 'sentinel case must be an object');
      return;
    }
    if (!isNonEmptyString(sentinel.id)) {
      addInvalid(report, sentinelId, 'sentinel_case_id_missing', 'case_contract.sentinel_cases.id', 'sentinel case id is required');
      return;
    }

    const entry = casesById.get(sentinel.id);
    if (!entry) {
      addInvalid(report, sentinel.id, 'sentinel_case_missing', 'case_contract.sentinel_cases', 'required sentinel case is missing');
      return;
    }

    const requires = sentinel.requires && typeof sentinel.requires === 'object' && !Array.isArray(sentinel.requires)
      ? sentinel.requires
      : {};
    if (isNonEmptyString(requires.case_type) && entry.case_type !== requires.case_type) {
      addInvalid(report, sentinel.id, 'sentinel_case_requirement_missing', 'case_type', `expected sentinel case_type: ${requires.case_type}`);
    }
    ['quality_buckets', 'coverage_tags', 'expected', 'must_not'].forEach((field) => {
      missingRequiredStrings(entry[field], requires[field]).forEach((missing) => {
        addInvalid(
          report,
          sentinel.id,
          'sentinel_case_requirement_missing',
          field,
          `missing sentinel ${field}: ${missing}`,
        );
      });
    });
  });

  report.missing_required_buckets = requiredBuckets.filter((bucket) => !report.coverage[bucket]);
  if (report.missing_required_buckets.length > 0) {
    report.missing_required_buckets.forEach((bucket) => {
      addInvalid(
        report,
        '<fixture>',
        'required_quality_bucket_missing',
        'case_contract.required_quality_buckets',
        `missing quality bucket: ${bucket}`,
      );
    });
  }

  if (report.invalid_cases.length === 0) {
    report.status = 'passed';
    report.reason_code = 'eval_fixture_passed';
  }

  return report;
}

function validateContractResetCases(document, documentPath = '<contract-reset-cases>') {
  const report = {
    schema_version: 'contract-reset-cases-validation/v1',
    fixture: documentPath,
    status: 'failed',
    reason_codes: [],
    case_count: 0,
  };
  const fail = (reasonCode) => report.reason_codes.push(reasonCode);
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    fail('contract_reset_cases_not_object');
    return report;
  }
  if (document.schema_version !== 'contract-reset-cases/v1') fail('contract_reset_cases_schema_invalid');
  const contract = document.run_contract;
  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    fail('run_contract_missing');
    return report;
  }
  const arms = CONTRACT_RESET_ARMS;
  if (JSON.stringify(contract.arms) !== JSON.stringify(arms)) fail('arm_contract_invalid');
  if (!Number.isInteger(contract.repeats_per_arm) || contract.repeats_per_arm < 3) {
    fail('repeat_contract_invalid');
  }
  if (!Array.isArray(contract.balanced_orders) || contract.balanced_orders.length < 3
    || contract.balanced_orders.some((order) => (
      !Array.isArray(order) || order.length !== arms.length || arms.some((arm) => !order.includes(arm))
    ))) {
    fail('balanced_order_contract_invalid');
  }
  if (!contract.invocation_profile
    || !['host', 'model', 'agent_type', 'context_reuse', 'tool_posture'].every((field) => (
      isNonEmptyString(contract.invocation_profile[field])
    ))) {
    fail('invocation_profile_incomplete');
  }
  if (!isNonEmptyString(contract.tie_rule) || !/no-go/i.test(contract.tie_rule)) fail('tie_rule_missing');
  if (!isNonEmptyString(contract.inconclusive_rule) || !/Gate A/i.test(contract.inconclusive_rule)) {
    fail('inconclusive_rule_missing');
  }
  const budget = contract.maximum_complexity_budget;
  const budgetFields = [
    'mandatory_state_concepts',
    'always_read_references',
    'canonical_owners',
    'hot_path_reference_reads',
  ];
  if (!budget || budgetFields.some((field) => !Number.isInteger(budget[field]) || budget[field] < 0)
    || budget.frozen_before_results !== true) {
    fail('complexity_budget_invalid');
  }
  if (!Array.isArray(document.cases)) {
    fail('contract_reset_cases_missing');
    return report;
  }
  report.case_count = document.cases.length;
  const ids = new Set();
  for (const entry of document.cases) {
    if (!entry || typeof entry !== 'object' || !isNonEmptyString(entry.id) || ids.has(entry.id)) {
      fail('contract_reset_case_id_invalid');
      continue;
    }
    ids.add(entry.id);
    if (!['gate_a_primary', 'gate_a_critical', 'trigger_matrix'].includes(entry.gate_role)) {
      fail('contract_reset_case_role_invalid');
    }
    if (entry.gate_role === 'gate_a_primary') {
      const effect = entry.minimum_material_effect;
      if (!VALID_INTENTS.has(entry.intent)
        || !effect
        || !Number.isInteger(effect.eliminated_load_bearing_what)
        || !Number.isInteger(effect.interaction_waste_reduction)
        || effect.core_product_quality_floor !== 'no-new-fail') {
        fail('primary_material_effect_invalid');
      }
    }
    if (entry.gate_role === 'gate_a_critical' && !['design', 'domain', 'stress'].includes(entry.intent)) {
      fail('critical_case_invalid');
    }
    if (!Array.isArray(entry.authority_profile) || entry.authority_profile.length === 0) {
      fail('case_authority_profile_missing');
    }
    if (!Array.isArray(entry.inputs)) fail('case_inputs_invalid');
  }
  for (const intent of VALID_INTENTS) {
    if (!document.cases.some((entry) => entry.gate_role === 'gate_a_primary' && entry.intent === intent)) {
      fail('primary_case_missing');
    }
  }
  for (const intent of ['design', 'domain', 'stress']) {
    if (!document.cases.some((entry) => entry.gate_role === 'gate_a_critical' && entry.intent === intent)) {
      fail('critical_case_missing');
    }
  }
  if (!document.cases.some((entry) => entry.gate_role === 'trigger_matrix')) {
    fail('trigger_matrix_missing');
  }
  report.reason_codes = [...new Set(report.reason_codes)].sort();
  if (report.reason_codes.length === 0) report.status = 'passed';
  return report;
}

function readRunJson(runContext, relativePath, reasonCode, failures) {
  try {
    const filePath = resolveConfinedPath(runContext, relativePath, relativePath);
    const bytes = fs.readFileSync(filePath);
    return {
      path: filePath,
      bytes,
      document: parseJsonBytes(relativePath, bytes),
    };
  } catch (_error) {
    failures.push(reasonCode);
    return null;
  }
}

function computeThresholdContractHash(cases) {
  return sha256(JSON.stringify({
    cases: (cases.cases || []).map((entry) => [entry.id, entry.minimum_material_effect || null]),
    budget: cases.run_contract && cases.run_contract.maximum_complexity_budget,
  }));
}

function artifactTypeMatches(artifact, expected) {
  return Boolean(artifact) && artifact.artifact_type === expected;
}

function isSha256Hash(value) {
  return /^sha256:[a-f0-9]{64}$/.test(value || '');
}

function isCanonicalIsoTimestamp(value) {
  if (!isNonEmptyString(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function readBoundRunArtifact(runContext, reference) {
  if (!reference
    || !isExactRepoRelativePath(reference.path || '')
    || !isSha256Hash(reference.sha256)) {
    return null;
  }
  try {
    const artifactPath = resolveConfinedPath(
      runContext,
      reference.path,
      `bound run artifact ${reference.path}`,
    );
    const bytes = fs.readFileSync(artifactPath);
    if (sha256(bytes) !== reference.sha256) return null;
    return {
      path: artifactPath,
      bytes,
      document: parseJsonBytes(`bound run artifact ${reference.path}`, bytes),
    };
  } catch (_error) {
    return null;
  }
}

function validateMaterializationVerification(runContext, manifest, failures) {
  const bound = readBoundRunArtifact(runContext, manifest.materialization_verification);
  if (!bound) {
    failures.push(manifest.materialization_verification
      ? 'materialization_verification_invalid'
      : 'materialization_verification_missing');
    return;
  }
  const verification = bound.document;
  const armNames = verification && verification.arms && typeof verification.arms === 'object'
    ? Object.keys(verification.arms).sort()
    : [];
  let valid = Boolean(
    verification
    && verification.schema_version === 'contract-reset-materialization-verification/v1'
    && artifactTypeMatches(verification, 'confirmed')
    && verification.producer === 'run-contract-reset-arm.js'
    && verification.parent_revision === manifest.parent_revision
    && verification.contract_hash === computeMaterializationContractHash(manifest)
    && JSON.stringify(armNames) === JSON.stringify([...CONTRACT_RESET_ARMS].sort()),
  );
  for (const arm of CONTRACT_RESET_ARMS) {
    const manifestArm = manifest.arms && manifest.arms[arm];
    const verifiedArm = verification && verification.arms && verification.arms[arm];
    const expectedPatchChain = CONTRACT_RESET_PATCH_CHAINS[arm];
    if (!manifestArm
      || !verifiedArm
      || JSON.stringify(manifestArm.patch_chain) !== JSON.stringify(expectedPatchChain)
      || JSON.stringify(verifiedArm.patch_chain) !== JSON.stringify(expectedPatchChain)
      || verifiedArm.tree_hash !== manifestArm.tree_hash
      || !isSha256Hash(verifiedArm.tree_hash)
      || !Number.isInteger(verifiedArm.source_file_count)
      || verifiedArm.source_file_count < 0) {
      valid = false;
    }
  }
  if (!valid) failures.push('materialization_verification_invalid');
}

function retainedFilesMatchManifest(runContext, bound, retainedManifest) {
  const retainedFiles = retainedManifest.retained_files;
  const hashes = retainedManifest.hashes;
  if (!retainedFiles || typeof retainedFiles !== 'object' || Array.isArray(retainedFiles)
    || !hashes || typeof hashes !== 'object' || Array.isArray(hashes)) {
    return false;
  }
  let retainedContext;
  try {
    retainedContext = createRootContext(path.dirname(bound.path), 'retained evidence directory');
  } catch (_error) {
    return false;
  }
  return Object.entries(RETAINED_EVIDENCE_FILE_CONTRACTS).every(([
    fileKey,
    { hashKey },
  ]) => {
    try {
      const relativePath = assertExactRelativePath(retainedFiles[fileKey], `retained file ${fileKey}`);
      const filePath = resolveConfinedPath(
        retainedContext,
        relativePath,
        `retained file ${fileKey}`,
      );
      return isSha256Hash(hashes[hashKey])
        && sha256(fs.readFileSync(filePath)) === hashes[hashKey];
    } catch (_error) {
      return false;
    }
  });
}

function retainedProvenanceMatches(options) {
  const {
    runContext,
    bound,
    retainedManifest,
    manifest,
    sourceManifestHash,
    entry,
    attemptedEntry,
  } = options;
  const provenance = retainedManifest.provenance;
  const frozen = provenance && provenance.frozen_session;
  const namespace = provenance && provenance.namespace;
  const sourceManifest = provenance && provenance.source_manifest;
  const armContract = manifest.arms && manifest.arms[entry.arm];
  return retainedManifest.transformation_version === 'contract-reset-blind-transform/v1'
    && retainedManifest.producer === 'prepare-contract-reset-evidence.js'
    && retainedManifest.body_byte_preserved === true
    && sourceManifest
    && sourceManifest.path === 'source-manifest.json'
    && sourceManifest.sha256 === sourceManifestHash
    && sourceManifest.run_id === manifest.run_id
    && sourceManifest.parent_revision === manifest.parent_revision
    && frozen
    && sessionKey(frozen) === sessionKey(entry)
    && namespace
    && namespace.namespace_id === attemptedEntry.namespace_id
    && armContract
    && namespace.source_tree_hash === armContract.tree_hash
    && isSha256Hash(namespace.model_visible_manifest_hash)
    && retainedFilesMatchManifest(runContext, bound, retainedManifest);
}

function expectedRunAuditFiles(runContext, runFacts) {
  const expected = new Map(RUN_AUDIT_TOP_LEVEL_CONTRACTS.map((entry) => (
    [entry.name, entry.artifactType]
  )));
  for (const completed of runFacts.completed_sessions || []) {
    const bound = readBoundRunArtifact(runContext, completed.retained_evidence);
    if (!bound) return null;
    expected.set(completed.retained_evidence.path, 'generated');
    const retainedFiles = bound.document.retained_files;
    if (!retainedFiles || typeof retainedFiles !== 'object' || Array.isArray(retainedFiles)) return null;
    const manifestDirectory = path.posix.dirname(completed.retained_evidence.path);
    for (const [key, { artifactType }] of Object.entries(RETAINED_EVIDENCE_FILE_CONTRACTS)) {
      let relativePath;
      try {
        relativePath = assertExactRelativePath(retainedFiles[key], `retained file ${key}`);
      } catch (_error) {
        return null;
      }
      expected.set(path.posix.join(manifestDirectory, relativePath), artifactType);
    }
  }
  return expected;
}

function validateRunAuditManifest(options) {
  const {
    runContext,
    manifest,
    holdout,
    runFacts,
    gateReasons,
  } = options;
  const auditFailures = [];
  const auditArtifact = readRunJson(
    runContext,
    'run-audit-manifest.json',
    'run_audit_manifest_missing',
    auditFailures,
  );
  if (!auditArtifact) return { reasonCode: 'run_audit_manifest_missing' };
  const audit = auditArtifact.document;
  const expectedFiles = expectedRunAuditFiles(runContext, runFacts);
  if (!expectedFiles) return { reasonCode: 'run_audit_manifest_invalid' };
  expectedFiles.set(
    'promotion-holdout-commitment.json',
    holdout && holdout.artifact_type,
  );
  expectedFiles.set('run-facts.json', runFacts.artifact_type);
  const retainedFiles = audit && audit.retained_files;
  let valid = Boolean(
    audit
    && audit.schema_version === 'contract-reset-run-audit/v1'
    && audit.artifact_type === 'generated'
    && audit.producer === 'prepare-contract-reset-evidence.js'
    && audit.source_run_id === manifest.run_id
    && retainedFiles
    && typeof retainedFiles === 'object'
    && !Array.isArray(retainedFiles)
    && JSON.stringify(Object.keys(retainedFiles).sort())
      === JSON.stringify([...expectedFiles.keys()].sort()),
  );
  for (const [name, artifactType] of expectedFiles) {
    const contract = retainedFiles && retainedFiles[name];
    if (!contract
      || contract.artifact_type !== artifactType
      || !isSha256Hash(contract.sha256)) {
      valid = false;
      continue;
    }
    try {
      const filePath = resolveConfinedPath(runContext, name, `run audit retained file ${name}`);
      if (sha256(fs.readFileSync(filePath)) !== contract.sha256) valid = false;
    } catch (_error) {
      valid = false;
    }
  }
  const expectedGateStatus = runFacts.status === 'invalid'
    ? 'invalid'
    : (gateReasons.size > 0 ? 'inconclusive' : 'awaiting-semantic-review');
  const expectedReasons = new Set(gateReasons);
  if (expectedGateStatus === 'awaiting-semantic-review') {
    expectedReasons.add('semantic_gate_decision_required');
  }
  const deterministic = audit && audit.deterministic_validation;
  if (!deterministic
    || deterministic.status !== 'passed'
    || deterministic.gate_a_status !== expectedGateStatus
    || JSON.stringify([...(deterministic.reason_codes || [])].sort())
      !== JSON.stringify([...expectedReasons].sort())) {
    valid = false;
  }
  return { reasonCode: valid ? null : 'run_audit_manifest_invalid' };
}

function validateAttemptedAndCompletedSessions(
  runContext,
  manifest,
  sourceManifestHash,
  runFacts,
  failures,
  gateReasons,
) {
  const manifestSessions = manifest.sessions;
  if (!Number.isInteger(runFacts.scheduled_session_count)
    || runFacts.scheduled_session_count !== manifestSessions.length
    || !sameSessionSchedule(runFacts.sessions, manifestSessions)) {
    failures.push('run_facts_schedule_mismatch');
  }
  if (!Array.isArray(runFacts.attempted_sessions)) failures.push('attempted_session_invalid');
  if (!Array.isArray(runFacts.completed_sessions)) failures.push('completed_session_invalid');
  const attempted = Array.isArray(runFacts.attempted_sessions) ? runFacts.attempted_sessions : [];
  const completed = Array.isArray(runFacts.completed_sessions) ? runFacts.completed_sessions : [];
  const manifestBySession = new Map(manifestSessions.map((entry) => [sessionKey(entry), entry]));
  const attemptedBySession = new Map();
  for (const entry of attempted) {
    const key = sessionKey(entry || {});
    if (!manifestBySession.has(key)
      || attemptedBySession.has(key)
      || !isNonEmptyString(entry.namespace_id)
      || !isNonEmptyString(entry.status)
      || typeof entry.model_invoked !== 'boolean') {
      failures.push('attempted_session_invalid');
      continue;
    }
    attemptedBySession.set(key, entry);
  }
  const completedKeys = new Set();
  let retainedEvidenceMissing = false;
  let retainedEvidenceInvalid = false;
  for (const entry of completed) {
    const key = sessionKey(entry || {});
    const attemptedEntry = attemptedBySession.get(key);
    if (!attemptedEntry
      || completedKeys.has(key)
      || entry.namespace_id !== attemptedEntry.namespace_id
      || entry.status !== 'completed'
      || entry.model_invoked !== true) {
      failures.push('completed_session_invalid');
      continue;
    }
    completedKeys.add(key);
    const retained = readBoundRunArtifact(runContext, entry.retained_evidence);
    if (!entry.retained_evidence) {
      retainedEvidenceMissing = true;
      continue;
    }
    if (!retained) {
      retainedEvidenceInvalid = true;
      continue;
    }
    const retainedManifest = retained.document;
    if (!retainedManifest
      || retainedManifest.schema_version !== 'contract-reset-retained-evidence/v1'
      || !artifactTypeMatches(retainedManifest, 'generated')
      || retainedManifest.case_id !== entry.case_id
      || retainedManifest.arm !== entry.arm
      || Number(retainedManifest.repeat) !== entry.repeat
      || Number(retainedManifest.order_position) !== entry.order_position
      || retainedManifest.session_id !== entry.session_id
      || !retainedProvenanceMatches({
        runContext,
        bound: retained,
        retainedManifest,
        manifest,
        sourceManifestHash,
        entry,
        attemptedEntry,
      })) {
      retainedEvidenceInvalid = true;
    }
  }
  const modelInvokedByRows = attempted.some((entry) => entry && entry.model_invoked === true)
    || completed.length > 0;
  if (runFacts.model_invoked !== modelInvokedByRows) failures.push('run_facts_model_invoked_mismatch');
  if (attemptedBySession.size !== manifestSessions.length) gateReasons.add('session_execution_incomplete');
  if (completedKeys.size !== manifestSessions.length || runFacts.model_invoked !== true) {
    gateReasons.add('model_outcomes_missing');
  }
  if (runFacts.model_invoked === true && retainedEvidenceMissing) {
    gateReasons.add('retained_evidence_missing');
  }
  if (runFacts.model_invoked === true && retainedEvidenceInvalid) {
    gateReasons.add('retained_evidence_invalid');
  }
}

function validateRunDirectory(runDirectory, options = {}) {
  const runDir = path.resolve(runDirectory);
  const repoRoot = path.resolve(options.repoRoot || path.join(__dirname, '../../..'));
  const failures = [];
  const gateReasons = new Set();
  const report = {
    schema_version: 'contract-reset-run-directory-validation/v1',
    mode: 'run-directory',
    run_dir: runDir,
    status: 'failed',
    gate_a_status: 'inconclusive',
    reason_codes: [],
    structural_reason_codes: [],
  };
  let runStat;
  try {
    runStat = fs.lstatSync(runDir);
  } catch (_error) {
    report.reason_codes = ['run_directory_unreadable'];
    report.structural_reason_codes = [...report.reason_codes];
    return report;
  }
  if (!runStat.isDirectory() || runStat.isSymbolicLink()) {
    report.reason_codes = ['run_directory_unsafe'];
    report.structural_reason_codes = [...report.reason_codes];
    return report;
  }
  let runContext;
  let repoContext;
  try {
    runContext = createRootContext(runDir, 'run directory');
    repoContext = createRootContext(repoRoot, 'repository root');
  } catch (_error) {
    report.reason_codes = ['run_directory_unsafe'];
    report.structural_reason_codes = [...report.reason_codes];
    return report;
  }
  const manifestArtifact = readRunJson(
    runContext,
    'source-manifest.json',
    'source_manifest_unreadable',
    failures,
  );
  const holdoutArtifact = readRunJson(
    runContext,
    'promotion-holdout-commitment.json',
    'holdout_commitment_unreadable',
    failures,
  );
  const runFactsArtifact = readRunJson(
    runContext,
    'run-facts.json',
    'run_facts_unreadable',
    failures,
  );
  const manifest = manifestArtifact && manifestArtifact.document;
  const holdout = holdoutArtifact && holdoutArtifact.document;
  const runFacts = runFactsArtifact && runFactsArtifact.document;
  let cases = null;
  if (manifest) {
    if (manifest.schema_version !== 'contract-reset-source-manifest/v1') failures.push('source_manifest_schema_invalid');
    if (!artifactTypeMatches(manifest, 'generated')) failures.push('artifact_type_invalid');
    if (!isNonEmptyString(manifest.threshold_contract_hash)) failures.push('threshold_contract_missing');
    if (!isNonEmptyString(manifest.parent_revision)) failures.push('parent_revision_missing');
    if (!isExactRepoRelativePath(manifest.cases_path || '')) {
      failures.push('cases_path_invalid');
    } else {
      try {
        const casesPath = resolveConfinedPath(
          repoContext,
          manifest.cases_path,
          'Contract Reset cases source',
        );
        const bytes = fs.readFileSync(casesPath);
        if (sha256(bytes) !== manifest.cases_hash) failures.push('cases_hash_mismatch');
        cases = parseJsonBytes('Contract Reset cases source', bytes);
        const casesReport = validateContractResetCases(cases, manifest.cases_path);
        failures.push(...casesReport.reason_codes);
        if (manifest.threshold_contract_hash
          && manifest.threshold_contract_hash !== computeThresholdContractHash(cases)) {
          failures.push('threshold_contract_hash_mismatch');
        }
      } catch (_error) {
        failures.push('cases_read_failed');
      }
    }
    const patchContracts = manifest.patches
      && typeof manifest.patches === 'object'
      && !Array.isArray(manifest.patches)
      ? manifest.patches
      : {};
    const patchIds = Object.keys(patchContracts).sort();
    if (JSON.stringify(patchIds) !== JSON.stringify(['candidate', 'phase1_control'])) {
      failures.push('patch_contract_missing');
    }
    for (const [patchId, patchContract] of Object.entries(patchContracts)) {
      if (!patchContract || !isExactRepoRelativePath(patchContract.path || '')) {
        failures.push('patch_path_invalid');
        continue;
      }
      try {
        const patchPath = resolveConfinedPath(
          runContext,
          patchContract.path,
          `patch ${patchId}`,
        );
        if (sha256(fs.readFileSync(patchPath)) !== patchContract.sha256) failures.push('patch_hash_mismatch');
      } catch (_error) {
        failures.push('patch_path_unsafe');
      }
    }
    const sessions = Array.isArray(manifest.sessions) ? manifest.sessions : [];
    if (cases) {
      const expectedSchedule = deriveExpectedSchedule(cases);
      if (!sameFrozenSchedule(sessions, expectedSchedule, { requireSessionIds: false })) {
        failures.push('session_schedule_mismatch');
      }
      if (!sameFrozenSchedule(sessions, expectedSchedule)) failures.push('session_schedule_invalid');
    } else if (sessions.length === 0) {
      failures.push('session_schedule_invalid');
    }
    for (const arm of CONTRACT_RESET_ARMS) {
      const armContract = manifest.arms && manifest.arms[arm];
      if (!armContract
        || JSON.stringify(armContract.patch_chain) !== JSON.stringify(CONTRACT_RESET_PATCH_CHAINS[arm])
        || !isSha256Hash(armContract.tree_hash)) {
        failures.push('arm_tree_contract_invalid');
      }
    }
    validateMaterializationVerification(runContext, manifest, failures);
  }
  if (holdout) {
    if (holdout.schema_version !== 'contract-reset-holdout-commitment/v1') {
      failures.push('holdout_commitment_schema_invalid');
    } else if (holdout.commitment_status === 'unavailable') {
      if (!artifactTypeMatches(holdout, 'degraded')) failures.push('artifact_type_invalid');
      gateReasons.add('holdout_commitment_unavailable');
    } else if (holdout.commitment_status !== 'committed') {
      failures.push('holdout_commitment_schema_invalid');
    } else if (![
      'attempt_id',
      'candidate_hash',
      'source_hash',
      'bundle_hash',
      'opaque_custody_id',
      'custodian',
      'retention_authority',
      'expires_at',
    ].every((field) => isNonEmptyString(holdout[field]))) {
      failures.push('holdout_commitment_incomplete');
    } else if (!artifactTypeMatches(holdout, 'confirmed')) {
      failures.push('artifact_type_invalid');
    } else if (!isSha256Hash(holdout.candidate_hash)
      || !isSha256Hash(holdout.source_hash)
      || !isSha256Hash(holdout.bundle_hash)
      || !isCanonicalIsoTimestamp(holdout.expires_at)) {
      failures.push('holdout_commitment_schema_invalid');
    } else if (!manifest
      || holdout.attempt_id !== manifest.attempt_id
      || holdout.candidate_hash !== (
        manifest.arms && manifest.arms.candidate && manifest.arms.candidate.tree_hash
      )
      || holdout.source_hash !== (
        manifest.arms && manifest.arms.phase1_control && manifest.arms.phase1_control.tree_hash
      )) {
      failures.push('holdout_commitment_binding_mismatch');
    }
  }
  if (runFacts) {
    if (runFacts.schema_version !== 'contract-reset-run-facts/v1') failures.push('run_facts_schema_invalid');
    const expectedRunFactsType = runFacts.status === 'inconclusive' ? 'degraded' : 'confirmed';
    if (!['inconclusive', 'completed', 'invalid'].includes(runFacts.status)) {
      failures.push('run_facts_schema_invalid');
    } else if (!artifactTypeMatches(runFacts, expectedRunFactsType)) {
      failures.push('artifact_type_invalid');
    }
    if (!Array.isArray(runFacts.reason_codes)) {
      failures.push('run_facts_schema_invalid');
    } else {
      for (const reasonCode of runFacts.reason_codes) {
        if (isNonEmptyString(reasonCode)) gateReasons.add(reasonCode);
        else failures.push('run_facts_schema_invalid');
      }
    }
    if (runFacts.isolation) {
      if (!['inconclusive', 'passed', 'invalid'].includes(runFacts.isolation.status)) {
        failures.push('run_facts_schema_invalid');
      }
      const expectedIsolationType = runFacts.isolation.status === 'inconclusive'
        ? 'degraded'
        : 'confirmed';
      if (!artifactTypeMatches(runFacts.isolation, expectedIsolationType)) {
        failures.push('artifact_type_invalid');
      }
    }
    if (!runFacts.isolation || runFacts.isolation.status !== 'passed') {
      gateReasons.add(runFacts.isolation && runFacts.isolation.reason_code
        ? runFacts.isolation.reason_code
        : 'hard_isolation_unavailable');
    } else if (!isPassedIsolationEvidence(runFacts.isolation)) {
      gateReasons.add('isolation_probe_contract_invalid');
    }
    if (manifest && Array.isArray(manifest.sessions)) {
      validateAttemptedAndCompletedSessions(
        runContext,
        manifest,
        sha256(manifestArtifact.bytes),
        runFacts,
        failures,
        gateReasons,
      );
    }
    if (runFacts.status === 'invalid') report.gate_a_status = 'invalid';
  }
  if (options.requireRunAudit === true && manifest && holdout && runFacts && failures.length === 0) {
    const auditValidation = validateRunAuditManifest({
      runContext,
      manifest,
      holdout,
      runFacts,
      gateReasons,
    });
    if (auditValidation.reasonCode) failures.push(auditValidation.reasonCode);
  } else if (options.requireRunAudit === true && failures.length === 0) {
    failures.push('run_audit_manifest_invalid');
  }
  report.structural_reason_codes = [...new Set(failures)].sort();
  if (report.structural_reason_codes.length === 0) {
    report.status = 'passed';
    if (report.gate_a_status !== 'invalid') {
      report.gate_a_status = gateReasons.size > 0 ? 'inconclusive' : 'awaiting-semantic-review';
    }
    if (report.gate_a_status === 'awaiting-semantic-review') {
      gateReasons.add('semantic_gate_decision_required');
    }
  }
  report.reason_codes = [...new Set([...report.structural_reason_codes, ...gateReasons])].sort();
  return report;
}

function printReport(report, json) {
  if (json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }

  if (report.mode === 'run-directory') {
    process.stdout.write(`spec-prd Contract Reset run directory: ${report.status}\n`);
    process.stdout.write(`gate_a_status=${report.gate_a_status}\n`);
    process.stdout.write(`reason_codes=${report.reason_codes.join(',') || 'none'}\n`);
    return;
  }

  process.stdout.write(`spec-prd eval fixture: ${report.status}\n`);
  process.stdout.write(`reason_code=${report.reason_code}\n`);
  process.stdout.write(`case_count=${report.case_count}\n`);
  process.stdout.write(`missing_required_buckets=${report.missing_required_buckets.join(',') || 'none'}\n`);
  if (report.invalid_cases.length > 0) {
    report.invalid_cases.forEach((entry) => {
      process.stdout.write(`${entry.id}: ${entry.reason_code} (${entry.field}) ${entry.message}\n`);
    });
  }
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return 0;
  }
  if (args.error) {
    process.stderr.write(`reason_code=bad_arguments\n${args.error}\n${usage()}\n`);
    return 2;
  }

  if (args.runDir) {
    const report = validateRunDirectory(args.runDir, {
      requireRunAudit: args.requireRunAudit,
    });
    printReport(report, args.json);
    return report.status === 'passed' ? 0 : 1;
  }

  const fixturePath = path.resolve(args.fixture);
  let text;
  try {
    text = fs.readFileSync(fixturePath, 'utf8');
  } catch (err) {
    const report = createReport(fixturePath);
    report.status = 'error';
    report.reason_code = 'fixture_read_failed';
    addInvalid(report, '<fixture>', 'fixture_read_failed', 'fixture', `cannot read fixture: ${fixturePath}`);
    printReport(report, args.json);
    return 2;
  }

  let fixture;
  try {
    fixture = JSON.parse(text);
  } catch (err) {
    const report = createReport(fixturePath);
    report.status = 'error';
    report.reason_code = 'fixture_json_invalid';
    addInvalid(report, '<fixture>', 'fixture_json_invalid', 'fixture', err.message);
    printReport(report, args.json);
    return 2;
  }

  const report = validateFixture(fixture, fixturePath);
  printReport(report, args.json);
  return report.status === 'passed' ? 0 : 1;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  computeMaterializationContractHash,
  computeThresholdContractHash,
  deriveExpectedSchedule,
  isPassedIsolationEvidence,
  main,
  parseArgs,
  validateContractResetCases,
  validateFixture,
  validateRunDirectory,
};
