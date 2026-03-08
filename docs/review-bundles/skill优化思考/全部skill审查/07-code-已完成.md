# 07-code 审查

## 角色定位

- 主链 consumer；消费 `code-view`，在实现阶段执行 TDD、hard-gate 与风险控制。

## 现状证据

- `skills/spec-first/07-code/SKILL.md:601`-`skills/spec-first/07-code/SKILL.md:602` 已声明 `code-view` 与 `background_input_status`。
- `tests/unit/code-skill-docs.test.ts:10`-`tests/unit/code-skill-docs.test.ts:33` 已锁定测试命令探测策略和 `code-view` 口径。
- `src/core/skill-runtime/first-runtime-types.ts:78`-`src/core/skill-runtime/first-runtime-types.ts:86` 的 runtime schema 使用 `entryPoints / likelyChangeAreas / changeHazards / verificationHooks`。
- `skills/spec-first/07-code/references/code-standards.md:453`-`skills/spec-first/07-code/references/code-standards.md:455` 使用的是 `entry_points / likely_change_areas / change_hazards` 文档命名。

## 结论

- 实现阶段的流程约束很强，但 `code-view` 还处在“文档已声明、运行时未统一注入”的状态。
- 字段命名也存在“camelCase runtime / snake_case docs”双口径。

## 主要优化点

- ~~P0：把 `code-view` 自动注入给 code skill，而不是只靠文档提醒读取。~~ ✅ **已完成** (v0.5.125) — dispatcher 自动注入 code-view 摘要和背景状态
- ~~P1：为 `code-view` 建一层字段别名策略，收口 `entryPoints` ↔ `entry_points` 这类双写命名，避免未来 prompt/JSON 序列化时产生歧义。~~ ✅ **已完成** (v0.5.125) — 统一字段命名为 camelCase

