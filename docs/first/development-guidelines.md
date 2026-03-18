# 开发规范

> 生成时间: 2026-03-17 | 模式: deep

## 代码风格

### Prettier 配置

| 配置项 | 值 | 证据 |
|--------|-----|------|
| indent | 2 spaces | `.prettierrc` — `[显式]` |
| semi | true | `.prettierrc` — `[显式]` |
| singleQuote | true | `.prettierrc` — `[显式]` |
| tabWidth | 2 | `.prettierrc` — `[显式]` |
| trailingComma | es5 | `.prettierrc` — `[显式]` |
| printWidth | 100 | `.prettierrc` — `[显式]` |
| bracketSpacing | true | `.prettierrc` — `[显式]` |
| arrowParens | always | `.prettierrc` — `[显式]` |
| endOfLine | lf | `.prettierrc` — `[显式]` |

### TypeScript 配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| verbatimModuleSyntax | true | 严格模块语法 |
| strict | true | 严格模式 |
| module | ESNext | ESM 模块 |
| target | ES2022 | 编译目标 |

**证据**: `tsconfig.json` — `[显式]`

## ESLint 规则

| 规则 | 级别 | 说明 | 证据 |
|------|------|------|------|
| noUnusedVars | error | 未使用变量报错（argsIgnorePattern: ^_） | `eslint.config.js` — `[显式]` |
| noExplicitAny | warn | any 类型警告 | `eslint.config.js` — `[显式]` |
| noConsole | off | 允许 console | `eslint.config.js` — `[显式]` |
| noEmpty | warn | 空块警告 | `eslint.config.js` — `[显式]` |

## 测试规范

### Vitest 配置

| 配置项 | 值 | 证据 |
|--------|-----|------|
| framework | Vitest | `vitest.config.ts` — `[显式]` |
| globals | true | `vitest.config.ts` — `[显式]` |

### 覆盖率阈值

| 指标 | 阈值 | 证据 |
|------|------|------|
| Lines | 75% | `vitest.config.ts:18-25` — `[显式]` |
| Functions | 75% | `vitest.config.ts:18-25` — `[显式]` |
| Branches | 65% | `vitest.config.ts:18-25` — `[显式]` |
| Statements | 75% | `vitest.config.ts:18-25` — `[显式]` |

### 测试结构

```
tests/
├── unit/        # 单元测试（每模块一文件）
├── integration/ # 集成测试
├── e2e/         # 端到端测试
├── benchmark/   # 性能基准测试
└── fixtures/    # 测试固件数据
```

## 提交规范

### CHANGELOG 格式

```
- v{VERSION} {DATE} {Author}: {type}({scope}): {message}
```

**证据**: `CHANGELOG.md` — `[显式]`

### 提交类型

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| refactor | 重构 |
| test | 测试相关 |
| docs | 文档 |
| chore | 杂项 |

**证据**: `conventions.json:commit.types` — `[显式]`

## 依赖管理

### 包管理器

- **推荐**: pnpm
- **替代**: npm

**证据**: `conventions.json:dependencies.packageManager` — `[显式]`

### Node.js 版本

- **最低版本**: >=20.0.0

**证据**: `package.json:engines` — `[显式]`

### 模块系统

- **ESM only**: 全项目使用 ESM（`type: module`）
- **Named exports only**: core 模块禁止使用 default export

**证据**: `package.json:5`, `CLAUDE.md:59` — `[显式]`

## 禁忌模式

| 禁止操作 | 原因 | 正确做法 |
|----------|------|----------|
| 手动编辑 `stage-state.json` | 状态机不可逆，会导致状态损坏 | 使用 `spec-first stage advance` |
| 手动编辑 `traceability-matrix.md` | 覆盖率会失准 | 使用 `spec-first matrix sync` |
| 手动编辑 `.spec-first/runtime/` 状态文件 | 数据污染、审计日志断裂 | 使用对应 CLI 子命令 |
| 在 core 模块使用 default export | 违反项目约定 | 使用 named export |
| 使用 CommonJS 语法 | 全项目 ESM only | 使用 `import/export` |

**证据**: `CLAUDE.md:31-49` — `[显式]`
