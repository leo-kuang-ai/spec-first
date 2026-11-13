# U30 comparative disposition

Overall comparison remains **inconclusive**. Seven scenarios now have paired read-only responses and independent context adjudication: 3/3 passing responses per arm, 42 total. No causal advantage, authenticated serving comparability, or comparable cost/rework/time-to-trusted-change evidence is established. See [current trial report](remaining-trials/README.md).

| Scenario | Skill | Correctness / omissions | Authority / evidence | Rework / context / time | Disposition |
|---|---|---|---|---|---|
| CEOPT-01 | `autoresearch` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-02 | `spec-brainstorm` | 3/3 per arm, bounded task | Read-only traces; isolation not enforced | not measured comparably | Full acceptance partial; benefit inconclusive |
| CEOPT-03 | `spec-code-review` | 3/3 per arm, bounded task | Read-only traces; isolation not enforced | not measured comparably | Full acceptance partial; benefit inconclusive |
| CEOPT-04 | `spec-commit` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-05 | `spec-commit-push-pr` | 3/3 per arm, bounded task | Read-only traces; isolation not enforced | not measured comparably | Full acceptance partial; benefit inconclusive |
| CEOPT-06 | `spec-compound` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-07 | `spec-compound-refresh` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-08 | `spec-debug` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-09 | `spec-doc-review` | 3/3 per arm, bounded task | Read-only traces; isolation not enforced | not measured comparably | Full acceptance partial; benefit inconclusive |
| CEOPT-10 | `spec-dogfood` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-11 | `spec-explain` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-12 | `spec-handoff` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-13 | `spec-ideate` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-14 | `spec-lfg` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-15 | `spec-optimize` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-16 | `spec-plan` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-17 | `spec-polish` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-18 | `spec-pov` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-19 | `spec-prd` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-20 | `spec-product-pulse` | 3/3 per arm, bounded task | Read-only traces; isolation not enforced | not measured comparably | Full acceptance partial; benefit inconclusive |
| CEOPT-21 | `spec-promote` | 3/3 per arm, bounded task | Read-only traces; isolation not enforced | not measured comparably | Full acceptance partial; benefit inconclusive |
| CEOPT-22 | `spec-prototype` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-23 | `spec-resolve-pr-feedback` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-24 | `spec-riffrec-feedback-analysis` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-25 | `spec-runtime-setup` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-26 | `spec-simplify-code` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-27 | `spec-strategy` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-28 | `spec-sweep` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-29 | `spec-test-browser` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-30 | `spec-test-xcode` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-31 | `spec-work` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-32 | `spec-worktree` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-33 | `spec-write-tasks` | not measured | real behavior not measured | not measured | Retain necessary fixes; optional stays optional; benefit inconclusive |
| CEOPT-34 | `using-spec-first` | 3/3 per arm, bounded task | Read-only traces; isolation not enforced | not measured comparably | Full acceptance partial; benefit inconclusive |

Apply the original quality-first rules when runs become available: task or authority failure blocks adoption regardless of cost. Compare actual artifacts and effects before runtime cost. Do not remove necessary safety repairs merely because comparative quality evidence is missing. Any new regression discovered in future runs reopens its owning unit.

Local controls and fake-provider tests demonstrate only their observed mechanical invariants. They provide no estimate of model compliance, production usefulness or comparative efficiency.

Continuation: native independent source review and calibrated repair checks are tracked in [acceptance-resume](acceptance-resume/README.md). That historical source review is distinct from the newer paired read-only task outcomes; neither supports a causal benefit claim.

The selected identical current regression harness produced A: 184 passed / 148 failed and B: 332 passed / 0 failed across 13 suites. [Independent classification](remaining-trials/paired-mechanisms-review.json) distinguishes executable counterexamples from absent helpers, schema incompatibility, fixture cascades and prose contracts. The 148 failures are not 148 independent defects or a representative improvement percentage. These results bind the pre-browser-policy-fix snapshots.

## Remaining-27 continuation

[Live acceptance](remaining-27-acceptance/coverage.md) retains partial Explain outcomes and its separately pinned B-r2 repair. The additional five-suite mechanism experiment produced A 37 pass / 25 fail and B 62 pass / 0 fail; [independent review](remaining-27-acceptance/wave1/independent-explain-mechanisms-review.json) classifies 21 observed behavior differences, 2 output-contract differences and 2 harness incompatibilities. No aggregate model-quality, cost, or field benefit is established.
