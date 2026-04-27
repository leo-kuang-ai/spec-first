# Task Pack Schema

Task packs produced by `spec-write-tasks` are derived execution inputs for a source plan. They are not a second plan. This schema makes task packs readable by humans and stable enough for downstream workflow consumption.

## File Location

Executable handoff task packs should be written to:

`docs/tasks/YYYY-MM-DD-NNN-<type>-<slug>-tasks.md`

## Frontmatter

```yaml
---
title: "<Task Pack Title>"
type: "task-pack"
status: "derived"
date: "2026-04-26"
spec_id: "YYYY-MM-DD-NNN-<slug>"
source_plan: "docs/plans/YYYY-MM-DD-NNN-<type>-<slug>-plan.md"
source_plan_hash: "sha256:<64-hex>"
generated_by: "spec-write-tasks"
mode: "derived"
source_sections:
  - "Requirements Trace"
  - "Scope Boundaries"
  - "Implementation Units"
---
```

### Required Frontmatter

| Field | Meaning |
| --- | --- |
| `title` | Task pack title |
| `type` | Must be `task-pack` |
| `status` | Executable handoff must be `derived`; unverified drafts must use `draft` |
| `date` | Generation date |
| `spec_id` | Spec-chain identity copied from the source plan; executable handoff requires it |
| `source_plan` | Repo-relative path to the single source plan |
| `source_plan_hash` | Canonical source plan body hash; executable handoff must use `sha256:<64-hex>` |
| `generated_by` | Must be `spec-write-tasks` |
| `mode` | Executable handoff must be `derived`; transient slices are not stable `spec-work` input |
| `source_sections` | Plan sections actually consumed by this task pack |

`spec_id` and `source_plan_hash` have separate jobs. `spec_id` identifies the requirements/plan/task-pack chain; `source_plan_hash` proves the task pack is still derived from the current source plan body. A task pack whose `spec_id` does not match the source plan is a wrong-chain handoff. A task pack whose hash does not match is stale.

`source_plan_hash` must be produced by `spec-first tasks hash <plan-path>` using canonical source plan body hashing: UTF-8 text, normalized newlines, complete frontmatter removed when present, and the remaining Markdown body hashed without section extraction or whitespace collapsing.

If the source plan lacks `spec_id`, do not write an executable task pack. Return to `spec-plan` to add plan frontmatter, or write only a draft/transient task pack that is explicitly not valid `spec-work` input.

If the current environment cannot produce a verifiable hash, do not write an executable handoff. A draft/non-executable task pack is allowed only when:

- `status: "draft"`,
- `mode: "transient"` or `Validation Notes` explicitly marks it non-executable,
- `source_plan_hash` is not disguised as a real hash,
- the output does not recommend direct `spec-work` handoff.

## Body Structure

1. `Overview`
2. `Source Summary`
3. `Traceability Matrix`
4. `Task Graph`
5. `Execution Waves`
6. `Task Pack Contract`
7. `Task Cards`
8. `Orientation Evidence`
9. `Validation Notes`
10. `Regeneration Rules`

## Source Summary

Source Summary records which source anchors the task pack consumed. It must not restate the plan body.

Include:

- source plan path,
- task-ready branch,
- consumed source sections,
- scope boundaries that shaped task splitting,
- implementation-time unknowns summary.

## Traceability Matrix

Traceability Matrix makes requirement / source unit / task / validation coverage reviewable.

```md
| Source | Requirement / Acceptance | Task(s) | Validation |
| --- | --- | --- | --- |
| U1 | R1, AE1 | T001, T002 | unit tests + smoke path |
```

Rules:

- Every source unit or requirement should appear at least once.
- If a requirement produces no task, mark it as `non-goal`, `already satisfied`, or `deferred`.
- Validation describes verification focus, not shell command choreography.
- For a small task pack with one or two tasks, a one-line coverage statement in `Overview` may replace a full table.

## Task Graph

Task Graph explains:

- which tasks must happen first,
- which tasks can run in parallel,
- which tasks share prerequisites,
- which tasks require foundation work or validation before others.

## Execution Waves

A wave is an execution grouping, not a state machine.

- Same-wave tasks should avoid shared files.
- If files overlap, serialize the tasks or mark the overlap explicitly. Serialize means: move the later task to `wave + 1`. Mark explicitly means: record the overlapping file and reason in the affected task's `notes` field.
- Hidden dependencies must not be hidden behind wave labels.

## Task Pack Contract

Executable task packs must include exactly one fenced JSON block under `## Task Pack Contract`. This block is the only machine-readable task-card source for validators. Human-readable `Task Cards` may repeat the same information for review, but validators must not infer structure from free-form Markdown.

```json
{
  "schema_version": "task-pack/v1",
  "execution_waves": [
    {
      "wave": 1,
      "tasks": ["T001"]
    }
  ],
  "tasks": [
    {
      "task_id": "T001",
      "source_unit": "U1",
      "requirement_refs": ["R1"],
      "goal": "Validate task pack identity, freshness, and structure.",
      "dependencies": [],
      "files": ["src/cli/task-pack.js"],
      "test_focus": "Valid and stale task pack validation.",
      "done_signal": "Validator tests pass.",
      "wave": 1,
      "stop_if": "Validation requires judging task splitting quality or changing source-plan scope."
    }
  ]
}
```

MVP required task fields are `task_id`, `dependencies`, `files`, `goal`, `test_focus`, `done_signal`, `wave`, and `stop_if`, plus at least one source anchor through `source_unit` or `requirement_refs`.

## Task Cards

Every task card must include these fields:

| Field | Meaning |
| --- | --- |
| `task_id` | Stable identifier such as `T001` |
| `source_unit` | Matching plan `U-ID`; use `null` when none exists |
| `requirement_refs` | Related Requirements Trace / acceptance refs |
| `goal` | Task goal |
| `dependencies` | Prerequisite task IDs |
| `files` | Allowed file list |
| `context_refs` | Plan sections, code patterns, contracts, research, or references the executor must read |
| `entry_hint` | Suggested place to begin reading; not implementation steps |
| `test_focus` | Primary verification focus |
| `done_signal` | Observable completion signal |
| `parallelizable` | Whether the task can run in parallel |
| `risk_note` | Main risk |
| `stop_if` | Condition that should send execution back to the plan or user confirmation |
| `wave` | Execution wave |

### Optional Task Fields

These fields may be added when useful, but they do not replace required fields:

| Field | Meaning |
| --- | --- |
| `notes` | Additional context for human readers |
| `review_focus` | Specific review concern |
| `handoff_owner` | Suggested executor type when relevant |
| `orientation_evidence` | Optional task-level record of bounded source orientation used to make this task's file boundaries accurate. Records `provider`, `posture`, `evidence_refs`, and `limitations` at task granularity. Complements the document-level `## Orientation Evidence` section; neither replaces the other. |

### Recommended Human-Readable Task Card Example

```md
- T001
  source_unit: U1
  goal: Establish the core data structure and boundary contract
  dependencies: []
  files:
    - src/cli/...
    - tests/unit/...
  requirement_refs:
    - R1
  context_refs:
    - docs/plans/...#Implementation-Units
    - skills/spec-work/SKILL.md
  entry_hint: Start with the plan's Requirements Trace and Scope Boundaries
  test_focus: Minimal happy path for core behavior
  done_signal: Relevant tests pass and the boundary is stable
  parallelizable: false
  risk_note: Core structure drift would affect later tasks
  stop_if: A new public entrypoint, config key, or durable state file is needed but absent from the plan
  wave: 1
```

## Orientation Evidence

Orientation Evidence records the bounded source orientation used to make task boundaries accurate enough. It is advisory execution context, not a source of scope, requirements, or acceptance criteria.

Include:

- `provider`: `crg`, `direct-repo-reads`, `serena-lsp`, `mixed`, or `skipped`.
- `posture`: `bounded`, `degraded`, `skipped-small-plan`, or `unavailable`.
- `evidence_refs`: short references to CRG queries, candidate files, tests, shared surfaces, or direct repo reads that shaped task boundaries.
- `limitations`: missing, stale, degraded, or intentionally skipped evidence.

Rules:

- Prefer CRG evidence when graph state is ready, because CRG is the project fact layer.
- Use CRG to locate candidate files, tests, shared surfaces, impact, and parallel risk.
- Do not turn current implementation state into new task scope.
- Do not treat CRG as a substitute for source-plan authority or bounded source reading.
- In MVP, fall back to targeted direct repo reads when CRG is unavailable, degraded, stale, or insufficient.
- Serena/LSP is a Phase 2 orientation provider and must be recorded as advisory evidence when used.

## Task Organization Views

Task packs may combine three organization views:

| View | Use When | Purpose |
| --- | --- | --- |
| Foundation-first | Shared schema, contract, adapter, or test infrastructure exists | Build minimal foundations before parallel slices |
| Story-first | The plan has user stories, acceptance examples, or end-to-end behavior | Keep each story independently implementable and verifiable |
| Unit-first | The plan has clear implementation units | Preserve traceability to U-IDs |

Recommended order:

1. Identify foundation tasks.
2. Generate feature tasks by user-verifiable slice or implementation unit.
3. Add integration, docs, release-surface, or polish tasks last.

Do not mechanically convert each implementation unit into one task.

## Granularity Guide

A task should usually:

- be startable without rereading the entire plan,
- touch one related file group,
- have one primary verification target,
- unlock a dependency or deliver an independent slice,
- not require more than five private subtasks to become actionable.

Split when:

- a task touches unrelated modules,
- contract, implementation, docs, and tests do not form one small closed loop,
- there are multiple independent verification points,
- part of the work can run in parallel and part must be serial.

Merge when:

- split tasks are too small to verify independently,
- changes are consecutive edits in the same file,
- implementation and tests form one natural closed loop.

For detailed quality guidance, bad smells, and examples, see [Task Quality Guide](task-quality-guide.md). This schema defines structure and field contracts only.

## Deterministic Lint

Scripts may check:

- frontmatter fields are complete,
- `spec_id` is present and matches the current source plan when the source plan has one,
- `source_plan` exists,
- `source_plan_hash` format is valid and executable handoff uses `sha256:<64-hex>`,
- if `spec_id` does not match the current source plan, execution must be rejected,
- `Task Pack Contract` exists as a single fenced JSON block and parses,
- `task_id` values are unique,
- MVP required task fields, including `stop_if`, are present and structurally valid,
- dependencies point to existing tasks,
- files use concrete repo-relative paths,
- each task is listed in exactly one matching execution wave,
- same-wave file overlap is absent or serialized,
- `task_id` values in the `Task Pack Contract` JSON block and in the human-readable `Task Cards` Markdown are consistent; if they conflict, the JSON block is authoritative. Scripts may check that the two sets are equal.

Scripts must not judge task splitting quality, business boundaries, or whether parallelization is semantically appropriate. Those are LLM judgments.

## Validation Notes

Validation Notes must state:

- which source plan the task pack derives from,
- how the source plan hash was verified,
- when an old task pack must be rejected,
- which task validations best prove the split is useful.

## Regeneration Rules

Rebuild the task pack when any of these changes:

- plan,
- scope,
- implementation units,
- files,
- verification,
- task pack semantics after manual editing.

If `source_plan_hash` does not match, execution must be rejected and the task pack must be rebuilt.

If `spec_id` does not match the current source plan, execution must be rejected as wrong-chain handoff and the task pack must be rebuilt from the source plan.

If execution triggers a task's `stop_if`, return to `spec-plan` or rerun `spec-write-tasks`.

When a plan edit is cosmetic (for example, whitespace or a comment in the frontmatter), run `spec-first tasks hash <plan-path>` before deciding whether to rebuild: if the hash is unchanged, no rebuild is needed; if the hash changed, the hard rejection rule above applies and the task pack must be rebuilt. Note: `spec-first tasks validate` checks structural validity only — it cannot determine whether a plan change affects task file sets or done signals, so it is not the right tool for this check.

## Schema Version and Migration

The `schema_version` field lives inside the `Task Pack Contract` JSON block (not in the frontmatter). Its current value is `"task-pack/v1"`.

If the schema is upgraded to v2, the handling strategy for v1 task packs (reject, downgrade, migrate) must be documented in the updated `task-pack-schema.md` at that time. `validateTaskPackContract` already emits an error when `schema_version` does not match `task-pack/v1`, so any v1 task pack encountering a v2 validator will be rejected and must be rebuilt.
