# 执行完成报告模板

## 执行完成报告

**Feature**: {featureId}
**执行时间**: {startTime} - {endTime} ({duration})

### 统计
- 总数: {total} | 成功: {success} | 失败: {failed} | 跳过: {skipped}
- 成功率: {successRate}%

### 分层详情

#### Layer 0
- TASK-VIS-001: ✅ 成功

#### Layer 1
- TASK-INT-001: ✅ 成功
- TASK-VIZ-001: ❌ 失败
- TASK-LAY-001: ⏭️ 跳过（依赖失败）

### 失败详情

**TASK-VIZ-001**:
- 错误信息: {errorMessage}
- 失败原因: {failureReason}
- 建议操作: {suggestedAction}

### 下一步建议

{nextSteps}
