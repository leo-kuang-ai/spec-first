---
title: "spec-code-review Phase A boundary and graph adoption readout"
type: validation
status: completed
date: 2026-07-01
plan: docs/plans/2026-07-01-002-feat-spec-code-review-boundary-graph-eval-plan.md
---

# spec-code-review Phase A boundary and graph adoption readout

## Summary

Phase A establishes a review-only contract floor for Diff Boundary Review, Graph-Assisted Impact Review, symbol/test-gap Coverage, and stable report/headless field names. This readout is representative adoption evidence for the source contract and fixture floor. It does not prove durable graph impact capability, reviewer stability, or no-noise behavior across arbitrary diffs; those claims remain Phase D work.

## Representative Diff 1: Explicit Touch Set Violation

- Input shape: declared touch set includes `skills/foo/SKILL.md`; diff also changes `src/cli/plugin.js`.
- Before: the report could describe intent mismatch in prose, but had no stable boundary field and could appear code-clean while missing the unauthorized file change.
- After:

```text
scope_boundary: violation
authorized_scope_source: explicit-touch-set
finding_type: unauthorized_file_change
graph_assist: fallback
graph_reason_code: readiness_unknown

Coverage:
- scope_boundary_evidence: declared file `skills/foo/SKILL.md`; diff includes `src/cli/plugin.js`
- symbol_mapping_status: degraded
- review_priority_candidates: `src/cli/plugin.js` first because it is outside scope and CLI/runtime-facing
- test_gaps: none
```

- Expected finding: `finding_type=unauthorized_file_change`, with direct diff/plan evidence.
- Noise check: no `scope_boundary=clean` when the explicit touch set is violated.

## Representative Diff 2: Diff-Only Shared Helper With Graph Candidate

- Input shape: shared helper changed; provider returns caller candidates; direct source confirmation keeps one caller and rejects one stale candidate.
- Before: impact discussion could live in freeform recommendations, and missing tests could be buried as prose.
- After:

```text
scope_boundary: unknown
authorized_scope_source: diff-only
graph_assist: used
graph_reason_code: candidate_results

Coverage:
- provider_untrusted.summaries[]: code-graph returned caller candidates; one candidate rejected after source read
- changed_symbols: `sharedHelper`
- symbol_mapping_status: mapped
- caller_callee_paths: `commandHandler -> sharedHelper`
- affected_test_candidates: `tests/unit/command-handler.test.js`
- review_priority_candidates: confirmed public caller with missing targeted test first
- expansion_budget: max 5 high-impact symbols or entrypoints before direct-read confirmation
- test_gaps: confirmed caller lacks targeted regression test
```

- Expected finding posture: graph candidates guide direct reads only; graph edge, caller count, or risk score is not confirmed evidence.
- Usefulness: review priority starts with the public caller and missing-test signal rather than scanning every adjacent file.

## Representative Diff 3: Markdown-Only Declared Docs Change

- Input shape: docs-only diff fully matches declared files.
- Before: graph fallback and scope status were not consistently visible.
- After:

```text
scope_boundary: clean
authorized_scope_source: declared-files-only
graph_assist: not_applicable
graph_reason_code: markdown_only_diff

Coverage:
- scope_boundary_evidence: declared docs file matches tracked diff
- provider_untrusted.summaries[]: none
- test_gaps: none
```

- Noise check: no `scope_creep`, no `unverifiable_claim`, no `graph_assist=used`.
- Fallback honesty: Markdown-only diffs use `not_applicable`, not a failed graph claim.

## Fallback Sample

When provider readiness is missing or unknown:

```text
graph_assist: fallback
graph_reason_code: readiness_unknown

Coverage:
- provider_untrusted.summaries[]: graph provider readiness unknown; review used bounded diff/source reads and `rg`
- symbol_mapping_status: degraded
- missing_test_confirmation: no provider-backed affected-test candidate confirmed
- limitations: no changed-symbol, affected-test, or caller/callee coverage claimed
```

This proves fallback presentation, not graph impact quality.

## Cost / Time Notes

- This readout is a source-owned contract/adoption artifact, not a multi-run empirical eval.
- The implementation verification used focused Jest contract tests and docs/JSON/diff-shape checks; it did not measure graph provider latency, token cost, or cross-model reviewer variance.
- Minimal-first expansion is intentionally budgeted as `max 5 high-impact symbols or entrypoints` before broader caller/flow expansion. That budget is a review-context containment rule, not a measured performance claim.
- Full cost/time and stability data require Phase D scorecard runs.

## Pilot Limitation

pilot limitation: Phase A evidence is adoption-floor evidence, not broad behavior proof.

- The current evidence is a source-owned contract floor plus representative report snippets.
- The fixture examples and this readout establish contract-floor coverage for scope creep, graph false elevation, clean diff noise, fallback/not-applicable, symbol mapping degraded/mapped states, priority ordering fields, test gap fields, minimal expansion budget language, and pilot boundary language.
- This means field presence, representative snippets, and fixture intent are checked. It does not prove real reviewer behavior, priority ordering quality, minimal expansion adherence, or graph/test-gap stability across models and diffs.
- The readout does not prove durable graph impact capability, no-noise behavior, or cross-model reviewer stability.
- Phase D must add a deterministic scorecard, trial stability, bad-case regression, and human calibration before those broader claims are made.
