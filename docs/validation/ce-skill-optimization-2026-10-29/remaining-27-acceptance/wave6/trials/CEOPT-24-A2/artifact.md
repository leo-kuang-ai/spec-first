Both analyzer entrypoints show the same mocked behavior: partial transcripts can return `status: ok`, quiet captures produce unsupported product requirements, and fallback receipts lose an earlier provider attempt. **These receipts prove neither real decoding nor external transcription.**

Evidence shorthand—all paths are under `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/`:

- **M** = `media-A-receipts.json`
- **S** = `media-supplement-A-receipts.json`
- In both files, `entrypoints[0]` is `spec-riffrec-feedback-analysis`; `entrypoints[1]` is `spec-sweep`.
- Evidence references below use exact JSON selectors.

Coverage intervals describe synthetic fixture coverage, not verified speech completeness.

| Entrypoint | 840-second case | Covered / missing transcript intervals | Mock provider attempts | Finding and evidence |
|---|---|---|---:|---|
| Riffrec | complete | Text returned for `[0,420)` and `[420,840)`; no fixture interval missing | 2 | `ok`, timestamp prefixes at 0 and 420. M `entrypoints[0].chunk_cases[0]` |
| Sweep | complete | Same | 2 | Same. M `entrypoints[1].chunk_cases[0]` |
| Riffrec | second-provider-failed | `[0,420)` represented; `[420,840)` missing | 2 | Second provider call failed, yet aggregate status is `ok`. M `entrypoints[0].chunk_cases[1]` |
| Sweep | second-provider-failed | Same | 2 | Same. M `entrypoints[1].chunk_cases[1]` |
| Riffrec | second-extraction-failed | `[0,420)` represented; `[420,840)` missing | 1 | Second extraction reports `decode failed`; no second provider call. Aggregate remains `ok`. M `entrypoints[0].chunk_cases[2]` |
| Sweep | second-extraction-failed | Same | 1 | Same. M `entrypoints[1].chunk_cases[2]` |
| Riffrec | silence | Both intervals processed with empty returned text; no transcript content | 2 | Both chunk statuses are `ok`, aggregate says `failed` / “No chunks transcribed successfully.” Does not establish actual silence. M `entrypoints[0].chunk_cases[3]` |
| Sweep | silence | Same | 2 | Same. M `entrypoints[1].chunk_cases[3]` |
| Riffrec | no-egress-authority | Entire `[0,840)` untranscribed | 0 | Two mocked extractions; both provider calls skipped with authorization `missing`. M `entrypoints[0].chunk_cases[4]` |
| Sweep | no-egress-authority | Same | 0 | Same. M `entrypoints[1].chunk_cases[4]` |

Each case has `actual_egress: false`. The `explicit-cli-flag` value records the harness flag; it does not independently establish user consent for a real transfer.

| Additional case | Riffrec evidence | Sweep evidence | Assessment |
|---|---|---|---|
| Quiet capture | M `entrypoints[0].quiet_capture` | M `entrypoints[1].quiet_capture` | F1 is low confidence, with an empty evidence list. Nevertheless, generated requirements assert “evidence of product friction,” promote F1 into R3, and introduce an unobserved weird/unclickable-button example in AE2. These are unsupported product claims. “No obvious failure detected” also cannot establish a healthy product. |
| Initial request, then unavailable chunk fallback | S `entrypoints[0].initial_request_and_fallback_calls`, `.result.transcript`, `.result.transcription_egress_receipt` | Corresponding selectors under S `entrypoints[1]` | One mocked initial full-media `curl` attempt occurs. Fallback fails because ffmpeg is absent; no chunks are attempted. Entire `[0,840)` lacks transcript. Both final receipts incorrectly report `provider_request_sent: false`, forgetting the earlier attempt. Exit code 0 does not establish analysis completeness. |

Cumulative attempt accounting must preserve **any earlier attempt**, even when the final fallback sends nothing. Across these independent fixtures, each entrypoint records seven chunk-provider attempts plus one initial fallback-case attempt: **eight mocked attempts per entrypoint, sixteen combined; zero actual external requests**. These totals are fixture accounting, not a production session or upload-volume measurement.

Cleanup evidence has different strength:

| Evidence | What is established | Remaining limitation |
|---|---|---|
| M `entrypoints[0/1].scratch_removed_after_capture: true` | Receipt reports scratch removal after capture | Does not explicitly establish measurement after context exit |
| S `entrypoints[0/1].scratch_removed_after_context_exit: true` | Both supplementary scratch roots were reported removed after context exit | Does not prove production cleanup, unrelated artifact removal, or provider-side retention/deletion |

| Responsible owner | Remaining action |
|---|---|
| Analyzer maintainer, both consumers | Expose partial interval coverage instead of relying on aggregate `ok`; distinguish successful empty responses from transcription failures; preserve cumulative request-attempt state through fallback. |
| Requirements-generation maintainer | Keep quiet/no-signal results as analysis limitations; remove unsupported friction assertions, R3 promotion, and invented product examples. |
| Feedback reviewer/product owner | Review actual source evidence before confirming any defect, requirement, severity, or root cause. Supplementary M1–M5 have null screenshots, empty events, and no transcript. |
| Validation/privacy owner | Obtain explicit recording/provider transfer authority before any live trial; validate real decoding, transcription coverage and cleanup separately. Current fixtures cannot establish those outcomes. |

This assessment used only the permitted frozen Riffrec Skill, its analyzer/extensive references, and named receipts. The companion Sweep receipts were interpreted without reading its Skill. No execution, mutation, external contact, or delegation was performed.
