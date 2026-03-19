# 代码结构概览

## 目录结构

```
spec-first/
├── src/                    # 源代码
│   ├── cli/               # CLI 层
│   │   ├── index.ts       # 入口
│   │   ├── router.ts      # 路由器
│   │   └── commands/      # 命令处理器
│   ├── core/              # 核心层
│   │   ├── process-engine/    # 阶段状态机
│   │   ├── skill-runtime/     # Skill 分发
│   │   ├── ai-orchestrator/   # AI 编排
│   │   ├── gate-engine/       # 质量门禁
│   │   ├── trace-engine/      # 追溯引擎
│   │   ├── change-mgr/        # 变更管理
│   │   ├── template/          # 模板渲染
│   │   ├── tool-integration/  # 工具集成
│   │   ├── metrics-engine/    # 指标引擎
│   │   ├── validators/        # 校验器
│   │   ├── task-plan/         # 任务计划
│   │   ├── rules/             # 规则定义
│   │   ├── batch-executor/    # 批量执行
│   │   └── migrations/        # 迁移
│   └── shared/            # 共享层
│       ├── types.ts       # 类型定义
│       └── fs-utils.ts    # 文件工具
├── skills/                 # Skill 定义
│   └── spec-first/
│       ├── 00-first/      # 项目认知
│       ├── 01-init/       # 初始化
│       ├── 02-catchup/    # 恢复上下文
│       ├── 03-spec/       # 需求规格
│       ├── 04-design/     # 技术设计
│       ├── 06-task/       # 任务拆解
│       ├── 07-code/       # 代码实现
│       ├── 08-review/     # 代码审查
│       ├── 12-verify/     # 验收测试
│       └── ...            # 其他 Skill
├── templates/              # Handlebars 模板
├── tests/                  # 测试
│   ├── unit/              # 单元测试
│   ├── integration/       # 集成测试
│   └── e2e/               # 端到端测试
├── specs/                  # Feature 产物
├── .spec-first/            # 项目配置
│   ├── current            # 当前 Feature
│   ├── constitution.md    # 项目宪法
│   └── runtime/first/     # 项目认知 runtime
└── dist/                   # 构建产物
```

## 模块职责

### CLI 层 (`src/cli/`)

| 模块 | 职责 |
|------|------|
| `index.ts` | CLI 入口，命令注册与分发 |
| `router.ts` | 命令路由器 |
| `commands/` | 27 个命令处理器 |

### Core 层 (`src/core/`)

| 模块 | 职责 |
|------|------|
| `process-engine` | Stage 状态机，Feature 生命周期管理 |
| `skill-runtime` | Skill 分发、Prompt 组装、Hard-Gate |
| `ai-orchestrator` | Auto-loop、Catchup 上下文恢复 |
| `gate-engine` | 19 条质量门禁规则评估 |
| `trace-engine` | 追溯 ID 生成/校验、覆盖率矩阵 |
| `change-mgr` | RFC + Defect 状态机 |
| `template` | Handlebars 模板渲染 |
| `tool-integration` | AI runtime hooks |
| `metrics-engine` | 健康度评分（H1） |
| `validators` | 产物格式校验 |
| `task-plan` | task_plan.md 解析 |
| `rules` | 静态规则定义 |
| `batch-executor` | 批量任务执行 |
| `migrations` | 状态文件迁移 |

### Shared 层 (`src/shared/`)

| 模块 | 职责 |
|------|------|
| `types.ts` | 核心类型定义（Stage, ExitCode, IdType, GateResult 等） |
| `fs-utils.ts` | 文件系统工具函数 |
| `validators.ts` | 通用校验函数 |

## 关键文件

### 入口文件

| 文件 | 说明 |
|------|------|
| `src/cli/index.ts` | CLI 主入口 |
| `dist/cli/index.js` | 构建后入口（bin 指向） |

### 类型定义

| 文件 | 说明 |
|------|------|
| `src/shared/types.ts` | 核心类型 |
| `src/core/rules/truth-source.ts` | 规则真源 |

### 配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | 项目配置 |
| `tsconfig.json` | TypeScript 配置 |
| `vitest.config.ts` | 测试配置 |
| `eslint.config.js` | Lint 配置 |
| `.prettierrc` | 格式化配置 |

## 依赖关系

```
CLI Layer → Core Layer → Shared Layer
    ↓
Skills Layer (独立定义，被 skill-runtime 加载)
```

## 证据来源

- 目录结构分析 — 显式
- CLI 入口 (`src/cli/index.ts:1-105`) — 显式
- 核心模块 (`src/core/`) — 显式
- 类型定义 (`src/shared/types.ts:1-248`) — 显式
