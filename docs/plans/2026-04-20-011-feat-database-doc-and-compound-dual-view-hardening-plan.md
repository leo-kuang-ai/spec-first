---
title: 数据库文档路由与 Compound 双视角强化计划
type: feat
status: completed
date: 2026-04-20
deepened: 2026-04-20
origin: docs/plans/2026-04-19-005-feat-sdd-riper-light-contract-integration-plan.md
---

# 数据库文档路由与 Compound 双视角强化计划

## Overview

本计划把上一轮 follow-up 中最值得继续推进的内容收口成一份可执行改造方案，并且**只保留最优推荐路径**。

从问题域看，仍然是**两条主线**：

1. **数据库文档生成 contract**
   - 采用“静态候选发现 + runtime routing artifact + database worker 消费”的三层结构
2. **`spec-compound` 双视角强化**
   - 继续采用“单文件双视角”作为唯一 durable output，同时强化 retrieval 与 refresh

从实施收口看，本轮实际落成 **三个收口点**：

1. **数据库 route / fallback / provenance contract 收口**
2. **`LLM Reuse Context` 检索优先级收口**
3. **section-aware refresh 收口**

本计划的目标不是增加新的 orchestrator，也不是补一套重控制面，而是继续沿着仓库原则 `轻 contract + 明确边界 + 让 LLM 决策` 优化当前系统的决策输入质量、失败可解释性和知识复用密度。

## Expected Effects

如果按本计划完成，预期效果如下：

1. 数据库文档生成在单连接、多连接、MCP 不稳定、CLI 可用等场景下更可靠，且失败原因可追踪。
2. 数据库链路中的 secret 解析、probe 结果、route 选择与文档生成边界更清晰，不再混在同一个事实层里。
3. `docs/solutions/` 中的 `Human Summary` 与 `LLM Reuse Context` 会真正成为两种消费视角，而不只是模板章节。
4. `learnings-researcher` 会优先消费 `LLM Reuse Context`，让后续 planning / work / review 获得更高密度的 institutional knowledge。
5. `spec-compound-refresh` 会更偏向 section-aware 更新，降低“轻微漂移导致整篇重写”的噪音。
6. 全程不引入第二 durable artifact 根目录，不把系统往更重的状态机或 registry 方向推。

## Problem Frame

### 问题 1：数据库文档生成的事实层与运行时层仍然耦合过紧

当前数据库文档能力主要集中在 `spec-graph-bootstrap` 的 database worker 与相关 schema / compiler 路径中。现有能力已经覆盖：

- `fact-inventory.database[]` 发现
- `db_access_level` 判断
- `database-worker.md` 中的 Level1 / Level2 执行规则
- 数据库文档产出规则

但仍存在四个结构性问题：

1. **静态候选事实与运行时连接事实混杂。**
   `fact-inventory.database[]` 适合表达“仓库里有哪些数据库候选线索”，不适合承载 secret 解析、probe 结果、route 选择、fallback 历史等 runtime 事实。

2. **MCP / CLI 的选路语义不够显式。**
   当前更像“根据等级进入一条路径”，而不是“把两条路径的可用性都变成事实，再根据事实选路”。

3. **多连接项目不是一等输入。**
   当前更容易把数据库视为“有/没有”或“一个连接”的问题，而不是“候选连接 A/B/C 各自成功/失败”的问题。

4. **失败 provenance 不够完整。**
   生成失败时，需要回答“为什么没生成”以及“哪条连接失败、失败在哪一层、有没有可用替代路径”，而不只是一个笼统错误。

### 问题 2：`spec-compound` 双视角已经存在，但检索与刷新还没充分吃到价值

当前 `spec-compound` 与 `spec-compound-refresh` 已经支持：

- 单文件 durable output
- `Human Summary`
- `LLM Reuse Context`
- 旧文档缺少双视角时的兼容语义

但这条线还没有完全打通：

1. **`LLM Reuse Context` 还没有成为检索主输入。**
   现在它更像“模板中存在的章节”，还没成为 `learnings-researcher` 的优先消费对象。

2. **refresh 还不够 section-aware。**
   当前可以识别双视角章节，但缺少“路径漂移只改 `Code Touchpoints`、证据漂移只改 `Provenance`、模式变化才改复用建议”的稳定刷新策略。

3. **旧文档升级路径还不够系统。**
   缺失双视角的旧文档不应报错，但当 refresh 命中、且证据足够时，应有一致的升级行为，而不是临场发挥。

4. **知识库已经有双视角的表达能力，但还没有完全转化为更好的 agent 决策输入。**
   这正是当前最值得继续优化的地方。

## Requirements Trace

- R1. 两条线都必须遵守 `轻 contract + 明确边界 + 让 LLM 决策`，不引入新的强状态机或全局 registry。
- R2. 数据库文档生成必须把“静态候选发现”和“运行时连接 / route / probe 事实”分层。
- R3. `fact-inventory.database[]` 只表达静态候选连接事实，不承载 secret 值、probe 历史或 fallback 历史。
- R4. 数据库 secret 只能在运行时解析，不能落入 `docs/`、plan、README、sample fixture 或 machine artifact 的明文字段。
- R5. 不允许静默 `MCP -> CLI` 自动切换；如果发生 route 切换，必须有显式 `fallback_reason` 和 provenance。
- R6. 多连接项目必须按“逐连接 probe、逐连接成功/失败记录”处理，而不是整批黑盒成功或失败。
- R7. 本轮数据库直接生成路径优先收口在当前已有的 `db_type=mysql` 范围内；其他数据库类型保持 discovery-only 或 future scope。
- R8. `spec-compound` 继续保持“单文件双视角”为唯一 durable output，不新增 sidecar machine file、第二 durable 目录或平行 archive 根目录。
- R9. `learnings-researcher` 在双视角存在时，必须优先消费 `LLM Reuse Context`，`Human Summary` 作为辅助快速视图。
- R10. `spec-compound-refresh` 必须支持 section-aware refresh，优先做局部事实更新而不是整篇重写。
- R11. 缺少双视角 section 的旧文档不是 schema error；只有在已有充分证据时，才进行机会式升级。
- R12. 所有 contract 改动都必须同步更新 source skill / docs mirror / contract tests，避免 source / mirror 漂移。
- R13. 新增 runtime-only artifact 时，必须有明确 schema、artifact-manifest 登记、compiler sample 和测试锚点。
- R14. `spec-graph-bootstrap` 继续只对 `SKILL.md` 维护 `docs/10-prompt` mirror；`references/*.md` 保持 source-only，稳定 machine contract 必须提升到 `docs/contracts/`。
- R15. 本计划不承诺 bootstrap runtime 在本轮直接生成 `database/*` 文档；本轮只收口数据库 route / fallback / provenance 的 contract 与下游消费语义。

## Scope Boundaries

- 本计划不引入新的 `spec-*` 或 `spec-*` workflow 入口。
- 本计划不新增第二套 `docs/solutions/` durable 根目录。
- 本计划不批量重写现有 `docs/solutions/` 全量历史文档。
- 本计划不把数据库 secret 写入任何落盘文档、schema sample、fixture 或 runtime artifact 明文字段。
- 本计划不把数据库连接发现收口成固定配置文件白名单。
- 本计划不把 `stage0-context` 下游 workflow 的主 contract 改造成数据库执行编排器。
- 本计划不扩展 `doctor`、`clean`、`init` 的对外行为，除非新增 artifact contract 需要最小 manifest / schema 同步。
- 本计划不把 `spec-compound` 双视角拆成 `.md + .json` 双持久化体系。
- 本计划不把 `spec-graph-bootstrap` 的 `references/*.md` 引入 `docs/10-prompt` mirror 治理。
- 本计划不把“数据库文档 runtime 真正生成”与“数据库 route contract 收口”混成一个 implementation unit 的 done 条件。

## Context & Research

### Relevant Code and Patterns

- `skills/spec-graph-bootstrap/SKILL.md`
- `skills/spec-graph-bootstrap/references/database-worker.md`
- `skills/spec-graph-bootstrap/references/artifact-schemas.md`
- `docs/contracts/spec-graph-bootstrap/fact-inventory.schema.json`
- `src/bootstrap-compiler/derive-bootstrap-facts.js`
- `src/bootstrap-compiler/compile-machine-artifacts.js`
- `src/bootstrap-compiler/compile-routing.js`
- `src/bootstrap-compiler/run-bootstrap.js`
- `src/bootstrap-compiler/schema-loader.js`
- `tests/unit/spec-graph-bootstrap-contracts.test.js`
- `tests/unit/spec-graph-bootstrap-compiler.test.js`
- `tests/e2e/spec-graph-bootstrap-mainline.sh`
- `tests/fixtures/bootstrap/spec-first-bootstrap-sample.js`
- `skills/spec-compound/SKILL.md`
- `skills/spec-compound/assets/resolution-template.md`
- `skills/spec-compound/references/schema.yaml`
- `skills/spec-compound-refresh/SKILL.md`
- `agents/research/learnings-researcher.md`
- `tests/unit/spec-compound-contracts.test.js`
- `tests/unit/asset-consistency.test.js`
- `tests/unit/agent-namespace-neutrality-contracts.test.js`

### Institutional Learnings

- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`
  - 强调 source-of-truth 与 runtime artifact 的边界，不应新增并行副本体系。

### Current Repo Facts That Matter

1. `spec-compound` 双视角 contract 已经部分落地，当前最优方向是**强化检索与刷新**，不是重新设计 durable output。
2. 数据库 worker 已经有不少生成规则，本轮更值得做的是**事实分层与 runtime provenance 明确化**，不是继续向 worker 内堆更多隐式判断。
3. 现有 `docs/contracts/spec-graph-bootstrap/` 已经承载 bootstrap schema，因此新增数据库 routing artifact 也应放在同一 contract 族下，而不是另起体系。

## Key Technical Decisions

- 决策 1：**数据库连接事实采用“两层真源”收口。**  
  `fact-inventory.database[]` 只保留静态候选发现；运行时 secret 解析、probe、route、fallback、selected connection 统一进入新的 runtime-only artifact。

- 决策 2：**数据库 route 必须显式记录，不做静默降级。**  
  允许 `MCP -> CLI` 作为最终路由结果，但前提是 probe、fallback reason 和 provenance 都明确记录下来。

- 决策 3：**多连接项目按连接数组建模，而不是按单数据库标量建模。**  
  这能保持“部分成功、部分失败”的表达能力，也符合真实项目的连接拓扑。

- 决策 4：**数据库 direct generation 本轮只对现有 `db_type=mysql` 主路径做 contract 硬化。**  
  这是对当前代码现实最保守且最有效的收口，避免为了“通用性”把方案写成大而空的抽象层。

- 决策 5：**`spec-compound` 继续坚持单文件双视角。**  
  `Human Summary` 和 `LLM Reuse Context` 必须留在同一个 durable file 内，不能拆到 sidecar artifact。

- 决策 6：**`learnings-researcher` 的检索主输入升级为 `LLM Reuse Context`。**  
  双视角存在时，优先消费 `LLM Reuse Context` 的 `Constraints / Code Touchpoints / Patterns to Reuse / Anti-patterns to Avoid / Provenance`，`Human Summary` 只用于快速人类概览。

- 决策 7：**`spec-compound-refresh` 采用 section-aware refresh，而不是整篇优先。**  
  路径漂移优先更新 `Code Touchpoints`，证据漂移优先更新 `Provenance`，模式变化优先更新 `Patterns to Reuse / Anti-patterns to Avoid`，结论变化才更新 `Human Summary`。

- 决策 8：**旧文档双视角升级采用“命中即升级、无证据不脑补”的渐进策略。**  
  不做一次性全量改写，只在 refresh 或新写入场景里机会式增强。

- 决策 9：**`spec-graph-bootstrap` 继续只 mirror `SKILL.md`，不为 `references/*.md` 发明新的 docs mirror 层。**  
  对 graph-bootstrap 来说，稳定 contract 应进入 `docs/contracts/`；`references/*.md` 保持 source-side supporting material，避免形成三层真源。

- 决策 10：**数据库 direct generation 不纳入本轮 runtime 完成定义。**  
  本轮只做静态候选发现、runtime routing artifact、worker 消费语义与失败 provenance 收口；真正的 `database/*` runtime 生成若要落地，必须另起更大的 compiler/runtime 计划。

- 决策 11：**`spec-compound-refresh` 的 section-aware 强化默认不改模板。**  
  先收口 refresh contract 与测试；只有当新的 refresh 规则确实需要稳定模板提示时，才补改 `spec-compound-refresh` 自己的模板，而不是默认改 `spec-compound` 主模板。

- 决策 12：**所有变更都遵守 source + docs mirror + contract tests 三件套，但“三件套”的对象必须服从当前治理边界。**  
  对 `spec-compound` / `spec-code-review` 等已有 mirror 体系的 skill，source 与 docs mirror 同步；对 graph-bootstrap 的 `references/*.md`，则以 source + `docs/contracts/` + tests 为真源链路。

## Why This Is The Best Current Plan

这是当前最优方案，原因有三点：

1. **它尊重现有代码现实。**  
   数据库链路已经有 bootstrap compiler、artifact schema、database worker 和 MySQL direct path；compound 链路已经有双视角模板与 refresh contract。最优策略是沿着现有能力继续收紧，而不是推倒重来。

2. **它解决的是边界失真，而不是表面症状。**  
   数据库问题的核心不是“缺一个 fallback if”或“先把 database/* 产物都生成出来”，而是静态事实和 runtime 事实边界不清。compound 问题的核心不是“文档还不够长”，而是检索与刷新没有真正把双视角吃满。

3. **它的验证成本可控且收益直接。**  
   两条线都能通过 schema / skill / mirror / compiler / unit / e2e 逐层加固，不需要先做大范围 CLI 或 runtime 重构。

## Implementation Strategy

本计划分 4 个 implementation units，但它们最终服务于上面的三个收口点：先收数据库 contract，再收 retrieval，最后收 refresh。

### Dependency and Merge Order

推荐顺序如下：

1. **Unit 1：数据库候选发现与 runtime routing artifact contract**
2. **Unit 2：database worker 消费 routing artifact，并显式收口 route / fallback / provenance**
3. **Unit 3：`spec-compound` 双视角检索强化**
4. **Unit 4：`spec-compound-refresh` section-aware refresh 强化**

原因：

- Unit 1 先把数据库事实边界收清，Unit 2 才能稳定消费。
- compound 的 durable output 已存在，先改 retrieval，再改 refresh，能避免 refresh 先定义一套与检索脱节的更新语义。

### Cross-Cutting Verification Rule

凡是本计划中改变了**用户可见 workflow 行为**或**runtime contract 行为**的 unit，都必须满足：

1. source skill / source agent 更新
2. `docs/10-prompt/` mirror 同步
3. 至少 1 条 contract test 锚点
4. 若涉及 compiler / artifact 写入行为，补 sample / schema / e2e 或等价运行回归

## Implementation Units

### Unit 1：数据库候选发现与 runtime routing artifact contract

**Goal**  
为数据库文档生成建立清晰的两层事实边界：

- `fact-inventory.database[]`：静态候选发现
- `database-routing.json`：运行时 secret 解析、probe、route、fallback、selected connection

**Files**

- Modify: `skills/spec-graph-bootstrap/SKILL.md`
- Modify: `skills/spec-graph-bootstrap/references/artifact-schemas.md`
- Modify: `docs/10-prompt/skills/spec-graph-bootstrap/SKILL.md`
- Add: `docs/contracts/spec-graph-bootstrap/database-routing.schema.json`
- Modify: `docs/contracts/spec-graph-bootstrap/fact-inventory.schema.json`
- Modify: `src/bootstrap-compiler/derive-bootstrap-facts.js`
- Modify: `src/bootstrap-compiler/compile-machine-artifacts.js`
- Modify: `src/bootstrap-compiler/compile-routing.js`
- Modify: `src/bootstrap-compiler/run-bootstrap.js`
- Modify: `src/bootstrap-compiler/schema-loader.js`
- Modify: `src/bootstrap-compiler/sample-generator.js`
- Modify: `tests/fixtures/bootstrap/spec-first-bootstrap-sample.js`
- Modify: `tests/unit/spec-graph-bootstrap-contracts.test.js`
- Modify: `tests/unit/spec-graph-bootstrap-compiler.test.js`
- Modify: `tests/e2e/spec-graph-bootstrap-mainline.sh`

**Approach**

- 收紧 `fact-inventory.database[]` 的字段语义，使其只表达：
  - 配置来源
  - 候选连接名
  - 猜测的 `db_type`
  - 猜测的数据库名
  - 使用到的 credential key 名
  - 置信度与证据
- 新增 `database-routing.json`，表达：
  - `candidate_connections[]`
  - `secret_resolution[]`
  - `probe_attempts[]`
  - `route_decisions[]`
  - `selected_connections[]`
  - `generation_blockers[]`
- 把 `database-routing.json` 纳入 bootstrap control-plane output，并登记到 artifact manifest。
- 本轮只对 `db_type=mysql` 的 direct generation 主路径做 runtime routing contract 硬化；非 MySQL 仍保持 discovery-only 或 future scope。

**Patterns to follow**

- `docs/contracts/spec-graph-bootstrap/*.schema.json` 现有 schema 组织方式
- `src/bootstrap-compiler/compile-machine-artifacts.js` 的 machine artifact 产出模式
- `src/bootstrap-compiler/run-bootstrap.js` 的 control-plane artifact 写入模式
- `tests/fixtures/bootstrap/spec-first-bootstrap-sample.js` 的 sample 与 compiler 对齐模式

**Execution note**

- contract-first

**Test scenarios**

- Happy path：单连接 MySQL 项目，secret 解析成功、MCP probe 成功，写出 `database-routing.json`
- Happy path：单连接 MySQL 项目，MCP probe 失败、CLI probe 成功，route 明确记录为 CLI，且有 `fallback_reason`
- Edge case：多连接项目，A 连接成功、B 连接失败，routing artifact 能分别记录
- Error path：缺少必要 secret key，只记录阻断原因，不写假成功 route
- Error path：发现数据库候选，但 `db_type` 非 MySQL，本轮不进入 direct generation，且边界表达清楚
- Integration：artifact manifest、schema loader、sample generator、compiler 输出保持一致

**Verification**

- Done：`fact-inventory.database[]` 与 `database-routing.json` 边界清晰，且新增 artifact 已纳入 schema / manifest / sample / tests
- Evidence：`tests/unit/spec-graph-bootstrap-contracts.test.js`、`tests/unit/spec-graph-bootstrap-compiler.test.js`、`tests/e2e/spec-graph-bootstrap-mainline.sh`
- Not done：secret / probe / fallback 仍混在 `fact-inventory.database[]` 中，或 `database-routing.json` 只有 prompt 文案没有 compiler / schema / sample 支撑

### Unit 2：database worker 消费 routing artifact，并显式收口 route / fallback / provenance

**Goal**  
让 database worker 基于新的 routing artifact 做显式 route 消费、逐连接成功/失败处理与 provenance 收口，而不是依赖隐式等级判断；本轮不把 bootstrap runtime 真正生成 `database/*` 文档作为完成定义。

**Files**

- Modify: `skills/spec-graph-bootstrap/SKILL.md`
- Modify: `skills/spec-graph-bootstrap/references/database-worker.md`
- Modify: `docs/10-prompt/skills/spec-graph-bootstrap/SKILL.md`
- Modify: `src/bootstrap-compiler/run-bootstrap.js`
- Modify: `tests/unit/spec-graph-bootstrap-contracts.test.js`
- Modify: `tests/unit/spec-graph-bootstrap-compiler.test.js`
- Modify: `tests/e2e/spec-graph-bootstrap-mainline.sh`

**Approach**

- database worker 不再把 `db_access_level` 当作唯一执行树，而是消费：
  - 静态候选发现事实
  - `database-routing.json` 中的 selected connection 与 route decision
- 逐连接处理：
  - probe 成功的连接进入“可生成 / 可查询”的下游语义
  - probe 失败的连接只记录错误与 provenance
- 明确禁止静默 `MCP -> CLI` 自动切换：如果 route 从 MCP 切到 CLI，必须来自 routing artifact 的显式决策记录。
- `references/database-worker.md` 的主要任务是表达 future database generation 应如何消费 route artifact，而不是在本轮同时把 compiler/runtime 产出链全部实现完。
- 本轮若需要 runtime 侧最小接入，只允许做到：
  - 把 routing artifact 写入 control-plane
  - 把 database worker 的消费语义接到 prompt / contract / tests
  - 明确 runtime 当前尚未承诺产出 `database/*` 文档

**Patterns to follow**

- `database-worker.md` 当前的分层产出逻辑
- `run-bootstrap.js` 现有“失败不中断主 bootstrap、写 generation_errors”的降级模式

**Execution note**

- behavior-hardening

**Test scenarios**

- Happy path：route 明确为 MCP 时，database worker contract 明确使用 MCP 作为后续 generation / query 路径
- Happy path：route 明确为 CLI 时，database worker contract 明确使用 CLI 作为后续 generation / query 路径
- Edge case：多连接项目中有 1 个成功连接、其余失败，route / fallback / provenance 仍能逐连接表达
- Error path：routing artifact 中没有可用 selected connection，database worker contract 明确降级并写明 `generation_blockers`
- Integration：即使当前 runtime 尚未真正写出 `database/*` 文档，route 来源、fallback 原因与下游消费边界也清楚可检验

**Verification**

- Done：database worker contract 已由 routing artifact 驱动，且失败 provenance 能区分 secret / probe / route / generation 各层；本轮不要求 runtime 真正产出 `database/*`
- Evidence：`tests/unit/spec-graph-bootstrap-contracts.test.js`、`tests/unit/spec-graph-bootstrap-compiler.test.js`、`tests/e2e/spec-graph-bootstrap-mainline.sh`
- Not done：worker 仍主要靠隐式 `Level1/Level2` 分支或 route 切换无显式 provenance；或计划把 `database/*` runtime 产出写成已完成，但当前 compiler/runtime 实际并未实现

### Unit 3：`spec-compound` 双视角检索强化

**Goal**  
在当前已存在的双视角基础上，进一步强化 retrieval 的主消费面，尤其明确 `LLM Reuse Context` 的优先消费语义，而不是重新发明双视角结构。

**Files**

- Modify: `skills/spec-compound/SKILL.md`
- Modify: `skills/spec-compound/assets/resolution-template.md`
- Modify: `docs/10-prompt/skills/spec-compound/SKILL.md`
- Modify: `docs/10-prompt/skills/spec-compound/assets/resolution-template.md`
- Modify: `agents/research/learnings-researcher.md`
- Modify: `docs/10-prompt/agents/research/learnings-researcher.md`
- Modify: `tests/unit/spec-compound-contracts.test.js`
- Modify: `tests/unit/asset-consistency.test.js`
- Modify: `tests/unit/agent-namespace-neutrality-contracts.test.js`

**Approach**

- 在 `spec-compound` 中明确：
  - 双视角是 durable contract，而不是可有可无的 embellishment
  - `LLM Reuse Context` 必须优先填充 repo-factual 内容
  - `Constraints / Code Touchpoints / Patterns to Reuse / Anti-patterns to Avoid / Provenance` 是最小稳定消费面
- 在 `learnings-researcher` 中明确：
  - 双视角存在时，优先抽取 `LLM Reuse Context`
  - `Human Summary` 用于快速总结 outcome / validation / remaining risks
  - 缺少双视角 section 的旧文档不是错误，回退到 track-specific sections
- 模板层只做“加强稳定 section 约束”的修改，不新建第二模板体系。

**Patterns to follow**

- `spec-compound` 现有 single durable file contract
- `spec-compound-contracts.test.js` 现有 dual-view 断言
- `learnings-researcher.md` 当前的 grep-first retrieval 策略

**Execution note**

- retrieval-first

**Test scenarios**

- Happy path：新文档模板明确保留 `Human Summary` 与 `LLM Reuse Context`
- Happy path：`learnings-researcher` 在双视角存在时优先使用 `LLM Reuse Context`
- Edge case：旧文档缺少双视角时，检索正常降级，不报错
- Integration：source / docs mirror / agent 文案保持一致

**Verification**

- Done：双视角成为明确 retrieval contract，且 `learnings-researcher` 的主消费路径已切向 `LLM Reuse Context`
- Evidence：`tests/unit/spec-compound-contracts.test.js`、`tests/unit/asset-consistency.test.js`、`tests/unit/agent-namespace-neutrality-contracts.test.js`
- Not done：双视角仍然只是模板文字，`learnings-researcher` 对其存在与否没有消费差异

### Unit 4：`spec-compound-refresh` section-aware refresh 强化

**Goal**  
让 `spec-compound-refresh` 对双视角文档的维护更细粒度、更可解释，优先做 section-level 漂移修复，而不是整篇重写；默认只改 refresh contract 与测试，不默认修改模板。

**Files**

- Modify: `skills/spec-compound-refresh/SKILL.md`
- Modify: `docs/10-prompt/skills/spec-compound-refresh/SKILL.md`
- Modify: `tests/unit/spec-compound-contracts.test.js`
- Modify: `tests/unit/asset-consistency.test.js`
- Optional Modify: `skills/spec-compound-refresh/assets/resolution-template.md`（仅当新的 refresh 规则确实需要稳定模板提示）
- Optional Modify: `docs/10-prompt/skills/spec-compound-refresh/assets/resolution-template.md`（如上）

**Approach**

- 明确 section-aware refresh 规则：
  - 路径 / 模块移动：优先更新 `Code Touchpoints`
  - 证据来源变化：优先更新 `Provenance`
  - 复用建议变化：优先更新 `Patterns to Reuse / Anti-patterns to Avoid`
  - 结论与对外摘要变化：才更新 `Human Summary`
- 明确旧文档升级策略：
  - 缺双视角不是错误
  - refresh 命中且证据充分时，可机会式补齐
  - 无证据时不得脑补
- 继续坚持：不为 LLM 视角新建第二 durable artifact。
- 模板默认不改；只有当新的 refresh contract 需要稳定模板提示，才修改 `spec-compound-refresh` 自己的模板，而不是默认改 `spec-compound` 主模板。

**Patterns to follow**

- `spec-compound-refresh` 现有 Update / Replace / Consolidate 边界
- 当前 dual-view section 的兼容性语义

**Execution note**

- section-aware

**Test scenarios**

- Happy path：refresh 说明明确区分 section-level update 与 Replace
- Edge case：旧文档缺少双视角时，refresh 将其视为 upgrade opportunity，而不是 schema failure
- Edge case：只有路径漂移时，不要求整篇重写
- Error path：证据不足时，不得脑补 `LLM Reuse Context`
- Integration：`spec-compound` 与 `spec-compound-refresh` 对双视角的 contract 叙述保持一致

**Verification**

- Done：refresh contract 已支持 section-aware 更新与机会式升级，且与 `spec-compound` 的单文件双视角语义一致
- Evidence：`tests/unit/spec-compound-contracts.test.js`、`tests/unit/asset-consistency.test.js`
- Not done：refresh 仍只能在“整篇不动 / 整篇替换”之间二选一，或对旧文档缺失双视角直接报 schema 错

## Phased Delivery

### Phase 1

- 完成 Unit 1 + Unit 2
- 收口数据库路由、fallback 与 provenance 的静态 / 运行时边界

### Phase 2

- 完成 Unit 3
- 让双视角真正进入 retrieval 主路径

### Phase 3

- 完成 Unit 4
- 把 dual-view refresh 收口成 section-aware 维护模式

## Implementation Units

- [x] Unit 1：数据库候选发现与 runtime routing artifact contract
- [x] Unit 2：database worker 消费 routing artifact，并显式收口 route / fallback / provenance
- [x] Unit 3：`spec-compound` 双视角检索强化
- [x] Unit 4：`spec-compound-refresh` section-aware refresh 强化

## Final Review Checklist

- [x] `fact-inventory.database[]` 已收紧为静态候选连接事实
- [x] `database-routing.json` 已成为 runtime-only 路由真源，并纳入 schema / manifest / sample / tests
- [x] secret 未以明文写入任何 plan、docs、sample 或 runtime artifact
- [x] `MCP -> CLI` 不再存在静默自动切换，route 切换均有显式 provenance
- [x] 多连接项目支持部分成功 / 部分失败表达，不再整批黑盒成功或失败
- [x] 数据库 direct generation 本轮范围已明确收口为“只硬化 MySQL 主路径 contract，不承诺本轮 runtime 真正生成 `database/*`”
- [x] `spec-compound` 继续保持单文件双视角，不新增 sidecar durable artifact
- [x] `learnings-researcher` 已优先消费 `LLM Reuse Context`
- [x] `spec-compound-refresh` 已具备 section-aware refresh 规则
- [x] 旧文档缺失双视角时采用机会式升级，而不是 schema error
- [x] `spec-graph-bootstrap` 未引入新的 reference mirror 层，继续只 mirror `SKILL.md`
- [x] source / docs mirror / contract tests 三件套同步更新，且 graph-bootstrap `references/*.md` 仍按 source + `docs/contracts/` + tests 治理

## Next Action

本计划已完成执行，当前代码与文档状态已收口到以下结果：

1. `spec-graph-bootstrap` 已具备数据库静态候选发现与 `database-routing.json` 运行时路由 contract。
2. `spec-compound` / `spec-compound-refresh` 已把双视角检索优先级与 section-aware refresh 写入 source、mirror 与测试守卫。
3. 后续若继续扩展数据库 direct generation runtime，应另起计划，不再复用本计划的完成定义。
