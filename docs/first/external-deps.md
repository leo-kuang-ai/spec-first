# 外部依赖

> 本文档列出 spec-first 项目的所有外部依赖及其用途。

## 运行时依赖

### 核心依赖

#### handlebars@^4.7.8
- **用途**: 模板渲染引擎
- **使用场景**: 生成规范文档、配置文件、代码骨架等
- **代码位置**: `src/core/template/renderer.ts`
- **许可证**: MIT

#### js-yaml@^4.1.0
- **用途**: YAML 解析与序列化
- **使用场景**: 解析项目配置、Layer 2 规范配置
- **代码位置**: `src/shared/config-loader.ts`
- **许可证**: MIT

#### semver@^7.7.4
- **用途**: 语义版本控制
- **使用场景**: CLI 版本校验、配置兼容性检查
- **代码位置**: `src/cli/commands/update.ts`
- **许可证**: ISC

#### update-notifier@^7.0.0
- **用途**: CLI 更新通知
- **使用场景**: 检测并提示用户安装新版本
- **代码位置**: `src/cli/index.ts`
- **许可证**: BSD-2-Clause

## 开发依赖

### 构建工具
- **tsup@^8.5.1** - TypeScript 打包（ESM/CJS）
- **typescript@^5.4.0** - TypeScript 编译器

### 测试工具
- **vitest@^1.6.1** - 单元测试框架
- **@vitest/coverage-v8@^1.6.1** - 覆盖率工具

### 代码质量
- **eslint@^10.0.2** - 代码检查
- **typescript-eslint@^8.56.1** - TypeScript ESLint 支持
- **prettier@^3.8.1** - 代码格式化

### 类型定义
- **@types/node@^20.11.0** - Node.js 类型定义
- **@types/js-yaml@^4.0.9** - js-yaml 类型定义
- **@types/semver@^7.7.1** - semver 类型定义

## 包管理器

- **开发**: pnpm@≥8.0（推荐）
- **用户**: npm@≥9.0（内置）

## 证据来源

- `package.json:1-102` — 依赖声明 (`[显式]`)
- `pnpm-lock.yaml` — 锁定版本 (`[显式]`)
