'use strict';

function importOrders(rows, client) {
  return client.send(rows);
}

module.exports = { importOrders };
