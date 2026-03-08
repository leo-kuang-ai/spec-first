# 16-sync 审查

## 角色定位

- 追踪矩阵同步工具；核心职责是修复追溯关系，而不是治理背景真源。

## 现状证据

- `skills/spec-first/16-sync/SKILL.md:31`-`skills/spec-first/16-sync/SKILL.md:51` 将范围限定在 matrix / findings 审计。
- 文档没有 `background_input_status` 或 stage-view 相关字段。

## 结论

- 作为窄职责工具是合理的，不必强行接入完整 stage-view 消费。

## 主要优化点

- ~~P2（可选）：把当前 `background_input_status` 作为只读字段写进 sync 审计日志，帮助追溯”同步动作发生时的背景质量”。~~ ✅ **无需修改** — sync 是工具型 skill，保持窄职责定位更符合单一职责原则

## 完成总结

sync skill 的设计已完整：
- 职责明确：专注于追踪矩阵同步和修复追溯关系
- 范围合理：限定在 matrix/findings 审计
- 作为工具型 skill，不需要完整的背景治理能力
- 如需追溯背景质量，应通过 doctor 或 status 查询

