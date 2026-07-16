'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { runInternal } = require('../../src/cli/commands/internal');
const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const { validateHonestCloseout, validateHonestCloseoutOutput } = require('../../src/cli/helpers/honest-closeout');
const { writeVerificationRunSummary } = require('../../src/cli/helpers/verification-run-summary');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SCHEMA_PATH = path.join(REPO_ROOT, 'docs', 'contracts', 'workflows', 'honest-closeout.schema.json');

function makeRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'honest-closeout-'));
  execFileSync('git', ['init', '-q'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'Spec First Test'], { cwd: repo });
  execFileSync('git', ['config', 'user.email', 'spec-first-test@example.invalid'], { cwd: repo });
  return repo;
}

function slugify(value) {
  return String(value || 'workspace')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'workspace';
}

function logRef(repo, runId, fileName = 'typecheck.log') {
  const relativePath = path.join('.spec-first', 'workflows', 'spec-work', slugify(path.basename(repo)), runId, 'logs', fileName);
  const absolutePath = path.join(repo, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, 'ok\n');
  return relativePath;
}

function runSummaryPayload(repo, runId, checkOverrides = {}) {
  const baseCheck = {
    id: 'typecheck',
    service: 'spec-first',
    command: 'npm run typecheck',
    status: 'passed',
    exit_code: 0,
    ran: true,
    required_tools: ['node', 'npm'],
    missing_tools: [],
    log_path: logRef(repo, runId),
    reason_code: 'exit-code-zero',
    redaction_status: 'none-required',
  };
  const checks = Array.isArray(checkOverrides)
    ? checkOverrides.map((overrides) => ({
      ...baseCheck,
      ...overrides,
      log_path: Object.prototype.hasOwnProperty.call(overrides, 'log_path')
        ? overrides.log_path
        : logRef(repo, runId, `${overrides.id || baseCheck.id}.log`),
    }))
    : [{ ...baseCheck, ...checkOverrides }];
  return {
    profile: {
      source: 'explicit',
      name: 'default',
      path: 'spec-first.verification.json',
    },
    checks,
  };
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
  return filePath;
}

function writeRunSummary(repo, runId, checkOverrides = {}) {
  const inputPath = writeJson(path.join(repo, `${runId}-summary-input.json`), runSummaryPayload(repo, runId, checkOverrides));
  const result = writeVerificationRunSummary({ inputPath, runId, targetRepo: repo });
  expect(result.exitCode).toBe(0);
  return result.output.run_summary_ref;
}

function captureStdout(fn) {
  const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  try {
    const code = fn();
    const stdout = outputSpy.mock.calls.map((call) => String(call[0])).join('');
    return { code, stdout };
  } finally {
    outputSpy.mockRestore();
  }
}

describe('honest closeout contract and validator', () => {
  test('schema validates consistent closeout output', () => {
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
    const output = {
      schema_version: 'honest-closeout.v1',
      generated_at: '2026-06-04T00:00:00.000Z',
      overall: 'verified',
      overall_reason_code: 'all-claims-consistent',
      claims: [
        {
          claim_type: 'validation',
          asserted_status: 'passed',
          evidence_refs: ['verification-run-summary:typecheck'],
          verdict: 'consistent',
          reason_code: 'validation-evidence-consistent',
        },
      ],
    };

    expect(validateAgainstSchema(schema, output).errors).toEqual([]);
    expect(validateHonestCloseoutOutput(output).errors).toEqual([]);
  });

  test('marks validation passed only when backed by a passed run-summary check', () => {
    const repo = makeRepo();
    try {
      const runSummaryRef = writeRunSummary(repo, 'verified-run');
      const output = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: runSummaryRef,
          claims: [
            {
              claim_type: 'validation',
              asserted_status: 'passed',
              evidence_refs: ['verification-run-summary:typecheck'],
            },
          ],
        },
      });

      expect(output.overall).toBe('verified');
      expect(output.claims[0]).toEqual(expect.objectContaining({
        verdict: 'consistent',
        reason_code: 'validation-evidence-consistent',
      }));
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('degrades when validation is honestly not-run instead of pretending verified', () => {
    const repo = makeRepo();
    try {
      const runSummaryRef = writeRunSummary(repo, 'not-run', {
        status: 'not-run',
        exit_code: null,
        ran: false,
        log_path: null,
        reason_code: 'schedulable',
      });
      const output = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: runSummaryRef,
          claims: [
            {
              claim_type: 'validation',
              asserted_status: 'not-run',
              evidence_refs: ['verification-run-summary:typecheck'],
            },
          ],
        },
      });

      expect(output.overall).toBe('degraded');
      expect(output.claims[0]).toEqual(expect.objectContaining({
        verdict: 'degraded',
        reason_code: 'validation-not-verified',
      }));
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('rejects unsupported validation claims with missing or mismatched evidence', () => {
    const repo = makeRepo();
    try {
      const runSummaryRef = writeRunSummary(repo, 'mismatch', {
        status: 'not-run',
        exit_code: null,
        ran: false,
        log_path: null,
        reason_code: 'schedulable',
      });
      const missingRef = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: runSummaryRef,
          claims: [
            {
              claim_type: 'validation',
              asserted_status: 'passed',
              evidence_refs: [],
            },
          ],
        },
      });
      const mismatch = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: runSummaryRef,
          claims: [
            {
              claim_type: 'validation',
              asserted_status: 'passed',
              evidence_refs: ['verification-run-summary:typecheck'],
            },
          ],
        },
      });

      expect(missingRef.overall).toBe('unsupported');
      expect(missingRef.claims[0].reason_code).toBe('missing-evidence-ref');
      expect(mismatch.overall).toBe('unsupported');
      expect(mismatch.claims[0].reason_code).toBe('evidence-status-mismatch');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('checks every referenced run-summary check before verifying a passed validation claim', () => {
    const repo = makeRepo();
    try {
      const runSummaryRef = writeRunSummary(repo, 'multi-ref', [
        { id: 'typecheck' },
        {
          id: 'unit',
          command: 'npm run test:unit',
          status: 'failed',
          exit_code: 1,
          reason_code: 'exit-code-nonzero',
        },
      ]);
      const output = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: runSummaryRef,
          claims: [
            {
              claim_type: 'validation',
              asserted_status: 'passed',
              evidence_refs: [
                'verification-run-summary:typecheck',
                'verification-run-summary:unit',
              ],
            },
          ],
        },
      });

      expect(output.overall).toBe('unsupported');
      expect(output.claims[0]).toEqual(expect.objectContaining({
        verdict: 'unsupported',
        reason_code: 'evidence-status-mismatch',
      }));
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // 回归:validation claim 不得通过只引用通过的 check 子集来隐藏 run summary 中
  // 未覆盖的 not-run/failed/degraded check。passed 断言必须反映全部 check 的聚合真相,
  // 否则降级 degraded,而非静默 verified。
  test('degrades a passed validation claim that cherry-picks only passing checks', () => {
    const repo = makeRepo();
    try {
      const runSummaryRef = writeRunSummary(repo, 'cherry-pick', [
        { id: 'typecheck' },
        { id: 'unit', command: 'npm run test:unit' },
        {
          id: 'integration',
          command: 'npm run test:integration',
          status: 'not-run',
          ran: false,
          exit_code: null,
          required_tools: ['docker'],
          missing_tools: ['docker'],
          log_path: null,
          reason_code: 'missing_dependency',
        },
      ]);
      const output = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: runSummaryRef,
          claims: [
            {
              claim_type: 'validation',
              asserted_status: 'passed',
              evidence_refs: [
                'verification-run-summary:typecheck',
                'verification-run-summary:unit',
              ],
            },
          ],
        },
      });

      expect(output.overall).toBe('degraded');
      expect(output.claims[0]).toEqual(expect.objectContaining({
        verdict: 'degraded',
        reason_code: 'run-summary-checks-uncovered',
      }));
      expect(validateHonestCloseoutOutput(output).errors).toEqual([]);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('rejects validation claims when any referenced run-summary check is missing', () => {
    const repo = makeRepo();
    try {
      const runSummaryRef = writeRunSummary(repo, 'missing-ref');
      const output = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: runSummaryRef,
          claims: [
            {
              claim_type: 'validation',
              asserted_status: 'passed',
              evidence_refs: [
                'verification-run-summary:typecheck',
                'verification-run-summary:unit',
              ],
            },
          ],
        },
      });

      expect(output.overall).toBe('unsupported');
      expect(output.claims[0].reason_code).toBe('run-summary-check-not-found');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('degrades natural-language-only closeout with no structured claims', () => {
    const repo = makeRepo();
    try {
      const output = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: null,
          claims: [],
        },
      });

      expect(output.overall).toBe('degraded');
      expect(output.overall_reason_code).toBe('missing-structured-claims');
      expect(output.claims).toEqual([]);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('requires knowledge promotion refs to point at docs/solutions', () => {
    const repo = makeRepo();
    try {
      writeJson(path.join(repo, 'docs/solutions/pattern.md'), { ok: true });
      const supported = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: null,
          claims: [
            {
              claim_type: 'knowledge_promotion',
              asserted_status: 'confirmed',
              evidence_refs: ['docs/solutions/pattern.md'],
            },
          ],
        },
      });
      const unsupported = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: null,
          claims: [
            {
              claim_type: 'knowledge_promotion',
              asserted_status: 'confirmed',
              evidence_refs: ['README.md'],
            },
          ],
        },
      });
      const pathRejected = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: null,
          claims: [
            {
              claim_type: 'knowledge_promotion',
              asserted_status: 'confirmed',
              evidence_refs: ['docs/solutions/../secret.md'],
            },
          ],
        },
      });

      expect(supported.overall).toBe('verified');
      expect(unsupported.overall).toBe('unsupported');
      expect(unsupported.claims[0].reason_code).toBe('knowledge-evidence-not-solution-doc');
      expect(pathRejected.overall).toBe('unsupported');
      expect(pathRejected.claims[0].reason_code).toBe('evidence-ref-invalid');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('rejects repo-path evidence refs that do not resolve to regular files inside the target repo', () => {
    const repo = makeRepo();
    try {
      writeJson(path.join(repo, 'docs/reviews/code-review.json'), { ok: true });
      writeJson(path.join(repo, 'docs/impact/impact.json'), { ok: true });
      const supportedReview = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: null,
          claims: [
            {
              claim_type: 'review',
              asserted_status: 'completed',
              evidence_refs: ['docs/reviews/code-review.json'],
            },
          ],
        },
      });
      const missingReview = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: null,
          claims: [
            {
              claim_type: 'review',
              asserted_status: 'completed',
              evidence_refs: ['docs/reviews/missing.json'],
            },
          ],
        },
      });
      const missingImpact = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: null,
          claims: [
            {
              claim_type: 'impact_surface',
              asserted_status: 'completed',
              evidence_refs: ['docs/impact/missing.json'],
            },
          ],
        },
      });
      const missingKnowledge = validateHonestCloseout({
        targetRepo: repo,
        payload: {
          run_summary_ref: null,
          claims: [
            {
              claim_type: 'knowledge_promotion',
              asserted_status: 'confirmed',
              evidence_refs: ['docs/solutions/missing.md'],
            },
          ],
        },
      });

      expect(supportedReview.overall).toBe('verified');
      expect(missingReview.overall).toBe('unsupported');
      expect(missingReview.claims[0].reason_code).toBe('evidence-ref-not-found');
      expect(missingImpact.overall).toBe('unsupported');
      expect(missingImpact.claims[0].reason_code).toBe('evidence-ref-not-found');
      expect(missingKnowledge.overall).toBe('unsupported');
      expect(missingKnowledge.claims[0].reason_code).toBe('evidence-ref-not-found');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('internal CLI validates closeout payloads', () => {
    const repo = makeRepo();
    try {
      const runSummaryRef = writeRunSummary(repo, 'cli-run');
      const inputPath = writeJson(path.join(repo, 'closeout.json'), {
        run_summary_ref: runSummaryRef,
        claims: [
          {
            claim_type: 'validation',
            asserted_status: 'passed',
            evidence_refs: ['verification-run-summary:typecheck'],
          },
        ],
      });
      const { code, stdout } = captureStdout(() => runInternal([
        'honest-closeout',
        'validate',
        '--input',
        inputPath,
        '--target-repo',
        repo,
        '--json',
      ]));
      const output = JSON.parse(stdout);

      expect(code).toBe(0);
      expect(output.overall).toBe('verified');
      expect(output.claims[0].verdict).toBe('consistent');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('internal CLI exits non-zero for malformed closeout payloads', () => {
    const repo = makeRepo();
    try {
      const inputPath = writeJson(path.join(repo, 'malformed-closeout.json'), {
        run_summary_ref: null,
      });
      const { code, stdout } = captureStdout(() => runInternal([
        'honest-closeout',
        'validate',
        '--input',
        inputPath,
        '--target-repo',
        repo,
        '--json',
      ]));
      const output = JSON.parse(stdout);

      expect(code).toBe(1);
      expect(output.status).toBe('rejected');
      expect(output.reason_code).toBe('payload-invalid');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });
});
