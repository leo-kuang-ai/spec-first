'use strict';
// 导出与对账使用：不带货币符号，固定两位小数。
function formatAmount(cents) { return (Math.round(cents) / 100).toFixed(2); }
module.exports = { formatAmount };
