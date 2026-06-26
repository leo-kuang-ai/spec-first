# Domain Language And Decision Ledger

Load this reference when terminology, product-domain boundaries, or source/user contradictions affect the PRD.

## Contents

- [Source-First Questioning](#source-first-questioning)
- [Canonical Term Handling](#canonical-term-handling)
- [Cross-PRD Glossary Promotion](#cross-prd-glossary-promotion)
- [Requirements Scenario Grill](#requirements-scenario-grill)
- [Default Clarification Posture](#default-clarification-posture)
- [Pre-PRD Clarification Loop](#pre-prd-clarification-loop)
- [Deep Requirements Grill](#deep-requirements-grill)
- [Grill-With-Docs Integration Trigger](#grill-with-docs-integration-trigger)
- [Decision Notes](#decision-notes)
- [Context / ADR Topology Adapter](#context--adr-topology-adapter)

## Source-First Questioning

Before asking the owner about terminology or current behavior, inspect context that can answer cheaply:

- already-loaded host/project instructions
- `docs/contracts/`, existing brainstorms/plans/solutions, and project docs
- the project domain glossary at `docs/contracts/domain-glossary.md` when it exists — read it first so canonical terms already established by prior PRDs are reused, not reinvented
- repo-local glossary or ADR-like artifacts that actually exist
- source, tests, templates, and product-facing strings in the affected area

Do not require a fixed `CONTEXT.md`, `docs/adr/`, or glossary directory for ordinary PRD authoring. The project domain glossary is optional and opt-in: if `docs/contracts/domain-glossary.md` does not exist, record that as advisory context and continue with available evidence — do not create it for a single small increment. When `grill-with-docs` integration is triggered, `CONTEXT.md` and ADR files are created or updated lazily under `grill-with-docs-integration.md`.

## Canonical Term Handling

When the same concept has multiple names:

- propose a `canonical term`
- list `avoid terms` or aliases that could confuse planning
- attach a source tag: `confirmed`, `advisory`, `session-local`, `stale`, or `user`
- write the decision into PRD `Glossary`, `Evidence And Assumptions`, `Decision Notes`, or `Outstanding Questions`

Two discipline rules keep glossary entries useful and prevent them from decaying into a spec:

- **Only capture domain-specific terms.** Before recording a term, ask: is this a concept unique to this product/domain, or a general engineering concept? Only the former belongs. General concepts (timeout, retry, error type, cache, pagination) stay out even when the system uses them heavily — capturing them dilutes the glossary and adds maintenance with no disambiguation value.
- **Define what a term IS, not what it DOES.** A glossary definition states the concept's identity in one or two tight sentences, not its behavior, workflow, or implementation. This is `WHAT not HOW` (Core Principle 2) at term granularity. "An Invoice is a request for payment issued after delivery" belongs; "the Invoice service retries failed charges three times" does not.

Do not create a permanent glossary or ADR by default in normal PRD mode. Triggered `grill-with-docs` mode may update `CONTEXT.md` inline for resolved project terms and create ADRs when the three ADR conditions hold.

## Cross-PRD Glossary Promotion

A term lives in a single PRD's `## Glossary` by default (session-local, draft layer). Promote it to the project-level canonical glossary at `docs/contracts/domain-glossary.md` only when both hold:

- the same domain-specific concept has been sharpened across **two or more PRDs**, and
- it passes the two discipline rules above (domain-specific, defined as IS not DOES).

Promotion is **preview-first**: propose the canonical entry to the owner, and write it to `docs/contracts/domain-glossary.md` only after confirmation. Never silent-write. Follow the field contract and entry format defined in that file. A single small increment never needs promotion — keep its terms in the PRD only.

When a new PRD's term conflicts with an existing canonical entry, surface it immediately as a contradiction (see `evidence-and-topology.md` Contradiction Handling) rather than letting the language drift.

## Requirements Scenario Grill

> `spec-prd/SKILL.md` Phase 2 也把这套机制称为 Requirements Grill / Domain Grill Gate,readiness lens 用 `domain-grill coverage` 指代同一覆盖检查。三者是同一流程,不是独立概念。本文件是 PRD-local trigger / cadence / question format 的权威定义;`grill-with-docs-integration.md` 是 sustained interview 与 context/ADR 行为的权威定义;SKILL.md 只做摘要引用。

Use concrete scenarios to stress-test requirements and domain boundaries whenever they can make the standard PRD more precise. Prioritize scenarios that change or confirm a PRD write target. Examples:

- a normal happy path
- a permission/role boundary
- an exception or contradiction that changes acceptance

Keep the PRD grill thorough but progress-bound. It is a source-backed requirements-clarification tool, not a coaching transcript. Auto-load `grill-with-docs-integration.md` for rough PRD, draft, `reference-claims`, `resume-prd`, `pure-text`, or multi-source inputs unless the request is wrong-stage, implementation-ready, or already source-resolved enough to write the standard PRD without owner input. Do not require the user to name `grill-with-docs`.

Trigger only when one of these is true:

- a domain term has multiple plausible meanings and the wrong choice would change requirements or acceptance
- user-stated current behavior conflicts with source, docs, tests, or contracts
- a source-of-truth, ownership, or artifact authority decision affects downstream planning
- a concrete scenario reveals ambiguity in actor, permission, state transition, exception handling, or negative acceptance
- a hard-to-reverse product or architecture boundary is being decided and would be surprising without context
- two or more ratified owner decisions converge in the same flow and their combined or intersection behavior is not adjudicated by any single decision (give a recommended default, label it an assumption, and record it in Outstanding Questions)

Do not trigger when:

- the question is an implementation detail that `spec-plan` owns
- the fact is cheap to confirm from source, docs, tests, glossary, or ADR-like artifacts
- the term is a general engineering concept rather than a project/domain concept
- the decision is easy to reverse, obvious, or not the result of a real tradeoff
- the PRD can safely carry a labeled, non-load-bearing assumption without weakening any required PRD section

Question cadence:

- Use the parent skill Interaction Method for every owner question; its platform blocking question tool requirement applies before the cadence rules below.
- Ask at most one question at a time.
- Each question must bind to a `gap id`, a source attempt, a PRD write target, and a progress state: `closed`, `narrowed`, `accepted assumption`, `Outstanding Question`, `blocker`, or `route-out`.
- Continue relentlessly by default, walking down each branch. A branch stops only at a legal stop point defined in SKILL.md `Canonical: 四个合法停点`. "Does not affect the current release slice" reorders questions, it does not stop a branch; only `route-out` ends a branch without a Canonical stop point. When the owner gives no cap/continue signal, fall back to checkpoint per Canonical, never silently emit ready.
- Always give a `recommended_answer` unless there is no defensible default.
- If the owner says "you decide", use the recommended answer only when evidence supports it or it is safely labeled as an assumption.

Run-local question format:

```text
question:
recommended_answer:
why_recommended:
source_tag:
consequence_if_chosen:
consequence_if_not_chosen:
write_target: Summary | Problem Frame | Current System Snapshot | Change Delta | Requirements | Acceptance Examples | Scope Boundaries | Evidence And Assumptions | Outstanding Questions | Glossary | Decision Notes | Actors | Use Cases | Interaction Requirements | Exception Handling | Negative Acceptance | Data / Compliance Boundaries | Release / Operation Readiness | Goals / Success Metrics | Feature Slices
```

This format is for asking the owner, not a third persistent field set. Persist the result into existing PRD-local sections. If it lands in `Decision Notes`, map it back to the existing fields: `question`, `recommended_answer`, `source_tag`, `chosen_answer`, `consequence`, and `deferred_reason`. Fold `why_recommended`, `consequence_if_chosen`, and `consequence_if_not_chosen` into `consequence` prose when useful. If it lands in `Glossary`, `Evidence And Assumptions`, or `Outstanding Questions`, compress it into that section's existing fields and do not add new fields. Do not create `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/` by default in normal PRD mode; use `grill-with-docs-integration.md` when inline context or ADR updates are requested or required.

## Default Clarification Posture

Rough PRD, draft, `reference-claims`, `resume-prd`, `pure-text`, multi-source notes, screenshots/OCR, meeting notes, or chat logs default to `grill-with-docs-integration.md` after source-first evidence calibration. A high-severity `material-gaps` or `blockers` diagnosis is not required to trigger grilling; the workflow grills first so the final PRD template is complete enough for planning. Use compact output only when source-first reads have already closed the relevant requirements and no owner interview is needed.

This is a default interaction posture, not a new artifact class. The run-local map, questions, owner answers, accepted assumptions, and resolved source evidence still fold back into PRD-local sections.

## Pre-PRD Clarification Loop

Use this loop for rough PRD, draft, `reference-claims`, `resume-prd`, or `pure-text` input whenever product/system anchors are sufficient for PRD refinement. It is the PRD-local pressure loop that drives source-first grilling before the standard PRD rewrite; it is not a new workflow node, report, schema, JSON contract, state machine, or persistent extraction artifact.

Run it after PRD Sanitization and source/current-state evidence calibration, before final PRD rewrite and final readiness. Maintain a run-local shared understanding map:

```text
claim -> evidence/source -> gap -> question_or_assumption -> PRD write target
```

The map is authoring scratch. It can guide questions and rewrite targets, but it must not be copied into the PRD as a durable field set.

Trigger when a rough PRD lacks load-bearing clarity for actor, beneficiary, observable behavior, flow, state, permission, exception/failure, negative acceptance, scope boundary, priority/degrade semantics, release slice, or decision intersection. If the draft lacks target user, product problem, system anchor, or core scenario, route to brainstorm instead of pretending `create|refine` can close 0-1 discovery.

Do not ask owner questions for implementation HOW, source-answerable facts, minor wording polish, pure terminology already covered by Domain Grill, low-risk assumptions, or broad product discovery. Already planning-ready PRDs may skip owner grilling only after source/current-state evidence confirms the PRD template has no unresolved planning-invention risk.

### Progressive Detail Ladder

Use the full clarification layer needed to make the standard PRD template planning-ready, and stop only when planning-invention risk is closed or explicitly blocked:

| Level | Trigger | Stop condition | Output |
| --- | --- | --- | --- |
| L0 source-resolved PRD | Anchored input whose relevant requirements, acceptance, scope, evidence, and assumptions are already confirmed by source/owner context | PRD can be written without owner interview and without planning inventing WHAT | Compact or normal PRD using the standard core sections |
| L1 shared understanding map | Rough claim needs source/gap/write-target alignment | Load-bearing gaps are resolved, assumed, or escalated | Run-local shared understanding map |
| L2 large-input Map-Reduce | Oversized, multi-source, PDF/screenshot/meeting/chat mix, or too large for reliable whole-document judgment | Reduced candidates preserve source refs and conflicts | Run-local Map rows and Reduce outputs |
| L3 P0 packs | Problem/outcome, metric, NFR, trace, or owner closure affects planning invention | P0 gap is resolved, assumed, questioned, or blocked | PRD-local core/conditional section updates |
| L4 P1 packs | Actor/design/release/change-management signal is consequential | Conditional detail is captured or explicitly deferred | PRD-local conditional section updates |
| L5 deep-grill or blocker / route-out | Any PRD authoring/refinement input whose standard-template sections still depend on owner decisions, interacting gaps, source/user contradiction, or unresolved decision set | Anchored gaps run through `grill-with-docs-integration.md`; unanchored or non-adjudicable gaps have an explicit route and no `ready-for-planning` is emitted | Guided one-question-at-a-time owner adjudication with progress state, or prioritized blocker cluster with assumptions and affected write targets |

Preliminary Diagnosis selects this layer. It cannot emit final `ready-for-planning`; only Final Readiness Diagnosis after rewrite and closure can do that.

### Large-Input Map-Reduce Discipline

For large or multi-source rough PRDs, do not summarize chunks and treat the summary as truth. Use source-ref preserving Map-Reduce as run-local LLM-owned authoring discipline:

1. Map chunk-level requirement atoms and keep `source_ref`, evidence tag, confirmation posture, claim, actor/flow/state, gap, and write-target candidate.
2. Shuffle semantically by actor, flow, feature, data object, state, permission, exception, PRD section, and source contradiction.
3. Reduce duplicates into canonical requirement candidates while preserving conflicting refs, deduped assumptions, load-bearing gaps, prioritized blocker clusters, and owner question candidates that each name a gap, source attempt, and write target.

Run-local scratch shapes:

```text
Map row = source_ref / claim / actor / flow / state / gap / evidence_tag / confirmation_posture / write_target_candidate
Reduce output = canonical_requirement / supporting_refs / conflicts / assumptions / load_bearing_gap / owner_question_candidate / affected_write_targets
```

These shapes are prompt/reference guidance only. They are not schemas, artifacts, JSON contracts, durable PRD fields, or script output requirements. Scripts may report deterministic structure, counts, literal drift, or trace gaps, but must not decide semantic completeness, load-bearing status, or readiness.

For oversized, multi-source, or resume-risk PRDs, load `large-input-checkpoint.md`: Reduce output feeds Product Expert Lens `downstream_confirmation_risk` ordering, and reduced candidates are checkpointed into normal PRD sections with source refs instead of a transcript or progress schema.

### Load-Bearing Gap Triage

Before asking, sort gaps by acceptance impact, behavior/scope irreversibility, number of affected PRD sections, source contradiction, and release/planning consequence. This triage is **ordering, not filtering**: it decides which gap to grill first, never which load-bearing gap to skip. Resolve source/docs/tests/contracts/glossary/prior-PRD-answerable gaps first. Owner questions are for product decisions, not facts already available from source.

Normal PRD authoring/refinement asks load-bearing questions one at a time using the run-local question format above, relentlessly by default. A question is allowed only after a source attempt. A load-bearing gap that does not yet bind to a PRD write target is not dropped — keep grilling to bind it or carry it visibly. If any standard-template section still depends on owner adjudication and the target surface is anchored, load `grill-with-docs-integration.md` and continue one-question-at-a-time. A branch stops only at a legal stop point in SKILL.md `Canonical: 四个合法停点`. If the anchor is missing, the issue is broad product discovery, or no defensible question sequence exists, `route-out` to a prioritized blocker cluster with recommended route, acceptable assumptions when defensible, and affected write targets ("would only expand scope" / "does not affect the current release slice" reorders, it is not by itself a stop). Do not mark the PRD `ready-for-planning` until every load-bearing branch reaches a Canonical stop point.

### Deep Requirements Grill

For PRD authoring/refinement, apply these seven `grill-with-docs` actions to every requirement branch that can affect the standard PRD template, with special attention to load-bearing WHAT and planning-readiness gaps:

1. Keep one-question-at-a-time progression, relentlessly by default: progress one owner question at a time and walk down each branch until it reaches a legal stop point in SKILL.md `Canonical: 四个合法停点`.
2. Provide `recommended_answer` and `why_recommended` whenever defensible.
3. Perform source/code/docs/tests/contracts lookup before asking owner; inspect glossary and prior PRDs when relevant.
4. Run a glossary conflict challenge against existing glossary/context wording instead of normalizing drift.
5. Use fuzzy term sharpening to turn overloaded words into observable actor/flow/state/scope language.
6. Use concrete scenario stress for happy path, permission/state boundary, exception/failure, and negative acceptance, only when the scenario can affect acceptance, scope, terminology, or a boundary decision.
7. Perform code contradiction surfacing with evidence tags and consequences.

Every load-bearing branch must reach a legal stop point defined in SKILL.md `Canonical: 四个合法停点` before planning (with `Outstanding Questions` / accepted assumption / blocker cluster as the visible residue of an owner-capped or route-out branch). Track the closure state in run-local progress and persist only the resolved content into PRD-local sections. If any load-bearing branch with reachable sub-decisions has not reached a Canonical stop point — including an owner who has not capped it — the PRD is not `ready-for-planning`; when the owner gives no cap/continue signal, fall back to checkpoint per Canonical.

Domain Grill and Pre-PRD Clarification share cadence and source-first discipline but have different centers of gravity: Domain Grill handles terminology, source/user/glossary contradiction, source-of-truth, ownership, permission/state/exception edges, and hard product boundaries; Pre-PRD Clarification handles rough PRD completeness, scenario coverage, acceptance, scope, and write-target closure.

## Grill-With-Docs Integration Trigger

Load `grill-with-docs-integration.md` when the user explicitly names `grill-with-docs`, asks for sustained grilling, asks to update `CONTEXT.md` / ADRs inline, or when a PRD authoring/refinement run has any owner-adjudicated requirement branch left after source-first evidence calibration. This includes multiple load-bearing owner decisions, source/user contradictions, terminology or ownership affecting PRD sections, decision-tree dependencies, or ordinary rough requirements that need one-question-at-a-time closure before the standard PRD can be written.

In this mode:

- interview the owner one question at a time and wait for feedback before continuing
- provide a recommended answer for each question whenever defensible
- answer source-answerable questions by reading source/docs/tests/contracts instead of asking the owner
- challenge glossary conflicts immediately
- sharpen fuzzy terms into canonical project language
- stress concrete scenarios across happy path, permission/role boundary, state transition, exception/failure, negative acceptance, and cross-context handoff
- skip low-value questions that are source-answerable, only expand scope, or do not change the current release slice
- surface code contradictions with evidence and consequences
- update the relevant `CONTEXT.md` inline when a project-specific term is resolved
- create `CONTEXT.md` / `CONTEXT-MAP.md` lazily only when there is resolved content to write
- create ADRs only when the decision is hard to reverse, surprising without context, and a real tradeoff
- fold the same resolved facts into PRD-local sections so downstream planning can proceed from the PRD without inventing WHAT

Do not treat this mode as an implementation plan or coaching transcript. Its durable outputs are the PRD plus any directly updated source context files named in closeout.

## Decision Notes

Use a lightweight note for material decisions:

```text
question:
recommended_answer:
source_tag:
chosen_answer:
consequence:
deferred_reason:
```

In normal PRD mode, suggest a future ADR-like artifact only when all three conditions hold:

- hard to reverse
- surprising without context
- reflects a real tradeoff

Otherwise, keep the decision local to the PRD. In triggered `grill-with-docs` mode, create the ADR inline under `grill-with-docs-integration.md` when those same three conditions hold.

## Context / ADR Topology Adapter

Read existing `CONTEXT.md`, `CONTEXT-MAP.md`, context-specific `CONTEXT.md`, and `docs/adr/**` as optional evidence and topology for normal PRD authoring. During source-first evidence calibration, read existing topology only when it exists and is relevant to the PRD topic. If it does not exist in normal mode, record graceful no-topology fallback and continue with PRD-local closure. In triggered `grill-with-docs` mode, missing topology is not a blocker because context and ADR files are created lazily when the first resolved term or ADR-worthy decision exists.

Context routing:

- single relevant context: use it as advisory evidence for glossary/decision conflicts
- multiple contexts plus `CONTEXT-MAP.md`: route by the map and record the evidence source
- multiple contexts with unclear topic ownership: ask at most one owner/context routing question or record the ambiguity as a blocker
- no topology in normal mode: do not create `CONTEXT.md`, `CONTEXT-MAP.md`, or ADR as a prerequisite
- no topology in triggered `grill-with-docs` mode: create only the specific `CONTEXT.md` or ADR path needed for resolved content, following `grill-with-docs-integration.md`

PRD-local persistence remains required. Stable term decisions land in `Glossary`, with avoid terms or explanatory prose when useful. Hard decisions and consequences land in `Decision Notes`, `Evidence And Assumptions`, or `Scope Boundaries`. In normal mode, project-level promotion is a preview-first candidate after PRD-local closure, not a substitute for closure. In triggered `grill-with-docs` mode, resolved terms and ADR-worthy decisions also update the relevant context or ADR file inline.

In normal mode, suggest a `CONTEXT.md` promotion candidate only when the term is project-specific, owner accepted, repeated in the current PRD/source or cross-team relevant, and has a clear definition plus avoid terms. Suggest an ADR promotion candidate only when the decision is hard to reverse, surprising without context, and a real tradeoff. ADR candidates should stay sparse: context, decision, why, and alternatives/consequences only when useful, with PRD source refs.

Never silently create or edit `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/**` during ordinary PRD output. In triggered `grill-with-docs` mode, the owner answer, accepted recommendation, or confirmed source evidence that resolves a term or ADR-worthy decision is the confirmation for that specific inline update. Missing normal-mode promotion does not block planning unless the underlying term or decision remains unresolved in the PRD.
