---
last_updated: 2026-02-28
---

# 本地环境搭建指南

> 本文档由 `spec-first:first` skill 自动生成，列出项目运行所需的环境信息和搭建步骤。

## 环境要求

| 组件 | 版本要求 | 检测方式 |
|------|----------|----------|
| Node.js | >=20.0.0 | `engines.node` in package.json |
| pnpm | 任意 | 推荐（支持 workspace） |

## 安装步骤

### 1. 安装 Node.js

确保 Node.js 版本 >= 20.0.0：

```bash
node --version  # 应显示 v20.x.x 或更高
```

如果版本不符合，请从 [nodejs.org](https://nodejs.org/) 下载安装。

### 2. 安装 pnpm（推荐）

```bash
npm install -g pnpm
# 或
npm install -g @pnpm/cli
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

| 命令 | 说明 |
|------|------|
| `pnpm run build` | 构建项目（tsup 打包） |
| `pnpm run typecheck` | TypeScript 类型检查 |
| `pnpm test` | 运行测试套件 |
| `pnpm run test:watch` | 测试监视模式 |
| `pnpm run lint` | ESLint 代码检查 |
| `pnpm run lint:fix` | ESLint 自动修复 |
| `pnpm run format` | Prettier 代码格式化 |

## 验证安装

运行以下命令验证环境配置正确：

```bash
# 类型检查
pnpm run typecheck

# 运行测试
pnpm test

# 构建项目
pnpm run build
```

## 环境变量

本项目无需特殊环境变量即可运行。

如需配置 MCP 服务器或技能路径，请参考 `README.md` 中的安装指南。

## 故障排除

### 问题：pnpm install 失败

**解决方案**: 确保 Node.js 版本 >= 20.0.0

### 问题：构建失败

**解决方案**:
1. 先运行 `pnpm run typecheck` 检查类型错误
2. 确保 pnpm lock 文件已更新

### 问题：测试失败

**解决方案**:
1. 确保所有依赖已安装
2. 检查 TypeScript 类型是否正确

---

*生成时间: 2026-02-28 | 命令: `/spec-first:first`*