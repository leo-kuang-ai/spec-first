# ID / Gate 收敛方案 - 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把当前分散的 ID 体系和 Gate 体系收敛成更少层次、更少名词、单一主链路可解释的治理模型，降低认知成本和文档/代码漂移风险。

**Architecture:** 以代码事实为准，保留现有阶段机、依赖检查、硬门禁和发布校验，但统一命名、统一职责、统一主视图。ID 侧保留必要类型，但把关系解释压到一张 canonical graph 上，其他关系视图只做补充，不再各自为政。Gate 侧把多套判断拆成明确分层，避免同一问题在多个模块里重复表达。

**Tech Stack:** TypeScript, YAML, Markdown, existing `spec-first` runtime and trace modules.

**当前进度:** Phase 0-4 的核心代码收敛已经落地，Phase 5 的文档术语统一与收尾回归仍在推进中；个别补强点会以后续小修补齐，而不是回退整个方案。

---

## 收敛目标

### 目标 1：Gate 收敛

- 保留 `stage-machine` 作为唯一流程主骨架。
- 把现有判断统一归类为 4 类：
  - `precondition`
  - `stage-gate`
  - `hard-gate`
  - `release-gate`
- `confirm-policy` 保持独立，不再混称 gate。
- `dependency-check` 保持独立，但定位为前置条件，不进入 stage gate 语义。

### 目标 2：ID 收敛

- 保留现有 ID 类型，但明确哪些是主链路 ID，哪些是扩展 ID。
- 统一一张主关系图：
  - `Feature -> REQ -> FR -> DS -> TASK -> TC`
  - `RFC -> EX`
  - `Defect -> FR / TC`
  - `MatrixRow -> upstream / downstream`
- 其他关系模型只允许做补充，不允许再生成新解释层。
  - 其中 `relationship-graph.ts` 只负责 `MatrixRow.type` 能表达的 row-tier 分类，当前收口到 `TC / RFC`；`Defect` / `MatrixRow` 本身仍由各自治理与矩阵模块表达，不进入 row-tier 类型集合。

### 目标 3：消歧与对齐

- 消除文档与代码不一致的 gate id。
- 消除“同一对象在多个模块里各自命名”的现象。
- 把所有校验结果映射到统一输出格式，便于 review 和排障。

### 目标 4：兼容与边界

- 默认不迁移 `stage-state.json`、`gate-history.jsonl` 这类持久化文件格式。
- CLI 先保持退出码不变，输出文案只做术语收敛，不做协议升级。
- skill prompt 和文档术语要一并收口，避免代码收敛了、用户心智没收敛。

---

## Phase 0: 统一词表和边界

### Task 0.1: 固定术语表

**Files:**
- Modify: `docs/01-需求文档/逐个skill优化/spec-skill/spec-first-产物ID与Gate关系梳理.md`
- Modify: `docs/01-需求文档/逐个skill优化/spec-skill/spec-first-节点五栏拆解.md`

**Step 1: Write the term boundary**

明确以下词义：
- `stage` = 流程位置
- `gate` = 该 stage 的通过判定
- `hard-gate` = skill 入口强约束
- `dependency-check` = 依赖前置条件
- `confirm-policy` = 人工确认策略，不是 gate
- `release-gate` = 发布门禁

**Step 2: Align the docs**

把前面所有“gate”相关章节按上述词义重写，避免术语复用。

**Step 3: Verify**

人工检查文档中是否存在一词多义、同义不同名、同名不同义。

### Task 0.2: 现状快照测试

**Files:**
- Create: `tests/unit/spec-first-taxonomy.test.ts`
- Modify: `tests/unit/gate-evaluator.test.ts`
- Modify: `tests/unit/id-generator.test.ts`
- Modify: `tests/unit/task-plan-parser.test.ts`
- Modify: `tests/unit/document-links.test.ts`

**Step 1: 写现状快照**
- 先锁住当前 gate registry、ID 白名单、task parser 的真实输出。
- 只写最小可行集，先覆盖现状基线，不追求一次把全部 taxonomy 规则铺满。

**Step 2: 再写收敛预期**
- 收敛目标的断言可以先保留为 pending 或待改造断言，不要求 Phase 0 通过。

**Step 3: 验收**
- 现状快照稳定，后续 Phase 1+ 的改造有明确对比基线。

---

## Phase 1: Gate 收敛

### Task 1.1: 统一 gate 分层命名

**Files:**
- Modify: `src/core/gate-engine/condition-registry.ts`
- Modify: `src/core/gate-engine/gate-evaluator.ts`
- Modify: `src/core/gate-engine/golive.ts`
- Modify: `src/core/process-engine/dependency-checker.ts`
- Modify: `src/core/skill-runtime/hard-gate.ts`
- Modify: `src/core/skill-runtime/confirm-policy.ts`

**Step 1: 列出现有 gate 层**

按代码事实把当前校验分成四组：
- 前置条件
- 阶段条件
- 硬门禁
- 发布门禁

**Step 2: 统一输出标签**

让日志、错误信息、文档说明都使用同一组标签，不再混用“stage gate / hard gate / policy / dependency check”。

**Step 3: 对齐 gate id**

补齐文档和代码的差异，消除 `G-IMPL-02`、`G-VERIFY-02` 这类文档存在但 registry 未注册的悬空项，或明确删除文档引用。

**Step 4: Verify**

检查所有 gate 输出是否能被归入四类之一。

### Task 1.2: 合并重复判断入口

**Files:**
- Modify: `src/core/process-engine/next-step-decider.ts`
- Modify: `src/core/gate-engine/gate-evaluator.ts`
- Modify: `src/core/process-engine/stage-machine.ts`

**Step 1: 识别重复决策点**

梳理“是否可推进”的判断到底由谁负责，避免 stage machine、dependency checker、gate evaluator 同时决定同一件事。

**Step 2: 约束职责**

保留：
- `stage-machine` 负责合法迁移
- `dependency-checker` 负责前置依赖
- `gate-evaluator` 负责 stage 条件

**Step 3: Verify**

每个推进场景只能有一个主判定入口，其他模块只提供证据，不再做主决策。

### Task 1.3: 补 skill 层术语扫描

**Files:**
- Modify: `skills/spec-first/**/SKILL.md`
- Modify: `docs/01-需求文档/逐个skill优化/spec-skill/index.md`

**Step 1: 扫描旧术语**
- 先用脚本批量扫描 21 个 `skills/spec-first/**/SKILL.md`，列出 `dependency check`、`policy`、`hard gate`、`waiver`、`stage gate` 的分布。
- 再人工确认哪些是高频入口、哪些只是历史措辞，避免机械改写所有文件。
- 产出一份优先级清单，先改影响最高的入口文件，再逐步扩展。

**Step 2: 优先更新高频入口**
- 优先改用户最常接触的 skill prompt，避免全量机械改写。

**Step 3: 验收**
- 用户看到的术语和收敛后的门禁分层一致。

---

## Phase 2: ID 收敛

### Task 2.1: 定义 canonical graph

**Files:**
- Create: `src/core/trace-engine/relationship-graph.ts`
- Modify: `src/shared/types.ts`
- Modify: `src/core/trace-engine/trace-context.ts`
- Modify: `src/core/trace-engine/upstream-lineage.ts`
- Modify: `src/core/document-links.ts`

**Step 1: 选定主链路**

把 `Feature / REQ / FR / DS / TASK / TC` 定义成主链路。

**Step 2: 选定补充链路**

把 `TC / RFC` 定义成补充链路的 row-tier 类型，不参与主链路排序；`EX / Defect / MatrixRow` 作为治理/矩阵对象单独处理，不放入 row-tier 类型集合。

**Step 3: 统一术语**

明确：
- `upstream / downstream` 是图关系
- `linkedFr / linkedTc` 是回流关系
- `rfcId / frId` 是豁免引用

**Step 4: Verify**

检查所有 ID 关系是否都能落入主链路或补充链路，不允许出现第三种未知关系。

### Task 2.2: 收缩 ID 视图

**Files:**
- Modify: `src/core/trace-engine/id-generator.ts`
- Modify: `src/core/trace-engine/id-validator.ts`
- Modify: `src/core/trace-engine/id-search.ts`

**Step 1: 分清主 ID 与扩展 ID**

保留现有类型，但明确哪些是生成优先级高、哪些只是兼容。

**Step 2: 降低心智负担**

如果某些 ID 类型长期不在主流程中出现，应标注为兼容类型，不再和主链路等权。

**Step 3: Verify**

输出的 ID 列表应能被用户一眼分成“主链路”和“扩展项”。

### Task 2.3: 明确兼容边界

**Files:**
- Modify: `src/core/process-engine/feature.ts`
- Modify: `src/cli/commands/gate.ts`
- Modify: `src/core/gate-engine/gate-evaluator.ts`

**Step 1: 写兼容约束**
- 说明 CLI 继续兼容旧调用方式和旧退出码。

**Step 2: 不改持久化协议**
- `stage-state.json` 和 `gate-history.jsonl` 只做读取兼容，不做迁移。

**Step 3: 验收**
- 方案不会因为收敛而要求现有 Feature 重新初始化。

---

## Phase 3: 消费端对齐

### Task 3.1: 统一任务/校验消费口径

**Files:**
- Modify: `src/core/task-plan/parser.ts`
- Modify: `src/core/trace-engine/trace-context.ts`
- Modify: `src/core/trace-engine/upstream-lineage.ts`
- Modify: `src/core/document-links.ts`

**Step 1: 对齐输入输出**

确认 task、trace、TC 在消费链路中的地位是否一致。

**Step 2: 补齐缺口**

如果 `TC` 是执行链必要对象，就补到任务上下文；如果不是，就不要在主链路里暗示它是同等层级。

**Step 3: Verify**

task 执行上下文中出现的 ID 类型，必须和主关系图一致。

### Task 3.2: 统一风险与豁免链

**Files:**
- Modify: `src/core/change-mgr/rfc.ts`
- Modify: `src/core/change-mgr/defect.ts`
- Modify: `src/core/trace-engine/exception-validator.ts`

**Step 1: 固定豁免模型**

明确 `RFC -> EX` 的唯一生成链，避免多处隐式生成。

**Step 2: 固定缺陷回流模型**

明确 defect 只回流到 `FR / TC`，不要再派生新关系。

**Step 3: Verify**

豁免、缺陷、回流三类对象的关系输出必须稳定且可追踪。

---

## Phase 4: 收尾和去旧

### Task 4.1: 删除歧义文档和旧称呼

**Files:**
- Modify: `docs/01-需求文档/逐个skill优化/spec-skill/spec-first-技能全局梳理.md`
- Modify: `docs/01-需求文档/逐个skill优化/spec-skill/spec-first-产物ID与Gate关系梳理.md`
- Modify: `docs/01-需求文档/逐个skill优化/spec-skill/spec-first-节点五栏拆解.md`

**Step 1: 查重**

找出同一概念的多套说法。

**Step 2: 统一**

保留一种说法，其他全部降级为备注或删除。

**Step 3: Verify**

文档与代码在 gate / ID / relation 的术语上必须一一对应。

### Task 4.2: 回归检查

**Files:**
- Modify: `docs/01-需求文档/逐个skill优化/spec-skill/2026-03-23-id-gate-convergence-plan.md`

**Step 1: 回看收敛目标**

确认实际修改没有新增概念。

**Step 2: 回看边界**

确认没有把“收敛”做成“再造一套更复杂的体系”。

**Step 3: Verify**

最终文档只保留：
- 主链路
- 补充链路
- 四类 gate
- 明确的豁免和回流

---

## 验收标准

1. 任一 stage 的推进，只能用一套主判断语义描述。
2. 任一 ID 关系，只能落到 canonical graph 或补充链路。
3. 文档里不再出现无法归类的 gate 名称。
4. `G-IMPL-02`、`G-VERIFY-02` 之类的文档/代码差异被清除或显式标注。
5. 新同学第一次看文档，能在一张图里理解“谁生产、谁消费、谁拦截、谁放行”。

---

## 不做项

- 不重写整个 stage 机。
- 不删除现有 ID 类型。
- 不引入新的豁免模型。
- 不把所有关系强行压成一张超大表。
- 不把收敛方案再扩成新的分层治理框架。
