---
last_updated: 2026-03-03
mode: deep
project_type: backend
---

# Spec-First 项目文档导航

> **First Skill** 自动生成的项目认知文档索引
>
> 生成时间: 2026-03-03 | 模式: deep | 项目类型: backend

---

## 📚 文档清单

### 核心文档（quick 模式）

| 文档 | 说明 | 关键内容 |
|------|------|----------|
| [tech-stack.md](./tech-stack.md) | 技术栈摘要 | TypeScript 5.4+, Node.js ≥20, ESM, tsup, Vitest |
| [codebase-overview.md](./codebase-overview.md) | 代码结构概览 | 107 个 TS 文件, 19 个 CLI 命令, 10 个核心引擎 |
| [domain-model.md](./domain-model.md) | 业务领域模型 | 9 个核心概念, 6 个流程图, 23 条业务规则 |
| [api-docs.md](./api-docs.md) | CLI 命令文档 | 19 个命令, 按功能分类, 参数/选项/示例 |

### 扩展文档（deep 模式）

| 文档 | 说明 | 关键内容 |
|------|------|----------|
| [architecture.md](./architecture.md) | 系统架构图 | 四层架构, 10 个 Mermaid 图, 模块依赖关系 |
| [call-graph.md](./call-graph.md) | 模块调用链分析 | 依赖矩阵, 6 个调用路径图, 高频路径 |
| [external-deps.md](./external-deps.md) | 外部依赖分析 | 4 生产 + 11 开发依赖, 安全性/许可证分析 |
| [local-setup.md](./local-setup.md) | 本地环境搭建 | 环境要求, 安装步骤, 常见问题排查 |
| [development-guidelines.md](./development-guidelines.md) | 研发规范 | 代码风格, 提交规范, 测试要求, TypeScript 规范 |

---

## 🗺️ 快速导航

### 我想了解...

| 需求 | 推荐文档 | 章节 |
|------|----------|------|
| **项目整体概况** | [codebase-overview.md](./codebase-overview.md) | 项目目录结构、核心模块概览 |
| **技术栈选型** | [tech-stack.md](./tech-stack.md) | 核心技术栈、依赖清单 |
| **业务逻辑** | [domain-model.md](./domain-model.md) | 核心业务概念、业务流程图 |
| **CLI 命令用法** | [api-docs.md](./api-docs.md) | 命令清单、参数说明 |
| **系统架构** | [architecture.md](./architecture.md) | 分层架构、模块交互 |
| **模块依赖关系** | [call-graph.md](./call-graph.md) | 依赖矩阵、调用路径 |
| **外部依赖** | [external-deps.md](./external-deps.md) | 依赖清单、安全性分析 |
| **本地开发环境** | [local-setup.md](./local-setup.md) | 环境搭建、常见问题 |
| **代码规范** | [development-guidelines.md](./development-guidelines.md) | 代码风格、提交规范 |

---

## 📊 项目关键指标

| 指标 | 数值 | 来源 |
|------|------|------|
| TypeScript 源文件 | 107 个 | [codebase-overview.md](./codebase-overview.md) |
| CLI 命令 | 19 个 | [api-docs.md](./api-docs.md) |
| 核心引擎模块 | 10 个 | [architecture.md](./architecture.md) |
| Skill 模块 | 22 个 | [codebase-overview.md](./codebase-overview.md) |
| 单元测试 | 77 个 | [codebase-overview.md](./codebase-overview.md) |
| 生产依赖 | 4 个 | [external-deps.md](./external-deps.md) |
| 开发依赖 | 11 个 | [external-deps.md](./external-deps.md) |
| 业务概念 | 9 个 | [domain-model.md](./domain-model.md) |
| 业务规则 | 23 条 | [domain-model.md](./domain-model.md) |

---

## 🏗️ 架构速览

```
┌─────────────────────────────────────────────────────────────┐
│                      CLI Layer (19 命令)                      │
│  init / stage / feature / id / matrix / rfc / defect / ...  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Core Engine Layer                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │Process Engine│ │Skill Runtime │ │ Gate Engine  │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │Trace Engine  │ │Change Manager│ │Metrics Engine│        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Tool Integration Layer                      │
│  AI Orchestrator │ Template Renderer │ Tool Integration     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  Shared Types │ FS Utils │ Config Schema │ Logger          │
└─────────────────────────────────────────────────────────────┘
```

详见: [architecture.md](./architecture.md)

---

## 🔧 快速开始

### 环境要求

- Node.js ≥20.0.0
- pnpm（推荐）或 npm
- Git

### 安装步骤

```bash
# 克隆仓库
git clone <repository-url>
cd spec-first

# 安装依赖
pnpm install

# 构建
pnpm run build

# 运行测试
pnpm test

# 本地测试 CLI
node dist/cli/index.js --help
```

详见: [local-setup.md](./local-setup.md)

---

## 📝 核心概念

| 概念 | 说明 | 详见 |
|------|------|------|
| **Feature** | 研发流程核心交付单元 | [domain-model.md](./domain-model.md) |
| **Stage** | 10 阶段状态机（8 活动 + 2 终态） | [domain-model.md](./domain-model.md) |
| **Gate** | 质量门禁评估（PASS/PASS_WITH_WAIVER/FAIL） | [domain-model.md](./domain-model.md) |
| **RFC** | 需求变更请求（4 态状态机） | [domain-model.md](./domain-model.md) |
| **Defect** | 缺陷管理（5 态状态机） | [domain-model.md](./domain-model.md) |
| **追溯矩阵** | V-Model 追溯关系 | [domain-model.md](./domain-model.md) |
| **覆盖率指标** | C1-C9 九项指标 | [domain-model.md](./domain-model.md) |
| **AI 编排** | Auto-Loop 自动执行引擎 | [domain-model.md](./domain-model.md) |

---

## 🔍 依赖关系

### 生产依赖（4 个）

| 依赖 | 版本 | 用途 |
|------|------|------|
| handlebars | ^4.7.8 | 模板引擎 |
| js-yaml | ^4.1.0 | YAML 解析 |
| semver | ^7.7.4 | 语义版本管理 |
| update-notifier | ^7.0.0 | 版本更新通知 |

详见: [external-deps.md](./external-deps.md)

---

## 📋 研发规范

### 代码风格

- **Linter**: ESLint 10.0.2 + typescript-eslint
- **Formatter**: Prettier 3.8.1
- **TypeScript**: 严格模式 + verbatimModuleSyntax

### 提交规范

- CHANGELOG.md 强制更新
- 规范文档同步提交

### 测试要求

- 覆盖率阈值: lines/functions/statements 75%, branches 65%
- 测试框架: Vitest

详见: [development-guidelines.md](./development-guidelines.md)

---

## 🛠️ 常用命令

```bash
# 构建
pnpm run build          # tsup 打包
pnpm run typecheck      # TypeScript 类型检查

# 测试
pnpm test               # 运行测试
pnpm run test:watch     # 测试监听模式
pnpm run test:coverage  # 测试覆盖率

# 代码质量
pnpm run lint           # ESLint 检查
pnpm run lint:fix       # ESLint 自动修复
pnpm run format         # Prettier 格式化

# CLI 命令
spec-first init         # 初始化项目
spec-first stage        # 阶段管理
spec-first feature      # Feature 管理
spec-first ai           # AI 编排
spec-first doctor       # 环境诊断
```

详见: [api-docs.md](./api-docs.md)

---

## 📖 相关链接

- [项目 README](../../README.md)
- [CHANGELOG](../../CHANGELOG.md)
- [CLAUDE.md](../../CLAUDE.md) - 项目规范文档

---

## 📌 文档生成信息

- **生成工具**: First Skill (spec-first:first)
- **生成模式**: deep
- **生成时间**: 2026-03-03
- **文档版本**: 1.0.0

如需更新文档，请运行：
```bash
spec-first:first --deep --force
```
