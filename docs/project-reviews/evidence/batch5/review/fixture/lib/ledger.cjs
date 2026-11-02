'use strict';
const { providerAmount } = require('./amount.cjs');
function createLedger(provider) {
  const receipts = new Map();
  return {
    async capture(request) {
      const key = JSON.stringify([request.tenantId, request.requestId]);
      if (receipts.has(key)) return receipts.get(key);
      const amount = providerAmount(request.amountCents);
      await provider.charge({ tenantId: request.tenantId, amountCents: amount });
      const receipt = { status: 'captured', chargedCents: amount };
      receipts.set(key, receipt);
      return receipt;
    },
  };
}
module.exports = { createLedger };
