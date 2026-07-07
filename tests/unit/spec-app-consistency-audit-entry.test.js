'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');
const {
  buildFilteredAssetSet,
  loadPluginManifest,
  syncBundledAssets,
} = require('../../src/cli/plugin');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_PATH = path.join(REPO_ROOT, 'skills/spec-app-consistency-audit/SKILL.md');
const README_PATH = path.join(REPO_ROOT, 'skills/spec-app-consistency-audit/README.md');
const EVALS_PATH = path.join(REPO_ROOT, 'skills/spec-app-consistency-audit/evals/examples.json');
const RECORDED_OUTPUT_PATH = path.join(REPO_ROOT, 'skills/spec-app-consistency-audit/evals/recorded-output-fixtures.json');
const MODE_OUTPUT_REFERENCE_PATH = path.join(REPO_ROOT, 'skills/spec-app-consistency-audit/references/mode-output-contract.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

describe('spec-app-consistency-audit entry contract', () => {
  test('source skill keeps static-first app-audit boundaries', () => {
    const skill = read(SKILL_PATH);
    const modeOutput = read(MODE_OUTPUT_REFERENCE_PATH);

    expect(skill).toContain('name: spec-app-consistency-audit');
    expect(skill).toContain('Default to `static_only`.');
    expect(skill).toContain('## Mode Contract');
    expect(skill).toContain('mode:headless');
    expect(skill).toContain('mode:report-only');
    expect(skill).toContain('[Mode, Output, And Issue Contract](references/mode-output-contract.md)');
    expect(skill).toContain('source:<path>');
    expect(skill).toContain('figma-ref');
    expect(skill).toContain('input_figma_reference_only');
    expect(skill).toContain('.spec-first/app-audit/runs/<run-id>/');
    expect(skill).toContain('report-only');
    expect(skill).toContain('Do not hand-edit generated runtime assets.');
    expect(skill).toContain('skills/spec-app-consistency-audit/prompts/');
    expect(skill).toContain('Do not copy app-audit-specific experts or ECC-derived lenses into `agents/`');
    expect(skill).toContain('No evidence, no issue.');
    expect(skill).toContain('Rule packs can explain risk and rationale, but they cannot be the only evidence');
    expect(skill).toContain('traceable `provenance`/`evidence`');
    expect(skill).toContain('`related_rule_packs`');
    expect(skill).toContain('`industry:<name>` is an explicit lens, not a confirmed industry profile');
    expect(skill).toContain('## Figma MCP Materialization');
    expect(skill).toContain('has_figma_reference');
    expect(skill).toContain('## Figma Redaction Policy');
    expect(skill).toContain('Default to `--redaction internal`.');
    expect(skill).toContain('.spec-first/app-audit/runs/<run-id>/writeback-preview/');
    expect(skill).toContain('skills/spec-app-consistency-audit/scripts/');
    expect(skill).toContain('build-impact-facts.js');
    expect(skill).toContain('Scripts produce structured candidate or preview artifacts');
    expect(skill).toContain('skills/spec-app-consistency-audit/rule-packs/');

    expect(skill).not.toContain('Supported canonical tokens:');
    expect(skill).not.toContain('Every issue must include:');
    expect(modeOutput).toContain('Supported canonical tokens:');
    expect(modeOutput).toContain('Scope Resolution');
    expect(modeOutput).toContain('Every issue must include:');
    expect(modeOutput).toContain('`provenance` and `evidence` entries must contain a traceable project field');
    expect(modeOutput).toContain('has_figma_reference');
    expect(modeOutput).toContain('.spec-first/app-audit/runs/<run-id>/writeback-preview/');
  });

  test('source skill documents trigger boundaries, eval fixtures, and governance posture', () => {
    const skill = read(SKILL_PATH);
    const examples = readJson(EVALS_PATH);
    const governance = read(path.join(REPO_ROOT, 'skills/spec-app-consistency-audit/references/evaluation-governance.md'));
    const tags = new Set(examples.cases.flatMap((entry) => entry.coverage_tags));
    const ids = examples.cases.map((entry) => entry.id);

    expect(skill).toContain('Near-neighbor routing:');
    expect(skill).toContain('ordinary code review (`spec-code-review`)');
    expect(skill).toContain('PRD authoring or refinement (`spec-prd`)');
    expect(skill).toContain('UI polish (`spec-polish`)');
    expect(skill).toContain('skills/spec-app-consistency-audit/evals/examples.json');
    expect(skill).toContain('evals/recorded-output-fixtures.json');
    expect(skill).toContain('references/evaluation-governance.md');
    expect(skill).toContain('trust report');
    expect(skill).toContain('reports/output_quality_scorecard.md');
    expect(governance).toContain('recorded-output-fixtures.json');
    expect(governance).toContain('provider-backed model execution');

    expect(examples.schema_version).toBe('spec-first.workflow-eval-fixtures.v1');
    expect(examples.skill).toBe('spec-app-consistency-audit');
    expect([...tags]).toEqual(expect.arrayContaining(['trigger', 'boundary', 'failure', 'expected']));
    expect(ids).toEqual(expect.arrayContaining([
      'trigger-cross-source-app-audit',
      'boundary-ordinary-code-review',
      'failure-headless-missing-base',
      'failure-figma-reference-only',
      'expected-no-raw-issues',
      'expected-secret-redaction',
    ]));
  });

  test('recorded output fixtures pin no-invention, degraded, and handoff expectations', () => {
    const fixtures = readJson(RECORDED_OUTPUT_PATH);
    const ids = fixtures.cases.map((entry) => entry.id);
    const byId = new Map(fixtures.cases.map((entry) => [entry.id, entry]));

    expect(fixtures.schema_version).toBe('spec-app-consistency-audit-recorded-output-fixtures.v1');
    expect(fixtures.execution_kind).toBe('recorded_fixture');
    expect(fixtures.description).toContain('not provider-backed model evidence');
    expect(fixtures.source_refs).toEqual(expect.arrayContaining([
      'skills/spec-app-consistency-audit/scripts/render-headless-envelope.js',
      'skills/spec-app-consistency-audit/references/mode-output-contract.md',
    ]));
    expect(ids).toEqual([
      'no-raw-issues-not-run',
      'figma-reference-only-degraded',
      'code-review-handoff-consumable',
    ]);

    expect(byId.get('no-raw-issues-not-run').recorded_output).toEqual(expect.objectContaining({
      issue_synthesis_status: 'not_run',
      issues: [],
      rejected_issues: [],
    }));
    expect(byId.get('no-raw-issues-not-run').recorded_output.headless_envelope_contains).toContain('Verdict: Awaiting LLM audit');
    expect(byId.get('figma-reference-only-degraded').recorded_output.scope_and_degraded_modes[0]).toMatchObject({
      code: 'input_figma_reference_only',
    });
    expect(byId.get('code-review-handoff-consumable').recorded_output.issue_fields.code_review_handoff).toMatchObject({
      enabled: true,
      severity: 'P2',
      requires_verification: true,
      source_issue_id: 'APP-AUDIT-RECORDED-001',
    });
  });

  test('README is a maintainer guide and not a second runtime contract', () => {
    const readme = read(README_PATH);

    expect(readme).toContain('# spec-app-consistency-audit');
    expect(readme).toContain('维护者导航');
    expect(readme).toContain('不替代 [`SKILL.md`](./SKILL.md)');
    expect(readme).toContain('`spec-first init` 会把整个 skill package');
    expect(readme).toContain('runtime copy 不是新的 source of truth');
    expect(readme).toContain('普通 diff code review，走 `spec-code-review`');
    expect(readme).toContain('当前 v1 deterministic runner 只支持 `mode:headless`');
    expect(readme).toContain('不调用 LLM');
    expect(readme).toContain('不手改 generated runtime mirrors');
    expect(readme).toContain('evals/recorded-output-fixtures.json');
    expect(readme).toContain('references/mode-output-contract.md');
    expect(readme).toContain('references/evaluation-governance.md');
    expect(readme).toContain('npm run test:eval-fixtures');
  });

  test('plugin manifest exposes a Claude command mapped to the app-audit skill', () => {
    const manifest = loadPluginManifest();
    const command = manifest.commands.find((entry) => entry.name === 'app-consistency-audit');

    expect(command).toMatchObject({
      filename: 'app-consistency-audit.md',
      description: 'Run the Spec-First App consistency audit workflow',
      argumentHint: '[mode:headless|mode:report-only] [base:<ref>] [source:<path>] [prd:<path>] [figma-context:<path>|figma-ref:<id-or-url>] [industry:<name>] [depth:deep]',
      skill: 'spec-app-consistency-audit',
    });
  });

  test('dual-host governance delivers Claude command and Codex workflow skill only', () => {
    const claudeAssets = buildFilteredAssetSet('claude');
    const codexAssets = buildFilteredAssetSet('codex');

    expect(claudeAssets.commands.map((command) => command.name)).toContain('app-consistency-audit');
    expect(claudeAssets.workflowSkills).toContain('spec-app-consistency-audit');
    expect(codexAssets.workflowSkills).toContain('spec-app-consistency-audit');
    expect(codexAssets.commands.map((command) => command.name)).not.toContain('app-consistency-audit');
  });

  test('runtime sync writes generated assets from source without touching repo runtime', () => {
    const claudeProject = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-app-audit-claude-'));
    const codexProject = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-first-app-audit-codex-'));

    try {
      syncBundledAssets(claudeProject, new ClaudeAdapter());
      syncBundledAssets(codexProject, new CodexAdapter());

      const claudeCommandPath = path.join(
        claudeProject,
        '.claude',
        'commands',
        'spec-app-consistency-audit.md',
      );
      const claudeWorkflowSkillPath = path.join(
        claudeProject,
        '.claude',
        'spec-first',
        'workflows',
        'spec-app-consistency-audit',
        'SKILL.md',
      );
      const codexWorkflowSkillPath = path.join(
        codexProject,
        '.agents',
        'skills',
        'spec-app-consistency-audit',
        'SKILL.md',
      );
      const codexWorkflowReadmePath = path.join(
        codexProject,
        '.agents',
        'skills',
        'spec-app-consistency-audit',
        'README.md',
      );
      const codexCommandPath = path.join(
        codexProject,
        '.codex',
        'commands',
        'spec-app-consistency-audit.md',
      );

      expect(fs.existsSync(claudeCommandPath)).toBe(true);
      const claudeCommand = read(claudeCommandPath);
      const codexWorkflowSkill = read(codexWorkflowSkillPath);

      expect(claudeCommand).toContain('# App Consistency Audit');
      expect(claudeCommand).toContain('No evidence, no issue.');
      expect(claudeCommand).toContain('mode:headless');
      expect(claudeCommand).toContain('.spec-first/app-audit/runs/<run-id>/');
      expect(claudeCommand).not.toContain('Source truth for this workflow lives under:');
      expect(claudeCommand).not.toContain('- `.claude/spec-first/workflows/spec-app-consistency-audit/`');
      expect(fs.existsSync(claudeWorkflowSkillPath)).toBe(true);
      expect(fs.existsSync(codexWorkflowSkillPath)).toBe(true);
      expect(fs.existsSync(codexWorkflowReadmePath)).toBe(true);
      expect(codexWorkflowSkill).toContain('Default to `static_only`.');
      expect(codexWorkflowSkill).toContain('mode:report-only');
      const codexWorkflowReadme = read(codexWorkflowReadmePath);
      expect(codexWorkflowReadme).toContain('runtime copy 不是新的 source of truth');
      expect(codexWorkflowReadme).toContain('不手改 runtime mirror 修复行为');
      expect(codexWorkflowSkill).not.toContain('Source truth for this workflow lives under:');
      expect(codexWorkflowSkill).not.toContain('- `.agents/skills/spec-app-consistency-audit/`');
      expect(codexWorkflowSkill).not.toContain('spec-first init --codex|--codex');
      expect(fs.existsSync(codexCommandPath)).toBe(false);
    } finally {
      fs.rmSync(claudeProject, { recursive: true, force: true });
      fs.rmSync(codexProject, { recursive: true, force: true });
    }
  });
});
