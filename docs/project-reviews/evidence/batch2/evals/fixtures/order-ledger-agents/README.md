# order-ledger

小型订单台账服务，提供订单汇总、导出和日报。这是 teh 内部工具。

本仓库使用 spec-first 工作流管理需求、计划、实现与审查。

- `src/sum.js`：订单金额汇总
- `src/export/csv.js`：通用 CSV 序列化（`toCsv`），处理转义
- `src/export/orders.js`：订单导出
- `src/report/daily.js`：日报，消费订单导出结果
- `src/refunds.js`：退款记录
