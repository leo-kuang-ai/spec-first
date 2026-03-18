# 外部依赖

> 生成时间: 2026-03-17 | 模式: deep

## 外部服务

**无外部服务依赖**

本项目为 CLI 工具，不依赖任何外部服务（数据库、消息队列、云服务等）。

## 第三方依赖

### 运行时依赖

| 依赖 | 版本 | 用途 | 证据 |
|------|------|------|------|
| commander | ^14.0.0 | CLI 框架 | `package.json:dependencies` — `[显式]` |
| handlebars | ^4.7.8 | 模板引擎 | `package.json:dependencies` — `[显式]` |
| js-yaml | ^4.1.0 | YAML 解析 | `package.json:dependencies` — `[显式]` |
| chalk | ^5.6.2 | 终端颜色 | `package.json:dependencies` — `[显式]` |
| ora | ^8.2.0 | 进度指示器 | `package.json:dependencies` — `[显式]` |
| inquirer | ^12.9.0 | 交互式提示 | `package.json:dependencies` — `[显式]` |
| glob | ^11.0.0 | 文件匹配 | `package.json:dependencies` — `[显式]` |
| fs-extra | ^11.3.0 | 文件系统增强 | `package.json:dependencies` — `[显式]` |
| uuid | ^11.1.0 | UUID 生成 | `package.json:dependencies` — `[显式]` |
| date-fns | ^4.1.0 | 日期处理 | `package.json:dependencies` — `[显式]` |

### 开发依赖

| 依赖 | 版本 | 用途 | 证据 |
|------|------|------|------|
| typescript | ^5.8.3 | TypeScript 编译器 | `package.json:devDependencies` — `[显式]` |
| tsup | ^8.5.1 | 打包构建 | `package.json:devDependencies` — `[显式]` |
| vitest | ^1.6.1 | 测试框架 | `package.json:devDependencies` — `[显式]` |
| eslint | ^10.0.2 | 代码检查 | `package.json:devDependencies` — `[显式]` |
| prettier | ^3.8.1 | 代码格式化 | `package.json:devDependencies` — `[显式]` |
| typescript-eslint | ^8.34.0 | TypeScript ESLint | `package.json:devDependencies` — `[显式]` |
| @types/node | ^22.15.30 | Node.js 类型定义 | `package.json:devDependencies` — `[显式]` |

## 边界与集成

### CLI 边界

- **输入**: 命令行参数、配置文件（`.spec-first/`）
- **输出**: 终端输出、文件系统变更、退出码

### 文件系统边界

| 目录 | 用途 | 读写权限 |
|------|------|----------|
| `.spec-first/` | 项目配置与状态 | 读写 |
| `specs/` | Feature 产物 | 读写 |
| `src/` | 源代码 | 只读（分析用） |
| `docs/` | 文档 | 读写 |
| `templates/` | 模板 | 只读 |

### 环境边界

**无环境变量依赖**

本项目不需要配置环境变量（`.env` 文件）。

**证据**: 无 `.env.example` 文件，`entry-guide.json:environmentVariables: []` — `[显式]`

## 依赖风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| TypeScript 版本升级 | 可能需要类型定义更新 | 锁定主版本号 |
| ESM 兼容性 | 部分依赖可能不完全支持 ESM | 严格测试 ESM 导入 |
| Handlebars 模板安全 | 模板注入风险 | 不允许用户自定义模板 |
