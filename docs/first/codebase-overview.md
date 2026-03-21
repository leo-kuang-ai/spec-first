# Spec-First 代码库概览

> 本文档基于 `.spec-first/runtime/first/structure-overview.json` 与 `summary.json` 生成，提供代码库结构的整体视图。

---

## 1. 项目基本信息

| 属性 | 值 |
|------|-----|
| 名称 | spec-first |
| 版本 | 1.1.4 |
| 类型 | CLI 工具（AI-workflow Engine） |
| 描述 | AI-workflow CLI for spec-driven development — quality gates, traceability, and feature lifecycle management |
| 语言 | TypeScript >= 5.4 |
| 运行时 | Node.js >= 20.0.0 |
| 模块系统 | ESM (`type: "module"`) |

**源代码规模** (`src/shared/types.ts:1-248` — Stage 枚举、ID 类型定义 — [显式])：
- Core 层：103 文件，约 22,645 行
- CLI 层：30 文件
- Shared 层：13 文件
- 总计：146 个 TypeScript 源文件，约 28,000 行代码

---

## 2. 目录结构

```
spec-first/
├── src/                    # 源代码目录（TypeScript）
│   ├── cli/               # CLI 命令层（30 文件）
│   │   ├── index.ts       # CLI 入口，注册 28 个命令
│   │   ├── router.ts      # 命令路由与分发
│   │   ├── parse-utils.ts # 参数解析工具
│   │   └── commands/      # 28 个 CLI 命令处理器
│   ├── core/              # 核心业务逻辑层（103 文件，14 个模块）
│   ├── shared/            # 共享基础设施层（13 文件）
│   └── config/            # 配置与启动层（2 文件）
├── skills/                 # Skill 定义文件（.md 格式）
│   └── spec-first/        # 20 个 Skill 目录
├── templates/              # Handlebars 模板文件（15 个）
├── tests/                  # 测试代码
│   ├── unit/              # 单元测试（161 文件）
│   ├── integration/       # 集成测试（12 文件）
│   ├── e2e/               # 端到端测试（7 文件）
│   ├── benchmark/         # 性能基准测试
│   └── fixtures/          # 测试固件数据
├── specs/                  # Feature 产物目录（运行时生成，由 CLI 管理）
├── .spec-first/           # 项目级配置与运行时状态
│   ├── meta/              # 元数据
│   └── runtime/           # 运行时状态
├── dist/                   # 构建输出目录（tsup 打包）
└── evidence-pack/         # 证据包目录（first skill 专用）
```

(`src/:1` — 源代码根目录结构 — [显式])

---

## 3. 四层架构

### 3.1 CLI 层（用户交互入口）

**职责**：接收用户命令行输入，解析参数，调用 Core 层执行业务逻辑。

**关键文件** (`src/cli/index.ts:1-50` — CLI 入口与命令注册 — [显式])：

| 文件 | 职责 | 关键导出 |
|------|------|---------|
| `index.ts` | CLI 入口，注册 28 个命令 | `dispatch`, `registerCommand` |
| `router.ts` | 命令路由与分发 | `dispatch`, `registerCommand`, `evaluatePolicy` |
| `parse-utils.ts` | 参数解析工具 | — |
| `commands/*.ts` | 28 个命令处理器 | — |

**命令列表** (`find src/cli/commands -name '*.ts' | wc -l = 28` — [显式])：
`id`, `matrix`, `init`, `stage`, `rfc`, `defect`, `metrics`, `doctor`, `gate`, `ai`, `commit`, `feature`, `setup`, `hooks`, `viewer`, `update`, `uninstall`, `analyze`, `trace`, `validate`, `done`, `orchestrate`, `first`, `batch-test`, `onboarding`, `skill`, `status`

**依赖方向**：CLI → Core → Shared（`grep -h '^import.*from.*core' src/cli/commands/*.ts` — [显式]）

### 3.2 Core 层（核心业务逻辑）

**职责**：实现 spec-first 的核心领域逻辑，包含 14 个核心模块。

**模块列表**：

| 模块 | 职责 | 关键函数 |
|------|------|---------|
| `process-engine/` | 阶段状态机（8 active + 2 terminal），驱动 Feature 生命周期 | `advance()`, `init()`, `isTerminal()` |
| `gate-engine/` | 阶段质量门禁评估（19条规则） | `evaluateGate()`, `validatePrd()` |
| `trace-engine/` | 追溯 ID 生成/校验/搜索、覆盖率矩阵 | `nextId()`, `parseMatrix()`, `getCoverage()` |
| `skill-runtime/` | Skill 分发、prompt 组装、hard-gate 校验 | `loadSkill()`, `assemblePrompt()` |
| `ai-orchestrator/` | Auto-loop、catchup 上下文恢复 | `catchup()`, `buildContextPack()`, `runAutoLoop()` |
| `change-mgr/` | RFC + Defect 状态机 | `transitionRfc()`, `transitionDefect()` |
| `metrics-engine/` | 健康度评分、瓶颈检测 | `calculateHealthScore()`, `detectBottlenecks()` |
| `validators/` | 产物格式校验 | `validateFormat()` |
| `task-plan/` | task_plan.md 解析 | `parseTaskPlan()` |
| `template/` | Handlebars 模板渲染 | `renderTemplate()` |
| `tool-integration/` | AI runtime hooks | `installHooks()`, `registerAIHooks()` |
| `batch-executor/` | 批量任务执行 | `executeBatch()` |
| `migrations/` | 状态文件版本迁移 | `runMigrations()` |
| `rules/` | 真理源规则定义 | `PRIMARY_STAGE_SKILL`, `RELEASE_REQUIRED_ARTIFACTS` |

(`src/core/process-engine/:1` — 8 个文件 — [显式])

### 3.3 Shared 层（共享基础设施）

**职责**：提供类型定义、工具函数，被 CLI 和 Core 层共享。

**关键文件** (`src/shared/types.ts:1-248` — Stage 枚举、ID 类型定义 — [显式])：

| 文件 | 职责 | 关键导出 |
|------|------|---------|
| `types.ts` | 核心类型定义 | `Stage`, `TERMINAL_STAGES`, `NextIdType`, `IdType`, `ExitCode` |
| `fs-utils.ts` | 文件系统工具 | `exists`, `readJson`, `writeJson` |
| `config-schema.ts` | 配置 Schema | `loadConfig` |
| `logger.ts` | 日志工具 | `logger` |
| `validators.ts` | 通用校验器 | `isStageState` |
| `skill-commands.ts` | Skill 命令映射 | `RUNTIME_COMMANDS` |

### 3.4 Config 层（配置与启动）

**职责**：提供启动配置与清单管理。

| 文件 | 职责 |
|------|------|
| `bootstrap-manifest.ts` | 启动清单配置 |
| `README.md` | 配置目录说明 |

---

## 4. 文件组织模式

### 4.1 命名约定

(`eslint.config.js` — 未使用变量规则 — [显式])：

| 类型 | 约定 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `id-generator.ts`, `gate-evaluator.ts` |
| 类型名 | PascalCase | `Stage`, `ExitCode`, `IdType` |
| 函数名 | camelCase | `evaluateGate`, `parseMatrix` |
| 常量 | UPPER_SNAKE_CASE | `TERMINAL_STAGES`, `PRIMARY_STAGE_SKILL` |
| 未使用变量 | `_` 前缀 | `_unused`, `_temp` |

### 4.2 模块系统约定

(`package.json:6` — `type: 'module'` — [显式])：

- **ESM only** — 全项目使用 ESM 模块系统
- **Named exports only** — Core 模块禁止使用 default export
- **类型集中定义** — 所有核心类型定义在 `src/shared/types.ts`

### 4.3 依赖规则

```
CLI 层 → Core 层 → Shared 层
  │         │         │
  │         │         └── 禁止导入 CLI 和 Core
  │         └── 禁止导入 CLI
  └── 可导入 Core 和 Shared
```

---

## 5. 关键入口点

### 5.1 构建入口

(`package.json:bin` — CLI 入口配置 — [显式])：

- **源码入口**：`src/cli/index.ts`
- **构建输出**：`dist/cli/index.js`
- **打包工具**：tsup（ESM 格式）

### 5.2 运行时入口

```bash
spec-first <command> [options]
```

**命令分发流程** (`src/cli/router.ts:79-95` — 命令解析与查找 — [显式])：

1. `src/cli/index.ts:103` — 调用 `dispatch()` 分发命令行参数
2. `src/cli/router.ts:79-95` — 解析命令名，查找已注册命令
3. `src/cli/router.ts:107-113` — 校验参数并检查确认策略
4. `src/cli/router.ts:115-121` — 执行命令处理器

---

## 6. Skill 目录结构

(`skills/spec-first/:1` — 20 个 Skill 目录 — [显式])：

```
skills/spec-first/
├── 00-first/       # 首次初始化 Skill（含 agents/ 和 references/）
├── 00-onboarding/  # 入职引导 Skill
├── 01-init/        # Feature 初始化 Skill
├── 02-catchup/     # 上下文恢复 Skill
├── 03-spec/        # 规范编写 Skill
├── 04-design/      # 设计编写 Skill
├── 05-research/    # 研究调研 Skill
├── 06-task/        # 任务规划 Skill
├── 07-code/        # 代码实现 Skill
├── 08-review/      # 代码评审 Skill
├── 10-archive/     # 归档 Skill
├── 11-plan/        # 计划制定 Skill
├── 12-verify/      # 验证 Skill
├── 13-orchestrate/ # 编排 Skill
├── 14-status/      # 状态查看 Skill
├── 15-doctor/      # 诊断修复 Skill
├── 16-sync/        # 同步 Skill
├── 17-feature/     # Feature 管理 Skill
├── 20-spec-review/ # 规范评审 Skill
└── 21-analyze/     # 分析 Skill
```

---

## 7. 模板系统

(`templates/:1` — 15 个模板文件 — [显式])：

```
templates/
├── ci/             # CI 配置模板（3 个）
│   ├── azure-pipelines.yml.hbs
│   ├── github-actions.yml.hbs
│   └── gitlab-ci.yml.hbs
├── gate/           # Gate 报告模板
├── init/           # 初始化模板（constitution, stage-state）
├── matrix/         # 追踪矩阵模板（.md, .yaml）
├── metrics/        # 指标报告模板
├── migrations/     # 迁移模板
├── release/        # 发布模板（release-note, smoke-test-report）
└── review/         # 评审模板
```

**渲染器**：`src/core/template/renderer.ts:renderTemplate()` (`src/core/template/renderer.ts` — 模板渲染器 — [显式])

---

## 8. 测试架构

(`tests/:1` — 测试目录结构 — [显式])：

| 目录 | 职责 | 文件数 |
|------|------|--------|
| `unit/` | 单元测试（每模块一文件） | 161 |
| `integration/` | 集成测试 | 12 |
| `e2e/` | 端到端测试 | 7 |
| `benchmark/` | 性能基准测试 | — |
| `fixtures/` | 测试固件数据 | — |
| `helpers/` | 测试辅助工具 | — |
| `skill-validation/` | Skill 校验测试 | — |

**覆盖率阈值** (`.spec-first/runtime/first/summary.json:test` — [显式])：
- Lines: 75%
- Functions: 75%
- Statements: 75%
- Branches: 65%

---

## 9. 发布产物

(`package.json:files` — 发布文件清单 — [显式])：

打包后的 npm 包包含：
- `dist/` — 构建输出
- `skills/` — Skill 定义
- `templates/` — Handlebars 模板
- `README.md`, `README-CN.md` — 文档
- `scripts/stage-viewer`, `scripts/codex` — 辅助脚本
