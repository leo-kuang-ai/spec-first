---
last_updated: 2026-03-03
mode: deep
project_type: backend
---

# spec-first 技术栈摘要

> 本文档由 `spec-first:first` skill 自动生成，基于项目实际配置文件。

## 概述

spec-first 是一个规范驱动的开发流程引擎，为 AI 时代的软件开发提供全链路研发闭环能力。

## 项目信息

| 属性 | 值 | 来源 |
|------|-----|------|
| 项目名称 | spec-first | `package.json:3` — `"name": "spec-first"` — `[显式]` |
| 版本 | 0.5.45 | `package.json:4` — `"version": "0.5.45"` — `[显式]` |
| 描述 | Specification-driven development process engine | `package.json:5` — `"description": "..."` — `[显式]` |
| 类型 | ESM Module CLI 工具 | `package.json:6` — `"type": "module"` — `[显式]` |
| 许可证 | MIT | `package.json:35` — `"license": "MIT"` — `[显式]` |

## 运行时环境

| 组件 | 版本 | 来源 |
|------|------|------|
| **Node.js** | ≥20.0.0 | `package.json:27` — `"node": ">=20.0.0"` — `[显式]` |
| **TypeScript** | ^5.4.0 | `package.json:62` — `"typescript": "^5.4.0"` — `[显式]` |
| **ESM** | ESNext | `tsconfig.json:4` — `"module": "ESNext"` — `[显式]` |

## 构建工具

| 工具 | 版本 | 用途 | 来源 |
|------|------|------|------|
| **tsup** | ^8.5.1 | 打包构建 | `package.json:61` — `"tsup": "^8.5.1"` — `[显式]` |
| **tsc** | 5.4+ | 类型检查 | `tsconfig.json:9` — `"strict": true` — `[显式]` |

## 测试框架

| 工具 | 版本 | 用途 | 来源 |
|------|------|------|------|
| **Vitest** | ^1.6.1 | 单元测试 | `package.json:64` — `"vitest": "^1.6.1"` — `[显式]` |
| **@vitest/coverage-v8** | ^1.6.1 | 覆盖率收集 | `package.json:58` — `"@vitest/coverage-v8": "^1.6.1"` — `[显式]` |

**测试配置**:
- 覆盖率阈值: lines/functions/statements 75%, branches 65% (`CLAUDE.md` — `覆盖率阈值: lines/functions/statements 75%, branches 65%` — `[显式]`)
- 测试全局变量启用 (`vitest.config.ts`)

## 代码质量

| 工具 | 版本 | 用途 | 来源 |
|------|------|------|------|
| **ESLint** | ^10.0.2 | 代码检查 | `package.json:59` — `"eslint": "^10.0.2"` — `[显式]` |
| **typescript-eslint** | ^8.56.1 | TS 规则 | `package.json:63` — `"typescript-eslint": "^8.56.1"` — `[显式]` |
| **Prettier** | ^3.8.1 | 代码格式化 | `package.json:60` — `"prettier": "^3.8.1"` — `[显式]` |

## 核心依赖

| 包名 | 版本 | 用途 | 来源 |
|------|------|------|------|
| **handlebars** | ^4.7.8 | 模板渲染 | `package.json:67` — `"handlebars": "^4.7.8"` — `[显式]` |
| **js-yaml** | ^4.1.0 | YAML 解析 | `package.json:68` — `"js-yaml": "^4.1.0"` — `[显式]` |
| **semver** | ^7.7.4 | 版本管理 | `package.json:69` — `"semver": "^7.7.4"` — `[显式]` |
| **update-notifier** | ^7.0.0 | 更新通知 | `package.json:70` — `"update-notifier": "^7.0.0"` — `[显式]` |

## TypeScript 配置

| 配置项 | 值 | 来源 |
|--------|-----|------|
| **target** | ES2022 | `tsconfig.json:3` — `"target": "ES2022"` — `[显式]` |
| **module** | ESNext | `tsconfig.json:4` — `"module": "ESNext"` — `[显式]` |
| **moduleResolution** | bundler | `tsconfig.json:5` — `"moduleResolution": "bundler"` — `[显式]` |
| **strict** | true | `tsconfig.json:9` — `"strict": true` — `[显式]` |
| **verbatimModuleSyntax** | true | `tsconfig.json:18` — `"verbatimModuleSyntax": true` — `[显式]` |
| **declaration** | true | `tsconfig.json:14` — `"declaration": true` — `[显式]` |
| **sourceMap** | true | `tsconfig.json:16` — `"sourceMap": true` — `[显式]` |

## 包管理

| 工具 | 说明 |
|------|------|
| **pnpm** | 推荐（有 overrides 配置） |
| **npm** | 兼容 |

**pnpm overrides**:
- rollup ^4.59.0 (`package.json:74`)
- minimatch ^3.1.3 (`package.json:75`)
- esbuild ^0.27.3 (`package.json:76`)

## 开发命令

| 命令 | 说明 | 来源 |
|------|------|------|
| `npm run build` | tsup 打包 | `package.json:10` — `"build": "tsup"` — `[显式]` |
| `npm run typecheck` | tsc --noEmit | `package.json:11` — `"typecheck": "tsc --noEmit"` — `[显式]` |
| `npm test` | vitest run | `package.json:12` — `"test": "vitest run"` — `[显式]` |
| `npm run test:watch` | vitest watch | `package.json:13` — `"test:watch": "vitest"` — `[显式]` |
| `npm run lint` | eslint src | `package.json:15` — `"lint": "eslint src"` — `[显式]` |
| `npm run lint:fix` | eslint --fix | `package.json:16` — `"lint:fix": "eslint src --fix"` — `[显式]` |
| `npm run format` | prettier | `package.json:17` — `"format": "prettier --write ..."` — `[显式]` |
| `npm run bench` | vitest bench | `package.json:18` — `"bench": "vitest bench"` — `[显式]` |

## 项目结构约定

| 约定 | 说明 | 来源 |
|------|------|------|
| **ESM only** | 全项目 `"type": "module"` | `CLAUDE.md` — `ESM only` — `[显式]` |
| **Named exports** | core 模块不使用 default export | `CLAUDE.md` — `Named exports only` — `[显式]` |
| **文件命名** | kebab-case.ts | `CLAUDE.md` — `文件命名: kebab-case.ts` — `[显式]` |
| **未使用变量** | _ 前缀标记 | `CLAUDE.md` — `未使用变量: 以 _ 前缀标记` — `[显式]` |

## 系统要求

- **Node.js**: ≥20.0.0
- **git**: 可选（用于追溯功能）
- **操作系统**: 跨平台（macOS、Linux、Windows）

---

*生成时间: 2026-03-03 | 分析模式: deep*
