# 外部依赖

> 真源: `.spec-first/runtime/first/summary.json` + `package.json`

## 运行时依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| `handlebars` | ^4.7.8 | 模板引擎，用于产物生成 |
| `js-yaml` | ^4.1.0 | YAML 配置解析 |
| `semver` | ^7.7.4 | 语义版本号处理 |
| `update-notifier` | ^7.0.0 | 版本更新检测 |

## 开发依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| `typescript` | ^5.4.0 | 类型系统 |
| `tsup` | ^8.5.1 | 构建打包 |
| `vitest` | ^1.6.1 | 单元测试框架 |
| `@vitest/coverage-v8` | ^1.6.1 | 测试覆盖率 (v8 引擎) |
| `eslint` | ^10.0.2 | 代码检查 |
| `typescript-eslint` | ^8.56.1 | TypeScript ESLint 规则 |
| `@eslint/js` | ^10.0.1 | ESLint JS 配置 |
| `prettier` | ^3.8.1 | 代码格式化 |
| `jsdom` | ^28.1.0 | DOM 环境模拟 (测试用) |
| `@types/node` | ^20.11.0 | Node.js 类型定义 |
| `@types/js-yaml` | ^4.0.9 | js-yaml 类型定义 |
| `@types/semver` | ^7.7.1 | semver 类型定义 |

## 运行环境

| 组件 | 要求 |
|------|------|
| Node.js | >=20.0.0 |
| 模块系统 | ESM (`"type": "module"`) |

## pnpm Overrides

| 包名 | 版本 | 原因 |
|------|------|------|
| `rollup` | ^4.59.0 | 安全更新 |
| `minimatch` | ^3.1.3 | 安全更新 |
| `esbuild` | ^0.27.3 | 安全更新 |
