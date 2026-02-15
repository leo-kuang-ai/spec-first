# Skill: sync

## Trigger
- Stage: any (independent of stage)
- Command: `/spec-first:sync`

## Phases
- P0: Locate Feature, detect changed files
- P1: Load matrix, RFC status, defect status
- P2: Generate sync plan (backfill matrix, update statuses)
- P3: Confirm sync changes with user
- P4: Execute backfill, update matrix rows
- P5: Write audit log to findings.md

## CLI Dependencies
- `spec-first matrix update`
- `spec-first matrix check`
- `spec-first rfc list`

## Output Paths
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/findings.md`

## confirm_policy
- Recommended: assisted (sync modifies matrix)
