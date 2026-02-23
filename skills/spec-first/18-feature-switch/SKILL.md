# Skill: feature-switch

## Trigger
- Stage: any (independent of stage)
- Command: `/spec-first:feature-switch <featureId>`

## Phases
- P0: Locate project root and parse target featureId from user input
- P1: Load feature list and validate target feature exists
- P2: Generate switch plan (target feature and expected stage)
- P3: Ask user to confirm switch target
- P4: Execute switch and write current pointer
- P5: Verify switched context and report current stage

## CLI Dependencies
- `spec-first feature list`
- `spec-first feature switch <featureId>`
- `spec-first feature current`
- `spec-first stage current <featureId>`

## Output Paths
- `.spec-first/current`

## confirm_policy
- Recommended: assisted (updates current feature pointer)

## Success Criteria
- 目标 featureId 校验通过
- `.spec-first/current` 已切换到目标 featureId
- 已输出切换后的当前阶段信息
