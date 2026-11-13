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

function writeTaskPack(root, hash, files = ['src/example.js'], options = {}) {
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
      ...(options.taskTargetRepo ? { target_repo: options.taskTargetRepo } : {}),
      ...(options.taskContext || {}),
    }],
    execution_waves: [{ wave: '1', tasks: ['T1'] }],
  };
  const specIdLine = options.includeSpecId === false ? '' : `spec_id: ${options.specId || 'example'}\n`;
  const sourcePlan = options.sourcePlan || 'docs/plans/source.md';
  const content = `---\ntype: task-pack\ngenerated_by: spec-write-tasks\nstatus: derived\nmode: derived\n${specIdLine}source_plan: ${sourcePlan}\nsource_plan_hash: ${hash}\n---\n# Tasks\n\n## Task Pack Contract\n\n\`\`\`json\n${JSON.stringify(contract, null, 2)}\n\`\`\`\n`;
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

  test('同波次共享文件不能通过备注豁免，拆到不同波次后可执行', () => {
    const taskPath = writeTaskPack(tempRoot, computeSourcePlanHash(planPath).hash);
    const original = fs.readFileSync(taskPath, 'utf8');
    const block = original.match(/```json\n([\s\S]*?)\n```/);
    const contract = JSON.parse(block[1]);
    contract.tasks.push({ ...contract.tasks[0], task_id: 'T2', notes: 'Explicitly marked overlap accepted.' });
    contract.execution_waves[0].tasks.push('T2');
    const save = () => fs.writeFileSync(taskPath, original.replace(block[0], `\`\`\`json\n${JSON.stringify(contract)}\n\`\`\``));
    save();
    const rejected = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
    expect(rejected.status).toBe(1);
    expect(rejected.stdout).toContain('task-pack-same-wave-file-overlap');
    contract.tasks[1].wave = '2';
    contract.tasks[1].dependencies = ['T1'];
    contract.execution_waves = [{ wave: '1', tasks: ['T1'] }, { wave: '2', tasks: ['T2'] }];
    save();
    const accepted = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
    expect(accepted.status).toBe(0);
    expect(accepted.stdout).not.toContain('task-pack-same-wave-file-overlap');
  });

  test('hash --json returns the canonical plan hash', () => {
    const result = runCli(['tasks', 'hash', planPath, '--json'], tempRoot);
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout);
    expect(payload.schema_version).toBe('task-plan-hash/v1');
    expect(payload.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  test('full contract preserves proof refs, settled structure and external done intent for Work', () => {
    const taskContext = {
      context_refs: ['test/proof.test.js', 'test/support/fixture.js'],
      notes: 'Protect proof tests and their test-only seam. Preserve session-settled: separate owners.',
      risk_note: 'Historical RED is unobserved; do not invent it.',
      done_signal: 'Observe the configured external callback; Git state is not completion evidence.',
    };
    const taskPath = writeTaskPack(tempRoot, computeSourcePlanHash(planPath).hash, ['src/example.js'], { taskContext });
    const result = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
    expect(result.status).toBe(0);
    const receipt = JSON.parse(result.stdout);
    expect(receipt.task_pack.contract.tasks[0]).toMatchObject(taskContext);
    expect(receipt.validity_scope).toBe('identity-freshness-structure-only');
    fs.appendFileSync(planPath, '\nChanged proof ownership.\n');
    expect(runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot).status).toBe(1);
  });

  test.each(['existing', 'future', 'dangling', 'leaf'])('rejects %s task paths that traverse a symlink', (kind) => {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'task-pack-outside-'));
    try {
      fs.writeFileSync(path.join(outside, 'existing.js'), 'sentinel');
      let file = 'linked/existing.js';
      if (kind === 'leaf') {
        fs.symlinkSync(path.join(outside, 'existing.js'), path.join(tempRoot, 'linked.js'));
        file = 'linked.js';
      } else {
        fs.symlinkSync(kind === 'dangling' ? path.join(outside, 'missing') : outside, path.join(tempRoot, 'linked'), 'dir');
        if (kind !== 'existing') file = 'linked/future/new.js';
      }
      const taskPath = writeTaskPack(tempRoot, computeSourcePlanHash(planPath).hash, [file]);
      const result = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
      expect(result.status).toBe(1);
      expect(JSON.parse(result.stdout).deterministic_handoff).toBe(false);
      expect(fs.readdirSync(outside)).toEqual(['existing.js']);
      expect(fs.readFileSync(path.join(outside, 'existing.js'), 'utf8')).toBe('sentinel');
    } finally { fs.rmSync(outside, { recursive: true, force: true }); }
  });

  test.each(['.git/config', '.GIT/config', '.opencode/skills/example/SKILL.md', '.OpenCode/skills/example/SKILL.md', '.opencode/commands/spec-work.md', 'opencode.jsonc', '.zcode/spec-first/state.json', '.zcode/hooks/session-start', '.pi/spec-first/state.json'])('rejects Git metadata or generated runtime: %s', (file) => {
    const taskPath = writeTaskPack(tempRoot, computeSourcePlanHash(planPath).hash, [file]);
    const result = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).deterministic_handoff).toBe(false);
  });

  test('checks task paths in the selected child repo rather than the artifact root', () => {
    const child = path.join(tempRoot, 'child');
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'task-pack-child-outside-'));
    fs.mkdirSync(child);
    expect(spawnSync('git', ['init', '-q', child]).status).toBe(0);
    try {
      fs.symlinkSync(outside, path.join(child, 'src'), 'dir');
      const taskPath = writeTaskPack(tempRoot, computeSourcePlanHash(planPath).hash, ['src/new.js'], { taskTargetRepo: 'child' });
      expect(runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot).status).toBe(1);
      fs.unlinkSync(path.join(child, 'src'));
      const valid = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
      expect(valid.status).toBe(0);
      expect(JSON.parse(valid.stdout).task_pack.execution_focus[0].resolved_target_repo).toBe(fs.realpathSync(child));
    } finally { fs.rmSync(outside, { recursive: true, force: true }); }
  });

  test.each(['pack', 'source'])('uses the %s target_repo when no task override is present', (owner) => {
    const child = path.join(tempRoot, 'child');
    fs.mkdirSync(child);
    expect(spawnSync('git', ['init', '-q', child]).status).toBe(0);
    if (owner === 'source') fs.writeFileSync(planPath, '---\nspec_id: example\ntarget_repo: child\n---\n# Source Plan\n');
    const taskPath = writeTaskPack(tempRoot, computeSourcePlanHash(planPath).hash);
    if (owner === 'pack') fs.writeFileSync(taskPath, fs.readFileSync(taskPath, 'utf8').replace('status: derived', 'status: derived\ntarget_repo: child'));
    const result = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout).task_pack.execution_focus[0].resolved_target_repo).toBe(fs.realpathSync(child));
  });

  test('hash resolves relative paths from --repo and returns portable identity fields', () => {
    const sibling = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-task-pack-sibling-'));
    try {
      const result = runCli([
        'tasks',
        'hash',
        'docs/plans/source.md',
        '--repo',
        tempRoot,
        '--json',
      ], sibling);

      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout)).toEqual(expect.objectContaining({
        schema_version: 'task-plan-hash/v1',
        artifact_root: fs.realpathSync(tempRoot),
        source_plan: 'docs/plans/source.md',
        plan_path: fs.realpathSync(planPath),
      }));
    } finally {
      fs.rmSync(sibling, { recursive: true, force: true });
    }
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
    expect(JSON.parse(valid.stdout)).toEqual(expect.objectContaining({
      deterministic_handoff: true,
      identity_basis: 'source-plan-path+body-hash',
      artifact_root: fs.realpathSync(tempRoot),
      repo_root: fs.realpathSync(tempRoot),
    }));

    fs.appendFileSync(planPath, '\nChanged.\n');
    const stale = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
    expect(stale.status).toBe(1);
    expect(JSON.parse(stale.stdout).reason_code).toBe('stale_hash');
  });

  test('rejects superseded source plans for new hashes and existing task-pack execution', () => {
    fs.writeFileSync(
      planPath,
      '---\nspec_id: example\nstatus: superseded\nartifact_readiness: implementation-ready\nexecution: code\n---\n# Source Plan\n',
      'utf8',
    );
    const hash = computeSourcePlanHash(planPath).hash;
    const taskPath = writeTaskPack(tempRoot, hash);

    const hashResult = runCli(['tasks', 'hash', planPath, '--json'], tempRoot);
    expect(hashResult.status).toBe(2);
    expect(JSON.parse(hashResult.stdout).error.code).toBe('tasks-source-plan-non-active');

    const validateResult = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
    expect(validateResult.status).toBe(1);
    expect(JSON.parse(validateResult.stdout)).toEqual(expect.objectContaining({
      deterministic_handoff: false,
      reason_code: 'source_plan_non_active',
      validation: expect.objectContaining({ source_plan_lifecycle: 'non-active' }),
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'task-pack-source-plan-non-active' }),
      ]),
    }));
  });

  test('returns a machine-readable reason when the task pack cannot be read', () => {
    const result = runCli([
      'tasks', 'validate', 'docs/tasks/missing.md', '--repo', tempRoot, '--json',
    ], tempRoot);

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toEqual(expect.objectContaining({
      task_pack_validity: 'invalid',
      reason_code: 'invalid_contract',
      errors: expect.arrayContaining([
        expect.objectContaining({ code: 'task-pack-missing' }),
      ]),
    }));
  });

  test('accepts missing spec_id as an explicit trace limitation', () => {
    fs.writeFileSync(planPath, '# Source Plan\n', 'utf8');
    const hash = computeSourcePlanHash(planPath).hash;
    const taskPath = writeTaskPack(tempRoot, hash, ['src/example.js'], { includeSpecId: false });

    const result = runCli(['tasks', 'validate', 'docs/tasks/tasks.md', '--repo', tempRoot, '--json'], tempRoot);
    const payload = JSON.parse(result.stdout);

    expect(result.status).toBe(0);
    expect(payload.deterministic_handoff).toBe(true);
    expect(payload.validation.spec_id).toBe('missing');
    expect(payload.errors).toEqual([]);
    expect(payload.limitations).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'task-pack-spec-id-trace-missing' }),
    ]));
  });

  test.each([
    ['task pack only', true, false],
    ['source plan only', false, true],
  ])('accepts spec_id on %s as a trace limitation', (_label, taskHasSpecId, planHasSpecId) => {
    fs.writeFileSync(
      planPath,
      planHasSpecId ? '---\nspec_id: example\n---\n# Source Plan\n' : '# Source Plan\n',
      'utf8',
    );
    const taskPath = writeTaskPack(tempRoot, computeSourcePlanHash(planPath).hash, ['src/example.js'], {
      includeSpecId: taskHasSpecId,
    });

    const result = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
    const payload = JSON.parse(result.stdout);

    expect(result.status).toBe(0);
    expect(payload.validation.spec_id).toBe('missing');
    expect(payload.limitations.map((entry) => entry.code)).toContain('task-pack-spec-id-trace-missing');
  });

  test('rejects mismatched spec_id even when the source-plan hash matches', () => {
    const taskPath = writeTaskPack(tempRoot, computeSourcePlanHash(planPath).hash, ['src/example.js'], {
      specId: 'different-chain',
    });

    const result = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
    const payload = JSON.parse(result.stdout);

    expect(result.status).toBe(1);
    expect(payload.task_pack_validity).toBe('wrong-chain');
    expect(payload.reason_code).toBe('wrong_chain');
    expect(payload.validation.spec_id).toBe('mismatch');
  });

  test('resolves task-pack operands from --repo instead of the caller cwd', () => {
    const taskPath = writeTaskPack(tempRoot, computeSourcePlanHash(planPath).hash);
    const sibling = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-task-pack-sibling-'));
    try {
      const result = runCli([
        'tasks',
        'validate',
        path.relative(tempRoot, taskPath),
        '--repo',
        tempRoot,
        '--json',
      ], sibling);

      expect(result.status).toBe(0);
      expect(JSON.parse(result.stdout).task_pack_path).toBe(fs.realpathSync(taskPath));
    } finally {
      fs.rmSync(sibling, { recursive: true, force: true });
    }
  });

  test('rejects command operands outside the artifact root', () => {
    const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-task-pack-outside-'));
    try {
      const outsidePlan = path.join(outsideRoot, 'outside.md');
      fs.writeFileSync(outsidePlan, '# Outside\n', 'utf8');

      const hashResult = runCli(['tasks', 'hash', outsidePlan, '--repo', tempRoot, '--json'], tempRoot);
      const validateResult = runCli(['tasks', 'validate', outsidePlan, '--repo', tempRoot, '--json'], tempRoot);

      expect(hashResult.status).toBe(2);
      expect(JSON.parse(hashResult.stdout).error.code).toBe('tasks-plan-outside-artifact-root');
      expect(validateResult.status).toBe(2);
      expect(JSON.parse(validateResult.stdout).error.code).toBe('tasks-task-pack-outside-artifact-root');
    } finally {
      fs.rmSync(outsideRoot, { recursive: true, force: true });
    }
  });

  test('rejects source-plan symlink escape from the artifact root', () => {
    const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-task-pack-outside-'));
    try {
      const outsidePlan = path.join(outsideRoot, 'source.md');
      fs.writeFileSync(outsidePlan, '---\nspec_id: example\n---\n# Outside\n', 'utf8');
      const linkPath = path.join(tempRoot, 'docs/plans/source-link.md');
      fs.symlinkSync(outsidePlan, linkPath, 'file');
      const taskPath = writeTaskPack(
        tempRoot,
        computeSourcePlanHash(outsidePlan).hash,
        ['src/example.js'],
        { sourcePlan: 'docs/plans/source-link.md' },
      );

      const result = runCli(['tasks', 'validate', taskPath, '--repo', tempRoot, '--json'], tempRoot);
      const payload = JSON.parse(result.stdout);

      expect(result.status).toBe(1);
      expect(payload.validation.source_plan_path).toBe('invalid');
      expect(payload.errors.map((entry) => entry.code)).toContain('task-pack-source-plan-symlink-escape');
    } finally {
      fs.rmSync(outsideRoot, { recursive: true, force: true });
    }
  });

  test('rejects task-pack symlink escape from the artifact root', () => {
    const outsideRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-task-pack-outside-'));
    try {
      const outsideTaskPack = path.join(outsideRoot, 'tasks.md');
      fs.writeFileSync(outsideTaskPack, '# Outside task pack\n', 'utf8');
      const linkPath = path.join(tempRoot, 'docs/tasks/tasks-link.md');
      fs.mkdirSync(path.dirname(linkPath), { recursive: true });
      fs.symlinkSync(outsideTaskPack, linkPath, 'file');

      const result = runCli([
        'tasks',
        'validate',
        'docs/tasks/tasks-link.md',
        '--repo',
        tempRoot,
        '--json',
      ], tempRoot);

      expect(result.status).toBe(2);
      expect(JSON.parse(result.stdout).error.code).toBe('tasks-task-pack-outside-artifact-root');
    } finally {
      fs.rmSync(outsideRoot, { recursive: true, force: true });
    }
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
    const rootFile = path.join(tempRoot, 'not-a-directory');
    fs.writeFileSync(rootFile, 'not a directory\n', 'utf8');

    expect(runCli(['tasks', 'hash', '--json'], tempRoot).status).toBe(2);
    expect(runCli(['tasks', 'hash', planPath, '--bad', '--json'], tempRoot).status).toBe(2);
    expect(runCli(['tasks', 'hash', planPath, '--repo', '--json'], tempRoot).status).toBe(2);
    expect(runCli(['tasks', 'validate', 'docs/tasks/tasks.md', '--repo', '--json'], tempRoot).status).toBe(2);
    expect(runCli(['tasks', 'hash', planPath, '--repo', path.join(tempRoot, 'missing'), '--json'], tempRoot).status)
      .toBe(2);
    const notDirectory = runCli(['tasks', 'hash', planPath, '--repo', rootFile, '--json'], tempRoot);
    expect(notDirectory.status).toBe(2);
    expect(JSON.parse(notDirectory.stdout).error.code).toBe('tasks-repo-not-directory');
  });
});
