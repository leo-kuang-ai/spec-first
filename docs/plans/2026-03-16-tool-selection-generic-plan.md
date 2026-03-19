# Tool Selection Generic Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复 `generic` 宿主在 `code-analysis` 场景错误返回 `serena` 的问题，并补齐关键测试覆盖。

**Architecture:** 保持现有 `tool-selection` 结构不做重构，只做最小行为修复：让 `code-analysis` 与 `external-research` 一样基于注册表过滤宿主支持情况。测试侧改为覆盖 `host × scenario` 关键组合，先锁定 bug，再验证回归。

**Tech Stack:** TypeScript, Vitest, Node.js ESM

---

### Task 1: 锁定 `generic + code-analysis` 回归

**Files:**
- Modify: `tests/unit/tool-registry.test.ts`
- Test: `tests/unit/tool-registry.test.ts`

**Step 1: Write the failing test**

新增断言：
- `selectToolsForScenario('generic', 'code-analysis')` 的 `primary` 应为空
- `fallback` 应为 `['shell-rg']`

**Step 2: Run test to verify it fails**

Run: `pnpm -s vitest run tests/unit/tool-registry.test.ts`
Expected: FAIL because current implementation still returns `['serena']`

**Step 3: Write minimal implementation**

在 `src/core/tool-integration/tool-selection.ts` 中让 `code-analysis` 使用 `isToolSupported(host, 'serena')` 过滤。

**Step 4: Run test to verify it passes**

Run: `pnpm -s vitest run tests/unit/tool-registry.test.ts`
Expected: PASS

### Task 2: 补充关键组合覆盖

**Files:**
- Modify: `tests/unit/tool-registry.test.ts`
- Test: `tests/unit/tool-registry.test.ts`

**Step 1: Write the failing test**

补充参数化覆盖：
- `codex + code-analysis` 返回 `['serena']`
- `generic + external-research` 返回空 `primary`

**Step 2: Run test to verify expected failure mode**

Run: `pnpm -s vitest run tests/unit/tool-registry.test.ts`
Expected: 如果实现未完全覆盖，出现行为断言失败；若直接通过，则说明测试补充验证的是现有正确行为。

**Step 3: Write minimal implementation**

仅在必要时微调 `tool-selection.ts`，不引入额外抽象。

**Step 4: Run test to verify it passes**

Run: `pnpm -s vitest run tests/unit/tool-registry.test.ts tests/unit/host-adapters.test.ts`
Expected: PASS

### Task 3: 验证关键回归

**Files:**
- Test: `tests/unit/tool-registry.test.ts`
- Test: `tests/unit/host-adapters.test.ts`

**Step 1: Run focused verification**

Run: `pnpm -s vitest run tests/unit/tool-registry.test.ts tests/unit/host-adapters.test.ts`
Expected: PASS

**Step 2: Run broader verification**

Run: `pnpm -s vitest run tests/unit/host-adapter-format.test.ts tests/unit/tool-registry.test.ts tests/unit/host-adapters.test.ts`
Expected: PASS
