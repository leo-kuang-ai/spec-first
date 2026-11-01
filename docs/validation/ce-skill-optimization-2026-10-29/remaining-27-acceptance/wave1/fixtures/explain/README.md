# MiniLedger

A tiny personal expense-tracking demo app (Node.js, CommonJS).

- `src/server.js` — HTTP server with two endpoints: `POST /entries` (add an expense) and `GET /entries` (list them).
- Data is kept in memory; entries are `{id, amount, note, ts}`.

Known rough edges: adding an entry requires five fields typed by hand; no categories; no summary view.
