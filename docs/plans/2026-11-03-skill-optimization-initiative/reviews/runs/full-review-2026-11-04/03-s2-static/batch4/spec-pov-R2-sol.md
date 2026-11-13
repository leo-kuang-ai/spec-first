# spec-pov 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据（file:line） | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-pov/SKILL.md:21-35`；`skills/spec-pov/references/grounding.md:7-13` | dispatch 授权与能力分开记录，并按任务所需能力降级，不把特定模型能力写成前提。 |
| D02 | pass | `skills/spec-pov/references/method.md:7-21`；`skills/spec-pov/references/boundaries.md:7-31` | 规则聚焦于 POV 的证据地板、裁决与路由边界，不替代用户目标判断或强制固定流程路径。 |
| D03 | pass | `skills/spec-pov/references/method.md:19-28`；`skills/spec-pov/references/grounding.md:31-33` | 明确区分项目证据与外部证据，并规定证据不足时阻断强结论、回源验证 provider 主张。 |
| D04 | pass | `skills/spec-pov/SKILL.md:41-57`；`skills/spec-pov/references/followup.md:3-13` | intake、grounding、验证、裁决和 follow-up 的职责衔接清楚；handoff 不扩大原请求授权。 |
| D05 | pass | `skills/spec-pov/references/method.md:60-65`；`skills/spec-pov/references/agents/project-grounding-scout.md:32-34` | 面向用户的输出与 scout dossier 均有紧凑约束，同时要求保留可追溯引用。 |
| D06 | pass | `skills/spec-pov/SKILL.md:21-35`；`skills/spec-pov/references/grounding.md:7-13` | 多模型 dispatch 被视为受授权和能力门控的可选机制；能力未知时有明确串行降级，不因本轮没有多模型运行而形成静态缺陷。 |
| D07 | pass | `skills/spec-pov/references/agents/precedent-activity-scout.md:12-21`；`skills/spec-pov/references/cross-model-panel.md:17-23` | 通过先查本地 precedent、标注来源日期以及明确 panel 激活前置条件，为维护和重评提供可执行依据；不要求技能自行构建经验效用自动化。 |
| D08 | pass | `skills/spec-pov/references/intake.md:17-21`；`skills/spec-pov/references/agents/project-grounding-scout.md:25-34` | 用一次轻量 orientation、按任务分层的 grounding 和受限 dossier 控制上下文投入。 |
| B01 | pass | `skills/spec-pov/SKILL.md:3-9`；`skills/spec-pov/references/boundaries.md:7-20` | 入口说明覆盖外部采用、文档方向和方案集判断，并明确与相邻入口的边界。 |
| B02 | pass | `skills/spec-pov/references/intake.md:27-43`；`skills/spec-pov/references/method.md:36-54` | 输入意图、裁决对象、候选集合及输出字段均有说明；候选集合要求冻结并逐项处置。 |
| B03 | fail | `skills/spec-pov/SKILL.md:21-35`；`skills/spec-pov/references/agents/external-evidence-researcher.md:7-20`；对照 `skills/spec-pov/references/agents/pov-peer.md:12-22` | dispatch 字段能记录授权，但外部研究者提示未像 POV peer 一样明确限定外发查询只能使用公开 subject terms，可能把含私有标识或敏感上下文的题目带到外部搜索/抓取。 |
| B04 | pass | `skills/spec-pov/references/grounding.md:27-33`；`skills/spec-pov/scripts/cross-model-pov.sh:180-185` | grounding 要求面向当前 worktree/source 回源，脚本按自身路径解析资产；没有将 generated runtime mirror 当作 source 的指示。 |
| B05 | pass | `skills/spec-pov/references/grounding.md:3-5,15-23`；`skills/spec-pov/scripts/peer-job-runner.py:177-182,303-378,1821-1833` | 预启动失败、scratch 隔离及 serving receipt 失败关闭均有边界；runner 在创建 job 目录前拒绝当前未验证的 producer channel。 |
| B06 | pass | `skills/spec-pov/references/method.md:36-65`；`skills/spec-pov/references/cross-model-panel.md:37-49` | 裁决、证据、限制和参与披露有明确要求；测试断言只能支持结构合同存在，不能据此声称行为或收益已验证。 |
| X01 | pass | `skills/spec-pov/references/intake.md:37-59`；`skills/spec-pov/references/grounding.md:3-13,25-31` | 对复杂题目提供按 tier 加深的研究预算、候选冻结和有界降级，符合 POV 任务范围；不要求技能接管实现任务分解。 |
| X02 | pass | `skills/spec-pov/references/agents/external-evidence-researcher.md:13-20`；`skills/spec-pov/references/agents/project-grounding-scout.md:17-21` | 外部与项目 grounding 均覆盖成熟度、迁移、兼容性或本地约定等采用判断所需信息。 |
| X03 | pass | `skills/spec-pov/references/method.md:14-28,56`；`skills/spec-pov/references/intake.md:57-59` | 高可逆性风险可提高研究深度；结果不足时限制结论或建议只读实验，不越权执行高风险实现。 |
| X04 | pass | `skills/spec-pov/references/cross-model-panel.md:3-11,37-49`；`skills/spec-pov/references/followup.md:3-13` | peers 明确为非投票证据，参与情况须披露；后续 handoff 受原授权、范围和动作性质约束。 |

## Findings

1. **B03 — 外部研究 payload 缺少明确的敏感信息最小化约束**  
   **位置：** `skills/spec-pov/references/agents/external-evidence-researcher.md:7-20`；对照 `skills/spec-pov/references/agents/pov-peer.md:12-22`。  
   **后果：** 当研究题目、候选方案或用户提供的背景包含内部标识、未公开计划或其他敏感内容时，当前外部研究者提示没有明确要求只用公开 subject terms 搜索，也没有明确禁止把仓库片段、内部路径或敏感标识带入外部查询；在发生外部搜索/抓取的调用中，可能造成超出研究必要范围的信息外发。入口的 dispatch 授权记录不足以替代这个 payload 层面的最小化约束。  
   **最小修复建议：** 在 external researcher prompt 中加入与 POV peer 相当的边界：查询只使用公开 subject terms；禁止发送仓库片段、私有路径、凭证、secrets 及非公开标识；证据不足时标记 unavailable，而非扩大外发范围。

没有其他经文本证据确认、同时满足“位置、后果、最小修复建议”要求的 findings。当前跨模型 serving producer channel 明确处于 fail-closed/degraded 状态并给出复评条件；这本身不构成合同缺陷。

## 主责深挖面发现

- **B01：** 入口与 boundaries 对 POV 的用途、相邻入口和越界方向有具体区分；保持现状成立。
- **B02：** intake 和 method 已规定候选集合、分级与输出字段。intake 的 Tier 1 描述与 method 中 Tier 2/3 reversal trigger 并非要求每种输入都使用同一组字段；没有足够依据认定为合同冲突。
- **B03：** 上述外部研究者 payload 约束缺口成立。
- **B04：** grounding 明确回到当前 source/worktree；脚本按自身路径解析资产。所列消费者测试也检查了 source 侧合同与投射边界，但这些静态断言不等同于生成结果或运行行为验证。
- **X01：** 复杂采用判断有 Tier 预算与有界 fallback；没有理由要求其负责实现型任务编排。
- **X02：** scout 指引涵盖兼容性、迁移、本地惯例及外部成熟度等判断维度；保持现状成立。
- **X03：** 风险由 tier 与证据地板管理，实验建议不授权执行；保持现状成立。
- **X04：** panel 非投票、summons 判别、参与披露和 handoff 边界均有表述；保持现状成立。

## 未读文件

- `/Users/kuang/.codex/AGENTS.md`：尝试读取时权限请求被拒绝；未绕过或重试。其额外全局规则无法核对。
- `/private/tmp/spec-first-fr-wt/skills/spec-pov/evals/evals.json`：读取返回文件不存在；不能据此推断其他位置不存在 eval。
- `skills/spec-pov/` 的目录枚举未成功（`rg --files` 调用需要审批）；因此无法确认除已读入口、直接引用 references、已知脚本和 schema 之外，目录中是否还有未发现的文件。未将该覆盖限制单独判为 not-verified，因为它不是静态合同本身无法判断的理由；但本评审不能声称已证明目录文件全集已覆盖。
- 消费者清单所列五个测试文件均已读取；没有运行测试。未把“未运行”作为 fail 或 not-verified 依据。

## 结论一句话

**静态合同整体可采纳，但 B03 外部研究者的外发信息最小化边界应补齐；本结论仅针对已读取材料的 structure_contract，不代表运行行为、运行成本或现场收益已验证。**
