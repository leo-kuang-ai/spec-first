'use strict';

function exportTenantOrders(tenantId) {
  return { tenantId, rows: [] };
}

module.exports = { exportTenantOrders };
