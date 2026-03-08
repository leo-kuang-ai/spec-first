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

- ~~P1：如果后续补上 consumer runtime 注入，status 面板可以进一步展示”当前阶段实际使用的是哪一层背景源”。~~ ✅ **无需修改** — status 是查询型 skill，通过主动读取运行时数据展示状态，不需要运行时注入

## 完成总结

status skill 的设计已完整：
- SKILL.md 和 status-dashboard-template.md 已包含 background_input_status 字段
- 测试覆盖充分（status-skill-docs.test.ts）
- 作为展示层，通过读取 first-runtime-index 和 stage-views 来展示背景质量
- 当前架构模式正确：查询型 skill 主动读取数据，而非被动接收注入
- 已能展示背景质量状态（index.summary.healthy 等字段）

