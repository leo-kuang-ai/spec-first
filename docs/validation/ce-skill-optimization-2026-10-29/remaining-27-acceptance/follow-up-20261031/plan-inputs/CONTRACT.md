# Synthetic Import Client and CLI Contract

Origin: newly authored acceptance fixture, 2026-10-31. This document and the executable source below define a new local test input. They are not historical or production contracts, service-owner attestations, or evidence that the original Plan trial was implementation-ready.

## Client

`src/client.js` exports `createClient(outcomes)`. Its async `send(rows)` returns `{ imported: rows.length }` on success. Rows must be an array of objects with nonempty string IDs; invalid input throws `INVALID_ORDER` before applying anything. The supplied outcome sequence is a local failure injector, not a network provider.

- `transient`: throws `TRANSIENT_BEFORE_SEND` before applying any row. Repeating the same input after this exact error is safe in this fixture. It is the only retryable code.
- `auth`: throws `AUTH_FAILED` before application. Do not retry.
- `ambiguous`: applies the rows, then throws `OUTCOME_UNKNOWN`. Do not replay: the caller cannot infer failure from the missing response.
- `unknown`: throws `UNCLASSIFIED` before application. No retry permission is implied by unclassified failures.
- `ok` (including exhausted sequence): applies rows and returns the result.

The observed `attempts` and `applied` properties are fixture diagnostics. No generic timeout/network-code inference, remote idempotency, persistent queue or deduplication guarantee exists. Retry state must be per invocation; initial attempt plus at most three retries. Exhaustion propagates the final error; do not wrap its code/message or invent success.

## CLI baseline

`node src/cli.js [--scenario success|transient|auth|ambiguous|unknown]` reads JSON rows from stdin and calls the unchanged single-send importer. The scenario option is fixture-local fault injection only. Success writes exactly `{"imported":N}\n` to stdout, no stderr, exit0. Failure writes no stdout and exactly `{"error":{"code":"CODE","message":"MESSAGE"}}\n` to stderr, exit1. Invalid JSON uses `INPUT_JSON` / `Invalid JSON input`; unknown options use `USAGE` / `Unsupported arguments`.

The added CLI is a new observable compatibility baseline for this successor. It does not claim that an omitted historical CLI used this output. A future importer change must preserve successful output and the final non-retried/exhausted error output; a recovered transient error may correctly change failure into success per the Product Contract.

## Sources and proof

- `src/client.js`: actual fixture error timing and application state.
- `src/cli.js`: actual stdout/stderr/exit behavior.
- `src/order-importer.js`: original single-send behavior retained byte-for-byte.
- `tests/client-cli.test.js`: executed characterization across all cases, including apply-then-error and CLI process behavior.
- `docs/plans/2026-07-31-001-feat-order-import-plan.md`: unchanged original Product Contract.

This supplement supplies bounded planning facts. It does not execute a Plan model trial, implement retries, or establish any production service/CLI compatibility.
