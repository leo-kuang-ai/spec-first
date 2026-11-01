# Running the pulse

Read this before dispatching any query.


If Phase 1 ran (first run, or `setup`/`reconfigure`/`edit config` argument), re-read `.spec-first/config.local.yaml` from the repo root using the native file-read tool to pick up any edits accepted during the Phase 1 review step. Otherwise, use the `pulse_*` values already extracted in Phase 0. Read `references/config.md` when interpreting values and apply its documented defaults for unset or invalid settings.

#### 2.1 Dispatch Queries

Resolve strategy-metric routing from `pulse_metric_sources` under `references/config.md` before any query. Query each resolved metric through its canonical source, including providers outside the analytics/tracing/payments defaults; group compatible requests by source. Preserve unresolved metrics as `not-run` (`metric-source-unresolved`), while continuing independently mapped metrics. Report assembly consumes these receipts and does not silently select or query a different source.

Every configured or expected source returns a per-source receipt before report synthesis:

```yaml
source: <configured source id>
status: confirmed-value | confirmed-zero | not-configured | unavailable | permission-denied | partial | not-run
reason_code: <stable source-specific reason>
window: { start: <timestamp>, end: <timestamp> }
freshness: <query completion timestamp or provider watermark>
values: <confirmed values only>
limitations: [<missing slice or claim boundary>]
```

Use `confirmed-zero` only when the source successfully measured the requested window and explicitly returned numeric zero. Missing/empty responses, tool absence, auth failures, timeouts, and truncated pagination are not zero: classify them as `unavailable`, `permission-denied`, or `partial` with a `reason_code`. Use `not-run` only when a pre-query gate deliberately prevented access, such as unavailable provider-side minimization. Preserve `not-configured` for an expected source that has no configured owner. Do not collapse these states to `no data`, omit the source row, or let one successful source hide another source's failure.

Run these in **parallel** (different tools, no shared load):

- Product analytics query (primary event count, value-realization count, completions, conversion ratios) over the window
- Application tracing query (error counts by category, latency distribution, top error signatures) over the window
- Payments query, if configured (new customers, churn, revenue delta) over the window

Run these **serially**, after the parallel batch:

- Read-only database queries, only after an explicit `pulse_db_enabled === true` gate. One at a time. Tight, scoped queries only. Never full-table scans on large tables. If a DB query would be expensive, skip it and note "DB query skipped (estimated cost too high)"; when the gate is false or unset, emit a `not-configured` receipt rather than probing the database.

#### 2.2 Optional: Sample Quality Scoring

If `pulse_quality_scoring` is `true` (AI products only), sample up to 10 sessions or conversations from the window and score each 1-5 on the dimension recorded in `pulse_quality_dimension`.

Quality scoring is content processing, not an aggregate metrics query. Before setup records the opt-in, disclose that the projected conversation/session content needed for scoring will enter the current agent/model context even though it will not be copied into the saved report. At run time, request only a provider-side projection that removes direct identity fields and unrelated message/history fields before the result is returned to the agent. The minimal accepted row contains a provider-stable opaque sample id, the bounded content needed for the configured dimension, window membership, and projection provenance.

If the source cannot project or de-identify before returning data, do not fetch raw sessions and do not attempt local redaction after the content has already entered context. Record the quality source as `not-run` with `reason_code: quality-source-minimization-unavailable`, omit the quality score, and preserve that limitation in the report. Provider-side projection reduces exposure but does not make the content anonymous; keep it out of durable artifacts and worker prompts.

**Scoring discipline:** Use the user-defined anchors persisted in `pulse_quality_dimension`; do not force a distribution or lower scores merely because every sample meets the top anchor. If a legacy dimension lacks enough scoring guidance, report qualitative observations without a numeric score until the anchors are clarified. Preserve sample size, window and selection limitations; a ten-session sample does not establish population quality.

**No PII in the score summary.** Capture a count distribution (e.g., "8x 5, 1x 4, 1x 2") and a short anonymized note on any session scored below 4. Do not include message content or user identifiers in the saved report.

#### 2.3 Assemble the Report

Read `references/report-template.md`. Fill in the template using the query results and per-source receipts. Four sections, in order:

1. **Headlines** - 2-3 lines summarizing the window
2. **Usage** - primary engagement, value realization, completions, quality sample
3. **System performance** - latency (p50/p95/p99) and top 5 errors by count with one-line explanation each
4. **Followups** - 1-5 things worth investigating

Keep the total to 30-40 lines. If a section is thin, leave it thin; do not pad.

#### 2.4 Write the Report

Save to `docs/pulse-reports/YYYY-MM-DD_HH-MM.md` using the local time of the run. Create `docs/pulse-reports/` if it does not exist.

Surface the Headlines and top Followup in chat. Provide the full file path so the user can open the saved report.

Then return to `SKILL.md` Phase 3 for the scheduling re-surface rule. Reaching that phase does not authorize scheduling or require another offer when setup already made it.
