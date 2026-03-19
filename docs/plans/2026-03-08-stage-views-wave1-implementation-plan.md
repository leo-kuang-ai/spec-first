# Stage Views Wave 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 先完成 `Gate 0` 就绪校验，并在前置条件满足后落地 Stage Views 首批 consumer 接入：`00-onboarding`、`01-init`、`13-orchestrate`。

**Architecture:** `00-first` 负责 runtime 真源；Wave 1 consumer 只负责识别和消费背景状态，不重复生产背景。若 `Gate 0` 发现仓库仍存在 `docs/first` 直连链路，则先回补 `first-skill` P0，再继续 consumer 接入。

**Tech Stack:** TypeScript、Node.js、Vitest、Spec-First Skill Docs、CLI Commands

---

### Task 0: Gate 0 readiness verification

**Files:**
- Check: `src/core/skill-runtime/first-context.ts`
- Check: `src/core/skill-runtime/first-resume.ts`
- Check: `src/core/skill-runtime/first-change-detector.ts`
- Check: `src/cli/commands/init.ts`
- Check: `skills/spec-first/01-init/SKILL.md`

**Step 1: Verify the runtime truth-source is usable**

Run: `rg -n "loadStageView|loadFirstContext|role-views|stage-views" src tests -S`
Expected: find runtime loaders and tests proving stage views already exist.

**Step 2: Verify old `docs/first` coupling is gone from Gate 0 scope**

Run: `rg -n "docs/first|\.index\.yaml" src/cli/commands/init.ts src/core/skill-runtime/first-resume.ts src/core/skill-runtime/first-change-detector.ts skills/spec-first/01-init -S`
Expected: no blocking truth-source dependency remains in `init readiness / resume / change-detector`.

**Step 3: Stop and pivot if Gate 0 fails**

If any blocking `docs/first` dependency remains:
- mark Gate 0 as failed
- do not start Task 1-3 implementation
- create a focused P0 fix plan first

### Task 1: `00-onboarding` consumes `role-views`

**Files:**
- Modify: `skills/spec-first/00-onboarding/SKILL.md`
- Modify: `skills/spec-first/00-onboarding/references/scenario-mapping.md`
- Test: `tests/unit/onboarding-skill-docs.test.ts`

**Step 1: Write the failing test**

Assert:
- onboarding explicitly prefers `role-views`
- onboarding explicitly enters degraded mode when `first` assets are missing

**Step 2: Run the test and watch it fail**

Run: `pnpm vitest run tests/unit/onboarding-skill-docs.test.ts`
Expected: FAIL because docs do not yet describe role-view-first behavior.

**Step 3: Write the minimal doc changes**

Update docs so they:
- describe `role-views` as the preferred source
- distinguish `full` vs degraded onboarding entry

**Step 4: Run the test and watch it pass**

Run: `pnpm vitest run tests/unit/onboarding-skill-docs.test.ts`
Expected: PASS.

### Task 2: `01-init` exposes `background_input_status`

**Files:**
- Modify: `src/core/process-engine/init.ts`
- Modify: `src/cli/commands/init.ts`
- Modify: `skills/spec-first/01-init/SKILL.md`
- Modify: `skills/spec-first/01-init/references/output-format.md`
- Modify: `skills/spec-first/01-init/references/interaction-guide.md`
- Test: `tests/unit/init.test.ts`

**Step 1: Write the failing test**

Assert:
- init checks runtime `first` assets
- init result includes `background_input_status`

**Step 2: Run the test and watch it fail**

Run: `pnpm vitest run tests/unit/init.test.ts`
Expected: FAIL because init still reflects old readiness semantics.

**Step 3: Write the minimal implementation**

Update implementation and docs so they:
- compute background readiness from runtime `first` assets
- emit `background_input_status`
- explain degraded startup behavior

**Step 4: Run the test and watch it pass**

Run: `pnpm vitest run tests/unit/init.test.ts`
Expected: PASS.

### Task 3: `13-orchestrate` understands background strength

**Files:**
- Modify: `src/core/skill-runtime/orchestrate-args.ts`
- Modify: `skills/spec-first/13-orchestrate/SKILL.md`
- Modify: `skills/spec-first/13-orchestrate/references/orchestration-rules.md`
- Modify: `skills/spec-first/13-orchestrate/references/skill-mapping.md`
- Test: `tests/unit/orchestrate-args-parser.test.ts`

**Step 1: Write the failing test**

Assert:
- orchestrate recognizes `full / degraded / blind`
- orchestrate recognizes `L1 / L2 / L3`

**Step 2: Run the test and watch it fail**

Run: `pnpm vitest run tests/unit/orchestrate-args-parser.test.ts`
Expected: FAIL because background governance rules are not encoded yet.

**Step 3: Write the minimal implementation**

Update implementation and docs so they:
- expose the new background status / dependency vocabulary
- provide degraded-path recommendations

**Step 4: Run the test and watch it pass**

Run: `pnpm vitest run tests/unit/orchestrate-args-parser.test.ts`
Expected: PASS.

