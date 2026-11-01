# CEOPT-01-B2 — Regression evidence decision

Only `stable.tsv` supports **STABLE**, limited to its single performance SCORE cell. `hard.tsv`, `visual-ui.tsv`, and `visual.tsv` are **UNSTABLE**. `unknown.tsv` is **INVALID_INPUT**, with no valid safety verdict. None establishes overall application stability or permission to ship.

| Fixture | Raw evidence | Recorded B helper result | Scoped disposition |
|---|---|---|---|
| `hard.tsv` | Performance subscore 100; functional HARD cell is `regression-eligible` and `regressed=true`. | Exit 1; identifies the functional blocker; `UNSTABLE`. | **UNSTABLE.** A qualifying HARD regression overrides the performance score. |
| `visual-ui.tsv` | Performance subscore 100; eligible `visual-ui` SCORE cell has subscore 0 and `regressed=true`. | Exit 1; performance contribution 60, visual contribution 0; score 60; `UNSTABLE`. | **UNSTABLE.** Both available SCORE dimensions must contribute. |
| `visual.tsv` | Same scoring evidence, with dimension named `visual`. | Exit 1; same contributions and score 60; `UNSTABLE`. | **UNSTABLE.** The visual alias does not change the result. |
| `unknown.tsv` | One valid performance cell followed by a performance cell classified `unknown`. | Exit 2; stderr `INVALID_INPUT` and `row 2: unknown classification`; no stdout verdict. | **INVALID_INPUT / ERROR.** Do not discard the invalid row, interpret it as unavailable coverage, or accept the valid row alone. |
| `stable.tsv` | One eligible performance SCORE cell with subscore 100 and `regressed=false`. | Exit 0; score 100; `STABLE`; flakiness, resource, and visual explicitly unavailable. | **STABLE for supplied performance scoring only.** No HARD-dimension coverage or broader stability is demonstrated. |

## Reconciliation and aliases

The recorded B helper outcomes agree with the supplied TSV evidence and frozen scoring contract.

For either visual fixture, the available weights are performance 0.30 and visual 0.20:

`(0.30 × 100 + 0.20 × 0) / (0.30 + 0.20) = 60`

The threshold recorded in the receipts is 95. Omitting the visual cell would incorrectly inflate the score to 100. The frozen helper normalizes `visual-ui` to its internal `visual` key; the workflow registry uses `visual-ui` and documents `visual` as an alias. The two receipts demonstrate equivalent scoring for these spellings.

The source also accepts legacy classification `eligible` as `regression-eligible`. These fixtures use the latter, so legacy classification compatibility is source-supported but not exercised by these receipts.

The HARD fixture's performance contribution is not printed because the helper exits upon reporting the HARD blocker. This does not make that cell unavailable or change the verdict.

The fixtures display baseline and candidate values of 100 and delta 0 even where `regressed=true` or subscore 0. The contract treats those display values, descriptions, and `status=ran` as descriptive. The helper consumes the classification, tier, regression flag, and eligible subscore; it does not authenticate baseline execution, candidate execution, or upstream classification correctness. These synthetic fixtures demonstrate scorer behavior, not actual application regressions.

## Recovery and check obligations

- **HARD blocker:** retain the blocker and withhold stability. In an authorized implementation run, verify baseline eligibility and reproduce the failure before root-cause work; bisect requires 3/3 reproducibility. If repairs are requested, each bounded repair cycle must strictly reduce the blocking set, and final re-gating must cover the full battery.
- **Visual SCORE failures:** investigate the underlying differential and render evidence. A SCORE failure does not qualify for HARD-regression bisect. Preserve alias equivalence and recheck both available dimensions after any repair.
- **Invalid classification:** return an ERROR handoff without a STABLE verdict. Repair or rerun the producer using actual baseline evidence to determine classification, then validate and rescore the complete input. Do not relabel `unknown` merely to obtain a passing score.
- **Scoped STABLE:** list performance as the only scored dimension and preserve the explicit unavailable dimensions. Any dimension required by the actual acceptance scope still needs evidence; this score cannot waive it.
- **Orchestrator recovery:** before resuming an authorized loop, validate its ledger and re-screen persisted commands, retaining the exact pinned predicate. Unresolved errors, failed hops, coverage gaps, and pending independent verification must prevent convergence. Consecutive unknown units must not be treated as zero progress; three route to BLOCKED. Classification `unknown` in this TSV is an input error, distinct from the orchestrator's unknown-units condition.
- **High-impact acceptance and shipping:** independent held-out verification remains required when applicable. A scorer verdict does not approve commit, push, publication, or deployment.

## Evidence boundary

This decision uses the frozen B skill, regression workflow, routing reference, scorer source, five supplied TSV fixtures, and `autoresearch-B-receipts.json`. No application, helper, test, network operation, mutation, or delegation was performed during this assessment.

The supplied receipts record `inputs_unchanged=true` and `scratch_cleaned=true`. This supports the observed scorer-input preservation and scratch cleanup only. Orchestrator recovery/check state was **not tested**; ledger preservation, recovery correctness, independent verification, and broader state preservation remain unverified. No A/B acceptance judgment is made.
