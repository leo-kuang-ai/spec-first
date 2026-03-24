# spec-first 需求文档目录

文档目录：`/Users/kuang/xiaobu/spec-first/docs/01-需求分析/spec-first-需求`
整理日期：2026-03-22

## 主文档声明

```text
系统级真源:
  overall-system-design.md

一期落地真源:
  phase-1-complete-solution.md

P0 实现真源:
  phase-1-p0-skills-spec.md
```

## 当前代码状态说明

当前代码库 `spec-first` 仍然运行在既有的 `feature / stage / verify / orchestrate`
主流程上。

本目录中的文档定义的是：

- 下一阶段的一期需求真源
- 未来要落地的 P0 主链
- 未来产物目录与 handoff 机制

而不是：

- 当前代码已经完成的 skill 注册清单
- 当前 runtime 已稳定存在的目录结构
- 当前 CLI 已公开暴露的命令事实

因此阅读本目录时，默认应理解为：

- `spec-first` 现状：仍以既有 stage/feature 流程为主
- `spec-first-需求/`：定义下一阶段一期实现目标

如果需求文档与当前代码行为不一致：

- “当前代码事实”以代码为准
- “下一阶段要实现什么”以本目录真源文档为准

配套规则文档：

- `new-project-vs-incremental-demand-flow.md`
  - 负责新项目 / 增量需求 / 混合型需求分流
- `ai-assisted-quality-improvement-requirements.md`
  - 负责多人协作质量提升背景需求
- `phase-2-system-integration-design.md`
  - 负责二期系统接缝设计

如果多份文档之间出现表述差异，优先以：

1. `overall-system-design.md`
   - 负责系统级目标、边界、原则
2. `new-project-vs-incremental-demand-flow.md`
   - 负责场景分流与接入差异
3. `phase-1-complete-solution.md`
   - 负责一期具体边界、流程、handoff 机制
4. `phase-1-p0-skills-spec.md`
   - 负责 P0 skill 实现定义

如果是 Skill 落位、P0/P1 划分、handoff 规则冲突，以 `phase-1-complete-solution.md` 为准。

## 当前分期

```text
一期:
  聚焦需求工程内核

二期:
  聚焦企业系统接缝
  飞书 -> 需求工程 -> Git 仓库 -> DevOps 发布
```

如果当前只讨论一期，建议优先阅读：

1. `overall-system-design.md`
2. `new-project-vs-incremental-demand-flow.md`
3. `phase-1-complete-solution.md`
4. `phase-1-p0-skills-spec.md`

其中，一期的具体范围、流程和 skill 落位，以：

`phase-1-complete-solution.md`

为准。

## 文档清单

1. [overall-system-design.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/spec-first-需求/overall-system-design.md)
   说明：整套需求工程系统的总体设计思路，包含目标问题、设计原则、分期边界、系统级抽象，以及当前一期与 gstack 的职责切分。

2. [phase-1-complete-solution.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/spec-first-需求/phase-1-complete-solution.md)
   说明：一期完整方案主文档，定义一期边界、Skill 清单、详细流程、handoff 机制、与 gstack 的职责切分。当前收敛后，一期核心是“手动准备 workspace 后，由 `/focus-requirements` 产出需求聚焦 PRD，再按固定 handoff 文档约定进入下游”。

3. [phase-1-p0-skills-spec.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/spec-first-需求/phase-1-p0-skills-spec.md)
   说明：一期核心 skill 与 handoff 文档约定的详细定义稿，覆盖职责、输入、输出、记录位置、完成标准与失败条件。当前唯一核心 skill 为 `/focus-requirements`，handoff 通过固定目录与固定文档约定完成。

4. [new-project-vs-incremental-demand-flow.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/spec-first-需求/new-project-vs-incremental-demand-flow.md)
   说明：一期需求工程范围基线，覆盖新项目、增量需求、混合型需求三类流程，以及 skill 落位、能力边界和与 gstack 的映射关系。

5. [ai-assisted-quality-improvement-requirements.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/spec-first-需求/ai-assisted-quality-improvement-requirements.md)
   说明：多人协作下 AI 辅助开发质量提升的正式需求文档，定义建设目标、适用场景、流程阶段能力、边界约束、关键产物与成功标准。

6. [phase-2-system-integration-design.md](/Users/kuang/xiaobu/spec-first/docs/01-需求分析/spec-first-需求/phase-2-system-integration-design.md)
   说明：第二期系统接缝设计，定义如何把飞书、GitLab / GitHub、自研 DevOps 接入需求工程主线，形成需求、代码、发布的可追踪闭环。

## 推荐阅读顺序

### 如果你重点关心“需求怎么拆到工程代码”

```text
index.md
  -> overall-system-design.md
  -> new-project-vs-incremental-demand-flow.md
  -> phase-1-complete-solution.md
```

### 如果你重点关心“全栈开发者如何接入这套流程”

```text
index.md
  -> new-project-vs-incremental-demand-flow.md
```

### 如果你想先看整个系统为什么这么设计

```text
index.md
  -> overall-system-design.md
  -> new-project-vs-incremental-demand-flow.md
  -> phase-1-complete-solution.md
```

### 如果你关心“AI 是否真的能提升多人协作质量”

```text
index.md
  -> ai-assisted-quality-improvement-requirements.md
  -> overall-system-design.md
```

### 如果你关心第二期如何接企业现有系统

```text
index.md
  -> phase-2-system-integration-design.md
  -> overall-system-design.md
  -> new-project-vs-incremental-demand-flow.md
```

### 如果你现在只关心一期怎么落地

```text
index.md
  -> overall-system-design.md
  -> new-project-vs-incremental-demand-flow.md
  -> phase-1-complete-solution.md
  -> phase-1-p0-skills-spec.md
```

## 文档关系图

```text
overall-system-design.md
        |
        v
new-project-vs-incremental-demand-flow.md
        |
        v
phase-1-complete-solution.md
        |
        v
phase-1-p0-skills-spec.md

ai-assisted-quality-improvement-requirements.md
        |
        v
phase-2-system-integration-design.md
```

## 每份文档的定位

### 1. `overall-system-design.md`

回答的问题：

- 这套需求工程系统解决什么问题？
- 一期和二期分别做什么？
- 当前和 gstack 的职责边界怎么切？
- 当前系统级原则是什么？

### 2. `phase-1-complete-solution.md`

回答的问题：

- 一期具体边界是什么？
- 一期 Skill 清单和优先级是什么？
- 详细流程、handoff 机制和默认 gstack 入口是什么？
- workspace / handoff / docs 应该怎么落位？

### 3. `phase-1-p0-skills-spec.md`

回答的问题：

- 核心 skill 和 handoff 文档约定分别做什么？
- 输入、输出、记录位置是什么？
- 完成标准和失败条件是什么？
- P0 的共性实现约束是什么？

### 4. `new-project-vs-incremental-demand-flow.md`

回答的问题：

- 新项目、增量需求、混合型需求怎么分流？
- 各端 owner 在什么时机建 workspace？
- 一期主链什么时候 handoff 给 gstack？
- 全栈整包和多人分端在流程上有什么差异？

### 5. `ai-assisted-quality-improvement-requirements.md`

回答的问题：

- 为什么要做这套系统？
- 多人协作场景下要解决哪些核心痛点？
- 成功标准和业务约束是什么？

### 6. `phase-2-system-integration-design.md`

回答的问题：

- 二期怎么接飞书、Git、DevOps？
- 需求、代码、发布如何形成闭环？
- 哪些系统接缝不属于一期？

## 已归档背景文档

下面这些文档已从当前需求主目录移出，备份到：

`/Users/kuang/Desktop/ops/spec-first-pro/docs/bak/spec-first-需求-20260322`

它们仍可作为背景分析参考，但不再作为当前需求真源：

- `gstack-architecture-analysis.md`
- `gstack-flow-ascii.md`
- `gstack-project-analysis.md`
- `gstack-quality-gates-analysis.md`
- `gstack-skills-analysis.md`
