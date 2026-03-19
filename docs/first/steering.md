# 技术栈与架构约束

## 技术选型

### 核心框架

| 组件 | 选型 | 版本 |
|------|------|------|
| Runtime | Node.js | ≥20.0.0 |
| Language | TypeScript | 5.4+ |
| Module System | ESM | - |
| Build | tsup | 8.5+ |
| Test | Vitest | 1.6+ |

### TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true
  }
}
```

## 架构约束

### 强制规则

1. **ESM Only** — 全项目 `"type": "module"`，使用 `import/export`
2. **Named Exports Only** — core 模块禁止 default export
3. **Strict Mode** — TypeScript 严格模式
4. **显式类型导入** — `verbatimModuleSyntax` 强制 `import type`
5. **覆盖率阈值** — lines/functions/statements 75%, branches 65%

### 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| 文件 | kebab-case.ts | `stage-machine.ts` |
| 变量 | camelCase | `featureId` |
| 函数 | camelCase | `handleInit()` |
| 类 | PascalCase | `StageMachine` |
| 未使用变量 | _前缀 | `_unused` |

### 测试要求

- 框架：Vitest (globals enabled)
- 结构：`tests/unit/` | `tests/integration/` | `tests/e2e/`
- 命名：`*.test.ts`
- 覆盖率：lines/functions/statements 75%, branches 65%

## 架构决策

### 1. Stage 状态机

- **决策**：使用单向不可逆的状态机驱动 Feature 生命周期
- **原因**：确保开发流程有序，防止阶段回退导致混乱
- **实现**：`src/core/process-engine/stage-machine.ts`

### 2. 三层 Skill 路由

- **决策**：Semantic Map → Runtime Route → Skill File
- **原因**：支持复合命令映射，解耦 CLI 与 Skill 定义
- **实现**：`src/core/skill-runtime/dispatcher.ts`

### 3. 文件系统存储

- **决策**：使用 JSON + Markdown 文件存储状态
- **原因**：无需数据库，便于版本控制和审计
- **实现**：`specs/{featureId}/` 目录

## 证据来源

- TypeScript 配置 (`tsconfig.json:1-22`) — 显式
- ESLint 配置 (`eslint.config.js:1-28`) — 显式
- 测试配置 (`vitest.config.ts:1-19`) — 显式
- 包配置 (`package.json:5,27-29`) — 显式
