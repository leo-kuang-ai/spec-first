# P1-2 Stage Flow A Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement Option A so `03_plan -> 04_implement -> 05_verify` can form a controlled semi-automatic stage progression loop through state-based decisions, without introducing a new real skill execution chain.

**Architecture:** Extend `next-step-decider` to consume explicit loop outcome and emit structured decision reasons, then wire `orchestrate` to sync existing hooks, evaluate the latest state snapshot, and optionally call `advance()` only when all safety conditions pass. Keep `auto-loop` focused on todo execution and keep runtime notice / skill dispatch unchanged.

**Tech Stack:** TypeScript, Vitest, existing spec-first CLI / process-engine / ai-orchestrator modules.

---

### Task 1: Extend decision input for loop outcome

**Files:**
- Modify: `src/core/process-engine/next-step-decider.ts`
- Test: `tests/unit/next-step-decider.test.ts`

**Step 1: Write the failing test**

Add test cases asserting that `autoLoopStatus='has_blocked'` or `autoLoopStatus='timeout'` returns `BLOCKED` with stable `reasonCodes`.

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/next-step-decider.test.ts`
Expected: FAIL because `autoLoopStatus` is ignored or `reasonCodes` is absent.

**Step 3: Write minimal implementation**

In `src/core/process-engine/next-step-decider.ts`:
- extend `NextStepDecisionInput` with `autoLoopStatus`
- extend `NextStepDecision` with optional `reasonCodes`
- add helper to normalize loop-level failures into `BLOCKED`

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/next-step-decider.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/process-engine/next-step-decider.ts tests/unit/next-step-decider.test.ts
git commit -m "feat: add loop outcome to next-step decider"
```

### Task 2: Tighten stage-specific decision rules for 03/04/05

**Files:**
- Modify: `src/core/process-engine/next-step-decider.ts`
- Test: `tests/unit/next-step-decider.test.ts`
- Create: `tests/unit/stage-flow-03-05.test.ts`

**Step 1: Write the failing test**

Add stage-focused cases for:
- `03_plan` ready -> `READY_TO_ADVANCE`
- `04_implement` pending todo -> `SUGGEST_NEXT`
- `04_implement` blocked todo -> `BLOCKED`
- `05_verify` pass -> `READY_TO_ADVANCE`

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/next-step-decider.test.ts tests/unit/stage-flow-03-05.test.ts`
Expected: FAIL because current rules are too coarse.

**Step 3: Write minimal implementation**

Refactor decision branches in `src/core/process-engine/next-step-decider.ts`:
- centralize common blockers
- keep `AUTO_RUN_NEXT_SKILL` unreachable for P1-2 paths
- make `03_plan / 04_implement / 05_verify` return only `BLOCKED / SUGGEST_NEXT / READY_TO_ADVANCE / AUTO_ADVANCE`

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/next-step-decider.test.ts tests/unit/stage-flow-03-05.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/process-engine/next-step-decider.ts tests/unit/next-step-decider.test.ts tests/unit/stage-flow-03-05.test.ts
git commit -m "feat: tighten stage 03-05 decision rules"
```

### Task 3: Wire orchestrate to pass loop outcome into decider

**Files:**
- Modify: `src/cli/commands/orchestrate.ts`
- Test: `tests/unit/orchestrate-stage-integration.test.ts`

**Step 1: Write the failing test**

Add integration tests asserting:
- `autoLoopStatus='has_blocked'` prevents advance
- `all_done` + safe conditions allows `READY_TO_ADVANCE`
- default mode still prints suggestion only

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/orchestrate-stage-integration.test.ts`
Expected: FAIL because orchestrate does not forward the loop outcome into decision logic.

**Step 3: Write minimal implementation**

In `src/cli/commands/orchestrate.ts`:
- map `autoLoopResult?.status` to `autoLoopStatus`
- pass it into `decideNextStep()`
- keep current output behavior stable where possible

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/orchestrate-stage-integration.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/cli/commands/orchestrate.ts tests/unit/orchestrate-stage-integration.test.ts
git commit -m "feat: forward loop status into orchestrate decisions"
```

### Task 4: Add lightweight orchestrate hook sync points

**Files:**
- Modify: `src/core/tool-integration/ai-runtime-hook.ts`
- Modify: `src/cli/commands/orchestrate.ts`
- Test: `tests/unit/orchestrate-stage-integration.test.ts`

**Step 1: Write the failing test**

Add tests asserting hook sync failures do not block progression evaluation, but warnings are surfaced.

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/orchestrate-stage-integration.test.ts`
Expected: FAIL because no dedicated sync point exists.

**Step 3: Write minimal implementation**

Implement a thin helper in `src/core/tool-integration/ai-runtime-hook.ts` for orchestrate sync:
- run existing task/progress sync commands or equivalent minimal wrapper
- return warnings instead of throwing on failure
Wire it from `src/cli/commands/orchestrate.ts` at:
- before decision evaluation
- after successful `advance()`

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/orchestrate-stage-integration.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/tool-integration/ai-runtime-hook.ts src/cli/commands/orchestrate.ts tests/unit/orchestrate-stage-integration.test.ts
git commit -m "feat: add orchestrate sync hook points"
```

### Task 5: Guard auto-advance with explicit blockers

**Files:**
- Modify: `src/cli/commands/orchestrate.ts`
- Test: `tests/unit/orchestrate-stage-integration.test.ts`
- Test: `tests/unit/stage-flow-03-05.test.ts`

**Step 1: Write the failing test**

Add cases verifying `--auto-advance` still refuses to call `advance()` when:
- loop status is not `all_done`
- gate fails
- dependency fails
- todo remains blocked

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/orchestrate-stage-integration.test.ts tests/unit/stage-flow-03-05.test.ts`
Expected: FAIL because some blockers are not enforced centrally.

**Step 3: Write minimal implementation**

In `src/cli/commands/orchestrate.ts`:
- gate auto-advance on allowed decision types only
- ensure blocked reasons are printed
- do not call `advance()` for any degraded decision path

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/orchestrate-stage-integration.test.ts tests/unit/stage-flow-03-05.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/cli/commands/orchestrate.ts tests/unit/orchestrate-stage-integration.test.ts tests/unit/stage-flow-03-05.test.ts
git commit -m "feat: enforce blockers before orchestrate auto-advance"
```

### Task 6: Align args and docs with Option A boundaries

**Files:**
- Modify: `src/core/skill-runtime/orchestrate-args.ts`
- Modify: `skills/spec-first/13-orchestrate/SKILL.md`
- Test: `tests/unit/orchestrate-args-parser.test.ts`

**Step 1: Write the failing test**

Add parser/doc alignment checks for Option A boundaries:
- `--auto-advance` means only stage advance, not auto-run next skill
- help text or skill doc no longer implies real task/code/verify execution chaining

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/orchestrate-args-parser.test.ts`
Expected: FAIL if parser/doc wording still implies broader automation.

**Step 3: Write minimal implementation**

Update:
- `src/core/skill-runtime/orchestrate-args.ts` comments / semantics
- `skills/spec-first/13-orchestrate/SKILL.md` wording to reflect Option A

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/orchestrate-args-parser.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/skill-runtime/orchestrate-args.ts skills/spec-first/13-orchestrate/SKILL.md tests/unit/orchestrate-args-parser.test.ts
git commit -m "docs: align orchestrate semantics with option A"
```

### Task 7: Run focused regression suite

**Files:**
- Test: `tests/unit/next-step-decider.test.ts`
- Test: `tests/unit/orchestrate-stage-integration.test.ts`
- Test: `tests/unit/orchestrate-args-parser.test.ts`
- Test: `tests/unit/stage-flow-03-05.test.ts`
- Test: `tests/unit/auto-loop.test.ts`

**Step 1: Run focused suite**

Run: `pnpm vitest run tests/unit/next-step-decider.test.ts tests/unit/orchestrate-stage-integration.test.ts tests/unit/orchestrate-args-parser.test.ts tests/unit/stage-flow-03-05.test.ts tests/unit/auto-loop.test.ts`
Expected: PASS

**Step 2: Review failures**

If any fail, fix only failures caused by this scope. Do not fix unrelated runtime cleanup problems.

**Step 3: Re-run focused suite**

Run the same command again.
Expected: PASS

**Step 4: Commit**

```bash
git add src/core/process-engine/next-step-decider.ts src/cli/commands/orchestrate.ts src/core/tool-integration/ai-runtime-hook.ts src/core/skill-runtime/orchestrate-args.ts skills/spec-first/13-orchestrate/SKILL.md tests/unit/next-step-decider.test.ts tests/unit/orchestrate-stage-integration.test.ts tests/unit/orchestrate-args-parser.test.ts tests/unit/stage-flow-03-05.test.ts
git commit -m "feat: complete controlled stage flow option A"
```
