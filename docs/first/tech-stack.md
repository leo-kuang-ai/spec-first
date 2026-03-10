---
mode: deep
generated_at: 2026-03-09T20:06:12.462Z
---

# 技术栈摘要

## 运行时环境

- **Runtime**: Node.js ≥20.0.0
- **Module System**: ESM (`"type": "module"`)

## 编程语言

- **Language**: TypeScript 5.4+
- **Type Checking**: Strict mode enabled
- **Module Syntax**: `verbatimModuleSyntax`

## 构建工具链

- **Bundler**: tsup
- **Type Checker**: tsc (TypeScript Compiler)

## 测试框架

- **Test Framework**: Vitest
- **Coverage Tool**: @vitest/coverage-v8
- **Coverage Threshold**: 75% (lines/functions/statements), 65% (branches)

## 代码质量

- **Linter**: ESLint 10+ with typescript-eslint
- **Formatter**: Prettier 3.8+

## 核心依赖

### 生产依赖
- `handlebars` ^4.7.8 - 模板渲染
- `js-yaml` ^4.1.0 - YAML 配置解析
- `semver` ^7.7.4 - 版本管理
- `update-notifier` ^7.0.0 - 更新通知

### 开发依赖
- `@types/node` ^20.11.0
- `@types/js-yaml` ^4.0.9
- `@types/semver` ^7.7.1
- `vitest` ^1.6.1
- `tsup` ^8.5.1
- `typescript` ^5.4.0

## 包管理器

- **Primary**: npm
- **Alternative**: pnpm (with overrides configured)

## 发布配置

- **Registry**: npm public registry
- **Entry Point**: `dist/cli/index.js`
- **Binary**: `spec-first` command
