# Review Finding 合同

`review-finding.v1` 是代码审查与文档审查共享的最小发现记录格式。它用于 downstream handoff、summary-first artifact 和跨 workflow mapped summary，不是 `spec-code-review` reviewer JSON 返回 schema。`spec-code-review` reviewer schema 仍以 `skills/spec-code-review/references/findings-schema.json` 为准，使用 P0-P3 severity 与 0/25/50/75/100 confidence anchors。

## 目标

- 让 review synthesis 消费 structured findings，而不是长篇 reviewer prose。
- 保留 evidence、confidence、owner、verification 和 changelog requirements。
- 支持 bounded fanout 与 finding caps，同时不丢失 P0/P1 evidence。
- 为 workflow 间 handoff 提供紧凑映射层，而不是替代领域 reviewer schema。

## 非目标

- 不是通用 issue tracker schema。
- 不是现有 workflow-specific reviewer JSON 的替代品。
- 不是 `spec-code-review` reviewer JSON schema；code-review reviewer returns 必须继续遵守 `skills/spec-code-review/references/findings-schema.json`。
- 不授权 agent 在没有 evidence 的情况下编造 findings。

## `review-finding.v1`

```json
{
  "schema_version": "spec-first.review-finding.v1",
  "finding_id": "F-001",
  "severity": "blocking|high|medium|low|info",
  "category": "requirements|architecture|code-quality|test|security|performance|ux|i18n|analytics|changelog|documentation",
  "title": "简洁的 finding 标题",
  "description": "问题是什么，以及为什么重要",
  "evidence": [
    {
      "type": "file|diff|test|external-tool|standard|requirement|compound|artifact",
      "path": "repo-relative/path",
      "anchor": "line、section、symbol、command 或 artifact key",
      "summary": "Evidence 摘要"
    }
  ],
  "impact": "未解决时的具体风险",
  "recommendation": "最小可辩护修复或下一步动作",
  "owner": "review-fixer|downstream-resolver|human|release",
  "requires_verification": true,
  "requires_changelog": true,
  "confidence": "high|medium|low",
  "residual_status": "unresolved|applied|deferred|accepted|not_applicable",
  "extensions": {}
}
```

## Consumption 规则

1. 父级 synthesis 先读取对应 workflow 的 structured findings，只有 evidence 不足时才打开 reviewer prose；`spec-code-review` 的 reviewer JSON 读取以 `skills/spec-code-review/references/findings-schema.json` 为准。
2. 每个 actionable finding 必须至少包含一条带 path 或 command anchor 的 evidence entry。
3. bounded fanout 可使用 finding caps，但不得静默丢弃 P0/P1 findings。
4. 领域 workflows 可以增加 `extensions`，但共享字段必须保持 severity、evidence、verification 和 residual handling 可比较。
5. External-tool evidence is supporting evidence; unless paired with direct file, diff, test, standard, requirement, contract, or log evidence, it must not form a high-confidence finding, root-cause claim, or merge/block decision by itself.
6. Finding 引用 compact evidence summary 时，必须总结 freshness / limitations，并写明确认该 claim 的 source reads、tests、logs 或 contracts。
