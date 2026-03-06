---
last_updated: 2026-03-06
mode: deep
project_type: backend
---

# 外部依赖

## 核心依赖

| 依赖 | 版本 | 用途 | 证据 |
|------|------|------|------|
| handlebars | ^4.7.8 | 模板渲染引擎，用于生成规范文档和产物 | (`package.json:67` — `"handlebars": "^4.7.8"` — `[显式]`) |
| js-yaml | ^4.1.0 | YAML 配置文件解析，用于读取 Skill 和配置 | (`package.json:68` — `"js-yaml": "^4.1.0"` — `[显式]`) |
| semver | ^7.7.4 | 语义化版本管理，用于版本比较和校验 | (`package.json:69` — `"semver": "^7.7.4"` — `[显式]`) |
| update-notifier | ^7.0.0 | CLI 更新通知，提示用户升级到最新版本 | (`package.json:70` — `"update-notifier": "^7.0.0"` — `[显式]`) |

## 开发依赖

| 依赖 | 版本 | 用途 | 证据 |
|------|------|------|------|
| typescript | ^5.4.0 | TypeScript 编译器，项目使用 TS 开发 | (`package.json:62` — `"typescript": "^5.4.0"` — `[显式]`) |
| tsup | ^8.5.1 | TypeScript 打包工具，基于 esbuild | (`package.json:61` — `"tsup": "^8.5.1"` — `[显式]`) |
| eslint | ^10.0.2 | 代码静态检查工具 | (`package.json:59` — `"eslint": "^10.0.2"` — `[显式]`) |
| @eslint/js | ^10.0.1 | ESLint JavaScript 配置 | (`package.json:54` — `"@eslint/js": "^10.0.1"` — `[显式]`) |
| typescript-eslint | ^8.56.1 | TypeScript ESLint 插件和解析器 | (`package.json:63` — `"typescript-eslint": "^8.56.1"` — `[显式]`) |
| prettier | ^3.8.1 | 代码格式化工具 | (`package.json:60` — `"prettier": "^3.8.1"` — `[显式]`) |
| @types/node | ^20.11.0 | Node.js 类型定义 | (`package.json:56` — `"@types/node": "^20.11.0"` — `[显式]`) |
| @types/js-yaml | ^4.0.9 | js-yaml 类型定义 | (`package.json:55` — `"@types/js-yaml": "^4.0.9"` — `[显式]`) |
| @types/semver | ^7.7.1 | semver 类型定义 | (`package.json:57` — `"@types/semver": "^7.7.1"` — `[显式]`) |

## 测试依赖

| 依赖 | 版本 | 用途 | 证据 |
|------|------|------|------|
| vitest | ^1.6.1 | 测试框架，基于 Vite 的单元测试工具 | (`package.json:64` — `"vitest": "^1.6.1"` — `[显式]`) |
| @vitest/coverage-v8 | ^1.6.1 | Vitest 代码覆盖率插件，使用 V8 引擎 | (`package.json:58` — `"@vitest/coverage-v8": "^1.6.1"` — `[显式]`) |

## 依赖覆盖（pnpm overrides）

| 依赖 | 版本 | 原因 | 证据 |
|------|------|------|------|
| rollup | ^4.59.0 | 安全或兼容性修复 | (`package.json:74` — `"rollup": "^4.59.0"` — `[显式]`) |
| minimatch | ^3.1.3 | 安全或兼容性修复 | (`package.json:75` — `"minimatch": "^3.1.3"` — `[显式]`) |
| esbuild | ^0.27.3 | 安全或兼容性修复 | (`package.json:76` — `"esbuild": "^0.27.3"` — `[显式]`) |

## 依赖分析

### 核心依赖特征
- **轻量级**：仅 4 个核心依赖，保持最小化原则
- **标准化**：使用行业标准工具（handlebars、js-yaml、semver）
- **用户体验**：update-notifier 提升 CLI 工具用户体验

### 开发工具链
- **现代化**：TypeScript 5.4+、ESLint 10+、Prettier 3.8+
- **高效构建**：tsup 基于 esbuild，构建速度快
- **类型安全**：完整的 @types 定义覆盖

### 测试策略
- **Vitest**：现代化测试框架，与 Vite 生态集成
- **覆盖率**：使用 V8 引擎原生覆盖率，准确度高

### 安全管理
- **pnpm overrides**：主动管理传递依赖版本，修复已知漏洞
- **Node.js 版本**：要求 >=20.0.0，使用 LTS 版本
