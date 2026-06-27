---
title: spec-prd scripts 共享解析 lib 延迟决策
date: 2026-06-28
category: docs/solutions/architecture-patterns
module: spec-prd
problem_type: architecture_pattern
component: prd_script_shared_lib
severity: low
status: deferred
applies_when:
  - "多个脚本存在重复解析函数但行为仍有差异"
  - "准备抽取 shared lib 前需要判断是否属于 speculative abstraction"
  - "需要记录暂缓抽象的触发条件与未来实施边界"
tags: [spec-prd, shared-lib, parser, abstraction, deferred-decision]
---

# spec-prd scripts 共享解析 lib 延迟决策

**日期:** 2026-06-28
**状态:** deferred — 避免 speculative 抽象，等再次漂移时再做

## Context

`skills/spec-prd/scripts/` 下三个脚本存在重复代码：

| 重复点 | check | finalize | glossary-drift |
|---|---|---|---|
| `parseArgs` | ✓ | ✓ | ✓ |
| `splitLines` | ✓ | ✓ | — |
| `parseFrontmatter` / `parseFrontmatterBounds` | ✓（返回 `{present, fields, startLine, endLine}`）| ✓（返回 `{startLine, endLine}`）| — |

## Guidance

### 支持抽取的信号
- `check-prd-artifact.js:157` 注释自述"多余参数静默丢弃"bug 是之前三份 `parseArgs` 独立漂移的已知先例
- 两套表解析共存（`tableRows` positional + `parseHeaderedTable` header-aware）增加认知负担

### 反对抽取的信号（决定延迟）
- **三份 `parseArgs` 行为各异**：`check`（`--inputs` + 单位置）/ `finalize`（`--inputs` + `--check-only`）/ `glossary-drift`（`--glossary`）。参数化工厂需要表达三套 spec，复杂度可能高于重复。
- **`parseFrontmatter` 返回形状不同**：check 返回 `{present, fields, startLine, endLine}`；finalize 只要 `{startLine, endLine}` 做 upsert bounds。强行统一需要其中一方适配。
- **本轮已做更高 ROI 的改动**（parity 闸 + 纯函数导出 + reason-codes lib），speculative 抽象会稀释收益。
- 对齐 CLAUDE.md：「避免无关重构、speculative fallback、一次性抽象」。

当前决策：不抽取 shared parser lib。只有当重复代码再次产生真实漂移，或新增消费者让共享抽象能减少实际复杂度时，再实施。

## Why This Matters

共享 lib 只有在统一了真实消费者和行为边界后才会降低复杂度。过早抽取会把三个脚本不同的参数语义揉成一个参数化工厂，增加隐式分支和测试负担，反而削弱 checker/finalize/glossary-drift 的局部可读性。

## When to Apply

当以下任一条件成立时，重新评估：

1. `parseArgs` 在任意一个脚本**再次出现静默丢参 bug**（先例已有 check:157）
2. 第四个脚本需要重用 `parseFrontmatter` 或 `splitLines`
3. `glossary-drift.js` 或 `run-evals.js` 需要 header-aware 表解析（目前只有 check 用）

## Examples

届时实施指引：

- 新建 `skills/spec-prd/scripts/lib/markdown-utils.js`（与 `lib/reason-codes.js` 同目录）
- 导出：`splitLines` / `parseFrontmatter(lines)` / `parseHeaderedTable` / `isTableSeparator` / `sha256`
- `parseArgs` 考虑工厂形式：`createArgParser(spec)` 返回 parser，spec 声明 flags 与 positional 数量
- 收敛 check 内两套表解析：`countSectionRows`/`tableRows` 下线，统一走 `parseHeaderedTable`（需同步 spec-prd-contracts + checker-unit 测试）
- 风险：`parseFrontmatter` 返回形状需对齐或保持两个变体（check 用 full；finalize 用 bounds-only）

## 关联

- 已做的 reason-codes lib：`skills/spec-prd/scripts/lib/reason-codes.js`
- 三脚本 parseArgs 重复先例：`check-prd-artifact.js:157` 注释
- CLAUDE.md：「避免无关重构、speculative fallback、一次性抽象」
