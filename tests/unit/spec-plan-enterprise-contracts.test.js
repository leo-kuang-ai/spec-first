'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');
const { planBundledAssetSync, syncBundledAssets, inspectInstalledAssets } = require('../../src/cli/plugin');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_PATH = path.join(REPO_ROOT, 'skills', 'spec-plan', 'SKILL.md');
const SPEC_WORK_PATH = path.join(REPO_ROOT, 'skills', 'spec-work', 'SKILL.md');
const EVALS_DIR = path.join(REPO_ROOT, 'skills', 'spec-plan', 'evals');
const OUTPUT_QUALITY_CASES_PATH = path.join(EVALS_DIR, 'output-quality-cases.json');
const EVALS_README_PATH = path.join(EVALS_DIR, 'README.md');
const DEEPENING_PATH = path.join(REPO_ROOT, 'skills', 'spec-plan', 'references', 'deepening-workflow.md');
const PLAN_TEMPLATE_PATH = path.join(REPO_ROOT, 'skills', 'spec-plan', 'references', 'plan-template.md');
const PLANNING_FLOW_PATH = path.join(REPO_ROOT, 'skills', 'spec-plan', 'references', 'planning-flow.md');
const ENTERPRISE_PLAN_REVIEW_PATH = path.join(
  REPO_ROOT,
  'skills',
  'spec-plan',
  'references',
  'enterprise-plan-review.md',
);
const REUSE_ANALYSIS_PATH = path.join(REPO_ROOT, 'skills', 'spec-plan', 'references', 'reuse-analysis.md');

const EXPECTED_OUTPUT_QUALITY_SOURCE_REFS = Object.freeze([
  'skills/spec-plan/SKILL.md',
  'skills/spec-plan/references/planning-flow.md',
  'skills/spec-plan/references/governance-boundaries.md',
  'skills/spec-plan/references/plan-handoff.md',
  'skills/spec-plan/references/plan-template.md',
  'skills/spec-plan/references/enterprise-plan-review.md',
  'skills/spec-plan/references/reuse-analysis.md',
  'docs/contracts/workflows/skill-agent-quality-governance.md',
]);

function plannedRuntimeContent(adapter, targetPath) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-plan-enterprise-runtime-'));

  try {
    const { plan } = planBundledAssetSync(projectRoot, adapter);
    const operation = plan.operations.find((entry) => entry.path === targetPath);
    if (!operation) {
      throw new Error(`Missing planned runtime operation for ${targetPath}`);
    }
    return operation.contents;
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

function runtimeSpecPlanReferencePath(adapter, filename) {
  if (adapter.id === 'claude') {
    return `.claude/spec-first/workflows/spec-plan/references/${filename}`;
  }

  return `.agents/skills/spec-plan/references/${filename}`;
}

function syncedRuntimeInspectionAfter(adapter, mutate) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-plan-enterprise-inspect-'));

  try {
    syncBundledAssets(projectRoot, adapter);
    mutate(projectRoot);
    return inspectInstalledAssets(projectRoot, adapter);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

function specPlanDriftIssues(inspection) {
  const entry = inspection.skills.drifted.find((item) => item.skillName === 'spec-plan');
  return entry ? entry.issues : [];
}

const RUNTIME_DRIFT_CASES = Object.freeze([
  ['claude', 'enterprise-plan-review.md'],
  ['codex', 'enterprise-plan-review.md'],
  ['claude', 'reuse-analysis.md'],
  ['codex', 'reuse-analysis.md'],
]);

function adapterFor(platform) {
  return platform === 'claude' ? new ClaudeAdapter() : new CodexAdapter();
}

describe('spec-plan enterprise and reuse contracts', () => {
  test('uses reuse-analysis as an independent new-surface decision lens', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const planningFlow = fs.readFileSync(PLANNING_FLOW_PATH, 'utf8');
    const reuse = fs.readFileSync(REUSE_ANALYSIS_PATH, 'utf8');
    const planTemplate = fs.readFileSync(PLAN_TEMPLATE_PATH, 'utf8');
    const specWork = fs.readFileSync(SPEC_WORK_PATH, 'utf8');

    expect(skill).toContain('read `skills/spec-plan/references/reuse-analysis.md`');
    expect(skill).toContain('A `reuse / extend / new` decision when the plan proposes a new source surface');
    expect(planningFlow).toContain('### 1.1c Existing Capability / Reuse Analysis Trigger');
    expect(planningFlow).toContain('read `skills/spec-plan/references/reuse-analysis.md`');
    expect(planningFlow).toContain('Key Technical Decisions');
    expect(planningFlow).toContain('Implementation Unit `Approach`');
    expect(planningFlow).not.toContain('must output a reuse matrix for every plan');
    expect(planTemplate).toContain('## Existing Capability / Reuse Analysis');
    expect(planTemplate).toContain('- **Work-phase recheck:**');
    expect(specWork).toContain('`## Existing Capability / Reuse Analysis`');
    expect(specWork).toContain('`Work-phase recheck:` field');
    expect(specWork).toContain('prefer `reuse` or `extend`');

    for (const token of [
      '## Existing Capability Inventory',
      '## Reuse / Extend / New Decision',
      '## Ownership Boundaries',
      '## Non-Goals',
      '## Work-Phase Recheck',
      'generated runtime mirrors',
      'Do not let scripts decide whether a new surface is semantically justified',
      'Do not require Lightweight plans to output a long reuse matrix',
    ]) {
      expect(reuse).toContain(token);
    }

    expect(reuse).toContain('`governance-boundaries.md` | Context/evidence/source-runtime/provider trust boundaries');
    expect(reuse).toContain('`enterprise-plan-review.md` | Enterprise high-risk readiness triggers');
  });

  test('enterprise readiness is conditional and reuses existing specialists', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const planningFlow = fs.readFileSync(PLANNING_FLOW_PATH, 'utf8');
    const deepening = fs.readFileSync(DEEPENING_PATH, 'utf8');
    const enterprise = fs.readFileSync(ENTERPRISE_PLAN_REVIEW_PATH, 'utf8');
    const agentDir = path.join(REPO_ROOT, 'agents');
    const agentNames = new Set(fs.readdirSync(agentDir)
      .filter((file) => file.endsWith('.agent.md'))
      .map((file) => fs.readFileSync(path.join(agentDir, file), 'utf8').match(/^name:\s*(.+)$/m))
      .filter(Boolean)
      .map((match) => match[1].trim()));

    expect(skill).toContain('Enterprise / High-Risk Readiness');
    expect(skill).toContain('read `skills/spec-plan/references/enterprise-plan-review.md`');
    expect(planningFlow).toContain('Enterprise high-risk triggers are an advisory signal toward `Standard` or `Deep`');
    expect(planningFlow).toContain('privacy/personal-data flow');
    expect(planningFlow).toContain('data/ML consistency');
    expect(planningFlow).toContain('read `skills/spec-plan/references/enterprise-plan-review.md`');
    expect(deepening).toContain('read `skills/spec-plan/references/enterprise-plan-review.md`');
    expect(deepening).toContain('Enterprise trigger-to-specialist mapping');

    for (const token of [
      '## Trigger Matrix',
      'Money / ledger / payment',
      'Authentication / authorization / permissions / audit / sensitive data',
      'Privacy / personal-data flow',
      'High QPS / large data / long-running work',
      'Cross-service RPC / MQ / async event',
      'State machine / compensation / dead state',
      'DDL / data migration / irreversible change / cache consistency',
      'Data / ML consistency',
      'Background scheduled task',
      'Rollout / rollback / feature flag',
      '## Required Appendix by Trigger',
      '## Hard Gates',
      'PRD or review-origin functionality is not covered',
      'Money, security, auth, permission, audit, or sensitive-data behavior',
      'Data migration, backfill, irreversible write, or cache consistency work',
      'High-risk rollout lacks a feature flag',
      'Retry, async, scheduled, or cross-service work',
      '## Review Rubric',
      'Explicit trade-off for high-risk KTDs',
      'Privacy beyond DB fields',
      'Data / ML consistency',
      'logs, analytics, third-party transfer',
      'offline/online parity',
      'scripts may only verify anchors, files, source refs, and fixture shape',
      'Do not add these appendices to Lightweight plans that do not hit a trigger',
      '## Non-Goals / Policy Boundary',
    ]) {
      expect(enterprise).toContain(token);
    }

    for (const specialist of [
      'spec-api-contract-reviewer',
      'spec-security-sentinel',
      'spec-data-integrity-guardian',
      'spec-data-migration-expert',
      'spec-deployment-verification-agent',
      'spec-performance-oracle',
    ]) {
      expect(deepening).toContain(`\`${specialist}\``);
      expect(enterprise).toContain(`\`${specialist}\``);
      expect(agentNames.has(specialist)).toBe(true);
    }
  });

  test('output-quality fixtures expose strict source refs and objective assertions', () => {
    const readme = fs.readFileSync(EVALS_README_PATH, 'utf8');
    const payload = JSON.parse(fs.readFileSync(OUTPUT_QUALITY_CASES_PATH, 'utf8'));

    expect(readme).toContain('maintainer-only planning review fixtures');
    expect(readme).toContain('不是 executable eval runner');
    expect(readme).toContain('不是 provider-backed model telemetry');
    expect(readme).toContain('必须声明 `input_files`、`baseline_risks`、`with_skill_expectations`、`objective_assertions` 和 `evidence_status`');
    expect(readme).toContain('每个 output-quality case 必须在 `missing_evidence` 中显式标注');
    expect(readme).toContain('不能声称 fixture 已证明真实模型输出质量提升');
    expect(payload.schema_version).toContain('spec-plan-output-quality-cases');
    expect(payload.coverage_tags).toEqual(['expected', 'output-quality']);
    expect(payload.source_ref_authority).toBe('source');
    expect(payload.source_refs).toEqual(EXPECTED_OUTPUT_QUALITY_SOURCE_REFS);
    expect(payload.source_refs.join('\n')).not.toContain('.agents/skills/');
    expect(payload.source_refs.join('\n')).not.toContain('.claude/');
    expect(payload.source_refs.join('\n')).not.toContain('.codex/');
    expect(payload.source_refs.join('\n')).not.toContain('../../docs/');
    expect(payload.source_refs.join('\n')).not.toContain('docs/brainstorms/');
    expect(payload.source_refs.join('\n')).not.toContain('docs/项目审查/');
    expect(payload.cases.length).toBeGreaterThanOrEqual(15);

    for (const evalCase of payload.cases) {
      expect(evalCase.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(Array.isArray(evalCase.input_files)).toBe(true);
      for (const field of ['baseline_risks', 'with_skill_expectations', 'objective_assertions']) {
        expect(Array.isArray(evalCase[field])).toBe(true);
        expect(evalCase[field].length).toBeGreaterThan(0);
        for (const entry of evalCase[field]) {
          expect(typeof entry).toBe('string');
          expect(entry.trim().length).toBeGreaterThan(0);
        }
      }
      expect(typeof evalCase.expected_outcome).toBe('string');
      expect(evalCase.evidence_status).toBe('file-backed fixture');
      expect(evalCase.missing_evidence).toEqual(expect.arrayContaining([
        expect.stringMatching(/model execution evidence|provider telemetry|human adjudication/),
      ]));
      expect(evalCase.missing_evidence).not.toContain('file-backed fixture');
      for (const inputFile of evalCase.input_files) {
        expect(inputFile.evidence).toBe('file-backed fixture');
        expect(fs.existsSync(path.join(REPO_ROOT, inputFile.path))).toBe(true);
      }
    }

    const casesById = new Map(payload.cases.map((entry) => [entry.id, entry]));
    for (const requiredId of [
      'highrisk-permission-api-requires-concrete-authz',
      'highrisk-high-qps-requires-capacity-decisions',
      'highrisk-mq-write-requires-idempotency-and-failure-path',
      'highrisk-data-migration-requires-backfill-and-rollback',
      'highrisk-scheduled-job-requires-idempotency-and-monitoring',
      'highrisk-rollout-requires-flag-and-rollback-gate',
      'highrisk-prd-coverage-gap-blocks-handoff',
      'highrisk-api-contract-change-requires-compatibility-plan',
      'highrisk-money-ledger-requires-invariant-and-audit',
      'highrisk-state-machine-requires-transition-and-compensation',
      'lightweight-crud-stays-lean-no-enterprise-appendix',
    ]) {
      expect(casesById.has(requiredId)).toBe(true);
      expect(casesById.get(requiredId).missing_evidence).toEqual(expect.arrayContaining([
        expect.stringMatching(/model execution evidence|provider telemetry|human adjudication/),
      ]));
    }
    expect(casesById.get('review-origin-plan-preserves-findings').objective_assertions.join('\n')).toContain('not fabricated');
    expect(casesById.get('unsupported-plan-needs-direct-evidence').with_skill_expectations.join('\n')).toContain('Direct Evidence');
    expect(casesById.get('handoff-does-not-silently-compile-task-pack').objective_assertions.join('\n')).toContain('No case claims an executable task pack exists');
    expect(casesById.get('generated-runtime-mirror-remains-non-source').objective_assertions.join('\n')).toContain('Generated mirror paths do not appear as source_refs');
    expect(casesById.get('lightweight-crud-stays-lean-no-enterprise-appendix').objective_assertions.join('\n')).toContain('No Enterprise Risk Appendix');
  });

  test('eval support files are projected while preserving source-authority refs', () => {
    const claudeRuntimeOutputQuality = plannedRuntimeContent(
      new ClaudeAdapter(),
      '.claude/spec-first/workflows/spec-plan/evals/output-quality-cases.json',
    );
    const codexRuntimeOutputQuality = plannedRuntimeContent(
      new CodexAdapter(),
      '.agents/skills/spec-plan/evals/output-quality-cases.json',
    );
    const codexRuntimeReadme = plannedRuntimeContent(
      new CodexAdapter(),
      '.agents/skills/spec-plan/evals/README.md',
    );

    for (const runtimeContent of [claudeRuntimeOutputQuality, codexRuntimeOutputQuality]) {
      const payload = JSON.parse(runtimeContent);
      expect(payload.schema_version).toContain('spec-plan-output-quality-cases');
      expect(payload.coverage_tags).toEqual(['expected', 'output-quality']);
      expect(payload.source_ref_authority).toBe('source');
      expect(payload.source_refs).toEqual(EXPECTED_OUTPUT_QUALITY_SOURCE_REFS);
      expect(payload.source_refs.join('\n')).not.toContain('.claude/spec-first/workflows/spec-plan/SKILL.md');
      expect(payload.source_refs.join('\n')).not.toContain('.agents/skills/spec-plan/SKILL.md');
      expect(payload.source_refs.join('\n')).not.toContain('.codex/');
    }
    expect(codexRuntimeReadme).toContain('maintainer-only planning review fixtures');
  });

  test('enterprise and reuse references are runtime-copied for both hosts', () => {
    for (const adapter of [new ClaudeAdapter(), new CodexAdapter()]) {
      const runtimeSkill = plannedRuntimeContent(
        adapter,
        adapter.id === 'claude'
          ? '.claude/spec-first/workflows/spec-plan/SKILL.md'
          : '.agents/skills/spec-plan/SKILL.md',
      );
      const runtimePlanningFlow = plannedRuntimeContent(
        adapter,
        runtimeSpecPlanReferencePath(adapter, 'planning-flow.md'),
      );
      const enterpriseReference = plannedRuntimeContent(
        adapter,
        runtimeSpecPlanReferencePath(adapter, 'enterprise-plan-review.md'),
      );
      const reuseReference = plannedRuntimeContent(
        adapter,
        runtimeSpecPlanReferencePath(adapter, 'reuse-analysis.md'),
      );

      expect(runtimeSkill).toContain(`read \`${runtimeSpecPlanReferencePath(adapter, 'reuse-analysis.md')}\``);
      expect(runtimePlanningFlow).toContain(`read \`${runtimeSpecPlanReferencePath(adapter, 'enterprise-plan-review.md')}\``);
      expect(runtimePlanningFlow).toContain(`read \`${runtimeSpecPlanReferencePath(adapter, 'reuse-analysis.md')}\``);
      expect(enterpriseReference).toContain('## Trigger Matrix');
      expect(enterpriseReference).toContain('Privacy / personal-data flow');
      expect(enterpriseReference).toContain('Data / ML consistency');
      expect(enterpriseReference).toContain('## Hard Gates');
      expect(reuseReference).toContain('## Ownership Boundaries');
      expect(reuseReference).toContain('## Non-Goals');
    }
  });

  test.each(RUNTIME_DRIFT_CASES)(
    'runtime integrity detects a missing %s reference (%s)',
    (platform, filename) => {
      const adapter = adapterFor(platform);
      const inspection = syncedRuntimeInspectionAfter(adapter, (projectRoot) => {
        fs.rmSync(path.join(projectRoot, runtimeSpecPlanReferencePath(adapter, filename)));
      });

      expect(specPlanDriftIssues(inspection)).toContain(`missing_file:references/${filename}`);
    },
  );

  test.each(RUNTIME_DRIFT_CASES)(
    'runtime integrity detects a drifted %s reference (%s)',
    (platform, filename) => {
      const adapter = adapterFor(platform);
      const inspection = syncedRuntimeInspectionAfter(adapter, (projectRoot) => {
        fs.writeFileSync(
          path.join(projectRoot, runtimeSpecPlanReferencePath(adapter, filename)),
          '# Drifted reference\n',
          'utf8',
        );
      });

      expect(specPlanDriftIssues(inspection)).toContain(`content_mismatch:references/${filename}`);
    },
  );
});
