# 代码规范

> 本文档定义 spec-first 项目的代码风格、命名约定、文件组织和测试标准。

---

## 1. 模块系统

### 1.1 ESM Only

- 项目使用 ESM 模块系统 (`"type": "module"`) (`package.json:5` — `"type": "module"` — `[显式]`)
- 禁止使用 CommonJS 语法（`require`、`module.exports`）

### 1.2 导出规范

- **core 模块禁止使用 default export**，仅使用 named exports (`CLAUDE.md:217` — Named exports only — `[显式]`)
- 示例：
  ```typescript
  // 正确
  export function foo() {}
  export const bar = 1;

  // 错误
  export default function foo() {}
  ```

---

## 2. 文件与命名约定

### 2.1 文件命名

- TypeScript 文件使用 **kebab-case** 命名 (`CLAUDE.md:219` — 文件命名: kebab-case.ts — `[显式]`)
- 示例：`process-engine.ts`、`gate-checker.ts`

### 2.2 类型命名

- 类型/接口使用 **PascalCase**
- 函数/变量使用 **camelCase**

### 2.3 未使用变量

- 未使用的变量使用 `_` 前缀 (`eslint.config.js:22` — `argsIgnorePattern: '^_', varsIgnorePattern: '^_'` — `[显式]`)
- 示例：
  ```typescript
  const [_unused, used] = result;
  ```

### 2.4 类型集中定义

- 核心类型集中在 `src/shared/types.ts` (`CLAUDE.md:220` — 类型集中: src/shared/types.ts — `[显式]`)
- 包括：Stage enum、ExitCode、ID types 等

---

## 3. TypeScript 配置

### 3.1 编译选项

| 选项 | 值 | 说明 |
|------|-----|------|
| `target` | ES2022 | 输出目标 |
| `strict` | true | 严格模式 |
| `verbatimModuleSyntax` | true | 显式 import type |
| `isolatedModules` | true | 每文件独立编译 |

来源：`tsconfig.json:3-18` — compilerOptions — `[显式]`

### 3.2 常见问题

- `verbatimModuleSyntax` 要求显式使用 `import type { X }`
- `isolatedModules` 要求每个文件可独立编译，不支持跨文件类型推断

---

## 4. Lint 规则

### 4.1 工具链

- ESLint + typescript-eslint (`eslint.config.js` — `[显式]`)

### 4.2 关键规则

| 规则 | 级别 | 说明 |
|------|------|------|
| `no-unused-vars` | error | 未使用变量需 `_` 前缀 |
| `@typescript-eslint/no-explicit-any` | warn | 警告使用 any |
| `no-empty` | warn | 允许空 catch |

来源：`eslint.config.js:22-24` — `[显式]`

### 4.3 忽略目录

```javascript
ignores: ["dist/**", "node_modules/**", "coverage/**", "packages/**", "*.js", "*.d.ts"]
```

来源：`eslint.config.js:8-18` — ignores — `[显式]`

---

## 5. 格式化规则

### 5.1 工具

- Prettier (`.prettierrc` — `[显式]`)

### 5.2 配置

| 选项 | 值 |
|------|-----|
| `semi` | true |
| `singleQuote` | true |
| `tabWidth` | 2 |
| `trailingComma` | es5 |
| `printWidth` | 100 |
| `bracketSpacing` | true |
| `arrowParens` | always |
| `endOfLine` | lf |

来源：`.prettierrc:1-10` — 完整配置 — `[显式]`

---

## 6. 测试标准

### 6.1 框架与配置

- **框架**：Vitest，启用 globals (`vitest.config.ts` — `[显式]`)
- **覆盖率工具**：@vitest/coverage-v8

### 6.2 目录结构

```
tests/
  unit/        # 单元测试（每模块一文件）
  integration/ # 集成测试
  e2e/         # 端到端测试
  benchmark/   # 性能基准测试
  fixtures/    # 测试固件数据
```

来源：`CLAUDE.md:223-231` — `[显式]`

### 6.3 覆盖率阈值

| 指标 | 阈值 |
|------|------|
| lines | 75% |
| functions | 75% |
| statements | 75% |
| branches | 65% |

来源：`vitest.config.ts:1-19` — 完整配置 — `[显式]`

---

## 7. Git 与 Commit 规范

### 7.1 CHANGELOG 更新

每次 `src/` 下 `.ts` 文件变更后**必须更新** `CHANGELOG.md` (`CLAUDE.md:50-52` — CHANGELOG.md 主动更新 — `[显式]`)

格式：
```markdown
- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要 (user-visible)
```

**豁免条件**（必须全部满足）：
1. 仅修改 `.md`/`.yaml` 文件
2. 不涉及 `package.json`、`src/shared/types.ts`、`src/core/rules/truth-source.ts`
3. 不删除测试用例
4. 不修改覆盖率阈值配置

### 7.2 CLAUDE.md 同步

每次 commit 将 `CLAUDE.md` 纳入提交范围 (`CLAUDE.md:53` — CLAUDE.md 同步提交 — `[显式]`)

---

## 8. 项目核心原则

### 8.1 KISS + 最小影响

变更只触及必要范围，找根因，不打临时补丁 (`CLAUDE.md:37` — KISS + 最小影响 — `[显式]`)

### 8.2 规范驱动

任何实现必须能追溯到对应规范定义（FR/DS/TASK） (`CLAUDE.md:38` — 规范驱动 — `[显式]`)

### 8.3 禁止手动编辑的文件

以下文件**只能通过 CLI 操作** (`CLAUDE.md:13-17` — 禁止手动编辑的文件 — `[显式]`)：

| 文件 | 正确操作 |
|------|---------|
| `stage-state.json` | `spec-first stage advance` |
| `traceability-matrix.md` | `spec-first matrix sync` |
| `specs/` 下状态与报告文件 | 对应 CLI 子命令 |

### 8.4 Plan 模式触发条件

满足以下任一条件必须进入 Plan 模式 (`CLAUDE.md:92-96` — Plan 模式触发条件 — `[显式]`)：

- 修改 3+ 个文件
- 新增或删除公开导出（public exports）
- 涉及 `src/core/` 核心逻辑且变更函数签名/导出接口/状态机逻辑
- 变更 Stage 枚举、ID 体系、Gate 条件

### 8.5 小改动排除

以下文件变更即使看似"小改动"也**必须走完整流程** (`CLAUDE.md:72-73` — 小改动排除 — `[显式]`)：

- `src/shared/types.ts`（Stage/ID 体系）
- `src/core/rules/truth-source.ts`（Gate 真理源）
- 任何 `index.ts` 重导出变更（影响公开 API）

---

## 9. 强制自检清单

每次 `src/` 下 `.ts` 文件变更后必须执行 (`CLAUDE.md:40-48` — 代码变动铁律 — `[显式]`)：

```markdown
自检清单
[ ] 1. npm run typecheck — 已通过
[ ] 2. npm test — 已通过 / 受影响范围已通过
[ ] 3. CHANGELOG.md — 已更新 / 豁免（原因：____）
[ ] 4. 变更范围 — 已确认仅限必要文件
```

---

## 10. 输出语言规范

- 默认输出语言：**中文** (`CLAUDE.md:237-239` — 输出规范 — `[显式]`)
- 技术术语保留英文原文（TypeScript、Vitest、Feature、Gate、Stage）
- 代码标识符保留英文原文
- 专有名词保留英文（npm、pnpm、ESM、CommonJS）
