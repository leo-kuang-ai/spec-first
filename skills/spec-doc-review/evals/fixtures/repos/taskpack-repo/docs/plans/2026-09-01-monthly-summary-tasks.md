---
type: task-pack
generated_by: spec-write-tasks
mode: derived
source_plan: docs/plans/2026-09-01-monthly-summary-plan.md
source_plan_hash: 3f2a9c1e
---

# Task Pack Contract

<!-- DOC-REVIEW-FIXTURE-MARKER: task-pack report-only 校验标记 -->

## Execution Waves

### Wave 1

## Task Cards

### T1: 实现汇总端点

- U: U1
- Files: `src/server.js`
- DoD: curl /summary?month=2026-08 返回 {total, byCategory}
