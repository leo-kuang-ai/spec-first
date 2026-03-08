---
mode: deep
last_updated: 2026-03-08T12:00:44Z
generated_at: 2026-03-08T12:00:44Z
project: spec-first
platform_type: node-cli
---

# 研发规范

## 代码与构建规范

- 项目默认使用 TypeScript ESM，不应再引入 CommonJS 风格新入口。 (`package.json:5` — `"type": "module"` — [显式])
- 发布物由 `tsup` 统一构建到 `dist/`。 (`tsup.config.ts:7` — `outDir: 'dist'` — [显式])
- 根级 lint 只覆盖 `src/`，因此对 `skills/`、`templates/`、`scripts/**/*.js` 默认不做同等 lint 约束。 (`eslint.config.js:8` — `ignores` — [显式])

## 静态检查规范

- 未使用参数默认要求显式以前缀 `_` 规避告警。 (`eslint.config.js:22` — `argsIgnorePattern: '^_'` — [显式])
- `any` 不是禁止而是警告，说明项目在工具集成边界允许受控放宽。 (`eslint.config.js:23` — `no-explicit-any: 'warn'` — [显式])
- `no-console` 被关闭，CLI 和脚本输出被视为正常实践。 (`eslint.config.js:25` — `no-console: 'off'` — [显式])

## 测试规范

- 测试框架统一使用 Vitest。 (`vitest.config.ts:1` — `defineConfig` — [显式])
- 测试目录按 `unit/integration/e2e/benchmark` 分层。 (`tests` 目录扫描结果 — `tests/unit` 等 — [显式])
- 覆盖率有硬阈值，说明仓库把验证作为门槛而非可选项。 (`vitest.config.ts:11` — `thresholds` — [显式])

## 规范资产协同

- skills 目录按阶段和能力分类维护，代码改动经常需要和技能文档联动。 (`skills/spec-first/README.md:21` — `核心工作流 Skills` — [显式])
- `first` 已明确把 runtime 与 docs 分层，新增认知产物时应优先维护 `.spec-first/runtime/first/` 真源。 (`src/core/skill-runtime/first-runtime-types.ts:17` — `docsProjection` — [显式])
- Session hook 会向会话注入“技能路由表”“1%规则”“catchup 提示”和 `viewer` 启动，因此相关改动要注意文案与行为一致。 (`src/core/tool-integration/session-hook.ts:49` — `Session Hook 决策树` — [显式])

## 变更协作规范

- `update` 已成为宿主与模板升级的统一入口，新增安装逻辑不应继续堆到 `setup`。 (`src/cli/commands/setup.ts:13` — `请使用 spec-first update` — [显式])
- 文档与实现之间存在显式一致性要求；例如 `AGENTS.md` 中的 CLI 框架描述已经与代码不一致，需要后续治理。 (`skills/spec-first/AGENTS.md:78` — `Commander.js` — [显式])
- 由于大量逻辑依赖文件路径和宿主状态，改动时应优先补 focused test，而不是仅凭静态阅读收尾。 (`src/shared/host-bootstrap.ts:40` — `atomicWriteJson` — [推断])
