# 代码规范

> 基于 `.spec-first/runtime/first/conventions.json` 生成

## TypeScript 规则

| 配置项 | 值 |
|--------|-----|
| 语言版本 | TypeScript >=5.4 |
| 严格模式 | `strict: true` |
| 模块语法 | `verbatimModuleSyntax` |
| 模块系统 | ESM (`"type": "module"`) |

## 文件命名

- 使用 `kebab-case.ts` 格式
- 示例：`process-engine.ts`、`gate-engine.ts`

## 导出约定

- **仅使用命名导出**：core 模块禁止使用 `default export`
- **未使用变量前缀**：使用 `_` 前缀（eslint 规则 `^_`）

```typescript
// 正确
export function processData() {}
export const STATUS_ACTIVE = 'active';

// 错误
export default function processData() {}
```

## 类型集中管理

- 所有核心类型定义集中在 `src/shared/types.ts`
- 包括：Stage 枚举、ExitCode、ID types

## 测试规范

| 配置项 | 值 |
|--------|-----|
| 测试框架 | Vitest |
| 全局变量 | 启用 (`globals: true`) |
| 覆盖率工具 | v8 |
| 覆盖率阈值 | 75% |

### 测试目录结构

```
tests/
  unit/        # 单元测试（每模块一文件）
  integration/ # 集成测试
  e2e/         # 端到端测试
  benchmark/   # 性能基准测试
  fixtures/    # 测试固件数据
```

## Lint/Format

| 工具 | 命令 |
|------|------|
| ESLint | `npm run lint` |
| ESLint (自动修复) | `npm run lint:fix` |
| Prettier | `npm run format` |

- Lint 工具链：`eslint` + `typescript-eslint` + `prettier`

## 构建

| 配置项 | 值 |
|--------|-----|
| 打包工具 | tsup |
| 构建命令 | `npm run build` |

## 核心依赖

- `handlebars` - 模板引擎
- `js-yaml` - YAML 配置解析
- `semver` - 版本管理
- `update-notifier` - 更新通知

## 模板与配置

| 用途 | 工具 |
|------|------|
| 模板引擎 | Handlebars |
| 配置格式 | js-yaml |
