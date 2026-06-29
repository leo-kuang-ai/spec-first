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
  - "Requirements"
  - "Scope Boundaries"
  - "Implementation Units"
---
```

### Deterministic Frontmatter

These fields are required for executable handoff and are validated by `spec-first tasks validate`:

| Field | Meaning |
| --- | --- |
| `type` | Must be `task-pack` |
| `status` | Executable handoff must be `derived`; unverified drafts must use `draft` and are reported as non-executable by the validator |
| `spec_id` | Spec-chain identity copied from the source plan; executable handoff requires it |
| `source_plan` | Concrete repo-relative POSIX file path to the single source plan |
| `source_plan_hash` | Canonical source plan body hash; executable handoff must use `sha256:<64-hex>` |
| `generated_by` | Must be `spec-write-tasks` |
| `mode` | Executable handoff must be `derived`; transient slices are not stable `spec-work` input |

### Human-Readable Frontmatter

These fields improve review and regeneration quality, but current deterministic validation does not prove them:

| Field | Meaning |
| --- | --- |
| `title` | Task pack title |
| `date` | Generation date |
| `source_sections` | Plan sections actually consumed by this task pack |
| `target_repo` | Selected child repo for parent-workspace single-repo work, when applicable |

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

Current deterministic validation only checks frontmatter identity/freshness and the `Task Pack Contract` JSON structure. The surrounding body sections remain required for high-quality LLM/human handoff, but they are review requirements rather than proof supplied by `spec-first tasks validate`.

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

- Wave ids must be strings or numbers.
- Same-wave tasks should avoid shared files.
- If files overlap, serialize the tasks into different waves; executable task packs do not support same-wave overlap markers.
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
      "expected_side_effects": ["package-lock.json"],
      "test_focus": "Valid and stale task pack validation.",
      "done_signal": "Validator tests pass.",
      "wave": 1,
      "review_gate": "required",
      "review_focus": "Review task-pack validator compatibility and source-plan boundary.",
      "stop_if": "Validation requires judging task splitting quality or changing source-plan scope."
    }
  ]
}
```

MVP required task fields are `task_id`, `dependencies`, non-empty concrete `files`, `goal`, `test_focus`, `done_signal`, `wave`, and `stop_if`, plus at least one source anchor through `source_unit` or `requirement_refs`. The deterministic validator treats `context_refs`, `entry_hint`, `parallelizable`, `risk_note`, `expected_side_effects`, `review_gate`, and `review_focus` as quality/review fields rather than hard executable fields.

Maintenance contract: the deterministic task-field set is owned jointly by this schema and `src/cli/task-pack.js`. Adding, removing, or renaming a deterministic field (the required set or the allowed-field whitelist) must update both `REQUIRED_TASK_FIELDS` / `ALLOWED_TASK_FIELDS` in `src/cli/task-pack.js` and the task-field tables in the `Task Cards` section of this schema in the same change; a parity test enforces bidirectional sync (every validator field is documented as a task-card field, and every documented task-card field is validator-recognized), so dropping a field on either side fails the test. Quality/review fields that the validator only shape-checks may still evolve in prose, but any field name the validator recognizes must appear in this schema's field tables. When present, `expected_side_effects` must be an array of repo-relative exact paths or bounded globs and must not use `**` whole-repo globs. When present, `review_gate` must be exactly `optional` or `required`; absence means no task-level review gate. The validator checks only the enum structure, not whether the task semantically deserves a gate.

## Task Cards

`Task Cards` is the human-readable mirror of the `Task Pack Contract` JSON; the JSON block is the machine-readable canonical source, and the JSON wins on any conflict. When you edit a task card, update the corresponding JSON entry in the same change so the mirror does not drift from the canonical source.

Executable task cards must include these deterministic fields:

| Field | Meaning |
| --- | --- |
| `task_id` | Stable identifier such as `T001` |
| `source_unit` | Matching plan `U-ID` when available |
| `requirement_refs` | Related Requirements / legacy Requirements Trace / acceptance refs; required when `source_unit` is absent |
| `goal` | Task goal |
| `dependencies` | Prerequisite task IDs |
| `files` | Non-empty concrete repo-relative POSIX file paths; no globs, directories, `.`, `..`, `...`, or backslash separators |
| `test_focus` | Primary verification focus |
| `done_signal` | Observable completion signal |
| `stop_if` | Condition that should send execution back to the plan or user confirmation |
| `wave` | Execution wave |

### Quality Task Fields

These fields should be added when useful for context compression, review, or workspace safety, but current deterministic validation does not prove their semantic adequacy:

| Field | Meaning |
| --- | --- |
| `context_refs` | Specific plan sections, source files, tests, contracts, pattern docs, or research notes the executor must read; bounded reading pointers, not scope authority |
| `entry_hint` | Suggested place to begin reading; not implementation steps |
| `parallelizable` | Boolean hint for whether the task can run in parallel |
| `expected_side_effects` | Explicit side-effect allowlist for delegation staging, such as a lockfile, generated fixture, or formatter-adjacent file; this is not extra scope |
| `risk_note` | Main risk |
| `notes` | Additional context for human readers |
| `review_gate` | Optional task-level review intent, either `optional` or `required`; not an approval state |
| `review_focus` | Specific review concern for mini review or final shipping review |
| `handoff_owner` | Suggested executor type when relevant |
| `target_repo` | Selected child repo in parent-workspace contexts |
| `semantic_posture_evidence` | Object carrying provenance metadata for `semantic_posture` claims (source, producer, evidence_ref, checked_at, reason_code, limitations). CLI shape-checks only; semantic adequacy is LLM/human judgment. |
| `dispatch_authorization_evidence` | Object carrying provenance metadata for `dispatch_authorization` claims (same shape as `semantic_posture_evidence`). CLI shape-checks only. |

### Recommended Human-Readable Task Card Example

```md
- T001
  source_unit: U1
  goal: Establish the core data structure and boundary contract
  dependencies: []
  files:
    - src/cli/task-pack.js
    - tests/unit/task-pack-command.test.js
  expected_side_effects:
    - package-lock.json
  requirement_refs:
    - R1
  context_refs:
    - docs/plans/example-plan.md#U2-Task-pack-source-plan-focused-read
    - skills/spec-work/SKILL.md#Phase-1-Quick-Start
    - tests/unit/spec-work-contracts.test.js
  entry_hint: Start with the plan's Requirements and Scope Boundaries
  test_focus: Minimal happy path for core behavior
  done_signal: Relevant tests pass and the boundary is stable
  parallelizable: false
  risk_note: Core structure drift would affect later tasks
  review_gate: required
  review_focus: Check source-plan authority, validator compatibility, and scope expansion risks
  stop_if: A new public entrypoint, config key, or durable state file is needed but absent from the plan
  wave: 1
```

## Orientation Evidence

Orientation Evidence records the bounded source orientation used to make task boundaries accurate enough. It is advisory execution context, not a source of scope, requirements, or acceptance criteria.

Include:

- `provider`: `direct-repo-reads`, `lsp`, `mixed`, or `skipped`.
- `posture`: `bounded`, `degraded`, `skipped-small-plan`, or `unavailable`.
- `evidence_refs`: short references to candidate files, tests, shared surfaces, or direct repo reads that shaped task boundaries.
- `limitations`: missing, stale, degraded, or intentionally skipped evidence.

Rules:

- Do not turn current implementation state into new task scope.
- Do not treat current code state as a substitute for source-plan authority or bounded source reading.
- Use targeted direct repo reads as the default orientation provider.
- LSP is an optional orientation provider and must be recorded as advisory evidence when used.

## Source/Runtime File Boundary

Task `files` and `expected_side_effects` must point at source-of-truth or allowed generated artifacts, not generated host runtime mirrors. Executable handoff must reject `.claude/**`, `.codex/**`, and `.agents/skills/**` task file ownership because runtime mirrors are regenerated from source and must not be hand-edited as source fixes.

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
- task files do not point at generated runtime mirrors such as `.claude/**`, `.codex/**`, or `.agents/skills/**`,
- expected_side_effects, when present, use repo-relative exact paths or bounded globs and never `**` whole-repo globs,
- each task is listed in exactly one matching execution wave,
- same-wave file overlap is absent or serialized.

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
