# PRD Readiness Lens

Load this reference before handing a PRD to planning, document review, or done.

## Contents

- [Base Gate](#base-gate)
- [PRD-Specific Lens](#prd-specific-lens)
- [Core Pack](#core-pack)
- [Quality Diagnosis Pack](#quality-diagnosis-pack)
- [P0 Quality Floor Pack](#p0-quality-floor-pack)
- [Feature Slice Pack](#feature-slice-pack)
- [Topology Pack](#topology-pack)
- [Domain And Decision Pack](#domain-and-decision-pack)
- [P1 Conditional Pack](#p1-conditional-pack)
- [Metrics And Overlay Pack](#metrics-and-overlay-pack)
- [Outcomes](#outcomes)

## Base Gate

Reuse the existing Requirements Readiness Gate by reference. Do not copy its full prose and do not introduce a second evidence enum.

The base dimensions are:

- Clarity & Non-ambiguity
- Evidence & Inference provenance
- Traceability & Coverage
- Testability
- Boundary integrity
- Planning-invention & Handoff readiness

## PRD-Specific Lens

Run checks by pack. Always run the core pack; run conditional packs only when their trigger is present. This is a prompt economy rule, not a weaker quality bar.

When a PRD artifact path exists, running `skills/spec-prd/scripts/finalize-prd-artifact.js <prd-path> --inputs <input-path>` is required before this lens can emit `ready-for-planning`, not optional; use `--check-only` only to preview the producer-local receipt without writing. The finalize script calls `check-prd-artifact.js` and consumes deterministic `spec-prd-artifact-check.v1` facts such as frontmatter, core-section presence, requirement/acceptance trace gaps, placeholder lines, forbidden `docs/prds/` path, Feature Slice acceptance trace gaps, missing run-local readiness declarations, grill trace absence, input scan status, Requirement Analysis Gate closure through the compatibility `preflight_sweep_closure` declaration, ready receipt freshness, and design-source inventory/read/unread/coverage/accounting declaration gaps. Treat those findings as script-owned facts for this lens; they do not decide semantic readiness by themselves. But an artifact-backed PRD with no current producer-local finalize receipt is itself not ready: the lens has no confirmed producer exit to consume yet, so the only legal outcomes are to run finalize or degrade to `revise-prd` / `ask-owner`. The checker anchors core sections on their canonical English token; a `core_section_missing` finding caused by localized headings that dropped the anchor is a real not-ready signal, not noise — re-anchor the heading rather than ignore it.

The readiness orchestrator must consume declaration findings semantically. If the checker/finalize path reports `clarification_evidence_undeclared`, `clarification_trace_absent`, `write_mode_undeclared`, `can_enter_spec_plan_undeclared`, `preflight_sweep_closure_absent`, `preflight_sweep_closure_blocked`, `outstanding_question_closure_undeclared`, `blocking_outstanding_question_present`, `planning_invention_question_present`, `unclosed_owner_question_present`, `design_source_inventory_undeclared`, `design_source_coverage_undeclared`, `design_sources_read_undeclared`, `design_sources_unread_undeclared`, `design_source_unaccounted`, `design_unread_without_owner_acceptance`, `design_partial_coverage_unaccepted`, `open_oq_without_owner_closure`, `how_pushdown_touches_what`, `owner_decision_trace_required_but_absent`, `preflight_closure_contradicted`, `checkpoint_claims_ready`, `input_refs_unavailable`, `input_scan_degraded`, `prd_readiness_declarations_evaded`, `ready_receipt_absent`, `ready_receipt_stale`, or `finalize_required`, the lens must not return `ready-for-planning`. It must either fill a valid declaration from current evidence and rerun finalize, or set `write_mode=checkpoint-prd` when preserving recoverable PRD context is necessary while keeping `readiness_outcome=revise-prd` or `readiness_outcome=ask-owner`; otherwise it degrades readiness to `revise-prd`, `ask-owner`, or `route-out`. For final UI/design-surface PRDs, advisory fact `input_scan_attempted=false` is must-not-ready-until-confirmed. Repeat the finding in closeout.

Closure-disposition razor (004): an open PRD-owned question defaults to not-ready. It is non-blocking only when it declares one legal `closure_disposition` plus that disposition's evidence (`source-resolved`/`source-backed-non-WHAT-assumption` need a checkable ref; `owner-answered`/`owner-capped`/`owner-accepted-assumption` need an Owner Decision Trace row; `implementation-only-how-pushdown` needs `planning_would_invent_what=no` and must not touch WHAT-bearing surface). The model has no free non-blocking verdict — `blocks_planning=no` is derived from a disposition, never asserted. The deterministic checker only reads the declared token and evidence-cell presence (KTD2); it does not adjudicate whether a question is load-bearing or whether an owner answer is genuine. Deliberate forgery of an owner answer remains beyond artifact-level proof until host question-receipt / transcript-bound provenance exists.

`placeholder_or_todo_present` and `requirement_without_acceptance_ref` / `uncovered_requirements` hits that correspond to an intentional placeholder inside the embedded template skeleton, an explicitly recorded trace gap, or an item deliberately deferred to `Outstanding Questions` are expected advisory noise: record the rationale, do not fabricate an acceptance reference or delete a deliberate trace-gap marker to zero the findings array. The Core Pack already blesses "an explicit trace gap" as a valid readiness state, so silencing the script would invert it from an advisory fact into a coercive gate that drives the WHAT decision instead of informing it. Feature Slice trace gaps are already honored script-side, so this carve-out's load-bearing scope is the placeholder and uncovered-requirement paths plus the recorded-trace-gap state.

### Core Pack

- `current-state provenance` - material current-system claims have evidence tags; user-stated, confirmed-source, source-candidate, external-research, and assumptions are not blended; stale pointers are not presented as confirmed.
- `planning recheck visibility` - material source-candidate, local pattern, code-index pointer, prior artifact, or external/reference claim that planning must confirm before selecting HOW is visible in `Planning Recheck`, `Outstanding Questions`, or readiness closeout. It remains advisory until re-read or re-run.
- `change delta and boundary clarity` - keep/extend/replace/remove/unknown is explicit for material changes, scope boundaries are visible, and priority/degrade/block-release semantics are present when relevant.
- `planning-invention and trace risk` - planning would not need to invent actors, flows, acceptance, scope, priority, or current behavior; core requirements have acceptance coverage or an explicit trace gap.
- `pre-prd clarification closure` - when PRD authoring/refinement uses Pre-PRD Clarification, every load-bearing branch that could affect planning must reach a legal stop point defined in SKILL.md `Canonical: 四个合法停点` before planning, with `Outstanding Questions` / accepted assumption / blocker cluster / explicit trace gap as the visible residue of an owner-capped or route-out branch. Relentless grilling is the default; a branch with reachable sub-decisions that the owner has not capped is not closed. Each owner question has a named gap, source attempt, PRD write target, and closure state; a run-local shared understanding map is not itself readiness evidence. Include `write_mode` and `clarification_evidence` in this check. `write_mode=ask-owner-first` or `write_mode=checkpoint-prd` cannot be `ready-for-planning`; checkpoint closeout must set `can_enter_spec-plan: no` and name `next_owner_question`. When the owner gives no cap/continue signal (absent/headless, or silent after a soft-cap offer), the only legal outcome is the checkpoint fallback (`pre_prd_clarification_status=checkpoint-blocked`), never a silent `ready-for-planning`. If `clarification_evidence=skipped` or the field is missing while Outstanding Questions or Planning Recheck remain, readiness is at best `revise-prd` or `ask-owner`, and closeout must say clarification did not happen. If `clarification_evidence=headless-degraded-logged`, repeat the degradation reason and downgraded question list. If `clarification_evidence=source-proven-no-ask`, require source refs; without them, handle it as skipped.
- `requirement-analysis-gate closure` - before planning, the Phase 1 Requirement Analysis Gate must have closed or visibly carried the requirement understanding map: Input Inventory, Source Authority Order, Target Surface Anchor, Current-State Summary, Change Delta, Module Map, Open Decisions, Design Coverage, API Coverage, Risk -> PRD Write Target Map, and any triggered Product/Design/Technical Owner Question, Domain-Glossary, Topology-Producer-Consumer, Design Coverage, API/Contract Coverage, or Large Input-Resume gates. `preflight_sweep_closure: closed | degraded | blocked | missing` is the lightweight compatibility declaration in `Readiness Self-Check`; it now means Requirement Analysis Gate closure. `missing` or `blocked` cannot be `ready-for-planning`, and checker findings `preflight_sweep_closure_absent` / `preflight_sweep_closure_blocked` are must-not-ready until fixed or downgraded.
- `wording and testability` - vague words such as "等", "相关", "合适的", "更好", and "优化体验" are replaced by verifiable behavior, state, trigger, quantity, or acceptance. INVEST, EARS, and Gherkin-style wording are optional clarity anchors, not scoring rubrics.
- `interaction and exception readiness` - important user-visible entries, state, feedback, confirmation, cancellation, failure, empty, permission, retry, and partial-success cases are covered or intentionally out of scope when relevant.

### Quality Diagnosis Pack

Run this pack when the input is an existing PRD, requirements draft, rough notes being refined/validated as PRD input, or the user asks for deep PRD quality analysis or optimization suggestions.

- `product expert lens fit` - the applied surface/industry/product lens follows the actual target surface, current source evidence, and owner-stated objective; generic checklists are not applied as confirmed project facts.
- `canonical lens reuse` - the diagnosis uses `product-expert-lens.md`'s Product Expert Lens as the quality-dimension source instead of copying a second near-duplicate dimension list.
- `preliminary-vs-final diagnosis` - Preliminary Diagnosis may choose source-resolved compact/L1/L2/L3/L4/L5 expansion, route-out, or blocker posture, but only Final Readiness Diagnosis after rewrite and closure may emit `ready-for-planning`.
- `optimization suggestion closure` - major PRD gaps are expressed as `original -> recommendation -> reason -> write target`, prioritized by planning-invention risk, and either incorporated into the rewritten PRD or left as visible blockers.
- `rewrite integrity` - the final PRD preserves stable IDs where applicable, separates critique from durable requirements, keeps HOW out of requirements, and does not drop confirmed source evidence, owner decisions, assumptions, or unresolved questions during cleanup.

### P0 Quality Floor Pack

Run this pack only when the corresponding P0 signal is triggered. Untriggered P0 packs are not missing sections and must not expand compact PRDs by default.

- `problem-outcome closure` - if target user, product problem, desired observable outcome, or value framing would affect planning, it is source/owner-confirmed, labeled as an accepted assumption, or visible in `Outstanding Questions`. Missing load-bearing framing blocks `ready-for-planning`.
- `metrics readiness` - improvement claims that affect acceptance, priority, or release confidence have metric/source/baseline/window when confirmed, or are downgraded to observable signal, assumption, or Outstanding Question. Trigger words include improve, optimize, reduce, accelerate, lower cost, stabilize, prove, preserve, avoid regression, reduce drift/load, and increase coverage. Fabricated target values block readiness.
- `nfr-constraint closure` - triggered security, permission, privacy, compliance, payment/transaction, external API, CLI/runtime, migration, bulk/async/sync, rollout, operational, or user-visible failure constraints are captured as product-level requirements, negative acceptance, data/compliance boundaries, or release/operation readiness. API/database/architecture HOW is not accepted as PRD closure.
- `workflow-skill-runtime quality closure` - when the PRD concerns a workflow, skill, prompt, CLI, eval fixture, contract, or runtime projection change, the `Workflow / Skill / Runtime Quality Signals` lens has been applied and planning-critical quality signals are visible as product-level outcomes: public workflow identity, near-neighbor routing, source/runtime boundary, generated runtime mirrors untouched, eval fixtures advisory-only, source/reference contract tests, runtime projection checks, fresh-source eval status, and downstream consumer compatibility. File edits, exact test code, and implementation sequencing remain HOW.
- `traceability closure` - planning-bound requirements trace to acceptance examples and evidence/source, or carry an explicit trace gap / open question. A load-bearing requirement without AE/evidence/trace-gap closure blocks readiness.
- `owner approval closure` - owner answers applied, accepted assumptions, blocking questions, `Resolved before planning`, `Still carried`, `readiness_outcome`, `planning_would_invent_what`, and final readiness posture are visible in PRD-local sections or closeout summary. A separate approval artifact is not required.

### Feature Slice Pack

Run this pack when `## Feature Slices` is present or when PRD complexity suggests slices should exist.

- `slice identity and trace` - each slice has a stable feature ID, business-readable title, source/evidence, requirement refs, acceptance refs or an explicit trace gap, and a visible mapping to Change Delta or core requirements.
- `business capability boundary` - slices are grouped by product capability/outcome rather than Controller/Service/DAO files, screens alone, or code module partitions.
- `source excerpt preservation` - original PRD text, user claim, or source claim remains visible enough for planning and review to trace why the slice exists.
- `cross-cutting risk visibility` - permissions, rollout, compliance, operational, shared-source, and cross-surface concerns are visible as risk signals or cross-cutting notes, not hidden inside fake feature slices.
- `program-slice boundary` - large slice count, cross-owner scope, or cross-release risk leads to split recommendation or owner confirmation; the PRD does not silently decide program/execution slices.

### Topology Pack

Run this pack for medium/large/mixed-surface, workflow, contract, migration, replace, remove, source-of-truth, generated-runtime, artifact/schema/report, or active-surface changes.

- `topology and surface fit` - when the increment changes capability identity, source-of-truth, workflow handoff, artifacts, contracts, runtime generation, or active product surface, the PRD names the primary topology from `references/evidence-and-topology.md`, applies relevant topology-specific gates, and identifies affected surfaces or explicitly rules them out.
- `producer-consumer and source-of-truth closure` - any changed artifact, schema, report, config, setup fact, generated asset, workflow handoff, template, or mirrored doc identifies producer, authority/freshness, consumers, change effect, current/target source-of-truth, generated mirrors, non-authoritative refs, and conflict rule as needed.
- `negative-space coverage` - high-risk, mixed-surface, workflow, contract, migration, replace, or remove changes include negative examples for what must not be generated, exposed, consumed, widened, or treated as current truth.
- `framing-evidence alignment` - when the Framing Gate identified topology, source-of-truth, producer/consumer, active-surface, or negative-space risk, the final PRD either covers that risk with confirmed/user-stated evidence or records it as an assumption, Outstanding Question, or explicit non-goal.

### Domain And Decision Pack

Run this pack when terminology, domain boundary, source/user contradiction, ownership, permission/state/exception scenario, source-of-truth, or hard product-boundary ambiguity could change WHAT, acceptance, scope, or downstream planning.

- `terminology and contradiction handling` - canonical terms are defined or unresolved terms are in Outstanding Questions; source/user/glossary mismatches are recorded as contradictions, not silently resolved. When `docs/contracts/domain-glossary.md` exists, `skills/spec-prd/scripts/check-glossary-drift.js <prd-path>` reports deterministic `avoid_term_used` facts; treat findings as advisory, then fix or record the decision. Hits that land in the PRD's own `Glossary` avoid/alias column or in Evidence/Decision-Note provenance references are expected advisory noise: record the rationale, do not delete the avoid declaration or drift trace to silence the script.
- `owner-question discipline` - unresolved owner questions are limited to decisions that change WHAT, acceptance, source-of-truth, scope, terminology, actor/flow/state, exception, permission, release, or another standard PRD write target; repo-discoverable facts are not asked as product questions, every owner question closes or narrows a named gap with a PRD write target, low-value questions are stopped, and broad question clusters route to refine/doc-review instead of being hidden in planning.
- `domain-grill and decision-note adequacy` - load-bearing terminology, domain boundary, contradiction, ownership, permission/state/exception scenario, source/code contradiction, or hard product-boundary ambiguity has either been resolved through source-first evidence plus a requirements scenario grill, recorded as a labeled assumption, moved to `Outstanding Questions`, or escalated to `grill-with-docs` integration; material decisions use PRD-local `Decision Notes` with `question`, `recommended_answer`, `source_tag`, `chosen_answer`, `consequence`, and `deferred_reason` when applicable.
- `deep requirements grill closure` - actor, flow, state, exception, scope, acceptance, permission, release-slice, terminology, or decision-intersection branches from Pre-PRD Clarification or `grill-with-docs` integration each reach a legal stop point in SKILL.md `Canonical: 四个合法停点`. Grilling is relentless by default; "the next question would only expand scope" or "does not affect the current release slice" reorders questions, it does not stop a branch. A branch ends without a Canonical stop point only via `route-out` (anchor missing / broad discovery / non-adjudicable). Any load-bearing branch with reachable sub-decisions that has not reached a Canonical stop point — including one the owner has not capped — blocks `ready-for-planning`.
- `context/adr topology adapter boundary` - existing `CONTEXT.md`, `CONTEXT-MAP.md`, context-specific `CONTEXT.md`, and `docs/adr/**` may provide advisory evidence in normal mode; in triggered `grill-with-docs` mode, resolved terms or ADR-worthy decisions may update those files inline. PRD-local Glossary / Decision Notes / Evidence And Assumptions / Scope Boundaries remain the planning handoff source.
- `context/adr artifact mode boundary` - readiness must not require `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/` in normal PRD mode, and missing topology does not block planning if PRD-local closure is complete. When `grill-with-docs` mode is triggered, readiness checks that resolved context/ADR updates are reflected in the PRD closeout and that ADR creation still satisfies hard-to-reverse, surprising-without-context, real-tradeoff conditions.

### P1 Conditional Pack

Run this pack only for triggered conditional signals. It is not an all-section checklist.

- `stakeholder-actor closure` - when Admin, Backend, CLI/DevTool, Mixed surface, permission, approval, producer/consumer, or downstream-consumer signals are present, beneficiary, operator, admin, downstream consumer, and owner are distinguished enough that planning will not invent roles.
- `design-evidence closure` - when screenshot/design-link/exported design context/page/interaction input is present, `design-source-evidence.md` External Evidence Interface has been consumed or explicitly deferred. Readiness checks the resulting PRD write targets and Planning Recheck residue, not a copied design WHAT extraction list. If input contains design-source refs but the PRD does not account for them (`design_source_unaccounted`), input refs are unavailable/degraded (`input_refs_unavailable` / `input_scan_degraded`), or a final UI/design-surface PRD did not attempt input scanning (`input_scan_attempted=false`), readiness must not return `ready-for-planning`. If Figma/design-source nodes are unread and may affect page structure, state, interaction, acceptance, or scope, readiness must not return `ready-for-planning`; continue reading design evidence, ask owner for the design authority/default, or set `write_mode=checkpoint-prd` when preserving recoverable PRD context is necessary while keeping readiness at `revise-prd` or `ask-owner`. A degraded design-source path can be ready only when `design_sources_unread`, degraded reason, owner acceptance, and remaining Planning Recheck / Outstanding Questions residue are explicit. A naked `design_degraded_owner_acceptance: true` is not owner evidence; acceptance must bind to an Owner Decision Trace row or checkable `design_degraded_owner_acceptance_ref`. PRD/design-source/source consistency remains a route-out to `spec-app-consistency-audit`.
- `release-slice closure` - when requirement count, goals, mixed surfaces, or release order affect scope/acceptance, the PRD records P0/P1/deferred, owner-confirmed split, or Feature Slices. Feature Slices remain PRD handoff units, not task or implementation units.
- `change-management closure` - for `resume-prd`, existing PRD path, multi-round refine, or new meeting/screenshot/review conclusion input, stable R/AE IDs are preserved and added/replaced/deprecated/needs-confirmation deltas are visible.

### Metrics And Overlay Pack

Run this pack only when the PRD includes goals/metrics, internal workflow/skill/runtime quality signals, or applies a project-local industry/team/legal/compliance/privacy/safety overlay.

- `goal-measurability` - when the PRD includes `Goals / Success Metrics`, each goal is measurable: it has a metric and target value, plus current baseline and measurement window when available, and vague verbs are replaced with observable口径. This is a standard for stated goals, not a demand to manufacture metrics. When no credible metric source exists, downgrade to an observable口径 or move the unproven metric into Assumptions / Outstanding Questions; never fabricate target values.
- `internal-tool quality signals` - for workflow, skill, prompt, CLI, eval, contract, or runtime projection PRDs, observable signals may be behavioral or contract signals such as hot-path load/anchors, boundary drift cases, runtime projection checks, generated mirrors untouched, advisory fixture coverage, fresh-source eval status, and downstream consumer compatibility. They remain PRD outcomes, not task breakdown.
- `project-local overlay check` - triggered legal, compliance, money, trading, data, audit, safety, or privacy boundaries are explicit. If they are not confirmed, keep them in `Evidence And Assumptions` or `Outstanding Questions`.

## Outcomes

Frontmatter `status` is machine-owned once a PRD artifact exists. The LLM may keep a document at `status: draft` / checkpoint while it is still being shaped, but it must not write `status: ready-for-planning` directly; that status requires the producer-local finalize receipt (`readiness_verified_by: check-prd-artifact.js`, current `readiness_prd_hash`, and current `readiness_inputs_hash`). Conversely, a polished document can still return `revise-prd` or `ask-owner`.

When closing a PRD handoff or writing `Readiness Self-Check`, state `readiness_outcome` explicitly using exactly one of:

- `ready-for-planning` - planning can consume the PRD without inventing WHAT.
- `revise-prd` - fix concrete PRD gaps before planning.
- `ask-owner` - ask the source-backed grill question that closes or narrows the named PRD write target.
- `doc-review` - request independent document review when risk is broad or subtle.
- `route-out` - use brainstorm, app consistency audit, plan, debug, or work instead.

Implementation-ready or direct route-out is a route-out/bypass exception, not a hidden compact PRD shortcut. When used, record the reason and why downstream planning or work will not need to invent WHAT.

If the user chooses to continue with assumptions, record the accepted risk in the PRD. Do not hide readiness gaps in the closeout.

Before declaring `ready-for-planning`, run a handoff entropy check: list `Resolved before planning`, `Still carried`, and any remaining WHAT decisions that planning would otherwise have to invent across behavior, scope, affected surfaces, artifact consumers, source-of-truth, negative boundaries, and unresolved framing risks. If any open load-bearing WHAT gap remains unresolved, the outcome is `revise-prd` or `ask-owner`, not ready.

The handoff entropy check must include `write_mode`, `clarification_evidence`, Requirement Analysis Gate closure via `preflight_sweep_closure`, checker findings, PRD-owned owner questions, and Figma/design-source residue. A PRD-owned owner question that can change WHAT, acceptance, data authority, interface availability, fallback display, analytics acceptance, or source-of-truth blocks readiness even if a table says `blocks planning? no`. Planning Recheck is non-blocking only for HOW or integration recheck items after product defaults and acceptance are closed.
