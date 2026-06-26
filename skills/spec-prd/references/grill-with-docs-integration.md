# Grill-With-Docs Integration

Load this reference when the user explicitly asks for `grill-with-docs`, asks for relentless PRD grilling, asks to update `CONTEXT.md` / ADRs while requirements are clarified, or when `spec-prd` is authoring/refining a PRD from rough PRD, draft, `reference-claims`, `resume-prd`, `pure-text`, multi-source notes, screenshots/OCR, meeting notes, or chat logs.

This reference preserves the original `grill-with-docs` behavior inside `spec-prd`. It is the default detailed clarification mode for PRD authoring/refinement. Compact PRD remains an output shape for already source-resolved increments, not a shortcut around requirements clarification; route-out/bypass remains available only when PRD authoring adds no durable WHAT value and the reason is explicit.

## Contents

- [Trigger Boundary](#trigger-boundary)
- [Original Behavior Contract](#original-behavior-contract)
- [Source-First Session Rules](#source-first-session-rules)
- [Context Topology](#context-topology)
- [CONTEXT.md Format](#contextmd-format)
- [ADR Format](#adr-format)
- [Spec-PRD Persistence Rules](#spec-prd-persistence-rules)

## Trigger Boundary

PRD authoring keeps questions one-at-a-time and persists closure into the PRD. For `create` / `refine` inputs this mode is the **default relentless posture**, not a gated entry; the signals below are reinforcing triggers (they raise priority and depth), not an admission bar:

- the user explicitly asks to use `grill-with-docs`
- the user asks for sustained questioning, one question at a time, with feedback between questions
- the user asks to update `CONTEXT.md`, `CONTEXT-MAP.md`, or ADRs as decisions crystallize
- rough PRD, draft, `reference-claims`, `resume-prd`, `pure-text`, multi-source notes, screenshots/OCR, meeting notes, or chat logs are being turned into a PRD artifact
- a PRD appears source-resolved but still needs source-first confirmation before owner questions are skipped
- terminology, ownership, source-of-truth, hard product boundary, or decision-tree dependencies would make a compact PRD-local closure misleading
- source/code/docs evidence contradicts the user's framing and the contradiction needs owner adjudication plus durable glossary or decision capture
- PRD mode finds actor, flow, scope, acceptance, permission, release-slice, or decision-intersection questions that need guided owner adjudication
- multiple load-bearing PRD gaps interact, so asking only one static blocking question would leave planning to invent WHAT

Do not skip this mode merely because the input looks small. First perform source-first confirmation. If source evidence fully closes the relevant PRD write targets, produce the standard compact/normal PRD without owner interview. If any owner decision is still needed, continue the one-question-at-a-time session relentlessly by default; a branch stops only at a legal stop point defined in SKILL.md `Canonical: 四个合法停点`.

## Original Behavior Contract

Interview the owner relentlessly about every aspect of the plan or PRD until there is shared understanding. Walk down each branch of the design tree and resolve dependencies between decisions one by one.

For each owner question:

- Use the parent skill Interaction Method for every owner question; this mode still asks through the platform blocking question tool.
- ask exactly one question at a time
- wait for feedback before continuing to the next question
- provide a recommended answer whenever defensible
- explain the consequence of choosing or rejecting that recommendation when it affects WHAT, acceptance, scope, terminology, source-of-truth, or downstream planning
- bind the question to a named gap, the source attempt already made, and the PRD write target it will close or narrow

When called from `spec-prd`, consume Product Expert Lens ordering instead of copying its dimensions: take `gap + owner_question_or_assumption + PRD_write_target` from the Lens, ask the next source-backed owner question, then return closure state for PRD write-in and readiness.

If a question can be answered by exploring the codebase, explore the codebase instead of asking the owner. Source-answerable gaps are not owner questions.

## Source-First Session Rules

During the session, use the project language and docs as active constraints:

- **Challenge against the glossary.** When user wording conflicts with existing `CONTEXT.md`, `CONTEXT-MAP.md`, context-specific `CONTEXT.md`, `docs/contracts/domain-glossary.md`, or ADR wording, call it out immediately and ask which meaning is intended.
- **Sharpen fuzzy language.** When a term is vague or overloaded, propose a precise canonical term and list avoid terms or aliases.
- **Discuss concrete scenarios.** Invent scenarios that stress boundaries between concepts, including happy path, permission/role edge, state transition, exception/failure, negative acceptance, and cross-context handoff, only when the scenario can change acceptance, scope, terminology, or a boundary decision.
- **Cross-reference with code.** When the user states current behavior, check source/docs/tests/contracts where feasible. If code contradicts the statement, surface the contradiction with evidence and ask which source should win.

Continue this loop relentlessly by default, walking down each branch. A branch stops only at a legal stop point defined in SKILL.md `Canonical: 四个合法停点` (the owner-capped stop point includes the interactive soft-cap). "The next question would only expand scope" or "does not affect the current release slice" reorders questions, it does not stop a branch; only `route-out` (anchor missing, broad discovery, non-adjudicable) ends a branch without a Canonical stop point. When the owner gives no cap/continue signal, fall back to checkpoint per `Canonical: 四个合法停点`, never silently emit ready.

## Context Topology

Most repos have one context:

```text
/
+-- CONTEXT.md
+-- docs/
|   +-- adr/
|       +-- 0001-event-sourced-orders.md
|       +-- 0002-postgres-for-write-model.md
+-- src/
```

Repos with multiple contexts use a root `CONTEXT-MAP.md`:

```text
/
+-- CONTEXT-MAP.md
+-- docs/
|   +-- adr/
+-- src/
    +-- ordering/
    |   +-- CONTEXT.md
    |   +-- docs/adr/
    +-- billing/
        +-- CONTEXT.md
        +-- docs/adr/
```

Infer topology in this order:

1. If `CONTEXT-MAP.md` exists, read it and route to the matching context.
2. If only a root `CONTEXT.md` exists, use the root context.
3. If neither exists, create a root `CONTEXT.md` lazily when the first project-specific term is resolved.
4. If multiple contexts exist but ownership is unclear, ask one context-routing question before writing.

Create files lazily, only when there is something resolved to write. Do not create `CONTEXT.md`, `CONTEXT-MAP.md`, or `docs/adr/` as empty ceremony.

## CONTEXT.md Format

`CONTEXT.md` is a glossary and nothing else. Do not use it as a spec, scratch pad, implementation decision log, planning artifact, or repository for HOW.

When a term is resolved, update the relevant `CONTEXT.md` inline before continuing the interview. Do not batch resolved terms for the end.

Use this structure:

```md
# {Context Name}

{One or two sentence description of what this context is and why it exists.}

## Language

**Order**:
{A one or two sentence description of the term}
_Avoid_: Purchase, transaction

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
```

Rules:

- Be opinionated: pick the best term and list confusing alternatives under `_Avoid_`.
- Keep definitions tight: one or two sentences max.
- Define what the term IS, not what it DOES.
- Include only project/domain-specific terms. General engineering concepts such as timeout, retry, error type, cache, or pagination do not belong unless they are uniquely defined business concepts in this context.
- Group terms under subheadings when natural clusters emerge; otherwise keep a flat `## Language` section.

For multi-context repos, a root `CONTEXT-MAP.md` lists contexts and relationships:

```md
# Context Map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md) - receives and tracks customer orders
- [Billing](./src/billing/CONTEXT.md) - generates invoices and processes payments
- [Fulfillment](./src/fulfillment/CONTEXT.md) - manages warehouse picking and shipping

## Relationships

- **Ordering -> Fulfillment**: Ordering emits `OrderPlaced` events; Fulfillment consumes them to start picking
- **Fulfillment -> Billing**: Fulfillment emits `ShipmentDispatched` events; Billing consumes them to generate invoices
- **Ordering <-> Billing**: Shared types for `CustomerId` and `Money`
```

Only create or update `CONTEXT-MAP.md` when multiple contexts are actually needed and their relationships are known enough to record. A single small PRD increment does not need a map.

## ADR Format

Offer ADRs sparingly. Create or update an ADR only when all three conditions are true:

1. **Hard to reverse** - changing the decision later has meaningful cost.
2. **Surprising without context** - a future reader would wonder why the decision was made.
3. **Real tradeoff** - there were genuine alternatives and one was chosen for specific reasons.

If any condition is missing, do not create an ADR. Keep the decision in PRD `Decision Notes`, `Evidence And Assumptions`, or `Scope Boundaries`.

ADRs live in `docs/adr/` for system-wide decisions or the relevant context's `docs/adr/` for context-specific decisions. Create the directory lazily when the first ADR is needed. Scan existing ADRs for the highest number and increment it with `0001-slug.md`, `0002-slug.md`, and so on.

Minimal template:

```md
# {Short title of the decision}

{One to three sentences: what's the context, what did we decide, and why.}
```

Optional sections are allowed only when they add genuine value:

- `Status` frontmatter: `proposed`, `accepted`, `deprecated`, or `superseded by ADR-NNNN`
- `Considered Options`
- `Consequences`

Good ADR candidates include architectural shape, integration patterns between contexts, lock-in technology choices, ownership and scope boundaries, deliberate deviations from the obvious path, constraints not visible in code, and non-obvious rejected alternatives.

## Spec-PRD Persistence Rules

This mode adds durable context/decision updates, but it does not replace the PRD artifact:

- Keep writing the PRD requirements artifact under `docs/brainstorms/*-requirements.md`.
- Fold resolved terms, decisions, source contradictions, assumptions, and blockers into PRD-local sections so `spec-plan` does not need to read context files to recover the requirements.
- When a term is resolved, update `CONTEXT.md` inline before moving to the next question.
- When an ADR-worthy decision is resolved, create the ADR inline before moving to the next branch.
- Treat an owner answer, accepted recommendation, or confirmed source evidence as the confirmation for that specific glossary/ADR write. Do not create unrelated context files without a resolved term or decision.
- Record updated `CONTEXT.md`, `CONTEXT-MAP.md`, or ADR paths in the PRD closeout summary.
- Do not edit generated runtime mirrors (`.claude/`, `.codex/`, `.agents/skills/`) as part of this mode.
