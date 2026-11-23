'use strict';

const mysql = require('mysql2/promise');

module.exports = function openLedger(databaseUrl) {
  return mysql.createPool(databaseUrl);
};
