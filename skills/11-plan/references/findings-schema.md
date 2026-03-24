# Findings Schema

`findings.md` 是计划、决策、执行证据与阻塞信息的统一落盘载体。

## Canonical Structure

```markdown
# Findings & Decisions — {featureId}

## Plan Summary
| Field | Value |
|------|-------|
| Target Stage | 03_plan |
| Next Action | 补齐任务拆解 |
| Blockers | none |
| Risk Level | LOW |
| Suggested Command | /spec-first:task |

## Decision Log
| Time | Stage | Decision | Rationale |
|------|-------|----------|-----------|

## Execution Evidence
| Time | Type | Evidence | Result |
|------|------|----------|--------|

## Risks & Blockers
- None

## Next Steps
1. 执行 /spec-first:task
```

## Section Rules

### Plan Summary
- 只保留当前有效的下一步判断
- `Suggested Command` 必须是可立即执行的命令

### Decision Log
- 记录方案选择、取舍和审批结论
- 一条决策对应一个理由，避免写流水账

### Execution Evidence
- 记录测试命令、Gate 结果、外部验证证据
- TDD RED / GREEN 证据都应落在这里

### Risks & Blockers
- 只写仍然有效的风险或阻塞
- 若风险解除，移除或显式标注已解除

### Next Steps
- 只保留 1-3 条最小后续动作
- 第一条必须是当前最推荐执行命令
