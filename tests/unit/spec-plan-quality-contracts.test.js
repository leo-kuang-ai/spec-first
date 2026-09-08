'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getAdapter, getSupportedPlatforms } = require('../../src/cli/adapters');
const plugin = require('../../src/cli/plugin');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SKILL_ROOT = path.join(REPO_ROOT, 'skills/spec-plan');

function read(relativePath) {
  return fs.readFileSync(path.join(SKILL_ROOT, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

describe('spec-plan quality integration contracts', () => {
  const skill = read('SKILL.md');
  const sections = read('references/plan-sections.md');
  const synthesis = read('references/synthesis-summary.md');
  const deepening = read('references/deepening-workflow.md');
  const evidence = read('references/planning-evidence-boundaries.md');
  const highRisk = read('references/high-risk-plan-lens.md');
  const interfaceEvolution = read('references/interface-and-evolution-lens.md');
  const frontendEngineering = read('references/frontend-engineering-lens.md');
  const architecture = read('references/agents/architecture-strategist.md');
  const deployment = read('references/agents/deployment-verification-agent.md');
  const patterns = read('references/agents/pattern-recognition-specialist.md');
  const handoff = read('references/plan-handoff.md');
  const enrichmentJudge = read('evals/fixtures/scripts/check-enrichment.sh');

  test('计划边界允许已授权交接，但不把计划产物当作实施授权', () => {
    expect(skill).toContain('## Planning-Only Safety Contract');
    expect(skill).toContain('plan-only request');
    expect(skill).toContain('real Plan Mode');
    expect(skill).toContain('explicitly requests planning followed by implementation');
    expect(skill).not.toContain('Handoff stays blocking');
    expect(skill).toMatch(/do not claim a hard write guarantee from prose alone/i);
  });

  test('计划交接按请求范围完成，普通复审不继承写权限', () => {
    for (const source of [skill, handoff]) {
      expect(source).toContain('mutation:report-only');
      expect(source).toContain('Ordinary review requests');
      expect(source).toContain('the menu is not a completion requirement');
      expect(source).toContain('top-level owner');
      expect(source).toContain('update_goal');
      expect(source).not.toMatch(/do \*\*not\*\* call `update_goal`|do not call `update_goal`/);
      expect(source).not.toContain('Never silently skip the question');
    }
    expect(handoff).toContain('existing active goal');
    expect(handoff).toContain('mutation:apply-fixes');
    expect(handoff).toContain('byte-identical');
    expect(handoff).toContain('return control to the caller');
  });

  test('goal 收尾仅作用于已存在且属于当前完整任务的目标', () => {
    for (const source of [skill, handoff]) {
      expect(source).toContain('belongs to the current full task');
      expect(source).toContain('If no goal exists');
      expect(source).toContain('do not update an unrelated goal');
    }
  });

  test('多宿主 goal 按实际能力分支，创建不推导读取或完成能力', () => {
    for (const source of [skill, handoff]) {
      expect(source).not.toContain('available tool list (Codex)');
      expect(source).not.toContain('`create_goal` on Codex');
      expect(source).not.toContain('user-typed `/goal` exists (Claude Code)');
      expect(source).toContain('creation, inspection, and completion');
    }
    expect(handoff).toContain('Creation capability does not prove inspection or completion capability');
    expect(handoff).toContain('exact documented command');
    expect(handoff).toContain('do not infer support from the host name');
  });

  test('新增 assurance 指令遵循项目中文治理且保留 contract literals', () => {
    expect(highRisk).toContain('## 风险驱动保障追踪');
    expect(highRisk).toContain('对每个高风险计划');
    expect(highRisk).not.toContain('For each high-risk plan');
    expect(sections).toContain('在相关时');
    expect(sections).toContain('避免使用泛化的');
  });

  test('makes the Goal Capsule a compact first-screen decision surface', () => {
    for (const anchor of [
      'recommended approach',
      'decision focus',
      'verification focus',
      'largest risk or boundary',
    ]) {
      expect(skill).toContain(anchor);
      expect(sections).toContain(anchor);
    }
    expect(sections).toMatch(/first-screen\s+orientation/);
    expect(read('references/markdown-rendering.md')).toContain('Goal Capsule is top-loaded');
    expect(read('references/html-rendering.md')).toContain('Keep it compact');
  });

  test('restores evidence, source-runtime, composition/ownership, surface, and high-risk lenses conditionally', () => {
    expect(skill).toContain('references/planning-evidence-boundaries.md');
    expect(skill).toContain('references/high-risk-plan-lens.md');
    expect(skill).toContain('references/interface-and-evolution-lens.md');
    expect(skill).toContain('references/frontend-engineering-lens.md');
    expect(skill).toContain(
      'token-value-only changes that do not affect contrast, focus, layout, responsive behavior, motion, or state expression',
    );
    expect(evidence).toContain('advisory');
    expect(evidence).toContain('Generated runtime mirrors and host-local managed slices are not source-of-truth');
    expect(evidence).toContain('Evidence & Limitations');
    expect(evidence).toMatch(/`reuse`[\s\S]*`extend`[\s\S]*`compose \/ thin-glue`[\s\S]*`new`/);
    expect(evidence).toContain('Generated runtime mirrors are never candidate owners');
    expect(highRisk).toContain('Scheduled or recurring background job');
    expect(highRisk).toContain('overlap protection');
    expect(highRisk).toContain('## Production Readiness Decisions');
    expect(highRisk).toContain('on-call questions');
    expect(highRisk).toContain('build context');
    expect(highRisk).toContain('correlation');
    expect(highRisk).toContain('cardinality');
    expect(highRisk).toContain('telemetry proof');
    expect(highRisk).toContain('removal condition');
    expect(highRisk).toContain('docs-only');
    expect(highRisk).toContain('artifact_readiness');
    expect(highRisk).toContain('Do not add a fixed enterprise appendix');
    expect(interfaceEvolution).toContain('## Shared Contract Core');
    expect(interfaceEvolution).toContain('## Greenfield Branch');
    expect(interfaceEvolution).toContain('## Evolution Branch');
    expect(interfaceEvolution).toContain('### Interface Contracts');
    expect(interfaceEvolution).toContain('canonical artifact');
    expect(interfaceEvolution).toContain('replacement-first');
    expect(interfaceEvolution).toContain('zero-use evidence');
    expect(interfaceEvolution).toContain('parser_unavailable');
    expect(interfaceEvolution).toContain('private helper');
    expect(interfaceEvolution).toContain('api-contract-reviewer');
    expect(frontendEngineering).toContain('## Required Planning Landing');
    expect(frontendEngineering).toContain('State matrix');
    expect(frontendEngineering).toContain('keyboard/focus');
    expect(frontendEngineering).toContain('contrast');
    expect(frontendEngineering).toContain('responsive');
    expect(frontendEngineering).toContain('spec-polish');
    expect(frontendEngineering).toContain('spec-test-browser');
    expect(frontendEngineering).toContain('julik-frontend-races-reviewer');
    expect(frontendEngineering).toContain('backend-only');
    expect(frontendEngineering).toContain('token-value-only');
    expect(readJson('evals/output-quality-cases.json').cases.map((entry) => entry.id)).toContain(
      'frontend-token-contrast-change-triggers',
    );
    expect(sections).toContain('in-scope');
    expect(sections).toContain('out-of-scope: <reason>');
    expect(sections).toContain('deferred: <owner/trigger>');
    expect(sections).toContain('Omit irrelevant surfaces');
    expect(deepening).toContain('service/backend');
    expect(deepening).toContain('verification/test');
  });

  test('high-risk planning lands confirmation, risk-to-proof trace, and evidence claim boundaries', () => {
    for (const marker of [
      '## 风险驱动保障追踪',
      'Product Contract confirmation',
      'largest unproven risk',
      '`required`',
      '`optional`',
      '`not applicable`',
      '`deferred`',
      '`transcribed`',
      '`provider-confirmed`',
      '`source-bound`',
      'required-proof reconciliation',
    ]) {
      expect(highRisk).toContain(marker);
    }
    expect(highRisk).toMatch(/source-bound.*不证明.*provider-confirmed/is);
    expect(highRisk).toMatch(/workflow-level semantic exit gate.*不是.*runtime hard enforcement/is);
    expect(sections).toMatch(/Verification Contract.*Product Contract confirmation.*evidence authority.*source binding.*required-proof reconciliation/is);
  });

  test('makes composition-first architecture a prompt-level judgment without banning justified new boundaries', () => {
    expect(skill).toContain('Inventory before invention');
    expect(skill).toContain('reuse / extend / compose / new');
    expect(evidence).toContain('## Existing Capability / Composition / Source Ownership Lens');
    expect(evidence).toContain('Thin glue may own only');
    expect(evidence).toContain('contract or representation translation');
    expect(evidence).toContain('failure propagation plus explicit fallback or degradation routing');
    expect(evidence).toContain('observability and evidence aggregation');
    expect(evidence).toContain('must not own duplicated domain truth');
    expect(evidence).toContain('a second workflow or pipeline');
    expect(evidence).toContain('forced reuse');
    expect(sections).toContain('compose / thin-glue');
    expect(synthesis).toContain('compose existing capabilities through thin glue');
    expect(deepening).toContain('wrapper or parallel pipeline');
    expect(architecture).toContain('composition-first decision ladder');
    expect(architecture).toContain('Composition is not an absolute preference');
    expect(patterns).toContain('Reuse And Composition Guidance');
    expect(patterns).toContain('unnecessary wrappers');
  });

  test('requires explicit dispatch authorization and preserves inline completion', () => {
    expect(skill).toContain('A public `spec-plan` invocation authorizes this workflow, not subagents');
    expect(skill).toContain('dispatch_authorization_missing');
    expect(skill).toContain('apply them inline or serially');
    expect(deepening).toContain('Plan generation and deepening must still complete through this inline fallback');
  });

  test('inline fallback uses bounded semantic lenses instead of preloading worker prompt assets', () => {
    expect(skill).toContain('worker seed material, not a mandatory inline dependency');
    expect(skill).toContain('Do not read a worker prompt asset merely because inline fallback is active');
    expect(skill).toContain('apply the concise scope in this file directly');

    expect(deepening).toContain('Conditional Section-to-Specialist Candidate Map');
    expect(deepening).toContain('Selecting a section never selects a prompt asset by itself');
    expect(deepening).toContain('specialist applicability gate');
    expect(deepening).toContain(
      'If direct source or the in-context section already closes the fired trigger, do not load the prompt asset',
    );
    expect(deepening).toContain('normal module change');
    expect(deepening).toContain('generic rollback mention');
    expect(deepening).toContain('the mere presence of Operational Notes');
    expect(deepening).toContain('do not by themselves justify `deployment-verification-agent`');
    expect(deepening).toContain('persistent data migration or backfill');
    expect(deepening).toContain('staged or feature-flagged rollout');
    expect(deepening).toContain('multi-version deployment compatibility');
    expect(deepening).toContain('concrete production launch sequence');
    expect(deepening).toContain('Re-evaluate remaining triggers after each inline improvement');
    expect(deepening).toContain('smallest sufficient set');

    expect(deployment).toContain('Do not invoke this prompt for ordinary stateless module changes');
    expect(deployment).toContain('without a concrete deployment or durable-data risk surface');
  });

  test('enrichment Judge compares the complete Product Contract region against the fixture baseline', () => {
    expect(enrichmentJudge).toContain('git show HEAD:"$plan"');
    expect(enrichmentJudge).toContain("sed -n '/<!-- PRODUCT_CONTRACT_START -->/,/<!-- PRODUCT_CONTRACT_END -->/p'");
    expect(enrichmentJudge).toContain('cmp -s');
    expect(enrichmentJudge).toContain('Product Contract region changed');
  });

  test('reviews HTML plans report-only and keeps producer-owned recompose bounded', () => {
    expect(skill).toMatch(/HTML.*report-only review/is);
    expect(skill).not.toContain('skipped_reason: output_format_html');
    expect(handoff).toContain('mutation_policy: report-only');
    expect(handoff).toContain('producer-fix candidates');
    expect(handoff).toMatch(/full recompose/i);
    expect(handoff).toMatch(/at most two.*recompose.*review/is);
    expect(handoff).toMatch(/artifact_readiness.*requirements-only/is);
    expect(handoff).toMatch(/remove Planning Contract, Implementation Units, Verification Contract, and Definition of Done/is);
    expect(handoff).toMatch(/Never flip readiness metadata while leaving implementation-ready sections in place/);
    expect(handoff).toMatch(/suppress.*spec-work.*goal/is);
    expect(handoff).not.toContain('skipped_reason = "output_format_html"');
    expect(handoff).not.toContain('HTML plans skip this phase entirely');
  });

  test('文档审查能力不可用时有界降级并立即返回 pipeline caller', () => {
    expect(handoff).toContain('spec_doc_review_capability_unavailable');
    expect(handoff).toContain('one bounded producer self-review');
    expect(handoff).toMatch(/do not re-read the complete generated artifact/i);
    expect(handoff).toContain('review_status: degraded');
    expect(handoff).toContain('independent_review: not_run');
    expect(handoff).toContain('must not be described as `Review complete` or `Doc review clean`');
    expect(handoff).toContain('return control to the pipeline caller immediately');
    expect(skill).toContain(
      'Do not preload `references/deepening-workflow.md` or `references/plan-handoff.md` before the initial plan write',
    );
    expect(skill).toContain('the explicit degraded fallback completed');
  });

  test('keeps maintainer fixtures structural, source-owned, and coverage-balanced', () => {
    const examples = readJson('evals/examples.json');
    const quality = readJson('evals/output-quality-cases.json');
    const exampleIds = new Set(examples.cases.map((entry) => entry.id));
    const qualityIds = new Set(quality.cases.map((entry) => entry.id));

    expect(examples.source_ref_authority).toBe('source');
    expect(quality.source_ref_authority).toBe('source');
    for (const id of [
      'unified-requirements-enrichment',
      'approach-comparison-routes-to-altitude',
      'existing-plan-deepening-preserves-artifact',
      'legacy-prd-is-compatible-input',
      'html-output-remains-exclusive-and-honest',
      'current-repo-orientation-has-inline-path',
      'planning-only-no-code-before-handoff',
      'dispatch-authorization-missing-falls-back-inline',
      'high-risk-async-plan-is-concrete',
      'production-readiness-staged-rollout-is-operational',
      'production-readiness-docs-only-stays-lightweight',
      'interface-greenfield-lands-canonical-contract',
      'interface-evolution-is-replacement-first',
      'interface-private-helper-stays-lightweight',
      'interface-drift-review-stays-with-reviewer',
      'frontend-async-form-plans-visible-states',
      'frontend-css-focus-and-contrast-regression-triggers',
      'frontend-backend-only-handler-stays-out',
      'frontend-token-value-only-stays-out',
      'new-skill-surface-needs-owner-decision',
    ]) {
      expect(exampleIds.has(id)).toBe(true);
    }
    expect(examples.cases.find((entry) =>
      entry.id === 'html-output-remains-exclusive-and-honest'
    ).expected_outcome).toMatch(/report-only.*zero reviewer mutation.*bounded producer recompose/i);
    for (const id of [
      'goal-capsule-supports-first-pass-decision',
      'unsupported-plan-exposes-evidence-limitations',
      'highrisk-money-write-protects-invariants',
      'highrisk-auth-privacy-names-enforcement-and-data-flow',
      'highrisk-migration-has-compatibility-and-rollback',
      'highrisk-scheduled-job-handles-overlap-and-catchup',
      'highrisk-rollout-has-owner-visible-gates',
      'highrisk-production-readiness-proves-observability-and-ci-fidelity',
      'highrisk-low-impact-config-keeps-production-ceremony-off',
      'interface-greenfield-has-one-canonical-artifact',
      'interface-evolution-requires-replacement-and-zero-use',
      'interface-private-refactor-does-not-trigger',
      'interface-reviewer-does-not-become-design-owner',
      'frontend-async-form-has-state-and-accessibility-contract',
      'frontend-css-focus-contrast-breakpoint-is-not-cosmetic',
      'frontend-backend-only-does-not-trigger',
      'frontend-token-only-does-not-trigger',
      'existing-capabilities-compose-through-thin-glue',
      'existing-owner-extends-instead-of-parallel-abstraction',
      'new-boundary-wins-when-reuse-mixes-concerns',
      'existing-capability-reused-as-is',
      'multi-surface-plan-closes-coverage',
      'lightweight-change-stays-lean',
    ]) {
      expect(qualityIds.has(id)).toBe(true);
    }
    for (const fixture of quality.cases) {
      expect(fixture.evidence_status).toBe('file-backed fixture');
      expect(fixture.missing_evidence).toEqual(expect.arrayContaining([
        'model execution evidence',
        'human adjudication',
      ]));
    }
    for (const sourceRef of [...examples.source_refs, ...quality.source_refs]) {
      expect(sourceRef).toMatch(/^skills\/spec-plan\//);
      expect(sourceRef).not.toMatch(/^\.(?:claude|codex|agents|cursor|kiro|qoder)\//);
    }
  });

  test('defines a complete degraded scenario contract and four architecture postures', () => {
    const examples = readJson('evals/examples.json');
    const quality = readJson('evals/output-quality-cases.json');
    const degradedById = new Map(examples.cases
      .filter((entry) => entry.degraded_contract)
      .map((entry) => [entry.id, entry.degraded_contract]));

    for (const id of [
      'dispatch-authorization-missing-falls-back-inline',
      'subagent-capability-missing-falls-back-inline',
      'web-capability-missing-records-research-limit',
      'current-repo-orientation-has-inline-path',
      'current-repo-dirty-input-is-recorded',
      'html-report-only-review-preserves-artifact',
      'reviewer-partial-failure-preserves-coverage',
      'mandatory-review-coverage-missing-is-incomplete',
    ]) {
      expect(degradedById.has(id)).toBe(true);
      const contract = degradedById.get(id);
      for (const field of [
        'facts',
        'authorization',
        'expected_fallback',
        'forbidden_behavior',
        'reason_code',
        'remaining_work',
        'claim_ceiling',
      ]) {
        expect(contract[field]).toBeTruthy();
      }
    }

    const postureIds = new Set(quality.cases.map((entry) => entry.id));
    for (const id of [
      'existing-capability-reused-as-is',
      'existing-owner-extends-instead-of-parallel-abstraction',
      'existing-capabilities-compose-through-thin-glue',
      'new-boundary-wins-when-reuse-mixes-concerns',
    ]) {
      expect(postureIds.has(id)).toBe(true);
    }
  });

  test('projects new runtime references to every supported host while keeping evals source-only', () => {
    for (const platform of getSupportedPlatforms()) {
      const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), `spec-plan-quality-${platform}-`));
      try {
        const adapter = getAdapter(platform);
        const { plan } = plugin.planBundledAssetSync(projectRoot, adapter);
        const operationPaths = new Set(plan.operations.map((operation) => operation.path));
        const runtimeRoot = adapter.workflowsRoot || adapter.skillsRoot;

        for (const relativePath of [
          'references/planning-evidence-boundaries.md',
          'references/high-risk-plan-lens.md',
          'references/interface-and-evolution-lens.md',
          'references/frontend-engineering-lens.md',
          'references/agents/agent-native-planning-strategist.md',
        ]) {
          expect(operationPaths).toContain(path.posix.join(runtimeRoot, 'spec-plan', relativePath));
        }
        expect([...operationPaths].some((operationPath) =>
          operationPath.includes('/spec-plan/evals/')
        )).toBe(false);
      } finally {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }
    }
  });
});
