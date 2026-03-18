# 项目认知投影视图总览

> 标准模式：deep
> 文档层级：docs/first 投影视图
> 真源依赖：.spec-first/runtime/first/index.json、.spec-first/runtime/first/summary.json、.spec-first/runtime/first/steering.json、.spec-first/runtime/first/conventions.json、.spec-first/runtime/first/critical-flows.json、.spec-first/runtime/first/entry-guide.json、.spec-first/runtime/first/api-contracts.json、.spec-first/runtime/first/structure-overview.json、.spec-first/runtime/first/domain-model.json、.spec-first/runtime/first/database-schema.json

`docs/first/` 是 `.spec-first/runtime/first/` 的人类可读投影视图层，不作为 runtime 真源；canonical projection docs 受 runtime 自动刷新保障。

## Runtime Canonical Truth
- `.spec-first/runtime/first/index.json`
- `.spec-first/runtime/first/summary.json`
- `.spec-first/runtime/first/steering.json`
- `.spec-first/runtime/first/conventions.json`
- `.spec-first/runtime/first/critical-flows.json`
- `.spec-first/runtime/first/entry-guide.json`
- `.spec-first/runtime/first/api-contracts.json`
- `.spec-first/runtime/first/structure-overview.json`
- `.spec-first/runtime/first/domain-model.json`
- `.spec-first/runtime/first/database-schema.json`

## Canonical Projection Docs
- `docs/first/README.md`
- `docs/first/summary.md`
- `docs/first/steering.md`
- `docs/first/conventions.md`
- `docs/first/critical-flows.md`
- `docs/first/entry-guide.md`
- `docs/first/api-docs.md`
- `docs/first/codebase-overview.md`
- `docs/first/domain-model.md`
- `docs/first/architecture.md`
- `docs/first/call-graph.md`
- `docs/first/development-guidelines.md`
- `docs/first/external-deps.md`
- `docs/first/database-er.md`（条件型）

## 使用建议
- 后续 skill 的正式输入优先读取 `.spec-first/runtime/first/`。
- 新同学先读 `summary.md`、`entry-guide.md`、`development-guidelines.md`。
- 涉及实现定位时优先使用 `codebase-overview.md`、`architecture.md`、`call-graph.md`。
- 涉及数据库理解时先检查 `database-er.md` 是否生成，再决定是否消费。

## Skill Consumption Contract
- 后续 skill 的正式输入优先读取 `.spec-first/runtime/first/`。
- 列出的 canonical projection docs 全部受 runtime 自动刷新保障。
- 不在 registry 内的 `docs/first/*` 文档不参与 canonical truth 与自动治理。
