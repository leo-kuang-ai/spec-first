'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');

const { validateAgainstSchema } = require('./schema-validator');
const {
  PROVIDER_UNTRUSTED_CLOSE,
  PROVIDER_UNTRUSTED_OPEN,
  sha256,
} = require('./worker-dispatch-host-preflight-validator');

const SCHEMA_PATH = path.resolve(
  __dirname,
  '../../docs/contracts/verification/worker-dispatch-host-journey.schema.json',
);
const DEFAULT_SOURCE_ROOT = path.resolve(__dirname, '../..');
const SOURCE_MANIFEST = Object.freeze([
  'docs/contracts/workflows/worker-dispatch-capability.md',
  'docs/contracts/verification/worker-dispatch-host-journey.schema.json',
  'docs/contracts/verification/worker-dispatch-host-preflight.schema.json',
  'src/contracts/worker-dispatch-host-journey-validator.js',
  'src/contracts/worker-dispatch-host-preflight-validator.js',
]);
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const SECRET_VALUE_PATTERNS = [
  /\b(?:api[_-]?key|access[_-]?token|password|secret)\s*[:=]\s*["']?[A-Za-z0-9_./+\-=]{8,}/i,
  /\bsk-[A-Za-z0-9]{8,}\b/,
];
const DEGRADED_REASON_CODES = new Set([
  'dispatch_authorization_missing',
  'subagent_capability_missing',
  'worker_capability_unproven',
  'worker_data_authorization_missing',
  'worker_mutation_unproven',
  'worker_mutation_scope_violated',
  'isolation_requirement_unmet',
  'dispatch_backpressure_exhausted',
  'worker_dispatch_failed',
  'worker_output_invalid',
]);
const JOURNEY_SET_DEGRADED_REASON_CODES = new Set([
  'subagent_capability_missing',
  'worker_capability_unproven',
  'isolation_requirement_unmet',
]);
const DATA_AUTHORIZATION_FIELDS = [
  'restricted_read_authorization',
  'data_egress_authorization',
  'credential_use_authorization',
  'external_communication_authorization',
];
const SEMANTIC_REQUEST_CANONICALIZATION = 'Collapse each whitespace run to one ASCII space and trim leading/trailing whitespace.';
const STATE_OBSERVATION_SCHEMA_VERSION = 'worker-dispatch-state-observation/v1';
const SUPPORTING_CAPTURE_BINDINGS = [
  'journey_kind',
  'status',
  'support_claim',
  'captured_at',
  'freshness_expires_at',
  'capture_owner',
  'capture_method',
  'session_identity',
  'host_identity',
  'host_startup_or_version_ref',
  'tested_host_version',
  'spec_first_revision',
  'dispatch_authorization_receipt',
  'authorization_basis',
  'restricted_read_authorization',
  'data_egress_authorization',
  'credential_use_authorization',
  'external_communication_authorization',
  'provider_trust_domain',
  'discovery_surface',
  'schema_excerpt_ref',
  'schema_excerpt_sha256',
  'schema_completeness',
  'completeness_basis',
  'capture_limitations',
  'candidate_identity_sha256',
  'observed_primitive',
  'candidate_selection_rationale',
  'semantic_request_ref',
  'semantic_request_sha256',
  'context_isolation_need',
  'model_selection_need',
  'desired_concurrency',
  'mutation_scope',
  'mutation_authorization_ref',
  'allowed_mutation_surfaces',
  'output_contract',
  'stop_condition',
  'invocation_performed',
  'capability_probe',
  'worker_dispatch_capability',
  'invocation_started_at',
  'call_status',
  'observed_permission',
  'observed_capacity',
  'observed_context_isolation',
  'observed_model_selection',
  'observed_parallelism',
  'output_excerpt_ref',
  'output_excerpt_sha256',
  'output_validation',
  'mutation_observation',
  'pre_state_ref',
  'post_state_ref',
  'state_observation_ref',
  'state_observation_sha256',
  'redaction_status',
  'reason_codes',
  'invalidation_conditions',
];

function loadSchema() {
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
}

function sourceManifestSha256(repoRoot = DEFAULT_SOURCE_ROOT) {
  const root = fs.realpathSync(path.resolve(repoRoot));
  const digest = crypto.createHash('sha256');
  for (const relativePath of SOURCE_MANIFEST) {
    const absolutePath = path.resolve(root, relativePath);
    if (absolutePath !== root && !absolutePath.startsWith(`${root}${path.sep}`)) {
      throw new Error(`source manifest path escapes repo root: ${relativePath}`);
    }
    const stat = fs.lstatSync(absolutePath);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error(`source manifest entry must be a regular file: ${relativePath}`);
    }
    digest.update(relativePath);
    digest.update('\0');
    digest.update(fs.readFileSync(absolutePath));
    digest.update('\0');
  }
  return digest.digest('hex');
}

function sourceIdentity(repoRoot = DEFAULT_SOURCE_ROOT) {
  const root = fs.realpathSync(path.resolve(repoRoot));
  try {
    const head = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    execFileSync('git', ['ls-files', '--error-unmatch', '--', ...SOURCE_MANIFEST], {
      cwd: root,
      stdio: 'ignore',
    });
    execFileSync('git', ['diff', '--quiet', head, '--', ...SOURCE_MANIFEST], {
      cwd: root,
      stdio: 'ignore',
    });
    if (/^[0-9a-f]{40}$/.test(head)) return `git:${head}`;
  } catch (_error) {
    // Uncommitted, untracked, or non-git source falls back to the manifest hash.
  }
  return `worktree:${sourceManifestSha256(root)}`;
}

function validateSourceIdentity(artifact, options, errors) {
  const sourceRoot = options.sourceRoot || DEFAULT_SOURCE_ROOT;
  try {
    const expected = sourceIdentity(sourceRoot);
    if (artifact.spec_first_revision !== expected) {
      errors.push('spec_first_revision does not match the current source identity');
    }
  } catch (_error) {
    errors.push('current source identity is unavailable');
  }
}

function validateQuotedExcerpt(value, expectedHash, field, errors) {
  if (value === null) {
    if (expectedHash !== null) errors.push(`${field}_sha256 must be null when excerpt is null`);
    return;
  }
  if (typeof value !== 'string') return;
  if (sha256(value) !== expectedHash) errors.push(`${field}_sha256 mismatch`);
  const openCount = value.split(PROVIDER_UNTRUSTED_OPEN).length - 1;
  const closeCount = value.split(PROVIDER_UNTRUSTED_CLOSE).length - 1;
  if (!value.startsWith(PROVIDER_UNTRUSTED_OPEN)
    || !value.endsWith(PROVIDER_UNTRUSTED_CLOSE)
    || openCount !== 1
    || closeCount !== 1) {
    errors.push(`${field} must use provider_untrusted delimiters`);
  } else {
    const inner = value.slice(PROVIDER_UNTRUSTED_OPEN.length, -PROVIDER_UNTRUSTED_CLOSE.length);
    if (/[<>]/.test(inner)) errors.push(`${field} contains unescaped markup`);
  }
  if (CONTROL_CHARACTER_PATTERN.test(value)) errors.push(`${field} contains unsafe control characters`);
  if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
    errors.push(`${field} contains a secret-like value`);
  }
}

function resolveRepoFile(repoRoot, ref, field, errors) {
  if (typeof ref !== 'string' || ref.length === 0) return null;
  let root;
  try {
    root = fs.realpathSync(path.resolve(repoRoot));
  } catch (_error) {
    errors.push('repo root is unavailable');
    return null;
  }
  const candidate = path.resolve(root, ref);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) {
    errors.push(`${field} escapes repo root`);
    return null;
  }
  try {
    const stat = fs.lstatSync(candidate);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      errors.push(`${field} must identify a regular non-symlink file`);
      return null;
    }
    const realCandidate = fs.realpathSync(candidate);
    if (realCandidate !== root && !realCandidate.startsWith(`${root}${path.sep}`)) {
      errors.push(`${field} resolves outside repo root`);
      return null;
    }
    return realCandidate;
  } catch (_error) {
    errors.push(`${field} is unavailable`);
    return null;
  }
}

function validateSupportingCapture(artifact, repoRoot, errors) {
  const capturePath = resolveRepoFile(
    repoRoot,
    artifact.supporting_capture_ref,
    'supporting_capture_ref',
    errors,
  );
  if (!capturePath) return;

  let capture;
  try {
    const body = fs.readFileSync(capturePath);
    if (sha256(body) !== artifact.supporting_capture_sha256) {
      errors.push('supporting_capture_sha256 mismatch');
    }
    capture = JSON.parse(body.toString('utf8'));
  } catch (_error) {
    errors.push('supporting capture must be valid JSON');
    return;
  }

  for (const field of SUPPORTING_CAPTURE_BINDINGS) {
    if (!isDeepStrictEqual(capture[field], artifact[field])) {
      errors.push(`${field} does not match supporting capture`);
    }
  }
  if (capture.semantic_request_canonicalization !== SEMANTIC_REQUEST_CANONICALIZATION) {
    errors.push('supporting capture uses an unsupported semantic request canonicalization');
    return;
  }

  const requestPath = resolveRepoFile(
    repoRoot,
    artifact.semantic_request_ref,
    'semantic_request_ref',
    errors,
  );
  if (!requestPath) return;
  try {
    const request = fs.readFileSync(requestPath, 'utf8').replace(/\s+/g, ' ').trim();
    if (sha256(request) !== artifact.semantic_request_sha256) {
      errors.push('semantic_request_sha256 mismatch');
    }
  } catch (_error) {
    errors.push('semantic request is unavailable');
  }
}

function validateMutationSurface(surface, field, errors) {
  if (typeof surface !== 'string' || !/^repo:[^:]+:[A-Za-z0-9_-]+$/.test(surface)) {
    errors.push(`${field} must use repo:path:side-effect format`);
    return false;
  }
  const relativePath = surface.slice('repo:'.length).replace(/:[A-Za-z0-9_-]+$/, '');
  if (path.posix.normalize(relativePath) !== relativePath
    || relativePath.startsWith('/') || relativePath.split('/').includes('..')) {
    errors.push(`${field} escapes repo scope: ${surface}`);
    return false;
  }
  return true;
}

function validateSnapshot(repoRoot, ref, expectedHash, field, errors) {
  if (typeof expectedHash !== 'string' || !/^[a-f0-9]{64}$/.test(expectedHash)) {
    errors.push(`${field}_sha256 must be a SHA-256 digest`);
    return;
  }
  const snapshotPath = resolveRepoFile(repoRoot, ref, field, errors);
  if (!snapshotPath) return;
  try {
    if (sha256(fs.readFileSync(snapshotPath)) !== expectedHash) {
      errors.push(`${field}_sha256 mismatch`);
    }
  } catch (_error) {
    errors.push(`${field} is unavailable`);
  }
}

function validateStateObservation(artifact, repoRoot, capturedAt, invocationStartedAt, errors) {
  const observationPath = resolveRepoFile(
    repoRoot,
    artifact.state_observation_ref,
    'state_observation_ref',
    errors,
  );
  if (!observationPath) return;

  let observation;
  try {
    const body = fs.readFileSync(observationPath);
    if (sha256(body) !== artifact.state_observation_sha256) {
      errors.push('state_observation_sha256 mismatch');
    }
    observation = JSON.parse(body.toString('utf8'));
  } catch (_error) {
    errors.push('state_observation_ref must point to a valid JSON observation receipt');
    return;
  }

  if (!observation || observation.schema_version !== STATE_OBSERVATION_SCHEMA_VERSION) {
    errors.push('state observation receipt has an unsupported schema version');
    return;
  }
  if (typeof observation.capture_owner !== 'string' || observation.capture_owner.length === 0) {
    errors.push('state observation receipt requires capture_owner');
  }
  if (observation.mutation_observation !== artifact.mutation_observation) {
    errors.push('state observation receipt does not match mutation_observation');
  }
  if (observation.pre_state_ref !== artifact.pre_state_ref
    || observation.post_state_ref !== artifact.post_state_ref) {
    errors.push('state observation receipt does not match artifact state refs');
  }
  if (observation.pre_state_ref === observation.post_state_ref) {
    errors.push('state observation receipt requires distinct pre/post state refs');
  }

  const preObservedAt = Date.parse(observation.pre_observed_at);
  const postObservedAt = Date.parse(observation.post_observed_at);
  if (!Number.isFinite(preObservedAt) || !Number.isFinite(postObservedAt)
    || preObservedAt > invocationStartedAt
    || invocationStartedAt > postObservedAt
    || postObservedAt > capturedAt) {
    errors.push('state observation receipt has an invalid capture window');
  }

  const observedSurfaces = Array.isArray(observation.observed_surfaces)
    ? observation.observed_surfaces
    : [];
  if (observedSurfaces.length === 0) {
    errors.push('state observation receipt requires observed_surfaces');
  }
  const observedSet = new Set();
  for (const surface of observedSurfaces) {
    if (validateMutationSurface(surface, 'observed mutation surface', errors)) {
      observedSet.add(surface);
    }
  }
  if (observedSet.size !== observedSurfaces.length) {
    errors.push('state observation receipt must not duplicate observed surfaces');
  }
  if (artifact.mutation_scope === 'explicitly-scoped') {
    const allowedSet = new Set(artifact.allowed_mutation_surfaces);
    if (allowedSet.size !== observedSet.size
      || [...allowedSet].some((surface) => !observedSet.has(surface))) {
      errors.push('state observation receipt must cover exactly the allowed mutation surfaces');
    }
  }

  validateSnapshot(
    repoRoot,
    artifact.pre_state_ref,
    observation.pre_state_sha256,
    'pre_state_ref',
    errors,
  );
  validateSnapshot(
    repoRoot,
    artifact.post_state_ref,
    observation.post_state_sha256,
    'post_state_ref',
    errors,
  );
  if (artifact.mutation_scope === 'forbidden'
    && artifact.mutation_observation === 'within-scope'
    && observation.pre_state_sha256 !== observation.post_state_sha256) {
    errors.push('forbidden mutation observation requires identical pre/post state digests');
  }
}

function validateNonInvokedMutationObservation(artifact, errors) {
  if (artifact.mutation_observation !== 'not_applicable'
    || artifact.pre_state_ref !== null
    || artifact.post_state_ref !== null
    || artifact.state_observation_ref !== null
    || artifact.state_observation_sha256 !== null
    || artifact.invocation_started_at !== null) {
    errors.push('non-invoked journey requires not_applicable mutation observation and null state evidence');
  }
}

function validateNonInvokedRuntimeEvidence(artifact, errors) {
  const expectsIsolationFailure = Array.isArray(artifact.reason_codes)
    && artifact.reason_codes.includes('isolation_requirement_unmet');
  const hasValidIsolationEvidence = expectsIsolationFailure
    ? ['inherited', 'unknown'].includes(artifact.observed_context_isolation)
    : artifact.observed_context_isolation === 'none';
  if (artifact.observed_permission !== 'not_applicable'
    || artifact.observed_capacity !== 'not_applicable'
    || !hasValidIsolationEvidence
    || artifact.observed_model_selection !== 'none'
    || artifact.observed_parallelism !== 'none'
    || artifact.output_excerpt_ref !== null
    || artifact.output_excerpt !== null
    || artifact.output_excerpt_sha256 !== null
    || artifact.output_validation !== 'not_applicable') {
    errors.push('non-invoked journey requires no live facts and null output evidence');
  }
}

function validateExplicitMutationScope(artifact, repoRoot, now, invocationStartedAt, errors) {
  const scopePath = resolveRepoFile(
    repoRoot,
    artifact.mutation_authorization_ref,
    'mutation_authorization_ref',
    errors,
  );
  if (!scopePath) return;

  let scope;
  try {
    scope = JSON.parse(fs.readFileSync(scopePath, 'utf8'));
  } catch (_error) {
    errors.push('mutation_authorization_ref must point to a valid JSON scope receipt');
    return;
  }
  if (!scope || typeof scope.authority_origin !== 'string' || scope.authority_origin.length === 0) {
    errors.push('mutation authorization receipt requires authority_origin');
  }
  const capturedAt = Date.parse(scope && scope.captured_at);
  const expiresAt = Date.parse(scope && scope.freshness_expires_at);
  if (!Number.isFinite(capturedAt) || !Number.isFinite(expiresAt)
    || capturedAt >= expiresAt || capturedAt > now || expiresAt <= now) {
    errors.push('mutation authorization receipt has an invalid or stale freshness window');
  }
  if (artifact.invocation_performed
    && (!Number.isFinite(invocationStartedAt)
      || capturedAt > invocationStartedAt
      || expiresAt <= invocationStartedAt)) {
    errors.push('mutation authorization receipt was not valid when invocation started');
  }
  const authoritySurfaces = Array.isArray(scope && scope.allowed_mutation_surfaces)
    ? scope.allowed_mutation_surfaces
    : [];
  if (authoritySurfaces.length === 0) {
    errors.push('mutation authorization receipt must declare allowed_mutation_surfaces');
  }
  const authoritySet = new Set(authoritySurfaces);
  for (const surface of artifact.allowed_mutation_surfaces) {
    if (!validateMutationSurface(surface, 'allowed mutation surface', errors)) continue;
    if (!authoritySet.has(surface)) {
      errors.push(`allowed mutation surface is not declared by authorization receipt: ${surface}`);
    }
  }
}

function validateWorkerDispatchHostJourney(artifact, options = {}) {
  let schema = options.schema;
  if (!schema) {
    try {
      schema = loadSchema();
    } catch (_error) {
      return { valid: false, errors: ['worker dispatch journey schema is unavailable'] };
    }
  }
  const errors = [...validateAgainstSchema(schema, artifact).errors];
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    return { valid: false, errors };
  }

  validateSourceIdentity(artifact, options, errors);

  const now = Number.isFinite(options.now) ? options.now : Date.now();
  const repoRoot = options.repoRoot || DEFAULT_SOURCE_ROOT;
  const capturedAt = Date.parse(artifact.captured_at);
  const expiresAt = Date.parse(artifact.freshness_expires_at);
  const invocationStartedAt = Date.parse(artifact.invocation_started_at);
  const allowedMutationSurfaces = Array.isArray(artifact.allowed_mutation_surfaces)
    ? artifact.allowed_mutation_surfaces
    : [];
  const reasonCodes = Array.isArray(artifact.reason_codes) ? artifact.reason_codes : [];
  if (!Number.isFinite(capturedAt) || !Number.isFinite(expiresAt)) {
    errors.push('capture timestamps must be parseable');
  } else {
    if (capturedAt >= expiresAt) errors.push('capture freshness window is invalid');
    if (capturedAt > now) errors.push('capture timestamp is in the future');
    if (expiresAt <= now) errors.push('journey artifact is stale');
  }
  if (artifact.invocation_performed) {
    if (!Number.isFinite(invocationStartedAt) || invocationStartedAt > capturedAt) {
      errors.push('invoked journey requires invocation_started_at before capture');
    }
  } else if (artifact.invocation_started_at !== null) {
    errors.push('non-invoked journey requires null invocation_started_at');
  }

  validateQuotedExcerpt(artifact.schema_excerpt, artifact.schema_excerpt_sha256, 'schema_excerpt', errors);
  validateQuotedExcerpt(artifact.output_excerpt, artifact.output_excerpt_sha256, 'output_excerpt', errors);
  if (artifact.redaction_status !== 'passed') errors.push('redaction_status must be passed');
  if (artifact.schema_completeness === 'confirmed' && !artifact.completeness_basis) {
    errors.push('confirmed completeness requires a basis');
  }
  if (artifact.schema_completeness === 'unconfirmed' && artifact.completeness_basis !== null) {
    errors.push('unconfirmed completeness requires a null basis');
  }

  if (artifact.mutation_scope === 'forbidden') {
    if (artifact.mutation_authorization_ref !== null || allowedMutationSurfaces.length !== 0) {
      errors.push('forbidden mutation requires null authorization ref and empty surfaces');
    }
  } else if (!artifact.mutation_authorization_ref || allowedMutationSurfaces.length === 0) {
    errors.push('explicitly-scoped mutation requires a ref and allowed surfaces');
  }
  if (artifact.invocation_performed) {
    if (artifact.mutation_observation !== 'within-scope'
      || !artifact.pre_state_ref
      || !artifact.post_state_ref
      || !artifact.state_observation_ref
      || !artifact.state_observation_sha256) {
      errors.push('invoked journey requires caller state observation evidence');
    } else {
      if (artifact.pre_state_ref === artifact.post_state_ref) {
        errors.push('invoked journey requires distinct pre/post state refs');
      }
      validateStateObservation(artifact, repoRoot, capturedAt, invocationStartedAt, errors);
    }
  } else {
    validateNonInvokedMutationObservation(artifact, errors);
    validateNonInvokedRuntimeEvidence(artifact, errors);
  }

  if (artifact.journey_kind === 'positive') {
    if (artifact.status !== 'passed' || artifact.support_claim !== 'exact_version_observed') {
      errors.push('positive journey requires passed exact-version claim');
    }
    if (!artifact.invocation_performed || artifact.call_status !== 'succeeded') {
      errors.push('positive journey requires a successful live invocation');
    }
    if (!artifact.observed_primitive || !artifact.candidate_identity_sha256) {
      errors.push('positive journey requires observed primitive and candidate identity');
    }
    if (artifact.output_validation !== 'passed' || !artifact.output_excerpt) {
      errors.push('positive journey requires validated caller-readable output');
    }
    if (artifact.observed_permission !== 'allowed' || artifact.observed_capacity !== 'accepted') {
      errors.push('positive journey requires observed permission and capacity acceptance');
    }
    if (artifact.schema_completeness !== 'confirmed' || !artifact.completeness_basis) {
      errors.push('positive journey requires confirmed current-session schema completeness');
    }
    if (!artifact.schema_excerpt_ref || artifact.schema_excerpt === null
      || artifact.schema_excerpt_sha256 === null) {
      errors.push('positive journey requires current-session schema excerpt evidence');
    }
    if (artifact.capability_probe !== 'attempted'
      || artifact.worker_dispatch_capability !== 'available') {
      errors.push('positive journey requires attempted available capability evidence');
    }
    if (artifact.context_isolation_need === 'required'
      && artifact.observed_context_isolation !== 'isolated') {
      errors.push('positive journey requires observed isolated context when isolation is required');
    }
    if (reasonCodes.length !== 0) {
      errors.push('positive journey requires empty reason codes');
    }
    if (artifact.provider_trust_domain !== 'host-native') {
      for (const key of DATA_AUTHORIZATION_FIELDS) {
        if (artifact[key] !== 'authorized') {
          errors.push(`${key} must be authorized for a non-host-native positive journey`);
        }
      }
    }
  } else {
    if (!['degraded', 'not_run'].includes(artifact.status)) {
      errors.push('degraded journey requires degraded or not_run status');
    }
    if (!['degraded_only', 'not_applicable'].includes(artifact.support_claim)) {
      errors.push('degraded journey cannot make an exact-version positive claim');
    }
    if (!reasonCodes.some((code) => DEGRADED_REASON_CODES.has(code))) {
      errors.push('degraded journey requires a canonical degraded reason code');
    }
    if (artifact.invocation_performed === (artifact.call_status === 'not_invoked')) {
      errors.push('degraded invocation and call status are inconsistent');
    }
    if (reasonCodes.includes('isolation_requirement_unmet')
      && (artifact.context_isolation_need !== 'required'
        || !['inherited', 'unknown'].includes(artifact.observed_context_isolation)
        || artifact.capability_probe !== 'attempted'
        || artifact.worker_dispatch_capability !== 'available'
        || artifact.invocation_performed)) {
      errors.push('required-isolation degraded journey must fail closed before invocation');
    }
    if (reasonCodes.includes('subagent_capability_missing')
      && (artifact.capability_probe !== 'attempted'
        || artifact.worker_dispatch_capability !== 'missing'
        || artifact.invocation_performed
        || artifact.call_status !== 'not_invoked')) {
      errors.push('capability-missing degraded journey must fail closed before invocation');
    }
    if (reasonCodes.includes('worker_capability_unproven')
      && (!['attempted', 'unavailable'].includes(artifact.capability_probe)
        || artifact.worker_dispatch_capability !== 'unknown'
        || artifact.invocation_performed
        || artifact.call_status !== 'not_invoked')) {
      errors.push('capability-unproven degraded journey must fail closed before invocation');
    }
    if (reasonCodes.includes('worker_data_authorization_missing')) {
      if (artifact.provider_trust_domain === 'host-native'
        || DATA_AUTHORIZATION_FIELDS.every((key) => artifact[key] === 'authorized')
        || artifact.invocation_performed) {
        errors.push('data-authorization degraded journey must fail closed on a non-host-native authorization gap');
      }
    } else if (artifact.provider_trust_domain !== 'host-native') {
      for (const key of DATA_AUTHORIZATION_FIELDS) {
        if (artifact[key] !== 'authorized') {
          errors.push(`${key} blocks non-host-native journey`);
        }
      }
    }
  }

  if (artifact.mutation_scope === 'explicitly-scoped'
    && artifact.mutation_authorization_ref
    && allowedMutationSurfaces.length > 0) {
    validateExplicitMutationScope(
      artifact,
      repoRoot,
      now,
      invocationStartedAt,
      errors,
    );
  }

  validateSupportingCapture(artifact, repoRoot, errors);
  return { valid: errors.length === 0, errors };
}

function validateWorkerDispatchHostJourneySet(artifacts, options = {}) {
  if (!Array.isArray(artifacts) || artifacts.length !== 3) {
    return { valid: false, errors: ['journey set requires exactly three artifacts'] };
  }
  let schema = options.schema;
  try {
    schema = schema || loadSchema();
  } catch (_error) {
    return { valid: false, errors: ['worker dispatch journey schema is unavailable'] };
  }
  const errors = [];
  artifacts.forEach((artifact, index) => {
    const result = validateWorkerDispatchHostJourney(artifact, { ...options, schema });
    for (const error of result.errors) errors.push(`artifact[${index}]: ${error}`);
  });
  const positives = artifacts.filter((artifact) => artifact && artifact.journey_kind === 'positive');
  const degraded = artifacts.filter((artifact) => artifact && artifact.journey_kind === 'degraded');
  if (positives.length !== 2 || degraded.length !== 1) {
    errors.push('journey set requires two positive artifacts and one degraded artifact');
  }
  if (new Set(positives.map((artifact) => artifact.host_identity)).size !== 2) {
    errors.push('positive journeys require two distinct host identities');
  }
  if (new Set(positives.map((artifact) => artifact.observed_primitive)).size !== 2) {
    errors.push('positive journeys require two distinct observed primitives');
  }
  if (new Set(positives.map((artifact) => artifact.semantic_request_sha256)).size !== 1) {
    errors.push('positive journeys must use the same semantic request');
  }
  if (degraded.length === 1
    && !(Array.isArray(degraded[0].reason_codes)
      && degraded[0].reason_codes.some((code) => JOURNEY_SET_DEGRADED_REASON_CODES.has(code)))) {
    errors.push('journey set degraded artifact must prove capability, probe, or required-isolation degradation');
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  DEFAULT_SOURCE_ROOT,
  SCHEMA_PATH,
  SOURCE_MANIFEST,
  SUPPORTING_CAPTURE_BINDINGS,
  loadSchema,
  sourceIdentity,
  sourceManifestSha256,
  validateWorkerDispatchHostJourney,
  validateWorkerDispatchHostJourneySet,
};
