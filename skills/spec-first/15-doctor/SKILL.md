# Skill: doctor

## Trigger
- Stage: any (independent of stage)
- Command: `/spec-first:doctor`

## Phases
- P0: Locate project root
- P1: Load project config, git status, hook status
- P2: Generate diagnostic report (Node, Git, hooks, config, gate degradation, file capacity)
- P3: Present diagnostics to user
- P4: No writes
- P5: No side effects

## CLI Dependencies
- `spec-first doctor`

## Output Paths
- None (display only)

## confirm_policy
- Recommended: auto (read-only diagnostics)

## Success Criteria
- 诊断报告已展示（Node/Git/Hook/Config/Gate/文件膨胀检测结果）
