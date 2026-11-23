# Spec-First Feedback Format

Use this shape when converting Riffrec evidence into a durable brainstorm or planning input.

## Finding

```markdown
### F1. <Short problem title>

- **Impact:** <Who was affected and how, or unassessed if the evidence does not show it>
- **Observed:** <What happened, grounded in transcript/events/screenshots>
- **Expected:** <Cite a stated expectation; label an inference or write unknown>
- **Evidence:** <Cite an available event, moment ID, quote, or frame; omit unavailable materials>
- **Confidence:** High/Medium/Low, with reason
- **Requirement candidates:** <Link supported candidates only; omit when there are none>
```

## Requirements Kickoff

```markdown
---
date: YYYY-MM-DD
topic: <topic>
---

# <Topic Title>

## Problem Frame

<Who is affected, what is changing, and why it matters.>

---

## Actors

- A1. User: <Role in the recorded workflow>
- A2. Product surface: <System under test>
- A3. Agent/assistant, if relevant: <Role in the workflow>

---

## Key Flows

- F1. Recorded feedback triage
  - **Trigger:** A Riffrec capture bundle is available for review.
  - **Actors:** A1, A2
  - **Steps:** <3-7 product steps seen in the recording>
  - **Outcome:** <What should be true after the fix>
  - **Covered by:** R1, R2

---

## Requirements

**Candidate product behavior (not confirmed by this capture)**
- R1. <Proposed behavior, linked finding, and what the owner still needs to confirm; omit if unsupported>

**Feedback evidence and reviewability**
- R2. <Requirement about making the issue observable or preventing recurrence>

---

## Acceptance Examples

- AE1. **Covers R1.** Given <state>, when <action>, <outcome>.

---

## Success Criteria

- <Human outcome>
- <Downstream agent handoff quality>

---

## Scope Boundaries

- <Deliberate non-goal>

---

## Key Decisions

- <Decision>: <Rationale>

---

## Dependencies / Assumptions

- <Material dependency or assumption>

---

## Outstanding Questions

### Resolve Before Planning

- <Only product questions that block planning>

### Deferred to Planning

- [Technical] <Questions better answered during codebase exploration>

---

## Next Steps

-> spec-brainstorm to confirm, correct, and regroup the captured requirements before any planning.
```

## Evidence Rules

- Prefer moment IDs and screenshot links over prose-only claims.
- Mark visual interpretation as an inference when the screenshot does not prove intent.
- Requirements should describe product behavior, not implementation details.
- Do not include absolute local paths in spec-first docs; use repo-relative paths when possible.
