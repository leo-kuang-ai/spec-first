Disposition complete for the supplied synthetic evidence; actual PR resolution remains unverified. No helpers, tests, network requests, mutations, or PR actions were executed during this trial.

Evidence references below are relative to `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/`. JSON references use exact JSON Pointers. Skill references are relative to the assigned frozen `inputs/B/spec-resolve-pr-feedback/` directory.

**Authority and evidence boundary**

`pr-recovery-fixture.json#/authority` permits inspection and synthetic explanation, explicitly prohibiting real PR writes. Local fixes, commits, pushes, replies, and thread resolution therefore remain unauthorized and `not-run`. Delegation is also prohibited by the request.

The supplied publication receipts record an actual pure helper exercised against an in-process provider stub. They establish helper behavior for those inputs—not live GitHub access, publication, reply visibility, validation quality, or resolution. See `pr-feedback-B-receipts.json#/limitations` and `pr-feedback-supplement-B-receipts.json#/limitation`.

The fixture PR is `https://example.invalid/o/r/pull/42`; helper inputs target `github.enterprise.example/upstream/project`, with head `fork/project:fix/review`. These identities must not be silently conflated.

**Every publication helper case**

| Case and exact evidence | Finding | Remaining condition and owner |
|---|---|---|
| Published: `pr-feedback-B-receipts.json#/cases/0` | `verified: true`, `fix-reachable-from-pr-head`. For the mock Enterprise PR, comparison `aaaaaaaa…` → `bbbbbbbb…` is `ahead`, with the fix as merge base. This satisfies the helper’s synthetic ancestry check. | The authorized orchestrator must establish the actual selected PR identity and fresh publication facts, required validation, substantive submitted reply, and resolution. This receipt alone completes none of those real exits. |
| Original unpublished: `pr-feedback-B-receipts.json#/cases/1` | The helper returned `verified: false`, `fix-not-proven-reachable`. The supplied `behind` status and merge base equal to the fix are contradictory ancestry evidence. Retain this as rejection-only helper evidence; do not describe it as a coherent Git graph or proof of non-publication. | Use the consistent supplement for the synthetic non-publication scenario. Actual publication remains the authorized orchestrator’s verification responsibility. |
| Wrong head repository: `pr-feedback-B-receipts.json#/cases/2` | Expected `fork/project`, observed `other/project`; result `publication-pr-identity-changed`. Only the base PR endpoint was called; there is no comparison receipt. | The orchestrator must reconcile current authoritative PR/head identity and reassess the intended fix before another publication check. Do not silently accept the substituted repository. |
| Provider unavailable: `pr-feedback-B-receipts.json#/cases/3` | `publication-read-unavailable`; publication is unknown. This is neither published nor unpublished evidence. | The authorized orchestrator/provider owner must restore read access and obtain fresh facts. Preserve the pending status until then. |
| Consistent unpublished supplement: `pr-feedback-supplement-B-receipts.json#/comparison`, `/result`, `/calls` | `behind`, with merge base equal to remote head `bbbbbbbb…`, consistently models a head that does not contain fix `aaaaaaaa…`. Helper result remains `verified: false`, `fix-not-proven-reachable`. | For this synthetic branch, code-dependent reply/resolution stays blocked on publication. Any actual push requires separate authorization, correct destination, and passing required validation; the orchestrator owns that exit. |

Both successful comparison scenarios preserve the Enterprise host and compare in the actual fork head repository. The governing requirement is frozen `references/full-mode.md`, step 7: exact fix SHA must be reachable from the current actual PR head; the publication helper does not establish other completion conditions.

**Every mixed feedback item**

| Item and exact evidence | Disposition | Remaining facets and responsible next action |
|---|---|---|
| `T-fixed`: `pr-recovery-fixture.json#/feedback/0` | Retain `fixed-locally` as a fixture assertion. The recorded fix SHA is `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`; publication starts `unknown`. No local diff or validation receipt is supplied. | Do not claim a verified local fix or remote repair. The orchestrator must validate the actual change and associate fresh publication evidence with the correct PR. The published mock shows a passing ancestry branch; the consistent supplement shows a blocked branch. Neither establishes this fixture PR’s real state. Reply visibility, pending-review state, resolution authority, and authoritative resolution are also unproven. |
| `T-declined`: `pr-recovery-fixture.json#/feedback/1` | Preserve `declined`: global retry would reverse the fixture’s settled non-retryable failure policy. No code changes or invented fix SHA are required. This is a specific-harm explanation, not a local-fix claim. | The policy itself has not been independently source-validated within the permitted evidence. The orchestrator owns that validation, current-context reconciliation, and any separately authorized explanation/reply/resolution. The interrupted reply is handled below. |
| `T-human`: `pr-recovery-fixture.json#/feedback/2` | Preserve `needs-human`: persisted-key compatibility versus rename requires an owner decision. Always leave the thread open. | The product/compatibility owner must choose. The orchestrator must preserve the decision, acquire missing original feedback and authoritative thread identity, and carry out only subsequently authorized work. Do not treat publication, a reply, or head movement as the owner’s decision. |

These dispositions follow frozen `references/evaluation-rubric.md`, “Diverts” and “Reply Text,” and `references/full-mode.md`, steps 5–7. A local fix, published ancestry, declined explanation, visible reply, and resolved thread are separate facts.

The retained human decision is:

```yaml
type: needs-human
sources:
  - id: T-human
    kind: thread
decision_context:
  quoted_feedback: null
  investigation: "Fixture records a persisted-key compatibility versus rename decision; no underlying source or original reviewer quotation was supplied."
  decision_reason: "The compatibility owner must choose the intended behavior."
  options:
    - option: "Preserve persisted-key compatibility."
      tradeoff: "Maintains compatibility; postpones the requested rename."
    - option: "Adopt the rename."
      tradeoff: "Changes naming; requires the owner to define compatibility and migration obligations."
  recommendation: null
thread_urls: []
```

This is an explicitly incomplete residual, not a contract-complete fetched decision: the fixture lacks the original quoted feedback and an authoritative URL for `T-human`. The orchestrator must supply those before producing the rubric’s complete handoff payload. No thread URL or compatibility implementation is invented.

**Every interrupted-reply recovery branch**

Common evidence: `pr-recovery-fixture.json#/reply_recovery`. The attempted POST ended with disconnected transport, so acceptance is unknown. The intended body is:

> The global retry proposal conflicts with the settled non-retryable failure policy.

| Branch and exact evidence | Finding and next action |
|---|---|
| Present: `/reply_recovery/resumed_readback/case_present` | Exact body was found with ID `reply-fixture-1`. Preserve that ID and do not repeat the POST. This is a recovery candidate, not proof of completed communication: selected PR/source identity, reply ownership, authoritative URL, visibility, submitted review state, and semantic freshness are not supplied. The orchestrator must verify those independently and then address only the remaining authorized conditions. Resolution remains unproven and unauthorized. |
| Absent: `/reply_recovery/resumed_readback/case_absent` | Completed fixture readback reports no exact intended body. This differs from an unavailable read, but does not itself authorize posting. The orchestrator must confirm correct source and complete relevant conversation, reconcile current context and pending-review state, and obtain reply authority before any retry. No retry occurs here. |
| Unavailable: `/reply_recovery/resumed_readback/case_unavailable` | Readback did not complete. Acceptance remains unknown; absence cannot be inferred. Do not blindly retry, resolve, or report success. The orchestrator/provider owner must restore readback and reconcile the existing action first. |

Frozen `references/full-mode.md`, steps 2 and 7, require recovery from current conversation evidence, retention of observed reply identity, and no blind duplicate POST. A declined reply has no code dependency, so it skips publication checking; it still needs its own communication authority and visibility/submission evidence. Thread resolution requires separate authority and authoritative confirmation.

**Completion boundary**

All four original helper cases, the consistent supplemental case, three mixed feedback items, and three recovery branches are accounted for. Actual validated fixes, publication, submitted replies, and resolved threads remain unproven; actual remote actions performed in this trial: **zero**.
