---
artifact_kind: prd-requirements
spec_id: EXP-EXPORT-001
status: draft
---

# Expense Export - Requirements

<!-- PRD-FIXTURE-ORIGIN-MARKER: 此行用于 validate-only 回归校验,任何重写都会破坏该标记 -->

## Goal

Users can export their expenses as CSV.

## Requirements

- REQ-1: User can trigger an export from the entries page.
- REQ-2: Export contains all entries in the selected month.

## Outstanding Questions

| ID | Question | blocks_planning |
|---|---|---|
| OQ-1 | 导出编码用 UTF-8 还是 UTF-8-BOM(Excel 兼容)? | yes |
| OQ-2 | 超大数据量(10 万条)是否需要异步任务? | unknown |
