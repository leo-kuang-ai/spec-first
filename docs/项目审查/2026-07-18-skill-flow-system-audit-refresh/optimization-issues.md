---
title: Skill 关联关系当前需要优化的问题清单
doc_role: audit-issue-list
review_date: 2026-07-18
status: review-evidence-current-source
origin_report: docs/项目审查/2026-07-18-skill-flow-system-audit-refresh/review-report.md
baseline_issue_list: docs/项目审查/2026-07-17-skill-flow-system-audit/optimization-issues.md
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
working_tree_calibrated_at: 2026-07-19
working_tree_overlay: uncommitted-source-repair
---

# Skill 关联关系当前需要优化的问题清单

当前共 5 个需要优先优化的 P1；P0 为 0。SF-01、SF-05、SF-07、SF-08、SF-09、SF-27 已由 working-tree source 与 focused contracts 关闭，不进入本清单。`source_head` 仍是修复前 HEAD；本结论基于尚未提交的 source overlay。

本清单从同批次校准后的 [review-report.md](review-report.md) 提取，只用于后续 plan/work 消费，不表示问题已获得修复、commit、push、PR 或 lifecycle mutation 授权。

## P1：优先优化

1. **SF-02 Knowledge promotion 缺少 provenance 与失效条件**
   - `spec-compound` 的 schema/template 未强制 `source_refs`、`invalidation_condition`。
   - 优化方向：在现有 schema、模板、promotion gate 和负向测试中统一这两个 required field，refresh replacement 复用同一合同。

2. **SF-03 Runtime setup 错误标记 active config**
   - `plan_output`、`brainstorm_output` 已被真实 consumer 使用，但 setup、配置模板和测试仍将其标记为 reserved。
   - 优化方向：以真实 consumer 为准统一 Skill prose、配置模板和 focused test，不新增重复配置键。

3. **SF-04 Task pack 缺少正确的 doc-review consumer**
   - `spec-write-tasks` 会把高风险 task pack 交给 `spec-doc-review`，但后者没有 task-pack intake、专属 lens、source-plan fidelity 检查和明确 terminal owner。
   - 优化方向：扩展现有 doc-review consumer，或移除该 handoff 并交给具备完整 task-pack contract 的 owner。

4. **SF-06 Maintainability 的 1000 行 finding 可能被公共规则压制**
   - maintainability persona 将 diff 导致文件跨过 1000 行定义为机械 finding；shared template 又要求未被项目规则明确规定的 long-file concern 一律 suppress。
   - 当前证据只确认 1000 行阈值冲突，不证明 thin wrapper、duplicate helper 等全部 structural finding 都会被压制。
   - 优化方向：明确 persona-defined mechanical threshold 优先于 generic style suppress，并用 planted case 区分机械结构回归与主观可读性意见。

5. **SF-10 用户 artifact map 与 current producer contract 冲突**
   - 用户手册仍写 `workflow_integrated=false`，但当前 schema 和 `spec-work` durable-trigger producer 已支持 `workflow_integrated=true`。
   - 优化方向：同步用户地图、schema、producer、consumer 和窄一致性测试，避免用户读取相反生命周期事实。

## 已关闭，不进入优化队列

- **SF-01：** `spec-commit`、`spec-commit-push-pr` 已加入现有 internal delivery allowlist，并以完整 package references 投射到 Claude、Codex、Cursor、Kiro、Qoder；两者保持 `internal_only`、不进入 public route，且 invocation、tool permission、green tests 均不构成 commit/landing authority。`spec-lfg` 只从明确披露完整 pipeline 副作用的 entry admission 派生 commit/landing authority，并把可见 run-local facts 传给 helper；`mode:pipeline` 只选择无人值守执行。关闭证据是 source + focused contracts + 临时 sandbox 五宿主 `init`，不包含真实 host loader/invocation outcome。
- **SF-05：** `autofix_class` 只保留 follow-up 分类语义，唯一 apply authority 是 run-local `mutation_policy`；普通 review=`report-only`，显式 review-and-fix 才可 `apply-fixes`，`mode:agent` 永远 report-only。
- **SF-07：** Dogfood/Polish 已分别解析 `branch_mutation_authorization`、`local_fix_authorization`、`commit_authorization`、`landing_authorization`；branch/PR 参数只选 scope，`done` 不授权 commit，无 commit/landing authority 时保留 verified uncommitted changes 且不 push/建 PR。
- **SF-08：** `spec-brainstorm` 已使用 exact `spec-lfg` 名称和绝对 artifact payload；未验证真实 host menu invocation。
- **SF-09：** LFG/browser 已闭合 applicable/not_applicable、exact origin、effect 与 cleanup blocker；未运行真实 browser field outcome。
- **SF-27：** 12 个原缺口 package 已补齐 package-local authorization/capability/fallback，原 6 个合格 package 继续满足基线；聚焦矩阵覆盖 18/18。敏感与 mutating worker 仍受各自数据/写入/commit/landing 边界约束。

## 建议工作包

1. **校准 producer/consumer contract：** SF-02、SF-03、SF-04、SF-10。
2. **修复 maintainability 机械阈值 precedence：** SF-06。
