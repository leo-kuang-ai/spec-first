---
doc_role: review-report
authority: review-evidence
status: active-artifact
lifecycle: active-artifact
review_date: 2026-07-01
review_method: spec-skill-audit deterministic artifacts + Graphify advisory query + source direct reads + focused contract/test inspection
relates_to:
  - docs/10-prompt/结构化项目角色契约.md
  - docs/contracts/ai-coding-harness.md
  - docs/workflow-skill-agent-map.md
  - skills/using-spec-first/SKILL.md
  - skills/spec-brainstorm/SKILL.md
  - skills/spec-prd/SKILL.md
  - skills/spec-plan/SKILL.md
  - skills/spec-write-tasks/SKILL.md
  - skills/spec-work/SKILL.md
  - skills/spec-code-review/SKILL.md
  - skills/spec-doc-review/SKILL.md
  - skills/spec-compound/SKILL.md
  - skills/spec-compound-refresh/SKILL.md
note: 本报告是审查产物，不修改 workflow source；结论区分 deterministic facts、advisory graph navigation 和 LLM semantic judgment。
---

# 核心链路 Skill 流程准确性审查报告

## 结论

当前核心链路的实际执行骨架整体成立：

```text
Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge
```

按 source skill 本体看，`spec-brainstorm` / `spec-prd` / `spec-plan` / `spec-write-tasks` / `spec-work` / `spec-code-review` / `spec-doc-review` / `spec-compound` / `spec-compound-refresh` 的职责大体符合角色契约：WHAT、HOW、派生任务包、执行、审查、知识沉淀之间有清晰边界，且大多数关键 handoff 都有 failure mode 或验证纪律。

原审查发现主链路公开表达存在一个 P1 级治理漂移：`spec-write-tasks` 到底是 standalone skill 还是 public workflow command，source 之间互相冲突。这个冲突会直接影响用户如何从 Plan 进入 Tasks，并影响 runtime catalog、Claude command 投射、README 和 entry governor 的一致性。

2026-07-01 owner 决策：反向提升 `spec-write-tasks` 为 public workflow。当前 source surface 已按该决策修复：`using-spec-first`、README/用户手册、`spec-work` handoff、task-pack handoff contract、workflow map、metadata 和测试已收敛到 `/spec:write-tasks` / `$spec-write-tasks`。剩余不是 source 口径问题，而是 generated runtime mirrors 尚未执行非 dry-run `spec-first init` 刷新。

当前 F2-F5 的后续优化已在 source 层修复：`docs/workflow-skill-agent-map.md` 已把 `Context` 从顺序链路节点调整为横切 Harness layer，Knowledge 行已覆盖 `spec-compound-refresh`，Review 描述已补 dispatch 授权与 fallback 边界；核心链路 9 个 skill 的 frontmatter description 也已补齐最容易误触发的 positive/negative trigger boundary。剩余不是 source 口径问题，而是 generated runtime mirrors 尚未执行非 dry-run `spec-first init` 刷新。

## 审查范围

本轮聚焦用户列出的主链路 skill：

- Spec：`spec-brainstorm`、`spec-prd`
- Plan：`spec-plan`
- Tasks：`spec-write-tasks`
- Code：`spec-work`
- Review：`spec-code-review`、`spec-doc-review`
- Knowledge：`spec-compound`、`spec-compound-refresh`

辅助读取：

- 角色契约：`docs/10-prompt/结构化项目角色契约.md`
- 合同地图：`docs/contracts/ai-coding-harness.md`
- 路由源：`skills/using-spec-first/SKILL.md`
- 用户文档与映射：`README.md`、`README.zh-CN.md`、`docs/workflow-skill-agent-map.md`
- 治理与测试：`src/cli/contracts/dual-host-governance/skills-governance.json`、`tests/unit/runtime-capability-catalog.test.js`、`tests/unit/spec-work-contracts.test.js`、`tests/unit/public-workflow-contract-summary.test.js`

## 证据边界

确定性事实：

- 已运行 `node .agents/skills/spec-skill-audit/scripts/write-audit-artifacts.js --repo . --run-id core-link-skill-flow-audit-2026-07-01`
- 产物目录：`.spec-first/audits/skill-audit/core-link-skill-flow-audit-2026-07-01/`
- 报告显示 37 个 skill 被扫描，核心链路 skill 的 eval readiness 均为 ready；deterministic score 只是 review signal，不是 gate。
- 运行 `--runtime` 时 runtime drift 子检查因 trusted-checkout guard 拒绝，不能声明 runtime drift 检查通过。

Advisory 导航：

- 已运行 Graphify 查询定位主链路相关文档节点；该输出只作为导航候选，重要结论均回源到 source/test/doc。

LLM 语义判断：

- P0/P1/P2 定级基于 source 证据、反证和角色契约，不直接采用 skill-audit JSON 的关键词扫描结论。

## 核心流程评估

| 阶段 | 当前 source 结论 | 判断 |
| --- | --- | --- |
| Spec / Brainstorm | `spec-brainstorm` 明确只做 WHAT discovery，错误入口会 route out；不接 PRD、plan、work、debug。 | 正确 |
| Spec / PRD | `spec-prd` 面向 brownfield PRD-grade requirements，强调 current-state evidence、owner question、readiness/finalize；禁止写 implementation plan。 | 正确，复杂但边界强 |
| Plan | `spec-plan` 明确 HOW plan，planning-only until handoff，post-plan 可进入 work 或 task compilation。 | 正确 |
| Tasks | `spec-write-tasks` 本体作为 Plan 和 Work 之间的 optional derived layer，task pack 不改变 scope；owner 已决定将入口收敛为 `/spec:write-tasks` / `$spec-write-tasks` public workflow。 | 本体正确，F1 已按 public workflow 方向修复 source surface |
| Code | `spec-work` 对 plan/task-pack 输入、hash/spec_id、scope expansion、repo scope、verification 和 review gate 有强边界。 | 正确 |
| Review | `spec-code-review` / `spec-doc-review` 分别审代码 diff 和 requirements/plan/task-pack 文档，并定义 dispatch fallback。 | 正确，公开文档需避免过度承诺并行 |
| Knowledge | `spec-compound` 只沉淀刚解决且 source-confirmed 的问题；`spec-compound-refresh` 维护旧 learning/pattern doc。 | 正确 |

## Findings

### F1 P1：`spec-write-tasks` entry surface 多真相源（source fixed）

**结论：fixed at source，runtime refresh pending。** 这是原始审查中最影响用户心智的流程准确性问题。原报告的推荐方案是保持 standalone；owner 在 2026-07-01 明确选择反向提升为 public workflow。本轮已按 public workflow 目标真相源修复 source surface，并用聚焦 Jest、entrypoint lint、runtime catalog 生成、eval fixture parse 和 dry-run init 验证。尚未执行非 dry-run `spec-first init`，所以 generated runtime mirrors 仍可能是旧投射。

**修复前信号**

同一个 skill 同时被描述为 standalone skill 和 public workflow command。

**修复前证据快照**

以下证据记录的是本报告初始审查时的 source/runtime 漂移；owner 选择 promote-to-public-workflow 后，当前 source 已按下方 remediation validation 收敛。

- `skills/using-spec-first/SKILL.md:118` 明确说不要为 standalone skill invent `/spec:*` 或 `$spec-*`，并举例 `spec-write-tasks`。
- `skills/using-spec-first/SKILL.md:165` Route Map 把 task compilation 映射为 `spec-write-tasks` standalone skill。
- `skills/using-spec-first/SKILL.md:172` 明确说 `spec-write-tasks` 不是 `/spec:*` 或 `$spec-*` workflow entrypoint。
- `skills/using-spec-first/SKILL.md:196` Host Surface 再次说它不是 public workflow entrypoint。
- `README.md:161` 和 `README.zh-CN.md:161` 均写 `use installed standalone write-tasks skill`。
- `skills/spec-work/SKILL.md:237-240` 说执行大 plan 时可提供一次 standalone `spec-write-tasks` diversion；`tests/unit/spec-work-contracts.test.js:614-626` 明确断言不得出现 `/spec:write-tasks` 或 `$spec-write-tasks`。
- 反向证据：`src/cli/contracts/dual-host-governance/skills-governance.json:347-354` 把 `spec-write-tasks` 登记为 `entry_surface: workflow_command`，`command_name: write-tasks`。
- 反向证据：`tests/unit/runtime-capability-catalog.test.js:47` 断言 runtime catalog 暴露 `| write-tasks | spec-write-tasks | /spec:write-tasks | $spec-write-tasks | ... |`。
- 反向证据：`docs/workflow-skill-agent-map.md:16` 和 `docs/workflow-skill-agent-map.md:31` 写 `/spec:write-tasks`，但 `docs/workflow-skill-agent-map.md:108` 又说它是 standalone skill。
- 反向证据：当前 generated runtime 存在 `.claude/commands/spec/write-tasks.md`，说明 runtime 投射受治理记录影响；这只能作为 runtime evidence，不是 source truth。

**为什么重要**

Tasks 是 `Plan -> Code` 之间的派生层。修复前，如果用户看 README 得到 standalone 口径，看 runtime catalog 或 generated Claude command 得到 `/spec:write-tasks` 口径，entry governor、文档、测试、runtime 投射会把同一行为导向不同路径。高风险 task pack 还带有 bounded doc-review continuation，这个入口不清会放大 dispatch 授权误判。

**反证检查**

`spec-write-tasks` 本体的职责边界很清楚：`skills/spec-write-tasks/SKILL.md:8` 定义 optional derived layer，`skills/spec-write-tasks/SKILL.md:56-63` 规定 plan 是 single source of truth，task pack 不改 scope，脚本只验证确定性字段。问题不在 skill 本体，而在 public entry surface / runtime projection / docs / tests 的 source-of-truth 冲突。

**修复记录**

已按 owner 决策将 `spec-write-tasks` 提升为 public workflow，而不是降级治理表：

1. 已保留 `skills-governance.json` 中 `spec-write-tasks` 的 `entry_surface: workflow_command`、`command_name: write-tasks`、Claude `/spec:write-tasks` 和 Codex `$spec-write-tasks` runtime catalog 口径。
2. 已更新 `using-spec-first` Route Map、Host Surface、dispatch reference 和 routing eval，明确 task compilation 入口是 `/spec:write-tasks` / `$spec-write-tasks`。
3. 已更新 README / README.zh-CN / 用户手册 / `docs/workflow-skill-agent-map.md` / `docs/workflow-enhancement-proposals.md` / 大需求拆分文档，让用户入口表与 runtime catalog 一致。
4. 已更新 `spec-work` 的 oversized plan diversion 文案和 tests，让它推荐当前宿主 write-tasks public workflow，而不是 standalone skill。
5. 已更新 `spec-write-tasks` 本体、OpenAI metadata、high-risk doc-review handoff contract 和 eval wording，保留“可选派生层、不执行代码、不替代 source plan”的职责边界。
6. 已运行 runtime catalog、entrypoint lint、using-spec-first、spec-work、spec-write-tasks、workflow invocation、public workflow summary、eval fixture 和 changelog 聚焦验证。
7. 剩余 runtime action：执行非 dry-run `spec-first init`，让 `.claude/`、`.codex/` 和 `.agents/skills/` generated mirrors 从 source 重新投射。

### F2 P2：`workflow-skill-agent-map` 主链路把 `Context` 写成顺序节点（source fixed）

**结论：fixed at source。**

**证据**

- 角色契约 `docs/10-prompt/结构化项目角色契约.md:41-52` 定义 canonical chain 为 `Codebase -> Spec -> Plan -> Tasks -> Code -> Review -> Knowledge`，并把 Context 放在 Harness 层。
- `docs/contracts/ai-coding-harness.md:7-24` 同样把核心链路定为 7 节点，Context 是 Harness layer。
- `docs/workflow-skill-agent-map.md:6-13` 写成 `Codebase → Context → Spec → Plan → Tasks → Code → Review → Knowledge`，并给 Context 单独一行。

**为什么重要**

Context 是横切能力，不是用户顺序 workflow 节点。把它写进顺序链路会诱导用户以为需要先进入某个 Context workflow，或把 direct evidence / `rg` / tests/logs 当作流程状态。

**修复记录**

已把 `docs/workflow-skill-agent-map.md` 的第一章改为 canonical 7 节点链路；Context 保留为“横切 evidence / harness layer”说明，不再放进顺序表。

### F3 P2：Knowledge 行漏掉 `spec-compound-refresh`（source fixed）

**结论：fixed at source。**

**证据**

- `docs/workflow-skill-agent-map.md:19` Knowledge 行只列 `/spec:compound`、`/spec:sessions`。
- 同文件 `docs/workflow-skill-agent-map.md:38` 又列 `/spec:compound-refresh`。
- README 主链路 `README.md:165-166` 和 `README.zh-CN.md:165-166` 均把 `compound` 和 `compound-refresh` 分成 capture / refresh 两个知识阶段。
- `skills/using-spec-first/SKILL.md:168-169` Route Map 同时提供 compound 和 compound-refresh。

**为什么重要**

Knowledge 不只是“写入新 learning”，还包括让旧 learning 与当前代码保持一致。漏掉 refresh 会让知识闭环看起来只有增长没有维护，违背 Knowledge Harness 的 freshness 义务。

**修复记录**

已把 Knowledge 行补为 `/spec:compound`、`/spec:compound-refresh` 和 `/spec:sessions`：前者负责 capture，中者负责 refresh/merge/retire 旧 learning，sessions 作为历史会话 recall support，不等同于 durable knowledge promotion。

### F4 P2：用户文档对 review 的“多 persona 并行”表达过强（source fixed）

**结论：fixed at source；source skill 本体无问题。**

**证据**

- `docs/workflow-skill-agent-map.md:18`、`:33-34` 把 Review 描述为“多 persona 并行审查”。
- `skills/spec-code-review/SKILL.md:9` 明确只有 host 暴露 dispatch primitive 时并行，否则 fallback。
- `skills/spec-code-review/SKILL.md:303-305` 明确 dispatch 不可用/禁用/不安全时走 single-agent report-only fallback。
- `skills/spec-doc-review/SKILL.md:3`、`:9` 明确 dispatch 还需要当前 host 显式授权；`:245-251` 定义 single-agent report-only fallback，且 Codex 下缺少显式 subagent 授权时记录 `dispatch_authorization_missing`。

**为什么重要**

在 Codex 侧，直接 `$spec-doc-review` 不等于授权 `spawn_agent`。如果用户文档过度承诺“多 persona 并行”，会导致实际 fallback 被误认为质量下降或 workflow 失败。

**修复记录**

已把 `docs/workflow-skill-agent-map.md` 的 Review 描述改为“结构化审查；dispatch 可用且授权时使用多 persona，否则走 report-only / inline fallback”。同步收敛 `docs/workflow-enhancement-proposals.md` 的 Review 当前能力描述，避免把 fallback 误读成质量下降或 workflow 失败。

### F5 P2：部分核心 skill frontmatter trigger 过窄或过泛，依赖 body 才能完整表达边界（source fixed）

**结论：fixed at source。**

**证据**

skill-audit 确定性报告显示核心链路 skill 的 eval readiness 均为 ready，但 trigger discovery readiness 多为 partial，常见缺项是 frontmatter negative boundary 或显式 positive/negative trigger examples。原始核心样例：

- `spec-plan`、`spec-work`、`spec-code-review`、`spec-doc-review`、`spec-compound` 的 frontmatter description 不足以单独呈现所有 near-neighbor 边界。
- `spec-work` 的 description 是 “Execute work efficiently while maintaining quality and finishing features”，比 body contract 宽；body 在 `skills/spec-work/SKILL.md:13-39` 才给出真正的 when-to-use / when-not-to-use / failure modes。
- Owner 随后要求把剩余核心链路 skill 也做同类优化；`spec-brainstorm`、`spec-prd`、`spec-write-tasks`、`spec-compound-refresh` 本体边界强，但仍可通过 frontmatter trigger contract 降低 discovery variance。

**反证检查**

每个核心 skill 的前 120 行都有 Workflow Contract Summary，且 body 边界强。这个问题不是当前运行错误，而是 discovery 层 variance risk。

**修复记录**

本轮没有重写 workflow 执行逻辑，主要按 `spec-write-skill` 的 “description as trigger contract” 规则做轻量 source polish，并同步收敛 `spec-work` 第一屏正文概述，避免旧的泛化执行口径继续稀释触发边界：

1. `skills/spec-plan/SKILL.md`：把入口明确为 structured HOW plan，并补 `spec-write-tasks` task-pack compilation 与 generated runtime mirror fix 的负向边界。
2. `skills/spec-work/SKILL.md`：把入口收敛到 settled plan、validated task pack、spec path 或 concrete implementation request；排除 WHAT/HOW 未定、target repo 不清、task pack stale/unverifiable、scope expansion 和手改 generated runtime mirrors；第一屏正文概述同步强调 validated scope 和 route-back-to-planning。
3. `skills/spec-code-review/SKILL.md`：明确只审 code diffs、PRs 或 branch implementation changes；排除文档审查、实现执行、未定计划和 commit/push/PR creation。
4. `skills/spec-doc-review/SKILL.md`：明确审 requirements、plans、task packs 或 Markdown planning artifacts；排除 code diff/PR/branch implementation review、implementation execution 和 PR merge-readiness code review，并保留 dispatch 授权/fallback 口径。
5. `skills/spec-compound/SKILL.md`：限定为 just-solved、source-confirmed、reusable team knowledge；排除 active debugging、unresolved hypotheses、one-off summaries/transcript archiving、mandatory completion gates，并把 stale knowledge 路由到 `spec-compound-refresh`。
6. `skills/spec-brainstorm/SKILL.md`：把入口明确为 selected feature/problem 的 WHAT discovery before PRD/planning；排除 open-ended ideation、brownfield PRD、HOW planning/task compilation、implementation/debug/review/setup、runtime mirror fix、factual answer 和 cleanup。
7. `skills/spec-prd/SKILL.md`：把入口明确为 brownfield PRD-grade requirements planning-readiness；排除 0-1 product exploration、unresolved product shape、HOW planning/task compilation、implementation/debug/review、lightweight direct fixes、runtime mirror edits 和 design/source consistency audit，并补 near-neighbor route hints。
8. `skills/spec-write-tasks/SKILL.md`：把入口明确为 `/spec:write-tasks` / `$spec-write-tasks` public workflow、settled local plan 和 existing local task pack；排除 plan authoring、implementation、unresolved scope、small low-risk plans、progress/approval state、remote/generic task lists 和 runtime mirror edits。
9. `skills/spec-compound-refresh/SKILL.md`：把入口明确为现有 `docs/solutions/` learning/pattern docs 的 stale/drift/overlap/inaccuracy refresh；排除 new learning capture、active debugging、general refactor/migration/code-review、非 `docs/solutions/` doc sweep、transcript archive、mandatory completion gate 和 runtime mirror edits。

对应新增或调整 focused contract tests，锁住上述 frontmatter trigger contract，避免后续退回宽泛摘要式 description。`docs/catalog/runtime-capabilities.md` 已通过 `npm run docs:runtime-catalog` 从 source 重新生成，保持 `/spec:write-tasks` catalog 描述一致。

## 非 Findings：当前流程做得好的地方

### Spec：Brainstorm 和 PRD 的职责区分正确

- `spec-brainstorm` 明确是选定问题/feature 的 WHAT discovery，规划会发明 WHAT 时才进入；`skills/spec-brainstorm/SKILL.md:15-19` 和 `:39-53` 给出 wrong-entry route-out。
- `spec-prd` 明确是 brownfield PRD-grade requirements，要求 current-state evidence、owner question 和 readiness/finalize；`skills/spec-prd/SKILL.md:79-87` 定义 WHAT not HOW、source evidence、relentless clarification。
- PRD Phase 4 明确禁止未跑 readiness/finalize 就 handoff 到 plan；`skills/spec-prd/SKILL.md:252-264` 是强保护。

### Plan：计划阶段有清楚的 planning-only 边界

- `skills/spec-plan/SKILL.md:21-39` 明确 planning only until handoff，不实现代码、不运行实现证明、不生成 task-pack state。
- `skills/spec-plan/references/plan-handoff.md:41-52` 把 Start work 和 Compile task pack 明确放在 post-plan 用户选择之后。

### Tasks：task pack 的派生性和验证纪律强

- `skills/spec-write-tasks/SKILL.md:56-63` 约束 task pack 不改变 scope / acceptance / non-goals / repo ownership。
- `skills/spec-write-tasks/SKILL.md:100-114` 和 `references/execution-handoff-contract.md:60-68` 明确不能自报 deterministic handoff，必须有 CLI JSON evidence。
- `references/execution-handoff-contract.md:70-85` 对 high-risk pack 的 doc-review continuation 做了 bounded edge，不把它扩成 general chaining。

### Code：执行阶段能守住 plan/task scope

- `skills/spec-work/SKILL.md:220-235` 处理 stale/unverifiable task pack、semantic posture、dispatch authorization、review_gate 和 stop_if。
- `skills/spec-work/SKILL.md:237-253` 规定大 plan 可以一次性 diversion 到 task compilation，但发现 scope expansion 要回 plan 或重新生成 task pack。

### Review：代码审查和文档审查边界清楚

- `spec-code-review` 审 diff、PR、branch 和 implementation quality；`skills/spec-code-review/SKILL.md:13-39` 明确不审 plan-only 文档，不做 commit/push/PR。
- `spec-doc-review` 审 requirements/plan/task-pack；`skills/spec-doc-review/SKILL.md:13-43` 明确不做 code diff review，不把 task pack 当 independent source plan。
- 两者都定义 dispatch fallback，不因为缺并行能力而跳过审查。

### Knowledge：知识沉淀和刷新不是强制完成门

- `spec-compound` 只在真实问题已解决且 reusable lesson 值得保存时使用；`skills/spec-compound/SKILL.md:18-24` 明确不是 mandatory completion gate。
- `spec-compound` 要 source-confirmed learning 才能进入 durable docs；`skills/spec-compound/SKILL.md:88-98` 明确 raw tool output / unresolved hypotheses 不进入 `docs/solutions/`。
- `spec-compound-refresh` 维护 stale / overlapping / inaccurate learning；`skills/spec-compound-refresh/SKILL.md:12-38` 和 `:61-65` 约束 replacement/backfill 也需要 source-confirmed evidence。

## 建议落地顺序

1. **P1 已按 owner 决策修复 source surface：** `spec-write-tasks` 入口已收敛为 `/spec:write-tasks` / `$spec-write-tasks` public workflow；后续需要用非 dry-run `spec-first init` 刷新 generated runtime mirrors。
2. **全景文档已修复：** canonical 7 节点主链路、Context 横切层、Knowledge capture/refresh/recall 和 Review fallback 表达已对齐。
3. **保持 runtime catalog 与 tests 锁步：** 让 `runtime-capability-catalog`、`workflow-skill-agent-map`、`spec-work`、`using-spec-first` 对同一 public surface 有一致断言。
4. **trigger polish 已 source-fixed：** 5 个核心 skill 的 frontmatter description 已补近邻负向边界，并以 focused contract tests 锁定。

## 验证记录

### 原始审查验证

已执行：

- `node .agents/skills/spec-skill-audit/scripts/write-audit-artifacts.js --repo . --run-id core-link-skill-flow-audit-2026-07-01`
- `graphify query "核心链路 skill spec-brainstorm spec-prd spec-plan spec-write-tasks spec-work spec-code-review spec-doc-review spec-compound spec-compound-refresh 的职责边界和 handoff 关系" --budget 2500`
- source direct reads：本报告 frontmatter `relates_to` 中列出的核心 skill、合同与文档。
- focused test/source inspection：`runtime-capability-catalog.test.js`、`spec-work-contracts.test.js`、`public-workflow-contract-summary.test.js`。

原始审查未执行：

- 未修改核心 workflow source，故未跑完整 `npm test`。
- `--runtime` audit 未通过 trusted-checkout guard，runtime drift 结论为 degraded / not confirmed。
- 未使用 subagent/persona 并行审查；本报告为当前 orchestrator 的 source-grounded review。

### 2026-07-01 remediation validation

已执行：

- `npx jest tests/unit/using-spec-first-contracts.test.js tests/unit/lint-skill-entrypoints.test.js tests/unit/spec-work-contracts.test.js tests/unit/spec-write-tasks-contracts.test.js tests/unit/workflow-invocation-boundary.test.js tests/unit/public-workflow-contract-summary.test.js tests/unit/runtime-capability-catalog.test.js tests/unit/eval-fixture-contracts.test.js tests/unit/changelog-format.test.js --runInBand`
- `npm run lint:skill-entrypoints`
- JSON parse：`skills/using-spec-first/evals/routing-discipline-cases.json`、`skills/spec-write-tasks/evals/output-quality-cases.json`
- `npm run docs:runtime-catalog`（generated catalog 与 source governance 一致；无额外 diff）
- `node bin/spec-first.js init --claude --codex -y --dry-run --no-sync-user-language`
- `git diff --check`

### 2026-07-01 workflow map polish validation

已执行：

- `npx jest tests/unit/workflow-skill-agent-map-contracts.test.js tests/unit/changelog-format.test.js --runInBand`
- `git diff --check -- CHANGELOG.md docs/workflow-skill-agent-map.md docs/workflow-enhancement-proposals.md docs/项目审查/2026-07-01-core-workflow-skill-flow-audit.md`
- `rg -n 'Codebase → Context|多 persona 并行|Knowledge 行漏掉|F2-F4.*仍|尚未作为本轮改动' docs/workflow-skill-agent-map.md docs/workflow-enhancement-proposals.md docs/项目审查/2026-07-01-core-workflow-skill-flow-audit.md`

验证说明：

- `docs/workflow-skill-agent-map.md` 和 `docs/workflow-enhancement-proposals.md` 中已无旧的 `Codebase → Context` 顺序链路或无 fallback 的“多 persona 并行”当前口径。
- `rg` 仍命中本报告中的修复前证据快照、source-fixed 标题和历史问题说明，属于保留审查证据，不代表当前用户面文档仍漂移。

### 2026-07-01 skill trigger polish validation

已执行：

- `npx jest tests/unit/spec-plan-contracts.test.js tests/unit/spec-work-contracts.test.js tests/unit/spec-code-review-contracts.test.js tests/unit/spec-doc-review-contracts.test.js tests/unit/spec-compound-contracts.test.js --runInBand`
- `npx jest tests/unit/spec-brainstorm-contracts.test.js tests/unit/spec-brainstorm-routing-contracts.test.js tests/unit/spec-prd-contracts.test.js tests/unit/spec-write-tasks-contracts.test.js tests/unit/spec-compound-contracts.test.js --runInBand`
- `npm run lint:skill-entrypoints`
- `npm run docs:runtime-catalog`
- `npx jest tests/unit/spec-plan-contracts.test.js tests/unit/spec-work-contracts.test.js tests/unit/spec-code-review-contracts.test.js tests/unit/spec-doc-review-contracts.test.js tests/unit/spec-compound-contracts.test.js tests/unit/changelog-format.test.js --runInBand`
- `npx jest tests/unit/spec-brainstorm-contracts.test.js tests/unit/spec-brainstorm-routing-contracts.test.js tests/unit/spec-prd-contracts.test.js tests/unit/spec-write-tasks-contracts.test.js tests/unit/spec-plan-contracts.test.js tests/unit/spec-work-contracts.test.js tests/unit/spec-code-review-contracts.test.js tests/unit/spec-doc-review-contracts.test.js tests/unit/spec-compound-contracts.test.js tests/unit/changelog-format.test.js --runInBand`
- `git diff --check -- CHANGELOG.md docs/catalog/runtime-capabilities.md skills/spec-brainstorm/SKILL.md skills/spec-prd/SKILL.md skills/spec-write-tasks/SKILL.md skills/spec-plan/SKILL.md skills/spec-work/SKILL.md skills/spec-code-review/SKILL.md skills/spec-doc-review/SKILL.md skills/spec-compound/SKILL.md skills/spec-compound-refresh/SKILL.md tests/unit/spec-brainstorm-contracts.test.js tests/unit/spec-brainstorm-routing-contracts.test.js tests/unit/spec-prd-contracts.test.js tests/unit/spec-write-tasks-contracts.test.js tests/unit/spec-plan-contracts.test.js tests/unit/spec-work-contracts.test.js tests/unit/spec-code-review-contracts.test.js tests/unit/spec-doc-review-contracts.test.js tests/unit/spec-compound-contracts.test.js docs/项目审查/2026-07-01-core-workflow-skill-flow-audit.md`

Remediation limits：

- 未运行完整 `npm test`；本轮按阶段运行了 public surface、workflow invocation、runtime catalog、eval fixture、workflow map、skill trigger contract 与 changelog 相关聚焦验证。
- fresh-source eval 状态为 `not_run`：当前 Codex 请求未明示 subagents/personas/delegated review 授权，且本轮以 source reads + 静态 contract/Jest 验证收敛 public surface。
- 未运行非 dry-run `spec-first init`，未手改 `.claude/`、`.codex/` 或 `.agents/skills/` generated runtime mirrors。dry-run 显示 runtime 需要按 source 重新投射；实际刷新应由后续 `spec-first init` 执行。

## 最终判断

从“高质量辅助用户完成开发工程”的角度看，核心 skill 本体已经具备足够清晰的工程闭环：

```text
Spec clarifies WHAT
Plan defines HOW
Tasks optionally compress a settled plan
Work executes with evidence
Review challenges code/docs
Knowledge captures and refreshes verified learnings
```

原始审查需要优先修的是 public surface、导航文档和 discovery 触发边界，而不是重写这些核心 skill。Remediation 后，当前 source surface 已按 owner 决策收敛到 `/spec:write-tasks` / `$spec-write-tasks` public workflow，F2-F4 的全景文档 polish 已完成，F5 的 trigger discovery polish 也已覆盖核心链路 9 个 skill。剩余风险主要是 generated runtime mirrors 尚未执行非 dry-run `spec-first init` 刷新，以及 fresh-source eval 未执行。
