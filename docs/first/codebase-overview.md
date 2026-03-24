# Spec-First 代码库概览

> 本文档基于 `.spec-first/runtime/first/structure-overview.json` 生成

## 项目信息

- **项目名称**: spec-first
- **版本**: 1.2.3
- **描述**: Spec-First 全链路研发闭环引擎——阶段状态机驱动 Feature 从需求到上线
- **运行时**: Node.js >= 20.0.0
- **模块系统**: ESM
- **构建工具**: tsup
- **测试框架**: Vitest

## 入口文件

- **源码入口**: `src/cli/index.ts`
- **构建产物**: `dist/cli/index.js`

## 目录结构

```
spec-first/
├── src/
│   ├── cli/                 # CLI 入口与命令路由
│   │   ├── index.ts         # 命令注册入口
│   │   ├── router.ts        # 路由分发
│   │   ├── parse-utils.ts   # 参数解析工具
│   │   └── commands/        # 27+ 命令实现
│   │
│   ├── core/                # 核心业务逻辑（14 个模块）
│   │   ├── process-engine/  # 阶段状态机
│   │   ├── skill-runtime/   # Skill 分发与执行
│   │   ├── ai-orchestrator/ # AI 编排与上下文
│   │   ├── gate-engine/     # 质量门禁评估
│   │   ├── trace-engine/    # 追溯 ID 管理
│   │   ├── change-mgr/      # RFC/Defect 管理
│   │   ├── template/        # 模板渲染
│   │   ├── tool-integration/# 工具集成钩子
│   │   ├── metrics-engine/  # 健康度与瓶颈检测
│   │   ├── validators/      # 产物格式校验
│   │   ├── task-plan/       # 任务计划解析
│   │   ├── rules/           # 静态规则定义
│   │   ├── batch-executor/  # 批量任务执行
│   │   ├── migrations/      # 状态迁移
│   │   └── host-adapters/   # 多宿主适配
│   │
│   ├── shared/              # 共享类型与工具
│   │   ├── types.ts         # 核心类型定义
│   │   ├── logger.ts        # 日志工具
│   │   ├── fs-utils.ts      # 文件系统工具
│   │   ├── config-schema.ts # 配置 Schema
│   │   └── host-bootstrap.ts# 宿主启动
│   │
│   └── config/              # 项目级配置
│       └── bootstrap-manifest.ts
│
├── specs/                   # Feature 产物目录
├── skills/                  # Skill 定义文件
├── templates/               # Handlebars 模板
├── tests/                   # 测试文件
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
│
└── .spec-first/             # 项目级配置与运行时状态
```

## 各目录职责

| 目录 | 职责 | 关键文件 |
|------|------|---------|
| `src/cli/` | CLI 入口与命令路由，依赖 core 和 shared，不向上依赖 | `index.ts`, `router.ts` |
| `src/cli/commands/` | 27+ 命令实现（id, init, stage, gate, feature 等） | `init.ts`, `gate.ts`, `stage.ts` |
| `src/core/process-engine/` | 阶段状态机（8 active + 2 terminal），驱动 Feature 生命周期 | `stage-machine.ts`, `advance.ts` |
| `src/core/skill-runtime/` | Skill 分发、prompt 组装、hard-gate 校验（三层路由） | `dispatcher.ts`, `prompt-assembler.ts` |
| `src/core/ai-orchestrator/` | Auto-loop、catchup 上下文恢复、context-pack | `auto-loop.ts`, `catchup.ts` |
| `src/core/gate-engine/` | 阶段质量门禁评估（19条：16 blocking + 3 warning） | `gate-evaluator.ts`, `condition-registry.ts` |
| `src/core/trace-engine/` | 追溯 ID 生成/校验/搜索、覆盖率矩阵（C3/C4/C6/C8/C9） | `id-taxonomy.ts`, `id-generator.ts` |
| `src/core/change-mgr/` | RFC + Defect 状态机、影响分析 | `rfc-machine.ts`, `defect-machine.ts` |
| `src/core/template/` | Handlebars 模板渲染、产物生成 | `renderer.ts`, `artifact-checker.ts` |
| `src/core/tool-integration/` | AI runtime hooks、context 同步 | `ai-runtime-hook.ts`, `context-sync.ts` |
| `src/core/metrics-engine/` | 健康度评分（H1）、瓶颈检测（R1-R5） | `health-score.ts`, `bottleneck.ts` |
| `src/core/validators/` | 产物格式校验（ID 格式、必需章节、文档关联一致性） | `format-validator.ts` |
| `src/core/task-plan/` | task_plan.md 解析、Todo 状态管理 | `parser.ts` |
| `src/core/rules/` | 真理源（RELEASE_REQUIRED_ARTIFACTS 等）、静态规则定义 | `truth-source.ts` |
| `src/core/batch-executor/` | 批量任务执行、并行编排支持 | `concurrent-executor.ts`, `serial-executor.ts` |
| `src/core/migrations/` | 状态文件版本迁移、升级兼容处理 | `index.ts`, `manifest-engine.ts` |
| `src/core/host-adapters/` | 多宿主适配（Claude, Codex, Cursor, Gemini） | `registry.ts`, `claude-adapter.ts` |
| `src/shared/` | 共享类型、工具函数（无业务依赖） | `types.ts`, `logger.ts` |
| `src/config/` | 项目级配置与启动清单 | `bootstrap-manifest.ts` |

## 推荐阅读顺序

1. **入口理解**: `src/cli/index.ts` → `src/cli/router.ts`
2. **核心类型**: `src/shared/types.ts`
3. **流程引擎**: `src/core/process-engine/stage-machine.ts`
4. **追溯体系**: `src/core/trace-engine/id-taxonomy.ts`
5. **门禁系统**: `src/core/gate-engine/gate-evaluator.ts`
6. **Skill 分发**: `src/core/skill-runtime/dispatcher.ts`

## 高风险区域

| 区域 | 风险 | 影响范围 |
|------|------|---------|
| `src/shared/types.ts` | Stage 枚举、ID 体系变更会影响所有 core 模块 | 全局 |
| `src/core/rules/truth-source.ts` | Gate 真理源规则变更影响 stage advance 逻辑 | 流程控制 |
| `src/core/trace-engine/id-taxonomy.ts` | ID 类型体系变更影响追溯链和覆盖率计算 | 追溯系统 |
| `src/core/skill-runtime/dispatcher.ts` | Skill 分发逻辑变更影响所有 Skill 执行 | Skill 系统 |
| `src/core/process-engine/stage-machine.ts` | 阶段转换规则变更影响 Feature 生命周期 | 流程控制 |

## CLI 命令列表

共 27+ 个命令：init, stage, gate, docs-links, feature, skill, ai, orchestrate, metrics, trace, id, defect, rfc, first, doctor, status, analyze, update, commit, hooks, viewer, onboarding, batch-test, setup, uninstall, validate, done

## 依赖规则

- **ESM only**: 全项目 `type: module`，使用 `import/export`
- **Named exports only**: core 模块禁止使用 default export
- **类型集中**: Stage/ExitCode/ID types 集中于 `src/shared/types.ts`
