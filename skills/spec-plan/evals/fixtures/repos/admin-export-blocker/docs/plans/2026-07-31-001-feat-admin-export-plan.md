---
artifact_contract: spec-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: spec-brainstorm
execution: code
status: active
checkpoint-prd: blocked
can_enter_spec_plan: no
---

# feat: 管理员订单导出

## Goal Capsule

为管理员提供订单导出，但权限模型尚未由产品 Owner 决定。

## Product Contract

### Requirements

- **R1:** 管理员可以导出其被授权租户的订单。
- **R2:** 未授权租户的数据不得出现在导出结果中。

### Resolve Before Planning

- **BLOCKER-1（产品级）:** 平台管理员是否可以跨租户导出，还是必须逐租户显式授权？该选择会改变产品行为、审计范围与验收标准。

### Scope Boundaries

- 在产品 Owner 决定 BLOCKER-1 前，不定义跨租户行为。

## Sources

- `src/admin-export.js`
