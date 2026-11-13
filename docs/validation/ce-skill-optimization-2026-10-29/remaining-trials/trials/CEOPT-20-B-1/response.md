# Support Desk Pulse — 24h ending 2026-10-30 00:00 UTC

Window W: 2026-10-29T00:00:00Z → 2026-10-30T00:00:00Z.
Evidence: supplied configuration and exported receipts only; no live queries performed.
The supplied window is preserved; application of the 15-minute ingestion buffer is unverified.

## Headlines

- Active-agent count is unknown because PostHog timed out; this is not a measured zero.
- Canonical revenue is **$0** from finance-ledger; Stripe separately confirms **0 new customers and 0 churned customers**.
- Sentry reports p50/p95/p99 latency of **82/240/510 ms** and two error signatures totaling **4 occurrences**.

## Usage

- **Active agents:** unknown — PostHog `unavailable`, reason `timeout`.
- **Revenue:** $0 — finance-ledger `confirmed-zero`; the explicit owner mapping makes this the canonical revenue source.
- **Customers:** 0 new; 0 churned — Stripe `confirmed-zero`.
- **Engagement, value realization and completions:** event names and measurements were not supplied; conversion ratios cannot be calculated.
- **Quality sample:** `not-run` — `quality-source-minimization-unavailable`; no score or raw conversation content obtained.
- **Coverage:** strategy metrics are limited to the exported mappings; current strategy documents and prior-window comparisons were not supplied.

## System performance

- **Latency:** p50 **82 ms**, p95 **240 ms**, p99 **510 ms**.
- **Top errors by count:** only two signatures were supplied; additional entries are not inferred.
  1. **ExportTimeout — 3:** signature indicates an export timeout; affected operations and root cause are unverified.
  2. **InvalidMonth — 1:** signature indicates a month-related error; triggering input and root cause are unverified.

## Followups

- Recover PostHog access and retrieve active-agent measurements for W; retain the unknown count until a successful receipt exists.
- Inspect Sentry traces for the three `ExportTimeout` occurrences and the `InvalidMonth` occurrence to establish triggers and user impact.
- Enable provider-side identity removal and bounded content projection before quality sampling; establish the missing scoring anchors before assigning numeric scores.

Source receipts below inherit W from the export; individual receipt windows were not supplied. Freshness is the supplied timestamp, not an independently verified watermark.
- **finance-ledger:** `confirmed-zero`; reason_code=`query-succeeded`; window=W; freshness=2026-10-30T00:02:00Z; scope: revenue only.
- **posthog:** `unavailable`; reason_code=`timeout`; window=W; freshness=2026-10-30T00:03:00Z; limitation: active agents unknown.
- **sentry:** `confirmed-value`; reason_code=`query-succeeded`; window=W; freshness=2026-10-30T00:03:00Z; scope: supplied latency and two error signatures.
- **stripe:** `confirmed-zero`; reason_code=`query-succeeded`; window=W; freshness=2026-10-30T00:02:00Z; scope: customer counts, not canonical revenue.
- **quality-sample:** `not-run`; reason_code=`quality-source-minimization-unavailable`; target window=W; freshness=not supplied; limitation: provider cannot remove identity fields before returning content.
- **database:** `not-configured` derived from `pulse_db_enabled=false`; reason_code=`db-disabled` (report-derived); target window=W, not queried; freshness=not applicable.
Chat-only report for caller saving; no files or configuration written. Schedule remains `manual`; no scheduling action taken.
