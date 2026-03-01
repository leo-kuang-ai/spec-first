---
last_updated: 2026-02-28
---

# spec-first 项目认知文档

> 本目录由 `spec-first:first` skill 自动生成，提供项目的快速认知材料。

## 文档索引

### 🚀 快速开始

| 文档 | 说明 | 预计阅读时间 |
|------|------|-------------|
| [技术栈摘要](./tech-stack.md) | 项目技术栈、构建工具、测试框架 | 3 分钟 |
| [本地环境搭建](./local-setup.md) | Node.js、pnpm、依赖安装 | 5 分钟 |

### 📖 项目理解

| 文档 | 说明 | 预计阅读时间 |
|------|------|-------------|
| [代码结构概览](./codebase-overview.md) | 目录结构、模块职责、数据流向 | 10 分钟 |
| [系统架构](./architecture.md) | 分层架构、状态机、核心概念 | 8 分钟 |
| [调用链分析](./call-graph.md) | 模块依赖矩阵、关键调用路径、Mermaid 图 | 15 分钟 |

### 📋 开发指南

| 文档 | 说明 | 预计阅读时间 |
|------|------|-------------|
| [研发规范](./development-guidelines.md) | 代码风格、提交规范、测试要求 | 5 分钟 |
| [API 文档](./api-docs.md) | CLI 命令列表与处理器映射 | 5 分钟 |
| [外部依赖](./external-deps.md) | 第三方服务与中间件引用 | 2 分钟 |

## 推荐阅读顺序

### 新成员入门

1. **技术栈摘要** → 了解项目技术栈
2. **本地环境搭建** → 搭建开发环境
3. **代码结构概览** → 理解项目结构
4. **系统架构** → 掌握核心设计
5. **研发规范** → 遵循团队规范

### 深入理解

1. **调用链分析** → 理解模块交互
2. **API 文档** → 熟悉 CLI 命令
3. **外部依赖** → 了解服务边界

## 关键概念速查

### 八阶段状态机

```
00_init → 01_specify → 02_design → 03_plan
  ↓                           ↓
09_cancelled              04_implement → 05_verify
                                 ↓
                        06_wrap_up → 07_release → 08_done
```

### 核心模块

| 模块 | 职责 |
|------|------|
| process-engine | 阶段状态机流转 |
| trace-engine | 追溯 ID 与覆盖率 |
| gate-engine | 质量门禁评估 |
| skill-runtime | Skill 分发执行 |
| ai-orchestrator | AI 自动循环 |

### 追溯 ID 类型

- **FR** - Functional Requirement 需求
- **DS** - Design Spec 设计规格
- **TASK** - 任务
- **TC** - Test Case 测试用例
- **RFC** - Request for Change 变更请求
- **DEFECT** - 缺陷

---

*生成时间: 2026-02-28 | 命令: `/spec-first:first` | 版本: v1.3.0*
