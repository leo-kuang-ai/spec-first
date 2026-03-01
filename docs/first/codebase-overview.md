---
last_updated: 2026-02-28
---

# 代码结构概览

> 本文档由 `spec-first:first` skill 自动生成，提供项目代码结构的高层次视图。

## 目录结构

```
spec-first/
├── src/                      # 源代码
│   ├── cli/                  # CLI 命令入口与路由
│   ├── core/                 # 核心引擎模块
│   ├── shared/               # 共享工具与类型
│   ├── postinstall.ts        # 安装后钩子
│   └── preuninstall.ts       # 卸载前钩子
├── tests/                    # 测试套件
│   ├── unit/                 # 单元测试
│   ├── integration/          # 集成测试
│   ├── e2e/                  # 端到端测试
│   └── benchmark/            # 性能基准测试
├── templates/                # Handlebars 模板
├── skills/                   # Skill 定义文件
├── scripts/                  # 构建与工具脚本
├── docs/                     # 项目文档
├── specs/                    # Feature 规范存储
├── .spec-first/              # 运行时配置
├── dist/                     # 构建输出
└── coverage/                 # 测试覆盖率报告
```

## 核心模块 (`src/core/`)

### 1. `ai-orchestrator/` - AI 编排引擎
负责 AI 自动循环、上下文管理与恢复。

| 文件 | 职责 |
|------|------|
| `auto-loop.ts` | AI 自动循环主逻辑 |
| `catchup.ts` | 会话恢复与上下文摘要 |
| `context-pack.ts` | 上下文包组装 |
| `context-provider.ts` | 上下文提供者 |
| `context-slicing.ts` | 上下文切片 |
| `context-review.ts` | 上下文审查 |
| `mcp-checker.ts` | MCP 服务器检查 |
| `slop-checker.ts` | SLOP 检查 |
| `completion-detector.ts` | 任务完成检测 |
| `retry-controller.ts` | 重试控制 |
| `audit-log.ts` | 审计日志 |
| `ai-stats.ts` | AI 统计 |
| `todo-runner.ts` | TODO 运行器 |
| `watchdog.ts` | 看门狗 |

### 2. `change-mgr/` - 变更管理
RFC 与 Defect 状态机、影响分析。

| 文件 | 职责 |
|------|------|
| `rfc.ts` | RFC 状态管理 |
| `rfc-machine.ts` | RFC 状态机 |
| `defect.ts` | Defect 状态管理 |
| `defect-machine.ts` | Defect 状态机 |
| `impact.ts` | 影响分析 |
| `sync.ts` | 状态同步 |

### 3. `gate-engine/` - 质量门禁
阶段质量门禁评估、安全扫描、上线检查。

| 文件 | 职责 |
|------|------|
| `gate-evaluator.ts` | Gate 条件评估引擎 |
| `security.ts` | 安全扫描 |
| `sca.ts` | 软件成分分析 |
| `command-gate.ts` | 命令 Gate |
| `rollback.ts` | 回滚机制 |
| `golive.ts` | 上线就绪检查 |

### 4. `process-engine/` - 流程引擎
阶段状态机、Feature 工作区管理。

| 文件 | 职责 |
|------|------|
| `stage-machine.ts` | 8 阶段状态机 |
| `init.ts` | Feature 初始化 |
| `advance.ts` | 阶段推进 |
| `feature.ts` | Feature 管理 |
| `extensions.ts` | 扩展机制 |
| `layer-merger.ts` | 配置层合并 |

### 5. `skill-runtime/` - Skill 运行时
Skill 分发、Prompt 组装、硬检查门禁。

| 文件 | 职责 |
|------|------|
| `dispatcher.ts` | Skill 分发器 |
| `prompt-assembler.ts` | Prompt 组装器 |
| `hard-gate.ts` | 硬检查门禁 |
| `phase-machine.ts` | 阶段机 |
| `front-matter.ts` | 前言解析 |
| `idempotent-write.ts` | 幂等写入 |
| `confirm-policy.ts` | 确认策略 |
| `orchestrate-args.ts` | 编排参数解析 |

### 6. `trace-engine/` - 追溯引擎
追溯 ID 生成/校验/搜索、覆盖率矩阵。

| 文件 | 职责 |
|------|------|
| `id-generator.ts` | ID 生成器 |
| `id-validator.ts` | ID 校验器 |
| `id-search.ts` | ID 搜索 |
| `matrix.ts` | 追溯矩阵 |
| `coverage.ts` | 覆盖率计算 |
| `exception-validator.ts` | 例外校验 |

### 7. `metrics-engine/` - 度量引擎
健康度评分、瓶颈分析。

| 文件 | 职责 |
|------|------|
| `health-score.ts` | 健康度评分 |
| `bottleneck.ts` | 瓶颈分析 |

### 8. `template/` - 模板引擎
Handlebars 模板渲染、产物检查。

| 文件 | 职责 |
|------|------|
| `renderer.ts` | 模板渲染器 |
| `artifact-checker.ts` | 产物检查器 |

### 9. `tool-integration/` - 工具集成
AI runtime hooks、上下文同步。

| 文件 | 职责 |
|------|------|
| `ai-runtime-hook.ts` | AI runtime hook |
| `ai-runtime-hook-scripts.ts` | Hook 脚本 |
| `session-hook.ts` | 会话 hook |
| `session-hook-managed.ts` | 托管会话 hook |
| `hook-installer.ts` | Hook 安装器 |
| `context-sync.ts` | 上下文同步 |

## CLI 命令 (`src/cli/`)

| 文件 | 命令 | 处理器 |
|------|------|--------|
| `commands/id.ts` | `id` | handleId |
| `commands/matrix.ts` | `matrix` | handleMatrix |
| `commands/init.ts` | `init` | handleInit |
| `commands/stage.ts` | `stage` | handleStage |
| `commands/rfc.ts` | `rfc` | handleRfc |
| `commands/defect.ts` | `defect` | handleDefect |
| `commands/metrics.ts` | `metrics` | handleMetrics |
| `commands/doctor.ts` | `doctor` | handleDoctor |
| `commands/gate.ts` | `gate` | handleGate |
| `commands/ai.ts` | `ai` | handleAi (未实现) |
| `commands/commit.ts` | `commit` | handleCommit |
| `commands/feature.ts` | `feature` | handleFeature |
| `commands/setup.ts` | `setup` | handleSetup |
| `commands/hooks.ts` | `hooks` | handleHooks |
| `commands/viewer.ts` | `viewer` | handleViewer |
| `commands/update.ts` | `update` | handleUpdate |
| `commands/uninstall.ts` | `uninstall` | handleUninstall |
| `commands/analyze.ts` | `analyze` | handleAnalyze |

## 共享模块 (`src/shared/`)

| 文件 | 职责 |
|------|------|
| `types.ts` | 核心类型定义 (Stage, ExitCode, ID types, etc.) |
| `fs-utils.ts` | 文件系统工具 |
| `logger.ts` | 日志工具 |
| `skill-commands.ts` | Skill 命令映射 |
| `validators.ts` | 数据校验器 |
| `config-schema.ts` | 配置 Schema |
| `host-bootstrap.ts` | 宿主引导 |
| `host-paths.ts` | 宿主路径 |

## 数据流向

```
用户输入 (CLI)
    ↓
src/cli/index.ts (路由)
    ↓
src/cli/commands/*.ts (命令处理器)
    ↓
src/core/* (引擎模块)
    ↓
产物输出 (specs/, reports/)
```

## 模块依赖关系

- **cli** 依赖 **core**, **shared**
- **core/process-engine** 依赖 **trace-engine**, **skill-runtime**
- **core/gate-engine** 依赖 **trace-engine**, **change-mgr**
- **core/ai-orchestrator** 依赖 **skill-runtime**, **tool-integration**
- **skill-runtime** 依赖 **shared**
- **所有模块** 依赖 **shared/types.ts**

---

*生成时间: 2026-02-28 | 命令: `/spec-first:first`*
