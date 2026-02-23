# Skill: plan

## Trigger
- Stage: any (orchestration Skill)
- Command: `/spec-first:plan`

## Phases
- P0: Locate Feature context; when multiple Features exist, list and let user choose target
- P1: Confirm current Feature and load current stage/state
- P2: Generate execution plan (next steps, risk assessment, resource allocation)
- P3: Confirm plan with user
- P4: Write plan summary to progress.md
- P5: No side effects

## CLI Dependencies
- `spec-first feature list`
- `spec-first feature switch <featureId>`
- `spec-first feature current`
- `spec-first stage current`
- `spec-first metrics health`
- `spec-first doctor`

## Output Paths
- `specs/{featureId}/progress.md`

## confirm_policy
- Recommended: assisted (plans benefit from review)

## Success Criteria
- 执行计划已生成，包含下一步骤、风险评估、资源分配
- 已明确目标 featureId 与当前阶段
- 用户确认后计划已写入 `progress.md`

## Orchestration
- Schedules phase Skills based on current stage
- Identifies blocked tasks and suggests resolution
