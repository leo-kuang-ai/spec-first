CEOPT-14-A1: the observation-gap receipt is insufficient for readiness; the continuous-control receipt supports advisory readiness within the synthetic scenario. Recovery remains incomplete because publication, reply acceptance in some branches, and the owner decision are separate unresolved facets.

References below use:

- `R` = `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/lfg-A-receipts.json`
- `F` = the same directory’s `pr-recovery-fixture.json`
- `S` = `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/A/spec-lfg/`
- JSON paths use zero-based array indexes.

Only the assigned frozen Skill, its three relevant references, and the named evidence were read. No helper, worker, test, browser, network request, mutation, or PR operation was executed.

| Observation/control | Supplied evidence | Finding and responsible next action |
|---|---|---|
| Observation-gap initialization | `R#/cases/0/initial/output`: generation 0, null state, `generation-zero` | This establishes the supplied helper’s initial state, not prior monitoring. |
| Gap, first observation | `R#/cases/0/snapshots/0`: `00:00:00Z`, generation 1, `watching`, quiet/elapsed 0 | The synthetic PR is OPEN, MERGEABLE/CLEAN, approved, with successful `ci/test`, no review items, and fixed head/base. The quiet window has only started. |
| Gap, second observation | `R#/cases/0/snapshots/1`: `00:30:00Z`, generation 2, `looks-ready`, quiet/elapsed 1800 | Reject the readiness inference. Two observations thirty minutes apart do not establish five continuously observed quiet minutes. The helper receipt contradicts the prose floor at `S/references/pr-watch-loop.md:48`; exit 0, empty warnings, and empty limitations do not repair that evidence gap. **Watch owner:** obtain a fresh continuous observation window without counting the gap or renewing the invocation budget. **Helper maintainer:** investigate the receipt/contract discrepancy; no implementation cause was established here. |
| Continuous-control initialization | `R#/cases/1/initial/output`: generation 0, null state | Separate control history; it does not fill the observation gap above. |
| Continuous-control progression | `R#/cases/1/snapshots/0` through `/9`: times `00:00:00Z`, `00:00:30Z`, `00:01:00Z`, `00:01:30Z`, `00:02:00Z`, `00:02:30Z`, `00:03:00Z`, `00:03:30Z`, `00:04:00Z`, `00:04:30Z`; generations 1–10; quiet/elapsed 0, 30, 60, 90, 120, 150, 180, 210, 240, 270; all `watching` | Every supplied intermediate observation remains below the five-minute threshold. The snapshots preserve the same head/base, OPEN and MERGEABLE/CLEAN state, successful check, empty review/decision sets, and no reported review/CI/currency/head events. |
| Continuous-control endpoint | `R#/cases/1/snapshots/10`: `00:05:00Z`, generation 11, `looks-ready`, quiet/elapsed 300 | Consistent with the five-minute readiness floor for this synthetic sequence: “looks ready — your call.” **Watch owner:** preserve this limited finding; obtain fresh real facts before any actual readiness claim. It grants no merge authority and proves nothing about later feedback. |

The helper execution results above are parent-supplied receipts, not executions performed by this reader. `R#/limitations/0` explicitly says synthetic timestamps exercised the actual helper, with no real thirty-minute monitoring; `/limitations/1` says no real remote requests or replies occurred. The fixture PR, approval, SHAs, and check status are synthetic facts, not current remote evidence.

| Feedback item | Disposition and unresolved facets | Responsible next action |
|---|---|---|
| `T-fixed` | `F#/feedback/0` supplies `fixed-locally`, commit `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`, and `publication: unknown`. A named local commit does not establish push success, PR inclusion, reply delivery, or thread resolution. The matching synthetic head in `R` cannot supply missing publication evidence across fixtures. | **Publication owner:** inspect local/remote identity under appropriate authority, confirm required verification and fresh final fingerprints, then establish successful publication and fresh remote checks. Preserve the local fix if push fails; do not recreate it, reset, rebase, or force-push. **Feedback owner:** separately establish reply/thread disposition. Contract: `S/references/pr-watch-loop.md:23–30` and `S/references/review-followup.md`, “PR Watch Pipeline Return.” |
| `T-declined` | `F#/feedback/1` declines the global retry because it changes the settled non-retryable failure policy; no code changes are required. Preserve that rationale rather than implementing retry. A declined disposition does not prove its explanatory reply was accepted or the thread resolved. | **Feedback owner:** handle the interrupted reply using the branch-specific evidence below. Record the settled-policy conflict in the residual handoff as applicable; do not create a code commit merely to publish a reply. Contract: `S/references/review-followup.md`, “Step 4” and “Step 7”; `S/references/shipping-tail.md`, step 7. |
| `T-human` | `F#/feedback/2` requires an owner choice between persisted-key compatibility and rename. No answer, decision ID, authoritative thread URL, source freshness identity, investigation, or complete typed decision payload is supplied. Neither fixture approval nor a reply can answer it. | **Resolver/top-level owner:** obtain the missing evidence and construct/present the complete decision payload. **Contract/product owner:** make the compatibility decision. Keep the thread open and completion blocked; independent authorized work may continue. Contract: `S/references/pr-watch-loop.md:34–44`; `S/references/shipping-tail.md`, common decision gate. |

## Needs your decision

The known pending issue is `T-human`: “Choosing persisted key compatibility versus rename requires an owner decision.” This is a synthetic fixture reason, not a verified quotation from a remote thread.

The supplied material is insufficient to render a valid complete typed decision unchanged. The resolver must supply `sources`, authoritative `thread_urls`, investigation, decision reason, options with evidence-based tradeoffs, recommendation or explicit null, and a decision ID. Compatibility and rename are the named alternatives; their actual migration and consumer consequences remain uninvestigated. No recommendation or user answer is invented here.

No source-plan completion marker, successful pipeline completion, or DONE claim is justified while this decision remains unresolved.

| Interrupted-reply branch | Exact evidence | Recovery finding and next owner |
|---|---|---|
| Initial interruption | `F#/reply_recovery/attempt` | Disconnected transport leaves acceptance unknown. Do not classify the POST as either accepted or rejected merely from the transport failure. |
| `case_present` | `F#/reply_recovery/resumed_readback/case_present`: exact body found, ID `reply-fixture-1` | Within this branch, readback establishes the intended reply already exists. **Feedback owner:** retain its ID and suppress a duplicate POST. This establishes neither code publication nor thread resolution nor an answer to `T-human`. |
| `case_absent` | `F#/reply_recovery/resumed_readback/case_absent`: completed read, exact body absent | Within this branch, the supplied readback supports absence of the intended reply. **Feedback owner:** retain a pending retry of the exact intended body, subject to valid reply authority and current thread identity. This task prohibits posting, so no retry occurred. |
| `case_unavailable` | `F#/reply_recovery/resumed_readback/case_unavailable`: read incomplete | Acceptance remains unknown. **Feedback owner:** retain the uncertainty and obtain reliable readback before considering another POST. Do not blindly retry or claim acknowledgment. |

The exact intended reply is `F#/reply_recovery/intended_body`: “The global retry proposal conflicts with the settled non-retryable failure policy.”

Authority remains explicit: `F#/authority/local_inspection` is true, but `/real_pr_writes` is false, and `/synthetic_explanation` forbids contacting or posting to an actual PR. The frozen Skill’s pipeline authority rules do not create publication, reply, worker-dispatch, or merge authority for this read-only trial. All next actions above are pending owner responsibilities, not action receipts.
