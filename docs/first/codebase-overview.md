# Spec-First 代码库概览

> 基于 `.spec-first/runtime/first/structure-overview.json` 真源生成

---

## 分层架构

代码库采用三层架构，依赖方向自上而下：

```
┌─────────────────────────────────────────────┐
│                  CLI 层                      │
│         src/cli/ (29 files)                 │
│         入口与命令分发                        │
└─────────────────┬───────────────────────────┘
                  │ 依赖
┌─────────────────▼───────────────────────────┐
│                 Core 层                      │
│         src/core/ (14 modules)              │
│         核心业务逻辑                          │
└─────────────────┬───────────────────────────┘
                  │ 依赖
┌─────────────────▼───────────────────────────┐
│                Shared 层                     │
│         src/shared/ (7 modules)             │
│         共享类型与工具                        │
└─────────────────────────────────────────────┘
```

### 依赖约束

| 层级 | 允许依赖 |
|------|---------| |
| CLI | core, shared |
| Core | shared |
| Shared | node:*, 外部依赖 |

---

## Core 模块清单

| 模块 | 路径 | 文件数 | 职责 |
|------|------|-------|------|
| process-engine | `src/core/process-engine/` | 8 | Stage 状态机，Feature 生命周期管理 |
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

## Shared 模块清单

| 模块 | 路径 | 职责 |
|------|------|------|
| types | `src/shared/types.ts` | 共享类型定义（Stage、ExitCode、ID 类型） |
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

---

## 高变更影响文件

| 文件 | 风险等级 | 原因 |
|------|---------|------|
| `src/shared/types.ts` | critical | Stage/ID 体系，所有模块依赖 |
| `src/core/rules/truth-source.ts` | high | Gate 真理源，影响 Skill 路由 |
| `src/cli/router.ts` | high | 命令路由，影响所有 CLI 命令 |

> 修改这些文件需走完整 Plan 流程，确保向后兼容。

---

## 数据来源

- 真源：`.spec-first/runtime/first/structure-overview.json`
