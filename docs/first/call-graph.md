# 调用图

> 本文档基于 `.spec-first/runtime/first/critical-flows.json` 和 `structure-overview.json` 真源生成

## 分层架构

```
┌─────────────────────────────────────────────┐
│                  CLI 层                      │
│              src/cli/ (29 files)            │
└─────────────────┬───────────────────────────┘
                  │ 调用
                  ▼
┌─────────────────────────────────────────────┐
│                 Core 层                      │
│         src/core/ (14 modules)              │
└─────────────────┬───────────────────────────┘
                  │ 依赖
                  ▼
┌─────────────────────────────────────────────┐
│                Shared 层                     │
│           src/shared/ (7 files)             │
└─────────────────────────────────────────────┘
```

**依赖规则**:
- CLI 层 → 允许依赖 core, shared
- Core 层 → 允许依赖 shared
- Shared 层 → 仅依赖 node:* 和外部依赖

---

## 核心模块调用关系

### 1. 状态机调用链

```
src/shared/types.ts
    │ (type_import)
    ▼
src/core/process-engine/stage-machine.ts
    │ (function_call: assertTransitionAllowed)
    ▼
src/core/process-engine/advance.ts
    │ (function_call: evaluateGate)
    ▼
src/core/gate-engine/gate-evaluator.ts
```

### 2. 覆盖率计算调用链

```
src/core/trace-engine/matrix.ts
    │ (function_call: parseMatrix)
    ▼
src/core/trace-engine/coverage.ts
    │ (function_call: getCoverage)
    ▼
src/core/gate-engine/gate-evaluator.ts
```

### 3. Skill 路由调用链

```
src/core/skill-runtime/dispatcher.ts
    ├─ (function_call) → src/core/skill-runtime/hard-gate.ts
    ├─ (function_call) → src/core/skill-runtime/prompt-assembler.ts
    └─ (function_call) → src/core/skill-runtime/scope-guard.ts
```

### 4. 命令入口调用链

```
src/cli/index.ts
    │ (dispatch)
    ▼
src/cli/router.ts
    │ (handler call)
    ▼
src/cli/commands/*.ts
```

---

## 跨模块依赖矩阵

| 上游模块 | 下游模块 | 依赖类型 |
|---------|---------|---------|
| `src/shared/types.ts` | `stage-machine.ts`, `gate-evaluator.ts`, `coverage.ts`, `router.ts` | type_import |
| `src/core/process-engine/stage-machine.ts` | `advance.ts` | function_call |
| `src/core/trace-engine/matrix.ts` | `gate-evaluator.ts`, `coverage.ts` | function_call |
| `src/core/trace-engine/coverage.ts` | `gate-evaluator.ts` | function_call |
| `src/core/gate-engine/gate-evaluator.ts` | `advance.ts`, `orchestrate.ts` | function_call |
| `src/core/skill-runtime/dispatcher.ts` | `hard-gate.ts`, `prompt-assembler.ts`, `scope-guard.ts` | function_call |
| `src/core/ai-orchestrator/auto-loop.ts` | `orchestrate.ts` | function_call |
| `src/core/process-engine/feature.ts` | `orchestrate.ts`, `hard-gate.ts` | function_call |

---

## 高变更影响文件

| 文件 | 原因 | 风险 |
|------|------|------|
| `src/shared/types.ts` | Stage/ID 体系，所有模块依赖 | Critical |
| `src/core/rules/truth-source.ts` | Gate 真理源，影响 Skill 路由 | High |
| `src/cli/router.ts` | 命令路由，影响所有 CLI 命令 | High |

---

## 模块职责速查

| 模块 | 路径 | 文件数 | 职责 |
|------|------|-------|------|
| cli | `src/cli/` | 29 | CLI 入口与命令分发 |
| process-engine | `src/core/process-engine/` | 8 | 阶段状态机，Feature 生命周期管理 |
| skill-runtime | `src/core/skill-runtime/` | 25 | Skill 分发、prompt 组装、hard-gate 校验 |
| gate-engine | `src/core/gate-engine/` | 10 | 阶段质量门禁评估（19 条条件） |
| trace-engine | `src/core/trace-engine/` | 9 | 追溯 ID 生成/校验/搜索、覆盖率矩阵 |
| ai-orchestrator | `src/core/ai-orchestrator/` | 15 | Auto-loop、catchup 上下文恢复 |
| change-mgr | `src/core/change-mgr/` | 7 | RFC + Defect 状态机 |
| template | `src/core/template/` | 6 | Handlebars 模板渲染 |
| tool-integration | `src/core/tool-integration/` | 11 | AI runtime hooks |
| metrics-engine | `src/core/metrics-engine/` | 3 | 健康度评分、瓶颈检测 |
| validators | `src/core/validators/` | 1 | 产物格式校验 |
| task-plan | `src/core/task-plan/` | 1 | task_plan.md 解析 |
| rules | `src/core/rules/` | 1 | 真理源定义 |
| batch-executor | `src/core/batch-executor/` | 12 | 批量任务执行 |
| migrations | `src/core/migrations/` | 7 | 状态文件版本迁移 |
| host-adapters | `src/core/host-adapters/` | 7 | 宿主适配器 |

---

## Shared 模块

| 模块 | 路径 | 职责 |
|------|------|------|
| types | `src/shared/types.ts` | 共享类型定义 |
| fs-utils | `src/shared/fs-utils.ts` | 文件 I/O 封装 |
| config-schema | `src/shared/config-schema.ts` | 配置加载与校验 |
| logger | `src/shared/logger.ts` | 日志工具 |
| validators | `src/shared/validators.ts` | 运行时类型守卫 |
| host-paths | `src/shared/host-paths.ts` | 宿主路径检测 |
| host-bootstrap | `src/shared/host-bootstrap.ts` | 宿主引导 |

---

## 入口点

| 名称 | 路径 | 类型 | 描述 |
|------|------|------|------|
| cli | `src/cli/index.ts` | main | CLI 主入口 |
| bin | `dist/cli/index.js` | executable | 打包后的可执行入口 |
