# Spec-First 架构文档

> 本文档基于 `.spec-first/runtime/first/structure-overview.json` 生成

## 三层架构

```
+------------------------------------------------------------------+
|                           用户层                                  |
|   spec-first <command> [options]                                 |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                        CLI 层 (src/cli/)                          |
|  +------------------------------------------------------------+  |
|  |                     命令注册与路由                          |  |
|  |  index.ts  →  router.ts  →  commands/*.ts                  |  |
|  +------------------------------------------------------------+  |
|                              |                                   |
|                              v                                   |
|  +------------------------------------------------------------+  |
|  |                   参数解析与校验                            |  |
|  |  parse-utils.ts                                            |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                       Core 层 (src/core/)                         |
|                                                                   |
|  +-------------+  +-------------+  +-------------+  +-----------+ |
|  |process-engine|  |skill-runtime|  |gate-engine |  |trace-engine| |
|  |  状态机      |  |  分发器      |  |  门禁      |  |  追溯      | |
|  +-------------+  +-------------+  +-------------+  +-----------+ |
|         |                |                |               |       |
|         v                v                v               v       |
|  +-------------+  +-------------+  +-------------+  +-----------+ |
|  |ai-orchestrator| |change-mgr  |  |metrics-engine| |validators | |
|  |  AI 编排     |  |  变更管理   |  |  度量       |  |  校验     | |
|  +-------------+  +-------------+  +-------------+  +-----------+ |
|         |                |                |                       |
|         v                v                v                       |
|  +-------------+  +-------------+  +-------------+                |
|  |template     |  |task-plan    |  |batch-executor|               |
|  |  模板       |  |  任务计划    |  |  批量执行    |               |
|  +-------------+  +-------------+  +-------------+                |
|         |                |                                        |
|         v                v                                        |
|  +-------------+  +-------------+  +-------------+                |
|  |tool-integration|migrations   |  |host-adapters|                |
|  |  工具集成    |  |  迁移       |  |  宿主适配   |                |
|  +-------------+  +-------------+  +-------------+                |
|         |                                                        |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                      Shared 层 (src/shared/)                      |
|  +------------------------------------------------------------+  |
|  | types.ts          | logger.ts       | fs-utils.ts          |  |
|  | 核心类型定义       | 日志工具        | 文件系统工具          |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  | config-schema.ts  | host-bootstrap.ts                     |  |
|  | 配置 Schema       | 宿主启动                              |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                       Config 层 (src/config/)                     |
|  bootstrap-manifest.ts                                            |
+------------------------------------------------------------------+
```

## 模块边界与职责

### CLI 层

```
src/cli/
├── index.ts          # 命令注册入口
├── router.ts         # 路由分发
├── parse-utils.ts    # 参数解析
└── commands/         # 27+ 命令实现
    ├── init.ts
    ├── gate.ts
    ├── stage.ts
    ├── feature.ts
    ├── id.ts
    └── ...
```

**职责**:
- 接收用户命令行输入
- 解析参数并校验
- 路由到对应命令处理器
- 调用 Core 层服务并返回结果

**约束**: 依赖 core 和 shared，不向上依赖

### Core 层

```
src/core/
├── process-engine/   # 阶段状态机（8 active + 2 terminal）
├── skill-runtime/    # Skill 分发、prompt 组装、hard-gate 校验
├── ai-orchestrator/  # Auto-loop、catchup、context-pack
├── gate-engine/      # 质量门禁评估（19 条规则）
├── trace-engine/     # ID 生成/校验/搜索、覆盖率矩阵
├── change-mgr/       # RFC/Defect 状态机
├── template/         # Handlebars 渲染
├── tool-integration/ # AI runtime hooks
├── metrics-engine/   # 健康度与瓶颈检测
├── validators/       # 产物格式校验
├── task-plan/        # task_plan.md 解析
├── rules/            # 静态规则定义（真理源）
├── batch-executor/   # 批量任务执行
├── migrations/       # 状态文件迁移
└── host-adapters/    # 多宿主适配
```

**职责**:
- 实现所有业务逻辑
- 模块间可横向依赖
- 不依赖 CLI 层

### Shared 层

```
src/shared/
├── types.ts          # Stage/ExitCode/ID 类型定义
├── logger.ts         # 日志工具
├── fs-utils.ts       # 文件系统工具
├── config-schema.ts  # 配置 Schema
└── host-bootstrap.ts # 宿主启动
```

**职责**:
- 提供共享类型定义
- 提供通用工具函数
- 无业务依赖（例外: 依赖 `src/core/trace-engine/id-taxonomy.ts`）

### Config 层

```
src/config/
└── bootstrap-manifest.ts
```

**职责**:
- 项目级配置
- 启动清单定义

## 依赖方向

```
+----------+     +----------+     +----------+
|   CLI    | --> |   Core   | --> |  Shared  |
+----------+     +----------+     +----------+
                      ^               |
                      |               |
                      +---------------+
                    (例外: shared 依赖 core/trace-engine/id-taxonomy.ts)

+----------+
|  Config  | (独立，无依赖)
+----------+
```

**依赖规则**:
1. CLI → Core → Shared (主流向)
2. Shared → Core/trace-engine/id-taxonomy.ts (唯一例外，ID 类型定义)
3. Config 独立于业务逻辑

## 模块间依赖关系

```
process-engine ──┬──> shared/types.ts
                 ├──> gate-engine/*
                 └──> trace-engine/*

skill-runtime ───┬──> shared/*
                 ├──> rules/*
                 └──> task-plan/*

ai-orchestrator ─┬──> shared/*
                 └──> skill-runtime/*

gate-engine ─────┬──> shared/types.ts
                 └──> trace-engine/*

trace-engine ────┴──> shared/types.ts

change-mgr ──────┴──> shared/types.ts

template ────────┬──> shared/*
                 └──> (handlebars)

tool-integration─┬──> shared/*
                 └──> (external tools)

metrics-engine ──┬──> shared/*
                 └──> trace-engine/*

validators ──────┬──> shared/*
                 └──> trace-engine/*

task-plan ───────┴──> shared/*

rules ───────────┴──> (无依赖)

batch-executor ──┴──> shared/*

migrations ──────┴──> shared/*

host-adapters ───┴──> shared/*
```

## 核心模块详解

### process-engine (流程引擎)

```
+------------------+
| process-engine   |
+------------------+
| stage-machine.ts | ─── 阶段状态机 (00_init → 08_done)
| advance.ts       | ─── 阶段推进逻辑
| feature.ts       | ─── Feature 生命周期管理
| init.ts          | ─── 目录初始化
+------------------+
        │
        ├──> shared/types.ts (Stage 枚举)
        ├──> gate-engine (门禁校验)
        └──> trace-engine (ID 生成)
```

### skill-runtime (Skill 运行时)

```
+----------------------+
| skill-runtime        |
+----------------------+
| dispatcher.ts        | ─── Skill 分发器
| prompt-assembler.ts  | ─── Prompt 组装
| hard-gate.ts         | ─── Hard Gate 校验
| execution-context.ts | ─── 执行上下文
+----------------------+
        │
        ├──> shared/*
        ├──> rules/* (真理源)
        └──> task-plan/*
```

### gate-engine (门禁引擎)

```
+-----------------------+
| gate-engine           |
+-----------------------+
| gate-evaluator.ts     | ─── 门禁评估器
| condition-registry.ts | ─── 条件注册表 (19 条)
| constitution-validator| ─── 宪章校验
| prd-validator.ts      | ─── PRD 校验
+-----------------------+
        │
        ├──> shared/types.ts
        └──> trace-engine/*
```

### trace-engine (追溯引擎)

```
+----------------------+
| trace-engine         |
+----------------------+
| id-taxonomy.ts       | ─── ID 分类体系 (14 类)
| id-generator.ts      | ─── ID 生成器
| id-validator.ts      | ─── ID 校验器
| relationship-graph.ts| ─── 关系图 (覆盖率矩阵)
+----------------------+
        │
        └──> shared/types.ts
```

## 数据流

```
用户命令
    │
    v
CLI 解析
    │
    v
Router 分发
    │
    v
Command Handler
    │
    ├──> process-engine (阶段管理)
    ├──> gate-engine (门禁校验)
    ├──> trace-engine (ID 追溯)
    ├──> skill-runtime (Skill 执行)
    └──> template (产物生成)
    │
    v
输出结果
```

## 设计原则

1. **单向依赖**: CLI → Core → Shared，避免循环依赖
2. **类型集中**: 所有核心类型定义于 `src/shared/types.ts`
3. **ESM only**: 全项目使用 ES Module
4. **Named exports**: Core 模块仅使用命名导出
5. **真理源**: 静态规则定义于 `src/core/rules/truth-source.ts`
