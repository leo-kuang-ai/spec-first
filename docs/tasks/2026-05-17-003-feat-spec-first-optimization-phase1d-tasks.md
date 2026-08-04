---
title: "feat: spec-first optimization Phase 1D task pack"
type: task-pack
status: derived
date: 2026-05-17
spec_id: 2026-05-11-002-spec-first-project-optimization-upgrade
source_plan: docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md
source_plan_hash: sha256:5f7f1cffbb1622cb01a1175658a55e9cdf50fbc4fe35312fc09bbe8230598d02
generated_by: spec-write-tasks
mode: derived
source_sections:
  - "U1. Public workflow contract summary 覆盖"
  - "U12. Token economy guardrails 与 progressive disclosure"
  - "Phase 1 放行门槛"
  - "U11. Cross-cutting closeout checklist"
---

# feat: spec-first optimization Phase 1D task pack

## Overview

This task pack is the executable Phase 1D handoff for the source plan. It covers only the Phase 1D core workflow intake cleanup:

- U1-core contract summary coverage for the core execution chain.
- U12-minimal context intake order for core workflows.
- U11 closeout checklist.

It does not implement full public workflow summary coverage, review dispatch resizing, sessions/compound replay, skill-review progressive-disclosure scoring, release blocking guards, or Phase 2/3 lifecycle work.

## Source Summary

- Source plan: `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md`
- Consumed source sections: U1, U12, Phase 1D release gate, U11 closeout checklist.
- Scope boundaries: Phase 1D touches only the core chain: `using-spec-first`, `spec-plan`, `spec-write-tasks`, `spec-work`, `spec-standards`, plus tests needed to prevent regression.
- Implementation-time unknowns: some contract summaries may already exist from earlier work; if so, keep edits minimal and focus on missing intake-order/facts-substrate/review-pre-facts reuse guarantees.

## Traceability Matrix

| Source | Requirement / Acceptance | Task(s) | Validation |
| --- | --- | --- | --- |
| U1-core | R1, R2, R17; core chain has lightweight contract summaries | T001 | public workflow summary and entrypoint lint tests |
| U12-minimal | R18, R19, R20, R21, R23, R25; intake order is summary -> deterministic facts -> task refs -> focused source sections -> deeper refs | T002 | plan/work/write-tasks/standards contract tests |
| Phase 1D gate | summary and intake-order tests pass; no open P1 review findings | T001, T002, T003 | targeted tests, fresh-source eval |
| U11 | R17, R26; closeout evidence | T003 | changelog, validation artifact, runtime impact note |

## Task Graph

- T001 and T002 are serial because U12 wording should build on the final core summary layout.
- T003 runs after T001/T002 verification.

## Execution Waves

- Wave 1: T001
- Wave 2: T002
- Wave 3: T003

## Task Pack Contract

```json
{
  "schema_version": "task-pack/v1",
  "execution_waves": [
    {
      "wave": 1,
      "tasks": ["T001"]
    },
    {
      "wave": 2,
      "tasks": ["T002"]
    },
    {
      "wave": 3,
      "tasks": ["T003"]
    }
  ],
  "tasks": [
    {
      "task_id": "T001",
      "source_unit": "U1-core",
      "requirement_refs": ["R1", "R2", "R17"],
      "goal": "Ensure the core execution chain has lightweight workflow contract summaries without duplicating full runtime behavior.",
      "dependencies": [],
      "files": [
        "skills/using-spec-first/SKILL.md",
        "skills/spec-plan/SKILL.md",
        "skills/spec-write-tasks/SKILL.md",
        "skills/spec-work/SKILL.md",
        "skills/spec-standards/SKILL.md",
        "tests/unit/public-workflow-contract-summary.test.js",
        "tests/unit/lint-skill-entrypoints.test.js",
        "CHANGELOG.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U1. Public workflow contract summary 覆盖",
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#Phase 1 MVP 范围",
        "src/cli/contracts/dual-host-governance/skills-governance.json",
        "tests/unit/public-workflow-contract-summary.test.js",
        "tests/unit/lint-skill-entrypoints.test.js"
      ],
      "entry_hint": "First inspect whether the five core skills already have contract summaries; add only missing summary fields or boundary language.",
      "parallelizable": false,
      "test_focus": "Core summaries cover when to use, when not to use, inputs, outputs, artifacts, failure modes, workflow, downstream consumers, and do not turn generated runtime mirrors into source.",
      "done_signal": "Core chain summary tests and entrypoint lint pass without expanding to all public workflows.",
      "wave": 1,
      "review_gate": "optional",
      "review_focus": "Check summary remains light and does not become a second runtime spec.",
      "risk_note": "The main risk is adding verbose duplicated workflow prose instead of a compact summary.",
      "stop_if": "Full public workflow summary coverage, generated runtime mirror edits, or broad review workflow rewrites become necessary."
    },
    {
      "task_id": "T002",
      "source_unit": "U12-minimal",
      "requirement_refs": ["R18", "R19", "R20", "R21", "R23", "R25"],
      "goal": "Add minimal context intake order and deterministic facts substrate reuse guidance for the core chain.",
      "dependencies": ["T001"],
      "files": [
        "skills/spec-plan/SKILL.md",
        "skills/spec-write-tasks/SKILL.md",
        "skills/spec-work/SKILL.md",
        "skills/spec-standards/SKILL.md",
        "tests/unit/spec-plan-contracts.test.js",
        "tests/unit/spec-work-contracts.test.js",
        "tests/unit/spec-write-tasks-contracts.test.js",
        "tests/unit/spec-standards-contracts.test.js",
        "CHANGELOG.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U12. Token economy guardrails 与 progressive disclosure",
        "docs/contracts/workflows/review-pre-facts-extraction.md",
        "src/cli/helpers/review-pre-facts.js",
        "skills/spec-plan/SKILL.md#Context Orientation",
        "skills/spec-work/SKILL.md#Context Orientation Anchor",
        "skills/spec-write-tasks/SKILL.md",
        "skills/spec-standards/SKILL.md"
      ],
      "entry_hint": "Add intake order prose near existing context-orientation sections and point to existing review-pre-facts trust model instead of creating a new facts pipeline.",
      "parallelizable": false,
      "test_focus": "Workflow prose requires summary/inventory first, task/phase refs second, focused source sections third, deeper refs on demand; tests reject whole-plan/full-directory context_refs posture.",
      "done_signal": "Targeted core contract tests pass and no new parallel reviewer facts pipeline exists.",
      "wave": 2,
      "review_gate": "required",
      "review_focus": "Check Phase 1D did not expand into doc-review/code-review dispatch, sessions/compound replay, skill-review scoring, or hard token budget automation.",
      "risk_note": "The main risk is turning token economy into a rigid budget engine or a second deterministic reviewer facts pipeline.",
      "stop_if": "Review dispatch resizing, sessions/compound replay, skill-review progressive-disclosure checks, hard token budgets, or a new facts pipeline become necessary."
    },
    {
      "task_id": "T003",
      "source_unit": "U11",
      "requirement_refs": ["R17", "R26"],
      "goal": "Close Phase 1D with changelog, validation evidence, runtime impact note, and fresh-source eval result.",
      "dependencies": ["T001", "T002"],
      "files": [
        "CHANGELOG.md",
        "docs/validation/2026-05-17-phase1d-core-intake-validation.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U11. Cross-cutting closeout checklist",
        "docs/contracts/workflows/fresh-source-eval-checklist.md",
        "tests/unit/changelog-format.test.js"
      ],
      "entry_hint": "Record exact commands, fresh-source eval findings/fixes, and generated runtime impact.",
      "parallelizable": false,
      "test_focus": "Changelog format, diff whitespace, targeted tests, and fresh-source eval/no-finding closeout.",
      "done_signal": "Validation artifact exists and Phase 1D gate is ready for Phase 2 handoff.",
      "wave": 3,
      "review_gate": "required",
      "review_focus": "Check no P1 finding remains before Phase 2 starts.",
      "risk_note": "The main risk is entering Phase 2 with unresolved prose or intake-order drift.",
      "stop_if": "Fresh-source eval reports unresolved P1 findings or generated runtime mirrors require manual editing."
    }
  ]
}
```

## Task Cards

### T001

- source_unit: U1-core
- requirement_refs: R1, R2, R17
- goal: Ensure core execution chain contract summaries are present and lightweight.
- dependencies: none
- files:
  - `skills/using-spec-first/SKILL.md`
  - `skills/spec-plan/SKILL.md`
  - `skills/spec-write-tasks/SKILL.md`
  - `skills/spec-work/SKILL.md`
  - `skills/spec-standards/SKILL.md`
  - `tests/unit/public-workflow-contract-summary.test.js`
  - `tests/unit/lint-skill-entrypoints.test.js`
  - `CHANGELOG.md`
- context_refs:
  - `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U1. Public workflow contract summary 覆盖`
  - `src/cli/contracts/dual-host-governance/skills-governance.json`
  - `tests/unit/public-workflow-contract-summary.test.js`
- entry_hint: Add compact summaries only where missing.
- test_focus: core summary coverage and source/runtime boundary.
- done_signal: public summary and entrypoint lint tests pass.
- parallelizable: false
- review_gate: optional
- review_focus: summary lightness and no second runtime spec.
- stop_if: full public workflow coverage becomes necessary.
- wave: 1

### T002

- source_unit: U12-minimal
- requirement_refs: R18, R19, R20, R21, R23, R25
- goal: Add minimal intake order and deterministic facts substrate reuse guidance.
- dependencies: T001
- files:
  - `skills/spec-plan/SKILL.md`
  - `skills/spec-write-tasks/SKILL.md`
  - `skills/spec-work/SKILL.md`
  - `skills/spec-standards/SKILL.md`
  - `tests/unit/spec-plan-contracts.test.js`
  - `tests/unit/spec-work-contracts.test.js`
  - `tests/unit/spec-write-tasks-contracts.test.js`
  - `tests/unit/spec-standards-contracts.test.js`
  - `CHANGELOG.md`
- context_refs:
  - `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U12. Token economy guardrails 与 progressive disclosure`
  - `docs/contracts/workflows/review-pre-facts-extraction.md`
  - `src/cli/helpers/review-pre-facts.js`
  - `skills/spec-plan/SKILL.md`
  - `skills/spec-work/SKILL.md`
- entry_hint: Prefer short ordering bullets near existing context-orientation prose.
- test_focus: summary/inventory/task refs/focused source/deeper refs order and no new facts pipeline.
- done_signal: targeted core contract tests pass.
- parallelizable: false
- review_gate: required
- review_focus: no review dispatch/session/compound/skill-review scope creep.
- stop_if: hard token budgets or new reviewer facts pipeline becomes necessary.
- wave: 2

### T003

- source_unit: U11
- requirement_refs: R17, R26
- goal: Close Phase 1D with evidence.
- dependencies: T001, T002
- files:
  - `CHANGELOG.md`
  - `docs/validation/2026-05-17-phase1d-core-intake-validation.md`
- context_refs:
  - `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U11. Cross-cutting closeout checklist`
  - `docs/contracts/workflows/fresh-source-eval-checklist.md`
- entry_hint: Record exact validation and fresh-source eval outcome.
- test_focus: changelog format and closeout artifact.
- done_signal: Phase 1D gate has no unresolved P1 finding.
- parallelizable: false
- review_gate: required
- review_focus: no P1 finding before Phase 2.
- stop_if: fresh-source eval reports unresolved P1.
- wave: 3

## Orientation Evidence

- provider: direct-repo-reads
- posture: bounded
- evidence_refs:
  - `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md`
  - `src/cli/contracts/dual-host-governance/skills-governance.json`
  - `docs/contracts/workflows/review-pre-facts-extraction.md`
  - `src/cli/helpers/review-pre-facts.js`
  - core workflow `SKILL.md` files listed above
- limitations:
  - This task pack does not use graph-backed impact evidence because the current dirty branch makes compiled graph facts stale.
  - Deterministic task-pack validation checks identity, freshness, and structure only; semantic scope remains governed by the source plan.

## Validation Notes

- Source plan hash was reused from the validated Phase 1A/1B/1C task packs.
- This task pack must pass `spec-first tasks validate docs/tasks/2026-05-17-003-feat-spec-first-optimization-phase1d-tasks.md --json`.
- Phase 1D closeout must record fresh-source eval because it changes workflow prose.

## Regeneration Rules

- Regenerate from the source plan if `source_plan_hash` changes.
- Regenerate if Phase 1D scope changes beyond U1-core, U12-minimal, or U11.
- Do not hand-edit this pack to include Phase 2 or Phase 3 work.
