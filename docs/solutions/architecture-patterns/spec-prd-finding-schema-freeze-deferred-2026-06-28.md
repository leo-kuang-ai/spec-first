---
title: spec-prd finding 字段形状 freeze 延迟决策
date: 2026-06-28
category: docs/solutions/architecture-patterns
module: spec-prd
problem_type: architecture_pattern
component: prd_checker_findings
severity: low
status: deferred
applies_when:
  - "checker findings 的 extra 字段形状不一致但下游只消费 reason_code"
  - "想增加 schema freeze 测试前需要判断是否存在真实消费者"
  - "需要避免为了整齐而冻结尚未被消费的结构细节"
tags: [spec-prd, checker, findings, schema-freeze, deferred-decision]
---

# spec-prd finding 字段形状 freeze（已延迟）

**日期:** 2026-06-28
**状态:** deferred — 当前消费者不依赖细节字段，等下游有需求再做

**⚠️ 2026-08-21 复核（`spec-first代码审查方案.md` P3 Shortcut 治理，纯发现，未实施）：本决策的前提已不成立，需要 owner 重新评估。**
`finalize-prd-artifact.js:254-260` 现在读取并按 `expected_shape`/`remediation_hint` 过滤 finding（`.filter((finding) => finding.expected_shape || finding.remediation_hint)`），这两个字段是 2026-07-01（commit `464786ab`）引入的，比本文档晚 3 天，触发了下方"When to Apply"第 1 条（"某个消费者需要渲染 finding 细节"）。`check-prd-artifact.js` 当前有 41 处 `findings.push(...)`，字段形状已比下表列出的 6 种更多样，此表已过期。**本次审查不实施 schema freeze**——是否冻结、冻结哪些字段属于需要另行授权的实现决策，超出人工审查范围；这里只标记触发条件已满足，交由 owner 决定。

## Context

`check-prd-artifact.js` 的 `findings` 数组中，每条 finding 的字段形状不一致：

| reason_code 类型 | 字段示例 |
|---|---|
| 结构缺失 | `{reason_code, section}` |
| 行定位 | `{reason_code, line}` |
| 数量超限 | `{reason_code, count, limit}` |
| 期望/实际 | `{reason_code, expected, actual, line}` |
| 路径 | `{reason_code, path}` |
| 需求 ID | `{reason_code, requirement_id}` |

`facts` key-set 已被 freeze 测试锁（`spec-prd-finalize.test.js:430`），但 finding 字段形状无等价闸。

## Guidance

**当前不痛**：现有消费者（prd-readiness-guard hook、finalize closeout、lens prose）只读 `reason_code`，不依赖 extra 字段。`BLOCKING_REASON_CODES` 的 30 码已被 parity 闸锁。

因此当前不做 finding extra 字段 freeze。保持 `reason_code` 作为稳定消费面，等下游真实读取 `line`、`section`、`count`、`expected`、`actual`、`path` 或 `requirement_id` 时再冻结对应形状。

## Why This Matters

提前冻结未被消费的细节字段会把 checker 内部实现变成外部合同，后续新增 finding 类型时会增加维护成本。等消费者出现后再冻结，能保持 Light contract，同时仍保留 `reason_code` parity 闸作为当前稳定边界。

## When to Apply

当以下任一条件成立时，再实施 finding schema freeze：

1. 某个消费者需要渲染 finding 细节（block 文案包含 line number / section / count）
2. 新增 finding 类型且 extra 字段形状不一致引起实现困惑
3. finalize 的 closeout summary 需要结构化引用 finding extra 字段

## Examples

届时实施方式：

1. 枚举当前每个 `reason_code` 的 extra 字段（6 种形状）。
2. 在 `spec-prd-checker-unit.test.js` 或独立 freeze 测试中，对每个 `reason_code` 的 extra 字段做 `toMatchObject` 冻结。
3. 对齐 `looksLikeCheckableRef` / `traceRowBindsOq` 等纯函数——这些函数的返回值已有单元测试，extra 字段冻结不影响它们。

## 关联

- `facts` key-set freeze: `tests/unit/spec-prd-finalize.test.js:430`
- reason_code parity 闸: `tests/unit/spec-prd-reason-code-parity.test.js`
- finding 字段形状分析: `skills/spec-prd/scripts/check-prd-artifact.js:875-1138`
