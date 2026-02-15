# Skill: code

## Trigger
- Stage: 04_implement
- Command: `/spec-first:code`

## Phases
- P0: Locate current TASK from task_plan.md (In Progress)
- P1: Load TASK context, linked FR/DS, constitution constraints
- P2: Generate implementation code following spec constraints
- P3: Confirm code changes with user (diff preview)
- P4: Write code files, update TASK status in task_plan.md
- P5: Auto-inject traces trailer, update progress.md

## CLI Dependencies
- `spec-first commit`
- `spec-first matrix update`
- `spec-first ai context`

## Output Paths
- Source code files (per TASK specification)
- `specs/{featureId}/task_plan.md`
- `specs/{featureId}/progress.md`

## confirm_policy
- Recommended: strict (Mode N) / assisted (Mode I)
