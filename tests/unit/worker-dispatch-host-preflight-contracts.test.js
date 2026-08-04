'use strict';

const fs = require('node:fs');

const {
  ELIGIBILITY_CONTRACT_REF,
  eligibilityContractSha256,
  sha256,
  validateWorkerDispatchHostPreflight,
  validateWorkerDispatchHostPreflightPair,
} = require('../../src/contracts/worker-dispatch-host-preflight-validator');

const schema = JSON.parse(fs.readFileSync(
  'docs/contracts/verification/worker-dispatch-host-preflight.schema.json',
  'utf8',
));
const contract = fs.readFileSync(
  'docs/contracts/verification/worker-dispatch-host-preflight.md',
  'utf8',
);

function validArtifact(overrides = {}) {
  const excerpt = '<provider_untrusted>generic bounded worker schema</provider_untrusted>';
  return {
    schema_version: 'worker-dispatch-host-preflight/v1',
    artifact_type: 'advisory',
    gate: 'post-u1-pre-u2-discovery-only',
    status: 'passed',
    support_claim: 'not_applicable',
    capture_owner: 'host-session-evidence-owner',
    capture_method: 'host-session-tool-registry-api',
    captured_at: '2026-07-28T12:00:00.000Z',
    freshness_expires_at: '2026-07-29T12:00:00.000Z',
    session_identity: 'opaque-session-ref',
    host_identity: 'host-a',
    host_startup_or_version_ref: 'host-version:example-1.0.0',
    dispatch_authorization_receipt: 'conversation:user-authorized-discovery-only',
    authorization_basis: 'explicit-user',
    discovery_surface: 'current-session:tool-registry',
    schema_excerpt_ref: 'inline:redacted-schema-excerpt',
    schema_excerpt: excerpt,
    schema_excerpt_sha256: sha256(excerpt),
    schema_completeness: 'confirmed',
    completeness_basis: 'host-contract:current-session-registry-complete',
    redaction_status: 'passed',
    capture_limitations: ['No worker invocation was performed.'],
    capability_probe: 'attempted',
    worker_dispatch_capability: 'available',
    eligibility_contract_ref: ELIGIBILITY_CONTRACT_REF,
    eligibility_contract_sha256: eligibilityContractSha256(),
    eligible_candidates: [{
      candidate_identity_sha256: 'b'.repeat(64),
      unique: true,
      rationale: 'Schema exposes a self-contained packet, bounded stop, mutation scope, and caller-readable output.',
    }],
    invocation_performed: false,
    ...overrides,
  };
}

function validatePreflight(artifact) {
  return validateWorkerDispatchHostPreflight(artifact, {
    schema,
    now: Date.parse('2026-07-28T13:00:00.000Z'),
  });
}

describe('worker dispatch host preflight contract', () => {
  test('accepts a current-session discovery-only artifact with bounded redacted evidence', () => {
    expect(validatePreflight(validArtifact())).toEqual({ valid: true, errors: [] });
  });

  test.each([
    ['model self report', { capture_method: 'model-self-report' }],
    ['CLI help', { capture_method: 'cli-help' }],
    ['provider documentation', { capture_method: 'provider-docs' }],
    ['cached tool list', { capture_method: 'cached-tool-list' }],
    ['historical transcript', { capture_method: 'historical-transcript' }],
    ['unredacted excerpt', { redaction_status: 'failed' }],
    ['hash mismatch', { schema_excerpt_sha256: 'c'.repeat(64) }],
    ['unverifiable completeness', { completeness_basis: null }],
    ['worker invocation', { invocation_performed: true }],
    ['support promotion', { support_claim: 'supported' }],
    ['stale capture', { freshness_expires_at: '2026-07-28T12:30:00.000Z' }],
    ['unparseable timestamp', { captured_at: 'not-a-time' }],
    ['future capture timestamp', { captured_at: '2026-07-28T14:00:00.000Z' }],
    ['inverted freshness window', { freshness_expires_at: '2026-07-28T11:00:00.000Z' }],
    ['missing captured excerpt', {
      schema_excerpt_ref: null,
      schema_excerpt: null,
      schema_excerpt_sha256: null,
    }],
    ['multiple available candidates', {
      eligible_candidates: [
        validArtifact().eligible_candidates[0],
        { ...validArtifact().eligible_candidates[0], candidate_identity_sha256: 'd'.repeat(64) },
      ],
    }],
    ['missing without confirmed completeness', {
      worker_dispatch_capability: 'missing',
      schema_completeness: 'unconfirmed',
      completeness_basis: null,
      eligible_candidates: [],
    }],
    ['available without confirmed completeness', {
      schema_completeness: 'unconfirmed',
      completeness_basis: null,
    }],
    ['unquoted provider evidence', (() => {
      const schemaExcerpt = 'generic bounded worker schema';
      return {
        schema_excerpt: schemaExcerpt,
        schema_excerpt_sha256: sha256(schemaExcerpt),
      };
    })()],
    ['unsafe control character', (() => {
      const schemaExcerpt = '<provider_untrusted>unsafe\u0007schema</provider_untrusted>';
      return {
        schema_excerpt: schemaExcerpt,
        schema_excerpt_sha256: sha256(schemaExcerpt),
      };
    })()],
    ['secret-like value', (() => {
      const schemaExcerpt = '<provider_untrusted>api_key=abcdefgh12345678</provider_untrusted>';
      return {
        schema_excerpt: schemaExcerpt,
        schema_excerpt_sha256: sha256(schemaExcerpt),
      };
    })()],
    ['nested provider delimiter', (() => {
      const schemaExcerpt = '<provider_untrusted>safe</provider_untrusted><provider_untrusted>extra</provider_untrusted>';
      return {
        schema_excerpt: schemaExcerpt,
        schema_excerpt_sha256: sha256(schemaExcerpt),
      };
    })()],
    ['unescaped markup', (() => {
      const schemaExcerpt = '<provider_untrusted><ignore-caller>unsafe</ignore-caller></provider_untrusted>';
      return {
        schema_excerpt: schemaExcerpt,
        schema_excerpt_sha256: sha256(schemaExcerpt),
      };
    })()],
    ['passed with unknown capability', {
      worker_dispatch_capability: 'unknown',
      schema_completeness: 'unconfirmed',
      completeness_basis: null,
      eligible_candidates: [],
    }],
    ['stale eligibility contract hash', {
      eligibility_contract_sha256: 'e'.repeat(64),
    }],
    ['wrong eligibility contract ref', {
      eligibility_contract_ref: 'docs/contracts/workflows/other.md#eligibility',
    }],
  ])('rejects %s as Gate 0 evidence', (_label, overrides) => {
    expect(validatePreflight(validArtifact(overrides)).valid).toBe(false);
  });

  test('allows not_run only for unavailable discovery with unknown capability', () => {
    const notRun = validArtifact({
      status: 'not_run',
      capture_method: 'equivalent-current-session-source',
      schema_excerpt_ref: null,
      schema_excerpt: null,
      schema_excerpt_sha256: null,
      schema_completeness: 'unconfirmed',
      completeness_basis: null,
      redaction_status: 'passed',
      capability_probe: 'unavailable',
      worker_dispatch_capability: 'unknown',
      eligible_candidates: [],
    });

    expect(validatePreflight(notRun)).toEqual({ valid: true, errors: [] });
  });

  test('documents provider-untrusted quoting, forbidden evidence, and human semantic review', () => {
    expect(contract).toContain('provider_untrusted');
    expect(contract).toContain('模型自述、CLI help、provider 文档、缓存 tool list、历史 transcript');
    expect(contract).toContain('不得调用 worker');
    expect(contract).toContain('LLM / human reviewer');
    expect(contract).toContain('同一份 eligibility contract hash');
  });

  test('fails closed instead of throwing when the canonical eligibility contract is unreadable', () => {
    const artifact = validArtifact();
    const originalReadFileSync = fs.readFileSync;
    const spy = jest.spyOn(fs, 'readFileSync').mockImplementation((filePath, ...args) => {
      if (String(filePath).endsWith('docs/contracts/workflows/worker-dispatch-capability.md')) {
        throw new Error('unavailable');
      }
      return originalReadFileSync(filePath, ...args);
    });
    try {
      expect(validateWorkerDispatchHostPreflight(artifact, {
        schema,
        now: Date.parse('2026-07-28T13:00:00.000Z'),
      })).toMatchObject({
        valid: false,
        errors: expect.arrayContaining(['canonical eligibility contract is unavailable']),
      });
    } finally {
      spy.mockRestore();
    }
  });

  test('accepts a Gate 0 pair only for distinct hosts and distinct candidate identities', () => {
    const hostA = validArtifact();
    const hostB = validArtifact({
      host_identity: 'host-b',
      session_identity: 'opaque-session-ref-b',
      eligible_candidates: [{
        ...validArtifact().eligible_candidates[0],
        candidate_identity_sha256: 'c'.repeat(64),
      }],
    });

    expect(validateWorkerDispatchHostPreflightPair([hostA, hostB], {
      schema,
      now: Date.parse('2026-07-28T13:00:00.000Z'),
    })).toEqual({ valid: true, errors: [] });
  });

  test('accepts the dated Codex and Claude Discovery-only Gate 0 evidence pair', () => {
    const base = 'docs/validation/worker-dispatch/preflight';
    const artifacts = [
      '2026-07-29-codex-cli-0.145.0-preflight.json',
      '2026-07-29-claude-code-2.1.220-preflight.json',
    ].map((name) => JSON.parse(fs.readFileSync(`${base}/${name}`, 'utf8')));

    for (const name of [
      '2026-07-29-codex-cli-0.145.0-schema-capture.json',
      '2026-07-29-claude-code-2.1.220-schema-capture.json',
    ]) {
      const capture = JSON.parse(fs.readFileSync(`${base}/${name}`, 'utf8'));
      expect(capture).toMatchObject({
        redaction_status: 'passed',
        invocation_performed: false,
      });
    }

    expect(validateWorkerDispatchHostPreflightPair(artifacts, {
      schema,
      now: Date.parse('2026-07-28T16:20:00.000Z'),
    })).toEqual({ valid: true, errors: [] });
  });

  test.each([
    ['one artifact', [validArtifact()]],
    ['same host', [validArtifact(), validArtifact({ session_identity: 'session-b' })]],
    ['same candidate', [validArtifact(), validArtifact({ host_identity: 'host-b' })]],
    ['different contract hash', [
      validArtifact(),
      validArtifact({
        host_identity: 'host-b',
        eligible_candidates: [{
          ...validArtifact().eligible_candidates[0],
          candidate_identity_sha256: 'c'.repeat(64),
        }],
        eligibility_contract_sha256: 'f'.repeat(64),
      }),
    ]],
    ['non-passed artifact', [
      validArtifact(),
      validArtifact({
        host_identity: 'host-b',
        status: 'failed',
        worker_dispatch_capability: 'unknown',
        schema_completeness: 'unconfirmed',
        completeness_basis: null,
        eligible_candidates: [],
      }),
    ]],
  ])('rejects Gate 0 pair with %s', (_label, artifacts) => {
    expect(validateWorkerDispatchHostPreflightPair(artifacts, {
      schema,
      now: Date.parse('2026-07-28T13:00:00.000Z'),
    }).valid).toBe(false);
  });
});
