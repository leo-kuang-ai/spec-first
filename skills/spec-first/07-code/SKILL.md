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

## Success Criteria
- 代码文件已写入，符合 TASK 规格和 DS 约束
- `task_plan.md` 中对应 TASK 状态更新为 Done
- `spec-first commit` 已执行，traces trailer 已注入
- `progress.md` 已更新

## Example (P2 Output Format)

```markdown
### TASK-AUTH-002: 短信发送 API

**文件**: `src/api/auth/sms/send-otp.ts`
**变更摘要**: 新增 POST /api/auth/sms/send-otp 端点
**关联**: FR-AUTH-001 → DS-AUTH-001
**代码**:
（展示完整实现代码，用户确认后写入）
```
