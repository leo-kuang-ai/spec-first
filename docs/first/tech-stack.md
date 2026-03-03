---
last_updated: 2026-03-03
mode: quick
project_type: backend
---

# 技术栈摘要

> **项目**: spec-first
> **版本**: 0.5.45
> **描述**: Specification-driven development process engine for AI-era software development

## 核心技术栈

### 语言与运行时

- **语言**: TypeScript 5.4+
- **运行时**: Node.js ≥20.0.0
- **模块系统**: ESM (`"type": "module"`)
- **编译目标**: ES2022

**编译配置** (`tsconfig.json`):
- 严格模式启用 (`strict: true`)
- 模块解析: bundler
- verbatimModuleSyntax 启用
- 声明文件生成启用

### 构建工具

- **打包工具**: tsup 8.5.1
- **测试框架**: Vitest 1.6.1
- **覆盖率工具**: @vitest/coverage-v8

**构建命令**:
```bash
npm run build          # tsup 打包
npm run typecheck      # TypeScript 类型检查
npm test               # 运行测试
npm run test:coverage  # 测试覆盖率
```

### 代码质量

- **Linter**: ESLint 10.0.2 + typescript-eslint 8.56.1
- **Formatter**: Prettier 3.8.1

**质量命令**:
```bash
npm run lint           # 代码检查
npm run lint:fix       # 自动修复
npm run format         # 代码格式化
```

### 包管理

- **包管理器**: pnpm（从 `pnpm.overrides` 推断）
- **依赖管理**: 锁文件 + overrides 机制

**关键依赖覆盖**:
- rollup: ^4.59.0
- minimatch: ^3.1.3
- esbuild: ^0.27.3

### 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| handlebars | ^4.7.8 | 模板引擎 |
| js-yaml | ^4.1.0 | YAML 解析 |
| semver | ^7.7.4 | 语义版本管理 |
| update-notifier | ^7.0.0 | 版本更新通知 |

### 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| @types/node | ^20.11.0 | Node.js 类型定义 |
| @types/js-yaml | ^4.0.9 | js-yaml 类型定义 |
| @types/semver | ^7.7.1 | semver 类型定义 |

## 项目特征

### 类型定位

- **CLI 工具**: 提供命令行接口（`bin.spec-first`）
- **后端服务**: 无前端界面，纯后端逻辑

### 代码规模

- **TypeScript 文件**: 107 个
- **主要模块**: CLI 命令、核心引擎、工具集成

### 架构特点

- **ESM Only**: 全项目使用 ESM 模块系统
- **Named Exports**: 核心模块使用命名导出
- **严格类型**: TypeScript 严格模式 + 完整类型定义

## 发布配置

- **发布范围**: public（npm public package）
- **入口文件**: `./dist/cli/index.js`
- **类型定义**: `./dist/cli/index.d.ts`
- **包含文件**: dist/, skills/, templates/, README.md, scripts/

## 脚本命令

| 命令 | 说明 |
|------|------|
| `npm run build` | tsup 打包 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm test` | 运行测试 |
| `npm run test:watch` | 测试监听模式 |
| `npm run test:coverage` | 测试覆盖率 |
| `npm run lint` | ESLint 检查 |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm run format` | Prettier 格式化 |
| `npm run bench` | 性能基准测试 |
