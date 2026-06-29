'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SKILL_PATH = path.join(__dirname, '..', '..', 'skills', 'spec-work', 'SKILL.md');
const SHIPPING_WORKFLOW_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-work',
  'references',
  'shipping-workflow.md',
);
const TRACKER_DEFER_PATH = path.join(
  __dirname,
  '..',
  '..',
  'skills',
  'spec-work',
  'references',
  'tracker-defer.md',
);

describe('spec-work context orientation contract', () => {
  test('uses plan/task-pack guided direct reads without hidden hooks', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    expect(text).toContain('Context Orientation Anchor');
    expect(text).toContain('the plan or task pack');
    expect(text).toContain('nearby implementation files');
    expect(text).toContain('nearby tests');
    expect(text).toContain('git diff or changed files');
    expect(text).toContain('already-loaded host/project instructions');
    expect(text).toContain('not automatic re-read targets for every work run');
    expect(text).toContain('Host Instruction Reuse Policy allows it');
    expect(text).not.toContain('AGENTS.md` / `CLAUDE.md` / project role docs');
    expect(text).toContain('project-guidance facts');
    expect(text).not.toContain('docs/examples/standards-glue-consumption-examples.md');
    expect(text).not.toContain('.spec-first/standards/');
    expect(text).not.toContain('glue-map.json');
    expect(text).toContain('Scope expansion is judged against the plan/task pack and concrete diff');
    expect(text).toContain('Use this intake order for context economy');
    expect(text).toContain('first read the plan/task summary and contract metadata');
    expect(text).toContain('then deterministic inventory or validation facts');
    expect(text).toContain('then current task/phase refs');
    expect(text).toContain('then focused source-of-truth sections');
    expect(text).toContain('only then deeper references');
    expect(text).toContain('do not create a new external-tool facts pipeline');
    expect(text).toContain('provenance-backed rejected/out-of-scope rationale');
    expect(text).toContain('advisory boundary evidence');
    expect(text).toContain('do not treat rejected rationale as task status');
    expect(text).toContain('Direct Evidence Boundary');
    expect(text).toContain('Work does not require external-tool readiness before ordinary implementation.');
    expect(text).toContain('Use direct source reads, `rg`, ast-grep, git diff, focused tests, logs, package metadata, and user-provided artifacts');
    expect(text).toContain('claims that the direct evidence supports');
    expect(text).toContain('Workspace Repo Scope');
    expect(text).toContain('bounded direct reads of candidate repos');
    expect(text).toContain('single `target_repo` or per-unit/per-task `target_repo`');
    expect(text).toContain('actual `git status` changes belong to the selected child repo');
    expect(text).not.toContain('stage0-context');
    expect(text).not.toContain('selected_assets');
  });

  test('consumes domain context before implementation questions without fixed ADR directory mandates', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Domain Language And Decision Ledger');
    expect(text).toContain('consume existing context before asking questions that repo/docs can answer');
    expect(text).toContain('already-loaded project standards and host instructions, `docs/contracts/`, existing brainstorms/plans/solutions');
    expect(text).toContain('Read `AGENTS.md` / `CLAUDE.md` source only under the Host Instruction Reuse Policy');
    expect(text).toContain('repo-local glossary or ADR-like artifacts that actually exist');
    expect(text).toContain('Do not require a fixed `CONTEXT.md`, `docs/adr/`, or glossary directory.');
    expect(text).toContain('If those artifacts are absent, treat the gap as advisory and continue');
    expect(text).toContain('`question`, `recommended_answer`, `source_tag`, `chosen_answer`, `consequence`, and `deferred_reason`');
    expect(text).toContain('`confirmed`, `advisory`, `session-local`, `stale`, or `user`');
    expect(text).toContain('hard to reverse, would be surprising without context, and reflects a real tradeoff');
    expect(text).not.toContain('must use `CONTEXT.md`');
    expect(text).not.toContain('must use `docs/adr/`');
  });

  test('uses feedback-loop-first execution without forcing TDD on docs-only work', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Feedback Loop And Vertical Slices');
    expect(text).toContain('Before changing behavior, establish or attempt the smallest feedback loop that can observe the current slice');
    expect(text).toContain('failing or characterization test, CLI invocation, HTTP/browser script, trace replay, throwaway harness, property/fuzz loop');
    expect(text).toContain('docs contract check, schema validation, or other focused command');
    expect(text).toContain('record `feedback_loop_not_possible` with the exact missing condition before editing');
    expect(text).toContain('After the slice lands, rerun the same loop or record why it could not be rerun');
    expect(text).toContain('Prefer vertical tracer bullets when scope permits');
    expect(text).toContain('Do not split work into "write all tests first across every unit, then implement everything" when independent vertical slices can be verified');
    expect(text).toContain('Docs-only and config-only tasks use docs contract checks, schema/help/render checks, or diff-shape checks as the feedback loop');
    expect(text).toContain('do not force TDD where no behavior-bearing code changes');
  });

  test('consumes plan direct evidence without expanding implementation scope', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const shipping = fs.readFileSync(SHIPPING_WORKFLOW_PATH, 'utf8');

    expect(text).toContain('If the plan contains a direct evidence or current-state section');
    for (const field of ['source refs', 'limitations', 'required verification']) {
      expect(text).toContain(field);
    }
    expect(text).toContain('advisory implementation focus');
    expect(text).toContain('Any implementation or risk claim still needs current source, diff, test, log, or user-provided evidence');
    expect(text).toContain('Apply the downstream non-expansion rule');
    expect(text).toContain('not silently added to the implementation unit');
    expect(text).toContain('resolve an explicit `target_repo` or per-unit/per-task repo scope before writing files');

    expect(shipping).toContain('Direct evidence used (when applicable)');
    expect(shipping).toContain('direct_evidence_used');
    for (const field of [
      'source_refs',
      'checks_or_logs',
      'repo_scope',
      'limitations',
    ]) {
      expect(shipping).toContain(field);
    }
    expect(shipping).toContain('Omit the section when the ordinary changed-file/test summary is enough');
  });
});

describe('spec-work run artifact boundary contract', () => {
  test('keeps run artifact integration bounded to durable closeout evidence', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const shipping = fs.readFileSync(SHIPPING_WORKFLOW_PATH, 'utf8');

    expect(text).toContain('Run Artifact Boundary');
    expect(text).toContain('write-side contract');
    expect(text).toContain('producer_available=true');
    expect(text).toContain('spec-work-run-artifact/v2');
    expect(text).toContain('script_confirmed.validation');
    expect(text).toContain('run_summary_ref');
    expect(text).toContain('verification-run-summary.v1');
    expect(text).toContain('spec-work-run-artifact-payload/v2');
    expect(text).toContain('workflow_integrated');
    expect(text).toContain('.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/run.json');
    expect(text).toContain('The writer treats each workspace/run-id pair as immutable');
    expect(text).toContain('returns `artifact-already-exists` and does not overwrite it');
    expect(text).toContain('durable evidence triggers');
    expect(text).toContain('producer.reason_code');
    expect(text).toContain('prefer the explicitly named workspace-slug/run-id artifact');
    expect(text).toContain('latest-artifact lookup is a fallback only');
    expect(text).toContain('Do not treat run evidence as source scope authority');
    expect(shipping).toContain('Evaluate Durable Evidence Triggers');
    expect(shipping).toContain('Build Structured Verification Closeout');
    expect(shipping).toContain('spec-first internal verification-profile load');
    expect(shipping).toContain('spec-first internal verification-run-summary record');
    expect(shipping).toContain('spec-first internal honest-closeout validate');
    expect(shipping).toContain('natural-language-only assertions are honest-but-unverifiable');
    expect(shipping).toContain('decision_input_health=warn|error');
    expect(shipping).toContain('verification-run-summary.v1` check has `status=not-run`');
    expect(shipping).toContain('spec-work-run-artifact-payload/v2');
    expect(shipping).toContain('Do not include `script_confirmed.validation.commands[]`');
    expect(shipping).toContain('spec-first internal spec-work-run-artifact write');
    expect(shipping).toContain('producer.workflow_integrated=true');
    expect(shipping).toContain('trigger-task-pack');
    expect(shipping).toContain('no-trigger-matched');
  });
});

describe('spec-work requirements and shipping policy contract', () => {
  test('reads Requirements as the current plan section while preserving legacy compatibility', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const shipping = fs.readFileSync(SHIPPING_WORKFLOW_PATH, 'utf8');

    expect(text).toContain('`Requirements` (or legacy `Requirements Trace`)');
    expect(text).toContain('Quality Check and Finishing Work');
    expect(text).toContain('you must read `references/shipping-workflow.md`');
    expect(text).toContain('Do not skip this.');
    expect(shipping).toContain('If the plan has a `Requirements` section (or legacy `Requirements Trace`)');
  });

  test('shipping review tiers use real host-native review or spec-code-review fallback', () => {
    const shipping = fs.readFileSync(SHIPPING_WORKFLOW_PATH, 'utf8');

    expect(shipping).toContain('Tier 1 -- host-native code review');
    expect(shipping).toContain('real built-in code review command or skill');
    expect(shipping).toContain('Do not treat ordinary self-review as Tier 1.');
    expect(shipping).toContain('Tier 2 -- `spec-code-review`');
    expect(shipping).toContain('No host-native review exists');
    expect(shipping).toContain('Sensitive surface touched');
    expect(shipping).toContain('Large and diffuse change');
    expect(shipping).toContain('Very large change');
    expect(shipping).toContain('Plan or task explicitly requests it');
    expect(shipping).toContain('Task-level review focus requests it');
    expect(shipping).toContain('This Tier 2 escalation does not require `review_gate: required`');
    expect(shipping).toContain('required gate by itself only requires the diff-scoped report-only checkpoint');
    expect(shipping).toContain('Code review completed (Tier 1 host-native or Tier 2 `spec-code-review`)');
    expect(shipping).not.toContain('inline self-review');
    expect(shipping).not.toContain('/simplify');
    expect(shipping).not.toContain('ce-simplify-code');
    expect(shipping).not.toContain('spec-simplify-code');
    expect(shipping).not.toContain('ce-code-review');
  });

  test('shipping notification includes verification and residual status in the final user response', () => {
    const shipping = fs.readFileSync(SHIPPING_WORKFLOW_PATH, 'utf8');

    expect(shipping).toContain('Completion Response Contract');
    expect(shipping).toContain('final user-visible response must be compact but complete');
    expect(shipping).toContain('Completed: <what changed and the main files or artifact paths>');
    expect(shipping).toContain('Verification: <commands/checks run with pass/fail/not-run status>');
    expect(shipping).toContain('Review: <review tier or workflow used, plus residual status>');
    expect(shipping).toContain('Artifacts: <PR link, plan/task-pack path, evidence, or known-residuals path when applicable>');
    expect(shipping).toContain('Next action: <only if the user needs to do something now>');
    expect(shipping).toContain('If a check was not run, say `not run` with the concrete reason from `verification-run-summary.v1`.');
    expect(shipping).toContain('If a validation claim lacks structured evidence, say `degraded` with the `honest-closeout.v1` reason code.');
    expect(shipping).toContain('omit `Next action` instead of inventing follow-up work');
  });

  test('shipping notification can recommend compound only for reusable lessons', () => {
    const shipping = fs.readFileSync(SHIPPING_WORKFLOW_PATH, 'utf8');

    expect(shipping).toContain('Learning-worthy compound check');
    expect(shipping).toContain('LLM-owned judgment, not a script classifier');
    expect(shipping).toContain('Skip silently');
    expect(shipping).toContain('mechanical fixes');
    expect(shipping).toContain('one-off docs edits');
    expect(shipping).toContain('formatting-only changes');
    expect(shipping).toContain('cannot be stated in one sentence');
    expect(shipping).toContain('Offer neutrally');
    expect(shipping).toContain('reusable diagnostic path');
    expect(shipping).toContain('Lean into the offer');
    expect(shipping).toContain('pattern appears in 3+ places');
    expect(shipping).toContain('current host\'s compound entrypoint with brief context');
    expect(shipping).toContain('Do not automatically run `spec-compound`');
    expect(shipping).toContain('do not write `docs/solutions/`');
    expect(shipping).toContain('do not make compound capture a completion gate');
    expect(shipping).not.toContain('$spec-compound-auto');
    expect(shipping).not.toContain('/spec:compound-auto');
    expect(shipping).not.toContain('spec-first compound-auto');
  });

  test('tracker defer uses emitted review artifact path instead of hardcoded /tmp', () => {
    const trackerDefer = fs.readFileSync(TRACKER_DEFER_PATH, 'utf8');

    expect(trackerDefer).toContain('the `spec-code-review` return named a parent-owned run artifact path');
    expect(trackerDefer).toContain('`<artifact-path>/<reviewer>.json`');
    expect(trackerDefer).toContain('Do not hardcode `/tmp`');
    expect(trackerDefer).toContain('on Windows the temp root may be `%TEMP%`');
    expect(trackerDefer).toContain('review workflow\'s returned artifact path is the authority');
    expect(trackerDefer).toContain('continued in spec-code-review run artifact: <artifact-path>');
    expect(trackerDefer).not.toContain('/tmp/spec-first/spec-code-review/<run-id>');
  });
});

describe('spec-work task-pack identity contract', () => {
  test('rejects missing or mismatched spec_id before creating execution tasks', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('read `spec_id` from the task pack and source plan');
    expect(text).toContain('If the task pack lacks `spec_id`, stop as missing identity');
    expect(text).toContain('reject the task pack as wrong-chain handoff before implementation');
    expect(text).toContain('missing-spec-id, spec-id-mismatch');
    expect(text).toContain('Do not treat it as execution state or completion status');
  });

  test('keeps validated task packs as first-class executable work documents', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Treat a validated task pack as a first-class executable work document.');
    expect(text).toContain('The task pack supplies execution order, task boundaries, file focus, `stop_if`, and validation notes');
    expect(text).toContain('after selecting the current task, read the task card\'s `source_unit`, `requirement_refs`, `context_refs`, `test_focus`, `done_signal`, and `stop_if`');
    expect(text).toContain('then read the focused source-plan sections that define those anchors before editing');
    expect(text).toContain('`context_refs` are bounded reading pointers, not scope authority');
    expect(text).toContain('whole plan or broad directories');
    expect(text).toContain('source-plan focused reads must check the relevant implementation unit, requirement / acceptance refs, scope boundaries, non-goals, and any deferred implementation notes');
    expect(text).toContain('If the work document is already a validated task pack, do not offer task compilation again');
    expect(text).toContain('do not rebuild execution structure from the source plan');
    expect(text).toContain('Execute from the task pack\'s validated task structure');
    expect(text).toContain('For large plans with phase/wave task packs, consume only the current phase/wave task pack plus its focused source-plan refs.');
    expect(text).toContain('Direct execution of the whole large plan requires an explicit reason in closeout');
    expect(text).toContain('Requires plan-unit metadata or validated task-card metadata');
    expect(text).toContain('The full work-document path. If it is a task pack, also pass the `source_plan` path');
    expect(text).toContain('task-card equivalents (`task_id`, `dependencies`, `wave`, `files`, `test_focus`, `done_signal`, `stop_if`, `review_gate`, `review_focus`)');
    expect(text).toContain('Read any referenced files from the plan, task pack, or discovered during Phase 0');
    expect(text).toContain('If the work document is a task pack, use `Task Cards`, `Execution Waves`, `dependencies`, and `task_id`');
  });

  test('task-pack shipping completes the source plan, not the derived task pack', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const shipping = fs.readFileSync(SHIPPING_WORKFLOW_PATH, 'utf8');

    expect(text).toContain('for validated task-pack input, do not change the task pack\'s `status: derived`');
    expect(text).toContain('because it records derivation/validation posture rather than execution progress');
    expect(text).toContain('update its `source_plan` frontmatter `status: active → completed`');
    expect(text).toContain('because the source plan is the completion authority');
    expect(text).toContain('record the concrete `completion_status.reason_code` in closeout');

    expect(shipping).toContain('Resolve Completion Status Target');
    expect(shipping).toContain('If the work input is a validated task pack');
    expect(shipping).toContain('do **not** change the task pack\'s `status: derived`');
    expect(shipping).toContain('records derivation/validation posture rather than execution progress');
    expect(shipping).toContain('read the task pack frontmatter `source_plan`');
    expect(shipping).toContain('update that source plan\'s frontmatter `status: active -> completed`');
    expect(shipping).toContain('source plan is the scope and completion authority for task-pack execution');
    expect(shipping).toContain('completion_status.reason_code');
    expect(shipping).toContain('task-pack-source-plan-missing');
    expect(shipping).toContain('source-plan-unreadable');
    expect(shipping).toContain('source-plan-status-not-active');
    expect(shipping).toContain('scope-not-fully-completed');
    expect(shipping).toContain('Do not add per-unit progress state');
  });

  test('preserves task-pack review gates as bounded review intent', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');
    const shipping = fs.readFileSync(SHIPPING_WORKFLOW_PATH, 'utf8');

    expect(text).toContain('preserve each task\'s `review_gate` and `review_focus` as review intent metadata');
    expect(text).toContain('do not treat either field as progress state, approval state, or source-plan scope authority');
    expect(text).toContain('for `review_gate: required`, treat the task as a task completion checkpoint');
    expect(text).toContain('record `pre_task_base` or an equivalent diff anchor');
    expect(text).toContain('spec-code-review mode:report-only base:<pre_task_base> plan:<source_plan>');
    expect(text).toContain('if a reliable per-task diff range cannot be formed, stop and hand off');
    expect(text).toContain('P0/P1 or any actionable finding directly matching the task\'s `review_focus`');
    expect(text).toContain('same dependency/wave-boundary required gates may be batched');
    expect(text).toContain('terminal required tasks must still be covered before Phase 3 completes');
    expect(text).toContain('`review_gate: optional` is advisory');
    expect(shipping).toContain('Task-level review focus requests it');
    expect(shipping).toContain('does not force full multi-persona autofix review');
  });

  test('plan-path suitability check recommends task compilation from plan structure', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('recommend the diversion once only when source plan structure shows high execution complexity');
    expect(text).toContain('many implementation units, declared `Files`, dependency chains, cross-module surfaces, broad verification spread, or `plan_depth: deep`');
    expect(text).toContain('the reason is to reduce single-run context load, broad review scope, and coupled rollback cost');
    expect(text).toContain('if the user chooses task compilation, pause plan execution');
    expect(text).toContain('if the user chooses direct execution, continue with `before-work --plan`');
    expect(text).not.toContain('offer the diversion once only when the plan has strong signals');
    expect(text).not.toContain('automatically compile a task pack');
  });
});

describe('spec-work subagent isolation contract', () => {
  test('uses a host capability matrix instead of assuming shared-directory or worktree behavior', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Host capability matrix');
    expect(text).toContain('Claude Code `Agent` with worktree isolation');
    expect(text).toContain('Pass `isolation: "worktree"` and `run_in_background: true`');
    expect(text).toContain('Codex `spawn_agent` / forked workspace');
    expect(text).toContain('Do not pass or claim Claude\'s `isolation: "worktree"` parameter');
    expect(text).toContain('If files overlap, dispatch serially');
    expect(text).toContain('Shared-directory fallback constraints');
    expect(text).toContain('worktree-isolated mode');
    expect(text).toContain('git worktree remove <absolute-path>');
    expect(text).toContain('Shared-directory fallback or Codex fork-workspace handoff');
  });
});

describe('spec-work host entrypoint contract', () => {
  test('routes oversized work back through the current host entrypoint', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('Oversized intake and handoff');
    expect(text).toContain('current host\'s brainstorm or plan entrypoint');
    expect(text).toContain('If the input is a bare prompt and the product WHAT is unclear, recommend the current host\'s brainstorm entrypoint');
    expect(text).toContain('If the desired outcome is clear but no settled plan exists, return to the current host\'s plan entrypoint');
    expect(text).toContain('offer the standalone `spec-write-tasks` diversion once');
    expect(text).toContain('Do not describe task compilation as a command-backed workflow entrypoint');
    expect(text).toContain('If execution discovers scope beyond the plan/task pack');
    expect(text).toContain('Do not expand scope in place.');
    expect(text).toContain('Do not invent human-time phases');
    expect(text).not.toContain('would benefit from `/spec:brainstorm` or `/spec:plan`');
    expect(text).not.toContain('return to `/spec:plan` to reduce scope');
    expect(text).not.toContain('/spec:brainstorm` / `/spec:plan` on Claude Code');
    expect(text).not.toContain('$spec-brainstorm` / `$spec-plan` on Codex');
    expect(text).not.toContain('current host\'s plan entrypoint (`/spec:plan` on Claude Code, `$spec-plan` on Codex)');
    expect(text).not.toContain('/spec:write-tasks');
    expect(text).not.toContain('/spec:spec-write-tasks');
    expect(text).not.toContain('$spec-write-tasks');
  });

  test('gives users a compact handoff when execution cannot continue safely', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    expect(text).toContain('User-Facing Handoff Contract');
    expect(text).toContain('do not stop with only "return to spec-plan" or a bare workflow name');
    expect(text).toContain('Blocking reason: <specific reason execution cannot continue safely>');
    expect(text).toContain('Recommended entrypoint: <current-host public entrypoint or standalone skill name>');
    expect(text).toContain('Next action: <copy-ready invocation or short reply phrase>');
    expect(text).toContain('Context to carry: <plan/task-pack path, failed validation command, stop_if, target_repo gap, or scope evidence when applicable>');
    expect(text).toContain('something the user can immediately run or approve');
    expect(text).toContain('do not give a menu of every possible workflow');
  });

  test('task-pack evidence recheck does not delegate semantic quality to CLI', () => {
    const text = fs.readFileSync(SKILL_PATH, 'utf8');

    // spec-work must require evidence recheck after deterministic validation
    expect(text).toContain('deterministic identity, freshness, and structure checks are necessary but not sufficient');
    expect(text).toContain('reviewed-existing');
    expect(text).toContain('unchecked-existing');
    // CLI must not judge semantic sufficiency
    expect(text).not.toContain('CLI proves semantic');
    expect(text).not.toContain('validator certifies semantic');
  });
});
