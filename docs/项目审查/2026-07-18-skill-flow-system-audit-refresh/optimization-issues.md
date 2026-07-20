---
title: Skill 关联关系当前需要优化的问题清单
doc_role: audit-issue-list
review_date: 2026-07-18
status: review-evidence-current-source
origin_report: docs/项目审查/2026-07-18-skill-flow-system-audit-refresh/review-report.md
baseline_issue_list: docs/项目审查/2026-07-17-skill-flow-system-audit/optimization-issues.md
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: f640b19a05323f14ca4f89acfbcf999997f67fcb
working_tree_calibrated_at: 2026-07-20
working_tree_overlay: uncommitted-sf-06-maintainability-precedence-repair
---

# Skill 关联关系当前需要优化的问题清单

当前 P0/P1 均为 0。SF-01、SF-02、SF-03、SF-04、SF-05、SF-06、SF-07、SF-08、SF-09、SF-10、SF-27 已由 current source 与 focused contracts 关闭，不进入优先优化队列。`source_head` 仍是原始冻结快照；`current_head_at_calibration` 已包含 SF-10，本轮 SF-06 关闭结论基于其上的尚未提交 source/test/docs overlay。

本清单从同批次校准后的 [review-report.md](review-report.md) 提取，只用于后续 plan/work 消费，不表示问题已获得修复、commit、push、PR 或 lifecycle mutation 授权。

## P1：优先优化

无。低优先级 P2/P3 继续由同批次 [review-report.md](review-report.md) 与 07-17 baseline 跟踪。

## 已关闭，不进入优化队列

- **SF-01：** `spec-commit`、`spec-commit-push-pr` 已加入现有 internal delivery allowlist，并以完整 package references 投射到 Claude、Codex、Cursor、Kiro、Qoder；两者保持 `internal_only`、不进入 public route，且 invocation、tool permission、green tests 均不构成 commit/landing authority。`spec-lfg` 只从明确披露完整 pipeline 副作用的 entry admission 派生 commit/landing authority，并把可见 run-local facts 传给 helper；`mode:pipeline` 只选择无人值守执行。关闭证据是 source + focused contracts + 临时 sandbox 五宿主 `init`，不包含真实 host loader/invocation outcome。
- **SF-02：** 两套 compound package 的 schema、模板、YAML 指南与 validator 保持字节一致；Full、Lightweight、Refresh Replace 与 materially rewriting 的 Refresh Consolidate 均调用 `--promotion`，且 Consolidate 的 destructive delete 后置到 promotion/claims/cross-reference checks 之后。缺少、空值、错误类型、常见 YAML parser 隐式非字符串值，或普通/YAML-equivalent 重复的 `source_refs` / `invalidation_condition` 会确定性失败，默认模式仍接受 untouched legacy learning。关闭证据只覆盖机械字段形态与 workflow contract，不替代引用可信度或失效语义判断。
- **SF-03：** Runtime Setup、配置模板与 focused test 已按真实 consumer 统一 `plan_output`、`brainstorm_output`、`ideate_output` 的 active 状态；注释示例不激活配置，缺失/无效/注释值仍分别回退到 `md`、`md`、`html`，pipeline override 继续由 consumer 自己决定。关闭证据是 source + focused contracts，不包含真实 host/local config field run。
- **SF-04：** `spec-doc-review` 现优先识别 `type: task-pack`，即使 deterministic contract 不完整也不降级为普通 plan；task pack 强制 `report-only` / `task-pack-derived-artifact`，真实 `tasks validate` receipt 只提供 identity/freshness/structure 地板，source plan 继续拥有 scope/acceptance/architecture/non-goals/verification。专属 lens 覆盖 dependency/wave、files/side effects、test/done、`stop_if`、`review_gate` 与 human/JSON parity；`task_pack_outcome` 将通过、pack gap、plan gap、deterministic failure 分别交给 `spec-work-task-pack`、`spec-write-tasks`、`spec-plan` 或 incomplete stop。关闭证据是 source + 正负 handoff focused contracts，不包含真实 host/persona field run。
- **SF-10：** 用户 artifact map 现与 schema 的 `workflow_integrated` 条件、producer 的 durable-trigger reason、v2 `direct_evidence_used` 五字段、v1 `graph_evidence_used` read/prune 兼容和 source-owned reader 边界一致；文档不再把 `false` 写成唯一 current contract，也不再声称 workflow 会自动发现或隐式消费 run artifact。关闭证据是 map/schema/producer focused contract 与 RED/GREEN 文档一致性测试，不包含真实用户阅读或跨宿主渲染 field outcome。
- **SF-06：** maintainability persona 的 1000 行 threshold 现明确为 persona-owned mechanical rule；shared false-positive catalog 只 suppress 无项目规则、无 persona exact mechanical/structural condition 的主观 “file getting long / hard to read”。共享模板先保留已被 diff 直接证明的 persona severity/confidence，再对其余 shape 执行 FP-over-advisory precedence，避免 1k P1/anchor-100 先绕过 suppress、又被 generic advisory 降成 anchor-50；四个 planted cases 分别锁定 1k crossing、thin wrapper、duplicate canonical helper 与 subjective long-file suppression。关闭证据是 source + focused contract/eval fixture，不包含真实 fresh-session persona dispatch。
- **SF-05：** `autofix_class` 只保留 follow-up 分类语义，唯一 apply authority 是 run-local `mutation_policy`；普通 review=`report-only`，显式 review-and-fix 才可 `apply-fixes`，`mode:agent` 永远 report-only。
- **SF-07：** Dogfood/Polish 已分别解析 `branch_mutation_authorization`、`local_fix_authorization`、`commit_authorization`、`landing_authorization`；branch/PR 参数只选 scope，`done` 不授权 commit，无 commit/landing authority 时保留 verified uncommitted changes 且不 push/建 PR。
- **SF-08：** `spec-brainstorm` 已使用 exact `spec-lfg` 名称和绝对 artifact payload；未验证真实 host menu invocation。
- **SF-09：** LFG/browser 已闭合 applicable/not_applicable、exact origin、effect 与 cleanup blocker；未运行真实 browser field outcome。
- **SF-27：** 12 个原缺口 package 已补齐 package-local authorization/capability/fallback，原 6 个合格 package 继续满足基线；聚焦矩阵覆盖 18/18。敏感与 mutating worker 仍受各自数据/写入/commit/landing 边界约束。

## 建议工作包

P1 队列已清空；下一批按 P2 优先处理 SF-11（HTML renderer/doc-review contract）、SF-12（Universal Proof 本地 Markdown 前置）与 SF-18（tracker-defer owner 漂移）。
