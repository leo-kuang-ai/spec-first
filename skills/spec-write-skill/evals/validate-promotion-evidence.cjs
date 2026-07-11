#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const SCHEMA_VERSION = 'spec-write-skill.promotion-evidence/v1';
const REQUIRED_INPUT_ROLES = ['baseline_source', 'candidate_source', 'case_set', 'rubric'];
const REQUIRED_ARM_IDS = ['candidate-ablation', 'candidate-full', 'native'];
const VERDICTS = new Set(['pass', 'fail', 'not_run']);
const REDACTION_STATUSES = new Set(['passed', 'not_required']);
const UNSAFE_PATH_CHARACTERS = /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u;

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function isSafeRelativePath(value) {
  if (typeof value !== 'string' || !value || path.isAbsolute(value) || UNSAFE_PATH_CHARACTERS.test(value)) return false;
  const normalized = value.replace(/\\/g, '/');
  return !normalized.split('/').some((segment) => segment === '..' || segment === '');
}

function isInside(candidate, root) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function hasSymlinkSegment(bundleRoot, relativePath) {
  let current = bundleRoot;
  for (const segment of relativePath.replace(/\\/g, '/').split('/')) {
    current = path.join(current, segment);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) return true;
    } catch {
      return false;
    }
  }
  return false;
}

function validateArtifactRef(bundleRoot, reference, label, errors) {
  if (!reference || typeof reference !== 'object' || Array.isArray(reference)) {
    errors.push(`${label} must be an artifact reference`);
    return;
  }
  if (!isSafeRelativePath(reference.path)) {
    errors.push(`${label}.path must be a safe relative path`);
    return;
  }
  if (typeof reference.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(reference.sha256)) {
    errors.push(`${label}.sha256 must be a lowercase SHA-256 digest`);
    return;
  }
  const absolutePath = path.resolve(bundleRoot, reference.path);
  if (!isInside(absolutePath, bundleRoot)) {
    errors.push(`${label}.path must be a safe relative path`);
    return;
  }
  if (hasSymlinkSegment(bundleRoot, reference.path)) {
    errors.push(`${label}.path must use a non-symlink path`);
    return;
  }
  let stat;
  try {
    stat = fs.lstatSync(absolutePath);
  } catch {
    errors.push(`${label}.path does not exist`);
    return;
  }
  if (stat.isSymbolicLink() || !stat.isFile()) {
    errors.push(`${label}.path must reference a regular non-symlink file`);
    return;
  }
  try {
    if (!isInside(fs.realpathSync(absolutePath), fs.realpathSync(bundleRoot))) {
      errors.push(`${label}.path must remain inside the bundle root`);
      return;
    }
  } catch {
    errors.push(`${label}.path realpath is unavailable`);
    return;
  }
  const actualHash = sha256File(absolutePath);
  if (actualHash !== reference.sha256) errors.push(`${label}.sha256 hash mismatch`);
}

function requireString(manifest, field, errors) {
  if (typeof manifest[field] !== 'string' || !manifest[field].trim()) {
    errors.push(`manifest.${field} is required`);
  }
}

function validateInputs(bundleRoot, inputs, errors) {
  if (!Array.isArray(inputs)) {
    errors.push('manifest.inputs must be an array');
    return;
  }
  const roleCounts = new Map();
  inputs.forEach((input, index) => {
    if (!input || typeof input.role !== 'string') {
      errors.push(`inputs[${index}].role is required`);
      return;
    }
    roleCounts.set(input.role, (roleCounts.get(input.role) || 0) + 1);
    validateArtifactRef(bundleRoot, input, `inputs[${index}]`, errors);
  });
  for (const role of REQUIRED_INPUT_ROLES) {
    if (roleCounts.get(role) !== 1) errors.push(`manifest.inputs must contain role ${role} exactly once`);
  }
}

function roleCount(assembly, role) {
  return assembly.filter((item) => item && item.role === role).length;
}

function validateArmAssembly(arm, errors) {
  const assembly = arm.assembly;
  if (!Array.isArray(assembly)) return;
  if (arm.id === 'native') {
    if (roleCount(assembly, 'common_guardrails') !== 1) errors.push('arm native must load common_guardrails exactly once');
    if (roleCount(assembly, 'native_creator') !== 1) errors.push('arm native must load native_creator exactly once');
    if (assembly.length !== 2) errors.push('arm native may contain only common_guardrails and native_creator');
  }
  if (arm.id === 'candidate-ablation') {
    if (roleCount(assembly, 'common_guardrails') !== 1) errors.push('arm candidate-ablation must load common_guardrails exactly once');
    if (roleCount(assembly, 'portable_core') < 1) errors.push('arm candidate-ablation must load at least one portable_core slice');
    if (assembly.some((item) => !item || !['common_guardrails', 'portable_core'].includes(item.role))) {
      errors.push('arm candidate-ablation may contain only common_guardrails and portable_core slices');
    }
  }
  if (arm.id === 'candidate-full') {
    if (assembly.length !== 1 || roleCount(assembly, 'candidate_full') !== 1) {
      errors.push('arm candidate-full must load candidate_full exactly once without common guardrails');
    }
  }
}

function validateArms(bundleRoot, arms, errors) {
  if (!Array.isArray(arms)) {
    errors.push('manifest.arms must be an array');
    return new Set();
  }
  const ids = new Set();
  arms.forEach((arm, armIndex) => {
    if (!arm || typeof arm.id !== 'string') {
      errors.push(`arms[${armIndex}].id is required`);
      return;
    }
    if (ids.has(arm.id)) errors.push(`arm ${arm.id} is duplicated`);
    ids.add(arm.id);
    if (!Array.isArray(arm.assembly)) {
      errors.push(`arm ${arm.id}.assembly must be an array`);
      return;
    }
    arm.assembly.forEach((item, itemIndex) => {
      if (!item || typeof item.role !== 'string') errors.push(`arm ${arm.id}.assembly[${itemIndex}].role is required`);
      validateArtifactRef(bundleRoot, item, `arm ${arm.id}.assembly[${itemIndex}]`, errors);
    });
    validateArmAssembly(arm, errors);
  });
  for (const id of REQUIRED_ARM_IDS) {
    if (!ids.has(id)) errors.push(`manifest.arms must contain ${id}`);
  }
  for (const id of ids) {
    if (!REQUIRED_ARM_IDS.includes(id)) errors.push(`manifest.arms contains unsupported arm ${id}`);
  }
  return ids;
}

function validateNonNegativeInteger(value, label, errors) {
  if (!Number.isInteger(value) || value < 0) errors.push(`${label} must be a non-negative integer`);
}

function readArtifactResult(bundleRoot, reference, label, requireRouteSignal, errors) {
  if (!reference || !isSafeRelativePath(reference.path)) return null;
  const absolutePath = path.resolve(bundleRoot, reference.path);
  if (!isInside(absolutePath, bundleRoot) || hasSymlinkSegment(bundleRoot, reference.path)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    const verdict = parsed && (parsed.verdict || parsed.result);
    if (!VERDICTS.has(verdict)) {
      errors.push(`${label} must contain result or verdict with pass, fail, or not_run`);
      return null;
    }
    if (requireRouteSignal && typeof parsed.route_high_risk_misroute !== 'boolean') {
      errors.push(`${label} must contain boolean route_high_risk_misroute`);
      return null;
    }
    return {
      verdict,
      routeHighRiskMisroute: parsed.route_high_risk_misroute,
    };
  } catch {
    errors.push(`${label} must be valid JSON`);
    return null;
  }
}

function validateCases(bundleRoot, cases, armIds, manifestHost, manifestModel, errors) {
  const counts = new Map();
  const armRunCounts = new Map();
  const runKeys = new Set();
  let hardFailures = 0;
  let notRun = 0;
  let routeHighRiskMisroutes = 0;
  if (!Array.isArray(cases) || cases.length === 0) {
    errors.push('manifest.cases must be a non-empty array');
    return { hardFailures, notRun, routeHighRiskMisroutes };
  }
  cases.forEach((entry, index) => {
    const label = `cases[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${label} must be an object`);
      return;
    }
    if (typeof entry.id !== 'string' || !entry.id) errors.push(`${label}.id is required`);
    if (typeof entry.arm !== 'string' || !armIds.has(entry.arm)) errors.push(`${label}.arm must reference a declared arm`);
    if (!Number.isInteger(entry.repeat) || entry.repeat < 1) errors.push(`${label}.repeat must be a positive integer`);
    if (typeof entry.promotion_case !== 'boolean') errors.push(`${label}.promotion_case must be a boolean`);
    if (typeof entry.host !== 'string' || !entry.host.trim()) errors.push(`${label}.host is required`);
    else if (entry.host !== manifestHost) errors.push(`${label}.host must match manifest.host`);
    if (typeof entry.model !== 'string' || !entry.model.trim()) errors.push(`${label}.model is required`);
    else if (entry.model !== manifestModel) errors.push(`${label}.model must match manifest.model`);
    if (typeof entry.route_high_risk_misroute !== 'boolean') {
      errors.push(`${label}.route_high_risk_misroute must be a boolean`);
    } else if (entry.route_high_risk_misroute) {
      routeHighRiskMisroutes += 1;
    }
    if (typeof entry.id === 'string' && typeof entry.arm === 'string' && Number.isInteger(entry.repeat)) {
      const runKey = `${entry.id}\u0000${entry.arm}\u0000${entry.repeat}`;
      if (runKeys.has(runKey)) errors.push(`${label} duplicates case ${entry.id} arm ${entry.arm} repeat ${entry.repeat}`);
      runKeys.add(runKey);
      armRunCounts.set(entry.arm, (armRunCounts.get(entry.arm) || 0) + 1);
    }
    for (const field of ['prompt', 'output', 'machine_check', 'reviewer']) {
      validateArtifactRef(bundleRoot, entry[field], `${label}.${field}`, errors);
    }
    if (!VERDICTS.has(entry.machine_verdict)) errors.push(`${label}.machine_verdict is invalid`);
    if (!VERDICTS.has(entry.reviewer_verdict)) errors.push(`${label}.reviewer_verdict is invalid`);
    if (!REDACTION_STATUSES.has(entry.redaction_status)) errors.push(`${label}.redaction_status is invalid`);
    const machineArtifactResult = readArtifactResult(bundleRoot, entry.machine_check, `${label}.machine_check`, true, errors);
    if (machineArtifactResult && machineArtifactResult.verdict !== entry.machine_verdict) {
      errors.push(`${label}.machine_verdict must match machine_check result`);
    }
    if (machineArtifactResult
      && machineArtifactResult.routeHighRiskMisroute !== entry.route_high_risk_misroute) {
      errors.push(`${label}.route_high_risk_misroute must match machine_check result`);
    }
    const reviewerArtifactResult = readArtifactResult(bundleRoot, entry.reviewer, `${label}.reviewer`, false, errors);
    if (reviewerArtifactResult && reviewerArtifactResult.verdict !== entry.reviewer_verdict) {
      errors.push(`${label}.reviewer_verdict must match reviewer result`);
    }
    if (!entry.tokens || typeof entry.tokens !== 'object') {
      errors.push(`${label}.tokens is required`);
    } else {
      validateNonNegativeInteger(entry.tokens.input, `${label}.tokens.input`, errors);
      validateNonNegativeInteger(entry.tokens.output, `${label}.tokens.output`, errors);
      validateNonNegativeInteger(entry.tokens.total, `${label}.tokens.total`, errors);
      if (Number.isInteger(entry.tokens.input) && Number.isInteger(entry.tokens.output)
        && entry.tokens.total !== entry.tokens.input + entry.tokens.output) {
        errors.push(`${label}.tokens.total must equal input + output`);
      }
    }
    validateNonNegativeInteger(entry.duration_ms, `${label}.duration_ms`, errors);
    if (entry.machine_verdict === 'fail' || entry.reviewer_verdict === 'fail') hardFailures += 1;
    else if (entry.machine_verdict === 'not_run' || entry.reviewer_verdict === 'not_run') notRun += 1;
    if (entry.promotion_case === true && typeof entry.id === 'string' && typeof entry.arm === 'string') {
      const key = `${entry.id}\u0000${entry.arm}`;
      if (!counts.has(key)) counts.set(key, new Set());
      counts.get(key).add(entry.repeat);
    }
  });
  for (const id of armIds) {
    if (!armRunCounts.has(id)) errors.push(`manifest.cases must contain at least one run for arm ${id}`);
  }
  for (const [key, repeats] of counts) {
    if (repeats.size < 2) {
      const [id, arm] = key.split('\u0000');
      errors.push(`promotion case ${id} arm ${arm} must have at least two distinct repeats`);
    }
  }
  return { hardFailures, notRun, routeHighRiskMisroutes };
}

function validateGateCalculation(gate, calculated, errors) {
  if (!gate || typeof gate !== 'object' || Array.isArray(gate)) {
    errors.push('manifest.gate_calculation is required');
    return 'invalid';
  }
  validateNonNegativeInteger(gate.hard_failures, 'gate_calculation.hard_failures', errors);
  validateNonNegativeInteger(gate.not_run, 'gate_calculation.not_run', errors);
  validateNonNegativeInteger(gate.route_high_risk_misroutes, 'gate_calculation.route_high_risk_misroutes', errors);
  if (gate.hard_failures !== calculated.hardFailures) {
    errors.push(`gate_calculation.hard_failures must equal ${calculated.hardFailures}`);
  }
  if (gate.not_run !== calculated.notRun) errors.push(`gate_calculation.not_run must equal ${calculated.notRun}`);
  if (gate.route_high_risk_misroutes !== calculated.routeHighRiskMisroutes) {
    errors.push(`gate_calculation.route_high_risk_misroutes must equal ${calculated.routeHighRiskMisroutes}`);
  }
  const expectedResult = calculated.hardFailures > 0 || calculated.routeHighRiskMisroutes > 0
    ? 'fail'
    : calculated.notRun > 0
      ? 'not_run'
      : 'pass';
  if (gate.result !== expectedResult) errors.push(`gate_calculation.result must equal ${expectedResult}`);
  return expectedResult;
}

function validatePromotionEvidence(bundlePath) {
  const bundleRoot = path.resolve(bundlePath);
  const errors = [];
  let rootStat;
  try {
    rootStat = fs.lstatSync(bundleRoot);
  } catch {
    return { schema_version: 'spec-write-skill.promotion-evidence-validation/v1', valid: false, result: 'invalid', errors: ['bundle path is unreadable'] };
  }
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    return { schema_version: 'spec-write-skill.promotion-evidence-validation/v1', valid: false, result: 'invalid', errors: ['bundle path must be a regular directory'] };
  }
  let manifest;
  try {
    const manifestPath = path.join(bundleRoot, 'manifest.json');
    const manifestStat = fs.lstatSync(manifestPath);
    if (manifestStat.isSymbolicLink() || !manifestStat.isFile()) throw new Error('unsafe manifest');
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return { schema_version: 'spec-write-skill.promotion-evidence-validation/v1', valid: false, result: 'invalid', errors: ['manifest.json is missing or invalid JSON'] };
  }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    errors.push('manifest must be an object');
  } else {
    if (manifest.schema_version !== SCHEMA_VERSION) errors.push(`manifest.schema_version must equal ${SCHEMA_VERSION}`);
    requireString(manifest, 'bundle_id', errors);
    requireString(manifest, 'host', errors);
    requireString(manifest, 'model', errors);
    validateInputs(bundleRoot, manifest.inputs, errors);
    const armIds = validateArms(bundleRoot, manifest.arms, errors);
    const calculated = validateCases(bundleRoot, manifest.cases, armIds, manifest.host, manifest.model, errors);
    const result = validateGateCalculation(manifest.gate_calculation, calculated, errors);
    const uniqueErrors = [...new Set(errors)].sort();
    return {
      schema_version: 'spec-write-skill.promotion-evidence-validation/v1',
      valid: uniqueErrors.length === 0,
      result: uniqueErrors.length === 0 ? result : 'invalid',
      errors: uniqueErrors,
    };
  }
  return {
    schema_version: 'spec-write-skill.promotion-evidence-validation/v1',
    valid: false,
    result: 'invalid',
    errors: [...new Set(errors)].sort(),
  };
}

function renderHuman(report) {
  const lines = [`Promotion evidence: ${report.valid ? report.result : 'invalid'}`];
  for (const error of report.errors) lines.push(`- ${error}`);
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const bundlePath = args.find((arg) => !arg.startsWith('-'));
  if (!bundlePath) {
    console.error('Usage: validate-promotion-evidence.cjs <bundle-dir> [--json]');
    process.exit(2);
  }
  const report = validatePromotionEvidence(bundlePath);
  process.stdout.write(`${json ? JSON.stringify(report, null, 2) : renderHuman(report)}\n`);
  process.exit(report.valid ? 0 : 1);
}

if (require.main === module) main();

module.exports = { validatePromotionEvidence };
