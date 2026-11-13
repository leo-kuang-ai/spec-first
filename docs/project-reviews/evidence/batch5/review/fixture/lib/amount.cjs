'use strict';
function providerAmount(amountCents) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw new Error('invalid amount');
  return amountCents;
}
module.exports = { providerAmount };
