# 14-status 审查

## 角色定位

- 背景治理的展示层；负责把当前状态与背景质量可视化。

## 现状证据

- `skills/spec-first/14-status/SKILL.md:371`-`skills/spec-first/14-status/SKILL.md:372` 已要求展示 `background_input_status` 并区分 `runtime 真源` / `docs 投影视图`。
- `skills/spec-first/14-status/references/status-dashboard-template.md:321`-`skills/spec-first/14-status/references/status-dashboard-template.md:324` 已把背景字段写入模板。
- `tests/unit/status-skill-docs.test.ts:11`-`tests/unit/status-skill-docs.test.ts:30` 已锁定模板口径。

## 结论

- 展示层的设计是对的，至少在 skill 模板侧已经和最佳设计对齐。

## 主要优化点

- P1：如果后续补上 consumer runtime 注入，status 面板可以进一步展示“当前阶段实际使用的是哪一层背景源”。

