'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '../..');
const pythonWrapper = path.join(repoRoot, 'skills/spec-code-review/scripts/run-python.sh');
const reviewScope = path.join(repoRoot, 'skills/spec-code-review/scripts/review-scope.py');
const findingsMechanics = path.join(repoRoot, 'skills/spec-code-review/scripts/findings-mechanics.py');

describe('spec-code-review mechanical floor', () => {
  test('scope helper fails closed for an invalid endpoint', () => {
    const result = runPython(reviewScope, ['--base', 'definitely-missing-ref'], { cwd: repoRoot });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'unknown',
      exec_lines: null,
      uncounted_files: 1,
      lite_eligible: false,
    });
  });

  test('scope helper distinguishes a small code-only diff from uncounted prose', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-review-scope-'));
    git(root, ['init', '-q']);
    git(root, ['config', 'user.email', 'test@example.com']);
    git(root, ['config', 'user.name', 'Test']);
    fs.writeFileSync(path.join(root, 'sample.js'), 'module.exports = 1;\n');
    git(root, ['add', 'sample.js']);
    git(root, ['commit', '-qm', 'base']);
    const base = git(root, ['rev-parse', 'HEAD']).stdout.trim();
    fs.writeFileSync(path.join(root, 'sample.js'), 'module.exports = 2;\n');

    let result = runPython(reviewScope, ['--base', base], { cwd: root });
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'complete',
      exec_lines: 2,
      uncounted_files: 0,
      lite_eligible: true,
    });

    fs.writeFileSync(path.join(root, 'README.md'), '# Changed\n');
    git(root, ['add', 'README.md']);
    result = runPython(reviewScope, ['--base', base], { cwd: root });
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'complete',
      uncounted_files: 1,
      lite_eligible: false,
    });
  });

  test('scope helper freezes the reviewed diff and detects reviewer mutation', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-review-freeze-'));
    const snapshot = path.join(root, 'artifacts', 'scope-snapshot.json');
    git(root, ['init', '-q']);
    git(root, ['config', 'user.email', 'test@example.com']);
    git(root, ['config', 'user.name', 'Test']);
    fs.writeFileSync(path.join(root, 'orders.js'), 'module.exports = { tenantCheck: true };\n');
    git(root, ['add', 'orders.js']);
    git(root, ['commit', '-qm', 'base']);
    const base = git(root, ['rev-parse', 'HEAD']).stdout.trim();
    fs.writeFileSync(path.join(root, 'orders.js'), 'module.exports = { tenantCheck: false };\n');

    let result = runPython(reviewScope, ['--base', base, '--snapshot-out', snapshot], { cwd: root });
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'complete',
      files_changed: 1,
      snapshot_written: true,
    });

    result = runPython(reviewScope, ['--verify-snapshot', snapshot], { cwd: root });
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'complete',
      mutation_detected: false,
      reason_code: null,
    });

    fs.writeFileSync(path.join(root, 'orders.js'), 'module.exports = { tenantCheck: true };\n');
    result = runPython(reviewScope, ['--verify-snapshot', snapshot], { cwd: root });
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'complete',
      mutation_detected: true,
      reason_code: 'reviewer_mutation_detected',
      mutated_paths: ['orders.js'],
    });
  });

  test('findings helper rejects malformed input and applies exact deterministic mechanics', () => {
    const exact = finding({ title: 'Missing owner check', reviewer: 'security' });
    const corroborating = finding({ title: '  missing   OWNER check ', reviewer: 'correctness' });
    const malformed = { reviewer: 'broken', findings: [{}], residual_risks: [], testing_gaps: [] };
    const result = runPython(findingsMechanics, [], {
      input: JSON.stringify([exact, corroborating, malformed]),
    });
    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.status).toBe('complete');
    expect(output.malformed_findings).toBe(1);
    expect(output.findings).toHaveLength(1);
    expect(output.findings[0]).toMatchObject({
      '#': 1,
      confidence: 100,
      reviewers: ['security', 'correctness'],
      independent_reviewers: ['security', 'correctness'],
    });
  });

  test('findings helper does not promote fast-pass or unverified peer independence', () => {
    const fast = finding({ reviewer: 'fast-pass', confidence: 100 });
    const peer = finding({ reviewer: 'adversarial-codex', confidence: 50, independence_verified: false });
    const result = runPython(findingsMechanics, [], { input: JSON.stringify([fast, peer]) });
    const output = JSON.parse(result.stdout);
    expect(output.findings).toHaveLength(0);
    expect(output.suppressed_by_confidence).toEqual({ '50': 1 });
  });

  test('findings helper demotes high confidence without first evidence', () => {
    const source = finding({ reviewer: 'testing', confidence: 100 });
    delete source.findings[0].first_evidence;
    const result = runPython(findingsMechanics, [], { input: JSON.stringify([source]) });
    const output = JSON.parse(result.stdout);
    expect(output.findings).toHaveLength(0);
    expect(output.suppressed_by_confidence).toEqual({ '50': 1 });
  });
});

function finding(overrides = {}) {
  const reviewer = overrides.reviewer || 'correctness';
  const source = {
    reviewer,
    findings: [{
      title: overrides.title || 'Missing owner check',
      severity: 'P1',
      file: 'src/orders.js',
      line: 42,
      confidence: overrides.confidence === undefined ? 75 : overrides.confidence,
      autofix_class: 'gated_auto',
      owner: 'downstream-resolver',
      requires_verification: true,
      pre_existing: false,
      first_evidence: 'src/orders.js:42 -- lookup(input.id)',
    }],
    residual_risks: [],
    testing_gaps: [],
  };
  if (overrides.independence_verified !== undefined) {
    source.independence_verified = overrides.independence_verified;
  }
  return source;
}

function runPython(script, args, options = {}) {
  return spawnSync('bash', [pythonWrapper, script, ...args], {
    cwd: options.cwd || repoRoot,
    input: options.input,
    encoding: 'utf8',
  });
}

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  return result;
}
