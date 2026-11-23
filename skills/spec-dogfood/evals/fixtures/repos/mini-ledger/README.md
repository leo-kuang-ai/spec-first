# MiniLedger

A tiny personal expense-tracking demo app (Node.js, CommonJS).

- `src/server.js` — HTTP server with two endpoints: `POST /entries` (add an expense) and `GET /entries` (list them).
- Data is kept in memory; entries are `{id, amount, note, ts}`.

The fixture exposes an HTTP API, not a browser form. Adding an entry accepts `amount` and `note`; the server assigns `id` and `ts`. It has no category field or summary endpoint.
