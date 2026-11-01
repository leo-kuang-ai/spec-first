Assessment complete; PR recovery remains **partial**. No helper, script, test, browser, network call, mutation, delegation, or actual PR action was performed.

Evidence aliases:

- `S` = `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/A/spec-resolve-pr-feedback/`
- `E` = `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/`

All five exit authorities—local fix, commit, push, reply, and thread resolution—are missing for this read-only trial. Inspection is permitted; existing fixture actions do not authorize new actions (`E/pr-recovery-fixture.json:41–44`; `S/SKILL.md:32–52`).

| Case | Finding and exact evidence | Unresolved facets and responsible next action |
|---|---|---|
| Original helper receipt | The only supplied original helper case reports `capability-absent`; it supplies neither execution success nor a source fingerprint (`E/pr-feedback-A-receipts.json:3–8`). Treat this as unavailable capability, not a task failure or successful recovery. | The caller owns any later authorized manual/API recovery. No helper execution or independent coverage may be claimed. |
| Supplemental ancestry case | The supplemental input identifies Enterprise host `github.enterprise.example`, base `upstream/project`, and actual head repository/ref `fork/project:fix/review`. Its consistent `behind` comparison has merge base `bbbb…`, whereas the fix is `aaaa…`: under this synthetic graph, the head does **not** contain the fix (`E/pr-feedback-supplement-A-receipts.json:3–16,21`). The result remains `capability-absent`, with `calls: []` (`:17–20`). | Publication is unsatisfied in the supplemental scenario. The authorized caller must later confirm current PR/head identity and exact fix ancestry in the actual head repository. Preserve Enterprise host and base/head distinction. No real publication conclusion follows from the stub. |
| `T-fixed` | Preserve **fixed-locally, publication unknown**, exactly as supplied (`E/pr-recovery-fixture.json:5–10`). This trial contains no code, validation, or live ancestry evidence establishing a verified or remotely repaired fix. The supplemental case demonstrates a separate synthetic publication failure; its different target identity cannot silently replace the fixture PR. | Caller owns current-source/local verification and actual publication evidence. Do not repeat the fix, claim successful push, publish a repaired-remote reply, or resolve. Exact recorded SHA must be reachable from the actual current PR head; missing/unreachable/unknown evidence remains pending (`S/references/full-mode.md:155–165,185,221,250`). |
| `T-declined` | Preserve **declined**, independently of `T-fixed`: global retry would reverse the supplied settled non-retryable policy; no code change is required (`E/pr-recovery-fixture.json:11–16`). This is a synthetic disposition, not independent validation of the underlying policy source. | The caller owns confirming current feedback/policy evidence, supplying the actual quoted feedback, reconciling the interrupted reply, and obtaining separate reply/resolution authority. Declined explanations do not require fix publication (`S/references/full-mode.md:185–215`). |
| `T-human` | Preserve **needs-human** and leave open: persisted-key compatibility versus rename requires an owner decision (`E/pr-recovery-fixture.json:17–21`). A reply, successful fix elsewhere, or head movement cannot supply that decision. | Product/schema owner chooses compatibility or rename with migration implications; caller preserves the complete decision and later re-evaluates implementation. No automatic resolution (`S/SKILL.md:50`; `S/references/evaluation-rubric.md:122–124`). |

The original contradictory status/merge-base stub is rejection-only evidence, not an actual Git graph. No such contradictory payload is exposed in the permitted Arm A receipt, so no additional helper cases or execution results can be inferred from it.

Every interrupted-reply branch concerns `T-declined`, with intended body and uncertain POST acceptance recorded at `E/pr-recovery-fixture.json:23–26`:

| Branch | Disposition | Remaining owner/action |
|---|---|---|
| `case_present` (`:28–31`) | Preserve observed ID `reply-fixture-1`; **do not POST again**. Exact body found is useful evidence, but the fixture omits authoritative URL, source/account attribution, submission/visibility state, pending-review state, and resolution status. It therefore does not establish full completion. | Caller verifies those missing facets. Once a substantive visible submitted reply is confirmed, handling becomes resolution-pending; only separately authorized resolution remains. Preserve the reply ID even if later checks fail. |
| `case_absent` (`:32–35`) | A completed read reports no exact body; this permits consideration of a new reply only after confirming complete, current, correctly scoped evidence. It does not authorize a retry. | Authorized caller checks identity, discussion freshness, pending review, and reply authority before any single new POST. Under this trial all posting remains `not-run`. |
| `case_unavailable` (`:36–38`) | Readback failed; acceptance remains unknown. **No blind retry and no resolution.** | Caller obtains fresh authoritative readback and reconciles before selecting the present/absent path. Unavailability is not confirmed absence. |

These branches follow `S/references/full-mode.md:221–250,252–274`: distinguish reply visibility from thread resolution, require decoded body integrity and submitted state, require `pending_review: null`, and never submit/discard a draft review automatically. A resolution result and subsequent remote verification are still required; a read-only fetch cannot prove a mutation (`:274–298`).

The `T-human` decision handoff is:

- **Source:** `(thread, T-human)`; fixture reason: “Choosing persisted key compatibility versus rename requires an owner decision.”
- **Investigation:** Only the assigned frozen instructions and named synthetic evidence were inspected; no source implementation, actual thread, or owner decision is available.
- **Decision required:** Preserve persisted-key compatibility, or approve a rename and its migration/consumer consequences.
- **Options/tradeoffs:** Preserve compatibility to avoid immediate persisted-data disruption while retaining existing naming; rename to obtain the desired naming while requiring an explicitly assessed compatibility/migration approach.
- **Recommendation:** `null`; evidence is insufficient to choose.
- **Missing handoff facet:** No authoritative thread URL or original feedback quotation is supplied. The synthetic PR URL is not a thread URL. Caller must supply these rather than inventing them; the required typed residual is therefore incomplete (`S/references/evaluation-rubric.md:112–122`).

The receipts describe mocked/in-process-provider evidence, expressly excluding hosted PR reads, mutations, and live publication (`E/pr-feedback-A-receipts.json:10–11`; `E/pr-feedback-supplement-A-receipts.json:20–21`). They establish no actual remote outcome. **Verified actual remote resolutions: zero.**
