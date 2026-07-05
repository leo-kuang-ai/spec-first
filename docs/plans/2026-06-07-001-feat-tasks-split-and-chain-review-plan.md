---
spec_id: tasks-split-chain-review
status: completed
type: feat
created: 2026-06-07
plan_depth: deep
target_repo: spec-first
---

# feat: spec-write-tasks 决断式拆分推荐 + plan→tasks→review 跨文档审查

## Summary

把 `spec-write-tasks` 的"是否拆分"从软提示升级为**决断式推荐**(复用已存在的 `task-governance-signals.v1` 复杂度信号),把拆分后的 doc-review 从"用户可选"升级为**决断式推荐 handoff**(复用已存在的 `next_action: review-task-pack`,不自动串联),并在 `spec-doc-review` 审查 task-pack 时补一个**轻量 requirements↔tasks 覆盖盘点**(主力防漂移仍压在 `source_plan_hash` 重生成闭环上)。

全部改动是 source-of-truth prose/contract 增强,**零新脚本、零新 schema、零新 workflow 入口**,不引入自动执行状态机。

---

## Problem Frame

用户诉求:① `spec-write-tasks` 在 plan 后 / work 前按复杂度自动判断是否拆分并引导用户;② 拆分后联动 doc-review,联合审查需求/计划/任务三份文档;③ 保障多文档交付质量。

经一手审查 + 对抗验证的业界研究(deep-research,23/25 claim 3-0)发现:

1. **诉求 ①② 的集成点已存在**:`spec-plan` Phase 5.4 handoff 菜单已提供 spec-write-tasks(`references/plan-handoff.md`);`spec-work` 已有 pre-work task-pack suitability check;`spec-write-tasks` 已有 compile/skip/return-to-plan/draft-only 复杂度判定;`spec-plan` Phase 0.6 已消费 `task-governance-signals.v1` 复杂度信号。
2. **复杂度信号脚本已存在**:`task-governance-signals.v1`(`plan-declared` + `git-diff` 两源,输出 `candidate_level` + `reason_codes` + `collection_status`)就是"按复杂度判断"的确定性事实源。P0 因此从"造脚本"收敛为"接线复用"。
3. **真缺口只有一处**:`spec-doc-review` Phase 1 只接受单文档路径、单类型分类;跨文档一致性目前是**传递式**(plan↔origin、tasks↔source_plan),缺 **requirements↔tasks 直接的 ID 级覆盖检查**(某条 R/F/AE 是否在 task 端被引用)。范围诚实声明(评审收敛):本方案 P2 捕获的是 **ID 级覆盖 gap(需求被整条丢弃/不可追踪)**;对"plan 审过后被编辑、但仍引用同一 R-ID 而语义已变窄"的**语义漂移**,ID 覆盖检查看不到(ID 仍可追踪 → 无 gap),且 `source_plan_hash` 只证 plan→tasks 新鲜度、不证 requirements→plan。语义漂移属 reviewer 人工判断,不在本方案确定性捕获范围(见 NG2)。
4. **业界赢家模式 = regeneration over drift-detection**(Spec Kit `/speckit.analyze` + Kiro `Sync Files`):从权威源重生成下游产物防漂移,而非事后 diff。spec-first 的 `source_plan_hash` 已实现该机制且更硬,因此 P2 应**强化既有 hash 闭环 + 轻量覆盖盘点**,而非新建跨文档 diff 引擎。

**与治理边界的冲突(已据此设计):** 用户原话"自动掉起 / 自动串联"撞上三条载明硬规则——`spec-write-tasks` Core Rule 5「does not introduce its own lifecycle hook」、`using-spec-first`「Do not chain multiple workflows automatically」、角色契约「Gate 是轻量确认点,不是中心化状态机」。业界证据同样支持人在环中(Spec Kit/Kiro 的 analyze/clarify 多为 should/recommended)。本方案统一采用 **决断式推荐 + 用户确认**,而非 silent auto-run。

---

## Goals

- G1. `spec-write-tasks` task-ready check 消费 `candidate_level`(advisory),输出**带理由的明确拆分推荐**,而非中性"你可以选"。
- G2. `spec-plan` / `spec-work` 的 task-pack handoff 文案升级为基于复杂度信号的决断式推荐,保留用户决策。
- G3. 高风险 task-pack 的 `next_action` 决断为 `review-task-pack`,并在 run 输出给出 copy-ready 的 doc-review 调用(用户确认后运行)。
- G4. `spec-doc-review` 审查 task-pack 时补 requirements↔tasks 覆盖盘点,gap 作为 finding 暴露;freshness 仍依赖 `source_plan_hash`。
- G5. 全部改动通过 contract/unit tests + skill-entrypoint lint + fresh-source eval,双宿主(Claude/Codex)行为一致。

## Non-Goals

- NG1. **不**让 `spec-write-tasks` 自动 invoke `spec-doc-review`(违反 Core Rule 5 + 自动串联禁令)。
- NG2. **不**新建 requirements↔plan↔tasks 三向 diff 引擎或跨文档审查状态机。
- NG3. **不**新增 `spec-*` / `spec-*` 入口;`spec-write-tasks` 仍是 standalone skill。
- NG4. **不**新增复杂度评分脚本或 schema;复用 `task-governance-signals.v1`,judgment 留给 LLM。
- NG5. **不**把 `candidate_level` 当 confirmed truth 硬门禁;它是 advisory,`collection_status` 非 `ok` 时降级。
- NG6. **不**让 `spec-doc-review` 变成"必须三文档并排重审";覆盖盘点是 task-pack 审查内的一个 bounded 追加 lens。

---

## Direct Evidence

- target_repo: spec-first
- source_refs:
  - skills/spec-write-tasks/SKILL.md
  - skills/spec-write-tasks/references/task-quality-guide.md
  - skills/spec-doc-review/SKILL.md
  - skills/using-spec-first/SKILL.md
  - skills/spec-plan/SKILL.md
  - skills/spec-plan/references/plan-handoff.md
  - skills/spec-work/SKILL.md
  - src/cli/helpers/task-governance-signals.js
  - docs/contracts/governance/task-governance-signals.md
  - docs/contracts/workflows/review-finding.md
  - docs/contracts/workflows/fresh-source-eval-checklist.md
  - templates/claude/commands/spec/{plan,work,doc-review}.md
- current_revision: leo-2026-06-03-ceupdate
- worktree_dirty: true(docs/09-业界借鉴/ 下有未跟踪文件,与本计划无关)
- discovery_methods: bounded direct reads、grep、deep-research workflow(5 角度 / 17 源 / 25 claim 对抗验证)
- tests_or_logs: 未运行测试(规划阶段);deep-research 结果 23 confirmed / 2 refuted(Anthropic over-decomposition 立场被否决)
- confidence: high(集成点与信号脚本均已一手确认);medium(P2 doc-review 单文档分类边界改动面、findings-schema 是否需扩展待执行期核实)
- limitations: 未逐行核对 `spec-plan/references/plan-template.md` 与 `spec-doc-review/references/findings-schema.json` 全集;over-decomposition 量化拐点无一手实证

---

## Context & Research

**外部证据(deep-research,已对抗验证):**

- 是否拆分由复杂度/风险驱动:Kiro `Specs`(复杂/高回归代价)vs `Vibe`(探索/原型);INVEST "Small" = 6–10 story/sprint。
- 拆分应产出跨层 vertical slice;按架构层横切是反模式(违反 INVEST independent/valuable);SPIDR 9 模式有序决策、Spike 殿后。
- 高质量 task 文档字段已标准化(Kiro 三件套 / Spec Kit tasks.md 元数据);**spec-first 现有 task-card 字段已覆盖并超过**(多了 `stop_if` 与 `source_plan_hash`)。
- 门禁与跨文档一致性是核心差异点:Spec Kit `/speckit.analyze`(tasks 后 implement 前跨产物一致性)、Kiro `Analyze Requirements` + `Sync Files`;均以 should/recommended 落地,保留人在环中。
- **regeneration over drift-detection** 是收敛结论(Spec Kit + Kiro 交叉印证)。
- 诚实标注:Anthropic 对 over-decomposition 的立场两条 claim 被 0-3 否决,本方案不引用;over-decomposition 量化拐点缺一手实证(开放问题)。

**内部现状(一手):**

- `task-governance-signals.v1`:`--source plan-declared|git-diff`,输出 `candidate_level`(lightweight/standard/deep)、`reason_codes`、`collection_status`(ok/degraded/unavailable,独立于 candidate_level)。当前唯一 consumer 是 `skills/spec-plan/SKILL.md`(Phase 0.6)。
- `spec-write-tasks` 决策包络在 `SKILL.md:268-295`,`next_action` 枚举已含 `review-task-pack`;evals 在 `skills/spec-write-tasks/evals/*.json`。
- `spec-plan` task-pack handoff 路由在 `skills/spec-plan/references/plan-handoff.md:42,51`。
- `spec-work` pre-work suitability check 在 `skills/spec-work/SKILL.md:204-207`。
- `spec-doc-review` task-pack 分类与忠实度校验在 `skills/spec-doc-review/SKILL.md:120-131`,引用 `references/subagent-template.md`、`references/findings-schema.json`。
- 相关测试:`tests/unit/spec-plan-contracts.test.js`、`spec-work-contracts.test.js`、`spec-doc-review-contracts.test.js`、`task-pack-command.test.js`、`lint-skill-entrypoints.test.js`。

---

## Key Technical Decisions

- **KTD1 — 优先消费 source plan 自身的复杂度证据,`task-governance-signals` 仅作可选交叉校验。** 在 spec-write-tasks 介入时,source plan **已存在且结构完整**:实现单元数、`Files` 集、依赖链、以及 plan 已确认的 depth(frontmatter `plan_depth` 当存在时)都是 tasks-time 可直接读取的高保真证据。这是拆分推荐的**主输入**。`task-governance-signals --source plan-declared` 仅作可选交叉校验,且**必须显式注意**:plan-declared 模式契约上为 pre-plan Phase 0.6 设计、不消费 Implementation Units,且需要构造 `--input <planning-context.json>` 才有非空信号;若不传 `--input`,会**静默退化到 `candidate_level=lightweight` 且 `collection_status=ok`**(不触发 NG5 的降级保护)。因此本方案**不**在 tasks-time 重跑该 helper 作为主判据,避免低保真信号与"多真相源"。理由:可信证据 > 自动化便利;避免对已在上游决定的事实造第二个弱权威。
- **KTD2 — 决断式推荐而非自动执行。** 三处 handoff 都输出"一个推荐 + 一个理由 + 一个动作",由用户确认。理由:遵守 Core Rule 5 / 自动串联禁令 / Gate 非状态机;业界亦人在环中。
- **KTD3 — P1 复用既有 `next_action: review-task-pack`,只补决断标准 prose,并加固 NG1。** 不新增字段、不新增枚举。高风险触发条件:含 `review_gate: required` 任务、触及共享 contract/公开 workflow prose/source-runtime 边界、或**任务数显著偏多**(无固定硬阈值,由 LLM 依直接证据判断;可锚定 `task-governance-signals` 的 `deep` 阈值或 INVEST 6–10/sprint 作为参考量级,不写死数字)。**NG1 加固**:`next_action: review-task-pack` + copy-ready 调用是**需人类决策的 handoff 建议**,不是自动执行指令;交互式宿主应停下等待用户确认,**自治宿主(无人类暂停)必须 surface 该建议而非自行 dispatch doc-review**。no-auto-chain 保证写进 prose,不依赖宿主恰好会暂停。
- **KTD4 — P2 强化 hash 闭环 + 轻量 ID 覆盖盘点(方案 b)。** 不做三文档并排重审。doc-review 在 task-pack 路径解析 task-pack→source_plan→plan.origin(requirements),核对每条**影响实现**的 R/F/AE 是否经 `requirement_refs`/`source_unit` 在 task 端**被引用**(ID 级可追踪性);freshness 交给 `source_plan_hash`;**未被引用**的 R/F/AE(整条丢弃/不可追踪)作为覆盖 gap finding。**范围边界**:这是 ID 级覆盖检查,**不**检测"R-ID 仍被引用但语义已变窄"的语义漂移(那属 reviewer 人工判断,见 NG2)。理由:regeneration over drift-detection,最小可维护。
- **KTD5 — 双宿主对齐。** `skills/` 是 Claude/Codex 共享 source。改动 prose 须保留 host-agnostic 措辞(`spec-*` 与 `spec-*` 并列或由 host 占位),runtime mirror 经 `spec-first init` 重生成,不手改。

---

## System-Wide Impact

- **Workflow 链路:** 强化 `Plan -> Tasks -> Review` 节点间 handoff 质量与证据留存,不改链路形状。
- **Downstream consumers:** `spec-work` 消费 task-pack 时新增"可能带 review 推荐"的 handoff;`spec-doc-review` task-pack finding 集新增覆盖类 finding。
- **双宿主:** Claude(`spec-*`)与 Codex(`spec-*`)共享 skill 源,需同步验证生成镜像与命令模板措辞。
- **Contracts:** `task-governance-signals.md` 新增 `spec-write-tasks` consumer 说明;`spec-doc-review` findings 若需新 finding 类别需评估 schema 影响(执行期核实,优先复用现有 `review-finding.v1`)。

---

## Implementation Units

### U1. spec-write-tasks 决断式拆分推荐(消费 task-governance-signals)

- **Goal:** task-ready check 以 **source plan 自身结构(实现单元数、`Files`、依赖链、`plan_depth` frontmatter 当存在)** 为主复杂度证据,把 compile/skip 决策输出为带理由的明确推荐;`task-governance-signals` 仅作可选交叉校验且降级时说明。
- **Requirements:** G1, NG4, NG5
- **Dependencies:** 无
- **Files:**
  - `skills/spec-write-tasks/SKILL.md`(Task-Ready Check / Compilation Flow 段)
  - `skills/spec-write-tasks/references/task-quality-guide.md`(Task-ready Source Plan 段补 advisory 信号说明)
- **Approach:** 在 Task-Ready Check 增加一段:主判据是 source plan 自身结构与已确认 depth(tasks-time 这些都已存在且高保真);据此输出决断式推荐(单元多/依赖深/跨模块/`plan_depth: deep` 倾向 compile、小而浅倾向 skip 并明确"非遗漏")。`task-governance-signals --source plan-declared` 列为**可选**交叉校验,并显式写明:它为 pre-plan 设计、不消费 IU、需构造 `--input` JSON 才有非空信号;**不传 `--input` 会静默退化到 `lightweight`+`collection_status=ok`,不能据此判低风险**——因此不把它当 tasks-time 主判据。LLM 做最终语义判断并记录理由。明确该 signal 非硬门禁、非 confirmed truth。
- **Patterns to follow:** `skills/spec-plan/SKILL.md` Phase 0.6 对该 helper 的 advisory 消费写法(注意 Phase 0.6 是 pre-plan,本 unit 是 tasks-time,主判据不同)。
- **Test scenarios:**
  - fresh-source eval:给定多单元/深依赖/`plan_depth: deep` 的 plan,task-ready check 输出 compile 推荐 + 理由(非中性措辞)。
  - fresh-source eval:仅以 `--source plan-declared` 且无 `--input` 得到 `lightweight`+`ok` 时,SKILL prose 要求不得据此判低风险,需回落 plan 自身结构。
  - 文档契约:SKILL.md 把 plan 结构/`plan_depth` 列为主判据,`task-governance-signals` 标注为可选交叉校验,未被描述为强制门禁或 confirmed truth。
- **Verification:** `npm run lint:skill-entrypoints` 通过;fresh-source eval 三场景符合预期。

### U2. spec-plan / spec-work handoff 文案升级为决断式推荐

- **Goal:** 两处既有 handoff(plan 后菜单、work 前 suitability check)从"当 plan 大时可选"升级为基于复杂度信号的决断式推荐,保留用户确认。
- **Requirements:** G2, KTD2
- **Dependencies:** 逻辑前置 U1(措辞与 U1 复杂度判据一致),非硬数据依赖——可与 U1 并行起草。
- **Files:**
  - `skills/spec-plan/references/plan-handoff.md`(Option 2 文案,行 42/51)
  - `skills/spec-plan/SKILL.md`(Phase 5.4 菜单 Option 2,行 752-756 — **plan-handoff.md 菜单的 inline 副本,必须与 plan-handoff.md 同步修改**,否则不同加载路径文案漂移)
  - `skills/spec-work/SKILL.md`(pre-work suitability check,行 204-207)
- **Approach:** 把"Use the standalone skill when the plan is large"改为"当 plan 结构显示高复杂度(多单元/依赖链/跨模块,或 `plan_depth: deep`)时**建议**拆分,理由 X;否则可直接 work,代价 Y"。代价 Y 给具体可选短语(单次 work 上下文过载、审查范围过宽反馈慢、任务耦合高回滚成本大),避免自由发挥。保留为用户选项,不自动执行。spec-work 侧维持"offer once",但措辞决断化。
- **Patterns to follow:** `using-spec-first` guide-mode「推荐入口/理由/下一步」三段式。
- **Test scenarios:**
  - 文档契约:`spec-plan-contracts.test.js` / `spec-work-contracts.test.js` 断言 handoff 仍是 user-confirmed,未出现 auto-run/auto-chain 措辞。
  - fresh-source eval:menu Option 2 文案体现复杂度理由而非中性描述。
- **Verification:** 相关 contract 单测通过;lint 通过。

### U3. tasks→doc-review 决断式推荐 handoff(复用 next_action: review-task-pack)

- **Goal:** 高风险 task-pack 的决策包络 `next_action` 决断为 `review-task-pack`,run 输出给出 copy-ready doc-review 调用;不自动执行。
- **Requirements:** G3, KTD3, NG1
- **Dependencies:** 逻辑前置 U1,非硬数据依赖。
- **Files:**
  - `skills/spec-write-tasks/SKILL.md`(Final Decision Envelope / Handoff 段)
  - `skills/spec-write-tasks/evals/boundary-cases.json`(补"高风险包推荐 review"用例)
- **Approach:** 在 Handoff 段补决断标准:当 task-pack 含 `review_gate: required` 任务、触及共享 contract/公开 workflow prose/source-runtime 边界/security-release-CI、或任务数显著偏多(无硬阈值,LLM 依直接证据判断,可锚定 `task-governance-signals` deep 阈值或 INVEST 6–10 作参考量级)时,`next_action` 选 `review-task-pack`,并输出 `spec-doc-review <task-pack-path>`(Codex:`spec-doc-review`)的 copy-ready 调用与一句理由。**NG1 加固措辞**:这是需人类决策的 handoff 建议,不得由 spec-write-tasks 自动调用 doc-review;自治宿主必须 surface 该建议而非自行 dispatch。
- **Patterns to follow:** 既有 `next_action` 枚举语义(SKILL.md:292)与 evals 结构。
- **Test scenarios:**
  - fresh-source eval:含 `review_gate: required` 的 pack → `next_action: review-task-pack` + copy-ready 调用 + 一句理由。
  - fresh-source eval:低风险 docs-only pack → 不强推 review。
  - 文档契约:出现"自治宿主须 surface、不得自动 dispatch"措辞;未出现 spec-write-tasks 自动执行 doc-review 的措辞(NG1 反向断言)。
- **Verification:** evals 通过;lint 通过。

### U4. spec-doc-review task-pack 审查补 requirements↔tasks 覆盖盘点

- **Goal:** doc-review 审查 task-pack 时,在既有 source_plan 忠实度校验之外,补一个 bounded **ID 级** requirements↔tasks 覆盖盘点,未被引用的 R/F/AE 作为 gap finding;freshness 依赖 `source_plan_hash`。
- **Requirements:** G4, KTD4, NG2, NG6
- **Dependencies:** 无(可与 U1-U3 并行)
- **Files:**
  - `skills/spec-doc-review/SKILL.md`(Phase 1 task-pack 分类段,行 120-131)
  - `skills/spec-doc-review/references/subagent-template.md`(reviewer 覆盖盘点指引)
- **Approach:** task-pack 审查路径解析 task-pack→`source_plan`→plan 的 `origin`(requirements doc);核对每条**影响实现**的 R/F/AE 是否经 task 的 `requirement_refs`/`source_unit` 在 task 端被引用(ID 级);未被引用的列为覆盖 gap finding。**finding 落地层澄清**(评审纠正):覆盖 gap finding 以 doc-review 内部 reviewer schema `references/findings-schema.json`(P0-P3 / 0-100 confidence)落地,与其他 finding 同构;`review-finding.v1`(blocking/high/...)是**跨 workflow handoff 摘要层**,两者是不同层、不是不兼容,handoff 时做 severity 映射即可——因此**无需新增 finding 类别或新 schema**。**origin 可达性决策树**:① origin 字段存在且可解析 R/F/AE → 产出覆盖 gap finding;② origin 字段缺失/指向不存在文件 → 输出 limitation(不阻断);③ origin 存在但无结构化 R/F/AE → 记 limitation,不在本 unit 内做内容解析(执行期 stop_if 升级点)。明确:freshness/identity 仍由 `spec-first tasks validate` + `source_plan_hash` 负责;这不是三文档并排重审,是 task-pack 审查内的轻量追加 lens;ID 级覆盖**不**检测语义漂移(NG2)。
- **Patterns to follow:** 现有 task-pack 忠实度校验段;`skills/spec-doc-review/references/findings-schema.json`(reviewer 输出);`docs/contracts/workflows/review-finding.md`(handoff 映射层)。
- **Test scenarios:**
  - fresh-source eval:某 R/F/AE 整条未被任何 task 引用 → 产出覆盖 gap finding(findings-schema.json 结构)。
  - fresh-source eval:origin 字段缺失/不可达 → 输出 limitation,不阻断 review。
  - fresh-source eval:origin 存在但无结构化 R/F/AE → 记 limitation,不做内容解析。
  - 文档契约:`spec-doc-review-contracts.test.js` 断言覆盖盘点是 task-pack 路径内 bounded lens、用 findings-schema.json 落地、未升级为强制三文档输入。
- **Verification:** `spec-doc-review-contracts.test.js` 通过;lint 通过;确认 finding 走现有 findings-schema.json、未新增未版本化 schema。

### U5. Contracts 与双宿主对齐

- **Goal:** 记录 `spec-write-tasks` 成为 `task-governance-signals` 新 consumer;确认 Claude/Codex 双宿主 prose 一致。
- **Requirements:** G5, KTD5
- **Dependencies:** U1, U2, U3, U4
- **Files:**
  - `docs/contracts/governance/task-governance-signals.md`(**当前无 consumers 段,需新增**:consumer 名称、消费姿态、collection_status 降级规则;并记录 spec-write-tasks 把 plan-declared 作可选交叉校验、非主判据)
  - `templates/claude/commands/spec/{plan,work,doc-review}.md`(已确认存在;**仅当其 inline 了被改 handoff prose 才改**——经核多为 thin launcher,实际改动概率低,执行期确认即可,无 `write-tasks.md`,符合 standalone skill 定位)
- **Approach:** 在 contract **新增 consumers 段**标注新 consumer 与消费姿态(advisory、collection_status 降级规则、tasks-time 为可选交叉校验)。审查所有改动 prose 的 host 入口措辞,确保 `spec-*` 与 `spec-*` 并列或占位化,无单宿主硬编码;确认命令模板是否 inline handoff prose。runtime mirror 不手改,经 `spec-first init` 重生成验证。
- **Patterns to follow:** `task-governance-signals.md` 现有结构;`using-spec-first` 双宿主入口写法。
- **Test scenarios:**
  - 文档契约:contract consumer 段包含 spec-write-tasks。
  - `spec-first init` 后 `spec-first doctor --claude` 与 `--codex` 无 drift。
- **Verification:** `npm run test:mcp-setup` 或 doctor 双宿主检查通过;`spec-first init` 重生成无意外 diff。

### U6. 测试、fresh-source eval 与文档/Changelog

- **Goal:** 补齐 contract/unit 测试覆盖;按 CLAUDE.md 执行 fresh-source eval;同步 CHANGELOG 与(用户可见时)README。
- **Requirements:** G5
- **Dependencies:** U1, U2, U3, U4, U5
- **Files:**
  - `tests/unit/spec-doc-review-contracts.test.js`
  - `tests/unit/spec-plan-contracts.test.js`
  - `tests/unit/spec-work-contracts.test.js`
  - `tests/unit/task-pack-command.test.js`(或新增 spec-write-tasks 契约断言)
  - `CHANGELOG.md`
  - `README.md`、`README.zh-CN.md`(handoff 行为用户可见时)
- **Approach:** 为每个 unit 的"文档契约"断言补/改测试。**测试分层(评审纠正):** 现有 contract 测试只能用字符串断言守住**已知反措辞**(无 auto-run/auto-chain 词),无法判定"决断 vs 中性"语义强度——因此补一个**可常跑的正向最小检查**:推荐文案必须含「理由 token + 单一 named next action」结构。语义强度的真正判据是 fresh-source eval。运行 `npm run lint:skill-entrypoints`;按 `docs/contracts/workflows/fresh-source-eval-checklist.md` 对 U1/U3/U4 语义 prose 做 fresh-source eval(注入磁盘 SKILL 源到全新 subagent)。**降级诚实**:宿主缺 dispatch 时,替代手段为在当前会话直接读改后 SKILL 源、逐 test scenario 人工核对措辞,并在 closeout 记录"fresh-source eval 未执行原因 + 人工核对结论 + 限制";**记录未执行 ≠ 通过**,G5 的 eval 腿在此情况下标记为部分满足。CHANGELOG 用全局 developer profile 作者,用户可见项加 `(user-visible)`。
- **Patterns to follow:** 现有 `*-contracts.test.js` 断言风格;CHANGELOG 现行格式。
- **Test scenarios:**
  - `npm test` 全链路通过(unit + smoke + integration)。
  - 正向最小检查:U2/U3 推荐文案结构含理由 + 单一 next action(常跑,不依赖 dispatch)。
  - fresh-source eval 三个语义 unit 通过,或记录未执行原因 + 人工核对结论(G5 标记部分满足)。
  - `Test expectation: none -- 文档/Changelog 同步,无独立行为` 适用于纯 CHANGELOG/README 部分。
- **Verification:** `npm test` 通过;`npm run lint:skill-entrypoints` 通过;CHANGELOG 含本次 source 变更记录。

---

## Risks & Mitigations

- **R1 — 决断式推荐被误读为自动门禁/自动执行。** 缓解:每处明确"user-confirmed、advisory、不自动 invoke";contract 测试反向断言无 auto-chain 措辞(U2/U3)。
- **R2 — `candidate_level` 被当 confirmed truth。** 缓解:KTD1 + NG5 明确 advisory 与 `collection_status` 降级;U1 测试覆盖降级路径。
- **R3 — P2 覆盖盘点膨胀成三文档 diff 引擎/状态机。** 缓解:NG2/NG6 + KTD4 限定为 task-pack 路径内 bounded lens,freshness 交 hash;U4 测试断言边界。
- **R4 — Skill prose 会话缓存导致验证失真。** 缓解:U6 用 fresh-source eval(注入磁盘源到全新 subagent),不依赖当前会话已缓存定义。
- **R5 — 双宿主措辞漂移。** 缓解:U5 host-agnostic 措辞审查 + `spec-first init` 重生成 + doctor 双宿主检查。
- **R6 — finding schema 层次混淆。** 已澄清(评审纠正):覆盖 gap finding 走 doc-review 内部 `findings-schema.json`(P0-P3),`review-finding.v1` 仅是 handoff 摘要层,二者不同层、不需新 schema。缓解:U4 明确落地层 + 文档契约断言走现有 schema;若执行期发现确需新字段,升级为 schema 版本化 + downstream consumer 测试的 stop_if。
- **R7 — P2 被误读为能捕获语义漂移。** 缓解:Problem Frame #3、KTD4、U4 均限定为 ID 级覆盖,显式声明语义漂移(R-ID 仍引用但含义变窄)不在确定性捕获范围(NG2),属 reviewer 人工判断。
- **R8 — 核心"决断 vs 中性"语义属性测不住。** 缓解:U6 补常跑正向最小检查(理由 + 单一 next action 结构)+ fresh-source eval 作语义判据;并诚实声明 eval 跳过时 G5 仅部分满足、记录未执行 ≠ 通过。
- **R9 — 价值无 outcome 信号(product-lens)。** 缓解:见 Open Questions;本轮按角色契约 Evaluation Harness 精神,把"是否减少错误拆分/漂移包进入下游"列为后续 dogfooding 观察点,不在本 plan 内造度量脚本。

## Assumptions

- A1. spec-write-tasks 主复杂度判据是 source plan 自身结构(tasks-time 已存在);`task-governance-signals` 仅可选交叉校验,不可用/无 `--input` 时不阻断、也不据其判低风险。
- A2. 覆盖 gap finding 走 doc-review 现有 `findings-schema.json`(P0-P3),无需新 finding 类别;`review-finding.v1` 仅 handoff 摘要层。已一手确认,非待核实。
- A3. handoff 行为变化属用户可见,需同步 README;若评审认为仅内部 workflow 措辞,可降为仅 CHANGELOG。

---

## Sequencing

1. **Wave 1(并行):** U1(拆分推荐核心)、U4(doc-review 覆盖盘点)— 无相互依赖。
2. **Wave 2(可与 Wave 1 重叠):** U2、U3 — 逻辑前置 U1(措辞一致),非硬数据依赖,可在 U1 定稿措辞后并行起草。
3. **Wave 3:** U5(contracts/双宿主,依赖 U1-U4)。
4. **Wave 4:** U6(测试/eval/docs/changelog,依赖全部)。

> **单元性质说明(评审纠正,right-sizing):** 本 plan 真正新增的耐久机制只有 **U4(ID 覆盖 lens)** 与 **U1 的 plan-结构判据 + U3 的 copy-ready handoff**;U2 及 U1/U3 的"决断措辞"部分本质是对**已存在集成点**的 prose 校准,不是新能力。`plan_depth: deep` 主要因跨 4 个 skill + 双宿主 + 治理边界审查的广度,而非单点难度。读者应按"1 个新 lens + 既有 handoff 措辞校准 + 配套契约/测试"来衡量价值与验证投入。

---

## Deferred to Implementation

- `spec-doc-review/references/findings-schema.json`:已确认覆盖 finding 走现有 schema、无需新增字段;仅当执行期发现确需新字段才升级为 schema 版本化(U4 stop_if)。
- `templates/claude/commands/spec/{plan,work,doc-review}.md`:已确认存在;仅当其 inline 了被改 handoff prose 才需同步(经核多为 thin launcher,执行期确认)。
- README 是否更新由 A3 在评审/执行期定夺。

---

## Open Questions(评审提出,非阻断)

- **OQ1(product/adversarial):** 是否有实测证据表明"当前中性 offer 导致用户做错拆分/审查决策"?若无,U1-U3 的决断措辞部分是预防式细化而非实需,价值排序可下调;U4(覆盖 lens)与 U1 结构判据、U3 copy-ready 仍是确定的能力增量。
- **OQ2:** 真实使用中"语义漂移"(R-ID 仍引用但含义变窄)相对"整条丢弃"漂移有多常见?若前者为主,本方案的 ID 覆盖范围正确但需在未来考虑 reviewer 语义 lens;若后者为主,当前范围已够。
- **OQ3:** 决断式 handoff 的"密度"——确认三处推荐不会在单次 pass 内连续触发、lightweight 路径保持安静(本 plan 已把"小而浅 → skip 且不打扰"列为显式设计属性)。
