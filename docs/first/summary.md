# Spec-First 项目摘要

> 基于 `.spec-first/runtime/first/summary.json` 生成

---

## 项目元信息

| 属性 | 值 |
|------|-----|
| 项目名称 | spec-first |
| 版本 | 1.2.3 |
| 平台类型 | CLI Tool |
| 描述 | AI-workflow CLI for spec-driven development — quality gates, traceability, and feature lifecycle management for AI-era teams |

**证据**: `package.json:1-102`

---

## 技术栈

### 主技术栈

| 属性 | 值 | 版本 |
|------|-----|------|
| 运行时 | Node.js | >= 20.0.0 |
| 语言 | TypeScript | >= 5.4.0 |
| 模块系统 | ESM | `"type": "module"` |
| 构建工具 | tsup | ^8.5.1 |
| 测试框架 | Vitest | ^1.6.1 |
| 覆盖率 | @vitest/coverage-v8 | - |

**证据**: `package.json:31-33,75-101`, `tsconfig.json:1-22`

### 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| handlebars | ^4.7.8 | 模板引擎 |
| js-yaml | ^4.1.0 | YAML 解析 |
| semver | ^7.7.4 | 版本管理 |
| update-notifier | ^7.0.0 | 版本更新通知 |
| eslint | ^10.0.2 | 代码检查 |
| prettier | ^3.8.1 | 代码格式化 |
| typescript-eslint | ^8.56.1 | TS ESLint 规则 |

**证据**: `package.json:75-101`

### TypeScript 配置

| 属性 | 值 |
|------|-----|
| target | ES2022 |
| module | ESNext |
| strict | true |
| verbatimModuleSyntax | true |
| moduleResolution | bundler |

**证据**: `tsconfig.json:1-22`

---

## 架构层次

```
+------------------------------------------------------------------+
|                          CLI Layer                                |
|  入口: src/cli/index.ts                                           |
|  路由: src/cli/router.ts                                          |
|  命令: src/cli/commands/* (27 个命令处理器)                         |
+------------------------------------------------------------------+
                               |
                               v
+------------------------------------------------------------------+
|                          Core Layer                               |
|  14 个核心模块，提供确定性原子能力                                   |
|                                                                   |
|  ┌─────────────────────────────────────────────────────────────┐  |
|  │  process-engine  │  skill-runtime  │  gate-engine           │  |
|  │  trace-engine    │  ai-orchestrator│  change-mgr            │  |
|  │  template        │  validators     │  task-plan             │  |
|  │  metrics-engine  │  tool-integration│ rules                 │  |
|  │  batch-executor  │  migrations     │  host-adapters         │  |
|  └─────────────────────────────────────────────────────────────┘  |
+------------------------------------------------------------------+
                               |
                               v
+------------------------------------------------------------------+
|                         Shared Layer                              |
|  src/shared/types.ts (Stage, ExitCode, FeatureState, etc.)        |
|  src/shared/host-paths.ts, src/shared/fs-utils.ts, etc.           |
+------------------------------------------------------------------+
```

**证据**: `src/cli/index.ts:1-22`, `src/core/`, `src/shared/types.ts`

---

## 核心模块清单

| 模块 | 路径 | 职责 | 关键导出 |
|------|------|------|---------|
| process-engine | `src/core/process-engine/` | 阶段状态机，驱动 Feature 生命周期 | `TRANSITIONS`, `getNextStages`, `advance` |
| skill-runtime | `src/core/skill-runtime/` | Skill 分发、prompt 组装、hard-gate 校验 | `dispatchCommand`, `SEMANTIC_MAP`, `loadSkill` |
| gate-engine | `src/core/gate-engine/` | Gate 条件评估（19 条规则）、SCA 校验 | `evaluateGate`, `getConditions` |
| trace-engine | `src/core/trace-engine/` | ID 注册/校验/搜索、覆盖率矩阵 | `nextId`, `searchId`, `validateAbbr` |
| ai-orchestrator | `src/core/ai-orchestrator/` | Context Pack 生成、Catchup | `buildContextPack`, `catchup`, `runAutoLoop` |
| change-mgr | `src/core/change-mgr/` | RFC + Defect 状态机、影响分析 | `createRfc`, `transitionDefect` |
| template | `src/core/template/` | Handlebars 模板渲染 | `renderTemplate`, `findTemplatePath` |
| validators | `src/core/validators/` | 产物格式校验 | `validateFormat`, `validateRequiredFields` |
| task-plan | `src/core/task-plan/` | task_plan.md 解析 | `parseTaskPlanContent`, `toTaskNodes` |
| metrics-engine | `src/core/metrics-engine/` | 健康度评分、瓶颈检测 | `calcHealthScore`, `detectBottleneck` |
| rules | `src/core/rules/` | 静态规则定义（真理源） | `RELEASE_REQUIRED_ARTIFACTS` |
| tool-integration | `src/core/tool-integration/` | AI runtime hooks | `installHooks`, `syncAgentContextFromDesign` |
| batch-executor | `src/core/batch-executor/` | 批量任务执行 | `executeManifest`, `executeStep` |
| migrations | `src/core/migrations/` | 状态文件版本迁移 | `executeManifest`, `deepMerge` |

**证据**: `src/core/process-engine/stage-machine.ts:1-100`, `src/core/skill-runtime/dispatcher.ts:1-200`, `src/core/gate-engine/gate-evaluator.ts:1-100`

---

## CLI 命令清单（27 个）

| 类别 | 命令 |
|------|------|
| **核心流程** | `init`, `stage`, `gate`, `feature`, `done`, `transition` |
| **追溯管理** | `trace`, `id`, `defect`, `rfc` |
| **AI 调度** | `skill`, `ai`, `orchestrate`, `first` |
| **文档管理** | `docs-links`, `viewer` |
| **指标分析** | `metrics`, `analyze`, `status`, `doctor` |
| **工具集成** | `hooks`, `commit`, `update`, `setup`, `uninstall`, `validate`, `onboarding`, `batch-test` |

**证据**: `src/cli/index.ts:1-97`, `src/cli/router.ts:1-157`

---

## Skill 清单（20 个）

| Skill | 阶段 | 说明 |
|-------|------|------|
| 00-first | any | 项目快速认知 |
| 01-init | 00_init | 初始化 Feature 工作区 |
| 02-catchup | any | 会话恢复与上下文摘要 |
| 03-spec | 01_specify | 定义需求规格 |
| 04-design | 02_design | 技术设计 |
| 05-research | 02_design | 技术调研 |
| 06-task | 03_plan | 任务拆解 |
| 07-code | 04_implement | 代码实现 |
| 08-review | 04_implement | 代码审查 |
| 10-archive | 06_wrap_up | 归档复盘 |
| 11-plan | any | 生成阶段执行计划 |
| 12-verify | 05_verify | 阶段验收校验 |
| 13-orchestrate | any | 编排调度器 |
| 14-status | any | 状态概览 |
| 15-doctor | any | 环境诊断 |
| 16-sync | any | 同步文档关联 |
| 17-feature | any | Feature 管理 |
| 20-spec-review | 01_specify | 需求规格审查 |
| 21-analyze | any | 跨产物一致性分析 |
| focus-requirements | any | 需求聚焦 |

**证据**: `skills/README.md:1-155`

---

## 领域模型摘要

### 核心实体

| 实体 | 类型 | 说明 |
|------|------|------|
| Feature | Aggregate Root | 顶层业务单元，代表一个可追溯的研发闭环 |
| Stage | Enum | Feature 生命周期阶段枚举（8 active + 2 terminal） |
| Gate | Service | 阶段质量门禁评估引擎 |
| FR/DS/TASK/TC | Entity | 业务链路追溯 ID |
| RFC/Defect | Entity | 变更管理实体 |
| Skill | Service | AI 代理执行单元 |

### 状态机

| 状态机 | 状态数 | 说明 |
|--------|--------|------|
| Stage State Machine | 10 (8+2) | Feature 生命周期，单向不可逆 |
| RFC State Machine | 4 | 变更请求（draft → approved → closed/rejected） |
| Defect State Machine | 5 | 缺陷（open → fixing → fixed → verified/wontfix） |

**证据**: `src/shared/types.ts:9-84`, `src/core/process-engine/stage-machine.ts:8-17`

---

## 证据路径汇总

| 来源 | 路径 |
|------|------|
| 项目配置 | `package.json:1-102`, `tsconfig.json:1-22` |
| CLI 入口 | `src/cli/index.ts:1-97`, `src/cli/router.ts:1-157` |
| 核心模块 | `src/core/process-engine/stage-machine.ts:1-100` |
| | `src/core/skill-runtime/dispatcher.ts:1-200` |
| | `src/core/gate-engine/gate-evaluator.ts:1-100` |
| | `src/core/trace-engine/id-generator.ts:1-150` |
| | `src/core/ai-orchestrator/context-pack.ts:1-150` |
| | `src/core/change-mgr/rfc-machine.ts:1-80` |
| | `src/core/template/renderer.ts:1-80` |
| | `src/core/metrics-engine/health-score.ts:1-80` |
| | `src/core/rules/truth-source.ts:1-100` |
| 类型定义 | `src/shared/types.ts` |
| Skill 定义 | `skills/README.md:1-155` |
| 开发规范 | `CLAUDE.md` |

---

## 检测到的差距

当前无检测到的差距。所有核心模块、CLI 命令、Skill 定义均已确认。

---

## 相关文档

- **[README.md](./README.md)** — 项目认知总览（Onboarding 指南）
- **[steering.md](./steering.md)** — 技术方向指引
- **[domain-model.md](./domain-model.md)** — 领域模型详解
- **[structure-overview.md](./codebase-overview.md)** — 代码结构概览
- **[critical-flows.md](./critical-flows.md)** — 关键流程
