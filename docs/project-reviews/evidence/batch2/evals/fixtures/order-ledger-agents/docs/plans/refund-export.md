# 退款 CSV 导出实施计划

- U1：新增 `src/export/refunds.js` 的 `exportRefunds(refunds)`，复用 `toCsv`，列为 id、orderId、amount、reason、createdAt，按 id 升序。
- U2：新增 `test/refunds.test.js`，覆盖转义与排序。
- 验证：`npm test`。
