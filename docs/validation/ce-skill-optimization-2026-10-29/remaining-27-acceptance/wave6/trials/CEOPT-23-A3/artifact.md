CEOPT-23-A3 disposition: **read-only assessment complete; PR recovery remains partial.** No files, Git state, replies, threads, or remote services were modified. No helpers, tests, browser actions, or delegated workers were run.

Evidence notation:

- `F` = `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/pr-recovery-fixture.json`
- `R` = the same directory’s `pr-feedback-A-receipts.json`
- `S` = the same directory’s `pr-feedback-supplement-A-receipts.json`
- `K` = `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/A/spec-resolve-pr-feedback/`
- JSON references below use exact JSON pointers. Skill references are relative to `K`.

**Authority and evidence limits**

The request authorizes interpretation only. Local edits, staging/commit, push, reply publication, and thread resolution are not authorized. `F#/authority/real_pr_writes` is explicitly false. Invocation cannot supply missing authority (`SKILL.md`, “Exit Authority Admission”).

`F#/evidence_type` declares synthetic evidence, not actual remote state or user approval. Its `example.invalid` PR URL is not a verified remote identity. No current source, test result, real PR head, submitted reply, pending-review state, or authoritative thread-resolution state was supplied.

**Every supplied helper case**

| Case | Finding | Remaining owner and next action |
|---|---|---|
| Original A helper case | `R#/cases/0/status` is `capability-absent`; `R#/cases/0/reason` says the original package lacks this helper. `R#/source_sha256` is null. This is unavailable capability evidence, not a successful ancestry/recovery execution, and not a missing-file task failure. | Caller retains pending recovery conditions. An independently authorized future owner must obtain the missing facts through an available read-only mechanism. |
| Supplemental A ancestry case | `S#/result/status` is also `capability-absent`, and `S#/calls` is empty. No actual helper/provider call is demonstrated for this case. | Caller must preserve capability absence and must not report a helper-verified publication result. |
| Supplemental consistent ancestry input | `S#/comparison/status` is `behind`; its merge base is `bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`, while `S#/input/fix_commit` is `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`. Under the supplied consistent stub, the remote head is the merge base and **does not contain the fix** (`S#/limitation`). This fails publication admission. | Future publication owner must verify the exact fix SHA against the actual current PR head, using the actual fork head repository and selected host. |
| Original contradictory ancestry stub | Rejection-only evidence, as scoped by the assignment; it cannot establish an actual Git graph or successful publication. The supplied original A receipt exposes no comparison result to reinterpret. | Caller must keep it separate from the supplemental consistent scenario and from real remote evidence. |

The receipt limitations describe a pure-helper/in-process-provider-stub boundary (`R#/limitations/0`, `S#/limitation`). Such mocked evidence would not prove hosted GitHub behavior or live publication. For A specifically, both supplied result records say capability absent; neither establishes a successful actual recovery helper run.

**Every mixed feedback item**

| Item | Disposition and exact evidence | Unresolved facets and responsible next action |
|---|---|---|
| `T-fixed` | Preserve **reported fixed locally; publication unresolved**, not remotely repaired. `F#/feedback/0` supplies the disposition, exact fix SHA, and `publication: "unknown"`. It provides no changed paths or passed verification. The supplemental stub separately demonstrates a non-containing remote head, not publication success. | Local-fix owner must supply current-source and required validation evidence. Publication owner must establish actual PR/head identity and exact-SHA reachability. Only independently authorized actors may subsequently push, reply, or resolve. Do not repeat the local fix merely because publication is pending. |
| `T-declined` | **Declined; no code change required.** `F#/feedback/1/reason` identifies the concrete harm: global retry reverses the settled non-retryable failure policy. `F#/feedback/1/code_changes_required` is false. This supports a synthetic declined disposition under `references/evaluation-rubric.md`, “Diverts”; the actual policy source was not supplied for independent confirmation. | Policy/source owner must confirm the settled policy before any real reply. Reply owner must reconcile the interrupted attempt below. No commit or push is needed for this explanation. Resolution remains a separate authorized, verified exit. |
| `T-human` | **Needs human; leave open.** `F#/feedback/2/reason` identifies the unresolved choice between persisted-key compatibility and rename. Neither local editing nor reply publication resolves that decision. | Compatibility/product owner must choose the intended persisted-key contract; implementation owner then assesses migration and consumer impact. No actual thread URL or original reviewer quotation was supplied, so a production-ready residual still requires authoritative source metadata. |

The fix publication condition is explicit in `references/full-mode.md:250`: verify the exact recorded fix SHA against the actual current PR head; a fork requires its actual head repository. An acceptable compare is `ahead`/`identical` **and** merge base equal to the fix SHA. `behind` fails; a different merge base fails. Missing or uncertain evidence remains pending. No substitute SHA may be invented after rebase or squash.

For the supplemental scenario, preserve these identities without conflating them with the fixture URL:

- Host: `github.enterprise.example`
- Base PR repository: `upstream/project`
- PR: `42`
- Actual head repository/ref supplied to the scenario: `fork/project`, `fix/review`

These are stub inputs (`S#/input`), not live-verified identities.

**Every interrupted-reply branch**

All branches concern `T-declined`, with intended body:

> The global retry proposal conflicts with the settled non-retryable failure policy.

The disconnected POST leaves acceptance unknown (`F#/reply_recovery/attempt`). It does not establish either failure or success. `references/full-mode.md:246–248` requires readback and reconciliation before retry.

| Branch | Interpretation | Remaining owner and next action |
|---|---|---|
| Present | `F#/reply_recovery/resumed_readback/case_present` reports an exact body and ID `reply-fixture-1`. Preserve that ID. **Do not repost.** Exact-body presence alone does not prove correct source association, authorship, selected PR/host, visibility, or submitted state. | Recovery owner must verify those missing facets and the current discussion. If confirmed, classify as reply completed/resolution pending and perform only the remaining independently authorized conditions. |
| Absent | `F#/reply_recovery/resumed_readback/case_absent` reports completed readback and no exact body. This is the synthetic absent branch, distinct from unavailable readback. It does not authorize a new POST. Scope/completeness, current identity, pending-review state, and continuing validity still need confirmation. | Future authorized reply owner may issue one fresh POST only after complete current reconciliation confirms absence and reply preconditions. Then retain its ID/URL and read back the stored reply. |
| Unavailable | `F#/reply_recovery/resumed_readback/case_unavailable/read_completed` is false. Acceptance remains **unknown**; absence cannot be inferred. No retry and no resolution. | Readback owner must restore authoritative read access and reconcile the original attempt before any further write. |

For every branch, `references/full-mode.md:248–274` additionally requires correct reply ownership/source identity, decoded body, selected host/repository/PR URL, submitted visibility, and freshly confirmed `pending_review: null`. If a review ID exists, its state must not be `PENDING`. A malformed body requires correction of the same comment, not another reply. A pending review must not be submitted or discarded automatically.

A declined explanation has no fix-publication dependency; `references/full-mode.md:185` permits its independently authorized reply path without code changes. It still requires separate resolution authority and confirmed reply conditions. `T-human` remains open even after an authorized visible decision reply.

**Decision residual**

```json
{
  "type": "needs-human",
  "sources": [
    { "id": "T-human", "kind": "thread" }
  ],
  "decision_context": {
    "quoted_feedback": null,
    "investigation": "pr-recovery-fixture.json#/feedback/2 reports an unresolved persisted-key compatibility versus rename decision. No current implementation, consumer contract, migration evidence, or original reviewer text was supplied.",
    "decision_reason": "The owner must choose the persisted-key compatibility contract before implementation.",
    "options": [
      {
        "option": "Preserve persisted-key compatibility",
        "tradeoff": "Retains existing persisted identities but retains the legacy naming constraint."
      },
      {
        "option": "Rename the persisted key",
        "tradeoff": "Adopts the new identity but requires an explicit compatibility or migration decision."
      }
    ],
    "recommendation": null
  },
  "thread_urls": []
}
```

This is an **incomplete synthetic residual**, not a contract-complete production handoff: the original quotation and authoritative owned-thread URL are unavailable. The caller owns obtaining both; inventing a `discussion_r` URL from the fixture’s PR URL would be unsupported.

No actual local fix, published ancestry, visible submitted reply, or resolved thread was verified. All mutation exits remain `not-run`; all three feedback identities and all three reply branches remain separately accounted for.
