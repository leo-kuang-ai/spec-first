# Review Output Template Reference

## Stage 1 - 合规结论

- 结论：PASS / FAIL
- traces / 阶段守卫 / Constitution / 新鲜证据检查结果
- 阻断项需明确对应 TASK / FR / DS / 证据路径

## Stage 2 - 质量结论

### MUST FIX
- 会阻断当前交付的问题

### SHOULD FIX
- 不阻断当前交付，但建议本轮修复的问题

### OUT_OF_SCOPE
- 与本次 TASK 无直接关系的问题
- `OUT_OF_SCOPE` 不得作为当前阻断项
- 未来处理建议写入 `findings.md`

## 复核要求

- Stage 2 结论必须可被复核为 MUST FIX / SHOULD FIX / OUT_OF_SCOPE
- 范围外问题不得包装成当前交付阻断项
