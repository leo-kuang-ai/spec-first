'use strict';
const { exportOrders } = require('../export/orders');

// 日报：第一行数据视为当天最早的订单，最后一行视为最晚的订单。
function dailySummary(orders) {
  const lines = exportOrders(orders).split('\n');
  const first = lines[1] ? lines[1].split(',') : null;
  const last = lines.length > 1 ? lines[lines.length - 1].split(',') : null;
  return {
    count: lines.length - 1,
    firstOrderAt: first ? first[1] : null,
    lastOrderAt: last ? last[1] : null,
  };
}

module.exports = { dailySummary };
