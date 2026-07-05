---
spec_id: 2026-06-01-003-gitnexus-capability-intent-routing
artifact_kind: decision-record
target_surface: generic
status: superseded
evidence_grade: confirmed-source
created: 2026-06-01
superseded: 2026-06-01
supersede_reason: brainstorm-pressure-test-concluded-do-nothing
---

# GitNexus 能力意图分流(capability-intent routing)

## Superseded — 本次不做(decision record)

> **status: superseded(2026-06-01)。本文档不再作为待执行 PRD;转为 decision record,保留完整推理链,供以后避免重复提案。** 下方原 PRD 正文(Summary 起)是被推翻方案的历史记录,不代表当前结论。

经一次 `spec-brainstorm` 产品层压测,**结论是不推进本方案,也不新建替代方案**。本次 spec-first 不产出任何代码或 prose 改动。

### 1. 为何推翻(两个被证伪的方案)

- **capability-intent routing(本文档原方案)**:它是「止损」(防止 agent 把文本定位误派给 GitNexus 弱项),不是「增益」。低杠杆,且**不指向任何 Evaluation Harness 指标**——按角色契约第 7 节「需能指向至少一个 Evaluation 指标」,它不够格进核心路径。误用损耗是否高频到值得改注入式 prose(影响所有项目),目前**没有度量证据**,仅有一次被记录的 case(`docs/12-bug分析/gitnexus多仓模式group配置问题分析.md`)。
- **A-work 覆盖补齐(brainstorm 中途提出又撤回)**:给 `spec-work` 加确定性 impact pre-facts。撤回依据:**work 不需要 impact,coding 阶段不需要全局知识图谱**。`impact_radius` 是 plan-time 决策(决定 scope/风险/拆分);到 coding,scope 已定,work 是收敛执行,只需局部 context(Read/grep/LSP/测试即可)。给 work 补 impact 等于把「该在 plan 算清的事」延后到 coding 现场补救,并把 review 的 blast-radius 职责泄漏进 work。核实确认 hidden pre-facts helper 的 `WORKFLOWS={doc-review,code-review,plan,debug}` 不含 work——这是**正确设计,不是断点**。

### 2. 现状结论(图谱已接在对的两端)

图谱价值沿链路 `理解/Plan → Code/Work → Review` 呈「两端高、中间低」:

- **plan 前理解 + review** = 长处(impact / execution_flow / related-tests / blast-radius)高价值点,且**均已接入**:plan 有 `Graph / GitNexus Evidence Posture` + hidden helper `--workflow plan`;review 有 helper + `related_tests` 全链路(mcp-setup 写 `impact_probe` → graph-bootstrap 跑 → review 消费)。
- **code/work** = 低价值点,不接入是对的设计。

因此当前**无需新建**:routing 与 A 都不做。

### 3. Future direction(有真实信号再启动,本次不立项)

两个真正可能指向「提升 AI coding 效果」的方向,记录但不启动:

- **(质量)plan/review 图谱质量**:确保查到的 impact 真正喂进决策,而非「查了等于没查」。承载位已存在(`plan-template.md` 的 `impact_on_plan` / `source_reads_required` 字段),问题是是否被认真填与下游消费。**前置依赖度量**。
- **(度量)graph-to-finding 闭环**:角色契约把 `graph-to-finding ratio` 列为 Evaluation 指标但**尚未实现**(现仅有 `graph_capability_usage` 原始 usage,度量「用了什么」而非「用了之后有没有变准」)。这是真空白,直接回答「图谱能否真正提升 AI coding 效果」。

**启动条件**:出现「怀疑 plan/review 查了图谱但没变准」的真实信号时,先立**度量(graph-to-finding)**独立 brainstorm,再据度量结果决定质量方向。无信号则保持不做——避免为假想问题造仪表盘(度量本身也有 carrying cost)。

---

> 以下为原 PRD 正文,**已 superseded**,仅作历史推理记录保留。

# GitNexus 能力意图分流(capability-intent routing)

## Summary

spec-first 注入到每个项目 host 入口(`CLAUDE.md` / `AGENTS.md` managed block）的 GitNexus 指引,当前把**「代码查询、影响分析、代码理解」三类任务打包成同一句「使用 GitNexus 作为首选工具」**(`confirmed-source`,`src/cli/gitnexus-instruction-block.js` 四个 render 函数均如此)。这条 prose 把 GitNexus 的**长项**(影响面 / 调用链 / route·API·契约 / related-tests / blast-radius——`rg` 无法替代)与**弱项**(文本定位:查词、枚举、字段、SQL、文案——`rg` 更快更稳)混为一谈,统一推销给 GitNexus。

后果在 `docs/12-bug分析/gitnexus多仓模式group配置问题分析.md` 已被记录:一次「出金支持几种方式」的枚举查询(本属 `rg` 主场)被引导去依赖 GitNexus,随后 agent 看到 readiness 的 `recommended_query_path=direct-read-fallback` 又误读为「GitNexus 全局禁用」,执行路径两头别扭。

本次增量的目的是**把 GitNexus 的工具选择从「可用性问题」纠正为「适用性问题」**:让注入式 prose 与各 workflow 的 GitNexus 引用按**任务意图分流到对应能力档**——文本定位走 `rg`,影响/契约/blast-radius 走 GitNexus 长项,符号关系理解按目标明确度二选。本次**仅做 prose 与 contract 层的指引重构**,不改 GitNexus provider、不改 readiness 编译器判定逻辑、不改 `recommended_query_path` 取值、不新增 readiness 字段。

本工件是 PRD-grade 需求,供当前宿主 plan workflow 消费;它定义重构后 GitNexus 指引应满足的 WHAT(意图→能力档→工具的分流规则、保留项、双宿主/双语一致性、验证口径),不规定逐行措辞或具体实现。

## Problem Frame

GitNexus 是 spec-first 的 Context/Evidence Harness 中最重的 external provider。它真正不可替代的价值是**结构化代码关系图谱**,这一点在源码的能力分档里有明确定义(`confirmed-source`,`skills/spec-graph-bootstrap/scripts/bootstrap-providers.sh`):

- **full 档**(完整索引时产出):`execution_flow`、`impact_radius`、`detect_changes`、`route_api_evidence`、`shape_check`、`review_context_candidate`、related-tests——这些 `rg` 完全无法替代。
- **query-only 档**(definitions-only / 降级时):`architecture_map`、`dependency_map`、`repo_wiki`、`query_global_graph`、`query_context_orientation`——其中 `query_global_graph` 两档都有,是保底能力,**与 `rg` 部分重叠,优势不绝对**。

当前问题不在 readiness 字段,而在**注入式 prose 把这三类意图打包**:

- **弱项被强推**:把「代码查询」(文本定位,`rg` 主场)与「影响分析」(GitNexus 长项)并列为「GitNexus 首选」,引导 agent 对枚举/字段查询也优先动用 GitNexus 的弱能力,成本更高、结果更不稳。
- **fallback 被误读为全局禁用**:多仓 prose 让 agent「按 `group.status` / `recommended_query_path` 分流」,但 `recommended_query_path=direct-read-fallback` 在 script mode 是结构性必然(脚本不读 live MCP),它表达的是「父级 group 未评估」而非「GitNexus 不可用」。prose 没有把「group 未配 ≠ 全局禁用、impact 类对明确子仓仍可用 repo-local」说清。
- **各 workflow 口径不齐**:Review 已明确「GitNexus 是 diff-impact evidence source」(定位准),Brainstorm 已禁止 `impact`/`detect_changes`(定位准),但 Plan 偏「候选 repo orientation」、未突出 `impact_radius` 才是 plan 的核心价值;且各处对「文本定位用 `rg`」没有统一引用源。

本次继承 `docs/12-bug分析/gitnexus多仓模式group配置问题分析.md` 的事实分析,但**纠正其优化方向**:该文档(及一版废弃方案）倾向「让 agent 别误读 fallback、多用 repo-local query」,而 repo-local 的 `query`(找符号定位)恰是 GitNexus 最弱、最该让位 `rg` 的能力。正确方向是按能力档分流,而非降低弱项用法的摩擦。

## Change Delta

| 现状(confirmed-source) | 变更类型 | 目标 |
|---|---|---|
| `gitnexus-instruction-block.js` 把「代码查询、影响分析、代码理解……GitNexus 首选」打包(四版本:中英 × single/multi-repo) | `replace` | 改为按意图分流:长项强调 + 弱项让位 + fallback 语义澄清 |
| 多仓 prose「按 `group.status`/`recommended_query_path` 分流」未澄清 fallback ≠ 全局禁用 | `extend` | 明确 group 未配时 impact 类对明确子仓仍可用 repo-local full,文本定位仍走 `rg` |
| Plan 的 GitNexus prose 偏「候选 repo orientation」 | `extend` | 补「`impact_radius` 是 plan 的核心 GitNexus 价值,决定任务拆分与风险」 |
| Review / Brainstorm / Debug / Work 的 GitNexus 定位(已较准) | `keep` + 最小对齐 | 仅统一「文本定位走 `rg`」口径,不重写结构 |
| 各 workflow 各自重述 GitNexus 取舍规则 | `extend` | 在 `graph-evidence-policy.md` 集中「意图→能力档→工具」规则,各处引用而非重述 |
| 上一版 A1 方案(`repo_local_query_ready` / `group_query_ready` readiness 字段) | `keep`(本次不引入) | 放弃——它强化弱项用法;readiness 编译器、schema、`recommended_query_path` 不动 |

本次不改变 GitNexus provider、readiness 编译器判定逻辑、`workspace-gitnexus-readiness.v1` schema、`recommended_query_path` 取值集合、CLI 行为或 runtime 生成机制;只改注入式 prose、各 workflow GitNexus 引用 prose 与 contract 文档。

## Current System Snapshot

仅记录影响本 PRD 的当前事实(均为 `confirmed-source`,来自阅读仓库源码):

- 注入式 source slice:`src/cli/gitnexus-instruction-block.js` 含 `renderChineseGitNexusBody` / `renderEnglishGitNexusBody`,各有 single-repo 与 multi-repo-workspace 两支,共四个 prose 版本;single-repo 版措辞为「代码查询、影响分析、代码理解类任务……使用 GitNexus 作为首选工具」;multi-repo 版要求「按 `group.status` / `recommended_query_path` 分流」。
- 该 prose 生成 `CLAUDE.md` / `AGENTS.md` 的 GitNexus managed block,是 source slice;runtime mirror(`.claude/`、`.codex/`、`.agents/skills/`)由 `spec-first init` 重生成。
- GitNexus 能力两档定义在 `bootstrap-providers.sh`(full 档含 `impact_radius`/`execution_flow`/`detect_changes`/`route_api_evidence`/related-tests;query-only 档含 `query_global_graph` 等)。
- 各 workflow GitNexus prose 现状:`spec-code-review` 明确「GitNexus is the review/diff-impact evidence source」;`spec-brainstorm` 明确「只做 WHAT,禁止 impact/detect_changes/group_sync」;`spec-debug` 限定「有明确 stack-trace symbol / diff 才用 query/context/impact」;`spec-work` 限定「不自己 refresh,impact 来自 review handoff」;`spec-plan` 读 `native_capabilities` 但 prose 偏候选 repo orientation。
- `recommended_query_path` 在 skill-prose mode 可产出 `group-query` / `bounded-registry-fanout` / `direct-read-fallback`;script mode 因不读 live MCP 恒为 `direct-read-fallback`(`compile-workspace-gitnexus-readiness.js`)。这是结构性行为,不在本次改动范围。
- 既有测试(`confirmed-source`,已核实):注入式 GitNexus prose 的断言归属是 `tests/unit/gitnexus-instruction-block.test.js`(`:48` 中文 `**使用 GitNexus 作为首选工具**`、`:75` 英文 `**use GitNexus as the preferred tool**`、`:73` `**first** read graph-facts`)与 `tests/unit/repository-guidance-contracts.test.js`(`:50` 同一中文措辞);`tests/unit/init-dry-run.test.js`、`tests/unit/clean-dry-run.test.js`、`tests/unit/runtime-tools-index.test.js`、`tests/unit/spec-graph-bootstrap.sh` 也引用该 prose 文本。`tests/unit/instruction-bootstrap.test.js` 注入的是 workflow-entry bootstrap block,不覆盖 GitNexus prose,本次不涉及。本次改动会破坏 `gitnexus-instruction-block.test.js:48` 与 `repository-guidance-contracts.test.js:50` 的「首选工具」精确断言,须同步更新。
- 既有测试:`tests/unit/spec-graph-bootstrap-contracts.test.js` 锁定 graph-bootstrap SKILL/脚本 prose;CLAUDE.md「Agent 与 Skill 变更验证」要求对注入 agent 的行为 prose 做 fresh-source eval。
- 文档基础(`confirmed-source`,已核实):`docs/contracts/graph-evidence-policy.md` 自称是「workflow prose 与 host instruction block 的 source of truth」,已含 `## GitNexus 使用边界`(`:87` 声明 GitNexus 长项)与 `## Provider 职责`(`:114-116` GitNexus/ast-grep/源码分工),是分流规则的天然归宿(决策 2 承载位)。`docs/contracts/graph-provider-consumption.md`(artifact/字段级速查)与 `docs/contracts/workspace-gitnexus-consumption.md`(parent workspace registry/group 边界)是相邻 contract,语义不匹配分流规则,本次不作承载位。

## Requirements

**能力档与工具适配(核心分流规则)**

- R1. 注入式 GitNexus 指引必须显式区分三类任务意图并映射到工具:(a) **文本定位**(查某个词、枚举值、字段、SQL、文案、配置在哪)优先用 `rg`,不必为此先动 GitNexus;(b) **影响 / 契约 / blast-radius**(改某符号或 DTO 影响哪些模块/接口、diff 影响面、调用链、route/API/契约关系、related-tests)优先用 GitNexus 长项,这是 `rg` 无法替代的价值;(c) **符号关系理解**(已知目标后看调用方/被调用方/orientation)GitNexus 与 `rg` 皆可,按目标是否明确选择。
- R2. 该指引必须「长项强调」与「弱项让位」并重:既不得继续把文本定位打包成「GitNexus 首选」,也不得贬低为「少用 GitNexus」;目标是让 agent 在影响/契约类任务上更主动用 GitNexus,在文本定位上坦然用 `rg`。
- R3. 指引必须沿用既有事实优先约束:GitNexus 结果与源码或测试冲突时,以已验证事实为准;definitions-only / 降级证据只能作为文件/符号指针,不替代直接源码确认。

**Fallback 语义澄清(消除误读)**

- R4. 多仓 workspace 的 GitNexus 指引必须澄清:`recommended_query_path=direct-read-fallback` 或 `group.status=group-missing` / `not-evaluated-no-mcp-input` 表示「父级跨仓 group 查询未就绪」,**不等于 GitNexus 全局不可用**;当任务落在明确子仓且该子仓有 repo-local GitNexus 证据时,影响/契约类任务仍应优先使用该子仓的 repo-local GitNexus full 能力,文本定位仍走 `rg`。
- R5. 该澄清不得反向鼓励对文本定位任务强行使用 repo-local GitNexus(纠正上一版 A1 方向);repo-local GitNexus 的优先级仅适用于 R1(b) 的影响/契约/关系理解意图。

**各 workflow 节点适配(按链路定位)**

- R6. `spec-plan` 的 GitNexus prose 必须明确 GitNexus 在规划阶段的核心价值是 `impact_radius` / 跨模块影响 / route·契约关系——用于判断任务拆分粒度与风险,而非仅作候选 repo orientation;保留其既有「LLM 选择语义 target repo、resolver 只供确定性 readiness」边界。
- R7. `spec-code-review`、`spec-debug`、`spec-brainstorm`、`spec-work` 的 GitNexus 定位结构保持不变(已较准),仅统一「文本定位走 `rg`」口径,使其与 R1 一致;不得借机重写这些 workflow 的 GitNexus 段落结构。
- R8. 分流规则必须在 `docs/contracts/graph-evidence-policy.md` 有单一承载位(extend 既有 `## GitNexus 使用边界` 与 `## Provider 职责` 两节,补「文本定位优先 `rg`」一条,使长项声明与弱项让位成对);各 workflow 与注入式 prose 引用该政策(它本就是「workflow prose 与 host instruction block 的 source of truth」)而非各自重述,避免多真相源。不新建独立 contract 文件。

**双宿主与双语一致性**

- R9. `gitnexus-instruction-block.js` 的四个 prose 版本(中文/英文 × single-repo/multi-repo)必须同步表达等价的分流规则,不得一方更新而另一方保留旧打包措辞;中英文可本地化表达,但关键约束(意图分流、fallback 语义、事实优先)必须等价。
- R10. 改动必须对 Claude 与 Codex 双宿主等价生效;由于是注入式 prose,改 source 后 runtime mirror 须通过 `spec-first init` 重生成,不得手改 `.claude/` / `.codex/` / `.agents/skills/`。

**边界保持(不扩散)**

- R11. 本次不得引入 readiness 字段(含上一版 A1 的 `repo_local_query_ready` / `group_query_ready`)、不得改 `compile-workspace-gitnexus-readiness.js` 的判定逻辑、不得改 `recommended_query_path` 取值集合、不得 bump `workspace-gitnexus-readiness.v1`。
- R12. 分流 prose 必须保持轻量,以三类意图为骨架,不得膨胀为枚举无穷场景的决策树或状态机式流程;低频边缘场景交由 LLM 判断,不进 prose。
- R13. 本次不得改 GitNexus provider、不得代替用户配置 group(`gitnexus group create/add/sync` 属用户环境操作);不得把 GitNexus 的 `group add` registry-name 用法等 provider 内部细节固化进 spec-first contract。

**验证闭环**

- R14. 改动完成后必须记录轻量验证:(a) 更新 `tests/unit/gitnexus-instruction-block.test.js` 与 `tests/unit/repository-guidance-contracts.test.js` 中对旧「首选工具 / preferred tool」打包措辞的精确断言,改为断言新意图分流措辞,并覆盖四版本(中英 × single/multi-repo)一致;同步检查 `init-dry-run.test.js`、`clean-dry-run.test.js`、`runtime-tools-index.test.js`、`spec-graph-bootstrap.sh` 中对同一 prose 文本的引用是否需要随措辞更新;(b) 按 CLAUDE.md「Agent 与 Skill 变更验证」做一次 fresh-source eval——把改后的注入 prose 注入全新通用 subagent,分别给「查某枚举支持几种取值」与「改某 DTO 影响哪些子仓」两个任务,验证它分别选 `rg` 与 GitNexus impact;若宿主缺 dispatch primitive 则记录未执行原因。

## Acceptance Examples

- AE1. **Covers R1, R2, R3.** Given 一名 agent 读取注入的 GitNexus 指引,when 它面对「`WithdrawPaymentMethodEnum` 出金付款方式支持几种取值」这类枚举文本定位任务,then 它优先用 `rg` 完成而不先动 GitNexus,且不会因此被指引判为降级或失败;when 它面对「改 `WithdrawPaymentMethodEnum` 影响哪些调用方/子仓」,then 它优先用 GitNexus impact 而非 `rg` 逐文件搜。
- AE2. **Covers R4, R5.** Given 一个父级多仓 workspace 且 `group_list` 为空、`recommended_query_path=direct-read-fallback`,when agent 处理一个明确落在 `hs-kaz-crm-money-service` 的影响分析任务,then 它理解「group 未配 ≠ GitNexus 全禁」并对该子仓使用 repo-local GitNexus full 能力;but when 任务是文本定位,then 它仍走 `rg` 而不强行 repo-local GitNexus。
- AE3. **Covers R6, R7.** Given 维护者阅读 `spec-plan` 的 GitNexus prose,then 它明确 `impact_radius` 决定任务拆分与风险是 plan 阶段 GitNexus 的核心价值;and given 阅读 Review/Debug/Brainstorm/Work 的 GitNexus 段落,then 其既有结构未被重写,仅与「文本定位走 `rg`」口径一致。
- AE4. **Covers R8.** Given 分流规则需要更新,when 维护者修改它,then 只需改 `docs/contracts/graph-evidence-policy.md` 的 `## GitNexus 使用边界` / `## Provider 职责` 两节,各 workflow 与注入式 prose 引用该政策而非各自重述同一规则;不存在第二处分流规则定义。
- AE5. **Covers R9, R10.** Given 维护者更新中文 single-repo 版 prose,then 英文版与两个 multi-repo 版同步表达等价分流规则,无一方保留旧「GitNexus 首选」打包措辞;and Claude 与 Codex 宿主 init 后生成的 managed block 等价。
- AE6. **Covers R11, R12, R13.** Given 改动落地,then `compile-workspace-gitnexus-readiness.js`、`recommended_query_path` 取值、`workspace-gitnexus-readiness.v1` schema 均未改变,未新增 readiness 字段;分流 prose 以三类意图为骨架未膨胀为决策树;未引入 GitNexus group CLI 用法到 contract。
- AE7. **Covers R14.** Given 改动已实现,when 执行验证,then 记录相关测试断言更新结果与一次 fresh-source eval(两任务分别命中 `rg` 与 GitNexus impact),或在宿主缺 dispatch 能力时记录未执行原因。

## Scope Boundaries

**In scope**
- `src/cli/gitnexus-instruction-block.js` 四个 prose 版本的意图分流重构。
- `spec-plan` GitNexus prose 的 impact 价值补强;Review/Debug/Brainstorm/Work 的最小口径对齐。
- extend `docs/contracts/graph-evidence-policy.md` 的「意图→能力档→工具」分流规则(`## GitNexus 使用边界` / `## Provider 职责`)。
- 相关测试断言更新 + fresh-source eval。
- CHANGELOG(user-visible)、README/docs 必要同步判断。

**Out of scope**
- readiness 编译器逻辑、`recommended_query_path` 取值、`workspace-gitnexus-readiness.v1` schema、任何新 readiness 字段(含 A1)。
- GitNexus provider 行为、group 配置、`group_sync`、registry 操作。
- KAZ 等具体用户 workspace 的环境配置与现状收敛。
- GitNexus 与 `rg` 之外的工具选择策略(ast-grep 等)。

## Evidence And Assumptions

- `confirmed-source`:`gitnexus-instruction-block.js` 四 prose 版本的打包措辞、`bootstrap-providers.sh` 能力两档、各 workflow GitNexus prose 现状、`compile-workspace-gitnexus-readiness.js` 的 `recommended_query_path` 行为——均来自直接阅读源码。
- `assumption`:文档 `docs/12-bug分析/gitnexus多仓模式group配置问题分析.md` 记录的 KAZ live 状态(`group_list=[]`、各子仓索引存在)未在本仓亲自复现,采信其记录;它仅作为问题动机,不作为本 PRD 的实现依据。
- `assumption`:GitNexus 「文本定位弱于 `rg`、impact/contract 不可替代」的判断基于能力分档与工具本质(图谱 vs 文本检索),非基准测试结论;prose 表达为「优先级建议」而非「绝对禁止」,保留 LLM 最终判断空间。

## Outstanding Questions

### Resolved (owner-confirmed)
- **改动 2 范围 = A' 最小对齐(修正版)**(owner-confirmed 2026-06-01)。依据全仓核实:含 GitNexus prose 的 15 个 SKILL.md 按角色分三类——A 类 owner/installer(`spec-graph-bootstrap`、`spec-mcp-setup`)不动;B 类 boundary/consumer-of-summary(`spec-release-notes`、`spec-optimize`、`spec-write-tasks`、`spec-prd`、`spec-doc-review`、`spec-compound`、`spec-compound-refresh`、`spec-brainstorm`)不动(已是边界声明或已限定,改即修没坏的东西);C 类主动使用指引中,仅 `spec-plan`(impact 价值偏弱)与 `using-spec-first`(`:249` GitNexus-first 措辞 + 多仓 fallback 语义)有真实缺口须补强,`spec-code-review` / `spec-debug` / `spec-work` 定位已准,仅统一「文本定位走 `rg`」一句口径。即:补强 spec-plan + using-spec-first,review/debug/work 最小口径对齐,其余 10 节点不动。本决策细化 R6/R7,plan 据此限定改动面。

- **contract 承载位 = extend `docs/contracts/graph-evidence-policy.md`**(owner-confirmed 2026-06-01)。核实纠正:PRD 原列的 `workspace-gitnexus-consumption.md`(parent workspace 边界)与 `graph-provider-consumption.md`(artifact/字段级速查)语义均不匹配。正确归宿是 `graph-evidence-policy.md`——它自称是「workflow prose 与 host instruction block 的 source of truth」,已含 `## GitNexus 使用边界`(`:87` 声明 GitNexus 长项:execution flow / symbol relationship / blast radius / change detection)与 `## Provider 职责`(`:114-116` 已分工 GitNexus / ast-grep / 直接源码)。本次是 **extend 非 new**:在这两节补「文本定位(查词/枚举/字段/SQL/文案)优先 `rg`」一条,使长项声明与弱项让位成对;注入式 prose 与各 workflow prose 引用该政策(本就是其 source of truth),不另建承载位。

### Deferred to Planning
- fresh-source eval 的具体 checklist 与判定阈值,按 `docs/contracts/workflows/fresh-source-eval-checklist.md` 在 plan/实施期细化。

## Implementation Verification

- 直接源码确认:改后四 prose 版本含意图分流、不含旧「GitNexus 首选」打包措辞、含 fallback 语义澄清。
- `npx jest tests/unit/gitnexus-instruction-block.test.js tests/unit/repository-guidance-contracts.test.js` 及引用同一 prose 的 init/clean dry-run、runtime-tools-index 测试通过或按需更新。
- fresh-source eval 行为验证(两任务分别命中 `rg` 与 GitNexus impact)。
- 不依赖当前会话已缓存的 typed-agent/skill 调用;runtime regeneration 用 `spec-first init`,不手改 runtime mirror。

## Next Steps

- 进入当前宿主 plan workflow,消费本 PRD。两个 scope-changing 决策(改动 2 范围 = A' 最小对齐;contract 承载位 = extend `graph-evidence-policy.md`)已 owner-confirmed(见 Outstanding Questions / Resolved),plan 直接据此限定改动面,无需重新拍板;仅剩 fresh-source eval checklist 在实施期细化。
- 建议实现顺序:① 根因改 `gitnexus-instruction-block.js` 四版本 → ② extend `graph-evidence-policy.md` 分流规则 → ③ spec-plan + using-spec-first 补强、review/debug/work 口径对齐 → ④ 更新 `gitnexus-instruction-block.test.js` / `repository-guidance-contracts.test.js` 等断言 → ⑤ fresh-source eval → ⑥ CHANGELOG。
- 实施期遵守 source/runtime 边界与双宿主/双语一致性;不手改 runtime mirror,用 `spec-first init` 重生成。
