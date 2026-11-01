'use strict';

const fs = require('node:fs');
const { createClient } = require('./client');
const { importOrders } = require('./order-importer');

async function main() {
  const args = process.argv.slice(2);
  const scenarios = { success: 'ok', transient: 'transient', auth: 'auth', ambiguous: 'ambiguous', unknown: 'unknown' };
  const scenario = args.length === 0 ? 'success' : args[1];
  if ((args.length !== 0 && (args.length !== 2 || args[0] !== '--scenario')) || !Object.hasOwn(scenarios, scenario)) {
    throw Object.assign(new Error('Unsupported arguments'), { code: 'USAGE' });
  }
  let rows;
  try { rows = JSON.parse(fs.readFileSync(0, 'utf8')); }
  catch { throw Object.assign(new Error('Invalid JSON input'), { code: 'INPUT_JSON' }); }
  const result = await importOrders(rows, createClient([scenarios[scenario]]));
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ error: { code: error.code, message: error.message } })}\n`);
  process.exitCode = 1;
});
