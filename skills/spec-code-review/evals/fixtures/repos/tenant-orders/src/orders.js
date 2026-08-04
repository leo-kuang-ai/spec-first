'use strict';

function getOrderForUser(orders, orderId, user) {
  const order = orders.find((candidate) => candidate.id === orderId);
  if (!order || order.tenantId !== user.tenantId) {
    return null;
  }
  return order;
}

module.exports = { getOrderForUser };
