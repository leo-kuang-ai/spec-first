---
last_updated: 2026-03-06
mode: deep
project_type: backend
---

# Spec-First 项目文档索引

本目录包含 spec-first 项目的完整分析文档（deep 模式）。

## 新手必读

### 快速入门路径（预计 15-20 分钟）

**Step 1: 了解项目**（5 分钟）
→ 先读 `tech-stack.md` 了解技术栈
→ 再读 `domain-model.md` 了解业务核心概念

**Step 2: 理解结构**（5 分钟）
→ 读 `codebase-overview.md` 了解代码组织
→ 读 `architecture.md` 了解系统架构

**Step 3: 开始开发**（5 分钟）
→ 读 `local-setup.md` 搭建本地环境
→ 读 `development-guidelines.md` 了解开发规范
→ 参考 `codebase-overview.md` 的「开发入口」章节找到改动的文件

### 按角色推荐

| 角色 | 重点文档 |
|------|----------|
| 后端开发 | domain-model → api-docs → codebase-overview → architecture |
| CLI 工具开发 | tech-stack → codebase-overview → api-docs → development-guidelines |
| 架构师 | architecture → call-graph → domain-model → external-deps |
| 新手 | 按快速入门路径顺序 |

---

## 文档清单

### 核心文档（必读）

| 文档 | 说明 | 适合人群 |
|------|------|----------|
| [tech-stack.md](./tech-stack.md) | 技术栈摘要（Node.js, TypeScript, ESM） | 所有人 |
| [domain-model.md](./domain-model.md) | 业务领域模型（Feature 生命周期、追溯体系） | 所有人 |
| [codebase-overview.md](./codebase-overview.md) | 代码结构概览 + 开发入口 | 开发者 |
| [api-docs.md](./api-docs.md) | CLI 命令接口（19 个命令） | 使用者/开发者 |

### 架构与设计

| 文档 | 说明 | 适合人群 |
|------|------|----------|
| [architecture.md](./architecture.md) | 系统架构（分层架构、设计模式） | 架构师/开发者 |
| [call-graph.md](./call-graph.md) | 调用链分析（模块依赖、关键路径） | 架构师/开发者 |

### 开发指南

| 文档 | 说明 | 适合人群 |
|------|------|----------|
| [local-setup.md](./local-setup.md) | 本地环境搭建 | 新手 |
| [development-guidelines.md](./development-guidelines.md) | 研发规范（代码风格、测试要求） | 开发者 |
| [external-deps.md](./external-deps.md) | 外部依赖清单 | 开发者/运维 |

---

## 项目概览

**项目名称**: spec-first v0.5.45
**项目类型**: CLI 工具 / 后端服务
**核心理念**: Spec-First 全链路研发闭环（规范即契约、规范即真理）

### 核心特性

- **8 阶段状态机**: 从初始化到上线的完整生命周期管理
- **追溯体系**: FR/DS/TASK/TC/RFC 等多类型 ID 追溯
- **质量门禁**: 阶段流转前的自动化质量检查
- **Skill 系统**: 23 个可扩展的 AI 辅助技能
- **覆盖率矩阵**: C1-C9 九维度覆盖率追踪

### 技术亮点

- **ESM Only**: 全项目使用 ES Modules
- **TypeScript Strict**: 严格类型检查
- **测试驱动**: Vitest + 75% 覆盖率阈值
- **模板引擎**: Handlebars 动态产物生成

---

## 更新记录

- 2026-03-06: 升级到 deep 模式（从 quick 模式升级）
- 2026-03-05: 初始 quick 模式分析（4 个核心文档）
- 包含证据标注和交叉验证

---

## 反馈与贡献

如发现文档错误或需要补充，请提交 Issue 或 PR。
