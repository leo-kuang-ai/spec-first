# Verification Kind And Environment Matrix

Verification is a two-dimensional capability choice, not a mandatory linear ladder. The LLM judges which valid combination can satisfy the oracle; scripts validate the combination, readiness, cost rank and human gates.

Valid combinations and deterministic cost ranks:

| Kind | Environment | Rank |
| --- | --- | ---: |
| static_proof | none | 0 |
| static_proof | host | 1 |
| compiler_lint | build | 2 |
| unit | build | 3 |
| state_transition | host | 4 |
| navigation_component | host | 5 |
| visual_capture | host | 6 |
| state_transition | simulator | 7 |
| navigation_component | simulator | 8 |
| visual_capture | simulator | 9 |
| end_to_end | simulator | 10 |
| visual_capture | real_device | 11 |
| end_to_end | real_device | 12 |
| human_judgment | human_only | 13 |

OAuth consent, CAPTCHA, credential entry, store release and production mutation are always `human_judgment × human_only`. Biometric, system-permission and payment confirmations require a referenced human-only checkpoint even when surrounding setup is `end_to_end × real_device`.

A generated plan is not execution evidence. Every task remains `not_run` or `blocked` until a separately authorized executor produces a current, claim-matched receipt.
