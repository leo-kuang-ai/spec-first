---
spec_id: 2026-07-01-001-spec-work-minimality-preflight
artifact_kind: prd-requirements
target_surface: CLI/DevTool
status: ready-for-planning
evidence_grade: mixed
source_authority: mixed
readiness_authority: engineering-owned
created: 2026-07-01
source_inputs:
  - skills/spec-work/SKILL.md
  - skills/spec-work/references/shipping-workflow.md
  - skills/spec-work/evals/examples.json
  - tests/unit/spec-work-contracts.test.js
  - skills/spec-plan/references/reuse-analysis.md
  - docs/contracts/team-standards.md
  - docs/standards/index.md
  - docs/standards/architecture.md
  - docs/standards/shared.md
readiness_verified_by: check-prd-artifact.js
readiness_verified_at: 2026-06-30T18:24:50.621Z
readiness_checker_schema: spec-prd-artifact-check.v1
readiness_finding_count: 1
readiness_blocking_count: 0
readiness_prd_hash: sha256:fc236c3c66ae927fa637cd195cf9053d6b367288aec314984b76a19610a5221f
readiness_inputs_hash: sha256:bdfb19ce93d3bc56873bdfc75c3ce0bc5ad916f96bb814798db32e8318fdcc8d
---

<!-- prd:section=summary -->
## 概述

本需求定义 `spec-work` 的最小性升级：在执行期补一个轻量的 `Work Minimality Preflight`，让 agent 在新增依赖、文件、抽象、配置、helper、wrapper 或其他 durable surface 之前，先判断这项实现是否真的需要存在；同时把这个判断扩展为 `Architecture Fit Preflight`，要求 work 在动手前确认当前改法是否遵循现有项目规范、架构 ownership、分层、依赖方向、解耦边界与复用锚点。现有 `Simplify as You Go` 从经验提醒升级为 `remove-now`、`minimality-debt`、`protected`、`architecture-mismatch` 四类有去向的后置审查。P0 只改变 source skill 文案、一个 composite eval case、prose contract tests 和 changelog，不新增 public workflow、CLI、schema、task-pack 字段、run artifact 字段或 generated runtime mirror 改动。

## Problem Frame

当前 `spec-work` 已经擅长把明确 plan/task-pack/spec 变成可验证交付，但它的执行热路径主要回答“如何正确完成工作”，还没有在实现前集中回答两类问题：第一，“这段代码、依赖、抽象、配置或 wrapper 是否应该被新增”；第二，“这个新增点是否符合当前项目已有架构、规范、分层、解耦和复用方式”。外部调研材料的关键价值不是照搬 Ponytail 的命令面，而是把“少生成不必要代码”压缩成执行期注意力提醒，并用 protected-code 与 architecture-fit 边界阻止 code golf 和“看似架构化、实则偏离现有架构”的过度设计。

本 PRD 的产品对象是 agent-facing workflow source，不是普通用户界面。成功结果是后续 `spec-plan` 能直接规划一个 source-only P0 改动，而不需要重新判断哪些能力属于 P0、哪些应拒绝或推迟。

## Current System Snapshot

| claim | evidence tag | source / owner | note |
| --- | --- | --- | --- |
| `spec-work` 已有反馈环与 vertical slice 纪律，但该段只要求先建立可观察反馈环、再按可验证 slice 扩展。 | confirmed-source | `skills/spec-work/SKILL.md:77` | 这是 preflight 的相邻锚点，不应复制成第二套规则。 |
| `Anti-Rationalization Red Flags` 已明确“注意力提醒，不是 gate，也不替代 LLM 判断”。 | confirmed-source | `skills/spec-work/SKILL.md:83`、`skills/spec-work/SKILL.md:92` | `Work Minimality Preflight` 应采用同一文风。 |
| Phase 2 当前 loop 从 pattern/test discovery 直接进入 implement。 | confirmed-source | `skills/spec-work/SKILL.md:388`、`skills/spec-work/SKILL.md:389`、`skills/spec-work/SKILL.md:390` | 这是写前最小性判断的具体缺口。 |
| `Test Discovery` 和 `System-Wide Test Check` 已覆盖行为测试、真实链路、orphaned state、接口 parity 与错误策略。 | confirmed-source | `skills/spec-work/SKILL.md:407`、`skills/spec-work/SKILL.md:418` | protected-code 不应另建白名单文件，先引用现有检查与 review。 |
| `Simplify as You Go` 已在每 2-3 个单元或自然阶段边界后做后置简化，但没有 finding 分类和 sink 去向。 | confirmed-source | `skills/spec-work/SKILL.md:484` | P0 应升级此段，不新增 review/audit/debt/gain 命令。 |
| Shipping review 已有 Tier 2 sensitive surface escalation 与 Known Residuals durable sink。 | confirmed-source | `skills/spec-work/references/shipping-workflow.md:27`、`skills/spec-work/references/shipping-workflow.md:49` | `protected-gap` 和 deferred minimality debt 先复用现有出口。 |
| `skills/spec-work/evals/examples.json` 是 examples-as-context，不是运行时语义质量证明。 | confirmed-source | `skills/spec-work/SKILL.md:61`、`skills/spec-work/evals/examples.json` | eval case 可防 prompt 漂移，但不能声称证明行为改变。 |
| `tests/unit/spec-work-contracts.test.js` 现有验证形态主要是 `toContain` / `not.toContain` prose contract。 | confirmed-source | `tests/unit/spec-work-contracts.test.js:27`、`tests/unit/spec-work-contracts.test.js:82`、`tests/unit/spec-work-contracts.test.js:124` | PRD 验收必须区分静态合同与行为有效性。 |
| 用户提供的仓外调研材料把 06-22 报告定位为问题诊断，把 06-26 技术方案与测试验证文档定位为实现基线。 | user-stated | 用户请求与仓外参考材料 | 仓外材料不列入 frontmatter `source_inputs`，正文按 reference-claim 使用。 |
| `spec-work` 已有 Domain Language / Decision Ledger 和 Follow Existing Patterns 段，要求实现依赖术语、ADR-like 决策或项目 standards 时先消费现有 context，并遵循 scope-matched confirmed team standards。 | confirmed-source | `skills/spec-work/SKILL.md:73`、`skills/spec-work/SKILL.md:473` | 架构 fit 不应新建 standards 子系统，而应把这些既有约束前移到 durable surface 写前判断。 |
| `spec-work` 已有 work-phase reuse recheck：当 plan 含 `Existing Capability / Reuse Analysis`、`Reuse decision:` 或 `Work-phase recheck:` 时，实现前必须重查当前 source，若 `new` 决策已过期则优先 reuse/extend。 | confirmed-source | `skills/spec-work/SKILL.md:233`、`skills/spec-plan/references/reuse-analysis.md:76` | 这是“严格复用现有能力”的现有锚点。 |
| team standards contract 明确：`spec-work` 可把 scope-matched confirmed standards 作为 changed files 的约束，但实现仍必须基于 direct source/test/diff evidence。 | confirmed-source | `docs/contracts/team-standards.md:208` | 架构规则可约束 work，但不能让 work 用泛化最佳实践替代当前 source 证据。 |
| 当前 confirmed architecture standards 的硬规则集中在 source/runtime ownership：runtime/control-plane 输出不是 architecture source truth，架构变化必须落在 checked-in source paths。 | confirmed-source | `docs/standards/architecture.md:29`、`docs/standards/shared.md:29` | P0 的架构 fit 必须至少守住 source/runtime ownership，不把 generated mirror 当架构落点。 |

<!-- prd:section=change_delta -->
## 变更增量

| item | current | target | delta | evidence |
| --- | --- | --- | --- | --- |
| Phase 2 写前判断 | Test Discovery 后直接 implement | Test Discovery 与 implement 之间显式运行 `Work Minimality Preflight` | extend | `skills/spec-work/SKILL.md:388` 到 `skills/spec-work/SKILL.md:390` |
| 最小性判断形态 | 只有 scope、feedback loop、reuse pattern 和后置 simplify | 3+2 compact attention prompt：need / reuse / abstraction，加 existing vertical-slice 与 scope-stop 引用 | extend | 06-26 技术方案 reference-claim；当前 source 无该段 |
| 架构适配判断 | standards/reuse/pattern 分散在 intake、Phase 1 与 Follow Existing Patterns，主要发生在实现过程中 | 在 preflight 中显式合并 architecture fit：先确认 existing architecture / standards / layer ownership / dependency direction / source-of-truth / reuse anchor，再写 durable surface | extend | `skills/spec-work/SKILL.md:73`、`skills/spec-work/SKILL.md:233`、`skills/spec-work/SKILL.md:473` |
| Simplify finding 去向 | 后置人工审查，无分类 | `remove-now`、`minimality-debt`、`protected`，其中 protected 分 keep/gap | extend | `skills/spec-work/SKILL.md:484` 到 `skills/spec-work/SKILL.md:490` |
| 运行时 artifact/schema | 无 minimality 字段 | P0 不新增字段，不把语义判断塞入 deterministic artifact | keep | `skills/spec-work/SKILL.md:122` 说明 run artifact 是 write-side contract |
| Runtime mirror | `.claude/`、`.codex/`、`.agents/skills/` 为 generated runtime | P0 不手改 generated mirrors；需要投射时另由 `spec-first init` 处理 | keep | `AGENTS.md` source/runtime 边界 |
| 验证声明 | contract tests 可证明 prose anchors | 明确行为有效性需 fresh-source eval、人工复核或真实 run 观察 | extend | `tests/unit/fresh-source-eval-contracts.test.js` 与当前 eval 边界 |

## Change Topology

Primary topology: workflow-change

此变更调整 `spec-work` 的执行时注意力和 review 姿态，属于 workflow/skill 行为语义变化。它不改变 CLI entrypoint、task-pack contract、run artifact schema、package surface 或 host runtime generation。规划时应把它作为 source skill prose 增量，而不是新能力子系统。

## Surface Map

| surface | current behavior | owner/source | artifact/contract | consumer | delta | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| `skills/spec-work/SKILL.md` | 执行 workflow source，包含 Phase 2 loop 和 Simplify 规则 | source | SKILL.md | work workflow runtime projection、human reviewers、fresh-source eval | extend | `skills/spec-work/SKILL.md:77`、`skills/spec-work/SKILL.md:377`、`skills/spec-work/SKILL.md:484` |
| `skills/spec-work/evals/examples.json` | 5 个 examples-as-context | source | prompt-examples/v1 | skill audit/eval fixture tests、fresh-source reviewers | extend | `skills/spec-work/evals/examples.json` |
| `tests/unit/spec-work-contracts.test.js` | prose contract anchors | source | Jest unit tests | CI / local validation | extend | `tests/unit/spec-work-contracts.test.js` |
| `CHANGELOG.md` | source change ledger | source | changelog format | humans、release notes | extend | `CHANGELOG.md` |
| `docs/contracts/team-standards.md` / `docs/standards/**` | confirmed standards selection and source surface | source | standards contract / rule cards | work、plan、code-review、doc-review | consume only | `docs/contracts/team-standards.md:184`、`docs/contracts/team-standards.md:208` |
| `skills/spec-plan/references/reuse-analysis.md` | plan-time `reuse / extend / new` decision lens and work-phase recheck | source | plan reference | spec-plan、spec-work | consume only | `skills/spec-plan/references/reuse-analysis.md:3`、`skills/spec-plan/references/reuse-analysis.md:76` |
| generated runtime mirrors | 由 source 投射 | generated | `.claude/**`、`.codex/**`、`.agents/skills/**` | host runtime | keep out of P0 | `AGENTS.md` |

## Producer / Artifact / Consumer

| producer | artifact/schema/path | freshness/authority | consumers | change effect | evidence |
| --- | --- | --- | --- | --- | --- |
| `spec-work` source author | `skills/spec-work/SKILL.md` | current source | runtime generation、work users、reviewers | 新增注意力 prompt 和 simplify 分类 | confirmed-source |
| eval fixture author | `skills/spec-work/evals/examples.json` | current source | `prompt-examples-contracts`、`eval-fixture-contracts` | 新增 1 个 composite minimality case | confirmed-source |
| test author | `tests/unit/spec-work-contracts.test.js` | current source | Jest | 锁定 prose anchor、loop order、negative boundaries | confirmed-source |
| changelog author | `CHANGELOG.md` | current source | reviewers、release notes | 记录 user-visible source skill 行为变化 | confirmed-source |

## Source-Of-Truth Resolution

| item | current source-of-truth | target source-of-truth | generated mirrors / non-authoritative refs | conflict rule |
| --- | --- | --- | --- | --- |
| `spec-work` behavior prose | `skills/spec-work/SKILL.md` | same | `.agents/skills/spec-work/SKILL.md`、`.claude/**`、`.codex/**` | 修改 source；runtime drift 由 generation 处理。 |
| minimality eval examples | `skills/spec-work/evals/examples.json` | same | runtime mirror copies | 修改 source examples；不新建 `minimality-examples.json`。 |
| P0 validation contract | `tests/unit/spec-work-contracts.test.js` plus eval fixture tests | same | 无 | tests 只证明结构与 anchors，不证明 agent runtime 行为。 |
| architecture / project standards constraints | `docs/contracts/team-standards.md` + matched `docs/standards/**` confirmed active rule cards | same | generic best practices、candidate standards、historical docs | Work 可消费 scope-matched confirmed standards；不得把 candidates 或泛化架构偏好当 hard context。 |
| reuse / extend / new plan decisions | source plan + `skills/spec-plan/references/reuse-analysis.md` | same | stale plan text、external tool candidates | Work 实现前重查当前 source；若 source 证明 `new` 已过期，优先 reuse/extend 并在 closeout 解释。 |
| external Ponytail/reference reports | 仓外调研材料 | advisory reference-claims | 公众号、仓外 markdown、历史报告 | 可影响需求判断，但不能成为 repo current-state confirmed-source。 |

<!-- prd:section=requirements -->
## 需求

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | 在 `Feedback Loop And Vertical Slices` 后新增 `Work Minimality Preflight` 段，定位为 implementation choice 前的 attention prompt，明确不是 gate，也不替代 LLM 语义判断。 | 当前 `Anti-Rationalization Red Flags` 已有非 gate 文风，见 `skills/spec-work/SKILL.md:92`。 |
| R-02 | P0 | 在 Phase 2 Task Execution Loop 中，把 preflight 插入 `Find existing test files...` 与 `Implement following existing conventions` 之间。 | 当前 loop 缺口位于 `skills/spec-work/SKILL.md:389` 到 `skills/spec-work/SKILL.md:390`。 |
| R-03 | P0 | Preflight 必须采用 3+2 结构：三个新增判断是 active scope 是否要求、能否复用或删除或配置或标准库或平台或已装依赖、是否只为未来想象新增抽象；两个引用是现有 vertical-slice 与 scope-stop 规则。 | 06-26 技术方案基线；避免复制已有规则形成双源维护。 |
| R-04 | P0 | Preflight 的触发对象必须覆盖 dependency、file、abstraction、configuration、helper、wrapper 或其他 durable surface；不得扩成每行代码都要 justification。 | 小任务摩擦必须保持低，调研材料明确反对长篇仪式。 |
| R-05 | P0 | 新 abstraction、mode flag、generalized helper、wrapper 默认需要当前消费者证据；单调用点默认不抽象，除非有安全、一致性、框架约定或测试可维护性证据。 | 针对 AI 常见 single-use abstraction overbuild。 |
| R-06 | P0 | 更短实现不得删除 protected code；protected code 包括 data-loss protection、security validation、accessibility、observability 和 required verification。 | 当前 System-Wide Test Check 与 shipping review 可承接大部分 protected risk，见 `skills/spec-work/SKILL.md:418` 与 `skills/spec-work/references/shipping-workflow.md:27`。 |
| R-07 | P0 | Minimality decision note 仅在 preflight 改变实现方向、拒绝明显 overbuild、或保留非显然 protected code 时记录；普通小改动不输出 minimality note。 | 复用现有 Decision Ledger 字段，避免新 schema 和小任务噪音。 |
| R-08 | P0 | `Simplify as You Go` 必须把发现归入 `remove-now`、`minimality-debt`、`protected`、`architecture-mismatch` 四类；`protected` 需区分 keep 与 gap。 | 当前 Simplify 段存在但无分类，见 `skills/spec-work/SKILL.md:484`。 |
| R-09 | P0 | `remove-now` 必须在当前 run 内删除并用现有反馈环验证；`minimality-debt` 必须复用 tracker-defer 或 Known Residuals；`protected-gap` 必须进入 Known Residuals 或后续 review focus，不得静默留下。 | 复用 shipping residual sink，见 `skills/spec-work/references/shipping-workflow.md:49`。 |
| R-10 | P0 | P0 不新增 `minimality_mode`、public workflow、新命令、独立 minimality reference 子系统、task-pack 字段、run artifact 字段、CLI 行为或 schema。 | 符合 Light contract 与 06-26 技术方案拒绝清单。 |
| R-11 | P0 | P0 只允许修改 source：`skills/spec-work/SKILL.md`、`skills/spec-work/evals/examples.json`、`tests/unit/spec-work-contracts.test.js`、`CHANGELOG.md`；不得手改 generated runtime mirrors。 | README 决策索引与 source/runtime 边界。 |
| R-12 | P0 | `examples.json` 只新增 1 个 composite minimality case，覆盖 native-before-dependency、single-use-abstraction、keep-protected、small-change-zero-note、scope-expansion-stop 的组合，不突破现有 examples 上限。 | `prompt-examples-contracts` 要求 examples 数量不超过 6。 |
| R-13 | P0 | Contract tests 必须锁定 `Work Minimality Preflight` 段、loop order、3+2 关键词、非 gate 文风、Simplify 四分类、拒绝 schema/CLI/runtime mirror 扩展等 prose anchors。 | 当前测试形态是 prose contract。 |
| R-14 | P0 | 完成声明必须区分静态结构验证与行为有效性：contract tests 不能声称证明 agent 行为已改变；fresh-source eval 可为 `passed`、`concerns` 或 `not_run`，`not_run` 必须有 reason code。 | fresh-source eval checklist 与测试验证文档。 |
| R-15 | P0 | `Work Minimality Preflight` 必须扩展为 `Minimality + Architecture Fit` 判断：当实现将新增或改变 durable surface 时，先确认该路径是否遵循当前 plan/task、nearby source patterns、confirmed standards、source/runtime ownership、layer ownership、dependency direction、decoupling boundary 和 reuse/extend/new 决策。 | 用户明确询问优化后 work skill 是否会思考架构层面设计、严格遵循项目规范、架构、分层、解耦、复用；当前 source 已有 standards/reuse/pattern 锚点但未集中成写前判断。 |
| R-16 | P0 | Architecture fit 判断必须基于 direct source/test/docs/contracts evidence：读取 `docs/contracts/team-standards.md` 与 `docs/standards/index.md` 后只选择 scope-matched `trust=confirmed,lifecycle_state=active` 规则；不得把 candidate standards、历史方案、graph/retrieval candidate 或泛化最佳实践当硬约束。 | `docs/contracts/team-standards.md:184`、`docs/contracts/team-standards.md:208`。 |
| R-17 | P0 | 当实现需要新增公共 contract、跨模块抽象、schema/runtime/config surface、source-of-truth entry、workflow handoff、provider boundary 或 generated runtime delivery 变化时，`spec-work` 必须停回 `spec-plan` 或 task-pack regeneration，而不是在执行中临场做架构设计。 | Work 可做 execution-time architecture fit 判断，但不得替代 planning-time architecture decision。 |
| R-18 | P0 | 当 plan 已声明 `Reuse decision:`、`Existing Capability / Reuse Analysis` 或 `Work-phase recheck:` 时，`spec-work` 必须在实现前重查当前 source；若现状显示可 reuse/extend，则在同 scope 内优先 reuse/extend，并在 closeout 说明为何偏离 plan 的 `new` 决策。 | `skills/spec-work/SKILL.md:233`、`skills/spec-plan/references/reuse-analysis.md:76`。 |
| R-19 | P0 | `Simplify as You Go` 的分类必须新增或明确 `architecture-mismatch` 去向：发现当前 diff 绕开分层、破坏 source/runtime ownership、重复已有 owner、跨边界耦合、或把通用抽象放错层时，若能在当前 scope 内修正则修正；若修正需要架构决策则作为 blocker/follow-up 交回 plan/review，不得静默保留。 | 补足“少写代码”之外的“写在正确架构位置”闭环。 |
| R-20 | P0 | Decision note 在 architecture-fit 改变实现方向时也必须可用：记录 `question`、`recommended_answer`、`source_tag`、`chosen_answer`、`consequence`，并引用具体 standards rule ID、source path 或 nearby pattern；不得只写“遵循最佳实践”。 | 复用现有 Decision Ledger 字段，同时满足 review standards 对规则引用的要求。 |
| R-21 | P1 | 后续 review 节点应补 `protected-code-regression` focus 或等价 review lens，用于 security、reliability、accessibility、observability、testing protected code 的回归兜底；同时可让 maintainability/project-standards reviewers 检查 `architecture-mismatch` 残留。这不阻塞 P0。 | 06-26 技术方案 Step 2，当前 source 未具名落地。 |
| R-22 | P1 | 后续 `spec-plan` 可在 material 时提供 Minimal Implementation Contract 与 Architecture Fit Contract，后续 `spec-compound` 可沉淀 verified minimal-implementation / architecture-fit learning；P0 不预先实现这些全链路能力。 | 避免 work 节点独吞 minimality 或 architecture governance layer。 |

## Goals / Success Metrics

| goal | observable signal | baseline | target / decision rule |
| --- | --- | --- | --- |
| 减少明显 overbuild | fresh-source eval 或真实 work run 中拒绝不必要 dependency、single-use abstraction 或 wrapper 的记录 | 当前无 preflight | 至少有一个 composite eval case 覆盖，真实行为证据不由 contract tests 代替。 |
| 保持 protected-code 质量 | review 或 diff-shape 处置不显示因简化删除 validation、auth、error handling、accessibility、observability 或 tests 的未解释回归 | 当前依赖系统级测试检查与 review | 任何 protected deletion candidate 必须有 direct evidence、review confirmation 或 Known Residuals。 |
| 控制 workflow 摩擦 | small-change-zero-note 场景不要求长 minimality 报告 | 当前无 note | Preflight 只在方向改变时记录 compact note。 |
| 保持 source/runtime 边界 | P0 diff 不包含 `.claude/**`、`.codex/**`、`.agents/skills/**` | source/runtime 边界已存在 | P0 只改 source 与 tests/changelog；runtime regeneration 另行处理。 |
| 避免 schema creep | 无 CLI、task-pack、run artifact、contract schema 改动 | 当前无 minimality schema | P0 验收中 diff 必须无这些 surface。 |
| 遵循现有架构与项目规范 | fresh-source eval 或人工复核能看到 work 在新增 durable surface 前读取/引用 matched standards、nearby patterns 或 reuse decision，并在越界时停回 plan | 当前 standards/reuse/pattern 规则分散存在 | composite eval 至少覆盖一个架构 fit 场景；P0 文案必须明确“work 会思考架构 fit，但不临场重做架构”。 |
| 防止架构化过度设计 | 真实 run 或 eval 中拒绝单调用点 service/factory/adapter、错层 helper、重复 owner、绕开 source-of-truth 的实现 | 当前只有 Follow Existing Patterns / Simplify 提醒 | architecture-fit note 或 closeout 能说明选择 reuse/extend/local implementation 的证据。 |

<!-- prd:section=acceptance_examples -->
## 验收示例

AE-01（覆盖 R-01、R-02、R-03、R-04、R-05）
Given 一个任务要新增日期输入能力，且现有 HTML/native platform capability 满足 plan 的要求
When `spec-work` 在 Phase 2 完成 Test Discovery 后准备新增 date-picker dependency 或 wrapper
Then agent 先运行 `Work Minimality Preflight`，选择 native capability 或已有能力，并且只有在该选择改变实现方向时记录 compact decision note

AE-02（覆盖 R-06、R-08、R-09、R-21）
Given 一个更短实现会删除 validation、permission check、ARIA/label、failure cleanup、必要日志或对应测试
When `Simplify as You Go` 或 preflight 发现该删除候选
Then 该候选不得只因 LOC 更少被删除；它必须被归为 `protected` keep，或作为 `protected-gap` 进入 Known Residuals / 后续 review focus

AE-03（覆盖 R-07）
Given 一个小文案修正、局部配置修正或无行为变化的单文件 docs 改动
When 没有新增 dependency、file、abstraction、config、helper、wrapper 或 durable surface
Then `spec-work` 不输出长篇 minimality note，也不把 preflight 变成额外 ceremony

AE-04（覆盖 R-08、R-09）
Given 完成 2-3 个实现单元后发现一个 dead wrapper、一个可延后清理的重复 helper、和一个看似可删但承担安全校验的分支
When 运行升级后的 `Simplify as You Go`
Then dead wrapper 作为 `remove-now` 在本 run 删除并用反馈环验证；重复 helper 作为 `minimality-debt` 进入现有 residual sink；安全分支作为 `protected` keep 留下并说明非显然理由

AE-05（覆盖 R-10、R-11）
Given 后续计划执行 P0
When 生成 diff
Then diff 只触及 `skills/spec-work/SKILL.md`、`skills/spec-work/evals/examples.json`、`tests/unit/spec-work-contracts.test.js`、`CHANGELOG.md`；不得出现新的 public workflow、CLI、schema、task-pack 字段、run artifact 字段或 runtime mirror 手改

AE-06（覆盖 R-12、R-13、R-14）
Given P0 source prose 和 eval case 已修改
When 运行静态验证
Then contract tests 证明 anchors 与 fixture structure 存在；closeout 明确“静态结构验证通过”，但不得声称这些测试已经证明 agent runtime 行为改变；fresh-source eval 未运行时必须记录 `dispatch_authorization_missing` 或其他具体 reason

AE-07（覆盖 R-22）
Given planning 发现需要在 plan 阶段声明 Minimal Implementation Contract 或在 compound 阶段沉淀 learning
When P0 work skill 升级完成后继续全链路演进
Then 这些能力作为 P1/P2 进入各自 workflow 节点，不回填到 P0 `spec-work` 子系统

AE-08（覆盖 R-15、R-16、R-18、R-20）
Given 一个任务准备新增 helper、adapter、service、workflow reference 或 source surface，且当前仓库已有相邻 owner、confirmed standard 或 `Reuse decision:` 可复用
When `spec-work` 运行 `Minimality + Architecture Fit` preflight
Then agent 必须先基于 direct source/docs/contracts 识别可复用或应扩展的 owner；若选择 reuse/extend，需在 closeout 或 decision note 中引用具体 source path、standard rule ID 或 nearby pattern，而不是泛称“按最佳实践”

AE-09（覆盖 R-17、R-19）
Given 最小可行实现需要新增公共 contract、跨模块抽象、schema/runtime/config surface、source-of-truth entry 或改变 provider/source-runtime boundary
When `spec-work` 发现该架构决策未被 plan/task-pack 授权
Then 它必须停止并给出 user-facing handoff，推荐返回 `spec-plan` 或 task-pack regeneration；不得在 work 中临场发明架构方案后继续实现

AE-10（覆盖 R-19、R-21）
Given `Simplify as You Go` 发现本次 diff 把逻辑放入错误层、绕开 confirmed source-of-truth、复制已有 owner、或引入跨层耦合
When 修正不扩大当前 scope
Then agent 应在当前 run 修正并用同一反馈环验证；如果修正需要新的架构决策，则归为 `architecture-mismatch` residual 并交给 plan/review，不得静默留在实现里

<!-- prd:section=scope_boundaries -->
## 范围边界

### In Scope

- 在 `skills/spec-work/SKILL.md` 增加 `Work Minimality Preflight` 段。
- 在 Phase 2 Task Execution Loop 中插入 preflight 调用行。
- 将 `Simplify as You Go` 升级为四分类，并声明 protected-code 不可为简洁删除。
- 将 preflight 明确扩展为 architecture-fit 判断，覆盖 confirmed standards、source/runtime ownership、layer ownership、dependency direction、decoupling boundary、nearby pattern 与 reuse/extend/new recheck。
- 将 `Simplify as You Go` 升级为 `remove-now`、`minimality-debt`、`protected`、`architecture-mismatch` 分类，并声明 protected-code 与 architecture ownership 不可为简洁删除或“架构化”绕开。
- 在 `skills/spec-work/evals/examples.json` 新增 1 个 composite minimality case。
- 在 `tests/unit/spec-work-contracts.test.js` 增加 source prose contract anchors 与 negative assertions。
- 更新 `CHANGELOG.md`，标注 `(user-visible)`。

### Out Of Scope

- 不新增或暴露 `spec-work minimality-audit`、`minimality-review`、`minimality-debt`、`minimality-gain` 等 public workflow 或命令。
- 不新增 `minimality_mode`、task-pack 字段、run artifact schema 字段、CLI 子命令、contract schema 或 persistent minimality artifact。
- 不新增 `skills/spec-work/references/minimality-*.md` 作为 P0。
- 不默认全仓 audit，不做指标采集管线，不把 LOC 作为唯一成功指标。
- 不手改 `.claude/**`、`.codex/**`、`.agents/skills/**`。
- 不在 P0 修改 `spec-code-review`、`spec-plan`、`spec-compound` 或 `spec-optimize`。
- 不让 `spec-work` 接管 planning-time 架构设计：新增公共 contract、跨模块抽象、schema/runtime/config/source-of-truth/provider boundary 等未授权决策仍必须回到 `spec-plan`。
- 不把 generic clean architecture / DDD / layered architecture 口号写成 hard rule；只有 repo source、scope-matched confirmed standards、plan/task-pack 或 owner/source evidence 能成为当前 work 的约束。

## Negative Acceptance

NA-01
Given 后续实现想把 06-22 第一版报告中的 mode 矩阵、独立 gate 文件、run artifact minimality 字段和新 debt sink 一次性落地
When 该实现被拿来满足本 PRD 的 P0
Then 应判定为 scope expansion，并返回 plan/refine，而不是合入 P0

NA-02
Given 代码更短但会删除 security、data-loss、accessibility、observability 或 required verification 保护
When agent 以 minimality 为理由删除该保护
Then 该行为不满足本 PRD，即使 LOC 或文件数下降

NA-03
Given contract tests 全部通过
When closeout 声称“agent 行为已被测试证明”
Then 该声明不满足本 PRD；只能说静态 prose/fixture contract 通过，行为有效性另由 fresh-source eval、人工复核或真实 run 观察承接

NA-04
Given P0 diff 包含 generated runtime mirror 手改
When runtime mirror 与 source 不一致
Then 该改动不满足本 PRD；必须回到 source 或 generator，再按需要运行 runtime regeneration

NA-05
Given agent 以“架构更清晰”为理由新增 service/factory/adapter/provider、公共 helper、mode flag 或跨模块 abstraction
When 当前 plan/task-pack 没有授权该 durable surface，且 nearby source 没有当前消费者或 confirmed standard 支撑
Then 该行为不满足本 PRD；work 应选择局部实现、reuse/extend 现有 owner，或停回 plan，而不是自行扩架构

NA-06
Given agent 引用“最佳实践”“分层架构”“解耦”作为修改理由
When 它不能引用具体 source path、scope-matched confirmed standard、plan decision、nearby pattern 或 direct evidence
Then 该理由不能作为 architecture-fit 通过依据；generic best practice 只能作为 advisory，不是 hard context

<!-- prd:section=evidence_assumptions -->
## 证据与假设

| claim | tag | source / owner | note |
| --- | --- | --- | --- |
| 用户目标是进一步思考 `spec-work` 优化并输出需求文档，而不是直接改 `spec-work`。 | user-stated | 当前用户请求 | 因此本次产物是 PRD requirements。 |
| 06-26 技术方案是实现基线，06-22 报告作为问题诊断和被收敛的历史方案。 | user-stated | 仓外调研目录 README 与正文 | 仓外路径不写入 frontmatter `source_inputs`，因为它们不是 target repo 内 repo-relative inputs；repo 内 source refs 已列入 frontmatter `source_inputs` 以支持输入侧复验。 |
| 当前 `spec-work` 的真实 source 在 `skills/spec-work/SKILL.md`，generated mirrors 不是 source-of-truth。 | confirmed-source | `AGENTS.md` source/runtime 边界；`skills/spec-work/SKILL.md` | PRD 当前状态不引用 runtime mirror 行号作为 confirmed-source。 |
| P0 source-only 方案足以规划下一步实现。 | assumption | 本 PRD judgment | 依据是所有 P0 requirements 都绑定到 source/prose/tests/changelog，不需要 owner 再决定产品 WHAT。 |
| fresh-source eval 在当前 Codex 请求中没有明确 subagent/persona 授权。 | assumption | 当前运行模式 | 后续 P0 实现若未获授权，应合法记录 `fresh_source_eval: not_run` 和 `dispatch_authorization_missing`，不得声称通过。 |
| 优化后的 `spec-work` 应思考架构适配，但该思考的职责是“符合现有架构并发现越界”，不是替代 `spec-plan` 做新架构设计。 | user-stated + assumption | 用户追问；角色契约与 workflow 边界 | 本 PRD 将其写入 P0 architecture-fit preflight 与 P0 stop-back-to-plan 边界。 |
| 当前 confirmed team standards 可作为 work 的 hard context 仅限 scope-matched active rules；候选规范、历史方案和 generic best practice 只能 advisory。 | confirmed-source | `docs/contracts/team-standards.md`、`docs/standards/index.md` | 防止“严格遵循规范”被误读成全仓扫描或口号式最佳实践。 |

## External Reference Claims

| ref_id | title | authority | consumed_by | limitation |
| --- | --- | --- | --- | --- |
| EXT-01 | 目录 README：Ponytail YAGNI 与 spec-work 最小性升级 | reference-claim | Summary、Scope Boundaries、Requirements | 仓外本地参考，不是 target repo source。 |
| EXT-02 | 2026-06-22 第一版 Ponytail/YAGNI spec-work optimization plan | reference-claim | Problem Frame、Negative Acceptance | 诊断成立但方案过重；其中 runtime mirror 行号不作为 confirmed source。 |
| EXT-03 | 2026-06-26 work skill minimality upgrade tech design | reference-claim | Requirements、Acceptance Examples、Scope Boundaries | 作为本 PRD 的主要方案基线，但仍用当前 repo source 重新锚定事实。 |
| EXT-04 | 2026-06-26 work skill minimality upgrade test validation | reference-claim | Goals / Success Metrics、Readiness Self-Check | 验证上限按当前测试 source 再确认。 |

## Planning Recheck

| item | why recheck | required before | blocks planning? |
| --- | --- | --- | --- |
| 重新读取 `skills/spec-work/SKILL.md` 对应位置 | 本 PRD 生成后 source 可能继续变化，插入点行号可能漂移 | 编辑前 | no |
| 重新读取 `tests/unit/spec-work-contracts.test.js` | 当前测试为 prose contract，后续可能已有并行改动 | 写测试前 | no |
| 检查 `CHANGELOG.md` 顶部最新条目 | 工作区已有并行 changelog 改动，避免覆盖 | 写 changelog 前 | no |
| 重新匹配 `docs/standards/index.md` 中适用于 changed files 的 confirmed active rules | work 实现时 touched files 可能决定哪些 standards 真正 scope-matched | 编辑 `spec-work` 前 | no |

<!-- prd:section=outstanding_questions -->
## 待决问题

无阻断性 owner 问题。P0 的 WHAT、source 边界、architecture-fit 边界、scope boundaries 和验证上限均已由用户输入、仓外参考材料和当前 repo source 关闭。后续实现若发现 `spec-work` source、standards index 或 reuse-analysis 相关 source 已被并行修改，应按 `Planning Recheck` 重新定位，不视为产品需求未决。

<!-- prd:section=readiness_self_check -->
## Readiness Self-Check

write_mode: final-prd
clarification_evidence: source-proven-no-ask
preflight_sweep_closure: closed
decision_card_highest_risk_gap: 把 06-22 重方案误升级为 P0 子系统，把 prose contract 测试误说成行为证明，或把“work 思考架构”误实现成 work 临场重做架构设计。
decision_card_next_action: final-prd
decision_card_why_no_invention: P0 source、测试、eval、changelog、architecture-fit 判断和 stop-back-to-plan 边界已明确；拒绝清单和 P1/P2 边界已写入；planning 只需选择实现顺序，不需要再发明 WHAT。
design_source_coverage: not-applicable
can_enter_spec_plan: yes
why_not: none

## Handoff Context Slice

handoff_context_slice:
- confirmed WHAT: `spec-work` P0 增加 Minimality + Architecture Fit Preflight、Phase 2 loop 插入点、Simplify 四分类、1 个 composite eval case、contract tests 与 changelog。
- owner decisions: 用户要求聚焦 work skill，并基于指定调研目录输出详细需求文档。
- accepted assumptions: P0 不需要新增 schema/CLI/runtime mirror；fresh-source eval 可因 dispatch authorization 缺失合法 not_run，但必须记录 reason；work 会做 architecture-fit 判断，但未授权架构决策仍停回 plan。
- source refs to re-read: `skills/spec-work/SKILL.md`、`skills/spec-work/evals/examples.json`、`tests/unit/spec-work-contracts.test.js`、`skills/spec-plan/references/reuse-analysis.md`、`docs/contracts/team-standards.md`、`docs/standards/index.md`、`CHANGELOG.md`。
- unresolved WHAT blockers: none。
- planning recheck items: 上方 Planning Recheck 三项。
- degraded facts: 仓外调研材料为 reference-claim；行为有效性不能由 prose contract tests 证明。
