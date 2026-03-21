# Spec-First 项目概览

> 版本 1.1.4 | AI-Workflow CLI for Spec-Driven Development

## 项目简介

**Spec-First** 是一款 AI 工作流 CLI 工具，专注于规范驱动开发（Spec-Driven Development）。它提供质量门禁（Quality Gates）、可追溯性（Traceability）和 Feature 生命周期管理，帮助团队从需求到交付实现全链路研发闭环。

### 核心价值

- **规范驱动** — 任何实现必须能追溯到对应规范定义（FR/DS/TASK）
- **质量门禁** — 19 条 Gate 条件（16 blocking + 3 warning）确保阶段交付质量
- **全链路追溯** — 14 类 ID 体系（FR/DS/TASK/TC/RFC 等）支持上下游追溯
- **状态机驱动** — 8 个活跃阶段 + 2 个终态，单向不可逆的生命周期管理

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- 包管理器：pnpm（推荐）/ npm / yarn

### 安装

```bash
npm install -g spec-first
# 或
pnpm add -g spec-first
```

### 常用命令

```bash
# Feature 管理
spec-first feature current                    # 查看当前 featureId
spec-first feature switch <featureId>         # 切换 Feature

# Gate 校验
spec-first gate check --feature <featureId>   # 执行 Gate 校验
spec-first gate check --feature <featureId> --stage 03_plan  # 指定阶段

# 追溯管理
spec-first matrix sync --feature <featureId>  # 同步追踪矩阵
spec-first id search <ID>                     # 追溯某 ID 的上下游
spec-first id generate FR --feature <featureId>  # 生成新 FR ID

# 变更管理
spec-first defect create --feature <featureId>   # 创建缺陷记录
spec-first rfc create --feature <featureId>      # 创建变更请求

# 阶段推进
spec-first stage advance --feature <featureId>   # 推进阶段（须先通过 Gate）

# 指标查看
spec-first metrics --feature <featureId>      # 查看 C3/C4/C6/C8/C9
```

## 核心特性

### 1. 阶段状态机（Stage Lifecycle）

单向不可逆的阶段流转：

```
00_init → 01_specify → 02_design → 03_plan → 04_implement
→ 05_verify → 06_wrap_up → 07_release → 08_done / 09_cancelled
```

### 2. 追溯 ID 体系（14 类）

- **业务链路**：FR → DS → TASK → TC → RFC
- **V-Model**：REQ → SYS → ARCH → MOD / ATP → STP → ITP → UTP
- **顶层**：Feature

### 3. 覆盖率指标（5 项）

| 指标 | 含义 |
|------|------|
| C3 | TASK 覆 FR（支持传递链） |
| C4 | TC 直接覆 FR（不支持传递） |
| C6 | TASK 已实现率 |
| C8 | TASK 有上游 FR |
| C9 | TC 有上游 FR |

### 4. 质量门禁（Gate Engine）

- 19 条条件（16 blocking + 3 warning）
- 支持豁免（Exception）机制
- 三态结果：PASS / PASS_WITH_WAIVER / FAIL

### 5. Skill 系统

20 个 Skill 覆盖完整研发流程，三层路由机制：

1. **Semantic Map** — 复合命令映射（如 `rfc approve` → `rfc transition approved`）
2. **Runtime Route** — Runtime 命令直接分发到 CLI
3. **Skill File** — 查找 SKILL.md 文件路径

## 技术栈

- **Runtime**：Node.js >= 20, ESM (`"type": "module"`)
- **Language**：TypeScript >= 5.4, strict mode, `verbatimModuleSyntax`
- **Bundler**：tsup
- **Test**：Vitest (globals enabled, v8 coverage, 75% threshold)
- **Lint**：ESLint + typescript-eslint + Prettier
- **Templates**：Handlebars
- **Config**：js-yaml

## 项目结构

```
spec-first/
├── src/
│   ├── cli/        # CLI 命令注册与路由（28 个命令）
│   ├── core/       # 核心引擎（14 个模块）
│   ├── shared/     # 共享类型与工具函数
│   └── config/     # 配置与启动
├── skills/         # Skill 定义（20 个 .md 文件）
├── templates/      # Handlebars 模板（15 个）
├── tests/          # 测试代码（单元/集成/端到端/基准）
├── specs/          # Feature 产物目录（运行时生成）
└── .spec-first/    # 项目级配置与运行时状态
```

## 核心模块

| 模块 | 职责 |
|------|------|
| process-engine | 阶段状态机，驱动 Feature 生命周期、ID 生成、目录初始化 |
| gate-engine | 质量门禁评估、豁免管理、PRD 评分 |
| trace-engine | 追溯 ID 生成/校验/搜索、覆盖率矩阵、Exception 机制 |
| skill-runtime | Skill 分发、prompt 组装、hard-gate 校验 |
| ai-orchestrator | Auto-loop、catchup 上下文恢复、context-pack |
| change-mgr | RFC + Defect 状态机、影响分析 |
| metrics-engine | 健康度评分、瓶颈检测 |
| validators | 产物格式校验（ID 格式、必需章节、追踪矩阵一致性） |

## 详细文档

- [项目摘要](./summary.md) — 执行摘要与技术栈概览
- [技术指南](./steering.md) — 技术约束、推荐工作流与最佳实践

## 关键约定

- **ESM only** — 全项目 `"type": "module"`
- **Named exports only** — core 模块禁止使用 default export
- **文件命名**：`kebab-case.ts`
- **类型集中**：`src/shared/types.ts`（Stage 枚举、ID 类型、ExitCode）
- **未使用变量**：`_` 前缀（eslint 规则 `^_`）

---

> 证据来源：`.spec-first/runtime/first/summary.json`、`package.json`、`CLAUDE.md`
