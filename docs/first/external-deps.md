# Spec-First 外部依赖

> 基于 `package.json` 生成

## 概述

Spec-First 项目采用精简的依赖策略，仅依赖必要的生产库和开发工具链。

---

## 生产依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `handlebars` | ^4.7.8 | 模板引擎，用于渲染 Skill 提示词、产物模板（如 spec.md、design.md、task_plan.md） |
| `js-yaml` | ^4.1.0 | YAML 解析器，用于读取/写入配置文件（.spec-first/config.yaml、document-links.yaml 等） |
| `semver` | ^7.7.4 | 语义版本控制，用于版本比较、版本号解析和版本范围匹配 |
| `update-notifier` | ^7.0.0 | CLI 更新通知，检查 npm 注册表并向用户提示新版本可用 |

### 依赖详情

#### handlebars

- **用途**: 模板渲染引擎
- **使用场景**:
  - Skill 提示词模板渲染
  - 产物模板生成（spec.md、design.md、task_plan.md、prd.md）
  - 动态内容插值与条件渲染
- **模块位置**: `src/core/template/`

#### js-yaml

- **用途**: YAML 文件解析与序列化
- **使用场景**:
  - `.spec-first/config.yaml` 配置读取
  - `document-links.yaml` 文档关联管理
  - Skill 定义文件解析
- **模块位置**: 跨多个核心模块使用

#### semver

- **用途**: 语义版本控制
- **使用场景**:
  - 版本号解析与比较
  - 版本范围匹配
  - 发布版本校验
- **模块位置**: `src/cli/commands/update.ts`、发布脚本

#### update-notifier

- **用途**: CLI 更新检查与通知
- **使用场景**:
  - 启动时检查 npm 最新版本
  - 向用户提示可用更新
- **模块位置**: `src/cli/index.ts`

---

## 开发依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `typescript` | ^5.4.0 | TypeScript 编译器，提供类型检查和代码转译 |
| `tsup` | ^8.5.1 | ESM 打包工具，基于 esbuild 的高性能打包 |
| `vitest` | ^1.6.1 | 测试框架，提供单元测试、集成测试和覆盖率报告 |
| `@vitest/coverage-v8` | ^1.6.1 | Vitest V8 覆盖率插件 |
| `eslint` | ^10.0.2 | 代码质量检查工具 |
| `@eslint/js` | ^10.0.1 | ESLint JavaScript 配置 |
| `typescript-eslint` | ^8.56.1 | TypeScript ESLint 规则集 |
| `prettier` | ^3.8.1 | 代码格式化工具 |
| `@types/node` | ^20.11.0 | Node.js 类型定义 |
| `@types/js-yaml` | ^4.0.9 | js-yaml 类型定义 |
| `@types/semver` | ^7.7.1 | semver 类型定义 |
| `jsdom` | ^28.1.0 | DOM 环境模拟，用于 Stage Viewer 测试 |

### 开发依赖详情

#### 构建工具

| 依赖 | 用途 |
|------|------|
| `typescript` | TypeScript 编译器，strict mode，`verbatimModuleSyntax` |
| `tsup` | ESM 打包，输出 `dist/` 目录 |

#### 测试工具

| 依赖 | 用途 |
|------|------|
| `vitest` | 测试框架，globals enabled |
| `@vitest/coverage-v8` | 覆盖率报告（阈值：lines/functions/statements 75%, branches 65%） |
| `jsdom` | DOM 环境模拟 |

#### 代码质量

| 依赖 | 用途 |
|------|------|
| `eslint` | 代码检查 |
| `@eslint/js` | ESLint JavaScript 配置 |
| `typescript-eslint` | TypeScript 规则集 |
| `prettier` | 代码格式化 |

#### 类型定义

| 依赖 | 用途 |
|------|------|
| `@types/node` | Node.js API 类型定义 |
| `@types/js-yaml` | js-yaml 类型定义 |
| `@types/semver` | semver 类型定义 |

---

## pnpm 覆盖配置

项目使用 pnpm 作为包管理器，以下依赖被覆盖以确保兼容性：

| 依赖 | 覆盖版本 | 原因 |
|------|----------|------|
| `rollup` | ^4.59.0 | 安全更新 |
| `minimatch` | ^3.1.3 | 安全更新 |
| `esbuild` | ^0.27.3 | 性能与兼容性 |

---

## 依赖统计

- **生产依赖**: 4 个
- **开发依赖**: 12 个
- **总计**: 16 个直接依赖

---

## 引用文件

- `package.json` - 依赖定义
- `src/shared/types.ts` - 类型定义
- `src/core/template/` - Handlebars 模板渲染
- `src/cli/index.ts` - update-notifier 集成
