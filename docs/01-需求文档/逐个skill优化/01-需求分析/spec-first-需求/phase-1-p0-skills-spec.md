# 一期核心 Skill 详细定义稿

文档日期：2026-03-22
文档类型：一期 P0 Skill 规格文档
适用范围：
- 多端项目：App / H5 / Backend / 后台
- 多人分端与全栈整包
- 主适用：存量项目 / 增量需求
- 受限适用：已完成前置落位的新项目、已完成新增承载体落位的混合型需求

补充定位：
- 当前核心 skill 更适合定义为“迁移稳定后的新增业务 skill”
- 不属于 `init` 迁移主线本身

## 1. 文档目标

本文档用于定义一期最关键的 1 个核心 skill：

- `/focus-requirements`

目标不是给出最终 `SKILL.md.tmpl`，而是先锁定：

- 每个 skill 的职责
- 输入
- 输出
- 边界
- 完成标准
- 失败条件

同时，本文档补充 handoff 文档约定和当前核心 skill 在实现时必须遵守的共性约束：

- Completion Status Protocol
- 质量验证机制
- 执行追踪写入位置
- eval / Judge 最小要求

## 2. 当前主链定义

### 2.1 人工前置条件

当前一期默认不把下面两件事做成核心 P0 skill：

- 识别自己需要改造的工程列表
- 手动把这些工程拉到当前 workspace

它们属于研发已完成的人工前置条件。

进入 P0 主链前，默认已满足：

- 已拿到产品评审后的原始大需求文档
- owner / side 已明确
- 已明确自己负责且需要改造的工程列表
- 已手动把这些工程拉到当前 workspace

### 2.2 核心能力总览

| Skill / 能力 | 作用 | 上游输入 | 下游去向 |
|-------|------|----------|----------|
| `/focus-requirements` | 站在当前模块 owner 视角，输出需求聚焦 PRD | 原始大需求文档、owner 标识、workspace 项目列表 | 固定 handoff 文档 |
| handoff 文档 | 通过固定目录、固定文档进入下游 | 上一步全部产物 | `gstack /plan-ceo-review` |

### 2.3 最小链路

```text
产品评审后的原始大需求文档
  -> 手动准备 workspace
  -> /focus-requirements
  -> 固定 handoff 文档
  -> /plan-ceo-review
  -> /plan-eng-review
```

## 3. 所有 P0 Skill 的通用输出协议

每个 P0 skill 都必须输出统一 Completion Status：

```text
DONE
DONE_WITH_CONCERNS
BLOCKED
NEEDS_CONTEXT
```

说明：

- `DONE`：产物完整，可进入下游
- `DONE_WITH_CONCERNS`：产物可用，但保留明确问题清单
- `BLOCKED`：前置条件未成立，当前还不能进入需求收口
- `NEEDS_CONTEXT`：前置条件形式上已具备，但信息不足以安全收口

当前主链不使用 `NEEDS_CONFIRMATION` 作为默认主路径状态。

## 4. 所有 P0 Skill 的质量机制

一期核心 skill 实现时，默认遵守三层质量保障中的前两层：

1. Completion Status Protocol
2. LLM Judge / eval 验证

第三层“高风险产物对抗审查”当前不作为这一阶段必选项，因为它主要面向：

- 方案类产物
- 协议类产物
- 任务包类产物

当前 P0 主链更偏：

- 模块需求范围
- 需求聚焦 PRD
- handoff

## 5. 执行追踪与实现约束

### 5.1 最小执行追踪

虽然当前一期主链已经收敛到 `workspace + module demand + handoff`，但实现上仍建议保留最小执行追踪层。

建议：

- 每次 skill 执行结果写入本地状态文件
- 记录最近一次运行状态、输入摘要、产物路径、Completion Status

当前不在本文档中强行定义完整 `feature.json` schema。  
真正实现时只保留最小状态层，后续再扩。

### 5.1.1 handoff 固定落位

当前 handoff 直接固定在：

- `handoff/`

规则：

- `/focus-requirements` 负责写需求聚焦 PRD 与相关 handoff 文档
- 下游固定从该目录读取

### 5.2 最小实现约束

P0 实现阶段，`docs/`、`objects/`、`workspace/`、`handoff/` 主要表示产物应该落到哪里，不等于需要为每一层各自做一套独立实现。

实现约束：

- 优先最少写入器，而不是按目录层拆很多模块
- 优先最少状态层，而不是提前设计完整控制平面
- 优先让 `/focus-requirements` 跑通，再考虑更细的内部抽象

避免：

- 为 `docs/` 单独设计管理系统
- 为 `objects/` 单独设计服务层
- 为 `workspace/` 单独设计 orchestration 层
- 为 `handoff/` 单独设计编排引擎

## 6. eval / Judge 最小要求

核心 skill 与 handoff 文档至少应有一组最小 eval 用例，用于验证：

- clarity
- completeness
- actionability
- hallucination_risk

最低要求：

- `/focus-requirements`：不能抄总需求而不形成 owner 范围收口
- `/focus-requirements`：不能把别的 owner 的内容混进自己的需求聚焦 PRD
- handoff 文档：不能在缺失关键条件时仍表现为可交接
- handoff 文档：必须明确推荐 `/plan-ceo-review -> /plan-eng-review`

### 6.1 前置条件失败路径

P0 主链除 happy path 外，必须覆盖一组“人工前置条件未完成”的失败路径用例。

至少包括：

- owner 尚未明确
- 需要改造的工程列表尚未明确
- workspace 尚未手动准备完成
- 新项目仍处于端边界 / 仓库边界 / 接口边界未定阶段
- 混合型需求已识别新增承载体，但该承载体尚未完成落位设计

在这些情况下，P0 skill 应表现为：

- `/focus-requirements`：不应在缺失稳定 workspace 时继续产出需求聚焦 PRD
- handoff 文档：不应在前置条件不成立时表现为可交接

## 7. `/focus-requirements`

### 7.1 目标

在已准备好的 workspace 下，站在当前模块 owner 视角，把产品评审后的原始大需求文档编辑成“当前 owner 负责的需求聚焦 PRD”。

### 7.2 主要输入

直接收口模式最小输入：

- 原始大需求文档
- 当前 owner / side 标识
- 当前 workspace 下的项目列表

增强输入：

- 历史模块文档
- 旧 PRD
- 术语表
- 补充业务规则

### 7.3 主要输出

- 需求聚焦 PRD
- owner scope
- in-scope / out-of-scope
- dependencies
- acceptance criteria
- open questions

### 7.4 记录位置

- `docs/requirements/focus-requirements.md`
- `handoff/side-requirements.md`
- `handoff/handoff-summary.md`

固定模板来源：

- `focus-requirements/templates/focus-requirements.md`
- `focus-requirements/templates/side-requirements.md`
- `focus-requirements/templates/handoff-summary.md`

首个参考样例：

- `focus-requirements/examples/README.md`
- `focus-requirements/examples/incremental-checkout-coupon/`
- `focus-requirements/examples/simple-profile-copy-update/`
- `focus-requirements/examples/ambiguity-confirmation/`

### 7.5 工作模式

默认采用双模式：

1. 先尝试直接收口
2. 只有命中关键歧义时才进入最少轮数确认

强制确认触发器只有三类：

- `Owner Boundary Ambiguity`
- `Dependency Ownership Ambiguity`
- `Acceptance Boundary Ambiguity`

也就是说，以下内容默认不阻塞成稿，只记入文档：

- 一般 `Open Questions`
- 次要规则不明确
- 非功能性约束的存在性记录
### 7.6 不负责什么

- 不负责重写完整总需求文档
- 不负责别的 owner 的需求拆分
- 不负责完整技术方案
- 不负责拆任务

### 7.7 完成标准

成功不以“文档写出来了”为主，而以结果为主：

1. `Owner Scope` 清楚
2. `In Scope / Out of Scope` 清楚
3. `Dependencies` 单列且不混 scope
4. `Acceptance Criteria` 可由当前 owner 验证
5. `Open Questions` 真实存在且未被偷偷补全

### 7.8 状态判断

- `DONE`：5 条成功标准均已满足，可直接进入下游 review
- `DONE_WITH_CONCERNS`：主体边界已清楚，仍有少量未决项，但不阻塞下游
- `NEEDS_CONTEXT`：信息不足，但前置条件形式上已具备
- `BLOCKED`：前置条件未成立，当前还不能进入需求收口

### 7.9 失败条件

- 只是复述总需求，没有形成模块边界
- 混入明显不属于当前 owner 的内容
- 把依赖别人完成的内容写成当前 owner 自己负责
- 验收边界不清
- 没有 open questions 或边界说明

### 7.10 最小 eval 重点

- 是否形成了真实的 owner 范围收口
- 是否遗漏明显边界或验收点
- 是否把别的模块内容错误纳入当前聚焦 PRD
- 是否在关键歧义场景下触发确认，而不是直接误收口

## 8. handoff 文档约定

### 8.1 目标

通过固定目录与固定文档集合，让当前 owner 的需求聚焦 PRD 可以直接进入 `/plan-ceo-review`。

### 8.2 固定文档

- `handoff/side-requirements.md`
- `handoff/handoff-summary.md`

### 8.3 约定重点

- 不单独作为核心 skill
- 不做自动修复
- 不做全局编排
- 默认推荐 `/plan-ceo-review -> /plan-eng-review`

### 8.4 最小职责

`handoff/side-requirements.md` 只保留：

- Owner Scope
- In Scope
- Out of Scope
- Dependencies

`handoff/handoff-summary.md` 只保留：

- Requirement Summary
- Key Acceptance Criteria
- Open Questions
- Recommended Next Step

## 9. 可叠加但非 P0 的增强能力

当前可以叠加，但不改变 P0 主链基本形态的增强能力：

- `/backend-domain-split`
- `/clarify`
- `/challenge`
- `/scope-lock`

## 10. 一句话结论

这个核心 skill 的职责不是把需求做完，而是把需求稳定压缩成：

- 当前 owner 可负责的需求聚焦 PRD
- 可直接交给 gstack 的最小 handoff 摘要

这就是当前一期最小但完整的实现闭环。
