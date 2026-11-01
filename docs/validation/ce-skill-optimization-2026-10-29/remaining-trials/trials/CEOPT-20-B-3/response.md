# Support Desk Pulse — 24h ending 2026-10-30 00:00 UTC

## Headlines

- Active-agent count is unknown: PostHog timed out; this is not measured zero.
- Canonical revenue was $0 from finance-ledger; Stripe measured 0 new and 0 churned customers.
- Sentry recorded 3 ExportTimeout and 1 InvalidMonth errors; latency p95 was 240 ms.

## Usage

- **Active agents:** unavailable (`timeout`); canonical source: posthog.
- **Revenue:** $0, `confirmed-zero`; canonical source: finance-ledger, not Stripe.
- **Customers:** 0 new; 0 churned, both measured by Stripe.
- **Engagement, value realization, completions:** event names and measurements were not supplied; conversion ratios cannot be calculated.
- **Quality sample:** `not-run` (`quality-source-minimization-unavailable`); no score or raw content fetched.
- **Strategy scope:** exported mappings retained; current strategy documents were not supplied or independently verified.

## System performance

- **Latency:** p50 82 ms; p95 240 ms; p99 510 ms.
- **Top errors by count:** only two signatures were supplied.
  1. **ExportTimeout — 3:** signature indicates an export timeout; root cause and user impact are unverified.
  2. **InvalidMonth — 1:** signature indicates a month-related validation error; triggering input is unknown.

## Followups

- Restore PostHog access and obtain a complete export for the same window to establish active-agent count.
- Inspect the three ExportTimeout traces and the InvalidMonth trace to identify causes and affected flows.
- Enable provider-side identity removal and bounded content projection before any quality sampling; define scoring anchors before numeric scoring.

---
Evidence: supplied local exports only; no live queries. Window W = [2026-10-29T00:00:00Z → 2026-10-30T00:00:00Z].
Window retained exactly as supplied; application of the normal 15-minute trailing buffer is not independently verified. No prior-window comparison was supplied.
Source: finance-ledger — `confirmed-zero`; reason_code=`query-succeeded`; window=W; freshness=2026-10-30T00:02:00Z; limitation: revenue only.
Source: posthog — `unavailable`; reason_code=`timeout`; window=W; freshness=2026-10-30T00:03:00Z; limitation: active agents unknown.
Source: sentry — `confirmed-value`; reason_code=`query-succeeded`; window=W; freshness=2026-10-30T00:03:00Z; limitation: aggregate latency and two error signatures only.
Source: stripe — `confirmed-zero`; reason_code=`query-succeeded`; window=W; freshness=2026-10-30T00:02:00Z; limitation: customer counts only, not canonical revenue.
Source: quality-sample — `not-run`; reason_code=`quality-source-minimization-unavailable`; requested window=W; freshness=not supplied; limitation: provider cannot remove identity fields before returning content.
Source: database — `not-configured` (derived from exported config); reason_code=`pulse-db-disabled`; requested window=W, not queried; freshness=not applicable; limitation: database access disabled.
Delivery: chat only for caller saving; no files or configuration written. Schedule remains manual; no scheduling action taken.
