# Merging, Validation, And Reporting

Read after all dispatched review results return. Inline fallback executes only its permitted output normalization, Stages 5d/5e, and Stage 6; it neither claims independent coverage nor enters apply.

### Stage 5: Merge findings

Local project-standards review and synthesis own scoped-rule coverage. The external adversarial peer is corroborative; accept its candidates only when compatible with every applicable scoped rule established locally. Any replacement candidate needs independent local evidence. Retain `adversarial-review-constraints.md` only as private run scratch under the existing cleanup policy.

Read `references/action-class-rubric.md` before routing findings or assigning severity. It owns the detailed P0–P3 and action-routing definitions.

Convert multiple reviewer JSON returns into one deduplicated, confidence-gated finding set. The normal compact returns contain merge-tier fields (title, severity, file, line, confidence, autofix_class, owner, requires_verification, pre_existing) plus the optional suggested_fix. Detail-tier fields (`why_it_matters`, `evidence`) normally live in per-agent artifact files; when `REVIEW_ARTIFACT_DIR` was unavailable or a write failed, a reviewer may return the full schema in band, and synthesis must preserve those detail fields instead of requiring a re-run.

`confidence` is one of 5 discrete anchors (`0`, `25`, `50`, `75`, `100`) with behavioral definitions in the findings schema. Synthesis treats anchors as integers; do not coerce to floats.

Before semantic synthesis, serialize the compact reviewer returns as one JSON array and pipe it through `bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/findings-mechanics.py"`. This helper owns schema-shape rejection, exact `file + line + normalized title` fingerprints, contributor/independence accounting, quote-line confidence floor, deterministic suppression, stable ordering, and numbering. It never decides whether differently worded findings are semantically equivalent, whether severity is correct, whether an adjacent pre-existing issue is a direct dependency, or how thematic groups should read; those remain synthesis judgments. Malformed/helper-failure output cannot be upgraded to a clean finding set.

1. **Validate.** Check each compact return for required top-level and per-finding fields, plus value constraints. Drop malformed returns or findings. Record the drop count.
   - **Top-level required:** reviewer (string), findings (array), residual_risks (array), testing_gaps (array). Drop the entire return if any are missing or wrong type.
   - **Per-finding required:** title, severity, file, line, confidence, autofix_class, owner, requires_verification, pre_existing
   - **Value constraints:**
     - severity: P0 | P1 | P2 | P3
     - autofix_class: gated_auto | manual | advisory
     - owner: downstream-resolver | human | release
     - confidence: integer in {0, 25, 50, 75, 100}
     - line: positive integer
     - pre_existing, requires_verification: boolean
   - **Quote-the-line gate (enforced here).** Any finding at anchor **75 or 100** must carry a non-empty `first_evidence` (the verbatim motivating line with `file:line`). A 75/100 finding missing `first_evidence` is **demoted to anchor 50** (record the demotion count for Coverage) — it then faces the normal anchor-50 fate in the confidence gate (dropped unless P0 or routed to a soft bucket).
   - Do not validate against the full schema here -- the full schema (including why_it_matters and evidence) applies to the artifact files on disk, not the compact returns.
2. **Deduplicate.** Accept the helper's exact fingerprint merges first. Then use semantic judgment for differently worded findings or nearby lines that describe the same failure; record why they are equivalent rather than asking the script to guess. Keep highest severity/anchor and note every contributing reviewer. Dedup runs over the full validated set (including anchor 50) so cross-reviewer promotion in step 3 can lift matching anchor-50 findings into the actionable tier.
3. **Cross-reviewer agreement.** When 2+ independent reviewers flag the same issue (same fingerprint), promote the merged finding by one anchor step: `50 -> 75`, `75 -> 100`, `100 -> 100`. Note the agreement in the Reviewer column of the output (e.g., "security, correctness"). **Promotion never bypasses the quote-the-line gate (step 1).** A finding may sit at anchor 75 or 100 — whether originally or via this promotion — only if the merged finding carries `first_evidence`. If no contributing reviewer supplied it (e.g. two reviewers reported the same finding without the quote and step 1 demoted both to 50), cap the promotion at 50: agreement corroborates that the issue is *real*, but the quoted line is what licenses *high confidence*, and two un-quoted findings must not combine into a quote-free 75. When at least one contributor supplied `first_evidence`, the merged finding inherits it (step 2 keeps it) and promotes normally. The cross-model `adversarial-<peer>` return counts as an independent reviewer here; agreement between it and the in-process `adversarial` persona is the strongest signal in the set (different model families, separate processes) — render it as `adversarial, adversarial-<peer>`. The Stage 4 `fast-pass` pseudo-reviewer is the orchestrator's own read, **not** independent, so it **never counts toward this promotion** (and is capped at anchor 50): a `fast-pass`+persona fingerprint match is noted in the Reviewer column (e.g. "correctness, fast-pass") but does **not** bump the anchor — the persona's own independent anchor carries the finding. A `fast-pass`-only finding stays at anchor 50 (surfacing solo only when P0).
4. **Separate pre-existing.** Pull out findings with `pre_existing: true` into a separate list. **Exception — the change depends on it:** a pre-existing or adjacent-file gap that the change under review *relies on for its own correctness* stays in the primary findings, not the pre-existing list. The bar is a direct dependency — the new code is wrong, unsafe, or unverified *because of* this gap. Merely sitting nearby, or the repo being better without it, does not qualify: if the change would be correct regardless of the gap, it stays pre-existing. Do not widen this into general repo cleanup ("fix the whole repo").
5. **Resolve disagreements.** When reviewers flag the same code region but disagree on severity, autofix_class, or owner, annotate the Reviewer column with the disagreement (e.g., "security (P0), correctness (P1) -- kept P0").
6. **Normalize routing.** For each merged finding, set the final `autofix_class`, `owner`, and `requires_verification`. If reviewers disagree, keep the more conservative route. Remap any legacy `safe_auto` or `review-fixer` to `gated_auto` / `downstream-resolver`.
6b. **Mode-aware demotion of weak general-quality findings.** Some persona output is real signal but does not warrant primary-findings attention. Reroute it to the existing soft buckets so the primary findings table stays focused on actionable issues.

A finding qualifies for demotion when **all** of these hold:
   - Severity is P2 or P3 (P0 and P1 always stay in primary findings)
   - `autofix_class` is `advisory` (concrete-fix findings stay in primary)
   - **All** contributing reviewers are `testing` or `maintainability` — if any other persona also flagged this finding, cross-reviewer corroboration is present and the finding stays in primary findings regardless of its severity or advisory status (expand the weak-signal list later only with evidence)

When a finding qualifies:
   - Move demoted findings out of the primary set. If the contributing reviewer is `testing`, append `<file:line> -- <title>` to `testing_gaps`. If `maintainability`, append to `residual_risks`. Use title-only lines (compact return omits `why_it_matters`). Record the demotion count for Coverage.

7. **Confidence gate.** After dedup, promotion, and demotion have shaped the primary set, suppress remaining findings below anchor 75. Exception: P0 findings at anchor 50+ survive the gate -- critical-but-uncertain issues must not be silently dropped. Record the suppressed count by anchor (so Coverage can report "N findings suppressed at anchor 50, M at anchor 25"). The gate runs late deliberately: anchor-50 findings need a chance to be promoted by step 3 (cross-reviewer corroboration) or rerouted by step 6b (mode-aware demotion to soft buckets) before any drop decision.
8. **Partition the work.** Build two sets:
   - actionable queue: `gated_auto` or `manual` findings whose owner is `downstream-resolver` (hand off to caller)
   - report-only queue: `advisory` findings plus anything owned by `human` or `release`
9. **Sort and number.** Order by severity (P0 first) -> anchor (descending) -> file path -> line number, then assign monotonically increasing `#` values across the full primary finding set in that sorted order. Do not restart numbering inside each severity table, triage group, or autofix/routing bucket. If later sections repeat a finding (for example Actionable Findings), reuse the same stable `#` so users and downstream workflows can reference findings by `#` across the report and caller handoff.
9b. **Build thematic triage groups.** After stable `#` values exist, group related findings so the reader can triage themes instead of items. This is distinct from deduplication: dedupe answers "are these the same finding?", grouping answers "are these distinct findings that should be understood or resolved together?". Groups never merge findings into a synthetic finding and never change a finding's severity, confidence, route, owner, or stable `#`. Groups span the **full primary finding set** — both actionable and report-only findings — so they organize the whole report, not just the apply queue.
   - **`grouping:off`:** skip this step.
   - **`grouping:auto` (default):** build groups when findings span distinct concerns — the trigger is distinct concerns, not item count (mirroring how plan Requirements group by capability). Skip only when all findings are genuinely about the same thing; prefer no groups over decorative single-item groups.
   - **`grouping:always`:** always build groups; use single-finding groups only when no meaningful multi-finding grouping exists.
   - **Grouping signals:** shared root cause, affected subsystem, user-facing failure mode, overlapping fix path, dependency ordering, or repeated symptoms of one design choice.
   - **Group shape:** short title, the included stable finding `#`s, one-line context, preferred resolution, and why — when one fix path resolves several findings, name it and say which finding to handle first.
   - **Ordering:** order groups by the highest-severity finding they contain, then by lowest stable `#`. A finding appears in at most one group; leave genuinely unrelated findings ungrouped.
10. **Collect coverage data.** Union residual_risks and testing_gaps across reviewers.
11. **Preserve spec-first local-prompt artifacts.** Keep the learnings, agent-native, and deployment-verification outputs alongside the merged finding set. Do not drop unstructured output just because it does not match the persona JSON schema. Schema drift from `data-migration` is already in the merged finding set.

Before finalizing findings, compare recommendations with the retained `session-settled:` decisions. A recommendation that merely repeats an explicitly rejected alternative is a settlement conflict to explain, not an automatic fix. Keep source-backed correctness, safety, and contract defects actionable even when they challenge a settled choice; name the new evidence and the decision that needs reconsideration. An annotation is context, never authority to suppress a defect or mutate source.

### Stage 5b: Validation pass (optional quality gate)

Independent verification gate. Spawn one validator sub-agent per surviving finding using `references/validator-template.md`. Findings the validator rejects are dropped; confirmed findings flow through unchanged.

**When this stage runs:** After Stage 5 whenever at least one finding survives — skip only when zero survive. When more than 15 survive, do **not** skip the stage; validate per the budget cap in step 2. The default method is the per-finding validator wave (steps below); a surviving **P2/P3 finding at anchor 100** may instead be validated by direct first-party verification (see below). Same rule for default and `mode:agent`.

**Steps:**

1. **Select findings to validate.** All survivors of Stage 5.
2. **Apply dispatch budget cap.** If the selected set exceeds 15 findings, validate the highest-severity 15 (P0 first, then P1, then P2, then P3, breaking ties by anchor descending), dropping only from the P2/P3 tail. **Never drop a P0 or P1 from validation** — if P0/P1 findings alone exceed 15, raise the cap to include all of them. Record the over-budget count (the dropped P2/P3 tail) for the Coverage section.
3. **Spawn validators with bounded parallelism.** One sub-agent per finding, dispatched independently using the validator template and the same bounded scheduler from Stage 4. Each validator receives:
   - The finding's title, severity, file, line, suggested_fix, original reviewer name, and confidence anchor
   - `why_it_matters` when available — loaded from `{review_artifact_dir}/{reviewer_name}.json`; omit when `artifact_path` is null, the file is absent, or the artifact write failed. The validator proceeds without it, using the diff and cited code directly.
   - The full diff
   - When task mode is active, the same task-scope bundle and file-isolation labels supplied to reviewers; validators must validate the finding against the cited task bundle rather than the full working-tree diff
   - The scope mode and remote head ref, mirroring the Stage 4 reviewer bundle: inject `<pr-scope-mode>local-aligned | pr-remote | branch-remote</pr-scope-mode>` and, when set, `<pr-head-ref>...</pr-head-ref>` or `<branch-head-ref>...</branch-head-ref>`. The validator template defaults to local-aligned workspace inspection when these are absent, so omitting them in `pr-remote`/`branch-remote` makes validators verify findings against the stale working tree — dropping valid findings or confirming false ones on the wrong tree.
   - Inspection access scoped by mode: in `local-aligned`, Read/Grep/git blame the cited code, callers, guards, framework defaults, and history; in `pr-remote`/`branch-remote`, inspect via `git show <remote-head-ref>:<path>` or the provided diff hunks only — do not Read/Grep workspace paths for files in scope.
4. **Collect verdicts.** Each validator returns `{ "validated": true | false, "reason": "<one sentence>" }`.
   - `validated: true` -> finding survives unchanged into Stage 6
   - `validated: false` -> finding is dropped; record the validator's reason in Coverage
   - Validator **infrastructure** failure (timeout, dispatch error, malformed JSON — not a `validated:false` verdict): for **P2/P3**, drop the finding with reason "validator failed" (conservative bias). For **P0/P1**, do **not** drop on infra failure — keep the finding and mark its validation **degraded** (note in Coverage). A transient validator failure must never silently remove a critical/high finding; a genuine `validated:false` rejection above still drops at any severity.
5. **Use mid-tier model for validators.** Same platform model class the mid-tier persona reviewers use; omit the override if the model name is unknown. Validators are read-only — same constraints as persona reviewers. They may use non-mutating inspection commands (Read, Grep, Glob, git blame, gh).
6. **Record metrics for Coverage.** Total dispatched, validated true count, validated false count (with reasons), infra failures (and any P0/P1 kept-on-failure as degraded), and over-budget drops.
7. **Prune triage groups after drops.** When validation dropped any finding, rebuild or prune `triage_groups` from the validated set: a group must never reference a `#` that was rejected or dropped. Remove groups left with fewer than two findings under `grouping:auto`; under `grouping:always`, keep them as single-finding groups only when still meaningful.

**Orchestrator direct verification.** When a finding hinges on a fact the orchestrator can check cheaply and authoritatively — a pinned dependency's source, a wiring/config fact in this repo, a build tag — verify it directly with single-purpose native tools (Read/Grep/Glob, one git command at a time), never chained or error-suppressed shell. Fold confirmed facts into synthesis. Whether it can *replace* the independent validator turns on a single distinction: the orchestrator is **not** an independent second opinion (it synthesized these findings), so direct verification catches a wrong **fact** but not the orchestrator's own **bias**. Independence adds nothing to a mechanically-checkable fact and everything to a judgment call:

- **P0/P1, any anchor:** the per-finding validator wave is **required**; direct verification only *complements* it, never replaces it.
- **P2/P3 at anchor 100, MECHANICAL only** — the finding is true by inspection of the code itself: a compile/type error, a definitive logic bug, or a standards violation with a quotable rule, where the quoted line *entails* the conclusion with no interpretation. Direct verification **may stand in for** the wave. **Shortcut:** confirm the finding's `first_evidence` line (1) actually exists at the cited `file:line` in the diff/cited file, AND (2) on its own substantiates the claim (the quote *is* the bug, not merely adjacent to it). When both hold, no validator subagent is needed. **A quote proves the line exists, not that the conclusion follows** — so this shortcut is barred for any finding whose truth depends on runtime behavior or cross-file reasoning even at anchor 100: security (SSRF/IDOR/authz), concurrency/races, perf, or anything touching auth/contracts. Those keep the independent validator regardless of anchor.
- **P2/P3 at anchor 75** (judgment call — "will affect users," not airtight): the independent wave is **required** — this is exactly where a fresh second opinion filters false positives, and the orchestrator cannot supply that for its own findings.

**Why per-finding bounded dispatch (not batched):** Independence is the point. A single batched validator looking at all findings together pattern-matches across them and recreates the persona-bias problem. Per-finding dispatch preserves fresh context while the scheduler respects harness limits.

### Stage 5c: Act on findings (explicit apply only)

**Skip entirely in `mode:agent`, `mutation_policy: report-only`, and every inline degraded dispatch fallback.** The caller owns apply in agent mode. Ordinary default review is also report-only. Enter this stage only when default mode has explicit `mutation_policy: apply-fixes` and full reviewed-tree scope is known.

Read `references/apply-findings.md` only after all three admission conditions pass: default mode, explicit `mutation_policy: apply-fixes`, and a non-degraded local reviewed-tree scope. Do not load that reference in `mode:agent`, report-only, remote-only, or inline fallback runs. The reference contains apply/verification/commit details but grants no authority by itself.

### Stage 5d: Structured targeted verification evidence

Only when a targeted verification command actually ran in this review may the review create command evidence. Persona findings, validator verdicts, cross-model agreement, quoted source lines, inferred test gaps, and a reviewer's natural-language “tests passed” statement are semantic review evidence, not command evidence; never serialize them as a passed check.

When no targeted command ran, do not call either helper. Set `coverage.verification_evidence` to `status: not-produced`, `run_summary_ref: null`, `closeout_verdict: not-run`, `reason_code: no-targeted-command-executed`, and include any relevant limitations. This is an honest absence of command evidence, not a failed review.

When one or more targeted commands actually ran—such as an orchestrator-owned mechanical fact check that executed a test/build command, or post-Stage-5c verification after explicitly authorized fixes—capture their real exit codes and bounded secret-stripped logs under `.spec-first/workflows/spec-code-review/<workspace-slug>/<run-id>/logs/`. Evidence writes are limited to repo-local workflow artifacts; they do not authorize source changes, apply, commit, push, PR, or ticket actions. If the invocation or target repo forbids artifact writes, keep the result in band and use a degraded `artifact-write-not-authorized` limitation instead of claiming a durable ref.

Record only those actual command outcomes:

```bash
spec-first internal verification-run-summary record \
  --workflow spec-code-review \
  --input <verification-run-summary-input.json> \
  --run-id <run-id> \
  --target-repo <repo-root> \
  --json
```

Then construct validation claims from `verification-run-summary:<check-id>` refs and validate them:

```bash
spec-first internal honest-closeout validate \
  --input <honest-closeout-claims.json> \
  --target-repo <repo-root> \
  --json
```

Do not cherry-pick a passing targeted check to hide another failed/not-run check in the same summary. Preserve `run_summary_ref`, `overall`, `overall_reason_code`, per-claim reasons, and limitations in `coverage.verification_evidence`. `spec-code-review` does not own or emit the durable spec-work run artifact; a `spec-work` caller may later materialize the review JSON/summary into its own run directory.

### Stage 5e: Enforce the report-only mutation gate

Before synthesis, every local `mode:agent`, report-only, and inline-fallback run must compare the current tree with the Stage 1a snapshot:

```bash
bash "$SKILL_DIR/scripts/run-python.sh" \
  "$SKILL_DIR/scripts/review-scope.py" \
  --verify-snapshot "$SCOPE_SNAPSHOT"
```

If the result is `mutation_detected: false`, continue and keep using the frozen scope facts. If it reports `reviewer_mutation_detected`, do not revert, hide, reinterpret, or validate the mutation as a successful fix. In `mode:agent`, return one raw failure JSON with `status: failed`, `reason_code: reviewer_mutation_detected`, `mutated_paths`, the frozen scope, and the already discovered findings when available. In default report-only mode, stop with the same reason and paths. A reviewer-caused mutation invalidates any test result obtained after the mutation and blocks completion claims.

If the snapshot cannot be read or rechecked, return a degraded/failed handoff with `mutation_guard_unavailable`; absence of the deterministic guard is never evidence that the tree stayed unchanged. Explicit default-mode Stage 5c apply runs are excluded because their mutation is separately admitted, scoped, and verified.

### Stage 6: Synthesize and present

Before completion, verify stable numbering, Actionable Findings, Coverage, Verdict, and the mode's artifacts: `report.md` by default, `review.json` in agent mode, and `metadata.json` in both. If writing fails, preserve the in-band result and mark `artifact_write_status: partial` or `unavailable`; do not claim written artifacts or a complete durable handoff. JSON fields must match actual file state.

Assemble the final report. **Default:** human-readable markdown. **`mode:agent`:** skip markdown and emit JSON (see ### JSON output format) — the structured fields are how a downstream agent consumes the review. Put `---` before the verdict in markdown mode.

**Before writing, load `references/review-output-template.md` and mirror its section skeleton** — that file is the canonical skeleton for *which sections appear and in what order*; its example shows one good rendering, not the only permitted layout. The direction below remains authoritative within this stage if the template was not reloaded.

**Presentation direction — optimize for the reader's next action (goal + considerations, not a fixed layout).** The report is *acted on*: by a human deciding what to fix and whether to merge, or by a downstream agent applying fixes. Shape it so that action is fast and well-founded.

- **Per finding, make four things unambiguous** (in whatever layout reads clearest): *what & where* — one scannable line, the symptom + `file:line`, not the mechanism; *why it matters* — what breaks or who's hit, never a restatement of the code; *what response it needs* — this varies by finding type: a bug states its fix, a **design call** presents the options and the tradeoff without forcing one answer, a coverage gap names the test and precedent to mirror, a residual risk is marked informational, an already-applied item gives what changed and how it was verified; *how sure* — confidence, and whether it was corroborated (cross-reviewer / cross-model agreement is the strongest signal — say so).
- **Let the shape serve the finding type; stay consistent within a section.** A terse table, a short keyed block, or a compact list are all fine — pick what reads clearest for that content. Consistency *within* a section matters; a single global shape does not.
- **Group by the unit of work or decision, not just severity.** Severity orders urgency; it does not tell the actor what *kind* of action a finding needs. Surface the split: **decisions a human must make** (design calls, ambiguous semantics) vs **mechanical work that can just be done** (tests, dedup, concrete fixes) vs **informational** (residual risks) — an agent clears the mechanical work and must stop at decisions. Group findings sharing a root cause or one fix (the Triage Groups) and name the order/dependency ("decide X once -> resolves #1 and #7; do #1 first"); the unit of work is often a group, not a finding.
- **Detail is earned by enabling the next action, not by demonstrating thoroughness.** Cover *every* finding — completeness is non-negotiable — but say each in the least that lets the consumer act. **Do not paste file contents or re-print the diff**; it is already in the repo/PR — cite `file:line` and spend words only on what the diff can't show (why it breaks, the fix, the repro). This governs *expression, never coverage*: never drop a finding or its why/fix to be shorter, and match weight to weight (a nit is one line; a P1 design call earns room).
- **The bottom is the most-read screen — make the closing self-sufficient.** In long output the reader's viewport lands at the end, so the **Verdict and Actionable list must stand alone without scrolling**: the verdict plus the single most important thing to do, then the prioritized actionable list where each item already carries severity, `file:line`, the terse what, and its response-type. The itemized findings above are drill-down evidence, referenced by stable `#`.

**Hard constraints (non-negotiable; everything above is judgment):**
- **ASCII-safe only — no box-drawing or per-item horizontal-rule separators (`────`, `———`), no Unicode arrows or middot (`·`); use `->`.** These break across terminals and violate repo convention. (The single report-level `---` before the verdict is fine.)
- **Stable `#` numbering from Stage 5** — never re-derive per section; reuse the same `#` everywhere a finding appears. A multi-file applied fix is one row with one `#`, never duplicated.
- **If you use a markdown table, escape literal `|` in cells as `\|`** so a pipe inside a title/regex/cache-key example doesn't split the row.
- **The Verdict and Actionable list are present, last, and self-sufficient.** This is satisfied by the closing, not the section skeleton: the Verdict is the final report section, immediately followed by the post-report prioritized Actionable recap (default mode — see *Emit actionable findings summary* below). The in-report `Actionable Findings` section keeps its skeleton position (5) as the detailed table; the recap is the self-sufficient last word the reader sees without scrolling. (If for some layout you cannot emit the recap, move the Actionable list itself to just after the Verdict.)

1. **Header.** Scope, intent, mode, resolved `mutation_policy`, commit authorization/status when applicable, scenario/dispatch limitations, and reviewer team with per-conditional justifications.
2. **Applied (explicit apply only).** When Stage 5c ran under `mutation_policy: apply-fixes`, list applied fixes first — before the findings — with `#`, file, fix, reviewer, validation outcome, and commit authorization/status. Omit this section in `mode:agent`, report-only/default reviews, degraded inline fallbacks, and when nothing was applied. Applied findings appear here, not in the severity tables.
2b. **Triage Groups.** When finalized `triage_groups` exist (post-validation, post-apply — Stage 5b step 7 / Stage 5c), render a `### Triage Groups` section before the findings as a compact table (`| Group | Findings | Context | Preferred Resolution | Why |`) — a table fits this content well. The `Findings` cell lists the stable `#`s it covers; the resolution names the order/dependency. **Mark whether each group is an apply-queue or a decision-gate** (so an automated fixer applies the mechanical groups and stops at the design calls). Every referenced `#` must appear in the findings below; groups supplement the findings, never replace them. Omit the section when `grouping:off` is active or no groups survived. In `mode:agent` this section is carried by the `triage_groups` JSON field instead.
3. **Findings.** Grouped by severity (`### P0 -- Critical`, `### P1 -- High`, `### P2 -- Moderate`, `### P3 -- Low`), rendered per the per-finding direction above and consistent within the section. Surface the decision-vs-mechanical split where it helps the actor (flag the design calls). Omit empty severity levels. Finding numbers come from the stable assignment in Stage 5 -- never re-derive them per severity section or triage group.
4. **Requirements Completeness.** Include only when a plan was found in Stage 2b. Outside task mode, for each requirement (R1, R2, etc.) and implementation unit in the plan, report whether corresponding work appears in the diff. In task mode, report only the selected Task Card's source refs and label the section `selected-task`; never create missing-work findings for unrelated plan units. Use a simple checklist: met / not addressed / partially addressed. Routing depends on `plan_source`:
   - **`explicit`** (caller-provided or PR body): Flag unaddressed requirements or implementation units as P1 findings with `autofix_class: manual`, `owner: downstream-resolver`. These enter the actionable queue.
   - **`inferred`** (auto-discovered): Flag unaddressed requirements or implementation units as P3 findings with `autofix_class: advisory`, `owner: human`. These stay in the report only — no autonomous follow-up. An inferred plan match is a hint, not a contract.
   Omit this section entirely when no plan was found — do not mention the absence of a plan.
5. **Actionable Findings.** Include when the actionable queue is non-empty — findings the caller should address (`gated_auto` / `manual` with `downstream-resolver`), plus anything Stage 5c chose not to apply. In default mode, findings already applied appear in the Applied section, not here.
6. **Pre-existing.** Separate section, does not count toward verdict.
7. **Learnings & Past Solutions.** Surface `learnings-researcher` local-prompt results: if past solutions are relevant, flag them as "Known Pattern" with links to docs/solutions/ files.
8. **Agent-Native Gaps.** Surface `agent-native-reviewer` local-prompt results. Omit section if no gaps found.
9. **Deployment Notes.** If the `deployment-verification-agent` local prompt ran, surface the key Go/No-Go items: blocking pre-deploy checks, the most important verification queries, rollback caveats, and monitoring focus areas. Keep the checklist actionable rather than dropping it into Coverage. Schema drift appears in the findings tables as `data-migration` P1 rows — do not add a separate Schema Drift section.
10. **Coverage.** Applied count (when Stage 5c ran), suppressed count by anchor (e.g., "N findings suppressed at anchor 50, M at anchor 25"), mode-aware demotion count, validator drop count and reasons (when Stage 5b ran), any P0/P1 with degraded validation (kept on validator infra failure), validator over-budget drops (when the 15-cap fired), residual risks, testing gaps, failed/timed-out reviewers, inferred-intent uncertainty, and the Stage 5d `verification_evidence` object when applicable. When the Stage 3c lite roster ran, state it and the reduced reviewer set (so the narrower coverage is visible). When the Stage 5b direct-verification shortcut skipped validators for anchor-100 findings, note how many were verified by quote rather than by an independent validator subagent. When the Stage 5 quote-the-line gate demoted any 75/100 finding for missing `first_evidence`, record that count. **Removable surface (only when deletion-oriented maintainability findings exist):** one line giving the approximate net lines/files those findings would remove if applied (e.g., "Removable surface: ~120 lines / 2 files across findings #4, #7"). This is a dead-weight signal, **not** a reduction target — never lower the bar for a finding or invent deletions to grow the number, and omit the line entirely when no finding proposes a deletion.
11. **Verdict.** Ready to merge / Ready with fixes / Not ready. Fix order if applicable. When an `explicit` plan has unaddressed requirements or implementation units in the active completeness scope, the verdict must reflect it — a full PR review that's code-clean but missing planned requirements is "Not ready" unless the omission is intentional. Task mode's active scope is only the selected Task Card; unrelated future/dependent units do not affect its verdict. When an `inferred` plan has unaddressed requirements or implementation units, note it in the verdict reasoning but do not block on it alone.

Do not include time estimates.

**Final check before delivering (default only).** Verify the hard constraints, not a layout: no box-drawing / per-item horizontal-rule separators (`────`), no Unicode arrows or middot (`·`) anywhere; stable `#`s consistent across sections; literal `|` escaped (`\|`) in any table cell; and **the closing stands alone** — a reader seeing only the last screen gets the verdict and the prioritized actionable list, each item carrying its severity, `file:line`, terse what, and response-type. Re-render anything that fails. Skip when `mode:agent` is active.

### JSON output format (`mode:agent` only)

Emit **one raw JSON object** as the primary response — a single bare JSON value, **no markdown code fence**. A leading ```` ```json ```` fence makes the response start with backticks and breaks naive `JSON.parse` consumers, so never wrap it. When `REVIEW_ARTIFACT_DIR` is available, also write the same payload to `{review_artifact_dir}/review.json`.

`mode:agent` does not apply fixes — the caller does — so there is no `applied_fixes` field; the handoff is `actionable_findings`. Applied work surfaces only in the default-mode markdown Applied section (Stage 5c/6).

Minimum shape:

```json
{
  "status": "complete",
  "verdict": "Ready to merge | Ready with fixes | Not ready",
  "mutation_policy": "report-only | apply-fixes",
  "commit_authorization": "authorized | missing",
  "scope": {
    "base": "<merge-base sha, pr:NNN marker, or base: ref>",
    "branch": "<current branch name>",
    "head_sha": "<git rev-parse HEAD>",
    "pr_url": "<url or null>",
    "files_changed": 0
  },
  "intent": "<2-3 line summary>",
  "intent_confidence": "explicit | inferred | uncertain",
  "reviewers": ["correctness", "security"],
  "findings": [],
  "actionable_findings": [],
  "triage_groups": [],
  "pre_existing_findings": [],
  "requirements_completeness": null,
  "learnings": [],
  "agent_native_gaps": [],
  "deployment_notes": [],
  "residual_risks": [],
  "testing_gaps": [],
  "coverage": {
    "task_scope": null,
    "dispatch_reason_code": null,
    "scenario_capability": "full | bounded | partial | fallback-only | blocked-action-required",
    "verification_evidence": {
      "status": "recorded | not-produced | degraded",
      "run_summary_ref": "<repo-relative ref or null>",
      "closeout_verdict": "verified | degraded | unsupported | not-run",
      "reason_code": "<structured reason code>",
      "checks": [],
      "limitations": []
    }
  },
  "artifact_path": "<absolute path or null>",
  "artifact_write_status": "written | unavailable | partial",
  "run_id": "<run-id>"
}
```

When task context is active, `coverage.task_scope` is an object with `task_id`, `task_pack`, `expected_task_pack_digest`, `observed_task_pack_digest`, `source_plan`, `source_plan_section_titles`, `plan_context_mode`, `work_run_base`, `declared_files`, `task_delta_files`, `task_owned_untracked_files`, `pre_task_dirty_files`, `pre_task_untracked_files`, `pre_task_overlap`, `review_focus`, per-file isolation, aggregate `task_diff_isolation`, `required_gate_eligible`, and `limitations`. Outside task mode it remains `null`.

`coverage.verification_evidence` is always present in `mode:agent`. It reports a repo-relative `run_summary_ref` and `closeout_verdict` only when Stage 5d recorded commands this review actually executed. Pure review judgment uses `status: not-produced` with `reason_code: no-targeted-command-executed`; never turn persona/validator coverage into a fake check.

Each object in `findings` uses the merged finding fields: `#`, `title`, `severity`, `file`, `line`, `confidence`, `autofix_class`, `owner`, `requires_verification`, `pre_existing`, `suggested_fix`, `first_evidence`, `why_it_matters`, `evidence`, `reviewers`.

`actionable_findings` lists the `gated_auto` / `manual` + `downstream-resolver` subset with the same fields plus stable `#`.

Each object in `triage_groups` carries `{ "title", "findings": [<stable #s>], "context", "preferred_resolution", "why" }` — the finalized groups from Stage 5 step 9b after Stage 5b pruning. Every referenced `#` must exist in `findings` (the full set) — **not** necessarily in `actionable_findings`. Groups are a triage **lens over all findings, not an apply queue**: a group (and its `preferred_resolution` ordering) can reference advisory or `human`/`release`-owned findings that the caller must not apply. So a caller batching related fixes by theme must first intersect each group's `findings` with `actionable_findings` and act only on that subset — the apply handoff stays `actionable_findings`, never `triage_groups`. Empty array when `grouping:off` is active or no groups were built.

On failure before review completes, set `"status": "failed"` and `"reason": "<one sentence>"`. When all reviewers fail, use `"status": "degraded"` with a reason. When a PR skip rule fires (closed/merged/trivial), use `"status": "skipped"` with the skip reason. Do not emit markdown tables when `mode:agent` is active.

## Quality Gates

Before delivering the review, verify:

1. **Every finding is actionable.** Re-read each finding. If it says "consider", "might want to", or "could be improved" without a concrete fix, rewrite it with a specific action. Vague findings waste engineering time.
2. **No false positives from skimming.** For each finding, verify the surrounding code was actually read. Check that the "bug" isn't handled elsewhere in the same function, that the "unused import" isn't used in a type annotation, that the "missing null check" isn't guarded by the caller.
3. **Severity is calibrated.** A style nit is never P0. A SQL injection is never P3. Re-check every severity assignment.
4. **Line numbers are accurate.** Verify each cited line number against the file content. A finding pointing to the wrong line is worse than no finding.
5. **Protected artifacts are respected.** Discard any findings that recommend deleting or gitignoring files in `docs/brainstorms/`, `docs/plans/`, or `docs/solutions/`.
6. **Findings don't duplicate linter output.** Don't flag things the project's linter/formatter would catch (missing semicolons, wrong indentation). Focus on semantic issues.

## Protected Artifacts

The following paths are spec-first pipeline artifacts and must never be flagged for deletion, removal, or gitignore by any reviewer:

- `docs/brainstorms/*` -- legacy requirements documents created by older spec-brainstorm versions
- `docs/plans/*.{md,html}` -- unified plan artifacts created by spec-brainstorm or spec-plan (decision artifacts; execution progress is derived from git, not stored in plan bodies)
- `docs/solutions/*.md` -- solution documents created during the pipeline

If a reviewer flags any file in these directories for cleanup or removal, discard that finding during synthesis.

## After Review

After Stage 6, stop. Never push, open PRs, or file tickets from this skill. Ordinary default review and every `mode:agent` run mutate nothing. Only explicit `mutation_policy: apply-fixes` may have changed the checkout, and only separate commit authorization may have created a commit. Callers use the report/artifact to apply fixes, record residuals, or perform separately authorized landing work.

### Emit actionable findings summary (default mode only)

After Stage 6 **in default mode**, emit a compact **Actionable Findings** summary for callers:

- List each actionable finding (`gated_auto` or `manual` with `downstream-resolver`) with stable `#`, severity, file:line, title, `autofix_class`, whether `suggested_fix` is present, and `confidence`.
- Include the returned `artifact_path` when one was written; when null, state the artifact limitation and keep the in-band summary complete.
- When the actionable queue is empty, state `Actionable findings: none.` explicitly.

In `mode:agent` do **not** emit this markdown summary — the actionable findings are carried solely by the `actionable_findings` field of the JSON object. Emit nothing after the JSON object, so the response stays a single parseable JSON value.

Do not run post-review triage (no per-finding walk-through, bulk ticket filing, or routing questions). The report and summary are the complete handoff.

### Mode-specific completion

| Mode | After Stage 6 + actionable summary |
|------|-----------------------------------|
| **Default** | Markdown tables + Actionable Findings summary. |
| **`mode:agent`** | JSON object + `review.json` in run artifact dir. |

Do not offer push/PR/create-branch next steps from this skill.

#### Run artifacts

When `REVIEW_ARTIFACT_DIR` is available, write run artifacts under that exact returned `artifact_path`:

- synthesized findings
- actionable findings list
- advisory outputs
- per-agent `{reviewer_name}.json` from Stage 4
- `report.md` — the rendered markdown report exactly as presented to the user (default mode only), so format and numbering stay auditable after the run

`metadata.json` minimum fields:

```json
{
  "run_id": "<run-id>",
  "branch": "<git branch --show-current at dispatch time>",
  "head_sha": "<git rev-parse HEAD at dispatch time>",
  "verdict": "<Ready to merge | Ready with fixes | Not ready>",
  "completed_at": "<ISO 8601 UTC timestamp>"
}
```

Capture `branch` and `head_sha` at dispatch time as the reviewed snapshot. If explicit Stage 5c fixes later change `HEAD` or the tree, record the post-apply state separately; do not rewrite the reviewed snapshot.
