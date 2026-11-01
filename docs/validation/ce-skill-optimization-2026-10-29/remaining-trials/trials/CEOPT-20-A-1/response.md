# Support Desk Pulse — 24 hours ending 2026-10-30 00:00 UTC

## Headlines

- Revenue was **$0**, confirmed by the canonical finance-ledger source; Stripe recorded **0 new customers** and **0 churned customers**.
- Active-agent count is **unknown** because PostHog timed out.
- Sentry reported latency of **82 / 240 / 510 ms** at p50 / p95 / p99 and two error signatures totaling **4 occurrences**.

## Usage

- **Revenue:** $0 USD — finance-ledger, `confirmed-zero`; Stripe is not the canonical revenue source.
- **Active agents:** unknown — PostHog, `unavailable`, `reason_code=timeout`.
- **Engagement, value realization, completions and conversion ratios:** unavailable from the supplied export; event names and counts were not supplied.
- **Customers:** 0 new; 0 churned — Stripe, `confirmed-zero`.
- **Quality sample:** `not-run`, `reason_code=quality-source-minimization-unavailable`; no score produced.
- Provider-side removal of identity fields was unavailable; no raw conversation content was fetched.
- Current strategy documents were outside the supplied evidence; metrics above follow the exported configuration and owner mapping. No prior-window comparison was supplied.

## System performance

- **Latency:** p50 **82 ms**, p95 **240 ms**, p99 **510 ms**.
- **Top errors by count:** only two signatures were supplied; no additional entries inferred.
  1. **ExportTimeout — 3:** export-related timeout signature; affected operations and cause were not supplied.
  2. **InvalidMonth — 1:** month-related validation signature; triggering input and user impact were not supplied.

## Followups

- Restore PostHog reporting and obtain an aggregate receipt for the same window to resolve the unknown active-agent count.
- Investigate the three ExportTimeout occurrences using scoped trace evidence to identify affected operations and cause.
- Inspect the InvalidMonth failure path to establish its trigger and whether validation communicated a recoverable error.
- Enable provider-side identity minimization before quality sampling, and specify the missing quality dimension before scoring.

_Source evidence: supplied local exports only; no live queries performed. W = 2026-10-29T00:00:00Z → 2026-10-30T00:00:00Z. Receipt windows were not individually supplied; W is the export-level window. The 15-minute trailing buffer cannot be verified._
- **finance-ledger:** `confirmed-zero`; `reason_code=query-succeeded`; window=W; freshness=2026-10-30T00:02:00Z; scope: revenue only.
- **posthog:** `unavailable`; `reason_code=timeout`; window=W; freshness=2026-10-30T00:03:00Z; limitation: active-agent count unknown.
- **sentry:** `confirmed-value`; `reason_code=query-succeeded`; window=W; freshness=2026-10-30T00:03:00Z; limitation: error context and prior comparison absent.
- **stripe:** `confirmed-zero`; `reason_code=query-succeeded`; window=W; freshness=2026-10-30T00:02:00Z; scope: new/churned customers, not canonical revenue.
- **quality-sample:** `not-run`; `reason_code=quality-source-minimization-unavailable`; window=W; freshness=not supplied; limitation: provider cannot remove identity fields before returning content.
- **database:** `not-configured`, derived from `pulse_db_enabled=false`; reason_code=not supplied; requested window=W; freshness=not applicable; no database access.
_Chat-only report for caller saving; no files or configuration written. Scheduling remains manual; no scheduling action taken._
