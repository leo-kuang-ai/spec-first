---
title: First Skill 项目认知编译器优化方案
date: 2026-03-15
author: Anthropic SDD 技术研发团队
status: proposal
version: 1.1
---

# First Skill 项目认知编译器优化方案

> 面向目标：服务 1-10 万行、10-100 万行存量项目的需求迭代，使 `first` 成为后续 `spec/design/task/code/verify` 的统一项目认知输入层。

---

## 一、执行摘要

当前 `first` 已具备项目级认知的雏形：能够生成技术栈、代码结构、API、领域模型、架构等文档，并维护 `.spec-first/runtime/first/` 作为机器真源。

但从“支撑存量项目需求迭代”的目标看，当前 `first` 仍停留在 **项目介绍文档生成器** 阶段，尚未升级为 **项目认知编译器**：

- 能回答“项目现在长什么样”
- 还不能稳定回答“这个项目一贯应该怎么做”
- 还不能为后续 skill 提供按阶段裁切的最小充分上下文
- 还不能从存量实现中总结 API、配置、组件、模块、测试等项目规范

本方案提出：

1. 将 `first` 的产品定位升级为 **Project Cognition Compiler**
2. 将输出分为四层：
   - `Project Facts`
   - `Project Conventions`
   - `Context Slices`
   - `Human Projection`
3. 明确 `spec/design/task/code/verify` 的消费契约
4. 面向存量项目补齐“事实 + 规范 + 变更导航 + 恢复入口”
5. 以 `runtime truth first, docs as projection` 为原则推进实现

一句话结论：

> `first` 不应只是生成项目分析文档，而应把存量项目实现“编译”为后续各 skill 可消费的项目认知资产。

---

## 二、背景与目标

### 2.1 业务背景

Spec-First 的核心使用场景不是从零开始的新项目，而是：

- 接手已有存量项目
- 在存量项目上进行需求迭代
- 在多阶段、多角色、多 skill 协作中保持上下文稳定

这类场景的首要问题不是“如何立即写 spec”，而是：

- 先了解项目当前实现
- 明确项目约束与设计习惯
- 识别变更影响面
- 给后续阶段提供统一、稳定、可压缩的输入上下文

### 2.2 目标定义

`first vNext` 的目标不是提升文档数量，而是提升后续 skill 的输入质量。

成功的 `first` 应满足：

1. 能从存量实现中抽取稳定项目事实
2. 能从存量实现中归纳项目规范
3. 能按角色、阶段、任务类型裁切上下文
4. 能支撑新会话恢复与多代理协作
5. 能随仓库变化增量更新，而不是每次全量重扫

### 2.3 非目标

本方案不把以下事项作为当前阶段强依赖：

- 一次性引入完整独立 memory backend
- 自动修复项目中的所有不一致规范
- 让 `first` 直接替代 feature 级 `findings.md` / `gate-history.jsonl`
- 把 `first` 变成重型知识库服务

---

## 三、现状评估

### 3.1 已有能力

当前 `first` 已经具备以下基础：

- 生成人类可读文档：`docs/first/*.md`
- 维护机器真源：`.spec-first/runtime/first/`
- 提供项目摘要、角色视图、阶段视图
- 支持 quick/deep 两种模式
- 已有 runtime context resolver，可为后续 skill 注入部分摘要
- 宿主入口已切换为动态代理链路，Claude/Codex 入口会先执行 `spec-first skill render <skill>`，再由 `loadSkill()` 注入运行时上下文

### 3.2 当前短板

围绕存量项目迭代目标，当前存在 7 个关键缺口：

1. **定位偏浅**
   - 当前更像“项目概览输出器”
   - 还不是“后续 skill 输入层”

2. **规范层缺失**
   - 缺少 `api-conventions`、`config-conventions`、`component-conventions` 等由存量实现归纳出的项目规范

3. **变更导航不足**
   - 缺少 `change-map`、`critical-flows`、`entry-guide`
   - 难以支撑需求迭代中的影响面定位

4. **消费契约不完整**
   - 后续 skill 尚未系统化声明“应该读取哪些 first 资产”

5. **rich asset 消费链未打通**
   - 代码层已具备 first runtime 注入能力
   - 当前宿主入口已经接入动态链路
   - 但注入内容仍以摘要级为主，尚未形成丰富的 first 资产消费链

6. **文档与 runtime 的角色边界尚未完全产品化**
   - 机器真源与人类视图已分层
   - 但尚未明确“docs 不是后续 skill 主输入”的产品契约

7. **docs/first 处于双轨状态**
   - 当前只有极少数文档受 runtime 真源投影驱动
   - 其余文档虽然存在于 `docs/first/`，但不在 runtime 健康检查与自动刷新闭环内

### 3.3 核心判断

当前的主要问题不是“文档不够多”，而是：

> 缺少一层面向后续 skill 消费的、基于存量实现编译出的项目认知资产。

进一步说，当前系统最需要解决的不是“多生成几份文档”，而是以下三个结构性问题：

1. **truth model 不统一**
   - runtime 真源只覆盖 3 个 JSON
   - `docs/first` 却仍被整体感知为 first 正式产物

2. **consumption model 不完整**
   - 后续 skill 只消费 summary 级信息
   - rich docs 和 rich assets 没有进入统一注入路径

3. **migration model 缺失**
   - 现有 `docs/first/*.md` 中哪些要转正、哪些要降级、哪些要淘汰，当前没有明确策略

---

## 四、借鉴系统分析与吸收原则

本方案结合多个参考系统的优点，但不机械复制。

### 4.1 cc-sdd：Steering 项目记忆

借鉴点：

- `product.md`
- `tech.md`
- `structure.md`

吸收原则：

- 将 Steering 作为项目级稳定认知层
- 解决“项目是什么”“技术约束是什么”“代码结构如何演进”

落地到 `first vNext`：

- `product-steering`
- `tech-steering`
- `structure-steering`

### 4.2 Planning-Files：Context Engineering + 5-Question Reboot

借鉴点：

- 文件即外部记忆
- 新会话通过固定问题快速恢复上下文

吸收原则：

- `first` 产物必须同时服务“首次理解”和“后续恢复”
- 面向大项目，必须有轻量、稳定、可压缩的恢复切片

落地到 `first vNext`：

- `reboot-guide`
- `summary-lite`
- `stage-slices`

### 4.3 Trellis：Read Before Write + 知识捕获

借鉴点：

- 修改前先读取规范
- 把经验沉淀为可复用知识

吸收原则：

- 后续 skill 不应裸读大量源码，而应优先读取 first 产物
- `first` 需要产出“规范”和“导航”，不只是“事实”

落地到 `first vNext`：

- `api-conventions`
- `config-conventions`
- `common-playbooks`
- `known-risks-and-traps`

### 4.4 Spec Kit：Constitution 权威层级

借鉴点：

- Constitution > Spec > Design > Code

吸收原则：

- `first` 需要声明项目级规则与权威顺序
- 规范冲突时必须知道以谁为准

落地到 `first vNext`：

- `project-rules`
- `authority-order`

### 4.5 Gentle-AI：runtime truth + memory abstraction

借鉴点：

- 结构化 runtime 资产
- 独立 memory 抽象

吸收原则：

- 当前优先做 runtime truth 与 context slices
- memory backend 放到下一阶段

落地到 `first vNext`：

- 扩充 `.spec-first/runtime/first/*.json`
- 预留 memory topic key / asset id

### 4.6 总体吸收策略

本方案采用：

- `cc-sdd` 的稳定项目画像
- `Planning-Files` 的恢复导向
- `Trellis` 的规范优先与知识捕获
- `Spec Kit` 的权威层
- `Gentle-AI` 的结构化真源思路

但最终形成的是 Spec-First 自己的方案：

> 项目认知编译器 + 阶段化消费契约 + runtime 真源优先。

---

## 五、First vNext 产品定位

### 5.1 新定位

`first vNext` 定位：

> 将存量项目实现编译为可供后续 skill 消费的项目认知资产。

### 5.2 与当前定位的差异

当前定位：

- 生成项目分析文档
- 用于快速了解项目

目标定位：

- 生成项目事实
- 归纳项目规范
- 产出阶段切片
- 支撑需求迭代
- 服务会话恢复
- 服务多代理协作

### 5.3 核心产品原则

1. **Runtime Truth First**
   - `.spec-first/runtime/first/` 是机器真源
   - `docs/first/` 是投影视图

2. **Facts + Conventions**
   - 不仅提取事实，还要归纳规范

3. **Read Less, Know More**
   - 后续 skill 读切片，不读整仓

4. **Stage-Oriented Consumption**
   - 按阶段提供不同输入

5. **Brownfield First**
   - 优先服务存量项目，不以 Greenfield 为默认假设

6. **Incremental Refresh**
   - 基于变更增量刷新，而不是全量重扫

7. **Evidence-Based Convention Mining**
   - 规范必须基于现有实现证据，不得臆造

8. **Canonical Before Richness**
   - 先统一 canonical truth 与消费链路
   - 再逐步扩 rich assets，避免体系再次分叉

9. **Migrate, Do Not Fork**
   - 优先把现有 `docs/first` 收敛到新模型
   - 避免再引入一套全新产物而保留旧体系长期并存

### 5.4 最佳整体方案判断

基于当前代码现状，最佳方案不是：

- 继续把更多 markdown 当作 first 正式产物
- 一次性引入大量新的 runtime schema
- 在未统一消费链路前，先做 memory backend

最佳方案应是一个三阶段收敛方案：

1. **先统一 canonical truth**
   - 明确哪些是正式 runtime 资产
   - 明确哪些 docs 是正式投影视图
   - 明确哪些 docs 属于 legacy / snapshot / reference

2. **再统一 skill consumption**
   - 让后续 skill 从 runtime assets 读取稳定上下文
   - 从 summary-only 升级到 asset-slice consumption

3. **最后扩 rich cognition assets**
   - steering
   - conventions
   - change / recovery slices

这一路线能兼顾：

- 对当前代码实现的延续性
- 对存量 `docs/first` 的收敛治理
- 对未来 rich cognition 的可扩展性

### 5.5 目标全景图与实施边界

为避免团队把“目标全景图”误读为“一次性全部落地范围”，这里明确区分：

#### 目标全景图

- 描述终态能力边界
- 用于判断架构方向是否正确

#### 当前实施边界

- 只覆盖当前阶段必须落地的最小 canonical truth
- 只覆盖能立即提升后续 skill 消费质量的资产
- 不追求一次性完成全量 schema

因此，文档中出现的全部资产清单，应默认理解为：

> 这是目标版图，不等于首批实施范围。

### 5.6 最佳实践总则

从产品、架构与多 agent 协作三个维度看，当前阶段应严格遵守以下总则：

1. **Canonical Before Richness**
   - 先统一真源与消费链路，再扩 richer assets。

2. **Migration Before Expansion**
   - 先处理 `docs/first` 双轨，再增加新的 canonical assets。

3. **Consumption Before Projection**
   - 新资产只有在进入至少一个后续 skill 的稳定消费链后，才值得成为 canonical。

4. **Gate Before Writeback**
   - `wrap_up / done` 的回写必须先经过项目级认知 gate，禁止无门槛回写。

5. **Docs Are Projection**
   - `docs/first` 永远是 runtime truth 的投影视图，不再作为手工维护主路径。

6. **Small Closed Loop First**
   - 先做小闭环：`summary/role-views/stage-views + steering + project-rules + change-map + critical-flows`。
   - 再做大增强：更细 conventions、大项目分片、长期记忆后端。

---

## 六、目标架构

```text
存量项目代码 / 配置 / 测试 / 文档
  ↓
First Scanner / Analyzer
  ↓
┌────────────────────────────────────────────┐
│ L1 Project Facts                           │
│ 项目事实层                                 │
├────────────────────────────────────────────┤
│ summary / tech / structure / api / domain │
│ architecture / call-graph / deps / setup  │
└────────────────────────────────────────────┘
  ↓
┌────────────────────────────────────────────┐
│ L2 Project Conventions                     │
│ 项目规范层                                 │
├────────────────────────────────────────────┤
│ api-conventions / config-conventions       │
│ component-conventions / module-conventions │
│ testing-conventions / logging-conventions  │
└────────────────────────────────────────────┘
  ↓
┌────────────────────────────────────────────┐
│ L3 Context Slices                          │
│ 阶段/角色/任务切片层                        │
├────────────────────────────────────────────┤
│ role-views / stage-views / critical-flows  │
│ change-map / entry-guide / reboot-guide    │
└────────────────────────────────────────────┘
  ↓
┌────────────────────────────────────────────┐
│ L4 Human Projection                        │
│ 面向人的投影视图层                          │
├────────────────────────────────────────────┤
│ docs/first/*.md                            │
└────────────────────────────────────────────┘
  ↓
后续 skill 消费
spec / design / task / code / verify / onboarding
```

### 6.1 多 Agent 协作职责矩阵

为了让方案真正服务多 agent SDD，必须把“谁负责生产、谁负责消费、谁负责维护项目认知层”定义清楚。

| 角色 / Skill | 核心职责 | 对项目认知层的动作 | 禁止事项 |
|-------------|----------|--------------------|----------|
| `first` | 建立项目级 canonical truth | 初始化与刷新 `summary / role-views / stage-views`，并逐步扩展 `steering / conventions / change-map / critical-flows` | 不直接承诺全部 `docs/first` 都是 canonical |
| `spec` | 定义需求边界与验收 | 读取 `product-steering / project-rules / api-conventions` | 不绕过项目规则另起一套规范 |
| `design` | 形成技术方案 | 读取 `tech-steering / structure-steering / critical-flows` | 不把 feature 级临时设计直接写成项目级真相 |
| `task` | 拆解变更影响面 | 读取 `change-map / entry-guide / testing-conventions` | 不在缺少影响面时硬拆任务 |
| `code` | 按既有项目方式实现 | 读取 `module / api / component / error` 相关 conventions | 不把个人实现习惯提升为项目规范 |
| `verify` | 验证行为与约束 | 读取 `critical-flows / api-conventions / testing-conventions` | 不只做功能正确而忽略项目级契约 |
| `wrap_up / done` | 维护项目认知层 | 触发 cognition diff、经过 gate 后回写 canonical truth、刷新 docs projection | 不直接手工维护大量 markdown |

这意味着：`first` 不是唯一维护者，`done` 也不是任意写回者。二者共同形成“建立真源”和“持续维护真源”的双环。

---

## 七、当前 First 产物与流程节点作用线图

### 7.1 当前产物总览

当前 `first` 已有产物可分为两类：

```text
.spec-first/runtime/first/
├── index.json
├── summary.json
├── role-views.json
└── stage-views.json

docs/first/
├── README.md
├── summary.md
├── role-views.md
├── stage-views.md
```

其中，上述 4 份 `docs` 文档是当前 **runtime 真源正式投影视图**。

仓库中还存在另一组 `docs/first/*.md` 文档：

```text
docs/first/
├── tech-stack.md
├── api-docs.md
├── codebase-overview.md
├── domain-model.md
├── architecture.md
├── call-graph.md
├── external-deps.md
├── local-setup.md
└── development-guidelines.md
```

这组文档当前的代码状态是：

- 仍存在于仓库中
- 仍在 README 和人工认知中被当作 `first` 产物
- 但不在 `.spec-first/runtime/first/` 的正式真源 schema 内
- 不会被 `refreshFirstDocsFromRuntime()` 从 runtime 真源持续刷新
- 不会被 `check-health` 作为 runtime 真源资产进行校验

### 7.2 当前产物在流程节点中的作用

```text
用户接手存量项目
  ↓
执行 /spec-first:first
  ↓
生成 runtime 真源
  ├── summary.json        → 项目概览输入
  ├── role-views.json     → onboarding 角色视角输入
  └── stage-views.json    → spec/design/code/verify 阶段摘要输入
  ↓
生成 docs 投影视图（当前真源正式覆盖）
  ├── README.md           → runtime 导航投影视图
  ├── summary.md          → runtime 项目摘要投影视图
  ├── role-views.md       → runtime 角色视图投影视图
  └── stage-views.md      → runtime 阶段视图投影视图
  ↓
仓库中共存的 first 文档（当前未纳入正式真源闭环）
  ├── README.md           → 人工导航入口
  ├── tech-stack.md       → 技术栈快速浏览
  ├── api-docs.md         → 命令/API 概览
  ├── codebase-overview.md→ 模块概览
  ├── domain-model.md     → 实体概览
  ├── architecture.md     → 架构概览
  ├── call-graph.md       → 入口链路概览
  ├── external-deps.md    → 依赖概览
  ├── local-setup.md      → 环境准备
  └── development-guidelines.md → 基础规范浏览
  ↓
后续流程节点消费
  ├── onboarding → 主要消费 role-views / summary
  ├── spec       → 主要消费 stage-views.spec（当前仅摘要）
  ├── design     → 主要消费 stage-views.design（当前仅摘要）
  ├── task       → 主要消费 summary / docs 降级阅读
  ├── code       → 主要消费 stage-views.code（当前仅摘要）
  └── verify     → 主要消费 stage-views.verify（当前仅摘要）
```

### 7.3 当前流程节点作用分析

当前体系的优点：

- 已有项目级认知真源
- 已有按角色、按阶段切片的雏形
- 已有面向人的阅读投影视图
- 宿主动态入口已打通，后续 skill 的 runtime notice 注入机制已具备实际生效条件

当前体系的不足：

- `spec/design/task/code/verify` 消费深度不足，阶段输入还停留在 summary 级
- 规范类信息仍散落在 `development-guidelines` 与仓库实现中，未形成专门输入资产
- `task/code/verify` 缺少面向“需求迭代”的 `change-map`、`critical-flows`、`entry-guide`
- `docs/first` 中只有 4 份文档属于 runtime 投影视图，其余文档未纳入真源刷新与健康校验闭环
- docs 更多服务人工浏览，尚未成为稳定的结构化流程输入

### 7.4 当前流程线图

```text
Brownfield Project
  ↓
/spec-first:first
  ↓
First Runtime
  ├── summary
  ├── role-views
  └── stage-views
  ↓
Docs Projection
  ├── overview docs
  └── deep docs
  ↓
后续 skill
  ├── onboarding: 读取 role/summary
  ├── spec:       读取 stage summary
  ├── design:     读取 stage summary
  ├── task:       主要回退到 docs/人工理解
  ├── code:       读取 stage summary
  └── verify:     读取 stage summary

问题：
  1. facts 已有，但 conventions 缺失
  2. summaries 已有，但 task-oriented slices 缺失
  3. 动态注入已接通，但注入内容仍停留在摘要级
  4. docs 可读，但只有少量 docs 属于 runtime 投影视图
  5. skill consumption contract 不完整
```

---

## 八、输出分层设计

### 8.0 基于当前代码实现的修订判断

基于对当前代码链路的审查，本方案对 `first` 现状补充以下正式判断：

1. **动态宿主链路已接通**
   - `src/shared/skill-commands.ts` 已生成动态代理入口
   - `src/cli/commands/skill.ts` 会调用 `loadSkill()`
   - 因此“宿主入口未接入动态链路”已不是当前代码事实

2. **当前 runtime 真源只有三类资产**
   - `summary.json`
   - `role-views.json`
   - `stage-views.json`

3. **当前正式投影视图只有四份文档**
   - `README.md`
   - `summary.md`
   - `role-views.md`
   - `stage-views.md`

4. **当前后续 skill 的自动消费仍以摘要级为主**
   - `spec/design/code/verify` 主要消费 `stageViewSummary`
   - `onboarding` 主要消费 `roleViewSummary`
   - `task/plan/orchestrate` 主要消费 `firstSummaryLite`

5. **现有大量 `docs/first/*.md` 尚未进入正式 runtime 闭环**
   - 这些文档不应再被默认视为“可自动保持最新”的 canonical truth
   - 后续优化必须决定：
     - 要么将其纳入正式 runtime schema
     - 要么明确降级为历史/辅助文档

### 8.0.1 Canonical / Legacy 分层建议

基于现状，建议将 `first` 产物立即分成两层：

#### Canonical Assets

由 runtime 真源直接维护，并可被后续 skill 稳定消费。

当前包括：

- `summary.json`
- `role-views.json`
- `stage-views.json`
- `docs/first/README.md`
- `docs/first/summary.md`
- `docs/first/role-views.md`
- `docs/first/stage-views.md`

后续新增资产也必须先进入这一层。

#### Legacy / Reference Docs

保留给人类阅读、历史参考、过渡期兼容，但不作为自动注入 truth source。

当前包括：

- `tech-stack.md`
- `api-docs.md`
- `codebase-overview.md`
- `domain-model.md`
- `architecture.md`
- `call-graph.md`
- `external-deps.md`
- `local-setup.md`
- `development-guidelines.md`

这层文档后续应做三选一治理：

1. 升级为 canonical runtime-backed docs
2. 合并进更少量的新 canonical docs
3. 标记为 legacy reference，退出自动更新承诺

### 8.0.2 现阶段最优收敛策略

建议不要同时推进“全量新 schema + 全量旧文档重做”。

最优策略是：

- 先把 legacy docs 切成三类：
  - `migrate now`
  - `keep as reference`
  - `retire later`
- 只优先迁移最能影响后续 skill 消费的资产

推荐优先迁移顺序：

1. `api-docs`
2. `codebase-overview`
3. `domain-model`
4. `development-guidelines`
5. `architecture`
6. `call-graph`
7. `local-setup`
8. `external-deps`
9. `tech-stack`

### 8.1 L1 Project Facts

回答“项目是什么”。

建议产物：

- `summary`
- `product-steering`
- `tech-steering`
- `structure-steering`
- `api-docs`
- `domain-model`
- `architecture`
- `call-graph`
- `external-deps`
- `local-setup`

修订说明：

- `summary`、`role-views`、`stage-views` 应继续保留为最小 canonical nucleus
- `product-steering`、`tech-steering`、`structure-steering` 应是第一批新增 canonical assets
- 不是所有现有 docs 都需要一比一进入 runtime schema；可以通过合并减少资产数量

### 8.2 L2 Project Conventions

回答“这个项目一贯应该怎么做”。

建议产物：

- `project-rules`
- `api-conventions`
- `config-conventions`
- `component-conventions`
- `module-conventions`
- `testing-conventions`
- `error-and-logging-conventions`
- `data-access-conventions`

### 8.3 L3 Context Slices

回答“当前阶段/当前任务应该看什么”。

建议产物：

- `role-views`
- `stage-views`
- `critical-flows`
- `change-map`
- `entry-guide`
- `reboot-guide`
- `known-risks-and-traps`
- `common-playbooks`

### 8.4 L4 Human Projection

回答“人要快速浏览哪些文档”。

建议保留：

- `docs/first/README.md`
- 面向人的各类 markdown 视图

注意：

> 对后续 skill 而言，L1-L3 的 runtime 真源优先，L4 仅作降级兜底。

---

## 九、产物清单与优化建议

### 9.1 现有产物保留并增强

在“保留并增强”之前，应先确定每份文档的归属：

| 文档 | 当前状态 | 建议归属 |
|------|----------|----------|
| `README.md` | canonical projection | 保留并增强 |
| `summary.md` | canonical projection | 保留并增强 |
| `role-views.md` | canonical projection | 保留并增强 |
| `stage-views.md` | canonical projection | 保留并增强 |
| `api-docs.md` | legacy/reference | 优先迁移为 canonical |
| `codebase-overview.md` | legacy/reference | 优先迁移为 canonical |
| `domain-model.md` | legacy/reference | 优先迁移为 canonical |
| `development-guidelines.md` | legacy/reference | 优先迁移为 canonical |
| `architecture.md` | legacy/reference | 第二批迁移 |
| `call-graph.md` | legacy/reference | 第二批迁移 |
| `local-setup.md` | legacy/reference | 视平台类型决定 |
| `external-deps.md` | legacy/reference | 视项目类型决定 |
| `tech-stack.md` | legacy/reference | 建议合并入 `tech-steering` |

#### `summary`

当前问题：

- 只给出项目概览
- 没有产品边界、典型场景、术语表

增强建议：

- 增加目标用户
- 增加核心场景
- 增加非目标
- 增加关键术语

#### `tech-stack`

当前问题：

- 只有技术栈列表
- 缺少技术决策与技术约束

增强建议：

- 增加关键技术选型原因
- 增加兼容边界
- 增加禁止事项
- 升级为 `tech-steering`

#### `codebase-overview`

当前问题：

- 有模块说明
- 缺少改动落点和耦合边界

增强建议：

- 增加模块依赖关系
- 增加“修改某类能力优先进入哪些目录”
- 增加“哪些目录不应成为首个改动入口”
- 可部分升级为 `structure-steering`

#### `api-docs`

当前问题：

- 接口列表化，契约不够

增强建议：

- 增加入参模式
- 增加出参结构
- 增加副作用文件
- 增加命令调用链
- 与 `api-conventions` 拆分

#### `domain-model`

当前问题：

- 更像名词表
- 缺少关系和生命周期

增强建议：

- 增加实体关系
- 增加真源文件映射
- 增加生命周期流转
- 增加 ID 归属规则

#### `architecture`

当前问题：

- 静态结构多
- 动态关键路径少

增强建议：

- 增加 first runtime 链路
- 增加 stage advance 链路
- 增加 orchestrate / gate / trace 关键路径

#### `call-graph`

当前问题：

- 入口有了
- 关键业务链路不足

增强建议：

- 增加 feature init 流
- 增加 stage advance 流
- 增加 gate check 流
- 增加 context injection 流

#### `development-guidelines`

当前问题：

- 偏代码规范
- 缺少项目权威顺序与阶段治理

增强建议：

- 增加 authority order
- 增加 runtime truth 优先级
- 增加生成文档与真源文件的关系
- 与 `project-rules` 形成配套

### 9.2 建议新增产物

新增原则：

- 新增产物必须优先服务后续 skill consumption
- 新增产物必须能进入 runtime schema，而不是只新增 markdown
- 新增产物数量应受控，避免形成新的 docs 膨胀

#### A. Steering 类

- `product-steering.md`
- `tech-steering.md`
- `structure-steering.md`

建议实现方式：

- runtime canonical truth 先落为 `steering.json`
- docs 端再投影为 1-3 份 markdown
- 不建议一开始直接新增 3 份纯 markdown 而没有 runtime 真源

#### B. Convention 类

- `api-conventions.md`
- `config-conventions.md`
- `component-conventions.md`
- `module-conventions.md`
- `testing-conventions.md`
- `error-and-logging-conventions.md`
- `data-access-conventions.md`

建议实现方式：

- 第一阶段只做 `api / module / testing / project-rules`
- `component / config / data-access / error-logging` 视项目类型按需生成
- 避免对不适用的项目强制输出空壳文档

#### C. Change / Recovery 类

- `critical-flows.md`
- `change-map.md`
- `entry-guide.md`
- `reboot-guide.md`
- `common-playbooks.md`
- `known-risks-and-traps.md`
- `project-rules.md`

建议实现方式：

- `critical-flows`、`change-map`、`entry-guide` 是优先级最高的 brownfield assets
- `common-playbooks`、`known-risks-and-traps` 可作为第二阶段增强

---

## 十、优化后的流程图与节点作用设计

### 10.1 优化后的总体流转

```text
Brownfield Project
  ↓
/spec-first:first
  ↓
Repository Scan + Evidence Extraction
  ↓
Runtime Compilation
  ├── Project Facts
  ├── Project Conventions
  └── Context Slices
  ↓
Docs Projection
  └── docs/first/*.md
  ↓
Skill-Specific Injection
  ├── spec    ← product/domain/api-conventions/project-rules/spec-slice
  ├── design  ← tech/structure/architecture/critical-flows/design-slice
  ├── task    ← change-map/codebase/testing-conventions/code-slice
  ├── code    ← change-map/entry-guide/module+component+api conventions/code-slice
  ├── verify  ← critical-flows/testing/api/error-logging/verify-slice
  └── onboarding ← summary/role-views/reboot-guide/entry-guide
  ↓
Feature Lifecycle Execution
  ↓
findings / task_plan / stage-state / reports
```

### 10.1.1 流程主线：Build -> Consume -> Govern -> Writeback

从整体流程看，`first` 方案不应再按“有哪些文档”来理解，而应按四段闭环理解：

1. **Build**
   - `first` 从存量项目实现中编译 canonical truth。
   - 产出的是可被程序消费的项目认知资产，而不是一组孤立 markdown。

2. **Consume**
   - `spec/design/task/code/verify/onboarding` 按阶段读取最小充分切片。
   - 同一项目在不同节点读取不同资产，而不是统一读一份项目总览。

3. **Govern**
   - 在 feature 生命周期结束前，对“本次变化是否应提升为项目级认知”进行治理判断。
   - 这一层由 cognition diff 和 `Project Cognition Gate` 承担。

4. **Writeback**
   - 只有命中项目级变化的需求，才会回写 canonical truth。
   - docs projection 随 truth 自动刷新，作为下一轮需求的最新入口。

如果缺少这四段中的任何一段，系统都会退化：

- 只有 Build，没有 Consume：退化为文档生成器。
- 只有 Consume，没有 Govern：退化为一次性快照输入层。
- 只有 Govern，没有 Writeback：退化为分析建议，无法闭环。

### 10.1.2 各流程阶段的进入条件与退出条件

为了避免执行时只看章节不看门槛，建议把流程阶段定义为：

| 阶段 | 进入条件 | 退出条件 |
|------|----------|----------|
| Build | 项目已完成 `first` 扫描，存在最小 runtime truth | `summary / role-views / stage-views` 可被稳定读取 |
| Consume | 当前 skill 已定位阶段，context resolver 能返回所需 slice | 当前节点成功消费 `required` 资产或稳定 fallback |
| Govern | feature 生命周期进入 `wrap_up / done` | 产出 `must_update / should_update / must_not_update` 判定 |
| Writeback | 判定结果允许回写 | canonical truth 更新完成，docs projection 自动刷新完成 |

这张表的目的，是把“阶段推进”从概念性的路线图，变成可执行的门槛定义。

### 10.2 优化后各流程节点的作用

#### 节点 A：`/spec-first:first`

职责：

- 读取存量项目实现
- 进行事实提取
- 进行规范归纳
- 生成切片资产

相对当前的新增价值：

- 不只产出 overview docs
- 还产出 conventions 与 task-oriented slices

#### 节点 B：Runtime Compilation

职责：

- 将仓库状态编译为结构化真源
- 作为后续 skill 的唯一首选输入层

核心变化：

- 从 `summary/role/stage` 三类资产扩展为 `facts/conventions/slices` 三层资产

#### 节点 C：Docs Projection

职责：

- 给人类提供可读视图
- 给异常场景提供降级兜底

边界：

- 不作为后续 skill 的主输入

#### 节点 D：Skill-Specific Injection

职责：

- 根据不同 skill 裁切不同 first 资产
- 控制上下文规模
- 保证“同一个项目，不同阶段读取不同认知切片”

这是优化方案中最关键的节点。

#### 节点 E：Feature Lifecycle Execution

职责：

- 在 feature 执行层继续沉淀 findings、task plan、stage state、reports
- 与项目级 first 认知层形成上下配合

边界：

- `first` 负责项目级认知
- feature runtime 负责任务级与会话级过程记忆

### 10.3 优化后的作用线图

```text
项目代码/配置/测试
  ↓
first 提取项目事实
  ├── summary
  ├── api-docs
  ├── domain-model
  ├── architecture
  └── call-graph
  ↓
first 归纳项目规范
  ├── api-conventions
  ├── config-conventions
  ├── module-conventions
  ├── component-conventions
  └── testing-conventions
  ↓
first 生成流程切片
  ├── stage-views
  ├── role-views
  ├── critical-flows
  ├── change-map
  ├── entry-guide
  └── reboot-guide
  ↓
skill 注入层按需读取
  ├── spec    读取“产品边界 + 需求相关规范”
  ├── design  读取“架构边界 + 技术约束 + 关键链路”
  ├── task    读取“影响面 + 验证任务 + 改动导航”
  ├── code    读取“实现规范 + 入口导航 + 风险提示”
  └── verify  读取“关键流程 + 验证规范 + 风险区域”
  ↓
feature 流程继续执行
```

### 10.4 当前与优化后流程对比

| 维度 | 当前 | 优化后 |
|------|------|--------|
| `first` 定位 | 项目介绍文档生成器 | 项目认知编译器 |
| 主输出 | summary + docs | facts + conventions + slices + docs |
| 后续 skill 输入 | 以摘要和人工阅读为主 | 以结构化切片注入为主 |
| 规范来源 | 分散在仓库和脑内经验 | 从存量实现归纳成显式资产 |
| `task/code/verify` 支撑 | 弱 | 强 |
| Brownfield 适配 | 初级 | 面向需求迭代优化 |

### 10.5 最佳实施形态：双核一投影

综合当前代码与目标能力，最佳实施形态不是“四层都同权”，而是：

```text
Kernel A: Runtime Canonical Truth
  - summary
  - role-views
  - stage-views
  - steering
  - conventions
  - change/recovery slices

Kernel B: Skill Consumption Layer
  - spec/design/task/code/verify 按需读取 slice
  - host 动态入口统一走 loadSkill()

Projection Layer: Human Docs
  - docs/first/*.md
  - 仅作为阅读视图 / 降级兜底 / 审阅投影
```

这个结构的好处是：

- 把“真源”和“阅读材料”彻底分开
- 避免 docs 双轨继续污染产品认知
- 让未来 memory backend 可以直接挂在 canonical truth 上，而不是挂在 markdown 上

### 10.5.1 当前推荐的最小 canonical nucleus

从最佳实践出发，首批真正应该进入 canonical truth 的资产不应过多，建议限定为：

```text
Level 0 Nucleus
  - summary
  - role-views
  - stage-views

Level 1 Brownfield Boosters
  - steering
  - project-rules
  - api-conventions
  - module-conventions
  - testing-conventions
  - critical-flows
  - change-map
  - entry-guide
```

判断原则：

- Level 0 是系统运行最小闭环
- Level 1 是解决存量项目迭代问题的最小增强闭环
- Level 2 以后才进入更细粒度 conventions 和 playbooks

### 10.6 以终为始的闭环形态：Done 反向更新认知层

如果以“存量项目持续迭代”作为终局目标，那么 `first` 不应只在接手项目时运行一次。

最佳闭环应是：

```text
首次接手项目
  ↓
/spec-first:first
  ↓
建立项目级 canonical truth
  ↓
spec / design / task / code / verify 消费 canonical slices
  ↓
需求完成（wrap_up / done）
  ↓
反向更新 first canonical truth
  ↓
自动刷新 docs projection
  ↓
下一轮需求继续消费最新项目认知
```

这意味着：

- `first` 是初始编译器
- `done / wrap_up` 是持续维护器
- `docs/first` 是自动投影视图
- 项目认知层会随着需求迭代逐轮演化，而不是停留在第一次扫描时的快照

### 10.7 以终为始的成功路径

从“接手一个存量项目，到完成一轮需求迭代并保持项目认知最新”的目标看，系统应该呈现如下成功路径：

1. **项目接手**
   - `first` 建立最小 canonical nucleus。
   - 用户和 agent 可以通过 `README + summary + role-views + stage-views` 形成初始认知。

2. **需求规格阶段**
   - `spec` 读取 `product-steering / project-rules / api-conventions`。
   - 输出的规格不会脱离项目边界和接口习惯。

3. **设计阶段**
   - `design` 读取 `tech-steering / structure-steering / critical-flows`。
   - 设计方案能落在项目既有技术路线和关键链路上。

4. **任务拆解与实现阶段**
   - `task/code` 读取 `change-map / entry-guide / conventions`。
   - 任务拆解围绕真实影响面展开，实现遵循项目既有结构与规范。

5. **验证阶段**
   - `verify` 读取 `critical-flows / testing-conventions / api-conventions`。
   - 验证口径不仅关注功能正确，也关注项目级契约是否满足。

6. **收尾阶段**
   - `wrap_up / done` 识别本次需求是否改变了项目级认知。
   - 若命中 `must_update / should_update`，则进入 `Project Cognition Gate`。
   - gate 通过后更新 canonical truth，并自动刷新 docs projection。

7. **下一轮复用**
   - 下一轮需求不再从零理解项目，而是消费上一轮已更新的项目认知层。

只有当这七步都稳定成立时，`first` 才真正解决“存量项目迭代需要先理解项目、再沿项目规范持续演进”的问题。

---

## 十一、规范归纳层设计

### 11.1 规范文档的定义

规范文档不是人工主观制定的模板，而是：

> 从存量实现中观察、归纳、抽象出来的项目现行规范。

### 11.2 规范文档的结构模板

每份 convention 文档建议包含以下区块：

1. **Scope**
   - 规范适用范围

2. **Observed Patterns**
   - 当前代码中观察到的主流模式

3. **Evidence**
   - 证据文件与典型样例

4. **Deviations**
   - 项目内的不一致点

5. **Recommended Convention**
   - 推荐统一写法

6. **Consumption Guidance**
   - 后续 skill 应如何使用

### 11.3 关键规范文档说明

#### `api-conventions`

用于归纳：

- 路由命名
- 请求输入位置
- 响应格式
- 错误返回
- 分页/过滤/排序
- 鉴权与上下文
- DTO / schema 组织方式

#### `config-conventions`

用于归纳：

- 配置来源优先级
- 环境变量命名
- 默认值策略
- 配置文件布局
- 密钥处理
- 配置校验方式

#### `component-conventions`

用于归纳：

- 组件命名
- 目录结构
- props 设计
- 状态边界
- 样式组织
- 复合组件模式

#### `module-conventions`

用于归纳：

- 分层规则
- 依赖方向
- 新代码放置原则
- shared/util/core 边界

#### `testing-conventions`

用于归纳：

- 测试层级划分
- 哪类改动补哪类测试
- fixture 放置方式
- mock 使用原则
- 验证粒度

#### `error-and-logging-conventions`

用于归纳：

- 错误类型
- 可见错误与系统错误
- 日志字段
- 审计日志落点
- 重试与降级策略

### 11.4 Observed vs Recommended

规范文档必须区分两类信息：

- `Observed Convention`
  - 当前仓库中实际存在的主流模式

- `Recommended Convention`
  - 基于当前模式与治理目标建议统一收敛的规范

这样可以避免两种失败：

- 仅描述现状，导致历史债务被“合法化”
- 仅给出理想建议，导致脱离现有实现

---

## 十二、Context Slice 设计

### 12.1 目标

将大项目认知压缩为后续 skill 的最小充分输入。

### 12.2 核心切片

#### `role-views`

面向：

- 产品
- 开发
- QA
- 架构师
- 后续可扩展到安全、运维、数据

#### `stage-views`

面向：

- `spec`
- `design`
- `code`
- `verify`

每个阶段都应包含：

- 当前阶段关注点
- 必读资产
- 风险提醒
- 关键流程

#### `change-map`

这是存量项目迭代的高价值产物，回答：

- 新增一个能力通常影响哪些模块
- 修改某类需求时通常涉及哪些层
- 哪些测试必须跟着改

#### `critical-flows`

回答：

- 项目级关键链路有哪些
- 哪些链路绝不能断

#### `entry-guide`

回答：

- 面对某类需求，从哪里开始阅读

#### `reboot-guide`

回答：

- 新会话如何在最短时间恢复项目认知

---

## 十三、各 Skill 消费契约

这是 `first vNext` 的核心，不定义清楚就仍然只是“文档生成器”。

### 13.0 Phase-Aware Consumption Contract

各 skill 的消费契约不能只写“最终态必读资产”，还必须声明：

- `required`
- `optional`
- `fallback`

规则如下：

#### `required`

- 当前阶段若不存在，则必须降级阻断或提示先补齐

#### `optional`

- 存在则消费，不存在不阻断

#### `fallback`

- 当前目标资产不存在时，临时回退读取的旧资产或摘要

这样可以保证：

- 文档与代码现状一致
- 分阶段实施不会导致契约先于资产存在
- 后续 agent 不会因为“目标资产未上线”而失效

### 13.1 `spec` 消费契约

`required`：

- `stage-view.spec`

`optional`：

- `product-steering`
- `domain-model`
- `api-conventions`
- `project-rules`

`fallback`：

- `summary`
- `docs/first/domain-model.md`

目的：

- 在现有产品边界和项目规则内定义需求

### 13.2 `design` 消费契约

`required`：

- `stage-view.design`

`optional`：

- `tech-steering`
- `structure-steering`
- `architecture`
- `critical-flows`
- `module-conventions`

`fallback`：

- `summary`
- `docs/first/codebase-overview.md`
- `docs/first/architecture.md`

目的：

- 让设计方案落在现有架构和技术约束上

### 13.3 `task` 消费契约

`required`：

- `firstSummaryLite`

`optional`：

- `change-map`
- `codebase-overview`
- `critical-flows`
- `testing-conventions`
- `stage-view.code`

`fallback`：

- `summary`
- `docs/first/codebase-overview.md`
- `docs/first/stage-views.md`

目的：

- 正确拆分影响面、补齐验证任务

### 13.4 `code` 消费契约

`required`：

- `stage-view.code`

`optional`：

- `change-map`
- `entry-guide`
- `structure-steering`
- `api-conventions`
- `component-conventions`
- `module-conventions`
- `error-and-logging-conventions`

`fallback`：

- `summary`
- `docs/first/codebase-overview.md`
- `docs/first/development-guidelines.md`

目的：

- 保证实现符合项目既有规范，而不是只“能跑”

### 13.5 `verify` 消费契约

`required`：

- `stage-view.verify`

`optional`：

- `critical-flows`
- `api-conventions`
- `testing-conventions`
- `error-and-logging-conventions`

`fallback`：

- `summary`
- `docs/first/stage-views.md`
- `docs/first/development-guidelines.md`

目的：

- 按项目真实约定设计验证策略

### 13.6 `onboarding` 消费契约

`required`：

- `summary`
- `role-views`

`optional`：

- `reboot-guide`
- `entry-guide`
- `product-steering`

`fallback`：

- `docs/first/README.md`
- `docs/first/summary.md`

目的：

- 让新会话或新 agent 在最短时间具备可行动的项目认知

### 13.7 当前到目标的消费演进路径

从代码现状到目标方案，不应一步跳到最终形态，而应按以下路径演进：

#### Step 1

- `spec/design/code/verify` 从单条 `stageViewSummary` 升级为读取对应 stage slice

#### Step 2

- `task/plan/orchestrate` 从 `firstSummaryLite` 升级为读取 `change-map / critical-flows / entry-guide`

#### Step 3

- `spec/design/code/verify` 增加 conventions consumption

#### Step 4

- `onboarding` 增加 `reboot-guide / entry-guide / product-steering`

只有走完这条路径，`first` 才真正完成“输入层”升级。

### 13.7.1 全流程 Skill 覆盖矩阵

为了回答“全流程各节点 skill 是否都被纳入改造”，这里明确列出覆盖范围：

| Skill | 是否消费 first canonical assets | 核心消费资产 | 是否参与认知回写 | 是否需要改造 | 说明 |
|-------|---------------------------------|--------------|------------------|--------------|------|
| `first` | 是 | 全部 canonical truth 生成链 | 否 | 是 | 负责 Build，不负责 feature 级回写 |
| `onboarding` | 是 | `summary / role-views / reboot-guide / steering` | 否 | 是 | 新会话恢复入口 |
| `spec` | 是 | `stage-view.spec / product-steering / api-conventions / project-rules` | 否 | 是 | 需求边界对齐 |
| `design` | 是 | `stage-view.design / tech-steering / structure-steering / critical-flows` | 否 | 是 | 技术方案对齐 |
| `task` | 是 | `firstSummaryLite / change-map / critical-flows / testing-conventions` | 否 | 是 | 影响面拆解 |
| `plan` | 是 | 与 `task` 同链路共享 | 否 | 是 | 当前按 `task/plan/orchestrate` 一组处理 |
| `orchestrate` | 是 | `change-map / entry-guide / critical-flows` | 否 | 是 | 编排时需要最小充分上下文 |
| `code` | 是 | `stage-view.code / change-map / entry-guide / conventions` | 否 | 是 | 实现规范与导航 |
| `verify` | 是 | `stage-view.verify / critical-flows / testing-conventions / api-conventions` | 否 | 是 | 验证项目契约 |
| `wrap_up / done` | 间接是 | 读取 diff、当前 canonical truth、候选更新 | 是 | 是 | 治理与 writeback 唯一入口 |
| `research` | 可选 | `summary / entry-guide / domain-model` | 否 | 视需要 | 旁路支持型 skill，可后续接入 |
| `analyze` | 可选 | `summary / conventions / critical-flows` | 否 | 视需要 | 旁路分析型 skill，可后续接入 |
| `review` | 可选 | `project-rules / conventions / critical-flows` | 否 | 视需要 | 用于把项目认知引入审查口径 |
| `status` | 可选 | `summary / stage-views / role-views` | 否 | 低 | 更多是展示型消费 |
| `sync` | 可选 | `summary / stage-views / project-rules` | 否 | 低 | 主要是状态同步，不是主消费链 |
| `archive` | 可选 | `summary / critical-flows / project-cognition-updates` | 间接 | 视需要 | 可参与归档审计，但不是首批重点 |

这张表的含义是：

- **主流程 skill** 已被纳入方案主链。
- **旁路 skill** 目前是“可选接入”，没有被排除，只是优先级后置。
- **回写权** 依然只有 `wrap_up / done` 一个入口，其他 skill 最多提交建议，不直接写回。

### 13.7.2 资产生成时机与消费时机

为避免“先写消费契约，后补资产实现”的错位，建议统一以下时序：

| 资产类别 | 首次生成时机 | 首批消费方 | 回写时机 |
|---------|--------------|------------|----------|
| `summary / role-views / stage-views` | `first` 初次扫描 | `onboarding/spec/design/code/verify` | 必要时由 `done` 增量更新 |
| `steering` | `Phase 1 Build` | `spec/design/onboarding` | 项目边界或技术路线发生稳定变化时 |
| `conventions` | `Phase 1 Build` | `spec/design/code/verify` | 规范收敛或稳定新增时 |
| `critical-flows / change-map / entry-guide` | `Phase 1 Build` | `task/code/verify` | 关键流程或影响面发生稳定变化时 |
| `reboot-guide` | `Phase 2 Build/Writeback` | `onboarding` | 项目入口和恢复路径变化时 |
| `common-playbooks / known-risks-and-traps` | `Phase 3` 增强 | `code/verify/onboarding` | 多次重复出现后再提升 |

这意味着：

- `reboot-guide` 不应被视为首批硬依赖。
- `common-playbooks` 不应在未定义提炼条件前提前进入主闭环。

### 13.8 `wrap_up / done` 对 first 的反向更新契约

要让这套方案真正解决问题，`wrap_up` / `done` 必须承担项目认知层的增量维护职责。

但这里的更新对象必须明确：

#### 正确更新对象

- 更新 `.spec-first/runtime/first/` 下的 canonical assets
- 再由 runtime truth 自动投影刷新 `docs/first/*.md`

#### 错误更新对象

- 不应直接手工维护全部 `docs/first/*.md`
- 不应让 `done` 直接编辑大量 legacy/reference docs 作为主路径

#### 契约原则

1. `done` 更新 truth，不更新最终展示文本
2. 只更新本次需求确实影响到的 canonical assets
3. 更新后自动刷新 projection docs
4. 若本次需求未影响项目级认知，则不强制更新 first

#### Project Cognition Gate（新增）

为了避免把 feature 级偶发实现误写成项目级真相，`wrap_up / done` 在回写前必须经过轻量 gate。

判定结果分为三类：

1. `must_update`
   - 项目级真相已明确变化，必须回写 canonical truth

2. `should_update`
   - 存在高价值项目认知增量，建议回写，但允许人工确认

3. `must_not_update`
   - 本次变化仅是局部实现、临时 workaround、实验性写法，不应写入项目级真相

#### Gate 判定依据

满足以下任一情况，可判为 `must_update`：

- 新增或修改了稳定 API 契约
- 新增或修改了稳定模块边界
- 新增或修改了项目级规则/规范
- 新增或修改了关键流程与关键验证链路

满足以下情况，通常判为 `must_not_update`：

- 仅修复局部 bug，无项目级模式变化
- 一次性补丁或迁移脚本
- 临时兼容逻辑
- 团队尚未接受的试验性模式

处于两者之间时，判为 `should_update`，并要求补证据。

#### Decider 机制

为了让多 agent 协作下的治理真正闭环，需要明确谁拥有最终裁决权。

建议采用以下规则：

1. `spec/design/code/verify` 只负责提交项目认知更新建议与证据。
2. `wrap_up / done` 负责汇总建议、生成 diff，并触发 gate。
3. `Project Cognition Gate` 是默认自动裁决器。
4. 当 gate 结果为 `should_update`，或多个 skill 的建议互相冲突时，进入人工裁决：
   - 默认由当前需求的主负责人裁决。
   - 若存在项目级规则冲突，以项目 owner 或显式指定的认知维护者为准。

这意味着：

- 多 agent 可以提出更新建议，但不能各自直接写回 canonical truth。
- 真正的写回入口只有一个：`wrap_up / done -> gate -> writeback`。

#### 最小证据门槛

为了避免把 feature 级偶发实现误提升为项目级真相，建议将 `must_update` 的证据门槛定义为：

- 至少满足以下两类证据中的一类组合：
  - 代码/配置真源变化证据
  - 测试/验证证据
  - 文档/规则更新证据
  - 跨 feature 重复出现证据

更具体地说：

1. **代码/配置证据**
   - 命中稳定目录、稳定接口、稳定模块边界或项目级配置。

2. **测试/验证证据**
   - 新增或修改了能够代表项目级行为的测试、验证规则或关键链路校验。

3. **文档/规则证据**
   - 本次变化同时要求 `project-rules`、`conventions`、`critical-flows` 等资产中的至少一项调整。

4. **重复性证据**
   - 同一模式已在多个 feature 中重复出现，不再属于一次性 workaround。

若只具备单点局部实现变化，而没有上述证据组合，应优先判为 `must_not_update` 或 `should_update`。

#### 资产适用性判定

不是每个项目都适合生成所有 canonical assets。为避免生成空壳资产，建议增加适用性判定：

- `api-conventions`
  - 仅在项目存在稳定接口层、路由层或明确输入输出契约时生成。

- `module-conventions`
  - 仅在项目存在明显模块边界或分层结构时生成。

- `testing-conventions`
  - 仅在项目已有测试体系或明确验证脚本时生成。

- `reboot-guide`
  - 仅在项目具备可识别入口、关键路径、恢复入口时生成。

- `common-playbooks / known-risks-and-traps`
  - 仅在重复出现至少两次以上的模式后再提升为项目级资产。

适用性不成立时，允许资产缺席，但必须在 runtime index 或 health 输出中说明“未生成原因”，而不是生成空壳文件。

#### 失败路径与异常处理

除了 happy path，还需要明确以下失败路径：

1. `required` 资产缺失
   - 当前 skill 优先 fallback。
   - 若 fallback 仍不足以支撑当前节点，则提示先刷新 `first` 或补齐对应 canonical asset。

2. `should_update`
   - 默认不自动写回。
   - 先记录到 `project-cognition-updates.jsonl` 的候选项，待人工确认后再写回。

3. `gate` 执行失败
   - 允许 feature 进入完成态，但项目认知层标记为“待治理”。
   - 下一次 `wrap_up / done` 或显式治理操作需要补处理。

4. `writeback` 失败
   - 不回退 feature 本身的完成状态。
   - 记录失败日志，并将 canonical truth 标记为 stale，提示后续修复。

#### 影响判定维度

`wrap_up / done` 需要判断本次需求是否影响以下项目级认知：

- 产品能力边界是否变化
- 模块边界是否变化
- API 契约是否变化
- 配置模型是否变化
- 组件/模块规范是否变化
- 关键流程是否变化
- 常见改动导航是否变化
- 风险/陷阱库是否需要新增经验

只有命中这些维度，才需要回写 first canonical truth。

---

## 十四、Runtime Schema 建议

建议在 `.spec-first/runtime/first/` 中逐步引入以下结构化资产：

```text
.spec-first/runtime/first/
├── index.json
├── summary.json
├── role-views.json
├── stage-views.json
├── steering.json
├── conventions.json
├── critical-flows.json
├── change-map.json
├── entry-guide.json
└── reboot-guide.json
```

注意：

- 这是一组**目标 schema**
- 不代表应在同一阶段一次性全部落地
- 推荐先从 `steering.json + conventions.json + critical-flows.json + change-map.json` 开始

### 14.1 `steering.json`

建议字段：

- `product`
- `tech`
- `structure`
- `patterns`

### 14.2 `conventions.json`

建议字段：

- `api`
- `config`
- `component`
- `module`
- `testing`
- `errorLogging`
- `dataAccess`

每个 convention 至少包含：

- `observedPatterns`
- `deviations`
- `recommendedConvention`
- `evidence`

### 14.3 `change-map.json`

建议字段：

- `changeType`
- `likelyModules`
- `likelyCommands`
- `likelyConfigs`
- `likelyTests`
- `riskPoints`

### 14.4 `critical-flows.json`

建议字段：

- `flowId`
- `name`
- `entryPoints`
- `coreModules`
- `invariants`
- `verificationHooks`

### 14.5 `entry-guide.json`

建议字段：

- `taskCategory`
- `readFirst`
- `thenRead`
- `avoidEntry`
- `relatedFlows`

### 14.6 `project-cognition-updates.jsonl`（建议新增）

为了支持 `done / wrap_up` 对 first 的可审计反向更新，建议增加一份轻量更新日志：

```text
.spec-first/runtime/first/project-cognition-updates.jsonl
```

每条记录包含：

- `timestamp`
- `featureId`
- `stage`
- `updatedAssets`
- `reason`
- `evidence`
- `triggeredBy`

作用：

- 审计哪些需求更新了项目认知层
- 为未来 memory backend 提供输入
- 为 `first` 的增量刷新提供变更依据

---

## 十五、面向不同规模存量项目的适配策略

### 15.1 1-10 万行项目

重点：

- 快速建立完整项目画像
- 文档可适度偏人类可读

推荐产物：

- `summary`
- `tech-steering`
- `structure-steering`
- `api-docs`
- `domain-model`
- `stage-views`
- `role-views`
- `reboot-guide`

### 15.2 10-100 万行项目

重点：

- 降低仓库反复扫描成本
- 提高变更导航和上下文压缩能力

必须增加：

- `change-map`
- `critical-flows`
- `entry-guide`
- `module-conventions`
- `testing-conventions`
- `project-rules`

### 15.3 100 万行以上项目

重点：

- 强化增量刷新
- 按领域/模块分片
- 减少一次性全量上下文加载

建议策略：

- 先输出全局 steering
- 再按子系统输出局部 slices
- 按 task category 选择性注入

---

## 十六、实施路线图

### Phase 0：收紧并校准输入链路（最高优先级）

目标：

- 收紧现有输入链路，使当前 canonical truth 被稳定消费

范围：

- 验证动态宿主链路已全量接通
- 确保 runtime notice 实际生效且范围正确
- 明确 `runtime truth > docs projection`
- 补全 consumption contract

产出：

- 后续 skill 能稳定消费 `summary / role-views / stage-views`

### Phase 0.5：收敛文档双轨（新增，必须）

目标：

- 先治理 `docs/first` 的 canonical / legacy 边界

范围：

- 为 `docs/first` 产物建立归属清单
- README 中显式标注 canonical docs 与 legacy docs
- `check-health` / `first` 文案对外说明“当前正式投影视图范围”

产出：

- 用户和后续 agent 不再误以为所有 `docs/first/*.md` 都是 runtime-backed truth

### Phase 1：建立 Build 与 Consume 主链

目标：

- 让 first 先建立最小 Brownfield 认知资产
- 让后续 skill 开始消费 non-summary 级 canonical assets

范围：

- 新增 steering runtime/schema
- 新增 convention runtime/schema
- 新增 `project-rules`
- 新增 `critical-flows`
- 新增 `change-map`
- 新增 `entry-guide`
- 打通首批 consumption contract

产出：

- `product-steering`
- `tech-steering`
- `structure-steering`
- `api-conventions`
- `module-conventions`
- `testing-conventions`
- `project-rules`
- `critical-flows`
- `change-map`
- `entry-guide`
- phase-aware consumption contract

裁剪说明：

- 本阶段不强制引入全部 convention 文档
- 只做对后续 skill 最有价值、最容易从存量实现稳定归纳的几类

### Phase 2：建立 Govern 与 Writeback 主链

目标：

- 让项目认知层从“一次性扫描产物”变成“可持续维护闭环”

范围：

- 增加 `reboot-guide`
- 定义 `done/wrap_up` 与 canonical truth 的回写契约
- 建立 cognition diff
- 建立 `Project Cognition Gate`
- 建立 update log

同时新增：

- `wrap_up / done -> first canonical truth` 反向更新闭环
- 更新日志 `project-cognition-updates.jsonl`
- `Project Cognition Gate`
- `reboot-guide`

### Phase 3：增强资产与大项目优化

目标：

- 面向大仓提高可维护性

范围：

- 基于 git diff 只刷新受影响资产
- 按子系统/模块分片生成
- 增强切片级注入策略
- 增加 `common-playbooks`
- 增加 `known-risks-and-traps`

### Phase 4：对接长期记忆（可选）

目标：

- 在 runtime truth 基础上引入 memory backend

范围：

- topic key
- session summary
- 项目级/feature 级联动

判断：

- 这是增强项，不是当前阻塞项

---

## 十七、优先级建议

### P0

- 收紧并校准已接通的动态注入链路
- 明确后续 skill 消费契约
- runtime truth 优先级产品化
- `docs/first` canonical / legacy 边界收敛

### P1

- Steering 三件套
- `project-rules`
- `api-conventions`
- `module-conventions`
- `testing-conventions`

### P2

- `critical-flows`
- `change-map`
- `entry-guide`
- `reboot-guide`
- `done/wrap_up` 反向更新 first canonical truth
- `project-cognition-updates.jsonl`

### P3

- 组件规范
- 数据访问规范
- 长期记忆集成

### 17.1 明确不建议立即推进的事项

- 不建议先做独立 memory backend
- 不建议先给每种项目都生成全量 conventions
- 不建议继续把 legacy docs 当作 canonical first truth
- 不建议在未统一 runtime schema 前继续扩更多 markdown 产物
- 不建议让 `done` 直接手工维护全部 `docs/first/*.md`
- 不建议在未定义 `required / optional / fallback` 前就强推最终态消费契约

### 17.2 方案到任务映射

为了避免方案文档与开发任务文档脱节，这里明确关键原则与任务映射关系：

| 设计原则 / 目标 | 对应任务 |
|----------------|----------|
| `docs/first` canonical / legacy 收敛 | `T01 / T02 / T03` |
| 建立最小 canonical nucleus | `T04 / T05 / T06 / T07 / T08` |
| docs 作为 projection 自动刷新 | `T09 / T15` |
| phase-aware consumption contract | `T10 / T11` |
| `wrap_up / done` 反向更新闭环 | `T12 / T13 / T15 / T16` |
| `Project Cognition Gate` 治理门槛 | `T14` |
| 大项目优化与长期记忆预留 | `T17 / T18` |

这张映射表的目的不是重复任务清单，而是确保评审时可以直接回答：

- 这个设计原则是否有明确实现任务承接？
- 这个开发任务是否在服务方案中的关键目标？

---

## 十八、风险与边界

### 18.1 主要风险

1. **规范归纳失真**
   - 项目内存在多种风格，误把局部模式当全局规范

2. **过度理想化**
   - 推荐规范脱离现有实现

3. **文档膨胀**
   - 产物太多但没有清晰消费关系

4. **注入过量**
   - 后续 skill 一次注入过多 first 资产，反而增加上下文负担

### 18.2 风险缓解

- 所有 convention 必须带 evidence
- 区分 observed 与 recommended
- 以 runtime slices 为主，不直接注入整篇 markdown
- 为每个 skill 定义最小读取集

### 18.3 设计边界

- `first` 不负责 feature 级执行日志
- `first` 不负责替代 `findings.md`
- `first` 不负责统一所有历史不一致
- `first` 负责项目级认知层，而不是 feature 生命周期层

---

## 十九、验收标准

### 19.1 产品验收

- `first` 的定位从“文档生成”升级为“项目认知输入层”
- 后续 skill 有明确消费契约
- 新会话恢复不再依赖读取大量原始仓库文件

### 19.2 技术验收

- runtime truth 完整生成
- docs 仅作为投影视图
- 宿主入口能实际触发动态注入
- conventions 具备 evidence 字段

### 19.3 使用效果验收

面对一个中大型存量项目：

- `spec` 能快速理解项目边界和接口约束
- `design` 能快速定位架构与分层约束
- `task` 能快速拆出影响面与验证动作
- `code` 能按项目既有规范实现
- `verify` 能按关键流程与项目规范验证

### 19.4 闭环验收

当一个需求完整经过 `spec → design → task → code → verify → wrap_up / done` 后：

- 若需求影响项目级认知，相关 canonical assets 被增量更新
- `docs/first` 自动刷新对应投影视图
- 下一轮需求能消费到更新后的项目认知
- 不需要人工逐份维护 `docs/first/*.md`

---

## 二十、结论

面向存量项目需求迭代，`first` 的正确方向不是“继续加几篇分析文档”，而是：

1. 把项目事实结构化
2. 把项目规范显式化
3. 把上下文切成后续 skill 可消费的最小资产
4. 把文档层降级为投影视图，而不是唯一真源

因此，`first vNext` 的目标应明确为：

> 构建一个面向存量项目的项目认知编译器，使 Spec-First 的后续 skill 在需求迭代中始终工作在统一、稳定、可裁切、可恢复的项目认知层之上。

这将使 Spec-First 从“有 first 分析能力”升级为“真正具备 Brownfield SDD 启动层”的系统。

基于当前最新代码认知，最佳整体方案可进一步收敛为一句话：

> 先统一 `first` 的 canonical truth 与消费链路，再逐步把最有价值的项目事实、项目规范和变更导航资产纳入 runtime schema，最后再考虑长期记忆后端。

如果把终局再说得更具体一点，就是：

> `first` 负责建立项目认知层，`wrap_up / done` 负责持续维护项目认知层，`docs/first` 永远只是该认知层的自动投影视图。

---

## 附录 A：建议产物总表

### 必须产物

- `summary`
- `product-steering`
- `tech-steering`
- `structure-steering`
- `api-docs`
- `domain-model`
- `project-rules`
- `role-views`
- `stage-views`
- `reboot-guide`

### 重要增强产物

- `api-conventions`
- `config-conventions`
- `module-conventions`
- `testing-conventions`
- `critical-flows`
- `change-map`
- `entry-guide`

### 大项目增强产物

- `component-conventions`
- `error-and-logging-conventions`
- `data-access-conventions`
- `common-playbooks`
- `known-risks-and-traps`

---

## 附录 B：一句话产品定义

`first` 不是项目介绍文档生成器，而是将存量项目实现编译为后续 skill 可消费的项目认知资产的编译器。
