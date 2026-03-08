# 20-spec-review 审查

## 角色定位

- 规格质量门；负责对 `spec.md` 做“英语单元测试”式审查并输出 C10。

## 现状证据

- `skills/spec-first/20-spec-review/SKILL.md:11`-`skills/spec-first/20-spec-review/SKILL.md:12` 已明确其目标是质量审查而非重写 spec。
- `skills/spec-first/20-spec-review/SKILL.md:30`-`skills/spec-first/20-spec-review/SKILL.md:36` 已定义产物与 C10 输出。
- 当前文档没有 `spec-view` 或 `background_input_status` 口径。

## 结论

- 质量门机制存在，但它与新的背景输入体系还没有接通。

## 主要优化点

- P1（推断性建议）：spec-review 应至少回显 `background_input_status`，避免在 degraded/blind 背景下给出看似确定的审查结论。
- P1（推断性建议）：可复用 `spec-view` 作为 review 前的固定上下文摘要，减少 reviewer 对整份 `00-first` 的依赖。

