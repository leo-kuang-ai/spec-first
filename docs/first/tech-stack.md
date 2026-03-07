---
last_updated: 2026-03-06
mode: deep
project_type: backend
---

# 技术栈摘要

## 项目信息

- **项目名称**: spec-first
- **版本**: v0.5.45
- **描述**: Specification-driven development process engine for AI-era software development
- **项目类型**: CLI 工具 / 后端服务

## 核心技术栈

### 运行时与语言

- **Runtime**: Node.js ≥20.0.0 (`package.json:28` — `"node": ">=20.0.0"` — `[显式]`)
- **语言**: TypeScript ≥5.4 (`package.json:63` — `"typescript": "^5.4.0"` — `[显式]`)
- **模块系统**: ESM (`package.json:5` — `"type": "module"` — `[显式]`)
- **编译目标**: ES2022 (`tsconfig.json:3` — `"target": "ES2022"` — `[显式]`)

### 构建与工具链

- **构建工具**: tsup (`package.json:62` — `"tsup": "^8.5.1"` — `[显式]`)
- **包管理器**: npm/pnpm
- **TypeScript 配置**:
  - strict mode (`tsconfig.json:9` — `"strict": true` — `[显式]`)
  - verbatimModuleSyntax (`tsconfig.json:18` — `"verbatimModuleSyntax": true` — `[显式]`)
  - moduleResolution: bundler (`tsconfig.json:5` — `"moduleResolution": "bundler"` — `[显式]`)

### 测试与质量

- **测试框架**: Vitest (`package.json:65` — `"vitest": "^1.6.1"` — `[显式]`)
- **代码覆盖率**: @vitest/coverage-v8 (`package.json:59` — `"@vitest/coverage-v8": "^1.6.1"` — `[显式]`)
- **Linter**: ESLint 10+ with typescript-eslint
- **格式化**: Prettier 3.8+

### 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| handlebars | ^4.7.8 | 模板渲染 (`package.json:68` — `[显式]`) |
| js-yaml | ^4.1.0 | YAML 配置解析 (`package.json:69` — `[显式]`) |
| semver | ^7.7.4 | 版本管理 (`package.json:70` — `[显式]`) |
| update-notifier | ^7.0.0 | 更新通知 (`package.json:71` — `[显式]`) |

### 开发依赖

- TypeScript 5.4+
- tsup 8.5+ (打包)
- Vitest (测试)
- ESLint 10+ (代码检查)
- Prettier 3.8+ (格式化)

## 项目特征

- **CLI 工具**: 提供 `spec-first` 命令行工具
- **ESM Only**: 全项目使用 ES Modules
- **严格类型**: TypeScript strict mode
- **测试驱动**: Vitest 单元测试 + 覆盖率
