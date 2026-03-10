---
mode: deep
generated_at: 2026-03-09T20:06:12.462Z
---

# API 接口规范

## CLI 命令接口

### 核心命令

#### `spec-first init`
初始化 Feature 工作区

#### `spec-first stage`
阶段状态机操作

#### `spec-first id`
追溯 ID 生成与管理

#### `spec-first matrix`
追溯矩阵查询

#### `spec-first rfc`
RFC 变更管理

#### `spec-first defect`
缺陷跟踪管理

#### `spec-first gate`
质量门禁评估

## 命令路由架构

- **入口**: `src/cli/index.ts`
- **路由器**: `src/cli/router.ts`
- **注册模式**: `registerCommand(name, desc, handler)`
- **命令总数**: 19 个命令

## Skill 分发流程（三层路由）

1. **Semantic Map** - 复合命令映射
2. **Runtime Route** - 直接 CLI 命令分发
3. **Skill Route** - Skill 文件搜索与加载
