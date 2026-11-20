# Admin / Middle-backend Surface Template

> Used in combination with `00-generic.md`, this specification only addresses the Admin surface aspects including roles, data scope, workflow, batch operations, export requirements, and audit requirements. The machine contract is provided by `references/prd-output-template.md`.
>
> All human-related questions are only directed to the currently executing conversation user. The securities industry rules are applied only after an industry signal is matched, then overlay `../overlays/securities.md`.

## Admin attribute confirmation

| Dimension | content |
| --- | --- |
| Use role | Operations / Customer Service / Review / Finance / Administrator / Other |
| Data range | Global / Organization / Tenant / Team / Self / Custom |
| Entry point | Menu / Workbench / List / Details / Approval Queue |
| Assignment type | Query / Configuration / Audit / Batch Processing / Export / Reports |
| Does it involve sensitive data | |
| Do you need to verify? | Single / Maker-Checker / Multi-level Approval / Not involved |

## Menus, Entry Points, and Visibility

| Entry point | Visible roles | Data range | Invisible / Disabled condition | Default landing point |
| --- | --- | --- | --- | --- |
| | | | | |

Distinguish among "menu not visible", "no permission upon entry", "button disabled", and "data not visible", and specify the user feedback for each state.

## Permission matrix

| Role | View | New | Edit | Review | Delete | Export | Batch operation | Sensitive fields |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | | |

PRD defines capabilities and data scopes, without specifying permission codes, interface fields, or authentication implementation.

## List and Search

| Dimension | Product requirements |
| --- | --- |
| Default sorting / pagination | |
| Search fields and matching methods | |
| Filter conditions and combinations | |
| Idle state / Unauthorized state / Error state | |
| Column display, hide, and de-identification | |
| Refresh and Real-time Performance | |
| Select pagination rule | |

## Details, Forms, and Validation

| Field / Group | Display conditions | Is it required? | Product validation | Edit permission | Error message |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Clear draft, submit, cancel, leave without saving, duplicate submission, concurrent editing, and expired data product outcomes.

## Workflow and Review

| Status | Executable role | Executable actions | Next state | Reject / Withdraw | Reasons visible to users |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

When maker-checker is required, clarify whether the initiator and reviewer can be the same person, what information the reviewer sees during review, how to re-submit after rejection, how to handle duplicate reviews, and how to manage timeout scenarios.

## Batch operation

| Operation | Select range | Upper limit / Boundary | Secondary confirmation | Partial success | Retry / Export Results |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Batch operations must undergo acceptance criteria including: "all successful", "all failed", "partial success", "re-execution", "insufficient permissions", and "leaving page while processing".

## Export and Reports

Specify exportable roles, fields, de-identification, inheritance of filters, data volume boundaries, generation timeliness, download validity period, failure notifications, and export audit. Do not specify a file generation library or storage implementation in the PRD.

## Operation logs and auditing

| Action | Operator | Object | Before and after values | Cause / Note | Time | Query role |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

## Operations and Support

Required for operations SOP, customer service scripts, manual compensation, exception escalation, or on-duty handling: write product-level trigger conditions, visible evidence, and end state.

## Admin supplemental acceptance

- Menu, page, button, field, and data scope permissions are consistent.
- List search, filter, sort, pagination, empty state, and unauthorized state.
- Workflow forward, rejection, withdrawal, duplicate submission, concurrent processing, and timeout.
- Batch operation partially successful and retry.
- Export de-identification, validity period, failure notifications, and audit logs.

## Admin pending issue candidates

Here it only prompts candidate gaps and does not generate a second set of OQ schema. Only move issues that affect role changes, data scope, status, approval, export, audit, or acceptance into the canonical `Outstanding Questions` of the output contract; implementation-layer permission codes, component, and interface designs are included in `spec-plan`.
