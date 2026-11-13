# Support Desk Pulse — 24h ending 2026-10-30 00:00 UTC

Window W: 2026-10-29T00:00:00Z → 2026-10-30T00:00:00Z.
Evidence: supplied local exports only; no live queries performed. Window retained as supplied; 15-minute buffer application is unverified.

## Headlines

- Canonical revenue was $0; Stripe recorded 0 new customers and 0 churned customers.
- Active-agent count is unknown because PostHog timed out; this is not measured zero usage.
- Sentry recorded latency of 82/240/510 ms at p50/p95/p99 and four errors across two supplied signatures.

## Usage

- **Revenue:** $0 — `confirmed-zero`, finance-ledger; explicitly designated canonical source.
- **Active agents:** unknown — PostHog `unavailable`, `reason_code=timeout`.
- **Primary engagement / value realization / completions:** event names and measurements were not supplied; conversion ratios cannot be calculated.
- **Payments:** 0 new customers; 0 churned customers — Stripe `confirmed-zero`; no revenue value supplied by Stripe.
- **Quality sample:** `not-run`, `reason_code=quality-source-minimization-unavailable`; no score or raw content fetched. Scoring dimension is also unspecified.
- **Comparisons and strategy coverage:** no prior-window receipts or strategy documents supplied; deltas and additional strategy metrics cannot be assessed.

## System performance

- **Latency:** p50 82 ms; p95 240 ms; p99 510 ms.
- **Top errors by count:** only two signatures were supplied; no additional entries inferred.
  1. **ExportTimeout:** 3 occurrences; no operation details or root-cause evidence supplied.
  2. **InvalidMonth:** 1 occurrence; no triggering input or root-cause evidence supplied.

## Followups

- Restore the PostHog export for W and recover active-agent measurements; confirm engagement and completion event mappings before calculating conversions.
- Inspect Sentry evidence for the three ExportTimeout events and the InvalidMonth event to identify affected operations and reproducible causes.
- Enable provider-side identity removal and bounded projection, then define the scoring dimension before attempting quality scoring; keep raw conversations unfetched.
- Retain finance-ledger as the revenue authority; obtain matching prior-window receipts for comparisons. Manual scheduling remains configured; nothing was scheduled.

Source receipts below use W from the enclosing export; per-receipt windows were not supplied.
- **finance-ledger:** `confirmed-zero`; `reason_code=query-succeeded`; window=W; freshness=2026-10-30T00:02:00Z; coverage: revenue only.
- **posthog:** `unavailable`; `reason_code=timeout`; window=W; freshness=2026-10-30T00:03:00Z; active agents unknown.
- **sentry:** `confirmed-value`; `reason_code=query-succeeded`; window=W; freshness=2026-10-30T00:03:00Z; supplied latency and error counts only.
- **stripe:** `confirmed-zero`; `reason_code=query-succeeded`; window=W; freshness=2026-10-30T00:02:00Z; customer counts only.
- **quality-sample:** `not-run`; `reason_code=quality-source-minimization-unavailable`; window=W; freshness=not supplied; provider cannot remove identity fields before returning content.
- **database:** `not-configured`; `reason_code=pulse-db-disabled` (derived from config); window=W; freshness=not applicable; no database access attempted.

Rendered in chat for caller saving; no report or configuration files were written.
