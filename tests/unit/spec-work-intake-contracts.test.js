'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('spec-work task-pack intake contracts', () => {
  const skill = read('skills/spec-work/SKILL.md');
  const intake = read('skills/spec-work/references/work-intake-and-task-pack.md');
  const engines = read('skills/spec-work/references/execution-engines.md');
  const quality = read('skills/spec-write-tasks/references/task-quality-guide.md');
  const evals = JSON.parse(read('skills/spec-work/evals/examples.json'));

  test('classifies task packs before unified plans and loads the intake owner on demand', () => {
    expect(skill).toContain('mode token -> file metadata -> task pack -> unified plan');
    expect(skill).toContain('type: task-pack');
    expect(skill).toContain('references/work-intake-and-task-pack.md');
    expect(skill).toMatch(/do not read the full task-pack body before this classification/i);
  });

  test('intake separates deterministic validation from semantic adequacy', () => {
    expect(intake).toContain('## Owned');
    expect(intake).toContain('## Not Owned');
    expect(intake).toContain('## Trigger');
    expect(intake).toContain('## Fallback');
    expect(intake).toContain('spec-first tasks validate <task-pack-path> --repo <artifact-root> --json');
    expect(intake).toContain('validation_receipt');
    expect(intake).toContain('task_pack_digest');
    expect(intake).toContain('source_plan_hash');
    expect(intake).toContain('source_plan_section_titles');
    expect(intake).toContain('path-plus-title label only');
    expect(intake).toContain('semantic-fit');
    expect(intake).toContain('scope/non-goals/KTD');
  });

  test('creates execution tasks from Task Pack Contract waves without parallel re-splitting', () => {
    expect(intake).toContain('Task Pack Contract');
    expect(intake).toContain('execution_waves');
    expect(intake).toMatch(/preserve each `task_id`/i);
    expect(intake).toMatch(/do not create a parallel task decomposition/i);
    expect(engines).toContain('validated task pack');
    expect(engines).toContain('Task Cards and execution_waves');
  });

  test('pins intake facts and fails closed on later drift or stop_if', () => {
    expect(intake).toMatch(/before every task start/i);
    expect(intake).toMatch(/before every required task review/i);
    expect(intake).toContain('task-pack-digest-drift');
    expect(intake).toContain('source-plan-hash-drift');
    expect(intake).toContain('source-plan-intake-drift');
    expect(intake).toContain('stop_if');
    expect(intake).toMatch(/do not create replacement tasks/i);
  });

  test('closes required task review before dependent work and caps remediation loops', () => {
    expect(intake).toContain('task-context:<path>');
    expect(intake).toContain('exact-file');
    expect(intake).toContain('cumulative-file');
    expect(intake).toContain('P0/P1');
    expect(intake).toContain('design-decision');
    expect(intake).toContain('two review rounds total');
    expect(intake).toContain('affected verification');
    expect(intake).toContain('P2/P3');
    expect(intake).toContain('diff-only');
    expect(intake).toContain('same-session plan hash transport');
  });

  test('keeps task pack optional for direct implementation-ready plans', () => {
    expect(intake).toContain('optional derived execution index');
    expect(skill).toContain('suggest `spec-write-tasks`');
    expect(skill).toMatch(/never auto-compile/i);
    expect(quality).toContain('Downstream `spec-work` intake');
  });

  test('source-only evals cover valid, stale, review-blocked, and non-trigger paths', () => {
    expect(evals.schema_version).toBe('spec-first.spec-work.examples/v1');
    const ids = evals.cases.map((entry) => entry.id);
    expect(ids).toEqual(expect.arrayContaining([
      'valid-task-pack-intake',
      'stale-task-pack-rejected',
      'metadata-only-source-plan-drift',
      'required-review-p1-block',
      'direct-plan-does-not-trigger-task-pack-intake',
    ]));
  });
});
