# Core Plan Template

Use this reference during Phase 4 when writing a new plan. Omit clearly inapplicable optional sections, especially for Lightweight plans.

Use `## Summary` for new plans. When reading, editing, or deepening older plans, treat `## Overview` as the legacy name for the same framing slot. Use `## Requirements` for new plans, while continuing to read legacy `## Requirements Trace` as equivalent input.

```markdown
---
title: [Plan Title]
type: [feat|fix|refactor]
status: active  # active | partially-shipped | completed | superseded
date: YYYY-MM-DD
spec_id: YYYY-MM-DD-NNN-<slug>
origin: docs/brainstorms/YYYY-MM-DD-NNN-<slug>-requirements.md  # include when planning from a requirements doc
origin_grade: prd | brainstorm | legacy  # set from Phase 0.2 candidate discovery; visible to downstream workflows, not a gate
deepened: YYYY-MM-DD  # optional, set when the confidence-first check substantively strengthens the plan
implements_schemas: []  # optional; include only repo-relative contract schema paths this plan actually implements
---

# [Plan Title]

## Summary

[1-3 line prose summary — what this plan proposes and how it approaches the work. Forward-looking, not a recap of the problem.]

---

## Decision Brief

<!-- Optional for Lightweight plans. Include for Standard/Deep plans when the first human pass
     should see the recommended approach, key decisions, validation focus, largest risks, or
     scope boundaries before dense evidence and implementation detail. This section summarizes
     and points to the detailed sections below; it does not replace Summary, Key Technical
     Decisions, Risks & Dependencies, Direct Evidence, or Implementation Units. -->

- **Recommended approach:** [The approach in one or two sentences, with the key reason.]
- **Key decisions:** [The load-bearing choices to inspect below, not a duplicate KTD list.]
- **Validation focus:** [The checks, tests, or evidence that matter most.]
- **Largest risks / boundaries:** [The highest-risk failure mode, scope boundary, or deferred edge.]

---

## Problem Frame

[Summarize the user/business problem and context. Reference the origin doc when present.]

---

## Requirements

- R1. [Requirement or success criterion this plan must satisfy]
- R2. [Requirement or success criterion this plan must satisfy]

<!-- Origin trace sub-blocks: include only when the upstream requirements doc supplies the
     corresponding section. Each sub-block is independent — include only the ones that apply.
     Omit cleanly (no header, no empty line) when no origin doc exists or the origin had no
     Actors / Key Flows / Acceptance Examples sections. -->

**Origin actors:** [A1 (role/name), A2 (role/name), …]
**Origin flows:** [F1 (flow name), F2 (flow name), …]
**Origin acceptance examples:** [AE1 (covers R1, R4), AE2 (covers R3), …]

---

## Assumptions

<!-- Optional. Include only for unconfirmed inferred bets, especially in headless/non-interactive planning.
     Keep these out of Key Technical Decisions and Implementation Units until the user confirms them. -->

- A1. [Unconfirmed inference or assumption that shaped this plan]

---

## Scope Boundaries

- [Explicit non-goal or exclusion]

<!-- Optional plan-local subsection — include when this plan's implementation is intentionally
     split across other PRs, issues, or repos. Distinct from origin-carried "Deferred for later"
     (product sequencing) and "Outside this product's identity" (positioning). -->
### Deferred to Follow-Up Work

- [Work that will be done separately]: [Where or when — e.g., "separate PR in repo-x", "future iteration"]

---

## Completion Criteria

<!-- Optional. Include when the plan implements contract schemas, runtime generation, or other
     source-owned artifacts where "completed" could be confused with "producer exists but
     workflow is not integrated". List the concrete schema flags, contract statuses, runtime
     source assets, or follow-up gates that must be true before frontmatter can move to
     `status: completed`. If the plan intentionally ships only part of the behavior, use
     `status: partially-shipped` and explain the remaining gate here or in the status note. -->

- [Concrete condition that must be true before this plan is `completed`]

---

## Direct Evidence Readiness

- target_repo:
- evidence_sources: [direct source reads, rg, ast-grep, git diff, tests/logs, user-provided evidence]
- source_refs:
- current_revision:
- worktree_status:
- confidence:
- limitations:

---

## Direct Evidence

- repo_scope:
- source_reads_completed:
- source_reads_required:
- commands_or_tools_used:
- impact_on_plan:
- key_findings:
- limitations:

---

## Context & Research

### Relevant Code and Patterns

- [Existing file, class, component, or pattern to follow]

### Institutional Learnings

- [Relevant `docs/solutions/` insight]

### External References

- [Relevant external docs or best-practice source, if used]

---

## Key Technical Decisions

- [Decision]: [Rationale]

---

## Open Questions

### Resolved During Planning

- [Question]: [Resolution]

### Deferred to Implementation

- [Question or unknown]: [Why it is intentionally deferred]

---

<!-- Optional: Include when the plan creates a new directory structure (greenfield plugin,
     new service, new package). Shows the expected output shape at a glance. Omit for plans
     that only modify existing files. This is a scope declaration, not a constraint —
     the implementer may adjust the structure if implementation reveals a better layout. -->
## Output Structure

    [directory tree showing new directories and files]

---

<!-- Optional: Include this section only when the work involves DSL design, multi-component
     integration, complex data flow, state-heavy lifecycle, or other cases where prose alone
     would leave the approach shape ambiguous. Omit it entirely for well-patterned or
     straightforward work. -->
## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

[Pseudo-code grammar, mermaid diagram, data flow sketch, or state diagram — choose the medium that best communicates the solution shape for this work.]

---

## Implementation Units

<!-- Each unit carries a stable plan-local U-ID (U1, U2, …) assigned sequentially.
     U-IDs are never renumbered: reordering preserves them in place, splitting keeps the
     original U-ID and assigns the next unused number to the new unit, deletion leaves
     a gap. This anchor is what spec-work references in blockers and verification, so
     stability across plan edits is load-bearing. -->

### U1. [Name]

**Goal:** [What this unit accomplishes]

**Requirements:** [R1, R2]

**Dependencies:** [None / U1 / external prerequisite]

**Files:**
- Create: `path/to/new_file`
- Modify: `path/to/existing_file`
- Test: `path/to/test_file`

**Approach:**
- [Key design or sequencing decision]

**Execution note:** [Optional test-first, characterization-first, or other execution posture signal]

**Technical design:** *(optional — pseudo-code or diagram when the unit's approach is non-obvious. Directional guidance, not implementation specification.)*

**Patterns to follow:**
- [Existing file, class, or pattern]

**Test scenarios:**
<!-- Include only categories that apply to this unit. Omit categories that don't. For units with no behavioral change, use "Test expectation: none -- [reason]" instead of leaving this section blank. -->
- [Scenario: specific input/action -> expected outcome. Prefix with category — Happy path, Edge case, Error path, or Integration — to signal intent]

**Verification:**
- [Outcome that should hold when this unit is complete]

---

## System-Wide Impact

<!-- For Standard/Deep plans that materially touch more than one client, backend, API/schema/event
     contract, data lifecycle, operational concern, or rollout path, add a compact surface-coverage
     note here. Enumerate only repo/product-real surfaces that were materially considered. Use
     `in-scope`, `out-of-scope: <reason>`, or `deferred: <owner/trigger>`. Omit irrelevant surfaces;
     do not include empty rows or a `not-applicable` state. Representative examples: App, H5,
     PC web, Admin, backend, data/API, events/jobs, observability, testing. -->

- **Interaction graph:** [What callbacks, middleware, observers, or entry points may be affected]
- **Error propagation:** [How failures should travel across layers]
- **State lifecycle risks:** [Partial-write, cache, duplicate, or cleanup concerns]
- **API surface parity:** [Other interfaces that may require the same change]
- **Surface coverage:** [Only when multi-surface: surface -> in-scope / out-of-scope: reason / deferred: owner or trigger]
- **Integration coverage:** [Cross-layer scenarios unit tests alone will not prove]
- **Unchanged invariants:** [Existing APIs, interfaces, or behaviors that this plan explicitly does not change — and how the new work relates to them]

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| [Meaningful risk] | [How it is addressed or accepted] |

---

## Documentation / Operational Notes

- [Docs, rollout, monitoring, or support impacts when relevant]

---

## Sources & References

- **Origin document:** `[docs/brainstorms/YYYY-MM-DD-<topic>-requirements.md](<origin-document-path>)`
- Related code: `<path or symbol>`
- Related PRs/issues: `#<number>`
- External docs: `<url>`
```

For larger `Deep` plans, extend the core template only when useful with sections such as:

```markdown
## Alternative Approaches Considered

- [Approach]: [Why rejected or not chosen]

---

## Success Metrics

- [How we will know this solved the intended problem]

---

## Dependencies / Prerequisites

- [Technical, organizational, or rollout dependency]

---

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| [Risk] | [Low/Med/High] | [Low/Med/High] | [How addressed] |

---

## Phased Delivery

### Phase 1
- [What lands first and why]

### Phase 2
- [What follows and why]

---

## Documentation Plan

- [Docs or runbooks to update]

---

## Operational / Rollout Notes

- [Monitoring, migration, feature flag, or rollout considerations]
```
