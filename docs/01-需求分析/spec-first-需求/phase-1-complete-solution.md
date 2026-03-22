# 一期完整方案文档

文档日期：2026-03-22
文档类型：一期方案文档
适用范围：
- 多人协作研发
- 多端项目：App / H5 / Backend / 后台
- 新项目 / 新业务建设
- 存量项目增量迭代
- 混合型需求
- 多人分端与全栈整包两种交付模式

## 1. 文档目标

本文档用于正式定义系统一期的完整方案，包括：

- 一期到底要解决什么问题
- 一期的范围边界
- 一期的核心流程
- 一期的 Skill 清单
- 一期与 gstack 的职责切分
- 一期的 handoff 机制

本文档基于以下上游文档收敛而来：

- `overall-system-design.md`
- `new-project-vs-incremental-demand-flow.md`

## 1.1 当前代码状态说明

本文档是一期实现真源，不是当前代码实现说明。

当前 `spec-first` 代码库仍以既有的 `feature / stage / verify / orchestrate`
流程为主，当前已经存在的 skill、命令路由和状态文件，仍以现有代码为准。

本文档定义的是：

- 下一阶段一期要落地的核心 skill 主链
- 未来目标中的产物落位
- 与 gstack 的 handoff 方式

因此本文档中的下列内容，默认都应理解为“目标设计”，而不是“现状保证”：

- `/focus-requirements`
- 固定 handoff 文档约定
- `docs/ / objects/ / workspace/ / handoff/` 的目标落位

在这些能力真正落地到代码前：

- 代码事实以当前仓库实现为准
- 一期实现目标以本文档和 `phase-1-p0-skills-spec.md` 为准

## 1.2 与 init 迁移计划的关系

当前这套方案不属于 `2026-03-22-init项目` 里的迁移主线本身。

更准确的定位是：

- `init` 项目负责把 `gstack -> spec-first` 的运行时、路径、helper、planning 链迁过来
- 本文档定义的 `/focus-requirements`，属于迁移稳定后的新增业务 skill
- handoff 通过固定目录与固定文档约定完成，不再单独占用核心 skill 名额

因此：

- 这个核心 skill 不应阻塞当前迁移主线
- 它应建立在下游固定读取约定已可用这一前提上

## 2. 一期一句话定义

一期要做的不是“AI 全流程研发平台”，也不是“自己覆盖从需求到发布的全部能力”。

一期真正要做的是：

```text
把产品需求转换成
当前模块 owner 可继续推进的需求聚焦 PRD
再按固定 handoff 文档约定交给 gstack 完成后续研发流程
```

也就是说，一期系统的职责是：

```text
产品需求 -> 工程上下文
```

而不是：

```text
产品需求 -> 方案 -> 开发 -> 测试 -> 发布 全包
```

## 3. 一期要解决什么问题

一期主要解决以下断层：

- 产品需求评审完成后，研发虽然知道自己要改哪些工程，但缺少面向自己负责范围的稳定需求收口
- 多端协作时，各端缺少属于自己负责范围的需求聚焦 PRD
- 研发进入方案设计前，workspace 已经准备好，但本端需求范围仍然过大、过散
- 后端需求容易被前端页面牵着拆，能力域边界不清
- 同一个需求下，不同 owner 很难快速形成自己的本端工作起点
- 上游需求质量问题不能在进入 gstack 前被提前暴露

所以一期的目标不是：

```text
让某个人更快写代码
```

而是：

```text
让研发先拿到
稳定、可执行、属于自己负责范围的工程上下文
```

## 4. 一期范围边界

### 4.1 一期范围内

- 在已准备好的 workspace 内，聚焦当前 owner 负责的需求范围
- 输出需求聚焦 PRD
- 后端能力域拆分（必要时）
- 基础质量增强
- handoff 文档生成
- 固定 gstack 接手点约定

### 4.1.1 一期人工前置条件

以下动作默认由研发手动完成，不属于当前一期核心 skill：

- 拿到产品评审后的原始大需求文档
- 明确当前 owner / side
- 明确自己负责且需要改造的工程列表
- 手动把这些工程拉到当前 workspace

只有在这些条件满足后，才进入当前一期主链。

### 4.2 一期范围外

以下能力不在一期系统内自研主链中：

- 技术方案完整定稿
- 接口协议完整生成与深度一致性治理
- 跨端评审主流程
- 任务包主流程
- 开发 / review / QA / ship
- 飞书接入
- GitHub / GitLab 状态回写
- DevOps 提测与发布集成
- 外部系统状态回写
- 企业级审批、权限、组织后台

其中，方案设计、开发、测试、发布等后续流程，交给 gstack 承接。

### 4.2.1 当前依赖前提

当前方案默认依赖下游固定读取约定已经可用，至少包括：

- 固定的 workspace 目录
- 固定的需求聚焦 PRD 路径
- 固定的 handoff 文档路径
- `plan-ceo-review`
- `plan-eng-review`

## 5. 一期 Skill 清单

### 5.1 总表

| 序号 | Skill / 能力 | 分层 | 优先级 | 作用 | 关键产物 | 记录位置 |
|------|--------------|------|--------|------|----------|----------|
| 1 | `/focus-requirements` | 需求聚焦层 | P0 | 站在当前模块 owner 视角，结合原始大需求文档与已准备好的 workspace，输出需求聚焦 PRD | 聚焦 PRD、职责边界、依赖、验收点、open questions | `docs/requirements/focus-requirements.md`、`handoff/side-requirements.md`、`handoff/handoff-summary.md` |
| 2 | `handoff 文档约定` | 交接规范层 | P0 配套 | 通过固定目录、固定文档和固定入口约定把上游产物交给下游 | side requirements、handoff summary、固定入口 | `handoff/side-requirements.md`、`handoff/handoff-summary.md` |
| 3 | `/backend-domain-split` | 需求拆分增强层 | P1 | 后端按能力域拆分，而不是按前端页面拆分 | 后端能力域边界、后端模块需求 | `docs/requirements/backend-domain.md`、`workspace/backend/requirements.md`、`objects/decision/` |
| 4 | `/clarify` | 质量增强层 | P1 | 基于产品需求与模块需求范围，进一步把问题说清楚 | Problem、Success Criteria、Non-goals | `objects/problem/`、`workspace/<owner-or-side>/context.md` |
| 5 | `/challenge` | 质量增强层 | P1 | 挑战错误 framing，识别是否在解决错问题 | Refined Problem、Assumptions、Risks、Findings | `objects/problem/`、`objects/assumption/`、`objects/risk/`、`objects/finding/` |
| 6 | `/scope-lock` | 质量增强层 | P1 | 锁定本端负责范围边界 | Scope、Decision | `objects/scope/`、`objects/decision/`、`workspace/<owner-or-side>/context.md` |

### 5.2 一期最小可落地闭环

如果一期还要进一步压缩，最小可落地闭环只保留 1 个核心 skill：

| 序号 | Skill / 能力 | 原因 |
|------|--------------|------|
| 1 | `/focus-requirements` | 在已准备好的 workspace 下，明确自己负责的需求范围，并产出需求聚焦 PRD |
| 2 | `handoff 文档约定` | 通过固定目录和固定文档约定进入下游，不再单独占用 skill 名额 |

前提条件：

```text
这个核心 skill 不是“从零开始覆盖所有新项目阶段”

它默认只在以下条件满足后启动：
- 已拿到产品评审后的原始大需求文档
- owner / side 已明确
- 已明确自己负责且需要改造的工程列表
- 已手动把这些工程拉到当前 workspace
```

如果要把质量增强能力纳入增强闭环，则补上：

- `/backend-domain-split`
- `/clarify`
- `/challenge`
- `/scope-lock`

### 5.3 记录位置设计原则

一期 Skill 产物统一落到五类位置：

1. `docs/`
- 面向人阅读和协作
- 承载需求拆分、handoff summary 等文档链

2. `objects/`
- 面向系统读写和后续复用
- 承载 Problem、Scope、Risk、Decision、Finding、Evidence 等结构化对象

3. `workspace/`
- 面向各端 / 各 owner 执行
- 承载当前 workspace 的执行视图，而不是真源全文

4. `handoff/`
- 面向 repo 内固定交接文档
- 承载给下游直接消费的 handoff 文档

原则：

- `docs/` 负责“人能看懂”
- `objects/` 负责“系统能复用”
- `workspace/` 负责“执行者能直接开工”
- `handoff/` 负责“固定交接文档”

## 6. 一期流程设计

### 6.1 标准主流程

```text
产品需求评审完成
  -> 各端 / 各 owner 拿到产品需求文档
  -> 明确自己负责且需要改造的工程列表
  -> 手动拉到 workspace
  -> /focus-requirements
  -> /backend-domain-split（如需要）
  -> /clarify（按需）
  -> /challenge（按需）
  -> /scope-lock（按需）
  -> 生成固定 handoff 文档
  -> 交给 gstack
  -> /plan-ceo-review
  -> /plan-eng-review
  -> 开发 / 测试 / 发布
```

补充说明：

```text
该主流程默认适用于：
- 存量项目 / 增量需求
- 已完成前置落位的新项目
- 已完成新增承载体落位的混合型需求

如果仍处于“端边界、工程拓扑、接口边界未定”阶段
先做前置落位，不直接进入 P0 主链
```

### 6.2 一期泳道图

```text
泳道 1：产品 / 业务
泳道 2：各端研发 / owner
泳道 3：一期系统
泳道 4：gstack

产品需求评审完成
  -> 各端研发 / owner 接收产品需求文档
  -> 各端研发 / owner 明确受影响工程并手动准备 workspace
  -> 各端研发 / owner 在 workspace 下工作
  -> 一期系统拆分当前 owner 负责模块的需求范围
  -> 一期系统做最小质量收口
  -> 一期系统生成固定 handoff 文档
  -> gstack 先做 /plan-ceo-review
  -> gstack 再做 /plan-eng-review
  -> gstack 进入后续实现 / review / qa / ship
```

### 6.3 节点输入输出表

| 阶段 | Skill | 主要输入 | 主要输出 | 是否 P0 |
|------|-------|----------|----------|---------|
| 人工前置 | 手动准备 workspace | 产品需求文档、owner、工程列表 | 当前 owner 的 workspace | 否 |
| 模块收口 | `/focus-requirements` | 原始大需求文档、owner 标识、workspace 项目列表 | 需求聚焦 PRD、边界、依赖、验收点 | 是 |
| 模块收口 | `/backend-domain-split` | backend 需求、workspace | 能力域边界、后端模块需求 | 否 |
| 质量收口 | `/clarify` | 产品需求、模块需求范围 | Problem、Success Criteria、Non-goals | 否 |
| 质量收口 | `/challenge` | Problem、模块需求范围 | Refined Problem、Assumptions、Risks、Findings | 否 |
| 质量收口 | `/scope-lock` | 模块需求范围、clarify/challenge 输出 | Scope、Decision | 否 |
| 交接 | `handoff 文档约定` | 全部上游产物 | 固定 handoff 文档、固定入口 | 是 |

### 6.4 新项目流程重点

新项目不能直接从“手动准备 workspace 后进入需求聚焦”开始，必须先补：

- 跨端职责划分
- 工程拓扑设计
- 接口边界设计

但对一期而言，这些可先作为输入前提或外部前置动作存在。

一期系统在新项目场景中，主要从“各端 / 各 owner 开始识别和组装自己的工作上下文”切入。

这意味着：

```text
新项目只有在前置落位完成后
才进入一期 P0 主链
```

### 6.5 增量需求流程重点

如果已经存在稳定工程承载体，一期主流程最顺：

- 手动确认影响工程列表
- 手动准备 workspace
- 在 workspace 下拆本模块需求
- 按固定 handoff 文档进入 gstack

### 6.6 混合型需求流程重点

混合型需求不是纯新项目，也不是纯增量需求，而是：

```text
增量主线
+ 局部新工程落位
```

因此一期在混合型场景下要做两件事：

- 识别存量工程改动面
- 标记哪些模块需要新增承载体

然后再统一准备 workspace。

### 6.7 P0 与增强层说明

当前一期真正的 P0 主链是：

```text
/focus-requirements
-> 固定 handoff 文档
```

适用前提：

```text
已拿到产品评审后的原始大需求文档
owner 已明确
已明确自己负责且需要改造的工程列表
已手动把这些工程拉到当前 workspace
```

以下能力属于增强层或条件性能力：

- `backend-domain-split`
- `clarify`
- `challenge`
- `scope-lock`

也就是说，一期可以先把 P0 主链跑通，再逐步叠加入口判断与质量增强。

## 6.8 一期实现约束总表

后续所有一期实现文档，涉及共性边界时，优先引用本表，不再重复展开整段描述。

| 约束项 | 当前规则 |
|---|---|
| P0 主链 | `/focus-requirements -> 固定 handoff 文档` |
| P0 适用前提 | 仅在已拿到原始大需求文档、owner 明确、工程列表明确、workspace 已手动准备后启动 |
| 新项目 / 混合型边界 | 若仍处于端边界、工程拓扑、接口边界未定阶段，先做前置落位；落位完成后再手动准备 workspace 并进入 P0 主链 |
| 默认 gstack 入口 | 先 `/plan-ceo-review`，再 `/plan-eng-review` |
| handoff 定位 | 轻交接约定，只做固定目录、固定文档、固定入口，不做全局编排 |
| 目录分层语义 | `docs/`、`objects/`、`workspace/`、`handoff/` 是产物落位层，不等于必须一一对应实现层 |
| 最小实现原则 | 优先最少输入解析层、最少产物写入器、最少状态层、最少 handoff 打包层 |
| 最小执行追踪 | 保留最小执行追踪层，但当前不锁死完整 `feature.json` schema |
| 质量保障 | P0 默认遵守 Completion Status Protocol + 最小 eval / Judge；不默认强制对抗审查 |
| 测试边界 | 除 happy path 外，必须覆盖“前置落位未完成”的失败路径 |

## 7. 一期产物体系

一期系统的核心不是聊天记录，而是文档链、结构化对象、执行视图和交接视图。

### 7.1 文档链

- 需求聚焦 PRD 文档
- 后端能力域拆分文档（如需要）
- handoff summary

### 7.2 结构化对象

- `Problem`
- `Scope`
- `Assumption`
- `Risk`
- `Decision`
- `Finding`
- `Evidence`

### 7.3 workspace 视图

每个 workspace 下建议最小包含：

- `context.md`
- `requirements.md`
- `impacted-repos.md`

可选扩展：

- `open-questions.md`
- `gstack-entry.md`

### 7.4 质量保护机制

- `PASS / WEAK / FAIL`
- `ACTIVE / SUPERSEDED / CONFLICTING`
- `trust_state = RAW / INFERRED / CONFIRMED / STALE`

### 7.4.1 Completion Status Protocol

一期 skill 实现时，统一采用：

- `DONE`
- `DONE_WITH_CONCERNS`
- `BLOCKED`
- `NEEDS_CONTEXT`

入口判断类增强 skill 可额外使用：

- `NEEDS_CONFIRMATION`

适用对象：

- `demand-classify`
- `delivery-mode-decide`

原则：

- 主链 P0 skill 优先输出可继续执行的状态
- 如果关键信息缺失，必须明确返回 `BLOCKED` 或 `NEEDS_CONTEXT`
- 不允许用模糊 prose 掩盖真实不确定性

### 7.4.2 Judge / eval 要求

一期不是只写文档，还要保证 skill 产物可验证。

因此建议：

- 每个 P0 skill 至少配一组最小 eval
- 评价维度至少包含：
  - clarity
  - completeness
  - actionability
  - hallucination_risk

当前一期优先验证：

- `focus-requirements`
- 固定 handoff 文档

### 7.4.3 高风险产物对抗审查的当前边界

当前一期 P0 主链默认不把“对抗审查”设为必选项。  
原因是一期主链当前主要输出：

- 需求聚焦 PRD
- side requirements
- handoff summary

真正需要高强度对抗审查的产物仍然是：

- 方案
- 协议
- 任务包

这些当前主要由 gstack 下游或后续扩展能力承担。

### 7.5 核心层

- `Quality Repository`
- `Verdict Engine`
- `Context Selector`

说明：

- `Quality Repository` 是核心资产层
- `Verdict Engine` 是轻量裁决层
- `Context Selector` 只选上下文，不自动合并真相

### 7.6 执行追踪与本地状态

虽然一期当前已经收敛到 handoff 主链，但实现上仍建议保留最小执行追踪层。

最低要求：

- 记录每次 skill 运行的输入摘要
- 记录 Completion Status
- 记录关键产物路径
- 记录最近一次 handoff 状态

当前文档不强行锁死完整 `feature.json` schema，  
但实现时应预留这层，避免后续二期扩展时重新设计状态追踪。

## 8. handoff bundle 设计

一期系统交给 gstack 时，必须输出一组稳定产物，而不是一句“workspace 组好了”。

### 8.0 最小 handoff 结构

当前 handoff 直接采用固定目录约定：

- 路径：`handoff/`
- 作用：让当前 owner 输出稳定摘要，并让下游按固定目录直接消费

### 8.1 文件结构

一期默认采用最小 handoff 结构：

```text
handoff/
├── side-requirements.md
└── handoff-summary.md
```

固定模板来源：

- `focus-requirements/templates/focus-requirements.md`
- `focus-requirements/templates/side-requirements.md`
- `focus-requirements/templates/handoff-summary.md`

首个参考样例：

- `focus-requirements/examples/README.md`
- `focus-requirements/examples/incremental-checkout-coupon/`
- `focus-requirements/examples/simple-profile-copy-update/`
- `focus-requirements/examples/ambiguity-confirmation/`

### 8.2 内容要求

#### `side-requirements.md`

- Owner Scope
- In Scope
- Out of Scope
- Dependencies

#### `handoff-summary.md`

- Requirement Summary
- Key Acceptance Criteria
- Open Questions
- Recommended Next Step

## 9. gstack 接手机制

这里不能写死成“统一从 `/plan-eng-review` 开始”。

应该设计成：

```text
handoff -> gstack entrypoint selection
```

### 9.1 Handoff Status 枚举

- `READY_FOR_CEO_REVIEW`
- `READY_FOR_ENG_REVIEW`
- `READY_FOR_IMPLEMENTATION_REVIEW`
- `READY_FOR_QA`
- `READY_FOR_SHIP`

### 9.2 判定规则

| Handoff Status | 适用条件 | gstack 接手点 |
|----------------|----------|---------------|
| `READY_FOR_CEO_REVIEW` | framing 仍不稳，需要更高层重构 | `/plan-ceo-review` -> `/plan-eng-review` |
| `READY_FOR_ENG_REVIEW` | Problem/Scope/workspace/需求聚焦 PRD 已具备，尚未正式开发 | `/plan-eng-review` |
| `READY_FOR_IMPLEMENTATION_REVIEW` | 已开始编码或方案已确认，已有 diff | `/review` |
| `READY_FOR_QA` | 已有可运行环境，进入验证阶段 | `/qa` |
| `READY_FOR_SHIP` | 已完成验证，准备发布 | `/ship` |

### 9.3 默认接手点

当前默认最常见的接手点是：

```text
READY_FOR_CEO_REVIEW
```

也就是先从 `/plan-ceo-review` 开始，再进入 `/plan-eng-review`。

### 9.4 为什么默认先走 CEO Review

原因是一期当前产物仍然以：

- 本端受影响工程
- workspace
- 需求聚焦 PRD
- 最小质量收口

为主，而不是完整工程方案。  
这时先让 gstack 从 CEO 视角复核问题定义和范围边界，更符合当前一期系统的职责切分。

## 10. handoff 文档约定的职责

这个能力是一期系统和 gstack 的真正接口。

### 输入

- 需求类型
- 交付模式
- 本端需求范围
- workspace
- 质量上下文

### 输出

- 当前 owner 的最小 handoff 摘要集合
- 固定入口
- 不足项清单

### 不负责什么

- 不重做上游需求拆分
- 不修复跨文档一致性
- 不重新决定全局流程编排
- 不自动补齐缺失的 Problem / Scope / 模块需求
- 不承接方案、协议、任务主链

一句话：

```text
handoff 文档约定是轻交接规范
不是新的总控编排节点
```

### 不允许交接的情况

- Problem 不清晰
- Scope 未锁定
- 工程影响面不明确
- workspace 不完整
- 需求聚焦 PRD 不明确

### 10.1 handoff 文档约定的判定重点

- 当前 owner 是否已经明确自己负责的模块范围
- 当前 workspace 是否足够支撑 gstack 继续澄清与收口
- 是否已经暴露关键 open questions，而不是把不确定性藏起来
- 当前问题是否更适合先做 CEO review，而不是直接进入工程评审
- 最小 handoff 摘要是否已经齐备，能让 `plan-ceo-review` / `plan-eng-review` 直接继续

## 11. 一期与 gstack 的职责切分

### 一期系统负责

把：

```text
产品需求 -> 工程上下文
```

具体包括：

- 手动准备 workspace 后的需求收口
- 拆分本端 / 本模块需求
- 基础质量增强
- 生成最小 handoff 摘要
- 推荐 gstack 入口

### gstack 负责

把：

```text
工程上下文 -> 可交付实现
```

具体包括：

- `/plan-ceo-review`
- `/plan-eng-review`
- implementation
- `/review`
- `/qa`
- `/ship`

## 12. 一期架构建议

### 核心模块

- Demand Editor
- Quality Repository
- Verdict Engine
- Context Selector
- Handoff Contract

### 12.1 代码接入映射表

当前这两个新增 skill 不应先独立长成一套全新框架，而应优先映射到现有 `spec-first` 代码架构里。

建议映射如下：

| 新能力 | 推荐接入层 | 说明 |
|---|---|---|
| `focus-requirements` | `skills/spec-first/` 新增 skill + 最少写入器 | 先做 repo 内文档产物生成，负责需求收口与最小摘要同步 |
| handoff 文档 | 固定目录与固定模板 | 让 `plan-ceo-review` / `plan-eng-review` 直接消费固定文件 |

约束：

- 不先重构当前 `feature / stage / verify / orchestrate` 主线
- 不先做新的全局状态系统
- 先把两个 skill 作为新增能力落地，再决定是否进一步并入既有阶段流

### 实现约束

一期实现时，`docs/`、`objects/`、`workspace/`、`handoff/` 是产物落位层，不应直接翻译成同等数量的独立实现系统。

推荐约束：

- 优先做最少的输入解析层
- 优先做最少的产物写入器
- 优先做最少的本地状态记录层
- 优先做最少的 handoff 文档生成

不推荐在 P0 阶段就拆出：

- 独立的 `docs` 管理系统
- 独立的 `objects` 管理系统
- 独立的 `workspace` 服务层
- 独立的 `handoff` 编排层

一句话：

```text
目录结构服务于产物组织
不是当前一期必须一一对应的代码模块边界
```

### 技术原则

- 文档驱动，不靠聊天记录驱动
- 一期只做到“稳定交接”，不做到“全流程包办”
- 多端协作靠 workspace + 需求聚焦 PRD
- 后续复杂方案、实现、验证交给 gstack
- skill 共享对象，不共享私有格式
- handoff 是明确能力，不是隐含动作

## 13. 最终定义

一期完整方案不是“自己完成需求到发布”，而是：

```text
先把产品需求转换成
当前 owner 可继续推进的需求聚焦 PRD
再把这些稳定交给 gstack 完成后续研发流程
```

一句话总结：

```text
一期系统负责把需求变成工程上下文
gstack 负责把工程上下文变成交付结果
```
