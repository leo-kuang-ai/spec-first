'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { validateFixture } = require('../../skills/spec-prd/scripts/run-evals');

const repoRoot = path.resolve(__dirname, '../..');
const fixturePath = path.join(repoRoot, 'skills/spec-prd/evals/examples.json');

describe('spec-prd eval fixture contract', () => {
  test('the checked-in fixture passes deterministic topology validation', () => {
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const report = validateFixture(fixture, fixturePath);
    expect(report.status).toBe('passed');
    expect(report.invalid_cases).toEqual([]);
    expect(report.case_count).toBeGreaterThan(0);
  });
});
