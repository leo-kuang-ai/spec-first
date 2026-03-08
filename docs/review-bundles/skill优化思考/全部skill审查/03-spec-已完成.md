# 03-spec 审查

## 角色定位

- 主链 consumer；消费 `spec-view`，为需求规格阶段提供“刚好够用”的背景。

## 现状证据

- `skills/spec-first/03-spec/SKILL.md:675`-`skills/spec-first/03-spec/SKILL.md:678` 已明确 `spec-view`、`background_input_status`、`degraded`。
- `tests/unit/spec-skill-docs.test.ts:13`-`tests/unit/spec-skill-docs.test.ts:39` 已锁定这套文档契约。

## 结论

- 文档契约已对齐最佳设计。
- 但 consumer 真正拿到 `spec-view` 仍缺运行时装配。

## 主要优化点

- ~~P0：在 `loadSkill()` 增加面向 `spec` 的 stage-view notice~~ ✅ **已完成** (v0.5.122) — dispatcher 自动注入 spec-view 摘要
- ~~P1：degraded 模式列出缺失源~~ ✅ **已完成** (v0.5.122) — 自动列出缺失资产并提供修复建议

