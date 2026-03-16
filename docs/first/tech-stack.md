---
last_updated: 2026-03-16
mode: quick
project: spec-first
platform_type: backend
---

# 技术栈摘要

> 本文档由 `spec-first:first` 自动生成，梳理项目的技术栈与依赖。

## 项目概述

**spec-first** — AI-workflow CLI for spec-driven development

一个面向 AI 辅助开发团队的 CLI 工具，提供质量门禁、可追溯性管理和 Feature 生命周期管理能力。

## 核心技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **Runtime** | Node.js | ≥20.0.0 | 运行时环境 |
| **Language** | TypeScript | ^5.4.0 | 开发语言（strict mode, ESM） |
| **Module** | ESM | - | `"type": "module"` |
| **Bundler** | tsup | ^8.5.1 | 构建打包 |
| **Test** | Vitest | ^1.6.1 | 测试框架（globals enabled, v8 coverage） |
| **Lint** | ESLint + typescript-eslint | ^10.0.2 / ^8.56.1 | 代码检查 |
| **Format** | Prettier | ^3.8.1 | 代码格式化 |
| **Template** | Handlebars | ^4.7.8 | 模板渲染 |
| **Config** | js-yaml | ^4.1.0 | YAML 配置解析 |

## 依赖关系

### 生产依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| `handlebars` | ^4.7.8 | 模板引擎，用于生成规范产物 |
| `js-yaml` | ^4.1.0 | YAML 文件解析 |
| `semver` | ^7.7.4 | 语义化版本处理 |
| `update-notifier` | ^7.0.0 | CLI 版本更新通知 |

### 开发依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| `@eslint/js` | ^10.0.1 | ESLint 基础规则 |
| `@types/js-yaml` | ^4.0.9 | js-yaml 类型定义 |
| `@types/node` | ^20.11.0 | Node.js 类型定义 |
| `@types/semver` | ^7.7.1 | semver 类型定义 |
| `@vitest/coverage-v8` | ^1.6.1 | V8 覆盖率采集 |
| `eslint` | ^10.0.2 | 代码检查 |
| `jsdom` | ^28.1.0 | DOM 模拟环境 |
| `prettier` | ^3.8.1 | 代码格式化 |
| `tsup` | ^8.5.1 | TypeScript 打包 |
| `typescript` | ^5.4.0 | TypeScript 编译器 |
| `typescript-eslint` | ^8.56.1 | TypeScript ESLint 规则 |
| `vitest` | ^1.6.1 | 测试框架 |

## 构建与脚本

```bash
# 构建
npm run build              # tsup 打包

# 类型检查
npm run typecheck          # tsc --noEmit

# 测试
npm test                   # vitest run（全量）
npm run test:watch         # vitest watch 模式
npm run test:coverage      # 带覆盖率报告

# 代码质量
npm run lint               # eslint src
npm run lint:fix           # eslint --fix
npm run format             # prettier 格式化

# Stage Viewer
npm run viewer:start       # 启动 stage 查看服务
npm run viewer:bootstrap   # 引导启动查看器
```

## 覆盖率阈值

| 指标 | 阈值 |
|------|------|
| lines | 75% |
| functions | 75% |
| statements | 75% |
| branches | 65% |

## 关键配置文件

| 文件 | 用途 |
|------|------|
| `package.json` | 项目配置、依赖声明、脚本 |
| `tsconfig.json` | TypeScript 编译配置 |
| `vitest.config.ts` | 测试框架配置 |
| `eslint.config.js` | ESLint 规则配置 |
| `.prettierrc` | Prettier 格式化配置 |

---

*生成时间: 2026-03-16 | 模式: quick*
