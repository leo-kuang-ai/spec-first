---
last_updated: 2026-02-28
---

# 技术栈摘要

> 本文档由 `spec-first:first` skill 自动生成，基于项目配置文件和依赖声明分析得出。

## 项目信息

| 属性 | 值 |
|------|-----|
| 项目名称 | spec-first |
| 版本 | 0.5.45 |
| 描述 | Specification-driven development process engine for AI-era software development |
| 类型 | ESM Module CLI 工具 |
| 许可证 | MIT |

## 核心技术栈

### 运行时环境

| 组件 | 版本 | 说明 |
|------|------|------|
| Node.js | >=20.0.0 | 最低版本要求 |
| TypeScript | ^5.4.0 | strict mode, verbatimModuleSyntax |
| ESM | - | `"type": "module"` |

### 构建工具

| 工具 | 版本 | 用途 |
|------|------|------|
| tsup | ^8.5.1 | 打包构建 |
| TypeScript | ^5.4.0 | 类型检查 |

### 测试框架

| 工具 | 版本 | 说明 |
|------|------|------|
| Vitest | ^1.6.1 | 测试运行器 |
| @vitest/coverage-v8 | ^1.6.1 | 覆盖率报告（v8） |

### 代码质量

| 工具 | 版本 | 用途 |
|------|------|------|
| ESLint | ^10.0.2 | 代码检查 |
| @eslint/js | ^10.0.1 | ESLint 配置 |
| typescript-eslint | ^8.56.1 | TypeScript ESLint 插件 |
| Prettier | ^3.8.1 | 代码格式化 |

### 核心依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| handlebars | ^4.7.8 | 模板引擎 |
| js-yaml | ^4.1.0 | YAML 解析 |
| update-notifier | ^7.0.0 | 版本更新通知 |

### 包管理器配置

| 配置项 | 值 |
|--------|-----|
| 包管理器 | pnpm（通过 `pnpm.overrides` 配置） |
| overrides | rollup ^4.59.0, minimatch ^3.1.3 |

## 开发命令

| 命令 | 说明 |
|------|------|
| `npm run build` | tsup 打包 |
| `npm run typecheck` | tsc --noEmit 类型检查 |
| `npm test` | vitest run（全量测试） |
| `npm run test:watch` | vitest watch 模式 |
| `npm run lint` | eslint src |
| `npm run lint:fix` | eslint src --fix |
| `npm run format` | prettier 格式化 |
| `npm run bench` | vitest bench（性能基准测试） |

---

*生成时间: 2026-02-28 | 命令: `/spec-first:first`*
