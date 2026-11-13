# S5.2/F13 历史计划补完候选

类型：advisory。本批 owner：当前 Codex；基线 HEAD：`b557f8bc6f884f0fef460108e6279b31227c50fb`，包含本地未提交候选。

## 触发与修复

直接缺陷是 `spec-work` 拒绝非活跃计划后，`spec-plan` 只有保留原状态的 enrichment/deepen 路径，缺少承接用户补完目标的 producer 分支。任务包还会在 CLI validate 阶段先失败，不能仅在后续 drift 检查补接续。

现在当前用户明确要求补完时，由 plan owner 核验源码、验收、授权与替代关系，复用明确关联且有效的 active 后继；不存在可复用后继且确认仍有剩余工作时，创建仅覆盖剩余范围的新计划。旧计划原文、状态和旧 pins 不变，新输入仍走正常 readiness、审查与完整 intake。仅只读审阅不生产新计划，来源缺失或范围冲突阻断依赖动作，无剩余范围不生成空计划。

source owner 与实际修改路径：

- `skills/spec-plan/SKILL.md`、`references/plan-sections.md`：后继计划生产。
- `skills/spec-work/SKILL.md`、`references/work-intake-and-task-pack.md`：直接输入及校验失败的 owner 交接。
- `skills/spec-write-tasks/SKILL.md`：任务生产的同一交接边界。
- `skills/spec-plan/evals/examples.json`、`tests/unit/spec-plan-contracts.test.js`、`tests/unit/spec-work-contracts.test.js`：正反场景与合同检查。

不新增 schema、CLI 状态机或平台命令；generated runtime 未刷新，所有宿主共享 source 规则，但不因此声称各宿主已实测。

## 验证与限制

最终聚焦回归共 9 suites / 90 tests 通过（exit 0），覆盖 plan/work/handoff、plan quality、eval fixtures、task-pack review、真实 task-pack CLI、活链与 CHANGELOG 格式。实际 CLI 对非活跃计划仍返回失败；新增 prose 负责向 producer 接续。维护场景定义和字符串断言不能替代模型端到端执行。命令与源码哈希见 [验证记录](s5-historical-plan-verification.json)。

fresh-source 审查发现任务包在 validate 阶段提前拒绝的接续缺口，已在 Fallback 和第 1 节补上 producer 分支，并将回归断言限定到该入口区间。最终复核结果另随差量审查收据保存。

本项处置为 `continue experiment`：本地规则候选已实现；Astra 身份、真实后继计划生产与执行旅程、跨 session 和 Claude/Codex 全入口验收仍未完成。执行 owner 需在可核验模型身份与既有预算范围内补测；来源、生命周期规则或宿主能力变化时重估。未执行消融或真实后续知识消费者试验，不声明收益。
