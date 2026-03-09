# Shared Contract Coverage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 `spec-first` 的 shared contracts 增加统一 coverage 清单与数据驱动测试，降低新增 consumer 时的漏测与漂移风险。

**Architecture:** 新增一个最小 TS registry 作为共享 contract 覆盖面的测试总账，再新增一份数据驱动测试遍历 registry。保留现有 contract tests 与 skill-docs tests，不做大规模迁移，只增加“总账层”。

**Tech Stack:** Vitest, TypeScript, Markdown skill docs

---

### Task 1: Add the failing coverage registry test

**Files:**
- Create: `tests/unit/shared-contract-coverage.data.ts`
- Create: `tests/unit/shared-contract-coverage.test.ts`

**Step 1: Write the registry skeleton**

- 定义 `SharedContractCoverageItem`
- 定义 `SHARED_CONTRACT_COVERAGE`
- 先录入：
  - background-quality contract 的已完成 consumer
  - orchestration-governance contract 的 `11-plan` / `13-orchestrate`

**Step 2: Write the failing test**

测试至少验证：
- contract 文件存在
- target 文件存在
- target 文件包含 contract 引用
- target 文件包含 `mustContain` 声明的最小 token

**Step 3: Run the test to verify baseline**

Run:
`pnpm exec vitest run tests/unit/shared-contract-coverage.test.ts`

Expected:
- 若 registry 或 token 不完整则失败

### Task 2: Align the registry with current contracts

**Files:**
- Modify: `tests/unit/shared-contract-coverage.data.ts`

**Step 1: Add background-quality coverage items**

至少包含：
- `01-init`
- `03-spec`
- `04-design`
- `06-task`
- `07-code`
- `08-review`
- `11-plan`
- `12-verify`
- `14-status`
- `15-doctor`
- `21-analyze`
- `02-catchup`

**Step 2: Add orchestration-governance coverage items**

包含：
- `11-plan`
- `13-orchestrate`

**Step 3: Keep the registry minimal**

- 只记录最小 token
- 不复制完整模板内容
- 不把 runtime 行为断言塞进 registry

### Task 3: Validate against existing tests

**Files:**
- Test: `tests/unit/background-quality-contract.test.ts`
- Test: `tests/unit/orchestration-governance-contract.test.ts`
- Test: relevant `*-skill-docs.test.ts`

**Step 1: Run focused contract tests**

Run:
`pnpm exec vitest run tests/unit/shared-contract-coverage.test.ts tests/unit/background-quality-contract.test.ts tests/unit/orchestration-governance-contract.test.ts`

Expected:
- 全部通过

**Step 2: Run adjacent skill-docs tests**

Run:
`pnpm exec vitest run tests/unit/plan-skill-docs.test.ts tests/unit/orchestrate-skill-docs.test.ts tests/unit/spec-skill-docs.test.ts tests/unit/design-skill-docs.test.ts tests/unit/code-skill-docs.test.ts tests/unit/task-skill-docs.test.ts tests/unit/doctor-skill-docs.test.ts tests/unit/catchup-skill-docs.test.ts`

Expected:
- 全部通过

### Task 4: Run full validation

**Files:**
- Test: `pnpm test`

**Step 1: Run full suite**

Run:
`pnpm test`

Expected:
- 全量通过
- coverage 清单与局部专项测试不冲突

### Task 5: Optional cleanup after stabilization

**Files:**
- Modify: `tests/unit/background-quality-contract.test.ts` (optional)

**Step 1: Identify duplicated pure-coverage assertions**

- 只挑“纯覆盖型、无额外语义”的断言
- 复杂语义断言仍保留在原测试中

**Step 2: Decide whether to slim existing contract tests**

- 若收益不明显，则不做
- 坚持 YAGNI
