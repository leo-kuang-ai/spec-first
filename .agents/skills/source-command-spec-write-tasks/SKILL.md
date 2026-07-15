---
name: "source-command-spec-write-tasks"
description: "Public workflow entrypoint (spec-write-tasks): compile a settled local spec-plan into an optional derived task pack for spec-work, or validate an existing local task pack before execution. Use for explicit plan-splitting/task-doc requests or high-complexity work suitability; do not use for plan authoring, implementation execution, unresolved scope, small low-risk plans, progress/approval state, remote/generic task lists, or generated runtime mirror edits. Keep the plan as single source of truth; tasks are derived and optional."
---

# source-command-spec-write-tasks

Use this skill when the user asks to run the migrated source command `spec-write-tasks`.

## Command Template

Command support root: `.Codex/spec-first/workflows/spec-write-tasks`. Treat it as the loaded skill directory whenever this inlined workflow refers to `SKILL_DIR` or the directory containing `SKILL.md`.

# `spec-write-tasks`

`spec-write-tasks` is an optional derived layer between `spec-plan` and `spec-work`. It does not execute code. It either compiles a settled source plan into a derived task pack, validates an existing task pack, or returns a no-task-pack decision.

It is a public workflow with the unified entrypoint `spec-write-tasks`.

## Purpose

Decide whether a derived task pack is worthwhile, compile one when it reduces execution risk or context load, and validate existing task packs before they reach `spec-work`.

## Workflow Contract Summary

### When To Use

Use when a settled local source plan is too large or dependent for direct execution, when the user explicitly asks to split a plan into tasks, or when an existing local task pack needs validation before `spec-work`.

### When Not To Use

Do not use for unresolved product or architecture scope, small changes that do not need a derived layer, remote repositories or package names, marketplace skill lookup, or implementation prompts that should go directly to `spec-work`.

### Inputs

A local source plan path, existing task-pack path, or clear task-splitting request that resolves to one local source plan. Inputs must stay local and source-owned; remote repos, packages, marketplace identifiers, and generic task lists are rejected.

### Outputs

One of: executable derived task pack, validated existing task-pack handoff, `skip`, `return-to-plan`, `draft-only`, or `validate-only` envelope. Task packs are derived execution indexes and never replace the source plan.

### Artifacts

Executable task packs live under `docs/tasks/` and must carry `spec_id`, `source_plan`, `source_plan_hash`, `generated_by: spec-write-tasks`, `mode: derived`, and a valid `Task Pack Contract` JSON block.

### Failure Modes

Use machine-readable reason codes: `source_plan_missing`, `ambiguous_plan`, `missing_spec_id`, `wrong_chain`, `stale_hash`, `unverifiable_hash`, `invalid_contract`, `repo_scope_missing`, or `scope_gap`.

### Workflow

Classify input, verify plan identity and repo scope, choose one branch (`compile`, `skip`, `return-to-plan`, `draft-only`, `validate-only`), use bounded source orientation only when it improves task boundaries, write or validate the task pack, then return the final decision envelope.

### Downstream Consumers

`spec-work`, high-risk `spec-doc-review` handoff, human reviewers, and later code-review/compound workflows.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).

Overrides: none

## Core Rules

1. `spec-plan` is always the single source of truth.
2. A task pack may rearrange execution slices, but must not change scope, acceptance criteria, non-goals, repo ownership, or product decisions.
3. A task pack is not progress state, approval state, a lifecycle database, or a second plan.
4. `context_refs` are bounded reading pointers, not scope authority. Whole-plan or whole-directory refs are low-quality unless paired with narrower anchors.
5. If parent-workspace scope is present, the plan or task pack must name `target_repo` at top level or per task. Missing repo scope returns to `spec-plan`.
6. Source orientation is advisory and bounded: source plan sections, plan-declared files, nearby tests, and precise local contracts only when they improve task boundaries.
7. Scripts validate identity, freshness, structure, hashes, concrete paths, and same-wave overlap. LLM/reviewers judge semantic task quality.
8. Do not hand-edit `.Codex/`, `.codex/`, or `.agents/skills/` as source fixes.

## Input Paths

- Source plan path: read the source plan frontmatter and focused sections: Requirements, Scope Boundaries, Technical Approach, Implementation Units, Files, Test Scenarios, Verification, and Deferred to Implementation.
- Existing task-pack path: read the task pack, source plan, and `Task Pack Contract`; validate identity/freshness/structure before treating it as executable.
- Bare task-splitting request: resolve exactly one local source plan; if resolution is ambiguous, ask for the path.

Use [Task Quality Guide](.Codex/spec-first/workflows/spec-write-tasks/references/task-quality-guide.md) for accepted/rejected input classes, task-ready source plan rules, source orientation, traceability, vertical slices, `context_refs`, `done_signal`, `stop_if`, and review-intent quality guidance.

## Branches

- `compile`: plan is task-ready and a task pack reduces execution risk or context load.
- `skip`: direct `spec-work` is cheaper and safer than adding a derived layer.
- `return-to-plan`: scope, acceptance, architecture, verification, or repo ownership is unresolved.
- `draft-only`: a non-executable outline may help discussion but cannot be handed to `spec-work`.
- `validate-only`: an existing task pack is checked before execution.

Use [Execution Handoff Contract](.Codex/spec-first/workflows/spec-write-tasks/references/execution-handoff-contract.md) for branch outputs, final envelope fields, high-risk review handoff, hash rules, and failure reason codes.

## Task Pack Output

When compiling, read [Task Pack Schema](.Codex/spec-first/workflows/spec-write-tasks/references/task-pack-schema.md) and write the task pack body with:

- Overview
- Source Summary
- Traceability Matrix
- Task Graph
- Execution Waves
- Task Pack Contract
- Task Cards
- Orientation Evidence
- Validation Notes
- Regeneration Rules

The `Task Pack Contract` fenced JSON block is the machine-readable source for validators. Human-readable sections compress context for executors and reviewers, but deterministic validation proves only identity, freshness, and structure.

## Final Decision Envelope

Every run must end with the compact envelope from [Execution Handoff Contract](.Codex/spec-first/workflows/spec-write-tasks/references/execution-handoff-contract.md).

Required posture:

- include `decision`, `reason_code`, `source_plan`, `task_pack`, `task_pack_validity`, `deterministic_handoff`, `validity_scope`, `semantic_posture`, `dispatch_authorization`, `validation`, `orientation`, and `next_action`;
- 🔴 GATE (verification): run `spec-first tasks validate <task-pack-path> --json` before reporting `deterministic_handoff` or validation fields;
- run `spec-first tasks hash <plan-path>` when computing or comparing `source_plan_hash`;
- 🔴 GATE (verification): never self-report `deterministic_handoff: true` without CLI JSON evidence;
- 🔴 GATE (handoff): allow `next_action: spec-work-task-pack` only for valid deterministic handoff plus semantic posture `generated-this-run` or `reviewed-existing`;
- 🔴 GATE (verification): for `semantic_posture: reviewed-existing`, the envelope must carry evidence metadata or a verifiable review-outcome reference; a bare `reviewed-existing` claim without current evidence is not eligible for `next_action: spec-work-task-pack`;
- 🔴 GATE (handoff): for `dispatch_authorization: authorized`, the envelope must carry a bounded continuation reference or doc-review outcome reference; absent that, report `dispatch_authorization: missing`.

High-risk packs return `next_action: review-task-pack` with one reason and a copy-ready current-host doc-review invocation. Do not auto-dispatch review unless the explicit bounded continuation conditions in [Execution Handoff Contract](.Codex/spec-first/workflows/spec-write-tasks/references/execution-handoff-contract.md) are met.

## Portability Boundary

Runtime references must be packaged skill files (`references/`, `agents/`) or optional named integration points distributed with spec-first. `spec-plan`, `spec-work`, and `spec-doc-review` are integration names, not required files to read from this package.

`evals/` files are maintainer-only validation fixtures; the official `.skill` packager excludes root `evals/`, so runtime users must not need them. Repo-local scripts, validation reports, technical plans, project-role documents, historical snapshots, and `.spec-first/audits/**` are maintainer evidence, not user-runtime dependencies.

## Do Not

- Do not execute implementation work.
- Do not generate task packs for small low-risk plans by default.
- Do not invent missing scope, acceptance criteria, repo targets, or product decisions.
- Do not turn `review_gate` into approval state or validator-owned semantic risk.
- Do not make task quality analyzer warnings a hard validator gate.
- Do not list repo-local validation reports or historical plans as runtime references.

## References

- [Execution Handoff Contract](.Codex/spec-first/workflows/spec-write-tasks/references/execution-handoff-contract.md)
- [Task Pack Schema](.Codex/spec-first/workflows/spec-write-tasks/references/task-pack-schema.md)
- [Task Quality Guide](.Codex/spec-first/workflows/spec-write-tasks/references/task-quality-guide.md)
