# First-Skill Legacy Index Retirement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 `first-skill` 的主链彻底收敛到 runtime 真源，显式隔离并最终移除 `.index.yaml` / `docs/first` 兼容路径。

**Architecture:** 当前主链已经以 `.spec-first/runtime/first/` 为真源，但 `first-resume.ts`、`first-change-detector.ts` 仍保留 legacy fallback。最佳实践不是把 YAML 与 JSON 两套 schema 合并，而是先把 legacy 逻辑显式下沉为 compatibility 层，再逐步缩小调用面，最后删除旧模块，避免“新旧混用”继续扩散。

**Tech Stack:** TypeScript, Vitest, Node.js ESM, Serena symbolic edits, spec-first runtime modules.

---

### Task 1: 冻结迁移边界并补事实测试

**Files:**
- Modify: `tests/unit/first-resume.test.ts`
- Modify: `tests/unit/first-change-detector.test.ts`
- Modify: `tests/unit/dispatcher-first-runtime.test.ts`
- Reference: `src/core/skill-runtime/dispatcher.ts:470`
- Reference: `src/core/skill-runtime/first-resume.ts:103`
- Reference: `src/core/skill-runtime/first-change-detector.ts:351`

**Step 1: 写失败测试，锁定当前主链走 runtime 真源**
- 为 `generateResumeRecommendation()` 增加断言：当输入为 `getFirstRuntimeDir(projectRoot)` 时，只消费 runtime 资产，不依赖 `.index.yaml`。
- 为 `formatProductSummary()` 增加断言：runtime 分支展示 `summary/roleViews/stageViews`，不回退到 legacy 概念。
- 为 `checkFirstUpdateContext()` 增加断言：默认路径为 `.spec-first/runtime/first`，legacy 仅在显式传入非 runtime 路径时触发。

**Step 2: 运行测试确认 RED**
Run: `CI=1 pnpm vitest run tests/unit/first-resume.test.ts tests/unit/first-change-detector.test.ts tests/unit/dispatcher-first-runtime.test.ts`
Expected: 与 legacy fallback 语义相关的新增断言先失败或暴露混用点。

**Step 3: 做最小修复或断言校准**
- 仅调整测试和极小量辅助逻辑，确保“主链=runtime、fallback=显式 legacy”成为可验证事实。

**Step 4: 再跑测试确认 GREEN**
Run: `CI=1 pnpm vitest run tests/unit/first-resume.test.ts tests/unit/first-change-detector.test.ts tests/unit/dispatcher-first-runtime.test.ts`
Expected: PASS

**Step 5: 提交**
```bash
git add tests/unit/first-resume.test.ts tests/unit/first-change-detector.test.ts tests/unit/dispatcher-first-runtime.test.ts
git commit -m "test(first): lock runtime-vs-legacy boundary"
```

### Task 2: 显式拆出 compatibility 层

**Files:**
- Create: `src/core/skill-runtime/first-legacy-index.ts`
- Modify: `src/core/skill-runtime/first-index.ts`
- Modify: `src/core/skill-runtime/first-resume.ts`
- Modify: `src/core/skill-runtime/first-change-detector.ts`
- Test: `tests/unit/first-index.test.ts`
- Test: `tests/unit/first-resume.test.ts`
- Test: `tests/unit/first-change-detector.test.ts`

**Step 1: 写失败测试，要求 legacy 名称与职责显式化**
- 新增断言：`first-resume.ts`、`first-change-detector.ts` 不再直接操作 legacy schema 细节，而是调用 compatibility helper。
- 新增断言：`first-index.ts` 对外仅作为 deprecated shim，或直接转发到 `first-legacy-index.ts`。

**Step 2: 运行测试确认 RED**
Run: `CI=1 pnpm vitest run tests/unit/first-index.test.ts tests/unit/first-resume.test.ts tests/unit/first-change-detector.test.ts`
Expected: FAIL，提示仍有直接耦合。

**Step 3: 最小实现**
- 将 `ProductIndex` / `readIndex` / `writeIndex` / `createIndex` / `syncIndex` 等迁入 `first-legacy-index.ts`。
- `first-index.ts` 改为显式 deprecated shim：
  - 顶部注释标明 legacy-only
  - 仅 re-export legacy API，避免新调用误判为当前真源模块
- 在 `first-resume.ts` / `first-change-detector.ts` 中把 legacy 逻辑集中到独立 helper：
  - `buildLegacyResumeRecommendation(...)`
  - `formatLegacyProductSummary(...)`
  - `checkLegacyFirstUpdateContext(...)`
- runtime 分支保持在主函数顶部，legacy 分支下沉到底部 compatibility helper。

**Step 4: 运行测试确认 GREEN**
Run: `CI=1 pnpm vitest run tests/unit/first-index.test.ts tests/unit/first-resume.test.ts tests/unit/first-change-detector.test.ts`
Expected: PASS

**Step 5: 提交**
```bash
git add src/core/skill-runtime/first-legacy-index.ts src/core/skill-runtime/first-index.ts src/core/skill-runtime/first-resume.ts src/core/skill-runtime/first-change-detector.ts tests/unit/first-index.test.ts tests/unit/first-resume.test.ts tests/unit/first-change-detector.test.ts
git commit -m "refactor(first): isolate legacy first index compatibility"
```

### Task 3: 收紧主链 API，避免 accidental fallback

**Files:**
- Modify: `src/core/skill-runtime/first-resume.ts`
- Modify: `src/core/skill-runtime/first-change-detector.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Modify: `src/core/skill-runtime/first-context.ts`
- Test: `tests/unit/first-resume.test.ts`
- Test: `tests/unit/first-change-detector.test.ts`
- Test: `tests/unit/dispatcher-first-runtime.test.ts`

**Step 1: 写失败测试，要求 runtime/legacy 输入显式区分**
- 给 `generateResumeRecommendation()` / `formatProductSummary()` / `checkFirstUpdateContext()` 增加更清晰的输入约束测试：
  - runtime 路径 => 只走 runtime helper
  - 显式 `docs/first` 路径 => 才允许 legacy helper
- 禁止“因为目录名字符串碰巧匹配而误回退”。

**Step 2: 运行测试确认 RED**
Run: `CI=1 pnpm vitest run tests/unit/first-resume.test.ts tests/unit/first-change-detector.test.ts tests/unit/dispatcher-first-runtime.test.ts`
Expected: FAIL，暴露仍然隐式混合的入口。

**Step 3: 最小实现**
推荐两种实现里选一种，优先 A：
- A. 引入显式 helper 分发：
  - `isRuntimeFirstDir(...)`
  - `isLegacyFirstDir(...)`
  - 只有命中 legacy 条件才走 compatibility helper
- B. 将对外 API 改为判别参数：
  - `source: 'runtime' | 'legacy'`
  - 但这会扩大改动面，放在第二选择

**Step 4: 运行测试确认 GREEN**
Run: `CI=1 pnpm vitest run tests/unit/first-resume.test.ts tests/unit/first-change-detector.test.ts tests/unit/dispatcher-first-runtime.test.ts`
Expected: PASS

**Step 5: 提交**
```bash
git add src/core/skill-runtime/first-resume.ts src/core/skill-runtime/first-change-detector.ts src/core/skill-runtime/dispatcher.ts src/core/skill-runtime/first-context.ts tests/unit/first-resume.test.ts tests/unit/first-change-detector.test.ts tests/unit/dispatcher-first-runtime.test.ts
git commit -m "refactor(first): make runtime and legacy paths explicit"
```

### Task 4: 处理死代码与误导性注释

**Files:**
- Modify: `src/core/skill-runtime/first-legacy-index.ts`
- Modify: `src/core/skill-runtime/first-index.ts`
- Test: `tests/unit/first-index.test.ts`

**Step 1: 写失败测试，锁定不再允许无用入口继续漂移**
- 对 `syncIndex()` 做二选一决策测试：
  - 要么删除该 API
  - 要么显式抛出 `not supported / legacy only`
- 新增断言：legacy shim 注释、导出名、职责都指向 compatibility，而不是当前真源索引。

**Step 2: 运行测试确认 RED**
Run: `CI=1 pnpm vitest run tests/unit/first-index.test.ts`
Expected: FAIL

**Step 3: 最小实现**
推荐：
- 直接删除 `syncIndex()`；若考虑兼容，则保留但抛出明确异常，并在注释中说明不再维护。
- 清理所有“扫描 docs/first 即当前主链”的注释，改成“legacy compatibility only”。

**Step 4: 运行测试确认 GREEN**
Run: `CI=1 pnpm vitest run tests/unit/first-index.test.ts`
Expected: PASS

**Step 5: 提交**
```bash
git add src/core/skill-runtime/first-legacy-index.ts src/core/skill-runtime/first-index.ts tests/unit/first-index.test.ts
git commit -m "chore(first): remove dead legacy index paths"
```

### Task 5: 评估并执行最终删除

**Files:**
- Modify: `src/core/skill-runtime/first-resume.ts`
- Modify: `src/core/skill-runtime/first-change-detector.ts`
- Delete: `src/core/skill-runtime/first-index.ts` 或保留极薄 shim
- Delete/Modify: `tests/unit/first-index.test.ts`
- Modify: `CHANGELOG.md`

**Step 1: 先做引用扫描**
Run: `rg -n "first-index|readIndex\(|writeIndex\(|createIndex\(|syncIndex\(" src tests/unit`
Expected: 只剩 compatibility 层或测试引用。

**Step 2: 写失败测试，要求生产代码完全不再直接依赖 legacy 模块**
- 生产代码引用应为 0
- 若保留 shim，则仅用于过渡导出，不含业务逻辑

**Step 3: 最小实现**
- 如果生产引用为 0：删除 `first-index.ts`，将测试迁移为 `first-legacy-index.test.ts`
- 如果还需兼容：保留 1 个薄 shim 文件，但在文件头注明删除时间窗和迁移目标

**Step 4: 运行回归**
Run: `CI=1 pnpm vitest run tests/unit/first-*.test.ts tests/unit/dispatcher-first-runtime.test.ts tests/unit/init-runtime-readiness.test.ts tests/unit/skill-runtime.test.ts`
Expected: PASS

**Step 5: 运行类型检查和全量测试**
Run: `CI=1 pnpm typecheck`
Expected: PASS

Run: `CI=1 pnpm test`
Expected: PASS

**Step 6: 更新变更记录并提交**
```bash
git add CHANGELOG.md src/core/skill-runtime tests/unit
git commit -m "refactor(first): retire legacy first index path"
```

### Task 6: 文档收口

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`
- Modify: `skills/spec-first/01-init/SKILL.md`
- Modify: `skills/spec-first/README.md`
- Modify: `docs/plans/2026-03-08-first-skill-legacy-retirement.md`

**Step 1: 文档核对**
- 校验所有提到索引的地方都明确：当前真源是 `.spec-first/runtime/first/index.json`
- 如果仍保留 legacy compatibility，必须明确标注“仅兼容层，不是主链”

**Step 2: 运行文档相关测试**
Run: `CI=1 pnpm vitest run tests/unit/first-skill-docs.test.ts tests/unit/cli-init-stage.test.ts`
Expected: PASS

**Step 3: 提交**
```bash
git add skills/spec-first/00-first/SKILL.md skills/spec-first/01-init/SKILL.md skills/spec-first/README.md docs/plans/2026-03-08-first-skill-legacy-retirement.md
git commit -m "docs(first): align runtime truth-source documentation"
```
