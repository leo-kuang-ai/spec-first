# 代码库概览

> 生成时间: 2026-03-17 | 模式: deep

## 项目概述

**spec-first** — AI-workflow CLI for spec-driven development

阶段状态机驱动的 Feature 研发闭环引擎，确保每个实现可追溯到对应规范定义。

## 入口点

| 入口 | 路径 | 说明 |
|------|------|------|
| CLI 入口 | `src/cli/index.ts` | 27 个命令入口 |
| 构建产物 | `dist/cli/index.js` | tsup 打包输出 |

## 模块职责

### CLI 层 (`src/cli/`)

| 模块 | 职责 | 证据 |
|------|------|------|
| commands | 27 个 CLI 命令实现 | `src/cli/index.ts:36-98` — `[显式]` |
| router | 命令路由分发 | `src/cli/router.ts` — `[推断]` |
| parse-utils | 参数解析工具 | `src/cli/parse-utils.ts` — `[推断]` |

### Core 层 (`src/core/`)

| 模块 | 职责 | 证据 |
|------|------|------|
| process-engine | 阶段状态机（8 active + 2 terminal），驱动 Feature 生命周期 | `src/core/process-engine/stage-machine.ts` — `[显式]` |
| skill-runtime | Skill 分发、prompt 组装、hard-gate 校验（三层路由） | `src/core/skill-runtime/dispatcher.ts:1-4` — `[显式]` |
| gate-engine | 阶段质量门禁评估（19 条条件：16 blocking + 3 warning） | `src/core/gate-engine/gate-evaluator.ts:1-4` — `[显式]` |
| trace-engine | 追溯 ID 生成/校验/搜索、覆盖率矩阵（C3/C4/C6/C8/C9） | `src/core/trace-engine/matrix.ts:1-5` — `[显式]` |
| change-mgr | RFC + Defect 状态机、影响分析 | `src/core/change-mgr/rfc-machine.ts:1-4` — `[显式]` |
| ai-orchestrator | Auto-loop、catchup 上下文恢复 | `src/core/ai-orchestrator/auto-loop.ts:1-5` — `[显式]` |
| template | Handlebars 模板渲染、产物生成 | `src/core/template/renderer.ts:13` — `import Handlebars` — `[显式]` |
| tool-integration | AI runtime hooks、context 同步 | `src/core/tool-integration/` — `[推断]` |
| metrics-engine | 健康度评分（H1）、瓶颈检测（R1-R5） | `src/core/metrics-engine/` — `[推断]` |
| validators | 产物格式校验（ID 格式、必需章节） | `src/core/validators/` — `[推断]` |
| task-plan | task_plan.md 解析、Todo 状态管理 | `src/core/task-plan/` — `[推断]` |
| rules | 真理源（RELEASE_REQUIRED_ARTIFACTS 等） | `src/core/rules/truth-source.ts` — `[显式]` |
| batch-executor | 批量任务执行、并行编排支持 | `src/core/batch-executor/` — `[推断]` |
| migrations | 状态文件版本迁移、升级兼容处理 | `src/core/migrations/` — `[推断]` |
| host-adapters | 宿主适配器（Claude/Codex/Gemini/Cursor 等 AI IDE） | `src/core/host-adapters/` — `[推断]` |

### Shared 层 (`src/shared/`)

| 模块 | 职责 | 证据 |
|------|------|------|
| types | Stage 枚举、ID 类型、ExitCode 定义 | `src/shared/types.ts:7-66` — `[显式]` |
| fs-utils | 文件系统工具函数 | `src/shared/fs-utils.ts` — `[推断]` |
| config-schema | 配置 Schema 定义 | `src/shared/config-schema.ts` — `[推断]` |
| logger | 日志工具 | `src/shared/logger.ts` — `[推断]` |

### Config 层 (`src/config/`)

| 模块 | 职责 | 证据 |
|------|------|------|
| config | 配置清单定义 | `src/config/` — `[推断]` |

## 核心能力

1. **Stage State Machine** — 8 active + 2 terminal stages
2. **Gate Engine** — 19 conditions (16 blocking + 3 warning)
3. **Trace Engine** — 14 ID types, 5 coverage metrics
4. **Skill Runtime** — 20 skills, 3-layer routing
5. **Change Management** — RFC + Defect state machines
6. **AI Orchestrator** — auto-loop, catchup context recovery
7. **Template Engine** — Handlebars-based artifact generation
8. **CLI Commands** — 27 commands

## 阅读顺序建议

1. `src/shared/types.ts` — 理解核心类型定义
2. `src/core/process-engine/stage-machine.ts` — 理解阶段状态机
3. `src/core/gate-engine/gate-evaluator.ts` — 理解门禁引擎
4. `src/core/trace-engine/matrix.ts` — 理解追溯引擎
5. `src/core/skill-runtime/dispatcher.ts` — 理解 Skill 分发
6. `src/cli/index.ts` — 理解 CLI 入口
