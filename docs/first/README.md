# Spec-First 项目认知文档

> 自动生成于 2026-03-19 | 版本 1.1.4

## 项目简介

**Spec-First** 是一个 AI 工作流 CLI 工具，为 AI 时代的团队提供规范驱动的开发体验。

核心能力：
- **质量门禁（Quality Gates）** — 19 条规则保障阶段质量
- **全链路追溯（Traceability）** — 14 类 ID 支持从需求到代码的完整追溯
- **Feature 生命周期管理** — 8 个阶段状态机驱动

## 快速开始

```bash
# 安装
npm install -g spec-first

# 初始化 Feature
spec-first init --feat MYFEAT --title "我的功能"

# 查看状态
spec-first status

# 执行 Skill
/spec-first:code
```

## 文档索引

| 文档 | 说明 |
|------|------|
| [summary.md](./summary.md) | 项目概览 |
| [steering.md](./steering.md) | 技术栈与约束 |
| [conventions.md](./conventions.md) | 代码规范 |
| [entry-guide.md](./entry-guide.md) | 入门指南 |
| [critical-flows.md](./critical-flows.md) | 关键流程 |
| [api-docs.md](./api-docs.md) | CLI 命令参考 |
| [codebase-overview.md](./codebase-overview.md) | 代码结构 |
| [domain-model.md](./domain-model.md) | 领域模型 |
| [architecture.md](./architecture.md) | 架构设计 |
| [development-guidelines.md](./development-guidelines.md) | 开发指南 |

## 技术栈

- **Runtime**: Node.js ≥20, ESM
- **Language**: TypeScript 5.4+, strict mode
- **Build**: tsup
- **Test**: Vitest (75% coverage threshold)
- **Lint**: ESLint + typescript-eslint
- **Format**: Prettier

## 核心模块

| 模块 | 职责 |
|------|------|
| process-engine | 阶段状态机 |
| skill-runtime | Skill 分发与执行 |
| gate-engine | 质量门禁评估 |
| trace-engine | 追溯 ID 与覆盖率 |
| change-mgr | RFC + Defect 管理 |

## 更多信息

- [GitHub Repository](https://github.com/sunrain520/spec-first)
- [NPM Package](https://www.npmjs.com/package/spec-first)
