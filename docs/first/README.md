# 项目认知投影视图

> `docs/first/` 是 `.spec-first/runtime/first/` 的人类可读投影视图层，不作为 runtime 真源。

## 项目概览
- project: spec-first
- mode: deep
- generatedAt: 2026-03-09T04:52:18.445Z

## 文档投影视图
- docs/first/summary.md
- docs/first/role-views.md
- docs/first/stage-views.md

## Skill 初始化文档
- docs/first/tech-stack.md
- docs/first/api-docs.md
- docs/first/codebase-overview.md
- docs/first/domain-model.md
- docs/first/call-graph.md
- docs/first/architecture.md
- docs/first/external-deps.md
- docs/first/local-setup.md
- docs/first/development-guidelines.md

## Runtime 真源
- .spec-first/runtime/first/index.json
- .spec-first/runtime/first/summary.json
- .spec-first/runtime/first/role-views.json
- .spec-first/runtime/first/stage-views.json

## 使用约定
- 读取机器真相时优先使用 `.spec-first/runtime/first/`。
- 阅读面向人的摘要时使用 `docs/first/` 投影视图。
- 当 runtime 真源变化时，应重新刷新 docs 投影视图。
