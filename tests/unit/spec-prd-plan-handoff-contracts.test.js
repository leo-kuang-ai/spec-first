'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

const PRD_SKILL = read('skills/spec-prd/SKILL.md');
const EVAL_CASES = new Map(
  JSON.parse(read('skills/spec-prd/evals/examples.json')).cases
    .map((entry) => [entry.id, entry]),
);

describe('spec-prd to spec-plan handoff contracts', () => {
  test('keeps docs/brainstorms requirements as user-selected legacy plan input', () => {
    const plan = read('skills/spec-plan/SKILL.md');

    expect(plan).toContain('If it is a legacy `docs/brainstorms/*-requirements.{md,html}` file, use it as a legacy origin');
    expect(plan).toContain('These remain readable historical inputs; do not migrate or rewrite them.');
    expect(plan).not.toContain('--verify-receipt');
  });

  test('keeps producer finalize without declaring a mandatory consumer gate', () => {
    expect(PRD_SKILL).toContain('producer finalize remains mandatory before `spec-prd` claims a PRD is ready');
    expect(PRD_SKILL).toContain('downstream entry into `spec-plan` is user-owned');
    expect(PRD_SKILL).toContain('`--verify-receipt` remains available as an optional read-only diagnostic');
    expect(PRD_SKILL).not.toContain('consumer `--verify-receipt` are mandatory handoff discipline');
  });

  test('keeps the eval fixture aligned with the simplified handoff', () => {
    const target = EVAL_CASES.get('codex-degraded-producer-finalize');

    expect(target).toBeDefined();
    expect(target.expected).toContain('spec-plan continues to treat docs/brainstorms/*-requirements.md as user-selected legacy requirements input');
    expect(target.expected).toContain('--verify-receipt remains an optional read-only diagnostic rather than a mandatory spec-plan gate');
  });

  test('keeps long or high-risk handoff slices focused on core requirements without HOW', () => {
    const template = read('skills/spec-prd/references/prd-output-template.md');
    const readiness = read('skills/spec-prd/references/prd-readiness-lens.md');
    const target = EVAL_CASES.get('handoff-context-slice-no-how');

    expect(template).toContain('- top requirement / acceptance refs:');
    expect(template).toContain('- must-preserve behaviors:');
    expect(template).toContain('最多三个 load-bearing Requirement / Acceptance Example 引用');
    expect(template).toContain('Do not put implementation steps, file lists, or task sequencing');
    expect(PRD_SKILL).toContain('按 `prd-output-template.md` 的 canonical Handoff Context Slice');
    expect(readiness).toContain('按 `prd-output-template.md` 的 canonical Handoff Context Slice');

    expect(target).toBeDefined();
    expect(target.input_shape).toContain('top requirement / acceptance refs');
    expect(target.input_shape).toContain('must-preserve behaviors');
    expect(target.expected).toContain('context slice 包含最多三个 load-bearing Requirement / Acceptance Example 引用和 must-preserve behaviors');
    expect(target.expected).toContain('context slice carries confirmed WHAT and residue, not task sequencing or file-level HOW');
  });
});
