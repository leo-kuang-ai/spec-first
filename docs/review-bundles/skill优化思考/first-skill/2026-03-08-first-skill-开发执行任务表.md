# First Skill Producer 分层维护 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在当前仓库中把 `00-first` 建立为可长期维护的 producer：结构化真源维护在 `.spec-first/runtime/first/`，人类可读文档维护在 `docs/first/`，并默认采用增量更新而不是每次全量重生成。

**Architecture:** `.spec-first/runtime/first/` 作为机器真源层，`docs/first/` 作为投影视图层。`first-index.ts`、`first-resume.ts`、`first-change-detector.ts`、`first-artifact-mapping.ts` 共同承担“变更检测 -> 真源刷新 -> docs 投影刷新”的链路。下游流程只读取 runtime 真源，不直接解析 `docs/first/*.md`。

**Tech Stack:** TypeScript、Node.js、Vitest、Spec-First Skill Docs

**Repo Facts:** 当前仓库已存在 `src/core/skill-runtime/first-index.ts`、`first-resume.ts`、`first-artifact-mapping.ts`、`first-change-detector.ts`、`dispatcher.ts`，以及 `src/cli/commands/init.ts`；其中 `dispatcher.ts`、`init.ts`、`01-init` 文档仍把 `docs/first` 当主真相来源。尚不存在 `first-summary.ts`、`first-role-views.ts`、`first-stage-views.ts`、`first-context.ts`、`first-doc-projection.ts`。本计划不处理 downstream consumer 接入，但会处理所有主链 truth-source 入口的切换。

---

### Task 1: 新建 first runtime 类型与存储层

**Files:**
- Create: `src/core/skill-runtime/first-runtime-types.ts`
- Create: `src/core/skill-runtime/first-runtime-store.ts`
- Test: `tests/unit/first-runtime-types.test.ts`
- Test: `tests/unit/first-runtime-store.test.ts`

**Step 1: Write the failing tests**

在 `tests/unit/first-runtime-types.test.ts` 中断言：
- `FirstRuntimeIndex`、`FirstRuntimeSummary`、`FirstRoleViews`、`FirstStageViews` 存在
- `FirstSpecView`、`FirstDesignView`、`FirstCodeView`、`FirstVerifyView` 存在

在 `tests/unit/first-runtime-store.test.ts` 中断言：
- `.spec-first/runtime/first/` 路径函数存在
- `read/write` 四类 runtime 资产的 API 存在

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/first-runtime-types.test.ts tests/unit/first-runtime-store.test.ts`
Expected: FAIL with missing modules or missing exports

**Step 3: Write minimal implementation**

- 在 `src/core/skill-runtime/first-runtime-types.ts` 中定义全部 runtime 类型
- 在 `src/core/skill-runtime/first-runtime-store.ts` 中实现路径与读写 API

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/first-runtime-types.test.ts tests/unit/first-runtime-store.test.ts`
Expected: PASS

---

### Task 2: 新建 summary / role-views / stage-views 生成器

**Files:**
- Create: `src/core/skill-runtime/first-summary.ts`
- Create: `src/core/skill-runtime/first-role-views.ts`
- Create: `src/core/skill-runtime/first-stage-views.ts`
- Test: `tests/unit/first-summary.test.ts`
- Test: `tests/unit/first-role-views.test.ts`
- Test: `tests/unit/first-stage-views.test.ts`

**Step 1: Write the failing tests**

在测试中断言：
- `buildFirstSummary()` 返回统一摘要结构
- `buildRoleViews(summary)` 能生成角色视图
- `buildStageViews(summary)` 能生成 `spec/design/code/verify` 四类视图

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/first-summary.test.ts tests/unit/first-role-views.test.ts tests/unit/first-stage-views.test.ts`
Expected: FAIL with missing builder modules

**Step 3: Write minimal implementation**

- 在 `first-summary.ts` 中建立 summary builder
- 在 `first-role-views.ts` 中建立 role view builder
- 在 `first-stage-views.ts` 中建立 stage view builder

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/first-summary.test.ts tests/unit/first-role-views.test.ts tests/unit/first-stage-views.test.ts`
Expected: PASS

---

### Task 3: 新建 unified first context 读取入口

**Files:**
- Create: `src/core/skill-runtime/first-context.ts`
- Test: `tests/unit/first-context.test.ts`
- Test: `tests/unit/first-context-stage-views.test.ts`

**Step 1: Write the failing tests**

在测试中断言：
- `loadFirstContext(projectRoot)` 同时返回 `index/summary/roleViews/stageViews`
- `loadStageView(projectRoot, stage)` 可返回单阶段视图
- `loadFirstRoleView(projectRoot, role)` 可返回单角色视图

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/first-context.test.ts tests/unit/first-context-stage-views.test.ts`
Expected: FAIL with missing context module

**Step 3: Write minimal implementation**

在 `src/core/skill-runtime/first-context.ts` 中实现：
- `loadFirstContext(projectRoot)`
- `loadStageView(projectRoot, stage)`
- `loadFirstRoleView(projectRoot, role)`

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/first-context.test.ts tests/unit/first-context-stage-views.test.ts`
Expected: PASS

---

### Task 4: 建立 docs 投影视图刷新链路

**Files:**
- Create: `src/core/skill-runtime/first-doc-projection.ts`
- Modify: `src/core/skill-runtime/first-artifact-mapping.ts`
- Modify: `src/core/skill-runtime/first-change-detector.ts`
- Test: `tests/unit/first-artifact-mapping.test.ts`
- Test: `tests/unit/first-change-detector.test.ts`

**Step 1: Write the failing tests**

在测试中断言：
- runtime 真源与 docs 投影视图的映射关系存在
- 变更检测可区分“只刷新 runtime”与“需要刷新 docs”

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/first-artifact-mapping.test.ts tests/unit/first-change-detector.test.ts`
Expected: FAIL with missing projection mapping or stale assumptions

**Step 3: Write minimal implementation**

- 在 `first-doc-projection.ts` 中建立 runtime -> docs 的投影刷新逻辑
- 在 `first-artifact-mapping.ts` 中区分 runtime artifacts 与 docs projections
- 在 `first-change-detector.ts` 中加入局部刷新判断

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/first-artifact-mapping.test.ts tests/unit/first-change-detector.test.ts`
Expected: PASS

---

### Task 5: 收口主链 truth-source 入口

**Files:**
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Modify: `src/core/skill-runtime/first-index.ts`
- Modify: `src/core/skill-runtime/first-resume.ts`
- Modify: `src/core/skill-runtime/first-change-detector.ts`
- Modify: `src/cli/commands/init.ts`
- Modify: `skills/spec-first/01-init/SKILL.md`
- Modify: `skills/spec-first/01-init/references/prerequisites.md`
- Modify: `skills/spec-first/01-init/references/output-format.md`
- Test: `tests/unit/first-index.test.ts`
- Test: `tests/unit/first-resume.test.ts`
- Test: `tests/unit/first-change-detector.test.ts`
- Test: `tests/unit/init.test.ts`
- Test: `tests/unit/first-skill-docs.test.ts`
- Test: `tests/unit/dispatcher-first-runtime.test.ts`

**Step 1: Write the failing tests**

在测试中断言：
- `dispatcher.ts` 中 first runtime notice 基于 runtime 真源，而不是 `docs/first`
- `init` readiness 基于 `.spec-first/runtime/first/index.json` 与 runtime 真源层，而不是 `docs/first/.index.yaml`
- `01-init` skill 文档不再把 `docs/first/.index.yaml` 当强制前置真相
- `first-change-detector.ts` 默认目录不再是 `docs/first`
- `first-index.ts` / `first-resume.ts` 的恢复真相来自 runtime 真源
- docs 投影视图的刷新状态不等于真源索引真相

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/first-index.test.ts tests/unit/first-resume.test.ts tests/unit/first-change-detector.test.ts tests/unit/init.test.ts tests/unit/first-skill-docs.test.ts tests/unit/dispatcher-first-runtime.test.ts`
Expected: FAIL with stale path or stale assumptions

**Step 3: Write minimal implementation**

- 在 `dispatcher.ts` 中取消 `join(projectRoot, 'docs', 'first')` 作为主入口
- 在 `first-change-detector.ts` 中取消 `docs/first` 作为默认真源目录
- 在 `init.ts` 中把 readiness 判定切到 runtime 真源层
- 在 `01-init` 文档中同步新的 readiness 真相
- 在 `first-index.ts` 中切到 JSON runtime 索引
- 在 `first-resume.ts` 中以 runtime 真源为恢复依据
- 保留 docs 层为可投影刷新产物，而不是恢复真相来源

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/first-index.test.ts tests/unit/first-resume.test.ts tests/unit/first-change-detector.test.ts tests/unit/init.test.ts tests/unit/first-skill-docs.test.ts tests/unit/dispatcher-first-runtime.test.ts`
Expected: PASS

---

### Task 6: 更新 `00-first` 与 `01-init` 文档真相

**Files:**
- Modify: `skills/spec-first/00-first/SKILL.md`
- Modify: `skills/spec-first/00-first/references/testing-strategy.md`
- Modify: `skills/spec-first/01-init/SKILL.md`
- Modify: `skills/spec-first/01-init/references/prerequisites.md`
- Modify: `skills/spec-first/01-init/references/output-format.md`
- Modify: `docs/first/README.md`
- Test: `tests/unit/first-skill-docs.test.ts`
- Test: `tests/unit/init.test.ts`

**Step 1: Write the failing test**

在 `tests/unit/first-skill-docs.test.ts` 中断言：
- 文档明确声明 runtime 真源层与 docs 投影视图层
- 文档明确声明 `docs/first/*.md` 为长期维护的可读投影
- 文档不再把 `docs/first/.index.yaml` 作为主索引真源
- `01-init` 文档不再把旧索引和 quick 文档当 readiness 真相
- 文档不再默认每次全量重生成

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/unit/first-skill-docs.test.ts tests/unit/init.test.ts`
Expected: FAIL with outdated documentation

**Step 3: Update docs**

- 在 `skills/spec-first/00-first/SKILL.md` 中更新产物清单、执行流程、成功标准
- 在 `skills/spec-first/01-init/SKILL.md` 与 references 中更新 readiness 真相
- 在 `testing-strategy.md` 中增加 runtime 真源与 docs 投影测试口径
- 在 `docs/first/README.md` 中明确投影视图定位

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/unit/first-skill-docs.test.ts tests/unit/init.test.ts`
Expected: PASS

---

### Task 7: 支持三类刷新模式

**Files:**
- Modify: `src/core/skill-runtime/first-context.ts`
- Modify: `src/core/skill-runtime/first-doc-projection.ts`
- Modify: `skills/spec-first/00-first/SKILL.md`
- Test: `tests/unit/first-context-stage-views.test.ts`
- Test: `tests/unit/first-skill-docs.test.ts`

**Step 1: Write the failing tests**

在测试中断言：
- 存在 `refresh-runtime-only`
- 存在 `refresh-docs-from-runtime`
- 存在 `refresh-all`

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run tests/unit/first-context-stage-views.test.ts tests/unit/first-skill-docs.test.ts`
Expected: FAIL with missing refresh modes

**Step 3: Write minimal implementation**

- 在接口层暴露三类刷新模式
- 在 skill 文档中明确三类刷新模式含义

**Step 4: Run tests to verify they pass**

Run: `pnpm vitest run tests/unit/first-context-stage-views.test.ts tests/unit/first-skill-docs.test.ts`
Expected: PASS

---

### Task 8: 执行首轮 producer 回归

**Files:**
- Modify: `src/core/skill-runtime/`
- Modify: `skills/spec-first/00-first/`
- Modify: `docs/first/`
- Test: `tests/unit/first-*.test.ts`
- Test: `tests/unit/first-context-stage-views.test.ts`

**Step 1: Run targeted regression**

Run: `pnpm vitest run tests/unit/first-*.test.ts tests/unit/first-context-stage-views.test.ts`
Expected: PASS

**Step 2: Run broader regression**

Run: `pnpm test`
Expected: PASS

---

## Suggested Execution Order

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5
6. Task 6
7. Task 7
8. Task 8

## Definition of Done

- `.spec-first/runtime/first/index.json` 成为下游主链消费的真索引
- `summary`、`role-views`、`stage-views` 均可稳定生成
- `docs/first/*.md` 保留为长期维护的可读投影视图
- `loadFirstContext(projectRoot)` 与 `loadStageView(projectRoot, stage)` 可用
- 存在 docs 投影视图刷新链路
- `dispatcher` / `resume` / `init readiness` / `change-detector` 已不再把 `docs/first` 当主真相
- 默认支持增量更新，而不是只支持全量重生成
- 旧的 `docs/first/.index.yaml` 不再承担主链 runtime 职责
- 本轮没有越界到 downstream consumer 接入
