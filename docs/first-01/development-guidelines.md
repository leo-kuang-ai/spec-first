---
last_updated: 2026-03-03
mode: deep
project_type: backend
---

# spec-first 研发规范

> 本文档基于项目实际代码和配置自动生成，所有结论均附带证据标注。

## 代码风格

### 当前规范

| 配置项 | 值 | 证据 |
|--------|-----|------|
| **Linter** | ESLint ^10.0.2 | `package.json:59` — `"eslint": "^10.0.2"` — `[显式]` |
| **Formatter** | Prettier ^3.8.1 | `package.json:60` — `"prettier": "^3.8.1"` — `[显式]` |
| **缩进** | 2 空格 | `.prettierrc:4` — `"tabWidth": 2` — `[显式]` |
| **引号** | 单引号 | `.prettierrc:3` — `"singleQuote": true` — `[显式]` |
| **分号** | 必须有 | `.prettierrc:2` — `"semi": true` — `[显式]` |
| **行宽** | 100 字符 | `.prettierrc:6` — `"printWidth": 100` — `[显式]` |
| **尾随逗号** | ES5 | `.prettierrc:5` — `"trailingComma": "es5"` — `[显式]` |

### ESLint 规则

| 规则 | 设置 | 证据 |
|------|------|------|
| `@typescript-eslint/no-unused-vars` | error, argsIgnorePattern: ^_ | `eslint.config.js:22` — `'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]` — `[显式]` |
| `@typescript-eslint/no-explicit-any` | warn | `eslint.config.js:23` — `'@typescript-eslint/no-explicit-any': 'warn'` — `[显式]` |
| `no-empty` | warn, allowEmptyCatch: true | `eslint.config.js:24` — `'no-empty': ['warn', { allowEmptyCatch: true }]` — `[显式]` |
| `no-console` | off | `eslint.config.js:25` — `'no-console': 'off'` — `[显式]` |

### 使用方式

```bash
npm run lint       # 检查代码问题 (`package.json:15`)
npm run lint:fix   # 自动修复 (`package.json:16`)
npm run format     # 格式化代码 (`package.json:17`)
```

## 提交规范

### 当前规范

- **提交信息格式**: 遵循 Conventional Commits (`git log -20` — `feat:`, `fix:`, `docs:`, `refactor:` 前缀 — `[推断]`)
- **CHANGELOG.md**: 每次变更需更新 (`CLAUDE.md` — `CHANGELOG.md 强制更新` — `[显式]`)
- **格式**: `- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要 (user-visible)`

### Commit 格式示例

```
feat: 新增功能描述
fix: 修复问题
docs: 文档更新
refactor: 代码重构
test: 测试相关
chore: 杂项
```

### 证据

- `git log -20` 分析显示所有提交使用 Conventional Commits 格式 — `[推断]`

## 测试要求

### 测试框架

| 配置项 | 值 | 证据 |
|--------|-----|------|
| **框架** | Vitest ^1.6.1 | `package.json:64` — `"vitest": "^1.6.1"` — `[显式]` |
| **覆盖率工具** | @vitest/coverage-v8 ^1.6.1 | `package.json:58` — `"@vitest/coverage-v8": "^1.6.1"` — `[显式]` |
| **全局变量** | 启用 | `vitest.config.ts:5` — `globals: true` — `[显式]` |

### 覆盖率阈值

| 指标 | 阈值 | 证据 |
|------|------|------|
| **Lines** | 75% | `vitest.config.ts:12` — `lines: 75` — `[显式]` |
| **Functions** | 75% | `vitest.config.ts:13` — `functions: 75` — `[显式]` |
| **Branches** | 65% | `vitest.config.ts:14` — `branches: 65` — `[显式]` |
| **Statements** | 75% | `vitest.config.ts:15` — `statements: 75` — `[显式]` |

### 测试命令

```bash
npm test              # 运行所有测试 (`package.json:12`)
npm run test:watch    # 监视模式 (`package.json:13`)
npm run test:coverage # 覆盖率报告 (`package.json:14`)
```

### 测试目录结构

| 目录 | 用途 | 证据 |
|------|------|------|
| `tests/unit/` | 单元测试 | `CLAUDE.md` — `tests/unit/` — `[显式]` |
| `tests/integration/` | 集成测试 | `CLAUDE.md` — `tests/integration/` — `[显式]` |
| `tests/e2e/` | 端到端测试 | `CLAUDE.md` — `tests/e2e/` — `[显式]` |
| `tests/fixtures/` | 测试固件 | `CLAUDE.md` — `tests/fixtures/` — `[显式]` |

## 文档规范

### JSDoc 使用

- **策略**: TypeScript 类型系统优先，JSDoc 用于复杂类型注释
- **位置**: 关键函数和复杂类型

### 文档结构

| 文档 | 位置 | 用途 |
|------|------|------|
| `README.md` | 项目根 | 项目介绍和使用指南 |
| `CLAUDE.md` | 项目根 | Claude Code 工作规范 |
| `CHANGELOG.md` | 项目根 | 变更记录 |
| `docs/first/` | docs/ | First Skill 产物 |
| `skills/spec-first/*/SKILL.md` | skills/ | Skill 定义文档 |

## 错误处理

### 日志框架

- **位置**: `src/shared/logger.ts`
- **使用**: 统一日志输出

### ExitCode 定义

| Code | 含义 | 证据 |
|------|------|------|
| 0 | 成功 | `src/shared/types.ts:40-47` — `ExitCode` 枚举 — `[显式]` |
| 1 | 一般错误 | `src/shared/types.ts:40-47` — `[显式]` |
| 2 | 参数错误 | `src/shared/types.ts:40-47` — `[显式]` |
| 3 | 配置错误 | `src/shared/types.ts:40-47` — `[显式]` |

### 异常处理模式

- 同步代码: `try-catch` 块
- 异步代码: `await` 错误处理
- 错误输出: `console.error()` 或 `logger` 模块

## 依赖管理

### 包管理器

| 配置项 | 值 | 证据 |
|--------|-----|------|
| **包管理器** | pnpm | `package.json:72-77` — `pnpm.overrides` 配置 — `[显式]` |
| **lock 文件** | pnpm-lock.yaml | 项目根目录存在 — `[显式]` |

### 核心依赖

| 包名 | 版本 | 用途 | 证据 |
|------|------|------|------|
| handlebars | ^4.7.8 | 模板渲染 | `package.json:67` — `[显式]` |
| js-yaml | ^4.1.0 | YAML 解析 | `package.json:68` — `[显式]` |
| semver | ^7.7.4 | 版本管理 | `package.json:69` — `[显式]` |
| update-notifier | ^7.0.0 | 更新通知 | `package.json:70` — `[显式]` |

### Overrides 配置

```json
"pnpm": {
  "overrides": {
    "rollup": "^4.59.0",      // `package.json:74`
    "minimatch": "^3.1.3",    // `package.json:75`
    "esbuild": "^0.27.3"      // `package.json:76`
  }
}
```

## 项目结构约定

| 约定 | 说明 | 证据 |
|------|------|------|
| **ESM only** | 全项目 `"type": "module"` | `CLAUDE.md` — `ESM only` — `[显式]` |
| **Named exports** | core 模块不使用 default export | `CLAUDE.md` — `Named exports only` — `[显式]` |
| **文件命名** | kebab-case.ts | `CLAUDE.md` — `文件命名: kebab-case.ts` — `[显式]` |
| **未使用变量** | _ 前缀标记 | `eslint.config.js:22` — `argsIgnorePattern: '^_'` — `[显式]` |

---

*生成时间: 2026-03-03 | 模式: deep | 命令: `/spec-first:first --deep`*
