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
});
