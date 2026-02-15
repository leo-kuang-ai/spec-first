# Skill: test

## Trigger
- Stage: 05_verify
- Command: `/spec-first:test`

## Phases
- P0: Locate Feature, verify stage is 05_verify
- P1: Load FRs, ACs, existing TCs from matrix
- P2: Generate TC (Test Case) entries mapped to FRs/ACs
- P3: Confirm test plan with user
- P4: Write TCs to matrix, generate test scaffolds
- P5: Run metrics coverage to check C4/C5

## CLI Dependencies
- `spec-first id next TC <abbr> --feature <featureId>`
- `spec-first matrix update`
- `spec-first metrics coverage`

## Output Paths
- `specs/{featureId}/traceability-matrix.md`
- Test scaffold files

## confirm_policy
- Recommended: assisted
