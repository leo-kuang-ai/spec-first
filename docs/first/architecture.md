---
mode: deep
generated_at: 2026-03-09T20:06:12.462Z
---

# 架构设计

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      CLI Layer                          │
│                   (src/cli/)                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Core Modules                          │
├─────────────────────────────────────────────────────────┤
│  Process Engine  │  Skill Runtime  │  AI Orchestrator  │
│  Gate Engine     │  Trace Engine   │  Change Manager   │
│  Template        │  Tool Integration│ Metrics Engine   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Shared Layer                          │
│              (Types, Config, Utils)                     │
└─────────────────────────────────────────────────────────┘
```

## 模块边界

### 命令层 (CLI)
- 命令注册与路由
- 参数解析
- 用户交互

### 核心引擎层
- **Process Engine**: 状态机驱动
- **Skill Runtime**: Skill 分发与执行
- **AI Orchestrator**: AI 自动化编排
- **Gate Engine**: 质量门禁
- **Trace Engine**: 追溯管理
- **Change Manager**: 变更管理

### 支撑层
- **Template**: 模板渲染
- **Tool Integration**: 工具集成
- **Metrics Engine**: 度量分析

### 基础层
- **Shared**: 类型定义
- **Config**: 配置管理

## 技术约束

- **平台类型**: CLI Tool
- **模块系统**: ESM Only
- **命名规范**: kebab-case
- **导出规范**: Named exports only
