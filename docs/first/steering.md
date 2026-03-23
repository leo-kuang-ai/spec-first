# Spec-First 技术方向与约束

> 基于 `.spec-first/runtime/first/steering.json` 真源生成

---

## Runtime 约束

| 约束 | 值 |
|------|-----|
| Node 最低版本 | 20.0.0 |
| Module System | ESM |
| 禁止 Default Export | 是 |

---

## TypeScript 约束

| 约束 | 值 |
|------|-----|
| strict | true |
| verbatimModuleSyntax | true |
| target | ES2022 |

---

## Test 约束

| 指标 | 阈值 |
|------|------|
| Framework | vitest |
| Lines Coverage | 75% |
| Functions Coverage | 75% |
| Statements Coverage | 75% |
| Branches Coverage | 65% |

---

## Architecture 约束

| 属性 | 值 |
|------|-----|
| Stage 枚举总数 | 10 |
| Terminal Stages | `08_done`, `09_cancelled` |
| Stage 单向性 | 不可逆 |
| ID Types | 14 |
| Exit Codes | 8 |
| CLI Commands | 27 |

---

## 已识别风险与缓解措施

| 领域 | 风险 | 缓解措施 |
|------|------|---------|
| Stage 状态机 | 单向不可逆，错误推进难以回滚 | 使用 CLI 命令操作，禁止手动编辑 stage-state.json |
| 追溯 ID | ID 格式错误导致追溯链断裂 | 使用 `spec-first id generate` 生成，`spec-first id validate` 校验 |
| Gate 校验 | 豁免管理复杂，可能掩盖质量问题 | 豁免必须关联 RFC，设置过期时间 |

---

## 代码约定

| 约定 | 值 |
|------|-----|
| 文件命名 | kebab-case |
| Types 集中位置 | `src/shared/types.ts` |
| 未使用变量前缀 | `_` |

---

## 真源

- `.spec-first/runtime/first/steering.json`
