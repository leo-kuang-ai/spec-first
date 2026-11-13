'use strict';
class ValidationError extends Error {}
function assertPositiveCents(amount) {
  if (!Number.isInteger(amount) || amount <= 0) throw new ValidationError('amount must be a positive integer (cents)');
}
module.exports = { ValidationError, assertPositiveCents };
