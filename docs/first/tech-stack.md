---
mode: quick
generated_at: 2026-03-09T04:43:27.542Z
---

# 技术栈摘要

## 项目信息

- **项目名**: spec-first
- **版本**: 0.5.49
- **描述**: Specification-driven development process engine for AI-era software development
- **类型**: CLI 工具 + 开发流程引擎

## 核心技术栈

### 运行时
- **Node.js**: ≥20.0.0
- **模块系统**: ESM (`"type": "module"`)

### 语言
- **TypeScript**: ^5.4.0
- **编译目标**: ES2022
- **模块解析**: bundler
- **严格模式**: 启用 (strict + verbatimModuleSyntax)

### 构建工具
- **打包器**: tsup ^8.5.1
- **类型检查**: tsc --noEmit

### 测试框架
- **测试运行器**: Vitest ^1.6.1
- **覆盖率工具**: @vitest/coverage-v8
- **覆盖率阈值**: 75% (lines/functions/statements), 65% (branches)

### 代码质量
- **Linter**: ESLint ^10.0.2 + typescript-eslint ^8.56.1
- **格式化**: Prettier ^3.8.1

### 核心依赖
- **模板引擎**: Handlebars ^4.7.8
- **配置解析**: js-yaml ^4.1.0
- **版本管理**: semver ^7.7.4
- **更新通知**: update-notifier ^7.0.0

## 项目类型

**CLI 工具** - 命令行开发流程引擎

- 入口: `dist/cli/index.js`
- 命令数: 19+
- 核心引擎: 8 个 (process-engine, trace-engine, change-mgr, gate-engine 等)

## 开发约定

- **文件命名**: kebab-case.ts
- **导出方式**: Named exports only (禁用 default export)
- **类型定义**: 集中在 `src/shared/types.ts`
- **未使用变量**: `_` 前缀标记

## 数据存储

- **无数据库**: 纯文件系统驱动
- **配置格式**: YAML + JSON
- **模板格式**: Handlebars (.hbs)

---

*本文档由 spec-first:first (quick 模式) 自动生成*
