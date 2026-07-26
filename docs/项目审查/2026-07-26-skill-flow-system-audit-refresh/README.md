---
title: spec-first Skill 流转系统审查 2026-07-26 增量刷新
doc_role: audit-index
review_date: 2026-07-26
status: review-complete-current-source
origin_plan: docs/plans/2026-07-17-002-docs-system-project-audit-validation-approach-plan.md
baseline_audit: docs/项目审查/2026-07-18-skill-flow-system-audit-refresh/README.md
previous_calibration_head: 27baf79f7d3bb0873deb591218c76b9c11a91bbf
current_head_at_calibration: d939ee3c20317ef7d3068a2ef84fda7b62a6a8fb
working_tree_calibrated_at: 2026-07-26
working_tree_overlay: docs-only-6-paths-no-skill-source-overlap
---

# spec-first Skill 流转系统审查 2026-07-26 增量刷新

本批次按 origin plan 对 2026-07-18 刷新批次之后的增量（`27baf79f..d939ee3c`，即 `af53aacb` review-remediation 批次 + `d939ee3c` docs 同步）做 Skill 关联关系审查。它不改写旧批次：07-17 全量账本与 07-18 冻结 manifest 保持各自校准点的证据地位；本批次只裁决增量并复核落在变更面内的历史关闭项。

## 当前结论

- **P0：0；P1：1（SF-28，新增）；P2：0；P3：7（新增）；历史 finding REGRESSED：0。**
- delta 主体是授权模型收紧与 declared 化（doc-review producer-token 写权、compound-refresh 三元授权、deployment 双 gate、internal delivery 单一 owner、9 个 Contract Summary、3 个 CI 硬 gate），与关系不变量一致且 producer/consumer 两侧对齐。
- SF-28：新增 LFG 6.5 fingerprint gate 的跨 skill helper 引用在五宿主投射下不可解析，目标仓中旗舰自主管道将确定性终止于最后一道 gate（安全方向失败）；属 07-18 已修复 bug 类的同类再现，修复先例现成。

## 当前整改状态

以上是 `d939ee3c` 校准点的历史审查结论。SF-28～SF-35 已在当前工作树完成 source-first 整改；逐项 disposition、五宿主 sandbox 验证、SF-35 补充合同与未验证边界见 [remediation-execution-record.md](remediation-execution-record.md)。该状态不表示已经 commit、push、创建 PR 或取得真实宿主 field outcome。

## 覆盖与快照

| 项目 | 本轮结果 |
| --- | --- |
| Governed roster | 35/35 复核（17 workflow command、13 standalone skill、5 internal-only），无节点增删 |
| 覆盖分母（冻结） | delta 30 个 source 文件 + 3 CI workflow + 5 runtime mirror 删除中的全部 declared 声明；非 delta 的 165 冻结 pair 沿用 07-18 账本不重扫（coverage limitation 已披露） |
| 深审 | 6 个 edge family（fingerprint gate、doc-review 权威模型、refresh 授权、deployment 激活、source-command 退役、CI enforcement），全部 authority-changing 与 exit-gate 关系在深审集内 |
| 历史裁决 | 17 项落在变更面内的已关闭 finding 逐项复核，全部 INTACT（SF-01/SF-04/SF-24 为强化） |
| 确定性验证 | lint 313 files、typecheck 187 files、eval-fixtures 78 tests、delta 契约 22 suites/236 tests、五宿主投射 integration 21 tests、riffrec/sweep byte parity |
| 语义场景 | 6 类 fresh-source evaluation（隔离上下文 + 当前磁盘 source）；S4 独立复证 SF-28，S3 发现 SF-35 |

## 产物索引

| 文件 | 用途 |
| --- | --- |
| [review-report.md](review-report.md) | 结论、P1/P3 队列、决策姿态、最高杠杆三项与不做清单 |
| [optimization-issues.md](optimization-issues.md) | 供后续 plan/work 消费的问题清单与建议工作包 |
| [remediation-execution-record.md](remediation-execution-record.md) | SF-28～SF-35 当前工作树整改 disposition、验证证据与 claim ceiling |
| [evidence/skill-graph.md](evidence/skill-graph.md) | 节点盘点与 declared edge/pair delta |
| [evidence/edge-ledger.md](evidence/edge-ledger.md) | 六个 edge family 七问裁决、历史回归裁决、完整 finding 合同与被推翻候选 |
| [evidence/validation.md](evidence/validation.md) | 快照、命令、语义场景、反证与 claim ceiling |
| [07-18 baseline](../2026-07-18-skill-flow-system-audit-refresh/README.md) | 上一冻结快照与 165 pair 账本 |

产物说明：在 origin plan 的最小五产物之外保留 `optimization-issues.md`，与 07-17/07-18 两批次的下游 consumer 约定保持一致。

## Claim ceiling

- current source + named consumer：可确认 `d939ee3c` 的 declared route/consumer/authority 与 drift；工作树 overlay 为 docs-only 6 路径，与 skill source 零重叠。
- focused deterministic tests：只确认被覆盖的机械合同；本轮未跑 `npm test` 全量/smoke/build（`af53aacb` 提交时的完整验证见其 CHANGELOG 条目）。
- fresh-source semantic scenario：6 场景 + 3 个隔离上下文事实采集 agent；planning-side delta 的 diff 分析因一个采集 agent 额度失败由主线程 inline 补齐，其结论面已由 S1/S3/S6 独立覆盖（详见 validation.md）。
- `loader_unverified`：未执行真实宿主 loader、sandbox init 复证或 field outcome；SF-28 结论基于五宿主投射磁盘核对，host-level 复证是 A2 行动项。
- 本目录是 review evidence，不授权修复、commit、push、PR、plan lifecycle 或 knowledge promotion。
