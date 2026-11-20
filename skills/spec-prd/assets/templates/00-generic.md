# <Feature name>: Incremental Product Requirements

Use this body for every PRD. Compose frontmatter, machine-owned sections, readiness receipts, and finalize fields from `references/prd-output-template.md`; do not prefill them here. Write the deliverable in the user's language. Retain canonical section identities when localizing headings.

Include every **[core]** section. Expand **[conditional]** sections when the scope or risk calls for them. Add one primary surface template; add secondary templates only for genuine mixed-surface requirements. Load `../overlays/securities.md` only when the input, project sources, or current user establish a securities or trading context.

Describe product behavior, rules, scope, and acceptance, not database schemas, API field designs, file edits, tasks, or technology choices. Those belong to `spec-plan`. Ask the user in the current conversation for any human decision. Legal, compliance, and technical materials can supply evidence, not a second interview route.

---

<!-- prd:section=summary -->
## Summary [core]

Start with who does what today, what changes, and which existing behavior stays the same. Tie each open product decision to an affected scenario. Do not reopen settled questions or add a second executive summary.

> Example: Operations staff currently open each deposit individually to see its review note. The list will show that note without changing edit permissions. One decision remains: should people without read access see an explanation or no column at all?

## PRD Metadata [core]

| Field | Value |
| --- | --- |
| Requirement name | |
| Requirement ID / `spec_id` | |
| Business domain | Project capability or module |
| Target surface | App / H5-PC / Admin / Backend / Mixed / Generic |
| Region, market, or tenant | State when not applicable |
| Target users or customer types | |
| Payments, funds, or trades affected? | Yes or no; identify the impact |
| Personal or sensitive data affected? | Yes or no; name the data and masking requirements |
| External rules or professional review needed? | Yes, no, or open; cite the source or confirmation condition |
| Related documents | Prototype, design, previous requirements, business rules, or third-party policy |

## Change Delta [core]

Distinguish new requirements from existing capabilities. Describe what remains unchanged, what differs, and who is affected; “as before” is not sufficient.

| Change | Behavior | Existing capability | User, data, or operational impact | Evidence tag |
| --- | --- | --- | --- | --- |
| keep | | | | |
| extend | | | | |
| replace | | | | |
| remove | | | | |
| unknown | | | | |

Use `confirmed-source` for inspected code, tests, or docs; `user-stated` for an explicit statement; `source-candidate` for an unconfirmed lead; `external-research` for dated external sources; and `assumption` for an inference. Instead of “improve the user list,” say “add bulk disable, retain existing filtering and pagination, and enforce permissions and audit logging.” Cite the evidence for each retained behavior.

## Requirements [core]

Give each independently testable behavior an ID. Use the EARS form: when a trigger occurs, the actor or system shall produce an observable outcome.

| ID | Trigger | Actor | System behavior | User-visible result | Evidence or constraint |
| --- | --- | --- | --- | --- | --- |
| R-01 | | | | | |
| R-02 | | | | | |

Number business rules separately (`BR-001`, `BR-002`). Replace vague terms such as “better” or “appropriate” with a quantity, state, or boundary. Example: when an administrator selects one or more users and confirms bulk disable, the selected accounts become disabled, their rows show the new status, and an audit entry records the action.

Assign each requirement a priority (P0/P1/P2 or MoSCoW). Specify what may be reduced and what blocks release. For security, privacy, compliance, funds, or irreversible changes, explicitly resolve whether any fallback is acceptable; do not infer one from this template.

| ID | Priority | Acceptable fallback | Blocks release? |
| --- | --- | --- | --- |
| R-01 | P0 / Must | | Yes / No |
| R-02 | | | |

## Scope Boundaries [core]

### In scope

- <Behavior included in this release>

### Non-goals

- <Behavior deliberately excluded>

### Related modules or requirements

- <Named document and section; avoid “see above”>

### Regional, market, and tenant differences

| Difference | Default rule | Region, market, or tenant A | Region, market, or tenant B | In scope? |
| --- | --- | --- | --- | --- |
| Available capabilities | | | | |
| Permissions and data access | | | | |
| Time and time zones | | | | |
| Wording and rules | | | | |
| Billing and settlement | | | | |

## Acceptance Examples [core]

Give each core requirement at least one positive and one exceptional case. Link every example to the requirement it tests. Use Given/When/Then or an equivalent EARS statement.

```text
AE-01 (R-01): Given <initial state>, when <action>, then <observable result>.
AE-02 (R-01): Given <initial state>, when <invalid action>, then <rejection and feedback>, with no unintended state, data, or audit effects.
```

Where relevant, cover duplicate submissions, conflicting states, timeouts, partial success, cancellation, limited permissions, legacy data or clients, and regional differences.

## Evidence And Assumptions [core]

Record unsupported metrics, customer feedback, rules, wording, and regulatory interpretations here, not as established facts.

| Claim | Evidence tag | Source or reasoning | How to confirm |
| --- | --- | --- | --- |
| | confirmed-source / user-stated / source-candidate / external-research / assumption | | Source or current user |

For permissions, user data, funds, trading, audits, or compliance, state access boundaries, sensitivity, and applicable rules. Move unresolved decisions to Outstanding Questions.

## Problem Frame [conditional]

Describe the present user or operational problem or external change. What would inaction cost users, operations, support, or risk management? What improvement would matter? Keep implementation out of this section.

## Goals / Success Metrics [conditional]

| Goal | Desired outcome | Measure | Data source |
| --- | --- | --- | --- |
| Business | | | |
| User | | | |
| Risk or compliance | | | |
| Operational efficiency | | | |

Acceptance examples establish whether the behavior is correct before release. Success metrics show whether the user's problem diminishes after release. Without a trustworthy baseline, name an observable signal or record the unknown; do not invent a target.

## Current System Snapshot [conditional]

| Existing capability, flow, route, role, state, exception, or setting | Observed behavior | Evidence tag |
| --- | --- | --- |

Use the snapshot to constrain requirements, identify reuse, and expose risks, never to expand product scope.

## Glossary [conditional]

| Term | Meaning | Source |
| --- | --- | --- |

## Domain Model and Core Entities [conditional]

For related business objects, describe product meaning and relationships, not tables, types, or foreign keys. Add a small relationship diagram when it clarifies ownership or cardinality.

| Entity | Business meaning | Product attributes | Relationship to other entities |
| --- | --- | --- | --- |

## Actors [conditional]

| Role | Scenario | User goal | Permissions and data boundaries |
| --- | --- | --- | --- |

## Use Cases [conditional]

### UC-01 <Use case>

- Actor and trigger:
- Precondition:
- Main path:
- Alternative or error path:
- Outcome:
- Covers: R-01

## Interaction Requirements [conditional]

Required for user interactions. Describe entry points, feedback, confirmation and cancellation, empty/loading/error states, accessibility, and localization. For payments, irreversible actions, sensitive submissions, or elevated access, specify confirmation, the result of cancellation, and the audit trail.

| Element | Required? | Display or interaction | Wording | Risk or constraint |
| --- | --- | --- | --- | --- |

## Data / Compliance Boundaries [conditional]

Required for personal information, payments or trading, audits, exports, or regulated records.

| Record | Classification | Visibility or masking | View, edit, or export rules | Audit and retention | Open question |
| --- | --- | --- | --- | --- | --- |
| User identity | Personal or sensitive | | | | |
| Business record | Operational | | | | |
| Payment or trade | Financial | | | | |
| User confirmation | Compliance or product decision | | | | |
| Operation log | Audit | | | | |

## Exception Handling [conditional]

When exceptional paths apply, cover empty or excessive input, state conflicts, timeouts, duplicate submissions, partial success, cancellation or rollback, insufficient access, ineligible users, and invalid time windows as appropriate.

| Scenario | System behavior | User feedback | Retry allowed? | State, data, or audit effects |
| --- | --- | --- | --- | --- |

## Release / Operation Readiness [conditional]

Use for staged rollout, configuration, runbooks, specialist review, legacy data, batch processes, or third-party rules.

| Item | Decision or status | Evidence or decision path | Blocks release? |
| --- | --- | --- | --- |
| Required professional review | Approved / pending / not applicable | | |
| Rollout strategy | | | |
| Old client compatibility | | | |
| Existing data | | | |
| Operations runbook | | | |
| Customer support guidance | | | |
| User experience after rollback | | | |

## Dependencies / Constraints / Risks [conditional]

Required for external dependencies or high-risk changes; omit for a small independent increment. Describe product dependencies, not interface designs or middleware choices.

| Dependency | Team, system, or approver | Required action | Blocks start? | Status |
| --- | --- | --- | --- | --- |

Name regulatory restrictions, deadlines, budgets, resource constraints, and user-visible compatibility requirements. For each delivery risk, state its impact and mitigation or explicit acceptance.

## Nonfunctional Requirements [conditional]

Required for critical paths, high traffic, large volumes, availability-sensitive behavior, or security and compliance needs. State user-observable requirements rather than implementation choices.

| Dimension | Product requirement | How to measure | Blocks release? |
| --- | --- | --- | --- |
| Latency | Confirmation, refresh, or first screen | | |
| Capacity | Peak concurrency and data volume | | |
| Continuity | Availability windows, degradation, recovery | | |
| Security | Authentication, authorization, masking, replay or tamper protection | | |
| Privacy and compliance | Data minimization, residency, audit | | |
| Observability | Monitoring, alerting, traceability | | |
| Accessibility and localization | Large fonts, assistive technology, languages, regional formats | | |

## Data Retention [conditional]

Required for long-lived business, consent, audit, or reporting records. Cite a source or a current-user decision for retention, export, archival, and disposal. Move unresolved terms to Outstanding Questions.

| Record | Retention period or decision condition | Who can query it? | Action at expiry | Evidence tag |
| --- | --- | --- | --- | --- |

## Requirements Traceability Matrix [conditional]

For medium, large, or high-risk changes, map each requirement to acceptance, constraints, and evidence so no requirement goes untested and no assumption becomes fact.

| Requirement | Rule | Acceptance | Constraint or risk | Evidence | Priority |
| --- | --- | --- | --- | --- | --- |
| R-01 | BR-001 | AE-01 | | | P0 |

## Required Review and Sign-off [conditional]

Follow project rules for regulated activity, funds, privacy, security, or specialist review. Sign-off is source evidence; it does not authorize contacting anyone other than the current user for product decisions.

| Reviewer | Subject | Approved, conditional, or pending | Basis | Signatory | Date | Blocks release? |
| --- | --- | --- | --- | --- | --- | --- |
| Compliance | | | | | | |
| Risk | | | | | | |
| Legal, if applicable | | | | | | |

## Open Question Candidates [conditional]

This is an authoring aid, not a machine section. Check sources first. Move only gaps that still affect behavior, acceptance, or scope into the single canonical `Outstanding Questions` section from `references/prd-output-template.md`. Ask the current user when a decision is needed.

| Gap | Source to check | PRD write target | Recommended answer or reason still open |
| --- | --- | --- | --- |

## Change History

| Date | Author | Change |
| --- | --- | --- |
| YYYY-MM-DD | <Name> | Initial draft |

## Handoff

- Recommend `spec-plan` only when the machine sections required by `references/prd-output-template.md` are present, the finalize/checker receipt is valid, and planning need not invent product behavior.
- Route completeness or consistency review to `spec-doc-review`.
- Refine unresolved behavior or record it in Outstanding Questions.
- Do not go directly to `spec-work`.
