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

## Success Criteria
- 校验报告已生成，包含 Gate 评估、矩阵完整性、覆盖率缺口
- 校验结果已写入 `findings.md`
- 若所有条件满足，已建议执行 `stage advance`

## Orchestration
- Can be called by orchestrate Skill as pre-advance check
