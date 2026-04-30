'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { runTasks } = require('../../src/cli/commands/tasks');
const {
  computeSourcePlanHash,
  validateTaskPack,
} = require('../../src/cli/task-pack');

const REPO_ROOT = path.join(__dirname, '..', '..');
const VALID_PLAN = path.join(REPO_ROOT, 'tests/fixtures/spec-write-tasks/valid/source-plan.md');
const VALID_TASK_PACK = path.join(REPO_ROOT, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');

function copyFixtureProject() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-task-pack-'));
  fs.mkdirSync(path.join(tmp, 'tests/fixtures/spec-write-tasks/valid'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'src/cli'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'tests/unit'), { recursive: true });
  fs.copyFileSync(VALID_PLAN, path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/source-plan.md'));
  fs.copyFileSync(VALID_TASK_PACK, path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md'));
  fs.writeFileSync(path.join(tmp, 'src/cli/task-pack.js'), '');
  fs.writeFileSync(path.join(tmp, 'tests/unit/task-pack-command.test.js'), '');
  return tmp;
}

function captureStdout(fn) {
  const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const errorSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  try {
    const code = fn();
    const stdout = outputSpy.mock.calls.map((call) => String(call[0])).join('');
    const stderr = errorSpy.mock.calls.map((call) => String(call[0])).join('');
    return { code, stdout, stderr };
  } finally {
    outputSpy.mockRestore();
    errorSpy.mockRestore();
  }
}

function replaceTaskPackContract(taskPackPath, mutate) {
  const text = fs.readFileSync(taskPackPath, 'utf8');
  const contract = JSON.parse(text.match(/```json\s*([\s\S]*?)\s*```/)[1]);
  mutate(contract);
  fs.writeFileSync(taskPackPath, text.replace(/```json\s*([\s\S]*?)\s*```/, `\`\`\`json\n${JSON.stringify(contract, null, 2)}\n\`\`\``));
}

describe('task pack hash and validation', () => {
  test('computes canonical source plan body hash without frontmatter', () => {
    const result = computeSourcePlanHash(VALID_PLAN);

    expect(result.ok).toBe(true);
    expect(result.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.removed_frontmatter).toBe(true);
    expect(result.canonicalization_version).toBe('source-plan-body-v1');
  });

  test('valid task pack returns deterministic handoff', () => {
    const result = validateTaskPack(VALID_TASK_PACK, { repoRoot: REPO_ROOT });

    expect(result.task_pack_validity).toBe('valid');
    expect(result.deterministic_handoff).toBe(true);
    expect(result.validation.spec_id).toBe('matched');
    expect(result.validation.source_plan_hash).toBe('matched');
    expect(result.task_pack.execution_focus[0]).toEqual(expect.objectContaining({
      task_id: 'T001',
      source_unit: 'U1',
      wave: 1,
    }));
  });

  test('stale task pack is rejected', () => {
    const tmp = copyFixtureProject();
    try {
      fs.appendFileSync(path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/source-plan.md'), '\nChanged after task compilation.\n');

      const result = validateTaskPack(path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md'), { repoRoot: tmp });

      expect(result.task_pack_validity).toBe('stale');
      expect(result.deterministic_handoff).toBe(false);
      expect(result.validation.source_plan_hash).toBe('mismatch');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-stale');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('wrong-chain task pack is rejected', () => {
    const tmp = copyFixtureProject();
    try {
      const planPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/source-plan.md');
      fs.writeFileSync(planPath, fs.readFileSync(planPath, 'utf8').replace(
        'spec_id: 2026-04-26-999-task-pack-fixture',
        'spec_id: 2026-04-26-998-other-chain'
      ));
      const hash = computeSourcePlanHash(planPath).hash;
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      fs.writeFileSync(taskPackPath, fs.readFileSync(taskPackPath, 'utf8').replace(
        /^source_plan_hash: sha256:[a-f0-9]{64}$/m,
        `source_plan_hash: ${hash}`
      ));

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.task_pack_validity).toBe('wrong-chain');
      expect(result.validation.spec_id).toBe('mismatch');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-wrong-chain');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('missing task pack identity is rejected', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      fs.writeFileSync(taskPackPath, fs.readFileSync(taskPackPath, 'utf8').replace(
        /^spec_id: .+\n/m,
        ''
      ));

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.task_pack_validity).toBe('invalid');
      expect(result.deterministic_handoff).toBe(false);
      expect(result.validation.spec_id).toBe('missing');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-missing-spec-id');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('source plan missing spec_id is rejected as unverifiable identity', () => {
    const tmp = copyFixtureProject();
    try {
      const planPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/source-plan.md');
      fs.writeFileSync(planPath, fs.readFileSync(planPath, 'utf8').replace(
        /^spec_id: .+\n/m,
        ''
      ));
      const hash = computeSourcePlanHash(planPath).hash;
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      fs.writeFileSync(taskPackPath, fs.readFileSync(taskPackPath, 'utf8').replace(
        /^source_plan_hash: sha256:[a-f0-9]{64}$/m,
        `source_plan_hash: ${hash}`
      ));

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.task_pack_validity).toBe('invalid');
      expect(result.deterministic_handoff).toBe(false);
      expect(result.validation.spec_id).toBe('missing');
      expect(result.errors.map((error) => error.code)).toContain('source-plan-missing-spec-id');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('missing source plan path is rejected without resolving relative to task pack directory', () => {
    const tmp = copyFixtureProject();
    try {
      const nestedDir = path.join(tmp, 'docs/tasks');
      fs.mkdirSync(nestedDir, { recursive: true });
      const taskPackPath = path.join(nestedDir, 'nested-task-pack.md');
      fs.copyFileSync(path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md'), taskPackPath);
      fs.writeFileSync(taskPackPath, fs.readFileSync(taskPackPath, 'utf8').replace(
        'source_plan: tests/fixtures/spec-write-tasks/valid/source-plan.md',
        'source_plan: docs/plans/missing-plan.md'
      ));

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.validation.source_plan_path).toBe('missing');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-source-plan-file-missing');
      expect(result.source_plan.absolute_path).toBe(path.join(tmp, 'docs/plans/missing-plan.md'));
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('absolute source plan path is rejected', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      fs.writeFileSync(taskPackPath, fs.readFileSync(taskPackPath, 'utf8').replace(
        'source_plan: tests/fixtures/spec-write-tasks/valid/source-plan.md',
        `source_plan: ${path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/source-plan.md')}`
      ));

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.validation.source_plan_path).toBe('invalid');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-source-plan-invalid');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('source plan path must be concrete repo-relative POSIX path', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      fs.writeFileSync(taskPackPath, fs.readFileSync(taskPackPath, 'utf8').replace(
        'source_plan: tests/fixtures/spec-write-tasks/valid/source-plan.md',
        'source_plan: docs\\plans\\source-plan.md'
      ));

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.validation.source_plan_path).toBe('invalid');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-source-plan-invalid');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('source plan path outside repo is rejected', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      fs.writeFileSync(taskPackPath, fs.readFileSync(taskPackPath, 'utf8').replace(
        'source_plan: tests/fixtures/spec-write-tasks/valid/source-plan.md',
        'source_plan: ../outside-plan.md'
      ));

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.validation.source_plan_path).toBe('invalid');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-source-plan-invalid');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('source plan path must not contain dot, parent, or empty segments', () => {
    const segmentCases = [
      'tests/fixtures/spec-write-tasks/valid/../valid/source-plan.md',
      'tests/fixtures/spec-write-tasks//valid/source-plan.md',
    ];

    for (const sourcePlan of segmentCases) {
      const tmp = copyFixtureProject();
      try {
        const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
        fs.writeFileSync(taskPackPath, fs.readFileSync(taskPackPath, 'utf8').replace(
          'source_plan: tests/fixtures/spec-write-tasks/valid/source-plan.md',
          `source_plan: ${sourcePlan}`
        ));

        const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

        expect(result.deterministic_handoff).toBe(false);
        expect(result.validation.source_plan_path).toBe('invalid');
        expect(result.errors.map((error) => error.code)).toContain('task-pack-source-plan-invalid');
      } finally {
        fs.rmSync(tmp, { recursive: true, force: true });
      }
    }
  });

  test('missing Task Pack Contract is rejected', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      fs.writeFileSync(taskPackPath, fs.readFileSync(taskPackPath, 'utf8').replace(/## Task Pack Contract[\s\S]*?## Task Cards/, '## Task Cards'));

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.validation.task_pack_contract).toBe('invalid');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-contract-missing');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('invalid Task Pack Contract JSON is rejected', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      fs.writeFileSync(taskPackPath, fs.readFileSync(taskPackPath, 'utf8').replace(/```json\s*([\s\S]*?)\s*```/, '```json\n{ invalid json\n```'));

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.validation.task_pack_contract).toBe('invalid');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-contract-json-invalid');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('ambiguous Task Pack Contract JSON blocks are rejected', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      fs.writeFileSync(taskPackPath, fs.readFileSync(taskPackPath, 'utf8').replace(
        /```json\s*([\s\S]*?)\s*```/,
        (match) => `${match}\n\n\`\`\`json\n{}\n\`\`\``
      ));

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.validation.task_pack_contract).toBe('invalid');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-contract-json-ambiguous');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('same-wave file overlap is rejected', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.execution_waves[0].tasks.push('T002');
        contract.tasks.push({
          ...contract.tasks[0],
          task_id: 'T002',
          dependencies: [],
        });
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.map((error) => error.code)).toContain('task-pack-same-wave-file-overlap');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('task file paths must use repo-relative POSIX separators', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.tasks[0].files = ['src\\cli\\task-pack.js'];
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-file-not-concrete');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('task file paths must not contain dot, parent, or empty segments', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.tasks[0].files = ['src/../package.json', './src/cli/task-pack.js', 'src//cli/task-pack.js'];
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.filter((error) => error.code === 'task-pack-task-file-not-concrete')).toHaveLength(3);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('task files must include at least one concrete file path', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.tasks[0].files = [];
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-files-empty');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('task pack contract must include at least one task and execution wave', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.tasks = [];
        contract.execution_waves = [];
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.map((error) => error.code)).toContain('task-pack-contract-tasks-empty');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-contract-execution-waves-empty');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('documented optional task fields are accepted by the validator', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.tasks[0].notes = 'Human-readable context.';
        contract.tasks[0].review_focus = 'Check task pack boundary clarity.';
        contract.tasks[0].handoff_owner = 'executor';
        contract.tasks[0].target_repo = 'packages/spec-first';
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(true);
      expect(result.limitations.map((limitation) => limitation.code)).not.toContain('task-pack-task-unknown-field');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('optional quality fields must be strings when provided', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.tasks[0].notes = ['not string'];
        contract.tasks[0].review_focus = { text: 'not string' };
        contract.tasks[0].handoff_owner = 123;
        contract.tasks[0].target_repo = false;
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-notes-invalid');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-review-focus-invalid');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-handoff-owner-invalid');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-target-repo-invalid');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('validate --json reports invalid optional quality field types', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.tasks[0].target_repo = { repo: 'bad' };
      });

      const { code, stdout } = captureStdout(() => runTasks(['validate', taskPackPath, '--repo', tmp, '--json']));
      const payload = JSON.parse(stdout);

      expect(code).toBe(1);
      expect(payload.deterministic_handoff).toBe(false);
      expect(payload.errors.map((error) => error.code)).toContain('task-pack-task-target-repo-invalid');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('task must be listed in its declared execution wave', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.execution_waves[0].tasks = [];
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-wave-not-listed');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('dependencies must be in earlier execution waves', () => {
    const tmp = copyFixtureProject();
    try {
      fs.mkdirSync(path.join(tmp, 'src/cli/commands'), { recursive: true });
      fs.writeFileSync(path.join(tmp, 'src/cli/commands/tasks.js'), '');
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.execution_waves.push({ wave: 2, tasks: ['T002'] });
        contract.tasks[0].dependencies = ['T002'];
        contract.tasks.push({
          task_id: 'T002',
          source_unit: 'U1',
          requirement_refs: ['R1'],
          goal: 'Provide a later-wave dependency fixture.',
          dependencies: [],
          files: ['src/cli/commands/tasks.js'],
          test_focus: 'Dependency wave validation.',
          done_signal: 'Validator rejects later-wave dependency.',
          wave: 2,
          stop_if: 'Dependency validation requires semantic ordering judgment.',
        });
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-dependency-wave-invalid');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('malformed task entries are rejected without throwing', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.execution_waves[0].tasks.push('T002');
        contract.tasks.push(null);
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-invalid');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('required task string fields must be non-empty strings', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.tasks[0].goal = { text: 'not a string' };
        contract.tasks[0].test_focus = 0;
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-goal-invalid');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-test-focus-invalid');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('stop_if is required for executable task cards', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        delete contract.tasks[0].stop_if;
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-missing-stop-if');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('parallelizable must be boolean when provided', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.tasks[0].parallelizable = 'yes';
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-parallelizable-invalid');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('task cannot be listed in multiple execution waves', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.execution_waves.push({ wave: 2, tasks: ['T001'] });
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.map((error) => error.code)).toContain('task-pack-wave-task-multiple-waves');
      expect(result.errors.map((error) => error.code)).toContain('task-pack-task-wave-list-mismatch');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('execution wave id must be string or number', () => {
    const tmp = copyFixtureProject();
    try {
      const taskPackPath = path.join(tmp, 'tests/fixtures/spec-write-tasks/valid/task-pack.md');
      replaceTaskPackContract(taskPackPath, (contract) => {
        contract.execution_waves[0].wave = { id: 1 };
      });

      const result = validateTaskPack(taskPackPath, { repoRoot: tmp });

      expect(result.deterministic_handoff).toBe(false);
      expect(result.errors.map((error) => error.code)).toContain('task-pack-wave-id-invalid');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('tasks CLI', () => {
  test('hash prints canonical sha by default', () => {
    const { code, stdout } = captureStdout(() => runTasks(['hash', VALID_PLAN]));

    expect(code).toBe(0);
    expect(stdout.trim()).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  test('validate --json reports valid handoff', () => {
    const { code, stdout } = captureStdout(() => runTasks(['validate', VALID_TASK_PACK, `--repo=${REPO_ROOT}`, '--json']));
    const payload = JSON.parse(stdout);

    expect(code).toBe(0);
    expect(payload.task_pack_validity).toBe('valid');
    expect(payload.deterministic_handoff).toBe(true);
  });

  test('validate accepts --repo as a separate argument', () => {
    const { code, stdout } = captureStdout(() => runTasks(['validate', '--repo', REPO_ROOT, VALID_TASK_PACK, '--json']));
    const payload = JSON.parse(stdout);

    expect(code).toBe(0);
    expect(payload.task_pack_validity).toBe('valid');
  });

  test('missing positional errors stay JSON parseable with --json', () => {
    const hashResult = captureStdout(() => runTasks(['hash', '--json']));
    const validateResult = captureStdout(() => runTasks(['validate', '--json']));

    expect(hashResult.code).toBe(1);
    expect(JSON.parse(hashResult.stdout).error.code).toBe('tasks-plan-path-required');
    expect(validateResult.code).toBe(1);
    expect(JSON.parse(validateResult.stdout).error.code).toBe('tasks-task-pack-path-required');
  });

  test('unknown subcommand errors stay JSON parseable with --json', () => {
    const { code, stdout } = captureStdout(() => runTasks(['unknown', '--json']));

    expect(code).toBe(1);
    expect(JSON.parse(stdout).error.code).toBe('tasks-subcommand-unknown');
  });

  test('unknown subcommand options are rejected instead of ignored', () => {
    const hashResult = captureStdout(() => runTasks(['hash', '--bogus', VALID_PLAN, '--json']));
    const validateResult = captureStdout(() => runTasks(['validate', VALID_TASK_PACK, '--bogus', `--repo=${REPO_ROOT}`, '--json']));

    expect(hashResult.code).toBe(1);
    expect(JSON.parse(hashResult.stdout).error).toEqual({
      code: 'tasks-unknown-option',
      message: 'unknown option: --bogus',
    });
    expect(validateResult.code).toBe(1);
    expect(JSON.parse(validateResult.stdout).error).toEqual({
      code: 'tasks-unknown-option',
      message: 'unknown option: --bogus',
    });
  });

  test('validate rejects repo flag without a value', () => {
    const separateFlag = captureStdout(() => runTasks(['validate', VALID_TASK_PACK, '--repo', '--json']));
    const equalsFlag = captureStdout(() => runTasks(['validate', VALID_TASK_PACK, '--repo=', '--json']));

    expect(separateFlag.code).toBe(1);
    expect(JSON.parse(separateFlag.stdout).error).toEqual({
      code: 'tasks-repo-path-required',
      message: 'repo path is required after --repo',
    });
    expect(equalsFlag.code).toBe(1);
    expect(JSON.parse(equalsFlag.stdout).error).toEqual({
      code: 'tasks-repo-path-required',
      message: 'repo path is required after --repo',
    });
  });
});
