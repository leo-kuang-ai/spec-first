# Batch Report Template

用于 `spec-first:code` 批量模式的汇总报告模板。

当前模板对齐运行时输出结构，真理源参考：

- [`report-generator.ts`](../../../../src/core/batch-executor/report-generator.ts)

## 标准结构

```markdown
# 批量执行报告

**Feature**: {featureId}
**总任务数**: {totalTasks}
**成功**: {successCount}
**失败**: {failureCount}
**阻塞**: {blockedCount}
**成功率**: {successRate}%
**总耗时**: {duration}

{haltSection}

## 分层详情

### Layer 0
- ✅ TASK-XXX: 执行成功 (1234ms)
- ❌ TASK-YYY: 测试失败 (845ms)

失败率: 50.0%

### Layer 1
- ⛔ TASK-ZZZ: blocked - runtime 门禁未通过 (120ms)

失败率: 100.0%

## 失败详情

**TASK-YYY**
- 类型: failure
- 信息: 测试失败
- 下一步: 修复失败用例后重试

**TASK-ZZZ**
- 类型: blocked
- 信息: runtime 门禁未通过
- 下一步: 修复阻断条件后重试

## 下一步建议

- 先处理 blocked / failed TASK
- 重新执行 `/spec-first:code`
- 已完成 TASK 应被跳过，不重复实施
```

## Halt Section

如果批量执行中断，插入：

```markdown
⚠️ **执行已停止**: {haltReason}
```

如果未中断，省略该段。

## 约束

1. 报告必须按 layer 输出，不能只给总结果。
2. `blocked` 与 `failure` 必须区分。
3. 下一步建议必须可执行，不能写空泛描述。
4. 不要虚构未执行的 layer。

## TDD 相关解读

报告解释必须与当前 runtime 对齐：

- `blocked` 的根因应来自当前 runtime 门禁或执行冲突，不应再把 TDD 记录缺失描述成主阻断理由
- TDD 证据仅作为执行记录和回放依据，不参与当前批量执行器的硬门禁
- 如人工审查发现 WAIVER 理由不足，可作为 review / status 风险项补充说明，但不应伪称 batch executor 已校验

推荐在报告结论里补充：

- 当前被阻断的是 runtime 门禁或执行冲突
- 当前未自动审查的是 WAIVER 质量、替代验证充分性、RED/GREEN 闭环合理性
