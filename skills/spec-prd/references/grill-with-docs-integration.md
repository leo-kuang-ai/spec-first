# Grill-With-Docs Integration

Load this reference when the user explicitly asks for `grill-with-docs`, asks for relentless PRD grilling, asks to update `CONTEXT.md` / ADRs while requirements are clarified, or when `spec-prd` is authoring/refining a PRD from rough PRD, draft, `reference-claims`, `resume-prd`, `pure-text`, multi-source notes, screenshots/OCR, meeting notes, or chat logs.

This reference preserves the original `grill-with-docs` behavior inside `spec-prd`. It is the default detailed clarification mode for PRD authoring/refinement. Compact PRD remains an output shape for already source-resolved increments, not a shortcut around requirements clarification; route-out/bypass remains available only when PRD authoring adds no durable WHAT value and the reason is explicit.

## Contents

- [Trigger Boundary](#trigger-boundary)
- [Embedded Upstream Source Snapshot](#embedded-upstream-source-snapshot)
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

Do not skip this mode merely because the input looks small. First perform source-first confirmation. If source evidence fully closes the relevant PRD write targets, produce the standard compact/normal PRD without owner interview. If any owner decision is still needed, continue the one-question-at-a-time session relentlessly by default; a branch stops only at a legal stop point defined in SKILL.md `Canonical: Four Legal Stop Points`.

## Embedded Upstream Source Snapshot

This section is the package-local source snapshot for the upstream benchmark. It makes `spec-prd` self-contained at runtime: agents read this reference, not `/Users/kuang/xiaobu/skills/...`, to recover the original `grill-with-docs` execution discipline. The snapshot anchors behavior only; the adapted `spec-prd` rules below remain the executable local contract. Do not expose these upstream files as separate public entrypoints, and do not copy their artifact topology over the PRD chain.

The embedded upstream snapshot is historical input, not mutation authorization. Any quoted instruction to create or update glossary/context/ADR files is superseded by the adapted candidate-only contract below.

Snapshot source paths and date:

- `/Users/kuang/xiaobu/skills/skills/engineering/grill-with-docs/SKILL.md`
- `/Users/kuang/xiaobu/skills/skills/productivity/grilling/SKILL.md`
- `/Users/kuang/xiaobu/skills/skills/engineering/domain-modeling/SKILL.md`
- snapshot_date: `2026-06-27`

### Upstream `grill-with-docs/SKILL.md`

```md
---
name: grill-with-docs
description: A relentless interview to sharpen a plan or design through source-first questions and concrete scenarios.
disable-model-invocation: true
---

Run a `/grilling` session, using the `/domain-modeling` skill.
```

### Upstream `grilling/SKILL.md`

```md
---
name: grilling
description: Interview the user relentlessly about a plan or design. Use when the user wants to stress-test a plan before building, or uses any 'grill' trigger phrases.
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing. Asking multiple questions at once is bewildering.

If a question can be answered by exploring the codebase, explore the codebase instead.
```

### Upstream `domain-modeling/SKILL.md`

```md
---
name: domain-modeling
description: Build and sharpen a project's domain model by clarifying terminology, boundaries, and decisions.
---

# Domain Modeling

Actively sharpen the domain model by challenging terms, inventing relevant edge-case scenarios, and making decisions explicit in the current requirements artifact.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"
```

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
- **Discuss concrete scenarios.** Invent scenarios that stress boundaries between concepts — happy path, permission/role edge, state transition, exception/failure, negative acceptance, and cross-context handoff — for each load-bearing requirement before it reaches a Canonical stop point. Each scenario must either expose a gap (routed to an Outstanding Question, blocker, or `checkpoint-prd`) or confirm a named PRD write target; a scenario that neither exposes a gap nor confirms a target is ceremony and is skipped. Do not skip scenario invention on a branch that has not reached a legal stop point in SKILL.md `Canonical: Four Legal Stop Points`; "the requirement looks settled" is not a stop reason, it only reorders which scenario to run next.
- **Cross-reference with code.** When the user states current behavior, check source/docs/tests/contracts where feasible. If code contradicts the statement, surface the contradiction with evidence and ask which source should win.

Continue this loop relentlessly by default, walking down each branch. A branch stops only at a legal stop point defined in SKILL.md `Canonical: Four Legal Stop Points` (the owner-capped stop point includes the interactive soft-cap). "The next question would only expand scope" or "does not affect the current release slice" reorders questions, it does not stop a branch; only `route-out` (anchor missing, broad discovery, non-adjudicable) ends a branch without a Canonical stop point. When the owner gives no cap/continue signal, fall back to checkpoint per `Canonical: Four Legal Stop Points`, never silently emit ready.

## Context Topology

Read existing `CONTEXT.md`, `CONTEXT-MAP.md`, project glossary, and ADR files only as advisory calibration sources when relevant. A filename, age, or canonical label does not automatically override the PRD-local meaning. Missing topology never blocks planning after the PRD closes the current release meaning.

Never create or update topology in this workflow. If cross-release reuse is qualified, the candidate records the target kind/path that a later explicit knowledge-maintenance or document-editing request may choose to use.

## CONTEXT.md Format

Close the current release terminology in the PRD-local `Glossary`, `Decision Notes`, or `Evidence And Assumptions`. A project-level context candidate is candidate-only and not written by this workflow.

When qualified, use this candidate shape:

```md
target kind/path: <CONTEXT/glossary path candidate>
proposed meaning: <definition or decision>
provenance: <PRD/source refs>
applicability scope: <where it applies>
real consumer: <who will use it>
reuse rationale: <why it belongs beyond this release>
invalidation condition: <what makes it stale>
write status: not written by this workflow
```

Keep definitions concise and domain-specific. Missing any qualification keeps the result PRD-local.

## ADR Format

Offer an ADR candidate only when all three conditions are true:

1. **Hard to reverse** - changing the decision later has meaningful cost.
2. **Surprising without context** - a future reader would wonder why the decision was made.
3. **Real tradeoff** - there were genuine alternatives and one was chosen for specific reasons.

If any condition is missing, keep the decision PRD-local. Even when all conditions hold, emit only the candidate shape above with an ADR target kind/path; never create or update the ADR in this workflow.

## Spec-PRD Persistence Rules

This mode adds durable PRD-local closure and candidate-only handoff; it does not replace the PRD artifact:

- Keep writing the PRD requirements artifact under `docs/brainstorms/*-requirements.md`.
- Fold resolved terms, decisions, source contradictions, assumptions, and blockers into PRD-local sections so `spec-plan` does not need to read context files to recover the requirements.
- Keep project-level files unchanged before and after create, refine, and validate runs.
- When a term or decision has qualified cross-release value, record the complete promotion candidate after PRD-local closure.
- Product confirmation authorizes PRD WHAT; it does not authorize project-level glossary/context/ADR mutation.
- Record candidate targets and `not written by this workflow` in the PRD closeout summary.
- Do not edit generated runtime mirrors (`.claude/`, `.codex/`, `.agents/skills/`) as part of this mode.
