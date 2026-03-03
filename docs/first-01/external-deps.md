---
last_updated: 2026-03-03
mode: deep
project_type: backend
---

# spec-first 外部依赖

## 概述

spec-first 是一个纯本地 CLI 工具，用于规范驱动的研发流程管理。所有数据处理均在本地完成，不依赖任何外部网络服务或中间件。

## 运行时依赖

| 包名 | 版本 | 用途 | 证据 |
|------|------|------|------|
| handlebars | ^4.7.8 | 模板渲染引擎，用于生成 Feature 工作区模板、CI 配置等 | (`src/core/template/renderer.ts:12` — `import Handlebars from 'handlebars';` — `[显式 import]`) |
| js-yaml | ^4.1.0 | YAML 解析与序列化，用于配置文件、Front Matter 处理 | (`src/shared/config-schema.ts:7` — `import yaml from 'js-yaml';` — `[显式 import]`) |
| semver | ^7.7.4 | 语义化版本解析与比较，用于迁移脚本版本区间匹配 | (`src/core/migrations/version-matcher.ts:5` — `import semver from 'semver';` — `[显式 import]`) |
| update-notifier | ^7.0.0 | 版本更新检查，CLI 执行时异步检查 npm 新版本 | (`src/cli/commands/update.ts:306-307` — `const mod = await import('update-notifier' as string)` — `[动态 import]`) |

## 开发依赖

| 包名 | 版本 | 用途 | 证据 |
|------|------|------|------|
| typescript | ^5.4.0 | TypeScript 编译器，strict mode + verbatimModuleSyntax | (`package.json:62` — `"typescript": "^5.4.0"` — `[devDependencies]`) |
| tsup | ^8.5.1 | ESM 打包工具，生成 dist 产物 | (`package.json:61` — `"tsup": "^8.5.1"` — `[devDependencies]`) |
| vitest | ^1.6.1 | 测试框架，支持 globals + v8 coverage | (`package.json:64` — `"vitest": "^1.6.1"` — `[devDependencies]`) |
| eslint | ^10.0.2 | 代码质量检查，集成 typescript-eslint | (`package.json:59` — `"eslint": "^10.0.2"` — `[devDependencies]`) |
| prettier | ^3.8.1 | 代码格式化工具 | (`package.json:60` — `"prettier": "^3.8.1"` — `[devDependencies]`) |
| @types/node | ^20.11.0 | Node.js 类型定义 | (`package.json:56` — `"@types/node": "^20.11.0"` — `[devDependencies]`) |
| @types/js-yaml | ^4.0.9 | js-yaml 类型定义 | (`package.json:55` — `"@types/js-yaml": "^4.0.9"` — `[devDependencies]`) |
| @types/semver | ^7.7.1 | semver 类型定义 | (`package.json:57` — `"@types/semver": "^7.7.1"` — `[devDependencies]`) |
| @vitest/coverage-v8 | ^1.6.1 | Vitest v8 覆盖率插件 | (`package.json:58` — `"@vitest/coverage-v8": "^1.6.1"` — `[devDependencies]`) |
| typescript-eslint | ^8.56.1 | TypeScript ESLint 规则集 | (`package.json:63` — `"typescript-eslint": "^8.56.1"` — `[devDependencies]`) |
| @eslint/js | ^10.0.1 | ESLint JavaScript 配置 | (`package.json:54` — `"@eslint/js": "^10.0.1"` — `[devDependencies]`) |

## 外部服务

| 类别 | 状态 | 说明 |
|------|------|------|
| 数据库 | 未使用 | 无 MySQL/PostgreSQL/MongoDB 连接配置 |
| 消息队列 | 未使用 | 无 RabbitMQ/Kafka/RocketMQ 依赖 |
| 缓存 | 未使用 | 无 Redis/Memcached 连接配置 |
| 对象存储 | 未使用 | 无 OSS/S3/MinIO SDK 引用 |
| 云服务 | 未使用 | 无 AWS/阿里云/GCP SDK 依赖 |

**结论**：本项目不依赖任何外部网络服务，所有数据处理均在本地完成。

## 系统要求

| 依赖 | 版本要求 | 用途 | 证据 |
|------|----------|------|------|
| Node.js | >=20.0.0 | 运行时环境，ESM 模块支持 | (`package.json:26-28` — `"engines": { "node": ">=20.0.0" }` — `[engines 约束]`) |
| git | 可选 | Git hooks 安装、版本回滚建议 | (`src/cli/commands/hooks.ts:29` — `未检测到 .git 目录，无法安装 Git hooks` — `[条件依赖]`) |

### Git 依赖说明

Git 为可选依赖，以下功能需要 Git 环境：

- **Git Hooks 安装**：`spec-first hooks install` 检测 `.git` 目录 (`src/cli/commands/hooks.ts:28-31`)
- **版本回滚建议**：Gate 引擎生成 `git revert` 回滚命令 (`src/core/gate-engine/rollback.ts:49`)
- **增量更新**：First Skill 增量模式基于 git diff (`src/core/skill-runtime/first-resume.ts:241`)

---

*生成时间: 2026-03-03 | 模式: deep | Agent: C1*
