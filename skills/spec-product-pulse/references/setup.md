# First-run setup

Read this on a first run or an explicit `setup`/`reconfigure`/`edit config` request.


#### 1.0 Seed from strategy (if available)

Before asking questions, read `references/strategy-source.md`, resolve the product name and metrics from current files, and show the actual source and candidates. It owns STRATEGY precedence, legacy fallback, semantic extraction, and the no-source path; reports use the same rule.

#### 1.1 Interview

Read `references/interview.md`. This load is non-optional - the pushback rules, anti-pattern examples, and metric-to-source mapping logic live there.

Run the interview in this order:

1. Product name (confirm or edit the seeded value)
2. Primary engagement event
3. Value-realization event
4. Completions or conversions (0-3)
5. Quality scoring (opt-in, AI products only)
6. Data sources - wire up connections for each agreed metric and event. Nudge toward MCP. Reject read-write database access. DB entirely optional.
7. System performance - a short recommended setup for top errors and latency. Users rarely have strong opinions here; present defaults and accept.
8. Default lookback window

Apply the pushback rules in `references/interview.md` for each section. Treat every metric, event, and signal the user proposes against the **SMART bar** (specific, measurable, actionable, relevant, timely) spelled out in `references/interview.md` under "Overall Rules" - push back on anything vague, vanity, or unactionable.

If the user offers read-write database access, refuse and offer the alternatives documented in `references/interview.md` section 6.

Write the captured config to `<repo-root>/.spec-first/config.local.yaml` as flat `pulse_*` keys, using the schema in `references/interview.md` under "Config file shape". Resolve the repo root with `git rev-parse --show-toplevel`. To write: (1) if the file or directory does not exist, create `.spec-first/` and write the YAML file; (2) if the file exists, merge new keys into the existing YAML, preserving any non-pulse keys (e.g., `work_delegate_*`, `plan_*`) untouched. If `.spec-first/config.local.yaml` is not already covered by the repo's `.gitignore`, offer to add the entry before writing. Show the resulting pulse block to the user in chat and offer one round of edits.

After the config is written, run the **scheduling recommendation** from `references/interview.md` section 9: offer to set up a recurring run so the user gets the pulse on a cadence instead of having to remember to run it. Accept yes/no/later. If yes, hand off to whichever scheduling primitive the current harness exposes; otherwise note that scheduling is platform-specific (cron, GitHub Actions, the host's own automation) and emit a brief hint covering what would need to run. Do not schedule inline. Then proceed to Phase 2.
