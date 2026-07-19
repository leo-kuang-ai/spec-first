---
title: Skill 关联关系当前需要优化的问题清单
doc_role: audit-issue-list
review_date: 2026-07-18
status: review-evidence-current-source
origin_report: docs/项目审查/2026-07-18-skill-flow-system-audit-refresh/review-report.md
baseline_issue_list: docs/项目审查/2026-07-17-skill-flow-system-audit/optimization-issues.md
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: 1c8a12a574a0768ea0d1334683e51cc9d709852f
working_tree_calibrated_at: 2026-07-20
working_tree_overlay: uncommitted-sf-03-sf-04-source-repair
---

# Skill 关联关系当前需要优化的问题清单

当前共 2 个需要优先优化的 P1；P0 为 0。SF-01、SF-02、SF-03、SF-04、SF-05、SF-07、SF-08、SF-09、SF-27 已由 current source 与 focused contracts 关闭，不进入本清单。`source_head` 仍是原始冻结快照；`current_head_at_calibration` 已包含 SF-02，SF-03/SF-04 的关闭结论基于其上的尚未提交 source overlay。

本清单从同批次校准后的 [review-report.md](review-report.md) 提取，只用于后续 plan/work 消费，不表示问题已获得修复、commit、push、PR 或 lifecycle mutation 授权。

## P1：优先优化

1. **SF-06 Maintainability 的 1000 行 finding 可能被公共规则压制**
   - maintainability persona 将 diff 导致文件跨过 1000 行定义为机械 finding；shared template 又要求未被项目规则明确规定的 long-file concern 一律 suppress。
   - 当前证据只确认 1000 行阈值冲突，不证明 thin wrapper、duplicate helper 等全部 structural finding 都会被压制。
   - 优化方向：明确 persona-defined mechanical threshold 优先于 generic style suppress，并用 planted case 区分机械结构回归与主观可读性意见。

2. **SF-10 用户 artifact map 与 current producer contract 冲突**
   - 用户手册仍写 `workflow_integrated=false`，但当前 schema 和 `spec-work` durable-trigger producer 已支持 `workflow_integrated=true`。
   - 优化方向：同步用户地图、schema、producer、consumer 和窄一致性测试，避免用户读取相反生命周期事实。

## 已关闭，不进入优化队列

- **SF-01：** `spec-commit`、`spec-commit-push-pr` 已加入现有 internal delivery allowlist，并以完整 package references 投射到 Claude、Codex、Cursor、Kiro、Qoder；两者保持 `internal_only`、不进入 public route，且 invocation、tool permission、green tests 均不构成 commit/landing authority。`spec-lfg` 只从明确披露完整 pipeline 副作用的 entry admission 派生 commit/landing authority，并把可见 run-local facts 传给 helper；`mode:pipeline` 只选择无人值守执行。关闭证据是 source + focused contracts + 临时 sandbox 五宿主 `init`，不包含真实 host loader/invocation outcome。
- **SF-02：** 两套 compound package 的 schema、模板、YAML 指南与 validator 保持字节一致；Full、Lightweight、Refresh Replace 与 materially rewriting 的 Refresh Consolidate 均调用 `--promotion`，且 Consolidate 的 destructive delete 后置到 promotion/claims/cross-reference checks 之后。缺少、空值、错误类型、常见 YAML parser 隐式非字符串值，或普通/YAML-equivalent 重复的 `source_refs` / `invalidation_condition` 会确定性失败，默认模式仍接受 untouched legacy learning。关闭证据只覆盖机械字段形态与 workflow contract，不替代引用可信度或失效语义判断。
- **SF-03：** Runtime Setup、配置模板与 focused test 已按真实 consumer 统一 `plan_output`、`brainstorm_output`、`ideate_output` 的 active 状态；注释示例不激活配置，缺失/无效/注释值仍分别回退到 `md`、`md`、`html`，pipeline override 继续由 consumer 自己决定。关闭证据是 source + focused contracts，不包含真实 host/local config field run。
- **SF-04：** `spec-doc-review` 现优先识别 `type: task-pack`，即使 deterministic contract 不完整也不降级为普通 plan；task pack 强制 `report-only` / `task-pack-derived-artifact`，真实 `tasks validate` receipt 只提供 identity/freshness/structure 地板，source plan 继续拥有 scope/acceptance/architecture/non-goals/verification。专属 lens 覆盖 dependency/wave、files/side effects、test/done、`stop_if`、`review_gate` 与 human/JSON parity；`task_pack_outcome` 将通过、pack gap、plan gap、deterministic failure 分别交给 `spec-work-task-pack`、`spec-write-tasks`、`spec-plan` 或 incomplete stop。关闭证据是 source + 正负 handoff focused contracts，不包含真实 host/persona field run。
- **SF-05：** `autofix_class` 只保留 follow-up 分类语义，唯一 apply authority 是 run-local `mutation_policy`；普通 review=`report-only`，显式 review-and-fix 才可 `apply-fixes`，`mode:agent` 永远 report-only。
- **SF-07：** Dogfood/Polish 已分别解析 `branch_mutation_authorization`、`local_fix_authorization`、`commit_authorization`、`landing_authorization`；branch/PR 参数只选 scope，`done` 不授权 commit，无 commit/landing authority 时保留 verified uncommitted changes 且不 push/建 PR。
- **SF-08：** `spec-brainstorm` 已使用 exact `spec-lfg` 名称和绝对 artifact payload；未验证真实 host menu invocation。
- **SF-09：** LFG/browser 已闭合 applicable/not_applicable、exact origin、effect 与 cleanup blocker；未运行真实 browser field outcome。
- **SF-27：** 12 个原缺口 package 已补齐 package-local authorization/capability/fallback，原 6 个合格 package 继续满足基线；聚焦矩阵覆盖 18/18。敏感与 mutating worker 仍受各自数据/写入/commit/landing 边界约束。

## 建议工作包

1. **校准 producer/consumer contract：** SF-10。
2. **修复 maintainability 机械阈值 precedence：** SF-06。
