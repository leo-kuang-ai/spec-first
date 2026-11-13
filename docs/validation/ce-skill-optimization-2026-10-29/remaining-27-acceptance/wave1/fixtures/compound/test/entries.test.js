const test = require('node:test');
const assert = require('node:assert');
const { parseEntry } = require('../src/server.js');

test('string amount is rejected instead of stored as NaN', () => {
  assert.strictEqual(parseEntry('{"amount":"12","note":"x"}'), null);
});

test('valid amount is accepted', () => {
  assert.notStrictEqual(parseEntry('{"amount":12,"note":"x"}'), null);
});
