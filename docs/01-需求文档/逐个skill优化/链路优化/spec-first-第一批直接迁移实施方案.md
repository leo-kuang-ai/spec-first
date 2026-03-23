# 第一批直接迁移实施方案

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 GSD 的第一批可直接迁移机制落到 `spec-first` 的现有代码和 skill 文档中，先收敛“文件即真相源、主链/旁路分层、需求/阶段/计划/版本分层、摘要/归档分离、临时想法缓冲层”，再用测试锁住当前运行契约。

**Architecture:** 本批以“现有 runtime 为事实基线、文档与 skill 为主要改造面、测试为回归守卫”为原则，不新增持久化 schema，不扩展 `TaskNode` 执行契约，不改 gate 层级命名。代码层已经具备 `gate-taxonomy`、`document-links`、`task-plan/parser`、`defect`、`rfc`、`confirm-policy`、`hard-gate` 的基础能力，因此第一批重点不是造新能力，而是把这批能力的边界、术语和验收命令固定下来。

**Tech Stack:** Markdown、TypeScript、Vitest、pnpm、`rg`、`find`

---

## 0. 当前代码事实

以下实现已经存在，第一批直接迁移不应打破它们：

- `src/core/gate-engine/gate-taxonomy.ts` 已集中定义 `precondition / stage-gate / hard-gate / release-gate / confirm-policy`
- `src/core/document-links.ts` 已按 stage 校验 `spec.md / design.md / task_plan.md`
- `src/core/task-plan/parser.ts` 已把 `task_plan.md` 里的 traces 解析出来，但 `TaskNode` 仍只投影 `relatedFR / relatedDS`
- `src/core/change-mgr/defect.ts` 与 `src/core/change-mgr/rfc.ts` 已对缺陷与 RFC 的关联 ID 做校验
- `src/core/skill-runtime/confirm-policy.ts` 与 `src/core/skill-runtime/hard-gate.ts` 已把门禁与确认策略分开

本批的边界是：

- 不把 `REQ / TASK` 强行塞进 `TaskNode`
- 不改 `stage-state.json`、`gate-history.jsonl` 这类持久化格式
- 不新增 gate 层级或新的状态枚举
- 不把 GSD 的命令海照搬进 `spec-first`

---

## 1. 迁移目标

第一批只迁移 GSD 的 P0 机制：

1. 文件即真相源
2. 主链与旁路分层
3. 需求 / 阶段 / 计划 / 版本分层
4. 摘要与归档分离
5. 临时想法缓冲层

对应到 `spec-first` 的落点是：

- `spec.md` / `design.md` / `task_plan.md` / `findings.md` / `reports/*`
- `Feature -> REQ -> FR -> DS -> TASK -> TC`
- `Defect / RFC / EX` 作为旁路链
- `stage-gate` 作为唯一推进门禁视图

---

## 2. 文件级改造任务

### Task 1: 固定第一批直接迁移的文档入口

**Files:**
- Modify: `docs/01-需求文档/逐个skill优化/链路优化/index.md`
- Modify: `docs/01-需求文档/逐个skill优化/链路优化/spec-first-第一批直接迁移实施方案.md`
- Modify: `docs/01-需求文档/逐个skill优化/链路优化/spec-first-迁移优先级表.md`
- Modify: `docs/01-需求文档/逐个skill优化/链路优化/spec-first-迁移清单.md`
- Modify: `docs/01-需求文档/逐个skill优化/链路优化/spec-first-最小保留流程图.md`
- Modify: `docs/01-需求文档/逐个skill优化/链路优化/GSD流程与ID分析及借鉴.md`

**Step 1: 写清第一批范围**

在 `链路优化/index.md` 里把本方案放到最前面的执行入口，明确：

- 这是一份“第一批直接迁移”的实施方案
- 它优先于借鉴材料
- 它只覆盖 P0 机制，不扩张到全量 ceremony

**Step 2: 统一目录语义**

把 `迁移优先级表`、`迁移清单`、`最小保留流程图`、`GSD 借鉴材料` 的描述统一成同一套词表：

- `文件即真相源`
- `主链与旁路分层`
- `需求 / 阶段 / 计划 / 版本分层`
- `摘要与归档分离`
- `临时想法缓冲层`

**Step 3: 验收**

运行：

```bash
rg -n "第一批直接迁移|文件即真相源|主链与旁路分层|需求 / 阶段 / 计划 / 版本分层|摘要与归档分离|临时想法缓冲层" docs/01-需求文档/逐个skill优化/链路优化
find docs/01-需求文档/逐个skill优化/链路优化 -maxdepth 1 -type f | sort
```

预期：

- 索引中能直接找到本方案
- 目录中不再残留旧英文文件名
- 阅读顺序能区分“事实总图 / 最小保留 / 收敛方案 / GSD 借鉴 / 第一批实施”

---

### Task 2: 统一 `03-spec` 的 P0 词表与边界

**Files:**
- Modify: `skills/spec-first/03-spec/SKILL.md`
- Modify: `skills/spec-first/03-spec/references/phase0-prd-workflow.md`
- Modify: `skills/spec-first/03-spec/references/steps-fr-ac-workflow.md`
- Modify: `skills/spec-first/03-spec/references/id-types-and-status.md`
- Modify: `skills/spec-first/03-spec/references/quality-gates.md`
- Modify: `skills/spec-first/03-spec/references/question-gate-rules.md`
- Modify: `skills/spec-first/03-spec/references/final-confirmation-template.md`
- Modify: `skills/spec-first/03-spec/references/spec-review-checklist.md`
- Modify: `skills/spec-first/03-spec/references/prd-template-greenfield.md`
- Modify: `skills/spec-first/03-spec/references/prd-template-iteration.md`

**Step 1: 固定 PRD 只产出 REQ**

在 `03-spec` 的正文和参考文档里，明确：

- `PRD / requirements` 阶段生成的是 `REQ`
- `FR` 不是 PRD 直接产物，而是后续 `spec.md` 收敛后的功能需求
- `REQ -> FR` 是推导链，不是同阶段并列产物

**Step 2: 统一阶段词汇**

把 `stage-gate / hard-gate / confirm-policy / dependency-check` 的语义分开：

- `stage-gate` = 推进门禁
- `hard-gate` = skill 入口强约束
- `dependency-check` = 前置条件校验
- `confirm-policy` = 人工确认策略，不是 gate

**Step 3: 处理旧词残留**

`03-spec` 中如果存在历史写法，只允许出现在：

- 旧术语引用段
- 与外部资料对照的历史说明
- 协议字段名 `confirm_policy`

**Step 4: 验收**

运行：

```bash
rg -n "PRD / requirements|REQ-ABBR|FR-ABBR|stage gate|hard gate|dependency check|confirm_policy|confirm-policy|stage-gate|hard-gate" skills/spec-first/03-spec
```

预期：

- `PRD / requirements` 只指向 `REQ`
- `FR-ABBR` 只出现在 `spec.md` 收敛语境
- `confirm_policy` 仅出现在 frontmatter 或协议字段上下文
- 对外文案统一为 `confirm-policy / stage-gate / hard-gate / dependency-check`

---

### Task 3: 统一设计 / 任务 / 代码 / 验证 / 编排的 P0 词表

**Files:**
- Modify: `skills/spec-first/04-design/SKILL.md`
- Modify: `skills/spec-first/04-design/references/design-constraints.md`
- Modify: `skills/spec-first/04-design/references/ds-format.md`
- Modify: `skills/spec-first/04-design/references/gate-rules.md`
- Modify: `skills/spec-first/04-design/references/sync-rules.md`
- Modify: `skills/spec-first/06-task/SKILL.md`
- Modify: `skills/spec-first/06-task/references/coordination-conventions.md`
- Modify: `skills/spec-first/06-task/references/task-checklist.md`
- Modify: `skills/spec-first/06-task/references/task-template.md`
- Modify: `skills/spec-first/07-code/SKILL.md`
- Modify: `skills/spec-first/07-code/references/code-standards.md`
- Modify: `skills/spec-first/07-code/references/diff-template.md`
- Modify: `skills/spec-first/07-code/references/report-template.md`
- Modify: `skills/spec-first/07-code/references/target-env-verification.md`
- Modify: `skills/spec-first/07-code/references/tdd-guard.md`
- Modify: `skills/spec-first/07-code/references/test-template.md`
- Modify: `skills/spec-first/07-code/references/traces-trailer.md`
- Modify: `skills/spec-first/12-verify/SKILL.md`
- Modify: `skills/spec-first/12-verify/references/gate-conditions.md`
- Modify: `skills/spec-first/12-verify/references/test-quality-checklist.md`
- Modify: `skills/spec-first/12-verify/references/verify-report-template.md`
- Modify: `skills/spec-first/13-orchestrate/SKILL.md`
- Modify: `skills/spec-first/AGENTS.md`
- Modify: `skills/spec-first/SHARED.md`
- Modify: `skills/spec-first/shared/background-quality-contract.md`
- Modify: `skills/spec-first/shared/orchestration-governance-contract.md`

**Step 1: 按 skill 职责收口词表**

每个 skill 只保留它真正需要的主词汇：

- `04-design` 只强调 `FR -> DS`
- `06-task` 只强调 `DS -> TASK`
- `07-code` 只强调实现、TDD、trace 投影和 diff 约束
- `12-verify` 只强调验证、门禁证据与回归
- `13-orchestrate` 只强调阶段推进、确认策略与批次收口

**Step 2: 清理面向用户的泛化门禁词**

把“gate”从泛称收敛为：

- `stage-gate`
- `hard-gate`
- `release-gate`
- `confirm-policy`
- `dependency-check`

**Step 3: 保留协议字段，但不让它污染文案**

- `confirm_policy` 可以继续作为 frontmatter / 协议字段
- 所有对外说明统一改写成 `confirm-policy`

**Step 4: 验收**

运行：

```bash
rg -n "stage gate|hard gate|dependency check|confirm_policy|confirm-policy|stage-gate|hard-gate|release-gate" \
  skills/spec-first/04-design \
  skills/spec-first/06-task \
  skills/spec-first/07-code \
  skills/spec-first/12-verify \
  skills/spec-first/13-orchestrate \
  skills/spec-first/AGENTS.md \
  skills/spec-first/SHARED.md \
  skills/spec-first/shared
```

预期：

- 对外文案统一使用 canonical 术语
- 历史写法仅保留在引用旧术语的对照段
- 不引入新的门禁名词

---

### Task 4: 锁定第一批 runtime contract 的回归测试

**Files:**
- Modify: `tests/unit/gate-evaluator.test.ts`
- Modify: `tests/unit/document-links.test.ts`
- Modify: `tests/unit/task-plan-parser.test.ts`
- Modify: `tests/unit/defect.test.ts`
- Modify: `tests/unit/cli-rfc-defect.test.ts`
- Modify: `tests/unit/rfc.test.ts`
- Modify: `tests/unit/trace-context.test.ts`
- Modify: `tests/unit/id-taxonomy.test.ts`
- Modify: `tests/unit/hard-gate.test.ts`
- Modify: `tests/unit/first-evidence-pack-contract.test.ts`

**Step 1: 把 P0 机制转成回归断言**

最少要覆盖这几类事实：

- gate 层级名称必须是 canonical 名称
- `document-links.yaml` 必须能校验 stage 文档关系
- `task_plan.md` 的执行投影必须继续只保留 `FR / DS`
- `Defect` 和 `RFC` 的 linked ID 校验不能退化
- `confirm-policy` 和 `hard-gate` 不能再被混成同一个概念

**Step 2: 只补最小断言，不扩 schema**

如果测试暴露缺口，只补断言，不在第一批扩展：

- `TaskNode`
- `GateStatus`
- `document-links` schema
- `stage-state.json` / `gate-history.jsonl` 格式

**Step 3: 验收**

运行：

```bash
pnpm vitest run \
  tests/unit/gate-evaluator.test.ts \
  tests/unit/document-links.test.ts \
  tests/unit/task-plan-parser.test.ts \
  tests/unit/defect.test.ts \
  tests/unit/cli-rfc-defect.test.ts \
  tests/unit/rfc.test.ts \
  tests/unit/trace-context.test.ts \
  tests/unit/id-taxonomy.test.ts \
  tests/unit/hard-gate.test.ts

pnpm -s build
```

预期：

- 上述测试全部通过
- build 成功
- 如果存在断言漂移，只能回退到文案或测试，不允许第一批扩 schema

---

### Task 5: 完成第一批收口与手工验收

**Files:**
- Modify: `docs/01-需求文档/逐个skill优化/链路优化/index.md`
- Modify: `docs/01-需求文档/逐个skill优化/链路优化/spec-first-第一批直接迁移实施方案.md`
- Modify: `docs/01-需求文档/逐个skill优化/链路优化/spec-first-迁移优先级表.md`

**Step 1: 让索引成为唯一入口**

`链路优化/index.md` 里必须把：

- `spec-first-产物ID与Gate关系梳理.md`
- `spec-first-最小保留流程图.md`
- `2026-03-23-产物ID与Gate收敛方案.md`
- `2026-03-23-产物ID与Gate收敛详细实施方案.md`
- `GSD流程与ID分析及借鉴.md`
- `spec-first-迁移清单.md`
- `spec-first-迁移优先级表.md`
- `spec-first-第一批直接迁移实施方案.md`

放在一条清晰的阅读链上。

**Step 2: 手工复核路径**

确认目录里不再残留旧英文文件名和旧英文路径引用。

**Step 3: 验收**

运行：

```bash
rg -n "id-gate-convergence|WORKFLOW-ID-ANALYSIS-AND-LESSONS|SPEC-FIRST-MIGRATION-CHECKLIST" docs/01-需求文档/逐个skill优化/链路优化
find docs/01-需求文档/逐个skill优化/链路优化 -maxdepth 1 -type f | sort
```

预期：

- 目录中只保留中文语义文件名和必要的数字前缀
- 新方案在索引里清晰可见
- 没有旧英文文件名残留

---

## 3. 不在第一批范围内

以下内容不要在第一批扩：

- 不新增 gate 层级
- 不新增 `GateStatus`
- 不扩 `TaskNode` 到 `REQ / TASK`
- 不改 `stage-state.json`、`gate-history.jsonl` schema
- 不改 RFC / Defect 的文件格式
- 不把 `todo / quick task / workstream` 作为本批新增能力

这些项目如果要做，应该进入第二批或后续批次，而不是挤在第一批里。

## 4. 第一批完成标准

第一批只要满足以下三件事，就可以认为收口成功：

1. `链路优化` 目录中的文档和索引已经把 P0 迁移机制讲清楚
2. `skills/spec-first` 的词表已经统一到 canonical 术语
3. 核心回归测试与 build 都通过，且没有引入新的 schema 漂移

换句话说：

- 文档告诉你“这套机制怎么迁移”
- skill 告诉你“用户该怎么说”
- 测试告诉你“当前实现没有被破坏”

---

## 5. 代码级影响面

> 这一批的原则是：**默认不改 `src` 运行时代码，只改文档、skill 词表和回归测试。**
>
> 下面列出的代码文件是“必须理解并锁定的真实实现面”，不是第一批默认改动面。

### 5.1 文件即真相源

**代码事实入口**
- `src/core/document-links.ts::validateDocumentLinksData`
- `src/core/document-links.ts::validateStageDocumentLinks`
- `src/core/document-links.ts::loadDocumentLinks`
- `src/core/document-links.ts::listMissingDocumentFiles`
- `src/core/document-links.ts::findBrokenDocumentReferences`
- `src/cli/commands/docs-links.ts::handleValidate`
- `src/cli/commands/docs-links.ts::handleShow`

**第一批动作**
- 不改 `document-links` 的 schema
- 不改 `validateStageDocumentLinks` 的 stage 规则
- 只通过文档和测试锁定 `spec.md / design.md / task_plan.md` 的关联边界

**验收命令**
```bash
pnpm vitest run tests/unit/document-links.test.ts
pnpm exec spec-first docs links validate <featureId>
pnpm exec spec-first docs links show <featureId>
```

### 5.2 主链与旁路分层

**代码事实入口**
- `src/core/trace-engine/relationship-graph.ts::MAIN_CHAIN_NODE_TYPES`
- `src/core/trace-engine/relationship-graph.ts::SUPPLEMENTARY_NODE_TYPES`
- `src/core/trace-engine/relationship-graph.ts::splitCanonicalTraceIds`
- `src/core/trace-engine/relationship-graph.ts::splitByRelationshipTier`
- `src/core/task-plan/parser.ts::toTaskNodes`
- `src/core/batch-executor/context-packer.ts::packContext`

**第一批动作**
- 不把 `REQ / TASK` 塞进 `TaskNode`
- 保持 `TaskNode.relatedFR / relatedDS` 的窄契约
- 通过文档把 `Feature -> REQ -> FR -> DS -> TASK -> TC` 的主链和 `Defect / RFC / EX` 的旁路讲清楚

**验收命令**
```bash
pnpm vitest run tests/unit/task-plan-parser.test.ts tests/unit/trace-context.test.ts
pnpm vitest run tests/unit/defect.test.ts tests/unit/rfc.test.ts
```

### 5.3 需求 / 阶段 / 计划 / 版本分层

**代码事实入口**
- `src/core/trace-engine/id-taxonomy.ts`
- `src/core/trace-engine/id-validator.ts`
- `src/core/trace-engine/id-generator.ts`
- `src/core/trace-engine/id-search.ts`
- `src/cli/commands/id.ts::handleList`
- `src/cli/commands/id.ts::handleSearch`

**第一批动作**
- 不改 ID schema
- 只收口 `REQ / FR / DS / TASK / TC / RFC` 的术语解释
- 确认 `id list/search --type` 仍然只做 canonical 类型过滤

**验收命令**
```bash
pnpm vitest run tests/unit/id-taxonomy.test.ts tests/unit/id-validator.test.ts tests/unit/id-search.test.ts
pnpm exec spec-first id list --feature <featureId> --type Feature
pnpm exec spec-first id search <keyword> --feature <featureId> --type FR
```

### 5.4 摘要与归档分离

**代码事实入口**
- `src/core/skill-runtime/first-runtime-store.ts::FIRST_RUNTIME_*`
- `src/core/skill-runtime/first-runtime-store.ts::getFirstRuntimeIndexPath`
- `src/core/skill-runtime/first-runtime-store.ts::getFirstDocsIndexPath`
- `src/core/skill-runtime/first-runtime-validator.ts::validateFirstRuntime`
- `src/core/skill-runtime/first-docs-check.ts::checkFirstDocsExistence`
- `src/cli/commands/status.ts::handleStatus`

**第一批动作**
- 不改 `.spec-first/runtime/first` 的 schema
- 继续把当前态、历史态、投影态分开
- 只把 GSD 借鉴材料作为文档归档，不接入 runtime 写入链
- 运行 `status` 前必须先在当前工作区定位或切换到目标 Feature

**验收命令**
```bash
pnpm vitest run tests/unit/first-bootstrap-validation.test.ts tests/unit/first-evidence-pack-contract.test.ts
pnpm exec spec-first feature switch <featureId>
pnpm exec spec-first status
```

### 5.5 临时想法缓冲层

**代码事实入口**
- `src/core/change-mgr/defect.ts::registerDefect`
- `src/core/change-mgr/rfc.ts::createRfc`
- `src/core/change-mgr/rfc.ts::submitRfc`
- `src/core/change-mgr/rfc.ts::syncKnownExceptionsFromWaivers`
- `src/cli/commands/defect.ts`
- `src/cli/commands/rfc.ts`
- `src/cli/commands/status.ts::readBackgroundLayers`

**第一批动作**
- 不新增新的“parking lot”运行时结构
- 让临时想法继续通过 `findings.md`、`Defect`、`RFC` 三条现有路径承接
- 把“缓冲层”先定位为文档/skill 语义，而不是新增持久化层

**验收命令**
```bash
pnpm vitest run tests/unit/defect.test.ts tests/unit/cli-rfc-defect.test.ts tests/unit/rfc.test.ts
pnpm exec spec-first defect list <featureId>
pnpm exec spec-first rfc list <featureId>
```

---

## 6. 若验收失败时的最小代码修复范围

> 第一批默认不改 runtime 代码。  
> 如果验收暴露问题，允许的最小修复范围如下。

### 6.1 文档关联校验失败

允许修改：
- `src/core/document-links.ts`
- `src/cli/commands/docs-links.ts`
- `tests/unit/document-links.test.ts`

修复目标：
- 只修 stage 文档关系与引用校验，不扩 schema

### 6.2 TaskNode 主链投影与文档不一致

允许修改：
- `src/core/trace-engine/relationship-graph.ts`
- `src/core/task-plan/parser.ts`
- `src/core/batch-executor/context-packer.ts`
- `tests/unit/task-plan-parser.test.ts`
- `tests/unit/trace-context.test.ts`

修复目标：
- 明确是“文档要收窄”还是“投影要扩展”
- 第一批默认选择收窄文档，不扩执行契约

### 6.3 ID 词表与 CLI 过滤不一致

允许修改：
- `src/core/trace-engine/id-taxonomy.ts`
- `src/core/trace-engine/id-validator.ts`
- `src/core/trace-engine/id-search.ts`
- `src/cli/commands/id.ts`
- `tests/unit/id-taxonomy.test.ts`
- `tests/unit/id-search.test.ts`

修复目标：
- 保持 canonical 类型表不变
- 只修过滤映射与展示文案

### 6.4 缺陷 / RFC 回流边界漂移

允许修改：
- `src/core/change-mgr/defect.ts`
- `src/core/change-mgr/rfc.ts`
- `src/core/trace-engine/exception-validator.ts`
- `tests/unit/defect.test.ts`
- `tests/unit/rfc.test.ts`
- `tests/unit/exception-validator.test.ts`

修复目标：
- 保持 `linkedFr / linkedTc`、`waivers -> EX` 的回流闭环不退化

### 6.5 运行态摘要 / 归档边界失真

允许修改：
- `src/core/skill-runtime/first-runtime-store.ts`
- `src/core/skill-runtime/first-runtime-validator.ts`
- `src/core/skill-runtime/first-docs-check.ts`
- `src/cli/commands/status.ts`
- `tests/unit/first-bootstrap-validation.test.ts`
- `tests/unit/first-evidence-pack-contract.test.ts`

修复目标：
- 只修“当前态 / 投影态 / 归档态”的边界表达
- 不改 runtime 文件格式

---

## 7. 具体函数 / 预期行为 / 断言点 清单

> 这一节是执行时的“逐函数核对表”。
>
> 规则：
> - 只核对这里列出的函数
> - 只围绕这里列出的预期行为写测试
> - 如果行为已经成立，不要为了迁移而扩展接口

### 7.1 文件即真相源

| 函数 | 预期行为 | 断言点 |
|---|---|---|
| `validateDocumentLinksData()` | 必须拒绝重复文档路径和缺失引用 | 传入重复 `design.md` + 缺失 `missing.md` 时，`valid=false` 且 errors 精确匹配 |
| `validateStageDocumentLinks()` | `SPECIFY / DESIGN / PLAN` 只校验对应文档与引用 | `SPECIFY` 只要求 `spec.md`；`DESIGN` 要求 `design.md -> spec.md`；`PLAN` 要求 `task_plan.md -> spec.md/design.md` |
| `loadDocumentLinks()` | 读取并校验 `document-links.yaml` | 文件缺失时报错；结构非法时报错；合法时返回解析后的文件 |
| `handleValidate()` | CLI 校验结果应与核心校验一致 | `spec-first docs links validate <featureId>` 在合法时退出码为 0，非法时退出码为非 0 |
| `handleShow()` | 输出文档路径、kind、stage、引用关系 | 展示结果中必须能看到每个文档的引用边 |

### 7.2 主链与旁路分层

| 函数 | 预期行为 | 断言点 |
|---|---|---|
| `splitByRelationshipTier()` | `Feature / REQ / FR / DS / TASK` 归入主链，`TC / RFC` 归入补充链，其余归入未跟踪 | `trace-context` 的主链、补充链、未跟踪三分区应稳定 |
| `splitCanonicalTraceIds()` | 只把合法 ID 分成主链 / 补充 / 未跟踪，并在主链里额外提取 `FR / DS` | `FR` 只进 `relatedFRIds`，`DS` 只进 `relatedDSIds`，`TC / RFC` 不进入 `TaskNode` 投影 |
| `toTaskNodes()` | 任务节点只保留 `relatedFR / relatedDS` | 任务里出现 `TC` 时，不应进入 `TaskNode`，只保留在解析层 traces 中 |
| `packContext()` | 上下文包只抽取 `spec.md / design.md` 的 FR/DS 段落，且总大小不超过 2KB | `relatedFR` 只影响 `spec.md`，`relatedDS` 只影响 `design.md`，超 2KB 必须抛错 |
| `createTraceContext()` | 关系图视图应反映主链 / 补充链 / 未跟踪分区 | `Feature / REQ / FR` 进入主链，`TC / RFC` 进入补充链，`SYS` 进入未跟踪 |

### 7.3 需求 / 阶段 / 计划 / 版本分层

| 函数 | 预期行为 | 断言点 |
|---|---|---|
| `validateId()` | 正确识别 `Feature / REQ / FR / DS / TASK / TC / RFC` 等 canonical 类型 | `Feature` 和普通 trace ID 的模式必须分离 |
| `searchId()` | 可按关键字和类型过滤，类型过滤大小写不敏感 | `--type Feature`、`--type FR` 都能命中对应 ID |
| `listIds()` | 列出当前 Feature 的全部 ID，并支持类型过滤 | `list --type FR` 只返回 FR，空结果时输出“未找到 ID” |
| `handleSearch()` | CLI 能把字符串类型映射回 canonical `IdType` | 输入 `feature` / `Feature` / `FEATURE` 都应匹配同一类型 |
| `handleList()` | CLI 类型过滤与核心搜索一致 | `--type` 无效时拒绝，合法时按 canonical 类型输出 |

### 7.4 摘要与归档分离

| 函数 | 预期行为 | 断言点 |
|---|---|---|
| `getFirstRuntimeIndexPath()` | 返回 runtime index 的唯一落点 | 不允许写到非 `.spec-first/runtime/first` 路径 |
| `getFirstDocsIndexPath()` | 返回 docs 投影索引路径 | docs 索引与 runtime 索引分离 |
| `validateFirstRuntime()` | 检查 runtime summary / steering / conventions / critical flows / entry guide / api contracts / structure overview / domain model | 缺任一资产时 issues 必须列出文件名 |
| `checkFirstDocsExistence()` | 检查投影文档是否存在 | `database-er.md` 只有在数据库健康时才进入 expected 列表 |
| `handleStatus()` | 输出当前态、背景态、文档态和下一步建议 | `background_input_status / runtime 真源 / docs 输出 / 同步状态` 必须全部可见 |

### 7.5 临时想法缓冲层

| 函数 | 预期行为 | 断言点 |
|---|---|---|
| `validateOptionalLinkedId()` | `linkedFr / linkedTc` 必须校验为对应 ID 类型 | `linkedFr` 不能接 `TC`，`linkedTc` 不能接 `FR` |
| `validateDefectRegisterOptions()` | `discoveredIn` 必须是合法 stage | 非法 stage 直接拒绝注册 |
| `registerDefect()` | 注册后必须写入 `defects/defect-NNN.json`，默认状态 `open` | `seq` 自增，`status=open`，时间戳更新 |
| `listDefects()` | 能按 status / severity 过滤且按 seq 排序 | `fixing` / `S1` 过滤后结果数量和排序必须稳定 |
| `getEscapeRate()` | 统计 verify 之后发现的缺陷占比 | `06_wrap_up / 07_release / 08_done` 记为 escaped |
| `createRfc()` | 自动分配 `RFC-NNN`，保留 impactIds / waivers / level | `RFC-001`, `RFC-002` 顺序稳定，字段原样落盘 |
| `submitRfc()` | 从 draft 进入 approved，并同步 waivers 到 known-exceptions | 有 waiver 时 `known-exceptions.md` 必须新增 `EX-NNN` |
| `syncKnownExceptionsFromWaivers()` | 同一 `(RFC, FR)` 对只写一次 EX | 重复提交不能重复生成同一豁免条目 |

### 7.6 门禁与确认策略

| 函数 | 预期行为 | 断言点 |
|---|---|---|
| `evaluatePolicy()` | 按 mode / size / NFR-SEC / 外部接口决定 `auto / assisted / strict` | `Mode N` 必须是 `strict`；`Mode I + S + 无风险` 必须是 `auto` |
| `writeAutoAudit()` | `auto` 决策必须写入 `findings.md` | 审计条目中必须包含时间戳和 action |
| `evaluateGate()` | 根据当前阶段与条件返回 PASS / FAIL，并在需要时落盘历史 | `FAIL` 时历史必须写入 `gate-history.jsonl` |
| `getConditions()` | 阶段条件必须按 `projectType / profile` 过滤 | strict profile 下 warning 条件应升为 blocking |
| `handleGate()` / `handleGoLive()` | CLI 结果必须和 gate engine 一致 | JSON / 文本输出的 PASS / FAIL 必须与核心结果一致 |

### 7.7 第一批验收优先级

如果时间只够做最小集，优先顺序是：

1. `validateDocumentLinksData()` / `validateStageDocumentLinks()`
2. `splitCanonicalTraceIds()` / `toTaskNodes()` / `packContext()`
3. `validateId()` / `searchId()` / `listIds()`
4. `registerDefect()` / `submitRfc()` / `syncKnownExceptionsFromWaivers()`
5. `evaluatePolicy()` / `evaluateGate()` / `handleStatus()`

这个顺序的原则是：

- 先锁定文档与主链边界
- 再锁定执行上下文投影
- 再锁定 ID 过滤与展示
- 最后锁定门禁和运行态摘要
