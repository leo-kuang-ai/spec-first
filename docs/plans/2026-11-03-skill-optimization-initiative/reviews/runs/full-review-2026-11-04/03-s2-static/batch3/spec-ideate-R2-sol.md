# spec-ideate 评审（R2）

## 逐项裁决表

本轮仅裁决 `structure_contract` 静态合同。审查目录为 `/private/tmp/spec-first-fr-wt`，工具确认 HEAD 为 `5b59293bb1aecb40c4894549a89f8b045dfa40fe`，`git status --short` 为空；未修改文件、未运行测试或行为评测。下列路径均相对于该目录。

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | fail | `skills/spec-ideate/references/divergent-ideation.md:84-85`；`skills/spec-ideate/references/post-ideation-workflow.md:35` | 生成阶段禁止扩大用户指定范围，过滤阶段却允许凭 basis 放行范围扩张，约束相互冲突。 |
| D02 | fail | `skills/spec-ideate/references/agents/issue-intelligence-analyst.md:76`、`:90` | 已明确“关闭不证明痛点消失”，后文却直接认定零开放 issue 的主题是已解决问题，领域判断依据不一致。 |
| D03 | pass | `skills/spec-ideate/references/post-ideation-workflow.md:7-17`、`:64`、`:149-164` | 明确核验存活依据、预算耗尽时收缩声明、写入失败时完整回传；这些属于可定位的 prose 义务，不据此宣称已由工具硬强制。 |
| D04 | pass | `skills/spec-ideate/references/post-ideation-workflow.md:109-117`；`skills/spec-brainstorm/SKILL.md:21-25`、`:69`；`tests/unit/spec-ideate-clarification-handoff-contracts.test.js:16-44` | 聚焦 seed 携带证据、快照、限制及相邻拒绝项，与 brainstorm 的输入及决策继承职责相容。 |
| D05 | fail | `skills/spec-ideate/references/divergent-ideation.md:85`；`skills/spec-ideate/references/post-ideation-workflow.md:35`；`skills/spec-ideate/references/decomposition.md:38` | owning references 存在范围与 inline 读取规则冲突，不能仅靠入口的阶段索引得到唯一执行解释。 |
| D06 | pass | `skills/spec-ideate/SKILL.md:58-79`；`skills/spec-ideate/references/universal-ideation.md:25` | 按实时授权和能力决定委派、模型覆盖与并行度，未知时继承或串行，且禁止把 fallback 冒充独立验证。 |
| D07 | pass | `skills/spec-ideate/references/agents/learnings-researcher.md:151-168`；`tests/unit/agent-persona-template-drift.test.js:54-63`、`:121-130` | 经验消费要求完整读取、核对当前证据及过期情况，维护侧另有显式模板漂移约束；本 Skill 不承担知识自动晋升。 |
| D08 | fail | `skills/spec-ideate/references/decomposition.md:34-38`；`skills/spec-ideate/references/user-research-artifacts.md:14`；`skills/spec-ideate/references/divergent-ideation.md:5`、`:28` | 无委派时要求 inline 保持同一证据合同，却仍禁止主会话读取 dossier，与生成前必读 dossier 冲突。 |
| B01 | pass | `skills/spec-ideate/SKILL.md:3`、`:12-18`；`skills/spec-ideate/references/scope-gates.md:5-7`；`skills/spec-ideate/references/post-ideation-workflow.md:119-129` | 区分从零生成候选与打磨用户既有想法，也明确生成后的集合讨论可留在本 Skill，不必强制串行进入后续阶段。 |
| B02 | fail | `skills/spec-ideate/references/grounding.md:98-102`；`skills/spec-ideate/references/divergent-ideation.md:29-34`、`:85`；`skills/spec-ideate/references/post-ideation-workflow.md:35` | 输入的 directive/evidence 分层清楚，但用户范围约束在生成与最终筛选之间被赋予不同强度，输出资格不唯一。 |
| B03 | pass | `skills/spec-ideate/SKILL.md:69`、`:97-99`；`skills/spec-ideate/references/agents/slack-researcher.md:25`、`:61`、`:119-128`；`skills/spec-ideate/references/post-ideation-workflow.md:136-143` | 委派、外部研究、Slack 读取、提交和删除分别受限；工具权限与材料内容不替代真实授权。 |
| B04 | pass | `skills/spec-ideate/SKILL.md:97-103`；`src/cli/plugin-sync.js:230-274`、`:499-504`、`:702-750`；`tests/unit/plugin-modules.test.js:744-768` | 当前源码及 references 是审查依据，投射由 CLI 从 source 生成并检查漂移，evals 明确不进入 runtime；未将当前 fresh-source 阅读冒充宿主加载验证。 |
| B05 | pass | `skills/spec-ideate/references/grounding.md:3`、`:19-35`、`:117`；`skills/spec-ideate/references/issue-intelligence.md:5-8`；`skills/spec-ideate/references/post-ideation-workflow.md:60-66` | 有私有 scratch、启动失败降级、部分 grounding 披露、缺扫描数据降级、唯一文件名及写入失败完整回传规则。 |
| B06 | pass | `skills/spec-ideate/SKILL.md:18-20`；`skills/spec-ideate/references/post-ideation-workflow.md:17-44`、`:64`、`:149-164` | 完成标准覆盖先生成后批判、逐项拒绝理由、依据核验和可恢复交付，不把方向发散职责扩张成实施验收。 |
| X01 | pass | `skills/spec-ideate/references/decomposition.md:7-17`、`:30-40`；`skills/spec-ideate/references/divergent-ideation.md:91-95` | 对复杂主题提供 axes、限定侦察预算与最多两轴恢复，超出覆盖能力时显式留缺口；实施依赖排序和集成不属于本 Skill。 |
| X02 | not-applicable | `skills/spec-ideate/SKILL.md:18`、`:26-28`；`skills/spec-ideate/references/ideation-sections.md:118-125` | 本 Skill 交付未承诺实施的方向，不修改 API、架构或版本；兼容迁移、ADR 与回退实施合同应由选定方向后的 owning workflow 承担。 |
| X03 | not-applicable | `skills/spec-ideate/SKILL.md:27`；`skills/spec-ideate/references/post-ideation-workflow.md:112-117` | 不执行高风险实现、发布或部署，handoff 明确排除 implementation HOW；研究及本地产物副作用已在 B03 单独审查。 |
| X04 | pass | `skills/spec-ideate/references/grounding.md:29`、`:35-39`；`skills/spec-ideate/references/output-mode.md:45-51`；`skills/spec-ideate/references/post-ideation-workflow.md:109-115`、`:145` | 具有恢复入口、快照与 freshness/limitations 传递、单一 durable decision owner 和独立性披露，不把临时文件作为跨调用唯一依据。 |

## Findings

### F1 · P2：最终过滤允许越过生成阶段明确的用户范围

- **位置：** `skills/spec-ideate/references/post-ideation-workflow.md:35`。
- **对应冲突：** `skills/spec-ideate/references/divergent-ideation.md:85` 明确要求在用户指定切片内保持雄心，并把扩大到整个产品认定为 scope mismatch；过滤规则却允许 basis 明确论证后放行 scope overrun。
- **触发与后果：** 用户只要求“账户设置流程”的改进方向时，候选若论证了全产品重构的收益，最终过滤可将其留下；同一个明确范围在生成与筛选阶段不再具有相同约束力。
- **最小修复建议：** 将“有 basis 即可放行”改为“可作为范围外补充建议单列，不计入本轮存活候选；用户明确扩大范围后再重评”。不需要新增脚本或状态机。
- **复验要点：** 固定一个窄范围输入及一个依据充分但越界的候选，核对生成规则和过滤规则均不允许它直接进入范围内排名。

### F2 · P2：issue 聚类把“已关闭”重新提升为“已解决”

- **位置：** `skills/spec-ideate/references/agents/issue-intelligence-analyst.md:90`。
- **对应冲突：** 同文件 `:76` 要求关闭状态不能证明部署、采用或痛点消失，并允许保留带限制的 closed-only 信号；`:90` 则禁止 closed-only issue 创建主题，理由是“零开放 issue 的主题是已解决问题”。
- **触发与后果：** 扫描范围内只有近期关闭报告，但尚无部署或效果证据时，分析员会按关闭状态直接排除该主题；有价值的复发、交付落差或后续机会信号可能在进入 ideation 前被丢弃。
- **最小修复建议：** 禁止的是把 closed-only 信号表述为“已确认的持续痛点”，而不是禁止形成主题；保留其作为已报告痛点、交付信号或待核验假设，并附状态与证据限制。
- **复验要点：** 对“近期关闭、无现场结果证据”的集合，允许返回受限主题，但不得断言问题仍持续或已经解决。

### F3 · P2：面向委派的 dossier 隔离规则未限定适用条件

- **位置：** `skills/spec-ideate/references/decomposition.md:38`；`skills/spec-ideate/references/user-research-artifacts.md:14`。
- **对应冲突：** `decomposition.md:34` 明确允许无委派时串行收集同样的 dossier；`divergent-ideation.md:5` 要求 inline 保持相同合同，`:28` 又要求生成者先读 dossier，但上述两处仍无条件禁止主会话读取其内容。
- **触发与后果：** 默认未授权委派时，主会话同时承担生成者和 verifier，却被禁止读取所需证据文件；照字面执行只能跳过必要读取或违反上下文隔离指令。材料较多或上下文压缩后，这个冲突尤其明显。
- **最小修复建议：** 将“主会话只保留 gist、不读 dossier”限定为实际存在独立 worker 的路径；inline/serial 路径允许主会话按预算读取所需原文，继续披露没有独立性。
- **复验要点：** 未授权委派、提供一个较大研究文件时，inline 路径应能无冲突地完成 evidence → generation → basis verification。

## 主责深挖面发现

| 检查面 | 深挖结论 |
|---|---|
| B01：入口职责 | **保持现状成立。** `scope-gates.md:5` 将用户既有想法的需求收敛交给 brainstorm；`post-ideation-workflow.md:119-129` 留下的“讨论或调整”限定在已生成集合内。两者不应仅因都出现 refine 就被误报为职责重叠。 |
| B02：输入输出 | **主要缺口是 F1、F3。** directive/evidence 分类本身成立（`grounding.md:98-102`），每个候选也有统一 basis 合同（`divergent-ideation.md:63-77`）；问题在跨阶段约束与 fallback 读取没有完全对齐。 |
| B03：授权信任 | **保持现状成立。** `SKILL.md:69` 将委派授权与能力分离；`:99` 将外部研究授权独立处理；Slack prompt 另守 workspace/channel/time/audience（`agents/slack-researcher.md:25`、`:121`）。本轮没有依据认定调用 Skill 自动授予委派或外发权限。 |
| B04：source/runtime | **保持现状成立，结论限静态链路。** `src/cli/plugin-sync.js:258-274` 从 owning source 生成支持文件；`:499-504` 排除 evals；`:724-750` 以转换后的 source 检查 runtime 内容。没有运行投射或 doctor，因此不声称任何已安装镜像当前无 drift。 |
| X01：复杂主题 | **保持现状成立。** axes 与恢复上限是覆盖及资源边界，不是把研发主链路硬编码为实施状态机；最多恢复两轴后披露空轴（`divergent-ideation.md:91`）符合本 Skill 的职责。 |
| X02：接口与迁移 | **不扩张职责成立。** 架构 pivot 可以作为方向候选（`divergent-ideation.md:84`），但概念视觉明确不得升级为详细架构规格（`ideation-sections.md:118-125`）；不能据此要求本 Skill 交付迁移执行方案。 |
| X03：高风险交付 | **不扩张职责成立。** 方向评估保留 downsides 与复杂度（`ideation-sections.md:64-66`），实际实现与交付验证留给下游；没有实施行为就不要求发布或回滚检查。 |
| X04：交接与知识 | **保持现状成立。** seed 不只传文件指针，也不复制全量产物；它保留来源快照、限制、未核验假设和一个相邻拒绝项（`post-ideation-workflow.md:110-114`）。只有用户实际检查并选择的权衡才能作为 transient settled decision，不能把模型排名晋升为 owner 决策。 |

补充口径：

- 已完整阅读消费者清单所列 **12 个测试文件**；清单中没有独立 `src/` 条目，另补读了 `src/cli/plugin-sync.js` 和 brainstorm 入口。
- 测试中的字符串断言、模板 hash 和 fixture 定义，只作为维护合同证据；没有将其视为本轮测试通过或行为有效的证明。
- `core/08-skill-contract-protocol.md:27-289` 定义的是五个其他主链路 Skill 的拟议合同，并未给 `spec-ideate` 定义专属 YAML schema。本轮采用其输入、输出及消费者对账原则，没有把其中 FR 数量门槛、自动重试或自动裁决要求强套到 ideation。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：已请求读取，但工具返回尚未授予权限；未绕过权限重试。**未覆盖后果：** 无法核对该私有全局文件中是否还有额外要求，本报告不能声称已遵循其不可见内容。
- 目标 Skill 的 `SKILL.md`、全部 17 个 references 文件（含 4 个 agent prompts）、`eval.yaml`、6 个 cases、2 个评测脚本及 3 个 demo fixture 文件均已读完；消费者清单所列文件无未读项。目标目录没有顶层 `scripts/` 或 `templates/`，不构成漏读。
- 消费者测试进一步引用的其他 Skill、历史计划及历史评测结果未递归全部展开：它们不是本次消费者清单列出的文件。**未覆盖后果：** 本报告不裁决那些对象的正确性，也不复核历史通过或收益声明。

## 结论一句话

`spec-ideate` 的职责、授权、source/runtime 与交接静态边界总体清楚，但存在范围放行、closed-only 信号归因及 inline dossier 读取三处内部冲突，因此本轮静态合同审查不通过；该结论不代表已测得行为退化或运行成本问题。
