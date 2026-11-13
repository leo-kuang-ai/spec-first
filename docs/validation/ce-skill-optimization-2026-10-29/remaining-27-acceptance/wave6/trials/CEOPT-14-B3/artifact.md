CEOPT-14-B3: the observation-gap case remains `watching`; the continuous-control case reaches synthetic, advisory `looks-ready`. The recovery fixture remains blocked by unknown publication, missing conversation-write authority, and an unresolved owner decision. No DONE or merge conclusion follows.

Evidence notation: `R` means `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/lfg-B-receipts.json`; `F` means the same directory’s `pr-recovery-fixture.json`. JSON pointers below identify exact evidence. Contract references are within the frozen `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/B/spec-lfg/` package.

The supplied parent-produced helper receipts report actual watch-state helper behavior against synthetic inputs. I only read these artifacts and the frozen Skill references; I did not run the helper, tests, workers, scripts, remote requests, replies, or PR operations. `R#/limitations` explicitly excludes real 30-minute monitoring and remote requests/replies. `F#/evidence_type` excludes actual remote state and user approval. The recorded source hash at `R#/source_sha256` was not independently recomputed.

**Observation and control findings**

Both cases begin with generation zero, null state, and no warnings (`R#/cases/0/initial/output`, `R#/cases/1/initial/output`). Those initial reads provide no readiness evidence.

| Case and exact evidence | Finding | Unresolved facet and next owner |
| --- | --- | --- |
| Observation-gap, first snapshot: `R#/cases/0/snapshots/0/input` and `/execution/output` | At synthetic `00:00:00Z`, generation 1 is `watching`, quiet time 0, reset reason `first-observation`. | No settled observation window. The LFG watch owner would need further complete observations in an authorized real run. |
| Observation-gap, second snapshot: `R#/cases/0/snapshots/1/input` and `/execution/output` | At `00:30:00Z`, generation 2 reports gap 1800 seconds, quiet time 0, elapsed time 1800, reset reason `observation-gap`, terminal `watching`. Green CI and APPROVED/CLEAN metadata do not compensate for the unobserved interval. | Resume from the existing journal and original invocation budget; obtain fresh complete observations every 30 seconds. Do not fabricate missed polls or renew the budget. |
| Continuous-control: `R#/cases/1/snapshots/0` through `/10`, each `/input` and `/execution/output` | All eleven supplied observations retain the same head/base, OPEN/MERGEABLE/CLEAN state, successful `ci/test`, and empty review items/decisions. Quiet time progresses as listed below. | Synthetic arithmetic supports the helper result, not current remote freshness or real continuous monitoring. The caller must keep this boundary explicit. |

Every continuous-control observation is accounted for:

| Snapshot index | Synthetic time | Generation | Quiet seconds | Terminal |
| --- | --- | --- | --- | --- |
| 0 | 00:00:00 | 1 | 0 | watching |
| 1 | 00:00:30 | 2 | 30 | watching |
| 2 | 00:01:00 | 3 | 60 | watching |
| 3 | 00:01:30 | 4 | 90 | watching |
| 4 | 00:02:00 | 5 | 120 | watching |
| 5 | 00:02:30 | 6 | 150 | watching |
| 6 | 00:03:00 | 7 | 180 | watching |
| 7 | 00:03:30 | 8 | 210 | watching |
| 8 | 00:04:00 | 9 | 240 | watching |
| 9 | 00:04:30 | 10 | 270 | watching |
| 10 | 00:05:00 | 11 | 300 | looks-ready |

The first continuous observation resets the window; every later gap is 30 seconds with no reset. The final reason is `green-review-clear-current`, snapshot hash `acc1825badc0944de20890674d366ab5ecd2ed65a25d4dd7faa63870191cb456` (`R#/cases/1/snapshots/10/execution/output`). In this isolated synthetic control, the result is “looks ready — your call.” It is neither merge authority nor evidence that later feedback cannot arrive.

These judgments follow `references/pr-watch-loop.md`, “Facts and state” and “Readiness”: maximum tolerated gap 60 seconds, five continuously observed quiet minutes, and no carrying unobserved time into readiness. The recovery feedback below cannot be suppressed by the control’s empty synthetic review list.

**Every feedback item**

| Item and evidence | Required handling | Pending conditions and responsible next action |
| --- | --- | --- |
| `T-fixed`: `F#/feedback/0` | Preserve the supplied local-fix disposition and SHA `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`; publication is explicitly unknown. Do not reapply the fix or call it remotely published. | The caller/publication owner must obtain required final-verification evidence, authoritative selected-PR identity and actual head repository/ref, and a publication receipt proving the exact fix SHA reachable from the actual remote PR head. Matching SHA text in `R` is insufficient. A code-dependent reply also needs explicit reply authority and a known-null pending-review state. Resolution separately needs authorization, a matching visible submitted reply, and authoritative resolved-thread evidence. None is established here. |
| `T-declined`: `F#/feedback/1` | Retain the supplied reason: “The proposed global retry changes the settled non-retryable failure policy.” No code change, commit, or push is required for this disposition. | The resolver/caller must confirm the judgment against current source and discussion; this bounded trial did not inspect product source. Reply authority remains absent. A later authorized reply needs fresh identity/discussion reconciliation and known-null pending-review state. Resolution is a separate action with separate authority and evidence. Interrupted-reply recovery is addressed below. |
| `T-human`: `F#/feedback/2` | Preserve the owner decision about persisted-key compatibility versus rename. Do not turn a reply, green CI, publication, or head movement into an answer. Never resolve this thread merely because a decision explanation was posted. | The resolver/caller must complete the typed decision evidence; the persisted-key contract owner must choose the policy. A reply has no artificial code-publication prerequisite, but still requires explicit reply authority and no pending review. Keep the thread open. |

These conditions come from `references/pr-watch-loop.md`, “Conversation completion,” including its action-category table. LFG commit/push/PR admission does not confer reply or thread-resolution authority. Here `F#/authority/real_pr_writes` is explicitly false, so every branch remains interpretive and performs zero writes.

**All interrupted-reply readback branches**

The interrupted attempt is supplied at `F#/reply_recovery/attempt`; transport disconnection leaves acceptance unknown. Its intended body is exactly:

> The global retry proposal conflicts with the settled non-retryable failure policy.

| Branch and exact evidence | Interpretation and next owner |
| --- | --- |
| Present: `F#/reply_recovery/resumed_readback/case_present` | Record the supplied matching reply identity `reply-fixture-1`; do not repost. This establishes a synthetic exact-body match, not independently verified visibility/submitted status, current selected-PR context, or thread resolution. The conversation owner must verify those conditions. If the matching visible submitted reply is confirmed, only separately authorized resolution may remain; this trial authorizes neither operation. |
| Absent: `F#/reply_recovery/resumed_readback/case_absent` | A completed readback reports no exact match. Confirm complete pagination, correct conversation identity, and visibility before treating absence as authoritative. Even with absence confirmed, no retry is allowed here because write authority is false. A later authorized conversation owner may retry only after fresh semantic reconciliation and pending-review checks, then retain the actual receipt and fresh readback. |
| Unavailable: `F#/reply_recovery/resumed_readback/case_unavailable` | Acceptance remains unknown. Do not infer absence, blindly retry POST, or mark the reply complete. The conversation owner must restore readback and inspect before any later authorized retry. Preserve the uncertain attempt in the handoff. |

A failed resolution must never cause reposting or reapplying a fix. Unknown/non-null pending-review state blocks both replies and resolution; submitting or discarding a draft to bypass it is not permitted (`references/pr-watch-loop.md`, “Conversation completion”).

## Needs your decision

`T-human` remains unresolved:

- Supplied reason: “Choosing persisted key compatibility versus rename requires an owner decision.”
- Investigation available: only the fixture’s disposition and reason; no source-backed compatibility analysis, migration evidence, or authoritative thread discussion is supplied.
- Decision alternatives: retain the persisted key, preserving existing compatibility but retaining current naming; or rename it, potentially improving naming while requiring a defined compatibility/migration policy. These are provisional tradeoffs, not validated project findings.
- Recommendation: none justified by the supplied evidence.
- Missing typed fields: exact quoted feedback, complete investigation, authoritative source kind/edit identity, a decision ID, and an authoritative thread URL. The PR-level URL does not substitute for a thread URL.

The resolver/caller owns completing that payload; the persisted-key contract owner owns answering it. No existing complete payload was supplied to preserve unchanged, so this report does not invent one. In an authorized execution, the caller would persist the complete decision privately and pass its hash-bound reference through the journal’s CAS protocol. No persistence or snapshot write occurred here.

The overall recovery handoff remains `needs-human`, with publication and conversation conditions also pending. Under `references/shipping-tail.md`, “Common decision gate,” these conditions prohibit DONE and a pending lifecycle-completion marker. The read-only assessment itself is complete; remote recovery, publication verification, conversation completion, and the owner decision remain unperformed.
