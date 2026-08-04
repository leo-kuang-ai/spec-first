---
name: spec-work
description: Execute a settled plan, validated task pack, spec path, or concrete implementation request end-to-end. Use spec-debug for open-ended bugs; stop when target repo, scope, source ownership, or required authorization is unresolved.
argument-hint: "[Plan doc path or description of work. Blank to auto use latest plan doc]"
---

# Work Execution Command

Execute work efficiently while maintaining quality and finishing features.

## Introduction

This command takes a work document (plan or specification) or a bare prompt describing the work, and executes it systematically. The focus is on **shipping complete features** by understanding requirements quickly, following existing patterns, and maintaining quality throughout.

## Workflow Contract Summary

- **Inputs:** settled implementation-ready code plan, validated task pack, explicit knowledge-work plan, or concrete bounded implementation prompt.
- **Outputs:** scoped source changes, task/unit evidence, required review/residual posture, structured verification closeout, and an authorization-aware handoff. A task pack remains derived; its source plan owns scope/lifecycle.
- **Hard exits:** unresolved target repo/dirty overlap/source owner, requirements-only or invalid unified metadata, task-pack/source-plan drift, scope-changing acceptance/architecture/provider/source-runtime discovery, failed required review/verification, or missing mutation/commit/landing authority for the requested exit.
- **Ownership:** scripts prepare deterministic facts; LLMs judge semantic fit. Canonical source is modified; generated runtime mirrors are never source fixes. Local mutation, commit, landing, lifecycle, and durable evidence are separate exits.
- **Consumers:** `spec-code-review`, caller-owned LFG/goal flows, commit/PR/release workflows, `spec-compound`, and human reviewers.

## Reference Trigger Map

| Reference | Trigger | If unread/unavailable |
| --- | --- | --- |
| [Work intake and task pack](references/work-intake-and-task-pack.md) | Shallow metadata says `type: task-pack`. | Do not execute the pack; return validation/regeneration handoff. |
| [Non-code execution](references/non-code-execution.md) | Metadata says `execution: knowledge-work`. | Do not enter code/shipping lifecycle; report the missing production route. |
| [Execution strategy](references/execution-strategy.md) | Before first write/test/review-fix, task tracking, worker dispatch, commit, or landing. | Lock repo/source/dirty facts inline; use inline/serial; no commit or landing claim. |
| [Execution engines](references/execution-engines.md) | A structured plan/task pack or explicit request makes goal/dynamic/worker engine selection relevant. | Use inline; do not infer a callable non-default engine. |
| [Feedback and tests](references/feedback-and-tests.md) | Before behavior mutation, test design, or verification coverage claim. | Run the narrowest known check and do not claim system-wide coverage. |
| [Implementation quality](references/implementation-quality.md) | Before durable-surface mutation or phase-boundary simplification. | Do not add a new durable surface; return to the plan owner if current source fit is unresolved. |
| [Shipping workflow](references/shipping-workflow.md) | All implementation tasks are accounted for and quality/closeout begins. | No completion/lifecycle/commit/landing claim. |
| [Review findings followup](references/review-findings-followup.md) | A completed review returned actionable caller-owned findings. | Preserve in-band findings/limitations; do not rerun or silently drop them. |
| [Tracker defer](references/tracker-defer.md) | Residual gate explicitly selects external tracker deferral. | Return structured `no_sink`; do not lose residuals or infer external authority. |

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md`.
Overrides: high-risk

- `foreign-residual-workspace` -> `blocked-action-required`: stop before source writes, behavior-bearing tests that rely on suspect local artifacts, review fixes, commits, lifecycle mutation, or PR-ready claims until the named cleanup/init action runs or the user explicitly accepts degraded evidence.
- optional external-tool evidence unavailable -> `fallback-only`: use bounded direct source, test, log, diff, and user-provided evidence; disclose the missing capability and do not claim unconfirmed impact or coverage.
- `non-git-build-workspace` coverage gaps -> `partial`: keep work inside explicit `target_repo`/covered roots and directly inspect any uncovered build module before changing or claiming behavior there.

## Input Document

<input_document> #<invocation arguments supplied by the current host> </input_document>

## Execution Workflow

### Phase 0: Input Triage

**First, parse a leading mode token.** If `<input_document>` begins with `mode:return-to-caller` (or the legacy aliases `mode:caller-owned-tail` / `caller:lfg`), strip that token before anything else: the remainder of the string is the plan path, and this run executes in **Return-to-Caller Mode** (see § Return-to-Caller Mode) — implement and locally verify only, then return the structured envelope instead of running the standalone shipping tail. Classify the stripped plan path with the rules below. A mode token with no following path is an error: report it rather than treating `mode:return-to-caller` as a bare prompt.

Determine how to proceed based on what was provided in `<input_document>` (after any mode token is stripped).

The classification order is `mode token -> file metadata -> task pack -> unified plan -> legacy plan / knowledge-work -> bare prompt`. Do not classify by filename alone.

**File document** (input is a path to an existing plan, specification, or task pack): read only the metadata first — YAML frontmatter for Markdown, or visible header metadata for HTML.

If Markdown metadata carries `type: task-pack`, do not read the full task-pack body before this classification. Load `references/work-intake-and-task-pack.md` and follow its deterministic validation, source-plan replay, semantic-fit, Task Pack Contract/Waves, drift, task review, failure handoff, and lifecycle rules. A validated task pack is a first-class execution input, but its source plan remains authoritative and the task pack stays `status: derived`. This branch replaces the remaining file classification; after successful intake, continue Phase 1 with the resolved source plan plus validated contract.

For a declared unified artifact, validate critical metadata before classification. Duplicate critical metadata, missing `artifact_readiness` or `execution`, or a conflict between visible HTML metadata and content shape is invalid. Fail closed to a `spec-plan <plan-path>` repair handoff; do not normalize, merge, or guess the intended value. This validation applies only after the artifact declares `artifact_contract: spec-unified-plan/v1`; a truly legacy plan with no unified contract remains on the compatibility path below.

- If it carries `artifact_contract: spec-unified-plan/v1`, classify `artifact_readiness` before reading the body.
  - `artifact_readiness: requirements-only` -> stop and tell the user this Product Contract needs `spec-plan` enrichment before implementation. Offer the exact `spec-plan <plan-path>` handoff.
  - `artifact_readiness: implementation-ready` plus `execution: code` -> continue to Phase 1 using the unified-plan reader strategy below.
  - Any other readiness value or any non-code/unclassified execution mode -> do not auto-execute as code. Route `execution: knowledge-work` to the non-code carve-out; otherwise ask the user to return to `spec-plan` to produce an implementation-ready code plan.
  - Progress-like values (`active`, `in_progress`, `completed`, `done`) are invalid readiness values. Stop and ask for plan repair rather than guessing.
- If it carries `execution: knowledge-work`, this is a **non-code plan** — read `references/non-code-execution.md` and follow that carve-out instead of the rest of this workflow.
- Otherwise (legacy plan, field absent, or `execution: code`) -> continue to Phase 1 and run the normal code lifecycle. Exception: metadata that carries a progress-like `artifact_readiness` value (`active`, `in_progress`, `completed`, `done`) without declaring the unified contract is still an invalid readiness marker, not a legacy plan — stop and ask for plan repair exactly as in the declared-contract branch instead of silently entering the code lifecycle.

**Blank invocation latest-plan discovery:** when `<input_document>` is blank, glob `docs/plans/*.md` and `docs/plans/*.html`, inspect metadata for the newest candidates, and only auto-select a plan that is `artifact_readiness: implementation-ready` plus `execution: code` or a legacy code plan. Stop instead of silently executing when the newest matching artifact is requirements-only, `execution: knowledge-work`, an approach-plan, or an unclassified universal/answer-seeking output. Ask for an explicit path or a `spec-plan` enrichment step. **Superseded sibling:** if a requirements-only candidate has a same-basename file in the other format (`<basename>.md` / `<basename>.html`) that is `implementation-ready`, a format conversion left the requirements-only copy stale — select the implementation-ready sibling and execute it rather than stopping.

**Bare prompt** (input is a description of work, not a file path):

1. **Scan the work area**

   - Identify files likely to change based on the prompt
   - Find existing test files for those areas (search for test/spec files that import, reference, or share names with the implementation files)
   - Note local patterns and conventions in the affected areas

2. **Assess complexity and route**

   | Complexity | Signals | Action |
   |-----------|---------|--------|
   | **Trivial** | 1-2 files, no behavioral change (typo, config, rename) | Proceed to Phase 1 step 2 (execution boundary), then implement directly — no task list, no execution loop. Apply Test Discovery if the change touches behavior-bearing code |
   | **Small / Medium** | Clear scope, under ~10 files | Build a task list from discovery. Proceed to Phase 1 step 2 |
   | **Large** | Cross-cutting, architectural decisions, 10+ files, touches auth/payments/migrations | Inform the user this would benefit from `spec-brainstorm` or `spec-plan` to surface edge cases and scope boundaries. Honor their choice. If proceeding, build a task list and continue to Phase 1 step 2 |

---

### Phase 1: Quick Start

1. **Read Plan and Clarify** _(skip if arriving from Phase 0 with a bare prompt)_

   - For validated task-pack input, treat the resolved `source_plan` as the plan read below and use only the machine-readable `Task Pack Contract`/`execution_waves` for task creation. Follow `references/work-intake-and-task-pack.md`; do not re-split from the source plan or human-readable cards.
   - For unified plans, size your read. A short plan (lightweight or requirements-only, a screen or two) can be read in full. For a long implementation-ready plan, do **not** read the whole document first — it is expensive and unnecessary. Build a section map, then read only what the active unit needs: metadata, then `Goal Capsule`, `Verification Contract`, `Definition of Done`, the `Implementation Units` heading list, and only the active U-ID section plus referenced R/F/AE/KTD excerpts. Read appendices or unrelated U-IDs only when the active unit cites them. To build the map: in **markdown** scan headings (`rg -n '^#{1,3} ' <plan>` — top-level sections plus `### U<N>.` units); in **HTML** scan the `<h1>`–`<h3>` heading elements and their anchor ids. Match on the stable section names / unit IDs (`Goal Capsule`, `Verification Contract`, `### U<N>.`, …), ignoring HTML wrapper tags — not on a format-specific pattern.
   - For legacy plans, read the work document completely. Both formats (`.md`, `.html`) carry the same section names and IDs; HTML just wraps them in semantic elements (`<section>`, `<article>`, etc.).
   - Treat the plan as a decision artifact, not an execution script
   - If the plan includes sections such as `Implementation Units`, `Work Breakdown`, `Requirements` (or legacy `Requirements Trace`), `Files`, `Test Scenarios`, or `Verification`, use those as the primary source material for execution
   - Check for `Execution note` on each implementation unit — these carry the plan's natural-language execution direction for that unit (for example, start from failing proof, characterize legacy behavior, or prefer smoke/runtime verification). Note them when creating tasks, but do not reduce them to keyword matching.
   - Check for a `Deferred to Implementation` or `Implementation-Time Unknowns` section — these are questions the planner intentionally left for you to resolve during execution. Note them before starting so they inform your approach rather than surprising you mid-task
   - Check for a `Scope Boundaries` section — these are explicit non-goals. Refer back to them if implementation starts pulling you toward adjacent work
   - Review any references or links provided in the plan
   - For a direct implementation-ready plan whose unit count, dependency graph, context volume, or verification spread makes a derived index materially useful, suggest `spec-write-tasks` once as an optional path. Never auto-compile it and never block direct execution solely because a task pack would help.
   - If the user explicitly asks for TDD, test-first, characterization-first execution, or a specific verification style in this session, honor that direction even if the plan has no `Execution note`
   - If anything is unclear or ambiguous, ask clarifying questions now
   - If clarifying questions were needed above, get user approval on the resolved answers. If no clarifications were needed, proceed without a separate approval step — plan scope is the plan's authority, not something to renegotiate
   - **Do not skip this** - better to ask questions now than build the wrong thing
   - **Do not edit the plan body during execution.** The plan is a decision artifact; progress lives in git commits and the task tracker, not the plan. The only permitted plan mutation is the final shipping closeout transition described in `references/shipping-workflow.md`: after the completion gates close, the tail owner may use the deterministic helper to change a Markdown source plan from `active` to `completed`. This marker is not progress or completion evidence. Leaf workers, reviewers, and subagents never mutate plan status. Legacy `- [ ]` / `- [x]` marks remain ignored; per-unit completion is determined from current source and verification evidence.

2. **Establish Execution Boundary And Strategy**

   Read `references/execution-strategy.md` before the first write, behavior-bearing test, review fix, commit, or landing action. It is the owner for branch/worktree, task tracking, worker dispatch, parallel safety, integration, commit, and landing details.

   Hard anchors remain here:

   - Resolve one current Git root and, in a parent workspace, one explicit `target_repo` or per-task repo scope. Artifact `--repo` is not mutation authority.
   - Record pre-existing dirty paths and stop for overlapping user-owned edits unless an explicit bounded preservation strategy exists.
   - Modify canonical source of truth; generated runtime mirrors are not source fixes.
   - A necessary discovered file may join the actual changed set only with direct evidence that it completes existing scope. A scope-changing discovery involving acceptance, public contract, architecture, provider/repo boundary, or source ownership returns to `spec-plan`/task regeneration.
   - Missing worker dispatch authorization/capability falls back inline. Unknown isolation follows shared-directory rules.
   - Local implementation does not imply `commit_authorization`; commit does not imply `landing_authorization`. Without them, keep verified changes uncommitted and do not push/open a PR.

   **STOP — before the first behavior-bearing mutation, read `references/feedback-and-tests.md`.** It owns smallest feedback loop, vertical slicing, proof/characterization, test discovery, system-wide checks, and not-run replacement evidence. For a trivial non-behavioral edit, use the narrow obvious check and do not load or restate the full reference.

   **STOP — before adding or materially changing a durable surface, read `references/implementation-quality.md`.** Durable surfaces include dependencies, files, abstractions, helpers/wrappers/adapters, public/schema/runtime/provider/source-of-truth boundaries, workflow handoffs, generators, skills/agents, and artifact contracts. Recheck current source with `reuse / extend / compose / new`; if the active plan/task did not authorize the needed architecture decision, stop back instead of designing it during implementation. Ordinary bounded edits to an already-owned surface do not emit an architecture matrix or decision note.

   Apply the reference and record one run-local boundary: `target_repo`, current `HEAD`/branch, pre-existing dirty paths and overlap, canonical source owner, allowed/changed paths, scope-changing discoveries, worker dispatch authorization/capability/isolation, and separate mutation/commit/landing authorization. Branch or worktree mutation requires explicit authority; never pull/switch/create/rename merely because a plan exists. Default-branch commit still requires explicit confirmation.

   A necessary discovered file may join the changed set only when direct evidence shows it completes existing scope. Acceptance/public-contract/architecture/provider/repo/source-owner expansion returns to `spec-plan` or task regeneration. Unknown isolation follows shared-directory rules; missing dispatch authorization/capability runs inline. Workers never commit.

3. **Create Task List** _(skip if Phase 0 already built one, or if Phase 0 routed as Trivial)_

   - Validated task packs use only pinned `Task Pack Contract.tasks` and `execution_waves`; preserve `task_id`, dependencies, source refs, declared files, `stop_if`, and review intent.
   - Direct plans use implementation units/U-IDs, dependencies, files, scenarios, verification, execution notes, and patterns; do not invent code-level micro-steps or a parallel private plan.
   - Use the current host tracker when available; otherwise keep a run-local list. Track blockers and evidence, not commit existence.

4. **Choose Execution Engine, then Strategy**

   Read [Execution engines](references/execution-engines.md) only when plan shape or explicit direction makes a non-default engine relevant. Inline is the portable default. A non-default engine needs explicit authorization and current-session semantic capability, preserves task-pack checkpoints/structured returns, and never changes tail ownership.

   Before worker dispatch, inherit the full boundary from `references/execution-strategy.md` and record `worker_dispatch_authorization`, `capability_probe`, `worker_dispatch_capability`, `worker_context_isolation`, `worker_model_override`, and `worker_bounded_parallelism`, then normalize the path as `worker_dispatch_outcome`. Missing authorization forbids discovery and fixes `capability_probe: not_applicable` plus capability unknown. Only after authorization may the current-session registry/schema be consumed as `provider_untrusted` evidence. Use serial execution for dependencies, overlapping files/contracts/schema/config/lockfiles/generated outputs, shared environment singletons, or unknown bounded parallelism. Stop parallelizing after broad unplanned edits, repeated conflicts, or out-of-scope failures.

   Give each worker a bounded unit packet rather than the whole plan: Goal Capsule/DoD, active unit, relevant R/F/AE/KTD and Verification excerpts, files/patterns/scenarios/execution note, plus the triggered feedback/implementation-quality rules. Require changed paths and evidence fields in the return. The orchestrator verifies the actual tree, detects collisions/overwrites, integrates in dependency order, reruns authoritative checks, updates task state, and records one of `dispatch_authorization_missing`, `subagent_capability_missing`, or `worker_capability_unproven`, plus any isolation limitations.

## Anti-Rationalization Red Flags

| 红旗念头 | 停下来做什么 |
| --- | --- |
| 「测试大概会过，先声明完成」 | 跑匹配当前 slice 的真实验证，读取 exit/log，再声明 passed 或记录 not-run reason。 |
| 「计划写了 new wrapper，照着建就行」 | 读 current source，按 `reuse / extend / compose / new` 重查 owner；无 translation/sequencing/safety/evidence 边界的 wrapper 不创建。 |
| 「相邻代码顺手一起清理」 | 回到 active plan/task 与实际 changed set；非必要 debt 进入既有 residual/defer sink。 |
| 「临时文件或 orphan 留着不影响」 | 清理本次 run 造成的 orphaned source、test、reference、log 或 runtime artifact，并复跑对应 feedback loop。 |

这是注意力提醒,不是 gate,也不替代 LLM 判断;最终是否停下、如何处理仍由你按当前证据决定。

### Phase 2: Execute

1. **Task Execution Loop**

   Execute one dependency-ready unit/task at a time, or one bounded disjoint wave when dispatch/isolation facts allow it:

   1. Recheck task-pack/source-plan pins and `stop_if` when applicable; drift or stop conditions halt this task and dependents before mutation.
   2. Capture pre-task dirty/untracked/file facts, read the active unit packet and current source, and verify whether the work already exists before reimplementing.
   3. For behavior-bearing work, apply [Feedback and tests](references/feedback-and-tests.md): establish the smallest loop, choose proof/characterization/replacement evidence, and keep the slice vertical.
   4. Before durable-surface mutation, apply [Implementation quality](references/implementation-quality.md): inventory current owners, recheck `reuse / extend / compose / new`, and stop back on unapproved architecture/scope.
   5. Implement only the current slice in canonical source, update the correct existing/new tests, rerun the same loop, then run applicable system-wide/integration checks.
   6. Inspect the actual changed tree against declared scope; record behavior/test/red-or-characterization/command/result/exception evidence. Do not reconstruct worker-only pre-implementation observations from the diff.
   7. For task packs, compute attributed task delta facts and close any `review_gate: required` with bounded `spec-code-review mode:agent` before dependent waves. Caller-owned fixes rerun affected verification; at most one follow-up review is allowed. Blocking/degraded round two stops; non-blocking P2/P3 remains run-local residual work.
   8. Mark complete only after scope, evidence, required review, and blockers close. Record a logical commit candidate; create it only with `commit_authorization: authorized`.

   Execution notes are intent, not enums. Proof-first requires observing the expected failure before production change; characterization records existing behavior without declaring it correct. Trivial rename/config/style/generated/manual-only work may use an explicit replacement check. Never add duplicate tests merely to demonstrate ceremony, over-implement beyond the active slice, or claim coverage for a check that did not run.
2. **Commit Checkpoint**

   Follow `references/execution-strategy.md` § Commit Authorization. Local implementation and green tests do not authorize a commit. Workers never commit. Without explicit commit authorization, keep verified changes uncommitted and report coherent commit candidates; with authorization, the orchestrator stages only run-owned files and commits only a verified logical unit.

3. **Follow Existing Patterns**

   - The plan should reference similar code - read those files first
   - Match naming conventions exactly
   - Reuse existing components where possible
   - Follow the project's coding standards already in your context
   - When in doubt, grep for similar implementations

4. **Test Continuously**

   - Run relevant tests after each significant change
   - Don't wait until the end to test
   - Fix failures immediately
   - Add new tests for new behavior, update tests for changed behavior, remove tests for deleted behavior
   - **Unit tests with mocks prove logic in isolation. Integration tests with real objects prove the layers work together.** If your change touches callbacks, middleware, or error handling — you need both.

5. **Simplify as You Go**

   At a behavior-cluster/dependency-wave boundary, read `references/implementation-quality.md` § Simplification At Phase Boundaries. Classify findings as `remove-now`, `minimality-debt`, `protected`, or `architecture-mismatch`; do not default to extract-helper, delete security/data-integrity/a11y/observability/required-verification code for lower LOC, or widen scope to pay unrelated debt.

   If **`spec-simplify-code`** is available, invoke it at phase boundaries (especially before Phase 3 when the diff is >=30 lines) with the same classification and protected-surface constraints. Otherwise, perform the bounded pass inline. Rerun the same feedback loop for every `remove-now` or authorized architecture correction.

6. **Figma Design Sync** (if applicable)

   For UI work with Figma designs:

   - Implement components following design specs
   - Read `references/agents/figma-design-sync.md` and dispatch a generic subagent seeded with that local prompt to compare implementation against the Figma design. Do not dispatch a standalone agent by type/name.
   - Fix visual differences identified
   - Repeat until implementation matches design

7. **Frontend Design Guidance** (if applicable)

   For UI tasks without a Figma design -- where the implementation touches view, template, component, layout, or page files, creates user-visible routes, or the plan contains explicit UI/frontend/design language:

   - Apply the frontend guidance embedded in this skill and the active repo instructions: preserve existing design-system conventions, use real UI controls and states, keep layouts responsive, and verify text does not overflow or overlap.
   - When browser tooling is available, inspect the changed UI at desktop and mobile widths before final validation. If no browser access is available, do a code-level responsive/layout review and record that browser verification was unavailable.
   - Phase 4's screenshot capture still applies when the change is user-visible.

8. **Track Progress**
   - Keep the task list updated as you complete tasks
   - Note any blockers or unexpected discoveries
   - Do not create replacement tasks when scope expands; for task-pack input honor `stop_if` and return to `spec-write-tasks`/`spec-plan`, and for direct-plan input return to the plan owner when acceptance, architecture, ownership, or verification scope changes
   - Keep user informed of major milestones
   - When the plan defines U-IDs for Implementation Units, or the plan or origin document carries stable R-IDs (and optionally A/F/AE IDs), reference them in blockers, deferred-work notes, task summaries, and final verification — not routine status updates. U-IDs anchor units across plan edits; R/A/F/AE anchor product intent across the brainstorm-plan handoff. Use the IDs the plan supplies and do not invent ones it does not. This preserves traceability without burying signal under noise.

### Phase 3-4: Quality Check and Finishing Work

When all Phase 2 tasks are complete and execution transitions to quality check, you must read `references/shipping-workflow.md` for the full shipping workflow. Do not skip this.

**Code review: one portable path.** Review with `spec-code-review`, which self-sizes (lite roster for small low-risk code-only diffs, full roster otherwise). No harness-native review detection and no escalation tiers — the size/sensitive-surface judgment lives inside `spec-code-review`. Skip dedicated review only for a purely mechanical diff (formatting, dep-bumps, lint-only, generated). Full rules (autonomous Residual Gate, infra fallback) in `shipping-workflow.md`.

**Review is two steps — review, then fix.** `spec-code-review` is review-only. It returns findings (markdown or `mode:agent` JSON); it never edits the checkout, commits, or applies fixes.

1. **Review** — Invoke the `spec-code-review` skill (invocation command in `references/review-findings-followup.md` § Fallback). Use `mode:agent` in orchestrated workflows; pass `plan:<path>` when you have a plan, `base:<ref>` when the merge base is known, and `depth:full` when a deep/thorough review was explicitly requested.
2. **Apply fixes** — Load `references/review-findings-followup.md`. Filter eligibility on JSON only and batch by file. Use authorized fix workers or inline fallback; the orchestrator integrates and tests. Commit only with `commit_authorization: authorized`.
3. **Residual Work Gate** — Only after followup; unresolved actionable findings go through the gate in `shipping-workflow.md` (autonomous sessions auto-accept + record residuals; interactive sessions ask).

## Return-to-Caller Mode

`mode:return-to-caller <plan-path>` (legacy alias: `mode:caller-owned-tail`) is
reserved for orchestrators such as `lfg` that own simplification, code review,
PR creation, and CI watching after implementation. In this mode `spec-work`
performs implementation and local verification only, then returns a structured
summary instead of running the standalone shipping tail.

Return:

- `status`: `complete`, `blocked`, or `failed`
- `plan_path`: direct plan path, or the validated task pack's authoritative `source_plan`
- `task_pack_path` and pinned `task_pack_digest` when task-pack intake was used; otherwise `null`
- `changed_files`
- `u_ids_attempted`
- `u_ids_completed`
- `task_ids_attempted` and `task_ids_completed` when Task Cards drove execution
- `verification_results`
- `verification_evidence`: one entry per attempted behavior-bearing unit, plus any non-behavioral unit where tests were intentionally skipped. Each entry states the unit/task, `behavior_changed`, `existing_tests_inspected`, `tests_added_or_changed`, tests used unchanged, red failure or characterization observed when applicable, verification commands/results, and any exception reason. For units executed by subagents, this entry is assembled from each worker's returned evidence (Phase 1 Step 4), not reconstructed from the diff — the red-before-implementation observation exists only in the worker's report.
- `verification_run_summary_ref`: repo-relative `verification-run-summary.v1` ref produced from the commands this work run actually executed, or `null` with an explicit limitation when no structured summary could be written
- `verified_worktree_fingerprint`: the complete `spec-work-working-tree-fingerprint/v1` object produced by `scripts/working-tree-fingerprint.cjs` (resolved from this skill's own `SKILL_DIR`) after this invocation's final required verification and immediately before return. It covers HEAD, tracked/staged/unstaged diff, untracked paths, and untracked bytes. A behavior-bearing `status: complete` return requires it; non-behavior returns still include it whenever the helper can run, so callers can apply freshness gates uniformly, and may omit it only together with the documented deliberate non-behavior exception. If the helper cannot run (missing runtime asset, no git, no Node), record a `fingerprint-helper-unavailable` blocker naming the concrete cause — never fabricate the object or omit it silently.
- `honest_closeout_verdict`: `verified`, `degraded`, or `unsupported`, together with the validator `overall_reason_code`
- `run_artifact_path`: repo-relative `spec-work-run-artifact/v2` path when a durable trigger wrote one; otherwise `null`
- `run_artifact_reason_code`: the matched durable trigger, `no-trigger-matched`, or the producer's concrete `not-written` reason
- `claim_limitations`: structured limitations for not-run checks, unsupported claim refs, review-evidence materialization failure, provider-bounded evidence, or other claim ceilings
- `blockers`
- `behavior_change`: whether behavior-bearing code changed
- `commit_authorization: missing` and `landing_authorization: missing` for this mode; Return-to-Caller does not consume either exit
- `plan_status_completion_candidate`: the repo-relative direct `docs/plans/*.md` source plan that the caller may complete after its own shipping gates, or `null` when lifecycle mutation is not applicable
- `plan_status_completion_degraded_reason`: `null` when a candidate is present; otherwise one of `html-plan-lifecycle-degraded`, `legacy-plan-lifecycle-degraded`, `read-compatible-status-unmanaged`, or `source-plan-path-lifecycle-degraded`. Duplicate, malformed, or invalid lifecycle metadata is a blocker, not a degraded result.
- `standalone_shipping_skipped: true`

Return `status: complete` only when every in-scope unit/task is accounted for and completed, task-pack pins still match when applicable, every required task review is closed, `blockers` is empty, and every required verification result is passed or explicitly not applicable with a reason. Behavior-bearing work also requires the verification evidence and `verified_worktree_fingerprint` above or a deliberate non-behavior exception. Failed, degraded, not-run, vague, stale, or missing required verification/review cannot return complete.

If a previous return-to-caller run implemented code but omitted evidence, or the caller re-enters after caller-owned simplification/review fixes, the later same-plan invocation must use the idempotency path instead of reimplementing. Re-read the current plan and tree, rerun the complete applicable Verification Contract against the current working tree, create a fresh verification-run-summary ref for commands executed by this invocation, and capture a new `verified_worktree_fingerprint` only after those checks finish. Never reuse the earlier run summary or fingerprint as final-tree evidence.

`standalone_shipping_skipped: true` 只表示 caller owns simplify、full review、plan lifecycle 与 landing tail；它不跳过本次 work 已执行命令的 structured closeout。按照 `references/shipping-workflow.md` 的 Step 5.1 记录 run summary、校验 honest closeout，并按 durable trigger 返回 run artifact path/reason。不得把 plan 中列出的候选命令、worker 的自然语言“tests pass”或 session-temp review path 当成这些字段的 confirmed evidence。

Engine selection (`references/execution-engines.md`) still applies in this mode,
but only for implementation. In return-to-caller mode do not emit a copyable
goal/workflow prompt — a manual paste step strands the caller; run
inline/authorized workers or return a blocker instead. Any goal/workflow engine used here
must not commit, push, open a PR, run the owner workflow tail, or bypass the caller-owned
gates. Return-to-Caller never invokes `plan-status complete`; it returns only the
completion candidate, and the caller owns the eventual shipping closeout.

## Compact Principles And Pitfalls

- Execute settled scope from current source; ask once only when repo/docs cannot resolve a material ambiguity.
- Reuse the correct owner and keep slices observable. Do not trade evidence, safety, accessibility, observability, or required verification for speed or lower LOC.
- Track actual task/unit evidence and blockers; commits and plan status are not progress proof.
- Finish every in-scope unit and required review/verification before a completion claim. Keep failed/not-run/degraded limitations explicit.
- Do not widen work into adjacent cleanup, imagined future abstractions, human-time “session phases,” or a new private decomposition. Return scope-changing discoveries to the plan/task owner.
- Review every non-mechanical diff through the portable review path or record the honest unavailable/manual fallback. Commit and landing remain separately authorized.
