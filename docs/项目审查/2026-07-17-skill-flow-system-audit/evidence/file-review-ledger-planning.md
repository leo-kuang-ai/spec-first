# Planning-side Skill Flow 逐文件审查账本

## 审查边界

- 冻结范围：using-spec-first、spec-ideate、spec-brainstorm、spec-prd、spec-plan、spec-write-tasks、spec-doc-review、spec-strategy。
- 文件口径：每个 package 下的 SKILL.md 与 references/**，不含 scripts、evals、generated runtime。
- 审查方法：102 个文件逐个完整读取；按 producer -> handoff -> consumer 双向核对 route、artifact authority、failure/return/stop。
- 权威边界：skills/** 是 source-of-truth；.agents/skills/** 等 runtime mirror 不作为关系正确性的主证据。
- 判定词：正确表示 caller 与 consumer 契约能闭合；漂移候选表示存在直接源码反证；无跨 Skill 关系表示该文件仅服务 package 内部叶子职责。
- 跨分区收口修正：fresh-source S1 触发后又完成 35/35 package dispatch-authority 对账；`spec-ideate`、`spec-brainstorm` 等 package-local 路由虽正确，但 generic worker dispatch 未完整继承共享 authorization/fallback contract，统一见 SF-27 与 [edge-ledger.md §9](edge-ledger.md)。本修正只覆盖 dispatch authority，不推翻各行其他字段的逐文件理解。

## using-spec-first（3/3）

| 文件 | 文件职责 | Route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 判定 | 关键 source line |
| --- | --- | --- | --- | --- | --- | --- |
| skills/using-spec-first/SKILL.md | 顶层入口治理器，选择一个 public workflow、standalone skill、terminal command 或 Direct Lane 后让出控制。 | caller 是用户入口；consumer 是 public-route-map 选出的单一入口；不自动串联后续 workflow。 | 不创建 artifact；只提供语义路由。 | active workflow 直接续跑；低置信度至多问一个会改变路由的问题；选定后 yield。 | 正确 | skills/using-spec-first/SKILL.md:5-24 |
| skills/using-spec-first/references/conditional-routing-boundaries.md | 为 runtime、dispatch、handoff、knowledge promotion、parent workspace 提供条件边界。 | 被 using-spec-first 在命中特定副作用或 handoff 条件时按需读取；不直接调用业务 skill。 | 只约束授权与证据，不产生业务 artifact。 | 缺 dispatch 授权时降级；跨 workflow handoff 缺 summary/source refs/freshness/limitations 时不得宣称完成。 | 正确 | skills/using-spec-first/references/conditional-routing-boundaries.md:3-38 |
| skills/using-spec-first/references/public-route-map.md | 定义主链与 side path 的公共入口映射。 | ideate -> brainstorm；brownfield PRD -> prd；HOW -> plan；可选 task pack -> write-tasks；现有 requirements/plan/task doc -> doc-review；hands-off -> spec-lfg。 | 路由图不是 workflow state，也不授权 mutation。 | 一次只选一个入口；明确禁止自动执行 plan -> work -> review -> knowledge。 | 漂移候选：task document -> spec-doc-review 缺 consumer 分类；该文件使用规范名 spec-lfg，反证 brainstorm handoff 的 lfg 调用名。 | skills/using-spec-first/references/public-route-map.md:5-17,42-44 |

## spec-ideate（14/14）

| 文件 | 文件职责 | Route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 判定 | 关键 source line |
| --- | --- | --- | --- | --- | --- | --- |
| skills/spec-ideate/SKILL.md | 生成并评估有依据的方向，不产出 requirements、plan 或 code。 | 上游可读 STRATEGY.md；唯一产品深化 handoff 是 spec-brainstorm；明确禁止从 ideation 直跳 spec-plan。 | ideation deliverable 只对候选方向、basis、tradeoff、rejection summary 有权威，不是 Product Contract。 | 无足够 basis 的 idea 必须淘汰；用户未选 brainstorm 时停在 ideation。 | 正确；另有 output config 与 runtime-setup reserved 声明的外部漂移，由总报告裁决。 | skills/spec-ideate/SKILL.md:1-21,89,282-295 |
| skills/spec-ideate/references/agents/issue-intelligence-analyst.md | 从 issue 信号提取痛点、重复需求与可引用证据。 | spec-ideate 内部 grounding leaf；不拥有下游 handoff。 | 输出是 advisory dossier，不是 idea 或 requirement 权威。 | 无可靠 issue 证据时返回 limitations，不补造需求。 | 无跨 Skill 关系 | skills/spec-ideate/references/agents/issue-intelligence-analyst.md:1-12 |
| skills/spec-ideate/references/agents/learnings-researcher.md | 检索 docs/solutions 等既有学习，找可复用模式与失效条件。 | spec-ideate 内部 research leaf。 | 历史 learning 仅作 advisory grounding；当前 source 优先。 | 无相关 learning 时返回空结果；不得把旧结论当现状。 | 无跨 Skill 关系 | skills/spec-ideate/references/agents/learnings-researcher.md:1-14 |
| skills/spec-ideate/references/agents/repo-profiler.md | 生成 question-agnostic repo profile。 | 由 repo-profile-cache MISS 路径调用，供 ideate scouts 复用。 | profile 是缓存 orientation，不是 product scope 权威。 | 无 git / 无可写缓存时允许 NO-CACHE 与 inline fallback。 | 无跨 Skill 关系 | skills/spec-ideate/references/agents/repo-profiler.md:1-15 |
| skills/spec-ideate/references/agents/slack-researcher.md | 从 Slack 线索中提取可溯源的用户痛点与上下文。 | spec-ideate 内部可选 research leaf。 | Slack 证据是 advisory，必须带链接/时间/限制。 | 无权限或无结果时明确 degraded，不猜测。 | 无跨 Skill 关系 | skills/spec-ideate/references/agents/slack-researcher.md:1-14 |
| skills/spec-ideate/references/agents/web-researcher.md | 外部 web research，补充现状、先例和市场证据。 | spec-ideate 内部可选 research leaf。 | 外部事实带 provenance/freshness，不覆盖 repo/owner intent。 | 来源不足时返回 limitations；不得把摘要升级为 confirmed project fact。 | 无跨 Skill 关系 | skills/spec-ideate/references/agents/web-researcher.md:1-16 |
| skills/spec-ideate/references/divergent-ideation.md | 定义发散生成、axes、survivor selection 与去重方法。 | 被 spec-ideate 生成阶段读取；不直接 handoff。 | 只塑造 idea candidate set，最终 artifact 仍由 ideation-sections 定义。 | 缺 basis、重复、低杠杆候选被拒；少于目标数量时如实报告。 | 无跨 Skill 关系 | skills/spec-ideate/references/divergent-ideation.md:1-18 |
| skills/spec-ideate/references/html-rendering.md | 定义 ideation HTML-only artifact 的呈现与 agent-consumability。 | 由 spec-ideate 写 HTML 时读取；文件内却携带 plan-specific 的 spec-work/spec-doc-review/spec-plan handoff 描述。 | HTML 是该次 ideation 唯一 artifact；语义内容必须在可读 HTML 文本中。 | 格式审计不通过应重组 HTML；不得藏语义于 CSS/data metadata。 | 漂移候选：复制了 plan 的 downstream consumer 与 5.3.8 review 语义，不符合 ideate 实际 handoff。 | skills/spec-ideate/references/html-rendering.md:11-17,544-550 |
| skills/spec-ideate/references/ideation-sections.md | 定义 ideation 文件的 section contract、idea 字段、basis 与 rejection 结构。 | 被 post-ideation-workflow 写 artifact 时消费。 | 本文件是 ideation artifact 内容结构的 source；不授权 requirement/plan 语义。 | 缺 basis 或把 rejection 丢出 durable artifact 时不得 close。 | 无跨 Skill 关系 | skills/spec-ideate/references/ideation-sections.md:1-20 |
| skills/spec-ideate/references/markdown-rendering.md | 定义 Markdown ideation artifact 的格式规则。 | 仅由 spec-ideate Markdown write path 消费；Proof handoff 读取其产物。 | local markdown 文件 canonical；Proof 是单向副本。 | 不得同时生成 md/html 双 canonical。 | 正确 | skills/spec-ideate/references/markdown-rendering.md:1-18 |
| skills/spec-ideate/references/post-ideation-workflow.md | 写出 deliverable、展示摘要，并处理 Proof、brainstorm、refine、done。 | 对 spec-brainstorm 传 focused seed 而非整个文件；对 spec-proof 传已存在 md 的 source path/title/identity。 | 已保存 ideation file 是方向证据；brainstorm 重新建立 Product Contract。 | Proof 失败保留 local file；discard 只允许删除本次新建；不允许跳过 brainstorm 直达 plan。 | 正确 | skills/spec-ideate/references/post-ideation-workflow.md:80-117 |
| skills/spec-ideate/references/repo-profile-cache.md | 定义 repo profile 的 HIT/MISS/NO-CACHE 协议。 | 内部优化；profile 被 ideate research leaf 消费。 | 缓存内容是 orientation；fresh question-specific reads 仍负责具体结论。 | cache failure 降级，不得阻塞 ideation。 | 无跨 Skill 关系 | skills/spec-ideate/references/repo-profile-cache.md:1-20 |
| skills/spec-ideate/references/universal-ideation.md | 非软件 ideation 路径，自动保存方向文件并可 handoff universal brainstorm。 | 选中 idea 后调用 spec-brainstorm；文本声称 brainstorm 在此结束且无后续 plan 链。 | universal ideation 文件不是 software unified plan。 | 无 basis idea 淘汰；结束时保留文件或显式 discard。 | 漂移候选：与 universal-brainstorming 的可选 spec-plan handoff 表述冲突。 | skills/spec-ideate/references/universal-ideation.md:93-105 |
| skills/spec-ideate/references/web-research-cache.md | 定义 ideate 外部 research cache 的 key、freshness 与复用边界。 | 仅为 ideate web-researcher 降低重复检索。 | cache 永远是 advisory snapshot。 | stale/missing/shape mismatch 时重取或标 degraded。 | 无跨 Skill 关系 | skills/spec-ideate/references/web-research-cache.md:1-20 |

## spec-brainstorm（14/14）

| 文件 | 文件职责 | Route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 判定 | 关键 source line |
| --- | --- | --- | --- | --- | --- | --- |
| skills/spec-brainstorm/SKILL.md | 将已选方向澄清为 WHAT/WHY 与 requirements-only unified plan。 | 可接 ideate focused seed；读取 STRATEGY.md；software handoff 到 spec-plan/spec-doc-review/spec-lfg；named external verdict 可转 spec-pov。 | Product Contract 是 WHAT 权威；artifact_readiness=requirements-only，不能直接冒充 implementation-ready。 | Resolve Before Planning 未清空时不得提供 plan/LFG；non-software 路由 universal reference；verdict handoff 必须由用户接受。 | 正确主链；output config 与 runtime-setup reserved 声明另有外部漂移。 | skills/spec-brainstorm/SKILL.md:73-81,85-116,168,266-289 |
| skills/spec-brainstorm/references/agents/repo-profiler.md | 生成 brainstorm 所需的 agnostic repo profile。 | cache MISS 内部 leaf；结果供主 conversation 语义校准。 | profile 不拥有 Product Contract scope。 | 无缓存时可 inline；缺字段回源读取。 | 无跨 Skill 关系 | skills/spec-brainstorm/references/agents/repo-profiler.md:1-15 |
| skills/spec-brainstorm/references/agents/slack-researcher.md | 抽取 Slack 产品信号与引用。 | brainstorm grounding 的可选 leaf。 | advisory evidence，不能替代 owner decision。 | 不可访问时返回 degraded/empty。 | 无跨 Skill 关系 | skills/spec-brainstorm/references/agents/slack-researcher.md:1-14 |
| skills/spec-brainstorm/references/blindspot-pass.md | 在 synthesis 前检查遗漏的行为、边界和角色视角。 | brainstorm 内部质量 pass，不调用外部 workflow。 | 只可补充问题/assumption/non-goal，不可擅自定产品决策。 | 发现 load-bearing gap 时回到 owner question，不可静默写成 confirmed。 | 无跨 Skill 关系 | skills/spec-brainstorm/references/blindspot-pass.md:1-18 |
| skills/spec-brainstorm/references/brainstorm-sections.md | requirements-only unified plan 的 Product Contract section source。 | 被 Markdown/HTML renderer 与 spec-plan enrichment consumer 读取。 | 稳定 R/A/F/AE 与 scope/assumption/OQ 是 downstream planning 的产品权威。 | 无 durable decision 时可不写 doc；阻塞问题必须保留。 | 正确 | skills/spec-brainstorm/references/brainstorm-sections.md:1-24 |
| skills/spec-brainstorm/references/handoff.md | Phase 4 菜单与 spec-plan、spec-doc-review、LFG、Proof/browser 的 dispatch contract。 | spec-plan payload 为 artifact path 或精简决策，并可附 grounding dossier；LFG payload 为 requirements-only path；Proof 仅 md artifact。 | local unified plan 保持 canonical；downstream 不得从 closing summary 重建 scope。 | unresolved blockers 隐藏 plan/LFG；选择后必须实际 invoke；失败回菜单。 | 漂移候选：调用 lfg 而真实 skill 是 spec-lfg；仍把 HTML review 描述为不可用。 | skills/spec-brainstorm/references/handoff.md:56-103 |
| skills/spec-brainstorm/references/html-rendering.md | requirements-only unified plan 的 HTML 呈现规则。 | brainstorm HTML producer 使用；文件内复用了 plan 的 spec-work 与 5.3.8 consumer 文案。 | HTML 是该次 brainstorm 唯一 artifact，仍仅 requirements-only。 | post-compose audit 失败需重组；不能暗藏 machine mirror。 | 漂移候选：plan-specific consumer 文案泄漏，且 spec-doc-review HTML 能力已过时。 | skills/spec-brainstorm/references/html-rendering.md:11-17,544-550 |
| skills/spec-brainstorm/references/markdown-rendering.md | requirements-only unified plan Markdown 格式规则。 | 被 brainstorm producer 写 md；spec-plan/spec-doc-review/spec-proof 可消费。 | md local file canonical；只在 md 上携带 lifecycle status。 | 禁止同时把 HTML sibling 当 canonical。 | 正确 | skills/spec-brainstorm/references/markdown-rendering.md:1-18 |
| skills/spec-brainstorm/references/model-tiers.md | 定义 grounding/research leaf 的模型层级与降级。 | 仅影响 brainstorm 内部 dispatch 成本形状。 | 不改变 evidence authority。 | 无模型选择能力时继承 parent 并保留 read budget。 | 无跨 Skill 关系 | skills/spec-brainstorm/references/model-tiers.md:1-20 |
| skills/spec-brainstorm/references/product-pressure-test.md | 针对 product behavior 的 relevance-driven scenario pass。 | 在 Standard/Deep synthesis 前内部运行。 | 输出只能影响 AE/OQ/assumption/non-goal，不是独立 artifact。 | 维度不 material 时跳过；不能制造 implementation HOW。 | 无跨 Skill 关系 | skills/spec-brainstorm/references/product-pressure-test.md:1-20 |
| skills/spec-brainstorm/references/repo-profile-cache.md | brainstorm profile cache 协议。 | HIT 供主流程消费；MISS 调 repo-profiler。 | advisory orientation。 | cache unavailable 不阻塞，回源或 inline。 | 无跨 Skill 关系 | skills/spec-brainstorm/references/repo-profile-cache.md:1-20 |
| skills/spec-brainstorm/references/synthesis-summary.md | 定义 internal draft、chat scoping synthesis、Path A/B confirmation gate。 | 只控制 brainstorm 在写 Product Contract 前的确认。 | chat synthesis 不是 durable authority；最终 artifact 才是 handoff source。 | Standard/Deep 即使无提问也必须走 Path B；不得把 internal draft 直接贴给用户。 | 无跨 Skill 关系 | skills/spec-brainstorm/references/synthesis-summary.md:1-24 |
| skills/spec-brainstorm/references/universal-brainstorming.md | 非软件 brainstorm facilitator，可结束、保存 summary、Proof 或交 universal spec-plan。 | 明确提供 Create a plan -> spec-plan；Proof helper 分支未先产出 local md。 | chat summary 是主要输出，不得标 software unified-plan contract。 | 不强迫最终决定；选择 Done 可直接结束。 | 漂移候选：Proof caller 缺 source file；同时反证 universal-ideation 的“ends there”。 | skills/spec-brainstorm/references/universal-brainstorming.md:5-11,62-73 |
| skills/spec-brainstorm/references/verdict-routing.md | 把 named external adopt/switch verdict 交给 spec-pov。 | 用户接受后实际 invoke spec-pov，传 candidate、intent、links；拒绝则继续 brainstorm。 | session 只传 question/hypotheses，不把对话当 grounding。 | shape 不满足三条件时不路由；不得 silent switch。 | 正确；spec-pov intake 与此 payload 对齐。 | skills/spec-brainstorm/references/verdict-routing.md:1-22 |

## spec-prd（10/10）

| 文件 | 文件职责 | Route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 判定 | 关键 source line |
| --- | --- | --- | --- | --- | --- | --- |
| skills/spec-prd/SKILL.md | brownfield PRD create/refine/validate，关闭 WHAT/WHY 后供 planning 消费。 | 0-1/unsettled product shape -> spec-brainstorm；HOW -> spec-plan/spec-write-tasks；独立 critique -> spec-doc-review；PRD/Figma/source consistency -> spec-app-consistency-audit。 | docs/brainstorms/*-requirements.md 是 PRD-grade WHAT 权威；ready receipt 由 producer-local finalize/checker 提供。 | load-bearing 分支只可在四类合法 stop point 停；checkpoint 不得 handoff planning；validate 永远 report-only。 | 正确 | skills/spec-prd/SKILL.md:3-12,54-56,86-89,115 |
| skills/spec-prd/references/design-source-evidence.md | 规范 Figma/screenshot/design context 的 provider_untrusted 证据处理。 | 供 spec-prd intake 与 app-consistency route 判断；不直接调用设计 workflow。 | design refs 先是 source-candidate，不覆盖 owner/source contracts。 | unread/degraded 必须写 inventory 与 readiness consequence；validate 禁止 materialize。 | 无跨 Skill 关系 | skills/spec-prd/references/design-source-evidence.md:1-20 |
| skills/spec-prd/references/domain-language-and-decision-ledger.md | 管理 domain vocabulary、owner decisions 与 decision trace。 | 被 PRD grill 与 output template 消费；下游 plan 读取稳定术语。 | owner answer 与 source-backed term 才能成为 PRD-local authority。 | 冲突/未绑定 decision 进入 OQ，不得自动 promotion 到 project docs。 | 无跨 Skill 关系 | skills/spec-prd/references/domain-language-and-decision-ledger.md:1-20 |
| skills/spec-prd/references/evidence-and-topology.md | 约束 evidence 标签、source topology 与 current-state 表达。 | 为 PRD product analysis 和 readiness 提供共同证据语言。 | confirmed-source/user-stated 与 candidate/assumption 明确分层。 | 证据不足时降级，不得把 topology 推断写成事实。 | 无跨 Skill 关系 | skills/spec-prd/references/evidence-and-topology.md:1-20 |
| skills/spec-prd/references/grill-with-docs-integration.md | 将 source-first grill 结果绑定到具体 PRD write target。 | PRD 内部 clarification spine；不创建第二 artifact 或外部 workflow 状态。 | grill trace 支撑 PRD 字段，但 source/owner 仍是语义权威。 | 未达合法 stop point 继续问；headless/no reply 只能 checkpoint。 | 无跨 Skill 关系 | skills/spec-prd/references/grill-with-docs-integration.md:1-24 |
| skills/spec-prd/references/large-input-checkpoint.md | 大输入场景的可恢复 checkpoint 协议。 | 返回 spec-prd 后续 continuation，不直接交 spec-plan。 | checkpoint PRD 明确非 ready。 | context/size 无法闭合时写 next_owner_question 与 limitations；禁止伪 final。 | 无跨 Skill 关系 | skills/spec-prd/references/large-input-checkpoint.md:1-20 |
| skills/spec-prd/references/prd-output-template.md | 定义 PRD durable body、Decision Card、OQ、readiness self-check。 | 被 create/refine producer 写入；spec-plan/legacy consumer 读取。 | 本模板定义 PRD artifact 结构；machine receipt 字段不得由 LLM 自填。 | 缺关键 section/decision binding 时不能 final-prd。 | 正确 | skills/spec-prd/references/prd-output-template.md:1-24 |
| skills/spec-prd/references/prd-readiness-lens.md | 判定 planning 是否仍需发明 WHAT，并区分 final/checkpoint/validate。 | ready-for-planning 才可 handoff spec-plan；validate 只读。 | checker facts 与 LLM semantic readiness 分离。 | stale/missing receipt、blocking OQ、unmet owner decision 均阻断 planning claim。 | 正确 | skills/spec-prd/references/prd-readiness-lens.md:1-24 |
| skills/spec-prd/references/product-analysis-lite.md | Contract Reset Lite 的压缩分析形态。 | 仍服务同一 PRD write/readiness spine，不创建旁路 artifact。 | run-local brief 非 durable SoT。 | 风险无法排序或冲突无法压缩时升级 product-expert lens。 | 无跨 Skill 关系 | skills/spec-prd/references/product-analysis-lite.md:1-20 |
| skills/spec-prd/references/product-expert-lens.md | 排序 load-bearing product risk 与 owner questions。 | spec-prd 内部 semantic lens；结果绑定 PRD write target。 | reviewer judgment 不能替代 owner answer。 | 无法绑定 write target 的 gap 必须显式携带，不可丢弃。 | 无跨 Skill 关系 | skills/spec-prd/references/product-expert-lens.md:1-20 |

## spec-plan（29/29）

| 文件 | 文件职责 | Route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 判定 | 关键 source line |
| --- | --- | --- | --- | --- | --- | --- |
| skills/spec-plan/SKILL.md | 将 requirements-only Product Contract 或其他明确目标深化为 HOW 与 implementation-ready plan；也支持 universal/answer-seeking planning。 | 接受 spec-brainstorm path、legacy PRD、direct brief；WHAT 未定退回 brainstorm/PRD；software 输出交 spec-doc-review 后由用户选 spec-work/goal/issue/Proof/browser。 | Product Contract 保持上游 WHAT 权威；Planning Contract、U-IDs、Verification、DoD 由 spec-plan 追加；不实现 code。 | requirements-only 是 enrichment input；未知 WHAT 不可在 planning 发明；两格式都必须 headless doc-review；最后 handoff question 是 completion boundary。 | 正确主链；plan_output active consumer 与 runtime-setup reserved 声明另有外部漂移。 | skills/spec-plan/SKILL.md:18-29,119-126,690-696,796-812 |
| skills/spec-plan/references/agents/agent-native-planning-strategist.md | 检查 action/context parity、tool/workspace 生命周期与 agent-native 执行边界。 | spec-plan deep/high-risk internal reviewer；结果回写 KTD、risk、verification。 | reviewer 输出是 planning evidence，不独立改 Product Contract。 | 无 agent/tool surface 时不激活；发现 host capability gap 时写 limitation。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/agent-native-planning-strategist.md:1-14 |
| skills/spec-plan/references/agents/architecture-strategist.md | 审查现有架构边界、reuse/extend/compose/new posture 与系统影响。 | spec-plan internal research/review leaf。 | 架构建议需由当前 source 与 plan decision 支撑。 | 无证据时不得发明新抽象；冲突回主流程决策。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/architecture-strategist.md:1-14 |
| skills/spec-plan/references/agents/best-practices-researcher.md | 检索外部 best practices 并提取可引用建议。 | spec-plan external research leaf；主流程决定是否采用。 | 外部资料是 advisory，不能覆盖 repo patterns。 | 来源不新鲜或不适用时写 limitation。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/best-practices-researcher.md:1-16 |
| skills/spec-plan/references/agents/data-integrity-guardian.md | 检查数据约束、一致性、并发与失败恢复。 | 仅在 data-bearing plan 条件激活。 | findings 影响 KTD/risk/test scenario，不直接改 schema。 | 非数据变更跳过；未确认数据事实不得升格。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/data-integrity-guardian.md:1-14 |
| skills/spec-plan/references/agents/data-migration-reviewer.md | 针对 migration/backfill/schema transition 给出安全计划检查。 | spec-plan 条件 reviewer；可与 deployment verification 配合。 | migration facts 需引用具体 source/schema。 | 无 migration artifact/signal 时不激活；缺 rollback/order 时返回 finding。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/data-migration-reviewer.md:1-16 |
| skills/spec-plan/references/agents/deployment-verification-agent.md | 形成 deploy、rollback、monitoring 与验证清单。 | 高风险 migration/release planning 的 internal leaf。 | 清单是 plan verification input，不是 deploy evidence。 | 缺实际 rollout surface 时降级；不得声称部署已验证。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/deployment-verification-agent.md:1-18 |
| skills/spec-plan/references/agents/framework-docs-researcher.md | 查证当前 framework API、版本约束与官方做法。 | spec-plan external/source docs leaf。 | 官方 docs 可证明 API 事实，但是否采用由 planner 判断。 | 无法确认版本时带 limitation，不凭记忆断言。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/framework-docs-researcher.md:1-16 |
| skills/spec-plan/references/agents/git-history-analyzer.md | 从 git history 提取演化原因、先例与相关改动。 | spec-plan internal history leaf。 | history 是 decision context，不自动成为当前 contract。 | 无相关 history 返回空；不得从 commit message 推断 outcome。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/git-history-analyzer.md:1-12 |
| skills/spec-plan/references/agents/learnings-researcher.md | 检索 docs/solutions 中可复用经验、失败模式与 invalidation condition。 | spec-plan internal knowledge leaf。 | learning 是 scoped advisory；当前 source 优先。 | stale/不适用时不得写入 plan 决策。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/learnings-researcher.md:1-18 |
| skills/spec-plan/references/agents/pattern-recognition-specialist.md | 识别 repo 内既有实现模式与命名/结构惯例。 | spec-plan local pattern leaf。 | concrete source pattern 可作为 approach evidence。 | 只有一个样例或模式不一致时不得过度泛化。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/pattern-recognition-specialist.md:1-14 |
| skills/spec-plan/references/agents/performance-oracle.md | 评估性能预算、复杂度、查询/缓存/并发风险。 | performance-sensitive plan 的条件 reviewer。 | 性能判断需 baseline/目标/路径证据。 | 无 baseline 的理论担忧降为 limitation，不作为强 finding。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/performance-oracle.md:1-16 |
| skills/spec-plan/references/agents/repo-profiler.md | 生成可缓存的 agnostic repo profile。 | repo-profile-cache MISS 调用；供各 planning leaf 复用。 | profile 只做 orientation。 | NO-CACHE 不阻塞，回退 inline。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/repo-profiler.md:1-15 |
| skills/spec-plan/references/agents/repo-research-analyst.md | 对 plan 相关 source、tests、contracts 做深度 repo research。 | spec-plan 主要 local research leaf；结果经 synthesis 进入 plan。 | direct source quotes 比 provider graph/cache 更权威。 | scope 过宽时按 plan focus 收敛；找不到事实时明示。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/repo-research-analyst.md:1-18 |
| skills/spec-plan/references/agents/security-sentinel.md | 检查 auth、PII、secrets、trust boundary 与 abuse cases。 | security-relevant plan 条件 reviewer。 | finding 影响 requirement/KTD/test/rollout，不替代 code security review。 | 无具体 attack surface 时不激活；推测性风险不升级。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/security-sentinel.md:1-16 |
| skills/spec-plan/references/agents/slack-researcher.md | 从 Slack 查找历史讨论、用户反馈与约束。 | spec-plan optional external/internal comms research leaf。 | Slack 结论必须带 source/freshness；不是 repo truth。 | 不可访问时记录 degraded。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/slack-researcher.md:1-16 |
| skills/spec-plan/references/agents/spec-flow-analyzer.md | 检查 requirements、U-IDs、files、tests、verification 的端到端 trace。 | spec-plan internal cross-section reviewer。 | 只验证 plan 内部链路，不重写上游 Product Contract。 | trace gap 返回 planner；不得自行新增 product scope。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/spec-flow-analyzer.md:1-16 |
| skills/spec-plan/references/agents/web-researcher.md | 通用 web research leaf，补充 current landscape 与外部证据。 | spec-plan 在 local patterns 薄或 external decision load-bearing 时调用。 | external evidence 带 provenance/limitations。 | 资料不足时不得将推荐写成确定事实。 | 无跨 Skill 关系 | skills/spec-plan/references/agents/web-researcher.md:1-16 |
| skills/spec-plan/references/approach-altitude.md | 对“先研究如何做交付物”的请求生成 approach-plan，而非直接交付结果。 | spec-plan 内部早期分支；可适用于 software/knowledge-work，但不进入普通 implementation handoff。 | approach-plan 不是 implementation-ready unified plan。 | 写出 approach 与 terminal handoff 后停止，不可误入 Phase 5.4/spec-work。 | 正确 | skills/spec-plan/references/approach-altitude.md:1-20 |
| skills/spec-plan/references/deepening-workflow.md | 负责 confidence scoring、section gap、reviewer mapping 与 bounded synthesis。 | spec-plan Phase 5.3 条件子流程；完成后返回 plan-handoff。 | deepening 修改同一 plan，不创建第二 canonical artifact。 | 无 accepted finding 时可退出；scratch cleanup/limitations 必须报告。 | 无跨 Skill 关系 | skills/spec-plan/references/deepening-workflow.md:1-24 |
| skills/spec-plan/references/high-risk-plan-lens.md | 对高风险 plan 增加安全、迁移、rollout、cross-surface 检查。 | 被 spec-plan 风险分类按需读取。 | 是 semantic lens，不是 hard-coded risk verdict。 | 无相应风险面时不加载；发现 blocker 进入 plan/handoff。 | 无跨 Skill 关系 | skills/spec-plan/references/high-risk-plan-lens.md:1-20 |
| skills/spec-plan/references/html-rendering.md | 定义 implementation plan HTML-only 呈现与 agent-readable 结构。 | 当前实际 consumers 是 spec-work、human、report-only spec-doc-review；但本文件仍写旧的 Markdown-only review gate。 | HTML 是该 run 唯一 canonical artifact；visible text 是读取契约。 | post-compose audit 失败重组；不得把 HTML 当 Markdown patch。 | 漂移候选：与 SKILL 和 plan-handoff 的 mandatory two-format review 直接冲突。 | skills/spec-plan/references/html-rendering.md:11-17,549-555 |
| skills/spec-plan/references/markdown-rendering.md | 定义 implementation-ready Markdown plan 的表现与 lifecycle/frontmatter。 | plan producer 写 md；spec-doc-review 可 markdown-write；spec-work 读取。 | local md plan canonical。 | 不得产生双 canonical；格式审计失败需修复。 | 正确 | skills/spec-plan/references/markdown-rendering.md:1-20 |
| skills/spec-plan/references/plan-handoff.md | 运行两格式 headless spec-doc-review、HTML producer recompose、最终菜单与 spec-work/goal/Proof/browser/issue 分支。 | spec-doc-review 是 mandatory consumer；spec-work 仅 implementation-ready code；Proof 仅已有 md path；HTML browser 不触发 execution。 | plan 始终 canonical；doc-review report-only 不拥有 HTML mutation；spec-plan 可对唯一修正做 full recompose。 | 最多两次 HTML recompose review；P0/P1 或 incomplete 可降级为 requirements-only并隐藏 execution；选择后必须实际 route。 | 正确；反证 html-rendering 旧文案。 | skills/spec-plan/references/plan-handoff.md:5-18,40-48,80-100 |
| skills/spec-plan/references/plan-sections.md | unified implementation plan 的 section/content contract。 | spec-plan renderer、doc-review、spec-work、write-tasks 依赖这些稳定 headings/IDs。 | Product Contract 与 Planning Contract/Units/Verification/DoD 分层；prose 是权威。 | 缺 implementation-ready 必需 section 时不得 handoff work。 | 正确 | skills/spec-plan/references/plan-sections.md:1-24 |
| skills/spec-plan/references/planning-evidence-boundaries.md | 区分 direct source、provider advisory、history、external research 与 owner facts。 | 所有 planning research leaf 与 synthesis 共用。 | provider/cache 不得覆盖 source/owner；claim 只覆盖证据范围。 | freshness/limitations 缺失时降级，不得写 confirmed。 | 无跨 Skill 关系 | skills/spec-plan/references/planning-evidence-boundaries.md:1-24 |
| skills/spec-plan/references/repo-profile-cache.md | planning profile cache 协议。 | HIT 供主流程/leaf；MISS 调 repo-profiler。 | cache 是 optimization，不是 correctness dependency。 | cache failure -> no-profile/inline，不阻塞 planning。 | 无跨 Skill 关系 | skills/spec-plan/references/repo-profile-cache.md:1-20 |
| skills/spec-plan/references/synthesis-summary.md | 将 research/reviewer 输出压缩成 plan-ready evidence、decisions、risks。 | spec-plan internal synthesis；不直接 handoff其他 workflow。 | synthesis 不能覆盖 Product Contract 或伪造 direct evidence。 | 冲突/低置信度进入 assumption/OQ/limitation。 | 无跨 Skill 关系 | skills/spec-plan/references/synthesis-summary.md:1-24 |
| skills/spec-plan/references/universal-planning.md | 非软件 plan-seeking 与 answer-seeking workflow。 | 可接 universal brainstorm；plan-seeking 可 Save/Proof；answer-seeking只在 chat；明确不交 spec-work。 | universal plan 无 software unified contract；answer scaffold 不落盘。 | pipeline/LFG 遇 non-software 必须停止；trivial fact 可 direct exit；Proof-only 分支当前缺 local md source。 | 漂移候选：spec-proof helper intake 不闭合；software execution boundary其余正确。 | skills/spec-plan/references/universal-planning.md:3-14,18-49,148-168 |

## spec-write-tasks（4/4）

| 文件 | 文件职责 | Route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 判定 | 关键 source line |
| --- | --- | --- | --- | --- | --- | --- |
| skills/spec-write-tasks/SKILL.md | 将 settled source plan 可选编译为 derived task pack，或验证现有 pack。 | source 是 spec-plan；下游 spec-work；high-risk pack 推荐 spec-doc-review；小 plan 直接 spec-work。 | spec-plan 永远单一 SoT；task pack 仅 execution index，不是第二 plan/状态库。 | compile/skip/return-to-plan/draft-only/validate-only；CLI 验证前不得 deterministic handoff。 | 漂移候选：宣称 high-risk spec-doc-review consumer，但 consumer 无 task-pack intake。 | skills/spec-write-tasks/SKILL.md:8-14,32-48,58-66,103-117 |
| skills/spec-write-tasks/references/execution-handoff-contract.md | 定义 final envelope、branch decision、hash/freshness 与 high-risk review handoff。 | valid pack -> spec-work-task-pack；high-risk -> review-task-pack；scope gap -> revise-plan。 | source-plan-path+body-hash 是 executable identity；spec_id 仅兼容 trace。 | hash/contract/repo scope 不可验证则 draft/stop；auto-continuation 只限一次 write-tasks -> doc-review。 | 漂移候选：line 80-95 的 task-pack doc-review handoff 在 consumer 侧没有对应 document type。 | skills/spec-write-tasks/references/execution-handoff-contract.md:8-40,42-78,80-95 |
| skills/spec-write-tasks/references/task-pack-schema.md | 定义 docs/tasks task pack frontmatter、Task Pack Contract、Task Cards、waves 与质量字段。 | machine-readable JSON 供 validator/spec-work；human mirror 供 reviewer。 | Task Pack Contract JSON 是 task-card canonical source；human Task Cards 冲突时 JSON 胜。 | stale hash、wrong chain、runtime mirror ownership、same-wave overlap 阻断 execution。 | 正确；但 spec-doc-review 尚未声明消费该 schema。 | skills/spec-write-tasks/references/task-pack-schema.md:1-10,31-67,131-170,253-255 |
| skills/spec-write-tasks/references/task-quality-guide.md | 解释 task-ready、traceability、granularity、context refs、done/stop/review intent 的语义质量。 | producer 与 human/doc reviewer 使用；spec-work 只执行 validated JSON/waves。 | quality judgment 属于 LLM/human；validator 只证 identity/freshness/structure。 | semantic incomplete 必须回 write-tasks 或 plan；不得让 validator-green 掩盖 scope gap。 | 正确 | skills/spec-write-tasks/references/task-quality-guide.md:7-18,33-45,70-83,184-200 |

## spec-doc-review（25/25）

| 文件 | 文件职责 | Route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 判定 | 关键 source line |
| --- | --- | --- | --- | --- | --- | --- |
| skills/spec-doc-review/SKILL.md | 对 requirements/plan/spec 做多 persona 文档审查；Markdown 可写，HTML report-only。 | callers 包括 brainstorm、plan、route map 与 write-tasks；requirements 结束建议 spec-plan，plan 结束建议 spec-work。 | reviewer 只拥有 finding/envelope；Markdown safe_auto 可按 policy 改原文；HTML mutation 仍归 producer。 | unreadable path 不 dispatch；无 dispatch auth/capability inline degraded；HTML 不加载 walkthrough。 | 漂移候选：没有 task-pack document type/intake，无法兑现 route-map/write-tasks 的 task review。 | skills/spec-doc-review/SKILL.md:28-58,98-118,140-146 |
| skills/spec-doc-review/references/bulk-preview.md | interactive Markdown 批量 Apply/Defer/Skip 的单屏预览与确认。 | 由 walkthrough/top-level routing 调用；不跨 workflow。 | 预览不改变 finding authority；Proceed 后才 mutation。 | report-only 立即停止；Cancel 无副作用；append unavailable 时 Defer 降 Skip。 | 无跨 Skill 关系 | skills/spec-doc-review/references/bulk-preview.md:1-19,83-120 |
| skills/spec-doc-review/references/document-classification-signals.md | requirements 与 plan 的 lazy classification signals。 | SKILL ambiguous classification 时读取；影响 persona lens 与 terminal handoff。 | content shape 优先，path 只 tie-break。 | docs/brainstorms -> requirements；docs/plans -> plan；其他 ambiguous 默认 requirements。 | 漂移候选：无 task-pack/docs/tasks/Task Card 信号，task pack 会错误落 requirements fallback。 | skills/spec-doc-review/references/document-classification-signals.md:1-29 |
| skills/spec-doc-review/references/findings-schema.json | persona finding JSON schema。 | subagent-template 输入；synthesis validator 消费。 | schema 枚举是 machine contract；persona prose 不能改值域。 | 缺 required/invalid enum findings 被丢弃。 | 无跨 Skill 关系 | skills/spec-doc-review/references/findings-schema.json:1-26,46-70 |
| skills/spec-doc-review/references/open-questions-defer.md | 将 interactive Defer 追加到 Markdown Deferred/Open Questions。 | walkthrough 与 bulk-preview 内部调用。 | document 仍 canonical；append entry 是用户选择后的 durable concern。 | report-only STOP；并发改动/写失败进入 Retry/record-only/Skip；同日 compound-key 去重。 | 无跨 Skill 关系 | skills/spec-doc-review/references/open-questions-defer.md:1-8,11-67,71-105 |
| skills/spec-doc-review/references/persona-activation-matrix.md | conditional persona 的完整触发与 suppression 规则。 | SKILL quick table 不足时读取。 | 只决定 reviewer coverage，不决定 document truth。 | validated upstream plan 抑制 premise re-litigation；无 trigger 不激活。 | 无跨 Skill 关系 | skills/spec-doc-review/references/persona-activation-matrix.md:1-59 |
| skills/spec-doc-review/references/personas/adversarial-document-reviewer.md | 证伪 premise、assumption、decision、simplification、alternatives。 | doc-review 条件 leaf；validated upstream plan 时只看 technical assumption/decision/architecture alternatives。 | finding 是 review judgment。 | routine validated plan 抑制 product premise 重审；低于 anchor 50 不 emit。 | 无跨 Skill 关系 | skills/spec-doc-review/references/personas/adversarial-document-reviewer.md:1-27,29-42,90-108 |
| skills/spec-doc-review/references/personas/coherence-reviewer.md | 检查内部矛盾、术语漂移、引用与结构一致性。 | always-on leaf；适配 requirements/plan。 | 只对 document text consistency 作判断。 | style、其他 persona domain、显式 deferred 不 flag。 | 无跨 Skill 关系 | skills/spec-doc-review/references/personas/coherence-reviewer.md:1-11,13-47,58-66 |
| skills/spec-doc-review/references/personas/design-lens-reviewer.md | 检查 IA、interaction states、flows、a11y 与 unresolved UX decisions。 | UI/UX 文档条件 leaf。 | design finding 不新增 product scope。 | irrelevant dimension skip；requirements 不强求 plan-level mechanics。 | 无跨 Skill 关系 | skills/spec-doc-review/references/personas/design-lens-reviewer.md:1-23,36-49 |
| skills/spec-doc-review/references/personas/feasibility-reviewer.md | 检查现有能力、架构现实、shadow paths、依赖、migration 与 implementability。 | always-on leaf；requirements 只做 fundamental blocker，plan 才跑完整检查。 | code/source evidence 可支持 finding，但 reviewer 不改 plan authority。 | requirements 上缺 implementation detail 必须 suppress；无 evidence 的理论规模担忧 suppress。 | 无跨 Skill 关系 | skills/spec-doc-review/references/personas/feasibility-reviewer.md:1-22,24-58 |
| skills/spec-doc-review/references/personas/product-lens-reviewer.md | 质疑 premise、战略后果、替代、goal alignment 与 priority。 | 条件 leaf；有 validated upstream origin 的 plan 抑制 premise/prioritization 重审。 | product finding 不覆盖 upstream Product Contract。 | 无 concrete impact 的策略观察 anchor 50；speculative future concern suppress。 | 无跨 Skill 关系 | skills/spec-doc-review/references/personas/product-lens-reviewer.md:1-21,37-79 |
| skills/spec-doc-review/references/personas/scope-guardian-reviewer.md | 检查 right-size、抽象是否值得、scope-goal、priority dependency。 | 条件 leaf；有 origin 的 plan 聚焦 implementation bloat/scope creep。 | 只能 challenge scope，不擅自增删 requirement。 | origin 已决 scope 不重审；低信号组织偏好 anchor 50 或 suppress。 | 无跨 Skill 关系 | skills/spec-doc-review/references/personas/scope-guardian-reviewer.md:1-24,26-72 |
| skills/spec-doc-review/references/personas/security-lens-reviewer.md | 检查 attack surface、auth/authz、PII、third-party、secrets。 | security-triggered leaf；requirements 看 posture，plan 看 mechanics。 | finding 不替代 code-level security review。 | 无真实 exploit path 的理论风险 suppress。 | 无跨 Skill 关系 | skills/spec-doc-review/references/personas/security-lens-reviewer.md:1-25,27-41 |
| skills/spec-doc-review/references/review-output-template.md | interactive review 的 severity/FYI/residual/deferred/Coverage 渲染模板。 | synthesis-and-presentation 消费；不跨 workflow。 | 展示层不得改变 stable finding counts/routes。 | 表格需转义 pipe；Coverage count 必须与 route bucket 一致。 | 无跨 Skill 关系 | skills/spec-doc-review/references/review-output-template.md:1-14,105-123 |
| skills/spec-doc-review/references/subagent-confidence-rubric-detail.md | 细化 0/25/50/75/100 行为锚点。 | persona 在 quick rubric 不足时读取。 | confidence 只决定 surface，不等于 severity。 | 0/25 不 emit；50 只 FYI；75/100 actionable。 | 无跨 Skill 关系 | skills/spec-doc-review/references/subagent-confidence-rubric-detail.md:1-29 |
| skills/spec-doc-review/references/subagent-suggested-fix-advanced.md | 定义 committed recommendation、multi-facet fix、strawman 与 tier。 | persona lazy guidance。 | suggested_fix 不能把未证实 scope 包装成 safe_auto。 | Apply 后仍需选择子方案则必须重写或 manual/gated。 | 无跨 Skill 关系 | skills/spec-doc-review/references/subagent-suggested-fix-advanced.md:1-21,27-49 |
| skills/spec-doc-review/references/subagent-template.md | 每个 reviewer 的自包含 prompt、schema、FP catalog 与 context slots。 | SKILL dispatch/inline fallback 均复用；leaf 不可再调用 spec-first skills。 | orchestrator classification/origin slot 对 leaf 是权威；leaf 只返回 JSON。 | malformed JSON 由 synthesis 丢弃；低于 50 与 FP catalog suppress。 | 无跨 Skill 关系 | skills/spec-doc-review/references/subagent-template.md:1-24,40-56,58-76 |
| skills/spec-doc-review/references/subagent-why-it-matters-guide.md | 约束 finding 以可观察后果开头，并说明 fix 如何解决。 | persona lazy guidance；所有 downstream surfaces 复用该字段。 | 不改变 evidence，只改善表达。 | 空/结构先行/无后果的 why 是质量失败。 | 无跨 Skill 关系 | skills/spec-doc-review/references/subagent-why-it-matters-guide.md:1-18 |
| skills/spec-doc-review/references/synthesis-and-presentation.md | validate、confidence gate、dedup、promotion、routing、mutation policy、envelope、terminal next stage。 | HTML report-only envelope 可被 spec-plan producer 消费；requirements -> spec-plan，plan -> spec-work。 | report-only reviewer 永不拥有 HTML mutation；producer_fix_candidate 只供 caller 决定 full recompose。 | incomplete mandatory coverage 禁止 clean verdict；report-only 不问问题；protected artifacts 不删。 | 正确的 HTML consumer contract；task-pack next-stage/classification 缺失。 | skills/spec-doc-review/references/synthesis-and-presentation.md:1-31,124-147,231-277 |
| skills/spec-doc-review/references/synthesis-chain-linking.md | 将 premise root 与会随 root 决策消失的 dependent findings 建链。 | synthesis cold path，walkthrough 消费 annotations。 | linking 只注释，不改变 finding confidence/route。 | independence safeguard；不确定默认不 link；每 root 最多 6。 | 无跨 Skill 关系 | skills/spec-doc-review/references/synthesis-chain-linking.md:1-9,11-67 |
| skills/spec-doc-review/references/synthesis-contradictions.md | 处理不同 persona 的 opposing actions。 | synthesis cold path；合并为 manual tradeoff 后交 tie-break。 | 不强行选择 product decision。 | 无 opposing action 时不加载。 | 无跨 Skill 关系 | skills/spec-doc-review/references/synthesis-contradictions.md:1-20 |
| skills/spec-doc-review/references/synthesis-multi-round.md | R29 rejected suppression 与 R30 fix-landed verification。 | 同 session round 2+；依赖 decision primer。 | in-memory prior decision 只在本 session 有效。 | evidence overlap/section rename 决定 suppress、新 finding 或 regression。 | 无跨 Skill 关系 | skills/spec-doc-review/references/synthesis-multi-round.md:1-31 |
| skills/spec-doc-review/references/synthesis-premise-collapse.md | 同 persona 三个以上同 premise findings 的降噪。 | synthesis cold path。 | 只降低重复权重，不跨 persona 合并独立信号。 | cluster 小于 3 不运行；保留最强 finding，其余降 FYI。 | 无跨 Skill 关系 | skills/spec-doc-review/references/synthesis-premise-collapse.md:1-23 |
| skills/spec-doc-review/references/synthesis-restatement-suppression.md | 去除 residual/deferred 对已存在 finding 的重复表述。 | synthesis cold path。 | 新信号必须保留；只删明显 restatement。 | 不确定默认 keep。 | 无跨 Skill 关系 | skills/spec-doc-review/references/synthesis-restatement-suppression.md:1-16 |
| skills/spec-doc-review/references/walkthrough.md | interactive Markdown per-finding Apply/Defer/Skip/best-judgment 与 completion report。 | 只在 mutation_policy=markdown-write；report-only 返回 synthesis envelope。 | orchestrator 批量 edit 原文；persona 永远 read-only。 | no suggested_fix 的 Apply 必须转 Defer/Skip/Acknowledge；中断丢 in-memory state；HTML 禁止进入。 | 无跨 Skill 关系 | skills/spec-doc-review/references/walkthrough.md:1-7,11-39,170-237,241-286 |

## spec-strategy（3/3）

| 文件 | 文件职责 | Route / handoff / caller / consumer | Artifact authority | Failure / return / stop | 判定 | 关键 source line |
| --- | --- | --- | --- | --- | --- | --- |
| skills/spec-strategy/SKILL.md | 创建或定向更新 repo root 的 STRATEGY.md。 | producer 是 spec-strategy；confirmed consumers 是 spec-ideate、spec-brainstorm、spec-plan；完成后可建议 ideate/brainstorm。 | STRATEGY.md 是 durable product grounding anchor，不是 feature requirements、backlog 或 implementation plan。 | 文件不存在走 first-run；存在且有 focus 只更新该 section；未选 downstream 时停在 strategy。 | 正确；三个 consumer 均有实际 read path。 | skills/spec-strategy/SKILL.md:3-13,34-42,61-84 |
| skills/spec-strategy/references/interview.md | 定义 Target Problem、Approach、Persona、Metrics、Tracks 等访谈与 pushback。 | spec-strategy first-run/update 内部调用。 | owner 最终回答写入 STRATEGY.md；interview prompt 本身不构成 strategy。 | 每 section 最多两轮 pushback；必填 1-5 未完成不得写 final doc。 | 无跨 Skill 关系 | skills/spec-strategy/references/interview.md:1-14,17-143 |
| skills/spec-strategy/references/strategy-template.md | 定义 STRATEGY.md frontmatter、锁定 section 顺序与 post-write checklist。 | spec-strategy producer 消费；ideate/brainstorm/plan 读取产物内容而非模板。 | root STRATEGY.md 是 canonical file；optional sections 未使用即删除。 | placeholder、metric/track count、problem/approach disconnect 未通过时不得确认 write。 | 正确 | skills/spec-strategy/references/strategy-template.md:1-16,18-89 |

## 跨 Skill 关系图结论

当前正确主链：

1. using-spec-first 只选择一个入口，不自动串链。
2. spec-ideate 产生方向证据，software 路径只交 spec-brainstorm。
3. spec-brainstorm 产生 requirements-only Product Contract；spec-plan 对同一 artifact 原地 enrichment。
4. spec-prd 是 brownfield WHAT/WHY 入口，ready 后交 spec-plan。
5. spec-plan 产生 implementation-ready plan，并先经 spec-doc-review，再由用户选择 spec-work 或其他 handoff。
6. spec-write-tasks 是 plan 与 work 之间的可选 derived layer；plan 仍是唯一 scope authority。
7. spec-strategy 通过 STRATEGY.md 为 ideate、brainstorm、plan 提供 upstream grounding。

## 候选关系问题

### PL-01 P1：brainstorm 调用不存在的 lfg skill 名称

- Caller 证据：skills/spec-brainstorm/references/handoff.md:90-103 要求通过 skill-invocation primitive 调用 lfg。
- Canonical 反证：skills/using-spec-first/references/public-route-map.md:42-44 规定公共 workflow 使用 spec-*；skills/spec-lfg/SKILL.md:2 的实际 name 是 spec-lfg，且 repo 无 name: lfg alias。
- Intake 复核：handoff 传 requirements-only plan path 的 payload 是正确的；skills/spec-plan/SKILL.md:119-126 会将其识别为 enrichment input，skills/spec-lfg/SKILL.md:10-16 会把同一参数交 spec-plan。
- 结论：用户显示标签可以保留 LFG/lfg，但实际 skill identifier 必须按 available-skills 解析为 spec-lfg；当前 primitive 调用会失败。

### PL-02 P1：HTML document-review caller/consumer contract 分裂

- 新 consumer contract：skills/spec-doc-review/SKILL.md:41-48 允许 HTML report-only；skills/spec-doc-review/references/synthesis-and-presentation.md:128-147 定义 producer_fix_candidates；skills/spec-plan/references/plan-handoff.md:5-18 要求 md/html 都 headless review。
- 旧 caller/reference：skills/spec-plan/references/html-rendering.md:11-17,549-555 仍称 spec-doc-review 不是 HTML consumer并跳过；skills/spec-brainstorm/references/handoff.md:11-16,58,65 仍因“markdown-only”隐藏 HTML review。
- 反证边界：Markdown mutation/walkthrough 仍确实不可用于 HTML，但这只要求 report-only，不支持“HTML 不可 review/不是 consumer”的旧结论。
- 结论：plan rendering reference 会与 plan spine 产生直接冲突；brainstorm HTML handoff 也丢失了已经存在的 report-only pressure test 能力。

### PL-03 P1：task-pack review producer 有 handoff，spec-doc-review 无 intake

- Producer/route 证据：skills/using-spec-first/references/public-route-map.md:10 将 task document 交 spec-doc-review；skills/spec-write-tasks/SKILL.md:46-48,117 与 execution-handoff-contract.md:80-95 定义 high-risk review-task-pack。
- Consumer 反证：skills/spec-doc-review/SKILL.md:34-56 只分类 unified-requirements、unified-plan、requirements、plan；document-classification-signals.md:10-29 也无 task pack；对整个 spec-doc-review package 搜索 task-pack/docs/tasks/Task Pack Contract 为零匹配。
- 影响：docs/tasks 下的 task pack 在 mixed/sparse 时默认 requirements，feasibility 会抑制 plan-grade检查，terminal next stage 也会错误指向 spec-plan，而不是 validated pack -> spec-work。
- 结论：这是未闭合的 caller/consumer edge，需新增 task-pack classification/slice/persona/terminal contract，或移除/改写上游 review-task-pack 声明。

### PL-04 P2：universal ideate 对 brainstorm 后续链路的陈述过时

- Caller 文案：skills/spec-ideate/references/universal-ideation.md:102-104 声称 universal brainstorm 在此结束、后面没有 spec-plan -> spec-work。
- Consumer 反证：skills/spec-brainstorm/references/universal-brainstorming.md:5-11,64-72 明确提供 Create a plan -> spec-plan；spec-plan/references/universal-planning.md 支持 universal/knowledge-work plan。
- 反证边界：non-software 确实不能进入 spec-work，因此“不是 implementation chain”部分正确。
- 结论：应改为“不自动进入 software implementation chain；brainstorm 可选交 universal spec-plan，但不得交 spec-work”，而不是说 brainstorm ends there。

### PL-05 P1：universal Proof helper caller 缺必需 source file

- Helper contract：skills/spec-proof/SKILL.md:29-34,330-338 要求 existing local Markdown source，并要求 upstream 显式传 source path 与 title。
- Broken callers：skills/spec-brainstorm/references/universal-brainstorming.md:64-72 的主要输出仅在 chat，却把 Save 与 Publish to Proof 并列；Proof 分支未先物化 md。skills/spec-plan/references/universal-planning.md:148-166 的 Publish-only 分支同样没有 local file。
- Correct counterexamples：software ideate 的 post-ideation-workflow.md:100-108、software brainstorm/plan handoff 都先有 canonical md 并传 path/title；universal plan 的 Save AND Publish 分支也可闭合。
- 结论：Publish-only 分支必须先创建明确的临时或用户选定 markdown source，再调用 spec-proof；否则 helper intake 不完整。

### PL-06 P2：共享 HTML rendering reference 泄漏 plan-specific consumer 语义

- 证据：spec-ideate/references/html-rendering.md:11-17,544-550 与 spec-brainstorm/references/html-rendering.md 同位置声称 spec-work 是当前 consumer，并描述 spec-plan 5.3.8 gate。
- 实际关系：ideate 的下游是 brainstorm；requirements-only brainstorm artifact 需先经 plan，不能直接 work；5.3.8 是 spec-plan phase，不属于 ideate/brainstorm。
- 反证边界：通用 HTML invariants 与 agent-consumability 规则可共享；漂移集中在 opening consumer paragraph 与 closing consumer note。
- 结论：共享 renderer 应保持 package-neutral，或由各 package 提供自己的 consumer/handoff overlay。

### PL-07 P1：plan_output / brainstorm_output 的 active consumer 与 setup reserved contract 冲突

- Active source：skills/spec-brainstorm/SKILL.md:73 读取 brainstorm_output；skills/spec-plan/SKILL.md:99 读取 plan_output。
- External contract 反证：skills/spec-runtime-setup/SKILL.md:126 与 references/config-template.yaml:62-67 仍称两者 reserved future hints。
- 反证边界：模板示例默认注释，因此默认行为不受影响；问题发生在用户显式激活 key、文档审查或未来清理时。
- 结论：属于跨 package config consumer drift；由总审查统一裁决，不应在 planning skill 内单边删除 consumer。

## 已核对且排除的疑点

- brainstorm -> spec-plan intake 正确：有 artifact 传 requirements-only path，无 artifact 传精简决策；grounding dossier 仅作为附加证据路径。spec-plan 明确原地 enrichment。
- brainstorm -> spec-lfg 的 payload shape 正确；唯一确定错误是调用 identifier。spec-lfg 自己还要求按 available-skills 精确解析名称，进一步反证 short-form lfg。
- software ideate/brainstorm/plan -> spec-proof 正确：都先有 Markdown source path、title，且 local file 保持 canonical。
- brainstorm -> spec-pov 正确：只在 named external whether-to-commit shape、用户接受后 handoff，传 candidate、intent、links；spec-pov warm intake 与此对齐。
- spec-strategy -> ideate/brainstorm/plan 正确：三个 consumer 都存在 STRATEGY.md read path。
- spec-prd 的主要 route 正确：0-1 -> brainstorm，HOW -> plan，独立 critique -> doc-review，App PRD/Figma/source consistency -> app-consistency-audit。
- spec-plan 未直接引用 spec-write-tasks 不单列 finding：public route map 明确该 layer 是 optional，且禁止自动串链；显式“拆 plan 为 tasks”请求仍可由 governor 路由。若产品期望 deep plan 自动提示 task pack，应另立可发现性需求，不应把当前可选性误报为 contract bug。

## Provider 与证据限制

- CodeGraph 已先用于关系导航，但其本次结果主要命中 JS/tests，不能替代 Markdown skill source。
- .graphify/graph.json 存在，但当前 graphify CLI 默认寻找 legacy graphify-out/graph.json，query 未成功；未将 Graphify 输出用于任何 finding。
- 所有最终判定均回源到上述 102 个文件；PL-01、PL-05、PL-07 另读取实际 consumer/helper source 作为反证，但这些外部文件不计入 102 文件 ledger。

## 覆盖计数

- expected: 102
- actual: 102
- unique: 102
- missing: 0
- extra: 0
- duplicate: 0
