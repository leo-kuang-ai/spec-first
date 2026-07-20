'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { validateAgainstSchema } = require('../../src/contracts/schema-validator');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SCHEMA_PATH = path.join(
  REPO_ROOT,
  'docs',
  'contracts',
  'workflows',
  'spec-work-run-artifact.schema.json'
);
const USER_ARTIFACT_MAP_PATH = path.join(
  REPO_ROOT,
  'docs',
  '05-用户手册',
  '04-workflows-artifacts-map.md'
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validArtifact() {
  return {
    schema_version: 'spec-work-run-artifact/v2',
    generated_at: '2026-05-17T00:00:00.000Z',
    workflow: 'spec-work',
    run_id: 'phase1b-smoke',
    mode: 'interactive',
    workspace_slug: 'spec-first',
    producer: {
      producer_available: true,
      workflow_integrated: false,
      reason_code: 'producer-write-side-only',
    },
    plan_path: 'docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md',
    plan_source: 'explicit',
    task_pack_path: 'docs/tasks/2026-05-17-001-feat-spec-first-optimization-phase1b-tasks.md',
    source_refs: ['docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md'],
    script_confirmed: {
      validation: {
        status: 'passed',
        reason_code: 'run-summary-recorded',
        run_summary_ref: '.spec-first/workflows/spec-work/spec-first/phase1b-smoke/verification-run-summary.json',
      },
      changed_files: ['src/cli/helpers/spec-work-run-artifact.js'],
      artifact_refs: ['.spec-first/workflows/spec-work/spec-first/phase1b-smoke/run.json'],
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
      summary: 'Phase 1B producer write-side foundation completed.',
      read_artifacts: ['docs/tasks/2026-05-17-001-feat-spec-first-optimization-phase1b-tasks.md'],
      key_decisions: ['Keep workflow_integrated false until workflow closeout calls the producer.'],
      deferred_follow_up: ['Phase 3 retention/prune lifecycle remains deferred.'],
      next_action: 'Run Phase 1B review.',
    },
    provider_untrusted: {
      readiness_status: 'degraded',
      summaries: ['setup facts not used as primary evidence'],
    },
    retention: {
      retention_status: 'lifecycle-deferred',
      artifact_category: 'spec-work-run-evidence',
      raw_log_retention_impact: 'none',
      redaction_status: 'none-required',
      owner: 'spec-work',
      expires_at: '2026-06-01T00:00:00.000Z',
    },
    artifact_path: '.spec-first/workflows/spec-work/spec-first/phase1b-smoke/run.json',
    warnings: [],
  };
}

function validV1Artifact() {
  const artifact = validArtifact();
  artifact.schema_version = 'spec-work-run-artifact/v1';
  artifact.script_confirmed.validation = {
    status: 'passed',
    commands: [
      {
        command: 'npm run test:jest -- tests/unit/spec-work-run-artifact-producer.test.js --runInBand',
        exit_code: 0,
        summary: 'producer tests passed',
      },
    ],
  };
  return artifact;
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

describe('spec-work run artifact contract', () => {
  test('schema is producer-available and marks closeout integration explicit', () => {
    const schema = readJson(SCHEMA_PATH);

    expect(schema.title).toBe('spec-first spec-work run artifact producer-available contract');
    expect(schema.description).toContain('write-side contract');
    expect(schema.description).toContain('durable evidence trigger');
    expect(schema['x-spec-first-contract-status']).toBe('producer_available');
    expect(schema['x-spec-first-producer']).toBe('internal spec-work-run-artifact write');
    expect(schema['x-spec-first-producer-available']).toBe(true);
    expect(schema['x-spec-first-workflow-integrated']).toBe(true);
    expect(schema['x-spec-first-runtime-path']).toBe(
      '.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/run.json'
    );
    expect(schema.description).toContain('fresh workspace/run-id pairs');
    expect(schema['x-spec-first-boundary']).toContain('artifact-already-exists instead of overwriting');
    expect(schema['x-spec-first-boundary']).toContain('workflow_integrated true only when spec-work closeout calls the producer');
    expect(schema.properties.producer.properties.workflow_integrated.enum).toEqual([true, false]);
    expect(schema.properties.producer.properties.reason_code.enum).toEqual([
      'trigger-task-pack',
      'trigger-not-run-validation',
      'trigger-deferred-follow-up',
      'trigger-substantive-work',
      'no-trigger-matched',
      'producer-error',
      'producer-write-side-only',
    ]);
    expect(schema.properties.schema_version.enum).toEqual([
      'spec-work-run-artifact/v1',
      'spec-work-run-artifact/v2',
    ]);
    expect(schema.properties.retention.properties.owner.type).toBe('string');
    expect(schema.properties.retention.properties.expires_at.type).toBe('string');
    expect(schema.properties.script_confirmed.additionalProperties).toBe(false);
    expect(schema.$defs.validationV1.properties.commands.items.additionalProperties).toBe(false);
    expect(schema.$defs.validationV2.required).toEqual(['status', 'reason_code', 'run_summary_ref']);
    expect(schema.$defs.validationV2.additionalProperties).toBe(false);
    expect(schema.$defs.validationV2.properties.run_summary_ref.pattern).toContain('verification-run-summary');
    expect(schema.properties.script_confirmed.properties.resume_evidence.additionalProperties).toBe(false);
    expect(schema.properties.provider_untrusted.additionalProperties).toBe(false);
    expect(schema.properties.provider_untrusted.properties.summaries.maxItems).toBe(20);
  });

  test('schema validates a v2 producer-written run artifact sample', () => {
    const schema = readJson(SCHEMA_PATH);

    expect(validateAgainstSchema(schema, validArtifact()).errors).toEqual([]);
  });

  test('schema adds optional direct_evidence_used without breaking old v1 artifacts', () => {
    const schema = readJson(SCHEMA_PATH);

    expect(schema.properties.direct_evidence_used).toBeDefined();
    expect(schema.required).not.toContain('direct_evidence_used');
    expect(schema.properties.direct_evidence_used.required).toEqual([
      'source_refs',
      'checks_or_logs',
      'repo_scope',
      'limitations',
      'redaction_status',
    ]);
    expect(schema.properties.direct_evidence_used.properties.source_refs.maxItems).toBe(20);
    expect(schema.properties.direct_evidence_used.properties.checks_or_logs.maxItems).toBe(20);
    expect(schema.properties.direct_evidence_used.properties.limitations.maxItems).toBe(20);
    expect(schema.properties.direct_evidence_used.properties.source_refs.items.maxLength).toBe(300);

    expect(validateAgainstSchema(schema, validArtifact()).errors).toEqual([]);
    expect(validateAgainstSchema(schema, validV1Artifact()).errors).toEqual([]);
  });

  test('schema remains compatible with legacy v1 graph_evidence_used artifacts', () => {
    const schema = readJson(SCHEMA_PATH);
    const artifact = validV1Artifact();
    artifact.graph_evidence_used = validGraphEvidenceUsed();

    expect(schema.properties.graph_evidence_used).toBeDefined();
    expect(schema.required).not.toContain('graph_evidence_used');
    expect(validateAgainstSchema(schema, artifact).errors).toEqual([]);
  });

  test('schema validates compact direct evidence', () => {
    const schema = readJson(SCHEMA_PATH);
    const artifact = validArtifact();
    artifact.direct_evidence_used = validDirectEvidenceUsed();

    expect(validateAgainstSchema(schema, artifact).errors).toEqual([]);
  });

  test('schema rejects incomplete or unbounded direct evidence summaries', () => {
    const schema = readJson(SCHEMA_PATH);
    const missingRedaction = validArtifact();
    missingRedaction.direct_evidence_used = validDirectEvidenceUsed();
    delete missingRedaction.direct_evidence_used.redaction_status;
    const tooManyRefs = validArtifact();
    tooManyRefs.direct_evidence_used = {
      ...validDirectEvidenceUsed(),
      source_refs: Array.from({ length: 21 }, (_, index) => `source-${index}`),
    };
    const tooLongScope = validArtifact();
    tooLongScope.direct_evidence_used = {
      ...validDirectEvidenceUsed(),
      repo_scope: 'x'.repeat(161),
    };

    expect(validateAgainstSchema(schema, missingRedaction).errors).toContain(
      'root.direct_evidence_used: missing required key redaction_status'
    );
    expect(validateAgainstSchema(schema, tooManyRefs).errors).toContain(
      'root.direct_evidence_used.source_refs: expected at most 20 item(s), received 21'
    );
    expect(validateAgainstSchema(schema, tooLongScope).errors).toContain(
      'root.direct_evidence_used.repo_scope: expected string length at most 160, received 161'
    );
  });

  test('schema accepts workflow-integrated closeout artifacts and legacy write-side artifacts', () => {
    const schema = readJson(SCHEMA_PATH);
    const integratedArtifact = validArtifact();
    integratedArtifact.producer.workflow_integrated = true;
    integratedArtifact.producer.reason_code = 'trigger-task-pack';
    const invalidIntegratedArtifact = validArtifact();
    invalidIntegratedArtifact.producer.workflow_integrated = true;
    invalidIntegratedArtifact.producer.reason_code = 'producer-write-side-only';
    const invalidLegacyArtifact = validArtifact();
    invalidLegacyArtifact.producer.workflow_integrated = false;
    invalidLegacyArtifact.producer.reason_code = 'trigger-task-pack';

    expect(validateAgainstSchema(schema, integratedArtifact).errors).toEqual([]);
    expect(validateAgainstSchema(schema, validArtifact()).errors).toEqual([]);
    expect(validateAgainstSchema(schema, invalidIntegratedArtifact).errors).toContain(
      'root.producer.reason_code: value "producer-write-side-only" not in enum'
    );
    expect(validateAgainstSchema(schema, invalidLegacyArtifact).errors).toContain(
      'root.producer.reason_code: value "trigger-task-pack" not in enum'
    );
  });

  test('user artifact map matches the current integrated producer and v2 direct evidence contract', () => {
    const schema = readJson(SCHEMA_PATH);
    const map = fs.readFileSync(USER_ARTIFACT_MAP_PATH, 'utf8');
    const runEvidenceSection = map.match(/## Spec-work run evidence([\s\S]*?)## Code review temporary handoff/);

    expect(runEvidenceSection).not.toBeNull();
    const section = runEvidenceSection[1];
    expect(section).toContain('workflow_integrated=true');
    expect(section).toContain('workflow_integrated=false');
    expect(section).toContain('durable trigger');
    expect(section).toContain('同一 workspace/run-id 不可覆盖');
    for (const field of schema.properties.direct_evidence_used.required) {
      expect(section).toContain(`\`${field}\``);
    }
    expect(section).toContain('`graph_evidence_used` 仅保留 v1 read/prune 兼容');
    expect(map).toContain('当前没有 workflow 自动发现或隐式消费 `spec-work` run artifact');

    expect(map).not.toContain('workflow_integrated=false`，表示 producer 可写 schema-aligned payload，但完整 replay/retention lifecycle 仍是后续工作');
    expect(map).not.toContain('`capabilities_used`、`evidence_grade`、`evidence_posture`、`freshness_state`');
    expect(map).not.toContain('后续 `spec-code-review` 可通过 source-owned reader best-effort 读取');
    expect(map).not.toContain('传递给下游 `spec-code-review`');
  });

  test('schema caps persisted LLM prose fields to keep raw logs out of run evidence', () => {
    const schema = readJson(SCHEMA_PATH);
    const artifact = validArtifact();
    artifact.llm_asserted.summary = 'x'.repeat(1001);

    expect(validateAgainstSchema(schema, artifact).errors).toContain(
      'root.llm_asserted.summary: expected string length at most 1000, received 1001'
    );
  });

  test('schema rejects unknown LLM asserted fields', () => {
    const schema = readJson(SCHEMA_PATH);
    const artifact = validArtifact();
    artifact.llm_asserted.raw_log_dump = 'raw output';

    expect(validateAgainstSchema(schema, artifact).errors).toContain(
      'root.llm_asserted.raw_log_dump: unexpected additional key'
    );
  });

  test('schema rejects generated mirror and non-workflow runtime artifact path classes', () => {
    const schema = readJson(SCHEMA_PATH);
    const generatedMirrorArtifact = validArtifact();
    generatedMirrorArtifact.source_refs = ['.agents/skills/spec-work/SKILL.md'];
    const sourceWorkflowArtifact = validArtifact();
    sourceWorkflowArtifact.source_refs = ['.spec-first/workflows/spec-work/spec-first/phase1b-smoke/run.json'];
    const changedWorkflowArtifact = validArtifact();
    changedWorkflowArtifact.script_confirmed.changed_files = ['.spec-first/workflows/spec-work/spec-first/phase1b-smoke/run.json'];
    const allowedWorkflowArtifact = validArtifact();
    allowedWorkflowArtifact.script_confirmed.artifact_refs = ['.spec-first/workflows/spec-work/spec-first/phase1b-smoke/run.json'];
    allowedWorkflowArtifact.llm_asserted.read_artifacts = ['.spec-first/workflows/spec-work/spec-first/phase1b-smoke/run.json'];
    const runtimeConfigArtifact = validArtifact();
    runtimeConfigArtifact.script_confirmed.artifact_refs = ['.spec-first/config/tool-facts.json'];

    expect(validateAgainstSchema(schema, generatedMirrorArtifact).errors.some((error) => (
      error.includes('root.source_refs[0]') && error.includes('does not match pattern')
    ))).toBe(true);
    expect(validateAgainstSchema(schema, runtimeConfigArtifact).errors.some((error) => (
      error.includes('root.script_confirmed.artifact_refs[0]') && error.includes('does not match pattern')
    ))).toBe(true);
    expect(validateAgainstSchema(schema, sourceWorkflowArtifact).errors.some((error) => (
      error.includes('root.source_refs[0]') && error.includes('does not match pattern')
    ))).toBe(true);
    expect(validateAgainstSchema(schema, changedWorkflowArtifact).errors.some((error) => (
      error.includes('root.script_confirmed.changed_files[0]') && error.includes('does not match pattern')
    ))).toBe(true);
    expect(validateAgainstSchema(schema, allowedWorkflowArtifact).errors).toEqual([]);
  });
});
