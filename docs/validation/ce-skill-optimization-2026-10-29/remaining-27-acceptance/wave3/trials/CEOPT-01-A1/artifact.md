# CEOPT-01-A1 — Regression evidence decision

Only `stable.tsv` supports a scoped stability conclusion. `hard.tsv`, `visual-ui.tsv`, and `unknown.tsv` receive unsafe `STABLE` results from the supplied helper receipts. `visual.tsv` correctly receives `UNSTABLE`.

These decisions concern synthetic fixture evidence and the supplied A-arm scorer executions, not application regression results or release readiness.

| Fixture | Actual helper receipt | Evidence-based disposition | Explanation |
|---|---|---|---|
| `hard.tsv` | Exit 0; score 100; `STABLE` | **UNSTABLE within the fixture** | The functional row is `HARD`, `regression-eligible`, and `regressed=true`. The helper only recognizes the exact classification `eligible`, so it misses the blocking row. A performance score of 100 cannot override a HARD regression. |
| `visual-ui.tsv` | Exit 0; score 100; `STABLE`; visual reported unavailable | **UNSTABLE within the fixture** | The registered `visual-ui` dimension has subscore 0, but the helper only recognizes `visual`. Treating these names consistently yields performance contribution 60 and visual contribution 0: total **60**, below 95. The supplied visual evidence was ignored rather than unavailable. |
| `visual.tsv` | Exit 1; score 60; `UNSTABLE` | **UNSTABLE within the fixture** | The helper recognizes `visual`, combines its zero score with performance 100, and correctly computes `(0.30 × 100 + 0.20 × 0) / 0.50 = 60`. This contrasts with the identical substantive evidence under `visual-ui`. |
| `unknown.tsv` | Exit 0; score 100 over two performance cells; `STABLE` | **Unresolved classification; withhold overall stability acceptance** | One performance row is `regression-eligible`; the other has classification `unknown`. The helper averages both because SCORE aggregation does not validate classification. A numeric subscore cannot establish baseline eligibility. The known eligible cell supports performance score 100 on its own, but the unknown cell requires resolution before accepting the whole run. |
| `stable.tsv` | Exit 0; score 100; `STABLE` | **STABLE for the supplied performance-only fixture** | Its single eligible performance row has subscore 100 and `regressed=false`. Flakiness, resource, and visual are unavailable; HARD dimensions were not demonstrated. This is not comprehensive stability. |

## Contract and implementation discrepancies

The frozen `regression.md` classifies baseline-green units as `regression-eligible`, but its Verdict section and the scorer use `eligible`. The classification spelling mismatch creates the false stable result in `hard.tsv`.

The same document registers `visual-ui`, while its weighting description and scorer use `visual`. The scorer performs exact dimension lookup without alias normalization. Consequently, the two visual fixtures produce different verdicts despite equivalent scores and regression flags.

For SCORE rows, the helper accepts any parsable subscore under a recognized dimension. It does not establish eligibility from classification, tier, or execution status. In the supplied unknown case, this produces an apparently complete score from unresolved evidence. This finding does not establish behavior for unprovided fixtures.

## Recovery and check obligations

No recovery, mutation, test execution, or orchestration was performed in this review. Subsequent authorized work should:

1. Preserve the original TSVs and receipts. Establish explicit handling of `regression-eligible`/`eligible` and `visual-ui`/`visual` at the scorer boundary, with focused checks that aliases produce equivalent decisions and do not double-count evidence.
2. Check HARD precedence independently of score: a recognized eligible HARD regression must block even when all available SCORE values are 100.
3. Resolve unknown classification against baseline evidence, matched by test ID and then path. Do not infer eligibility from the supplied score or silently discard the unresolved row to obtain acceptance. If classification cannot be established, report the limitation and withhold overall acceptance.
4. Re-score corrected fixtures and retain actual command outputs and exit codes. Expected fixture outcomes are HARD `UNSTABLE`, both visual spellings `UNSTABLE` at 60, unresolved unknown classification blocked from acceptance, and performance-only stable at 100.
5. Before accepting an orchestrator recovery, validate its ledger, re-screen the persisted pinned predicate, and check pending verification, unresolved failures, and routing outcomes. A historical `STABLE` receipt cannot clear these obligations. Repeated unknown **units** have their own three-cycle blocking rule; an unknown TSV classification is not proof that this state was reached.
6. Require independent verification where applicable before convergence. Any eventual shipping action remains subject to explicit authorization.

The receipts report `inputs_unchanged: true` and `scratch_cleaned: true`, supporting scorer-input preservation and scratch cleanup for those executions. They explicitly state that orchestrator check/recovery state remains untested. No broader state preservation, successful recovery, convergence, deployment, or real application outcome is established.

Evidence inspected: frozen A-arm `SKILL.md`, `regression.md`, `references/orchestrator-routing.md`, and `scripts/score-regression.sh`; the five supplied fixture TSVs; `CEOPT-01-request.txt`; and `autoresearch-A-receipts.json`. No A/B acceptance judgment is made.
