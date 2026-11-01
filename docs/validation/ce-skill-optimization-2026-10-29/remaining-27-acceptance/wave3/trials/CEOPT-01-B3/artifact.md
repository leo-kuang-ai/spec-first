# CEOPT-01-B3 — Regression evidence decision

Only `stable.tsv` supports a **scoped scorer STABLE** result. `hard.tsv`, `visual-ui.tsv`, and `visual.tsv` are **UNSTABLE**. `unknown.tsv` is **INVALID_INPUT**, with no valid stability verdict. None establishes application stability or authorizes shipping.

| Fixture | Raw TSV evidence | Recorded B helper result | Disposition |
|---|---|---|---|
| `hard.tsv` | Performance subscore 100; regression-eligible functional HARD row has `regressed=true`. | Exit 1; functional blocking finding; `UNSTABLE`. | Hard-blocked. A good performance score cannot offset an eligible HARD regression. |
| `visual-ui.tsv` | Performance subscore 100; eligible visual-ui subscore 0 with `regressed=true`. | Exit 1; performance contribution 60, visual contribution 0; score 60; `UNSTABLE`. | Below threshold 95. Flakiness and resource are unavailable. |
| `visual.tsv` | Same scored evidence as `visual-ui.tsv`, using `visual`. | Exit 1; identical contributions and score 60; `UNSTABLE`. | Same disposition. The alias does not omit or discount visual evidence. |
| `unknown.tsv` | One valid performance row followed by a performance row whose classification is `unknown`. | Exit 2; stderr `INVALID_INPUT` / `row 2: unknown classification`; no stdout verdict. | Invalid evidence set. Do not discard the malformed row and accept the remaining 100-point row. |
| `stable.tsv` | One regression-eligible performance SCORE row, subscore 100, `regressed=false`. | Exit 0; score 100; `STABLE`; flakiness, resource, and visual unavailable. | Stable only for the supplied performance scoring evidence. Required missing dimensions remain unmet. |

The recorded outputs agree with the raw fixtures and frozen scorer implementation. There is no observed helper-versus-evidence discrepancy in these five cases.

The scorer normalizes `visual-ui` to its internal `visual` key; the regression document presents `visual-ui` as the registry name and accepts legacy `visual`. This naming difference preserves behavior. Both fixtures yield:

`(0.30 × 100 + 0.20 × 0) / (0.30 + 0.20) = 60`

The source also accepts legacy classification `eligible` as `regression-eligible`, but these fixtures do not exercise that alias. Unknown classifications are rejected rather than treated as unavailable evidence or a passing row.

The baseline/candidate display values of 100 and delta 0 do not override the HARD regression flag or visual subscore. The documented scorer consumes classification, tier, regression flag, and subscore; descriptive values and `status=ran` do not authenticate an underlying test. These are synthetic fixtures, not evidence of a real application regression or visual result.

## Recovery and check obligations

- **HARD failure:** retain the blocking finding. Establish actual baseline-green/candidate-red evidence and reproducibility before remediation; bisect only after the documented 3/3 reproducibility gate. If fixing, require the blocking set to shrink, stop on non-convergence, and run the final full battery.
- **Visual failures:** investigate the underlying differential evidence and repair or substantiate the producer’s result. Use differential diagnosis rather than automatic bisect for SCORE failures. Re-score valid evidence and check required dimensions before acceptance.
- **Invalid classification:** produce an `ERROR` handoff without a `STABLE` verdict. Repair or rerun the producer using evidence-grounded classification; do not simply rename or remove the row to obtain a pass.
- **Scoped stable result:** retain the unavailable-dimension disclosures. Obtain any dimensions required by the actual acceptance scope and independent verification where applicable. A scorer pass is not commit, push, deployment, or broader convergence authorization.
- **Orchestrator recovery:** validate the persisted ledger and re-screen the pinned predicate before resume. Unresolved errors, failed hops, or pending verification must prevent convergence; repeated unknown units must not masquerade as plateau progress. These are obligations from the frozen contract, not demonstrated recovery behavior.

## Evidence boundary

Reviewed the frozen B skill, regression contract, routing reference, scorer source, five TSV fixtures, and `wave3/autoresearch-B-receipts.json`. The supplied receipts report `inputs_unchanged=true` and `scratch_cleaned=true`, supporting scorer-input preservation for those recorded runs only.

Orchestrator recovery/check state preservation remains **untested**. No scripts, tests, application commands, mutations, network tools, delegation, or user questions were performed in this trial. Recorded helper executions were inspected, not rerun. No A/B acceptance judgment is made.
