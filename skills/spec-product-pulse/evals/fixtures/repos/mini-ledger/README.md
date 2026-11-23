# MiniLedger

A tiny personal expense-tracking demo app (Node.js, CommonJS).

- `src/server.js` — HTTP server with two endpoints: `POST /entries` (add an expense) and `GET /entries` (list them).
- Data is kept in memory; entries are `{id, amount, note, ts}`.

The API accepts an amount and note; the server supplies the ID and timestamp. There is no configured analytics or tracing source in this checkout.
