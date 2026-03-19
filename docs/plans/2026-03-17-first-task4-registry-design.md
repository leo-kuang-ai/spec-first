# First Task 4 Registry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补齐 `first` runtime assets 与 docs projection registry，使正式资产集合、专题文档集合和条件型文档集合在代码中一致可追踪。

**Architecture:** 先在 `first-artifact-mapping.ts` 中定义完整 runtime registry 和 docs 分组常量，再由现有使用方继续消费这些常量。测试先锁定完整 contract，再用最小修改让映射和变更检测入口返回完整集合。

**Tech Stack:** TypeScript, Vitest, Node.js

---

### Task 1: 锁定 Task 4 contract

**Files:**
- Modify: `tests/unit/first-artifact-mapping.test.ts`
- Test: `tests/unit/first-artifact-mapping.test.ts`

**Step 1: Write the failing test**

为以下行为增加断言：
- `FIRST_RUNTIME_ARTIFACTS` 包含 12 个基础资产和 1 个条件型资产
- `FORMAL_TOPIC_PROJECTION_DOCS` 包含 5 个正式专题文档
- `CONDITIONAL_PROJECTION_DOCS` 包含 `docs/first/database-er.md`
- `CANONICAL_PROJECTION_DOCS` 覆盖 22 个正式文档全集

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/first-artifact-mapping.test.ts`
Expected: FAIL，提示缺少 runtime assets 或 docs registry 项

**Step 3: Write minimal implementation**

在 `src/core/skill-runtime/first-artifact-mapping.ts`：
- 扩展 `FIRST_RUNTIME_ARTIFACTS`
- 补齐 `FIRST_RUNTIME_TO_DOCS_PROJECTION_MAP`
- 显式定义 `BASE_PROJECTION_DOCS`、`FORMAL_TOPIC_PROJECTION_DOCS`、`CONDITIONAL_PROJECTION_DOCS`
- 让 `CANONICAL_PROJECTION_DOCS` 成为三类文档的总集合

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/first-artifact-mapping.test.ts`
Expected: PASS

### Task 2: 验证 Task 4 对变更检测入口的影响

**Files:**
- Modify: `tests/unit/first-artifact-mapping.test.ts`
- Modify: `src/core/skill-runtime/first-artifact-mapping.ts`

**Step 1: Write the failing test**

增加断言：
- `matchRuntimeArtifactsByChangedFile('src/core/skill-runtime/first-bootstrap.ts')` 返回完整 runtime assets 集合
- `collectProjectionDocsForChangedFiles(...)` 能返回新增正式文档

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/unit/first-artifact-mapping.test.ts`
Expected: FAIL，新增正式资产或文档未被返回

**Step 3: Write minimal implementation**

只修改 `first-artifact-mapping.ts` 中与 runtime assets 和 docs projection 聚合相关的实现，不提前改 projection renderer。

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/unit/first-artifact-mapping.test.ts`
Expected: PASS

### Task 3: 回归相关消费者

**Files:**
- Test: `tests/unit/first-change-detector.test.ts`
- Test: `tests/unit/first-command.test.ts`

**Step 1: Run focused regression**

Run: `npm test -- tests/unit/first-artifact-mapping.test.ts tests/unit/first-change-detector.test.ts tests/unit/first-command.test.ts`
Expected: 通过或暴露 Task 5/9 依赖缺口

**Step 2: Record outcome**

记录：
- Task 4 是否已独立闭环
- 若回归暴露下游缺口，转入 Task 5 或 Task 9
