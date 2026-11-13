The receipts support correct **mocked coverage and cumulative-attempt reporting across both analyzer entrypoints**. They do not establish real decoding, external transcription, visual review, or confirmed product requirements.

Evidence aliases, all under `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/`:

- **M**: `media-B-receipts.json`
- **S**: `media-supplement-B-receipts.json`

Intervals below are seconds in the synthetic 840-second input. “Requests” counts mocked provider calls, not actual egress.

| Case | Covered / missing | Receipt interpretation | Mock extraction / requests per entrypoint | Exact evidence: Riffrec / sweep |
|---|---|---|---|---|
| Complete | Covered `[0,420)`, `[420,840)`; missing none | `ok`, non-degraded; timestamped fixture text | 2 / 2; aggregate request flag true | M:10–117 / M:462–569 |
| Second provider failed | Covered `[0,420)`; missing `[420,840)` | `partial`, degraded; second provider returns unavailable; preserve first transcript | 2 / 2; aggregate true despite second failure | M:120–228 / M:572–680 |
| Second extraction failed | Covered `[0,420)`; missing `[420,840)` | `partial`, degraded; second extraction reports `decode failed`; no second upload | 2 / 1; aggregate true | M:231–324 / M:683–776 |
| Silence | Covered `[0,420)`, `[420,840)`; missing none | `ok`, non-degraded, empty text; fixture coverage is successful without words | 2 / 2; aggregate true | M:327–434 / M:779–886 |
| No egress authority | No transcription performed; coverage arrays absent | `skipped`, authorization missing, request flag false. Whole input remains untranscribed; numeric coverage was not reported | 0 / 0 | M:437–447 / M:889–899 |

Both entrypoints report `actual_egress:false` for every case. M:909–912 explicitly limits these results to actual Python logic with mocked extraction/transcription and synthetic duration. Consequently, “covered” means **receipt-level fixture coverage**, not verified intelligible audio or transcription accuracy.

| Additional case | Both-entrypoint finding | Evidence |
|---|---|---|
| Quiet capture | Findings are empty. Kickoff explicitly says product friction is unconfirmed and there are no confirmed product requirements. R1/R2 concern evidence handling, not demonstrated product needs. Coverage is unspecified here; do not conflate this case with the separate silence case. | M:450–453; M:902–905 |
| Initial request, unavailable chunk fallback | Initial whole-media request fails with `input_too_large`, request flag true. Fallback fails because ffmpeg is unavailable, request flag false. Final transcript is failed/degraded, covered none, missing `[0,840)`, empty text. | S:124–155; S:302–333 |
| Cumulative egress accounting | Both transcript and egress receipt retain both attempts and aggregate `provider_request_sent:true`. The unavailable fallback cannot erase the first request attempt. Exactly one mocked curl call is recorded per entrypoint; actual egress remains false. | S:7–22, 124–179; S:185–200, 302–357 |
| Exit and cleanup | Supplemental CLI exits are zero despite failed transcription. `scratch_removed_after_context_exit:true` is recorded separately for both entrypoints. Main receipts only label cleanup `scratch_removed_after_capture:true`; that field alone does not establish measurement timing after context exit. | S:6,180,184,358; M:454,906 |
| Artifacts and screenshots | Supplemental results list output artifacts, but every selected screenshot is null with `no video source`. Five representative timestamps are candidates, not inspected frames. Scratch cleanup means listed temporary paths do not establish presently accessible deliverables. | S:24–120; S:202–298 |

Per entrypoint, the five chunk cases contain seven mocked provider calls; the supplemental fallback case adds one. Across both entrypoints that is **16 mocked calls and zero actual egress**, excluding quiet captures whose call counts are not reported. Recorded provider identity is `openai-audio-transcriptions`; `explicit-cli-flag` records fixture authorization provenance, not independently verified current-user consent.

| Unresolved facet / unsupported claim | Responsible next action |
|---|---|
| Real 840-second decoding, intelligibility, timing accuracy, successful external transcription, or remote acceptance | Analyzer/validation owner: obtain separately authorized real-media evidence with decoding logs, provider outcomes and measured interval coverage. |
| Complete feedback capture despite partial transcripts, successful speech recognition from silence, or “no bugs” from empty quiet findings | Evidence reviewer: retain gaps and unknowns; inspect original authorized source before making completeness or absence claims. |
| Confirmed product requirements, root cause, implementation readiness, completed human/visual review | Product owner/reviewer: review supporting transcript, events and actual frames; promote only supported findings. Quiet scaffold supplies none. |
| Durable artifact availability or universal cleanup guarantee | Validation owner: preserve reviewed deliverables outside disposable scratch when needed; separately verify relevant cleanup boundaries. Existing post-context receipts establish only the recorded scratch-root checks. |
| Automatic brainstorm invocation or public sharing | Workflow owner: obtain applicable workflow/destination authority; sanitize text and keep raw media, frames, manifests and absolute-path metadata local by default. |

Assessment used only the assigned frozen Riffrec Skill, its analyzer/extensive references, the request, and the two named receipt files. No execution, external requests, mutations, delegation, or other Skill-entrypoint reads were performed.
