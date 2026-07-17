---
title: Skill 跨包关联边总账
doc_role: audit-evidence
review_date: 2026-07-17
source_head: 7cb9721f0a9e4f0e0dc265c7194ab80e678b3c64
scope: 35 governed Skill packages / SKILL.md + references/**
expected_pairs: 157
actual_pairs: 157
status: review-complete-for-current-source
---

# Skill 跨包关联边总账

## 1. 结论与口径

本总账没有把 skill name 的文本共现直接当成 runtime edge。冻结算法先从 governance roster 取得 35 个 package，完整纳入每个 package 的 `SKILL.md` 与 `references/**` 共 275 个文件；对每个 source package，用 skill name 的非 `[a-z0-9-]` 左右边界匹配全部 target，排除 `source === target`，再按 `source package → target skill` 去重。结果是 253 个 file-target 支撑命中，收敛为 **157 个 canonical mention pair**。

每个 pair 使用两轴裁决：

| 关系角色 | 含义 |
| --- | --- |
| FWD | source 声明 forward route、handoff 或 artifact consumer。仍需核对 trigger、payload、authority、failure 与 stop，不能因名字共现自动升级为可调用。 |
| REV | helper/consumer 反向声明谁会调用它；只有 caller source 存在对应 forward edge 才闭合。 |
| BND | near-neighbor、禁止进入、route-out 或“不是本 Skill 职责”；这是边界，不是 invocation。 |
| INFO | shared contract、artifact provenance、类比、配置 consumer 说明或终端提示；不是 runtime invocation。 |
| 漂移 | 关系方向、consumer intake、authority、return/stop 或 runtime reachability 至少一项被当前 source/投射事实直接反证。 |

文件级职责、artifact authority、failure/return/stop 与行号来自三份已完成的全量台账，而不是抽样复述：

- [file-review-ledger-planning.md](file-review-ledger-planning.md)：102/102。
- [file-review-ledger-execution.md](file-review-ledger-execution.md)：85/85。
- [file-review-ledger-sidepaths.md](file-review-ledger-sidepaths.md)：88/88。

## 2. 分类计数

| 维度 | 数量 |
| --- | ---: |
| FWD | 106 |
| REV | 12 |
| BND | 23 |
| INFO | 16 |
| **关系角色合计** | **157** |
| 当前确认 | 114 |
| 漂移 pair | 43 |
| **裁决合计** | **157** |

## 3. 157/157 canonical mention pair

| Pair ID | Source → Target | 关系角色 | 裁决 | Canonical 支撑文件 | 全量文件台账 | 判定摘要 / finding 映射 |
| --- | --- | --- | --- | --- | --- | --- |
| M-001 | `spec-app-consistency-audit` → `spec-code-review` | FWD<br>forward route / handoff / consumer | **漂移** | `SKILL.md`<br>`references/mode-output-contract.md` | [sidepaths](file-review-ledger-sidepaths.md) | SF-14：app-audit 向 code-review 输出低 authority `code_review_handoff` 的 downstream 形状成立；但它同时声明 `from:code-review` / headless parent，`spec-code-review` 全包没有对应 caller 或 intake，反向集成未闭合。 |
| M-002 | `spec-app-consistency-audit` → `spec-compound` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 确认 source 声明面向 durable knowledge promotion 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-003 | `spec-app-consistency-audit` → `spec-plan` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 确认 source 声明面向 HOW / implementation planning 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-004 | `spec-app-consistency-audit` → `spec-polish` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只用于划分与 collaborative UI polish 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-005 | `spec-app-consistency-audit` → `spec-prd` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只用于划分与 brownfield PRD owner 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-006 | `spec-app-consistency-audit` → `spec-write-skill` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只用于划分与 Skill authoring owner 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-007 | `spec-brainstorm` → `spec-debug` | BND<br>near-neighbor / negative boundary | 确认 | `references/synthesis-summary.md` | [planning](file-review-ledger-planning.md) | 只用于划分与 root-cause diagnosis 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-008 | `spec-brainstorm` → `spec-doc-review` | FWD<br>forward route / handoff / consumer | **漂移** | `references/brainstorm-sections.md`<br>`references/handoff.md`<br>`references/html-rendering.md` | [planning](file-review-ledger-planning.md) | PL-02：brainstorm 的 HTML review 文案仍按 Markdown-only 旧边界，和 `spec-doc-review` 当前 HTML report-only intake 冲突。 |
| M-009 | `spec-brainstorm` → `spec-explain` | FWD<br>forward route / handoff / consumer | 确认 | `references/blindspot-pass.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 human teaching artifact 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-010 | `spec-brainstorm` → `spec-plan` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/brainstorm-sections.md`<br>`references/handoff.md`<br>`references/html-rendering.md`<br>`references/model-tiers.md`<br>`references/synthesis-summary.md`<br>`references/universal-brainstorming.md`<br>`references/verdict-routing.md` | [planning](file-review-ledger-planning.md) | 主链闭合：传 requirements-only path/精简决策及 dossier，`spec-plan` 原地 enrichment。 |
| M-011 | `spec-brainstorm` → `spec-pov` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/verdict-routing.md` | [planning](file-review-ledger-planning.md) | 仅 named external verdict 且用户接受后实际 invoke；target warm intake 重新 grounding。 |
| M-012 | `spec-brainstorm` → `spec-proof` | FWD<br>forward route / handoff / consumer | **漂移** | `references/handoff.md`<br>`references/universal-brainstorming.md` | [planning](file-review-ledger-planning.md) | PL-05 + IH-01：universal Proof 分支缺既存本地 Markdown；`spec-proof` 也未进入宿主投射集。 |
| M-013 | `spec-brainstorm` → `spec-work` | FWD<br>forward route / handoff / consumer | **漂移** | `SKILL.md`<br>`references/handoff.md`<br>`references/html-rendering.md`<br>`references/synthesis-summary.md` | [planning](file-review-ledger-planning.md) | PL-06：共享 HTML renderer 把 requirements-only artifact 错写成由 `spec-work` 直接消费。 |
| M-014 | `spec-code-review` → `spec-brainstorm` | INFO<br>informational / shared contract | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-015 | `spec-code-review` → `spec-plan` | INFO<br>informational / shared contract | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-016 | `spec-code-review` → `spec-work` | REV<br>reverse caller declaration | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | `spec-code-review` 反向声明 `spec-work` 是 caller；已由 M-116 的 work forward edge 闭合。 |
| M-017 | `spec-commit-push-pr` → `spec-explain` | INFO<br>informational / shared contract | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-018 | `spec-commit-push-pr` → `spec-lfg` | REV<br>reverse caller declaration | **漂移** | `SKILL.md` | [execution](file-review-ledger-execution.md) | IH-01：reverse caller 声明存在，但 `spec-commit-push-pr` 未进入任何宿主投射集。 |
| M-019 | `spec-compound` → `spec-code-review` | INFO<br>informational / shared contract | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-020 | `spec-compound` → `spec-compound-refresh` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 仅在窄 stale signal 下 invoke/推荐 refresh；新 learning 先落盘，refresh 不夺 producer authority。 |
| M-021 | `spec-compound` → `spec-plan` | INFO<br>informational / shared contract | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-022 | `spec-compound` → `spec-simplify-code` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 只用于划分与 behavior-preserving tidy 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-023 | `spec-compound-refresh` → `spec-brainstorm` | INFO<br>informational / shared contract | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-024 | `spec-compound-refresh` → `spec-compound` | INFO<br>informational / shared contract | **漂移** | `SKILL.md`<br>`references/per-action-flows.md`<br>`references/schema.yaml`<br>`references/yaml-schema.md` | [execution](file-review-ledger-execution.md) | F-01：共享 knowledge schema 缺 `invalidation_condition` / `source_refs`，Replace successor 会继续复制 promotion gate 回归。 |
| M-025 | `spec-debug` → `spec-brainstorm` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 设计问题才 control-transfer 到 brainstorm；debug 随即结束，不形成双 owner。 |
| M-026 | `spec-debug` → `spec-code-review` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | post-fix 以 `mode:agent` 调 report-only review；debug caller 决定 apply。 |
| M-027 | `spec-debug` → `spec-commit-push-pr` | FWD<br>forward route / handoff / consumer | **漂移** | `SKILL.md` | [execution](file-review-ledger-execution.md) | IH-01：debug 的 PR helper 名称存在于 source，但当前宿主投射不可达；landing fallback 未形成同等 handoff contract。 |
| M-028 | `spec-debug` → `spec-compound` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 用户接受后捕获可复用学习；关系方向正确，但 target promotion gate 受 F-01 影响。 |
| M-029 | `spec-debug` → `spec-simplify-code` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 条件式 behavior-preserving tidy；修复证据与 landing 仍由 debug caller 持有。 |
| M-030 | `spec-debug` → `spec-work` | REV<br>reverse caller declaration | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | `spec-debug` 反向声明 later `spec-work` caller 可消费 debug summary；不转移 diagnosis/fix evidence ownership。 |
| M-031 | `spec-doc-review` → `spec-brainstorm` | REV<br>reverse caller declaration | 确认 | `references/document-classification-signals.md`<br>`references/persona-activation-matrix.md`<br>`references/subagent-template.md`<br>`references/synthesis-and-presentation.md` | [planning](file-review-ledger-planning.md) | `spec-doc-review` 反向声明 `spec-brainstorm` 是 caller，并消费其 Product Contract provenance；M-008 给出 forward edge。 |
| M-032 | `spec-doc-review` → `spec-code-review` | INFO<br>informational / shared contract | 确认 | `references/walkthrough.md` | [planning](file-review-ledger-planning.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-033 | `spec-doc-review` → `spec-plan` | FWD<br>forward route / handoff / consumer | 确认 | `references/synthesis-and-presentation.md` | [planning](file-review-ledger-planning.md) | requirements review 的 terminal next stage；review 不接管 Product Contract。 |
| M-034 | `spec-doc-review` → `spec-work` | FWD<br>forward route / handoff / consumer | 确认 | `references/synthesis-and-presentation.md` | [planning](file-review-ledger-planning.md) | implementation plan review 的 terminal next stage；work 只在 review 返回后执行。 |
| M-035 | `spec-dogfood` → `spec-code-review` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | dogfood report/readiness evidence 可被 code review 消费；不是自动 review invocation。 |
| M-036 | `spec-dogfood` → `spec-commit` | FWD<br>forward route / handoff / consumer | **漂移** | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | SP-C01 + IH-01：dogfood 默认 commit 步骤混同 commit authority，且 `spec-commit` 未投射。 |
| M-037 | `spec-dogfood` → `spec-compound` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/dogfood-report-template.md` | [sidepaths](file-review-ledger-sidepaths.md) | 仅 substantial learning 进入 compound；关系方向正确，target gate 受 F-01 影响。 |
| M-038 | `spec-dogfood` → `spec-debug` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | root cause 不清时转系统诊断；dogfood 不继续猜修。 |
| M-039 | `spec-dogfood` → `spec-plan` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只用于划分与 HOW / implementation planning 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-040 | `spec-dogfood` → `spec-polish` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只用于划分与 collaborative UI polish 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-041 | `spec-dogfood` → `spec-runtime-setup` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | browser helper 缺失时 fail loud 并返回 setup repair；不把 baseline readiness 当成功。 |
| M-042 | `spec-dogfood` → `spec-test-browser` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只用于划分与 browser verification helper 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-043 | `spec-dogfood` → `spec-work` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 较大修复作为后续 work 输入；dogfood 本轮只记录 blocked/human decision。 |
| M-044 | `spec-dogfood` → `spec-worktree` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 真实 forward call：existing-ref payload，消费 `ready/already_checked_out/unknown` verdict。 |
| M-045 | `spec-explain` → `spec-brainstorm` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只用于划分与 WHAT / Product Contract 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-046 | `spec-explain` → `spec-compound` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只用于划分与 durable knowledge promotion 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-047 | `spec-explain` → `spec-ideate` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 仅用户接受 improvement observation 后 invoke ideate。 |
| M-048 | `spec-explain` → `spec-polish` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只用于划分与 collaborative UI polish 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-049 | `spec-explain` → `spec-pov` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只用于划分与 project-grounded external verdict 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-050 | `spec-explain` → `spec-proof` | FWD<br>forward route / handoff / consumer | **漂移** | `references/destinations.md` | [sidepaths](file-review-ledger-sidepaths.md) | IH-01（可降级）：`spec-proof` 未投射；本 edge 只能依赖直连 Proof API 或 local-file fallback。 |
| M-051 | `spec-explain` → `spec-simplify-code` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 仅用户接受 code-clarity finding 后 invoke simplify，scope 随 observations 传递。 |
| M-052 | `spec-ideate` → `spec-brainstorm` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/html-rendering.md`<br>`references/ideation-sections.md`<br>`references/post-ideation-workflow.md`<br>`references/universal-ideation.md` | [planning](file-review-ledger-planning.md) | 唯一产品深化 handoff：传 focused seed 与 provenance，不传整份 ideation artifact。 |
| M-053 | `spec-ideate` → `spec-doc-review` | BND<br>near-neighbor / negative boundary | **漂移** | `references/html-rendering.md` | [planning](file-review-ledger-planning.md) | PL-02 / PL-06：ideate 共享 renderer 携带过时 doc-review 能力判断与 plan-specific consumer 文案。 |
| M-054 | `spec-ideate` → `spec-plan` | BND<br>near-neighbor / negative boundary | **漂移** | `SKILL.md`<br>`references/html-rendering.md`<br>`references/ideation-sections.md`<br>`references/post-ideation-workflow.md`<br>`references/universal-ideation.md` | [planning](file-review-ledger-planning.md) | PL-04 / PL-06：正确的“不可直跳 plan”边界与 universal/renderer 旧链路文案混杂。 |
| M-055 | `spec-ideate` → `spec-proof` | FWD<br>forward route / handoff / consumer | **漂移** | `references/post-ideation-workflow.md` | [planning](file-review-ledger-planning.md) | IH-01（可降级）：`spec-proof` 未投射；local ideation file 保持 canonical，但分享 handoff 不可按声明调用。 |
| M-056 | `spec-ideate` → `spec-work` | FWD<br>forward route / handoff / consumer | **漂移** | `references/html-rendering.md`<br>`references/universal-ideation.md` | [planning](file-review-ledger-planning.md) | PL-06：ideation HTML 错标 `spec-work` 为直接 consumer。 |
| M-057 | `spec-lfg` → `spec-code-review` | FWD<br>forward route / handoff / consumer | **漂移** | `SKILL.md`<br>`references/review-followup.md`<br>`references/tracker-defer.md` | [execution](file-review-ledger-execution.md) | EX-F06：LFG tracker reference 仍称 interactive `spec-code-review` 直接 filing，和 reviewer report-only 边界冲突。 |
| M-058 | `spec-lfg` → `spec-commit-push-pr` | FWD<br>forward route / handoff / consumer | **漂移** | `SKILL.md` | [execution](file-review-ledger-execution.md) | IH-01：LFG shipping helper `spec-commit-push-pr` 未投射，无等价 helper handoff。 |
| M-059 | `spec-lfg` → `spec-explain` | INFO<br>informational / shared contract | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-060 | `spec-lfg` → `spec-plan` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | LFG 必须先 plan；requirements-only input 不可直进 work。 |
| M-061 | `spec-lfg` → `spec-simplify-code` | FWD<br>forward route / handoff / consumer | **漂移** | `SKILL.md` | [execution](file-review-ledger-execution.md) | EX-F15：LFG 说 simplify “runs the test suite”，target 实际只保证受影响范围的 scoped validation。 |
| M-062 | `spec-lfg` → `spec-test-browser` | FWD<br>forward route / handoff / consumer | **漂移** | `SKILL.md` | [execution](file-review-ledger-execution.md) | EX-F02 + IH-01：browser helper 无合法 N/A return，且 `spec-test-browser` 未投射；LFG completion handshake 可被永久阻断。 |
| M-063 | `spec-lfg` → `spec-work` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 真实 forward call：`mode:return-to-caller`，LFG 保留 simplify/review/lifecycle/shipping tail。 |
| M-064 | `spec-optimize` → `spec-code-review` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | Phase 4 显式运行 code review；optimize caller 按 mechanical bar 处理 finding。 |
| M-065 | `spec-optimize` → `spec-compound` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 用户选择 Capture learning 后 invoke；target promotion gate 受 F-01 影响。 |
| M-066 | `spec-optimize` → `spec-work` | FWD<br>forward route / handoff / consumer | **漂移** | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | SP-C04：只声明 `spec-work` 是 consumer，实际没有 trigger、payload、authority handoff 或 failure-return。 |
| M-067 | `spec-plan` → `spec-brainstorm` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/deepening-workflow.md`<br>`references/html-rendering.md`<br>`references/plan-sections.md`<br>`references/synthesis-summary.md` | [planning](file-review-ledger-planning.md) | 既消费 upstream Product Contract，也可把 product blocker 送回 brainstorm；权威不反转。 |
| M-068 | `spec-plan` → `spec-debug` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md`<br>`references/synthesis-summary.md` | [planning](file-review-ledger-planning.md) | 只用于划分与 root-cause diagnosis 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-069 | `spec-plan` → `spec-doc-review` | FWD<br>forward route / handoff / consumer | **漂移** | `SKILL.md`<br>`references/html-rendering.md`<br>`references/plan-handoff.md`<br>`references/synthesis-summary.md` | [planning](file-review-ledger-planning.md) | PL-02：plan main/handoff 已要求 HTML report-only review，但 `html-rendering.md` 仍写不可 review。 |
| M-070 | `spec-plan` → `spec-optimize` | FWD<br>forward route / handoff / consumer | 确认 | `references/plan-sections.md` | [planning](file-review-ledger-planning.md) | 仅 measurable optimization-shaped exit criterion 时建议 optimize；不是自动 pipeline。 |
| M-071 | `spec-plan` → `spec-prd` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [planning](file-review-ledger-planning.md) | 消费 current PRD 的 legacy artifact shape；blocker 可返回 owning PRD producer。 |
| M-072 | `spec-plan` → `spec-proof` | FWD<br>forward route / handoff / consumer | **漂移** | `SKILL.md`<br>`references/plan-handoff.md`<br>`references/universal-planning.md` | [planning](file-review-ledger-planning.md) | PL-05 + IH-01：universal Publish-only 缺 local source；`spec-proof` 也未投射。 |
| M-073 | `spec-plan` → `spec-work` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/approach-altitude.md`<br>`references/deepening-workflow.md`<br>`references/html-rendering.md`<br>`references/plan-handoff.md`<br>`references/plan-sections.md`<br>`references/planning-evidence-boundaries.md`<br>`references/synthesis-summary.md`<br>`references/universal-planning.md` | [planning](file-review-ledger-planning.md) | 只把 implementation-ready code plan/path 交 work；work 获得执行与 tail authority。 |
| M-074 | `spec-polish` → `spec-runtime-setup` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | agent-browser 缺失时建议 setup repair；human polish loop可继续 degraded。 |
| M-075 | `spec-polish` → `spec-test-browser` | INFO<br>informational / shared contract | 确认 | `references/dev-server-detection.md` | [sidepaths](file-review-ledger-sidepaths.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-076 | `spec-polish` → `spec-work` | INFO<br>informational / shared contract | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-077 | `spec-pov` → `spec-brainstorm` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/boundaries.md`<br>`references/intake.md`<br>`references/report.md` | [sidepaths](file-review-ledger-sidepaths.md) | field/criteria 未定或 grade 决定后向 brainstorm 传 verified frame；POV 不写 requirements。 |
| M-078 | `spec-pov` → `spec-compound` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 仅用户选择 decision-history capture 后进入 compound；target gate 受 F-01 影响。 |
| M-079 | `spec-pov` → `spec-debug` | FWD<br>forward route / handoff / consumer | 确认 | `references/boundaries.md` | [sidepaths](file-review-ledger-sidepaths.md) | actual failure 退出 verdict workflow，交 debug 诊断。 |
| M-080 | `spec-pov` → `spec-ideate` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/boundaries.md` | [sidepaths](file-review-ledger-sidepaths.md) | options/unbounded selection 交 ideate；选定 idea 的 scope 交 brainstorm。 |
| M-081 | `spec-pov` → `spec-plan` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/boundaries.md`<br>`references/report.md` | [sidepaths](file-review-ledger-sidepaths.md) | Adopt/build verdict 交 planning；传 grade、facts 和 limitations，不授权实现。 |
| M-082 | `spec-pov` → `spec-proof` | FWD<br>forward route / handoff / consumer | **漂移** | `references/report.md` | [sidepaths](file-review-ledger-sidepaths.md) | IH-01（可降级）：POV Proof 分享为可选，但 target 未投射，local report fallback 成为实际主路径。 |
| M-083 | `spec-pov` → `spec-strategy` | FWD<br>forward route / handoff / consumer | 确认 | `references/boundaries.md` | [sidepaths](file-review-ledger-sidepaths.md) | 确认 source 声明面向 durable strategy grounding 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-084 | `spec-pov` → `spec-work` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | Trial grade 可交 bounded work；Hold/Reject 无执行 handoff。 |
| M-085 | `spec-prd` → `spec-app-consistency-audit` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/design-source-evidence.md`<br>`references/prd-output-template.md`<br>`references/prd-readiness-lens.md`<br>`references/product-expert-lens.md` | [planning](file-review-ledger-planning.md) | PRD/Figma/source consistency 是 route-out；app-audit 不反向改 PRD authority。 |
| M-086 | `spec-prd` → `spec-brainstorm` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/product-expert-lens.md` | [planning](file-review-ledger-planning.md) | 0-1/unsettled product shape 返回 brainstorm；brownfield PRD 不越权定义新产品。 |
| M-087 | `spec-prd` → `spec-doc-review` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 requirements/plan document review 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-088 | `spec-prd` → `spec-plan` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/domain-language-and-decision-ledger.md`<br>`references/evidence-and-topology.md`<br>`references/grill-with-docs-integration.md`<br>`references/large-input-checkpoint.md`<br>`references/prd-output-template.md`<br>`references/prd-readiness-lens.md` | [planning](file-review-ledger-planning.md) | ready-for-planning 才交 plan；checkpoint 明确 `can_enter_spec-plan: no`。 |
| M-089 | `spec-prd` → `spec-runtime-setup` | BND<br>near-neighbor / negative boundary | 确认 | `references/design-source-evidence.md` | [planning](file-review-ledger-planning.md) | 只用于划分与 runtime readiness repair 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-090 | `spec-prd` → `spec-work` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [planning](file-review-ledger-planning.md) | 只用于划分与 execution owner 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-091 | `spec-prd` → `spec-write-tasks` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [planning](file-review-ledger-planning.md) | 只用于划分与 derived task-pack compiler 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-092 | `spec-product-pulse` → `spec-strategy` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只读消费 STRATEGY.md metric seeds；pulse 不反向改 strategy。 |
| M-093 | `spec-proof` → `spec-brainstorm` | REV<br>reverse caller declaration | **漂移** | `SKILL.md`<br>`references/hitl-review.md` | [execution](file-review-ledger-execution.md) | IH-01：helper 反向声明 `spec-brainstorm` caller，但 helper 未投射；caller 只能失败或降级。 |
| M-094 | `spec-proof` → `spec-ideate` | REV<br>reverse caller declaration | **漂移** | `SKILL.md`<br>`references/hitl-review.md` | [execution](file-review-ledger-execution.md) | IH-01：helper 反向声明 `spec-ideate` caller，但 helper 未投射；caller 只能失败或降级。 |
| M-095 | `spec-proof` → `spec-plan` | REV<br>reverse caller declaration | **漂移** | `SKILL.md`<br>`references/hitl-review.md` | [execution](file-review-ledger-execution.md) | IH-01：helper 反向声明 `spec-plan` caller，但 helper 未投射；caller 只能失败或降级。 |
| M-096 | `spec-riffrec-feedback-analysis` → `spec-brainstorm` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/extensive-analysis.md`<br>`references/quick-bug-report.md`<br>`references/spec-first-feedback-format.md` | [sidepaths](file-review-ledger-sidepaths.md) | extensive analysis 传 requirements kickoff/source materials；brainstorm 首问恢复 owner confirmation。 |
| M-097 | `spec-riffrec-feedback-analysis` → `spec-debug` | FWD<br>forward route / handoff / consumer | 确认 | `references/quick-bug-report.md` | [sidepaths](file-review-ledger-sidepaths.md) | quick bug report 仅建议 debug；不自动转 brainstorm 或实现。 |
| M-098 | `spec-rule-miner` → `spec-code-review` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只用于划分与 report-oriented code review 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-099 | `spec-rule-miner` → `spec-work` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只用于划分与 execution owner 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-100 | `spec-rule-miner` → `spec-write-skill` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 只用于划分与 Skill authoring owner 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-101 | `spec-runtime-setup` → `spec-ideate` | INFO<br>informational / shared contract | 确认 | `SKILL.md`<br>`references/config-template.yaml` | [sidepaths](file-review-ledger-sidepaths.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-102 | `spec-runtime-setup` → `spec-product-pulse` | INFO<br>informational / shared contract | 确认 | `SKILL.md`<br>`references/config-template.yaml` | [sidepaths](file-review-ledger-sidepaths.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-103 | `spec-runtime-setup` → `spec-promote` | INFO<br>informational / shared contract | 确认 | `SKILL.md`<br>`references/config-template.yaml` | [sidepaths](file-review-ledger-sidepaths.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-104 | `spec-runtime-setup` → `spec-rule-miner` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | setup 完成后仅建议 rule-miner，禁止自动调用。 |
| M-105 | `spec-runtime-setup` → `spec-sweep` | INFO<br>informational / shared contract | 确认 | `SKILL.md`<br>`references/config-template.yaml` | [sidepaths](file-review-ledger-sidepaths.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-106 | `spec-runtime-setup` → `using-spec-first` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | readiness facts 可被 governor 消费；facts 仍是 advisory，不决定语义路由。 |
| M-107 | `spec-simplify-code` → `spec-debug` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 只用于划分与 root-cause diagnosis 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-108 | `spec-strategy` → `spec-brainstorm` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [planning](file-review-ledger-planning.md) | strategy 产物是 brainstorm grounding consumer；未选择 downstream 时 strategy 停止。 |
| M-109 | `spec-strategy` → `spec-ideate` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [planning](file-review-ledger-planning.md) | strategy 产物是 ideate grounding consumer；不替代 idea evidence。 |
| M-110 | `spec-strategy` → `spec-plan` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [planning](file-review-ledger-planning.md) | strategy 产物是 plan grounding consumer；不替代 Product Contract。 |
| M-111 | `spec-sweep` → `spec-lfg` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [sidepaths](file-review-ledger-sidepaths.md) | 显式 handoff requirements-only rolling plan path；LFG 必须先 enrich plan，sweep state 仍是 item truth。 |
| M-112 | `spec-test-browser` → `spec-lfg` | REV<br>reverse caller declaration | **漂移** | `references/pipeline-orchestration.md` | [execution](file-review-ledger-execution.md) | EX-F02 + IH-01：reverse pipeline caller 声明存在，但 helper 未投射且无 N/A return schema。 |
| M-113 | `spec-test-browser` → `spec-runtime-setup` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | helper 缺失时返回 runtime setup repair；当前 helper 本身未投射见 IH-01。 |
| M-114 | `spec-test-xcode` → `spec-code-review` | REV<br>reverse caller declaration | **漂移** | `SKILL.md` | [execution](file-review-ledger-execution.md) | EX-F08 + IH-01：`spec-test-xcode` 自称 code-review integration，target 无 forward call，且 helper 未投射。 |
| M-115 | `spec-work` → `spec-brainstorm` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | requirements/architecture scope gap 返回 brainstorm/plan；work 不临场重写 WHAT。 |
| M-116 | `spec-work` → `spec-code-review` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/review-findings-followup.md`<br>`references/shipping-workflow.md`<br>`references/tracker-defer.md`<br>`references/work-intake-and-task-pack.md` | [execution](file-review-ledger-execution.md) | task/final review 以 `mode:agent` 调用，caller 拥有 apply/verification/residual。 |
| M-117 | `spec-work` → `spec-commit` | FWD<br>forward route / handoff / consumer | **漂移** | `references/shipping-workflow.md` | [execution](file-review-ledger-execution.md) | IH-01：work 的 no-PR helper `spec-commit` 未投射；generic repo commit workflow 是未结构化 fallback。 |
| M-118 | `spec-work` → `spec-commit-push-pr` | FWD<br>forward route / handoff / consumer | **漂移** | `references/shipping-workflow.md` | [execution](file-review-ledger-execution.md) | IH-01：work 的 PR helper未投射；需依赖 generic landing workflow，caller-target contract 不闭合。 |
| M-119 | `spec-work` → `spec-compound` | INFO<br>informational / shared contract | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 仅描述共享 contract、artifact provenance、类比或 consumer vocabulary；文本共现不计 runtime edge。 |
| M-120 | `spec-work` → `spec-debug` | BND<br>near-neighbor / negative boundary | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | 只用于划分与 root-cause diagnosis 的近邻/禁入/route-out 边界，不计为自动 runtime invocation。 |
| M-121 | `spec-work` → `spec-plan` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/execution-engines.md`<br>`references/execution-strategy.md`<br>`references/implementation-quality.md`<br>`references/non-code-execution.md`<br>`references/work-intake-and-task-pack.md` | [execution](file-review-ledger-execution.md) | source/readiness/scope-changing discovery 返回 plan owner；work 不接管架构 authority。 |
| M-122 | `spec-work` → `spec-simplify-code` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/shipping-workflow.md` | [execution](file-review-ledger-execution.md) | phase/final conditional simplify；work 复核 actual tree并重跑 feedback loop。 |
| M-123 | `spec-work` → `spec-write-tasks` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/implementation-quality.md`<br>`references/work-intake-and-task-pack.md` | [execution](file-review-ledger-execution.md) | pack drift/omission 返回 write-tasks；高复杂度 direct plan 仅 advisory 推荐。 |
| M-124 | `spec-worktree` → `spec-code-review` | REV<br>reverse caller declaration | **漂移** | `SKILL.md` | [execution](file-review-ledger-execution.md) | EX-F05：worktree 自称 code-review caller，但 code-review 禁止 checkout/branch mutation且无 forward call。 |
| M-125 | `spec-worktree` → `spec-dogfood` | REV<br>reverse caller declaration | 确认 | `SKILL.md` | [execution](file-review-ledger-execution.md) | helper 反向 caller 声明与 dogfood forward invocation 闭合。 |
| M-126 | `spec-worktree` → `spec-work` | REV<br>reverse caller declaration | **漂移** | `SKILL.md` | [execution](file-review-ledger-execution.md) | EX-F05：worktree 自称 work caller，但 work package 无 forward invocation。 |
| M-127 | `spec-write-skill` → `spec-optimize` | FWD<br>forward route / handoff / consumer | 确认 | `references/optimization-and-lifecycle.md` | [sidepaths](file-review-ledger-sidepaths.md) | 仅 measured optimization 且无 authoring patch 时 handoff；禁止 optimize→authoring loop。 |
| M-128 | `spec-write-tasks` → `spec-doc-review` | FWD<br>forward route / handoff / consumer | **漂移** | `SKILL.md` | [planning](file-review-ledger-planning.md) | PL-03：write-tasks 发送 high-risk task pack 给 doc-review，consumer 无 task-pack type/intake。 |
| M-129 | `spec-write-tasks` → `spec-plan` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/task-pack-schema.md`<br>`references/task-quality-guide.md` | [planning](file-review-ledger-planning.md) | task pack 从 plan 派生；source plan 始终 canonical，pack 不成为第二 scope authority。 |
| M-130 | `spec-write-tasks` → `spec-work` | FWD<br>forward route / handoff / consumer | 确认 | `SKILL.md`<br>`references/execution-handoff-contract.md`<br>`references/task-pack-schema.md`<br>`references/task-quality-guide.md` | [planning](file-review-ledger-planning.md) | validated pack/hash/semantic-fit 后交 work；invalid/stale 时 fail closed。 |
| M-131 | `using-spec-first` → `spec-app-consistency-audit` | FWD<br>forward route / handoff / consumer | **漂移** | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | SF-27：入口 target 正确，但 app-audit 的 expert orchestration 未消费显式 dispatch authorization，也没有无 primitive 的等价 fallback；当前 deterministic runner 又不调用 LLM，host-side contract 处于 dormant drift。 |
| M-132 | `using-spec-first` → `spec-brainstorm` | FWD<br>forward route / handoff / consumer | **漂移** | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | SF-27：入口与 Product Contract owner 正确；Standard/Deep 默认 scout/verifier dispatch 未消费授权，虽有 inline/capability fallback但不记录 `dispatch_authorization_missing`。 |
| M-133 | `using-spec-first` → `spec-code-review` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 report-oriented code review 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-134 | `using-spec-first` → `spec-compound` | FWD<br>forward route / handoff / consumer | **漂移** | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | SF-27：knowledge target 正确；Full 默认多 subagent，却无授权 gate，且无 primitive 时没有合法 Full fallback。 |
| M-135 | `using-spec-first` → `spec-compound-refresh` | FWD<br>forward route / handoff / consumer | **漂移** | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | SF-27：knowledge-maintenance target 正确；investigation/replacement subagent 无授权或 capability fallback，replacement 可直接写 successor learning。 |
| M-136 | `using-spec-first` → `spec-debug` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 root-cause diagnosis 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-137 | `using-spec-first` → `spec-doc-review` | FWD<br>forward route / handoff / consumer | **漂移** | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | PL-03：route map 把 task document 指向 doc-review，target 会落入错误分类。 |
| M-138 | `using-spec-first` → `spec-dogfood` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 spec-dogfood 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-139 | `using-spec-first` → `spec-explain` | FWD<br>forward route / handoff / consumer | **漂移** | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | SF-27：explain target 正确；repo-profiler/recap scout 缺授权 gate，虽可 inline但不记录授权降级。 |
| M-140 | `using-spec-first` → `spec-ideate` | FWD<br>forward route / handoff / consumer | **漂移** | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | SF-27：ideation target 正确；默认约 8–13 agents 只有 cost notice，没有授权 gate，核心 fleet 也缺 no-subagent fallback。 |
| M-141 | `using-spec-first` → `spec-lfg` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 hands-off full pipeline 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-142 | `using-spec-first` → `spec-optimize` | FWD<br>forward route / handoff / consumer | **漂移** | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | SF-27：optimization target 正确；approved spec/parallel config 被当作 backend 选择而非显式 dispatch authority，mutating experiment worker 与 judge fallback 也不完整。 |
| M-143 | `using-spec-first` → `spec-plan` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 HOW / implementation planning 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-144 | `using-spec-first` → `spec-polish` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 collaborative UI polish 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-145 | `using-spec-first` → `spec-pov` | FWD<br>forward route / handoff / consumer | **漂移** | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | SF-27：POV target 正确；mandatory scout fleet 明示 never inline，却没有授权 gate或 no-subagent fallback。 |
| M-146 | `using-spec-first` → `spec-prd` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 brownfield PRD owner 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-147 | `using-spec-first` → `spec-product-pulse` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 product signal report 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-148 | `using-spec-first` → `spec-promote` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 launch copy draft 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-149 | `using-spec-first` → `spec-riffrec-feedback-analysis` | FWD<br>forward route / handoff / consumer | **漂移** | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | SF-27：feedback-analysis target 正确；大 session source-mapping subagent 缺授权 gate和标准 fallback/reason contract。 |
| M-150 | `using-spec-first` → `spec-rule-miner` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 project rule mining 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-151 | `using-spec-first` → `spec-runtime-setup` | FWD<br>forward route / handoff / consumer | 确认 | `references/conditional-routing-boundaries.md`<br>`references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 runtime readiness repair 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-152 | `using-spec-first` → `spec-simplify-code` | FWD<br>forward route / handoff / consumer | **漂移** | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | SF-27：simplify target 正确；固定 reviewer dispatch 无授权 gate，虽有 inline/serial fallback但不记录授权降级。 |
| M-153 | `using-spec-first` → `spec-strategy` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 durable strategy grounding 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-154 | `using-spec-first` → `spec-sweep` | FWD<br>forward route / handoff / consumer | **漂移** | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | SF-27：sweep target 正确；scheduled/headless source/media subagent 无授权 gate，可能把 Slack/email/media 内容交给额外 agent context。 |
| M-155 | `using-spec-first` → `spec-work` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 execution owner 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-156 | `using-spec-first` → `spec-write-skill` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 Skill authoring owner 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |
| M-157 | `using-spec-first` → `spec-write-tasks` | FWD<br>forward route / handoff / consumer | 确认 | `references/public-route-map.md` | [planning](file-review-ledger-planning.md) | 确认 source 声明面向 derived task-pack compiler 的 route/handoff/consumer；具体 trigger、payload、return 由对应逐文件台账承载。 |

## 4. Authority-changing / exit-gate 七问摘要

下表不是另建 edge registry，而是把所有会改变 workflow owner、mutation/verification/handoff/knowledge exit 的关系族压成同一七问；普通 BND/INFO pair 不重复做假深审。

| 关系族 | 必要 | 选对 target | 唯一 owner | Payload | Authority | Failure / return | Stop condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| using-spec-first → public target | 是；入口需单次意图路由 | 是；public route map 覆盖 public roster | 是；一次只选一个并 yield | 当前意图、已知 artifact/path、显式 dispatch authorization；不制造第二份状态 | governor 无 mutation/artifact authority，routing 本身不授权 subagent dispatch | 6 个 dispatching target 能记录缺授权/capability fallback；另 11 个 public target 未完整继承，见 SF-27 | invoke/recommend 后停止，不自动串 plan→work→review→knowledge；target 缺授权时应 inline/serial 或明确停止 |
| spec-ideate → spec-brainstorm | 是；从候选方向进入 WHAT | 是；不能直跳 plan/work | 是；brainstorm 独占 Product Contract | focused seed、basis、snapshot、limitations、provenance | ideation 仅方向证据；brainstorm 重新确认 WHAT | 用户不选择则停；local ideation artifact 保留 | handoff 后 ideate 离场 |
| spec-brainstorm / spec-prd → spec-plan | 是；WHAT 转 HOW | 是；plan 是 planning owner | 是；上游 Product Contract 保持 canonical | artifact path 或精简决策、blockers、dossier / handoff slice | plan 可 enrichment，不可重写已确认 WHAT | unresolved blockers、checkpoint PRD、invalid readiness 均不 handoff | 返回 owning producer或保持 requirements-only |
| spec-plan → spec-doc-review | 是；implementation exit 前独立 pressure test | 是；doc-review 是报告/Markdown review owner | HTML correction 仍唯一归 plan producer | plan path、mode、mutation_policy、origin/readiness | reviewer 只拥有 finding；HTML byte mutation 不归 reviewer | incomplete / surviving P0/P1 降级 readiness；最多两轮 producer recompose | 阻断时隐藏 work/goal；否则 reviewer 返回 plan |
| spec-plan / spec-write-tasks → spec-work | 是；plan/task pack 进入执行 | work target 正确；task-pack review target 当前有 PL-03 | source plan 唯一 scope authority；task pack 只派生顺序 | plan path/readiness，或 pack path/hash/semantic-fit receipt | work 拥有 implementation/verification tail，不拥有改写 WHAT | invalid/stale/hash drift/scope change fail closed | 返回 plan/write-tasks owner，不伪造 executable |
| spec-work / spec-debug / spec-lfg → spec-code-review | 是；非机械改动需独立 review | 是；统一 `mode:agent` report-only | caller 唯一拥有 apply、residual、commit/landing | base、plan、task-pack/task-context、diff scope | review 不获得 mutation/landing authority | unavailable/degraded 时 honest fallback；required task review 可阻断 | report 返回 caller；review 不 filing/ship |
| spec-work / spec-debug / spec-lfg → spec-simplify-code | 条件必要；大/共享/高风险 diff 才运行 | 是；behavior-preserving tidy owner | caller 仍负责 actual-tree integration/verification | bounded diff/files、protected surfaces、pre-existing overlap | simplify 只在授权 scope 内 mutation，不 commit/land | 不能证明等价则 skip；验证失败修复或回退 | 返回 caller 再 review/verify；LFG wording 有 EX-F15 |
| commit / PR helper family | exit 必要，但 helper 不是唯一可能实现 | 设计 target 合理；当前 runtime delivery 选错/缺失 | 应分别有 commit owner 与 landing owner | run-owned files、residuals、plan/testing/evidence、两类 authorization | mutation、commit、landing 必须分别授权 | 非 worktree helper 均未投射；generic fallback 语义不统一 | 无授权、不可隔离或 helper 不可达即不得声称该 exit |
| spec-dogfood → spec-worktree | 是；different-ref QA 需隔离 | 是；当前唯一 delivered internal helper | helper 独占 detect/create mechanics，caller 决定是否采用 | `existing-ref` + PR/branch | deterministic verdict 是事实；caller 持续拥有测试/修复 | `unknown`/non-zero fail closed；already-checked-out 返回路径 | 返回 ready/path/verdict 后 helper 停止 |
| Proof publish family | 可选分享，不是主链完成条件 | source contract 选对 Markdown/HITL helper；runtime delivery 缺失 | local Markdown 始终 canonical | existing local md path、title、identity、next signal | Proof copy/thread state 不反向覆盖 local source，除显式 sync | API/local fallback 可降级；universal Publish-only 缺 source file | 返回 URL或 local path；不得因分享失败丢主 artifact |
| work/debug/review → spec-compound → durable knowledge | 是；只对 verified reusable learning | target 与 compound/refresh 分工正确 | compound 捕获新 learning；refresh 维护旧 learning | solved/verified evidence、source refs、适用边界、invalidation condition | current source/verification 高于 session summary | **F-01：required provenance/invalidation gate 已回归为缺失/advisory** | 一次一条 learning；gate 未闭合时本应停止 promotion |
| spec-runtime-setup → downstream facts consumers | 是；只为缺失 runtime/readiness 修复 | setup target 正确；不应绑架 direct-evidence workflow | setup.cjs/registry 独占 setup facts mutation | reason_code、host/target、readiness、limitations | provider/setup facts 仅 advisory，不决定 scope/root cause/completion | host/target/secret/conflict fail closed；subset 只 partial | 返回原用户意图；**F-02 active plan/brainstorm consumer 被错标 reserved** |
| spec-sweep → spec-lfg | 可选；用户要执行 rolling plan 时必要 | 是；LFG 会先经 plan | sweep state 仍是 feedback lifecycle truth；LFG 拥有 implementation tail | requirements-only rolling plan path | plan 是 derived Product Contract view，不改 sweep item state | 不自动调用；无明确 handoff即停在 sweep report | LFG 先 enrichment，不能 requirements-only 直进 work |
| spec-write-tasks → spec-doc-review | high-risk pack review 需求真实 | target 类型合理但 consumer 未实现 | doc-review 应唯一拥有 task-pack critique，当前缺 intake | pack path、schema/Task Pack Contract、risk context | source plan仍 canonical；review不改 task lifecycle | PL-03：当前会误分类 requirements 并给错误 terminal next stage | 应返回 pack→work或revise tasks；当前 stop contract 未闭合 |

## 5. Internal helper caller / runtime reachability

当前 `src/cli/plugin-governance.js` 的 `DELIVERED_INTERNAL_SKILLS` 只有 `spec-worktree`。因此 governance 中写成 `internal` 不等于宿主实际可调用；以下表把 source caller、投射与 fallback 分开。

| Internal helper | Source caller / declaration | 五宿主投射 | Caller forward closure | Fallback / 影响 | 裁决 |
| --- | --- | --- | --- | --- | --- |
| spec-worktree | dogfood forward；work/code-review reverse declaration | 是 | dogfood 闭合；work/code-review 不闭合 | helper unknown/non-zero fail closed | 部分正确；EX-F05 |
| spec-commit | dogfood、work | 否 | source 有名字，runtime 无 target | dogfood 无等价 fallback；work 仅 generic repo workflow | IH-01；dogfood 同时有 SP-C01 authority 风险 |
| spec-commit-push-pr | LFG、work、debug；helper 反向声明 LFG | 否 | caller source存在，runtime 不可达 | work/debug 有泛化 landing prose；LFG 无等价 helper handoff | IH-01 |
| spec-proof | brainstorm、ideate、plan、explain、pov；helper 反向声明前三者并自称可 direct user request | 否 | source 关系丰富但 runtime target 不存在 | local file安全；explain有 API fallback；universal source-file 另有 PL-05 | IH-01，可降级但声明失真 |
| spec-test-browser | LFG forward；helper 反向声明 LFG；dogfood/polish仅 BND/INFO | 否 | runtime 不可达 | 无 N/A return；LFG missing/indeterminate fail closed | IH-01 + EX-F02 |
| spec-test-xcode | helper 反向声明 code-review | 否 | code-review 无 forward call | 用户也无法通过 governed runtime 进入 | IH-01 + EX-F08；孤儿 |
| spec-resolve-pr-feedback | 无 canonical cross-skill caller pair | 否 | 无 | 仅 source/tests 存在，当前 public/internal graph 均不可达 | IH-01；孤儿 |

## 6. 不在 157 分母内、但会改变关系判断的 absence / noncanonical gap

这些问题不能被“skill name 精确共现 pair”算法发现，因此只作补充，不伪装成第 158 条 pair：

- `spec-brainstorm/references/handoff.md` 使用 `lfg` 作为 invocation identifier，而 canonical target 是 `spec-lfg`；因此 157 对中没有 `spec-brainstorm → spec-lfg`。见 PL-01。
- Runtime Setup 用 key 文案把 `plan_output` / `brainstorm_output` 标成 reserved，却未以 canonical target name 建 pair；实际 consumer 是 `spec-plan` / `spec-brainstorm`。见 F-02 / SP-C05。
- `spec-polish` 的 terminal commit 与 branch/worktree mechanics 没有 canonical helper target mention，分别对应 SP-C01 / SP-C02。
- `spec-pov` 的 neutral explainer escape 没有指向 `spec-explain`，属于缺边而不是共现边。见 SP-C03。
- sweep / riffrec analyzer 复制关系没有 skill-name runtime call；见 SP-C06。
- compound session-historian caller/worker 冲突与 code-review package 内 authority/schema/template 冲突属于包内关系，不计跨 Skill pair；它们仍保留在 execution 全量台账。
- `spec-resolve-pr-feedback` 没有 canonical caller pair，却把 direct invocation 或“用户未禁止 delegation”当成 mutating resolver dispatch 授权；这是 SF-27 的 internal-only absence，不伪装成新增 pair。

## 7. Finding 映射

| Finding / 候选 | Pair IDs | 关系影响 |
| --- | --- | --- |
| F-01 knowledge promotion gate | M-024；并影响所有进入 `spec-compound` 的 confirmed caller family | durable knowledge provenance / invalidation exit |
| F-02 / SP-C05 runtime config consumer drift | 不在 pair 分母 | setup facts → plan/brainstorm active consumer |
| SF-14 app-audit / code-review incomplete integration | M-001 | downstream handoff shape 存在，但 `from:code-review` reverse caller 无对端接线 |
| SF-27 dispatch authorization inheritance | M-131, M-132, M-134, M-135, M-139, M-140, M-142, M-145, M-149, M-152, M-154；另有无 pair 的 `spec-resolve-pr-feedback` | route invocation 未被稳定转换为显式 dispatch fact、fallback 与 reason code；部分 worker 可修改代码/learning 或处理敏感反馈上下文 |
| PL-02 HTML doc-review contract | M-008, M-053, M-069 | producer → reviewer intake/mutation policy |
| PL-03 task-pack review intake | M-128, M-137 | task producer / governor → doc-review |
| PL-04 universal chain wording | M-054 | universal brainstorm → plan boundary |
| PL-05 universal Proof source | M-012, M-072 | publish payload precondition |
| PL-06 shared HTML renderer leak | M-013, M-053, M-054, M-056 | wrong consumer / phase ownership |
| SP-C01 commit authority | M-036；polish 部分不在 pair 分母 | mutation → commit exit |
| SP-C04 optimize paper consumer | M-066 | optimize result → work |
| EX-F02 browser N/A handshake | M-062, M-112 | LFG completion return |
| EX-F05 worktree reverse callers | M-124, M-126 | internal helper caller closure |
| EX-F06 tracker owner drift | M-057 | review residual filing owner |
| EX-F08 Xcode reverse caller | M-114 | runtime test helper reachability |
| EX-F15 simplify wording | M-061 | caller claim scope |
| IH-01 internal helper runtime reachability | M-012, M-018, M-027, M-036, M-050, M-055, M-058, M-062, M-072, M-082, M-093, M-094, M-095, M-112, M-114, M-117, M-118 | source caller exists but governed host runtime target absent |

## 8. 集合级自校验

| Check | Result |
| --- | ---: |
| governed packages | 35 |
| canonical files | 275 |
| file-target support hits | 253 |
| expected pair IDs | 157 |
| actual rows | 157 |
| unique rows | 157 |
| missing | 0 |
| extra | 0 |
| duplicate | 0 |
| unclassified | 0 |
| current confirmed | 114 |
| drift pairs | 43 |

- Pair 顺序固定为 `source.localeCompare(target)`。
- 每个 `source → target` 在第 3 节恰好出现一次；多个支撑文件聚合在同一行，不重复计 pair。
- 本总账证明 current-source declared relationship 与 deterministic projection facts；不证明 clean-session host loader、真实 invocation、外部 API、CI/merge 或 field outcome。
- 本轮只写审查证据，未修改任何 Skill、CLI、contract、test 或 generated runtime mirror。

## 9. 35/35 package dispatch-authorization 对账

共享边界规定：routing 到某 workflow 只授权该 workflow，不自动授权 generic subagent/persona/worker dispatch；缺授权时必须使用 documented fallback 并记录 `dispatch_authorization_missing`。下表逐包区分真正 generic dispatch、governed Skill/helper 调用、tool/MCP 查询和当前 agent 直接执行。

| Package | Generic dispatch | Gate / fallback 裁决 | Source refs |
| --- | --- | --- | --- |
| `spec-commit` | 否 | N/A；当前 agent 直接组织 commit | `skills/spec-commit/SKILL.md:47-120` |
| `spec-commit-push-pr` | 否 | N/A；当前 agent 直接执行 git/gh 流程 | `skills/spec-commit-push-pr/SKILL.md:100-248` |
| `spec-worktree` | 否 | N/A；本身是 internal helper，不再 spawn worker | `skills/spec-worktree/SKILL.md:17-147` |
| `spec-proof` | 否 | N/A；caller 可传 distinct identity，但本 Skill 不创建 subagent | `skills/spec-proof/SKILL.md:18-25,267-411` |
| `spec-resolve-pr-feedback` | 是，mutating resolver | **缺口**：direct invocation / 用户未禁止 delegation 被当授权；unsafe/capability fallback 存在，但不记录缺授权 | `skills/spec-resolve-pr-feedback/SKILL.md:41-45`; `skills/spec-resolve-pr-feedback/references/full-mode.md:71-85`; `skills/spec-resolve-pr-feedback/references/targeted-mode.md:29-35` |
| `spec-app-consistency-audit` | 是，expert persona intent | **缺口**：无授权 gate 或 no-primitive 等价 fallback；deterministic runner 当前又不调用 LLM，形成 dormant host-side drift | `skills/spec-app-consistency-audit/SKILL.md:115-168`; `skills/spec-app-consistency-audit/references/mode-output-contract.md:41-47` |
| `spec-brainstorm` | 是，scout/verifier/repo-profiler/Slack | **部分**：无授权 gate；有 inline/capability fallback，但不记录缺授权 | `skills/spec-brainstorm/SKILL.md:168-170,182-186,258-264`; `skills/spec-brainstorm/references/model-tiers.md:3-9` |
| `spec-code-review` | 是，多 persona/validator/cross-model | **合格**：显式 user/upstream gate；缺授权/能力均 bounded inline report-only并记录 reason | `skills/spec-code-review/SKILL.md:65-80,422-435,606-629,998-1000` |
| `spec-compound` | 是，默认 Full 多 subagent | **缺口**：Full 自动 dispatch，无授权 gate；no primitive 时无合法 Full fallback | `skills/spec-compound/SKILL.md:73-81,122-157,386,487-492,501-541`; `skills/spec-compound/references/grounding-validation.md:34-36` |
| `spec-compound-refresh` | 是，investigation/replacement | **缺口**：无授权 gate/capability fallback；replacement subagent 可写 successor learning | `skills/spec-compound-refresh/SKILL.md:186,272-294,490-495`; `skills/spec-compound-refresh/references/per-action-flows.md:47-83` |
| `spec-debug` | 是，条件性只读 probe | **合格**：显式 gate；缺授权/能力均 inline并记录 reason | `skills/spec-debug/SKILL.md:223` |
| `spec-dogfood` | 否 | N/A；产品 persona、agent-browser、internal Skill helper 不算 generic dispatch | `skills/spec-dogfood/SKILL.md:40-66,101-224` |
| `spec-doc-review` | 是，多 persona reviewer | **合格**：显式 gate；缺授权/能力复用 inline/serial prompt，且不冒充独立覆盖 | `skills/spec-doc-review/SKILL.md:98-116,140-146` |
| `spec-explain` | 是，repo-profiler/work-recap scout | **部分**：无授权 gate；no primitive 时 inline，但不记录缺授权 | `skills/spec-explain/SKILL.md:23-30,50-61` |
| `spec-lfg` | 否 | N/A；只调用 governed Skills；下游是否 dispatch 由各 target 自行 gate | `skills/spec-lfg/SKILL.md:12-34` |
| `spec-ideate` | 是，默认约 8–13 agents | **缺口**：cost notice 不是授权；核心 fleet 无 no-subagent fallback | `skills/spec-ideate/SKILL.md:229-239,276-278,307-348,400-414`; `skills/spec-ideate/references/divergent-ideation.md:3-14,79-87` |
| `spec-runtime-setup` | 否 | N/A；只输出 delegation readiness facts并禁止自动 delegate | `skills/spec-runtime-setup/SKILL.md:120-127,303-334` |
| `spec-optimize` | 是，mutating experiment/judge | **缺口**：approved spec/parallel config 被当 backend 选择；无共享授权 gate，fallback 不完整 | `skills/spec-optimize/SKILL.md:111-115,278-280,414-432,514-580`; `skills/spec-optimize/references/experiment-prompt-template.md:1-12` |
| `spec-plan` | 是，research/deepening agents | **合格**：明确 workflow invocation 不授权 dispatch；缺授权/能力均 inline/serial | `skills/spec-plan/SKILL.md:307-313,426-434`; `skills/spec-plan/references/deepening-workflow.md:196-204` |
| `spec-polish` | 否 | N/A；browser capability/dev-server process 不算 generic dispatch | `skills/spec-polish/SKILL.md:38-118` |
| `spec-pov` | 是，mandatory scout fleet | **缺口**：无授权 gate；明示 never inline，亦无 no-subagent fallback | `skills/spec-pov/SKILL.md:23-31,54-83` |
| `spec-prd` | 是，高风险 product reviewer | **合格**：要求 capability + user/parent authorization；缺失时 inline并记录原因 | `skills/spec-prd/references/product-expert-lens.md:109-122`; `skills/spec-prd/SKILL.md:264` |
| `spec-product-pulse` | 否 | N/A；Dispatch Queries 是并行 tool query，不是 generic subagent | `skills/spec-product-pulse/SKILL.md:118-140` |
| `spec-promote` | 否 | N/A；Spiral/direct drafting 均是当前 agent/tool path | `skills/spec-promote/SKILL.md:27-118` |
| `spec-riffrec-feedback-analysis` | 是，大 session source mapping | **部分**：无授权 gate；隐含可串行，但无标准 fallback/reason contract | `skills/spec-riffrec-feedback-analysis/references/extensive-analysis.md:31-41` |
| `spec-rule-miner` | 否 | N/A；scan/generation/validation 均由当前 workflow 执行 | `skills/spec-rule-miner/SKILL.md:36-65` |
| `spec-simplify-code` | 是，固定 3 reviewer | **部分**：无授权 gate；inline/serial fallback 完整但不记录缺授权 | `skills/spec-simplify-code/SKILL.md:19-37` |
| `spec-sweep` | 是，source persona/media analyzer | **缺口**：无授权 gate；scheduled/headless 可把 Slack/email/media 内容交给 subagent | `skills/spec-sweep/SKILL.md:90-123`; `skills/spec-sweep/references/model-tiers.md:1-9`; `skills/spec-sweep/references/subagent-template.md:1-47` |
| `spec-strategy` | 否 | N/A；文中 persona 是产品用户画像，不是 agent persona | `skills/spec-strategy/SKILL.md:32-84` |
| `spec-work` | 是，mutating workers | **合格**：authorization/capability/isolation 分离；缺授权/能力 inline并记录 reason | `skills/spec-work/SKILL.md:118-147`; `skills/spec-work/references/execution-strategy.md:72-107` |
| `spec-write-skill` | 否 | N/A；validation/eval 可由外部 runner 调用，但本 package source 不直接创建 generic worker | `skills/spec-write-skill/SKILL.md:41-51` |
| `spec-write-tasks` | 否 | N/A；这里只治理跨 workflow continuation，不创建 generic worker | `skills/spec-write-tasks/SKILL.md:103-119`; `skills/spec-write-tasks/references/execution-handoff-contract.md:78-95` |
| `spec-test-browser` | 否 | N/A；调用 agent-browser CLI/helper，不创建 generic subagent | `skills/spec-test-browser/SKILL.md:12-22,40-305` |
| `spec-test-xcode` | 否 | N/A；调用 XcodeBuildMCP，不创建 generic subagent | `skills/spec-test-xcode/SKILL.md:12-183` |
| `using-spec-first` | 否 | Policy source：routing 不授权 dispatch；缺授权必须 fallback并记录 reason | `skills/using-spec-first/SKILL.md:30-34`; `skills/using-spec-first/references/conditional-routing-boundaries.md:19-23` |

汇总：18 个 package 会直接或条件性 generic dispatch；6 个合格，12 个有授权或 capability fallback 缺口；17 个不直接 generic dispatch。SF-27 按一个共享根因收敛，不拆成 12 个重复 finding。
