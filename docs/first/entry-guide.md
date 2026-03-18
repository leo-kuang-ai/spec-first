# 入口指南

> 生成时间: 2026-03-17 | 模式: deep

## 运行时要求

| 组件 | 版本 | 说明 |
|------|------|------|
| Node.js | >=20.0.0 | 必需 |
| pnpm | 推荐 | 包管理器（npm 可替代） |

**证据**: `entry-guide.json:runtime` — `[显式]`

## 安装命令

```bash
# 推荐
pnpm install

# 替代方案
npm install
```

**证据**: `entry-guide.json:installCommands` — `[显式]`

## 启动命令

| 用途 | 命令 |
|------|------|
| 构建 | `npm run build` |
| 测试 | `npm test` |
| 代码检查 | `npm run lint` |
| 类型检查 | `npm run typecheck` |

**证据**: `entry-guide.json:startCommands` — `[显式]`

## 环境变量

**无环境变量配置**

本项目不需要配置环境变量。

**证据**: `entry-guide.json:environmentVariables: []` — `[显式]`

## 外部服务

**无外部服务依赖**

本项目不依赖任何外部服务（数据库、消息队列、云服务等）。

**证据**: `entry-guide.json:externalServices: []` — `[显式]`

## 项目特性

| 特性 | 说明 |
|------|------|
| ESM only | 全项目使用 ESM 模块系统 |
| No .env | 无需配置环境变量 |
| No external services | 无外部服务依赖 |

**证据**: `entry-guide.json:notes` — `[显式]`

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 构建
npm run build

# 3. 验证
npm test && npm run typecheck

# 4. 运行 CLI
node dist/cli/index.js --version
```
