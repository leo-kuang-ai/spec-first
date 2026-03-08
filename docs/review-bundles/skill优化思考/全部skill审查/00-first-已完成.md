# 00-first 审查

## 角色定位

- Producer / runtime 真源生产者。

## 现状证据

- `skills/spec-first/00-first/SKILL.md:19` 明确把 `.spec-first/runtime/first/index.json` 定义为真索引，把 `docs/first/` 定义为投影视图。
- `src/core/skill-runtime/first-stage-views.ts:3` 真实生成 `spec/design/code/verify` 四类 stage view。
- `src/core/skill-runtime/first-context.ts:62`、`src/core/skill-runtime/first-context.ts:81` 已提供真源健康守卫与 `loadStageView()`。
- `src/core/skill-runtime/first-context.ts:18`、`src/core/skill-runtime/first-context.ts:98` 已支持 `refresh-runtime-only` / `refresh-docs-from-runtime` / `refresh-all`。

## 结论

- 与最佳设计高度对齐，是当前全链路背景机制的真实底座。
- 当前问题不是“没有实现”，而是“下游消费契约还没完全收口”。

## 主要优化点

- ~~P0：修正文档与测试的标题级漂移~~ ✅ **已验证不存在** — 测试期望与文档完全对齐
- ~~P0：与 `12-verify` 一起统一 verify-view 契约~~ ✅ **已修复** (v0.5.118) — 统一使用 camelCase 字段命名

