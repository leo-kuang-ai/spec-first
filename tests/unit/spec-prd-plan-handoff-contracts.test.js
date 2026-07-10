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

  test('keeps long or high-risk handoff slices focused on core requirements without HOW', () => {
    const skill = read('skills/spec-prd/SKILL.md');
    const template = read('skills/spec-prd/references/prd-output-template.md');
    const readiness = read('skills/spec-prd/references/prd-readiness-lens.md');
    const evals = JSON.parse(read('skills/spec-prd/evals/examples.json'));
    const target = evals.cases.find((entry) => entry.id === 'handoff-context-slice-no-how');

    expect(template).toContain('- top requirement / acceptance refs:');
    expect(template).toContain('- must-preserve behaviors:');
    expect(template).toContain('最多三个 load-bearing Requirement / Acceptance Example 引用');
    expect(skill).toContain('top requirement / acceptance refs');
    expect(skill).toContain('must-preserve behaviors');
    expect(readiness).toContain('top requirement / acceptance refs');
    expect(readiness).toContain('must-preserve behaviors');

    expect(target).toBeDefined();
    expect(target.input_shape).toContain('top requirement / acceptance refs');
    expect(target.input_shape).toContain('must-preserve behaviors');
    expect(target.expected).toContain('context slice 包含最多三个 load-bearing Requirement / Acceptance Example 引用和 must-preserve behaviors');
    expect(target.expected).toContain('context slice carries confirmed WHAT and residue, not task sequencing or file-level HOW');
  });
});
