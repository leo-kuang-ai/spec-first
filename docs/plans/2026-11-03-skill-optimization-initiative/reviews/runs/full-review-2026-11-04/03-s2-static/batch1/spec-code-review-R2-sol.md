# spec-code-review 评审（R2）

## 逐项裁决表

| ID | 裁决 | 证据(file:line) | 一句话依据 |
|---|---|---|---|
| D01 | pass | `skills/spec-code-review/SKILL.md:68-76`；`skills/spec-code-review/references/select-and-route.md:34-42` | 将规则定位为风险判断与注意提醒，要求按实际变更选审查视角，并区分语义判断与路径信号；未见仅凭模型能力假设要求删改规则。 |
| D02 | pass | `skills/spec-code-review/SKILL.md:9-13`；`skills/spec-code-review/references/scope.md:214-235` | 明确 source-grounding、工具准备确定性事实、LLM 判断语义风险；影响候选需回源确认。 |
| D03 | pass | `skills/spec-code-review/SKILL.md:49-55`；`skills/spec-code-review/references/finish-review.md:17-30, 77-110, 150-162` | 机械 findings 检查、验证三态和 mutation snapshot 均有明确步骤；无命令证据时明确记为未产生。实际运行效果本轮未测。 |
| D04 | pass | `skills/spec-code-review/SKILL.md:17-21, 45-51`；`skills/spec-code-review/references/intent-and-plan.md:63-83` | 输入允许从 branch/PR/plan 等上下文建立意图和完整性范围；计划检查是补充性输入，不将缺计划误作阻断条件。 |
| D05 | pass | `skills/spec-code-review/SKILL.md:41-51`；`skills/spec-code-review/references/dispatch-reviewers.md:46, 71-77` | 入口采用执行脊柱按阶段加载；大 diff 可传路径，截断不能算读完，关键合同可定位。 |
| D06 | pass | `skills/spec-code-review/SKILL.md:13, 45-50`；`skills/spec-code-review/references/dispatch-reviewers.md:32-36, 60-67` | 能力假设有显式条件：可覆盖时才指定 mid-tier，否则继承并披露限制；属于 Skill 自身能力设计，未因本轮单模型静态审查降级。 |
| D07 | pass | `skills/spec-code-review/SKILL.md:9-11, 73-76`；`skills/spec-code-review/references/finish-review.md:72-75` | 经验材料仅作线索，要求证据支持；已解决方案由本地消费者检索，不把旧结论或共识直接当事实。 |
| D08 | pass | `skills/spec-code-review/SKILL.md:43-50`；`skills/spec-code-review/references/dispatch-reviewers.md:46, 77` | 按需读 reference、只加载所选 persona，并对大共享上下文采用路径传递和分段读取。 |
| B01 | pass | `skills/spec-code-review/SKILL.md:23-30, 45-50`；`skills/spec-code-review/references/modes-and-output.md:75-82, 93-105` | 正向触发、PR 反馈/已知故障负例、mode 快捷分支和 scope 限制明确；内部 persona 仅由审查编排器选择。 |
| B02 | pass | `skills/spec-code-review/SKILL.md:15-21, 41-51`；`skills/spec-code-review/references/scope.md:11-74, 237-251` | 输入来源、输出形态、task scope 归属和 inline 降级结果均有定义；调用方事实与 reviewer 自行判断有区分。 |
| B03 | pass | `skills/spec-code-review/SKILL.md:53-64`；`skills/spec-code-review/references/modes-and-output.md:75-82`；`skills/spec-code-review/references/dispatch-reviewers.md:50-58` | 默认只报告；apply、commit、worker dispatch 分别授权；工具可用性不等于授权，材料内容也不能授权副作用。 |
| B04 | pass | `skills/spec-code-review/SKILL.md:53-55`；`skills/spec-code-review/references/scope.md:118-152, 191-210` | 明确 source/runtime 边界和 remote scope 取证方式；本地 report-only scope 有冻结与复验机制，失败时不声称完整交付。 |
| B05 | pass | `skills/spec-code-review/references/scope.md:47-74, 208-212, 237-251`；`skills/spec-code-review/references/dispatch-reviewers.md:69, 128-140` | scope 漂移、缺证据、调度容量、部分失败和未知 mutation 均有显式失败或降级处理；脚本的真实运行与恢复效果本轮未执行。 |
| B06 | pass | `skills/spec-code-review/SKILL.md:49-55, 68-76`；`skills/spec-code-review/references/finish-review.md:28-30, 77-110, 164-213` | finding 需位置、影响和证据；验证未解决项不进可执行队列，最终报告要求披露 coverage 和限制。 |
| X01 | pass | `skills/spec-code-review/references/scope.md:11-74`；`skills/spec-code-review/references/dispatch-reviewers.md:69, 130-140` | 适用：复杂/长 review 可按 task 卡片限定范围、标记共享改动归属，并对 reviewer 调度做有界排队；没有另造通用编排器。 |
| X02 | pass | `skills/spec-code-review/references/intent-and-plan.md:5-32, 63-77`；`skills/spec-code-review/references/select-and-route.md:15, 32, 51` | 适用：API/架构变化可依据消费者证据选择 contract reviewer，plan 完整性与 task scope 可区分；未要求每种变更都新增 schema。 |
| X03 | pass | `skills/spec-code-review/references/select-and-route.md:13-24, 36-57`；`skills/spec-code-review/references/finish-review.md:94-110, 114-118` | 适用：风险变更触发相应 reviewer；敏感 finding 的验证要求具体反证，高风险修复验证与 mutation 授权分离。 |
| X04 | pass | `skills/spec-code-review/references/finish-review.md:5, 28-30`；`skills/spec-code-review/references/cross-model-review.md:5-24, 52-58` | 适用：handoff 要保留 source refs、freshness 与限制；跨模型路径在身份与授权证据不足时保持 dormant，不冒称独立覆盖。 |

## Findings

无符合入册条件的静态缺陷。未发现可定位且由当前源码证据支持的 fail 项；本轮未执行行为场景、测试或宿主加载验证，不将这些未执行事项当作静态缺陷。

## 主责深挖面发现

- **B01—入口职责：** 入口声明 code review 的触发范围，并把 PR 已有反馈与已知故障分别交给相应 workflow；普通审查不因用户提供 PR/branch 名而获得 checkout 权限。`mode:agent`、quick review 和普通主流程的分流条件可定位。证据：`skills/spec-code-review/SKILL.md:23-30, 45-50`，`skills/spec-code-review/references/modes-and-output.md:31-40, 93-105`。
- **B02—输入输出：** 输入可来自当前分支、显式 base、远端 PR/branch 和可选 plan/task-pack。输出含报告或 JSON、findings、coverage、限制及运行产物；Task Card 通过 digest、路径和变更事实约束归属。证据：`skills/spec-code-review/SKILL.md:15-21`，`skills/spec-code-review/references/scope.md:15-74`，`skills/spec-code-review/references/finish-review.md:221-280`。
- **B03—授权与信任：** 默认 report-only，agent mode 始终 report-only；apply、commit 和 reviewer dispatch 是不同授权面。remote reviewer 不读取本地 checkout 中对应变更文件；peer/provider 输出先视为不可信数据。证据：`skills/spec-code-review/references/modes-and-output.md:75-82`，`skills/spec-code-review/references/scope.md:118-152`，`skills/spec-code-review/references/cross-model-review.md:52-58`。
- **B04—source/runtime/宿主：** 入口使用 `references/`、`scripts/` 的 Skill 源码路径；reviewer 按远端 head 或已提供 diff 取证。source mutation guard 绑定冻结 scope，缺 snapshot 或复验失败时不作安全完成声明。证据：`skills/spec-code-review/SKILL.md:41-51, 53-55`，`skills/spec-code-review/references/scope.md:191-210`。
- **X01—复杂任务：** Task Card review 将完整计划审查留给后续完整 review；exact/cumulative/mixed/degraded 区分防止把共享 dirty 文件伪称为孤立任务改动。证据：`skills/spec-code-review/references/scope.md:63-74`。
- **X02—接口/架构变化：** reviewer 选择依赖外部消费者、接口形态和实际变更判断，而非内部 export 或关键词命中；plan completeness 对 requirements-only 与 implementation-ready 作区分。证据：`skills/spec-code-review/references/select-and-route.md:15, 32-38, 51`，`skills/spec-code-review/references/intent-and-plan.md:7-18, 26-32`。
- **X03—高风险交付：** 敏感 finding 只有经具体证据确认才能被判 rejected；P0/P1 必须进入独立验证波次，无法验证时保留 unresolved 并限制 verdict。证据：`skills/spec-code-review/references/finish-review.md:94-110`。
- **X04—协作/跨会话：** 收尾输入和上下文重建要求保留 invocation 约束、scope、freshness、limitations；跨模型 peer 因无认证宿主 producer 而明确 dormant，未把设计路径当作已完成能力。证据：`skills/spec-code-review/references/finish-review.md:5`，`skills/spec-code-review/references/cross-model-review.md:5-9, 17-24`。
- **消费者交叉核对：** 已读 `tests/unit/spec-code-review-contracts.test.js:95-165` 的入口、report-only、dispatch fallback 和 snapshot 合同断言；`tests/unit/spec-code-review-contracts.test.js:339-390` 的 task scope 与 artifact 路径断言。仅凭这些静态合同断言不能证明实际行为通过。

## 未读文件

下列文件未逐一读取。本轮仍能依据入口脊柱和关键合同作静态裁决，但未覆盖其局部实现/场景的细节；这不等于确认其运行行为。

- **同目录其他 references：** `references/personas/` 下除 `maintainability-reviewer.md`、`security-reviewer.md`、`testing-reviewer.md`、`reliability-reviewer.md`、`adversarial-reviewer.md`、`frontend-quality-reviewer.md`、`api-contract-reviewer.md` 外的 persona 文件；以及 `references/review-output-template.md`。未覆盖未读取 persona 的具体提示约束和输出模板示例。
- **同目录 scripts：** `scripts/findings-mechanics.py`、`scripts/peer-job-runner.py`、`scripts/cross-model-adversarial-review.sh`、`scripts/run-python.sh`。其中 `review-scope.py` 已读。未覆盖 peer runner 与 findings helper 的完整实现行为；本轮也未运行脚本。
- **同目录 evals：** `evals/eval.yaml`、`evals/examples.json`、各能力用例 JSON，以及 `evals/cases/*.yaml`。未覆盖评测用例的具体内容或执行结果。
- **消费者清单中的其余测试：** 未逐一读取 `tests/unit/agent-persona-template-drift.test.js`、`anti-rationalization-contracts.test.js`、`ce-outcome-judge-calibration.test.js`、`ce-post-3-20-calibration-contracts.test.js`、`ce-upstream-skill-sync-contracts.test.js`、`dispatch-authorization-matrix-contracts.test.js`、`host-neutral-skill-invocation-contracts.test.js`、`mutation-authority-contracts.test.js`、`peer-job-runner-parity.test.js`、`python-runtime-resolution-contracts.test.js`、`scenario-capability-matrix-contracts.test.js`、`skill-flow-p2-closure-contracts.test.js`、`spec-app-consistency-audit-host-boundaries.test.js`、`spec-code-review-mechanics.test.js`、`spec-code-review-peer-runner.test.js`、`spec-code-review-pr-head.test.js`、`spec-work-implementation-quality-contracts.test.js`、`spec-work-shipping-contracts.test.js`、`test-inventory-contracts.test.js`。未覆盖这些消费者对源码的完整断言，也未验证其通过状态。
- **合同基线与执行检查表以外的上游材料：** 未读 `core/08-skill-contract-protocol.md` 中 spec-code-review 以外的阶段条款；它们不直接规定本 Skill 的调用路径。本评审的协议对照仅使用其中 spec-code-review 部分（`209-252, 430-486`），以及检查流程第 4 节（`108-139`）。
- **全局指引：** `/Users/kuang/.codex/AGENTS.md` 因工作区访问限制未能读取。未覆盖其中可能适用于本评审的额外全局约定；项目 `CLAUDE.md` 与角色契约已按可访问路径读取。

## 结论一句话

在冻结基线 `5b59293b` 上，静态审查所覆盖的 spec-code-review 主流程及 B01—B04、X01—X04 均有可定位的职责、边界和失败降级承诺，未发现成立的静态 finding；未读文件与未运行行为/测试仍构成本轮覆盖限制。
