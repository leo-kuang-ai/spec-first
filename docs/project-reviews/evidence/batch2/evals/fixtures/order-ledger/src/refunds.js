'use strict';

// 退款记录：{ id, orderId, amount, reason, createdAt }
const refunds = [];

function addRefund(refund) {
  refunds.push({ ...refund });
}

function listRefunds() {
  return refunds.map((r) => ({ ...r }));
}

module.exports = { addRefund, listRefunds };
