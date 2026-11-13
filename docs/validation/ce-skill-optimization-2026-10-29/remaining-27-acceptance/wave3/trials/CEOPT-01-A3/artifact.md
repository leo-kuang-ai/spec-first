Decision artifact: CEOPT-01-A3

Only `stable.tsv` supports a scoped STABLE assessment of the supplied scored performance cell. `hard.tsv` and both visual fixtures must not pass; `unknown.tsv` remains unresolved. These are synthetic fixture assessments, not application regression verification or release approval.

| Fixture | Actual Arm A receipt | Evidence-based disposition |
|---|---|---|
| `hard.tsv` | Exit 0; STABLE; score 100 | **UNSTABLE within the fixture contract.** The functional HARD row is `regression-eligible` and `regressed=true`. Performance cannot cancel a HARD regression. |
| `visual-ui.tsv` | Exit 0; STABLE; score 100; visual UNAVAILABLE | **UNSTABLE under the documented dimension mapping.** The recorded `visual-ui` SCORE row has subscore 0. With performance 100, the intended normalized score is 60, below 95. |
| `visual.tsv` | Exit 1; UNSTABLE; score 60 | **UNSTABLE.** The helper consumes the canonical `visual` spelling and correctly computes the weighted score for these two cells. |
| `unknown.tsv` | Exit 0; STABLE; score 100 over two performance cells | **INCOMPLETE / unresolved classification; not safe to call STABLE.** One cell has classification `unknown`, outside the documented classification set. It must be resolved before acceptance. |
| `stable.tsv` | Exit 0; STABLE; score 100 | **Scoped STABLE for the supplied performance cell only.** Flakiness, resource, and visual are unavailable; HARD-dimension coverage is not established. |

The discrepancies are visible in the frozen source:

- **Classification alias mismatch:** `regression.md` defines `regression-eligible` in its classification phase, but its verdict clause and `score-regression.sh` match only literal `eligible`. The scorer does not normalize these spellings. Consequently, the HARD regression in `hard.tsv` is silently excluded from the blocking set. This is an internal contract inconsistency, not evidence that the functional regression is acceptable.
- **Dimension alias mismatch:** The dimension registry uses `visual-ui`, while the scorer’s weight table recognizes only `visual`. No alias normalization exists. Thus, the `visual-ui` row disappears from scoring and visual is reported as unavailable, despite an explicit adverse visual cell. The `visual.tsv` control demonstrates the different behavior for the canonical spelling.
- **Unknown classification acceptance:** SCORE aggregation parses numeric subscores without validating classification, tier, or execution status. Both performance rows in `unknown.tsv` therefore contribute to its reported 100. The numeric average is correct, but it does not establish that both observations are eligible evidence. `unknown` cannot be silently treated as eligible, pre-existing, flaky, or baseline-unavailable.

Recovery and check obligations:

1. Preserve the raw TSVs and the observed receipts. Record corrected semantic dispositions separately; do not rewrite the historical helper outputs.
2. Reconcile the classification and visual dimension contracts in source, with explicit alias handling or explicit rejection. Unknown classification needs a visible unresolved outcome rather than implicit acceptance.
3. Before relying on repaired scoring, verify that both eligible spellings block equivalent HARD regressions, both visual spellings receive equivalent scoring, unknown classification cannot produce an accepted stable result, and the valid performance control remains scoped STABLE. These are required future checks, not checks performed here.
4. Resolve unknown cells using baseline and candidate evidence matched by test ID, then path. Exclude documented non-regression classes correctly; do not erase the unknown row merely to obtain a passing aggregate.
5. For actual application recovery, substantiate a green→red HARD transition with underlying test evidence. Bisect only after the documented 3/3 reproducibility gate. Use differential diagnosis for SCORE failures; any authorized fix must shrink the blocking set and finish with the full required regression battery.
6. Inspect and test downstream handoff, recovery, and check state before declaring convergence. Unresolved findings or pending independent verification must prevent completion; persisted predicate commands must be validated and screened on resume. Corrected scorer behavior alone cannot establish that an orchestrator clears or preserves state correctly.
7. A scoped STABLE result does not authorize push, publication, or deployment.

Evidence boundary: This review read the frozen Arm A skill, regression contract, routing reference, scorer source, five fixture TSVs, and supplied Arm A receipts. No scorer, application, tests, or recovery workflow was executed; no files were changed. The supplied receipts report unchanged scorer inputs and cleaned scratch space. Orchestrator recovery/check state remains **untested**; broader state preservation is not established.
