The receipts support coverage bookkeeping and cumulative attempt reporting under mocks. They do **not** establish real media decoding, external transcription, live coverage, visual review, or confirmed product requirements.

Evidence aliases below refer to files under `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/`:

- **M** = `media-B-receipts.json`
- **S** = `media-supplement-B-receipts.json`
- In both files, `entrypoints[0]` is `spec-riffrec-feedback-analysis`; `entrypoints[1]` is `spec-sweep`. References use exact JSON paths.

All chunk cases use a synthetic 840-second duration and 420-second chunks. Coverage below is **receipt-reported fixture coverage**.

| Entrypoint | Case / exact evidence | Status | Covered seconds | Missing seconds | Mock ffmpeg / provider calls |
|---|---|---|---|---|---|
| Riffrec | M `entrypoints[0].chunk_cases[0]` — complete | `ok` | 0–420, 420–840 | None | 2 / 2 |
| Riffrec | M `entrypoints[0].chunk_cases[1]` — second-provider-failed | `partial` | 0–420 | 420–840 | 2 / 2; second provider fails |
| Riffrec | M `entrypoints[0].chunk_cases[2]` — second-extraction-failed | `partial` | 0–420 | 420–840 | 2 / 1; second extraction fails |
| Riffrec | M `entrypoints[0].chunk_cases[3]` — silence | `ok`, empty text | 0–420, 420–840 | None | 2 / 2 |
| Riffrec | M `entrypoints[0].chunk_cases[4]` — no-egress-authority | `skipped` | Not recorded; no transcription established | Interval fields absent; all 840 seconds remain untranscribed | 0 / 0 |
| Sweep | M `entrypoints[1].chunk_cases[0]` — complete | `ok` | 0–420, 420–840 | None | 2 / 2 |
| Sweep | M `entrypoints[1].chunk_cases[1]` — second-provider-failed | `partial` | 0–420 | 420–840 | 2 / 2; second provider fails |
| Sweep | M `entrypoints[1].chunk_cases[2]` — second-extraction-failed | `partial` | 0–420 | 420–840 | 2 / 1; second extraction fails |
| Sweep | M `entrypoints[1].chunk_cases[3]` — silence | `ok`, empty text | 0–420, 420–840 | None | 2 / 2 |
| Sweep | M `entrypoints[1].chunk_cases[4]` — no-egress-authority | `skipped` | Not recorded; no transcription established | Interval fields absent; all 840 seconds remain untranscribed | 0 / 0 |

Empty successful text in the silence fixtures differs from unavailable transcription. Neither proves real acoustic silence or absence of product problems.

| Additional case | Evidence | Finding |
|---|---|---|
| Riffrec quiet capture | M `entrypoints[0].quiet_capture` | `findings: []`; kickoff explicitly contains no confirmed product requirements. R1/R2 describe evidence handling, not requested product changes. |
| Sweep quiet capture | M `entrypoints[1].quiet_capture` | Same boundary. Generic actors, flows, success criteria and “Resume spec-brainstorm” are scaffold text, not observed behavior, achieved outcomes, or workflow authorization. |
| Riffrec initial request → unavailable fallback | S `entrypoints[0].result.transcript` and `.transcription_egress_receipt` | Initial mocked provider request fails with `input_too_large`; fallback fails before a request because ffmpeg is unavailable. Final `failed`; covered `[]`, missing 0–840. |
| Sweep initial request → unavailable fallback | S `entrypoints[1].result.transcript` and `.transcription_egress_receipt` | Identical cumulative behavior: attempts retain `true` then `false`; aggregate `provider_request_sent` remains `true`. |

For each supplemental entrypoint, `initial_request_and_fallback_calls` contains **one mocked curl call**. The failed fallback does not erase that earlier attempt. `provider_request_sent: true` describes the instrumented request path, not remote acceptance or actual egress.

| Boundary | Evidence and conclusion |
|---|---|
| Cumulative calls | Enumerated chunk cases contain 7 mocked provider calls per entrypoint; supplements add 1 each: **16 mocked provider calls total**, plus 16 mocked extraction calls. These are call counts, not transferred-byte measurements. |
| Actual external activity | Every chunk case and supplemental entrypoint records `actual_egress: false`. M `limitations` and S `limitation` explicitly exclude decoding, external requests and real transcription. |
| Authorization | Authorized fixtures record `explicit-cli-flag`; missing-authority fixtures skip with no calls. This does not independently verify consent for any real recording or destination. |
| Primary cleanup | M `entrypoints[0/1].scratch_removed_after_capture: true` reports cleanup after capture; its field does not explicitly establish post-context-exit timing. |
| Post-context cleanup | S `entrypoints[0/1].scratch_removed_after_context_exit: true` explicitly records cleanup after context exit. Listed temporary artifact paths therefore do not establish currently accessible deliverables. |
| Artifact versus outcome | Both supplemental exits are zero despite failed transcription. Five selected moments have null screenshots and `no video source`; candidates are empty. Artifact generation establishes neither transcript completion nor visual review. |

| Unresolved facet | Responsible next action |
|---|---|
| Real decoding, transcription quality and coverage | Analyzer maintainer: obtain an explicitly authorized real-media validation with retained coverage and provider receipts. |
| Partial or entirely missing intervals | Feedback-analysis owner: preserve the gaps in handoff; recover or review those intervals before making claims about their contents. |
| Product findings and requirements | Owning product reviewer: inspect source evidence and promote only supported findings. No product defect, requirement, priority or user benefit is confirmed here. |
| Sharing and downstream workflow | Workflow owner: retain raw evidence locally, sanitize any authorized shared subset, and obtain applicable authority before provider transfer or brainstorm invocation. |

Only the assigned frozen Riffrec Skill, its shared analyzer reference, the request and the two named receipt files were read. The Sweep assessment is limited to its supplied analyzer receipts; its Skill entrypoint was not inspected.
