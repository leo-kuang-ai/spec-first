'use strict';

// 汇总订单金额；每个订单带 items 数组。
function total(orders) {
  let sum = 0;
  for (const order of orders) {
    for (const line of order.items) {
      sum += line.price * line.qty;
    }
  }
  return sum;
}

module.exports = { total };
