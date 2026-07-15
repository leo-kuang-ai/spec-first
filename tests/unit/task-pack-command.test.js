'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const {
  computeSourcePlanHash,
  parseFrontmatterScalars,
} = require('../../src/cli/task-pack');

const repoRoot = path.resolve(__dirname, '../..');
const cliPath = path.join(repoRoot, 'bin/spec-first.js');

function runCli(args, cwd) {
  return spawnSync(process.execPath, [cliPath, ...args], { cwd, encoding: 'utf8' });
}

function writeTaskPack(root, hash, files = ['src/example.js']) {
  const contract = {
    schema_version: 'task-pack/v1',
    tasks: [{
      task_id: 'T1',
      source_unit: 'U1',
      dependencies: [],
      files,
      goal: 'Implement the example behavior.',
      test_focus: 'Verify the example behavior.',
      done_signal: 'Focused tests pass.',
      wave: '1',
      stop_if: 'The source plan is stale.',
    }],
    execution_waves: [{ wave: '1', tasks: ['T1'] }],
  };
  const content = `---\ntype: task-pack\ngenerated_by: spec-write-tasks\nstatus: derived\nmode: derived\nspec_id: example\nsource_plan: docs/plans/source.md\nsource_plan_hash: ${hash}\n---\n# Tasks\n\n## Task Pack Contract\n\n\`\`\`json\n${JSON.stringify(contract, null, 2)}\n\`\`\`\n`;
  const taskPath = path.join(root, 'docs/tasks/tasks.md');
  fs.mkdirSync(path.dirname(taskPath), { recursive: true });
  fs.writeFileSync(taskPath, content, 'utf8');
  return taskPath;
}

describe('spec-first tasks command', () => {
  let tempRoot;
  let planPath;

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-task-pack-'));
    planPath = path.join(tempRoot, 'docs/plans/source.md');
    fs.mkdirSync(path.dirname(planPath), { recursive: true });
    fs.writeFileSync(planPath, '---\nspec_id: example\n---\n# Source Plan\n', 'utf8');
  });

  afterEach(() => fs.rmSync(tempRoot, { recursive: true, force: true }));

  test('hash --json returns the canonical plan hash', () => {
    const result = runCli(['tasks', 'hash', planPath, '--json'], tempRoot);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.schema_version).toBe('task-plan-hash/v1');
    expect(payload.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  test('keeps source-plan-body-v1 hashing compatible after extracting frontmatter parsing', () => {
    fs.writeFileSync(
      planPath,
      '---\r\nstatus: "active" # lifecycle\r\nspec_id: example\r\n---\r\n# Source Plan\r\n',
      'utf8',
    );
    const result = computeSourcePlanHash(planPath);
    const expected = crypto.createHash('sha256').update('# Source Plan\n', 'utf8').digest('hex');

    expect(result).toEqual({
      ok: true,
      hash: `sha256:${expected}`,
      canonicalization_version: 'source-plan-body-v1',
      removed_frontmatter: true,
      canonical_body_bytes: Buffer.byteLength('# Source Plan\n', 'utf8'),
    });
    expect(parseFrontmatterScalars('status: "derived" # lifecycle\nsource_plan: docs/plans/source.md\n'))
      .toEqual({ status: 'derived', source_plan: 'docs/plans/source.md' });
  });

  test('validates a current task pack and rejects stale hashes', () => {
    const hash = computeSourcePlanHash(planPath).hash;
    const taskPath = writeTaskPack(tempRoot, hash);
    const valid = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
    expect(valid.status).toBe(0);
    expect(JSON.parse(valid.stdout).deterministic_handoff).toBe(true);

    fs.appendFileSync(planPath, '\nChanged.\n');
    const stale = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
    expect(stale.status).toBe(1);
    expect(JSON.parse(stale.stdout).reason_code).toBe('stale_hash');
  });

  test('rejects duplicate source_plan ownership metadata', () => {
    const hash = computeSourcePlanHash(planPath).hash;
    const taskPath = writeTaskPack(tempRoot, hash);
    const content = fs.readFileSync(taskPath, 'utf8');
    fs.writeFileSync(
      taskPath,
      content.replace(
        'source_plan: docs/plans/source.md\n',
        'source_plan: docs/plans/other.md\nsource_plan: docs/plans/source.md\n',
      ),
      'utf8',
    );

    const result = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toEqual(expect.objectContaining({
      deterministic_handoff: false,
      reason_code: 'invalid_contract',
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'task-pack-source-plan-duplicate' }),
      ]),
    }));
  });

  test('rejects generated runtime task targets', () => {
    const taskPath = writeTaskPack(tempRoot, computeSourcePlanHash(planPath).hash, ['.claude/skills/example.md']);
    const result = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).errors.map((error) => error.code))
      .toContain('task-pack-task-file-generated-runtime');
  });

  test('returns usage errors for missing paths and unknown options', () => {
    expect(runCli(['tasks', 'hash', '--json'], tempRoot).status).toBe(2);
    expect(runCli(['tasks', 'hash', planPath, '--bad', '--json'], tempRoot).status).toBe(2);
  });
});
