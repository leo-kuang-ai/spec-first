'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');
const plugin = require('../../src/cli/plugin');

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
    expect(LITE).toMatch(/optional downstream\s+`--verify-receipt` diagnostic/);
    expect(LITE).toMatch(/Validate uses the same Brief only as a report structure and remains zero\s+mutation/);
    expect(LITE).not.toContain('artifact_readiness: requirements-only');
    expect(LITE).not.toContain('product_contract_source: spec-prd');
  });

  test('keeps a single human confirmer, evidence basis, and release-bounded closure explicit', () => {
    expect(LITE).toContain('`source_ref` and `source_type`');
    expect(SKILL).toContain('the current user is the sole human product confirmer');
    expect(SKILL).toContain('当前执行对话的用户是唯一人类产品确认人');
    expect(LITE).toContain('confirmation scope and basis');
    expect(LITE).toContain('The current user is the only human question recipient and the sole product');
    expect(LITE).toContain('named specialists or historical sign-off roles remain evidence');
    expect(LITE).toContain('does not\n  confirm product decisions or join the user interaction path');
    expect(LITE).toContain('The phrase "not in this release" alone is not closure');
    expect(LITE).toMatch(/plus\s+a reopen condition/);
    expect(LITE).toContain('an independent planner would not need to invent load-bearing WHAT');
  });

  test('eval fixtures cover opt-in, near-neighbor, and validate boundaries', () => {
    const optIn = CASES.get('contract-reset-lite-explicit-opt-in');
    const nearNeighbor = CASES.get('contract-reset-lite-near-neighbor-default');
    const validate = CASES.get('contract-reset-lite-validate-report-only');
    const specialist = CASES.get('contract-reset-lite-specialist-evidence-single-confirmer');

    expect(optIn).toBeDefined();
    expect(optIn.expected).toContain('one run-local Product Analysis Brief represents analysis gate, product risk ranking, and owner checkpoint');
    expect(optIn.expected).toContain('all human product confirmation routes only to the current user while specialist material remains evidence');
    expect(optIn.must_not).toContain('must not route a question or confirmation to a second human contact');
    expect(nearNeighbor).toBeDefined();
    expect(nearNeighbor.must_not).toContain('must not infer Contract Reset Lite from a generic request for concision');
    expect(validate).toBeDefined();
    expect(validate.must_not).toContain('must not write, rewrite, finalize in write mode, or materialize provider output');
    expect(specialist).toBeDefined();
    expect(specialist.expected).toContain('the only human confirmation route is the current user');
    expect(specialist.must_not).toContain('must not route the question to a named specialist or other human contact');
  });

  test('projects the single-confirmer Lite contract from source into every supported host plan', () => {
    for (const platform of getSupportedPlatforms()) {
      const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-prd-lite-${platform}-`));
      try {
        const adapter = getAdapter(platform);
        const { plan } = plugin.planBundledAssetSync(projectRoot, adapter);
        const runtimeRoot = adapter.workflowsRoot || adapter.skillsRoot;
        const expectedLitePath = path.join(
          runtimeRoot,
          'spec-prd/references/product-analysis-lite.md',
        ).replace(/\\/g, '/');
        const expectedSkillPath = path.join(
          runtimeRoot,
          'spec-prd/SKILL.md',
        ).replace(/\\/g, '/');
        const liteOperation = plan.operations.find(
          (operation) => operation.path === expectedLitePath,
        );
        const skillOperation = plan.operations.find(
          (operation) => operation.path === expectedSkillPath,
        );

        expect(liteOperation).toBeDefined();
        expect(liteOperation.contents).toContain(
          'The current user is the only human question recipient and the sole product',
        );
        expect(liteOperation.contents).toContain(
          'named specialists or historical sign-off roles remain evidence',
        );
        expect(skillOperation).toBeDefined();
        expect(skillOperation.contents).toContain(
          '当前执行对话的用户是唯一人类产品确认人',
        );
        expect(skillOperation.contents).toContain(
          '不允许路由第二个人类联系人',
        );
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });
});
