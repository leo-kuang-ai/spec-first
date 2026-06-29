---
name: spec-work
description: Execute work efficiently while maintaining quality and finishing features
argument-hint: "[Plan doc path or description of work. Blank to auto use latest plan doc]"
---

# Work Execution Command

Execute work efficiently while maintaining quality and finishing features.

## Introduction

This command takes a work document (plan, task pack, or specification) or a bare prompt describing the work, and executes it systematically. The focus is on **shipping complete features** by understanding requirements quickly, following existing patterns, and maintaining quality throughout.

## Workflow Contract Summary

### When To Use

Use when a validated task pack, settled plan, spec path, or concrete implementation request is ready to execute within the current repo scope.

### When Not To Use

Do not use when WHAT/HOW is still unresolved, target repo scope is ambiguous, a task pack is stale/unverifiable, scope would expand beyond the plan, or the fix would require hand-editing generated runtime mirrors as source fixes.

### Inputs

A validated task pack, plan/spec path, or bare implementation prompt; source plan scope, `target_repo` when needed, project instructions, package/test context, nearby source/tests, and optional external-tool evidence as advisory implementation context.

### Outputs

Scoped code/docs/config changes, focused verification results, review/residual status, and a compact completion response naming changed files, checks run, artifacts, and any required next action.

### Artifacts

The authoritative work evidence is the repo diff, tests/checks, commits/PRs when explicitly created, residual review docs when routed, and any actual downstream workflow artifacts. The planned spec-work run JSON schema is not current runtime truth.

### Failure Modes

Missing/ambiguous repo scope, stale or unverifiable task packs, hash/spec_id mismatch, scope expansion beyond the plan/task pack, unsafe branch/worktree state, or validation failures. Stop with the user-facing handoff envelope instead of expanding scope silently.

### Workflow

Triage the input, verify repo/branch/task-pack boundaries, build the task list, implement in scoped steps, run focused verification, perform the required quality/review pass, then return the completion contract.

### Downstream Consumers

`spec-code-review`, git commit/push/PR workflows, `spec-compound`, release notes, and human reviewers consuming the final completion evidence.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` with high-risk overrides because this workflow can write source, run verification, and prepare commit/PR handoffs.

Overrides: high-risk

- `foreign-residual-workspace` -> `blocked-action-required`: stop before edits, tests that rely on stale local artifacts, commits, or PR handoffs until `spec-first clean --workspace-orphans` preview and `spec-first init` refresh the local harness, or the user explicitly accepts degraded evidence.
- optional external-tool evidence unavailable -> `fallback-only`: use bounded direct source/test evidence and disclose the missing optional evidence; do not claim impact or related-test coverage that was not confirmed from source, diff, tests, logs, or user-provided evidence.
- `non-git-build-workspace` coverage gaps -> `partial`: keep writes scoped to explicit `target_repo` / covered git roots, and directly inspect uncovered build modules before changing behavior that could affect them.

## Examples As Context

When editing or reviewing this workflow prompt, or when running fresh-source eval for workflow posture drift, read `skills/spec-work/evals/examples.json` as examples-as-context. These examples are not an execution state machine, runtime readiness gate, or semantic quality proof for ordinary work runs.

## Context Orientation Anchor

Orient execution from the current user request, the plan or task pack, already-loaded host/project instructions, package manifests and command registries, nearby implementation files, nearby tests, and git diff or changed files when applicable. Treat `AGENTS.md`, `CLAUDE.md`, and project role docs as host instruction sources that are normally already loaded by the current session, not automatic re-read targets for every work run. Read those source instruction files only when `docs/contracts/context-governance.md`'s Host Instruction Reuse Policy allows it, such as a user-named path, missing/stale loaded context, source/runtime governance work, or a directory-scoped instruction file that may govern changed files. Use bounded direct repo reads, `rg`, ast-grep when useful, git diff, focused tests, logs, and user-provided evidence for implementation context. External tools may prioritize inspection, but they do not define scope authority. Scope expansion is judged against the plan/task pack and concrete diff, not an external evidence surface.

Use this intake order for context economy: first read the plan/task summary and contract metadata, then deterministic inventory or validation facts, then current task/phase refs, then focused source-of-truth sections, and only then deeper references. Keep reviewer handoff evidence compact by summarizing direct source reads, changed files, test/log results, and limitations; do not create a new external-tool facts pipeline.

When the plan, task pack, sessions, learnings, standards, or prior review artifacts include provenance-backed rejected/out-of-scope rationale for similar scope, consume those replay refs as advisory boundary evidence before expanding work. Carry the source, rationale, and freshness/confidence in closeout when relevant; do not treat rejected rationale as task status, approval state, or a reason to skip source-plan acceptance.

## Domain Language And Decision Ledger

When implementation depends on domain terminology, project-specific concepts, or ADR-like choices, consume existing context before asking questions that repo/docs can answer: already-loaded project standards and host instructions, `docs/contracts/`, existing brainstorms/plans/solutions, and any repo-local glossary or ADR-like artifacts that actually exist. Team standards under `docs/standards/**` are consumed through `docs/contracts/team-standards.md`: read the contract and `docs/standards/index.md` first, then only matched rule files; only `trust=confirmed,lifecycle_state=active` and scope-matched standards can constrain changed files as hard context. Carry matched/excluded/uncertainty/fallback/limitations and any material rule IDs in closeout when standards affected implementation or blocked an option. Read `AGENTS.md` / `CLAUDE.md` source only under the Host Instruction Reuse Policy, not as a default domain-context step. Do not require a fixed `CONTEXT.md`, `docs/adr/`, or glossary directory. If those artifacts are absent, treat the gap as advisory and continue with the plan/task pack plus direct source evidence.

For major implementation decisions, carry a lightweight decision note in the work summary or closeout: `question`, `recommended_answer`, `source_tag`, `chosen_answer`, `consequence`, and `deferred_reason` when unresolved. Use source tags such as `confirmed`, `advisory`, `session-local`, `stale`, or `user`. Suggest creating an ADR-like artifact only when the decision is hard to reverse, would be surprising without context, and reflects a real tradeoff.

## Feedback Loop And Vertical Slices

Before changing behavior, establish or attempt the smallest feedback loop that can observe the current slice: a failing or characterization test, CLI invocation, HTTP/browser script, trace replay, throwaway harness, property/fuzz loop, docs contract check, schema validation, or other focused command. If no loop is possible, record `feedback_loop_not_possible` with the exact missing condition before editing. After the slice lands, rerun the same loop or record why it could not be rerun.

Prefer vertical tracer bullets when scope permits: close one behavior with its implementation, verification, and necessary docs/handoff evidence before broadening to the next behavior. Do not split work into "write all tests first across every unit, then implement everything" when independent vertical slices can be verified. Docs-only and config-only tasks use docs contract checks, schema/help/render checks, or diff-shape checks as the feedback loop; do not force TDD where no behavior-bearing code changes.

## Anti-Rationalization Red Flags

| 红旗念头 | 停下来做什么 |
| --- | --- |
| 「测试大概会过,先声明完成」 | 跑匹配本次改动的验证命令,读真实输出,再声明完成或记录 not-run reason_code。 |
| 「这处改动显然对,不用 preview」 | 先做可观察的 preview、diff-shape check 或最窄反馈回路,再继续扩大改动。 |
| 「相邻代码顺手改了」 | 回到 plan/task scope,只碰完成当前目标必须修改的 source;额外发现记录为 follow-up。 |
| 「孤儿代码留着无所谓」 | 清理自己造成的 orphaned 文件、测试、引用或 runtime 产物,避免把后续成本留给别人。 |

这是注意力提醒,不是 gate,也不替代 LLM 判断;最终是否停下、如何处理仍由你按当前证据决定。

## Runtime Context Exclusion

Follow `docs/contracts/context-governance.md`: ordinary Work context excludes `.spec-first/audits/**`, `.spec-first/governance/**`, and generated mirrors (`.claude/**`, `.codex/**`, `.agents/skills/**`) by default. Do not pass those paths to worker context, reviewer handoff, or broad repo search unless the current task explicitly targets setup/update/runtime drift/audit/governance evidence or the user names a precise runtime path; when excluded, record the path or reason instead of silently scanning it.

## Cache-Friendly Context Layout

Keep workflow invariants, task-pack validation, source/runtime boundaries, and reference load conditions in the stable instruction prefix. Put current plan/task excerpts, changed files, diff summary, tool/test summaries, project-guidance facts, `artifact-summary.v1`, and `context-bundle.v1` from `docs/contracts/context-bundle.md` in the dynamic suffix. Work-to-review and work-to-compound handoffs should pass compact summaries plus paths first; open full artifacts only when `full_read_triggers` require exact evidence.

Maintain a run-local context ledger for this workflow: paths read, reason, phase, and compact summary. Reuse loaded summaries within the same workflow run. Re-read only when exact wording is needed, the file changed, prior evidence is insufficient, or the user explicitly asks.

## Summary-First Handoff

When consuming upstream plan, task-pack, review, debug, or compound artifacts, read an `artifact-summary.v1` summary and precise artifact path first. Open the full artifact only when `full_artifact_read_triggers` apply: the summary is missing requirement/task/finding/evidence detail needed for implementation, exact prose or line references are required, or 互依赖任务 need concrete implementation details rather than only upstream conclusions. If no usable summary exists, record `summary_missing` and read the smallest explicit source path needed. If full content is opened, record `full_artifact_read_reason` with the matched trigger.

When producing work-to-review or work-to-compound handoff, provide an `artifact-summary.v1`-style summary with changed files, verification commands, review tier, residual status, evidence paths, limitations, and recommended next action. If handing off a `context-bundle.v1`, keep context budget accounting in the existing `related_paths`, `evidence_paths`, `excluded_context`, `budget`, and `budget_used` fields; do not introduce a second included/omitted schema.

## Recall Trust Boundary

Institutional learnings from `docs/solutions/` recalled during execution (directly or carried in from `spec-plan`) are recall advisory candidate evidence. Treat a matching learning as a pointer to inspect, not as confirmed truth. Use its `source_refs` or upstream `source_reads_required` to return to current source/test/doc evidence, deterministic checks, or human reviewer confirmation before letting a past learning shape an implementation decision. Do not rely on model self-evaluation; 不依赖模型自评.

## Direct Evidence Boundary

Work does not require external-tool readiness before ordinary implementation. Use direct source reads, `rg`, ast-grep, git diff, focused tests, logs, package metadata, and user-provided artifacts as the evidence base. If an external tool is unavailable or outside the current scope, disclose that limitation and continue only with claims that the direct evidence supports.

## Capability-Class Evidence Boundary

Follows `docs/contracts/project-graph-consumption.md`: `capability-class` candidates such as `code-graph` or `project-graph` are advisory only. Check `readiness_status` before use; the basis for any change must be the plan/task/source/tests, never the candidate alone. Record used candidates as `provider_untrusted`, never-block on availability, keep setup-side `lifecycle.fallback_used` separate; fall back to direct source reads on missing/`unknown`/`unverified`/failure/disabled.

## Workspace Repo Scope

When invoked from a parent workspace containing multiple independent Git repos, do not infer a write target from cwd alone. For read-only orientation questions, use bounded direct reads of candidate repos only after the user request or plan makes the candidate scope clear. A plan or task pack must state a single `target_repo` or per-unit/per-task `target_repo` values before edits, tests, changelog updates, or commits. Verify that planned file paths and actual `git status` changes belong to the selected child repo. If repo scope is missing or ambiguous, return to `spec-plan` or ask for the active repo instead of writing into a sibling repo or the parent workspace.

## Run Artifact Boundary

`docs/contracts/workflows/spec-work-run-artifact.schema.json` is the source-owned write-side contract for the internal producer `spec-first internal spec-work-run-artifact write --input <payload.json> --run-id <run-id> --target-repo <repo>`. The producer writes `spec-work-run-artifact/v2` artifacts; `script_confirmed.validation` is the aggregate `{status, reason_code, run_summary_ref}` and the per-check detail source is `verification-run-summary.v1`. `producer_available=true` means the CLI can validate a supplied closeout payload and write `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/run.json`; `workflow_integrated=true` means Phase 4 closeout calls that writer when a durable evidence trigger applies. The writer treats each workspace/run-id pair as immutable: if the target `run.json` already exists, it returns `artifact-already-exists` and does not overwrite it. Read/prune remain compatible with legacy `spec-work-run-artifact/v1` artifacts, but new closeout payloads must use `spec-work-run-artifact-payload/v2`.

When durable evidence triggers apply (validated task-pack, not-run validation, deferred follow-up, compaction/resume, long task, or review/compound/release handoff), closeout must call the verification helpers first when validation was considered: `verification-profile load` to resolve candidates, `verification-run-summary record` to capture actual check outcomes after execution, and `honest-closeout validate` to produce structured claim verdicts. The run-artifact producer payload must carry `producer.workflow_integrated=true`, `producer.reason_code=<matching-trigger>`, and `script_confirmed.validation.run_summary_ref=<repo-relative verification-run-summary.json>` for integrated closeout writes. Final responses remain human summaries and must include the repo-relative run artifact path when a run artifact was written, or the concrete producer reason code when it was skipped or failed. On resume or handoff, prefer the explicitly named workspace-slug/run-id artifact; latest-artifact lookup is a fallback only and should be disclosed as weaker evidence in parallel work. If no readable artifact is available, record `resume_evidence.status=not-found|not-readable|not-run` with a reason code. Do not treat run evidence as source scope authority, progress state, approval state, or a full replay index. Retention/prune now has a minimal deterministic consumer, but the artifact still is not the retention policy source of truth.

## Input Document

<input_document> #$ARGUMENTS </input_document>

## Execution Workflow

### Phase 0: Input Triage

Determine how to proceed based on what was provided in `<input_document>`.

**Plan or task-pack document** (input is a file path to an existing plan, task pack, or specification) → skip to Phase 1.

**Bare prompt** (input is a description of work, not a file path):

1. **Scan the work area**

   - Identify files likely to change based on the prompt
   - Find existing test files for those areas (search for test/spec files that import, reference, or share names with the implementation files)
   - Note local patterns and conventions in the affected areas

2. **Assess complexity and route**

   | Complexity | Signals | Action |
   |-----------|---------|--------|
   | **Trivial** | 1-2 files, no behavioral change (typo, config, rename) | Proceed to Phase 1 step 2 (environment setup), then implement directly — no task list, no execution loop. Apply Test Discovery if the change touches behavior-bearing code |
   | **Small / Medium** | Clear scope, under ~10 files | Build a task list from discovery. Proceed to Phase 1 step 2 |
   | **Large** | Cross-cutting, architectural decisions, 10+ files, touches auth/payments/migrations | Inform the user this would benefit from the current host's brainstorm or plan entrypoint to surface edge cases and scope boundaries. Honor their choice. If proceeding, build a task list and continue to Phase 1 step 2 |

3. **Oversized intake and handoff**

   Apply this before creating execution tasks:

   - If the input is a bare prompt and the product WHAT is unclear, recommend the current host's brainstorm entrypoint before execution.
   - If the desired outcome is clear but no settled plan exists, return to the current host's plan entrypoint rather than forcing `spec-work` to plan while implementing.
   - If the input is a settled plan and the plan is large enough that execution would require the executor to split dependencies, waves, or cross-module file ownership while implementing, offer the standalone `spec-write-tasks` diversion once.
   - Do not describe task compilation as a command-backed workflow entrypoint; `spec-write-tasks` remains a standalone skill.
   - If execution discovers scope beyond the plan/task pack, stop and return to `spec-plan` or rerun `spec-write-tasks`. Do not expand scope in place.
   - Do not invent human-time phases, multi-day slices, or "this session only" subsets as an oversized-work workaround.

   **User-Facing Handoff Contract**

   When `spec-work` cannot continue safely and must recommend another workflow, task compilation, repo scoping, task-pack regeneration, or user clarification, do not stop with only "return to spec-plan" or a bare workflow name. Give the user a compact handoff in the repository language policy from the active `CLAUDE.md` / `AGENTS.md` `spec-first:lang` block:

   ```text
   Blocking reason: <specific reason execution cannot continue safely>
   Recommended entrypoint: <current-host public entrypoint or standalone skill name>
   Next action: <copy-ready invocation or short reply phrase>
   Context to carry: <plan/task-pack path, failed validation command, stop_if, target_repo gap, or scope evidence when applicable>
   ```

   Keep `Context to carry` short and omit it only when there is no artifact, command, or scope fact worth preserving. The next action must be something the user can immediately run or approve; do not give a menu of every possible workflow.

---

### Phase 1: Quick Start

1. **Read Work Document and Clarify** _(skip if arriving from Phase 0 with a bare prompt)_

   - Read the work document completely
   - Treat a plan as a decision artifact, not an execution script
   - Treat a validated task pack as a first-class executable work document. The task pack supplies execution order, task boundaries, file focus, `stop_if`, and validation notes; its `source_plan` remains the single source of truth for scope, requirements, and non-goals.
   - If the work document includes sections such as `Implementation Units`, `Work Breakdown`, `Requirements` (or legacy `Requirements Trace`), `Files`, `Test Scenarios`, or `Verification`, use those as the primary source material for execution
   - If the work document is a task pack, also use `Task Graph`, `Execution Waves`, `Task Cards`, `Validation Notes`, and `Regeneration Rules` as the primary source material for execution
   - If the work document is a task pack, validate it before creating execution tasks:
     - read its frontmatter and confirm `type: task-pack`, `generated_by: spec-write-tasks`, `status: derived`, and `mode: derived`
     - read `source_plan` and treat that plan as the single source of truth for scope, requirements, and non-goals
     - after selecting the current task, read the task card's `source_unit`, `requirement_refs`, `context_refs`, `test_focus`, `done_signal`, and `stop_if`, then read the focused source-plan sections that define those anchors before editing
     - `context_refs` are bounded reading pointers, not scope authority; if they point only to the whole plan or broad directories, still recover the narrow source-plan anchors from `source_unit` / `requirement_refs` before implementation and treat the handoff as low quality in closeout or review context
     - source-plan focused reads must check the relevant implementation unit, requirement / acceptance refs, scope boundaries, non-goals, and any deferred implementation notes that could change the current task's file boundary or verification path
     - read `spec_id` from the task pack and source plan. If the task pack lacks `spec_id`, stop as missing identity; if both are present, they must match; if they mismatch, reject the task pack as wrong-chain handoff before implementation
     - if the source plan lacks `spec_id`, treat task-pack identity as unverifiable weak trace and stop for executable task-pack handoff; ask to return to `spec-plan` to add plan frontmatter or rerun `spec-write-tasks`
     - confirm `source_plan_hash` is a concrete canonical source plan body `sha256:<64-hex>` hash, not `pending-tooling`, `unknown`, empty, or a draft marker
     - compare the task pack hash against the current source plan using `spec-first tasks validate <task-pack-path> --json`; if that tooling is unavailable, treat the task pack as unverifiable and stop
     - confirm the validator accepted the `Task Pack Contract` JSON block; do not infer executable task structure from free-form Markdown task cards
     - treat validator-rejected structure fields as hard handoff failures, including non-POSIX repo-relative paths, invalid wave ids, and non-boolean `parallelizable`; do not repair task-pack JSON in the executor
     - reject draft, transient, missing-source, missing-spec-id, spec-id-mismatch, missing-hash, unavailable-hash-tooling, unverifiable-hash, or hash-mismatch task packs before implementation
     - when rejecting, stop and ask to rerun `spec-write-tasks` from the source plan or return to `spec-plan`; do not silently fall back to executing stale task cards
     - deterministic identity, freshness, and structure checks are necessary but not sufficient: after they pass, also check the task-pack `semantic_posture` and `dispatch_authorization` evidence for executable work intake
     - `semantic_posture: reviewed-existing` requires current evidence metadata pointing at a verifiable review source and freshness basis; if evidence is absent, stale, or has no durable evidence reference and the posture is not `generated-this-run`, treat the pack as `unchecked-existing` and route to review or regeneration before proceeding
     - `dispatch_authorization: authorized` requires a bounded continuation reference or doc-review outcome reference; if absent, treat authorization as `missing` rather than proceeding to execution
     - `semantic_posture: generated-this-run` with a current-run hash and matching source-plan hash is sufficient for evidence without a separate evidence object; do not require evidence metadata for packs generated in the same session with a current hash
     - during execution, honor each task's `stop_if`; if triggered, stop and return to `spec-plan` or regenerate the task pack instead of expanding scope in place
     - when present, preserve each task's `review_gate` and `review_focus` as review intent metadata; do not treat either field as progress state, approval state, or source-plan scope authority
     - for `review_gate: required`, treat the task as a task completion checkpoint: before marking the logical task done, committing that logical unit, entering the next wave, or entering Phase 3, run a bounded `spec-code-review mode:report-only` mini review or stop with an explicit handoff
     - before starting a required-gate task, record `pre_task_base` or an equivalent diff anchor. After task verification, run `spec-code-review mode:report-only base:<pre_task_base> plan:<source_plan>` against the current checkout and carry the task-pack path, task id, declared files, actual changed files, source plan path, and `review_focus` in the review context
     - if a reliable per-task diff range cannot be formed, stop and hand off instead of pretending a whole-branch review is a task-level review
     - if required-gate review returns P0/P1 or any actionable finding directly matching the task's `review_focus`, fix and re-review or explicitly hand off / get user acceptance before continuing dependent work
     - same dependency/wave-boundary required gates may be batched into one bounded report-only review when they share a reliable diff anchor/context; terminal required tasks must still be covered before Phase 3 completes, either by the mini review or by an immediate shipping review whose context names the task id, diff scope, and `review_focus`
     - `review_gate: optional` is advisory; record it as review context and merge it into final shipping review unless local risk signals justify an earlier report-only mini review
   - If the work document is already a validated task pack, do not offer task compilation again, do not rebuild execution structure from the source plan, and do not silently downgrade to plan-only execution. Execute from the task pack's validated task structure while keeping `source_plan` as scope authority.
   - For large plans with phase/wave task packs, consume only the current phase/wave task pack plus its focused source-plan refs. Direct execution of the whole large plan requires an explicit reason in closeout explaining why task-pack compression was unnecessary.
   - If the work document is a plan path, and validated task-pack consumption is available, run the optional task-pack suitability check before `before-work --plan`, before creating a work-run, and before creating the internal task tracker:
     - recommend the diversion once only when source plan structure shows high execution complexity: many implementation units, declared `Files`, dependency chains, cross-module surfaces, broad verification spread, or `plan_depth: deep`; the reason is to reduce single-run context load, broad review scope, and coupled rollback cost
     - do not offer it for 1-2 file changes, docs-only/config-only/narrow bugfix plans, plans whose units are already small enough for the internal tracker, or when the user explicitly says to execute the plan directly
     - if the user chooses task compilation, pause plan execution, load the `spec-write-tasks` workflow with the plan path, and re-enter only after it returns deterministic handoff with `semantic_posture: generated-this-run | reviewed-existing`
     - if the user chooses direct execution, continue with `before-work --plan` and the internal tracker, and do not prompt again in this work run
   - Check for `Execution note` on each implementation unit — these carry the plan's execution posture signal for that unit (for example, test-first or characterization-first). Note them when creating tasks.
   - Check for a `Deferred to Implementation` or `Implementation-Time Unknowns` section — these are questions the planner intentionally left for you to resolve during execution. Note them before starting so they inform your approach rather than surprising you mid-task
   - Check for a `Scope Boundaries` section — these are explicit non-goals. Refer back to them if implementation starts pulling you toward adjacent work
   - Review any references or links provided in the plan
   - If the plan contains a direct evidence or current-state section, consume its source refs, limitations, and required verification as advisory implementation focus. Any implementation or risk claim still needs current source, diff, test, log, or user-provided evidence before changing behavior.
   - Apply the downstream non-expansion rule: files, repos, routes, symbols, consumers, or risks discovered outside the plan/task scope are recorded as follow-up or test-candidate evidence, not silently added to the implementation unit. If repo scope is unclear, resolve an explicit `target_repo` or per-unit/per-task repo scope before writing files, running tests, review autofix, changelog updates, commits, or PR work.
   - If the user explicitly asks for TDD, test-first, or characterization-first execution in this session, honor that request even if the plan has no `Execution note`
   - If anything is unclear or ambiguous, ask clarifying questions now
   - If clarifying questions were needed above, get user approval on the resolved answers. If no clarifications were needed, proceed without a separate approval step — plan scope is the plan's authority, not something to renegotiate
   - **Do not skip this** - better to ask questions now than build the wrong thing
   - **Do not edit the plan body during execution.** The plan is a decision artifact; progress lives in git commits and the task tracker. The only plan mutation during spec-work is the final completion-status update at shipping (see `references/shipping-workflow.md` Phase 4 Step 2). For direct plan/spec input, update that document's frontmatter `status: active → completed`; for validated task-pack input, do not change the task pack's `status: derived` because it records derivation/validation posture rather than execution progress, and instead update its `source_plan` frontmatter `status: active → completed` because the source plan is the completion authority. If the completion target cannot be safely updated, leave it unchanged and record the concrete `completion_status.reason_code` in closeout. Legacy plans may contain `- [ ]` / `- [x]` marks on unit headings — ignore them as state; per-unit completion is determined during execution by reading the current file state.

2. **Setup Environment**

   First, check the current branch:

   ```bash
   current_branch=$(git branch --show-current)
   default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')

   # Fallback if remote HEAD isn't set
   if [ -z "$default_branch" ]; then
     default_branch=$(git rev-parse --verify origin/main >/dev/null 2>&1 && echo "main" || echo "master")
   fi
   ```

   **If already on a feature branch** (not the default branch):

   First, check whether the branch name is **meaningful** — a name like `feat/crowd-sniff` or `fix/email-validation` tells future readers what the work is about. Auto-generated worktree names (e.g., `worktree-jolly-beaming-raven`) or other opaque names do not.

   If the branch name is meaningless or auto-generated, suggest renaming it before continuing:
   ```bash
   git branch -m <meaningful-name>
   ```
   Derive the new name from the plan title or work description (e.g., `feat/crowd-sniff`). Present the rename as a recommended option alongside continuing as-is.

   Then ask: "Continue working on `[current_branch]`, or create a new branch?"
   - If continuing (with or without rename), proceed to step 3
   - If creating new, follow Option A or B below

   **If on the default branch**, choose how to proceed:

   **Option A: Create a new branch**
   ```bash
   git pull origin [default_branch]
   git checkout -b feature-branch-name
   ```
   Use a meaningful name based on the work (e.g., `feat/user-authentication`, `fix/email-validation`).

   **Option B: Use a worktree (recommended for parallel development)**
   ```bash
   skill: git-worktree
   # The skill detects existing isolation first, then creates a branch/worktree only when needed
   ```

   **Option C: Continue on the default branch**
   - Requires explicit user confirmation
   - Only proceed after user explicitly says "yes, commit to [default_branch]"
   - Never commit directly to the default branch without explicit permission

   **Recommendation**: Use worktree if:
   - You want to work on multiple features simultaneously
   - You want to keep the default branch clean while experimenting
   - You plan to switch between branches frequently

3. **Create Task List** _(skip if Phase 0 already built one, or if Phase 0 routed as Trivial)_
   - Use the platform's task tracking tool (`TaskCreate`/`TaskUpdate`/`TaskList` in Claude Code, `update_plan` in Codex, or the equivalent on other harnesses) to break the plan into actionable tasks
   - If the input is a validated task pack, derive the task list from `Task Cards` and preserve `task_id`, `dependencies`, `wave`, `files`, `test_focus`, `done_signal`, and `stop_if`
   - If the input is a task pack, do not create execution tasks until the task-pack validation checks above have passed
   - Derive tasks from the plan's implementation units, dependencies, files, test targets, and verification criteria
   - When the plan defines U-IDs for Implementation Units, preserve the unit's U-ID as a prefix in the task subject (e.g., "U3: Add parser coverage"). This keeps blocker references, deferred-work notes, and final summaries anchored to the same identifier the plan uses, so progress and traceability remain unambiguous across plan edits
   - When the work document has `spec_id`, keep it as trace context for blockers, deferred-work notes, task summaries, and final verification when it helps distinguish related requirements/plan/task-pack artifacts. Do not treat it as execution state or completion status
   - Carry each unit's `Execution note` into the task when present
   - For each unit, read the `Patterns to follow` field before implementing — these point to specific files or conventions to mirror
   - Use each unit's `Verification` field as the primary "done" signal for that task
   - Do not expect the plan to contain implementation code, micro-step TDD instructions, or exact shell commands
   - Include dependencies between tasks
   - Prioritize based on what needs to be done first
   - Include testing and quality check tasks
   - Keep tasks specific and completable

4. **Choose Execution Strategy**

   After creating the task list, decide how to execute based on the plan's size and dependency structure:

   | Strategy | When to use |
   |----------|-------------|
   | **Inline** | 1-2 small tasks, or tasks needing user interaction mid-flight. **Default for bare-prompt work** — bare prompts rarely produce enough structured context to justify subagent dispatch |
   | **Serial subagents** | 3+ tasks with dependencies between them. Each subagent gets a fresh context window focused on one unit/task — prevents context degradation across many tasks. Requires plan-unit metadata or validated task-card metadata (Goal, Files, Approach, Test scenarios, `test_focus`, `done_signal`) |
   | **Parallel subagents** | 3+ tasks that pass the Parallel Safety Check (below). Dispatch independent units/tasks simultaneously, run dependent work after prerequisites complete. Requires plan-unit metadata or validated task-card metadata |

   **Parallel Safety Check** — required before choosing parallel dispatch:

   1. Build a file-to-unit mapping from every candidate unit's `Files:` section (Create, Modify, and Test paths)
   2. Check for intersection — any file path appearing in 2+ units means overlap
   3. Use the host capability matrix below before deciding whether overlap is allowed. If reliable isolation is unavailable, downgrade overlapping units to serial subagents and log the reason (e.g., "Units 2 and 4 share `config/routes.rb` — using serial dispatch"). Serial subagents still provide context-window isolation without shared-directory write races.

   Even with no file overlap, parallel subagents sharing the orchestrator's working directory face git index contention (concurrent staging/committing corrupts the index) and test interference (concurrent test runs pick up each other's in-progress changes). Reliable isolation eliminates both; the shared-directory fallback constraints below mitigate them.

   **Host capability matrix**

   | Host path | Isolation model | Parallel overlap rule | Commit/test ownership |
   |-----------|-----------------|-----------------------|-----------------------|
   | Claude Code `Agent` with worktree isolation | Pass `isolation: "worktree"` and `run_in_background: true`; the harness creates a per-subagent worktree under `.claude/worktrees/agent-<id>` on its own branch. Verify `.claude/worktrees/` is gitignored before relying on this. | Overlap is allowed only as a predicted merge conflict handled by the worktree-isolated post-batch flow. Log the predicted overlap before dispatch. | Subagents may stage, commit, and run their unit tests inside their own worktree branch. |
   | Claude Code `Agent` without worktree isolation, or any shared-directory subagent | Subagents write in the orchestrator's working directory. | Overlap is not safe. Downgrade overlapping units to serial. | Subagents must not stage, commit, or run the project test suite. |
   | Codex `spawn_agent` / forked workspace | Use Codex's fork workspace semantics when available. Do not pass or claim Claude's `isolation: "worktree"` parameter. | Prefer disjoint write sets. If files overlap, dispatch serially unless the harness provides an explicit diff/merge handoff you can inspect before integration. | The orchestrator owns final integration, staging, commits, and project-level verification. |
   | No subagent support | Inline execution only. | Not applicable. | The current agent owns all work. |

   **Subagent dispatch** uses your available subagent or task spawning mechanism. For each unit, give the subagent:
   - The full work-document path. If it is a task pack, also pass the `source_plan` path for scope context
   - The specific unit/task's Goal, Files, Approach, Execution note, Patterns, Test scenarios, Verification, or task-card equivalents (`task_id`, `dependencies`, `wave`, `files`, `test_focus`, `done_signal`, `stop_if`, `review_gate`, `review_focus`)
   - Any resolved deferred questions relevant to that unit
   - Instruction to check whether the unit's test scenarios cover all applicable categories (happy paths, edge cases, error paths, integration) and supplement gaps before writing tests

   **Shared-directory fallback constraints** — apply when reliable isolation is unavailable:
   - Instruct each subagent: "Do not stage files (`git add`), create commits, or run the project test suite. The orchestrator handles testing, staging, and committing after all parallel units complete."
   - These constraints prevent git index contention and test interference between concurrent subagents.
   - With Claude Code worktree isolation active, omit these constraints — subagents may stage, commit, and run their unit tests within their own worktree branch.

   **Permission mode:** Omit the `mode` parameter when dispatching subagents so the user's configured permission settings apply. Do not pass `mode: "auto"` — it overrides user-level settings like `bypassPermissions`.

   **After each subagent completes (serial mode):**
   1. Review the subagent's diff — verify changes match the unit's scope and `Files:` list
   2. Run the relevant test suite to confirm the tree is healthy
   3. If tests fail, diagnose and fix before proceeding — do not dispatch dependent units on a broken tree
   4. Update the task list (do not edit the plan body — progress is carried by the commit)
   5. Dispatch the next unit

   **After all parallel subagents in a batch complete (worktree-isolated mode):**
   1. Wait for every subagent in the current parallel batch to finish.
   2. For each completed subagent, in dependency order: review the worktree's diff against the orchestrator's branch. If the subagent did not commit its own work, stage and commit it inside that worktree.
   3. Merge each subagent's branch into the orchestrator's branch sequentially in dependency order. **If a merge conflict surfaces, abort the merge (`git merge --abort`) and re-dispatch the conflicting unit serially against the now-merged tree** — hand-resolving silently picks a side and discards one unit's intent. Predicted overlap from the Parallel Safety Check surfaces here as a conflict, not as silent data loss in shared-directory mode.
   4. After each merge, run the relevant test suite. If tests fail, diagnose and fix before merging the next branch.
   5. Update the task list (progress is carried by the merge commits).
   6. After merging, remove each subagent's worktree and delete its branch. Use the absolute path and branch name returned in the subagent's result.
      - Unlock the worktree first when the harness locks per-subagent worktrees: `git worktree unlock <absolute-path>`
      - Remove the worktree: `git worktree remove <absolute-path>`
      - Delete the branch: `git branch -d <branch-name>` (`-d` refuses to delete unmerged branches; if it fails, investigate before forcing)
   7. Dispatch the next batch of independent units, or the next dependent unit.

   **After all parallel subagents in a batch complete (shared-directory or fork-workspace handoff):**
   1. Wait for every subagent in the current parallel batch to finish before acting on any of their results
   2. Cross-check for discovered file collisions: compare the actual files modified by all subagents in the batch (not just their declared `Files:` lists). Subagents may create or modify files not anticipated during planning — this is expected, since plans describe *what* not *how*. A collision only matters when 2+ subagents in the same batch modified the same file. In a shared working directory, only the last writer's version survives — the other unit's changes to that file are lost. If a collision is detected: commit all non-colliding files from all units first, then re-run the affected units serially for the shared file so each builds on the other's committed work
   3. For each completed unit, in dependency order: review the diff, run the relevant test suite, stage only that unit's files, and commit with a conventional message derived from the unit's Goal
   4. If tests fail after committing a unit's changes, diagnose and fix before committing the next unit
   5. Update the task list (do not edit the plan body — progress is carried by the commits just made)
   6. Dispatch the next batch of independent units, or the next dependent unit

### Phase 2: Execute

1. **Task Execution Loop**

   For each task in priority order:

   ```
   while (tasks remain):
     - Mark task as in-progress
     - Read any referenced files from the plan, task pack, or discovered during Phase 0
     - **If the unit's work is already present and matches the plan's intent** (files exist with the expected capability, or the unit's `Verification` criteria are already satisfied by the current code), the work has likely shipped on a prior branch or session. Verify it matches, mark the task complete, and move on. Do not silently reimplement.
     - Look for similar patterns in codebase
     - Find existing test files for implementation files being changed (Test Discovery — see below)
     - Implement following existing conventions
     - Add, update, or remove tests to match implementation changes (see Test Discovery below)
     - Run System-Wide Test Check (see below)
     - Run tests after changes
     - Assess testing coverage: did this task change behavior? If yes, were tests written or updated? If no tests were added, is the justification deliberate (e.g., pure config, no behavioral change)?
     - Mark task as completed
     - Evaluate for incremental commit (see below)
   ```

   When a unit carries an `Execution note`, honor it. For test-first units, write the failing test before implementation for that unit. For characterization-first units, capture existing behavior before changing it. For units without an `Execution note`, proceed pragmatically.

   Guardrails for execution posture:
   - Do not write the test and implementation in the same step when working test-first
   - Do not skip verifying that a new test fails before implementing the fix or feature
   - Do not over-implement beyond the current behavior slice when working test-first
   - Skip test-first discipline for trivial renames, pure configuration, and pure styling work

   **Test Discovery** — Before implementing changes to a file, find its existing test files (search for test/spec files that import, reference, or share naming patterns with the implementation file). When a plan specifies test scenarios or test files, start there, then check for additional test coverage the plan may not have enumerated. Changes to implementation files should be accompanied by corresponding test updates — new tests for new behavior, modified tests for changed behavior, removed or updated tests for deleted behavior.

   **Test Scenario Completeness** — Before writing tests for a feature-bearing unit, check whether the plan's `Test scenarios` cover all categories that apply to this unit. If a category is missing or scenarios are vague (e.g., "validates correctly" without naming inputs and expected outcomes), supplement from the unit's own context before writing tests:

   | Category | When it applies | How to derive if missing |
   |----------|----------------|------------------------|
   | **Happy path** | Always for feature-bearing units | Read the unit's Goal and Approach for core input/output pairs |
   | **Edge cases** | When the unit has meaningful boundaries (inputs, state, concurrency) | Identify boundary values, empty/nil inputs, and concurrent access patterns |
   | **Error/failure paths** | When the unit has failure modes (validation, external calls, permissions) | Enumerate invalid inputs the unit should reject, permission/auth denials it should enforce, and downstream failures it should handle |
   | **Integration** | When the unit crosses layers (callbacks, middleware, multi-service) | Identify the cross-layer chain and write a scenario that exercises it without mocks |

   **System-Wide Test Check** — Before marking a task done, pause and ask:

   | Question | What to do |
   |----------|------------|
   | **What fires when this runs?** Callbacks, middleware, observers, event handlers — trace two levels out from your change. | Read the actual code (not docs) for callbacks on models you touch, middleware in the request chain, `after_*` hooks. |
   | **Do my tests exercise the real chain?** If every dependency is mocked, the test proves your logic works *in isolation* — it says nothing about the interaction. | Write at least one integration test that uses real objects through the full callback/middleware chain. No mocks for the layers that interact. |
   | **Can failure leave orphaned state?** If your code persists state (DB row, cache, file) before calling an external service, what happens when the service fails? Does retry create duplicates? | Trace the failure path with real objects. If state is created before the risky call, test that failure cleans up or that retry is idempotent. |
   | **What other interfaces expose this?** Mixins, DSLs, alternative entry points (Agent vs Chat vs ChatMethods). | Grep for the method/behavior in related classes. If parity is needed, add it now — not as a follow-up. |
   | **Do error strategies align across layers?** Retry middleware + application fallback + framework error handling — do they conflict or create double execution? | List the specific error classes at each layer. Verify your rescue list matches what the lower layer actually raises. |

   **When to skip:** Leaf-node changes with no callbacks, no state persistence, no parallel interfaces. If the change is purely additive (new helper method, new view partial), the check takes 10 seconds and the answer is "nothing fires, skip."

   **When this matters most:** Any change that touches models with callbacks, error handling with fallback/retry, or functionality exposed through multiple interfaces.


2. **Incremental Commits**

   After completing each task, evaluate whether to create an incremental commit:

   | Commit when... | Don't commit when... |
   |----------------|---------------------|
   | Logical unit complete (model, service, component) | Small part of a larger unit |
   | Tests pass + meaningful progress | Tests failing |
   | About to switch contexts (backend → frontend) | Purely scaffolding with no behavior |
   | About to attempt risky/uncertain changes | Would need a "WIP" commit message |

   **Heuristic:** "Can I write a commit message that describes a complete, valuable change? If yes, commit. If the message would be 'WIP' or 'partial X', wait."

   If the work document has Implementation Units, use them as a starting guide for commit boundaries. If the work document is a task pack, use `Task Cards`, `Execution Waves`, `dependencies`, and `task_id` as the starting guide instead. Adapt based on what you find during implementation: a unit/task might need multiple commits if it is larger than expected, or small related units/tasks might land together. Use each unit's Goal or task card `done_signal` to inform the commit message.

   **Commit workflow:**
   ```bash
   # 1. Verify tests pass (use project's test command)
   # Examples: bin/rails test, npm test, pytest, go test, etc.

   # 2. Stage only files related to this logical unit (not `git add .`)
   git add <files related to this logical unit>

   # 3. Commit with conventional message
   git commit -m "feat(scope): description of this unit"
   ```

   **Handling merge conflicts:** If conflicts arise during rebasing or merging, resolve them immediately. Incremental commits make conflict resolution easier since each commit is small and focused.

   **Note:** Incremental commits use clean conventional messages without attribution footers. The final Phase 4 commit/PR includes the full attribution.

   **Parallel subagent mode:** Commit ownership is split by isolation mode (see Phase 1 Step 4):
   - **Claude Code worktree-isolated:** subagents may stage and commit inside their own worktree branch; the orchestrator merges those branches in dependency order after the batch.
   - **Shared-directory fallback or Codex fork-workspace handoff:** subagents do not create final repo commits; the orchestrator stages, verifies, and commits each integrated unit after the batch.

3. **Follow Existing Patterns**

   - The plan should reference similar code - read those files first
   - Match naming conventions exactly
   - Reuse existing components where possible
   - Follow project coding standards from already-loaded host/project instructions, directory-scoped equivalents, `docs/contracts/`, and scope-matched confirmed team standards selected through `docs/contracts/team-standards.md`; read `AGENTS.md` / `CLAUDE.md` source only when the Host Instruction Reuse Policy allows it. Use nearby source and tests to prefer existing capabilities over reimplementation. Treat written standards that govern the changed files as hard context, and treat prior plans, learnings, candidates, and external-tool facts as advisory unless the current plan or user request makes them scope authority.
   - When in doubt, grep for similar implementations

4. **Test Continuously**

   - Run relevant tests after each significant change
   - Don't wait until the end to test
   - Fix failures immediately
   - Add new tests for new behavior, update tests for changed behavior, remove tests for deleted behavior
   - **Unit tests with mocks prove logic in isolation. Integration tests with real objects prove the layers work together.** If your change touches callbacks, middleware, or error handling — you need both.

5. **Simplify as You Go**

   After completing a cluster of related implementation units (or every 2-3 units), review recently changed files for simplification opportunities — consolidate duplicated patterns, extract shared helpers, and improve code reuse and efficiency. This is especially valuable when using subagents, since each agent works with isolated context and can't see patterns emerging across units.

   Don't simplify after every single unit — early patterns may look duplicated but diverge intentionally in later units. Wait for a natural phase boundary or when you notice accumulated complexity.

   If a simplify skill or equivalent capability is available, use it. Otherwise, review the changed files yourself for reuse and consolidation opportunities.

6. **Figma Design Sync** (if applicable)

   For UI work with Figma designs:

   - Implement components following design specs
   - Use spec-figma-design-sync agent iteratively to compare
   - Fix visual differences identified
   - Repeat until implementation matches design

7. **Track Progress**
   - Keep the task list updated as you complete tasks
   - Note any blockers or unexpected discoveries
   - Create new tasks if scope expands
   - Keep user informed of major milestones
   - When the plan defines U-IDs for Implementation Units, or the plan or origin document carries stable R-IDs (and optionally A/F/AE IDs), reference them in blockers, deferred-work notes, task summaries, and final verification — not routine status updates. U-IDs anchor units across plan edits; R/A/F/AE anchor product intent across the brainstorm-plan handoff. When available, include `spec_id` only as artifact-chain trace context, not as execution progress. Use the IDs the plan supplies and do not invent ones it does not. This preserves traceability without burying signal under noise.

### Phase 3-4: Quality Check and Finishing Work

When all Phase 2 tasks are complete and execution transitions to quality check, you must read `references/shipping-workflow.md` for the full shipping workflow: quality checks, code review, final validation, PR creation, and notification. Do not skip this.

## Key Principles

### Start Fast, Execute Faster

- Get clarification once at the start, then execute
- Don't wait for perfect understanding - ask questions and move
- The goal is to **finish the feature**, not create perfect process

### The Plan is Your Guide

- Work documents should reference similar code and patterns
- Load those references and follow them
- Don't reinvent - match what exists

### Test As You Go

- Establish a feedback loop before changing behavior, then rerun it after the slice lands.
- Run tests after each change, not at the end
- Fix failures immediately
- Continuous testing prevents big surprises

### Quality is Built In

- Follow existing patterns
- Write tests for new code
- Run linting before pushing
- Review every change — inline for simple additive work, full review for everything else

### Ship Complete Features

- Mark all tasks completed before moving on
- Don't leave features 80% done
- A finished feature that ships beats a perfect feature that doesn't

## Common Pitfalls to Avoid

- **Analysis paralysis** - Don't overthink, read the plan and execute
- **Skipping clarifying questions** - Ask now, not after building wrong thing
- **Ignoring plan references** - The plan has links for a reason
- **Testing at the end** - Test continuously or suffer later
- **Forgetting to track progress** - Update task status as you go or lose track of what's done
- **80% done syndrome** - Finish the feature, don't move on early
- **Skipping review** - Every change gets reviewed; only the depth varies
- **Re-scoping the plan into human-time phases** - The plan's Implementation Units define the scope of execution. Do not estimate human-hours per unit, propose multi-day breakdowns, or ask the user to pick a subset of units for "this session". Agents execute at agent speed, and context-window pressure is addressed by subagent dispatch (Phase 1 Step 4), not by phased sessions. If a plan-file input is genuinely too large for a single execution, say so plainly and suggest the user return to the current host's plan entrypoint to reduce scope — don't invent session phases as a workaround. For bare-prompt input, Phase 0's Large routing already handles oversized work
