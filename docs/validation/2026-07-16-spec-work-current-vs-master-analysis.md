# `spec-work`：当前分支与 `master` 的深度对比、能力拆解与吸收建议

> Artifact type: confirmed source diff + historical-plan evidence + semantic integration recommendations + implementation closure addendum
> Date: 2026-07-16
> Comparison baseline: `master` (`437bb9e4`) ↔ pre-implementation current `HEAD` (`6a0f060c`, branch `leo-2026-07-16-plan-update`)
> Closure source: current worktree implementation of `docs/plans/2026-07-16-003-refactor-spec-work-quality-capability-closure-plan.md`; no commit/PR is claimed by this document.
> Scope: `skills/spec-work/**` canonical source、直接相关 tests/contracts、`spec-plan`/`spec-write-tasks`/`spec-lfg` consumer contracts、历史已完成或 active 的 `spec-work` 技术方案；generated runtime mirrors 排除在写入范围外。

## 结论

当前分支的 `spec-work` 不是 `master` 的小幅精简版，而是一次由 `f6c52813` 主导的 **CE-first 执行工作流替换**：它保留并强化了统一计划 readiness、Markdown/HTML 分段读取、knowledge-work carve-out、inline/subagent/goal/dynamic-workflow engine、proof-first/characterization-first evidence、Return-to-Caller、review-only + caller-owned fix、Residual Work Gate 和 plan lifecycle closeout；同时按 CE parity 删除了 master 上多项 spec-first 专属治理能力。

`master` 则拥有更完整的 **spec-first 执行治理与工程质量地板**：settled-scope 入口合同、task-pack executable intake、target repo/source-runtime/scope non-expansion、feedback-loop-first、Minimality + Architecture Fit Preflight、reuse/extend recheck、simplification 分类、structured verification/run evidence、completion response、tracker artifact portability，以及覆盖这些能力的 contract/eval/invariant tests。

因此，正确方向不是把当前分支回滚到 `master`，也不是继续把 `master` 能力统称为“旧 spec-only contract”而排除；目标应是：

> **保留当前分支的 unified-plan + execution-engine + verification-evidence 架构，恢复 `master` 中仍然有效的 scope、architecture-fit、task-pack、evidence-closeout 和 regression-floor 能力。**

本次深审确认 5 个最高信号问题。下文按 P0/P1 定义重新分级，不把所有质量 attention prompt 都误当成执行 hard gate：

1. **P0 — `spec-plan → spec-write-tasks → spec-work` task-pack 链有两处断点。** 当前 `spec-plan` producer 不保证写 `spec_id`，但 `spec-write-tasks` 仍要求 source plan 有 `spec_id` 才能生成 executable pack；即使补齐 identity，当前 `spec-work` intake 也不识别、验证或按 Task Cards 执行 task pack，而 shipping 却保留 task-pack `source_plan` lifecycle 分支。
2. **P1 — `spec-plan` 新增的 `reuse / extend / compose / new` 架构决策没有进入 work-phase recheck。** 当前计划器已经明确要求 `spec-work` 在 `compose / thin-glue` 或 `new` 前回看当前 source；当前 `spec-work` 只有泛化的 “reuse existing components / follow patterns”，无法守住胶水层 ownership、失败传播、降级、证据聚合、wrong-owner reuse 和 future-only abstraction 边界。
3. **P0 — run-evidence 被声明为 integrated，但 active workflow 已无 producer 调用。** schema 与 runtime catalog 仍标记 `x-spec-first-workflow-integrated: true`，CLI producer/helper 仍存在；当前 `skills/spec-work/**` 对 `verification-run-summary`、`honest-closeout`、`spec-work-run-artifact` 零引用，相关 integration/unit/fixture tests 也已删除。这是 confirmed contract/source drift。
4. **P0 — mutation、scope、dispatch 和 isolation 边界不够可靠。** master 和当前版本都遗留 “Create new tasks if scope expands”，但当前又删除了 master 的高显著性 non-expansion/stop anchors；同时 structured plan 默认优先 subagent，worker dispatch authorization 没有独立表达，对 Codex fork workspace 的假设与当前宿主“共享同一工作目录”的真实能力不一致，worker commit ownership也互相冲突。
5. **P0/P1 — skill-local execution regression floor 大幅收缩。** `spec-work-contracts` 从 28 cases 收缩为 7，`task-pack-command` 从 48 收缩为 6，work-local eval 与 run-evidence/invariant/containment tests 被删除；当前确有新增的 unified readiness consumer replay 与 lifecycle helper/integration coverage，但它们不能替代 task-pack、scope、architecture、run-evidence 和 artifact-path 保护。

`master` 的所有内容并非都应恢复。旧的 host-native review tier、`mode:autofix`、Markdown-only/full-read 假设、已退役 team-standards 路径、硬编码宿主能力和大段重复 prose 不应回迁。吸收应采用 **Adopt / Extend / Compose / New / Defer**，而不是文件级复制。

## 2026-07-16 实施收口更新

本报告以下主体保留“实施前对比”的证据口径；本节记录随后由 `2026-07-16-003` 执行的 current-source closure，防止把历史问题继续误读为当前断点。完整逐 unit 证据、命令、runtime adoption 与 limitation 见 `docs/validation/spec-work/2026-07-16-quality-capability-closure-eval.md`。

| 原建议 | 当前吸收结果 | Source owner / 边界 |
| --- | --- | --- |
| A. Settled-scope Contract Spine | 已完成 | `spec-work/SKILL.md` 增 Workflow Contract Summary、Reference Trigger Map 与 P0 hard exits；没有恢复强状态机。 |
| B. Validated task-pack executable intake | 已完成 | task identity/root/hash CLI + `work-intake-and-task-pack.md`；task pack保持derived，source plan拥有scope/lifecycle，semantic-fit仍由LLM判断。 |
| C. Architecture / Composition Recheck | 已完成 | `implementation-quality.md` 持有current-source `reuse / extend / compose / new`、thin-glue owns/does-not-own、wrong-owner/future-only/new-boundary stop-back。 |
| D. Scope / Target Repo / Source-Runtime | 已完成 | `execution-strategy.md` 与三个high-risk workflow锁定target repo、dirty overlap、canonical source、scope-changing discovery与mutation/commit/landing分离。 |
| E. Feedback Loop And Vertical Slices | 已完成 | `feedback-and-tests.md` 持有smallest loop、vertical slice、proof/characterization、surface-specific verification与replacement evidence。 |
| F. Minimality / Simplification | 已完成 | `remove-now` / `minimality-debt` / `protected` / `architecture-mismatch`四分类；不默认extract helper，不为LOC删除security/data/a11y/observability/required checks。 |
| G. Structured Verification And Run Evidence | 已完成 | active shipping source持有`verification-run-summary`、`honest-closeout`和conditional `spec-work-run-artifact/v2`的实际调用序列，helper/producer integration tests确认确定性路径；debug/review仅消费共享summary/closeout，不取得work-artifact ownership。 |
| H. Completion / Changelog / Artifact Path | 已完成 | Return-to-Caller与standalone handoff均返回summary ref、verdict、artifact reason和limitations；session-temp review detail需脱敏物化或降级为structured summary。 |
| I. Direct Evidence / Context Economy | 已完成source分层 | Front Controller + 一层triggered references，actual-tree/source/test/log优先；provider graph仍是advisory navigation。Loader/context-room收益仅为contingent。 |
| J. Contract / Eval / Invariant Floor | 已完成 | 恢复/新增task-pack、review scope、target containment、run evidence、implementation quality、anti-rationalization、front-controller与五宿主projection suites，并纳入AI gate。 |
| K. Scenario Capability | 已完成 | `spec-work`、`spec-debug`、`spec-code-review`恢复high-risk overrides；缺optional evidence只限制claim，foreign residual可阻断相关mutation/claims。 |
| L. Anti-Rationalization | 已完成 | 三workflow恢复轻量Red Flags；shared contract明确它们不是script gate、approval或状态机。 |

已明确拒绝回迁：host-native Tier 1/Tier 2 review、`mode:autofix`、worker自动commit、skill-owned branch自动push/PR、硬编码宿主能力、把`spec_id`恢复为全局必填、第二套task/progress/evidence schema，以及把generated runtime mirror当source owner。

Runtime adoption 已使用当前 checkout 的 `node bin/spec-first.js init --claude --codex --cursor --kiro --qoder` 完成，5/5 hosts generated runtime ready；Claude/Codex doctor为PASS，Cursor/Kiro/Qoder保留CLI/loader、duplicate discovery、hook activation与MCP config warnings。该结果只证明current source可重建managed runtime，不证明clean-session模型行为、reviewer independence或field outcome。Fresh-source eval仍为`not_run: dispatch_authorization_missing`。

最终 current-worktree verification：计划focused gate 21 suites / 159 tests、unit 117 suites / 1090 tests、integration 6 suites / 21 tests、`npm test`中的smoke 1 suite / 5 tests、AI gate 39 suites / 393 tests、typecheck 179 files、skill entrypoint lint 309 files均通过；package build、structured closeout与plan lifecycle结果以companion validation report为准。收尾inline审查另外修复了CE upstream test仍绑定旧engine原句、debug diagnosis-only伪造`degraded` verdict、review inline fallback缺run-id/finding normalization，以及work shipping未消费dispatch-authorization degraded result四项合同缺口。

## 范围、方法与证据边界

### 比较口径

- 使用 `git diff --histogram master -- skills/spec-work tests/unit/spec-work-contracts.test.js` 比较两端最终树。
- 当前 `HEAD` 与 `master` 的共同祖先为 `04ed28a5`；`master` 侧在分叉后没有新的 `spec-work` commit，主要差异来自当前分支的 CE-first replacement 及其后续 lifecycle/quality-closure 补丁。
- `master` 基线：
  - `skills/spec-work/SKILL.md`: 579 行
  - `references/shipping-workflow.md`: 269 行
  - `references/tracker-defer.md`: 149 行
  - `evals/examples.json`: 74 行 / 6 cases
  - `tests/unit/spec-work-contracts.test.js`: 680 行 / 28 tests
- 当前基线：
  - `skills/spec-work/SKILL.md`: 437 行
  - 5 个顶层 runtime references + 1 个 nested Figma local prompt asset
  - `references/shipping-workflow.md`: 147 行
  - 无 `skills/spec-work/evals/**`
  - `tests/unit/spec-work-contracts.test.js`: 71 行 / 7 tests
- 包级 diff：9 个直接相关文件，约 660 insertions / 1,228 deletions；主干 prompt 变短，但 runtime reference 总体能力面增加，维护者 eval 与大量 contract assertions 被移除。

### 证据类型

| 证据 | 本文如何使用 | 不能证明什么 |
| --- | --- | --- |
| `git show master:<path>`、当前 source、当前 tests | 确认两端真实文本、模块、命令、字段和消费者 | 不证明模型会稳定遵守 prompt |
| 当前 CLI/schema/catalog | 确认 deterministic producer、schema flag 和公开 capability 声明 | 不证明 active workflow 真实调用了 producer |
| 历史 completed/active plans 与 Changelog | 解释能力为什么存在、是否曾完成、迁移为何删除 | 不自动等于当前 runtime contract |
| `spec-plan` consumer replay | 分别确认 fixture 的 Planning Contract 含 composition KTD，以及 `spec-work` 具备 section-map/active-U-ID 读取文案 | 两条机械事实尚未证明 work 会选中、读取或执行 composition KTD |
| CE-first migration review | 确认当前 package 与 CE `ce-work` 的文件/主流程 parity | 不证明被删除的 spec-first 能力已安全退役，也不证明真实 work/shipping 行为 |
| focused Jest | 确认当前 7 个静态 contract assertions 通过 | 不能覆盖已删除行为，也不等于 fresh-source/field outcome |

### 原始分析阶段已执行的只读检查

- `git status --short`、branch/SHA/merge-base 检查。
- `git diff` / `git show master:` 对 `SKILL.md`、shipping、tracker、eval、tests 的逐段比较。
- 当前/历史 `spec-work` 方案与 `spec-plan` 最新 composition contract 交叉审查。
- 三个独立只读 reviewer 分别审查 prompt/reference、tests/contracts/consumers 和本文档本身；这些审查用于交叉发现，不等于 fresh-source runtime forward-test。
- canonical `skills/spec-write-skill/scripts/validate-skill.cjs skills/spec-work --json`：结构结果 `pass`，仅有 `argument-hint` extension warning；该 validator 不证明 prompt 语义、reference branch 会被正确加载或 consumer 行为。
- `npx jest tests/unit/spec-work-contracts.test.js --runInBand`：1 suite / 7 tests passed。

### 原始分析阶段未执行

以下内容描述实施前的只读分析阶段；后续 closure 状态以本报告“实施收口更新”和 companion validation report为准。

- 未运行把 `spec-work` 当真实执行者的 fresh-source semantic forward-test：`not_run: analysis-only-comparison`。本轮 delegated reviewer 只读审查源文件，没有执行或模拟完整 work/shipping 行为。
- 未启动真实 Claude/Codex/Cursor/Kiro/Qoder clean session。
- 未执行 `spec-first init`，未观察 runtime projection。
- 未修改 `skills/spec-work/**`、CLI、schema 或 tests；本文只输出分析与建议。

## 历史方案回放与能力存活状态

历史方案必须按“当时是否完成”与“能力今天是否仍被 active source 消费”分开判断。`status: completed` 只能证明当时方案的交付结论，不能覆盖后来 `f6c52813` 对 source 和 tests 的替换。

| 历史工件 | 当时状态与核心能力 | 当前存活状态 | 本次结论 |
| --- | --- | --- | --- |
| `2026-05-11-001` + `2026-05-11-002` workflow quality plans | `completed`；前者给出 workflow contract、feedback/vertical slice、context/evidence 等对标设计，后者作为 source 实施 owner 落地 | Contract Summary、feedback loop、domain/decision context 与部分 evidence consumer 在 CE replacement 后不再完整存在 | 继承轻合同、scripts prepare facts/LLM decides、vertical slice 等意图；不恢复强状态机、固定目录或大段 monolith |
| `2026-05-11-006-feat-task-pack-review-gate-plan.md` | `completed`；定义 task-card `review_gate: optional|required`、`review_focus` 和 per-task bounded report-only review | 当前 task-pack schema/quality metadata 仍承认字段；`spec-work` intake 和 required-gate execution consumer 不存在 | task-pack 恢复不能只“传字段”，还要用当前 `mode:agent` review-only 模型适配 task-level required gate |
| `2026-05-20-001-fix-spec-work-skill-quality-plan.md` | `superseded`；fix-1 已落地，后续 execution-boundary/examples ownership 明确不再沿原计划推进 | 不能作为 active 开发入口；其“不要把历史诊断直接当当前真相”仍是审查方法约束 | 仅作反例与溯源，不恢复其旧 owner/path 设计 |
| `2026-05-28-002-feat-spec-first-scenario-adaptive-milestone-plan.md` | `completed`；外置 Scenario Capability Matrix，并为 `spec-work` 等高风险 workflow 定义 foreign-residual、optional evidence、non-git build overrides | 共享 contract 仍在，当前 `spec-work` 高风险 override declaration/consumer 已删除 | P0 恢复 work 的短 safety anchor；跨 work/debug/review 的完整闭环应作为显式跨-skill scope，不在单一 work patch 中暗扩 |
| `2026-05-28-004-feat-spec-work-run-evidence-and-invariant-lens-plan.md` | `completed`；将 run artifact 标为 workflow-integrated，并落 fixture-backed producer integration 与 workflow invariant lens | schema、producer、CLI 仍在且 catalog 仍声明 integrated；active `spec-work` consumer prose、integration/unit tests 和 invariant fixture/tests 已被删除 | 这是已交付能力被后续替换切断，不是“从未实现”；P0 必须 reintegrate 或诚实降级声明 |
| `2026-06-04-003-feat-verification-honest-closeout-plan.md` | `completed`；落 `verification-run-summary.v1`、`honest-closeout.v1`、v2 run artifact，并接入 `spec-work` closeout | deterministic helpers/contracts 仍在；work-phase consumer 与大部分相关 tests 已删除 | 与 05-28 共同证明当前存在 orphaned evidence producer/contract，不应重造第二套 |
| `2026-06-15-001-feat-anti-rationalization-tables-plan.md` | `completed`；为 work/debug/review 增 fake completion、skip validation、scope creep 等 attention-hardening 表及 drift guard | work 中已无该 section，共享 pattern/test 也已删除 | P1 恢复窄 attention prompt；它不是 gate，跨三 skill 全量恢复需单列 scope |
| `2026-07-01-003-feat-spec-work-minimality-architecture-fit-plan.md` | `completed`；3+2 preflight、future-only abstraction refusal、architecture stop-back、simplify 四分类和 eval/test 地板 | 当前 `spec-work` 基本只剩 generic pattern/reuse/simplify；能力由 `f6c52813` 删除 | 恢复 intent，但升级为当前 `reuse / extend / compose / new` consumer，不原样复制旧段落 |
| `2026-07-07-001-refactor-spec-work-skill-prompt-slimming-plan.md` | `active`；规划 front-controller spine、STOP-triggered references、owner/fallback、task-pack deterministic downshift 与 per-reference tests/evals | 目标 reference 中只有 CE 自带的 engine/non-code/review/shipping 等已存在；`work-intake-and-task-pack.md`、`feedback-and-tests.md`、`implementation-quality.md` 等未落地 | 当前 437 行不能被表述为该 slimming plan 已完成；真正验收要看能力迁移与 regression floor，不只看行数 |
| `2026-07-08-ce-to-spec-first-skill-review-plan.md` + `2026-07-09-ce-to-spec-first-skill-code-review-report.md` | 明确以 CE `ce-work` 为真相源替换 `spec-work`；parity review 判 pass | review 同时明确未实际运行 `spec-work`/LFG/subagent/review/shipping，且当时 focused Jest 未执行到 suite | 解释了删除根因，但不能证明 task-pack、architecture、run-evidence 等 spec-first 增强已被有证据地退役 |
| `2026-07-15-002-feat-plan-status-lifecycle-migration-plan.md` | `completed`；恢复 direct/source-plan `active → completed`、Return-to-Caller candidate 与 HTML/legacy degraded taxonomy | lifecycle tail 当前存在；task-pack shipping 分支存在，但 task-pack executable intake 仍不存在 | 只恢复了“从 task pack 完成后更新谁”，没有恢复“如何安全接收并执行 task pack” |
| `2026-07-16` 当前 `spec-plan` quality closure | 已把 architecture posture 升级为 `reuse / extend / compose / new`，并要求 work 在 compose/new 前 recheck source | plan fixture 含 composition KTD，work prompt 具备 bounded section-map 文案，但尚无证据把两者连成 composition consumer | 这是 master architecture preflight 之上的新集成要求，不可误写成 master 已有 thin-glue 能力 |

### 迁移根因判断

`f6c52813` 的主要目标是 CE truth-source parity，因此“CE 中不存在”当时被用作删除 spec-first-only contract 的依据。后续 `2026-07-09` review 的 `pass` 也只证明 CE parity、静态引用和 source 结构；其 degraded 记录明确没有执行真实 work、LFG、subagent、goal/dynamic workflow、review JSON consumer、Residual Work Gate 或 PR shipping tail，focused Jest 也未进入 `spec-work` suite。

所以本次吸收判断不能沿用“被 CE replacement 删除 = 已证明不需要”。正确证据顺序是：当前消费者是否仍存在 → deterministic owner 是否仍存在 → 当前 source 是否仍声明能力 → 历史完成方案是否有回归保护 → 真实行为是否重新验证。

## 文件与结构变化

### `master` package

```text
skills/spec-work/
├── SKILL.md
├── evals/
│   └── examples.json
└── references/
    ├── shipping-workflow.md
    └── tracker-defer.md
```

### 当前 package

```text
skills/spec-work/
├── SKILL.md
└── references/
    ├── execution-engines.md
    ├── non-code-execution.md
    ├── review-findings-followup.md
    ├── shipping-workflow.md
    ├── tracker-defer.md
    └── agents/
        └── figma-design-sync.md
```

### 结构判断

当前分支的模块化方向是正确的：execution engine、non-code、review followup、shipping、tracker、Figma prompt 已形成一层 reference owner，比 `master` 把大部分逻辑留在单一 `SKILL.md` 更适合 progressive disclosure。

但当前结构仍有三个问题：

1. Phase 1 与 Phase 2 合计约 294 行，branch/worktree/subagent/commit、test/system-wide/simplify 仍占据大部分热路径；`2026-07-07` slimming plan 规划的 `work-intake-and-task-pack.md`、`execution-strategy.md`、`feedback-and-tests.md`、`implementation-quality.md` 没有落地。
2. 缺少统一 `Reference Trigger Map`、`Owned here / Not owned here` 与 `fallback_if_unread`。当前 reference 主要通过 prose 路径字符串触发，结构 validator 报告中没有可识别的 Markdown reference edge；这不等于 reference 不可达，但说明 package readiness 工具不能证明其 reachability。
3. 删除 eval 和大部分 tests 后，模块化没有配套行为守护；“正文变短”与“保护行为保留”没有形成可验证闭环。

## 核心执行逻辑差异

| 逻辑面 | `master` | 当前分支 | 判断 |
| --- | --- | --- | --- |
| 入口定位 | settled plan、validated task pack、spec path 或 concrete request；明确 unresolved WHAT/HOW、repo ambiguity、stale task pack、scope expansion、generated mirror 不进入 | plan/spec path 或 clear build request；仅显式把 open-ended bug 路由 `spec-debug` | 当前入口更短，但 near-neighbor 与 failure boundary 明显变弱，应恢复 concise contract spine |
| 工件 intake | plan + task pack；task pack identity/hash/schema/semantic posture/per-task review metadata | unified plan readiness + legacy plan；不识别 task pack；上游 plan producer 与 write-tasks 的 `spec_id` 要求也不一致 | 当前 unified plan 更强，但 task-pack 三方 consumer/identity 链断裂，必须整体补齐 |
| plan 读取 | 默认完整读取 plan/task pack | unified plan size-aware section map，Markdown/HTML 对齐 | 当前明显更强，应保留 |
| non-code | 没有独立 carve-out | `execution: knowledge-work` 进入独立 reference | 当前更强，应保留 |
| 执行引擎 | inline / serial / parallel subagents | 增加 goal-mode 与 dynamic-workflow，并区分 tail ownership | 当前更强，但 capability/authorization/isolation 需要重构 |
| worker context | 传完整 work path + unit/task fields | bounded unit packet + Goal Capsule/DoD/Verification/R/F/AE/KTD | 当前更强，应保留 |
| verification posture | test-first/characterization-first 较轻；feedback-loop-first 在前置段 | proof-first/characterization-first、Evidence Strategy、worker evidence、Return-to-Caller evidence | 当前更强；应补 master 的跨类型 smallest feedback loop 与 vertical slice 表述 |
| architecture/minimality | 明确 Minimality + Architecture Fit Preflight、work-phase reuse recheck、future-only abstraction refusal、unauthorized architecture stop-back | 只有 follow patterns、reuse components、phase-boundary simplify | `master` 的核心质量能力丢失，且与最新 `spec-plan` composition contract 不一致 |
| scope/repo/source-runtime | target repo、scope non-expansion、generated runtime exclusion、direct evidence/trust boundary；但仍遗留 create-new-tasks 冲突句 | deterministic `target-repo`/task-pack helper 仍在，work 热路径 consumer 与通用 containment tests 丢失；遗留冲突句仍在 | 接回 prompt consumer 与 tests，复用现有 helper，不重建第二套 CLI |
| simplification | remove-now / minimality-debt / protected / architecture-mismatch 四分类 | consolidate duplicate patterns / extract helpers / efficiency | 当前可能把“简化”误收敛为抽 helper；应恢复分类并吸收 composition-first 思想 |
| review | host-native Tier 1 + `spec-code-review mode:autofix` Tier 2 | 单一 portable `spec-code-review mode:agent` report-only，caller-owned fixes | 当前更清晰、更符合 ownership，应保留；不要恢复旧 tier/autofix |
| residual handling | Tier 2 residual gate、tracker defer、known residuals | review-followup + autonomous/interactive residual gate | 当前更完整；但 artifact path portability 退化 |
| closeout evidence | verification summary、honest closeout、run artifact、completion response、direct evidence、compound suggestion | raw Final Validation + plan status + PR handoff | 当前丢失 structured evidence，且与现存 schema/catalog 冲突 |
| lifecycle | source plan `active → completed`，task pack 更新 source plan | 更严格的 Markdown/HTML/legacy degraded taxonomy + Return-to-Caller candidate | 当前更强，应保留 |
| tests/evals | `spec-work-contracts` 28 cases、`task-pack-command` 48 cases、6 个 prompt examples，以及 invariant/run-artifact/containment/verification tests | 对应 suites 收缩为 7/6 cases，work-local eval 与多条 evidence tests 删除；另有新增 readiness consumer replay 与 lifecycle coverage | execution-semantics 地板明显不足，但不能误写成全部 work coverage 只剩 7 |

一个关键边界是：`master` 有 `reuse / extend` recheck 和 Architecture Fit Preflight，但也没有完整的 `compose / thin-glue` 思想。四姿态与胶水 ownership 不是“把 master 原样迁回”，而是 **master 的执行期 preflight + 当前 `spec-plan` composition contract** 的组合升级。

## 当前分支应明确保留的优势

### 1. Unified plan readiness 与格式无关 consumer

当前 Phase 0 对 `artifact_contract: spec-unified-plan/v1` 执行 duplicate/missing/conflicting metadata fail-closed；区分 `requirements-only`、`implementation-ready`、`execution: code` 与 `knowledge-work`，并拒绝把 `active/completed` 等 lifecycle 值误当 readiness。这比 `master` 的 legacy plan/task-pack intake 更适合当前 `spec-plan`。

### 2. Markdown/HTML size-aware section map

当前长计划先扫描 heading/anchor，只读 Goal Capsule、Verification Contract、Definition of Done、Implementation Units list、active U-ID 和引用的 R/F/AE/KTD。该能力直接支撑当前 unified HTML/Markdown 双格式，不能被 `master` 的 “read completely” 覆盖。

### 3. 执行引擎与 tail ownership

当前把 implementation engine 与 shipping owner 解耦：inline/subagent、goal、dynamic-workflow 只决定怎么实现；standalone 与 Return-to-Caller 决定谁拥有 simplify/review/PR/lifecycle tail。这是比 `master` 更成熟的 orchestration 结构。

### 4. Proof-first / characterization-first evidence

当前不只要求“写测试”，还要求：

- 找到 existing test home；
- 选择 existing failure / update expectation / strengthen over-mocked test / new proof / deliberate no-test exception；
- 行为修改前观察 expected red 或 characterization baseline；
- worker 返回不可从 diff 重建的 observation；
- orchestrator 不伪造 worker 没报告的证据。

这是当前最有价值的实现质量能力，应作为恢复其他边界时的稳定核心。

### 5. Review-only + caller-owned apply

`spec-code-review mode:agent` 只报告，`review-findings-followup.md` 负责 eligibility、batching、fix worker、diff/test/commit，Residual Work Gate 持有未解决项。这比 `master` 的 `mode:autofix` 更符合“reviewer 不拥有 checkout mutation”的职责边界。

### 6. Return-to-Caller 与 lifecycle degraded taxonomy

当前 envelope 明确 scope、U-ID、verification、blockers、behavior change、status candidate/degraded reason，并禁止 caller-owned tail 被 spec-work 提前执行。Markdown `active → completed`、HTML/legacy/read-compatible degraded 分支也比 `master` 更精确。

### 7. Knowledge-work 与 Figma local prompt asset

知识工作不强行走 code shipping；Figma sync 使用 skill-local prompt 初始化 generic subagent，而非依赖 standalone agent type/name。这两项都应保留。

### 8. 并行安全细节与 Frontend Design Guidance

当前并行模型不仅多了 engine，还增加了非文件 contention（shared API、migration、lockfile、environment singleton）、bounded concurrency、abort criteria、actual-tree-not-summary integration，以及 worker 才能见证、无法从 diff 重建的 evidence。当前还新增无 Figma UI 的 responsive/layout/browser verification guidance。这些都应在抽取 `execution-strategy.md` / `feedback-and-tests.md` 时显式保留，不能因吸收 master 而退回只看文件重叠或只做通用 UI 提醒。

## `master` 中丢失或弱化、应吸收的能力

### A. Settled-scope Contract Spine

`master` 第一屏有 When To Use / When Not To Use / Inputs / Outputs / Artifacts / Failure Modes / Workflow / Consumers。它的价值不是“多一段模板”，而是让执行者在进入长流程前知道：

- 什么输入可执行；
- 什么情况必须回上游；
- 哪些 artifacts 是事实；
- 哪些 side effects 需要授权；
- 完成返回应包含什么。

当前 description 和 Introduction 只保留正向触发，导致 task-pack、repo scope、generated runtime、scope expansion 等边界只能依赖外部项目指令或后文零散句子。

**建议：P1 Adopt-adapt。** 恢复 30-50 行以内的 Contract Spine，不复制 `master` 全段；把 hard gate 留在 spine，把细节放 reference。

### B. Validated task-pack executable intake

这是最明确的 P0 断链：

- `skills/spec-write-tasks/SKILL.md` 明确 task pack 是 “optional derived layer between `spec-plan` and `spec-work`”；
- 它允许 `next_action: spec-work-task-pack`；
- 当前 `spec-plan` unified producer 不保证生成 `spec_id`，而 `spec-write-tasks` 明确拒绝没有 `spec_id` 的 source plan，因此 executable pack 在进入 work 之前就可能被 identity gate 阻断；
- 当前 `spec-work` Phase 0 只识别 plan/spec/bare prompt；
- 当前 shipping 又为 “Validated task pack input” 处理 `source_plan` lifecycle；
- 当前 focused tests 只断言 shipping 出现 task pack 文案，不断言 task pack intake、validator 或 Task Cards execution。

**建议：P0 Adopt-adapt。** 新建或恢复 `references/work-intake-and-task-pack.md`，spine 保留：

1. 先对 plan/task-pack identity 做跨三方 KTD：推荐只在跨 plan/task-pack chain 使用窄稳定 identity；要么让 implementation-ready code plan 生成 `spec_id`，要么把 task-pack wrong-chain contract 改为明确的 `source_plan + source_plan_hash` identity，禁止 work 层自行猜测或绕过；
2. 输入分类为 direct unified plan / validated task pack / legacy plan / bare prompt；
3. 在锁定 `target_repo` 后运行 `spec-first tasks validate <task-pack-path> --repo <target-root> --json`，task-pack path 与 source plan 必须从同一 root 或绝对路径解析，不能依赖 parent-workspace cwd；
4. deterministic pass 只证明 identity/hash/structure，不替代 LLM 对 scope、semantic posture 和 task quality 的判断；
5. Task Cards/Execution Waves 决定 execution order，`source_plan` 继续拥有 scope、requirements、non-goals 和 lifecycle；
6. `stop_if`、`review_gate`、`review_focus` 是 bounded execution/review intent，不是 progress/approval state；`review_gate: required` 必须用当前 `mode:agent` report-only 模型在 task 完成/提交/下一 wave/Phase 3 前执行 bounded review，或返回明确 handoff，不能只把字段抄进 worker prompt；
7. invalid/stale/wrong-chain pack fail closed，不静默退化为 legacy plan。

这里必须区分两类 authorization：task-pack envelope 的 `dispatch_authorization` 管 `spec-write-tasks → spec-doc-review` 的 bounded continuation；`spec-work` 内部 worker/subagent 是否可派发是另一条 `worker_dispatch_authorization`/host capability 合同。二者不能复用同一个字段或把 `not_required` 误判为不能执行 task pack。

### C. Work-phase Architecture / Composition Recheck

`master` 已完成的 `Minimality + Architecture Fit Preflight` 要求在新增 dependency、file、abstraction、configuration、helper、wrapper、public contract、schema/runtime/config/source-of-truth/provider boundary 前检查：scope need、existing capability、future-only abstraction、architecture evidence、authorization boundary。

最新当前分支 `spec-plan` 又进一步把架构姿态升级为：

```text
inventory → reuse → extend → compose / thin-glue → new
```

并在 `skills/spec-plan/references/planning-evidence-boundaries.md` 明确写出：`spec-work` 在 `compose / thin-glue` 或 `new` 前必须 recheck current source；当前 source 变化时，应优先当前有效的 reuse/extend/compose path，并用 direct evidence 解释 material deviation。

当前 `spec-work` 没有 `compose / thin-glue`、source ownership、future-only abstraction、wrong-owner reuse 或 architecture stop-back 语义。consumer replay 只分别确认 plan fixture 的 Planning Contract 含 `compose / thin-glue`，以及 work prompt 声明会建立 section map、读取 active U-ID 引用的 KTD；它没有证明 work 会选择 Planning Contract 或执行 composition recheck。

**建议：P1 Extend + Compose。** 这是高价值 architecture attention prompt，不是脚本 gate；在 `spec-work` 增加 execution-time Architecture Recheck，内容应是：

- 先盘点当前 source 中已有 capability、owner、extension point 和 consumer；
- `reuse`：现有 contract 已满足；
- `extend`：现有 owner 确实拥有边界且扩展后仍 cohesive；
- `compose / thin-glue`：参与者继续持有各自真相，胶水只拥有 translation、sequencing、failure/degradation routing、observability/evidence aggregation；
- `new`：当复用/扩展/组合会混合职责、扭曲 contract、制造双真相源或隐藏耦合时建立新边界；
- 禁止无价值 wrapper、第二套平行 pipeline、复制 domain truth/business policy/durable state/validation rules 的“胶水”；
- 同时禁止 forced reuse：错误 owner 不应为了少建文件而吸收不相关职责；
- plan 没授权 public contract、cross-module abstraction、schema/runtime/config/source-of-truth/provider boundary 时停回 `spec-plan`，不能由 executor 自我授权；
- 只有 material deviation 才记录 compact decision note，普通小改保持安静。

这正是用户所说的“胶水编程、复用、扩展等架构思考”在 work skill prompt 中的落点：它不是再增加一张复用表，而是改变 executor 选择实现形态的决策顺序与 ownership 判断。

### D. Scope / Target Repo / Source-Runtime Boundary

`master` 明确：parent workspace 不能按 cwd 猜写入 repo；scope expansion 不能在执行中静默吸收；generated runtime mirror 不能当 source 修。

master 与当前正文都遗留 “Create new tasks if scope expands”；差异是 master 同时有更高显著性的 non-expansion/stop anchors，当前迁移删除了 corrective anchors 却保留冲突句。当前 Phase 1 branch setup 也没有先核对 dirty overlap、target repo、source owner，就进入 rename/pull/branch/worktree 讨论。deterministic target-repo helper 并未消失，缺的是 work 热路径 consumer 和对应回归测试。

**建议：P0 Adopt-adapt。** 在任何 write/test/review-fix/commit 之前：

- 明确单一 `target_repo` 或 per-task repo scope；
- 读取并保护当前 dirty changes，不能把用户已有 diff 纳入本 task；
- 计划外的新 file/consumer/risk 默认记录 follow-up，不自动新建 in-scope task；
- generated runtime 只可用于诊断，source fix 回 canonical owner/generator；
- 若 scope expansion 改变 architecture、public contract、acceptance 或 source ownership，返回 `spec-plan`/task-pack regeneration；
- 若只是完成原 scope 必须的 discovered file，可在 direct evidence 支撑下补入 actual changed set，并在 closeout 解释。

### E. Feedback Loop And Vertical Slices

当前 proof-first 对行为代码很强，但 `master` 的 smallest feedback loop 更宽：CLI invocation、HTTP/browser script、trace replay、docs contract、schema validation、diff-shape check 都可作为观察当前 slice 的方式；无法建立 loop 时记录具体缺口。

**建议：P1 Extend。** 不改当前 Evidence Strategy，而是在其前加一条通用原则：先建立最小可观察 loop，按 vertical slice 完成 implementation + verification + docs/handoff，再进入下一 slice。docs/config/schema/UI/manual-only 任务使用适合自己的反馈面，不强行 TDD，也不能无证据声称 verified。

### F. Minimality / Simplification 四分类

当前 Simplify As You Go 只提示 consolidate duplicates、extract helpers、improve reuse/efficiency，容易把“简化”误解为继续抽象。

`master` 的四分类更安全：

- `remove-now`：删除本轮 dead/duplicate/speculative surface；
- `minimality-debt`：真实但超 scope 的问题进入既有 residual/deferred sink；
- `protected`：安全、数据完整性、a11y、observability、required verification 不因 LOC 下降被删除；
- `architecture-mismatch`：错误 layer/owner/source-runtime/coupling 在 scope 内修；需要新决策则 stop-back。

**建议：P1 恢复完整分类，并与 W-P1-01 的 Architecture Recheck 共用 owner。** 不新增 minimality subsystem/schema；放进 `implementation-quality.md` 或主 spine 的单一 STOP anchor，避免重复 owner。

### G. Structured Verification And Run Evidence

`master` shipping 会：

1. 用 verification profile 解析 candidate checks；
2. 记录实际 command outcomes 到 `verification-run-summary.v1`；
3. 用 `honest-closeout` 验证 claim-to-evidence refs；
4. 在 task-pack、not-run validation、deferred follow-up 或 substantive work 等 trigger 命中时写 `spec-work-run-artifact/v2`；
5. final response 报 artifact path 或明确 reason code。

当前分支移除了全部 active consumer prose 和相关 tests，但保留：

- `src/cli/helpers/spec-work-run-artifact.js`
- `src/cli/helpers/verification-run-summary.js`
- `src/cli/helpers/honest-closeout.js`
- `docs/contracts/workflows/spec-work-run-artifact.schema.json`
- `docs/contracts/verification/verification-run-summary.schema.json`
- `docs/contracts/workflows/honest-closeout.schema.json`
- runtime catalog 中 `workflow_integrated=true` 声明

这不是“能力退役完成”，而是 producer/schema/catalog 仍在、workflow consumer/test 被删除的 orphaned deterministic capability。

**建议：P0 二选一，推荐 A。**

- **A — Reintegrate（推荐）**：把最小 closeout glue 恢复到 shipping reference，复用现有 helper，不复制 `master` 140 行细节；恢复 fixture-backed integration test、producer/unit tests 和 workflow invariant。
- **B — Honest downgrade**：如果产品决定 CE-first work 不再写 run artifact，则把 schema/catalog 的 `workflow_integrated` 改回 false，并明确 producer-only/degraded。不能继续保留 true。

鉴于本项目角色契约强调 Codebase → Spec → Plan → Tasks → Code → Review → Knowledge 的证据闭环，A 与系统定位更一致。

### H. Completion Response、Changelog/Release Boundary 与 Artifact Path

`master` 有三个当前丢失但成本很低的 closeout 保护：

1. Completion Response Contract：Completed / Verification / Review / Artifacts / Next action；not-run/degraded 必须带 reason。
2. Changelog/release path check：新引用的 repo-relative artifact 如果仍 untracked，不能声称 shipped。
3. tracker defer 使用 review 返回的 `<artifact-path>`，不硬编码 `/tmp`。

当前 `shipping-workflow.md` 和 `review-findings-followup.md` 又恢复了 `/tmp/spec-first/spec-code-review/<run-id>/` 假设；`master` 已明确修过 Windows `%TEMP%` 与 parent-owned artifact path。当前测试也不再守这一点。

**建议：P1 Adopt。** 恢复这三个窄合同，并以 `spec-code-review` 返回的 `artifact_path` 为唯一权威。

### I. Direct Evidence、Recall Trust 与 Context Economy

`master` 明确：provider/graph/learning 是 advisory pointer；current source/test/log 才能支撑 implementation claim；summary-first、bounded read、run-local context ledger 避免重复加载。

当前 unified plan section map 已覆盖大部分 context economy，但没有：

- plan/learning 中的历史结论必须回源；
- provider candidate 不能当 scope authority；
- material deviation 的 evidence/limitation 应进入 closeout；
- source/runtime/governance 目录默认排除。

**建议：P1 Compose。** 保留当前 section-map，不恢复 master 大段治理 prose；在 intake/implementation-quality/closeout 各保留一个短 anchor，把详细 trust/context rules放一层 reference。

### J. Contract / Eval / Invariant Regression Floor

当前 `spec-work-contracts` 的 7 tests 全绿，但只覆盖 readiness、metadata fail-closed、review ownership、Return-to-Caller/lifecycle 等少数新架构。`master` 的 28 cases 保护的 task-pack、scope、minimality、run artifact、shipping response、changelog reference、tracker portability、subagent isolation、handoff 等行为大部分没有替代测试；`task-pack-command` 也从 48 cases 收缩为 6。当前新增的 `plan-status` helper/integration、`spec-lfg` contract 和 plan consumer replay 是有效替代覆盖，但只保护 lifecycle/readiness，不闭合 execution semantics。

`2026-07-07` slimming plan 明确要求：内容迁移时把测试改为 “spine trigger + reference owner”，不得通过删除 assertions 恢复绿色；每个 moved reference 至少有 trigger/non-trigger case，hard gate 需要 contract assertion 或 fresh-source eval。当前 CE-first migration 与这项 active plan 的质量 gate 相反。

**建议：测试与每项能力同 wave 落地，不把 regression floor 留到最后。** P0 断链对应的 task-pack/run-evidence/containment/invariant tests 是 P0 DoD；architecture/anti-rationalization/eval 属 P1。按 owner 拆为：

- `spec-work-intake-contracts.test.js`
- `spec-work-execution-strategy-contracts.test.js`
- `spec-work-implementation-quality-contracts.test.js`
- `spec-work-shipping-contracts.test.js`
- `spec-work-consumer-chain-contracts.test.js`
- `workflow-invariant-lens.test.js` + fixtures

同时恢复 `task-pack-command` 的 wrong-chain/path/wave/dependency/review_gate/target_repo/stop_if cases，以及 verification-profile/run-summary/honest-closeout/run-artifact/target-containment integration tests。当前 AI quality gate 未覆盖这些被删 suites，也要同步补入口。maintainer-only eval cases 保持小而聚焦；`evals/**` 不进入 runtime projection。

### K. Scenario Capability 高风险安全锚点

当前 `docs/contracts/workflows/scenario-capability-matrix.md` 仍把 `spec-work` 列为 high-risk consumer，并要求：

- foreign-residual workspace → `blocked-action-required`，在 clean/init 或用户显式接受 degraded evidence 前不得写入、autofix、commit 或作 PR-ready claim；
- optional external-tool evidence unavailable → `fallback-only`，只用 direct source/test/log 支撑有限结论；
- non-git build workspace 且 git alignment broken → `partial`，限定到 covered roots 或直接检查 uncovered modules。

当前 work prompt 已无这三个 override 的 consumer anchor。**建议：P0 恢复一条短 STOP pointer + focused test，细节继续由共享 contract 拥有。** 由于 debug/code-review 也丢失对应声明，跨三 skill 的完整修复必须显式列为 shared-contract unit，不能在单一 work 方案里无声扩 scope。

### L. Anti-Rationalization Attention Prompt

`2026-06-15-001` 已完成的 work-specific 红旗表用于阻止 fake completion、跳验证、把 scope creep 合理化、把 orphan/residual 当完成等常见失败模式。当前 work section、共享 pattern 和 drift guard 均已删除。

**建议：P1 恢复窄表或等价 compact red flags。** 它是 attention hardening，不是 hard gate；应与 current honest evidence、scope non-expansion、review residual 和 lifecycle semantics 对齐。work 可先恢复本地 consumer，跨 debug/review 的共享合同恢复需另列 scope。

## 当前确认的问题、来源与影响

| ID | 优先级 | 差异来源 | Confirmed finding | 直接证据 | 影响 |
| --- | --- | --- | --- | --- | --- |
| F1 | P0 | cross-workflow drift | `spec-plan` 不保证产 `spec_id`，`spec-write-tasks` 却要求 source plan 有 identity | `plan-sections.md` producer metadata vs `execution-handoff-contract.md` missing-spec-id gate | task pack 在到达 work 前就可能无法成为 executable |
| F2 | P0 | current regression | task-pack 入口缺失，shipping 却处理 task-pack lifecycle | `spec-write-tasks/SKILL.md` vs 当前 work Phase 0 / shipping 5.1 | Plan → Tasks → Code 形成“尾部承认、入口不消费” |
| F3 | P0 | current regression | required per-task review gate 只剩 metadata，没有 work consumer | completed `2026-05-11-006`、task-pack review fields、当前 work 零 intake | 高风险 task 只能等最终全量 review 才暴露问题 |
| F4 | P1 | synthesized improvement | plan composition KTD 与 work section-map 是两条未闭合事实，没有 architecture consumer | `planning-evidence-boundaries.md` 要求 recheck；当前 work 无 compose/thin-glue | plan 的胶水/ownership 决策可能在实现时丢失 |
| F5 | P0 | current regression | schema/catalog 声明 run artifact integrated，active work 零调用 | schema/catalog `workflow_integrated=true`；`skills/spec-work/**` 零引用 | 对外 capability 声明不可信，证据闭环断裂 |
| F6 | P0 | shared defect amplified by current regression | 两端都有 create-new-tasks 冲突句，但当前丢失 non-expansion corrective anchors | master stop anchors + 两端 Track Progress | executor 更容易静默扩大 diff |
| F7 | P0 | current enhancement defect | task-pack handoff dispatch 与 work worker dispatch 概念混淆风险，worker authorization/capability 未正交表达 | write-tasks bounded doc-review continuation vs work structured-plan prefer-subagents | 无法安全区分可执行 pack、可派 worker 与可并行 |
| F8 | P0 | shared host-assumption defect | Codex fork/isolation 假设不可靠 | 当前 prompt 写 forked workspace；本轮宿主明确共享同目录 | overlapping writes 可能丢失或污染 |
| F9 | P0 | current internal conflict | worker commit ownership 自相矛盾 | current line 177 orchestrator owns commit；line 302 isolated workers may commit | staging/commit/test ownership 不确定 |
| F10 | P0 | shared landing defect | standalone tail 默认 commit/push/PR，缺少 side-effect authorization gate | current 与 master shipping tail | 普通实现请求可能被扩大为外部副作用 |
| F11 | P1 | current regression | review artifact path 重新硬编码 `/tmp` | current shipping/review-followup/tracker vs master `<artifact-path>` | Windows/alternate temp root/parent-owned artifact 失败 |
| F12 | P0/P1 | current regression | execution-semantics tests/evals 大幅收缩 | spec-work 28→7、task-pack 48→6，evidence/invariant/containment suites deleted | 当前绿色不能发现 P0 断链；P1 prompt 演化也缺漂移守护 |
| F13 | P1 | current regression | simplify 只强调 extract helper/reuse | current Phase 2 Step 5 | 可能用更多抽象实现“简化” |
| F14 | P0 | current regression / shared-contract dependency | Scenario Capability contract 仍在，work high-risk overrides 已无 consumer | `scenario-capability-matrix.md` vs current work | foreign residual / non-git build / optional evidence 场景可能越权声明或写入 |
| F15 | P1 | current regression / shared-contract dependency | Anti-Rationalization work red flags 与 drift guard 被删除 | completed `2026-06-15-001`、current source/test absence | fake completion、skip validation、scope creep 缺少低成本 attention hardening |

## 应吸收清单（按优先级）

### 优先级定义

- **P0**：active consumer 链断裂、安全/写入边界缺失、或公开 capability truth 与 active source 不一致；必须在对应功能声称完成前关闭。
- **P1**：显著影响实现质量、诚实 closeout、可维护性或跨平台稳定性的 prompt/contract 能力；不是 hard gate，但应在本轮质量升级中交付。
- **P2**：信息架构、统计稳定性与 field observation；在 P0/P1 contract 稳定后推进。

测试不是独立尾部功能：每个 W-ID 的 deterministic/semantic test 与该项同 wave 落地。P0 test gap 是对应 P0 的 DoD，不能排到最后一个“测试 wave”。

### P0 — 合同断链、安全与 capability truth

| 编号 | 标题 | 来源姿态 | 建议 |
| --- | --- | --- | --- |
| W-P0-01 | 闭合 task-pack identity / intake / required-review 三方合同 | Compose current upstream + adopt-adapt master | 先定窄跨工件 identity；按 `--repo <target-root>` 验证；消费 Task Cards/Waves/stop_if；用当前 `mode:agent` 模型执行 `review_gate: required` |
| W-P0-02 | 恢复 run-evidence consumer，或诚实降级 schema/catalog | Adopt master, reuse current deterministic owners | 推荐 reintegrate verification summary + honest closeout + conditional run artifact；不得重造第二套 helper |
| W-P0-03 | 恢复 target-repo/source-runtime/scope + Scenario Capability safety anchors | Adopt-adapt master + current shared contract | 写前锁 repo/dirty/source owner；删除未受约束的 scope expansion；runtime mirror 不作 source fix；foreign residual/non-git/optional evidence 按共享 contract degrade/stop |
| W-P0-04 | 重构 worker dispatch / isolation / commit / landing authorization | Fix shared/current defects while keeping current engines | handoff dispatch 与 worker dispatch 分离；授权/能力/隔离正交；未知 isolation 默认 shared-dir；worker commit owner 单一；commit/push/PR 需明确授权 |
| W-P0-05 | 为 P0 恢复同步 regression floor | Redesign, do not copy snapshots | task-pack 6→关键矩阵、run-summary/honest-closeout/run-artifact/containment/invariant integration、quality-gate registration 与 negative/degraded cases同项落地 |

### P1 — 高价值质量增强

| 编号 | 标题 | 来源姿态 | 建议 |
| --- | --- | --- | --- |
| W-P1-01 | 增加 work-phase `reuse / extend / compose / new` recheck | Extend current plan + absorb master preflight | 胶水 ownership、failure/degradation/evidence、anti-wrapper、wrong-owner reuse、future-only abstraction、unauthorized architecture stop-back |
| W-P1-02 | 恢复 concise Workflow Contract Summary | Adopt-adapt master | 入口、输出、failure、artifacts、consumers 一屏可见 |
| W-P1-03 | smallest feedback loop + vertical slice | Extend current evidence strategy | 覆盖 CLI/browser/docs/schema/config/manual-only，不只 unit test |
| W-P1-04 | restore simplify classification | Adopt master | remove-now / minimality-debt / protected / architecture-mismatch；保留 current `spec-simplify-code` 独立 pass |
| W-P1-05 | 恢复 Anti-Rationalization red flags | Adopt completed intent, rewrite for current contracts | 防 fake completion、skip validation、scope creep、orphan/residual 合理化；仅 attention，不变 gate |
| W-P1-06 | Completion Response Contract | Adopt master | 明确 Completed/Verification/Review/Artifacts/Next action 与 not-run/degraded reason |
| W-P1-07 | Changelog/release path shipping-boundary check | Adopt master | untracked referenced artifact 不得被声称 shipped |
| W-P1-08 | review artifact path portability | Adopt master | 只消费 review 返回的 `artifact_path`，去掉 `/tmp` authority |
| W-P1-09 | evidence/learning/provider trust + compact decision context | Compose | 计划/solution/provider 只作 advisory pointer；material claim 回 current source/test/log；只有 material deviation 记 decision note |
| W-P1-10 | plan-path task-pack suitability | Adopt-adapt master | 高复杂 direct plan 可建议 `spec-write-tasks`，但不默认编译、不阻断直接 work，避免只支持“已有 pack” |
| W-P1-11 | architecture consumer semantic coverage | Extend current consumer replay | 机械测试锁 prompt trigger/owner；fresh-source case 验证 work 真的读取并执行 compose/new/owner/failure semantics |

### P2 — 后续观察与增量完善

| 编号 | 标题 | 建议 |
| --- | --- | --- |
| W-P2-01 | progressive disclosure 完整落地 | P0/P1 可先建立其必要 owner reference；待语义稳定后完成 execution/feedback 等剩余下沉、Trigger Map/owner/fallback 与重复清理，不以行数替代能力验收 |
| W-P2-02 | compound suggestion | 保持 advisory、用户选择、非 completion gate；先恢复可信 closeout 再讨论 |
| W-P2-03 | statistical fresh-source stability | P0/P1 source 稳定后按 N×模型×前后对照执行；未运行时保持明确 not_run |
| W-P2-04 | field outcome / adoption feedback | 观察 3+ 次真实 work run 的 reference miss、scope drift、wrapper/parallel-pipeline、evidence gaps |

## 推荐目标信息架构

### `skills/spec-work/SKILL.md`：Contract Spine

建议保留约 260-340 行的高显著性主干：

1. Description / Introduction
2. Workflow Contract Summary
3. Reference Trigger Map
4. Phase 0：unified plan / task pack / legacy / bare / knowledge-work triage
5. Hard boundary anchors：target repo、scope non-expansion、source/runtime、Scenario Capability、worker dispatch/isolation、landing authorization、verification-before-complete
6. Phase 1 skeleton：read/map work document、create tasks、choose engine/strategy
7. Phase 2 skeleton：vertical slice、architecture recheck、evidence、integration、progress
8. Phase 3-4 STOP pointer
9. Return-to-Caller envelope
10. Compact principles/pitfalls

### 条件 references

| Reference | Owner | Trigger | 未读 fallback |
| --- | --- | --- | --- |
| `work-intake-and-task-pack.md` | unified/legacy/task-pack intake、跨工件 identity、validator、required review 与 handoff failure | 输入为文件、blank discovery、task pack、高复杂 direct plan | 不执行 task pack；返回 identity/validator/handoff |
| `execution-strategy.md` | branch/worktree/task tracker/worker dispatch/parallel/commit/landing ownership | 要选择 workspace、dispatch、commit、push/PR | 默认 inline；不并行；不 commit default branch；不 push/PR |
| `feedback-and-tests.md` | loop、proof/characterization、scenario、system-wide | behavior/testing/coverage claim | 只跑最窄已知验证，不声称 coverage |
| `implementation-quality.md` | architecture recheck、reuse/extend/compose/new、simplify、anti-rationalization | durable surface/abstraction/adapter/wrapper/orchestrator/integration seam，或 completion/scope 合理化信号 | 不新增未授权 durable surface，返回 `spec-plan`；不声称完成 |
| `execution-engines.md` | goal/dynamic/inline engine | implementation-ready unified code plan 且非 legacy/bare | inline |
| `non-code-execution.md` | knowledge-work | `execution: knowledge-work` | 不进入 code lifecycle |
| `review-findings-followup.md` | caller-owned fixes | review 已完成且有 actionable findings | 不重复 review；保留 residual |
| `shipping-workflow.md` | simplify/review/structured verification/run artifact/lifecycle/authorized landing | Phase 2 scope 完成 | 不声明 complete、不写 lifecycle、不 push/PR |
| `tracker-defer.md` | durable tracker filing | 用户/automation 选择 defer | structured no_sink，不丢 finding |

所有 reference 保持一层深，并在开头声明 `Owned here`、`Not owned here`、`Trigger`、`Fallback if unread`。Reference pointer 使用可被 validator/projection 检查的标准 Markdown link，而不是仅靠裸路径字符串。

## Adopt / Extend / Compose / New / Defer 决策

| 能力 | 决策 | 理由 |
| --- | --- | --- |
| unified plan readiness / HTML section map | Extend current | 当前是 canonical consumer contract |
| knowledge-work carve-out | Keep current | master 无等价能力 |
| proof/characterization evidence | Extend current | 当前行为证据更强 |
| goal/dynamic engines | Keep current, fix capability rules | engine 架构有价值，宿主假设需收敛 |
| task-pack identity/intake/review gate | Compose, not direct copy | active upstream consumer 仍存在，但 current plan identity 与 write-tasks gate 先要对齐；review gate 要适配 report-only review |
| architecture/minimality preflight | Compose master + current spec-plan | master 有 execution fit，current plan 有 composition-first 新姿态 |
| target repo/source-runtime/scope | Adopt-adapt master | mutation hard boundary，不能只依赖模型自觉 |
| Scenario Capability override | Adopt current shared contract | contract 仍 active，work consumer 被迁移删除；只恢复短 anchor，不复制矩阵 |
| run evidence | Adopt master consumer, reuse current CLI | existing deterministic owner 已存在，不应重建第二套 |
| Anti-Rationalization | Adopt completed intent, rewrite | 低成本 attention hardening；非 gate，需对齐当前 evidence/scope/lifecycle |
| User-Facing Handoff Contract | Adopt-adapt | invalid identity/intake/scope/source/runtime 时返回 copy-ready upstream action；与 current Return-to-Caller 分工，不建第二套 envelope |
| domain language / decision ledger | Compose compactly | 仅 material implementation deviation 或 domain ambiguity 时记录；普通 unit 不填表 |
| context-bundle / artifact-summary pipeline | Defer as subsystem | 保留 section-map、bounded unit packet 和 closeout evidence；无明确 consumer 前不恢复独立 bundle pipeline |
| review tier/autofix | Do not adopt | current report-only/caller-owned 更清晰 |
| tracker artifact path | Adopt master fix | current `/tmp` 是已知回归 |
| old eval corpus | New focused corpus | 原样复制不能覆盖 unified/HTML/goal/composition |
| old 579-line monolith | Do not adopt | progressive disclosure 方向正确 |
| team standards / retired paths | Defer/drop | 已不属于当前 source contract |

## 不应回迁的旧机制

| 机制 | 不回迁原因 | 当前正确替代 |
| --- | --- | --- |
| `mode:autofix` review | reviewer mutation ownership 已被当前 caller-owned apply 替代 | `mode:agent` + review followup |
| host-native Tier 1 / Tier 2 数值升级表 | review skill 已 self-size，重复判断会形成两套 truth | 单一 `spec-code-review` + explicit `depth:full` |
| direct plan 全文必读 | 与 unified plan/HTML/long-plan context economy 冲突 | section map + active unit refs |
| Markdown-only assumptions | 当前支持 Markdown/HTML exclusive artifact | 保留 format-neutral headings/anchors |
| 每份 direct plan 强制 `spec_id` | 同文件 unified lifecycle 不需要跨工件 identity | 仅 task-pack chain 使用 `spec_id`/hash |
| 旧 team-standards 路径与固定标准文件 | 当前已退役，回迁会产生 stale runtime dependency | active host/project instructions + current source/docs/contracts |
| 大段 Scenario Capability / provider prose 原样复制 | 会重新膨胀热路径 | spine 短 anchor + conditional reference |
| 旧 eval 文本原样恢复 | 场景与当前 unified/HTML/engines 不匹配 | 新 positive/negative/degraded corpus |
| 任何硬编码 Codex/Claude isolation 能力 | 本轮已证明实际宿主可不同 | capability probe + conservative fallback |

## 落地矩阵与顺序

| W-ID | 主要 owner / scope | 依赖 | Wave | Deterministic evidence | Semantic / host evidence |
| --- | --- | --- | --- | --- | --- |
| W-P0-01 | `spec-plan` metadata KTD、`spec-write-tasks` identity/handoff、`spec-work` intake reference、task-pack CLI/tests | 先决定窄跨工件 identity；锁定 target repo | 0 | plan/task-pack fixtures；`tasks validate --repo`；wrong-chain/stale/path/wave/dependency/required-review tests | valid/invalid pack fresh-source intake；required mini-review handoff |
| W-P0-02 | current run-summary/honest-closeout/run-artifact helpers/contracts + `shipping-workflow.md` | 无；推荐 reintegrate，不重写 helper | 0 | helper/unit/integration、workflow invariant、catalog truth、quality-gate registration | closeout 不把 missing/not-run evidence 声称 verified |
| W-P0-03 | work spine、existing target-repo helper、Scenario Capability shared contract、containment tests | target repo 必须早于 write/test/review-fix | 0 | parent-workspace、runtime mirror、scope expansion、foreign residual/non-git fixtures | degraded/stop handoff 是否清晰且不越权写入 |
| W-P0-04 | current `SKILL.md` execution block（后续可迁 `execution-strategy.md`）；不修改 host primitive | W-P0-03 repo/dirty boundary | 0 | authorization/capability/isolation matrix、shared-dir collision、commit/push/PR negative tests | real host probe；共享目录下自动串行/inline |
| W-P0-05 | 上述各 owner 的 tests/evals/quality-gate entries | 与 W-P0-01..04 同步 | 0，贯穿 | 每项 positive/negative/degraded case；不得靠删除 assertion 变绿 | 不单独声称行为改善 |
| W-P1-01/04/05 | `implementation-quality.md` + spine trigger | P0 scope/authorization 稳定 | 1 | trigger/non-trigger、future-only、protected/mismatch、red-flag presence | reuse/extend/compose/new paired cases；小改不输出仪式化说明 |
| W-P1-02/03/09/10 | spine、intake/feedback references | W-P0-01 intake owner | 1 | Contract Summary/trigger/ref reachability、plan suitability、feedback fallback tests | CLI/browser/docs/schema/manual slices 的反馈选择质量 |
| W-P1-06/07/08 | `shipping-workflow.md`、review followup、tracker | W-P0-02 closeout truth | 1 | completion shape、untracked path、returned artifact path portability | final response 准确区分 passed/not-run/degraded |
| W-P1-11 | consumer replay + fresh-source eval assets | W-P1-01 source 稳定 | 1 closeout | mechanical trigger/owner/fixture checks | work 实际读取并执行 composition decision；单次 pass 不等于稳定 |
| W-P2-01 | 主 spine + 一层 references | P0/P1 行为合同稳定 | 2 | owner/trigger/fallback/reachability、source/runtime projection、line/token outcome bundle | reference miss/noise paired eval |
| W-P2-02..04 | compound suggestion/eval/field observation | P0/P1 已真实运行 | 2+ | 结构与 reason-code 记录 | N×模型 paired eval、3+ 次真实 run observation |

### Wave 0 — 先修 active contract drift

1. 同时关闭 task-pack identity/intake/required review、run-evidence truth、repo/source/scope/scenario safety、dispatch/isolation/landing ownership。
2. 每一项同提交或同 implementation unit 补自己的 deterministic tests；不存在“功能先上、Wave 3 再补 tests”。
3. 保留 current unified readiness、bounded section map、proof evidence、actual-tree integration、review-only/caller apply 和 lifecycle。

### Wave 1 — 恢复实现质量与诚实 closeout

1. 在 P0 owner 稳定后接入 architecture/composition、feedback/vertical slice、simplify、anti-rationalization。
2. 恢复 Completion Response、Changelog shipping boundary 和 artifact path portability。
3. 建小型 current-shape eval corpus并运行明确授权的 fresh-source paired evaluation；机械 fixture 不能替代行为证据。

### Wave 2 — 再做 prompt 分层

1. 按 `2026-07-07` 方案完成尚未下沉的 execution/feedback 等 reference，统一 intake/implementation owner、Reference Trigger Map 和 fallback。
2. 验证 total source delta、active body delta、reference reachability 和 runtime projection；不能只用主文件行数证明收益。
3. 最后观察 field runs，再决定 compound suggestion、统计稳定性或进一步拆分。

## 建议验证矩阵

### Deterministic contract tests

| Case | 必须证明 |
| --- | --- |
| requirements-only unified plan | fail closed 到 `spec-plan` enrichment |
| implementation-ready Markdown/HTML | section map + active unit refs |
| source plan missing cross-artifact identity | 按已选 KTD 补 identity 或明确拒绝 executable pack，不由 work 绕过 |
| valid task pack in parent workspace | `tasks validate --repo <target-root>` pass 后按 Task Cards/Waves 执行，source plan 为 scope/lifecycle owner |
| stale/hash/spec mismatch task pack | 修改前停止，输出 copy-ready handoff |
| task `review_gate: required` | 在 task commit/next wave/Phase 3 前完成 bounded `mode:agent` review 或明确 handoff；不把 review 当 progress state |
| high-complex direct plan | 可建议 `spec-write-tasks`，但不默认编译、不阻断用户选择 direct execution |
| parent workspace no target repo | write/test/review-fix/commit 全部阻断 |
| generated runtime hit | 回 canonical source/generator，不把 mirror 当 fix |
| scope expansion | follow-up/return upstream，不静默 create in-scope task |
| foreign residual workspace | clean/init 或显式 degraded acceptance 前阻断写入/commit/PR-ready claim |
| non-git build partial coverage | 限定 covered roots 或直接检查 uncovered modules，披露 limitation |
| compose/thin-glue KTD | recheck participants、glue ownership、failure/degradation/evidence |
| future-only wrapper | 拒绝或返回 plan，不新增 abstraction |
| wrong-owner reuse | 允许 justified new boundary，不以“复用”为 quota |
| shared workspace no isolation | 只允许 disjoint writes，worker 不 stage/commit/full-test |
| task-pack handoff dispatch not required/missing | 不影响 valid pack 的 ordinary work intake；只约束 write-tasks→doc-review continuation |
| no worker dispatch authorization/capability | inline fallback，不能自动 spawn；不得伪称 isolation |
| no landing authorization | 不 push/PR；返回 verified handoff |
| review artifact path | 只使用 returned `artifact_path`，无 `/tmp` 权威 |
| run evidence trigger | producer 写 artifact 或返回明确 no-trigger/failure reason |
| untracked changelog ref | 不允许 shipped/commit/PR claim |

### Fresh-source semantic cases

在用户明确授权独立 reviewer 后至少覆盖：

1. 一个已有 capability 可直接 reuse；
2. 一个 existing owner 应 extend，拒绝平行 abstraction；
3. 两个 capability 应 compose，胶水只拥有 translation/sequencing/failure/evidence；
4. 一个 forced reuse 会混合职责，因此 justified `new`；
5. 一个未来假想 consumer 诱导 wrapper，executor 拒绝；
6. 一个 plan 外架构变化诱导“顺手做”，executor stop-back；
7. 一个 trivial docs-only change，不输出长 architecture note；
8. 一个 shared-workspace multi-unit plan，没有 isolation 时自动串行/inline。

Fresh-source 结果必须区分 structural-only、fresh-semantic、host observation、field outcome；单次 pass 不得声称稳定。

## 风险与反模式

| 风险 | 防护 |
| --- | --- |
| 把 master 全量粘回，主 prompt 再次膨胀 | 只恢复 spine anchor 与一层 reference owner |
| 为 architecture recheck 新建 schema/CLI | 保持 LLM semantic judgment；scripts 只提供 source/path/hash facts |
| 把 composition 变成强制偏好 | 保留 justified new boundary 与 wrong-owner reuse escape hatch |
| 胶水层变成新 domain service | 明确 glue 可拥有/禁止拥有的职责 |
| task pack 变第二份 plan/progress state | source plan 保持 scope/lifecycle truth，task pack 只拥有 derived execution order |
| 为修 task pack 随意恢复全局 identity | 先做跨工件 KTD；direct same-file lifecycle 不额外承担 identity ceremony，task-pack chain 才使用窄 identity |
| 修 tests 变成恢复长字符串快照 | 按 protected behavior、owner、negative boundary 写断言 |
| run artifact 恢复后每次都强写 | 继续使用 durable trigger + reason code，不变成全局状态机 |
| engine capability 继续硬编码宿主 | authorization/capability/isolation 三轴独立探测，默认保守 |
| review/PR tail 扩大用户授权 | gate side-effect exits，quality thinking 不受限 |
| fixture pass 冒充能力改善 | closeout 明确 evidence level 与 not-run |

## 对预期提升的判断

本文使用五级证据口径：`source instruction`（prompt 写了什么）→ `mechanical contract`（schema/test/fixture 可机械确认）→ `fresh semantic`（独立 clean-context 行为）→ `host observation`（真实宿主工具/隔离/side effect）→ `field outcome`（多次真实任务效果）。较低层不能替代较高层。

| 提升 | 预期结果 | 证据成熟度 |
| --- | --- | --- |
| Plan → Tasks → Code 连续性 | validated task pack 可真正进入 work，不再绕过 identity/validator/required review | source instruction + mechanical contract 可确认；真实运行待 host observation |
| 架构实现质量 | 减少无价值 wrapper、平行 pipeline、wrong-owner extension 和 domain-heavy glue | source instruction/fixture only；需 fresh semantic 与 field outcome |
| 复用与扩展能力 | prompt 明确要求 executor 在 current source 上 recheck reuse/extend/compose/new | source instruction 可确认；不能据此声称 executor 已稳定执行 |
| Scope 稳定性 | 计划外发现进入 follow-up/return upstream，不静默扩大 diff | source instruction + negative mechanical contract；真实遵守待 semantic/field |
| 并行安全 | dispatch 有授权、isolation 可证、commit/test ownership 单一 | source/mechanical matrix + host observation |
| 完成声明可信度 | tests/review/artifacts/not-run reason 与最终 claim 对齐 | helper 只能校验调用方提供的结构与引用；真实命令执行和如实 capture 仍需 host observation |
| 跨平台稳定性 | 不再依赖固定 `/tmp`、Codex fork 或特定 review primitive | source/test + host observation |
| Prompt 可维护性 | 主干更短、references 有 owner/trigger/fallback、tests 按模块守护 | static/mechanical 可确认 |
| 知识闭环 | substantive work 的 evidence artifact 可供 review/compound/release/resume 消费 | producer integration 可机械确认；evidence 是否真实充分仍需 semantic/host/field |

## 最终建议

可以进入后续技术方案与开发，但不建议直接从 `master` 按文件 cherry-pick。建议下一份 implementation-ready plan 以以下目标为中心：

```text
Current unified-plan / engines / proof-evidence / caller-owned review
  + Master task-pack / scope / architecture-fit / evidence-closeout
  + Current spec-plan composition-first contract
  - Obsolete tiers / autofix / hardcoded host assumptions / monolithic prose
```

第一批开发应先关闭 confirmed P0 contract drift，而不是先做纯 prompt slimming：task-pack identity/intake/required review、run-evidence integration truth、target-repo/source-runtime/scope/Scenario safety、dispatch/isolation/landing authorization，以及与各项同 wave 的 regression floor。随后再做 composition/feedback/simplify/anti-rationalization 与诚实 closeout UX，最后才进行 references 分层和 token/context 优化。

## 证据索引

- Current primary workflow: `skills/spec-work/SKILL.md`
- Current references: `skills/spec-work/references/{execution-engines,non-code-execution,review-findings-followup,shipping-workflow,tracker-defer}.md`
- Current Figma prompt: `skills/spec-work/references/agents/figma-design-sync.md`
- Master primary workflow: `master:skills/spec-work/SKILL.md`
- Master shipping/tracker/eval: `master:skills/spec-work/references/{shipping-workflow,tracker-defer}.md`、`master:skills/spec-work/evals/examples.json`
- Current focused tests: `tests/unit/spec-work-contracts.test.js`
- Master focused tests: `master:tests/unit/spec-work-contracts.test.js`
- Active upstream task-pack contract: `skills/spec-write-tasks/SKILL.md`、`skills/spec-write-tasks/references/**`
- Current pipeline consumer: `skills/spec-lfg/SKILL.md`
- Current composition contract: `skills/spec-plan/SKILL.md`、`skills/spec-plan/references/planning-evidence-boundaries.md`、`plan-sections.md`、`deepening-workflow.md`
- Current plan consumer replay: `skills/spec-plan/evals/consumer-replay-cases.json`、`tests/unit/spec-plan-consumer-replay-contracts.test.js`
- Run evidence source: `src/cli/helpers/{spec-work-run-artifact,verification-run-summary,honest-closeout}.js`
- Run evidence contracts/catalog: `docs/contracts/workflows/spec-work-run-artifact.schema.json`、`docs/contracts/verification/verification-run-summary.schema.json`、`docs/contracts/workflows/honest-closeout.schema.json`、`docs/catalog/runtime-capabilities.md`
- Completed workflow-quality origin/implementation: `docs/plans/2026-05-11-001-feat-trellis-inspired-workflow-quality-plan.md`、`docs/plans/2026-05-11-002-feat-spec-first-project-optimization-upgrade-plan.md`
- Completed per-task review gate: `docs/plans/2026-05-11-006-feat-task-pack-review-gate-plan.md`
- Completed Scenario Capability plan/current contract: `docs/plans/2026-05-28-002-feat-spec-first-scenario-adaptive-milestone-plan.md`、`docs/contracts/workflows/scenario-capability-matrix.md`
- Completed architecture-fit plan: `docs/plans/2026-07-01-003-feat-spec-work-minimality-architecture-fit-plan.md`
- Active prompt-slimming plan: `docs/plans/2026-07-07-001-refactor-spec-work-skill-prompt-slimming-plan.md`
- Completed run-evidence plan: `docs/plans/2026-05-28-004-feat-spec-work-run-evidence-and-invariant-lens-plan.md`
- Completed honest-closeout plan: `docs/plans/2026-06-04-003-feat-verification-honest-closeout-plan.md`
- Completed Anti-Rationalization plan: `docs/plans/2026-06-15-001-feat-anti-rationalization-tables-plan.md`
- Superseded historical quality plan: `docs/plans/2026-05-20-001-fix-spec-work-skill-quality-plan.md`
- CE-first replacement record: `docs/validation/2026-07-08-ce-to-spec-first-skill-review-plan.md`
- CE-parity code-review record and degraded boundaries: `docs/validation/2026-07-09-ce-to-spec-first-skill-code-review-report.md`
- Plan comparison precedent: `docs/validation/2026-07-16-spec-plan-current-vs-master-analysis.md`
