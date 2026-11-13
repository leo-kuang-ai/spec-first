# spec-plan 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | not-verified | `skills/spec-plan/SKILL.md:15-19`；`docs/plans/2026-11-03-skill-optimization-initiative/process/REVIEW-EXECUTION-WORKFLOW.md:110` | 能看到流程职责和规划/执行边界，但没有对照任务或回归证据，无法判断步骤是否仍必要、是否过度指导。 |
| D02 | pass | `skills/spec-plan/SKILL.md:30-38`；`skills/spec-plan/references/intake.md:9-17` | 以 Product Contract、当前源码、授权和复用边界指导规划，并区分脚本事实准备与 LLM 判断；不是仅给通用最佳实践。 |
| D03 | not-verified | `skills/spec-plan/SKILL.md:98-108`；`skills/spec-plan/references/plan-handoff.md:13-24` | 规定置信检查、文档审查和降级披露，但未读到 owning script 或正反例运行证据；不能确认实际执行或机械强制。 |
| D04 | fail | `skills/spec-plan/SKILL.md:15、27-31、94-98`；`docs/plans/2026-11-03-skill-optimization-initiative/core/08-skill-contract-protocol.md:93-152` | Skill 当前输出统一计划及 readiness/execution 等契约，core/08 却要求另一套 YAML 输出结构和自动协议检查；消费者清单缺失，未能确认是否有适配层。 |
| D05 | not-verified | `skills/spec-plan/SKILL.md:64-68、72-108`；`skills/spec-plan/references/intake.md:126-179` | 入口按阶段加载 references，具备条件化加载设计；但本轮无完整 read trace、调用成本或维护成本数据，不能判定整体紧凑性。 |
| D06 | not-verified | `skills/spec-plan/SKILL.md:88-90、106`；`skills/spec-plan/references/research.md:13-15` | 有 dispatch 不可用、模型覆盖不支持等降级约定；本轮没有实际模型、宿主加载及对应运行证据。 |
| D07 | not-applicable | `skills/spec-plan/SKILL.md:19、36、40-46`；`docs/plans/2026-11-03-skill-optimization-initiative/process/REVIEW-EXECUTION-WORKFLOW.md:116` | 本入口明确不负责执行，也不从执行期结果学习；本项所要求的问题→修订→复验链不属于其职责，X04 的交接知识消费仍另行适用。 |
| D08 | not-verified | `skills/spec-plan/SKILL.md:64-68、72-108`；`skills/spec-plan/references/planning-evidence-boundaries.md:16、34-41` | 文案要求摘要优先、按需读取并记录重要证据限制；但没有本次完整读取轨迹与成本，不能证明摘要未漏掉要求或实际更省上下文。 |
| B01 | pass | `skills/spec-plan/SKILL.md:3、15-19、54-64`；`skills/spec-plan/references/intake.md:86-124` | 正向触发覆盖目标已适合规划的工作；对 WHAT 未定、故障和已可执行任务提供区分或路由，不要求所有任务串行经过整条主链。 |
| B02 | fail | `skills/spec-plan/SKILL.md:21-31、35-38、94-108`；`docs/plans/2026-11-03-skill-optimization-initiative/core/08-skill-contract-protocol.md:111-152、318-356` | Skill 的实际产物与 core/08 的输出字段、验证门及自动检查描述不一致；消费者清单缺失，无法确认哪些部分已迁移或由其他 owner 承接。 |
| B03 | pass | `skills/spec-plan/SKILL.md:30、35-38、50、64`；`skills/spec-plan/references/planning-evidence-boundaries.md:9-22`；`skills/spec-plan/references/research.md:11-15` | 明确区分用户任务指令与产品决策权、材料指令与授权、公开调用与委派/外部访问授权，并规定缺授权时的降级。此为静态文案判定，未验证真实宿主行为。 |
| B04 | pass | `skills/spec-plan/SKILL.md:9-11、64`；`skills/spec-plan/references/planning-evidence-boundaries.md:18-22、87-93` | 将 runtime 镜像排除在普通规划真相源外，要求追溯 source/generator，并将 provider 输出视为 advisory。此为源码边界判定，未验证宿主投射。 |
| B05 | not-verified | `skills/spec-plan/SKILL.md:68、90、106-108`；`skills/spec-plan/references/research.md:3、13、135` | 对缺引用、dispatch 失败、研究不可用和已启动 worker 的重试有明确处理，但必需 reference/脚本未完整读取，也无超时、中断、重复执行或 dirty overlap 场景证据。 |
| B06 | pass | `skills/spec-plan/SKILL.md:40-46、98-123`；`skills/spec-plan/references/plan-handoff.md:13-24、41-57、61-69` | 有格式区分的审查/降级路径、最终检查及限制披露；将计划交付与完整 goal 状态区分。独立审查是否实际运行仍须具体运行证据。 |
| X01 | pass | `skills/spec-plan/SKILL.md:94`；`skills/spec-plan/references/intake.md:149-161`；`skills/spec-plan/references/research.md:169-179` | 大型或跨边界工作可提升深度、触发 flow 分析；计划结构要求依赖与顺序，并允许使用宿主能力而非另建编排。 |
| X02 | pass | `skills/spec-plan/references/intake.md:157-160` | durable interface 变化会加载专门的演化 lens；当前没有足够证据认定 API/架构变更检查缺失。是否覆盖具体迁移、ADR 和回退细节，因未读该 lens 而未验证。 |
| X03 | not-verified | `skills/spec-plan/references/intake.md:157-161`；`skills/spec-plan/SKILL.md:94、98` | 入口会加载高风险规划 lens 并要求风险/验证相关规划，但该 lens 未读，无法核查高风险触发、风险—验证对账及回滚覆盖。 |
| X04 | pass | `skills/spec-plan/SKILL.md:36、46、108-123`；`skills/spec-plan/references/plan-handoff.md:3-7、61-69` | 有调用方/执行 owner 边界，并定义 source refs、freshness、limitations 与审查降级；知识消费和失效链不属于本入口直接完成的执行期职责。 |

## Findings

1. **规划产物合同存在明显口径冲突，消费者适配尚未证实**  
   **位置：** `skills/spec-plan/SKILL.md:21-31、94-98`；`docs/plans/2026-11-03-skill-optimization-initiative/core/08-skill-contract-protocol.md:111-152、318-356`  
   **后果：** core/08 描述的是 `plan_content.technical_approach`、`acceptance_conditions`、`boundary_handling`、`implementation_steps` 等 YAML 结构，并声称在 `spec-plan` 完成时执行 PRD→Plan 自动检查；当前入口描述的是 `spec-unified-plan/v1`、readiness、execution 和实现单元，且未指向该检查的实现或兼容映射。若 core/08 仍是有效合同，消费者可能拿不到约定字段；若其已过时，则不能继续作为当前合同基线。  
   **最小建议：** 核实并标明 core/08 是否已被替代；若仍有效，补充当前统一计划到协议字段的明确映射及 owning 检查证据；若已失效，在权威合同处标记迁移/退役，不让旧协议继续造成歧义。  
   **限制：** 用户提供的消费者清单路径在当前 worktree 中不存在，因此不能确认下游是否已有适配器或测试覆盖。

## 主责深挖面发现

- **B01 — 入口职责：** 入口定位清楚，允许从粗略描述直接规划，并声明直接调用必须留在规划评估中；对 brainstorm、debug、work 和 doc-review 的相似边界有显式说明。依据：`skills/spec-plan/SKILL.md:3、15-19`。本轮未运行自然入口路由场景，因此结论限于源码结构。
- **B02 — 输入输出：** 对上游 Product Contract、legacy requirements、直接 bootstrap、统一计划 readiness 和下游消费者均有定义；但与 core/08 的 YAML 合同冲突是本轮主要 finding。消费者证据文件缺失，无法确认端到端输入输出匹配。
- **B03 — 授权与信任：** 规则较完整地区分任务授权、WHAT 决策权、研究/委派授权以及 provider advisory 身份。重点证据：`skills/spec-plan/references/planning-evidence-boundaries.md:9-22`、`skills/spec-plan/references/research.md:11-15`。未执行委派、外发、付费或宿主工具场景，不能据此声称运行时行为已通过。
- **B04 — source/runtime 与宿主：** 普通规划明确排除生成镜像，并要求 source/generator-first；未检查生成器或各宿主 projection，也未验证 fresh-source 加载，故仅判定静态边界成立。
- **X01 — 大型任务：** `intake.md` 定义 Lightweight/Standard/Deep 和条件 lens；`research.md` 对 Standard/Deep 或流程不清楚时要求 flow/edge-case 分析。结构上有渐进深入路径，但没有真实大型任务产物，不能评价实际分解粒度与恢复质量。
- **X02 — API/架构/版本变化：** `intake.md:157-160` 明确 durable interface 变化需加载 `interface-and-evolution-lens.md`。该 lens 未读，因而只确认触发接线存在；ADR、兼容策略、版本迁移与回退的充分性为 **not-verified**。
- **X03 — 高风险实现或交付：** `intake.md:157` 明确存在 high-risk lens 触发，但本轮未读取 `high-risk-plan-lens.md`，无法判定风险分类、必要验证、发布/回滚检查是否足够。表中因此记 not-verified，而非以“有引用”代替通过。
- **X04 — 协作、跨会话与知识：** `plan-handoff.md` 为 owner-local handoff 定义 source identity、refs、freshness、artifact type、limitations，并区分调用方与执行 owner。未检查实际 handoff artifact、consumer 或知识失效场景；本项只确认静态接口约定。

## 未读文件

- `skills/spec-plan/references/settled-decisions.md`、`output-mode.md`、`resume.md`、`output-contracts.md`、`universal-planning.md`、`structure.md`、`plan-sections.md`、`final-review.md`、`deepening-workflow.md`：本轮没有完整展开其阶段执行路径；**未覆盖** settled decision 保留、输出模式/格式切换、恢复资格、各类计划结构、置信门、deepening 触发与终止等行为细节。
- `skills/spec-plan/references/high-risk-plan-lens.md`、`interface-and-evolution-lens.md`、`frontend-engineering-lens.md`、`synthesis-summary.md`：本轮未展开条件性 lens；**未覆盖** 高风险判定、接口迁移/ADR、前端行为/a11y 决策，以及范围确认文案与 headless 分支完整规则。
- `skills/spec-plan/references/markdown-rendering.md`、`html-rendering.md`：未检查格式渲染约束；**未覆盖** 产物结构、HTML/Markdown 独占路径及格式特有审计要求。
- `skills/spec-plan/references/agents/**`：未读 worker prompt assets；当前未执行 worker dispatch，故不影响对 inline 入口职责的静态结论，但**未覆盖**各专门 prompt 的范围、输出和与 caller 的一致性。
- `skills/spec-plan/scripts/**`、`templates/**`、`evals/**`：本轮未检查，且用户指定的消费者文件清单无法读取；**未覆盖** 自动检查、模板生成、评测覆盖及输出验证是否有可执行实现。
- `docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04/evidence/input-packs/spec-plan.consumers.txt`：路径在当前 worktree 中不存在；**未覆盖**该清单指定的 tests/src consumers，不能据此判断已有适配层或回归测试。
- `/Users/kuang/.codex/AGENTS.md`：读取请求未获准；**未覆盖**其中额外的私有执行约束。本评审依据已加载的项目指令和当前用户的只读要求继续。

## 结论一句话

`spec-plan` 的入口职责、授权边界和 source/runtime 原则在静态源码中较清楚，但当前产物与 core/08 协议存在待裁决冲突，且消费者清单和多个条件 reference 未覆盖，因此不能给出端到端合同或行为通过结论。
