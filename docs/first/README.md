---
mode: deep
generated_at: 2026-03-09T20:06:12.462Z
version: 2.1.0
---

# Spec-First 项目认知文档

> 快速认知文档 - 基于 deep 模式生成

> `docs/first/` 是面向人的长期维护投影视图；运行时真源位于 `.spec-first/runtime/first/`。

## 📋 文档导航

### 核心文档（Quick 模式）
- [技术栈摘要](./tech-stack.md) - 运行时、语言、工具链
- [API 接口规范](./api-docs.md) - CLI 命令接口
- [代码结构概览](./codebase-overview.md) - 模块划分与职责
- [业务领域模型](./domain-model.md) - 核心实体与能力

### 深度分析文档（Deep 模式）
- [调用链分析](./call-graph.md) - 关键路径与依赖关系
- [架构设计](./architecture.md) - 系统架构与模块边界
- [外部依赖](./external-deps.md) - 第三方依赖分析
- [本地环境搭建](./local-setup.md) - 开发环境配置
- [研发规范](./development-guidelines.md) - 代码规范与工作流

### 视图文档
- [项目摘要](./summary.md) - 项目概览
- [角色视图](./role-views.md) - 产品/开发/QA/架构师视角
- [阶段视图](./stage-views.md) - 需求/设计/代码/验证视角

## 🎯 项目概览

**项目名称**: spec-first
**平台类型**: CLI 工具
**核心定位**: Specification-driven development process engine

### 核心能力
- Feature lifecycle management
- Stage state machine
- Traceability matrix
- Quality gates
- RFC and defect tracking

### 技术栈
- Runtime: Node.js ≥20.0.0
- Language: TypeScript 5.4+
- Module System: ESM
- Bundler: tsup
- Test Framework: Vitest

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm test

# 类型检查
npm run typecheck
```

## 📦 核心模块

| 模块 | 职责 |
|------|------|
| cli | CLI 命令层，命令注册、路由分发 |
| process-engine | 阶段状态机，Feature 生命周期流转 |
| skill-runtime | Skill 分发、prompt 组装 |
| ai-orchestrator | AI 自动循环、上下文恢复 |
| gate-engine | 质量门禁评估、安全扫描 |
| trace-engine | 追溯 ID 生成/校验/搜索 |

完整模块列表见 [代码结构概览](./codebase-overview.md)。

---

*最后更新: 2026-03-09*
