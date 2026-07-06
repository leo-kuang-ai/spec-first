---
date: 2026-06-08
topic: using-spec-first-injection-redesign
spec_id: 2026-06-08-001-using-spec-first-injection-redesign
origin: 对照 awesome-agent-harness 中 Superpowers(obra/superpowers)注入机制的 brainstorm
---

# 重构 using-spec-first 会话启动注入逻辑

## Summary

把 spec-first 的会话启动注入从「~10 行轻量指针 block」升级为「~80 行核心决策集全文在场」,借鉴 Superpowers 的**全文注入机制**(启动即把路由决策逻辑放进上下文,不依赖模型主动去读完整 SKILL),但**不借**其「1% 即必须 invoke」的强制哲学——保留 spec-first「按意图分流、不强制」的定位。

---

## Problem Frame

`using-spec-first` 是 spec-first 的 entry governor,完整路由策略写在 `skills/using-spec-first/SKILL.md`(324 行)。但会话启动时,两宿主的注入路径(Claude SessionStart hook 运行时读 `CLAUDE.md` 的 bootstrap block;Codex 读 `AGENTS.md` 同款 block,SessionStart hook 修复后亦可注入)**注入的只是 ~10 行的轻量 router block**,其核心内容是一句「完整路由策略在 `skills/using-spec-first/SKILL.md`」。

这意味着:模型在会话启动时**只拿到一个指向 324 行 SKILL 的指针,而非路由决策逻辑本身**。模型是否真去读那 324 行,取决于它的自觉与当时上下文——大多数情况下它不会主动读,于是 324 行里关于「什么算 substantial work、何时该进 workflow、意图如何映射到入口、哪些是该停下的合理化红旗」的判断纲领,**大部分时候根本没进上下文**。

对照证据(2026-06-07 本仓库对 Superpowers 的源码深读,见 `docs/09-业界借鉴/2026-06-07-awesome-agent-harness-Reference类补充深读.md` 与主报告):Superpowers(awesome-agent-harness star 最高项目)的 SessionStart hook 直接把 `using-superpowers/SKILL.md` **全文 117 行注入** `additionalContext`,使其路由/技能契约在会话启动即确定性在场,不依赖模型主动加载。spec-first 与之机制同构(SessionStart + additionalContext + 双宿主),但注入的是指针而非策略——这是「路由可能漏(该进 workflow 时没进、或在裸对话里直接动手)」的**结构性根因,而非哲学太松**。

> 关键澄清:本重构**不反转** spec-first 的路由哲学。`using-spec-first` 现有 Hard Rule 明文拒绝 Superpowers 的「1% 即必须 invoke」规则,该拒绝是有意的差异化决策(见 Key Decisions),本次保留。借的是 Superpowers 的**注入机制(全文在场)**,不是它的**强制哲学**。

---

## Actors

- A1. 顶层编排 agent(Claude Code / Codex 主会话):会话启动时接收注入的 bootstrap block,据此对当前用户意图做路由判断。本重构的主要受益者。
- A2. bounded subagent / leaf reviewer / worker agent:被派遣执行特定 bounded 任务,**不应**重新触发入口路由——注入内容必须显式豁免这类 agent(对应现有 Scope Guards 的 subagent 条款)。
- A3. 开发者:会话发起者;也是 `CLAUDE.md`/`AGENTS.md` 的日常读者,会持续看到扩大后的常驻 block。

---

## Key Flows

- F1. 会话启动注入(核心流)
  - **Trigger:** Claude/Codex 会话启动,SessionStart hook 触发(或 Codex 经 AGENTS.md 被动加载)。
  - **Actors:** A1
  - **Steps:** hook 运行时读 `CLAUDE.md`/`AGENTS.md` 的 bootstrap block(start..end marker)→ 注入为 `additionalContext` → A1 启动即拥有核心决策集(Scope Guards + Decision Output Contract + Routing Priority/Route Map + Red Flags)。
  - **Outcome:** A1 无需主动读 324 行 SKILL,即可对当前意图做正确路由判断;需要执行细节时再按指针读 SKILL 全文。
  - **Covered by:** R1, R2, R3, R6

- F2. substantial work 前的路由判断
  - **Trigger:** A1 即将开始 substantial work(改代码/文档、启动 plan/work/debug/review 等)。
  - **Actors:** A1
  - **Steps:** 依注入的 Scope Guards 判断是否 substantial → 依 Routing Priority/Route Map 把意图映射到一个入口 → 依 Red Flags 自查是否在合理化跳过路由 → 按意图分流(结果可以是「直接做」,不强制进 workflow)。
  - **Outcome:** 路由决策基于在场的策略,而非依赖模型记忆或主动加载;轻量任务/已在 workflow/subagent 场景正确豁免。
  - **Covered by:** R2, R3, R4, R5

---

## Requirements

**注入内容(核心)**
- R1. bootstrap block 从轻量 router(~10 行)扩展为**核心决策集**(目标量级 ~80 行),内容覆盖四类路由判断必需信息:(a) Scope Guards——什么算 substantial work、何时不重新分流(已在 workflow / 作为 subagent / 轻量问答);(b) Decision Output Contract——路由时输出一个入口 + 一个理由的纪律;(c) Routing Priority + Route Map——意图到当前宿主公开入口的映射;(d) Routing Red Flags——反合理化自查清单。
- R2. 注入内容必须保留 spec-first「按意图分流、不强制每任务走 workflow」的哲学;**不得**引入「1% 即必须 invoke」或等价的强制全拦截语义。
- R5. 注入内容必须保留对 bounded subagent / leaf reviewer / worker agent 的豁免语义(这类 agent 不重启路由),以及「已在公开 workflow 内不重新分流」的语义。

**注入源与机制**
- R3. 核心决策集的 source-of-truth 落在 `src/cli/instruction-bootstrap.js` 的 bootstrap body 构建逻辑(单点);经 `spec-first init` 写入 `CLAUDE.md`/`AGENTS.md` 的 managed bootstrap block(start/end marker 之间)。
- R4. hook 脚本的读取/注入逻辑**不改形态**——仍是「运行时读 instruction 文件的 marker block → 注入」;本重构只改 block 的内容量,不改 hook 脚本读取机制,亦不触碰 Codex `hooks.json` 路径/key 形态(刚于 2026-06-07 修复,见 `docs/solutions/tooling-decisions/codex-cli-supports-lifecycle-hooks-2026-05-26.md` 与 [[project-codex-hook-path-bug]])。

**一致性与边界**
- R6. 扩大后的 block 与 `using-spec-first/SKILL.md` 核心段是**同源派生**关系;必须有机制防止两者 drift(block 内容 = SKILL 核心段的受管派生,而非各自维护的两份副本)。具体 drift 防护机制(同源生成 / 引用 / 测试断言)留待 plan。
- R7. 扩大后的 block 与 `CLAUDE.md`/`AGENTS.md` 其余既有内容**不得制造多真相源**;主题重叠处需去重,遵循角色契约「不导致多真相源」原则。
- R8. 双宿主一致:Claude 与 Codex 两端注入的核心决策集内容对齐(各自宿主入口语法 `spec-*` vs `spec-*` 差异除外),`spec-first init`/`doctor` 对两宿主同步处理。

---

## Acceptance Examples

- AE1. **Covers R1, R3.** Given 一个 `init` 后的项目,when 会话启动 hook 注入,then `additionalContext` 含 Scope Guards / Decision Output Contract / Routing Priority+Route Map / Red Flags 四类内容,而非仅「完整策略在 SKILL.md」的指针。
- AE2. **Covers R2.** Given 注入的核心决策集,when 检查其措辞,then 不含「1% 即必须 invoke」或等价强制全拦截语义,且明确保留「workflow-first ≠ brainstorming-first / 不强制每任务走 workflow」。
- AE3. **Covers R5.** Given 一个 bounded subagent 会话上下文,when 它读到注入内容,then 内容明确指示这类 agent 不重启入口路由。
- AE4. **Covers R6.** When `using-spec-first/SKILL.md` 的某个核心段被修改,then bootstrap block 的对应内容能被同源机制带动更新或被测试检出 drift,而不会静默分叉成两份。
- AE5. **Covers R8.** Given 同一项目分别 init Claude 与 Codex,when 比对两端注入的核心决策集,then 除宿主入口语法差异外内容对齐;`doctor` 对两宿主都能检出 block 缺失/drift。

---

## Success Criteria

- 人类:开发者在会话启动后,模型对「这次该不该进 workflow、进哪个」的判断质量可感知提升——不再出现「明明该 debug/plan 却在裸对话里直接动手」这类该进没进的漏路由;同时轻量问答不被强行拖入 workflow(哲学未反转的证据)。
- 可观测代理:注入的 `additionalContext` 包含四类核心决策内容(R1),可由 hook 输出或 block 内容直接核验;不含强制全拦截语义(R2)可由措辞断言核验。
- 下游:`spec-plan` 接手时,「注入什么内容、源在哪、drift 怎么防、双宿主怎么对齐」均已定义,无需发明 WHAT;唯一留给 plan 的是 R6 的 drift 防护实现机制。
- 边界:扩大后的 block 不引入多真相源(R7),不改 hook 脚本形态(R4),不反转路由哲学(R2)——三条都可由 review 核验。

---

## Scope Boundaries

- **不采纳** Superpowers 的「1% 即必须 invoke」强制哲学,不删除/反转现有 Hard Rule 对该规则的拒绝(守抗膨胀生死线与 236 项目差异化定位)。
- **不把** `using-spec-first/SKILL.md` 全文 324 行注入——只注入 ~80 行核心决策集(避免 Superpowers 式 context 重负)。
- **不改** SessionStart hook 脚本的读取/注入机制形态,不触碰 Codex `hooks.json` 路径/key 形态(刚修复,不回退风险)。
- **不新增** 强状态机、强制 gate、运行时拦截器或「每条消息都拦截判断」的机制。
- **不改** 公开 workflow 的 Route Map 条目本身(入口集不变,只是把映射注入到位)。
- 注入内容量级(~80 行)是目标而非硬上限;最终取舍由 plan 按「够用且不过量」校准,但方向是核心集而非全文。

---

## Key Decisions

- **借机制不借哲学(2026-06-08,用户两轮确认)**:采纳 Superpowers 的全文注入机制(方案一),保留 spec-first 按意图分流哲学。理由:漏路由的根因是「注入指针而非策略」,全文注入精准命中根因;1% 强制哲学会撞抗膨胀生死线、context-rot 多源证据、丢失 236 项目对照确认的差异化定位(见 [[project-market-evidence-2026-06]] 与 2026-06-07 对标报告),代价不可逆。
- **注入范围 = 核心决策集 ~80 行(用户确认)**:Scope Guards + Decision Output Contract + Routing Priority/Route Map + Red Flags 是「当场做路由判断」的最小必需集;Multi-Session / Scenario Fingerprint / Dispatch Boundaries / Source-of-truth 等执行细节模型按需读 SKILL。
- **注入源 = 扩大 bootstrap block(用户确认)**:复用现有「instruction-bootstrap.js 单点生成 → init 写入 CLAUDE.md/AGENTS.md → hook 运行时读 block」链路,只扩内容、不改 hook 脚本读取逻辑。避免重蹈 2026-06-07 改 hook 形态的跨宿主脆弱性。
- **接受的代价(用户已确认)**:~80 行核心集会常驻在 checked-in 的 `CLAUDE.md`/`AGENTS.md`(不只 hook 注入时出现),开发者日常会看到;TUI 显示的注入内容会从 ~10 行变 ~80 行(比现状长,但仍远短于 Superpowers 117 行)。

---

## Dependencies / Assumptions

- 依赖现有注入链路:`src/cli/instruction-bootstrap.js`(block 生成)、`src/cli/adapters/{claude,codex}.js`(hook 写入)、`templates/{claude,codex}/hooks/session-start`(运行时读 block)。
- 依赖 Codex SessionStart hook 已修复(2026-06-07,路径 `.codex/hooks.json` + PascalCase key);本重构不回退该修复。
- `[advisory]` Claude/Codex 宿主在会话启动确会注入/加载 block——Claude 经 SessionStart hook 已验证;Codex 经 AGENTS.md 被动加载已验证,SessionStart hook 触发依赖宿主 turn 行为(`codex exec` 模式实测不在模型调用前触发,交互式 TUI 触发已 live 验证),不影响 block 内容设计本身。
- 假设:扩大 block 不会触发宿主对 instruction 文件大小的任何限制(~80 行远低于常见上限,plan 阶段可快速核验)。

---

## Outstanding Questions

### Resolve Before Planning

- (空)所有产品级决策已在 brainstorm 拍板:强度=方案一、范围=核心决策集 ~80 行、源=扩大 block、代价已接受。

### Deferred to Planning

- [Affects R6][Technical] block 与 SKILL.md 核心段的 drift 防护具体机制:是「从 SKILL 同源生成 block」、「block 引用 SKILL 段」、还是「独立维护 + 测试断言一致」?需评估三者对 source-of-truth 单一性与维护成本的影响。
- [Affects R1][Technical] 核心决策集的精确选段与裁剪:324 行里哪些行进 block、哪些留 SKILL,需在 plan 期对 SKILL 现有四段做逐行取舍以命中 ~80 行目标。
- [Affects R7][Technical] 与 `CLAUDE.md`/`AGENTS.md` 既有内容的去重边界:哪些主题已在宿主文件别处出现、扩大 block 时如何避免重复表述。
- [Affects R8][Technical] 双宿主 block 内容对齐的测试覆盖:现有 `instruction-bootstrap` 测试与 dual-host smoke 需如何扩展以断言核心决策集对齐。
- [Affects R3][Needs validation] 扩大 block 后,现有 `stripManagedBootstrapSections` / `buildKnownBootstrapBodies` 的历史 block 兼容逻辑是否需同步(旧 ~10 行 block 升级到 ~80 行时,存量项目 `init` 的 block 替换是否干净)。
