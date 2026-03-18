# 架构

> 生成时间: 2026-03-17 | 模式: deep

## 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Layer                            │
│                     src/cli/ (27 commands)                  │
├─────────────────────────────────────────────────────────────┤
│                       Core Layer                           │
│  process-engine | gate-engine | trace-engine | skill-runtime │
│  change-mgr | ai-orchestrator | template | tool-integration │
│  metrics-engine | validators | task-plan | rules            │
│  batch-executor | migrations | host-adapters                │
├─────────────────────────────────────────────────────────────┤
│                      Shared Layer                          │
│        types | fs-utils | config-schema | logger            │
└─────────────────────────────────────────────────────────────┘
```

## 层次职责

### CLI Layer (`src/cli/`)

**职责**: CLI 命令注册与路由

**模块**:
- commands (27 个命令)
- router (命令路由)
- parse-utils (参数解析)

**证据**: `src/cli/index.ts:36-98` — 27 次调用 — `[显式]`

### Core Layer (`src/core/`)

**职责**: 核心引擎实现

| 模块 | 职责 | 依赖方向 |
|------|------|----------|
| process-engine | 阶段状态机 | gate-engine, trace-engine |
| skill-runtime | Skill 分发 | process-engine, gate-engine |
| gate-engine | 门禁评估 | trace-engine, validators |
| trace-engine | 追溯管理 | validators |
| change-mgr | 变更管理 | process-engine, trace-engine |
| ai-orchestrator | AI 编排 | skill-runtime, process-engine |
| template | 模板渲染 | — |
| tool-integration | 工具集成 | ai-orchestrator |
| metrics-engine | 健康度评分 | trace-engine |
| validators | 格式校验 | rules |
| task-plan | 任务计划 | trace-engine |
| rules | 真理源定义 | — |
| batch-executor | 批量执行 | — |
| migrations | 版本迁移 | — |
| host-adapters | 宿主适配 | — |

### Shared Layer (`src/shared/`)

**职责**: 共享类型与工具

**模块**:
- types (Stage 枚举、ID 类型、ExitCode)
- fs-utils (文件系统工具)
- config-schema (配置 Schema)
- logger (日志工具)

**证据**: `src/shared/types.ts:7-66` — `[显式]`

## 架构模式

| 模式 | 说明 | 证据 |
|------|------|------|
| ESM Module System | 全项目使用 ESM 模块 | `package.json:5` — `type: module` — `[显式]` |
| Named Exports Only | core 模块禁止 default export | `CLAUDE.md:59` — `[显式]` |
| Strict TypeScript | 严格模式、verbatimModuleSyntax | `tsconfig.json` — `[显式]` |
| Stage-based State Machine | 阶段状态机驱动 Feature 生命周期 | `src/core/process-engine/stage-machine.ts` — `[显式]` |
| Gate Engine Pattern | 门禁条件评估与阻塞机制 | `src/core/gate-engine/gate-evaluator.ts` — `[显式]` |
| Trace Engine Pattern | 追溯 ID 与覆盖率矩阵管理 | `src/core/trace-engine/matrix.ts` — `[显式]` |
| Skill Runtime Pattern | 三层路由分发 | `src/core/skill-runtime/dispatcher.ts` — `[显式]` |

## 关键协作关系

### Stage Advance Flow

```
CLI (stage advance)
  → process-engine/advance()
    → gate-engine/evaluate()
      → trace-engine/getCoverage()
    → stage-machine/transition()
```

### Gate Check Flow

```
CLI (gate check)
  → gate-engine/evaluate()
    → validators/validateArtifacts()
    → trace-engine/checkCoverage()
  → report generation
```

### Skill Dispatch Flow

```
CLI (skill render)
  → skill-runtime/dispatch()
    → resolveSkillPath()
    → assemblePrompt()
    → validateHardGate()
```

**证据**: `src/core/process-engine/advance.ts`, `src/core/gate-engine/gate-evaluator.ts`, `src/core/skill-runtime/dispatcher.ts` — `[显式]`
