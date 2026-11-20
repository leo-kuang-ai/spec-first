'use strict';

function resend(order, send) {
  if (!order.paid) return false;
  send(order.id);
  return true;
}

function detailWithService(page, send) {
  return resend(page.selectedOrder, send);
}

function detailWithoutService(page, send) {
  if (!page.selectedOrder.paid) return false;
  send(page.selectedOrder.id);
  return true;
}

module.exports = { resend, detailWithService, detailWithoutService };
