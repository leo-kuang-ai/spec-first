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

## Success Criteria
- `task_plan.md` 已写入，包含所有 TASK 定义（ID、标题、工期、依赖）
- 所有 TASK 已通过 `id next TASK` 注册
- `traceability-matrix.md` 已更新，每个 FR 有对应 TASK 引用
- `metrics coverage` C3 (Task Coverage) > 0%

## Example (P2 Output Format)

```markdown
| TASK ID | 标题 | Owner | 工期 | depends_on | Status |
|---------|------|-------|------|------------|--------|
| TASK-AUTH-001 | H5 登录页面骨架 | FE | 1d | — | Planned |
| TASK-AUTH-002 | 短信发送 API | BE | 1d | — | Planned |
| TASK-AUTH-003 | 短信登录 API | BE | 1d | TASK-AUTH-002 | Planned |
```
