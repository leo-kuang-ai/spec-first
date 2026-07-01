# Code Review Output Template

Use this **exact format** when presenting synthesized review findings. Findings are grouped by severity, not by reviewer.

**IMPORTANT:** Use pipe-delimited markdown tables (`| col | col |`). Do NOT use ASCII box-drawing characters. Escape every literal pipe inside a cell as `\|` before rendering; unescaped cell pipes break the table.

## Example

```markdown
## Code Review Results

**Scope:** merge-base with the review base branch -> working tree (14 files, 342 lines)
**Intent:** Add order export endpoint with CSV and JSON format support
**Mode:** autofix
**scope_boundary:** concern
**authorized_scope_source:** inferred-plan
**finding_type:** missing_verification
**graph_assist:** used
**graph_reason_code:** candidate_results
**expansion_budget:** max_5_high_impact_symbols

**Reviewers:** correctness, testing, maintainability, security, api-contract
- security -- new public endpoint accepts user-provided format parameter
- api-contract -- new /api/orders/export route with response schema

### P0 -- Critical

| # | File | Issue | Reviewer | Confidence-first | Route |
|---|------|-------|----------|------------|-------|
| 1 | `orders_controller.rb:42` | User-supplied ID in account lookup without ownership check | security | 100 | `gated_auto -> downstream-resolver` |

### P1 -- High

| # | File | Issue | Reviewer | Confidence-first | Route |
|---|------|-------|----------|------------|-------|
| 2 | `export_service.rb:87` | Loads all orders into memory -- unbounded for large accounts | performance | 100 | `safe_auto -> review-fixer` |
| 3 | `export_service.rb:91` | No pagination -- response size grows linearly with order count | api-contract, performance | 75 | `manual -> downstream-resolver` |

### P2 -- Moderate

| # | File | Issue | Reviewer | Confidence-first | Route |
|---|------|-------|----------|------------|-------|
| 4 | `export_service.rb:45` | Missing error handling for CSV serialization failure | correctness | 75 | `safe_auto -> review-fixer` |

### P3 -- Low

| # | File | Issue | Reviewer | Confidence-first | Route |
|---|------|-------|----------|------------|-------|
| 5 | `export_helper.rb:12` | Format detection could use early return instead of nested conditional | maintainability | 75 | `advisory -> human` |

### Applied Fixes

- `safe_auto`: Added bounded export pagination guard and CSV serialization failure test coverage in this run

### Residual Actionable Work

| # | File | Issue | Route | Next Step |
|---|------|-------|-------|-----------|
| 1 | `orders_controller.rb:42` | Ownership check missing on export lookup | `gated_auto -> downstream-resolver` | Defer via tracker (requires explicit approval before behavior change) |
| 3 | `export_service.rb:91` | Pagination contract needs a broader API decision | `manual -> downstream-resolver` | Defer via tracker with contract and client impact details |

### Pre-existing Issues

| # | File | Issue | Reviewer |
|---|------|-------|----------|
| 1 | `orders_controller.rb:12` | Broad rescue masking failed permission check | correctness |

### Learnings & Past Solutions

- [Known Pattern] `docs/solutions/export-pagination.md` -- previous export pagination fix applies to this endpoint

### Learning Capture Recommendation

- Current review produced a reusable lesson about export pagination review heuristics; user may run the current host's compound entrypoint with brief context.

### Agent-Native Gaps

- New export endpoint has no CLI/agent equivalent -- agent users cannot trigger exports

### Schema Drift Check

- Clean: schema.rb changes match the migrations in scope

### Deployment Notes

- Pre-deploy: capture baseline row counts before enabling the export backfill
- Verify: `SELECT COUNT(*) FROM exports WHERE status IS NULL;` should stay at `0`
- Rollback: keep the old export path available until the backfill has been validated

### Rule Maturity Candidates

| rule_id | evidence_ref | reason_code | human_review_kind | similar_existing_rule_ids |
|---------|--------------|-------------|-------------------|---------------------------|
| `summary-generated-output-staged` | `docs/validation/review.md#F2` | `generated-runtime-path` | `adjudication-review` | `[]` |

### Coverage

- Direct evidence: <source refs/checks/logs used | limitations>
- scope_boundary_evidence: plan R2/U1 covers `orders_controller.rb`; `export_helper.rb` is adjacent but not declared
- provider_untrusted.summaries[]: code-graph returned `OrderExportService -> CsvWriter` and candidate `export_service_test.rb`; direct source confirmed the caller but no test covers concurrent export
- expansion_budget: max_5_high_impact_symbols
- changed_symbols: `OrdersController#export`, `OrderExportService#call`
- changed_entrypoints: `GET /api/orders/export`
- changed_contracts: CSV export response contract
- symbol_mapping_status: mapped
- impact_chain_candidates: `OrdersController#export -> OrderExportService#call`
- blast_radius_candidates: export endpoint and CSV writer
- caller_callee_paths: `OrdersController#export -> OrderExportService#call -> CsvWriter.write`
- affected_test_candidates: `test/controllers/orders_controller_test.rb`, `test/services/order_export_service_test.rb`
- tests_for_query_result: controller export tests found; no concurrent export assertion confirmed
- missing_test_confirmation: no targeted test confirms concurrent export behavior
- review_priority_candidates: `OrdersController#export` (public endpoint + auth risk), `OrderExportService#call` (memory risk + missing test)
- test_gaps: No test for concurrent export requests
- Suppressed: 2 findings below anchor 75 (1 at anchor 50, 1 at anchor 25)
- Residual risks: No rate limiting on export endpoint
- Testing gaps: No test for concurrent export requests

---

> **Verdict:** Ready with fixes
>
> **Reasoning:** 1 critical auth bypass must be fixed. The memory/pagination issues (P1) should be addressed for production safety.
>
> **Fix order:** P0 auth bypass -> P1 memory/pagination -> P2 error handling if straightforward
```

## Anti-patterns

Do NOT produce output like this. The following is wrong:

```markdown
Findings

Sev: P1
File: foo.go:42
Issue: Some problem description
Reviewer(s): adversarial
Confidence: 75
Route: advisory -> human
────────────────────────────────────────
Sev: P2
File: bar.go:99
Issue: Another problem
```

This fails because: no pipe-delimited tables, no severity-grouped `###` headers, uses box-drawing horizontal rules, no numbered findings, no `## Code Review Results` title, and the verdict is not in a blockquote. Always use the table format from the example above.

## Formatting Rules

- **Pipe-delimited markdown tables** for findings -- never ASCII box-drawing characters or per-finding horizontal-rule separators between entries (the report-level `---` before the verdict is still required)
- **Escape literal pipes inside table cells** -- replace cell text `|` with `\|` before rendering, including shell pipelines, TypeScript union types, markdown examples, and copied reviewer text.
- **Severity-grouped sections** -- `### P0 -- Critical`, `### P1 -- High`, `### P2 -- Moderate`, `### P3 -- Low`. Omit empty severity levels.
- **Stable sequential finding numbers** -- assign finding numbers once after sorting, continue them across severity sections, and reuse those same numbers when findings are repeated in Residual Actionable Work. Do not restart at `1` for each severity or route bucket.
- **Always include file:line location** for code review issues
- **Reviewer column** shows which persona(s) flagged the issue. Multiple reviewers = cross-reviewer agreement.
- **Confidence-first column** shows the finding's anchor as an integer (`50`, `75`, or `100`). Never render as a float.
- **Route column** shows the synthesized handling decision as ``<autofix_class> -> <owner>``.
- **Header includes** scope, intent, and reviewer team with per-conditional justifications
- **Mode line** -- include `interactive`, `autofix`, `report-only`, or `headless`
- **Stable boundary fields** -- include `scope_boundary`, `authorized_scope_source`, and Coverage `scope_boundary_evidence`
- **Stable finding type fields** -- include derived `finding_type` labels when scope-boundary or verification findings are present
- **Stable graph fields** -- always include `graph_assist`, `graph_reason_code`, and `expansion_budget`; include Coverage `provider_untrusted.summaries[]` and candidate fields when graph/code-graph candidates shaped review focus, fallback happened, or limitations need to be explicit
- **Applied Fixes section** -- include only when a fix phase ran in this review invocation
- **Residual Actionable Work section** -- include only when unresolved actionable findings were handed off for later work
- **Pre-existing section** -- separate table, no confidence-first column (these are informational)
- **Learnings & Past Solutions section** -- results from spec-learnings-researcher, with links to docs/solutions/ files
- **Learning Capture Recommendation section** -- include only when the current review produced a new reusable lesson; omit for mechanical, one-off, or formatting-only results
- **Agent-Native Gaps section** -- results from spec-agent-native-reviewer. Omit if no gaps found.
- **Schema Drift Check section** -- results from spec-schema-drift-detector. Omit if the agent did not run.
- **Deployment Notes section** -- key checklist items from spec-deployment-verification-agent. Omit if the agent did not run.
- **Coverage section** -- direct evidence posture, suppressed count, residual risks, first-class `test_gaps`, failed reviewers, boundary fields, graph fallback/candidate fields, and limitations
- **Rule Maturity Candidates section** -- optional; include only when confirmed findings or resource advisory meet the noise filter and have durable evidence refs
- **Summary uses blockquotes** for verdict, reasoning, and fix order
- **Horizontal rule** (`---`) separates findings from verdict
- **`###` headers** for each section -- never plain text headers

## Headless Mode Format

In `mode:headless`, replace the interactive pipe-delimited table report with a structured text envelope. The headless format is defined in the `### Headless output format` section of SKILL.md. Key differences from the interactive format:

- **No pipe-delimited tables.** Findings use `[severity][autofix_class -> owner] File: <file:line> -- <title>` line format with indented Why/Evidence/Suggested fix lines.
- **Findings grouped by autofix_class** (gated-auto, manual, advisory) instead of severity. Within each group, findings are sorted by severity.
- **Verdict in header** (top of output) instead of bottom, so programmatic callers get it first.
- **`Artifact:` line** in metadata header gives callers the path to the full run artifact.
- **`[needs-verification]` marker** on findings where `requires_verification: true`.
- **Evidence lines** included per finding.
- **Completion signal:** "Review complete" as the final line.
