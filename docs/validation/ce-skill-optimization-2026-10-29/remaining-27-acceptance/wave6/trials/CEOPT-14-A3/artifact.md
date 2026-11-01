CEOPT-14-A3: the observation-gap receipt reports readiness without sufficient continuous observation. The continuous control supports advisory readiness within the synthetic fixture. Feedback recovery remains incomplete: publication is unknown, reply acceptance depends on readback, and an owner decision remains outstanding. No real PR action is authorized or established.

References below use:

- `S` = `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/A/spec-lfg/`
- `E` = `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/`
- `R` = `E/lfg-A-receipts.json`; `F` = `E/pr-recovery-fixture.json`
- JSON array indexes are zero-based.

The frozen Skill was interpreted as guidance for this read-only assessment; its pipeline was not invoked. The supplied receipts are parent-provided helper evidence, not helper executions performed by this reviewer. `R#/limitations` explicitly identifies synthetic timestamps and no real remote requests or replies. `F#/evidence_type` excludes actual remote state and user approval; `F#/authority/real_pr_writes` is `false`.

| Observation/control | Exact evidence | Finding and responsible next action |
|---|---|---|
| Observation-gap initialization | `R#/cases/0/initial/output` | Generation 0, null state: no prior observation coverage. |
| Observation-gap first snapshot | `R#/cases/0/snapshots/0/input`; corresponding `execution/output` | At synthetic `00:00:00Z`, generation 1 is `watching`, quiet/elapsed 0. Supplied facts show head `aaaa…`, base `bbbb…`, OPEN, MERGEABLE/CLEAN, APPROVED, successful `ci/test`, and no review items. |
| Observation-gap second snapshot | `R#/cases/0/snapshots/1/input`; corresponding `execution/output` | At `00:30:00Z`, generation 2 reports `looks-ready`, `quiet_seconds: 1800`, reason `green-review-clear-current`, without warnings. The 30-minute unobserved interval cannot establish five continuously observed quiet minutes. Reject this readiness conclusion despite helper success. The LFG/watch owner must obtain a fresh continuous window; the helper maintainer should investigate the discrepancy against `S/references/pr-watch-loop.md`, “Readiness.” No repair was attempted. |
| Continuous-control initialization | `R#/cases/1/initial/output` | Separate generation-zero chain, again without prior coverage. |
| Continuous-control snapshots 0–9 | `R#/cases/1/snapshots/0` through `/9`, each `input/observed_at` and `execution/output` | Eleven total observations begin at `00:00:00Z`. These first ten are spaced 30 seconds apart through `00:04:30Z`; generations 1–10 remain `watching`, with quiet/elapsed values 0, 30, 60, 90, 120, 150, 180, 210, 240, 270. All retain the same supplied head/base and clean, successful, review-clear facts. |
| Continuous-control snapshot 10 | `R#/cases/1/snapshots/10/input`; corresponding `execution/output` | At `00:05:00Z`, generation 11 reports `looks-ready`, quiet/elapsed 300, reason `green-review-clear-current`. This agrees with the frozen five-minute observation requirement for this synthetic control. “Looks ready — your call” is advisory, never merge authority or proof against later feedback. The next owner is the authorized LFG/watch owner for fresh real facts, if separately commissioned. |

Every supplied snapshot reports empty review/CI event arrays, no head/base/currency event, and no human decisions. These snapshot-local facts cannot erase the separately supplied feedback in `F`; no chronology tying that fixture to either watch chain was supplied.

| Feedback item | Evidence and disposition | Unresolved facets and next owner |
|---|---|---|
| `T-fixed` | `F#/feedback/0`: `fixed-locally`, fix commit `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, publication `unknown`. | Preserve the local-fix report without declaring verified publication, remote inclusion, successful push, reply delivery, or thread resolution. The matching synthetic watch head is insufficient publication evidence. An authorized landing owner must inspect actual local/remote identity, confirm fix inclusion and verification, and pass fresh final verification/fingerprint gates before any needed publication. Do not recreate the fix merely because publication is unknown. The feedback owner must separately establish reply and thread state. See `S/references/review-followup.md`, “PR Watch Pipeline Return,” and `S/references/pr-watch-loop.md`, “Event routing.” |
| `T-declined` | `F#/feedback/1`: no code change required; proposed global retry conflicts with the settled non-retryable failure policy. | Keep the decline separate from code publication. Intended explanation: “The global retry proposal conflicts with the settled non-retryable failure policy.” Its delivery is uncertain because the POST disconnected (`F#/reply_recovery/attempt`). The authorized feedback owner must use the readback branches below; no code push is needed merely to explain a decline. Neither a draft nor a transport attempt proves reply delivery or resolution. |
| `T-human` | `F#/feedback/2`: choosing persisted-key compatibility versus rename requires an owner decision. | Keep this item open and return `needs-human`; do not silently choose, implement, reply as decided, complete a pending lifecycle marker, or claim DONE. The product/contract owner must decide; the feedback investigator must first complete the decision evidence and source identities. See `S/references/pr-watch-loop.md`, “Decision Handoff,” and `S/references/shipping-tail.md`, step 9.5. |

For `T-human`, the supplied decision reason is exactly: “Choosing persisted key compatibility versus rename requires an owner decision.” The fixture does not supply the original quoted feedback, investigation, stable source kind/version, authoritative thread URL, decision ID, or enough implementation evidence to recommend a choice. The PR URL alone is not an authoritative thread URL. These omissions prevent a complete typed decision handoff; they must remain explicit.

The owner’s alternatives are preserving persisted-key compatibility, which retains compatibility obligations, or renaming, which requires defining migration and consumer impact. Those are candidate tradeoffs for investigation, not confirmed impacts. Recommendation remains unset pending that investigation. No user answer or approval is present. A future exact displayed decision-ID answer must be recorded through the prescribed hash-bound answer/CAS flow before being treated as recorded; no such transition ran here.

All interrupted-reply branches apply to `T-declined`, with the exact intended body in `F#/reply_recovery/intended_body`:

| Readback branch | Exact evidence | Required interpretation and next action |
|---|---|---|
| Present | `F#/reply_recovery/resumed_readback/case_present`: exact body found, ID `reply-fixture-1`. | Within this synthetic branch, the intended reply is already present. Retain that reply ID as delivery evidence and do not duplicate the POST. This does not prove thread resolution, publication, or a human answer. Next owner: feedback owner to assess remaining thread state under applicable authority. |
| Absent | `F#/reply_recovery/resumed_readback/case_absent`: completed read, exact body not found. | The completed readback supports absence in this branch. An authorized feedback owner may issue one controlled retry after confirming the target and applicable write authority. This run has no real PR-write authority, so the retry remains pending and unexecuted. A subsequent outcome must be confirmed rather than assumed. |
| Unavailable | `F#/reply_recovery/resumed_readback/case_unavailable`: read incomplete. | Acceptance remains unknown. Do not blindly repost or claim failure/success; retain the interrupted attempt and intended body, and obtain reliable readback first. Next owner: authorized feedback owner; if readback remains unavailable, return the unresolved transport/readback blocker. |

Publication, explanation delivery, thread resolution, and the compatibility decision are independent facets. Success in one does not close the others. Overall handoff remains incomplete because the observation-gap readiness is unsupported, `T-fixed` publication is unknown, reply recovery is branch-dependent, and `T-human` lacks a completed decision and owner answer.

Only assigned frozen files and references were read. No mutation, helper execution, tests, worker dispatch, browser/network access, remote write, merge, or approval occurred.
