'use strict';
const log = [];
function record(tx, action, entityId) { tx.events.push({ action, entityId }); }
function flush(events) { log.push(...events); }
function entries() { return log.slice(); }
function clear() { log.length = 0; }
module.exports = { record, flush, entries, clear };
