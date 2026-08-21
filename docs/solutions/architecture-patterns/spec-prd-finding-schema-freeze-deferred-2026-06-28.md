---
title: spec-prd finding 字段形状 freeze 延迟决策
date: 2026-06-28
last_updated: 2026-08-21
category: docs/solutions/architecture-patterns
module: spec-prd
problem_type: architecture_pattern
component: prd_checker_findings
severity: low
status: resolved
applies_when:
  - "checker findings 的 extra 字段形状不一致但下游只消费 reason_code"
  - "想增加 schema freeze 测试前需要判断是否存在真实消费者"
  - "需要避免为了整齐而冻结尚未被消费的结构细节"
tags: [spec-prd, checker, findings, schema-freeze, deferred-decision]
---

# spec-prd finding 字段形状 freeze（已解决）

**日期:** 2026-06-28（deferred）→ 2026-08-21（resolved）
**状态:** resolved — 触发条件已满足并已实施 freeze 测试，见下方 2026-08-21 记录

**⚠️ 2026-08-21 复核（`spec-first代码审查方案.md` P3 Shortcut 治理）：本决策的前提已不成立。**
`finalize-prd-artifact.js:254-260` 现在读取并按 `expected_shape`/`remediation_hint` 过滤 finding（`.filter((finding) => finding.expected_shape || finding.remediation_hint)`），这两个字段是 2026-07-01（commit `464786ab`）引入的，比本文档晚 3 天，触发了下方"When to Apply"第 1 条（"某个消费者需要渲染 finding 细节"）。`check-prd-artifact.js` 当前有 41 处 `findings.push(...)`，字段形状已比下表列出的 6 种更多样，此表已过期。

**✅ 2026-08-21 已实施 schema freeze（用户明确授权）：** 新增 `tests/unit/spec-prd-finding-schema-freeze.test.js`，冻结当前被 `REMEDIATION_BY_REASON_CODE` 增强的全部 9 个 reason_code（`decision_card_undeclared`、`decision_card_path_mismatch`、`open_oq_without_owner_closure`、`owner_decision_trace_required_but_absent`、`design_source_coverage_undeclared`、`design_sources_unread_undeclared`、`design_partial_coverage_unaccepted`、`ready_receipt_stale`、`input_refs_unavailable`）——即真实被 `finalize-prd-artifact.js` 消费的那批，而不是下表列出的、已经过期的 6 种粗粒度形状分类。每个 reason_code 都用直接执行 `buildReport()` 验证过的最小 fixture 触发，断言其精确字段集合（`Object.keys(finding).sort()`），并有一条反向测试确认"当前被增强的 reason_code 集合"与"测试声明覆盖的集合"完全一致，防止未来新增第 10 个增强字段却漏测。**范围明确限定在这 9 个已被消费的 reason_code**——其余约 30 个未被消费的 reason_code 仍不冻结，符合本文档"不要冻结未被消费的细节"的原有指导；不是把下表的 6 种分类原样冻结（那 6 种本身已经不准确，也不是真正驱动本次实施的触发条件）。已用"故意改坏一个字段名重跑测试"验证测试确实会失败（而不是形同摆设），随后还原确认改动干净。

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

- **finding 字段形状 freeze（本次新增）: `tests/unit/spec-prd-finding-schema-freeze.test.js`**
- reason_code parity 闸（`BLOCKING_REASON_CODES`）: `skills/spec-prd/scripts/lib/reason-codes.js`，消费方见 `tests/unit/spec-prd-decision-card-contracts.test.js`
- `REMEDIATION_BY_REASON_CODE` 增强映射: `skills/spec-prd/scripts/check-prd-artifact.js:1417-1454`
- finding 构建与 enrichFinding: `skills/spec-prd/scripts/check-prd-artifact.js:1456-1583`

**⚠️ 2026-08-21 说明**：本节原有的 `tests/unit/spec-prd-finalize.test.js:430`（"facts key-set freeze"）与 `tests/unit/spec-prd-reason-code-parity.test.js` 两条链接指向的文件在本仓库当前状态下均不存在（很可能测试文件已被重命名，但本文档从 2026-06-28 起未同步更新）——这与本文档"当前不痛"字段清单过期是同一类问题：**文档写下具体路径引用后，如果不随代码演进主动复核，路径本身也会腐烂。** 已在本次复核中改为指向当前真实存在的等价文件；若未来这些路径再次改名，同样需要人工发现，本文档不具备自动检测过期链接的机制。
