'use strict';
const { exportPayments } = require('../export/payments');
// 第一行数据视为当天最早的收款，最后一行视为最晚的收款（依赖导出按 id 即时间升序）。
function dailySummary() {
  const lines = exportPayments().split('\n');
  const cell = (l) => (l ? l.split(',')[1] : null);
  return { count: lines.length - 1, first: cell(lines[1]), last: lines.length > 1 ? cell(lines[lines.length - 1]) : null };
}
module.exports = { dailySummary };
