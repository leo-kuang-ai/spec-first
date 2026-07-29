'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');
const plugin = require('../../src/cli/plugin');

const skill = fs.readFileSync(path.resolve(__dirname, '../../skills/spec-lfg/SKILL.md'), 'utf8');
const simplifySkill = fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-simplify-code/SKILL.md'),
  'utf8',
);
const reviewFollowup = fs.readFileSync(
  path.resolve(__dirname, '../../skills/spec-lfg/references/review-followup.md'),
  'utf8',
);

describe('spec-lfg current contracts', () => {
  test('owns plan completion after return-to-caller gates close', () => {
    expect(skill).toContain('plan_status_completion_candidate');
    expect(skill).toContain('internal plan-status complete');
    expect(skill).toContain('active → completed');
    expect(skill).toMatch(/after simplification, required review, residual handoff, and final verification/i);
    expect(skill).toContain('task pack');
    expect(skill).toContain('source_plan');
    expect(skill).toContain('plan_status_completion_degraded_reason');
    expect(skill).toContain('legacy-plan-lifecycle-degraded');
    expect(skill).toContain('html-plan-lifecycle-degraded');
    expect(skill).toMatch(/skip mutation.*preserve the verified development result/i);
    expect(skill).toContain('all in-scope U-IDs/tasks accounted for and completed');
    expect(skill).toContain('an empty blocker list');
    expect(skill).toMatch(/failed, not-run, missing, or indeterminate result blocks lifecycle mutation/i);
  });

  test('describes Simplify verification scope without claiming an unconditional full test suite', () => {
    expect(skill).toContain('全项目 typecheck/lint');
    expect(skill).toContain('默认运行 changed-path scoped tests');
    expect(skill).toContain('影响面明显扩大或 runner 无法缩小时才扩大测试范围');
    expect(skill).toContain('最终 verification gate 仍拥有完整 closeout truth');
    expect(skill).not.toContain('it preserves behavior and runs the test suite');
    expect(simplifySkill).toContain('Run typecheck and lint over the full project');
    expect(simplifySkill).toContain('Run tests scoped to the changed paths');
    expect(simplifySkill).toContain('Broaden scope when the change has obvious wide reach');
    expect(simplifySkill).toContain('If the test runner has no scoping mechanism, run the full suite');
  });

  test('uses the explicit LFG request as a scoped independent-review dispatch authorization', () => {
    expect(skill).toContain('委派独立代码审查副作用');
    expect(skill).toContain('worker_dispatch_authorization: authorized');
    expect(skill).not.toContain('review_dispatch_authorization');
    expect(skill).toContain('authorization_source: current-user-explicit-spec-lfg');
    expect(skill).toContain('one delegated read-only independent code review');
    expect(skill).toContain('coverage.dispatch_reason_code');
    expect(skill).toMatch(/status: complete[\s\S]*inline-fallback/is);
    expect(skill).toMatch(/`failed`、`degraded`、`skipped`[\s\S]*副作用前停止/is);
    expect(reviewFollowup).toContain('只消费该对象');
    expect(reviewFollowup).toContain('coverage.dispatch_reason_code');
    expect(reviewFollowup).toContain('status 为 `failed`、`degraded`、`skipped`');
    expect(reviewFollowup).toContain('JSON `actionable_findings`');
    expect(reviewFollowup).not.toContain('or the markdown Actionable Findings section');
  });

  test('keeps explicit target-origin as a caller-owned browser input', () => {
    expect(skill).toContain('target-origin:<origin>');
    expect(skill).toMatch(/remove at most one standalone\s+`target-origin:<origin>` token/);
    expect(skill).toContain('Before step 1');
    expect(skill).toMatch(/do\s+not pass it to planning/);
    expect(skill).toContain('exact `forwarded_arguments` payload');
    expect(skill).toContain('same `forwarded_arguments` payload');
    expect(skill).toContain('caller_target_origin');
    expect(skill).toContain('browser_applicability: applicable | not_applicable');
    expect(skill).toContain('not filename extension alone');
    expect(skill).toContain('target-origin-missing');
    expect(skill).toContain('target-origin-invalid');
    expect(skill).toContain('mode:pipeline target-origin:<origin>');
    expect(skill).toContain('caller owns the project server lifecycle');
    expect(skill).toContain('browser-mutation-authorization-required');
    expect(skill).not.toContain('browser_runtime_profile_path');
    expect(skill).not.toContain('runtime profile provenance');
    expect(skill).not.toContain('server-command-unsafe-or-ambiguous');
    expect(skill).not.toContain('server-runtime-worktree-drift');
    expect(skill).not.toContain('server command');
    expect(skill).toContain('without invoking the browser skill or its wrapper');
  });

  test('closes browser and cleanup gates before every durable or outward shipping side effect', () => {
    const reviewIndex = skill.indexOf('5. **Apply review fixes locally**');
    const browserIndex = skill.indexOf('6. **Decide browser applicability');
    const finalVerificationIndex = skill.indexOf('6.5. **Final working-tree verification**');
    const shippingIndex = skill.indexOf('**Shipping precondition (steps 7–9).**');
    const residualIndex = skill.indexOf('7. **Autonomous residual handoff**');
    const lifecycleIndex = skill.indexOf('7.5. **Complete the source plan lifecycle marker.**');
    const commitIndex = skill.indexOf('8. Invoke the `spec-commit-push-pr` skill');
    const ciIndex = skill.indexOf('9. **CI watch and autofix loop**');

    expect([reviewIndex, browserIndex, finalVerificationIndex, shippingIndex, residualIndex, lifecycleIndex, commitIndex, ciIndex])
      .not.toContain(-1);
    expect(reviewIndex).toBeLessThan(browserIndex);
    expect(browserIndex).toBeLessThan(finalVerificationIndex);
    expect(finalVerificationIndex).toBeLessThan(shippingIndex);
    expect(shippingIndex).toBeLessThan(residualIndex);
    expect(residualIndex).toBeLessThan(lifecycleIndex);
    expect(lifecycleIndex).toBeLessThan(commitIndex);
    expect(commitIndex).toBeLessThan(ciIndex);
    expect(reviewFollowup).toContain('leave verified review fixes in the working tree');
    expect(reviewFollowup).toContain('Do not stage, commit, push, file tracker items, or edit a PR');
    expect(reviewFollowup).not.toContain('git commit');
    expect(reviewFollowup).not.toContain('git push');
  });

  test('re-verifies the final working tree with deterministic freshness evidence', () => {
    expect(skill).toContain('pre_final_verification_fingerprint');
    expect(skill).toContain('initial_verification_run_summary_ref');
    expect(skill).toContain('verified_worktree_fingerprint');
    expect(skill).toContain('working-tree-fingerprint.cjs');
    expect(skill).toMatch(/verification_run_summary_ref.*different from.*initial_verification_run_summary_ref/is);
    expect(skill).toMatch(/second helper invocation[\s\S]*same\s+fingerprint/i);
    expect(skill).toContain('final-verification-stale');
    expect(skill).toMatch(/Targeted checks.*never replace it/is);
  });

  test('resolves the fingerprint helper from its own package instead of a source checkout', () => {
    expect(skill).toContain('$SKILL_DIR/scripts/working-tree-fingerprint.cjs');
    expect(skill).not.toContain('skills/spec-work/scripts/working-tree-fingerprint.cjs');
    expect(skill).toMatch(/never[\s\S]{0,20}locate it through a `skills\/` source checkout path/i);
  });

  test('bundles a byte-identical package-local projection of the spec-work fingerprint helper', () => {
    const owner = fs.readFileSync(
      path.resolve(__dirname, '../../skills/spec-work/scripts/working-tree-fingerprint.cjs'),
    );
    const projection = fs.readFileSync(
      path.resolve(__dirname, '../../skills/spec-lfg/scripts/working-tree-fingerprint.cjs'),
    );
    expect(projection).toEqual(owner);
    expect(owner.toString('utf8')).toContain('Canonical owner：spec-work');
    expect(owner.toString('utf8')).toContain('Package-local projection：spec-lfg');
  });

  test('projects the package-local fingerprint helper into every supported host plan', () => {
    const sourceHelper = fs.readFileSync(
      path.resolve(__dirname, '../../skills/spec-lfg/scripts/working-tree-fingerprint.cjs'),
    );

    for (const platform of getSupportedPlatforms()) {
      const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-lfg-fingerprint-${platform}-`));
      try {
        const adapter = getAdapter(platform);
        const { plan } = plugin.planBundledAssetSync(projectRoot, adapter);
        const runtimeRoot = adapter.skillsRoot;
        const helperPath = path.posix.join(
          runtimeRoot.replace(/\\/g, '/'),
          'spec-lfg/scripts/working-tree-fingerprint.cjs',
        );
        const operation = plan.operations.find((entry) => entry.path === helperPath);

        expect(operation).toBeDefined();
        expect(Buffer.from(operation.contents, 'utf8')).toEqual(sourceHelper);
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });

  test('treats final-verification-stale as a named-cause stop with a re-entry path', () => {
    expect(skill).toMatch(/final-verification-stale[\s\S]{0,80}not a terminal[\s\S]{0,10}verdict/i);
    expect(skill).toContain('spec-first init');
    expect(skill).toMatch(/managed `\.gitignore` block/);
    expect(skill).toMatch(/re-enter step 6\.5[\s\S]{0,30}fresh pre-capture/i);
  });

  test('preserves the caller argument payload from brainstorm through spec-plan', () => {
    expect(skill).toContain('forwarded_arguments');
    expect(skill).toMatch(/standalone\s+`target-origin:<origin>` token/);
    expect(skill).toMatch(/preserve\s+every remaining argument in its original order/);
    expect(skill).toContain('requirements-only plan path');
    expect(skill).toContain('Do not paraphrase the path');
    expect(skill).toContain('same `forwarded_arguments` payload');
  });

  test('keeps spec-lfg model-invocable in every supported host projection', () => {
    for (const platform of getSupportedPlatforms()) {
      const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-lfg-invocation-${platform}-`));
      try {
        const adapter = getAdapter(platform);
        const { plan } = plugin.planBundledAssetSync(projectRoot, adapter);
        const expectedPath = path.posix.join(adapter.skillsRoot, 'spec-lfg/SKILL.md');
        const operation = plan.operations.find((entry) => entry.path === expectedPath);

        expect(operation).toBeDefined();
        expect(operation.contents).toMatch(/^name: spec-lfg$/m);
        expect(operation.contents).not.toMatch(/^disable-model-invocation: true$/m);
        expect(operation.contents).toContain('Use only when the current user explicitly requests spec-lfg');
        expect(operation.contents).toContain('commit_authorization: authorized');
        expect(operation.contents).toContain('landing_authorization: authorized');
        expect(operation.contents).toContain('authorization_source: current-user-explicit-spec-lfg');
        expect(operation.contents).toContain('`mode:pipeline` only selects unattended execution and never grants authority');
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });

  test('requires LFG to consume wrapper status without becoming a browser executor', () => {
    for (const requiredField of [
      'origin provenance',
      'wrapper probe `status`/`reason_code`',
      'capabilities.exact_origin_confirmed',
      'every route/step status',
      'action_process_calls',
      'browser cleanup `status`/`reason_code`',
      'private evidence refs',
      'limitations',
    ]) {
      expect(skill).toContain(requiredField);
    }
    expect(skill).toContain('browser cleanup');
    expect(skill).toContain('do not let passed route/step results hide cleanup failure');
    expect(skill).toContain('caller-provided origin is not mutation authorization');
    expect(skill).not.toContain('server status');
    expect(skill).not.toContain('server cleanup');
    expect(skill).not.toContain('worktree comparison');
    expect(skill).not.toContain('agent-browser');
  });
});
