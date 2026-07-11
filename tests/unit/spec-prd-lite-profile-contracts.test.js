'use strict';

const fs = require('node:fs');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

const SKILL = read('skills/spec-prd/SKILL.md');
const LITE = read('skills/spec-prd/references/product-analysis-lite.md');
const CASES = new Map(
  JSON.parse(read('skills/spec-prd/evals/examples.json')).cases
    .map((entry) => [entry.id, entry]),
);

describe('spec-prd Contract Reset Lite profile', () => {
  test('is exact-token opt-in and leaves the default profile unchanged', () => {
    expect(SKILL).toContain('only the exact invocation token `analysis_profile=contract-reset-lite` activates Contract Reset Lite');
    expect(SKILL).toContain('Natural-language requests such as "make the PRD shorter" or "simplify the workflow" do not activate it');
    expect(SKILL).toContain('Without the token, use the default profile unchanged');
    expect(SKILL).toContain('otherwise set `analysis_profile=default`');
  });

  test('loads one brief without changing artifact, receipt, or validate boundaries', () => {
    expect(SKILL).toContain('load `product-analysis-lite.md` first and build its single Product Analysis Brief');
    expect(SKILL).toContain('the single Product Analysis Brief is the compatibility representation of this gate and Product Expert risk ranking');
    expect(LITE).toContain('`docs/brainstorms/*-requirements.md` with `artifact_kind: prd-requirements`');
    expect(LITE).toContain('Create no separate Product Analysis artifact');
    expect(LITE).toContain('optional downstream `--verify-receipt` diagnostic');
    expect(LITE).toContain('Validate uses the same Brief only as a report structure and remains zero mutation');
    expect(LITE).not.toContain('artifact_readiness: requirements-only');
    expect(LITE).not.toContain('product_contract_source: spec-prd');
  });

  test('keeps source authority and release-bounded closure explicit', () => {
    expect(LITE).toContain('`source_ref` and `source_type`');
    expect(LITE).toContain('authority scope');
    expect(LITE).toContain('The phrase "not in this release" alone is not closure');
    expect(LITE).toContain('plus a reopen condition');
    expect(LITE).toContain('an independent planner would not need to invent load-bearing WHAT');
  });

  test('eval fixtures cover opt-in, near-neighbor, and validate boundaries', () => {
    const optIn = CASES.get('contract-reset-lite-explicit-opt-in');
    const nearNeighbor = CASES.get('contract-reset-lite-near-neighbor-default');
    const validate = CASES.get('contract-reset-lite-validate-report-only');

    expect(optIn).toBeDefined();
    expect(optIn.expected).toContain('one run-local Product Analysis Brief represents analysis gate, product risk ranking, and owner checkpoint');
    expect(nearNeighbor).toBeDefined();
    expect(nearNeighbor.must_not).toContain('must not infer Contract Reset Lite from a generic request for concision');
    expect(validate).toBeDefined();
    expect(validate.must_not).toContain('must not write, rewrite, finalize in write mode, or materialize provider output');
  });
});
