'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('spec-prd to spec-plan handoff contracts', () => {
  test('keeps docs/brainstorms requirements as user-selected legacy plan input', () => {
    const plan = read('skills/spec-plan/SKILL.md');

    expect(plan).toContain('If it is a legacy `docs/brainstorms/*-requirements.{md,html}` file, use it as a legacy origin');
    expect(plan).toContain('These remain readable historical inputs; do not migrate or rewrite them.');
    expect(plan).not.toContain('--verify-receipt');
  });

  test('keeps producer finalize without declaring a mandatory consumer gate', () => {
    const prd = read('skills/spec-prd/SKILL.md');

    expect(prd).toContain('producer finalize remains mandatory before `spec-prd` claims a PRD is ready');
    expect(prd).toContain('downstream entry into `spec-plan` is user-owned');
    expect(prd).toContain('`--verify-receipt` remains available as an optional read-only diagnostic');
    expect(prd).not.toContain('consumer `--verify-receipt` are mandatory handoff discipline');
  });

  test('keeps the eval fixture aligned with the simplified handoff', () => {
    const evals = JSON.parse(read('skills/spec-prd/evals/examples.json'));
    const target = evals.cases.find((entry) => entry.id === 'codex-degraded-producer-finalize');

    expect(target).toBeDefined();
    expect(target.expected).toContain('spec-plan continues to treat docs/brainstorms/*-requirements.md as user-selected legacy requirements input');
    expect(target.expected).toContain('--verify-receipt remains an optional read-only diagnostic rather than a mandatory spec-plan gate');
  });
});
