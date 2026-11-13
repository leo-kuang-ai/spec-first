CEOPT-14-A2: the observation-gap readiness claim is unsupported; the continuous control supports synthetic advisory readiness. Publication, reply delivery, thread resolution, and the human decision remain separate facets. Overall closeout is blocked by unresolved publication evidence and `T-human`; no DONE or merge claim is justified.

Evidence references below use zero-based JSON Pointers:

- `R` = `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/lfg-A-receipts.json`
- `F` = `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/pr-recovery-fixture.json`
- `S` = `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/A/spec-lfg/`
- Governing guidance: `S/references/pr-watch-loop.md`, “Readiness,” “Event routing,” and “Decision Handoff”; `S/references/review-followup.md`, “PR Watch Pipeline Return”; `S/references/shipping-tail.md`, steps 7.5, 9, and 9.5.

**Observation-gap case**

`R#/cases/0/initial/output` records generation zero with null state. Snapshot 0 records `00:00:00Z`, generation 1, `watching`, and zero quiet/elapsed seconds. Snapshot 1 records `00:30:00Z`, generation 2, `looks-ready`, reason `green-review-clear-current`, and 1,800 quiet/elapsed seconds (`R#/cases/0/snapshots/0` and `/1`).

Both inputs report the same head `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, base `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`, OPEN/MERGEABLE/CLEAN state, APPROVED review decision, successful completed `ci/test`, and no review items. No head/base/review/CI event is emitted.

The helper receipt nevertheless counts the entire 30-minute gap as quiet time. Two green endpoint observations do not establish five continuously observed quiet minutes. This conflicts with `S/references/pr-watch-loop.md`, “Readiness”: “unobserved time never counts.” Exit code zero, empty warnings, and a written generation establish reported helper execution success, not semantic readiness.

Disposition: reject this `looks-ready` as sufficient closeout evidence. The next watch owner must obtain a fresh observed quiet window without counting the gap, preserving the original invocation budget rather than renewing it. The helper maintainer owns investigating the discrepancy and a focused regression under separate implementation authorization. This assessment did not inspect or change helper implementation.

**Continuous-control case**

`R#/cases/1/initial/output` likewise starts at generation zero. Every supplied control observation is accounted for below; pointers are relative to `R#/cases/1/snapshots`.

| Snapshot | Synthetic observation | Generation | Quiet/elapsed seconds | Reported terminal |
|---|---|---:|---:|---|
| `/0` | `00:00:00Z` | 1 | 0 | `watching` |
| `/1` | `00:00:30Z` | 2 | 30 | `watching` |
| `/2` | `00:01:00Z` | 3 | 60 | `watching` |
| `/3` | `00:01:30Z` | 4 | 90 | `watching` |
| `/4` | `00:02:00Z` | 5 | 120 | `watching` |
| `/5` | `00:02:30Z` | 6 | 150 | `watching` |
| `/6` | `00:03:00Z` | 7 | 180 | `watching` |
| `/7` | `00:03:30Z` | 8 | 210 | `watching` |
| `/8` | `00:04:00Z` | 9 | 240 | `watching` |
| `/9` | `00:04:30Z` | 10 | 270 | `watching` |
| `/10` | `00:05:00Z` | 11 | 300 | `looks-ready` |

Every control input retains the same successful check, head/base identities, OPEN/MERGEABLE/CLEAN state, and empty review-item set. Every output has empty review/CI events and decisions, no head/base changes, and no warnings; executions report exit code zero. The final snapshot returns `green-review-clear-current` (`R#/cases/1/snapshots/10/execution/output`).

Disposition: the supplied 30-second observation sequence supports the synthetic five-minute control and its advisory “looks ready — your call.” It supplies neither merge authority nor a real remote readiness determination. The real pipeline owner would still need current authoritative remote observations, complete feedback discovery, and closure of the recovery fixture’s independent residuals. Empty review sets in these control inputs cannot erase known `F` feedback.

**Feedback dispositions**

| Item and exact evidence | Assessment and unresolved facets | Responsible next action |
|---|---|---|
| `T-fixed`, `F#/feedback/0` | The fixture says `fixed-locally`, names commit `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, and explicitly marks publication `unknown`. Local fixation is not proof of push, inclusion in the PR, successful current-head checks, posted explanation, or resolved thread. The matching SHA in the synthetic watch inputs does not independently establish real publication. | The authorized landing owner must inspect actual local/remote identity and PR inclusion before any publication claim or retry. Confirm current-source applicability and required verification; accepted fixes must pass fresh step 6.5 verification/fingerprints before authorized commit/push. The feedback owner separately tracks reply delivery and resolution. No remote operation is authorized here. |
| `T-declined`, `F#/feedback/1` | Decline rationale: “The proposed global retry changes the settled non-retryable failure policy.” `code_changes_required` is false. Do not implement a retry or create a cosmetic commit merely to acknowledge the item. The interrupted reply leaves communication delivery uncertain; declining a proposal does not itself prove remote acknowledgment or thread resolution. | The feedback owner retains the source-confirmed decline rationale and applies the readback branches below. Actual replies or resolution require appropriate external-write authority, absent in this fixture. |
| `T-human`, `F#/feedback/2` | “Choosing persisted key compatibility versus rename requires an owner decision.” No selection or approval is supplied. A reply, green check, changed head, or watch termination cannot answer it. | The persisted-key contract/product owner must decide after investigation; the top-level pipeline owner must preserve and return the decision residual, keep the covered thread open, and block success/DONE and any pending source-plan completion marker. |

For `T-fixed`, if a later authorized attempt finds a committed fix but failed/rejected push, preserve that commit and its actual SHA/failure evidence, leave remote checks unresolved, and return local-only/manual-blocker. Do not recreate the fix, reset, rebase, or force-push as recovery (`S/references/pr-watch-loop.md`, “Event routing”).

**Interrupted reply recovery — all branches**

Common evidence: `F#/reply_recovery/thread` is `T-declined`; `/intended_body` is:

> The global retry proposal conflicts with the settled non-retryable failure policy.

`F#/reply_recovery/attempt` says transport disconnected and acceptance is unknown. This is an ambiguous write outcome, not proof of rejection or delivery.

| Exact branch | Interpretation | Next owner/action |
|---|---|---|
| `F#/reply_recovery/resumed_readback/case_present` | Exact body found, reply ID `reply-fixture-1`. In this synthetic branch, readback accounts for the intended reply; suppress duplicate posting. It does not establish thread resolution, code publication, or human approval. | Feedback owner records the observed reply identity and retains any independently unresolved facets. No repeat POST. |
| `F#/reply_recovery/resumed_readback/case_absent` | Completed readback finds no exact body. Delivery remains unconfirmed; this branch permits considering a controlled retry only after validating readback scope and existing reply authority. It does not grant that authority. | Feedback owner may retry once under appropriate real write authorization, then confirm the outcome through readback. Here `real_pr_writes: false`, so retry is pending and was not performed. |
| `F#/reply_recovery/resumed_readback/case_unavailable` | Readback did not complete. Presence/absence remains unknown. Blind repost risks duplication; marking acknowledgment complete would invent evidence. | Feedback owner preserves the uncertain outcome and retries readback when available. If unavailable, return an explicit communication blocker without reposting. |

These are alternative branches, not three events that all occurred.

## Needs your decision

`T-human` remains pending. The supplied fixture contains the reason quoted above but lacks the complete typed decision payload required by `S/references/pr-watch-loop.md`, “Decision Handoff”: authoritative source kind/edit identity, quoted original feedback, investigation, stable decision ID, option tradeoffs, recommendation, and an authoritative thread URL. `F#/pr` is a PR URL, not an authoritative thread URL. No missing values have been fabricated.

The responsible investigator must complete that payload before a valid persisted decision handoff. Candidate choices for owner consideration, not supplied approvals, are retaining persisted-key compatibility versus renaming with an explicit migration/consumer-impact plan. The evidence supplied here is insufficient to recommend either.

There is no user answer to record, no answer artifact/hash, and no successful CAS decision or answer write in this trial. Once independent authorized work ends, the top-level owner should return `needs-human` with the complete residual; if its required fields remain unavailable, report that handoff incompleteness explicitly. A durable record alone cannot convert the decision into success.

The execution outputs are parent-provided helper receipts; I only read them. `R#/limitations` explicitly distinguishes synthetic timestamps exercising the actual helper from real 30-minute monitoring and states that no real remote requests or replies occurred. `F#/evidence_type` identifies synthetic PR state, not user approval, and `F#/authority/real_pr_writes` is false. No worker dispatch, verification run, mutation, publication, reply, resolution, merge, or approval was performed or claimed.
