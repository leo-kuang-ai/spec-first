---
title: "refactor: harden spec skill stability gates — task pack"
type: "task-pack"
status: "derived"
date: "2026-06-28"
spec_id: "2026-06-28-002-spec-skill-robustness-stability-optimization"
source_plan: "docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md"
source_plan_hash: "sha256:cb13edef4d74485957f1e9836e89412b6f2111df89750bb909fc2f1e3b254ed8"
generated_by: "spec-write-tasks"
mode: "derived"
source_sections:
  - "Requirements"
  - "Scope Boundaries"
  - "Implementation Units"
  - "Completion Criteria"
---

# Task Pack: refactor — harden spec skill stability gates

## Overview

Five tasks across two execution waves implement Slice A' P0: scanner false-positive hardening (T001), spec-plan origin grade metadata (T002), task-pack envelope evidence CLI/schema (T003), spec-work/spec-write-tasks handoff recheck (T004, depends T003), and spec-doc-review learning-capture (T005).

T003, T004, T005 carry `review_gate: required` due to shared contract surfaces, public workflow prose changes, and (T005) a mandatory fresh-source eval requirement.

---

## Source Summary

- **Source plan:** `docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md`
- **Branch:** `compile` — Deep plan with dependency chain (U4→U3), multi-module surfaces, shared contract changes; task pack reduces single-run context load and isolates rollback.
- **Consumed sections:** Requirements (R1-R4), Scope Boundaries, Implementation Units (U1-U5), Completion Criteria.
- **Scope boundaries that shaped splitting:** Slice A' only (R-01/R-04); P1/P2 requirements and Slices B-E are explicitly deferred and must not be implemented here.
- **Implementation-time unknowns:** Exact evidence metadata field names for T003/T004 (Assumption A2 in plan); exact scanner boundary phrase list for T001; exact fresh-source eval prompt for T005.

---

## Traceability Matrix

| Source Unit | Requirement | Task(s) | Validation |
|---|---|---|---|
| U1 | R1 (scanner false positives) | T001 | Scanner fixtures: false-positive suppressed, true-positive preserved |
| U2 | R2 (origin_grade metadata) | T002 | Plan-contracts test: origin_grade field present; eval fixtures normalize |
| U3 | R3 (evidence CLI/schema) | T003 | task-pack-command unit tests: reason_code mapping, evidence field shape |
| U4 | R3 (consumer recheck) | T004 | spec-work-contracts + spec-write-tasks-contracts: evidence recheck required |
| U5 | R4 (doc-review learning) | T005 | spec-doc-review-contracts: advisory/non-gating frozen; fresh-source eval |

---

## Task Graph

```
T001 ──────────────────┐
T002 ──────────────────┤
T003 ──── T004         ├──► (all converge at final verification: npm test)
T005 ──────────────────┘
```

T001, T002, T003, T005 are independent (Wave 1). T004 requires T003 complete (Wave 2).

---

## Execution Waves

| Wave | Tasks | Constraint |
|---|---|---|
| 1 | T001, T002, T003, T005 | No shared files; can run in parallel |
| 2 | T004 | Requires T003 complete: evidence metadata field names must be settled |

---

## Task Pack Contract

```json
{
  "schema_version": "task-pack/v1",
  "execution_waves": [
    {
      "wave": 1,
      "tasks": ["T001", "T002", "T003", "T005"]
    },
    {
      "wave": 2,
      "tasks": ["T004"]
    }
  ],
  "tasks": [
    {
      "task_id": "T001",
      "source_unit": "U1",
      "requirement_refs": ["R1"],
      "goal": "Add boundary-context classification to PROHIBITION_HINTS so generated-runtime guardrail lines no longer produce P0 findings; preserve true-positive severity for direct runtime edit instructions.",
      "dependencies": [],
      "files": [
        "skills/retired-skill-review/scripts/lib/security-patterns.js",
        "tests/unit/skill-review-scripts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md#U1",
        "skills/retired-skill-review/scripts/scan-instruction-security.js"
      ],
      "entry_hint": "Read the classifyPatternContext function and existing negative-boundary fixtures first.",
      "test_focus": "Fixture: known guardrail lines produce no P0; direct runtime-edit instructions remain P0; remote script pipe patterns unchanged.",
      "done_signal": "npm run test:unit passes; manually confirm known false-positive lines (spec-compound:85, spec-mcp-setup:34, provider-tools.json:56) are no longer P0 in a full scanner run.",
      "risk_note": "Over-suppression: boundary phrases must require generated-runtime context, not standalone downgrade.",
      "review_gate": "optional",
      "stop_if": "Extending PROHIBITION_HINTS would require changing the three-tier severity classification structure or introducing a new context category not described in the plan.",
      "wave": 1
    },
    {
      "task_id": "T002",
      "source_unit": "U2",
      "requirement_refs": ["R2"],
      "goal": "Update spec-plan Phase 0.2 candidate discovery to rank and label PRD-grade vs brainstorm-grade origins; add origin_grade to plan frontmatter template; add eval coverage for both grades.",
      "dependencies": [],
      "files": [
        "skills/spec-plan/references/planning-flow.md",
        "skills/spec-plan/references/plan-template.md",
        "skills/spec-plan/evals/examples.json",
        "skills/spec-plan/evals/output-quality-cases.json",
        "tests/unit/spec-plan-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md#U2",
        "skills/spec-plan/references/planning-flow.md#Phase-0.2"
      ],
      "entry_hint": "Read planning-flow.md Phase 0.2 and plan-template.md frontmatter block first.",
      "test_focus": "Contract test: plan with PRD-grade origin carries origin_grade: prd; brainstorm-grade carries origin_grade: brainstorm and is not rejected. Eval fixtures normalize under existing eval tests.",
      "done_signal": "npm run test:unit passes; spec-plan-contracts test verifies origin_grade field is present and takes expected values.",
      "risk_note": "origin_grade must be visible but non-blocking; brainstorm-grade direct entry must remain valid.",
      "review_gate": "optional",
      "review_focus": "Confirm origin_grade is non-blocking and does not introduce a new gate for brainstorm-grade plans.",
      "stop_if": "Implementing origin_grade would require rejecting brainstorm-grade plans or changing the spec_id inheritance contract.",
      "wave": 1
    },
    {
      "task_id": "T003",
      "source_unit": "U3",
      "requirement_refs": ["R3"],
      "goal": "Add deterministic reason-code projection and evidence metadata fields to task-pack.js; update schema docs and fixture to carry posture/authorization evidence. CLI shape-checks evidence presence/absence without judging semantic adequacy.",
      "dependencies": [],
      "files": [
        "src/cli/task-pack.js",
        "src/cli/commands/tasks.js",
        "skills/spec-write-tasks/references/task-pack-schema.md",
        "skills/spec-write-tasks/references/execution-handoff-contract.md",
        "tests/unit/task-pack-command.test.js",
        "tests/fixtures/spec-write-tasks/valid/task-pack.md",
        "tests/fixtures/spec-write-tasks/high-risk-review/task-pack.md"
      ],
      "context_refs": [
        "docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md#U3",
        "skills/spec-write-tasks/references/execution-handoff-contract.md",
        "skills/spec-write-tasks/references/task-pack-schema.md"
      ],
      "entry_hint": "Start with a contract test demonstrating that reviewed-existing without evidence metadata is not treated as executable evidence. Then read deriveValidity in task-pack.js.",
      "test_focus": "Unit tests: reason_code mapping for valid/stale/wrong-chain cases; evidence metadata field shape; reviewed-existing without evidence is not executable; ALLOWED_TASK_FIELDS whitelist stays in sync with schema table.",
      "done_signal": "npm run test:unit passes; task-pack-command tests cover reason_code output, evidence field presence/absence, and parity between ALLOWED_TASK_FIELDS and schema.",
      "risk_note": "ALLOWED_TASK_FIELDS whitelist, fixture, and schema table must expand in the same commit. Finalize evidence metadata field names before T004 starts.",
      "review_gate": "required",
      "review_focus": "Confirm CLI scope: validator checks evidence shape/presence only; no semantic adequacy judgment moved into scripts.",
      "stop_if": "Implementing evidence metadata would require a new semantic_posture enum value (e.g., reviewed-existing-with-evidence) without a migration plan, or would make the validator judge semantic review quality.",
      "wave": 1
    },
    {
      "task_id": "T004",
      "source_unit": "U4",
      "requirement_refs": ["R3"],
      "goal": "Update spec-work intake and spec-write-tasks final envelope prose to require evidence presence, source, freshness, and legal enum values before trusting reviewed-existing or authorized posture.",
      "dependencies": ["T003"],
      "files": [
        "skills/spec-work/SKILL.md",
        "skills/spec-write-tasks/SKILL.md",
        "skills/spec-write-tasks/references/execution-handoff-contract.md",
        "skills/spec-write-tasks/evals/boundary-cases.json",
        "skills/spec-write-tasks/evals/expected-behavior-cases.json",
        "tests/unit/spec-work-contracts.test.js",
        "tests/unit/spec-write-tasks-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md#U4",
        "skills/spec-work/SKILL.md",
        "skills/spec-write-tasks/references/execution-handoff-contract.md"
      ],
      "entry_hint": "Read spec-work SKILL.md task-pack intake section and the handoff contract. Use evidence metadata field names finalized in T003.",
      "test_focus": "Contract tests: spec-work rejects reviewed-existing without evidence; dispatch_authorization: authorized without bounded evidence reference is downgraded to missing; high-risk eval still recommends review before chaining.",
      "done_signal": "npm run test:unit passes; spec-work-contracts and spec-write-tasks-contracts tests cover evidence recheck path; eval boundary-cases confirm high-risk handoff behavior unchanged.",
      "risk_note": "Prose changes may not reflect until fresh-source eval confirms. Do not make CLI judge semantic sufficiency; LLM/human review owns that judgment.",
      "review_gate": "required",
      "review_focus": "Confirm spec-work prose changes do not expand CLI semantic ownership; evidence recheck is presence/freshness/enum check only.",
      "stop_if": "Updating spec-work intake would require changing what semantic_posture enum values are legal without a migration plan, or would make scripts decide semantic review sufficiency.",
      "wave": 2
    },
    {
      "task_id": "T005",
      "source_unit": "U5",
      "requirement_refs": ["R4"],
      "goal": "Add learning-capture recommendation step to spec-doc-review: three-tier advisory pattern (skip mechanical, offer neutral, lean repeated/shared-boundary), headless advisory line with candidate + evidence path + suggested action + user-choice recording. Do not auto-run spec-compound or write docs/solutions/.",
      "dependencies": [],
      "files": [
        "skills/spec-doc-review/SKILL.md",
        "skills/spec-doc-review/evals/examples.json",
        "tests/unit/spec-doc-review-contracts.test.js"
      ],
      "context_refs": [
        "docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md#U5",
        "skills/spec-code-review/SKILL.md",
        "tests/unit/spec-code-review-contracts.test.js"
      ],
      "entry_hint": "Read spec-code-review SKILL.md Stage 6 learning-capture section and spec-code-review-contracts.test.js advisory assertions first.",
      "test_focus": "Contract tests: learning-capture is advisory and non-gating; headless path emits one advisory line when learning-worthy evidence exists; no auto-compound; no auto-write to docs/solutions/. Eval fixture: trigger case + no-auto-compound boundary.",
      "done_signal": "npm run test:unit passes; spec-doc-review-contracts tests freeze advisory/non-gating behavior; fresh-source eval (required) confirms updated skill prose directs reviewers to recommend capture within documented boundary.",
      "risk_note": "Public workflow prose change — fresh-source eval is required before marking complete. Adapt from code-review by intent, not by wording; doc-review lessons are document/contract/architecture, not code findings.",
      "review_gate": "required",
      "review_focus": "Confirm learning-capture is advisory, non-gating, and does not auto-invoke spec-compound in any path including headless and safe_auto.",
      "stop_if": "Adding learning-capture would make it a review verdict input, auto-run spec-compound, or auto-write docs/solutions/ in any path.",
      "wave": 1
    }
  ]
}
```

---

## Task Cards

### T001 — Scanner false-positive hardening (Wave 1)

- **source_unit:** U1
- **requirement_refs:** R1
- **goal:** Add boundary-context classification to PROHIBITION_HINTS so generated-runtime guardrail lines no longer produce P0 findings; preserve true-positive severity for direct runtime edit instructions.
- **dependencies:** []
- **files:**
  - `skills/retired-skill-review/scripts/lib/security-patterns.js`
  - `tests/unit/skill-review-scripts.test.js`
- **context_refs:**
  - `docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md#U1`
  - `skills/retired-skill-review/scripts/scan-instruction-security.js`
- **entry_hint:** Read `classifyPatternContext` and existing negative-boundary fixtures first.
- **test_focus:** Fixture: known guardrail lines produce no P0; direct runtime-edit instructions remain P0; remote script pipe patterns unchanged.
- **done_signal:** `npm run test:unit` passes; known false-positive lines no longer P0 in full scanner run.
- **risk_note:** Over-suppression — boundary phrases must require generated-runtime context, not standalone downgrade.
- **review_gate:** optional
- **stop_if:** Extension would require changing the three-tier severity classification or introducing a new context category not in the plan.
- **wave:** 1

---

### T002 — Spec-plan origin grade metadata (Wave 1)

- **source_unit:** U2
- **requirement_refs:** R2
- **goal:** Update Phase 0.2 candidate discovery to rank/label PRD-grade vs brainstorm-grade origins; add `origin_grade` to plan frontmatter template; add eval coverage for both grades.
- **dependencies:** []
- **files:**
  - `skills/spec-plan/references/planning-flow.md`
  - `skills/spec-plan/references/plan-template.md`
  - `skills/spec-plan/evals/examples.json`
  - `skills/spec-plan/evals/output-quality-cases.json`
  - `tests/unit/spec-plan-contracts.test.js`
- **context_refs:**
  - `docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md#U2`
  - `skills/spec-plan/references/planning-flow.md#Phase-0.2`
- **entry_hint:** Read planning-flow.md Phase 0.2 and plan-template.md frontmatter block first.
- **test_focus:** Plan-contracts test: PRD-grade origin → `origin_grade: prd`; brainstorm-grade → `origin_grade: brainstorm`, not rejected.
- **done_signal:** `npm run test:unit` passes; spec-plan-contracts verifies `origin_grade` field.
- **risk_note:** `origin_grade` must be visible but non-blocking; brainstorm-grade direct entry must remain valid.
- **review_gate:** optional
- **review_focus:** Confirm `origin_grade` is non-blocking.
- **stop_if:** Would reject brainstorm-grade plans or change `spec_id` inheritance contract.
- **wave:** 1

---

### T003 — Task-pack envelope evidence CLI/schema (Wave 1)

- **source_unit:** U3
- **requirement_refs:** R3
- **goal:** Add deterministic reason-code projection and evidence metadata fields to `task-pack.js`; update schema docs and fixtures. CLI shape-checks evidence presence/absence; no semantic adequacy judgment.
- **dependencies:** []
- **files:**
  - `src/cli/task-pack.js`
  - `src/cli/commands/tasks.js`
  - `skills/spec-write-tasks/references/task-pack-schema.md`
  - `skills/spec-write-tasks/references/execution-handoff-contract.md`
  - `tests/unit/task-pack-command.test.js`
  - `tests/fixtures/spec-write-tasks/valid/task-pack.md`
  - `tests/fixtures/spec-write-tasks/high-risk-review/task-pack.md`
- **context_refs:**
  - `docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md#U3`
  - `skills/spec-write-tasks/references/execution-handoff-contract.md`
  - `skills/spec-write-tasks/references/task-pack-schema.md`
- **entry_hint:** Start with a contract test: `reviewed-existing` without evidence metadata is not executable. Then read `deriveValidity` in `task-pack.js`.
- **test_focus:** Reason-code mapping; evidence field shape; `reviewed-existing` without evidence not executable; ALLOWED_TASK_FIELDS/schema table parity.
- **done_signal:** `npm run test:unit` passes; task-pack-command tests cover reason_code, evidence field, and parity invariant.
- **risk_note:** ALLOWED_TASK_FIELDS, fixture, and schema table must expand in same commit. Settle evidence field names before T004.
- **review_gate:** required
- **review_focus:** CLI scope: validator checks evidence shape/presence only; no semantic adequacy judgment in scripts.
- **stop_if:** Would require a new `semantic_posture` enum value without migration plan, or make the validator judge semantic review quality.
- **wave:** 1

---

### T004 — Spec-work/spec-write-tasks handoff recheck (Wave 2)

- **source_unit:** U4
- **requirement_refs:** R3
- **goal:** Update spec-work intake and spec-write-tasks envelope prose to require evidence presence, source, freshness, and legal enum values before trusting `reviewed-existing` or `authorized` posture.
- **dependencies:** ["T003"]
- **files:**
  - `skills/spec-work/SKILL.md`
  - `skills/spec-write-tasks/SKILL.md`
  - `skills/spec-write-tasks/references/execution-handoff-contract.md`
  - `skills/spec-write-tasks/evals/boundary-cases.json`
  - `skills/spec-write-tasks/evals/expected-behavior-cases.json`
  - `tests/unit/spec-work-contracts.test.js`
  - `tests/unit/spec-write-tasks-contracts.test.js`
- **context_refs:**
  - `docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md#U4`
  - `skills/spec-work/SKILL.md`
  - `skills/spec-write-tasks/references/execution-handoff-contract.md`
- **entry_hint:** Read spec-work SKILL.md task-pack intake section and the handoff contract. Use field names from T003.
- **test_focus:** spec-work rejects `reviewed-existing` without evidence; `dispatch_authorization: authorized` without bounded evidence reference → missing; high-risk eval recommends review before chaining.
- **done_signal:** `npm run test:unit` passes; spec-work-contracts and spec-write-tasks-contracts cover evidence recheck path; eval boundary-cases confirm high-risk handoff behavior.
- **risk_note:** Prose changes require fresh-source eval to confirm. Do not make CLI judge semantic sufficiency.
- **review_gate:** required
- **review_focus:** Spec-work prose does not expand CLI semantic ownership; evidence recheck is presence/freshness/enum check only.
- **stop_if:** Would change legal `semantic_posture` enum values without migration, or make scripts decide semantic review sufficiency.
- **wave:** 2

---

### T005 — Spec-doc-review learning-capture (Wave 1)

- **source_unit:** U5
- **requirement_refs:** R4
- **goal:** Add three-tier advisory learning-capture step to spec-doc-review (skip mechanical, offer neutral, lean repeated/shared-boundary); headless path emits one advisory line with candidate, evidence path, suggested action, user-choice recording. No auto-compound, no auto-write.
- **dependencies:** []
- **files:**
  - `skills/spec-doc-review/SKILL.md`
  - `skills/spec-doc-review/evals/examples.json`
  - `tests/unit/spec-doc-review-contracts.test.js`
- **context_refs:**
  - `docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md#U5`
  - `skills/spec-code-review/SKILL.md`
  - `tests/unit/spec-code-review-contracts.test.js`
- **entry_hint:** Read spec-code-review SKILL.md Stage 6 learning-capture section and its contract test advisory assertions first.
- **test_focus:** Contract tests: advisory/non-gating frozen; headless emits ≤1 advisory line; no auto-compound; no auto-write to `docs/solutions/`. Eval: trigger case + no-auto-compound boundary.
- **done_signal:** `npm run test:unit` passes; spec-doc-review-contracts freeze advisory behavior; **fresh-source eval required** — confirms updated prose directs reviewers within documented boundary.
- **risk_note:** Public workflow prose — fresh-source eval is required before marking complete. Adapt from code-review by intent, not wording.
- **review_gate:** required
- **review_focus:** Learning-capture is advisory, non-gating, and does not auto-invoke spec-compound in any path (interactive, headless, safe_auto).
- **stop_if:** Adding learning-capture would make it a verdict input, auto-run spec-compound, or auto-write docs/solutions/ in any execution path.
- **wave:** 1

---

## Orientation Evidence

- **provider:** direct-repo-reads
- **posture:** bounded
- **evidence_refs:**
  - `docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md` (full read, source authority)
  - `skills/spec-write-tasks/references/task-pack-schema.md` (task field contract)
  - `skills/spec-write-tasks/references/execution-handoff-contract.md` (envelope/hash rules)
  - `src/cli/task-pack.js` (referenced by plan Direct Evidence — not re-read during task compilation; plan source reads are trusted)
- **limitations:** File paths for T003/T004/T005 contract tests (`spec-work-contracts.test.js`, `spec-write-tasks-contracts.test.js`, `spec-doc-review-contracts.test.js`) taken from plan Direct Evidence section; existence not independently verified during task pack compilation.

---

## Validation Notes

- **Source plan:** `docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md`
- **Hash verified by:** `spec-first tasks hash` CLI — result `sha256:cb13edef4d74485957f1e9836e89412b6f2111df89750bb909fc2f1e3b254ed8` recorded in frontmatter.
- **Reject when:** `source_plan_hash` mismatches (plan was edited after task pack generated); `spec_id` mismatches (wrong-chain handoff).
- **Key validations:** T001 scanner fixture run (npm run test:unit); T003 parity test (ALLOWED_TASK_FIELDS ↔ schema table); T005 fresh-source eval (required, not optional).

---

## Regeneration Rules

Rebuild this task pack when any of the following change:
- source plan body (hash will mismatch),
- Implementation Units U1-U5 scope or file list,
- evidence metadata field names settled during T003 (T004 context_refs must update),
- task pack contract semantics after manual editing.
