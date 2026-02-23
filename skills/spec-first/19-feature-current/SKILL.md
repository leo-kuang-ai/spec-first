# Skill: feature-current

## Trigger
- Stage: any (independent of stage)
- Command: `/spec-first:feature-current`

## Phases
- P0: Locate project root and current feature pointer
- P1: Load current feature state
- P2: Execute current feature query
- P3: Present current feature details to user
- P4: No writes
- P5: No side effects

## CLI Dependencies
- `spec-first feature current`
- `spec-first stage current <featureId>`

## Output Paths
- None (display only)

## confirm_policy
- Recommended: auto (read-only status)

## Success Criteria
- 已展示当前 featureId、标题与阶段
- 当未设置 current 时给出下一步引导
