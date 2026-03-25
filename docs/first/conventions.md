# 编码规范与约定

> 本文档基于 `.spec-first/runtime/first/` 下的真源资产生成，所有结论附带证据路径。

---

## TypeScript 配置

### 编译选项

项目使用严格模式 TypeScript 配置，关键选项如下：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `strict` | `true` | 启用所有严格类型检查 |
| `target` | `ES2022` | 编译目标版本 |
| `module` | `ESNext` | 模块系统 |
| `verbatimModuleSyntax` | `true` | 强制显式类型导入 |

**证据**: `tsconfig.json:1-22 (TypeScript config)`

---

## 代码风格

### 命名约定

| 类别 | 约定 | 示例 |
|------|------|------|
| 文件 | `kebab-case.ts` | `stage-machine.ts`, `id-generator.ts` |
| 变量 | `camelCase` | `featureId`, `projectRoot` |
| 全局常量 | `UPPER_SNAKE_CASE` | `TRANSITIONS`, `RELEASE_REQUIRED_ARTIFACTS` |
| 局部常量 | `camelCase` | `result`, `config` |
| 类/接口/类型 | `PascalCase` | `GateResult`, `FeatureState` |
| 未使用变量 | `_` 前缀 | `_unused`, `_temp` |

**证据**:
- `eslint.config.js:1-28 (ESLint rules)`
- `src/core/**/*.ts (文件命名实践)`

### 导出规范

```typescript
// 正确: Named exports only
export function evaluateGate() { ... }
export const TRANSITIONS = { ... }

// 禁止: Default export (core 模块)
export default function() { ... }  // 禁止
```

**规则**:
- Core 模块禁止使用 `default export`
- 使用显式 named re-exports 通过 `index.ts`
- Barrel exports 集中在 `index.ts`

**证据**: `src/cli/index.ts:1-50 (named exports pattern)`

### 格式化配置

Prettier 配置（`.prettierrc`）:

| 配置项 | 值 |
|--------|-----|
| semi | true |
| singleQuote | true |
| tabWidth | 2 |
| trailingComma | es5 |
| printWidth | 100 |
| bracketSpacing | true |
| arrowParens | always |
| endOfLine | lf |

**证据**: `.prettierrc:1-10 (Prettier config)`

---

## 模块系统

### ESM Only

项目强制使用 ESM 模块系统：

```json
// package.json
{
  "type": "module"
}
```

**约束**:
- 全项目 `"type": "module"`
- 禁止 CommonJS 语法（`require`, `module.exports`）
- 使用 `import/export` 语法

**证据**: `package.json:5 (ESM declaration)`

### Node.js 版本

```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

**证据**: `package.json:31-33 (engines requirement)`

---

## 测试规范

### 测试框架

使用 Vitest 作为测试框架，配置如下：

| 配置项 | 值 |
|--------|-----|
| Framework | Vitest 1.6+ |
| Globals | enabled |
| Coverage Provider | v8 |

### 覆盖率阈值

| 指标 | 阈值 |
|------|------|
| Lines | 75% |
| Functions | 75% |
| Statements | 75% |
| Branches | 65% |

**证据**: `vitest.config.ts:1-19 (Vitest config)`

### 测试目录结构

```
tests/
  unit/        # 单元测试（每模块一文件）
  integration/ # 集成测试
  e2e/         # 端到端测试
  benchmark/   # 性能基准测试
  fixtures/    # 测试固件数据
```

**测试文件命名**: `tests/**/*.test.ts`

**证据**: `CLAUDE.md:47-55 (test structure)`

---

## Git 约定

### Commit 格式

```
type(scope): message

# 示例
feat(gate-engine): add command gate support
fix(trace-engine): correct ID sequence calculation
refactor(cli): simplify router dispatch logic
docs(readme): update installation guide
test(process-engine): add stage transition tests
chore(deps): upgrade typescript to 5.4
```

**类型列表**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

**用户可见变更**: 末尾添加 `(user-visible)`

**AI 生成提交**: 作者标注为 `Claude`

**证据**: `CHANGELOG.md:1-50 (commit message examples)`

### 分支命名

```
leo-YYYY-MM-DD[-description]

# 示例
leo-2026-03-24
leo-2026-03-25-skills-flat-migration
```

**主分支**: `main`

**证据**: `CLAUDE.md:66-67 (branch naming)`

---

## 类型定义约定

### 集中管理

所有核心类型定义集中在 `src/shared/types.ts`:

- `Stage` enum（阶段枚举）
- `ExitCode` enum（退出码）
- `FeatureState` interface（Feature 状态）
- `GateResult` interface（Gate 结果）
- `RfcRecord` interface（RFC 记录）
- `DefectRecord` interface（缺陷记录）

**证据**: `src/shared/types.ts:1-100 (type definitions, Stage enum)`

---

## 架构模式

### 双层架构

```
+------------------+
|   Skill Layer    |  <- 流程编排、AI 触发
+------------------+
         |
         v
+------------------+
|    CLI Layer     |  <- 确定性原子能力
+------------------+
```

- **Skill 层**: 流程编排与 AI 交互
- **CLI 层**: 确定性原子能力，不依赖 AI

**证据**: `skills/README.md:11-26`

### 阶段状态机

单向不可逆流转：

```
00_init
   |
   v
01_specify
   |
   v
02_design
   |
   v
03_plan
   |
   v
04_implement
   |
   v
05_verify
   |
   v
06_wrap_up
   |
   v
07_release
   |
   +---> 08_done
   |
   +---> 09_cancelled
```

**证据**: `src/shared/types.ts, src/core/process-engine/stage-machine.ts`

### 追溯 ID 体系

14 类 ID 支持：

| 类别 | ID 类型 | 说明 |
|------|---------|------|
| 业务链路 | FR, DS, TASK, TC, RFC | 需求、设计、任务、测试、变更 |
| V-Model | REQ, SYS, ARCH, MOD | 系统工程层级 |
| V-Model | ATP, STP, ITP, UTP | 验收/系统/集成/单元测试 |
| 顶层 | Feature | Feature 标识 |

**证据**: `src/core/trace-engine/id-taxonomy.ts`

---

## 风险与约束

### 高风险：状态文件安全

**问题**: `stage-state.json` 等状态文件不可逆，手动编辑会导致 Gate 校验失准

**缓解**: 强制使用 CLI 命令（`spec-first stage advance`），禁止手动编辑

**证据**: `CLAUDE.md:10-25`

### 中风险：模块边界

**问题**: Core 模块间可能存在循环依赖或边界模糊

**缓解**: 使用 `src/shared/types.ts` 集中类型定义，core 模块间通过接口解耦

**证据**: `src/shared/types.ts`

### 中风险：测试覆盖率

**问题**: 部分核心模块可能未达到 75% 覆盖率阈值

**缓解**: 运行 `npm run test:coverage` 验证，补充缺失测试

---

## 证据路径汇总

| 规范类别 | 证据文件 |
|----------|----------|
| TypeScript 配置 | `tsconfig.json:1-22` |
| ESLint 规则 | `eslint.config.js:1-28` |
| Prettier 配置 | `.prettierrc:1-10` |
| Vitest 配置 | `vitest.config.ts:1-19` |
| 依赖与脚本 | `package.json:1-102` |
| 项目约定 | `CLAUDE.md:1-184` |
| 类型定义 | `src/shared/types.ts:1-100` |
| 提交示例 | `CHANGELOG.md:1-50` |
| 导出模式 | `src/cli/index.ts:1-50` |
| Skill 架构 | `skills/README.md:11-26` |

---

## 核心依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| handlebars | ^4.7.8 | 模板引擎 |
| js-yaml | ^4.1.0 | YAML 配置解析 |
| semver | ^7.7.4 | 版本管理 |
| update-notifier | ^7.0.0 | 更新通知 |
| eslint | ^10.0.2 | 代码检查 |
| prettier | ^3.8.1 | 代码格式化 |
| typescript-eslint | ^8.56.1 | TS ESLint 规则 |

**证据**: `package.json:75-101 (dependencies)`
