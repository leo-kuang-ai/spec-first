# `spec-plan`：当前分支与 `master` 的二次深审、能力拆解与集成报告

> Artifact type: confirmed source diff + historical-plan evidence + applied source integration + bounded validation
> Date: 2026-07-16
> Comparison: `master` (`437bb9e4`) ↔ current `HEAD` (`a2f37c60`, branch `leo-2026-07-14-write-skill`)
> Scope: `skills/spec-plan/**` source package、直接相关 contract tests、历史已完成优化方案及其 validation；generated runtime mirrors 排除在写入范围外。

## 结论

当前分支的 `spec-plan` 不是对 `master` 版本的局部润色，而是一次工作流重构：它从以 **Markdown 计划模板、显式治理引用和专项风险 lens** 为中心的 HOW 计划器，转为以 **`spec-unified-plan/v1` 就绪度、跨格式工件、可执行 handoff 和 skill-local prompt assets** 为中心的计划生命周期编排器。

二次深审后的结论不是“回滚到 `master`”，而是“保留当前架构，恢复仍然有效的质量能力”。第一轮集成已恢复首屏决策质量、planning-only 热路径、evidence/source-runtime 边界、`reuse / extend / new` source ownership、高风险 readiness、条件化 multi-surface coverage、显式 dispatch 授权与 inline fallback，以及 maintainer-only eval fixtures；本次再次审查进一步确认，**source ownership 恢复并不等于 master 的 existing-capability/reuse 优化及其历史优化链路所表达的 composition-first / 胶水式架构思考已完整恢复**。因此本次又把“先盘点已有能力、优先复用或扩展、必要时用薄胶水组合、谨慎新增抽象、拒绝无价值 wrapper/平行 pipeline、同时允许职责冲突时创建新边界”写入 canonical prompt 与专项角色。

因此，集成后的当前分支应理解为：**当前生命周期/格式/handoff 架构 + `master` 的可信规划质量地板**。静态 source、contract test 和 projection plan 能确认契约存在与分发路径；它们仍不等于真实模型输出质量、宿主 loader 生效或 field outcome。

## 本次再次纠偏：ownership 恢复不等于 composition-first 思想完整恢复

用户所说的“胶水编程、复用、扩展”等不是要求计划文档增加一张复用表，而是要求 `spec-plan` 的 prompt 在形成技术方案时采用更成熟的架构思维。第一轮集成主要恢复了“新增 durable source surface 前做 `reuse / extend / new` owner 判断”，但触发范围和决策空间仍然偏窄：

- 主要触发对象是新 file/reference/skill/script/schema/runtime projection 等 durable surface；
- 没有覆盖普通的新 abstraction、adapter、wrapper、orchestrator、integration seam 或 end-to-end pipeline；
- 没有把“组合已有能力”定义为独立姿态，planner 容易在 `extend` 与 `new` 之间二选一；
- 没有说明胶水层可以拥有 translation、sequencing、failure/degradation、observability/evidence aggregation，但不能拥有 duplicated domain truth、business policy 或 parallel durable state；
- 没有显式拒绝无价值 wrapper、第二套平行 pipeline、隐藏 partial failure 的 orchestrator；
- 没有保护“不要盲目复用”：当已有 owner 无法承载新职责时，`new` 仍然应胜出。

结合 `master:skills/spec-plan/references/reuse-analysis.md`、`master:skills/spec-plan/references/planning-flow.md`、历史已完成 enterprise/surface/slimming/quality 方案，以及当前 `agent-native-planning-strategist.md` 中 “Primitive tools first — atomic, composable actions; prompts own judgment and orchestration” 的现存原则，本次把架构姿态扩展为：

| 姿态 | 适用条件 | 计划必须说明 |
| --- | --- | --- |
| `reuse` | 现有 capability 与 contract 已满足需求 | 复用对象及其 authority |
| `extend` | 现有 owner 已拥有边界，新增行为可聚合且不破坏 cohesion | owner、extension point、为何不需要新边界 |
| `compose / thin-glue` | 多个现有 capability 应继续独立持有真相，只需窄集成 seam | 参与者 authority、glue ownership、failure propagation、degradation、observability/evidence |
| `new` | 复用、扩展或组合会混合职责、扭曲 contract、制造隐藏耦合或双真相源 | 被拒绝的 owner/composition shape、新 boundary 与 source-of-truth |

这不是“composition 永远优先”的新教条。正确顺序是 **inventory → reuse → extend → compose / thin-glue → new**，但每一步都受职责、contract、truth ownership 和 failure semantics 约束；如果复用会让 orchestrator 持有不相关的 policy truth 或 durable state，应明确选择 `new`。

证据上需要区分“直接继承”与“本次归纳扩展”：当前 `master` tree 直接确认的是 Existing Capability Inventory、`reuse / extend / new`、rejected owner/boundary reason、specialist reuse 与 work-phase recheck；`compose / thin-glue` 不是 master reference 中的原文字段，而是结合用户明确指出的胶水式规划思想、历史方案反复强调的“复用现有 owner/specialist、避免平行机制”，以及当前 `agent-native-planning-strategist.md` 的 atomic/composable primitives 原则，补成的缺失中间姿态。本文不把这项归纳伪装成 master 的逐字复制。

## 比较口径与证据边界

- 使用 `git diff --find-renames master -- skills/spec-plan` 比较两端最终树，而非只统计当前分支新增 commit。
- `master` 与 `HEAD` 的共同祖先是 `04ed28a5`；`master` 不是 `HEAD` 的祖先，但 `04ed28a5..master` 对 `skills/spec-plan/**` 没有变更。因此以当前 `master` 树为对照不会掩盖该 skill 的 master-only 差异。
- 包级树差异为 **37 files changed, 4,648 insertions, 2,140 deletions**：主 `SKILL.md` 净增 361 行；新增 17 个 skill-local agent prompt、repo profile cache 和 approach-altitude reference；删除 3 个 eval 文件及 6 个旧治理/模板/流程 reference。
- 本文确认的是 source 和 test source 的静态差异。它不把 prompt 文案、projection 成功或 test 存在本身表述为宿主加载效果、模型行为质量或线上结果。

## 核心逻辑差异（集成前基线）

| 逻辑面 | `master` | 当前分支 | 实际影响 |
| --- | --- | --- | --- |
| 工作流定位 | 面向清晰软件 HOW、requirements/PRD handoff、现有 plan deepening；非软件 answer-seeking 默认不落盘。 | 面向所有多步骤工作；明确覆盖软件、non-software、answer-seeking 与 approach-plan。 | `spec-plan` 的入口覆盖面变宽，增加了任务分类和分流责任。 |
| 上游输入 | 以 requirements document 为主，区分 PRD/brainstorm/legacy origin，并维护 `spec_id`、origin grade/receipt 等 trace。 | 以 Product Contract 为真相源；优先在同一 requirements-only unified artifact 上 enrichment，只承认 `spec-brainstorm` unified origin 与 legacy brainstorm 两种 durable origin；现有 `spec-prd` 按 legacy 兼容读取。 | 从“多个需求文档到新计划”的链路，改为“同一计划从 requirements-only 升格到 implementation-ready”；牺牲了 `spec_id` 作为显式跨工件链路标识。 |
| 前置分流 | Phase 0 细节委托给 `planning-flow.md`；有 software/universal 路由、bug-shaped 的 `spec-debug` 建议和 ready-to-execute 的 `spec-work` 建议。 | 主干内联 Phase 0；新增 `output:`/`confirm:` 解析、approach-altitude、明确的 code vs answer-seeking 分类、Product Contract discovery 和 scoping synthesis。 | 当前行为更可见、更细化；同时主 `SKILL.md` 从 462 行增长到 821 行，入口认知负担提高。 |
| 工件与格式 | Markdown 是唯一 canonical artifact；HTML 只能是从 Markdown 派生的 human-readable sidecar，且明确禁止 HTML-only。 | Markdown 与 HTML 变成互斥输出；以 prompt > memory > config > 默认的优先级选择，pipeline 强制 Markdown。HTML 以可见 metadata/anchor 支持下游直接读取。 | 计划可直接以 HTML 交付，但 HTML 目前被显式排除在 `spec-doc-review` mutation 之外，形成已声明的 review capability gap。 |
| 下游消费 contract | 以 `plan-template.md` 的 Markdown skeleton、`spec_id`、Direct Evidence 和 Markdown frontmatter 为主要契约。 | `plan-sections.md` 定义 `spec-unified-plan/v1`、`artifact_readiness`、`product_contract_source`、`execution`、固定 section registry、Verification Contract 和 Definition of Done；Markdown/HTML 只负责各自 rendering。 | 消费方可以先按 heading/anchor 进行 size-aware 读取，并按 `requirements-only`/`implementation-ready` 决定是否可执行；结构化 lifecycle 更清晰。 |
| 范围确认与不确定性 | 有 solo/brainstorm scope summary，但由旧 planning-flow 和 synthesis reference 协同。 | 新增 `confirm:auto` / `confirm:ask` 与配置项；Standard/Deep 的 solo synthesis 需确认，Lightweight 且无 call-out 才可自动继续；把 inferred 内容路由为 Assumptions。 | 对 scope claim 的交互约束更明确，也为 headless/pipeline 保留了可追溯的假设出口。 |
| 研究机制 | `planning-flow.md` 规定 local research、Direct Evidence Readiness、task-governance signals；research dispatch 需要明确 dispatch authorization，否则 inline fallback。 | 增加共享 repo profile cache、repo-profiler、agent-native triage、Slack opt-in、按 implementation-guidance/landscape/mixed 分类的外部研究；generic subagent 使用 skill-local prompt asset。 | 缓存可减少重复 repo orientation，agent-native 研究成为一等场景；但当前文字不再保留原有的 dispatch-authorization/inline-fallback 约束。 |
| 高风险与新增 surface 治理 | `governance-boundaries.md`、`reuse-analysis.md`、`enterprise-plan-review.md` 作为条件 STOP reference；要求 Direct Evidence、reuse/extend/new 决策、enterprise appendices，并以 `task-governance-signals` 提供 advisory facts。 | 这些独立 reference 与硬 floor 都被移除；风险仍通过深度评分、`security-sentinel`、`data-integrity-guardian`、`deployment-verification-agent` 等 prompt assets 处理，并新增 agent action/context parity lens。 | 风险判断从显式 artifact contract 与 trigger matrix 转向 LLM 选择 specialist 的语义机制；当前 source 没有对旧字段/appendix/信号的等价替代承诺。 |
| deepening 与 handoff | Confidence-first check 必做 doc review，菜单提供 Start work、task pack、Issue、Proof、Done；HTML sidecar 不改变 Markdown 的 handoff。 | Confidence check 增加“load-bearing external research 必入评分”；Markdown 默认 headless doc review，HTML 生成 synthetic skipped envelope；菜单按 readiness 和 host capability 动态提供 `spec-work`、`/goal`、interactive review、Issue、Proof 或 browser。 | handoff 的 consumer 归属更明确：`spec-work` 是推荐执行尾部 owner，goal 是替代路径；任务包编译不再作为默认菜单项。 |

## 关键替换与删除（集成前基线）

### 1. 从旧模板链转为统一工件 contract

`master` 的 `plan-template.md` 规定了 Summary、Problem Frame、Requirements、KTD、Implementation Units、Direct Evidence 等 Markdown skeleton，并把 `status` 和 `spec_id` 放在 required metadata。当前 `plan-sections.md` 取消模板文件，将内容 contract 与 rendering 分离，并以 `Goal Capsule`、`Product Contract`、`Planning Contract`、`Implementation Units`、`Verification Contract`、`Definition of Done` 作为 implementation-ready 的固定 section registry。

这是最大的一项语义迁移：`artifact_readiness` 只回答“是否可执行”，不表示开发进度；Markdown software unified plan 的 `status` 则独立表示 lifecycle。当前 source 还明确禁止把 `active`、`completed` 等 progress 值写成 readiness。

### 2. 计划前治理的显式 contract 被删除

以下 `master` source 已从 package 中删除，且当前包内全文搜索不到其对应的 contract keyword：

- `governance-boundaries.md`：context/evidence/source-runtime/provider trust、run-local ledger、target-repo 边界。
- `reuse-analysis.md`：新增 source surface 的 inventory 与 `reuse / extend / new` 决策，以及 `spec-work` 的 recheck。
- `enterprise-plan-review.md`：高风险 trigger matrix、必要 appendix、hard gates 和 specialist mapping。
- `planning-flow.md` 中的 `Direct Evidence Readiness`/`Direct Evidence`、`task-governance-signals`、dispatch authorization 和 inline fallback。
- `evals/examples.json` 与 `evals/output-quality-cases.json`：维护者可复核的 planning/output-quality fixtures。

当前版本不是完全放弃风险考虑：深度检查仍包含 security、privacy、migration、rollout 等项，且有安全、数据完整性、部署、性能 prompts。然而它们不再构成旧版的固定输出字段、硬 gate 或可回归的 fixture contract。因此不能把“存在相关 prompt”等同于旧治理能力的行为等价。

### 3. 研究机制从 typed/central agents 转为 skill-local prompt assets

当前分支新增 17 个 `references/agents/*.md` 文件，并要求用 prompt 内容初始化 generic subagent，而非依赖 platform 注册的 typed agent。它还新增以 `HEAD` 和 profile-input dirty 状态为 freshness key 的 `/tmp/spec-first/repo-profile/...` cache；cache miss 由 `repo-profiler` 生成，hit 仅复用问题无关的 stack、topology、convention 等事实。

相较 master，这提高了跨宿主 source portability，并引入 agent-native planning strategist（action/context parity、tool granularity、approval 与 shared workspace）。代价是旧版“必须先取得 dispatch authorization，否则 inline fallback”的显式边界不在当前 skill source 中。

### 4. 输出与 handoff 由静态菜单升级为状态驱动菜单

当前 `plan-handoff.md` 先按输出格式处理 review：Markdown 必跑 `spec-doc-review mode:headless`，HTML 显式跳过并展示原因。然后根据 artifact readiness、`execution: code`、host 是否存在 `create_goal`、以及 residual findings 生成选项。`spec-work` 作为推荐项拥有 implementation engine、review、verification 和 closeout；`/goal` 是绕过该尾部的可选替代。

这比 master 的“Start work / task pack / Issue / Proof / Done”更精确地防止 requirements-only 或 knowledge-work artifact 被直接作为 code plan 执行。但 HTML 的 doc-review 空白、以及手动选择 `/goal` 后不经过 `spec-work` 尾部，都是当前 source 已明确需要依赖 host/goal owner 正确执行的边界。

## 质量与可验证性变化（集成前基线）

与 skill source 同步的测试变化表明，验证焦点也发生了迁移：

- `tests/unit/spec-plan-contracts.test.js` 从 950 行的广泛 source/runtime/governance assertions 收敛为 96 行，主要验证 unified plan enrichment、status、legacy brainstorm、execution ownership、origin 发现和 bootstrap assumption。
- `tests/unit/spec-plan-enterprise-contracts.test.js`（354 行）和 `tests/unit/spec-plan-governance-signals-contract.test.js`（33 行）被删除；它们原先覆盖 enterprise trigger/reuse contract、output-quality fixture、runtime projection 和 governance signal。
- 新增 `tests/unit/repo-profile-cache-parity.test.js`，验证 cache reference、script 与 profiler 在多个 skill 中 byte-identical；另有 CE upstream contract 测试验证 `spec-work` 为推荐执行入口和部分 prompt asset 文案。

因此，当前测试更能证明 unified artifact lifecycle 和 cache copy parity 的静态文本 contract；它不再直接覆盖 master 版 enterprise/reuse/direct-evidence/governance-signal 规则是否保持。需要在后续质量判断中把这视为 coverage 重定位，而非自动视为质量提升或退化。

## 影响、收益与待验证风险（集成前基线）

| 观察 | 预期收益 | 尚未由本次比对证明的风险/验证项 |
| --- | --- | --- |
| unified artifact + readiness | brainstorm 到 plan 到 work 的 handoff 可在同一工件中完成，consumer 可按稳定 heading/anchor 读取。 | 检查所有 consumer 对 Markdown/HTML、requirements-only/implementation-ready、legacy 的实际兼容性；尤其是 HTML 的 status、review 和 task-pack 边界。 |
| exclusive HTML | 人类可读交付不再依赖 Markdown sidecar，HTML 有显式 visible metadata。 | `spec-doc-review` 不能修改 HTML；需验证 HTML 计划在真实 `spec-work`/goal 路径上的端到端可执行性与回退体验。 |
| repo profile cache | 减少相同 commit 上的重复 repo profiling，并用 dirty input 失效避免明显陈旧。 | 验证 cache key/input 集合完整性、并发/跨 worktree 行为与缓存 miss 的 fallback；当前 parity test 不证明这些运行时情形。 |
| skill-local prompts + agent-native lens | 减少对宿主 typed agents 的耦合，并把 AI/agent product 的 parity 纳入方案。 | 在无 dispatch 授权、无 subagent 或工具缺失环境中，确认 inline fallback/降级不会被静默跳过；当前 source 不再保留 master 的明确授权门。 |
| 删除专项治理包 | package 更少旧 reference、模板和 fixture 负担，主路径围绕当前 unified contract 收敛。 | 若项目仍需要 enterprise trigger、Direct Evidence、reuse/extend/new 或 `spec_id` 的可审计保证，应先决定这些能力的新 owner 与测试方式，不能假设 specialist prompt 已替代。 |

## 二次深审使用的历史方案与完成证据

本轮没有只看 `master` 最终文件，而是回看“为什么当时要优化、后来如何收口、哪些验证真正完成”。这能区分仍然有效的能力意图与已经被当前架构替代的旧实现形态。

| 历史方案 / validation | 已完成的核心价值 | 对本轮的约束 | 本轮采用方式 | 证据限制 |
| --- | --- | --- | --- | --- |
| `docs/plans/2026-06-11-001-refactor-spec-plan-decision-surface-coverage-plan.md` | 在单一 canonical plan 首屏提供面向人的 Decision Brief，同时保留下游证据与实施细节 | 首屏不能复制下方 KTD、风险、验证和 units；目标是降低 first-pass 判断成本，不是增加第二套真相 | 复用当前已有 `Goal Capsule`，在 format-independent `plan-sections.md` 补 recommended approach、decision focus、verification focus、largest risk/boundary；HTML 增 compact panel，Markdown 保留共享 top-loaded renderer | 历史实现基于 Markdown-only + Decision Brief；本轮只继承决策表面目标，不继承旧 heading/sidecar 形态 |
| `docs/plans/2026-06-11-003-refactor-spec-plan-plan-mode-hardening-plan.md` | 将 plan-only 与 blocking handoff 上移热路径，并诚实区分 best-effort prose 与宿主硬 gate | 不得把提示词纪律写成硬防写保证；写完 plan 不自动进入实现 | 新增 `Planning-Only Safety Contract`，明确 planning-only effect、handoff blocking、Plan Mode/等价 gate 才能提供硬约束 | 本轮不实现新的 host hook、marker、TTL 或 mutation guard |
| `docs/plans/2026-06-11-004-refactor-spec-plan-skill-slimming-plan.md` + governance ablation/slimming validation | 用 progressive disclosure 把治理细节移出 spine，保留 capability-binding 指针 | 不把 evidence、risk、reuse 细节重新塞回 844 行主干；每项要有明确 owner reference | 主干只增加两个 STOP 指针/热路径检查；细节进入 `planning-evidence-boundaries.md`、`high-risk-plan-lens.md` 和既有 `deepening-workflow.md` | 当前主 `SKILL.md` 已因 unified lifecycle 增长，尚未重做新一轮 token ablation |
| `docs/plans/2026-06-12-005-refactor-spec-plan-surface-coverage-lens-plan.md` + U1 gate record | 条件化、可省略、derived-list 的 multi-surface lens；不新增固定矩阵或 specialist | 只列目标 repo/product 实际存在且被考虑的 surface；每项为 in/out/deferred，irrelevant 省略 | 继续 enrich `System-Wide Impact`，扩展 client、backend/service、contract、data、ops/rollout、test、agent/tool surface | 历史 U1 结果仍是 `gate-not-met`，后来依赖用户 override 落地；本轮不追溯声称 gate passed，当前用户的再次明确集成请求是新的 scope authority |
| `docs/plans/2026-06-22-004-refactor-spec-plan-skill-quality-plan.md` + fresh-source validation | trigger/near-neighbor/failure/output-quality fixtures、explicit dispatch authorization、inline fallback、projection/source-ref 边界 | fixture 只能证明结构，必须保留 `missing_evidence`；无授权不能派发 subagent | 恢复小型 `evals/`，覆盖当前 unified/HTML/cache/approach/deepening 分支；恢复 `dispatch_authorization_missing` 与 inline/serial fallback | 本轮没有 subagent 授权，因此 fresh-source helper eval 为 `not_run`，不能沿用历史 reviewer pass 证明当前新文案 |
| `docs/plans/2026-06-28-004-refactor-spec-plan-enterprise-architect-upgrade-plan.md` | enterprise/high-risk trigger matrix、显式 trade-off/privacy/data consistency、existing-capability inventory、`reuse / extend / new` lens、轻量反例 | 语义充分性由 LLM 判断；脚本只验证文件、锚点、fixture shape；轻量任务不得膨胀 | 新增较窄的 high-risk reference；ownership/composition lens 合并进 evidence reference；进一步扩展为 `reuse / extend / compose / new` prompt posture 与薄胶水边界 | 没有恢复固定 enterprise appendix、组织政策、专用 runner 或自动语义判定 |

### 历史方案之间的组合关系

这些方案不是六个平行功能，而是三层质量栈：

1. **首屏与执行边界层**：Decision Brief/Goal Capsule + planning-only + blocking handoff，解决“人能否快速判断”和“计划是否越权执行”。
2. **方案充分性层**：evidence、ownership/composition、surface coverage、high-risk readiness，解决“方案有没有漏掉承重事实、owner、复用/组合 seam、端面和失败路径”。
3. **演化可验证层**：progressive disclosure、eval fixtures、projection/source-ref tests、fresh-source evidence，解决“skill 演化后这些能力会不会静默丢失”。

本轮集成也按这三层落点，而不是把旧 `master` 的文件树原样搬回。

## 方案内容、模块与结构的深度对比

| 层次 | `master` 的结构 | 当前分支集成前结构 | 本轮集成后的结构 | 判断 |
| --- | --- | --- | --- | --- |
| 入口热路径 | 462 行 spine；Purpose、Plan-Only、Workflow Summary、三个 mandatory references、Phase 0 委托 | 821 行 spine；unified lifecycle、格式选择、scope/bootstrap/research/deepening/handoff 大量内联 | 845 行 spine；只增加 planning-only、两个 triggered-reference 指针、dispatch fallback、`Inventory before invention` 和 final audit anchors | 保留当前可见 lifecycle，避免把旧 planning-flow 整体复活；composition 细节继续 reference-resident |
| 输入 authority | requirements/PRD/brainstorm 多 origin，`spec_id` 与 receipt/trace metadata | Product Contract 是 authority；requirements-only unified plan 原地 enrichment；PRD legacy compatible | 不变；evidence reference 明确 user → Product Contract → current source → advisory docs/history/provider 的 authority order | 当前统一工件更适合减少 artifact entropy；无需恢复全局 `spec_id` |
| 首屏内容 | Summary + material Decision Brief，回答 what/why/validation/risk | Goal Capsule 仅强调 objective/authority/stop/execution/tail | Goal Capsule 增 recommended approach、decision focus、verification focus、largest risk/boundary；format-independent section contract 负责内容，Markdown 共享 renderer 只保证 top-loaded，HTML 提供 compact panel | 将历史人类可读优势映射到当前稳定 section/anchor，不新增平行 Decision Brief，也不破坏三 skill Markdown renderer parity |
| Planning Contract 内容 | KTD、Direct Evidence、reuse/enterprise/surface 附加结构 | KTD、HTD、assumptions、constraints、sequencing、research | 增 evidence limitations、architecture posture、composition/source ownership decision、conditional system-wide surface coverage 与 high-risk landing | 用 conditional subsection/KTD/unit 字段承接，不恢复固定大型模板 |
| Evidence | `governance-boundaries.md` + Direct Evidence Readiness/Direct Evidence + provider trust | source refs / Sources & Research 分散存在；缺少统一 load-bearing disclosure contract | `planning-evidence-boundaries.md` 统一 source/runtime、advisory re-grounding、cross-repo owner、dirty/freshness/limitation 与 plan impact | 恢复可信度，但从必填 inventory 改为“证据实际改变决策时才落地” |
| Existing capability / composition | 独立 `reuse-analysis.md`，新 surface 必须 reuse/extend/new；planning-flow 与历史方案强调新增前盘点、复用 specialist/owner | 第一轮集成后已有 durable surface ownership，但普通 abstraction/adapter/orchestrator/pipeline 仍无 compose posture 或 glue boundary | lens 与 evidence boundary 合并；扩展到 abstraction、adapter/wrapper、orchestrator、integration seam/pipeline，采用 reuse/extend/compose/new，并定义 thin glue owns/does-not-own 与 work-phase recheck | 不新增大型 reuse reference；把思想扩展到 spine、synthesis、deepening 和两个现有 specialist prompt |
| 高风险 | `enterprise-plan-review.md`，10 类 trigger、hard gates、可选 appendix、specialist mapping | 深度评分 + security/data/deployment/performance prompts，缺少统一最小问题集 | `high-risk-plan-lens.md` 覆盖 money、auth、privacy、scale、async、scheduled job、state machine、migration、data/ML、rollout | 恢复“计划必须回答什么”；不恢复“每份计划填 appendix” |
| Multi-surface | 条件化 enrich `System-Wide Impact`，in/out/deferred derived list | `System-Wide Impact` 仍在，但枚举约束变弱 | 主 quality bar、section contract、deepening audit 三处一致恢复 client/service/contract/data/ops/test/agent-tool coverage | breadth 由 orchestrator/plan structure 守护，depth 仍由 specialist/LLM 判断 |
| Research dispatch | 需要 capability + per-run authorization；否则 inline sequential | generic skill-local prompts，可并行，但授权边界不显式 | 主 research、Slack、external、flow analysis、deepening 均恢复授权门和 inline/serial fallback | 直接调用 workflow 不等于授权 subagent、persona、并行、web/Slack 外部访问 |
| 输出格式 | Markdown canonical，HTML sidecar | Markdown/HTML exclusive；HTML 有 visible metadata/anchors，但 doc-review skip | 保持当前 exclusive format；两种 rendering 同步 Goal Capsule 首屏字段 | 不引入双 artifact drift；HTML read-only review gap 保留为后续能力 |
| Handoff | 静态菜单含 work/task-pack/Issue/Proof/Done | readiness/capability 驱动，`spec-work` 推荐，goal 作为替代 tail | 不变 | 当前 ownership 更清楚，不应因回补质量 lens 而回滚 handoff |
| Evals | 17 route cases + output-quality fixtures，历史上进入 runtime projection | eval package 删除；当前 plugin 明确 maintainer eval source-only | 恢复 14 个 route/boundary/failure cases 与 14 个 output-quality cases；仍 source-only | 新增 composition 的正反 case，但不照搬旧 runtime-copy 行为或把 fixture 当模型证据 |
| 宿主投影 | 历史重点验证 Claude/Codex | 当前支持 Claude、Codex、Cursor、Kiro、Qoder | 新 contract test 对五宿主验证两个新 references 和 nested agent asset 会投影，`evals/` 不投影 | 以 `getSupportedPlatforms()` 为准，避免只恢复双宿主假设 |

## 当前分支应补充的能力：保留当前架构，不直接回滚 `master`

### 判断原则

建议回补的是 master 中仍有明确 consumer、能提升可信规划、且尚未被当前统一工件以等价机制覆盖的能力；不建议把旧的模板、状态或重型 appendix 原样搬回。每项都应遵守以下边界：

- **LLM 判断语义充分性**：风险是否适用、已有能力能否复用、证据是否足以支撑一个决策；
- **脚本只准备或校验确定性事实**：路径存在、source/runtime 分类、引用完整性、frontmatter/heading 形状、hash 与测试结果；
- **source-first**：任何新增 rule/reference/test 修改 `skills/spec-plan/**` 或 `tests/**`，不手改 host runtime mirror；
- **轻 contract**：优先放入当前的 `Product Contract` / `Planning Contract` / `Verification Contract`，不要恢复一个要求所有计划填满的巨型模板；
- **gate exits，不 gate thinking**：只有“能否声称 implementation-ready / 是否允许 handoff”使用可回源事实；不让脚本裁决架构、风险或产品取舍。

### 建议优先级

| 优先级 | 建议补充的能力 | 应从 master 继承什么 | 在当前结构中的最小落点 | 预期收益 | 不应做什么 |
| --- | --- | --- | --- | --- | --- |
| P0 | Evidence / source-runtime 边界 | `governance-boundaries.md` 的 runtime mirror exclusion、provider advisory、source-first、summary-first intake | 新增一个按条件读取的轻量 `references/planning-evidence-boundaries.md`；在 Phase 0.2/1.1 对跨 repo、外部 provider、generated runtime 或 advisory graph 触发它；在 `Planning Contract` 增加仅在证据影响方案时出现的 `### Evidence & Limitations` | 避免 runtime mirror、陈旧 graph 或学习笔记被当作 plan truth；让 reviewer 知道结论的 source refs、freshness 与 limitation | 不恢复全量 context ledger 或强制每个轻量计划写 Direct Evidence 长表 |
| P0 | 高风险决策 lens | `enterprise-plan-review.md` 的 trigger→必要决策：payment/permission/privacy/migration/async/rollout 的 invariant、idempotency、final failure、rollback、verification | 新增 `references/high-risk-plan-lens.md`，只在当前高风险信号命中时由 Phase 0.6 / 5.1 / 5.3 读取；要求把缺口落到 KTD、Risks、Verification、Open Questions 或明确 deferment | 使当前 generic risk score 重新获得可审查的“计划至少回答什么”，而非只依赖 specialist 是否被挑中 | 不恢复所有 enterprise appendix，更不能让 trigger 脚本自动判定语义合格或把每个高风险计划强制 Deep |
| P1 | capability inventory、composition 与 ownership 决策 | `reuse-analysis.md` 的 existing capability / `reuse / extend / new`、历史方案的 specialist/owner 复用、当前 agent-native primitive composition 思想 | 在 `planning-evidence-boundaries.md` 内扩展为 `reuse / extend / compose / new`；触发 abstraction、adapter/wrapper、orchestrator、integration seam/pipeline 或 durable surface；由 synthesis/deepening/architecture/pattern prompts 共同承载 | 防止在已有 owner 上旁路新建第二事实源，也防止用无价值 wrapper/平行 pipeline 伪装复用；同时保护职责冲突时的 justified new boundary | 不要求普通 bug、文案、已有文件小改写 reuse matrix；不把 composition 变成绝对偏好，也不让脚本替 LLM 选择架构 |
| P1 | 显式 dispatch 授权与 inline fallback | `planning-flow.md` 的 `dispatch_authorization_missing`、无 capability / 无授权时 inline sequential fallback | 恢复到 Phase 1.1、1.3、1.5 与 `deepening-workflow.md` 5.3.6：generic subagent 只能在用户或上游 handoff 已授权时启动；否则仍执行同一 research intent，但在当前 agent inline/serial 完成并记录降级 | 使 skill package 自身跨宿主可移植，不只依赖本仓库根级 AGENTS 来阻止未授权 dispatch | 不把“调用 `spec-plan`”解释成对子 agent、外部检索、并行的隐含授权；也不因无 subagent 而停止生成计划 |
| P1 | 可回归的行为覆盖 | master 的 examples/output-quality 思路、enterprise/governance contract tests 的保护范围 | 不恢复 630 行静态样例原样；建立小的 route/contract fixture matrix，覆盖 unified enrich、legacy、PRD compatibility、answer-seeking、approach altitude、HTML review skip、cache miss、无 dispatch、高风险 lens、新 surface ownership | 防止 prompt 精简或 source 拆分再次静默删除关键分支；让调整有最小 regression floor | 不把静态文本断言说成 LLM 质量或 host loader 证明；需要另有 fresh-source/host scenario evidence |
| P2 | HTML 审阅的诚实等价路径 | master 的“plan 变更后须复审”意图 | 不在 `spec-plan` 内手写 HTML mutation；先为 `spec-doc-review` 提供 read-only HTML structural/semantic review，或在未具备前保留当前显式 skip + limitation | 减少 HTML 作为一等输出却无法获得任何审阅的证据空洞 | 不把 Markdown mutator 套到 HTML，也不把 skip 伪装成 review passed |

### 三项 P0/P1 建议的具体 contract 形状

#### A. `Evidence & Limitations`：替代旧版固定 Direct Evidence 大段落

当前 unified artifact 不需要恢复 `## Direct Evidence Readiness` 与 `## Direct Evidence` 两个顶层 section。更小且兼容当前结构的做法是：当 source/repo/provider evidence 实际改变 KTD、scope、risk 或 verification 时，在 `## Planning Contract` 下加入：

```markdown
### Evidence & Limitations

- **Direct source refs:** `src/...`, `docs/contracts/...`; observed at `<revision>`.
- **Advisory inputs:** `<provider or learning>`; treated as advisory, then re-grounded in `<source ref>`.
- **Freshness / limitation:** `<what was not re-read, unavailable, or outside target repo>`.
- **Plan impact:** `<which KTD, unit, risk, or verification item this evidence changes>`.
```

这是披露 contract，而不是 completeness score。脚本可验证路径、revision 格式、generated runtime 是否被错误引用；LLM 仍必须判断证据是否足以支持某项方案。对没有影响决策的普通小改动，该 section 应省略。

#### B. `high-risk-plan-lens`：恢复必要决策，不恢复重型模板

建议在当前已经存在的 high-risk signal 后增加下表所示的语义问题；它们必须有明确落点，但可以因证据不足成为 Open Question 或 Deferred，而非伪造完成：

| 触发域 | 计划必须说明的最小内容 | 可落点 |
| --- | --- | --- |
| payment / irreversible write | invariant、idempotency 边界、audit/failure、compensation 或 rollback | KTD、Risks、Verification |
| auth / permission / privacy | actor、enforcement point、denial behavior、data flow/minimization/retention | Product Contract、KTD、Verification |
| migration / backfill / cache consistency | migration sequence、compatibility window、rollback、verification query 或 owner-visible check | Unit、Risks、Verification |
| async / webhook / scheduled job | contract、dedupe/idempotency、retry、final failure/manual recovery、ordering assumption | KTD、System-Wide Impact、Unit |
| rollout / external integration | gate/flag、observable success/failure、rollback trigger、owner | Risks、Operational Notes、Definition of Done |

这个 lens 应要求 planner 在 missing information 时停止过度确定：要么问用户、要么标为 assumption、要么放进 Open Questions，并不得把 `implementation-ready` 建立在 launch-blocking unanswered question 上。它不能由脚本根据关键词自动给出“已满足”的结论。

#### C. `capability-composition-ownership lens`：让 reuse 成为 prompt 思想，而不是 source 字段

适用时每个新 abstraction、integration seam 或 durable source surface 只需一条架构姿态记录：

```markdown
**Architecture posture — `<capability or seam>`:**
`reuse | extend | compose / thin-glue | new`; existing capabilities/owners:
`<paths or contracts>`; chosen source-of-truth or extension point: `<path>`;
glue ownership and failure/evidence boundary when composing; rejected owner or
composition shape and boundary reason when new; implementation must recheck
current source before writing and report any material deviation.
```

该规则能把当前 `source-first`、runtime projection、durable ownership 与“胶水层只做组合、不复制业务真相”的原则真正落到计划中，而不强制每个计划重复 master 的 `Existing Capability / Reuse Analysis` appendix。普通已有文件小改仍然省略；只有 material architecture fork 才需要写入 KTD 或受影响 unit。

### 不建议回补的 master 机制

| 不建议直接恢复 | 原因 | 当前的保留/替代方式 |
| --- | --- | --- |
| Markdown-only canonical + HTML sidecar | 与当前 exclusive output、HTML visible metadata/anchor 的契约冲突，会重新制造双 artifact 一致性问题。 | 保持二选一输出；优先补 HTML read-only review 与 consumer scenario 验证。 |
| 全局 `spec_id` 作为必要 metadata | unified artifact 已在同一文件承载 Product Contract 与 HOW；无条件恢复会制造重复 identity。 | 维持 R/A/F/AE/U IDs、`origin`、`product_contract_source`；仅在跨 artifact consumer 的真实缺口被证实后再设计窄 identity contract。 |
| 每个高风险计划的固定 enterprise appendix | 会把轻量计划器变成刚性表单，且违反当前 project 的 light contract 原则。 | 仅在高风险 lens 命中时要求语义落点；appendix 仍是可选的可读性工具。 |
| 最终菜单默认 task-pack 编译 | 当前 `spec-work` 已拥有 engine selection 和 shipping tail，默认再分叉会模糊 owner。 | 保持 task pack 是可选的 `spec-write-tasks` side path；只有复杂度/rollback/context 证据表明有价值时才显式推荐。 |
| Proof 双向同步作为默认路径 | 会引入 local/proof stale 状态、pull、再审阅和冲突处理；当前 one-way publish 的 canonical boundary 更清楚。 | 保持 one-way publish；若未来要双向，另建具有原子同步、revision/review re-run 证据的独立 contract。 |
| 原 master 大型 eval fixture 的原样复制 | 大量文本样例的存在不等于执行质量；原样回填会增加维护面却未必覆盖当前 unified/HTML/goal 分支。 | 新建小而明确的 route matrix + fresh-source scenario + host capability evidence，按风险升级。 |

### 最小落地顺序与验证

1. **U1 — evidence boundary**：增加条件 reference 与 `Evidence & Limitations` 内容规则；对 generated runtime、provider-untrusted、cross-repo、普通 local 四个 fixture 做 source contract test。
2. **U2 — high-risk lens**：增加五类风险的最小问题与落点规则；每类用一个 plan fixture 验证“有明确决定”和“信息不足时进入 Open Question”两条路径。
3. **U3 — dispatch fallback**：恢复授权检查和 inline/serial fallback；在有/无 dispatch authorization、无 subagent capability 三个宿主条件下验证不会静默派发或停止计划。
4. **U4 — capability/composition/ownership lens 与行为矩阵**：为“已有 owner 直接扩展”“两个 capability 通过薄胶水组合”“职责冲突时创建新 boundary”“普通已有-file 修改”分别建立 fixture；确认架构姿态是语义判断而非固定复用偏好，且普通小改不膨胀。
5. **U5 — HTML review feasibility spike**：在 `spec-doc-review` 做只读 HTML scenario；若无法证明不会破坏 artifact，就维持明确 skip，而不是在 `spec-plan` 内伪造 review gate。

每个 U 的完成证据应区分：source contract/unit test（confirmed mechanical fact）、fresh-source review（advisory semantic judgment）、真实宿主 invocation（loader/behavior evidence）。在得到最后一类之前，README/Changelog 不应声称 host behavior 或 quality outcome 已被证明。

## 本轮实际集成结果

### Source ownership 与 write gate

- Canonical owner：`skills/spec-plan/`。
- Operation：`revise + apply`；没有新建 workflow、agent、runner、schema 或 runtime writer。
- 初始精确 write-set：10 个 canonical source 文件，其中 5 个修改、5 个新增；preview 为 `pass`，binding SHA-256 为 `22de9bc6973a3e574ce6bc5f33c87d36e57bb59f63c9d4202e699711361667f0`，写后 receipt 为 `completion_claim_allowed: true`。
- 完整 unit suite 随后发现 `markdown-rendering.md` 是 `spec-plan/spec-brainstorm/spec-ideate` 的共享字节一致 contract；本轮不应把 plan-only 字段写进共享 renderer。修复使用第二个精确 preview，binding SHA-256 为 `fd2f4ffefbc9a959229c3d142ffce17868d3df36379182310b8f91c35ba64691`，写后 receipt 同样为 `completion_claim_allowed: true`。
- 最终对齐 `plan-sections.md`、spine 与 deepening 的 multi-surface 分类使用第三个精确 preview，binding SHA-256 为 `35f07860bdac68aa2c5a3725a8c7ac9a2bf4f9ec953938f19953222c6c78f118`，写后 receipt 为 `completion_claim_allowed: true`。
- 最终 canonical diff 为 9 个 skill source path：4 个修改、5 个新增；`skills/spec-plan/references/markdown-rendering.md` 最终恢复为原字节内容。
- 本次 composition-first 纠偏使用第四个精确 preview，canonical write-set 为 8 个既有 `skills/spec-plan/**` 文件，binding SHA-256 为 `06651037de3e82eba05cc552077db9bee3afa4aa85d9b8859b1273430bfe8b3b`；写后 8 个 after hash 全部匹配，receipt 为 `completion_claim_allowed: true`。
- 第一轮 preview 记录的用户 dirty paths 为 `CHANGELOG.md` 与本报告；本次 preview 重新记录了当前全部相关 dirty overlap，并对将继续修改的 `SKILL.md`、`plan-sections.md`、`deepening-workflow.md`、`planning-evidence-boundaries.md`、`output-quality-cases.json` 逐项绑定 current hash、replace disposition 与既有用户授权。
- Generated runtime：未手改、未运行 `spec-first init`；`.claude/`、`.codex/`、`.agents/skills/`、`.cursor/`、`.kiro/`、`.qoder/` 仍由后续显式 regeneration owner 处理。

### Canonical source 变更清单

| 文件 | 变更 | 恢复/新增的能力 | 为什么由它承载 |
| --- | --- | --- | --- |
| `skills/spec-plan/SKILL.md` | 修改 | description/near-neighbor、Planning-Only Safety、Goal Capsule quality bar、evidence/high-risk STOP、dispatch authorization/fallback、`Inventory before invention` 与 final audit anchors | spine 只保留必须高显著性的触发、边界和 final check；详细 composition rubric 不内联 |
| `skills/spec-plan/references/planning-evidence-boundaries.md` | 新增后继续扩展 | authority/intake order、source/runtime、provider advisory、cross-repo owner、Evidence & Limitations、existing capability inventory、`reuse / extend / compose / new`、thin-glue ownership/anti-pattern、degraded behavior | evidence trust、capability authority、composition seam 与 source ownership 都围绕“什么保持 durable truth”，合并可减少 reference 跳转；不混入 high-risk |
| `skills/spec-plan/references/high-risk-plan-lens.md` | 新增 | 10 类 high-risk trigger、required landing、blocking readiness、trade-off/privacy/migration/verification review、specialist reuse | 高风险问题集独立、按条件加载，避免污染普通 plan 热路径 |
| `skills/spec-plan/references/plan-sections.md` | 修改 | Goal Capsule 首屏字段、Planning Contract architecture posture/ownership/evidence、conditional surface coverage、Evidence & Limitations、Existing Capability/Composition/Source Ownership | 这里是 format-independent 内容 contract，最适合定义 material decision 如何按需落盘，同时避免新增 mandatory schema |
| `skills/spec-plan/references/markdown-rendering.md` | 最终无 diff（验证中撤回候选改动） | 继续提供三 skill 共享的 top-loaded Goal Capsule renderer | plan-specific 字段由 `plan-sections.md` 承载；避免破坏 brainstorm/ideate renderer parity |
| `skills/spec-plan/references/html-rendering.md` | 修改 | compact orientation panel、anchor linking | 保持 HTML exclusive output 与当前 visible metadata/anchor 体系 |
| `skills/spec-plan/references/synthesis-summary.md` | 修改 | 用户确认面从“extend vs new”扩展为 reuse/extend/compose/new，但保持 scope/approach altitude | composition posture 可能是需要用户早期确认的方案 fork；详细 translation/retry/evidence 仍留在 plan body |
| `skills/spec-plan/references/deepening-workflow.md` | 修改 | evidence/ownership/surface/high-risk confidence gaps、composition seam、anti-wrapper/parallel-pipeline、wrong-owner reuse、dispatch fallback | deepening 负责在 plan 已形成后发现承重缺口，不重新定义主流程 |
| `skills/spec-plan/references/agents/architecture-strategist.md` | 修改 | composition-first decision ladder、thin-glue ownership、new-boundary escape hatch | 该 specialist 已拥有架构边界与 trade-off 判断；扩展现有 owner 比新增“胶水架构 agent”更合适 |
| `skills/spec-plan/references/agents/pattern-recognition-specialist.md` | 修改 | reuse/extension candidates、composition seams、unnecessary wrapper/parallel pipeline、forced reuse | 该 specialist 已拥有 pattern、duplication 与 boundary guidance；直接增强其 planning output |
| `skills/spec-plan/evals/README.md` | 新增 | fixture authority 与 proof limitation | 防止 maintainer fixtures 被误当 runtime/router/field evidence |
| `skills/spec-plan/evals/examples.json` | 新增 | 14 个 trigger/boundary/failure cases | 覆盖 unified enrich、direct invocation、answer-seeking、approach altitude、deepening、legacy PRD、HTML、cache miss、work route、plan-only、runtime boundary、dispatch、高风险、ownership |
| `skills/spec-plan/evals/output-quality-cases.json` | 新增后继续扩展 | 14 个 file-backed quality cases | 在首屏、evidence、高风险、ownership、multi-surface、lightweight 基础上，新增薄胶水组合、已有 owner 扩展、职责冲突时新 boundary 三个对立 case；每例保留 `missing_evidence` |

### 新增 deterministic regression floor

新增 `tests/unit/spec-plan-quality-contracts.test.js`，负责确认：

- plan-only 与 blocking handoff 位于主 skill 热路径；
- Goal Capsule 的主 source/section/HTML contract 一致，Markdown 继续满足共享 top-loaded renderer contract；
- evidence、source/runtime、ownership、surface、scheduled-job/high-risk anchor 存在；
- architecture posture 按 `reuse → extend → compose / thin-glue → new` 顺序存在，thin glue 的允许/禁止职责、anti-wrapper、parallel-pipeline 与 wrong-owner reuse 均有 prompt anchor；
- architecture/pattern specialist prompt 会输出 composition decision、reuse/extension candidates 与不必要 abstraction 风险；
- dispatch 需要显式授权，inline fallback 仍必须完成计划；
- eval case IDs（包括薄胶水组合、extend existing owner、justified new boundary）、source authority、`missing_evidence` 与 generated-runtime exclusion 形状正确；
- `getSupportedPlatforms()` 当前五宿主均会递归投影两个新 references 与 nested agent asset；
- maintainer-only `evals/` 不进入任何 host runtime projection。

这组测试只守 source contract 和 projection plan，不根据关键词宣称某份真实计划已经语义充分。

### 明确保留的当前分支能力

- `spec-unified-plan/v1` requirements-only → implementation-ready 原地 enrichment；
- Product Contract authority 与 R/A/F/AE/U IDs；
- Markdown/HTML exclusive output；
- Markdown lifecycle `status` 与 `artifact_readiness` 分离；
- `spec-work` 推荐 execution tail、goal capability 作为互斥替代；
- approach-altitude、answer-seeking、non-software universal planning；
- repo profile cache 与 skill-local generic prompt assets；
- agent-native action/context/tool/approval/shared-workspace planning lens；
- composition-first 架构姿态：existing capability inventory、reuse/extend、thin-glue composition、justified new boundary；
- dynamic handoff 与 HTML doc-review skip 的诚实 limitation。

### 明确未集成的 `master` 机制

- 不恢复 Markdown-only canonical 或 HTML sidecar；
- 不恢复全局 `spec_id`、origin receipt/context ledger 作为每份计划必填字段；
- 不恢复固定 `Direct Evidence Readiness` / `Direct Evidence` 顶层大段落；
- 不恢复固定 enterprise/API/migration/scheduled-job appendix；
- 不恢复默认 task-pack 菜单或 Proof 双向同步；
- 不恢复旧 `planning-flow.md` 381 行整体委托；
- 不恢复旧版 137/478 行 eval fixture 原文或其历史 runtime projection 行为；
- 不新增 high-risk specialist、surface-coverage specialist、composition/glue specialist、model telemetry 或 semantic runner。

### Script-owned facts 与 LLM-owned judgment

| Owner | 本轮允许做什么 | 本轮明确不做什么 |
| --- | --- | --- |
| Scripts/tests | 校验 JSON、路径、hash、snapshot、source/runtime projection、case IDs、source refs、host coverage、文件存在与文本 anchors | 判定某个业务风险是否适用、某个 ownership 选择是否正确、某份计划是否语义充分 |
| LLM/agent | 选择 applicable lens、判断证据能否支撑决策、决定 reuse/extend/compose/new、界定 glue ownership 与 failure semantics、解释 trade-off、识别 launch-blocking gap、right-size sections | 伪造 source read、测试通过、provider freshness、host loader 生效或 field outcome |

### 验证边界

- `fresh-source helper eval`：`not_run`，reason code 为 `dispatch_authorization_missing`；当前用户没有授权 subagent、persona、并行 research 或 delegated reviewer。
- 旧 `2026-06-23` fresh-source pass 只证明当时 source，不被用来证明本轮新增文案。
- 本轮 deterministic checks 能确认 source package、fixture shape 与 projection plan；未进行真实 Claude/Codex/Cursor/Kiro/Qoder session invocation，因此 host behavior/loader outcome 仍是未验证项。
- 三个 composition quality case 是 source-owned expectation，不是模型执行记录；本轮只能确认 prompt/eval/test coverage，不能声称真实计划已稳定减少 wrapper 或平行 pipeline。
- HTML 的 `spec-doc-review` read-only/semantic review 能力未在本轮实现，当前显式 skip 仍是诚实 degraded path。

### 已执行验证

| 验证 | 最终结果 | 能证明什么 |
| --- | --- | --- |
| `validate-authoring-preview.cjs` 初始 write-set + renderer repair + surface harmonization + composition-first follow-up | 四次 `pass`；四次 receipt 均允许 completion claim | canonical root、hash/snapshot、dirty overlap、exact path set 与 after hash 一致 |
| `validate-skill.cjs skills/spec-plan --json` | `pass`；唯一 warning 为保留 target-owned `argument-hint` | package path/frontmatter/basic structure 合法 |
| 聚焦 Jest：`spec-plan-contracts`、`spec-plan-quality-contracts`、`repo-profile-cache-parity`、`plugin-modules` | 4 suites / 26 tests passed | unified lifecycle 未回归，composition prompt anchors、新质量 contract、cache parity、五宿主 projection/source-only eval 边界成立 |
| `npm run test:eval-fixtures -- --silent --no-cache` | 6 suites / 76 tests passed | repo 级 active fixture/source-ref/replay contract 仍一致 |
| `npm run test:unit -- --runInBand --silent` | 102 suites / 931 tests passed | 最终工作树 unit regression floor 通过 |
| `npm run lint:skill-entrypoints` | 303 files scanned，passed | public/internal skill entrypoint 治理未漂移 |
| `npm run typecheck` | 179 files checked，passed | CLI/关键脚本语法地板通过 |
| JSON parse + `git diff --check` + untracked file diff checks | passed | 新 fixture/manifest 可解析且 tracked/untracked 文本无 whitespace error |

完整 unit suite 的第一次运行曾发现 `requirements-rendering-parity.test.js` 失败：plan-only Goal Capsule 字段被误放进三 skill 共享 Markdown renderer。该 finding 通过第二个 authoring preview 撤回，最终 renderer byte parity 与全量 unit suite 均通过。第一轮与本次 composition follow-up 的 eval-fixture 首跑都按预期发现 requirements-clarification current-source manifest 仍绑定写入前的 `spec-plan` hash；每次都只刷新当前 source hash，并明确历史 2026-07-12 unit replay 未重跑、hash refresh 不构成新的 replay 或模型行为 evidence。

## 建议的后续核验顺序

1. 为 Markdown 和 HTML 各构造 requirements-only → implementation-ready → handoff 的受控 fixture，确认 `spec-work`、`/goal` 和 `spec-doc-review` 的真实 consumer 行为与 source 宣称一致。
2. 对高风险（权限、数据迁移、异步/rollout）以及 reuse/extend/compose/new 四类 architecture posture 建立 fresh-source 行为 eval，重点观察真实计划是否减少无价值 wrapper/平行 pipeline，同时仍能在职责冲突时选择新 boundary。
3. 在无 subagent、无 web、cache miss/dirty profile、HTML 输出等 degraded 情景下做 fresh-source/host capability 验证，并记录哪些结论是 source contract、哪些是实际 host outcome。

其中 evidence/high-risk/dispatch/ownership/composition/eval 的 source integration 已在本轮完成；真实 Markdown/HTML consumer replay、fresh-source behavior eval 与 HTML review feasibility 仍是后续验证范围。

## 证据索引

- Tree comparison：`git diff --find-renames master -- skills/spec-plan`、`git diff --check master -- skills/spec-plan`。
- Current primary workflow：`skills/spec-plan/SKILL.md` 的 Phase 0（输出模式、Product Contract、scope synthesis）、Phase 1（cache/agent-native/external research）和 Phase 5（confidence/handoff）。
- Integrated quality references：`skills/spec-plan/references/planning-evidence-boundaries.md`、`skills/spec-plan/references/high-risk-plan-lens.md`、`skills/spec-plan/references/deepening-workflow.md`、`skills/spec-plan/references/synthesis-summary.md`。
- Composition specialist prompts：`skills/spec-plan/references/agents/architecture-strategist.md`、`skills/spec-plan/references/agents/pattern-recognition-specialist.md`；现存 primitive composition 原则：`skills/spec-plan/references/agents/agent-native-planning-strategist.md`。
- Artifact contract：`skills/spec-plan/references/plan-sections.md`；format contract：`references/markdown-rendering.md`、`references/html-rendering.md`；handoff：`references/plan-handoff.md`。
- Maintainer fixtures：`skills/spec-plan/evals/{README.md,examples.json,output-quality-cases.json}`；focused test：`tests/unit/spec-plan-quality-contracts.test.js`。
- Removed master contracts：`master:skills/spec-plan/references/{governance-boundaries,reuse-analysis,enterprise-plan-review,planning-flow,plan-template}.md` 以及 `master:skills/spec-plan/evals/**`。
- Test-source comparison：`tests/unit/spec-plan-contracts.test.js`、`tests/unit/spec-plan-enterprise-contracts.test.js`、`tests/unit/spec-plan-governance-signals-contract.test.js`、`tests/unit/repo-profile-cache-parity.test.js`、`tests/unit/ce-upstream-skill-sync-contracts.test.js`。
- Historical completed plans：`docs/plans/2026-06-11-001-refactor-spec-plan-decision-surface-coverage-plan.md`、`2026-06-11-003-refactor-spec-plan-plan-mode-hardening-plan.md`、`2026-06-11-004-refactor-spec-plan-skill-slimming-plan.md`、`2026-06-12-005-refactor-spec-plan-surface-coverage-lens-plan.md`、`2026-06-22-004-refactor-spec-plan-skill-quality-plan.md`、`2026-06-28-004-refactor-spec-plan-enterprise-architect-upgrade-plan.md`。
- Historical validation：`docs/validation/spec-plan/fresh-source-eval-2026-06-23-skill-quality.md`、`governance-header-ablation-2026-06-11.md`、`governance-header-slimming-verification-2026-06-11.md`、`surface-coverage-lens-u1-gate-2026-06-13.md`。
