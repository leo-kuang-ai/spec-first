---
last_updated: 2026-03-16
mode: quick
project: spec-first
generated_at: 2026-03-16T04:35:00.000Z
---

# Spec-First 项目认知文档

> `docs/first/` 是 `.spec-first/runtime/first/` 的人类可读投影视图层。
> 本文档由 `spec-first:first` 自动生成（quick 模式）

## 📋 文档索引

### 核心认知文档（quick 模式）

| 文档 | 说明 | 用途 |
|------|------|------|
| [tech-stack.md](./tech-stack.md) | 技术栈摘要 | 了解项目使用的技术和依赖 |
| [api-docs.md](./api-docs.md) | CLI 命令接口规范 | 查看所有可用命令及参数 |
| [codebase-overview.md](./codebase-overview.md) | 代码结构概览 | 快速定位代码位置 |
| [domain-model.md](./domain-model.md) | 领域模型 | 理解核心业务概念和状态机 |

### 辅助文档

| 文档 | 说明 |
|------|------|
| [change-map.md](./change-map.md) | 变更地图 |
| [common-playbooks.md](./common-playbooks.md) | 常用操作手册 |
| [conventions.md](./conventions.md) | 编码约定 |
| [critical-flows.md](./critical-flows.md) | 关键流程 |
| [entry-guide.md](./entry-guide.md) | 入口指南 |
| [known-risks-and-traps.md](./known-risks-and-traps.md) | 已知风险与陷阱 |
| [reboot-guide.md](./reboot-guide.md) | 恢复指南 |
| [role-views.md](./role-views.md) | 角色视图 |
| [stage-views.md](./stage-views.md) | 阶段视图 |
| [steering.md](./steering.md) | 方向指引 |
| [summary.md](./summary.md) | 摘要 |

## 🚀 快速开始

### 项目简介

**spec-first** — AI-workflow CLI for spec-driven development

一个面向 AI 辅助开发团队的 CLI 工具，提供：
- **质量门禁** — 19 条 Gate 规则确保阶段交付质量
- **可追溯性** — 14 类 ID 实现 FR→TC 的全链路追溯
- **Feature 生命周期** — 8 活跃阶段 + 2 终态的状态机驱动

### 核心命令

```bash
# 查看 Feature 状态
spec-first feature current

# 执行 Gate 检查
spec-first gate check --feature <featureId>

# 推进阶段
spec-first stage advance --feature <featureId>

# 生成追溯 ID
spec-first id next FR <abbr> --feature <featureId>
```

### 开发入口

| 任务 | 位置 |
|------|------|
| 新增 CLI 命令 | `src/cli/commands/` |
| 修改核心逻辑 | `src/core/` |
| 修改 Skill 定义 | `skills/` |
| 修改模板 | `templates/` |

## 📊 项目概览

- **语言**: TypeScript (ESM)
- **运行时**: Node.js ≥20
- **测试框架**: Vitest
- **覆盖率阈值**: 75% (lines/functions/statements), 65% (branches)

## 🗂️ Runtime 真源

- `.spec-first/runtime/first/index.json` — 索引文件
- `.spec-first/runtime/first/summary.json` — 摘要
- `.spec-first/runtime/first/role-views.json` — 角色视图
- `.spec-first/runtime/first/stage-views.json` — 阶段视图

## 🔗 相关链接

- [GitHub Repository](https://github.com/sunrain520/spec-first)
- [NPM Package](https://www.npmjs.com/package/spec-first)

---

*生成时间: 2026-03-16 | 模式: quick*
