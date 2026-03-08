---
mode: deep
last_updated: 2026-03-08T12:00:44Z
generated_at: 2026-03-08T12:00:44Z
project: spec-first
platform_type: node-cli
---

# 代码结构概览

## 顶层边界

- `src/cli/` 是交互入口层。 (`README.md:1705` — `cli/                  # CLI (21 命令)` — [显式])
- `src/core/` 是业务核心层，至少包含 `process-engine/trace-engine/change-mgr/gate-engine/metrics-engine/ai-orchestrator/skill-runtime/tool-integration/template/migrations/rules`。 (`src` 目录扫描结果 — `src/core/...` — [显式])
- `src/shared/` 承担类型、文件系统和校验复用。 (`src/shared/types.ts:1` — `共享类型定义` — [显式])
- `skills/spec-first/` 是流程阶段技能目录。 (`skills/spec-first/README.md:17` — `00-first` — [显式])
- `.spec-first/` 保存项目配置、hooks、layer2 和 runtime 状态。 (`skills/spec-first/AGENTS.md:85` — `specs/` 工作区结构 + `.spec-first` 约定 — [显式])
- `packages/vscode-spec-first/` 是编辑器集成边界。 (`packages/vscode-spec-first/package.json:2` — `vscode-spec-first` — [显式])

## 入口链

- 进程入口在 `src/cli/index.ts`，负责注册全部顶层命令。 (`src/cli/index.ts:30` — `registerCommand('id'` — [显式])
- 命令执行统一流经 `dispatch()`。 (`src/cli/index.ts:52` — `await dispatch(process.argv.slice(2))` — [显式])
- 路由层使用注册表模式维护命令名到处理器的映射。 (`src/cli/router.ts:18` — `new Map<string, CommandEntry>()` — [显式])
- 命令组文件负责子命令解析，再下沉到 `src/core/`。 (`src/cli/commands/stage.ts:8` — `import { advance` — [显式])

## 核心模块

- `process-engine` 管理 Feature 初始化、读取、推进和依赖检查。 (`src/cli/commands/init.ts:11` — `import { init }` — [显式])
- `trace-engine` 管理矩阵解析、断链检查、V-Model 校验和导出。 (`src/core/trace-engine/matrix.ts:53` — `checkMatrix` — [显式])
- `change-mgr` 管理 RFC 和 Defect 的 CRUD 及状态流转。 (`src/core/change-mgr/rfc.ts:1` — `RFC 变更管理` — [显式])
- `gate-engine` 负责 Gate 评估与上线检查。 (`src/core/process-engine/advance.ts:15` — `evaluateGate` — [显式])
- `ai-orchestrator` 负责 Context Pack、catchup、stats 与自动循环。 (`src/cli/commands/ai.ts:5` — `buildContextPack` — [显式])
- `skill-runtime` 负责 `first` 等技能的 runtime 索引、视图与投影。 (`src/core/skill-runtime/first-runtime-types.ts:17` — `FirstRuntimeIndex` — [显式])
- `tool-integration` 负责 Git hooks、AI hooks 与 Session hooks。 (`src/core/tool-integration/session-hook.ts:85` — `registerSessionHooks` — [显式])

## 非代码资产

- `templates/` 下提供 matrix、gate、review、release、CI 等模板。 (`package.json:40` — `"templates"` — [显式])
- `scripts/stage-viewer/` 提供可视化服务与静态资源。 (`package.json:42` — `"scripts/stage-viewer"` — [显式])
- `skills/spec-first/README.md` 将 skill 按认知、工作流、编排与会话管理分类。 (`skills/spec-first/README.md:13` — `项目认知 Skills` — [显式])

## 结构判断

- 这是“代码层 + 规范层 + 宿主集成层”三层并存的仓库。 (`package.json:38` — `dist`；`package.json:39` — `skills`；`package.json:42` — `scripts/stage-viewer` — [推断])
- `setup` 只是兼容入口，真正的宿主刷新能力已经并入 `update`。 (`src/cli/commands/setup.ts:11` — `@deprecated` — [显式])
