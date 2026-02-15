# Skill: task

## Trigger
- Stage: 03_plan
- Command: `/spec-first:task`

## Phases
- P0: Locate Feature, verify stage is 03_plan
- P1: Load FRs and DS entries from matrix
- P2: Generate TASK breakdown mapped to FRs (ID, title, estimate, dependencies)
- P3: Confirm task plan with user
- P4: Write TASKs to matrix and task_plan.md
- P5: Run matrix check for FR→TASK coverage

## CLI Dependencies
- `spec-first id next TASK <abbr> --feature <featureId>`
- `spec-first matrix update`
- `spec-first metrics coverage`

## Output Paths
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/task_plan.md`

## confirm_policy
- Recommended: assisted (task breakdown benefits from review)
