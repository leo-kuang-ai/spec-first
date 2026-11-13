'use strict';

const test = require('node:test');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

test('invalid entries are rejected and valid entries survive without a server crash', () => {
  execFileSync(process.execPath, [path.join(__dirname, 'support/ledger-proof.cjs')], {
    cwd: path.resolve(__dirname, '..'),
    timeout: 10000,
    stdio: 'pipe',
  });
});
