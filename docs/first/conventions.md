# 代码规范

> 本文档基于 `.spec-first/runtime/first/conventions.json` 真源生成

---

## TypeScript 配置

| 约束 | 值 |
|------|-----|
| strict | true |
| verbatimModuleSyntax | true |
| target | ES2022 |
| module | ESNext |
| isolatedModules | true |

---

## ESLint 规则

| 规则 | 级别 | 说明 |
|------|------|------|
| no-unused-vars | error | 未使用变量必须 `_` 前缀 |
| no-explicit-any | warn | 禁止 any 类型 |
| no-empty | warn | 空块警告（允许空 catch） |
| no-console | off | 允许 console |

---

## Prettier 配置

| 选项 | 值 |
|------|-----|
| semi | true |
| singleQuote | true |
| tabWidth | 2 |
| printWidth | 100 |
| trailingComma | es5 |
| endOfLine | lf |

---

## 命名约定

| 类型 | 约定 |
|------|------|
| 文件命名 | kebab-case.ts |
| Core 模块导出 | Named exports only（禁止 default export） |

---

## 测试规范

| 配置 | 值 |
|------|-----|
| Framework | Vitest |
| Globals | enabled |
| Coverage Provider | v8 |

### 覆盖率阈值

| 指标 | 阈值 |
|------|------|
| Lines | 75% |
| Functions | 75% |
| Statements | 75% |
| Branches | 65% |

### 测试目录结构

```
tests/
  unit/        # 单元测试（每模块一文件）
  integration/ # 集成测试
  e2e/         # 端到端测试
  benchmark/   # 性能基准测试
  fixtures/    # 测试固件数据
```

---

## 配置管理

| 类型 | 位置 |
|------|------|
| 共享类型 | `src/shared/types.ts` |
| Gate 真理源 | `src/core/rules/truth-source.ts` |
| Handlebars 模板 | `templates/` |
| 运行时状态 | `.spec-first/` |

---

## 禁止模式

- Core 模块使用 default export
- 未加 `_` 前缀的未使用变量
- 手动编辑 `stage-state.json`
- 手动编辑 `document-links.yaml`

---

## 真源

- `.spec-first/runtime/first/conventions.json`
