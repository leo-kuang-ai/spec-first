# spec-doc-review 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-doc-review/SKILL.md:9-16`；`skills/spec-doc-review/references/synthesis-and-presentation.md:19-23` | 明确以文档审查为职责，要求按可支持的后果准入 finding，拒绝仅因偏好或缺少重述而报问题。 |
| D02 | pass | `skills/spec-doc-review/SKILL.md:13-26`；`skills/spec-doc-review/references/dispatch.md:9-19` | 区分文档与来源提供事实、LLM/persona 判断语义充分性，以及派发能力与权限事实。 |
| D03 | pass | `skills/spec-doc-review/SKILL.md:15-16`；`skills/spec-doc-review/references/synthesis-and-presentation.md:9-17` | 输入与覆盖缺失会阻断或标不完整，schema 校验与语义判断分层；不把静态约定冒充运行门。 |
| D04 | pass | `skills/spec-doc-review/SKILL.md:25-26`；`skills/spec-doc-review/references/task-pack-review-lens.md:1-?`（未读全文） | 入口列明上游/下游消费者，task-pack 专门说明派生工件与 source-plan 的权威边界；完整衔接细节未覆盖。 |
| D05 | pass | `skills/spec-doc-review/SKILL.md:28-54`；`skills/spec-doc-review/references/persona-selection.md:18-39` | 主入口按需加载分支材料，并给 reviewer roster 设预算；没有把长度或成本观测直接当质量结论。 |
| D06 | pass | `skills/spec-doc-review/references/dispatch.md:17-19,48-52`；`skills/spec-doc-review/references/persona-selection.md:31-39` | 按能力与宿主可知性选择模型层级，未知时不猜模型名；成本和隔离状态作为 advisory 暴露。 |
| D07 | pass | `skills/spec-doc-review/references/document-intake.md:75-79`；`skills/spec-doc-review/references/synthesis-and-presentation.md:25-43` | 可复用审查受来源身份、范围、证据和约束匹配限制；会话内决策与跨会话边界有说明。 |
| D08 | pass | `skills/spec-doc-review/references/dispatch.md:19-23`；`skills/spec-doc-review/references/persona-selection.md:31-39` | 对 unified/task-pack 按片段传递，禁止为了“安全”重复注入整篇文档，并记录切片形态。 |
| B01 | pass | `skills/spec-doc-review/SKILL.md:7-16,28-54`；`skills/spec-doc-review/references/document-intake.md:5-15` | 入口定位为文档审查，明确缺文档时停止、按内容而非路径分类；执行路径边界清楚。 |
| B02 | pass | `skills/spec-doc-review/SKILL.md:11-26,28-54`；`skills/spec-doc-review/references/document-intake.md:17-57` | 输入、输出、格式分类、任务包与来源计划分工可定位；从文档提取的 provenance 不被提升为授权或 owner 决策。 |
| B03 | pass | `skills/spec-doc-review/SKILL.md:15-25`；`skills/spec-doc-review/references/modes.md:21-25`；`skills/spec-doc-review/references/dispatch.md:7-13` | 默认只读，显式 apply token 才能允许受限 Markdown 写；直接调用不授权派发，权限配置也不等于派发授权。 |
| B04 | pass | `skills/spec-doc-review/SKILL.md:24-26`；`skills/spec-doc-review/references/dispatch.md:23` | 写权限与 producer ownership 分离，peer 结果不取得修改权；本次未见 Skill 定义 runtime mirror 为修复真相源。 |
| B05 | pass | `skills/spec-doc-review/references/dispatch.md:3,11-13,45-50`；`skills/spec-doc-review/references/document-intake.md:15,75-79` | 对 launch 失败、容量背压、超时、缺证据和复用条件给出停止、排队或降级语义。 |
| B06 | pass | `skills/spec-doc-review/references/synthesis-and-presentation.md:9-23,109-120,198` | finding 校验、后果准入、覆盖限制和 report-only 边界均有说明；未将审核完成等同于对象通过或执行就绪。 |
| X01 | pass | `skills/spec-doc-review/references/dispatch.md:11-13,48-50`；`skills/spec-doc-review/references/document-intake.md:20-30` | 对多 reviewer 派发采用有界并发/排队，并针对 task-pack 先完成来源计划 intake；该扩展场景具备明确约束。 |
| X02 | pass | `skills/spec-doc-review/references/document-intake.md:26,48-57`；`skills/spec-doc-review/references/synthesis-and-presentation.md:198,233-246` | unified artifact readiness 与格式冲突有分类规则，输出需保留来源和限制；不声称所有文档都要新增 schema。 |
| X03 | pass | `skills/spec-doc-review/SKILL.md:15,24-25`；`skills/spec-doc-review/references/modes.md:21-25` | 仅在明确授权时应用有限文档修复，commit/landing 不在授权内；HTML、歧义格式与默认模式保持只读。 |
| X04 | pass | `skills/spec-doc-review/references/dispatch.md:13,25-43`；`skills/spec-doc-review/references/document-intake.md:75-79` | reviewer 输入自包含，隔离降级需披露；决策记录可在同一会话累积，跨会话复用不默认成立。 |

## Findings

无已确认 finding。上表中 D04、B04 等结论限于已读源码文本；相关未读文件及其影响见下节，不将这些缺口误记为 Skill 缺陷。

## 主责深挖面发现

未发现经已读源码证实的 B01–B04 或 X01–X04 缺陷。

- **B01 入口职责：** `SKILL.md:7-16` 将目标限定为文档审查与 task-pack 派生输入审查；`document-intake.md:5-15` 处理显式路径、交互发现、不可读文件和 headless 缺路径，未见把文档审查扩展成实现职责。
- **B02 输入输出：** `SKILL.md:11-26` 声明输入类型、输出、硬出口、authority 与消费者；`document-intake.md:17-57` 以内容形状分类，且明确 task-pack 的派生属性与 source-plan 权威不混同。persona 模板、schema 和 task-pack lens 未完整阅读，因此该项仍有边界性覆盖限制。
- **B03 授权与信任：** `modes.md:21-25` 将 delivery、mutation、output 分离；`dispatch.md:7-13` 要求 dispatch 独立授权，环境权限不替代授权，缺少授权走 inline/serial 并披露非独立性。已读文本支持只读默认和授权不扩张的静态合同。
- **B04 source/runtime 与宿主：** `SKILL.md:24-26` 明确 producer ownership 与 review authority 的区别；`dispatch.md:23` 将 peer 结果限制为 corroboration，不能带来 `safe_auto` 或 mutation authority。未读 generator/host projection 相关消费者，故未据此推断 runtime 投射完整性。
- **X01–X04：** 已读派发与 intake 规则对有界并发、未知能力降级、格式/ready 状态判别及来源证据有明确约束；本轮未运行行为场景，不据此作 S3 行为质量结论。

## 未读文件

按入口条件读取了 `modes.md`、`document-intake.md`、`persona-selection.md`、`dispatch.md` 和 `synthesis-and-presentation.md`；未读取下列资产，因此对应语义细节、实现一致性或场景覆盖未纳入裁决。下列 `SKILL.md` 条件性加载要求决定哪些文件仅在特定模式、分类或 finding 条件下使用；未读不等于该场景失败。

- **`skills/spec-doc-review/references/`：** `task-pack-review-lens.md`（只查看消费者测试摘录，未读全文；task-pack 端到端语义与终端 owner 路由未完全覆盖）；`subagent-template.md`、`findings-schema.json`、`rendering-floor.md`（persona 输入约束、结构化合同与呈现下限未完整覆盖）；`walkthrough.md`、`bulk-preview.md`、`open-questions-defer.md`、`review-output-template.md`（交互写入、批量动作及 Open Questions 具体路径未覆盖）；`cross-model-review.md`、`cross-model-eval.md`、`personas/whole-doc-reviewer.md`（外部 peer 证据门及 runner 生命周期未覆盖）；`synthesis-multi-round.md`、`synthesis-premise-collapse.md`、`synthesis-contradictions.md`、`synthesis-chain-linking.md`、`synthesis-restatement-suppression.md`（对应条件触发时的合成规则未覆盖）；`persona-activation-matrix.md`、`document-classification-signals.md`（快速规则无法判定时的扩展条件未覆盖）；`subagent-confidence-rubric-detail.md`、`subagent-why-it-matters-guide.md`、`subagent-suggested-fix-advanced.md`（可选/条件性 persona 细节未覆盖）；`personas/coherence-reviewer.md`、`feasibility-reviewer.md`、`design-lens-reviewer.md`、`security-lens-reviewer.md`、`scope-guardian-reviewer.md`、`product-lens-reviewer.md`、`adversarial-document-reviewer.md`（各 persona 的完整审查内容未覆盖）。
- **脚本：** `skills/spec-doc-review/scripts/cross-model-doc-review.sh`、`skills/spec-doc-review/scripts/peer-job-runner.py`（peer adapter/runner 的确定性行为与清理语义未覆盖；未声称脚本合同已通过）。
- **evals：** `skills/spec-doc-review/evals/eval.yaml`、`report-only-cases.json`、`task-pack-review-cases.json`、`evals/cases/*`、`evals/fixtures/**`（用例合同、fixture 与覆盖边界未完整阅读；未运行 eval，不据此推断行为质量）。
- **消费者文件：** `tests/unit/ce-upstream-skill-sync-contracts.test.js`、`command-resource-path-rewrite.test.js`、`dispatch-authorization-matrix-contracts.test.js`、`mutation-authority-contracts.test.js`、`peer-job-runner-parity.test.js`、`review-peer-expansion-contracts.test.js` 均已读；未读消费者清单中未列出的其他测试或源码，因为本次按清单限定消费者范围。以上消费者测试只作为静态合同定位证据，本轮未执行测试。
- **合同基线补充：** 已阅读 `08-skill-contract-protocol.md` 全文，但其内容是主链路 PRD/Plan/Work/Review 的旧式拟议协议；本轮依据执行 workflow 的适用边界，不把其中固定字段数量和自动门要求强加给独立文档评审 Skill。

## 结论一句话

在已读静态合同范围内，spec-doc-review 的入口职责、只读默认、派发授权和降级约束可定位且内部一致；未读条件性资产与未执行行为评测限制了本结论，不代表全量行为或运行成本已验证。
