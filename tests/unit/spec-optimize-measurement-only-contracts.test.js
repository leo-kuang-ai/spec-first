'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('spec-optimize measurement-only calibration', () => {
  const validator = path.resolve('skills/spec-optimize/scripts/measurement-admission.cjs');
  const skill = read('skills/spec-optimize/SKILL.md');
  const reference = read('skills/spec-optimize/references/measurement-only-calibration.md');
  const specSchema = read('skills/spec-optimize/references/optimize-spec-schema.yaml');
  const logSchema = read('skills/spec-optimize/references/experiment-log-schema.yaml');

  function validAdmission(overrides = {}) {
    return {
      schema_version: 'spec-optimize-measurement-admission/v1',
      baseline_identity: 'a'.repeat(40),
      candidate_identity: 'b'.repeat(40),
      task_or_corpus_identity: `sha256:${'c'.repeat(64)}`,
      harness_identity: `sha256:${'d'.repeat(64)}`,
      environment_identity: `sha256:${'e'.repeat(64)}`,
      sample_seed: 42,
      metric: {
        name: 'quality_score',
        direction: 'maximize',
        aggregation: 'median',
      },
      aa_repetitions: 2,
      preregistered_acceptance_threshold: 0.03,
      noise_ceiling: 0.01,
      broken_run_policy: {
        max_retries: 1,
        synthetic_scores: false,
      },
      stop_budget: {
        max_attempts: 6,
        timeout_seconds: 600,
      },
      ...overrides,
    };
  }

  function runValidator(command, payload) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-optimize-admission-'));
    const input = path.join(root, 'input.json');
    fs.writeFileSync(input, `${JSON.stringify(payload, null, 2)}\n`);
    try {
      const result = spawnSync(process.execPath, [validator, command, '--input', input], {
        encoding: 'utf8',
      });
      return {
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
        payload: result.stdout ? JSON.parse(result.stdout) : null,
      };
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  }

  test('requires frozen identities, A/A noise floor, and preregistered threshold before A/B', () => {
    expect(skill).toContain('mode:measurement-only');
    for (const field of [
      'baseline_identity',
      'candidate_identity',
      'task_or_corpus_identity',
      'preregistered_acceptance_threshold',
      'noise_ceiling',
    ]) {
      expect(specSchema).toContain(field);
    }
    expect(reference).toContain('at least two baseline-vs-baseline A/A repetitions');
    expect(reference).toContain('noise-floor-too-high');
    expect(reference).toMatch(/Do not infer a threshold after observing A\/A or A\/B results/);
    expect(skill).toContain('scripts/measurement-admission.cjs admit');
    expect(skill).toContain('scripts/measurement-admission.cjs');
    expect(skill).toContain('allow-ab');
    expect(reference).toContain('admission_sha256');
    for (const requiredField of [
      'harness_identity',
      'environment_identity',
      'sample_seed',
      'broken_run_policy',
      'stop_budget',
    ]) {
      expect(specSchema).toContain(requiredField);
    }
  });

  test('keeps broken runs out of scores and emits measurement-only outcomes', () => {
    for (const outcome of [
      'harness-error',
      'timeout',
      'environment-drift',
      'gate-failed',
      'not-run',
    ]) {
      expect(reference).toContain(outcome);
    }
    expect(reference).toContain('Broken runs never receive a synthetic score');
    expect(logSchema).toContain('measurement_calibration');
    expect(logSchema).toContain('eligible-for-owner-evaluation');
  });

  test('does not own Skill mutation, promotion, commit, or landing', () => {
    expect(skill).toContain('does not mutate either arm, any Skill package');
    expect(skill).toMatch(/does not select a winner for\s+integration/);
    expect(reference).toContain('never edits a Skill');
    expect(reference).toMatch(/not an\s+authoring, mutation, integration, or promotion workflow/);

    const diff = spawnSync('git', ['diff', '--name-only', '--', 'skills/spec-write-skill'], {
      encoding: 'utf8',
    });
    expect(diff.status).toBe(0);
    expect(diff.stdout.trim()).toBe('');
  });

  test('admits only complete frozen measurement inputs and emits a stable digest', () => {
    const first = runValidator('admit', validAdmission());
    const second = runValidator('admit', validAdmission());

    expect(first.status).toBe(0);
    expect(first.payload).toMatchObject({
      status: 'admitted',
      reason_code: 'measurement-admission-valid',
      schema_version: 'spec-optimize-measurement-admission/v1',
    });
    expect(first.payload.admission_sha256).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(second.payload.admission_sha256).toBe(first.payload.admission_sha256);
  });

  test('rejects missing frozen identities and fewer than two A/A repetitions', () => {
    const result = runValidator('admit', validAdmission({
      harness_identity: '',
      aa_repetitions: 1,
    }));

    expect(result.status).toBe(1);
    expect(result.payload.reason_code).toBe('measurement-admission-incomplete');
    expect(result.payload.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: 'harness_identity' }),
      expect.objectContaining({ field: 'aa_repetitions' }),
    ]));
  });

  test('blocks A/B when A/A noise exceeds the preregistered ceiling', () => {
    const admission = runValidator('admit', validAdmission()).payload;
    const result = runValidator('allow-ab', {
      admission: admission.normalized_admission,
      admission_sha256: admission.admission_sha256,
      aa_attempts: [
        { status: 'completed', admission_sha256: admission.admission_sha256, score: 0.001 },
        { status: 'completed', admission_sha256: admission.admission_sha256, score: 0.02 },
      ],
      observed_noise_floor: 0.02,
    });

    expect(result.status).toBe(1);
    expect(result.payload).toMatchObject({
      reason_code: 'noise-floor-too-high',
      ab_allowed: false,
    });
  });

  test('rejects synthetic scores on broken runs and allows stable completed A/A', () => {
    const admission = runValidator('admit', validAdmission()).payload;
    const invalid = runValidator('allow-ab', {
      admission: admission.normalized_admission,
      admission_sha256: admission.admission_sha256,
      aa_attempts: [
        { status: 'harness-error', admission_sha256: admission.admission_sha256, score: 0 },
        { status: 'completed', admission_sha256: admission.admission_sha256, score: 0.002 },
      ],
      observed_noise_floor: 0.002,
    });
    expect(invalid.status).toBe(1);
    expect(invalid.payload.reason_code).toBe('aa-calibration-invalid');

    const retryExceeded = runValidator('allow-ab', {
      admission: admission.normalized_admission,
      admission_sha256: admission.admission_sha256,
      aa_attempts: [
        { status: 'harness-error', admission_sha256: admission.admission_sha256 },
        { status: 'timeout', admission_sha256: admission.admission_sha256 },
        { status: 'completed', admission_sha256: admission.admission_sha256, score: 0.001 },
        { status: 'completed', admission_sha256: admission.admission_sha256, score: 0.002 },
      ],
      observed_noise_floor: 0.002,
    });
    expect(retryExceeded.status).toBe(1);
    expect(retryExceeded.payload.reason_code).toBe('aa-calibration-invalid');

    const valid = runValidator('allow-ab', {
      admission: admission.normalized_admission,
      admission_sha256: admission.admission_sha256,
      aa_attempts: [
        { status: 'completed', admission_sha256: admission.admission_sha256, score: 0.001 },
        { status: 'completed', admission_sha256: admission.admission_sha256, score: 0.002 },
      ],
      observed_noise_floor: 0.002,
    });
    expect(valid.status).toBe(0);
    expect(valid.payload).toMatchObject({
      reason_code: 'aa-calibration-passed',
      ab_allowed: true,
    });
  });
});
