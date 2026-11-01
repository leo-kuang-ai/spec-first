# Numeric ledger input

Validate numeric amounts before persistence. Unique historical recovery: reconcile already imported rows against original bank export before reimporting; never delete unrelated rows. Source: src/server.js and test/entries.test.js. Invalidate when the input schema or import idempotency contract changes.

Evaluation concurrent edit; preserve this byte sequence.
