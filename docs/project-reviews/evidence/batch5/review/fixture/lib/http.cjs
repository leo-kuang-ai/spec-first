'use strict';
function createHandler(ledger) {
  return async function handle(body) {
    return ledger.capture(body);
  };
}
module.exports = { createHandler };
