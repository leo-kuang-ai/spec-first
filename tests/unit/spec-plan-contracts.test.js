'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ClaudeAdapter = require('../../src/cli/adapters/claude');
const CodexAdapter = require('../../src/cli/adapters/codex');
const {
  inspectInstalledAssets,
  planBundledAssetSync,
  syncBundledAssets,
} = require('../../src/cli/plugin');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-plan', 'SKILL.md');
const COMMAND_TEMPLATE_PATH = path.join(__dirname, '..', '..', 'templates', 'claude', 'commands', 'spec', 'plan.md');
const EVALS_DIR = path.join(__dirname, '..', '..', 'skills', 'spec-plan', 'evals');
const EXAMPLES_PATH = path.join(EVALS_DIR, 'examples.json');
const REQUIREMENTS_CAPTURE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-brainstorm',
  'references',
  'requirements-capture.md',
);
const DEEPENING_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'deepening-workflow.md',
);
const PLAN_HANDOFF_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'plan-handoff.md',
);
const PLAN_TEMPLATE_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'plan-template.md',
);
const PLAN_SECTIONS_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'plan-sections.md',
);
const MARKDOWN_RENDERING_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'markdown-rendering.md',
);
const HTML_RENDERING_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'html-rendering.md',
);
const SYNTHESIS_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'synthesis-summary.md',
);
const VISUAL_COMMUNICATION_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'visual-communication.md',
);
const GOVERNANCE_BOUNDARIES_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'governance-boundaries.md',
);
const PLANNING_FLOW_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'planning-flow.md',
);
function plannedRuntimeContent(adapter, targetPath) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-plan-runtime-'));

  try {
    return plannedRuntimeContentForProject(projectRoot, adapter, targetPath);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

function plannedRuntimeContentForProject(projectRoot, adapter, targetPath) {
  const { plan } = planBundledAssetSync(projectRoot, adapter);
  const operation = plan.operations.find((entry) => entry.path === targetPath);
  if (!operation) {
    throw new Error(`Missing planned runtime operation for ${targetPath}`);
  }
  return operation.contents;
}

function syncedRuntimeInspection(adapter) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-plan-inspect-'));

  try {
    syncBundledAssets(projectRoot, adapter);
    return inspectInstalledAssets(projectRoot, adapter);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

function syncedRuntimeInspectionAfter(adapter, mutate) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-plan-inspect-'));

  try {
    syncBundledAssets(projectRoot, adapter);
    mutate(projectRoot);
    return inspectInstalledAssets(projectRoot, adapter);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

function runtimeGovernanceBoundariesPath(adapter) {
  if (adapter.id === 'claude') {
    return '.claude/spec-first/workflows/spec-plan/references/governance-boundaries.md';
  }

  return '.agents/skills/spec-plan/references/governance-boundaries.md';
}

function specPlanDriftIssues(inspection) {
  const entry = inspection.skills.drifted.find((item) => item.skillName === 'spec-plan');
  return entry ? entry.issues : [];
}

function readPlanningGovernanceSurface() {
  return [
    fs.readFileSync(SKILL_PATH, 'utf8'),
    fs.readFileSync(GOVERNANCE_BOUNDARIES_PATH, 'utf8'),
  ].join('\n');
}

function readPlanningFlowSurface() {
  return [
    fs.readFileSync(SKILL_PATH, 'utf8'),
    fs.readFileSync(PLANNING_FLOW_PATH, 'utf8'),
  ].join('\n');
}
const UNIVERSAL_PLANNING_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-plan',
  'references',
  'universal-planning.md',
);
describe('spec-plan context orientation contract', () => {
  test('keeps host-only argument hint out of generic skill frontmatter', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const command = fs.readFileSync(COMMAND_TEMPLATE_PATH, 'utf8');
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)[1];

    expect(frontmatter).toContain('name: spec-plan');
    expect(frontmatter).toContain('description:');
    expect(frontmatter).toContain('needs a HOW plan');
    expect(frontmatter).toContain('deepen an existing plan');
    expect(frontmatter).toContain('spec-brainstorm for unresolved WHAT/product exploration');
    expect(frontmatter).toContain('spec-work for implementation or tests');
    expect(frontmatter).toContain('spec-doc-review for independent plan review');
    expect(frontmatter).not.toContain('plan a trip');
    expect(frontmatter).not.toContain('create a study plan');
    expect(frontmatter).not.toContain('break this down');
    expect(frontmatter).not.toContain('argument-hint:');
    expect(command).toContain('argument-hint: "[requirements doc path or topic]"');
  });

  test('has a hot-path plan-only safety contract and strict question-tool fallback rules', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    const purposeIndex = text.indexOf('## Purpose');
    const safetyIndex = text.indexOf('## Plan-Only Safety Contract');
    expect(purposeIndex).toBeGreaterThan(text.indexOf('# Create Technical Plan'));
    expect(purposeIndex).toBeLessThan(safetyIndex);
    expect(text).toContain('Turn a clear goal, requirements artifact, bug, project, or existing plan into an evidence-grounded HOW plan or structured planning answer');
    expect(text).toContain('preserving planning-only boundaries and explicit handoff before execution');
    expect(safetyIndex).toBeGreaterThan(-1);
    expect(safetyIndex).toBeLessThan(text.indexOf('## Workflow Contract Summary'));
    expect(safetyIndex).toBeLessThan(text.indexOf('### Phase 0'));
    expect(text).toContain('Planning only until handoff.');
    expect(text).toContain('Do not call implementation tools');
    expect(text).toContain('write or update only the plan artifact');
    expect(text).toContain('Handoff is blocking.');
    expect(text).toContain('wait for the user\'s explicit selection');
    expect(text).toContain('preload `AskUserQuestion` at the start of the interactive flow');
    expect(text).toContain('`ToolSearch` with query `select:AskUserQuestion`');
    expect(text).toContain('A pending schema load, tool inconvenience, report-formatting mode, or this instruction being buried in a long skill is not a fallback trigger.');
    expect(text).toContain('A pending schema load is not a fallback trigger; call `ToolSearch` first.');
    expect(text).toContain('fall back loudly, then wait for the user\'s reply');
    expect(text).toContain('best-effort attention hardening');
    expect(text).toContain('Claude native Plan Mode');
    expect(text).toContain('do not claim non-Plan Mode has hard write protection');
    expect(text).toContain('**NEVER CODE during this skill.**');
  });

  test('uses direct repo context and preserves LLM decision boundary', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const governance = fs.readFileSync(GOVERNANCE_BOUNDARIES_PATH, 'utf8');
    const planningFlow = fs.readFileSync(PLANNING_FLOW_PATH, 'utf8');
    const combined = `${text}\n${governance}\n${planningFlow}`;

    expect(text).toContain('read `skills/spec-plan/references/governance-boundaries.md`');
    expect(text).not.toContain('## Context Orientation Anchor');
    expect(governance).toContain('## Context Orientation Anchor');
    expect(combined).toContain('current user request or requirement');
    expect(combined).toContain('package manifests and command registries');
    expect(combined).toContain('nearby implementation files');
    expect(combined).toContain('nearby tests');
    expect(combined).toContain('External tools may prioritize inspection, but they do not define scope authority');
    expect(combined).toContain('The LLM still chooses the candidate change surface');
    expect(combined).toContain('explicit repo context and source-plan constraints');
    expect(combined).toContain('already-loaded host/project instructions');
    expect(combined).toContain('`docs/contracts/`, existing brainstorms/plans/solutions');
    expect(combined).toContain('not automatic re-read targets for every planning run');
    expect(combined).toContain('Written project standards from loaded host instructions, directory-scoped equivalents, or precisely read source files');
    expect(combined).toContain('Host Instruction Reuse Policy allows it');
    expect(combined).toContain('Maintain a run-local context ledger for this workflow');
    expect(combined).toContain('Reuse loaded summaries within the same workflow run');
    expect(combined).toContain('Re-read only when exact wording is needed');
    expect(combined).not.toContain('`AGENTS.md` / `CLAUDE.md` / project role docs');
    expect(combined).not.toContain('docs/examples/standards-glue-consumption-examples.md');
    expect(combined).not.toContain('.spec-first/standards/');
    expect(combined).not.toContain('glue-map.json');
    expect(combined).toContain('target_repo');
    expect(combined).toContain('bounded direct reads');
    expect(combined).toContain('use bounded direct reads, `rg`, ast-grep, git diff, tests/logs, and user evidence');
    expect(combined).toContain('do not let scripts or setup facts choose semantically between child repos');
    expect(combined).toContain('A cross-repo plan must name `target_repo` per implementation unit');
    expect(combined).not.toContain('stage0-context');
    expect(combined).not.toContain('selected_assets');
  });

  test('research and handoff tracker detection avoid full instruction-file reloads', () => {
    const text = readPlanningFlowSurface();
    const handoff = fs.readFileSync(PLAN_HANDOFF_PATH, 'utf8');

    expect(text).toContain('Already-loaded project guidance that materially affects the plan');
    expect(text).toContain('pass only the relevant compact summary to research agents');
    expect(text).not.toContain('AGENTS.md guidance that materially affects the plan');
    expect(handoff).toContain('Check already-loaded project guidance for `project_tracker: github` or `project_tracker: linear`');
    expect(handoff).toContain('perform a precise lookup for `project_tracker:`');
    expect(handoff).toContain('do not read the full instruction file just to detect the tracker');
    expect(handoff).not.toContain('Read `AGENTS.md` (or `CLAUDE.md` for compatibility)');
  });

  test('consumes domain context before planning questions without fixed ADR directory mandates', () => {
    const text = readPlanningGovernanceSurface();

    expect(text).toContain('Domain Language And Decision Ledger');
    expect(text).toContain('consume existing context before asking questions that repo/docs can answer');
    expect(text).toContain('already-loaded project standards and host instructions, `docs/contracts/`, existing brainstorms/plans/solutions');
    expect(text).toContain('Read `AGENTS.md` / `CLAUDE.md` source only under the Host Instruction Reuse Policy');
    expect(text).toContain('repo-local glossary or ADR-like artifacts that actually exist');
    expect(text).toContain('If `CONCEPTS.md` exists, treat it as repo-local advisory vocabulary for naming consistency only');
    expect(text).toContain('it is not a PRD, ADR, workflow contract, source-of-truth override, or setup requirement');
    expect(text).toContain('Do not require a fixed `CONTEXT.md`, `CONCEPTS.md`, `docs/adr/`, or glossary directory.');
    expect(text).toContain('If those artifacts are absent, record the gap as advisory context and continue');
    expect(text).toContain('`question`, `recommended_answer`, `source_tag`, `chosen_answer`, `consequence`, and `deferred_reason`');
    expect(text).toContain('`confirmed`, `advisory`, `session-local`, `stale`, or `user`');
    expect(text).toContain('hard to reverse, would be surprising without context, and reflects a real tradeoff');
    expect(text).not.toContain('must use `CONTEXT.md`');
    expect(text).not.toContain('must use `CONCEPTS.md`');
    expect(text).not.toContain('must use `docs/adr/`');
  });

  test('prd-grade handoff entropy check routes unresolved WHAT gaps back to PRD', () => {
    const text = readPlanningFlowSurface();

    expect(text).toContain('PRD handoff entropy check');
    expect(text).toContain('canonical term');
    expect(text).toContain('source-of-truth');
    expect(text).toContain('domain ownership');
    expect(text).toContain('hard decision consequence');
    expect(text).toContain('`## Feature Slices`');
    expect(text).toContain('preserve feature IDs');
    expect(text).toContain('requirement refs');
    expect(text).toContain('acceptance refs');
    expect(text).toContain('source/evidence pointers');
    expect(text).toContain('PRD-origin trace, not a new planning-owned artifact class');
    expect(text).toContain('missing slice acceptance');
    expect(text).toContain('missing slice source');
    expect(text).toContain('missing slice scope');
    expect(text).toContain('route to PRD refine or emit an inline PRD feedback candidate');
    expect(text).toContain('do not run a separate grill workflow in `spec-plan`');
    expect(text).toContain('do not copy the full `spec-prd` readiness lens or Feature Slice Pack');
    expect(text).toContain('do not generate program slices or task packs during planning');
    expect(text).toContain('do not auto-write back to the PRD');
    expect(text).not.toContain('Domain Grill workflow');
  });

  test('uses Direct Evidence Readiness without hidden evidence gates', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const planningFlow = fs.readFileSync(PLANNING_FLOW_PATH, 'utf8');
    const governance = fs.readFileSync(GOVERNANCE_BOUNDARIES_PATH, 'utf8');
    const template = fs.readFileSync(PLAN_TEMPLATE_PATH, 'utf8');
    const combined = `${skill}\n${planningFlow}\n${governance}\n${template}`;

    expect(skill).toContain('read `skills/spec-plan/references/planning-flow.md`');
    expect(planningFlow).toContain('### 1.1a Direct Evidence Readiness');
    expect(planningFlow).toContain('collect bounded direct evidence');
    expect(planningFlow).toContain('Use this block to disclose what was actually read or verified.');
    expect(planningFlow).toContain('Do not claim repository-wide impact coverage from a narrow search.');
    expect(planningFlow).toContain('Do not add hidden pre-facts or external-tool evidence envelopes.');
    expect(planningFlow).toContain('follow `skills/spec-plan/references/plan-template.md` for the canonical `## Direct Evidence Readiness` and `## Direct Evidence` sections');
    expect(planningFlow).not.toContain('- worktree_dirty:');
    expect(planningFlow).not.toContain('- discovery_methods:');
    expect(planningFlow).not.toContain('- tests_or_logs:');
    expect(combined).toContain('## Direct Evidence Readiness');
    expect(combined).toContain('## Direct Evidence');
    const readinessHeadingIndex = template.search(/^## Direct Evidence Readiness$/m);
    const directEvidenceHeadingIndex = template.search(/^## Direct Evidence$/m);
    const contextHeadingIndex = template.search(/^## Context & Research$/m);
    expect(readinessHeadingIndex).toBeGreaterThanOrEqual(0);
    expect(directEvidenceHeadingIndex).toBeGreaterThanOrEqual(0);
    expect(contextHeadingIndex).toBeGreaterThanOrEqual(0);
    expect(readinessHeadingIndex).toBeLessThan(directEvidenceHeadingIndex);
    expect(directEvidenceHeadingIndex).toBeLessThan(contextHeadingIndex);
    for (const field of [
      '- target_repo:',
      '- evidence_sources:',
      '- source_refs:',
      '- current_revision:',
      '- worktree_status:',
      '- confidence:',
      '- limitations:',
      '- repo_scope:',
      '- source_reads_completed:',
      '- impact_on_plan:',
      '- source_reads_required:',
      '- commands_or_tools_used:',
      '- key_findings:',
    ]) {
      expect(combined).toContain(field);
    }
    expect(combined).toContain('Do not create a hidden reviewer facts pipeline');
    expect(combined).toContain('use bounded direct reads, `rg`, ast-grep, git diff, tests/logs, and user evidence');
    expect(combined).toContain('do not turn rejected rationale into active workflow state');
  });

  test('planning research dispatch is host-neutral with explicit inline fallback', () => {
    const text = readPlanningFlowSurface();

    expect(text).toContain('Planning research agents are read-only.');
    expect(text).toContain('dispatch authorization is present for this run');
    expect(text).toContain('a public `$spec-plan` invocation authorizes the workflow itself; it does not by itself authorize `spawn_agent`');
    expect(text).toContain('If the user did not explicitly request subagents, delegation, parallel research, or research-agent dispatch');
    expect(text).toContain('record `dispatch_authorization_missing`');
    expect(text).toContain('unauthorized, or fails for a non-capacity reason');
    expect(text).not.toContain('A direct plan workflow invocation authorizes this documented research phase when host capability exists');
    expect(text).not.toContain('do not ask for a second subagent confirmation');
    expect(text).toContain('run the same research sequentially in the current agent');
    expect(text).toContain('applying it inline as an explicit fallback');
    expect(text).toContain('Plan generation must still complete when research dispatch is unavailable');
    expect(text).toContain('Dispatch these read-only research agents in parallel when available');
    expect(text).toContain('`spec-repo-research-analyst`');
    expect(text).toContain('`spec-learnings-researcher`');
    expect(text).toContain('`spec-best-practices-researcher`');
    expect(text).toContain('`spec-framework-docs-researcher`');
    expect(text).toContain('`spec-spec-flow-analyzer`');
    expect(text).not.toContain('Task spec-repo-research-analyst');
    expect(text).not.toContain('Task spec-learnings-researcher');
    expect(text).not.toContain('Task spec-best-practices-researcher');
    expect(text).not.toContain('Task spec-framework-docs-researcher');
    expect(text).not.toContain('Task spec-spec-flow-analyzer');
    expect(text).not.toContain('`Task` / `Agent` on Claude Code, or `spawn_agent` on Codex');
  });

  test('deepening research fallback distinguishes sequential dispatch from inline current-agent fallback', () => {
    const text = fs.readFileSync(DEEPENING_PATH, 'utf8');

    expect(text).toContain('dispatch authorization is present for this run');
    expect(text).toContain('a public `$spec-plan` invocation authorizes the workflow itself; it does not by itself authorize `spawn_agent`');
    expect(text).toContain('If the user did not explicitly request subagents, delegation, parallel research, or research-agent dispatch');
    expect(text).toContain('record `dispatch_authorization_missing`');
    expect(text).toContain('Use fully-qualified agent names inside dispatch prompts or agent invocations.');
    expect(text).not.toContain('inside Task calls');
    expect(text).toContain('supports dispatch but not parallel dispatch');
    expect(text).toContain('run the same selected agents sequentially through the host dispatch primitive');
    expect(text).toContain('If dispatch is unavailable, explicitly disabled, unauthorized, or unsafe');
    expect(text).toContain('perform the selected research sequentially in the current agent');
    expect(text).toContain('dispatch_fallback: inline-current-agent');
  });

  test('deepening artifact-backed scratch cleanup has one explicit branch policy', () => {
    const deepening = fs.readFileSync(DEEPENING_PATH, 'utf8');
    const handoff = fs.readFileSync(PLAN_HANDOFF_PATH, 'utf8');

    expect(deepening).toContain('their cleanup policy is handled by 5.3.6b and 5.3.9');
    expect(deepening).toContain('If artifact-backed mode was used, preserve `<scratch-dir>` for debugging rejected artifacts');
    expect(deepening).toContain('report `Artifacts left at <scratch-dir>`');
    expect(deepening).toContain('This interactive-mode-only skip does not apply in auto mode');
    expect(deepening).not.toContain('cleaned up when deepening ends');
    expect(deepening).not.toContain('No explicit scratch cleanup needed');
    expect(handoff).toContain('In auto mode, or in interactive mode where findings were accepted and the plan was safely updated');
    expect(handoff).toContain('clean up the temporary scratch directory');
    expect(handoff).toContain('If cleanup fails or is not practical on the current platform');
    expect(handoff).toContain('Do not apply this cleanup to the interactive no-accepted-findings branch in 5.3.6b');
    expect(handoff).toContain('that branch preserves `<scratch-dir>` for debugging and reports the path before Phase 5.4');
  });

  test('planning can recommend workers only behind a suitability gate', () => {
    const text = readPlanningFlowSurface();

    expect(text).toContain('Implementation Worker Suitability Gate');
    expect(text).toContain('Planning may recommend later worker delegation, but it must not dispatch implementation workers or create a hidden implement/check lifecycle.');
    expect(text).toContain('A worker is suitable only when the scope is clear, the write set can be bounded, verification commands are known, no product/architecture blocker remains, and no sensitive/security-critical ambiguity is unresolved.');
    expect(text).toContain('If any condition is missing, keep the task local to `spec-work`, return to planning, or require a smaller task pack slice.');
    expect(text).toContain('Review autofix and mutation are off unless a documented workflow mode or explicit user choice authorizes them.');
    expect(text).not.toContain('always dispatch implementation workers');
    expect(text).not.toContain('hidden implement/check lifecycle for every plan');
  });
});

describe('spec_id planning contract', () => {
  test('requirements capture creates a local spec chain identity without a registry', () => {
    const text = fs.readFileSync(REQUIREMENTS_CAPTURE_PATH, 'utf8');

    expect(text).toContain('spec_id: YYYY-MM-DD-NNN-<kebab-case-topic>');
    expect(text).toContain('docs/brainstorms/YYYY-MM-DD-NNN-<slug>-requirements.md');
    expect(text).toContain('Ignore legacy non-sequenced files when choosing the next number');
    expect(text).toContain('not a central registry');
    expect(text).toContain('frontmatter is the machine-readable contract');
  });

  test('plan inherits spec_id, handles legacy origins, and preserves chain boundaries', () => {
    const text = readPlanningFlowSurface();
    const template = fs.readFileSync(PLAN_TEMPLATE_PATH, 'utf8');
    const combined = `${text}\n${template}`;

    expect(text).toContain('Preserve it exactly in the plan frontmatter');
    expect(text).toContain('Generate a new plan-local `spec_id`');
    expect(text).toContain('origin identity was not inherited');
    expect(text).toContain('scan `docs/brainstorms/`, `docs/plans/`, and `docs/tasks/` frontmatter');
    expect(text).toContain('If the same `spec_id` already exists');
    expect(text).toContain('alternative implementation plans, independent delivery chains, or abandon-and-replace work');
    expect(text).toContain('`artifact_kind: prd-requirements`');
    expect(text).toContain('PRD-grade requirements origin');
    expect(text).toContain('R/F/AE');
    expect(text).toContain('trace self-check summary');
    expect(text).toContain('`document_role: split-summary`');
    expect(text).toContain('`document_role: child-prd`');
    expect(combined).toContain('spec_id: YYYY-MM-DD-NNN-<slug>');
    expect(combined).toContain('origin: docs/brainstorms/YYYY-MM-DD-NNN-<slug>-requirements.md');
  });

  test('deepening preserves spec_id rather than creating a new chain', () => {
    const text = fs.readFileSync(DEEPENING_PATH, 'utf8');

    expect(text).toContain('deepening strengthens the same plan and must preserve it');
    expect(text).toContain('Preserve the existing `spec_id` frontmatter value');
    expect(text).toContain('Use a new `spec_id` only when deliberately creating a new spec chain outside the deepening path');
  });

  test('origin metadata is visible in plan frontmatter and non-blocking for brainstorm-grade origins', () => {
    const flow = fs.readFileSync(PLANNING_FLOW_PATH, 'utf8');
    const template = fs.readFileSync(PLAN_TEMPLATE_PATH, 'utf8');
    const sections = fs.readFileSync(PLAN_SECTIONS_PATH, 'utf8');

    // planning-flow must distinguish PRD-grade vs brainstorm-grade and record origin_grade
    expect(flow).toContain('origin_grade: prd');
    expect(flow).toContain('origin_grade: brainstorm');
    expect(flow).toContain('origin_grade: legacy');
    expect(flow).toContain('origin_verification_status: verified');
    expect(flow).toContain('verifier_unavailable');
    // brainstorm-grade must remain valid — not blocked
    expect(flow).toContain('valid direct planning input');
    expect(flow).not.toContain('reject brainstorm-grade');
    // plan template must expose origin metadata as frontmatter fields
    expect(template).toContain('origin_grade:');
    expect(template).toContain('origin_verification_status:');
    expect(template).toContain('origin_verification_reason_codes:');
    // origin_grade is advisory, not a gate
    expect(template).toMatch(/origin_grade.*not a gate/);
    expect(sections).toContain('origin_verification_status');
    expect(sections).toContain('origin_verification_reason_codes');
  });

  test('handoff work entrypoint remains host-neutral', () => {
    const text = fs.readFileSync(PLAN_HANDOFF_PATH, 'utf8');
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('current host\'s work entrypoint');
    expect(text).toContain('`Start work`, `Compile task pack`, or `Create Issue`');
    expect(text).toContain('Invoke the current host\'s work entrypoint');
    expect(text).toContain('<absolute path to plan>');
    expect(skill).toContain('Act on the user\'s selection');
    expect(skill).toContain('routed action has executed or been explicitly declined');
    expect(text).not.toContain('`Start /spec:work`, `Compile task pack`, or `Create Issue`');
    expect(skill).toContain('**Start work** (recommended)');
    expect(skill).toContain('current host\'s work entrypoint');
    expect(skill).not.toContain('**Start `/spec:work`** (recommended)');
    expect(text).not.toContain('/spec:work <plan-path>` on Claude Code');
    expect(text).not.toContain('$spec-work <plan-path>` on Codex');
    expect(text).not.toContain('/spec:work <task-pack-path>` on Claude Code');
    expect(text).not.toContain('$spec-work <task-pack-path>` on Codex');
    expect(text).not.toContain('`/spec:work` on Claude Code, `$spec-work` on Codex');
  });

  test('task-pack handoff recommendation is decisive while staying user-confirmed', () => {
    const handoff = fs.readFileSync(PLAN_HANDOFF_PATH, 'utf8');
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const combined = `${handoff}\n${skill}`;

    expect(combined).toContain('**Compile task pack with `spec-write-tasks`** - Recommended when source plan structure shows high execution complexity');
    expect(combined).toContain('many implementation units, declared `Files`, dependency chains, cross-module surfaces, broad verification spread, or `plan_depth: deep`');
    expect(combined).toContain('this reduces single-run context load, broad review scope, and coupled rollback cost');
    expect(handoff).toContain('Invoke the `spec-write-tasks` workflow with the plan path.');
    expect(handoff).toContain('If it writes an executable task pack with matching `spec_id` and verifiable `source_plan_hash`');
    expect(handoff).toContain('when it resolves to `review-task-pack`, surface the copy-ready current-host doc-review invocation');
    expect(handoff).toContain('unless the invoking parent workflow or user explicitly authorized that single bounded continuation');
    expect(handoff).not.toContain('Use the standalone skill when the plan is large, dependency-heavy');
    expect(handoff).not.toContain('continues directly into current-host headless doc-review');
    expect(skill).not.toContain('Use the standalone skill when the plan is large, dependency-heavy');
    expect(combined).not.toContain('automatically run `spec-write-tasks`');
    expect(combined).not.toContain('$spec-write-tasks');
    expect(combined).not.toContain('/spec:write-tasks');
  });

  test('eval examples cover trigger, boundary, fallback, safety, handoff, and near-neighbor routing', () => {
    const payload = JSON.parse(fs.readFileSync(EXAMPLES_PATH, 'utf8'));
    const casesById = new Map(payload.cases.map((entry) => [entry.id, entry]));
    const tags = new Set(payload.cases.flatMap((entry) => entry.coverage_tags));

    expect(payload.description).toContain('not a deterministic router or semantic readiness gate');
    expect(payload.source_refs).toEqual(expect.arrayContaining([
      'skills/spec-plan/SKILL.md',
      'skills/spec-plan/references/planning-flow.md',
      'skills/spec-plan/references/governance-boundaries.md',
      'skills/spec-plan/references/plan-handoff.md',
    ]));
    expect(payload.source_refs.join('\n')).not.toContain('.agents/skills/');
    expect(payload.source_refs.join('\n')).not.toContain('.claude/');
    expect(payload.source_refs.join('\n')).not.toContain('.codex/');

    for (const requiredId of [
      'settled-requirements-implementation-plan',
      'direct-invocation-always-plans',
      'unclear-input-bootstrap',
      'missing-source-document-failure',
      'question-tool-unavailable-fallback',
      'plan-only-safety-no-implementation',
      'review-origin-planning',
      'dirty-worktree-limitation',
      'prd-handoff-entropy-boundary',
      'generated-runtime-mirror-exclusion',
      'task-pack-optional-handoff',
      'brainstorm-owned-what-boundary',
      'execution-ready-plan-boundary',
      'test-failure-debug-boundary',
      'prd-readiness-boundary',
      'plan-document-review-boundary',
    ]) {
      expect(casesById.has(requiredId)).toBe(true);
      expect(casesById.get(requiredId).expected_outcome).toEqual(expect.any(String));
    }

    for (const requiredTag of [
      'direct-invocation',
      'fallback',
      'failure',
      'plan-only-safety',
      'review-origin',
      'workspace-safety',
      'prd-handoff',
      'source-runtime',
      'task-pack',
      'brainstorm-routing',
      'debug-routing',
      'prd-routing',
      'review-routing',
    ]) {
      expect(tags.has(requiredTag)).toBe(true);
    }

    expect(casesById.get('generated-runtime-mirror-exclusion').expected_outcome).toContain('skills/spec-plan source');
    expect(casesById.get('task-pack-optional-handoff').expected_outcome).toContain('wait for explicit user selection');
    expect(casesById.get('missing-source-document-failure').expected_outcome).toContain('do not invent requirements');
    expect(casesById.get('question-tool-unavailable-fallback').expected_outcome).toContain('Fall back loudly');
    expect(casesById.get('prd-handoff-entropy-boundary').boundary_note).toContain('does not copy the full spec-prd readiness lens');
  });

  test('plan synthesis checkpoints and template naming are in place', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const planningFlow = fs.readFileSync(PLANNING_FLOW_PATH, 'utf8');
    const planTemplate = fs.readFileSync(PLAN_TEMPLATE_PATH, 'utf8');
    const planSections = fs.readFileSync(PLAN_SECTIONS_PATH, 'utf8');
    const markdownRendering = fs.readFileSync(MARKDOWN_RENDERING_PATH, 'utf8');
    const htmlRendering = fs.readFileSync(HTML_RENDERING_PATH, 'utf8');
    const synthesis = fs.readFileSync(SYNTHESIS_PATH, 'utf8');
    const deepening = fs.readFileSync(DEEPENING_PATH, 'utf8');
    const visual = fs.readFileSync(VISUAL_COMMUNICATION_PATH, 'utf8');

    expect(skill).toContain('planning-flow.md');
    expect(planningFlow).toContain('### 0.7 Solo-Mode Scope Summary');
    expect(skill).toContain('#### 5.1.5 Brainstorm-Sourced Scope Summary');
    expect(planningFlow).toContain('read `skills/spec-plan/references/synthesis-summary.md`');
    expect(planTemplate).toContain('## Summary');
    expect(planTemplate).toContain('## Decision Brief');
    expect(planTemplate).toContain('Optional for Lightweight plans');
    expect(planTemplate).toContain('This section summarizes');
    expect(planTemplate).toContain('does not replace Summary, Key Technical');
    expect(planTemplate).toContain('## System-Wide Impact');
    expect(planTemplate).toContain('Surface coverage');
    expect(planTemplate).toContain('## Existing Capability / Reuse Analysis');
    expect(planTemplate).toContain('## Enterprise Risk Appendix');
    expect(planTemplate).toContain('## API Contract Appendix');
    expect(planTemplate).toContain('## Data Migration & Rollback Appendix');
    expect(planTemplate).toContain('## Scheduled Job Appendix');
    expect(planTemplate).toContain('Keep small plans to one KTD or');
    expect(planTemplate).toContain('`in-scope`');
    expect(planTemplate).toContain('`out-of-scope: <reason>`');
    expect(planTemplate).toContain('`deferred: <owner/trigger>`');
    expect(planTemplate).toContain('do not include empty rows or a `not-applicable` state');
    expect(planTemplate).toContain('## Requirements');
    expect(planTemplate).toContain('treat `## Overview` as the legacy name');
    expect(planTemplate).toContain('legacy `## Requirements Trace`');
    expect(planTemplate).toContain('## Assumptions');
    expect(planTemplate).toContain('Include only for unconfirmed inferred bets');
    expect(planTemplate).toContain('Keep these out of Key Technical Decisions and Implementation Units');
    expect(skill).toContain('Read `skills/spec-plan/references/plan-sections.md` before writing the plan.');
    expect(skill).toContain('Read `skills/spec-plan/references/markdown-rendering.md` before writing the canonical markdown plan.');
    expect(skill).toContain('Read `skills/spec-plan/references/plan-template.md` before writing the plan.');
    expect(skill).toContain('Do not reconstruct the template from memory and do not inline the full template in this skill.');
    expect(skill).toContain('Use the current host\'s file-write mechanism to save the complete plan to:');
    expect(skill).not.toContain('Use the Write tool to save the complete plan to:');
    expect(skill).toContain('Implementation unit field contract lives in `skills/spec-plan/references/plan-sections.md`');
    expect(skill).toContain('Plan document path rules live in `skills/spec-plan/references/plan-sections.md`');
    expect(skill).not.toContain('/Users/name/Code/project/src/file.ts');
    expect(skill).not.toContain('For each unit, include:');
    expect(skill).toContain('Markdown remains the source artifact for `spec-work`, `spec-write-tasks`, `spec-doc-review`, and plan deepening.');
    expect(skill).toContain('Include `## Decision Brief` when the first human pass needs recommended approach');
    expect(skill).toContain('does the first human pass (`## Summary` plus material `## Decision Brief`) answer what is being built');
    expect(skill).toContain('optional sidecar only');
    expect(skill).toContain('do not replace the markdown plan without focused downstream consumer tests');
    expect(planSections).toContain('Markdown remains the canonical plan artifact.');
    expect(planSections).toContain('`plan-template.md` is still the concrete markdown skeleton');
    expect(planSections).toContain('`spec-work`, `spec-write-tasks`, and `spec-doc-review` can consume');
    expect(planSections).toContain('**Decision Brief**');
    expect(planSections).toContain('It summarizes and points to lower sections');
    expect(planSections).toContain('Lightweight plans may omit it');
    expect(planSections).toContain('conditional surface-coverage lens');
    expect(planSections).toContain('enumerate only the surfaces that actually exist in the target repo/product');
    expect(planSections).toContain('mark each as `in-scope`, `out-of-scope: <reason>`, or `deferred: <owner/trigger>`');
    expect(planSections).toContain('Omit irrelevant surfaces entirely');
    expect(planSections).toContain('do not carry empty rows or a `not-applicable` state');
    expect(planSections).toContain('The section catalog is a floor, not a ceiling.');
    expect(planSections).toContain('Do not use this agency to skip canonical markdown');
    expect(planSections).toContain('## Prose Economy');
    expect(planSections).toContain('Resolve in place; do not stratify');
    expect(planSections).toContain('Precision is not padding');
    expect(planSections).toContain('All paths in the plan body are repo-relative.');
    expect(planSections).toContain('Never use absolute paths such as `/Users/name/Code/project/src/file.ts`');
    expect(planSections).toContain('When a plan targets a different repo than the document\'s home');
    expect(planSections).not.toContain('Decide whether a plan doc is warranted at all');
    expect(planSections).not.toContain('Plans carry **no `status` field**');
    expect(planSections).toContain('optional HTML sidecar');
    expect(planSections).toContain('not an exclusive output mode');
    expect(markdownRendering).toContain('YAML frontmatter appears at the top of the file');
    expect(markdownRendering).toContain('Markdown stays markdown');
    expect(markdownRendering).toContain('place `## Decision Brief` immediately after `## Summary` as visible Markdown');
    expect(markdownRendering).toContain('without replacing requirements, decisions, evidence, or implementation units');
    expect(markdownRendering).toContain('Use H3 headings for implementation units: `### U1. [Name]`');
    expect(htmlRendering).toContain('optional HTML sidecar');
    expect(htmlRendering).toContain('not an exclusive output mode');
    expect(htmlRendering).toContain('write the markdown plan first');
    expect(htmlRendering).toContain('not add or omit load-bearing content');
    for (const text of [planSections, markdownRendering, htmlRendering]) {
      expect(text).not.toContain('.compound-engineering');
      expect(text).not.toMatch(/\bce-[a-z]/);
      expect(text).not.toContain('output mode is exclusive');
    }
    const template = fs.readFileSync(PLAN_TEMPLATE_PATH, 'utf8');
    const summaryIndex = template.indexOf('## Summary');
    const decisionBriefIndex = template.indexOf('## Decision Brief');
    const problemFrameIndex = template.indexOf('## Problem Frame');
    expect(summaryIndex).toBeGreaterThanOrEqual(0);
    expect(decisionBriefIndex).toBeGreaterThan(summaryIndex);
    expect(problemFrameIndex).toBeGreaterThan(decisionBriefIndex);
    expect(template.indexOf('## Requirements')).toBeLessThan(template.indexOf('## Assumptions'));
    expect(template.indexOf('## Assumptions')).toBeLessThan(template.indexOf('## Scope Boundaries'));
    expect(template).toContain('### U1. [Name]');
    for (const unitField of [
      '**Goal:**',
      '**Requirements:**',
      '**Dependencies:**',
      '**Files:**',
      '**Approach:**',
      '**Test scenarios:**',
      '**Verification:**',
    ]) {
      expect(template).toContain(unitField);
    }
    expect(template).not.toContain('- U1. **[Name]**');
    expect(skill).toContain('Use `### U1. [Name]` heading-style implementation units for new plans.');
    expect(skill).toContain('continue to recognize legacy `- U1. **[Name]**` list-item units as valid anchors.');
    expect(synthesis).toContain('Solo variant (Phase 0.7)');
    expect(synthesis).toContain('Brainstorm-sourced variant (Phase 5.1.5)');
    expect(synthesis).toContain('Two-stage shape: internal draft, then chat-time synthesis');
    expect(synthesis).toContain('Decision Brief is a reading aid, not a routing destination');
    expect(synthesis).toContain('synthesis content still routes to the destinations below');
    expect(synthesis).toContain('not a second synthesis section');
    expect(synthesis).toContain('Do not paste this draft verbatim into chat');
    expect(synthesis).toContain('Stage 2: Chat-Time Scoping Synthesis');
    expect(synthesis).toContain('No user-facing **Stated** or **Out of scope** bucket appears in chat');
    expect(synthesis).toContain('Call outs');
    expect(synthesis).toContain('Auto-proceed is allowed only when plan depth is Lightweight and zero Call outs survive the keep test');
    expect(synthesis).toContain('For Standard or Deep plans, always fire the confirmation gate even when zero Call outs survive');
    expect(synthesis).toContain('affirmability test');
    expect(synthesis).toContain('detail test');
    expect(synthesis).toContain('Implementation Units, PR count, branch sequencing, effort estimates, or test command recipes');
    expect(synthesis).toContain('exact JSON or response shapes');
    expect(synthesis).toContain('bare origin IDs such as `R1`, `AE2`, `F3`, or `U4` without plain names');
    expect(synthesis).toContain('Do not route unconfirmed inferences into Key Technical Decisions or Implementation Units');
    expect(synthesis).toContain('First-pass decision/risk/validation orientation, when material');
    expect(synthesis).toContain('current host\'s brainstorm entrypoint');
    expect(synthesis).toContain('## Assumptions');
    expect(deepening).toContain('**Requirements**');
    expect(deepening).toContain('Requirements / Open Questions classification');
    expect(deepening).toContain('`spec-api-contract-reviewer`');
    expect(deepening).toContain('existing specialist for contract depth, not a new surface-enumeration agent');
    expect(deepening).toContain('`spec-design-lens-reviewer`');
    expect(deepening).toContain('design-decision lens for materially user-facing plans');
    expect(skill).not.toContain('`out-of-scope: <reason>`');
    expect(skill).not.toContain('spec-surface-coverage-reviewer');
    expect(visual).toContain('Summary or Problem Frame');
    expect([skill, synthesis].join('\n')).not.toContain('STRATEGY.md');
    expect([skill, synthesis].join('\n')).not.toContain('/ce-');
    expect(synthesis).not.toContain('/ce-brainstorm');
    expect(synthesis).not.toContain('/ce-plan');
  });

  test('Claude command projection points plan template reference at the workflow runtime copy', () => {
    const command = plannedRuntimeContent(new ClaudeAdapter(), '.claude/commands/spec/plan.md');
    const claudePlanningFlow = plannedRuntimeContent(new ClaudeAdapter(), '.claude/spec-first/workflows/spec-plan/references/planning-flow.md');
    const codexPlanningFlow = plannedRuntimeContent(new CodexAdapter(), '.agents/skills/spec-plan/references/planning-flow.md');

    expect(command).toContain('read `.claude/spec-first/workflows/spec-plan/references/planning-flow.md`');
    expect(command).toContain('Read `.claude/spec-first/workflows/spec-plan/references/plan-sections.md` before writing the plan.');
    expect(command).toContain('Read `.claude/spec-first/workflows/spec-plan/references/markdown-rendering.md` before writing the canonical markdown plan.');
    expect(command).toContain('Read `.claude/spec-first/workflows/spec-plan/references/plan-template.md` before writing the plan.');
    expect(claudePlanningFlow).toContain('read `.claude/spec-first/workflows/spec-plan/references/synthesis-summary.md`');
    expect(codexPlanningFlow).toContain('read `.agents/skills/spec-plan/references/synthesis-summary.md`');
    expect(claudePlanningFlow).toContain('.claude/spec-first/workflows/spec-prd/scripts/finalize-prd-artifact.js');
    expect(codexPlanningFlow).toContain('.agents/skills/spec-prd/scripts/finalize-prd-artifact.js');
    expect(claudePlanningFlow).toContain('PRD_FINALIZER');
    expect(codexPlanningFlow).toContain('PRD_FINALIZER');
    expect(plannedRuntimeContent(new ClaudeAdapter(), '.claude/spec-first/workflows/spec-plan/references/plan-sections.md')).toContain('Markdown remains the canonical plan artifact.');
    expect(plannedRuntimeContent(new ClaudeAdapter(), '.claude/spec-first/workflows/spec-plan/references/plan-sections.md')).toContain('conditional surface-coverage lens');
    expect(plannedRuntimeContent(new ClaudeAdapter(), '.claude/spec-first/workflows/spec-plan/references/plan-template.md')).toContain('- **Surface coverage:**');
    expect(plannedRuntimeContent(new ClaudeAdapter(), '.claude/spec-first/workflows/spec-plan/references/markdown-rendering.md')).toContain('Markdown stays markdown');
    expect(plannedRuntimeContent(new ClaudeAdapter(), '.claude/spec-first/workflows/spec-plan/references/html-rendering.md')).toContain('optional HTML sidecar');
    expect(command).not.toContain('Read `references/plan-template.md` before writing the plan.');
    expect(command).not.toContain('Read `skills/spec-plan/references/plan-template.md` before writing the plan.');
  });

  test('eval support detection uses skill-relative paths, not absolute source package paths', () => {
    const parentRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-plan-parent-'));
    const linkedRepoRoot = path.join(parentRoot, 'evals', 'spec-first');

    try {
      fs.mkdirSync(path.dirname(linkedRepoRoot), { recursive: true });
      fs.symlinkSync(path.join(__dirname, '..', '..'), linkedRepoRoot, 'dir');
      const result = spawnSync(process.execPath, ['--preserve-symlinks', '-e', `
        const fs = require('node:fs');
        const os = require('node:os');
        const path = require('node:path');
        const repo = process.argv[1];
        const { planBundledAssetSync } = require(path.join(repo, 'src/cli/plugin.js'));
        const CodexAdapter = require(path.join(repo, 'src/cli/adapters/codex.js'));
        const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'projection-target-'));
        try {
          const { plan } = planBundledAssetSync(projectRoot, new CodexAdapter());
          const skill = plan.operations.find((entry) => entry.path === '.agents/skills/spec-plan/SKILL.md').contents;
          const outputQuality = JSON.parse(plan.operations.find((entry) => entry.path === '.agents/skills/spec-plan/evals/output-quality-cases.json').contents);
          process.stdout.write(JSON.stringify({
            runtimeSkillRewritten: skill.includes('read \`.agents/skills/spec-plan/references/planning-flow.md\`'),
            sourceSkillPathLeaked: skill.includes('read \`skills/spec-plan/references/planning-flow.md\`'),
            evalRefsPreserved: outputQuality.source_refs.includes('skills/spec-plan/references/planning-flow.md'),
            evalRuntimePathLeaked: outputQuality.source_refs.join('\\n').includes('.agents/skills/spec-plan/')
          }));
        } finally {
          fs.rmSync(projectRoot, { recursive: true, force: true });
        }
      `, linkedRepoRoot], {
        encoding: 'utf8',
      });
      const payload = JSON.parse(result.stdout);

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');
      expect(payload.runtimeSkillRewritten).toBe(true);
      expect(payload.sourceSkillPathLeaked).toBe(false);
      expect(payload.evalRefsPreserved).toBe(true);
      expect(payload.evalRuntimePathLeaked).toBe(false);
    } finally {
      fs.rmSync(parentRoot, { recursive: true, force: true });
    }
  });

  test('governance boundary reference is runtime-copied for both hosts', () => {
    const sourceSkill = fs.readFileSync(SKILL_PATH, 'utf8');
    const sourceReference = fs.readFileSync(GOVERNANCE_BOUNDARIES_PATH, 'utf8');
    const claudeRuntimeSkill = plannedRuntimeContent(new ClaudeAdapter(), '.claude/spec-first/workflows/spec-plan/SKILL.md');
    const codexRuntimeSkill = plannedRuntimeContent(new CodexAdapter(), '.agents/skills/spec-plan/SKILL.md');
    const claudeRuntimeReference = plannedRuntimeContent(
      new ClaudeAdapter(),
      '.claude/spec-first/workflows/spec-plan/references/governance-boundaries.md',
    );
    const codexRuntimeReference = plannedRuntimeContent(
      new CodexAdapter(),
      '.agents/skills/spec-plan/references/governance-boundaries.md',
    );

    expect(sourceSkill).toContain('read `skills/spec-plan/references/governance-boundaries.md`');
    expect(claudeRuntimeSkill).toContain('read `.claude/spec-first/workflows/spec-plan/references/governance-boundaries.md`');
    expect(codexRuntimeSkill).toContain('read `.agents/skills/spec-plan/references/governance-boundaries.md`');
    expect(sourceReference).toContain('## Capability-Class Evidence Boundary');
    expect(claudeRuntimeReference).toContain('## Capability-Class Evidence Boundary');
    expect(codexRuntimeReference).toContain('## Capability-Class Evidence Boundary');
    expect(claudeRuntimeReference).toContain('provider_untrusted');
    expect(codexRuntimeReference).toContain('provider_untrusted');
  });

  test('runtime integrity anchors track the extracted governance boundary reference', () => {
    const claudeInspection = syncedRuntimeInspection(new ClaudeAdapter());
    const codexInspection = syncedRuntimeInspection(new CodexAdapter());

    expect(
      claudeInspection.commands.drifted.find((entry) => entry.commandName === 'plan'),
    ).toBeUndefined();
    expect(
      claudeInspection.skills.drifted.find((entry) => entry.skillName === 'spec-plan'),
    ).toBeUndefined();
    expect(
      codexInspection.skills.drifted.find((entry) => entry.skillName === 'spec-plan'),
    ).toBeUndefined();
  });

  test.each([
    ['claude', new ClaudeAdapter()],
    ['codex', new CodexAdapter()],
  ])('runtime integrity detects missing governance boundary reference for %s', (_platform, adapter) => {
    const inspection = syncedRuntimeInspectionAfter(adapter, (projectRoot) => {
      fs.rmSync(path.join(projectRoot, runtimeGovernanceBoundariesPath(adapter)));
    });

    expect(specPlanDriftIssues(inspection)).toContain('missing_file:references/governance-boundaries.md');
  });

  test.each([
    ['claude', new ClaudeAdapter()],
    ['codex', new CodexAdapter()],
  ])('runtime integrity detects drifted governance boundary reference for %s', (_platform, adapter) => {
    const inspection = syncedRuntimeInspectionAfter(adapter, (projectRoot) => {
      fs.writeFileSync(
        path.join(projectRoot, runtimeGovernanceBoundariesPath(adapter)),
        '# Drifted Governance Boundaries\n',
        'utf8',
      );
    });

    expect(specPlanDriftIssues(inspection)).toContain('content_mismatch:references/governance-boundaries.md');
  });

  test('universal planning avoids slash-only handoff wording', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    const text = fs.readFileSync(UNIVERSAL_PLANNING_PATH, 'utf8');

    expect(skill).toContain('For software and plan-seeking tasks, this workflow produces a durable implementation or structured plan.');
    expect(skill).toContain('For non-software answer-seeking tasks routed through `references/universal-planning.md`, it uses planning as the working scaffold and answers in chat without writing a plan file by default.');
    expect(skill).toContain('for non-software answer-seeking tasks, an evidence-grounded chat answer with no plan artifact by default');
    expect(skill).toContain('Non-software answer-seeking tasks create no durable artifact unless the user asks to save the result.');
    expect(text).toContain('current host\'s plan entrypoint');
    expect(text).toContain('software work entrypoint');
    expect(text).toContain('The user invoked the plan workflow');
    expect(text).toContain('Disposition: Plan-Seeking vs. Answer-Seeking');
    expect(text).toContain('**Plan-seeking**');
    expect(text).toContain('**Answer-seeking**');
    expect(text).toContain('state a brief plan of attack in chat, execute it, then deliver the answer');
    expect(text).toContain('No plan file is written unless the user asks to save the result');
    expect(text).toContain('Ground answers about the user\'s own code, repo, CLI, service, or named artifact in direct source reads, not memory');
    expect(text).toContain('Code changes belong in the software work entrypoint');
    expect(text).toContain('Do not write a plan file and do not run the Step 3 save/share menu by default');
    expect(text).toContain('Veil Of Value');
    expect(text).toContain('use the current host\'s available web/search capability');
    expect(text).toContain('Run searches in parallel when the host supports it, or sequentially in the current agent when it does not.');
    expect(text).toContain('If no current-facts research tool is available');
    expect(text).not.toContain('Agent tool with `model: "haiku"`');
    expect(text).not.toContain('model: "haiku"');
    expect(text).not.toContain('Use `/spec:plan` directly');
    expect(text).not.toContain('The user invoked `/spec:plan`');
    expect(text).not.toContain('Do not offer `/spec:work`');
    expect(text).not.toContain('/ce-plan');
    expect(text).not.toContain('/ce-work');
    expect(text).not.toContain('/spec:plan` on Claude Code');
    expect(text).not.toContain('$spec-plan` on Codex');
    expect(text).not.toContain('/spec:work` on Claude Code');
    expect(text).not.toContain('$spec-work` on Codex');
  });
});
