---
mode: deep
last_updated: 2026-03-08T12:00:44Z
generated_at: 2026-03-08T12:00:44Z
project: spec-first
platform_type: node-cli
---

# 调用链分析

## 链路 1：CLI 启动与命令分发

- 进程从 `src/cli/index.ts` 启动。 (`src/cli/index.ts:1` — `#!/usr/bin/env node` — [显式])
- 顶层命令先被注册到路由器。 (`src/cli/index.ts:30` — `registerCommand('id'` — [显式])
- 参数数组随后交给 `dispatch()`。 (`src/cli/index.ts:52` — `await dispatch(process.argv.slice(2))` — [显式])
- `dispatch()` 统一处理 help/version/unknown command，并调用对应 handler。 (`src/cli/router.ts:35` — `export async function dispatch` — [显式])

```text
process.argv
  -> src/cli/index.ts
  -> registerCommand(...)
  -> dispatch(args)
  -> entry.handler(rest)
```

## 链路 2：阶段推进

- `stage` 命令组把 `advance` 子命令转给 `handleAdvance()`。 (`src/cli/commands/stage.ts:27` — `case 'advance': return handleAdvance(rest)` — [显式])
- `stage` 命令核心依赖 `advance()`。 (`src/cli/commands/stage.ts:8` — `import { advance` — [显式])
- `advance()` 先做依赖检查，再做 Gate 评估。 (`src/core/process-engine/advance.ts:124` — `先执行依赖检查，再执行 Gate 校验` — [显式])
- Gate 通过后才会推进状态并记录历史。 (`src/core/process-engine/advance.ts:135` — `const gate = evaluateGate` — [显式])

```text
spec-first stage advance
  -> handleStage()
  -> handleAdvance()
  -> advance(featureId)
  -> checkDependencies()
  -> evaluateGate()
  -> write stage-state/history/findings
```

## 链路 3：追踪矩阵校验

- `matrix` 相关能力落在 `trace-engine/matrix.ts`。 (`src/core/trace-engine/matrix.ts:45` — `parseMatrix` — [显式])
- `checkMatrix()` 会先解析矩阵，再构造 trace context。 (`src/core/trace-engine/matrix.ts:54` — `const rows = parseMatrix` — [显式])
- orphan、broken chain 和 V-Model 问题都在同一条链路中汇总。 (`src/core/trace-engine/matrix.ts:59` — `孤儿项` — [显式])

```text
matrix markdown
  -> parseMatrix()
  -> createTraceContext()
  -> orphan check
  -> broken chain check
  -> V-Model pair check
```

## 链路 4：更新与宿主集成

- `setup` 已退化为转发到 `update`。 (`src/cli/commands/setup.ts:13` — `setup 已废弃，请使用 spec-first update` — [显式])
- `update` 的主流程会执行 scaffold、模板变更检测、manifest 迁移与宿主集成刷新。 (`src/cli/commands/update.ts:81` — `ensureProjectInstallScaffold` — [显式])
- 宿主集成刷新包含 Skill 同步、MCP 配置补齐、Hooks/Session Hooks 注册。 (`src/cli/commands/update.ts:101` — `refreshHostIntegrations` — [显式])
- Session hook 会在会话开始时提示技能路由、catchup，并尝试启动 viewer。 (`src/core/tool-integration/session-hook.ts:49` — `Session Hook 决策树` — [显式])

```text
spec-first update
  -> runUpdate()
  -> checkTemplateChanges()
  -> checkAndExecuteManifests()
  -> refreshHostIntegrations()
  -> ensureSkillCommands()/ensureHostBootstrap()/installHooks()/registerSessionHooks()
```

## 链路 5：项目认知与 AI 上下文

- `ai context` 构建上下文包。 (`src/cli/commands/ai.ts:39` — `const pack = buildContextPack` — [显式])
- `ai catchup` 执行会话恢复，并追加 first runtime notice。 (`src/cli/commands/ai.ts:82` — `const result = catchup` — [显式])
- `first` runtime 结构由 `summary/roleViews/stageViews/docsProjection` 组成。 (`src/core/skill-runtime/first-runtime-types.ts:17` — `FirstRuntimeIndex` — [显式])
