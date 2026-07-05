---
title: "feat: per-turn 状态注入(对标 Trellis)可行性评估与方向决策"
type: feat
status: completed
date: 2026-06-15
target_repo: spec-first
spec_id: 2026-06-15-002-per-turn-injection-evaluation
plan_depth: standard
origin: docs/项目审查/2026-06-15-行业对标研究档案.md
referenced_reviews:
  - path: docs/项目审查/2026-06-15-行业对标研究档案.md
    role: origin
    scope: deferred
    deferred_findings: ["BENCH-borrow-per-turn-injection"]
  - path: docs/项目审查/2026-06-15-项目Review与优化方案.md
    role: origin
    scope: deferred
    deferred_findings: ["P1-per-turn-injection"]
---

# feat: per-turn 状态注入(对标 Trellis)可行性评估与方向决策

> **本 plan 是「决策/评估 plan」,不是直接 build plan。** 它的目标是诚实评估对标 Trellis 的 per-turn 状态注入是否该借、怎么借,并给出方向决策,把 P1 闭环收口为「带理由的决策」而非「硬塞一个借鉴」。这正是角色契约 §7「借鉴对标项目时是否同时引入它牺牲的边界」的一次实地应用。

> **决策结论:DEFERRED(reasoned defer,2026-06-15)。** U1-U4 评估完成。U2 痛点证据检索为空(`docs/solutions/` + `docs/12-bug分析/` 对 context 压缩漂移零命中;origin 自标 advisory),按 U2 证据门与角色契约 §10「能力↔采纳平衡 + aspirational 推进义务」,**不进入开发**。Trellis 式有状态 per-turn 注入因依赖当前 phase 状态机而撞 no-state-machine 红线,明确**不采纳**;轻量 native 变体(U3)因痛点无证据**暂缓**,非否决。Codex 宿主已支持 `UserPromptSubmit`,但 spec-first 当前 Codex runtime 只投射 `SessionStart`;本 plan 不把"未接入/未验证"误写成"宿主不支持"。两 origin finding 在 `referenced_reviews` 转 `deferred_findings`。**重启条件:** spec-first 侧累计出现 ≥3 条 confirmed context-drift / workflow-phase 漂移失败记录(落 `docs/solutions/` 或 `docs/12-bug分析/`,标 context-drift 关键词)时重启本评估。这是合法闭环,不是无限期搁置。

## Summary

行业对标档案 §12 把 **per-turn / attention hook 状态注入**(对标 Trellis / pro-workflow / planning-with-files)列为 P1 借鉴项:用 host hook 每轮重注当前 task/phase breadcrumb,抗 context 压缩漂移。规划阶段取证后发现,**直接照搬 Trellis 版本撞一条架构红线,并带来一条需要单独验证的双宿主投射边界**:

1. **当前 spec-first 投射不对称(confirmed):** `templates/codex/hooks/hooks.json` 只声明 `SessionStart`,但 Codex 宿主本身已支持 `UserPromptSubmit`。这不是宿主缺能力,而是 spec-first 当前未接入 Codex per-turn handler;若未来要做,需另行验证 Codex `UserPromptSubmit` 输入/输出语义、trust flow、runtime 投射和 contract tests。
2. **与 no-state-machine 哲学冲突(confirmed):** Trellis 的每轮面包屑能工作,是因为它有 `task.json` 状态机存「当前 phase」。spec-first **刻意不存 per-unit 进度**(spec-plan skill 自述「Plans do not carry per-unit progress state — progress is derived from git by spec-work」;角色契约 §3「不画死状态图、进度由 git 派生」)。要每轮注入「当前 phase」,要么逼 spec-first 引入它拒绝的状态机,要么每轮从 git 模糊推断。

**关键正面发现:** spec-first **已有此机制的右尺寸 native 版本**,且不止一处——(a)`templates/claude/hooks/spec-plan-guard` 用 Claude `UserPromptExpansion` 事件,在 `spec-plan` 展开时注入 best-effort 注意力提醒,**显式声明无硬保护、无状态**(`spec-plan-guard:21` 原文 "best-effort attention reminder only; this hook provides no hard write protection.");(b)`templates/{claude,codex}/hooks/session-start` 均已有 `startup-reminder --claude|--codex` CLI 注入路径,每会话喂 workflow-entry 注意力上下文。这说明 spec-first-native 的「抗漂移注入」形态是:**按命令展开 / 按会话启动注入、无状态、best-effort、诚实降级**——而不是 Trellis 的有状态每轮注入。

**最终推荐:** 不采纳 Trellis 式有状态 per-turn 注入。**鉴于规划期检索证实痛点证据为空(详见 Direct Evidence / U2)**,按 U2 门与 §10,结局是 **带重启条件的 reasoned defer**——而非"倾向采纳变体"。仅当 U2 翻出 confirmed 痛点证据,才触发轻量 native 变体重新评估;届时必须区分 Claude `UserPromptExpansion` 命令展开提醒与 Codex `UserPromptSubmit` 每轮提醒的不同宿主语义。让排序服从证据门控,不让变体的优雅压过门控——优雅恰是 §10 警惕的 rationalization。

---

## Direct Evidence

- target_repo: spec-first
- source_refs: `templates/codex/hooks/hooks.json`、`templates/{claude,codex}/hooks/session-start`、`templates/claude/hooks/spec-plan-guard`、`src/cli/claude-settings.js`(hook 注册)、`src/cli/adapters/codex.js`(当前只投射 managed SessionStart)、`docs/solutions/tooling-decisions/codex-cli-supports-lifecycle-hooks-2026-05-26.md`(Codex `UserPromptSubmit` 支持)、OpenAI Codex hooks docs / `openai/codex` `HOOK_EVENT_NAMES`(2026-06-15 核查)、`docs/项目审查/2026-06-15-行业对标研究档案.md`(§3 Trellis、§8 pro-workflow mechanism)、`docs/10-prompt/结构化项目角色契约.md`(§3 no-state-machine、§7 借鉴边界)
- current_revision: leo-2026-06-15-review-all 分支
- worktree_dirty: true
- discovery_methods: 读 hooks.json/spec-plan-guard/session-start source、`grep UserPromptSubmit/UserPromptExpansion/SessionStart`、对标档案、Codex official hooks docs、`openai/codex` `codex-rs/hooks/src/lib.rs`
- tests_or_logs: 未跑(评估阶段)
- confidence: 高(no-state-machine 冲突 confirmed;spec-first 当前 Codex runtime 只投射 SessionStart confirmed;Codex 宿主支持 `UserPromptSubmit` confirmed;native 先例 confirmed)
- limitations: 「抗 context 压缩漂移」痛点证据**为空,非仅薄**——规划期检索 `docs/solutions/`(递归 22 文件)与 `docs/12-bug分析/`(2 文件)对 context 压缩漂移 / attention 漂移 / 忘记 phase / per-turn **零命中**;且 origin 自身把「spec-first 抗 context 压缩弱」判断标为 **(advisory)**(对标档案 §3 Trellis 领先项),「双宿主 hook 支持差异需验证」列为已知未决风险(对标档案 §12 P1 行)。即此痛点从一开始是对标推断假设,非 spec-first 侧实证。Codex `UserPromptSubmit` 虽可用,但 spec-first 未接入、未验证其输出语义和 trust/runtime 投射,本 plan 不把能力存在等同于已交付能力。

---

## Context & Research

**对标机制(see origin §3/§8):**
- Trellis:UserPromptSubmit hook 每条用户消息触发,解析 active task status(来自 `.trellis/.runtime/sessions/<key>.json` + task.json)注入 phase 指令。**hook 是 enforcer,不靠 AI 记忆。** 依赖显式 task 状态机。
- pro-workflow:session-start replay + 37 hook,UserPromptSubmit 自动注入 top-3 wiki hit。同样有持久 store。
- planning-with-files:PreToolUse hook 每次工具调用前 `cat task_plan.md | head -30` 进窗口。依赖单一 active plan 文件。

**三者共性:** 每轮/每工具注入都**依赖一个显式的「当前状态」真相源**(task.json / session 文件 / 单一 active plan)。这正是 spec-first 没有、且刻意不要的东西。

**spec-first 现状(confirmed):**
- hook 基建已有:Claude `session-start`(注入 using-spec-first bootstrap + `startup-reminder --claude` 每会话注意力上下文,见 `session-start:50-57`)+ `spec-plan-guard`(`UserPromptExpansion`,spec-plan 展开时 best-effort 注意力提醒);Codex `session-start`(当前 spec-first `hooks.json` 仅投射 SessionStart)。Codex 宿主支持 `UserPromptSubmit`,但 spec-first 当前没有 managed per-turn hook handler。
- 无「当前 active workflow/phase」持久状态;进度由 git 派生。
- `spec-plan-guard` + `session-start` 的 `startup-reminder` 是 native 右尺寸先例:无状态、按命令展开 / 按会话启动、显式 best-effort、no hard protection。

**§7 边界判断:** 直接借 Trellis 版会同时借入它牺牲的边界(必须有 task 状态机)。这是教科书级的「借能力连边界一起借进来」。轻量 native 变体(扩展 UserPromptExpansion guard)不引入状态机,因此不牺牲边界。

---

## Goals / Non-Goals

**Goals:**
- 给出明确方向决策:采纳轻量 native 变体 / 带理由 defer(以证据决定,不预设)。
- 把决策与理由落盘,使 P1 finding 闭环可追踪(addresses_findings)。
- 若决策为「做」,给出轻量变体的 implementation units(条件性)。

**Non-Goals:**
- 不引入 task/phase 持久状态机(角色契约红线)。
- 不在本 plan 内新增 Claude/Codex per-turn 注入;Codex 宿主能力存在,但本评估不因可做而绕过 U2 痛点证据门。
- 不在本 plan 内实现(评估 plan;实现待决策为「做」后由 spec-work 承接)。
- 不照搬 Trellis/pro-workflow 的持久 store / 多 hook 体系。

---

## 评估单元(Evaluation Units)

> 这些是**评估/决策**单元,不是 build 单元。每个单元产出一个判断,汇总成 U4 的方向决策。

### U1. 确认双宿主能力边界与降级形态

**Goal:** 钉死「per-turn 注入在双宿主上各能做到什么」。
**Files(只读):** `templates/codex/hooks/hooks.json`、`templates/claude/hooks/*`、`src/cli/claude-settings.js`、`src/cli/adapters/codex.js`
**Approach:** 区分宿主能力与 spec-first 当前投射:Claude 当前 source 已有 `UserPromptExpansion` `spec-plan` guard;Codex 宿主支持 `UserPromptSubmit`,但 spec-first 当前 Codex runtime 只投射 `SessionStart`。产出:能力矩阵 + 若做轻量变体时 Codex parity/降级声明文案(响亮约定,不静默)。
**Verification:** 能力矩阵有 source 依据;降级形态明确。

### U2. 判定「抗漂移」痛点是否被证据支持

**Goal:** 回答「spec-first 是否真有 context 压缩导致 workflow phase 漂移的高频痛点」。
**Approach:** 检索 docs/solutions、docs/项目审查、docs/12-bug分析 是否有相关失败记录;评估 session-start bootstrap + `startup-reminder`(已每会话注入)是否已大部分覆盖。**若无证据支持痛点,按角色契约 §10 aspirational 推进义务,倾向 defer 而非造能力。**
**规划期已得结论(U4 已复核):** 证据 = **空**。`docs/solutions/`(递归 22 文件)+ `docs/12-bug分析/`(2 文件)对 context 压缩漂移 / attention 漂移 / 忘记 phase / per-turn **零命中**;origin 把痛点标 **(advisory)**。故痛点分级 = **无证据(对标推断假设)**。据此默认走 defer,并设**重启阈值**:当 spec-first 侧出现 **≥3 条** context-drift / workflow-phase 漂移的 confirmed 失败记录(落在 docs/solutions 或 docs/12-bug分析)时,重启本评估。
**覆盖度验证产物(支撑「已覆盖」判断,不可空口断言):**

| 覆盖项 | Trellis 每轮 breadcrumb | spec-first 当前机制 | 结论 |
|--------|--------------------------|---------------------|------|
| workflow 入口治理提醒 | 每轮按 active task/phase 注入 | `templates/{claude,codex}/hooks/session-start` 注入 using-spec-first 指针;`AGENTS.md`/`CLAUDE.md` managed block 常驻 | 已覆盖入口级注意力,不是每轮 |
| 版本/runtime readiness 提醒 | 不属于 Trellis phase breadcrumb 核心 | `startup-reminder --claude|--codex` 通过 SessionStart best-effort 注入 | 已覆盖会话启动级提醒 |
| 当前 task / 当前 phase | 读 `.trellis/.runtime/sessions/<key>.json` + `task.json` 注入 | spec-first 无 active workflow/phase 状态源;进度由 git/diff/work artifact 判断 | 未覆盖,且直接覆盖会引入状态机红线 |
| 每条用户消息重注 | `UserPromptSubmit` 每轮触发 | spec-first 当前无 managed per-turn hook;Codex 宿主支持 `UserPromptSubmit`,但未接入;Claude 当前 native 先例是 `UserPromptExpansion` 命令展开 guard | 未交付;因 U2 痛点无证据暂缓 |
| compact 后动态恢复 phase | 按持久 task/session 状态可恢复 | 依赖 checked-in instructions + SessionStart/host 恢复行为;无 phase 状态 | 未覆盖;需 confirmed drift 失败再重启评估 |

**Verification:** 给出 痛点 confirmed / advisory / 无证据 的分级结论 + 覆盖度对照表 + 重启阈值。

### U3. 设计轻量 native 变体(条件性,仅当 U2 支持)

**Goal:** 若痛点成立,设计不引入状态机的轻量 native 变体。
**Approach:** 候选 = 扩展 `UserPromptExpansion` guard 模式:在更多公开 workflow 命令展开时,注入该 workflow 的关键边界提醒(无状态,从 SKILL.md/契约静态取,不读「当前进度」)。Codex 若纳入同轮设计,应单独验证 `UserPromptSubmit` 是否适合承载静态 workflow-boundary reminder,不得假设它与 Claude `UserPromptExpansion` 等价。复用 spec-plan-guard 的 best-effort 声明体例。明确:这是 attention 提醒,非 enforcer,非 gate。
**Files(若实现):** `templates/claude/hooks/`(新增/扩展 guard)、`src/cli/claude-settings.js`(注册)、对应 contract test;若做 Codex parity,另需 `templates/codex/hooks/`、`src/cli/adapters/codex.js`、Codex hook trust/output contract tests。
**Verification:** 设计不含任何 per-unit/phase 状态读取;Codex parity/降级声明基于实测就位。

### U4. 方向决策

**Goal:** 汇总 U1-U3,给出 采纳轻量变体 / defer 的最终决策 + 理由,并据此更新本 plan status 与 origin 闭环(addresses_findings 或转 deferred_findings)。
**Approach:** 决策矩阵:痛点证据 × 双宿主代价 × 边界契合度。若 defer,在 review-closure 中把 finding 标 deferred_findings + 重估条件(≥3 条 context-drift 失败记录时重启)。
**§10 推进义务(防 defer 退化为永久免责声明):** defer 不是终点。U4 闭环必须显式回答「痛点证据如何从空变 confirmed」——给出**数据采集路径**:context-drift / workflow-phase 漂移的失败一旦发生,由 `spec-debug` 或 `spec-compound` 落盘到 `docs/12-bug分析/` 或 `docs/solutions/`(标注 context-drift 关键词);累计 ≥3 条即触发本评估重启。无此路径,defer 即 §10 警告的「机制就位永久搁置」,不合法。
**Verification:** 决策落盘,P1 闭环状态明确,且 defer 分支带可执行的数据采集路径 + 重启阈值。

**最终决策(2026-06-15):DEFERRED — reasoned defer。**

| 决策维度 | 结论 | 依据 |
|----------|------|------|
| 痛点证据(U2) | **无证据** | `docs/solutions/`(递归 22 文件)+ `docs/12-bug分析/`(2 文件)对 context 压缩漂移 / attention 漂移 / 忘记 phase / per-turn 零命中;origin 自标 (advisory) |
| Trellis 式有状态注入 | **不采纳(否决)** | 撞 no-state-machine 红线(契约 §3);要注入当前 phase 必须引入或推断 active state |
| Codex per-turn 宿主能力 | **存在但未交付** | 官方 Codex hooks / `HOOK_EVENT_NAMES` 确认 `UserPromptSubmit`;spec-first 当前 `templates/codex/hooks/hooks.json` 只投射 `SessionStart` |
| 轻量 native 变体(U3) | **暂缓(非否决)** | 设计方向成立(静态 reminder,无状态),但 U2 痛点无证据,按 §10「无证据则 defer」不进开发;若重启需重新评估 Claude `UserPromptExpansion` 与 Codex `UserPromptSubmit` 的不同语义 |
| origin 闭环 | **转 deferred_findings** | `referenced_reviews` 两 origin entry `scope: deferred` + `deferred_findings`,plan `status: completed` |

**重启条件:** spec-first 侧累计出现 **≥3 条** confirmed context-drift / workflow-phase 漂移失败记录(经 `spec-debug` 或 `spec-compound` 落 `docs/solutions/` 或 `docs/12-bug分析/`,标 context-drift 关键词)时,重启本评估并重跑 U2→U4。届时若证据成立,U3 设计可直接承接 spec-work 实现。

**为何 `status: completed` 而非 `active`:** 本 plan 是评估 plan,其交付物是 U4 决策本身——决策已产出(defer),评估即完成。实现是条件性后续,由重启条件门控,不挂在本 plan 的 active 状态上。

## System-Wide Impact

- **双宿主:** 当前 spec-first runtime 投射不对称(Codex 仅 SessionStart;Claude 另有 `spec-plan` UserPromptExpansion guard)。Codex 宿主已支持 `UserPromptSubmit`,但采用前必须补 source/runtime/trust/output contract 验证,不把"可用"伪装成"已交付"。
- **runtime 边界:** 若实现,改 `templates/` + CLI 注册 source,经 `spec-first init` 生成,不手改 mirror。
- **角色契约:** 本 plan 是 §7 借鉴边界判断 + §10 aspirational 推进义务的实地应用,结论须可回链。
- **CHANGELOG:** 决策落盘时需条目(治理决策,docs 层)。

---

## Risks & Anti-Patterns

| 风险 | 缓解 |
|------|------|
| 为「对标有就要补」而引入 task 状态机 | U4 红线:no-state-machine 优先于功能对齐(§3) |
| 把 Codex 未接入误写为宿主不支持,或为双宿主对称草率接入 per-turn | U1 区分 host capability 与 spec-first projection;若未来实现,先补 Codex hook contract test |
| 痛点无证据仍硬做(造 aspirational 空能力) | U2 痛点门 + §10 推进义务:无证据则 defer |
| 轻量变体悄悄长成 enforcer/gate | U3 复用 spec-plan-guard best-effort 体例,显式非 gate |

---

## 落地顺序

U1(能力边界)→ U2(痛点证据)→ U3(条件性设计)→ U4(决策)。决策为「做」则由 spec-work 承接 U3 实现;为「defer」则更新 review-closure 为 deferred_findings + 重估条件。

## 验证计划

- 评估阶段:source 只读核对(U1-U3)。
- 若实现轻量变体:新增 hook contract test + `spec-first init` 双宿主投射验证 + claude-settings/codex-adapter hook 注册测试。

## 闭环

以行业对标档案 + review 报告为 origin。U4 决策后:采纳则推进实现并标 RESOLVED;defer 则在 referenced_reviews 转 deferred_findings 并记重估条件——二者皆为合法闭环。
