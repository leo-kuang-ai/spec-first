'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const skill = fs.readFileSync(path.join(repoRoot, 'skills/spec-write-tasks/SKILL.md'), 'utf8');
const schema = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-write-tasks/references/task-pack-schema.md'),
  'utf8',
);
const handoff = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-write-tasks/references/execution-handoff-contract.md'),
  'utf8',
);
const casesPath = path.join(repoRoot, 'skills/spec-write-tasks/evals/output-quality-cases.json');
const failureCasesPath = path.join(repoRoot, 'skills/spec-write-tasks/evals/failure-cases.json');
const qualityGuide = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-write-tasks/references/task-quality-guide.md'),
  'utf8',
);

describe('spec-write-tasks current contracts', () => {
  test('keeps the plan canonical and task packs derived', () => {
    expect(skill).toContain('Keep the plan as single source of truth');
    expect(skill).toContain('Task Pack Contract');
    expect(skill).toContain('tasks are derived and optional');
  });

  test('requires real CLI evidence before deterministic handoff claims', () => {
    expect(skill).toContain('spec-first tasks validate <task-pack-path> --repo <artifact-root> --json');
    expect(skill).toContain('spec-first tasks hash <plan-path> --repo <artifact-root> --json');
    expect(skill).toContain('before reporting `deterministic_handoff`');
  });

  test('does not compile non-active source plans', () => {
    expect(skill).toContain('source_plan_non_active');
    expect(skill).toMatch(/completed.*partially-shipped.*superseded/is);
    expect(skill).toContain('status: active');
  });

  test('uses portable source-plan identity and keeps spec_id as an optional compatibility trace', () => {
    for (const source of [skill, schema, handoff]) {
      expect(source).toContain('source-plan-path+body-hash');
      expect(source).toContain('optional compatibility trace');
      expect(source).not.toContain('missing_spec_id');
    }

    expect(schema).toContain('artifact-root-relative POSIX');
    expect(handoff).toContain('artifact_root');
    expect(handoff).toContain('repo_root');
    expect(handoff).toContain('task-pack-spec-id-trace-missing');
  });

  test('high-risk review remains an authorized bounded handoff', () => {
    expect(skill).toContain('next_action: review-task-pack');
    expect(skill).toContain('dispatch_authorization: missing');
    expect(skill).toContain('Do not auto-dispatch review');
  });

  test('task cards preserve assurance intent without adding a parallel schema', () => {
    expect(qualityGuide).toContain('## Assurance Trace Preservation');
    expect(qualityGuide).toContain('`requirement_refs`');
    expect(qualityGuide).toContain('`test_focus`');
    expect(qualityGuide).toContain('`done_signal`');
    expect(qualityGuide).toContain('`risk_note`');
    expect(qualityGuide).toContain('`review_gate`');
    expect(qualityGuide).toMatch(/required proof intent.*不得丢失/is);
    expect(qualityGuide).toMatch(/unbound.*limitation.*不得.*synthetic check/is);
  });

  test('output-quality cases are parseable and reference current source', () => {
    const fixture = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
    expect(fixture.cases.length).toBeGreaterThan(0);
    for (const sourceRef of fixture.source_refs) {
      expect(fs.existsSync(path.join(repoRoot, sourceRef))).toBe(true);
    }
  });

  test('failure fixtures no longer reject executable packs only because spec_id is absent', () => {
    const fixture = JSON.parse(fs.readFileSync(failureCasesPath, 'utf8'));
    expect(fixture.cases.map((entry) => entry.expected_failure)).not.toContain('missing_spec_id');
    expect(fixture.cases.map((entry) => entry.id)).toContain('source-plan-path-escape');
  });

  // 2026-11-04 复活：该测试曾于 e9fe0769（2026-08-04）重写测试文件时被删未迁移，
  // 导致 schema「a parity test enforces bidirectional sync」承诺落空（全量审查批次1 X02·P2）。
  test('task pack schema stays in parity with validator task fields', () => {
    const {
      REQUIRED_TASK_FIELDS: required,
      ALLOWED_TASK_FIELDS: allowed,
    } = require(path.join(repoRoot, 'src/cli/task-pack.js'));

    const taskCardsStart = schema.indexOf('## Task Cards');
    const taskCardsEnd = schema.indexOf('## Orientation Evidence');
    expect(taskCardsStart).toBeGreaterThan(-1);
    expect(taskCardsEnd).toBeGreaterThan(taskCardsStart);
    const taskCardsSection = schema.slice(taskCardsStart, taskCardsEnd);
    const documentedTaskFields = new Set(
      [...taskCardsSection.matchAll(/^\| `([a-z_]+)` \| /gm)].map((match) => match[1]),
    );

    for (const field of required) {
      expect(allowed.has(field)).toBe(true);
    }
    for (const field of allowed) {
      expect(documentedTaskFields.has(field)).toBe(true);
    }
    for (const field of documentedTaskFields) {
      expect(allowed.has(field)).toBe(true);
    }
  });
});
