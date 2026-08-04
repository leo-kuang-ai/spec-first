'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('./schema-validator');

const SCHEMA_PATH = path.resolve(
  __dirname,
  '../../docs/contracts/verification/worker-dispatch-host-preflight.schema.json',
);
const ELIGIBILITY_CONTRACT_PATH = path.resolve(
  __dirname,
  '../../docs/contracts/workflows/worker-dispatch-capability.md',
);
const ELIGIBILITY_CONTRACT_REF = 'docs/contracts/workflows/worker-dispatch-capability.md#generic-worker-eligibility';
const PROVIDER_UNTRUSTED_OPEN = '<provider_untrusted>';
const PROVIDER_UNTRUSTED_CLOSE = '</provider_untrusted>';
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const SECRET_VALUE_PATTERNS = [
  /\b(?:api[_-]?key|access[_-]?token|password|secret)\s*[:=]\s*["']?[A-Za-z0-9_./+\-=]{8,}/i,
  /\bsk-[A-Za-z0-9]{8,}\b/,
];

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function loadSchema() {
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
}

function eligibilityContractExcerpt() {
  const source = fs.readFileSync(ELIGIBILITY_CONTRACT_PATH, 'utf8');
  const start = source.indexOf('## Generic Worker Eligibility');
  const end = source.indexOf('\n## Provider-Untrusted Schema Boundary', start);
  if (start < 0 || end < 0) {
    throw new Error('worker dispatch eligibility contract section is missing');
  }
  return `${source.slice(start, end).trimEnd()}\n`;
}

function eligibilityContractSha256() {
  return sha256(eligibilityContractExcerpt());
}

function validateWorkerDispatchHostPreflight(artifact, options = {}) {
  let schema = options.schema;
  if (!schema) {
    try {
      schema = loadSchema();
    } catch (_error) {
      return { valid: false, errors: ['worker dispatch preflight schema is unavailable'] };
    }
  }
  const now = Number.isFinite(options.now) ? options.now : Date.now();
  const errors = [...validateAgainstSchema(schema, artifact).errors];

  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
    return { valid: false, errors };
  }

  const capturedAt = Date.parse(artifact.captured_at);
  const expiresAt = Date.parse(artifact.freshness_expires_at);
  const excerpt = artifact.schema_excerpt;

  if (typeof excerpt === 'string') {
    if (sha256(excerpt) !== artifact.schema_excerpt_sha256) {
      errors.push('schema_excerpt_sha256 mismatch');
    }
    const openCount = excerpt.split(PROVIDER_UNTRUSTED_OPEN).length - 1;
    const closeCount = excerpt.split(PROVIDER_UNTRUSTED_CLOSE).length - 1;
    if (!excerpt.startsWith(PROVIDER_UNTRUSTED_OPEN)
      || !excerpt.endsWith(PROVIDER_UNTRUSTED_CLOSE)
      || openCount !== 1
      || closeCount !== 1) {
      errors.push('schema_excerpt must use provider_untrusted delimiters');
    } else {
      const inner = excerpt.slice(PROVIDER_UNTRUSTED_OPEN.length, -PROVIDER_UNTRUSTED_CLOSE.length);
      if (/[<>]/.test(inner)) errors.push('schema_excerpt contains unescaped markup');
    }
    if (CONTROL_CHARACTER_PATTERN.test(excerpt)) {
      errors.push('schema_excerpt contains unsafe control characters');
    }
    if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(excerpt))) {
      errors.push('schema_excerpt contains a secret-like value');
    }
  }

  if (artifact.redaction_status !== 'passed') errors.push('redaction_status must be passed');
  if (artifact.invocation_performed !== false) errors.push('preflight must not invoke a worker');
  if (artifact.support_claim !== 'not_applicable') errors.push('support_claim must remain not_applicable');
  if (artifact.eligibility_contract_ref !== ELIGIBILITY_CONTRACT_REF) {
    errors.push('eligibility_contract_ref must identify the canonical semantic section');
  }
  let expectedEligibilityContractSha256 = options.expectedEligibilityContractSha256;
  if (!expectedEligibilityContractSha256) {
    try {
      expectedEligibilityContractSha256 = eligibilityContractSha256();
    } catch (_error) {
      errors.push('canonical eligibility contract is unavailable');
    }
  }
  if (expectedEligibilityContractSha256
    && artifact.eligibility_contract_sha256 !== expectedEligibilityContractSha256) {
    errors.push('eligibility_contract_sha256 mismatch');
  }
  if (!Number.isFinite(capturedAt) || !Number.isFinite(expiresAt)) {
    errors.push('capture timestamps must be parseable');
  }
  if (Number.isFinite(capturedAt) && Number.isFinite(expiresAt) && capturedAt >= expiresAt) {
    errors.push('capture freshness window is invalid');
  }
  if (Number.isFinite(capturedAt) && capturedAt > now) errors.push('capture timestamp is in the future');
  if (Number.isFinite(expiresAt) && expiresAt <= now) errors.push('preflight artifact is stale');

  if (artifact.schema_completeness === 'confirmed' && !artifact.completeness_basis) {
    errors.push('confirmed completeness requires a basis');
  }
  if (artifact.schema_completeness === 'unconfirmed' && artifact.completeness_basis !== null) {
    errors.push('unconfirmed completeness requires a null basis');
  }

  const candidates = Array.isArray(artifact.eligible_candidates)
    ? artifact.eligible_candidates
    : [];

  if (artifact.status === 'not_run') {
    if (artifact.capability_probe !== 'unavailable') errors.push('not_run requires unavailable probe');
    if (artifact.worker_dispatch_capability !== 'unknown') errors.push('not_run requires unknown capability');
    if (candidates.length !== 0) errors.push('not_run cannot contain candidates');
    if (artifact.schema_excerpt_ref !== null
      || artifact.schema_excerpt !== null
      || artifact.schema_excerpt_sha256 !== null) {
      errors.push('not_run cannot claim a captured schema excerpt');
    }
  } else {
    if (!artifact.schema_excerpt_ref || !artifact.schema_excerpt || !artifact.schema_excerpt_sha256) {
      errors.push('completed preflight requires a captured schema excerpt');
    }
    if (artifact.capability_probe !== 'attempted') {
      errors.push('completed preflight requires attempted probe');
    }
  }

  if (artifact.status === 'passed' && artifact.worker_dispatch_capability !== 'available') {
    errors.push('passed preflight requires available capability');
  }
  if (artifact.worker_dispatch_capability === 'available') {
    if (artifact.schema_completeness !== 'confirmed' || !artifact.completeness_basis) {
      errors.push('available capability requires confirmed completeness');
    }
    if (candidates.length !== 1 || candidates[0].unique !== true) {
      errors.push('available capability requires one unique candidate');
    }
  }
  if (artifact.worker_dispatch_capability === 'missing') {
    if (artifact.schema_completeness !== 'confirmed'
      || !artifact.completeness_basis
      || candidates.length !== 0) {
      errors.push('missing capability requires confirmed complete absence');
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateWorkerDispatchHostPreflightPair(artifacts, options = {}) {
  const errors = [];
  if (!Array.isArray(artifacts) || artifacts.length !== 2) {
    return { valid: false, errors: ['Gate 0 requires exactly two host preflight artifacts'] };
  }

  let schema = options.schema;
  let expectedEligibilityContractSha256 = options.expectedEligibilityContractSha256;
  try {
    schema = schema || loadSchema();
    expectedEligibilityContractSha256 = expectedEligibilityContractSha256
      || eligibilityContractSha256();
  } catch (_error) {
    return { valid: false, errors: ['Gate 0 validator source contract is unavailable'] };
  }
  const sharedOptions = { ...options, schema, expectedEligibilityContractSha256 };

  artifacts.forEach((artifact, index) => {
    const result = validateWorkerDispatchHostPreflight(artifact, sharedOptions);
    for (const error of result.errors) errors.push(`artifact[${index}]: ${error}`);
    if (artifact && artifact.status !== 'passed') {
      errors.push(`artifact[${index}]: Gate 0 requires passed status`);
    }
  });

  const hostIdentities = artifacts.map((artifact) => artifact && artifact.host_identity);
  if (new Set(hostIdentities).size !== 2) {
    errors.push('Gate 0 requires two distinct host identities');
  }

  const eligibilityHashes = artifacts.map((artifact) => artifact && artifact.eligibility_contract_sha256);
  if (new Set(eligibilityHashes).size !== 1) {
    errors.push('Gate 0 artifacts must use the same eligibility contract hash');
  }

  const candidateHashes = artifacts.map((artifact) => {
    const candidates = artifact && Array.isArray(artifact.eligible_candidates)
      ? artifact.eligible_candidates
      : [];
    return candidates.length === 1 ? candidates[0].candidate_identity_sha256 : null;
  });
  if (candidateHashes.includes(null) || new Set(candidateHashes).size !== 2) {
    errors.push('Gate 0 requires two distinct unique candidate identities');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  PROVIDER_UNTRUSTED_CLOSE,
  PROVIDER_UNTRUSTED_OPEN,
  SCHEMA_PATH,
  ELIGIBILITY_CONTRACT_PATH,
  ELIGIBILITY_CONTRACT_REF,
  eligibilityContractExcerpt,
  eligibilityContractSha256,
  loadSchema,
  sha256,
  validateWorkerDispatchHostPreflight,
  validateWorkerDispatchHostPreflightPair,
};
