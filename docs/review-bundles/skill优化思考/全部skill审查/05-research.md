# 05-research 审查

## 角色定位

- 设计阶段的辅助调研 skill；核心价值是证据质量，而不是生成新的背景真源。

## 现状证据

- `skills/spec-first/05-research/SKILL.md:123`-`skills/spec-first/05-research/SKILL.md:146` 已有较完整的 Evidence Protocol。
- `skills/spec-first/05-research/SKILL.md:213`-`skills/spec-first/05-research/SKILL.md:241` 已落实 2-Action Rule 与 hooks 约束。
- 当前文档没有 `design-view`、`background_input_status` 或背景降级口径。

## 结论

- 证据纪律强，但背景契约弱。

## 主要优化点

- P1（推断性建议）：把 research 明确建模为 `04-design` 的辅助 consumer，优先复用 `design-view`，次级回退到 `spec.md / design.md / research.md`。
- P1（推断性建议）：在 research 摘要里显式带出 `background_input_status`，让“证据充分”与“背景完整”分开表达。
- P2：如后续发现 research 常被 blind 背景误导，再考虑单独设计轻量 `research-context`，当前不建议新增 stage-view。

