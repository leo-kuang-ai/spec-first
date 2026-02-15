# Skill: design

## Trigger
- Stage: 02_design
- Command: `/spec-first:design`

## Phases
- P0: Locate Feature, verify stage is 02_design
- P1: Load FRs from matrix, constitution.md
- P2: Generate DS (Design Spec) entries mapped to FRs
- P3: Confirm design decisions with user
- P4: Write DS entries to matrix, create design documents
- P5: Run matrix check for FR→DS coverage

## CLI Dependencies
- `spec-first id next DS <abbr> --feature <featureId>`
- `spec-first matrix update`
- `spec-first metrics coverage`

## Output Paths
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/design.md`

## confirm_policy
- Recommended: strict (design decisions are critical)
