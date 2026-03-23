# GSD Workflow / ID 体系深度分析

> 依据当前代码与工作流文档整理：`get-shit-done` 不是靠单一流程 ID 跑全局，而是靠一组分层命名空间把“需求、阶段、计划、执行、版本、临时想法、快速任务、并行空间”分开管理。
>
> 本文目标有两个：
> 1. 梳理项目是怎样做的，流程和 ID 如何关联。
> 2. 提炼当前项目可以借鉴的设计点，尤其适合拿到 `spec-first` 这类体系中复用。

## 1. 一眼看懂的主链

```text
idea / request
  -> /gsd:new-project or /gsd:new-milestone
  -> PROJECT.md
  -> REQUIREMENTS.md (REQ-XX)
  -> ROADMAP.md (Phase 1, 2, 2.1...)
  -> discuss-phase / ui-phase
  -> plan-phase
  -> execute-phase
  -> verify-work
  -> complete-milestone
  -> MILESTONES.md
```

这个主链的关键点是：

- `REQ` 负责需求项
- `Phase` 负责阶段边界
- `PLAN / SUMMARY` 负责执行颗粒度
- `milestone` 负责发布边界

它不是把“需求 ID”一路传到底，而是**每一层只承担一类职责**。

---

## 2. 文件系统里的真相源

GSD 的核心不是数据库，而是 `.planning/` 目录中的文本文件。

### 2.1 项目级文件

| 文件 | 作用 |
|---|---|
| `PROJECT.md` | 项目是什么、核心价值是什么、当前活跃需求是什么 |
| `REQUIREMENTS.md` | 可勾选需求清单 + 追踪表 |
| `ROADMAP.md` | 分阶段规划 + phase 依赖 + 成功标准 |
| `STATE.md` | 当前进度、最近活动、性能指标、会话连续性 |
| `config.json` | 工作流配置 |
| `MILESTONES.md` | 已发布 milestone 的历史 |

### 2.2 阶段级文件

每个 phase 目录通常包含：

- `PLAN.md`
- `SUMMARY.md`
- `CONTEXT.md`
- `RESEARCH.md`
- `VALIDATION.md`
- `UAT.md`

### 2.3 旁路目录

- `todos/pending/`、`todos/done/`
- `quick/`
- `workstreams/`
- `milestones/`
- `research/`

这意味着 GSD 的“状态”不是散落在命令历史里，而是**落盘在可读文本文件中**。

---

## 3. ID 关系梳理

### 3.1 需求 ID：`REQ-XX`

`REQ` 是这个系统最稳定的业务需求 ID。

来源：

- [`templates/requirements.md`](/Users/kuang/xiaobu/get-shit-done/templates/requirements.md)
- [`workflows/new-project.md`](/Users/kuang/xiaobu/get-shit-done/workflows/new-project.md)
- [`workflows/new-milestone.md`](/Users/kuang/xiaobu/get-shit-done/workflows/new-milestone.md)

特点：

- 只出现在 `REQUIREMENTS.md`
- 用 checkbox 表示是否完成
- 每个 `REQ` 在 traceability 表里映射到一个 phase

你可以把它理解成：

```text
需求项 = 业务可验证承诺
```

这比“抽象愿景”更硬，因为它最终会被阶段执行和完成状态验证。

### 3.2 阶段 ID：`Phase 1 / 2 / 2.1`

Phase 是 roadmap 的执行单元。

来源：

- [`templates/roadmap.md`](/Users/kuang/xiaobu/get-shit-done/templates/roadmap.md)
- [`bin/lib/phase.cjs`](/Users/kuang/xiaobu/get-shit-done/bin/lib/phase.cjs)
- [`bin/lib/roadmap.cjs`](/Users/kuang/xiaobu/get-shit-done/bin/lib/roadmap.cjs)

特点：

- 整数 phase 表示常规阶段
- 小数 phase 表示插入式修复或紧急工作
- roadmap 里 phase 既有概览列表，也有详细 section

这条设计很重要，因为它允许：

- 正常推进
- 插入修复
- 连续编号
- 版本归档后还保留历史

### 3.3 计划 ID：`01-01`, `01-02`

计划是 phase 内部的执行粒度。

来源：

- [`templates/phase-prompt.md`](/Users/kuang/xiaobu/get-shit-done/templates/phase-prompt.md)
- [`workflows/plan-phase.md`](/Users/kuang/xiaobu/get-shit-done/workflows/plan-phase.md)
- [`workflows/execute-plan.md`](/Users/kuang/xiaobu/get-shit-done/workflows/execute-plan.md)

特点：

- `PLAN.md` 是执行说明
- `SUMMARY.md` 是执行结果
- `wave` 决定并行波次
- `depends_on` 决定真正的顺序依赖

这比“纯顺序执行”更先进，因为它承认：

- 有些任务能并行
- 有些任务必须依赖前序结果

### 3.4 版本 ID：`v1.0 / v1.1`

milestone 是发布边界。

来源：

- [`templates/milestone.md`](/Users/kuang/xiaobu/get-shit-done/templates/milestone.md)
- [`workflows/new-milestone.md`](/Users/kuang/xiaobu/get-shit-done/workflows/new-milestone.md)
- [`workflows/complete-milestone.md`](/Users/kuang/xiaobu/get-shit-done/workflows/complete-milestone.md)

特点：

- 把多个 phase 打包成一个发布版本
- 发布后会进入 `MILESTONES.md`
- 会归档 ROADMAP / REQUIREMENTS

这意味着 GSD 的“完成”不是单个 phase 的结束，而是**版本级归档**。

### 3.5 旁路 ID

#### Todo ID：`{NNN}-{slug}`

来源：

- [`workflows/note.md`](/Users/kuang/xiaobu/get-shit-done/workflows/note.md)
- [`workflows/add-todo.md`](/Users/kuang/xiaobu/get-shit-done/workflows/add-todo.md)

用途：

- 捕捉会话中临时想到的任务/问题
- 作为后续 phase 的输入候选

#### Quick Task ID：`quick_id`

来源：

- [`workflows/quick.md`](/Users/kuang/xiaobu/get-shit-done/workflows/quick.md)

用途：

- 处理小任务
- 不走完整 milestone 机制

#### Workspace / Workstream 名称

来源：

- [`workflows/new-workspace.md`](/Users/kuang/xiaobu/get-shit-done/workflows/new-workspace.md)
- [`bin/lib/workstream.cjs`](/Users/kuang/xiaobu/get-shit-done/bin/lib/workstream.cjs)

用途：

- 解决并行工作
- 解决多 repo / 多上下文隔离

---

## 4. 流程怎么串起来

### 4.1 初始化

`/gsd:new-project` 和 `/gsd:new-milestone` 的核心作用不是“创建目录”，而是建立项目记忆。

它们会初始化：

- `PROJECT.md`
- `REQUIREMENTS.md`
- `ROADMAP.md`
- `STATE.md`
- `config.json`

这让后续所有命令都能读取统一上下文。

### 4.2 讨论阶段

`/gsd:discuss-phase` 的作用是收敛灰区。

它会：

- 读当前 phase
- 找到未决决策
- 让用户明确答案
- 写入 `CONTEXT.md`

如果开启 `assumptions` 模式，它甚至会先做代码分析，再让用户确认假设。

### 4.3 规划阶段

`/gsd:plan-phase` 的作用是把“需求/上下文”变成可执行计划。

核心机制：

- 读取 `ROADMAP.md`
- 读取 `CONTEXT.md`
- 必要时做 research
- 生成 `PLAN.md`
- 运行 plan checker
- 强制把每个 `REQ` 映射到至少一个 plan

这一步最值得借鉴的地方是：

- 计划不是主观拍脑袋
- 计划必须证明能覆盖需求

### 4.4 执行阶段

`/gsd:execute-phase` 把计划按 `wave` 拆开执行。

关键设计：

- 每个 executor 使用 fresh context
- 同 wave 并行
- 不同 wave 顺序
- 每个 plan 产出自己的 `SUMMARY.md`

这避免了一个常见问题：

- 所有任务都挤在一个超长上下文里
- 结果执行质量下降、上下文污染、依赖混乱

### 4.5 验证和收尾

`/gsd:verify-work`、`/gsd:complete-milestone` 是最终质量闭环。

它们负责：

- 逐 phase 验证
- milestone 归档
- requirements 完整性检查
- 项目描述的生命周期更新

---

## 5. 这个项目真正厉害的地方

### 5.1 把“状态”全部文件化

不是口头说“我记住了”，而是把记忆放进：

- `STATE.md`
- `PROJECT.md`
- `REQUIREMENTS.md`
- `ROADMAP.md`
- `SUMMARY.md`

这让上下文重启后仍可恢复。

### 5.2 把每种工作拆成不同命名空间

例如：

- 需求 = `REQ`
- 阶段 = `Phase`
- 计划 = `PLAN`
- 版本 = `milestone`
- 临时想法 = `todo`
- 快速任务 = `quick`
- 并行隔离 = `workspace/workstream`

这能显著减少“同一个词承载所有意义”的混乱。

### 5.3 计划执行是 wave 化的，不是线性硬排

这是很成熟的执行模型。

好处：

- 可以并行
- 可以隔离冲突
- 可以按依赖控制
- 可以保留 fresh context

### 5.4 每一步都有证据落盘

`SUMMARY.md`、`VERIFICATION.md`、`MILESTONES.md`、`STATE.md` 都是证据。

这让系统不是“做过”，而是“可证明做过”。

### 5.5 support for workstreams

多 workstream 并行的设计很实用：

- 适合大项目
- 适合多 repo
- 适合同一 milestone 内并行推进不同工作流

---

## 6. 可以借鉴到其他项目的点

下面这些是最值得借鉴的设计。

### 6.1 用文件作为主状态，不依赖隐式记忆

**可借鉴点：**

- 用少量稳定文件承载项目上下文
- 让每个阶段都能在断点续跑
- 把“决策”写入可审计文档

**适用场景：**

- spec-driven development
- agent workflow
- 长周期多阶段项目

### 6.2 需求、阶段、计划、版本分层

**可借鉴点：**

- `REQ` 只表示需求
- `Phase` 只表示阶段
- `PLAN` 只表示执行单元
- `milestone` 只表示发布版本

**价值：**

- 降低命名混乱
- 方便 traceability
- 方便归档和回看

### 6.3 traceability table

**可借鉴点：**

- 每个需求都映射到 phase
- 每个 phase 都能在 roadmap 上看到
- 每个 phase 执行后都能被 summary 证明

**价值：**

- 避免“写了需求但没计划”
- 避免“计划了但没执行”
- 避免“执行了但没法证明”

### 6.4 wave-based execution

**可借鉴点：**

- plan 以 wave 为单位并行
- 有依赖的任务顺序执行
- 无依赖的任务并行跑

**价值：**

- 提升吞吐
- 保持上下文干净
- 降低跨任务污染

### 6.5 两层状态：主状态 + digest

**可借鉴点：**

- `PROJECT.md` 负责完整上下文
- `STATE.md` 负责短期摘要

**价值：**

- 主状态不丢
- digest 读取快
- 不会因为一个文件过大导致上下文失控

### 6.6 捕捉临时想法为 todo

**可借鉴点：**

- 会话中途想到的点，不直接塞进主流程
- 先存为 todo，再决定是否折回 phase

**价值：**

- 避免打断主流程
- 避免遗漏
- 避免 scope 污染

### 6.7 快速任务和标准流程分离

**可借鉴点：**

- 小任务用 quick path
- 大任务走完整 milestone path

**价值：**

- 既保留质量保障
- 又不让小任务被完整 ceremony 拖慢

### 6.8 并行空间 / workstream

**可借鉴点：**

- 复杂项目允许多条工作线同时推进
- 每条线有自己的 state 和 roadmap

**价值：**

- 适合多团队并行
- 适合多个子目标共存
- 适合大型项目的阶段隔离

### 6.9 归档机制

**可借鉴点：**

- milestone 完成后把历史归档
- 当前文档保持小而清晰

**价值：**

- 避免无限膨胀
- 保留历史
- 让当前工作区更容易读

---

## 7. 不建议直接照搬的点

### 7.1 过多命令入口

GSD 的命令非常多，优点是细，缺点是上手成本高。

如果照搬到别的项目，要注意：

- 不要一开始就把命令拆得太碎
- 先保留主链路，再逐步加旁路

### 7.2 过强的 ceremony

GSD 有完整的讨论、规划、执行、验证、归档链条。

这很适合复杂项目，但小项目直接照搬可能会显得重。

### 7.3 对文档完整性的高要求

这套系统要求：

- 每阶段有对应文档
- 每个文档有结构
- 每个阶段有检查点

这对质量是加分项，但在探索型项目里可能太重。

---

## 8. 给 spec-first 的具体启发

如果把这套体系映射到 `spec-first`，最值得借鉴的点是：

1. **把状态写成文件，而不是只存在对话里**
2. **把需求、阶段、计划、版本分层**
3. **把执行拆成 wave，而不是强行单线程**
4. **把临时想法先存 todo，再决定要不要进主链**
5. **把摘要文件做成 digest，主文件保留完整真相**
6. **把 milestone 归档做成常规动作，避免历史膨胀**
7. **把并行工作空间 / workstream 当成独立命名空间**

如果要再进一步，spec-first 还能借鉴它的一个关键思想：

> 不是所有东西都要是主链 ID。  
> 主链只管交付，旁路负责缓冲、临时任务、并行隔离和版本归档。

---

## 9. 总结

`get-shit-done` 的流程本质是：

- 用文件系统承载长期记忆
- 用分层 ID 承载不同职责
- 用 phase 和 plan 组织执行
- 用 milestone 做版本封箱
- 用 todo / quick / workstream 做旁路和缓冲

它最可贵的不是“命令多”，而是**每种命名都对应一个明确职责**。

这也是最值得借鉴的地方。

