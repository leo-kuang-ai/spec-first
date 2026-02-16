# Skill: catchup

## Trigger
- Stage: any (independent of stage)
- Command: `/spec-first:catchup`

## Phases
- P0: Locate current Feature from .spec-first/current
- P1: Load stage-state.json, task_plan.md, progress.md
- P2: Generate 7-step recovery report (phase, task, progress, findings, missing files)
- P3: Present recovery summary to user
- P4: Write catchup results to progress.md
- P5: No side effects

## CLI Dependencies
- `spec-first ai catchup`
- `spec-first stage current`

## Output Paths
- `specs/{featureId}/progress.md`

## confirm_policy
- Recommended: assisted (writes catchup summary to progress.md)

## Success Criteria
- 7 步恢复报告已生成（阶段、任务、进度、发现、缺失文件、风险、建议）
- 用户确认后恢复摘要已追加到 `progress.md`
