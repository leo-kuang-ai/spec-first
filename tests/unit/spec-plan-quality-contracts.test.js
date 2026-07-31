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
  const patterns = read('references/agents/pattern-recognition-specialist.md');
  const handoff = read('references/plan-handoff.md');

  test('keeps planning-only and blocking handoff in the hot path', () => {
    expect(skill).toContain('## Planning-Only Safety Contract');
    expect(skill).toContain('planning is the only authorized effect');
    expect(skill).toContain('Handoff stays blocking');
    expect(skill).toMatch(/do not claim a hard write guarantee from prose alone/i);
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
    expect(skill).toContain('且不影响 contrast/focus/layout/responsive/motion/状态表达的 token-value-only');
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
