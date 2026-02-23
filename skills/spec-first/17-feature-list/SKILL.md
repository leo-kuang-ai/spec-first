# Skill: feature-list

## Trigger
- Stage: any (independent of stage)
- Command: `/spec-first:feature-list`

## Phases
- P0: Locate project root and validate specs directory
- P1: Load feature registry and feature directories
- P2: Execute feature list query
- P3: Present feature list to user
- P4: No writes
- P5: No side effects

## CLI Dependencies
- `spec-first feature list`

## Output Paths
- None (display only)

## confirm_policy
- Recommended: auto (read-only list)

## Success Criteria
- 已展示当前项目 Feature 列表
- 输出包含 featureId、标题、阶段与更新时间
