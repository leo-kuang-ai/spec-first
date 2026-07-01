'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const CodexAdapter = require('../../src/cli/adapters/codex');
const { syncSkills } = require('../../src/cli/plugin');
const { ALLOWED_TASK_FIELDS, REQUIRED_TASK_FIELDS } = require('../../src/cli/task-pack');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_PATH = path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'SKILL.md');
const SCHEMA_PATH = path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'references', 'task-pack-schema.md');
const GUIDE_PATH = path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'references', 'task-quality-guide.md');
const HANDOFF_CONTRACT_PATH = path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'references', 'execution-handoff-contract.md');
const EVALS_DIR = path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'evals');
const EVALS_README_PATH = path.join(EVALS_DIR, 'README.md');
const OUTPUT_QUALITY_CASES_PATH = path.join(EVALS_DIR, 'output-quality-cases.json');
const YAO_TRIGGER_CASES_PATH = path.join(EVALS_DIR, 'yao-trigger-cases.json');
const YAO_SEMANTIC_CONFIG_PATH = path.join(EVALS_DIR, 'semantic_config.json');
const YAO_OUTPUT_CASES_PATH = path.join(EVALS_DIR, 'output', 'cases.jsonl');
const BOUNDARY_CASES_PATH = path.join(EVALS_DIR, 'boundary-cases.json');
const OPENAI_PATH = path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'agents', 'openai.yaml');
const SPEC_WORK_PATH = path.join(REPO_ROOT, 'skills', 'spec-work', 'SKILL.md');
const PLAN_HANDOFF_PATH = path.join(REPO_ROOT, 'skills', 'spec-plan', 'references', 'plan-handoff.md');
const QUALITY_CONTRACT_PATH = path.join(REPO_ROOT, 'docs', 'validation', 'spec-write-tasks', 'quality-score-contract.md');
const FRESH_SOURCE_EVAL_PATH = path.join(
  REPO_ROOT,
  'docs',
  'validation',
  'spec-write-tasks',
  'fresh-source-eval-2026-06-23-quality-evidence-closure.md',
);
const OUTPUT_SCORECARD_JSON = path.join(REPO_ROOT, 'docs', 'validation', 'spec-write-tasks', 'output_quality_scorecard.json');
const ANALYSIS_JSON = path.join(REPO_ROOT, 'docs', 'validation', 'spec-write-tasks', 'task_pack_quality_analysis.json');
const DOWNSTREAM_OUTCOME_JSON = path.join(REPO_ROOT, 'docs', 'validation', 'spec-write-tasks', 'downstream_consumer_outcome.json');
const TASK_SIGNALS_CONTRACT_PATH = path.join(
  REPO_ROOT,
  'docs',
  'contracts',
  'governance',
  'task-governance-signals.md',
);
const OFFICIAL_SKILL_CREATOR_DIR = path.join(
  os.homedir(),
  '.codex',
  'plugins',
  'cache',
  'claude-plugins-official',
  'skill-creator',
  'local',
  'skills',
  'skill-creator',
);
const OFFICIAL_PACKAGE_SCRIPT = path.join(OFFICIAL_SKILL_CREATOR_DIR, 'scripts', 'package_skill.py');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function estimatedTokens(filePath) {
  return Math.ceil(read(filePath).length / 4);
}

describe('spec-write-tasks contracts', () => {
  test('source skill is a slim routeable spine with package-local references', () => {
    const skill = read(SKILL_PATH);
    const handoff = read(HANDOFF_CONTRACT_PATH);
    const guide = read(GUIDE_PATH);
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)[1];
    const frontmatterKeys = frontmatter
      .split('\n')
      .filter((line) => /^[a-zA-Z0-9_-]+:/.test(line))
      .map((line) => line.split(':', 1)[0]);

    expect(estimatedTokens(SKILL_PATH)).toBeLessThanOrEqual(3000);
    expect(frontmatterKeys).toEqual(expect.arrayContaining(['name', 'description']));
    expect(frontmatter).toContain('Public workflow entrypoint (/spec:write-tasks, $spec-write-tasks)');
    expect(frontmatter).toContain('settled local spec-plan');
    expect(frontmatter).toContain('existing local task pack');
    expect(frontmatter).toContain('explicit plan-splitting/task-doc requests');
    expect(frontmatter).toContain('high-complexity work suitability');
    expect(frontmatter).toContain('do not use for plan authoring, implementation execution, unresolved scope');
    expect(frontmatter).toContain('small low-risk plans');
    expect(frontmatter).toContain('progress/approval state');
    expect(frontmatter).toContain('remote/generic task lists');
    expect(frontmatter).toContain('generated runtime mirror edits');
    expect(frontmatter).toContain('Keep the plan as single source of truth');

    for (const heading of [
      '## Workflow Contract Summary',
      '### Inputs',
      '### Outputs',
      '### Workflow',
      '### When Not To Use',
    ]) {
      expect(skill).toContain(heading);
    }
    expect(skill).toContain('optional derived layer between `spec-plan` and `spec-work`');
    expect(skill).toContain('`spec-plan` is always the single source of truth');
    expect(skill).toContain('A task pack may rearrange execution slices, but must not change scope');
    expect(skill).toContain('`context_refs` are bounded reading pointers, not scope authority');
    expect(skill).toContain('Scripts validate identity, freshness, structure, hashes, concrete paths, and same-wave overlap');
    expect(skill).toContain('LLM/reviewers judge semantic task quality');
    expect(skill).toContain('`compile`');
    expect(skill).toContain('`skip`');
    expect(skill).toContain('`return-to-plan`');
    expect(skill).toContain('`draft-only`');
    expect(skill).toContain('`validate-only`');
    expect(skill).toContain('spec-first tasks validate <task-pack-path> --json');
    expect(skill).toContain('spec-first tasks hash <plan-path>');
    expect(skill).toContain('never self-report `deterministic_handoff: true`');
    expect(skill).toContain('High-risk packs return `next_action: review-task-pack`');
    expect(skill).toContain('`evals/` files are maintainer-only validation fixtures');
    expect(skill).toContain('[Execution Handoff Contract](references/execution-handoff-contract.md)');
    expect(skill).toContain('[Task Pack Schema](references/task-pack-schema.md)');
    expect(skill).toContain('[Task Quality Guide](references/task-quality-guide.md)');
    expect(skill).not.toContain('../../docs/');
    expect(skill).not.toContain('docs/validation/spec-write-tasks');
    expect(skill).not.toContain('scripts/spec-write-tasks');
    expect(skill).not.toContain('](../spec-plan/');
    expect(skill).not.toContain('](../spec-work/');

    expect(guide).toContain('## Input Quality Contract');
    expect(guide).toContain('Accepted inputs are local source plan paths');
    expect(guide).toContain('Rejected near-neighbors are implementation prompts');
    expect(guide).toContain('Downstream consumers are `spec-work`, high-risk doc-review handoff');
    expect(handoff).toContain('## Branch Decision Tree');
    expect(handoff).toContain('Every branch maps to either an output artifact or an explicit no-artifact rule');
    expect(handoff).toContain('dispatch_authorization: missing');

    expect(fs.existsSync(path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'references', 'input-output-contract.md'))).toBe(false);
    expect(fs.existsSync(path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'references', 'workflow-branching.md'))).toBe(false);
    expect(fs.existsSync(path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'manifest.json'))).toBe(false);
    expect(fs.existsSync(path.join(REPO_ROOT, 'skills', 'spec-write-tasks', 'agents', 'interface.yaml'))).toBe(false);
  });

  test('quality score contract explains the 92-ish ceiling and semantic evidence posture', () => {
    const contract = read(QUALITY_CONTRACT_PATH);

    expect(contract).toContain('quality_evidence_closure');
    expect(contract).toContain('约 92，而不是机械 100');
    expect(contract).toContain('score_is_signal_not_gate');
    for (const dimension of [
      'input_contract',
      'output_contract',
      'workflow_explicitness',
      'progressive_disclosure',
      'eval_readiness',
      'runtime_governance',
      'cross_host_portability',
    ]) {
      expect(contract).toContain(dimension);
    }
    expect(contract).toContain('audit-tool-gap');
    expect(contract).toContain('not-scored-with-reason');
    expect(contract).toContain('回滚边界');
    expect(contract).toContain('downstream_consumer_outcome.{json,md}');
    expect(contract).toContain('not_checked_with_reason');
    expect(contract).toContain('大型 source plan 处理仍然 deferred');
    expect(contract).toContain('## Yao Gate Posture');
    expect(contract).toContain('`trigger_eval.py` | runnable smoke');
    expect(contract).toContain('`run_output_eval.py` | runnable smoke');
    expect(contract).toContain('Do not add `skills/spec-write-tasks/manifest.json`');
    expect(contract).toContain('at least two public workflows need lifecycle metadata');
    expect(contract).toContain('fresh-source-eval-2026-06-23-quality-evidence-closure.md');
    expect(fs.existsSync(FRESH_SOURCE_EVAL_PATH)).toBe(true);
    expect(read(FRESH_SOURCE_EVAL_PATH)).toContain('fresh_source_eval:');
    expect(read(FRESH_SOURCE_EVAL_PATH)).toContain('resolved_status: passed_after_record_added');
  });

  test('task pack schema stays in parity with validator task fields', () => {
    const schema = read(SCHEMA_PATH);
    const taskCardsStart = schema.indexOf('## Task Cards');
    const taskCardsEnd = schema.indexOf('## Orientation Evidence');
    expect(taskCardsStart).toBeGreaterThan(-1);
    expect(taskCardsEnd).toBeGreaterThan(taskCardsStart);
    const taskCardsSection = schema.slice(taskCardsStart, taskCardsEnd);
    const documentedTaskFields = new Set(
      [...taskCardsSection.matchAll(/^\| `([a-z_]+)` \| /gm)].map((match) => match[1]),
    );

    expect(schema).toContain('source_plan_hash: "sha256:<64-hex>"');
    expect(schema).toContain('Current deterministic validation only checks frontmatter identity/freshness and the `Task Pack Contract` JSON structure');
    expect(schema).toContain('The validator checks only the enum structure, not whether the task semantically deserves a gate.');
    expect(schema).toContain('Scripts must not judge task splitting quality');

    for (const field of REQUIRED_TASK_FIELDS) {
      expect(ALLOWED_TASK_FIELDS.has(field)).toBe(true);
    }
    for (const field of ALLOWED_TASK_FIELDS) {
      expect(documentedTaskFields.has(field)).toBe(true);
    }
    for (const field of documentedTaskFields) {
      expect(ALLOWED_TASK_FIELDS.has(field)).toBe(true);
    }
  });

  test('execution handoff contract owns envelope, validation, and bounded review continuation', () => {
    const handoff = read(HANDOFF_CONTRACT_PATH);
    const contract = read(TASK_SIGNALS_CONTRACT_PATH);
    const boundaryCases = JSON.parse(read(BOUNDARY_CASES_PATH));

    expect(handoff).toContain('decision: compile | skip | return-to-plan | draft-only | validate-only');
    expect(handoff).toContain('reason_code: source_plan_missing | ambiguous_plan | missing_spec_id');
    expect(handoff).toContain('validity_scope: identity-freshness-structure-only');
    expect(handoff).toContain('spec-first tasks validate <task-pack-path> --json');
    expect(handoff).toContain('spec-first tasks hash <plan-path>');
    expect(handoff).toContain('invoking the public write-tasks workflow alone is not document-review dispatch authorization');
    expect(handoff).toContain('This is bounded auto-continuation, not general workflow chaining');
    expect(handoff).toContain('copy-ready current-host document-review invocation');
    expect(handoff).toContain('This shared reference owns the handoff semantics, not the per-host entrypoint mapping.');
    expect(handoff).not.toContain('/spec:doc-review <task-pack-path>');
    expect(handoff).not.toContain('$spec-doc-review <task-pack-path>');
    expect(contract).toContain('written source-plan structure is the primary evidence');

    const states = new Set(boundaryCases.cases.map((entry) => entry.dispatch_authorization).filter(Boolean));
    expect(states).toEqual(new Set(['missing', 'authorized', 'not_required']));
    const highRiskCase = boundaryCases.cases.find((entry) => entry.id === 'high-risk-review-gate');
    expect(highRiskCase.expected_next_action).toContain('next_action: review-task-pack');
    expect(highRiskCase.expected_next_action).toContain('dispatch_authorization: missing');
    expect(highRiskCase.forbidden_signals).toEqual(expect.arrayContaining([
      'auto-dispatch-without-authorization',
      'general-workflow-chaining',
    ]));
  });

  test('quality guide owns semantic quality without redefining schema fields or large-plan thresholds', () => {
    const guide = read(GUIDE_PATH);
    const skill = read(SKILL_PATH);

    expect(guide).toContain('`task-pack-schema.md` remains the source of truth for required fields');
    expect(guide).toContain('The quality bar is not whether every field is filled');
    expect(guide).toContain('Field Writing Guide');
    expect(guide).toContain('Task Pack Review Checklist');
    expect(guide).toContain('Large Implementation Unit Fan-Out');
    expect(guide).toContain('Vertical Slice And Feedback Loop Rules');
    expect(guide).toContain('`task-governance-signals.v1` is advisory cross-check input only');
    expect(guide).toContain('ignore its `candidate_level` for compile/skip decisions');
    expect(guide).toContain('Do not treat that output as confirmed low risk');
    expect(skill).not.toContain('large-plan threshold');
    expect(skill).not.toContain('wide-source-unit');
  });

  test('output-quality fixtures expose executable assertions and evidence gaps honestly', () => {
    const readme = read(EVALS_README_PATH);
    const payload = JSON.parse(read(OUTPUT_QUALITY_CASES_PATH));
    const scorecard = JSON.parse(read(OUTPUT_SCORECARD_JSON));
    const analysis = JSON.parse(read(ANALYSIS_JSON));
    const downstream = JSON.parse(read(DOWNSTREAM_OUTCOME_JSON));

    expect(readme).toContain('`deterministic_assertions` can be executed by the repo-level runner');
    expect(readme).toContain('`yao-trigger-cases.json`, `semantic_config.json`, and `output/cases.jsonl` provide Yao-compatible smoke fixtures');
    expect(readme).toContain('authoritative spec-first eval contract remains this directory');
    expect(readme).toContain('`objective_assertions` remain reviewer narrative');
    expect(readme).toContain('must be labeled as `missing evidence`');
    expect(readme).toContain('docs/validation/spec-write-tasks/output_quality_scorecard.{json,md}');
    expect(payload.schema_version).toContain('spec-write-tasks-output-quality-cases');
    expect(payload.coverage_tags).toEqual(expect.arrayContaining(['expected', 'output-quality']));
    expect(payload.source_refs).toEqual(expect.arrayContaining([
      'skills/spec-write-tasks/SKILL.md',
      'tests/fixtures/spec-write-tasks/valid/source-plan.md',
      'tests/fixtures/spec-write-tasks/small-plan/source-plan.md',
      'tests/fixtures/spec-write-tasks/high-risk-review/source-plan.md',
      'tests/fixtures/spec-write-tasks/high-risk-review/task-pack.md',
    ]));
    expect(payload.source_refs).not.toEqual(expect.arrayContaining([
      'docs/plans/2026-06-22-001-feat-user-language-sync-plan.md',
      'docs/tasks/2026-06-22-001-feat-user-language-sync-tasks.md',
    ]));

    for (const evalCase of payload.cases) {
      expect(evalCase.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(evalCase.input_files.length).toBeGreaterThan(0);
      expect(evalCase.baseline_risks.length).toBeGreaterThan(0);
      expect(evalCase.with_skill_expectations.length).toBeGreaterThan(0);
      expect(evalCase.objective_assertions.length).toBeGreaterThan(0);
      expect(evalCase.deterministic_assertions.length).toBeGreaterThan(0);
      for (const inputFile of evalCase.input_files) {
        expect(inputFile.evidence).toBe('file-backed fixture');
        expect(fs.existsSync(path.join(REPO_ROOT, inputFile.path))).toBe(true);
      }
      expect(evalCase.missing_evidence || []).not.toContain('file-backed fixture');
    }

    expect(scorecard.schema_version).toBe('spec-first.spec-write-tasks-output-quality-scorecard.v1');
    expect(scorecard.score_is_signal_not_gate).toBe(true);
    expect(scorecard.summary.deterministic_failed).toBe(0);
    expect(scorecard.summary.structural_errors).toBe(0);
    expect(scorecard.summary.recorded_outputs).toBeGreaterThanOrEqual(1);
    expect(scorecard.recorded_outputs[0].hash_status).toBe('matched');
    expect(scorecard.recorded_outputs[0].adjudication.status).toBe('model-adjudicated');
    expect(scorecard.recorded_outputs[0].adjudication.missing_evidence).toEqual(expect.arrayContaining([
      'human adjudication',
    ]));
    expect(analysis.advisory_only).toBe(true);
    expect(analysis.validator_boundary.cannot_override_validator).toBe(true);
    expect(downstream.outcomes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        consumer: 'spec-work',
        deterministic_handoff: true,
        execution_blocking_ambiguity: false,
      }),
      expect.objectContaining({
        consumer: 'current-host document-review',
        deterministic_handoff: true,
        execution_blocking_ambiguity: false,
      }),
    ]));
    expect(downstream.limitations.join('\n')).toContain('semantic task quality 仍由 reviewer 负责');
  });

  test('Yao-compatible eval smoke fixtures stay explicit and non-authoritative', () => {
    const triggerSmoke = JSON.parse(read(YAO_TRIGGER_CASES_PATH));
    const semanticConfig = JSON.parse(read(YAO_SEMANTIC_CONFIG_PATH));
    const outputLines = read(YAO_OUTPUT_CASES_PATH).trim().split('\n').map((line) => JSON.parse(line));

    expect(triggerSmoke.schema_version).toBe('yao.semantic-trigger-cases.v1');
    expect(triggerSmoke.should_trigger.length).toBeGreaterThanOrEqual(3);
    expect(triggerSmoke.should_not_trigger.length).toBeGreaterThanOrEqual(3);
    expect(triggerSmoke.near_neighbor.length).toBeGreaterThanOrEqual(3);
    expect(semanticConfig.fallback_positive_concepts).toEqual(expect.arrayContaining([
      'source_plan',
      'task_pack',
      'compile_or_validate',
    ]));

    expect(outputLines.length).toBeGreaterThanOrEqual(2);
    for (const evalCase of outputLines) {
      expect(evalCase.metadata.evidence_status).toBe('recorded_static_smoke');
      expect(evalCase.metadata.authoritative_runner).toBe('scripts/spec-write-tasks/run-output-evals.js');
      expect(evalCase.assertions.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('eval cases cover trigger, boundary, failure, and expected behavior posture', () => {
    const skill = read(SKILL_PATH);
    const handoff = read(HANDOFF_CONTRACT_PATH);
    const readme = read(EVALS_README_PATH);
    const decisionLine = handoff.match(/^decision: (.+)$/m);
    const failureLine = skill.match(/Use machine-readable reason codes: ([^.]+)\./);
    const evalFiles = [
      'trigger-cases.json',
      'boundary-cases.json',
      'failure-cases.json',
      'expected-behavior-cases.json',
    ];
    const allowedDecisions = new Set(decisionLine[1].split('|').map((decision) => decision.trim()));
    expect(failureLine).not.toBeNull();
    const allowedFailures = new Set(failureLine[1]
      .split(/,\s*|\s+or\s+/)
      .map((failure) => failure.trim())
      .map((failure) => failure.replace(/^or\s+/, '').replace(/`/g, ''))
      .filter(Boolean));
    const seenIds = new Set();
    const coveredDecisions = new Set();
    const coveredFailures = new Set();

    expect(readme).toContain('`expected_decision` must come from the `SKILL.md` Final Decision Envelope');
    expect(readme).toContain('`expected_failure` must come from the `SKILL.md` Failure Modes enumeration');
    expect(readme).toContain('the LLM judges whether each example represents a real trigger, boundary, failure, or expected behavior');

    for (const fileName of evalFiles) {
      const payload = JSON.parse(read(path.join(EVALS_DIR, fileName)));
      expect(payload.schema_version).toContain('spec-write-tasks');
      expect(payload.cases.length).toBeGreaterThanOrEqual(3);

      for (const evalCase of payload.cases) {
        expect(evalCase.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(seenIds.has(evalCase.id)).toBe(false);
        seenIds.add(evalCase.id);
        if (evalCase.expected_decision) {
          expect(allowedDecisions.has(evalCase.expected_decision)).toBe(true);
          coveredDecisions.add(evalCase.expected_decision);
        }
        if (evalCase.expected_failure) {
          expect(allowedFailures.has(evalCase.expected_failure)).toBe(true);
          coveredFailures.add(evalCase.expected_failure);
        }
      }
    }

    for (const decision of allowedDecisions) expect(coveredDecisions.has(decision)).toBe(true);
    for (const failure of allowedFailures) expect(coveredFailures.has(failure)).toBe(true);
  });

  test('spec-work validates task packs before creating execution tasks', () => {
    const skill = read(SPEC_WORK_PATH);

    expect(skill).toContain('If the work document is a task pack, validate it before creating execution tasks');
    expect(skill).toContain('read its frontmatter and confirm `type: task-pack`, `generated_by: spec-write-tasks`, `status: derived`, and `mode: derived`');
    expect(skill).toContain('treat that plan as the single source of truth');
    expect(skill).toContain('spec-first tasks validate <task-pack-path> --json');
    expect(skill).toContain('do not repair task-pack JSON in the executor');
    expect(skill).toContain('do not silently fall back to executing stale task cards');
    expect(skill).toContain("honor each task's `stop_if`");
  });

  test('openai metadata keeps task compilation optional and host-neutral', () => {
    const metadata = read(OPENAI_PATH);

    expect(metadata).toContain('Compile or validate derived task packs');
    expect(metadata).toContain('local plan path, existing task-pack path, or clear task-splitting request');
    expect(metadata).toContain('First decide whether task compilation or validation is warranted');
    expect(metadata).toContain('the appropriate spec-work workflow');
    expect(metadata).toContain('allow_implicit_invocation: false');
    expect(metadata).not.toContain('$spec-work');
    expect(metadata).not.toContain('/spec:work');
  });

  test('official skill package contains only portable runtime assets', () => {
    if (!fs.existsSync(OFFICIAL_PACKAGE_SCRIPT)) {
      const contract = read(QUALITY_CONTRACT_PATH);
      expect(contract).toContain('official_package_smoke');
      expect(contract).toContain('not_checked_with_reason');
      return;
    }

    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-write-tasks-official-package-'));
    try {
      const packageProc = spawnSync('python3', [
        '-m',
        'scripts.package_skill',
        path.dirname(SKILL_PATH),
        tmpRoot,
      ], {
        cwd: OFFICIAL_SKILL_CREATOR_DIR,
        encoding: 'utf8',
      });
      expect(packageProc.status).toBe(0);

      const packagePath = path.join(tmpRoot, 'spec-write-tasks.skill');
      const listProc = spawnSync('python3', ['-c', `
from zipfile import ZipFile
with ZipFile(${JSON.stringify(packagePath)}) as package:
    print("\\n".join(sorted(package.namelist())))
`], { encoding: 'utf8' });
      expect(listProc.status).toBe(0);
      const entries = listProc.stdout.trim().split('\n').filter(Boolean);

      expect(entries).toEqual([
        'spec-write-tasks/SKILL.md',
        'spec-write-tasks/agents/openai.yaml',
        'spec-write-tasks/references/execution-handoff-contract.md',
        'spec-write-tasks/references/task-pack-schema.md',
        'spec-write-tasks/references/task-quality-guide.md',
      ]);
      expect(entries.some((entry) => entry.includes('/evals/'))).toBe(false);
      expect(entries.some((entry) => entry.includes('docs/validation'))).toBe(false);
      expect(entries.some((entry) => entry.includes('scripts/spec-write-tasks'))).toBe(false);
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });

  test('codex runtime sync preserves runtime guardrails without requiring maintainer reports', () => {
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-write-tasks-codex-runtime-'));
    const codex = new CodexAdapter();

    try {
      syncSkills(projectRoot, codex);

      const runtimeRoot = path.join(projectRoot, '.agents', 'skills', 'spec-write-tasks');
      const runtimeSkill = read(path.join(runtimeRoot, 'SKILL.md'));
      const runtimeMetadata = read(path.join(runtimeRoot, 'agents', 'openai.yaml'));

      expect(runtimeSkill).toContain('name: spec-write-tasks');
      expect(runtimeSkill).not.toContain('name: write-tasks');
      expect(runtimeSkill).toContain('Execution Handoff Contract');
      expect(runtimeSkill).toContain('Task Pack Schema');
      expect(runtimeSkill).toContain('Task Quality Guide');
      expect(runtimeSkill).toContain('never self-report `deterministic_handoff: true`');
      expect(runtimeSkill).not.toContain('../../docs/');
      expect(runtimeSkill).not.toContain('docs/validation/spec-write-tasks');
      expect(runtimeSkill).not.toContain('scripts/spec-write-tasks');
      expect(runtimeMetadata).toContain('First decide whether task compilation or validation is warranted');
      expect(fs.existsSync(path.join(runtimeRoot, 'references', 'execution-handoff-contract.md'))).toBe(true);
      expect(fs.existsSync(path.join(runtimeRoot, 'references', 'task-quality-guide.md'))).toBe(true);
      expect(fs.existsSync(path.join(runtimeRoot, 'evals', 'output-quality-cases.json'))).toBe(true);
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  });

  test('spec-plan handoff only offers task-pack execution for executable task packs', () => {
    const handoff = read(PLAN_HANDOFF_PATH);

    expect(handoff).toContain('Invoke the `spec-write-tasks` workflow with the plan path');
    expect(handoff).toContain('If it writes an executable task pack with matching `spec_id` and verifiable `source_plan_hash`');
    expect(handoff).toContain('surface the copy-ready current-host doc-review invocation');
    expect(handoff).toContain('If it returns `skip`, `return-to-plan`, `draft-only`, unverifiable identity/hash, or a non-executable task pack');
    expect(handoff).toContain('do not offer task-pack execution');
    expect(handoff).not.toContain('/spec:work <task-pack-path>` on Claude Code');
    expect(handoff).not.toContain('$spec-work <task-pack-path>` on Codex');
  });

  test('reviewed-existing posture requires evidence metadata for spec-work-task-pack next_action', () => {
    const contract = read(HANDOFF_CONTRACT_PATH);
    const skill = read(SKILL_PATH);
    const combined = `${contract}\n${skill}`;

    // reviewed-existing without evidence must not proceed to spec-work-task-pack
    expect(combined).toContain('reviewed-existing');
    expect(combined).toContain('unchecked-existing');
    expect(combined).toContain('evidence metadata');
    expect(contract).toContain('A bare `reviewed-existing` claim without current evidence metadata is not sufficient');
    // dispatch_authorization: authorized requires bounded continuation reference
    expect(contract).toContain('dispatch_authorization: authorized');
    expect(contract).toContain('bounded continuation reference');
    expect(contract).toContain('dispatch_authorization: missing');
  });
});
