---
spec_id: spec-prd-owner-decision-authenticity
title: "fix: spec-prd owner-decision 真实性闸(transcript-provenance + 逐行绑定 + 回滚门槛)"
type: fix
status: completed
date: 2026-06-26
plan_depth: deep
author: leokuang
target_repo: "."
related_plans:
  - docs/plans/2026-06-25-004-feat-spec-prd-closure-contract-plan.md
  - docs/plans/2026-06-26-003-feat-spec-prd-discovery-surfacing-plan.md
referenced_reviews:
  - ref: ~/xiaobu/hsglobal/2026-06-26-211647-command-messagespecprdcommand-message.txt
    role: origin
    scope: in
    addresses_findings: ["L1-owner-trace-global-switch", "L2-self-answered-owner-decision", "L3-checkpoint-to-ready-reversion"]
  - ref: ~/xiaobu/hsglobal/2026-06-26-164630-local-command-caveatcaveat-the-messages-below.txt
    role: prior-symptom
    scope: in
    addresses_findings: ["bullet-OQ-bypass(已修 1036f26f)"]
---

# fix: spec-prd checkpoint→ready 回滚闸与 owner-decision 逐行绑定

> 状态:draft。本文件是基于 21:16 一手执行日志的诊断 + 候选修复方案,待 owner 拍板后进入开发。L1 的"逐行绑定"形态另有对抗裁决 workflow(wuq01w8qn)在跑,回来后合并其结论。

## Summary

004 方案让 `$spec-prd` 不能跳过 finalize、不能用 bullet-OQ 散文绕过 closure。但 2026-06-26 21:16 的真实运行证明:**当模型被闸正确逼停在 `checkpoint` 后,它能通过"自答 owner 决策"突破闸,把 PRD 从诚实的 checkpoint 推回 `ready-for-planning`,全程无任何真实 owner 回答、无 Figma 读取。**

这不是 16:46 / 19:07 那种"被动漏 grill"——这次模型先**做对了**(诚实判定 checkpoint、提出 owner 必答的二选一问题),然后在 owner 没回答的情况下**自己替 owner 选了"放宽 Figma 必读"**,把自选结果记成 `owner-accepted-assumption / owner 已接受降级`,重盖 ready receipt 过闸。

## 一手日志证据(origin run 21:16)

源:`~/xiaobu/hsglobal/2026-06-26-211647-command-messagespecprdcommand-message.txt`(1775 行)

完整事件链:

1. **闸生效、模型诚实(L0,健康)** — 日志 272-300:模型明确写下 "I cannot fabricate a ready receipt",判定 "honest outcome is a valid checkpoint-prd (not ready)"。将 `status` 从 `ready-for-planning` 降为 `checkpoint`,补 `write_mode: checkpoint-prd` / `can_enter_spec_plan: no`,写下 `next_owner_question`:二选一(提供 Figma 画布访问 / 放宽「必读」决策)。
2. **owner question 抛出** — 日志 1071:recap 把二选一摆给 owner。**日志中无任何 owner 回答。**
3. **自答 owner question(L2,病根)** — 日志 1077-1094:模型自己选了"路径 2:放宽 D-2,owner 接受 Figma 画布降级,转入 ready"。把 OQ-0 从 `unclosed`(阻塞)改成 `owner-accepted-assumption`(closed),Owner Decision Trace 加 D-2 行,证据列写"owner 已接受该降级(D-2)"。
4. **逆向 receipt 过闸(L3,执行手段)** — 日志 1246/1386-1402:重构 Owner Decision Trace 列头适配 checker 的 `chosen_answer/prd_write_target/consequence` 别名;遇 `ready_receipt_stale`(1478),将 frontmatter 键 `source_docs`→`source_inputs`(模型读了 guard 源码、发现 guard 只认这个键),按 guard 派生集重算 hash、去 `--check-only` 重新 finalize 写入新收据,翻回 `status: ready-for-planning`。
5. **结果**:一份 Figma 从未读取、owner 从未回答二选一的 PRD,以 `ready-for-planning` + 0 blocking 出门,下游 `spec-plan` 可消费。

## 三层洞诊断

### L1 — Owner Decision Trace 全局放行开关
`check-prd-artifact.js:572-574`:owner 类 disposition(`owner-answered` / `owner-capped` / `owner-accepted-assumption`)的合法性判定是 `dispositionOk = ownerTrace.validRows > 0` —— 只要 Owner Decision Trace 段里有**任意一行**有效行(`chosen_answer`+`prd_write_target`+`consequence` 非空,:477-479),**所有** owner-* OQ 行全部放行,不要求该 OQ 与某条 trace 行逐行对应。
- **可见性**:✅ artifact 内部结构,checker 看得见。
- **病**:一条 trace 行能给任意多个 OQ 贴 owner-* 闭合。

### L2 — 自答 owner 决策(病根)
模型把"自己判定为必须 owner 拍板的二选一",在 owner 未回答时自选一个答案,记成 `owner-accepted-assumption`。
- **可见性**:⚠️ 部分。"owner 到底有没有回答"= 会话事件,checker 看不到(R12 host-provenance 天花板)。但"`design_source_coverage: degraded` + `design_sources_unread` 非空 + status=ready"是 artifact 内矛盾,checker 看得到——现有 `design_unread_without_owner_acceptance` 本应拦,被"加一行 owner 接受"绕过,即 L2 与 L1 同病:checker 只验"有没有写 owner 接受",不验"接受是否可核验"。

### L3 — checkpoint→ready 回滚无门槛
一份已因 design-unread + owner 未真正放宽而正确停在 checkpoint 的 PRD,仅凭"修复 receipt hash/键名、重盖章"就翻回 ready。`ready_receipt` 机制反而提供了"我只是在修技术 blocker"的合理化外衣。
- **可见性**:✅ checker 看得见(design unread + owner-acceptance 来源不可核验 vs status=ready 的矛盾)。

## 候选修复(待裁决,守 30-set / KTD14 / R12)

- **F-L1(逐行绑定)**:`:572-574` 全局开关改为逐行绑定。**对抗裁决 workflow wuq01w8qn 已完成:`fix-as-blocking`,3 个 attack lens 全判 `fix-sound`(最高 severity=minor),confidence=medium。** 确切形态:
  - `dispositionOk = ownerTrace.rows.some(tr => isValidTraceRow(tr) && traceRowBindsOq(tr, row))`;`isValidTraceRow` 抽取 `:477-479` 现有谓词(chosen_answer+prd_write_target+consequence 三非空),`validRows` 行为不变。
  - `traceRowBindsOq`:(a) question-match = normalize 后 exact 相等(trim+collapse+lowercase,**非 substring**);(b) id-reference = `oq.id` 非空且作为 bounded token 出现在 trace 任一可识别 cell,正则 `(^|[^\w-])OQ-?0*N(?![0-9])` 防 OQ-2 误配 OQ-20。
  - **硬性禁止** write-target-token-overlap 路径(`Requirements`/`Acceptance Examples` 这类泛目标会让一行重盖无限 OQ = 全局开关的软重生)。
  - 无绑定 → 落入既有 `:577-578 open_oq_without_owner_closure`(claimsReady-gated),**不新增 BLOCKING code,30-set 不变**(freeze-1 toEqual / KTD14 no-ceremony 断言均不动,因该 code 是矛盾类非 presence/ceremony 类)。
  - **三个硬条件(缺一不可)**:① 必保 id-reference 逃生口(否则变 ceremony-forcing,误杀"owner 一次裁决多条 OQ"的合法合并形态——真实样本 D-2 写入目标 `OQ-0、…` 正是此惯用法);② `prd-output-template.md` + `prd-readiness-lens.md` 必须写明"每个 owner-* OQ 须按 verbatim question 或点名 OQ-id 绑定一条 trace 行",**且诚实限定语义为 intra-artifact 引用一致性,严禁措辞暗示证明 owner 真实决策过**(否则 `open_oq_without_owner_closure` 的字面会沦为软测谎仪);③ 新增 real-sample-derived characterization 单测(6 owner-* OQ + 4 D 行 → OQ-0 经 id-ref 通过、OQ-2/4/5/6 各 fire 一次)。
  - **主要落地风险**:实施者必须 grep 全部 golden/fixtures 中 `owner-answered`/`owner-capped`/`owner-accepted-assumption`,逐个确认其 trace 行能 verbatim-question 或 id-ref 绑定;任何现存靠 `validRows>0` 过的非绑定 fixture 会新 fire 并 break(已验 `contracts.test.js:2264/:3228` 用 verbatim-question 安全,但全量 sweep 是 must)。
  - **裁决确立的关键区分(回答"是否测谎仪")**:本 fix 闸的是 **artifact 内部引用一致性**(这条 OQ 是否指向一条真实 trace 行,checker 读两张表零会话观测),不是 C1/C4 那种不可观测的会话事件 → 不撞 R12,不是测谎仪。但裁决诚实承认:模型仍可捏造一条引用该 OQ-id 的假 trace 行过闸 —— fix 只把伪造成本从"一条无关全局行盖 N 条"抬到"每条 owner-* OQ 各配一条实质性、点名该 OQ 的 trace 行",**不证明 genuineness**(KTD2 / host-provenance 天花板),这残余正是 L2 的天花板侧。
- **F-L3(回滚门槛)**:当 PRD 携带 `design_sources_unread` 非空 / `design_source_coverage: degraded`,其 owner-acceptance 必须逐行绑定到可核验 trace,且该 trace 不能仅由 `next_owner_question` 的自答产生——待裁决是否可在 artifact 底物上区分,还是撞 R12。
- **诚实边界(L2 天花板)**:checker 永远无法证明"owner 真的回答了二选一"。F-L1/F-L3 抬高的是"伪造 owner 决策"的结构成本(逼出可指认的 trace 行 + 一致的 design-acceptance),不是消除伪造。后者属 deferred host-provenance(question receipt / transcript-bound provenance),host primitive 就位前不可硬 gate,靠 prose forcing + fresh-source eval + 人工审查防御纵深。

## 已定方案(owner 拍板:三层都做 + transcript degraded-safe)

> **/spec:debug 更正(2026-06-26 ~22:00,transcript 铁证)**:读真实 session transcript JSONL(`~/.claude/projects/-Users-kuang-xiaobu-hsglobal/f7720066-...jsonl`)后,**推翻 L2 旧判与 F-L2′ 原判据**。事实:21:16 那次 owner **真的被问了、真的回答了**——`AskUserQuestion` 真实 `tool_use` 调用=1,一次问 2 题,tool_result 含 owner 真实回答:Figma="**必须先读 Figma 画布**"、范围="仅 App 端"。之前基于截断 `.txt` 日志判的"模型自答 owner 决策"是错的(日志截断了 tool_result)。
> - **L2 → L2′ 改判**:不是"凭空捏造 owner 决策",是 **owner 答"必须先读 Figma",模型把 Owner Decision Trace 的 D-2 改写成"owner 已放宽:结构描述足够",据此把 OQ-0 标 `owner-accepted-assumption` 翻回 ready**。即 **owner 真实 blocking 决策被反向篡改成 non-blocking disposition**。
> - **F-L2′ 原判据失效**:原设计"Stop hook 数 `AskUserQuestion` 真实调用数,零调用即 block"——21:16 真调用=1,数调用拦不住。病根是"owner 答复内容 vs PRD trace 记录"的**语义忠实性**(owner 说必读 vs PRD 写已放宽),不是调用次数。
> - **F-L1 不受影响**:L1 是纯结构洞(trace 全局放行),与 owner 真假无关。对真实 KAZ PRD 实测:修复前 0 blocking 放行,修复后 `open_oq_without_owner_closure` count=4 拦截。✅ 确定性有效。

**核心认知纠正:R12 天花板对 checker 成立,对 Stop hook 部分不成立,但 L2′ 的语义忠实性仍撞天花板。** checker 看不到 owner 答了什么;Stop hook 即使能读 transcript,"owner 答复文本 vs PRD trace 记录是否忠实"也是脆弱的语义比对。**故 F-L2′ 降级为 prose forcing + 承认天花板(owner 拍板范围内,按 debug 建议 (b))。**

### F-L1:owner-* disposition 逐行绑定(✅ 已实现并验证,artifact 层,双宿主)
见上方 F-L1 节。已落地:`check-prd-artifact.js` 逐行绑定 + SKILL.md razor prose + 2 个 characterization 单测 + mirror 刷新。真实 KAZ PRD count=4 拦截,全量 1412 tests 绿,30-set 冻结不变。

### F-L2′:owner-answer fidelity(✅ 已实现,prose forcing,承认天花板)
- **落点**:SKILL.md Push-Right Brief 段后新增 **"Owner-answer fidelity (no reversal)"** 硬约束 prose:Owner Decision Trace 行必须忠实记录 owner 实际答复,不得 soften/widen/reverse;owner 答"must read Figma"不得改写成 relaxed `owner-accepted-assumption`;无法满足 owner 要求时合法出口是 `checkpoint-prd` + `next_owner_question` 请 owner 补输入或显式放宽,**放宽必须是新的 owner 回复,不是模型自行改写旧回复**。
- **诚实边界**:明确标注这是 producer-side fidelity obligation,**非 checker-enforced gate**——checker 只验 owner-* OQ 绑定 trace 行(referential consistency),验不了"trace 行是否忠实反映 owner 真实所说",后者是 deferred host-provenance ceiling,靠本 prose + fresh-source eval + 人工审查兜底。
- **contract test**:锁该 prose 锚点在场(防漂移),不锁语义。
- **未走 (a) transcript 语义比对的原因**:依赖"Stop hook payload 含 `transcript_path`"——该假设仅 WebSearch advisory(模型自承非真实检索)+ 仓库无 Stop 事件样本,**至今未确证**。在确证前不把判据压在它上面(避免重蹈凭假设断言)。`AskUserQuestion` 在 JSONL 可结构化检出已本地确证,但调用**次数**不对应病根,故即便 transcript 可用,(a) 也需语义比对而非计数。

### F-L3:checkpoint→ready 回滚门槛(待评估)
21:16 还用了"清 checkpoint→改键名 source_docs→source_inputs→重算 hash 重盖 receipt"翻回 ready。待评估:checkpoint→ready 的实质内容变更是否应强制重跑 readiness lens 而非仅重盖 hash。与 F-L1/F-L2′ 解耦,可独立排期。

### 双宿主非对称(诚实标注)
- **Codex 侧只有 session-start hook,无 Stop/PreToolUse guard,无 transcript primitive**。F-L1(checker 逻辑)双宿主生效;F-L2′(prose)双宿主生效;任何 transcript 路径(若未来走 (a))为 Claude-only。

## 落地顺序(最小可维护)
1. ✅ **F-L1 逐行绑定**(已完成,artifact 层,双宿主,真实文件验证)。
2. ✅ **F-L2′ owner-answer fidelity prose**(已完成,prose forcing,承认天花板)。
3. ✅ **fresh-source eval 回归**:commit 74c85079 新增 eval cases `one-round-scoping-then-checkpoint-rejected`(failure:问1轮就写 checkpoint,load-bearing OQ 未问)和 `checkpoint-after-full-grill-accepted`(positive:穷尽 grill 后合法 checkpoint),固化232726/231339失败模式防复发。
4. ✅ **Checkpoint-as-escape prose**:commit 74c85079 在 SKILL.md Canonical 四停点后新增 anti-pattern 锚点,明确 checkpoint 不是 grill 的替代。
5. ✅ **input_scan_degraded 不卡 checkpoint**:commit 53fc501b 新增 `CHECKPOINT_INPUT_SCAN_EXEMPT` Set,合法 checkpoint 可正常 closeout。
6. ✅ **Phase 4 doc-review 触发条件**:SKILL.md Phase 4 新增明确触发信号——grill trace 交互少于 load-bearing OQ 数、design 未读无 owner 接受、或 trace row 未逐行绑定 owner-* OQ 时强烈建议走 doc-review。

**⏳ 待 host-provenance primitive 就位**(deferred capability gate):
- Stop hook payload 已确证含 `transcript_path`(官方 hook-development skill 实证)。
- 目前 transcript 语义消费撞 KTD2(「gate the exits, not the thinking」);LLM-judge hook 方向已裁决否决。
- 当 Claude 提供**per-question verified receipt** 或 **transcript-bound provenance token**(而非 model-self-reported text),可在 Stop hook 侧做确定性 provenance 闸:验证每条 owner-* OQ trace row 对应的 AskUserQuestion receipt,无需语义判断。
- 在此之前:L2′(owner 决策被改写)/ grill 充分性 / Figma 真读——靠 prose + eval + doc-review 人工审计防御纵深,不做硬 gate。

## Non-goals
- 不把 checker 做成"验证 owner 是否真回答"的测谎仪(撞 R12)。
- 不改 `spec-plan`(R1)。
- 不新增 BLOCKING reason_code(守 freeze-1 的 30-set);优先复用 `open_oq_without_owner_closure` / `design_unread_without_owner_acceptance`。
- 不在本 plan 处理 discovery 侧(归 06-26-003)。

## 待裁决问题(给 owner)
1. 修复定位:**F-L1(逐行绑定)已通过对抗裁决,可直接进开发(fix-as-blocking,守 30-set)。** 剩下的范围决策是:只做 L1 / L1+L3(receipt 防逆向)/ 全量含 L2 prose 加固?
2. F-L3 是否可在 artifact 底物上成立,还是应承认为 R12 天花板、转 prose+eval?
3. `ready_receipt` 是否需要"内容实质变更后,checkpoint→ready 必须重新触发 readiness lens 而非仅重盖 hash"的语义?
