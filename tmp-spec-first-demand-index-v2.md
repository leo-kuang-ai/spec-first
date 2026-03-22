# spec-first 需求文档目录

文档目录：`/Users/kuang/Desktop/ops/spec-first-pro/docs/01-需求分析/spec-first-需求`
整理日期：2026-03-22

## 主文档声明

```text
当前目录下的主文档 / Source of Truth:
  overall-system-design.md
```

配套规则文档：

- `new-project-vs-incremental-demand-flow.md`
  - 负责一期需求工程的流程分流与 skill 落位

如果多份文档之间出现表述差异，优先以：

1. `overall-system-design.md`
   - 负责系统级目标、边界、原则
2. `new-project-vs-incremental-demand-flow.md`
   - 负责新项目 / 增量需求 / 混合型需求分流
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

1. [gstack-architecture-analysis.md](/Users/kuang/Desktop/ops/spec-first-pro/docs/01-需求分析/spec-first-需求/gstack-architecture-analysis.md)
   说明：项目整体架构、目录结构、运行链路、`browse` 子系统、`SKILL.md` 生成机制、安全机制、skill 协作关系。

2. [gstack-skills-analysis.md](/Users/kuang/Desktop/ops/spec-first-pro/docs/01-需求分析/spec-first-需求/gstack-skills-analysis.md)
   说明：21 个 skill 的逐个详解，包含触发场景、主逻辑、协同关系。

3. [gstack-quality-gates-analysis.md](/Users/kuang/Desktop/ops/spec-first-pro/docs/01-需求分析/spec-first-需求/gstack-quality-gates-analysis.md)
   说明：gstack 如何做质量保障、阶段门禁、阶段产物流转，以及软门禁/流程门禁/近硬门禁/硬门禁的区别。

4. [gstack-project-analysis.md](/Users/kuang/Desktop/ops/spec-first-pro/docs/01-需求分析/spec-first-需求/gstack-project-analysis.md)
   说明：最初的完整总稿，包含架构篇和 skill 篇的合并版本，适合一次性通读。

5. [gstack-flow-ascii.md](/Users/kuang/Desktop/ops/spec-first-pro/docs/01-需求分析/spec-first-需求/gstack-flow-ascii.md)
   说明：新项目开发、存量项目需求迭代、bugfix/排障流程的 ASCII 图，以及门禁视角图。

6. [new-project-vs-incremental-demand-flow.md](/Users/kuang/Desktop/ops/spec-first-pro/docs/01-需求分析/spec-first-需求/new-project-vs-incremental-demand-flow.md)
   说明：一期需求工程范围基线，覆盖新项目、增量需求、混合型需求三类流程，以及 skill 落位、能力边界和与 gstack 的映射关系。

7. [overall-system-design.md](/Users/kuang/Desktop/ops/spec-first-pro/docs/01-需求分析/spec-first-需求/overall-system-design.md)
   说明：整套需求工程系统的总体设计思路，包含目标问题、设计原则、分期边界、系统级抽象，以及当前一期与 gstack 的职责切分。

8. [ai-assisted-quality-improvement-requirements.md](/Users/kuang/Desktop/ops/spec-first-pro/docs/01-需求分析/spec-first-需求/ai-assisted-quality-improvement-requirements.md)
   说明：多人协作下 AI 辅助开发质量提升的正式需求文档，定义建设目标、适用场景、流程阶段能力、边界约束、关键产物与成功标准。

9. [phase-2-system-integration-design.md](/Users/kuang/Desktop/ops/spec-first-pro/docs/01-需求分析/spec-first-需求/phase-2-system-integration-design.md)
   说明：第二期系统接缝设计，定义如何把飞书、GitLab / GitHub、自研 DevOps 接入需求工程主线，形成需求、代码、发布的可追踪闭环。

10. [phase-1-complete-solution.md](/Users/kuang/Desktop/ops/spec-first-pro/docs/01-需求分析/spec-first-需求/phase-1-complete-solution.md)
   说明：一期完整方案主文档，定义一期边界、Skill 清单、详细流程、handoff 机制、与 gstack 的职责切分。

11. [phase-1-p0-skills-spec.md](/Users/kuang/Desktop/ops/spec-first-pro/docs/01-需求分析/spec-first-需求/phase-1-p0-skills-spec.md)
   说明：一期 4 个 P0 skill 的详细定义稿，覆盖职责、输入、输出、记录位置、完成标准与失败条件。

## 推荐阅读顺序

### 如果你想快速理解项目

```text
index.md
  -> gstack-architecture-analysis.md
  -> gstack-skills-analysis.md
```

### 如果你重点关心流程治理和质量控制

```text
index.md
  -> gstack-quality-gates-analysis.md
  -> gstack-flow-ascii.md
  -> gstack-architecture-analysis.md
  -> gstack-skills-analysis.md
```

### 如果你重点关心“需求怎么拆到工程代码”

```text
index.md
  -> new-project-vs-incremental-demand-flow.md
  -> overall-system-design.md
  -> phase-1-complete-solution.md
```

### 如果你重点关心“新项目和增量需求流程是否一样”

```text
index.md
  -> new-project-vs-incremental-demand-flow.md
  -> gstack-flow-ascii.md
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
  -> gstack-quality-gates-analysis.md
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

### 如果你只想看一份完整文档

```text
index.md
  -> gstack-project-analysis.md
```

## 文档关系图

```text
                    gstack-project-analysis.md
                              |
              +---------------+---------------+
              |                               |
              v                               v
gstack-architecture-analysis.md   gstack-skills-analysis.md
              |
              v
gstack-quality-gates-analysis.md
              |
              +-------------------------------+
              |                               |
              v                               v
                 gstack-flow-ascii.md
                              |
                              v
          new-project-vs-incremental-demand-flow.md
                              |
                              v
                overall-system-design.md
                              |
              +---------------+---------------+
              |                               |
              v                               v
     phase-1-complete-solution.md   phase-2-system-integration-design.md
              |
              v
     phase-1-p0-skills-spec.md
              |
              v
ai-assisted-quality-improvement-requirements.md
```

## 每份文档的定位

### 1. 架构篇

回答的问题：

- gstack 到底是什么系统？
- `browse` 为什么是守护进程？
- `SKILL.md` 为什么是模板生成的？
- setup/build/test 链路怎么串起来？

### 2. skill 详解篇

回答的问题：

- 每个 skill 是干什么的？
- 什么时候触发？
- 每个 skill 的内部流程是什么？
- skill 和 skill 之间怎么协作？

### 3. 质量门禁篇

回答的问题：

- gstack 如何保障各阶段质量？
- 上一阶段进入下一阶段有没有门禁？
- 哪些是软门禁，哪些接近硬门禁？
- `/ship`、`/qa`、`Eng Review` 在质量体系里扮演什么角色？

### 4. 总稿

回答的问题：

- 如果我要把前面几份合起来一次性读，应该看哪份？

答案：

- 看 `gstack-project-analysis.md`

### 5. 流程 ASCII 图

回答的问题：

- 新项目怎么跑？
- 存量项目需求迭代怎么跑？
- bugfix 流程怎么跑？
- 门禁在流程上的位置在哪里？

### 6. 新项目 / 增量 / 混合型流程

回答的问题：

- “需求评审完成后各端识别工程并建 workspace”是否能覆盖新项目？
- 新项目和增量需求的研发流程应该如何分流？
- 混合型需求应该如何处理？
- 哪一步是几类流程的真正分界点？

### 7. 整体设计篇

回答的问题：

- 整个系统为什么要这样设计？
- 它想解决哪些真实研发问题？
- 为什么强调文档驱动、阶段驱动和 skill 化？
- 多人分端和全栈整包在系统里是如何统一的？

### 8. AI 质量提升需求篇

回答的问题：

- 多人协作下 AI 是否真的能提升开发质量？
- AI 应该参与哪些流程节点？
- 质量提升应如何转化为正式需求？
- 成功标准和产物要求是什么？

### 9. 第二期系统集成篇

回答的问题：

- 企业现有系统怎么接入这套主线？
- 飞书、Git、DevOps 怎么形成闭环？
- 哪些能力是一期开外，哪些是二期承接？

### 10. 一期完整方案篇

回答的问题：

- 一期到底做到哪里为止？
- 一期的 Skill 清单是什么？
- 一期详细流程、泳道图、handoff 机制是什么？
- 一期和 gstack 的职责边界怎么切？

### 11. 一期 P0 Skill 规格篇

回答的问题：

- 一期最关键的 4 个 skill 各自做什么？
- 每个 skill 的输入输出和记录位置是什么？
- 什么算完成，什么算失败？
- 它们如何衔接到 gstack 的 `/plan-ceo-review`？

## 一句话总结

```text
架构篇 = 看系统怎么搭
skill篇 = 看角色怎么分工
门禁篇 = 看质量怎么兜底
流程图 = 看实际怎么跑
新项目/增量/混合型流程篇 = 看三类需求怎么走不同主线
整体设计篇 = 看整个系统为什么这样设计
AI质量需求篇 = 看为什么要建设这套 AI 辅助质量体系
第二期系统集成篇 = 看如何把企业现有系统接进需求工程主线
总稿 = 一次读全
```
