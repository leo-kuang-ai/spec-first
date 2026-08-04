'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { runInternal } = require('../../src/cli/commands/internal');
const { validateAgainstSchema } = require('../../src/contracts/schema-validator');
const {
  pruneSpecWorkRunArtifacts,
  readSpecWorkRunArtifact,
  readSpecWorkRunState,
  validatePayload,
  writeSpecWorkRunArtifact,
  writeSpecWorkRunState,
} = require('../../src/cli/helpers/spec-work-run-artifact');
const { writeVerificationRunSummary } = require('../../src/cli/helpers/verification-run-summary');

const SCHEMA_PATH = path.join(__dirname, '..', '..', 'docs', 'contracts', 'workflows', 'spec-work-run-artifact.schema.json');

function makeRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-work-run-artifact-'));
  execFileSync('git', ['init', '-q'], { cwd: repo });
  execFileSync('git', ['config', 'user.name', 'Spec First Test'], { cwd: repo });
  execFileSync('git', ['config', 'user.email', 'spec-first-test@example.invalid'], { cwd: repo });
  execFileSync('git', ['config', 'core.hooksPath', '/dev/null'], { cwd: repo });
  return repo;
}

function slugify(value) {
  return String(value || 'workspace')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'workspace';
}

function validPayload(overrides = {}, options = {}) {
  const workspaceSlug = options.workspaceSlug || 'spec-first';
  const runId = options.runId || 'run-1';
  return {
    schema_version: 'spec-work-run-artifact-payload/v2',
    workflow: 'spec-work',
    mode: 'interactive',
    plan_path: 'docs/plans/example-plan.md',
    plan_source: 'explicit',
    task_pack_path: 'docs/tasks/example-tasks.md',
    source_refs: ['docs/plans/example-plan.md', 'docs/tasks/example-tasks.md'],
    script_confirmed: {
      validation: {
        status: 'passed',
        reason_code: 'run-summary-recorded',
        run_summary_ref: path.join('.spec-first', 'workflows', 'spec-work', workspaceSlug, runId, 'verification-run-summary.json'),
      },
      changed_files: ['src/cli/helpers/spec-work-run-artifact.js'],
      artifact_refs: [path.join('.spec-first', 'workflows', 'spec-work', workspaceSlug, runId, 'run.json')],
      raw_log_ref: {
        kind: 'none',
        display_ref: '',
        secret_stripped: true,
        redaction_status: 'none-required',
        retention_status: 'lifecycle-deferred',
        access_boundary: 'none',
        reason_code: 'no-raw-log',
      },
      resume_evidence: {
        status: 'not-run',
        reason_code: 'first-write',
      },
    },
    llm_asserted: {
      summary: 'Work completed.',
      read_artifacts: ['docs/plans/example-plan.md'],
      key_decisions: ['Keep workflow integration separate from producer availability.'],
      deferred_follow_up: ['Retention lifecycle remains Phase 3.'],
      next_action: 'Run review.',
    },
    provider_untrusted: {
      readiness_status: 'degraded',
      summaries: ['external-tool evidence was limited and not used as confirmed truth'],
    },
    retention: {
      retention_status: 'lifecycle-deferred',
      artifact_category: 'spec-work-run-evidence',
      raw_log_retention_impact: 'none',
      redaction_status: 'none-required',
    },
    ...overrides,
  };
}

function validPayloadForRun(repo, runId, overrides = {}) {
  return validPayload(overrides, {
    workspaceSlug: slugify(path.basename(repo)),
    runId,
  });
}

function logRef(repo, runId, fileName = 'typecheck.log') {
  const relativePath = path.join('.spec-first', 'workflows', 'spec-work', slugify(path.basename(repo)), runId, 'logs', fileName);
  const absolutePath = path.join(repo, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, 'ok\n');
  return relativePath;
}

function runSummaryPayload(repo, runId, checkOverrides = {}) {
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
        log_path: logRef(repo, runId),
        reason_code: 'exit-code-zero',
        redaction_status: 'none-required',
        ...checkOverrides,
      },
    ],
  };
}

function writeRunSummary(repo, runId, checkOverrides = {}) {
  const inputPath = writePayload(repo, runSummaryPayload(repo, runId, checkOverrides), `${runId}-summary-input.json`);
  const result = writeVerificationRunSummary({ inputPath, runId, targetRepo: repo });
  expect(result.exitCode).toBe(0);
  return result.output.run_summary_ref;
}

function validV1Artifact({ workspaceSlug = 'spec-first', runId = 'legacy-run', expiresAt = '2999-01-01T00:00:00.000Z' } = {}) {
  return {
    schema_version: 'spec-work-run-artifact/v1',
    generated_at: '2026-05-17T00:00:00.000Z',
    workflow: 'spec-work',
    run_id: runId,
    mode: 'interactive',
    workspace_slug: workspaceSlug,
    producer: {
      producer_available: true,
      workflow_integrated: false,
      reason_code: 'producer-write-side-only',
    },
    plan_path: 'docs/plans/example-plan.md',
    plan_source: 'explicit',
    task_pack_path: null,
    source_refs: ['docs/plans/example-plan.md'],
    script_confirmed: {
      validation: {
        status: 'passed',
        commands: [
          {
            command: 'npm run test:unit',
            exit_code: 0,
            summary: 'legacy validation command summary',
          },
        ],
      },
      changed_files: ['src/cli/helpers/spec-work-run-artifact.js'],
      artifact_refs: ['.spec-first/workflows/spec-work/spec-first/legacy-run/run.json'],
      raw_log_ref: {
        kind: 'none',
        display_ref: '',
        secret_stripped: true,
        redaction_status: 'none-required',
        retention_status: 'lifecycle-deferred',
        access_boundary: 'none',
        reason_code: 'no-raw-log',
      },
      resume_evidence: {
        status: 'not-run',
        reason_code: 'first-write',
      },
    },
    llm_asserted: {
      summary: 'Legacy v1 artifact.',
      read_artifacts: ['docs/plans/example-plan.md'],
      key_decisions: ['Read/prune remains compatible with v1.'],
      deferred_follow_up: [],
      next_action: 'None.',
    },
    provider_untrusted: {
      readiness_status: 'unknown',
      summaries: [],
    },
    retention: {
      retention_status: 'lifecycle-deferred',
      artifact_category: 'spec-work-run-evidence',
      raw_log_retention_impact: 'none',
      redaction_status: 'none-required',
      owner: 'spec-work',
      expires_at: expiresAt,
    },
    artifact_path: path.join('.spec-first', 'workflows', 'spec-work', workspaceSlug, runId, 'run.json'),
    warnings: [],
  };
}

function validDirectEvidenceUsed() {
  return {
    source_refs: ['skills/spec-work/SKILL.md'],
    checks_or_logs: ['npm run test:unit -- spec-work-run-artifact'],
    repo_scope: 'spec-first',
    limitations: ['bounded direct evidence only'],
    redaction_status: 'none-required',
  };
}

function validGraphEvidenceUsed() {
  return {
    capabilities_used: ['CodeGraph context'],
    evidence_grade: 'session-local',
    evidence_posture: 'fallback',
    freshness_state: 'fresh',
    repo_scope: 'spec-first',
    graph_findings_applied: ['validated direct source read selection'],
    graph_findings_as_risk_only: [],
    source_reads_validated: ['src/cli/helpers/spec-work-run-artifact.js'],
    redaction_status: 'none-required',
  };
}

function writePayload(repo, payload, fileName = 'payload.json') {
  const filePath = path.join(repo, fileName);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
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

describe('spec-work run artifact producer', () => {
  test('writes a schema-aligned run artifact through the internal CLI boundary', () => {
    const repo = makeRepo();
    try {
      writeRunSummary(repo, 'run-1');
      const inputPath = writePayload(repo, validPayloadForRun(repo, 'run-1'));

      const { code, stdout } = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'write',
        '--input',
        inputPath,
        '--run-id',
        'run-1',
        '--target-repo',
        repo,
      ]));
      const output = JSON.parse(stdout);

      expect(code).toBe(0);
      expect(output).toEqual(expect.objectContaining({
        status: 'written',
        reason_code: 'written',
        schema_version: 'spec-work-run-artifact/v2',
        producer_available: true,
        workflow_integrated: false,
      }));
      expect(output.artifact_path).toMatch(/^\.spec-first\/workflows\/spec-work\/spec-work-run-artifact-[a-z0-9]+\/run-1\/run\.json$/);
      const artifact = JSON.parse(fs.readFileSync(path.join(repo, output.artifact_path), 'utf8'));
      expect(artifact.producer).toEqual({
        producer_available: true,
        workflow_integrated: false,
        reason_code: 'producer-write-side-only',
      });
      expect(artifact.retention.retention_status).toBe('lifecycle-deferred');
      expect(artifact.retention.owner).toBe('spec-work');
      expect(Date.parse(artifact.retention.expires_at)).not.toBeNaN();
      const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
      expect(validateAgainstSchema(schema, artifact).errors).toEqual([]);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('writes workflow-integrated producer metadata when closeout supplies a durable trigger', () => {
    const repo = makeRepo();
    try {
      writeRunSummary(repo, 'run-integrated');
      const inputPath = writePayload(repo, validPayloadForRun(repo, 'run-integrated', {
        producer: {
          workflow_integrated: true,
          reason_code: 'trigger-task-pack',
        },
      }));

      const { code, stdout } = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'write',
        '--input',
        inputPath,
        '--run-id',
        'run-integrated',
        '--target-repo',
        repo,
      ]));
      const output = JSON.parse(stdout);

      expect(code).toBe(0);
      expect(output).toEqual(expect.objectContaining({
        status: 'written',
        producer_available: true,
        workflow_integrated: true,
      }));
      const artifact = JSON.parse(fs.readFileSync(path.join(repo, output.artifact_path), 'utf8'));
      expect(artifact.producer).toEqual({
        producer_available: true,
        workflow_integrated: true,
        reason_code: 'trigger-task-pack',
      });
      const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
      expect(validateAgainstSchema(schema, artifact).errors).toEqual([]);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('rejects producer metadata that crosses workflow integration boundaries', () => {
    const integratedWithoutTrigger = validatePayload(validPayload({
      producer: {
        workflow_integrated: true,
        reason_code: 'producer-write-side-only',
      },
    }));
    const skippedButIntegrated = validatePayload(validPayload({
      producer: {
        workflow_integrated: true,
        reason_code: 'no-trigger-matched',
      },
    }));
    const triggerWithoutIntegration = validatePayload(validPayload({
      producer: {
        workflow_integrated: false,
        reason_code: 'trigger-task-pack',
      },
    }));

    expect(integratedWithoutTrigger.errors).toContain(
      'producer.reason_code must be a durable trigger when producer.workflow_integrated is true'
    );
    expect(skippedButIntegrated.errors).toContain(
      'producer.reason_code must be a durable trigger when producer.workflow_integrated is true'
    );
    expect(triggerWithoutIntegration.errors).toContain(
      'producer.reason_code must be non-integrated when producer.workflow_integrated is false'
    );
  });

  test('does not overwrite an existing run artifact for the same run id', () => {
    const repo = makeRepo();
    try {
      writeRunSummary(repo, 'same-run');
      const firstPayload = validPayloadForRun(repo, 'same-run');
      const secondPayload = validPayloadForRun(repo, 'same-run', {
        llm_asserted: {
          ...validPayloadForRun(repo, 'same-run').llm_asserted,
          summary: 'Second write should not replace the first artifact.',
        },
      });
      const firstPath = writePayload(repo, firstPayload, 'first.json');
      const secondPath = writePayload(repo, secondPayload, 'second.json');

      const first = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'write',
        '--input',
        firstPath,
        '--run-id',
        'same-run',
        '--target-repo',
        repo,
      ]));
      const firstOutput = JSON.parse(first.stdout);
      const artifactFile = path.join(repo, firstOutput.artifact_path);
      const artifactBefore = fs.readFileSync(artifactFile, 'utf8');

      const second = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'write',
        '--input',
        secondPath,
        '--run-id',
        'same-run',
        '--target-repo',
        repo,
      ]));
      const secondOutput = JSON.parse(second.stdout);

      expect(first.code).toBe(0);
      expect(second.code).toBe(0);
      expect(secondOutput).toEqual(expect.objectContaining({
        status: 'not-written',
        reason_code: 'artifact-already-exists',
        artifact_path: firstOutput.artifact_path,
        schema_version: 'spec-work-run-artifact/v2',
      }));
      expect(fs.readFileSync(artifactFile, 'utf8')).toBe(artifactBefore);
      const artifact = JSON.parse(artifactBefore);
      expect(artifact.llm_asserted.summary).toBe(firstPayload.llm_asserted.summary);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('writes compact direct_evidence_used when provided and remains backward compatible when omitted', () => {
    const repo = makeRepo();
    try {
      writeRunSummary(repo, 'run-with-direct');
      writeRunSummary(repo, 'run-without-direct');
      const withDirectPath = writePayload(repo, validPayloadForRun(repo, 'run-with-direct', {
        direct_evidence_used: validDirectEvidenceUsed(),
      }), 'with-direct.json');
      const withoutDirectPath = writePayload(repo, validPayloadForRun(repo, 'run-without-direct'), 'without-direct.json');

      const withDirect = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'write',
        '--input',
        withDirectPath,
        '--run-id',
        'run-with-direct',
        '--target-repo',
        repo,
      ]));
      const withDirectOutput = JSON.parse(withDirect.stdout);
      expect(withDirect.code).toBe(0);
      const withDirectArtifact = JSON.parse(fs.readFileSync(path.join(repo, withDirectOutput.artifact_path), 'utf8'));
      expect(withDirectArtifact.direct_evidence_used).toEqual(validDirectEvidenceUsed());

      const withoutDirect = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'write',
        '--input',
        withoutDirectPath,
        '--run-id',
        'run-without-direct',
        '--target-repo',
        repo,
      ]));
      const withoutDirectOutput = JSON.parse(withoutDirect.stdout);
      expect(withoutDirect.code).toBe(0);
      const withoutDirectArtifact = JSON.parse(fs.readFileSync(path.join(repo, withoutDirectOutput.artifact_path), 'utf8'));
      expect(Object.prototype.hasOwnProperty.call(withoutDirectArtifact, 'direct_evidence_used')).toBe(false);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('direct writer returns not-written for missing target repo without throwing', () => {
    const repo = makeRepo();
    const missingRepo = path.join(repo, 'missing');
    try {
      const inputPath = writePayload(repo, validPayload());
      const result = writeSpecWorkRunArtifact({
        inputPath,
        runId: 'run-1',
        targetRepo: missingRepo,
      });

      expect(result.exitCode).toBe(0);
      expect(result.output.status).toBe('not-written');
      expect(result.output.reason_code).toBe('target-repo-not-found');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('direct helpers reject non-Git target directories', () => {
    const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-work-run-artifact-nongit-'));
    try {
      const inputPath = writePayload(repo, validPayload());
      const write = writeSpecWorkRunArtifact({
        inputPath,
        runId: 'run-1',
        targetRepo: repo,
      });
      const read = readSpecWorkRunArtifact({ targetRepo: repo });
      const prune = pruneSpecWorkRunArtifacts({ targetRepo: repo, retentionDays: 1, dryRun: true });

      for (const result of [write, read, prune]) {
        expect(result.exitCode).toBe(0);
        expect(result.output.status).toBe('not-written');
        expect(result.output.reason_code).toBe('target-repo-not-found');
        expect(result.output.errors.join('\n')).toContain('target repo must be a Git repository root');
      }
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('direct helpers reject omitted target repo instead of falling back to cwd', () => {
    const repo = makeRepo();
    const originalCwd = process.cwd();
    try {
      const inputPath = writePayload(repo, validPayload());
      process.chdir(repo);

      const write = writeSpecWorkRunArtifact({
        inputPath,
        runId: 'run-1',
      });
      const read = readSpecWorkRunArtifact({});
      const prune = pruneSpecWorkRunArtifacts({ retentionDays: 1, dryRun: true });

      for (const result of [write, read, prune]) {
        expect(result.exitCode).toBe(0);
        expect(result.output.status).toBe('not-written');
        expect(result.output.reason_code).toBe('target-repo-not-found');
        expect(result.output.errors).toContain('target repo is required');
      }
      expect(fs.existsSync(path.join(repo, '.spec-first'))).toBe(false);
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('direct read helper rejects unsafe selectors before resolving paths', () => {
    const repo = makeRepo();
    try {
      const mismatched = readSpecWorkRunArtifact({
        targetRepo: repo,
        workspaceSlug: 'workspace-a',
      });
      const unsafe = readSpecWorkRunArtifact({
        targetRepo: repo,
        workspaceSlug: '..',
        runId: 'run-a',
      });

      expect(mismatched.exitCode).toBe(1);
      expect(mismatched.output.status).toBe('rejected');
      expect(mismatched.output.reason_code).toBe('invalid-arguments');
      expect(mismatched.output.errors).toContain('workspaceSlug and runId must be provided together');
      expect(unsafe.exitCode).toBe(1);
      expect(unsafe.output.status).toBe('rejected');
      expect(unsafe.output.reason_code).toBe('invalid-arguments');
      expect(unsafe.output.errors).toContain('workspaceSlug must be a stable safe identifier');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('rejects generated runtime mirrors, non-workflow runtime artifacts, absolute paths, raw output, and secrets', () => {
    const oversizedLog = Array.from({ length: 1000 }, (_, index) => `line ${index}`).join('\n');
    const badPayloads = [
      validPayload({ plan_source: 'bogus' }),
      validPayload({ plan_path: '.spec-first/workflows/spec-work/spec-first/run-1/run.json' }),
      validPayload({ source_refs: ['.agents/skills/spec-work/SKILL.md'] }),
      validPayload({ source_refs: ['.spec-first/workflows/spec-work/spec-first/run-1/run.json'] }),
      validPayload({ source_refs: ['.env'] }),
      validPayload({ source_refs: ['.git/config'] }),
      validPayload({
        script_confirmed: {
          ...validPayload().script_confirmed,
          changed_files: ['.spec-first/workflows/spec-work/spec-first/run-1/run.json'],
        },
      }),
      validPayload({
        script_confirmed: {
          ...validPayload().script_confirmed,
          changed_files: ['secrets/serviceAccount.json'],
        },
      }),
      validPayload({
        script_confirmed: {
          ...validPayload().script_confirmed,
          artifact_refs: ['.spec-first/config/tool-facts.json'],
        },
      }),
      validPayload({ llm_asserted: { ...validPayload().llm_asserted, summary: '/var/folders/raw/path' } }),
      validPayload({ provider_untrusted: { ...validPayload().provider_untrusted, raw_output: 'external tool raw text' } }),
      validPayload({ provider_untrusted: { ...validPayload().provider_untrusted, details: oversizedLog } }),
      validPayload({ provider_untrusted: { ...validPayload().provider_untrusted, nested: { transcript: oversizedLog } } }),
      validPayload({ provider_untrusted: { ...validPayload().provider_untrusted, summaries: Array.from({ length: 21 }, (_, index) => `summary ${index}`) } }),
      validPayload({ direct_evidence_used: { ...validDirectEvidenceUsed(), provider_raw_output: 'external tool raw text' } }),
      validPayload({ direct_evidence_used: { ...validDirectEvidenceUsed(), redaction_status: undefined } }),
      validPayload({ direct_evidence_used: { ...validDirectEvidenceUsed(), checks_or_logs: 'npm test' } }),
      validPayload({ producer: { workflow_integrated: true, reason_code: 'unknown-trigger' } }),
      validPayload({ producer: { workflow_integrated: 'true', reason_code: 'trigger-task-pack' } }),
      validPayload({ direct_evidence_used: { ...validDirectEvidenceUsed(), source_refs: Array.from({ length: 21 }, (_, index) => `source-${index}`) } }),
      validPayload({ provider_untrusted: { ...validPayload().provider_untrusted, summaries: ['Authorization: Bearer secret-token'] } }),
      validPayload({ llm_asserted: { ...validPayload().llm_asserted, summary: 'https://example.com/log?token=abc123' } }),
      validPayload({ llm_asserted: { ...validPayload().llm_asserted, summary: oversizedLog } }),
      validPayload({ llm_asserted: { ...validPayload().llm_asserted, key_decisions: [oversizedLog] } }),
      validPayload({ llm_asserted: { ...validPayload().llm_asserted, raw_log_dump: oversizedLog } }),
      validPayload({ unexpected_root_field: true }),
      validPayload({
        script_confirmed: {
          ...validPayload().script_confirmed,
          unexpected_script_field: true,
        },
      }),
      validPayload({
        script_confirmed: {
          ...validPayload().script_confirmed,
          tool_output: oversizedLog,
        },
      }),
      validPayload({
        script_confirmed: {
          ...validPayload().script_confirmed,
          validation: {
            ...validPayload().script_confirmed.validation,
            transcript: oversizedLog,
          },
        },
      }),
      validPayload({
        script_confirmed: {
          ...validPayload().script_confirmed,
          validation: {
            ...validPayload().script_confirmed.validation,
            commands: [
              {
                command: 'npm run test:unit',
                exit_code: 0,
                summary: 'legacy command detail should be rejected in v2',
                messages: oversizedLog,
              },
            ],
          },
        },
      }),
      validPayload({
        script_confirmed: {
          ...validPayload().script_confirmed,
          resume_evidence: {
            ...validPayload().script_confirmed.resume_evidence,
            raw_messages: oversizedLog,
          },
        },
      }),
      validPayload({
        script_confirmed: {
          ...validPayload().script_confirmed,
          raw_log_ref: {
            ...validPayload().script_confirmed.raw_log_ref,
            unexpected_raw_log_field: true,
          },
        },
      }),
      validPayload({
        retention: {
          ...validPayload().retention,
          unexpected_retention_field: true,
        },
      }),
      validPayload({
        retention: {
          ...validPayload().retention,
          expires_at: 123,
        },
      }),
    ];

    for (const payload of badPayloads) {
      const validation = validatePayload(payload);
      expect(validation.errors.length).toBeGreaterThan(0);
    }
  });

  test('allows workflow artifact refs only in artifact-reference fields', () => {
    const payload = validPayload({
      script_confirmed: {
        ...validPayload().script_confirmed,
        artifact_refs: ['.spec-first/workflows/spec-work/spec-first/run-1/run.json'],
      },
      llm_asserted: {
        ...validPayload().llm_asserted,
        read_artifacts: ['.spec-first/workflows/spec-work/spec-first/run-1/run.json'],
      },
    });

    expect(validatePayload(payload).errors).toEqual([]);
  });

  test('requires reason codes, run-summary refs, and resume evidence reason codes', () => {
    const payload = validPayload({
      script_confirmed: {
        ...validPayload().script_confirmed,
        validation: {
          status: 'not-run',
          run_summary_ref: '.spec-first/workflows/spec-work/spec-first/run-1/verification-run-summary.json',
        },
        resume_evidence: {
          status: 'not-found',
        },
      },
    });

    const validation = validatePayload(payload);

    expect(validation.errors).toEqual(expect.arrayContaining([
      'script_confirmed.validation.reason_code is required',
      'resume_evidence.reason_code is required when status is not read',
    ]));
  });

  test('rejects v2 payloads that keep legacy validation commands or omit run summary refs', () => {
    const withCommands = validatePayload(validPayload({
      script_confirmed: {
        ...validPayload().script_confirmed,
        validation: {
          ...validPayload().script_confirmed.validation,
          commands: [
            {
              command: 'npm run test:unit',
              exit_code: 0,
              summary: 'legacy command detail',
            },
          ],
        },
      },
    }));
    const withoutRunSummary = validatePayload(validPayload({
      script_confirmed: {
        ...validPayload().script_confirmed,
        validation: {
          status: 'passed',
          reason_code: 'run-summary-recorded',
        },
      },
    }));

    expect(withCommands.errors).toContain('script_confirmed.validation.commands is not allowed');
    expect(withoutRunSummary.errors).toContain('script_confirmed.validation.run_summary_ref must be a concrete repo-relative path');
  });

  test('writer rejects dangling or status-mismatched validation run summary refs', () => {
    const repo = makeRepo();
    try {
      const danglingInput = writePayload(repo, validPayloadForRun(repo, 'missing-summary'), 'dangling.json');
      const dangling = writeSpecWorkRunArtifact({
        inputPath: danglingInput,
        runId: 'missing-summary',
        targetRepo: repo,
      });

      writeRunSummary(repo, 'failed-summary', {
        status: 'failed',
        exit_code: 1,
        reason_code: 'exit-code-nonzero',
      });
      const mismatchInput = writePayload(repo, validPayloadForRun(repo, 'failed-summary'), 'mismatch.json');
      const mismatch = writeSpecWorkRunArtifact({
        inputPath: mismatchInput,
        runId: 'failed-summary',
        targetRepo: repo,
      });

      expect(dangling.exitCode).toBe(1);
      expect(dangling.output.status).toBe('rejected');
      expect(dangling.output.reason_code).toBe('validation-run-summary-not-readable');
      expect(mismatch.exitCode).toBe(1);
      expect(mismatch.output.status).toBe('rejected');
      expect(mismatch.output.reason_code).toBe('validation-run-summary-status-mismatch');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('reads the latest artifact when run ids are omitted and specific run ids when provided', () => {
    const repo = makeRepo();
    try {
      writeRunSummary(repo, 'run-a');
      writeRunSummary(repo, 'run-b');
      const firstPayloadPath = writePayload(repo, validPayloadForRun(repo, 'run-a', {
        retention: {
          retention_status: 'lifecycle-deferred',
          artifact_category: 'spec-work-run-evidence',
          raw_log_retention_impact: 'none',
          redaction_status: 'none-required',
          owner: 'owner-a',
          expires_at: '2026-05-15T00:00:00.000Z',
        },
      }), 'payload-a.json');
      const secondPayloadPath = writePayload(repo, validPayloadForRun(repo, 'run-b', {
        retention: {
          retention_status: 'lifecycle-deferred',
          artifact_category: 'spec-work-run-evidence',
          raw_log_retention_impact: 'none',
          redaction_status: 'none-required',
          owner: 'owner-b',
          expires_at: '2026-05-25T00:00:00.000Z',
        },
      }), 'payload-b.json');

      captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'write',
        '--input',
        firstPayloadPath,
        '--run-id',
        'run-a',
        '--target-repo',
        repo,
      ]));
      const second = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'write',
        '--input',
        secondPayloadPath,
        '--run-id',
        'run-b',
        '--target-repo',
        repo,
      ]));
      expect(second.code).toBe(0);

      const readLatest = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'read',
        '--target-repo',
        repo,
        '--json',
      ]));
      const latestPayload = JSON.parse(readLatest.stdout);
      expect(readLatest.code).toBe(0);
      expect(latestPayload.status).toBe('read');
      expect(latestPayload.artifact.producer.reason_code).toBe('producer-write-side-only');
      expect(latestPayload.artifact.retention.owner).toBe('owner-b');

      const readSpecific = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'read',
        '--target-repo',
        repo,
        '--workspace-slug',
        path.basename(repo),
        '--run-id',
        'run-a',
        '--json',
      ]));
      const specificPayload = JSON.parse(readSpecific.stdout);
      expect(readSpecific.code).toBe(0);
      expect(specificPayload.status).toBe('read');
      expect(specificPayload.artifact.retention.owner).toBe('owner-a');
      expect(specificPayload.artifact_path).toMatch(/run-a\/run\.json$/);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('read and prune reject schema-invalid artifacts instead of consuming them', () => {
    const repo = makeRepo();
    try {
      const workspaceSlug = path.basename(repo);
      const runDir = path.join(repo, '.spec-first', 'workflows', 'spec-work', workspaceSlug, 'bad-run');
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'run.json'), `${JSON.stringify({
        schema_version: 'spec-work-run-artifact/v1',
        workflow: 'spec-work',
        retention: {
          expires_at: '2000-01-01T00:00:00.000Z',
        },
        unexpected: true,
      })}\n`);

      const read = readSpecWorkRunArtifact({
        targetRepo: repo,
        workspaceSlug,
        runId: 'bad-run',
      });
      expect(read.exitCode).toBe(1);
      expect(read.output.status).toBe('not-readable');
      expect(read.output.reason_code).toBe('artifact-schema-invalid');
      expect(read.output.artifact).toBeNull();

      const prune = pruneSpecWorkRunArtifacts({
        targetRepo: repo,
        retentionDays: 1,
        dryRun: true,
      });
      expect(prune.exitCode).toBe(0);
      expect(prune.output.retained).toEqual(expect.arrayContaining([
        expect.objectContaining({
          artifact_path: path.join('.spec-first', 'workflows', 'spec-work', workspaceSlug, 'bad-run', 'run.json'),
          reason_code: 'artifact-schema-invalid',
        }),
      ]));
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('read and prune remain compatible with valid v1 artifacts', () => {
    const repo = makeRepo();
    try {
      const workspaceSlug = path.basename(repo);
      const runDir = path.join(repo, '.spec-first', 'workflows', 'spec-work', workspaceSlug, 'legacy-run');
      fs.mkdirSync(runDir, { recursive: true });
      const artifact = validV1Artifact({
        workspaceSlug,
        runId: 'legacy-run',
        expiresAt: '2000-01-01T00:00:00.000Z',
      });
      artifact.graph_evidence_used = validGraphEvidenceUsed();
      fs.writeFileSync(path.join(runDir, 'run.json'), `${JSON.stringify(artifact, null, 2)}\n`);

      const read = readSpecWorkRunArtifact({
        targetRepo: repo,
        workspaceSlug,
        runId: 'legacy-run',
      });
      expect(read.exitCode).toBe(0);
      expect(read.output.status).toBe('read');
      expect(read.output.artifact.schema_version).toBe('spec-work-run-artifact/v1');

      const prune = pruneSpecWorkRunArtifacts({
        targetRepo: repo,
        retentionDays: 1,
        dryRun: true,
      });
      expect(prune.exitCode).toBe(0);
      expect(prune.output.removed).toEqual(expect.arrayContaining([
        expect.objectContaining({
          artifact_path: path.join('.spec-first', 'workflows', 'spec-work', workspaceSlug, 'legacy-run', 'run.json'),
          reason_code: 'expired',
        }),
      ]));
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('prunes expired artifacts and preserves active artifacts in dry-run mode', () => {
    const repo = makeRepo();
    try {
      writeRunSummary(repo, 'expired-run');
      writeRunSummary(repo, 'active-run');
      const expiredPayload = validPayloadForRun(repo, 'expired-run', {
        retention: {
          retention_status: 'lifecycle-deferred',
          artifact_category: 'spec-work-run-evidence',
          raw_log_retention_impact: 'none',
          redaction_status: 'none-required',
          owner: 'owner-expired',
          expires_at: '2000-01-01T00:00:00.000Z',
        },
      });
      const activePayload = validPayloadForRun(repo, 'active-run', {
        retention: {
          retention_status: 'lifecycle-deferred',
          artifact_category: 'spec-work-run-evidence',
          raw_log_retention_impact: 'none',
          redaction_status: 'none-required',
          owner: 'owner-active',
          expires_at: '2999-01-01T00:00:00.000Z',
        },
      });

      const expiredInput = writePayload(repo, expiredPayload, 'expired-payload.json');
      const activeInput = writePayload(repo, activePayload, 'active-payload.json');

      captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'write',
        '--input',
        expiredInput,
        '--run-id',
        'expired-run',
        '--target-repo',
        repo,
      ]));
      captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'write',
        '--input',
        activeInput,
        '--run-id',
        'active-run',
        '--target-repo',
        repo,
      ]));

      const dryRun = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'prune',
        '--target-repo',
        repo,
        '--retention-days',
        '1',
        '--dry-run',
        '--json',
      ]));
      const dryRunPayload = JSON.parse(dryRun.stdout);
      expect(dryRun.code).toBe(0);
      expect(dryRunPayload.status).toBe('pruned');
      expect(dryRunPayload.removed.map((entry) => entry.reason_code)).toContain('expired');
      expect(dryRunPayload.retained.map((entry) => entry.reason_code)).toContain('retention-active');

      const prune = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'prune',
        '--target-repo',
        repo,
        '--retention-days',
        '1',
        '--json',
      ]));
      const prunePayload = JSON.parse(prune.stdout);
      expect(prune.code).toBe(0);
      expect(prunePayload.status).toBe('pruned');
      expect(prunePayload.removed.length).toBeGreaterThanOrEqual(1);
      expect(fs.existsSync(path.join(repo, '.spec-first', 'workflows', 'spec-work', path.basename(repo), 'expired-run', 'run.json'))).toBe(false);
      expect(fs.existsSync(path.join(repo, '.spec-first', 'workflows', 'spec-work', path.basename(repo), 'active-run', 'run.json'))).toBe(true);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('read rejects unsafe explicit workspace/run identifiers', () => {
    const repo = makeRepo();
    try {
      const result = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'read',
        '--target-repo',
        repo,
        '--workspace-slug',
        '..',
        '--run-id',
        'run-a',
        '--json',
      ]));
      const payload = JSON.parse(result.stdout);

      expect(result.code).toBe(2);
      expect(payload.status).toBe('rejected');
      expect(payload.reason_code).toBe('invalid-arguments');
      expect(payload.errors).toContain('--workspace-slug must be a stable safe identifier');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('read and prune fail closed when workflow artifact root is a symlink escape', () => {
    const repo = makeRepo();
    const outside = makeRepo();
    try {
      fs.rmSync(path.join(repo, '.spec-first'), { recursive: true, force: true });
      fs.symlinkSync(outside, path.join(repo, '.spec-first'));

      const read = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'read',
        '--target-repo',
        repo,
        '--json',
      ]));
      const readPayload = JSON.parse(read.stdout);
      expect(read.code).toBe(1);
      expect(readPayload.status).toBe('rejected');
      expect(readPayload.reason_code).toBe('artifact-path-escape');

      const prune = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'prune',
        '--target-repo',
        repo,
        '--json',
      ]));
      const prunePayload = JSON.parse(prune.stdout);
      expect(prune.code).toBe(1);
      expect(prunePayload.status).toBe('rejected');
      expect(prunePayload.reason_code).toBe('artifact-path-escape');
      expect(fs.existsSync(path.join(outside, 'workflows'))).toBe(false);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('read and prune do not follow run artifact leaf symlinks outside the target repo', () => {
    const repo = makeRepo();
    const outside = makeRepo();
    try {
      const runDir = path.join(repo, '.spec-first', 'workflows', 'spec-work', 'workspace-a', 'run-a');
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(outside, 'run.json'), JSON.stringify(validPayload()), 'utf8');
      fs.symlinkSync(path.join(outside, 'run.json'), path.join(runDir, 'run.json'));

      const read = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'read',
        '--target-repo',
        repo,
        '--workspace-slug',
        'workspace-a',
        '--run-id',
        'run-a',
        '--json',
      ]));
      const readPayload = JSON.parse(read.stdout);
      expect(read.code).toBe(1);
      expect(readPayload.status).toBe('rejected');
      expect(readPayload.reason_code).toBe('artifact-path-escape');

      const prune = captureStdout(() => runInternal([
        'spec-work-run-artifact',
        'prune',
        '--target-repo',
        repo,
        '--json',
      ]));
      const prunePayload = JSON.parse(prune.stdout);
      expect(prune.code).toBe(0);
      expect(prunePayload.status).toBe('pruned');
      expect(prunePayload.retained).toEqual(expect.arrayContaining([
        expect.objectContaining({
          artifact_path: path.join('.spec-first', 'workflows', 'spec-work', 'workspace-a', 'run-a', 'run.json'),
          reason_code: 'artifact-path-escape',
        }),
      ]));
      expect(fs.existsSync(path.join(outside, 'run.json'))).toBe(true);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('read and prune fail closed when workflow artifact root is not a directory', () => {
    const repo = makeRepo();
    try {
      fs.mkdirSync(path.join(repo, '.spec-first', 'workflows'), { recursive: true });
      fs.writeFileSync(path.join(repo, '.spec-first', 'workflows', 'spec-work'), 'not a directory', 'utf8');

      const read = readSpecWorkRunArtifact({ targetRepo: repo });
      expect(read.exitCode).toBe(1);
      expect(read.output.status).toBe('rejected');
      expect(read.output.reason_code).toBe('artifact-root-not-directory');

      const prune = pruneSpecWorkRunArtifacts({
        targetRepo: repo,
        retentionDays: 1,
        dryRun: true,
      });
      expect(prune.exitCode).toBe(1);
      expect(prune.output.status).toBe('rejected');
      expect(prune.output.reason_code).toBe('artifact-root-not-directory');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('fails closed when the artifact output ancestor is a symlink escape', () => {
    const repo = makeRepo();
    const outside = makeRepo();
    try {
      fs.rmSync(path.join(repo, '.spec-first'), { recursive: true, force: true });
      fs.symlinkSync(outside, path.join(repo, '.spec-first'));
      const inputPath = writePayload(repo, validPayload());

      const result = writeSpecWorkRunArtifact({
        inputPath,
        runId: 'run-1',
        targetRepo: repo,
      });

      expect(result.exitCode).toBe(1);
      expect(result.output.status).toBe('rejected');
      expect(result.output.reason_code).toBe('artifact-path-escape');
      expect(fs.existsSync(path.join(outside, 'workflows'))).toBe(false);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
      fs.rmSync(outside, { recursive: true, force: true });
    }
  });

  test('prune CLI surfaces a precise reason code for non-numeric --retention-days', () => {
    const repo = makeRepo();
    try {
      for (const value of ['abc', '1abc']) {
        const result = captureStdout(() => runInternal([
          'spec-work-run-artifact',
          'prune',
          '--target-repo',
          repo,
          '--retention-days',
          value,
          '--json',
        ]));
        const payload = JSON.parse(result.stdout);

        expect(result.code).toBe(2);
        expect(payload.status).toBe('rejected');
        expect(payload.reason_code).toBe('invalid-arguments');
        expect(payload.errors.some((entry) => entry.includes(`'${value}'`))).toBe(true);
      }
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });
});

describe('append-only spec-work run state', () => {
  function seedLegacyRun(repo, runId = 'state-run') {
    const workspaceSlug = slugify(path.basename(repo));
    const runDir = path.join(repo, '.spec-first', 'workflows', 'spec-work', workspaceSlug, runId);
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(
      path.join(runDir, 'run.json'),
      `${JSON.stringify(validV1Artifact({ workspaceSlug, runId }), null, 2)}\n`,
    );
    return { workspaceSlug, runDir };
  }

  function statePayload(repo, runId = 'state-run', overrides = {}) {
    return {
      run_id: runId,
      worktree_identity: {
        repo_root: repo,
        git_head: null,
        dirty_fingerprint: 'a'.repeat(64),
      },
      units: [{
        unit_id: 'U1',
        status: 'running',
        requested_engine: 'inline',
        actual_engine: 'inline',
        authorization: { status: 'authorized' },
        collision: { status: 'none' },
        recovery: { status: 'not-needed' },
        verification: {
          status: 'started',
          confirmed: false,
          evidence_refs: [],
          reason_code: 'verification-started',
        },
      }],
      authorization: { worker_dispatch: 'missing' },
      collision: { status: 'none', reason_code: 'none' },
      recovery: { status: 'not-needed', reason_code: 'not-needed' },
      limitations: [],
      ...overrides,
    };
  }

  function writeStateInput(repo, payload, name = 'state-input.json') {
    const inputPath = path.join(repo, name);
    fs.writeFileSync(inputPath, `${JSON.stringify(payload, null, 2)}\n`);
    return inputPath;
  }

  test('treats a legacy run as generation zero and appends a complete hash chain', () => {
    const repo = makeRepo();
    try {
      const { workspaceSlug } = seedLegacyRun(repo);
      const initial = readSpecWorkRunState({ targetRepo: repo, workspaceSlug, runId: 'state-run' });
      expect(initial.output.reason_code).toBe('legacy-generation-zero');
      expect(initial.output.generation).toBe(0);
      expect(initial.output.state).toBeNull();

      const first = writeSpecWorkRunState({
        inputPath: writeStateInput(repo, statePayload(repo)),
        runId: 'state-run',
        targetRepo: repo,
        expectedGeneration: 0,
        expectedSha256: initial.output.snapshot_sha256,
      });
      expect(first.exitCode).toBe(0);
      expect(first.output.generation).toBe(1);

      const passed = statePayload(repo);
      passed.units[0].status = 'passed';
      passed.units[0].verification = {
        status: 'passed',
        confirmed: true,
        evidence_refs: ['verification-run-summary.json'],
        reason_code: 'confirmed-exit-zero',
      };
      const second = writeSpecWorkRunState({
        inputPath: writeStateInput(repo, passed, 'state-input-2.json'),
        runId: 'state-run',
        targetRepo: repo,
        expectedGeneration: 1,
        expectedSha256: first.output.snapshot_sha256,
      });
      expect(second.exitCode).toBe(0);
      const read = readSpecWorkRunState({ targetRepo: repo, workspaceSlug, runId: 'state-run' });
      expect(read.output.generation).toBe(2);
      expect(read.output.state.units[0].verification.status).toBe('passed');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('rejects stale CAS writers and worktree drift without overwriting state', () => {
    const repo = makeRepo();
    try {
      const { workspaceSlug } = seedLegacyRun(repo);
      const initial = readSpecWorkRunState({ targetRepo: repo, workspaceSlug, runId: 'state-run' });
      const first = writeSpecWorkRunState({
        inputPath: writeStateInput(repo, statePayload(repo)),
        runId: 'state-run',
        targetRepo: repo,
        expectedGeneration: 0,
        expectedSha256: initial.output.snapshot_sha256,
      });
      const conflict = writeSpecWorkRunState({
        inputPath: writeStateInput(repo, statePayload(repo), 'conflict.json'),
        runId: 'state-run',
        targetRepo: repo,
        expectedGeneration: 0,
        expectedSha256: initial.output.snapshot_sha256,
      });
      expect(conflict.output.reason_code).toBe('run-state-conflict');

      const drifted = statePayload(repo);
      drifted.worktree_identity.dirty_fingerprint = 'b'.repeat(64);
      const drift = writeSpecWorkRunState({
        inputPath: writeStateInput(repo, drifted, 'drift.json'),
        runId: 'state-run',
        targetRepo: repo,
        expectedGeneration: 1,
        expectedSha256: first.output.snapshot_sha256,
      });
      expect(drift.output.reason_code).toBe('run-source-drifted');
      expect(readSpecWorkRunState({ targetRepo: repo, workspaceSlug, runId: 'state-run' }).output.generation)
        .toBe(1);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('ignores temporary and broken snapshots and never promotes started verification', () => {
    const repo = makeRepo();
    try {
      const { workspaceSlug, runDir } = seedLegacyRun(repo);
      const initial = readSpecWorkRunState({ targetRepo: repo, workspaceSlug, runId: 'state-run' });
      const first = writeSpecWorkRunState({
        inputPath: writeStateInput(repo, statePayload(repo)),
        runId: 'state-run',
        targetRepo: repo,
        expectedGeneration: 0,
        expectedSha256: initial.output.snapshot_sha256,
      });
      const stateDir = path.join(runDir, 'state');
      fs.writeFileSync(path.join(stateDir, '000002.json.tmp'), '{partial');
      fs.writeFileSync(path.join(stateDir, '000002.json'), JSON.stringify({
        ...statePayload(repo),
        schema_version: 'spec-work-run-state/v1',
        generation: 2,
        previous_generation: 1,
        previous_sha256: '0'.repeat(64),
        captured_at: new Date().toISOString(),
      }));
      const read = readSpecWorkRunState({ targetRepo: repo, workspaceSlug, runId: 'state-run' });
      expect(read.output.generation).toBe(1);
      expect(read.output.snapshot_sha256).toBe(first.output.snapshot_sha256);
      expect(read.output.state.units[0].verification.status).toBe('started');
      expect(read.output.state.units[0].status).not.toBe('passed');
      expect(read.output.warnings).toContain('ignored invalid state snapshot: 000002.json');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('rejects a passed verification without confirmed evidence', () => {
    const repo = makeRepo();
    try {
      const { workspaceSlug } = seedLegacyRun(repo);
      const initial = readSpecWorkRunState({ targetRepo: repo, workspaceSlug, runId: 'state-run' });
      const invalid = statePayload(repo);
      invalid.units[0].status = 'passed';
      invalid.units[0].verification.status = 'passed';
      const result = writeSpecWorkRunState({
        inputPath: writeStateInput(repo, invalid),
        runId: 'state-run',
        targetRepo: repo,
        expectedGeneration: 0,
        expectedSha256: initial.output.snapshot_sha256,
      });
      expect(result.output.reason_code).toBe('run-state-schema-invalid');
      expect(result.output.errors).toContain('passed verification requires confirmed evidence refs');
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });

  test('rejects state that violates the published snapshot schema without writing a generation', () => {
    const repo = makeRepo();
    try {
      const { workspaceSlug, runDir } = seedLegacyRun(repo);
      const initial = readSpecWorkRunState({ targetRepo: repo, workspaceSlug, runId: 'state-run' });
      const invalid = statePayload(repo);
      delete invalid.units[0].requested_engine;
      invalid.authorization = 'authorized';

      const result = writeSpecWorkRunState({
        inputPath: writeStateInput(repo, invalid),
        runId: 'state-run',
        targetRepo: repo,
        expectedGeneration: 0,
        expectedSha256: initial.output.snapshot_sha256,
      });

      expect(result.output.reason_code).toBe('run-state-schema-invalid');
      expect(result.output.errors).toEqual(expect.arrayContaining([
        expect.stringContaining('missing required key requested_engine'),
        expect.stringContaining('authorization: expected object'),
      ]));
      expect(fs.existsSync(path.join(runDir, 'state', '000001.json'))).toBe(false);
    } finally {
      fs.rmSync(repo, { recursive: true, force: true });
    }
  });
});
