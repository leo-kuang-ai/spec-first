# PRD Output Template

Load this reference before drafting or materially rewriting a PRD artifact.

This file owns the output shape, section skeleton, surface lenses, and embedded standard template cues. Do not create a second packaged template tree for the same rules.

## Contents

- [Default Frontmatter](#default-frontmatter)
- [Output Shape](#output-shape)
- [Core Sections](#core-sections)
- [Conditional Sections](#conditional-sections)
- [Surface Lenses](#surface-lenses)
- [Product Expert Lens Write-In](#product-expert-lens-write-in)
- [Embedded Standard Skeleton](#embedded-standard-skeleton)
- [PRD Quality Diagnosis And Optimization](#prd-quality-diagnosis-and-optimization)
- [P0 PRD Quality Packs](#p0-prd-quality-packs)
- [Feature Slices](#feature-slices)
- [Lightweight Split Topology](#lightweight-split-topology)

## Default Frontmatter

```yaml
---
spec_id: YYYY-MM-DD-NNN-<slug>
artifact_kind: prd-requirements
target_surface: generic
status: draft
evidence_grade: mixed
created: YYYY-MM-DD
source_inputs:
  - path/to/original-input.md
---
```

Default path: `docs/brainstorms/YYYY-MM-DD-NNN-<slug>-requirements.md`.

`artifact_kind: prd-requirements` marks a PRD-grade requirements origin that the current host's plan workflow can consume as requirements. Do not create `docs/prds/`.
`source_inputs` lists original PRD/source/design input files that are locatable inside the target repo; omit only when no original input file is locatable, and record that limitation in readiness. The producer-local Stop hook uses this field to pass `--inputs` into finalize/checker so input-side design-source accounting is actually enforced. This field name is a hard contract — the Stop hook reads only `source_inputs:` (or legacy `prd_input:`); alternate names like `origin_docs:` are NOT recognized and cause the hook to extract zero inputs, producing `input_refs_unavailable` + `ready_receipt_stale`. Always use `source_inputs:`.

## Output Shape

Choose the standard PRD output shape after source-first grilling has either closed or explicitly carried the relevant requirement branches:

| Shape | Use when | Default content |
| --- | --- | --- |
| `bypass` | The request is a clear bugfix, tiny script/docs edit, or implementation-ready task where PRD authoring adds no durable WHAT value. | No PRD artifact; provide an explicit plan/work/debug handoff reason. |
| `compact-prd` | Every relevant branch is already source-resolved (Canonical stop 2) so no owner interview is needed, and there is no broad surface or topology risk. Relentless grilling is still the default — compact is the shape that source evidence earned, not a shortcut past clarification. | Standard core sections with source evidence, acceptance, scope, and assumptions sufficient for planning. |
| `normal-prd` | An ordinary product/system increment needs planning-ready requirements, acceptance, and scope. | Core sections plus triggered surface/domain sections. |
| `topology-heavy-prd` | Workflow, contract, migration, replace, remove, source-of-truth, or mixed-surface changes could leave active surfaces or consumers ambiguous. | Core sections plus topology, surface map, producer/consumer, source-of-truth, negative acceptance, and decision notes as needed. |

The selected shape is run-local authoring posture, not frontmatter, schema, or a second artifact taxonomy.

## Core Sections

Every PRD artifact includes the standard core sections unless it is a route-out/bypass with no PRD artifact:

- `## Summary`
- `## Change Delta`
- `## Requirements`
- `## Acceptance Examples`
- `## Scope Boundaries`
- `## Evidence And Assumptions`

Compact PRDs may omit non-load-bearing conditional detail, but they still need enough evidence, acceptance, and scope boundary for planning. Bypass output writes no PRD artifact.

Keep the canonical English anchor token in every core-section heading even when writing a localized PRD: the deterministic `check-prd-artifact.js` matches each heading on that token. A localized gloss is fine when it follows the anchor — `## Summary（文档概要）` or `## Change Delta 变更范围` both anchor — but a heading that drops the English token (for example `## 一、文档概要`) reports `core_section_missing` and blocks readiness. Do not freelance a section structure that omits these anchors.

## Conditional Sections

Include these only when they reduce planning invention:

- `## Problem Frame`
- `## Current System Snapshot`
- `## Change Topology`
- `## Surface Map`
- `## Producer / Artifact / Consumer`
- `## Source-Of-Truth Resolution`
- `## Negative Acceptance`
- `## Goals / Success Metrics`
- `## Glossary`
- `## Decision Notes`
- `## Actors`
- `## Use Cases`
- `## Interaction Requirements`
- `## Exception Handling`
- `## Data / Compliance Boundaries`
- `## Release / Operation Readiness`
- `## Outstanding Questions`
- `## Planning Recheck`
- `## Feature Slices`

Success Metrics are conditional. When present, each goal should be measurable: metric, target value, and when available, current baseline and measurement window, with leading/lagging type for core goals. If there is no credible metric source, write an observable measurement口径 or record the assumption; do not invent target values.

Trigger `## Goals / Success Metrics` when a planning-bound objective says improve, optimize, reduce, lower, accelerate, stabilize, prove, preserve, avoid regression, reduce drift, reduce prompt/runtime load, increase coverage, or similar and that objective affects priority, acceptance, or release confidence. For internal tools, workflows, skills, prompts, and runtime projection changes, acceptable observable signals include hot-path load or anchor count, output-drift or boundary regression cases, source/reference contract coverage, runtime projection or generated-mirror drift checks, eval fixture coverage, fresh-source eval status, and downstream consumer compatibility. When no credible baseline or target exists, write an observable signal or assumption; never invent a numeric target.

Use `## Planning Recheck` only when it prevents advisory evidence from being consumed as confirmed truth. Add it when a source-candidate, local pattern, code-index pointer, prior artifact, or unconfirmed external/reference claim must be re-read or re-run before planning selects HOW. Keep it compact and PRD-local:

```markdown
## Planning Recheck

| item | why recheck | required before | blocks planning? |
| --- | --- | --- | --- |
```

`Planning Recheck` must not be used as a parking lot for PRD-owned owner questions. A PRD-owned owner question must not be marked non-blocking Planning Recheck when it can change user behavior, scope, acceptance, data authority, interface availability, fallback display, analytics acceptance, or source-of-truth. Only HOW/integration/source-refresh checks that do not require planning to invent WHAT may be non-blocking.

## Surface Lenses

Select one primary lens, then add secondary lenses only for real mixed-surface changes.

| Surface | Add these product questions |
| --- | --- |
| App | entry point, navigation, state, copy, loading/empty/error, permissions, release/gray rollout, accessibility, i18n, risk or confirmation steps |
| H5/PC | routes, form behavior, browser back/refresh, responsive viewports, login/session state, sharing/SEO if relevant |
| Admin | menu placement, roles/permissions, list/search/filter/export, form validation, review flow, audit trail, bulk action, four-eyes/maker-checker when relevant |
| Backend/Java | product-level state semantics, idempotency expectations, compatibility, transaction-visible outcomes, error semantics, observability expectations, operational readiness |
| CLI/DevTool | command entry, arguments/config, dry-run or preview-first behavior, logs, cross-platform behavior, failure recovery, upgrade/migration path, workflow/skill/runtime quality signals when the change affects agent-facing tools |
| Mixed | source-of-truth, cross-surface consistency, contract expectation, async sync, degradation, end-to-end acceptance, ownership boundary |

These are surface lenses, not role taxonomies. They ask PRD questions; they do not prescribe implementation units.

For workflow, skill, prompt, CLI, eval, contract, or runtime projection PRDs, apply a run-local `Workflow / Skill / Runtime Quality Signals` lens. Use it to ask whether the PRD names public workflow identity, near-neighbor routing, source/runtime boundary, generated runtime mirror status, advisory fixture limits, contract-test expectations, fresh-source eval status, and downstream consumer compatibility. Persist only the parts that reduce planning invention into existing PRD sections.

## Project-Local Overlays

When a project has local templates, standards, glossary, compliance docs, or industry appendices:

1. Read only the relevant section.
2. Treat it as a project-local overlay.
3. Record which overlay was applied.
4. Ask for confirmation when the overlay suggests legal, compliance, money movement, privacy, or safety implications.

Missing local overlay docs are a graceful absence, not an error and not permission to invent industry rules. Do not treat template industry facts as confirmed project rules; local templates raise questions until source or owner confirmation resolves them.

## Industry Overlay Triggers

When the increment's industry context is clear from input or project docs, layer an industry overlay on top of the surface lens. The overlay only raises questions and triggers conditional sections; it never asserts an industry rule as confirmed truth.

| Industry context | Raise these questions |
| --- | --- |
| Securities / trading | order/position state semantics, trading-window and market rules, risk control, clearing/settlement, audit trail, regulatory disclosure |
| Credit / lending | approval flow and limits, risk/anti-fraud gates, interest/fee rules, repayment and overdue states, compliance and data-retention boundaries |
| Admin / mid-back-office | data scope isolation, review and maker-checker flow, bulk action, export, audit log |
| Backend / platform service | state semantics, idempotency, compatibility/versioning, transaction-visible outcomes, observability and operational readiness |

If no industry context is detectable, skip this section and use the generic surface lens only.

## Product Expert Lens Write-In

`product-expert-lens.md` is the canonical PRD quality-dimension list and downstream-confirmation source. This template consumes its run-local interface; it does not copy the full lens or create a fallback checklist.

Write Lens output into existing PRD sections:

- `claim + evidence/source` supports `Current System Snapshot`, `Change Delta`, `Evidence And Assumptions`, or `Planning Recheck`.
- `gap + PRD_write_target` decides which standard section must be updated or which owner question is worth asking.
- `owner_question_or_assumption` becomes a one-question-at-a-time grill item, an accepted assumption, `Outstanding Questions`, or blocker.
- `closure_state` informs closeout, readiness, and handoff residue.
- `downstream_confirmation_risk` affects question order and handoff priority, not a numeric score or script-owned readiness verdict.

Use `accepted-assumption` only when owner accepted it or source evidence proves it safe. A recommended default without owner/source support stays as `recommended default` and must appear in `Outstanding Questions`, `Evidence And Assumptions`, or `Planning Recheck` with its consequence.

For structured or already-decided inputs, synthesize settled WHAT into standard PRD sections and demote implementation/testing/API/schema/task details to HOW unless they change scope, acceptance, or source-of-truth. Do not introduce a named conversion field map, adapter, issue tracker, or second output artifact.

## Embedded Standard Skeleton

Use this skeleton as the packaged runtime template. It replaces the former separate template tree.

```markdown
## Summary

<One paragraph: actor, increment, intended outcome, and current system anchor.>

## Change Delta

| item | current | target | delta | evidence |
| --- | --- | --- | --- | --- |

## Requirements

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | <observable product behavior> | <evidence tag/path> |

## Acceptance Examples

AE-01（对应 R-01）
Given <current or initial state>
When <actor action or system event>
Then <observable outcome>

AE-02（对应 R-01，异常）
Given <exception or boundary state>
When <actor action or system event>
Then <observable outcome or explicit non-goal>

## Scope Boundaries

### In Scope

### Out Of Scope

## Evidence And Assumptions

| claim | tag | source / owner | note |
| --- | --- | --- | --- |

## Outstanding Questions

| id | question | PRD write target | owner_status | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended_default/deferred_reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

Closure-disposition razor: see SKILL.md `Closure-disposition razor` for the legal disposition set (single source of truth). For this template's evidence shape: a `source-resolved` / `source-backed-non-WHAT-assumption` cell needs a checkable ref (path/URL/`file:line`/anchor), an `owner-answered` / `owner-capped` / `owner-accepted-assumption` row needs a matching Owner Decision Trace row below, and `implementation-only-how-pushdown` needs `planning_would_invent_what=no` (touching interface/permission/scope/source-of-truth/fallback/analytics is a blocking contradiction in a ready PRD). "I judged it a parallel planning-time item" is not a disposition; without a legal disposition the only path is to keep grilling or `checkpoint-prd`.

## Owner Decision Trace

Required when `clarification_evidence=asked-owner`, an OQ is `owner_status=answered|capped`, or closure depends on an owner answer. Each row records the owner's actual decision; the checker verifies the row is structurally present (it cannot verify the answer is genuine — that stays owner-owned). Header alias: `check-prd-artifact.js` `TRACE_HEADER_ALIASES` also accepts `decision` / `决策` as the `question` column header.

| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |
| --- | --- | --- | --- | --- | --- |

## Design Source Coverage

design_source_inventory:
- source_or_node: <explicit input ref, Figma-discoverable node, or design-dependent state referenced by requirements>
  read_status: read | unread | degraded
  PRD write target: <Interaction Requirements | Use Cases | Acceptance Examples | Evidence And Assumptions | Planning Recheck | Outstanding Questions>
  evidence_level: source-candidate/provider_untrusted | confirmed owner/source | assumption
  unread_reason:
  readiness consequence:

design_sources_read:
- <source_or_node + affected PRD write target + evidence level>

design_sources_unread:
- <source_or_node + unread reason + readiness consequence>

design_source_coverage: <read/unread/status summary>

Design-source inventory is mandatory whenever design input exists, even when access is degraded or unread. Put unread/degraded refs in `design_sources_unread` with readiness consequence rather than omitting the design source.

## Readiness Self-Check

write_mode:
clarification_evidence:
preflight_sweep_closure: closed | degraded | blocked | missing
decision_card_highest_risk_gap:
decision_card_next_action: ask-owner-first | checkpoint-prd | final-prd | route-out
decision_card_why_no_invention:
design_source_coverage:
readiness_verified_by:
readiness_checker_schema:
readiness_prd_hash:
readiness_inputs_hash:
first_unclosed_owner_question:
recommended default:
can_enter_spec_plan:
why_not:
```

`preflight_sweep_closure` is the compatibility field for Requirement Analysis Gate closure. It must summarize whether the run-local map from materials to requirement understanding, uncertainty/contradiction points, product/design/technical grill decisions, and PRD write targets is closed, degraded, blocked, or missing. Do not add a second persistent analysis schema to the PRD.

`decision_card_*` fields persist the Phase 1 Decision Card (highest_risk_gap / next_action / why_no_invention) into the artifact so Phase 1 entry is machine-verifiable. `write_mode` doubles as the Decision Card's write_mode element (not redeclared). Required when `write_mode=final-prd` or `status=ready-for-planning`; the checker reports `decision_card_undeclared` if any field is missing or empty. `checkpoint-prd` is exempt (still grilling, the card may be incomplete).

The `readiness_verified_*` fields are producer-local machine receipt fields. Do not fill or invent them manually; they are written or confirmed by `skills/spec-prd/scripts/finalize-prd-artifact.js` after `check-prd-artifact.js` reports no producer blocking reasons. If the PRD is still a checkpoint, keep `can_enter_spec_plan: no` and omit the ready receipt.

Use the surface lens and project-local overlay to add only the conditional sections the increment needs.

## Authoring Discipline

Use brownfield increment examples, not 0-1 expansion examples:

- vague original -> improved concrete wording -> reason
- replace "等", "相关", "合适的", "更好", and "优化体验" with observable scope, state, quantity, trigger, or acceptance
- product constraints are allowed; implementation units, schemas, exact API fields, database tables, and task breakdown are not
- run the Framing Gate and Evidence Plan from `evidence-and-topology.md` when the input signals removal, migration, workflow/contract change, source-of-truth movement, generated/runtime mirrors, package/docs/test cleanup, or cross-surface scope
- do not print the run-local Framing Gate by default; promote only the parts that reduce planning invention into Current System Snapshot, Change Topology, Surface Map, Producer / Artifact / Consumer, Source-Of-Truth Resolution, Negative Acceptance, Evidence And Assumptions, or Outstanding Questions

### Push-Right Owner Checkpoint (Brief)

Resolve every source-answerable gap first (relentless, one question at a time against repo/docs/API). Defer the irreducible owner decisions to the rightmost checkpoint and present them as one decision-ready Brief, not a stream of interruptions and not the full draft. Each Brief item: `decision | recommended answer | affected PRD write target | what planning would invent if unanswered`. The owner's replies become the `owner-answered` rows in Owner Decision Trace. The Brief is run-local (no new artifact); its only durable residue is the trace. Review speed matters — a fast, decision-ready Brief is genuine engagement, a wall of raw draft is not.

## PRD Quality Diagnosis And Optimization

For refine or validate mode, diagnose before rewriting and keep the diagnosis concise:

```text
quality_diagnosis: ready | minor-gaps | material-gaps | blockers
evidence_depth:
top_gaps:
rewrite_strategy:
```

Give optimization suggestions as `original -> recommendation -> reason -> write target`. Prioritize suggestions that reduce planning invention: missing current-state evidence, unclear delta, untestable wording, missing priority, missing acceptance, industry/compliance uncertainty, source/user contradiction, or scope creep.

Then produce the final rewritten PRD using the standard skeleton and triggered sections. Ensure there is no standalone quality report artifact unless the user explicitly asks; put persistent decisions into `Decision Notes`, assumptions into `Evidence And Assumptions`, and unresolved blockers into `Outstanding Questions`.

`not-run` is a run-local decision-card state only; do not emit it in the diagnosis block because an emitted refine/validate diagnosis has run by definition. Do not create numeric PRD scorecards, 0-100 quality ratings, or industry hard-threshold rubrics.

Use two different diagnosis moments:

- `Preliminary Diagnosis` happens after sanitization and source/current-state evidence. It decides input scale, system anchor, how to run Pre-PRD Clarification, whether large-input Map-Reduce is needed, which P0/P1 packs are triggered, and whether to route out.
- `Final Readiness Diagnosis` happens after rewrite and closure. It decides whether unresolved gaps still force planning to invent WHAT. Preliminary labels such as `ready`, `minor-gaps`, `material-gaps`, or `blockers` are not final `ready-for-planning`.

If Pre-PRD Clarification ran, feed its results into final PRD rewrite through section-level write targets. Do not leave a detached critique, interview transcript, chunk summary, Map row, Reduce output, or standalone grill report as the durable output.

For a new PRD, keep the shared understanding map run-local until standard-template scope, acceptance, terminology, actor/flow/state, exception, permission, release, and boundary branches are source-resolved, owner-answered, accepted as assumptions, moved to `Outstanding Questions`, blocked, or routed out. Only then write the durable PRD sections. For resume/refine, incremental writes are allowed during clarification, but each write must be visibly confirmed by source evidence, owner answer, or a labeled assumption. Implementation-ready or direct route-out paths must state the bypass reason and the handoff target rather than silently producing a compact PRD.

Rough PRD gap-to-target mapping:

| Gap type | First resolution path | PRD write target |
| --- | --- | --- |
| actor / beneficiary unclear | prior PRD/source-facing entry, then owner | `Actors`, `Requirements`, `Outstanding Questions` |
| flow missing | current routes/commands/docs, then owner | `Use Cases`, `Interaction Requirements`, `Acceptance Examples` |
| state / permission missing | source/tests/roles/contracts, then owner | `Requirements`, `Acceptance Examples`, `Negative Acceptance` |
| exception / failure missing | existing error/empty/retry patterns, then owner | `Exception Handling`, `Acceptance Examples`, `Scope Boundaries` |
| scope boundary fuzzy | prior plans/non-goals, then owner | `Scope Boundaries`, `Decision Notes` |
| decision intersection unresolved | ratified decisions/docs/source, then owner | `Decision Notes`, `Outstanding Questions` |
| term/source contradiction | Domain Grill source-first lookup | `Glossary`, `Decision Notes`, `Evidence And Assumptions` |
| problem / outcome unclear | owner, prior PRD, product docs | `Problem Frame`, `Summary`, `Goals / Success Metrics`, `Outstanding Questions` |
| metric claim ungrounded | source/baseline lookup, then owner | `Goals / Success Metrics`, `Evidence And Assumptions`, `Outstanding Questions` |
| product-level NFR or constraint missing | surface/project overlay, then owner | `Data / Compliance Boundaries`, `Release / Operation Readiness`, `Exception Handling`, `Negative Acceptance` |
| trace gap | PRD rewrite or explicit trace gap | `Requirements`, `Acceptance Examples`, `Evidence And Assumptions`, `Outstanding Questions` |
| cross-chunk duplication or contradiction | Map-Reduce Shuffle/Reduce, then owner if unresolved | `Requirements`, `Decision Notes`, `Evidence And Assumptions`, `Outstanding Questions` |
| owner closure missing | closeout summary and Decision Notes | `Decision Notes`, `Evidence And Assumptions`, `Outstanding Questions` |
| design / UX evidence present | extract PRD facts only; app audit remains separate | `Interaction Requirements`, `Use Cases`, `Acceptance Examples`, `Evidence And Assumptions` |
| release or slice ambiguity | owner-confirmed priority/split | `Feature Slices`, `Scope Boundaries`, `Release / Operation Readiness` |
| existing PRD changed | stable IDs plus add/replace/deprecate notes | `Change Delta`, `Decision Notes`, `Evidence And Assumptions` |
| structured/decided input with embedded HOW | synthesize settled WHAT, demote implementation/testing mechanics | standard PRD sections, assumptions, or planning context |

Large-input Map-Reduce results must enter final PRD rewrite through the same section-level reducers: canonical candidates become requirements or feature slices, supporting refs become evidence, conflicts become Decision Notes / Evidence And Assumptions / Outstanding Questions, and blocker clusters stay blockers. Never treat lossy chunk summaries as source-of-truth.

For oversized, multi-source, long-chain, or resume-risk runs, `large-input-checkpoint.md` may write reduced candidates earlier as PRD checkpoints. Ordinary short PRDs still wait until closure before durable write-in. Checkpoint content uses existing sections and source refs; it never creates a transcript or progress schema.

When the run uses `checkpoint-prd`, write it as a recovery checkpoint, not a final PRD. A checkpoint-prd must include `can_enter_spec-plan: no`, `next_owner_question`, open owner/source gaps, and `write_mode=checkpoint-prd` in `Readiness Self-Check` or closeout. It is not a final PRD and must not be presented as planning-ready. The relentless fallback uses this shape: when the owner gives no cap/continue signal — whether absent/headless or silent after a soft-cap offer (the observable signal is the same) — stop here with `pre_prd_clarification_status=checkpoint-blocked` rather than silently emitting `ready-for-planning`.

## P0 PRD Quality Packs

Run these packs when their trigger affects planning-invention risk or standard-template completeness. If a trigger is absent, keep source-resolved compact PRDs focused and record none/zero only when closeout clarity needs it.

| Pack | Trigger | Write target |
| --- | --- | --- |
| Problem / Outcome Framing Gate | Draft describes functions but lacks target user, product problem, desired observable outcome, or value decision planning would otherwise invent | `Problem Frame`, `Summary`, `Goals / Success Metrics`, `Outstanding Questions` |
| Success Metrics / Measurement Readiness | PRD says improve, optimize, reduce, accelerate, lower cost, stabilize, prove, preserve, avoid regression, reduce drift/load, increase coverage, or similar and the claim affects acceptance, priority, or release confidence | `Goals / Success Metrics`, `Evidence And Assumptions`, `Outstanding Questions` |
| NFR / Constraint Pack | Security, permission, privacy, compliance, payment/transaction, external API, CLI/runtime, migration, bulk/async/sync, or user-visible failure signal affects WHAT, acceptance, or release boundary | `Data / Compliance Boundaries`, `Release / Operation Readiness`, `Exception Handling`, `Negative Acceptance` |
| Traceability Matrix | Core requirement will be consumed by planning | `Requirements`, `Acceptance Examples`, `Evidence And Assumptions`, `Outstanding Questions` |
| Review / Approval Closure | Closeout/readiness needs to show owner answers, accepted assumptions, blockers, and planning readiness | `Decision Notes`, `Evidence And Assumptions`, `Outstanding Questions`, closeout summary |

Rules:

- A missing target user/problem/outcome becomes one owner question, an accepted assumption, or an `Outstanding Questions` blocker; 0-1 opportunity discovery routes to brainstorm.
- A metric with source, baseline, target, and window can be written as a metric. Without credible evidence, write an observable signal, assumption, or Outstanding Question. Never fabricate target values.
- For workflow, skill, prompt, CLI, eval, or runtime projection PRDs, write success signals at the behavior/contract level: hot-path anchors or load, route/boundary drift cases, source/reference contract tests, runtime projection checks, generated runtime mirrors untouched, eval fixtures as advisory-only evidence, fresh-source eval status, and downstream consumer compatibility. Do not turn these signals into implementation tasks.
- NFR and constraint content stays product-level: permissions, privacy, compliance, compatibility, rollout, operational readiness, failure semantics, and negative acceptance. API/database/architecture HOW excluded from PRD requirements; implementation mechanisms stay out of PRD requirements.
- Traceability is lightweight: `R -> AE -> evidence/source -> open question`. This is not a schema, scorecard, or mandatory table format.
- Owner closure summarizes `owner_answers_applied`, `accepted_assumptions`, `blocking_questions`, `ready-for-planning`, and `planning_would_invent_what` when those signals exist. It does not create a separate approval artifact.

## P1 Conditional Enrichment Packs

Run these only when the input surface warrants them and the detail reduces planning invention:

| Pack | Trigger | Write target |
| --- | --- | --- |
| Stakeholder / Actor Alignment | Admin, Backend, CLI/DevTool, Mixed surface, permission, approval, producer/consumer, downstream consumer, or ambiguous user/system/admin wording | `Actors`, `Requirements`, `Use Cases`, `Evidence And Assumptions` |
| Design / UX Evidence Hook | App/H5/PC/Admin, screenshots, design links, exported design context, page description, or interaction-state input | use `design-source-evidence.md` External Evidence Interface to choose `Interaction Requirements`, `Use Cases`, `Acceptance Examples`, `Evidence And Assumptions`, or `Planning Recheck`; list `design_source_inventory`, `design_sources_read`, `design_sources_unread`, `source_or_node`, `read_status`, PRD write target, evidence level, unread reason, and readiness consequence |
| Prioritization / Release Slice | Many requirements, multiple goals, multi-surface scope, or release order affects scope or acceptance | `Feature Slices`, `Scope Boundaries`, `Release / Operation Readiness` |
| Change Management | `resume-prd`, existing PRD path, multi-round refine, new meeting/screenshot/review conclusion, or changed owner decision | `Change Delta`, `Decision Notes`, `Evidence And Assumptions` |

Actor alignment distinguishes beneficiary, operator, admin, downstream consumer, and owner only when the distinction changes WHAT or acceptance. Design evidence loads `design-source-evidence.md` and consumes only its External Evidence Interface, especially `extracted_design_what` and `affected_PRD_write_targets`; the detailed extraction list stays in that reference. Fetched design context remains `source-candidate` / `provider_untrusted` until source/owner reconciliation; unresolved design claims go to `Planning Recheck` or `Outstanding Questions`. It routes consistency audit to `spec-app-consistency-audit`; PRD/design-source/source consistency remains outside `spec-prd`. Release slices are PRD handoff units, never tasks or implementation units. Change Management preserves stable R/AE IDs and records added, replaced, deprecated, or still-unconfirmed deltas instead of silently rewriting old requirements.

## Context / ADR Notes

When existing `CONTEXT.md`, `CONTEXT-MAP.md`, context-specific `CONTEXT.md`, or `docs/adr/**` were read, record the PRD-relevant evidence source and contradiction/decision outcome. Stable terms persist in `Glossary`; hard decisions persist in `Decision Notes`, `Evidence And Assumptions`, or `Scope Boundaries` so the PRD remains sufficient for planning.

In normal PRD mode, project-level context or ADR updates are preview-first promotion candidates only. They are not required PRD output, not readiness prerequisites, and not silently written by this workflow.

When `grill-with-docs-integration.md` is triggered, resolved project-specific terms update `CONTEXT.md` inline and ADR-worthy decisions create ADRs inline. Record the changed context/ADR paths in `Closeout Summary`; do not make those files a replacement for PRD-local closure.

## Feature Slices

Add `## Feature Slices` when the PRD is large, mixed-surface, multi-feature, refine/validate with multiple goals, or otherwise likely to make planning infer feature boundaries. Feature Slices are context and handoff units, not execution units, task packs, program slices, or sub-agent dispatch units.

Use business capability/outcome boundaries rather than code-layer partitions such as Controller/Service/DAO files. Each slice should preserve original PRD text or source claim when available:

```text
feature_id:
title:
summary:
requirement_refs:
acceptance_refs:
source_excerpt_or_claim:
evidence:
candidate_modules_or_source_refs:
risk_signals:
```

Rules:

- no slice without acceptance refs or an explicit trace gap;
- candidate modules/source refs are evidence pointers, not scope authority;
- cross-cutting concerns belong in risk signals or cross-cutting notes, not fake feature slices;
- 3-7 slices is a common healthy range, not a hard rule;
- more than 10 slices should trigger split recommendation or owner confirmation before silent expansion.

For medium, large, mixed-surface, workflow, contract, migration, replace, or remove changes, include topology-driven sections only as needed:

````markdown
## Change Topology

Primary topology: add | extend | replace | remove | migrate | split | merge | policy-change | workflow-change | contract-change

Why this topology matters:

## Surface Map

| surface | current behavior | owner/source | artifact/contract | consumer | delta | evidence |
| --- | --- | --- | --- | --- | --- | --- |

## Producer / Artifact / Consumer

| producer | artifact/schema/path | freshness/authority | consumers | change effect | evidence |
| --- | --- | --- | --- | --- | --- |

## Source-Of-Truth Resolution

| item | current source-of-truth | target source-of-truth | generated mirrors / non-authoritative refs | conflict rule |
| --- | --- | --- | --- | --- |

## Negative Acceptance

```text
NA-01
Given <current or future state>
When <implementation or workflow runs>
Then <must not happen>
```
````

These sections are not implementation planning. They define WHAT boundaries so planning does not invent affected surfaces, consumers, or source-of-truth decisions.

## Stable Trace Rules

Preserve existing IDs when refining a draft:

- R / AE / BR / NFR IDs are not reused.
- New IDs continue from the maximum current number.
- Project-local IDs such as `US-*`, `FEAT-*`, or `NFR-*` may be kept as auxiliary trace, but they must map back to spec-first requirements, acceptance examples, scope boundaries, or assumptions.

## Closeout Summary

Every PRD handoff should report:

- Resolved before planning
- Still carried
- planning_would_invent_what
- sections included
- requirement count
- acceptance example count
- priority distribution
- NFR count
- assumption count
- outstanding question count
- planning recheck item count
- uncovered requirements
- feature items without acceptance examples
- current-state claims without confirmed evidence

When a PRD artifact path exists, run `skills/spec-prd/scripts/finalize-prd-artifact.js <prd-path> --inputs <input-path>` before confirmed ready closeout; use `--check-only` for preview. The finalize path seeds deterministic counts and trace facts from `check-prd-artifact.js` before any LLM-owned readiness judgment such as `Resolved before planning`, `Still carried`, and whether planning would still have to invent WHAT. Use `preflight_sweep_closure` to state whether the Phase 1 Requirement Analysis Gate closed, degraded, blocked, or is missing; this is a lightweight compatibility declaration in the existing `Readiness Self-Check`, not a second PRD artifact topology.

The script seeds only the deterministic lines: sections included, requirement count, acceptance example count, priority distribution, NFR count, assumption count, outstanding question count, uncovered requirements, and feature-to-R/AE trace gaps. The lines `Resolved before planning`, `Still carried`, `planning recheck item count`, `current-state claims without confirmed evidence`, and whether planning would still have to invent WHAT stay LLM-owned: the checker intentionally does not and must not compute them, because deciding which sentence is a load-bearing source-candidate recheck item or current-state claim and whether its evidence genuinely confirms is semantic (the script reports `evidence_tags_present` by presence only, not sufficiency).

When `## Feature Slices` is present, or when PRD complexity was explicitly evaluated for slice need, additionally report:

- feature slice count and feature IDs
- feature-to-R/AE trace gaps
- cross-cutting risk count
- split recommendation / owner confirmation status when slice count, cross-owner scope, or cross-release risk suggests program or execution slicing

If gaps remain, do not silently recommend planning. Ask the source-backed grill question that closes or narrows the named PRD write target, record accepted assumptions, or route to document review/refine.

## Lightweight Split Topology

For owner-confirmed oversized initial PRDs, use shared base identity without adding packet infrastructure:

Split summary frontmatter:

```yaml
---
spec_id: YYYY-MM-DD-NNN-<base-slug>
artifact_kind: prd-requirements
document_role: split-summary
source_prd: docs/brainstorms/<source-or-original>.md
---
```

Child PRD frontmatter:

```yaml
---
spec_id: YYYY-MM-DD-NNN-<base-slug>
artifact_kind: prd-requirements
document_role: child-prd
child_id: <module-slug>
parent_spec_id: YYYY-MM-DD-NNN-<base-slug>
source_prd: docs/brainstorms/<source-or-original>.md
split_summary: docs/brainstorms/<split-summary>.md
---
```

The split summary is navigation and boundary context. Implementation planning should normally start from a concrete child PRD, preserving `child_id`, `parent_spec_id`, `source_prd`, and `split_summary` trace.
