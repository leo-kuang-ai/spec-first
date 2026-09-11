# Pulse config keys and routing

Read this before interpreting any `pulse_*` value.


**Read config.** Resolve `<repo-root>` at runtime by running
`git rev-parse --show-toplevel` with the shell tool. Then read
`<repo-root>/.spec-first/config.local.yaml` with the native file-read tool. If
the root cannot be resolved or the file does not exist, treat this as a first
run. Otherwise extract the `pulse_*` keys listed below. Reports remain owned by
the fixed `docs/pulse-reports/` contract; this Skill does not introduce a
global configurable artifact root.

**Config keys:**
- `pulse_product_name` -- string, used in report titles. Required for routing: if unset, skill is unconfigured.
- `pulse_lookback_default` -- one of `1h`, `24h`, `7d`, `30d` (default: `24h`)
- `pulse_primary_event` -- string, the engagement event name
- `pulse_value_event` -- string, the value-realization event name
- `pulse_completion_events` -- comma-separated string of 0-3 event names
- `pulse_quality_scoring` -- `true` or default `false` (AI products only)
- `pulse_quality_dimension` -- string scored 1-5 when `pulse_quality_scoring` is true; ignored otherwise
- `pulse_analytics_source` -- string identifying analytics provider (e.g., `posthog`, `mixpanel`, `custom`)
- `pulse_tracing_source` -- string identifying tracing provider (e.g., `sentry`, `datadog`, `custom`)
- `pulse_payments_source` -- string identifying payments provider (e.g., `stripe`, `custom`); omit if not used
- `pulse_db_enabled` -- `true` or default `false`; when `true`, read-only DB access is part of the pulse
- `pulse_metric_sources` -- comma-separated `metric=source` pairs giving per-strategy-metric source overrides (e.g., `retention_d7=posthog,nps=delighted`). Strategy metrics not listed fall back to `pulse_analytics_source` and are rendered with a `(default source)` marker so the implicit routing is visible.
- `pulse_pending_metrics` -- comma-separated string of strategy-doc metric names awaiting instrumentation; rendered as `no data` in each pulse report until instrumentation lands
- `pulse_excluded_metrics` -- comma-separated string of strategy-doc metric names intentionally excluded from the pulse; the metric stays in `STRATEGY.md` but is not surfaced in pulse reports
- `pulse_schedule` -- `daily`, `weekly`, `manual`, or `ask-again-after-3-runs`; include time/day if applicable

**Routing:**

- **`pulse_product_name` is unset (or config file missing)** -> First run. Go to Phase 1 (interview), then Phase 2.
- **`pulse_product_name` is set** -> Skip to Phase 2.

If the argument was `setup`, `reconfigure`, or `edit config`, go to Phase 1 regardless of config state.
