'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { readCodeReviewContract, phaseFiles } = require('../helpers/code-review-contract');

const repoRoot = path.resolve(__dirname, '../..');
const skillEntry = fs.readFileSync(path.join(repoRoot, 'skills/spec-code-review/SKILL.md'), 'utf8');
const skill = readCodeReviewContract();
const deploymentPrompt = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/personas/deployment-verification-agent.md'),
  'utf8',
);
const validatorTemplate = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/validator-template.md'),
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
const adversarialPrompt = fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/references/personas/adversarial-reviewer.md'),
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
const deploymentVerificationActivationCases = JSON.parse(fs.readFileSync(
  path.join(repoRoot, 'skills/spec-code-review/evals/deployment-verification-activation-cases.json'),
  'utf8',
));

describe('spec-code-review current contracts', () => {
  test('入口在行为执行前连接实际阶段 owner，过程不复制回入口', () => {
    for (const file of phaseFiles) {
      expect(skillEntry).toContain(`references/${file}`);
    }
    expect(skillEntry).not.toContain('### Stage 1: Determine scope');
    expect(skillEntry).not.toContain('### Stage 5: Merge findings');
    expect(skillEntry).toContain('**Report-only by default; never land.**');
    expect(skillEntry).toContain('In **`mode:agent`** it never mutates the tree');
    const modes = fs.readFileSync(path.join(repoRoot, 'skills/spec-code-review/references/modes-and-output.md'), 'utf8');
    const intent = fs.readFileSync(path.join(repoRoot, 'skills/spec-code-review/references/intent-and-plan.md'), 'utf8');
    const finish = fs.readFileSync(path.join(repoRoot, 'skills/spec-code-review/references/finish-review.md'), 'utf8');
    expect(modes).toContain('### Phase 0a: Freeze effective mode before any tool call');
    expect(intent).toContain('### Stage 2: Intent discovery');
    expect(intent).not.toContain('## Argument Parsing');
    expect(finish).toContain('scripts/findings-mechanics.py');
    expect(finish).toContain('reviewer_mutation_detected');
    expect(finish).toContain('metadata.json');
    const scope = fs.readFileSync(path.join(repoRoot, 'skills/spec-code-review/references/scope.md'), 'utf8');
    const snapshot = scope.split('### Stage 1a: Freeze the reviewed local scope')[1].split('### Stage 1b:')[0];
    const endpointAssignment = snapshot.indexOf('DIFF_A="$BASE"');
    const snapshotCapture = snapshot.indexOf('SCOPE_ARGS=(--base "$DIFF_A"');
    expect(endpointAssignment).toBeGreaterThanOrEqual(0);
    expect(snapshotCapture).toBeGreaterThanOrEqual(0);
    expect(endpointAssignment).toBeLessThan(snapshotCapture);
    expect(snapshot).toContain('DIFF_B=""');
  });

  test('mode:agent is JSON report-only and never applies fixes', () => {
    expect(skill).toContain('**Report-only**: return **JSON**');
    expect(skill).toContain('In **`mode:agent`** it never mutates the tree');
    expect(skill).toContain('### Phase 0a: Freeze effective mode before any tool call');
    expect(skill).toContain('source_mutation_gate: closed');
    expect(skill).toContain('adjacent fix/apply wording is intent data, not mutation authority');
    expect(skill).toContain('reviewer_mutation_detected');
    expect(skill).toContain('scope-snapshot.json');
    expect(skill).toContain('### Stage 5c: Act on findings (explicit apply only)');
    expect(skill).toContain('**Skip entirely in `mode:agent`, `mutation_policy: report-only`');
    expect(skill).toContain('Read `references/apply-findings.md` only after all three admission conditions pass');
    expect(fs.existsSync(path.join(
      repoRoot,
      'skills/spec-code-review/references/apply-findings.md',
    ))).toBe(true);
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
    expect(skill).toContain('worker_dispatch_authorization');
    expect(skill).toContain('capability_probe');
    expect(skill).toContain('worker_dispatch_capability');
    expect(skill).toContain('worker_capability_unproven');
    expect(skill).toContain('provider_untrusted');
    expect(skill).toContain('dispatch_authorization_missing');
    expect(skill).toContain('subagent_capability_missing');
    expect(skill).toMatch(/permission settings.*not.*dispatch authorization/is);
    expect(skill).toMatch(/inline report-only.*status: degraded/is);
    expect(skill).toMatch(/do not claim.*persona.*independent.*cross-model/is);
    expect(skill).toContain('Inline fallback output contract');
    expect(skill).toContain('`reviewers: ["inline-fallback"]`');
    expect(skill).toContain('`verdict: Not ready`');
    expect(skill).toMatch(/reuse the Phase 0a Run ID.*before synthesis/is);
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

  test('current-tree orientation 与 maintainability confidence 对齐 shared synthesis contract', () => {
    expect(skill).toContain('### Stage 2c: Resolve current-tree orientation');
    expect(skill).toContain('derive only from the fetched reviewed refs/diff');
    expect(skill).toContain('Do not persist or reuse this orientation');
    expect(skill).toContain('record the exact degraded fact');
    expect(maintainabilityPrompt).toContain('Anchor 50 - suppress');
    expect(maintainabilityPrompt).toContain('raise confidence to anchor 75');
    expect(maintainabilityPrompt).not.toContain('suppress unless severity is P1');
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

  test('existing review personas consume assurance evidence without inventing execution history', () => {
    expect(testingPrompt).toMatch(/mutation testing.*equivalent[- ]mutant.*survivor/is);
    expect(testingPrompt).toMatch(/changed-line coverage proves execution reach, not meaningful assertions or correct behavior/is);
    expect(testingPrompt).toContain('`transcribed`');
    expect(testingPrompt).toContain('`provider-confirmed`');
    expect(testingPrompt).toContain('`source-bound`');
    expect(testingPrompt).toMatch(/required-proof reconciliation.*omitted/is);
    expect(reliabilityPrompt).toMatch(/pre-existing baseline.*task-introduced/is);
    expect(adversarialPrompt).toMatch(/false-green.*required[- ]proof|required[- ]proof.*false-green/is);
  });

  test('deployment verification activation mirrors the orchestrator risk gate and cannot self-invoke', () => {
    const whenToUse = deploymentPrompt.match(/## When to Use This Agent([\s\S]*?)$/)?.[1] || '';
    const stage3 = skill.match(/### Stage 3: Select reviewers([\s\S]*?)### Stage 4:/)?.[1] || '';
    const stage4 = skill.match(/### Stage 4:([\s\S]*?)### Stage 5:/)?.[1] || '';

    expect(skill).toContain('Only the orchestrator applies this gate');
    expect(stage3).toContain('Only when both conditions pass');
    expect(stage3).toContain('selected_local_prompt_assets');
    expect(stage3).toContain('artifact path and the concrete risky operation');
    expect(stage4).toContain('only when Stage 3 already selected the asset');
    expect(stage4).toContain('both the migration/schema-artifact gate and risky-change gate passed');
    expect(stage4).toContain('safe additive migration');
    expect(stage4).toContain('does not authorize Stage 4 dispatch');
    expect(whenToUse).not.toBe('');
    expect(whenToUse).toContain('Only the `spec-code-review` orchestrator may invoke');
    expect(whenToUse).toContain('Both conditions must hold');
    expect(whenToUse).toContain('migration or schema artifact');
    expect(whenToUse).toContain('destructive DDL');
    expect(whenToUse).toContain('NOT NULL without default');
    expect(whenToUse).toContain('column rename/drop');
    expect(whenToUse).toContain('ordinary data-processing logic');
    expect(whenToUse).toContain('cannot independently authorize invocation');
    expect(whenToUse).not.toContain('PR modifies data processing logic');
    expect(whenToUse).not.toContain('Any change that could silently corrupt/lose data');

    const cases = new Map(deploymentVerificationActivationCases.cases.map((entry) => [entry.id, entry]));
    expect(cases.get('safe-additive-migration-does-not-dispatch')).toMatchObject({ kind: 'negative-owner' });
    expect(cases.get('safe-additive-migration-does-not-dispatch').expected).toContain('must not add deployment-verification-agent to selected_local_prompt_assets');
    expect(cases.get('risky-migration-dispatches-deployment-verification')).toMatchObject({ kind: 'positive' });
    expect(cases.get('risky-migration-dispatches-deployment-verification').expected).toContain('artifact path and risky backfill/NOT NULL operation');
  });

  test('validator treats why_it_matters as optional context exactly like Stage 5b', () => {
    expect(skill).toContain('`why_it_matters` when available');
    expect(validatorTemplate).toContain('This context is optional');
    expect(validatorTemplate).toContain('when absent, validate against the diff and cited code');
    expect(validatorTemplate).toContain('This field may be empty');
    expect(validatorTemplate).toContain('missing reviewer framing neither rejects nor confirms a finding');
    expect(validatorTemplate).not.toContain('required for the validator to understand the finding');
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
    expect(apiContractPrompt).toContain('schema, error shape, nullability, pagination, idempotency, and compatibility');
    expect(apiContractPrompt).toContain('replacement, deprecation, or removal');
    expect(apiContractPrompt).toContain('zero-use evidence');
    expect(apiContractPrompt).toContain('one empty search is insufficient');
    expect(apiContractPrompt).toContain('without turning review into interface design');
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
    expect(fieldRemoval.forbidden).toContain('Treat the removal as a private refactor');
    expect(endpointRemoval).toMatchObject({ kind: 'positive' });
    expect(endpointRemoval.expected).toContain('zero-use evidence');
    expect(endpointRemoval.forbidden).toContain('Assume no search results means zero use');
    expect(additive).toMatchObject({ kind: 'negative-owner' });
    expect(additive.expected).toContain('Keep suppression');
    expect(additive.forbidden).toContain('Mark an additive optional field as breaking');
    expect(privateRefactor).toMatchObject({ kind: 'negative-owner' });
    expect(privateRefactor.expected).toContain('to the security reviewer');
    expect(privateRefactor.forbidden).toContain('Generate an API finding for a private helper rename');
  });

  test('security reviewer selects concrete agent-native attack paths without taking API drift', () => {
    expect(skill).toContain('**Security selection boundary.**');
    expect(skill).toContain('agent/model/tool/web-content trust boundary');
    expect(skill).toContain('tenant/resource authorization');
    expect(skill).toContain('an unreachable dependency advisory or generic hardening idea is not a security finding');
    expect(personaCatalog).toContain('untrusted model/tool/web outputs crossing into a reachable dangerous sink');
    expect(securityPrompt).toContain('full attack path');
    expect(securityPrompt).toContain('tenant/resource authorization');
    expect(securityPrompt).toContain('plan_context_mode: live-plan');
    expect(securityPrompt).toContain('dependency advisory');
    expect(securityPrompt).toContain('Schema/error/nullability/pagination/idempotency/compatibility drift belongs to the API reviewer');
    expect(securityPrompt).toContain('Do not invent authorization intent');
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
    expect(shellSink.expected).toContain('complete attack path');
    expect(shellSink.forbidden).toContain('Treat the tool result as a trusted command');
    expect(tenantGap).toMatchObject({ kind: 'positive' });
    expect(tenantGap.expected).toContain('Only the security reviewer');
    expect(tenantGap.forbidden).toContain('Duplicate the finding in the API compatibility review');
    expect(unreachableDependency).toMatchObject({ kind: 'negative-owner' });
    expect(unreachableDependency.expected).toContain('Keep suppression');
    expect(unreachableDependency.forbidden).toContain('Report an exploitable vulnerability based only on a lockfile name');
    expect(schemaOnly).toMatchObject({ kind: 'negative-owner' });
    expect(schemaOnly.expected).toContain('to the API reviewer');
    expect(schemaOnly.forbidden).toContain('Duplicate pagination drift as a security finding');
  });

  test('testing reviewer distinguishes observable proof, contract interactions, and execution history', () => {
    expect(testingPrompt).toContain('DAMP');
    expect(testingPrompt).toContain('state and behavior outcomes');
    expect(testingPrompt).toContain('interaction itself is the public contract');
    expect(testingPrompt).toContain('real implementation -> high-fidelity fake -> stub -> mock');
    expect(testingPrompt).toContain('serialization, middleware, callbacks, permissions, retries, or error translation');
    expect(testingPrompt).toContain('Final green tests or simultaneous production/test edits do not establish that TDD was skipped');
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
    expect(mockOnly.forbidden).toContain('Treat mock call count as complete behavior verification');
    expect(weakDouble).toMatchObject({ kind: 'positive' });
    expect(weakDouble.expected).toContain('double fidelity gap');
    expect(weakDouble.forbidden).toContain('Treat a fake that bypasses critical boundaries as integration proof');
    expect(interactionContract).toMatchObject({ kind: 'negative-owner' });
    expect(interactionContract.expected).toContain('interaction itself is the contract');
    expect(interactionContract.forbidden).toContain('Report a public protocol interaction as brittle implementation coupling');
    expect(noHistory).toMatchObject({ kind: 'negative-owner' });
    expect(noHistory.expected).toContain('Do not infer that the developer skipped TDD');
    expect(noHistory.forbidden).toContain('Report missing TDD from the final diff');
  });

  test('reliability reviewer connects failure paths to correlation and actionable telemetry', () => {
    expect(reliabilityPrompt).toContain('Correlation, telemetry, and operational actionability');
    expect(reliabilityPrompt).toContain('correlation/request/trace identity');
    expect(reliabilityPrompt).toContain('silent failure');
    expect(reliabilityPrompt).toContain('alert configuration naming an owner, action, and runbook');
    expect(reliabilityPrompt).toContain('cannot prove dashboard queries, alert delivery, on-call response, or field outcomes occurred');
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
    expect(lostCorrelation.forbidden).toContain('Treat uncorrelated retry logs as diagnosable telemetry');
    expect(silentFailure).toMatchObject({ kind: 'positive' });
    expect(silentFailure.expected).toContain('alert actionability gap');
    expect(silentFailure.forbidden).toContain('Treat the existence of a metric name as alert proof');
    expect(pureTransform).toMatchObject({ kind: 'negative-owner' });
    expect(pureTransform.expected).toContain('Keep suppression');
    expect(pureTransform.forbidden).toContain('Speculate about a nonexistent cascading failure');
    expect(fieldOutcome).toMatchObject({ kind: 'negative-owner' });
    expect(fieldOutcome.expected).toContain('source-level limitation');
    expect(fieldOutcome.forbidden).toContain('Claim a field outcome was confirmed');
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
    expect(frontendQualityPrompt).toContain('State completeness');
    expect(frontendQualityPrompt).toContain('Semantics and keyboard access');
    expect(frontendQualityPrompt).toContain('Readability and responsiveness');
    expect(frontendQualityPrompt).toContain('julik-frontend-races-reviewer');
    expect(frontendQualityPrompt).toContain('cannot claim browser verification passed');
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
    expect(asyncForm.expected).toContain('state completeness and keyboard/focus findings');
    expect(asyncForm.forbidden).toContain('Check only the happy-path spinner');
    expect(cssRegression).toMatchObject({ kind: 'positive' });
    expect(cssRegression.expected).toContain('focus, contrast, and responsive regressions');
    expect(cssRegression.forbidden).toContain('Skip the reviewer because only CSS files changed');
    expect(noVisibleChange).toMatchObject({ kind: 'negative-owner' });
    expect(noVisibleChange.expected).toContain('does not activate');
    expect(noVisibleChange.forbidden).toContain('Assume frontend risk solely from file extensions');
    expect(raceOnly).toMatchObject({ kind: 'negative-owner' });
    expect(raceOnly.expected).toContain('julik-frontend-races reviewer');
    expect(raceOnly.forbidden).toContain('Duplicate a stale response race as a frontend-quality finding');
    expect(unsafeRendering).toMatchObject({ kind: 'negative-owner' });
    expect(unsafeRendering.expected).toContain('security reviewer reports the unsafe rendering finding as its canonical owner');
    expect(unsafeRendering.forbidden).toContain('Duplicate the same unsafe rendering sink as a frontend-quality finding');
    expect(testSufficiency).toMatchObject({ kind: 'negative-owner' });
    expect(testSufficiency.expected).toContain('testing reviewer reports the proof sufficiency gap as its canonical owner');
    expect(testSufficiency.forbidden).toContain('Duplicate test sufficiency as a frontend-quality finding');
    expect(structuralComplexity).toMatchObject({ kind: 'negative-owner' });
    expect(structuralComplexity.expected).toContain('maintainability reviewer reports structural complexity as its canonical owner');
    expect(structuralComplexity.forbidden).toContain('Duplicate pure structural complexity as a frontend-quality finding');
  });
});
