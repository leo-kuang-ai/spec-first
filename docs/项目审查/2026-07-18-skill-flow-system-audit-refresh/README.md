---
title: spec-first Skill 关联关系系统审查当前快照刷新
doc_role: audit-index
review_date: 2026-07-18
status: review-complete-current-source
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
baseline_audit: docs/项目审查/2026-07-17-skill-flow-system-audit/README.md
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: 27baf79f7d3bb0873deb591218c76b9c11a91bbf
working_tree_calibrated_at: 2026-07-21
working_tree_overlay: none
---

# spec-first Skill 关联关系系统审查当前快照刷新

本批次按 origin plan 的 current-source、producer/consumer、focused-test 与 claim-ceiling 规则，对 2026-07-17 审查作增量刷新。它不改写旧批次：旧批次仍是其冻结 HEAD 的完整证据；本目录以 `source_head` 保存原始冻结快照。`current_head_at_calibration` 已包含 P0-P3 修复，校准时没有 working-tree overlay。已提交 P2 修复的 bounded pair delta 为 `+2/-3`；SF-24、SF-25、SF-26 的 P3 修复只校准既有 edge wording，pair delta 为 `0/0`。

## 当前结论

- **P0：0**
- **仍未关闭的 P1：0**。
- **已由当前 source + focused contracts 关闭的旧 P1：11**：SF-01（load-bearing internal helper delivery）、SF-02（knowledge promotion provenance/invalidation）、SF-03（active rendering config consumer）、SF-04（task-pack doc-review consumer）、SF-05（code-review mutation policy）、SF-06（maintainability mechanical-threshold precedence）、SF-07（dogfood/polish authority split）、SF-08（`lfg` 名称）、SF-09（browser N/A handshake）、SF-10（artifact map 与 producer contract）、SF-27（generic dispatch authorization）。
- **总体判断：** P0/P1/P2/P3 当前均为 0。最后 3 项 P3 已在现有 owner 内关闭：Deployment prompt 与 orchestrator risky-migration gate 对齐且不可 self-invoke；Validator 将 `why_it_matters` 视为可选 detail context；LFG 如实描述 Simplify 的 full-project typecheck/lint、默认 scoped tests 与按风险扩大范围。当前关闭证据止于 source、RED/GREEN contracts 与完整回归；没有 fresh-source independent reviewer、真实 deployment/validator outcome、host-loader 或 field outcome。
- **逐项校准：** SF-01 已按 9 条 load-bearing caller edge（其中 5 条指向 `spec-proof`）在 projection-contract 层关闭；SF-02、SF-03、SF-04、SF-06、SF-10、SF-11、SF-12、SF-13 已在 source/docs-contract 层关闭，其中 SF-11 的 consumer test 同时拒绝 requirements-only direct-work false edge；SF-18 在 source-owner + five-host projection parity 层关闭；SF-05、SF-07、SF-27 已由 source 与聚焦合同关闭，其中 dispatch matrix 从 18/6/12 收口为 18/18 qualified，`spec-code-review` 的 trivial-PR 判断也已改为 dispatch gate 前的 orchestrator inline 判断。

## 覆盖与快照

| 项目 | 当前结果 |
| --- | --- |
| Governed roster | 35/35：17 workflow command、13 standalone skill、5 internal-only helper |
| 冻结 calibration inventory | 278 个 `SKILL.md + references/**` 与 165 个 canonical pair；manifest/hash 保留历史校准，不冒充 current working-tree 全量重算 |
| 已提交 P2 pair delta | bounded committed-vs-frozen-source token scan：新增 2 条 user-only route，删除 1 条纸面 consumer 与 2 条 reverse-only caller |
| P3 pair delta | `0 / 0`；SF-24/SF-25/SF-26 只校准既有 edge wording |
| 变更支撑面 | SF-14-SF-23 的 material route、authority、consumer、worker return、cache/confidence 与 source/projection owner delta 已在 `edge-ledger.md` 裁决 |
| Deterministic validation | current source 已完成最后 9 项 P2 的 RED/GREEN、M-013/SF-14/SF-23 对抗性补强、owner-focused contract、source parity 与五宿主 projection/init integration；最终全量命令见 `evidence/validation.md` |

冻结 manifest：

- Skill source manifest SHA-256：`01c8b308afcc5907bc70e3e2983cae525098cb4db0d4e050dbf0144b79e5bc9f`
- Canonical pair manifest SHA-256：`71c0a4c26d4b47690f4023a33174bf295be1df74787332e396d0b195e38ea30a`

## 产物索引

| 文件 | 用途 |
| --- | --- |
| [review-report.md](review-report.md) | 当前结论、P0-P3 清零与逐项关闭证据边界 |
| [optimization-issues.md](optimization-issues.md) | 当前空队列证明与已关闭 finding 摘要 |
| [evidence/skill-graph.md](evidence/skill-graph.md) | 35-node roster、entry surface、internal delivery 和关系增量 |
| [evidence/edge-ledger.md](evidence/edge-ledger.md) | 与 07-17 全量 ledger 的联合账本、冻结关系集、已提交 P2 `+2/-3` 与 P3 `0/0` pair delta 裁决 |
| [evidence/validation.md](evidence/validation.md) | 当前快照、命令、语义场景、反证、claim ceiling 与限制 |
| [07-17 baseline](../2026-07-17-skill-flow-system-audit/README.md) | 157 条基线关系的逐行 provenance、全量 file ledger 和原始 P1/P2/P3 finding |

## Claim ceiling

- current source + named consumer：可确认 `current_head_at_calibration` 中的 declared route、consumer、authority 或 drift；本报告校准时没有 working-tree overlay，`source_head` 只保留原始冻结快照；
- focused deterministic tests：只确认被覆盖的机械 contract；
- SF-02 的关闭只确认 `source_refs` / `invalidation_condition` 的字段形态、四条 material-write path 的 gate 调用、legacy 兼容和双 package parity；引用可信度与失效条件语义充分性仍由 LLM/human 判断；
- SF-03 的关闭只确认 source prose、注释模板、三个现有 consumer 与 focused test 的合同一致；未执行真实 host/local config field run；
- SF-04 的关闭只确认 task-pack 唯一分类、deterministic intake、source-plan authority、report-only mutation、terminal owner 与正负 handoff fixtures 的 source contract；未执行 fresh-session host invocation 或真实 persona dispatch；
- SF-10 的关闭只确认用户地图与 current schema/producer/read-prune contract 的 source/docs 一致性，以及无自动 workflow artifact discovery 的边界；未执行真实用户阅读 field outcome 或跨宿主文档渲染验证；
- SF-06 的关闭只确认 persona/shared-template precedence、四个 planted case 与 focused contract 一致；未执行 fresh-session persona dispatch 或真实模型行为 eval；
- SF-12/SF-13 的关闭只确认 current source 的 local Markdown 与 terminal/handoff 合同；未执行真实 Proof publish、host menu 或后续 universal plan field flow；
- SF-18 的关闭只确认 source byte parity、唯一规范 owner 声明和五宿主 projection plan parity；未执行真实 tracker filing 或跨会话 durable ticket outcome；
- 本次没有 dispatch generic reviewer：这是 `current-source inline review`，不是 fresh-source、独立 persona 或 context-isolated coverage；
- internal helper 的关闭证据到五宿主 projection plan 与临时 sandbox `init` 为止；未执行 clean-session host loader、真实 helper invocation、真实 browser invocation、外部 provider、CI/merge/release 或 field outcome 验证，这些层级均不得从本批次推断为已通过。

本目录是 review evidence，不授权修复、commit、push、PR、plan lifecycle 或 knowledge promotion。
