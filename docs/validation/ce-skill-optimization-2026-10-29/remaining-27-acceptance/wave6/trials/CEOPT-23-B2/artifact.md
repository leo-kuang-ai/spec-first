Read-only disposition analysis is complete. PR remediation remains **partial: no real remote outcome is established and no write is authorized**. All edits, commits, pushes, replies, and resolutions were `not-run`.

Evidence references below use these exact files:

- **F**: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/pr-recovery-fixture.json`
- **R**: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/pr-feedback-B-receipts.json`
- **S**: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/pr-feedback-supplement-B-receipts.json`
- **M**: `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/B/spec-resolve-pr-feedback/references/full-mode.md`

`A` denotes the exact 40-character fix SHA `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`; `B` denotes head SHA `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`.

The receipts document the **actual pure publication helper exercised with an in-process provider stub**. They establish mocked helper behavior, not hosted GitHub reads, actual publication, successful tests, reply visibility, or resolved threads (R:186–188; S:42). No helper was executed in this trial.

| Helper case | Finding and exact evidence | Remaining condition and responsible owner |
|---|---|---|
| `published` | `verified:true`, `fix-reachable-from-pr-head`; comparison `A...B` is `ahead` with merge base `A` (R:31–44). Recorded calls preserve `github.enterprise.example`, fetch base PR `upstream/project#42`, then compare in actual head repository `fork/project` (R:46–54). | Publication condition passes **inside this stub only**. Authorized caller must establish fresh real PR/head identity and ancestry, required validation, and independent communication/resolution authority. |
| Original `unpublished` | Helper rejects with `verified:false`, `fix-not-proven-reachable` (R:83–97). Its `behind` status combined with merge base `A` is contradictory for the stated `A...B` comparison. | Treat strictly as rejection-path evidence, **not an actual Git graph or proof of real nonpublication**. Evidence owner must use consistent ancestry; the supplement supplies that mocked case. |
| Supplement consistent `behind` | `behind`, merge base `B`; result remains `verified:false`, `fix-not-proven-reachable` (S:11–30). In this consistent model, head `B` does not contain fix `A`. Calls retain the selected host and fork comparison repository (S:32–40). | Authorized landing owner must establish how the intended fix reaches the selected PR head, then obtain fresh publication evidence. Do not invent an equivalent replacement SHA after rebase/squash. |
| `wrong-head-repository` | Expected `fork/project`, provider reports `other/project`; helper returns `publication-pr-identity-changed` (R:111–138). Only the base PR read is recorded; no comparison follows (R:140–145). | Caller owns reconciling selected PR and actual head identity. Do not silently accept the changed repository or reuse old publication evidence. |
| `provider-unavailable` | `verified:false`, `publication-read-unavailable`; only the attempted base PR read is recorded (R:173–183). | Publication is unknown, not disproven. Authorized caller/provider owner must restore read availability and obtain fresh evidence before dependent claims. |

The fixture’s PR is `https://example.invalid/o/r/pull/42` (F:3), whereas helper scenarios concern Enterprise `upstream/project#42`. These are separate synthetic identities; matching PR numbers and SHAs do not establish that the helper results describe the fixture’s actual remote PR.

| Mixed feedback item | Disposition | Unresolved facets and next owner |
|---|---|---|
| `T-fixed` | Preserve **fixture-reported fixed-locally**, fix SHA `A`, publication unknown (F:5–10). Do not upgrade to verified local repair: changed paths, current source, checks, and results are absent. | Local implementation/validation owner supplies source and passed required checks. Authorized caller establishes publication against the correct current PR/head. Conversation owner then handles independently authorized reply and resolution with visible submitted reply, empty pending-review state, and authoritative resolved state. A mocked publication success alone satisfies none of those other facets (M:250–282). |
| `T-declined` | **Declined**, because global retry would reverse the settled non-retryable failure policy; no code changes required (F:11–16). This accepts the supplied scenario premise, not independently inspected policy code. | No fix commit, publication check, commit, or push is needed for this reply-only item (M:258). Conversation owner reconciles the interrupted reply below, preserves its exact intended body, and supplies original quoted feedback/policy evidence where needed. Reply and resolution require separate authority; decline does not itself close the thread. |
| `T-human` | **Needs-human**, persisted-key compatibility versus rename requires an owner decision (F:17–21). Keep open even if an authorized explanation is later posted. | Product/API/data-compatibility owner chooses the policy; implementer subsequently scopes and verifies any authorized change. Caller must retain the complete decision payload, not replace it with a count or acknowledgment. |

For `T-human`, the decision residual is:

```yaml
type: needs-human
sources:
  - id: T-human
    kind: thread
decision_context:
  quoted_feedback: null
  investigation: "F:17-21 supplies the decision premise only; no original comment, source, callers, or migration evidence is available."
  decision_reason: "Choosing persisted key compatibility versus rename requires an owner decision."
  options:
    - option: "Preserve the persisted key."
      tradeoff: "Retains existing stored-key compatibility; retains the current naming."
    - option: "Rename the persisted key with an explicitly decided migration/compatibility policy."
      tradeoff: "Adopts the desired naming; requires migration and compatibility decisions plus verification."
  recommendation: null
thread_urls: []
```

This residual is **incomplete for operational handoff**: `T-human` is a synthetic ID, the exact original quotation and authoritative thread URL are unavailable, and the empty URL list must not be interpreted as evidence that no thread exists. The caller owns obtaining those identities and preserving the decision until answered. Neither option is implemented or approved.

The interrupted `T-declined` POST has unknown acceptance (F:23–26). Its exact intended body is:

> The global retry proposal conflicts with the settled non-retryable failure policy.

| Recovery branch | Safe disposition | Remaining owner/action |
|---|---|---|
| `case_present` | Exact body found, observed ID `reply-fixture-1` (F:28–31). Preserve that ID; **do not duplicate the POST**. Body equality alone does not prove source association, reply ownership, selected-PR URL, visibility, or submission. | Conversation owner verifies those missing facts, checks any review is not `PENDING`, and refreshes `pending_review:null`. With independent resolution authority, perform only remaining resolution and verify it. Preserve the observed reply even if later checks fail (M:246–282). |
| `case_absent` | Completed read reports no exact body (F:32–35). In the modeled branch this supports absence; no reply is established. | Conversation owner confirms identity, completeness, freshness, exact prepared text, and pending-review state. Only with future reply authority may one new POST be attempted, followed by readback. Current write prohibition means no retry now. |
| `case_unavailable` | Read incomplete (F:36–38): acceptance remains unknown. This is **not confirmed absence**. | Read/provider owner restores complete conversation evidence before choosing present/absent handling. No blind retry, duplicate reply, or resolution. Independent read-only judgments remain deliverable. |

All three reply branches remain synthetic; no actual reply or resolution receipt is supplied. The publication helper receipts cannot substitute for reply-helper, thread-mapping, pending-review, visibility, or resolution evidence. Real completion requires separately authorized actions and confirmed outcomes; a read-only fetch cannot count as a mutation (M:304–328).
