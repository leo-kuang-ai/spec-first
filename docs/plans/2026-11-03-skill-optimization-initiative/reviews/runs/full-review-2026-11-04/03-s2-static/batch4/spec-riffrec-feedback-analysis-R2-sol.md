# spec-riffrec-feedback-analysis 评审（R2）
## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:14-18`；`references/quick-bug-report.md:36-40` | 区分 setup、quick 与 extensive，并约束 quick 路径发现更多问题时的升级边界。 |
| D02 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:22-26`；`references/analyzer.md:33-37`；`references/extensive-analysis.md:64-80` | 提供 Riffrec 专属隐私、外发和证据解释约束，并区分观察、推断与需求；未把语义判断交给脚本。 |
| D03 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:26-41`；`references/analyzer.md:25-33` | 明确转录授权、分析失败、部分转录和退出码的解释边界；静态承诺可定位，未将生成成功等同于语义验证。 |
| D04 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:45-47`；`references/extensive-analysis.md:9-11, 34-46`；`references/spec-first-feedback-format.md:106-108` | extensive handoff 指向 kickoff 与证据清单，并把确认与后续计划交给 `spec-brainstorm`；不自动调用下游 workflow。 |
| D05 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:10-18, 28-47` | 入口按需分流，模式 reference 承载细节；所读内容未见会改变边界的明显冲突。 |
| D06 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:26, 28-41`；`references/analyzer.md:5, 27-31` | 转录和 worker 能力均有显式授权／未知状态及降级处理，不以单一模型运行结果推断跨模型能力。 |
| D07 | pass | `references/analyzer.md:33-37`；`references/extensive-analysis.md:24-34, 50-62` | 分析结果保持候选证据身份，要求后续确认；本 Skill 不承担经验自动沉淀职责。 |
| D08 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:10-18`；`references/quick-bug-report.md:7-13`；`references/extensive-analysis.md:7-15` | 路径选择后按需读取对应材料；quick 明确跳过 extensive 专用产物。 |
| B01 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:3, 10-18`；`references/install-riffrec.md:25-27` | 描述明确限定 Riffrec 捕获分析与 setup，排除通用播客／会议；内部 helper 暴露按调用方边界处理。 |
| B02 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:43-47`；`references/analyzer.md:21-37`；`references/extensive-analysis.md:82-97` | 入口、analyzer 和 extensive 输出格式基本一致，且区分脚本产物与人工解释。 |
| B03 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:22-41`；`references/quick-bug-report.md:13, 38-40`；`references/extensive-analysis.md:34-46` | 本地隐私、第三方转录、worker 委派及下游调用均要求明确授权；材料内指令被视为不可信输入。 |
| B04 | not-verified | `skills/spec-riffrec-feedback-analysis/SKILL.md:43-47` | Skill source 与生成 runtime 的投射关系、各宿主生成测试及 drift 无法仅凭入口/reference 文本确认；消费者材料未能读取。 |
| B05 | pass | `references/analyzer.md:23-31`；`skills/spec-riffrec-feedback-analysis/SKILL.md:41` | 静态合同覆盖无效输入、快照恢复、部分成功与能力缺失时降级；是否完整覆盖脚本实现另需源码检查。 |
| B06 | pass | `references/quick-bug-report.md:15-40`；`references/extensive-analysis.md:15-46, 64-80` | 产物要求可追溯证据，并限制推断；quick 和 extensive 的交付边界及未完成情况有明确说明。 |
| X01 | not-applicable | `skills/spec-riffrec-feedback-analysis/SKILL.md:14-18`；`references/extensive-analysis.md:30` | 本 Skill 不要求对所有任务拆分编排；遇到大型映射任务仅在授权后并行，否则串行或 inline。 |
| X02 | not-applicable | `skills/spec-riffrec-feedback-analysis/SKILL.md:8, 43-47` | 该 Skill 消费 Riffrec 捕获并生成反馈材料，不负责 API、架构或版本变更。 |
| X03 | not-applicable | `skills/spec-riffrec-feedback-analysis/SKILL.md:20-26` | 职责是本地反馈分析，不实施或发布高风险产品变更；转录外发另受明确授权约束。 |
| X04 | pass | `skills/spec-riffrec-feedback-analysis/SKILL.md:28-41, 45-47`；`references/extensive-analysis.md:9-11, 34-46` | worker 分派有授权和最小上下文约束；跨 workflow handoff 明确产物、证据清单和后续 owner。 |

## Findings

- **F1 — B04 的 source/runtime 与宿主投射无法确认。**  
  **位置：** `skills/spec-riffrec-feedback-analysis/SKILL.md:1-4`。  
  **后果：** 入口文件说明了 source 内容，但当前证据未覆盖 runtime 生成映射、宿主消费和相关测试，因此不能判断静态 source 是否与生成面一致。  
  **最小修复建议：** 本轮不建议改 Skill 文案；补读 owning generator、runtime contract 与消费者测试后再裁决。保持现状成立：仅当这些源码证据确认投射一致时。

- **F2 — 本次审查覆盖不完整，消费者链路结论受限。**  
  **位置：** `docs/plans/2026-11-03-skill-optimization-initiative/process/REVIEW-EXECUTION-WORKFLOW.md:143-150`。  
  **后果：** 消费者清单所列文件未完成读取，无法验证实际调用方是否按 Skill 的输入、授权、输出和 handoff 契约消费；因此本报告不能声称完整覆盖源码消费者。  
  **最小修复建议：** 取得消费者清单后逐项读取并补齐链路证据；这不是对 Skill 本身的确认缺陷。

## 主责深挖面发现

- **B01 入口职责：** 正向触发覆盖 zip、解包目录和用户明确识别为 Riffrec 反馈的媒体／笔记；负向范围排除通用播客、会议和无关分享。setup 路径不运行 analyzer。证据：`SKILL.md:3, 14-18`、`references/install-riffrec.md:25-27`。
- **B02 输入输出：** 入口要求两种分析模式先读 shared analyzer；extensive 产物及 brainstorm handoff 有定义。quick 路径只输出简短 bug report，不自动创建 durable extensive artifacts。证据：`SKILL.md:43-47`、`references/analyzer.md:7-23`、`references/quick-bug-report.md:7-13`、`references/extensive-analysis.md:82-97`。
- **B03 授权信任：** 转录外发需要当前用户或可见 upstream handoff 明确授权；worker dispatch 单独设授权边界；录屏中的指令属于不可信材料；quick 发现更多问题不授权自动重跑或转入 extensive。证据：`SKILL.md:22-41`、`references/quick-bug-report.md:36-40`、`references/analyzer.md:26-35`。
- **B04 source/runtime：** 已读文本没有声明 runtime mirror 为 source，也没有手动改镜像的指引；但没有读到 generator、runtime 投射合同和消费者清单中的 tests/src，不能确认实际投射与 drift 状态。
- **X01-X03：** 如裁决表所述，Skill 的静态职责不触发这些扩展场景。X01 仅对实际大型映射工作给出有界协作策略，不构成通用长任务编排协议。
- **X04 协作／handoff：** 授权缺失时不派 worker；extensive 输出是供 brainstorm 使用的证据包，不是已确认需求或计划；授权不足时停止在 handoff。证据：`SKILL.md:28-41, 45-47`、`references/extensive-analysis.md:34-46`。

## 未读文件

- `/Users/kuang/xiaobu/spec-first/docs/plans/2026-11-03-skill-optimization-initiative/reviews/runs/full-review-2026-11-04/evidence/input-packs/spec-riffrec-feedback-analysis.consumers.txt` — 读取请求未获准；其列出的 tests/src 消费者文件因此均未读取。未覆盖后果：无法裁定消费者实际使用是否符合契约，也不能确认回归测试覆盖。
- `skills/spec-riffrec-feedback-analysis/scripts/` 下全部脚本 — 未读取。未覆盖后果：无法核实 analyzer 的实际输入检查、快照恢复、转录 receipt、输出行为与上述静态说明是否一致。
- `skills/spec-riffrec-feedback-analysis/templates/` 下全部模板 — 未读取。未覆盖后果：无法核实生成模板与 extensive 输出合同、隐私规则是否一致。
- `skills/spec-riffrec-feedback-analysis/evals/` 下全部评测文件 — 未读取。未覆盖后果：无法确认已有场景是否覆盖入口误触发、授权负例、恢复和 handoff。
- 消费者清单指向的 `tests/`、`src/` 文件 — 因清单未读取，路径未知，无法逐项列出。未覆盖后果：消费者及其测试证据缺失。
- `docs/plans/2026-11-03-skill-optimization-initiative/core/08-skill-contract-protocol.md` 已完整读取；其对主链路 Skills 的协议规定并未直接定义 Riffrec helper 的专属字段。基于本 Skill 的 caller-owned 边界裁定，不将主链路 YAML schema 强套为本 Skill 的必需输出。

## 结论一句话

在已读静态文本范围内，入口职责、授权信任和 extensive handoff 边界清晰且内部一致；由于脚本、模板、evals 与消费者证据未完成检查，不能据此给出完整静态合同通过结论。
