'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('spec-doc-review task-pack consumer contract', () => {
  const skill = read('skills/spec-doc-review/SKILL.md');
  const synthesis = read('skills/spec-doc-review/references/synthesis-and-presentation.md');
  const writeTasks = read('skills/spec-write-tasks/SKILL.md');
  const handoff = read('skills/spec-write-tasks/references/execution-handoff-contract.md');
  const lensPath = path.join(repoRoot, 'skills/spec-doc-review/references/task-pack-review-lens.md');
  const lens = fs.existsSync(lensPath) ? fs.readFileSync(lensPath, 'utf8') : '';
  const casesPath = path.join(repoRoot, 'skills/spec-doc-review/evals/task-pack-review-cases.json');
  const cases = fs.existsSync(casesPath)
    ? JSON.parse(fs.readFileSync(casesPath, 'utf8'))
    : { cases: [] };

  test('classifies task packs before generic requirements or plan signals', () => {
    expect(skill).toContain('`type: task-pack` → classify as `task-pack`');
    expect(skill).toContain('`task-pack` 分类优先于 unified requirements/plan 与通用 content-shape 分类');
    expect(skill).toContain('references/task-pack-review-lens.md');
  });

  test('keeps derived task packs report-only under producer ownership', () => {
    expect(skill).toContain('`task-pack` 强制使用 `report-only`');
    expect(skill).toContain('mutation_reason: task-pack-derived-artifact');
    expect(synthesis).toContain('task-pack-derived-artifact');
  });

  test('uses deterministic intake as a floor and reviews source-plan fidelity above it', () => {
    expect(fs.existsSync(lensPath)).toBe(true);
    expect(lens).toContain('spec-first tasks validate <task-pack-path> --repo <artifact-root> --json');
    expect(lens).toContain('`Task Pack Contract` JSON 是任务结构权威');
    expect(lens).toContain('`source_plan` 仍是 scope、acceptance、architecture、non-goals 与 verification 的唯一权威');
    expect(lens).toContain('不得把 deterministic validation 当作 semantic-fit');
    expect(lens).toContain('当前 validator 不返回 task-pack digest');
    expect(lens).not.toContain('source-plan hash、task-pack digest');
    for (const field of [
      '`dependencies`',
      '`execution_waves`',
      '`files`',
      '`expected_side_effects`',
      '`test_focus`',
      '`done_signal`',
      '`stop_if`',
      '`review_gate`',
      '`review_focus`',
    ]) {
      expect(lens).toContain(field);
    }
  });

  test('returns one task-pack outcome with the correct terminal owner', () => {
    expect(synthesis).toContain('"task_pack_outcome": null');
    expect(synthesis).toContain('"review_result": "passed|blocked|incomplete"');
    expect(synthesis).toContain('"next_action": "spec-work-task-pack|spec-write-tasks|spec-plan"');
    expect(lens).toContain('`spec-work-task-pack`');
    expect(lens).toContain('`spec-write-tasks`');
    expect(lens).toContain('`spec-plan`');
  });

  test('makes the write-tasks handoff byte-preserving and machine-readable', () => {
    const invocation = 'spec-doc-review mode:headless mutation:report-only output:json roster:full <task-pack-path>';
    expect(writeTasks).toContain(invocation);
    expect(handoff).toContain(invocation);
    expect(handoff).toContain('task_pack_outcome.review_result: passed');
    expect(handoff).toContain('task_pack_outcome.next_action: spec-work-task-pack');
    expect(handoff).toContain('不得只消费自由文本 `Review complete`');
    expect(handoff).toContain('三者都不构成 subagent dispatch authority');
    for (const field of [
      '`output_mode: json`',
      '`mutation_policy: report-only`',
      '`mutation_reason: task-pack-derived-artifact`',
      '`review_status: complete`',
      '`fixes_applied: 0`',
      '`terminal_signal: Review complete`',
    ]) {
      expect(handoff).toContain(field);
    }
    expect(handoff).toContain('`task_pack_outcome.source_plan` 与本次 deterministic receipt 的 `source_plan.path` 相同');
    expect(handoff).toContain('单独的 `Review complete` 永远不是 execution handoff 证据');
  });

  test('fails closed before personas and keeps roster selection separate from dispatch authority', () => {
    expect(lens).toContain('不 dispatch personas');
    expect(lens).toContain('返回 `review_status: incomplete`');
    expect(lens).toContain('`roster:full` 只选择所有实际 qualified personas，不授予 subagent dispatch');
    expect(lens).toContain('`dispatch_authorization_missing`');
  });

  test('routes pack defects and source-plan decision gaps to different owners', () => {
    expect(lens).toContain('`reason_code: task-pack-regeneration-required`');
    expect(lens).toContain('`reason_code: source-plan-revision-required`');
    expect(lens).toMatch(/task-pack-regeneration-required[^\n]+spec-write-tasks/);
    expect(lens).toMatch(/source-plan-revision-required[^\n]+spec-plan/);
  });

  test('covers passed, regeneration, plan-revision, and deterministic-failure outcomes', () => {
    expect(cases.cases).toHaveLength(4);
    expect(cases.cases.map((entry) => [entry.id, entry.expected.next_action])).toEqual([
      ['valid-reviewed-task-pack', 'spec-work-task-pack'],
      ['stale-task-pack-intake', 'spec-write-tasks'],
      ['task-pack-semantic-gap', 'spec-write-tasks'],
      ['source-plan-decision-gap', 'spec-plan'],
    ]);
  });
});
