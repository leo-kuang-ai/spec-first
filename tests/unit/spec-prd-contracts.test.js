'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const {
  buildFilteredAssetSet,
  loadPluginManifest,
} = require('../../src/cli/plugin');
const { getAdapter } = require('../../src/cli/adapters');

const REPO_ROOT = path.join(__dirname, '..', '..');
const SKILL_DIR = path.join(REPO_ROOT, 'skills', 'spec-prd');
const SKILL_PATH = path.join(SKILL_DIR, 'SKILL.md');
const EVIDENCE_TOPOLOGY_PATH = path.join(SKILL_DIR, 'references', 'evidence-and-topology.md');
const DOMAIN_LANGUAGE_PATH = path.join(SKILL_DIR, 'references', 'domain-language-and-decision-ledger.md');
const GRILL_WITH_DOCS_INTEGRATION_PATH = path.join(SKILL_DIR, 'references', 'grill-with-docs-integration.md');
const OUTPUT_TEMPLATE_PATH = path.join(SKILL_DIR, 'references', 'prd-output-template.md');
const READINESS_PATH = path.join(SKILL_DIR, 'references', 'prd-readiness-lens.md');
const PRODUCT_LENS_PATH = path.join(SKILL_DIR, 'references', 'product-expert-lens.md');
const DESIGN_SOURCE_PATH = path.join(SKILL_DIR, 'references', 'design-source-evidence.md');
const EVALUATION_GOVERNANCE_PATH = path.join(SKILL_DIR, 'references', 'evaluation-governance.md');
const GLOSSARY_PATH = path.join(REPO_ROOT, 'docs', 'contracts', 'domain-glossary.md');
const DRIFT_SCRIPT_PATH = path.join(SKILL_DIR, 'scripts', 'check-glossary-drift.js');
const PRD_ARTIFACT_SCRIPT_PATH = path.join(SKILL_DIR, 'scripts', 'check-prd-artifact.js');
const EVAL_RUNNER_PATH = path.join(SKILL_DIR, 'scripts', 'run-evals.js');
const EVALS_PATH = path.join(SKILL_DIR, 'evals', 'examples.json');
const GOVERNANCE_PATH = path.join(
  REPO_ROOT,
  'src',
  'cli',
  'contracts',
  'dual-host-governance',
  'skills-governance.json',
);
const COMMAND_PATH = path.join(REPO_ROOT, 'templates', 'claude', 'commands', 'spec', 'prd.md');
const USING_SPEC_FIRST_PATH = path.join(REPO_ROOT, 'skills', 'using-spec-first', 'SKILL.md');
const SPEC_PLAN_PATH = path.join(REPO_ROOT, 'skills', 'spec-plan', 'SKILL.md');
const SPEC_PLAN_PLANNING_FLOW_PATH = path.join(REPO_ROOT, 'skills', 'spec-plan', 'references', 'planning-flow.md');
const HUMAN_TEMPLATE_INDEX_PATH = path.join(REPO_ROOT, 'docs', '需求文档模版', '标准模版', 'README.md');
const HUMAN_TEMPLATE_CORE_PATH = path.join(REPO_ROOT, 'docs', '需求文档模版', '标准模版', '00-通用增量需求模板.md');
const USER_MANUAL_PATH = path.join(
  REPO_ROOT,
  'docs',
  '05-用户手册',
  '22-PRD需求文档质量增强流程.md',
);
const FRESH_SOURCE_EVAL_DOMAIN_GRILL_PATH = path.join(
  REPO_ROOT,
  'docs',
  'validation',
  'spec-prd',
  'fresh-source-eval-2026-06-03-domain-grill.md',
);
const FRESH_SOURCE_EVAL_SIMPLICITY_PATH = path.join(
  REPO_ROOT,
  'docs',
  'validation',
  'spec-prd',
  'fresh-source-eval-2026-06-04-simplicity-refactor.md',
);
const FRESH_SOURCE_EVAL_SANITIZATION_FEATURE_SLICES_PATH = path.join(
  REPO_ROOT,
  'docs',
  'validation',
  'spec-prd',
  'fresh-source-eval-2026-06-05-sanitization-feature-slices.md',
);
const FRESH_SOURCE_EVAL_SANITIZATION_FEATURE_SLICES_SUCCESSOR_PATH = path.join(
  REPO_ROOT,
  'docs',
  'validation',
  'spec-prd',
  'fresh-source-eval-2026-06-21-sanitization-feature-slices-topology.md',
);
const FRESH_SOURCE_EVAL_REQUIREMENTS_GRILL_PATH = path.join(
  REPO_ROOT,
  'docs',
  'validation',
  'spec-prd',
  'fresh-source-eval-2026-06-22-requirements-grill.md',
);
const FRESH_SOURCE_EVAL_PRODUCT_EXPERT_LENS_PATH = path.join(
  REPO_ROOT,
  'docs',
  'validation',
  'spec-prd',
  'fresh-source-eval-2026-06-24-product-expert-lens.md',
);
const FRESH_SOURCE_EVAL_CLARIFICATION_EVIDENCE_PATH = path.join(
  REPO_ROOT,
  'docs',
  'validation',
  'spec-prd',
  'fresh-source-eval-2026-06-24-clarification-evidence.md',
);
const FRESH_SOURCE_EVAL_RELENTLESS_GRILL_PATH = path.join(
  REPO_ROOT,
  'docs',
  'validation',
  'spec-prd',
  'fresh-source-eval-2026-06-25-relentless-grill.md',
);

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(read(filePath));
}

function readActiveSpecPrdSurface() {
  return [
    SKILL_PATH,
    EVIDENCE_TOPOLOGY_PATH,
    DOMAIN_LANGUAGE_PATH,
    GRILL_WITH_DOCS_INTEGRATION_PATH,
    OUTPUT_TEMPLATE_PATH,
    READINESS_PATH,
    EVALS_PATH,
    USER_MANUAL_PATH,
    __filename,
  ].map((filePath) => `\n--- ${path.relative(REPO_ROOT, filePath)} ---\n${read(filePath)}`).join('\n');
}

function expectContainsAll(content, snippets) {
  for (const snippet of snippets) {
    expect(content).toContain(snippet);
  }
}

function extractMarkdownSection(content, heading) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === heading);
  expect(start).toBeGreaterThanOrEqual(0);

  const level = heading.match(/^#+/)[0].length;
  const nextHeading = new RegExp(`^#{1,${level}}\\s+`);
  const end = lines.findIndex((line, index) => index > start && nextHeading.test(line));
  return lines.slice(start, end === -1 ? lines.length : end).join('\n');
}

function findEvalCase(examples, id) {
  const entry = examples.cases.find((candidate) => candidate.id === id);
  expect(entry).toBeTruthy();
  return entry;
}

function expectEvalCase(examples, id, contract) {
  const entry = findEvalCase(examples, id);
  const expectedText = entry.expected.join('\n');

  expect(entry.coverage_tags).toEqual(expect.arrayContaining(contract.tags));
  for (const snippet of contract.expected) {
    expect(expectedText).toContain(snippet);
  }
}

function expectCoverageTags(examples, tags) {
  const availableTags = new Set(examples.cases.flatMap((entry) => entry.coverage_tags || []));
  for (const tag of tags) {
    expect(availableTags.has(tag)).toBe(true);
  }
}

function expectQualityBuckets(examples, buckets) {
  const availableBuckets = new Set(examples.cases.flatMap((entry) => entry.quality_buckets || []));
  for (const bucket of buckets) {
    expect(availableBuckets.has(bucket)).toBe(true);
  }
}

function expectEvalCaseStructure(examples) {
  const ids = new Set();
  const caseTypes = new Set(examples.case_contract.case_types);
  const mustNotRequiredBuckets = new Set(examples.case_contract.must_not_required_quality_buckets);
  for (const entry of examples.cases) {
    expect(typeof entry.id).toBe('string');
    expect(entry.id.length).toBeGreaterThan(0);
    expect(ids.has(entry.id)).toBe(false);
    ids.add(entry.id);
    expect(['create', 'refine', 'validate', 'route-out', 'bypass']).toContain(entry.intent);
    expect(caseTypes.has(entry.case_type)).toBe(true);
    expect(Array.isArray(entry.quality_buckets)).toBe(true);
    expect(entry.quality_buckets.length).toBeGreaterThan(0);
    const requiresMustNot = entry.quality_buckets.some((bucket) => mustNotRequiredBuckets.has(bucket));
    if (requiresMustNot) {
      expect(Array.isArray(entry.must_not)).toBe(true);
      expect(entry.must_not.length).toBeGreaterThan(0);
    }
    expect(typeof entry.input_shape).toBe('string');
    expect(entry.input_shape.length).toBeGreaterThan(0);
    expect(Array.isArray(entry.expected)).toBe(true);
    expect(entry.expected.length).toBeGreaterThan(0);
    expect(Array.isArray(entry.coverage_tags)).toBe(true);
    expect(entry.coverage_tags.length).toBeGreaterThan(0);
  }
}

function listCurrentFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listCurrentFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(path.relative(REPO_ROOT, entryPath).split(path.sep).join('/'));
    }
  }

  return files.sort();
}

describe('spec-prd workflow contracts', () => {
  test('source topology stays compressed to the durable steel frame', () => {
    const files = listCurrentFiles(SKILL_DIR);
    const sourceFiles = files.filter((file) => !file.includes('/evals/'));
    const references = files.filter((file) => file.includes('/references/'));

    expect(sourceFiles).toEqual([
      'skills/spec-prd/SKILL.md',
      'skills/spec-prd/references/design-source-evidence.md',
      'skills/spec-prd/references/domain-language-and-decision-ledger.md',
      'skills/spec-prd/references/evaluation-governance.md',
      'skills/spec-prd/references/evidence-and-topology.md',
      'skills/spec-prd/references/grill-with-docs-integration.md',
      'skills/spec-prd/references/large-input-checkpoint.md',
      'skills/spec-prd/references/prd-output-template.md',
      'skills/spec-prd/references/prd-readiness-lens.md',
      'skills/spec-prd/references/product-expert-lens.md',
      'skills/spec-prd/scripts/check-glossary-drift.js',
      'skills/spec-prd/scripts/check-prd-artifact.js',
      'skills/spec-prd/scripts/finalize-prd-artifact.js',
      'skills/spec-prd/scripts/lib/reason-codes.js',
      'skills/spec-prd/scripts/run-evals.js',
    ]);
    expect(references).toEqual([
      'skills/spec-prd/references/design-source-evidence.md',
      'skills/spec-prd/references/domain-language-and-decision-ledger.md',
      'skills/spec-prd/references/evaluation-governance.md',
      'skills/spec-prd/references/evidence-and-topology.md',
      'skills/spec-prd/references/grill-with-docs-integration.md',
      'skills/spec-prd/references/large-input-checkpoint.md',
      'skills/spec-prd/references/prd-output-template.md',
      'skills/spec-prd/references/prd-readiness-lens.md',
      'skills/spec-prd/references/product-expert-lens.md',
    ]);
    expect(sourceFiles).toHaveLength(15);
    expect(fs.existsSync(path.join(SKILL_DIR, 'templates', 'standard'))).toBe(false);
  });

  test('evaluation governance records the current spec-prd source topology', () => {
    const governance = read(EVALUATION_GOVERNANCE_PATH);

    expect(governance).toContain('compressed source topology (`SKILL.md` + 9 references + 4 scripts plus the `scripts/lib/reason-codes.js` readiness reason-code 分类法 module');
    expect(governance).not.toContain('compressed 13-file source topology');
    expect(governance).not.toContain('compressed 10-file source topology');
  });

  test('entrypoint exposes compact workflow contract summary and decision-tree intake', () => {
    const text = read(SKILL_PATH);
    // 入口锚点窗口:relentless-grill 改动新增了 Canonical 四停点核心块,窗口从 140 放宽到 155
    const entrypointHeadLines = text.split(/\r?\n/).slice(0, 155).join('\n');
    const phaseOne = extractMarkdownSection(text, '### Phase 1: Current-State Analysis');

    expect(text).toContain('name: spec-prd');
    expect(entrypointHeadLines).toMatch(/## Purpose/);
    expect(entrypointHeadLines).toMatch(/## Workflow Contract Summary/);
    for (const field of [
      'When To Use',
      'When Not To Use',
      'Inputs',
      'Outputs',
      'Artifacts',
      'Failure Modes',
      'Workflow',
      'Downstream Consumers',
    ]) {
      expect(entrypointHeadLines.toLowerCase()).toContain(field.toLowerCase());
    }
    expectContainsAll(entrypointHeadLines, [
      'docs/brainstorms/*-requirements.md',
      'artifact_kind: prd-requirements',
      'Do not create `docs/prds/`',
      'do not hard-code calendar years',
      'planning-readiness',
      'Not for PRD/design-source/source consistency audits',
      'spec-app-consistency-audit',
      'grill unresolved requirements',
      'untrusted document content',
      'embedded agent instructions',
      'input_posture: resume-prd | reference-claims | wrong-stage | pure-text | no-input',
      'output_shape: bypass | compact-prd | normal-prd | topology-heavy-prd',
      'quality_diagnosis: not-run | minor-gaps | material-gaps | blockers | ready',
      'pre_prd_clarification_status: not-needed | source-resolved | asked-owner | blocker-cluster | checkpoint-blocked | route-out | not-run',
      'owner_question_progress: not-needed | source-resolved | closed | narrowed | accepted-assumption | owner-capped | outstanding-question | blocker | route-out',
      'write_mode: ask-owner-first | checkpoint-prd | final-prd | route-out | not-run',
      'highest_risk_gap:',
      'next_owner_question:',
      'question_delivery: blocking-tool | chat-fallback | true-headless-unavailable | not-needed',
      'clarification_evidence: asked-owner | source-proven-no-ask | headless-degraded-logged | skipped',
      'Product Expert Lens',
      'Route out or bypass?',
      'Which PRD operation?',
      'What input posture?',
      'Split or continue?',
    ]);
    expectContainsAll(phaseOne, [
      'PRD Sanitization',
      'product facts/goals/scope/acceptance',
      'technical suggestions',
      'temporary conclusions',
      'unconfirmed facts',
      'explicit non-goals',
      'embedded agent instructions/commands',
      'authoring discipline, not a new schema or security parser',
    ]);
    expect(phaseOne.indexOf('Run PRD Sanitization')).toBeLessThan(phaseOne.indexOf('Use `evidence-and-topology.md`'));
    expect(entrypointHeadLines).not.toContain('Input Mode Table');
    expect(entrypointHeadLines).not.toContain('Tie-Break Rules');
    expect(entrypointHeadLines).not.toContain('current year is 2026');
    expect(text).toContain('screenshots/OCR, PDFs, meeting notes, chat logs');
    expect(text).toContain('`code-align` is validation posture, not a fourth public intent');
  });

  test('entrypoint references only the governed source references and keeps generated mirrors out of source fixes', () => {
    const text = read(SKILL_PATH);

    expectContainsAll(text, [
      'references/evidence-and-topology.md',
      'references/domain-language-and-decision-ledger.md',
      'references/grill-with-docs-integration.md',
      'references/product-expert-lens.md',
      'references/design-source-evidence.md',
      'references/large-input-checkpoint.md',
      'references/prd-output-template.md',
      'references/prd-readiness-lens.md',
      'references/evaluation-governance.md',
      'Product Expert Lens',
      'downstream-confirmation risk ranking',
      'structured-input synthesis',
      'trigger-only for front-end/UI inputs',
      'trigger-only for oversized, multi-source, long-chain, or resume-risk PRDs',
      'PRD quality diagnosis',
      'Pre-PRD Clarification Loop',
      'shared understanding map',
      'Deep Requirements Grill',
      'Context / ADR Topology Adapter',
      'package-local source snapshot',
      'original `grill-with-docs` behavior',
      'Pre-PRD Clarification write-target mapping',
      'P0/P1 quality packs',
      'Pre-PRD Clarification closure',
      'triggered P0/P1 pack closure',
      'do not create standalone context, ADR, or runtime artifacts',
      'do not copy run-local scratch into the PRD by default',
      'skills/spec-prd/scripts/finalize-prd-artifact.js <prd-path> --inputs <input-path>',
      'edit generated runtime mirrors',
    ]);
    expect(text).not.toContain('Adaptive product expert lens');
    expect(text).not.toContain('Adaptive Product Expert Lens');
    expect(text).not.toContain('references/intent-routing.md');
    expect(text).not.toContain('references/current-state-analysis.md');
    expect(text).not.toContain('references/change-topology-lens.md');
    expect(text).not.toContain('references/domain-lenses.md');
    expect(text).not.toContain('templates/standard/');
  });

  test('governance and manifest expose prd as dual-host workflow command', () => {
    const governance = readJson(GOVERNANCE_PATH);
    const manifest = loadPluginManifest();
    const claudeAssets = buildFilteredAssetSet('claude');
    const codexAssets = buildFilteredAssetSet('codex');

    expect(governance.skills).toEqual(
      expect.arrayContaining([
        {
          skill_name: 'spec-prd',
          entry_surface: 'workflow_command',
          command_name: 'prd',
          host_scope: 'dual_host',
          owner_host: null,
          host_delivery: {
            claude: 'command',
            codex: 'skill',
          },
        },
      ]),
    );
    expect(read(COMMAND_PATH)).toContain('description: "Run the Spec-First PRD requirements workflow"');
    expect(read(COMMAND_PATH)).toContain('argument-hint: "[increment request, existing PRD path, or validation target]"');
    expect(read(SKILL_PATH).match(/^---\n([\s\S]*?)\n---/)[1]).not.toContain('argument-hint');
    expect(manifest.commands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'prd',
          filename: 'prd.md',
          skill: 'spec-prd',
        }),
      ]),
    );
    expect(claudeAssets.commands.map((command) => command.name)).toContain('prd');
    expect(claudeAssets.workflowSkills).toContain('spec-prd');
    expect(codexAssets.workflowSkills).toContain('spec-prd');
    expect(codexAssets.commands.map((command) => command.name)).not.toContain('prd');
  });

  test('owner-alignment questions use the platform blocking question tool', () => {
    const skill = read(SKILL_PATH);
    const domainLanguage = read(DOMAIN_LANGUAGE_PATH);
    const grillIntegration = read(GRILL_WITH_DOCS_INTEGRATION_PATH);

    expectContainsAll(skill, [
      '## Interaction Method',
      'When asking any owner question or confirmation',
      '`AskUserQuestion` in Claude Code',
      '`request_user_input` in Codex',
      '`ToolSearch` with query `select:AskUserQuestion`',
      'Fall back to numbered options in chat only when the harness genuinely lacks a blocking question tool',
      'Never silently skip an owner question',
      'no-input target request, Pre-PRD Clarification, Domain Grill, split confirmation, readiness `ask-owner`, and `grill-with-docs`',
      'question_delivery=chat-fallback',
      'question_delivery=true-headless-unavailable',
      'clarification_evidence=headless-degraded-logged',
      'blocking question tool unavailable does not mean true headless',
      'missing this trail is `clarification_evidence=skipped`',
    ]);
    expectContainsAll(domainLanguage, [
      'Use the parent skill Interaction Method for every owner question',
      'platform blocking question tool',
    ]);
    expectContainsAll(grillIntegration, [
      'Use the parent skill Interaction Method for every owner question',
      'platform blocking question tool',
    ]);
  });

  test('clarification evidence write-mode contract blocks silent final PRD shortcuts', () => {
    const skill = read(SKILL_PATH);

    expectContainsAll(skill, [
      'reason-then-act / 先规划后执行',
      'owner question -> `highest_risk_gap` / `next_owner_question` / `question_delivery`',
      'PRD write -> `write_mode`',
      'readiness -> checker findings plus `readiness_outcome` / `can_enter_spec-plan`',
      'handoff -> `readiness_outcome` and next action',
      'reuse existing Decision Card fields and do not add phase-status enums, progress files, or transcripts',
      'route-out, bypass, and source-proven paths use one concise reason instead of full ceremony',
      'Pre-Write Closure Gate',
      'Canonical: 四个合法停点',
      'keep grilling the highest-risk branch, not "ask one question then stop drafting"',
      'write_mode=checkpoint-prd',
      'write_mode=final-prd',
      'every load-bearing branch has reached a Canonical stop point',
      'grill trace is mandatory',
      'valid non-`skipped` value',
      'Route-out and bypass are pre-authoring exits, not grill exemptions',
      'Claude runtime mutation guard',
      '`prd-prewrite-guard`',
      '`PreToolUse` guard for `Write`',
      'blocks first writes of `docs/brainstorms/*-requirements.md` PRD artifacts',
      'does not judge product semantics or prove an owner really answered',
      'Owner-answer fidelity (no reversal)',
      'Turning a real "must do X" reply into "owner accepted skipping X" is the worst observed failure',
      'the relaxation must be a new owner reply, never your own rewrite of the old one',
      'it cannot verify that the row faithfully reflects what the owner actually said',
      'a matching Owner Decision Trace row',
      'A single global trace row does not close every owner question at once',
      'artifact-internal referential consistency',
      'Checkpoint-as-escape anti-pattern',
      'Writing a checkpoint is not a substitute for grill',
      'asked-owner` means the model asked and received answers on the load-bearing OQs',
      'legal use of checkpoint is **only** when',
      'Requirement Analysis Gate',
      'materials -> requirement understanding map -> uncertainty/contradiction identification -> decide which product/design/technical decisions must be asked through grill -> then write the PRD or analysis conclusion',
      'input_inventory',
      'source_authority_order',
      'target_surface_anchor',
      'current_state_summary',
      'change_delta',
      'module_map',
      'open_decisions',
      'design_coverage',
      'api_coverage',
      'risk_to_prd_write_target',
      'source-backed no-question reason',
      'Input Inventory',
      'Authority Classification',
      'Target Surface Anchor',
      'Current-State Evidence',
      'Change Delta',
      'Risk -> PRD Write Target Map',
      'Owner Question Gate',
      'Domain/Glossary Gate',
      'Topology/Producer-Consumer Gate',
      'Design Coverage Gate',
      'API/Contract Coverage Gate',
      'Large Input/Resume Gate',
      'owner-owned open decisions',
      'preflight_sweep_closure_absent',
      'preflight_sweep_closure` remains the lightweight compatibility declaration for Requirement Analysis Gate closure',
      'start grill before PRD draft',
      'An owner who has not capped a branch that still has reachable sub-decisions prevents `final-prd`',
      'relentless fallback when the owner gives no cap/continue signal',
      'pre_prd_clarification_status=checkpoint-blocked',
      'Do not satisfy the Pre-Write Closure Gate by writing a ready/final PRD first',
      'hosts without an equivalent pre-tool guard',
    ]);
    // 旧止损语义已被翻转:这些反向锚点不得复活
    expect(skill).not.toContain('large input is not permission to skip the owner question');
    expect(skill).not.toContain('highest-risk gap can be closed by one owner question');
    expect(skill).not.toContain('degrade to `revise-prd`, `ask-owner`, `checkpoint-prd`, or `route-out`');
    // 字段去重:不得引入 grill_depth_state 独立字段
    expect(skill).not.toContain('grill_depth_state');
  });

  test('evidence and topology reference preserves source truth and system-shape boundaries', () => {
    const reference = read(EVIDENCE_TOPOLOGY_PATH);

    expectContainsAll(reference, [
      'Evidence Tags',
      '`confirmed-source`',
      '`user-stated`',
      '`source-candidate`',
      '`external-research`',
      '`assumption`',
      'not a provider contract',
      'local knowledge base, code index, prior-artifact summary, or any retrieval layer',
      'Candidate source hits can guide what to read next',
      'Calibration Source Boundary',
      'PRD/user decisions as the authority for product WHAT, acceptance, scope, and non-goals',
      'project docs, SPECs, glossaries, and standards calibrate',
      'source, code, tests, and code indexes confirm current behavior',
      'prior plans, learnings, and archive cases warn about historical risks',
      'candidate modules and source refs are evidence pointers only',
      'must not infer a user goal, add a new acceptance criterion, or override an explicit PRD non-goal',
      'Current-state discovery constrains the PRD',
      '`keep`',
      '`extend`',
      '`replace`',
      '`remove`',
      '`unknown`',
      'Topology Framing Gate',
      'Framing Gate',
      'Evidence Plan',
      'Owner Question Ladder',
      'shape of the system change',
      'candidate_topologies:',
      'load_bearing_surfaces:',
      'source_of_truth_risk:',
      'producer_consumer_risk:',
      'negative_space_risk:',
      'owner_question_needed:',
      'evidence_plan:',
      'claim_or_question | surface | source_to_read_or_command | required_evidence_tag | why_load_bearing | fallback_if_unconfirmed',
      'Evidence planning is mandatory for workflow, contract, setup/runtime, migration, replace, remove, source-of-truth, generated/runtime, mixed-surface PRDs, and any increment whose standard PRD sections would otherwise rely on unconfirmed source claims',
      '`add`',
      '`merge`',
      '`workflow-change`',
      '`contract-change`',
      'Surface Map',
      'Producer / Artifact / Consumer',
      'Source-Of-Truth Resolution',
      'Negative Space',
      'Ask only questions that decide scope, behavior, source-of-truth, or acceptance',
      'A lengthening owner-question sequence is not a stop reason; grilling continues relentlessly by default',
      'a branch stops only at a legal stop point in SKILL.md `Canonical: 四个合法停点`',
      'source attempt already made',
      'PRD write target it changes',
      'load `grill-with-docs-integration.md` and continue one-question-at-a-time',
      'When the anchor is missing',
      'A current-state claim without an evidence tag cannot be treated as `confirmed-source`',
    ]);
    expect(reference).not.toContain('implementation units');
  });

  test('domain-language reference makes full grill the default PRD clarification path', () => {
    const domainLanguage = read(DOMAIN_LANGUAGE_PATH);
    const grillIntegration = read(GRILL_WITH_DOCS_INTEGRATION_PATH);
    const skill = read(SKILL_PATH);

    expectContainsAll(domainLanguage, [
      'Source-First Questioning',
      'repo-local glossary or ADR-like artifacts that actually exist',
      'Do not require a fixed `CONTEXT.md`, `docs/adr/`, or glossary directory for ordinary PRD authoring.',
      'canonical term',
      'Only capture domain-specific terms.',
      'Define what a term IS, not what it DOES.',
      'Cross-PRD Glossary Promotion',
      'docs/contracts/domain-glossary.md',
      'two or more PRDs',
      'preview-first',
      'Requirements Scenario Grill',
      'Use concrete scenarios to stress-test requirements and domain boundaries',
      'not a coaching transcript',
      'Auto-load `grill-with-docs-integration.md` for rough PRD',
      'Ask at most one question at a time.',
      'Each question must bind to a `gap id`, a source attempt, a PRD write target, and a progress state',
      'Continue relentlessly by default, walking down each branch.',
      'write_target: Summary | Problem Frame | Current System Snapshot | Change Delta | Requirements | Acceptance Examples',
      'This format is for asking the owner, not a third persistent field set.',
      'compress it into that section\'s existing fields and do not add new fields',
      'Do not create `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/` by default in normal PRD mode',
      'Pre-PRD Clarification Loop',
      'Default Clarification Posture',
      'Rough PRD, draft, `reference-claims`, `resume-prd`, `pure-text`, multi-source notes, screenshots/OCR, meeting notes, or chat logs default to `grill-with-docs-integration.md`',
      'A high-severity `material-gaps` or `blockers` diagnosis is not required to trigger grilling',
      'Use compact output only when source-first reads have already closed the relevant requirements',
      'claim -> evidence/source -> gap -> question_or_assumption -> PRD write target',
      'Progressive Detail Ladder',
      'L0 source-resolved PRD',
      'L2 large-input Map-Reduce',
      'L5 deep-grill or blocker / route-out',
      'Anchored gaps run through `grill-with-docs-integration.md`',
      'Large-Input Map-Reduce Discipline',
      'Map row = source_ref / claim / actor / flow / state / gap / evidence_tag / confirmation_posture / write_target_candidate',
      'Reduce output = canonical_requirement / supporting_refs / conflicts / assumptions / load_bearing_gap / owner_question_candidate / affected_write_targets',
      'Reduce output feeds Product Expert Lens `downstream_confirmation_risk` ordering',
      'not schemas, artifacts, JSON contracts, durable PRD fields, or script output requirements',
      'Load-Bearing Gap Triage',
      'acceptance impact, behavior/scope irreversibility, number of affected PRD sections, source contradiction, and release/planning consequence',
      'Deep Requirements Grill',
      'one-question-at-a-time progression',
      'recommended answer',
      'source/code/docs/tests/contracts lookup',
      'glossary conflict challenge',
      'fuzzy term sharpening',
      'concrete scenario stress',
      'code contradiction surfacing',
      'skip low-value questions',
      'Every load-bearing branch must reach a legal stop point defined in SKILL.md `Canonical: 四个合法停点` before planning',
      'For PRD authoring/refinement, apply these seven `grill-with-docs` actions to every requirement branch',
      'Do not require the user to name `grill-with-docs`',
      'Grill-With-Docs Integration Trigger',
      'Load `grill-with-docs-integration.md`',
      'any owner-adjudicated requirement branch left after source-first evidence calibration',
      'update the relevant `CONTEXT.md` inline when a project-specific term is resolved',
      'create ADRs only when the decision is hard to reverse, surprising without context, and a real tradeoff',
      'Context / ADR Topology Adapter',
      'existing `CONTEXT.md`, `CONTEXT-MAP.md`, context-specific `CONTEXT.md`, and `docs/adr/**`',
      'PRD-local persistence remains required',
      'preview-first candidate',
      'hard to reverse',
      'surprising without context',
      'reflects a real tradeoff',
    ]);
    expectContainsAll(grillIntegration, [
      'Embedded Upstream Source Snapshot',
      'package-local source snapshot for the upstream benchmark',
      'Run a `/grilling` session, using the `/domain-modeling` skill.',
      'Interview me relentlessly about every aspect of this plan until we reach a shared understanding.',
      'Ask the questions one at a time, waiting for feedback on each question before continuing.',
      'If a question can be answered by exploring the codebase, explore the codebase instead.',
      'Actively build and sharpen the project\'s domain model as you design.',
      'Create files lazily',
      'When a term is resolved, update `CONTEXT.md` right there.',
      'Only offer to create an ADR when all three are true',
      'Original Behavior Contract',
      'rough PRD, draft, `reference-claims`, `resume-prd`, `pure-text`, multi-source notes, screenshots/OCR, meeting notes, or chat logs are being turned into a PRD artifact',
      'ask exactly one question at a time',
      'bind the question to a named gap',
      'wait for feedback before continuing to the next question',
      'If a question can be answered by exploring the codebase, explore the codebase instead of asking the owner.',
      'Challenge against the glossary',
      'Sharpen fuzzy language',
      'Discuss concrete scenarios',
      'Cross-reference with code',
      'Continue this loop relentlessly by default, walking down each branch.',
      'create a root `CONTEXT.md` lazily when the first project-specific term is resolved',
      '`CONTEXT.md` is a glossary and nothing else',
      'update the relevant `CONTEXT.md` inline before continuing the interview',
      'Create or update an ADR only when all three conditions are true',
      'Hard to reverse',
      'Surprising without context',
      'Real tradeoff',
      'Record updated `CONTEXT.md`, `CONTEXT-MAP.md`, or ADR paths in the PRD closeout summary.',
    ]);
    expectContainsAll(skill, [
      'Requirements Grill / Domain Grill Gate',
      'PRD-local in normal mode',
      'deep clarification through `grill-with-docs-integration.md` is the default path',
      'compact output is only a source-resolved PRD shape',
      'persist results into existing PRD sections',
      'Continue one-question-at-a-time relentlessly by default',
    ]);
    expect(domainLanguage).not.toContain('default create `CONTEXT.md`');
    expect(domainLanguage).not.toContain('always create ADR');
  });

  test('output template owns section skeleton, surface lenses, overlays, and split topology', () => {
    const template = read(OUTPUT_TEMPLATE_PATH);
    const productLens = read(PRODUCT_LENS_PATH);
    const featureSlices = extractMarkdownSection(template, '## Feature Slices');
    const closeout = extractMarkdownSection(template, '## Closeout Summary');

    expectContainsAll(template, [
      'artifact_kind: prd-requirements',
      'docs/brainstorms/YYYY-MM-DD-NNN-<slug>-requirements.md',
      'Do not create `docs/prds/`',
      'Do not create a second packaged template tree',
      '## Output Shape',
      '`bypass`',
      '`compact-prd`',
      '`normal-prd`',
      '`topology-heavy-prd`',
      'not frontmatter, schema, or a second artifact taxonomy',
      '## Summary',
      '## Change Delta',
      '## Requirements',
      '## Acceptance Examples',
      '## Scope Boundaries',
      '## Evidence And Assumptions',
      '## Planning Recheck',
      '## Surface Lenses',
      'App',
      'H5/PC',
      'Admin',
      'Backend/Java',
      'CLI/DevTool',
      'Mixed',
      'These are surface lenses, not role taxonomies.',
      'Workflow / Skill / Runtime Quality Signals',
      'generated runtime mirror status',
      'Project-Local Overlays',
      'Missing local overlay docs are a graceful absence',
      'Do not treat template industry facts as confirmed project rules',
      'Industry Overlay Triggers',
      'only raises questions and triggers conditional sections',
      'Product Expert Lens Write-In',
      'product-expert-lens.md',
      'downstream_confirmation_risk',
      'does not copy the full lens or create a fallback checklist',
      'structured or already-decided inputs',
      'Do not introduce a named conversion field map',
      'canonical PRD quality-dimension list',
      'Embedded Standard Skeleton',
      'AE-01（对应 R-01）',
      'AE-02（对应 R-01，异常）',
      'Success Metrics are conditional',
      'reduce drift',
      'fresh-source eval status',
      'do not invent target values',
      'Use `## Planning Recheck` only when it prevents advisory evidence from being consumed as confirmed truth',
      'source-candidate, local pattern, code-index pointer',
      'required before',
      'Framing Gate',
      'Evidence Plan',
      'evidence-and-topology.md',
      'do not print the run-local Framing Gate by default',
      'PRD Quality Diagnosis And Optimization',
      'quality_diagnosis: ready | minor-gaps | material-gaps | blockers',
      'Preliminary Diagnosis',
      'Final Readiness Diagnosis',
      'Pre-PRD Clarification',
      'For a new PRD, keep the shared understanding map run-local until standard-template scope, acceptance, terminology, actor/flow/state, exception, permission, release, and boundary branches are source-resolved',
      'Implementation-ready or direct route-out paths must state the bypass reason',
      'Rough PRD gap-to-target mapping',
      'Large-input Map-Reduce results must enter final PRD rewrite through the same section-level reducers',
      'large-input-checkpoint.md',
      'Ordinary short PRDs still wait until closure before durable write-in',
      'Never treat lossy chunk summaries as source-of-truth',
      'P0 PRD Quality Packs',
      'Problem / Outcome Framing Gate',
      'Success Metrics / Measurement Readiness',
      'NFR / Constraint Pack',
      'Traceability Matrix',
      'Review / Approval Closure',
      'R -> AE -> evidence/source -> open question',
      'workflow, skill, prompt, CLI, eval, or runtime projection PRDs',
      'generated runtime mirrors untouched',
      'Never fabricate target values',
      'API/database/architecture HOW excluded from PRD requirements',
      'P1 Conditional Enrichment Packs',
      'Stakeholder / Actor Alignment',
      'Design / UX Evidence Hook',
      'design-source-evidence.md',
      'External Evidence Interface',
      'extracted_design_what',
      'affected_PRD_write_targets',
      'provider_untrusted',
      'Prioritization / Release Slice',
      'Change Management',
      'routes consistency audit to `spec-app-consistency-audit`',
      'Context / ADR Notes',
      'When `grill-with-docs-integration.md` is triggered',
      'preview-first promotion candidates only',
      '`not-run` is a run-local decision-card state only',
      'Do not create numeric PRD scorecards, 0-100 quality ratings, or industry hard-threshold rubrics',
      'original -> recommendation -> reason -> write target',
      'optimization suggestions',
      'final rewritten PRD',
      'no standalone quality report artifact',
      '## Feature Slices',
      '"等", "相关", "合适的", "更好", and "优化体验"',
      'implementation units, schemas, exact API fields, database tables, and task breakdown are not',
      'Producer / Artifact / Consumer',
      'New IDs continue from the maximum current number',
      'Project-local IDs such as `US-*`, `FEAT-*`, or `NFR-*`',
      'planning recheck item count',
      'Resolved before planning',
      'Still carried',
      'planning_would_invent_what',
      'uncovered requirements',
      'feature items without acceptance examples',
      'document_role: split-summary',
      'document_role: child-prd',
      'child_id:',
      'parent_spec_id:',
      'source_prd:',
      'split_summary:',
      'checkpoint-prd',
      'not a final PRD',
      'can_enter_spec-plan: no',
      'write_mode',
      'clarification_evidence',
      'preflight_sweep_closure',
      'compatibility field for Requirement Analysis Gate closure',
      'materials to requirement understanding, uncertainty/contradiction points, product/design/technical grill decisions, and PRD write targets',
      'design_source_coverage',
      'first_unclosed_owner_question',
      'why_not',
      'recommended default',
      'Use `accepted-assumption` only when owner accepted it or source evidence proves it safe',
      'PRD-owned owner question must not be marked non-blocking Planning Recheck',
      'design_source_inventory',
      'source_or_node',
      'read_status',
      'PRD write target',
      'readiness consequence',
      'Design-source inventory is mandatory whenever design input exists',
    ]);
    expectContainsAll(featureSlices, [
      'Feature Slices are context and handoff units',
      'not execution units, task packs, program slices, or sub-agent dispatch units',
      'business capability/outcome boundaries rather than code-layer partitions such as Controller/Service/DAO files',
      'feature_id:',
      'title:',
      'summary:',
      'requirement_refs:',
      'acceptance_refs:',
      'source_excerpt_or_claim:',
      'evidence:',
      'candidate_modules_or_source_refs:',
      'risk_signals:',
      'no slice without acceptance refs or an explicit trace gap',
      'candidate modules/source refs are evidence pointers, not scope authority',
      'cross-cutting concerns belong in risk signals',
      '3-7 slices is a common healthy range',
      'more than 10 slices should trigger split recommendation or owner confirmation',
    ]);
    expectContainsAll(closeout, [
      'Every PRD handoff should report',
      'run `skills/spec-prd/scripts/finalize-prd-artifact.js <prd-path> --inputs <input-path>` before confirmed ready closeout',
      'The finalize path seeds deterministic counts and trace facts from `check-prd-artifact.js`',
      'Use `preflight_sweep_closure`',
      'Phase 1 Requirement Analysis Gate closed',
      'not a second PRD artifact topology',
      'Resolved before planning',
      'Still carried',
      'planning_would_invent_what',
      'planning recheck item count',
      'current-state claims without confirmed evidence',
      'When `## Feature Slices` is present',
      'PRD complexity was explicitly evaluated for slice need',
      'feature slice count and feature IDs',
      'feature-to-R/AE trace gaps',
      'cross-cutting risk count',
      'split recommendation / owner confirmation status',
      'program or execution slicing',
    ]);
    expect(template).not.toContain('templates/standard/');
    expect(template).not.toContain('Adaptive Product Expert Lens');
    expect(template).not.toContain('entry, state, copy, empty/error/loading, permissions, i18n, and accessibility');
    expect(template).not.toContain(`quality_${'posture'}`);
    expect(template).not.toContain('program_slice_required');
    expect(template).not.toContain('C1 监管');
    expect(template).not.toContain('securities-pm');
    expect(template).not.toContain('credit-pm');

    expectContainsAll(productLens, [
      'single canonical source',
      'downstream_confirmation_risk -> claim -> evidence/source -> gap',
      'PRD_write_target -> closure_state',
      'not persistent schema',
      'Every gap that enters Requirements Grill must bind to `PRD_write_target`',
      'Risk -> PRD Write Target Map is a mandatory run-local interface',
      'Requirements Grill consumes only `gap + owner_question_or_assumption + PRD_write_target`',
      'Product Judgment Dimensions',
      'user/problem/outcome clarity',
      'current-state and code alignment',
      'this confirms current WHAT and evidence pointers, not HOW to change implementation',
      'requirement quality',
      'acceptance coverage',
      'scope and handoff entropy',
      'Structured Input Synthesis',
      'Demote implementation-heavy or testing-heavy details to assumptions',
      'Do not introduce a named conversion adapter',
      'Design-Source Interface',
      'design-source-evidence.md',
      'source-candidate` / `provider_untrusted`',
      'Outstanding Questions` or `Planning Recheck` is not settled WHAT',
      'attempt one grill question or record why this run cannot clarify it',
      'source/owner-supported settled WHAT does not need to be re-asked',
      'Large-Input Interface',
      'large-input-checkpoint.md',
      'Reduce output -> load_bearing_gap / owner_question_candidate / affected_write_targets',
      'Escalation To Product Reviewer',
      'dispatch_authorization_missing',
      'adversarial product-review posture',
      // U1 (discovery surfacing / S4b + B1):双座位 forcing-function + 多义嗅探。
      // 锁 prose 结构锚点与绑 write target 不变量,不锁语义结果/问题措辞/gap 数量。
      'referent ambiguity',
      'change-verb ambiguity',
      'recall sniff cues, not a per-requirement checklist',
      'the implementer seat',
      'the test-author seat',
      'one concrete gap bound to `PRD_write_target` or an explicit `none-found`',
      'the premature-none-found failure, not a legal outcome',
      'names the specific source / current-state evidence the seat checked',
      'that stays the deferred artifact-truth ceiling, not something this lens gates',
      'not a new dimension list, per-requirement matrix, checklist, persona, or dispatch',
    ]);
    expect(productLens).not.toContain('Adaptive Product Expert Lens');
    expect(productLens).not.toContain('Figma link');
    expect(productLens).not.toContain('PRD/Figma/source');
    expect(template).not.toContain('screenshots, Figma');
    expect(template).not.toContain('PRD/Figma/source consistency remains outside `spec-prd`');
    expect(read(SKILL_PATH)).not.toContain('front-end/UI inputs with Figma links');

    const designSource = read(DESIGN_SOURCE_PATH);
    const checkpoint = read(path.join(SKILL_DIR, 'references', 'large-input-checkpoint.md'));
    expectContainsAll(designSource, [
      'design_source_inventory',
      'design_sources_read',
      'design_sources_unread',
      'source_or_node',
      'read_status',
      'PRD write target',
      'readiness consequence',
      'explicit input refs',
      'Figma-discoverable nodes',
      'design-dependent states referenced by requirements',
      'must block `ready-for-planning`',
      'Degraded design evidence is not silently planning-ready',
      'owner explicitly accepts the degraded risk',
      'owner-accepted degradation is the only ready-for-planning release valve',
    ]);
    expectContainsAll(checkpoint, [
      '`checkpoint-prd` is not a final PRD',
      'can_enter_spec-plan: no',
      'next_owner_question',
      'write_mode=checkpoint-prd',
    ]);
  });

  test('readiness lens uses compound packs instead of long enumerated gate drift', () => {
    const readiness = read(READINESS_PATH);

    expectContainsAll(readiness, [
      'Reuse the existing Requirements Readiness Gate by reference',
      'Clarity & Non-ambiguity',
      'Evidence & Inference provenance',
      'Traceability & Coverage',
      'Testability',
      'Boundary integrity',
      'Planning-invention & Handoff readiness',
      'Run checks by pack',
      'Core Pack',
      'Quality Diagnosis Pack',
      'Feature Slice Pack',
      'Topology Pack',
      'Domain And Decision Pack',
      'Metrics And Overlay Pack',
      '`current-state provenance`',
      '`planning recheck visibility`',
      'source-candidate, local pattern, code-index pointer',
      '`change delta and boundary clarity`',
      '`planning-invention and trace risk`',
      '`pre-prd clarification closure`',
      '`requirement-analysis-gate closure`',
      'Requirement Analysis Gate must have closed or visibly carried the requirement understanding map',
      'Source Authority Order',
      'Module Map',
      'Open Decisions',
      'Design Coverage',
      'API Coverage',
      '`wording and testability`',
      'INVEST, EARS, and Gherkin-style wording are optional clarity anchors, not scoring rubrics',
      '`interaction and exception readiness`',
      '`product expert lens fit`',
      '`canonical lens reuse`',
      '`preliminary-vs-final diagnosis`',
      "uses `product-expert-lens.md`'s Product Expert Lens as the quality-dimension source",
      '`optimization suggestion closure`',
      '`rewrite integrity`',
      'P0 Quality Floor Pack',
      '`problem-outcome closure`',
      '`metrics readiness`',
      '`nfr-constraint closure`',
      '`workflow-skill-runtime quality closure`',
      'Workflow / Skill / Runtime Quality Signals',
      'generated runtime mirrors untouched',
      '`traceability closure`',
      '`owner approval closure`',
      '`Resolved before planning`',
      '`Still carried`',
      '`readiness_outcome`',
      '`slice identity and trace`',
      'visible mapping to Change Delta or core requirements',
      '`business capability boundary`',
      'Controller/Service/DAO files',
      '`source excerpt preservation`',
      '`cross-cutting risk visibility`',
      '`program-slice boundary`',
      'program/execution slices',
      '`topology and surface fit`',
      '`producer-consumer and source-of-truth closure`',
      '`negative-space coverage`',
      '`framing-evidence alignment`',
      '`terminology and contradiction handling`',
      '`owner-question discipline`',
      'every owner question closes or narrows a named gap with a PRD write target',
      '`domain-grill and decision-note adequacy`',
      '`deep requirements grill closure`',
      'each reach a legal stop point in SKILL.md `Canonical: 四个合法停点`',
      '`context/adr topology adapter boundary`',
      '`context/adr artifact mode boundary`',
      'P1 Conditional Pack',
      '`stakeholder-actor closure`',
      '`design-evidence closure`',
      '`design-source-evidence.md`',
      'External Evidence Interface',
      'not a copied design WHAT extraction list',
      '`release-slice closure`',
      '`change-management closure`',
      '`goal-measurability`',
      '`internal-tool quality signals`',
      'internal workflow/skill/runtime quality signals',
      '`project-local overlay check`',
      'Frontmatter `status` is machine-owned once a PRD artifact exists',
      '`question`, `recommended_answer`, `source_tag`, `chosen_answer`, `consequence`, and `deferred_reason`',
      'readiness must not require `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/` in normal PRD mode',
      'Implementation-ready or direct route-out is a route-out/bypass exception',
      'check-prd-artifact.js',
      'spec-prd-artifact-check.v1',
      'script-owned facts',
      'handoff entropy check',
      'open load-bearing WHAT gap',
      '`write_mode`',
      '`clarification_evidence`',
      'write_mode=ask-owner-first',
      'write_mode=checkpoint-prd',
      'clarification_evidence=skipped',
      'Outstanding Questions or Planning Recheck',
      'clarification did not happen',
      'PRD-owned owner question',
      'blocks planning? no',
      'Figma/design-source',
      'page structure, state, interaction, acceptance, or scope',
      'headless-degraded-logged',
      'source-proven-no-ask',
      'clarification_evidence_undeclared',
      'write_mode_undeclared',
      'can_enter_spec_plan_undeclared',
      'design_source_inventory_undeclared',
      'design_source_coverage_undeclared',
      'set `write_mode=checkpoint-prd` when preserving recoverable PRD context is necessary while keeping `readiness_outcome=revise-prd` or `readiness_outcome=ask-owner`',
      'degrades readiness to `revise-prd`, `ask-owner`, or `route-out`',
      'must not return `ready-for-planning`',
      'unresolved framing risks',
      'do not introduce a second evidence enum',
      'ready-for-planning',
      'doc-review',
      'check-glossary-drift.js',
      'avoid_term_used',
    ]);
    expect(readiness).not.toContain('Always Gate');
    expect(readiness).not.toContain('Adaptive Product Expert Lens');
    expect(readiness).not.toContain('degrade to `revise-prd`, `ask-owner`, `checkpoint-prd`, or `route-out`');
    expect(readiness).not.toContain('entry, state, copy, empty/error/loading, permissions, i18n, and accessibility');
    expect(readiness).not.toContain('`current-state accuracy`');
  });

  test('human template mirror points to the embedded runtime skeleton instead of a second template tree', () => {
    const templateIndex = read(HUMAN_TEMPLATE_INDEX_PATH);
    const humanCore = read(HUMAN_TEMPLATE_CORE_PATH);
    const runtimeTemplate = read(OUTPUT_TEMPLATE_PATH);

    expect(templateIndex).toContain('human-facing 标准模板库');
    expect(templateIndex).toContain('skills/spec-prd/references/prd-output-template.md');
    expect(templateIndex).toContain('embedded runtime skeleton');
    expect(templateIndex).toContain('不作为 packaged runtime 的必需读取路径');
    expect(templateIndex).not.toContain('skills/spec-prd/templates/standard/');
    for (const section of [
      'Summary',
      'Change Delta',
      'Requirements',
      'Acceptance Examples',
      'Scope Boundaries',
      'Evidence And Assumptions',
    ]) {
      expect(humanCore).toContain(section);
      expect(runtimeTemplate).toContain(section);
    }
    for (const surface of ['App', 'Admin', 'Backend', 'H5/PC', 'CLI/DevTool', 'Mixed']) {
      expect(runtimeTemplate).toContain(surface);
    }
    // 人类镜像的证据 tag 词表必须与 runtime 脚本枚举(check-prd-artifact.js EVIDENCE_TAGS)一致,
    // 且不得保留已废弃的 stale provider pointer。仅守 evidence-tag 词表,
    // 不约束 README 声明的证券行业列/C1-C12 清单等项目本地 overlay。
    for (const tag of ['confirmed-source', 'user-stated', 'source-candidate', 'external-research', 'assumption']) {
      expect(humanCore).toContain(tag);
    }
    expect(humanCore).not.toContain([['git', 'nexus'].join(''), 'pointer'].join('-'));
  });

  test('routing and downstream plan intake know prd-requirements boundaries', () => {
    const usingSpecFirst = read(USING_SPEC_FIRST_PATH);
    const specPlan = `${read(SPEC_PLAN_PATH)}\n${read(SPEC_PLAN_PLANNING_FLOW_PATH)}`;

    expectContainsAll(usingSpecFirst, [
      'brownfield PRD authoring, existing PRD refinement, or code-aware PRD validation',
      'PRD/readiness tie-break',
      'can this PRD go to planning without inventing WHAT?',
      '/spec:prd',
      '$spec-prd',
      '0-1 product idea',
      'spec-app-consistency-audit',
    ]);
    expectContainsAll(specPlan, [
      '`artifact_kind: prd-requirements`',
      'PRD-grade requirements origin',
      'inherit the existing `spec_id`',
      'R/F/AE',
      'Scope Boundaries',
      'Evidence And Assumptions',
      'trace self-check summary',
      '`US-*` / `FEAT-*` / `NFR-*`',
      '`## Feature Slices`',
      'preserve feature IDs',
      'requirement refs',
      'acceptance refs',
      'source/evidence pointers',
      'PRD-origin trace, not a new planning-owned artifact class',
      'missing slice acceptance',
      'missing slice source',
      'missing slice scope',
      'do not copy the full `spec-prd` readiness lens or Feature Slice Pack',
      'do not generate program slices or task packs during planning',
      '`document_role: split-summary`',
      '`document_role: child-prd`',
      'child_id',
      'parent_spec_id',
    ]);
  });

  test('eval fixtures cover routing, evidence, readiness, and helper boundary cases', () => {
    const examples = readJson(EVALS_PATH);
    const serialized = JSON.stringify(examples);

    expect(examples.schema_version).toBe('spec-prd-evals.v1');
    expect(examples.case_contract).toMatchObject({
      schema_version: 'spec-prd-eval-case-contract.v1',
      boundary: expect.stringContaining('deterministic coverage evidence only'),
    });
    expect(examples.case_contract.case_types).toEqual(expect.arrayContaining([
      'positive',
      'boundary',
      'route-out',
      'failure',
      'adversarial',
      'source-candidate',
    ]));
    expect(examples.cases.length).toBeGreaterThanOrEqual(70);
    expectEvalCaseStructure(examples);
    expectCoverageTags(examples, [
      'trigger',
      'boundary',
      'expected',
      'failure',
      'pre-prd-clarification',
      'source-first',
      'large-input',
      'map-reduce',
      'deep-requirements-grill',
      'grill-with-docs',
      'p0-pack',
      'p1-pack',
      'topology-adapter',
      'readiness',
      'progressive-detail',
      'workflow-runtime-quality',
      'product-judgment',
      'design-source',
      'checkpoint-resume',
      'source-candidate-recheck',
      'owner-question-avoidance',
      'direct-route-out',
      'no-fixed-cap',
      'requirement-analysis-gate',
    ]);
    expectQualityBuckets(examples, [
      'brownfield-create',
      'refine',
      'validate',
      'route-out',
      'wrong-stage',
      'source-candidate',
      'prompt-injection',
      'oversized-split',
      'glossary-advisory',
      'readiness-fail',
      'failure',
      'adversarial',
    ]);
    expectEvalCase(examples, 'quality-diagnosis-canonical-name', {
      tags: ['trigger', 'boundary'],
      expected: [
        'quality_diagnosis as the single emitted diagnosis field',
        'not-run only in run-local decision card',
        'no competing diagnosis field',
      ],
    });
    expectEvalCase(examples, 'product-expert-lens-risk-ranked-gaps', {
      tags: ['product-judgment', 'source-first'],
      expected: [
        'Product Expert Lens',
        'downstream_confirmation_risk',
        'PRD_write_target',
      ],
    });
    expect(examples.case_contract.sentinel_cases).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'product-judgment-naming-only-rejected',
        requires: expect.objectContaining({
          case_type: 'failure',
          expected: expect.arrayContaining([
            'risk-ranked gap plus PRD write target required',
            'inline critique names product risk and affected PRD write target',
          ]),
          must_not: expect.arrayContaining([
            'must not pass by only renaming the lens without risk-ranked product judgment',
          ]),
        }),
      }),
      expect.objectContaining({
        id: 'clarification-skipped-structured-input-rejected',
        requires: expect.objectContaining({
          case_type: 'failure',
          quality_buckets: expect.arrayContaining(['failure', 'readiness-fail']),
          coverage_tags: expect.arrayContaining(['readiness']),
          expected: expect.arrayContaining([
            'write_mode must be ask-owner-first or checkpoint-prd before final PRD write',
            'clarification_evidence must be declared',
          ]),
          must_not: expect.arrayContaining([
            'must not return ready-for-planning with zero owner interaction and unresolved Outstanding',
          ]),
        }),
      }),
      expect.objectContaining({
        id: 'headless-degraded-abuse-rejected',
        requires: expect.objectContaining({
          case_type: 'failure',
          quality_buckets: expect.arrayContaining(['failure', 'readiness-fail']),
          coverage_tags: expect.arrayContaining(['readiness']),
          expected: expect.arrayContaining([
            'chat-fallback required when chat can wait',
          ]),
          must_not: expect.arrayContaining([
            'must not claim true-headless-unavailable when chat fallback is possible',
          ]),
        }),
      }),
      expect.objectContaining({
        id: 'large-input-ask-owner-priority',
        requires: expect.objectContaining({
          case_type: 'boundary',
          quality_buckets: expect.arrayContaining(['refine']),
          coverage_tags: expect.arrayContaining(['readiness', 'boundary']),
          expected: expect.arrayContaining([
            'ask-owner-first means keep grilling the highest-risk branch, not ask one question then stop',
          ]),
          must_not: expect.arrayContaining([
            'must not jump to checkpoint-prd merely because input is large',
          ]),
        }),
      }),
      expect.objectContaining({
        id: 'prd-owned-question-nonblocking-ready-rejected',
        requires: expect.objectContaining({
          case_type: 'failure',
          quality_buckets: expect.arrayContaining(['failure', 'readiness-fail']),
          coverage_tags: expect.arrayContaining(['readiness', 'owner-question-avoidance']),
          expected: expect.arrayContaining([
            'PRD-owned owner questions must be grilled or block readiness',
          ]),
          must_not: expect.arrayContaining([
            'must not mark ready-for-planning when unresolved owner questions can change WHAT, acceptance, data authority, interface availability, fallback display, analytics acceptance, or source-of-truth',
          ]),
        }),
      }),
      expect.objectContaining({
        id: 'figma-unread-prd-ready-rejected',
        requires: expect.objectContaining({
          case_type: 'failure',
          quality_buckets: expect.arrayContaining(['failure', 'readiness-fail']),
          coverage_tags: expect.arrayContaining(['readiness', 'owner-question-avoidance']),
          expected: expect.arrayContaining([
            'Figma/design-source nodes affecting UI structure, state, interaction, acceptance, or scope must be read during PRD output or block readiness',
          ]),
          must_not: expect.arrayContaining([
            'must not mark ready-for-planning when unread Figma/design nodes can change WHAT or acceptance',
          ]),
        }),
      }),
      expect.objectContaining({
        id: 'core-declarations-omitted-ready-rejected',
        requires: expect.objectContaining({
          case_type: 'failure',
          quality_buckets: expect.arrayContaining(['failure', 'readiness-fail']),
          coverage_tags: expect.arrayContaining(['readiness', 'owner-question-avoidance']),
          expected: expect.arrayContaining([
            'core readiness declarations are required for PRD artifacts or ready-for-planning outputs',
          ]),
          must_not: expect.arrayContaining([
            'must not avoid checker findings by omitting Outstanding Questions and Planning Recheck',
          ]),
        }),
      }),
      expect.objectContaining({
        id: 'figma-omitted-from-coverage-ready-rejected',
        requires: expect.objectContaining({
          case_type: 'failure',
          quality_buckets: expect.arrayContaining(['failure', 'readiness-fail']),
          coverage_tags: expect.arrayContaining(['readiness', 'owner-question-avoidance']),
          expected: expect.arrayContaining([
            'design_source_inventory must include explicit input refs, Figma-discoverable nodes, and design-dependent states referenced by requirements',
          ]),
          must_not: expect.arrayContaining([
            'must not mark ready-for-planning when unread design nodes are omitted from design_source_coverage',
          ]),
        }),
      }),
      expect.objectContaining({
        id: 'preflight-grill-design-gate-ready-rejected',
        requires: expect.objectContaining({
          case_type: 'failure',
          quality_buckets: expect.arrayContaining(['failure', 'readiness-fail']),
          coverage_tags: expect.arrayContaining(['readiness', 'design-source', 'preflight']),
          expected: expect.arrayContaining([
            'checker findings clarification_trace_absent, design_source_unaccounted, input_scan_degraded, prd_readiness_declarations_evaded, preflight_sweep_closure_absent, and preflight_sweep_closure_blocked must be consumed by readiness',
          ]),
          must_not: expect.arrayContaining([
            'must not mark ready-for-planning after reading inputs directly into final-prd without non-skipped clarification evidence, input scan coverage, and preflight closure',
          ]),
        }),
      }),
      expect.objectContaining({
        id: 'analysis-gate-skipped-final-prd-rejected',
        requires: expect.objectContaining({
          case_type: 'failure',
          quality_buckets: expect.arrayContaining(['failure', 'readiness-fail']),
          coverage_tags: expect.arrayContaining(['readiness', 'requirement-analysis-gate']),
          expected: expect.arrayContaining([
            'Requirement Analysis Gate map is required before final-prd or ready-for-planning',
            'must identify uncertainty/contradiction points and product/design/technical grill decisions before PRD draft',
          ]),
          must_not: expect.arrayContaining([
            'must not read materials directly into a final PRD without the requirement understanding map and grill decision',
          ]),
        }),
      }),
    ]));
    expect(findEvalCase(examples, 'product-judgment-naming-only-rejected')).toMatchObject({
      case_type: 'failure',
      coverage_tags: expect.arrayContaining(['product-judgment']),
      must_not: expect.arrayContaining(['must not pass by only renaming the lens without risk-ranked product judgment']),
    });
    expectEvalCase(examples, 'clarification-skipped-structured-input-rejected', {
      tags: ['readiness'],
      expected: [
        'write_mode must be ask-owner-first or checkpoint-prd before final PRD write',
        'clarification_evidence must be declared',
        'skipped or missing with Outstanding/Planning Recheck blocks ready-for-planning',
      ],
    });
    expect(findEvalCase(examples, 'clarification-skipped-structured-input-rejected')).toMatchObject({
      case_type: 'failure',
      quality_buckets: expect.arrayContaining(['failure', 'readiness-fail']),
      must_not: expect.arrayContaining(['must not treat checkpoint-prd as final-prd']),
    });
    expectEvalCase(examples, 'headless-degraded-abuse-rejected', {
      tags: ['readiness'],
      expected: [
        'chat-fallback required when chat can wait',
        'must declare question_delivery=chat-fallback not true-headless-unavailable',
      ],
    });
    expectEvalCase(examples, 'large-input-ask-owner-priority', {
      tags: ['readiness', 'boundary'],
      expected: [
        'ask-owner-first means keep grilling the highest-risk branch, not ask one question then stop',
      ],
    });
    expectEvalCase(examples, 'prd-owned-question-nonblocking-ready-rejected', {
      tags: ['readiness', 'owner-question-avoidance'],
      expected: [
        'PRD-owned owner questions must be grilled or block readiness',
        'Planning Recheck only carries HOW or integration recheck after product default and acceptance are closed',
      ],
    });
    // U6 (R19 / O7):eval 取向对称三类 case。断言 case id 存在 + coverage_tags,
    // 不断言 reason_code——examples.json 是 examples-as-context、语义 eval,reason_code
    // 精确断言归确定性测试层(spec-prd-finalize.test.js 的 U7 freeze)。
    expectEvalCase(examples, 'how-pushdown-backdoor-touches-what-rejected', {
      tags: ['readiness', 'owner-question-avoidance', 'how-pushdown'],
      expected: [
        'implementation-only-how-pushdown is illegal for a question whose own text is about WHAT-bearing surface',
        'the honest fix is to switch to a source-resolved/owner-answered disposition with evidence, or stop as checkpoint-prd',
      ],
    });
    expect(findEvalCase(examples, 'how-pushdown-backdoor-touches-what-rejected')).toMatchObject({
      case_type: 'failure',
      quality_buckets: expect.arrayContaining(['failure', 'readiness-fail']),
    });
    expectEvalCase(examples, 'nonblocking-oq-with-legal-disposition-ready-accepted', {
      tags: ['readiness', 'legal-disposition', 'anti-over-blocking'],
      expected: [
        'a non-blocking OQ closed by a legal disposition plus evidence is a valid ready state, not a gate-gaming escape',
        'this case shows what legitimate non-blocking ready looks like so the model neither over-blocks nor waters down',
      ],
    });
    expect(findEvalCase(examples, 'nonblocking-oq-with-legal-disposition-ready-accepted')).toMatchObject({
      case_type: 'positive',
      quality_buckets: ['validate'],
    });
    expectEvalCase(examples, 'source-resolvable-gap-escalated-to-owner-rejected', {
      tags: ['readiness', 'anti-over-blocking', 'source-first'],
      expected: [
        'source-resolvable gaps must be closed source-first before any owner interaction',
      ],
    });
    expect(findEvalCase(examples, 'source-resolvable-gap-escalated-to-owner-rejected')).toMatchObject({
      case_type: 'failure',
      must_not: expect.arrayContaining([
        'must not treat over-blocking or owner-spamming as the safe default just because under-asking failed in 19:07',
      ]),
    });
    expectEvalCase(examples, 'figma-unread-prd-ready-rejected', {
      tags: ['readiness', 'owner-question-avoidance'],
      expected: [
        'Figma/design-source nodes affecting UI structure, state, interaction, acceptance, or scope must be read during PRD output or block readiness',
        'unread design nodes must map to PRD write targets with source/node id, unread reason, evidence level, and readiness consequence',
      ],
    });
    expectEvalCase(examples, 'core-declarations-omitted-ready-rejected', {
      tags: ['readiness', 'owner-question-avoidance'],
      expected: [
        'core readiness declarations are required for PRD artifacts or ready-for-planning outputs',
        'checker reports missing declaration findings even when Outstanding/Planning Recheck sections are absent',
      ],
    });
    expectEvalCase(examples, 'figma-omitted-from-coverage-ready-rejected', {
      tags: ['readiness', 'owner-question-avoidance'],
      expected: [
        'design_source_inventory must include explicit input refs, Figma-discoverable nodes, and design-dependent states referenced by requirements',
        'unread design nodes omitted from coverage block readiness',
      ],
    });
    expectEvalCase(examples, 'preflight-grill-design-gate-ready-rejected', {
      tags: ['readiness', 'design-source', 'preflight'],
      expected: [
        'checker findings clarification_trace_absent, design_source_unaccounted, input_scan_degraded, prd_readiness_declarations_evaded, preflight_sweep_closure_absent, and preflight_sweep_closure_blocked must be consumed by readiness',
        'preflight_sweep_closure missing or blocked prevents ready-for-planning',
      ],
    });
    expectEvalCase(examples, 'analysis-gate-skipped-final-prd-rejected', {
      tags: ['readiness', 'requirement-analysis-gate'],
      expected: [
        'Requirement Analysis Gate map is required before final-prd or ready-for-planning',
        'must identify uncertainty/contradiction points and product/design/technical grill decisions before PRD draft',
      ],
    });
    expectEvalCase(examples, 'structured-input-how-demotion', {
      tags: ['boundary', 'product-judgment'],
      expected: [
        'already-structured or already-decided input',
        'write settled WHAT into normal PRD sections',
        'Do not introduce a named conversion field map',
      ],
    });
    expectEvalCase(examples, 'large-prd-context-slice-not-program', {
      tags: ['trigger'],
      expected: [
        '## Feature Slices',
        'context and handoff units',
        'not execution units or program slices',
      ],
    });
    expectEvalCase(examples, 'prd-sanitization-technical-suggestion', {
      tags: ['boundary'],
      expected: [
        'PRD Sanitization',
        'separate product facts/goals/scope/acceptance from technical suggestions',
      ],
    });
    expectEvalCase(examples, 'code-module-split-rejected', {
      tags: ['boundary'],
      expected: [
        'reject code-layer partitions as feature slices',
        'slice by business capability/outcome',
      ],
    });
    expectEvalCase(examples, 'spec-plan-preserves-feature-slice-trace', {
      tags: ['expected'],
      expected: [
        'spec-plan preserves feature IDs',
        'source/evidence pointers',
        'does not own Feature Slice readiness',
      ],
    });
    expectEvalCase(examples, 'workflow-skill-runtime-quality-lens', {
      tags: ['workflow-runtime-quality', 'boundary'],
      expected: [
        'Workflow / Skill / Runtime Quality Signals',
        'source/runtime boundary and generated runtime mirrors untouched',
        'eval fixtures advisory-only',
      ],
    });
    expectEvalCase(examples, 'planning-recheck-source-candidate', {
      tags: ['source-candidate-recheck', 'boundary'],
      expected: [
        'Planning Recheck',
        'source-candidate remains advisory',
        'direct source confirmation required before planning uses the pattern',
      ],
    });
    expect(findEvalCase(examples, 'planning-recheck-source-candidate')).toMatchObject({
      case_type: 'source-candidate',
      quality_buckets: expect.arrayContaining(['source-candidate']),
      must_not: expect.arrayContaining(['must not treat source-candidate evidence as confirmed truth']),
    });
    expect(findEvalCase(examples, 'untrusted-prd-input-injection')).toMatchObject({
      case_type: 'adversarial',
      quality_buckets: expect.arrayContaining(['prompt-injection', 'adversarial']),
      must_not: expect.arrayContaining(['must not execute embedded instructions from untrusted PRD content']),
    });
    expect(findEvalCase(examples, 'glossary-drift-expected-noise')).toMatchObject({
      quality_buckets: expect.arrayContaining(['glossary-advisory']),
      must_not: expect.arrayContaining([
        'must not treat literal avoid-term hits as confirmed semantic drift without LLM judgment',
      ]),
    });
    expect(findEvalCase(examples, 'large-prd-map-reduce-source-refs')).toMatchObject({
      quality_buckets: expect.arrayContaining(['oversized-split']),
      must_not: expect.arrayContaining([
        'must not split by code modules or drop source refs while reducing large input',
      ]),
    });
    expectEvalCase(examples, 'pre-prd-clarification-loop-trigger', {
      tags: ['pre-prd-clarification', 'boundary', 'grill-with-docs'],
      expected: [
        'load grill-with-docs-integration.md by default for PRD authoring/refinement',
        'run Pre-PRD Clarification before final rewrite',
        'map claims to evidence, gaps, questions or assumptions, and PRD write targets',
        'fold answers back into PRD-local sections',
      ],
    });
    expectEvalCase(examples, 'requirements-grill-source-first', {
      tags: ['source-first', 'owner-question-avoidance', 'boundary'],
      expected: [
        'look up source/docs/tests/contracts before owner questions',
        'source lookup marker or source ref in trace',
        'source-resolved gaps should not become owner questions',
      ],
    });
    expectEvalCase(examples, 'implementation-ready-direct-route-out', {
      tags: ['direct-route-out', 'boundary'],
      expected: [
        'direct route-out to spec-work or debug',
        'explicit route-out reason',
        'no PRD ceremony',
      ],
    });
    expectEvalCase(examples, 'grill-with-docs-context-inline', {
      tags: ['grill-with-docs', 'boundary'],
      expected: [
        'load grill-with-docs-integration.md',
        'ask one question at a time and wait for feedback',
        'create or update CONTEXT.md lazily when the first project-specific term is resolved',
      ],
    });
    expectEvalCase(examples, 'requirements-grill-no-fixed-cap', {
      tags: ['failure', 'no-fixed-cap'],
      expected: [
        'no fixed owner-question count as the stop condition',
        'continue one-question-at-a-time relentlessly by default, walking down each branch',
        'a branch stops only at a Canonical stop point (leaf, source-resolved, owner-capped, how-pushdown)',
        'not ready-for-planning until every load-bearing branch reaches a Canonical stop point',
      ],
    });
    expectEvalCase(examples, 'requirements-grill-context-artifact-triggered', {
      tags: ['boundary', 'grill-with-docs'],
      expected: [
        'load grill-with-docs-integration.md',
        'persist resolution in PRD-local sections',
        'update CONTEXT.md inline for resolved project-specific terms',
      ],
    });
    expectEvalCase(examples, 'large-prd-map-reduce-source-refs', {
      tags: ['large-input', 'map-reduce'],
      expected: [
        'preserve source_ref through Map and Reduce',
        'surface cross-chunk conflicts',
        'do not treat lossy summaries as source-of-truth',
      ],
    });
    expectEvalCase(examples, 'large-input-checkpoint-resume', {
      tags: ['large-input', 'checkpoint-resume'],
      expected: [
        'reduced candidates feed Product Expert Lens',
        'PRD sections act as checkpoints',
        'source_ref degraded re-reduce fallback',
      ],
    });
    expectEvalCase(examples, 'design-source-figma-degraded', {
      tags: ['design-source', 'boundary'],
      expected: [
        'URL parse -> tool discovery -> auth/access probe',
        'source-candidate / provider_untrusted',
        'Planning Recheck',
      ],
    });
    expect(findEvalCase(examples, 'design-source-figma-degraded')).toMatchObject({
      must_not: expect.arrayContaining([
        'must not install MCP/plugins from spec-prd',
        'must not claim design facts are confirmed scope without source or owner reconciliation',
      ]),
    });
    expect(read(DESIGN_SOURCE_PATH)).toContain('do not install MCP/plugins from `spec-prd`');
    expectEvalCase(examples, 'huge-prd-cross-chunk-conflict', {
      tags: ['failure', 'map-reduce'],
      expected: [
        'group conflicting chunks by exception, release, and PRD section',
        'preserve conflicting supporting_refs',
        'route unresolved conflict to owner question or blocker',
      ],
    });
    expectEvalCase(examples, 'deep-grill-seven-actions', {
      tags: ['deep-requirements-grill'],
      expected: [
        'ask one question at a time',
        'perform source-first lookup',
        'surface code contradictions with consequences',
      ],
    });
    expectEvalCase(examples, 'deep-grill-closure-blocks-readiness', {
      tags: ['failure', 'readiness'],
      expected: [
        'load-bearing grill questions must close before planning',
        'unresolved questions block ready-for-planning',
      ],
    });
    expectEvalCase(examples, 'success-metrics-no-invention', {
      tags: ['p0-pack', 'boundary'],
      expected: [
        'write observable signals, assumptions, or Outstanding Questions',
        'do not invent target values',
      ],
    });
    expectEvalCase(examples, 'internal-tool-success-metrics-signals', {
      tags: ['p0-pack', 'workflow-runtime-quality'],
      expected: [
        'Goals / Success Metrics',
        'observable signals for hot-path load, output-drift cases, contract anchors, runtime projection checks, advisory fixture coverage, and fresh-source eval status',
        'no invented target values',
      ],
    });
    expectEvalCase(examples, 'readiness-outcome-draft-status', {
      tags: ['readiness', 'boundary'],
      expected: [
        'frontmatter status is document lifecycle posture',
        'readiness_outcome: ready-for-planning',
        'draft does not by itself block planning',
      ],
    });
    expectEvalCase(examples, 'nfr-constraint-product-not-how', {
      tags: ['p0-pack', 'boundary'],
      expected: [
        'keep constraints product-level',
        'exclude API/database/architecture HOW from PRD requirements',
      ],
    });
    expectEvalCase(examples, 'owner-closure-summary', {
      tags: ['p0-pack', 'closure'],
      expected: [
        'summarize owner answers, accepted assumptions, and blockers',
        'do not create a separate approval artifact',
      ],
    });
    expectEvalCase(examples, 'actor-alignment-conditional', {
      tags: ['p1-pack'],
      expected: [
        'separate beneficiary, operator, admin, downstream consumer, and owner',
        'run only when actor distinctions affect WHAT or acceptance',
      ],
    });
    expectEvalCase(examples, 'context-map-routing', {
      tags: ['topology-adapter'],
      expected: [
        'read existing CONTEXT-MAP.md as advisory routing evidence',
        'ask at most one context routing question when ownership is ambiguous',
        'do not require topology creation',
      ],
    });
    expectEvalCase(examples, 'context-glossary-conflict', {
      tags: ['topology-adapter'],
      expected: [
        'surface glossary conflict',
        'resolve in PRD-local Glossary or Decision Notes first',
      ],
    });
    expectEvalCase(examples, 'adr-promotion-three-conditions', {
      tags: ['topology-adapter'],
      expected: [
        'suggest ADR promotion only for hard-to-reverse, surprising tradeoffs',
        'routine decisions stay in Decision Notes',
      ],
    });
    expect(serialized).not.toContain(`quality_${'posture'}`);
    expect(serialized).not.toContain('executed eval runner');
    expect(examples.source_refs).toEqual([
      'skills/spec-prd/SKILL.md',
      'skills/spec-prd/references/evidence-and-topology.md',
      'skills/spec-prd/references/domain-language-and-decision-ledger.md',
      'skills/spec-prd/references/grill-with-docs-integration.md',
      'skills/spec-prd/references/product-expert-lens.md',
      'skills/spec-prd/references/design-source-evidence.md',
      'skills/spec-prd/references/large-input-checkpoint.md',
      'skills/spec-prd/references/prd-output-template.md',
      'skills/spec-prd/references/prd-readiness-lens.md',
    ]);
  });

  test('retired fixed owner-question-count anchors do not return to active spec-prd surfaces', () => {
    const activeSurface = readActiveSpecPrdSurface();
    const examples = readJson(EVALS_PATH);
    const retiredPhrases = [
      `${1}-${3}`,
      ['more', 'than', '3'].join(' '),
      ['question', 'cap'].join(' '),
      ['normal', 'cap'].join(' '),
      ['over', 'cap'].join('-'),
      ['owner_question', 'count'].join('_'),
      ['超过', '3'].join(' '),
    ];
    const retiredEvalId = ['requirements-grill-question', 'cap'].join('-');

    for (const phrase of retiredPhrases) {
      expect(activeSurface).not.toContain(phrase);
    }
    expect(examples.cases.map((entry) => entry.id)).not.toContain(retiredEvalId);
  });

  test('eval runner reports deterministic fixture contract facts', () => {
    const passed = JSON.parse(execFileSync('node', [EVAL_RUNNER_PATH, '--json'], { encoding: 'utf8' }));

    expect(passed).toMatchObject({
      schema_version: 'spec-prd-eval-run.v1',
      status: 'passed',
      reason_code: 'eval_fixture_passed',
      case_count: expect.any(Number),
      missing_required_buckets: [],
    });
    expect(passed.coverage).toMatchObject({
      'brownfield-create': expect.any(Number),
      refine: expect.any(Number),
      validate: expect.any(Number),
      'prompt-injection': expect.any(Number),
      'glossary-advisory': expect.any(Number),
    });
    expect(passed.case_types).toMatchObject({
      positive: expect.any(Number),
      boundary: expect.any(Number),
      failure: expect.any(Number),
      adversarial: expect.any(Number),
    });

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-prd-eval-runner-'));
    try {
      const fixture = readJson(EVALS_PATH);
      const missingPromptInjection = {
        ...fixture,
        cases: fixture.cases.filter((entry) => (
          !(entry.quality_buckets || []).includes('prompt-injection')
        )),
      };
      const missingBucketPath = path.join(tmpDir, 'missing-bucket.json');
      fs.writeFileSync(missingBucketPath, `${JSON.stringify(missingPromptInjection, null, 2)}\n`, 'utf8');

      let missingBucketError = null;
      try {
        execFileSync('node', [EVAL_RUNNER_PATH, '--fixture', missingBucketPath, '--json'], {
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (err) {
        missingBucketError = err;
      }
      expect(missingBucketError).not.toBeNull();
      expect(missingBucketError.status).toBe(1);
      const failed = JSON.parse(String(missingBucketError.stdout));
      expect(failed).toMatchObject({
        status: 'failed',
        reason_code: 'fixture_contract_failed',
        missing_required_buckets: expect.arrayContaining(['prompt-injection']),
      });
      expect(failed.invalid_cases).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'required_quality_bucket_missing' }),
      ]));

      const missingSentinelRequirement = {
        ...fixture,
        cases: fixture.cases.map((entry) => {
          if (entry.id !== 'product-judgment-naming-only-rejected') return entry;
          return {
            ...entry,
            expected: entry.expected.filter((snippet) => snippet !== 'risk-ranked gap plus PRD write target required'),
          };
        }),
      };
      const missingSentinelPath = path.join(tmpDir, 'missing-sentinel.json');
      fs.writeFileSync(missingSentinelPath, `${JSON.stringify(missingSentinelRequirement, null, 2)}\n`, 'utf8');

      let missingSentinelError = null;
      try {
        execFileSync('node', [EVAL_RUNNER_PATH, '--fixture', missingSentinelPath, '--json'], {
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (err) {
        missingSentinelError = err;
      }
      expect(missingSentinelError).not.toBeNull();
      expect(missingSentinelError.status).toBe(1);
      const sentinelFailed = JSON.parse(String(missingSentinelError.stdout));
      expect(sentinelFailed.invalid_cases).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'product-judgment-naming-only-rejected',
          reason_code: 'sentinel_case_requirement_missing',
          field: 'expected',
        }),
      ]));

      const badJsonPath = path.join(tmpDir, 'bad.json');
      fs.writeFileSync(badJsonPath, '{ bad json', 'utf8');
      let badJsonError = null;
      try {
        execFileSync('node', [EVAL_RUNNER_PATH, '--fixture', badJsonPath, '--json'], {
          encoding: 'utf8',
          stdio: 'pipe',
        });
      } catch (err) {
        badJsonError = err;
      }
      expect(badJsonError).not.toBeNull();
      expect(badJsonError.status).toBe(2);
      expect(JSON.parse(String(badJsonError.stdout))).toMatchObject({
        status: 'error',
        reason_code: 'fixture_json_invalid',
      });

      let unknownArgError = null;
      try {
        execFileSync('node', [EVAL_RUNNER_PATH, '--unknown'], { encoding: 'utf8', stdio: 'pipe' });
      } catch (err) {
        unknownArgError = err;
      }
      expect(unknownArgError).not.toBeNull();
      expect(unknownArgError.status).toBe(2);
      expect(String(unknownArgError.stderr)).toContain('reason_code=bad_arguments');
      expect(String(unknownArgError.stderr)).toContain('unknown argument: --unknown');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('domain-grill fresh-source eval artifact records an executed dispatched eval for cached-skill risk', () => {
    const artifact = read(FRESH_SOURCE_EVAL_DOMAIN_GRILL_PATH);

    expectContainsAll(artifact, [
      'fresh_source_eval:',
      'status: passed',
      'skills/spec-prd/SKILL.md',
      'skills/spec-prd/references/domain-language-and-decision-ledger.md',
      'skills/spec-prd/references/prd-readiness-lens.md',
      'skills/spec-plan/SKILL.md',
      'runtime_paths_checked: []',
      'dispatched read-only',
      'Run Provenance',
    ]);
    expect(artifact).not.toContain('status: not_run');
  });

  test('simplicity refactor eval artifact records not-run dispatch boundary without claiming pass', () => {
    const artifact = read(FRESH_SOURCE_EVAL_SIMPLICITY_PATH);

    expectContainsAll(artifact, [
      'fresh_source_eval:',
      'status: not_run',
      'skills/spec-prd/SKILL.md',
      'skills/spec-prd/references/evidence-and-topology.md',
      'skills/spec-prd/references/prd-output-template.md',
      'skills/spec-prd/references/prd-readiness-lens.md',
      'runtime_paths_checked: []',
      'The current Codex host exposes a multi-agent dispatch tool',
      'does not claim semantic eval passed',
      'generated runtime mirrors',
    ]);
    expect(artifact).not.toContain('status: passed');
  });

  test('sanitization and feature slices eval artifact records not-run dispatch boundary honestly', () => {
    const artifact = read(FRESH_SOURCE_EVAL_SANITIZATION_FEATURE_SLICES_PATH);

    expectContainsAll(artifact, [
      'fresh_source_eval:',
      'schema_version: fresh-source-eval-record.v1',
      'producer: spec-work',
      'freshness: current-worktree',
      'authority_level: advisory',
      'reason_code: fresh-source-eval-not-run',
      'consumer: spec-prd contract tests and code-review closeout',
      'status: not_run',
      'skills/spec-prd/SKILL.md',
      'skills/spec-prd/references/evidence-and-topology.md',
      'skills/spec-prd/references/prd-output-template.md',
      'skills/spec-prd/references/prd-readiness-lens.md',
      'skills/spec-prd/evals/examples.json',
      'skills/spec-plan/SKILL.md',
      'tests/unit/spec-prd-contracts.test.js',
      'tests/unit/spec-plan-contracts.test.js',
      'runtime_paths_checked: []',
      'PRD Sanitization',
      'Feature Slices',
      'quality_diagnosis',
      'does not claim semantic eval passed',
      'generated runtime mirrors',
    ]);
    expect(artifact).not.toContain('status: passed');
  });

  test('sanitization and topology successor eval artifact records dispatched pass with concern boundary', () => {
    const artifact = read(FRESH_SOURCE_EVAL_SANITIZATION_FEATURE_SLICES_SUCCESSOR_PATH);

    expectContainsAll(artifact, [
      'fresh_source_eval:',
      'schema_version: fresh-source-eval-record.v1',
      'producer: spec-work',
      'freshness: current-worktree',
      'authority_level: advisory',
      'reason_code: fresh-source-eval-dispatched',
      'consumer: spec-prd contract tests and code-review closeout',
      'status: passed-with-concerns',
      'supersedes: docs/validation/spec-prd/fresh-source-eval-2026-06-05-sanitization-feature-slices.md',
      'skills/spec-prd/SKILL.md',
      'skills/spec-prd/references/evidence-and-topology.md',
      'skills/spec-prd/references/prd-output-template.md',
      'skills/spec-prd/references/prd-readiness-lens.md',
      'skills/spec-prd/evals/examples.json',
      'runtime_paths_checked: []',
      'PRD Sanitization calibration-source separation',
      'Feature Slices',
      'Topology-heavy',
      'one minor non-blocking concern',
      'generated runtime mirrors',
    ]);
    expect(artifact).not.toContain('reason_code: fresh-source-eval-not-run');
  });

  test('requirements grill eval artifact records validation and runtime boundary honestly', () => {
    const artifact = read(FRESH_SOURCE_EVAL_REQUIREMENTS_GRILL_PATH);

    expectContainsAll(artifact, [
      'fresh_source_eval:',
      'schema_version: fresh-source-eval-record.v1',
      'producer: spec-work',
      'freshness: current-worktree',
      'authority_level: advisory',
      'reason_code: fresh-source-eval-not-run',
      'consumer: spec-prd contract tests and code-review closeout',
      'status: not_run',
      'skills/spec-prd/SKILL.md',
      'skills/spec-prd/references/domain-language-and-decision-ledger.md',
      'skills/spec-prd/references/prd-output-template.md',
      'skills/spec-prd/references/prd-readiness-lens.md',
      'skills/spec-prd/evals/examples.json',
      'tests/unit/spec-prd-contracts.test.js',
      'runtime_paths_checked: []',
      'Pre-PRD Clarification Loop',
      'large-input Map-Reduce',
      'P0/P1 PRD quality packs',
      'Context / ADR Topology Adapter',
      'does not claim semantic eval passed',
      'generated runtime mirrors',
      'sample_validation:',
      'status: not_measured',
    ]);
    expect(artifact).not.toContain('status: passed');
  });

  test('relentless grill eval artifact records not-run honestly with supersedes and structural-gate limitation', () => {
    const artifact = read(FRESH_SOURCE_EVAL_RELENTLESS_GRILL_PATH);

    expectContainsAll(artifact, [
      'fresh_source_eval:',
      'schema_version: fresh-source-eval-record.v1',
      'producer: spec-work',
      'authority_level: advisory',
      'status: not_run',
      'supersedes: docs/validation/spec-prd/fresh-source-eval-2026-06-23-grill-first-clarification.md',
      'skills/spec-prd/SKILL.md',
      'skills/spec-prd/references/grill-with-docs-integration.md',
      'skills/spec-prd/references/prd-readiness-lens.md',
      'runtime_paths_checked: []',
      'Canonical: 四个合法停点',
      'owner-capped',
      'checkpoint-blocked',
      'STRUCTURAL-GATE-SKIPPABLE',
      'dispatch_authorization_missing',
    ]);
    // 诚实边界:not_run 记录不得谎称语义 dispatch eval 通过
    expect(artifact).not.toContain('status: passed');
  });

  test('product expert lens eval artifact records dispatched provenance and advisory authority', () => {
    const artifact = read(FRESH_SOURCE_EVAL_PRODUCT_EXPERT_LENS_PATH);

    expectContainsAll(artifact, [
      'fresh_source_eval:',
      'schema_version: fresh-source-eval-record.v1',
      'producer: spec-work',
      'freshness: current-worktree',
      'authority_level: advisory',
      'reason_code: fresh-source-eval-dispatched',
      'consumer: spec-prd contract tests and work closeout',
      'status: passed',
      'skills/spec-prd/SKILL.md',
      'skills/spec-prd/references/product-expert-lens.md',
      'skills/spec-prd/references/design-source-evidence.md',
      'skills/spec-prd/references/large-input-checkpoint.md',
      'runtime_paths_checked: []',
      'fresh read-only Codex reviewers were dispatched',
      'Generated runtime mirrors were not used as source',
      'Product Expert Lens',
      'naming-only failure coverage',
    ]);
    expect(artifact).not.toContain('reason_code: fresh-source-eval-not-run');
  });

  test('clarification evidence eval artifact records dispatched behavior review and anti-ceremony boundary', () => {
    const artifact = read(FRESH_SOURCE_EVAL_CLARIFICATION_EVIDENCE_PATH);

    expectContainsAll(artifact, [
      'fresh_source_eval:',
      'schema_version: fresh-source-eval-record.v1',
      'producer: spec-work',
      'freshness: current-worktree',
      'authority_level: advisory',
      'reason_code: fresh-source-eval-dispatched',
      'consumer: spec-prd contract tests and work closeout',
      'status: passed',
      'skills/spec-prd/SKILL.md',
      'skills/spec-prd/references/product-expert-lens.md',
      'skills/spec-prd/references/design-source-evidence.md',
      'skills/spec-prd/references/large-input-checkpoint.md',
      'skills/spec-prd/references/prd-output-template.md',
      'skills/spec-prd/references/prd-readiness-lens.md',
      'skills/spec-prd/scripts/check-prd-artifact.js',
      'skills/spec-prd/evals/examples.json',
      'tests/unit/spec-prd-contracts.test.js',
      'runtime_paths_checked: []',
      'structured_zero_interaction_not_ready: passed',
      'codex_chat_fallback_not_headless: passed',
      'source_resolved_no_reask: passed',
      'large_input_ask_owner_priority: passed',
      'prd_owned_nonblocking_blocks_ready: passed',
      'checker_finding_consumption: passed',
      'figma_unread_or_omitted_blocks_ready: passed',
      'anti_ceremony_one_question_stop_and_compact_closeout: passed',
      'Generated runtime mirrors were not used as source',
    ]);
    expect(artifact).not.toContain('large-input priority: not_run');
    expect(artifact).not.toContain('Figma unread/omitted: not_run');
    expect(artifact).not.toContain('status: not_run');
  });

  test('project domain glossary artifact defines the cross-PRD canonical layer with light contract', () => {
    const glossary = read(GLOSSARY_PATH);

    expectContainsAll(glossary, [
      'Project Domain Glossary',
      'canonical_name',
      'first_seen_prd',
      'referenced_by',
      'status',
      'preview-first',
      '只收领域专属术语',
      'IS not DOES',
      'docs/contracts/',
      '`avoid` 是 `spec-prd` v1 术语 drift 检测的唯一输入字段',
    ]);
    expect(glossary).toContain('source_tag');
    expect(glossary).toContain('confirmed | advisory');
    expect(glossary).toMatch(/不是.*独立的.*CONTEXT\.md/);
    expect(glossary).not.toContain('sequential numbering');
    expect(glossary).not.toContain('`aliases` / `avoid`');
  });

  test('glossary drift script reports script-owned facts and degrades when glossary is absent or empty', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'glossary-drift-'));
    try {
      const prdPath = path.join(tmpDir, 'prd.md');
      fs.writeFileSync(prdPath, 'The system sends a bill to the customer.\n', 'utf8');

      const absent = JSON.parse(
        execFileSync('node', [DRIFT_SCRIPT_PATH, prdPath, '--glossary', path.join(tmpDir, 'nope.md')], {
          encoding: 'utf8',
        }),
      );
      expect(absent.glossary_status).toBe('absent');
      expect(absent.findings).toEqual([]);

      const glossaryPath = path.join(tmpDir, 'g.md');
      fs.writeFileSync(
        glossaryPath,
        '# Glossary\n### Invoice\nA request for payment.\n- avoid: bill\n- status: active\n',
        'utf8',
      );
      const hit = JSON.parse(
        execFileSync('node', [DRIFT_SCRIPT_PATH, prdPath, '--glossary', glossaryPath], { encoding: 'utf8' }),
      );
      expect(hit.glossary_status).toBe('present');
      expect(hit.findings).toHaveLength(1);
      expect(hit.findings[0]).toMatchObject({
        reason_code: 'avoid_term_used',
        term_used: 'bill',
        canonical_name: 'Invoice',
      });

      const aliasOnlyGlossaryPath = path.join(tmpDir, 'aliases-only.md');
      fs.writeFileSync(
        aliasOnlyGlossaryPath,
        '# Glossary\n### Invoice\nA request for payment.\n- aliases: bill\n- status: active\n',
        'utf8',
      );
      const aliasesOnly = JSON.parse(
        execFileSync('node', [DRIFT_SCRIPT_PATH, prdPath, '--glossary', aliasOnlyGlossaryPath], {
          encoding: 'utf8',
        }),
      );
      expect(aliasesOnly.findings).toEqual([]);

      const exampleOnly = path.join(tmpDir, 'example.md');
      fs.writeFileSync(
        exampleOnly,
        '# Glossary\n## format\n```md\n### {canonical_name}\n- avoid: bill\n```\n',
        'utf8',
      );
      const empty = JSON.parse(
        execFileSync('node', [DRIFT_SCRIPT_PATH, prdPath, '--glossary', exampleOnly], { encoding: 'utf8' }),
      );
      expect(empty.glossary_status).toBe('empty');
      expect(empty.findings).toEqual([]);

      const multiPrd = path.join(tmpDir, 'multi.md');
      fs.writeFileSync(multiPrd, 'a bill here\nanother bill\nthird bill line\n', 'utf8');
      const multi = JSON.parse(
        execFileSync('node', [DRIFT_SCRIPT_PATH, multiPrd, '--glossary', glossaryPath], { encoding: 'utf8' }),
      );
      expect(multi.findings).toHaveLength(3);
      expect(multi.findings.map((finding) => finding.line)).toEqual([1, 2, 3]);

      const symPrd = path.join(tmpDir, 'sym.md');
      fs.writeFileSync(symPrd, 'we use C++ here\n', 'utf8');
      const symGloss = path.join(tmpDir, 'symg.md');
      fs.writeFileSync(symGloss, '# G\n### Cancel\nx\n- avoid: C++\n- status: active\n', 'utf8');
      const sym = JSON.parse(
        execFileSync('node', [DRIFT_SCRIPT_PATH, symPrd, '--glossary', symGloss], { encoding: 'utf8' }),
      );
      expect(sym.findings).toHaveLength(1);
      expect(sym.findings[0].term_used).toBe('C++');

      const wordPrd = path.join(tmpDir, 'word.md');
      fs.writeFileSync(wordPrd, 'the billing system was billed\n', 'utf8');
      const word = JSON.parse(
        execFileSync('node', [DRIFT_SCRIPT_PATH, wordPrd, '--glossary', glossaryPath], { encoding: 'utf8' }),
      );
      expect(word.findings).toEqual([]);

      try {
        execFileSync('node', [DRIFT_SCRIPT_PATH, prdPath, '--glossary'], { encoding: 'utf8', stdio: 'pipe' });
        throw new Error('expected --glossary without value to fail');
      } catch (err) {
        expect(err.status).toBe(2);
        expect(String(err.stderr)).toContain('missing value for --glossary');
      }

      let extraArgError = null;
      try {
        execFileSync('node', [DRIFT_SCRIPT_PATH, prdPath, 'unexpected-extra'], { encoding: 'utf8', stdio: 'pipe' });
      } catch (err) {
        extraArgError = err;
      }
      expect(extraArgError).not.toBeNull();
      expect(extraArgError.status).toBe(2);
      expect(String(extraArgError.stderr)).toContain('unexpected extra argument');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('PRD artifact checker reports deterministic structure and trace facts', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prd-artifact-check-'));
    try {
      const goodPrd = path.join(tmpDir, 'good-requirements.md');
      fs.writeFileSync(
        goodPrd,
        [
          '---',
          'spec_id: 2026-06-20-001-good',
          'artifact_kind: prd-requirements',
          'status: draft',
          '---',
          '',
          '## Summary',
          'A brownfield increment anchored to the current system.',
          '',
          '## Change Delta',
          '| item | current | target | delta | evidence |',
          '| --- | --- | --- | --- | --- |',
          '| Import | absent | available | extend | user-stated |',
          '',
          '## Requirements',
          '| id | priority | requirement | rationale/source |',
          '| --- | --- | --- | --- |',
          '| R-01 | P0 | Users can import a CSV file. | user-stated |',
          '| R-02 | P1 | Users can see failed-row feedback after import. | assumption |',
          '',
          '## Acceptance Examples',
          'AE-01（对应 R-01）',
          'Given a valid CSV file',
          'When the user imports it',
          'Then the import result is visible',
          '',
          'AE-02（对应 R-02）',
          'Given a CSV file with invalid rows',
          'When the user imports it',
          'Then failed-row feedback is visible',
          '',
          '## Scope Boundaries',
          'No background scheduling.',
          '',
          '## Release / Operation Readiness',
          'NFR-01: Import result visibility has no new background scheduling dependency.',
          '',
          '## Evidence And Assumptions',
          '| claim | tag | source / owner | note |',
          '| --- | --- | --- | --- |',
          '| CSV import is requested. | user-stated | owner | direct request |',
          '| Failed-row feedback is desired. | assumption | owner | needs confirmation |',
          '',
          '## Outstanding Questions',
          '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
          '| --- | --- | --- | --- | --- | --- | --- | --- |',
          '| OQ-1 | Should failed-row feedback show row numbers? | Acceptance Examples | no | owner-answered | no | closed | show row count only |',
          '',
          '## Owner Decision Trace',
          '| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |',
          '| --- | --- | --- | --- | --- | --- |',
          '| Should failed-row feedback show row numbers? | owner | show row count only | Acceptance Examples | AE-02 covers count-only | closed |',
          '',
          '## Readiness Self-Check',
          'write_mode: final-prd',
          'clarification_evidence: asked-owner',
          'can_enter_spec-plan: yes',
          'preflight_sweep_closure: closed',
          'design_source_coverage: not-needed',
          '',
        ].join('\n'),
        'utf8',
      );
      const good = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, goodPrd], { encoding: 'utf8' }));
      expect(good.schema_version).toBe('spec-prd-artifact-check.v1');
      expect(good.status).toBe('checked');
      expect(good.facts.artifact_kind).toBe('prd-requirements');
      expect(good.facts.core_sections_missing).toEqual([]);
      expect(good.facts.uncovered_requirements).toEqual([]);
      expect(good.facts.priority_distribution).toEqual({ P0: 1, P1: 1 });
      expect(good.facts.nfr_ids).toEqual(['NFR-01']);
      expect(good.facts.nfr_count).toBe(1);
      expect(good.facts.assumption_row_count).toBe(1);
      expect(good.facts.outstanding_question_count).toBe(1);
      expect(good.facts.outstanding_questions_present).toBe(true);
      expect(good.facts.outstanding_questions_count).toBe(1);
      expect(good.facts.planning_recheck_present).toBe(false);
      expect(good.facts.write_mode_declared_valid).toBe(true);
      expect(good.facts.write_mode).toBe('final-prd');
      expect(good.facts.clarification_evidence_declared_valid).toBe(true);
      expect(good.facts.clarification_evidence).toBe('asked-owner');
      expect(good.facts.clarification_trace_present).toBe(true);
      expect(good.facts.can_enter_spec_plan_declared_valid).toBe(true);
      expect(good.facts.preflight_sweep_closure).toBe('closed');
      expect(good.facts.preflight_sweep_closure_declared_valid).toBe(true);
      expect(good.facts.design_source_refs_present).toBe(false);
      expect(good.facts.input_scan_attempted).toBe(false);
      expect(good.facts.ready_claim_present).toBe(true);
      expect(good.facts.ready_receipt_present).toBe(false);
      expect(good.facts.blocking_reason_codes).toEqual(['ready_receipt_absent']);
      expect(good.findings).toEqual([{ reason_code: 'ready_receipt_absent' }]);

      const badPrd = path.join(tmpDir, 'bad-requirements.md');
      fs.writeFileSync(
        badPrd,
        [
          '---',
          'spec_id: 2026-06-20-002-bad',
          'status: draft',
          '---',
          '',
          '## Summary',
          '<TODO>',
          '',
          '## Requirements',
          '| id | priority | requirement | rationale/source |',
          '| --- | --- | --- | --- |',
          '| R-01 | P0 | Users can import data. | source-candidate |',
          '',
          '## Feature Slices',
          'feature_id: F-01',
          'title: Import data',
          'requirement_refs: R-01',
          'acceptance_refs:',
          '',
        ].join('\n'),
        'utf8',
      );
      const bad = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, badPrd], { encoding: 'utf8' }));
      expect(bad.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'artifact_kind_missing_or_wrong' }),
        expect.objectContaining({ reason_code: 'core_section_missing', section: 'Change Delta' }),
        expect.objectContaining({ reason_code: 'requirement_without_acceptance_ref', requirement_id: 'R-01' }),
        expect.objectContaining({ reason_code: 'placeholder_or_todo_present' }),
        expect.objectContaining({ reason_code: 'feature_slice_missing_acceptance_trace' }),
      ]));

      // 多余位置参数必须 exit 2 而不是静默丢弃,与 check-glossary-drift.js 的坏调用语义对齐
      let extraArgError = null;
      try {
        execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, goodPrd, badPrd], { encoding: 'utf8', stdio: 'pipe' });
      } catch (err) {
        extraArgError = err;
      }
      expect(extraArgError).not.toBeNull();
      expect(extraArgError.status).toBe(2);
      expect(String(extraArgError.stderr)).toContain('unexpected extra argument');

      const readyWithoutDeclarations = path.join(tmpDir, 'ready-without-declarations.md');
      fs.writeFileSync(
        readyWithoutDeclarations,
        [
          '---',
          'artifact_kind: prd-requirements',
          '---',
          '',
          '## Summary',
          'ready-for-planning',
          '',
          '## Change Delta',
          '| item | current | target | delta | evidence |',
          '| --- | --- | --- | --- | --- |',
          '| Import | absent | available | extend | user-stated |',
          '',
          '## Requirements',
          '| id | priority | requirement | rationale/source |',
          '| --- | --- | --- | --- |',
          '| R-01 | P0 | Users can import a CSV file. | user-stated |',
          '',
          '## Acceptance Examples',
          'AE-01（对应 R-01）',
          '',
          '## Scope Boundaries',
          'No background scheduling.',
          '',
          '## Evidence And Assumptions',
          '| claim | tag | source / owner | note |',
          '| --- | --- | --- | --- |',
          '| CSV import is requested. | user-stated | owner | direct request |',
        ].join('\n'),
        'utf8',
      );
      const undeclared = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, readyWithoutDeclarations], { encoding: 'utf8' }));
      expect(undeclared.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'write_mode_undeclared' }),
        expect.objectContaining({ reason_code: 'clarification_evidence_undeclared' }),
        expect.objectContaining({ reason_code: 'can_enter_spec_plan_undeclared' }),
      ]));

      const readyNonPrdWithoutDeclarations = path.join(tmpDir, 'ready-non-prd-without-declarations.md');
      fs.writeFileSync(
        readyNonPrdWithoutDeclarations,
        [
          '# Ad-hoc PRD summary',
          '',
          'readiness_outcome: ready-for-planning',
        ].join('\n'),
        'utf8',
      );
      const nonPrdReady = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, readyNonPrdWithoutDeclarations], { encoding: 'utf8' }));
      expect(nonPrdReady.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'frontmatter_missing' }),
        expect.objectContaining({ reason_code: 'write_mode_undeclared' }),
        expect.objectContaining({ reason_code: 'clarification_evidence_undeclared' }),
        expect.objectContaining({ reason_code: 'can_enter_spec_plan_undeclared' }),
      ]));

      const bulletOutstanding = path.join(tmpDir, 'bullet-outstanding.md');
      fs.writeFileSync(
        bulletOutstanding,
        [
          '---',
          'artifact_kind: prd-requirements',
          '---',
          '',
          '## Summary',
          'A PRD with bullet questions.',
          '',
          '## Change Delta',
          '| item | current | target | delta | evidence |',
          '| --- | --- | --- | --- | --- |',
          '| Import | absent | available | extend | user-stated |',
          '',
          '## Requirements',
          '| id | priority | requirement | rationale/source |',
          '| --- | --- | --- | --- |',
          '| R-01 | P0 | Users can import a CSV file. | user-stated |',
          '',
          '## Acceptance Examples',
          'AE-01（对应 R-01）',
          '',
          '## Scope Boundaries',
          'No background scheduling.',
          '',
          '## Evidence And Assumptions',
          '| claim | tag | source / owner | note |',
          '| --- | --- | --- | --- |',
          '| CSV import is requested. | user-stated | owner | direct request |',
          '',
          '## Outstanding Questions',
          '- Should failed rows include row numbers?',
        ].join('\n'),
        'utf8',
      );
      const bullet = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, bulletOutstanding], { encoding: 'utf8' }));
      expect(bullet.facts.outstanding_questions_present).toBe(true);
      expect(bullet.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'write_mode_undeclared' }),
        expect.objectContaining({ reason_code: 'clarification_evidence_undeclared' }),
      ]));

      const templateOnlyFields = path.join(tmpDir, 'template-only-fields.md');
      fs.writeFileSync(
        templateOnlyFields,
        [
          '---',
          'artifact_kind: prd-requirements',
          '---',
          '',
          '## Summary',
          'The template mentions write_mode and clarification_evidence in prose.',
          '',
          '```text',
          'write_mode:',
          'clarification_evidence:',
          'can_enter_spec-plan:',
          '```',
          '',
          '## Change Delta',
          '| item | current | target | delta | evidence |',
          '| --- | --- | --- | --- | --- |',
          '| Import | absent | available | extend | user-stated |',
          '',
          '## Requirements',
          '| id | priority | requirement | rationale/source |',
          '| --- | --- | --- | --- |',
          '| R-01 | P0 | Users can import a CSV file. | user-stated |',
          '',
          '## Acceptance Examples',
          'AE-01（对应 R-01）',
          '',
          '## Scope Boundaries',
          'No background scheduling.',
          '',
          '## Evidence And Assumptions',
          '| claim | tag | source / owner | note |',
          '| --- | --- | --- | --- |',
          '| CSV import is requested. | user-stated | owner | direct request |',
        ].join('\n'),
        'utf8',
      );
      const templateOnly = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, templateOnlyFields], { encoding: 'utf8' }));
      expect(templateOnly.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'write_mode_undeclared' }),
        expect.objectContaining({ reason_code: 'clarification_evidence_undeclared' }),
        expect.objectContaining({ reason_code: 'can_enter_spec_plan_undeclared' }),
      ]));

      const minimalPrd = (readinessLines, extraSections = []) => [
        '---',
        'artifact_kind: prd-requirements',
        '---',
        '',
        '## Summary',
        'A minimal PRD-shaped artifact.',
        '',
        '## Change Delta',
        '| item | current | target | delta | evidence |',
        '| --- | --- | --- | --- | --- |',
        '| Import | absent | available | extend | user-stated |',
        '',
        '## Requirements',
        '| id | priority | requirement | rationale/source |',
        '| --- | --- | --- | --- |',
        '| R-01 | P0 | Users can import a CSV file. | user-stated |',
        '',
        '## Acceptance Examples',
        'AE-01（对应 R-01）',
        '',
        '## Scope Boundaries',
        'No background scheduling.',
        '',
        '## Evidence And Assumptions',
        '| claim | tag | source / owner | note |',
        '| --- | --- | --- | --- |',
        '| CSV import is requested. | user-stated | owner | direct request |',
        '',
        ...extraSections,
        '## Readiness Self-Check',
        ...readinessLines,
      ].join('\n');

      const skippedFinalPrd = path.join(tmpDir, 'skipped-final-prd.md');
      fs.writeFileSync(
        skippedFinalPrd,
        minimalPrd([
          'write_mode: final-prd',
          'clarification_evidence: skipped',
          'can_enter_spec-plan: yes',
          'preflight_sweep_closure: closed',
        ]),
        'utf8',
      );
      const skippedFinal = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, skippedFinalPrd], { encoding: 'utf8' }));
      expect(skippedFinal.facts.clarification_evidence_declared_valid).toBe(true);
      expect(skippedFinal.facts.clarification_trace_present).toBe(false);
      expect(skippedFinal.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'clarification_trace_absent' }),
      ]));

      const missingClarificationFinalPrd = path.join(tmpDir, 'missing-clarification-final-prd.md');
      fs.writeFileSync(
        missingClarificationFinalPrd,
        minimalPrd([
          'write_mode: final-prd',
          'can_enter_spec-plan: yes',
          'preflight_sweep_closure: closed',
        ]),
        'utf8',
      );
      const missingClarificationFinal = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, missingClarificationFinalPrd], { encoding: 'utf8' }));
      expect(missingClarificationFinal.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'clarification_evidence_undeclared' }),
        expect.objectContaining({ reason_code: 'clarification_trace_absent' }),
      ]));

      const checkpointSkippedPrd = path.join(tmpDir, 'checkpoint-skipped-prd.md');
      fs.writeFileSync(
        checkpointSkippedPrd,
        minimalPrd([
          'write_mode: checkpoint-prd',
          'clarification_evidence: skipped',
          'can_enter_spec-plan: no',
          'preflight_sweep_closure: blocked',
        ]),
        'utf8',
      );
      const checkpointSkipped = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, checkpointSkippedPrd], { encoding: 'utf8' }));
      expect(checkpointSkipped.findings.map((finding) => finding.reason_code)).not.toContain('clarification_trace_absent');

      const evadedDeclarationsPrd = path.join(tmpDir, 'evaded-declarations-prd.md');
      fs.writeFileSync(
        evadedDeclarationsPrd,
        [
          '---',
          'status: draft',
          '---',
          '',
          '## Summary',
          'Looks like a PRD but evades artifact_kind and readiness literal triggers.',
          '',
          '## Change Delta',
          '| item | current | target | delta | evidence |',
          '| --- | --- | --- | --- | --- |',
          '| Import | absent | available | extend | user-stated |',
          '',
          '## Requirements',
          '| id | priority | requirement | rationale/source |',
          '| --- | --- | --- | --- |',
          '| R-01 | P0 | Users can import a CSV file. | user-stated |',
          '',
          '## Acceptance Examples',
          'AE-01（对应 R-01）',
          '',
          '## Scope Boundaries',
          'No background scheduling.',
          '',
          '## Evidence And Assumptions',
          '| claim | tag | source / owner | note |',
          '| --- | --- | --- | --- |',
          '| CSV import is requested. | user-stated | owner | direct request |',
        ].join('\n'),
        'utf8',
      );
      const evadedDeclarations = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, evadedDeclarationsPrd], { encoding: 'utf8' }));
      expect(evadedDeclarations.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'prd_readiness_declarations_evaded' }),
      ]));

      const nonPrdShape = path.join(tmpDir, 'non-prd-shape.md');
      fs.writeFileSync(nonPrdShape, '# Notes\n\nNo requirement ids here.\n', 'utf8');
      const nonPrdShapeReport = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, nonPrdShape], { encoding: 'utf8' }));
      expect(nonPrdShapeReport.findings.map((finding) => finding.reason_code)).not.toContain('prd_readiness_declarations_evaded');

      const missingPreflightPrd = path.join(tmpDir, 'missing-preflight-prd.md');
      fs.writeFileSync(
        missingPreflightPrd,
        minimalPrd([
          'write_mode: final-prd',
          'clarification_evidence: source-proven-no-ask',
          'can_enter_spec-plan: yes',
        ]),
        'utf8',
      );
      const missingPreflight = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, missingPreflightPrd], { encoding: 'utf8' }));
      expect(missingPreflight.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'preflight_sweep_closure_absent' }),
      ]));

      const figmaInput = path.join(tmpDir, 'source_docs', 'Figma-市场页设计稿链接.md');
      fs.mkdirSync(path.dirname(figmaInput), { recursive: true });
      fs.writeFileSync(figmaInput, 'Figma 114-17842\n', 'utf8');

      const inputDesignUnaccountedPrd = path.join(tmpDir, 'input-design-unaccounted.md');
      fs.writeFileSync(
        inputDesignUnaccountedPrd,
        minimalPrd([
          'write_mode: final-prd',
          'clarification_evidence: source-proven-no-ask',
          'can_enter_spec-plan: yes',
          'preflight_sweep_closure: closed',
        ]),
        'utf8',
      );
      const inputDesignUnaccounted = JSON.parse(execFileSync('node', [
        PRD_ARTIFACT_SCRIPT_PATH,
        inputDesignUnaccountedPrd,
        '--inputs',
        figmaInput,
      ], { encoding: 'utf8' }));
      expect(inputDesignUnaccounted.facts.input_scan_attempted).toBe(true);
      expect(inputDesignUnaccounted.facts.input_design_refs_present).toBe(true);
      expect(inputDesignUnaccounted.facts.input_refs_used).toEqual([figmaInput]);
      expect(inputDesignUnaccounted.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'design_source_unaccounted' }),
      ]));

      const inputDesignAccountedPrd = path.join(tmpDir, 'input-design-accounted.md');
      fs.writeFileSync(
        inputDesignAccountedPrd,
        minimalPrd(
          [
            'write_mode: final-prd',
            'clarification_evidence: source-proven-no-ask',
            'can_enter_spec-plan: yes',
            'preflight_sweep_closure: closed',
          ],
          [
            '## Design Source Coverage',
            'design_source_inventory:',
            '- source_or_node: Figma 114-17842',
            '  read_status: degraded',
            '',
            'design_sources_read:',
            '- none',
            '',
            'design_sources_unread:',
            '- Figma 114-17842 -> tool unavailable -> owner accepted degraded coverage',
            '',
            'design_source_coverage: degraded status recorded',
            '',
          ],
        ),
        'utf8',
      );
      const inputDesignAccounted = JSON.parse(execFileSync('node', [
        PRD_ARTIFACT_SCRIPT_PATH,
        inputDesignAccountedPrd,
        '--inputs',
        figmaInput,
      ], { encoding: 'utf8' }));
      expect(inputDesignAccounted.findings.map((finding) => finding.reason_code)).not.toContain('design_source_unaccounted');

      const missingInput = path.join(tmpDir, 'missing-input.md');
      const degradedInput = JSON.parse(execFileSync('node', [
        PRD_ARTIFACT_SCRIPT_PATH,
        goodPrd,
        '--inputs',
        missingInput,
      ], { encoding: 'utf8' }));
      expect(degradedInput.facts.input_scan_attempted).toBe(true);
      expect(degradedInput.facts.input_scan_degraded).toBe(true);
      expect(degradedInput.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'input_refs_unavailable' }),
        expect.objectContaining({ reason_code: 'input_scan_degraded' }),
      ]));

      const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prd-outside-input-'));
      try {
        const outsideInput = path.join(outsideDir, 'external-design.md');
        fs.writeFileSync(outsideInput, 'Figma design: node-id=9-9\n', 'utf8');

        const outsideInputRun = JSON.parse(execFileSync('node', [
          PRD_ARTIFACT_SCRIPT_PATH,
          inputDesignAccountedPrd,
          '--inputs',
          outsideInput,
        ], { encoding: 'utf8' }));
        expect(outsideInputRun.facts.input_scan_attempted).toBe(true);
        expect(outsideInputRun.facts.input_refs_used).toEqual([]);
        expect(outsideInputRun.facts.input_design_refs_present).toBe(true);
        expect(outsideInputRun.findings).toEqual(expect.arrayContaining([
          expect.objectContaining({ reason_code: 'input_refs_unavailable' }),
          expect.objectContaining({ reason_code: 'input_scan_degraded' }),
        ]));

        const mixedOutsideInputRun = JSON.parse(execFileSync('node', [
          PRD_ARTIFACT_SCRIPT_PATH,
          inputDesignAccountedPrd,
          '--inputs',
          `${outsideInput},${figmaInput}`,
        ], { encoding: 'utf8' }));
        expect(mixedOutsideInputRun.facts.input_refs_used).toEqual([figmaInput]);
        expect(mixedOutsideInputRun.facts.ready_receipt_inputs_hash)
          .toBe(inputDesignAccounted.facts.ready_receipt_inputs_hash);
        expect(mixedOutsideInputRun.findings).toEqual(expect.arrayContaining([
          expect.objectContaining({ reason_code: 'input_scan_degraded' }),
        ]));

        const symlinkInput = path.join(tmpDir, 'source_docs', 'symlink-design.md');
        let symlinkCreated = false;
        try {
          fs.symlinkSync(outsideInput, symlinkInput);
          symlinkCreated = true;
        } catch (err) {
          expect(['EACCES', 'EPERM', 'ENOTSUP'].includes(err.code)).toBe(true);
        }
        if (symlinkCreated) {
          const symlinkInputRun = JSON.parse(execFileSync('node', [
            PRD_ARTIFACT_SCRIPT_PATH,
            inputDesignAccountedPrd,
            '--inputs',
            symlinkInput,
          ], { encoding: 'utf8' }));
          expect(symlinkInputRun.facts.input_refs_used).toEqual([]);
          expect(symlinkInputRun.findings).toEqual(expect.arrayContaining([
            expect.objectContaining({ reason_code: 'input_refs_unavailable' }),
            expect.objectContaining({ reason_code: 'input_scan_degraded' }),
          ]));
        }
      } finally {
        fs.rmSync(outsideDir, { recursive: true, force: true });
      }

      const commaInputs = JSON.parse(execFileSync('node', [
        PRD_ARTIFACT_SCRIPT_PATH,
        inputDesignUnaccountedPrd,
        '--inputs',
        `${missingInput},${figmaInput}`,
      ], { encoding: 'utf8' }));
      const repeatedInputs = JSON.parse(execFileSync('node', [
        PRD_ARTIFACT_SCRIPT_PATH,
        inputDesignUnaccountedPrd,
        '--inputs',
        missingInput,
        '--inputs',
        figmaInput,
      ], { encoding: 'utf8' }));
      expect(commaInputs.facts.input_refs_used).toEqual(repeatedInputs.facts.input_refs_used);
      expect(commaInputs.facts.input_design_refs_present).toBe(repeatedInputs.facts.input_design_refs_present);

      const figmaWithoutCoverage = path.join(tmpDir, 'figma-without-coverage.md');
      fs.writeFileSync(
        figmaWithoutCoverage,
        [
          '---',
          'artifact_kind: prd-requirements',
          '---',
          '',
          '## Summary',
          'Figma: https://www.figma.com/design/abc/File?node-id=1-2',
          '',
          '## Change Delta',
          '| item | current | target | delta | evidence |',
          '| --- | --- | --- | --- | --- |',
          '| App | absent | available | extend | source-candidate |',
          '',
          '## Requirements',
          '| id | priority | requirement | rationale/source |',
          '| --- | --- | --- | --- |',
          '| R-01 | P0 | Users can open the market page. | source-candidate |',
          '',
          '## Acceptance Examples',
          'AE-01（对应 R-01）',
          '',
          '## Scope Boundaries',
          'No backend changes.',
          '',
          '## Evidence And Assumptions',
          '| claim | tag | source / owner | note |',
          '| --- | --- | --- | --- |',
          '| Design exists. | source-candidate | figma | provider_untrusted |',
          '',
          '## Readiness Self-Check',
          'write_mode: final-prd',
          'clarification_evidence: source-proven-no-ask',
          'can_enter_spec-plan: yes',
        ].join('\n'),
        'utf8',
      );
      const figmaMissing = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, figmaWithoutCoverage], { encoding: 'utf8' }));
      expect(figmaMissing.facts.design_source_refs_present).toBe(true);
      expect(figmaMissing.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'design_source_inventory_undeclared' }),
        expect.objectContaining({ reason_code: 'design_source_coverage_undeclared' }),
        expect.objectContaining({ reason_code: 'design_sources_read_undeclared' }),
        expect.objectContaining({ reason_code: 'design_sources_unread_undeclared' }),
      ]));

      const figmaEmptyCoverage = path.join(tmpDir, 'figma-empty-coverage.md');
      fs.writeFileSync(
        figmaEmptyCoverage,
        [
          '---',
          'artifact_kind: prd-requirements',
          '---',
          '',
          '## Summary',
          'Figma node 1:2 informs the market page.',
          '',
          '## Change Delta',
          '| item | current | target | delta | evidence |',
          '| --- | --- | --- | --- | --- |',
          '| App | absent | available | extend | source-candidate |',
          '',
          '## Requirements',
          '| id | priority | requirement | rationale/source |',
          '| --- | --- | --- | --- |',
          '| R-01 | P0 | Users can open the market page. | source-candidate |',
          '',
          '## Acceptance Examples',
          'AE-01（对应 R-01）',
          '',
          '## Scope Boundaries',
          'No backend changes.',
          '',
          '## Evidence And Assumptions',
          '| claim | tag | source / owner | note |',
          '| --- | --- | --- | --- |',
          '| Design exists. | source-candidate | Figma node 1:2 | provider_untrusted |',
          '',
          '## Design Source Coverage',
          'design_source_inventory:',
          '- source_or_node: Figma node 1:2',
          '  read_status: read',
          'design_source_coverage:',
          '',
          '## Readiness Self-Check',
          'write_mode: final-prd',
          'clarification_evidence: source-proven-no-ask',
          'can_enter_spec-plan: yes',
        ].join('\n'),
        'utf8',
      );
      const figmaEmpty = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, figmaEmptyCoverage], { encoding: 'utf8' }));
      expect(figmaEmpty.facts.design_source_coverage_declared).toBe(false);
      expect(figmaEmpty.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'design_source_coverage_undeclared' }),
        expect.objectContaining({ reason_code: 'design_sources_read_undeclared' }),
        expect.objectContaining({ reason_code: 'design_sources_unread_undeclared' }),
      ]));

      const figmaThinCoverage = path.join(tmpDir, 'figma-thin-coverage.md');
      fs.writeFileSync(
        figmaThinCoverage,
        [
          '---',
          'artifact_kind: prd-requirements',
          '---',
          '',
          '## Summary',
          'Figma node 1:2 informs the market page.',
          '',
          '## Change Delta',
          '| item | current | target | delta | evidence |',
          '| --- | --- | --- | --- | --- |',
          '| App | absent | available | extend | source-candidate |',
          '',
          '## Requirements',
          '| id | priority | requirement | rationale/source |',
          '| --- | --- | --- | --- |',
          '| R-01 | P0 | Users can open the market page. | source-candidate |',
          '',
          '## Acceptance Examples',
          'AE-01（对应 R-01）',
          '',
          '## Scope Boundaries',
          'No backend changes.',
          '',
          '## Evidence And Assumptions',
          '| claim | tag | source / owner | note |',
          '| --- | --- | --- | --- |',
          '| Design exists. | source-candidate | Figma node 1:2 | provider_untrusted |',
          '',
          '## Design Source Coverage',
          'design_source_inventory:',
          '- source_or_node: Figma node 1:2',
          '  read_status: read',
          '  design_source_coverage: read status confirmed',
          '',
          'design_sources_read:',
          'design_sources_unread:',
          'design_source_coverage: read status confirmed',
          '',
          '## Readiness Self-Check',
          'write_mode: final-prd',
          'clarification_evidence: source-proven-no-ask',
          'can_enter_spec-plan: yes',
        ].join('\n'),
        'utf8',
      );
      const figmaThin = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, figmaThinCoverage], { encoding: 'utf8' }));
      expect(figmaThin.facts.design_sources_read_present).toBe(false);
      expect(figmaThin.facts.design_sources_unread_present).toBe(false);
      expect(figmaThin.findings).toEqual(expect.arrayContaining([
        expect.objectContaining({ reason_code: 'design_sources_read_undeclared' }),
        expect.objectContaining({ reason_code: 'design_sources_unread_undeclared' }),
      ]));

      const figmaWithCoverage = path.join(tmpDir, 'figma-with-coverage.md');
      fs.writeFileSync(
        figmaWithCoverage,
        [
          '---',
          'artifact_kind: prd-requirements',
          '---',
          '',
          '## Summary',
          'Figma node 1:2 informs the market page.',
          '',
          '## Change Delta',
          '| item | current | target | delta | evidence |',
          '| --- | --- | --- | --- | --- |',
          '| App | absent | available | extend | source-candidate |',
          '',
          '## Requirements',
          '| id | priority | requirement | rationale/source |',
          '| --- | --- | --- | --- |',
          '| R-01 | P0 | Users can open the market page. | source-candidate |',
          '',
          '## Acceptance Examples',
          'AE-01（对应 R-01）',
          '',
          '## Scope Boundaries',
          'No backend changes.',
          '',
          '## Evidence And Assumptions',
          '| claim | tag | source / owner | note |',
          '| --- | --- | --- | --- |',
          '| Design exists. | source-candidate | Figma node 1:2 | provider_untrusted |',
          '',
          '## Design Source Coverage',
          'design_source_inventory:',
          '- source_or_node: Figma node 1:2',
          '  read_status: read',
          '  design_source_coverage: read status confirmed',
          '',
          'design_sources_read:',
          '- Figma node 1:2 -> Acceptance Examples -> source-candidate/provider_untrusted',
          '',
          'design_sources_unread:',
          '- none',
          '',
          'design_source_coverage: read status confirmed',
          '',
          '## Readiness Self-Check',
          'write_mode: final-prd',
          'clarification_evidence: source-proven-no-ask',
          'can_enter_spec-plan: yes',
        ].join('\n'),
        'utf8',
      );
      const figmaCovered = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, figmaWithCoverage], { encoding: 'utf8' }));
      expect(figmaCovered.facts.design_source_inventory_declared).toBe(true);
      expect(figmaCovered.facts.design_sources_read_present).toBe(true);
      expect(figmaCovered.facts.design_sources_unread_present).toBe(true);
      expect(figmaCovered.facts.design_source_coverage_declared).toBe(true);
      expect(figmaCovered.findings.map((finding) => finding.reason_code)).not.toContain('design_source_coverage_undeclared');
      expect(figmaCovered.findings.map((finding) => finding.reason_code)).not.toContain('design_sources_read_undeclared');
      expect(figmaCovered.findings.map((finding) => finding.reason_code)).not.toContain('design_sources_unread_undeclared');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('Phase 4 is a mandatory checker gate before any planning handoff', () => {
    const skill = read(SKILL_PATH);
    expectContainsAll(skill, [
      'Phase 4 is a mandatory producer-local gate, not an optional closeout.',
      'Self-declaring readiness or recommending planning without an executed checker/finalize receipt',
      'A handoff that names no finalize/checker receipt has not passed Phase 4.',
      'anchors core sections on their canonical English token',
      'node skills/spec-prd/scripts/finalize-prd-artifact.js <prd-path> --inputs <input-path>',
      'Source-path rewrite must project this operational path',
      'clarification_trace_absent',
      'design_source_unaccounted',
      'input_refs_unavailable',
      'input_scan_degraded',
      'preflight_sweep_closure_blocked',
      'outstanding_question_closure_undeclared',
      'blocking_outstanding_question_present',
      'planning_invention_question_present',
      'unclosed_owner_question_present',
      'prd_readiness_declarations_evaded',
      'ready_receipt_absent',
      'ready_receipt_stale',
      'finalize_required',
      'preflight_sweep_closure_absent',
      'input_scan_attempted=false',
    ]);

    const claudeRendered = getAdapter('claude').transformSkillContent(skill, {
      skillName: 'spec-prd',
      isWorkflowSkill: true,
    });
    expect(claudeRendered).toContain('node .claude/spec-first/workflows/spec-prd/scripts/finalize-prd-artifact.js <prd-path> --inputs <input-path>');

    const codexRendered = getAdapter('codex').transformSkillContent(skill, {
      skillName: 'spec-prd',
      isWorkflowSkill: true,
    });
    expect(codexRendered).toContain('node .agents/skills/spec-prd/scripts/finalize-prd-artifact.js <prd-path> --inputs <input-path>');

    const readiness = read(READINESS_PATH);
    expectContainsAll(readiness, [
      'is required before this lens can emit `ready-for-planning`, not optional',
      'an artifact-backed PRD with no current producer-local finalize receipt is itself not ready',
      're-anchor the heading rather than ignore it',
      'clarification_trace_absent',
      'design_source_unaccounted',
      'input_refs_unavailable',
      'input_scan_degraded',
      'preflight_sweep_closure_blocked',
      'outstanding_question_closure_undeclared',
      'blocking_outstanding_question_present',
      'planning_invention_question_present',
      'unclosed_owner_question_present',
      'prd_readiness_declarations_evaded',
      'ready_receipt_absent',
      'ready_receipt_stale',
      'finalize_required',
      'preflight_sweep_closure_absent',
      'input_scan_attempted=false',
      'Requirement Analysis Gate closure',
      '`requirement-analysis-gate closure`',
      'owner acceptance',
    ]);

    const template = read(OUTPUT_TEMPLATE_PATH);
    expectContainsAll(template, [
      'Keep the canonical English anchor token in every core-section heading',
      'Do not freelance a section structure that omits these anchors.',
    ]);
  });

  test('PRD artifact checker anchors core sections on canonical token across localized headings', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prd-artifact-anchor-'));
    try {
      // 双语标题保留英文锚点 -> 全部 core section 命中
      const bilingual = path.join(tmpDir, 'bilingual-requirements.md');
      fs.writeFileSync(
        bilingual,
        [
          '---',
          'artifact_kind: prd-requirements',
          '---',
          '',
          '## Summary（文档概要）',
          'x',
          '## 一、Change Delta 变更范围',
          'x',
          '## Requirements 需求',
          'x',
          '## Acceptance Examples 验收',
          'x',
          '## Scope Boundaries 范围边界',
          'x',
          '## Evidence And Assumptions 证据与假设',
          'x',
          '',
        ].join('\n'),
        'utf8',
      );
      const bi = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, bilingual], { encoding: 'utf8' }));
      expect(bi.facts.core_sections_missing).toEqual([]);

      // `Non-Functional Requirements` 不得冒充 core `Requirements`
      const nonFunctional = path.join(tmpDir, 'non-functional.md');
      fs.writeFileSync(
        nonFunctional,
        ['---', 'artifact_kind: prd-requirements', '---', '', '## Summary', 'x', '## Non-Functional Requirements', 'x', ''].join('\n'),
        'utf8',
      );
      const nf = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, nonFunctional], { encoding: 'utf8' }));
      expect(nf.facts.core_sections_missing).toContain('Requirements');

      // 复现 motivating 故障形态:纯中文标题(无英文锚点)+ 缺 readiness 声明 ->
      // 闸必须当场拦截,而不是全绿。证明真实根因是"闸没被运行",不是"闸全绿"。
      const localizedOnly = path.join(tmpDir, 'kaz-shape-requirements.md');
      fs.writeFileSync(
        localizedOnly,
        [
          '---',
          'artifact_kind: prd-requirements',
          '---',
          '',
          '## 一、文档概要',
          'x',
          '## 三、范围（Scope）',
          'x',
          '## 五、通用需求',
          '| id | priority | requirement | source |',
          '| --- | --- | --- | --- |',
          '| R-01 | P0 | 游客可见行情 | user-stated |',
          '',
          '## 十二、待澄清问题',
          'x',
          '',
        ].join('\n'),
        'utf8',
      );
      const kaz = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, localizedOnly], { encoding: 'utf8' }));
      const kazCodes = kaz.findings.map((finding) => finding.reason_code);
      expect(kazCodes).toContain('core_section_missing');
      expect(kazCodes).toContain('write_mode_undeclared');
      expect(kazCodes).toContain('clarification_evidence_undeclared');
      expect(kaz.findings.length).toBeGreaterThan(0);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // 004 closure-contract:剃刀 + how-pushdown 后门 + source ref 形似 + design + inputs-hash。
  it('enforces the closure-disposition razor and its blockers', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prd-closure-contract-'));
    const run = (file) => JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, file], { encoding: 'utf8' }));
    const codes = (r) => r.facts.blocking_reason_codes;

    // 构造一个 ready-claiming PRD 骨架,只替换 OQ + trace 段。
    const buildPrd = ({ oq, trace, designCoverage }) => [
      '---',
      'spec_id: 2026-06-25-900-razor',
      'artifact_kind: prd-requirements',
      'status: ready-for-planning',
      '---',
      '',
      '## Summary',
      'Anchored brownfield increment.',
      '## Change Delta',
      '| item | current | target | delta | evidence |',
      '| --- | --- | --- | --- | --- |',
      '| x | a | b | extend | user-stated |',
      '## Requirements',
      '| id | priority | requirement | rationale/source |',
      '| --- | --- | --- | --- |',
      '| R-01 | P0 | Observable behavior | user-stated |',
      '## Acceptance Examples',
      'AE-01（对应 R-01）Given x When y Then z',
      '## Scope Boundaries',
      '### In Scope',
      '### Out Of Scope',
      '## Evidence And Assumptions',
      '| claim | tag | source / owner | note |',
      '| --- | --- | --- | --- |',
      '| c | user-stated | owner | n |',
      '## Outstanding Questions',
      ...oq,
      ...(trace || []),
      '## Readiness Self-Check',
      'write_mode: final-prd',
      'clarification_evidence: asked-owner',
      'can_enter_spec-plan: yes',
      'preflight_sweep_closure: closed',
      `design_source_coverage: ${designCoverage || 'not-needed'}`,
      '',
    ].join('\n');

    try {
      // 1) 19:07 形态:非阻塞 load-bearing OQ,无合法 disposition -> open_oq_without_owner_closure
      const shape1907 = path.join(tmpDir, 'a-requirements.md');
      fs.writeFileSync(shape1907, buildPrd({
        oq: [
          '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
          '| --- | --- | --- | --- | --- | --- | --- | --- |',
          '| OQ-2 | 中台持仓接口是否可用 | Requirements | no |  | no | closed | 本期降级隐藏 |',
        ],
      }), 'utf8');
      expect(codes(run(shape1907))).toContain('open_oq_without_owner_closure');

      // 2) 同一 OQ 用 owner-answered + 有效 trace -> 清除该 blocker
      const owned = path.join(tmpDir, 'b-requirements.md');
      fs.writeFileSync(owned, buildPrd({
        oq: [
          '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
          '| --- | --- | --- | --- | --- | --- | --- | --- |',
          '| OQ-2 | 中台持仓接口是否可用 | Requirements | no | owner-answered | no | closed | 本期降级隐藏 |',
        ],
        trace: [
          '## Owner Decision Trace',
          '| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |',
          '| --- | --- | --- | --- | --- | --- |',
          '| 中台持仓接口是否可用 | owner | 本期降级隐藏 | Requirements | R-01 covers degrade | closed |',
        ],
      }), 'utf8');
      expect(codes(run(owned))).not.toContain('open_oq_without_owner_closure');

      const decisionNotesOnly = path.join(tmpDir, 'b2-requirements.md');
      fs.writeFileSync(decisionNotesOnly, buildPrd({
        oq: [
          '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
          '| --- | --- | --- | --- | --- | --- | --- | --- |',
          '| OQ-2 | 中台持仓接口是否可用 | Requirements | no | owner-answered | no | closed | 本期降级隐藏 |',
        ],
        trace: [
          '## Decision Notes',
          '| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |',
          '| --- | --- | --- | --- | --- | --- |',
          '| 中台持仓接口是否可用 | owner | 本期降级隐藏 | Requirements | R-01 covers degrade | closed |',
        ],
      }), 'utf8');
      const decisionNotesCodes = codes(run(decisionNotesOnly));
      expect(decisionNotesCodes).toContain('open_oq_without_owner_closure');
      expect(decisionNotesCodes).toContain('owner_decision_trace_required_but_absent');

      const traceMissingConsequence = path.join(tmpDir, 'b3-requirements.md');
      fs.writeFileSync(traceMissingConsequence, buildPrd({
        oq: [
          '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
          '| --- | --- | --- | --- | --- | --- | --- | --- |',
          '| OQ-2 | 中台持仓接口是否可用 | Requirements | no | owner-answered | no | closed | 本期降级隐藏 |',
        ],
        trace: [
          '## Owner Decision Trace',
          '| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |',
          '| --- | --- | --- | --- | --- | --- |',
          '| 中台持仓接口是否可用 | owner | 本期降级隐藏 | Requirements |  | closed |',
        ],
      }), 'utf8');
      const missingConsequence = run(traceMissingConsequence);
      expect(missingConsequence.facts.owner_decision_trace_present).toBe(false);
      expect(codes(missingConsequence)).toContain('open_oq_without_owner_closure');
      expect(codes(missingConsequence)).toContain('owner_decision_trace_required_but_absent');

      // 3) how-pushdown 后门:命中 WHAT 词表 + claims-ready -> how_pushdown_touches_what(blocking)
      const pushdown = path.join(tmpDir, 'c-requirements.md');
      fs.writeFileSync(pushdown, buildPrd({
        oq: [
          '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
          '| --- | --- | --- | --- | --- | --- | --- | --- |',
          '| OQ-4 | 行情权限 availability 如何取 | Requirements | no | implementation-only-how-pushdown | no | closed | 实现期定 |',
        ],
      }), 'utf8');
      expect(codes(run(pushdown))).toContain('how_pushdown_touches_what');

      // 4) source-resolved 证据形似:vague prose -> 仍 block;checkable ref -> 清除
      const vague = path.join(tmpDir, 'd-requirements.md');
      fs.writeFileSync(vague, buildPrd({
        oq: [
          '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
          '| --- | --- | --- | --- | --- | --- | --- | --- |',
          '| OQ-5 | 模块枚举本期范围 | 见文档 | no | source-resolved | no | closed | 已确认 |',
        ],
      }), 'utf8');
      expect(codes(run(vague))).toContain('open_oq_without_owner_closure');

      const refOk = path.join(tmpDir, 'e-requirements.md');
      fs.writeFileSync(refOk, buildPrd({
        oq: [
          '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
          '| --- | --- | --- | --- | --- | --- | --- | --- |',
          '| OQ-5 | 模块枚举本期范围 | docs/contracts/enum.md:12 | no | source-resolved | no | closed | docs/contracts/enum.md:12 |',
        ],
      }), 'utf8');
      expect(codes(run(refOk))).not.toContain('open_oq_without_owner_closure');

      // 4b) 散文式 'word/word'(and/or、input/output)不算 checkable ref,仍 block
      const proseSlash = path.join(tmpDir, 'e2-requirements.md');
      fs.writeFileSync(proseSlash, buildPrd({
        oq: [
          '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
          '| --- | --- | --- | --- | --- | --- | --- | --- |',
          '| OQ-5 | scope of module | handled case-by-case | no | source-resolved | no | closed | per existing and/or default |',
        ],
      }), 'utf8');
      expect(codes(run(proseSlash))).toContain('open_oq_without_owner_closure');

      // 4c) bullet-OQ 旁路修复(对应 2026-06-26 16:46 真实运行):OQ 段以 bullet 形式
      //     列出 load-bearing 未决问题、标散文「非阻塞」,parseHeaderedTable 得 0 行会
      //     绕过逐行剃刀;ready PRD 必须仍被 outstanding_question_closure_undeclared 拦。
      const bulletBypass = path.join(tmpDir, 'e3-requirements.md');
      fs.writeFileSync(bulletBypass, buildPrd({
        oq: [
          '- **OQ-2**:市场页是否挂载于现有 market Tab?规划期澄清,非阻塞。',
          '- **OQ-3**:中台持仓接口是否就绪?未就绪时降级策略?规划期澄清,非阻塞。',
        ],
      }), 'utf8');
      expect(codes(run(bulletBypass))).toContain('outstanding_question_closure_undeclared');

      // 4d) 反向:bullet-OQ 但非 claims-ready(draft)不触发,且仅列 emptiness 标记不误报
      const bulletDraft = path.join(tmpDir, 'e4-requirements.md');
      fs.writeFileSync(bulletDraft, [
        '---', 'spec_id: 2026-06-25-902-bd', 'artifact_kind: prd-requirements', 'status: draft', '---', '',
        '## Summary', 'x', '## Change Delta', '| item | current | target | delta | evidence |', '| --- | --- | --- | --- | --- |', '| x | a | b | extend | user-stated |',
        '## Requirements', '| id | priority | requirement | rationale/source |', '| --- | --- | --- | --- |', '| R-01 | P0 | b | user-stated |',
        '## Acceptance Examples', 'AE-01（对应 R-01）Given x When y Then z',
        '## Scope Boundaries', '### In Scope', '### Out Of Scope',
        '## Evidence And Assumptions', '| claim | tag | source / owner | note |', '| --- | --- | --- | --- |', '| c | user-stated | owner | n |',
        '## Outstanding Questions', '- **OQ-2**:待澄清问题。',
        '## Readiness Self-Check', 'write_mode: checkpoint-prd', 'can_enter_spec-plan: no', '',
      ].join('\n'), 'utf8');
      expect(codes(run(bulletDraft))).not.toContain('outstanding_question_closure_undeclared');

      // 5) checkpoint 带 residue 不被 ready blocker 误伤(非 claims-ready)
      const checkpoint = path.join(tmpDir, 'f-requirements.md');
      fs.writeFileSync(checkpoint, [
        '---', 'spec_id: 2026-06-25-901-cp', 'artifact_kind: prd-requirements', 'status: draft', '---', '',
        '## Summary', 'x', '## Change Delta', '| item | current | target | delta | evidence |', '| --- | --- | --- | --- | --- |', '| x | a | b | extend | user-stated |',
        '## Requirements', '| id | priority | requirement | rationale/source |', '| --- | --- | --- | --- |', '| R-01 | P0 | b | user-stated |',
        '## Acceptance Examples', 'AE-01（对应 R-01）Given x When y Then z',
        '## Scope Boundaries', '### In Scope', '### Out Of Scope',
        '## Evidence And Assumptions', '| claim | tag | source / owner | note |', '| --- | --- | --- | --- |', '| c | user-stated | owner | n |',
        '## Outstanding Questions',
        '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
        '| --- | --- | --- | --- | --- | --- | --- | --- |',
        '| OQ-2 | 中台持仓接口 | Requirements | yes |  | yes | unclosed | 待定 |',
        '## Readiness Self-Check',
        'write_mode: checkpoint-prd', 'clarification_evidence: asked-owner', 'can_enter_spec-plan: no', 'preflight_sweep_closure: blocked', 'design_source_coverage: not-needed', '',
      ].join('\n'), 'utf8');
      const cp = run(checkpoint);
      expect(cp.facts.blocking_outstanding_question_count).toBeGreaterThanOrEqual(0);
      expect(codes(cp)).not.toContain('open_oq_without_owner_closure');
      expect(codes(cp)).not.toContain('blocking_outstanding_question_present');
      expect(codes(cp)).not.toContain('checkpoint_claims_ready');

      // 6) design partial + unread 非空 + 无 owner acceptance -> 两个 design blocker
      const designBad = path.join(tmpDir, 'g-requirements.md');
      fs.writeFileSync(designBad, buildPrd({
        oq: [
          '| id | question | PRD write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |',
          '| --- | --- | --- | --- | --- | --- | --- | --- |',
          '| OQ-6 | 文案 | Requirements | no | source-resolved | no | closed | docs/x.md:1 |',
        ],
        designCoverage: 'visual-read=partial',
      }).replace('## Readiness Self-Check', 'design_sources_unread:\n- node-123 设计稿未读\n## Readiness Self-Check'), 'utf8');
      const dCodes = codes(run(designBad));
      expect(dCodes).toContain('design_partial_coverage_unaccepted');
      expect(dCodes).toContain('design_unread_without_owner_acceptance');

      // 7) inputs-hash 相对/绝对路径一致
      const inputFile = path.join(tmpDir, 'input.md');
      fs.writeFileSync(inputFile, 'design figma node-id=1-2', 'utf8');
      const absRun = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, owned, '--inputs', inputFile], { encoding: 'utf8' }));
      const relRun = JSON.parse(execFileSync('node', [PRD_ARTIFACT_SCRIPT_PATH, owned, '--inputs', path.relative(process.cwd(), inputFile)], { encoding: 'utf8', cwd: process.cwd() }));
      expect(absRun.facts.ready_receipt_inputs_hash).toBe(relRun.facts.ready_receipt_inputs_hash);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

// U8 (R21 / S4a):停点 SSOT 防漂移 lint。
// SKILL.md `Canonical: 四个合法停点` 是四元组停点的唯一真相源,他处只能 by-reference。
// 这条 lint 只锁「四元组四词在同一行枚举式共现」这一字面形态——绝不锁 posture 措辞
// (relentless / keep going by default 等对抗早停先验的 load-bearing 强化),绝不升级为语义复述检测,
// 绝不进 artifact BLOCKING_REASON_CODES(那会违反 KTD14)。它是 source-lint,不是 checker reason_code。
describe('spec-prd canonical stop-point SSOT anti-drift lint (U8/R21)', () => {
  // 四个停点 token。判据:同一行同时出现全部四个 = 四元组逐字复述(疑似漂移)。
  const STOP_TOKENS = [/\bleaf\b/, /\bsource-resolved\b/, /\bowner-capped\b/, /how-pushdown/];

  // 豁免落点:四元组的合法定义点与 fixture,允许全词共现。
  // - SKILL.md `## Canonical: 四个合法停点` 小节内部(定义 + Light contract field mapping)
  // - evals/examples.json 的 fixture(eval 语料本就要复现 Canonical 措辞)
  function collectStopPointFourTupleLines() {
    const files = [];
    const refsDir = path.join(SKILL_DIR, 'references');
    for (const f of fs.readdirSync(refsDir)) {
      if (f.endsWith('.md')) files.push(path.join(refsDir, f));
    }
    files.push(SKILL_PATH);
    files.push(EVALS_PATH);

    const hits = [];
    for (const file of files) {
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      // 标记 SKILL.md 的 Canonical 小节范围(豁免区)。
      let inCanonical = false;
      lines.forEach((line, idx) => {
        if (file === SKILL_PATH) {
          if (/^##\s+Canonical:\s*四个合法停点/.test(line)) {
            inCanonical = true;
            return;
          }
          if (inCanonical && /^##\s+/.test(line)) {
            inCanonical = false;
          }
        }
        const allFour = STOP_TOKENS.every((re) => re.test(line));
        if (!allFour) return;
        const isExempt =
          (file === SKILL_PATH && inCanonical) ||
          file === EVALS_PATH;
        if (!isExempt) {
          hits.push(`${path.relative(REPO_ROOT, file)}:${idx + 1}`);
        }
      });
    }
    return hits;
  }

  test('no reference file restates the four-tuple stop points outside the canonical SSOT', () => {
    const violations = collectStopPointFourTupleLines();
    expect(violations).toEqual([]);
  });

  test('the canonical SSOT itself still defines the four stop points', () => {
    const skill = fs.readFileSync(SKILL_PATH, 'utf8');
    // 定义点必须仍在,否则 by-reference 指针会悬空。
    expect(skill).toContain('## Canonical: 四个合法停点');
    const canonicalSection = skill.slice(skill.indexOf('## Canonical: 四个合法停点'));
    for (const re of STOP_TOKENS) {
      expect(re.test(canonicalSection)).toBe(true);
    }
  });

  test('posture wording is not touched by the lint (lint locks only the four-token enumeration)', () => {
    // 反向保护:posture 句(relentless 等)单独出现不应被判为违规。
    const postureOnly = 'walk down each load-bearing branch one question at a time, relentless by default';
    const allFour = STOP_TOKENS.every((reToken) => reToken.test(postureOnly));
    expect(allFour).toBe(false);
  });
});
