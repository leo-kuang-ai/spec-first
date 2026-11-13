# U29 full scenario accounting

All 34 frozen scenarios remain accounted for. The earlier seven have 42 bounded responses. The remaining-27 execution is active; see the [live coverage table](remaining-27-acceptance/coverage.md) for current counts, failures, successor revisions and outstanding facets. U29 remains partial. Original package digests and historical acceptance records retain their original meaning.

| Scenario | Skill | Source identities | Baseline | Candidate | Outcome review |
|---|---|---|---|---|---|
| CEOPT-01 | `autoresearch` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-02 | `spec-brainstorm` | frozen trial inputs / baseline matched | 3/3 bounded pass | 3/3 bounded pass | complete; full acceptance partial |
| CEOPT-03 | `spec-code-review` | frozen trial inputs / baseline matched | 3/3 bounded pass | 3/3 bounded pass | complete; full acceptance partial |
| CEOPT-04 | `spec-commit` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-source-and-fixture-pass-full-partial; full acceptance partial |
| CEOPT-05 | `spec-commit-push-pr` | frozen trial inputs / baseline matched | 3/3 bounded pass | 3/3 bounded pass | complete; full acceptance partial |
| CEOPT-06 | `spec-compound` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-07 | `spec-compound-refresh` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-08 | `spec-debug` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-09 | `spec-doc-review` | frozen trial inputs / baseline matched | 3/3 bounded pass | 3/3 bounded pass | complete; full acceptance partial |
| CEOPT-10 | `spec-dogfood` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-11 | `spec-explain` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts; B-r2, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-12 | `spec-handoff` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-13 | `spec-ideate` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts; A, 600s: 4 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts; B, 600s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-14 | `spec-lfg` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-15 | `spec-optimize` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-16 | `spec-plan` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 1 final artifacts | synthetic-core-usable-with-findings-full-partial; full acceptance partial |
| CEOPT-17 | `spec-polish` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-18 | `spec-pov` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-19 | `spec-prd` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-20 | `spec-product-pulse` | frozen trial inputs / baseline matched | 3/3 bounded pass | 3/3 bounded pass | complete; full acceptance partial |
| CEOPT-21 | `spec-promote` | frozen trial inputs / baseline matched | 3/3 bounded pass | 3/3 bounded pass | complete; full acceptance partial |
| CEOPT-22 | `spec-prototype` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-correctness-pass-comparability-inconclusive-full-partial; full acceptance partial |
| CEOPT-23 | `spec-resolve-pr-feedback` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-24 | `spec-riffrec-feedback-analysis` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-25 | `spec-runtime-setup` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-26 | `spec-simplify-code` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 4 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-27 | `spec-strategy` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-28 | `spec-sweep` | frozen inputs; see live packet | A, 300s: 4 attempts / 4 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-clean-recovery-original-isolation-failure-full-partial; full acceptance partial |
| CEOPT-29 | `spec-test-browser` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-correctness-pass-full-partial; full acceptance partial |
| CEOPT-30 | `spec-test-xcode` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-31 | `spec-work` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-32 | `spec-worktree` | frozen inputs; see live packet | A, 300s: 4 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-pass-full-partial; full acceptance partial |
| CEOPT-33 | `spec-write-tasks` | frozen inputs; see live packet | A, 300s: 3 attempts / 3 final artifacts | B, 300s: 3 attempts / 3 final artifacts | bounded-source-consumer-pass-full-partial; full acceptance partial |
| CEOPT-34 | `using-spec-first` | frozen trial inputs / baseline matched | 3/3 bounded pass | 3/3 bounded pass | complete; full acceptance partial |

Unblock: provide an admitted independent fresh-source model/host runner under the existing local evaluation authorization for the exact frozen tasks, with isolated baseline/candidate environments and actual call/output receipts. Provider, UI, Windows and external-write legs require their own applicable capability and authority. U6 additionally lacks an authenticated serving-admission channel; peer execution remains denied.

The four excluded skills remain outside this audit and optimization. No partial task or judge-control result is promoted into full frozen-comparison acceptance.

Current deterministic and live-browser evidence is recorded separately in [remaining trial evidence](remaining-trials/README.md). It does not turn unexecuted model scenarios into passes.

## October31 scoped follow-up

The separate [follow-up report](remaining-27-acceptance/follow-up-20261031/final-report.md) records six new synthetic-input Plan finals and current Commit/Tasks/Plan prose successors. These add six attempts/six finals to the historical175/170 ledger (combined181/176), without filling original missing slots or proving full acceptance. See the report for independent judgments and source revision boundaries.
