---
status: active
execution: code
---

# 发票取消功能实施计划

本计划已定稿。目标仓库是本文件所在的合成 billing-svc 仓库，使用现有 Node/CommonJS 和内存数据库，不添加依赖。仅实施与本地验证，不提交、不推送、不改真实宿主配置。该计划沿用无 unified contract 的 legacy 格式，不宣称托管生命周期已验证。

## 确定的业务规则和验收

新增 `POST /invoices/:id/cancel`：open 发票转为 cancelled；重复取消 cancelled 发票返回成功但不重复写审计。paid/refunded 发票不能取消，返回 409；不存在返回 404。成功返回 `{status: 200, body: {id, status: 'cancelled'}}`。金额、客户及明细不变，既有创建、支付、退款、CSV 和日报输出兼容。

取消入口需要落在领域模块 `src/invoices/cancel.js`，导出 `cancelInvoice(id)`；HTTP 路由负责状态和返回体映射。取消必须通过既有事务和审计能力写入，审计动作 `invoice.cancel`。不扩大修改其他状态转换的业务规则；不把本需求改成重构项目。

## 方案、顺序和复用

1. 先读取 `src/lib/db.js`、`src/lib/audit.js`、`src/invoices/refund.js` 与 HTTP 消费者，确认本地事务接口实际语义。复用现有 `withTx`、`audit.record`，不另建事务/审计层。
2. 实施取消领域函数和 HTTP 路由；选用清楚、局部的错误映射方式，不改变既有路由返回。
3. 添加测试覆盖首次取消、重复调用、非法状态、不存在及实际 HTTP 入口。核对金额不变、审计恰好一次。运行 `npm test`，失败必须定位或如实保留。
4. 检查实际 diff；提交结构化或简洁的调用者交接，说明已完成范围、测试命令与结果、缺失能力。禁止凭空声称执行了未运行的 CLI 或独立审查。

## 取舍与边界

既有数据库的同步事务适用于本合成任务，不引入并发数据库或外部服务。退款、导出与日报是回归消费者，取消状态不应被 `src/modules/m17.js` 误判为已结算。不要求生产部署或真实企业收益。
