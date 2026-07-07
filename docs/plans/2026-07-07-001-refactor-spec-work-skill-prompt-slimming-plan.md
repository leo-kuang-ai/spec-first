---
title: "refactor: 按设计与优化方法论精简 spec-work skill prompt"
type: refactor
status: active
date: 2026-07-07
spec_id: 2026-07-07-001-spec-work-skill-prompt-slimming
origin: docs/10-prompt/skill-prompt-设计与优化方法论-v2.md
origin_grade: methodology
origin_verification_status: not-applicable
origin_verification_reason_codes: []
methodology_ref: docs/10-prompt/skill-prompt-设计与优化方法论-v2.md
target_skill: skills/spec-work/SKILL.md
---

# refactor: 按设计与优化方法论精简 spec-work skill prompt

> 本方案以 `docs/10-prompt/skill-prompt-设计与优化方法论-v2.md` 为指导，综合 2026-07-07 对 `skills/spec-work` 的只读 baseline、现有 contract test 锚点，以及后续技术方案判断。它是 HOW plan，不是 runtime behavior contract；实施时仍以当前 source、tests、fresh-source eval 和投射结果为准。

## 结论先行

`spec-work` 存在真实 Active body 体量债：`skills/spec-work/SKILL.md` 当前 579 行，超过方法论建议的正文预算，并把 task-pack 校验、分支/提交、subagent 调度、测试策略、minimality preflight、shipping closeout 等多类条件细节都放在热路径。优化应采用 **front-controller spine + STOP-triggered references**：

- `SKILL.md` 保留执行 workflow 的 L1 spine：契约摘要、输入分流、scope/repo/source-runtime/verification/handoff/run-artifact 边界、Phase skeleton、Reference Trigger Map、handoff/closeout 合同。
- 条件细节拆到一层 `references/`：`work-intake-and-task-pack.md`、`execution-strategy.md`、`feedback-and-tests.md`、`implementation-quality.md`，并继续保留/补强 `shipping-workflow.md` 与 `tracker-defer.md`。
- `description` 暂不改：它已含 settled plan / validated task pack / concrete implementation request 与 near-neighbor exclude intent，属于健康 Activation index；先不混轴优化，避免收益归因污染。
- 不以“压到某个行数”为 gate。行数下降是 confirmed 经济性指标；行为不退化、边界保留、STOP trigger 可达、fresh-source eval 覆盖 negative cases 才是收工依据。

目标结果：`SKILL.md` 从 579 行降至约 320-420 行；收益按 `confirmed / contingent / hypothesis` 分级报告，不把 line-count delta 冒充 token 收益。

**Why now / opportunity cost**

`spec-work` 是 Codebase -> Spec -> Plan -> Tasks -> **Code** -> Review -> Knowledge 链路中的高频执行节点；它经常在已经加载计划、任务、源码、测试和验证输出后继续占用 active context。当前 579 行主 prompt 中包含大量条件路径，最直接的成本不是“文件看起来长”，而是执行者在热路径里同时承受 task-pack、subagent、test strategy、shipping closeout 等互斥或低频细节。先优化 `spec-work` 的信息架构，是因为它能减少高频执行节点的认知和上下文税；更大的采纳问题（如真实运行质量趋势、review 漏判率、跨宿主 loader 差异）本轮只建立观测触发，不承诺已兑现。

## 与 2026-07-06 总方案的合并决策

`docs/plans/2026-07-06-001-refactor-skill-prompt-slimming-plan.md` 是跨 skill 的总路线，当前文档是 `spec-work` 专项落地方案。两者合并后的执行判断如下：

- 07-06 总方案拥有**实施顺序优先级**：第一刀先做 `spec-work` task-pack deterministic floor downshift，而不是先完整拆分 execution / feedback / quality / shipping references。
- 当前 07-07 方案拥有**专项安全网**：registration/projection 检查、contract-test migration table、per-reference eval matrix、fresh-source eval runbook、rollback gate、host-loader probe 和 adoption follow-up。
- 真正执行时以“07-06 的第一刀 + 07-07 的验收 gate”为准：先把 task-pack hash / `spec_id` / Task Pack Contract 结构等确定性规则从 prompt prose 降到 `spec-first tasks validate --json` handoff；其余 reference 分层只有在 pilot closeout 可信后进入 wave-2。

因此，本方案的执行策略从“一次性建完整 reference 架构”收敛为“两阶段”：

```text
Pilot A（必须先做）:
  task-pack deterministic downshift
  + work-intake-and-task-pack.md
  + contract/eval/projection/fresh-source 守护

Wave B（outcome-gated）:
  execution-strategy.md
  + feedback-and-tests.md
  + implementation-quality.md
  + shipping TOC / anchor 收敛
```

Pilot A 未产出可信 Outcome Bundle 前，Wave B 只能保留为计划，不进入正文迁移。

**07-06 总方案在本专项中的适用边界**

- 采用：deterministic floor downshift、STOP trigger 四件套、source/runtime 同源、fresh-source eval、runtime projection、outcome bundle、收益分级。
- 收窄：`spec-code-review` pilot、全局 Activation-L1 description 治理、stats/run evidence 消费层不进入本专项实施；它们仍归 07-06 总方案或 follow-up plan。
- 改名：07-06 的 `task-pack-intake.md` 在本专项中统一命名为 `work-intake-and-task-pack.md`，避免把 work intake 误收窄成只处理 task-pack。
- 决策优先级：若 07-06 的广义 rollout 叙述与本文 Pilot A / Wave B 顺序冲突，`spec-work` 实施按本文执行；若本文缺少方法论级原则，回到 07-06 总方案与 `docs/10-prompt/skill-prompt-设计与优化方法论-v2.md`。

## Goals / Non-Goals

**Goals**

- 降低 `spec-work` 触发后的 Active body 条件税，把多数运行用不到的细节从主 prompt 下沉。
- 保全 mutation / verification / handoff / source-runtime / repo-scope / run-artifact 等 hard boundaries。
- 给每个 moved reference 配可测试的 STOP trigger、未读降级和 negative eval。
- 用既有 deterministic CLI 输出承接 task-pack / verification / run artifact 的事实层，prompt 只消费 `--json` 结果并做语义判断。
- 更新 focused contract tests，让结构锚点守住“reference 被主 spine 命名、关键边界仍在、runtime 投射 source 可达”。

**Non-Goals**

- 不重写 `spec-work` 执行哲学，不改变公开 workflow 入口。
- 不新增 schema、状态机、CLI 子系统或宿主 primitive。
- 不把 task-pack validator 已拥有的确定性规则重新做成 prompt 语义校验。
- 不手改 `.claude/**`、`.codex/**`、`.agents/skills/**` 等 generated runtime mirrors。
- 不把 `CHANGELOG.md` 或 plan status 当执行进度状态源；实际执行证据仍来自 diff、tests、review、run artifact。

## Source-of-truth 与 Runtime 边界

**可改 source**

- `skills/spec-work/SKILL.md`
- `skills/spec-work/references/*.md`
- `skills/spec-work/evals/examples.json`
- `src/cli/plugin.js` 或等价 projection/manifest source（仅当新增 reference 需要 registration、runtime packaging 或 high-value anchor 更新时）
- `tests/unit/spec-work-contracts.test.js`
- `tests/fixtures/workflow-invariants/spec-work.json`（仅当锚点迁移导致 fixture 必须同步）
- `CHANGELOG.md`

**不可手改 runtime**

- `.claude/**`
- `.codex/**`
- `.agents/skills/**`
- `.cursor/skills/**`
- `.kiro/skills/**`
- `.qoder/**`

Runtime 刷新只通过 `spec-first init`，投射验证只观察生成结果。

## Script-owned Facts vs LLM-owned Judgment

Script-owned facts：

- `spec-first tasks validate <task-pack-path> --json` 负责 task-pack identity、hash、结构、路径等确定性验证。
- `verification-profile load`、`verification-run-summary record`、`honest-closeout validate`、`resource-governance-lens` 负责 closeout facts 与 reason_code。
- `spec-work-run-artifact write` 负责 run artifact payload/schema 校验与写入。

LLM-owned judgment：

- scope 是否仍在 plan/task-pack 内。
- 是否需要返回 `spec-plan` / `spec-write-tasks`。
- durable surface 是否确有必要。
- 哪些验证足以支撑最终声明。
- 是否触发 durable evidence、review escalation 或 compound suggestion。

方案要求：prompt 不伪造命令结果，不让脚本裁决语义充分性，也不把 advisory provider facts 当 confirmed truth。

## Step 0 — Baseline（confirmed，2026-07-07）

**Body baseline**

```text
skills/spec-work/SKILL.md                         579 行
skills/spec-work/references/shipping-workflow.md  269 行
skills/spec-work/references/tracker-defer.md      149 行
skills/spec-work/evals/examples.json              6 examples
```

**Index baseline**

```text
description ≈ 300 字符，低于 1024 限制；已含 what + when + exclude。
name: spec-work，公开 workflow 入口命名合规。
```

**Heaviness**

```text
Phase 1: Quick Start                         200-390，约 191 行
Phase 2: Execute                             391-531，约 141 行
边界群（Scenario Capability -> Run Artifact） 49-145，约 90 行
Key Principles + Common Pitfalls             536-579，约 44 行
```

**Loader 探针**

`SKILL.md` 内 `@./references` eager include 数量为 0。现有 references 通过散文式“read references/X.md”按需引用。下沉可带来 context-room 收益，但需按宿主标记为 `contingent-on-loader-behavior`，不能直接声明 confirmed token 节省。

## Step 1 — 内容分类

| 当前内容 | 分类 | 计划处置 |
|---|---|---|
| frontmatter `description` | Activation-L1 | 暂不修改 |
| Workflow Contract Summary | Body-L1 contract | 保留 spine |
| Scenario Capability | Body-L1 contract | 保留 spine，压短可读性 |
| Context Orientation / Direct Evidence / Recall Trust / Capability-Class | Body-L1 gate + anchor | 保留要点，细节合并到 governance/implementation reference 时需 STOP trigger |
| Workspace Repo Scope | Body-L1 hard gate | 保留 spine |
| Run Artifact Boundary | Body-L1 hard gate | 保留 spine 摘要，细节与 shipping closeout 保持双锚点 |
| Phase 0 triage + User-Facing Handoff Contract | Body-L1 handoff gate | 保留 spine |
| Phase 1 task-pack validation | Body-L1 hard gate | 迁移需谨慎，优先 reference 化但保留 validator handoff 摘要 |
| Branch/worktree/environment setup | Body-L2 | 移入 `execution-strategy.md` |
| Task list + execution strategy + subagent matrix | Body-L2 | 移入 `execution-strategy.md` |
| Feedback loop / Test Discovery / System-Wide Test Check | L1 anchor + L2 detail | anchor 留 spine，表格移入 `feedback-and-tests.md` |
| Minimality + Architecture Fit Preflight / Simplify as You Go | L1 anchor + L2 detail | anchor 留 spine，细节移入 `implementation-quality.md` |
| Phase 3-4 shipping | Body-L2 已下沉 | 保留 `shipping-workflow.md`，补 TOC 与 spine trigger |
| Key Principles / Common Pitfalls | L1 behavioral anchor + L3 duplicate | 压缩合并，不保留重复叙事 |

## Target Information Architecture

### `skills/spec-work/SKILL.md` spine

保留这些一屏可扫描结构：

- Introduction：一句话定位 settled execution。
- Contract Summary：When To Use / When Not To Use / Inputs / Outputs / Artifacts / Failure Modes / Workflow / Consumers。
- Reference Trigger Map：所有 references 的 STOP trigger。
- Hard Boundary Anchors：repo scope、source/runtime、scope non-expansion、task-pack freshness、verification、run artifact。
- Phase Skeleton：
  - Phase 0：input triage and route-out handoff。
  - Phase 1：work intake and task setup。
  - Phase 2：execute vertical slices。
  - Phase 3-4：read `shipping-workflow.md` before quality/shipping。
- User-Facing Handoff Contract。
- Completion Response Contract 摘要。

### `references/work-intake-and-task-pack.md`

触发：输入是 plan/spec path、task-pack path，或 bare prompt 需要转成 executable work。

承接：

- plan/task-pack 完整读取策略。
- task-pack frontmatter、`spec_id`、`source_plan_hash`、`spec-first tasks validate --json`。
- `semantic_posture`、`dispatch_authorization`、`review_gate`、`review_focus`。
- source plan 作为 scope authority 的边界。
- task-pack 拒绝与 handoff envelope。

未读降级：不得执行 task-pack；只能返回 handoff 或要求重新运行 `spec-write-tasks` / `spec-plan`。

### `references/execution-strategy.md`（Wave B）

触发：进入环境设置、任务列表、分支/commit/subagent/parallel strategy、worktree/fork workspace、incremental commit 判断。

承接：

- branch default/feature/worktree 选择。
- meaningful branch name 建议。
- task list derivation。
- inline / serial / parallel strategy。
- host capability matrix。
- parallel safety check、shared-directory fallback、merge conflict discipline。
- incremental commit rules。

未读降级：默认 inline execution；不得 dispatch parallel subagents，不得直接 commit 到 default branch。

### `references/feedback-and-tests.md`（Wave B）

触发：修改 behavior-bearing code、写/改测试、执行 test-first/characterization-first、涉及 callback/middleware/state/interface parity。

承接：

- smallest feedback loop。
- vertical slice execution。
- Test Discovery。
- Test Scenario Completeness。
- System-Wide Test Check。
- skip conditions and not-run reason_code。

未读降级：只能运行最窄已知验证，不得声称 coverage 或 system-wide interaction 已确认。

### `references/implementation-quality.md`（Wave B）

触发：新增/修改 durable surface，复用/扩展/新增选择，架构 fit，simplify-as-you-go，domain decision ledger。

承接：

- Minimality + Architecture Fit Preflight。
- Existing capability / reuse recheck。
- future-only abstraction refusal。
- domain language and decision note。
- simplification classifications：`remove-now`、`minimality-debt`、`protected`、`architecture-mismatch`。

未读降级：不得新增 public contract、schema/runtime/config surface、provider boundary 或 generated runtime delivery；改为 handoff 到 `spec-plan`。

### `references/shipping-workflow.md`（Wave B）

保留现有 Phase 3-4 owner，并补：

- 文件开头 TOC（>100 行 reference）。
- 与 spine 的 trigger 对齐。
- run artifact detail 继续与 `## Run Artifact Boundary` 双锚点保持一致。

### Reference Ownership And Size Guards

瘦身不是把正文搬家。实施时必须报告 `SKILL.md` line delta、每个 reference line delta 和 total source line delta。参考预算是 advisory，不是 hard gate；超过预算时必须解释为什么该 reference 仍比留在 spine 更清晰。

| reference | owner scope | target size | merge / rollback condition |
|---|---|---|---|
| `work-intake-and-task-pack.md` | plan/task-pack intake、validator handoff、review gate metadata | 120-180 行 | 若超过 200 行，优先把纯 validator 字段复述改为 CLI handoff；不得拆二层 reference |
| `execution-strategy.md` | branch/worktree/task list/subagent/parallel/commit | 140-220 行 | 若 subagent 与 branch 两段互不相关且合计超 220 行，保留 TOC 并明确独立 trigger；不要复制 task-pack intake |
| `feedback-and-tests.md` | feedback loop、test discovery、scenario completeness、system-wide checks | 100-160 行 | 若只剩短表格，考虑保留在 spine；若跨过 160 行，压缩表格而不是新增二层文件 |
| `implementation-quality.md` | minimality、reuse、durable surface、simplify、decision ledger | 100-170 行 | 若与 `feedback-and-tests.md` 重叠，按“测试反馈 vs 架构/表面新增”边界重新分配 |
| `shipping-workflow.md` | Phase 3-4 shipping、review、closeout、run artifact、PR | 现有 269 行可保留，但必须有 TOC | 若新增内容继续膨胀，优先压缩重复 closeout prose，不拆二层 reference |
| `tracker-defer.md` | residual review tracker deferral | 现有 owner 不变 | 仅在 residual tracker flow 改动时触碰 |

Overlap check：每个 reference 开头写 `Owned here` / `Not owned here` 两行；U4 contract tests 至少抽查新 reference 的 owner heading 存在。Outcome Bundle 必须报告 `total_source_line_delta`，避免只用 `SKILL.md` 行数证明收益。

## Reference Trigger Map 草案

```markdown
## Reference Trigger Map

- STOP. Before accepting a plan/task-pack path, validating executable work intake, or rejecting stale/unverifiable task packs, read `skills/spec-work/references/work-intake-and-task-pack.md`.
- STOP. Before choosing branch, worktree, task tracker, subagent, parallel, merge, or commit strategy, read `skills/spec-work/references/execution-strategy.md`.
- STOP. Before changing behavior-bearing code, designing tests, applying test-first/characterization-first posture, or claiming coverage, read `skills/spec-work/references/feedback-and-tests.md`.
- STOP. Before adding/changing a durable surface, overriding reuse decisions, recording architecture decisions, or simplifying current-run code, read `skills/spec-work/references/implementation-quality.md`.
- STOP. When all execution tasks are complete and quality/shipping begins, read `skills/spec-work/references/shipping-workflow.md`.
- STOP. When Tier 2 review leaves residual findings and the user chooses tracker deferral, read `skills/spec-work/references/tracker-defer.md`.
```

每条 moved reference 必须在对应 reference 文件中补 `fallback_if_unread` 与至少一个 trigger / non-trigger eval case。

## Evidence Matrix

| scenario | candidate | classification | protected behavior | implementation_permission | required evidence |
|---|---|---|---|---|---|
| route discovery | 不改 description | Activation-L1 | near-neighbor exclude intent 不丢 | blocked | 无 |
| work intake | task-pack validation 细节迁入 `work-intake-and-task-pack.md` | L1 gate + L2 detail | stale/hash/spec_id/structure 不通过即 stop | candidate | contract test + fresh-source eval |
| branch/env | branch/worktree 细节迁入 `execution-strategy.md` | L2 | default branch 不 silent commit | ready | contract test + eval case |
| subagent/parallel | host matrix 与合并流程迁入 `execution-strategy.md` | L2 | overlap/merge/test ownership 不静默丢 | candidate | test 重定向到 reference + negative eval |
| feedback/tests | 测试表格迁入 `feedback-and-tests.md` | L1 anchor + L2 | behavior change 有反馈回路；not-run 有 reason | candidate | contract test + fresh-source eval |
| minimality | preflight 细节迁入 `implementation-quality.md` | L1 anchor + L2 | future-only abstraction 被拒绝 | candidate | existing spec-work contracts 同步 |
| shipping | `shipping-workflow.md` 加 TOC，spine 只留 trigger | L2 | review/verification/run-artifact closeout 不退化 | ready | workflow-invariant fixture |
| duplicate prose | Key Principles/Common Pitfalls 合并压缩 | L1 anchor + L3 | scope adherence、evidence-first、ship-complete 保留 | ready | diff review + fresh-source eval |

## Implementation Units

### U1. Pilot A：task-pack deterministic downshift

**Files**

- Modify: `skills/spec-work/SKILL.md`
- Create: `skills/spec-work/references/work-intake-and-task-pack.md`
- Modify: `tests/unit/spec-work-contracts.test.js`
- Modify: `skills/spec-work/evals/examples.json`
- Check/Modify: `src/cli/plugin.js` or equivalent projection/manifest source if the new reference must be registered or high-value anchors updated.
- Modify: `CHANGELOG.md`

**Approach**

这是 07-06 总方案指定的第一刀。只处理 task-pack intake 的 deterministic floor：把 hash、`spec_id`、source plan hash、Task Pack Contract 结构、路径格式等脚本已判定的散文复述压缩为 CLI handoff contract。

Spine 只保留：

- 何时运行 `spec-first tasks validate <task-pack-path> --json`。
- 只有 validator 返回可执行 deterministic handoff 后才继续创建 execution tasks。
- validator 失败按 `reason_code` 停止并输出 user-facing handoff。
- `semantic_posture`、scope adequacy、review gate 仍是 LLM-owned semantic judgment，不由脚本裁决。

`work-intake-and-task-pack.md` 承接 task-pack intake 的条件细节，但不得复制完整 validator 字段清单；能由 CLI 输出解释的内容只写消费姿态、fallback 和 handoff envelope。

**Verification**

- `npx jest --runTestsByPath tests/unit/task-pack-command.test.js tests/unit/spec-work-contracts.test.js tests/unit/changelog-format.test.js --runInBand`
- `npm run lint:skill-entrypoints`
- `git diff --check -- skills/spec-work/SKILL.md skills/spec-work/references/work-intake-and-task-pack.md skills/spec-work/evals/examples.json tests/unit/spec-work-contracts.test.js src/cli/plugin.js CHANGELOG.md`
- fresh-source eval 至少覆盖 stale task-pack、spec-id mismatch、hash mismatch、valid task-pack handoff、bare prompt non-trigger。
- 如果 fresh-source eval 不可用，本单元只能新增 reference + STOP trigger；不得删除 spine 承重正文。

### U2. Pilot A closeout gate

**Files**

- Modify: `docs/plans/2026-07-07-001-refactor-spec-work-skill-prompt-slimming-plan.md` only if closeout reveals plan drift.
- Runtime observation only after source changes: generated mirrors from `spec-first init`.

**Approach**

在继续 Wave B 前，产出 Pilot A Outcome Bundle。必须回答：

- `SKILL.md` task-pack prose 是否减少，减少了多少。
- `work-intake-and-task-pack.md` 是否有 STOP trigger、fallback、trigger/non-trigger eval。
- `spec-first tasks validate --json` 的 deterministic facts 与 LLM semantic judgment 是否分层清楚。
- runtime projection 是否可达新增 reference。
- 是否有 failed / not-run / degraded reason。

**Verification**

- `spec-first init`
- `spec-first doctor --claude`
- `spec-first doctor --codex`
- host-loader probe for the new reference, recorded as confirmed / contingent / hypothesis.
- If any hard gate fails, stop here and fix or roll back Pilot A; do not enter Wave B.

### U3. Wave B：execution strategy / tests / quality references

**Files**

- Modify: `skills/spec-work/SKILL.md`
- Create/Modify: `skills/spec-work/references/execution-strategy.md`
- Create/Modify: `skills/spec-work/references/feedback-and-tests.md`
- Create/Modify: `skills/spec-work/references/implementation-quality.md`
- Modify: `skills/spec-work/references/shipping-workflow.md`
- Modify: `tests/unit/spec-work-contracts.test.js`
- Modify: `tests/fixtures/workflow-invariants/spec-work.json` when anchors move.

**Approach**

只有 Pilot A closeout 可信后才进入。逐块迁移 execution / feedback / implementation-quality / shipping 细节，迁移后 spine 只保留保护性摘要与 STOP trigger。每块都必须遵守 Reference Ownership And Size Guards。

**Stop if**

- 无法形成未读 fallback。
- 迁移后必须靠记忆才能知道何时读 reference。
- `Run Artifact Boundary`、`Workspace Repo Scope`、`source/runtime` 等 hard gate 在 spine 消失。
- contract-test migration table 尚未更新。
- per-reference eval matrix 尚未覆盖目标 reference。

**Verification**

- focused contract tests 更新前后对照。
- fresh-source eval 必须覆盖 target_repo 缺失、generated mirror、scope expansion、feedback loop、durable surface、shipping closeout。

### U4. 更新 eval 与 contract tests（Pilot A 和 Wave B 均适用）

**Files**

- Modify: `skills/spec-work/evals/examples.json`
- Modify: `tests/unit/spec-work-contracts.test.js`
- Modify: `tests/fixtures/workflow-invariants/spec-work.json`（如需要）

**Approach**

把原本断言 `SKILL.md` 长正文的测试改成断言：

- spine 保留 STOP trigger。
- reference 文件存在且包含关键保护短语。
- moved content 不再要求在 spine 全量出现。
- workflow invariant 的 gate phrase 仍可在 source 或指定 reference anchor 中找到。

**Contract-test migration table**

实施前先补这张表到 U4 工作记录或直接落入测试注释/fixture。不得通过删除断言来“恢复绿色”。

| current test / fixture | protected behavior | old owner | target owner | spine minimum |
|---|---|---|---|---|
| `spec-work frontmatter trigger contract` | entry trigger 与 near-neighbor exclusions | `SKILL.md` frontmatter | `SKILL.md` | description 不动 |
| `first-screen summary` | settled-scope execution boundary | `SKILL.md` intro | `SKILL.md` | settled plan/task-pack/concrete implementation + route back |
| `context orientation contract` | direct source evidence、host instruction reuse、scope expansion boundary | `SKILL.md` | `SKILL.md` + optional `implementation-quality.md` | Context Orientation anchor 与 scope expansion 规则留 spine |
| `domain context / decision ledger` | domain terminology、standards、decision note | `SKILL.md` | `implementation-quality.md` | STOP trigger + short decision-ledger anchor |
| `feedback-loop-first execution` | smallest feedback loop、docs/config checks、vertical slices | `SKILL.md` | `feedback-and-tests.md` | `Feedback Loop And Vertical Slices` heading 或等价 hard anchor 留 spine |
| `direct evidence used` | plan direct evidence 不扩 scope、closeout evidence fields | `SKILL.md` + `shipping-workflow.md` | spine + `shipping-workflow.md` | direct evidence boundary 留 spine |
| `minimality preflight contract` | durable surface preflight before implementation | `SKILL.md` | `implementation-quality.md` | `Minimality + Architecture Fit Preflight` heading 或 STOP trigger 留 spine；task loop 仍必须指向它 |
| `workflow-invariants/spec-work.json` durable evidence | run artifact trigger remains guarded | `SKILL.md` + `shipping-workflow.md` | 不变，除非另有 source-confirmed reason | `Run Artifact Boundary` 留 spine |
| `workflow-invariants/spec-work.json` feedback loop | feedback loop gate phrase remains deterministic | `SKILL.md` `Feedback Loop` + `Key Principles` | 优先保留 spine hard anchor；若迁到 reference，fixture 必须同步指向 reference anchor 并说明 STOP trigger 替代理由 | 至少一个 spine trigger + gate phrase |

**Per-reference eval matrix**

每个 moved reference 至少一个 trigger case 和一个 non-trigger case；`skills/spec-work/evals/examples.json` 只作 examples-as-context，fresh-source eval runbook 执行时必须逐项覆盖。

| reference | trigger case | non-trigger case | protected behavior | negative signal |
|---|---|---|---|---|
| `work-intake-and-task-pack.md` | validated/stale task-pack path | trivial bare prompt | stale/hash/spec_id/structure stop before implementation | 从 free-form card 或邻近代码扩 scope |
| `execution-strategy.md` | default branch、branch rename、subagent/parallel/commit decision | already on confirmed feature branch + 1-file change | no default-branch commit without confirmation；parallel overlap not silent | 读不到 reference 仍 dispatch parallel 或 commit |
| `feedback-and-tests.md` | behavior-bearing change or coverage claim | docs-only wording change | feedback loop before/after slice；not-run reason present | 声称 coverage/verified 但无 loop |
| `implementation-quality.md` | new durable surface / abstraction / schema/runtime/config/provider boundary | local non-durable edit | future-only abstraction refused；handoff to plan when unauthorized | 新增 public contract 或 wrapper without evidence |
| `shipping-workflow.md` | all execution tasks complete, entering quality/shipping | mid-task implementation | review/verification/run-artifact closeout preserved | 完成前跳 shipping 或跳 structured closeout |
| `tracker-defer.md` | Tier 2 residual findings + user chooses tracker deferral | no residual findings / Tier 1 only | residuals not silently dropped | tracker path loaded without residual decision |

**Quality gate / rollback rule**

U4 是不可跳过的质量 gate。每个 moved reference 至少要有一个 trigger case 和一个 non-trigger case；每个 hard boundary 迁移都必须有对应 contract assertion 或 fresh-source eval case。若 focused tests、fresh-source eval、或 runtime projection 任一不通过，不得以“prompt 已变短”收工：

- 优先修复 trigger、reference 内容或测试断言，使 protected behavior 重新通过。
- 若同一 protected behavior 连续修复后仍不达标，回滚该迁移块到上一版 spine 内容。
- 若证据不足但仍想保留新增 reference，只允许降级为可逆状态：reference 文件可保留，`SKILL.md` 承重正文不删除，并在 closeout 记录 `fresh_source_eval_not_run:<reason>` 或对应 failure reason。
- 不允许在测试失败、eval 不达标、或 projection 失败时继续删除 spine 承重文本、刷新 runtime、提交 PR 或声明质量稳定。

### U5. Runtime projection 与 closeout

**Files**

- Modify: `CHANGELOG.md`
- Check/Modify: `src/cli/plugin.js` or equivalent projection/manifest source when new references must be registered or high-value anchors updated.
- Modify: `tests/unit/spec-work-contracts.test.js` or projection/source-path coverage tests for new reference reachability.
- Runtime observation only: generated mirrors after `spec-first init`

**Approach**

完成 source 改动后先检查 projection source，再运行投射观察。不要手改 runtime mirror。closeout 按 outcome bundle 报告 line delta、reference 清单、registration/projection 判断、验证结果、fresh-source eval 充分性、未验证项。

**Registration / projection checks**

- 检查 `src/cli/plugin.js` 的 `HIGH_VALUE_SKILL_ANCHORS` / `HIGH_VALUE_COMMAND_ANCHORS` 或等价 source 是否仍只锚定旧 `shipping-workflow.md`。若新增 references 成为承重 owner，更新 anchors 或新增等价 invariant，避免 doctor/high-value checks 只证明旧文件存在。
- 补 deterministic assertion：每个承重 reference 都在 source manifest / runtime projection / packaged output 中可达，且 path rewrite 后仍能从 generated host surface 读取。
- 若确认某个平台由目录复制自动包含 references，不需要手列清单，也要在 closeout 写明 source evidence 和测试命令。

## Validation Plan

**Static shape**

- `npm run lint:skill-entrypoints`
- `npx jest --runTestsByPath tests/unit/spec-work-contracts.test.js tests/unit/changelog-format.test.js --runInBand`
- `git diff --check -- skills/spec-work/SKILL.md skills/spec-work/references skills/spec-work/evals/examples.json tests/unit/spec-work-contracts.test.js tests/fixtures/workflow-invariants/spec-work.json src/cli/plugin.js CHANGELOG.md`

**Runtime projection**

- `spec-first init`
- `spec-first doctor --claude`
- `spec-first doctor --codex`
- host-loader probe：分别检查 Claude command runtime 与 Codex skill runtime 的实际入口文本，确认 references 是否默认进入 active prompt；记录 before/after 字符数或 token 估算。若不能确认 loader 行为，`context_room_delta_by_host` 标 `hypothesis`，不得作为成功结果。

仅观察投射结果；如果 runtime drift 暴露 generator 问题，先回 source/generator 修，不手改 mirror。

**Behavior / fresh-source eval**

目标：用 fresh-source checklist 产出 `passed` / `concerns` / `not_run`，并在样本充分时标 `eval_adequacy: L3 before/after sample`。L3 是证据充分性标签，不是未定义的机械状态。

**Fresh-source eval runbook**

- Authorization：只有当前请求显式授权 subagents/personas/delegated review，或 host 提供等价 fresh read-only reviewer 时，才调度独立 reviewer；否则单 agent fallback 只能记 `not_run` 或 `concerns`，不得声明稳定。
- Inputs：优化前 source snapshot（或 git base）、优化后当前磁盘 `skills/spec-work/SKILL.md` + references、`skills/spec-work/evals/examples.json` required cases、相关 tests/fixtures。
- Required cases：使用上文 per-reference eval matrix；每个 case 记录 `expected_loaded_refs`、`must_not_load_refs`、protected behavior、negative signal。
- Output：写入 closeout 或 review artifact，字段至少包含 `status: passed|concerns|not_run`、`reason_code`、`cases_run`、`models`、`sample_count`、`limitations`、`source_refs`。
- Pass rule：所有 hard gate cases 100% pass；advisory cases 记录 pass-rate 和方差；若任何 hard gate case failed，回滚对应迁移块。

必测 negative cases：

- stale or wrong-chain task-pack stops before implementation。
- parent workspace without `target_repo` blocks writes/tests/commits。
- generated runtime mirror is not edited as source fix。
- small bare prompt does not force subagent/parallel reference。
- behavior-bearing change cannot claim verified without focused loop or not-run reason。

若 fresh-source eval 未执行，只能声明静态结构完成，不能删除/迁移 spine 承重文本，closeout 记 `fresh_source_eval_not_run:<reason>` 或 checklist `not_run:<reason>`。

**Completion / rollback gate**

优化完成的最低质量门槛：

```text
static contract tests passed
+ fresh-source eval checklist status passed for required negative cases, with eval_adequacy L3 when before/after sample exists
+ runtime projection passed or has explicit degraded reason without runtime refresh
+ hard boundaries preserved in spine or STOP-triggered references
+ no unverified completion / verification claims
```

如果任一项失败，处理顺序是：先修复；修复后仍失败则回滚失败迁移块；无法执行行为验证时降级为“新增 reference + spine 原文保留”的可逆状态。失败状态下不得用 line-count delta 作为接受依据。

## Stability Testing（质量稳定性）

“改完跑一次通过” ≠ “质量稳定”。方法论 §24（回归均值 / 大数定律）：单次 fresh-source eval 通过不证行为稳定。稳定性沿三个正交轴反复采样，而非跑一遍打勾。上文 Completion gate 是“最低通过门槛”，本节是“稳定性门槛”，收工声明“质量稳定”必须同时满足本节。

### 三层能证明什么

| 层 | 能证明 | 能否证稳定 |
|---|---|---|
| 静态测试（`spec-work-contracts.test.js`、`spec-first init/doctor`） | 结构/投射稳定：STOP 在场、reference 被命名、无 eager include、无 mirror drift | 只证结构稳定，证不了行为（地图≠疆域） |
| fresh-source eval（单次） | 某次行为正确 | 否，单次不证稳定 |
| fresh-source eval（N × 跨模型 × 前后对照） | 行为在扰动下不漂移 | 是，稳定性证据 |

### 三维采样矩阵

- **维度 1 · 重复采样（抗随机性）**：同 case 同模型跑 N 次（N≥5），记 pass-rate 与方差，不记单次结果。
- **维度 2 · 跨模型（§20，抗模型差）**：至少一个强模型 + 一个快/弱模型。这是本方案最薄的一维——`Key Principles` 的重复对强模型是冗余，对弱模型可能是有效强化，Wave B 压缩 behavioral anchors 时可能只在弱模型上掉质量，必须在弱模型上单独验。
- **维度 3 · 前后对照（L3，抗“改坏没发现”）**：同 case 分别注入改前 / 改后 source 到全新实例对比，判据是“改后 ≥ 改前”，不是“改后能过”。

### 保护行为清单（稳定性断言目标）

**硬 gate（零容忍，N 次 × 每模型必须 100%）**

- Pilot A：stale/hash/spec_id/structure 不通过的 task-pack 一律 stop；valid deterministic handoff 仍不等于 semantic readiness；validator 失败必须给 user-facing handoff。
- Wave B：`execution-strategy.md` 未读时仍绝不在 default 分支未确认就 commit（fallback 生效）；parent workspace 缺 `target_repo` 阻断写入/测试/commit；generated runtime mirror 只读、不作 source fix；`Run Artifact Boundary` / verification-before-complete 不退化。

**trigger 精度（正反各一）**

- 该触发：validated task-pack → 必须读 `work-intake-and-task-pack.md`；default 分支执行 plan → 必须读 `execution-strategy.md`。
- 不该触发：1-2 文件 trivial bare prompt → 不读 subagent/parallel reference、直接实现。

**behavioral anchor（Wave B 合并后仍须成立）**

- 不切 human-time phases；不留 80% done；unrelated cleanup → follow-up 不进本次 diff；reproduce/evidence-first；scope adherence。

**degraded 路径**

- reference 未读 → 走保守 fallback，而不是静默跳过。

### 回归套件固化（测跨时间稳定）

把上述 case 编码进 `skills/spec-work/evals/examples.json`（既有 `prompt-examples/v1` 结构），带 `coverage_tags`（trigger/boundary/failure/negative），并按 `docs/contracts/workflows/fresh-source-eval-checklist.md` 执行（保证注入当前磁盘 source、不吃会话缓存）。这样每次后续改 `spec-work` 都重跑同一套，是回归测试而非一次性验收。此项与 U4 的 eval 更新合并落地。

### 稳定性判据（gate vs 指标）

- **硬 gate 行为**（分支安全、边界、verification）：N 次 × 每模型 100%，任一次失败即 fail，不是“多数通过”。
- **advisory 行为**（anchor 语气强度、findability）：记 pass-rate 与方差作趋势指标，明显下滑才回退，不单点考核（避免古德哈特）。
- **前后对照**：改后保护行为 pass-rate 不低于改前。

### 诚实局限（写进 closeout）

- LLM eval 非确定性，稳定性是统计结论非二值：报 pass-rate + N + 模型清单 + 方差，不报单个 ✓。
- N=5 为指示性非统计证明（大数定律），标 `eval_adequacy: L3` 与样本上限。
- dispatch 不可用跑不了 eval → 记 `fresh_source_eval_not_run:<reason>`，此时不得声称稳定；Pilot A / Wave B 中涉及删除或迁移 spine 承重文本的动作必须降级为只新增 reference + STOP trigger 或压缩保留（原则 6）。

## Risks And Mitigations

| risk | mitigation |
|---|---|
| STOP trigger 不触发，reference 没被读 | 每个 reference 有明确 trigger、fallback、negative eval |
| contract test 因内容迁移大面积失败 | 先更新测试意图为“spine trigger + reference owner”，不删除保护断言 |
| task-pack hard gate 被藏进 reference 后漏执行 | spine 保留 validator handoff 摘要与 stop/handoff rule |
| 行数下降被误报为 token confirmed | closeout 分级：line confirmed，context-room contingent，quality hypothesis |
| 过度拆分导致查找成本上升 | references 一层深、按执行场景 MECE 拆分、`SKILL.md` 统一 Trigger Map |
| 强模型 eval 通过但弱模型掉质量（重复 anchor 被删后） | Stability Testing 维度 2 强制在弱/快模型上单独跑 protected-behavior negative eval |
| 单次 eval 通过被误当“稳定” | Stability Testing 三维采样（N 次 × 跨模型 × 前后对照）+ pass-rate/方差报告，禁止单点打勾 |
| runtime projection 路径 rewrite 漏掉新 reference | `spec-first init` + init source path coverage / spec-work contract test |

## Adoption / Evaluation Follow-up

本轮不把 adoption 价值声明为 confirmed。实施 closeout 必须新增一个 deferred follow-up，触发条件是实施后的 1-3 次真实 `spec-work` 运行或后续维护改动。观察项：

- 是否出现 reference miss、误读、未读 fallback 或 not-run reason 异常增多。
- 维护者定位某条规则 owner 的时间/路径是否减少（例如从主文件查到 reference owner 的跳转是否明确）。
- reviewer 是否指出 trigger map 不清、reference 重叠或信息搬家。
- host-loader probe 是否能把 `context_room_delta_by_host` 从 hypothesis/contingent 提升为 confirmed。

重估条件：若 3 次真实运行/维护中出现同一 reference miss 或同一 protected behavior 退化，回滚对应 reference 分层或把该规则恢复到 spine。

## Changelog / Docs Requirements

任何 source 变更都必须更新 `CHANGELOG.md`。本计划实施时的 changelog 应说明：

- source surface：`skills/spec-work/SKILL.md`、新增 references、eval/tests。
- user-visible：`spec-work` runtime prompt 结构优化，行为契约不变。
- verification：列出 focused tests、lint、fresh-source eval、runtime projection 或未执行 reason。
- generated runtime：明确未手改；是否已通过 `spec-first init` 刷新。

## Outcome Bundle 模板

```markdown
## Outcome Bundle

- baseline_ref: docs/plans/2026-07-07-001-refactor-spec-work-skill-prompt-slimming-plan.md
- changed_surfaces: <SKILL.md / references / evals / tests>
- line_count_delta: 579 -> <after> [confirmed]
- total_source_line_delta: <before total SKILL+references -> after total> [confirmed]
- per_reference_line_delta:
  - work-intake-and-task-pack.md: <new lines>
  - execution-strategy.md: <new/after lines>
  - feedback-and-tests.md: <new lines>
  - implementation-quality.md: <new lines>
  - shipping-workflow.md: <before -> after>
- context_room_delta_by_host:
  - claude: <delta or unknown> [confirmed|contingent-on-loader-behavior]
  - codex: <delta or unknown> [confirmed|contingent-on-loader-behavior]
- projection_registration:
  - source_checked: <src/cli/plugin.js or equivalent>
  - new_references_runtime_reachable: yes|no|degraded
- host_loader_probe: <confirmed|contingent|hypothesis, reason>
- verification:
  - static_tests: <commands + result>
  - runtime_projection: <spec-first init/doctor result or not-run reason>
  - fresh_source_eval: <result or fresh_source_eval_not_run:<reason>>
  - negative_eval_cases: <covered cases>
  - eval_adequacy: L0|L1|L2|L3|L4
- boundary_result: source/runtime, mutation, verification, handoff, repo-scope, run-artifact preserved?
- references_created_or_kept: <paths + trigger summary>
- success_gate: pass|failed|degraded, <reason_code>
- deferred_follow_up: <owner / trigger / re-evaluation condition, including adoption/evaluation follow-up>
```

## 已执行 / 未执行的验证

**已执行（只读规划阶段）**

- 读取 `docs/10-prompt/skill-prompt-设计与优化方法论-v2.md`。
- 读取 `docs/10-prompt/结构化项目角色契约.md`。
- 读取 `skills/spec-work/SKILL.md`、现有 references、eval examples、`tests/unit/spec-work-contracts.test.js`。
- 采集 `wc -l` baseline 与 section heaviness。
- 确认 `@./references` eager include 当前为 0。

**未执行（实施阶段再做）**

- 未修改 `skills/spec-work` source。
- 未运行 fresh-source eval。
- 未运行 `spec-first init`。
- 未运行 Jest / lint；本次仅更新计划文档。
