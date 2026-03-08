# 04-design 审查

## 角色定位

- 主链 consumer；消费 `design-view`，并承接正式设计评审的高依赖门槛。

## 现状证据

- `skills/spec-first/04-design/SKILL.md:210`-`skills/spec-first/04-design/SKILL.md:213` 已明确 `design-view`、`backgroundInputStatus`、`full`、`L3`。
- `src/core/skill-runtime/dispatcher.ts:127`-`src/core/skill-runtime/dispatcher.ts:170` 真实定义了 design 阶段的 `L2 → L3` 升级与 `formal-design-review` 风险分类。
- `tests/unit/design-skill-docs.test.ts:13`-`tests/unit/design-skill-docs.test.ts:38` 已锁定文档口径。

## 结论

- 设计阶段的风险语义是对的。
- 缺口仍然是”治理逻辑已落代码，consumer prompt 还没自动拿到 design-view + risk_category”。

## 主要优化点

- ~~P0：把 `design-view` 与 `risk_category=formal-design-review` 一并注入给 design skill，而不是只让文档要求读取。~~ ✅ **已完成** (v0.5.123) — dispatcher 自动注入 design-view 摘要、背景状态和 risk_category
- ~~P1：正式设计评审时，把 `backgroundInputStatus` 直接写进输出模板，避免评审会议里二次解释上下文来源。~~ ✅ **已完成** (v0.5.123) — 统一字段命名为 camelCase，输出模板使用 backgroundInputStatus

