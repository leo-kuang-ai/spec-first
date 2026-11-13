CEOPT-14-B1: The observation-gap case is **not ready**. The continuous control reaches **synthetic advisory `looks-ready` only**. The recovery fixture remains **needs-human / manual-blocker**: publication, conversation authority, reply visibility, resolution evidence, and a design decision remain distinct conditions.

Evidence aliases below denote exact files:

- **R**: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/lfg-B-receipts.json`
- **F**: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/pr-recovery-fixture.json`
- **W**: `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/B/spec-lfg/references/pr-watch-loop.md`
- **S**: the same frozen skill’s `references/shipping-tail.md`

JSON references use zero-based indexes.

### Observation and control findings

Both cases begin with generation zero, `state: null`, and `reason_code: generation-zero` (**R** `/cases/0/initial/output`, `/cases/1/initial/output`). Neither initial read establishes readiness.

| Case / exact receipt reference | Synthetic observation | Generation | Quiet seconds | Result |
| --- | --- | ---: | ---: | --- |
| **R** `/cases/0/snapshots/0` | 00:00:00 | 1 | 0 | `watching`; `first-observation` |
| **R** `/cases/0/snapshots/1` | 00:30:00 | 2 | 0 | `watching`; 1,800-second gap; `observation-gap` reset |
| **R** `/cases/1/snapshots/0` | 00:00:00 | 1 | 0 | `watching`; `first-observation` |
| **R** `/cases/1/snapshots/1` | 00:00:30 | 2 | 30 | `watching` |
| **R** `/cases/1/snapshots/2` | 00:01:00 | 3 | 60 | `watching` |
| **R** `/cases/1/snapshots/3` | 00:01:30 | 4 | 90 | `watching` |
| **R** `/cases/1/snapshots/4` | 00:02:00 | 5 | 120 | `watching` |
| **R** `/cases/1/snapshots/5` | 00:02:30 | 6 | 150 | `watching` |
| **R** `/cases/1/snapshots/6` | 00:03:00 | 7 | 180 | `watching` |
| **R** `/cases/1/snapshots/7` | 00:03:30 | 8 | 210 | `watching` |
| **R** `/cases/1/snapshots/8` | 00:04:00 | 9 | 240 | `watching` |
| **R** `/cases/1/snapshots/9` | 00:04:30 | 10 | 270 | `watching` |
| **R** `/cases/1/snapshots/10` | 00:05:00 | 11 | 300 | `looks-ready`; `green-review-clear-current` |

Every control observation after the first reports a 30-second gap and no quiet-window reset. Its inputs retain the same head and base, `OPEN`, `MERGEABLE`, `CLEAN`, `APPROVED`, a completed successful `ci/test`, and empty review items. All supplied snapshots report no review/CI events, head change, base advancement, branch-currency event, or human decisions.

**Gap verdict:** Twenty-nine-plus unobserved minutes do not count toward quiet time. The 1,800-second gap exceeds the 60-second tolerance; elapsed invocation time remains 1,800 seconds rather than restarting. The next owner is the LFG orchestrator: in an authorized live continuation, read the same journal, fetch fresh complete facts at the required cadence, preserve the original budget, and accumulate a new continuous quiet window. No supplied budget threshold establishes exhaustion. See **W** lines 13–29.

**Control verdict:** At generation 11, the supplied helper output supports “looks ready — your call” within the synthetic case. It supplies neither merge authority nor protection from later feedback. The next owner is the top-level caller for an accurately limited report; any actual merge decision belongs to its separately authorized owner. See **W** line 84.

The empty feedback arrays in these watch cases cannot dismiss the separately supplied recovery fixture.

### Every feedback item

| Item and evidence | Finding / unresolved facets | Responsible next action |
| --- | --- | --- |
| **T-fixed**, **F** `/feedback/0` | `fixed-locally`; supplied fix SHA is `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`; publication explicitly remains `unknown`. No final verification, actual commit receipt, selected head-repository comparison, reply authorization, pending-review state, matching submitted reply, or resolution authority/evidence is supplied. Equal SHA text in the watch fixture is insufficient publication proof. | The caller must preserve the existing fix and reconcile identity and verification evidence. In a separately authorized continuation, establish that the exact caller-recorded commit is reachable from the actual PR head repository using the required publication inspection: ahead/identical with merge-base equal to the fix SHA. Preserve its verified/reason/head/comparison receipt. Only then may a code-dependent reply proceed under explicit reply authority. Resolution additionally needs a visible matching submitted reply, no pending review, separate authority, and authoritative resolved-thread evidence. Do not recreate the fix. |
| **T-declined**, **F** `/feedback/1` | The supplied rationale is that global retry changes the settled non-retryable failure policy; `code_changes_required: false`. This is a fixture disposition, not a current-source validation performed here. Its conversation work has no artificial commit/push prerequisite. Reply authority and pending-review state remain unresolved. | The caller must validate the rationale against current source and discussion in an authorized continuation, preserve the prepared reply, and apply the readback branch below. Resolution remains independently gated. Do not change the settled policy merely to clear feedback. |
| **T-human**, **F** `/feedback/2` | Persisted-key compatibility versus rename requires an owner decision. No answer, complete typed decision payload, authoritative thread URL, or bound decision artifact is supplied. Publication is not a prerequisite to explaining the decision. | The caller must complete and preserve the decision analysis; the compatibility/design owner must choose. Keep the thread open even if a reply is later authorized and visible. Never interpret CI, publication, a reply, or head movement as the decision. |

These distinctions follow **W** lines 50–66. LFG commit/push/PR authority does **not** grant reply or resolution authority. Unknown pending-review state blocks both conversation writes; submitting or discarding a draft is not a workaround.

### Interrupted-reply recovery: every branch

The interrupted attempt concerns **T-declined**. Its intended body is:

> The global retry proposal conflicts with the settled non-retryable failure policy.

The disconnected POST leaves acceptance unknown (**F** `/reply_recovery/attempt`). It is neither confirmed failure nor permission to repost.

| Branch and exact evidence | Interpretation | Responsible next action / remaining conditions |
| --- | --- | --- |
| **Present**, **F** `/reply_recovery/resumed_readback/case_present` | Exact body found; synthetic reply ID `reply-fixture-1`. Do not duplicate the POST. | Caller retains that observed ID. Confirm selected source/PR identity, visibility and submitted status; exact-body presence alone does not explicitly supply those facets or a reply URL. If confirmed, only the reply condition is satisfied. Resolution still requires no pending review, separate resolution authority, and authoritative resolution evidence. |
| **Absent**, **F** `/reply_recovery/resumed_readback/case_absent` | Completed read reports no exact body. Unlike an unavailable read, this supports absence within the fixture’s completed-read scope. | Caller must ensure the read covered the correct conversation, complete pagination and relevant visibility. A later retry is eligible only after fresh semantic reconciliation, explicit reply authorization and confirmed absence of pending review. No code publication is required for this declined/no-change reply. Preserve actual write receipt and readback if later authorized. |
| **Unavailable**, **F** `/reply_recovery/resumed_readback/case_unavailable` | Read did not complete; acceptance and presence remain unknown. | Caller preserves the unknown result and stops the dependent write. Obtain a complete authoritative readback in an authorized continuation before deciding whether any retry is needed. Never blindly repost or infer absence. |

An independent eligible action must not be discarded because another is blocked. Resolution failure must not trigger another reply or another code fix. See **W** lines 52–66.

### Needs your decision

**Source:** `T-human`, **F** `/feedback/2`.

**Supplied decision reason:**

> Choosing persisted key compatibility versus rename requires an owner decision.

**Investigation boundary:** The fixture identifies the choice but provides no persisted schema, consumers, migration evidence, original feedback quotation, or authoritative thread URL. The quoted sentence above is the fixture’s reason, not a fabricated original comment.

Candidate options for owner consideration, **not supplied or accepted decisions**:

- **Preserve persisted-key compatibility:** avoids an immediate consumer migration; retains the existing naming constraint.
- **Rename with an explicit compatibility/migration strategy:** improves naming consistency; introduces migration, consumer-update and rollback obligations.

**Recommendation:** Undetermined without compatibility requirements and consumer evidence.

**Responsible owners:** The caller prepares the complete source-backed typed handoff; the persisted-key contract owner chooses. Missing fields include source kind/edit identity, original quoted feedback, authoritative `thread_urls`, a complete validated decision payload, and its persisted artifact/hash and journal decision ID. Do not manufacture those values or claim a successful decision handoff.

Once independent authorized work is exhausted, this remains `status: needs-human`; covered threads stay open. It blocks success and any pending source-plan completion marker. See **W** lines 70–80 and **S** steps 7.5 and 9.5.

### Authority and evidence limits

This trial performed file reads only. **F** `/authority` authorizes local inspection and explicitly prohibits real PR writes. No publication, reply, resolution, PR-body update, tracker filing, lifecycle mutation, helper execution, delegated worker execution, approval, or merge occurred here.

The supplied parent evidence reports actual watch-state-helper exercise with **synthetic timestamps**; I did not rerun or independently verify that execution. **R** `/limitations` explicitly excludes real 30-minute monitoring and real remote requests/replies. **F** `/evidence_type` explicitly excludes actual remote state and user approval.

The caller owns preservation of this report and all pending conditions. A future executable continuation must also load the resolver’s actual Full Mode step-7 protocol; that external package was outside this trial’s allowed reads. No remote durability or end-to-end completion is claimed.
