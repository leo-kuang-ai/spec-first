# Skill: init

## Trigger
- Stage: any (typically before 00_init)
- Command: `/spec-first:init`

## Phases
- P0: Locate project root, check .spec-first/ existence
- P1: Load config.yaml defaults (mode, size, platforms)
- P2: Generate Feature ID + scaffold (stage-state.json, constitution.md, traceability-matrix.md)
- P3: Confirm Feature metadata with user
- P4: Write scaffold files to specs/{featureId}/
- P5: Update .spec-first/current, print summary

## CLI Dependencies
- `spec-first init` (internally generates Feature ID, no separate id command needed)

## Output Paths
- `specs/{featureId}/stage-state.json`
- `specs/{featureId}/constitution.md`
- `specs/{featureId}/traceability-matrix.md`

## confirm_policy
- Recommended: strict (new Feature creation is significant)
