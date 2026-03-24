# 入口指南

> 基于 `.spec-first/runtime/first/entry-guide.json` 生成

## 快速上手

### 1. 环境初始化

```bash
npm install
npm run build
npm run typecheck
npm test
```

### 2. 验证安装

```bash
spec-first feature current
```

## 核心模块入口

### 目录结构概览

```
src/
  cli/        # CLI 命令注册与路由（27 个命令）
  core/       # 核心引擎（14 个模块）
  shared/     # 共享类型（types.ts）、工具函数
specs/        # Feature 产物目录（状态文件由 CLI 管理）
skills/       # Skill 定义（.md 文件，20 个）
templates/    # Handlebars 模板
.spec-first/  # 项目级配置与运行时状态
```

### 核心引擎模块 (`src/core/`)

| 模块 | 职责 |
|------|------|
| `process-engine/` | 阶段状态机，驱动 Feature 生命周期 |
| `skill-runtime/` | Skill 分发、prompt 组装、hard-gate 校验 |
| `gate-engine/` | 阶段质量门禁评估（19条规则） |
| `trace-engine/` | 追溯 ID 生成/校验/搜索、覆盖率矩阵 |
| `ai-orchestrator/` | Auto-loop、catchup 上下文恢复 |

### 其他重要入口

| 路径 | 描述 |
|------|------|
| `src/cli/` | CLI 命令注册与路由（27 个命令） |
| `src/shared/` | 共享类型（types.ts）、工具函数 |
| `skills/` | Skill 定义（.md 文件，20 个） |
| `templates/` | Handlebars 模板 |
| `specs/` | Feature 产物目录 |
| `.spec-first/` | 项目级配置与运行时状态 |

## 推荐阅读顺序

### 新手入门

1. **`CLAUDE.md`** - 项目规范与工作流程（必读）
2. **`src/shared/types.ts`** - 核心类型定义（Stage、ExitCode、ID types）
3. **`package.json`** - 依赖与脚本配置

### 深入理解

4. **`src/core/process-engine/`** - 理解阶段状态机
5. **`src/core/trace-engine/`** - 理解追溯 ID 体系
6. **`src/core/gate-engine/`** - 理解质量门禁

### 实践参考

7. **`skills/`** - Skill 定义与用法
8. **`templates/`** - 模板结构

## 常用 Spec-First CLI 命令速查

```bash
# Feature 管理
spec-first feature current                          # 查看当前 featureId
spec-first feature switch <featureId>               # 切换 Feature

# Gate 与阶段
spec-first gate check --feature <featureId>         # 执行 Gate 校验
spec-first stage advance --feature <featureId>      # 推进阶段

# 文档与追溯
spec-first docs links validate --feature <featureId> # 校验文档关联
spec-first metrics --feature <featureId>            # 查看覆盖率指标
spec-first id search <ID>                           # 追溯 ID 上下游
spec-first id generate <TYPE> --feature <featureId> # 生成新 ID
```
