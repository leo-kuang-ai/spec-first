CEOPT-14-B2: the observation gap does **not** establish readiness. The continuous control reaches the helper’s advisory `looks-ready` state. Feedback recovery remains blocked by unknown publication, absent write authority, and an unresolved owner decision. No overall completion or merge authorization follows.

Evidence aliases below identify exact supplied files:

- **R**: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/lfg-B-receipts.json`
- **F**: the same directory’s `pr-recovery-fixture.json`
- **W**: `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/B/spec-lfg/references/pr-watch-loop.md`
- **S**: the same frozen package’s `references/shipping-tail.md`

JSON references use zero-based array indices.

### Observation and control findings

Both cases begin with generation zero, `state: null`, and `reason_code: generation-zero` (`R#/cases/0/initial/output`, `R#/cases/1/initial/output`). These reads establish initial helper state, not prior monitoring.

| Case / observation | Exact receipt reference | Finding |
|---|---|---|
| Gap, 00:00:00, generation 1 | `R#/cases/0/snapshots/0/{input,execution/output}` | First observation: `quiet_seconds: 0`, `first-observation`, `watching`. |
| Gap, 00:30:00, generation 2 | `R#/cases/0/snapshots/1/{input,execution/output}` | `observation_gap_seconds: 1800` exceeds the 60-second tolerance. Quiet time resets to zero with `observation-gap`; elapsed time remains 1800 seconds. Terminal remains `watching`, despite unchanged successful/approved inputs. |
| Control, 00:00:00, generation 1 | `R#/cases/1/snapshots/0/{input,execution/output}` | First observation; zero quiet time, `watching`. |
| Control, 00:00:30, generation 2 | `R#/cases/1/snapshots/1/{input,execution/output}` | 30-second gap; 30 quiet seconds; `watching`. |
| Control, 00:01:00, generation 3 | `R#/cases/1/snapshots/2/{input,execution/output}` | 30-second gap; 60 quiet seconds; `watching`. |
| Control, 00:01:30, generation 4 | `R#/cases/1/snapshots/3/{input,execution/output}` | 30-second gap; 90 quiet seconds; `watching`. |
| Control, 00:02:00, generation 5 | `R#/cases/1/snapshots/4/{input,execution/output}` | 30-second gap; 120 quiet seconds; `watching`. |
| Control, 00:02:30, generation 6 | `R#/cases/1/snapshots/5/{input,execution/output}` | 30-second gap; 150 quiet seconds; `watching`. |
| Control, 00:03:00, generation 7 | `R#/cases/1/snapshots/6/{input,execution/output}` | 30-second gap; 180 quiet seconds; `watching`. |
| Control, 00:03:30, generation 8 | `R#/cases/1/snapshots/7/{input,execution/output}` | 30-second gap; 210 quiet seconds; `watching`. |
| Control, 00:04:00, generation 9 | `R#/cases/1/snapshots/8/{input,execution/output}` | 30-second gap; 240 quiet seconds; `watching`. |
| Control, 00:04:30, generation 10 | `R#/cases/1/snapshots/9/{input,execution/output}` | 30-second gap; 270 quiet seconds; `watching`. |
| Control, 00:05:00, generation 11 | `R#/cases/1/snapshots/10/{input,execution/output}` | 300 quiet seconds; `looks-ready`, reason `green-review-clear-current`. |

Every supplied snapshot reports the same head `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, base `main` / `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`, OPEN/MERGEABLE/CLEAN state, APPROVED review decision, successful completed `ci/test`, and empty review-item arrays. Each corresponding output has no review/CI events, no head/base change, no branch-currency event, and no human decisions.

Under **W, “Facts and state” and “Readiness”**, unobserved time never counts toward the five-minute window; the original invocation budget does not restart after the gap. The gap case’s next owner is the LFG orchestrator: resume current observations at the prescribed cadence, preserve the original budget, and require a new uninterrupted quiet window. Its remaining budget is not supplied.

For the control alone, the appropriate assessment is **“looks ready — your call.”** This is advisory, not permission to merge or proof against later feedback. The separate recovery fixture’s unresolved items cannot be erased by the control’s empty review arrays.

### Feedback findings and pending owners

**T-fixed** — `F#/feedback/0`

The fixture records `fixed-locally`, exact fix commit `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, and publication `unknown`. This does not establish remote reachability, final verification, reply completion, or thread resolution. Matching SHA text in the watch inputs is insufficient publication proof.

The caller’s next action, in a separately authorized execution context, is to reconcile current PR/head/source identities, obtain required final-verification evidence, and verify the exact fix SHA against the actual head repository using the required publication-inspection protocol. Preserve its verified/reason/head/comparison receipt. A code-dependent reply additionally requires explicit reply authority; resolution requires a visible matching submitted reply, no pending review, and separate resolution authority (**W, “Conversation completion”**). All these facets remain unproven here. Do not recreate the fix or invent a replacement SHA.

**T-declined** — `F#/feedback/1`

The supplied reason is: “The proposed global retry changes the settled non-retryable failure policy.” No code change is required. This is a source-backed-judgment requirement for the caller to revalidate; the fixture does not itself prove current source correctness.

A declined reply has no artificial commit/push prerequisite. It still requires fresh source/discussion reconciliation, known-null pending-review state, and explicit reply authorization. Resolution remains an independent action with its own authorization and visible-reply requirements. The caller owns those pending conditions; no reply or resolution is authorized in this trial.

**T-human** — `F#/feedback/2`

The supplied decision reason is: “Choosing persisted key compatibility versus rename requires an owner decision.” Preserve the item and keep its thread open. Neither publication, a reply, CI, nor head/base movement answers this decision.

### Needs your decision

The supplied fixture does not contain a complete typed decision payload. Missing fields include a decision ID, authoritative source kind/edit identity, actual quoted feedback, investigation evidence, full options/tradeoffs, recommendation, and authoritative thread URL. The PR URL is not a substitute for a thread URL.

The responsible next owner is the feedback investigator/caller, who must prepare and return that complete evidence-backed payload without fabricating missing values. The product/contract owner must then decide compatibility versus rename. Candidate questions to investigate are whether preserving the persisted key maintains required compatibility, and what migration consequences a rename would impose; these are unresolved analysis directions, not an existing approved decision.

Under **W, “Decision Handoff”** and **S, step 9.5**, the complete decision must remain visible and durable, covered threads must stay open, and a non-empty decision set blocks success/DONE and any pending source-plan completion marker. No private decision file or CAS snapshot was written in this read-only trial.

### Interrupted-reply recovery: all branches

The interrupted operation targets **T-declined**, with exact intended body:

> The global retry proposal conflicts with the settled non-retryable failure policy.

`F#/reply_recovery/attempt` says the POST disconnected with unknown acceptance. That is neither confirmed failure nor confirmed success. **W, “Conversation completion”** requires readback before any retry.

| Branch | Exact reference | Recovery finding and responsible next action |
|---|---|---|
| Matching reply present | `F#/reply_recovery/resumed_readback/case_present` | `exact_body_found: true`, ID `reply-fixture-1`. Do not repost. Caller preserves the observed ID and verifies selected-source identity and visible submitted status; the fixture omits URL and explicit visibility/submission evidence. Even a fully verified reply satisfies only the reply condition. Resolution remains pending separate authority, no pending review, and subsequent authoritative resolved-thread evidence. |
| Reply absent after completed read | `F#/reply_recovery/resumed_readback/case_absent` | `exact_body_found: false`, `read_completed: true`. This supports the synthetic absent branch, but pagination completeness and visibility scope are not explicitly supplied. Caller must establish authoritative absence and revalidate source/discussion/head and pending-review state before considering one authorized retry. Current authority forbids that retry. No code publication is needed for this no-code declined reply. |
| Readback unavailable | `F#/reply_recovery/resumed_readback/case_unavailable` | `read_completed: false`. Acceptance remains unknown. Do not retry, resolve, or mark handled. Caller retains the intended action and unknown outcome, obtains a reliable readback when available, then follows the present/absent branch. Stop with a manual-blocker handoff while uncertainty remains. |

A resolution failure must never trigger another reply POST or reapplication of the fix. Independent eligible actions should remain preserved when another action is blocked.

### Scope and terminal assessment

`F#/authority` authorizes local inspection and explicitly forbids real PR writes. LFG publication authority, even if separately established, would not grant reply or resolution authority. Here, no code publication, reply, resolution, approval, or worker execution occurred.

The supplied **parent-provided helper receipts** report actual watch-state-helper arithmetic against synthetic timestamps (`R#/limitations/0`). I read those receipts; I did not run the helper. Synthetic PR state is not current remote evidence or user approval (`F#/evidence_type`), and the evidence explicitly reports no real remote requests or replies (`R#/limitations/1`).

The read-only assessment is complete. The simulated pipeline remains **needs-human / manual-blocker**, with unknown T-fixed publication, incomplete conversation conditions, and an incomplete owner-decision handoff. No `<promise>DONE</promise>` claim is warranted.
