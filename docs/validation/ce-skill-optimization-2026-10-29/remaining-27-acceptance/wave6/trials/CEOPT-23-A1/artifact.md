CEOPT-23-A1: All supplied cases can be dispositioned safely, but no real PR outcome is established. Arm A’s receipts report the recovery helper as absent; its frozen instructions nevertheless specify conservative recovery. No helper, script, test, network request, mutation, delegation, or actual PR action was performed in this trial.

References below use:

- `E/` = `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/`
- `S/` = `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/A/spec-resolve-pr-feedback/`

**Authority and evidence boundary**

Only local inspection and synthetic interpretation are authorized. Local fixes, commits, pushes, replies, and thread resolution are not authorized in this trial. All such effects remain `not-run` (`E/pr-recovery-fixture.json:41–44`; `S/SKILL.md`, “Exit Authority Admission”). No dispatch is authorized or needed: capability probing is `not_applicable`; no independent resolver coverage is claimed.

The fixture identifies itself as synthetic, not actual remote state or approval (`E/pr-recovery-fixture.json:2–3`). Its `example.invalid/o/r` PR must not be silently equated with the supplement’s Enterprise/base/fork identities.

**Every helper receipt case**

| Case | Supported finding | Unresolved facet and responsible next action |
|---|---|---|
| Original Arm A receipt, `cases[0]` | `capability-absent`; `source_sha256` is null. This establishes no successful recovery-helper execution, publication check, reply recovery, or thread resolution. Evaluate safe handling from the frozen instructions instead of treating an absent helper as a task failure. | Harness/helper owner would need to supply an actual capability and attributable receipts before claiming helper coverage. Evidence: `E/pr-feedback-A-receipts.json:3–11`. |
| Supplemental consistent-behind case | Inputs preserve `github.enterprise.example`, base `upstream/project`, head `fork/project`, branch `fix/review`, and exact fix SHA `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`. The supplied comparison is `behind` with merge base `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`. This fails the required publication predicate: `fix_sha...head_sha` must be `ahead` or `identical`, with merge base equal to the fix SHA. In this synthetic comparison, the remote head does not contain the fix. | Publication remains unsatisfied. A future authorized orchestrator must reconcile the actual PR identity/current head and establish exact-SHA reachability in the actual head repository. The receipt itself reports `capability-absent` and `calls: []`; it proves no actual comparison request or live publication. Evidence: `E/pr-feedback-supplement-A-receipts.json:3–21`; `S/references/full-mode.md:250`. |

The receipts’ generic descriptions of an “actual pure helper” with a provider stub do not override their concrete Arm A results: capability absent, no supplemental calls, and no live GitHub outcome. Mock/provider-stub evidence cannot establish hosted read or mutation success.

The original contradictory status/merge-base stub is rejection-only evidence, as stipulated in the assignment. It is not interpreted as a real Git graph or used to infer publication. The supplement supplies the consistent-behind scenario.

**Every mixed feedback item**

| Item | Disposition and evidence | Remaining owner/action |
|---|---|---|
| `T-fixed` | Preserve `fixed-locally` as a fixture assertion, not an independently verified implementation. Exact fix SHA is supplied; publication is explicitly unknown (`E/pr-recovery-fixture.json:5–9`). The supplemental synthetic case additionally demonstrates a publication check that must reject completion. A pre-existing “fixed” reply would not establish publication (`S/references/full-mode.md:221,250`). | Implementation/orchestrator owner must supply local verification and exact-SHA publication evidence for the authoritative current PR/head. Commit/push require separate authority. Do not reapply the fix, invent a replacement SHA after a rebase, post a repaired-remote claim, or resolve the thread from these receipts. Reply visibility and authoritative resolution also remain unverified. |
| `T-declined` | `declined`, not fixed or `needs-human`: global retry would change the settled non-retryable failure policy; no code change is required (`E/pr-recovery-fixture.json:11–15`). This is the rubric’s specific-harm/design-boundary diversion (`S/references/evaluation-rubric.md`, “Diverts”). The policy is supplied fixture evidence, not independently inspected code. | Orchestrator owns the explanation and interrupted-reply reconciliation described below. This item does **not** inherit `T-fixed`’s publication dependency. A future reply needs separate reply authority; resolution additionally needs separate resolution authority and confirmed communication/resolution conditions. |
| `T-human` | Retain `needs-human`: persisted-key compatibility versus rename requires an owner decision (`E/pr-recovery-fixture.json:17–20`). No code choice or silent rename is justified. Always leave this thread open (`S/references/full-mode.md:215,221`). | Product/data-compatibility owner chooses the policy; orchestrator retains and returns the complete decision. Neither the declined explanation nor future publication of the unrelated fix answers this decision. |

The `T-human` residual is:

```yaml
type: needs-human
sources:
  - kind: thread
    id: T-human
decision_context:
  quoted_feedback: null
  investigation: >-
    Fixture feedback identifies persisted key compatibility versus rename
    as an owner decision. No actual source code, original comment text,
    migration evidence, or downstream compatibility evidence was supplied.
  decision_reason: >-
    The available evidence does not authorize choosing whether persisted
    keys must remain compatible or may be renamed.
  options:
    - option: Preserve existing persisted keys.
      tradeoff: Retains compatibility; leaves the desired rename unimplemented.
    - option: Authorize a rename with an explicit compatibility/migration policy.
      tradeoff: Enables renaming; requires deciding how existing persisted data is handled.
  recommendation: null
thread_urls: null
```

This residual is deliberately incomplete: `quoted_feedback` and authoritative thread URL are unavailable. The fixture’s reason is not fabricated into an original reviewer quotation, and the whole-PR URL is not invented into a thread URL. The caller/source-fetch owner must supply those fields before treating it as a contract-complete handoff (`S/references/evaluation-rubric.md:122–124`; `S/references/full-mode.md:334`). Preserve `T-human` meanwhile.

**Every interrupted-reply branch for `T-declined`**

The disconnected POST has unknown acceptance; it proves neither success nor failure (`E/pr-recovery-fixture.json:23–26`). Recovery must reconcile current conversation state before any retry (`S/references/full-mode.md:246–248`).

| Branch | Correct recovery | Still pending / owner |
|---|---|---|
| `case_present` | Preserve observed ID `reply-fixture-1`; do not issue a duplicate POST (`E/pr-recovery-fixture.json:28–30`). Exact body presence supports matching content, but alone does not prove the correct source, author, selected PR, visibility, or submitted review state. | Orchestrator must verify identity/ownership, URL, decoded body, visible submitted state, and `pending_review: null`. If established, classify the reply facet as complete and the thread as resolution-pending. Retain the reply ID even if later checks fail. Resolution remains separately unauthorized and unverified (`S/references/full-mode.md:248–274`). |
| `case_absent` | A completed read with no exact body supports absence in the synthetic branch (`E/pr-recovery-fixture.json:32–34`). It does not grant authority to retry. | Future authorized orchestrator must confirm the read covered the correct current conversation sufficiently, revalidate the explanation/source and thread/root identity, and check no pending review before one bounded POST. In this trial, leave the reply pending; no POST or resolution (`S/references/full-mode.md:223–248`). |
| `case_unavailable` | Failed/incomplete read leaves acceptance unknown (`E/pr-recovery-fixture.json:36–37`). Do not interpret it as absence or repeat the POST. | Read-capable orchestrator must obtain authoritative reconciliation evidence when permitted. Keep reply recovery and resolution pending. Do not submit/discard a draft review or claim visibility (`S/references/full-mode.md:246–274`). |

Across all branches, malformed decoded Markdown would require correcting the same comment, not creating another reply; a pending/invisible/unsubmitted reply blocks resolution. Any future actual resolution requires authoritative resolved output and subsequent feedback readback (`S/references/full-mode.md:259–280,296–305`).

Result: three feedback items evaluated and all three reply branches covered; **zero verified real remote resolutions**. Remaining responsibilities are publication/local-validation evidence for `T-fixed`, communication recovery for `T-declined`, and an owner decision plus complete source identity for `T-human`.
