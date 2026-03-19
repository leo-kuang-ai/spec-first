# 入门指南

## 前置条件

- Node.js ≥20.0.0
- pnpm（推荐）或 npm

## 安装

```bash
# 全局安装（推荐）
npm install -g spec-first

# 或使用 pnpm
pnpm add -g spec-first
```

## 快速开始

### 1. 初始化 Feature

```bash
spec-first init --feat MYFEAT --title "我的功能"
```

### 2. 查看状态

```bash
spec-first status
```

### 3. 执行 Skill

在 Claude Code 中执行：

```
/spec-first:code
```

## 常用命令

### 构建与测试

| 命令 | 说明 |
|------|------|
| `pnpm run build` | 构建项目（tsup 打包） |
| `pnpm test` | 运行测试（vitest run） |
| `pnpm run test:watch` | 监听模式测试 |
| `pnpm run test:coverage` | 运行覆盖率测试 |
| `pnpm run typecheck` | 类型检查 |
| `pnpm run lint` | 代码检查 |
| `pnpm run lint:fix` | 自动修复 lint 问题 |
| `pnpm run format` | 代码格式化 |

### Spec-First CLI 命令

| 命令 | 说明 |
|------|------|
| `spec-first init` | 初始化 Feature 工作区 |
| `spec-first feature current` | 查看当前 Feature |
| `spec-first feature switch <id>` | 切换 Feature |
| `spec-first stage current` | 查看当前阶段 |
| `spec-first stage advance` | 推进阶段 |
| `spec-first gate check` | 执行 Gate 校验 |
| `spec-first matrix sync` | 同步追踪矩阵 |
| `spec-first metrics` | 查看覆盖率指标 |
| `spec-first id generate FR` | 生成追溯 ID |
| `spec-first status` | 状态概览 |
| `spec-first doctor` | 环境诊断 |

## 项目结构

### 核心目录

| 目录 | 用途 |
|------|------|
| `src/cli/` | CLI 命令注册与路由（27 个命令） |
| `src/core/` | 核心引擎（14 个模块） |
| `src/shared/` | 共享类型与工具函数 |
| `skills/` | Skill 定义（.md 文件） |
| `templates/` | Handlebars 模板 |
| `tests/` | 测试目录 |
| `specs/` | Feature 产物目录 |

### 重要文件

| 文件 | 用途 |
|------|------|
| `src/cli/index.ts` | CLI 入口 |
| `src/shared/types.ts` | 核心类型定义 |
| `specs/.feat-registry.md` | FEAT 缩写注册表 |
| `.spec-first/current` | 当前 Feature ID |

## 开发工作流

### 功能开发流程

1. **初始化** — `spec-first init --feat XXX --title "..."`
2. **需求规格** — `/spec-first:spec`
3. **技术设计** — `/spec-first:design`
4. **任务拆解** — `/spec-first:task`
5. **代码实现** — `/spec-first:code`
6. **验收测试** — `/spec-first:verify`

### 代码自检清单

每次 `src/` 下 `.ts` 文件变更后执行：

```bash
pnpm run typecheck
pnpm test
```

## 调试

### 测试调试

```bash
# 监听模式
pnpm run test:watch

# 运行单个测试文件
npx vitest run tests/unit/router.test.ts

# 按名称匹配
npx vitest run -t "StageMachine"
```

### 环境诊断

```bash
spec-first doctor
```

## 证据来源

- 包配置 (`package.json:10-25`) — scripts 定义 — 显式
- CLI 入口 (`src/cli/index.ts:36-101`) — 命令注册 — 显式
- 目录结构分析 — 显式
