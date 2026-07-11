'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  validatePromotionEvidence,
} = require('../../skills/spec-write-skill/evals/validate-promotion-evidence.cjs');

const tempRoots = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function createBundle() {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'spec-write-skill-promotion-'));
  tempRoots.push(root);

  function artifact(relativePath, content = relativePath) {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content);
    return { path: relativePath, sha256: sha256(content) };
  }

  const common = artifact('inputs/common-guardrails.md');
  const nativeCreator = artifact('inputs/native-creator.md');
  const portableCore = artifact('inputs/portable-core.md');
  const candidateFull = artifact('inputs/candidate-full.md');
  const inputs = [
    { role: 'candidate_source', ...candidateFull },
    { role: 'baseline_source', ...artifact('inputs/baseline.md') },
    { role: 'case_set', ...artifact('inputs/cases.json', '{}\n') },
    { role: 'rubric', ...artifact('inputs/rubric.md') },
  ];
  const arms = [
    {
      id: 'native',
      assembly: [
        { role: 'common_guardrails', ...common },
        { role: 'native_creator', ...nativeCreator },
      ],
    },
    {
      id: 'candidate-ablation',
      assembly: [
        { role: 'common_guardrails', ...common },
        { role: 'portable_core', ...portableCore },
      ],
    },
    {
      id: 'candidate-full',
      assembly: [
        { role: 'candidate_full', ...candidateFull },
      ],
    },
  ];
  const cases = [];
  for (const arm of arms) {
    for (const repeat of [1, 2]) {
      const prefix = `runs/create-basic/${arm.id}/${repeat}`;
      cases.push({
        id: 'create-basic',
        arm: arm.id,
        repeat,
        promotion_case: true,
        host: 'codex',
        model: 'test-model',
        route_high_risk_misroute: false,
        prompt: artifact(`${prefix}/prompt.txt`),
        output: artifact(`${prefix}/output.txt`),
        machine_check: artifact(`${prefix}/machine.json`, '{"result":"pass","route_high_risk_misroute":false}\n'),
        reviewer: artifact(`${prefix}/reviewer.json`, '{"result":"pass"}\n'),
        machine_verdict: 'pass',
        reviewer_verdict: 'pass',
        redaction_status: 'passed',
        tokens: { input: 10, output: 5, total: 15 },
        duration_ms: 25,
      });
    }
  }
  const manifest = {
    schema_version: 'spec-write-skill.promotion-evidence/v1',
    bundle_id: 'test-bundle',
    host: 'codex',
    model: 'test-model',
    inputs,
    arms,
    cases,
    gate_calculation: {
      hard_failures: 0,
      not_run: 0,
      route_high_risk_misroutes: 0,
      result: 'pass',
    },
  };
  fs.writeFileSync(path.join(root, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { root, manifest };
}

test('accepts a complete promotion evidence bundle', () => {
  const { root } = createBundle();
  const report = validatePromotionEvidence(root);

  expect(report.valid).toBe(true);
  expect(report.result).toBe('pass');
  expect(report.errors).toEqual([]);
});

test('fails closed on missing manifest fields', () => {
  const { root, manifest } = createBundle();
  delete manifest.model;
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining(['manifest.model is required']));
});

test('fails closed on artifact hash drift', () => {
  const { root, manifest } = createBundle();
  fs.writeFileSync(path.join(root, manifest.inputs[0].path), 'drifted');

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors.some((error) => error.includes('hash mismatch'))).toBe(true);
});

test('fails closed on path escape', () => {
  const { root, manifest } = createBundle();
  manifest.inputs[0].path = '../outside.txt';
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors.some((error) => error.includes('safe relative path'))).toBe(true);
});

test('fails closed on an artifact path that traverses a symlink', () => {
  const { root, manifest } = createBundle();
  const outside = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'spec-write-skill-promotion-outside-'));
  tempRoots.push(outside);
  const outsideFile = path.join(outside, 'outside.md');
  fs.writeFileSync(outsideFile, 'outside');
  fs.symlinkSync(outside, path.join(root, 'linked'));
  manifest.inputs[0] = {
    role: 'candidate_source',
    path: 'linked/outside.md',
    sha256: sha256('outside'),
  };
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors.some((error) => error.includes('non-symlink path'))).toBe(true);
});

test('rejects duplicate common guardrails in an arm assembly', () => {
  const { root, manifest } = createBundle();
  manifest.arms[0].assembly.push({ ...manifest.arms[0].assembly[0] });
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'arm native must load common_guardrails exactly once',
  ]));
});

test('reports malformed arm items instead of throwing', () => {
  const { root, manifest } = createBundle();
  manifest.arms[1].assembly.push(null);
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  expect(() => validatePromotionEvidence(root)).not.toThrow();
  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'arm candidate-ablation.assembly[2].role is required',
  ]));
});

test('rejects a gate calculation that does not match case verdicts', () => {
  const { root, manifest } = createBundle();
  manifest.cases[0].reviewer_verdict = 'fail';
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'cases[0].reviewer_verdict must match reviewer result',
    'gate_calculation.hard_failures must equal 1',
    'gate_calculation.result must equal fail',
  ]));
});

test('rejects duplicate repeat numbers that fake the promotion double-run requirement', () => {
  const { root, manifest } = createBundle();
  manifest.cases[1].repeat = 1;
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'cases[1] duplicates case create-basic arm native repeat 1',
    'promotion case create-basic arm native must have at least two distinct repeats',
  ]));
});

test('rejects declared verdicts that disagree with hashed run artifacts', () => {
  const { root, manifest } = createBundle();
  manifest.cases[0].machine_verdict = 'fail';
  manifest.gate_calculation.hard_failures = 1;
  manifest.gate_calculation.result = 'fail';
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'cases[0].machine_verdict must match machine_check result',
  ]));
});

test('derives high-risk route misroutes from case evidence', () => {
  const { root, manifest } = createBundle();
  manifest.cases[0].route_high_risk_misroute = true;
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'cases[0].route_high_risk_misroute must match machine_check result',
    'gate_calculation.route_high_risk_misroutes must equal 1',
    'gate_calculation.result must equal fail',
  ]));
});

test('requires the machine-check artifact to carry the route safety signal', () => {
  const { root, manifest } = createBundle();
  const machineCheck = manifest.cases[0].machine_check;
  const content = '{"result":"pass"}\n';
  fs.writeFileSync(path.join(root, machineCheck.path), content);
  machineCheck.sha256 = sha256(content);
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'cases[0].machine_check must contain boolean route_high_risk_misroute',
  ]));
});

test('requires each declared arm to contribute evidence runs', () => {
  const { root, manifest } = createBundle();
  manifest.cases = manifest.cases.filter((entry) => entry.arm !== 'candidate-full');
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'manifest.cases must contain at least one run for arm candidate-full',
  ]));
});
