---
title: "feat: v1.17 Governance Maturity 整版（规则自进化闭环 + governance ROI + resource hardening）"
type: feat
status: completed
date: 2026-06-10
spec_id: 2026-06-10-001-rule-maturity-shadow-producer
implements_schemas:
  - docs/contracts/governance/rule-maturity.schema.json
  - docs/contracts/governance/resource-governance-lens.schema.json
---

# feat: v1.17 Governance Maturity 整版（规则自进化闭环 + governance ROI + resource hardening）

## Summary

v1.17 是 spec-first「自我进化」支柱的规则轮：知识轮（docs/solutions 沉淀→检索）已闭环，规则轮（观测→裁决→晋升→毕业→退役）由本计划推进。**当前 active scope 只包含 phase 1 / U1-U6**：为 `rule-maturity.v1` 接上唯一 producer（record/list），让 governance lens 命中的 shadow 观测先流动起来，并把研发人员可见提示放在 `spec-code-review` 最终汇总的 `Rule Maturity Candidates` 小节。phase 2-4 / U7-U14 保留为 `deferred-pending-phase1-evidence` 的候选设计，不再作为本轮 active implementation contract；后续只有在 phase 1 真实运行证据证明观测密度、裁决 owner/cadence 与消费者链路成立后，才重新计划人审裁决、晋升报告、blocking 毕业、governance ROI 与 resource hardening。全程无自动晋升、无 daemon、无 runtime hook：脚本记录事实与阈值对照，stage 变更只经人审署名；第一版不新增专用 agent，候选提示由既有 workflow synthesis/prose 承担。

---

## Problem Frame

SCALE 集成路线（`docs/01-需求分析/13.scale-integration/README.md`）中 v1.11–v1.16 已全部完成，v1.17 Governance Maturity 是唯一未开始的版本。但路线自己钉死了硬前置：RuleMaturity 的 required-evidence / blocking 候选需要 v1.14 foundation「先运行、沉淀误报证据 + 人审」（父方案 §4.7）。

现状是 `rule-maturity.v1` 自 v1.14 起为有意的 schema/docs-only shadow 例外：无 producer、无 helper、仓库内没有任何 `shadow_hits` 观测记录落盘。promotion 所需的证据集是空集。直接实现 promotion/blocking 会违反路线验收口径；正确的第一步是建立最小证据生产链路，再沿证据逐 phase 推进到裁决、晋升与毕业。评审结论已把这个约束升为执行边界：phase 1 active，phase 2-4 只作为候选路线保存，避免在空证据集上提前钉死人审、阈值、复合键和 blocking gate 细节。

全局定位：spec-first 的产品三支柱是「0-1/1-100 需求交付、团队大规模协作、自我进化」。自我进化有两个轮子——知识轮（解决过的问题沉淀进 docs/solutions、下次自动检索，已闭环）和规则轮（踩过的坑固化为可升级、可退役的治理规则，当前断裂）。v1.17 补的就是规则轮，让「重复的问题不会重复犯错」从靠 LLM 记性变成靠治理机制。harness 工程化实践（`docs/01-需求分析/14.harness-engineering/`）给出三条直接输入：每条规则都是一次事故的墓志铭（规则的诞生源头是真实 hit，不是凭空设计）；验证反馈质量决定 agent 可靠性（arxiv 2605.29682：验证反馈 R²=0.94 vs token 预算 R²=0.33——规则的毕业形态应是确定性 gate）；构建是为了删除（每条晋升规则必须带退役路径，否则 harness 越积越厚反成负担）。同时按 OPT-D 裁决过滤掉 harness 文档中与 spec-first 哲学冲突的建议：不引入 dispatcher 状态机、不建 G0-G22 式 runtime 门禁墙、不做 runtime hook 拦截——spec-first 的 blocking 落点是 contract test 进 CI，这正是仓库既有实践（`governance-contracts.test.js` 的断言本质上就是毕业规则）的正式化。

面向用户的产品定位需要压住治理复杂度：spec-first 是给研发人员高质量完成 AI coding 的工程 harness，不是为了治理而治理。规则轮的提示点应贴近日常研发判断发生的位置：`spec-code-review` 已经在判断 finding 是否真实、是否缺测试、是否违反项目约定，因此它适合在最终汇总时轻量输出 rule-maturity 候选；`spec-compound` 适合在 verified learning 写成后提示「这个 learning 是否值得成为规则候选」；`spec-skill-audit` 只承担周期性治理健康检查，不作为普通研发人员的人审主入口。

---

## Requirements

**Phase 1（shadow 观测 producer）：**

- R1. 存在唯一可追溯的 shadow-hits producer：`spec-first internal rule-maturity record`，每次调用向目标 rule 的 `shadow_hits` 追加一条 hit（`observed_at` / `workflow` / `evidence_ref` / `reason_code`），整条 rule record 写盘后符合 `rule-maturity.v1` schema。（术语约定：本计划中「rule record」指 schema 顶层对象，「hit」指 `shadow_hits` 数组中的一条观测，`record` 单指 CLI 子动作。）
- R2. producer 侧 stage 不可达 reserved stages：phase 1 `record` 不提供 stage 参数、固定写 `shadow`；任何 stage 变更（含 `advisory`）均不经 `record` 发生，只能在未来 phase 2 candidate 重新计划后由 promotion 工具承担。
- R3. 存在 deterministic 读取面：`spec-first internal rule-maturity list --json` 输出逐 rule 的 stage、shadow_hits 计数与 evidence refs 汇总。
- R4. 至少一个真实 consumer 消费读取面：`spec-skill-audit` 将 rule-maturity 观测汇总纳入其确定性事实 artifact（同 `reviewer-guard-coverage-report.json` 模式），满足父方案 §9.0.1「无消费方 = 不交付」。定位明确为**周期治理健康检查**：暴露「有记录但长期无人裁决 / 消费链断裂 / 观测为空」等事实，不作为普通研发人员的人审主入口。
- R5. 至少两个 workflow 的 SKILL prose 在 governance lens 命中时显式引导记录 shadow hit：`spec-plan`（task-governance-signals 之后）与 `spec-code-review`（resource-governance-lens advisory 之后）。其中 `spec-code-review` 另在 Stage 6 最终汇总输出 `Rule Maturity Candidates` 小节，基于已确认 findings / resource advisory 轻提示 `rule_id`、`evidence_ref`、`reason_code` 与 `human_review_kind`；不新增专用 agent，不自动 `adjudicate` / `promote`。职责定位明确：lens helper 保持只读、只返回 facts；SKILL prose 含调用 `rule-maturity record` 的程序性引导；是否记录由 LLM 按引导判断后显式调用。
- R6. 落盘路径、gitignore 策略、context-governance 读取边界明确登记，evidence 文件不被当作普通 source context 扫描。
- R7. 现有治理断言有意识翻转/保留：`governance-contracts.test.js` 中「internal.js 不含 rule-maturity subcommand」断言翻转为正向注册断言；「producers 不出现 reserved stage 字面量」断言保留并扩展覆盖新 producer 的写入路径。
- R8. 文档同步：`rule-maturity.md` 合同登记 producer/consumer 现状，SCALE README v1.17 行进展更新（plan 写入仓库→「计划中」；实现合入且测试通过→「进行中（phase 1 shadow producer 已落地）」），CHANGELOG 按仓库格式记录。

**Phase 2（人审裁决与晋升就绪，deferred-pending-phase1-evidence 候选要求）：**

- R9. 存在唯一裁决记录入口：`rule-maturity adjudicate` 把指定 shadow hit 裁决为误报或真缺陷，写入 schema 既有 `false_positive_refs` / `defect_evidence_refs`；必须带人审署名（`--decided-by`）与 durable 裁决依据 ref；署名持久化在 ref 指向的 repo 内 prose 裁决记录中（`rule-maturity.v1` schema 顶层 `additionalProperties:false` 且 refs items 为纯字符串，不承载署名字段——与 R11 promotion 审批记录同构）；裁决语义判断归人/评审，脚本只做结构记录与 ref 存在性校验。
- R10. 候选晋升就绪只读报告：`rule-maturity report` 输出逐 rule 的 deterministic 就绪事实与 `readiness_blockers[]`（hits 计数对照阈值、误报率、defect 证据数、rollback 在场性）；阈值只能在 phase 1 真实观测密度后校准，上游 RuleMaturity.ts 的 min_shadow_hits=10 等口径只作 advisory starting point；报告可派生 `human_review[]`（如 `promotion-review` / `demotion-review` / `governance-repair-review`）作为 next-action facts，但不输出「应当晋升」结论。
- R11. 候选 stage 变更只经人审：`rule-maturity promote|demote` 要求署名 + repo 内 prose 审批记录 artifact（含证据 refs、毕业 test path、rollback action、`invalidation_condition`、decided_by、reviewed_at、threshold snapshot、phase gate artifact ref）；晋升到 required-evidence/blocking 额外要求 R10 报告 blockers 为空；`--to blocking` 的 approval-ref 至少应限制在 `docs/contracts/governance/` 下，不能只校验任意文件存在；不存在任何自动晋升路径；审批记录以 ref 进 `evidence_refs`，schema 是否 bump 只能由 phase 2 重新计划决定。
- R12. 候选跨机证据汇聚最小面：`rule-maturity merge` 按 rule_id 合并多机导出的 shadow_hits 与裁决；hit 去重 identity 不在本轮钉死，phase 2 重新计划需在 `rule-maturity.v2` 增加 `hit_id`、sidecar adjudication index、`observed_at + evidence_ref + sequence/hash` 派生键之间做取舍，支撑团队级 promotion 评审样本。

**Phase 3（毕业与退役，deferred-pending-phase1-evidence 候选要求）：**

- R13. blocking 语义钉死为「毕业为确定性 gate」：stage=blocking 的规则必须有 `evidence_refs` 指向 `npm test` 主链路中的 contract test 或 lint 脚本；不引入 runtime hook / pre-commit 拦截；`report` 对 blocking 规则校验毕业 test ref 在场。
- R14. 退役/降级路径常驻：晋升记录的 `invalidation_condition` 由周期复查消费；`report` 输出 decay 信号事实（如 blocking 规则长期零 hit、晋升后新增误报）；降级/退役经 `demote` 人审路径执行，毕业测试随退役删除。

**Phase 4（governance ROI 与 resource hardening，deferred-pending-phase1-evidence 候选要求）：**

- R15. governance ROI 为确定性聚合 facts：治理漏斗（observed→adjudicated→promoted→graduated）计数与时间窗对比 delta，零 LLM 调用、零虚构常数（不引入上游 GovernanceMetrics 的 15%/10% 节省估算与 ROI Score baseline）、无数据支撑的指标不出现在报告中；**漏斗必输出 decay 事实**：blocking 规则总数趋势（本期 vs 前期）与每条 blocking 规则的最近命中时间是必输出 deterministic facts，不是可选项——治理面只增不减是上游已被证实的结构性缺陷，ROI 报告必须让「规则在变多还是在被删除」可直接读出；消费者为 `rule-maturity report` / promotion 人审与 `spec-skill-audit` 周期健康 artifact。
- R16. resource/output governance 按父方案 §4.8 全范围收口：补 screenshots/媒体产物 staged 检测、coverage/playwright-report 提交策略 advisory、raw log retention 与 redaction status 字段、policy 输出补 owners/modules；schema bump `resource-governance-lens.v2` 并带版本说明与 downstream consumer tests。
- R17. resource lens 消费接通两个已核实空置点：spec-work PR handoff（git-commit-push-pr 上下文清单注入 lens advisory）与 spec-code-review project-standards reviewer（lens items 进入其输入）；spec-release-notes 不接入（只读检索型 workflow、无 staging 环节，决策记录在案）。

---

## Assumptions

- A1. phase 1 的 rule_id 由调用方（workflow LLM）显式传入，**命名约定锚定 `gate-lens-taxonomy.v1` 的 7 个 canonical lens family 作前缀**（`preflight|exploration|planning|execution|verification|review|summary`，如 `planning-depth-underclassified`、`summary-generated-output`），复用既有治理词表缓解 rule_id 碎片化；前缀约定写入 U3 prose 与 U5 的 `rule-maturity.md`，脚本只校验非空与长度、不强制前缀（advisory 约定，不是 schema 约束）。独立注册表是 phase 2 的候选工作，等真实 rule_id 积累后再判断是否需要。
- A2. phase 1 shadow-hits 证据以本机累积（gitignored local file）。spec-first 面向团队协作，跨机证据导出/汇聚是 phase 2 的候选方向（promotion 人审需要全团队样本），但具体 merge key、导出形态与裁决 cadence 必须等 phase 1 真实样本后重新计划；phase 1 的存储格式仍需保持可合并性——按 `rule_id` upsert 的 rule record 数组天然支持后续跨机按 rule_id 合并 `shadow_hits`，实现时不得引入破坏可合并性的结构（如本机自增主键）。
- A3. 人审触发采用「自动发现/排队 + 人主动裁决」形态：`spec-code-review` 和 `rule-maturity report` 只输出 `human_review` 候选/next action，不弹窗、不阻塞、不自动通知外部系统；人必须写 durable prose 记录并显式执行 `adjudicate|promote|demote` 才改变证据或 stage。

---

## Scope Boundaries

本计划记录 v1.17 整版路线，但当前可执行交付只覆盖 phase 1 / U1-U6。phase 2-4 / U7-U14 是 `deferred-pending-phase1-evidence` 候选设计：保留背景、风险与可能的落地形态，不授权本轮实现、测试或文档承诺。整版 non-goals（任何 phase 都不做）：

- **不做自动晋升 / promotion 状态机**：stage 变更只经人审署名路径（`promote|demote`）；`report` 只产 deterministic 就绪事实，不输出「应当晋升」结论。OPT-D 裁决与 self-reflection「advisory fields, not a central state machine」先例双重背书。
- **不做 runtime hook / pre-commit 拦截 / 门禁墙**：拒绝上游 HookGenerator 的 bash hook `exit 2` 模式与 harness 文档的 G1-G8 门禁墙建议——blocking 的 spec-first 原生落点是 contract test 进 `npm test` 主链路（fail-closed 且确定性，但在 CI/测试边界而非 runtime 边界）。
- **不做 daemon/watcher 式自动观测与自动注入**：shadow hit 是 workflow 显式记录的离散观测（合同原文：not daemon counters）；拒绝上游 EvolutionEngine.runCycle 的自动扫描提议与 Cortex SessionStart 注入闭环（父方案 §non-goal 已裁决）。
- **不做自动人审 / 自动派单 / 外部通知系统**：只在 `spec-code-review` Stage 6 与 `rule-maturity report` 中输出 `human_review` 候选和 next action；是否裁决、何时裁决、裁决结论均归人审。
- **不在 phase 1 预构建 adjudicate/promote/report CLI**：本轮只证明 shadow producer→consumer 链路；裁决、晋升、ROI、通知、专用 agent 都必须等 phase gate 证据后重新计划。
- **不做数值健康分 / ROI Score**：拒绝上游 GovernanceMetrics 的虚构常数（15%/10% 节省、50 分 baseline、5min/fix）；ROI 报告只含可验证计数与 delta（brooks-lint 否决先例同构）。
- 不让 `task-governance-signals` / `resource-governance-lens` 两个只读 lens helper 带写盘副作用（phase 4 的 resource lens v2 扩展输出字段，仍保持只读）。
- 不新增公开 workflow 入口、不新增 skill；第一版也不新增专用 rule-maturity agent，全部能力经 internal helper + 既有 workflow synthesis/prose 接入。只有当候选筛选需要跨 finding 去重、规则冲突分析或稳定 rule_id 归并时，才在后续评估条件触发的 handoff classifier agent。
- 不接入 doctor rollup；doctor 只消费 setup facts，治理证据消费面是 `spec-code-review` Stage 6 候选提示、`rule-maturity report` 人审事实、`spec-skill-audit` 周期健康检查与 promotion 人审。
- 不引入 dispatcher 状态机 / 薄主会话架构（harness 文档 P0-1 建议与 spec-first「不强状态机」哲学冲突，OPT-D 裁决覆盖）。

### Deferred to Follow-Up Work

- phase 2-4 的实现本身：U7-U14 只有候选设计价值，不在本轮 active scope 内落地。phase 1 evidence gate 通过后，需重新开窄计划确认 owner/cadence、观测密度、hit identity、阈值、approval-ref 强度与 determinism 口径，再决定是否执行。
- phase 2 进入条件 checklist：必须先有 phase gate artifact，且 `owner_cadence_decision` 明确写出 reviewer/维护者、复查频率、触发方式、最小裁决样本、无人审时的 fallback（默认 `continue-phase1` 而非继续实现）。没有这个 checklist，`adjudicate/promote/demote/report` 不进入 active scope。
- rule_id 注册表 / canonical rule 词表：等真实 rule_id 出现重复与歧义后再评估（phase 1 用 lens-family 前缀约定缓解）。
- 专用 rule-maturity handoff agent：第一版不用；若 `Rule Maturity Candidates` 误报多、需要跨 finding 模式识别、或需要和已有 rule_id 做冲突/重叠分析，再新增只读 classifier agent。该 agent 仍不得新增 finding、`adjudicate`、`promote` 或 `demote`。
- spec-work closeout 接入 shadow 记录：phase 1 先验证 plan/code-review 两个接入点，work closeout 已有 honest-closeout 链路，叠加点位在 phase 2 启动时按零记录复查结果裁定。
- harness 衰减审计（定期关组件对比质量）：「构建是为了删除」已通过 R14 退役路径承载最小语义；组件级 A/B 衰减审计是独立的 optimize 实验课题，走 `spec-optimize`。
- 评测平台 / 上下文预算管理等 harness 文档其余建议：与 v1.17 无强依赖，另行走 ideate/brainstorm 裁定。

---

## Completion Criteria

**Phase 1 完成判据：**

- **§9.0.1 交付等级登记（与 v1.11/v1.12 先例同构）**：phase 1 满足三级 gate——contract test（U1/U6）+ direct deterministic consumer（U4 skill-audit 周期健康 artifact）+ named workflow 可观察行为变化（U3 `spec-code-review` Stage 6 `Rule Maturity Candidates`）。shadow 观测能力仍整体标 **advisory**：它只让候选与证据开始流动，不宣称已兑现 promotion/blocking 治理价值。
- `spec-first internal rule-maturity record|list` 可运行且通过 focused unit tests。
- `spec-skill-audit` 的 audit artifact 中出现 rule-maturity 汇总事实（fixture 测试守住）。
- `skills/spec-plan/SKILL.md` 与 `skills/spec-code-review/SKILL.md` 含显式记录引导；`spec-code-review` Stage 6 含 `Rule Maturity Candidates` 小节与不自动 `adjudicate/promote` 边界，对应 doc contract tests 通过。
- `governance-contracts.test.js` 断言翻转后 `npm run test:unit` 通过。
- `rule-maturity.md`、SCALE README v1.17 行、CHANGELOG 已同步。

**Phase gate（phase 间推进条件）：**

- phase 1 → phase 2：phase 1 合入后真实运行 2 周，复查点不是简单要求 `rule-maturity list` 非零，而是登记分类事实：`status: empty`（有链路但暂无样本）、`status: degraded/corrupt`（store 读取损坏）、`consumer_missing`（U4 audit 未产出事实）、`no_llm_adoption`（workflow prose 在场但无调用迹象）、`candidate_density`（条/周、覆盖 rule_id 数、workflow 分布）。只有当真实观测密度足以支撑裁决样本、裁决 owner/cadence 明确、consumer 链路正常时，才允许为 phase 2 重新开 active plan。
- phase 1 → phase 2 复查 artifact 采用轻量模板，不新建 schema：`docs/validation/rule-maturity-phase1-gate-<date>.md`，必含 `as_of`、`source_refs`（`rule-maturity list` 输出与 `rule-maturity-observations.json` 路径）、`status_class`、`rule_count`、`shadow_hit_count`、`candidate_density`、`workflow_distribution`、`consumer_status`、`store_status`、`owner_cadence_decision`、`recommended_next_action`。`recommended_next_action` 只允许三类：`continue-phase1`、`repair-producer-consumer`、`open-phase2-plan`；不得直接要求实现 adjudicate/promote。
- phase 2 → phase 3：候选条件是至少 1 条 rule 经 `adjudicate` 积累了人审裁决记录且 `report` 能输出非空就绪事实；该条件只在 phase 2 被重新计划并落地后生效。
- phase 4：resource hardening 可作为独立后续计划重新评估，不再借本 plan 直接并行落地；governance ROI 聚合必须等待真实 observed/adjudicated/promoted 数据，否则只会输出空漏斗。

**整版完成判据：**

- 当前 active plan 完成判据是 R1-R8 / U1-U6 落地且 `npm run test:unit` 覆盖相关合同通过；不得把 R9-R17 的候选要求计入本轮完成承诺。未来若恢复整版路线，则另以新计划定义 R9-R17 的完成判据与 `npm test` 主链路要求。
- SCALE README v1.17 行进展时点：本 plan 写入→「计划中」；phase 1 合入→「进行中（phase 1 shadow producer 已落地）」；R1–R17 全部落地→「已完成」。中间任何时点不得提前标「已完成」。

---

## Review Resolution Ledger

| Finding | Resolution |
|---------|------------|
| 整版计划应拆分，phase 2-4 不应与 phase 1 同等 active | 成立。当前 active scope 收敛为 U1-U6；U7-U14 标记为 `deferred-pending-phase1-evidence`，phase gate 通过后重开窄计划。 |
| P1-A：reserved-stage 字面量扫描会误杀 `rule-maturity.js` | 当前代码事实下不成立。`governance-contracts.test.js` 的 producers 数组只扫描两个既有 lens helper；U6 明确不得把 `rule-maturity.js` 加入该数组，改用单独断言。 |
| P1-B：U4 skill-audit 接线被“按实际结构定”掩盖 | 成立。U4 已钉死四件套：collect 函数、`runSelfAudit()` 返回、`writeAuditArtifacts()` 写 JSON、`rule-maturity.js` 导出纯读取/summary。 |
| P1-C：`observed_at` 与 `last_observed_at` projection 未定义 | 成立。U1 已定义 `observed_at = new Date().toISOString()`；`last_observed_at` 按 `Date.parse()` 最大值计算，非法时间 degraded。 |
| U2 gitignore section 归属未指定 | 成立。U2 已指定加入 `SPEC_FIRST_GITIGNORE_SECTIONS` 第二段 `spec-first local setup and workflow runtime artifacts`。 |
| U7 hit-ref 复合键碰撞 | 成立但属 deferred。U7 不再批准 `<observed_at>::<evidence_ref>` 为实现合同，phase 2 需重选 hit identity。 |
| U8/U11 determinism 与 wall-clock `generated_at` 冲突 | 成立但属 deferred。U11 已规定显式窗口下 `generated_at` 必须由 `--as-of` / window end 派生，不得用 wall-clock。 |
| blocking promotion 的 approval-ref 只校验存在性过弱 | 成立但属 deferred。U9 候选要求 `--to blocking` 至少限制 approval-ref 在 `docs/contracts/governance/` 下。 |
| false_positive_rate 分母/批量裁决口径不稳 | 成立但属 deferred。U7/U8 已规定一次 CLI adjudicate 只裁一条 hit；批量 prose 文件需每条 hit 独立 anchor ref。 |
| corrupt-store 与零记录混淆 | 成立。Phase gate 区分 `empty`、`degraded/corrupt`、`consumer_missing`、`no_llm_adoption`、`candidate_density`。 |

---

## Direct Evidence

- repo_scope: spec-first 单仓（target_repo: 当前仓库）
- source_reads_completed:
  - `docs/contracts/governance/rule-maturity.md` + `rule-maturity.schema.json`（schema 全文）
  - `tests/unit/governance-contracts.test.js`（全文：含「无 producer」反向断言与 reserved-stage 字面量守卫）
  - `src/cli/commands/internal.js`（subcommand dispatch 全貌）
  - `src/cli/helpers/resource-governance-lens.js`（前 80 行：runCli/parseArgs/schema 校验模式）
  - `docs/01-需求分析/13.scale-integration/spec-first内化集成scale-project-scaffold技术方案.md` §4.6–4.7
  - `docs/contracts/context-governance.md`（`.spec-first/**` 读取边界条目）
  - `.gitignore`（`.spec-first/` 现行 ignore 清单；`governance/` 子目录当前未被 ignore）
  - `skills/spec-plan/SKILL.md` / `skills/spec-code-review/SKILL.md` 中 lens 消费段落
- source_reads_required（实现时）:
  - `src/cli/helpers/task-governance-signals.js` 全文（CLI arg 解析复用）
  - `src/cli/gitignore-policy.js` 相邻 tests 与用户手册镜像断言（U2 实现时确认最终断言文件）
- commands_or_tools_used: `rg`/grep、`spec-first internal task-governance-signals`（depth 分级实测）、`spec-learnings-researcher` agent（5 篇 learning 命中）、4 路并行深读 agent（上游源码 + resource 缺口 + promotion 先例实测）
- 整版扩展时新增 source_reads_completed:
  - `scale-engine/src/evolution/RuleMaturity.ts` 全文（123 行）+ `EvolutionEngine.ts`/`GovernanceMetrics.ts`/`EvolutionEvaluator.ts` 关键面（上游阈值、署名晋升、hook 阻断、虚构常数均为实测）
  - `src/cli/helpers/resource-governance-lens.js` 全文 vs 父方案 §4.8 逐项对照（7 项缺口清单，含「合同字段都没有 / producer 部分实现 / 有 producer 无消费」三类定级）
  - `skills/spec-work/references/shipping-workflow.md`（closeout 已消费 lens：L124/L134/L137；PR handoff 清单 L179-185 未含 lens——R17 接入点）
  - `docs/contracts/workflows/self-reflection-capability-upgrade.md` + `skills/spec-compound/SKILL.md` promote gate + `knowledge-harness.md` L6（人审 promotion 三先例，U9 的 prose-artifact 决策依据）
  - `docs/01-需求分析/14.harness-engineering/harness-engineering-x-spec-first-analysis.md` + `harness-discipline-deep-analysis.md` 全文（三条输入 + OPT-D 过滤清单）
- 2026-06-12 修订时新增 source_reads_completed:
  - `skills/spec-code-review/SKILL.md` Stage 5/6 synthesis、resource advisory 与 reviewer routing 段（确认 rule-maturity 候选提示应落在最终汇总，不新增 reviewer finding）
  - `skills/spec-compound/SKILL.md` promote gate / verified learning / optional enhancement 段（确认 compound 适合作为 verified learning→rule candidate 的轻量接线，不是人审主入口）
  - `skills/spec-skill-audit/SKILL.md` contract summary / outputs / governance 段（确认 skill-audit 是 source-quality auditor 与周期治理 artifact producer，不适合作为普通研发人员主触发点）
  - `docs/10-prompt/结构化项目角色契约.md` §1–§7（确认 spec-first 定位为服务研发人员高质量 AI coding 的 harness，治理能力必须服务 workflow 证据闭环与用户研发增益）
  - `skills/spec-skill-audit/scripts/write-audit-artifacts.js` / `collect-skill-facts.js`（确认 `runSelfAudit()` 返回固定 reports 对象，`writeAuditArtifacts()` 逐个 `writeJson()`，`collect-skill-facts.js` 当前仅导出 `collectSkillFacts` / `collectReviewerGuardCoverage` / `collectSingleSkill`）
  - `src/cli/gitignore-policy.js`（确认 `.spec-first/governance/` 应加入第二个 section：`spec-first local setup and workflow runtime artifacts`，不能新增 section 破坏镜像断言口径）
  - `tests/unit/governance-contracts.test.js` L70-L78（确认字面量扫描 producers 数组只含 `task-governance-signals.js` / `resource-governance-lens.js`，不含未来 `rule-maturity.js`）
- impact_on_plan: governance 测试的反向断言决定了 U6 必须与 U1 同切片落地；gitignore section 结构决定了 U2 必须追加到第二段而非新建段；skill-audit writer 固定对象结构决定了 U4 必须四件套接线；上游「无 demotion」缺陷与 resource 缺口只作为 deferred candidate 输入，不再支撑本轮 active scope
- key_findings: 见 Context & Research
- limitations: 上游 RuleMaturity 阈值在本仓的适配性无先验数据，phase 2 必须基于 phase 1 真实观测密度重新校准；scale-engine 上游源码不在本仓，任何行号/默认值都只能作为 advisory 参考

---

## Context & Research

### Relevant Code and Patterns

- `src/cli/helpers/resource-governance-lens.js` — internal helper 的标准结构：`runCli(argv)` 返回 exit code、`parseArgs` 收集 errors、输出前 `validateAgainstSchema` 自校验、`writeJson` 统一输出。新 helper 完全照此模式。
- `src/cli/commands/internal.js` — subcommand 注册点：require helper 的 `runCli` 并加一个 `if (subcommand === 'rule-maturity')` 分支。
- `src/contracts/schema-validator.js` — 已有 `validateAgainstSchema`，record 写入前对整条 record 校验。
- `skills/spec-skill-audit/scripts/write-audit-artifacts.js` — `reviewer-guard-coverage-report.json` 的确定性事实 artifact 先例，U4 消费面模仿该模式。
- `.spec-first/config/tool-facts.json` 的生产/消费链 — 「generated local facts + 单一 writer + doctor 消费」是 phase 1 producer→consumer 形态的最近参照。

### 上游参考实现实测（借思想、不引代码，OPT-D 口径）

- `scale-engine/src/evolution/RuleMaturity.ts`（123 行纯函数）：三段 stage（shadow→candidate-hook→approved-blocking）；晋升条件 = 计数阈值 + 证据 + rollback 在场 + 误报率，`DEFAULT_THRESHOLDS`：minShadowHits=10、minDefectEvidence=1、maxFalsePositiveRate=0.2；`approveRuleMaturity` 人工署名 + 晋升前重验；`evaluateRulePromotion` 返回可读 `blockers[]`。**可借鉴**：人审署名、晋升前重验、blockers 报告形态、rollback 硬前置。**拒绝**：纯内存存储（无持久化）、HookGenerator 自动生成 bash hook `exit 2` 阻断、EvolutionEngine.runCycle 自动扫描提议。无 demotion 转换是其缺陷——spec-first 补上（R14）。
- `scale-engine/src/cortex/GovernanceMetrics.ts`：漏斗计数（proposed→validated→approved→enforced）与时间窗 delta 可借鉴为纯文件聚合；**拒绝**其虚构常数（15%/10% 节省估算、ROI Score 50 分 baseline、5min/fix）与占位指标（instinctHitRateDelta 恒 0 仍进报告）。
- 上游误报标记是 `recordShadowHit(…, {falsePositive})` 记录时顺手传——spec-first 改为记录与裁决分离（U7），因为「是否误报」是语义判断，须经人审署名，不能混进机械观测。

### Harness 工程化输入（docs/01-需求分析/14.harness-engineering/）

- 「每条规则都是一次事故的墓志铭」：规则的合法来源是真实 hit/事故，不是凭空设计——backing R9 裁决链路与 U10 的 compound 接通（verified learning → rule 候选）。
- arxiv 2605.29682（验证反馈质量 R²=0.94 vs token 预算 R²=0.33）：决定 agent 可靠性的是「检查做得多好」——backing R13 毕业形态为确定性 contract test。
- 「构建是为了删除」/ Harness 衰减：每条晋升规则必须带退役路径，否则 harness 越积越厚——backing R14 demote/decay 信号；invalidation_condition 必填进审批记录。
- 同时按 OPT-D 过滤其建议：dispatcher 状态机、G1-G8 runtime 门禁墙、hook 拦截、≤8K 上下文预算管理均不进 v1.17（前两者与「不强状态机、advisory-first」哲学正面冲突；后者是独立课题）。

### Institutional Learnings

- `docs/solutions/architecture-patterns/ai-reviewer-capability-borrowing-gates-2026-06-09.md` — 无确定性证据时 LLM 评分≈随机；shadow_hits 只记可回查事实，不带评分/promote 建议。
- `docs/contracts/governance/rule-maturity.md` — rule-maturity reader 只产 projection facts；明确逐条 hit 记录是主真源，聚合计数只是 projection。
- `docs/solutions/workflow-issues/self-reflection-cud-contract-loop-2026-05-05.md` — 「advisory fields, not a central state machine；证据流动后再升级」，直接背书 phase 1 切法。
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md` — evidence artifact 不覆盖 `docs/contracts/**` 行为契约；产物错了先查 producer。
- `docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md` — internal helper 不登记为 workflow_command、不建 command template。

### External References

- 无需外部研究：仓库内已有三个同构 internal helper 先例与完整 contract test 模式，phase 1 是成熟局部模式的复用（Phase 1.2 决策：跳过外部研究）。phase 2–4 的上游参考（RuleMaturity.ts / GovernanceMetrics.ts）与 harness 工程化输入已在前两节实测登记。

---

## High-Level Technical Design

> *以下为方向性示意，供评审校验整体形状，不是实现规范。当前 active implementation 只到 Phase 1；图中 Phase 2-4 均为 deferred candidate。*

规则轮全生命周期（与知识轮的接通点在 compound）：

```text
                     ┌──────────────── 知识轮（已闭环）────────────────┐
                     │  问题解决 → spec-compound → docs/solutions      │
                     │                   │ (U10: verified learning     │
                     │                   ▼  轻提示 rule 候选)          │
                     └───────────────────┼─────────────────────────────┘
                                         │
  ┌────────────── 规则轮（Phase 1 active；Phase 2-4 candidate）▼─────────┐
  │                                                                      │
  │  Phase 1                    Phase 2              Phase 3             │
  │  ┌──────────────┐           ┌──────────┐  人审   ┌──────────────┐    │
  │  │ shadow hits  │ adjudicate│ advisory │ promote │ req-evidence │    │
  │  │ 观测证据     │──────────▶│          │────────▶│ /blocking    │    │
  │  └──────▲───────┘ (误报/真缺陷,└──────────┘(R10   └──────┬───────┘    │
  │         │record       人审署名)            blockers为空) │ 毕业 =     │
  │  workflow lens 命中                                      │ contract   │
  │  (spec-plan / code-review)                               │ test       │
  │         │                                                 ▼ 进 npm    │
  │         ├─ spec-code-review Stage 6: Rule Maturity Candidates ─┐      │
  │         │  (研发人员可见轻提示, 不阻塞, 不新增 agent)           │      │
  │         │                                                       │      │
  │  merge(跨机汇聚) ───────────────────────────────────────────────┘      │
  │                                                      ┌────────┐       │
  │  rule-maturity report: human_review[] facts ───────▶│ 退役   │       │
  │  (promotion/demotion/repair next action)             │ demote │       │
  │                                                      └────────┘       │
  │  Phase 4: report --funnel（observed→adjudicated→promoted→graduated    │
  │           漏斗计数 + 时间窗 delta，零虚构常数）→ report/promotion     │
  │           人审 + skill-audit 周期健康检查消费                         │
  └──────────────────────────────────────────────────────────────────────┘

  全程不变量：stage 变更只经人审署名命令；脚本只产 facts/blockers；
  blocking 执行体 = CI contract test（无 runtime hook）；降级永远可达；
  提示可自动派生，裁决/晋升/降级不得自动执行。
```

---

## Key Technical Decisions

- **独立 `rule-maturity` 子命令作为唯一 writer，而非 lens helper 内嵌写盘**：保持 `task-governance-signals` / `resource-governance-lens` 纯只读合同不变；记录动作是 LLM 在 lens 命中后的显式判断（「Scripts prepare, LLM decides」——是否构成值得观测的 hit 是语义判断），单一 writer 满足可追溯性 learning。（用户已确认）
- **研发人员可见触发点选 `spec-code-review` Stage 6，而非 `spec-skill-audit`**：spec-first 的定位是帮助研发人员高质量完成 AI coding；`spec-code-review` 本来就在判断 finding 是否真实、是否缺测试、是否违反项目约定，最适合在最终汇总中输出 `Rule Maturity Candidates` 作为轻提示。`spec-skill-audit` 仍是 deterministic consumer，但定位降为周期治理健康检查；doctor 扩边界的成本与收益不匹配。
- **第一版不新增专用 rule-maturity agent**：候选提示只基于 Stage 5/6 已合成的 findings、resource advisory 与 durable evidence ref，属于当前 orchestrator 的 synthesis/handoff 工作；新增 agent 会增加调度成本、误报解释成本和边界风险。只有当候选筛选需要跨 finding 去重、已有 rule 冲突/重叠分析或稳定 rule_id 归并时，再评估只读 handoff classifier agent。
- **落盘路径 `.spec-first/governance/rule-maturity.json`，gitignored**：与 `.spec-first/config/*.json` 等 generated local facts 同策略。shadow 观测是本机 workflow 运行的离散记录，提交进 git 会产生持续 commit 噪声且诱发「为绿而改」；promotion review（phase 2）需要跨机共享时再设计导出面。需同步 `.gitignore` 与 `spec-first init` managed block。
- **存储形态：单文件、按 `rule_id` upsert 的 rule record 数组**：每条 rule record 是完整 `rule-maturity.v1` 对象，`record` 子动作对已存在的 rule_id 追加 hit、对新 rule_id 创建 stage=shadow 的初始 rule record。逐 hit 明细是主真源；`list` 的计数是 projection，不替代明细。
- **phase 1 stage 固定 shadow、record 无 stage 参数**：所有计划内调用方只产 shadow 观测；不提供 `--stage` 即从 CLI 面根除 reserved-stage 与隐式 shadow→advisory 迁移路径（评审发现：开放 `advisory` 入参等于无人审的后门 stage 变更，且 phase 1 无任何 advisory 调用方）。stage 变更只能在 future phase 2 candidate 重新计划后经 `promote|demote` 人审路径（U9）承担。这把 v1.14 的「schema 允许、source 不产」边界升级为「schema 允许、producer 不可达」，并被 contract test 守住。
- **blocking 的执行体是 contract test 进 `npm test`，不是 runtime hook**：上游用 HookGenerator 生成 bash hook `exit 2` 在工具调用边界阻断；spec-first 的确定性边界在 CI/测试（仓库既有实践：`governance-contracts.test.js` 的断言本质就是毕业规则）。fail-closed 语义保留（测试红了就是阻断），但阻断点从 runtime 移到验证链路——与「advisory-first、不强状态机」哲学一致，且毕业测试天然带退役路径（删测试 = 退役，git 可审计）。arxiv 2605.29682 的「验证反馈质量决定可靠性」为此背书。
- **promotion 审计轨迹走 prose artifact + ref，schema 不 bump v2**：审批记录（证据、rollback、invalidation_condition、署名）是 prose 文档，以 ref 进既有 `evidence_refs`；与 knowledge-harness L6「prose-enforced gate、不加第二套 validator」先例一致。仅当未来出现 machine-readable stage_history 的真实消费者时再评估 v2。
- **裁决与观测分离**：上游在 recordShadowHit 时顺手传 falsePositive；spec-first 拆成 record（机械观测，workflow 即时）与 adjudicate（语义裁决，人审事后署名）两个动作——两轴分离原则的直接应用，也让误报证据天然带裁决人与依据。
- **ROI 报告零虚构常数**：只输出可从 evidence 文件复算的计数与 delta；拒绝上游的节省估算/ROI Score/占位指标。「可验证事实优先于模型猜测」。

---

## Open Questions

### Resolved During Planning

- producer 形态（独立子命令 vs lens 内嵌）：独立子命令，用户确认。
- 人审主提示点（spec-code-review vs skill-audit vs compound）：`spec-code-review` Stage 6 作为研发人员可见提示入口；`spec-compound` 只在 verified learning 写成后提示规则候选；`spec-skill-audit` 只做周期治理健康检查。
- 是否新增专用 agent：第一版不新增；先用 `spec-code-review` Stage 6 synthesis 与 `spec-compound` 轻量 prose，后续再按真实误报/复杂度评估条件 agent。
- 落盘是否 git 提交：gitignored local，理由见 Key Technical Decisions（A2 标注为假设，用户可在评审时推翻）。
- skill-audit 健康检查接线：按当前脚本结构钉死为四件套，不再留给实现时即兴决定：`collect-skill-facts.js` 新增 `collectRuleMaturityObservations(repoRoot)`，`write-audit-artifacts.js` 的 `runSelfAudit()` 并入返回对象，`writeAuditArtifacts()` 写出 `rule-maturity-observations.json`，`rule-maturity.js` 导出纯读取/summary 函数供 CLI 与 audit 复用。
- `list.last_observed_at` 投影：按 `Date.parse(hit.observed_at)` 最大值计算，非法时间导致 `status: degraded` / `reason_code: invalid-observed-at`，不得用字符串字典序近似。
- Phase 1 gate 产物：使用 `docs/validation/rule-maturity-phase1-gate-<date>.md` prose 模板承载复查结论，不新增 JSON schema；脚本只提供 facts，人是否进入 phase 2 由维护者按模板判断。
- Phase 1 rule_id 归一化：采用 `lens-family + problem-class` 的 kebab-case 命名（如 `review-missing-contract-test`、`summary-generated-output-staged`）；候选输出必须列 `similar_existing_rule_ids`，没有则为 `[]`，用于人工合并近似规则，不做脚本级唯一性推断。

### Deferred to Implementation

- `record` 的 CLI 参数面细节（逐参数 vs `--input` JSON 文件）：实现时按 `task-governance-signals --input` 既有模式定，倾向支持两者中维护成本更低的一种。

---

## Implementation Units

### U1. rule-maturity internal helper（record/list） — phase 1

**Goal:** 实现唯一 writer 与 deterministic 读取面。

**Requirements:** R1, R2, R3

**Dependencies:** None

**Files:**
- Create: `src/cli/helpers/rule-maturity.js`
- Modify: `src/cli/commands/internal.js`
- Test: `tests/unit/rule-maturity.test.js`

**Approach:**
- `runCli(argv)` 模式照搬 `resource-governance-lens.js`：parseArgs → 执行 → schema 自校验 → writeJson → exit code。
- `record` 子动作：必填 `--rule-id`、`--workflow`、`--evidence-ref`、`--reason-code`，可选 `--repo` 解析目标仓根。`observed_at` 由脚本以 `new Date().toISOString()` 写入（UTC ISO 8601，毫秒精度，形如 `2026-06-12T08:00:00.000Z`）；schema 只声明 `type: string`，因此测试必须显式断言可 `Date.parse` 且 round-trip 到同一 ISO 字符串。写入前对整条 record 跑 `validateAgainstSchema(rule-maturity.schema.json)`；写入失败（目录不可写、JSON 损坏）返回结构化错误而非半写。
- **phase 1 stage 固定为 `shadow`，`record` 不提供 `--stage` 参数**：所有计划内调用方（U3 两个 workflow）只产 shadow 观测；stage 经 `record` 不可变更，避免开出无人消费的 advisory 后门或隐式 stage 迁移路径。advisory 及以上的 stage 变更只属于 future phase 2 candidate 的 promotion 工具职责，不在本轮实现。
- **初始 record 的 schema 必填字段填充规则（钉死，避免实现时即兴决定）**：新 rule_id 首次 record 时，`defect_evidence_refs: []`、`false_positive_refs: []`（留待 phase 2 人审填写，本 producer 永不写入）、`rollback: { available: true, notes: "shadow observation only; nothing to roll back" }`（措辞明确这不是经人审的 rollback 策略）、顶层 `evidence_refs` 为各 shadow_hits `evidence_ref` 的去重投影（追加 hit 时同步更新）、顶层 `reason_code` 固定为 `shadow-observation`（与逐 hit 的 reason_code 区分：顶层描述 record 性质，逐 hit 描述命中原因）。
- `list` 子动作：读 `.spec-first/governance/rule-maturity.json`，输出 `{ schema_version, status, rules: [{ rule_id, stage, shadow_hit_count, last_observed_at, workflows, reason_codes }], reason_code }`；文件缺失输出 `status: empty` 而非报错。`last_observed_at` 按该 rule 全部 `shadow_hits[].observed_at` 的 `Date.parse()` 最大值计算并回显对应 ISO 字符串；如果任一 `observed_at` 不能解析为有效时间，`list` 输出 `status: degraded` / `reason_code: invalid-observed-at` 并定位 `rule_id`，不得用字符串字典序或数组最后一项近似。phase 1 不做输出截断/上限——本机离散观测的量级不需要（移除原 MAX_ADVISORY_ITEMS 参照）。
- 存储文件不存在时 `record` 自动创建目录与文件；JSON 损坏时拒绝写入并报 `evidence-store-corrupt`，不静默重建（保护既有证据）。
- reserved-stage 拒绝的实现位置：`record` 无 `--stage` 入口即天然不可达 reserved stages；但 helper 内仍保留对读入存量 record 的 stage 校验（防手改文件出非法值），校验用 schema enum，不在源码硬编码 reserved 字面量逻辑分支。

**Patterns to follow:**
- `src/cli/helpers/resource-governance-lens.js`（CLI 骨架、schema 自校验、错误形态）
- `src/cli/helpers/task-governance-signals.js`（`--input`/参数解析风格）

**Test scenarios:**
- Happy path: record 一条 shadow hit → 文件创建、整条 rule record 通过 schema 校验（含默认填充的 `defect_evidence_refs`/`false_positive_refs`/`rollback`/顶层 `evidence_refs`/顶层 `reason_code`）、`observed_at` 为 `new Date().toISOString()` 形态的 UTC ISO 字符串且可 round-trip。
- Happy path: 同 rule_id 二次 record → 该 rule 的 `shadow_hits` 追加为 2 条（upsert 既有 rule record，不新建），顶层 `evidence_refs` 投影同步更新。
- Happy path: list → 计数、`last_observed_at` 取 `Date.parse()` 最大值、reason_codes 汇总正确；空库 → `status: empty`。
- Error path: 传入 `--stage`（任意值）→ exit 2 invalid-arguments（phase 1 无此参数）。
- Error path: 存量文件中某 record 的 stage 为 reserved 值（手改场景）→ record 拒绝追加并报结构化错误，文件未被改写。
- Error path: 缺 `--evidence-ref` 或 `--reason-code` → exit 2 invalid-arguments。
- Error path: 存储文件为损坏 JSON → record 拒绝写入、报 `evidence-store-corrupt`、原文件内容不变。
- Error path: 存量文件含非法 `observed_at` 字符串 → list 输出 degraded / `invalid-observed-at`，不生成错误的 `last_observed_at`。
- Edge case: rule_id 超长（>120）被 schema 校验拒绝。

**Verification:**
- `npm run test:unit` 中新测试文件全绿；手跑 record+list 闭环可复现。

---

### U2. 落盘路径治理（gitignore + init managed block + context-governance） — phase 1

**Goal:** `.spec-first/governance/` 成为登记过的 generated local evidence 路径。

**Requirements:** R6

**Dependencies:** U1（路径由 U1 确定）

**Files:**
- Modify: `.gitignore`
- Modify: `src/cli/gitignore-policy.js`（managed `.gitignore` block 生成源：`SPEC_FIRST_GITIGNORE_SECTIONS` / `buildSpecFirstGitignoreBlock()`）
- Modify: `docs/contracts/context-governance.md`
- Modify: `docs/05-用户手册/12-gitignore参考.md`（手册内嵌完整 managed block 文本，必须与生成器同步——`gitignore-policy.test.js` 有镜像断言，漏改即测试失败）
- Test: `tests/unit/gitignore-policy.test.js`

**Approach:**
- `.gitignore` 与 init managed block 同步加 `.spec-first/governance/`，位置钉死在 `SPEC_FIRST_GITIGNORE_SECTIONS` 第二段 `spec-first local setup and workflow runtime artifacts`，紧邻 `.spec-first/audits/` / `.spec-first/workflows/` 等本地运行证据；不得为它新建 section（会破坏 gitignore-policy 镜像断言的结构口径）。
- 注意 `SPEC_FIRST_GITIGNORE_SECTIONS` 会经 `spec-first init` 投影到所有下游用户仓库的 managed block——这是有意行为（用户本机治理观测证据同样不应入 git），属 user-visible 变更，CHANGELOG 标注。
- `context-governance.md` 登记：该路径是 workflow 观测证据，不进普通 source context；消费方（skill-audit 周期健康、`rule-maturity report`、未来 promotion review）按需显式读取。

**Test scenarios:**
- Happy path: `buildSpecFirstGitignoreBlock()` 第二段 `spec-first local setup and workflow runtime artifacts` 输出含 `.spec-first/governance/`（contract test 断言）。
- Happy path: 用户手册内嵌 block 与生成器输出保持镜像（既有断言在新行加入后仍通过）。
- Test expectation: context-governance 文档行 — 由 U6 的 doc contract test 覆盖，本单元不重复。

**Verification:**
- `git check-ignore .spec-first/governance/rule-maturity.json` 命中；init 后 managed block 含新行。

---

### U3. workflow 接入（spec-plan record + spec-code-review 候选提示） — phase 1

**Goal:** 两个 lens 消费点在命中时显式引导记录 shadow hit，并让 `spec-code-review` 在最终汇总中给研发人员看到 rule-maturity 候选提示。

**Requirements:** R5

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-plan/SKILL.md`（Phase 0.6 task-governance-signals 段之后）
- Modify: `skills/spec-code-review/SKILL.md`（resource-governance-lens preflight 段之后；Stage 6 synthesis/report 模板中新增 `Rule Maturity Candidates` 小节）

**Approach:**
- 各加一小段（≤5 行）：当 lens 返回非平凡信号（如 `candidate_level` 与最终判断不一致、resource lens `status=advisory`），LLM 判断是否构成值得观测的治理 hit；是则调用 `spec-first internal rule-maturity record` 落一条。helper 不可用时记录 degraded 继续，不阻塞 workflow。
- `spec-code-review` Stage 6 在 findings / resource advisory 汇总后新增 `Rule Maturity Candidates` 小节：仅基于已确认 findings、resource advisory、review artifact/finding id 生成候选，列出 `rule_id`、`evidence_ref`、`reason_code`、`human_review_kind`（通常为 `adjudication-review`）与 next action。该小节是提示，不新增 code-review finding，不阻塞 review，不自动调用 `adjudicate` / `promote`。
- **候选降噪规则**：Stage 6 只在三类信号出现时输出候选：P1/P2 finding 暴露重复治理缺口；同一 review 中同类低级问题出现 2 次以上；resource/governance advisory 明确违反已登记合同或 plan non-goal。单个低置信 P3、纯风格意见、没有 durable evidence 的直觉判断不得进入 `Rule Maturity Candidates`。
- **rule_id 归一化**：候选 `rule_id` 使用 `lens-family + problem-class` kebab-case；同一候选项必须带 `similar_existing_rule_ids`（可为空数组），让人审能看出是否应合并到既有 rule，而不是制造近义 rule。
- **evidence_ref 必须指向 durable 可回查载体**：合法示例：repo 内 review artifact 路径、当前 plan 的具体 section、`docs/validation/**` 报告、`docs/solutions/**` learning、可复跑命令描述（含命令和预期输出文件）。非法示例：lens stdout、会话临时摘要、`/tmp` 文件、没有路径的自然语言描述、只写“见上文”的引用。若 lens 输出是关键证据，workflow 应先把它持久化（如写入 plan 的 Direct Evidence 段）再引用该路径。此规则同时写入 U5 的 `rule-maturity.md` producer 登记段。
- 明确措辞：记录是 advisory 观测，不改变 lens 结论，不是审计义务；每次 workflow 至多记录少量真实 hit，不刷量。
- 明确不新增专用 agent：Stage 6 候选筛选由当前 code-review orchestrator 基于已合成结果完成；后续如果候选去重/冲突分析复杂化，再另起 follow-up 评估只读 classifier agent。
- prose 给出固定示例调用（含 rule_id 派生示例与 reason_code 示例），rule_id 示例遵循 A1 的 lens-family 前缀约定（如 `planning-depth-underclassified`）；U6 的关键短语断言锚定这些固定措辞，两单元同 PR 收口。
- 双宿主影响：SKILL.md 变更后需 `spec-first init` 刷新 runtime mirror（执行期动作，不手改 mirror）。

**Patterns to follow:**
- `skills/spec-code-review/SKILL.md` 现有 resource-governance-lens 段的「advisory 不升级为 blocking」措辞密度。

**Test scenarios:**
- Happy path: 两个 SKILL.md 含 `rule-maturity record` 调用引导且含 degraded 降级措辞（U6 doc contract test 断言关键短语）。
- Happy path: `spec-code-review` Stage 6 含 `Rule Maturity Candidates`、`human_review_kind`、不自动 `adjudicate/promote` 的关键短语（doc contract test 断言）。
- Happy path: Stage 6 候选项含 `similar_existing_rule_ids`，并且降噪规则阻止无 durable evidence 的低置信 P3 进入候选。
- Test expectation: prose 行为语义 — 按 CLAUDE.md「Agent 与 Skill 变更验证」，实现时用 fresh-source eval 验证引导可被新会话正确执行；不依赖本会话缓存。

**Verification:**
- `npm run lint:skill-entrypoints` 通过；doc contract test 通过。

---

### U4. spec-skill-audit 周期健康消费面 — phase 1

**Goal:** 兑现 producer→consumer gate：audit artifact 纳入 rule-maturity 汇总事实，并定位为周期治理健康检查而非研发人员人审主入口。

**Requirements:** R4

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-skill-audit/scripts/collect-skill-facts.js`（新增 `collectRuleMaturityObservations(repoRoot)` 并导出）
- Modify: `skills/spec-skill-audit/scripts/write-audit-artifacts.js`（`runSelfAudit()` 并入 `ruleMaturityObservationsReport`，`writeAuditArtifacts()` 写 `rule-maturity-observations.json`）
- Modify: `src/cli/helpers/rule-maturity.js`（导出纯读取/summary 函数供 CLI 与 audit 复用）
- Modify: `skills/spec-skill-audit/SKILL.md`（Outputs 与 read-step 说明）
- Test: `tests/unit/` 下 skill-audit artifact 既有测试文件（实现时定位）+ fixture

**Approach:**
- audit 采集时读取 rule-maturity 观测汇总，把逐 rule 计数和健康信号写入独立 artifact：`rule-maturity-observations.json`。健康信号包括：有 shadow hits 但长期无裁决、观测为空、裁决/晋升证据链缺口、consumer 断裂。读取方式固定为直读 evidence 文件（从 repoRoot 解析路径，汇总逻辑与 `list` 共享 `rule-maturity.js` 导出的纯函数），不 spawn CLI 子进程。
- `rule-maturity-observations.json` 最小稳定字段钉死为：`schema_version: "rule-maturity-observations.v1"`、`generated_at`、`status`（`empty|ok|degraded`）、`reason_code`、`rule_count`、`shadow_hit_count`、`uncategorized_count`、`last_observed_at`、`workflow_distribution`、`rules[]`、`health_signals[]`。`rules[]` 每项至少含 `rule_id`、`stage`、`shadow_hit_count`、`last_observed_at`、`reason_codes`、`similar_existing_rule_ids`（实现期可为空数组）。这是 audit artifact contract，不改变 `rule-maturity.v1` schema。
- 四件套必须同 PR 完成：`collect-skill-facts.js` 新增并导出 `collectRuleMaturityObservations(repoRoot)`；`write-audit-artifacts.js` 的 `runSelfAudit()` 调用该函数并把结果放入返回对象 `ruleMaturityObservationsReport`；`writeAuditArtifacts()` 增加 `writeJson(path.join(dirs.runDir, 'rule-maturity-observations.json'), reports.ruleMaturityObservationsReport)`；`skills/spec-skill-audit/SKILL.md` Outputs/read-step 明确读取该 artifact。漏任一环都视为 U4 未完成。
- evidence 文件缺失/为空时输出 `status: empty` 事实，不报错——空集本身是 v1.17 promotion 未就绪的有效证据。
- audit artifact 不产生 `adjudicate` / `promote` 建议的交互式入口；它只把维护者应关注的治理健康事实摆出来。研发人员可见的候选提示归 U3 的 `spec-code-review` Stage 6，晋升/退役事实入口归 U8 `report`。

**Patterns to follow:**
- `reviewer-guard-coverage-report.json` 的采集→写入→SKILL read-step→fixture 测试四件套。

**Test scenarios:**
- Happy path: fixture evidence 文件含 2 rules → artifact 汇总 2 行、计数正确。
- Happy path: fixture evidence 文件含未裁决 hits → artifact 含 health signal，但不声明自动人审已触发。
- Happy path: artifact 含最小稳定字段，`rules[].similar_existing_rule_ids` 默认为 `[]`，`last_observed_at` 与 U1 list projection 同口径。
- Happy path: `runSelfAudit()` 返回对象含 `ruleMaturityObservationsReport`，`writeAuditArtifacts()` 实际写出 `rule-maturity-observations.json`；删除任一接线应使 focused test 失败。
- Edge case: evidence 文件缺失 → artifact 含 `status: empty` 事实，audit 不失败。
- Error path: evidence 文件损坏 → artifact 记录 degraded 事实，audit 不失败。

**Verification:**
- focused skill-audit tests 通过。

---

### U5. 合同与路线文档同步 — phase 1

**Goal:** 文档反映 producer 落地后的真实状态。

**Requirements:** R8

**Dependencies:** U1, U3, U4

**Files:**
- Modify: `docs/contracts/governance/rule-maturity.md`
- Modify: `docs/01-需求分析/13.scale-integration/README.md`（v1.17 行进展 + 必要的边界句）
- Modify: `CHANGELOG.md`

**Approach:**
- `rule-maturity.md`：v1.14「schema/docs-only、无 producer」段更新为「v1.17 phase 1 起有唯一 producer `spec-first internal rule-maturity`，仅产 shadow/advisory；promotion/blocking 仍未实现」，登记存储路径与 consumer 分工（`spec-code-review` Stage 6 轻提示、`spec-skill-audit` 周期健康、未来 `report`/promotion 人审）。
- SCALE README：v1.17 行进展按真实状态更新（plan 落地→计划中；实现合入→进行中），并在范围列点明 phase 1 边界。
- 注意 `tests/unit/scale-provider-doc-contracts.test.js:57` 断言父方案含「v1.14 schema/docs-only shadow 例外」字样——该历史表述保留（它描述 v1.14 决策），新增表述不得删除它；若措辞冲突，调整新增句而非历史句。

**Test scenarios:**
- Test expectation: none — docs-only 单元，断言由 U6 的 doc contract tests 承载。

**Verification:**
- `npm run test:unit` 中 doc contract tests 通过。

---

### U6. 治理断言翻转与合同测试收口 — phase 1

**Goal:** 有意识地翻转「无 producer」断言，扩展 reserved-stage 守卫，补 doc contract 断言。

**Requirements:** R2, R7, R5（断言部分）

**Dependencies:** U1, U3, U5

**Files:**
- Modify: `tests/unit/governance-contracts.test.js`
- Modify/Create: doc contract 断言所在文件（实现时定位，预计 `scale-provider-doc-contracts.test.js` 或邻近文件）

**Approach:**
- 翻转：`expect(internalSource).not.toContain("subcommand === 'rule-maturity'")` → 正向断言已注册。
- 保留并扩展：「producers never emit reserved maturity stages」对 `task-governance-signals.js` / `resource-governance-lens.js` 的断言不变。**陷阱警示：不得把 `rule-maturity.js` 加入该测试的既有 `producers` 数组**——该数组用字面量扫描（`not.toMatch(/['"]required-evidence['"]/)` 等），而 rule-maturity.js 的存量 stage 校验可能合法包含这些字符串。对 `rule-maturity.js` 单独新增断言：守源码层不出现 promotion 函数模式（`promote|approveRule|escalate`）与 `--stage` CLI 参数解析；行为级 reserved-stage 拒绝由 U1 测试承载。
- 评审中提出的「字面量扫描会误杀 `rule-maturity.js`」在当前代码事实下不成立：`tests/unit/governance-contracts.test.js` 的 `producers` 数组只扫描 `task-governance-signals.js` 与 `resource-governance-lens.js`。因此本单元不要求提取 `RESERVED_STAGES` 常量或改写既有 producer 字面量扫描；只有未来扩大 producers 扫描范围时，才重新评估扫描策略。
- 新增 doc 断言：两个 SKILL.md 含 record 引导关键短语（短语清单以 U3 落地的实际措辞为准，U3 与本单元同 PR 收口避免短语漂移）；`spec-code-review` Stage 6 含 `Rule Maturity Candidates` 与不自动裁决/晋升边界；`rule-maturity.md` 含 producer/consumer 分工登记表述。

**Test scenarios:**
- Happy path: 全套 governance contract tests 在新现实下通过。
- Error path（守卫有效性）: 临时在 rule-maturity.js 加 `promote(` 字样应使断言失败（开发时自检，不留在代码中）。

**Verification:**
- `npm run test:unit` 全绿；`npm test` 主链路通过。

---

### U7. 裁决与汇聚子命令（adjudicate / merge）— deferred-pending-phase1-evidence candidate

**Goal:** 候选目标：人审裁决可被结构化记录，多机证据可合并成团队级样本。该单元不得直接执行；phase 2 重新计划前必须用 phase 1 样本确认 hit identity、裁决 owner/cadence 与合并需求。没有明确 owner/cadence 时，本单元默认继续 deferred。

**Requirements:** R9, R12

**Dependencies:** U1（复用同一 helper 模块与存储文件）；phase gate：phase 1 复查点通过且 phase 2 重新计划批准

**Files:**
- Modify: `src/cli/helpers/rule-maturity.js`
- Create: `docs/contracts/governance/rule-adjudication-record.md`（裁决记录 prose 模板：署名、verdict、被裁决 hit 复合键、依据、**该 rule 是否与既有 advisory/blocking 规则冲突或重叠**（必填项，防规则间自我矛盾——规则集互相冲突是 harness 实践已证实的崩溃模式，模型遇冲突规则会编造折中方案）；U7 先于 U9 落地，故独立建档；实现时若与 U9 的 promotion 模板合并为同文件双段，在该文件内登记决策即可）
- Test: `tests/unit/rule-maturity.test.js`

**Approach:**
- `adjudicate`：候选参数面为 `--rule-id`、`--hit-ref`、`--verdict false-positive|defect`、`--decided-by`、`--evidence-ref`（durable 裁决依据）。误报写入 `false_positive_refs`、真缺陷写入 `defect_evidence_refs`；裁决 ref 同步进顶层 `evidence_refs`。脚本只做结构记录——「这条 hit 是不是误报」的语义判断发生在人/评审侧，命令只是登记结论。
- **`--hit-ref` identity 未批准**：原候选 `<observed_at>::<evidence_ref>` 复合键存在同毫秒/同 evidence_ref 碰撞风险，不能作为 active implementation。倾向方案是 stable `hit_id`，但 `rule-maturity.v1` 的 `shadow_hits[]` item `additionalProperties:false`，不能在 phase 1 偷加字段；phase 2 必须显式选择：bump `rule-maturity.v2` 增加 `hit_id`，或维护 sidecar adjudication index，或使用 `observed_at + evidence_ref + content-hash/sequence` 的派生键。保留复合键只能作为 fallback，且必须用 fixture 证明碰撞可检测、批量裁决 anchor 不歧义、merge 去重不丢 hit。
- **署名与 hit↔verdict 关联的 durable 落点是 prose 裁决记录，不是 v1 schema**：schema 顶层 `additionalProperties:false` 且三个 refs 数组 items 为纯字符串，承载不了 `decided_by` 或 hit 关联字段。与 U9 promotion 同构：`--evidence-ref` 必须指向 repo 内存在的裁决记录文件（模板见 Files 的 `rule-adjudication-record.md`），记录内必填署名、verdict、被裁决 hit 的复合键、依据、规则冲突/重叠检查（与模板必填项一致）；脚本校验 ref 存在性，不校验 prose 质量。「同一 hit 重复裁决」的可靠判定来源是裁决记录 prose 内登记的 hit 复合键（人审可查）；脚本侧不机读 prose，重复防护降级为参数层提示（完整 ref 字符串重复提交时报已存在），主防线是人审记录本身——advisory 语义可承受该近似。
- **`--evidence-ref` 的 `#` 后缀是候选语义**：一次 CLI `adjudicate` 只裁决一条 hit；一份 prose 裁决记录可以批量写多条裁决，但每条 hit 必须使用独立 anchor ref（如 `<repo内路径>#<stable-hit-id>`）进入 refs。这样 `false_positive_refs.length` / `defect_evidence_refs.length` 才近似等于裁决次数，而不是批量文件数。phase 2 重新计划需钉死 anchor 生成规则与重复防护。
- **`report`（U8）的 `false_positive_rate` 分母口径候选**：分母 = `shadow_hits` 计数，分子 = `false_positive_refs` 计数；这是 refs-数组长度近似（一条裁决记录一个 ref），不是逐 hit 状态机——口径写入 `rule-maturity.md` 合同，消费侧（人审）知晓其近似性。
- `merge`：输入另一份同 schema 的 evidence 文件路径（队友导出），按 rule_id 合并、`shadow_hits` 的去重键跟随 phase 2 重新确定的 hit identity；裁决 refs 取并集；冲突（同 rule 不同 stage）拒绝合并并报结构化错误（stage 分歧属人审议题，不自动调和）。
- 导出即复制 evidence 文件本身（gitignored 单文件天然可传递），不另建导出格式。

**Patterns to follow:**
- 上游 `RuleMaturity.ts` 的 `recordShadowHit(record, {falsePositive})` 思路，但把误报标记从「记录时调用方顺手传」改为「事后显式裁决」——记录与裁决分离是 spec-first 两轴（机械观测 vs 语义判断）的要求。

**Test scenarios:**
- Happy path: adjudicate 一条 hit 为误报 → `false_positive_refs` 追加裁决记录 ref、record 整体 schema 校验通过（署名在 ref 指向的 prose 裁决记录内，不在 JSON record 上）。
- Happy path: merge 两份文件（部分 rule 重叠）→ hits 去重合并、计数正确。
- Error path: adjudicate 缺 `--decided-by` → exit 2（无署名不接受裁决；署名进裁决记录 prose，CLI 参数仅作必填校验与回显）。
- Error path: `--evidence-ref` 指向不存在的文件 → exit 2（裁决记录必须先落盘）。
- Error path: merge 遇 stage 冲突 → 拒绝且两份文件均不被修改。
- Edge case: `--hit-ref` 复合键定位不到 hit → 结构化错误。
- Edge case: 同 rule 内复合键碰撞 → 结构化错误要求人工去重。
- Test expectation: 若 phase 2 选择 `hit_id`，必须有 schema/sidecar 决策测试守住 v1 不被静默扩展；若选择派生键，必须有同毫秒同 evidence_ref fixture 覆盖。

**Verification:**
- focused unit tests 通过；手跑 record→adjudicate→merge 闭环可复现。

---

### U8. 晋升就绪报告（report）— deferred-pending-phase1-evidence candidate

**Goal:** 候选目标：把上游 `evaluateRulePromotion` 的阈值对照思想落为只读 deterministic 报告，给人审提供就绪事实。该单元须在 phase 1 观测密度与裁决 cadence 明确后重新计划。

**Requirements:** R10, R13（blocking 毕业 ref 校验）, R14（decay 信号）

**Dependencies:** U7

**Files:**
- Modify: `src/cli/helpers/rule-maturity.js`
- Modify: `docs/contracts/governance/rule-maturity.md`（登记报告字段与 advisory 阈值语义）
- Test: `tests/unit/rule-maturity.test.js`

**Approach:**
- `report` 输出逐 rule：`{ rule_id, stage, shadow_hit_count, adjudicated_count, false_positive_rate, defect_evidence_count, rollback_present, readiness_blockers[], decay_signals[], human_review[] }`。`false_positive_rate` 按 U7 钉死的口径：分母 = `shadow_hits` 计数、分子 = `false_positive_refs` 计数（refs 长度近似）；`adjudicated_count` = `false_positive_refs` + `defect_evidence_refs` 计数（裁决次数，非被裁决 hit 数——近似性同上，写入合同）。
- `readiness_blockers[]` 可模仿上游可读 blockers 形态（如 `shadow hits 3/10`），但默认阈值不得在 phase 2 重新计划前钉死为 active contract。上游 min_shadow_hits=10、min_defect_evidence=1、max_false_positive_rate=0.2、rollback 必在场只能作为 advisory starting point：上游假设 daemon 级观测密度，spec-first phase 1 可能只有低频显式记录。phase 2 必须先读取 phase gate 的 `candidate_density` 再确定默认值、覆盖方式与合同措辞。
- 对 stage=blocking 的 rule 校验毕业 test ref 在场（R13）；`decay_signals[]` 输出如「blocking 规则近 N 次 report 间隔零新 hit」「晋升后新增误报裁决」等可机读事实（R14），解释留给人审。
- `human_review[]` 是从 facts 派生的 next-action 队列：未裁决 shadow hits → `adjudication-review`；blockers 为空且有 defect evidence → `promotion-review`；blocking 缺毕业 test ref → `governance-repair-review`；decay_signals 非空 → `demotion-review`。每项必须带 `kind`、`reason_code`、`evidence_refs`、`suggested_action`，不得直接执行动作。
- 报告不输出任何「应当晋升/降级」结论——blockers 为空只说明「就绪事实满足」，决定仍归人。

**Test scenarios:**
- Happy path: hits=12、误报率 0.1、defect=2、rollback 在场 → blockers 为空。
- Happy path: blockers 为空且 defect evidence 在场 → `human_review[]` 含 `promotion-review` next action，但不输出「should_promote」。
- Happy path: hits=3 → blockers 含 `shadow hits 3/10` 形态条目。
- Happy path: blocking rule 无毕业 test ref → blockers 含 graduation-ref-missing。
- Happy path: blocking rule 有 decay signal → `human_review[]` 含 `demotion-review`。
- Edge case: hits=0 → 误报率按 0 计（上游同口径），blockers 含 hits 不足。
- Edge case: `--thresholds` 覆盖后 blockers 按新阈值计算。

**Verification:**
- focused unit tests 通过；report **读入**的每条 rule record 经 `rule-maturity.v1` 校验（坏 record 报结构化错误），report **输出**形状由 unit tests 守住——不为 report 输出新建 schema/validator（与 knowledge-harness L6「不加第二套 validator」先例对齐；`list` projection 同口径）。

---

### U9. 人审晋升/降级路径（promote / demote）— deferred-pending-phase1-evidence candidate

**Goal:** 候选目标：stage 变更有且只有一条人审署名路径，审批记录为 durable prose artifact。该单元须在 phase 2 owner/cadence 与 approval-ref 强度确认后重新计划。

**Requirements:** R11, R14（demote 即退役执行路径）

**Dependencies:** U8

**Files:**
- Modify: `src/cli/helpers/rule-maturity.js`
- Create: `docs/contracts/governance/rule-promotion-record.md`（审批记录 prose 模板与必填要素：证据 refs、毕业 test path、rollback action、invalidation_condition、decided_by、reviewed_at、本次晋升生效的阈值快照、phase gate artifact ref）
- Test: `tests/unit/rule-maturity.test.js`

**Approach:**
- `promote --rule-id --to <stage> --decided-by --approval-ref <repo内审批记录路径>`：候选语义为逐级晋升（不可跳级）；`--to required-evidence|blocking` 时先内部跑 R10 就绪检查，blockers 非空则 exit 2 并回显 blockers（上游 `approveRuleMaturity` 的「晋升前重验、不合格即 throw」同构）。**重验必须支持与 `report` 相同的 `--thresholds` 覆盖，且默认阈值与 report 同源（同一常量定义，不得双处硬编码）**——上游 `approveRuleMaturity` 内部调 `evaluateRulePromotion(record)` 时丢弃自定义阈值、永远按 DEFAULT_THRESHOLDS 重验（RuleMaturity.ts:105），是「评估时一套阈值、审批时另一套」的已证实 bug class，本单元从设计层堵死。生效阈值快照必须回显在命令输出中，并登记进审批记录 prose（rule-promotion-record.md 模板必填要素之一），使「这次晋升按什么阈值判定」可审计；approval-ref 必须是 repo 内存在的文件路径（prose 审批记录），以 ref 进 `evidence_refs`。schema 保持 v1 不 bump——promotion 审计轨迹走 prose artifact + ref，与 knowledge-harness L6「prose-enforced gate、不加第二套 validator」先例一致。
- `--to blocking` 的 approval-ref 不得只校验“文件存在”。phase 2 重新计划至少要要求其 repo-relative path 落在 `docs/contracts/governance/` 下（更窄可用 `docs/contracts/governance/promotions/`），并在模板中必填毕业 test path、rollback action、invalidation_condition、decided_by、reviewed_at、threshold snapshot、phase gate artifact ref；否则 `--approval-ref README.md` 这类形式通过会把 blocking gate 变成剧场。
- `demote --rule-id --to <stage> --decided-by --approval-ref`：降级/退役路径，无就绪检查（降级永远可达——「构建是为了删除」）；降级自 blocking 时提示同步删除毕业测试（提示属 next_action 事实，删除动作归执行该退役的 work 任务）。
- 审批记录模板放 `docs/contracts/governance/rule-promotion-record.md`，要素必填但形式是 prose——脚本校验 ref 存在性，不校验 prose 质量（质量归人审）。

**Test scenarios:**
- Happy path: shadow→advisory promote（无就绪门）→ stage 更新、approval ref 进 evidence_refs。
- Happy path: advisory→required-evidence 且 blockers 为空 → 成功。
- Error path: blockers 非空时 promote 到 required-evidence → exit 2 回显 blockers。
- Error path: 跳级 promote（shadow→blocking）→ exit 2。
- Error path: approval-ref 指向不存在文件 → exit 2。
- Error path: promote 到 blocking 时 approval-ref 不在治理审批目录下 → exit 2。
- Test expectation: promotion record 模板缺毕业 test path、rollback action、invalidation_condition、decided_by 或 threshold snapshot 时，doc contract test 失败；CLI 不机读 prose 质量，但模板合同必须被测试守住。
- Happy path: required-evidence→blocking promote 且 blockers 为空 → 成功（每个非 shadow stage 都有显式晋升用例，防 candidate-hook 式「评估可达但审批跳过」的死 stage）。
- Happy path: 自定义阈值下 `report --thresholds` blockers 为空、默认阈值下非空 → promote 带同样 `--thresholds` 成功，且输出回显生效阈值快照（阈值同源回归用例，对应上游 approveRuleMaturity 丢弃自定义阈值的 bug class）。
- Happy path: blocking→advisory demote → 成功且 next_action 提示删除毕业测试。

**Verification:**
- focused unit tests 通过；governance-contracts 的「producer 无 promotion 函数」断言相应调整为「promotion 仅经人审署名命令路径」（U6 断言的 phase 2 修订，记入该测试文件注释）。

---

### U10. 毕业机制合同化（blocking = contract test）— deferred-pending-phase1-evidence candidate

**Goal:** 把「规则毕业为 npm test 主链路的确定性 gate」从约定变成被守护的合同。

**Requirements:** R13, R14

**Dependencies:** U9；phase gate：至少 1 条 rule 有裁决记录

**Files:**
- Modify: `docs/contracts/governance/rule-maturity.md`（毕业语义章节：blocking 的执行体是 contract test/lint，不是 runtime hook）
- Modify: `tests/unit/governance-contracts.test.js`（新增断言：源码层不出现 hook 安装/pre-commit 写入模式；以及 stage 图完整性断言——每个非 shadow stage 均可经 promote 逐级到达、经 demote 离开，防止上游 `candidate-hook` 式死 stage：evaluateRulePromotion 返回它作 nextStage，approveRuleMaturity 却直接跳到 approved-blocking，没有任何代码路径真正进入该 stage）
- Modify: `skills/spec-compound/SKILL.md`（沉淀治理类 solution 时，提示「该 learning 是否对应某条 rule 的候选/毕业候选」，把知识轮与规则轮在 compound 处接通；≤3 行 prose）

**Approach:**
- 毕业流程为既有机制的组合而非新机制：人审决定毕业 → 走 `spec-work` 写毕业 contract test（如同 `governance-contracts.test.js` 既有断言）→ `promote --to blocking` 时 approval-ref 记录毕业 test 路径 → `report` 此后校验该 ref。
- 合同明确反向守卫：任何把 blocking 实现为 runtime hook、pre-commit 拦截、SessionStart 注入的尝试都违反本合同（OPT-D 与父方案 non-goal 双重背书），由 governance-contracts 测试守源码层。
- compound 接通是单向提示：知识轮的 verified learning 可成为规则轮的 rule 候选（事故墓志铭→规则），输出建议 `rule_id`、`evidence_ref`（新 learning 文档）、`reason_code` 与 `human_review_kind`；不反向自动创建、不调用 `record/adjudicate/promote`，第一版不新增 agent。

**Test scenarios:**
- Happy path: doc contract test 断言 rule-maturity.md 含毕业语义关键短语。
- Happy path: governance-contracts 新增断言通过（rule-maturity.js 无 hook/pre-commit 模式）。
- Test expectation: compound prose 行 — doc contract test 断言关键短语在场。

**Verification:**
- `npm run test:unit` 全绿；fresh-source eval 验证 compound 提示可被新会话正确执行。

---

### U11. governance ROI 确定性聚合 — deferred-pending-phase1-evidence candidate

**Goal:** 治理漏斗可量化：观测→裁决→晋升→毕业的转化计数与时间窗趋势，零虚构常数。

**Requirements:** R15

**Dependencies:** U7（裁决数据）、U9（晋升数据）；与 phase 3 无依赖

**Files:**
- Modify: `src/cli/helpers/rule-maturity.js`（`report --funnel` 或独立 `roi` 子动作，实现时按输出体量定）
- Modify: `skills/spec-skill-audit/scripts/collect-skill-facts.js`（周期健康 audit artifact 纳入漏斗事实，扩展 U4 已有采集函数）
- Test: `tests/unit/rule-maturity.test.js` + skill-audit fixture 测试

**Approach:**
- 借上游 GovernanceMetrics 的两个可取形态：漏斗转化计数（proposed→validated→approved→enforced 映射为 observed→adjudicated→promoted→graduated）与时间窗对比 delta（本期 vs 前期，纯文件聚合）。adjudicated 级计数沿用 U8 钉死的 refs-计数口径（裁决次数近似，合同已登记），不在 ROI 层伪造逐 hit 精度。
- 时间窗边界是显式输入而非 wall-clock 隐式输入：`report --funnel` 支持 `--as-of`（或 `--window-start/--window-end`）参数，漏斗输出是「evidence 文件 + 窗口参数」的纯函数。若输出含 `generated_at`，它必须派生自 `--as-of` 或窗口结束时间，不得调用 `new Date().toISOString()`；否则同一 evidence 文件和同一窗口参数无法逐字节复现。未传窗口参数时可用当前时间推导默认窗口，但输出必须回显实际窗口边界，且逐字节 determinism 测试必须使用显式 `--as-of`。
- 显式拒绝其虚构面：无 token 节省估算、无 ROI Score、无占位指标（上游 instinctHitRateDelta 恒 0 还进报告的反例）；每个输出数字必须可从 evidence 文件直接复算。
- **漏斗输出必须附排除计数与原因（omission 事实段）**：窗口外 N 条、格式不合/校验失败 N 条、已 retire N 条等被排除项以确定性计数回显，不允许 silent truncation——「漏斗只展示纳入项」会被消费侧读作「覆盖了全部 evidence」，与 no-silent-caps 口径一致；排除原因是机械事实（窗口边界、schema 校验结果），不含语义判断。
- 输出为 facts，解读归 LLM/人（如「30 天零裁决」是事实，「裁决流程停滞需要关注」是消费侧判断）。

**Test scenarios:**
- Happy path: fixture 含完整漏斗数据 → 各级计数与 delta 正确。
- Happy path: fixture 含窗口外与格式不合数据 → 排除计数与原因正确回显，纳入计数不含被排除项。
- Happy path: 同一 fixture + 同一显式 `--as-of` / 窗口参数多次运行 → 输出逐字节一致（确定性可复现），且 `generated_at`（如存在）等于派生时间而非 wall-clock。
- Edge case: 时间窗内无数据 → 计数为 0，不出现估算或外推值。
- Happy path: skill-audit health artifact 含漏斗事实（fixture 断言）。

**Verification:**
- focused tests 通过；输出中不存在任何非复算来源的数字（code review 核对项）。

---

### U12. resource lens v2 producer 扩展 — deferred-pending-phase1-evidence candidate / separately plannable

**Goal:** 收口父方案 §4.8 已核实的 producer/schema 缺口。

**Requirements:** R16

**Dependencies:** None（与 promotion 链路独立，可并行）

**Files:**
- Modify: `src/cli/helpers/resource-governance-lens.js`
- Modify: `docs/contracts/governance/resource-governance-lens.md` + `resource-governance-lens.schema.json`（bump v2 + 版本说明）
- Modify: `skills/spec-work/references/shipping-workflow.md`（Phase 3 step 2.5 boundary rules 的维度枚举句，约 L134——被 prose contract test 逐字钉死，新增维度后必须同步更新）
- Modify: `skills/spec-code-review/SKILL.md`（Stage 3/6 的 lens 维度与字段枚举措辞，同样被 prose contract test 钉死）
- Test: `tests/unit/resource-governance-lens.test.js` + `tests/unit/governance-contracts.test.js`（L83 的 `schema_version: 'resource-governance-lens.v1'` payload 字面量随 const bump 同步改）
- Test: `tests/unit/spec-work-resource-lens-contract.test.js` + `tests/unit/spec-code-review-resource-lens-contract.test.js`（两个 prose contract test 逐字断言 v1 维度枚举短语——「large files, generated output, raw logs, owner hints, and staging-scope risks」等——v2 新增维度后断言与 prose 必须同 PR 更新）

**Approach:**
- 新增维度（已核实「合同字段都没有」的四项）：staged 媒体产物检测（screenshots/视频扩展名，新 dimension + reason_code）；coverage/playwright-report 等生成报告目录的 staged 提交策略 advisory（注意与现有 retained 白名单的方向区分：白名单抑制 raw-log 噪声，新维度提示「staged 了不该提交的生成报告」）；raw log retention 状态字段（策略 + 「应清理」事实）；redaction status 字段（敏感信息脱敏与否的机械可判事实，judgment 不进脚本）。
- policy 输出补 owners/modules 全貌（item-level hint 已有，policy-level 缺）。
- 保持 lens 只读、never-blocking、exit 0 三态合同不变；v2 是字段扩展不是行为变更。

**Test scenarios:**
- Happy path: staged 一个 .png → 媒体维度 advisory 产出。
- Happy path: staged coverage/ 目录文件 → 提交策略 advisory（而非被白名单静默）。
- Happy path: v2 schema 校验通过且 v1 消费者关注的既有字段全部保留。
- Happy path: v2 维度枚举在两个消费 prose（shipping-workflow.md L134 段、spec-code-review Stage 3/6）中同步更新，对应逐字断言随之更新且通过。
- Edge case: retained 白名单目录内的 .log 仍被抑制（既有行为不回归）。
- Error path: 既有三态 exit code 合同不变（rejected 才非 0）。

**Verification:**
- focused tests + `npm run test:unit` 通过；schema 版本说明含 v1→v2 字段对照。

---

### U13. resource lens 消费接通（PR handoff + standards reviewer）— deferred-pending-phase1-evidence candidate / separately plannable

**Goal:** 接通两个已核实的消费空置点，让 hardening 产生 workflow 可观察行为变化。

**Requirements:** R17

**Dependencies:** U12

**Files:**
- Modify: `skills/spec-work/references/shipping-workflow.md`（Phase 4 Step 3 git-commit-push-pr 上下文清单注入 lens advisory）
- Modify: `skills/spec-code-review/SKILL.md`（Stage 4 per-reviewer context 组装：project-standards persona 的 review context 追加 lens items；Stage 3b 保持纯路径发现职责不动）
- Test: 对应 doc contract tests

**Approach:**
- PR handoff：把 lens 的大文件/generated-output/媒体产物 advisory 列入 PR description 上下文清单，让 PR 评审者看到资源风险事实；advisory 不阻塞 PR 创建。
- standards reviewer：接入点在 Stage 4 的 per-reviewer context 组装清单（与既有 `<standards-paths>` block 同位置追加），lens items（含 subject_path/evidence_ref）作为 project-standards persona 的输入之一——不写进 Stage 3b：该段职责是「only file paths, not contents」的廉价路径发现，塞结构化 facts 与其设计说明冲突。reviewer 仍独立判断是否构成 finding（advisory 不自动转 finding，既有 SKILL L838 口径不变）。
- spec-release-notes 不接入的决策记录进 shipping-workflow 注释或本 plan（已核实其为只读检索型、无 staging 环节）。

**Test scenarios:**
- Happy path: doc contract test 断言两处接入 prose 在场。
- Test expectation: 行为语义 — fresh-source eval 验证接入引导可被新会话执行。

**Verification:**
- doc contract tests + `npm run lint:skill-entrypoints` 通过；`spec-first init` 刷新 runtime mirror。

---

### U14. 整版文档与路线收口 — deferred-pending-phase1-evidence candidate

**Goal:** v1.17 全范围的文档状态与真实进展一致。

**Requirements:** R8（整版口径）

**Dependencies:** U10, U11, U13

**Files:**
- Modify: `docs/contracts/governance/rule-maturity.md`（整版后的 stage 生命周期全貌：观测→裁决→晋升→毕业→退役）
- Modify: `docs/01-需求分析/13.scale-integration/README.md`（v1.17 行→「已完成」，仅当 R1–R17 全部落地）
- Modify: `CHANGELOG.md`（逐 phase 合入时分别记录）
- Modify: `docs/contracts/workflows/spec-work-run-artifact` 相关文档若 resource v2 字段影响 run artifact 引用（实现时核实，预计不影响）

**Test scenarios:**
- Test expectation: none — docs-only 收口单元，断言由各 phase 的 doc contract tests 承载。

**Verification:**
- `npm test` 主链路通过；README 进展与 §9.0.1 三级 gate 实况逐项对照无虚标。

---

## System-Wide Impact

- **Interaction graph:** phase 1 active 范围内，internal.js 新增 dispatch 分支；spec-plan / spec-code-review 的 lens 消费段新增一个可选后继动作；spec-code-review Stage 6 新增 `Rule Maturity Candidates` 轻提示；skill-audit artifact 写入面新增周期健康事实。无公开 CLI 入口变化。
- **Error propagation:** record 失败（store 损坏、参数非法）以 exit 2 + 结构化 reason_code 返回，workflow prose 明确 degraded 继续；不让治理观测失败阻塞主 workflow。
- **State lifecycle risks:** 单文件 upsert 存在并发写竞态（两个会话同时 record）——phase 1 接受该风险：观测是低频显式动作，丢失个别 hit 不影响 advisory 语义；不引入锁机制（避免过度设计），风险登记于下表。
- **API surface parity:** Claude/Codex 双宿主：SKILL.md 变更经 `spec-first init` 投影；helper 是 Node 脚本不受会话缓存影响。
- **Integration coverage:** phase 1 使用 `npm run test:unit` 覆盖 internal dispatch + skill-audit health artifact + code-review prose contract；record→list→audit 消费的端到端在 U4 fixture 测试中验证，code-review 候选提示由 U3/U6 doc contract 与 fresh-source eval 守住。
- **Unchanged invariants:** `task-governance-signals` 输出合同不变；`resource-governance-lens` 在 phase 1 不变；`rule-maturity.v1` schema 不 bump（promotion/adjudication 的 prose artifact + ref 仍只是 deferred candidate）；doctor 合同不变；`gate-lens-taxonomy.v1` 词表不变。
- **Phase 2+ 增量影响（candidate only）:** adjudicate/promote/demote/merge/report、U8 `human_review[]`、U10 compound 轻提示、U13 PR handoff / standards reviewer lens 注入均需后续重新计划。当前 plan 不改变这些 workflow 的阻塞行为。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| workflow prose 引导被 LLM 忽略，证据仍不流动 | U3 用 doc contract test 守住引导在场；**落地后 2 周复查点（owner：本仓维护者，动作：跑 `rule-maturity list` + audit artifact）**按 phase gate 分类 `empty` / `degraded/corrupt` / `consumer_missing` / `no_llm_adoption` / `candidate_density`，不同分类对应不同修复方向 |
| phase 2-4 设计在空证据集上抢跑 | 当前 active scope 只保留 U1-U6；U7-U14 标 `deferred-pending-phase1-evidence`，后续必须重新计划并带 phase 1 证据 |
| 周期人审角色或 cadence 不存在 | phase 2 gate 要求 owner/cadence 明确后才允许 adjudicate/promote/demote 落地；不能把“证明有人会审”写成当前交付义务 |
| evidence_ref 指向会话级临时数据，人审无法回查 | U3/U5 钉死 durable evidence_ref 规则：只接受 repo 内 artifact 路径或可复跑命令描述，lens stdout 不合法 |
| 记录刷量/低质 hit 稀释证据价值 | prose 明确「LLM 判断值得观测才记录」+ durable evidence_ref 门槛；list/report 暴露 reason_code 分布便于人审甄别 |
| `Rule Maturity Candidates` 在 code-review 中产生噪声，干扰主 review | Stage 6 只接受三类强信号：P1/P2 重复治理缺口、同类低级问题 2 次以上、明确违反已登记合同/plan non-goal；不得新增 finding、不得阻塞 review、不得自动裁决；若误报多，先调整候选条件，不直接上专用 agent |
| 并发写竞态丢失记录 | 接受（低频显式动作 + advisory 语义）；store 损坏有 `evidence-store-corrupt` 保护不静默重建 |
| 翻转治理断言时误删 reserved-stage 守卫 / 误把 rule-maturity.js 加入字面量扫描数组 | U6 明确「翻转一条、保留另一条、新文件单独断言」，code review 重点核对 |
| gitignored 本机证据在多人协作下分散或因 re-clone 丢失 | phase 1 接受该限制；phase 2 若恢复需重新设计 merge/export 与 hit identity，不能直接采用 `<observed_at>::<evidence_ref>` |
| `hit_id` 倾向与 `rule-maturity.v1` schema 冲突 | phase 2 重新计划必须显式选择 v2 schema bump、sidecar adjudication index 或派生键；不得静默往 v1 `shadow_hits[]` 塞额外字段 |
| 上游阈值（10 hits / 0.2 误报率）不适配本仓节奏，就绪门形同虚设或永不可达 | 上游阈值仅保留为 candidate input；phase 2 必须先读 phase gate 的 `candidate_density` 再定默认值 |
| 毕业测试越积越多，npm test 变慢、harness 变厚 | R14 退役路径 + report decay 信号（长期零 hit 的 blocking 规则浮出）；「构建是为了删除」原则进 rule-maturity.md 合同 |
| promote 人审流于形式（审批记录复制粘贴） | 审批记录必填毕业 test path、rollback action、invalidation_condition、decided_by、reviewed_at、threshold snapshot 与 phase gate artifact ref；blocking approval-ref 至少限制到治理审批目录；report blockers 为空是晋升必要条件而非充分条件，决定权在人 |
| resource lens v2 字段扩展破坏既有消费者 | v2 保留 v1 全部字段，contract test 守既有字段不回归（U12 测试场景）；版本说明含字段对照 |
| corrupt JSON 让证据流静默停摆且被误判为 LLM 未采用 | U1/U4 均要求 `evidence-store-corrupt` / degraded fact，不静默重建；phase gate 单独区分 `degraded/corrupt` 与 `no_llm_adoption` |

---

## Documentation / Operational Notes

- CHANGELOG 按仓库格式逐 phase 合入时分别记录，标 `(user-visible)`（新增 CLI internal 子命令 + code-review `Rule Maturity Candidates` 提示 + skill-audit 周期健康事实面 + resource lens v2）。
- SKILL.md 变更后执行 `spec-first init` 刷新双宿主 runtime mirror；不手改 mirror。
- phase 1 合入后真实运行 2 周再决定是否启动 phase 2 重新计划（phase gate），让 shadow_hits 积累出可供人审的样本；phase 4/U12/U13 如需提前做，必须另开独立计划，不再从本 plan 直接并行。
- 团队推广注意：phase 2 `merge` 落地前，各成员本机证据互不可见——团队级 promotion 评审从 phase 2 起才有完整样本，phase 1 期间不要基于单机数据做晋升预判。

---

## Sources & References

- 路线索引：`docs/01-需求分析/13.scale-integration/README.md`（v1.17 行 + 开发顺序约束）
- 父方案：`docs/01-需求分析/13.scale-integration/spec-first内化集成scale-project-scaffold技术方案.md` §4.7（RuleMaturity）、§4.8（resource/output governance）、§9.0.1（三级交付 gate）、§10（P1 治理优先级 + GovernanceMetrics P2-advisory 裁决）
- 合同：`docs/contracts/governance/rule-maturity.md` + schema、`docs/contracts/governance/resource-governance-lens.md` + schema、`docs/contracts/governance/gate-lens-taxonomy.schema.json`
- v1.14 前序 plan：`docs/plans/2026-06-05-001-feat-governance-lens-foundation-plan.md`
- 上游参考（只借思想）：`scale-engine/src/evolution/RuleMaturity.ts`、`scale-engine/src/cortex/GovernanceMetrics.ts`（实测提炼见 Context & Research）
- Harness 工程化输入：`docs/01-需求分析/14.harness-engineering/harness-engineering-x-spec-first-analysis.md`、`docs/01-需求分析/14.harness-engineering/harness-discipline-deep-analysis.md`
- 人审 promotion 先例：`docs/contracts/workflows/self-reflection-capability-upgrade.md`、`docs/contracts/knowledge/knowledge-harness.md`（L6）、`skills/spec-compound/SKILL.md`（verified promote gate）
- Learnings：见 Context & Research（5 篇）
