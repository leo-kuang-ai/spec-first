# Task Quality Guide

This guide defines quality expectations for task cards produced by `spec-write-tasks`.

`task-pack-schema.md` remains the source of truth for required fields and document structure. This guide only explains how to write high-quality values for those fields.

## Quality Bar

A task is high quality when an executor can:

1. understand why it exists,
2. know exactly which source plan anchors it derives from,
3. identify the files it is allowed to touch,
4. verify completion without inventing new acceptance criteria,
5. know which bounded source orientation shaped the file boundaries,
6. know when to stop instead of expanding scope.

The quality bar is not whether every field is filled. The quality bar is whether an executor can safely begin with low context and finish a verifiable slice without expanding scope.

## Task-ready Source Plan

Source plan is task-ready when it has:

- clear scope boundaries,
- traceable requirements, acceptance refs, or equivalent source anchors,
- implementation units, story slices, or file boundaries clear enough to compile,
- verification or test scenarios that can become task-level done signals,
- no unresolved product, architecture, or contract decision that would change scope.

If a missing item is a true implementation-time unknown, keep the task pack derived and record it in `risk_note` and `stop_if`. If it is a planning decision, return to `spec-plan` instead of inventing task scope.

## Traceability Rules

Every executable task should point back to at least one deterministic source anchor:

- `source_unit` when the plan has implementation units,
- `requirement_refs` when the plan has requirements or acceptance examples.

Use `context_refs` for the smallest plan sections, contracts, research notes, or code patterns the executor must read. Current deterministic validation treats `context_refs` as auxiliary context, not as a replacement for `source_unit` or `requirement_refs`.

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

Merge tasks when:

- each split item is too small to verify independently,
- they are consecutive changes in the same file,
- implementation and tests form one natural closed loop.

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
| `context_refs` | Names the smallest plan sections, code files, contracts, or pattern docs needed for this task; auxiliary to `source_unit` / `requirement_refs` | It points only to the whole plan, lists every reference, omits code/context needed to understand file boundaries, or is used as the only executable source anchor |
| `orientation_evidence` | Records provider, posture, evidence_refs, and limitations for bounded source orientation used to compile task boundaries | It claims LSP/direct reads as scope authority, omits limitations, or lists broad repo exploration with no task-boundary impact |
| `entry_hint` | Names where to start reading, such as a source section, helper, schema, or existing test pattern | It becomes a step-by-step implementation script or shell-command choreography |
| `test_focus` | States the primary verification surface and behavior category | It says only "tests" or requires acceptance criteria not present in the source plan |
| `done_signal` | Can be observed through tests, CLI output, diff shape, document structure, or review | It is subjective, such as "works", "complete", or "looks good" |
| `stop_if` | Names a concrete scope expansion or invalid assumption that should return to `spec-plan` | It is generic, such as "if unsure" or "if there is a problem" |

## Task Pack Review Checklist

When reviewing a task pack, check:

- it is derived from exactly one source plan and does not add scope,
- `Task Pack Contract` exists and is the machine-readable source,
- identity and freshness can be validated with `spec-first tasks validate --json`,
- every task has a source anchor through `source_unit` or `requirement_refs`,
- every task has concrete repo-relative `files`,
- same-wave tasks do not share files,
- Orientation Evidence names provider, posture, evidence_refs, and limitations without turning LSP/current code state into source-plan scope,
- `context_refs` reduce first-pass reading instead of duplicating the whole plan,
- `stop_if` protects the source plan boundary.

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
| Orientation Evidence is missing or overclaims | Executor cannot tell why boundaries are accurate, or evidence becomes a second plan | Record bounded provider/evidence/limitations and keep the source plan authoritative |
| `done_signal` is subjective | Cannot verify completion | Use test, diff, CLI, docs, or review signals |
| `stop_if` is vague | Cannot stop scope creep | Name concrete out-of-scope triggers |
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
    - skills/spec-work-beta/SKILL.md
  requirement_refs:
    - R3
  context_refs:
    - docs/plans/example-plan.md#Implementation-Units
    - skills/spec-write-tasks/references/task-pack-schema.md#Regeneration-Rules
  entry_hint: Compare Phase 1 input handling with task pack regeneration rules
  test_focus: Task pack path is validated before execution task creation
  done_signal: `spec-work` documents spec_id/source_plan/source_plan_hash checks plus stale-pack and wrong-chain rejection
  parallelizable: false
  risk_note: Treating task pack as authoritative would break plan SoT
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
