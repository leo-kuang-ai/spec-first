---
last_updated: 2026-03-03
mode: deep
project_type: backend
---

# spec-first 本地环境搭建

> 本文档由 `spec-first:first` skill 自动生成，列出项目运行所需的环境信息和搭建步骤。

## 环境要求

### 必需软件

| 软件 | 版本要求 | 说明 | 证据 |
|------|----------|------|------|
| **Node.js** | ≥20.0.0 | 运行时环境 | `package.json:26-28` — `"engines": {"node": ">=20.0.0"}` — `[显式]` |
| **pnpm** | 最新版 | 包管理器（推荐） | `package.json:72-77` — `pnpm.overrides` 配置 — `[显式]` |
| **git** | 任意版本 | 版本控制（可选） | 项目根存在 `.git/` — `[显式]` |

### 硬件要求

- **内存**: ≥4GB（推荐 8GB）
- **磁盘**: ≥500MB 可用空间

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/anthropics/spec-first.git
cd spec-first

# 2. 安装依赖
pnpm install

# 3. 构建
pnpm run build

# 4. 运行测试
pnpm test

# 5. 验证安装
npx spec-first --help
```

## 详细安装步骤

### 1. 安装 Node.js

确保 Node.js 版本 ≥ 20.0.0：

```bash
node --version  # 应显示 v20.x.x 或更高
```

如果版本不符合，请从 [nodejs.org](https://nodejs.org/) 下载安装。

**证据**: `package.json:26-28` — `"engines": {"node": ">=20.0.0"}` — `[显式]`

### 2. 安装 pnpm（推荐）

```bash
npm install -g pnpm
```

验证安装：
```bash
pnpm --version
```

### 3. 安装项目依赖

在项目根目录执行：

```bash
pnpm install
```

这将安装所有开发和运行时依赖。

## 可用命令

| 命令 | 说明 | 证据 |
|------|------|------|
| `pnpm run build` | 构建项目（tsup 打包） | `package.json:10` — `"build": "tsup"` — `[显式]` |
| `pnpm run typecheck` | TypeScript 类型检查 | `package.json:11` — `"typecheck": "tsc --noEmit"` — `[显式]` |
| `pnpm test` | 运行测试套件 | `package.json:12` — `"test": "vitest run"` — `[显式]` |
| `pnpm run test:watch` | 测试监视模式 | `package.json:13` — `"test:watch": "vitest"` — `[显式]` |
| `pnpm run test:coverage` | 覆盖率报告 | `package.json:14` — `"test:coverage": "vitest run --coverage"` — `[显式]` |
| `pnpm run lint` | ESLint 代码检查 | `package.json:15` — `"lint": "eslint src"` — `[显式]` |
| `pnpm run lint:fix` | ESLint 自动修复 | `package.json:16` — `"lint:fix": "eslint src --fix"` — `[显式]` |
| `pnpm run format` | Prettier 代码格式化 | `package.json:17` — `"format": "prettier --write \"src/**/*.ts\""` — `[显式]` |
| `pnpm run bench` | 性能基准测试 | `package.json:18` — `"bench": "vitest bench"` — `[显式]` |

## 验证安装

运行以下命令验证环境配置正确：

```bash
# 类型检查
pnpm run typecheck

# 运行测试
pnpm test

# 构建项目
pnpm run build

# 检查 CLI
npx spec-first --help
```

## 环境变量

本项目无需特殊环境变量即可运行。

| 变量 | 必需 | 说明 |
|------|------|------|
| - | 否 | 无必需环境变量 |

如需配置 MCP 服务器或技能路径，请参考 `README.md` 中的安装指南。

## IDE 配置建议

### VS Code

推荐安装以下扩展：
- **ESLint** - 代码检查
- **Prettier** - 代码格式化
- **TypeScript Vue Plugin** - TypeScript 支持

### 配置示例

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## 故障排除

### 问题：pnpm install 失败

**解决方案**:
1. 确保 Node.js 版本 >= 20.0.0
2. 清理缓存: `pnpm store prune`
3. 删除 `node_modules/` 后重试

### 问题：构建失败

**解决方案**:
1. 先运行 `pnpm run typecheck` 检查类型错误
2. 确保 pnpm lock 文件已更新
3. 检查 TypeScript 版本是否正确

### 问题：测试失败

**解决方案**:
1. 确保所有依赖已安装
2. 检查 TypeScript 类型是否正确
3. 运行 `pnpm run lint` 检查代码问题

### 问题：覆盖率不达标

**解决方案**:
1. 运行 `pnpm run test:coverage` 查看详细报告
2. 检查 `coverage/` 目录中的 HTML 报告
3. 补充缺失的测试用例

## 外部服务

本项目**无外部服务依赖**（数据库、消息队列、缓存等）。

**证据**: `docs/first/external-deps.md` — 无外部服务依赖 — `[显式]`

---

*生成时间: 2026-03-03 | 模式: deep | 命令: `/spec-first:first --deep`*
