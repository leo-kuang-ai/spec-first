'use strict';
const { toCsv } = require('./csv');

const COLUMNS = [
  { key: 'id', header: 'Order ID' },
  { key: 'createdAt', header: 'Created At' },
  { key: 'amount', header: 'Amount' },
];

// 按 id 升序导出；id 按创建时间递增分配。
function exportOrders(orders) {
  const rows = [...orders].sort((a, b) => a.id - b.id);
  return toCsv(rows, COLUMNS);
}

module.exports = { exportOrders, COLUMNS };
