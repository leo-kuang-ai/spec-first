# Skill: plan

## Trigger
- Stage: any (orchestration Skill)
- Command: `/spec-first:plan`

## Phases
- P0: Locate Feature, load current stage
- P1: Load stage-state, coverage metrics, bottleneck analysis
- P2: Generate execution plan (next steps, risk assessment, resource allocation)
- P3: Confirm plan with user
- P4: Write plan to progress.md
- P5: No side effects

## CLI Dependencies
- `spec-first metrics health`
- `spec-first stage current`
- `spec-first doctor`

## Output Paths
- `specs/{featureId}/progress.md`

## confirm_policy
- Recommended: assisted (plans benefit from review)

## Orchestration
- Schedules phase Skills based on current stage
- Identifies blocked tasks and suggests resolution
