# Skill: spec

## Trigger
- Stage: 01_specify
- Command: `/spec-first:spec`

## Phases
- P0: Locate Feature, verify stage is 01_specify
- P1: Load constitution.md, existing FRs from matrix
- P2: Generate FR definitions with ID, title, acceptance criteria
- P3: Confirm FR list with user (allow revision)
- P4: Write FRs to traceability-matrix.md, update spec documents
- P5: Run matrix check for orphan detection

## CLI Dependencies
- `spec-first id next FR <abbr> --feature <featureId>`
- `spec-first matrix update`
- `spec-first matrix check`

## Output Paths
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/spec.md`

## confirm_policy
- Recommended: strict (Mode N) / assisted (Mode I, Size M+)
