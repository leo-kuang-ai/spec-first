# Skill: status

## Trigger
- Stage: any (independent of stage)
- Command: `/spec-first:status`

## Phases
- P0: Locate current Feature
- P1: Load stage-state, metrics, task plan, gate history
- P2: Generate status dashboard (stage, coverage, health, tasks, risks)
- P3: Present status to user (no confirmation needed)
- P4: No writes
- P5: No side effects

## CLI Dependencies
- `spec-first stage current`
- `spec-first metrics health`
- `spec-first feature current`

## Output Paths
- None (display only)

## confirm_policy
- Recommended: auto (read-only status)
