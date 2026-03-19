# Orchestration Governance Contract Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 `11-plan` 与 `13-orchestrate` 增加共享治理信号 contract 与共享测试，防止 `dependencyStrength / riskCategory / riskSignals` 及其展示层投影继续漂移。

**Architecture:** 保持 runtime 实现不变，仅把当前稳定语义抽成 `shared/orchestration-governance-contract.md`。`11-plan` 明确承接 camelCase 输入层治理字段，`13-orchestrate` 明确承接 snake_case 展示层治理字段，测试先行验证边界，再补文档引用。

**Tech Stack:** Markdown skills docs, Vitest, TypeScript runtime references

---

### Task 1: Add failing contract tests

**Files:**
- Create: `tests/unit/orchestration-governance-contract.test.ts`
- Modify: `tests/unit/plan-skill-docs.test.ts`
- Create: `tests/unit/orchestrate-skill-docs.test.ts`

**Step 1: Write the failing tests**

- 断言 `skills/spec-first/shared/orchestration-governance-contract.md` 存在
- 断言 contract 包含：
  - `dependency_strength`
  - `risk_category`
  - `risk_signals`
  - `recommended_action`
  - `L1 / L2 / L3`
  - `formal-design-review`
  - `high-risk-implementation`
  - `pre-release-verification`
- 断言 `skills/spec-first/11-plan/SKILL.md` 引用新 contract，并声明：
  - `dependencyStrength`
  - `riskCategory`
  - `riskSignals`
  - `输入层`
- 断言 `skills/spec-first/13-orchestrate/SKILL.md` 引用新 contract，并声明：
  - `background_status`
  - `dependency_strength`
  - `risk_category`
  - `risk_signals`
  - `recommended_action`
  - `展示层`

**Step 2: Run tests to verify they fail**

Run:
`pnpm exec vitest run tests/unit/orchestration-governance-contract.test.ts tests/unit/plan-skill-docs.test.ts tests/unit/orchestrate-skill-docs.test.ts`

Expected:
- 新测试失败
- 失败原因是 contract 文件尚不存在、skill 文档尚未引用新 contract

### Task 2: Add minimal shared contract doc

**Files:**
- Create: `skills/spec-first/shared/orchestration-governance-contract.md`

**Step 1: Write the minimal contract**

内容只包含：
- Purpose
- Scope
- Naming layers
- Enums
- Minimal semantics
- Non-goals

**Step 2: Keep scope narrow**

- 不复制 `background-quality-contract.md` 的完整内容
- 只描述编排治理信号
- 明确 `backgroundInputStatus` 仍属于原 contract

### Task 3: Patch plan/orchestrate docs

**Files:**
- Modify: `skills/spec-first/11-plan/SKILL.md`
- Modify: `skills/spec-first/13-orchestrate/SKILL.md`

**Step 1: Patch `11-plan`**

- 在治理字段附近增加对 `../shared/orchestration-governance-contract.md` 的引用
- 明确 `dependencyStrength / riskCategory / riskSignals` 属于输入层治理信号
- 保持 `backgroundInputStatus` 继续由 `background-quality-contract.md` 负责

**Step 2: Patch `13-orchestrate`**

- 在“背景治理口径”附近增加对 `../shared/orchestration-governance-contract.md` 的引用
- 明确展示层使用：
  - `background_status`
  - `dependency_strength`
  - `risk_category`
  - `risk_signals`
  - `recommended_action`
- 明确 orchestrate 只是投影已有治理信号，不在文档层创造新的风险语义

### Task 4: Run focused validation

**Files:**
- Test: `tests/unit/orchestration-governance-contract.test.ts`
- Test: `tests/unit/plan-skill-docs.test.ts`
- Test: `tests/unit/orchestrate-skill-docs.test.ts`

**Step 1: Run focused tests**

Run:
`pnpm exec vitest run tests/unit/orchestration-governance-contract.test.ts tests/unit/plan-skill-docs.test.ts tests/unit/orchestrate-skill-docs.test.ts`

Expected:
- 全部通过

**Step 2: Run adjacent safety checks**

Run:
`pnpm exec vitest run tests/unit/orchestrate-args-parser.test.ts tests/unit/dispatcher-first-runtime.test.ts`

Expected:
- 现有 runtime 行为未被扰动

### Task 5: Run full validation

**Files:**
- Test: `pnpm test`

**Step 1: Run full suite**

Run:
`pnpm test`

Expected:
- 全量通过
- 没有新的 contract 漂移
