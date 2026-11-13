# OpenSpec 与 spec-first 项目阶段适用性对比

本文帮助团队判断：在不同项目阶段，应该优先采用 OpenSpec 的能力规范机制、spec-first 的工程闭环机制，还是把两者组合使用。

结论先行：**OpenSpec 更适合从需求变更规范化切入，spec-first 更适合在存量工程中治理 AI 研发闭环。**

## 阶段对比

| 项目阶段 | OpenSpec 适用性 | spec-first 适用性 |
| --- | --- | --- |
| 0-1 新项目 | 很适合。能力 spec、change proposal、delta spec 可以从第一天开始沉淀，历史负担小。 | 也适合，但相对更重。只有团队从一开始就需要 plan、work、review、knowledge 闭环时，收益会更明显。 |
| 1-10 已有雏形 | 适合。可以从新增需求开始写 `changes/<change>/specs/...`，逐步合并到 `specs/<capability>/spec.md`。 | 更适合。可以结合已有代码、需求、计划、任务、review 和知识沉淀，减少“只写 spec、不落地”的问题。 |
| 10-100 中大型存量项目 | 可用，但历史能力 spec 需要切片补写；如果不初始化历史能力，只能覆盖新增需求。 | 强适合。可以先理解代码、沉淀知识、按需求规划、执行、review、compound，逐步治理存量复杂度。 |
| 多端项目：App/H5/PC/Admin/Backend | 可以表达 capability，但多端工程规范、跨端一致性和团队开发约束需要额外设计。 | 更适合。可以把多端 scope、团队规范、架构约束、review 规则纳入 workflow 输入。 |
| 高治理或高风险业务 | 能用 proposal/spec 流程控制需求变更，但工程证据链和 review 闭环不完整。 | 更适合。强调 evidence、source/runtime 边界、review、验证和知识沉淀。 |
| 历史代码庞大且文档缺失 | 不太擅长自动补齐历史 spec；需要人工或半自动切片 backfill。 | 更适合。可以用 graphify/codegraph、直接源码阅读、经验文档和 review 结果逐步初始化，但初始化结果应先作为候选，不直接当 confirmed truth。 |

## 核心差异

OpenSpec 的中心链路更像：

```text
Change -> Delta Spec -> Apply -> Current Capability Spec
```

它主要解决：**每次需求变更有没有被规范化描述，并最终沉淀成当前能力规范。**

spec-first 的中心链路是：

```text
Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge
```

它主要解决：**AI coding 如何在真实工程中可治理、可验证、可复用、可沉淀。**

## 怎么选择

- 新项目、团队愿意从第一天维护能力规范：OpenSpec 更轻，启动收益快。
- 已有复杂代码、AI 要参与研发、需要降低误改/漏审/上下文丢失：spec-first 更强。
- 已有系统但只想规范新增需求：可以先采用 OpenSpec 思路，从 change-scoped spec 开始。
- 已有系统且想建立工程闭环：优先 spec-first，再借鉴 OpenSpec 的 capability spec 思想。

## 推荐组合方式

两者不是必须二选一。更稳妥的组合方式是：

1. 需求开始时，维护 change-scoped spec，记录这次变更要改变的能力和行为。
2. 需求完成后，把稳定结论沉淀到 capability current spec，作为当前系统能力说明。
3. 由 spec-first 继续治理 plan、task、work、review、debug、knowledge 和团队规范。
4. 对存量历史能力，按高风险能力、核心链路和高 churn 模块切片初始化；初始化结果先作为候选，经过证据、owner、review 或测试确认后再提升。

这样 OpenSpec 提供“能力规范累计”的思路，spec-first 提供“从代码到知识沉淀”的工程闭环。
