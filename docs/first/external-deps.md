# 外部依赖

## 运行时依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| handlebars | ^4.7.8 | 模板渲染引擎 |
| js-yaml | ^4.1.0 | YAML 解析 |
| semver | ^7.7.4 | 语义版本管理 |
| update-notifier | ^7.0.0 | CLI 更新检查 |

## 开发依赖

### 构建工具

| 包名 | 版本 | 用途 |
|------|------|------|
| tsup | ^8.5.1 | TypeScript 打包器 |
| typescript | ^5.4.0 | TypeScript 编译器 |

### 测试工具

| 包名 | 版本 | 用途 |
|------|------|------|
| vitest | ^1.6.1 | 测试框架 |
| @vitest/coverage-v8 | ^1.6.1 | 覆盖率收集 |
| jsdom | ^28.1.0 | DOM 模拟 |

### 代码质量

| 包名 | 版本 | 用途 |
|------|------|------|
| eslint | ^10.0.2 | 代码检查 |
| @eslint/js | ^10.0.1 | ESLint JS 配置 |
| typescript-eslint | ^8.56.1 | TypeScript ESLint 插件 |
| prettier | ^3.8.1 | 代码格式化 |

### 类型定义

| 包名 | 版本 | 用途 |
|------|------|------|
| @types/node | ^20.11.0 | Node.js 类型 |
| @types/js-yaml | ^4.0.9 | js-yaml 类型 |
| @types/semver | ^7.7.1 | semver 类型 |

## 依赖关系图

```
spec-first
    │
    ├── Runtime Dependencies
    │   ├── handlebars (模板渲染)
    │   ├── js-yaml (YAML 解析)
    │   ├── semver (版本管理)
    │   └── update-notifier (更新检查)
    │
    └── Dev Dependencies
        ├── Build
        │   ├── tsup
        │   └── typescript
        │
        ├── Test
        │   ├── vitest
        │   ├── @vitest/coverage-v8
        │   └── jsdom
        │
        ├── Quality
        │   ├── eslint
        │   ├── typescript-eslint
        │   └── prettier
        │
        └── Types
            ├── @types/node
            ├── @types/js-yaml
            └── @types/semver
```

## 外部服务

Spec-First 不依赖任何外部服务。所有数据存储在本地文件系统中。

## 版本约束

### Node.js

- **最低版本**：20.0.0
- **原因**：使用 ES2022 特性、稳定 ESM 支持

### pnpm Overrides

```json
{
  "rollup": "^4.59.0",
  "minimatch": "^3.1.3",
  "esbuild": "^0.27.3"
}
```

## 证据来源

- 包配置 (`package.json:71-97`) — 依赖声明 — 显式
- 引擎约束 (`package.json:27-29`) — Node.js 版本 — 显式
- Overrides (`package.json:91-96`) — 版本覆盖 — 显式
