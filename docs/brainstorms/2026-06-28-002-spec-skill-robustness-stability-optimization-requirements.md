---
spec_id: 2026-06-28-002-spec-skill-robustness-stability-optimization
artifact_kind: prd-requirements
target_surface: generic
status: ready-for-planning
evidence_grade: mixed
created: 2026-06-28
source_inputs:
  - docs/项目审查/2026-06-28-spec-skill-健壮性稳定性优化审查.md
relates_to:
  - docs/plans/spec-first-refactor-plan.md
write_mode: final-prd
can_enter_spec_plan: yes
clarification_evidence: asked-owner
preflight_sweep_closure: closed
next_owner_question: none
decision_card_highest_risk_gap: 已无未闭环 blocking；OQ-02/04/05 为 plan-owned HOW defaults，不是 owner 决策
decision_card_next_action: final-prd
decision_card_why_no_invention: OQ-01/OQ-03 为 owner 决策；OQ-02/04/05 为 implementation-only HOW defaults，planning 不需再发明 WHAT
note: 本 PRD 已 owner grill 闭环（OQ-01/OQ-03 owner-answered，见 Owner Decision Trace），can_enter_spec_plan: yes。证据强度为 mixed：confirmed_by_script、source-candidate、owner-confirmed 与 assumption 分栏见 Evidence And Assumptions；ready receipt 只证明当前 artifact 结构与 hash，不替代 R-21 要补的 owner_answer fidelity 校验。
readiness_verified_by: check-prd-artifact.js
readiness_verified_at: 2026-06-29T06:48:35.071Z
readiness_checker_schema: spec-prd-artifact-check.v1
readiness_finding_count: 1
readiness_blocking_count: 0
readiness_prd_hash: sha256:8f3fded020b58181fc19140d933847cdfbe76d70a94543a9411cca68924a4f25
readiness_inputs_hash: sha256:e40974a4adbed2d0fa27f057a2a33cd406ffc0220e4599e711c52080763923ea
---

# spec-first Skill 体系健壮性/稳定性优化需求（PRD-grade，ready-for-planning）

## Summary（概要）

本 PRD 把 `docs/项目审查/2026-06-28-spec-skill-健壮性稳定性优化审查.md` 经 fresh-source 元审查确认成立的优化项，整理为可被 `spec-plan` 消费的需求集合。actor 为 Spec-First Evolution Architect 与后续接手的 plan/work workflow；increment 是 skill 体系的健壮性/稳定性/确定性 gate 加固；intended outcome 是让核心链路 `Codebase→Spec→Plan→Tasks→Work→Review→Knowledge` 的确定性 gate 真正负载、可复用知识真正沉淀、入口路由不可被合理化绕过、audit 信号不再被误报淹没。当前系统锚点是已具备 37 skill governance registry、source/runtime 边界、eval fixture contract 的工程化骨架，本 PRD 不新增 workflow，只闭合四类质量债。形态为 final-prd：WHAT 已定义，两条 blocking owner 决策已闭环（OQ-01/OQ-03，见 Owner Decision Trace），ready receipt 已写入。

## Problem Frame（问题框架）

`spec-first` 的 skill 体系工程化骨架已成型，但存在四类经源码确认的质量债：(1) 唯一确定性 gate（`check-prd-artifact.js`）对 Spec→Plan handoff 失去负载能力——Plan intake 的候选发现仍按 topic + recency 选择，读取已选 origin 后虽已有 PRD-grade carry-forward，但候选排序/展示与 plan frontmatter 不携带 `origin_grade`；(2) Tasks→Work envelope 的路由字段（`semantic_posture`/`dispatch_authorization`）为 LLM 自报、两端无 CLI 校验；(3) 最常发现可复用架构教训的 `spec-doc-review` 零 learning-capture 路径，且 code-review headless 模式沉淀仅靠 advisory 单行；(4) audit scanner 把"禁止手改 runtime"的边界说明报成全仓仅有的 3 个 P0 误报，且 Markdown link checker 对 `{url}` 占位误报。入口路由治理与 eval 覆盖亦有多处经源码确认的缺口。本 PRD 不解决"缺 workflow"问题，只闭合这些确定性 gate、知识沉淀、误报治理与路由防守缺口。默认进入 planning 的最小增量是 Slice A'（4 个 P0 同一 plan/release wave，分 checkpoint 落地）；P1/P2 为后续 backlog，除非用户明确扩大范围，不应被第一轮 plan 折入。

## Change Delta（变更范围）

| item | current | target | delta | evidence |
| --- | --- | --- | --- | --- |
| Spec→Plan intake | 候选发现按 topic+30 天 recency；读取已选 origin 后已有 PRD-grade carry-forward，但候选选择与 plan frontmatter 不携带 origin_grade | 区分 PRD-grade 与 brainstorm-grade，下游可见 origin_grade | 增 artifact_kind-aware 候选排序/展示 + origin_grade 标注 | `planning-flow.md:40-48,65-66`、`plan-template.md:8-15` |
| Tasks→Work envelope | semantic_posture/dispatch_authorization LLM 自报，无 CLI 校验 | CLI 产 reason_code + 语义姿态证据元数据，Work 侧复验证据存在性、来源与 freshness；语义充分性仍由 LLM/human review 判断 | task-pack.js 扩展 + Work 复验段，沿用 `reviewed-existing` 枚举并补证据，不让 CLI 替代语义判断 | `task-pack.js:348-360`、`execution-handoff-contract.md:20,64,90`、`spec-work/SKILL.md:222` |
| doc-review learning-capture | Downstream Consumers 未列 compound，全文无 capture 步骤 | 增 compound 下游 + 移植三段式 + headless/safe_auto 输出路径 advisory 行，且 advisory 携带候选证据/建议动作/用户选择记录 | spec-doc-review/SKILL.md | `spec-doc-review/SKILL.md:43,85-93`、`spec-code-review/SKILL.md:853-857` |
| audit scanner 误报 | 三行边界说明为全仓仅有的 3 个 P0 误报 | 扩 PROHIBITION_HINTS/allowlist，三行降级 | security-patterns.js + fixtures | `security-patterns.js:75-121`、三行 P0 |
| 入口路由防守 | sensitive surfaces 未定义、红旗 skill 名反转、缺席集不全 | 定义 + 改名 + 闭合缺席集 + CURATED_CORE 派生 | routing-red-flags.md + tests | `routing-red-flags.md:7,13,25`、`instruction-bootstrap.test.js:539-540` |

## Requirements（需求）

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | audit scanner 不得把"禁止手改 generated runtime"类边界说明报成 P0 | `security-patterns.js:75-121` PROHIBITION_HINTS 缺 does not/excludes/are not source；全仓实扫三行 P0 误报 `spec-compound:85`/`spec-mcp-setup:34`/`provider-tools.json:56` |
| R-02 | P0 | Spec→Plan intake 的候选发现/选择必须区分 PRD-grade 与 brainstorm-grade origin，并在 plan frontmatter 记录 origin_grade | `planning-flow.md:40-48` 候选发现不看 artifact_kind；`:65-66` 已有读取后 PRD-grade handling；`plan-template.md:8-15` 无 origin_grade；brainstorm 与 PRD 同写 `docs/brainstorms/*-requirements.md`（`requirements-capture.md:285-287`） |
| R-03 | P0 | Tasks→Work envelope 的 semantic_posture 与 dispatch_authorization 必须有可复验的证据元数据与 reason_code；Work 侧复验证据存在性、来源、freshness 与当前合法枚举，不得把语义充分性判断下推给 CLI，也不得无迁移计划引入新 semantic_posture 枚举 | `task-pack.js` 不产 semantic_posture/dispatch_authorization 证据字段（grep 实扫返回空）；`deriveValidity:348-360` 仅产 5 值；`execution-handoff-contract.md:20,64,90` 明确 deterministic_handoff 不证明语义质量；`spec-work/SKILL.md:222` 当前使用 `reviewed-existing` |
| R-04 | P0 | spec-doc-review 必须具备可追踪的 learning-capture 路径，headless 模式与 safe_auto 应用路径至少留一条包含候选证据、建议动作和用户选择记录方式的 advisory 行 | `spec-doc-review/SKILL.md:43` Downstream Consumers 未列 compound，全文无 capture（grep 返回空）；`spec-doc-review/SKILL.md:85-93` 只有 headless 模式与 safe_auto 机制；code-review `:853-857` 三段式可移植 |
| R-05 | P1 | routing-red-flags.md 不得含反转 skill 名 | `:25` 写 bug-report，真实为 report-bug |
| R-06 | P1 | sensitive surfaces 必须在 scope-guards.md 或红旗中有定义与举例 | `routing-red-flags.md:7` 唯一出现且无定义，是最大合理化漏洞 |
| R-07 | P1 | 红旗 route target 不得用裸名 update/setup 引发 spec-* 命名混淆 | `routing-red-flags.md:13` 裸名，应写 spec-first update/`spec-mcp-setup` |
| R-08 | P1 | bootstrap 显式缺席集必须覆盖 slack-research/skill-audit/app-consistency-audit/polish-beta | `instruction-bootstrap.test.js:539-540` 仅断言 sessions/release-notes 缺席 |
| R-09 | P1 | CURATED_CORE 必须从 skills-governance.json 派生，不得硬编码 | `instruction-bootstrap.test.js:514-517` 数组字面量，无 registry 引用 |
| R-10 | P1 | 两条 load-bearing 红旗（vague→brainstorm/plan、run-init-now→route first）必须在 bootstrap 内联或有 intentional deferral 测试 | routing-red-flags.md 有 7 条，bootstrap 仅内联 5 条；无测试守护 |
| R-11 | P1 | prompt-examples-contracts.test.js 的 cases.length 上限必须留 breathing margin | `:107` `<= 14` 当前恰为 14，补 case 即破测 |
| R-12 | P1 | lint-skill-entrypoints scanRoots 必须覆盖 CLAUDE.md/AGENTS.md | `lint-skill-entrypoints.config.json` scanRoots 仅 `["skills"]` |
| R-13 | P1 | spec-work plan-only 路径必须有 plan_body_hash 级新鲜度绑定 | `spec-work/SKILL.md:289-303` 无 source_plan_hash 绑定；`spec-plan/SKILL.md:36` 禁 Plan 生成 task-pack state，边界自相矛盾 |
| R-14 | P1 | spec-work "Large" bare-prompt 路由允许用户覆盖 plan 建议继续必须有可追溯记录 | `spec-work/SKILL.md:158` 允许覆盖继续，sanctioned plan-while-execute 漂移 |
| R-15 | P1 | compound schema component 字段不得强约束 Rails/app 专属 enum | `schema.yaml:72-89` 10/17 值 Rails/app 专属，与 spec-first 语料错配 |
| R-16 | P1 | compound validator 必须强制 required_fields 与 enum，且 Consolidate/Update 后同样跑 validator | `validate-frontmatter.py` 仅查 3 条 YAML-safety；`spec-compound-refresh/SKILL.md:531/543` 仅 Replace 跑 validator |
| R-17 | P1 | compound lightweight 模式跳过 overlap 检查不得无机制调度清理 | `spec-compound/SKILL.md:461` 跳 overlap，推迟到 refresh 但无调度 |
| R-18 | P1 | spec-debug 与 plan/ideate/review 必须用统一召回机制 | `spec-debug/SKILL.md:84` flat scan，其余用 spec-learnings-researcher subagent |
| R-19 | P1 | spec-learnings-researcher agent 自述调用方必须与各 SKILL prose 一致 | `agents/spec-learnings-researcher.agent.md:272-276` 未列 spec-work/spec-debug，与 `spec-debug/SKILL.md:84` 矛盾 |
| R-20 | P1 | spec-work 必须有可执行 learning recall 步骤 | `spec-work/SKILL.md:112` 称"recalled during execution (directly...)"但 body 无 dispatch 步骤（grep 计数 0） |
| R-21 | P1 | check-prd-artifact.js 对 owner-* disposition 必须要求 owner_answer 非空 | `check-prd-artifact.js:463-480` traceRowBindsOq 只查引用不证 owner 答复；`isValidTraceRow:452-454` 不校验 owner_answer |
| R-22 | P1 | brainstorm readiness gate 必须有脚本级确定性预扫 | `requirements-capture.md:217` 完全 LLM-judged（"not a script"）；`:227-231` pre-scan 由 LLM 执行非脚本 |
| R-23 | P1 | brainstorm RBP convert 必须记入 closure_disposition 且可追溯 | `handoff.md:26-28` 允许 convert 后显示 Plan，转换事件无独立审计痕迹 |
| R-24 | P1 | 高风险 public workflow（spec-mcp-setup/spec-optimize/spec-compound-refresh 等）必须有 eval seed | eval-readiness 15/22 missing；spec-mcp-setup 有 44 个 scripts 但 eval missing |
| R-25 | P1 | section lint 必须按 entry_surface 分层，internal_only 默认 P2/P3 | 61 P1 + 61 P2 missing-section 淹没 public workflow 风险 |
| R-26 | P1 | top 5 boundary pair 必须各补 negative eval | brainstorm/prd、debug/optimize、skill-audit/write-skill、prd/write-tasks、code-review/doc-review |
| R-27 | P1 | governance schema 必须拆分 entry_surface 与 host_discoverability | git-worktree 标 internal_only 但 harness available-skills 仍 surface |
| R-28 | P2 | docs/workflow-skill-agent-map.md 必须有防回归 test | P0-1 盘面已无 stale（grep exit 1），仅防复发；token 集 ⊆ governance workflow_command |
| R-29 | P2 | routing-cases.json 必须有顶层 description 与完整 source_refs | 缺 description；source_refs 缺 dispatch-boundaries.md（与 2 个 dispatch tag case 相关） |
| R-30 | P2 | 每条 Route Map 行至少有一个 fixture expected_entrypoint 匹配 | 路由覆盖率机械可见，约 10 行零 fixture |
| R-31 | P2 | SKILL.md 与 references/*.md 内联重复必须有测试守引用防漂移 | 内联为 test-pinned stub 子集，非 false indirection，但需守引用 |
| R-32 | P2 | runtime-drift-report.json 必须含具体 source/runtime path + hash + host | 当前只写 using-spec-first，drift 不可直接定位 |
| R-33 | P2 | provider-owned host doc section 必须有 marker contract | spec-first managed block 与 Graphify ## graphify 段互不覆盖 |
| R-34 | P2 | rule-maturity-observations 空状态不得进 pass/healthy 口径 | status empty/rule_count 0/shadow_hit_count 0，应显示 "no observations yet" |
| R-35 | P2 | 长主面瘦身前必须先补 eval | spec-code-review 1141 行、spec-optimize 733、spec-compound-refresh 710，eval missing |
| R-36 | P2 | boundary-overlap-matrix 必须按 pair 聚合 + shared_vocabulary_only 分类 | 168 candidate 多为共享 vocabulary，非 ownership 冲突 |
| R-37 | P2 | docs/项目审查/README.md 必须有最新审查索引与 active recommendations 指针 | 减少历史报告检索成本 |
| R-38 | P2 | spec-compound-refresh 必须有"审查报告候选可否晋升 durable knowledge"判定 eval | 避免未验证建议直接进 docs/solutions/ |
| R-39 | P2 | routing eval 必须补跨宿主归一化/subagent non-reroute/parent-workspace 只读等分支 | 归一化 prose pin 实际在 `using-spec-first-contracts.test.js:151-154`（非 :140-141） |
| R-40 | P2 | Markdown link checker 必须跳过 {url} 占位与代码块内链接 | `markdown.js:8` 把 {url} 当本地路径；实测 spec-release-notes 产 4 个 P2 broken_local_link |

## Acceptance Examples（验收示例）

AE-01（对应 R-01）
Given 全仓含 `spec-compound/SKILL.md:85`「default excludes generated mirrors」边界说明
When 运行 scanInstructionSecurity 全仓扫描
Then 该行不产 P0 finding（降为 P3 或 rejected candidate），且真实安全禁止指令仍保留原严重度

AE-02（对应 R-02）
Given docs/brainstorms/ 下存在一份 brainstorm-grade 文档（无 artifact_kind）与一份 PRD-grade 文档（artifact_kind: prd-requirements + ready receipt）
When spec-plan Phase 0.2 按 topic 检索上游
Then PRD-grade 被认作 origin_grade: prd，brainstorm-grade 被标 origin_grade: brainstorm，plan frontmatter 记录该等级，下游 spec-write-tasks/spec-work 可见

AE-03（对应 R-03）
Given 一份 task-pack 含 semantic_posture: reviewed-existing 但本运行未实际 reviewed
When spec-work 复验段执行
Then 因缺少 reviewed-existing 的 CLI/审查证据而拒绝执行，且 task-pack.js 产出 reason_code；不得要求 `reviewed-existing-with-evidence` 这类未迁移枚举

AE-04（对应 R-04）
Given spec-doc-review 在 headless 模式发现 learning-worthy 架构教训
When review 完成
Then 输出至少一条 advisory 行指向 spec-compound，Downstream Consumers 含 spec-compound，且 advisory 行包含 learning candidate、证据路径、建议动作和用户选择记录方式，而非完全静默

AE-05（对应 R-06）
Given 用户改动触及 architecture/contract/governance/runtime-delivery/multi-file
When using-spec-first 路由判断 sensitive surfaces
Then sensitive surfaces 在 scope-guards.md 有定义与举例，LLM 不得把此类改动判为"非 sensitive"绕过路由

AE-06（对应 R-21）
Given 一条 owner-* disposition 的 trace 行，owner_answer 为空
When check-prd-artifact.js 校验
Then 报 owner_answer 缺失（reversal anti-pattern 可检测），而非因 chosen_answer 非空即放行

AE-07（对应 R-05/R-07/R-08/R-09/R-10/R-11/R-12）
Given 入口路由治理切片执行
When 修正 routing-red-flags、bootstrap 缺席集、CURATED_CORE 派生、prompt cases 上限和 lint scanRoots
Then 反转 skill 名、裸 update/setup、bootstrap accretion 和 host entrypoint lint 漏扫都有对应 fixture 或 contract test

AE-08（对应 R-13/R-14/R-22/R-23）
Given plan-only work 路径或 brainstorm handoff 带有新鲜度/closure 风险
When spec-work 或 brainstorm handoff 进入执行/计划
Then plan_body_hash、新鲜度记录、owner override trace 和 RBP convert closure_disposition 均可追溯，不能只靠 LLM 自报

AE-09（对应 R-15/R-16/R-17/R-18/R-19/R-20）
Given compound/schema/learning recall 切片执行
When 生成、校验、刷新或召回 docs/solutions learnings
Then component 字段不过度绑定 Rails/app enum，validator 覆盖 required_fields/enum，refresh 后重跑 validator，overlap 清理有调度，debug/work 与 plan/ideate/review 的 learning recall 机制一致

AE-10（对应 R-24/R-25/R-26/R-35/R-38）
Given 高风险 public workflow 或长主面准备瘦身
When 补 eval seed、section lint 分层、top boundary negative eval 或 compound-refresh 晋升判定
Then 每个高风险 workflow 至少有 thin eval seed，internal_only 缺 section 不淹没 public workflow 风险，长主面瘦身前已有 eval 防回归

AE-11（对应 R-27/R-28/R-29/R-30/R-31/R-32/R-33/R-34/R-36/R-37/R-39）
Given governance/reporting/drift 切片执行
When 更新 governance schema、workflow map、routing cases、runtime drift report、provider marker、maturity observations、boundary matrix 或审查索引
Then entry_surface 与 host_discoverability 分离，route map 覆盖可机械观察，runtime drift 能定位 path/hash/host，空 observations 不进入 healthy/pass 口径

AE-12（对应 R-40）
Given Markdown link checker 扫描含 `{url}`、`{older_url}` 或代码块内 markdown link 的 skill 文档
When 运行 skill-audit markdown link 检查
Then placeholder 和代码块链接不产生 broken_local_link，真实本地 broken link 仍被报告

## Scope Boundaries（范围边界）

### In Scope（纳入范围）

- 闭合 Spec→Plan / Tasks→Work / Review→Knowledge 三处确定性 gate 与知识沉淀
- audit scanner 误报治理（PROHIBITION_HINTS/allowlist + link checker placeholder）
- 入口路由防守（红旗名/定义/缺席集/CURATED_CORE 派生/红旗回补）
- 高风险 workflow eval seed 与 boundary negative eval
- compound schema/validator/召回机制一致性
- PRD owner-answer fidelity 与 brainstorm 确定性预扫
- 长期维护成本项（防回归 test/drift 定位/长主面瘦身前置 eval）

### Out Of Scope（排除范围）

- 不新增 public workflow（用户入口已足够）
- 不重写已 byte-faithful 的 bootstrap 守卫主体（R-08/R-09/R-10 仅补边界）
- 不重构已健全的三层 severity 分类结构（R-01 仅补缺口）
- 不把 docs/workflow-skill-agent-map.md 改成全自动生成（人工用途/agent 调度说明保留）
- 不在 planning 阶段重新 grill 已闭环的 OQ-01/OQ-03 owner 决策；OQ-02/OQ-04/OQ-05 是 plan-owned HOW defaults，可在实现设计中复核但不得发明新的 WHAT
- 不自动跑 spec-compound、不自动写 docs/solutions/（learning-capture 保持 user's choice）

## Evidence And Assumptions（证据与假设）

| claim | tag | source / owner | note |
| --- | --- | --- | --- |
| 三行 runtime governance P0 为全仓仅有的 3 个 P0 误报 | confirmed_by_script | 全仓实扫 scanInstructionSecurity | 三层 negation 对其全部失效 |
| PROHIBITION_HINTS 未收录 does not/excludes/are not source | source-candidate | `security-patterns.js:75-121` | does not ≠ `/\bdo not\b/i` |
| Plan intake 候选发现不按 artifact_kind 过滤/排序，plan frontmatter 无 origin_grade | source-candidate | `planning-flow.md:40-48`、`plan-template.md:8-15` | `planning-flow.md:65-66` 已有读取后 PRD-grade handling，缺口不是“完全不识别 PRD” |
| task-pack.js 不产 semantic_posture/dispatch_authorization 证据字段 | confirmed_by_script | grep 实扫返回空 | deriveValidity:348-360 仅 5 值；现有合法 posture 仍为 `reviewed-existing` |
| doc-review 全文无 compound/learning | confirmed_by_script | grep 返回空 | code-review `:853-857` 可移植 |
| bootstrap byte-faithful test 已存在 | source-candidate | `instruction-bootstrap.test.js:401-415` | 已 CI 守护，R-08/R-09/R-10 仅补边界 |
| P0-1 map stale 盘面已无 | confirmed_by_script | grep exit 1，mtime Jun 28 06:25:17 | 归因不确定，R-28 仅防回归 |
| 各 SKILL.md 行数 | confirmed_by_script | wc -l 7/7 精确命中 | code-review 1141/optimize 733/... |
| eval readiness 15/22/37 | confirmed_by_script | eval-readiness-report.json | 37=15+22 |
| Owner 决策：4 P0 同批执行、origin_grade 可见不阻断 | owner-confirmed | Owner Decision Trace | OQ-01/OQ-03 已 closed；同批表示同一 plan/release wave，不表示同一不可拆 task |
| 假设：scanner 扩展不误降真实安全指令 | assumption | 需 fixture 验证 | 见 NA-01 |
| Ready receipt limitation | source-candidate | `check-prd-artifact.js` + R-21 | receipt 证明 artifact 结构/hash 当前有效，不证明 owner_answer fidelity；R-21 仍需在 checker 中硬化 |

### 核对纠正记录（已剔除失实项）

本 PRD 已从审查报告剔除以下经 fresh-source 核对确认失实或已满足的项，不计入 Requirements：

| 原审查项 | 真实状态 | 处置 |
| --- | --- | --- |
| P0-1 map `spec-update` stale | 盘面已无（grep exit 1） | 降为 R-28 防回归（P2） |
| P0-2 byte-faithful repo-state test 缺失 | 已存在（`instruction-bootstrap.test.js:401-415` + `instruction-bootstrap.js:38-82`） | 移除主体；细分点为 R-08/R-09/R-10 |
| P0-3「scanner 误报已处理」 | 附录 B 初稿纠错本身错误，三行 P0 仍为 live 误报 | 恢复 P0，即 R-01 |
| 附录 A-D「code-review headless 完全抑制」 | 源码 `:857` 允许至多一行 advisory | 措辞修正，R-04 目标是 doc-review 达同等基线 |
| P0-4b「task-pack.js 只产两字段」 | 过窄，CLI 另产 validation/errors/limitations | 措辞修正，R-03 保留核心 |

## Source-Of-Truth Resolution（真相源裁决）

| item | current source-of-truth | target source-of-truth | generated mirrors / non-authoritative refs | conflict rule |
| --- | --- | --- | --- | --- |
| 入口路由红旗 | `routing-red-flags.md` | 同（修正后） | bootstrap 内联 stub | stub 须与 reference 守引用一致 |
| bootstrap 守卫 | `instruction-bootstrap.js` + tests | 同（补缺席集 + CURATED_CORE 派生） | `CLAUDE.md`/`AGENTS.md` checked-in block | block 必须 byte-faithful 对齐 generator |
| Spec→Plan origin grade | `planning-flow.md`（候选发现不分 grade，读取后才 PRD-grade handling）+ `plan-template.md`（无 origin_grade） | `planning-flow.md` + `plan-template.md`（候选标注/排序 + frontmatter origin_grade） | brainstorm/PRD 同目录文件名 | origin_grade 可见不阻断，不能拒绝 brainstorm-grade direct entry |
| envelope 路由字段 | `task-pack.js`（不产 semantic_posture/dispatch_authorization 证据字段） | `task-pack.js`（产 reason_code + 语义姿态证据元数据；LLM/human 仍 owns 语义充分性判断） | LLM 自报字段 | CLI 可复验证据优先于裸 LLM 自报；不得让脚本替代语义判断；不得无迁移计划改写 `semantic_posture` enum |
| doc-review learning | 无（grep 返回空） | `spec-doc-review/SKILL.md`（增 compound + 三段式） | code-review `:853-857` 三段式 | 移植须按 doc 语境裁剪 |
| audit scanner 分类 | `security-patterns.js` PROHIBITION_HINTS | 同（扩边界措辞） | false-positive fixtures | 真实安全指令不得误降级 |

## Negative Acceptance（反向验收）

NA-01
Given scanner 扩展 PROHIBITION_HINTS 后
When 遇真实禁止性安全指令（无 generated-runtime 边界语境）
Then must not 误降级为 P3，必须保留原严重度

NA-02
Given spec-plan intake 命中 brainstorm-grade 文档
When 标注 origin_grade
Then must not 拒绝消费（直接入口合法），仅记录等级让下游可见

NA-03
Given spec-doc-review 增 learning-capture 后
When headless 模式运行
Then must not 自动跑 spec-compound 或自动写 docs/solutions/（保持 user's choice）

NA-04
Given 本 PRD 为 final-prd 且 can_enter_spec_plan: yes
When 后续 planning 接手
Then must not 重新发明或重新 grill OQ-01/OQ-03 的 owner 决策；must preserve Slice A' 作为默认最小 planning increment，并把 OQ-02/OQ-04/OQ-05 当作 plan-owned HOW defaults 复核

## Goals / Success Metrics（目标与可观测信号）

本 PRD 不发明数值目标，使用行为/契约级可观测信号（对齐 PRD 模板 Workflow/Skill/Runtime Quality Signals）：

- 确定性 gate 负载：Spec→Plan 区分 origin_grade 的 fixture 通过；Tasks→Work semantic_posture 拒执行 fixture 通过；doc-review learning-capture trigger case 通过 fresh-source eval
- 误报治理：全仓实扫 P0 数从 3（全误报）降至 0；{url} placeholder 不产 broken_local_link（fixture 验证）
- 路由防守：sensitive surfaces 定义存在（grep 命中 scope-guards.md）；红旗无反转 skill 名；bootstrap 缺席集覆盖 6 项
- eval 覆盖：高风险 public workflow eval readiness 从 missing 到 ready；top 5 boundary pair 各有 negative eval
- 回归守护：workflow-skill-agent-map 防回归 test 存在；runtime-drift report 含 path/hash/host
- 开发者收益：试跑一次从本 PRD 进入 spec-plan/spec-work 的 handoff，记录是否仍需重新询问 OQ-01/OQ-03、是否误把 brainstorm-grade 当 PRD-grade 阻断、是否因 semantic_posture 证据不足被及时拒绝；audit triage 输出应能区分 confirmed、candidate、likely false positive，减少人工二次判读
- 知识采纳闭环：doc-review learning-capture 不仅输出 advisory 行，还能把候选教训、证据路径、建议动作和用户选择（接受/延后/跳过）交给 spec-compound 或后续人工决策；不自动写 docs/solutions

所有信号以 contract test / fresh-source eval / 全仓实扫 / 一次 source-backed handoff trial 验证，不发明数值阈值。

## Outstanding Questions（悬而未决的问题）

OQ-01/OQ-03 为 owner-answered 决策，已写入 Owner Decision Trace。OQ-02/OQ-04/OQ-05 的 `closed` 表示 PRD 不再阻塞 planning；其 recommended default 是 plan-owned HOW 起点，不是 owner 批准的 implementation design，后续 plan 可在不发明 WHAT 的前提下复核。

| id | question | prd write target | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended default |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OQ-01 | 4 个 P0 项是否同批执行，还是按 Feature Slices A' 拆分先后？ | Feature Slices | no | owner-answered | 否 | closed | owner 选同批执行 4 P0（见 Owner Decision Trace） |
| OQ-02 | R-01 scanner 扩展采用 PROHIBITION_HINTS 扩展还是 allowlist 豁免？ | Requirements R-01 | no | implementation-only-how-pushdown | 否 | closed | PROHIBITION_HINTS 扩展 + 边界语境收紧（HOW 下推 planning） |
| OQ-03 | R-02 origin_grade 标注后，下游 spec-write-tasks/spec-work 如何消费该等级？ | Requirements R-02 | no | owner-answered | 否 | closed | owner 选可见不阻断（见 Owner Decision Trace） |
| OQ-04 | R-15 compound component 改 free-string + advisory enum 还是重设 enum？ | Requirements R-15 | no | implementation-only-how-pushdown | 否 | closed | free-string + advisory enum（HOW 下推 planning） |
| OQ-05 | 长主面瘦身（R-35）是否在本批次纳入，还是延后单独 plan？ | Feature Slices | no | implementation-only-how-pushdown | 否 | closed | 延后（R-35 为 P2 不在 4 P0 同批次），瘦身前必须先补 eval |

## Owner Decision Trace（owner 决策追溯）

绑定 OQ-01 / OQ-03（clarification_evidence=asked-owner，两 OQ closure_disposition=owner-answered）。

| question | owner_answer | chosen_answer | prd write target | consequence | closure_state |
| --- | --- | --- | --- | --- | --- |
| 4 个 P0 项是否同批执行，还是按 Feature Slices A' 拆分先后？ | 同批执行 4 个 P0 | 4 个 P0（R-01/R-02/R-03/R-04）同批执行，不拆分先后 | Feature Slices | 改动面横跨 scanner/CLI envelope/skill prose/plan intake 四处，风险集中、回归定位难；需更强 contract test 覆盖与分步验证（每项落地后单独跑对应 test suite，再合跑全量）；R-01 落地后须全仓实扫确认三行 P0 降级 | closed |
| R-02 origin_grade 标注后，下游 spec-write-tasks/spec-work 如何消费该等级？ | 可见不阻断 | plan frontmatter 记录 origin_grade，下游 spec-write-tasks/spec-work 可见但不阻断执行，保留 Plan 容忍直接入口契约 | Requirements R-02 | origin_grade 仅作 review/审计可见信号，不阻断 brainstorm-grade origin 进 plan/work；下游不得因 origin_grade 拒绝执行 | closed |

## Planning Recheck（计划复检）

| item | why recheck | required before | blocks planning? |
| --- | --- | --- | --- |
| `security-patterns.js` 当前 PROHIBITION_HINTS 完整列表 | R-01 方案需基于当前真实列表扩边界 | R-01 落地 | no |
| `task-pack.js` deriveValidity 当前返回值与 finding code 映射 | R-03 reason_code 映射需对齐 | R-03 落地 | no |
| `spec-code-review/SKILL.md:853-857` 三段式当前完整文本 | R-04 移植需按 doc 语境裁剪 | R-04 落地 | no |
| `skills-governance.json` 当前 schema 字段 | R-09/R-27 需基于当前 schema 派生 | R-09/R-27 落地 | no |

## Feature Slices（特性切片）

执行切片为 PRD handoff 单位，非执行单元。切片 ownership 必须互斥；默认 planning increment 是 Slice A'。Slice B-E 是后续 backlog，除非用户明确扩大范围，不应被第一轮 implementation plan 自动折入。

> **开发状态（2026-06-29 更新）：** Slice A' ✅ 已完成（plan `docs/plans/2026-06-28-003-refactor-spec-skill-stability-gates-plan.md` + tasks `docs/tasks/2026-06-28-001-refactor-spec-skill-stability-gates-tasks.md`）。Slice B ✅ + Slice C ✅ 已完成（plan `docs/plans/2026-06-28-005-refactor-routing-governance-link-checker-plan.md`，R-05~R-12 + R-40）。Slice D ✅ 已完成（plan `docs/plans/2026-06-28-006-refactor-high-risk-eval-seed-knowledge-plan.md`，R-24/R-25/R-26/R-37/R-38 全部落地，runtime mirrors 已刷新，三 SKILL Examples-As-Context 指针 fresh-source eval PASS）。Slice E（R-13~R-23、R-27~R-36/R-39）⬜ 未开始，无对应 plan 文档。

### Slice A'：4 个 P0 同批执行（R-01/R-02/R-03/R-04，owner 决策）— ✅ 已完成

- owner 决策（OQ-01）：4 个 P0 同批执行，不按 A'→B 拆分先后
- 同批语义：同一 plan/release wave 内完成四个核心 handoff 缺口，分别设置 implementation checkpoint、验证命令和 stop condition；不得合并成一个不可拆 task 或单 commit
- 产品理由：四个 P0 分别闭合 Spec→Plan、Tasks→Work、Review→Knowledge 与 audit 信号可信度，单独修一处会让核心链路相邻节点继续漏证据
- 同批改动面：R-01 scanner（security-patterns.js + false-positive/negative fixtures；不含 `markdown.js` link checker）+ R-02 plan intake（planning-flow.md/plan-template.md + eval）+ R-03 envelope evidence（task-pack.js/spec-work/SKILL.md/task-pack-schema.md + boundary-cases.json，CLI 只证 evidence/freshness/reason_code，不替代语义判断）+ R-04 skill prose（spec-doc-review/SKILL.md + eval）
- 风险：改动横跨 scanner/CLI/skill prose/plan intake 四处，回归定位难，需更强 contract test 覆盖与分步验证（每项落地后单独跑对应 test suite，再合跑全量）
- 共同验证：R-01/R-02/R-03 改 script 与 schema，按常规 contract test；R-04 改 skill prose，必须 fresh-source eval（CLAUDE.md 硬要求）；R-01 落地后全仓实扫确认三行 P0 降级
- origin_grade 消费（OQ-03 owner 决策）：plan frontmatter 记录，下游 spec-write-tasks/spec-work 可见但不阻断

### Slice B：Markdown link checker 跟进（R-40，依赖 A' 的 R-01 fixture pattern）— ✅ 已完成

- 修 markdown.js {url} placeholder 跳过 + 代码块跳过
- 复用 A' 的 scanner false-positive fixture 分层，但不重新拥有 R-01

### Slice C：入口路由治理（R-05/R-06/R-07/R-08/R-09/R-10/R-11/R-12）— ✅ 已完成

- 反转 skill 名修正 + sensitive surfaces 定义 + 缺席集闭合 + CURATED_CORE 派生 + 红旗回补 + 放宽 cases.length + scanRoots 扩展

### Slice D：高风险 eval seed + 知识沉淀（R-24/R-25/R-26 + R-37/R-38）— ✅ 已完成

- spec-mcp-setup eval → 第二波 public workflow → boundary negative eval → compound-refresh 修整

### Slice E：长期维护成本（R-13~R-23 + R-28~R-36 + R-39，P1/P2）— ⬜ 未开始

- E1 Work/Plan handoff：R-13/R-14/R-21/R-22/R-23
- E2 compound/learning consistency：R-15/R-16/R-17/R-18/R-19/R-20
- E3 governance/reporting/drift：R-28/R-29/R-30/R-31/R-32/R-33/R-34/R-36/R-39
- E4 eval-before-slimming：R-35

## Closeout Summary（收口总结）

- Resolved before planning：40 条优化项 WHAT 已整理为 requirements；P0 的关键源码事实已 bounded direct read 复核；OQ-01（4 P0 同批执行）/OQ-03（origin_grade 可见不阻断）已 owner-answered 闭环
- Still carried：OQ-02/OQ-04/OQ-05 为 implementation-only-how-pushdown（scanner 扩展方式/compound component 形态/长主面瘦身延后均为 HOW defaults，下推 planning 时复核），不阻断 plan，也不是 owner-approved implementation design
- planning_would_invent_what：无 blocking 未闭环项；OQ-02/04/05 为 HOW 下推 planning，不发明 WHAT
- sections included：Summary/Change Delta/Requirements/Acceptance Examples/Scope Boundaries/Evidence And Assumptions + Problem Frame/Source-Of-Truth Resolution/Negative Acceptance/Goals/Outstanding Questions/Planning Recheck/Feature Slices/Closeout Summary
- requirement count：40（P0:4 / P1:23 / P2:13）
- acceptance example count：12 AE + 4 NA
- priority distribution：P0=4, P1=23, P2=13
- NFR count：0（本 PRD 为 workflow/skill 质量债，无产品级 NFR）
- assumption count：1（scanner 扩展不误降真实安全指令）
- outstanding question count：5（0 blocking；2 owner-answered；3 implementation-only-how-pushdown）
- planning recheck item count：4
- uncovered requirements：0 after AE-07~AE-12 slice-level coverage；checker 只证明 R-ID 出现在 Acceptance Examples，不证明每条语义验收充分
- feature items without acceptance examples：0 at R-ID coverage；slice-level AE 仍需 plan 转成具体 test fixtures
- evidence strength：mixed（confirmed_by_script/source-candidate/owner-confirmed/assumption 分栏）；planning 必须按 Planning Recheck 复核 R-01/R-02/R-03/R-04 关键源码事实
- fresh-source eval status：not_run（本 PRD 为新建 artifact，未改 skill/agent prose 语义，无需 fresh-source eval；后续 R-04 落地时必须 fresh-source eval）
