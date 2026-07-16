'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { runInternal } = require('../../src/cli/commands/internal');
const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const {
  readVerificationRunSummary,
  validateRunSummary,
  validateRunSummaryInput,
  writeVerificationRunSummary,
  ALLOWED_WORKFLOWS,
} = require('../../src/cli/helpers/verification-run-summary');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SCHEMA_PATH = path.join(REPO_ROOT, 'docs', 'contracts', 'verification', 'verification-run-summary.schema.json');

function makeRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'verification-run-summary-'));
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

function logRef(repo, runId, fileName, contents = 'ok\n', workflow = 'spec-work') {
  const workspaceSlug = slugify(path.basename(repo));
  const relativePath = path.join('.spec-first', 'workflows', workflow, workspaceSlug, runId, 'logs', fileName);
  const absolutePath = path.join(repo, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, contents);
  return relativePath;
}

function payload(repo, runId, overrides = {}, workflow = 'spec-work') {
  return {
    profile: {
      source: 'explicit',
      name: 'default',
      path: 'spec-first.verification.json',
    },
    checks: [
      {
        id: 'typecheck',
        service: 'spec-first',
        command: 'npm run typecheck',
        status: 'passed',
        exit_code: 0,
        ran: true,
        required_tools: ['node', 'npm'],
        missing_tools: [],
        log_path: logRef(repo, runId, 'typecheck.log', 'ok\n', workflow),
        reason_code: 'exit-code-zero',
        redaction_status: 'none-required',
      },
    ],
    ...overrides,
  };
}

function writePayload(repo, value, fileName = 'payload.json') {
  const filePath = path.join(repo, fileName);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
  return filePath;
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

describe('verification run summary contract and capture helper', () => {
  test('schema validates a captured summary sample', () => {
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
    const summary = {
      schema_version: 'verification-run-summary.v1',
      generated_at: '2026-06-04T00:00:00.000Z',
      profile: {
        source: 'explicit',
        name: 'default',
        path: 'spec-first.verification.json',
      },
      checks: [
        {
          id: 'typecheck',
          service: 'spec-first',
          command: 'npm run typecheck',
          status: 'passed',
          exit_code: 0,
          ran: true,
          required_tools: ['node', 'npm'],
          missing_tools: [],
          log_path: '.spec-first/workflows/spec-work/spec-first/run-1/logs/typecheck.log',
          reason_code: 'exit-code-zero',
          redaction_status: 'none-required',
        },
        {
          id: 'debug-repro',
          service: 'spec-first',
          command: 'npm run test:unit -- debug',
          status: 'passed',
          exit_code: 0,
          ran: true,
          required_tools: ['node', 'npm'],
          missing_tools: [],
          log_path: '.spec-first/workflows/spec-debug/spec-first/run-1/logs/debug-repro.log',
          reason_code: 'exit-code-zero',
          redaction_status: 'none-required',
        },
        {
          id: 'review-autofix',
          service: 'spec-first',
          command: 'npm run test:unit -- review',
          status: 'passed',
          exit_code: 0,
          ran: true,
          required_tools: ['node', 'npm'],
          missing_tools: [],
          log_path: '.spec-first/workflows/spec-code-review/spec-first/run-1/logs/review-autofix.log',
          reason_code: 'exit-code-zero',
          redaction_status: 'none-required',
        },
      ],
    };

    expect(validateAgainstSchema(schema, summary).errors).toEqual([]);
    expect(validateRunSummary(summary).errors).toEqual([]);
  });

  test('records passed checks and reads them through the internal CLI boundary', () => {
    const repo = makeRepo();
    try {
      const runId = 'run-1';
      const inputPath = writePayload(repo, payload(repo, runId));

      const { code, stdout } = captureStdout(() => runInternal([
        'verification-run-summary',
        'record',
        '--input',
        inputPath,
        '--run-id',
        runId,
        '--target-repo',
        repo,
        '--json',
      ]));
      const output = JSON.parse(stdout);

      expect(code).toBe(0);
      expect(output.status).toBe('written');
      expect(output.run_summary_ref).toMatch(/verification-run-summary\.json$/);

      const read = captureStdout(() => runInternal([
        'verification-run-summary',
        'read',
        '--target-repo',
        repo,
        '--run-summary-ref',
        output.run_summary_ref,
        '--json',
      ]));
      const readOutput = JSON.parse(read.stdout);
      expect(read.code).toBe(0);
      expect(readOutput.status).toBe('read');
      expect(readOutput.summary.checks[0].status).toBe('passed');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('records run summaries under explicit debug and review workflow scopes', () => {
    for (const workflow of ['spec-debug', 'spec-code-review']) {
      const repo = makeRepo();
      try {
        const runId = `run-${workflow}`;
        const inputPath = writePayload(repo, payload(repo, runId, {}, workflow));

        const result = writeVerificationRunSummary({
          inputPath,
          runId,
          targetRepo: repo,
          workflow,
        });

        expect(result.exitCode).toBe(0);
        expect(result.output.status).toBe('written');
        expect(result.output.run_summary_ref).toContain(`.spec-first/workflows/${workflow}/`);
        const read = readVerificationRunSummary({ targetRepo: repo, runSummaryRef: result.output.run_summary_ref });
        expect(read.output.summary.checks[0].log_path).toContain(`.spec-first/workflows/${workflow}/`);
      } finally {
        fs.rmSync(repo, { recursive: true, force: true });
      }
    }
  });

  test('accepts explicit workflow selection through the internal CLI boundary', () => {
    const repo = makeRepo();
    try {
      const runId = 'cli-workflow';
      const inputPath = writePayload(repo, payload(repo, runId, {}, 'spec-debug'), 'payload-cli.json');

      const { code, stdout } = captureStdout(() => runInternal([
        'verification-run-summary',
        'record',
        '--workflow',
        'spec-debug',
        '--input',
        inputPath,
        '--run-id',
        runId,
        '--target-repo',
        repo,
        '--json',
      ]));
      const output = JSON.parse(stdout);

      expect(code).toBe(0);
      expect(output.status).toBe('written');
      expect(output.run_summary_ref).toContain('.spec-first/workflows/spec-debug/');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('keeps dry-run and missing-tool checks as not-run with reason codes', () => {
    const repo = makeRepo();
    try {
      const runId = 'not-run';
      const dryRun = {
        id: 'smoke',
        service: 'spec-first',
        command: 'npm run test:smoke',
        status: 'not-run',
        exit_code: null,
        ran: false,
        required_tools: ['node', 'npm'],
        missing_tools: [],
        log_path: null,
        reason_code: 'schedulable',
        redaction_status: 'none-required',
      };
      const missingTool = {
        ...dryRun,
        id: 'integration',
        command: 'npm run test:integration',
        missing_tools: ['npm'],
        reason_code: 'missing_dependency',
      };
      const validation = validateRunSummaryInput({
        ...payload(repo, runId, { checks: [dryRun, missingTool] }),
      }, { targetRepoRoot: repo, workspaceSlug: slugify(path.basename(repo)), runId });

      expect(validation.errors).toEqual([]);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('rejects schedulable or missing-dependency checks that claim passed', () => {
    const repo = makeRepo();
    try {
      const runId = 'contradictory-status';
      const schedulablePassed = payload(repo, runId);
      schedulablePassed.checks[0] = {
        ...schedulablePassed.checks[0],
        reason_code: 'schedulable',
      };
      const missingDependencyPassed = payload(repo, runId);
      missingDependencyPassed.checks[0] = {
        ...missingDependencyPassed.checks[0],
        missing_tools: ['definitely-missing-verifier'],
        reason_code: 'missing_dependency',
      };

      const context = { targetRepoRoot: repo, workspaceSlug: slugify(path.basename(repo)), runId };

      expect(validateRunSummaryInput(schedulablePassed, context).errors).toEqual(expect.arrayContaining([
        'checks[0].status must be not-run when reason_code is schedulable',
        'checks[0].ran must be false when reason_code is schedulable',
        'checks[0].exit_code must be null when reason_code is schedulable',
      ]));
      expect(validateRunSummaryInput(missingDependencyPassed, context).errors).toEqual(expect.arrayContaining([
        'checks[0].status must be not-run when missing dependencies are recorded',
        'checks[0].ran must be false when missing dependencies are recorded',
        'checks[0].exit_code must be null when missing dependencies are recorded',
      ]));
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('records failed checks with non-zero exit codes', () => {
    const repo = makeRepo();
    try {
      const runId = 'failed-run';
      const failedPayload = payload(repo, runId);
      failedPayload.checks[0] = {
        ...failedPayload.checks[0],
        status: 'failed',
        exit_code: 1,
        reason_code: 'exit-code-nonzero',
      };
      const inputPath = writePayload(repo, failedPayload);

      const result = writeVerificationRunSummary({ inputPath, runId, targetRepo: repo });

      expect(result.exitCode).toBe(0);
      expect(result.output.status).toBe('written');
      const read = readVerificationRunSummary({ targetRepo: repo, runSummaryRef: result.output.run_summary_ref });
      expect(read.output.summary.checks[0].status).toBe('failed');
      expect(read.output.summary.checks[0].exit_code).toBe(1);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('rejects attempts to infer exit codes or promote dry-runs to passed', () => {
    const repo = makeRepo();
    try {
      const runId = 'invalid';
      const promotedDryRun = payload(repo, runId);
      promotedDryRun.checks[0] = {
        ...promotedDryRun.checks[0],
        status: 'passed',
        ran: false,
        exit_code: null,
        log_path: null,
      };

      const validation = validateRunSummaryInput(promotedDryRun, {
        targetRepoRoot: repo,
        workspaceSlug: slugify(path.basename(repo)),
        runId,
      });

      expect(validation.errors).toEqual(expect.arrayContaining([
        'checks[0].ran must be true when status is passed',
        'checks[0].exit_code must be 0 when status is passed',
      ]));
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('rejects non-redacted secret-like log content and out-of-run log paths', () => {
    const repo = makeRepo();
    try {
      const runId = 'secret-log';
      const secretPayload = payload(repo, runId);
      secretPayload.checks[0].log_path = logRef(repo, runId, 'secret.log', 'Authorization: Bearer abc123\n');
      const outsideLogPayload = payload(repo, runId);
      outsideLogPayload.checks[0].log_path = '.spec-first/workflows/spec-work/other-workspace/run-1/logs/typecheck.log';

      const context = { targetRepoRoot: repo, workspaceSlug: slugify(path.basename(repo)), runId };
      expect(validateRunSummaryInput(secretPayload, context).errors).toContain(
        'checks[0].log_path contains secret-like content: secret-like-value'
      );
      expect(validateRunSummaryInput(outsideLogPayload, context).errors).toContain(
        `checks[0].log_path must stay under .spec-first/workflows/spec-work/${slugify(path.basename(repo))}/${runId}/logs/`
      );

      // fail-closed:自报 redaction_status=redacted 不再豁免扫描;残留 secret 仍被拒绝。
      const claimedRedactedPayload = payload(repo, runId);
      claimedRedactedPayload.checks[0].redaction_status = 'redacted';
      claimedRedactedPayload.checks[0].log_path = logRef(repo, runId, 'claimed-redacted.log', 'Authorization: Bearer abc123\n');
      expect(validateRunSummaryInput(claimedRedactedPayload, context).errors).toContain(
        'checks[0].log_path contains secret-like content: secret-like-value'
      );
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('does not overwrite an existing run summary', () => {
    const repo = makeRepo();
    try {
      const runId = 'same-run';
      const inputPath = writePayload(repo, payload(repo, runId));
      const first = writeVerificationRunSummary({ inputPath, runId, targetRepo: repo });
      const second = writeVerificationRunSummary({ inputPath, runId, targetRepo: repo });

      expect(first.exitCode).toBe(0);
      expect(first.output.status).toBe('written');
      expect(second.exitCode).toBe(0);
      expect(second.output.status).toBe('not-written');
      expect(second.output.reason_code).toBe('run-summary-already-exists');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('rejects unsupported workflow names for recording and log validation', () => {
    const repo = makeRepo();
    try {
      const runId = 'bad-workflow';
      const inputPath = writePayload(repo, payload(repo, runId));
      const result = writeVerificationRunSummary({
        inputPath,
        runId,
        targetRepo: repo,
        workflow: 'spec-review',
      });

      expect(result.exitCode).toBe(1);
      expect(result.output.status).toBe('rejected');
      expect(result.output.reason_code).toBe('invalid-workflow');

      const validation = validateRunSummaryInput(payload(repo, runId), {
        targetRepoRoot: repo,
        workflow: 'spec-review',
        workspaceSlug: slugify(path.basename(repo)),
        runId,
      });
      expect(validation.errors).toContain(
        'checks[0].log_path workflow must be one of: spec-work, spec-debug, spec-code-review'
      );
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  // 防双真相源漂移:ALLOWED_WORKFLOWS(写侧 + log_path 前缀校验)与 schema log_path
  // pattern 的 workflow 备选列表必须完全一致。单边新增/拼错任一,会在运行时写入阶段
  // 以泛化 anyOf 报错失败,而非被此 test 提前抓住。
  it('keeps ALLOWED_WORKFLOWS in sync with the schema log_path workflow alternation', () => {
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
    const logPathPattern = schema.properties.checks.items.properties.log_path.anyOf
      .map((entry) => entry.pattern)
      .find((pattern) => typeof pattern === 'string' && pattern.includes('workflows/'));
    expect(logPathPattern).toBeTruthy();

    const alternation = /workflows\/\(([^)]+)\)\//.exec(logPathPattern);
    expect(alternation).toBeTruthy();
    const schemaWorkflows = alternation[1].split('|').sort();
    const helperWorkflows = Array.from(ALLOWED_WORKFLOWS).sort();
    expect(schemaWorkflows).toEqual(helperWorkflows);
  });
});
