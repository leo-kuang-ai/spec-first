Decision artifact: CEOPT-01-A2

Only `stable.tsv` supports a scoped STABLE disposition for its supplied performance cell. `hard.tsv` and both visual cases are UNSTABLE on the supplied evidence. `unknown.tsv` is inconclusive and must not clear a stability gate.

| Case | Observed A helper receipt | Correct scoped disposition |
|---|---|---|
| `hard.tsv` | Exit 0; score 100; STABLE | **UNSTABLE.** The functional HARD row is `regression-eligible` with `regressed=true`. Its blocking evidence cannot be outweighed by performance 100. |
| `visual-ui.tsv` | Exit 0; score 100; STABLE; visual reported UNAVAILABLE | **UNSTABLE.** The supplied visual-ui SCORE cell ran and scored 0. With performance 100, intended normalized score is `(0.30×100 + 0.20×0)/0.50 = 60`, below 95. |
| `visual.tsv` | Exit 1; score 60; UNSTABLE | **UNSTABLE.** The canonical scorer dimension is recognized, and the receipt matches the supplied score evidence. |
| `unknown.tsv` | Exit 0; score 100 over two performance cells; STABLE | **INCONCLUSIVE / CHECK REQUIRED.** One cell has unrecognized classification `unknown`. A valid performance cell does not resolve that classification or justify treating the whole run as stable. |
| `stable.tsv` | Exit 0; score 100; STABLE | **STABLE for the supplied performance-only fixture.** Flakiness, resource, visual, and unrepresented HARD dimensions are not proven stable. |

The discrepancies are traceable to the frozen A source:

- **Classification alias mismatch:** `regression.md` defines `regression-eligible` in its classification phase but uses `eligible` in its verdict rule. The helper checks only the literal `eligible` for HARD blockers. Consequently, the fixture’s `regression-eligible` HARD failure bypasses the blocking check. This is a contract/helper mismatch, not evidence that the functional failure is harmless.
- **Dimension alias mismatch:** the workflow registry names `visual-ui`; the helper’s weights and lookup recognize only `visual`. The `visual-ui` row is ignored, its weight is removed, and performance alone produces 100. The otherwise equivalent `visual` fixture yields 60. These labels require explicit normalization or a consistent canonical contract.
- **Unknown classification is accepted into scoring:** the helper averages parsable subscores within recognized dimensions without validating classification, tier, or execution status. Thus both performance cells in `unknown.tsv` contribute. Identical scores conceal the admission error numerically; they do not make the unknown classification valid.
- **Missing coverage changes the denominator:** a reported score of 100 can mean only that the single represented performance cell scored 100. UNAVAILABLE dimensions have not passed.

Required recovery and checks, not performed in this read-only trial:

1. Preserve the supplied TSVs and receipts as original evidence. Correct the classification and dimension contract/helper inconsistencies at source; use derived normalized inputs if needed rather than rewriting original evidence.
2. Verify equivalent handling of `eligible` and `regression-eligible`, and of `visual` and `visual-ui`. HARD eligible failures must block regardless of score; equivalent visual inputs must yield the same result.
3. Resolve the unknown row against baseline evidence and a recognized classification. Until then, retain an explicit unresolved check and prevent convergence or shipping. Do not invent an unsupported handoff verdict; preserve the blocker in the supported status/findings mechanism.
4. Re-score after correction and verify that unknown, malformed, or non-ran records cannot silently earn a pass. Keep exclusions such as pre-existing failures and new coverage distinct from genuine green→red regressions.
5. For a real confirmed HARD regression, establish reproducibility before bisecting: the workflow requires 3/3 reproduction. Visual/SCORE findings call for differential diagnosis rather than automatic bisect. If repairs are authorized, enforce a shrinking blocking set and final full-battery re-gating.
6. Before orchestrator closure or resume, validate the ledger, re-screen persisted predicate commands, retain the pinned predicate, and clear unresolved errors and pending independent verification with evidence. A scorer exit 0 alone cannot authorize DONE or shipping.

Evidence boundary: I read the frozen A skill, regression workflow, routing reference, scorer source, five TSV fixtures, and `autoresearch-A-receipts.json`. The supplied receipts report `inputs_unchanged=true` and `scratch_cleaned=true`; this supports scorer-input preservation only. Orchestrator recovery/check state was not tested, and broader state preservation is unverified. I executed no scorer, application, tests, recovery actions, or mutations. These are synthetic local fixtures, not evidence of production stability or an A/B acceptance result.
