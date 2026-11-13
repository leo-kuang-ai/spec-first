Arm A exposes three material reporting issues in both analyzer entrypoint receipts: partial transcripts report `ok`, empty successful responses report failure, and fallback receipts erase an earlier provider attempt. Quiet capture also promotes an evidence-free placeholder into a product requirement. These are mocked-path observations; no actual decoding, external transcription, or egress is demonstrated.

Evidence aliases below refer to files under `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/`:

- **M** = `media-A-receipts.json`
- **S** = `media-supplement-A-receipts.json`
- JSON pointers identify exact evidence. `entrypoints/0` is `spec-riffrec-feedback-analysis`; `entrypoints/1` is `spec-sweep`. The companion Skill was not read.

All chunk cases use synthetic 840-second media, with intended intervals **[0,420)** and **[420,840)**. “Covered” below means a successful mocked chunk response, not verified acoustic or semantic coverage.

| Entrypoint | Case; exact M reference | Covered / missing intervals | Mocked calls; finding |
|---|---|---|---|
| Riffrec | `complete`; `/entrypoints/0/chunk_cases/0` | Both intervals return text; no modeled gap | 2 extraction + 2 provider calls; `ok` is consistent with fixture responses only. |
| Sweep | `complete`; `/entrypoints/1/chunk_cases/0` | Both intervals return text; no modeled gap | Same: 2 + 2; live coverage remains unverified. |
| Riffrec | `second-provider-failed`; `/entrypoints/0/chunk_cases/1` | Text only for [0,420); [420,840) missing | 2 + 2; second provider fails, but aggregate `status:"ok"` conceals partial coverage. |
| Sweep | `second-provider-failed`; `/entrypoints/1/chunk_cases/1` | Text only for [0,420); [420,840) missing | Same partial-success reporting defect. |
| Riffrec | `second-extraction-failed`; `/entrypoints/0/chunk_cases/2` | Text only for [0,420); [420,840) missing | 2 extraction attempts, 1 provider call; second extraction fails before provider submission. Aggregate remains `ok`. |
| Sweep | `second-extraction-failed`; `/entrypoints/1/chunk_cases/2` | Text only for [0,420); [420,840) missing | Same defect; absent chunk-level request flag does not establish a second request. |
| Riffrec | `silence`; `/entrypoints/0/chunk_cases/3` | Both chunks return `ok` with empty text; no textual coverage | 2 + 2; aggregate says `failed` / “No chunks transcribed successfully.” Empty success is conflated with failure; actual silence is unproven. |
| Sweep | `silence`; `/entrypoints/1/chunk_cases/3` | Same empty responses across both intervals | Same inconsistent aggregate status and unsupported silence interpretation. |
| Riffrec | `no-egress-authority`; `/entrypoints/0/chunk_cases/4` | Both intervals skipped; transcript missing across [0,840) | 2 local extraction calls, 0 provider calls; missing authorization correctly blocks mocked provider submission. |
| Sweep | `no-egress-authority`; `/entrypoints/1/chunk_cases/4` | Both intervals skipped; transcript missing across [0,840) | Same authorization behavior; local extraction does not prove decoding. |

| Additional case | Exact evidence | Assessment |
|---|---|---|
| Riffrec quiet capture | M `/entrypoints/0/quiet_capture` | F1 has empty evidence and Low confidence. Nevertheless, the kickoff asserts “evidence of product friction,” creates R3 to resolve F1, and supplies an ungrounded weird/unclickable-button AE2. Neither a defect nor a clean product bill of health is supported. |
| Sweep quiet capture | M `/entrypoints/1/quiet_capture` | Same unsupported promotion. Human review remains necessary; no session-specific product requirement is confirmed. |
| Riffrec initial request → unavailable fallback | S `/entrypoints/0/initial_request_and_fallback_calls`, `/result/transcript`, `/result/transcription_egress_receipt` | One initial mocked whole-file provider call precedes fallback failure because ffmpeg is unavailable. No transcript covers [0,840). Both final receipts incorrectly report `provider_request_sent:false`, losing cumulative attempt history. CLI exit 0 does not establish transcription success. |
| Sweep initial request → unavailable fallback | S `/entrypoints/1/initial_request_and_fallback_calls`, `/result/transcript`, `/result/transcription_egress_receipt` | Identical mismatch: one prior mocked request, zero chunk requests, no transcript, false final request flag, exit 0. |

Each supplement result also contains empty events and five moments with null screenshots (`/entrypoints/{0,1}/result/moments`). Those timestamps are placeholders, not visual coverage or evidence of product behavior.

| Facet | Supported conclusion | Remaining owner / action |
|---|---|---|
| Cumulative egress | Each entrypoint has **7 mocked provider calls** across the five chunk cases, plus **1** supplement initial request: **8 per entrypoint, 16 total**. M case-level `actual_egress` and S entrypoint-level `actual_egress` are all false. Mocked request flags are not actual transfers. | Analyzer owner: preserve cumulative request history through fallback; retain per-attempt and per-interval outcomes. |
| Coverage/status | Partial coverage, empty successful responses, authorization skips, and extraction/provider failures are distinguishable in subordinate receipts but poorly summarized. | Analyzer owner: expose covered/missing intervals and distinguish partial, empty-success, skipped, and failed outcomes. |
| Cleanup | M `/entrypoints/{0,1}/scratch_removed_after_capture:true` records cleanup after capture; its label alone does not establish context-exit timing. S `/entrypoints/{0,1}/scratch_removed_after_context_exit:true` explicitly establishes post-context scratch removal for both supplement cases. | Validation owner: preserve timing-specific cleanup evidence; neither flag proves general retention compliance or live-provider cleanup. |
| Product claims | Quiet F1 does not justify friction, R3, AE2, root cause, or implementation work. | Analysis/product owner: inspect original evidence, remove unsupported session claims, and promote only grounded findings. |
| Live capability | M `/limitations` and S `/limitation` explicitly exclude real decoding and external transcription. Synthetic duration and timestamp prefixes do not prove real synchronization, complete speech capture, or user benefit. | Validation owner: separately validate real media decoding and, only with explicit recording/provider egress authorization, real transcription and coverage. |

The frozen Riffrec Skill requires explicit transcription authorization, local-only raw media/frames, and evidence-grounded findings (`SKILL.md`, “Common rules”; `references/analyzer.md`; `references/extensive-analysis.md`, “Workflow” and “Source mapping grounding”). Receipt value `explicit-cli-flag` records an analyzer input; it does not independently prove upstream user consent. No repair, live validation, or additional workflow invocation was performed in this read-only assessment.
