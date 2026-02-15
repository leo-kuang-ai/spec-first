# Skill: archive

## Trigger
- Stage: 06_wrap_up
- Command: `/spec-first:archive`

## Phases
- P0: Locate Feature, verify stage is 06_wrap_up
- P1: Load all artifacts, matrix, gate history
- P2: Generate archive summary (coverage report, lessons learned)
- P3: Confirm archive contents with user
- P4: Write archive document, archive runtime files if >500 lines
- P5: Advance stage to 07_release if gate passes

## CLI Dependencies
- `spec-first metrics report`
- `spec-first gate check`
- `spec-first stage advance`

## Output Paths
- `specs/{featureId}/retro.md`
- Archived runtime files

## confirm_policy
- Recommended: strict (archive is a milestone)
