# spec-first 工程深度审查报告

> Lifecycle: historical-input. 本报告描述的是 2026-04-26 当时的 CRG implementation 和 dirty worktree 状态；其中 `src/crg`、`spec-first crg`、`graph.db`、CRG workspace/topology 等口径已被后续 external graph-provider readiness 架构取代。当前 graph/provider contract 以 `spec-mcp-setup`、`spec-graph-bootstrap`、`.spec-first/config/*`、`.spec-first/graph/*`、`.spec-first/impact/*` 和 `skills/spec-graph-bootstrap/scripts/bootstrap-providers.*` 为准。

日期：2026-04-26  
审查人：Codex  
审查范围：`/Users/kuang/xiaobu/spec-first` 当前工作区  
审查姿态：代码优先、证据驱动、工程负责人视角  

> 重要说明：本报告按 2026-04-26 22:29 左右的本地工作区重写。当前工作区包含已推送提交 `1d4131a0` 之后的未提交改动，主要涉及 CRG workspace/topology、workflow hook 文案、文档和测试。因此本报告描述的是“当前工作区最新实现”，不是远程分支的干净提交态。

## 0. 管理层摘要

一句话结论：**spec-first 本质上是一个面向 Claude Code / Codex 的 AI coding workflow harness + runtime asset packager + CRG 决策输入平台；它已经明显超过“提示词文件化”，但还不是成熟的强执行规范平台。它的正确演化方向不是增加状态机，而是把给 LLM 的决策输入做真、做稳、做可追溯。**

总分：**76/100**  
成熟度等级：**团队试点**，接近“可推广”，但尚未达到高成熟组织级规范平台。

### 3 个最强项

- 【代码已证实】双宿主 runtime 安装治理是真实能力：`init` / `doctor` / `clean`、Claude/Codex adapter、managed state、developer identity、language policy、runtime drift 检查均有代码和测试支撑。
- 【代码已证实】CRG query-first 已形成真实决策输入层：`crg build` 会生成 `graph.db`、`graph-index-status.json`、`code-navigation.json`、`repo-topology.json`；`workflow-context` / lifecycle hooks 会把 graph、navigation、topology、fallback/limitations 作为 advisory input 交给 LLM。
- 【代码已证实】`spec_id` 把 requirements / plan / task pack / work handoff 从 filename/prose 推断升级为 machine-readable identity contract，同时明确不承担 state、approval、freshness 或 progress 语义。

### 5 个最高优先级风险

- P1【代码已证实】当前 runtime mirror drift 仍存在：`doctor --json` 报 Claude command、Claude standalone skill、Codex workflow skill 多处 `content_mismatch`，导致 `runtime_asset_health: warn`。
- P1【代码已证实】`decision_input_health` 仍是硬编码 `not_checked`；系统已经生成 CRG control-plane inputs，但 `doctor` 尚未汇总这些输入的 freshness、coverage、fallback 和 limitations。
- P1【代码已证实】`workflow_runnability` 仍是 `not_verified`：当前同时受 runtime drift 和缺失 `.spec-first/workflows/verification/spec-first/verification-evidence.json` 影响。
- P2【代码已证实】task pack identity 已通过 `spec_id` 补强，但 `source_plan_hash` freshness 仍缺 deterministic hash/validate tooling；当前主要依赖 skill 文本要求宿主执行。
- P2【代码已证实】`.spec-first/graph/` 既包含可共享 control-plane JSON，也包含多代 SQLite `graph.db` 和 WAL/SHM runtime 文件；source/generated/ephemeral 边界需要收紧，否则会污染仓库和 review diff。

### 系统定位

这套系统更像：**LLM 决策输入平台 + workflow harness + runtime governance layer**。它不是重编排器，不是自动代码生成器，也不应该演化成多状态流转系统。

### 30 / 60 / 90 天整改建议

- 30 天：修 runtime drift；实现 `decision_input_health` 最小汇总；明确 `.spec-first/graph` 哪些产物应版本化、哪些应忽略；让当前报告与 source/runtime 状态一致。
- 60 天：补 task pack `source_plan_hash` deterministic tooling；补 verification evidence 写入/读取闭环；把 CRG control-plane freshness / limitations 纳入 `doctor`。
- 90 天：形成轻量但真实的 workflow run evidence：review residuals、work-run、verification-evidence、quality gate result 能互相引用，但不引入中心状态机。

## 1. 项目本质定义

一句话定义：**spec-first 是一个 AI coding 工程化 harness：用 Node.js CLI 安装和治理双宿主 runtime，用 skills/agents/prompt assets 定义轻 workflow contract，用 CRG 图索引、control-plane artifacts 和 lifecycle hooks 给 LLM 提供更高质量的决策输入。**

边界说明：

- 它做：安装/同步 Claude Code 和 Codex runtime assets，管理 developer identity、语言策略、changelog 治理、managed blocks、runtime drift。
- 它做：把 ideate / brainstorm / plan / write-tasks / work / review / compound / graph-bootstrap / mcp-setup 固化为 source skills、runtime entries 和 durable artifacts。
- 它做：构建 CRG graph、navigation、topology、workspace context，让 LLM 用 observed / ambiguous / fallback signals 决策。
- 它不做：不替 LLM 做语义判断，不强制每一步进入中心状态机，不保证宿主真实执行了 `SKILL.md` 的全部步骤。
- 它不做：不自动证明 AI 写出的代码正确；它改善的是需求、计划、执行和评审时的输入质量与工件连续性。

判断：**它不是高级提示词集合；它是带 CLI、runtime governance、graph control-plane 和 workflow artifact conventions 的 AI 工程化工具。**但在 plan/work/review/compound 等关键流程上，enforcement 仍以软 contract 为主。

## 2. 基于代码事实的项目结构总览

### 目录结构解读

- `bin/spec-first.js`：包级入口，`crg` 子命令路由到 `src/crg/cli/router.js`，其他命令进入 `src/cli/index.js`。
- `src/cli/`：安装治理层，包含 `doctor` / `init` / `clean`、adapter、plugin manifest、governance 校验、managed state、developer identity、language policy。
- `src/crg/`：CRG 决策输入层，包含 graph build/query、review-context、workflow-context、lifecycle hooks、repo topology、workspace discovery/status/context。
- `skills/`：workflow 和 standalone skills 的 source of truth。
- `agents/`：review/research/persona agents 的 source of truth。
- `templates/`：Claude command/hook runtime 模板。
- `.claude/`、`.codex/`、`.agents/`：生成 runtime mirror，不是 source of truth。
- `.spec-first/graph/`：CRG graph/control-plane/runtime artifacts。当前既有共享 JSON，又有 SQLite DB generations，需要治理边界。
- `.spec-first/workflows/`：workflow run artifacts、quality gate artifacts、verification evidence 预期路径。
- `docs/contracts/`：CRG、workflow、verification 等 machine-readable contract 文档。
- `tests/`：unit/smoke/integration/e2e/contract 测试。

### Source / Runtime / Generated 边界

| 类别 | 路径 | 当前角色 | 风险 |
|---|---|---|---|
| Source of truth | `src/cli/`、`src/crg/`、`skills/`、`agents/`、`templates/`、`docs/contracts/` | 人维护、测试覆盖、发布输入 | 需要避免同一 contract 在多文件重复定义 |
| Runtime mirror | `.claude/`、`.codex/`、`.agents/` | `init` 生成给宿主消费 | 当前 drift；不应手改 |
| Generated control-plane | `.spec-first/graph/graph-index-status.json`、`code-navigation.json`、`repo-topology.json`、workspace JSON | 给 LLM 和工具消费的决策输入 | 应明确 freshness / provenance / versioning 策略 |
| Ephemeral runtime | `.spec-first/graph/generations/*/graph.db`、`*.db-wal`、`*.db-shm`、`work-runs/*` | 构建缓存和运行记录 | 不宜无边界进入 git |

### 文本版分层架构图

```text
bin/spec-first.js
  -> src/cli/index.js
       -> commands: doctor / init / clean
       -> plugin manifest + skills governance
       -> adapters: Claude / Codex
       -> state + managed blocks + developer/lang/changelog
       -> runtime assets: .claude / .codex / .agents

  -> src/crg/cli/router.js
       -> build / stats / query / locate / path / explain / review-context
       -> workflow-context / hook / workspace
       -> SQLite graph.db + control-plane JSON
       -> lifecycle hooks: before-plan / before-work / after-work / before-review
       -> workspace discovery/status/context for parent workspaces

skills/*.md + agents/*.md
  -> host LLM reads and executes
  -> outputs docs/brainstorms, docs/plans, docs/tasks, docs/solutions
  -> consumes CRG observed/ambiguous/fallback decision inputs
```

### 边界判断

- 【代码已证实】source/runtime 边界在设计上清楚，`doctor` 也能发现 runtime drift。
- 【代码已证实】CRG 从旧 Stage-0 docs/minimal-context 转为 query-first graph/control-plane，符合“脚本准备事实、LLM 做判断”。
- 【代码已证实】workspace/topology 新实现继续保持 advisory：`workspace context` 给 candidates 和 recommended commands，不自动选择 repo。
- 【高可信推断】`init` / `plugin.js` 仍是维护热点：manifest、governance、asset sync、anchor drift、runtime transform、state 写入耦合较高。

## 3. 关键执行链路复盘

### CLI / runtime 链路

```text
spec-first init --claude|--codex
  -> parse args
  -> getAdapter()
  -> loadPluginManifest()
  -> loadSkillsGovernance()
  -> buildFilteredAssetSet()
  -> resolveDeveloperIdentity()
  -> planBundledAssetSync()
  -> adapter.planRuntimeFilesSync()
  -> buildState()
  -> drift/legacy detection
  -> applyOperationPlan()
  -> write runtime assets + state + developer + managed blocks/hooks
```

【代码已证实】`init` 是真实安装器，不是 README 说明；但职责偏重。

```text
spec-first doctor --json
  -> common checks: Node/Git/plugin/CRG
  -> platform checks: Claude/Codex CLI, state, developer, blocks, hooks, runtime assets
  -> runtime_asset_health
  -> host_readiness
  -> workflow_runnability
  -> verification-evidence freshness/schema if present
```

当前实际 `doctor --json` 摘要：

```json
{
  "install_health": "pass",
  "runtime_asset_health": "warn",
  "host_readiness": "pass",
  "decision_input_health": "not_checked",
  "workflow_runnability": "not_verified"
}
```

【代码已证实】`decision_input_health` 当前在 `doctor.js` 中仍直接返回 `not_checked`，不是实际计算结果。  
【代码已证实】`workflow_runnability` 能区分 runtime assets、host readiness、managed state、workflow surface、verification evidence，但当前 runtime drift 和 evidence missing 使其保持 `not_verified`。

### CRG graph/control-plane 链路

```text
spec-first crg build --repo=<repo>
  -> collect inputs
  -> parse files into nodes/raw edges
  -> update graph.db + fingerprints
  -> postprocess communities/flows
  -> assess generation health
  -> promote generation if healthy
  -> write graph-index-status.json
  -> write code-navigation.json
  -> write repo-topology.json
  -> append graph-operations.jsonl
```

【代码已证实】`src/crg/cli/build.js` 会写 `graph-index-status.json` 和 `code-navigation.json`，当前测试也锁定这些文件。  
【代码已证实】最新实现还写入 `repo-topology.json`，并在 workflow-context 中作为独立 decision input。  
【代码已证实】当前本地 `workflow-context` 中 `code_navigation` 已是 `observed`，但 `repo_topology` 因当前 artifact 缺失仍为 `ambiguous`。

### Workspace 链路

```text
spec-first crg workspace scan --root=<workspace>
  -> discover nested git roots
  -> apply include/exclude/max_depth
  -> write workspace-index.json

spec-first crg workspace status --root=<workspace>
  -> read/discover children
  -> inspect child graph readiness
  -> write workspace-status.json

spec-first crg workspace context --root=<workspace> --task=<text>
  -> rank child repo candidates
  -> emit recommended commands
  -> no automatic repo selection

spec-first crg workspace build --root=<workspace> --repo=<slug|path>
  -> explicit child selection
  -> child-local crg build
```

【代码已证实】workspace build 明确拒绝 `--all`，Phase 1 只允许显式 child repo，符合 light contract。

## 4. 流程 contract 与决策输入审查

| 流程 | 入口 | 主契约 | 工件输出 | Machine-readable decision input | hard enforce 到什么程度 | 风险 |
|---|---|---|---|---|---|---|
| bootstrap / graph-bootstrap | `spec-graph-bootstrap` / `spec-graph-bootstrap`；CLI 是 `spec-first crg build` | `skills/spec-graph-bootstrap/SKILL.md` + `src/crg/*` | `graph.db`、`graph-index-status.json`、`code-navigation.json`、`repo-topology.json`、`graph-operations.jsonl` | graph state/capabilities/stats/limitations、navigation entrypoints/test_roots/high_risk_nodes、repo topology kind/units/limitations | CRG build 是代码 enforce；skill 调用路径是软 contract | `doctor` 未汇总 decision input health；当前 repo_topology 可能 ambiguous |
| workspace | `spec-first crg workspace scan/status/context/build` | `src/crg/workspace/*` + `docs/contracts/crg/workspace-*.schema.json` | `.spec-first/workspace/*.json` | workspace children、readiness、candidate ranking、recommended commands | CLI enforce 显式 child build、拒绝 `--all` | Phase 1 作用域克制但文档需说明非自动调度 |
| ideate | skill / host workflow | `skills/spec-ideate/SKILL.md` | `docs/ideation/` | repo scan、web/research digest、learnings | 软 contract | 多 agent/研究依赖强，代码不 enforce |
| brainstorm | `spec-brainstorm` / `spec-brainstorm` | `skills/spec-brainstorm/SKILL.md` + `requirements-capture.md` | `docs/brainstorms/*-requirements.md` | YAML `spec_id`、topic/date、R/A/F/AE IDs、requirements/success criteria | `spec_id` 规则是 skill contract；无 CLI validator | 需求质量靠 LLM；frontmatter 可读但未 schema lint |
| plan | `spec-plan` / `spec-plan` | `skills/spec-plan/SKILL.md` | `docs/plans/*-plan.md` | inherited/plan-local `spec_id`、origin、requirements trace、U-IDs、files/tests/verification、CRG before-plan envelope | CRG hook 是 CLI；plan 内容是软 contract | plan 结构强，真实性仍靠 LLM |
| write-tasks | standalone skill `spec-write-tasks` | `skills/spec-write-tasks/SKILL.md` + task pack schema | `docs/tasks/*-tasks.md` | copied `spec_id`、`source_plan`、`source_plan_hash`、task graph、dependencies、stop_if | skill/schema contract；没有 CLI hash validator | identity 已补强；freshness 工具缺失 |
| work | `spec-work` / `spec-work` | `skills/spec-work/SKILL.md` | 代码变更、tests、commits、work-run | plan/task pack、`spec_id`、source plan hash、CRG before/after-work、planned vs actual surface | CRG hooks 是 CLI；执行过程是软 contract | task pack validation 依赖宿主按 skill 执行 |
| review | `spec-code-review` / `spec-code-review` | `skills/spec-code-review/SKILL.md` | `.spec-first/workflowsspec-code-review/<run-id>/` | diff、CRG before-review、hunk hits、candidate tests、confidence、limitations | review-context 是 CLI；persona execution 是软 contract | 多 reviewer 输出真实性依赖宿主 |
| compound | `spec-compound` / `spec-compound` | `skills/spec-compound/SKILL.md` | `docs/solutions/*.md` | solved problem、patterns、references、refresh hints | 软 contract | 知识质量和去重依赖 LLM |
| mcp-setup | `spec-mcp-setup` / `spec-mcp-setup` | skill + shell/PowerShell scripts | host setup ledger | tool readiness、baseline_ready、next_actions、fallback | 脚本部分 hard；workflow消费软 | readiness ledger 未强制所有上游流程 |

### `spec_id` contract 专项

【代码已证实】`spec_id` 的作用边界已经清楚：

```text
requirements spec_id
  -> plan inherits or creates plan-local spec_id
  -> task pack copies spec_id + source_plan + source_plan_hash
  -> work validates missing/mismatch before task-pack execution
```

- `spec_id` 是 identity，不是 freshness：freshness 仍由 `source_plan_hash` 承担。
- `spec_id` 是 artifact-chain trace，不是 workflow state、approval、progress、completion。
- legacy requirements 不阻塞 planning；legacy plan 不应作为 executable task-pack source。
- alternative / replacement / independent delivery chain 由 LLM 判断是否继承或创建新 chain，并记录理由。

判断：**这是符合项目哲学的轻 contract 增强。**它没有引入 registry、中心状态机或强编排，但显著降低了 LLM 在需求/计划/任务/执行之间靠文件名猜身份的风险。

## 5. 软件工程质量审查

### 架构与分层

- 【代码已证实】CLI 主面克制：核心命令仍是 `init` / `doctor` / `clean` / `crg`，没有把所有 workflow 都变成 root CLI 状态机。
- 【代码已证实】CRG query-first 能独立运行，并通过 workflow hooks 作为 advisory input 接入 plan/work/review。
- 【代码已证实】workspace/topology 继续保持“提供候选输入，不替 LLM 决策”的边界。
- 【高可信推断】`plugin.js` 和 `init.js` 是复杂度热点，尤其 host adapter、governance、manifest、anchor drift、runtime sync 在同一链路里耦合较强。

### 稳健性与幂等性

- 【代码已证实】`clean` 基于 managed state 删除，不盲删 custom assets。
- 【代码已证实】`doctor` 能发现 runtime drift，而不是只检查路径存在。
- 【代码已证实】workspace build 拒绝 `--all`，要求显式 child repo，避免自动大范围修改。
- 【代码已证实】schema validator 是轻量实现，只覆盖当前简单 schema 所需子集；contract 复杂后需要谨慎。

### 可维护性

- 【代码已证实】`skills-governance.json` 和 plugin manifest 仍共同存在，但有交叉校验。
- 【高可信推断】高价值 anchor drift 检查有价值，但 anchor string 变化可能带来 false positive。
- 【高可信推断】`.spec-first/graph` 产物进入 git 的策略需要明确，否则大文件、多代 DB、WAL/SHM 会持续制造 review 噪音。

## 6. AI 决策增益价值审查

它提升 AI 编码质量的真实机制是：

```text
repo source
  -> deterministic CRG build
  -> graph.db + control-plane JSON
  -> workflow-context / lifecycle hooks
  -> LLM receives observed / ambiguous / fallback decision inputs
  -> LLM selects scope, plan, risk checks, tests
  -> requirements / plan / task pack / review / solution artifacts persist decisions
  -> spec_id + source refs reduce artifact identity drift
```

核心增益来自：

- 【代码已证实】更好的决策输入：graph status、code navigation、repo topology、candidate tests、ranked review context、limitations。
- 【代码已证实】更好的 artifact continuity：requirements、plans、task packs、solutions、work/review artifacts。
- 【代码已证实】更低的上下文漂移：`spec_id`、origin、source_plan、source_plan_hash、U/R/A/F/AE/task IDs 各司其职。
- 【代码已证实】更明确的 fallback：CRG unavailable 时返回 direct repo reads，不伪造 graph evidence。

边界：

- 它不是“强制 LLM 按流程表演”；它把更可靠的事实、风险、限制和关联输入给 LLM。
- 它不证明实现正确；实现质量仍取决于宿主 LLM 是否读取代码、跑测试、处理反馈。
- 当前最大的质量缺口是健康汇总：输入已经存在，但 `doctor` 还不能判断这些输入是否新鲜、完整、足以支撑决策。

## 7. 测试与质量保障审查

### 当前复核验证

本次重写报告前实际执行：

- `npm run typecheck`：通过。
- `npx jest tests/unit/crg-generation-build.test.js tests/unit/crg-control-plane-contracts.test.js tests/unit/crg-workflow-context-hooks.test.js tests/unit/crg-workspace-artifacts.test.js tests/unit/crg-workspace-command.test.js tests/unit/crg-workspace-discovery.test.js tests/unit/crg-topology-modules.test.js tests/unit/spec-plan-contracts.test.js tests/unit/spec-write-tasks-contracts.test.js tests/unit/spec-work-contracts.test.js tests/unit/spec-work-beta-contracts.test.js --runInBand`：11 suites / 41 tests 通过。
- `node bin/spec-first.js doctor --json`：执行成功，但报告 runtime drift、`decision_input_health: not_checked`、`workflow_runnability: not_verified`。
- `spec-first crg workflow-context --repo=. --stage=plan --task=...`：执行成功；`crg_graph` observed，`code_navigation` observed，`repo_topology` ambiguous。

上一轮已执行但当前未全量重跑：

- `npm run test:unit` 曾通过，62 suites / 335 tests。

本报告不再声称当前工作区 `npm test` 全绿；若要作为 release gate，需要重新跑全量 `npm test`。

### 测试体系性质

- 【代码已证实】CRG build/control-plane/workspace/topology 已有行为测试和 schema contract tests。
- 【代码已证实】`spec_id` 链路已有 plan/write-tasks/work contract tests。
- 【代码已证实】许多 workflow tests 仍是文本 anchor 检查，能防 drift，但不能证明真实宿主执行质量。
- 【高可信推断】测试成熟度：**7.5/10**。CLI/CRG 强，宿主 workflow execution evidence 仍弱。

### 缺失的高价值测试

- `doctor decision_input_health`：graph/control-plane/topology/workspace freshness + limitations 的 fixture。
- `verification-evidence.json` 写入、schema invalid、stale、missing、fresh 的端到端测试。
- task pack `source_plan_hash` deterministic hash/validate tooling。
- runtime mirror drift-free after `init --claude --codex` 的 release fixture。
- `.spec-first/graph` artifact governance：确保 WAL/SHM 和 generation DB 策略明确。

## 8. 问题与风险清单

| 编号 | 问题 | 级别 | 证据 | 为什么是问题 | 影响范围 | 建议 |
|---|---|---|---|---|---|---|
| R1 | Runtime mirror drift 阻断 release-grade workflow surface | P1 | 当前 `doctor --json` 报 Claude commands、Claude skill、Codex skills drift | 用户宿主看到的 workflow 可能不是 source truth | Claude/Codex runtime | 运行 `spec-first init --claude` / `--codex` 同步；将 drift-free doctor 纳入 release gate |
| R2 | `workflow_runnability` 仍未验证 | P1 | 当前为 `not_verified`，basis 指向 runtime surface incomplete + verification evidence missing | 用户容易把安装成功误解为 workflow 可运行性已验证 | 全 workflow | 补 verification evidence 写入链路；doctor 区分 verified/simulated/not_verified |
| R3 | `decision_input_health` 硬编码 `not_checked` | P1 | `doctor.js` 返回固定值 | 作为决策输入平台却没有总健康判断 | graph-bootstrap/plan/work/review | 汇总 graph、navigation、topology、workspace、freshness、coverage_gaps、fallback_reason |
| R4 | CRG control-plane 已存在但未被 doctor 汇总 | P1 | `graph-index-status.json` / `code-navigation.json` 存在，workflow-context 能消费；doctor 不读 | 输入存在但用户无法一眼判断可信度 | DevEx / release readiness | doctor 增加 control-plane section 和 health rollup |
| R5 | `repo_topology` 输入仍可能 ambiguous | P2 | 当前 workflow-context 输出 repo_topology missing/ambiguous | LLM 在 mono/workspace 场景缺 repo unit 输入 | plan/work/review | 确保 build 写 topology；doctor 显示 topology artifact 状态 |
| R6 | `spec_id` identity enforcement 仍主要在 skill 层 | P2 | skill/test 已写明 missing/mismatch，但无 CLI linter | 宿主跳过 validation 时仍可执行错链 task pack | requirements/plan/tasks/work | 增加轻量 `spec-first artifacts lint` 或 task pack validator |
| R7 | `source_plan_hash` freshness 缺 deterministic tooling | P2 | `source_plan_hash` 主要在 skill/schema 文本，未见 src/scripts hash command | stale task pack 无法由工具可靠拒绝 | spec-write-tasks/spec-work | 增加 task-relevant hash/validate 工具，保持语义判断归 LLM |
| R8 | `.spec-first/graph` generated artifact 边界不清 | P2 | 当前有多代 `generations/*/graph.db` 和 WAL/SHM 文件 | 大文件和临时 DB 文件会污染 git/review | repo hygiene | 明确 gitignore/versioning 策略；只保留必要 control-plane 或固定 current |
| R9 | Workflow contract tests 仍偏文本 anchor | P2 | spec-plan/work/review 多数断言 `toContain` | 能防文案漂移，不证明宿主行为闭环 | 测试可信度 | 增加 runtime execution fixtures 和 artifact schema lint |
| R10 | Workspace support 仍是 Phase 1 | P2 | `workspace build --all` 被拒绝，仅显式 child build | 适合轻量决策输入，不是完整 workspace orchestrator | monorepo / multi-repo | 文档明确 Phase 1 边界，避免用户误以为自动跨仓编排 |
| R11 | `init` / `plugin` 职责过重 | P2 | manifest、governance、runtime sync、state、developer、blocks 集中 | 后续 host 或治理规则扩展成本高 | CLI maintainability | 拆分 plan/build/apply/report/governance 模块 |
| R12 | Changelog / language policy 仍偏宿主自觉 | P3 | managed block 强提示，非完整 precommit enforcement | 团队可能绕过，也可能觉得负担过重 | team governance | 提供 optional lint，而不是中心状态机 |

### 8.1 逐项优化方案

| 编号 | 最佳优化方案 | 边界判断 | 验收信号 | 避免跑偏 |
|---|---|---|---|---|
| R1 | 把 runtime drift 修复作为 release 前固定动作：运行 `spec-first init --claude` 和 `spec-first init --codex`，再用 `doctor --json` 验证 runtime asset health。 | 这是确定性同步问题，应由 CLI 处理，不应让 LLM 手工改 `.claude/` / `.agents/`。 | `runtime_asset_health: pass`；Claude/Codex drift warnings 为空；source skill 与 runtime mirror anchor 一致。 | 不要把 drift 修复做成人工 checklist；不要手改 runtime mirror。 |
| R2 | 定义最小 verification evidence contract：由 `spec-work` / `spec-code-review` / quality gate 写入同一个 verification evidence artifact，`doctor` 只读并判断 schema/freshness。 | 写入和校验是确定性流程；“是否足够上线”仍由 LLM 和负责人判断。 | `workflow_runnability` 能区分 `verified` / `simulated` / `not_verified`，并列出 evidence source、freshness、fallback_reason。 | 不要做中心审批状态机；不要把 evidence presence 等同于质量通过。 |
| R3 | 为 `decision_input_health` 增加最小 rollup：graph status、code navigation、repo topology、workspace status、freshness、limitations、coverage_gaps、fallback_reason。 | 这是输入健康汇总，不是替 LLM 决策。脚本只报告 observed/ambiguous/missing/stale。 | `decision_input_health` 不再是 `not_checked`；JSON 输出包含 per-input status 和总体 `pass/warn/error`。 | 不要让 doctor 判断“该改哪些文件”；它只说明输入是否可信。 |
| R4 | 将 CRG control-plane artifacts 纳入 doctor：读取 `graph-index-status.json`、`code-navigation.json`、`repo-topology.json`，验证 schema、generation_id、mtime/freshness 与 active graph 是否一致。 | 这是事实校验，应 hard enforce；具体如何使用仍交给 workflow/LLM。 | control-plane section 显示 status/navigation/topology 的 source、freshness、limitations；缺失时给明确修复命令。 | 不要只检查文件存在；要区分 missing、invalid、stale、degraded。 |
| R5 | 让 `crg build` 后稳定写 `repo-topology.json`，并让 `workflow-context` 对 topology 明确输出 observed/ambiguous/invalid；doctor 同步暴露。 | topology 是决策输入，不是自动 workspace 调度器。 | 当前 repo 的 `repo_topology.decision_input_kind` 从 ambiguous 变为 observed，或给出明确 fallback_reason。 | 不要自动选择 repo 或扩大变更面；workspace context 只给候选和证据。 |
| R6 | 增加轻量 artifact linter：校验 requirements/plan/task pack frontmatter 中的 `spec_id` 格式、继承关系、task pack/source plan mismatch。 | 这是 machine-readable contract 校验；“是否同一业务链”仍由 LLM 在 ambiguous 时判断。 | linter 能报 missing-spec-id、spec-id-mismatch、weak legacy trace；不会自动重写 legacy origin。 | 不要引入中央 registry；不要让脚本判定 alternative/replacement 的语义归属。 |
| R7 | 实现 task-relevant hash 工具：从 plan 的执行相关 sections 生成 canonical hash，task pack 写入 `source_plan_hash`，`spec-work` 消费前调用 validator。 | hash 是确定性 freshness；task 拆分质量仍由 LLM 判断。 | `spec-write-tasks` 能生成真实 `sha256:<64-hex>`；`spec-work` 能拒绝 stale/unverifiable task pack。 | 不要用 whole-file hash 放大无关格式变更；不要用 `pending-tooling` 伪装验证。 |
| R8 | 制定 `.spec-first/graph` 版本策略：保留必要 control-plane JSON；忽略 WAL/SHM；限制 generation DB 入库；必要时提供 prune/clean 命令。 | 这是仓库卫生和产物治理，不是 workflow 语义问题。 | `.gitignore` / docs / tests 明确哪些 graph artifacts 可追踪；`git status` 不再反复出现 WAL/SHM。 | 不要删除用户需要共享的 control-plane；也不要把所有 cache 都提交。 |
| R9 | 将文本 anchor tests 分层：保留少量高价值 anchor，新增 schema lint、runtime sync snapshot、artifact fixture 和 smoke execution。 | anchor test 防 prompt drift；行为测试证明工具链。两者不要混用。 | 每个关键 workflow 至少有 source contract test、runtime sync test、artifact schema fixture。 | 不要把所有 prompt 文案都锁死；避免测试阻碍正常文案优化。 |
| R10 | 明确 workspace Phase 1：scan/status/context/build-one-child；文档、help 和测试统一拒绝 `--all` 自动构建。 | Workspace 当前是决策输入层，不是跨仓 orchestrator。 | `workspace context` 输出 candidate repos 和 recommended commands；`workspace build --all` 明确失败。 | 不要为了“完整”引入跨仓自动编排、自动选择 repo 或强调度。 |
| R11 | 拆分 `init/plugin`：asset discovery、governance validation、sync planning、apply、report 各自成模块，保留现有 CLI 行为不变。 | 这是维护性重构，不改变用户 contract。 | 单测仍覆盖 dry-run、drift、legacy reset、state shape；模块边界能单独测试。 | 不要顺手改 runtime 格式；先拆结构，再改行为。 |
| R12 | 将 changelog/lang policy 从“强口头规则”升级为 optional lint：默认提示，release/CI 可开启 fail。 | 团队治理需要可配置；脚本可检查格式，是否豁免由人决定。 | `doctor` 或 lint 能提示 missing changelog；CI 可配置为 warning/error。 | 不要把个人开发路径变成强制企业流程；避免无例外规则阻塞小修。 |

### 8.2 建议整改顺序

立刻修：

- R1：修 runtime mirror drift，先让 `doctor --json` 达到 `runtime_asset_health: pass`。
- R3/R4：实现 `decision_input_health` 最小 rollup，并纳入 CRG control-plane artifacts。
- R8：明确 `.spec-first/graph` git hygiene，立即处理 WAL/SHM 和 generation DB 策略。

下个版本修：

- R7：实现 task pack `source_plan_hash` deterministic tooling。
- R2：补 verification evidence 写入/读取闭环。
- R5/R10：收口 repo topology 与 workspace Phase 1 文档、doctor 可见性和测试。

中期结构性改造：

- R11：拆 `init/plugin` 过重职责。
- R9：升级 workflow contract tests，从文本 anchor 扩展到 runtime/artifact fixture。
- R12：把 changelog/lang policy 做成 configurable governance lint。

### 8.3 下一轮实现的 Done Signals

- `doctor --json` 顶层健康字段至少包含可解释的 `decision_input_health`，且不是 `not_checked`。
- `workflow-context` 中 `crg_graph`、`code_navigation`、`repo_topology` 都明确区分 `observed` / `ambiguous` / `invalid`，并提供 fallback reason。
- `spec-write-tasks` 生成的 executable task pack 同时具备 matching `spec_id` 和真实 `source_plan_hash`。
- `spec-work` 在消费 task pack 前能用确定性工具拒绝 stale、missing identity、wrong-chain handoff。
- `.spec-first/graph` 的 tracked/untracked 策略清楚，WAL/SHM 不再进入常规 review surface。
- runtime sync 后 `doctor` 不再报告 Claude/Codex drift。

## 9. 优点总结

- 【代码已证实】CLI 安装治理是真实平台能力。
- 【代码已证实】CRG query-first 已从概念进入可运行实现，并且提供 observed/ambiguous/fallback 边界。
- 【代码已证实】`spec_id` 把跨文档身份变成轻量 machine-readable contract，方向正确。
- 【代码已证实】workspace/topology 新能力保持克制：给 LLM 决策输入，不自动替 LLM 选仓库。
- 【代码已证实】测试体系对 CRG/CLI 的保护较强，能支撑团队试点。
- 【高可信推断】项目最强资产是“runtime governance + CRG decision input + workflow artifacts”的组合，而不是单个 prompt。

## 10. 总评分与成熟度判断

| 维度 | 分数 | 理由 |
|---|---:|---|
| 需求工程 | 8 | requirements artifact、R/A/F/AE、`spec_id` identity 链路增强 |
| 架构设计 | 8 | query-first CRG、workspace/topology 和 host adapter 分层方向正确 |
| 分层清晰度 | 7 | source/runtime 边界清楚，但 `.spec-first/graph` generated 边界需治理 |
| 代码质量 | 7 | CommonJS 风格一致，CRG 模块化增强，`init/plugin` 仍偏重 |
| 稳健性 | 7 | dry-run/state/doctor/workspace explicit build 较好，decision_input_health 缺口明显 |
| 测试充分性 | 8 | CRG/CLI/unit 强，真实宿主 workflow execution evidence 弱 |
| 可维护性 | 6 | skills/agents/runtime/control-plane 多层同步成本高 |
| 可扩展性 | 7 | workspace/topology 增强扩展性，但 Phase 1 仍克制 |
| 开发者体验 | 7 | init/doctor 清晰，但当前 runtime drift 和 workflow 面复杂 |
| AI 协作增益 | 8 | 决策输入和 artifact identity 有实质提升 |
| 规范治理能力 | 7 | 有 managed blocks、doctor、governance，但多为软 enforce |
| 组织可推广性 | 6 | 适合试点；组织级 rollout 需要 evidence/doctor/asset hygiene 闭环 |

总分：**76/100**  
等级：**团队试点，接近可推广**。

扣分主因不是缺少重编排，而是：

- runtime mirror 当前 drift；
- `decision_input_health` 未实现；
- workflow runnability 缺 verification evidence；
- task freshness 缺 deterministic tooling；
- generated artifacts 治理边界不够清楚。

## 11. 最终结论

技术负责人审查结论：

**值得继续推进，也值得团队试点；但当前不能按“成熟可推广的组织级规范平台”宣传。**

适合：

- 已经使用 Claude Code / Codex 的团队。
- 认同“脚本准备事实，LLM 做语义判断”的团队。
- 需要把 AI coding 从一次性对话升级为 requirements / plan / tasks / work / review / solutions artifacts 的团队。
- 有平台负责人维护 runtime assets、skills、agents、CRG control-plane 和治理规则的团队。

不适合：

- 需要强审批流、强状态机、强合规 gate 的团队。
- 期望安装后自动保证 AI 写对代码的团队。
- 不愿维护 `.spec-first`、runtime mirror、skills/agents/contracts 的个人项目。

它是否显著提升 AI 编码质量：**是，但提升机制不是“自动编码更强”，而是让 LLM 在更真实、更结构化、更可追溯的输入上做判断。**

提升的质量：

- 需求质量：requirements artifact + R/A/F/AE + `spec_id`。
- 设计质量：plan quality bar + origin trace + CRG before-plan。
- 实现质量：spec-work posture + CRG before/after-work + task pack identity/freshness contract。
- 评审质量：code-review personas + CRG before-review + candidate tests。
- 知识沉淀质量：compound solutions。
- 团队治理质量：init/doctor/lang/changelog/developer identity/governance。

最强的地方：**把 AI workflow 的决策输入平台化，而不是把 LLM 塞进状态机。**

最弱的地方：**输入健康和运行性还没完全可验证；当前仍容易把“有 contract / 有 prompt”误读为“已 enforce”。**

当前最该优先补的 3 个工程短板：

1. `doctor decision_input_health`：把 graph、navigation、topology、workspace、freshness、limitations、fallback 汇总成可解释健康状态。
2. Runtime/generated artifact governance：修 drift，明确 `.spec-first/graph` control-plane vs DB/cache/run artifact 的版本策略。
3. Task pack freshness tooling：实现 `source_plan_hash` 的 deterministic hash/validate，和 `spec_id` identity validator 分工清楚。

最终路线建议：**继续坚持“轻 contract + 明确边界 + 高质量决策输入”。下一阶段不要增加更多 workflow，也不要引入中心状态机；应优先把现有 CRG/identity/verification 输入做真、做稳、做可追溯。**
