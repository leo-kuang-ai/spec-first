# Product Expert Lens

Load this reference on the normal `spec-prd` authoring hot path before owner questions, Requirements Grill, PRD write-in, or readiness judgment.

This file is the single canonical source for product-expert judgment in `spec-prd`. Other references may consume its run-local interface, but they must not copy the full dimension list or create a second canonical lens.

## Responsibilities

- Identify the target actor, beneficiary, operator, admin, developer, downstream consumer, and product owner only when the distinction changes WHAT, acceptance, or scope.
- State the product outcome: what user-visible, operator-visible, or business-visible result changes after the increment.
- Detect load-bearing ambiguity across actor, trigger, happy path, state transition, empty/failure/permission cases, rollout slice, non-goals, metric, and acceptance. Also sniff two brownfield-specific ambiguities: referent ambiguity (a claim says "consistent with X / same as X" while the repo has multiple implementations, versions, or branches of X) and change-verb ambiguity (add / extend / replace / remove left unstated). These are recall sniff cues, not a per-requirement checklist; a hit binds to `PRD_write_target` through the run-local interface, and no hit is a legal outcome.
- Re-read every load-bearing requirement from two non-product seats in addition to the product seat: the implementer seat ("which unnamed interface availability, permission boundary, state, source-of-truth, or fallback would force me to invent product behavior?") and the test-author seat ("which requirement has no observable signal to write a pass/fail assertion against?"). Each seat yields either one concrete gap bound to `PRD_write_target` or an explicit `none-found`. `none-found` is legal only after the seat's counterfactual question has actually been run against that requirement's source / current-state evidence; declaring `none-found` without running it — or because the product seat already "looks settled" — is the premature-none-found failure, not a legal outcome. A `none-found` names the specific source / current-state evidence the seat checked, and when current-state evidence explicitly flags an unnamed or unresolved dependency (an interface marked "to be provided", a source-of-truth not yet named, a referent with multiple repo implementations), that seat cannot declare `none-found` until the dependency is bound or carried as a gap. This raises a fake `none-found` from self-narration to a citable claim a reviewer can open; it does not, and cannot, prove the seat truly examined the evidence — that stays the deferred artifact-truth ceiling, not something this lens gates. This is the existing `downstream_confirmation_risk` engine re-run from another seat — not a new dimension list, per-requirement matrix, checklist, persona, or dispatch.
- Challenge vague product terms before they reach PRD sections.
- Rank gaps by downstream confirmation risk, not by checklist completeness.
- Order owner questions by `downstream_confirmation_risk`; ranking sets which gap to grill first, not whether to keep grilling. Grilling continues by default until a branch reaches a legal stop point in SKILL.md `Canonical: Four Legal Stop Points`.
- Preserve accepted assumptions, owner decisions, blockers, and unresolved questions in PRD-local sections.
- Close with which downstream confirmations have been eliminated and which remain explicit handoff boundaries.

## Non-Responsibilities

- It does not invent market strategy, priority, industry obligations, or product scope without owner/source support.
- It does not replace `spec-brainstorm` for unresolved 0-1 product shape.
- It does not write implementation design, API schema, database changes, task breakdown, or test seams.
- It does not become a public workflow entrypoint.
- It does not create a second PRD artifact topology, issue tracker, transcript, or progress schema.

## Run-Local Interface

Extend the existing shared understanding map with this light run-local shape:

```text
downstream_confirmation_risk -> claim -> evidence/source -> gap
  -> owner_question_or_assumption -> PRD_write_target -> closure_state
```

Fields are authoring scratch, not persistent schema:

- `downstream_confirmation_risk` ranks what planning/work would otherwise have to confirm or invent first.
- `claim` is the user/source/design/current-state statement being judged.
- `evidence/source` records source, owner, design-source, prior artifact, or assumption posture.
- `gap` names the missing or contradictory WHAT.
- `owner_question_or_assumption` is either one source-backed owner question or a safe labeled assumption.
- `PRD_write_target` is the standard PRD section the answer will update.
- `closure_state` reuses the existing owner-question states: `closed`, `narrowed`, `accepted-assumption`, `owner-capped`, `outstanding-question`, `blocker`, or `route-out`.

Contract tests may lock the field anchors and consumption direction. They must not lock semantic sorting results, product judgment content, or exact question wording.

## Interface Invariants

- Every gap that enters Requirements Grill must bind to `PRD_write_target`.
- Risk -> PRD Write Target Map is a mandatory run-local interface before durable write-in: each load-bearing risk either names the PRD section it will update, becomes an owner question/accepted assumption/blocker, or routes out.
- A load-bearing gap that cannot yet bind to a write target is not dropped or parked as a stop reason: keep grilling to bind it, or carry it visibly as `Outstanding Questions`, blocker, accepted assumption, or route-out. "Not yet bindable" never ends a branch.
- `downstream_confirmation_risk` controls next-question ordering and handoff priority. It does not control whether to keep grilling — grilling continues by default until a branch reaches a legal stop point in SKILL.md `Canonical: Four Legal Stop Points`. It is not a score, enum, schema, or deterministic readiness verdict.
- Requirements Grill consumes only `gap + owner_question_or_assumption + PRD_write_target`.
- Standard PRD Write-In consumes only `PRD_write_target + closure_state`.
- Readiness consumes `closure_state` plus remaining handoff residue that would make planning/work invent WHAT.
- Load-bearing gaps that cannot be sorted still cannot disappear; carry them visibly.

## Product Judgment Dimensions

Use these dimensions to find gaps, then reduce them into the run-local interface above:

- user/problem/outcome clarity, including who benefits and what observable behavior changes
- current-state and code alignment, including confirmed source, source-candidate limits, contradictions, and missing active surfaces; this confirms current WHAT and evidence pointers, not HOW to change implementation
- requirement quality: atomic, necessary, prioritized, testable, implementation-free, and traceable to evidence
- acceptance coverage: happy path, exception path, negative acceptance, permissions, empty/loading/error, and cross-surface effects when relevant
- goals and metrics: a measurable definition, baseline/window when available, and no invented target values
- industry/domain overlay: compliance, money movement, privacy, safety, audit, and operational questions only when triggered
- scope and handoff entropy: non-goals, dependencies, rollout/ops boundaries, and remaining WHAT decisions

These dimensions adapt the question set; they do not relax source-first evidence or replace owner confirmation for scope-changing product decisions.

## Structured Input Synthesis

When the input is already a structured or decided PRD, design doc, issue summary, or conversation synthesis, do not re-ask source/owner-supported settled WHAT by default. First separate:

- scope, actor, outcome, acceptance, source-of-truth, and owner decisions that belong in standard PRD sections
- implementation, testing, API, schema, task, or rollout mechanics that are HOW unless they change scope, acceptance, or source-of-truth
- rejected ideas, thinking-aloud, superseded drafts, and unconfirmed claims that stay reference-claims

Write settled WHAT into normal PRD sections. Demote implementation-heavy or testing-heavy details to assumptions, design input, or planning context only when they affect WHAT. Any gap that lands in `Outstanding Questions` or `Planning Recheck` is not settled WHAT: attempt one grill question or record why this run cannot clarify it, such as true headless, missing source, or unavailable owner. This does not require re-asking source/owner-supported settled WHAT; source/owner-supported settled WHAT does not need to be re-asked. Do not introduce a named conversion adapter, fixed field map, or second output artifact.

## Design-Source Interface

When the target surface is front-end/UI and the input includes a design link, screenshot, exported design context, or interaction-state material, load `design-source-evidence.md`.

The Product Expert Lens consumes design-source evidence only as advisory input:

- design claims are `source-candidate` / `provider_untrusted` until reconciled with code/source or owner decision
- design facts can raise gaps for entry, state, copy, empty/error/loading, permission, i18n, accessibility, and acceptance examples
- PRD/design-source/source consistency audit remains a route-out to `spec-app-consistency-audit`
- unavailable tools degrade loudly to screenshot, exported context, local exported files, reference-claim, or owner description

Do not copy the detailed design-source protocol into this hot-path file.

## Large-Input Interface

When input is oversized, multi-source, or too large for reliable whole-document judgment, load `large-input-checkpoint.md`.

The Product Expert Lens consumes Reduce output from the existing Large-Input Map-Reduce flow instead of reading the whole input at once:

```text
Reduce output -> load_bearing_gap / owner_question_candidate / affected_write_targets
  -> downstream_confirmation_risk -> PRD_write_target -> closure_state
```

Reduced candidates remain source-ref preserving advisory material until confirmed. Cross-capability splits are semantic product boundaries suggested by the Lens and owner-confirmed before child PRDs are written. Do not create a chunking engine, vector reducer, persistent Map/Reduce artifact, or second progress file.

## Escalation To Product Reviewer

Use independent product-reviewer critique only for high downstream-risk triggers:

- multi-actor or cross-surface workflow
- permission, compliance, payment, data retention, or irreversible user action
- unclear target user or outcome metric
- owner/source contradiction that affects release scope
- broad release slice where the next question set exceeds a single inline grill loop
- polished PRD whose readiness still predicts downstream WHAT invention

Dispatch requires both host capability and explicit user/parent-workflow authorization for subagents, delegated review, parallel agents, or personas. If either is absent, stay inline and record the reason code: `dispatch_unavailable` or `dispatch_authorization_missing`.

Inline escalation is not self-congratulation. It must switch to an adversarial product-review posture and name at least one product risk plus the affected PRD write target, or explicitly record that no such risk was found from current evidence. Final judgment remains with the `spec-prd` orchestrator.
