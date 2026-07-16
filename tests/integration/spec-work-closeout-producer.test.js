'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { runInternal } = require('../../src/cli/commands/internal');
const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const { writeVerificationRunSummary } = require('../../src/cli/helpers/verification-run-summary');

const REPO_ROOT = path.join(__dirname, '..', '..');
const FIXTURE_DIR = path.join(REPO_ROOT, 'tests', 'fixtures', 'spec-work-closeout', 'trigger-task-pack');
const SCHEMA_PATH = path.join(REPO_ROOT, 'docs', 'contracts', 'workflows', 'spec-work-run-artifact.schema.json');

function makeRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-work-closeout-producer-'));
  execFileSync('git', ['init', '-q'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'Spec First Test'], { cwd: repo });
  execFileSync('git', ['config', 'user.email', 'spec-first-test@example.invalid'], { cwd: repo });
  execFileSync('git', ['config', 'core.hooksPath', '/dev/null'], { cwd: repo });
  return repo;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
  return filePath;
}

function slugify(value) {
  return String(value || 'workspace')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'workspace';
}

function logRef(repo, runId) {
  const relativePath = path.join('.spec-first', 'workflows', 'spec-work', slugify(path.basename(repo)), runId, 'logs', 'typecheck.log');
  const absolutePath = path.join(repo, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, 'ok\n');
  return relativePath;
}

function writeRunSummary(repo, runId) {
  const inputPath = writeJson(path.join(repo, `${runId}-summary-input.json`), {
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
        log_path: logRef(repo, runId),
        reason_code: 'exit-code-zero',
        redaction_status: 'none-required',
      },
    ],
  });
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

describe('spec-work closeout producer integration', () => {
  test('trigger-task-pack closeout payload writes workflow-integrated run evidence', () => {
    const repo = makeRepo();
    try {
      const runId = 'trigger-task-pack';
      const payload = readJson(path.join(FIXTURE_DIR, 'payload.json'));
      payload.script_confirmed.validation.run_summary_ref = writeRunSummary(repo, runId);
      const inputPath = writeJson(path.join(repo, 'closeout-payload.json'), payload);
      const expected = readJson(path.join(FIXTURE_DIR, 'expected.json'));
      const schema = readJson(SCHEMA_PATH);

      const { code, stdout } = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'write',
        '--input',
        inputPath,
        '--run-id',
        runId,
        '--target-repo',
        repo,
      ]));
      const output = JSON.parse(stdout);

      expect(code).toBe(0);
      expect(output).toEqual(expect.objectContaining({
        status: expected.status,
        schema_version: expected.schema_version,
        producer_available: true,
        workflow_integrated: true,
      }));
      expect(output.artifact_path).toMatch(/^\.spec-first\/workflows\/spec-work\/spec-work-closeout-producer-[a-z0-9]+\/trigger-task-pack\/run\.json$/);

      const artifact = readJson(path.join(repo, output.artifact_path));
      expect(artifact.producer).toEqual(expected.producer);
      expect(artifact.plan_path).toBe(expected.plan_path);
      expect(artifact.task_pack_path).toBe(expected.task_pack_path);
      expect(validateAgainstSchema(schema, artifact).errors).toEqual([]);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });
});
