# New Project Summary Contract Design

> 目的：统一新项目与存量项目在 `spec-first` 中的入口顺序、`first` 职责边界，以及 `summary` 在各阶段的依赖策略。

## Background

当前讨论暴露出一个稳定的结构性矛盾：

- `summary` 是流程型 skill 的重要认知输入
- 但新项目在没有代码时，无法从代码分析直接生成 `summary`
- 如果把 `summary` 设成所有流程型 skill 的硬依赖，就会把新项目入口错误地推到 `first`

经过梳理后，结论是：

- `spec` / `design` / `task` 属于“定义阶段”，不应该依赖已有代码上下文
- `first` 属于“认知阶段”，用于从已存在的代码或脚手架中建立项目认知
- `code` 可以利用 `summary` 增强决策质量，但不应被 `summary` 硬阻断
- `verify` 需要稳定的项目认知，因此仍应以 `summary` 作为核心输入

## Problem Statement

仓库里目前存在两种容易互相打架的理解：

1. 把 `first` 视为新项目入口，甚至希望它在无代码时通过问答生成“骨架版 summary”
2. 把 `summary` 视为所有流程型 skill 的统一前置，导致新项目阶段被认知资产卡住

这两种理解都不够准确。

更合理的切法是：

- 新项目先走需求定义链路：`/spec -> /design -> /task`
- 用户或脚手架产出初始代码后，再运行 `/first` 建立项目认知
- 后续实现与验证阶段再消费 `summary`

## Goals

- 新项目入口清晰，先从 `/spec` 开始，而不是从 `/first` 开始
- `summary` 的语义统一为“项目认知摘要”，不是“代码分析结果”的别名
- 流程型 skill 的依赖分层明确，避免所有 skill 都自己实现上下文收集
- `first` 的职责保持单一：对已有项目资产做认知编译，而不是替代需求定义

## Non-Goals

- 不在本方案中设计新的问答系统
- 不在本方案中引入新的 runtime 资产格式
- 不在本方案中重写 `first` 的全部实现细节
- 不在本方案中让 `first` 重新承担新项目需求定义职责

## Approaches

### Option A: 让 `first` 支持无代码新项目，并生成骨架 `summary`

做法：
- `first` 检测到空项目后进入交互式认知模式
- 通过问答收集技术栈、模块意图和业务方向
- 产出骨架版 `summary`

优点：
- 所有项目都能先跑 `first`
- `summary` 的存在感强

缺点：
- 容易把“项目认知”误变成“需求定义”
- `first` 会开始吞掉 `spec` 的职责
- 问答结果的稳定性和可验证性比代码分析更弱

### Option B: 去掉所有流程型 skill 的 `summary` 硬依赖

做法：
- 所有 skill 都改成可无上下文启动
- 每个 skill 自己再去收集上下文或现场探索

优点：
- 表面上最灵活

缺点：
- 会把 `first` 的价值分散到每个 skill
- 形成“每个 skill 都半个 first”的维护模型
- 结果不一致、文案不一致、可验证性差

### Option C: 按阶段拆分依赖，保留 `summary` 作为认知层输出

做法：
- `spec` / `design` / `task` 不依赖 `summary`
- `first` 只负责在已有代码或脚手架存在时生成 `summary`
- `code` 允许无 `summary` 运行，但推荐使用
- `verify` 仍以 `summary` 为核心输入

优点：
- `spec` 仍然是新项目入口
- `first` 保持单一职责
- `summary` 继续作为统一认知底座
- 不需要把上下文收集逻辑复制到每个 skill

缺点：
- 需要重新梳理 `skill-input-contracts.yaml`
- 部分文档和测试需要同步更新

## Recommendation

推荐采用 **Option C**。

原因很简单：

- 它保留了标准软件工程流程：需求 -> 设计 -> 实现 -> 验证
- 它不会把 `first` 变成新项目入口
- 它不会让每个 skill 都重新实现上下文收集
- 它让 `summary` 成为“认知层资产”，而不是“所有阶段的门禁”

## Proposed Stage Contract

### 新项目主链

1. `/spec-first:spec`
2. `/spec-first:design`
3. `/spec-first:task`
4. 初始代码或脚手架
5. `/spec-first:first`
6. `/spec-first:code`
7. `/spec-first:verify`

### 阶段依赖建议

| 阶段 | `summary` 依赖 | 理由 |
|---|---|---|
| `spec` | `required: []` | 从零定义需求，不应依赖已有代码认知 |
| `design` | `required: []` | 基于需求做技术方案，不应依赖已有代码认知 |
| `task` | `required: []` | 基于设计拆任务，不应依赖已有代码认知 |
| `first` | 不消费 `summary` | 自己就是认知生成源，输入应来自代码/脚手架/项目事实 |
| `code` | `recommended: [summary]` | 有认知更好；没有也能继续做代码探索 |
| `verify` | `required: [summary]` | 验证需要稳定的项目认知和已形成的上下文 |

## Data Flow

```text
用户需求
  ↓
/spec  → spec.md
  ↓
/design → design.md
  ↓
/task   → task_plan.md
  ↓
初始代码 / 脚手架
  ↓
/first  → summary / runtime cognition
  ↓
/code   → 继续实现
  ↓
/verify → 阶段验证
```

## Behavior by Scenario

### Scenario 1: New project with no code

- 入口应是 `/spec`
- 不应强制先跑 `/first`
- `first` 在没有代码时不承担“补需求”的职责

### Scenario 2: New project after scaffolding exists

- 可以运行 `/first` 生成认知摘要
- `summary` 成为 `code` / `verify` 的辅助输入

### Scenario 3: Existing project with mature codebase

- `first` 可以正常产出 `summary`
- 后续流程型 skill 继续消费 `summary`

## Error Handling

### If a flow skill is invoked without `summary`

建议行为：

- `spec` / `design` / `task`：继续执行，不阻断
- `code`：允许继续，但提示可先跑 `/first`
- `verify`：提示先补齐 `summary` 或先跑 `/first`

### If `first` is invoked on an empty project

建议行为：

- 不尝试伪造代码认知
- 明确提示当前缺少可分析的项目事实
- 引导用户回到 `/spec` 链路，而不是继续“生成 summary”

## Validation

建议通过以下方式验证方案是否成立：

1. `skill-input-contracts.yaml` 中，`spec` / `design` / `task` 不再依赖 `summary`
2. `code` 的 `summary` 从硬依赖降级为推荐项
3. `verify` 保持 `summary` 依赖
4. `first` 文档明确只在已有项目事实存在时建立认知
5. 新项目从 `/spec` 开始时，不会被 `first` 或 `summary` 卡住

## Risks

- 如果 `spec` / `design` / `task` 的文档没有同步更新，仍然可能出现“流程型 skill 以为自己需要 summary”的旧认知
- 如果 `first` 的边界没有写清，后续又容易被扩展成“问答式需求定义器”
- 如果 `verify` 放弃 `summary`，会降低验证阶段的稳定性和可解释性

## Open Questions

- `code` 是否最终保留 `summary` 为推荐项，还是完全改为无上下文可运行？
- `verify` 是否需要在无 `summary` 时自动引导 `/first`，还是只做软提示？
- 是否需要给 `summary` 增加来源字段，用于区分 `code-analysis`、`interactive`、`hybrid`？

## Decision

当前建议采用：

- 新项目入口：`/spec`
- `first`：认知补全，不是新项目入口
- `summary`：保留为认知层核心资产
- `spec` / `design` / `task`：不依赖 `summary`
- `code`：推荐 `summary`
- `verify`：保留 `summary` 硬依赖

