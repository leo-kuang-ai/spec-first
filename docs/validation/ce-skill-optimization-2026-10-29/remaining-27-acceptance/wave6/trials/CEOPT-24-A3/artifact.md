Assessment: both analyzer entrypoints exhibit identical coverage/reporting defects. These receipts demonstrate mocked control flow only; they do not establish real decoding, external transcription, actual egress, or product defects.

Evidence paths below are relative to `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/`: **M** = `media-A-receipts.json`; **S** = `media-supplement-A-receipts.json`. R = `spec-riffrec-feedback-analysis`; W = companion `spec-sweep` analyzer. W’s Skill was not read.

Intervals are intended synthetic coverage, using half-open seconds.

| 840-second case, applies to R and W | Covered / missing transcript intervals | Cumulative mocked provider attempts per case | Finding | Exact evidence R / W |
|---|---|---:|---|---|
| `complete` | Covered `[0,420)` and `[420,840)`; no simulated gap | 2 | Both chunks `ok`; fixture text at 00:00 and 07:00. No proof of real completeness or word accuracy. | M:10 / M:464; `.receipt`, `.mock_subprocess_calls` |
| `second-provider-failed` | Covered `[0,420)`; missing `[420,840)` | 2 | Second upload attempted but failed; top-level `status: ok` conceals partial coverage unless chunks are inspected. | M:105 / M:559 |
| `second-extraction-failed` | Covered `[0,420)`; missing `[420,840)` | 1 | Second extraction fails before upload; top-level remains `ok`. | M:200 / M:654 |
| `silence` | Both intervals processed with empty simulated provider output; no transcript text for `[0,840)` | 2 | Both chunk statuses are `ok`, while aggregate says `failed` / “No chunks transcribed successfully.” Empty output does not prove genuine silence or extraction failure. | M:280 / M:734 |
| `no-egress-authority` | No transcription coverage; `[0,840)` unavailable by authorization boundary | 0 | Both chunks skipped; local extraction was mocked. Correctly reports missing authorization and no provider attempt. Obtain explicit user authority only if transcription is needed. | M:374 / M:828 |
| Initial request → unavailable chunk fallback | No usable transcript; `[0,840)` missing | **1**, although final receipt says `false` | Initial whole-file `curl` attempt precedes absent-ffmpeg fallback. Both transcript and egress receipt lose cumulative attempt history; CLI exit 0 does not mean successful analysis. | S:7,96,104 / S:117,206,214 |

Each entrypoint has **7 mocked provider attempts across the five chunk cases, plus 1 fallback-case initial attempt = 8**; both entrypoints total **16**. This is an attempt count, not transferred bytes or actual network activity. All cases declare `actual_egress: false`; M:913–916 and S:225 explicitly exclude real decoding/provider requests.

| Additional case or boundary | Assessment | Exact evidence |
|---|---|---|
| Quiet capture, R | F1 has empty evidence and Low confidence. “Produced evidence of product friction,” user “verbalizes friction,” R3 promoting F1 into an issue, and the hypothetical unclickable-button AE2 are unsupported session claims. Neither “product is healthy” nor “product is defective” follows. | M:442–455; `.quiet_capture.findings`, `.requirements` |
| Quiet capture, W | Same unsupported promotion and hypothetical product example as R. Generic evidence-handling rules can remain guidance, but are not observed product requirements. | M:896–909 |
| Fallback candidate findings, both | Empty transcript/events and null screenshots at 84, 252, 420, 588, 756 seconds cannot establish absence of failures. M1–M3 references identify placeholders, not inspected visual evidence. | S:33–89 / S:143–199 |
| Main-receipt cleanup | `scratch_removed_after_capture: true` is recorded for both; it does **not explicitly establish measurement after context exit** or comprehensive retention hygiene. | M:456 / M:910 |
| Supplement cleanup | Both explicitly record `scratch_removed_after_context_exit: true`. Supports removal of those fixture scratch roots after exit; printed artifact paths are historical receipts, not proof of currently accessible deliverables. | S:110–112 / S:220–222 |

| Remaining owner | Required next action |
|---|---|
| Analyzer maintainer, both entrypoints | Preserve cumulative `provider_request_sent` across initial attempts and fallback; report coverage gaps explicitly instead of presenting partial text as unqualified `ok`. Distinguish empty successful responses from provider/extraction failure. |
| Artifact-template maintainer | Keep quiet captures as “no issue established / review pending”; remove unsupported friction assertions, F1→R3 promotion, and session-specific implications from generic examples. |
| Feedback reviewer / product owner | Review original media, events and available frames before confirming any defect or requirement; do not treat missing intervals or empty transcripts as negative product evidence. |
| Validation owner | With explicit recording/provider authorization, obtain real decoding/transcription and coverage evidence, cumulative transfer receipts, and cleanup measurements after context exit. Current receipts cannot close those facets. |

The frozen Skill’s `Common rules` and `references/analyzer.md` require explicit transcription authority and preserved provider receipts; `references/extensive-analysis.md` requires separating observations, inferences and requirements. The supplied results leave those reporting and evidence-promotion facets unresolved. No execution, mutation, external contact, or delegation was performed.
