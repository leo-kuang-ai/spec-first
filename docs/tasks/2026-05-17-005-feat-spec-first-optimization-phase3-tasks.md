---
title: "feat: spec-first optimization Phase 3 task pack"
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
  - "U3. `spec-work` durable run evidence"
  - "U9. Release/source-runtime continuity guards"
  - "U10. Skill public surface、dependency tier 与 rejected-scope replay"
  - "U12. Token economy guardrails 与 progressive disclosure"
  - "U11. Cross-cutting closeout checklist"
  - "阶段 3：release 与治理闭环"
---

# feat: spec-first optimization Phase 3 task pack

## Overview

This task pack is the executable Phase 3 handoff for the source plan. It closes the release/governance phase only:

- U1-full-batch-2 public workflow contract summaries.
- U9 release/source-runtime continuity guard.
- U10 skill-review guard consumption and rejected/out-of-scope replay.
- U3b retention/prune and U12 checkpoint replay minimal consumer.
- U11 closeout evidence.

It does not flip `workflow_integrated=true`, create a full replay index, add a new public workflow, or hand-edit generated runtime mirrors.

## Source Summary

- Source plan: `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md`
- Phase: Stage 3 / `release 与治理闭环`
- Source-of-truth boundary: edit `skills/`, `src/cli/`, `scripts/`, `tests/`, `docs/`, `README*`, `package.json`, and `CHANGELOG.md` only.
- Generated runtime mirrors under `.claude/`, `.codex/`, and `.agents/skills/` remain out of scope.

## Traceability Matrix

| Source | Requirement / Acceptance | Task(s) | Validation |
| --- | --- | --- | --- |
| U1-full-batch-2 | R1, R2, R17; all workflow-command skills plus required standalone entry skills have summaries | T001 | public workflow summary tests, release continuity guard |
| U9 | R13, R14, R15; deterministic guard exposes catalog/governance/docs/package drift with reason codes | T002 | release continuity guard, release governance suite |
| U10 | R15, R16; skill audit consumes guard results and plan/work consume rejected/out-of-scope replay refs | T003 | skill-review/plan/work/session/compound contract tests |
| U3b / U12-checkpoint-replay | R5, R23, R26; run evidence can be read/pruned safely without becoming workflow state | T004 | run artifact contract/producer tests |
| U11 | R17, R26; changelog, validation, runtime impact, fresh-source eval, full acceptance | T005 | changelog, typecheck, release/build checks, validation artifact |

## Task Graph

- T001 should run first so release guards can check complete public summary coverage.
- T002 depends on T001 because the guard reads the summary inventory.
- T003 can follow T002 so skill-review guidance can reference guard results.
- T004 can run after T002 and T003; it touches the same `spec-work` surface as replay guidance.
- T005 closes the phase after verification and fresh-source eval.

## Execution Waves

- Wave 1: T001
- Wave 2: T002
- Wave 3: T003
- Wave 4: T004
- Wave 5: T005

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
    }
  ],
  "tasks": [
    {
      "task_id": "T001",
      "source_unit": "U1-full-batch-2",
      "requirement_refs": ["R1", "R2", "R17"],
      "goal": "Add lightweight contract summaries to the remaining Phase 3 public workflow skills and make summary coverage derive from the governance inventory.",
      "dependencies": [],
      "files": [
        "skills/spec-app-consistency-audit/SKILL.md",
        "skills/spec-compound/SKILL.md",
        "skills/spec-compound-refresh/SKILL.md",
        "skills/spec-ideate/SKILL.md",
        "skills/spec-optimize/SKILL.md",
        "skills/spec-polish-beta/SKILL.md",
        "skills/spec-release-notes/SKILL.md",
        "skills/spec-sessions/SKILL.md",
        "skills/retired-skill-review/SKILL.md",
        "skills/spec-slack-research/SKILL.md",
        "tests/unit/public-workflow-contract-summary.test.js",
        "CHANGELOG.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U1. Public workflow contract summary 覆盖",
        "src/cli/contracts/dual-host-governance/skills-governance.json",
        "tests/unit/public-workflow-contract-summary.test.js"
      ],
      "entry_hint": "Keep each summary compact and workflow-specific; do not duplicate deep execution sections.",
      "parallelizable": false,
      "test_focus": "Every workflow_command skill in governance plus using-spec-first/spec-write-tasks exposes summary fields near the top.",
      "done_signal": "Public workflow summary coverage test passes from governance-derived inventory.",
      "wave": 1,
      "review_gate": "optional",
      "review_focus": "Check summaries stay light and do not become a second runtime spec.",
      "risk_note": "The main risk is adding verbose duplicated workflow prose.",
      "stop_if": "Generated runtime mirrors or new workflow entries become necessary."
    },
    {
      "task_id": "T002",
      "source_unit": "U9",
      "requirement_refs": ["R13", "R14", "R15"],
      "goal": "Add a deterministic release continuity guard that checks runtime catalog freshness, public summary coverage, package delivery surface, website gate preservation, and README boundary links.",
      "dependencies": ["T001"],
      "files": [
        "scripts/check-release-continuity.cjs",
        "scripts/run-test-suite.cjs",
        "package.json",
        "tests/unit/release-continuity-guard.test.js",
        "tests/unit/run-test-suite.test.js",
        "tests/unit/package-install-contracts.test.js",
        "CHANGELOG.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U9. Release/source-runtime continuity guards",
        "scripts/generate-runtime-capability-catalog.js",
        "tests/unit/website-sync-contracts.test.js",
        "tests/smoke/release-dual-host-governance.sh"
      ],
      "entry_hint": "Guard outputs deterministic facts only: guard id, result, reason_code, artifact path, checked sources, and classification.",
      "parallelizable": false,
      "test_focus": "Guard distinguishes blocking and docs-only-no-impact classifications and release-governance runs it before install smoke.",
      "done_signal": "Release continuity guard unit test and release-governance suite pass.",
      "wave": 2,
      "review_gate": "required",
      "review_focus": "Check the guard does not judge semantic release readiness.",
      "risk_note": "The main risk is turning release guard facts into a release decision engine.",
      "stop_if": "A semantic release approval workflow or website implementation sync becomes necessary."
    },
    {
      "task_id": "T003",
      "source_unit": "U10",
      "requirement_refs": ["R15", "R16"],
      "goal": "Ensure skill-review consumes guard results and plan/work/session/compound surfaces consume provenance-backed rejected/out-of-scope rationale without creating workflow state.",
      "dependencies": ["T002"],
      "files": [
        "skills/retired-skill-review/SKILL.md",
        "skills/spec-plan/SKILL.md",
        "skills/spec-work/SKILL.md",
        "tests/unit/retired-skill-review-contracts.test.js",
        "tests/unit/spec-plan-contracts.test.js",
        "tests/unit/spec-work-contracts.test.js",
        "tests/unit/spec-sessions-contracts.test.js",
        "tests/unit/spec-compound-contracts.test.js",
        "CHANGELOG.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U10. Skill public surface、dependency tier 与 rejected-scope replay",
        "skills/retired-skill-review/SKILL.md",
        "skills/spec-sessions/SKILL.md",
        "skills/spec-compound/SKILL.md"
      ],
      "entry_hint": "Keep replay refs advisory and provenance-backed; do not turn rejected rationale into task status or a blocker.",
      "parallelizable": false,
      "test_focus": "Skill-audit names deterministic guard results, and plan/work consume rejected/out-of-scope rationale as advisory boundary evidence.",
      "done_signal": "Skill-audit, plan, work, sessions, and compound contract tests pass.",
      "wave": 3,
      "review_gate": "required",
      "review_focus": "Check replay refs do not become a state store.",
      "risk_note": "The main risk is creating a durable rejected-scope state machine.",
      "stop_if": "A new replay index or memory engine becomes necessary."
    },
    {
      "task_id": "T004",
      "source_unit": "U3b-U12-checkpoint-replay",
      "requirement_refs": ["R5", "R23", "R26"],
      "goal": "Make spec-work run evidence minimally readable and prunable with safe path handling while keeping workflow integration false.",
      "dependencies": ["T002", "T003"],
      "files": [
        "src/cli/helpers/spec-work-run-artifact.js",
        "docs/contracts/workflows/spec-work-run-artifact.schema.json",
        "skills/spec-work/SKILL.md",
        "skills/spec-work-beta/SKILL.md",
        "tests/unit/spec-work-run-artifact-producer.test.js",
        "tests/unit/spec-work-run-artifact-contract.test.js",
        "tests/unit/spec-work-contracts.test.js",
        "tests/unit/spec-work-beta-contracts.test.js",
        "CHANGELOG.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U3. `spec-work` durable run evidence",
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#U12. Token economy guardrails 与 progressive disclosure",
        "docs/contracts/workflows/spec-work-run-artifact.schema.json",
        "tests/unit/spec-work-run-artifact-producer.test.js"
      ],
      "entry_hint": "Read/prune are deterministic consumers; they must reject symlink/path escapes and must not imply workflow-integrated replay.",
      "parallelizable": false,
      "test_focus": "Read latest/specific artifacts, prune expired artifacts, preserve active artifacts, and fail closed on unsafe ids or symlink escapes.",
      "done_signal": "Run artifact contract/producer tests pass with workflow_integrated=false.",
      "wave": 4,
      "review_gate": "required",
      "review_focus": "Check prune/delete behavior cannot escape the target repo and does not become general workflow state.",
      "risk_note": "The main risk is introducing unsafe deletion or overstating replay integration.",
      "stop_if": "Full replay index, UI, external raw-log TTL enforcement, or workflow-integrated closeout becomes necessary."
    },
    {
      "task_id": "T005",
      "source_unit": "U11",
      "requirement_refs": ["R17", "R26"],
      "goal": "Close Phase 3 and the full plan with changelog, validation evidence, fresh-source eval, runtime impact, and acceptance summary.",
      "dependencies": ["T001", "T002", "T003", "T004"],
      "files": [
        "CHANGELOG.md",
        "docs/tasks/2026-05-17-005-feat-spec-first-optimization-phase3-tasks.md",
        "docs/validation/2026-05-17-phase3-spec-first-optimization-acceptance.md",
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md"
      ],
      "context_refs": [
        "docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md#完成定义",
        "docs/contracts/workflows/fresh-source-eval-checklist.md",
        "tests/unit/changelog-format.test.js"
      ],
      "entry_hint": "Record exact commands, runtime impact, no generated mirror edits, fresh-source eval findings, and plan completion status.",
      "parallelizable": false,
      "test_focus": "Changelog, task-pack validation, targeted tests, release-governance, build, typecheck, lint, diff check, and acceptance artifact.",
      "done_signal": "Phase 3 validation artifact exists, source plan status is completed, and no P1/P2 findings remain.",
      "wave": 5,
      "review_gate": "required",
      "review_focus": "Check full plan acceptance maps every U1-U12 unit to evidence.",
      "risk_note": "The main risk is claiming completion with uncovered release/replay/governance gates.",
      "stop_if": "Fresh-source eval or release-governance reports unresolved P1/P2 or blocking failures."
    }
  ]
}
```

## Validation Notes

- Validate this task pack with `./bin/spec-first.js tasks validate docs/tasks/2026-05-17-005-feat-spec-first-optimization-phase3-tasks.md --json`.
- Do not hand-edit generated runtime mirrors.
- Do not mark `workflow_integrated=true` unless a future source-plan change adds real closeout integration proof.
