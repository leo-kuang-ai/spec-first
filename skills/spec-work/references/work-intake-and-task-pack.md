# Work Intake And Task Pack

Load this reference only when Phase 0 identifies a local Markdown input with `type: task-pack`. A task pack is an optional derived execution index for one source plan; it is not a second plan, progress database, review approval, or lifecycle owner.

## Owned

- Resolve and pin the artifact/source resolution root used by `spec-first tasks`.
- Run deterministic task-pack validation and retain its current JSON receipt.
- Pin the task-pack file digest and canonical source plan hash.
- Replay source-plan implementation-readiness/content-shape intake independently from the body hash.
- Judge semantic-fit above the deterministic floor.
- Create executor tasks from the machine-readable `Task Pack Contract` and `execution_waves`.
- Capture pre-task and post-task file facts needed for bounded task review.
- Enforce `stop_if`, required review, dependent-wave blocking, drift revalidation, and source-plan lifecycle ownership.

## Not Owned

- Reimplementing `src/cli/task-pack.js` validation algorithms in prose or LLM reasoning.
- Turning task cards into product scope, acceptance, architecture, approval, or progress authority.
- Choosing a mutation repository from `--repo`; that flag owns artifact/source resolution only.
- Re-splitting the source plan into a parallel private task graph.
- Treating validator success as proof that task boundaries, declared files, `review_gate`, or semantic coverage are adequate.
- Updating task-pack `status` during execution or shipping.

## Trigger

Enter this reference only after the leading mode token is stripped and shallow file metadata identifies `type: task-pack`. Do not load it for direct unified/legacy plans, knowledge-work, blank latest-plan discovery, or trivial bare prompts.

## Fallback

If the task pack is invalid, stale, wrong-chain, unverifiable, source-plan-missing, scope-ambiguous, semantically inadequate, or drifted after intake, stop before creating or continuing execution tasks. Return the copy-ready handoff in [Failure Handoff](#failure-handoff). Do not silently reinterpret the file as a legacy plan, infer tasks from human-readable cards, or continue from a cached validation receipt.

## 1. Lock Roots And Run Deterministic Validation

Resolve one existing artifact root that contains the task pack and its `source_plan`. In a parent workspace, do not guess: require the caller/plan/task pack to identify the artifact root and the downstream mutation `target_repo` or per-task repo scope. The two roots may differ.

Run the actual CLI:

```text
spec-first tasks validate <task-pack-path> --repo <artifact-root> --json
spec-first tasks hash <source-plan-path> --repo <artifact-root> --json
```

Require all of the following before semantic intake:

- validation process succeeded;
- `schema_version: task-pack-validation/v1`;
- `identity_basis: source-plan-path+body-hash`;
- `deterministic_handoff: true`;
- `task_pack_validity: valid`;
- `artifact_root` equals the selected root (`repo_root` is only the same-value compatibility alias);
- `source_plan.path` is one concrete artifact-root-relative POSIX path;
- `validation.source_plan_hash: matched` and `validation.task_pack_contract: valid`;
- hash JSON `source_plan` equals validation `source_plan.path` and its `hash` equals task-pack metadata `source_plan_hash`.

Do not reject only because `validation.spec_id: missing`; preserve `task-pack-spec-id-trace-missing` as a compatibility-trace limitation. Reject `mismatch` as wrong-chain.

Pin these run-local facts together:

```yaml
validation_receipt: <complete current CLI JSON>
task_pack_digest: sha256:<digest of current task-pack file bytes>
source_plan_hash: sha256:<hash JSON value>
source_plan: <portable relative path>
artifact_root: <canonical root>
work_run_base: <git HEAD SHA captured before work mutation>
```

These are evidence for the current run, not durable workflow state. Do not edit the task pack to store them.

## 2. Replay Source Plan Intake

The canonical body hash intentionally excludes Markdown frontmatter, so a matched hash cannot prove current readiness. Before task creation, re-read current source-plan metadata/content shape using the same Phase 0 rules as direct plan intake:

- duplicate/missing/conflicting unified metadata fails closed;
- `artifact_readiness` must be `implementation-ready`;
- `execution` must be `code`;
- requirements-only, knowledge-work/non-code, progress-like readiness, HTML metadata/content-shape conflict, or lifecycle/source-path ambiguity stops execution;
- legacy compatibility follows the direct-plan rules rather than being invented from task-pack prose.

Read the source plan with the unified section-map strategy: metadata, Goal Capsule, relevant Requirements and Scope Boundaries/non-goals, Planning Contract KTDs cited by current tasks, Verification Contract, Definition of Done, and only the source units/refs needed for the active wave. The source plan remains authoritative for scope, acceptance, architecture, non-goals, verification, and lifecycle; the task pack compresses execution order and task context.

## 3. Semantic-Fit Gate

After deterministic validation, the LLM judges semantic-fit. Confirm from the current source plan and direct source evidence that:

- every Task Card has valid `source_unit`/`requirement_refs` for the work it claims;
- the union of Task Cards covers every material implementation unit required for this run, or explicitly records a plan-owned defer/non-goal;
- declared `files` and bounded `expected_side_effects` fit source-plan scope/non-goals/KTD and current source ownership;
- `execution_waves` follow real dependencies and do not hide same-wave contention;
- `stop_if`, `test_focus`, `done_signal`, `review_gate`, and `review_focus` are semantically adequate;
- no task adds acceptance criteria, public contract, architecture, provider boundary, source of truth, or mutation repo absent from the source plan.

If the pack omitted a material unit or conflicts with scope/non-goals/KTD, return to `spec-write-tasks` regeneration. If the source plan itself lacks the decision, return to `spec-plan`. The validator must not be credited with this semantic judgment.

## 4. Create Task Tracker From The Contract

Use `validation_receipt.task_pack.contract.tasks` and `execution_waves` as the executable task source. Preserve each `task_id` in the platform task subject and carry `source_unit`, `requirement_refs`, dependencies, goal, files, `test_focus`, `done_signal`, `stop_if`, review intent, and repo scope into the bounded worker packet.

Create tasks wave by wave in dependency order. Do not create a parallel task decomposition from the source plan or human-readable Task Cards. Human-readable sections may orient the executor, but they cannot override the validated JSON contract.

For each task, the primary completion signal is its `done_signal` plus recorded focused verification. The plan Verification Contract and Definition of Done still govern the full run.

## 5. Drift Checks Before Exits

Recompute and compare the pinned facts before every task start and before every required task review:

- current task-pack byte digest vs `task_pack_digest`;
- current canonical plan hash vs `source_plan_hash`;
- current source-plan metadata/content-shape vs the implementation-ready code intake;
- selected artifact root and task/source paths vs the pinned receipt.

On mismatch, stop the current task and all dependent work:

- `task-pack-digest-drift` -> rerun full task-pack validation and semantic-fit;
- `source-plan-hash-drift` -> regenerate/revalidate the task pack from the current plan;
- `source-plan-intake-drift` -> return to `spec-plan` or the correct non-code route;
- root/path drift -> re-resolve authority; never continue under cwd inference.

Do not patch the receipt, update only the changed field, or continue consuming old Task Cards.

## 6. Per-Task File Facts And Review Context

Capture deterministic facts with git/filesystem/hash tools; the LLM interprets scope adequacy but does not hand-calculate hashes or invent deltas.

At work intake, pin `work_run_base` to the current `HEAD` before plan-owned mutation. Before each task:

1. record all current tracked dirty and untracked repo-relative paths;
2. for every declared file, bounded expected side effect, and discovered file needed to complete existing scope, record base content SHA-256 (`work_run_base:<path>` or `absent`) and pre-task content SHA-256 (`absent` when missing);
3. retain the raw pre-task facts before implementation begins.

After task implementation and focused verification, compare current filesystem/git facts with the pre-task facts and build `spec-code-review-task-context/v1`:

- `task_pack_digest`, `source_plan`, and `work_run_base`;
- `pre_task_dirty_files`, `pre_task_untracked_files`, and `pre_task_file_facts`;
- added/modified/deleted/renamed `task_delta_files` with current hashes;
- `task_owned_untracked_files` only for files absent before the task and now present;
- no path outside the Task Card's declared files/bounded side effects unless direct evidence shows it is necessary to complete already-authorized scope.

If a new file/consumer changes acceptance, architecture, public contract, source ownership, provider boundary, or repo scope, stop and return to plan/task regeneration. Do not use “Create new tasks if scope expands” to legitimize it.

## 7. `stop_if` And Wave Control

Evaluate the active Task Card's `stop_if` before mutation, when new evidence appears, and before completion. When it fires, stop the task and every dependent task/wave, preserve the evidence, and return to `spec-write-tasks` or `spec-plan` as named by the condition. Do not create replacement tasks, weaken the condition, or mark the task complete.

Only start a task when all listed dependencies are complete with their verification and required review obligations closed. Independent tasks in the same wave still follow dispatch/isolation authorization rules.

## 8. Required Task Review

Run focused verification first. Then, for `review_gate: required`, invoke the report-only reviewer before any dependent task or later wave starts:

```text
spec-code-review mode:agent base:<work-run-base> plan:<source-plan> task-pack:<task-pack-path> task:<task_id> task-context:<path>
```

Consume `status`, `actionable_findings`, `coverage.task_scope`, `artifact_path`, and limitations. Required review is eligible to close only when status is complete, task scope says `required_gate_eligible: true`, every declared/delta/task-owned file is accounted for as `exact-file`, `cumulative-file`, or honest `mixed`, and no P0/P1 or design-decision finding remains.

- `failed`/`degraded`, `task_diff_isolation: degraded`, digest drift, scope expansion, or missing task files blocks the task and dependent wave.
- P0/P1 and design-decision findings are blockers.
- Eligible concrete fixes are caller-owned: apply them through `review-findings-followup.md`, then rerun affected verification and update current task-context hashes/delta facts.
- Run at most two review rounds total: initial review, then one bounded follow-up after fixes. If round two still has P0/P1, design-decision, failed/degraded coverage, or an ineligible required gate, stop and return the blocker instead of entering an infinite loop.
- P2/P3 findings that do not block required review enter the run-local residual list and the final Phase 3 Residual Work Gate; never drop them.

If review produced no code change, do not repeat the full task review. The final full-branch review always remains required for non-mechanical work; task review is early feedback, not a replacement.

## 9. Direct Plan Suitability

A high-complexity direct implementation-ready plan may justify one advisory recommendation to run `spec-write-tasks` when its units, dependencies, context, or verification spread would benefit from a derived index. Task compilation remains optional: never auto-compile, never block direct execution solely because a pack would help, and honor the user's choice to proceed directly.

## 10. Lifecycle And Return-To-Caller

The task pack stays `status: derived`; progress lives in the task tracker, evidence, and git. Standalone shipping may update only the lifecycle-managed `source_plan` after all gates close. Return-to-Caller returns that same source-plan completion candidate and never mutates either artifact.

## Failure Handoff

Return a compact copy-ready envelope:

```yaml
input: <task-pack path>
reason_code: <CLI or intake reason>
validation_command: spec-first tasks validate <task-pack-path> --repo <artifact-root> --json
task_pack: <path>
source_plan: <resolved path or null>
artifact_root: <root or null>
target_repo: <mutation repo or null>
next_action: rerun-validation | spec-write-tasks <source-plan> | spec-plan <source-plan> | stop
limitations: []
```

Include the actual CLI reason/error and current paths. Do not report a valid task pack, create execution tasks, or claim completion after this handoff.
