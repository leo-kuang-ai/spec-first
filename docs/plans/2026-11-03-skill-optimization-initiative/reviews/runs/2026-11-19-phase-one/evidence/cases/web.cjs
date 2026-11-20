'use strict';

function paymentStatus(request) {
  return request('/v2/order').payment_state === 'refund_complete' ? '已退款' : '已付款';
}

module.exports = { paymentStatus };
