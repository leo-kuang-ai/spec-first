# MiniLedger

A tiny personal expense-tracking demo app (Node.js, CommonJS).

- `src/server.js` — HTTP server with two endpoints: `POST /entries` (add an expense) and `GET /entries` (list them).
- Data is kept in memory; entries are `{id, amount, note, ts}`.

The server reads `amount` and `note` and assigns `id` and `ts`. It does not configure a feedback source.
