# Pulse Report Template

Loaded by `SKILL.md` at Phase 2.3 after queries have returned. Fill the template using the query results. Target total length: 30-40 lines.

## Rules for filling in

- Use real numbers, not ranges or hedges. If a number is uncertain, note the source inline.
- Percent deltas compare the current window to the previous equal-length window (e.g., for `24h`, compare to the prior `24h`). If no comparison is possible, omit the delta rather than inventing one.
- No hardcoded thresholds. Do not label things "high" or "low" or color anything red unless the reader asked for threshold-based annotation at setup.
- No PII. No emails, no account IDs, no message content.
- Headlines are the top of the page. If a reader only reads the first 3 lines, they should know the most important thing that happened.
- If `STRATEGY.md` exists, re-read its `## Key metrics` section before assembling the report. For each strategy metric, decide what to render:
  - If the metric name appears in `pulse_excluded_metrics`, omit it from the report.
  - If the metric name appears in `pulse_pending_metrics`, include it in the Usage section marked `no data (instrumentation pending)`.
  - Otherwise, resolve the source for this metric: look it up in `pulse_metric_sources` (CSV of `metric=source` pairs); if present, use that source. If absent, fall back to `pulse_analytics_source` and append `(default source)` to the metric line so the implicit routing is visible. Then query and render the metric with its current value and delta. If no confirmed value exists, include the metric with its source status and `reason_code`; do not invent zero or collapse a provider failure into generic `no data`.
- Preserve one compact source-status line per expected source. Allowed states are `confirmed-value`, `confirmed-zero`, `not-configured`, `unavailable`, `permission-denied`, and `partial`. Every line includes `reason_code`, queried window, `freshness`, and any limitation. A real measured zero is `confirmed-zero`; an empty, denied, truncated, or failed response is not.

## Template

The block below is the literal content to write. Replace every `{{placeholder}}` with query output. Delete optional metric lines only when they are genuinely out of scope; preserve configured/expected source status even when data is unavailable.

~~~markdown
# {{product_name}} Pulse - {{window}} - {{YYYY-MM-DD HH:MM}} {{TZ}}

## Headlines

- {{one-line headline capturing the most notable thing in the window}}
- {{optional second headline}}
- {{optional third headline}}

## Usage

- **Primary engagement:** {{N events}} ({{delta vs prior window}})
- **Value realization:** {{N events}} ({{delta}}) - {{ratio vs engagement}}
- **Completions / conversions:**
  - {{conversion event 1}}: {{N}} ({{delta}})
  - {{conversion event 2}}: {{N}} ({{delta}})
- **Strategy metrics (if carried forward):**
  - {{metric name}}: {{value}} ({{delta}})
- **Quality sample (if configured):** {{distribution e.g. "8x 5, 1x 4, 1x 2"}}

## System performance

- **Latency:** p50 {{ms}}, p95 {{ms}}, p99 {{ms}} ({{delta vs prior window}})
- **Top errors** (top 5 by count, descending):
  1. **{{error signature}}** - {{N occurrences}} - {{one-line context, no PII}}
  2. **{{error signature}}** - {{N occurrences}} - {{one-line context}}
  3. **{{error signature}}** - {{N occurrences}} - {{one-line context}}
  4. **{{error signature}}** - {{N occurrences}} - {{one-line context}}
  5. **{{error signature}}** - {{N occurrences}} - {{one-line context}}

## Followups

- {{One thing worth investigating next - specific enough to act on}}
- {{Another thing worth investigating}}
- {{3-5 items max; trim if thin}}

---
_Source status: analytics={{status}} reason_code={{reason_code}} window=[{{start}} -> {{end}}] freshness={{freshness}}; tracing={{status}} reason_code={{reason_code}} window=[{{start}} -> {{end}}] freshness={{freshness}}; payments={{status}} reason_code={{reason_code}} window=[{{start}} -> {{end}}] freshness={{freshness}}. Allowed status: confirmed-value | confirmed-zero | not-configured | unavailable | permission-denied | partial. Trailing buffer: 15m. Saved to `docs/pulse-reports/{{YYYY-MM-DD}}_{{HH-MM}}.md`._
~~~

## Variations

- **No system performance tool configured:** omit the entire `## System performance` section. The report stays Headlines / Usage / Followups.
- **Quality scoring not opted in:** omit the quality sample line.
- **Single-source setup (analytics only):** keep tracing/payments as `not-configured` only when they are expected by the report contract; otherwise omit truly out-of-scope source types and preserve every configured source receipt. Quality scoring blocked before access is `not-run`, never `confirmed-zero`.

## Post-write checklist

Before saving and surfacing to chat:

- [ ] Total length is 30-40 lines (give or take 5).
- [ ] Headlines exist and lead with the most notable item.
- [ ] No hardcoded thresholds ("high error rate", "low conversion").
- [ ] No PII. Scan error signatures and followups for user emails, IDs, or message snippets.
- [ ] Top 5 errors, not top 10. Trim if the query returned more.
- [ ] Strategy metrics carried forward from config are rendered in Usage, marked `no data (instrumentation pending)`, or paired with the source's explicit non-confirmed status and `reason_code`.
- [ ] Every expected source has one of `confirmed-value`, `confirmed-zero`, `not-configured`, `unavailable`, `permission-denied`, `partial`, or `not-run`, plus `reason_code`, window, and `freshness`.
- [ ] Followups are specific - each one should be actionable as a sentence.
- [ ] Filename and in-file timestamp use the same wall-clock time.

## What to surface in chat

After writing the file, post back:

- The Headlines section verbatim
- The top Followup, if action looks urgent
- The saved file path so the user can open the full report

Do not paste the full report into chat - the file is the artifact.
