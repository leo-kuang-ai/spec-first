# 11-plan 审查

## 角色定位

- 编排前的计划生成 skill；负责把执行路径、风险和下一步动作写清楚。

## 现状证据

- `skills/spec-first/11-plan/SKILL.md:100`-`skills/spec-first/11-plan/SKILL.md:114` 已清楚界定 plan 与 orchestrate 的职责边界。
- `skills/spec-first/11-plan/SKILL.md:181`-`skills/spec-first/11-plan/SKILL.md:235` 已有风险评估与 findings 字段。
- 但文档没有 `background_input_status`、`dependency_strength` 或 `risk_category` 字段。

## 结论

- “计划是什么”已经清楚；“计划基于什么背景质量生成”还不清楚。

## 主要优化点

- P1：把 `background_input_status` 和目标阶段的 `dependency_strength` 写进 plan/findings schema。
- P1：复用 orchestrate 已有的背景治理口径，而不是在 plan 里再定义第二套风险语言。

