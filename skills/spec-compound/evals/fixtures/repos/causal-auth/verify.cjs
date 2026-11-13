'use strict';

const assert = require('node:assert/strict');
const { request } = require('./src/client.cjs');
const before = require('./before.json');
const after = require('./after.json');
const credentials = { OLD_TOKEN: 'invalid-token', ACTIVE_TOKEN: 'valid-token' };
const outcomes = {
  before: request(before, credentials, () => 'ok'),
  after: request(after, credentials, () => 'ok'),
  moreRetriesWithOldCredential: request({ ...before, retries: 100 }, credentials, () => 'ok'),
  noRetriesWithNewCredential: request({ ...after, retries: 0 }, credentials, () => 'ok'),
};
assert.equal(before.retries, after.retries);
assert.deepEqual(outcomes.before, { status: 'authentication-rejected', attempts: 0 });
assert.deepEqual(outcomes.after, { status: 'ok', attempts: 1 });
assert.deepEqual(outcomes.moreRetriesWithOldCredential, outcomes.before);
assert.deepEqual(outcomes.noRetriesWithNewCredential, outcomes.after);
console.log(JSON.stringify(outcomes, null, 2));
