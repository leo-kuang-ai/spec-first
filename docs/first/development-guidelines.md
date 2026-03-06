---
last_updated: 2026-03-06
mode: deep
project_type: backend
---

# 研发规范

## 代码风格

### TypeScript 规范

- **strict mode 启用** (`tsconfig.json:9` — `"strict": true` — `[显式]`)
- **ESM 模块系统** (`tsconfig.json:4` — `"module": "ESNext"` — `[显式]`)
- **verbatimModuleSyntax** (`tsconfig.json:18` — `"verbatimModuleSyntax": true` — `[显式]`)
- **目标版本** (`tsconfig.json:3` — `"target": "ES2022"` — `[显式]`)
- **模块解析** (`tsconfig.json:5` — `"moduleResolution": "bundler"` — `[显式]`)
- **isolatedModules** (`tsconfig.json:17` — `"isolatedModules": true` — `[显式]`)

### ESLint 规则

- **未使用变量** (`eslint.config.js:22` — `argsIgnorePattern: '^_'` — 参数以 `_` 开头可忽略)
- **any 类型** (`eslint.config.js:23` — `@typescript-eslint/no-explicit-any: 'warn'` — 警告级别)
- **空代码块** (`eslint.config.js:24` — `allowEmptyCatch: true` — 允许空 catch)
- **console 语句** (`eslint.config.js:25` — `no-console: 'off'` — 允许使用)

### Prettier 配置

- **分号** (`.prettierrc:2` — `"semi": true` — 必须使用)
- **引号** (`.prettierrc:3` — `"singleQuote": true` — 单引号)
- **缩进** (`.prettierrc:4` — `"tabWidth": 2` — 2 空格)
- **尾逗号** (`.prettierrc:5` — `"trailingComma": "es5"` — ES5 兼容)
- **行宽** (`.prettierrc:6` — `"printWidth": 100` — 100 字符)
- **换行符** (`.prettierrc:9` — `"endOfLine": "lf"` — Unix 风格)

### 命名规范

- **文件命名** (`CLAUDE.md` — `kebab-case.ts` — 小写短横线)
- **导出方式** (`CLAUDE.md` — Named exports only — 禁用 default export)
- **未使用变量** (`CLAUDE.md` — 以 `_` 前缀标记 — 如 `_unused`)

## 提交规范

### CHANGELOG 强制更新

**规则** (`CLAUDE.md:60-62`):
- 任何源码变更必须同步更新 `CHANGELOG.md`
- 格式: `- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要`
- 用户可见变更追加 `(user-visible)`

### 提交检查清单

1. **规范对齐** — 代码与规范定义一致
2. **强制自检** — 实现与需求完全对齐
3. **CHANGELOG 更新** — 必须添加变更记录
4. **规范文档同步** — `CLAUDE.md` 一并提交

## 测试要求

### 覆盖率阈值

(`vitest.config.ts:11-16`):
- **lines**: 75%
- **functions**: 75%
- **branches**: 65%
- **statements**: 75%

### 测试配置

- **框架** (`vitest.config.ts:5` — `globals: true` — 全局 API)
- **覆盖率工具** (`vitest.config.ts:8` — `provider: 'v8'` — V8 引擎)
- **测试文件** (`vitest.config.ts:6` — `tests/**/*.test.ts` — 统一后缀)
- **覆盖范围** (`vitest.config.ts:9` — `src/**/*.ts` — 排除 CLI 入口)

### 测试命令

```bash
npm test                    # 全量运行
npm run test:watch          # 监听模式
npm run test:coverage       # 生成覆盖率报告
npx vitest run tests/unit/xxx.test.ts  # 单文件
```

## 构建与发布

### 构建工具

- **打包器** (`package.json:10` — `tsup` — 零配置 TypeScript 打包)
- **类型检查** (`package.json:11` — `tsc --noEmit` — 仅检查不输出)

### 运行时要求

- **Node.js** (`package.json:26-28` — `>=20.0.0` — 最低版本)
- **模块类型** (`package.json:5` — `"type": "module"` — ESM only)

### 发布流程

1. **构建检查** — `npm run build` 成功
2. **类型检查** — `npm run typecheck` 通过
3. **测试通过** — `npm test` 覆盖率达标
4. **代码规范** — `npm run lint` 无错误
5. **自动构建** (`package.json:22` — `prepublishOnly` — 发布前自动执行)

## 工作流规范

### 强制流程

(`CLAUDE.md:41-45`):
1. **构思方案** → 明确需求和实现思路
2. **请求审核** → 确认方案可行性
3. **拆解任务** → 分解为具体执行步骤
4. **逐项实现** → 按任务清单执行并自检

### 核心原则

- **简洁至上** — KISS 原则，避免过度工程化
- **追根溯源** — 找到根因，不做临时补丁
- **最小影响** — 变更只触及必要范围
- **规范驱动** — 所有开发活动基于明确规范

## Spec-First 特定约束

1. **规范先行** — 功能开发前必须先定义规范
2. **规范校验** — 代码提交前通过自动化校验
3. **规范追溯** — 每个实现可追溯到规范定义
4. **规范演进** — 规范变更有版本管理和影响分析
