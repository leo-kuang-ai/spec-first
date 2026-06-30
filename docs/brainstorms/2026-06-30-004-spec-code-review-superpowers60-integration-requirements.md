---
spec_id: 2026-06-30-004-spec-code-review-superpowers60-integration
artifact_kind: prd-requirements
target_surface: CLI/DevTool
primary_topology: workflow-change + contract-change
status: draft
write_mode: checkpoint-prd
can_enter_spec_plan: no
readiness_outcome: ask-owner
clarification_evidence: source-proven-no-ask
evidence_grade: mixed
created: 2026-06-30
codex_prd_guard: not_available
source_inputs:
  - /Users/kuang/xiaobu/spec-first-doc/claw/2026-06-29/Superpowers60实测-spec-first借鉴集成/2026-06-29-superpowers60-token-quality-spec-first-integration-report.md
  - /Users/kuang/xiaobu/superpowers
---

# Superpowers 6.0 实测对 spec-code-review 的借鉴集成需求

## Summary

本文基于本地调研报告《Superpowers 6.0 实测》与 `/Users/kuang/xiaobu/superpowers` 源码，分析 `spec-first` 的 `spec-code-review` skill 可借鉴的提升点。核心结论是：`spec-code-review` 已经具备多 persona、confidence gate、Stage 5b validator、Coverage、summary-first handoff 与 `autofix_class` 等强审查骨架；最值得借鉴的不是机械合并 reviewer，而是把 **Diff Boundary / scope creep** 变成一等审查轴，并让 review 输入由任务边界、执行者声明、完整 diff、验证证据组成文件化 handoff。除此之外，review 还应引入 **Graph-Assisted Impact Review**：对共享符号、入口、API、workflow、contract、source/runtime 等高影响 diff，用 code-graph/codegraph 识别调用链、依赖链、候选爆炸半径和 affected-test 线索，再回到源码/diff/test/log/contract 证据确认。

本文是 checkpoint PRD，不是 ready-for-planning PRD。默认推荐的最小落地是 Phase A：只做 `spec-code-review` review-only + graph Coverage/eval，不先改 `spec-plan`、`spec-work`、task-pack 或 progress ledger。是否进入 Phase B 的 Expected Touch Set / per-task review package，或 Phase C 的 Pre-Flight Plan Review / progress ledger，仍需 owner 决策；`finding_type`、`scope_boundary` 和 graph candidates 的机器可读位置也仍需 owner 决策。

## Problem Frame

Superpowers 6.0.3 的实测价值不只是 token 降低。报告记录 v6.0.3 的总 tokens 从 193,813 降到 150,599，约降 22%；更关键的是，v6.0.3 发现了 v5.1.0 两个 reviewer 漏掉的 scope creep：Task 2 的 diff 包含不该出现的 `storage.py` 重写和 `cli.py` 删除。报告将根因归纳为 reviewer 读取了完整 git diff 文件，而不是只依赖执行者摘要或任务片段。

`spec-first` 的目标高于单次 SDD 执行：它要守住 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge` 的工程闭环。借鉴 Superpowers 时，不能把它的执行框架照搬成中心状态机，而应抽象为符合 spec-first 的轻合同：

- review 必须拥有完整 diff 视角，能识别“改了不该改的东西”。
- review 必须拥有调用链和影响面视角，能识别“这个改动会传到哪里、会影响谁、哪些测试最该看”。
- task/work handoff 必须区分任务事实源、执行者声明源、代码事实源与审查裁决源。
- 长任务恢复不能依赖对话记忆，但 progress evidence 也不能成为第二套 source-of-truth。
- 脚本只能准备 diff、changed files、artifact paths、hash、validation facts；scope creep 是否成立仍由 reviewer 做语义判断。
- codegraph / code-graph 只能提供 candidate impact map；调用链、爆炸半径、affected-test 候选进入 finding 前必须用源码、diff、测试、日志或 contract 重新确认。native codegraph 返回的带行号源码片段可作为 bounded direct read，但关系推断本身仍是 candidate。

## Current System Snapshot

| surface | current behavior | evidence | implication |
| --- | --- | --- | --- |
| `spec-code-review` 输入 | 支持 current branch diff、PR、branch、`base:`、`plan:`、mode token；Stage 1 会产出 `FILES`、`DIFF`、`UNTRACKED`。 | `skills/spec-code-review/SKILL.md:21-31`, `skills/spec-code-review/SKILL.md:287-304`, `skills/spec-code-review/SKILL.md:423-431` | 已有完整 diff 基础，但未把“授权边界是否被突破”作为独立 verdict 字段。 |
| reviewer selection | Stage 3 计算 changed files、line count、docs/config/sensitive 等 facts，并按风险选择 minimum/full reviewer set。 | `skills/spec-code-review/SKILL.md:477-533` | 已有 reviewer mode selection 雏形，不需要直接照搬“统一 reviewer”。 |
| reviewer output schema | finding schema 包含 `severity`、`autofix_class`、`owner`、`requires_verification`、`confidence`、`evidence`、`pre_existing`。 | `skills/spec-code-review/references/findings-schema.json:17-88` | 缺 `finding_type` / `scope_boundary` / `authorized_scope` 相关字段或映射层。 |
| merge/dedup/validation | Stage 5 做 schema validate、dedup、confidence gate、routing；Stage 5b 可对 externalizing modes 做 per-finding validator。 | `skills/spec-code-review/SKILL.md:739-837` | 可承接新 finding 类型，但要避免 validator 或 synthesis 把 scope-boundary finding 当普通 maintainability 建议降噪。 |
| Stage 6 Coverage/Verdict | Coverage 记录 suppressed、validator drops、residual risks、testing gaps、direct evidence posture；Verdict 可反映 explicit plan 缺项。 | `skills/spec-code-review/SKILL.md:839-866` | 适合增加 `scope_boundary: clean | concern | violation | unknown`，并记录 touch-set 覆盖限制。 |
| Direct evidence routing candidates | 对 route/API、response shape、shared symbol/helper、MCP/RPC tool、多 repo diff，Stage 3 已记录需要检查 handler、callers/consumers、tests、contracts 等直接证据目标。 | `skills/spec-code-review/SKILL.md:568-578` | 这是 codegraph 最自然的落点：把 `rg`/ast-grep 手工找 callers 的部分升级为 code-graph 候选链路，再回源确认。 |
| Capability-class evidence boundary | `spec-code-review` 已引用 `docs/contracts/project-graph-consumption.md`，规定 `code-graph` / `project-graph` 只能作为 advisory review input，缺失或 stale 时 fallback。 | `skills/spec-code-review/SKILL.md:107-109`, `docs/contracts/project-graph-consumption.md` | 可以引入 codegraph 而不破坏 evidence-first：图谱帮助决定看哪里，不能直接证明 finding。 |
| resource lens / optional capability precedent | `resource-governance-lens` 是 deterministic advisory lens，状态和 reason_codes 进入 Coverage，不阻断 review、不替代 reviewer judgment。 | `skills/spec-code-review/SKILL.md:494-510`, `src/cli/helpers/resource-governance-lens.js:97-146` | Graph-Assisted Impact Review 可沿用同一模式：记录候选、reason_code、limitation，不把 provider 输出当 confirmed truth。 |
| `spec-work` per-task review gate | 对 `review_gate: required` 的 task，要求记录 `pre_task_base`，执行后跑 `spec-code-review mode:report-only base:{pre_task_base} plan:{source_plan}`，并携带 task id、declared files、actual changed files、review_focus。 | `skills/spec-work/SKILL.md:213-218` | 已经非常接近 Superpowers 的 per-task review package，但缺标准化 package 文件与 touch-set schema。 |
| `spec-plan` implementation unit | 每个 unit 有 `Files: Create / Modify / Test`、test scenarios、verification。 | `skills/spec-plan/references/plan-template.md:182-218` | 已有文件焦点，但缺 `should_touch / may_touch / must_not_touch / requires_approval_if_touching` 这类授权边界。 |
| summary-first handoff | `artifact-summary.v1` 和 `context-bundle.v1` 支持 summary、paths、evidence refs、full-read triggers。 | `docs/contracts/artifact-summary.md:1-72`, `docs/contracts/context-bundle.md:1-120` | 不应新造一套通用 review-package schema；优先复用或映射现有合同。 |
| work run artifact | `spec-work-run-artifact/v2` 记录 changed files、artifact refs、resume evidence、validation 等。 | `docs/contracts/workflows/spec-work-run-artifact.schema.json:1-240` | 可作为 progress ledger 的候选承载，但当前不是 task-level progress ledger，也不应被误用为 approval state。 |

## External Evidence Snapshot

| source | source-backed observation | implication for spec-first |
| --- | --- | --- |
| Superpowers SDD skill | 每个 task 由 implementer 完成后生成 review package，再派 task reviewer；clean review 后写 progress ledger。 | `/Users/kuang/xiaobu/superpowers/skills/subagent-driven-development/SKILL.md:45-83` |
| Pre-Flight Plan Review | 执行 Task 1 前扫描 plan 中任务冲突、Global Constraints 冲突、plan 明令但 reviewer 视为缺陷的内容。 | `/Users/kuang/xiaobu/superpowers/skills/subagent-driven-development/SKILL.md:85-97` |
| review package | `scripts/review-package BASE HEAD` 写入 commits、diff stat、`git diff -U10`。 | `/Users/kuang/xiaobu/superpowers/skills/subagent-driven-development/scripts/review-package:1-44` |
| task reviewer | reviewer 先读 task brief，再读 implementer report，再读 diff file；报告 spec compliance 与 code quality，且不能信任 implementer report。 | `/Users/kuang/xiaobu/superpowers/skills/subagent-driven-development/task-reviewer-prompt.md:21-62`, `/Users/kuang/xiaobu/superpowers/skills/subagent-driven-development/task-reviewer-prompt.md:78-91` |
| file handoffs | controller 传 task brief、report file、review package 路径；执行报告与 diff 不进入 controller 长期上下文。 | `/Users/kuang/xiaobu/superpowers/skills/subagent-driven-development/SKILL.md:219-245` |
| durable progress | 会话压缩后以 `.superpowers/sdd/progress.md` 和 git log 恢复，不信对话记忆。 | `/Users/kuang/xiaobu/superpowers/skills/subagent-driven-development/SKILL.md:246-264` |
| 调研报告 | 报告建议首选五点：完整 diff review package、scope creep 专项审查、progress ledger、Pre-Flight Plan Review、文件化 handoff。 | `/Users/kuang/xiaobu/spec-first-doc/claw/2026-06-29/Superpowers60实测-spec-first借鉴集成/2026-06-29-superpowers60-token-quality-spec-first-integration-report.md:752-779` |
| codegraph local tool contract | 本轮 codegraph 对 Markdown skill/doc 无索引，需直接读；对 JS source 可返回 verbatim source、caller/callee trail、blast radius；仓内仅能确认 `codegraph` 在 dependency readiness baseline 中出现，未发现专门的 review helper producer。 | `mcp__codegraph.codegraph_node` / `mcp__codegraph.codegraph_search` 本轮结果 | 需求应先定义消费合同与降级路径，不应假设已有 `spec-first internal codegraph-impact` producer。 |

## Change Delta

| item | current | target | delta |
| --- | --- | --- | --- |
| Review axes | spec compliance、code quality、requirements completeness、testing gaps、residual risks 等分散存在。 | 增加 Diff Boundary Review 轴：是否修改了授权范围外文件、删除/重写无关模块、引入未授权 config/build/dependency 变化、应拆分为新任务的变更。 | extend `spec-code-review` |
| Impact graph | Stage 3 对 broad/impact-sensitive diff 只列 direct evidence targets，callers/consumers 主要靠 `rg`/ast-grep 或人工判断。 | 增加 Graph-Assisted Impact Review：从 changed symbols / routes / exported APIs / workflow entrypoints 出发，用 codegraph 获取 caller/callee/path/dependent 候选，形成 `impact_chain_candidates` 和 `blast_radius_candidates`，再由 reviewer 回源确认。 | extend `spec-code-review` |
| Finding semantics | `severity` 与 `autofix_class` 描述严重度与处理路径。 | 增加或派生 `finding_type`，至少覆盖 `scope_creep`、`unauthorized_file_change`、`unverifiable_claim`、`missing_verification`。 | contract-change candidate |
| Verdict/Coverage | Coverage 记录 evidence posture，但不单独描述 scope boundary。 | 增加 `scope_boundary: clean | concern | violation | unknown`，并说明判断依据来自 explicit plan/touch set、inferred plan、diff-only 或 unavailable。 | workflow-change |
| Blast radius coverage | Coverage 已有 direct evidence posture、resource lens status、residual risks、testing gaps。 | Coverage 增加 graph usage summary：provider readiness/freshness、query shape、accepted/rejected candidates、confirmed source refs、limitations、fallback reason。 | workflow-change |
| Plan/task boundary | plan unit 有 `Files: Create / Modify / Test`。 | 增加 Expected Touch Set：`should_touch`、`may_touch`、`must_not_touch`、`requires_approval_if_touching`。 | plan/work/review shared contract candidate |
| Work-to-review handoff | `spec-work` required gate 已携带 task id、declared files、actual changed files、source plan、review_focus。 | 标准化 per-task review package，作为 paths-first bundle：task brief、implementer report、full diff、verification summary、expected touch set、known limitations。 | workflow-change |
| Long-task recovery | `spec-work-run-artifact/v2` 有 run-level changed files/resume evidence。 | 复杂 work 增加 task-level progress ledger 或扩展 run artifact 的 recoverable task-state summary；不把它做成中心状态机。 | gated contract-change |
| Pre-flight | `spec-plan`/`spec-work` 有 scope/review gate，但缺执行前 plan contradiction scan。 | 在 plan->work 或 task-pack intake 增加 Pre-Flight Plan Review，检查任务冲突、Global Constraints、接口矛盾、scope ambiguity、future reviewer likely blockers。 | workflow-change |
| Measurement | 没有专门评估 review package/scope boundary 改造收益的 benchmark。 | 建立 benchmark：tokens/tool calls/turns、review findings、scope creep 检出、返工次数、恢复步骤。 | evaluation-harness |

## Landing Slices

| phase | default scope | requirements | planning implication |
| --- | --- | --- | --- |
| Phase A: review-only | 只改 `spec-code-review` 的 reviewer wording、Stage 3/4/6 Coverage、report-only 表达、graph fallback/eval；不先改 `spec-plan` / `spec-work` schema。 | R-01..R-05, R-09, R-15, R-19, R-20..R-30 | owner 接受字段落点后可独立规划；没有 Expected Touch Set 时必须输出 `scope_boundary=unknown/concern`，不能伪造 clean。 |
| Phase B: task boundary handoff | 增加 Expected Touch Set 与 per-task review package，把授权边界从 plan/task-pack 传给 review。 | R-06..R-08, R-16, R-17 | 需要跨 `spec-plan` / task-pack / `spec-work` consumer contract 决策，不能混入 Phase A 首批。 |
| Phase C: recovery and pre-flight | 处理 Pre-Flight Plan Review、task-level progress/recovery evidence、后续 compound 沉淀。 | R-10..R-14, R-18 | 属于 workflow orchestration / recovery 增强；需要真实长任务或 fixture 数据后再推进。 |

## Requirements

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | `spec-code-review` 必须增加 Diff Boundary Review 轴，显式检查 diff 是否落在任务授权边界内，包括越界文件、无关模块重写/删除、未说明的 config/build/dependency 变化、应拆分的新任务。 | Superpowers 实测中 scope creep 被完整 diff 发现；报告建议 P0。 |
| R-02 | P0 | `spec-code-review` 的最终报告必须在 Coverage 或 Verdict 中给出 `scope_boundary: clean | concern | violation | unknown`，并说明依据等级：`explicit-touch-set`、`declared-files-only`、`inferred-plan`、`diff-only`、`unknown`。 | 当前 Stage 6 Coverage 可承接；避免无 touch-set 时伪造 clean。 |
| R-03 | P0 | `spec-code-review` finding schema 或 Stage 5 synthesis 映射必须支持 `finding_type`。首轮最小集合：`scope_creep`、`unauthorized_file_change`、`unverifiable_claim`、`missing_verification`；实现时可先作为 synthesis 派生字段进入 report，再决定是否升级到 reviewer JSON schema。 | 当前 schema 无类型字段；直接改 schema 影响 downstream，需要 owner 决策。 |
| R-04 | P0 | 当 `finding_type=scope_creep` 或 `unauthorized_file_change` 时，finding 必须包含 evidence：越界文件或 hunk、授权边界来源、为什么该变更不是完成当前任务的必要修改、最小处置建议。 | 避免把 scope creep 退化为笼统“范围有点大”。 |
| R-05 | P0 | `spec-code-review` 不得把高置信 scope-boundary finding 静默降级到 soft bucket；若边界依据不足，只能输出 `scope_boundary=unknown` 或 residual risk，不能声称 clean。 | Stage 5 confidence/demotion 需要为新 finding 类型保留抵达用户路径。 |
| R-06 | P1 | Phase B 中，`spec-plan` 或 task-pack 应提供 Expected Touch Set，字段至少包括 `should_touch`、`may_touch`、`must_not_touch`、`requires_approval_if_touching`；路径必须是目标 repo 相对路径，允许目录或 glob 但语义要清楚。 | `Files: Create/Modify/Test` 是文件焦点，不是授权边界；此项不阻塞 Phase A review-only 规划。 |
| R-07 | P1 | Phase B 中，`spec-work` 在 required review gate 前必须形成 per-task diff anchor，并把 task id、source plan、expected touch set、actual changed files、verification summary、review_focus 传给 `spec-code-review`。如果无法形成可靠 diff range，必须 handoff，不得把 whole-branch review 伪装成 task-level review。 | 已有 `pre_task_base` 规则；本需求补标准 package 内容，但不拖宽 Phase A。 |
| R-08 | P1 | Phase B 中，per-task review package 应采用 paths-first handoff：task brief path、implementer report path、full diff path 或 diff range、verification summary path/ref、expected touch set、known limitations。执行者报告是 claim source，full diff 是 code fact source。 | Superpowers file handoff 的关键价值是减少 controller context 污染并扩大 reviewer 证据视野；首批可先用现有 review input 模拟。 |
| R-09 | P0 | `spec-code-review` reviewer prompt 必须明确“不要信任 implementer report”；执行者报告中的 rationale、测试声明、范围说明都必须回到 diff/source/test/log 证据确认。 | Superpowers task reviewer 明确把 implementer report 当 unverified claims。 |
| R-10 | P1 | 对低风险、边界清晰的 task-level mini review，可试点 unified task reviewer lens：一次输出 spec compliance、code quality、diff boundary、evidence sufficiency；高风险、安全、迁移、架构、source/runtime diff 仍保留多 persona。 | `spec-code-review` 已有 scale-aware reviewer selection，适合扩展而不是全局合并。 |
| R-11 | P1 | plan->work 之间增加 Pre-Flight Plan Review。首轮可作为 `spec-work` intake 或 `spec-plan` readiness/checklist，而不是硬脚本 gate；检查任务矛盾、Global Constraints 冲突、接口不一致、verification 缺口、oversized task、scope boundary ambiguity、future reviewer likely blockers。 | Superpowers 源码在 Task 1 前扫描 plan 冲突；spec-first 应保留 LLM 语义判断。 |
| R-12 | P1 | complex / long-running `spec-work` 需要 task-level progress ledger 或 recoverable task-state summary，至少记录 task id、status、diff range、review verdict、verification status、residual risks、recovery instruction。 | 当前 run artifact 是 run-level evidence；长任务恢复仍可能依赖会话记忆。 |
| R-13 | Constraint | progress ledger 不得成为 source scope authority、approval state 或计划状态机；scope authority 仍来自 PRD/plan/task-pack，completion 仍需 diff/test/review evidence。 | 遵守 role contract 中 artifact 类型与 source/runtime 边界。 |
| R-14 | Constraint | 不新增第二套通用 review-package schema。优先把 per-task review package 映射到 `artifact-summary.v1`、`context-bundle.v1` 与现有 `spec-work-run-artifact/v2`；只有现有字段无法表达 task-level diff/touch-set 时再扩 schema。 | `artifact-summary.v1` 已是 summary-first handoff 合同。 |
| R-15 | P1 | 增加 benchmark/eval，比较改造前后 tokens、tool calls、turns、review finding 数量、scope creep 检出、返工次数、resume 步骤；质量指标不能只看 token。 | 报告指出成本下降与质量提升来自同一证据结构变化。 |
| R-16 | P1 | `spec-code-review` 的 headless/report-only 输出若暴露 structured findings，应保持 `finding_type`、`scope_boundary`、`authorized_scope_source` 可被 downstream 读取；若只在人类报告中显示，应在 contract 中说明未机器化。 | downstream `spec-work` / PR / tracker / compound 需要稳定消费字段。 |
| R-17 | P1 | 对 `scope_boundary=violation` 的处置建议必须区分：revert unauthorized change、split into new task、ask owner authorization、promote to plan update、accept as necessary with evidence。 | 避免所有 scope creep 都被简单要求 revert。 |
| R-18 | P2 | 当真实 review 累积出可复用 scope creep 模式时，`spec-code-review` 可建议 `spec-compound` 沉淀到 `docs/solutions/`，但不能自动写 durable knowledge。 | Knowledge promotion gate 需要 verified、reusable、invalidation condition。 |
| R-19 | Constraint | 不手改 `.claude/**`、`.codex/**`、`.agents/skills/**`；若实现改变 runtime skill/agent 行为，必须先改 source，再用 `spec-first init` 投射。 | 项目 source/runtime 边界。 |
| R-20 | P0 | `spec-code-review` 必须增加 Graph-Assisted Impact Review 触发器：当 diff 修改 shared symbol/helper、exported API、route handler、MCP/RPC tool、workflow entrypoint、contract/schema、source/runtime generation、permission/security boundary、data migration 或 cross-module dependency 时，尝试使用 `code-graph`/codegraph 获取调用链、被调用链、dependents、候选 affected tests 与 blast radius。 | 用户新增要求；现有 Stage 3 direct evidence candidates 已有 callers/consumers 检查意图。 |
| R-21 | P0 | Graph-Assisted Impact Review 的输入应从 changed files / diff hunks 提取 changed symbols、exports、route names、handler names、schema/tool ids 和 public entrypoints；不得把整仓 raw graph 作为 reviewer context。 | `docs/contracts/project-graph-consumption.md` 禁止 cat raw graph；codegraph 对符号/文件查询更适合 bounded reads。 |
| R-22 | P0 | codegraph 输出必须分层记录：`impact_chain_candidates`、`blast_radius_candidates`、`affected_test_candidates`、`caller_callee_paths`、`provider_readiness`、`freshness`、`limitations`。这些字段是 candidate evidence，不是 finding 本体。 | 图谱用于缩小下一步读取范围，不替 reviewer 做结论。 |
| R-23 | P0 | 任何基于链路/爆炸半径的 confirmed finding，必须至少有一条 direct confirmation：源码行、diff hunk、test/log、contract、route/schema/tool definition 或 owner evidence。codegraph 的关系边、blast radius、affected-test 候选不能单独支撑 P0/P1 finding。 | `project-graph-consumption.v1` 的 no skip-layer elevation。 |
| R-24 | P0 | 如果 codegraph native response 返回带文件/行号的 verbatim source snippet，reviewer 可把该片段视为 bounded direct source read；但“谁调用谁、影响谁、测试覆盖谁”的关系结论仍需确认或降级为 residual risk/test candidate。 | 合同允许 codegraph source snippet 作为 bounded direct read，但关系事实仍需确认。 |
| R-25 | P1 | Stage 6 Coverage 必须记录 Graph-Assisted Impact Review 的消费情况：是否运行、provider readiness/freshness、query shape、accepted candidates、rejected candidates、direct confirmations、fallback reason。缺失/unknown/stale/degraded 不阻断 review，但必须限制影响面声明。 | 与 resource lens 的 Coverage 记录模式一致。 |
| R-26 | P1 | 当 codegraph 缺失、未索引、readiness unknown/unverified、调用失败、stale 且不能接受、或当前文件类型不被索引时，`spec-code-review` 必须 fallback 到 bounded direct reads、`rg`、ast-grep、package/test facts，并在 Coverage 说明 `graph_assist: fallback`。 | 本轮 codegraph 对 Markdown skill/doc 不索引；fallback 是现实必需。 |
| R-27 | P1 | reviewer prompt 应明确“codegraph 是影响面探索器，不是权威裁决器”：它优先帮助找到 caller/callee/dependent/test candidates，reviewer 仍要读取关键源码、diff 或测试证据后才定级。 | 防止 provider_untrusted 输出被当 confirmed truth。 |
| R-28 | P1 | Headless/report-only 输出若暴露 graph-assisted impact，应使用现有 Coverage/summary-first 字段表达，不新增独立 graph evidence schema；如果未来需要机器消费，再通过 `context-bundle.v1` / `artifact-summary.v1` extensions 或现有 review envelope 扩展。 | 遵守不新造第二 evidence schema 的边界。 |
| R-29 | P1 | Graph-Assisted Impact Review 必须有查询预算：默认最多选择 5 个 changed symbols / public entrypoints；每个 symbol 每类 caller/callee/dependent/test candidates 最多保留 10 条候选；每类 accepted candidates 最多 5 条进入 Coverage。候选优先级为 exported/public/shared helper、route/tool/schema、workflow/contract entrypoint；低置信符号提取直接 fallback 到 bounded direct reads、`rg` 或 ast-grep。 | 避免把 graph assist 变成无限上下文扩张；保证 context economy 是可执行约束。 |
| R-30 | P1 | Benchmark/eval 必须定义 adoption gates：scope creep fixture 必须 100% 检出；graph false elevation fixture 中没有 direct confirmation 的 candidate 必须产生 0 个 P0/P1 finding；clean diff fixture 不新增 P1/P2 噪音；fallback fixture 必须写 `graph_assist: fallback`；真实样本只标记为 pilot，不作为 confirmed capability。 | R-15 只有指标还不够；需要明确通过/失败门槛，防止用 token 降低替代质量验收。 |

## Acceptance Examples

### AE-01: 发现越界文件修改

Covers: R-01, R-02, R-03, R-04, R-05, R-06, R-17

Given task pack 声明 `should_touch: skills/spec-code-review/**`，`must_not_touch: src/cli/plugin.js`
When diff 同时修改 `src/cli/plugin.js` 且 implementer report 未解释原因
Then `spec-code-review` 输出 `scope_boundary=violation`，并产生 `finding_type=unauthorized_file_change` finding，evidence 指向 `src/cli/plugin.js` 的 diff hunk、touch set 来源与缺失 justification。

### AE-02: 无 touch-set 时不能伪造 clean

Covers: R-02, R-05

Given 当前 review 只有 branch diff，没有 plan、task-pack 或 Expected Touch Set
When diff 涉及 8 个文件但都可从 intent 推断相关
Then `spec-code-review` 可以报告 `scope_boundary=unknown` 或 `concern`，说明依据为 `diff-only`，不得写 `clean`。

### AE-03: 必要越界应被解释而非机械阻断

Covers: R-04, R-17

Given task 的 `should_touch` 只列出 source file，但测试文件未列入
When diff 增加覆盖该 source change 的测试
Then reviewer 不应输出 violation；应记录 `scope_boundary=clean` 或 `concern`，并说明测试文件是验证当前任务的合理 companion change。

### AE-04: 执行者声明不能替代 diff

Covers: R-08, R-09

Given implementer report 写明“没有修改范围外文件”
When full diff 显示删除了无关 CLI 子命令
Then reviewer 以 full diff 为事实源，输出 `scope_creep` finding；implementer report 只能作为被证伪的 claim source。

### AE-05: task-level review 不能偷换成 branch-level review

Covers: R-07

Given `spec-work` 对 task T3 设置 `review_gate: required`，但未记录 `pre_task_base` 且当前 branch 已混入 T1/T2/T3 diff
When 要求运行 mini review
Then `spec-work` 必须 stop/handoff 或明确降级，不能声称完成 T3 task-level review。

### AE-06: Pre-flight 发现计划自相矛盾

Covers: R-11, R-19

Given plan 的 Global Constraints 要求“不得新增 runtime mirror 直接改动”，但某 unit 的 Files 列出 `.codex/**` 修改
When `spec-work` intake 运行 Pre-Flight Plan Review
Then 输出 plan contradiction，要求 owner/plan 修订，不能进入实现后再由 reviewer 才发现。

### AE-07: progress ledger 恢复不等于完成证明

Covers: R-12, R-13

Given progress ledger 记录 `Task 2: complete`
When 会话压缩后恢复
Then controller 可用 ledger 定位恢复点，但最终 completion 仍必须回到 git log、diff range、review result、verification evidence 确认。

### AE-08: unified reviewer 只适用于低风险 task

Covers: R-10

Given task 只改一个 docs-only file，touch set 明确且 diff 小
When `spec-work` 发起 per-task report-only review
Then 可用 unified task lens 一次检查 spec compliance、quality、diff boundary。
Given diff 涉及 auth、migration、source/runtime generation 或 public API
Then 仍必须走 full multi-persona 或相应 conditional reviewers。

### AE-09: downstream structured handoff 不新造合同

Covers: R-14, R-16, R-18, R-19

Given `spec-code-review mode:headless` 返回 scope-boundary findings
When downstream workflow 需要消费 review 结果
Then 输出必须能通过现有 `artifact-summary.v1` / `context-bundle.v1` 或明确的 headless structured envelope 找到 `finding_type`、`scope_boundary`、evidence 与 limitations；若 review 产生可复用 scope creep 教训，只建议 `spec-compound`，不自动写 `docs/solutions/`，也不修改 generated runtime mirrors。

### AE-10: benchmark 不只看 token

Covers: R-15, R-30

Given 实施 Diff Boundary Review 与 per-task review package 试点
When 跑 3-5 个代表性 fixture 或真实样本
Then benchmark 同时报告 tokens、tool calls、turns、scope creep 检出、返工次数、resume 步骤与 review noise；scope creep fixture 未 100% 检出、clean diff 产生新增 P1/P2 噪音、fallback fixture 未写 `graph_assist: fallback` 时均判定为未通过，不能只用 token 下降声明成功。

### AE-11: shared helper 改动需要链路与爆炸半径

Covers: R-20, R-21, R-22, R-23, R-24, R-27

Given diff 修改一个被多个 command handler 复用的 helper
When `spec-code-review` 进入 Stage 3 reviewer selection
Then Graph-Assisted Impact Review 应从 changed symbol 出发查询 caller/callee/dependent candidates，形成 `impact_chain_candidates` 与 `blast_radius_candidates`；reviewer 必须选取代表性 caller 或 test 回源确认后，才能提出“某 handler 会被破坏”这类 finding。

### AE-12: route/API 改动需要候选 affected tests

Covers: R-20, R-22, R-23, R-25

Given diff 修改 public API response shape
When codegraph 返回消费者组件和测试文件候选
Then Coverage 记录 query shape、accepted/rejected candidates、direct confirmations；如果 reviewer 发现某消费者实际读取被删除字段，finding evidence 必须引用消费者源码或测试，而不是只引用图谱边。

### AE-13: codegraph 不可用时降级而不阻断

Covers: R-25, R-26, R-28

Given setup facts 显示 `code-graph` readiness 为 `unknown`，或 codegraph 对 Markdown / skill prose 文件不索引
When review 涉及 workflow skill 文档改动
Then `spec-code-review` 使用 bounded direct reads、`rg`、ast-grep 和 docs contract 证据继续审查，并在 Coverage 写明 `graph_assist: fallback`、reason、limitations；不得声称已完成图谱爆炸半径分析。

### AE-14: 图谱候选不能单独形成高置信 finding

Covers: R-22, R-23, R-24, R-27

Given codegraph 显示某函数有 caller，但源码确认该 caller 在当前 platform gate 下不可达或测试 fixture 不覆盖该路径
When reviewer 合成 finding
Then 图谱候选应被记录为 rejected candidate 或 residual risk；不得仅凭 caller edge 输出 P0/P1 finding。

### AE-15: 不读取 raw graph，不新增图谱 schema

Covers: R-21, R-25, R-28

Given repo 中存在 graph artifact 或 provider cache
When `spec-code-review` 需要影响面线索
Then 只能通过 native codegraph/code-graph query、bounded direct reads 或现有 context bundle 消费候选；不得 `cat graph.json`，不得把 raw graph dump 传给 reviewer，也不得为本需求新建独立 graph evidence schema。

### AE-16: graph 查询预算限制上下文膨胀

Covers: R-21, R-25, R-29

Given diff 修改 12 个函数，其中只有 3 个是 exported/public/shared helper 或 route/tool/schema entrypoint
When Graph-Assisted Impact Review 提取 changed symbols
Then 默认最多选择 5 个高影响 changed symbols / public entrypoints；每个 symbol 每类 caller/callee/dependent/test candidates 最多保留 10 条候选，每类 accepted candidates 最多 5 条进入 Coverage；低置信符号提取不继续扩图，改用 bounded direct reads、`rg` 或 ast-grep。

### AE-17: benchmark 通过/失败门槛

Covers: R-15, R-23, R-26, R-30

Given benchmark suite 包含 scope creep、graph false elevation、clean diff 和 graph fallback 四类 fixture
When 执行 Phase A 验收
Then scope creep fixture 必须全部检出；graph false elevation fixture 不得产生无 direct confirmation 的 P0/P1 finding；clean diff 不得新增 P1/P2 噪音；fallback fixture 必须写 `graph_assist: fallback`。真实 review 样本只能标记为 pilot evidence，不得单独宣称 capability confirmed。

## Scope Boundaries

### In Scope

- `spec-code-review` Diff Boundary Review 轴。
- `spec-code-review` Graph-Assisted Impact Review 轴：调用链、被调用链、dependents、候选 affected tests、爆炸半径 Coverage。
- `finding_type` / `scope_boundary` 的 schema 或 synthesis 映射设计。
- `spec-work` required review gate 的 per-task review package 标准化。
- `spec-plan` / task-pack Expected Touch Set 需求。
- long-running `spec-work` 的 progress/recovery evidence 需求。
- Pre-Flight Plan Review 的 lightweight integration shape。
- benchmark/eval 指标定义。

### Out Of Scope

- 直接合并所有 `spec-code-review` persona。
- 用脚本自动裁决 scope creep 是否成立。
- 用 codegraph / project graph 自动裁决 root cause、affected tests、ownership、merge readiness 或 finding severity。
- 读取 raw graph artifact、把 graph dump 塞进 reviewer prompt、或在普通 review 中刷新/生成 project graph。
- 新增中心化 workflow state machine。
- 新增独立 graph evidence schema。
- 新增独立 public workflow 入口。
- 把 Superpowers 的 `.superpowers/sdd/**` 路径结构照搬到 spec-first。
- 把 progress ledger 当作 approval/completion/source scope authority。
- 本需求文档中直接实现 skill、agent、schema 或测试改动。
- 修改 generated runtime mirrors。

## Change Topology

Primary topology: `workflow-change + contract-change`

Why this topology matters:

- `spec-code-review` 热路径需要新增审查轴，这是 workflow behavior change。
- `finding_type`、`scope_boundary`、Expected Touch Set、review package fields 可能影响 downstream consumer，因此是 contract-change candidate。
- `impact_chain_candidates`、`blast_radius_candidates`、`affected_test_candidates` 若进入 headless/report-only 输出，会影响 downstream consumer；首轮应优先作为 Coverage/summary fields，避免新建 graph schema。
- progress ledger 若落入 `spec-work-run-artifact/v2`，需要 schema / producer / reader / tests 同步；若只作为 human-readable checkpoint，则不能被 downstream 当机器字段消费。
- Pre-Flight Plan Review 应先是 LLM semantic checklist，不应被脚本做成 plan 语义裁决器。

## Producer / Artifact / Consumer

| producer | artifact / field | authority | consumers | requirement |
| --- | --- | --- | --- | --- |
| `spec-plan` | Expected Touch Set in plan units or task-pack | plan/source scope authority when explicit and verified | `spec-work`, `spec-code-review` | R-06 |
| `spec-work` | task review package / context bundle | execution handoff evidence, not source truth | `spec-code-review` | R-07, R-08 |
| `spec-work` | progress ledger or task-state summary | recovery evidence, not approval state | resumed `spec-work`, final review, human | R-12, R-13 |
| `spec-code-review` | `finding_type` | review semantic classification | human, headless callers, tracker, compound | R-03, R-16 |
| `spec-code-review` | `scope_boundary` | review verdict facet | `spec-work`, PR, release/human | R-02 |
| `spec-code-review` | scope-boundary finding evidence | confirmed when backed by diff + authorization source | human/fixer/downstream | R-04, R-17 |
| codegraph / `code-graph` provider | impact chain / blast radius / affected-test candidates | provider_untrusted candidate evidence unless returned source snippets are used as bounded direct reads | `spec-code-review` orchestrator and selected reviewers | R-20 to R-29 |
| `spec-code-review` | graph-assisted Coverage summary | review limitation and orientation record, not confirmed truth | human, headless callers, downstream handoff | R-22, R-25, R-28, R-29 |
| `spec-compound` | future durable learning | only after verified reusable evidence | plan/work/review recall | R-18 |

## Source-Of-Truth Resolution

| concern | source of truth | generated/runtime or advisory inputs | conflict rule |
| --- | --- | --- | --- |
| code-review behavior | `skills/spec-code-review/SKILL.md`, `skills/spec-code-review/references/**`, `agents/**` | `.claude/**`, `.codex/**`, `.agents/skills/**` generated mirrors | source wins; runtime regenerated only via `spec-first init` |
| finding schema | `skills/spec-code-review/references/findings-schema.json` and any downstream compact mapping docs | reviewer prose, temp artifact JSON | schema changes require tests and consumer check |
| plan task boundaries | `docs/brainstorms/**` -> `docs/plans/**` -> task-pack source chain | implementer report, progress ledger | plan/task-pack owns scope; report/ledger only claim/evidence |
| actual changed files | git diff / git status / diff package | implementer report | git diff wins |
| impact chain / blast radius | direct source/test/log/contract confirmation after graph orientation | codegraph relationship output, project-graph output | graph candidate can guide reads; direct confirmation wins |
| provider readiness | current runtime provider call outcome for this review; setup-facts `provider_readiness[]` only enrich freshness/readiness judgment | artifact presence or provider self-claim alone | setup-facts missing/unknown/stale does not block Phase A; Coverage must record `readiness_unknown` plus `runtime_call_result`; runtime call failure triggers fallback |
| verification status | actual commands/logs/verification summaries | transcript claims | verified command/log wins |
| external Superpowers evidence | local external repo/report as advisory research | not spec-first source | use as inspiration, re-ground requirements in spec-first source |

## Planning Recheck

These questions determine whether the checkpoint can move into a bounded Phase A plan or must wait for wider owner decisions:

| id | owner decision needed | why it matters |
| --- | --- | --- |
| OQ-01 | 是否接受 Phase A review-only 作为首批落地：只改 `spec-code-review` wording/Coverage/eval，不同步改 `spec-plan` / task-pack / `spec-work`？ | 这是控制首批 blast radius 的关键；没有 Expected Touch Set 时 Phase A 只能输出 `scope_boundary=unknown/concern`，不能伪造 clean。 |
| OQ-02 | `finding_type` 是直接进入 reviewer JSON schema，还是先在 Stage 5 synthesis 派生并在报告/HEADLESS 输出暴露？ | 直接改 schema 影响所有 persona、validator、headless/autofix consumers；派生字段较轻但机器消费弱。 |
| OQ-03 | `scope_boundary` 是报告级字段、Coverage 子字段，还是 headless structured metadata？ | 决定 downstream 是否可稳定读取。 |
| OQ-04 | Phase B 中 Expected Touch Set 是否成为 recommended field，还是 required field for task-pack required review gates？ | required 会提升边界能力，但增加 plan/task-pack 负担；不应拖宽 Phase A。 |
| OQ-05 | Phase C 中 progress ledger 应扩展现有 `spec-work-run-artifact/v2`，还是新增 human-readable task-state summary？ | 前者更机器化但 schema 风险更高；后者轻量但消费弱。 |
| OQ-06 | Phase C 中 Pre-Flight Plan Review 放在 `spec-plan` finalize、`spec-work` intake，还是作为 `spec-doc-review` 模式？ | 不同落点决定谁拥有修订反馈与用户交互；不阻塞 Phase A。 |
| OQ-07 | 是否接受 R-30 benchmark gates 作为 Phase A exit criteria？ | 没有通过/失败门槛，eval 可能退化为 token/turns 观测而非质量证明。 |
| OQ-08 | Graph-Assisted Impact Review 是 Phase A 默认触发在 broad/impact-sensitive diff，还是先只作为 P1 Coverage/eval 试点？ | 决定是否需要立即改 reviewer prompt、Coverage contract 和 headless output。 |
| OQ-09 | `impact_chain_candidates` / `blast_radius_candidates` / `affected_test_candidates` 是否需要机器可读字段？ | 若下游要消费，需要明确放在现有 review envelope、Coverage，还是仅 human-readable。 |
| OQ-10 | 未来是否要把 setup-facts freshness 升级为 hard requirement？ | Phase A 默认规则已经闭合：runtime call 是即时可用性事实；setup-facts 缺失只记录 `readiness_unknown + runtime_call_result`，不阻断。 |

## Minimal Landing Order

1. Phase A field location decision: owner 先确认 `finding_type` 与 `scope_boundary` 首轮落在 synthesis/report/Coverage/headless envelope 的哪一层；不先改 reviewer JSON schema。
2. Phase A review-only wording: `spec-code-review` Stage 3/4/6 增加 Diff Boundary Review 轴、Graph-Assisted Impact Review 轴、Coverage `scope_boundary` / `graph_assist`、report-only behavior。
3. Phase A graph contract: 落 runtime-call readiness 默认规则、fallback 表达和 R-29 查询预算；禁止 raw graph dump，所有 graph impact finding 必须回源确认。
4. Phase A eval gates: 增加 explicit touch set + 越界 diff、shared helper / API diff、graph false elevation、clean diff、graph fallback fixtures，并按 R-30 判定 pass/fail。
5. Phase A consumer decision: 根据 eval/consumer 需要，再决定是否把 `finding_type` / `scope_boundary` / `impact_chain_candidates` 提升到 reviewer schema 或 headless structured envelope。
6. Phase B task boundaries: 在 `spec-plan` / task-pack 加 Expected Touch Set，并让 `spec-work` required review gate 传给 review context。
7. Phase B review package: prose handoff 反复不稳定时再加 helper；优先复用 `context-bundle.v1` 和 `artifact-summary.v1`。
8. Phase C recovery/pre-flight: 只在复杂/长任务触发下增加 progress ledger 或 run artifact extension；Pre-Flight Plan Review 先作为 lightweight semantic checklist。

## Risks And Anti-Patterns

| risk | mitigation |
| --- | --- |
| 把 Superpowers 的执行框架照搬成 spec-first 中心状态机 | 只吸收机制：diff evidence、file handoff、boundary lens、recovery evidence。 |
| 让脚本判定 scope creep | 脚本只列出 changed files、diff、touch set match facts；semantic violation 由 reviewer 判断。 |
| Expected Touch Set 过重，导致 plan 写作膨胀 | 仅在 task-pack / required review gate / high-risk work 强化；简单计划可用 `Files` 作为弱输入。 |
| reviewer 因缺授权边界仍输出 clean | 规定无 explicit boundary 时只能 `unknown` 或 `concern`。 |
| reviewer 把 codegraph edge 当作 confirmed impact | 规定图谱只产生 candidate；impact finding 必须引用源码/diff/test/log/contract 直接证据。 |
| graph dump 污染 reviewer context | 禁止读取 raw graph artifact；只用 native bounded query、source snippets 或 summary-first envelope。 |
| codegraph 不索引 Markdown / stale graph 造成假阴性 | Coverage 记录 `graph_assist: fallback`，继续用 direct reads、`rg`、ast-grep，不声称完成图谱分析。 |
| progress ledger 变成第二 source-of-truth | 明确它是 recovery evidence；completion 仍回到 diff/test/review。 |
| 统一 reviewer 降低高风险审查质量 | unified lens 只用于低风险 task-level mini review；full branch/high-risk 保留多 persona。 |
| 新 schema 破坏 downstream | 先 synthesis 派生 + report 字段试点，再升级 schema，并补 tests。 |

## Success Metrics

| metric | target signal | notes |
| --- | --- | --- |
| scope creep detection | scope creep fixture 100% 被标为 `scope_boundary=violation` 且 finding 可抵达用户 | 不能只进入 residual risk；低于 100% 即 Phase A eval 不通过。 |
| false clean rate | 无 touch-set 或 boundary 不足时输出 `unknown`，不输出 clean | 防虚假安全感。 |
| review noise | 低风险 clean diff 不因 Diff Boundary Review 或 graph assist 新增 P1/P2 噪音 | 用 confidence gate 保持质量；clean fixture 出现新增 P1/P2 即不通过。 |
| handoff cost | per-task review prompt 中粘贴正文减少，改传 paths/package | 可用 token/tool call/turns 观测。 |
| recovery | compaction/resume 后能从 ledger/run artifact 定位未完成 task，无重复 dispatch | 需要真实或 fixture run。 |
| downstream usability | headless/report-only consumers 能读取 `scope_boundary` 或明确知道该字段非机器化 | contract clarity。 |
| blast radius usefulness | shared helper / public API / route fixture 中，codegraph 候选能引导 reviewer 找到至少一个真实 caller、consumer 或 affected test，并形成 direct-confirmed finding 或明确 rejected candidate | 质量指标看“是否帮助找到该看的证据”，不看 graph 边数量。 |
| graph false elevation | graph false elevation fixture 中，没有 direct source/diff/test/log/contract confirmation 的 graph candidate 产生 0 个 P0/P1 finding | 防止把 provider_untrusted 升级成 confirmed truth。 |
| graph fallback honesty | codegraph 缺失、stale、readiness unknown 或文件类型不索引时，Coverage 必须写明 `graph_assist: fallback`、reason 与替代 evidence path | fallback fixture 缺该字段即不通过；不阻断 review，但限制 blast-radius 结论。 |
| context economy | reviewer context 不包含 raw graph dump；graph 查询以最多 5 个 changed symbols / public entrypoints 为入口，并遵守每 symbol / 每候选类预算 | 目标是减少上下文噪音，而不是把图谱完整塞给模型。 |
| real sample maturity | 真实 review 样本只作为 pilot evidence，不能替代 fixture pass/fail gate 宣称 confirmed capability | 需要累计稳定样本后再升级能力状态。 |

## Evidence And Assumptions

| type | item | status |
| --- | --- | --- |
| confirmed-source | `spec-code-review` 已有 diff scope、reviewer selection、confidence gate、validator、Coverage。 | confirmed |
| confirmed-source | `spec-code-review` 已有 capability-class boundary，规定 `code-graph` / `project-graph` 是 advisory review input。 | confirmed |
| confirmed-source | `spec-code-review` Stage 3 已有 route/API/shared symbol/helper/tool/multi-repo 等 direct evidence routing candidates。 | confirmed |
| confirmed-source | `spec-work` required review gate 已记录 pre-task diff anchor 和 declared/actual files。 | confirmed |
| confirmed-source | `spec-plan` unit 有 Files/Test/Verification，但无 Expected Touch Set。 | confirmed |
| confirmed-source | `docs/contracts/project-graph-consumption.md` 规定 graph/provider 输出只能作为 candidate，不得直接证明 finding、root cause、affected tests 或 merge readiness。 | confirmed |
| confirmed-source | `resource-governance-lens` 采用 advisory lens 模式：收集 deterministic facts、reason codes 与 limitations，进入 Coverage，但不阻断 review、不替代 reviewer judgment。 | confirmed |
| external-advisory | Superpowers report 的 token 与 quality 实测。 | advisory, local report |
| external-source | Superpowers SDD 源码实现 file handoff、review-package、progress ledger、pre-flight。 | confirmed external source, not spec-first authority |
| tool-result | 本轮 codegraph 对 Markdown skill/doc 不索引，需要直接读；对 JS source 可返回带行号的 verbatim source、caller/callee trail 与 blast radius；未发现现成 review-specific graph impact producer。 | advisory tool result, current workspace |
| accepted-assumption | Phase A 可在不修改 `spec-plan` / `spec-work` schema 的前提下先落 `spec-code-review` review-only；缺 Expected Touch Set 时输出 `scope_boundary=unknown/concern`，不输出 clean。 | default slice assumption, revisit in Phase B |
| accepted-assumption | runtime provider call outcome 是本次 review 的即时可用性事实；setup-facts 只增强 freshness/readiness 判断。setup-facts missing/unknown/stale 不阻断，但 Coverage 必须记录 `readiness_unknown + runtime_call_result`。 | default for Phase A, revisit if setup-facts becomes hard gate |
| assumption | spec-first 用户会从 scope-boundary finding 中获得显著 review 增益。 | needs eval / real run |
| assumption | Graph-Assisted Impact Review 能提升 shared helper / API / workflow diff 的 blast-radius finding 命中率。 | needs fixture + real review eval |
| assumption | progress ledger 在 spec-first 长任务中能减少重复 dispatch。 | plausible, needs real run |

## Readiness Self-Check

write_mode: checkpoint-prd
can_enter_spec_plan: no
readiness_outcome: ask-owner
preflight_sweep_closure: blocked
- `decision_card_highest_risk_gap`: OQ-01/OQ-02/OQ-03/OQ-08/OQ-09，Phase A 是否接受、schema/报告字段落点、graph assist 默认等级与机器可读字段位置未由 owner 决定；OQ-10 已有 Phase A 默认规则，不再是最高风险 gap。
- `decision_card_next_action`: owner 先确认是否接受 Phase A：只做 `spec-code-review` review-only + graph Coverage/eval + R-29/R-30 gates；Phase B/C 另行决策。
- `decision_card_why_no_invention`: 本文把 external evidence 与 repo source 映射清楚，并把实现 HOW、field shape、producer choice 放入 Planning Recheck；不把未确认字段当作已决 contract。

## Outstanding Questions

| id | question | blocks planning? | closure_disposition |
| --- | --- | --- | --- |
| OQ-01 | 是否接受 Phase A review-only 作为首批落地？ | yes | owner-needed |
| OQ-02 | `finding_type` 是否进入 reviewer schema，还是 Stage 5/6 派生？ | yes | owner-needed |
| OQ-03 | `scope_boundary` 的机器消费位置在哪里？ | yes | owner-needed |
| OQ-04 | Phase B 中 Expected Touch Set 是 required 还是 recommended？ | no, Phase B follow-up | owner-needed |
| OQ-05 | Phase C 中 progress ledger 是否做，若做落在哪个 artifact？ | no, unless owner wants long-task recovery in same release | owner-needed |
| OQ-06 | Phase C 中 Pre-Flight Plan Review 放在哪个 workflow 阶段？ | no, can be follow-up | owner-needed |
| OQ-07 | 是否接受 R-30 benchmark gates 作为 Phase A exit criteria？ | yes | owner-needed |
| OQ-08 | Graph-Assisted Impact Review 是 Phase A 默认触发在 broad/impact-sensitive diff，还是先 P1 作为 Coverage/eval 试点？ | yes | owner-needed |
| OQ-09 | `impact_chain_candidates` / `blast_radius_candidates` / `affected_test_candidates` 是否需要机器可读字段？ | yes, if headless/report-only consumers need them | owner-needed |
| OQ-10 | 未来是否要把 setup-facts freshness 升级为 hard requirement？ | no, Phase A default exists | source-backed-non-WHAT-assumption: Source-Of-Truth Resolution default |
