---
spec_id: 2026-06-25-001-spec-prd-relentless-grill
title: "refactor: spec-prd 完整集成 grill-with-docs relentless 思想"
type: refactor
status: completed
created: 2026-06-25
plan_depth: deep
target_repo: spec-first
origin: none (plan-local spec_id; 无 origin requirements doc,身份未继承)
completed_at: 2026-06-29
completion_evidence:
  - "U1 已落地:SKILL.md:135 唯一标题 ### Canonical: 四个合法停点(grep 计数=1);owner_question_progress 仅新增 owner-capped(SKILL.md:124/137);pre_prd_clarification_status 新增兜底值 checkpoint-blocked(SKILL.md:133/139);旧锚点 large input is not permission to skip 已删;grill_depth_state 不存在(负向满足)"
  - "U2 已落地:grill-with-docs-integration.md 与 domain-language-and-decision-ledger.md 旧止损锚点(Continue this loop only while/Stop rather than interview indefinitely/Continue only while the next question can close or narrow)均已删(grep=0),含 relentless 默认 + 引用 canonical 四停点"
  - "U3 已落地:evidence-and-topology.md 旧锚点 If the owner-question sequence would become a long form 已删;product-expert-lens.md:44 closure_state 含 owner-capped(与 SKILL owner_question_progress 字段一致)"
  - "U4 已落地:prd-readiness-lens.md:50 含 checkpoint-blocked 兜底 + owner 未给信号→checkpoint;prd-output-template.md 无 grill_depth_state"
  - "U5 已落地:契约测试含 canonical 标题唯一性断言(contracts:455/572/636);examples.json 旧锚点 ask-owner-first even for large input 已删;not.toContain 负向断言守护新语义;33 测试全绿"
  - "U6 已落地:CHANGELOG 含 relentless 记录;fresh-source-eval-2026-06-25-relentless-grill.md 存在;用户手册 22 含 canonical/relentless 措辞"
  - "验证:npx jest tests/unit/spec-prd-contracts.test.js 33 测试全绿"
---

# refactor: spec-prd 完整集成 grill-with-docs relentless 思想

## Summary

把 `spec-prd` 澄清环的**目标函数**从"够写 PRD 就停"翻转为原版 `grilling` 的"理解透才停":默认 relentless 深挖每个 load-bearing 分支,只有四个合法停点(走到叶子 / source 已答 / owner 显式封顶 / 真 HOW 下推 plan)才停;现有的提前止损阀(Lens 风险过滤、gap 必须先绑 `PRD_write_target` 才进 Grill、Pre-Write Closure Gate 的"问一个就停"、Owner Question Ladder 的"长表就停")从**停止理由**降级为**排序理由**——风险仍决定先问哪个,但不决定停不停。owner 不喊停时显式停在 `checkpoint-prd` 兜底,绝不静默判 ready。

这是 prompt/workflow/contract 级改动:翻转散布在 SKILL.md + 4 个 reference 的措辞,同步重构 2517 行契约测试(当前正反向守护要翻转的措辞),并加 fresh-source eval 验证行为是否**真的**变 relentless。

## Decision Brief

- **推荐做法**:语义"翻转"而非"新增机制"。复用已有的 `checkpoint-prd` 兜底、复用并**扩展现有 Decision Card 字段**(不新增独立字段),四停点用 **single canonical source** 定义、其余引用,不造硬状态机。理由:遵守角色契约 Light contract 与 spec-prd 既有"single canonical source"约束;深度判断仍 LLM-owned。
- **关键决策**(已按二轮评审按 Light contract 收敛):
  1. `downstream_confirmation_risk` 从"既排序又过滤"收敛为"只排序"。
  2. "owner 手动封顶"配**一条**兜底:owner 未给出封顶/继续信号(无论不在场还是在场持续沉默,二者对模型可观测信号相同)→ checkpoint-prd。不再人为分成 headless / interactive 两条(归宿相同,合并消冗余)。interactive 软封顶选择点是**深挖中主动递给 owner 的封顶入口**,不是第二条兜底。
  3. 全局默认 relentless,但 source 已完全闭合的小增量天然走 L0 自然停(对应停点 source-resolved)——这不是例外,是"source 已答"停点的自然结果。
  4. **四个合法停点用 single canonical anchor 定义**(放 SKILL.md,用唯一标题 `### Canonical: 四个合法停点` 作机器可识别锚点),其余 5 处 reference 用固定引用串指向它、不复述,避免跨文件措辞漂移且让唯一性可 grep。
  5. **不新增独立字段**:`owner_question_progress`(分支级)**仅新增 `owner-capped` 一个值**;叶子→复用 `closed`、source→复用现有专属值 `source-resolved`、how-pushdown→复用 `route-out`(三个停点复用现有值,canonical 引用在 prose 里说明,不膨胀 enum)。兜底状态**只挂整体级** `pre_prd_clarification_status`(新增一个兜底值),不在分支级重复。新增 enum 前先证明现有值表达不了——证明不了即不加。
- **验证焦点**:契约测试断言必须从"锁止损措辞"翻转为"锁 canonical 锚点唯一性(标题 grep)+ 锁一条兜底 + 锁最小 enum 扩展",且 fresh-source eval 必须验证**行为**变化(模型是否真的默认追问到底),而非只验文字。eval 不可用时须有降级验证手段。
- **最大风险**:改 readiness 语义可能误伤 `ready-for-planning` 的正确性(relentless 过头 → 永不 ready)。一条兜底(owner 未给信号→checkpoint-prd)是缓解,必须在 U1/U4 正面处理并被测试锁定。

## Canonical: 四个合法停点(本 plan 内权威表述)

> 实现时此定义落入 SKILL.md 作 single canonical source,使用同一唯一标题 `### Canonical: 四个合法停点` 作机器可识别锚点。U2-U4 的 reference 用固定引用串(如「见 SKILL.md `Canonical: 四个合法停点`」)指向它,**不复述四元组全文**。

一个 load-bearing 分支**默认持续深挖**,仅在以下之一才允许停止:

1. **leaf(走到叶子)**:该分支下已无"换个答案就会改变产品行为/验收/范围"的子决策。
2. **source-resolved(source 已答)**:source/docs/tests/glossary/历史 PRD 直接闭合该分支(仍 source-first,能查到的绝不问 owner)。
3. **owner-capped(owner 封顶)**:owner 显式说"够了/封顶"。触发包括 owner 主动喊停,以及 interactive 软封顶——模型每深挖完一个主分支,主动递给 owner 一个"继续深挖 / 此分支封顶"的显式选择点,owner 选封顶即 owner-capped。
4. **how-pushdown(真 HOW 下推)**:该决策是实现 HOW 而非产品 WHAT,下推 plan 且有明确理由(走 route 语义,不是 grill 闭合)。

**字段映射(Light contract)**:停点 1 叶子→`owner_question_progress=closed`;停点 2 source→现有专属值 `owner_question_progress=source-resolved`(该值已存在于 enum,零新增);停点 3 owner 封顶→**新增** `owner_question_progress=owner-capped`;停点 4 how-pushdown→现有 `route-out`。四停点里**三个复用现有值,仅停点 3 需新增一个值**。

**非停点(明确不再作为停止理由)**:够写某个 PRD section、只问了一个关键问题、问题序列变长、不影响当前发布切片、gap 暂不可绑 `PRD_write_target`。这些只影响**提问顺序**,不影响**是否继续**。

**一条兜底(owner 未给封顶/继续信号时,绝不静默判 ready)**:owner 无法或未给出封顶/继续信号——无论 owner 不在场(headless),还是在场但在软封顶选择点后持续沉默(对模型可观测信号相同)——一律停在 `write_mode=checkpoint-prd` + `can_enter_spec-plan: no` + `next_owner_question`,整体级 `pre_prd_clarification_status` 记兜底值。判定边界:递出一次软封顶选择点后 owner 无响应,即视为未给信号 → 兜底。

**锚点缺失 / 广义产品探索**:仍走 `route-out`(合法的非可裁决出口,区别于"够用就停")。

## Direct Evidence

- target_repo: spec-first
- source_refs:
  - skills/spec-prd/SKILL.md(原则 4/5/7、Phase 1 Pre-PRD Clarification、Pre-Write Closure Gate、Run-Local Decision Card)
  - skills/spec-prd/references/grill-with-docs-integration.md(Trigger Boundary、Source-First Session Rules)
  - skills/spec-prd/references/domain-language-and-decision-ledger.md(Progressive Detail Ladder L0-L5、Load-Bearing Gap Triage、Deep Requirements Grill、question cadence)
  - skills/spec-prd/references/product-expert-lens.md(Interface Invariants、downstream_confirmation_risk)
  - skills/spec-prd/references/evidence-and-topology.md(Owner Question Ladder 的"long form 就停")
  - skills/spec-prd/references/prd-readiness-lens.md(Core Pack pre-prd clarification closure、deep requirements grill closure)
  - skills/spec-prd/references/prd-output-template.md(Pre-Write Closure Gate 映射、checkpoint-prd、Readiness Self-Check)
  - skills/spec-prd/references/large-input-checkpoint.md(已有 checkpoint-prd 兜底机制,复用不新造)
  - tests/unit/spec-prd-contracts.test.js(2517 行,当前锁反向语义)
  - docs/05-用户手册/22-PRD需求文档质量增强流程.md(用户可见文档,含 grill 停止措辞)
  - 参考原版:/Users/kuang/xiaobu/skills/skills/productivity/grilling/SKILL.md、/Users/kuang/xiaobu/skills/skills/engineering/domain-modeling/SKILL.md(仓库外,只读参考,不入库)
- current_revision: HEAD `2f2d6c76`(分支 leo-2026-06-25-work-update);工作区仅本 plan 文件 untracked,无其他改动(回应审查 P3-git:原"clean working tree"不准确)
- discovery_methods: 全量直读 spec-prd 13 个源文件;grep 契约测试断言;读 2026-06-23 grill-first eval 结论
- tests_or_logs: 尚未运行(plan 阶段不执行);执行期基线为 `npm run test:unit`
- confidence: high(措辞与测试断言已逐处定位)
- limitations: 未运行 fresh-source eval;relentless 行为变化能否真生效需执行期 eval 验证,非 plan 可证

## 关键约束与现状证据

1. **2026-06-23 改造是前置事实**:cap-based 停止已删,当前停止条件是 progress-based 的"continue only while next question closes/narrows a named gap"。本 plan 在此基础上把"收窄不动就停"翻成"默认深挖到合法停点"。
2. **契约测试反向守护**(执行期必须同步翻转,逐处已定位):
   - `tests/unit/spec-prd-contracts.test.js` ~L442-451:`write_mode=ask-owner-first`、`highest-risk gap can be closed by one owner question`、`large input is not permission to skip the owner question`、`expect(skill).not.toContain('degrade to ...')`
   - evidence-topology 测试段:`If the owner-question sequence would become a long form`、`stop and inspect the progress contract instead of counting questions`
   - domain-language 测试段:`Continue only while the next question can close or narrow a named load-bearing gap for the current release slice.`
   - grill-integration 测试段:`Continue this loop only while the next question closes or narrows a named load-bearing branch`、`Stop rather than interview indefinitely`
3. **角色契约**:Light contract + Explicit boundaries + Let the LLM decide。relentless 不得做成硬状态机;脚本只产确定性事实,深度判断 LLM-owned。
4. **source/runtime 边界**:只改 source,不手改 `.claude/` 等 generated mirror;runtime 同步走 `spec-first init`。
5. **用户可见**:行为变化,CHANGELOG 必须标 `(user-visible)`,作者 `leokuang`。

---

## Goals

- 把澄清环默认姿态翻转为 relentless:默认追问到底,而非"够写 PRD 就停"。
- 明确四个、且仅四个合法停点:叶子 / source 已答 / owner 显式封顶 / 真 HOW 下推。
- 把所有"风险/价值/切片/长表"类止损措辞从停止理由降级为排序理由。
- 用 `checkpoint-prd` 兜底封死"owner 未封顶 → 静默判 ready 或永不 ready"的风险。
- 同步重构契约测试,使其锁定 relentless 正向语义与兜底,不再守护止损语义。
- fresh-source eval 验证行为真变 relentless。
- 同步 CHANGELOG / 用户手册。

## Non-Goals

- 不改 `spec-prd` 的 WHAT/HOW 边界、evidence-tag 体系、topology 分类、Sanitization、Feature Slices、split 逻辑。
- 不改三个脚本的确定性事实输出(`check-prd-artifact.js` 等);它们不裁决 readiness,本 plan 不让它们参与深度判断。
- 不新造 schema、状态机、进度文件、transcript。复用现有 Decision Card 与 checkpoint-prd。
- 不改其他 workflow(plan/work/review)消费 PRD 的方式;下游真兑现 ready 是独立的跨 workflow 问题。
- 不手改 generated runtime mirror。
- 不引入跨 run 学习/团队高频缺口沉淀(那是更大的独立议题)。

---

## System-Wide Impact

| 受影响面 | 影响 | 处理 |
| --- | --- | --- |
| spec-prd 源 prose | 澄清环目标函数翻转,散布 5 个文件 | U1-U4 |
| 契约测试 | 当前反向守护,会红 | U5 同步翻转断言 |
| readiness 正确性 | relentless 可能误伤 ready 判定 | U4 checkpoint 兜底 + U5 测试锁定 |
| 用户可见文档 | 用户手册含旧停止措辞 | U6 同步 |
| generated runtime | `.claude/` 等需重生成 | 执行期 `spec-first init`,不手改 |
| 下游 plan/work | 消费 ready-for-planning 语义不变 | 无需改;non-goal |

---

## Implementation Units

### U1. 翻转 SKILL.md 核心目标函数 + 落 canonical 四停点 + 扩展现有字段

**Goal**:在 source-of-truth 主干确立新目标函数——relentless 默认、四个合法停点(canonical 定义落此)、风险只排序不停止;**最小扩展现有 Decision Card 字段**表达停点与姿态,不新增独立字段;落一条兜底。

**Requirements**:Goals 全部;为 U2-U4 提供主干语义锚点。

**Dependencies**:无(首个 unit,定义其余 unit 对齐的语义)。

**Files**:
- 修改 `skills/spec-prd/SKILL.md`

**Approach**:
- **Canonical 四停点 anchor(本 unit 新落)**:在 SKILL.md 增设一个极短的权威块,用唯一标题 `### Canonical: 四个合法停点` 作机器可识别锚点(参见本 plan「Canonical: 四个合法停点」)。U2-U4 的 reference 用固定引用串指向此标题,不复述全文。这遵循 spec-prd 既有"single canonical source"约束(如 `product-expert-lens.md` 自称 product-expert judgment 的唯一权威源),且让唯一性可被 grep 标题验证(回应二轮评审 R2-1)。
- **原则 4(Clarify before writing)**:当前"Ask one source-backed owner question at a time until every template-relevant WHAT gap is ... or routed out; choose bypass or compact output only when ..."。改写为:默认 relentless 深挖每个 load-bearing 分支,停止仅依 canonical 四停点;明确"够写某个 PRD section""只问了一个关键问题""不影响当前发布切片""gap 暂不可绑"**不再是**停止理由。
- **原则 5(Product Expert Lens)**:补一句明确——`downstream_confirmation_risk` 控制**提问顺序与 handoff 优先级**,不控制是否继续;绑不上 `PRD_write_target` 的 load-bearing gap 不被丢弃,继续追问或显式 carry。
- **原则 7(reason-then-act)**:保留结构,把 Pre-Write Closure Gate 相关措辞改为与 canonical 四停点一致(详见 U4),此处只改原则 7 对 owner question 的 reason 映射描述,使其不再暗示"问一个就停"。
- **Run-Local Decision Card(最小扩展现有字段,不新增独立字段 — 回应评审 F3 + 二轮 R2-2)**:先证明现有字段不够,证明不了即不加。收敛后设计:
  - `owner_question_progress`(**分支级**,现有 enum:`not-needed | source-resolved | closed | narrowed | accepted-assumption | outstanding-question | blocker | route-out`)**仅新增 `owner-capped` 一个值**。停点 1 叶子→复用 `closed`;停点 2 source→复用现有专属值 `source-resolved`(回应 R3-1:source 停点有专属值,不塞 `closed`);停点 4 how-pushdown→复用 `route-out`。证明:现有值已能表达"分支闭合""source 已答""路由出去",只差"owner 主动封顶"无对应值 → 仅此一个值通过"现有表达不了"的证明。
  - `pre_prd_clarification_status`(**整体级**,现有 enum)承载整体姿态:进行中 `asked-owner`(深挖中),兜底停**新增一个值**(如 `checkpoint-blocked`,执行期定名)表达"owner 未给信号 → checkpoint 兜底"。**兜底值只挂整体级,不在分支级重复**(回应 R2-2:headless-checkpoint 不再双字段)。
  - **不引入 `grill_depth_state`,不新增 `leaf-reached`/`headless-checkpoint` 分支级值。**
- **Phase 1 Pre-PRD Clarification 段落**:把"continue ... until ... resolved enough to write the PRD"改为"默认深挖到 canonical 合法停点(引用 anchor)",并把"stop ... instead of continuing the interview"的触发从"不闭合/不影响切片"改为"已达四个合法停点之一";补 interactive 软封顶选择点描述(停点 3 触发)。

**Patterns to follow**:原版 `grilling/SKILL.md` 的 relentless / every aspect / walk down each branch one-by-one / until shared understanding;`product-expert-lens.md` 的 single-canonical-source 模式;保持 spec-prd 现有 Decision Card 字段风格(kebab enum)。

**Test scenarios**(契约,U5 落实):
- SKILL.md 含唯一标题 `### Canonical: 四个合法停点`,且该标题**全仓只出现一次**(可 grep 标题计数,回应 R2-1)。
- canonical 块含四停点(leaf / source-resolved / owner-capped / how-pushdown)+ 字段映射 + 一条兜底 + interactive 软封顶选择点措辞。
- `owner_question_progress` enum **仅新增 `owner-capped`**(锁最小扩展);`pre_prd_clarification_status` 新增一个兜底值。
- **SKILL.md 不含 `grill_depth_state`、不含分支级 `leaf-reached`/`headless-checkpoint`**(负向断言,锁字段去重)。
- SKILL.md 含"风险只排序不停止"措辞;不再含 `large input is not permission to skip the owner question` 旧锚点(替换为 relentless 等价表述)。
- SKILL.md 含**一条**兜底→`checkpoint-prd` 映射(owner 未给信号,涵盖 headless 与沉默)。

**Verification**:`node --check` 通过;SKILL.md 前 120 行 entrypoint 锚点仍可被现有结构测试识别;新措辞自洽无残留"够写 PRD 就停"语义;canonical 标题 grep 计数为 1。

---

### U2. 翻转澄清环引擎(grill-integration + domain-language)

**Goal**:把承载澄清环节奏的两个 reference 的停止措辞翻转为 relentless 默认深挖,强化 walk-down-each-branch。

**Requirements**:Goals 第 1/2/3 条。

**Dependencies**:U1(对齐主干语义)。

**Files**:
- 修改 `skills/spec-prd/references/grill-with-docs-integration.md`
- 修改 `skills/spec-prd/references/domain-language-and-decision-ledger.md`

**Approach**:
- **grill-with-docs-integration.md**:
  - `Source-First Session Rules` 末段 `Continue this loop only while the next question closes or narrows a named load-bearing branch` → 翻转为"默认沿每个分支深挖到底,直到该分支达到 SKILL.md canonical 四停点之一"(**引用** canonical,不复述四停点全文);保留"source 可答先查 source"。
  - `Original Behavior Contract` 已含 relentless/walk-down-each-branch,强化为**默认行为**而非触发态。
  - `Trigger Boundary`:从"满足以下之一才进入"调整为"create/refine 默认进入 relentless 深挖;以下情形是强化信号而非准入门槛"。
  - 保留 source-first、glossary challenge、CONTEXT/ADR lazy 行为不变。
- **domain-language-and-decision-ledger.md**:
  - `Requirements Scenario Grill` 的 `Continue only while the next question can close or narrow a named load-bearing gap for the current release slice.` → 翻转;"不影响当前发布切片"从停止理由降为排序/优先级理由;停点统一**引用** canonical 四停点。
  - `Progressive Detail Ladder`:L0 source-resolved 仍是合法自然停点(对应 canonical 停点 2);L1-L5 默认走 relentless;把 ladder 描述为"深挖到哪一层取决于分支是否达 canonical 停点,不取决于够不够写 PRD"。
  - `Load-Bearing Gap Triage`:明确 triage 是**排序**(先打哪个),不是**过滤**(不打哪个);绑不上 write target 的 load-bearing gap 继续追问或 carry。
  - `Deep Requirements Grill` 七动作保留;把"closure 才停"重述为引用 canonical 四停点。
  - `question cadence`:"Continue only while" → relentless 默认 + 引用 canonical 停点。

**Patterns to follow**:U1 的停点四元组;domain-modeling 的 challenge/sharpen/scenario/cross-reference 四动作。

**Test scenarios**(U5):
- 两文件不再含 `Continue ... only while the next question closes or narrows`(旧停止锚点)。
- 含 relentless 默认 + **引用** canonical 四停点(而非各自复述全文 → 锁 single canonical source)。
- domain-language 含"triage 是排序不是过滤"语义。
- grill-integration Trigger Boundary 含"create/refine 默认进入"。
- 保留断言:source-first、`Ask at most one question at a time`、lazy CONTEXT/ADR、`write_target:` 枚举不变。

**Verification**:两 reference 自洽;reference reachability 测试仍绿;无残留 cap/收窄即停语义。

---

### U3. downstream_confirmation_risk 收敛为只排序 + Owner Question Ladder 去止损

**Goal**:在 Lens 与 evidence-topology 两处,把"风险/长表导致停止"彻底改为"风险导致排序",消除最后的过滤型止损。

**Requirements**:Goals 第 1/3 条;字段一致性(R3-2)。

**Dependencies**:U1(U1 定 `owner_question_progress` 新增 `owner-capped`,本 unit 必须同步 Lens 的 `closure_state` 列举,两者强一致——**U1↔U3 字段依赖**)。

**Files**:
- 修改 `skills/spec-prd/references/product-expert-lens.md`
- 修改 `skills/spec-prd/references/evidence-and-topology.md`

**Approach**:
- **product-expert-lens.md**:
  - `Interface Invariants` 中 `A gap that cannot bind to a write target stays inside the Lens for more reduction or is carried as ...`:改为"绑不上 write target 的 load-bearing gap **继续追问以求绑定或显式 carry**,不得因暂不可绑而停止深挖"。
  - 已有 `downstream_confirmation_risk ... controls next-question ordering ... not a score/enum/schema`——补一句"不控制是否继续深挖;深挖默认持续到四合法停点"。
  - **`closure_state` 列举同步(回应 R3-2,关键漏改点)**:该文件现有 `` `closure_state` reuses the existing owner-question states: `closed`, `narrowed`, `accepted-assumption`, `outstanding-question`, `blocker`, or `route-out` `` —— 这是被 Lens/Write-In/Readiness 三处消费的契约字段,**必须同步加入 `owner-capped`**,与 U1 给 `owner_question_progress` 的新增值保持一致。否则 Lens 契约与 SKILL 字段定义漂移(正是 F2 要防的漂移在字段层重现)。
  - `Escalation` 段保留;不改 dispatch 授权边界。
- **evidence-and-topology.md** `Owner Question Ladder`:
  - `If the owner-question sequence would become a long form, stop and inspect the progress contract instead of counting questions.` → 翻转为"问题序列变长不是停止理由;持续深挖,仅在四合法停点停;每个 owner 问题仍须命名 gap + source attempt + write target"。
  - 末段 `When the anchor is missing ... summarize the unresolved decision cluster and route to ...`:保留(锚点缺失/广义探索 route-out 是合法的,属于"非可裁决"路径,不是"够用就停")。

**Patterns to follow**:U1 停点四元组;保持 Lens run-local interface 字段锚点不变(测试可能锁字段)。

**Test scenarios**(U5):
- product-expert-lens 不再含"绑不上 write target 就 stays inside Lens 等待"作为停止;含"继续追问求绑定或显式 carry"。
- product-expert-lens 的 `closure_state` 列举**含 `owner-capped`**,且与 SKILL.md `owner_question_progress` 新增值一致(锁 U1↔U3 字段一致)。
- evidence-topology 不再含 `If the owner-question sequence would become a long form` / `stop and inspect the progress contract instead of counting questions`;含"长表不是停止理由"。
- 保留断言:Lens 字段锚点、evidence tags、Owner Question Ladder 各 topology 行、anchor-missing route-out。

**Verification**:Lens 字段锚点测试仍绿;evidence-topology 其余断言(evidence tags/topology/framing gate)不受影响。

---

### U4. readiness 判据 + checkpoint 兜底封死静默 ready

**Goal**:让 readiness lens 与输出模板与新目标函数一致;把"owner 未封顶"显式导向 `checkpoint-prd`,杜绝静默判 ready 与永不 ready。

**Requirements**:Goals 第 4 条;兜底张力。

**Dependencies**:U1、U2、U3。

**Files**:
- 修改 `skills/spec-prd/references/prd-readiness-lens.md`
- 修改 `skills/spec-prd/references/prd-output-template.md`
- 修改 `skills/spec-prd/SKILL.md`(Pre-Write Closure Gate 与 Phase 4 一致化,接 U1)

**Approach**:
- **prd-readiness-lens.md**:
  - Core Pack `pre-prd clarification closure`:把"each branch ... closed by source evidence, owner answer, accepted assumption, explicit trace gap, Outstanding Questions, blocker cluster, or route-out"重述为"每个 load-bearing 分支达到 canonical 四停点之一"(引用);明确**owner 未封顶且仍有可深挖的 load-bearing 分支 → 不是 ready,降级 `checkpoint-prd`(`can_enter_spec-plan: no` + `next_owner_question`)或 `ask-owner`**。
  - `deep requirements grill closure`:同步引用 canonical 四停点;"questions that cannot close/narrow stop as blockers"改为"非可裁决/锚点缺失才停,可裁决则默认继续"。
  - 新增对**现有字段**的消费(不引入新字段):`pre_prd_clarification_status=asked-owner`(深挖中)进行中不可 ready;`pre_prd_clarification_status=<兜底值>`(整体级,执行期定名)必为 checkpoint-prd 且 `can_enter_spec-plan: no`。兜底状态只读整体级字段,不读分支级。
  - **一条兜底落 readiness(回应评审 F1 + 二轮 R2-2/R2-3)**:owner 未给封顶/继续信号(涵盖不在场与软封顶后持续沉默,可观测信号相同)→ 不得判 ready,走 checkpoint-prd。
- **prd-output-template.md**:
  - `Product Expert Lens Write-In` 与 `Output Shape`:compact-prd 仍存在,但定义收紧为"source 已完全闭合(全分支达 canonical 停点 2 source-resolved)"才用;默认 relentless。
  - `Readiness Self-Check` 骨架**不新增 `grill_depth_state` 字段**;复用现有 `write_mode` / `can_enter_spec-plan` / `clarification_evidence` 字段表达停点与兜底。
  - checkpoint-prd 段(已存在)补充:一条兜底(owner 未给信号)落 `write_mode=checkpoint-prd` + `can_enter_spec-plan: no` + `next_owner_question`。
- **SKILL.md Pre-Write Closure Gate**:
  - `write_mode=ask-owner-first ... ask that question, and stop before drafting; large input is not permission to skip the owner question` → 改为:relentless 默认持续深挖;`ask-owner-first` 仅表示"下一步是继续 owner 深挖",**不是"问一个就停起草"**;真正的停止由 canonical 四停点决定。
  - 保留 `final-prd` 仅在 load-bearing WHAT 全闭合时;新增"owner 未封顶且有可深挖分支 → 不得 final-prd"。

**Patterns to follow**:复用 large-input-checkpoint.md 既有 checkpoint 机制,不新造;readiness 消费现有 Decision Card 字段。

**Test scenarios**(U5):
- readiness-lens 含**现有字段**消费规则(非 `grill_depth_state`);含"owner 未给信号 + 可深挖分支 → 非 ready"。
- readiness-lens 含**一条兜底**(owner 未给信号,涵盖 headless 与沉默)→ checkpoint-prd 的断言。
- output-template Readiness Self-Check **不含** `grill_depth_state:`(负向断言)。
- SKILL.md Pre-Write Closure Gate 不再含 `large input is not permission to skip the owner question`(替换为 relentless 等价 + 兜底);含一条兜底 → checkpoint 映射。
- 保留:`write_mode=final-prd` 闭合条件、checkpoint-prd 的 `can_enter_spec-plan: no` + `next_owner_question`。

**Verification**:readiness 四停点与单兜底自洽;无"静默 ready"路径;`check-prd-artifact.js` 的 `*_undeclared` 与 readiness 协同不变(脚本不参与深度判断)。

---

### U5. 重构契约测试:止损语义 → relentless + 兜底语义

**Goal**:让 `tests/unit/spec-prd-contracts.test.js` **与 `skills/spec-prd/evals/examples.json`** 一起锁定新目标函数,删除反向守护,新增 relentless / canonical 标题唯一性 / 最小字段扩展(含 `grill_depth_state` 负向断言)/ 一条兜底断言。

**Requirements**:关键风险闭环;Goals 验证;eval fixture 同步(P1-2)。

**Dependencies**:U1-U4(源措辞定稿后才能写精确断言)。

**Files**:
- 修改 `tests/unit/spec-prd-contracts.test.js`
- 修改 `skills/spec-prd/evals/examples.json`(**回应审查 P1-2:旧 fixture 仍守护旧行为**)

**Approach**:
- **examples.json 同步翻转(P1-2,关键漏改点)**:该 fixture 被 `tests/unit/spec-prd-contracts.test.js`(line 1054/1562/1606 等)读取,且 `run-evals.js` 消费。现有 `examples.json:46/202` 仍含旧预期 `write_mode=ask-owner-first even for large input when gap is closable by one question` —— 这是被翻转的"问一个就停"语义。必须同步更新:相关 sentinel case、progressive-detail-stop-rules 用例、`expected` / `must_not` 字段,改为 relentless + canonical 四停点 + 一条兜底语义。验证 `node skills/spec-prd/scripts/run-evals.js --json` 通过。
- 定位并替换反向断言(已逐处定位):
  - `clarification evidence write-mode contract` 测试:移除 `write_mode=ask-owner-first ... stop`/`large input is not permission to skip the owner question` 旧锚点,替换为 relentless + 四停点 + headless 兜底锚点;保留 `final-prd` 闭合条件、checkpoint-prd 的 `can_enter_spec-plan: no`。
  - evidence-topology 测试:移除 `If the owner-question sequence would become a long form` / `stop and inspect the progress contract`,替换为"长表不是停止理由 + 四合法停点"。
  - domain-language 测试:移除 `Continue only while the next question can close or narrow ...`,替换为 relentless 默认 + 排序非过滤。
  - grill-integration 测试:移除 `Continue this loop only while ... closes or narrows`、`Stop rather than interview indefinitely`,替换为 relentless 默认 + 四停点。
- 新增正向断言:SKILL.md 含唯一标题 `### Canonical: 四个合法停点`(grep 计数=1)+ 其余文件含固定引用串;`owner_question_progress` 仅加 `owner-capped`、`pre_prd_clarification_status` 加一个兜底值;readiness 含一条兜底消费规则。
- 新增负向断言:SKILL.md 与 output-template 均**不含** `grill_depth_state`、不含分支级 `leaf-reached`/`headless-checkpoint`(锁字段去重)。
- 保留所有未受影响断言(evidence tags、topology、字段锚点、source-first、lazy CONTEXT/ADR、Sanitization、Feature Slices)。
- 校验 `expect(skill).not.toContain(...)` 类负向断言不与新措辞冲突。

**Patterns to follow**:文件现有 `expectContainsAll` / `expect(...).not.toContain(...)` 风格;按测试用例语义分组而非行号(行号会漂)。

**Test scenarios**(本 unit 自身即测试):
- `npm run test:unit` 全绿。
- `node skills/spec-prd/scripts/run-evals.js --json` 通过(examples.json 翻转后 fixture 契约自洽)。
- 反向断言已无残留(grep 旧锚点串在测试**与 examples.json**中为 0,尤其 `examples.json` 不再含 `ask-owner-first even for large input`)。
- 新增断言确实覆盖 canonical 标题唯一性 + 最小字段扩展 + 一条兜底,且含 `grill_depth_state` 与分支级冗余值的负向断言。

**Execution note**:characterization-first——先运行现有测试看哪些因 U1-U4 变红,逐个判断"该红(反向锚点)"vs"误伤(无关断言)",再改断言。不得为了变绿而回退源措辞。

**该红 vs 误伤判别法(回应评审 F6)**:
1. 先 grep 本 plan 已逐处列出的旧止损锚点串(`large input is not permission to skip`、`If the owner-question sequence would become a long form`、`stop and inspect the progress contract`、`Continue ... only while the next question closes or narrows`、`Stop rather than interview indefinitely`)→ 命中这些串的断言 = **该删/该改**(反向锚点)。
2. 其余变红断言 **默认视为误伤需保留**:回查对应源是否被 U1-U4 无关波及(如 evidence tags、topology、字段锚点被顺手改动),若是则修源而非删断言。
3. 负向断言(`expect(...).not.toContain(...)`)逐条核对新措辞是否触发——尤其新增 `grill_depth_state` 负向断言不能与任何残留旧文案冲突。

**Verification**:`npm run test:unit` 通过;`npm test` 主链路通过;测试中无旧止损锚点串。

---

### U6. 同步 CHANGELOG / 用户手册 / fresh-source eval 记录

**Goal**:补齐用户可见文档与治理证据,确保行为变化被记录且经 fresh-source eval 验证真生效。

**Requirements**:治理约束;Goals 验证。

**Dependencies**:U1-U5。

**Files**:
- 修改 `CHANGELOG.md`(标 `(user-visible)`,作者 leokuang,按仓库现行格式)
- 修改 `docs/05-用户手册/22-PRD需求文档质量增强流程.md`(翻转残留停止措辞为 relentless + 四停点)
- 新增 `docs/validation/spec-prd/fresh-source-eval-2026-06-25-relentless-grill.md`

**Approach**:
- CHANGELOG:记录"spec-prd 澄清环默认 relentless 深挖、canonical 四合法停点、owner 手动封顶 + 一条兜底(owner 未给信号→checkpoint)",标 user-visible。
- 用户手册 22:把 2026-06-23 遗留的 progress-based 停止描述升级为 relentless 默认 + 引用 canonical 四停点;保持与 SKILL 一致,不引入新概念。
- fresh-source eval:按 `docs/contracts/workflows/fresh-source-eval-checklist.md`,dispatch fresh read-only reviewer(需用户授权),注入当前磁盘 spec-prd 源,验证:(a) 模型默认是否追问到底而非够用即停;(b) owner 封顶/一条兜底是否正确触发;(c) source 已答分支是否仍 source-first 不问 owner;(d) source/runtime 边界。
- **eval 标 supersedes(回应评审 F5)**:新 eval 记录显式标注与 `fresh-source-eval-2026-06-23-grill-first-clarification.md` 的衔接——延续其 no-fixed-cap 结论,但翻转其 "each owner question must close or narrow a named gap" 作为停止条件的语义。用 `supersedes:` 字段(契约测试第 1780 行已有先例)。
- **eval 不可用降级(回应评审重点 1)**:若 host 无 dispatch primitive 或用户禁用,记录 `not_run` 与原因;同时执行降级验证——人工拿一个真实多源需求做 with/without relentless 措辞的 A/B 对照阅读,记录模型在改后措辞下是否倾向继续深挖。不谎称 dispatch eval 通过。
- **eval 文件名同步登记(回应评审 F4,确定性步骤非"若")**:`tests/unit/spec-prd-contracts.test.js` 第 54-96 行**确实硬编码枚举** eval 文件名。U6 新增 `fresh-source-eval-2026-06-25-relentless-grill.md` **必须**同步登记到该枚举(由 U5 落实断言),否则测试不通过。

**Test scenarios**(U5 已覆盖测试侧;本 unit 为文档/证据):
- `CHANGELOG.md` 顶部含本次条目且标 user-visible。
- 用户手册 22 无残留"够用即停/收窄即停"语义。
- eval 记录 schema 合法(`fresh-source-eval-record.v1`),`changed_behavior` 准确,含 `supersedes:` 指向 2026-06-23 eval,findings 或 not_run_reason 诚实填写。
- 新 eval 文件名已登记进契约测试枚举。

**Verification**:`npm run lint:skill-entrypoints`(若覆盖)与 `npm test` 通过;eval 记录被 `tests/unit/spec-prd-contracts.test.js` 的 eval-artifact 结构检查接受(新文件名已登记)。

---

## Sequencing

```
U1 (主干语义 + Decision Card 字段)
        │
        ├─► U2 (澄清环引擎翻转)
        ├─► U3 (Lens 排序非过滤 + Owner Ladder)
        └─► U4 (readiness + checkpoint 兜底)   ← 依赖 U1/U2/U3 语义定稿
                        │
                        ▼
                       U5 (契约测试重构)        ← 必须在源措辞全部定稿后
                        │
                        ▼
                       U6 (CHANGELOG/手册/eval)  ← 最后,含行为验证
```

U2/U3 可并行(不同文件,无重叠);U4 需三者语义定稿;U5 需全部源改完;U6 收尾。

## Risks & Mitigations

| 风险 | 缓解 |
| --- | --- |
| relentless 过头 → 永不 ready / 卡死(评审 F1;涵盖 headless 与 owner 沉默) | U1 停点 3 软封顶选择点 + U4 一条兜底"owner 未给信号→checkpoint-prd";U5 锁"owner 未封顶→非 ready 而非静默 ready" |
| 四停点跨 6 文件措辞漂移/自相矛盾(评审 F2 + 二轮 R2-1) | U1 落唯一标题 canonical anchor,U2-U4 固定引用串指向、不复述;U5 锁标题 grep 计数=1 |
| 新增字段违反 Light contract / 与现有字段冗余(评审 F3 + 二轮 R2-2 + 三轮 R3-1) | 不新增 `grill_depth_state`;`owner_question_progress` 仅加 `owner-capped`,叶子→`closed`、source→现有 `source-resolved`、how-pushdown→`route-out`;兜底值只挂整体级 `pre_prd_clarification_status`;U5 负向断言锁无冗余值 |
| 文字改了行为没变(假翻转) | U6 fresh-source eval 验证**行为**;eval 必须含"模型是否默认追问到底"的判据 |
| 误伤无关断言导致测试假绿/假红 | U5 characterization-first:先看红在哪,逐个判该红 vs 误伤,不为变绿回退源 |
| 小增量被过度 grill 惹烦用户 | source 已完全闭合走 L0 自然停(source-resolved-stop);owner 可随时封顶。这是用户明确要的全局 relentless,非缺陷 |
| 与 2026-06-23 grill-first 改造语义打架 | 本 plan 是其方向的延续(收窄即停→深挖到停点),非回退;U2 明确衔接 |
| generated runtime drift | 执行期 `spec-first init` 重生成,不手改 mirror |

## Anti-Patterns to Avoid

- 把 relentless 做成硬状态机或新增独立字段/进度文件(违反 Light contract)——复用并扩展现有 `owner_question_progress` / `pre_prd_clarification_status`,不引入 `grill_depth_state`。
- 为了让契约测试变绿而回退源措辞(本末倒置)。
- 让脚本参与深度判断(脚本只产确定性事实,深度 LLM-owned)。
- 删除"锚点缺失/广义产品探索 → route-out"路径(那是合法的非可裁决出口,不是"够用就停")。
- 把 source 可答的问题拿去问 owner(relentless ≠ 放弃 source-first)。
- 在 plan/work 里顺手改下游消费逻辑(non-goal,跨 workflow 独立议题)。

## Deferred to Implementation

- 兜底值在 `pre_prd_clarification_status` 的**最终命名**(plan 暂用 `checkpoint-blocked` 占位)——字段去重**决策本身已在 plan 定**(`owner_question_progress` 仅加 `owner-capped`,兜底值只挂整体级,不新增独立字段),仅整体级兜底值字面待执行期定。
- interactive 软封顶选择点的**具体触发频率**(每个主分支后,还是每 N 个子分支后)——执行期按 grill 实际节奏定,不影响停点语义。
- 用户手册 22 具体段落的最小改动范围(执行期 diff 时定)。
- fresh-source eval 的 reviewer dispatch 是否可用(执行期探测;不可用则 `not_run` + 降级 A/B 阅读,见 U6)。
- `check-prd-artifact.js` 是否需感知新 enum 值(倾向否——脚本不裁决深度;执行期确认现有 `*_undeclared` 机制是否已足够)。

## Verification Plan

- 最窄:`npm run test:unit`(spec-prd 契约测试)。
- 扩展:`npm test`(unit + smoke + integration)。
- 治理:`npm run lint:skill-entrypoints`、`npm run typecheck`。
- 行为:fresh-source eval(U6),验证 relentless 真生效。
- runtime(回应审查 P3,验证目标收窄):执行期 `spec-first init` 后,对 `skills/spec-prd/**` 与其 runtime mirror 做**定向 diff**,确认本次 spec-prd projection 已刷新;`doctor` 报的全仓 repo-level `skills_drifted` advisory 仅记为 limitation,不作为本改动失败判据(参见 `docs/validation/spec-prd/fresh-source-eval-2026-06-23-grill-first-clarification.md` 记录的 post-init advisory 现象)。
