# spec-explain 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-explain/SKILL.md:23-42,66-73` | dispatch 授权与 fallback 有具体触发条件，明确禁止把 inline fallback 说成独立覆盖；现有文本内未见相互矛盾的步骤要求。 |
| D02 | pass | `skills/spec-explain/SKILL.md:68-73,87-93` | 区分概念、变更、想法和近期工作 recap，并限定解释职责；不替代范围界定、方案裁决或知识沉淀。 |
| D03 | pass | `skills/spec-explain/SKILL.md:66-72,77-85` | 明确来源读取失败、无外部研究工具及非交互情形的降级和披露方式；这些是 prose 约定，不冒称脚本硬 gate。 |
| D04 | pass | `skills/spec-explain/SKILL.md:70-73,79-85` | 输入分类、证据收集、产物交付和后续 handoff 均有对应规则；此 Skill 是独立教学入口，不强制套用 PRD 主链路交接。 |
| D05 | fail | `skills/spec-explain/SKILL.md:77,81`；`skills/spec-explain/references/destinations.md:3,22,31` | 入口将目的地处理定义为 Phase 4，但 reference 多处称 Phase 6，定位和交接术语不一致。 |
| D06 | pass | `skills/spec-explain/SKILL.md:40-42`；`skills/spec-explain/references/orchestration.md:7-14` | 对能力未知、不可用及模型覆盖不支持的情况规定了降级；该判断按 Skill 声明的能力假设裁定。 |
| D07 | pass | `skills/spec-explain/SKILL.md:89-93`；`skills/spec-explain/references/destinations.md:20-29` | 改进观察须由用户接受后转交 owning skill；明确不在本 Skill 中自动改文档、自动执行建议或沉淀 repo memory。 |
| D08 | pass | `skills/spec-explain/SKILL.md:48,68-73,77`；`skills/spec-explain/references/orchestration.md:18-26` | 按输入形态选择性 ground，外部概念跳过 repo grounding，并要求引用实际读取来源。 |
| B01 | pass | `skills/spec-explain/SKILL.md:7-19,87-93`；`skills/spec-explain/references/intake.md:20-39` | 说明正向用途与相邻入口边界；日常行为/配置问题直接答复，采用判断交给 `spec-pov`，明确排除范围讨论与知识沉淀。 |
| B02 | pass | `skills/spec-explain/SKILL.md:11-15,46-52,54-85`；`skills/spec-explain/references/intake.md:1-39` | 输入分类规则、artifact 例外、研究来源和降级边界相互对应；destination 和 check-in 由明确引用文件承接。 |
| B03 | pass | `skills/spec-explain/SKILL.md:27-42,81-85`；`skills/spec-explain/references/destinations.md:14-18` | dispatch、公开发布、目的地选择和非交互保留分别设有授权/同意边界；生成本地说明文档不等同于发布授权。 |
| B04 | pass | `skills/spec-explain/SKILL.md:68,70,77,85` | 要求面向当前 repo/worktree 读取 source 并记录引用；非交互时持久化到 repo-local owner；未发现把生成 runtime 当真相源的声明。 |
| B05 | pass | `skills/spec-explain/SKILL.md:61-68,70-72,81-85`；`skills/spec-explain/references/orchestration.md:14,18-26` | 明确 scratch 安全检查、证据缺失降级、部分输入处理及非交互保留；未见盲目重试副作用的要求。 |
| B06 | pass | `skills/spec-explain/SKILL.md:13,66-85,87-93` | 完成交付条件、保存路径和未完成边界有文本承诺；本项只裁静态合同，不据此声称实际产物已完成或效果已验证。 |
| X01 | not-applicable | `skills/spec-explain/SKILL.md:7-19,73` | 该 Skill 面向单一教学产物；文本未规定多模块实施或长任务编排职责，故复杂任务分解场景不适用。 |
| X02 | not-applicable | `skills/spec-explain/SKILL.md:7-19,87-93` | Skill 职责不包含 API、架构或版本变更决策；讲解相关技术主题不等于负责实施变更与迁移。 |
| X03 | not-applicable | `skills/spec-explain/SKILL.md:7-19,79-85` | Skill 不实施高风险代码变更或部署；发布教学产物另受目的地确认约束，不属于 X03 所指高风险实现/交付。 |
| X04 | pass | `skills/spec-explain/SKILL.md:66-72,79-85`；`skills/spec-explain/references/destinations.md:14-29` | recap 要求证据摘要含 commit 与 source 行引用；交付与 handoff 经用户选择/接受，且有受众与公开发布确认规则。 |

## Findings

1. **目的地 reference 的阶段编号与入口不一致。**  
   位置：`skills/spec-explain/SKILL.md:79-81`；`skills/spec-explain/references/destinations.md:3,22,31`  
   后果：入口称此流程是 Phase 4，而 reference 称其负责 Phase 6、并以“Phase 6 does”标识范围；维护者或执行者难以确认规则对应哪一阶段，可能造成引用遗漏或错误阶段假设。  
   最小修复建议：统一两处的阶段编号和描述，以入口实际编号为准；一并检查该 reference 中的 Phase 编号引用。

## 主责深挖面发现

未发现除上述编号不一致外的已确认静态缺陷。B01–B04、X01–X04 的判断均见逐项裁决表；其中 X01–X03 的 not-applicable 是按 Skill 自身职责边界作出，不表示其相关运行行为已验证。

## 未读文件

以下文件未能完成读取，因而消费者影响、合同下游一致性和其引用规则无法核验：

- `/Users/kuang/.codex/AGENTS.md` — 读取请求未获权限；未覆盖其中的额外审查要求。
- `docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04/evidence/input-packs/spec-explain.consumers.txt` — 尝试读取消费者清单所需命令未获批准；未覆盖清单列出的 tests/src 文件及其直接消费者关系。
- `skills/spec-explain/references/explainer-html.md` — 未读取；未覆盖 HTML 格式的渲染与产物约束。
- `skills/spec-explain/references/explainer-markdown.md` — 未读取；未覆盖 Markdown 格式的渲染与产物约束。
- `skills/spec-explain/references/check-in.md` — 未读取；未覆盖可选 Check yourself 内容的详细合同。
- `skills/spec-explain/references/CONCEPTS.md` — 未读取；未覆盖其条件加载的 canonical vocabulary。
- `skills/spec-explain/references/agents/work-recap-scout.md` — 未读取；未覆盖 recap scout 的具体提取边界与预算。
- `skills/spec-explain/scripts/`、`skills/spec-explain/templates/`、`skills/spec-explain/evals/` 下的文件 — 未读取；未覆盖相关实现、模板和静态评测案例。所提供检查表正文未列出这些文件的具体路径或名称。

## 结论一句话

在已读入口、intake、orchestration、destinations、检查表和合同基线范围内，除 Phase 编号不一致外，未发现其他可定位的静态缺陷；因消费者清单及若干引用资产未能读取，本次不能声称覆盖了指定消费者和全部相关 references。
