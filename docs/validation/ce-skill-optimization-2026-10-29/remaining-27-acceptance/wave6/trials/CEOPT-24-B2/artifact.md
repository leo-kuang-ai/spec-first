CEOPT-24-B2 supports correct **fixture-level coverage and cumulative request accounting across both analyzer entrypoints**. It does not establish real decoding, transcription quality, external transfer, visual review, or product findings.

Evidence aliases below resolve under `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/`:

- **M** = `media-B-receipts.json`
- **S** = `media-supplement-B-receipts.json`

References use exact JSON pointers. In both files, `/entrypoints/0` is `spec-riffrec-feedback-analysis`; `/entrypoints/1` is `spec-sweep`. The companion Skill was not read.

| 840-second case | Riffrec evidence | Sweep evidence | Coverage and result | Mocked calls per entrypoint |
|---|---|---|---|---|
| Complete | M `/entrypoints/0/chunk_cases/0` | M `/entrypoints/1/chunk_cases/0` | `ok`; covered 0–420 and 420–840; no missing interval; fixture words at 00:00 and 07:00 | 2 ffmpeg, 2 provider calls |
| Second provider failed | M `/entrypoints/0/chunk_cases/1` | M `/entrypoints/1/chunk_cases/1` | `partial`, degraded; covered 0–420; missing 420–840; second request attempted but provider unavailable | 2 ffmpeg, 2 provider calls |
| Second extraction failed | M `/entrypoints/0/chunk_cases/2` | M `/entrypoints/1/chunk_cases/2` | `partial`, degraded; covered 0–420; missing 420–840; second extraction says `decode failed`; no second provider call | 2 ffmpeg, 1 provider call |
| Silence | M `/entrypoints/0/chunk_cases/3` | M `/entrypoints/1/chunk_cases/3` | `ok`, empty text, not degraded; both intervals covered; no missing interval. Empty text does not imply failed processing or prove actual acoustic silence | 2 ffmpeg, 2 provider calls |
| No egress authority | M `/entrypoints/0/chunk_cases/4` | M `/entrypoints/1/chunk_cases/4` | `skipped`; authorization `missing`; request flag false. Interval arrays absent: transcription coverage is unestablished, not complete | None |
| Initial request fails; chunk fallback unavailable | S `/entrypoints/0` | S `/entrypoints/1` | CLI exit 0, transcript `failed`, degraded; covered none; missing 0–840. Initial `input_too_large`, then absent ffmpeg prevents chunking | 1 initial provider call; no extraction or fallback provider call |

For the supplemental case, both `/entrypoints/{0,1}/result/transcript/attempts` retain **true then false** request flags. Both aggregate transcript and `transcription_egress_receipt` flags remain **true**. The unavailable fallback correctly does not erase the earlier attempted request; this flag does not prove remote acceptance.

| Cross-case facet | Evidence and assessment |
|---|---|
| Cumulative request accounting | M lists 7 mocked provider calls per entrypoint; S adds 1 each: **8 per entrypoint, 16 total**, all simulated. M also lists 8 mocked extraction calls per entrypoint. |
| Actual external egress | Every M chunk case and both S entrypoints report `actual_egress: false`. M `/limitations` and S `/limitation` explicitly exclude actual decoding/provider requests/transcription. No transferred-byte or live-provider conclusion is supported. |
| Authorization | Authorized fixtures record `explicit-cli-flag`; the no-authority fixture skips calls. These receipts demonstrate fixture handling, not independent confirmation of a real user's consent. |
| Quiet capture, both entrypoints | M `/entrypoints/0/quiet_capture` and `/entrypoints/1/quiet_capture`: findings empty; kickoff explicitly says no confirmed product requirements. R1/R2 concern evidence handling, not discovered product behavior. No supplied quiet-capture receipt establishes transcript or frame coverage. |
| Unsupported product claims | Quiet scaffold statements about a user verbalizing friction, conversion into transcript, and understanding “what went wrong” remain assumptions or intended outcomes. Empty findings do not prove absence of defects. No concrete feature, control, expected behavior, severity, or user impact is established. |
| Supplemental visual evidence | S `/entrypoints/{0,1}/result/moments` and `event_moments`: five timestamps, each screenshot null and `no video source`; event counts and candidate findings empty. Timestamps are not reviewed screenshots. |
| Cleanup timing | M `/entrypoints/{0,1}/scratch_removed_after_capture: true` reports capture-time cleanup only. S `/entrypoints/{0,1}/scratch_removed_after_context_exit: true` explicitly establishes post-context cleanup for the supplemental scratch roots. It does not establish that timing for M. |
| Artifact availability | S lists artifact paths and exit 0, but its scratch roots were removed after context exit. These paths are historical receipt references, not established accessible deliverables. Raw absolute paths remain private evidence. |

| Remaining facet | Responsible next action |
|---|---|
| Missing 420–840 intervals | Analysis owner: preserve the gap in handoff; arrange an authorized retry after provider recovery or extraction repair. Do not describe either partial case as complete transcription. |
| Entire 0–840 fallback gap | Runtime/analysis owner: restore runnable ffmpeg, then retry within existing applicable recording/provider authorization; retain the initial attempt history. |
| Live decoding, transcription, accuracy and transfer | Validation owner: obtain separately authorized real-media/provider evidence. Current receipts establish mocked control flow only. |
| Quiet/product conclusions and visual coverage | Product reviewer: inspect actual source media/events/screens, distinguish assumptions from observations, and promote only supported findings. No confirmed requirement is available here. |
| Broader cleanup and sharing | Validation owner: measure base-case cleanup after context exit if required. Artifact owner: retain accessible evidence and sanitize any explicitly authorized shared subset. |

This assessment used only the assigned frozen Skill, its shared analyzer reference, the request, and the two named receipt files. No analyzer, test, network request, mutation, or delegated work was performed.
