# Task Pack Review Lens

本 reference 只在 `spec-doc-review` 已将文档分类为 `task-pack` 时加载。它让现有 document-review owner 消费 `spec-write-tasks` 的高风险 handoff；不新增 workflow、task-pack schema、approval state 或第二套 validator。

## Ownership

- `spec-first tasks validate` 负责 identity、freshness、structure、path containment 与 machine-readable contract shape。
- `spec-doc-review` 负责 deterministic floor 之上的 task quality、source-plan fidelity、dependency/wave、files/side effects、verification/review intent 与 terminal owner 语义判断。
- `spec-write-tasks` 仍是 task pack producer 和 regeneration owner。
- `source_plan` 仍是 scope、acceptance、architecture、non-goals 与 verification 的唯一权威；task pack 只是 derived execution index。

## Deterministic Intake

先解析一个同时包含 task pack 与其 `source_plan` 的 existing `artifact_root`。`--repo` 只选择 artifact/source resolution root，不授予 downstream mutation authority。运行真实 CLI：

```text
spec-first tasks validate <task-pack-path> --repo <artifact-root> --json
```

继续 semantic review 前必须确认：

- process 成功且 `schema_version: task-pack-validation/v1`；
- `identity_basis: source-plan-path+body-hash`；
- `task_pack_validity: valid` 与 `deterministic_handoff: true`；
- receipt 中只有一个 concrete artifact-root-relative `source_plan.path`；
- `task_pack_path`、`source_plan.path`、`task_pack.metadata.source_plan_hash`、`task_pack.contract`、`task_pack.execution_focus`、`validation`、`errors` 与 `limitations` 来自本次 current receipt；当前 validator 不返回 task-pack digest，不得伪造或从路径推导该字段。

CLI unavailable、invalid、stale、wrong-chain、draft、path escape、source-plan missing 或其他 deterministic failure 时，不 dispatch personas，不把文件降级成普通 plan，也不让 LLM 手算 hash。返回 `review_status: incomplete`，保留 CLI `reason_code`，并形成：

```yaml
task_pack_outcome:
  review_result: incomplete
  task_pack_validity: <CLI value or unverifiable>
  deterministic_handoff: false
  source_plan: <receipt path or null>
  reason_code: <CLI reason code>
  next_action: spec-write-tasks
```

## Current Source-Plan Read

Deterministic validation 通过后，读取 receipt 指向的 current source plan，而不是 task pack 中的摘要或旧 review 声明。先检查 metadata/content shape：unified plan 必须是 `artifact_readiness: implementation-ready` + `execution: code`；compatible legacy code plan 按 current plan content-shape 规则判断。Requirements-only、knowledge-work、invalid readiness 或缺少当前必要决策时，将 terminal owner 指向 `spec-plan`。

按 task refs 有界读取：Goal Capsule、Requirements/Scope Boundaries、相关 KTD、Verification Contract、Definition of Done，以及 tasks 引用的 U-ID / requirement sections。不要为了完整感把整个长 plan 注入每个 persona。

## Task-Pack-Specific Semantic Lens

`Task Pack Contract` JSON 是任务结构权威；human-readable Task Cards、Task Graph、Execution Waves 与 Traceability Matrix 只能辅助审查，发生冲突时必须作为 finding 返回给 producer，不能让 prose 覆盖 JSON。

所有 selected personas 都应用以下 shared lens，再叠加自己的 persona scope：

1. **Source-plan fidelity**：每个 task 的 `source_unit` / requirement refs 能从 current plan 回源；tasks union 覆盖本轮 material units，或明确记录 plan-owned non-goal/defer；不得新增 plan 未授权的 acceptance、public contract、architecture、provider/source owner 或 repo scope。
2. **Dependency and wave truth**：`dependencies` 与 `execution_waves` 反映真实先后关系；不得隐藏 prerequisite、把共享文件任务放入同一 wave，或用 wave label 冒充 isolation。
3. **Files and effects**：`files` 与 `expected_side_effects` 符合 source-plan scope、current source owner 和 source/runtime boundary；不得用 generated runtime mirror 作为 source write owner。
4. **Verification quality**：`test_focus` 与 `done_signal` 必须可观察且覆盖 task 风险；不能把候选命令、review status 或 artifact existence 当完成证据。
5. **Stop and review semantics**：`stop_if` 能在 acceptance/architecture/ownership/verification 扩张时返回正确 owner；`review_gate` 只是 review intent，不是 approval/progress state；`review_focus` 应指向具体风险。
6. **Human/machine parity**：Task Cards、Traceability Matrix、Task Graph 和 Execution Waves 不得与 machine-readable JSON 相反；`Task Pack Contract` JSON wins，但 mismatch 仍是 producer 必须修复的 P1/P0 finding。

不得把 deterministic validation 当作 semantic-fit，也不得因 review 完成而自动证明 task splitting、file scope、wave dependency 或 source-plan coverage 正确。

## Persona Packet

对每个 selected persona，`{document_content}` 使用以下分区并设置 `slices=mixed`：

```text
<task-pack-review-lens>本 reference 全文</task-pack-review-lens>
<deterministic-intake>本次 CLI receipt 的紧凑事实</deterministic-intake>
<task-pack>完整 current task pack</task-pack>
<source-plan>当前 plan 的 focused sections</source-plan>
```

Task-pack review 永远是 `report-only` / `mutation_reason: task-pack-derived-artifact`。Confidence-100 `safe_auto` 只进入 `producer_fix_candidates`；reviewer 不直接 patch derived task pack。

## Terminal Owner

Synthesis 后只返回一个 `task_pack_outcome`：

- current deterministic intake valid、mandatory coverage complete、无 unresolved P0/P1 或 task-pack-specific blocker → `review_result: passed`、`reason_code: task-pack-review-passed`、`next_action: spec-work-task-pack`；
- task pack 的 coverage、splitting、dependency/wave、files/effects、verification/review intent 或 human/machine parity 有 unresolved P0/P1，而 current source plan 已提供足够决策 → `review_result: blocked`、`reason_code: task-pack-regeneration-required`、`next_action: spec-write-tasks`；
- root cause 是 current source plan 缺失/冲突的 scope、acceptance、architecture、source owner、repo scope 或 verification decision → `review_result: blocked`、`reason_code: source-plan-revision-required`、`next_action: spec-plan`；
- mandatory reviewer coverage 不完整 → `review_result: incomplete`，保留 coverage reason，不能返回 execution-ready implication。

P2/P3、FYI 与 residual 保留在 review envelope，但它们本身不阻断 `spec-work-task-pack`。`Review complete` 只表示 review workflow 到达 terminal signal；只有 `task_pack_outcome` 才表达该 task pack 的下一 owner。

`roster:full` 只选择所有实际 qualified personas，不授予 subagent dispatch。是否 dispatch 仍按 `spec-doc-review` 的独立 authorization/capability gate 判断；缺授权时以内联/串行方式应用相同 persona assets，并记录 `dispatch_authorization_missing`。
