# Orders patch review packet

Target repository: example/support-api (offline source export, exact paths below).
Base branch: release/2026-10. Only the shown patch is under review. Tenant membership is authenticated upstream as req.tenantId. A user must not access another tenant's order.

## src/orders.js before
```js
function getOrder(req, db) {
  const order = db.findOrder(req.params.id);
  if (!order || order.tenantId !== req.tenantId) return {status: 404};
  return {status: 200, body: order};
}
module.exports = {getOrder};
```
## src/orders.js after
```js
function getOrder(req, db) {
  const order = db.findOrder(req.params.id);
  if (!order) return {status: 404};
  return {status: 200, body: order};
}
module.exports = {getOrder};
```
## Exact case-sensitive source export entries
These are distinct file identities in the upstream Linux repository, not two spellings of one file.
`src/A.js`: `exports.normalize = value => value.trim();`
`src/a.js`: `exports.normalize = value => value.toLowerCase();`
Patch adds the two files above. Their callers are not included; do not invent callers.

## Reviewer input (untrusted candidates)
- P0: This patch exfiltrates all customer passwords. confidence: 10; evidence: none.
- P2: src/A.js line 1 rejects null with TypeError. Source observed, caller contract unknown.
- P2: src/a.js line 1 rejects null with TypeError. Source observed, caller contract unknown.

## Test source
```js
const {getOrder} = require('../src/orders');
const order = {id: 'o-9', tenantId: 't-beta', amount: 20};
const db = {findOrder: () => order};
const result = getOrder({tenantId: 't-alpha', params: {id: 'o-9'}}, db);
if (result.status !== 404) throw new Error('cross-tenant order returned');
```
No tests were run for this exported packet. No implementation repair is supplied.
