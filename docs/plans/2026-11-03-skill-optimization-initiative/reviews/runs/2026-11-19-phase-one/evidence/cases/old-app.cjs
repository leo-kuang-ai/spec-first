'use strict';

function renderOrder(request) {
  const status = request('/v1/order').status;
  return { refunded: '已退款', paid: '已付款' }[status] || '未知状态';
}

module.exports = { renderOrder };
