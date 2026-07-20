'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');
const skill = fs.readFileSync(path.join(repoRoot, 'skills/spec-code-review/SKILL.md'), 'utf8');
const deploymentPrompt = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/personas/deployment-verification-agent.md'),
  'utf8',
);
const subagentTemplate = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/subagent-template.md'),
  'utf8',
);
const maintainabilityPrompt = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/personas/maintainability-reviewer.md'),
  'utf8',
);
const maintainabilityCapabilityCases = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/evals/maintainability-capability-cases.json'),
  'utf8',
));
const outputTemplate = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/review-output-template.md'),
  'utf8',
);
const crossModel = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/cross-model-review.md'),
  'utf8',
);
const crossModelScript = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/scripts/cross-model-adversarial-review.sh'),
  'utf8',
);
const apiContractPrompt = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/personas/api-contract-reviewer.md'),
  'utf8',
);
const apiCapabilityCases = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/evals/api-contract-capability-cases.json'),
  'utf8',
));
const securityPrompt = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/personas/security-reviewer.md'),
  'utf8',
);
const personaCatalog = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/persona-catalog.md'),
  'utf8',
);
const securityCapabilityCases = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/evals/security-capability-cases.json'),
  'utf8',
));
const testingPrompt = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/personas/testing-reviewer.md'),
  'utf8',
);
const testingCapabilityCases = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/evals/testing-capability-cases.json'),
  'utf8',
));
const reliabilityPrompt = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/personas/reliability-reviewer.md'),
  'utf8',
);
const reliabilityCapabilityCases = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/evals/reliability-capability-cases.json'),
  'utf8',
));
const frontendQualityPrompt = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/personas/frontend-quality-reviewer.md'),
  'utf8',
);
const frontendQualityCapabilityCases = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/evals/frontend-quality-capability-cases.json'),
  'utf8',
));

describe('spec-code-review current contracts', () => {
  test('mode:agent is JSON report-only and never applies fixes', () => {
    expect(skill).toContain('**Report-only**: return **JSON**');
    expect(skill).toContain('In **`mode:agent`** it never mutates the tree');
    expect(skill).toContain('### Stage 5c: Act on findings (explicit apply only)');
    expect(skill).toContain('**Skip entirely in `mode:agent`, `mutation_policy: report-only`');
  });

  test('ordinary review is report-only and explicit apply/commit authorization stays separate', () => {
    expect(skill).toContain('mutation_policy: report-only');
    expect(skill).toContain('mutation_policy: apply-fixes');
    expect(skill).toMatch(/ordinary.*review.*report-only/is);
    expect(skill).toMatch(/explicit.*review-and-fix|review and fix/is);
    expect(skill).toContain('commit_authorization');
    expect(skill).toMatch(/apply-fixes.*does not authorize.*commit/is);
    expect(skill).toMatch(/without commit authorization.*verified uncommitted/is);
  });

  test('reviewer dispatch requires authorization and otherwise reports inline degraded coverage', () => {
    expect(skill).toContain('review_dispatch_authorization');
    expect(skill).toContain('dispatch_authorization_missing');
    expect(skill).toContain('subagent_capability_missing');
    expect(skill).toMatch(/permission settings.*not.*dispatch authorization/is);
    expect(skill).toMatch(/inline report-only.*status: degraded/is);
    expect(skill).toMatch(/do not claim.*persona.*independent.*cross-model/is);
    expect(skill).toContain('Inline fallback output contract');
    expect(skill).toContain('`reviewers: ["inline-fallback"]`');
    expect(skill).toContain('`verdict: Not ready`');
    expect(skill).toMatch(/resolve the Stage 4 Run ID.*before synthesis/is);
  });

  test('high-risk scenario posture limits review claims before dispatch or apply', () => {
    expect(skill).toContain('## Scenario Capability');
    expect(skill).toContain('Overrides: high-risk');
    expect(skill).toContain('`foreign-residual-workspace` -> `blocked-action-required`');
    expect(skill).toContain('optional external-tool evidence unavailable -> `fallback-only`');
    expect(skill).toContain('`non-git-build-workspace` coverage gaps -> `partial`');
  });

  test('maintainability mechanical thresholds survive subjective long-file suppression', () => {
    expect(maintainabilityPrompt).toContain('crossing **1000 lines** because of this diff');
    expect(maintainabilityPrompt).toContain('file line count crosses 1k in the diff');
    expect(maintainabilityPrompt).toContain('persona-defined mechanical threshold');
    expect(subagentTemplate).toContain('persona-defined mechanical threshold');
    expect(subagentTemplate).toContain('before/after line-count evidence');
    expect(subagentTemplate).toContain('subjective “file getting long” concern');
    expect(subagentTemplate).toContain('thin wrapper or duplicate canonical helper');
    expect(subagentTemplate).toContain('Do not reclassify that proven persona-owned condition as advisory');
    expect(subagentTemplate).toContain('Preserve the persona-assigned severity and confidence anchor');
    expect(subagentTemplate).toContain('use the normal action-class rubric for its route');
  });

  test('maintainability planted cases preserve mechanical findings and suppress subjective opinions', () => {
    expect(maintainabilityCapabilityCases.schema_version).toBe(
      'spec-first.spec-code-review.maintainability-cases/v1',
    );
    expect(maintainabilityCapabilityCases.owner).toBe('maintainability-reviewer');
    expect(maintainabilityCapabilityCases.source_refs).toEqual(expect.arrayContaining([
      'skills/spec-code-review/references/personas/maintainability-reviewer.md',
      'skills/spec-code-review/references/subagent-template.md',
    ]));

    const cases = new Map(maintainabilityCapabilityCases.cases.map((entry) => [entry.id, entry]));
    const crossing = cases.get('diff-crosses-persona-owned-1000-line-threshold');
    const thinWrapper = cases.get('new-thin-wrapper-with-no-added-behavior');
    const duplicateHelper = cases.get('duplicate-helper-next-to-canonical-owner');
    const subjectiveLongFile = cases.get('subjective-long-file-opinion-without-threshold-or-failure');

    expect(crossing).toMatchObject({ kind: 'positive' });
    expect(crossing.expected).toContain('P1 / anchor-100');
    expect(crossing.forbidden).toContain('suppress it as a generic file getting long concern');
    expect(thinWrapper).toMatchObject({ kind: 'positive' });
    expect(thinWrapper.expected).toContain('concrete thin-wrapper finding');
    expect(thinWrapper.forbidden).toContain('suppress it under the subjective long-file rule');
    expect(duplicateHelper).toMatchObject({ kind: 'positive' });
    expect(duplicateHelper.expected).toContain('duplicate-canonical-helper finding at anchor 100');
    expect(duplicateHelper.forbidden).toContain('recommend a third abstraction or registry');
    expect(subjectiveLongFile).toMatchObject({ kind: 'negative-owner' });
    expect(subjectiveLongFile.expected).toContain('keep suppression');
    expect(subjectiveLongFile.forbidden).toContain('route it to advisory merely because the file grew');
  });

  test('deployment verification requires executable evidence per item', () => {
    expect(deploymentPrompt).toContain(
      'Every checklist item must name the command or observable signal that proves the step succeeded.',
    );
  });

  test('prompt assets are skill-local', () => {
    expect(skill).toContain('Read the prompt file from `references/personas/`');
    expect(fs.existsSync(path.join(repoRoot, 'agents/spec-pr-comment-resolver.agent.md'))).toBe(false);
  });

  test('task review context is paired, digest-pinned, and honestly scoped', () => {
    expect(skill).toContain('`task-pack:<path>`');
    expect(skill).toContain('`task:<task_id>`');
    expect(skill).toContain('`task-context:<path>`');
    expect(skill).toContain('spec-code-review-task-context/v1');
    expect(skill).toContain('task_pack_digest');
    expect(skill).toContain('source_plan_section_titles');
    expect(skill).toContain('plan_context_mode');
    expect(skill).toContain('exact-file');
    expect(skill).toContain('cumulative-file');
    expect(skill).toContain('task_diff_isolation');
    expect(skill).toContain('required_gate_eligible');
    expect(skill).toContain('task-pack and task tokens must appear together');
    expect(skill).toContain('unknown task_id');
    expect(skill).toContain('task-plan-unreadable');
    expect(skill).toContain('task-plan-section-unreadable');
    expect(skill).toContain('task-plan-section-hints-missing');
    expect(skill).toContain('diff-only');
    expect(skill).toMatch(/section labels are absent[\s\S]*plan_context_mode: diff-only[\s\S]*do not fail the task solely/is);
    expect(skill).toMatch(/never plan body bytes, hashes, byte offsets, anchors/is);
    expect(subagentTemplate).toContain('Live plan context');
    expect(subagentTemplate).toMatch(/re-read the listed current file.*named section titles/is);
  });

  test('task mode keeps task-owned untracked files and rejects unattributed scope', () => {
    expect(skill).toContain('task_owned_untracked_files');
    expect(skill).toContain('pre_task_untracked_files');
    expect(skill).toContain('full-addition patch');
    expect(skill).toContain('task-scope-expansion');
    expect(skill).toContain('task-scope-unattributed');
  });

  test('review artifacts use one concrete portable path returned to every consumer', () => {
    for (const source of [skill, subagentTemplate, outputTemplate, crossModel]) {
      expect(source).toContain('REVIEW_ARTIFACT_DIR');
      expect(source).toContain('artifact_path');
      expect(source).not.toContain('/tmp/spec-first/spec-code-review');
    }

    expect(skill).toContain('os.tmpdir()');
    expect(skill).toContain('%TEMP%');
    expect(skill).toContain('$TMPDIR');
    expect(crossModelScript).toContain('<run-dir>');
    expect(crossModelScript).toContain('RUN_DIR=');
    expect(crossModelScript).not.toContain('/tmp/spec-first/spec-code-review');
  });

  test('mode:agent coverage exposes task scope and artifact write limitations', () => {
    expect(skill).toContain('"task_scope"');
    expect(skill).toContain('"artifact_write_status"');
    expect(skill).toContain('"artifact_path": "<absolute path or null>"');
    expect(skill).toContain('dispatch_authorization_missing');
  });

  test('API reviewer checks canonical drift and consumer evolution without owning API design', () => {
    expect(apiContractPrompt).toContain('### Interface Contracts');
    expect(apiContractPrompt).toContain('canonical artifact');
    expect(apiContractPrompt).toContain('schema、error shape、nullability、pagination、idempotency、compatibility');
    expect(apiContractPrompt).toContain('replacement、deprecation 或 removal');
    expect(apiContractPrompt).toContain('zero-use evidence');
    expect(apiContractPrompt).toContain('单次搜索没有命中不是充分证明');
    expect(apiContractPrompt).toContain('不把 review 变成接口设计');
    expect(apiContractPrompt).toContain('tenant/resource authorization');
    expect(apiContractPrompt).toContain('security reviewer');
    expect(apiContractPrompt).toContain('diff-only');
    expect(apiContractPrompt).not.toContain('第二套 findings schema');
  });

  test('API capability cases protect breaking, additive, and negative-owner boundaries', () => {
    expect(apiCapabilityCases.schema_version).toBe('spec-first.spec-code-review.api-contract-cases/v1');
    expect(apiCapabilityCases.owner).toBe('api-contract-reviewer');
    expect(apiCapabilityCases.source_refs).toEqual(expect.arrayContaining([
      'skills/spec-code-review/references/personas/api-contract-reviewer.md',
      'skills/spec-plan/references/interface-and-evolution-lens.md',
    ]));

    const cases = new Map(apiCapabilityCases.cases.map((entry) => [entry.id, entry]));
    const fieldRemoval = cases.get('canonical-artifact-field-removal-drift');
    const endpointRemoval = cases.get('deprecated-removal-without-replacement-or-zero-use');
    const additive = cases.get('additive-optional-field-with-synchronized-artifact');
    const privateRefactor = cases.get('private-refactor-and-security-only-boundary');

    expect(fieldRemoval).toMatchObject({ kind: 'positive' });
    expect(fieldRemoval.input).toContain('required `display_name`');
    expect(fieldRemoval.expected).toContain('breaking-drift finding');
    expect(fieldRemoval.forbidden).toContain('把删除当作 private refactor');
    expect(endpointRemoval).toMatchObject({ kind: 'positive' });
    expect(endpointRemoval.expected).toContain('zero-use evidence');
    expect(endpointRemoval.forbidden).toContain('假定没有搜索结果就等于 zero-use');
    expect(additive).toMatchObject({ kind: 'negative-owner' });
    expect(additive.expected).toContain('保持 suppression');
    expect(additive.forbidden).toContain('把 additive optional field 标为 breaking');
    expect(privateRefactor).toMatchObject({ kind: 'negative-owner' });
    expect(privateRefactor.expected).toContain('交给 security reviewer');
    expect(privateRefactor.forbidden).toContain('为 private helper rename 生成 API finding');
  });

  test('security reviewer selects concrete agent-native attack paths without taking API drift', () => {
    expect(skill).toContain('**Security selection boundary.**');
    expect(skill).toContain('agent/model/tool/web-content trust boundary');
    expect(skill).toContain('tenant/resource authorization');
    expect(skill).toContain('an unreachable dependency advisory or generic hardening idea is not a security finding');
    expect(personaCatalog).toContain('untrusted model/tool/web outputs crossing into a reachable dangerous sink');
    expect(securityPrompt).toContain('完整 attack path');
    expect(securityPrompt).toContain('tenant/resource access');
    expect(securityPrompt).toContain('plan_context_mode: live-plan');
    expect(securityPrompt).toContain('dependency advisory');
    expect(securityPrompt).toContain('schema/error/nullability/pagination/idempotency/compatibility drift 由 API reviewer 持有');
    expect(securityPrompt).toContain('不得发明计划中的 authorization intent');
  });

  test('security capability cases protect trusted-input, reachability, and owner boundaries', () => {
    expect(securityCapabilityCases.schema_version).toBe('spec-first.spec-code-review.security-cases/v1');
    expect(securityCapabilityCases.owner).toBe('security-reviewer');
    expect(securityCapabilityCases.source_refs).toEqual(expect.arrayContaining([
      'skills/spec-code-review/references/personas/security-reviewer.md',
      'skills/spec-code-review/references/persona-catalog.md',
    ]));

    const cases = new Map(securityCapabilityCases.cases.map((entry) => [entry.id, entry]));
    const shellSink = cases.get('untrusted-tool-output-reaches-shell-sink');
    const tenantGap = cases.get('tenant-resource-authorization-gap-with-stable-schema');
    const unreachableDependency = cases.get('unreachable-dependency-advisory-suppressed');
    const schemaOnly = cases.get('schema-only-drift-owned-by-api-reviewer');

    expect(shellSink).toMatchObject({ kind: 'positive' });
    expect(shellSink.expected).toContain('完整 attack path');
    expect(shellSink.forbidden).toContain('把 tool result 当成可信 command');
    expect(tenantGap).toMatchObject({ kind: 'positive' });
    expect(tenantGap.expected).toContain('只有 security reviewer');
    expect(tenantGap.forbidden).toContain('由 API compatibility reviewer 重复报告');
    expect(unreachableDependency).toMatchObject({ kind: 'negative-owner' });
    expect(unreachableDependency.expected).toContain('保持 suppression');
    expect(unreachableDependency.forbidden).toContain('仅凭 lockfile 名称报告 exploitable vulnerability');
    expect(schemaOnly).toMatchObject({ kind: 'negative-owner' });
    expect(schemaOnly.expected).toContain('留给 API reviewer');
    expect(schemaOnly.forbidden).toContain('以 security finding 重复报告 pagination drift');
  });

  test('testing reviewer distinguishes observable proof, contract interactions, and execution history', () => {
    expect(testingPrompt).toContain('DAMP');
    expect(testingPrompt).toContain('state/behavior outcome');
    expect(testingPrompt).toContain('interaction 本身确实是公开 contract 时例外成立');
    expect(testingPrompt).toContain('real implementation -> high-fidelity fake -> stub -> mock');
    expect(testingPrompt).toContain('serialization、middleware、callback、permission、retry 或 error translation');
    expect(testingPrompt).toContain('不能从最终绿测或 production/test 同时出现的 diff 推断“没有做 TDD”');
    expect(testingPrompt).toContain('spec-work` run-local evidence');
    expect(testingPrompt).toContain('Unobserved TDD history');
  });

  test('testing capability cases protect proof and TDD ownership boundaries', () => {
    expect(testingCapabilityCases.schema_version).toBe('spec-first.spec-code-review.testing-cases/v1');
    expect(testingCapabilityCases.owner).toBe('testing-reviewer');
    expect(testingCapabilityCases.source_refs).toEqual(expect.arrayContaining([
      'skills/spec-code-review/references/personas/testing-reviewer.md',
      'skills/spec-work/references/feedback-and-tests.md',
    ]));

    const cases = new Map(testingCapabilityCases.cases.map((entry) => [entry.id, entry]));
    const mockOnly = cases.get('mock-call-count-without-observable-state-proof');
    const weakDouble = cases.get('double-bypasses-real-cross-layer-seam');
    const interactionContract = cases.get('interaction-itself-is-public-contract');
    const noHistory = cases.get('green-diff-without-execution-history');

    expect(mockOnly).toMatchObject({ kind: 'positive' });
    expect(mockOnly.expected).toContain('state/behavior outcome proof');
    expect(mockOnly.forbidden).toContain('把 mock call count 当成完整行为验证');
    expect(weakDouble).toMatchObject({ kind: 'positive' });
    expect(weakDouble.expected).toContain('double fidelity gap');
    expect(weakDouble.forbidden).toContain('把跳过关键 seam 的 fake 视为 integration proof');
    expect(interactionContract).toMatchObject({ kind: 'negative-owner' });
    expect(interactionContract.expected).toContain('interaction 本身是 contract');
    expect(interactionContract.forbidden).toContain('把公开 protocol interaction 报为 brittle implementation coupling');
    expect(noHistory).toMatchObject({ kind: 'negative-owner' });
    expect(noHistory.expected).toContain('不推断开发者未做 TDD');
    expect(noHistory.forbidden).toContain('从最终 diff 报告未做 TDD');
  });

  test('reliability reviewer connects failure paths to correlation and actionable telemetry', () => {
    expect(reliabilityPrompt).toContain('Correlation, telemetry, and operational actionability');
    expect(reliabilityPrompt).toContain('correlation/request/trace identity');
    expect(reliabilityPrompt).toContain('silent failure');
    expect(reliabilityPrompt).toContain('alert config 是否声明 owner、action 和 runbook');
    expect(reliabilityPrompt).toContain('不能证明 dashboard query、alert delivery、on-call response 或 field outcome 已发生');
    expect(reliabilityPrompt).toContain('pure in-memory transform');
    expect(personaCatalog).toContain('correlation propagation, telemetry emission, alert owner/action/runbook');
  });

  test('reliability capability cases protect failure-path and field-evidence boundaries', () => {
    expect(reliabilityCapabilityCases.schema_version).toBe('spec-first.spec-code-review.reliability-cases/v1');
    expect(reliabilityCapabilityCases.owner).toBe('reliability-reviewer');
    expect(reliabilityCapabilityCases.source_refs).toEqual(expect.arrayContaining([
      'skills/spec-code-review/references/personas/reliability-reviewer.md',
      'skills/spec-code-review/references/persona-catalog.md',
    ]));

    const cases = new Map(reliabilityCapabilityCases.cases.map((entry) => [entry.id, entry]));
    const lostCorrelation = cases.get('cross-service-correlation-lost-on-retry');
    const silentFailure = cases.get('silent-failure-alert-without-actionability');
    const pureTransform = cases.get('pure-in-memory-transform-suppressed');
    const fieldOutcome = cases.get('telemetry-emission-not-field-outcome');

    expect(lostCorrelation).toMatchObject({ kind: 'positive' });
    expect(lostCorrelation.expected).toContain('correlation identity');
    expect(lostCorrelation.forbidden).toContain('把无关联 retry log 视为可诊断 telemetry');
    expect(silentFailure).toMatchObject({ kind: 'positive' });
    expect(silentFailure.expected).toContain('alert actionability gap');
    expect(silentFailure.forbidden).toContain('把 metric 名称存在当作 alert proof');
    expect(pureTransform).toMatchObject({ kind: 'negative-owner' });
    expect(pureTransform.expected).toContain('保持 suppression');
    expect(pureTransform.forbidden).toContain('推测不存在的 cascading failure');
    expect(fieldOutcome).toMatchObject({ kind: 'negative-owner' });
    expect(fieldOutcome.expected).toContain('source-level limitation');
    expect(fieldOutcome.forbidden).toContain('声称 field outcome 已确认');
  });

  test('frontend-quality stays internal, semantic, and separated from adjacent reviewers', () => {
    expect(skill).toContain('14 reviewer personas');
    expect(skill).toContain('`frontend-quality-reviewer`');
    expect(skill).toContain('**Frontend-quality selection boundary.**');
    expect(skill).toContain('semantic activation judgment, not an extension test');
    expect(skill).toContain('CSS-only changes that affect contrast/focus/layout/responsive/motion activate it');
    expect(skill).toContain('timing/race findings remain `julik-frontend-races`');
    expect(personaCatalog).toContain('## Conditional (8 personas)');
    expect(personaCatalog).toContain('Internal-only diff review');
    expect(frontendQualityPrompt).toContain('状态完整性');
    expect(frontendQualityPrompt).toContain('语义和键盘可用性');
    expect(frontendQualityPrompt).toContain('可读性和 responsive');
    expect(frontendQualityPrompt).toContain('julik-frontend-races-reviewer');
    expect(frontendQualityPrompt).toContain('不能声称浏览器验证已通过');
    expect(skill).not.toContain('spec-frontend');
  });

  test('frontend-quality capability cases protect visible-state, CSS edge, and owner boundaries', () => {
    expect(frontendQualityCapabilityCases.schema_version).toBe('spec-first.spec-code-review.frontend-quality-cases/v1');
    expect(frontendQualityCapabilityCases.owner).toBe('frontend-quality-reviewer');
    expect(frontendQualityCapabilityCases.source_refs).toEqual(expect.arrayContaining([
      'skills/spec-code-review/references/personas/frontend-quality-reviewer.md',
      'skills/spec-code-review/references/persona-catalog.md',
    ]));

    const cases = new Map(frontendQualityCapabilityCases.cases.map((entry) => [entry.id, entry]));
    const asyncForm = cases.get('async-form-missing-error-focus-and-retry-state');
    const cssRegression = cases.get('css-only-focus-contrast-and-breakpoint-regression');
    const noVisibleChange = cases.get('backend-docs-type-fixture-and-safe-token-only-suppressed');
    const raceOnly = cases.get('timing-race-owned-by-frontend-races');
    const unsafeRendering = cases.get('unsafe-rendering-owned-by-security');
    const testSufficiency = cases.get('test-sufficiency-owned-by-testing');
    const structuralComplexity = cases.get('structural-complexity-owned-by-maintainability');

    expect(asyncForm).toMatchObject({ kind: 'positive' });
    expect(asyncForm.expected).toContain('状态完整性和 keyboard/focus finding');
    expect(asyncForm.forbidden).toContain('只检查 happy path spinner');
    expect(cssRegression).toMatchObject({ kind: 'positive' });
    expect(cssRegression.expected).toContain('focus、contrast 和 responsive regression');
    expect(cssRegression.forbidden).toContain('因为只有 CSS 文件而跳过 reviewer');
    expect(noVisibleChange).toMatchObject({ kind: 'negative-owner' });
    expect(noVisibleChange.expected).toContain('不启用');
    expect(noVisibleChange.forbidden).toContain('仅按文件扩展名假定前端风险');
    expect(raceOnly).toMatchObject({ kind: 'negative-owner' });
    expect(raceOnly.expected).toContain('julik-frontend-races reviewer');
    expect(raceOnly.forbidden).toContain('以 frontend-quality finding 重复报告 stale response race');
    expect(unsafeRendering).toMatchObject({ kind: 'negative-owner' });
    expect(unsafeRendering.expected).toContain('security reviewer 作为 canonical owner');
    expect(unsafeRendering.forbidden).toContain('以 frontend-quality finding 重复报告同一 unsafe rendering sink');
    expect(testSufficiency).toMatchObject({ kind: 'negative-owner' });
    expect(testSufficiency.expected).toContain('testing reviewer 作为 canonical owner');
    expect(testSufficiency.forbidden).toContain('把测试充分性重复写成 frontend-quality finding');
    expect(structuralComplexity).toMatchObject({ kind: 'negative-owner' });
    expect(structuralComplexity.expected).toContain('maintainability reviewer 作为 canonical owner');
    expect(structuralComplexity.forbidden).toContain('以 frontend-quality finding 重复报告纯结构复杂度');
  });
});
