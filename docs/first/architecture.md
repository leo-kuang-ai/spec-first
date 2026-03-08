---
mode: deep
last_updated: 2026-03-08T12:00:44Z
generated_at: 2026-03-08T12:00:44Z
project: spec-first
platform_type: node-cli
---

# 架构图

## 分层结论

- 系统最外层是 CLI 交互壳。 (`src/cli/index.ts:7` — `import { dispatch, registerCommand }` — [显式])
- 中间层是按职责拆分的 core engines。 (`README.md:1708` — `核心模块 (11 目录)` — [显式])
- 底层状态主要持久化到工作区文件与宿主配置，而非数据库。 (`src/core/process-engine/feature.ts:29` — `stage-state.json` — [显式])
- 旁路能力包括 Stage Viewer、VS Code 扩展、Claude/Codex MCP 与 Skills。 (`src/config/bootstrap-manifest.ts:53` — `REQUIRED_MCP_SERVERS` — [显式])

```text
┌──────────────────────────────────────────────────────────────┐
│ CLI Layer                                                   │
│  src/cli/index.ts -> src/cli/router.ts -> src/cli/commands  │
└──────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ Core Engines                                                │
│  process-engine / trace-engine / change-mgr / gate-engine   │
│  metrics-engine / ai-orchestrator / skill-runtime           │
│  tool-integration / template / migrations / rules           │
└──────────────────────────────────────────────────────────────┘
         │                         │                        │
         ▼                         ▼                        ▼
┌──────────────────┐   ┌────────────────────┐   ┌─────────────────────┐
│ Project Files    │   │ Host Integration   │   │ Sidecar Consumers   │
│ specs/ .spec-first│  │ Claude/Codex/MCP   │   │ stage-viewer / VSCode│
└──────────────────┘   └────────────────────┘   └─────────────────────┘
```

## 模块边界

- `process-engine` 负责生命周期与规则推进。 (`src/core/process-engine/stage-machine.ts:7` — `TRANSITIONS` — [显式])
- `trace-engine` 负责链路完整性与导出。 (`src/core/trace-engine/matrix.ts:97` — `exportMatrix` — [显式])
- `change-mgr` 负责 RFC / Defect 的持久化与状态机。 (`src/core/change-mgr/defect.ts:53` — `registerDefect` — [显式])
- `ai-orchestrator` 负责 AI 协作上下文、catchup 与统计。 (`src/cli/commands/ai.ts:5` — `buildContextPack` — [显式])
- `skill-runtime` 负责 `first` 认知视图等元认知数据。 (`src/core/skill-runtime/first-runtime-types.ts:29` — `FirstRuntimeSummary` — [显式])
- `tool-integration` 负责宿主路径、自举、hooks 与 session 注入。 (`src/shared/host-bootstrap.ts:63` — `ensureHostBootstrap` — [显式])

## 状态与存储

- Feature 真源状态存于 `specs/<featureId>/stage-state.json`。 (`src/core/process-engine/feature.ts:29` — `stage-state.json` — [显式])
- 当前活跃 Feature 存于 `.spec-first/current`。 (`src/core/process-engine/feature.ts:10` — `CURRENT_FILE = '.spec-first/current'` — [显式])
- first 认知能力的真源是 `.spec-first/runtime/first/*`。 (`src/core/skill-runtime/first-runtime-types.ts:17` — `FirstRuntimeIndex` — [显式])
- 宿主状态一部分落入 `~/.claude/settings.json` 等外部配置文件。 (`src/cli/commands/doctor.ts:176` — `~/.claude/settings.json` — [显式])

## 风险与约束

- CLI 契约分散在注册表、帮助文本和 README，多点维护有漂移风险。 (`src/cli/router.ts:77` — `printHelp()` — [推断])
- 系统对文件路径、宿主目录和 hook 配置较敏感。 (`src/shared/host-paths.ts:5` — `detectHostPaths` — [显式])
- `skills/spec-first/AGENTS.md` 中仍提到 `Commander.js`，但当前代码实际使用自定义 router，这是一处文档债务。 (`skills/spec-first/AGENTS.md:77` — `CLI 框架：Commander.js` — [显式])
