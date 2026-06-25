---
spec_id: spec-prd-enforce-grill-design-gate
title: "fix: spec-prd 强制进入 grill 与强制解读 design source"
type: fix
status: completed
date: 2026-06-25
plan_depth: deep
author: leokuang
target_repo: "."
referenced_reviews:
  - ref: docs/validation/spec-prd/fresh-source-eval-2026-06-25-relentless-grill.md
    role: origin
    scope: in
    addresses_findings: ["STRUCTURAL-GATE-SKIPPABLE"]
related_plans:
  - docs/plans/2026-06-25-001-refactor-spec-prd-relentless-grill-plan.md
---

# fix: spec-prd 强制进入 grill 与强制解读 design source

## Revision 2026-06-25(post-verification — 根因纠正,改为生产端加固)

**本节凌驾于下方原始 Summary / Decision Brief 的根因假设之上。** 原方案推迟的 motivating-PRD 验证(F3 / Open Questions)已执行,结论推翻原前提:

- 用真实产物 `~/xiaobu/hsglobal/docs/brainstorms/20260625-kaz-market-page-requirements.md` 实跑**现有** `check-prd-artifact.js`:报 **28 条 finding**(6× `core_section_missing` 因产物用纯中文标题、18× `requirement_without_acceptance_ref`、`write_mode_undeclared`/`clarification_evidence_undeclared`/`can_enter_spec_plan_undeclared`)。**checker 从不"全绿"**。
- 该产物 `artifact_kind: prd-requirements` 已声明 → `needsReadinessDeclarations=true`,现有 readiness finding 本就该触发。
- 真实故障转录:模型写完 PRD + CHANGELOG 后直接自证"标准 PRD 已产出"、提议进 `/spec:plan`,**从未进入 Phase 4、从未运行 checker**。`SKILL.md:209` 当时已要求"PRD 路径存在时先跑 checker",模型跳过了整个 Phase 4。

## Completion Evidence (2026-06-25)

本计划已从 `partially-shipped` 收敛为 `completed`。前一轮已完成生产端加固(Phase 4 强制 checker + 本地化 core-section anchor);本轮补完原 002 defense-in-depth:

- `skills/spec-prd/scripts/check-prd-artifact.js`:支持 `--inputs` 输入侧 design-source 扫描,新增 `clarification_trace_absent`、`design_source_unaccounted`、`input_refs_unavailable`、`input_scan_degraded`、`prd_readiness_declarations_evaded`、`preflight_sweep_closure_absent` findings,以及 `input_scan_attempted`、`input_refs_used`、`input_design_refs_present`、`preflight_sweep_closure` 等 facts。
- `skills/spec-prd/SKILL.md` 与 references:Phase 1 Preflight Sweep、final-prd 非 `skipped` grill 痕迹、design inventory 强制、`--inputs` Phase 4 调用、readiness 对新 reason_code / `input_scan_attempted=false` 的 must-not-ready 消费已同步。
- `tests/unit/spec-prd-contracts.test.js`:覆盖 `--inputs a,b` / 多次 `--inputs`、KAZ 风格 `source_docs/Figma-市场页设计稿链接.md`、`clarification_evidence: skipped` + `final-prd`、PRD-shaped declaration evasion、`preflight_sweep_closure`、Claude/Codex runtime path projection。
- `skills/spec-prd/evals/examples.json`:新增 `preflight-grill-design-gate-ready-rejected` failure case。
- `docs/validation/spec-prd/fresh-source-eval-2026-06-25-enforce-grill-design-gate.md`:记录 fresh-source semantic eval 未授权 dispatch,确定性验证 passed。

验证:

- `node --check skills/spec-prd/scripts/check-prd-artifact.js`
- `npx jest tests/unit/spec-prd-contracts.test.js --runInBand`(29 passed)
- `node skills/spec-prd/scripts/run-evals.js --json`(93 cases passed)

Generated runtime mirrors 未手改;source 变更后如需刷新运行时,继续使用 `spec-first init`。

**真实根因 = 确定性闸根本没运行(producer 自证 ready 直接 handoff),不是"闸跑了却全绿"。** 因此原方案 80% 工作量(U1 在 checker 里加 6 个新 finding)落点错误:给一个没人运行的脚本加 finding,对该故障零效果。

**已确认方向(owner 决策:生产端加固为主,只动 spec-prd,不碰 spec-plan)。** 已实现并验证(见 CHANGELOG `2026-06-25 17:06:54`):

1. **checker 本地化 core-section 锚定**(`check-prd-artifact.js`):标题去前导序号后含 canonical 英文 token 即识别(`## Summary(文档概要)` / `## 一、Change Delta 变更` 命中),不误伤 `Non-Functional Requirements`,纯中文无锚点仍报 `core_section_missing`。消除对中文 PRD 的假报噪声,避免闸因噪声被忽略——这是"闸不可信→被跳过"的一半根因。
2. **Phase 4 调用硬化**(`SKILL.md`):Phase 4 是强制闸;未运行 readiness lens + checker、未在 handoff/closeout 报出 findings 与 readiness outcome 前,禁止声称 PRD 完成或提议 `/spec:plan`;自证 ready = Phase 4 违约。
3. **readiness 收紧 + 模板锚点**(`prd-readiness-lens.md` / `prd-output-template.md`):artifact 存在却无 executed checker result 即非 ready;core section 必须保留英文锚点 token。
4. 契约测试 + KAZ 形态复现 fixture(`tests/unit/spec-prd-contracts.test.js`)。

**诚实边界**:生产端加固无法确定性杜绝"模型跳过 Phase 4"——唯一不可绕过的强制点是消费端(`/spec:plan` 入口自跑 checker),owner 已知并暂不采纳。

**Deferred(defense-in-depth,非本轮实现)**:下方原始 U1 的 6 个新 finding(`clarification_trace_absent` 等)、`--inputs` 输入侧探测、Phase 1 Preflight Sweep。它们对"闸已运行"的场景仍有价值,但不解决"闸未运行"的真实根因,故降级待定。下方原始内容保留为历史上下文。

---

## Summary

spec-prd 当前所有质量闸门(relentless grill、design evidence closure、readiness)都活在 Phase 1 / Phase 4 内部,而"进入 grill""进入 readiness"这两个动作本身是 LLM 自愿叙述流程,没有任何确定性事实强制。real-run 日志(`2026-06-25 KAZ 市场页 PRD`)实证:模型读完输入后用一句"证据充分,无阻塞性问题,直接产出标准 PRD"让 grill 和 readiness 同时蒸发,figma 被当背景文档"读"掉从未真 fetch,产出的 PRD 因 core sections 齐全且不声明 design source,`check-prd-artifact.js` 反而全绿。

本方案把"是否真的 grill 过""是否真的处理过 design source""是否在写 PRD 前完成必要扫盲"从纯 LLM 自愿变成**脚本可检测的确定性事实 + 必须进入的轻量语义扫盲**:扩展 `check-prd-artifact.js` 报出新 finding(`clarification_trace_absent`、`design_source_unaccounted`、`input_refs_unavailable`、`input_scan_degraded`、`prd_readiness_declarations_evaded`、`preflight_sweep_closure_absent`)与 advisory fact(`input_scan_attempted`),并新增 Phase 1 Preflight Sweep 覆盖 input inventory、authority、target surface、current-state、change delta、risk-to-write-target 等前置闭环;readiness lens 强制消费 checker facts/findings 与 preflight residue、不得静默 ready。脚本只产 deterministic facts,语义裁决仍 LLM-owned——不做硬状态机。

这是 `2026-06-25-001`(relentless grill)的结构性延续:001 治"已经在 grill 里别早停",本方案治"根本没进 grill 门 / 没处理 design 源"。

---

## Decision Brief

**推荐方案**:脚本兜底为主 + prompt 配套。在 `check-prd-artifact.js` 增加 grill/design/input-readiness 确定性缺失检测,并在 Phase 1 增加必须进入的 Preflight Sweep,readiness lens 必须语义消费 checker findings 与 preflight 未闭合项。

**5 个已确认的关键决策**(经 AskUserQuestion 对齐):

| # | 决策 | 选择 | 关键理由 |
|---|------|------|---------|
| D1 | 强制落点 | **脚本兜底为主 + prompt 配套** | 日志实证纯 prompt 自愿层会被一句话跳过;脚本产 deterministic facts,readiness 消费 |
| D2 | figma tool 不可用时语义 | **loud degrade + 阻塞,但允许 owner 显式放行** | figma 是 optional per host/user/OS,不能硬卡死;但绝不静默当读过 |
| D3 | 脚本拿输入侧信号 | **加 `--inputs` 参数扫输入** | 当前脚本只看产物,看不到输入 figma 链接;`--inputs` 是唯一能真正打破鸡生蛋的方式,Phase 4 原始输入可定位时必须传 |
| D4 | 强制 grill 豁免边界 | **全部强制、无软豁免**(用户否决了"保留豁免") | 见下方边界澄清 |
| D5 | 前期扫盲强制点 | **Phase 1 Preflight Sweep 必须进入** | 尽早暴露输入遗漏、权威混淆、目标锚点缺失、当前态无证据、delta 未定、risk 未绑定写入位置等会让后续 grill/readiness 蒸发的问题 |

**D4 边界澄清(必须精确,否则与 Phase 0 route-out 逻辑荒谬冲突)**:
- `route-out`(0-1 idea / audit / wrong-stage / debug)和 `bypass`(纯 bugfix / docs-only 误入)是 **Phase 0 进入 PRD authoring 之前的分类退出**,不算"grill 豁免"——它们根本没进 authoring,对其"强制 grill"无意义。
- 一旦 Phase 0 判定为 `create` / `refine` PRD authoring,就**无任何软豁免**:`compact-prd`、`source-resolved` 都不能再作为"跳过 grill 痕迹要求"的理由。`compact-prd` 仍可作为输出形态,但其合法前提收紧为"source-first 已闭合每个 load-bearing 分支且留下了可检测的澄清痕迹",而非"读完直接写"。
- **阶段次序(F9)**:authoring 判定发生在 Phase 0;一旦锁定为 `create`/`refine`,Phase 1 grill 痕迹闸与 Phase 4 readiness/design 闸即生效且不可豁免。`route-out` 锁定为"不进 authoring",与 authoring-stage 闸不交互——不存在"先 route-out 再补 authoring 却绕过闸"的路径。
- **代价透明(F7)**:此硬强制对"没逐字写出合法非 `skipped` `clarification_evidence`"的精简 / source-proven 合法作者也会阻塞——这是**有意的摩擦**(深度优先于一次过),不是误判;合法路径只需补一个有效声明即可解除,不回退到软豁免。挡住的是抄近路者(读完直接 final-prd),代价由偶尔需补声明的合法精简作者承担,取舍显式接受。

**D5 边界澄清(前置扫盲不是新状态机)**:
- Preflight Sweep 是 Phase 1 写 PRD 前必须执行的 run-local map,不是持久 schema、transcript、progress file 或审批流。
- 默认六项必跑:Input Inventory、Authority Classification、Target Surface Anchor、Current-State Evidence、Change Delta、Risk → PRD Write Target Map。
- 四项条件触发:Owner Question Gate、Domain/Glossary Gate、Topology/Producer-Consumer Gate、Large Input/Resume Gate。
- 结果写入现有 PRD sections 或 Decision Card/closeout 字段:Current System Snapshot、Change Delta、Evidence And Assumptions、Outstanding Questions、Planning Recheck、Decision Notes、Surface Map、Design Source Coverage、Readiness Self-Check;不得新增第二 PRD artifact topology。
- 缺失处理是 LLM-owned 语义裁决,但出口必须硬:缺任一必跑项或 triggered gate residue 未闭合时,`write_mode` 只能是 `ask-owner-first` / `checkpoint-prd` / `route-out`,不得 `final-prd`;Phase 4 不得 `ready-for-planning`。

**最大可行性难点**:`check-prd-artifact.js` 当前 `parseArgs`(`skills/spec-prd/scripts/check-prd-artifact.js:27-41`)只接受单个位置参数(PRD 产物路径),物理上看不到输入侧。D3 的 `--inputs` 参数不是可选优化,而是 Phase 4 关闭输入侧 design-source 漏读的必要调用合同:当原始 `prd_input`、source docs、用户给定文件或 source input refs 可定位时,Phase 4 必须把这些输入传给 checker。无 `--inputs` 只允许作为既有调用向后兼容的纯产物检测,不得声称覆盖输入侧 design-source gate;原始输入可定位但未传、不可读或扫描失败时,checker 必须输出 `input_refs_unavailable` 或 `input_scan_degraded`,并由 readiness 消费为 must-not-ready,不能静默 `ready-for-planning`。

**最大风险**:figma 无 tool 误卡死(D2 兜底)、grill 痕迹检测误伤合法 compact-prd / source-proven 路径(信号设计须精确)、preflight checklist 膨胀成重状态机(必须复用现有 PRD sections + run-local map)、脚本越权做语义判断(脚本只报 reason_code,绝不自己定 readiness)。

---

## Direct Evidence

- target_repo: `.`(spec-first 本仓库)
- source_refs:
  - `skills/spec-prd/scripts/check-prd-artifact.js`(L27-41 parseArgs 单参数;L190-215 design 检测;L290-313 readiness 声明检测 + needsReadinessDeclarations;L340-360 findings push)
  - `skills/spec-prd/SKILL.md`(L80 原则4;L107-135 Decision Card + Canonical 四停点;L167-178 Phase 1;L200-211 Phase 4)
  - `skills/spec-prd/references/prd-readiness-lens.md`(L38 声明消费;L108 design-evidence closure;L138 handoff entropy)
  - `skills/spec-prd/references/design-source-evidence.md`(L21 fetch 链;L48-58 Figma optional + degrade)
  - `skills/spec-prd/references/prd-output-template.md`(L208-230 Design Source Coverage 字段块)
  - `docs/validation/spec-prd/fresh-source-eval-2026-06-25-relentless-grill.md`(STRUCTURAL-GATE-SKIPPABLE finding + recommended_route)
  - `/Users/kuang/xiaobu/hsglobal/2026-06-25-115631-...txt`(real-run 触发日志,本仓库外只读引用)
- current_revision: `leo-2026-06-25-work-update` @ HEAD 2f2d6c76(001 relentless 改造已落盘工作区未提交)
- worktree_dirty: 是(001 的 11 文件改动 + 2 artifact 在工作区)
- discovery_methods: 直接 Read + grep,本会话刚完成 001 改造与日志根因分析,上下文充分
- tests_or_logs: 上一轮 `spec-prd-contracts` 27 passed、`run-evals` passed、`test:unit` 1383 passed
- confidence: 高(脚本接口、根因、字段落点均源码实证)
- limitations: 未跑 dispatch 行为 eval(本会话无 subagent 授权,与 001 同);`--inputs` 扫描的输入格式多样性需在实现时用真实样本验证

---

## Context & Research

### 根因(源码实证)

1. **闸门都在门内,进门无强制**。`grill-with-docs-integration.md` 的 relentless 在 Phase 1 内;`prd-readiness-lens.md` 的 design-evidence closure / readiness 在 Phase 4 内。但"进入 Phase 1 grill""进入 Phase 4 readiness"是 LLM 自愿叙述,无确定性强制。

2. **design source 检测方向反了(鸡生蛋)**。`check-prd-artifact.js:307` 的 `designSourceRefsPresent` = `detectDesignSourceRefs(text)`(L190-193),只扫 **PRD 产物正文**有没有 `figma.com`/`node-id=`/`design_source_inventory` 串。L349-359 的 `design_source_*_undeclared` 全部以 `designSourceRefsPresent` 为前置。模型把 figma 当背景读、没写进产物 → `designSourceRefsPresent=false` → 一个 finding 不报。**逻辑应反过来:输入有 design 源、产物无 inventory 才是最该报的漏读信号。**

3. **001 只覆盖门内**。`SKILL.md:131-135` Canonical 四停点治"进了 grill 别早停",治不了"没进 grill"。

### 已有可复用机制(降低本方案新增量)

- 脚本**已经**在读产物正文的 `write_mode` / `clarification_evidence` / `can_enter_spec-plan` 声明(L290-306),`needsReadinessDeclarations` 由 `artifact_kind===prd-requirements` 或正文含 `ready-for-planning` 触发(L312-313)。→ **"grill 痕迹"已有脚本可读落点,无需依赖看不到的 run-local Decision Card。**
- `clarification_evidence` 枚举已含 `asked-owner | source-proven-no-ask | headless-degraded-logged | skipped`(L297-302)。→ 检测"无 grill 痕迹却 final-prd"可复用此字段,但**注意 `skipped` 本身是合法枚举值**(`hasValidDeclaration` 对它返回 true),不能直接复用 `clarificationEvidenceDeclaredValid`;需引入"实质澄清证据"判定:`skipped` 与缺失/无效都判为非实质,`write_mode=final-prd` 且非实质澄清证据才是确定性的"没真 grill"信号。
- `design-source-evidence.md` 已有完整 degrade 语义(L58)与 `extraction_status: fetched | degraded | not-run`(L68)。→ D2 owner 放行只需在 readiness 加一条"degraded + owner 显式接受 → 不阻塞"。

### 哲学约束(正面权衡)

- **Light contract + Let the LLM decide**:脚本只报 `reason_code` finding(deterministic fact),**绝不自己判 readiness**。是否阻塞 ready-for-planning 由 readiness lens(LLM)语义裁决——但 lens 被强制要求"看到这些 finding 不得静默 ready",这正是已有 L340-360 + `prd-readiness-lens.md:38` 的同款 pattern(声明缺失 → lens 必须降级),本方案是把它扩展到 grill 痕迹、design 漏读与输入引用降级缺失,**不新造机制**。
- **不做硬状态机**:不引入 phase-status 强转、不引入 transcript、不阻止模型自由选择问哪个分支。脚本看"结果痕迹"(声明字段 + design inventory 覆盖),不看"过程步骤"。
- **80/20**:figma 漏读、grill 跳过是高频高价值痛点;`--inputs` 在 CLI 兼容层可选,但在 Phase 4 原始输入可定位时是必须传递的调用合同,不增加无输入旧调用负担。

---

## Key Technical Decisions

### KTD-1:脚本只报 fact,readiness 消费(不越权)

新增 finding 与现有 `design_source_*_undeclared` 完全同构:脚本 push `{reason_code}`,`prd-readiness-lens.md` 与 `SKILL.md:210` 列出"看到这些 reason_code,Phase 4 must not return ready-for-planning,除非 fill 声明或 degrade readiness"。脚本不出现任何 readiness 判定逻辑。

### KTD-2:`--inputs` 向后兼容设计(关键)

`parseArgs` 改造:第一个非 `--` 位置参数仍是 PRD 产物路径(不变);CLI 兼容层新增可选 `--inputs <path>`(可重复或逗号分隔,**只接受显式文件路径——不支持目录参数**,见 F8 决策),Phase 4 原始输入可定位时必须逐个文件传入。
- **无 `--inputs`**:既有 exit code、既有 findings 与既有核心 facts 保持兼容(不要求 JSON 逐字一致,因为会新增 advisory fact `input_scan_attempted:false`);但 Phase 4 若原始输入可定位却没有传 `--inputs`,必须由 Phase 4 readiness bridge 产生 `input_refs_unavailable` / closeout limitation 并阻止 `ready-for-planning`。
- **有 `--inputs`**:脚本读取输入文件文本与输入路径/文件名元数据,扫 design 源信号(复用 `detectDesignSourceRefs` 并补 Figma/design 文件名与 `Figma <digits>-<digits>` 节点简写),得到 `input_design_refs_present`。当 `input_design_refs_present===true` 且产物 `designSourceInventoryDeclared===false` → push `design_source_unaccounted`。这把鸡生蛋反转:**输入有、产物无**才是漏读。
- 输入读取失败(路径不存在/不可读)→ 记 `input_scan_degraded` fact + finding,不抛错、不由脚本裁决 readiness,但 readiness 必须视为 must-not-ready 或 owner-accepted degraded;不得只退回纯产物检测后静默 ready。

### KTD-2a:runtime checker 路径必须走 source-path rewrite contract

Phase 4 source 文案不得写成裸 `scripts/check-prd-artifact.js <prd-path>` 作为跨仓可执行路径。应使用可被 adapter rewrite 的 operational source path,例如 `node skills/spec-prd/scripts/check-prd-artifact.js <prd-path> --inputs <source-input-path>`;runtime projection 必须把它改写为当前宿主可执行路径:
- Claude workflow runtime:`.claude/spec-first/workflows/spec-prd/scripts/check-prd-artifact.js`
- Codex workflow runtime:`.agents/skills/spec-prd/scripts/check-prd-artifact.js`

契约测试需要同时断言 source 文案保留 source-of-truth 路径边界、Claude/Codex runtime 渲染后的 operational 调用路径存在且不残留会在业务仓失败的裸 `scripts/check-prd-artifact.js <prd-path>`。

### KTD-3:grill 痕迹的确定性信号(脚本可读)

在 `needsReadinessDeclarations===true` 前提下,新增 `clarification_trace_absent` finding,触发条件(全部满足):
- `write_mode` 声明为 `final-prd`(模型自称终态产物),**且**
- `clarification_evidence` 为**非实质**声明:`skipped`、缺失或无效。**关键**:`skipped` 在脚本 enum 里是合法值,`clarificationEvidenceDeclaredValid` 对它返回 true,因此**绝不能**用 `!clarificationEvidenceDeclaredValid` 表达本条件(那样恰好漏掉日志故障值 `skipped`)——必须另算 `clarificationEvidenceSubstantive`(= 已声明合法值 **且** 该值 ≠ `skipped`)。`skipped` 仅对 `final-prd` 构成阻塞;非 final 写模式(`checkpoint-prd` / `route-out` 等)下 `skipped` 仍合法,不触发本 finding。

即"自称 final-prd 却无任何**实质**澄清证据"= 确定性的"没真 grill"。这**不误伤**合法路径:
- 合法 `source-proven-no-ask` 的 compact-prd → `clarification_evidence=source-proven-no-ask`,有效声明,不触发。
- 合法 `asked-owner` → 有效声明,不触发。
- 合法 headless → `clarification_evidence=headless-degraded-logged`,有效声明,不触发。
- 只有"读完直接写、什么都没声明 / 声明 skipped"才触发——正是日志故障。

**与既有 `clarification_evidence_undeclared` 的区别(F2,保留为独立 reason_code)**:既有 finding 报"声明字段缺失/无效";`clarification_trace_absent` 报"自称 `final-prd` 却无实质 grill 痕迹"(write_mode-scoped,且把合法 enum 值 `skipped` 也判为非实质——这正是它独有、既有 finding 抓不到的价值)。两者互补、都阻塞 ready;readiness 与契约测试需分别消费,SKILL/reference 须各引用一次说明区别。

**机制天花板(F6,诚实标注)**:脚本只能匹配声明字符串,无法核验 source-first 是否真发生——伪造一个合法值(如 `source-proven-no-ask`)能逃过本信号,本信号只确定性地抓"诚实漏报",不抓"伪造合法值"。已有缓解:`prd-readiness-lens.md:48` 规定 `source-proven-no-ask` 必须带 source refs,否则按 `skipped` 处理。但同时伪造声明与假 source refs 仍无法被确定性捕获,这是 `Light contract / 不建 transcript` 非目标下的固有上限;本方案不试图消除,只如实记录,措辞不夸大为"杜绝没真 grill"。

### KTD-3a:堵两条"不进门"逃逸(F4 / F5)

- **F4 `prd_readiness_declarations_evaded` finding**:`needsReadinessDeclarations` 由 `artifact_kind===prd-requirements` 或正文含 `ready-for-planning` 触发(`:312-313`),模型省掉二者即可让全部 readiness finding(含 KTD-3 新增的)静默——正是"进门无强制"的同源逃逸。新增 guarded finding:当产物呈 **PRD 形态**(core sections 齐全 + 至少一个 `R-\d{2,}` id)却 `needsReadinessDeclarations===false` 时 push `prd_readiness_declarations_evaded`,readiness 视为 must-not-ready。**不改** `needsReadinessDeclarations` 本身触发条件(避免改动既有 finding 触发面),只新增这一条 guarded 检测;实现须 characterization-first 复核现有 PRD-shaped fixture 是否被新触及。
- **F5 `input_scan_attempted` advisory fact**:input-only 的 design 源(只在输入、不在产物正文)脚本本就看不到,无法靠 finding 兜;唯一确定性信号是"是否尝试过 input scan"。当 checker 在 `final-prd` 形态产物上**无 `--inputs`** 运行时,输出 advisory fact `input_scan_attempted: false`(**fact-only,不 push finding**——避免改动既有 finding-based 断言面与向后兼容 diff);readiness 对 UI/design-surface 的 `final-prd` 把 `input_scan_attempted=false` 视为 must-not-ready-until-confirmed。这让"干脆不传 `--inputs`"从静默退化变成可见事实。

### KTD-4:D2 figma degrade + owner 放行

readiness lens 增补:当 `design_source_unaccounted` 或 design 声明显示 `extraction_status: degraded`(tool 不可用)时,默认阻塞 ready-for-planning;**唯一放行路径**是 PRD 显式记录 owner 接受降级(`design_sources_unread` 列出 + owner 决策痕迹),此时 readiness 可 `ready-for-planning` 但必须在 Planning Recheck / Outstanding Questions 保留未读项。绝不因"没 tool"静默当读过。

### KTD-5:Phase 1 Preflight Sweep(逐项前置扫盲)

Preflight Sweep 是 Phase 1 写 PRD 前的 run-local map,目标是在进入正式 PRD 写作前把"输入是什么、谁权威、改哪个面、当前态是什么、变化是什么、风险写到哪里"扫清。它不是新的持久 schema、transcript、progress file 或审批流;除在现有 Readiness Self-Check 增加一个轻量声明字段 `preflight_sweep_closure`(供 checker 读取,是"不新增 run-local 字段"规则下的唯一显式例外),它只规定必须触达的问题域、写入现有 PRD sections 的位置和未闭合时的出口。

**六项必跑**:

| 项 | 触发 | 扫盲问题 | 写入位置 | 未闭合出口 |
|---|---|---|---|---|
| Input Inventory | 所有 authoring/refine/validate | 本轮输入有哪些;哪些已读取、未读、不可读、degraded | closeout、Evidence And Assumptions、Design Source Coverage | 不得 `final-prd`;需 `ask-owner-first` / `checkpoint-prd` / `route-out` |
| Authority Classification | 多源、草稿、会议、旧 PRD、外部链接 | 哪些 claim 是 owner-confirmed、source-confirmed、advisory、stale、rejected、proposal | Evidence And Assumptions、Planning Recheck、Decision Notes | 未分层 claim 不得写成 confirmed |
| Target Surface Anchor | 所有 create/refine | 产品面、页面、模块、角色、能力边界是什么 | Summary、Surface Map、Current System Snapshot | 缺失时 route-out 或 ask-owner |
| Current-State Evidence | brownfield 默认 | 当前态 claim 是否有 source/code/doc/design 证据 | Current System Snapshot、Evidence And Assumptions | 无证据只能 assumption/outstanding,不得 confirmed |
| Change Delta | 所有 PRD artifact | 变化是 add、extend、replace、remove、migrate、split 还是 policy-change | Change Delta | delta unknown 且影响 WHAT 时不得 `final-prd` |
| Risk → PRD Write Target Map | Product Expert Lens gap | 每个 load-bearing gap 写入哪个 PRD section、owner question 或 accepted assumption | run-local lens map + 对应 PRD section | 无 write target 不得停止 grill |

**四项条件触发**:

| Gate | 触发 | 必须回答 | 写入位置 | 未闭合出口 |
|---|---|---|---|---|
| Owner Question Gate | 存在 PRD-owned owner decision | 是否改变 WHAT、验收、权限、状态、数据权威、埋点或发布边界 | `next_owner_question`、Outstanding Questions、Decision Notes | 不能丢到 non-blocking Planning Recheck |
| Domain/Glossary Gate | 术语、权限、状态、归属、矛盾触发 | 关键术语是否稳定;冲突 claim 哪个权威 | Glossary、Decision Notes、Outstanding Questions | 未闭合时 ask-owner 或 revise-prd |
| Topology/Producer-Consumer Gate | workflow、contract、runtime、artifact、migration、source-of-truth 触发 | producer、artifact、consumer、source-of-truth、runtime projection 是否清楚 | Change Topology、Producer-Artifact-Consumer、Source-Of-Truth | 未覆盖时 doc-review 或 revise-prd |
| Large Input/Resume Gate | 多文档、长链路、resume-prd | 是否 reduce/checkpoint/source refs;哪些 section 已写入 | large-input checkpoint + section-level write-in | 不允许 whole-document 直写 final |

readiness lens 新增 `preflight-sweep closure`,并由 `prd-output-template.md` 的现有 `Readiness Self-Check` 承接一个轻量声明:`preflight_sweep_closure: closed | degraded | blocked | missing`。checker 在 PRD-shaped / `final-prd` / readiness declaration 目标产物缺失该声明时 push `preflight_sweep_closure_absent`;readiness lens 看到该 reason_code,或看到声明值为 `missing` / `blocked` 且仍试图 `ready-for-planning` 时,Phase 4 must not return `ready-for-planning`。契约测试只锁定 6+4 锚点、`preflight-sweep closure`、`preflight_sweep_closure` 声明和 must-not-ready 语义,不锁具体问题文本或推理路径,避免把扫盲变成重状态机。

**机制天花板(同 F6,诚实标注)**:checker 只检测 `preflight_sweep_closure` 声明的存在性与枚举合法性,**不核验六项是否真扫**。模型谎写 `preflight_sweep_closure: closed` 能逃过本 finding——它确定性地抓"根本没声明",抓不到"声明 closed 却没扫"。语义是否充分仍由 readiness lens(LLM)+ 六项必跑/四触发 residue 的语义裁决兜底;这层 enforcement 比 grill/design 的脚本兜底弱一档,本方案如实记录、不夸大为"杜绝没扫盲"。

---

## System-Wide Impact

- **双宿主**:改 source 后 `.claude/` `.codex/` `.agents/skills/` 需 `spec-first init` 同步(本方案不手改 mirror)。
- **脚本消费方**:`check-prd-artifact.js` 被 SKILL.md:209 Phase 4 调用、被 `run-evals.js` 与 `spec-prd-contracts.test.js` 调用。`--inputs` 标志本身向后兼容(无 inputs 不改既有调用);新 finding/fact(`preflight_sweep_closure_absent`、`input_scan_attempted` 等)对断言的影响见 Risks 表"新 finding/fact 触及现有调用与断言"行,非全局零破坏。Phase 4 调用点需更新为"PRD artifact 存在且原始输入可定位时,带 `--inputs` 调用"。
- **Preflight source surfaces**:Phase 1 前置扫盲需同步 `SKILL.md`、`product-expert-lens.md`、`prd-output-template.md`、`prd-readiness-lens.md` 和契约测试;它只写入现有 PRD sections,不新增第二 artifact topology。
- **契约测试**:`spec-prd-contracts.test.js`(2517 行)需加新断言(grill/design/input-readiness finding 的正向/负向 + runtime projection),并复核是否有"少问是美德"残留断言需翻转(001 已清大部分,本轮补 design/grill 强制语义)。
- **eval fixtures**:`examples.json` 已有 `figma-unread-prd-ready-rejected` / `figma-omitted-from-coverage-ready-rejected`(L217-243),本方案让脚本真正能兜住它们——需复核 fixture 期望与新 finding 一致。

---

## Implementation Units

### U1. 扩展 check-prd-artifact.js:输入侧 design 探测 + grill 痕迹检测

**Goal**:脚本产出 grill/design/input-readiness deterministic findings,`--inputs` 对旧调用向后兼容,对 Phase 4 可定位输入是必传合同。

**Requirements**:D1、D3、KTD-2、KTD-3。

**Dependencies**:无(纯脚本,不受会话缓存影响,可独立验证)。

**Files**:
- `skills/spec-prd/scripts/check-prd-artifact.js`(改 `parseArgs`;加 `--inputs` 文件扫描;加 `clarification_trace_absent`、`design_source_unaccounted`、`input_refs_unavailable`、`input_scan_degraded`、`prd_readiness_declarations_evaded`、`preflight_sweep_closure_absent` 逻辑;facts 增 `input_refs_used`、`input_design_refs_present`、`input_scan_degraded`、`clarification_trace_present`、`input_scan_attempted`、`preflight_sweep_closure`)
- `tests/unit/spec-prd-contracts.test.js`(新断言,见 Test scenarios)

**Approach**:
- `parseArgs`:保留首个位置参数为 target;识别 `--inputs`(支持 `--inputs a,b` 与多次 `--inputs`);未知 `--` flag 仍按现有 error 处理风格记 fact。
- 新增 `scanInputDesignRefs(inputPaths)`:**只逐个读显式文件(F8:不递归扫目录)**并同时检查输入路径/文件名;正文复用 `detectDesignSourceRefs` 正则并补 `Figma <digits>-<digits>` 节点简写,路径/文件名命中 `figma|design|设计稿` 也计入 input-side design source signal;任一命中 → `input_design_refs_present=true`;记录 `input_refs_used` 为实际读取成功的 repo-relative/传入路径列表;读失败 → `input_scan_degraded=true`。
- finding 逻辑(append 到现有 findings 数组,与 L340-360 同位):
  - 先算 `writeModeIsFinalPrd`(从声明的 `write_mode` 提取,需新增,注意去引号/空白)与 `clarificationEvidenceSubstantive`(已声明合法 `clarification_evidence` **且** 值 ≠ `skipped`;`skipped`/缺失/无效均为非实质);`if (needsReadinessDeclarations && writeModeIsFinalPrd && !clarificationEvidenceSubstantive)` → push `clarification_trace_absent`。**不要**复用 `!clarificationEvidenceDeclaredValid`(它对 `skipped` 为 false,会漏掉日志故障值)。
  - `if (inputDesignRefsPresent && !designSourceInventoryDeclared)` → push `design_source_unaccounted`。
  - `if (inputPaths.length > 0 && inputRefsUsed.length === 0)` → push `input_refs_unavailable`。
  - `if (inputScanDegraded)` → push `input_scan_degraded`。
  - `if (prdShaped && !needsReadinessDeclarations)` → push `prd_readiness_declarations_evaded`(`prdShaped` = core sections 齐全 + 至少一个 `R-\d{2,}` id;F4 guarded finding)。
  - advisory fact `input_scan_attempted = inputPaths.length > 0`(F5,**只入 facts,不 push finding**);readiness 对 `writeModeIsFinalPrd && input_scan_attempted===false` 的 UI/design-surface PRD 视为 must-not-ready-until-confirmed。
  - 解析 `preflight_sweep_closure` 声明(`closed | degraded | blocked | missing`);`if ((prdShaped || writeModeIsFinalPrd || needsReadinessDeclarations) && !preflightSweepClosureDeclaredValid)` → push `preflight_sweep_closure_absent`。脚本只检测声明存在性/枚举合法性,不判定 sweep 语义是否真的充分。
- 不改任何现有 finding 的触发条件(避免破坏既有断言);新增 `prd_readiness_declarations_evaded`、`input_scan_attempted` 与 `preflight_sweep_closure_absent` 须 characterization-first 复核现有 fixture 是否被新触及。

**Patterns to follow**:现有 `design_source_*_undeclared` 的 finding push 形态(L349-359);`hasValidDeclaration`(L290-306)读声明的方式;兄弟脚本 `check-glossary-drift.js` 的 error+exit fact 风格。

**Execution note**:characterization-first——先对当前脚本加"无 `--inputs` 时既有 exit code / findings / 核心 facts 不变"的固化断言,再加新逻辑。

**Test scenarios**(`tests/unit/spec-prd-contracts.test.js`):
- 无 `--inputs` 调用,产物为既有 fixture → 既有 exit code / findings / 核心 facts 与改动前兼容,但允许新增 advisory fact `input_scan_attempted:false` 与 preflight closure 相关 fact/finding(向后兼容固化不再要求 JSON 逐字一致)。
- `--inputs` 指向含 figma 链接的输入 + 产物无 `design_source_inventory` → finding 含 `design_source_unaccounted`。
- `--inputs` 指向含 figma 链接 + 产物已声明 `design_source_inventory` → **不**含 `design_source_unaccounted`(负向)。
- 产物 `write_mode: final-prd` 且无有效 `clarification_evidence` → finding 含 `clarification_trace_absent`。
- 产物 `write_mode: final-prd` 且 `clarification_evidence: skipped` → **必含** `clarification_trace_absent`(正向,锁定日志故障值——`skipped` 是合法 enum 值,必须被实质判定捕获;此断言专门防回退到 `!clarificationEvidenceDeclaredValid`)。
- 产物 `write_mode: final-prd` 且 `clarification_evidence: source-proven-no-ask` → **不**含 `clarification_trace_absent`(负向,保护合法 compact-prd)。
- 产物 `clarification_evidence: headless-degraded-logged` → **不**触发(负向,保护合法 headless)。
- 产物 `write_mode: checkpoint-prd` 且 `clarification_evidence: skipped` → **不**触发(负向,`skipped` 仅对 final-prd 阻塞)。
- `--inputs` 指向不存在路径 → `input_scan_degraded` fact + finding 出现且不抛错;readiness 消费后不得静默 `ready-for-planning`。
- `--inputs` 全部不可读 → `input_refs_unavailable` finding 出现,不能只当纯产物检测成功。
- `--inputs` 指向显式文件 `source_docs/Figma-市场页设计稿链接.md`(F8:只收文件,不扫目录);当该文件含 design source 信号而 PRD 无 coverage 时,报 `design_source_unaccounted`。
- 产物呈 PRD 形态(core sections 齐 + 有 `R-\d{2,}` id)但无 `artifact_kind: prd-requirements` 且正文无 `ready-for-planning` → finding 含 `prd_readiness_declarations_evaded`(F4 正向);非 PRD 形态产物 → **不**含(负向)。
- `final-prd` 形态产物无 `--inputs` 运行 → facts 含 `input_scan_attempted: false`(F5);带 `--inputs` 运行 → `input_scan_attempted: true`。
- PRD-shaped / `final-prd` / readiness declaration 目标产物缺少 `preflight_sweep_closure` → finding 含 `preflight_sweep_closure_absent`。
- 产物声明 `preflight_sweep_closure: closed` → **不**含 `preflight_sweep_closure_absent`(只证明可检测声明存在,不证明语义充分)。
- 产物声明 `preflight_sweep_closure: missing` 或 `blocked` 且仍宣称 `ready-for-planning` → readiness-lens must-not-ready 断言覆盖。
- `--inputs a,b` 与多次 `--inputs` 解析等价。
- **复现 motivating 故障(F3)**:把 real-run KAZ PRD(或忠实复刻)做成 fixture,带其原始输入跑 checker,断言至少一条新 finding(`design_source_unaccounted` 或 `clarification_trace_absent`)触发;并在 Direct Evidence / U5 记录该 PRD 实际的 `write_mode` / `clarification_evidence` / `artifact_kind`,以证明本方案确实兜住所引故障。若发现该 PRD 当时 `needsReadinessDeclarations=false`(无 `artifact_kind: prd-requirements` 且正文无字面 `ready-for-planning`),则必须先处理该闸(见 Open Questions F4),否则任何新 finding 都不会触发。

**Verification**:`npx jest tests/unit/spec-prd-contracts.test.js` 全绿;`node skills/spec-prd/scripts/check-prd-artifact.js <fixture>`(无 inputs)既有 exit code / findings / 核心 facts 与改动前兼容(允许新增 `input_scan_attempted` 与 `preflight_sweep_closure` 相关 fact/finding,**不再要求 diff 逐字为空**);带真实 KAZ source_docs fixture 的 `--inputs` 运行能稳定报 `design_source_unaccounted`。

---

### U2. SKILL.md:强制语义 + Phase 1 Preflight + Phase 4 调用点

**Goal**:把"Phase 1 必须先扫盲""强制进 grill""强制处理 design 源"写进 source-of-truth,Phase 4 调用脚本时带 `--inputs`,readiness 强制消费 preflight residue 与 grill/design/input-readiness findings。

**Requirements**:D1、D2、D4、D5、KTD-1、KTD-2a、KTD-3a、KTD-4、KTD-5。

**Dependencies**:U1(finding 的 reason_code 名称定稿后才能在 SKILL 引用)。

**Files**:`skills/spec-prd/SKILL.md`

**Approach**:
- 原则 4(L80):补一句"进入 create/refine PRD authoring 后,grill 痕迹是强制的——不允许读完输入直接 final-prd 而无合法 `clarification_evidence`;`compact-prd` 的合法前提是 source-first 已闭合每个 load-bearing 分支并留下可检测澄清痕迹,不是读完直接写"。明确 D4 边界:route-out/bypass 是 authoring 前的分类退出,不是 grill 豁免。
- Phase 1:在 sanitization/current-state orientation 后、Product Expert Lens / Pre-Write Closure Gate 前插入 Preflight Sweep;列出六项必跑与四项条件触发 gate;强调它是 run-local map,写入现有 PRD sections,不新增 artifact。
- L174 design 段:补"探测到 design 源时,`design_source_inventory` 是强制的(哪怕 unread);tool 可用必须真走 fetch 链,不可用必须 loud degrade 记 `design_sources_unread` + 原因,绝不当背景读掉"。
- Phase 4(L209):调用 checker 时使用可被 runtime adapter rewrite 的 operational source path:`node skills/spec-prd/scripts/check-prd-artifact.js <prd-path> --inputs <原始输入路径>`;原始输入可定位时必须带 `--inputs`,以启用输入侧 design 漏读检测。
- Phase 4 若从当前 `prd_input`、source docs 或 source input refs 能定位原始输入,但无法形成 checker `--inputs` 参数,必须在 readiness bridge 中显式记录 `input_refs_unavailable` 并降级,不得只运行无 inputs 的纯产物检测后宣称覆盖输入侧 design-source gate。
- Phase 4 readiness bridge 必须消费 Preflight Sweep 残留:六项必跑未闭合、triggered gate 未写入目标 section、risk 没有 PRD write target,或 checker 返回 `preflight_sweep_closure_absent` 时,不得返回 `ready-for-planning`。
- L210:把 `clarification_trace_absent`、`design_source_unaccounted`、`input_refs_unavailable`、`input_scan_degraded`、`prd_readiness_declarations_evaded`、`preflight_sweep_closure_absent` 加入"checker 返回则 Phase 4 must not return ready-for-planning"的 reason_code 列表;并规定 readiness 对 advisory fact `input_scan_attempted=false`(final-prd + UI/design-surface)视为 must-not-ready-until-confirmed;补 D2 owner 放行例外(degraded + owner 显式接受 → 可 ready 但保留 unread 残留)。
- Decision Card / Canonical:Decision Card 本身不新增字段(复用 `clarification_evidence` + `write_mode`);D5 唯一的新声明 `preflight_sweep_closure` 落在 `prd-output-template.md` 的 Readiness Self-Check,不进 Decision Card。仅在 Canonical 兜底段补一句"final-prd 要求 `clarification_evidence` 为非 skipped 的有效值"。

**Patterns to follow**:L210 既有"checker 返回 X → 不得 ready"句式;`src/cli/skill-path-rewrite-markers.js` 对 `skills/<skill>/...` operational source path 的 rewrite 规则;001 的 Canonical 引用风格(不复述)。

**Test scenarios**:见 U4(SKILL 措辞断言集中在契约测试)。

**Verification**:`npm run lint:skill-entrypoints`;人工核对 reason_code 名称与 U1 脚本一致;contract test 验证 Phase 1 Preflight Sweep anchors 与 Claude/Codex runtime projection 后分别包含 `.claude/spec-first/workflows/spec-prd/scripts/check-prd-artifact.js` 与 `.agents/skills/spec-prd/scripts/check-prd-artifact.js`。

---

### U3. references 同步:readiness-lens / design-source-evidence / output-template / product lens

**Goal**:reference 与 SKILL 强制语义对齐,readiness lens 明确消费 preflight residue、grill/design/input-readiness findings 与 D2 放行。

**Requirements**:D1、D2、D5、KTD-1、KTD-4、KTD-5。

**Dependencies**:U2(SKILL 语义定稿)。

**Files**:
- `skills/spec-prd/references/product-expert-lens.md`(把 Risk → PRD Write Target Map 写成 lens 小接口,明确 gap 必须绑定 PRD write target 或 blocker)
- `skills/spec-prd/references/prd-readiness-lens.md`(L38 声明消费段:加 `clarification_trace_absent`/`design_source_unaccounted`/`input_refs_unavailable`/`input_scan_degraded`/`prd_readiness_declarations_evaded`/`preflight_sweep_closure_absent` 六类 reason_code + advisory fact `input_scan_attempted=false` 的消费;Core Pack 增 `preflight-sweep closure`;L48 复用既有"`source-proven-no-ask` 无 source refs → 按 `skipped` 处理"规则呼应 F6 天花板;L108 design-evidence closure:加"输入有 design 源但产物未 account / 输入引用不可用或扫描 degraded / 未尝试 input scan → 不得 ready,除非 owner 显式接受 degrade";L138 handoff entropy:grill 痕迹缺失与 preflight residue 纳入)
- `skills/spec-prd/references/design-source-evidence.md`(L58 degrade 段:补"degraded 默认阻塞 readiness,owner 显式接受才放行且保留 unread")
- `skills/spec-prd/references/prd-output-template.md`(L208-230 Design Source Coverage:强调 inventory 强制、unread 须显式列;现有 sections 承接 Preflight Sweep 结果;Readiness Self-Check 增 `clarification_evidence` 非 skipped、`preflight_sweep_closure` 声明与 `preflight-sweep closure` 提示)

**Approach**:全部走"引用 SKILL 强制语义 + 脚本 reason_code + preflight-sweep closure",不重复定义,不新造字段。

**Patterns to follow**:001 改造的 reference 引用 canonical 而非复述的风格。

**Test scenarios**:见 U4。

**Verification**:跨文件 grep 确认 reason_code、Preflight Sweep、`preflight-sweep closure` 名称一致、无措辞漂移。

---

### U4. 契约测试 + eval fixtures:新断言 + 残留翻转复核

**Goal**:契约测试断言 Preflight Sweep anchors、grill/design/input-readiness findings 的正/负向行为、runtime projection 与 SKILL/reference 强制语义;复核 examples.json 与残留"少问是美德"断言。

**Requirements**:全部。

**Dependencies**:U1-U3(源改完,characterization-first)。

**Files**:
- `tests/unit/spec-prd-contracts.test.js`(SKILL/reference 强制语义断言:含"强制 grill 痕迹""design inventory 强制""owner 放行例外"措辞;复核并翻转任何与"强制"冲突的旧断言)
- `skills/spec-prd/evals/examples.json`(复核 `figma-unread-prd-ready-rejected` / `figma-omitted-from-coverage-ready-rejected` 期望与新 finding 一致;按需补 grill 痕迹缺失被拒的 case)

**Approach**:U1 的脚本行为断言已在 U1 内;本 unit 聚焦 prose 契约断言与 eval。先跑全量定位需翻转的旧断言,逐条确认是"该翻转的旧止损语义"而非"该保留的负向锁"。

**Test scenarios**:
- SKILL 含"grill 痕迹强制 / 不允许读完直接 final-prd"语义断言(正向)。
- SKILL 含 D4 边界"route-out/bypass 是 authoring 前退出,非 grill 豁免"断言。
- SKILL Phase 1 含 Preflight Sweep、六项必跑、四项条件触发 gate,并明确写 PRD 前必须进入。
- SKILL Phase 4 operational checker 调用使用 `node skills/spec-prd/scripts/check-prd-artifact.js <prd-path> --inputs <input-path>` 形态,避免裸 `scripts/check-prd-artifact.js <prd-path>` 在业务仓执行失败。
- Claude runtime projection 渲染后包含 `.claude/spec-first/workflows/spec-prd/scripts/check-prd-artifact.js` operational 调用路径。
- Codex runtime projection 渲染后包含 `.agents/skills/spec-prd/scripts/check-prd-artifact.js` operational 调用路径。
- readiness-lens 含 `clarification_trace_absent`、`design_source_unaccounted`、`input_refs_unavailable`、`input_scan_degraded`、`prd_readiness_declarations_evaded`、`preflight_sweep_closure_absent` 六类 reason_code 消费断言 + advisory fact `input_scan_attempted=false` 消费断言 + `preflight-sweep closure` must-not-ready 断言。
- output template 断言 Preflight Sweep 结果写入现有 sections,在 `Readiness Self-Check` 暴露 `preflight_sweep_closure`,且不得新增第二 PRD artifact topology。
- Product Expert Lens 断言 Risk → PRD Write Target Map 是必经 run-local interface。
- design-source-evidence 含"degraded 默认阻塞 + owner 放行"断言。
- checker fixture:构造真实 KAZ 风格输入**文件**(F8:显式文件而非目录),`source_docs/Figma-市场页设计稿链接.md` 文件名暴露 Figma/design source,正文只有 `Figma 114-17842`;当 PRD 无 `design_source_inventory` / design coverage 时必须报 `design_source_unaccounted`。
- `prd_readiness_declarations_evaded` 正/负向断言(PRD 形态但无 readiness 触发器 → 报;非 PRD 形态 → 不报);`input_scan_attempted` fact 在带/不带 `--inputs` 下分别为 true/false 的断言。
- `preflight_sweep_closure_absent` 正/负向断言(PRD 形态/final/readiness 目标缺声明 → 报;声明 `closed` → 不报)。
- `run-evals.js --json` → `eval_fixture_passed`。
- eval case:multi-source PRD 缺 target/current-state/delta/write-target 时不能 ready。
- 复核:无与"强制"矛盾的残留"stop rather than interview / 少问是美德"正向断言(若有则翻转或转负向锁)。

**Verification**:`npx jest tests/unit/spec-prd-contracts.test.js`、`node skills/spec-prd/scripts/run-evals.js --json`、`npm run test:unit` 全绿。

---

### U5. CHANGELOG + fresh-source eval 收尾

**Goal**:记录 user-visible 变更;补 fresh-source eval(诚实标注 dispatch 行为验证是否执行);更新 STRUCTURAL-GATE-SKIPPABLE finding 状态。

**Requirements**:治理约束。

**Dependencies**:U1-U4。

**Files**:
- `CHANGELOG.md`(新版本条目,`fix(spec-prd)`,`(user-visible)`,作者 leokuang)
- `docs/validation/spec-prd/fresh-source-eval-2026-06-25-enforce-grill-design-gate.md`(新建;`supersedes` 不适用——这是延续不是取代;关联 001 的 eval 与 STRUCTURAL-GATE-SKIPPABLE)
- `docs/validation/spec-prd/fresh-source-eval-2026-06-25-relentless-grill.md`(STRUCTURAL-GATE-SKIPPABLE finding 标注"已由 002 plan 处理")
- `docs/05-用户手册/22-PRD需求文档质量增强流程.md`(若强制语义影响用户可见流程描述,同步)

**Approach**:eval 按 `docs/contracts/workflows/fresh-source-eval-checklist.md`;若本会话仍无 subagent 授权,deterministic 验证(契约测试 + 脚本真实运行 + `--inputs` 真实样本)为主,行为 eval 记 `not_run` + reason_code,与 001 一致诚实标注。

**Test scenarios**:`node scripts/check-changelog-format.js`(或等价);eval 文件 schema 自检。

**Verification**:changelog-format 通过;eval 字段完整。

---

## Risks & Anti-Patterns

| 风险 | 缓解 |
|------|------|
| **figma 无 tool 误卡死**(D2 核心) | degraded 默认阻塞但 owner 显式接受可放行;脚本只报 `design_source_unaccounted` fact,不强制 fail,放行裁决在 readiness lens(LLM) |
| **grill 痕迹检测误伤合法 compact-prd / source-proven** | 信号设计为"final-prd 且 `clarification_evidence` 非实质(skipped/缺失/无效)";`skipped` 经 `clarificationEvidenceSubstantive` 显式判为非实质(不能靠 `clarificationEvidenceDeclaredValid`),合法路径都有实质有效声明(source-proven-no-ask / asked-owner / headless-degraded-logged),不触发(U1 正/负向断言锁定) |
| **新 finding/fact 触及现有调用与断言** | `--inputs` 标志本身向后兼容(无 inputs 不改既有 exit code / findings / 核心 facts);但 `preflight_sweep_closure_absent` 与 advisory fact `input_scan_attempted` 会在 PRD-shaped / final-prd / readiness 目标产物上**新触发**,故不再保证 JSON 逐字一致——characterization-first 先锁既有语义,再批量更新受影响的 PRD-shaped fixture 断言,而非声称"零新增" |
| **脚本越权做语义判断** | 脚本只 push `reason_code`,绝无 readiness 判定;沿用 L340-360 + readiness-lens:38 既有 pattern,不新造机制 |
| **D4"全部强制"被误读为也 grill route-out 输入** | Decision Brief 明确:route-out/bypass 是 authoring 前分类退出;强制只在判定 create/refine authoring 后生效 |
| **preflight checklist 膨胀为重状态机** | 只锁 6+4 锚点、出口和现有 section 写入位置,不锁路径/顺序/具体问题文本;不新增持久 schema/transcript/progress file/审批流 |
| **扫盲项沦为口号** | readiness 必须消费 `preflight-sweep closure`;六项必跑或 triggered gate residue 未闭合时,Phase 4 不得 `ready-for-planning`;契约测试锁 must-not-ready 语义 |
| **输入格式多样 `--inputs` 扫不全** | 复用已验证的 `detectDesignSourceRefs` 正则并补 KAZ 风格 `source_docs/Figma-市场页设计稿链接.md` fixture;扫不到/不可读是 degraded finding(`input_scan_degraded`/`input_refs_unavailable`),readiness 必须消费且不得静默 ready。只有完全无输入上下文的向后兼容旧调用才退回纯产物检测,且不得声称覆盖输入侧 design-source gate |
| **会话缓存导致 prose 改动未生效** | 脚本类(U1)不受缓存影响可直接验证;prose 类(U2-U4)按 CLAUDE.md 用 fresh-source eval 或源码真相源验证,不依赖当前会话已缓存的 skill 调用 |

**Anti-patterns 明确避免**:不引入 phase-status 强转 / transcript / 进度文件;不让脚本阻止模型自由选问哪个分支;不把"强制"做成中心化流程引擎;不新增 run-local 字段(复用 `clarification_evidence` + `write_mode`;**唯一显式例外**是 D5 的 `preflight_sweep_closure` 单字段声明,写在现有 Readiness Self-Check、供 checker 读取,不引入新 schema/section/topology);不新增第二 PRD artifact topology。

---

## Non-Goals

- 不改 generated runtime mirror(`.claude/` 等),runtime 同步走 `spec-first init`。
- 不新增 PRD artifact 拓扑、不建 `docs/prds/`。
- 不做真正的 figma fetch 实现(figma tool 能力是外部/可选 provider,本方案只强制"显式处理 + 不漏读",不替宿主装 figma)。
- 不重写 001 的 relentless / Canonical 四停点(本方案是其延续,复用其字段与 canonical)。
- 不把脚本变成 readiness 裁决者(语义判断永远 LLM-owned)。
- 不在本方案内跑 dispatch 行为 eval 若会话无授权(诚实记 not_run,与 001 一致)。

---

## Sequencing

最小可维护落地顺序(严格串行,characterization-first):

1. **U1**(脚本 + 脚本行为断言)— 不受会话缓存影响,先把确定性兜底做实并验证向后兼容。
2. **U2**(SKILL 强制语义 + Phase 1 Preflight + Phase 4 `--inputs` 调用点)— 依赖 U1 的 reason_code 定稿。
3. **U3**(references 同步,含 preflight residue 与 reason_code 消费)— 依赖 U2 语义定稿。
4. **U4**(prose 契约断言 + eval 复核翻转)— 依赖 U1-U3 源改完。
5. **U5**(CHANGELOG + fresh-source eval + finding 状态)— 收尾。

每步跑最窄验证;U4 后跑 `npm run test:unit` 全量;全部完成后 `spec-first init` 由用户手动控制(与 001 同,工作区已 dirty)。

---

## Deferred / Open Questions

### Resolved (2026-06-25 doc-review)

全部经 doc-review + AskUserQuestion 定夺并已折入对应 unit:
- **F2 → 保留 + 标明区别**:`clarification_trace_absent` 保留为独立 reason_code(F1 修复后它独有"final-prd + `skipped`"价值,既有 `clarification_evidence_undeclared` 抓不到);区别说明已写入 KTD-3,断言落在 U4。
- **F4 → 加 guarded finding**:新增 `prd_readiness_declarations_evaded`(PRD 形态但 `needsReadinessDeclarations=false`),见 KTD-3a / U1 / U2 / U3 / U4;不改 `needsReadinessDeclarations` 既有触发面。
- **F5 → 加 advisory fact**:新增 `input_scan_attempted`(final-prd 无 `--inputs` 运行时为 false),fact-only,由 readiness 对 UI/design-surface 裁决,见 KTD-3a / U1 / U2 / U3。
- **F6 → 如实记录天花板**:KTD-3 增"机制天花板"段并引用 `prd-readiness-lens.md:48`(`source-proven-no-ask` 无 source refs → 按 `skipped` 处理);不加佐证-artifact 要求(避免向 transcript 漂移)。
- **F7 → 写明代价**:D4 边界澄清增"代价透明"条。
- **F8 → 只收显式文件**:`--inputs` 不再支持目录,KTD-2 / U1 Approach / U1 与 U4 fixture 同步改为显式文件。

### 仍开放(实施时定)

- **FYI**:`input_scan_degraded` 同作 fact 与 finding,若与 `input_refs_unavailable` 的 readiness 处置一致可合并;建议 U4 加 body×input 四象限覆盖矩阵断言(既有 design finding body-gated vs 新 `design_source_unaccounted` input-gated)。
- **实现备注**:`writeModeIsFinalPrd` 当前不是 `buildReport` 已算出的 fact,需新增并定清提取方式(去引号 / 空白)。待定:`src/cli/skill-path-rewrite-markers.js` 是否已覆盖 KTD-2a 的 `node skills/.../check-prd-artifact.js <prd> --inputs <path>` operational 形态。
