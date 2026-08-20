const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '../..');
const RUNNER = path.join(
  REPO_ROOT,
  'skills/spec-code-review/scripts/peer-job-runner.py',
);
const ADAPTER = path.join(
  REPO_ROOT,
  'skills/spec-code-review/scripts/cross-model-adversarial-review.sh',
);

function digest(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function writeJson(file, value) {
  const raw = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
  fs.writeFileSync(file, raw, { mode: 0o600 });
  return digest(raw);
}

function fixture(root, overrides = {}) {
  const sourceIdentity = 'worktree:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const requestedProvider = overrides.requestedProvider || 'claude';
  const requestedModel = overrides.requestedModel || 'opus';
  const payloadRef = path.join(root, 'peer-task.json');
  const requestRef = path.join(root, 'worker-request.json');
  const receiptRef = path.join(root, 'worker-journey.json');
  const servingReceiptRef = path.join(root, 'provider-serving-receipt.json');
  const inputRefs = overrides.inputRefs || ['git:base..head', 'skills/spec-code-review/SKILL.md'];
  const authorizations = {
    restricted_read_authorization: 'authorized',
    data_egress_authorization: 'authorized',
    credential_use_authorization: 'authorized',
    external_communication_authorization: 'authorized',
    ...(overrides.authorizations || {}),
  };
  const requestSha = writeJson(requestRef, {
    worker_dispatch_request: {
      worker_dispatch_authorization: 'authorized',
      provider_trust_domain: 'external',
      ...authorizations,
      input_refs: inputRefs,
    },
  });
  const payloadSha = writeJson(payloadRef, {
    schema_version: 'peer-task-packet/v1',
    source_identity: sourceIdentity,
    input_refs: overrides.payloadInputRefs || inputRefs,
    prompt: overrides.prompt || 'Review the allowlisted diff and return JSON only.',
  });
  const receiptSha = writeJson(receiptRef, {
    schema_version: 'worker-dispatch-host-journey/v1',
    worker_dispatch_capability: 'available',
    dispatch_authorization_receipt: 'conversation:user:authorized',
    authorization_basis: 'explicit-user',
    freshness_expires_at: new Date(Date.now() + 60_000).toISOString().replace('.000', ''),
    redaction_status: 'passed',
    provider_trust_domain: 'external',
    semantic_request_ref: requestRef,
    semantic_request_sha256: requestSha,
    ...authorizations,
  });
  const capturedAt = new Date();
  const servingReceiptSha = writeJson(servingReceiptRef, {
    schema_version: 'provider-serving-receipt/v2',
    artifact_type: 'degraded',
    verification_status: 'unverified',
    reason_code: 'authenticated-producer-unavailable',
    producer: {
      kind: 'host-runtime',
      identity: 'test-host-runtime',
      authority: 'self-asserted',
    },
    captured_at: capturedAt.toISOString(),
    freshness_expires_at: new Date(capturedAt.getTime() + 60_000).toISOString(),
    semantic_request_sha256: requestSha,
    source_identity: sourceIdentity,
    provider_trust_domain: 'external',
    requested_provider: requestedProvider,
    requested_model: requestedModel,
    actual_provider: overrides.actualProvider || requestedProvider,
    actual_model: overrides.actualModel || requestedModel,
    credential_env_allowlist: overrides.credentialEnvAllowlist || [],
    ...(overrides.servingReceipt || {}),
  });
  return {
    sourceIdentity,
    payloadRef,
    payloadSha,
    receiptRef,
    receiptSha,
    servingReceiptRef,
    servingReceiptSha,
  };
}

function startArgs(root, evidence, resultPath, worker, extra = []) {
  return [
    RUNNER,
    'start',
    '--skill', 'spec-code-review',
    '--run-id', 'run-1',
    '--authorization-receipt', evidence.receiptRef,
    '--authorization-receipt-sha256', evidence.receiptSha,
    '--serving-receipt', evidence.servingReceiptRef,
    '--serving-receipt-sha256', evidence.servingReceiptSha,
    '--payload-ref', evidence.payloadRef,
    '--payload-sha256', evidence.payloadSha,
    '--payload-redaction-status', 'passed',
    '--source-identity', evidence.sourceIdentity,
    '--provider-trust-domain', 'external',
    '--host-provider', 'codex',
    '--requested-provider', 'claude',
    '--actual-provider', 'claude',
    '--requested-model', 'opus',
    '--actual-model', 'opus',
    '--result-path', resultPath,
    ...extra,
    '--',
    ...worker,
  ];
}

function runnerEnv(root, extra = {}) {
  return {
    ...process.env,
    SPEC_FIRST_PEER_JOBS_ROOT: path.join(root, 'jobs-root'),
    SPEC_FIRST_PEER_POLL_SECS: '0.05',
    SPEC_FIRST_PEER_IDLE_SECS: '2',
    SPEC_FIRST_PEER_HARD_SECS: '5',
    SPEC_FIRST_PEER_GRACE_SECS: '0.1',
    ...extra,
  };
}

describe('spec-code-review peer runner', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-peer-test-'));
    fs.chmodSync(root, 0o700);
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  test('starts no peer when the serving producer is not authenticated', () => {
    const evidence = fixture(root);
    const resultPath = path.join(root, 'result.json');
    const worker = [
      process.execPath,
      '-e',
      'require("fs").writeFileSync(process.argv[1], JSON.stringify({findings:[]}));',
      resultPath,
    ];
    const env = runnerEnv(root);
    const result = spawnSync('python3', startArgs(root, evidence, resultPath, worker), {
      cwd: REPO_ROOT,
      env,
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('provider_serving_receipt_unverified');
    expect(fs.existsSync(resultPath)).toBe(false);
    expect(fs.existsSync(env.SPEC_FIRST_PEER_JOBS_ROOT)).toBe(false);
  });

  test.each([
    ['missing data-egress authorization', { authorizations: { data_egress_authorization: 'missing' } }, [], 'data_egress_authorization=authorized'],
    ['self-asserted serving producer', {}, [], 'provider_serving_receipt_unverified'],
    ['forged confirmed status', { servingReceipt: { artifact_type: 'confirmed', verification_status: 'verified' } }, [], 'provider_serving_receipt_unverified'],
  ])('fails closed for %s', (_name, fixtureOverrides, extra, expected) => {
    const evidence = fixture(root, fixtureOverrides);
    const resultPath = path.join(root, 'result.json');
    const args = startArgs(root, evidence, resultPath, [process.execPath, '-e', 'process.exit(0)'], extra);
    const result = spawnSync('python3', args, {
      cwd: REPO_ROOT,
      env: runnerEnv(root),
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(expected);
  });

  test('does not execute a worker or expose credentials when serving identity is unverified', () => {
    const evidence = fixture(root, { credentialEnvAllowlist: ['PEER_TEST_TOKEN'] });
    const resultPath = path.join(root, 'result.json');
    const marker = path.join(root, 'must-not-exist');
    const worker = [
      process.execPath,
      '-e',
      'const fs=require("fs"); console.error(process.env.PEER_TEST_TOKEN); fs.writeFileSync(process.argv[1], JSON.stringify({command:"touch "+process.argv[2]}));',
      resultPath,
      marker,
    ];
    const env = runnerEnv(root, { PEER_TEST_TOKEN: 'api_key=abcdefghijk12345' });
    const args = startArgs(root, evidence, resultPath, worker, ['--credential-env', 'PEER_TEST_TOKEN']);
    const result = spawnSync('python3', args, {
      cwd: REPO_ROOT,
      env,
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('provider_serving_receipt_unverified');
    expect(fs.existsSync(marker)).toBe(false);
    expect(fs.existsSync(env.SPEC_FIRST_PEER_JOBS_ROOT)).toBe(false);
  });

  test('adapter rejects an unverified serving receipt before publishing a packet', () => {
    const evidence = fixture(root, { requestedProvider: 'codex', requestedModel: 'gpt-5' });
    const fakeBin = path.join(root, 'bin');
    fs.mkdirSync(fakeBin, { mode: 0o700 });
    const fakeCodex = path.join(fakeBin, 'codex');
    fs.writeFileSync(
      fakeCodex,
      '#!/bin/sh\nwhile [ "$#" -gt 0 ]; do\n  if [ "$1" = "-o" ]; then\n    shift\n    printf \'%s\\n\' \'{"findings":[],"residual_risks":[],"testing_gaps":[]}\' >"$1"\n    exit 0\n  fi\n  shift\ndone\nexit 2\n',
      { mode: 0o700 },
    );
    const env = runnerEnv(root, { PATH: `${fakeBin}:${process.env.PATH}` });
    const result = spawnSync('bash', [
      ADAPTER,
      'start',
      'codex',
      'gpt-5',
      'HEAD',
      root,
      evidence.receiptRef,
      evidence.receiptSha,
      evidence.sourceIdentity,
      'claude',
      evidence.servingReceiptRef,
      evidence.servingReceiptSha,
    ], {
      cwd: REPO_ROOT,
      env,
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('provider_serving_receipt_unverified');
    expect(fs.existsSync(path.join(root, 'peer-task-codex.json'))).toBe(false);
  });

  test('adapter starts no peer when a serving receipt is unavailable', () => {
    const evidence = fixture(root);
    const result = spawnSync('bash', [
      ADAPTER,
      'start',
      'claude',
      'opus',
      'HEAD',
      root,
      evidence.receiptRef,
      evidence.receiptSha,
      evidence.sourceIdentity,
      'codex',
    ], {
      cwd: REPO_ROOT,
      env: runnerEnv(root),
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('provider_serving_receipt_unavailable');
    expect(fs.existsSync(path.join(root, 'peer-task-claude.json'))).toBe(false);
  });
});
