'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { WORKFLOW_RUNTIME_CONTRACT_TESTS } = require('../../scripts/run-ai-dev-quality-gate');

const repoRoot = path.resolve(__dirname, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('spec-work structured shipping and shared verification contracts', () => {
  const workSkill = read('skills/spec-work/SKILL.md');
  const shipping = read('skills/spec-work/references/shipping-workflow.md');
  const debug = read('skills/spec-debug/SKILL.md');
  const review = read('skills/spec-code-review/SKILL.md');
  const reviewOutput = read('skills/spec-code-review/references/review-output-template.md');
  const catalog = read('docs/catalog/runtime-capabilities.md');

  test('spec-work runs checks before recording a structured summary and honest closeout', () => {
    expect(shipping).toContain('verification-profile load');
    expect(shipping).toContain('actually run');
    expect(shipping).toContain('repo-relative redacted log');
    expect(shipping).toContain('verification-run-summary record');
    expect(shipping).toContain('--workflow spec-work');
    expect(shipping).toContain('honest-closeout validate');
    expect(shipping).toMatch(/planned command.*not.*run/is);
    expect(shipping).toMatch(/dry-run.*not-run.*schedulable/is);

    const runSummaryIndex = shipping.indexOf('verification-run-summary record');
    const closeoutIndex = shipping.indexOf('honest-closeout validate');
    expect(runSummaryIndex).toBeGreaterThan(0);
    expect(closeoutIndex).toBeGreaterThan(runSummaryIndex);
  });

  test('spec-work conditionally writes immutable durable evidence after closeout', () => {
    expect(shipping).toContain('spec-work-run-artifact write');
    expect(shipping).toContain('spec-work-run-artifact-payload/v2');
    expect(shipping).toContain('trigger-task-pack');
    expect(shipping).toContain('trigger-not-run-validation');
    expect(shipping).toContain('trigger-deferred-follow-up');
    expect(shipping).toContain('trigger-substantive-work');
    expect(shipping).toContain('no-trigger-matched');
    expect(shipping).toContain('artifact-already-exists');
    expect(shipping).toMatch(/same.*workspace.*run-id.*verification-run-summary/is);
  });

  test('session-temp review evidence is sanitized into the current work run or downgraded', () => {
    expect(shipping).toContain('.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/');
    expect(shipping).toMatch(/actually consumed.*review\.json.*summary/is);
    expect(shipping).toMatch(/sanitize|redact/i);
    expect(shipping).toMatch(/copy.*fail.*limitation/is);
    expect(shipping).toContain('不得把绝对 temp path 写入');
    expect(shipping).toContain('review-evidence-copy-failed');
  });

  test('work handoffs expose evidence refs, verdicts, producer outcomes, and limitations', () => {
    for (const field of [
      'verification_run_summary_ref',
      'honest_closeout_verdict',
      'run_artifact_path',
      'run_artifact_reason_code',
      'claim_limitations',
    ]) {
      expect(workSkill).toContain(field);
    }
    expect(shipping).toContain('overall');
    expect(shipping).toMatch(/degraded|unsupported/);
    expect(shipping).toMatch(/must not.*all tests passed|must not.*全部验证通过/is);
  });

  test('spec-debug records real reproducer and regression evidence without writing work artifacts', () => {
    expect(debug).toContain('verification-run-summary record');
    expect(debug).toContain('--workflow spec-debug');
    expect(debug).toContain('honest-closeout validate');
    expect(debug).toMatch(/original reproducer.*regression.*broader/is);
    expect(debug).toContain('verification_run_summary_ref');
    expect(debug).toContain('honest_closeout_verdict');
    expect(debug).toContain('claim_limitations');
    expect(debug).not.toContain('spec-work-run-artifact write');
  });

  test('spec-code-review records only its own targeted command evidence', () => {
    expect(review).toContain('verification-run-summary record');
    expect(review).toContain('--workflow spec-code-review');
    expect(review).toContain('honest-closeout validate');
    expect(review).toMatch(/only when.*targeted verification.*actually ran/is);
    expect(review).toMatch(/persona.*validator.*not.*command evidence/is);
    expect(review).not.toContain('spec-work-run-artifact write');
    for (const source of [review, reviewOutput]) {
      expect(source).toContain('verification_evidence');
      expect(source).toContain('run_summary_ref');
      expect(source).toContain('closeout_verdict');
      expect(source).toContain('limitations');
    }
  });

  test('shipping preserves inline review signal but does not confuse it with independent coverage', () => {
    expect(shipping).toContain('dispatch_authorization_missing');
    expect(shipping).toContain('subagent_capability_missing');
    expect(shipping).toMatch(/preserve any bounded inline findings/is);
    expect(shipping).toMatch(/manual diff scan/is);
    expect(shipping).toMatch(/not persona\/validator\/cross-model evidence/is);
    expect(shipping).toMatch(/required task-level review gates remain blocked/is);
  });

  test('runtime catalog separates shared verification consumers from work artifact ownership', () => {
    const rows = catalog.split('\n');
    const honestRow = rows.find((line) => line.includes('honest-closeout.v1')) || '';
    const workRow = rows.find((line) => line.includes('spec-work run artifact')) || '';

    expect(honestRow).toContain('| true |');
    expect(honestRow).toContain('verification-run-summary.v1');
    expect(honestRow).toContain('spec-work');
    expect(honestRow).toContain('spec-debug');
    expect(honestRow).toContain('spec-code-review');
    expect(workRow).toContain('spec-work-run-artifact/v2 is owned by spec-work only');
  });

  test('AI quality gate includes helper, producer, integration, and shipping suites', () => {
    expect(WORKFLOW_RUNTIME_CONTRACT_TESTS).toEqual(expect.arrayContaining([
      'tests/unit/verification-run-summary.test.js',
      'tests/unit/honest-closeout.test.js',
      'tests/unit/spec-work-run-artifact-contract.test.js',
      'tests/unit/spec-work-run-artifact-producer.test.js',
      'tests/unit/spec-work-shipping-contracts.test.js',
      'tests/integration/spec-work-closeout-producer.test.js',
    ]));
  });
});
