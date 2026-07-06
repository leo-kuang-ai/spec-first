---
date: 2026-06-19
topic: docs-solutions-recall-activation-layer
spec_id: 2026-06-19-001-docs-solutions-recall-activation-layer
---

# docs/solutions 召回激活：wiring-first (v1)

> 修订说明：本文经一轮 `spec-doc-review`（coherence / feasibility / product-lens / scope-guardian / adversarial 五персона）后重框。原 v1 提案「脚本生成紧凑召回索引（机制 C）」被 4/5 reviewer 独立收敛否定：在当前 23 篇 / ~2.8K token 量级下，生成索引相对**已存在且已被调度**的 `spec-learnings-researcher` 几乎不加可靠性，真正缺口是 `spec-work` / `spec-debug` 缺召回调度入口。本 v1 改为 wiring-first，把生成索引显式 defer 到证据/语料阈值触发。被否决的机制 C 设计与否决理由记入 Key Decisions / Rejected，作为历史决策证据。

## Summary

把已存在的 `spec-learnings-researcher` 召回 agent 接进 `spec-work` 与 `spec-debug` 的 context-orientation 入口（对齐 `spec-plan` / `spec-code-review` 已有的调度），并把「直接扫 `docs/solutions/` frontmatter」作为主召回路径；不新建生成索引、不扩 SessionStart、不建检索基建。脚本只确定性产出候选，是否触发由 best-effort 入口决定、是否对口由 LLM + 回源决定。生成索引 / per-call 匹配 CLI 显式 defer 到 `knowledge-harness` OQ-2 信号或语料阈值。

---

## Problem Frame

`spec-first` 不缺持久知识沉淀，也不缺召回方法。`docs/solutions/`（23 篇，5 个分类目录）已存在；`agents/spec-learnings-researcher.agent.md` 已是一套完整的 grep-first 召回 agent（结构化 `<work-context>` 输入、按维度抽关键词、探子目录、读 frontmatter 打分，自述为「数百文件」量级设计）；`knowledge-harness.md` L4 已把召回定义为 advisory candidate。

用户表达的痛点是召回的**可靠性**：该召回的历史经验没有「及时、准确」地被召回。`docs/02-架构设计/2026-06-17-...gap-analysis.md` 把这命名为「scoped context activation 层缺失」。但评审核实发现：该 gap 分析是**架构形态层面**的观察（五层中第三层未统一），**未提供召回实际 mis-fire 的行为证据**（无 missed-recall trace、无 metric）。

源码核实给出了更具体的根因定位：召回 agent 已被 `spec-plan`(SKILL.md:291) 与 `spec-code-review`(SKILL.md:236/558/734) 作为标准 Agent 调度；而 `spec-work`(SKILL.md:112) 与 `spec-debug`(SKILL.md:92) 只有**召回 advisory prose、无调度步骤**。因此「该召回没召回」最可能的真实缺口是 **work/debug 两个高频 workflow 缺召回入口接线**，而不是「召回机制本身不可靠」或「缺一个生成索引」。

承接 `docs/brainstorms/2026-06-12-002-...progressive-disclosure...md` 的「最小常驻锚点 + 按需展开」方向：本 v1 用最小、最贴 80/20 的 wiring 改动闭合这个缺口，并诚实标注「可靠」是 best-effort（无硬拦截器、无强制 fire），不是 guaranteed。

---

## Actors

- A1. 顶层 orchestrator（Claude / Codex）：在 work/debug 的 context-orientation 阶段调度召回 agent / 直接扫 frontmatter，判断候选相关性、回源确认。
- A2. `spec-learnings-researcher` agent：现有召回执行者；本 v1 的核心交付是让它在 work/debug 也被可靠调度，不改它的关键词抽取与打分逻辑。
- A3. `spec-work` / `spec-debug` SKILL（source）：当前缺召回调度入口的两个高频 workflow。
- A4. 下游 planner / reviewer：消费本需求，落实 wiring 改动、回退路径与升级触发条件。

---

## Key Flows

- F1. work/debug 入口召回（核心交付）
  - **Trigger:** 用户进入 `spec-work` 或 `spec-debug` 的实质工作，orchestrator 进入 context-orientation 阶段。
  - **Actors:** A1, A2, A3
  - **Steps:** orchestrator 在 context-orientation 调度 `spec-learnings-researcher`（或在其不可用时直接对 `docs/solutions/` 扫 frontmatter）→ 拿到候选 → 仅对命中候选回源读取对应 solution 与其 `source_refs`/`source_reads_required` → 形成结论时保持 advisory 并完成回源确认。
  - **Outcome:** work/debug 不再依赖「orchestrator 临场记得去召回」；召回入口与 plan/review 对齐。是否采纳由 LLM + 回源决定。
  - **Covered by:** R1, R2, R3, R6, R7

- F2. 召回执行（复用，不重写）
  - **Trigger:** 召回 agent 被调度，或回退到直接 frontmatter 扫描。
  - **Actors:** A2, A1
  - **Steps:** 召回执行复用 `spec-learnings-researcher` 现有 grep-first 逻辑；匹配基于语料普遍存在字段（`applies_when` 23/23、`title`、`problem_type`、`component`、`category`、`module`、`tags`），不依赖稀疏新字段。23 篇 / ~2.8K 量级下，whole-frontmatter 直接扫描即可作主路径。
  - **Outcome:** 召回质量不因 v1 下降；不引入第二套召回实现。
  - **Covered by:** R4, R5, R8

---

## Requirements

**核心 wiring（v1 主交付）**
- R1. 必须把 `docs/solutions/` 召回接进 `spec-work` 与 `spec-debug` 的 context-orientation 阶段，使其召回入口与 `spec-plan`/`spec-code-review` 现有调度对齐——这是一个**新增调度/入口步骤**，不是「纯指针复用」（评审已核实 work:112 / debug:92 当前仅 advisory prose、无调度）。
- R2. wiring 必须复用现有 `spec-learnings-researcher` 召回逻辑，不重写其关键词抽取与打分；v1 只负责让它在 work/debug 被可靠调度。
- R3. 召回入口必须挂在既有 context-orientation 阶段，不新增中心化拦截器、不新增 per-message 强制 route、不加厚 SessionStart。

**召回执行边界**
- R4. 召回匹配必须基于语料**实际普遍存在**的 frontmatter（`applies_when` 23/23、`title`、`problem_type`、`component`、`category`、`module`、`tags`）；不得把稀疏新字段（`domain`/`pattern`/`source_refs`/`invalidation_condition`，各 3/23）当匹配前置条件。
- R5. v1 主召回路径是直接扫描 `docs/solutions/` frontmatter（23 篇 / ~2.8K 量级，成本可接受）；不引入向量库、SQLite、embeddings、外部 memory 平台或生成索引artifact。`spec-learnings-researcher` 不可用时，回退为 orchestrator 直接 frontmatter 扫描，并记录回退 reason。
- R8. 召回结论必须保持 advisory：命中候选是线索，结论须回源到 `source_refs`/`source_reads_required` 或当前 source/test/doc 确认后才升为 confirmed；无法回源标 limitation。沿用 `provider_untrusted` / `legacy_unstructured_advisory` 语义，不新建第二套 evidence enum。脚本只确定性产出候选，不对「是否适用」下结论（§4）。

**可靠性边界诚实**
- R6. 文档与实现必须诚实标注：v1 的「可靠」是 best-effort（低摩擦 + 文档化入口步骤提高触发率），**不是 hard-guaranteed fire**；在不加厚 SessionStart / 不建硬拦截器（2026-06-12-002 已否）前提下无法强制每次必触发。不得把 best-effort 触发表述为 confirmed 事件。
- R7. Success Criteria 与 Acceptance 必须与 best-effort 边界一致：可验收的是「入口步骤存在且文档化、进入 context-orientation 时召回被调度」，不是「跨会话稳定必触发」。

**治理边界**（遵循全局仓库治理，非本特性独有；列此仅为 planning 可见）
- R9. 后续实现 source-first：改 `skills/spec-work/SKILL.md`、`skills/spec-debug/SKILL.md`、必要时 `agents/spec-learnings-researcher.agent.md` 或共享 reference；不手改 `.claude/**`/`.codex/**`/`.agents/skills/**`；runtime 刷新经 `spec-first init`，双宿主（Claude/Codex）同步验证；source 变更按格式更新根 `CHANGELOG.md`，补对应 contract/unit/routing eval test。

---

## Acceptance Examples

- AE1. **Covers R1, R3.** Given 用户进入 `spec-work` 实质工作，when orchestrator 进入 context-orientation，then 它在该既有阶段调度 `spec-learnings-researcher`（或回退直接扫 `docs/solutions/`），而不触发 SessionStart 加厚或新中心化拦截器。
- AE2. **Covers R1.** Given `spec-debug` 进入诊断，when context-orientation，then `docs/solutions/` 召回被调度，行为与 `spec-plan`/`spec-code-review` 现有召回调度对齐。
- AE3. **Covers R2, R8.** Given 召回返回一个候选 solution，when 结论写入 work/debug 产物，then 结论要么附回源确认（读了对应 solution + `source_refs`），要么明确标注 advisory 未确认；召回逻辑未被重写、脚本未对「是否适用」下结论。
- AE4. **Covers R4, R5.** Given 一篇 legacy solution 只有 `applies_when`/`title`/`problem_type` 而无 `domain`/`pattern`，when 召回，then 它仍被匹配到（基于普遍字段），且无需任何生成索引或检索基建即可完成。
- AE5. **Covers R6, R7.** Given reviewer 检查 Success Criteria，when 对照实现，then 验收点是「入口步骤存在且被调度」而非「跨会话稳定必触发」；文档未把 best-effort 表述为 guaranteed。

---

## Success Criteria

- work/debug 召回入口补齐：进入 context-orientation 时 `docs/solutions/` 召回被调度，触发率随之上升，不再依赖 orchestrator 临场「记得去 grep」。
- 边界不下降：召回结论仍 advisory + 回源确认；脚本不做语义裁决；不加厚常驻注入、不建检索基建、不引入第二套召回实现。
- 最小可证：v1 不新建生成索引artifact；whole-frontmatter 直接扫描在当前量级足够。
- 诚实可验收：验收点与 best-effort 边界一致（入口存在且被调度），不设「稳定必触发」这类无法验证的 bar。
- 下游可直接规划：planner 能围绕 work/debug SKILL wiring + 回退路径 + 升级触发条件做实现，无需重新决定 WHAT。
- 双宿主一致：Claude 与 Codex 召回政策一致，差异只在 host entrypoint spelling 与宿主能力边界。

---

## Scope Boundaries

### Deferred for later（按信号/阈值触发，非永久排除）

- 脚本生成的紧凑召回索引（原机制 C）：defer 到 `knowledge-harness` OQ-2 信号（grep 召回精度持续下降 / 单关键词命中过多需多轮过滤 / 语义近但用词不同的 recall miss 反复发生）或语料规模阈值触发。v1 不建。
- per-call 匹配 CLI（gap 分析的 `context-activation.v1` 重形态）：同上，defer 到同一组触发信号。
- frontmatter backfill（把 `domain`/`pattern`/`source_refs`/`invalidation_condition` 补到全语料）：是召回**质量**优化，product-lens 评审指出在当前量级它对准确度的杠杆可能高于任何索引**速度**优化；defer 为独立后续工作，由 `spec-compound`/`spec-compound-refresh` 增量回填，不在 v1。
- 明确的语料/精度阈值定义（whole-scan 假设何时失效、何时该升级到索引或 hybrid）：defer 到 planning/后续，复用 OQ-2 三信号。

### Outside this v1's identity（不属于本激活层）

- 「查资料」激活（外部研究 / context7 / provider 召回）——provider/host 地盘。
- 「查代码定位」激活（workflow 已按需读源；`rg`/host/code-graph 已覆盖）。
- 扩 `context-bundle.v1` 兼做候选发现（污染其纯路径分类单一职责）。
- 加厚 SessionStart、硬拦截器、per-message 强制 workflow route。
- 把召回结论当 confirmed truth；手改 generated runtime mirrors。

---

## Key Decisions

> 标 *(agent 推断)* 的是交互中我做的判断、用户未逐条确认（用户以「继续」授权我自行判断并记录），planning 前应当作待审假设。标 *(评审收敛)* 的是 doc-review 五персона中 4 个独立收敛、且我已对照源码核实行号的结论。

- **痛点是「可靠召回」而非「prose 整洁度」：** 用户明确要「该召回的及时准确召回」。
- **v1 锚定 `docs/solutions` 召回：** 三类激活中唯一今天纯 advisory、且只有 spec-first 拥有（项目特有知识，不被宿主商品化，过 §7）。
- **【重框】真实缺口是 work/debug 入口接线，不是缺生成索引** *(评审收敛，已核实)*：召回 agent 已被 plan(SKILL:291)/review(SKILL:236/558/734) 调度；work(112)/debug(92) 仅 advisory prose 无调度。v1 = 补这两处 wiring。
- **【否决】机制 C（生成紧凑索引）defer，不在 v1** *(评审收敛)*：(1) R3/R5 禁硬拦截器、whole-scan 已廉价——索引能拉的两个杠杆（降本/强制触发）都被自身要求关掉，相对已存在 agent 近零增益；(2) `knowledge-harness` OQ-2 已显式决定「精度退化前不建召回加速器」，原 v1 引该合同为 baseline 却越过它画的线；(3) 索引引入 raw-scan 本不存在的 silent-staleness 失败模式，净可靠性可能下降。被否决设计保留于此与 Sources 作历史证据。
- **准确度拆解 = 及时（脚本/wiring 保浮现）+ 适用（LLM + 回源保证）** *(agent 推断)*。
- **「可靠」是 best-effort，非 hard-guaranteed fire** *(agent 推断，评审强化)*：无硬拦截器即无法强制每次触发；Success Criteria 已据此降为可验收 bar（评审 SG-002）。
- **frontmatter backfill 不是 v1 依赖，但可能是更高杠杆的后续** *(agent 推断 + product-lens 评审)*：`applies_when` 23/23 已够匹配；backfill 影响召回质量、defer 为独立工作。
- **`spec-compound:103` 与 `spec-compound-refresh:144` 的 replay-index 禁令** *(评审收敛，已核实两处都存在)*：v1 不建任何生成索引，本就不触及该边界；若未来 defer 项落地生成索引，必须以「独立可重建脚本、ownership 在 compound 之外」为 escape，而非靠「frontmatter≠transcript」措辞绕过，并需同时对照 :103 与 :144。

---

## Dependencies / Assumptions

- 依赖 `docs/02-架构设计/2026-06-17-...gap-analysis.md` 为问题框架来源（其结论为架构形态观察，**无召回 mis-fire 行为证据**——见 Outstanding Questions 的前置证据项）。
- 依赖 `docs/brainstorms/2026-06-12-002-...progressive-disclosure...md` 的「最小常驻锚点 + 按需展开」为上游决策。
- 依赖 `docs/10-prompt/结构化项目角色契约.md`（§3 light contract、§4 强 gate/轻判断、§7 宿主商品化、§10 80/20「更清晰边界 > 更强能力」）为架构判断基线。
- 依赖 `docs/contracts/knowledge/knowledge-harness.md`（L4 recall trust boundary、`legacy_unstructured_advisory`、OQ-2 file-first→hybrid 信号门）与 `agents/spec-learnings-researcher.agent.md` 现有召回逻辑为复用面。
- 源码事实（核实于 2026-06-19）：`docs/solutions/**` 23 篇 / 5 目录；frontmatter `applies_when`/`title`/`problem_type`/`component`/`category` 23/23、`module` 22/23、`tags` 21/23、稀疏新字段各 3/23；召回 agent 已被 plan:291 / review:236,558,734 调度，work:112 / debug:92 仅 advisory prose；replay-index 禁令存在于 compound:103 与 compound-refresh:144。语料增长会改变 defer 项的必要性。

---

## Outstanding Questions

### Resolve Before Planning

- [Affects 全文][证据] 前置证据采集：产出 2-3 个真实 `spec-work` 或 `spec-debug` trace，其中相关 `docs/solutions` 文档存在却未被召回，用以确认「work/debug 缺召回入口」确为真实缺口（而非臆测）。评审 P0 指出原premise未被行为证据支撑；wiring 改动很轻，此证据门是「轻确认」而非阻断，但应在 planning 前补一次最小确认。

### Deferred to Planning

- [Affects R1, R3][Technical] wiring 落点：改 `spec-work`/`spec-debug` 各自 SKILL 的 context-orientation prose 为显式调度步骤、还是新增一个被两者指向的共享 reference；与 plan/review 现有调度形态如何对齐。
- [Affects R1, R9][Technical] 是否需要新增 / 调整 routing eval 或 contract test 来锁「work/debug context-orientation 调度召回」这一行为，防回退。
- [Affects R5][Technical] `spec-learnings-researcher` 不可用时的回退在 SKILL prose 如何表述（直接 frontmatter 扫描 + 记录 reason）。
- [Affects Deferred 项][Needs research] 生成索引 / per-call 匹配 / backfill 的升级触发：在什么语料规模或召回精度信号下从 wiring-only 升级（复用 OQ-2 三信号），v1 只记录触发条件不实现。
- [Affects R9][Technical] runtime projection / `spec-first init` 时机与双宿主投影测试面。

---

## Sources / Research

- `docs/02-架构设计/2026-06-17-spec-first-session-context-activation-layer-gap-analysis.md`
- `docs/brainstorms/2026-06-12-002-context-injection-progressive-disclosure-requirements.md`
- `docs/10-prompt/结构化项目角色契约.md`
- `docs/contracts/knowledge/knowledge-harness.md`（L67 OQ-2 升级信号门）
- `docs/contracts/context-governance.md`
- `agents/spec-learnings-researcher.agent.md`（现有 grep-first 召回 agent）
- `skills/spec-plan/SKILL.md:291`、`skills/spec-code-review/SKILL.md:236,558,734`（已有召回调度）
- `skills/spec-work/SKILL.md:112`、`skills/spec-debug/SKILL.md:92`（仅 advisory prose、缺调度——v1 缺口）
- `skills/spec-compound/SKILL.md:103`、`skills/spec-compound-refresh/SKILL.md:144`（replay-index 禁令）
- doc-review（2026-06-19，五персона）：4/5 收敛否决机制 C，定位真实缺口为 work/debug wiring；本文据此重框
- 语料勘探：`docs/solutions/**`（23 篇，frontmatter 字段覆盖率，核实于 2026-06-19）
