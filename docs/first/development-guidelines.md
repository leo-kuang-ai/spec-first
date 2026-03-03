---
last_updated: 2026-03-03
mode: deep
project_type: backend
---

# 研发规范

> **项目**: spec-first
> **版本**: 0.5.45
> **模式**: deep

## 1. 代码风格规范

### 1.1 ESLint 配置

项目使用 **ESLint 10.0.2** + **typescript-eslint 8.56.1** 进行代码检查。

**核心规则**:

| 规则 | 级别 | 说明 |
|------|------|------|
| `@typescript-eslint/no-unused-vars` | error | 未使用变量报错（`_` 前缀参数除外） |
| `@typescript-eslint/no-explicit-any` | warn | 使用 `any` 类型发出警告 |
| `no-empty` | warn | 空块警告（允许空 catch） |
| `no-console` | off | 允许使用 console |

**忽略目录**:
- `dist/**` - 构建产物
- `node_modules/**` - 依赖包
- `coverage/**` - 测试覆盖率
- `packages/**` - 子包
- `scripts/**/*.js` - 脚本文件
- `templates/**` - 模板文件
- `skills/**` - Skill 定义

**配置示例** (`eslint.config.js`):

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-console': 'off',
    },
  },
);
```

### 1.2 Prettier 配置

项目使用 **Prettier 3.8.1** 进行代码格式化。

**格式化规则**:

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `semi` | true | 使用分号 |
| `singleQuote` | true | 使用单引号 |
| `tabWidth` | 2 | 缩进 2 空格 |
| `trailingComma` | 'es5' | ES5 尾随逗号 |
| `printWidth` | 100 | 每行最大 100 字符 |
| `bracketSpacing` | true | 对象字面量空格 |
| `arrowParens` | 'always' | 箭头函数参数括号 |
| `endOfLine` | 'lf' | Unix 换行符 |

**配置示例** (`.prettierrc`):

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 1.3 代码质量命令

```bash
# 代码检查
npm run lint           # ESLint 检查
npm run lint:fix       # ESLint 自动修复

# 代码格式化
npm run format         # Prettier 格式化

# 类型检查
npm run typecheck      # TypeScript 类型检查
```

## 2. 提交规范

### 2.1 提交消息规范

项目要求所有代码提交必须同步更新 `CHANGELOG.md`。

**记录格式**:

```
- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要
```

**示例**:

```
- v0.5.46 2026-03-03 Claude: 新增开发规范文档 (user-visible)
- v0.5.45 2026-03-02 Leo: 修复 Skill 分发路径问题
```

**用户可见变更**: 在末尾追加 `(user-visible)` 标记

### 2.2 提交前检查清单

- [ ] 代码通过 `npm run lint` 检查
- [ ] 代码通过 `npm run typecheck` 类型检查
- [ ] 测试通过 `npm test`
- [ ] 更新 `CHANGELOG.md` 记录
- [ ] 同步提交 `CLAUDE.md` 规范文档

### 2.3 Git Hooks

项目暂未使用 commitlint 或 husky，但建议遵循以下实践:

1. **提交前自检** - 确保代码质量
2. **原子提交** - 每次提交只做一件事
3. **规范消息** - 使用清晰的提交消息

## 3. 测试规范

### 3.1 Vitest 配置

项目使用 **Vitest 1.6.1** 作为测试框架。

**配置概览** (`vitest.config.ts`):

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,              // 启用全局 API
    include: ['tests/**/*.test.ts'],  // 测试文件匹配
    coverage: {
      provider: 'v8',           // 使用 v8 覆盖率
      include: ['src/**/*.ts'], // 包含源码
      exclude: ['src/cli/index.ts'],  // 排除入口
      thresholds: {
        lines: 75,              // 行覆盖率 ≥75%
        functions: 75,          // 函数覆盖率 ≥75%
        branches: 65,           // 分支覆盖率 ≥65%
        statements: 75,         // 语句覆盖率 ≥75%
      },
    },
  },
});
```

### 3.2 测试目录结构

```
tests/
├── unit/          # 单元测试（77 个文件）
├── integration/   # 集成测试
├── e2e/           # 端到端测试
├── benchmark/     # 性能基准测试
└── fixtures/      # 测试固件数据
```

### 3.3 测试命令

```bash
# 运行测试
npm test                      # 全量测试
npm run test:watch            # 监听模式
npm run test:coverage         # 覆盖率报告

# 单文件测试
npx vitest run tests/unit/fs-utils.test.ts

# 按名称匹配
npx vitest run -t "test name pattern"

# 性能基准
npm run bench
```

### 3.4 测试覆盖率要求

| 指标 | 阈值 |
|------|------|
| 行覆盖率 | ≥ 75% |
| 函数覆盖率 | ≥ 75% |
| 分支覆盖率 | ≥ 65% |
| 语句覆盖率 | ≥ 75% |

### 3.5 测试编写规范

**命名约定**:
- 测试文件: `*.test.ts`
- 描述性测试名: 使用中文或英文清晰描述测试场景

**示例**:

```typescript
import { describe, it, expect } from 'vitest';

describe('FeatureManager', () => {
  it('应该正确创建新的 Feature', () => {
    // Arrange
    const manager = new FeatureManager();

    // Act
    const feature = manager.create('test-feature');

    // Assert
    expect(feature.name).toBe('test-feature');
  });

  it('当 Feature 已存在时应该抛出错误', () => {
    // ...
  });
});
```

## 4. TypeScript 规范

### 4.1 编译配置

项目使用 **TypeScript 5.4+**，启用严格模式。

**核心配置** (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "target": "ES2022",           // 编译目标
    "module": "ESNext",           // 模块系统
    "moduleResolution": "bundler", // 模块解析
    "lib": ["ES2022"],            // 运行时库
    "strict": true,               // 严格模式
    "esModuleInterop": true,      // ESM 互操作
    "verbatimModuleSyntax": true, // 精确模块语法
    "declaration": true,          // 生成声明文件
    "declarationMap": true,       // 声明文件映射
    "sourceMap": true,            // 源码映射
    "isolatedModules": true       // 独立模块编译
  }
}
```

### 4.2 类型规范

**命名约定**:
- **接口**: PascalCase（如 `FeatureConfig`）
- **类型别名**: PascalCase（如 `StageType`）
- **枚举**: PascalCase，成员 UPPER_SNAKE_CASE（如 `Stage.00_INIT`）

**类型定义位置**:
- 共享类型: `src/shared/types.ts`
- 模块类型: 模块目录内 `types.ts` 或内联定义

**示例**:

```typescript
// 共享类型定义 (src/shared/types.ts)
export enum Stage {
  '00_init' = '00_init',
  '01_specify' = '01_specify',
  // ...
}

export type TraceId = `FR-${string}` | `DS-${string}` | `TASK-${string}`;

// 模块类型定义
export interface FeatureConfig {
  name: string;
  stage: Stage;
  traceIds: TraceId[];
}
```

### 4.3 模块规范

**ESM Only**:
- 全项目使用 `"type": "module"`
- 使用 `import/export` 语法
- 禁止 `require()` 和 `module.exports`

**Named Exports**:
- 核心模块使用命名导出
- 避免默认导出（default export）

**示例**:

```typescript
// ✅ 推荐
export function createFeature(name: string): Feature {
  // ...
}

export class FeatureManager {
  // ...
}

// ❌ 避免
export default class FeatureManager {
  // ...
}
```

## 5. 命名约定

### 5.1 文件命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 源文件 | kebab-case.ts | `feature-manager.ts` |
| 测试文件 | kebab-case.test.ts | `feature-manager.test.ts` |
| 配置文件 | kebab-case.config.ts | `vitest.config.ts` |
| 类型文件 | types.ts | `types.ts` |

### 5.2 变量命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 变量 | camelCase | `featureName` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 私有变量 | _camelCase | `_internalState` |
| 未使用参数 | _name | `_unusedParam` |

### 5.3 函数命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 函数 | camelCase | `createFeature()` |
| 异步函数 | camelCase + Async 后缀（可选） | `loadConfigAsync()` |
| 工厂函数 | create* | `createFeatureManager()` |
| 判断函数 | is*/has*/should* | `isValidFeature()` |

### 5.4 类与接口命名

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 类 | PascalCase | `FeatureManager` |
| 接口 | PascalCase | `FeatureConfig` |
| 类型别名 | PascalCase | `StageType` |
| 枚举 | PascalCase | `Stage` |
| 枚举成员 | UPPER_SNAKE_CASE 或 数字 | `Stage.00_init` |

### 5.5 特殊约定

**追溯 ID 类型**:
- 格式: `TYPE-IDENTIFIER`
- 类型: FR, DS, TASK, TC, RFC, REQ, SYS, ARCH, MOD, ATP, STP, ITP, UTP, Feature
- 示例: `FR-001`, `TASK-042`

**Stage 枚举**:
```
00_init → 01_specify → 02_design → 03_plan → 04_implement
→ 05_verify → 06_wrap_up → 07_release → 08_done / 09_cancelled
```

## 6. Spec-First 特定规范

### 6.1 规范驱动开发

**核心原则**:
1. **规范先行** - 功能开发前必须定义规范
2. **规范校验** - 代码提交前必须通过规范校验
3. **规范追溯** - 每个实现必须能追溯到规范
4. **规范演进** - 规范变更必须有版本管理

### 6.2 代码变动铁律

**强制自检**:
- 任何代码新增/删除/修改后必须自检
- 确保实现与需求完全对齐
- 规范对齐检查：代码必须与规范定义一致

**CHANGELOG.md 更新**:
- 格式: `- vX.Y.Z YYYY-MM-DD 作者: 一句话摘要`
- 用户可见变更追加 `(user-visible)`
- 无记录的代码变动一律拒绝

**规范文档同步**:
- 每次提交必须包含 `CLAUDE.md`
- 确保规范文档与代码一致

### 6.3 工作流规范

**强制流程**:
1. **构思方案** → 明确需求和实现思路
2. **请求审核** → 确认方案可行性
3. **拆解任务** → 分解为具体执行步骤
4. **逐项实现** → 按任务清单执行并自检

**Plan 模式优先**:
- 非简单任务（3+ 步骤）必须进入 plan mode
- 前期写清楚详细 spec，减少歧义
- 遇到偏差立即重新规划

## 7. 代码审查清单

### 7.1 提交前自检

- [ ] 代码风格符合 ESLint 规则
- [ ] 代码格式符合 Prettier 配置
- [ ] 类型检查通过（无 TypeScript 错误）
- [ ] 测试覆盖率达标（≥75%）
- [ ] 所有测试通过
- [ ] CHANGELOG.md 已更新
- [ ] CLAUDE.md 已同步提交

### 7.2 代码质量检查

- [ ] 无 `any` 类型（或已标记为警告）
- [ ] 无未使用变量（`_` 前缀除外）
- [ ] 命名清晰且符合约定
- [ ] 复杂逻辑有注释说明
- [ ] 错误处理完善
- [ ] 无硬编码路径或配置

### 7.3 规范对齐检查

- [ ] 代码实现与规范定义一致
- [ ] 所有实现可追溯到规范
- [ ] 规范变更已完成版本管理
- [ ] 影响分析已完成

## 8. 工具链集成

### 8.1 IDE 配置建议

**VS Code 推荐插件**:
- ESLint
- Prettier - Code formatter
- TypeScript Hero
- Vitest

**推荐配置** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### 8.2 构建流程

```bash
# 完整构建流程
npm run lint           # 1. 代码检查
npm run typecheck      # 2. 类型检查
npm test               # 3. 运行测试
npm run build          # 4. 构建产物
```

### 8.3 CI/CD 建议

**检查项**:
1. Lint 检查
2. 类型检查
3. 测试覆盖率
4. 构建产物

**示例 CI 配置**:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage
      - run: npm run build
```

---

*此文档由 deep 模式生成，基于项目配置文件与 CLAUDE.md 规范。*
