---
title: "Phase 1D core workflow intake validation"
date: 2026-05-17
spec_id: 2026-05-11-002-spec-first-project-optimization-upgrade
phase: "Phase 1D"
status: passed
---

# Phase 1D core workflow intake validation

## Scope

- Source plan: `docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md`
- Task pack: `docs/tasks/2026-05-17-003-feat-spec-first-optimization-phase1d-tasks.md`
- Tasks: T001 / U1-core, T002 / U12-minimal, T003 / U11 closeout.
- Boundary: core chain contract summary and intake-order cleanup only. This phase did not implement full public workflow summary coverage, review dispatch resizing, sessions/compound replay, skill-review scoring, hard token budget automation, release/source-runtime guards, or retention/prune lifecycle.

## Deterministic Validation

- `./bin/spec-first.js tasks validate docs/tasks/2026-05-17-003-feat-spec-first-optimization-phase1d-tasks.md --json` passed with `task_pack_validity=valid`, matched `spec_id`, matched `source_plan_hash`, and valid Task Pack Contract.
- `npm run test:jest -- tests/unit/public-workflow-contract-summary.test.js tests/unit/lint-skill-entrypoints.test.js tests/unit/spec-plan-contracts.test.js tests/unit/spec-work-contracts.test.js tests/unit/spec-write-tasks-contracts.test.js tests/unit/spec-standards-contracts.test.js --runInBand` passed: 6 suites, 74 tests.
- `npm run typecheck` passed: 97 files checked.
- `npm run test:jest -- tests/unit/changelog-format.test.js --runInBand` passed: 1 suite, 2 tests.
- `git diff --check` passed.
- `git status --short -- .claude .codex .agents/skills` returned no changes.

## Fresh-Source Eval

Fresh-source eval used a fresh generic read-only subagent against current disk source snippets and did not read generated runtime mirrors or invoke cached typed skills.

```yaml
fresh_source_eval:
  status: passed
  source_paths:
    - docs/10-prompt/结构化项目角色契约.md
    - docs/contracts/workflows/fresh-source-eval-checklist.md
    - docs/contracts/workflows/review-pre-facts-extraction.md
    - src/cli/helpers/review-pre-facts.js
    - skills/using-spec-first/SKILL.md
    - skills/spec-plan/SKILL.md
    - skills/spec-write-tasks/SKILL.md
    - skills/spec-work/SKILL.md
    - skills/spec-standards/SKILL.md
    - tests/unit/public-workflow-contract-summary.test.js
    - tests/unit/using-spec-first-contracts.test.js
    - tests/unit/spec-plan-contracts.test.js
    - tests/unit/spec-write-tasks-contracts.test.js
    - tests/unit/spec-work-contracts.test.js
    - tests/unit/spec-standards-contracts.test.js
  runtime_paths_checked: []
  changed_behavior: "Phase 1D 为核心 spec-first workflow 补轻量 contract summary、context intake order、review-pre-facts trust model 复用和 source/runtime 边界约束。"
  checks:
    trigger_precision: passed
    source_runtime_boundary: passed
    host_entrypoints: passed
    internal_only_boundary: passed
    deterministic_vs_semantic_boundary: passed
    tests: passed
  findings: []
  gate: "无 P1/P2 findings；Phase 1D gate 可进入 Phase 2。"
```

Reviewer notes:

- Core workflow contract summaries remain light and do not become full runtime specs or state machines.
- Intake order is explicit for `spec-plan`, `spec-write-tasks`, `spec-work`, and `spec-standards`: summary/metadata first, deterministic inventory/readiness/validation facts second, current task/phase/mode refs third, focused source-of-truth sections fourth, deeper refs/examples last.
- The changed workflow prose reuses `docs/contracts/workflows/review-pre-facts-extraction.md` and `src/cli/helpers/review-pre-facts.js`; no parallel reviewer facts pipeline was introduced.
- The source/runtime boundary is preserved. Generated mirrors under `.claude/`, `.codex/`, and `.agents/skills/` were not treated as source and were not hand-edited.

## Evidence Safety

- No raw provider output, raw logs, credentials, absolute local temp paths, or generated runtime mirror content were embedded in this validation artifact.
- Fresh-source eval output is summarized and classified as reviewer evidence, not deterministic proof.
- GitNexus graph facts were not used as primary evidence because current branch/worktree changes make compiled graph facts stale for this dirty checkout.

## Runtime Impact

- Source changed under `skills/`, `tests/`, `docs/tasks/`, `docs/validation/`, and `CHANGELOG.md`.
- Generated runtime mirrors were not hand-edited.
- No runtime regeneration was performed during Phase 1D; source validation is the proof for this phase.
- Phase 1B producer wrote `.spec-first/workflows/spec-work/spec-first/phase1d-core-intake/run.json` with `producer_available=true`, `workflow_integrated=false`, and no warnings. It remains write-side evidence only until `spec-work` closeout integration is implemented and verified.

## Phase Gate

Phase 1D is passed. The core chain contract summary tests and intake-order contract tests are green, and the fresh-source eval reported no P1/P2 findings. Phase 2 can start from a new phase task pack derived from the source plan.
