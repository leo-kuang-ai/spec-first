# Skill: research

## Trigger
- Stage: any (independent of stage)
- Command: `/spec-first:research`

## Phases
- P0: Locate Feature context
- P1: Load current stage artifacts, constitution.md
- P2: Generate research analysis (technology options, trade-offs, recommendations)
- P3: Confirm research findings with user
- P4: Write research notes to research.md
- P5: No side effects

## CLI Dependencies
- `spec-first ai context`

## Output Paths
- `specs/{featureId}/research.md`

## confirm_policy
- Recommended: assisted (writes research notes to research.md)

## Success Criteria
- `research.md` 已写入，包含方案对比、优劣分析、推荐结论
- 用户已确认研究结论
