---
mode: deep
last_updated: 2026-03-08T12:00:44Z
generated_at: 2026-03-08T12:00:44Z
project: spec-first
platform_type: node-cli
---

# First 文档索引

`docs/first/` 是 `spec-first:first` 的**文档投影视图层**；runtime 真源位于 `.spec-first/runtime/first/`，文档用于长期维护的人类可读投影。 (`docs/first/README.md:1` — `mode: deep` — [显式])

## 产物清单

- `tech-stack.md`：技术栈、构建、测试与分发形态。 (`package.json:9` — `scripts` — [显式])
- `api-docs.md`：CLI 作为主接口面的调用规范。 (`src/cli/index.ts:30` — `registerCommand('id'` — [显式])
- `codebase-overview.md`：目录层次、模块边界与开发入口。 (`README.md:1703` — `spec-first/` — [显式])
- `domain-model.md`：Feature / Stage / Matrix / RFC / Defect 等核心对象。 (`src/shared/types.ts:61` — `export interface StageState` — [显式])
- `call-graph.md`：CLI 到核心引擎的主要调用链。 (`src/cli/index.ts:52` — `await dispatch` — [显式])
- `architecture.md`：CLI 壳、core engine、规范资产、宿主集成的架构视图。 (`src/core/skill-runtime/first-runtime-types.ts:17` — `FirstRuntimeIndex` — [显式])
- `external-deps.md`：NPM 依赖、MCP、宿主与编辑器集成。 (`src/config/bootstrap-manifest.ts:53` — `REQUIRED_MCP_SERVERS` — [显式])
- `local-setup.md`：本地安装、更新、诊断与可视化启动。 (`README.md:848` — `npm install -g spec-first` — [显式])
- `development-guidelines.md`：lint/test/build 与变更协作约束。 (`eslint.config.js:21` — `rules` — [显式])

## 结论

- 项目主类型是 Node.js TypeScript CLI，而非 HTTP 服务。 (`package.json:6` — `"spec-first": "./dist/cli/index.js"` — [显式])
- 仓库含附属 VS Code 扩展，但未形成标准 workspace monorepo。 (`packages/vscode-spec-first/package.json:2` — `"name": "vscode-spec-first"` — [显式])
- 当前未识别实际数据库 schema 或 ORM 主线，因此本轮 deep 产物不生成 `database-er.md`。 (`package.json:67` — `dependencies` 中无 ORM — [推断])

## 证据抽检

- 阶段模型来自共享类型与状态机双重定义，且相互一致。 (`src/shared/types.ts:7` — `export enum Stage` — [显式])
- CLI 入口通过注册表驱动，和 `api-docs.md` 的命令面描述一致。 (`src/cli/router.ts:18` — `new Map<string, CommandEntry>()` — [显式])
- first runtime 明确区分 `summary / roleViews / stageViews / docsProjection`，和本目录“投影视图层”定位一致。 (`src/core/skill-runtime/first-runtime-types.ts:17` — `FirstRuntimeIndex` — [显式])
