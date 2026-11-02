'use strict';
// 界面展示：带货币符号。
function formatAmount(cents) { return `¥${(cents / 100).toFixed(2)}`; }
module.exports = { formatAmount };
