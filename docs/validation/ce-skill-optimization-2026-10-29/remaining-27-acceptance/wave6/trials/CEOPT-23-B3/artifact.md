Status: **partial**. The synthetic cases are adjudicated below; actual publication, reply visibility, and thread resolution remain unverified. No helper, test, mutation, network request, delegation, or actual PR action was performed during this trial.

Evidence references use these exact paths:

- `S`: `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/B/spec-resolve-pr-feedback/`
- `W`: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/`
- JSON references below are JSON Pointers within the named file.

**Authority and scope**

`W/CEOPT-23-request.txt` and `W/pr-recovery-fixture.json#/authority` authorize interpretation and local inspection only. Local fixes, staging/commits, pushes, replies, and thread resolution are **not authorized** for this trial. Dispatch is prohibited; capability probing is not applicable. All those actions remain `not-run`.

The fixture PR is `https://example.invalid/o/r/pull/42`; the helper receipts concern a different synthetic Enterprise identity. They demonstrate conditional helper behavior and cannot establish publication for the fixture PR.

**Every publication-helper case**

The supplied receipts attribute execution to the actual pure publication helper, using an in-process provider stub. This trial only read those receipts. They provide mock-backed helper evidence, **not hosted PR reads, live Git ancestry, actual pushes, or remote repair**.

| Case | Exact evidence | Finding and remaining owner |
|---|---|---|
| Published | `W/pr-feedback-B-receipts.json#/cases/0` | `verified:true`, `fix-reachable-from-pr-head`. For the stub identity, comparison `a…a...b…b` is `ahead`, with merge base `a…a`: the recorded fix is reachable from the recorded head. Calls retain host `github.enterprise.example`, fetch PR metadata from `upstream/project`, and compare in actual head repository `fork/project`. Publication alone does not establish tests, semantic freshness, visible reply, authority, or resolution. **Caller/orchestrator** must obtain corresponding fresh evidence for the actual target before dependent actions. |
| Original unpublished stub | `W/pr-feedback-B-receipts.json#/cases/1` | `verified:false`, `fix-not-proven-reachable`. Its `behind` status and merge base equal to the fix SHA are contradictory ancestry inputs. Retain this solely as **rejection-only helper evidence**, not a coherent Git graph or proof of actual non-publication. **Evidence owner** must retain that qualification; use the supplement for the consistent behind branch. |
| Consistent unpublished supplement | `W/pr-feedback-supplement-B-receipts.json#/comparison`, `/result`, `/calls`, `/limitation` | `behind`, with merge base equal to remote head `b…b`, consistently places the head before fix `a…a`; the stub head does not contain the fix. Helper returns `verified:false`, `fix-not-proven-reachable`. **Authorized publication owner** must publish the appropriate verified fix or establish the correct replacement mapping after any rewrite, then obtain fresh publication evidence. Do not substitute an inferred SHA. |
| Wrong head repository | `W/pr-feedback-B-receipts.json#/cases/2` | Expected `fork/project`, observed `other/project`; `publication-pr-identity-changed`. Only the base-PR metadata call is recorded; no comparison follows. This is an identity failure, not an ancestry finding. **Caller/orchestrator** must reconcile current target/head identity before retrying a read or performing any dependent action. |
| Provider unavailable | `W/pr-feedback-B-receipts.json#/cases/3` | `publication-read-unavailable`; publication is **unknown**, not proven absent. Only the PR metadata request is recorded. **Provider/access owner and caller** must restore reliable reads and re-observe the selected target. Code-dependent reply/resolution remains pending. |

The governing condition is `S/references/full-mode.md:250–258`: exact fix SHA must be reachable from the actual current PR head; the helper supplies read-only publication facts and cannot prove the other completion conditions.

**Every mixed feedback item**

| Item | Disposition | Evidence and unresolved facets | Responsible next action |
|---|---|---|---|
| `T-fixed` | Preserve **fixture-reported `fixed-locally`**; do not promote to verified repair or remotely fixed. | `W/pr-recovery-fixture.json#/feedback/0` records commit `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, publication `unknown`. No changed files, source inspection, validation results, actual head identity, submitted reply, or resolved-thread receipt is supplied. None of the Enterprise helper branches selects an actual outcome for this fixture PR. | **Local-fix owner** supplies current-source/delta and required validation evidence. **Caller/orchestrator** reconciles actual target identity and exact-SHA ancestry. Publication, reply, and resolution owners act only under their separate authorities. Preserve the recorded SHA as a fixture claim, not a newly created commit. |
| `T-declined` | **`declined`**, reply-only, `code_dependency:false`; no fix SHA or publication requirement. | `W/pr-recovery-fixture.json#/feedback/1` says global retry reverses the settled non-retryable failure policy and requires no code changes. This supports a synthetic harm-based decline under `S/references/evaluation-rubric.md`, “Diverts.” Actual policy source was not provided/read; real-world merits remain source-unverified. Reply and resolution remain incomplete. | **Policy/source owner** confirms the settled policy for a real execution. **Caller/orchestrator** reconciles the interrupted reply using the branches below; a separately authorized communication owner completes only missing conversation conditions. |
| `T-human` | **`needs-human`**, pending decision; leave open. | `W/pr-recovery-fixture.json#/feedback/2` requires a choice between persisted-key compatibility and rename. No decision, authoritative thread URL, original review text, or source evidence is supplied. Acknowledgment would not answer the decision. | **Compatibility/product owner** decides with source evidence. **Caller/orchestrator** retains the complete residual and source identity, continues independent work, and obtains missing thread metadata before a real handoff. No resolution while the decision is pending. |

**Every interrupted-reply branch**

Exact intended body, preserved from `W/pr-recovery-fixture.json#/reply_recovery/intended_body`:

> The global retry proposal conflicts with the settled non-retryable failure policy.

The disconnected POST at `/reply_recovery/attempt` leaves acceptance unknown. Do not blindly repeat it. `S/references/full-mode.md:246–248` requires reconciliation of source identity, reply attribution, exact decoded body, visibility, and submission state.

| Branch | Finding | Remaining conditions and owner |
|---|---|---|
| Present | `/reply_recovery/resumed_readback/case_present` reports an exact-body match with ID `reply-fixture-1`. Preserve that ID. An exact-body match alone does **not** establish correct-source attribution, URL identity, visibility, submitted state, or current relevance. | **Caller/orchestrator** verifies those missing facets. Once the existing reply is accepted, do not repost; retain only unresolved conditions. A fresh `pending_review:null`, separate resolution authority, and authoritative resolved result are still required. No publication condition applies to this decline. |
| Absent | `/reply_recovery/resumed_readback/case_absent` reports completed readback and no exact body. In this synthetic branch, the reply remains unsatisfied; no replacement POST occurred in this trial. | **Caller/orchestrator** confirms complete, correctly scoped conversation evidence, current source/reply relevance, target/root identity, and absence of a pending review. A separately authorized reply owner may then post once and verify the stored body, URL, visibility, and submission; resolution remains separately authorized. |
| Unavailable | `/reply_recovery/resumed_readback/case_unavailable` reports readback incomplete. Acceptance remains unknown; this is not absence. | **Provider/access owner and caller** restore readback and reconcile before retrying. Preserve any subsequently discovered reply ID/URL. Neither duplicate POST nor resolution is justified. |

For all branches, a pending review, unavailable review state, invisible/unsubmitted reply, or malformed decoded body blocks resolution. Correcting an existing malformed reply requires separately authorized editing of that same comment, not another POST (`S/references/full-mode.md:260–284`). Resolution additionally needs authoritative completion and subsequent feedback readback; no such receipts exist here.

**Preserved human residual**

```json
{
  "type": "needs-human",
  "sources": [
    {"id": "T-human", "kind": "thread"}
  ],
  "decision_context": {
    "quoted_feedback": null,
    "investigation": "Only the synthetic fixture was inspected. Its recorded reason is: Choosing persisted key compatibility versus rename requires an owner decision.",
    "decision_reason": "Persisted-key compatibility versus rename remains an owner decision; current code and migration evidence are unavailable.",
    "options": [
      {
        "option": "Preserve the persisted key",
        "tradeoff": "Preserves compatibility; retains the existing key naming."
      },
      {
        "option": "Rename with an explicitly agreed compatibility or migration strategy",
        "tradeoff": "Changes naming; requires assessment and treatment of persisted-data and consumer compatibility."
      }
    ],
    "recommendation": null
  },
  "thread_urls": []
}
```

This residual is **incomplete for a production handoff**: `T-human` is a synthetic ID, original quoted feedback and an authoritative owned-thread URL are unavailable. The empty URL array explicitly records missing evidence; it does not satisfy the rubric’s requirement for a URL for every owned thread. The caller must supply those facts rather than invent them.

All three sources retain pending conversation actions. `T-fixed` additionally retains local-verification and publication conditions; `T-declined` retains reply reconciliation and authorized resolution; `T-human` retains the owner decision and any separately authorized acknowledgment, **never resolution while pending**. Actual remotely resolved items: **0**.
