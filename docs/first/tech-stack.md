---
mode: deep
last_updated: 2026-03-08T12:00:44Z
generated_at: 2026-03-08T12:00:44Z
project: spec-first
platform_type: node-cli
---

# 技术栈摘要

## 运行时与语言

- 项目运行在 Node.js 20+ 上。 (`package.json:27` — `"node": ">=20.0.0"` — [显式])
- 源码采用 TypeScript + ESM。 (`package.json:5` — `"type": "module"` — [显式])
- 构建目标是 ESM CLI 产物并生成类型声明。 (`tsup.config.ts:4` — `entry: ['src/cli/index.ts', 'src/postinstall.ts', 'src/preuninstall.ts']` — [显式])
- 目标 JavaScript 版本为 `es2022`。 (`tsup.config.ts:6` — `target: 'es2022'` — [显式])

## 分发与打包

- npm 包主入口是 `spec-first` CLI 二进制。 (`package.json:6` — `"spec-first": "./dist/cli/index.js"` — [显式])
- 发布物包含 `dist`、`skills`、`templates` 与 `scripts/stage-viewer`，说明产品不仅是代码，还包含规范与可视化资产。 (`package.json:37` — `"files"` — [显式])
- 仓库还携带一个独立的 VS Code 扩展包。 (`packages/vscode-spec-first/package.json:2` — `"name": "vscode-spec-first"` — [显式])

## 核心依赖

- 模板渲染依赖 `handlebars`。 (`package.json:68` — `"handlebars": "^4.7.8"` — [显式])
- YAML 解析依赖 `js-yaml`。 (`package.json:69` — `"js-yaml": "^4.1.0"` — [显式])
- 版本比较依赖 `semver`。 (`package.json:70` — `"semver": "^7.7.4"` — [显式])
- 升级提示依赖 `update-notifier`。 (`package.json:71` — `"update-notifier": "^7.0.0"` — [显式])

## 工程工具链

- 构建使用 `tsup`。 (`package.json:10` — `"build": "tsup"` — [显式])
- 类型检查使用 `tsc --noEmit`。 (`package.json:11` — `"typecheck": "tsc --noEmit"` — [显式])
- 测试框架是 Vitest，且测试文件模式统一为 `tests/**/*.test.ts`。 (`vitest.config.ts:6` — `include: ['tests/**/*.test.ts']` — [显式])
- 覆盖率使用 V8 provider，阈值为 lines/functions/statements 75%、branches 65%。 (`vitest.config.ts:8` — `provider: 'v8'` — [显式])
- lint 使用 `eslint` + `typescript-eslint`，且只主要检查 `src/`。 (`package.json:15` — `"lint": "eslint src"` — [显式])
- 格式化使用 Prettier，仅覆盖 `src/**/*.ts`。 (`package.json:17` — `"format": "prettier --write \"src/**/*.ts\""` — [显式])

## 技术判断

- 这是“文件驱动流程引擎 + AI 技能资产”的混合型仓库，而不是单纯的业务 API 服务。 (`package.json:39` — `"skills"` — [显式])
- 项目显式依赖宿主环境集成与可视化脚本，说明产品边界跨越 CLI、本地配置和工具生态。 (`package.json:42` — `"scripts/stage-viewer"` — [显式])
- 当前仓库没有引入数据库 ORM 或 Web 框架作为主依赖，因此技术中心在工作流编排而非请求处理。 (`package.json:67` — `dependencies` 仅含 4 个基础库 — [推断])
