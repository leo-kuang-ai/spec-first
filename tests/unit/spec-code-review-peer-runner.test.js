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
  const payloadRef = path.join(root, 'peer-task.json');
  const requestRef = path.join(root, 'worker-request.json');
  const receiptRef = path.join(root, 'worker-journey.json');
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
  return { sourceIdentity, payloadRef, payloadSha, receiptRef, receiptSha };
}

function startArgs(root, evidence, resultPath, worker, extra = []) {
  return [
    RUNNER,
    'start',
    '--skill', 'spec-code-review',
    '--run-id', 'run-1',
    '--authorization-receipt', evidence.receiptRef,
    '--authorization-receipt-sha256', evidence.receiptSha,
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

  test('starts only with matching canonical authority and publishes bounded results', () => {
    const evidence = fixture(root);
    const resultPath = path.join(root, 'result.json');
    const worker = [
      process.execPath,
      '-e',
      'require("fs").writeFileSync(process.argv[1], JSON.stringify({findings:[]}));',
      resultPath,
    ];
    const env = runnerEnv(root);
    const jobId = execFileSync('python3', startArgs(root, evidence, resultPath, worker), {
      cwd: REPO_ROOT,
      env,
      encoding: 'utf8',
    }).trim();
    const state = execFileSync('python3', [RUNNER, 'wait', '--skill', 'spec-code-review', '--max-secs', '5', jobId], {
      cwd: REPO_ROOT,
      env,
      encoding: 'utf8',
    }).trim();
    expect(state).toBe('done');
    expect(JSON.parse(execFileSync('python3', [RUNNER, 'result', '--skill', 'spec-code-review', jobId], {
      cwd: REPO_ROOT,
      env,
      encoding: 'utf8',
    }))).toEqual({ findings: [] });

    const jobRoot = path.join(env.SPEC_FIRST_PEER_JOBS_ROOT, 'spec-code-review', 'run-1', 'jobs');
    const meta = JSON.parse(fs.readFileSync(path.join(jobRoot, jobId, 'meta.json'), 'utf8'));
    expect(meta.worker_argv).toBeUndefined();
    expect(meta.canonical_authorization_receipt_sha256).toBe(evidence.receiptSha);
    expect(meta.payload_redaction_status).toBe('passed');
    expect(meta.requested_provider).toBe('claude');
    expect(meta.actual_model).toBe('opus');
  });

  test.each([
    ['missing data-egress authorization', { authorizations: { data_egress_authorization: 'missing' } }, [], 'data_egress_authorization=authorized'],
    ['non-allowlisted input ref', { payloadInputRefs: ['unapproved:path'] }, [], 'input_refs do not match'],
    ['secret-like prompt', { prompt: 'Use api_key=abcdefghijk12345 to review.' }, [], 'secret-like value'],
    ['same provider', {}, ['--host-provider', 'claude'], 'matches the host provider'],
    ['actual model mismatch', {}, ['--actual-model', 'sonnet'], 'actual model does not match'],
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

  test('does not execute command-shaped provider output and redacts secret-like logs', () => {
    const evidence = fixture(root);
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
    const jobId = execFileSync('python3', args, {
      cwd: REPO_ROOT,
      env,
      encoding: 'utf8',
    }).trim();
    execFileSync('python3', [RUNNER, 'wait', '--skill', 'spec-code-review', '--max-secs', '5', jobId], {
      cwd: REPO_ROOT,
      env,
    });
    expect(fs.existsSync(marker)).toBe(false);
    const log = fs.readFileSync(path.join(
      env.SPEC_FIRST_PEER_JOBS_ROOT,
      'spec-code-review',
      'run-1',
      'jobs',
      jobId,
      'out.log',
    ), 'utf8');
    expect(log).toContain('[REDACTED]');
    expect(log).not.toContain('abcdefghijk12345');
  });

  test('adapter publishes the authorized packet and uses the runner lifecycle', () => {
    const evidence = fixture(root);
    const fakeBin = path.join(root, 'bin');
    fs.mkdirSync(fakeBin, { mode: 0o700 });
    const fakeClaude = path.join(fakeBin, 'claude');
    fs.writeFileSync(
      fakeClaude,
      '#!/bin/sh\nprintf \'%s\\n\' \'{"structured_output":{"findings":[],"residual_risks":[],"testing_gaps":[]}}\'\n',
      { mode: 0o700 },
    );
    const env = runnerEnv(root, { PATH: `${fakeBin}:${process.env.PATH}` });
    const jobId = execFileSync('bash', [
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
      env,
      encoding: 'utf8',
    }).trim();
    const state = execFileSync('python3', [
      RUNNER,
      'wait',
      '--skill',
      'spec-code-review',
      '--max-secs',
      '5',
      jobId,
    ], {
      cwd: REPO_ROOT,
      env,
      encoding: 'utf8',
    }).trim();
    if (state !== 'done') {
      const reason = fs.readFileSync(path.join(
        env.SPEC_FIRST_PEER_JOBS_ROOT,
        'spec-code-review',
        path.basename(root),
        'jobs',
        jobId,
        'reason',
      ), 'utf8');
      const log = fs.readFileSync(path.join(
        env.SPEC_FIRST_PEER_JOBS_ROOT,
        'spec-code-review',
        path.basename(root),
        'jobs',
        jobId,
        'out.log',
      ), 'utf8');
      throw new Error(`adapter job ended as ${state}: ${reason}\n${log}`);
    }
    expect(state).toBe('done');
    expect(JSON.parse(fs.readFileSync(path.join(root, 'adversarial-claude.json'), 'utf8')))
      .toEqual({
        reviewer: 'adversarial-claude',
        findings: [],
        residual_risks: [],
        testing_gaps: [],
      });
    const packet = JSON.parse(fs.readFileSync(path.join(root, 'peer-task-claude.json'), 'utf8'));
    expect(packet.source_identity).toBe(evidence.sourceIdentity);
    expect(packet.prompt).toContain('Return one JSON object and nothing else');
  });
});
