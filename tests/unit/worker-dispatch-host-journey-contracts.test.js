'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { sha256 } = require('../../src/contracts/worker-dispatch-host-preflight-validator');
const {
  SUPPORTING_CAPTURE_BINDINGS,
  sourceIdentity,
  validateWorkerDispatchHostJourney,
  validateWorkerDispatchHostJourneySet,
} = require('../../src/contracts/worker-dispatch-host-journey-validator');

const schema = JSON.parse(fs.readFileSync(
  'docs/contracts/verification/worker-dispatch-host-journey.schema.json',
  'utf8',
));
const contract = fs.readFileSync(
  'docs/contracts/verification/worker-dispatch-host-journey.md',
  'utf8',
);
const datedJourneyPaths = [
  'docs/validation/worker-dispatch/2026-07-29-codex-cli-0.145.0-positive-journey.json',
  'docs/validation/worker-dispatch/2026-07-29-claude-code-2.1.220-positive-journey.json',
  'docs/validation/worker-dispatch/2026-07-29-claude-code-2.1.220-required-isolation-degraded-journey.json',
];
const NOW = Date.parse('2026-07-28T17:00:00.000Z');
const TEST_SEMANTIC_REQUEST = 'Run one bounded worker task and return a schema-valid result.\n';
const TEST_SCOPE_SURFACE = 'repo:tests/fixtures/worker-dispatch/observed.txt:write';
const TEST_FORBIDDEN_OBSERVED_SURFACE = 'repo:tests/fixtures/worker-dispatch/observed.txt:state';
const EXPECTED_SUPPORTING_CAPTURE_BINDINGS = [
  'journey_kind', 'status', 'support_claim', 'captured_at', 'freshness_expires_at',
  'capture_owner', 'capture_method', 'session_identity', 'host_identity',
  'host_startup_or_version_ref', 'tested_host_version', 'spec_first_revision',
  'dispatch_authorization_receipt', 'authorization_basis', 'restricted_read_authorization',
  'data_egress_authorization', 'credential_use_authorization',
  'external_communication_authorization', 'provider_trust_domain', 'discovery_surface',
  'schema_excerpt_ref', 'schema_excerpt_sha256', 'schema_completeness',
  'completeness_basis', 'capture_limitations', 'candidate_identity_sha256',
  'observed_primitive', 'candidate_selection_rationale', 'semantic_request_ref',
  'semantic_request_sha256', 'context_isolation_need', 'model_selection_need',
  'desired_concurrency', 'mutation_scope', 'mutation_authorization_ref',
  'allowed_mutation_surfaces', 'output_contract', 'stop_condition',
  'invocation_performed', 'capability_probe', 'worker_dispatch_capability',
  'invocation_started_at', 'call_status', 'observed_permission', 'observed_capacity',
  'observed_context_isolation', 'observed_model_selection', 'observed_parallelism',
  'output_excerpt_ref', 'output_excerpt_sha256', 'output_validation',
  'mutation_observation', 'pre_state_ref', 'post_state_ref', 'state_observation_ref',
  'state_observation_sha256', 'redaction_status', 'reason_codes',
  'invalidation_conditions',
];
const CAPTURE_BINDING_EXCEPTIONS = Object.freeze({
  schema_version: 'fixed by the journey schema',
  artifact_type: 'fixed by the journey schema',
  schema_excerpt: 'validated by the capture-bound schema_excerpt_sha256',
  output_excerpt: 'validated by the capture-bound output_excerpt_sha256',
  supporting_capture_ref: 'identifies the capture itself',
  supporting_capture_sha256: 'hashes the capture itself',
});
function writeJson(filePath, value) {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(filePath, body);
  return body;
}

function copyFixtureIntoRoot(root, ref) {
  if (typeof ref !== 'string' || ref.length === 0 || path.isAbsolute(ref)) return;
  const sourcePath = path.resolve(process.cwd(), ref);
  const relative = path.relative(process.cwd(), sourcePath);
  if (relative === '' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return;
  try {
    if (!fs.statSync(sourcePath).isFile()) return;
  } catch (_error) {
    return;
  }
  const targetPath = path.join(root, ref);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function snapshotSha256(root, ref) {
  if (typeof ref !== 'string' || ref.length === 0) return '0'.repeat(64);
  try {
    return sha256(fs.readFileSync(path.join(root, ref)));
  } catch (_error) {
    return '0'.repeat(64);
  }
}

function materializeJourney(root, artifact, name) {
  const journey = JSON.parse(JSON.stringify(artifact));
  if (journey.semantic_request_ref === 'fixture:semantic-request') {
    journey.semantic_request_ref = `${name}-request.md`;
    journey.semantic_request_sha256 = sha256(
      TEST_SEMANTIC_REQUEST.replace(/\s+/g, ' ').trim(),
    );
    fs.writeFileSync(path.join(root, journey.semantic_request_ref), TEST_SEMANTIC_REQUEST);
  }
  if (journey.pre_state_ref === 'fixture:pre-state') {
    journey.pre_state_ref = `${name}-pre-state.json`;
    fs.writeFileSync(path.join(root, journey.pre_state_ref), '{"state":"stable"}\n');
  }
  if (journey.post_state_ref === 'fixture:post-state') {
    journey.post_state_ref = `${name}-post-state.json`;
    fs.writeFileSync(path.join(root, journey.post_state_ref), '{"state":"stable"}\n');
  }
  copyFixtureIntoRoot(root, journey.pre_state_ref);
  copyFixtureIntoRoot(root, journey.post_state_ref);
  copyFixtureIntoRoot(root, journey.mutation_authorization_ref);
  if (journey.mutation_authorization_ref === 'fixture:scope') {
    journey.mutation_authorization_ref = `${name}-scope.json`;
    writeJson(path.join(root, journey.mutation_authorization_ref), {
      authority_origin: 'tests/unit/worker-dispatch-host-journey-contracts.test.js',
      captured_at: '2026-07-28T16:00:00.000Z',
      freshness_expires_at: '2099-01-01T00:00:00.000Z',
      allowed_mutation_surfaces: [TEST_SCOPE_SURFACE],
    });
  }
  if (journey.state_observation_ref === 'fixture:state-observation') {
    journey.state_observation_ref = `${name}-state-observation.json`;
    const observedSurfaces = journey.mutation_scope === 'explicitly-scoped'
      ? journey.allowed_mutation_surfaces
      : [TEST_FORBIDDEN_OBSERVED_SURFACE];
    const stateObservation = {
      schema_version: 'worker-dispatch-state-observation/v1',
      capture_owner: 'test caller',
      pre_observed_at: '2026-07-28T16:28:00.000Z',
      post_observed_at: '2026-07-28T16:30:00.000Z',
      mutation_observation: journey.mutation_observation,
      observed_surfaces: observedSurfaces,
      pre_state_ref: journey.pre_state_ref,
      pre_state_sha256: snapshotSha256(root, journey.pre_state_ref),
      post_state_ref: journey.post_state_ref,
      post_state_sha256: snapshotSha256(root, journey.post_state_ref),
    };
    journey.state_observation_sha256 = sha256(writeJson(
      path.join(root, journey.state_observation_ref),
      stateObservation,
    ));
  }
  if (journey.supporting_capture_ref === 'fixture:supporting-capture') {
    journey.supporting_capture_ref = `${name}-capture.json`;
    const capture = {
      semantic_request_canonicalization: 'Collapse each whitespace run to one ASCII space and trim leading/trailing whitespace.',
    };
    for (const field of SUPPORTING_CAPTURE_BINDINGS) capture[field] = journey[field];
    journey.supporting_capture_sha256 = sha256(writeJson(
      path.join(root, journey.supporting_capture_ref),
      capture,
    ));
  }
  return journey;
}

function refreshSupportingCapture(root, artifact) {
  const capturePath = path.join(root, artifact.supporting_capture_ref);
  const capture = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
  for (const field of SUPPORTING_CAPTURE_BINDINGS) capture[field] = artifact[field];
  artifact.supporting_capture_sha256 = sha256(writeJson(capturePath, capture));
}

function validate(artifact) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-dispatch-journey-'));
  try {
    return validateWorkerDispatchHostJourney(materializeJourney(root, artifact, 'journey'), {
      schema,
      repoRoot: root,
      now: NOW,
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function validateSet(artifacts) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-dispatch-journey-set-'));
  try {
    return validateWorkerDispatchHostJourneySet(
      artifacts.map((artifact, index) => materializeJourney(root, artifact, `journey-${index}`)),
      { schema, repoRoot: root, now: NOW },
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function validPositive(overrides = {}) {
  const schemaExcerpt = '<provider_untrusted>bounded current-session worker schema</provider_untrusted>';
  const outputExcerpt = '<provider_untrusted>{"status":"passed","checks":["semantic-port"]}</provider_untrusted>';
  return {
    schema_version: 'worker-dispatch-host-journey/v1', artifact_type: 'confirmed',
    journey_kind: 'positive', status: 'passed', support_claim: 'exact_version_observed',
    capture_owner: 'owner', capture_method: 'host-startup-registration-record',
    captured_at: '2026-07-28T16:30:00.000Z', freshness_expires_at: '2026-07-29T16:30:00.000Z',
    session_identity: 'session-a', host_identity: 'host-a', host_startup_or_version_ref: 'host-a@1',
    tested_host_version: '1.0.0', spec_first_revision: sourceIdentity(),
    dispatch_authorization_receipt: 'conversation:user:authorized', authorization_basis: 'explicit-user',
    restricted_read_authorization: 'not_applicable', data_egress_authorization: 'not_applicable',
    credential_use_authorization: 'not_applicable', external_communication_authorization: 'not_applicable',
    provider_trust_domain: 'host-native', discovery_surface: 'current-session registry',
    schema_excerpt_ref: 'inline', schema_excerpt: schemaExcerpt, schema_excerpt_sha256: sha256(schemaExcerpt),
    schema_completeness: 'confirmed', completeness_basis: 'current-session complete registry',
    redaction_status: 'passed', capture_limitations: ['Exact-version observation only.'],
    observed_primitive: 'worker-a', candidate_identity_sha256: 'a'.repeat(64),
    candidate_selection_rationale: 'Unique generic worker candidate.', semantic_request_ref: 'fixture:semantic-request',
    semantic_request_sha256: 'b'.repeat(64), context_isolation_need: 'irrelevant',
    model_selection_need: 'inherited-ok', desired_concurrency: 'serial', mutation_scope: 'forbidden',
    mutation_authorization_ref: null, allowed_mutation_surfaces: [], output_contract: 'journey-output/v1',
    stop_condition: 'Return one result and stop.', invocation_performed: true,
    invocation_started_at: '2026-07-28T16:29:00.000Z', capability_probe: 'attempted',
    worker_dispatch_capability: 'available', call_status: 'succeeded',
    observed_permission: 'allowed', observed_capacity: 'accepted', observed_context_isolation: 'unknown',
    observed_model_selection: 'inherited', observed_parallelism: 'serial', output_excerpt_ref: 'inline',
    output_excerpt: outputExcerpt, output_excerpt_sha256: sha256(outputExcerpt), output_validation: 'passed',
    mutation_observation: 'within-scope',
    pre_state_ref: 'fixture:pre-state', post_state_ref: 'fixture:post-state',
    state_observation_ref: 'fixture:state-observation', state_observation_sha256: 'c'.repeat(64),
    reason_codes: [], supporting_capture_ref: 'fixture:supporting-capture',
    supporting_capture_sha256: 'd'.repeat(64),
    invalidation_conditions: ['Host tool schema or version changes.'],
    ...overrides,
  };
}

function validNonInvokedDegraded(overrides = {}) {
  return validPositive({
    journey_kind: 'degraded', status: 'degraded', support_claim: 'degraded_only',
    invocation_performed: false, invocation_started_at: null, call_status: 'not_invoked',
    observed_permission: 'not_applicable', observed_capacity: 'not_applicable',
    observed_context_isolation: 'none', observed_model_selection: 'none', observed_parallelism: 'none',
    output_excerpt_ref: null, output_excerpt: null, output_excerpt_sha256: null,
    output_validation: 'not_applicable', mutation_observation: 'not_applicable',
    pre_state_ref: null, post_state_ref: null,
    state_observation_ref: null, state_observation_sha256: null,
    ...overrides,
  });
}

describe('worker dispatch host journey contract', () => {
  test('binds every material journey claim into the supporting capture', () => {
    expect(SUPPORTING_CAPTURE_BINDINGS).toEqual(EXPECTED_SUPPORTING_CAPTURE_BINDINGS);
    expect([...SUPPORTING_CAPTURE_BINDINGS, ...Object.keys(CAPTURE_BINDING_EXCEPTIONS)].sort())
      .toEqual([...schema.required].sort());
  });

  test('accepts a bounded positive journey', () => {
    expect(validate(validPositive())).toEqual({ valid: true, errors: [] });
  });

  test.each([
    ['source revision is not a verifiable identity', { spec_first_revision: 'abcdef0' }],
    ['worker not invoked', { invocation_performed: false, call_status: 'not_invoked' }],
    ['output invalid', { output_validation: 'failed' }],
    ['permission unknown', { observed_permission: 'unknown' }],
    ['forbidden mutation ref', { mutation_authorization_ref: 'scope-ref' }],
    ['forbidden mutation observation', { mutation_observation: 'not_applicable', pre_state_ref: null, post_state_ref: null }],
    ['stale', { freshness_expires_at: '2026-07-28T16:45:00.000Z' }],
    ['unquoted schema', (() => {
      const value = 'plain schema';
      return { schema_excerpt: value, schema_excerpt_sha256: sha256(value) };
    })()],
    ['secret-like output', (() => {
      const value = '<provider_untrusted>api_key=abcdefghijk</provider_untrusted>';
      return { output_excerpt: value, output_excerpt_sha256: sha256(value) };
    })()],
    ['unconfirmed current-session schema', {
      schema_completeness: 'unconfirmed', completeness_basis: null,
    }],
    ['missing current-session schema evidence', {
      schema_excerpt_ref: null, schema_excerpt: null, schema_excerpt_sha256: null,
    }],
    ['required isolation observed as inherited', {
      context_isolation_need: 'required', observed_context_isolation: 'inherited',
    }],
    ['non-host-native authorization marked not applicable', {
      provider_trust_domain: 'external', restricted_read_authorization: 'not_applicable',
      data_egress_authorization: 'authorized', credential_use_authorization: 'authorized',
      external_communication_authorization: 'authorized',
    }],
    ['degraded reason code', { reason_codes: ['worker_output_invalid'] }],
    ['explicit mutation without pre/post observation', {
      mutation_scope: 'explicitly-scoped',
      mutation_authorization_ref: 'tests/fixtures/worker-dispatch/mutation-scope-receipt.json',
      allowed_mutation_surfaces: ['repo:tests/fixtures/worker-dispatch/observed.txt:write'],
      mutation_observation: 'unproven',
    }],
  ])('rejects positive journey with %s', (_label, overrides) => {
    expect(validate(validPositive(overrides)).valid).toBe(false);
  });

  test('rejects a journey when the current source manifest has drifted from its revision', () => {
    expect(validate(validPositive({
      spec_first_revision: 'git:04ed28a5d2036aa5c263c11ed13e63581f14b42a',
    })).errors).toContain('spec_first_revision does not match the current source identity');
  });

  test('accepts a positive explicitly-scoped mutation with within-scope pre/post observation', () => {
    expect(validate(validPositive({
      mutation_scope: 'explicitly-scoped',
      mutation_authorization_ref: 'tests/fixtures/worker-dispatch/mutation-scope-receipt.json',
      allowed_mutation_surfaces: ['repo:tests/fixtures/worker-dispatch/observed.txt:write'],
      mutation_observation: 'within-scope',
      pre_state_ref: 'tests/fixtures/worker-dispatch/pre-state.json',
      post_state_ref: 'tests/fixtures/worker-dispatch/post-state.json',
    }))).toEqual({ valid: true, errors: [] });
  });

  test.each([
    ['fake authority ref', { mutation_authorization_ref: 'tests/fixtures/worker-dispatch/missing.json' }],
    ['surface outside receipt', {
      mutation_authorization_ref: 'tests/fixtures/worker-dispatch/mutation-scope-receipt.json',
      allowed_mutation_surfaces: ['repo:src/outside.txt:write'],
      mutation_observation: 'within-scope',
      pre_state_ref: 'tests/fixtures/worker-dispatch/pre-state.json',
      post_state_ref: 'tests/fixtures/worker-dispatch/post-state.json',
    }],
    ['missing pre-state ref', {
      mutation_authorization_ref: 'tests/fixtures/worker-dispatch/mutation-scope-receipt.json',
      allowed_mutation_surfaces: ['repo:tests/fixtures/worker-dispatch/observed.txt:write'],
      mutation_observation: 'within-scope',
      pre_state_ref: 'tests/fixtures/worker-dispatch/missing.json',
      post_state_ref: 'tests/fixtures/worker-dispatch/post-state.json',
    }],
  ])('rejects explicitly-scoped journey with %s', (_label, overrides) => {
    expect(validate(validPositive({
      mutation_scope: 'explicitly-scoped',
      ...overrides,
    })).valid).toBe(false);
  });

  test.each([
    ['forbidden', validPositive()],
    ['explicitly-scoped', validPositive({
      mutation_scope: 'explicitly-scoped',
      mutation_authorization_ref: 'tests/fixtures/worker-dispatch/mutation-scope-receipt.json',
      allowed_mutation_surfaces: [TEST_SCOPE_SURFACE],
    })],
  ])('rejects an invoked %s journey that reuses the pre-state snapshot as post-state evidence', (_label, source) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-dispatch-journey-'));
    try {
      const artifact = materializeJourney(root, source, 'same-state-ref');
      const observationPath = path.join(root, artifact.state_observation_ref);
      const observation = JSON.parse(fs.readFileSync(observationPath, 'utf8'));
      artifact.post_state_ref = artifact.pre_state_ref;
      observation.post_state_ref = artifact.pre_state_ref;
      observation.post_state_sha256 = observation.pre_state_sha256;
      artifact.state_observation_sha256 = sha256(writeJson(observationPath, observation));
      refreshSupportingCapture(root, artifact);

      expect(validateWorkerDispatchHostJourney(artifact, {
        schema, repoRoot: root, now: NOW,
      }).errors).toContain('invoked journey requires distinct pre/post state refs');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('accepts a non-invoked required-isolation degraded journey', () => {
    const degraded = validNonInvokedDegraded({
      context_isolation_need: 'required',
      observed_context_isolation: 'unknown', observed_model_selection: 'none', observed_parallelism: 'none',
      reason_codes: ['isolation_requirement_unmet'],
    });
    expect(validate(degraded)).toEqual({ valid: true, errors: [] });
  });

  test('allows not_applicable mutation observation only when a forbidden journey was not invoked', () => {
    const degraded = validNonInvokedDegraded({
      worker_dispatch_capability: 'unknown',
      reason_codes: ['worker_capability_unproven'],
    });
    expect(validate(degraded)).toEqual({ valid: true, errors: [] });
  });

  test.each([
    ['permission', { observed_permission: 'allowed' }],
    ['capacity', { observed_capacity: 'accepted' }],
    ['isolated context', { observed_context_isolation: 'isolated' }],
    ['model selection', { observed_model_selection: 'inherited' }],
    ['parallelism', { observed_parallelism: 'serial' }],
    ['output', {
      output_excerpt_ref: 'inline',
      output_excerpt: '<provider_untrusted>{"status":"forged"}</provider_untrusted>',
      output_excerpt_sha256: sha256('<provider_untrusted>{"status":"forged"}</provider_untrusted>'),
      output_validation: 'passed',
    }],
  ])('rejects non-invoked capability evidence carrying live %s facts', (_label, overrides) => {
    const degraded = validNonInvokedDegraded({
      worker_dispatch_capability: 'unknown', reason_codes: ['worker_capability_unproven'], ...overrides,
    });
    expect(validate(degraded).errors).toContain(
      'non-invoked journey requires no live facts and null output evidence',
    );
  });

  test('rejects an isolation reason when the primitive was invoked or isolation was not required', () => {
    const degraded = validPositive({
      journey_kind: 'degraded', status: 'degraded', support_claim: 'degraded_only',
      context_isolation_need: 'irrelevant', invocation_performed: true, call_status: 'succeeded',
      reason_codes: ['isolation_requirement_unmet'],
    });
    expect(validate(degraded).valid).toBe(false);
  });

  test('rejects capability degradation once a worker invocation was recorded', () => {
    const degraded = validPositive({
      journey_kind: 'degraded', status: 'degraded', support_claim: 'degraded_only',
      worker_dispatch_capability: 'unknown', reason_codes: ['worker_capability_unproven'],
    });
    expect(validate(degraded).errors).toContain(
      'capability-unproven degraded journey must fail closed before invocation',
    );
  });

  test.each([
    ['allowed_mutation_surfaces', validPositive()],
    ['reason_codes', validPositive({ journey_kind: 'degraded' })],
    ['semantic_request_ref', validPositive()],
    ['supporting_capture_ref', validPositive()],
  ])('rejects a malformed artifact missing %s without throwing', (field, artifact) => {
    delete artifact[field];
    expect(validateWorkerDispatchHostJourney(artifact, {
      schema,
      repoRoot: process.cwd(),
      now: Date.parse('2026-07-28T17:00:00.000Z'),
    })).toMatchObject({ valid: false });
  });

  test('accepts a non-host-native data-authorization fail-closed journey', () => {
    const degraded = validNonInvokedDegraded({
      provider_trust_domain: 'external', restricted_read_authorization: 'authorized',
      data_egress_authorization: 'missing', credential_use_authorization: 'authorized',
      external_communication_authorization: 'authorized',
      reason_codes: ['worker_data_authorization_missing'],
    });
    expect(validate(degraded)).toEqual({ valid: true, errors: [] });
  });

  test('accepts two distinct positives plus one degraded journey', () => {
    const hostA = validPositive();
    const hostB = validPositive({
      session_identity: 'session-b', host_identity: 'host-b', observed_primitive: 'worker-b',
      candidate_identity_sha256: 'd'.repeat(64),
    });
    const degraded = validNonInvokedDegraded({
      session_identity: 'session-c',
      context_isolation_need: 'required', observed_context_isolation: 'unknown',
      reason_codes: ['isolation_requirement_unmet'],
    });
    expect(validateSet([hostA, hostB, degraded])).toEqual({ valid: true, errors: [] });
  });

  test('rejects same primitive or request drift in the positive pair', () => {
    const hostA = validPositive();
    const hostB = validPositive({ host_identity: 'host-b', session_identity: 'session-b' });
    const degraded = validNonInvokedDegraded({
      worker_dispatch_capability: 'unknown', reason_codes: ['worker_capability_unproven'],
    });
    expect(validateSet([hostA, hostB, degraded]).valid).toBe(false);
  });

  test('does not count an ordinary output failure as the R19 degraded journey', () => {
    const hostA = validPositive();
    const hostB = validPositive({
      session_identity: 'session-b', host_identity: 'host-b', observed_primitive: 'worker-b',
      candidate_identity_sha256: 'd'.repeat(64),
    });
    const degraded = validPositive({
      journey_kind: 'degraded', status: 'degraded', support_claim: 'degraded_only',
      invocation_performed: true, call_status: 'failed',
      output_validation: 'failed', reason_codes: ['worker_output_invalid'],
    });
    expect(validateSet([hostA, hostB, degraded]).errors).toContain(
      'journey set degraded artifact must prove capability, probe, or required-isolation degradation',
    );
  });

  test('rejects a malformed journey set without throwing', () => {
    const hostA = validPositive();
    const hostB = validPositive({
      session_identity: 'session-b', host_identity: 'host-b', observed_primitive: 'worker-b',
      candidate_identity_sha256: 'd'.repeat(64),
    });
    const degraded = validNonInvokedDegraded({
      worker_dispatch_capability: 'unknown', reason_codes: null,
    });
    expect(validateSet([hostA, hostB, degraded])).toMatchObject({ valid: false });
  });

  test('uses the default source root to reject an unresolved supporting capture', () => {
    const result = validateWorkerDispatchHostJourney(validPositive({
      supporting_capture_ref: 'tests/fixtures/worker-dispatch/missing-capture.json',
    }), { schema, now: NOW });
    expect(result.errors).toContain('supporting_capture_ref is unavailable');
  });

  test('rejects a supporting capture whose session identity no longer matches', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-dispatch-journey-'));
    try {
      const artifact = materializeJourney(root, validPositive(), 'session-binding');
      const capturePath = path.join(root, artifact.supporting_capture_ref);
      const capture = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
      capture.session_identity = 'different-session';
      artifact.supporting_capture_sha256 = sha256(writeJson(capturePath, capture));

      expect(validateWorkerDispatchHostJourney(artifact, {
        schema, repoRoot: root, now: NOW,
      }).errors).toContain('session_identity does not match supporting capture');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test.each([
    ['output validation hash', (artifact) => {
      const output = '<provider_untrusted>{"status":"forged"}</provider_untrusted>';
      artifact.output_excerpt = output;
      artifact.output_excerpt_sha256 = sha256(output);
    }],
    ['parallelism observation', (artifact) => {
      artifact.observed_parallelism = 'bounded';
    }],
    ['freshness expiry', (artifact) => {
      artifact.freshness_expires_at = '2026-07-30T16:30:00.000Z';
    }],
  ])('rejects an artifact whose %s changed after its supporting capture', (_label, mutate) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-dispatch-journey-'));
    try {
      const artifact = materializeJourney(root, validPositive(), 'claim-binding');
      mutate(artifact);

      expect(validateWorkerDispatchHostJourney(artifact, {
        schema, repoRoot: root, now: NOW,
      }).valid).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('rejects a state observation receipt outside the authorized mutation surface', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-dispatch-journey-'));
    try {
      const artifact = materializeJourney(root, validPositive({
        mutation_scope: 'explicitly-scoped', mutation_authorization_ref: 'fixture:scope',
        allowed_mutation_surfaces: [TEST_SCOPE_SURFACE],
      }), 'state-surface');
      const observationPath = path.join(root, artifact.state_observation_ref);
      const observation = JSON.parse(fs.readFileSync(observationPath, 'utf8'));
      observation.observed_surfaces = [TEST_FORBIDDEN_OBSERVED_SURFACE];
      artifact.state_observation_sha256 = sha256(writeJson(observationPath, observation));

      expect(validateWorkerDispatchHostJourney(artifact, {
        schema, repoRoot: root, now: NOW,
      }).errors).toContain('state observation receipt must cover exactly the allowed mutation surfaces');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('rejects a mutation authorization receipt created after invocation', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-dispatch-journey-'));
    try {
      const artifact = materializeJourney(root, validPositive({
        mutation_scope: 'explicitly-scoped', mutation_authorization_ref: 'fixture:scope',
        allowed_mutation_surfaces: [TEST_SCOPE_SURFACE],
      }), 'scope-timing');
      const scopePath = path.join(root, artifact.mutation_authorization_ref);
      const scope = JSON.parse(fs.readFileSync(scopePath, 'utf8'));
      scope.captured_at = '2026-07-28T16:29:30.000Z';
      writeJson(scopePath, scope);

      expect(validateWorkerDispatchHostJourney(artifact, {
        schema, repoRoot: root, now: NOW,
      }).errors).toContain('mutation authorization receipt was not valid when invocation started');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test('documents exact-version, live-response, provider-untrusted, and mutation claim limits', () => {
    for (const token of [
      'exact-version',
      'live response',
      'not_applicable',
      'provider_untrusted',
      'mutation_scope=forbidden',
      'Collapse each whitespace run to one ASCII space and trim leading/trailing whitespace.',
    ]) {
      expect(contract).toContain(token);
    }
  });

  test('rejects dated evidence whose source revision and mutation observation are stale', () => {
    const artifacts = datedJourneyPaths.map((filePath) => JSON.parse(
      fs.readFileSync(filePath, 'utf8'),
    ));

    expect(validateWorkerDispatchHostJourneySet(artifacts, {
      schema,
      repoRoot: process.cwd(),
      now: Date.parse('2026-07-28T17:00:00.000Z'),
    }).errors).toEqual(expect.arrayContaining([
      'artifact[0]: spec_first_revision does not match the current source identity',
      'artifact[1]: spec_first_revision does not match the current source identity',
      'artifact[0]: invoked journey requires caller state observation evidence',
      'artifact[1]: invoked journey requires caller state observation evidence',
    ]));
  });

  test('binds a journey to its supporting capture and canonical semantic request bytes', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-dispatch-journey-'));
    try {
      const artifact = materializeJourney(tempRoot, validPositive(), 'bound');

      expect(validateWorkerDispatchHostJourney(artifact, {
        schema,
        repoRoot: tempRoot,
        now: Date.parse('2026-07-28T17:00:00.000Z'),
      })).toEqual({ valid: true, errors: [] });

      fs.appendFileSync(path.join(tempRoot, artifact.semantic_request_ref), '\nsemantic drift\n');
      expect(validateWorkerDispatchHostJourney(artifact, {
        schema,
        repoRoot: tempRoot,
        now: Date.parse('2026-07-28T17:00:00.000Z'),
      })).toMatchObject({
        valid: false,
        errors: expect.arrayContaining(['semantic_request_sha256 mismatch']),
      });
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
