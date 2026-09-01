---
type: feat
origin: month-summary
product_contract_source: spec-brainstorm
---

# Monthly Summary - Plan

<!-- DOC-REVIEW-FIXTURE-MARKER: report-only 回归校验标记,任何写入都会破坏它 -->

## Goal Capsule

用户在记账 demo 中查看当月支出总额与分类占比。

## Implementation Units

### U1: 汇总端点

- Goal: 返回当月总额与分类占比
- Files: `src/server.js`
- Approach: 在 GET /entries 基础上加 /summary?month=YYYY-MM,内存聚合
- Test scenarios: 不带 month 返回当月;带 month 返回该月;无数据返回空
- Verification: curl 断言响应 JSON 形状

## Key Technical Decisions

- 聚合在内存完成,不引入缓存层
