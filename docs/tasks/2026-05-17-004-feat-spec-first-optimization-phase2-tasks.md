---
title: "feat: spec-first optimization Phase 2 task pack"
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
  - "U4. `spec-standards` next-action candidates"
  - "U5. Source/runtime customization boundary 文档"
  - "U6. Agent role 与 dispatch boundary 收紧"
  - "U7. Domain language、ADR 与 decision ledger"
  - "U8. Feedback-loop-first debug 与 vertical slicing"
  - "U12. Token economy guardrails 与 progressive disclosure"
  - "U11. Cross-cutting closeout checklist"
  - "阶段 2：边界、角色与工程纪律"
---

# feat: spec-first optimization Phase 2 task pack

## Overview

This task pack is the executable Phase 2 handoff for the source plan. It covers the boundary, role, and engineering-discipline phase only:

- U1-full-batch-1 public workflow contract summaries for the eight Phase 2 workflow skills.
- U4 Phase 2 standards mode/freshness follow-up.
- U5 source/runtime/provider customization boundary documentation.
- U6 agent role and dispatch boundary tightening.
- U7 domain language, ADR-like guidance, and decision ledger consumption.
- U8 feedback-loop-first debug/work/task discipline and vertical slicing guidance.
- U12 progressive disclosure for review, sessions/compound, and skill-review follow-up surfaces.
- U11 closeout checklist.

It does not implement Phase 3 release/source-runtime continuity guards, U10 public surface inventory, U3b retention/prune lifecycle, U12 checkpoint replay, or U1-full-batch-2.

## Source Summary

- Source plan: `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md`
- Phase: Stage 2 / `边界、角色与工程纪律`
- Source-of-truth boundary: edit `skills/`, `agents/`, `docs/`, `README*`, `src/cli/`, and tests only. Do not hand-edit `.claude/`, `.codex/`, or `.agents/skills/`.
- Scope note: U1-full-batch-1 is limited to the eight workflows named by the plan. Later tasks may touch additional workflows because U6/U7/U8/U12 explicitly require them; those edits must stay within their source-plan anchors and must not pull in U1-full-batch-2.
- Graph note: compiled graph facts are stale for the dirty branch and are advisory only unless refreshed by the dedicated graph workflow.

## Traceability Matrix

| Source | Requirement / Acceptance | Task(s) | Validation |
| --- | --- | --- | --- |
| U1-full-batch-1 | R1, R2, R17; eight Phase 2 workflow skills have lightweight summaries | T001 | public workflow summary tests and entrypoint lint |
| U4 Phase 2 follow-up | R6, R12; mode/freshness behavior remains facts-only and fail-closed | T002 | standards validation/consumer/contract tests |
| U5 | R7, R9, R25; source/runtime/provider customization boundary is documented | T003 | README/manual/runtime boundary tests |
| U6 | R8, R9; dispatch is bounded, degraded/fallback aware, and worker suitability gated | T004 | agent support, dispatch, plan/doc/code-review contract tests, fresh-source eval |
| U7 | R12; domain language and major decisions consume existing context first | T005 | brainstorm/debug/work/plan/doc-review/code-review/standards contract tests |
| U8 | R10, R11; feedback loop and vertical slice discipline | T006 | debug/work/write-tasks/code-review contract tests |
| U12 progressive | R18-R25; scale-aware review and progressive disclosure for follow-up workflows | T007 | doc-review/code-review/sessions/compound/skill-review contract tests |
| U11 | R17, R26; changelog, validation artifact, runtime impact, fresh-source eval | T008 | changelog format, diff check, phase validation doc |

## Task Graph

- T001 should run first so later workflow prose can reuse the final summary layout.
- T002 and T003 are boundary/facts foundations and should run before role/process guidance.
- T004, T005, T006, and T007 are serial because they intentionally overlap review/debug/work workflow files.
- T008 closes the phase after verification and fresh-source eval.

## Execution Waves

- Wave 1: T001
- Wave 2: T002
- Wave 3: T003
- Wave 4: T004
- Wave 5: T005
- Wave 6: T006
- Wave 7: T007
- Wave 8: T008

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
    },
    {
      "wave": 4,
      "tasks": ["T004"]
    },
    {
      "wave": 5,
      "tasks": ["T005"]
    },
    {
      "wave": 6,
      "tasks": ["T006"]
    },
    {
      "wave": 7,
      "tasks": ["T007"]
    },
    {
      "wave": 8,
      "tasks": ["T008"]
    }
  ],
  "tasks": [
    {
      "task_id": "T001",
      "source_unit": "U1-full-batch-1",
      "requirement_refs": ["R1", "R2", "R17"],
      "goal": "Add lightweight workflow contract summaries to the eight Phase 2 public workflow skills without expanding into U1-full-batch-2.",
      "dependencies": [],
      "files": [
        "skills/spec-brainstorm/SKILL.md",
        "skills/spec-debug/SKILL.md",
        "skills/spec-doc-review/SKILL.md",
        "skills/spec-code-review/SKILL.md",
        "skills/spec-mcp-setup/SKILL.md",
        "skills/spec-graph-bootstrap/SKILL.md",
        "skills/spec-update/SKILL.md",
        "skills/spec-work-beta/SKILL.md",
        "tests/unit/public-workflow-contract-summary.test.js",
        "tests/unit/lint-skill-entrypoints.test.js",
        "CHANGELOG.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U1. Public workflow contract summary 覆盖",
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#阶段 2：边界、角色与工程纪律",
        "src/cli/contracts/dual-host-governance/skills-governance.json",
        "tests/unit/public-workflow-contract-summary.test.js"
      ],
      "entry_hint": "Mirror the Phase 1D summary shape and keep each summary compact.",
      "parallelizable": false,
      "test_focus": "Eight named Phase 2 workflow skills expose summary fields while U1-full-batch-2 remains untouched.",
      "done_signal": "Public workflow summary test covers core plus Phase 2 batch-1 skills and entrypoint lint still passes.",
      "wave": 1,
      "review_gate": "optional",
      "review_focus": "Check summary prose stays light and does not duplicate deep workflow behavior.",
      "risk_note": "The main risk is broadening U1 into all public workflows instead of the named batch.",
      "stop_if": "U1-full-batch-2 or generated runtime mirror edits become necessary."
    },
    {
      "task_id": "T002",
      "source_unit": "U4-phase2-mode-follow-up",
      "requirement_refs": ["R6", "R12"],
      "goal": "Finish or verify the Phase 2 standards mode/freshness follow-up while preserving facts-only next-action candidates.",
      "dependencies": ["T001"],
      "files": [
        "skills/spec-standards/SKILL.md",
        "skills/spec-standards/README.md",
        "skills/spec-standards/scripts/prepare-baseline.js",
        "skills/spec-standards/scripts/validate-artifacts.js",
        "skills/spec-standards/examples/next-action-candidates.example.json",
        "tests/unit/spec-standards-contracts.test.js",
        "tests/unit/spec-standards-validation.test.js",
        "tests/unit/spec-standards-consumers.test.js",
        "CHANGELOG.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U4. `spec-standards` next-action candidates",
        "skills/spec-standards/SKILL.md#Supported Modes",
        "skills/spec-standards/scripts/prepare-baseline.js",
        "skills/spec-standards/scripts/validate-artifacts.js",
        "tests/unit/spec-standards-contracts.test.js"
      ],
      "entry_hint": "Verify existing quick/refresh/workspace behavior first; add only missing migration/fail-closed/facts-only guidance.",
      "parallelizable": false,
      "test_focus": "Unknown schema fails closed, mode/freshness decisions stay separate from next-action candidates, and scripts do not emit ranking/blocking/final recommendations.",
      "done_signal": "Standards contract/validation/consumer tests cover Phase 2 mode and freshness boundaries.",
      "wave": 2,
      "review_gate": "required",
      "review_focus": "Check no complex router, single recommendation, or blocking policy is introduced into next-action candidates.",
      "risk_note": "The main risk is reintroducing script-owned semantic workflow routing.",
      "stop_if": "A real mode matrix or blocking policy requires source-plan changes."
    },
    {
      "task_id": "T003",
      "source_unit": "U5",
      "requirement_refs": ["R7", "R9", "R25"],
      "goal": "Document the source/runtime/provider customization boundary and link it from user-visible docs.",
      "dependencies": ["T002"],
      "files": [
        "docs/contracts/source-runtime-customization-boundary.md",
        "README.md",
        "README.zh-CN.md",
        "docs/catalog/runtime-capabilities.md",
        "tests/unit/readme-language-split.test.js",
        "tests/unit/user-manual-contracts.test.js",
        "tests/unit/runtime-contract-boundary.test.js",
        "CHANGELOG.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U5. Source/runtime customization boundary 文档",
        "docs/contracts/context-governance.md",
        "docs/contracts/workflows/review-pre-facts-extraction.md",
        "docs/catalog/runtime-capabilities.md",
        "tests/unit/runtime-contract-boundary.test.js"
      ],
      "entry_hint": "Add one focused contract doc; keep README links short and bilingual.",
      "parallelizable": false,
      "test_focus": "Docs reject generated mirrors as source, classify provider facts as evidence inputs, and forbid credentials/raw output in source/runtime/artifacts/logs.",
      "done_signal": "README language split and runtime/user-manual boundary tests pass.",
      "wave": 3,
      "review_gate": "required",
      "review_focus": "Check provider facts remain untrusted evidence and credential guidance is concrete without becoming a provider implementation guide.",
      "risk_note": "The main risk is duplicating full runtime docs in README instead of linking to the contract.",
      "stop_if": "Runtime generation changes or provider setup behavior changes become necessary."
    },
    {
      "task_id": "T004",
      "source_unit": "U6",
      "requirement_refs": ["R8", "R9"],
      "goal": "Tighten agent role ownership, bounded dispatch, fallback, worker suitability, and review autofix boundaries.",
      "dependencies": ["T003"],
      "files": [
        "agents/spec-repo-research-analyst.agent.md",
        "agents/spec-learnings-researcher.agent.md",
        "agents/spec-architecture-strategist.agent.md",
        "agents/spec-testing-reviewer.agent.md",
        "agents/spec-scope-guardian-reviewer.agent.md",
        "skills/spec-code-review/SKILL.md",
        "skills/spec-doc-review/SKILL.md",
        "skills/spec-plan/SKILL.md",
        "tests/unit/agent-support-contracts.test.js",
        "tests/unit/spec-dispatch-boundary-contracts.test.js",
        "tests/unit/spec-code-review-contracts.test.js",
        "tests/unit/spec-doc-review-contracts.test.js",
        "tests/unit/spec-plan-contracts.test.js",
        "CHANGELOG.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U6. Agent role 与 dispatch boundary 收紧",
        "skills/spec-doc-review/SKILL.md#Dispatch Capability Gate",
        "skills/spec-code-review/SKILL.md",
        "tests/unit/spec-dispatch-boundary-contracts.test.js",
        "tests/unit/agent-support-contracts.test.js"
      ],
      "entry_hint": "Keep dispatch explicit and bounded; worker suitability is a gate, not a lifecycle.",
      "parallelizable": false,
      "test_focus": "Unavailable dispatch has inline/report-only fallback, broad or sensitive unclear work cannot worker-delegate, and hidden implement/check agent language is rejected.",
      "done_signal": "Agent/dispatch/doc-review/code-review/plan contract tests pass and fresh-source eval finds no P1/P2 dispatch drift.",
      "wave": 4,
      "review_gate": "required",
      "review_focus": "Check no implicit implement/check lifecycle or always-on worker delegation was introduced.",
      "risk_note": "The main risk is turning dispatch guidance into a hidden orchestrator state machine.",
      "stop_if": "New agent profiles, new public workflows, or runtime adapter changes become necessary."
    },
    {
      "task_id": "T005",
      "source_unit": "U7",
      "requirement_refs": ["R12"],
      "goal": "Add domain language consumption and lightweight decision ledger guidance to planning, work, debug, review, and standards workflows.",
      "dependencies": ["T004"],
      "files": [
        "skills/spec-brainstorm/SKILL.md",
        "skills/spec-debug/SKILL.md",
        "skills/spec-work/SKILL.md",
        "skills/spec-plan/SKILL.md",
        "skills/spec-code-review/SKILL.md",
        "skills/spec-doc-review/SKILL.md",
        "skills/spec-standards/SKILL.md",
        "docs/contracts/graph-evidence-policy.md",
        "tests/unit/spec-brainstorm-contracts.test.js",
        "tests/unit/spec-debug-contracts.test.js",
        "tests/unit/spec-work-contracts.test.js",
        "tests/unit/spec-plan-contracts.test.js",
        "tests/unit/spec-code-review-contracts.test.js",
        "tests/unit/spec-doc-review-contracts.test.js",
        "tests/unit/spec-standards-contracts.test.js",
        "CHANGELOG.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U7. Domain language、ADR 与 decision ledger",
        "docs/contracts/graph-evidence-policy.md",
        "skills/spec-plan/SKILL.md#Context Orientation Anchor",
        "skills/spec-work/SKILL.md#Context Orientation Anchor",
        "tests/unit/spec-plan-contracts.test.js"
      ],
      "entry_hint": "Add a reusable domain-context and decision-ledger paragraph; do not require a fixed ADR directory.",
      "parallelizable": false,
      "test_focus": "Domain terminology first consumes existing docs/context; major decisions carry question, recommendation, source tag, chosen answer, consequence, and deferred reason when applicable.",
      "done_signal": "Targeted workflow contract tests pass and tests reject fixed glossary/ADR directory mandates.",
      "wave": 5,
      "review_gate": "required",
      "review_focus": "Check guidance remains advisory and does not force CONTEXT.md or docs/adr.",
      "risk_note": "The main risk is over-prescribing a documentation structure instead of improving context consumption.",
      "stop_if": "A new ADR artifact schema or durable decision ledger producer becomes necessary."
    },
    {
      "task_id": "T006",
      "source_unit": "U8",
      "requirement_refs": ["R10", "R11"],
      "goal": "Make debug/work/task execution feedback-loop-first and prefer vertical slices where implementation scope permits.",
      "dependencies": ["T005"],
      "files": [
        "skills/spec-debug/SKILL.md",
        "skills/spec-work/SKILL.md",
        "skills/spec-write-tasks/SKILL.md",
        "skills/spec-write-tasks/references/task-quality-guide.md",
        "skills/spec-code-review/SKILL.md",
        "tests/unit/spec-debug-contracts.test.js",
        "tests/unit/spec-work-contracts.test.js",
        "tests/unit/spec-write-tasks-contracts.test.js",
        "tests/unit/spec-code-review-contracts.test.js",
        "CHANGELOG.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U8. Feedback-loop-first debug 与 vertical slicing",
        "skills/spec-debug/SKILL.md",
        "skills/spec-write-tasks/references/task-quality-guide.md",
        "tests/unit/spec-debug-contracts.test.js",
        "tests/unit/spec-write-tasks-contracts.test.js"
      ],
      "entry_hint": "Use feedback loop as a quality gate with not-possible reasons; docs/config-only work uses docs contract checks rather than forced TDD.",
      "parallelizable": false,
      "test_focus": "Bug fixes require or attempt a feedback loop before fixes; task packs prefer independently verifiable vertical slices; docs-only work is not forced into TDD.",
      "done_signal": "Debug/work/write-tasks/code-review contract tests pass and horizontal all-tests-then-all-implementation guidance is rejected.",
      "wave": 6,
      "review_gate": "required",
      "review_focus": "Check feedback-loop guidance does not become rigid TDD for docs/config-only tasks.",
      "risk_note": "The main risk is replacing pragmatic feedback loops with one-size-fits-all testing ritual.",
      "stop_if": "New test runner tooling, browser automation, or task schema changes become necessary."
    },
    {
      "task_id": "T007",
      "source_unit": "U12-progressive-disclosure",
      "requirement_refs": ["R18", "R19", "R20", "R21", "R22", "R23", "R24", "R25"],
      "goal": "Add Phase 2 progressive-disclosure guidance for review workflows, sessions/compound replay refs, and skill-review posture checks.",
      "dependencies": ["T006"],
      "files": [
        "skills/spec-doc-review/SKILL.md",
        "skills/spec-code-review/SKILL.md",
        "skills/retired-skill-review/SKILL.md",
        "skills/spec-sessions/SKILL.md",
        "skills/spec-compound/SKILL.md",
        "skills/spec-compound-refresh/SKILL.md",
        "tests/unit/spec-doc-review-contracts.test.js",
        "tests/unit/spec-code-review-contracts.test.js",
        "tests/unit/spec-sessions-contracts.test.js",
        "tests/unit/retired-skill-review-contracts.test.js",
        "CHANGELOG.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U12. Token economy guardrails 与 progressive disclosure",
        "docs/contracts/workflows/review-pre-facts-extraction.md",
        "src/cli/helpers/review-pre-facts.js",
        "skills/spec-doc-review/SKILL.md",
        "skills/spec-code-review/SKILL.md",
        "skills/retired-skill-review/SKILL.md"
      ],
      "entry_hint": "Keep this as guidance: scale-aware reviewer set, checkpoint/replay refs, and audit detection of overgrown entry prompts.",
      "parallelizable": false,
      "test_focus": "Low-risk docs-only and high-risk workflow/contract/release changes have different reviewer posture; sessions/compound use distilled refs; skill-review flags progressive disclosure drift.",
      "done_signal": "Review/session/skill-review contract tests pass without adding hard token budgets or a new facts pipeline.",
      "wave": 7,
      "review_gate": "required",
      "review_focus": "Check no hard token budget engine, replay index, or new reviewer facts pipeline was introduced.",
      "risk_note": "The main risk is implementing Phase 3 checkpoint replay or hard automation early.",
      "stop_if": "Durable replay index, automated retention, or new deterministic reviewer fact producer becomes necessary."
    },
    {
      "task_id": "T008",
      "source_unit": "U11",
      "requirement_refs": ["R17", "R26"],
      "goal": "Close Phase 2 with changelog, validation evidence, runtime impact note, fresh-source eval, and run evidence.",
      "dependencies": ["T001", "T002", "T003", "T004", "T005", "T006", "T007"],
      "files": [
        "CHANGELOG.md",
        "docs/validation/2026-05-17-phase2-boundary-discipline-validation.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U11. Cross-cutting closeout checklist",
        "docs/contracts/workflows/fresh-source-eval-checklist.md",
        "tests/unit/changelog-format.test.js"
      ],
      "entry_hint": "Record exact commands, fresh-source findings, generated runtime impact, and any deferred Phase 3 boundary.",
      "parallelizable": false,
      "test_focus": "Changelog format, targeted tests, typecheck, diff whitespace, fresh-source eval, and no generated runtime mirror edits.",
      "done_signal": "Phase 2 validation artifact exists, no P1/P2 fresh-source findings remain, and Phase 3 handoff is explicit.",
      "wave": 8,
      "review_gate": "required",
      "review_focus": "Check no Phase 3 release/replay/retention scope was implemented early.",
      "risk_note": "The main risk is claiming complete plan delivery before Phase 3 gates close.",
      "stop_if": "Fresh-source eval reports unresolved P1/P2 findings or generated runtime mirrors require manual editing."
    }
  ]
}
```

## Task Cards

### T001

- source_unit: U1-full-batch-1
- requirement_refs: R1, R2, R17
- goal: Add lightweight contract summaries to the eight named Phase 2 public workflow skills.
- dependencies: none
- files:
  - `skills/spec-brainstorm/SKILL.md`
  - `skills/spec-debug/SKILL.md`
  - `skills/spec-doc-review/SKILL.md`
  - `skills/spec-code-review/SKILL.md`
  - `skills/spec-mcp-setup/SKILL.md`
  - `skills/spec-graph-bootstrap/SKILL.md`
  - `skills/spec-update/SKILL.md`
  - `skills/spec-work-beta/SKILL.md`
  - `tests/unit/public-workflow-contract-summary.test.js`
  - `tests/unit/lint-skill-entrypoints.test.js`
  - `CHANGELOG.md`
- context_refs:
  - `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U1. Public workflow contract summary 覆盖`
  - `src/cli/contracts/dual-host-governance/skills-governance.json`
  - `tests/unit/public-workflow-contract-summary.test.js`
- test_focus: contract summary coverage for the Phase 2 batch only.
- done_signal: targeted public summary tests pass.
- stop_if: U1-full-batch-2 becomes necessary.
- review_gate: optional
- wave: 1

### T002

- source_unit: U4-phase2-mode-follow-up
- requirement_refs: R6, R12
- goal: Finish or verify Phase 2 standards mode/freshness follow-up without changing next-action candidates into workflow routing.
- dependencies: T001
- files:
  - `skills/spec-standards/SKILL.md`
  - `skills/spec-standards/README.md`
  - `skills/spec-standards/scripts/prepare-baseline.js`
  - `skills/spec-standards/scripts/validate-artifacts.js`
  - `skills/spec-standards/examples/next-action-candidates.example.json`
  - `tests/unit/spec-standards-contracts.test.js`
  - `tests/unit/spec-standards-validation.test.js`
  - `tests/unit/spec-standards-consumers.test.js`
  - `CHANGELOG.md`
- context_refs:
  - `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U4. `spec-standards` next-action candidates`
  - `skills/spec-standards/scripts/prepare-baseline.js`
  - `tests/unit/spec-standards-contracts.test.js`
- test_focus: mode/freshness facts, fail-closed schema behavior, no decision fields.
- done_signal: standards tests pass.
- stop_if: a script-owned workflow recommendation or blocking policy becomes necessary.
- review_gate: required
- wave: 2

### T003

- source_unit: U5
- requirement_refs: R7, R9, R25
- goal: Add source/runtime/provider customization boundary docs and short README links.
- dependencies: T002
- files:
  - `docs/contracts/source-runtime-customization-boundary.md`
  - `README.md`
  - `README.zh-CN.md`
  - `docs/catalog/runtime-capabilities.md`
  - `tests/unit/readme-language-split.test.js`
  - `tests/unit/user-manual-contracts.test.js`
  - `tests/unit/runtime-contract-boundary.test.js`
  - `CHANGELOG.md`
- context_refs:
  - `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U5. Source/runtime customization boundary 文档`
  - `docs/contracts/context-governance.md`
  - `docs/contracts/workflows/review-pre-facts-extraction.md`
- test_focus: source/runtime/provider/credential boundaries.
- done_signal: docs boundary tests pass.
- stop_if: generator/runtime behavior changes become necessary.
- review_gate: required
- wave: 3

### T004

- source_unit: U6
- requirement_refs: R8, R9
- goal: Tighten bounded dispatch and worker suitability contracts.
- dependencies: T003
- files:
  - `agents/spec-repo-research-analyst.agent.md`
  - `agents/spec-learnings-researcher.agent.md`
  - `agents/spec-architecture-strategist.agent.md`
  - `agents/spec-testing-reviewer.agent.md`
  - `agents/spec-scope-guardian-reviewer.agent.md`
  - `skills/spec-code-review/SKILL.md`
  - `skills/spec-doc-review/SKILL.md`
  - `skills/spec-plan/SKILL.md`
  - `tests/unit/agent-support-contracts.test.js`
  - `tests/unit/spec-dispatch-boundary-contracts.test.js`
  - `tests/unit/spec-code-review-contracts.test.js`
  - `tests/unit/spec-doc-review-contracts.test.js`
  - `tests/unit/spec-plan-contracts.test.js`
  - `CHANGELOG.md`
- context_refs:
  - `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U6. Agent role 与 dispatch boundary 收紧`
  - `tests/unit/spec-dispatch-boundary-contracts.test.js`
- test_focus: dispatch fallback, worker suitability, autofix boundary.
- done_signal: agent/dispatch contract tests pass.
- stop_if: new agents or runtime adapter changes are needed.
- review_gate: required
- wave: 4

### T005

- source_unit: U7
- requirement_refs: R12
- goal: Add domain-language consumption and decision ledger guidance.
- dependencies: T004
- files:
  - `skills/spec-brainstorm/SKILL.md`
  - `skills/spec-debug/SKILL.md`
  - `skills/spec-work/SKILL.md`
  - `skills/spec-plan/SKILL.md`
  - `skills/spec-code-review/SKILL.md`
  - `skills/spec-doc-review/SKILL.md`
  - `skills/spec-standards/SKILL.md`
  - `docs/contracts/graph-evidence-policy.md`
  - `tests/unit/spec-brainstorm-contracts.test.js`
  - `tests/unit/spec-debug-contracts.test.js`
  - `tests/unit/spec-work-contracts.test.js`
  - `tests/unit/spec-plan-contracts.test.js`
  - `tests/unit/spec-code-review-contracts.test.js`
  - `tests/unit/spec-doc-review-contracts.test.js`
  - `tests/unit/spec-standards-contracts.test.js`
  - `CHANGELOG.md`
- context_refs:
  - `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U7. Domain language、ADR 与 decision ledger`
  - `docs/contracts/graph-evidence-policy.md`
- test_focus: consume existing context before questions, decision tags/consequences, no fixed ADR directory.
- done_signal: targeted contract tests pass.
- stop_if: a durable ADR schema or producer is required.
- review_gate: required
- wave: 5

### T006

- source_unit: U8
- requirement_refs: R10, R11
- goal: Add feedback-loop-first and vertical slicing execution guidance.
- dependencies: T005
- files:
  - `skills/spec-debug/SKILL.md`
  - `skills/spec-work/SKILL.md`
  - `skills/spec-write-tasks/SKILL.md`
  - `skills/spec-write-tasks/references/task-quality-guide.md`
  - `skills/spec-code-review/SKILL.md`
  - `tests/unit/spec-debug-contracts.test.js`
  - `tests/unit/spec-work-contracts.test.js`
  - `tests/unit/spec-write-tasks-contracts.test.js`
  - `tests/unit/spec-code-review-contracts.test.js`
  - `CHANGELOG.md`
- context_refs:
  - `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U8. Feedback-loop-first debug 与 vertical slicing`
  - `skills/spec-write-tasks/references/task-quality-guide.md`
- test_focus: feedback loop attempts, hypothesis ledger, docs-only non-TDD exception, vertical slices.
- done_signal: targeted contract tests pass.
- stop_if: task schema or runner tooling changes are needed.
- review_gate: required
- wave: 6

### T007

- source_unit: U12-progressive-disclosure
- requirement_refs: R18, R19, R20, R21, R22, R23, R24, R25
- goal: Add Phase 2 progressive-disclosure guidance for review/session/compound/skill-review surfaces.
- dependencies: T006
- files:
  - `skills/spec-doc-review/SKILL.md`
  - `skills/spec-code-review/SKILL.md`
  - `skills/retired-skill-review/SKILL.md`
  - `skills/spec-sessions/SKILL.md`
  - `skills/spec-compound/SKILL.md`
  - `skills/spec-compound-refresh/SKILL.md`
  - `tests/unit/spec-doc-review-contracts.test.js`
  - `tests/unit/spec-code-review-contracts.test.js`
  - `tests/unit/spec-sessions-contracts.test.js`
  - `tests/unit/retired-skill-review-contracts.test.js`
  - `CHANGELOG.md`
- context_refs:
  - `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U12. Token economy guardrails 与 progressive disclosure`
  - `docs/contracts/workflows/review-pre-facts-extraction.md`
  - `src/cli/helpers/review-pre-facts.js`
- test_focus: scale-aware review, distilled replay refs, skill-review progressive disclosure checks.
- done_signal: review/session/skill-review contract tests pass.
- stop_if: durable replay index or hard token budget automation is required.
- review_gate: required
- wave: 7

### T008

- source_unit: U11
- requirement_refs: R17, R26
- goal: Close Phase 2 with evidence.
- dependencies: T001, T002, T003, T004, T005, T006, T007
- files:
  - `CHANGELOG.md`
  - `docs/validation/2026-05-17-phase2-boundary-discipline-validation.md`
- context_refs:
  - `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U11. Cross-cutting closeout checklist`
  - `docs/contracts/workflows/fresh-source-eval-checklist.md`
- test_focus: changelog, targeted tests, typecheck, fresh-source eval, no runtime mirror edits.
- done_signal: Phase 2 validation artifact exists and Phase 3 handoff is explicit.
- stop_if: unresolved P1/P2 findings remain.
- review_gate: required
- wave: 8

## Orientation Evidence

- provider: direct-repo-reads
- posture: bounded
- evidence_refs:
  - `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md`
  - `src/cli/contracts/dual-host-governance/skills-governance.json`
  - `tests/unit/*-contracts.test.js`
- limitations:
  - Compiled graph facts are stale for this dirty branch and were not used as primary task-splitting evidence.
  - The task pack is derived from the source plan and must not be treated as a second plan.

## Validation Notes

- Validate this task pack before execution:
  - `./bin/spec-first.js tasks validate docs/tasks/2026-05-17-004-feat-spec-first-optimization-phase2-tasks.md --json`
- Suggested targeted validation after implementation:
  - `npm run lint:skill-entrypoints`
  - `npm run test:jest -- tests/unit/public-workflow-contract-summary.test.js tests/unit/lint-skill-entrypoints.test.js tests/unit/spec-standards-contracts.test.js tests/unit/spec-standards-validation.test.js tests/unit/spec-standards-consumers.test.js tests/unit/readme-language-split.test.js tests/unit/user-manual-contracts.test.js tests/unit/runtime-contract-boundary.test.js tests/unit/agent-support-contracts.test.js tests/unit/spec-dispatch-boundary-contracts.test.js tests/unit/spec-brainstorm-contracts.test.js tests/unit/spec-debug-contracts.test.js tests/unit/spec-work-contracts.test.js tests/unit/spec-plan-contracts.test.js tests/unit/spec-write-tasks-contracts.test.js tests/unit/spec-code-review-contracts.test.js tests/unit/spec-doc-review-contracts.test.js tests/unit/spec-standards-contracts.test.js tests/unit/spec-sessions-contracts.test.js tests/unit/retired-skill-review-contracts.test.js tests/unit/changelog-format.test.js --runInBand`
  - `npm run typecheck`
  - `git diff --check`
- Run fresh-source eval for skill/agent prose changes or record a valid not-run reason.
- Check `git status --short -- .claude .codex .agents/skills` before closeout.

## Regeneration Rules

- Regenerate this task pack if the source plan body hash changes, if Phase 2 source anchors change, or if a task's `stop_if` triggers.
- Do not expand this task pack into Phase 3 release/replay/retention work. Generate a Phase 3 task pack after Phase 2 closeout.
- Do not hand-edit generated runtime mirrors to make tests or eval pass.
