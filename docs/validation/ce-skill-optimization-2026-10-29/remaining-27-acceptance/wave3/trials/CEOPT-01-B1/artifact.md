# CEOPT-01-B1 — Regression evidence decision

Only `stable.tsv` supports a **scoped STABLE scorer verdict**, limited to its synthetic performance evidence. `hard.tsv`, `visual-ui.tsv`, and `visual.tsv` are **UNSTABLE**. `unknown.tsv` is **INVALID_INPUT**, with no valid stability verdict. None establishes application readiness or authorizes shipping.

| Fixture | Raw evidence | Supplied helper receipt | Correct disposition |
|---|---|---|---|
| `hard.tsv` | Eligible performance subscore 100 plus eligible functional HARD row with `regressed=true`. | Exit 1; identifies `functional/diff` as blocking; `UNSTABLE`. | **UNSTABLE.** The HARD regression overrides the performance score. |
| `visual-ui.tsv` | Eligible performance subscore 100 and eligible `visual-ui` subscore 0. | Exit 1; performance contribution 60, visual contribution 0; score 60; `UNSTABLE`. | **UNSTABLE.** Renormalized score is `(0.30×100 + 0.20×0)/(0.30+0.20) = 60`, below 95. |
| `visual.tsv` | Same scored evidence as above, using dimension name `visual`. | Exit 1; identical contributions and score; `UNSTABLE`. | **UNSTABLE.** The two visual names represent the same scoring dimension. |
| `unknown.tsv` | One valid performance row plus another row whose classification is `unknown`. | Exit 2; stderr reports `INVALID_INPUT` and `row 2: unknown classification`; no verdict stdout. | **ERROR / INVALID_INPUT.** Do not discard the invalid row and accept the remaining score of 100. |
| `stable.tsv` | One eligible performance row, subscore 100, `regressed=false`. | Exit 0; performance contribution 100; score 100; `STABLE`. | **STABLE only for the supplied scored performance evidence.** Flakiness, resource, and visual remain unavailable; HARD dimensions are not demonstrated. |

The receipts agree with the underlying TSV evidence and the frozen scorer implementation. Two details require interpretation:

- The prose registry uses `visual-ui`; the implementation normalizes `visual-ui` to the internal name `visual`. Consequently, both fixtures report `visual` and receive identical weights. This is alias normalization, not omitted visual coverage. The source also accepts legacy classification `eligible` as `regression-eligible`, but these fixtures do not exercise that classification alias.
- `hard.tsv` contains display values `100 → 100` and delta `0` alongside `regressed=true`. The scorer treats the display values as descriptive and consumes the explicit HARD regression flag. Its blocking result is therefore consistent with its contract. Those synthetic fields do not independently establish an actual green-to-red application failure.

Unavailable dimensions are excluded from the score denominator, not passed. The performance-only score of 100 therefore cannot demonstrate stability across the complete registry. Likewise, `status=ran`, source locations, and descriptions do not authenticate test execution.

Recovery and check obligations:

1. **HARD failure:** Retain the blocking finding. In an authorized execution, establish real baseline/candidate evidence and require 3/3 reproducibility before bisecting. Repairs must be re-gated; an enabled fix loop must strictly shrink the blocking set, respect its cycle bound, and finish with the full battery.
2. **Visual failures:** Investigate the underlying visual comparison and scoring evidence. These are SCORE failures, so a HARD-regression bisect is not justified. Recheck after repair and retain unavailable-dimension disclosures.
3. **Unknown classification:** Produce an ERROR handoff without a STABLE verdict. Repair or rerun the producer using evidence-backed classification; do not relabel the row merely to pass. Revalidate the complete input before scoring again.
4. **Scoped STABLE:** Check whether any unavailable or unrepresented dimension is required by the actual acceptance scope. Obtain that evidence before a broader readiness claim.
5. **Orchestrator recovery:** Validate persisted state and safety-screen persisted predicate commands before resuming. Resolve failures, errors, and pending verification before convergence; repeated unknown units must not count as plateau progress. High-impact changes require independent verification, and shipping still requires explicit authorization. These are obligations, **not tested outcomes** here.

The supplied receipts report `inputs_unchanged=true` and `scratch_cleaned=true`. That supports scorer-input preservation and reported scratch cleanup only. Orchestrator recovery/check-state preservation remains **untested**.

This assessment used read-only inspection of the frozen B skill, regression reference, routing reference, scorer source, fixtures, and B receipts. No scorer, application, test, recovery action, or external operation was executed during this trial.
