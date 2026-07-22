---
title: Skill 关联关系当前需要优化的问题清单
doc_role: audit-issue-list
review_date: 2026-07-18
status: review-evidence-current-source
origin_report: docs/项目审查/2026-07-18-skill-flow-system-audit-refresh/review-report.md
baseline_issue_list: docs/项目审查/2026-07-17-skill-flow-system-audit/optimization-issues.md
source_head: 0c1b358605c534db50321a5252e5e6d356dbcefb
current_head_at_calibration: 27baf79f7d3bb0873deb591218c76b9c11a91bbf
working_tree_calibrated_at: 2026-07-21
working_tree_overlay: none
---

# Skill 关联关系当前需要优化的问题清单

当前 P0/P1/P2/P3 均为 0。`current_head_at_calibration` 已包含 P0-P3 修复，并继续保留 SF-11/M-013、SF-14 false-green 与 SF-23 host-lossy projection 的既有对抗性修复；校准时没有 working-tree overlay。已提交 P2 pair delta 为 `+2/-3`，P3 pair delta 为 `0/0`。`source_head` 仍是原始冻结快照。

本清单从同批次校准后的 [review-report.md](review-report.md) 提取，只用于后续 plan/work 消费，不表示问题已获得修复、commit、push、PR 或 lifecycle mutation 授权。

## P1：优先优化

无。

## P2：第二批优化

无。

## P3：文案与低风险合同修正

无。

## 已关闭，不进入优化队列

- **SF-01：** `skills-governance.json` 是 internal delivery 的唯一真源；`spec-commit`、`spec-commit-push-pr` 与 `spec-proof` 由其中的 `entry_surface: internal_only` 与逐宿主 `host_delivery: internal` 投射到 Claude、Codex、Cursor、Kiro、Qoder，不存在第二份 helper 名单。三者不进入 public route；前两者以 `user-invocable:false` 保持严格内部，`spec-proof` 只允许 source 明确声明的显式点名调用。任何 helper invocation、tool permission 或 green tests 都不授予额外 mutation/commit/landing authority。9 条 load-bearing caller edge 均有 target delivery，其中 5 条 Proof caller 覆盖 plan/brainstorm/ideate/explain/pov。关闭证据是 source + focused contracts + 临时 sandbox 五宿主 `init`，不包含真实 host loader/invocation outcome。
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
- **SF-11：** 三份 HTML renderer 已统一承认 report-only `spec-doc-review` consumer，并锁定 `mutation_policy: report-only`、`mutation_reason: html-artifact`、`fixes_applied: 0`；Brainstorm 对 Markdown/HTML 都展示 requirements review，HTML 显式传 `mutation:report-only` 且 byte-preserving；shared consumer prose 同时明确 requirements-only Brainstorm/Ideate HTML 不由 `spec-work` 消费，只有 implementation-ready software plan 才进入 Work，M-013 不再形成 direct edge。关闭证据为 source + RED/GREEN focused contracts，不包含真实 host 菜单、persona dispatch 或 field outcome。
- **SF-12：** Universal Brainstorm 与 Universal Plan 的 Proof-only 分支现在都先在 OS 临时根下物化 run-local Markdown，确认文件存在且非空，再把具体 path/title/identity 交给 `spec-proof`；Save+Proof 发布用户刚保存的同一文件，不重建第二份内容；Proof 失败时保留并报告本地路径。关闭证据为 source + RED/GREEN focused contracts，不包含真实 Proof API publish outcome。
- **SF-18：** `spec-work` 的共置 `references/tracker-defer.md` 已成为唯一规范 owner；由于五宿主 runtime root 不支持通用跨 Skill import，LFG 保留字节一致的 package-local projection，并由 source parity 与五宿主 projection contract 共同约束。两份合同均禁止 `spec-code-review` filing、禁止猜测 `/tmp/spec-first/spec-code-review/...`，durable ticket 只消费具体 `artifact_path`、in-band summary 或已物化的 repo-local evidence。关闭证据为 source parity + five-host projection plan，不包含真实 tracker filing。
- **SF-13：** Universal Ideate 现在明确只把选中 idea 交给 `spec-brainstorm`，不直跳 planning；Brainstorm 不是自动 implementation chain，但用户可在其 wrap-up 显式选择 **Create a plan**，再进入 universal/knowledge-work `spec-plan`。Universal plan 默认不提供 `spec-work`，只有后续真实形成完整 software implementation plan 才进入软件执行链。关闭证据为 source + focused terminal/handoff contract，不包含真实 host menu outcome。
- **SF-14：** App audit 不再把 `spec-code-review` 列为 downstream consumer，`from:code-review` / `code_review_handoff` 只保留为旧 artifact 的休眠兼容字段；Code Review source 无对应 caller/intake。Focused negative contract 先确认真实 `### Downstream Consumers` section 非空再断言无 Code Review，避免空 section false green；不包含 legacy artifact field removal 或真实跨 workflow run。
- **SF-15：** Optimize 删除无 intake 的 `spec-work` consumer，只保留 code review、benchmark/release reviewer 与人工日志审查者。关闭证据为 source + consumer-block contract。
- **SF-16：** Session historian 只允许写 caller 提供的 `/tmp/spec-first/spec-compound/{run_id}/session-history.md`，写成功只返 path，失败返完整 inline prose，且禁止 tracked/product writes。关闭证据为 caller/worker source contract；未执行真实 authorized dispatch。
- **SF-17：** Worktree helper 只声明 Dogfood 当前 caller；未来 caller 必须先在 public owner 建立 forward invocation/intake。关闭证据为 source + caller contract。
- **SF-19：** Figma mutating worker 返回 `changed_paths`、`verification_evidence`、不可从 diff 重建的视觉观察与 remaining blockers，并重复禁止 stage/commit/push/PR/lifecycle/generated-runtime-as-source。关闭证据为 source + worker-packet contract；未执行真实 Figma/browser field run。
- **SF-20：** Code Review 对 `NO-CACHE` 与 helper failure 都 fresh derive profile、跳过 `put`，与 shared cache protocol 一致；dispatch gate 之前仍不派发 profiler。关闭证据为 source + focused dispatch-order/cache contract。
- **SF-21：** Maintainability anchor 50 一律 suppress；有直接客观证据时提升到 anchor 75，否则省略，禁止用 P0/P1 绕 confidence gate。关闭证据为 source + focused confidence contract；未执行 fresh-session persona eval。
- **SF-22：** `spec-riffrec-feedback-analysis` 是 analyzer canonical owner，Sweep 保留 byte-identical package-local projection；source parity 与五宿主 projection contract 均锁定。关闭证据不包含真实媒体分析 field run。
- **SF-23：** `spec-resolve-pr-feedback` 与 `spec-test-xcode` 作为显式用户 standalone skill 投射到五宿主；前者新增 local-fix/commit/push/reply/thread-resolve 五类独立 authority，后者删除虚假 Code Review auto-caller。Projection contract 按宿主语义验证：Cursor 按 allowlist 移除不支持的 `allowed-tools` frontmatter，但保留 user-only entry、authority body 与 `disable-model-invocation`，其余四宿主保留 source tool list；未执行真实 GitHub mutation、XcodeBuildMCP 或 host loader。
- **SF-24：** Deployment prompt 的 activation 已与 orchestrator 的 risky migration-artifact gate 对齐；只有包含 migration/schema artifact 且涉及 destructive DDL、backfill、NOT NULL without default 或 column rename/drop 才可调用。Worker prompt 明确不能 self-invoke，普通 data-processing、model/query/serializer 或 migration-test change 不触发。
- **SF-25：** Validator template 已将 `why_it_matters` 校准为 available-when-present 的可选 detail-tier context；缺失时仍依据 diff 与 cited code 独立验证，不再与 Stage 5b producer contract 冲突。
- **SF-26：** LFG 不再把 Simplify 描述为无条件运行完整 test suite；当前合同明确全项目 typecheck/lint、默认 changed-path scoped tests、按影响面/runner 能力扩大范围，并保留 final verification gate 的完整 closeout authority。

## 建议工作包

P0/P1/P2/P3 审查队列已清空。既存 release-governance summary coverage 缺口属于独立 release continuity 债务，不重新归类为 Skill-flow finding。
