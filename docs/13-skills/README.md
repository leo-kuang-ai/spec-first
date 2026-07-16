# Skills 调研索引与刷新准则

本目录记录对外部 [`mattpocock/skills`](../../../skills/README.md) 与 `spec-first` 当前 source 的比较研究。它用于理解和设计输入，**不是** runtime contract、安装清单、权限证明或自动化编排说明。

## 本次证据快照

- **核对时间：** 2026-07-16。
- **外部项目基准：** `mattpocock/skills` 的 `main` 为 `e9fcdf95b402d360f90f1db8d776d5dd450f9234`；当日 `origin/HEAD` 与本地基准一致。
- **工作树前提：** 外部项目当时存在未提交改动。因此行为事实以磁盘上的 `SKILL.md` 为先，README、bucket README、plugin manifest 和版本文件只用来说明发布/导航意图。
- **本仓基准：** `spec-first/skills/**`、[`using-spec-first` 的公开路由表](../../skills/using-spec-first/references/public-route-map.md) 与[角色契约](../10-prompt/结构化项目角色契约.md)。generated runtime mirror 和历史计划都不是当前入口事实。

这份快照证明的是“在该时间点，源码如何描述自己”；它不证明任何 host 已安装相应 skill、可使用所需 provider，或已经产生了真实研发效果。

## 阅读路线

1. [skills-first-principles.md](./skills-first-principles.md)：从调用治理、状态归属、反馈环和发布治理推导外部项目的架构。
2. [project-overview-zh.md](./project-overview-zh.md)：外部项目的定位、分桶、调用模型和可迁移边界。
3. [engineering-workflow-map.md](./engineering-workflow-map.md)：17 个当前 Engineering skill 的职责、调用面和 on-ramp。
4. [skills-execution-chain.md](./skills-execution-chain.md)：从具体情境选择外部 skill 的执行语义。
5. [skill-flows-overview.html](./skill-flows-overview.html)：上述路径的交互式概览；以 Markdown 为事实来源。
6. [spec-first-workflow-map.md](./spec-first-workflow-map.md)：两边当前入口的相邻关系与不可填平的缺口。
7. [spec-first-refactor-plan.md](./spec-first-refactor-plan.md)：已冻结为 historical/candidate input 的 `spec-intake` 设计，不是待执行 backlog。

## 按文档的复核结论

| 文档 | 本次结论 | 主要证据 |
| --- | --- | --- |
| 第一性原理解读 | 项目的核心不是集中式流程引擎，而是将调用权、可复用纪律、项目状态与发布治理分离。 | 外部根 README、`writing-great-skills`、`ask-matt`、`setup-matt-pocock-skills`。 |
| 项目介绍 | 保留“小而可组合”的定位；补充快照与来源层级。 | 外部根 README、plugin manifest、bucket 约束、`SKILL.md`。 |
| Engineering 映射 | 当前目录有 17 个 skill：9 个用户显式入口、8 个模型或用户可达。 | `skills/engineering/*/SKILL.md` 与 `agents/openai.yaml`。 |
| 执行链路 | 主链、triage、wayfinder、调试与交接语义仍成立；补出 grilling confirmation gate 与 prototype 的 throwaway-branch 留存。 | `ask-matt`、`grilling`、`prototype`、`triage`、`implement` 等 source skill。 |
| 可视化 | 不是独立规范；修正为条件链路，并说明蓝色节点也可由用户显式调用。 | 对应 Markdown 及 source skill。 |
| 工作流映射 | 只保留“目标相邻”的比较，明确两边各自独有的 contract。 | 外部 source skill、`using-spec-first` route map、角色契约。 |
| `spec-intake` 计划 | 当前没有该 source skill 或公开路由；原提案只能作为 owner 采纳前的研究输入。 | 当前 source tree、公开路由表、历史 changelog/计划记录。 |

## 刷新规则

外部项目发生下列任一变化时，应先回读对应 `SKILL.md`，再更新本目录，而不是从旧说明反推：skill 改名/移桶、`disable-model-invocation` 或 `agents/openai.yaml` 改动、`ask-matt` 主链或 on-ramp 改动、artifact/副作用边界变化，或 plugin 发布集合变化。

`spec-first` 侧则先读 `using-spec-first` 和其 route map；只有确认现有 source skill、公开入口和合同都改变后，才能修改比较结论。历史计划只能记录候选方案，不能越过 current source 变成“已实现”或“已授权”的事实。
