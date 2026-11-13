# Support Desk Pulse — 2026-10-29 00:00 to 2026-10-30 00:00 UTC

## Headlines
- Canonical revenue was $0; Stripe recorded 0 new customers and 0 churned customers.
- Active-agent count is unknown because PostHog timed out; missing analytics is not zero usage.
- Sentry reported latency of 82 / 240 / 510 ms (p50 / p95 / p99) and 4 error occurrences across 2 signatures.

## Usage
- **Revenue:** $0 — finance-ledger, the explicitly mapped canonical source.
- **Active agents:** unknown — posthog, `unavailable`, reason_code=`timeout`.
- **Primary engagement / value realization:** unavailable; event names and counts were not supplied.
- **Completions / conversions:** no configured completion events or confirmed counts supplied; ratios cannot be calculated.
- **Customers:** 0 new; 0 churned — stripe, `confirmed-zero`; this does not establish Stripe revenue.
- **Quality sample:** `not-run`, reason_code=`quality-source-minimization-unavailable`; no score or raw content.
- **Strategy coverage:** only exported metric mappings were available; current strategy documents were not inspected.
- **Comparison:** no prior-window evidence supplied; deltas omitted.

## System performance
- **Latency:** p50 82 ms; p95 240 ms; p99 510 ms.
- **Top errors by count** (up to 5; only 2 signatures supplied):
  1. **ExportTimeout — 3:** timeout-labelled export failures; cause and affected-user scope were not supplied.
  2. **InvalidMonth — 1:** month-validation-labelled failure; triggering input and cause were not supplied.

## Followups
- Restore PostHog availability and obtain a complete export for this same window before assessing active agents or usage.
- Investigate the 3 ExportTimeout occurrences and the InvalidMonth occurrence using bounded diagnostic evidence; establish causes and user impact.
- Enable provider-side identity removal and bounded content projection, and define the missing quality dimension before attempting quality scoring.

---
Evidence: supplied local exports only; no live queries performed. W = [2026-10-29T00:00:00Z → 2026-10-30T00:00:00Z].
The supplied window is preserved; application of the usual 15-minute trailing buffer cannot be verified from these exports.
Source finance-ledger: `confirmed-zero`; reason_code=`query-succeeded`; window=W (export-level); freshness=2026-10-30T00:02:00Z; scope=revenue_usd only.
Source posthog: `unavailable`; reason_code=`timeout`; window=W (export-level); freshness=2026-10-30T00:03:00Z; limitation=analytics values unknown.
Source sentry: `confirmed-value`; reason_code=`query-succeeded`; window=W (export-level); freshness=2026-10-30T00:03:00Z; limitation=latency and listed signatures only.
Source stripe: `confirmed-zero`; reason_code=`query-succeeded`; window=W (export-level); freshness=2026-10-30T00:02:00Z; limitation=new/churned customers only.
Source quality-sample: `not-run`; reason_code=`quality-source-minimization-unavailable`; intended window=W; freshness=not supplied; limitation=provider cannot remove identity fields before returning content; no raw content fetched.
Source database: `not-configured` (derived from exported config); reason_code=`pulse_db_enabled_false` (report-derived); intended window=W; freshness=not applicable; no database access.
Delivery: chat only for caller saving; no files or configuration written. Schedule remains manual; nothing scheduled.
