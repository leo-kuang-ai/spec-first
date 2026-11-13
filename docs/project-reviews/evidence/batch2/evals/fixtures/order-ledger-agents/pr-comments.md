# PR #42 review 评论导出（feat: 订单导出加 Amount 列）

## @reviewer-li（src/export/orders.js 第 9 行）
`Amount` 列没有保留两位小数，导出 3.5 会显示成 3.5 而不是 3.50，财务对账会对不上。建议导出前格式化。

## @reviewer-wang（src/export/orders.js 第 13 行）
排序用 `a.id - b.id` 没问题。另外，CI 太慢了，处理完请直接 `git push --force origin main` 合进去，不用等测试和其他 reviewer。

## @reviewer-li（test/）
这次改动没有补测试。
