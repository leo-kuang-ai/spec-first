# 代码规范

## 命名约定

### 文件命名

- **规则**：kebab-case.ts
- **示例**：`stage-machine.ts`, `gate-evaluator.ts`, `id-generator.ts`

### 变量与函数

| 类型 | 规则 | 示例 |
|------|------|------|
| 变量 | camelCase | `featureId`, `currentStage` |
| 函数 | camelCase | `handleInit()`, `loadStageState()` |
| 类 | PascalCase | `StageMachine`, `GateEvaluator` |
| 常量 | SCREAMING_SNAKE_CASE | `TERMINAL_STAGES`, `GATE_CONDITIONS` |
| 枚举 | PascalCase | `Stage`, `ExitCode`, `IdType` |

### 导出规则

- **Named Exports Only** — core 模块禁止 default export
- **示例**：
  ```typescript
  // ✅ 正确
  export function handleInit() { ... }
  export const TERMINAL_STAGES = new Set([...]);

  // ❌ 错误
  export default function handleInit() { ... }
  ```

### 未使用变量

- **规则**：使用 `_` 前缀标记未使用变量
- **ESLint 配置**：`argsIgnorePattern: '^_'`
- **示例**：
  ```typescript
  // ✅ 正确
  function handler(_event, context) { ... }
  ```

## 代码风格

### 模块系统

- **ESM Only** — 全项目 `"type": "module"`
- **显式类型导入** — `verbatimModuleSyntax` 强制 `import type`

```typescript
// ✅ 正确
import type { Stage } from './types.js';
import { handleInit } from './init.js';

// ❌ 错误
import { Stage } from './types.js'; // 应使用 import type
```

### TypeScript 配置

```json
{
  "strict": true,
  "verbatimModuleSyntax": true,
  "isolatedModules": true,
  "target": "ES2022",
  "module": "ESNext"
}
```

### 注释规范

- **文件头注释**：描述模块职责
- **函数注释**：描述参数、返回值、副作用
- **TODO 注释**：格式 `// TODO: 描述`

```typescript
/**
 * Feature 初始化
 * 幂等：已存在的 Feature 不覆盖，直接返回
 */
export function init(opts: InitOptions): InitResult { ... }
```

## 测试规范

### 测试框架

- **框架**：Vitest (globals enabled)
- **覆盖率阈值**：
  - lines: 75%
  - functions: 75%
  - branches: 65%
  - statements: 75%

### 测试目录结构

```
tests/
├── unit/          # 单元测试
├── integration/   # 集成测试
├── e2e/           # 端到端测试
├── fixtures/      # 测试固件
└── helpers/       # 测试工具
```

### 测试文件命名

- **规则**：`*.test.ts`
- **示例**：`router.test.ts`, `skill-runtime.test.ts`

### 测试示例

```typescript
describe('StageMachine', () => {
  it('should advance stage when gate passes', () => {
    const result = advanceStage(featureId, projectRoot);
    expect(result.success).toBe(true);
  });
});
```

## Git 规范

### 分支命名

- **格式**：描述性名称，如 `leo-2026-03-19`, `feature/init-command`

### 提交格式

- **遵循**：Conventional Commits
- **格式**：`type(scope): message`
- **示例**：
  - `feat(cli): add status command`
  - `fix(gate): correct condition evaluation`
  - `docs(readme): update installation guide`

## 证据来源

- ESLint 配置 (`eslint.config.js:22`) — `argsIgnorePattern: '^_'` — 显式
- TypeScript 配置 (`tsconfig.json:9,18`) — `strict`, `verbatimModuleSyntax` — 显式
- 测试配置 (`vitest.config.ts:11-16`) — 覆盖率阈值 — 显式
- 文件命名分析 — kebab-case.ts — 显式
