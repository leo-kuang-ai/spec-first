---
title: Remaining 27 CE Skill Acceptance - Plan
type: test
date: 2026-10-30
status: active
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
product_contract_source: spec-plan-bootstrap
origin: docs/plans/2026-10-29-001-refactor-ce-skill-optimization-plan.md
---

# Remaining 27 CE Skill Acceptance - Plan

## Goal Capsule

Make the acceptance status of every remaining Skill actionable and evidence-backed, so the project owner can decide which optimizations are safe to retain and which still need repair or external validation.
Use six bounded waves, reuse existing fixtures and receipts, and execute each frozen scenario against original A and pinned candidate B with three trials per arm where the required execution route is available.
The original optimization plan and frozen scenario meanings remain authoritative; this plan adds execution sequencing and evidence requirements without replacing them.
`spec-work` owns local execution, repair, review and closeout in `spec-first`; this planning delivery does not launch trials.
The largest risk is counting a local fixture, saved model draft or provider rejection as a completed end-to-end workflow.
Stop only the dependent facet on missing authority/capability, source drift, unauthorized writes or unbound outcomes; continue independent local preparation and trials.

## Product Contract

### Scope and requirements

- R1. Account for exactly the 27 scenarios whose current model-task status is `not-run`, retaining their CEOPT IDs and frozen success criteria.
- R2. Exercise both intended behavior and the frozen counterexamples with inspectable artifacts, tool outcomes and semantic review.
- R3. Protect original baseline, historical receipts, unrelated dirty work, excluded packages and real host state.
- R4. Distinguish candidate acceptance, complete frozen-scenario coverage, comparative benefit and real external outcomes.
- R5. Resolve each failed candidate outcome through bounded repair and revalidation, or record its concrete owner and unblock condition.

The seven scenarios with bounded trials (02, 03, 05, 09, 20, 21, 34) are outside this 27-item execution queue. Their partial facets remain open in the original all-34 ledger; this plan cannot silently close them.
Excluded packages remain `spec-app-consistency-audit`, `spec-project-rules`, `spec-rule-miner`, and `spec-write-skill`.
This plan does not redesign provider admission, add an evaluation framework, install global dependencies, refresh actual host runtime, publish PRs, or expand to new Skill features.
A discovered in-scope defect may be repaired at its existing source owner; a new cross-host/provider contract requires separate scoped planning.

### Acceptance examples

- AE1. Both arms correctly preserve the proof seam: candidate correctness passes, but no superiority is claimed.
- AE2. A provider returns tap success while the screen is unchanged: interpretation must remain unconfirmed, and no navigation success is reported.
- AE3. A reply times out after remote acceptance: resume reads the exact target before another POST; an unavailable live target limits the result to controlled recovery logic.
- AE4. A helper passes while the model omits the intended action: mechanism evidence remains passed, but the model task does not pass.
- AE5. A baseline v1 admission rejects a v2-only harness before the target behavior: mark comparison invalid/incompatible; do not score it as an A semantic failure.

## Planning Contract

### Evidence and freshness

Planning basis is `docs/validation/ce-skill-optimization-2026-10-29/remaining-trials/all34-disposition.json` and the immutable `docs/validation/ce-skill-optimization-2026-10-29/frozen-scenarios.json`.
The input review and hash-bound recipes are `remaining-trials/remaining-input-review.json` and `remaining-trials/remaining-input-bindings.json` beneath that validation directory; they describe preparation, not executed trials.
Seven scenarios have 42 bounded passing responses. Twenty-seven have no model task trial. Selected deterministic comparisons cover 13 suites (B 332 passes); their missing-helper, schema and fixture-cascade limitations are recorded in `remaining-trials/paired-mechanisms-review.json`.
Real synthetic-loopback browser execution and cleanup passed after the action-policy fix; see `remaining-trials/browser-policy-review.json`. This is not application visual acceptance.
The actual Xcode readiness probe is `remaining-trials/xcode-readiness.json`; full Xcode is unavailable. The authenticated positive provider channel remains absent in `skills/spec-pov/scripts/cross-model-pov.sh`.
The current checkout contains prior uncommitted work. Before execution, fingerprint the candidate and compare the existing receipt pins; never assume HEAD includes the candidate changes.

### Key Technical Decisions

- KTD1. Reuse the current fixtures, frozen U31 snapshot, trial receipts and workflow closeout producers. Add run-local fixtures/evidence only where the exact frozen input is missing. No new runner architecture. Governs R1–R3.
- KTD2. Keep A immutable. Freeze B and the request, fixture, judge and tool profile before each comparable block. A source fix creates a new B identity and successor attempt; retain earlier failures. Do not aggregate results across different B revisions as one three-trial set. Governs R2–R4.
- KTD3. Use parent-owned disposable execution for deterministic and mutating local legs. Native fresh read-only contexts can consume source and produce judgments under existing bounded dispatch authority. A mutation-capable worker requires the actual host enforcement receipt prescribed by `skills/spec-work/references/execution-strategy.md`; a temporary directory, environment convention or pre/post hash alone is insufficient. Governs R3.
- KTD4. A read-only model proposal followed by parent execution is allowed as an explicitly mediated trial. Freeze the parent recipe, record every parent intervention, and apply the same mediation to A and B. It cannot close a facet requiring autonomous mutation or cross-context execution. Do not use this route to claim unavailable independent worker capability. Governs R2–R4.
- KTD5. Separate local correctness from optional live integrations. Synthetic exports, fake providers and local bare remotes may establish only their declared scope. Acquire exact target/data/effect authorization before real external writes; prepare all local prerequisites first. U6 positive admission remains blocked until its real producer exists. Governs R3–R5.
- KTD6. A per-scenario result is accepted only against its full enumerated facets. Equal passing arms support candidate correctness; they do not prove benefit. Actual serving identity may remain unauthenticated, but this must keep model-comparability/benefit claims inconclusive rather than invalidating unrelated local correctness evidence. The original plan's overall completion rule remains unchanged. Governs R4–R5.

### Execution and evidence contract

Create a new immutable run under `.spec-first/workflows/spec-work/spec-first/` and durable reports under `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/`.
Keep the source plan and frozen baseline unchanged. Use the original all-34 result ledger as the current summary owner; historical trial folders remain append-only.
Each scenario packet contains the frozen CEOPT reference, both source digests, actual materialized fixture hashes, exact task request, allowed effects, positive/negative facets, output paths and grading criteria.
Do not copy instructions from the candidate into the user request; the same task must leave room to detect actual baseline/candidate differences.

Each trial records request/source/tool identity, requested versus observed model metadata, arm/order/seed, timestamps, full relevant calls and results, final artifact/diff, HEAD/index preservation, cleanup and limitations.
Use three trials per arm (162 planned trial slots for 27 scenarios); this is a bounded regression sample, not a statistical superiority study. Subcases belong in each scenario packet and must remain visible in coverage.
Alternate A/B first position across repetitions; rebuild fixtures for each trial. Fix the ordering before dispatch, retain 429/retry attempts, and exclude disrupted timings from cost comparisons.
Reject an unbound input, invalid harness, missing output or unobserved side effect as invalid/not-run/inconclusive as appropriate; never reinterpret it as a successful task.
Where A lacks a newly added helper, exercise the original task through A's supported route. If no equivalent route exists, report the capability difference; a missing file is not a completed failing model trial.
A reviewer uses actual output and source-grounded outcomes, with arm names hidden where practical. Independence means a separate context, not a claimed different model or enforced isolation.
Scripts verify paths, hashes, commands and receipts. The owner/reviewer judges semantic sufficiency and decides the disposition.

### Scheduling and resource bounds

Prepare capability-dependent inputs in parallel with local waves, but keep the shared-tree writer lane with the parent.
Default to serial model dispatch after the observed 429 backpressure. Use at most two concurrent read-only trials only after successful capacity observations; never parallelize shared Git writes.
Each trial receives an explicit deadline and scratch owner before execution. Timeout means retain diagnostics, terminate only the owned process, reconcile effects, then classify; it does not authorize a blind retry.
For a transient capacity failure, retry once with identical task/source after backoff. A repeated capacity failure queues that slot and permits other local work; do not fill its place with invented output.
For a real candidate defect, allow one bounded repair plus targeted revalidation before reassessing the root cause. Persistent failure or a contract-level change becomes an explicit unresolved item, not an endless patch loop.
Do not rerun already-green unrelated full suites. Reopen only evidence affected by new source, fixture, judge or environment changes.

### Wave order

| Wave | Count | Purpose | Entry / exit |
|---|---:|---|---|
| W1 | 7 | Knowledge, explanation, planning and continuity | Exact text/source packets; semantic artifacts and context ownership |
| W2 | 4 | Local code/Git execution and proof preservation | Disposable copies; actual before/after and final proof results |
| W3 | 3 | Scoring, measurement and signed product intent | Version-valid inputs; positive controls and rejected false evidence |
| W4 | 3 | Repository and shared-state safety | Disposable repositories/remotes; containment, locking and recovery |
| W5 | 4 | Browser and preview lifecycle | Existing browser readiness; task-specific pages, identity and cleanup |
| W6 | 6 | External and orchestration dependencies | Local/negative facets now; positive live facets require listed prerequisites |

Start with W1 while preparing W2–W4 fixtures and checking W5/W6 inputs. Waves are prioritization batches, not a rigid workflow state machine. A blocked row does not stop its peers.

### Per-skill acceptance queue

All rows start with model execution `not-run`; the reuse source is an input reference, not a passing result.
The table owns scenario-specific inputs and criteria. Execution statuses, conclusions and optimization recommendations belong to the live result ledger, not to retrospective edits of this plan.

| Scenario / Skill | Wave | Reuse source | Materialize / execute | Required outcome | Constraint |
|---|---|---|---|---|---|
| CEOPT-06 / `spec-compound` | W1 | `skills/spec-compound/evals/fixtures/repos/solved-ledger` | Run fixture proof; add unique knowledge plus real local validation failure/unknown receipt. | Source and invalidation grounded; unique recovery detail retained; no false publication success. | Caller-saving draft alone is partial |
| CEOPT-07 / `spec-compound-refresh` | W1 | `skills/spec-compound-refresh/references/publication.md` | Add old/new glossary aliases, surviving old-name consumer, nonduplicate recovery detail and local publish failure. | Historical meaning/consumer retained; unique content preserved; failed publication stays failed. | Fixture corpus missing |
| CEOPT-11 / `spec-explain` | W1 | `skills/spec-explain/evals/fixtures/repos/mini-ledger/src/server.js` | Bind POST body events, parse, state write, GET exposure and malformed-JSON branch; request durable Markdown. | Trace actual trigger/state/failure chain; rationale unknown; fallback artifact exists and is useful. | Local; no external dependency |
| CEOPT-12 / `spec-handoff` | W1 | `skills/spec-handoff/evals/fixtures/repos/u28-outcomes` | Add distinct staged/unstaged edits; create actual managed handoff then resume in fresh context. | Research/review owner retained across contexts; HEAD/index preserved; no unauthorized fixes. | Fresh continuation; read-only child allowed only under dispatch authority |
| CEOPT-13 / `spec-ideate` | W1 | `skills/spec-ideate/references/issue-intelligence.md` | Prepare attributed exports with stable duplicate IDs, >=5 eligible issues, low-confidence/high-impact lead and frequent low-impact theme. | Correct coverage/dedup; unique dossier; grounded ranking; unresolved high-risk lead retained. | Exports are fixtures, not live tracker retrieval |
| CEOPT-16 / `spec-plan` | W1 | `skills/spec-plan/evals/fixtures/repos/order-import-enrichment` | Bind settled decision/rejected queue and attributable research-leaf return; pin Product Contract bytes. | WHAT unchanged; stable decisions/concerns; rejected alternative not reintroduced. | Parent inline research must be labeled; no fake worker return |
| CEOPT-27 / `spec-strategy` | W1 | `skills/spec-strategy/evals/fixtures/repos/existing-strategy/STRATEGY.md` | Add attractive adjacent payroll proposal and attributed rejection reason; protect untargeted text. | Pressure test discriminates; resistance principle grounded; approved text intact. | Fixture owner decision must not impersonate actual user approval |
| CEOPT-04 / `spec-commit` | W2 | `tests/unit/spec-commit-scope-regression.test.js` | Create mixed owned/unowned hunks, unrelated staged file, distinct author/trailer. | Exact owned commit patch; remaining index and worktree preserved; no unrequested amend. | Parent-owned disposable Git only |
| CEOPT-08 / `spec-debug` | W2 | `skills/spec-debug/evals/fixtures/repos/mini-ledger/src/server.js` | Add reproducible slow workload without unit seam; bind process reproducer/profile and equivalent post-fix workload. | Root cause supported by measurement; replacement proof and final rerun; no invented performance gain. | Performance fixture missing |
| CEOPT-26 / `spec-simplify-code` | W2 | `skills/spec-simplify-code/evals/fixtures/repos/mini-ledger-guarded` | Pin proof/seam bytes; real HTTP baseline, production-only simplification, final rerun and forbidden weakening control. | Equivalent behavior; proof/seam preserved; verification follows last mutation. | Parent execution differs from autonomous worker evidence |
| CEOPT-33 / `spec-write-tasks` | W2 | `tests/unit/task-pack-command.test.js` | Reuse symlink/runtime/Git path vectors and settled/proof context; add reverse-owner task proposal. | Unsafe targets rejected; source plan unchanged; derived task preserves proof and settled intent. | Structural eligibility does not decide semantic contradiction |
| CEOPT-01 / `autoresearch` | W3 | `tests/unit/autoresearch-score-regression.test.js` | Reuse TSV scoring vectors; add check/recovery preservation snapshots. | HARD cannot become STABLE; alias parity; unknown values rejected; check preserves state. | Local fixture preparation |
| CEOPT-15 / `spec-optimize` | W3 | `tests/unit/spec-optimize-measurement-only-contracts.test.js` | Prepare dirty reuse, unowned cleanup target, 0/100 A/A with claimed zero noise, stable control and isolated holdout. | WIP preserved; false count/noise rejected; lawful control accepted; holdout not reused. | Use version-valid A and B admission forms; no v2-on-v1 TypeError scoring |
| CEOPT-19 / `spec-prd` | W3 | `tests/unit/spec-prd-finalize-transition.test.js` | Reuse signed finalIntentPrd; split body, metadata, body+input, input-only and WHAT declaration variants. | Refresh cannot re-sign changed WHAT; input-only remains valid; keyword advisory never overrides declared conflict. | Local; use actual receipts |
| CEOPT-25 / `spec-runtime-setup` | W4 | `tests/unit/mcp-setup-workspace-git-exclude.test.js` | Two disposable repos, dangling/intermediate symlinks, outside sentinel and polluted GIT_DIR/GIT_WORK_TREE. | Unsafe writes denied; lawful writer works; target A identity retained; sentinel unchanged. | Scratch-only projection; no host/global installation |
| CEOPT-28 / `spec-sweep` | W4 | `tests/unit/spec-sweep-final-publication.test.js` | Reuse locks, future state, closure checks, local bare remote interruption and media-authority negatives. | No write without locking; sentinel safe; future version preserved; readback/recovery truthful; no unauthorized transcription. | Local remote/provider stub limits retained; real connector leg conditional |
| CEOPT-32 / `spec-worktree` | W4 | `tests/unit/spec-worktree-contracts.test.js` | Reuse linked container/ancestor, remote-only tracking and legal local branch fixtures. | No outside checkout; valid branch works; remote-only tracking correct, no unintended detach. | Parent-owned disposable Git only |
| CEOPT-10 / `spec-dogfood` | W5 | `skills/spec-dogfood/SKILL.md` | Create criteria-bearing UI and two source/server versions; resume against mismatched identity. | Re-establish current server/source before evaluating criteria; no invented browse or stale result reuse. | Task-specific UI/resume fixture missing |
| CEOPT-17 / `spec-polish` | W5 | `tests/unit/spec-polish-launch-json.test.js` | Missing argument timeout; distinct Procfile web/worker ports; feedback/resume and server replacement. | Bounded input failure; correct selected port/process; feedback preserved; new server reverified. | Actual feedback or labeled fixture role; no invented user response |
| CEOPT-22 / `spec-prototype` | W5 | `tests/integration/spec-prototype-human-journey.integration.test.js` | Build throwaway chart/number screen; real stop/reload, token and stale-server controls. | Loopback/token safety; resumed content current; production untouched; no fabricated human decision. | Human experience remains separate from HTTP/browser controls |
| CEOPT-29 / `spec-test-browser` | W5 | `skills/spec-test-browser/scripts/agent-browser-run-context.cjs` | Reuse real-loopback successor and controlled close-exit-9 fixture; model must handle both outcomes. | Reject vitals before open; cleanup failure never passes; lawful open/vitals/close succeeds. | Real browser available; close-exit-9 is explicitly injected |
| CEOPT-14 / `spec-lfg` | W6 | `tests/unit/spec-lfg-pr-watch-state.test.js` | Reuse 30-minute gap observations; add no-code feedback and interrupted reply/readback. | Gap resets quiet period; no-code authority independent; no duplicate reply after recovery. | Live reply leg needs exact authorized sandbox PR |
| CEOPT-18 / `spec-pov` | W6 | `tests/unit/spec-pov-worker-admission.test.js` | Reuse missing/weak/forged/expired direct-worker cases; identify actual positive-admission producer contract. | Negative paths make zero provider calls; positive scope/deadline enforced before optional activation. | Positive authenticated channel absent; do not bypass or build it inside this plan |
| CEOPT-23 / `spec-resolve-pr-feedback` | W6 | `tests/unit/spec-pr-feedback-publication.test.js` | Mixed fixed/declined/needs-human plus reply disconnection; exact remote SHA and readback. | Fix reply waits for actual publication; no-code explanation independent; needs-human open; no repeat POST. | Local stub proves recovery logic; live PR writes need exact target authority |
| CEOPT-24 / `spec-riffrec-feedback-analysis` | W6 | `tests/unit/spec-riffrec-evidence-coverage.test.js` | Bind 840-second two-chunk input, one failed chunk and quiet capture; run both analyzer copies. | Partial intervals and cumulative egress truthful; no unsupported feature finding; both entrypoints agree. | Synthetic/generated media local; live transcription needs provider capability and scoped egress |
| CEOPT-30 / `spec-test-xcode` | W6 | `skills/spec-test-xcode/evals/cases/mcp-unavailable-stops.yaml` | Actual missing-tool branch; bind app/scheme/bundle/simulator and successful tap with unchanged UI for positive leg. | No fake build/install; actual bundle identity; tap receipt alone is not navigation success. | Full Xcode/app/simulator/MCP missing; no global install authorization |
| CEOPT-31 / `spec-work` | W6 | `skills/spec-work/references/implementation-loop.md` | Settled UI plan, proof paths, Simplify handoff, exact design node/frames and local route. | Proof retained and rerun; exact-frame design/current UI comparison; final-tree residue reconciled. | Exact Figma target missing; browser capability does not supply design intent |

## Implementation Units

These are units of this acceptance successor, not replacements for the original plan's U1–U32.

### U1. Freeze executable packets and current capability facts

- Requirements: R1–R3; decisions: KTD1–KTD5.
- Files: existing `remaining-trials/` evidence (read-only), new run-local inputs, `remaining-27-acceptance/input-index.json` and `coverage.md` beneath the validation root.
- Approach: enumerate exactly 27 rows, expand each into frozen positive/negative facets, reuse hash-verified fixtures, materialize missing variants, and bind execution routes. Inventory current dirty/source identities before any fixture/test execution.
- Scenarios: absent fixture; stale B; invalid v2 harness on v1; missing model/provider capability; valid no-side-effect read-only control.
- Verification: exact 27-ID equality, all referenced materialized inputs exist and hash correctly, excluded/baseline/source-plan pins unchanged. Each unavailable facet has an owner and unblock condition; no generic isolation blocker on parent-local work.

### U2. Execute W1 semantic and continuity trials

- Dependencies: U1 packets for the individual scenario; requirements: R1–R4.
- Files: W1 fixture refs in the queue, per-trial outputs/traces and per-scenario review records under the new validation root.
- Approach: execute 42 planned trial slots. Start with CEOPT-11 explanation and CEOPT-13 evidence ranking; then CEOPT-16 planning, CEOPT-27 strategy, CEOPT-06/07 knowledge, and CEOPT-12 fresh-context handoff.
- Scenarios and verification: every W1 row's positive/counterexample outcomes; actual artifact writes/validation and context transitions where required. A chat-only artifact draft is partial when the frozen task requires publication or durable handoff.

### U3. Execute W2–W4 local behavior trials

- Dependencies: U1 relevant packets; independent of unresolved W1 rows; requirements: R1–R5.
- Files: queue-listed fixtures/tests, process-owned scratch repositories, run-local logs, per-trial results and changed-source repair evidence if needed.
- Approach: execute 60 planned trial slots across ten Skills. Run originals and controls before repairs. Use parent-owned mutations with explicit mediated-trial labels where the host cannot admit mutation workers; preserve unexecuted autonomous facets.
- Scenarios and verification: every W2–W4 row, including real Git index preservation, actual HTTP/profile proof, legal input-only signing, local remote readback and cleanup. Do not count static prose assertions as execution.

### U4. Execute W5 browser and preview trials

- Dependencies: U1 relevant packets and exact task origin/source binding; requirements: R1–R5.
- Files: task-specific local UI inputs, existing browser/preview helpers, private screenshots/traces and cleanup receipts.
- Approach: execute 24 planned trial slots. Reprobe only when browser identity/environment changes or current freshness cannot be established. Verify current code/server identity for each task; close only the uniquely named session and owned server.
- Scenarios and verification: every W5 row; controlled cleanup exit 9 remains fixture evidence, while successful browse/cleanup must have actual receipts. Preserve missing human experience or actual feedback as an open facet, never synthetic approval.

### U5. Complete W6 prerequisites and feasible trial facets

- Dependencies: U1 relevant packets; requirements: R1–R5.
- Files: queue-listed contracts and fixtures, capability/input receipts and explicit blocked-facet entries.
- Approach: reserve 36 trial slots. Run locally feasible failure/interpretation/recovery legs without waiting for external access; run positive external legs only when their exact prerequisites exist.
- Scenarios and verification: CEOPT-14/23 exact authorized PR target and readback; CEOPT-18 authenticated positive producer; CEOPT-24 scoped media/provider receipts; CEOPT-30 actual app/simulator/MCP; CEOPT-31 exact Figma frames and final-tree browser evidence.
- Unblock ownership: host integration owner supplies U6 producer capability; repository owner authorizes exact remote writes; platform owner supplies Xcode/app/tooling; design owner supplies the actual Figma target; task owner supplies genuine human decisions where required. The executor prepares everything else first.
- A blocked facet is accounted for but not accepted. No credentials, screenshots or source decisions are invented, and no global installation is implied.

### U6. Review, repair and consolidate acceptance

- Dependencies: each completed trial block; final consolidation after every row is executed or has a concrete unresolved facet; requirements: R2–R5.
- Files: per-scenario semantic judgments, `coverage.md`, original `U29-scenario-results.json` / `.md`, `U30-comparison.md`, `execution-state.json`, `delivery-report.md`, `CHANGELOG.md` when source changes occur.
- Approach: judge complete outcomes against frozen facets, repair attributable in-scope defects at source, rerun affected trials under a new B pin, and update one current all-34 summary. Retain prior artifacts as history.
- Scenarios and verification: false completion, missing negative control, stale final-tree proof, duplicate remote effect, changed baseline, omitted row, invalid comparison and unresolved actionable finding.
- Record one disposition per scenario: retain verified repair, retain optional capability, revise/repair, or withhold adoption pending evidence. No common improvement percentage is required or inferred.

## Verification Contract

For each scenario, the current result row records: CEOPT ID; fixture readiness; completed positive/negative facets; A/B trial IDs and pins; candidate result; full-frozen coverage; comparison status; reviewer evidence; limitations; conclusion; optimization recommendation; next owner/action.
Use explicit `not-run`, `partial`, `passed`, `failed` or `blocked` values per evidence dimension. A `blocked` facet cannot silently become `passed` when its local siblings pass.
Three passing B trials are necessary for the planned model block, but not sufficient without all required facets and actual artifact/tool evidence. A failures must be classified as task failure, absent capability or harness incompatibility before comparison.
Compare correctness and severe omissions before cost. Record measured latency/rework only where genuinely comparable; leave unknown rather than deriving model cost from test duration or token estimates.
Independently review substantive candidate repairs using fresh source and retain the review trace. If only producer review is available, label it and preserve the missing independent coverage.
For source changes, run the narrow regression and relevant consumer checks; syntax/entrypoint/runtime generation checks apply only to impacted surfaces. No actual runtime mirror edits are part of this plan.
Before closeout, check all required proof intents, protected paths, HEAD/index, baseline pins, artifact accessibility and owned scratch cleanup. Produce the existing verification-run-summary and honest-closeout artifacts; do not replace them with prose claims.

## Definition of Done

Planning delivery: this English plan is accessible; the exact 27-ID mapping, wave counts, source paths, dependency logic and review disposition have been checked. No new trial outcome is implied.

Execution accounting is complete when every one of the 27 rows has an inspectable result or a specific unresolved facet with an owner and unblock condition. Accounting completion is not acceptance completion.

Acceptance of these 27 is complete only when all required frozen facets have valid evidence, all current B trial blocks satisfy the criteria, necessary source/consumer checks and semantic reviews are complete, and no blocking defect remains.

The original 34-skill optimization acceptance additionally requires its seven earlier partial scenarios and original U6/U29/U30 obligations. This successor cannot waive them. Comparative benefit remains inconclusive wherever identity, quality or cost evidence is insufficient, and the original plan must not be marked complete under that condition.
