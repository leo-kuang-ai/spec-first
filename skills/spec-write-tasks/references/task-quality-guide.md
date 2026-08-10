# Task Quality Guide

This guide defines quality expectations for task cards produced by `spec-write-tasks`.

`task-pack-schema.md` remains the source of truth for required fields and document structure. This guide only explains how to write high-quality values for those fields.

## Input Quality Contract

Accepted inputs are local source plan paths, existing local task-pack paths, or clear task-splitting requests that resolve to one local source plan. Rejected near-neighbors are implementation prompts, unresolved product or architecture scope, remote repositories, package names, marketplace skill names, and generic task-list requests that do not name a settled source plan.

Executable task-pack input requires `type: task-pack`, `generated_by: spec-write-tasks`, `status: derived`, `mode: derived`, a concrete artifact-root-relative POSIX `source_plan`, a concrete `sha256:<64-hex>` source plan hash, and a valid `Task Pack Contract` JSON block. Executable identity is `source-plan-path+body-hash`; `spec_id` is an optional compatibility trace. Existing task packs with missing path/hash identity, stale hash, wrong-chain present-on-both-sides `spec_id`, unverifiable hash tooling, generated runtime file ownership, or ambiguous workspace repo scope are not executable handoff.

Downstream consumers are `spec-work`, high-risk doc-review handoff, human reviewers, and later code-review/compound workflows. These consumers need source anchors, bounded context refs, task file ownership, and validation posture; they do not need maintainer eval fixtures or validation reports.

### Downstream `spec-work` intake

`spec-work` executes only the validated `Task Pack Contract` JSON and `execution_waves`; human-readable Task Cards are context compression, not a second executable source. The executor pins the current validation receipt, task-pack file digest, and source-plan hash, replays source-plan implementation readiness, then judges semantic-fit against scope/non-goals/KTD before creating tracker tasks. Keep task IDs, files, `stop_if`, review intent, and dependencies precise enough for that consumer; a validator-green but semantically incomplete pack must return to `spec-write-tasks` or `spec-plan` rather than forcing private re-splitting.

## Quality Bar

A task is high quality when an executor can:

1. understand why it exists,
2. know exactly which source plan anchors it derives from,
3. identify the files it is allowed to touch,
4. verify completion without inventing new acceptance criteria,
5. know which bounded source orientation shaped the file boundaries,
6. know when to stop instead of expanding scope,
7. know whether the task carries review intent without mistaking that intent for approval state.

The quality bar is not whether every field is filled. The quality bar is whether an executor can safely begin with low context and finish a verifiable slice without expanding scope.

## Task-ready Source Plan

Source plan is task-ready when it has:

- clear scope boundaries,
- traceable requirements, acceptance refs, or equivalent source anchors,
- implementation units, story slices, or file boundaries clear enough to compile,
- verification or test scenarios that can become task-level done signals,
- no unresolved product, architecture, or contract decision that would change scope.

If a missing item is a true implementation-time unknown, keep the task pack derived and record it in `risk_note` and `stop_if`. If it is a planning decision, return to `spec-plan` instead of inventing task scope.

For split recommendations, prefer the source plan's own structure over helper-derived size hints. A written plan's implementation units, declared files, dependency graph, verification spread, and `plan_depth` are task-time evidence. `task-governance-signals.v1` is advisory cross-check input only; `plan-declared` mode was designed for pre-plan collection and may emit an empty-signal `lightweight` candidate when no `--input` planning context is supplied. It may also return `collection_status: degraded` or `reason_codes` such as `planning-context-unreadable` even when an `--input` path was provided. When signal collection is degraded, record the helper output in Orientation Evidence or the final envelope limitations, ignore its `candidate_level` for compile/skip decisions, and rely on source-plan structure plus direct reads. Do not treat that output as confirmed low risk, and do not make it a gate.

## Source Orientation Rules

Source orientation exists only to make task boundaries accurate enough.

Use this intake order for context economy: first read the plan/task summary and contract metadata, then deterministic inventory or validation facts, then current task/phase refs, then focused source-of-truth sections, and only then deeper references. Keep orientation facts compact by summarizing direct source reads, changed files, tests/logs, and limitations; do not create an external-tool facts pipeline.

Start from the source plan, plan-indicated source files, and nearby tests. Reuse already-loaded host/project instructions. Read `AGENTS.md` / `CLAUDE.md` source only when the active host/project instruction reuse policy allows it, such as a user-named path, missing or stale loaded context, source/runtime governance work, or directory-scoped instructions that may govern changed files. Read local contract docs only by precise path or section when they exist and materially improve task boundaries. Written project guidance may become hard task constraints only when it comes from active host/project instructions, directory-scoped instruction files, explicit contracts, or direct source evidence, applies to the changed files, and remains consistent with the source plan. Include guidance as bounded `context_refs` with source/applicability/uncertainty/fallback/limitations when useful; it must not expand source-plan scope. Other docs, prior plans, and external-tool facts are advisory context refs and must not become a workflow state machine or expand source-plan scope.

Provider order:

1. Start with targeted direct repo reads of the plan-indicated files, nearby tests, directory indexes, and local patterns.
2. If direct reads are insufficient and LSP is available, use it only for bounded source orientation: symbol overview, symbol lookup, references, and local pattern search.

Orientation evidence is advisory. It must not turn current implementation state into new tasks, replace source-plan authority, or override the source plan. If orientation reveals missing scope, contract, acceptance, or verification decisions, return `return-to-plan` or `draft-only` instead of inventing task scope.

If the source plan contains a `## Direct Evidence` block, consume `key_findings`, `impact_on_plan`, `source_reads_required`, and limitations as advisory task-focus inputs. `impact_on_plan` may influence task ordering, `source_reads_required` may become granular `context_refs`, `stop_if`, or `test_focus`, and `key_findings` may become risk notes. These facts must not create new tasks, expand source-plan scope, replace requirement refs, or choose a repo; every task pointer still needs source-plan and direct-source confirmation.

LSP provider rule:

- Activate the target project and use LSP quick indexing only for bounded source orientation: symbol overview, symbol lookup, references, and local pattern search.
- Record the provider and limitations in orientation evidence.
- Do not let LSP references automatically expand task scope or replace source-plan authority.

## Traceability Rules

Every executable task should point back to at least one deterministic source anchor:

- `source_unit` when the plan has implementation units,
- `requirement_refs` when the plan has requirements or acceptance examples.

Use `context_refs` for the smallest plan sections, contracts, research notes, or code patterns the executor must read. Current deterministic validation treats `context_refs` as auxiliary context, not as a replacement for `source_unit` or `requirement_refs`.

High-quality `context_refs` use section/file/test/contract granularity, for example a plan heading, a specific skill reference file, a test file, or a contract doc. A whole-plan ref is low quality unless paired with narrower anchors, and a whole-directory ref is acceptable only when the source plan explicitly makes that directory the bounded surface.

Every requirement should be covered by at least one task unless it is explicitly `non-goal`, `already satisfied`, or `deferred`.

Traceability should be short. Do not copy the requirement body into the task pack.

## Granularity Rules

A good task usually:

- touches one related file group,
- has one main validation focus,
- produces a meaningful execution slice,
- can be understood without rereading the entire plan,
- does not require a private subtask list to become actionable.

Split a task when:

- it mixes unrelated modules,
- it has multiple independent validation points,
- part of it can run in parallel and part must be serial,
- it combines contract, implementation, docs, and tests without a small closed loop.
- it preserves a large source implementation unit that actually contains separable feedback loops, such as module foundation, orchestration/integration, output/reporting, docs, and verification clusters.

Merge tasks when:

- each split item is too small to verify independently,
- they are consecutive changes in the same file,
- implementation and tests form one natural closed loop.

## Large Implementation Unit Fan-Out

A source implementation unit is not automatically an executable task. Deep plans often use one `U-ID` to describe a broad technical slice, but the executor still needs smaller feedback loops.

Split a single source unit into multiple tasks when it has at least two independently verifiable clusters, for example:

- a new module or helper API, plus a separate orchestration/integration path,
- path or marker primitives, plus CLI output and failure reporting,
- core behavior tests, plus docs/changelog/release-surface work,
- selected-host behavior, plus all-host cleanup or workspace/all-repos behavior.

When you fan out one source unit, repeat the same `source_unit` on each task and narrow each task with specific `requirement_refs`, `files`, `test_focus`, and `done_signal`. This keeps traceability while avoiding a task so broad that the executor needs a private task list before starting.

Do not split merely because a unit is long. Split only when the resulting tasks have distinct file groups, validation surfaces, or failure boundaries. If the split would produce tiny tasks that cannot be verified independently, keep the unit together.

## Vertical Slice And Feedback Loop Rules

Prefer tasks that form independently verifiable vertical slices. A vertical tracer bullet includes the smallest implementation path, verification loop, and necessary docs/config evidence for one behavior before broadening to the next behavior.

Acceptable feedback loops include failing or characterization tests, CLI invocations, HTTP/browser scripts, trace replay, throwaway harnesses, property/fuzz loops, docs contract checks, schema/help/render checks, or other focused commands tied to the task's `done_signal`.

Docs-only and config-only tasks are not forced into TDD. They still need observable checks, but those checks can be document contract tests, generated catalog diffs, schema validation, help text snapshots, or diff-shape review.

Horizontal slicing smell: a task pack that writes all tests for every unit first, then all implementation, then all docs makes feedback late and hides integration risk. Split into vertical slices unless the source plan explicitly requires a shared foundation before any slice can run.

## Dependency and Wave Rules

Dependencies should describe real output dependencies, not a preferred work order.

Good dependencies:

- T003 depends on T001 because it uses the contract T001 defines.
- T004 depends on T002 because it tests behavior introduced by T002.

Bad dependencies:

- T003 depends on T002 because it feels cleaner to do after it.
- Every task depends on the previous task even though files and behavior do not overlap.

Same-wave tasks should not share files. If they do, downgrade to serial or explicitly mark the overlap.

## Context Compression Rules

`context_refs` should point to the minimum material needed to execute the task:

- specific plan sections,
- relevant contracts or schema files,
- code patterns to mirror,
- research notes that affect implementation,
- source task pack sections only when needed.

Avoid:

- linking only the whole plan,
- listing every reference in the plan,
- adding background material that does not change execution.

## Field Writing Guide

Use these field-level checks before handing a task pack to `spec-work`:

| Field | Good value | Reject or revise when |
| --- | --- | --- |
| `context_refs` | Names the smallest plan sections, code files, tests, contracts, or pattern docs needed for this task; auxiliary to `source_unit` / `requirement_refs` | It points only to the whole plan, lists every reference, omits code/context needed to understand file boundaries, uses a whole directory without a plan-declared bounded surface, or is used as the only executable source anchor |
| `orientation_evidence` | Records provider, posture, evidence_refs, and limitations for bounded source orientation used to compile task boundaries | It claims LSP/direct reads as scope authority, omits limitations, or lists broad repo exploration with no task-boundary impact |
| `entry_hint` | Names where to start reading, such as a source section, helper, schema, or existing test pattern | It becomes a step-by-step implementation script or shell-command choreography |
| `expected_side_effects` | Names narrow repo-relative side effects such as a lockfile, generated fixture, or formatter-adjacent file; uses bounded globs only when exact paths are not available | It expands product scope, includes secrets/env files without an explicit plan reason, uses `**`, or duplicates broad `files` ownership |
| `test_focus` | States the primary verification surface and behavior category | It says only "tests" or requires acceptance criteria not present in the source plan |
| `done_signal` | Can be observed through tests, CLI output, diff shape, document structure, or review | It is subjective, such as "works", "complete", or "looks good" |
| `stop_if` | Names a concrete scope expansion or invalid assumption that should return to `spec-plan` | It is generic, such as "if unsure" or "if there is a problem" |
| `review_gate` | Uses `required` only for high-risk shared contracts, public workflow prose, validator/schema changes, source/runtime boundary changes, security/release/CI surfaces, or tasks that unblock multiple dependents; uses `optional` for medium-risk behavior changes; omits the field for low-risk docs/config/trivial work | It becomes a default on every task, is used as review status or approval state, or asks the validator to decide semantic risk |
| `review_focus` | Names the concrete concern a mini review or final shipping review should inspect | It repeats `test_focus`, substitutes for `done_signal` or `stop_if`, or says only "review this task" |

`review_gate` and `review_focus` are review intent. They do not record whether review passed, who approved the task, or whether execution state advanced. The task pack stays a derived execution input; progress and review outcomes live in the work run, git diff, and downstream review handoff.

## Assurance Trace Preservation

当 source plan 声明 high-risk assurance 或 required proof intent 时，优先用现有字段无损投射，不新增平行 task schema：

- `requirement_refs` 保留对应 R/AE/failure anchor；`test_focus` 写明该 task 负责的 proof intent 与行为类别；`done_signal` 写可观察结果；`risk_note` 保存 largest unproven risk、evidence authority/source-binding 限制；`review_gate` / `review_focus` 指定需要检查的 false-green、baseline 或 claim-ceiling 风险。
- 同一 requirement fan-out 到多个 tasks 时，required proof intent 不得丢失：每个 intent 都必须有明确 owner task，或者在 `stop_if` / `risk_note` 中留下 deferred/unbound limitation。
- Unbound intent 保持 limitation，不得用占位 command 或 synthetic check 伪装成 task 已具备可执行 verification。
- Task card 只保留计划语义和验证焦点；`transcribed`、`provider-confirmed`、`source-bound` 与最终 required-proof reconciliation 结果属于 downstream work/review evidence，不在 task pack 中伪造执行状态。

## Task Pack Review Checklist

When reviewing a task pack, check:

- it is derived from exactly one source plan and does not add scope,
- `Task Pack Contract` exists and is the machine-readable source,
- identity and freshness can be validated with `spec-first tasks validate --json`,
- every task has a source anchor through `source_unit` or `requirement_refs`,
- every task has concrete repo-relative `files`,
- task `files` avoid generated runtime mirrors such as `.claude/**`, `.codex/**`, and `.agents/skills/**`,
- `expected_side_effects` is absent or limited to explicit side effects; it never uses `**` whole-repo globs,
- same-wave tasks do not share files,
- Orientation Evidence names provider, posture, evidence_refs, and limitations without turning LSP/current code state into source-plan scope,
- `context_refs` reduce first-pass reading instead of duplicating the whole plan,
- `stop_if` protects the source plan boundary,
- `review_gate` is absent, `optional`, or `required` based on concrete task risk rather than defaulting every task to required,
- `review_focus` describes what to inspect without replacing `test_focus`, `done_signal`, or `stop_if`.

## Done Signal Rules

`done_signal` should be observable through tests, diff, CLI output, document structure, or review.

Good done signals:

- `spec-work` describes task pack hash rejection before creating execution tasks.
- Unit tests cover stale task pack rejection and valid task pack pass-through.
- `Task Cards` include `stop_if` for every executable task.

Bad done signals:

- code is done,
- logic is complete,
- works normally,
- looks good.

## Stop Signal Rules

`stop_if` should name concrete scope expansion or invalid assumptions.

Good stop signals:

- need to add a new public command not declared by the source plan,
- need to modify files outside the task's declared core file set,
- source plan hash does not match the task pack,
- current tests cannot observe the task's `done_signal`,
- implementation reveals a scope boundary conflict with real code.

Bad stop signals:

- if there is a problem,
- if unsure,
- if scope changes,
- ask the user when needed.

## Bad Smells

| Bad smell | Why dangerous | Fix |
| --- | --- | --- |
| Task repeats plan prose | No context compression | Replace with source anchors and an execution slice |
| Goal has multiple unrelated verbs | Task is too large | Split by validation point or file boundary |
| Dependencies encode preference | Reduces parallelism | Keep only real output dependencies |
| `files` uses broad globs, directories, or shorthand paths | Execution boundary is weak and deterministic validation cannot prove overlap safely | Use non-empty concrete repo-relative POSIX file paths |
| `context_refs` lists everything | Executor still has to read the whole plan | Keep only task-critical refs |
| `context_refs` points only to a whole plan or whole directory | Task pack fails to reduce intake context and can blur source-plan anchors | Add specific section, file, test, or contract refs |
| Orientation Evidence is missing or overclaims | Executor cannot tell why boundaries are accurate, or evidence becomes a second plan | Record bounded provider/evidence/limitations and keep the source plan authoritative |
| `done_signal` is subjective | Cannot verify completion | Use test, diff, CLI, docs, or review signals |
| `stop_if` is vague | Cannot stop scope creep | Name concrete out-of-scope triggers |
| Horizontal all-tests-then-all-implementation slicing | Feedback arrives too late and integration risk is hidden | Prefer vertical tracer bullets with one behavior, verification loop, and docs/config evidence closed together |
| Large source unit kept as one task | The validator may pass while the executor still has to privately split module, integration, output, and docs work | Fan out the source unit into multiple tasks that repeat the same `source_unit` but have narrower files, verification, and stop signals |
| `review_gate` is required by default | Creates review noise and encourages executors to bypass the field | Reserve `required` for high-risk or dependency-unblocking tasks; use `optional` sparingly and omit for low-risk tasks |
| `review_focus` repeats test focus | Review loses a distinct risk lens | Name the contract, boundary, or semantic concern review should inspect |
| Task adds scope | Task pack becomes a second plan | Return to `spec-plan` |

## Examples

### Good

```md
- T002
  source_unit: U2
  goal: Make `spec-work` reject stale or wrong-chain task packs before creating execution tasks
  dependencies: [T001]
  files:
    - skills/spec-work/SKILL.md
  requirement_refs:
    - R3
  context_refs:
    - docs/plans/example-plan.md#Implementation-Units
    - skills/spec-write-tasks/references/task-pack-schema.md#Regeneration-Rules
  entry_hint: Compare Phase 1 input handling with task pack regeneration rules
  test_focus: Task pack path is validated before execution task creation
  done_signal: `spec-work` documents source_plan/source_plan_hash identity, optional compatibility trace handling, and stale-pack/wrong-chain rejection
  parallelizable: false
  risk_note: Treating task pack as authoritative would break plan SoT
  review_gate: required
  review_focus: Check stale/wrong-chain rejection and source-plan authority before dependent execution
  stop_if: Need to add a new workflow entrypoint or remove direct plan-to-work execution
  wave: 2
```

Why it is good:

- goal describes one deliverable behavior,
- files are bounded,
- context refs are specific,
- done signal is reviewable,
- stop signal protects architecture boundaries.

### Bad

```md
- T002
  goal: Improve task pack support
  dependencies: []
  files:
    - skills/**
  context_refs:
    - docs/plans/example-plan.md
  test_focus: Test related logic
  done_signal: Feature works
  stop_if: If there is a problem
```

Why it is bad:

- goal is too vague,
- file boundary is too broad,
- context is not compressed,
- test focus is not actionable,
- done signal is subjective,
- stop signal cannot prevent scope creep.
