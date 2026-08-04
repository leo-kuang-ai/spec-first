#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const SCHEMA_VERSION = 'spec-optimize-measurement-admission/v1';
const IMMUTABLE_SOURCE_ID = /^(?:[a-f0-9]{40}|sha256:[a-f0-9]{64})$/;
const CONTENT_ID = /^sha256:[a-f0-9]{64}$/;
const DIRECTIONS = new Set(['maximize', 'minimize']);
const AGGREGATIONS = new Set(['median', 'mean', 'min', 'max']);
const ATTEMPT_STATUSES = new Set([
  'completed',
  'harness-error',
  'timeout',
  'environment-drift',
  'gate-failed',
  'not-run',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function digest(value) {
  return `sha256:${crypto.createHash('sha256').update(stableJson(value)).digest('hex')}`;
}

function output(payload, exitCode) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exit(exitCode);
}

function reject(reasonCode, errors, extra = {}) {
  output({ status: 'rejected', reason_code: reasonCode, errors, ...extra }, 1);
}

function parseArgs(argv) {
  const command = argv[0] || '';
  let input = '';
  const errors = [];
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--input') {
      input = argv[index + 1] || '';
      index += 1;
    } else {
      errors.push(`unknown argument: ${arg}`);
    }
  }
  if (!['admit', 'allow-ab'].includes(command)) errors.push('command must be admit or allow-ab');
  if (!input) errors.push('--input is required');
  if (errors.length > 0) reject('invalid-arguments', errors);
  return { command, input: path.resolve(input) };
}

function readInput(file) {
  try {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('input must be a non-symlink regular file');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_error) {
    reject('measurement-input-invalid', ['input must contain valid JSON in a non-symlink regular file']);
  }
}

function fieldError(errors, field, reason) {
  errors.push({ field, reason });
}

function normalizeAdmission(input) {
  const errors = [];
  if (!isObject(input)) return { errors: [{ field: '$', reason: 'must-be-an-object' }], value: null };

  if (input.schema_version !== SCHEMA_VERSION) fieldError(errors, 'schema_version', 'unsupported-schema-version');
  for (const field of ['baseline_identity', 'candidate_identity']) {
    if (typeof input[field] !== 'string' || !IMMUTABLE_SOURCE_ID.test(input[field])) {
      fieldError(errors, field, 'must-be-a-full-git-sha-or-sha256');
    }
  }
  for (const field of ['task_or_corpus_identity', 'harness_identity', 'environment_identity']) {
    if (typeof input[field] !== 'string' || !CONTENT_ID.test(input[field])) {
      fieldError(errors, field, 'must-be-a-sha256-content-identity');
    }
  }
  if (!Number.isInteger(input.sample_seed)) fieldError(errors, 'sample_seed', 'must-be-an-integer');

  const metric = isObject(input.metric) ? input.metric : {};
  if (typeof metric.name !== 'string' || metric.name.trim() === '' || metric.name.length > 200) {
    fieldError(errors, 'metric.name', 'must-be-a-non-empty-string');
  }
  if (!DIRECTIONS.has(metric.direction)) fieldError(errors, 'metric.direction', 'must-be-maximize-or-minimize');
  if (!AGGREGATIONS.has(metric.aggregation)) fieldError(errors, 'metric.aggregation', 'unsupported-aggregation');

  if (!Number.isInteger(input.aa_repetitions) || input.aa_repetitions < 2) {
    fieldError(errors, 'aa_repetitions', 'must-be-at-least-2');
  }
  if (!isFiniteNumber(input.preregistered_acceptance_threshold)
    || input.preregistered_acceptance_threshold < 0) {
    fieldError(errors, 'preregistered_acceptance_threshold', 'must-be-a-non-negative-finite-number');
  }
  if (!isFiniteNumber(input.noise_ceiling) || input.noise_ceiling < 0) {
    fieldError(errors, 'noise_ceiling', 'must-be-a-non-negative-finite-number');
  }

  const brokenRunPolicy = isObject(input.broken_run_policy) ? input.broken_run_policy : {};
  if (!Number.isInteger(brokenRunPolicy.max_retries) || brokenRunPolicy.max_retries < 0) {
    fieldError(errors, 'broken_run_policy.max_retries', 'must-be-a-non-negative-integer');
  }
  if (brokenRunPolicy.synthetic_scores !== false) {
    fieldError(errors, 'broken_run_policy.synthetic_scores', 'must-be-false');
  }

  const stopBudget = isObject(input.stop_budget) ? input.stop_budget : {};
  if (!Number.isInteger(stopBudget.max_attempts) || stopBudget.max_attempts < 2) {
    fieldError(errors, 'stop_budget.max_attempts', 'must-be-at-least-2');
  } else if (Number.isInteger(input.aa_repetitions) && stopBudget.max_attempts < input.aa_repetitions) {
    fieldError(errors, 'stop_budget.max_attempts', 'must-cover-aa-repetitions');
  }
  if (!Number.isInteger(stopBudget.timeout_seconds) || stopBudget.timeout_seconds < 1) {
    fieldError(errors, 'stop_budget.timeout_seconds', 'must-be-a-positive-integer');
  }

  if (errors.length > 0) return { errors, value: null };
  return {
    errors: [],
    value: {
      schema_version: SCHEMA_VERSION,
      baseline_identity: input.baseline_identity,
      candidate_identity: input.candidate_identity,
      task_or_corpus_identity: input.task_or_corpus_identity,
      harness_identity: input.harness_identity,
      environment_identity: input.environment_identity,
      sample_seed: input.sample_seed,
      metric: {
        name: metric.name.trim(),
        direction: metric.direction,
        aggregation: metric.aggregation,
      },
      aa_repetitions: input.aa_repetitions,
      preregistered_acceptance_threshold: input.preregistered_acceptance_threshold,
      noise_ceiling: input.noise_ceiling,
      broken_run_policy: {
        max_retries: brokenRunPolicy.max_retries,
        synthetic_scores: false,
      },
      stop_budget: {
        max_attempts: stopBudget.max_attempts,
        timeout_seconds: stopBudget.timeout_seconds,
      },
    },
  };
}

function admit(input) {
  const normalized = normalizeAdmission(input);
  if (normalized.errors.length > 0) {
    reject('measurement-admission-incomplete', normalized.errors);
  }
  output({
    status: 'admitted',
    reason_code: 'measurement-admission-valid',
    schema_version: SCHEMA_VERSION,
    admission_sha256: digest(normalized.value),
    normalized_admission: normalized.value,
  }, 0);
}

function allowAb(input) {
  if (!isObject(input)) reject('aa-calibration-invalid', [{ field: '$', reason: 'must-be-an-object' }], { ab_allowed: false });
  const normalized = normalizeAdmission(input.admission);
  if (normalized.errors.length > 0) {
    reject('measurement-admission-incomplete', normalized.errors, { ab_allowed: false });
  }
  const expectedDigest = digest(normalized.value);
  if (input.admission_sha256 !== expectedDigest) {
    reject('aa-calibration-invalid', [{ field: 'admission_sha256', reason: 'admission-digest-mismatch' }], { ab_allowed: false });
  }
  if (!Array.isArray(input.aa_attempts)) {
    reject('aa-calibration-invalid', [{ field: 'aa_attempts', reason: 'must-be-an-array' }], { ab_allowed: false });
  }

  const errors = [];
  let completed = 0;
  let broken = 0;
  input.aa_attempts.forEach((attempt, index) => {
    const prefix = `aa_attempts[${index}]`;
    if (!isObject(attempt)) {
      fieldError(errors, prefix, 'must-be-an-object');
      return;
    }
    if (!ATTEMPT_STATUSES.has(attempt.status)) fieldError(errors, `${prefix}.status`, 'unsupported-status');
    if (attempt.admission_sha256 !== expectedDigest) {
      fieldError(errors, `${prefix}.admission_sha256`, 'admission-digest-mismatch');
    }
    if (attempt.status === 'completed') {
      completed += 1;
      if (!isFiniteNumber(attempt.score)) fieldError(errors, `${prefix}.score`, 'completed-attempt-requires-score');
    } else {
      broken += 1;
      if (Object.prototype.hasOwnProperty.call(attempt, 'score')) {
        fieldError(errors, `${prefix}.score`, 'broken-attempt-must-not-have-score');
      }
    }
  });

  if (input.aa_attempts.length > normalized.value.stop_budget.max_attempts) {
    fieldError(errors, 'aa_attempts', 'stop-budget-exceeded');
  }
  if (broken > normalized.value.broken_run_policy.max_retries) {
    fieldError(errors, 'aa_attempts', 'broken-run-retry-budget-exceeded');
  }
  if (!isFiniteNumber(input.observed_noise_floor) || input.observed_noise_floor < 0) {
    fieldError(errors, 'observed_noise_floor', 'must-be-a-non-negative-finite-number');
  }
  if (errors.length > 0) reject('aa-calibration-invalid', errors, { ab_allowed: false });
  if (completed < normalized.value.aa_repetitions) {
    reject('aa-calibration-incomplete', [{
      field: 'aa_attempts',
      reason: `requires-${normalized.value.aa_repetitions}-completed-attempts`,
    }], { ab_allowed: false });
  }
  if (input.observed_noise_floor > normalized.value.noise_ceiling) {
    reject('noise-floor-too-high', [{
      field: 'observed_noise_floor',
      reason: 'exceeds-preregistered-noise-ceiling',
    }], { ab_allowed: false });
  }

  output({
    status: 'allowed',
    reason_code: 'aa-calibration-passed',
    admission_sha256: expectedDigest,
    completed_aa_attempts: completed,
    observed_noise_floor: input.observed_noise_floor,
    ab_allowed: true,
  }, 0);
}

const args = parseArgs(process.argv.slice(2));
const input = readInput(args.input);
if (args.command === 'admit') admit(input);
else allowAb(input);
