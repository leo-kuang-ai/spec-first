'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const scorer = path.resolve(__dirname, '../../skills/autoresearch/scripts/score-regression.sh');
const columns = ['iteration', 'timestamp', 'dimension', 'axis', 'tier', 'classification', 'baseline', 'candidate', 'delta', 'regressed', 'subscore', 'severity', 'status', 'file_line', 'description'];
const row = (overrides = {}) => {
  const value = { iteration: '1', timestamp: '2026-10-29T00:00:00Z', dimension: 'performance', axis: 'diff', tier: 'SCORE', classification: 'regression-eligible', baseline: '100', candidate: '100', delta: '0', regressed: 'false', subscore: '100', severity: '', status: 'ran', file_line: 'src/app.js:1', description: 'Local fixture', ...overrides };
  return columns.map((key) => value[key]).join('\t');
};

describe('autoresearch regression protocol scoring', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'regression-score-')); });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));
  function score(rows, options = {}) {
    const file = path.join(root, 'results.tsv');
    fs.writeFileSync(file, `${options.header ? `${columns.join('\t')}\n` : ''}${rows.join('\n')}\n`);
    const env = { ...process.env };
    delete env.REG_THRESHOLD;
    if (options.threshold !== undefined) env.REG_THRESHOLD = options.threshold;
    return spawnSync('bash', [scorer, 'verdict', file], { env, encoding: 'utf8', timeout: 5000 });
  }
  test.each(['regression-eligible', 'eligible'])('%s HARD regressions block a perfect score', (classification) => {
    const result = score([row(), row({ dimension: 'functional', tier: 'HARD', classification, regressed: 'true', subscore: '' })]);
    expect(result.status).toBe(1);
    expect(result.stdout.trim().split('\n').pop()).toBe('UNSTABLE');
  });
  test.each(['visual-ui', 'visual'])('%s contributes to the visual score', (dimension) => {
    const result = score([row(), row({ dimension, regressed: 'true', subscore: '0' })]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('stability_score = 60.00');
  });
  test('documented TSV header and old aliases remain valid', () => {
    const result = score([row({ classification: 'eligible' }), row({ dimension: 'visual', classification: 'eligible' })], { header: true });
    expect(result.status).toBe(0);
    expect(result.stdout.trim().split('\n').pop()).toBe('STABLE');
  });
  test.each([
    { classification: 'unknown' }, { dimension: 'unknown' }, { tier: 'unknown' },
    { regressed: 'unknown' }, { subscore: 'NaN' }, { subscore: 'Infinity' },
    { subscore: '101' }, { subscore: '-1' }, { subscore: '' },
    { dimension: 'functional', tier: 'SCORE' },
  ])('invalid protocol data cannot produce a safety verdict: %j', (overrides) => {
    const result = score([row(), row(overrides)]);
    expect(result.status).toBe(2);
    expect(`${result.stdout}${result.stderr}`).toContain('INVALID_INPUT');
    expect(result.stdout.trim().split('\n').pop()).not.toBe('STABLE');
  });
  test.each(['NaN', 'Infinity', '101', '-1', 'not-a-number'])('rejects invalid threshold %s', (threshold) => {
    const result = score([row()], { threshold });
    expect(result.status).toBe(2);
    expect(`${result.stdout}${result.stderr}`).toContain('INVALID_INPUT');
  });
  test('malformed cells cannot be padded into evidence', () => {
    expect(score([row(), '1\tmissing']).status).toBe(2);
  });
  test('excluded baseline states cannot inflate the score', () => {
    const result = score([row({ subscore: '0' }), row({ classification: 'baseline-unavailable', subscore: '100' })], { threshold: '40' });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('stability_score = 0.00');
  });
  test('historical and new failures do not become HARD regressions', () => {
    const result = score([row(), ...['pre-existing', 'new-coverage', 'flaky', 'baseline-unavailable'].map((classification) => row({ dimension: 'functional', tier: 'HARD', classification, regressed: 'true', subscore: '' }))]);
    expect(result.status).toBe(0);
  });
  test('an unavailable baseline cannot be scored as stable', () => {
    const result = score([row({ classification: 'baseline-unavailable' })]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('BASELINE_UNAVAILABLE');
  });
});
