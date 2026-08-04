# Artifact Summary 合同

`artifact-summary.v1` 是 durable workflow artifact 的共享 summary-first handoff 合同。它让下游 plan、work、review、compound 和 release 步骤先消费简短摘要与精确 evidence paths，再决定是否读取完整 artifact。

本合同不要求每个 producer 立刻写入新文件。在某个 workflow 拥有确定性 producer 之前，可以在 handoff 中提供等价 summary 段落。边界保持一致：先 summary，只有命中明确 trigger 时才展开 full artifact。

它是 AI Coding Harness 的 cross-workflow handoff 形态之一；目录级 Harness map 见 `docs/contracts/ai-coding-harness.md`。

## 目标

- 避免把长计划、review report、audit JSON、raw log 或 session transcript 传给每个下游 agent。
- 通过携带 source paths、evidence paths 和 full-read triggers 保留可追踪性。
- 让 summary 足够短，便于 cache-friendly 传递和索引。

## 非目标

- 不是第二份完整报告。
- 不是 underlying artifact 的 source-of-truth 替代品。
- 不是 script-owned semantic conclusion。

## `artifact-summary.v1`

```json
{
  "schema_version": "spec-first.artifact-summary.v1",
  "artifact_type": "plan|task-pack|review|work|compound|audit|release|setup-readiness",
  "source_path": "docs/plans/example-plan.md",
  "producer": "spec-plan",
  "timestamp": "2026-05-14T00:00:00Z",
  "goal": "简短说明 artifact 目的",
  "scope": ["repo-relative/path-or-area"],
  "non_goals": ["明确排除的工作"],
  "key_conclusions": ["下游需要先看到的决策或结果"],
  "changed_facts": ["此 artifact 改变的确定性事实"],
  "unresolved_risks": ["仍相关的风险或未知项"],
  "evidence_paths": ["<test-path>"],
  "evidence_summaries": [
    {
      "kind": "direct-evidence",
      "summary": "compact advisory direct evidence",
      "source_reads_required": ["src/example.js"],
      "limitations": ["session-local evidence requires source confirmation"],
      "redaction_status": "none-required"
    }
  ],
  "recommended_next_action": "当前 host work entrypoint",
  "full_artifact_read_triggers": [
    "summary 缺少必需的 requirement、task、finding 或 evidence detail",
    "下游 reviewer 需要精确 prose 或 line references 才能形成 finding",
    "互依赖任务需要上游具体实现细节，而不只是结论"
  ]
}
```

## Producer 规则

- Plan 和 task artifacts 汇总 goal、scope、non-goals、implementation units、validation 和 open questions。
- Review artifacts 汇总 verdict、actionable findings、residual status、evidence paths 和完整 reviewer artifact path。
- Work artifacts 汇总 changed files、verification commands、review tier 和 residual status。
- Compound artifacts 汇总 reusable lesson delta 与 source evidence paths。
- Tool-heavy artifacts 汇总 exit code、reason_code、关键字段和 raw log paths，而不是嵌入 raw output。
- Direct/session evidence summary 可以记录 source reads required、commands used、limitations 和 redaction status，但不得嵌入 raw external-tool output，也不得成为 finding / root cause 的 source of truth。
- 如果 producer 不能提供 summary，handoff 必须让下游能记录 `summary_missing` 并定位最小 explicit path。

## Consumer 规则

1. 先读取 summary。
2. 只有 `full_artifact_read_triggers` 适用时才展开 full artifact。
3. agent handoff 传递 summary 和 paths，不复制 full artifact body。
4. 如果缺少 summary，标记 `summary_missing`，并读取最小可用 status、manifest 或 explicit path。
5. Direct/session evidence summary 是 advisory handoff；consumer 必须回到 `evidence_paths` 或 `source_reads_required` 做 source/test/contract confirmation。
6. 如果展开 full artifact，记录 `full_artifact_read_reason`，其值应对应 `full_artifact_read_triggers` 中的具体触发原因。
