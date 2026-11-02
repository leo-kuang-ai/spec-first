'use strict';
// 结算统计：已付款发票视为已结算
function isSettled(inv) { return inv.status === 'paid'; }
module.exports = { isSettled };
