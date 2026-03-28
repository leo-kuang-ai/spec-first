---
title: "spec-first 与 compound-engineering 的定位对比"
date: 2026-03-28
category: workflow
problem_type: workflow
component: architecture
root_cause: "两个系统解决的问题不同：spec-first 偏项目执行系统，compound-engineering 偏能力系统与知识系统。"
resolution_type: comparison
severity: low
tags:
  - spec-first
  - compound-engineering
  - architecture
  - workflow
  - agent
  - skill
  - knowledge
---

# spec-first 与 compound-engineering 的定位对比

## 结论先说

这两个系统不是同一层面的替代关系，而是互补关系：

- `spec-first` 更像 **项目级执行系统**
- `compound-engineering` 更像 **能力系统 + 知识系统**

如果目标是“让一个项目持续稳定跑起来”，`spec-first` 更合适。
如果目标是“把高质量 agent / skill 能力做成可复用、可审计、可分发的体系”，`compound-engineering` 更合适。

## 一句话区分

- `spec-first`：让 AI 稳定做项目
- `compound-engineering`：让 AI 能力可复用、可审计、可分发
- `docs/solutions/`：让已解决的问题继续产生价值

## 对照图

```text
┌──────────────────────────────┬────────────────────────────────┐
│ spec-first                   │ compound-engineering           │
├──────────────────────────────┼────────────────────────────────┤
│ 项目级执行系统               │ 能力资产库 / 插件分发系统     │
│                              │                                │
│ 核心对象                     │ 核心对象                       │
│ .spec-first/spec             │ skills / agents / targets     │
│ .spec-first/tasks            │ src/converters / src/sync     │
│ .spec-first/workspace        │ docs/solutions                │
│                              │                                │
│ 强项                         │ 强项                           │
│ 持久上下文恢复               │ 多 agent 编排                  │
│ 任务生命周期管理             │ review / compound / refresh    │
│ hooks + task state           │ 跨平台转换与分发               │
│ 多平台接入                   │ 知识沉淀与审计性               │
│                              │                                │
│ 更适合                       │ 更适合                         │
│ 长期项目执行                 │ 复用 agent 能力                │
│ 连续会话推进                 │ 审查、研究、沉淀、发布         │
└──────────────────────────────┴────────────────────────────────┘
```

## 三层模型

```text
                 ┌─────────────────────────────┐
                 │        执行系统层            │
                 │         spec-first          │
                 │  spec / task / workspace    │
                 │  hooks / state / adapter    │
                 └──────────────┬──────────────┘
                                │
                                │  用于“把项目持续跑起来”
                                │
┌───────────────────────────────▼───────────────────────────────┐
│                      能力系统层                                │
│                 compound-engineering                           │
│  skills / agents / review / brainstorm / plan / work / docs   │
│  多平台转换 / 分发 / 同步                                       │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │  用于“把能力复用到多个平台”
                        │
                 ┌──────▼───────────────────┐
                 │        知识系统层         │
                 │   docs/solutions/         │
                 │   compound / refresh       │
                 │   可检索经验沉淀           │
                 └───────────────────────────┘
```

## 核心差异

### 1. 核心对象不同

`spec-first` 的中心对象是：

- `spec`
- `task`
- `workspace`
- `journal`
- `hooks`

`compound-engineering` 的中心对象是：

- `skill`
- `agent`
- `target`
- `plugin`
- `docs/solutions`

### 2. 目标不同

`spec-first` 关注的是：

- 如何把一个项目长期稳定地跑起来
- 如何保存上下文和任务状态
- 如何让 AI 在连续会话里不丢信息

`compound-engineering` 关注的是：

- 如何把工程能力拆成可复用的 skill / agent
- 如何让这些能力跨平台分发
- 如何把解决方案沉淀成长期知识

### 3. 执行方式不同

`spec-first` 更像：

```text
spec -> task -> hooks -> dispatch -> implement -> check -> finish
```

`compound-engineering` 更像：

```text
CLI -> plugin parse -> target convert / sync -> skill orchestration -> agent synthesis -> docs/solutions
```

### 4. 适配边界不同

`spec-first` 更偏：

- 项目级工作流
- 多平台接入
- 任务状态和记忆恢复

`compound-engineering` 更偏：

- 能力复用
- 多 persona 审查
- 知识编排与沉淀
- 面向多个 agent 平台的输出

## 各自优势

### `spec-first` 的优势

1. **项目状态管理更完整**
   - `.spec-first/spec/`、`.spec-first/tasks/`、`.spec-first/workspace/` 形成持续上下文。

2. **执行闭环更强**
   - hooks、任务状态、检查循环更像一个真正的工作系统。

3. **更适合长期项目推进**
   - 特别适合连续会话、多人协作、任务不断推进的场景。

### `compound-engineering` 的优势

1. **审计性更强**
   - 结构已经明显拆成 `CLI / plugin / skill / agent` 四层，问题定位更清楚。

2. **复用能力更强**
   - 47 个 agents、41 个 skills，可以组合成多种流程，而不是一次性脚本。

3. **review / research / compound 链路更成熟**
   - `ce:review` 擅长并行审查、置信度门控和结果合并。
   - `ce:compound` 擅长把已解决问题沉淀成知识。

4. **跨平台分发能力更强**
   - `src/targets/` 和 `src/sync/` 说明它不只是 Claude 内部工作流，而是一个可转换、可同步的能力分发系统。

## 适用场景

### 适合 `spec-first`

- 需要项目级持续执行
- 需要上下文注入和任务状态管理
- 需要稳定的任务生命周期控制
- 需要把一个项目长期跑顺

### 适合 `compound-engineering`

- 需要把 AI 能力产品化
- 需要并行 review、研究、计划、沉淀
- 需要多平台输出同一套能力
- 需要把经验写回知识库，形成复利

## 推荐理解方式

不要把它们理解成“谁替代谁”，而要理解成三层关系：

1. `spec-first` 负责 **执行系统**
2. `compound-engineering` 负责 **能力系统**
3. `docs/solutions/` 负责 **知识系统**

这三层组合起来，才是完整的 AI 工程化闭环。

## 最后一句话

如果你要的是“项目跑得稳”，看 `spec-first`。

如果你要的是“能力能复用、可审计、可沉淀”，看 `compound-engineering`。
