---
title: 团队开发规范治理层深度计划
type: feat
status: completed
date: 2026-06-21
spec_id: 2026-06-21-004-team-standards-governance-layer
plan_depth: deep
deepened: 2026-06-21
---

# 团队开发规范治理层深度计划

## 摘要

本计划为 spec-first 增加一等的团队开发规范输入与治理层：把当前分散在 `AGENTS.md`、`CLAUDE.md`、历史开发规范、workflow prose 和 code-review persona 中的规范消费方式，收敛为明确 source、trust level、scope、promotion gate、lifecycle 和 downstream consumption contract。它借鉴 OpenSpec 的显式 `context` / artifact-scoped `rules` 机制，但保留 spec-first 的 source-first、summary-first、trust-aware 和 `Scripts prepare, LLM decides` 边界。

深化后的方案覆盖多端工程场景：App、H5、PC Web、Admin、Backend、Job/Event/Data 等 surface 通过 scope 标签和跨端契约统一治理；高层系统架构、分层、设计决策规范作为 architecture/design standards 进入最高优先级规则，而不是混入普通代码风格规范。方案同时增加“规范治理元提示词层”：它负责动态解释、选择、加载、候选生成、分级自治和生命周期引导。业界已有 Qodo Rule Miner、CodeRabbit learnings、Claude Code auto memory 等“自动学习/自动生成规则”实践，因此本方案不把 human confirmation 作为一刀切前提，而是引入 authority tier：LLM 在低风险和显式权威来源层尽量自治，高影响治理层保留明确 owner gate。

本次继续深化后，方案按版本分层收敛：V1 先交付最小可用的 `docs/standards/**` source、`team-standards.md` 合同、scope-filtered consumption、code-review enforcement 和 proposal-only standalone skill skeleton；规范获取质量层（acquisition task pack、证据质量评分、来源矩阵、brownfield 切片、角色化访谈、PR 回放、检索命中 eval 和 ledger 体系）保留为 V2 evidence-gated 扩展。这样既解决“规范存在哪里、如何治理、如何被 workflow 按需加载”，也避免第一版在尚无真实 pilot 证据时把获取平台、评测平台和空账本一次性全建出来。

---

## 决策摘要

- **推荐方案:** 先建立 `docs/standards/**` 作为团队开发规范的 confirmed source surface，并新增 `docs/contracts/team-standards.md` 定义 trust level、scope、lifecycle、注入边界和提升流程；再以 `skills/spec-team-standards-governance/SKILL.md` 作为规范治理元提示词层，规定动态加载、候选生成、提升、废弃和审计方式；随后让 `spec-plan`、`spec-work`、`spec-write-tasks`、`spec-code-review`、`spec-doc-review`、`spec-debug` 按同一合同消费 confirmed standards。
- **关键决策:** 不恢复 `spec-standards` public workflow，不复用 `.spec-first/standards/` 作为当前 source，不把代码扫描结果本身自动确认为团队规范，不全量注入大文档；多端适配靠 surface/layer/capability/workflow 标签过滤，架构规范单列为最高优先级规则；LLM 自主能力按 authority tier 放大，而不是用单一“必须人工确认”压平所有场景；规范获取必须先过 acquisition quality layer，避免把历史债、个人偏好或低质量证据包装成团队规则。
- **验证重点:** V1 重点验证 public workflow catalog 仍不暴露 `spec-standards`，下游 workflow 只把 `confirmed` 且 scope 命中的规范当硬上下文，review persona findings 必须引用具体标准条款，索引加载不会要求全量读取 `docs/standards/**`，候选落盘前通过 privacy/secret/path/prompt-injection pre-write gate。PR replay / retrieval eval 属于 V2 价值验证，用真实 pilot 证明“获取到的规范能否减少误判和正确命中”。
- **最大风险 / 边界:** 最大风险是把“规范治理”做成第二套流程引擎、大上下文注入器，或把模型置信度误当组织授权。本计划把第一版限定为轻合同、Markdown source、手工索引、focused contract tests 和分级自治的提升流程。

### 版本分层决策

| 层级 | 目标 | 第一版进入范围 | 延后条件 |
|------|------|----------------|----------|
| V1 core | 让团队规范成为可引用、可 review、可按 scope 选择的项目输入 | `docs/contracts/team-standards.md`、`docs/standards/index.md`、少量 confirmed seed/template、summary-first consumption、project-standards review enforcement、standalone skill skeleton 的 query/audit/proposal-only 边界、focused contract tests | 不依赖真实 PR replay 或角色访谈即可落地；但不得声称已完成 brownfield 自动获取能力 |
| V1 candidate preview | 支持人工可审查的候选入口 | `docs/standards/candidates/README.md`、轻量 acquisition notes、候选写入前隐私/secret/path hygiene gate、confirmed-draft 不可 enforce 的硬边界 | 只允许 proposal/report；不创建空 ledger 矩阵，不批量采集历史 PR/事故/访谈 |
| V2 evidence-gated | 高质量初始化存量项目规范 | U10-U12 的 acquisition task pack、source matrix、evidence/lineage/owner ledgers、role interviews、PR replay、retrieval eval、golden samples、surface-specific 文件按真实 slice 创建 | 至少有一个 repo/capability/surface pilot、可复核输入样本、owner 可用性和隐私边界后再进入 |

这个分层回应审查报告 A-H/P2 的核心问题：V1 不再承诺一次性建立完整规范获取平台；V2 机制必须用真实 pilot 证据证明能减少误判、降低 owner 修改量或提升检索命中后再扩展。

---

## 问题背景

当前 spec-first 流程已经严谨：从需求、计划、任务、执行、评审到知识沉淀都有明确 workflow 边界。但团队开发规范这一层仍不够稳定：

- `spec-plan`、`spec-work`、`spec-write-tasks`、`spec-code-review`、`spec-doc-review`、`spec-debug` 都已经承认 project standards 可作为上下文。
- `spec-project-standards-reviewer` 已能按 `AGENTS.md` / `CLAUDE.md` / 目录级文件审查项目明写规则。
- 历史 `spec-standards` 曾尝试生成 standards artifacts，但已被移除，当前测试和 runtime prune 明确不应恢复该 public workflow 或 `.spec-first/standards/` artifact root。
- 用户本轮 OpenSpec 对比讨论暴露的核心缺口不是“缺规范概念”，而是缺少团队规范的稳定输入、scope 选择、trust level、人工确认、冲突治理和跨 workflow 消费合同。

OpenSpec 的本地源码显示，`openspec/config.yaml` 通过 `context` 和 `rules` 显式给 artifact 生成过程提供约束；`rules` 按 artifact ID 注入，是给 agent 的约束，不应复制进产出文件。这对 spec-first 的启发是：规范必须显式、按消费场景选择、与产出模板分离。但 spec-first 不能照搬成全量 context 注入或自动从代码扫描确认规范，因为角色契约要求 advisory facts 不能冒充 confirmed truth。

本计划的目标是让团队规范成为 AI coding harness 的一等输入资产，而不是让它变成新的中心化状态机。

---

## 需求

- R1. 建立团队开发规范的 source-of-truth 边界，明确哪些文件能产生 hard project context，哪些历史文档、扫描结果、经验文档只能作为 advisory。
- R2. 定义 trust level：`confirmed`、`observed`、`imported`、`suggested`、`conflict`，并把 lifecycle state（`active`、`deprecated`、`archived`）和 promotion state（canonical 集合由 `team-standards.md` 单一定义：`none`、`proposed`、`confirmed-draft`、`reviewed`、`rejected`、`deferred`；candidate card 禁用 `none`）分离；只有 `confirmed` 且 `active`、scope 命中的规范可成为硬约束。
- R3. 定义规范条目的最小字段：`id`、`trust`、`lifecycle_state`、`promotion_state`、`priority`、`category`、`applies_to`、`layer`、`capability`、`owner`、`source_refs`、`rule`、`rationale`、`enforcement`、`exceptions`、`effective_from`、`migration_impact`、`invalidation_condition`、`last_reviewed`。
- R4. 支持团队开发规范的主要类型：高层架构约束、设计决策约束、source/runtime 边界、代码组织、测试策略、review 规则、安全/隐私约束、发布/变更流程约束。
- R5. 下游 workflow 必须按同一 consumption contract 读取规范：summary-first、scope-filtered、confirmed-first，不得全量注入整个规范库。
- R6. `spec-code-review` 的 project-standards persona 必须继续只审“项目明写规则”，并把 `docs/standards/**` 纳入明确标准来源后才可引用；不得把 generic best practice 当 finding。
- R7. 不恢复已退役的 `spec-standards` public workflow、命令、runtime mirror、`.spec-first/standards/` source/artifact contract 或旧 glue-map/candidates 消费路径。
- R8. 提供 brownfield 初始化路线：历史代码、历史文档、graphify/codegraph、docs/solutions 和 review 经验默认只能生成候选；graphify/codegraph 证据必须按 provider_untrusted 处理并回源确认；只有满足 authority tier、scope、证据质量和冲突检查后才可进入 `confirmed-draft` promotion state 或面向 `confirmed` 的可审查 patch proposal。
- R9. 用户文档要说明团队如何配置、维护、审查和演进规范，以及这些规范与 `docs/specs/<capability>/spec.md`、`docs/contracts/**`、`docs/solutions/**` 的区别。
- R10. 所有变更必须遵守 source/runtime 边界，不手改 `.claude/`、`.codex/`、`.agents/skills/`。
- R11. 支持多端 scope 模型，至少覆盖 `shared`、`app`、`h5`、`pc`、`admin`、`backend`、`job-event`、`data` 等真实 surface，并能表达跨端一致性规则。
- R12. 支持高层 architecture/design standards，覆盖系统分层、依赖方向、业务状态 ownership、跨端契约、设计决策门槛和 ADR/design note 触发条件。
- R13. 定义规范生命周期：什么时候新增、修改、例外、冲突、废弃、归档，以及每种状态如何影响 workflow enforcement。
- R14. 定义初始化产物结构：显式规则盘点、observed/suggested candidates、conflicts、promotion review 和 confirmed standards 的分区，避免候选与正式规范混放。
- R15. 定义按需加载和高效索引：通过 surface、layer、capability、category、workflow、priority 过滤规范，默认读取 index 和命中条目摘要，而不是全量注入。
- R16. 定义规范优先级、例外机制、生效时间、迁移影响和 owner 责任，避免 confirmed 规范变成无人维护的僵尸规则。
- R17. 设计一个可选的规范治理 standalone skill 架构，覆盖初始化、查询、候选生成、提升、冲突处理、废弃和按需加载，但不恢复 `spec-standards` public workflow。
- R18. 规范 skill 必须遵守 `Scripts prepare, LLM decides`：脚本或结构化步骤只能准备 deterministic/advisory facts；LLM 可做语义判断、置信评分、多轮复核和候选合并，但 authority boundary 由 `docs/contracts/team-standards.md` 定义。
- R19. 定义规范治理元提示词层：明确 AI 如何理解规范、选择规范、解释冲突、提出候选、触发生命周期动作、生成 handoff，并把这些行为与 confirmed 规范内容分离。
- R20. 支持受治理的自适应扩展动态：workflow 可根据重复问题、review finding、incident、实现偏差和跨端冲突提出候选或审计项，但不得在未满足 authority tier 时自动把候选提升为 confirmed。
- R21. 定义分级自治规则：显式权威来源可被 LLM 自动整理并生成 `confirmed-draft` 或面向 `confirmed` 的可审查 patch proposal；真正写入 `confirmed` 必须处在 active `spec-work` 或等价 source-edit workflow 中，并通过普通 diff review、CHANGELOG 与聚焦验证；代码推断、review 重复模式和高置信候选可自动生成 promotion proposal；高影响治理规则、冲突规则和 owner 不明规则必须保留 owner gate。
- R22. 定义规范获取任务包：每次初始化或提取规范前必须声明目标仓库、业务能力、surface、时间窗口、证据来源、排除范围、隐私边界和预期产物。
- R23. 定义证据质量评分：每个候选规则必须记录 `source_strength`、`recency`、`consistency`、`coverage`、`conflict_density`、`enforcement_feasibility`、`owner_trace`、`migration_cost`、`risk_level` 和 `retrieval_value`。
- R24. 定义来源矩阵：显式文档、机械配置、PR review、incident/postmortem、代码结构、测试、onboarding 问题、团队访谈分别能产生哪些 trust level 和 candidate type。
- R25. 定义 brownfield 切片策略：大型项目按高风险能力、核心链路、高 churn 模块、跨端一致性、近期 PR 热点、事故频发区和 owner 可用性分批获取规范。
- R26. 定义角色化访谈 playbook：对架构、安全、测试、SRE、App、H5、PC/Admin、Backend、Data、产品/业务 owner 使用不同问题集，补足代码无法回答的组织规则。
- R27. 定义规则质量验收清单和反例库：进入 confirmed 前必须通过 atomic、actionable、falsifiable、scoped、examples、exceptions、owner、invalidation、migration policy 检查，并明确哪些内容不得沉淀为规范。
- R28. 定义获取质量验证：用历史 PR replay、review finding 回放、检索命中 eval、噪音率和 owner 审查耗时验证规范是否真的提升 plan/work/review 质量。
- R29. 定义规范获取过程的隐私与脱敏边界：从 PR、事故、业务文档、访谈记录提取规范时，不得把敏感业务细节、客户数据或内部人员信息沉淀进可复用规范。
- R30. 定义单目标 extraction target 运行契约：每次获取只绑定一个 repo/surface/sub-domain/capability slice，混合多端或多无关能力时必须拆分。
- R31. 定义 source anchor 和 fact ledger：代码/文档/配置/日志证据必须能通过 snapshot、path hash、file、line range、snippet hash 或等价来源锚点复核。
- R32. 定义规则质量 gates 与 warning routing：Evidence、Actionability、Abstraction、Conflict、Risk、Derivation、Anchor、Privacy 的 warning/fail 必须映射到 collect-more-evidence、refine-rule、owner-review、reject 等 next action。
- R33. 定义 decision trace：promotion decision 必须记录 gate results、confidence signals、autonomy policy、rationale 和 next action，避免黑盒自动提升。
- R34. 定义 derived artifact 边界：AI rules、review checklist、query summaries 和 workflow handoff snippets 只能从 confirmed standards 或 reviewable proposal 派生，不得成为独立 source truth。
- R35. 定义 source authority hierarchy：明确角色契约、host instructions、team-standards contract、`docs/standards/**`、目录级规则、capability specs、solutions 和候选区之间的权威顺序、冲突处理和重复规则去重方式。
- R36. 定义 rule selection contract：下游 workflow 和规范 skill 必须以统一输入/输出选择规则，记录 matched/excluded/uncertainty/fallback/limitations；未知 scope 只能加载安全摘要和默认规则，不能全量扫描 `docs/standards/**`。
- R37. 定义 standards vs capability spec 边界表：`docs/specs/<capability>/spec.md` 维护当前能力行为真相，`docs/standards/**` 维护工程约束与协作规则，`docs/contracts/**` 维护 harness/artifact/workflow contract，`docs/solutions/**` 维护可复用经验。
- R38. 定义 skill reference loading map：`spec-team-standards-governance` 的 `SKILL.md` 只保留模式路由、硬边界、输出合同和 reference map；不同 mode 只按需读取相关 references，禁止默认全量加载。

---

## 假设

- A1. 本计划没有 upstream `docs/brainstorms/*-requirements.md`；origin 是用户本轮 OpenSpec/spec-first 对比讨论和当前仓 source 复核，因此使用 plan-local `spec_id`。
- A2. 第一版优先落文档 source contract 和 workflow consumption prose；可包含确定性 fact-prep 脚本（结构校验器、owner-resolver 等只产 deterministic facts 的小工具），但不实现语义级 rule-mining 自动 confirmer，也不把扫描结果自动确认为规范。
- A3. `docs/03-实施方案/06-开发规范.md` 和 `docs/01-需求分析/11.project-standards/**` 是历史/方案材料，可作为迁移输入，但不是当前 confirmed team standards source。
- A4. “需要 owner 判断”不是因为 LLM 专业能力不足，而是因为团队规范同时是技术判断和组织授权。显式权威来源、低风险重复偏好和可回滚规则可以高度自治；架构边界、状态 ownership、安全、隐私、支付、权限、跨端契约等高影响规则需要 owner gate。
- A5. `docs/standards/**` 是推荐的新 source surface；若未来团队选择 `AGENTS.md` / `CLAUDE.md` / 目录级文件承载部分规范，也必须在合同中定义 priority 和 scope。
- A6. 多端项目的 surface 列表必须可项目化调整；本计划使用 App/H5/PC/Admin/Backend 等作为默认例子，不把这些名字硬编码成所有项目的固定枚举。surface（以及 `layer`、`capability`）作为 project-enum，由 `docs/standards/index.md` 的 Surface / Layer / Capability Registry 按项目声明，结构校验器查该注册表成员资格——闭合但可项目扩展，而非硬编码固定集合（见「规范内容模型 / 字段分类与校验来源」）。

---

## 范围边界

- 不恢复 `spec-standards`、`skills/spec-standards/` 或 `.spec-first/standards/`。
- 不把 `docs/specs/<capability>/spec.md` 改造成团队开发规范；能力 spec 记录产品/系统能力真相，团队开发规范记录工程约束和协作规则。
- 不把 `docs/contracts/**` 的 workflow/schema contract 与团队规范混为一谈；contract 约束 harness/artifact，standards 约束团队在项目中的开发实践。
- 不把 `docs/solutions/**` 的经验文档直接提升为规范；经验文档提供可复用学习，只有经过确认和 scope 定义后才进入 standards。
- 不要求所有项目都一次性补齐完整规范库；第一版应支持薄规范、渐进补充和局部 scope。
- 不把 App、H5、PC、Admin、Backend 各自拆成孤立规范体系；共享规则和跨端契约优先，端特有规则只承载差异。
- 不把 architecture/design standards 写成“高内聚低耦合”这类不可执行口号；每条高层规范必须能判断违反条件、source of truth、owner 和例外。
- 不把规范 skill 做成 public `spec-*` workflow、中心化状态机或自动批准器；它只能是 source skill / helper 方法论，服务既有 plan/work/review/debug workflow。
- 不让元提示词层自我修改角色契约、public workflow route map、runtime delivery 或绕过 authority tier 修改 confirmed standards；它只能解释当前规范、产生候选、提出冲突和组织 promotion review。
- 不设计复杂评分、状态机、规范 marketplace、远程同步或跨组织规范中心。

### 延后到后续工作

- CLI 辅助命令：如 `spec-first standards check/show/promote`，只有在文档 source 和 workflow consumption 被验证后再独立计划。
- 自动候选挖掘：可从 graphify/codegraph、review findings、docs/solutions、历史代码中生成候选，但属于 V2 advisory producer，不进入 V1 core；V1 只保留手工/显式来源驱动的 proposal-only 候选入口。
- 重型获取质量层：acquisition task pack、source matrix、fact/evidence/lineage ledger、owner-decision queue、role interviews、PR replay、retrieval eval 和 golden samples 均为 V2 evidence-gated 扩展；只有真实 slice pilot 证明有价值时创建对应 source 文件。
- 多项目团队规范包：可以借鉴历史 Team Pack 方案，但 V1 先解决单仓 confirmed standards source 和 workflow consumption。

---

## 完成标准

- C1. `docs/contracts/team-standards.md` 明确 source、trust level、scope、promotion gate、consumer boundary、anti-patterns。
- C2. `docs/standards/index.md` 和首批分类文件存在，并给出可执行的轻量条目模板。
- C3. 下游 workflow prose 与 contract tests 对齐：只把 `trust=confirmed,lifecycle_state=active` 且 scope-matched 的 standards 作为硬上下文，observed/imported/suggested/conflict 以及 deprecated/archived lifecycle 均保持 advisory 或不可用。
- C4. `spec-code-review` 的 project-standards persona 和 Stage 3b discovery 支持新 standards source，但仍要求每个 finding 引用具体条款。
- C5. public workflow catalog、using-spec-first route map、runtime capability catalog 和 init prune tests 继续证明 `spec-standards` 未恢复。
- C6. README/用户手册说明团队规范输入方式、brownfield 初始化方法和与 OpenSpec 的差异。
- C7. 计划实现后未手改 generated runtime mirrors；如 source-runtime projection 需要刷新，另由 `spec-first init` 执行并记录。
- C8. `docs/standards/index.md` 提供按 surface、layer、capability、category、workflow 的人工索引，并明确默认加载算法。
- C9. 首批标准文件包含 architecture/design/cross-surface 规则模板，能表达业务状态 ownership、依赖方向、跨端契约和设计决策门槛。
- C10. brownfield 初始化文档区分 explicit rules、observed patterns、suggested candidates、conflicts、`confirmed-draft` promotion proposals 和面向 confirmed 的 patch proposals，并给出 authority tier / owner review / source-edit workflow 退出条件。
- C11. 生命周期规则覆盖新增、修改、例外、冲突、deprecated、archive，不允许没有 owner/invalidation condition 的 confirmed 规则合入。
- C12. 规范治理 skill 架构文档明确入口、模式、输入、输出、文件边界、执行流程、失败模式、handoff 和与现有 workflow 的调用关系；测试继续证明没有 `spec-standards` 回归。
- C13. 规范治理元提示词层文档明确 meta-prompt responsibilities、动态加载算法、自适应候选生成边界、handoff 输出格式和分级自治边界。
- C14. 自适应扩展流程能从 workflow feedback 生成 `suggested` / `observed` candidates、conflict records 或 audit report，并明确哪些 authority tier 可自动生成 `confirmed-draft` patch、哪些必须 owner confirmation；`confirmed-draft` 不可被下游 workflow 当 hard context 消费。
- C15. `docs/contracts/team-standards.md` 定义 authority-tier table、promotion decision rules 和 absence guards：模型 confidence 是 promotion 输入，不是独立 authority；high-impact governance 与 conflict-present 一律不可自动 enforce。
- C16. V1 `candidates/README.md` 说明 proposal-only 候选入口、single extraction target 约束、include/exclude scope、output mode、privacy boundary 和 mixed-surface rejection；完整 acquisition task pack 模板延后到 V2。
- C17. V1 候选规则必须说明 source refs、authority tier、owner 状态、privacy/redaction 状态和 why-not-confirmed；完整 evidence quality score 与 ledgers 延后到 V2。
- C18. V1 Brownfield 初始化文档只给出 slice-first 路线和不得全仓一次性提取的规则；角色化访谈 playbook 延后到 V2。
- C19. V1 confirmed 前必须通过轻量规则质量清单：atomic、actionable、falsifiable、scoped、owner、invalidation、migration；完整反例库延后到 V2。
- C20. V1 成功指标以真实 slice pilot 的 query/review 命中与误报观察为主；完整 PR replay、retrieval eval、owner edit distance 和 golden samples 延后到 V2，并且结果只作为证据输入，不作为 LLM 自评。
- C21. V1 候选写入前必须完成 deterministic privacy/secret/path hygiene pre-write gate；不通过不得落盘到 git-tracked `docs/standards/candidates/**`。
- C22. V1 `authority-tiers.md` 或 promotion reference 定义 decision trace、autonomy policy、next_action/outcome 和 derived artifact source boundary。
- C25. `docs/contracts/team-standards.md` 明确 source authority hierarchy、同级冲突处理、重复规则去重和“高权威指针优先于复制全文”的维护规则。
- C26. `docs/contracts/team-standards.md` 或 `docs/standards/index.md` 定义 rule selection contract，包括输入字段、输出字段、fallback modes、unknown-scope 降级和禁止全量扫描的约束。
- C27. 用户文档和 source contract 给出 standards、capability specs、contracts、solutions、candidates 的边界表和跨界示例，避免把产品能力真相写成开发规范，或把工程约束塞进能力 spec。
- C28. `skills/spec-team-standards-governance/SKILL.md` 和 `references/README` 或等价文件包含 skill reference loading map，说明 near-core references、mode-specific references、触发条件和 no-load-all 默认策略。

---

## 直接证据准备度

- target_repo: `spec-first`
- evidence_sources: direct source reads、`rg`、CodeGraph orientation、task-governance-signals、git status、本地 OpenSpec read-only comparison
- source_refs:
  - `docs/10-prompt/结构化项目角色契约.md`
  - `skills/spec-plan/references/governance-boundaries.md`
  - `agents/spec-project-standards-reviewer.agent.md`
  - `docs/plans/2026-05-21-002-refactor-remove-spec-standards-plan.md`
  - `src/cli/state.js`
  - `tests/unit/spec-plan-contracts.test.js`
  - `tests/unit/spec-work-contracts.test.js`
  - `tests/unit/spec-code-review-contracts.test.js`
  - `tests/unit/spec-write-tasks-contracts.test.js`
  - `tests/unit/runtime-capability-catalog.test.js`
  - `tests/unit/using-spec-first-contracts.test.js`
  - `docs/05-用户手册/12-gitignore参考.md`
  - `docs/03-实施方案/06-开发规范.md`
  - `docs/01-需求分析/11.project-standards/第一层级.md`
  - `docs/validation/execution-logs/2026-05-04-spec-standards-loop.md`
- planning_snapshot:
  - captured_revision: `3988bcbe`（stale planning snapshot，不是实现阶段当前 HEAD）
  - captured_workspace_note: 历史计划深化时的工作区观察；实现或修订阶段不得把它当作当前 dirty truth。
- implementation_freshness_rule: 任何真正实现或修订前，必须重新捕获 `git rev-parse --short HEAD` 和 `git status --short`；当前工作区状态只作为本次执行 closeout evidence，不写成长期计划事实。
- confidence: 对当前 spec-first source/routing/retirement evidence 为高；对 OpenSpec comparison 为中，因为它来自 sibling repo read-only source，不是依赖项
- limitations: 未 dispatch fresh-source subagent review；未做实现变更；本地 OpenSpec source 可能不同于 upstream published OpenSpec state

---

## 直接证据

- repo_scope: 单仓 `spec-first`
- source_reads_completed:
  - 角色基线: `docs/10-prompt/结构化项目角色契约.md`
  - Planning contract: `skills/spec-plan/SKILL.md` 及相关 references
  - 当前 standards consumption: `skills/spec-plan/references/governance-boundaries.md`, `skills/spec-work/SKILL.md`, `skills/spec-write-tasks/SKILL.md`, `skills/spec-code-review/SKILL.md`, `skills/spec-doc-review/SKILL.md`, `skills/spec-debug/SKILL.md`
  - 当前 reviewer role: `agents/spec-project-standards-reviewer.agent.md`
  - Retirement state: `docs/plans/2026-05-21-002-refactor-remove-spec-standards-plan.md`, `src/cli/state.js`, related unit/smoke test hits
  - 历史设计: `docs/03-实施方案/06-开发规范.md`, `docs/01-需求分析/11.project-standards/**`, `docs/validation/execution-logs/2026-05-04-spec-standards-loop.md`
  - OpenSpec 对比: sibling repo `OpenSpec/openspec/config.yaml`, `OpenSpec/src/core/artifact-graph/instruction-loader.ts`, `OpenSpec/docs/core-workflow-prompts.md`, archived rules-injection spec
  - 业界实践: Qodo Rule Miner、CodeRabbit learnings、GitHub Copilot custom instructions、Claude Code memory、OpenAI Agents guardrails/human review、Anthropic agent evals、NIST AI RMF、OPA policy-as-code
- source_reads_required:
  - 实现阶段编辑前必须重读精确目标文件，尤其是所有 focused contract tests 和被修改的 README sections。
- commands_or_tools_used:
  - `mcp__codegraph.codegraph_explore`
  - `rg` for standards/spec-standards references
  - `node bin/spec-first.js internal task-governance-signals --source plan-declared --input ... --json`
  - `git status --short`, `git rev-parse --short HEAD`
- impact_on_plan:
  - `task-governance-signals` 返回 `candidate_level: deep`，命中 `cross-module`、`critical-path-hit` 以及 governance/contract/workflow 关键词。
  - 当前 tests 明确要求 active contracts 中没有 `spec-standards`、`.spec-first/standards/`、`docs/examples/standards-glue-consumption-examples.md` 或 `<standards-baseline-paths>`。
  - `spec-project-standards-reviewer` 已提供 review enforcement 形态：引用明写规则、抑制 generic best practices、按 changed file types 匹配 section。
- key_findings:
  - spec-first 已有 standards consumption 概念，但分散在多个 workflow，且主要绑定 host instructions。
  - OpenSpec 有价值的机制是 explicit configuration 和 artifact-scoped rule injection，不是 automatic mining。
  - 之前 `spec-standards` 尝试已经沉淀出重要 trust boundary：只有 confirmed standards 能成为 hard constraints；scripts 不确认 standards。
  - 持久缺口是 governance 和 source shape，不是再做一个 public workflow。
  - 后续讨论把设计要求扩展到 multi-surface scope、standards initialization、lifecycle governance、indexing、high-level architecture/design standards、规范治理元提示词层、自适应扩展动态、authority-tiered autonomy 和 acquisition quality layer。
- limitations:
  - 本计划不验证真实团队采纳。
  - 本计划不为 `hszq-app` 初始化 standards；它提供后续 pilot 可使用的 spec-first 机制。

---

## 上下文与研究

### 相关代码与模式

- `skills/spec-plan/references/governance-boundaries.md` 已说明：已加载 host instruction、目录级等价文件或精确读取 source 中的明写项目规范，在适用于计划文件时可以定义 hard context。
- `skills/spec-work/SKILL.md` 已要求实现阶段把适用于变更文件的明写规范当作 hard context，并把历史计划、经验文档、外部工具事实当作 advisory。
- `skills/spec-write-tasks/SKILL.md` 已说明：明写项目规范只有在适用于变更文件且与 source plan 一致时，才能成为任务约束。
- `skills/spec-code-review/SKILL.md` 的 Stage 3b 已支持从 `CLAUDE.md` / `AGENTS.md` 发现项目规范，leaf reviewer 会自行读取相关章节。
- `agents/spec-project-standards-reviewer.agent.md` 要求精确引用规则证据，并抑制 generic best practices。这正是 confirmed standards 应沿用的 enforcement 姿态。
- `src/cli/state.js` 包含已退役 standards runtime prune 路径，包括 `.spec-first/standards`、`.claude/commands/spec/standards.md`、`.claude/spec-first/workflows/spec-standards`、`.claude/skills/spec-standards`、`.agents/skills/spec-standards` 和 `.codex/commands/spec/standards.md`。
- 现有单测断言 active workflow surface 不再引用 `spec-standards`、`.spec-first/standards/`、旧 examples 或旧 baseline path blocks。

### 历史经验

- `docs/plans/2026-05-21-002-refactor-remove-spec-standards-plan.md` 的结论是：删除 `spec-standards` 时应保留 generic project standards review，但移除 generated baseline artifacts 和 public workflow surface。
- `docs/validation/execution-logs/2026-05-04-spec-standards-loop.md` 记录了一条有价值但实现已退役的经验：只有 confirmed standards 可以成为 hard constraints；observed/imported candidates 必须保持 advisory。本计划保留这条经验，但不恢复旧实现。
- `docs/01-需求分析/11.project-standards/第一层级.md` 主张轻量 shared project-level spec input，用来减少 plan/work/review 前的歧义；同时警告不要引入状态机字段、复杂 rule runtime、评分和自动 closure。
- `docs/03-实施方案/06-开发规范.md` 包含较早的 coding/process norms，可作为首批 `docs/standards/**` 草稿输入，但必须先 review 和规范化，才能成为 confirmed standards。

### OpenSpec 对比

- OpenSpec `openspec/config.yaml` 使用全局 `context` block，并用 `rules` 按 artifact ID 组织规则，例如 `specs`、`tasks`、`design`。
- OpenSpec instruction generation 会把 `context`、`rules`、`template`、`instruction`、output path 和 dependencies 作为独立字段返回；源码注释明确把 `context` 与 `rules` 描述为 AI 约束，而不是输出内容。
- OpenSpec archived rules-injection spec 要求 rules 只注入匹配 artifact、保留规则原文、追加到 schema guidance 而不是替换，并在 instruction loading 时对未知 artifact ID 发出 warning。
- spec-first 应采纳 artifact-scoped selection 和“约束与输出内容分离”的思想，但不应把无类型的 global injection 作为 hard project truth source。

### 业界实践：自动学习规则不是幻想，但通常带治理开关

- Qodo Rule Miner 是最接近“LLM/AI 自动分析、提取、生成规则、甚至自动激活”的公开落地：它从组织 PR discussion、accepted review comments、反复出现的 reviewer feedback 与 accept/reject pattern 中挖掘规则；首轮可按仓库生成规则，后续持续增量；外部产品可选择直接激活规则，但 spec-first 只采纳自动挖掘和 suggestion 机制，不复制绕过 diff review 的自动合入。该实践证明“自动挖掘规范”在 code review standards 场景已经产品化。
- CodeRabbit learnings 会基于团队与 review comment 的交互自动形成 review preferences；其 knowledge base 能承载 repository/organization 级偏好，配置文档称其会形成 dynamic self-improving configuration layer。CodeRabbit 也提供 learning approvals / approval delay，说明业界在自动学习和治理延迟之间提供可调档位。
- GitHub Copilot code review 主要采用显式 custom instructions：repository-wide `.github/copilot-instructions.md` 和 path-specific `.github/instructions/**/*.instructions.md`。它代表“显式规范输入 + path scope”路线，自动提取不是核心，但 scope-filtered instruction 是已被主流平台采用的形态。
- Claude Code 官方 memory 把持久知识分成 CLAUDE.md 和 auto memory：前者是用户显式 instructions，后者是基于 corrections/preferences 自动写入的 notes。它说明“自动沉淀”正在进入 agent runtime，但也说明显式 instructions 仍是更强权威层。
- OpenAI Agents SDK 把 guardrails 和 human review 并列：guardrails 自动校验输入、输出或工具行为；human review 用于敏感动作的 approve/reject。这支持本方案的核心区分：自动检查和自动建议可以非常强，但敏感 authority action 需要单独 gate。
- Anthropic agent evals 建议组合 code-based、model-based 和 human graders。该模式可映射到标准治理：deterministic checks 提供事实，LLM judge 做语义评估，人类/owner 用于校准和高影响裁决。
- OPA / policy-as-code 的行业经验是：一旦 policy 被显式写成 code，就可以自动、稳定、跨栈 enforcement；但 policy 本身不是靠运行时观察默默成为权威。对 spec-first 的启发是：confirmed standard 一旦明确，就应可自动消费；从行为观察到 policy 的提升仍需 authority semantics。
- NIST AI RMF 提供更高层治理语境：AI 风险管理强调 govern / map / measure / manage，以及组织中的责任、监督和风险分配。对本方案而言，owner gate 的本质是 accountability，不是对 LLM 能力的低估。

---

## 关键技术决策

- KTD1. 使用 `docs/standards/**` 作为 confirmed 团队开发规范的一等 source surface。
  - 理由：它可见、可 review、可移植，并且已经位于项目 docs source-of-truth 范围内；同时避免复用已退役的 `.spec-first/standards/` runtime artifacts。
- KTD2. 保留 `AGENTS.md` / `CLAUDE.md` 作为 host instruction 入口，但不把完整规范库塞进去。
  - 理由：host 文件适合承载高优先级 session rules 和指针；较大的 standards 应从 `docs/standards/**` 渐进披露。
- KTD3. 先在 source prose 中定义 trust level，再考虑 machine-readable CLI 支持。
  - 理由：难点是语义权威，不是解析。没有 authority rules 的 CLI 会重演旧 standards artifact 问题。
- KTD4. 规范进入上下文前必须 scope-filter。
  - 理由：大型 app 和长期项目无法注入完整 standards corpus。消费者只需要与当前文件、artifact 或决策匹配的 `applies_to` / `scope` 规则。
- KTD5. `confirmed` 是唯一 hard level。
  - 理由：observed code patterns 可能是偶然、遗留或不一致；imported/suggested rules 需要 human/project owner 确认后才能 enforce。
- KTD6. 通过 `spec-project-standards-reviewer` 扩展 review consumption，不新增 reviewer。
  - 理由：现有 reviewer 已有正确证据纪律：引用规则和 diff line，抑制 generic opinions。
- KTD7. 历史 `spec-standards` 材料只能作为 advisory design input。
  - 理由：当前 tests/source 已有意退役旧 workflow。值得保留的是 trust-aware standards 思想，不是旧 public workflow 或 artifacts。
- KTD8. 用 scope tags 支持多端项目，而不是为每个端复制一套规范。
  - 理由：App、H5、PC、Admin、Backend 等端会共享业务状态、API、权限、错误和埋点契约。复制多份规范会导致漂移；共享规则、跨端规则和端特有差异应通过 `applies_to`、`layer`、`capability`、`workflow` 等标签组合表达。
- KTD9. architecture/design standards 与 coding style standards 分离。
  - 理由：架构边界、分层、业务状态 ownership、跨端契约和 design note 门槛是高优先级工程约束，不应被普通格式、命名或测试偏好稀释；每条都必须能被 review 以 rule ID + 违反证据引用。
- KTD10. lifecycle 和 loading rules 先由文档治理，再考虑工具化。
  - 理由：第一阶段要先证明团队能正确新增、修改、废弃和按需读取规则。过早上 CLI/schema 会制造伪确定性，并容易把候选扫描结果误包装成 confirmed standards。
- KTD11. 把规范治理元提示词层作为“解释与编排层”，不作为规范事实源。
  - 理由：meta-prompt 可以提升 AI 对规范的选择、解释和候选生成质量，但它本身不是 confirmed standards。事实源仍是 `docs/standards/**`，权威合同仍是 `docs/contracts/team-standards.md`。
- KTD12. 把“LLM 自主决策”做成分级自治，而不是一刀切禁止或一刀切放开。
  - 理由：Qodo Rule Miner、CodeRabbit learnings 和 Claude Code auto memory 已证明自动提取规则有落地价值；但 OpenAI guardrails/human review、Anthropic evals、NIST AI RMF 和 OPA policy-as-code 共同指向另一条边界：自动分析可以尽量强，authority 必须按来源、影响面、冲突状态和责任归属分层。
- KTD13. 把“规范获取质量”作为独立层处理，不把它塞进 standards content 或 promotion gate。
  - 理由：规范治理回答“什么能成为权威”，规范消费回答“何时加载和执行”，规范获取回答“从哪里、用什么证据、按什么切片拿到候选”。三者混在一起会让候选生成、权威判断和上下文加载互相污染。
- KTD14. Brownfield 规范初始化必须按 slice 获取，而不是全仓总结。
  - 理由：大型 app/多端项目里，全仓总结容易把历史债、局部例外和过期模式泛化成团队规则。按 capability/surface/risk/churn/incident 切片可以让证据更具体、owner 更明确、迁移成本更可控。

---

## 开放问题

### 规划中已解决

- spec-first 是否应该学习 OpenSpec 的 `context` / `rules`？是，但只学习显式配置和 artifact-scoped selection 思想；不复制 all-context injection，也不把 config text 自动确认为所有 workflow 的 confirmed 规范。
- 代码扫描是否能初始化历史规范？可以，但只能生成候选。它可以基于 source refs 提出 `observed` / `suggested` 条目，不能创建 `confirmed`。
- `docs/specs/<capability>/spec.md` 是否应该存团队开发规范？不应该。capability specs 记录当前产品/系统能力真相；团队开发规范记录工程规则和 workflow 约束。
- 旧 `spec-standards` 是否应该回来？不应该。当前 source 和 tests 已有意退役它。

### 延后到实现

- 精确 standards item 字段名：实现 U1 时在重读当前 docs 风格后，于 `docs/contracts/team-standards.md` 中最终确定。
- 每个 standards 文件是否需要 YAML frontmatter：实现 U1/U2 时按可读性和可测试性决定。
- 是否迁移整个 `docs/03-实施方案/06-开发规范.md`，还是只把它作为历史输入链接：需要先 review 其 stale/valid sections。
- 是否新增 deterministic standards selector script：延后到 docs-first consumption 稳定后再判断。

---

## 产物结构

V1 只创建能被当前 workflow 直接消费和验证的 source；V2 文件按真实 acquisition run 或 pilot 需要创建，避免空账本和无生产者产物提前进入仓库。

```text
docs/
  contracts/
    team-standards.md                 # V1 必建：规范合同
  standards/
    index.md                          # V1 必建：注册表、索引、加载地图
    shared.md                         # V1 必建：跨项目/跨端通用规则或模板
    architecture.md                   # V1 必建：高影响架构规则或模板
    review.md                         # V1 必建：project-standards review 规则
    security.md                       # V1 必建：隐私/安全/secret/path hygiene 最小规则
    cross-surface.md                  # V1 按需：存在跨端规则时创建
    design.md                         # V1 按需：存在设计决策规则时创建
    coding.md                         # V1 按需：有明确 confirmed coding 规则时创建
    testing.md                        # V1 按需：有明确 confirmed testing 规则时创建
    app.md                            # V2/按需：真实 App surface 规则存在时创建
    h5.md                             # V2/按需
    pc.md                             # V2/按需
    admin.md                          # V2/按需
    backend.md                        # V2/按需
    data.md                           # V2/按需
    job-event.md                      # V2/按需
    candidates/
      README.md                       # V1 必建：proposal-only 边界、pre-write gates、轻量 notes
      explicit-rules-inventory.md     # V1 按需：显式来源盘点
      observed-patterns.md            # V1 按需：少量手工候选
      suggested-candidates.md         # V1 按需：少量手工候选
      conflicts.md                    # V1 按需：实际冲突存在时创建
      acquisition-task-pack.md        # V2：真实 acquisition run 后创建
      fact-ledger.md                  # V2
      evidence-quality-ledger.md      # V2
      lineage-ledger.md               # V2
      owner-decision-queue.md         # V2
      output-risk-profile.md          # V2
      source-matrix.md                # V2
      role-interview-notes.md         # V2
      promotion-log.md                # V2
    archive/
      README.md                       # V1 按需：存在退役规则时创建
skills/
  spec-team-standards-governance/
    SKILL.md                          # V1 必建：query/audit/proposal-only skeleton
    references/
      initialization.md               # V1 必建
      meta-prompt-governance.md       # V1 必建
      authority-tiers.md              # V1 必建
      promotion-and-conflicts.md      # V1 必建
      loading-and-consumption.md      # V1 必建
      lifecycle.md                    # V1 必建
      acquisition-quality.md          # V1 轻量，V2 扩展
      output-risk-profile.md          # V1 轻量，V2 扩展
      adaptive-expansion.md           # V1 轻量，V2 扩展
      source-matrix.md                # V2
      role-interview-playbook.md      # V2
      validation-and-replay.md        # V2
    evals/
      README.md                       # V2
      trigger-cases.json              # V2
      output-cases.json               # V2
      examples.json                  # V2 optional examples-as-context
      golden-samples/
        README.md                    # V2 optional replay fixture notes
```

`index.md` 是加载地图；`shared.md`、`architecture.md`、`review.md`、`security.md` 承载 V1 最小规则面；端侧文件只在项目确有对应 surface 且存在 confirmed 规则时创建；`candidates/README.md` 把 proposal-only、pre-write privacy gate、source anchor 和 no-absolute-path 边界先讲清楚。完整获取任务包、fact/evidence/lineage ledger、owner queue、output risk profile、role interview 和 replay eval 都是 V2 真实运行产物，不作为 V1 空模板批量创建。`skills/spec-team-standards-governance/` 是辅助规范工作的 standalone source skill，不能暴露成 `spec-standards`。

---

## Source 权威层级

团队规范治理必须先解决“谁有权定义什么”。否则 `AGENTS.md`、`CLAUDE.md`、`docs/standards/**`、历史方案、能力 spec 和经验文档会互相复制，最终形成多真相源。第一版采用显式层级，而不是让消费者按文件名猜测权威。

| 层级 | Source | 主要内容 | 消费规则 |
|------|--------|----------|----------|
| 1 | `docs/10-prompt/结构化项目角色契约.md` | spec-first 演化判断、source/runtime、Scripts prepare / LLM decides 等最高治理基线 | 只在架构、prompt、workflow、contract、治理取舍时加载；与其他治理 prose 冲突时优先。它不是具体团队规范库。 |
| 2 | 根级 `AGENTS.md` / `CLAUDE.md` | 当前 host 执行指令、高优先级入口规则、语言策略、source/runtime 纪律 | 作为 host instruction hard context；不把全文复制进 `docs/standards/**`，需要复用时以 rule card 的 `source_refs` 指向。 |
| 3 | `docs/contracts/team-standards.md` | team standards 的语义合同：字段、trust、lifecycle、scope、promotion、consumer boundary、rule selection contract | 定义如何解释和消费规范，不承载大量具体规则。 |
| 4 | `docs/standards/**` | 经确认的长期团队规范、端侧差异、高层 architecture/design/coding/testing/review/security 规则 | 只有 `trust=confirmed,lifecycle_state=active` 且 scope 命中的条目能成为 hard project context。 |
| 5 | 目录级 `AGENTS.md` / `CLAUDE.md` 或等价项目规则文件 | 子目录、子系统、子项目的局部执行约束 | scope 更窄时优先于同级通用规则；若与高层 host/root 指令冲突，标记 conflict 并停止 hard enforcement。 |
| 6 | `docs/specs/<capability>/spec.md` | 当前能力行为真相、跨端可观察行为、业务状态、API/错误/权限语义 | 可作为 standards 的 `source_refs` 或 review evidence，但不是团队开发规范 source，不直接产生工程约束。 |
| 7 | `docs/solutions/**`、历史 plan/review/research、旧开发规范 | 可复用经验、历史背景、迁移输入、问题解决记录 | 默认 advisory；只有经 promotion 后才能进入 candidates 或 confirmed standards。 |
| 8 | `docs/standards/candidates/**` | 获取证据、候选、冲突、owner queue、lineage、promotion proposals | 永远不是 hard context；只为 promotion/review/audit 提供证据。 |

冲突处理规则：

- 高层级 source 与低层级 source 冲突时，高层级定义当前消费边界；低层级规则进入 `trust=conflict` 或候选修订，不得 enforce。
- 同层级 source 冲突时，不由消费者自行选择；必须记录 conflict record、owner、affected scope 和 next action，在解决前不作为 hard context。
- 根级 host instructions 中已经明写的高优先级执行纪律，不应整段复制到 `docs/standards/**`；可写成短 rule card，并用 `source_refs` 指回 host source。只有当 canonical ownership 明确迁移到 standards 时，才把规则正文迁移并同步更新 host 指针。
- `docs/standards/index.md` 是索引和摘要，不是凌驾于规则文件之上的新真相源；索引与规则正文不一致时，audit mode 报告 `stale-index`，消费者降级为精确读取 rule source。
- graphify/codegraph、代码扫描、测试形态、review pattern 和 LLM 总结只能提高候选置信度；它们不是 source authority tier 里的 confirmed source。

---

## Standards 与 Capability Spec 边界

`docs/specs/<capability>/spec.md` 与 `docs/standards/**` 都会影响 plan/work/review，但记录的“真相”不同。能力 spec 维护系统当前做什么；团队规范维护团队以后改系统时必须怎么约束自己。二者可以互相引用，但不能互相替代。

| 文档 | 记录什么 | 不记录什么 | 主要消费者 |
|------|----------|------------|------------|
| `docs/specs/<capability>/spec.md` | 当前产品/系统能力真相：用户可见行为、业务状态、API/事件/错误语义、跨端行为差异、已确认约束 | 团队协作流程、代码风格、review 规则、通用架构纪律、规范生命周期 | `spec-prd`、`spec-plan`、`spec-work`、`spec-code-review`、需求/实现 reviewer |
| `docs/standards/**` | 工程约束：分层、依赖方向、状态 ownership、测试策略、review 规则、安全/隐私规则、跨端一致性变更门槛 | 单个能力的完整需求文档、一次需求的验收标准、历史问题流水账 | `spec-plan`、`spec-work`、`spec-write-tasks`、`spec-code-review`、`spec-doc-review`、`spec-debug` |
| `docs/contracts/**` | harness、artifact、workflow、schema、consumer 的契约和边界 | 具体业务能力行为、团队偏好、候选规则 | workflow / CLI / tests / contract reviewers |
| `docs/solutions/**` | 解决过的问题、可复用经验、原因和适用/失效条件 | confirmed team policy、当前能力真相、未验证的规则强制 | `spec-plan`、`spec-work`、`spec-debug`、`spec-compound` |
| `docs/standards/candidates/**` | 候选、证据、冲突、lineage、owner decisions、promotion proposals | 下游 workflow 可直接 enforce 的正式规则 | `spec-team-standards-governance`、owner review、source-edit workflow |

业务系统例子：

- `docs/specs/order-cancellation/spec.md` 记录：订单取消在待支付、待发货、部分发货、退款中等状态下的当前用户可见行为；App/H5/Admin 展示什么按钮；backend API 返回哪些错误码；权限和幂等语义是什么。
- `docs/standards/architecture.md` 记录：改变订单取消状态 ownership、错误语义、权限模型或跨端行为一致性时，必须先有 design note 或 ADR-like decision record，并要求 backend、App/H5/Admin owner review。
- `docs/standards/cross-surface.md` 记录：同一业务能力的错误文案语义、状态名称和可操作性在 App/H5/PC/Admin 之间默认保持一致；若端侧差异存在，必须在 capability spec 和 standards exception 中同时可追踪。
- `docs/solutions/**` 可以记录某次订单取消 bug 的解决经验，例如“状态缓存导致取消按钮误展示”；它可以产生候选规范，但不能自动变成团队政策。

边界判断规则：

- 如果内容回答“系统现在对用户/API/事件表现是什么”，优先进入 capability spec。
- 如果内容回答“以后改这类系统时团队必须遵守什么工程约束”，优先进入 standards。
- 如果内容回答“workflow/artifact/schema 如何交互”，进入 contracts。
- 如果内容回答“这次问题怎么解决、下次如何复用经验”，进入 solutions；只有经过 promotion 才能进入 standards。
- 同一事实跨文档出现时，只允许一处是 source truth，其他位置用 `source_refs` 指向，不复制长段正文。

---

## 规范内容模型

每条 confirmed 规则都应足够小，便于审查；也应足够窄，便于 scope 匹配。第一版可以保持 Markdown-only，但每条规则必须显式暴露这些字段，并把 trust、lifecycle 和 promotion 分成不同语义面：

| 字段 | 用途 | 示例 |
|-------|---------|---------|
| `id` | plan/work/review 可稳定引用的锚点 | `ARCH-STATE-001` |
| `trust` | 权威/消费级别，只决定是否可作为 hard context | `confirmed`, `observed`, `suggested`, `imported`, `conflict` |
| `lifecycle_state` | 规则生命周期，不替代 trust | `active`, `deprecated`, `archived` |
| `promotion_state` | 提升过程状态，不可被 downstream 当 hard context | `none`, `proposed`, `confirmed-draft`, `reviewed`, `rejected`, `deferred` |
| `priority` | 执行权重 | `P0-blocking`, `P1-required`, `P2-guidance` |
| `category` | 规则家族 | `architecture`, `design`, `coding`, `testing`, `security`, `review` |
| `risk_domain` | 高影响域标签（决定是否强制 owner-gate），闭合枚举，可为空 | `auth`, `permission`, `payment`, `funds`, `privacy`, `data-lifecycle`, `state-ownership`, `cross-surface-contract` |
| `applies_to` | 产品端、文件或 workflow scope | `shared`, `app`, `h5`, `pc`, `admin`, `backend`, `job-event`, `data` |
| `layer` | 架构层 | `domain`, `application`, `adapter`, `ui`, `api`, `storage`, `observability` |
| `capability` | 可选能力范围 | `order`, `payment`, `auth`, `portfolio` |
| `owner` | 问责团队/角色（owner_role，owner-gate 路由目标），由脚本自动识别、不手填 | `platform-team`, `mobile-team`, `security-owner` |
| `source_refs` | 证据或决策来源 | `AGENTS.md`, ADR, review report, design note, config file |
| `rule` | 规范正文 | 一句可执行规则 |
| `rationale` | 规则存在原因 | 风险、一致性、可维护性、合规 |
| `enforcement` | 检查方式 | review, tests, lint, plan gate, manual owner review |
| `exceptions` | 允许例外路径 | owner approval, migration window, documented design note |
| `effective_from` | 生效日期或版本 | `2026-06-21` |
| `migration_impact` | 对存量代码的影响 | none, new code only, touched files only, backfill required |
| `invalidation_condition` | 何时复审或退役 | architecture replaced, owner gone, exceptions dominate |
| `last_reviewed` | 新鲜度标记 | `2026-06-21` |

`trust` 表示“能否被消费者当作当前团队规范”；`lifecycle_state` 表示“这条规范在生命周期里是否仍 active”；`promotion_state` 表示“某次候选提升处理到哪一步”。因此 `deprecated` / `archived` 不应作为 trust level，`confirmed-draft` 也不应作为 trust level。硬上下文的最小条件是 `trust=confirmed`、`lifecycle_state=active`、scope 匹配、priority/enforcement 适用。

`promotion_state` 的 canonical 取值集合 `{none, proposed, confirmed-draft, reviewed, rejected, deferred}` 由 `docs/contracts/team-standards.md` 单一定义（single source of truth）；R2、candidate card 和生命周期表只引用、不各自重列。`none` 表示不在提升流程中（直接 confirmed 或纯 advisory 规则）；`candidates/**` 的 candidate card 因已在流程中，`promotion_state` **禁用 `none`**（最低为 `proposed`）。

`owner`（owner_role）不手填，由确定性 owner-resolver 按规则所辖路径（`source_refs`/`applies_to`→目录）解析，precedence：`CODEOWNERS` → `docs/standards/index.md` 的 Owner Registry → 目录级 `AGENTS.md`/`CLAUDE.md` ownership → ADR/design note owner → git blame top committer advisory → `unresolved`。本仓当前不应假设存在 CODEOWNERS/OWNERS，因此 Owner Registry 是 V1 必须支持的项目内显式 owner 来源；git-blame 命中只能作为 `owner_candidate`，不是有效 owner。`owner=unresolved` 是合法字段值，不是校验失败；但 `high_impact && owner=unresolved` 必须 fail-closed：promotion_state 只能是 `deferred`，不得进入 `confirmed-draft`、不得 enforce、不得生成 confirmed patch，下一步必须是显式指派 Owner Registry 条目或补 ADR/design note owner。`~/.spec-first/.developer` 只能作为 proposer/author 默认值，不可自动成为 rule owner；小团队若要把当前维护者作为 owner，必须在 Owner Registry 中显式 opt-in。`invalidation_condition: owner gone` 由重跑解析确定性触发（registry 条目删除、目录 ownership 删除或 ADR/design note owner 失效）。

候选规则与 promotion proposal 需要比 confirmed rule 多保留获取过程字段，避免后续 reviewer 只看到抽象结论而无法判断证据质量。V1 candidate card 至少包含：

| 字段 | 用途 |
|-------|------|
| `candidate_id` | 候选规则稳定锚点，提升后可写入 promotion log。 |
| `candidate_type` | `explicit-rule`, `observed-pattern`, `suggested-rule`, `imported`, `conflict-record`, `promotion-proposal`。 |
| `authority_tier` | `explicit-authority`, `machine-enforced-policy`, `inferred-from-code`, `repeated-review-or-incident`, `multi-source-high-confidence`, `high-impact-governance`, `conflict-present`。 |
| `source_refs` | 可复核来源；provider 输出必须标记 `provider_untrusted` 并回到 source/test/doc/log 确认。 |
| `privacy_review` | 是否经过隐私/敏感信息检查。 |
| `redaction_status` | `not-needed`, `redacted`, `needs-redaction`, `blocked`。 |
| `promotion_state` | `proposed`, `confirmed-draft`, `reviewed`, `rejected`, `deferred`。 |
| `promotion_decision` | `keep-advisory`, `prepare-confirmed-patch`, `merge-confirmed-after-review`, `rejected`, `deferred`, `conflict`。 |
| `owner` | resolved owner id 或 `unresolved`；high-impact unresolved fail-closed。 |
| `why_not_confirmed` | 当前不能进入 confirmed 的原因。 |
| `prewrite_gate` | secret/PII/absolute-path/prompt-injection gate 的结果摘要。 |

V2 candidate card 再追加 `acquisition_id`、`evidence_quality`、`source_anchor`、`replay_status`、`owner_edit_distance` 和 lineage 字段。V1 不要求创建 acquisition task pack 或 evidence ledger 才能记录少量 proposal-only 候选。

`promotion-proposal` 不是 init/propose 阶段的初始分类结果，而是 promote 阶段从候选生成的 proposal 产物类型。初始 classify 只产出 `explicit-rule`、`observed-pattern`、`suggested-rule`、`imported` 或 `conflict-record`；`promotion-proposal` 必须带 gate results、decision trace 和 diff-review handoff。

`confirmed-draft` 是 promotion state，不是 trust level 的 hard-context 等价物。它表示 agent 已基于 explicit authority、mechanical enforcement 或多源高置信证据生成可审查 patch/proposal；只有该 patch 在 active `spec-work` 或等价 source-edit workflow 中经普通 diff review 合入、更新 CHANGELOG/测试并标为 `trust=confirmed,lifecycle_state=active` 后，下游 workflow 才能 enforce。

### 字段分类与校验来源

为让结构校验器（见 U1/U13）确定性判定每个字段，且不与 A6（surface 不得硬编码成所有项目的固定枚举）冲突，上述 rule-card 与 candidate-card 字段按三类处理，每类的合法值来源不同：

| 类别 | 字段 | 合法值来源 / 校验方式 |
|------|------|----------------------|
| **global-enum**（跨项目固定，校验器查合同枚举） | V1: `trust`、`lifecycle_state`、`promotion_state`、`priority`、`category`、`enforcement`、`migration_impact`、`candidate_type`、`authority_tier`、`redaction_status`、`promotion_decision`、`next_action`、`risk_domain`；V2: `replay_status` | 取值由 `docs/contracts/team-standards.md` 的 canonical 枚举段单一定义（single source of truth；`promotion_state` 与各 decision 词表的最终收敛由后续单元完成）。其中 `category`、`enforcement`、`migration_impact`、`risk_domain` 在本计划收为闭合：`category ∈ {architecture, design, coding, testing, security, review}`；`enforcement ∈ {review, tests, lint, plan-gate, manual-owner-review}`；`migration_impact ∈ {none, new-code-only, touched-files-only, backfill-required}`；`risk_domain ∈ {auth, permission, payment, funds, privacy, data-lifecycle, state-ownership, cross-surface-contract}`（可经 index 注册表项目扩展）。 |
| **project-enum**（项目内闭合，取值由项目声明，解 A6） | `applies_to`(surface)、`layer`、`capability` | 取值由 `docs/standards/index.md` 的 **Surface / Layer / Capability Registry** 块按项目声明；校验器查该项目注册表的成员资格，不硬编码跨项目固定集合。项目可在注册表内扩展合法值（闭合但可扩）。 |
| **format-free**（只查格式/存在） | V1: `id`、`source_refs`、`effective_from`、`last_reviewed`、`owner`、`rule`、`rationale`、`exceptions`、`invalidation_condition`、`candidate_id`、`privacy_review`、`why_not_confirmed`、`prewrite_gate`；V2: `acquisition_id`、`evidence_quality`、`source_anchor`、`owner_edit_distance` | `id` 用稳定 ID 正则（例如 `ARCH-STATE-001` 形态）；`source_refs` 必须 repo-relative 且禁本机绝对路径；`effective_from`、`last_reviewed` 为日期；`owner` 允许 resolved owner id 或 `unresolved`，有效性由 owner-resolver 与 high-impact fail-closed 规则判定；其余为非空文本或结构摘要。 |

校验器据此消费三个取值来源：global-enum 查合同枚举、project-enum 查 `index.md` 注册表、format-free 查格式规则。这同时解决 A6 冲突（surface 由项目声明、校验器查注册表而非硬编码）并让全量结构校验可落地。

V1 rule-card 序列化格式固定为 Markdown section + YAML metadata fenced block，避免实现期继续悬空：

````markdown
### ARCH-STATE-001 Backend Owns Business State

```yaml
id: ARCH-STATE-001
trust: confirmed
lifecycle_state: active
promotion_state: none
priority: P0-blocking
category: architecture
risk_domain: state-ownership
applies_to: [backend, app, h5, pc, admin]
layer: [domain, api, ui]
capability: [order]
owner: platform-team
source_refs:
  - docs/standards/index.md#owner-registry
enforcement: [plan-gate, review]
effective_from: 2026-06-21
migration_impact: touched-files-only
last_reviewed: 2026-06-21
```

Rule: Backend is the source of truth for order state transitions; clients may cache or render state but must not independently decide final business state.

Rationale: ...
Exceptions: ...
Invalidation condition: ...
````

结构校验器 V1 若实现，文件建议为 `scripts/check-team-standards.js`，只做确定性检查：枚举合法性、Owner Registry 命中、high-impact unresolved fail-closed、index↔rule 双向一致性、source_refs 路径卫生和 pre-write privacy/path gates。它不判断规则是否“好”，不做语义 promotion；规则质量仍由 LLM/reviewer 判断。若实现期决定继续 docs-first 不写脚本，则必须保留最窄 grep/string contract tests，不能在文档里声称已有完整 parser/validator。

首批文档应包含这类业务系统示例，但这些示例默认是 rule template 或 `suggested` candidate；只有具备当前权威 source、owner、scope、例外和冲突检查后，才能写成 `confirmed`：

- `ARCH-STATE-001`: backend 是订单、支付、持仓等业务状态的事实源；App/H5/PC/Admin 可以缓存或渲染状态，但不能独立决定最终业务状态。适用于 `backend`、`app`、`h5`、`pc`、`admin`、`data`；对 stateful flows 在 plan/review 中 enforce。
- `ARCH-DEPENDENCY-001`: dependency direction 从 UI/adapter layers 指向 application/domain contracts；domain code 不得 import UI、host runtime 或 transport adapters。该规则跨 surface 适用，并可在 code review 中 enforce。
- `DESIGN-NOTE-001`: 改变 API contracts、business state ownership、permission model、event semantics 或 cross-surface behavior 的变更，在进入实现前必须有 design note 或 ADR-like decision record。这是 planning rule，不是 coding-style rule。
- `CROSS-ERROR-001`: 同一 business capability 的 user-visible error semantics 必须在 App/H5/PC/Admin 保持一致，除非 standard 记录了 surface-specific exception。

这些示例刻意保持具体。类似“保持高内聚低耦合”的规则不可直接进入 confirmed standards，除非改写成带 scope、违反条件、owner 和例外路径的可执行边界。

---

## 生命周期治理

规范需要显式生命周期，因为 confirmed 规则会给 workflow 带来真实约束压力。合同应同时定义 trust、lifecycle state、promotion state 和流转触发条件：

| 维度 | 状态 | Workflow 影响 |
|-------|------|-----------------|
| `trust` | `suggested` | 来自 LLM/review/research 的 advisory candidate；绝不是 hard constraint。 |
| `trust` | `observed` | 从 code/config/history 观察到的模式；是有用证据，不是政策。 |
| `trust` | `imported` | 从外部或 team pack 引入待评审的规则；本仓接受前不可 enforce。来源（team pack）在 v1 延后（见范围边界），v1 不产出/消费 `imported`，仅保留枚举位以稳定 taxonomy 与 glossary 登记；校验器接受该值，但 v1 出现实际 `imported` 条目时告警。 |
| `trust` | `conflict` | 存在竞争规则或 source 矛盾；消费者必须暴露冲突并避免 hard enforcement。 |
| `trust` | `confirmed` | 同时满足 `lifecycle_state=active`、scope 匹配且 priority/enforcement 适用时，成为 hard project context。 |
| `promotion_state` | `confirmed-draft` | 可审查的 promotion patch/proposal；必须保留 source refs、tier reason、conflict check 和 review 状态；不可作为 hard context。 |
| `lifecycle_state` | `deprecated` | 为迁移上下文保留的历史规则；除非 migration note 明说，否则不约束新工作。 |
| `lifecycle_state` | `archived` | 退役期后移出 active index，但保留 traceability。 |

出现下列情况时应新增规范：

- 同一 review 问题或 agent 错误反复出现；
- 业务行为、权限、错误、API、埋点、支付、隐私或安全存在跨端一致性要求；
- 架构边界或状态 ownership 影响大，且 AI 容易猜错；
- 某个实践已经稳定、经过 review，并且有明确 owner；
- 事故或生产缺陷产生了可复用的预防规则；
- 新人或 coding agent 反复需要同一条非显然项目约束。

以下情况不应新增规范：只是个人偏好、已完全由 lint 覆盖且没有语义决策、只服务一次任务、抽象口号、缺少 owner/scope/enforcement、重复现有规则，或只是未确认的代码扫描观察。

当新增技术或产品端、scope 过宽/过窄、例外变多、review 争议反复出现、实践偏离规则，或 workflow 错误消费规则时，应修改规范。

当技术或架构已消失、被其他规则替代、例外占主导、enforcement ROI 为负、规则无法评估或 owner 不再存在时，应 deprecate 而不是静默删除。预期路径是 `confirmed` -> `deprecated` -> `archived`，并由 `promotion-log.md` 或等价历史记录原因。

冲突解决程序：进入 `trust=conflict` 的规则必须终结于一个明确出口，不得长期停留。V1 在 `docs/contracts/team-standards.md` 新定义 standards conflict precedence，不复用 PRD contradiction handling 作为权威来源：`owner/ADR/design note decision` > `confirmed` 高层 source > `confirmed` 更窄 scope > explicit-authority draft > machine-enforced evidence > observed/suggested/imported candidate；同级再比 `authority_tier`、source freshness 和 scope specificity；两条都 confirmed 且真矛盾时强制 owner decision。`skills/spec-prd/references/evidence-and-topology.md` 只能作为 evidence-tag 与 candidate-boundary 的设计参考，不提供 standards authority-tier precedence 或出口集。解决结果限定为：`superseded`（胜者留 confirmed，败者 `deprecated` + `superseded_by` -> archive）、`scoped-split`（收窄 `applies_to` 使不再重叠）、`merged`（合并为一条）、`deferred`（显式停放 + owner + 复审日期）、`both-rejected`。V1 可把解决过程写入 rule card 的 decision trace 或 `candidates/conflicts.md`；V2 再同步到 `lineage-ledger.md` 与 `promotion-log.md`。

---

## 按需加载与索引

规范层要解决的是上下文选择，而不是制造新的上下文大块。默认加载逻辑应为：

1. 读取 `docs/contracts/team-standards.md`，获得 authority semantics。
2. 读取 `docs/standards/index.md`，获得 rule index 和 file map。
3. 从当前 workflow 推导 query tags：`surface`、`layer`、`capability`、`category`、`workflow`、changed paths 和 priority。
4. 只打开匹配的 standards 文件，并且只读取当前 plan/work/review/debug slice 需要的规则。
5. 将匹配的 `confirmed` 规则视为 hard context；只有 workflow 明确需要 advisory initialization evidence 时才纳入 `observed` / `suggested`。
6. 在 plan decisions、task constraints、code-review findings 或 work closeout 中引用 rule IDs 和 source refs。

因此，`docs/standards/index.md` 应保留一张紧凑索引表：

| 规则 ID | Trust | Priority | Category | Applies To | Layer | Capability | Workflow | File | Owner |
|---------|-------|----------|----------|------------|-------|------------|----------|------|-------|
| `ARCH-STATE-001` | `confirmed` | `P0-blocking` | `architecture` | `shared,backend,app,h5,pc,admin,data` | `domain,api,ui` | `*` | `plan,work,review` | `architecture.md` | `platform-team` |

此外，`docs/standards/index.md` 必须包含一个 **Surface / Layer / Capability Registry** 块，按项目声明本仓合法的 `applies_to`(surface)、`layer`、`capability` 取值集合（见「规范内容模型 / 字段分类与校验来源」）。结构校验器对这些 project-enum 字段查该注册表的成员资格，而非硬编码跨项目集合；项目可在注册表内扩展合法值（闭合但可扩，满足 A6）。

结构校验器（不仅运行时 audit）还强制 index↔规则文件一致性：每条 `trust=confirmed,lifecycle_state=active` 规则在 index 有且仅有一行、其 `file` 指向存在且含该 ID 的文件（双向完整性），且 index 行的 trust/priority/category/applies_to/layer/capability/owner/file 必须等于 rule card 字段（card 为 SoT，index 为受治理 derived artifact）。运行时 `stale-index` 降级只是兜底，不替代 CI 阻止漂移上线。

消费者默认不能全量读取 `docs/standards/**`。如果 index 缺失或过期，workflow 应响亮降级到当前 host instructions 和精确 source reads，而不是发明规范或扫描整个目录树。

---

## Rule Selection Contract

规则选择需要成为轻量合同，而不是散落在各 workflow prompt 里的口头习惯。它的目标不是把语义判断脚本化，而是让每次加载规范都有可解释输入、输出、降级原因和限制。

最小输入：

```yaml
input:
  workflow: plan | work | write-tasks | code-review | doc-review | debug | standards-query
  artifact_type: requirements | plan | task-pack | diff | review-report | debug-report | candidate | unknown
  changed_paths: []
  declared_surface: []      # app, h5, pc, admin, backend, data, shared, unknown
  declared_layer: []        # ui, api, domain, adapter, storage, observability, unknown
  declared_capability: []   # order, payment, auth, portfolio, *
  changed_file_types: []    # source, test, docs, config, migration, generated-runtime
  source_refs: []           # plan/spec/task/review/source evidence refs
  requested_rule_ids: []    # optional explicit user/workflow request
```

最小输出：

```yaml
output:
  matched_rule_ids: []
  matched_files: []
  excluded_rule_ids: []
  uncertainty_reason: null
  fallback_mode: null
  limitations: []
  source_refs_used: []
```

选择算法：

1. 读取 `docs/contracts/team-standards.md`，确认 authority semantics 和 selection contract。
2. 读取 `docs/standards/index.md`，只使用索引中的 summary、tags、file refs 和 freshness hints。
3. 根据 `workflow`、`artifact_type`、`changed_paths`、declared scope、file types 和 explicit `requested_rule_ids` 形成 query tags。
4. 优先匹配 `trust=confirmed,lifecycle_state=active`、scope 命中、priority/enforcement 适用的规则。
5. 只读取 `matched_files` 中必要 section；unknown scope 只读取 safe defaults 和高优先级 summary，不打开全库。
6. 对每个排除项记录原因，例如 scope mismatch、lifecycle inactive、trust advisory、conflict present、priority not applicable、workflow not applicable。
7. 输出 limitations，说明未读哪些 source、哪些 scope 不确定、是否发生 fallback。

Prompt injection 边界：confirmed rule text 即使来自 `docs/standards/**`，在下游 prompt 中也必须作为 data payload 处理，而不是与 system/developer/host instructions 同优先级拼接。handoff 应使用 fenced block、rule ID、source refs 和明确标签隔离规则正文；review 需要检查规则正文中是否包含“忽略上层指令”“修改 runtime mirror”“跳过验证”等越权指令式文本。若发现这类文本，规则进入 `conflict` 或 `needs-sanitization`，不得作为 hard context 注入。

Fallback modes：

| mode | 触发条件 | 允许行为 | 禁止行为 |
|------|----------|----------|----------|
| `index-missing` | `docs/standards/index.md` 不存在 | 读取 contract、host instructions 和用户显式 rule refs；提示需要建立 index | 扫描整个 `docs/standards/**` 当作替代索引 |
| `stale-index` | index 与 rule files freshness/hash/anchor 不一致 | 读取被请求或高优先级的精确 rule file，并输出 audit finding | 静默信任过期索引 |
| `scope-uncertain` | surface/layer/capability 无法从输入判断 | 只加载 shared/high-priority safe summary，并要求 workflow 用 direct source evidence 补判断 | 预设所有 surface 都适用 |
| `no-matching-rule` | index 中没有匹配项 | 输出 empty match 和 limitations；必要时生成 `suggested` candidate | 发明规范或引用 generic best practice |
| `conflict-present` | 命中规则存在冲突 | 输出 conflict refs、owner/next action；停止 hard enforcement | 在冲突规则中任选一条 enforce |
| `contract-missing` | `team-standards.md` 不存在 | 降级到 host instructions 和 direct source reads | 把 standards 文件当无合同 hard context |

这个合同应被 `spec-plan`、`spec-work`、`spec-write-tasks`、`spec-code-review`、`spec-doc-review`、`spec-debug` 和 `spec-team-standards-governance query` 共同遵守。它可以由 LLM 执行，也可以后续由脚本生成 advisory selection facts；但最终“当前任务应如何理解这些规则”的语义判断仍归 workflow orchestrator。

---

## 规范治理元提示词层

规范治理需要单独的 meta-prompt layer。它不是具体规范，不是 source of truth，也不是自动审批器；它是 AI 在处理规范时的解释与编排规则，决定如何从当前任务中提取 scope、如何查找命中规范、如何判断 trust、如何输出候选、如何触发生命周期动作，以及如何把规范结果交给现有 workflow。

层级关系如下：

```text
元治理层
  └─ docs/10-prompt/结构化项目角色契约.md、AGENTS.md、using-spec-first
     定义最高边界：source/runtime、Scripts prepare, LLM decides、workflow routing

规范治理元提示词层
  └─ skills/spec-team-standards-governance/SKILL.md
     定义如何解释、选择、加载、候选生成、提升、废弃、审计规范

规范合同层
  └─ docs/contracts/team-standards.md
     定义 rule fields、trust level、owner、enforcement、lifecycle、loading contract

规范内容层
  └─ docs/standards/**
     记录 shared、cross-surface、architecture、design、app、h5、pc、admin、backend 等具体规则
```

元提示词层负责：

- 从用户请求、workflow、changed paths、artifact type、surface、layer、capability 中抽取 scope。
- 按 `docs/contracts/team-standards.md` 分别判断 trust（`confirmed`、`observed`、`suggested`、`imported`、`conflict`）、lifecycle（`active`、`deprecated`、`archived`）和 promotion（`confirmed-draft` 等）的使用方式。
- 先读 `docs/standards/index.md`，再读取命中的 rule files，不默认加载全量 `docs/standards/**`。
- 解释 confirmed 规则如何影响 plan/work/review/debug，但不发明产品需求。
- 把重复 review issue、incident、implementation drift、cross-surface inconsistency 转成 `suggested` 或 `observed` candidate。
- 发现 owner 缺失、规则冲突、scope 过宽、规则过期时，输出 audit 或 conflict，而不是静默忽略。
- 为 `spec-plan`、`spec-work`、`spec-code-review`、`spec-doc-review`、`spec-debug` 生成过滤后的 handoff：rule IDs、short rule text、source refs、exceptions、limitations。

元提示词层禁止：

- 未经 authority tier 自动把 candidate 提升为 `confirmed`。
- 自行修改 `docs/10-prompt/结构化项目角色契约.md`、`AGENTS.md`、using-spec-first route map 或 public workflow catalog。
- 把代码扫描、graphify/codegraph、历史 docs、LLM 总结直接当作 confirmed source。
- 通过 runtime mirrors 修复规范行为。
- 把 generic best practice 包装成项目规范 finding。

### 自适应扩展动态

自适应扩展只允许发生在候选、冲突、审计和加载选择层，不允许自动改变 confirmed truth。

```mermaid
flowchart TD
  A[当前任务或 workflow] --> B[抽取 scope: surface/layer/capability/workflow/changed paths]
  B --> C[读取 team-standards contract]
  C --> D[读取 standards index]
  D --> E[加载命中的 confirmed rules]
  E --> F[plan/work/review/debug 执行]

  F --> G{发现规范缺口?}
  G -->|重复 review 问题| H[生成 suggested candidate]
  G -->|代码/架构稳定模式| I[生成 observed candidate]
  G -->|规则互相矛盾| J[生成 conflict record]
  G -->|owner 失效或规则过期| K[生成 audit/deprecate 建议]
  G -->|无缺口| L[只记录已使用 rule refs]

  H --> M[docs/standards/candidates]
  I --> M
  J --> M
  K --> M
  M --> N{authority tier / owner review}
  N -->|tier 允许或确认| O[confirmed patch proposal]
  O --> R[active source-edit workflow + diff review]
  R --> S[confirmed rule + index update]
  N -->|拒绝或延后| P[保留 candidate/advisory]
  N -->|冲突未解| Q[保持 conflict 不 enforce]
```

自适应动态的输出等级：

| 输出 | 触发 | 可否 enforce |
|------|------|--------------|
| filtered rule refs | 当前任务 scope 命中 confirmed rules | 可以，限 scope 内 |
| `suggested` candidate | 重复问题、review finding、incident、AI 常猜错 | 不可以 |
| `observed` candidate | 代码/配置/测试中稳定出现的模式 | 不可以 |
| `conflict` record | 规范互相冲突或 source 互相矛盾 | 不可以，必须先解决 |
| audit report | owner 过期、字段缺失、index drift、scope 过宽 | 不可以，作为治理输入 |
| confirmed patch proposal | owner confirmation 或 explicit authority 后的提升草案 | 不可以；合入为 `trust=confirmed,lifecycle_state=active` 后才按 scope enforce |

---

## V2 规范高质量获取层

当前方案的核心补强点是：不要把“能生成规范”误认为“高质量获得规范”。但完整规范获取层属于 V2 evidence-gated 扩展，不阻塞 V1 source/consumption/review 路径。V1 只保留轻量候选入口、pre-write gate、why-not-confirmed 和 owner fail-closed；下面 18 项机制在真实 pilot、样本、owner 和隐私边界具备后再逐步落地。

| 问题 | 风险 | 方案补强 | 对应产物 |
|------|------|----------|----------|
| 1. 获取范围不清 | LLM 做成全仓泛化总结，噪音大且不可 review | 引入 acquisition task pack，先声明 repo、capability、surface、time window、source、privacy、non-goals | `acquisition-task-pack.md` |
| 2. 证据质量不一 | 旧文档、历史债、临时模式被同等对待 | 每条候选规则带 evidence quality score 和 source refs，不达阈值保持 advisory | `evidence-quality-ledger.md` |
| 3. 来源类型混杂 | 显式规范、代码观察、review 偏好、事故教训被混成一个权威等级 | 建立 source matrix，定义每类来源最多能产生的 trust/tier | `source-matrix.md` |
| 4. 大型存量项目太大 | 全仓初始化成本高、上下文膨胀、owner 不清 | 按 capability/surface/risk/churn/incident 切片获取 | `initialization.md` |
| 5. 代码无法表达组织规则 | 只能提取“怎么写”，漏掉“为什么”和“谁负责” | 加角色化访谈 playbook，补架构、安全、测试、SRE、端侧、后端、数据、业务 owner 的隐性规范 | `role-interview-playbook.md` |
| 6. 规则不可执行 | 形成口号、风格偏好、抽象原则 | confirmed 前跑 rule quality checklist：atomic/actionable/falsifiable/scoped/examples/exceptions/owner/invalidation/migration | `acquisition-quality.md` |
| 7. 低质量内容进入规范 | 个人偏好、临时 workaround、旧架构残留、低频例外被沉淀 | 建立反例库和 do-not-promote list | `acquisition-quality.md` |
| 8. 冲突处理不完整 | 多端规则互相覆盖，review 时各执一词 | 获取阶段即记录 conflict density、override source 和 resolution options | `conflicts.md` |
| 9. 隐私和敏感信息泄漏 | PR、事故、业务文档中的敏感细节被写入可复用规范 | 获取任务包声明 redaction policy，候选只保留抽象规则和必要 source refs | `acquisition-quality.md` |
| 10. 自动化价值无法证明 | 规范写完但 agent 不加载、review 不命中 | 用 retrieval eval 验证任务切片能否命中正确规则 | `validation-and-replay.md` |
| 11. 规范是否减少 review 成本不可见 | 新规则可能只增加审查噪音 | 用历史 PR replay 观察误报、漏报、owner 修改量和 finding 可采纳率 | `validation-and-replay.md` |
| 12. 候选队列长期膨胀 | candidates 变成新垃圾场 | 定义 candidate aging、merge、reject、archive 和 re-review cadence | `lifecycle.md` |
| 13. 团队采纳弱 | 没有人知道何时用、如何纠错 | 用户文档给出获取流程、owner review、例外和反馈入口 | 用户手册 |
| 14. 多端混跑导致边界不清 | 一次获取混合 App/H5/Backend/Admin，规则 scope 和 owner 混乱 | 每次运行绑定唯一 extraction target，并拒绝 mixed-surface formal promotion | `acquisition-task-pack.md` |
| 15. 事实证据不可复核 | 只记录“从代码看出”，后续 reviewer 无法定位 | 引入 source anchor：snapshot、path hash、file、line range、snippet hash | `evidence-quality-ledger.md` |
| 16. 质量门禁只靠 prose | 规则可执行性、抽象层次、冲突、派生关系没有统一判定 | 引入 Evidence/Actionability/Abstraction/Conflict/Risk/Derivation/Anchor gates | `acquisition-quality.md` |
| 17. AI rules / review checklist 漂移 | 下游给 agent 的规则和正式标准不一致 | 规定 AI rules 与 review checklist 只能从 confirmed standards 派生 | `loading-and-consumption.md` |
| 18. 输出失败模式不透明 | 低置信规则静默 active、owner queue 变垃圾桶、绝对路径泄漏 | 建立 output risk profile 和 missing evidence section | `output-risk-profile.md` |

### 单目标获取运行契约

借鉴 `project-standard-extractor` 的单目标边界，每次规范获取运行必须绑定一个明确 target，不能在同一批次里混合多个端或多个无关能力。spec-first 的获取任务包应包含：

| 字段 | 说明 |
|------|------|
| `target_repo` | 本次获取对应的单仓或明确子仓。 |
| `extraction_target.surface` | `shared`、`app`、`h5`、`pc`、`admin`、`backend`、`job-event`、`data` 等。 |
| `extraction_target.sub_domain` | 可选技术域或端内形态，如 `java-spring`、`react-admin`、`flutter-app`、`kmp-app`。 |
| `capability` | 业务能力 slice，如 `auth`、`payment`、`order`、`portfolio`。 |
| `project_paths` | 只读项目路径或 repo-relative roots。 |
| `scope.include` / `scope.exclude` | 文件包含/排除规则，默认排除 generated、build、dist、vendor、runtime mirrors。 |
| `output.mode` | V1 轻量候选入口固定为 `candidate-only` 或 `promotion-proposal`；V2 acquisition run 也不得 silent write confirmed。 |
| `constraints` | 隐私、敏感文件、owner_required、high-risk categories、provider availability 等限制。 |

如果输入显著跨端或跨多个无关能力，skill 应停止并要求拆成多个 acquisition task pack。大型项目的正确姿态是多次小批量获取，而不是一次全仓抽取。

### 获取执行流水线

规范获取内部可以采用 8 阶段流水线，但每一层的 authority 不同：

```mermaid
flowchart TD
  A[Intake & Scope] --> B[Repo/Slice Profile]
  B --> C[Deterministic Fact Collection]
  C --> D[Pattern Mining]
  D --> E[Rule Synthesis]
  E --> F[Quality Gates]
  F --> G[Decision Trace + Promotion Proposal]
  G --> H[Publisher: candidates/evidence/report]
  G --> P[Patch preview: index/lineage/owner queue]
  H --> I{Promote?}
  I -->|confirmed-draft| J[普通 diff review]
  I -->|conflict/high-risk| K[Owner queue patch preview]
  I -->|draft/refine| L[继续收证或改写]
  J --> M[confirmed standards]
```

流水线边界：

- Intake/Profile 只确认 target、scope、batch plan、blind spots，不创建规则。
- Fact collection 只产事实和 source anchors，不写规范正文。
- Pattern mining 只聚合同类事实、正反例和冲突信号，不激活规则。
- Rule synthesis 可以生成 rule candidate、AI rule draft 和 review checklist draft，但必须只引用已有 fact IDs。
- Quality gates 只产 gate results、confidence signals 和 next action，不把模型置信度升级成组织授权。
- Publisher 在 standalone/report-only 模式只输出 candidates、evidence 和 patch preview；只有 active source-edit workflow 接管后，才可把 candidates/ledger/index/lineage/owner queue 写入 source。confirmed standards 仍必须经 promotion、diff review、CHANGELOG 和 focused tests 合入。

### 来源矩阵

| 来源 | 可提取内容 | 最高默认 trust/tier | 必须补充的证据 |
|------|------------|---------------------|----------------|
| 明写项目文档 | 已声明规则、owner、scope、例外 | `explicit-authority` / `confirmed-draft` proposal | 冲突检查、last_reviewed；合入 `confirmed` 前必须经 diff review |
| lint/CI/test/schema config | 已机械执行的约束 | `machine-enforced-policy` / confirmed enforcement mirror | 命令或配置 evidence、适用 scope |
| ADR/design note | 架构决策、状态 ownership、依赖方向 | `explicit-authority`，高影响仍需 owner/ADR trace | 当前有效性、替代方案、invalidation |
| PR review comments | 反复出现的团队偏好和错误模式 | `repeated-review-or-incident` / `suggested` | 多次出现、accepted/rejected pattern、反例 |
| incident/postmortem | 事故预防规则 | `suggested`，高影响需 owner gate | root cause、预防机制、迁移影响 |
| 代码结构和 graph/code evidence | 实际模式、目录边界、依赖方向 | `inferred-from-code` / `observed` | 反例扫描、是否历史债、owner 确认；graphify/codegraph 必须标记 `provider_untrusted`、记录 freshness，并回到 source/test/doc/log 确认后才能用于 promotion evidence |
| 测试布局和 fixtures | 质量门槛、边界用例、数据契约 | `observed` 或 `machine-enforced-policy` | 测试是否当前有效、覆盖范围 |
| onboarding/agent 误判记录 | 缺失规范候选 | `suggested` | 重复性、影响面、是否已有规则覆盖 |
| 角色化访谈 | 隐性规则、例外、责任边界 | `suggested` 或 explicit owner decision | 访谈对象角色、确认记录、冲突项 |

### 获取质量评分

每条候选规则除了 `confidence_score`，还应有证据质量维度。评分不要求 V2 第一轮自动计算，但字段和解释必须存在：

| 维度 | 关注点 | 低分含义 |
|------|--------|----------|
| `source_strength` | 来源是否明写、可追溯、可复核 | 只有模型总结或单次观察 |
| `recency` | 来源是否仍代表当前工程 | 过期文档、旧架构、废弃模块 |
| `consistency` | 多来源是否一致 | 不同端/不同文档说法冲突 |
| `coverage` | 规则覆盖面是否足够清楚 | 只在一个样例出现却被泛化 |
| `conflict_density` | 冲突和例外数量 | 例外太多，不应 confirmed |
| `enforcement_feasibility` | 能否 review/test/lint/audit | 只能靠主观判断 |
| `owner_trace` | 是否知道谁负责 | owner 不明或已失效 |
| `migration_cost` | 存量影响是否可控 | 需要大范围重构但未说明窗口 |
| `risk_level` | 违反规则的后果 | 高风险但缺 owner gate |
| `retrieval_value` | agent 是否会在正确场景命中 | 规则太泛或索引标签不足 |

证据质量评分不能独立提升 trust。尤其是 graphify/codegraph、历史文档、LLM 总结和 docs/solutions recall，只能缩小后续读取范围或提供候选解释；promotion 结论必须回到当前 source、test、doc、log、配置、owner decision 或 ADR/design note。

### Source Anchor 与证据可复核性

每条 deterministic fact 和候选规则都需要可复核锚点。V1 candidate 只要求 source refs 和 missing evidence reason；V2 acquisition run 再要求完整 source anchor 字段：

| 字段 | 说明 |
|------|------|
| `source_type` | `git`、`filesystem`、`doc`、`config`、`review-log`、`incident-log`、`provider_untrusted`。 |
| `snapshot_id` | Git commit、文件系统快照 ID、文档版本或运行 ID。 |
| `path_hash` | 项目根或来源路径 hash，用于避免输出本机绝对路径。 |
| `file` | repo-relative 或 source-relative 文件路径。 |
| `line_range` | 最小可定位行号范围。 |
| `snippet_hash` | 证据片段 hash，用于后续漂移检测。 |
| `fact_id` | 当前 acquisition run 内稳定事实 ID。 |
| `scope` | `main`、`test`、`docs`、`config`、`unknown`。 |

正式输出不得包含本机绝对路径。非 Git 项目也可以作为输入，但必须有 `snapshot_id + path_hash + file + line_range + snippet_hash`，否则只能作为 low-confidence advisory note。

### 规则质量门禁

规则从 candidate 进入 `confirmed-draft` 前，需要经过明确 gate。gate 结果是 promotion evidence，不是最终组织授权。

| Gate | 检查点 | Warning / Fail 处理 |
|------|--------|---------------------|
| Evidence | 正向证据是否存在，引用的 fact IDs 是否都能复核 | 证据薄进入 `draft`，`next_action: collect-more-evidence`；缺失证据直接 reject/drop。 |
| Actionability | 是否有可执行 Must / Must Not / Review 条款 | 不可执行口号进入 `refine-rule` 或 reject。 |
| Abstraction | 是否太贴单个函数/单个文件，或过度抽象成口号 | 过窄进入 `refine-rule`；过泛不得提升。 |
| Conflict | 是否同时存在正反例、规则冲突或 scope 重叠 | 进入 `conflict`，需要 conflict resolution 或 owner decision。 |
| Risk | 是否命中闭合 `risk_domain`（auth/permission/payment/funds/privacy/data-lifecycle/state-ownership/cross-surface-contract）或 `category∈{architecture,security}` | high-risk 或 `owner_required` 进入 owner queue。 |
| Derivation | AI rules / review checklist 是否只从 accepted standard rule 派生 | 派生项缺 source rule 时不得输出给下游 workflow。 |
| Anchor Integrity | Git 或非 Git source anchors 是否完整 | 锚点缺失则不能作为 promotion evidence。 |
| Privacy | 是否含客户数据、敏感业务细节、人员信息或不能复用的事故细节 | `needs-redaction` 或 `blocked` 时不得进入 confirmed-draft。 |

### Pre-write 隐私与路径卫生 Gate

任何写入 `docs/standards/candidates/**`、候选报告、ledger、eval 输出或 derived checklist 的内容，必须先过确定性 pre-write gate。该 gate 只做机械事实检查，不判断规则价值：

- secret pattern scan：常见 token/API key/private key/session/cookie/password/credential 形态。
- PII pattern scan：邮箱、手机号、身份证/证件号、客户号、内部人员姓名列表（若项目配置提供）和原始事故/工单标识。
- absolute path scan：禁止出现本机绝对路径；定位信息使用 repo-relative path、path hash、snapshot id、line range 和 snippet hash。
- prompt-injection scan：规则正文中出现“忽略系统指令”“跳过验证”“修改 generated runtime mirror”等越权指令式文本时标记 `needs-sanitization`。

不通过时不得落盘到 git-tracked candidates；只能输出 `redaction-blocked` / `path-hygiene-blocked` 的 report-only limitation，并提示先脱敏或替换 source refs。`needs-redaction` 不能长期留存在仓库：V1 处理方式是阻断写入并要求本轮内 redacted retry；V2 才可引入有保留期的临时隔离区。U13 的最窄验证必须包含 grep/Node hygiene check，至少覆盖 `docs/standards/**`、`skills/spec-team-standards-governance/evals/**` 和本次生成的 validation report。

Warning routing 必须显式：

| Warning 类型 | 下一步 |
|--------------|--------|
| evidence warning | `collect-more-evidence`，继续由 AI/脚本补事实，不交给 owner 裁决。 |
| actionability / abstraction warning | `refine-rule`，由 AI 改写和找反例，不交给 owner 裁决。 |
| derivation warning | 修复派生关系；AI rules / review checklist 暂不发布。 |
| risk warning | `owner-review`，因为这是组织授权问题。 |
| conflict warning/fail | `owner-review` 或 conflict resolution，因为这是意图冲突问题。 |
| privacy warning | 先 redaction，再重新评估。 |

这样可以避免 owner queue 变成“模型不确定就丢给人”的垃圾桶。证据薄、表达差、抽象差的问题应由 AI 继续收证或优化；只有冲突、高风险、显式 owner_required 才需要人裁决。

### Brownfield 切片顺序

大型项目初始化时推荐按以下优先级切片，而不是全仓扫描：

1. 高风险能力：认证、权限、支付、隐私、安全、资金、数据一致性。
2. 核心链路：用户主路径、交易链路、运营后台关键流程。
3. 跨端一致性：App/H5/PC/Admin 共用能力、错误语义、权限显示、状态展示。
4. 高 churn 模块：最近 30-90 天频繁修改且 review 争议多的区域。
5. 事故频发区：bug、incident、回滚、线上告警集中区域。
6. 新人/agent 高频误判区：重复解释成本高的非显然规则。
7. Owner 可用区：能快速确认 scope 和例外的团队先做，避免 candidate 堆积。

### 获取质量验证

规范获取完成后，不应只看“生成了多少规则”。更有用的验证是：

- **PR replay:** 选最近一批 PR，用新规范重新跑 review，看是否能提前发现真实问题，是否增加噪音。
- **Retrieval eval:** 给 plan/work/review/debug 场景，让 agent 只从 index 加载规则，检查是否命中正确 rule IDs。
- **Owner edit distance:** owner 对候选规则改动越大，说明获取质量或 scope 识别越差。
- **Rule adoption:** 后续任务中规则被引用、被执行、被例外申请、被废弃的比例。
- **Noise budget:** project-standards reviewer 因规则产生的无效 finding 不能超过可接受阈值。

第一版 pilot threshold 必须可关闭但可调整，避免 eval 只停留在 prose：

| 指标 | Pilot 默认阈值 | 不满足时 |
|------|----------------|----------|
| `pr_replay_cases` | 至少 5 个最近 PR/review finding；不足 5 个时不得宣称 replay 通过 | 记录 `not-enough-sample` 和缺口 |
| `retrieval_expected_hit_coverage` | 命中期望 rule IDs 的比例 >= 80%，且不得把 `suggested`/`observed` 当 hard context | `needs-index-or-scope-fix` |
| `false_positive_rate` | project-standards finding 误报率 <= 15%，或每 5 个 replay case 不超过 1 个无效 hard finding | `replay-noisy` |
| `owner_edit_distance` | promotion-ready candidate 的 owner normalized edit distance <= 30%；> 50% 必须退回 rewrite | `needs-rewrite` |

这些阈值是 pilot defaults，不是全仓永久门槛；每个 repo 可在 `validation-and-replay.md` 中记录调整理由。样本不足、owner 不可用或历史 PR 不可复现时，应输出 `not-enough-sample` / `not-run`，不能用 LLM 自评替代。

---

## 分级自治与 Authority Tier

业界没有统一采用“所有规范都必须人确认”或“所有规范都可由 LLM 自主确认”两种极端。更成熟的落地形态是把 autonomy 和 authority 拆开：LLM 可以高度自治地发现、归纳、评分、对抗复核、生成 patch 和解释冲突；但能否进入 confirmed/enforced，要看证据来源和规则影响面。

### Authority tier table

| Tier | 典型来源 | LLM 可自主动作 | 是否可自动合入 confirmed | 典型 gate |
|------|----------|----------------|---------------------------|-----------|
| `explicit-authority` | `AGENTS.md`、`CLAUDE.md`、ADR/design note、README/contributing、lint/test/API config 中明写规则 | 抽取、去重、scope 标注、字段补齐、生成 index patch proposal | 不自动合入；可以生成 `confirmed-draft`，若来源本身已是当前权威且无冲突，可准备面向 `confirmed` 的可审查 patch proposal，但仍需 active source-edit workflow 中普通 diff review 合入 | deterministic source ref + conflict check |
| `machine-enforced-policy` | lint、formatter、typecheck、schema、OPA/Rego、CI check、test config | 抽取 enforcement 描述、绑定 rule ID、生成 docs mirror | 不自动合入；可以确认“存在这个机械约束”，但不能自动扩展为语义架构规则 | 命令/config evidence |
| `inferred-from-code` | 代码结构、目录模式、graphify/codegraph、测试布局 | 生成 `observed` pattern、置信分、反例扫描、候选 rule card | 不可以 | owner 或后续 promotion |
| `repeated-review-or-incident` | 重复 review comment、bug/incident、postmortem、agent 错误复现 | 生成 `suggested` candidate、聚合同类证据、影响面分析 | 不可以 | owner 或负责团队评审 |
| `multi-source-high-confidence` | 显式文档 + 代码模式 + review 经验一致，且无冲突 | 生成 promotion proposal、推荐 scope/priority/exceptions | 不自动合入；默认只进入 `confirmed-draft` 或 fast-review proposal；即使 repo 配置低影响偏好，也只能自动生成 `confirmed-draft` | repo 配置 + owner 可追溯 |
| `high-impact-governance` | 命中闭合 `risk_domain`（权限/安全/隐私/支付/资金/数据生命周期/状态 ownership/跨端契约）或 `category∈{architecture,security}`（含架构分层） | 生成候选、方案比较、风险和反例、decision brief | 不可以 | owner gate / ADR / design note |
| `conflict-present` | 来源互相矛盾、scope 不清、owner 不明、例外过多 | 生成 conflict record 和 resolution options | 不可以 | 冲突解决后重新分级 |

`confidence_score` 的定位是 promotion 输入，不是 authority 本身。它可以决定“是否值得 owner 快速批准”“是否生成 confirmed-draft”“是否需要再找反例”，但不能单独把 inferred rule 变成 enforced policy。

**high-impact 判据（闭合、可判定）**：`high_impact ⇔ category ∈ {architecture, security} 或 risk_domain ≠ ∅`，其中 `risk_domain` 是闭合枚举 `{auth, permission, payment, funds, privacy, data-lifecycle, state-ownership, cross-surface-contract}`（项目可经 index 注册表扩展）。本计划其余对“高影响/高风险面”的列举（authority tier 的 `high-impact-governance`、规则质量门禁的 Risk gate、生命周期“新增规范”、brownfield 切片）统一引用该 `risk_domain` 集合并去掉开放式“等”。凡 `high_impact` 的 confirmed 规则必须有有效 `owner`（owner-gate）且不可自动 promote/enforce；`owner=unresolved` 时只能 `deferred`，不得进入 `confirmed-draft`、confirmed patch 或 hard context。

`confirmed-draft` 的强约束是：它只是一份带 source refs、tier reason、evidence quality、conflict check 和 review 状态的 source patch/proposal。它可以降低 owner/reviewer 的整理成本，但不能进入 `docs/standards/index.md` 的 hard-context 查询结果，也不能被 `spec-plan`、`spec-work` 或 `spec-code-review` 当作可 enforce 规则。所谓“低影响偏好”只能缩短 review 队列或自动生成 draft patch，不能绕过普通 diff review、CHANGELOG 和 focused tests。

每次 promotion decision 都应带 decision trace，避免“模型觉得可以”变成黑盒判断：

| 字段 | 说明 |
|------|------|
| `gate_results` | Evidence、Actionability、Abstraction、Conflict、Risk、Derivation、Anchor、Privacy 的 pass/warning/fail。 |
| `confidence.signals` | evidence strength、evidence distribution、actionability、abstraction、conflict absence、risk clarity、derivation integrity、anchor integrity。 |
| `autonomy.mode` | `autonomous-draft`、`owner-gated`、`review-gated`。 |
| `autonomy.policy` | `collect-more-evidence`、`refine-rule`、`promotion-proposal`、`owner-review`、`reject`、`keep-draft`。 |
| `decision_trace` | 逐步解释为什么发布草案、为什么停在 draft、为什么进入 owner queue。 |
| `next_action` | 下一个动作，必须是可执行的：收证、改写、冲突解决、owner review、diff review、reject。 |

AI rules、review checklist、workflow handoff summary 都是 derived artifacts，只能从 `confirmed` standards 或明确标记的 `confirmed-draft` proposal 生成预览；下游 workflow 的 hard context 只能消费 `confirmed`。如果 review checklist 与 standard rule 不一致，以 standard rule 为准，并把派生项标记为 drift。

### 为什么不能只靠普通 diff review

普通 diff review 是 source mutation 的最终出口 gate，但它不负责在 review 前整理候选来源、隔离草案状态、判断组织授权或解释自动建议。authority-tier / confirmed-draft / owner queue / decision trace 的增益必须限定在这些 review 前置和审查输入质量问题上：

| 构件 | 普通 diff review 不解决的问题 | 本方案中的最小职责 |
|------|-------------------------------|--------------------|
| `authority_tier` | reviewer 看到一段规则 patch 时，不知道它来自显式权威、机械配置、代码观察、事故复盘还是 LLM 归纳 | 在进入 diff review 前给候选贴来源权威和影响面标签，决定是否只可 advisory、是否 owner-gated、是否可准备 draft patch |
| `confirmed-draft` | 草案容易被误读成可 enforce 的正式规范，或在 index/query 中被提前加载 | 明确隔离 draft 与 hard context；只作为可审查 patch/proposal，不进入 query hard result |
| owner queue | diff review 可以看到文本质量，但不能自动代表组织 owner 授权高影响架构/安全/隐私/状态 ownership 规则 | 只承接 conflict、high-impact、explicit owner_required；证据薄/表达差/抽象差回到 AI 收证或改写 |
| decision trace | reviewer 无法复核 LLM 为什么建议提升、为什么拒绝或为什么要求 owner | 记录 gate results、confidence signals、autonomy policy、source refs、next_action，让后续 reviewer 可审计自动建议 |

若某个构件在实现期无法提供上述增益，应收敛为二元：`auto-draftable`（可自动生成 proposal，但不合入）或 `owner-required`（必须 owner/ADR/design note 后再 review），不要引入新的中间状态。

### 决策与下一步词表（单一来源）

gate、autonomy、promotion 和 eval 之间必须用同一套 token，decision trace 才能对账。规范两个正交轴，既有字段都视为它们的视图：

- **`next_action`（做什么）**：`collect-more-evidence`、`refine-rule`、`resolve-conflict`、`redact`、`owner-review`、`prepare-promotion-patch`、`diff-review`、`reject`、`defer`。
- **`outcome`（判定结果）**：`keep-advisory`、`prepare-promotion-patch`、`merge-after-review`、`reject`、`defer`、`conflict-hold`。

既有字段同义归一（消除命名/时态漂移）：

| 既有字段 / 取值 | 归一到 |
|---|---|
| `promotion_decision`：`keep-advisory` / `prepare-confirmed-patch` / `merge-confirmed-after-review` / `rejected` / `deferred` / `conflict` | `outcome`：`keep-advisory` / `prepare-promotion-patch` / `merge-after-review` / `reject` / `defer` / `conflict-hold` |
| `autonomy.policy`：`promotion-proposal` / `keep-draft` / `reject` | `prepare-promotion-patch` / `defer` / `reject` |
| gate `next_action` 与 warning routing：`drop` / `fix-derivation` / `redaction` | `reject` / `refine-rule` / `redact` |
| eval threshold `decision`：`evidence-supports-promotion` / `needs-rewrite` | `prepare-promotion-patch` / `refine-rule` |

`decision_trace` 只使用上面规范 token；`promotion_decision`、`autonomy.policy`、gate `next_action`、threshold `decision` 都是它的视图，文档其余位置引用本表而不再各自定义新词。

### 自主分析执行 loop

```mermaid
flowchart TD
  A[证据输入] --> B[LLM 抽取候选规则]
  B --> C[多维度评分: source/evidence/consistency/scope/risk/reversibility]
  C --> D[反例与冲突搜索]
  D --> E{Authority tier}
  E -->|explicit-authority| F[confirmed-draft 或 confirmed patch proposal]
  E -->|machine-enforced-policy| G[confirmed enforcement mirror]
  E -->|inferred/review/incident| H[suggested 或 observed candidate]
  E -->|multi-source-high-confidence| I[promotion proposal + fast review]
  E -->|high-impact/conflict| J[owner gate 或 conflict record]
  F --> K[PR/review/changelog]
  G --> K
  H --> L[candidates 区]
  I --> L
  J --> L
```

第一版不需要实现复杂自动评分器，但 `docs/contracts/team-standards.md` 和 `spec-team-standards-governance` skill 必须给后续自动化留下正确边界：自动挖掘越强，越要显式记录证据、反例、影响面、tier、为什么能或不能 enforce。

---

## 规范治理 Skill 架构

可选规范 skill 应是 guided source-maintenance skill，而不是 command-backed public workflow。可用工作名是 `spec-team-standards-governance`；具体目录可在实现时最终确认，但不能命名为 `spec-standards`，也不能创建 `spec-standards`。当用户直接调用该 standalone skill 时，默认输出 proposal/report/patch preview；任何 durable source mutation（写入 confirmed standards、`index.md`、archive、promotion log、lineage ledger、owner queue，或把 candidate 状态真正推进）都必须由 active `spec-work` 或等价 source-edit workflow 承担，并遵守 preview-first、普通 diff review、CHANGELOG 和 focused tests。

### Skill 角色与模式

| 模式 | 目的 | 主要输入 | 主要输出 | 硬边界 |
|------|---------|-------------|--------------|---------------|
| `init` | 初始化 brownfield standards candidates | V1: `AGENTS.md`, `CLAUDE.md`, README、contributing docs、architecture docs、lint/test/API configs、少量用户指定 source refs；V2 才加入 graph/code evidence、review findings、`docs/solutions/**` 批量获取 | V1: acquisition notes、candidate file patch previews、`explicit-rules-inventory.md`、`observed-patterns.md`、`suggested-candidates.md`、`conflicts.md`；V2: acquisition task pack、fact/evidence/lineage ledgers、promotion proposals | 直接调用默认 report/proposal-only；V1 active source-edit workflow 也只允许写 candidates 与 promotion proposal，不写 confirmed rules、不写 V2 ledgers、不调用 promote |
| `query` | 返回某个 workflow slice 相关规范 | workflow、changed paths、surface、layer、capability、category | 带 rule IDs 和 source refs 的 filtered summary | 默认绝不全量加载 standards |
| `propose` | 基于重复证据草拟新候选规则 | issue/review/incident/source refs | `suggested` / `observed` candidate cards、confidence/evidence report、tier recommendation | 绝不把 confidence 当 policy authority |
| `promote` | 按 authority tier 把 candidates 或显式规则转成 confirmed-draft 或 confirmed patch proposal | candidate card、explicit source refs、owner decision、scope、exceptions、gate results、decision trace | `confirmed-draft` patch proposal、面向 `confirmed` 的 rule patch proposal、index/lineage/owner queue patch preview | 只有 explicit-authority/machine-enforced-policy 可自动准备 patch preview；真正写 confirmed/index/lineage/owner queue 必须在 active source-edit workflow + diff review 中完成；high-impact/conflict 必须 owner gate |
| `deprecate` | 安全退役过期规范 | rule ID、invalidation evidence、replacement 或 migration note | `deprecated` state patch proposal、archive/promotion log patch preview | 直接调用只输出 deprecation proposal；实际 state/archive 写入必须在 active source-edit workflow 中完成，且绝不静默删除历史 |
| `audit` | 检查 standards 健康度 | index、rule files、candidate/conflict/archive areas | drift/conflict/stale-owner report | advisory report，不是 enforcement gate |

### Skill Reference Loading Map

`spec-team-standards-governance` 必须采用 progressive disclosure。`SKILL.md` 是入口和调度层，只保留模式路由、硬边界、输出合同、no-load-all 规则和下表 reference map；不得把所有获取、提升、访谈、eval、生命周期细则塞回入口文件。

```text
SKILL.md
  ├─ 固定承载: trigger / mode routing / hard boundaries / output contract / reference map
  ├─ 近核心引用: authority-tiers.md、loading-and-consumption.md、promotion-and-conflicts.md
  └─ mode-specific 引用: 按 init/query/propose/promote/deprecate/audit 选择性读取
```

| 场景 | 读取 references | 不默认读取 |
|------|-----------------|------------|
| `query` | `loading-and-consumption.md`；遇到 conflict 或 tier 判断时再读 `authority-tiers.md` / `promotion-and-conflicts.md` | `initialization.md`、访谈、PR replay、acquisition scoring 细节 |
| `init` | V1 读 `initialization.md`、`acquisition-quality.md`、`output-risk-profile.md`；V2 才读 `source-matrix.md`、`role-interview-playbook.md` | `validation-and-replay.md` 的完整 eval 细节、`lifecycle.md` |
| `propose` | V1 读 `acquisition-quality.md`、`adaptive-expansion.md`、`promotion-and-conflicts.md`；V2 才读 `source-matrix.md` | 全量 standards rule files、无关 surface 的端侧 references |
| `promote` | `authority-tiers.md`、`promotion-and-conflicts.md`、`loading-and-consumption.md`；涉及高影响或 owner gate 时引用 Owner Registry 或 ADR/design note，V2 才读访谈 playbook | `initialization.md`、大规模 evidence collection playbook |
| `deprecate` | `lifecycle.md`、`promotion-and-conflicts.md`、`authority-tiers.md` | 获取任务包、访谈全量问题集 |
| `audit` | `loading-and-consumption.md`、`lifecycle.md`、`output-risk-profile.md`；V2 需要质量回放时读 `validation-and-replay.md` | `role-interview-playbook.md`，除非审计发现 owner 决策缺口 |
| `eval/replay` | V2 only: `validation-and-replay.md`、`output-risk-profile.md`、必要的 golden samples | init/propose/promote 的全部操作步骤 |

引用加载原则：

- `SKILL.md` 只能把 near-core references 列为“常见路径”，不能要求每次调用都读取。
- mode-specific reference 只有在该 mode 或明确触发条件出现时读取；用户只问查询规则时，不加载初始化、访谈和 replay 细节。
- reference 文件只能解释流程、边界、质量和输出格式；confirmed standards 的正文仍在 `docs/standards/**`，不能复制到 skill references。
- 若 reference map 缺失或互相矛盾，standalone skill 输出 `reference-map-incomplete` limitation，并降级为 report/proposal-only。
- U9 的 contract tests 应断言 `SKILL.md` 包含 reference map、mode routing 和 no-load-all 规则，同时确保入口文件不会因内联全部 references 而膨胀。

### 组件架构

```mermaid
flowchart LR
  U[用户或既有 workflow] --> S[spec-team-standards-governance skill]
  S --> M{模式}

  M -->|init| I[初始化器]
  M -->|query| Q[Scope 过滤加载器]
  M -->|propose| P[候选规则提出器]
  M -->|promote| R[提升评审器]
  M -->|deprecate| D[生命周期管理器]
  M -->|audit| A[健康审计器]

  I --> E[证据盘点]
  P --> E
  E --> C[docs/standards/candidates]
  C --> LG[Lineage ledger]

  R --> H[Authority tier decision]
  H -->|explicit/machine-enforced| F[Confirmed patch preview 或 confirmed-draft proposal]
  H -->|owner 批准| F
  H -->|high-impact 或冲突| X[Owner queue / conflict records]
  H -->|拒绝或延后| C

  D --> Z[Deprecated/archive records]
  Q --> IDX[docs/standards/index.md]
  IDX --> F
  F --> OUT[过滤后的 standards summary + precise refs]
  A --> REP[Advisory health report]

  OUT --> PLAN[spec-plan]
  OUT --> TASKS[spec-write-tasks]
  OUT --> WORK[spec-work]
  OUT --> REVIEW[spec-code-review]
  OUT --> DEBUG[spec-debug]

  F --> DER[Derived AI rules / review checklist previews]
  DER --> OUT
  A --> RISK[Output risk profile]
```

### 执行逻辑

```mermaid
flowchart TD
  Start([开始]) --> Parse[解析用户意图和模式]
  Parse --> Scope[收集 scope: workflow、surfaces、layers、capabilities、changed paths]
  Scope --> Contract[读取 docs/contracts/team-standards.md]
  Contract --> Index[如存在则读取 docs/standards/index.md]
  Index --> Mode{模式}

  Mode -->|query| Filter[按 scope 和 priority 过滤 confirmed rules]
  Filter --> Summary[返回 summary + rule refs]

  Mode -->|init/propose| Evidence[从显式 docs、config、code、review、solutions 收集有界证据]
  Evidence --> Profile[确认单一 extraction target 与 blind spots]
  Profile --> Facts[生成 source anchors 与 fact ledger]
  Facts --> Patterns[聚合模式、正反例、冲突信号]
  Patterns --> Classify[分类 candidate_type: explicit-rule / observed-pattern / suggested-rule / imported / conflict-record]
  Classify --> Gates[跑 rule quality gates 与 warning routing]
  Gates --> Candidate[生成 candidates / lineage / owner queue patch preview]

  Mode -->|promote| CandidateRead[读取 candidate、explicit sources 和 source refs]
  CandidateRead --> GateReview[读取 gate results、decision trace、privacy/replay 状态]
  GateReview --> Tier{Authority tier}
  Tier -->|explicit-authority 或 machine-enforced| Validate[校验 required fields、scope、exception、invalidation condition]
  Tier -->|multi-source-high-confidence| Draft[生成 confirmed-draft / promotion proposal]
  Tier -->|high-impact 或 conflict| Owner[要求 owner decision 或 ADR/design note]
  Owner --> Validate
  Validate --> Patch[生成 confirmed rule + index patch preview]
  Patch --> Review[active source-edit workflow + diff review]
  Review --> Confirmed[合入 confirmed rule 并更新 index]
  Draft --> Candidate

  Mode -->|deprecate| RuleRead[读取 confirmed rule]
  RuleRead --> DepReason[要求 invalidation 或 replacement evidence]
  DepReason --> Deprecated[生成 deprecated/archive patch preview]

  Mode -->|audit| Audit[检查 stale owners、missing fields、conflicts、index drift]
  Audit --> Report[产出 advisory report]

  Candidate --> End([结束])
  Confirmed --> End
  Deprecated --> End
  Summary --> End
  Report --> End
```

### ASCII 上下文加载视图

```text
Workflow 切片
  ├─ workflow: plan | work | review | debug | doc-review
  ├─ changed paths / artifact 类型
  ├─ surfaces: app | h5 | pc | admin | backend | data | shared
  ├─ layers: ui | api | domain | adapter | storage | observability
  └─ capability: auth | payment | order | portfolio | *

        │
        ▼
docs/contracts/team-standards.md
        │  定义 authority 和 trust semantics
        ▼
docs/standards/index.md
        │  按 surface/layer/capability/category/workflow/priority 过滤
        ▼
仅命中的 rule files
        │  例如 architecture.md + cross-surface.md + 一个 surface file
        ▼
过滤后的 summary
        │  rule IDs + 短规则正文 + source refs + exceptions
        ▼
既有 workflow decision/review/closeout
```

### Skill 安全规则

- standalone 直接调用默认是 report/proposal-only：可以生成 acquisition report、candidate cards、decision trace 和 patch preview，但不直接改 durable source。
- 只有 active `spec-work` 或等价 source-edit workflow 明确接管 source mutation 时，skill 才能辅助写 `docs/standards/candidates/**`、confirmed standards files、index updates、archive records 或 promotion/deprecation records；V2 才允许写 ledger/owner queue/run-level output risk profile。该外层 workflow 负责 preview-first、diff review、CHANGELOG 和 focused tests。
- confirmed standards files、`docs/standards/index.md`、archive records、promotion log、lineage ledger 和 owner decision queue 都属于 durable source mutation；V1 不批量创建 lineage/owner queue，不能由一次 standalone skill 调用静默写入或合入。
- skill 不得编辑 generated runtime mirrors、route maps、public workflow catalogs 或 `.spec-first/standards/`。
- `query` mode 只读。
- `init` 和 `propose` modes 在允许 source 写入时也只能写 candidates、获取证据和 promotion proposals，不写 confirmed rules；即使发现 explicit-authority 或 machine-enforced-policy，也必须把提升动作留给 `promote` mode 和普通 diff review。
- `promote` mode 必须先判定 authority tier：显式权威来源和已存在机械 enforcement 可自动准备 confirmed-draft 或面向 confirmed 的 patch preview；`confirmed-draft` 在合入 confirmed 前不可被 query/enforce；V1 真正写入 confirmed/index/archive 必须经 active source-edit workflow 和普通 diff review；V2 写 lineage/owner queue 也必须走同样出口。高影响治理、冲突、owner 不明或纯代码推断必须要求 owner decision。
- `audit` mode 只产出 advisory findings，不能独立阻断其他 workflows。
- 交给 `spec-plan`、`spec-work`、`spec-code-review`、`spec-doc-review` 或 `spec-debug` 的 handoff 只能包含过滤后的 rule refs 和已知限制。
- AI rules、review checklist、query summaries 和 handoff snippets 是 derived artifacts；它们必须引用 source standard rule IDs，不能作为独立 source truth。
- V1 owner queue 只是 report/patch-preview 概念；V2 若创建 `owner-decision-queue.md`，也只接收 conflict、high-risk 或显式 `owner_required`，不得承接普通低置信、证据薄或表达粗糙的候选；这些候选应继续 `collect-more-evidence` 或 `refine-rule`。

---

## 高层技术设计

> *本图只表达预期方案形状，供 review 判断方向，不是实现规格。实现 agent 应把它当上下文，而不是要逐字复刻的代码。*

```mermaid
flowchart TB
  A[显式来源: AGENTS, CLAUDE, README, contributing docs, ADR/design notes, lint/test/API configs] --> B[显式规则盘点]
  C[Code, graphify/codegraph, docs/solutions, review findings, incidents] --> D[Observed 或 suggested candidates]
  E[Imported team pack 或 external rules] --> F[Imported candidates]

  B --> G[Authority tier decision]
  D --> G
  F --> G
  G -->|explicit/machine-enforced| H[docs/standards 中的 confirmed standards]
  G -->|high-impact| OWN[Owner gate / ADR]
  OWN --> H
  G --> I[Conflict records]
  H --> J[索引: surface/layer/capability/category/workflow/priority]
  CON[docs/contracts/team-standards.md] --> META[规范治理元提示词层]
  J --> META
  L[当前 workflow scope: changed paths, artifact type, capability, surface] --> META
  META --> K[Scope 过滤加载器]
  K --> M[过滤后的 standards summary + precise refs]

  M --> N[spec-plan]
  M --> O[spec-write-tasks]
  M --> P[spec-work]
  M --> Q[spec-code-review]
  M --> R[spec-doc-review]
  M --> S[spec-debug]

  H --> T[Deprecated/archive history]
```

设计规则：

- `docs/standards/**` 是 source，不是 generated runtime。
- Candidate sources 在被 promote 前都只是 advisory。
- Consumers 接收过滤后的 summaries 和 precise refs，不接收整个 standards corpus。
- 代码审查只能 enforce 已引用的 confirmed rules。
- Architecture/design standards 与其他规范同属 source 层，但 priority 高于本地 style guidance。
- 规范治理元提示词层负责动态解释和选择规范，但不拥有 confirmed truth。
- Scripts 可以准备 candidate facts；LLM 可以做语义判断、置信评分和多轮反思；promotion 和 applicability 必须落入 authority tier，不由 confidence 单独决定。

---

## 实施单元

```mermaid
flowchart TB
  U1[U1 Source 合同与 trust model]
  U2[U2 Standards source 骨架]
  U3[U3 Summary-first consumption contract]
  U4[U4 Workflow consumption 更新]
  U5[U5 Code-review standards enforcement]
  U6[U6 Brownfield 初始化指导]
  U7[U7 用户文档与路由说明]
  U9[U9 规范治理 skill skeleton 与架构收口]
  U10[U10 V2 获取任务包与证据质量模型]
  U11[U11 V2 Brownfield 切片与角色化访谈]
  U12[U12 V2 获取质量验证与回放 eval]
  U13[U13 测试、迁移审计与 review]

  U1 --> U2
  U1 --> U3
  U2 --> U4
  U3 --> U4
  U4 --> U5
  U2 --> U6
  U4 --> U7
  U3 --> U9
  U6 --> U9
  U5 --> U13
  U6 --> U13
  U7 --> U13
  U9 --> U13

  U6 -.V2 evidence-gated.-> U10
  U9 -.V2 evidence-gated.-> U10
  U10 --> U11
  U11 --> U12
  U12 -.post-V1 validation.-> U13
```

### U1. 定义规范 source 合同与信任模型

**目标:** 创建权威合同，定义团队规范 source authority hierarchy、trust levels、lifecycle state、promotion state、scope matching、promotion rules 和 consumer boundaries。

**需求:** R1, R2, R3, R5, R7, R8, R13, R16, R21, R35, R37

**依赖:** 无

**文件:**
- 新增: `docs/contracts/team-standards.md`
- 修改: `docs/contracts/context-governance.md`
- 测试: `tests/unit/context-governance-contracts.test.js`

**方案:**
- 定义 `docs/standards/**`、root/ancestor `AGENTS.md` 和 `CLAUDE.md`、目录级等价文件作为可能的 standards sources，并明确 priority 和 conflict rules。
- 定义 source authority hierarchy：角色契约负责演化判断，host instructions 负责宿主执行纪律，`docs/contracts/team-standards.md` 负责规范语义合同，`docs/standards/**` 承载 confirmed 规则，目录级指令承载局部 scope，`docs/specs/**` 只维护能力行为真相，`docs/solutions/**` 和历史 docs 默认 advisory。
- 定义重复规则维护方式：高权威 host instruction 不复制全文到 standards；standards 可用短 rule card + `source_refs` 指向，只有 canonical ownership 明确迁移时才移动正文并同步更新指针。
- 定义 trust levels、lifecycle state、promotion state 和 hard-context rules：
  - `confirmed`: scope 匹配时成为 hard project context。
  - `observed`: 来自 code/docs/history 的 advisory evidence。
  - `imported`: 被本 repo 接受前保持 advisory。
  - `suggested`: 来自 LLM/review/research 的 candidate。
  - `conflict`: 解决前是 enforcement 的 visible blocker。
  - `lifecycle_state=deprecated`: 除非 migration 引用，否则仅作为历史信息。
  - `promotion_state=confirmed-draft`: 只表示可审查 proposal，不进入 hard-context 查询结果。
- 定义 canonical 枚举段作为 single source of truth：`promotion_state`（含 `none`；candidate card 禁用 `none`）以及决策两正交轴 `next_action` 与 `outcome`；R2、candidate card、gate、authority、eval 等处只引用该枚举段并提供同义映射，不各自重列。
- 要求每条 confirmed standard 都包含 scope、source refs、owner、enforcement mode 和 invalidation condition；`owner=unresolved` 是合法值，但 high-impact 规则 fail-closed，不得提升或 enforce。
- 定义字段分类（global-enum / project-enum / format-free）及各类取值来源：global-enum 取值由本合同 canonical 枚举段定义并将 `category`/`enforcement`/`migration_impact` 收为闭合；project-enum（`applies_to`/`layer`/`capability`）由 `docs/standards/index.md` 注册表声明、校验器查成员资格而非硬编码；format-free 只查格式/存在（含 `source_refs` 禁本机绝对路径）。
- 固定 V1 rule-card 序列化为 Markdown section + YAML metadata fenced block；若实现确定性校验器，归属为 `scripts/check-team-standards.js`，只做枚举、owner、index、路径和隐私 gate 检查，不做语义 promotion。
- 定义 standards conflict precedence 为本合同的新规则；不得声称复用 PRD `evidence-and-topology.md` 的 contradiction handling 作为 authority-tier precedence。
- 明确 scripts 可以收集 candidate facts，但不能确认 standards。
- 定义 authority tier：`explicit-authority`、`machine-enforced-policy`、`inferred-from-code`、`repeated-review-or-incident`、`multi-source-high-confidence`、`high-impact-governance`、`conflict-present`。
- 明确 LLM 可以自主抽取、评分、合并、反例搜索和生成 patch；能否 enforce 由 tier 决定。
- 显式禁止把 `.spec-first/standards/` 当作当前 source 或 required context。

**遵循模式:**
- `docs/contracts/context-governance.md` 的 source/runtime 与 host instruction reuse 表述。
- `docs/contracts/project-graph-consumption.md` 的 provider-untrusted/advisory evidence 姿态。
- `docs/10-prompt/结构化项目角色契约.md` 的 `Scripts prepare, LLM decides`。

**测试场景:**
- 合同测试：context governance 只能通过新的 team standards contract 提及 `docs/standards/**`，不能把它写成 raw mandatory read。
- 负向：active contract text 不得重新引入 `.spec-first/standards/`、`glue-map.json`、`<standards-baseline-paths>`、`spec-standards`。
- 正向：contract text 明确只有 scope 匹配的 `confirmed` standards 是 hard context。
- 正向：contract text 明确 observed/imported/suggested candidates 在 owner confirmation 前保持 advisory。
- 正向：contract text 明确 source authority hierarchy、peer conflict 处理和 duplicate host-rule source_refs 策略。
- 正向：contract text 明确 `docs/specs/<capability>/spec.md` 是能力行为 truth，不是 team standards source。
- 正向：contract text 定义字段三分类与各自取值来源，且 `applies_to`/`layer`/`capability` 作为 project-enum 指向 `docs/standards/index.md` 注册表，不硬编码跨项目固定集合。
- 正向：contract text 定义 Owner Registry fallback、`owner=unresolved` 合法值和 high-impact unresolved fail-closed。
- 正向：contract text 定义 rule-card 序列化格式和可选 validator 归属；若不实现 parser，则 contract tests 不得声称 parser 已存在。
- 正向：contract text 新定义 standards conflict precedence，并说明 PRD evidence/topology 只可作为 evidence-tag 参考。
- 正向：explicit-authority 和 machine-enforced-policy 可生成 `confirmed-draft` 或面向 `confirmed` 的可审查 patch proposal，但必须带 source refs 和 conflict check，且真正 `confirmed` 需要 diff review 合入。
- 负向：high-impact-governance、conflict-present 和 inferred-from-code 不能仅凭 confidence 自动 enforce。

**验证:**
- 审查者能准确识别哪些路径是 source、哪些是 generated/advisory，以及 downstream workflows 可以 enforce 哪些 trust levels。

---

### U2. 创建规范 source 骨架和首批规则模板

**目标:** 增加最小 `docs/standards/**` source 结构和可读规则模板，用来承载 confirmed standards，同时避免变成巨型单体文档。

**需求:** R1, R3, R4, R8, R11, R12, R14, R15

**依赖:** U1

**文件:**
- 新增: `docs/standards/index.md`
- 新增: `docs/standards/shared.md`
- 新增: `docs/standards/architecture.md`
- 新增: `docs/standards/review.md`
- 新增: `docs/standards/security.md`
- 新增: `docs/standards/candidates/README.md`
- 按需新增: `docs/standards/cross-surface.md`
- 按需新增: `docs/standards/design.md`
- 按需新增: `docs/standards/coding.md`
- 按需新增: `docs/standards/testing.md`
- V2/按需新增: `docs/standards/app.md`、`docs/standards/h5.md`、`docs/standards/pc.md`、`docs/standards/admin.md`、`docs/standards/backend.md`、`docs/standards/data.md`、`docs/standards/job-event.md`
- 按需新增: `docs/standards/archive/README.md`
- 可选修改: `docs/03-实施方案/06-开发规范.md`

**方案:**
- `index.md` 只做导航、索引和 consumption summary，不复制每条规则全文。
- `index.md` 必须包含 Surface / Layer / Capability Registry 块，声明本仓合法的 surface/layer/capability 取值，供 project-enum 字段校验（见 U1「字段分类与校验来源」）。
- 实际 standards 放在主题文件和 surface 文件里，每个文件保持 scoped、scannable。
- 使用紧凑 rule cards，而不是长篇 prose essays。字段采用 `id`、`trust`、`lifecycle_state`、`promotion_state`、`priority`、`category`、`applies_to`、`layer`、`capability`、`owner`、`source_refs`、`rule`、`rationale`、`enforcement`、`exceptions`、`effective_from`、`migration_impact`、`invalidation_condition`、`last_reviewed`。
- 首批 confirmed seed 只包含本仓已有明确权威来源且 owner 可解析的治理规则，例如 source/runtime boundary、changelog discipline、generated runtime mirror 禁止手改等。业务状态 ownership、依赖方向和 design note trigger 可作为 architecture/design rule template 或 `suggested` candidate，只有存在 owner/ADR/design note/当前权威文档并通过冲突检查后才能提升为 `confirmed`。
- 候选写入 `docs/standards/candidates/**` 前必须执行 deterministic privacy/secret/path hygiene pre-write gate；不通过不得落盘。
- 将较早的 `docs/03-实施方案/06-开发规范.md` 当作 historical input；具体章节只有经过 review 和 promotion 才能进入 confirmed standards。

**遵循模式:**
- `docs/contracts/**` 下现有简洁 contract docs。
- `agents/spec-project-standards-reviewer.agent.md` 的 evidence requirements，因为每条规则必须能在 review 中被 cite。

**测试场景:**
- 文档 lint/diff check：新增文件没有绝对路径，也没有 hidden HTML。
- Contract check：每个 standards 文件包含清晰 trust/authority statement，或指向 `docs/contracts/team-standards.md`。
- 负向：index 不复制所有子文件全文。
- 正向：`index.md` 含 Surface / Layer / Capability Registry，声明本仓合法 surface/layer/capability 取值。
- 负向：rule/candidate 的 project-enum 取值不在注册表内时不视为合法。
- 负向：任何文件都不得声称 code scanning 可以自动确认规则。

**验证:**
- 下游 agent 能读取 `docs/standards/index.md`、定位相关 category/surface 文件，并引用规则，而不需要加载巨型合并文档。

---

### U3. 定义 summary-first 规范消费合同

**目标:** 规定 workflow 如何只选择和注入相关 standards，吸收 OpenSpec artifact-scoped `rules` 的优点，同时避免 global context bloat。

**需求:** R2, R3, R5, R7, R15, R16, R36, R37

**依赖:** U1, U2

**文件:**
- 修改: `docs/contracts/team-standards.md`
- 修改: `skills/spec-plan/references/governance-boundaries.md`
- 修改: `skills/spec-work/SKILL.md`
- 修改: `skills/spec-write-tasks/SKILL.md`
- 修改: `skills/spec-code-review/SKILL.md`
- 修改: `skills/spec-doc-review/SKILL.md`
- 修改: `skills/spec-debug/SKILL.md`
- 测试: `tests/unit/spec-plan-contracts.test.js`
- 测试: `tests/unit/spec-work-contracts.test.js`
- 测试: `tests/unit/spec-write-tasks-contracts.test.js`
- 测试: `tests/unit/spec-code-review-contracts.test.js`
- 测试: `tests/unit/spec-doc-review-contracts.test.js`
- 测试: `tests/unit/spec-debug-contracts.test.js`

**方案:**
- 增加统一 consumption 规则：先读 standards summary；只有 scope 需要时才打开精确 category/surface 文件；把 confirmed/scope-matched rules 当 hard context。
- 增加 rule selection contract：输入包含 workflow、artifact type、changed paths、declared surface/layer/capability、changed file types、source refs 和 explicit requested rule IDs；输出包含 matched rule IDs/files、excluded rule IDs、uncertainty reason、fallback mode、limitations 和 source refs used。
- 定义 fallback modes：`index-missing`、`stale-index`、`scope-uncertain`、`no-matching-rule`、`conflict-present`、`contract-missing`；每种 fallback 都必须说明允许行为和禁止行为，尤其禁止把全量扫描 `docs/standards/**` 当作默认替代索引。
- 定义 standards/capability spec 边界消费：能力 spec 可作为当前行为 evidence 或 standards `source_refs`，但不能把工程约束、review 规则和团队协作流程写入 capability spec。
- 定义各 consumer 示例：
  - `spec-plan`：standards 塑造实现约束和风险，但不能发明产品需求。
  - `spec-write-tasks`：standards 只有在与 source plan 一致时，才能变成 task constraints。
  - `spec-work`：scope 匹配时 standards 约束 changed files；具体实现仍由 direct source evidence 决定。
  - `spec-code-review`：standards findings 必须同时引用 rule 和 diff/source violation。
  - `spec-doc-review`：只消费 `category∈{architecture,design}` 且 `workflow` 含 `plan`/`doc-review` 的规划期规范（如 `DESIGN-NOTE-001`），用于发现 plan/PRD 与 confirmed 架构/设计规范矛盾或缺失规范要求的 design-note/ADR；不得把 coding/testing/style 规范施于文档，也不变成 generic style preferences。
  - `spec-debug`：standards 可以解释 expected invariants，但不能替代 reproduction/source evidence。
- 保留 Host Instruction Reuse Policy：root host files 不自动 full reread，除非策略允许或精确需要。

**遵循模式:**
- `skills/spec-plan/references/governance-boundaries.md` 中已有的 `Written project standards ... may define hard project context` 语言。
- `skills/spec-write-tasks/SKILL.md` 中已有的 `Written project standards may become hard task constraints only when they apply to the changed files` 语言。

**测试场景:**
- 正向：每个 workflow 引用 `docs/contracts/team-standards.md` 或等价 source contract 语言。
- 正向：每个 workflow 明确 confirmed/scope-matched standards 可作为 hard context。
- 正向：每个 workflow 的 standards loading 说明包含 matched/excluded/uncertainty/fallback/limitations 中至少必要字段。
- 正向：scope 不明、index 缺失、冲突存在时，workflow 响亮降级而不是加载全库或发明规则。
- 正向：capability spec 只能作为当前行为 evidence 或 standards source ref，不能承载工程规范正文。
- 负向：没有 workflow 默认要求 full `docs/standards/**` read。
- 负向：没有 workflow 复活 `.spec-first/standards/` 或旧 glue/candidates artifacts。
- 负向：没有 workflow 把 external-tool facts 当作 scope authority。

**验证:**
- 所有被触及的 workflow contract tests 通过，并体现一致 trust-boundary language。

---

### U4. 将规范集成到 plan、task、work、debug 和 doc-review

**目标:** 让 standards 在日常 workflow 决策中有用，但不把它们变成 workflow state 或 product scope authority。

**需求:** R5, R8, R9, R15

**依赖:** U3

**文件:**
- 修改: `skills/spec-plan/references/governance-boundaries.md`
- 修改: `skills/spec-work/SKILL.md`
- 修改: `skills/spec-write-tasks/SKILL.md`
- 修改: `skills/spec-doc-review/SKILL.md`
- 修改: `skills/spec-debug/SKILL.md`
- 测试: `tests/unit/` 下对应 focused unit tests

**方案:**
- 对 planning：当某条 standards rule 实质改变方案时，要求轻量 decision note：`rule_id`、`source_tag`、`consequence`，未采纳时记录 `deferred_reason`。
- 对 task packs：standards 只能在不扩大 source-plan scope 时进入 `context_refs` 或 task constraints。
- 对 work closeout：当某条 standard 实质影响实现或阻断选项时，在 closeout evidence 或 limitations 中记录 standards rule ID。
- 对 debug：允许 standards 定义 expected invariants，但 root cause evidence 仍必须基于 source/test/log。
- 对 doc-review：只用 `category∈{architecture,design}` 且 `workflow` 含 `plan`/`doc-review` 的规划期规范校准文档要求；区分 document-quality feedback 和 standards violations，不把 coding/testing/style 规范施于文档。

**遵循模式:**
- `skills/spec-plan/references/governance-boundaries.md` 的 decision ledger format。
- `skills/spec-work/SKILL.md` 的 closeout evidence posture。
- `skills/spec-write-tasks/SKILL.md` 的 task pack `context_refs` discipline。

**测试场景:**
- Planning test：standards 可以影响技术决策，但不能发明 WHAT 或产品需求。
- Task-pack test：standards context refs 不扩大 source-plan scope。
- Work test：hard standards 只限 changed files/scope 和 confirmed source。
- Debug test：standards 是 expected behavior hints，不替代 reproduction evidence。
- Doc-review test：standards violations 必须有明确 source rule，不是 style preference。

**验证:**
- Workflow prose 仍保持 summary-first 和 source-first；plan/work/debug 路径不依赖 standards CLI 或 generated runtime artifact。

---

### U5. 扩展 code review 的规范 enforcement

**目标:** 更新 `spec-code-review` 和 `spec-project-standards-reviewer`，让 confirmed `docs/standards/**` 规则能以与 `AGENTS.md` / `CLAUDE.md` 相同的 evidence rigor 被 enforce。

**需求:** R5, R6, R7, R15, R16

**依赖:** U2, U3

**文件:**
- 修改: `skills/spec-code-review/SKILL.md`
- 修改: `skills/spec-code-review/references/persona-catalog.md`
- 修改: `agents/spec-project-standards-reviewer.agent.md`
- 测试: `tests/unit/spec-code-review-contracts.test.js`
- 测试: `tests/unit/agents-governance-contracts.test.js`
- 测试: `tests/unit/workflow-skill-agent-map-contracts.test.js`

**方案:**
- 将 Stage 3b 从只发现 `CLAUDE.md` / `AGENTS.md`，扩展到发现 `docs/contracts/team-standards.md` 声明的 standards source paths。
- 保持 parent orchestrator 廉价：只传 paths 和 changed file scope，不把完整 standards content dump 到每个 reviewer prompt。
- 更新 project-standards reviewer：
  - 只读取与 changed file types 相关的 standards files；
  - 只 enforce `confirmed` standards；
  - 将 `observed`、`suggested`、`imported`、`conflict` 以及 `lifecycle_state=deprecated` 的规则作为 hard findings 抑制；
  - 引用精确 standard ID/section 和 diff/source line。
- generic best-practice review 继续留在其他 personas，不进入 project-standards reviewer。

**遵循模式:**
- `agents/spec-project-standards-reviewer.agent.md` 现有 `<standards-paths>` block 和 evidence requirements。
- `skills/spec-code-review/references/subagent-template.md` 的 anchored confidence rubric。

**测试场景:**
- 正向：`docs/standards/review.md` 中的 confirmed rule 在 diff 违反时能产生 project-standards finding。
- 负向：suggested 或 observed rule 不能产生 hard project-standards finding。
- 负向：`applies_to` 不匹配的 confirmed rule 不适用于无关文件。
- 负向：没有明写 standard 的 generic maintainability advice 会被 project-standards reviewer 抑制。
- 降级：`docs/standards/**` 缺失时，review 行为保持当前状态且不失败。

**验证:**
- Code review 仍 confidence-gated、evidence-anchored；standards 不变成主观 style channel。

---

### U6. 文档化 brownfield 规范初始化

**目标:** 给已有大型项目的团队一条安全初始化 standards 的路径，同时避免把扫描结果伪装成既有政策。

**需求:** R2, R8, R9, R11, R14

**依赖:** U1, U2

**文件:**
- 新增或修改: `docs/standards/index.md`
- 新增或修改: `docs/standards/shared.md`
- 新增或修改: `docs/standards/candidates/README.md`
- 新增或修改: `docs/standards/candidates/explicit-rules-inventory.md`
- 新增或修改: `docs/standards/candidates/observed-patterns.md`
- 新增或修改: `docs/standards/candidates/suggested-candidates.md`
- 新增或修改: `docs/standards/candidates/conflicts.md`
- 修改: `docs/05-用户手册/12-gitignore参考.md`
- 可选新增: `docs/05-用户手册/团队开发规范治理.md`

**方案:**
- 定义 brownfield 初始化 recipe：
  1. 盘点 `AGENTS.md`、`CLAUDE.md`、README、contributing docs、lint/test config、architecture docs、当前 PR review norms 中的显式规则。
  2. 从代码、graphify/codegraph、tests 和重复 review findings 中提取 observed patterns，并标为 `observed`。
  3. 与历史文档和 `docs/solutions/**` 对比，保持 advisory。
  4. 显式标记 conflicts。
  5. 按 authority tier 生成 promotion proposal：显式权威来源和机械 enforcement 可自动生成 `confirmed-draft` 或面向 confirmed 的 patch preview；真正进入 `confirmed` 必须走 `promote` mode、active source-edit workflow 和普通 diff review；代码推断、重复 review 和事故经验进入 candidates；高影响治理规则必须 owner/ADR/design note。
- 加入 promotion decision 示例：
  - “Observed many modules use KMP/Clean Architecture” 在 owner 确认 scope 和 exceptions 前不是 confirmed rule。
  - “AGENTS.md 要求不手改 source/runtime mirrors” 在本仓可作为 confirmed。
  - “linter enforces formatting” 可作为 enforcement 引用，但 linter 存在本身不是 semantic architecture rule。
- 明确大型 app 项目应按 capability/surface slices 初始化，而不是一次写一个巨大 standards document。

**遵循模式:**
- `docs/01-需求分析/11.project-standards/第一层级.md` 的 lightweight repo profile thinking。
- `docs/validation/execution-logs/2026-05-04-spec-standards-loop.md` 的 confirmed-only lesson。

**测试场景:**
- 文档审查：brownfield guidance 明确 code scanning 只创建 candidates。
- 文档审查：guidance 解释 conflicts 和 owner confirmation。
- 负向：guidance 不推荐 `.spec-first/standards/` 作为 source 或 generated root。
- 负向：guidance 不要求 graphify/codegraph 可用。

**验证:**
- 维护者能为大型存量 repo bootstrap standards，而不制造巨型上下文文件或自动政策声明。

---

### U7. 更新用户文档和 route references

**目标:** 让团队规范机制可发现，但不新增 public workflow entrypoint。

**需求:** R7, R9, R10

**依赖:** U1, U2, U3

**文件:**
- 修改: `README.md`
- 修改: `README.zh-CN.md`
- 修改: `docs/README.md`
- 修改: `docs/05-用户手册/README.md`
- 修改: `docs/05-用户手册/12-gitignore参考.md`
- 测试: `tests/unit/runtime-capability-catalog.test.js`
- 测试: `tests/unit/using-spec-first-contracts.test.js`

**方案:**
- 增加简短说明：team standards 是 source docs，不是 `spec-*` workflow。
- 链接 `docs/contracts/team-standards.md` 和 `docs/standards/index.md`。
- route maps 继续不出现 `spec-standards` 和 `spec-standards`。
- 更新 gitignore guidance：`docs/standards/**` 是 confirmed standards source 示例，而 `.spec-first/standards/` 仍是 retired/generated cleanup 范围。
- 解释与 OpenSpec 的关系：
  - OpenSpec-style explicit constraints 有价值。
  - spec-first 在 enforcement 前要求 trust level 和 source boundary。

**遵循模式:**
- 现有 compact changelog 和 README 中关于 source/runtime boundaries 的语言。
- `docs/05-用户手册/12-gitignore参考.md` 现有 shared project standards section。

**测试场景:**
- Runtime catalog test 继续断言没有 `spec-standards`。
- using-spec-first route map test 继续断言没有 standards public workflow。
- Docs grep：README 提到 team standards source docs，但不把它呈现成命令。
- Gitignore policy test 继续与 source/runtime boundary 对齐。

**验证:**
- 用户能找到规范写在哪里，并理解为什么没有新增 command。

---

### U9. 设计 standalone 规范治理 skill skeleton 与架构收口

**目标:** 先新增一个 V1 source skill skeleton，提供入口、模式、边界、progressive disclosure reference map、query/audit/proposal-only 输出和目录骨架；U10-U12 的获取质量、访谈和 eval references 作为 V2 evidence-gated 扩展，不阻塞 V1 发布。

**需求:** R17, R18, R19, R20, R21, R22, R23, R24, R25, R26, R27, R28, R29, R30, R31, R32, R33, R34, R35, R36, R38, R7, R8, R13, R14, R15, R16

**依赖:** U1, U2, U3, U6；U10-U12 后续会向本 skill 的 references 扩展内容，但 U9 的 V1 验证不依赖这些 V2 文件存在。

**文件:**
- 新增: `skills/spec-team-standards-governance/SKILL.md`
- 新增: `skills/spec-team-standards-governance/references/initialization.md`
- 新增: `skills/spec-team-standards-governance/references/meta-prompt-governance.md`
- 新增: `skills/spec-team-standards-governance/references/authority-tiers.md`
- 新增: `skills/spec-team-standards-governance/references/promotion-and-conflicts.md`
- 新增: `skills/spec-team-standards-governance/references/loading-and-consumption.md`
- 新增: `skills/spec-team-standards-governance/references/lifecycle.md`
- 新增或轻量新增: `skills/spec-team-standards-governance/references/acquisition-quality.md`
- 新增或轻量新增: `skills/spec-team-standards-governance/references/output-risk-profile.md`
- 新增或轻量新增: `skills/spec-team-standards-governance/references/adaptive-expansion.md`
- V2 新增: `skills/spec-team-standards-governance/references/source-matrix.md`
- V2 新增: `skills/spec-team-standards-governance/references/role-interview-playbook.md`
- V2 新增: `skills/spec-team-standards-governance/references/validation-and-replay.md`
- 新增测试: `tests/unit/team-standards-governance-contracts.test.js`
- 测试: `tests/unit/lint-skill-entrypoints.test.js`
- 测试: `tests/unit/runtime-capability-catalog.test.js`
- 测试: `tests/unit/using-spec-first-contracts.test.js`

**方案:**
- 第一阶段先创建 `SKILL.md`、`references/README` 或等价目录骨架、mode routing、禁止事项和 reference trigger map，使 U10/U11/U12 可以安全写入 skill references。
- `SKILL.md` 只承载入口、模式选择、边界和输出 contract；细节拆到 references，遵守 progressive disclosure。
- `SKILL.md` 必须包含 reference loading map：固定承载 trigger/mode/boundary/output contract；query 主要读 `loading-and-consumption.md`；init/propose 读取 acquisition/source matrix/output risk；promote/deprecate 读取 authority/promotion/lifecycle；audit/replay 读取 output risk/validation；任何 mode 都不得默认读取全部 references。
- `meta-prompt-governance.md` 定义 AI 如何解释规范、抽取 scope、选择加载内容、生成 handoff，以及哪些动作必须禁止。
- `authority-tiers.md` 定义 autonomy vs authority 的分层：显式来源、机械 enforcement、代码推断、重复 review、多源高置信、高影响治理和冲突规则分别如何处理。
- `acquisition-quality.md` 在 V1 只定义轻量规则质量清单、pre-write privacy/secret/path hygiene gate、proposal-only 边界；完整获取任务包、证据质量评分和反例库由 U10/V2 填充。
- `source-matrix.md` 定义不同来源能产生的 trust level、candidate type 和必须补充的证据；V1 不必创建，U10/V2 再填充。
- `promotion-and-conflicts.md` 定义 decision trace、owner queue、standards conflict precedence（新定义，不复用 PRD evidence/topology 的 contradiction handling）、出口集 `superseded`/`scoped-split`/`merged`/`deferred`/`both-rejected` 和 derived artifact 边界。
- `loading-and-consumption.md` 定义 AI rules、review checklist、query summary 和 workflow handoff 只能从 confirmed standards 派生。
- `loading-and-consumption.md` 同时承载 rule selection contract 的 mode-specific 应用，包含 matched/excluded/uncertainty/fallback/limitations 输出格式。
- `role-interview-playbook.md` 定义架构、安全、测试、SRE、多端、后端、数据和业务 owner 的访谈问题；V2/U11 再创建。
- `validation-and-replay.md` 定义 PR replay、retrieval eval、owner edit distance、noise budget 和 adoption feedback；V2/U12 再创建。
- `output-risk-profile.md` 在 V1 只定义 missing evidence、输出失败模式、pre-write gate 失败 reason_code 和 no-absolute-path guard；完整 replay 输出风险由 V2/U12 填充。
- `adaptive-expansion.md` 定义从 workflow feedback 生成 `suggested` / `observed` candidates、conflict records 和 audit reports 的闭环。
- 明确定义六个 mode：`init`、`query`、`propose`、`promote`、`deprecate`、`audit`。
- standalone 直接调用默认 report/proposal-only；只有 active `spec-work` 或等价 source-edit workflow 接管后，skill 才能辅助写 source。
- `init` / `propose` 在允许 source 写入时也只写 `docs/standards/candidates/**`、ledger 和 promotion proposals，不得写 confirmed rules。
- `query` 只读，输出 filtered standards summary 和 precise refs。
- `promote` 必须先检查 authority tier，再检查 owner confirmation 或 explicit source refs、required fields、scope、exceptions、effective_from、migration_impact、invalidation_condition 和 index patch preview；真正写 confirmed/index/lineage/owner queue 必须在 active source-edit workflow 中完成。
- `deprecate` 必须记录 invalidation evidence、replacement/migration note 和 archive patch preview；真正写 lifecycle/archive/promotion log 必须在 active source-edit workflow 中完成。
- `audit` 只输出 advisory health report，不能成为 blocking gate。
- skill 文档要显式说明它不是 `spec-*` public workflow，不进入 using-spec-first route map，不创建 `.spec-first/standards/`。

**遵循模式:**
- `skills/using-spec-first/SKILL.md` 的 standalone/public workflow 边界。
- `skills/spec-plan/references/governance-boundaries.md` 的 source/runtime、summary-first 和 provider_untrusted 边界。
- `docs/contracts/workflows/fresh-source-eval-checklist.md` 的 skill/agent prose 语义验证方式。

**测试场景:**
- 正向：skill entrypoint lint 接受 `spec-team-standards-governance` 作为 standalone skill source。
- 正向：skill 文档包含六种 mode 及其输出边界。
- 正向：skill 文档包含元提示词层职责和自适应扩展边界。
- 正向：skill 文档包含 reference loading map，说明 near-core references、mode-specific references 和 no-load-all 默认策略。
- 正向：skill 文档包含 authority tier，并明确 confidence score 不是 authority。
- 正向：skill 文档把 V1 轻量 rule quality / pre-write gate 作为候选写入前置条件，且不把 evidence score 当 authority。
- 正向：skill 文档包含 V1 single target notes、pre-write gate、warning routing 和 decision trace；V2 再覆盖完整 acquisition/source anchors。
- 正向：skill 文档声明 AI rules/review checklist 是 derived artifacts，必须引用 standard rule IDs。
- 负向：route map、runtime capability catalog、README 命令列表不出现 `spec-standards`。
- 负向：skill 文档不得声明代码推断或高影响治理规则可自动 promote confirmed rules。
- 负向：owner queue 不得接收普通 evidence warning 或 abstraction warning。
- 负向：skill 文档不得允许 meta-prompt 自行修改 confirmed standards、public workflow 或 runtime mirrors。
- 负向：skill 文档不得把 `.spec-first/standards/` 当 source。

**验证:**
- 后续实现者可以只按该 skill 架构落地 source skill，而不会误恢复退役 workflow 或越过 owner confirmation。

---

### U10. V2 定义获取任务包与证据质量模型

**目标:** 在 V1 source/consumption 路径被真实 slice pilot 验证后，再让每次规范获取都有明确 scope、来源、证据质量和隐私边界，避免 LLM 做全仓泛化总结。

**需求:** R22, R23, R24, R27, R29, R30, R31, R32

**依赖:** U1, U2, U6, U9 skill skeleton；另需至少一个真实 repo/capability/surface pilot 输入，不能在无样本时创建空 ledger。

**文件:**
- 新增或修改: `docs/standards/candidates/acquisition-task-pack.md`
- 新增或修改: `docs/standards/candidates/evidence-quality-ledger.md`
- 新增或修改: `docs/standards/candidates/fact-ledger.md`
- 新增或修改: `docs/standards/candidates/source-matrix.md`
- 新增或修改: `docs/standards/candidates/output-risk-profile.md`
- 新增或修改: `docs/standards/candidates/lineage-ledger.md`
- 新增或修改: `docs/standards/candidates/owner-decision-queue.md`
- 新增或修改: `docs/standards/candidates/promotion-log.md`
- 新增: `skills/spec-team-standards-governance/references/acquisition-quality.md`
- 新增: `skills/spec-team-standards-governance/references/source-matrix.md`
- 新增测试: `tests/unit/team-standards-governance-contracts.test.js`

**方案:**
- V1 只在 `candidates/README.md` 记录轻量 proposal-only acquisition notes 和 pre-write gate；本单元是 V2，不进入第一版开发清单。
- 定义 acquisition task pack 最小字段：`target_repo`、`extraction_target.surface`、`extraction_target.sub_domain`、`capability`、`project_paths`、`scope.include`、`scope.exclude`、`time_window`、`evidence_sources`、`excluded_sources`、`privacy_boundary`、`expected_candidate_types`、`non_goals`、`owner_candidates`、`output.mode`、`constraints`。
- 明确 mixed-surface / mixed-domain / unrelated capability 输入必须拆分；V2 acquisition run 不得一次性混合抽取多个端。
- 定义 evidence quality score 字段和解释，不要求 V2 第一轮自动计算，但要求每条 candidate 明确评分理由。
- 定义 source anchor 字段：`source_type`、`snapshot_id`、`path_hash`、`file`、`line_range`、`snippet_hash`、`fact_id`、`scope`。
- 定义 source matrix：显式文档、机械配置、ADR、PR review、incident、代码结构、测试、onboarding、访谈分别能产出的最高 trust/tier。
- 定义 candidate card 最小字段：`candidate_id`、`acquisition_id`、`candidate_type`、`authority_tier`、`evidence_quality`、`privacy_review`、`redaction_status`、`replay_status`、`promotion_state`、`promotion_decision` 和 `source_refs`。
- 新增 `lineage-ledger.md`、`owner-decision-queue.md`、`promotion-log.md` 模板（V2 真实 acquisition run 后创建，不作为 V1 空模板）：lineage 记录 candidate→proposal→confirmed/deprecated/archive 演化；owner-decision-queue 只接 conflict/high-risk/`owner_required`；promotion-log 记录提升/废弃原因。三者字段与 `promotion_state`（F1 canonical 集合）、`outcome`/`next_action`（决策词表）、`risk_domain`（high-impact 判据）对齐。
- 定义 quality gates 和 warning routing：证据薄继续收证，表达/抽象差继续 refine，冲突/高风险/owner_required 才进入 owner queue。
- 定义 do-not-promote list：个人偏好、历史债、临时 workaround、低频例外、未确认 review opinion、旧架构残留、敏感业务细节。
- 明确 privacy/redaction：候选规则应抽象为工程约束，只保留必要 source refs，不复制敏感日志、客户数据或人员信息。
- 明确 graphify/codegraph、历史 docs、LLM 总结和 docs/solutions recall 都是 advisory/provider_untrusted 或 recall evidence，不能直接产生 confirmed；promotion 必须回到当前 source/test/doc/log/config 或 owner decision。

**测试场景:**
- 正向：获取任务包模板包含 scope、time window、privacy 和 non-goals。
- 正向：获取任务包模板包含 extraction target、project paths、include/exclude 和 output mode。
- 正向：候选规则模板包含 evidence quality score。
- 正向：候选规则模板包含 acquisition id、authority tier、privacy/redaction 和 replay status。
- 正向：evidence ledger 模板包含 source anchors，且禁止本机绝对路径进入正式输出。
- 正向：quality gates 定义 pass/warning/fail 到 next_action 的路由。
- 负向：source matrix 不允许代码结构直接产生 confirmed。
- 负向：graphify/codegraph 输出不能在缺少 freshness 和回源确认时作为 promotion evidence。
- 负向：evidence warning / abstraction warning 不进入 owner queue。
- 负向：do-not-promote list 明确阻止个人偏好和临时 workaround。

**验证:**
- 后续初始化规范时，reviewer 能看出每条候选从哪里来、证据质量如何、为什么还不能或可以提升。

---

### U11. V2 定义 Brownfield 切片策略与角色化访谈

**目标:** 在 V1 规范 source/consumption 路径跑通后，为大型多端存量项目提供可执行的规范获取路线，补足代码扫描无法获得的隐性团队规则。

**需求:** R25, R26, R24, R29

**依赖:** U10；需要真实 owner/角色参与或可用访谈输入，不以 LLM 想象补齐组织规则。

**文件:**
- 修改: `docs/standards/candidates/README.md`
- 新增或修改: `docs/standards/candidates/role-interview-notes.md`
- 新增: `skills/spec-team-standards-governance/references/role-interview-playbook.md`
- 修改: `skills/spec-team-standards-governance/references/initialization.md`
- 可选修改: `docs/05-用户手册/团队开发规范治理.md`

**方案:**
- V1 用户文档只给出 slice-first 原则和不得全仓一次性提取；本单元是 V2，不阻塞 V1。
- 定义 slice priority：高风险能力、核心链路、跨端一致性、高 churn、事故频发、新人/agent 高频误判、owner 可用。
- 定义每类角色的问题集：
  - 架构负责人：分层、依赖方向、状态 ownership、设计决策门槛。
  - 安全/隐私：权限、数据外发、脱敏、日志、敏感操作。
  - 测试/QA：必须覆盖的场景、fixture、回归边界。
  - SRE/运维：发布、监控、告警、回滚和事故约束。
  - App/H5/PC/Admin：跨端一致性、端特有例外、UI 状态和错误语义。
  - Backend/Data：API、事件、数据生命周期、幂等和一致性。
  - 产品/业务 owner：业务状态真相、合规、用户承诺和例外审批。
- 访谈结果只能生成 suggested 或 explicit owner decision；访谈摘要不能绕过 source refs 和 privacy boundary。
- 将“未回答的问题”写成 open candidate questions，而不是让 LLM 补全。

**测试场景:**
- 正向：文档包含至少架构、安全、测试、SRE、多端、后端/数据、业务 owner 的访谈入口。
- 正向：切片策略明确大型项目不得全仓一次性提取。
- 负向：访谈记录不能直接成为 confirmed，除非包含明确 owner decision 和 scope。

**验证:**
- 团队可以选一个能力 slice 启动规范获取，而不需要先完成全仓 standards baseline。

---

### U12. V2 增加获取质量验证与回放 eval

**目标:** 在存在真实获取候选和历史 PR/review 样本后，验证获取到的规范是否真实提升 plan/work/review/debug，而不是只增加文档数量。

**需求:** R28, R23, R15, R16, R33, R34

**依赖:** U10, U11, U5；需要可复现 PR/review 样本、expected rule IDs 或 owner 反馈，样本不足时只能记录 `not-enough-sample` / `not-run`。

**文件:**
- 新增: `skills/spec-team-standards-governance/references/validation-and-replay.md`
- 新增: `skills/spec-team-standards-governance/evals/README.md`
- 新增: `skills/spec-team-standards-governance/evals/trigger-cases.json`
- 新增: `skills/spec-team-standards-governance/evals/output-cases.json`
- 可选新增: `skills/spec-team-standards-governance/evals/examples.json`
- 可选新增: `skills/spec-team-standards-governance/evals/golden-samples/README.md`
- 可选新增: `docs/validation/standards-governance/2026-06-21-acquisition-quality-validation.md`
- 新增测试: `tests/unit/team-standards-governance-contracts.test.js`
- 测试: `tests/unit/spec-code-review-contracts.test.js`

**方案:**
- V1 只保留成功指标口径和可手工 pilot 的最小记录；本单元是 V2，不要求第一版创建 eval fixtures 或 golden samples。
- 定义 PR replay：选定最近一批 PR 或 review findings，用新标准重放，记录应命中、误报、漏报、owner 修改量和 finding 可采纳率。
- 定义 retrieval eval：给 plan/work/review/debug 场景，要求 agent 只通过 `docs/standards/index.md` 选择规则，评估是否命中正确 rule IDs。
- 定义 owner edit distance：owner 对候选规则的改动越大，说明提取质量或 scope 识别越差。
- 定义 noise budget：project-standards reviewer 的无效 finding 必须可观察且可回退。
- 定义 pilot threshold：至少 5 个 PR/review replay cases；retrieval expected-hit coverage 默认 >= 80%；project-standards false-positive rate 默认 <= 15% 或每 5 case 不超过 1 个无效 hard finding；promotion-ready owner normalized edit distance 默认 <= 30%，> 50% 必须 rewrite。
- 定义 sample insufficiency：样本不足、owner 不可用、历史 PR 不可复现或 replay 输入缺失时，结果必须标记 `not-enough-sample` / `not-run`，不得声明 eval pass。
- 定义 adoption feedback：规则后续被引用、例外、修改、废弃的比例进入 lifecycle review。
- 定义 trigger eval：哪些请求应触发 standards acquisition，哪些只是单文件解释、普通 code review、通用 best practice 或 unsupported surface。
- 定义 output contract eval：候选、index、lineage、owner queue、derived AI rules/review checklist、conflicts 和 evidence anchors 是否按 contract 生成。
- 定义 golden sample e2e：后续可选用一个小型 backend/frontend/app sample 验证从 acquisition task pack 到 candidates/index/owner queue 的闭环。
- 定义最小 eval case 结构，避免 validation reference 只有 prose：
  - `case_id`: 稳定用例 ID。
  - `case_type`: `pr-replay`, `review-finding-replay`, `retrieval-eval`, `noise-budget`。
  - `input_refs`: PR、diff、review finding、plan/work/review/debug 场景或 fixture path。
  - `expected_rule_ids`: 期望命中的 rule IDs。
  - `expected_non_hits`: 不应命中的 rule IDs 或 categories。
  - `observed_rule_ids`: 实际命中的 rule IDs。
  - `false_positive_rule_ids` / `false_negative_rule_ids`: 噪音与漏命中。
  - `owner_edit_distance`: owner 修改量或 `not-run`。
  - `threshold_result`: `pass`, `warning`, `fail`, `not-enough-sample`, `not-run`。
  - `decision`: `evidence-supports-promotion`, `keep-advisory`, `needs-rewrite`, `reject`。
  - `limitations`: 样本偏差、过拟合风险、未覆盖 surface。
  - `decision_trace`: gate results、confidence signals、autonomy policy 和 next action 的摘要。

**测试场景:**
- 正向：validation reference 明确 PR replay 和 retrieval eval 的输入/输出。
- 正向：trigger/output eval files 覆盖 should-trigger、should-not-trigger、near-neighbor 和 boundary cases。
- 正向：eval README 或 examples 定义可复用 case 字段，能区分 expected hits、observed hits、false positives 和 false negatives。
- 正向：eval README 定义 pilot thresholds，并说明 sample 不足时必须输出 `not-enough-sample` / `not-run`。
- 正向：output eval 断言 AI rules/review checklist 必须引用 standard rule IDs，且正式输出不含本机绝对路径。
- 正向：eval 结果只作为 promotion evidence，不替代 owner/high-impact gate。
- 负向：不得用 LLM 自评声称规范获取质量已通过。

**验证:**
- 获取流程能用 replay/retrieval/noise/owner-edit 证据证明“这批规范减少了重复解释/漏审/误审”，或在样本不足时如实给出 `not-enough-sample`，而不仅是生成了更多规则。

---

### U13. 增加聚焦验证、review 和迁移审计

**目标:** 证明新治理层可用、不会回归退役 standards 行为，并且不是只增加 prose。

**需求:** V1 覆盖 R1-R21、R29、R32-R38；R22-R28、R30-R31 的完整获取/eval 验证作为 V2 扩展覆盖。

**依赖:** V1 依赖 U4, U5, U6, U7, U9；V2 扩展验证再依赖 U10, U11, U12。

**文件:**
- 修改: `CHANGELOG.md`
- 修改: U1 到 U9 列出的 focused unit tests
- V2 验证输入: `docs/standards/candidates/fact-ledger.md`
- V2 验证输入: `docs/standards/candidates/lineage-ledger.md`
- V2 验证输入: `docs/standards/candidates/owner-decision-queue.md`
- V2 验证输入: `docs/standards/candidates/output-risk-profile.md`
- V2 验证输入: `skills/spec-team-standards-governance/evals/trigger-cases.json`
- V2 验证输入: `skills/spec-team-standards-governance/evals/output-cases.json`
- 可选验证报告: `docs/validation/standards-governance/2026-06-21-team-standards-governance-validation.md`

**方案:**
- 为每个被触及的 workflow、reviewer 和 skill source 跑 focused contract tests。
- 跑 absence guards，确认 `spec-standards` public workflow 和退役 `.spec-first/standards/` references 未回归。
- 跑 `git diff --check`。
- 如果 standards source contract 或 skill prose 改变行为语义，跑 document review 或 fresh-source eval。
- V1 增加 candidate pre-write audit，检查 privacy/secret/path hygiene gate、prompt-injection scan、source refs 和 `owner=unresolved` high-impact fail-closed；V2 再增加 acquisition output audit，逐项检查 single extraction target、source anchors、quality gates、warning routing、decision trace、lineage ledger、owner queue 和 output risk profile 是否存在且互相引用。
- 增加 derived artifact drift audit，确认 AI rules、review checklist、query summary 和 workflow handoff snippets 必须引用 source standard rule IDs，且不能独立成为 source truth。
- 增加 source authority audit，确认 `docs/contracts/team-standards.md`、host instructions、`docs/standards/**`、directory rules、capability specs、solutions 和 candidates 的权威边界没有互相复制或冲突未标记。
- 增加 rule selection contract audit，确认消费者输出 matched/excluded/uncertainty/fallback/limitations，且 unknown scope、index missing、conflict present 不会触发全量 standards 扫描。
- 增加 standards/spec boundary audit，确认能力 spec 只记录当前行为真相，团队规范只记录工程约束；跨界引用必须用 `source_refs`。
- 增加 skill reference loading audit，确认 `SKILL.md` 有 reference map，且 mode-specific references 不被入口文件全量内联。
- 增加 path hygiene audit，确认正式候选、derived artifacts 和报告不输出本机绝对路径；V2 ledger 需要定位时使用 repo-relative path、path hash、snapshot id 和 snippet hash。
- 增加 owner queue negative audit，确认 owner queue 只接收 conflict、high-risk、explicit owner_required；普通 evidence/actionability/abstraction warning 必须回到 AI 收证或改写。
- V2 增加 trigger/output eval audit，确认 `trigger-cases.json` 与 `output-cases.json` 覆盖 should-trigger、should-not-trigger、near-neighbor、boundary、derived artifact citation 和 no-absolute-path cases。
- 增加 migration audit section，把历史 standards docs 分类为：
  - 已提升的 confirmed rule；
  - 保留为 historical/advisory；
  - conflict/deferred；
  - stale/deprecated。
- V1 对每条 migration 结果记录最小 decision trace；V2 再记录完整 lineage：historical source -> candidate/proposal -> confirmed/deprecated/archive；不能只有结论没有过程。

**遵循模式:**
- 已完成 plans 中的 completion evidence sections。
- `docs/contracts/workflows/fresh-source-eval-checklist.md`，用于语义 workflow/skill prose 变化的 fresh-source evaluation。

**测试场景:**
- 正向：所有 changed workflows focused tests 通过。
- 负向：grep audit 确认没有 active `.spec-first/standards/` consumption path。
- 正向：sample confirmed rule 能被 project-standards reviewer 在 controlled fixture 或 documented manual check 中 cite。
- 负向：sample suggested rule 不可 enforce。
- 正向：explicit-authority sample 可生成 confirmed-draft 或面向 confirmed 的 patch preview，并保留 source refs。
- 负向：high-impact/conflict sample 不可自动 enforce，即使 confidence 很高。
- V2 正向：acquisition task pack/evidence quality/source matrix/replay eval 的 reference 文档存在并互相引用。
- V2 负向：获取质量验证不得使用 LLM 自评作为通过依据。
- 正向：standalone 规范 skill 不出现在 public workflow route map。
- V2 正向：每个 acquisition run 只绑定一个 extraction target；mixed-surface/mixed-domain 输入会被拆分或拒绝。
- 正向：候选包含 source refs，且正式输出不包含本机绝对路径；V2 fact/evidence ledger 还必须包含 source anchors。
- 正向：quality gates 的 warning/fail 都有 next_action，且普通 evidence/actionability/abstraction warning 不进入 owner queue。
- V2 正向：lineage ledger 能追踪 candidate/proposal/confirmed/deprecated/archive 的来源与状态变化。
- 正向：derived AI rules、review checklist、query summary 和 handoff snippets 都引用 standard rule IDs 或 reviewable proposal IDs。
- 正向：source authority hierarchy 能解释同一规则在 host instruction、standards、capability spec 和 solutions 中出现时哪个是 source truth。
- 正向：rule selection contract 在 scope 不明、index 缺失、冲突存在时返回明确 fallback，不加载全量规范库。
- 正向：capability spec 与 standards 的边界示例存在，且互相引用只通过 `source_refs`。
- 正向：skill reference loading map 能证明 query/promote/init/audit 只读取必要 references。
- V1 正向：output risk profile 或 skill reference 明确 missing evidence、known failure modes、pre-write gate 失败和 guard checks；V2 输出完整 run-level profile。
- 负向：quality gate pass 或高 confidence 不可直接等同 owner decision 或 confirmed hard context。

**验证:**
- V1 实现可以用证据关闭：standards governance 可用、规范 skill 边界清晰、candidate 写入受 privacy/path/prompt-injection gate 保护、derived artifacts 不漂移、owner queue 不变垃圾桶，旧 `spec-standards` 仍保持 retired。V2 再用 replay/retrieval/lineage/owner-edit 证明获取产物可复核且有质量收益。

---

## 系统影响

- **Workflow 输入:** `spec-plan`、`spec-write-tasks`、`spec-work`、`spec-code-review`、`spec-doc-review` 和 `spec-debug` 获得共享 standards contract，不再各自维护 ad hoc language。
- **Review 行为:** project-standards review 的 source discovery 更宽，但 authority 更严格：只有 confirmed、scope-matched、可引用的 standards 才能产生 findings。
- **上下文大小:** summary-first 和 scope-filtered consumption 防止大 standards docs 变成默认 context tax。
- **权威层级:** 角色契约、host instructions、team standards contract、confirmed standards、目录级规则、capability specs、solutions 和 candidates 各自有明确职责，减少复制规则和多真相源。
- **规则选择:** rule selection contract 让 workflow handoff 能说明命中、排除、降级和限制，减少“为什么加载这条规范”的黑盒感。
- **能力规范边界:** capability spec 继续维护当前能力行为真相，standards 维护工程约束；二者通过 `source_refs` 互相引用，不互相吞并。
- **Source/runtime 边界:** 新 source docs 位于 `docs/`；generated mirrors 不手改。`.spec-first/standards/` 保持 retired。
- **Brownfield 采纳:** V1 已有大型 app 只能从显式文档和少量手工 observed patterns 建立 proposal-only 候选；不会声称代码扫描等于政策。V2 再进入批量获取。
- **规范获取质量:** V1 初始化不等于全仓扫描总结；V2 每次获取必须有任务包、证据质量、来源矩阵、切片策略和验证反馈。
- **规范萃取工厂:** V2 获取流程被拆成 intake/profile/facts/patterns/synthesis/gates/decision/publisher；前几层只准备事实和候选，不能提升 hard context。
- **证据可复核性:** V1 先要求 source refs 和 why-not-confirmed；V2 source anchors、fact ledger 和 lineage ledger 让 reviewer 能复核候选从何而来、如何被改写、为何进入或没有进入 promotion。
- **Owner 负载:** V1 owner queue 是 report/patch-preview 概念；V2 若创建正式 owner queue，也只承接组织授权问题，如冲突、高风险和显式 owner_required；证据薄或表达差由 AI 继续收证/改写。
- **派生产物边界:** AI rules、review checklist、query summary 和 workflow handoff snippets 变成可再生成的 derived artifacts，不再与 confirmed standards 形成多真相源。
- **输出风险透明度:** V1 output-risk reference 记录缺失证据、警告路由、pre-write gate 失败和输出失败模式；V2 run-level output risk profile 让自动化提取失败时可诊断而非静默污染规范库。
- **组织知识获取:** V2 角色化访谈把代码无法表达的架构、安全、运维、业务 owner 约束转成候选规则，但仍受 evidence 和 authority tier 约束。
- **Skill surface:** 新增 `spec-team-standards-governance` 只作为 standalone source skill，不进入 public workflow route map。
- **Skill 上下文成本:** reference loading map 让 `SKILL.md` 保持轻入口，query/init/propose/promote/deprecate/audit 只读取必要 references，不把获取、访谈、replay、生命周期细节一次性注入。
- **元提示词层:** 规范治理的动态解释、加载、候选生成和生命周期引导集中在 skill source 中，不分散到每个 workflow 的临时 prompt。
- **Surface coverage:**
  - CLI/runtime：第一版 out-of-scope，除防 public workflow regression 的测试外不改 CLI/runtime。
  - Workflow prose：in-scope，用于共享 consumption contract。
  - Agent/reviewer：in-scope，用于扩展 project-standards reviewer。
  - Standalone skill：in-scope，但 V1 只做 query/audit/proposal-only skeleton；初始化、提升、废弃可输出 patch preview/handoff，真正 source mutation 仍由 active source-edit workflow 承担，重型获取/回放能力进入 V2。
  - Docs/user guide：in-scope，用于 discoverability 和维护流程。
  - Tests：in-scope，用于 contract 和 absence guards。
  - Generated runtime mirrors：out-of-scope；未来如需 source-runtime projection，必须通过 `spec-first init` 再生成。

---

## 风险与依赖

| 风险 | 概率 | 影响 | 缓解 |
|------|------------|--------|------------|
| 规范文档变成巨大上下文 | 中 | 高 | `index.md` summary-first，scope-filtered 读取，禁止全量默认注入。 |
| 候选规则被误当 confirmed | 高 | 高 | trust level contract、tests、reviewer 只 enforce confirmed。 |
| 旧 `spec-standards` 被变相恢复 | 中 | 高 | public route/catalog/runtime prune tests 保持 negative assertions。 |
| 规范与 `AGENTS.md`/`CLAUDE.md` 冲突 | 中 | 中 | contract 定义 priority、conflict 显式记录，冲突状态不可 enforce。 |
| Source authority hierarchy 漂移 | 中 | 高 | `team-standards.md` 固定层级表；同级冲突进入 conflict record；host instruction 规则用 `source_refs` 指向而非复制全文。 |
| Capability spec 被写成规范库 | 中 | 高 | 用户文档和 contract 给出边界表；能力 spec 只记录当前行为 truth，工程约束进入 standards。 |
| Rule selection contract 被绕过 | 中 | 高 | 下游 workflow 必须输出 matched/excluded/fallback/limitations；unknown scope、index missing 和 conflict present 不得触发全量 standards scan。 |
| 过度设计成 CLI/状态机 | 中 | 中 | 第一版 docs-first，不做评分、自动 promote 或新 workflow。 |
| Review 噪音增加 | 中 | 中 | project-standards reviewer 必须引用规则和 diff/source 线，generic best practice 继续 suppress。 |
| 历史开发规范过期 | 高 | 中 | 迁移时逐条标记 source、last_reviewed、invalidation condition，不整篇提升。 |
| 规范 skill 被误认为 public workflow | 中 | 高 | skill 命名避开 `spec-standards`，route map/catalog 测试明确禁止 `spec-standards`。 |
| 高层架构规范退化为口号 | 中 | 高 | `architecture.md` / `design.md` 规则必须有 violation condition、owner、exceptions 和 enforcement。 |
| Scope tags 漂移或过宽 | 中 | 中 | `index.md` 维护 surface/layer/capability/workflow 索引，audit mode 定期报告 stale/overbroad rules。 |
| Owner 缺失导致僵尸规范 | 中 | 中 | confirmed rule 必须包含 owner、last_reviewed、invalidation_condition；无 owner 的规则进入 conflict/deprecated。 |
| 元提示词层越权确认规范 | 中 | 高 | `meta-prompt-governance.md` 明确只能解释、加载和提出候选；promotion 必须进入 authority tier。 |
| LLM confidence 被误当 authority | 高 | 高 | 合同明确 confidence score 只是 promotion input；high-impact/conflict/inferred-from-code 不能仅凭高分 enforce。 |
| 过度保守导致自动化价值不足 | 中 | 中 | explicit-authority 和 machine-enforced-policy 允许自动生成 confirmed-draft 或面向 confirmed 的 patch preview，multi-source-high-confidence 支持 fast review，但不绕过 diff review。 |
| 自适应扩展形成隐性自进化 | 中 | 高 | `adaptive-expansion.md` 只允许在符合 authority tier 时生成 confirmed-draft proposal；confirmed-draft 不可 enforce；禁止自动修改角色契约、route map、runtime mirrors 或高影响 confirmed truth。 |
| V1 范围过载 | 高 | 高 | V1 只交付 source contract、最小 standards 骨架、consumption/review enforcement 和 proposal-only skill skeleton；U10-U12 获取/eval/访谈层作为 V2 evidence-gated 扩展。 |
| 获取范围过大导致低质候选 | 高 | 高 | V1 只允许轻量 proposal notes；V2 acquisition task pack 必须定义 slice、time window、source 和 non-goals；大型项目禁止默认全仓一次性提取。 |
| 证据质量评分被当作机械真理 | 中 | 中 | evidence score 只解释证据强弱，不替代 authority tier、owner gate 或 PR replay。 |
| 访谈内容泄漏敏感信息 | 中 | 高 | 获取任务包必须声明 privacy/redaction；候选规则只写抽象约束和必要 source refs。 |
| PR replay 过拟合历史 PR | 中 | 中 | replay 只作为 acquisition evidence；结合 retrieval eval、owner edit distance 和后续 adoption feedback。 |
| 候选队列膨胀 | 高 | 中 | candidate aging、merge/reject/archive cadence；长期无 owner 或无 replay value 的候选退役。 |
| Owner queue 变成垃圾桶 | 中 | 高 | warning routing 明确 evidence/actionability/abstraction 问题回到 AI 收证或改写；只有 conflict/high-risk/owner_required 进入 owner queue。 |
| Source anchor 泄漏本机路径 | 中 | 中 | 正式输出禁止本机绝对路径；使用 repo-relative path、path hash、snapshot id、line range 和 snippet hash。 |
| Source anchor 不可复核 | 中 | 高 | 非 Git 或缺 line/snippet 的来源只能作为 low-confidence advisory；promotion 前必须补 fact ledger。 |
| 候选落盘前泄漏 secret/PII | 中 | 高 | 写入 candidates、derived artifacts、eval output 前跑 deterministic secret/PII/absolute-path/prompt-injection scan；不通过不得写入 git-tracked source，只输出 report-only limitation。 |
| Owner resolver 在无 CODEOWNERS 仓库 fail-open | 中 | 高 | V1 引入 `docs/standards/index.md` Owner Registry fallback；`owner=unresolved` 合法但 high-impact fail-closed，不可提升或 enforce。 |
| confirmed 规则正文成为 prompt injection 面 | 中 | 高 | 下游把 rule text 作为 data payload 注入，使用 fenced block/rule ID/source refs 隔离；检测越权指令式文本并进入 conflict/needs-sanitization。 |
| Derived AI rules 漂移 | 中 | 高 | AI rules、review checklist、query summary 和 handoff snippets 必须从 confirmed standards 或 reviewable proposal 派生，并引用 rule/proposal IDs。 |
| Skill references 膨胀为第二个巨型上下文 | 中 | 中 | `SKILL.md` 只保留 reference loading map；mode-specific references 按触发读取；contract tests 防止入口内联全量细节。 |
| Quality gates 被误当最终 authority | 中 | 高 | gates 只产生 pass/warning/fail、confidence signals 和 next_action；authority 仍由 tier、owner/diff review 和 confirmed source 决定。 |
| Single target 过度碎片化 | 中 | 中 | 按 repo/surface/sub-domain/capability 切片，但允许同一 capability 的连续批次共享 acquisition summary 和 lineage ledger。 |
| Lineage ledger 漂移 | 中 | 中 | promotion、deprecate、archive 都必须更新 lineage；audit mode 报告 orphan candidate、missing promotion edge 和 stale owner decision。 |

---

## 备选方案

- **恢复 `spec-standards` workflow。** 拒绝。它已被明确退役，当前 source/runtime/tests 都围绕清理旧 workflow 建立；恢复会重开旧 artifact sprawl 和 public surface 问题。
- **只用 `AGENTS.md` / `CLAUDE.md` 承载所有规范。** 拒绝作为唯一方案。入口文件适合高优先级规则和指针，不适合长生命周期分类规范库。
- **完全照搬 OpenSpec `openspec/config.yaml`。** 部分采纳。artifact-scoped `rules` 很有价值，但 spec-first 需要 trust level、source/runtime 边界和 summary-first consumption。
- **从代码自动扫描生成 confirmed standards。** 拒绝作为通用规则。代码事实可生成 observed/suggested candidate；只有与显式权威来源或机械 enforcement 对齐，且无冲突、低影响、scope 清楚时，才能进入 confirmed-draft 或 fast review proposal，真正 confirmed 仍需 source-edit workflow + diff review。
- **把规范放进 `docs/specs/<capability>/spec.md`。** 拒绝。capability spec 维护当前能力真相，团队规范维护开发实践约束，二者消费者和更新时机不同。
- **先做 machine-readable schema 和 CLI。** 延后。没有语义 authority contract 的 schema 只会制造伪确定性。
- **直接把规范 skill 做成 `spec-standards`。** 拒绝。用户需要的是规范治理能力，不是恢复已退役 public workflow；standalone source skill 更符合 light contract 和 source/runtime 边界。
- **让元提示词层不分层地自动维护 confirmed standards。** 拒绝。meta-prompt 是解释与编排层，不是 authority layer；自动维护必须受 authority tier 约束，否则会把 advisory feedback 伪装成团队政策。

---

## 成功指标

### V1 成功指标

- 下游 workflow 在 plan/work/review/debug 时可以稳定引用同一 standards contract，而不是各自发明读取规则。
- project-standards reviewer 对规范 finding 的误报不增加，且 finding 都能引用具体 rule ID/section。
- 同一条规则在 host instructions、standards、capability specs、solutions 中出现时，消费者能通过 source authority hierarchy 判断哪一处是 source truth、哪些只是引用或 advisory。
- 每次 standards query/handoff 都能说明 matched rule IDs、excluded reason、fallback mode 和 limitations；scope 不明时不会默认打开全库。
- 用户能根据边界表判断某条内容应写入 capability spec、team standards、contract、solution 还是 candidate 区。
- 单个真实 slice 可以先建立 3 到 10 条 confirmed standards 或 templates，而不是一次性写成巨文档；如无 owner 或 source refs，只能保留候选。
- `spec-standards` 相关 public entrypoint 和 `.spec-first/standards/` active consumption 仍保持 0。
- 新增规范变更能通过普通 PR/review/changelog 流程治理。
- `spec-team-standards-governance` skill skeleton 能在 `query` mode 返回 bounded filtered refs；standalone 直接调用默认 report/proposal-only，只有 active source-edit workflow 接管时 `init/propose` 才能写 candidates。
- lifecycle review 能把 stale rules 退到 `deprecated` 或 `archived`，而不是长期留在 confirmed。
- architecture/design rules 能在 plan/review 中以 rule ID + source refs 形成可审查约束。
- 元提示词层能把 workflow feedback 转成 `suggested`/`observed`/`conflict`/audit 输出；显式权威或机械 enforcement 场景可以生成 confirmed-draft 或面向 confirmed 的 patch preview，高影响治理仍走 owner gate，confirmed-draft 不进入 query mode hard context。
- 高置信 promotion proposal 能减少 owner review 负担，但不会绕过 high-impact/conflict gate。
- 每条自动生成的 confirmed patch preview 或 confirmed-draft 都能追溯到 explicit source ref、machine-enforced evidence、tier reason 和 conflict check。
- 每条 candidate、promotion proposal 和 confirmed rule 都有 source refs、owner 状态、why-not-confirmed 或明确 missing evidence reason。
- 候选、derived artifacts 和报告在写入前通过 deterministic secret/PII/absolute-path/prompt-injection hygiene gate；不通过不落盘。
- high-impact 规则在 `owner=unresolved` 时 fail-closed，不会进入 confirmed-draft 或 hard enforcement。
- Quality gate warning/fail 能稳定路由到 collect-more-evidence、refine-rule、owner-review、conflict-resolution 或 reject。
- Owner queue 只包含 conflict、high-risk 或 explicit owner_required 项；普通低置信、证据薄、表达粗糙的问题不进入 owner queue。
- Derived AI rules、review checklist、query summary 和 workflow handoff snippets 都引用 source rule IDs 或 reviewable proposal IDs，并能被重新生成。
- Output risk profile 或 skill reference 明确本次候选/查询缺哪些证据、哪些输出被抑制、哪些 warning 需要下轮处理。
- 下游 workflow 的 handoff 中能看到过滤后的 rule refs、source refs、exceptions 和 limitations，而不是整库 standards dump。
- `spec-team-standards-governance` 的 `SKILL.md` 保持轻入口，reference loading map 能指导 query/init/propose/promote/deprecate/audit 只加载必要 reference。

### V2 价值指标

- 每个规范获取批次都有 acquisition task pack，并明确目标 slice、证据来源、排除范围和隐私边界。
- 每个规范获取批次只绑定一个 extraction target；mixed-surface、mixed-domain 或 unrelated capability 输入会被拆分。
- 每条 candidate 都有 evidence quality score；低证据质量候选不会进入 confirmed。
- 每条 candidate、promotion proposal 和 confirmed rule 都有可复核 source anchors 或明确 missing evidence reason。
- Lineage ledger 能追踪 candidate -> proposal -> confirmed/deprecated/archive，且没有 orphan promotion。
- Output risk profile 明确本次获取缺哪些证据、哪些输出被抑制、哪些 warning 需要下轮处理。
- Brownfield pilot 能在单个 capability/surface slice 内产出小批量高质量候选，而不是全仓巨量候选。
- PR replay 能显示新增规则对真实 review 问题的命中、误报和漏报，并输出可复核 case 记录。
- Retrieval eval 能证明 plan/work/review/debug 场景可通过 index 命中正确 rule IDs，并暴露 expected hits、observed hits、false positives 和 false negatives。
- Owner edit distance 和 candidate reject reason 能反向改善获取 prompt、source matrix 和切片策略。

---

## 分阶段交付

### 阶段 1：Source contract 与骨架

- 完成 U1、U2。
- 目标是让团队知道“规范写在哪里、怎么写、什么可以 enforce”，并先建立 source authority hierarchy 与 standards/capability spec 边界。

### 阶段 2：Workflow consumption

- 完成 U3、U4。
- 目标是让 plan/work/tasks/debug/doc-review 共享同一消费边界和 rule selection contract。

### 阶段 3：Review enforcement

- 完成 U5。
- 目标是让 confirmed standards 真正进入 code review，但不产生 best-practice 噪音。

### 阶段 4：Docs、standalone skill skeleton 与 V1 语义 review

- 完成 U6、U7、U9 V1 skeleton、U13 V1 验证。
- 目标是证明旧 `spec-standards` 未回归，新治理层和 standalone skill skeleton 可被实际 workflow 消费，candidate 写入受 pre-write gate 保护，source/runtime 边界清晰。

### 阶段 5：V2 Acquisition quality 与 brownfield 获取

- 在真实 repo/capability/surface pilot 具备样本、owner 和隐私边界后，完成 U10、U11、U12，并扩展 U13 V2 验证。
- 目标是让存量项目可以按 slice 高质量获取规范候选，并用证据质量、访谈、reference loading map 和回放验证减少误提取；没有真实样本时只能记录 `not-enough-sample` / `not-run`。

---

## 文档计划

- `docs/contracts/team-standards.md`: 权威合同，定义 source authority hierarchy、trust/scope/promotion/consumer、standards/spec 边界和 rule selection contract。
- `docs/standards/index.md`: 用户入口，说明如何查找、添加、确认和引用规则，并承载 selection summary、scope tags、fallback 提示和 file map。
- `skills/spec-team-standards-governance/SKILL.md`: standalone source skill 入口，定义 mode、边界、输出、handoff 和 reference loading map。
- `skills/spec-team-standards-governance/references/meta-prompt-governance.md`: 定义规范治理元提示词层的职责、禁止事项和 handoff 规则。
- `skills/spec-team-standards-governance/references/authority-tiers.md`: 定义 LLM 分级自治、confidence scoring、auto-confirm 条件、owner gate 和 conflict handling。
- `skills/spec-team-standards-governance/references/acquisition-quality.md`: V1 定义轻量规则质量清单、pre-write privacy/secret/path hygiene gate 和 proposal-only 边界；V2 扩展获取任务包、证据质量评分、反例库。
- `skills/spec-team-standards-governance/references/source-matrix.md`: V2 定义不同证据来源可产生的候选类型和最高默认 trust/tier。
- `skills/spec-team-standards-governance/references/promotion-and-conflicts.md`: V1 定义 decision trace、owner queue、standards conflict precedence、出口集和 derived artifact 边界；V2 扩展 lineage update。
- `skills/spec-team-standards-governance/references/loading-and-consumption.md`: 定义 rule selection contract 在 skill mode 中的使用，以及 query summary、AI rules、review checklist 和 workflow handoff snippets 的派生与按需加载规则。
- `skills/spec-team-standards-governance/references/output-risk-profile.md`: V1 定义 missing evidence、output failure modes、warning routing、pre-write gate failure 和 no-absolute-path guard；V2 扩展 run-level profile。
- `skills/spec-team-standards-governance/references/role-interview-playbook.md`: V2 定义多角色访谈问题和 owner decision 记录规则。
- `skills/spec-team-standards-governance/references/validation-and-replay.md`: V2 定义 PR replay、retrieval eval、owner edit distance、noise budget 和 adoption feedback。
- `skills/spec-team-standards-governance/evals/README.md`: V2 定义可复用 eval case 字段；可选 `examples.json` 提供小样本。
- `skills/spec-team-standards-governance/evals/trigger-cases.json`: V2 覆盖 acquisition 应触发、不应触发、近邻和边界请求。
- `skills/spec-team-standards-governance/evals/output-cases.json`: V2 覆盖 candidates、lineage、owner queue、derived artifacts、source anchors 和 no-absolute-path 输出合同。
- `skills/spec-team-standards-governance/references/adaptive-expansion.md`: V1 轻量定义受治理的自适应候选生成、冲突记录、审计和 owner review 流程；V2 扩展为真实 acquisition producer。
- `skills/spec-team-standards-governance/references/*.md`: 其他 references 分别承载初始化、提升/冲突、加载/消费、生命周期细则。
- `docs/standards/candidates/fact-ledger.md`: V2 记录 deterministic facts、source anchors、hash 和 scope。
- `docs/standards/candidates/lineage-ledger.md`: V2 记录 candidate/proposal/confirmed/deprecated/archive 的演化关系。
- `docs/standards/candidates/owner-decision-queue.md`: V2 只承接 conflict/high-risk/owner_required 决策项。
- `docs/standards/candidates/output-risk-profile.md`: V2 记录本次获取输出风险、缺失证据和被抑制输出。
- `README.md` / `README.zh-CN.md`: 简短介绍团队规范 source docs，不新增命令。
- `docs/05-用户手册/团队开发规范治理.md`: 若内容过长，新增用户手册页承载 brownfield 初始化、维护流程、source authority hierarchy、rule selection contract 和 standards/capability spec 边界表。
- `docs/05-用户手册/12-gitignore参考.md`: 更新 confirmed standards source 示例，避免隐藏 standards source。

---

## 运维 / 推出说明

- 第一版是 docs/source/workflow prose 变更，预计不需要运行 `spec-first init`。
- 如果后续修改 `AGENTS.md` / `CLAUDE.md` managed blocks 或 runtime templates，必须通过 source 变更加 `spec-first init` 刷新 runtime。
- 若在大型外部项目试点，先选一个能力或技术面做 slice，不要一次性初始化全仓规范。
- 规范 promotion 应进入普通 PR review；explicit-authority 或 machine-enforced-policy 可由 agent 准备 confirmed-draft 或面向 confirmed 的 patch preview，但不能静默绕过 diff review。
- 规范 skill 的 `promote` mode 不是通用自动审批器；它只能按 authority tier 准备 source patch。高影响治理、冲突和纯代码推断必须有 owner decision。

---

## 来源与参考

- 角色基线: `docs/10-prompt/结构化项目角色契约.md`
- Planning governance: `skills/spec-plan/references/governance-boundaries.md`
- Work governance: `skills/spec-work/SKILL.md`
- Task-pack governance: `skills/spec-write-tasks/SKILL.md`
- Code review governance: `skills/spec-code-review/SKILL.md`
- Project standards reviewer: `agents/spec-project-standards-reviewer.agent.md`
- 已退役 standards plan: `docs/plans/2026-05-21-002-refactor-remove-spec-standards-plan.md`
- Runtime prune source: `src/cli/state.js`
- Gitignore/user standards note: `docs/05-用户手册/12-gitignore参考.md`
- 历史开发规范: `docs/03-实施方案/06-开发规范.md`
- 历史 repo-profile 设计: `docs/01-需求分析/11.project-standards/第一层级.md`
- 历史 standards loop: `docs/validation/execution-logs/2026-05-04-spec-standards-loop.md`
- OpenSpec 对比 source: sibling repo `OpenSpec/openspec/config.yaml`, `OpenSpec/src/core/artifact-graph/instruction-loader.ts`, `OpenSpec/docs/core-workflow-prompts.md`
- 规范萃取对比 source: local `project-standard-extractor` skill；本方案只借鉴 single target、source anchors、quality gates、decision trace、lineage/owner queue 和 derived artifacts 机制，不移植其 `backend/java-spring` 领域规则，也不把 auto-active 等同 spec-first `confirmed`
- Qodo Rule Miner: `https://docs.qodo.ai/governance/rule-enforcement/rule-miner`
- CodeRabbit learnings: `https://docs.coderabbit.ai/guides/learnings/`
- CodeRabbit learning approvals: `https://docs.coderabbit.ai/guides/learnings/#learning-approval`
- GitHub Copilot custom instructions: `https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot`
- Claude Code memory: `https://docs.anthropic.com/en/docs/claude-code/memory`
- OpenAI Agents guardrails: `https://openai.github.io/openai-agents-python/guardrails/`
- OpenAI Agents human-in-the-loop: `https://openai.github.io/openai-agents-python/human_in_the_loop/`
- Anthropic agent evaluation: `https://docs.anthropic.com/en/docs/test-and-evaluate/eval-tool`
- NIST AI Risk Management Framework: `https://www.nist.gov/itl/ai-risk-management-framework`
- Open Policy Agent policy-as-code: `https://www.openpolicyagent.org/docs/latest/`

---

## Completion Evidence

- Implemented V1 source surfaces: `docs/contracts/team-standards.md`, `docs/standards/**`, `skills/spec-team-standards-governance/**`, `scripts/check-team-standards.js`, package delivery metadata, runtime capability catalog, user docs, and focused unit contracts.
- Updated consumers: `spec-code-review` project-standards discovery and `spec-project-standards-reviewer` now route team standards through the contract/index and only hard-enforce `trust=confirmed,lifecycle_state=active` scope-matched rules.
- Kept V2 acquisition, PR replay, retrieval eval, role interviews, fact/lineage ledgers, and owner queues out of V1. V2 now adds a real single-target pilot (`team-standards-v2-pilot-20260623`) for `spec-first/shared/team-standards`: `docs/standards/candidates/acquisition-task-pack.md`, `source-matrix.md`, `fact-ledger.md`, `evidence-quality-ledger.md`, `lineage-ledger.md`, `owner-decision-queue.md`, `promotion-log.md`, `output-risk-profile.md`, `role-interview-notes.md`, `skills/spec-team-standards-governance/references/source-matrix.md`, `role-interview-playbook.md`, `validation-and-replay.md`, `skills/spec-team-standards-governance/evals/**`, and `docs/validation/standards-governance/2026-06-23-acquisition-quality-validation.md`.
- V2 evidence remains honest/degraded where inputs are unavailable: PR replay and owner edit distance are recorded as `not-enough-sample` / `not-run`; `CAND-STANDARDS-ACQ-001` remains `keep-advisory` and no confirmed standards/index/archive writes were made.
- No `spec-standards` public workflow, `spec-standards`, `skills/spec-standards/`, or `.spec-first/standards/` source/artifact path was restored.
- Multi-agent review completed with four read-only reviewers. Findings fixed: P1 local absolute path hygiene gap in `check-team-standards.js`; P2 `meta-prompt-governance.md` reference reachability; P2 index/rule metadata reverse-consistency coverage; P2 missing concrete cross-surface template. No residual blocking findings remain.
- Verification passed: `node --check scripts/check-team-standards.js`; `node scripts/check-team-standards.js --all`; `npx jest --runTestsByPath tests/unit/changelog-format.test.js tests/unit/team-standards-governance-contracts.test.js tests/unit/spec-code-review-contracts.test.js tests/unit/runtime-capability-catalog.test.js tests/unit/package-install-contracts.test.js tests/unit/spec-write-tasks-output-evals.test.js tests/unit/spec-write-tasks-runtime-governance.test.js --runInBand`; `npx jest --runTestsByPath tests/unit/init-dry-run.test.js tests/unit/runtime-plan-contracts.test.js --runInBand`; `npm run lint:skill-entrypoints`; `npm run typecheck`; `git diff --check`; `npm test` (159 unit suites / 1364 tests, smoke, 2 integration suites passed); `npm run build`.
- V2 focused verification passed: `node --check scripts/check-team-standards.js`; `node scripts/check-team-standards.js --all`; `npx jest --runTestsByPath tests/unit/team-standards-governance-contracts.test.js --runInBand`; `npx jest --runTestsByPath tests/unit/changelog-format.test.js tests/unit/team-standards-governance-contracts.test.js tests/unit/spec-code-review-contracts.test.js tests/unit/runtime-capability-catalog.test.js tests/unit/package-install-contracts.test.js --runInBand`; `npm run lint:skill-entrypoints`; `npm run typecheck`; `npm run build`; `git diff --check`.
- Structured closeout artifact: `.spec-first/workflows/spec-work/spec-first/team-standards-v1-20260623-0304/run.json`; honest closeout verdict was verified with reason `all-claims-consistent`.
- Generated runtime mirrors were not hand-edited; `spec-first init` was not run because V1 changed source/docs/skill delivery metadata only.
