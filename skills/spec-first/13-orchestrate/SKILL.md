# Skill: orchestrate

## Trigger
- Stage: any (master orchestration Skill)
- Command: `/spec-first:orchestrate`

## Phases
- P0: Locate Feature, load current stage and state
- P1: Load stage-state, coverage, gate history, task plan
- P2: Generate orchestration plan: plan → skill execution → verify → stage advance
- P3: Confirm orchestration sequence with user
- P4: Execute scheduled Skills in sequence
- P5: Advance stage if gate passes

## CLI Dependencies
- `spec-first stage current`
- `spec-first stage advance`
- `spec-first gate check`
- `spec-first metrics health`

## Output Paths
- `specs/{featureId}/progress.md`

## confirm_policy
- Recommended: strict (orchestration drives stage transitions)

## Orchestration
- Master scheduler: dispatches phase Skills based on current stage
- Sequence: plan → (spec|design|task|code|test|archive) → verify → advance
