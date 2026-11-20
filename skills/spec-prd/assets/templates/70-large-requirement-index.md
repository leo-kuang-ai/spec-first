# <Large Requirement Name> Total Index Template

> Use only after the current executing dialog user confirms the split boundary. It provides navigation, scope, and cross-documentation relationship views, without carrying specific Requirements, Acceptance, or implementation tasks.
>
> Frontmatter uses the split-summary contract from `references/prd-output-template.md`; do not declare ready in this file itself.

## Demand Panorama

Outline the overall issue, target users, business outcomes, involved surface areas, why splitting is necessary, and which rules are shared across all child PRDs.

## Overall boundary

| Dimension | content |
| --- | --- |
| In Scope | |
| Non-Goals | |
| Shared default behavior | |
| Shared terminology source | |
| Shared data / Permission boundary | |
| Unified publication constraint | |

## Child PRD list

| child_id | document | Independent business results | In Scope | Non-Goals | primary surface | Status / blocker |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

Each child PRD must be able to independently enter `spec-plan`, and must have its own Requirements, Acceptance Examples, Scope Boundaries, Evidence, and readiness receipt.

## Cross-document dependencies

| from child | to child | Dependency content | Whether to change WHAT | Non-satisfied impact | source / decision |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

Do not record task sequencing or file-level dependencies here; this section only captures product-level precedence relationships and shared contracts.

## Source of Truth and Shared Rules

| item | source-of-truth | consumers | conflict rule | child refs |
| --- | --- | --- | --- | --- |
| | | | | |

## End-to-end acceptance testing

| AE | Scenario | Involves child | Overall observable results | Negative protection |
| --- | --- | --- | --- | --- |
| AE-X01 | | | | |

End-to-end acceptance covers only cross-child results; module-level acceptance remains in the corresponding child PRD.

## High-demand level pending closure issue candidates

> Here, only cross-child candidate gaps are indicated, with no generation of a second OQ schema; actual open issues are uniformly moved to the canonical `Outstanding Questions` in the output contract.

| Candidate Gap | Influence child | First check source | Recommended answer / Pending verification reason |
| --- | --- | --- | --- |
| | | | |

## Handoff

- The total index is not an implementation plan.
- Planning typically starts from specific child PRD and retains parent/split trace.
- Whenever a child needs planning to generate WHAT, that child shall not claim ready on the grounds of total index.
