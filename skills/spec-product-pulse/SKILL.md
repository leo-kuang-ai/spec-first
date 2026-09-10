---
name: spec-product-pulse
description: "Generate time-windowed product pulse reports from configured signals."
disable-model-invocation: true
argument-hint: "[lookback window, e.g. '24h', '7d', '1h'; default 24h]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
---

# Product Pulse

`spec-product-pulse` queries the product's data sources for a given time window and produces a compact, single-page report covering usage, performance, errors, and followups. The report is saved to `docs/pulse-reports/` and the key points are surfaced in chat.

The skill does not mutate the product, the database, or any external system. Its only writes are pulse settings appended to `.spec-first/config.local.yaml` (the unified spec-first local config, gitignored, machine-local) and the report file (`docs/pulse-reports/...`). MCP and other data-source tools are invoked read-only; if a tool offers write modes, do not use them.

The fixed `docs/pulse-reports/` contract always renders latency (p50/p95/p99) and top 5 errors by count when system performance data is available. Quality scoring requires provider-side projection; if unavailable, record `not-run` with `quality-source-minimization-unavailable` and do not attempt local redaction after content enters context.

## Interaction Method

Default to the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

Ask one question at a time. Reserve multi-select for first-run configuration only.

## Lookback Window

Interpret the user's current request as a time window when one is provided. Common forms:

- `24h`, `48h`, `72h` - trailing hours
- `7d`, `30d` - trailing days
- `1h` - short-window (useful during launches)

If the argument is empty, default to `pulse_lookback_default` from config (resolved in Phase 0); if that is also unset, fall through to the hard default of `24h`. If the argument is unparseable, ask the user to clarify.

Apply a **15-minute trailing buffer** to the window's upper bound. Many analytics and tracing tools have ingestion lag; querying right up to `now` under-reports the most recent events. For a `24h` window, query `[now - 24h - 15m, now - 15m]`.

## Core Principles

1. **Read it like a founder.** No hardcoded thresholds. Do not label things "bad" or "good" by default - present the numbers and let the reader judge.
2. **Single page.** Target 30-40 lines of terminal output. If the report is getting long, cut.
3. **No PII in saved reports.** Do not include user emails, account IDs, or message content in the report written to disk.
4. **Parallel where safe, serial where it matters.** Analytics and tracing queries run in parallel. Database queries run serially to avoid load.
5. **Memory through saved reports.** Every run writes to `docs/pulse-reports/` so past pulses are browseable as a timeline.
6. **Read-only database access only.** If a database is used as a data source, the connection must be read-only. The interview refuses to accept read-write credentials. Database access is optional - many products complete the pulse with analytics and tracing alone.
7. **Strategy-seeded when available.** Setup and every report resolve current files using `references/strategy-source.md`: prefer STRATEGY, then VISION and PRODUCT when it is absent; read metrics by meaning and follow explicit legacy delegation. Product names and metrics seed measurement-source setup without rewriting strategy documents.

## Execution Flow

Read `references/config.md`, `references/setup.md`, and `references/run.md` at their corresponding phases. These references own detailed config interpretation, interview/setup, and query/report procedures; this entrypoint retains the read-only, local-config, PII, and artifact boundaries.

### Phase 0: Route by Config State

Read `references/config.md`. Resolve `<repo-root>` at runtime with `git rev-parse --show-toplevel`, then read `<repo-root>/.spec-first/config.local.yaml`. An absent root/config or unset `pulse_product_name` routes to the first-run interview; otherwise continue to the pulse run. An explicit `setup`, `reconfigure`, or `edit config` argument always routes to setup.

The active keys include `pulse_product_name`, `pulse_lookback_default`, `pulse_primary_event`, `pulse_value_event`, `pulse_completion_events`, `pulse_quality_scoring`, `pulse_quality_dimension`, `pulse_analytics_source`, `pulse_tracing_source`, `pulse_payments_source`, `pulse_db_enabled`, `pulse_metric_sources`, `pulse_pending_metrics`, `pulse_excluded_metrics`, and `pulse_schedule`. Invalid or missing values use the defaults documented in `references/config.md`; do not guess.

### Phase 1: First-Run Interview

Read `references/setup.md`, which requires `references/interview.md` and `references/strategy-source.md`. It owns strategy seeding, the SMART interview bar, read-write database refusal, preserving non-pulse keys in `.spec-first/config.local.yaml`, and the explicit scheduling handoff.

### Phase 2: Run the Pulse

Read `references/run.md` before dispatching queries. Re-read local config after setup edits, preserve per-source receipts (`confirmed-value`, `confirmed-zero`, `not-configured`, `unavailable`, `permission-denied`, `partial`, `not-run`) and `confirmed-zero` semantics, keep analytics/tracing/payments parallel and read-only DB work serial, and write the four-section report to the fixed `docs/pulse-reports/` contract.

### Phase 3: Routine Hook

First-run setup already offered scheduling (see Phase 1.1 end). Phase 3 is a lighter re-surface for ad-hoc runs:

- If the argument was a known schedule keyword (`daily`, `hourly`, `weekly`), note that this run is ad-hoc and suggest scheduling via the harness's available primitive, or a platform-native option when no scheduling primitive is available.
- If no schedule is on file and this is the third or later pulse run the user has done, mention once that scheduling is available. Don't nag on every run.

Never schedule automatically. Any scheduling handoff requires explicit confirmation.

## What This Skill Does Not Do

- Does not report "what shipped." Shipped work lives in the issue tracker and commit history, not here. Pulse is strictly about user experience and system performance.
- Does not set thresholds or alert the user. The reader interprets.
- Does not persist PII in saved reports.
- Does not mutate the database or any external system. All queries are read-only.
- Does not replace tracing dashboards or analytics tools. It consolidates a single-page read; deep investigation still uses the native tools.

## Learn More

The "read like a founder" posture and the single-page constraint are deliberate. Dashboards with 40 metrics produce attention sprawl; one page with the right four sections forces the reader to notice what matters. The saved-reports folder is designed to be a team's working memory, not a data warehouse - past pulses are grepable, diffable, and disposable.
