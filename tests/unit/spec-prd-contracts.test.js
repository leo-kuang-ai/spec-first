'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { validateFixture } = require('../../skills/spec-prd/evals/run-evals');

const repoRoot = path.resolve(__dirname, '../..');
const fixturePath = path.join(repoRoot, 'skills/spec-prd/evals/examples.json');
const runnerPath = path.join(repoRoot, 'skills/spec-prd/evals/run-evals.js');

describe('spec-prd eval fixture contract', () => {
  test('the checked-in fixture passes deterministic topology validation', () => {
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const report = validateFixture(fixture, fixturePath);
    expect(report.status).toBe('passed');
    expect(report.invalid_cases).toEqual([]);
    expect(report.case_count).toBeGreaterThan(0);
  });

  test('the source-only eval runner resolves its colocated default fixture', () => {
    const result = spawnSync(process.execPath, [runnerPath, '--json'], {
      cwd: repoRoot,
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: 'passed',
      fixture: fixturePath,
      reason_code: 'eval_fixture_passed',
    });
  });
});
