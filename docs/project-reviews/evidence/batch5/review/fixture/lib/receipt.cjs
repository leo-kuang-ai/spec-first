'use strict';
function formatReceipt(receipt) {
  return `${receipt.status}: ${(receipt.chargedCents / 100).toFixed(2)}`;
}
module.exports = { formatReceipt };
