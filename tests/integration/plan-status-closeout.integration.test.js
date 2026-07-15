'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { computeSourcePlanHash } = require('../../src/cli/task-pack');

const repoRoot = path.resolve(__dirname, '../..');
const cliPath = path.join(repoRoot, 'bin/spec-first.js');

function runPlanStatus(root, action, plan) {
  return spawnSync(process.execPath, [
    cliPath,
    'internal',
    'plan-status',
    action,
    '--target-repo', root,
    '--plan', plan,
    '--json',
  ], { cwd: root, encoding: 'utf8' });
}

function runCli(root, args) {
  return spawnSync(process.execPath, [cliPath, ...args], { cwd: root, encoding: 'utf8' });
}

describe('plan status shipping closeout', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-plan-closeout-'));
    fs.mkdirSync(path.join(root, 'docs/plans'), { recursive: true });
    fs.mkdirSync(path.join(root, 'docs/tasks'), { recursive: true });
  });

  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  test('direct closeout updates the plan itself and preserves its body', () => {
    const plan = 'docs/plans/direct.md';
    fs.writeFileSync(path.join(root, plan), '---\nstatus: active\n---\n# Direct\nBody\n', 'utf8');

    const result = runPlanStatus(root, 'complete', plan);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).reason_code).toBe('plan-status-completed');
    expect(fs.readFileSync(path.join(root, plan), 'utf8')).toBe(
      '---\nstatus: completed\n---\n# Direct\nBody\n',
    );
  });

  test('task-pack closeout updates source_plan while leaving the derived pack unchanged', () => {
    const sourcePlan = 'docs/plans/source.md';
    const taskPack = 'docs/tasks/source-tasks.md';
    fs.writeFileSync(
      path.join(root, sourcePlan),
      '---\nspec_id: example\nstatus: active\n---\n# Source\n',
      'utf8',
    );
    const sourcePlanHash = computeSourcePlanHash(path.join(root, sourcePlan)).hash;
    const contract = {
      schema_version: 'task-pack/v1',
      tasks: [{
        task_id: 'T1',
        source_unit: 'U1',
        dependencies: [],
        files: ['src/example.js'],
        goal: 'Implement the example.',
        test_focus: 'Verify the example.',
        done_signal: 'Focused tests pass.',
        wave: '1',
        stop_if: 'The source plan is stale.',
      }],
      execution_waves: [{ wave: '1', tasks: ['T1'] }],
    };
    const taskPackContent = [
      '---',
      'type: task-pack',
      'generated_by: spec-write-tasks',
      'status: derived',
      'mode: derived',
      'spec_id: example',
      `source_plan: "${sourcePlan}" # lifecycle owner`,
      `source_plan_hash: ${sourcePlanHash}`,
      '---',
      '# Tasks',
      '',
      '## Task Pack Contract',
      '',
      '```json',
      JSON.stringify(contract, null, 2),
      '```',
      '',
    ].join('\n');
    fs.writeFileSync(path.join(root, taskPack), taskPackContent, 'utf8');

    const validation = runCli(root, ['tasks', 'validate', taskPack, '--repo', root, '--json']);
    expect(validation.status).toBe(0);
    const validationPayload = JSON.parse(validation.stdout);
    expect(validationPayload.deterministic_handoff).toBe(true);
    expect(validationPayload.source_plan.path).toBe(sourcePlan);

    const result = runPlanStatus(root, 'complete', validationPayload.source_plan.path);

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).plan).toBe(sourcePlan);
    expect(fs.readFileSync(path.join(root, sourcePlan), 'utf8')).toContain('status: completed');
    expect(fs.readFileSync(path.join(root, taskPack), 'utf8')).toBe(taskPackContent);
  });
});
