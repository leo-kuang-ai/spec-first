# Pulse Report Template

Loaded by `SKILL.md` at Phase 2.3 after queries have returned. Fill the template using the query results. Target total length: 30-40 lines.

## Rules for filling in

- Use measured numbers with their source units. If the unit is absent, say so rather than supplying a currency or scale. An unknown value is a gap, not a number to estimate.
- Compare only like-for-like, fully observed windows using the same definition. When the previous value is zero, show the two counts rather than a percentage increase. A missing slice cannot support a whole-window delta.
- No hardcoded thresholds. Do not label things "high" or "low" or color anything red unless the reader asked for threshold-based annotation at setup.
- No PII. No emails, no account IDs, no message content.
- Lead with the measured interval and the most important supported observation. Name any gap that changes the decision in those same lines. If nothing was measured, say so and give the first recovery action. Do not interpret that run as quiet or healthy.
- Before assembly, read `references/strategy-source.md` and re-resolve current sources and metrics using the same rule as setup, including STRATEGY precedence, legacy fallback, semantic headings, and explicit delegation. For each defined metric, decide how to render it:
  - If the metric name appears in `pulse_excluded_metrics`, omit it from the report.
  - If the metric name appears in `pulse_pending_metrics`, include it in the Usage section marked `no data (instrumentation pending)`.
  - Otherwise, consume the source mapping and query receipt resolved before dispatch under `references/config.md` and `references/run.md`. Use the metric's explicit `pulse_metric_sources` entry, including class-default mappings. For missing/conflicting legacy mappings, preserve `not-run` with `reason_code: metric-source-unresolved`; do not fall back to analytics. Render only confirmed values and deltas; retain the source status when no confirmed value exists. If a newly discovered metric was not queried, record `not-run` and return to the scoped query step only when its source and access are resolved.
- Preserve one compact source-status line per expected source. Allowed states are `confirmed-value`, `confirmed-zero`, `not-configured`, `unavailable`, `permission-denied`, `partial`, and `not-run`. Every line includes `reason_code`, queried window, `freshness`, and any limitation. A real measured zero is `confirmed-zero`; an empty, denied, truncated, or failed response is not.

## Template

The block below is the literal content to write. Replace every `{{placeholder}}` with query output. Delete optional metric lines only when they are genuinely out of scope; preserve configured/expected source status even when data is unavailable.

~~~markdown
# {{product_name}} Pulse - {{window}} - {{YYYY-MM-DD HH:MM}} {{TZ}}

## Headlines

- {{start and end with time zone; main observation and any decision-changing limitation}}
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
Source receipts (one line per expected source, including custom sources):
- {{source}}: {{status}}; reason_code={{reason}}; window={{start}} to {{end}}; freshness={{watermark or unknown}}; {{limitation, if any}}
~~~

## Variations

- **No system performance tool configured:** omit the entire `## System performance` section. The report stays Headlines / Usage / Followups.
- **Quality scoring not opted in:** omit the quality sample line.
- **Single-source setup (analytics only):** keep tracing/payments as `not-configured` only when they are expected by the report contract; otherwise omit truly out-of-scope source types and preserve every configured source receipt. Quality scoring blocked before access is `not-run`, never `confirmed-zero`.
- **Partial coverage:** “Payments recorded 1,200 in revenue. Analytics access was denied, so we cannot tell how many users were active.” Put the access check in Followups, not a growth or conversion recommendation. Use this form only when the receipts support it.

## Post-write checklist

Before saving and surfacing to chat:

- [ ] A reader can find the main observation and the decision-changing gap on the first screen. A thin window can produce a short report; do not pad it to a line count.
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
- The first actionable Followup when one exists; do not invent one for a quiet, fully observed window
- The saved file path so the user can open the full report

Do not paste the full report into chat - the file is the artifact.
