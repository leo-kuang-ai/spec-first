# Support Desk Pulse — October 29, 2026 (UTC)

## Headlines

- Canonical revenue was **$0**; Stripe separately recorded **0 new customers** and **0 churned customers**.
- Active-agent count remains **unknown** because PostHog timed out; this is not a measured zero.
- Sentry reported latency of **82 / 240 / 510 ms** (p50/p95/p99) and two error signatures totaling **4 occurrences**.

## Usage

- **Revenue:** $0 — `finance-ledger`, `confirmed-zero`; Stripe is not the canonical revenue source.
- **Active agents:** unknown — `posthog`, `unavailable`, `reason_code: timeout`.
- **Customer movements:** 0 new; 0 churned — `stripe`, `confirmed-zero`.
- **Engagement, value realization, and conversions:** event definitions and measurements were not supplied; no ratios calculated.
- **Quality sample:** `not-run`, `quality-source-minimization-unavailable`; no score or raw content fetched.
- **Strategy coverage:** configured metrics retained; strategy documents were not supplied, so completeness is unverified.
- **Comparison:** no previous-window receipts supplied; no deltas calculated.

## System performance

- **Latency:** p50 **82 ms**, p95 **240 ms**, p99 **510 ms**.
- **Top errors by count:** only two signatures supplied; no additional entries inferred.
  1. **ExportTimeout — 3 occurrences:** signature indicates an export timeout; cause and affected-user scope are unverified.
  2. **InvalidMonth — 1 occurrence:** signature indicates an invalid-month condition; triggering input and cause are unverified.

## Followups

- Restore PostHog access and rerun the same window to establish active-agent count; retain its current unknown state until successful measurement.
- Inspect the three `ExportTimeout` traces and the `InvalidMonth` trace to establish causes, affected operations, and user impact.
- Before quality scoring, enable provider-side removal of identity and unrelated fields, and define scoring anchors; do not fetch raw sessions.

---
**Evidence:** supplied local exports only; no live queries performed. Report rendered in chat; no files, configuration, or schedules changed.
**Window W:** `[2026-10-29T00:00:00Z, 2026-10-30T00:00:00Z]`, used exactly as supplied. Individual receipts omit window bounds; alignment and the standard 15-minute ingestion buffer cannot be independently verified.
**Source status — finance-ledger:** `confirmed-zero`; `reason_code=query-succeeded`; supplied window W; freshness `2026-10-30T00:02:00Z`; revenue only.
**Source status — posthog:** `unavailable`; `reason_code=timeout`; supplied window W; freshness `2026-10-30T00:03:00Z`; active-agent count unknown.
**Source status — sentry:** `confirmed-value`; `reason_code=query-succeeded`; supplied window W; freshness `2026-10-30T00:03:00Z`; latency and two signatures supplied, without diagnostic context.
**Source status — stripe:** `confirmed-zero`; `reason_code=query-succeeded`; supplied window W; freshness `2026-10-30T00:02:00Z`; customer movements only.
**Source status — quality-sample:** `not-run`; `reason_code=quality-source-minimization-unavailable`; intended window W, no query; freshness not supplied; provider cannot remove identity fields before returning content.
**Source status — database:** `not-configured`; report-derived `reason_code=db-disabled`, based on `pulse_db_enabled=false`; intended window W, no query; freshness not applicable.
