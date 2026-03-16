---
last_updated: 2026-03-16
mode: quick
project: spec-first
---

# Spec-First 代码库概览

> 本文档基于 quick 模式生成，提供代码库的快速导航与模块职责概述。

## 目录结构

```
spec-first/
├── src/
│   ├── cli/                    # CLI 命令注册与路由
│   │   ├── commands/           # 27 个 CLI 子命令实现
│   │   │   ├── init.ts         # 项目初始化
│   │   │   ├── stage.ts        # 阶段推进
│   │   │   ├── gate.ts         # 质量门禁检查
│   │   │   ├── feature.ts      # Feature 管理
│   │   │   ├── matrix.ts       # 追溯矩阵同步
│   │   │   ├── trace.ts        # ID 追溯搜索
│   │   │   ├── metrics.ts      # 健康度评分
│   │   │   ├── id.ts           # ID 生成/校验
│   │   │   ├── rfc.ts          # 变更请求管理
│   │   │   ├── defect.ts       # 缺陷记录管理
│   │   │   ├── first.ts        # First 流程入口
│   │   │   └── ...             # 其他命令
│   │   ├── router.ts           # 命令路由分发
│   │   ├── parse-utils.ts      # 参数解析工具
│   │   └── index.ts            # CLI 入口
│   │
│   ├── core/                   # 核心引擎（14 个模块）
│   │   ├── process-engine/     # 阶段状态机（Stage 枚举、Feature 生命周期）
│   │   ├── skill-runtime/      # Skill 分发、Prompt 组装、Hard-Gate 校验
│   │   ├── ai-orchestrator/    # Auto-loop、Catchup 上下文恢复、Context-pack
│   │   ├── gate-engine/        # 质量门禁评估（19 条规则）
│   │   ├── trace-engine/       # 追溯 ID 生成/校验/搜索、覆盖率矩阵
│   │   ├── change-mgr/         # RFC + Defect 状态机、影响分析
│   │   ├── template/           # Handlebars 模板渲染、产物生成
│   │   ├── tool-integration/   # AI runtime hooks、context 同步
│   │   ├── metrics-engine/     # 健康度评分（H1）、瓶颈检测（R1-R5）
│   │   ├── validators/         # 产物格式校验
│   │   ├── task-plan/          # task_plan.md 解析、Todo 状态管理
│   │   ├── rules/              # 真理源（静态规则定义）
│   │   ├── batch-executor/     # 批量任务执行、并行编排
│   │   ├── migrations/         # 状态文件版本迁移
│   │   └── host-adapters/      # 多宿主适配（Claude/Cursor/Codex/Gemini）
│   │
│   ├── shared/                 # 共享类型与工具
│   │   ├── types.ts            # Stage 枚举、ExitCode、ID 类型定义
│   │   ├── logger.ts           # 日志工具
│   │   ├── fs-utils.ts         # 文件系统工具
│   │   ├── config-schema.ts    # 配置 Schema
│   │   └── host-paths.ts       # 宿主路径解析
│   │
│   └── config/                 # 配置相关
│       └── bootstrap-manifest.ts
│
├── skills/                     # Skill 定义（20 个）
│   └── spec-first/
│       ├── 00-first/           # First 流程入口
│       ├── 00-onboarding/      # 项目引导
│       ├── 01-init/            # 项目初始化
│       ├── 02-catchup/         # 上下文恢复
│       ├── 03-spec/            # 需求规格
│       ├── 04-design/          # 设计文档
│       ├── 05-research/        # 技术调研
│       ├── 06-task/            # 任务规划
│       ├── 07-code/            # 代码实现
│       ├── 08-review/          # 代码评审
│       ├── 10-archive/         # 归档
│       ├── 11-plan/            # 计划制定
│       ├── 12-verify/          # 验证测试
│       ├── 13-orchestrate/     # 编排协调
│       ├── 14-status/          # 状态查看
│       ├── 15-doctor/          # 诊断修复
│       ├── 16-sync/            # 同步操作
│       ├── 17-feature/         # Feature 管理
│       ├── 20-spec-review/     # 规格评审
│       ├── 21-analyze/         # 分析
│       └── shared/             # 共享契约
│
├── templates/                  # Handlebars 模板
│   ├── init/                   # 初始化模板
│   ├── gate/                   # Gate 报告模板
│   ├── matrix/                 # 追溯矩阵模板
│   ├── metrics/                # 健康度报告模板
│   ├── review/                 # 评审报告模板
│   ├── release/                # 发布模板
│   ├── ci/                     # CI 配置模板
│   └── migrations/             # 迁移模板
│
├── tests/                      # 测试套件
│   ├── unit/                   # 单元测试（每模块一文件）
│   ├── integration/            # 集成测试
│   ├── e2e/                    # 端到端测试
│   ├── benchmark/              # 性能基准测试
│   ├── fixtures/               # 测试固件数据
│   └── skill-validation/       # Skill 验证框架
│
├── specs/                      # Feature 产物目录（运行时生成）
├── .spec-first/                # 项目级配置与运行时状态
└── dist/                       # 构建产物
```

## 模块划分与职责

### CLI 层 (`src/cli/`)

| 模块 | 职责 |
|------|------|
| `index.ts` | CLI 入口，命令行参数解析与分发 |
| `router.ts` | 命令路由分发，将参数映射到对应命令处理函数 |
| `commands/` | 27 个 CLI 子命令实现，每个文件对应一个命令 |
| `parse-utils.ts` | 命令行参数解析工具函数 |

### 核心引擎层 (`src/core/`)

| 模块 | 职责 |
|------|------|
| `process-engine/` | 阶段状态机（8 active + 2 terminal），驱动 Feature 生命周期、ID 生成、目录初始化 |
| `skill-runtime/` | Skill 分发、Prompt 组装、Hard-Gate 校验（三层路由：Semantic Map → Runtime Route → Skill File） |
| `ai-orchestrator/` | Auto-loop、Catchup 上下文恢复、Context-pack，含健壮性保障机制 |
| `gate-engine/` | 阶段质量门禁评估（19 条：16 blocking + 3 warning）、豁免管理、PRD 评分 |
| `trace-engine/` | 追溯 ID 生成/校验/搜索、覆盖率矩阵（C3/C4/C6/C8/C9）、Exception 机制 |
| `change-mgr/` | RFC + Defect 状态机、影响分析 |
| `template/` | Handlebars 模板渲染、产物生成、变更分类 |
| `tool-integration/` | AI runtime hooks、context 同步、工具注册 |
| `metrics-engine/` | 健康度评分（H1）、瓶颈检测（R1-R5） |
| `validators/` | 产物格式校验（ID 格式、必需章节、追踪矩阵一致性） |
| `task-plan/` | task_plan.md 解析、Todo 状态管理 |
| `rules/` | 真理源（RELEASE_REQUIRED_ARTIFACTS 等静态规则定义） |
| `batch-executor/` | 批量任务执行、并行编排、依赖解析 |
| `migrations/` | 状态文件版本迁移、升级兼容处理 |
| `host-adapters/` | 多宿主适配（Claude/Cursor/Codex/Gemini） |

### 共享层 (`src/shared/`)

| 模块 | 职责 |
|------|------|
| `types.ts` | 核心类型定义（Stage 枚举、ExitCode、ID 类型） |
| `logger.ts` | 统一日志工具 |
| `fs-utils.ts` | 文件系统操作工具 |
| `config-schema.ts` | 配置 Schema 定义与校验 |
| `host-paths.ts` | 宿主路径解析 |
| `host-bootstrap.ts` | 宿主引导逻辑 |

## 入口文件

| 入口类型 | 文件路径 | 说明 |
|----------|----------|------|
| CLI 主入口 | `src/cli/index.ts` | 命令行入口，通过 `bin` 字段映射到 `dist/cli/index.js` |
| NPM Postinstall | `src/postinstall.ts` | 安装后钩子，执行宿主引导 |
| NPM Preuninstall | `src/preuninstall.ts` | 卸载前钩子，清理配置 |

## 构建/运行命令

```bash
# 开发
npm run build              # tsup 打包
npm run typecheck          # tsc --noEmit 类型检查
npm run lint               # eslint 代码检查
npm run lint:fix           # eslint 自动修复
npm run format             # prettier 格式化

# 测试
npm test                   # vitest run（全量测试）
npm run test:watch         # vitest watch 模式
npm run test:coverage      # vitest 带覆盖率报告
npm run bench              # vitest 性能基准测试

# 单文件测试
npx vitest run tests/unit/<file>.test.ts   # 运行指定测试文件
npx vitest run -t "pattern"                # 按名称匹配测试

# Spec-First CLI 常用命令
spec-first feature current                          # 查看当前 featureId
spec-first feature switch <featureId>               # 切换 Feature
spec-first gate check --feature <featureId>         # 执行 Gate 校验
spec-first stage advance --feature <featureId>      # 推进阶段
spec-first matrix sync --feature <featureId>        # 同步追踪矩阵
spec-first metrics --feature <featureId>            # 查看健康度评分
spec-first id search <ID>                           # 追溯 ID 上下游
```

## 开发入口

### 常见开发任务

| 任务 | 文件/目录 | 说明 |
|------|-----------|------|
| 新增 CLI 命令 | `src/cli/commands/` | 添加新的 CLI 子命令，需在 `router.ts` 注册 |
| 修改阶段状态机 | `src/core/process-engine/` | 修改 Stage 枚举、阶段推进逻辑 |
| 修改 Skill 分发逻辑 | `src/core/skill-runtime/` | 修改 Skill 路由、Prompt 组装 |
| 修改质量门禁规则 | `src/core/gate-engine/` | 修改 Gate 条件、豁免逻辑 |
| 修改追溯逻辑 | `src/core/trace-engine/` | 修改 ID 生成/校验、覆盖率计算 |
| 修改 AI 编排 | `src/core/ai-orchestrator/` | 修改 Auto-loop、Catchup 逻辑 |
| 新增/修改 Skill | `skills/spec-first/<NN-name>/SKILL.md` | 修改或新增 Skill 定义 |
| 修改 Skill 引用文档 | `skills/spec-first/<NN-name>/references/` | 修改 Skill 的参考文档 |
| 修改模板 | `templates/` | 修改 Handlebars 模板 |
| 添加单元测试 | `tests/unit/` | 添加对应模块的单元测试 |
| 添加集成测试 | `tests/integration/` | 添加多模块协作的集成测试 |
| 添加 E2E 测试 | `tests/e2e/` | 添加端到端流程测试 |
| 修改核心类型 | `src/shared/types.ts` | 修改 Stage、ID 等核心类型定义 |
| 修改静态规则 | `src/core/rules/truth-source.ts` | 修改真理源规则 |

### 快速定位

- **CLI 入口**: `src/cli/index.ts`
- **命令路由**: `src/cli/router.ts`
- **核心引擎**: `src/core/`
- **共享类型**: `src/shared/types.ts`
- **Skill 定义**: `skills/spec-first/`
- **模板文件**: `templates/`
- **测试目录**: `tests/`

### 核心领域概念速查

- **Stage 枚举**（单向不可逆）：
  ```
  00_init → 01_specify → 02_design → 03_plan → 04_implement
  → 05_verify → 06_wrap_up → 07_release → 08_done / 09_cancelled
  ```

- **追溯 ID（14 类）**：
  - 业务链路：`FR` `DS` `TASK` `TC` `RFC`
  - V-Model：`REQ` `SYS` `ARCH` `MOD` / `ATP` `STP` `ITP` `UTP`
  - 顶层：`Feature`

- **覆盖率指标（5 项）**：
  - `C3`：TASK 覆盖 FR（传递链）
  - `C4`：TC 直接覆盖 FR
  - `C6`：TASK 已实现
  - `C8`：TASK 有上游
  - `C9`：TC 有上游 FR
