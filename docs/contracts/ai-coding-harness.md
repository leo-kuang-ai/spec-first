# AI Coding Harness 合同

`spec-first` 的定位是 **AI Coding Harness for spec-driven software engineering**。本文是 `docs/contracts/` 的轻量目录级地图：它命名 Harness 分层、主要 owner 和边界规则，让 workflow 可治理、可观察、可验证，同时避免把 spec-first 变成中心化流程引擎。

本文不是新的 workflow、command、state machine、universal schema，也不替代 `docs/10-prompt/结构化项目角色契约.md`。角色契约仍是系统演化判断基线；本文只映射实现、审查和后续 contract 变更需要遵守的 durable contract surface。

## 核心链路

```text
Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge
```

Contract 变更应服务这条链路中的某个节点，或让上下文、证据、执行交接、评估、治理、知识复用更可重复。如果某个 contract 不改善这条链路，应留在核心路径之外，或设计成 opt-in / session-local capability。

## Harness 分层

| Harness layer | 职责 | 主要合同 |
| --- | --- | --- |
| Context Harness | 给 LLM 有界、相关、可追溯的上下文；不广播整个 repo、generated runtime、raw MCP dump 或长 artifact | `context-governance.md`, `context-bundle.md`, `artifact-summary.md` |
| Execution Harness | 在 plan/task/work/review 间传递 scope、task identity、repo scope 和 handoff evidence，但不变成状态机 | `workflows/spec-id-traceability.md`, `workflows/spec-work-run-artifact.schema.json` |
| Evidence Harness | 保留 provenance、freshness、source reads、limitations、redaction，让结论可质疑、可验证 | `project-graph-consumption.md`, `workflows/review-finding.md`, `verifiers/verification-evidence.schema.json` |
| Evaluation Harness | 用聚焦检查、advisory quality gate 和 decision-linked metrics 记录系统是否真的变好，而不是只看使用次数 | `quality-gates/*`, `verifiers/verification-evidence.schema.json`, `workflows/self-reflection-capability-upgrade.md` |
| Governance Harness | 明确 source/runtime/provider 边界、host delivery、mutation gate、并发和 freshness refresh owner | `source-runtime-customization-boundary.md`, `dual-host-governance/README.md`, `sessions/spec-first-session.md` |
| Knowledge Harness | 只沉淀已验证、可复用的经验，并让它们可发现；不要求每个 workflow 预读知识库 | `knowledge/knowledge-harness.md`, `artifact-summary.md`, `workflows/self-reflection-capability-upgrade.md`, `workflows/review-finding.md` |

## 边界规则

1. Scripts enforce deterministic invariants and prepare deterministic facts：路径、schema validity、hash、readiness、budget、reason code、artifact refs 和 raw-log refs；可机械判定的不变量不通过即 fail closed。
2. LLM workflows decide semantic adequacy above that floor：scope、架构取舍、finding 是否成立、root cause、task ordering，以及 degraded evidence 是否足够。
3. External-tool evidence 在 source、test、log、schema、contract 或用户确认前都是 advisory。
4. Durable artifacts 必须 summary-first 且完成 redaction。Raw external-tool output、raw diff hunks、credentialed URLs、tokens、internal hostnames 和完整 private process / route dumps 不进入 durable docs。
5. External tools and providers do not own scope authority, finding authority, root-cause authority, mutation authority, or workflow state.
6. 新 contract 应只增加能关闭重复 handoff、evidence 或 governance gap 的最小 durable mechanism。

## Direct Evidence Lanes

spec-first 的默认 evidence lane 是 bounded direct evidence：

| Lane | Sources | 合同边界 |
| --- | --- | --- |
| source-read | focused file reads, `rg`, ast-grep, local package/test metadata | workflow skills decide semantic relevance; source reads remain the confirmation path |
| verification | tests, syntax checks, CLI output, logs, deterministic validators | scripts enforce/record facts and exit codes; LLMs explain whether they satisfy the task |
| handoff-summary | artifact summaries, changed files, review/debug/work summaries | pass compact evidence and limitations; do not broadcast raw dumps |
| external-tool | browser/MCP/package manager/shell outputs when explicitly useful | untrusted until validated, bounded, summarized, and confirmed against source/test/log evidence when material |
| capability-candidate | project-graph/code-graph orientation candidates, consumed through `project-graph-consumption.md` | candidate-only; exploration can guide reads, conclusion claims require source/test/log/doc confirmation |

## Contract 变更检查

修改 contract 时检查：

- 是否服务明确 Harness layer 和核心链路；
- 是否保持 source-of-truth 与 generated runtime 边界；
- 是否区分 deterministic invariants / deterministic facts 和 LLM semantic adequacy judgment；
- evidence 跨 workflow 边界时，是否记录 provenance、freshness、limitations、redaction 和 source-read requirements；
- 是否避免新增第二套 readiness truth、第二套 evidence enum、隐藏 workflow state 或宽泛 external-tool platform；
- 是否为变更的 contract surface 提供聚焦测试或 source check。
