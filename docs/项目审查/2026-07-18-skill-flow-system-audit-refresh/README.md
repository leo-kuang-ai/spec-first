---
title: spec-first Skill 关联关系系统审查当前快照刷新
doc_role: audit-index
review_date: 2026-07-18
status: review-complete-current-source
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
baseline_audit: docs/项目审查/2026-07-17-skill-flow-system-audit/README.md
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
working_tree_calibrated_at: 2026-07-19
working_tree_overlay: uncommitted-source-repair
---

# spec-first Skill 关联关系系统审查当前快照刷新

本批次按 origin plan 的 current-source、producer/consumer、focused-test 与 claim-ceiling 规则，对 2026-07-17 审查作增量刷新。它不改写旧批次：旧批次仍是其冻结 HEAD 的完整证据；本目录以 `source_head` 保存冻结快照，并叠加 2026-07-19 尚未提交的 mutation-authority 与 internal-helper delivery source 修复及其验证结果。该 working-tree overlay 不能被解读为 HEAD 已包含修复。

## 当前结论

- **P0：0**
- **仍未关闭的 P1：5**：SF-02、SF-03、SF-04、SF-06、SF-10。
- **已由当前 source + focused contracts 关闭的旧 P1：6**：SF-01（load-bearing internal helper delivery）、SF-05（code-review mutation policy）、SF-07（dogfood/polish authority split）、SF-08（`lfg` 名称）、SF-09（browser N/A handshake）、SF-27（generic dispatch authorization）。
- **总体判断：** 主链新增的 `spec-brainstorm -> spec-lfg`、`spec-work -> spec-doc-review` 关系已有明确 payload 与 report-only / producer-owned 边界；mutation authority 已建立“分类不授权、workflow invocation 不授权额外 dispatch、branch/local-fix/commit/landing 分离”的 package-local 基线。`spec-commit` 与 `spec-commit-push-pr` 已作为 internal-only package 投射到五宿主，使 LFG/dogfood 的真实 caller edge 在生成计划中可解析；LFG 还会把 entry admission 派生的 commit/landing authority 作为可见上游 facts 传给 helper，`mode:pipeline` 本身不授权。当前仍需处理 knowledge/config/task-review consumer、maintainability 机械阈值和 artifact map 漂移，不能把整个关系网声明为全部正确。
- **逐项校准：** SF-01 已按收窄后的两个真实 caller edge 在 projection-contract 层关闭；SF-06 继续只认定明确的 1000 行阈值冲突；SF-05、SF-07、SF-27 已由 working-tree source 与聚焦合同关闭，其中 dispatch matrix 从 18/6/12 收口为 18/18 qualified。

## 覆盖与快照

| 项目 | 当前结果 |
| --- | --- |
| Governed roster | 35/35：17 workflow command、11 standalone skill、7 internal-only helper |
| Canonical Skill source | 278/278 个 `SKILL.md + references/**`；相对旧批次为 248 个字节未变、27 个修改、3 个新增 |
| 声明关系候选 | 265 个 file-target support hits 收敛为 165 个 canonical pair |
| 关系增量 | 旧 157 条中移除 M-113 一条；新增 9 条，当前总数 165 |
| 变更支撑面 | 30 个变更 source 文件触及 46 个既有/新增 pair；material route、authority、consumer 与 failure delta 已在 `edge-ledger.md` 裁决 |
| Deterministic validation | 冻结快照验证保持有效；working-tree overlay 另通过 mutation/dispatch authority 聚焦合同与 14-suite relationship replay，最终全量命令见 `evidence/validation.md` |

冻结 manifest：

- Skill source manifest SHA-256：`01c8b308afcc5907bc70e3e2983cae525098cb4db0d4e050dbf0144b79e5bc9f`
- Canonical pair manifest SHA-256：`71c0a4c26d4b47690f4023a33174bf295be1df74787332e396d0b195e38ea30a`

## 产物索引

| 文件 | 用途 |
| --- | --- |
| [review-report.md](review-report.md) | 当前结论、5 个存活 P1、6 个已关闭 P1、两项最高杠杆动作 |
| [optimization-issues.md](optimization-issues.md) | 校准后仍需优化的 5 个 P1 独立清单，以及 2 个建议工作包 |
| [evidence/skill-graph.md](evidence/skill-graph.md) | 35-node roster、entry surface、internal delivery 和关系增量 |
| [evidence/edge-ledger.md](evidence/edge-ledger.md) | 与 07-17 全量 ledger 的联合关系账本、9 新增/1 移除及受影响 edge 裁决 |
| [evidence/validation.md](evidence/validation.md) | 当前快照、命令、语义场景、反证、claim ceiling 与限制 |
| [07-17 baseline](../2026-07-17-skill-flow-system-audit/README.md) | 157 条基线关系的逐行 provenance、全量 file ledger 和原始 P1/P2/P3 finding |

## Claim ceiling

- current source + named consumer：可确认 working-tree overlay 中的 declared route、consumer、authority 或 drift；`source_head` 仍是修复前 HEAD；
- focused deterministic tests：只确认被覆盖的机械 contract；
- 本次没有 dispatch generic reviewer：这是 `current-source inline review`，不是 fresh-source、独立 persona 或 context-isolated coverage；
- internal helper 的关闭证据到五宿主 projection plan 与临时 sandbox `init` 为止；未执行 clean-session host loader、真实 helper invocation、真实 browser invocation、外部 provider、CI/merge/release 或 field outcome 验证，这些层级均不得从本批次推断为已通过。

本目录是 review evidence，不授权修复、commit、push、PR、plan lifecycle 或 knowledge promotion。
