---
title: spec-first Skill 关联关系系统审查当前快照刷新
doc_role: audit-index
review_date: 2026-07-18
status: review-complete-current-source
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
baseline_audit: docs/项目审查/2026-07-17-skill-flow-system-audit/README.md
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: 1c8a12a574a0768ea0d1334683e51cc9d709852f
working_tree_calibrated_at: 2026-07-20
working_tree_overlay: uncommitted-sf-03-sf-04-source-repair
---

# spec-first Skill 关联关系系统审查当前快照刷新

本批次按 origin plan 的 current-source、producer/consumer、focused-test 与 claim-ceiling 规则，对 2026-07-17 审查作增量刷新。它不改写旧批次：旧批次仍是其冻结 HEAD 的完整证据；本目录以 `source_head` 保存原始冻结快照。`current_head_at_calibration` 已包含 mutation-authority、internal-helper delivery 与 SF-02 knowledge-promotion 修复，本轮再叠加尚未提交的 SF-03 config-consumer 与 SF-04 task-pack doc-review consumer source 修复及其验证结果；不得把该 working-tree overlay 解读为当前 HEAD 已包含 SF-03/SF-04。

## 当前结论

- **P0：0**
- **仍未关闭的 P1：2**：SF-06、SF-10。
- **已由当前 source + focused contracts 关闭的旧 P1：9**：SF-01（load-bearing internal helper delivery）、SF-02（knowledge promotion provenance/invalidation）、SF-03（active rendering config consumer）、SF-04（task-pack doc-review consumer）、SF-05（code-review mutation policy）、SF-07（dogfood/polish authority split）、SF-08（`lfg` 名称）、SF-09（browser N/A handshake）、SF-27（generic dispatch authorization）。
- **总体判断：** 主链新增的 `spec-brainstorm -> spec-lfg`、`spec-work -> spec-doc-review` 关系已有明确 payload 与 report-only / producer-owned 边界；mutation authority 已建立“分类不授权、workflow invocation 不授权额外 dispatch、branch/local-fix/commit/landing 分离”的 package-local 基线。`spec-commit` 与 `spec-commit-push-pr` 已作为 internal-only package 投射到五宿主，使 LFG/dogfood 的真实 caller edge 在生成计划中可解析；LFG 还会把 entry admission 派生的 commit/landing authority 作为可见上游 facts 传给 helper，`mode:pipeline` 本身不授权。Knowledge promotion 现在由两套一致的 schema/template/validator 以及 Full、Lightweight、Refresh Replace、Refresh Consolidate 四条 material-write 路径共同守住 provenance/invalidation 的确定性地板。Runtime Setup 现已按真实 consumer 把 `plan_output`、`brainstorm_output`、`ideate_output` 归为 active local rendering preferences，同时保持注释示例、consumer 默认值和 setup 不调用 workflow 的边界。高风险 task pack 现由 `spec-doc-review` 唯一分类为 derived/report-only 输入，先消费真实 `tasks validate` receipt，再以上游 source plan 为范围与架构权威审查 task quality，并用 `task_pack_outcome` 返回 `spec-work-task-pack`、`spec-write-tasks` 或 `spec-plan`。当前仍需处理 maintainability 机械阈值和 artifact map 漂移，不能把整个关系网声明为全部正确。
- **逐项校准：** SF-01 已按收窄后的两个真实 caller edge 在 projection-contract 层关闭；SF-02、SF-03、SF-04 已在 source-contract 层关闭，且分别保持 legacy 默认 validator 兼容、rendering consumer 自治与 task-pack producer/source-plan authority；SF-06 继续只认定明确的 1000 行阈值冲突；SF-05、SF-07、SF-27 已由 source 与聚焦合同关闭，其中 dispatch matrix 从 18/6/12 收口为 18/18 qualified。

## 覆盖与快照

| 项目 | 当前结果 |
| --- | --- |
| Governed roster | 35/35：17 workflow command、11 standalone skill、7 internal-only helper |
| 冻结 calibration inventory | 278 个 `SKILL.md + references/**`；working-tree SF-04 overlay 新增 `task-pack-review-lens.md`，未重算冻结 manifest/pair hash |
| 声明关系候选 | 265 个 file-target support hits 收敛为 165 个 canonical pair |
| 关系增量 | 旧 157 条中移除 M-113 一条；新增 9 条，当前总数 165 |
| 变更支撑面 | 30 个变更 source 文件触及 46 个既有/新增 pair；material route、authority、consumer 与 failure delta 已在 `edge-ledger.md` 裁决 |
| Deterministic validation | 冻结快照验证保持有效；current source 另通过 mutation/dispatch authority 聚焦合同、14-suite relationship replay、SF-02 promotion gate、SF-03 config-consumer RED/GREEN，以及 SF-04 task-pack consumer 正负 handoff 合同，最终全量命令见 `evidence/validation.md` |

冻结 manifest：

- Skill source manifest SHA-256：`01c8b308afcc5907bc70e3e2983cae525098cb4db0d4e050dbf0144b79e5bc9f`
- Canonical pair manifest SHA-256：`71c0a4c26d4b47690f4023a33174bf295be1df74787332e396d0b195e38ea30a`

## 产物索引

| 文件 | 用途 |
| --- | --- |
| [review-report.md](review-report.md) | 当前结论、2 个存活 P1、9 个已关闭 P1、两项最高杠杆动作 |
| [optimization-issues.md](optimization-issues.md) | 校准后仍需优化的 2 个 P1 独立清单，以及 2 个建议工作包 |
| [evidence/skill-graph.md](evidence/skill-graph.md) | 35-node roster、entry surface、internal delivery 和关系增量 |
| [evidence/edge-ledger.md](evidence/edge-ledger.md) | 与 07-17 全量 ledger 的联合关系账本、9 新增/1 移除及受影响 edge 裁决 |
| [evidence/validation.md](evidence/validation.md) | 当前快照、命令、语义场景、反证、claim ceiling 与限制 |
| [07-17 baseline](../2026-07-17-skill-flow-system-audit/README.md) | 157 条基线关系的逐行 provenance、全量 file ledger 和原始 P1/P2/P3 finding |

## Claim ceiling

- current source + named consumer：可确认 `current_head_at_calibration` 与 working-tree overlay 中的 declared route、consumer、authority 或 drift；`source_head` 只保留原始冻结快照；
- focused deterministic tests：只确认被覆盖的机械 contract；
- SF-02 的关闭只确认 `source_refs` / `invalidation_condition` 的字段形态、四条 material-write path 的 gate 调用、legacy 兼容和双 package parity；引用可信度与失效条件语义充分性仍由 LLM/human 判断；
- SF-03 的关闭只确认 source prose、注释模板、三个现有 consumer 与 focused test 的合同一致；未执行真实 host/local config field run；
- SF-04 的关闭只确认 task-pack 唯一分类、deterministic intake、source-plan authority、report-only mutation、terminal owner 与正负 handoff fixtures 的 source contract；未执行 fresh-session host invocation 或真实 persona dispatch；
- 本次没有 dispatch generic reviewer：这是 `current-source inline review`，不是 fresh-source、独立 persona 或 context-isolated coverage；
- internal helper 的关闭证据到五宿主 projection plan 与临时 sandbox `init` 为止；未执行 clean-session host loader、真实 helper invocation、真实 browser invocation、外部 provider、CI/merge/release 或 field outcome 验证，这些层级均不得从本批次推断为已通过。

本目录是 review evidence，不授权修复、commit、push、PR、plan lifecycle 或 knowledge promotion。
