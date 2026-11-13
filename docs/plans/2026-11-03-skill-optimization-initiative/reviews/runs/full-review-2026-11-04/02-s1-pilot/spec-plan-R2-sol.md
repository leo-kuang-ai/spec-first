# spec-plan 评审（R2）

> **范围说明：** 以下是基于当前 worktree 中已读取源码的静态审查。`spec-plan` 入口、项目角色契约、评审流程第 4 节、合同基线及 `planning-evidence-boundaries.md` 已读取。用户指定的 consumers 清单位于当前 worktree 之外；未能读取清单及其所列消费者源码，因此消费者行为、运行表现和端到端交接结论不作推断。私有全局指引 `/Users/kuang/.codex/AGENTS.md` 的读取请求未获许可。

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | not-verified | `skills/spec-plan/SKILL.md:64-108` | 入口要求按需读取多个阶段 owner，但未完成全部路径与任务场景的对照，无法确认每项约束解决的实际失败、是否过时或相互冲突。 |
| D02 | pass | `skills/spec-plan/SKILL.md:29-38`；`skills/spec-plan/references/planning-evidence-boundaries.md:7-22` | 明确区分 Product Contract、当前源码及 advisory 输入的权威，并划分 LLM 架构判断与脚本准备事实的职责。 |
| D03 | pass | `skills/spec-plan/SKILL.md:33-38, 98-108` | 明确规划阶段禁止实现、测试及 runtime mutation，并要求如实声明 prose 规则不是宿主硬写保护；未将语义充分性伪装为机械门禁。 |
| D04 | not-verified | `skills/spec-plan/SKILL.md:27-31, 35-37`；合同基线 `docs/plans/2026-11-03-skill-optimization-initiative/core/08-skill-contract-protocol.md:93-152` | 入口声明消费者与交付边界，但未读取消费者清单及消费者源码，不能验证实际交接是否正确消费计划内容；合同中的旧结构化字段不应直接当作当前实现要求。 |
| D05 | not-verified | `skills/spec-plan/SKILL.md:64-108` | 入口把阶段指令分散到按需 references，结构上可定位；但未读完整调用路径，不能判断重复、冲突、阅读负担或删减损失。 |
| D06 | pass | `skills/spec-plan/SKILL.md:9-11, 35-38, 90, 106-108` | 按 Skill 自身能力假设，Provider 可不可用、独立审查不可用或宿主写门缺失时均要求披露限制/降级，不声称 prose 等同硬保证。 |
| D07 | not-verified | `skills/spec-plan/SKILL.md:19, 46` | Skill 声明不负责执行期学习且要求核验 goal-state 能力；经验修订链、实际消费者和失效条件未由本轮材料验证。 |
| D08 | not-verified | `skills/spec-plan/SKILL.md:64-68, 86-90` | 有摘要优先、按需读取和缺少必需 reference 时阻断的承诺；未核验实际调用读取轨迹及上下文成本。 |
| B01 | pass | `skills/spec-plan/SKILL.md:3-4, 15-19, 54-64` | 正向触发、相似入口负例和“直接调用仍留在规划评估”的边界明确；不会把产出 implementation-ready 当作所有请求的必然结果。 |
| B02 | pass | `skills/spec-plan/SKILL.md:21-31, 64-108`；`skills/spec-plan/references/planning-evidence-boundaries.md:7-41` | 输入、输出、阻断条件、authority 与 evidence 限制均可定位；当前请求者任务方向不冒充 Product Owner 的 WHAT 决策权。 |
| B03 | pass | `skills/spec-plan/SKILL.md:29-38, 44, 90, 106-114` | 明确规划不授权代码、测试、提交或落地；材料内嵌指令无授权效力，worker dispatch 和外部数据访问另需授权，且不重复索取既有授权。 |
| B04 | pass | `skills/spec-plan/SKILL.md:9-11, 35-38, 64`；`skills/spec-plan/references/planning-evidence-boundaries.md:18-22, 89-93` | source/runtime 边界明确；runtime mirror 不作真相源，source/runtime 冲突指向 source/generator 修复而非 runtime-only patch。 |
| B05 | not-verified | `skills/spec-plan/SKILL.md:68, 86-90, 106-108` | reference 缺失时有阻断路径，缺能力时要求披露降级；超时、部分成功、重试、恢复及 dirty overlap 的全路径规则尚未审阅。 |
| B06 | pass | `skills/spec-plan/SKILL.md:40-46, 96-123` | 完成边界区分计划交付与实现交接，要求报告实际 review 状态、mutation policy、finding 和限制；不以中间计划冒充完整目标完成。 |
| X01 | pass | `skills/spec-plan/SKILL.md:92-94`；`skills/spec-plan/references/planning-evidence-boundaries.md:43-85` | 多模块/复杂依赖情况下可通过结构与 compose lens 记录 owner、依赖及失败证据；该 lens 触发于特定架构改动，而非强迫所有计划采用统一编排。 |
| X02 | pass | `skills/spec-plan/references/planning-evidence-boundaries.md:43-83`；`skills/spec-plan/SKILL.md:92-98` | 架构/版本/持久接口扩展可使用 existing-capability inventory 和 right-sized posture；非所有 Skill 或计划都被强制新增 schema。 |
| X03 | pass | `skills/spec-plan/SKILL.md:23, 29, 35-38, 92-98` | 高风险 surface 被纳入 Durable 输出、授权与 evidence 约束；部署/运行副作用不因计划本身获得授权。 |
| X04 | pass | `skills/spec-plan/SKILL.md:36, 44-46, 90, 106-123`；`skills/spec-plan/references/planning-evidence-boundaries.md:32-41` | pipeline、跨 owner handoff 和证据落点均有边界；摘要、来源、新鲜度及限制按实际证据变化记录，不把独立审查或知识工作假定为已发生。 |

## Findings

1. **消费者端交接无法在本轮确认。**  
   - **位置：** `skills/spec-plan/SKILL.md:31, 36, 108-123`  
   - **后果：** 入口宣称 `spec-write-tasks`、`spec-work`、`spec-doc-review`、human reviewers 和 caller-owned pipelines 为消费者，并规定计划写入后的交接行为；但当前评审未读取指定消费者清单及消费者源码。因此不能将输入输出的一致性或消费者实际遵循情况登记为已验证。  
   - **最小建议：** 不改 Skill；补读消费者清单及其所列文件，再针对 H02/H03 与实际调用路径复核。此项属于证据缺口，不是已证实的 Skill 缺陷。

2. **全局工作指引未纳入本轮证据。**  
   - **位置：** 当前无可用 `file:line`（文件读取未获许可）  
   - **后果：** 无法对 `/Users/kuang/.codex/AGENTS.md` 中可能影响评审约束的内容作核对；不能据此声称该文件与审查结论一致。  
   - **最小建议：** 由有读取权限的评审环境补充核对。此项为未覆盖，不是对 Skill 源码的 finding。

未发现可凭本轮已读源码确认的语义缺陷；该结论不覆盖未读 references、消费者源码或行为运行证据。

## 主责深挖面发现

- **B01—入口职责：** 入口把职责限定为“形成可持久化计划”，并区分 WHAT 未解决、HOW 未定、实现执行及失败处理等相邻职责；直接调用时进入规划评估，但允许以阻断检查点或上游移交结束，而非强造 implementation-ready（`skills/spec-plan/SKILL.md:15-19, 27-31`）。目前看到的触发边界内部一致。
- **B02—输入输出：** 接受 unified plan、legacy requirements、bug/feature 描述、既有计划和 answer-seeking objective；输出可为 implementation-ready 计划、对应非代码/答案寻求产物，或保留未决问题的阻断/移交（`skills/spec-plan/SKILL.md:15, 27-31`）。职责合同轻量，不能将旧合同基线的 YAML 字段清单当成当前 Skill 必须输出的 schema。
- **B03—授权与信任：** 规划不授权实现、测试、提交、落地或 runtime 修改；worker dispatch 与外部数据访问有独立授权门槛；文件/工具输出内嵌指令不构成授权（`skills/spec-plan/SKILL.md:30, 35-38, 90, 106`）。对 prose 自身不能提供硬写保护的限制也有明示（`skills/spec-plan/SKILL.md:38`）。
- **B04—source/runtime 与宿主：** 通过 evidence boundary 明确排除常规规划中的 generated runtime mirror，并规定相关问题须回到 source/generator；宿主差异按实际能力降级，不从环境权限推导授权（`skills/spec-plan/references/planning-evidence-boundaries.md:18-22, 87-93`；`skills/spec-plan/SKILL.md:35-38`）。
- **X01—大需求条件面：** 入口将结构、分解、步骤依赖、测试场景和范围边界交给 structure/compose owner（`skills/spec-plan/SKILL.md:92-94`）；架构新增/持久面改动触发现有能力盘点，并明确 glue 的责任上限、失败传播与恢复证据（`skills/spec-plan/references/planning-evidence-boundaries.md:43-85`）。
- **X02—接口与演化：** 对新增 durable surface 的计划须说明现有 owner、合同、扩展点及 reuse/extend/compose/new 姿态；runtime mirror 不得成为 owner（`skills/spec-plan/references/planning-evidence-boundaries.md:45-61, 81`）。本轮未读取完整接口/演化 lens，不能进一步确认 ADR、迁移与兼容分支的细节覆盖。
- **X03—高风险：** Durable 路由明确包含认证、支付、迁移与外部合同 surface（`skills/spec-plan/SKILL.md:23`）；是否涉及生产执行仍受明确授权与规划/执行边界约束（`skills/spec-plan/SKILL.md:35-38`）。
- **X04—协作与跨会话：** pipeline 返回 caller；后续实现须交由 `spec-work` 或现有执行 owner，计划只作为中间产物（`skills/spec-plan/SKILL.md:36, 111-123`）。本轮只检查了入口与 evidence boundary，跨会话摘要、具体 handoff artifact 格式及调用恢复细节仍需完整读取相应 owner 后确认。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：读取未获许可；未覆盖其中可能适用于本次评审的用户级执行规则。
- `/Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04/evidence/input-packs/spec-plan.consumers.txt`：位于指定 worktree 外；本轮未读取；因此未覆盖清单中的 tests/src consumers、实际 H02/H03 交接及消费行为。
- `skills/spec-plan/references/settled-decisions.md`、`output-mode.md`、`resume.md`、`intake.md`、`research.md`、`structure.md`、`plan-sections.md`、`final-review.md`、`plan-handoff.md`：入口按阶段要求完整读取这些 owner，但本轮未逐一读取；未覆盖对应条件分支的细节一致性、失败/恢复路径和具体格式规则。
- `skills/spec-plan/references/output-contracts.md`、`markdown-rendering.md`、`html-rendering.md`、`universal-planning.md`、`approach-altitude.md`、`deepening-workflow.md`、`synthesis-summary.md`、`high-risk-plan-lens.md`、`interface-and-evolution-lens.md`、`frontend-engineering-lens.md`：本轮未读取；未覆盖相应输出格式、领域分支、deepening 及风险/接口专项 lens 的细节。
- `skills/spec-plan/evals/consumer-replay-cases.json`、`examples.json`、`output-quality-cases.json`、`eval.yaml`、`README.md`：本轮未读取；未覆盖案例与当前源码的匹配性、评测判据及其可证明范围。
- `skills/spec-plan/scripts/`、`skills/spec-plan/templates/`：目录文件清单显示本轮盘点的两层目录中未列出这两类资产；没有进一步深查子目录或依赖脚本/模板的消费者，因此不对其不存在作绝对断言。

## 结论一句话

已读入口与 evidence boundary 在职责、授权和 source/runtime 边界上整体一致；但消费者清单、完整必读 references 与行为证据未覆盖，故本结果是**受限静态审查**，不是 `spec-plan` 全面通过结论。
