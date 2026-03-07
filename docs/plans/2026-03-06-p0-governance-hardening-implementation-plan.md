# P0 Governance Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 用无兼容策略完成 P0 流程治理加固，移除 `--force` 推进能力、将 hard-gate 变成真实阻断、统一矩阵状态语义。

**Architecture:** 修改分三块：阶段推进 API/CLI、Skill runtime hard-gate、traceability matrix 状态解析与 Gate 终态判断。每块都先写失败测试，再做最小实现。

**Tech Stack:** Node.js 20, TypeScript, Vitest

---

### Task 1: 移除 `stage advance --force`

**Files:**
- Modify: `src/core/process-engine/advance.ts`
- Modify: `src/cli/commands/stage.ts`
- Test: `tests/unit/advance.test.ts`
- Test: `tests/unit/cli-init-stage.test.ts`
- Test: `tests/e2e/core-flow.test.ts`
- Test: `tests/e2e/error-paths.test.ts`

**Step 1: Write the failing test**

- 把 `advance.test.ts` 中 `should advance with --force` 改为“传入 force 选项应被忽略/拒绝”
- 在 `cli-init-stage.test.ts` 中新增：`handleStage(['advance', fid, '--force'])` 返回 `VALIDATION_ERROR`

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/advance.test.ts tests/unit/cli-init-stage.test.ts`
Expected: FAIL，因为当前实现仍支持 `--force`

**Step 3: Write minimal implementation**

- 删除 `AdvanceOptions.force`
- 删除 `advance()` 中 `FORCE_SKIPPED` 分支
- CLI 检测到 `--force` 时报用法错误

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/advance.test.ts tests/unit/cli-init-stage.test.ts`
Expected: PASS

### Task 2: 将 hard-gate 改成真实阻断

**Files:**
- Modify: `src/core/skill-runtime/hard-gate.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Test: `tests/unit/skill-runtime.test.ts`
- Test: `tests/unit/hard-gate.test.ts`

**Step 1: Write the failing test**

- 新增：`loadSkill()` 在 `code` 前置条件缺失时抛错
- 新增：`loadSkill()` 在 `code-review` 阶段不匹配时抛错

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/skill-runtime.test.ts tests/unit/hard-gate.test.ts`
Expected: FAIL，因为当前只注入 BLOCKED notice

**Step 3: Write minimal implementation**

- 扩展 `HARD_GATE_STAGE_REQUIREMENTS`
- 新增 hard-gate 错误类型
- `loadSkill()` 在 `BLOCKED` 时直接抛错；`WARN/PASS` 继续注入提示

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/skill-runtime.test.ts tests/unit/hard-gate.test.ts`
Expected: PASS

### Task 3: 严格化矩阵状态

**Files:**
- Modify: `src/core/trace-engine/matrix.ts`
- Modify: `src/core/gate-engine/gate-evaluator.ts`
- Test: `tests/unit/matrix.test.ts`
- Test: `tests/unit/gate-evaluator.test.ts`

**Step 1: Write the failing test**

- 新增：矩阵行状态为 `done` 时 `parseMatrix()` 抛错
- 新增：`06_wrap_up` 只在 `Accepted/Cancelled/Exception` 下通过

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/matrix.test.ts tests/unit/gate-evaluator.test.ts`
Expected: FAIL，因为当前会接受 `done`

**Step 3: Write minimal implementation**

- 增加 `MatrixStatus` 运行时校验
- `G-WRAP-02` 删除 `done`

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/matrix.test.ts tests/unit/gate-evaluator.test.ts`
Expected: PASS

### Task 4: 聚焦回归验证

**Files:**
- Read: `docs/04-审查报告/2026-03-06-架构与流程多agent审查报告.md`

**Step 1: Run focused verification**

Run: `npx vitest run tests/unit/advance.test.ts tests/unit/cli-init-stage.test.ts tests/unit/skill-runtime.test.ts tests/unit/hard-gate.test.ts tests/unit/matrix.test.ts tests/unit/gate-evaluator.test.ts tests/unit/coverage.test.ts tests/unit/trace-context.test.ts tests/unit/trace-ratio.test.ts`
Expected: PASS

**Step 2: Commit**

```bash
git add src/core/process-engine/advance.ts src/cli/commands/stage.ts src/core/skill-runtime/hard-gate.ts src/core/skill-runtime/dispatcher.ts src/core/trace-engine/matrix.ts src/core/gate-engine/gate-evaluator.ts tests/unit/advance.test.ts tests/unit/cli-init-stage.test.ts tests/unit/skill-runtime.test.ts tests/unit/hard-gate.test.ts tests/unit/matrix.test.ts tests/unit/gate-evaluator.test.ts docs/plans/2026-03-06-p0-governance-hardening-design.md docs/plans/2026-03-06-p0-governance-hardening-implementation-plan.md
git commit -m "fix: harden process governance and state semantics"
```
