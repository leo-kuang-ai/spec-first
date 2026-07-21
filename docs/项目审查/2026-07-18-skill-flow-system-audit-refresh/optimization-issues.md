---
title: Skill 关联关系当前需要优化的问题清单
doc_role: audit-issue-list
review_date: 2026-07-18
status: review-evidence-current-source
origin_report: docs/项目审查/2026-07-18-skill-flow-system-audit-refresh/review-report.md
baseline_issue_list: docs/项目审查/2026-07-17-skill-flow-system-audit/optimization-issues.md
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: 11b26b954a9b36483b97723b4c6917951c1813bc
working_tree_calibrated_at: 2026-07-21
working_tree_overlay: uncommitted-sf12-sf18-sf13-contract-repair
---

# Skill 关联关系当前需要优化的问题清单

当前 P0/P1 均为 0。SF-01、SF-02、SF-03、SF-04、SF-05、SF-06、SF-07、SF-08、SF-09、SF-10、SF-11、SF-12、SF-13、SF-18、SF-27 已由 current source 与 focused contracts 关闭，不进入优先优化队列。`source_head` 仍是原始冻结快照；`current_head_at_calibration` 已包含此前 P0/P1 与 SF-11 修复，当前 overlay 关闭原 P2 SF-12、SF-18、SF-13。

本清单从同批次校准后的 [review-report.md](review-report.md) 提取，只用于后续 plan/work 消费，不表示问题已获得修复、commit、push、PR 或 lifecycle mutation 授权。

## P1：优先优化

无。

## P2：第二批优化（9 项）

1. **SF-14 App audit 声明 code-review 集成，但对端无 caller/intake。** 应正式接线 `from:code-review` / `code_review_handoff`，或删除不存在的 integration claim。
2. **SF-15 Optimize 声称 `spec-work` 是 consumer，却没有真实 handoff。** 应删除纸面 consumer，或补最小 trigger/payload/intake contract。
3. **SF-16 Compound session-historian 的写文件与返回合同冲突。** Caller 要求 scratch artifact + path，worker 却禁止写文件并只返文本；应统一为一种 authoritative return。
4. **SF-17 Worktree helper 的 reverse caller 声明过期。** Helper 声称 `spec-work` / `spec-code-review` 会调用，真实 forward edge 只有 Dogfood；应删除过时 caller 或在 public owner 正式接线。
5. **SF-19 Figma mutating worker 返回合同不完整。** 缺 `changed_paths`、verification evidence，以及 worker 禁止 stage/commit 的明确边界；应对齐通用 worker packet。
6. **SF-20 Repo-profile cache 的 NO-CACHE fallback 说法不一致。** Shared protocol 要求 fresh derive，code-review consumer 却选择 no-profile；应明确 full protocol 是否允许 consumer-specific fallback。
7. **SF-21 Maintainability persona 与 synthesis confidence gate 仍需独立复核。** Baseline 记录 persona 允许 P1/anchor-50 存活、synthesis 仅允许 P0/50；虽 SF-06 已修 threshold precedence，本项尚未被 current audit 单独校准为关闭。
8. **SF-22 Sweep/Riffrec 复制同一 analyzer，无 canonical owner/parity test。** 应保留 package-local copy 并增加同源/parity contract，或建立唯一 owner。
9. **SF-23 `spec-test-xcode` / `spec-resolve-pr-feedback` 缺真实 public caller。** 应退役孤儿 helper，或绑定真实 public owner；不能保留 reverse-only integration。

## P3：文案与低风险合同修正（3 项）

1. **SF-24 Deployment prompt activation 比 orchestrator gate 更宽。** 统一触发说明；worker 本身不可自调用。
2. **SF-25 Validator 将 `why_it_matters` 写成必填，但 orchestrator 允许缺失。** 改为 `when available`，或统一 producer/validator contract。
3. **SF-26 LFG 错称 Simplify 会跑完整测试。** 实际 simplify 先跑 affected scoped tests；应修正文案，最终 verification gate 继续拥有完整 closeout truth。

## 已关闭，不进入优化队列

- **SF-01：** `spec-commit`、`spec-commit-push-pr` 与 `spec-proof` 已加入现有 internal delivery allowlist，并以完整 package references 投射到 Claude、Codex、Cursor、Kiro、Qoder；三者保持 `internal_only`、不进入 public route。前两者以 `user-invocable:false` 保持严格内部，`spec-proof` 只允许 source 明确声明的显式点名调用；任何 helper invocation、tool permission 或 green tests 都不授予额外 mutation/commit/landing authority。9 条 load-bearing caller edge 均有 target delivery，其中 5 条 Proof caller 覆盖 plan/brainstorm/ideate/explain/pov。关闭证据是 source + focused contracts + 临时 sandbox 五宿主 `init`，不包含真实 host loader/invocation outcome。
- **SF-02：** 两套 compound package 的 schema、模板、YAML 指南与 validator 保持字节一致；Full、Lightweight、Refresh Replace 与 materially rewriting 的 Refresh Consolidate 均调用 `--promotion`，且 Consolidate 的 destructive delete 后置到 promotion/claims/cross-reference checks 之后。缺少、空值、错误类型、常见 YAML parser 隐式非字符串值，或普通/YAML-equivalent 重复的 `source_refs` / `invalidation_condition` 会确定性失败，默认模式仍接受 untouched legacy learning。关闭证据只覆盖机械字段形态与 workflow contract，不替代引用可信度或失效语义判断。
- **SF-03：** Runtime Setup、配置模板与 focused test 已按真实 consumer 统一 `plan_output`、`brainstorm_output`、`ideate_output` 的 active 状态；注释示例不激活配置，缺失/无效/注释值仍分别回退到 `md`、`md`、`html`，pipeline override 继续由 consumer 自己决定。关闭证据是 source + focused contracts，不包含真实 host/local config field run。
- **SF-04：** `spec-doc-review` 现优先识别 `type: task-pack`，即使 deterministic contract 不完整也不降级为普通 plan；task pack 强制 `report-only` / `task-pack-derived-artifact`，真实 `tasks validate` receipt 只提供 identity/freshness/structure 地板，source plan 继续拥有 scope/acceptance/architecture/non-goals/verification。专属 lens 覆盖 dependency/wave、files/side effects、test/done、`stop_if`、`review_gate` 与 human/JSON parity；`task_pack_outcome` 将通过、pack gap、plan gap、deterministic failure 分别交给 `spec-work-task-pack`、`spec-write-tasks`、`spec-plan` 或 incomplete stop。关闭证据是 source + 正负 handoff focused contracts，不包含真实 host/persona field run。
- **SF-10：** 用户 artifact map 现与 schema 的 `workflow_integrated` 条件、producer 的 durable-trigger reason、v2 `direct_evidence_used` 五字段、v1 `graph_evidence_used` read/prune 兼容和 source-owned reader 边界一致；文档不再把 `false` 写成唯一 current contract，也不再声称 workflow 会自动发现或隐式消费 run artifact。关闭证据是 map/schema/producer focused contract 与 RED/GREEN 文档一致性测试，不包含真实用户阅读或跨宿主渲染 field outcome。
- **SF-06：** maintainability persona 的 1000 行 threshold 现明确为 persona-owned mechanical rule；shared false-positive catalog 只 suppress 无项目规则、无 persona exact mechanical/structural condition 的主观 “file getting long / hard to read”。共享模板先保留已被 diff 直接证明的 persona severity/confidence，再对其余 shape 执行 FP-over-advisory precedence，避免 1k P1/anchor-100 先绕过 suppress、又被 generic advisory 降成 anchor-50；四个 planted cases 分别锁定 1k crossing、thin wrapper、duplicate canonical helper 与 subjective long-file suppression。关闭证据是 source + focused contract/eval fixture，不包含真实 fresh-session persona dispatch。
- **SF-05：** `autofix_class` 只保留 follow-up 分类语义，唯一 apply authority 是 run-local `mutation_policy`；普通 review=`report-only`，显式 review-and-fix 才可 `apply-fixes`，`mode:agent` 永远 report-only。
- **SF-07：** Dogfood/Polish 已分别解析 `branch_mutation_authorization`、`local_fix_authorization`、`commit_authorization`、`landing_authorization`；branch/PR 参数只选 scope，`done` 不授权 commit，无 commit/landing authority 时保留 verified uncommitted changes 且不 push/建 PR。
- **SF-08：** `spec-brainstorm` 已使用 exact `spec-lfg` 名称和绝对 artifact payload；未验证真实 host menu invocation。
- **SF-09：** LFG/browser 已闭合 applicable/not_applicable、exact origin、effect 与 cleanup blocker；未运行真实 browser field outcome。
- **SF-27：** 12 个原缺口 package 已补齐 package-local authorization/capability/fallback，原 6 个合格 package 继续满足基线；聚焦矩阵覆盖 18/18。对抗性复核发现 `spec-code-review` 仍在 Stage 1c 前为 trivial PR 派发轻量 subagent，现已改为 orchestrator inline conservative judgment，并锁定 profile dispatch 位于 gate 之后。敏感与 mutating worker 仍受各自数据/写入/commit/landing 边界约束。
- **SF-11：** 三份 HTML renderer 已统一承认 report-only `spec-doc-review` consumer，并锁定 `mutation_policy: report-only`、`mutation_reason: html-artifact`、`fixes_applied: 0`；Brainstorm 对 Markdown/HTML 都展示 requirements review，HTML 显式传 `mutation:report-only` 且 byte-preserving；Ideate renderer 不再泄漏 plan-specific `5.3.8` prose。关闭证据为 source + RED/GREEN focused contracts，不包含真实 host 菜单、persona dispatch 或 field outcome。
- **SF-12：** Universal Brainstorm 与 Universal Plan 的 Proof-only 分支现在都先在 OS 临时根下物化 run-local Markdown，确认文件存在且非空，再把具体 path/title/identity 交给 `spec-proof`；Save+Proof 发布用户刚保存的同一文件，不重建第二份内容；Proof 失败时保留并报告本地路径。关闭证据为 source + RED/GREEN focused contracts，不包含真实 Proof API publish outcome。
- **SF-18：** `spec-work` 的共置 `references/tracker-defer.md` 已成为唯一规范 owner；由于五宿主 runtime root 不支持通用跨 Skill import，LFG 保留字节一致的 package-local projection，并由 source parity 与五宿主 projection contract 共同约束。两份合同均禁止 `spec-code-review` filing、禁止猜测 `/tmp/spec-first/spec-code-review/...`，durable ticket 只消费具体 `artifact_path`、in-band summary 或已物化的 repo-local evidence。关闭证据为 source parity + five-host projection plan，不包含真实 tracker filing。
- **SF-13：** Universal Ideate 现在明确只把选中 idea 交给 `spec-brainstorm`，不直跳 planning；Brainstorm 不是自动 implementation chain，但用户可在其 wrap-up 显式选择 **Create a plan**，再进入 universal/knowledge-work `spec-plan`。Universal plan 默认不提供 `spec-work`，只有后续真实形成完整 software implementation plan 才进入软件执行链。关闭证据为 source + focused terminal/handoff contract，不包含真实 host menu outcome。

## 建议工作包

P1 队列已清空，SF-11、SF-12、SF-18、SF-13 已关闭；下一批按 P2 优先处理 SF-16（session-historian authoritative return 冲突）、SF-19（Figma mutating worker packet 不完整）与 SF-14（App audit/code-review integration claim 未闭合）。
