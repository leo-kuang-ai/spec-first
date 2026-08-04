'use strict';

const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  validatePromotionEvidence,
} = require('../../skills/spec-write-skill/evals/validate-promotion-evidence.cjs');

const repoRoot = path.resolve(__dirname, '../..');
const tempRoots = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function createBundle({
  behaviorCount = 9,
  routeCount = 12,
  schemaVersion = 'spec-write-skill.promotion-evidence/v2',
} = {}) {
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
  const baselineFull = artifact('inputs/baseline-full.md');
  const behaviorIds = Array.from({ length: behaviorCount }, (_, index) => `behavior-${index + 1}`);
  const routeIds = Array.from({ length: routeCount }, (_, index) => `route-${index + 1}`);
  const inputs = [
    { role: 'candidate_source', ...candidateFull },
    { role: 'baseline_source', ...baselineFull },
    { role: 'case_set', ...artifact('inputs/cases.json', `${JSON.stringify({
      cases: behaviorIds.map((id) => ({ id })),
      route_queries: routeIds.map((id) => ({ id })),
    })}\n`) },
    { role: 'gate0', ...artifact('inputs/gate0.json', '{"decision":"thin-wrapper"}\n') },
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
    {
      id: 'old-full',
      assembly: [
        { role: 'baseline_full', ...baselineFull },
      ],
    },
  ];
  const cases = [];
  for (const arm of arms) {
    for (const repeat of [1, 2]) {
      for (const id of behaviorIds) {
        const prefix = `runs/${id}/${arm.id}/${repeat}`;
        cases.push({
          id,
          arm: arm.id,
          repeat,
          promotion_case: true,
          host: 'codex',
          model: 'test-model',
          route_high_risk_misroute: false,
          prompt: artifact(`${prefix}/prompt.txt`),
          output: artifact(`${prefix}/output.txt`),
          machine_check: artifact(`${prefix}/machine.json`, '{"result":"pass","route_high_risk_misroute":false}\n'),
          reviewer: artifact(`${prefix}/reviewer.json`, '{"result":"pass","blind":true,"independent":true}\n'),
          machine_verdict: 'pass',
          reviewer_verdict: 'pass',
          redaction_status: 'passed',
          tokens: { input: 10, output: 5, total: 15 },
          duration_ms: 25,
        });
      }
    }
  }
  const route_runs = routeIds.map((id) => ({
    id,
    host: 'codex',
    model: 'test-model',
    route_high_risk_misroute: false,
    prompt: artifact(`routes/${id}/prompt.txt`),
    output: artifact(`routes/${id}/output.json`),
    machine_check: artifact(`routes/${id}/machine.json`, '{"result":"pass","route_high_risk_misroute":false}\n'),
    machine_verdict: 'pass',
    redaction_status: 'passed',
    tokens: { input: 10, output: 5, total: 15 },
    duration_ms: 25,
  }));
  const defaultContext = artifact('inputs/default-context.md', 'default context');
  const manifest = {
    schema_version: schemaVersion,
    bundle_id: 'test-bundle',
    host: 'codex',
    model: 'test-model',
    inputs,
    arms,
    cases,
    route_runs,
    coverage: {
      behavior_case_ids: behaviorIds,
      route_query_ids: routeIds,
      comparison_case_ids: ['behavior-1'],
      regression_case_ids: ['behavior-2'],
    },
    countermetrics: {
      default_context: defaultContext,
      default_markdown_bytes: Buffer.byteLength('default context'),
      candidate_vs_native_input_delta_percent: 0,
      quality_or_safety_justification: '',
    },
    gate0_resolution: {
      evidence: inputs.find((input) => input.role === 'gate0'),
      baseline_decision: 'thin-wrapper',
      candidate_benefit_verdict: 'pass',
      candidate_benefit_rationale: 'Independent review confirms additional boundary value.',
    },
    comparative_verdicts: {
      matched_ablation: artifact('comparative/matched-ablation.json', '{"result":"pass"}\n'),
      old_regression: artifact('comparative/old-regression.json', '{"result":"pass"}\n'),
    },
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

test('preserves promotion coverage floors while allowing the canonical case set to grow', () => {
  expect(validatePromotionEvidence(createBundle({
    behaviorCount: 8,
    routeCount: 12,
    schemaVersion: 'spec-write-skill.promotion-evidence/v1',
  }).root)).toMatchObject({ valid: true, result: 'pass' });
  expect(validatePromotionEvidence(createBundle({ behaviorCount: 10, routeCount: 16 }).root))
    .toMatchObject({ valid: true, result: 'pass' });

  expect(validatePromotionEvidence(createBundle({ behaviorCount: 7 }).root).errors)
    .toEqual(expect.arrayContaining(['v2 case_set must declare at least 8 behavior cases']));
  expect(validatePromotionEvidence(createBundle({ routeCount: 11 }).root).errors)
    .toEqual(expect.arrayContaining(['case_set must declare 12-16 route queries']));
  expect(validatePromotionEvidence(createBundle({ routeCount: 17 }).root).errors)
    .toEqual(expect.arrayContaining(['case_set must declare 12-16 route queries']));
});

test('keeps published v1 evidence semantics stable and requires v2 for expanded case sets', () => {
  const historical = path.join(repoRoot, 'docs/validation/2026-07-12-spec-write-skill-promotion');
  expect(validatePromotionEvidence(historical)).toMatchObject({ valid: true, result: 'pass' });

  const expandedV1 = createBundle({
    behaviorCount: 9,
    schemaVersion: 'spec-write-skill.promotion-evidence/v1',
  });
  expect(validatePromotionEvidence(expandedV1.root).errors).toEqual(expect.arrayContaining([
    'v1 case_set must declare exactly 8 behavior cases',
  ]));
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
  const candidateIndex = manifest.cases.findIndex((entry) => entry.arm === 'candidate-full');
  manifest.cases[candidateIndex].reviewer_verdict = 'fail';
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    `cases[${candidateIndex}].reviewer_verdict must match reviewer result`,
    'gate_calculation.hard_failures must equal 1',
    'gate_calculation.result must equal fail',
  ]));
});

test('rejects duplicate repeat numbers that fake the promotion double-run requirement', () => {
  const { root, manifest } = createBundle();
  const duplicateIndex = manifest.cases.findIndex((entry) =>
    entry.id === 'behavior-1' && entry.arm === 'native' && entry.repeat === 2
  );
  manifest.cases[duplicateIndex].repeat = 1;
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    `cases[${duplicateIndex}] duplicates case behavior-1 arm native repeat 1`,
    'promotion case behavior-1 arm native must have at least two distinct repeats',
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
  const candidateIndex = manifest.cases.findIndex((entry) => entry.arm === 'candidate-full');
  manifest.cases[candidateIndex].route_high_risk_misroute = true;
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    `cases[${candidateIndex}].route_high_risk_misroute must match machine_check result`,
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

test('requires candidate-full double-run coverage for every bound behavior case', () => {
  const { root, manifest } = createBundle();
  manifest.cases = manifest.cases.filter((entry) => !(
    entry.id === 'behavior-9' && entry.arm === 'candidate-full'
  ));
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'behavior case behavior-9 arm candidate-full must have at least two distinct promotion repeats',
  ]));
});

test('counts failures from every candidate-full behavior case, not only comparison subsets', () => {
  const { root, manifest } = createBundle();
  const candidates = manifest.cases.filter((entry) => (
    entry.arm === 'candidate-full' && entry.id === 'behavior-9'
  ));
  for (const entry of candidates) entry.promotion_case = false;
  const [candidate] = candidates;
  const content = '{"result":"fail","route_high_risk_misroute":false}\n';
  fs.writeFileSync(path.join(root, candidate.machine_check.path), content);
  candidate.machine_check.sha256 = sha256(content);
  candidate.machine_verdict = 'fail';
  manifest.gate_calculation.hard_failures = 1;
  manifest.gate_calculation.result = 'fail';
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(true);
  expect(report.result).toBe('fail');
});

test('requires the fixed old-full regression arm', () => {
  const { root, manifest } = createBundle();
  manifest.arms = manifest.arms.filter((arm) => arm.id !== 'old-full');
  manifest.cases = manifest.cases.filter((entry) => entry.arm !== 'old-full');
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'manifest.arms must contain old-full',
    'regression case behavior-2 arm old-full must have at least two distinct repeats',
  ]));
});

test('requires blind independent reviewer artifacts', () => {
  const { root, manifest } = createBundle();
  const reviewer = manifest.cases[0].reviewer;
  const content = '{"result":"pass"}\n';
  fs.writeFileSync(path.join(root, reviewer.path), content);
  reviewer.sha256 = sha256(content);
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'cases[0].reviewer must declare blind=true and independent=true',
  ]));
});

test('requires full case-set coverage and a measured default context budget', () => {
  const { root, manifest } = createBundle();
  manifest.coverage.route_query_ids.pop();
  manifest.countermetrics.default_markdown_bytes = 0;
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'coverage.route_query_ids must exactly match case_set route query ids',
    'countermetrics.default_markdown_bytes must equal default_context byte length',
  ]));
});

test('does not promote a Gate 0 benefit verdict that is not confirmed', () => {
  const { root, manifest } = createBundle();
  manifest.gate0_resolution.candidate_benefit_verdict = 'not_run';
  manifest.gate_calculation.result = 'not_run';
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(true);
  expect(report.result).toBe('not_run');
});

test('does not count expected baseline arm failures as candidate hard failures', () => {
  const { root, manifest } = createBundle();
  const native = manifest.cases.find((entry) => entry.arm === 'native');
  const content = '{"result":"fail","route_high_risk_misroute":true}\n';
  fs.writeFileSync(path.join(root, native.machine_check.path), content);
  native.machine_check.sha256 = sha256(content);
  native.machine_verdict = 'fail';
  native.route_high_risk_misroute = true;
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(true);
  expect(report.result).toBe('pass');
});

test('blocks promotion when a comparative verdict fails', () => {
  const { root, manifest } = createBundle();
  const comparison = manifest.comparative_verdicts.matched_ablation;
  const content = '{"result":"fail"}\n';
  fs.writeFileSync(path.join(root, comparison.path), content);
  comparison.sha256 = sha256(content);
  manifest.gate_calculation.result = 'fail';
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(true);
  expect(report.result).toBe('fail');
});

test('binds the declared candidate source to the evaluated candidate-full assembly', () => {
  const { root, manifest } = createBundle();
  const alternateContent = 'different candidate source';
  const alternatePath = path.join(root, 'inputs', 'alternate-candidate.md');
  fs.writeFileSync(alternatePath, alternateContent);
  manifest.arms.find((arm) => arm.id === 'candidate-full').assembly[0] = {
    role: 'candidate_full',
    path: 'inputs/alternate-candidate.md',
    sha256: sha256(alternateContent),
  };
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'candidate_source must have the same content hash as candidate-full candidate_full assembly',
  ]));
});

test('binds the declared baseline source to the evaluated old-full assembly', () => {
  const { root, manifest } = createBundle();
  const alternateContent = 'different historical baseline';
  const alternatePath = path.join(root, 'inputs', 'alternate-baseline.md');
  fs.writeFileSync(alternatePath, alternateContent);
  manifest.arms.find((arm) => arm.id === 'old-full').assembly[0] = {
    role: 'baseline_full',
    path: 'inputs/alternate-baseline.md',
    sha256: sha256(alternateContent),
  };
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const report = validatePromotionEvidence(root);
  expect(report.valid).toBe(false);
  expect(report.errors).toEqual(expect.arrayContaining([
    'baseline_source must have the same content hash as old-full baseline_full assembly',
  ]));
});

test('CLI exits non-zero for a structurally valid not-run gate', () => {
  const { root, manifest } = createBundle();
  manifest.gate0_resolution.candidate_benefit_verdict = 'not_run';
  manifest.gate_calculation.result = 'not_run';
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest));

  const script = path.join(
    repoRoot,
    'skills/spec-write-skill/evals/validate-promotion-evidence.cjs',
  );
  const result = spawnSync(process.execPath, [script, root, '--json'], { encoding: 'utf8' });
  const report = JSON.parse(result.stdout);

  expect(result.status).toBe(1);
  expect(report.valid).toBe(true);
  expect(report.result).toBe('not_run');
});
