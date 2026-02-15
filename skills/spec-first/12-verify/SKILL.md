# Skill: verify

## Trigger
- Stage: any (orchestration Skill)
- Command: `/spec-first:verify`

## Phases
- P0: Locate Feature, load current stage
- P1: Load matrix, coverage metrics, gate conditions
- P2: Generate verification report (gate eval, SCA, coverage gaps)
- P3: Present verification results to user
- P4: Write verification results to findings.md
- P5: Suggest gate advance if all conditions met

## CLI Dependencies
- `spec-first gate check`
- `spec-first matrix check`
- `spec-first metrics coverage`

## Output Paths
- `specs/{featureId}/findings.md`

## confirm_policy
- Recommended: auto (read-only verification)

## Orchestration
- Can be called by orchestrate Skill as pre-advance check
