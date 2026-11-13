---
title: "refactor: Execution boundary and simplicity contracts for spec-work"
type: refactor
status: superseded
created: 2026-04-18
author: Codex
depth: medium
supersedes: 2026-04-18-001-refactor-karpathy-execution-contract-integration-plan only as broader follow-up scope; 001 remains the review-side completed subset
---

# refactor: Execution boundary and simplicity contracts for spec-work

## Overview

这份计划只补 `spec-work` / `spec-work-beta` 里仍未被明确写进合同的**执行边界 delta**，以及与实现期直接相关的 **Simplicity First delta**。

外部参考源是外部仓库 `andrej-karpathy-skills` 下的 `skills/karpathy-guidelines/SKILL.md`(repo-relative;绝对路径因机器而异,不入 plan)。本计划**不做一比一移植**,只提炼当前仓库仍缺失、且能用轻 contract 表达的最小 delta。

不做全链路 Karpathy rollout。目标只有一件事：

> 把"每条改动必须可追溯"、"不并入无关清理(含 own-wave orphan 清理)"、"scope 扩张必须显式分类"、"实现只做当前任务真正需要的最小代码"、"多路径前先说 tradeoff"五类约束,从隐式的"最佳实践"变成显式的执行合同写进 skill。

## Skill Placement

这组外部源规则在当前仓库中的落点分三层。**本计划对下列落点只在 `spec-work` / `spec-work-beta` 产生 execution action**,其余仅作为叙事上下文,**不列入 Files / Done Signals**:

- **主合同落点(本计划 execution scope):`spec-work` / `spec-work-beta`**
  - 这些 skill 负责真实实现决策,最适合承接 `Simplicity First`
- **次级检测面(仅叙事,无 execution action):`spec-code-review`**
  - 当前 review-side 已有 `over_engineering` 维度(见 001 plan),本计划不新增、不修改
  - 本段仅说明"R1/R2/R4 的后验信号由现有 review-side 承担",供读者理解分层,不是 plan scope
- **不作为本轮主落点:`spec-plan` / `spec-brainstorm`**
  - 本轮不改 `spec-plan` / `spec-brainstorm`;如未来出现上游缺口,独立立项承接,不在本 plan 留暗示性未来动作

## Definitions

以下术语贯穿本计划，先于首次使用定义。

- **direct dependency**：为完成当前 task 而必须触达的直接相关 caller 或 shared area。这里保留工程判断空间，不把它写成硬性的反事实判定规则。
- **required dependency**：完成当前任务的前置工作，不做它当前 task 无法落地。
- **separate follow-up**：执行过程中发现的独立改进机会，与当前 task 是并列关系，应登记为新 task,不并入当前改动。
- **allowed change surface**：当前 task 允许触达的文件 / 调用点 / 行为切片范围。优先从 plan 的 `Files` / `Scope Boundaries` / `Implementation Units` 字段派生；plan 未覆盖或粒度不足时,由实现者在 Phase 1 显式补充并写入 task,不允许静默扩张。
- **materially different approaches**：会影响行为契约、API shape、数据结构或错误语义的不同实现路径。仅在命名、拆分粒度、编排顺序上不同的候选方案不算,不触发 R5 的 tradeoff 声明要求。
- **own-wave orphan**：本次改动自身引入又随即失效的 imports / variables / functions。属于本次改动的 "own mess",必须清理。区别于 pre-existing dead code——后者不在本计划范围内。

## Not In This Plan

以下内容不在本计划内，因为当前仓库里已有足够覆盖，或继续改造只会重复建设：

- `spec-debug`
  - 现有 `skills/spec-debug/SKILL.md` 已包含 causal-chain gate、prediction、minimal root-cause fix、test-first 闭环
  - 对应 `tests/unit/spec-debug-contracts.test.js` 已把这些合同作为既有事实守护
- `resolve-pr-feedback`
  - 当前 `skills/resolve-pr-feedback/SKILL.md` 已有 validity-first、cluster dispatch、conflict avoidance、verify loop
- `spec-code-review`
  - 继续由 `docs/plans/2026-04-18-001-refactor-karpathy-execution-contract-integration-plan.md` 作为 review-side 已完成子集
  - 本计划不新增 review-side 结构，只把它作为现有 secondary detection surface 使用
- `spec-brainstorm`、`spec-plan`、`using-spec-first`、`spec-graph-bootstrap`、`spec-graph-bootstrap`、`spec-compound`、`spec-compound-refresh`
- **全局 Karpathy 技术债治理层**：不引入

> **Note on "mention unrelated dead code"**:Karpathy Principle 3 的双向义务——(a) 不删 pre-existing dead code、(b) **mention** 它——本计划只承担 (a)(见 R2 后半)。(b) 的 mention 职责不纳入本 plan,理由:mention 动作的自然落点是 `spec-code-review` 的 `residual_risks`(已由 001 plan 提供承载结构)或 PR-level workflow(如 `resolve-pr-feedback` / PR description),不在 `spec-work` execution loop 的 scope 内。显式标注避免后续 reviewer 误判为漏项;如未来确认 mention 需进入 execution 合同,独立立项,不回填本 plan。

## Problem Frame

当前 `spec-work` / `spec-work-beta` 已经具备以下关键合同：

- 遇到不清楚的地方先澄清
- 先建立 verification checklist 再开工
- test-first 单元不得跳过 failing test
- 不按 change-surface baseline 误扩必跑验证
- 持续测试、持续 review、跟随现有模式

因此本计划不重复补这些规则。

当前仍值得补强的五类约束：

1. **Change traceability**：当前合同强调 follow existing patterns，但没有把"每条改动必须能追溯到当前 task / plan / user request"写成明确约束。
2. **Opportunistic cleanup boundary**：当前有 simplify as you go，但缺"发现顺手优化机会时默认不并入当前任务，除非是 direct dependency"的收口语句；同时缺对"本次改动造成的 own-wave orphan 必须清理"这一面的明示(Karpathy Principle 3 后半)。
3. **Scope expansion classification**：当前允许 `Create new tasks if scope expands`，但缺"新增项必须区分 required dependency 与 separate follow-up"的显式分类要求。
4. **Implementation-time Simplicity First**：当前有 "simplify as you go"，但还缺更靠前的显式实现约束：不做超出请求的功能、不为单次使用代码引入抽象、不引入未请求的 configurability，以及不为没有具体失败模式的场景添加 speculative guards / fallback。
5. **Pre-action tradeoff declaration**：当前合同只覆盖 "unclear 先 clarify" 场景,缺少 "路径明确但多选" 场景下的 tradeoff 声明要求。Karpathy Principle 1 的收缩版,不与 "Start Fast, Execute Faster" 冲突(触发条件严格限定为实质不同路径)。

## Requirements Trace

- R1. `spec-work` / `spec-work-beta` 必须要求实现者在执行前识别当前 task 的 allowed change surface(哪些文件和行为切片在范围内),并让每条改动可追溯到 plan 的 implementation unit / task(**primary trace target**);当改动来自 plan 未覆盖的用户本轮请求临时调整时,可退而追溯到该请求(**secondary trace target**)。primary 路径永远优先于 secondary,不得以 user request 作为跳过 plan 层的借口。
- R2. 默认禁止把与当前任务无直接关系的 cleanup、refactor、抽象化、future-proofing 并入同一改动;只有 direct dependency 才允许纳入,需显式说明原因(R2 前半 - opportunistic cleanup boundary)。**配套义务**:本次改动造成的 own-wave orphan(自己引入又随即失效的 imports / variables / functions)必须清理;pre-existing dead code 不得在未被请求时顺手删除(R2 后半 - own-wave orphan obligation)。
- R3. 若执行过程中 scope expands，必须把新增工作显式归类为 `required dependency` 或 `separate follow-up`，不得静默扩展当前任务边界。
- R4. `spec-work` / `spec-work-beta` 必须显式要求实现期优先选择当前任务需要的最小代码：不做超出请求的功能，不为单次使用代码引入抽象，不引入未请求的 configurability，也不为缺少具体失败模式的路径添加 speculative guard / fallback。R4 的 "speculative guards" 约束仅针对**新增**无明确失败场景的防御代码,不削弱现有 `System-Wide Test Check` 对已存在 failure path 的探查义务。
- R5. 当存在 2 条及以上 materially different approaches 时，必须先显式说明 tradeoff，再继续执行；单一路径的直白任务不触发这条要求。
- R6. `spec-work` 与 `spec-work-beta` 的 execution-boundary wording 必须保持一致；source、mirror、contract tests 同步更新。

## Required Changes

### `spec-work` and `spec-work-beta`

**Goal**

把执行边界和实现期 Simplicity First 补到真正的实现主路径里，不重复改写已有的 clarify、verification、test-first 合同，不把 workflow 改成机械流程机。

**Must Add**

- 在 Phase 1 阶段显式识别当前 task 的 allowed change surface(对应 R1)
- 每条改动必须能追溯到当前 task / implementation unit / 用户请求;primary 路径优先于 user request(对应 R1)
- 发现顺手优化机会时默认不并入;只有 direct dependency 才允许纳入,需说明理由(对应 R2 前半)
  - **Plan-level disambiguation(不入 skill wording)**:与现有 `Simplify as You Go` 不冲突——后者限于本 wave 内自身产生的重复(consolidate own-wave duplicates),R2 前半的禁令针对 pre-existing 或未触达代码的 adjacent cleanup。两条合同语义正交,不相互覆写。此解释仅作为 plan/reviewer 的上下文,实现者**不应**把这段说明复制进 skill wording。
- 本次改动造成的 own-wave orphan(自己引入又随即失效的 imports / variables / functions)必须清理;pre-existing dead code 不得顺手删除(对应 R2 后半)
- scope expands 时新增 task 必须显式归类为 `required dependency` 或 `separate follow-up`(对应 R3)
- 明确规定实现只做当前 task 真正需要的最小代码:不新增未请求功能,不为单次使用代码引入抽象,不新增未请求的 configurability,也不为缺少具体失败模式的路径添加 speculative guard / fallback(对应 R4)
- 面对 ≥2 条 materially different approaches 时,先列出选项和 tradeoff 再执行;单条明确路径不触发(对应 R5)

**Must Not Add**

- 不重复新增"遇到歧义先澄清"这一类已有合同
- 不重复新增"先有 verify signal 再开工"这一类已有合同
- 不把 `Simplify as You Go` 改写成鼓励跨边界清理的 wording
- 不引入新 telemetry、runtime state、gate orchestration

**Files**

- `skills/spec-work/SKILL.md`
- `skills/spec-work-beta/SKILL.md`
- `docs/10-prompt/skills/spec-work/SKILL.md`
- `docs/10-prompt/skills/spec-work-beta/SKILL.md`
- `tests/unit/spec-work-contracts.test.js`
- `tests/unit/spec-work-beta-contracts.test.js`
- `CHANGELOG.md`(按仓库治理铁律——任何源码改动必须同步一条匹配记录;粒度由实际 commit 范围决定,不锁 Step 数)

**Approach**

只改已有 section,不新增独立 section。总新增内容不超过 **14 行**(R2 orphan 配套条款与 R2 前半说明并入后的新预算)。措辞保持与 skill 现有语言风格一致(中英混合),不引入全新结构。

- **`Phase 1 -> Read Plan and Clarify`** 是 R1 / R5 的主落点:
  - R1 前半(识别 surface)推荐语义锚点组合 + 自由措辞:skill 文本须同时承载 `allowed change surface` 概念与"识别/记录动作"动词(如 `identify`、`record`、`note`)
  - R1 后半(追溯)推荐精确 wording(承接源 skill §3):`Every changed line must trace to a plan implementation unit, task, or the current user request.`
  - R5 推荐精确 wording(承接源 skill §1 收缩版):`If multiple materially different approaches exist, state the tradeoffs before proceeding.`
- **`Phase 2 -> Task Execution Loop`** 是 Simplicity First 与 R2 前半的主落点:
  - R4 推荐精确 wording(承接源 skill §2 核心):`Implement the minimum code the current task requires. Do not add single-use abstractions, unrequested configurability, or speculative guards for failure modes the current task does not justify.`
  - **R4 carve-out 不下沉 skill**:Requirements Trace R4 含"speculative guards 不削弱 System-Wide Test Check 对已存在 failure path 的探查"的 carve-out,该 carve-out 由 R4 在 **plan 层**承担,不进 skill wording,避免与 skill 内现有 System-Wide Test Check 合同产生措辞冗余。skill 读者按现有 System-Wide Test Check 段继续执行即可。
  - R2 前半推荐语义锚点组合 + 自由措辞:skill 文本须同时承载 `opportunistic`(或 `incidental`)、`direct dependency`、`bundle`(或 `include`)三个概念;具体句式不做强制
  - R2 后半推荐语义锚点组合 + 自由措辞(own-wave orphan):skill 文本须同时承载 `orphan`(或 `unused imports/variables`)、`pre-existing`、禁令动词(`do not` / `must not`)三个概念
- **`Phase 2 -> Simplify as You Go`** 只做收口,不重复承担主合同:
  - 推荐补一条轻量回看语句:若当前实现能在不改变任务边界的前提下明显更简单,应优先收敛到更简单版本
- **`Phase 2 -> Track Progress`** 是 R3 的落点:
  - R3 推荐语义锚点组合 + 自由措辞:skill 文本须同时出现 `required dependency` 与 `separate follow-up` 两词(Definitions 已定义的二元分类标签),句式可由实现者选择

**Verification**

**Wording 精度分层**——只有承载外部源 skill 原语义的条款使用精确 wording(防漂移必要);plan 现场造的 wording 使用"**语义锚点组合**"断言,避免把"英文句子复刻"误当成实现目标。

- `tests/unit/spec-work-contracts.test.js` 对下列合同内容做 **section-aware 断言**,避免宽泛关键词假阳性;**不允许退化为单关键词 substring 断言**。具体实现方式(是否引入 section slicer、使用何种 verbatim/锚点组合 API)由 implementer 决定。
- **精确 wording 断言**(承接 Karpathy 源 skill 原语义,必须 verbatim):
  - R1: `Read Plan and Clarify` 段包含 `Every changed line must trace`(近源 skill §3 原文)**且**同段附近同时包含 `implementation unit`(锚定后半句语义,防断言只匹配前缀——避免 `Every changed line must trace to the moon` 通过)
  - R4: `Task Execution Loop` 附近包含精确 wording `Implement the minimum code the current task requires.`(承接源 skill §2 核心)
  - R5: `Read Plan and Clarify` 段包含精确 wording `If multiple materially different approaches exist, state the tradeoffs before proceeding.`(源 skill §1 收缩版)
- **语义锚点组合断言**(plan 现场造的 wording,守边界不守句子):
  - R1: `Read Plan and Clarify` 段同时出现 `allowed change surface` + `identify`(或等价动词,如 `record`/`note`)——锚"识别 surface"语义而不锁句子
  - R2 前半: `Task Execution Loop` 附近同时出现 `opportunistic` + `direct dependency` + `bundle`(或 `include`)三词——锚"不并入非 direct dependency 的 cleanup"语义
  - R2 后半: `Task Execution Loop` 附近同时出现 `orphan`(或 `unused imports/variables`)+ `pre-existing` + `do not`(或 `must not`)——锚"清理 own-wave orphan、不触 pre-existing"双向义务
  - R3: `Track Progress` 附近同时包含 `required dependency` + `separate follow-up`(plan Definitions 定义的二元分类,属于语义锚而非造句)
  - R4 辅助: 同 R4 精确 wording 段同时出现 `single-use abstractions` + `unrequested configurability` + `speculative guards` 三词(源 skill 列举项,按组合锚定而非整段复刻)
- **mirror 同步断言**(对齐仓库现行做法,见 `tests/unit/spec-work-contracts.test.js:118-142`):
  - 对 `docs/10-prompt/skills/spec-work/SKILL.md` **重复执行上述精确 wording + 语义锚点组合断言**(独立 `describe` / `test` block,断言内容与 source 同步)
  - 不允许只断言 source 而放弃 mirror——mirror drift 必须在 CI 层可检出,人工 diff 仅作最后一道兜底
- `tests/unit/spec-work-beta-contracts.test.js`:对 beta skill + beta mirror 做同样分层断言(R6 - source/mirror/test 一致性)
- `npm run test:smoke`:验证 runtime copy 与 source skill 无漂移
- 人工 diff(**目录级递归**,与 Done Signals 一致):`diff -rq skills/spec-work/ docs/10-prompt/skills/spec-work/` 与 beta 对应 mirror 须返回静默(捕捉 SKILL.md 及 references/ 下任何子文件漂移,byte-equal mirror 最终兜底)

## Implementation Order

1. `spec-work`
2. `spec-work-beta`

**Precondition for step 2**:修改 `spec-work-beta` 前,先 diff `skills/spec-work/SKILL.md` 与 `skills/spec-work-beta/SKILL.md`,标注哪些差异是有意为之(beta 特有实验路径)、哪些应同步。只同步 execution-boundary delta;保留 beta 特有的合理分叉。diff 结论由 implementer 按自身习惯记录(PR description / scratch note / commit message 任一载体即可),不强制固定载体,也不列入 Done Signals。

## Cross-Cutting Rules

- 只改已有 section，避免新增大段口号式 prompt
- 只补 delta wording，不复述当前 skill 已存在的合同
- `skills/` 是唯一真源；mirror 必须同步修改
- 每个改动单元都必须同时更新 source、mirror、unit contract tests
- 由于实现会修改 `skills/` 与 `tests/unit/` 下的源码文件，必须按仓库治理同步更新 `CHANGELOG.md`
- 是否需要更新 `docs/08-版本更新/README.md` 按“significant workflow addition”标准单独判断；本计划不默认把这轮 wording 收紧视为该级别变更
- 每个改动单元都必须跑 `npm run test:smoke`，因为本轮改动会影响 runtime skill copy

## Done Signals

1. `spec-work` 与 `spec-work-beta` 的 execution-boundary delta 全部完成
2. 对应 unit contract tests(含上述 section-aware assertion)通过
3. `npm run test:smoke` 通过,证明 runtime copy 与 source skill 没有漂移
4. 相关源码改动附带满足仓库治理要求的 `CHANGELOG.md` 记录
5. `diff -rq skills/spec-work/ docs/10-prompt/skills/spec-work/` 与 beta 对应 mirror 返回静默(source/mirror 目录级递归 byte-equal,与 Verification 使用同一粒度)

## Non-Goals

- 不新增全局 `karpathy-guidelines` skill
- 不做全链路 Karpathy rollout
- 不改 `spec-debug`
- 不改 `resolve-pr-feedback`
- 不改 `spec-code-review` 已完成的 change-discipline 子计划
- 不改 `spec-brainstorm` 和 `spec-plan`
- 不引入新的 runtime contract、telemetry、quality gate state
