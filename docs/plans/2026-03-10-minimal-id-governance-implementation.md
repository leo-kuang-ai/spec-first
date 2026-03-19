# Minimal ID Governance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the minimum strong governance needed to keep ID generation, parsing, persistence, and recovery stable without over-tightening the workflow.

**Architecture:** Keep only four hard invariants: one schema per state file, one parser for `task_plan.md`, one resolver for Feature identity, and one safe allocator path for Artifact IDs. Everything else remains soft guardrails or follow-up work. The implementation reuses existing modules where possible and adds only the smallest shared abstractions needed for correctness.

**Tech Stack:** TypeScript, Vitest, existing CLI/core modules, filesystem-based state.

---

### Task 1: Rewrite minimal-governance proposal

**Files:**
- Modify: `docs/review-bundles/2026-03-10-全局审计/09-优化方案.md`

**Step 1: Write the expected document shape**
- Capture the four hard invariants and warn-only boundaries in the target doc.

**Step 2: Verify current doc is too broad**
- Run: `rg -n '^## Phase|^### P' docs/review-bundles/2026-03-10-全局审计/09-优化方案.md`
- Expected: Contains broad multi-phase governance items.

**Step 3: Rewrite the doc minimally**
- Keep only the minimum hard-blocking items and move other work to follow-up / warn-only framing.

**Step 4: Re-read for alignment**
- Run: `sed -n '1,120p' docs/review-bundles/2026-03-10-全局审计/09-优化方案.md`
- Expected: Clearly states four hard invariants and a lighter rollout policy.

### Task 2: Split state-file schemas safely

**Files:**
- Modify: `src/core/ai-orchestrator/todo-runner.ts`
- Modify: `src/core/batch-executor/checkpoint.ts`
- Create or Modify: shared schema helper file if needed
- Test: `tests/unit/auto-loop.test.ts`
- Test: `tests/unit/batch-executor/integration.test.ts`

**Step 1: Write failing tests**
- Add tests proving batch checkpoint no longer collides with auto-loop `todo-state.json` and that wrong-schema files fail explicitly.

**Step 2: Run targeted tests to watch them fail**
- Run: `CI=1 pnpm vitest run tests/unit/auto-loop.test.ts tests/unit/batch-executor/integration.test.ts`
- Expected: Fails on schema/path collision expectations.

**Step 3: Implement minimal schema separation**
- Move batch executor checkpoint to `batch-checkpoint.json`.
- Add strict shape checking in `loadTodoState()`.

**Step 4: Re-run targeted tests**
- Same command, expected PASS.

### Task 3: Unify TASK parsing

**Files:**
- Create: `src/core/task-plan/parser.ts` (or similar minimal shared parser)
- Modify: `src/cli/commands/batch-test.ts`
- Modify: `src/cli/commands/commit.ts`
- Modify: `src/core/ai-orchestrator/catchup.ts`
- Modify: `src/core/skill-runtime/prompt-assembler.ts`
- Modify: `src/core/skill-runtime/hard-gate.ts`
- Test: parser-focused unit test file
- Update adjacent tests as needed

**Step 1: Write failing tests**
- Prove one canonical table-based `task_plan.md` yields the same current task / task list across consumers.

**Step 2: Run focused tests to watch RED**
- Run a targeted Vitest subset for parser-related tests.

**Step 3: Implement a single parser and switch all consumers**
- Remove ad-hoc regex scanning from consumers.

**Step 4: Re-run parser-related tests**
- Expected: PASS with consistent parsing semantics.

### Task 4: Unify Feature resolution

**Files:**
- Modify: `src/core/process-engine/feature.ts`
- Modify: `src/cli/commands/id.ts`
- Update tests around feature resolution and CLI behavior

**Step 1: Write failing tests**
- Add tests for directory name / `stage-state.featureId` mismatch and for `id` command using shared resolver semantics.

**Step 2: Run tests to verify RED**
- Run focused feature/id tests.

**Step 3: Implement minimal invariant checks**
- Ensure feature listing/loading validates directory ↔ state consistency.
- Route `id next/search/list` through shared feature resolution.

**Step 4: Re-run focused tests**
- Expected: PASS.

### Task 5: Harden ID allocation minimally

**Files:**
- Modify: `src/core/trace-engine/id-generator.ts`
- Modify: `src/core/trace-engine/matrix.ts`
- Possibly create: shared file lock helper
- Test: `tests/unit/id-generator.test.ts`
- Add concurrency/regression test if appropriate

**Step 1: Write failing tests**
- Add regression coverage for duplicate writes / repeated allocation edge cases that should now be rejected or serialized.

**Step 2: Run focused tests to confirm RED**
- Run `CI=1 pnpm vitest run tests/unit/id-generator.test.ts ...`

**Step 3: Implement minimal safe allocator**
- Add feature-local lock around allocation and prevent duplicate row append for the allocated ID.

**Step 4: Re-run focused tests**
- Expected: PASS.

### Task 6: Wire retry into auto-loop and verify all changes

**Files:**
- Modify: `src/core/ai-orchestrator/auto-loop.ts`
- Update retry-related tests
- Update relevant docs if behavior changed materially

**Step 1: Write failing tests**
- Add a focused auto-loop test proving retry controller state is used on retryable failure.

**Step 2: Run focused retry/auto-loop tests to verify RED**
- Run retry + auto-loop test subset.

**Step 3: Implement minimal retry wiring**
- On retryable executor failure, use `makeRetryDecision()` and `applyRetryToState()` before halting/blocking.

**Step 4: Run broad verification**
- Run targeted changed-area suite first, then a broader relevant suite.

