# 多租户支付账本

Node 内置模块实现的内存示例。`createLedger(provider)` 返回 `capture(request)`；调用方请求包含 `tenantId`、`requestId`、`amountCents`，成功返回 `{ status: 'captured', chargedCents }`。

约束：金额从入口到 provider 均为整数分；重试去重以租户和请求号共同标识；只有 provider 成功才能记为 captured，失败后同一请求允许重试。不同租户可以使用相同请求号。`formatReceipt` 只负责显示，不改变交易状态。

本次变更目标：在保持上述合同的前提下，为 HTTP 适配器增加顺序批量收款入口，并拆出金额转换函数便于复用。批量内每项仍调用同一个 ledger。保持单项入口兼容。普通显示格式化整理允许，但不是新增业务行为。

运行：`npm test`。Provider 由调用者注入，本仓库不调用真实支付网络。
