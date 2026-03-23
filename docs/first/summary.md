# Spec-First 项目摘要

> 基于 `.spec-first/runtime/first/summary.json` 真源生成

---

## 基本事实

| 属性 | 值 |
|------|-----|
| 项目名 | spec-first |
| 版本 | 1.1.4 |
| 主类型 | backend |
| 子类型 | cli-tool |

---

## 入口

| 入口 | 路径 |
|------|------|
| CLI | `src/cli/index.ts` |
| Bin | `dist/cli/index.js` |

---

## 技术栈详情

| 分类 | 技术 |
|------|------|
| Runtime | Node.js >=20 |
| Module | ESM |
| Language | TypeScript ^5.4 (strict, verbatimModuleSyntax) |
| Bundler | tsup |
| Test | Vitest (v8 coverage) |
| Lint | eslint + typescript-eslint |
| Format | Prettier |
| Templates | Handlebars |
| Config | js-yaml |

---

## 核心模块列表

1. `process-engine`
2. `skill-runtime`
3. `ai-orchestrator`
4. `gate-engine`
5. `trace-engine`
6. `change-mgr`
7. `template`
8. `tool-integration`
9. `metrics-engine`
10. `validators`
11. `task-plan`
12. `rules`
13. `batch-executor`
14. `migrations`

---

## 规模统计

- CLI 命令数：27
- Skills 数：20

---

## 真源

- `.spec-first/runtime/first/summary.json`
