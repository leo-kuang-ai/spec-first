---
title: "spec-doc-review 主干文案压缩 - 计划"
type: refactor
date: 2026-07-15
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-plan-bootstrap
execution: code
---

# spec-doc-review 主干文案压缩 - 计划

## Goal Capsule

- **Objective:** 通过只收紧解释性文案，让 `skills/spec-doc-review/SKILL.md`（257 行）向其 aspirational ~160 行目标靠拢，`skills/spec-doc-review/references/subagent-template.md`（132 行）向其 aspirational ~80 行目标靠拢。这是在推进 `docs/plans/2026-07-14-001-refactor-spec-doc-review-token-optimization-plan.md`（U1/U3）遗留的两个 aspirational 行数目标——该计划已经达成主要的 hot_instruction 降幅目标（−48.4%），并把行数目标标记为 aspirational 而非阻塞项。
- **Authority:** 复用上一轮 token 优化计划已验证的技术——主干已经具备渐进式披露结构（STOP 锚点、惰性 reference），本计划只收紧主干自身的文案密度，不改动该结构。
- **Stop conditions:** 不改动任何 STOP 锚点文本、contract-test 断言字符串、schema enum、roster budget 值、cost-shape 格式或 dispatch 语义。不改动任何惰性 reference、persona 文件、findings schema、contract test 或 CLI 行为。不新增文件。

---

## Product Contract

### Summary

`spec-doc-review` 的两个热路径主干文件仍然承载着超出硬约束所需的解释性文案。`tests/unit/spec-doc-review-contracts.test.js` 已经钉死了每一条承重字符串（STOP 锚点、schema enum、autofix_class 三档定义、置信度锚点表、误报目录条目）——本计划压缩的是其余部分：冗余的 gate 消息、表格周边的冗长文案、以及重复的解释。

### Problem Frame

已完成的 token 优化计划（`docs/plans/2026-07-14-001-...`）关闭了其主要目标（hot_instruction −48.4%），但明确把行数目标降级为 aspirational：SKILL.md 落在 257 行（目标 ~160），`subagent-template.md` 落在 132 行（目标 ~80）。这两个文件在每次审查中都会被重新注入（`SKILL.md` 每次编排注入一次，`subagent-template.md` 每次派发子代理都注入一次），因此在不改变结构的前提下，继续压缩文案仍能持续降低每次审查的 token 成本。

### Requirements

- R1. `skills/spec-doc-review/SKILL.md` 从 257 行降到约 170 行或更少，且 `tests/unit/spec-doc-review-contracts.test.js` 断言的每一条字符串原样保留。
- R2. `skills/spec-doc-review/references/subagent-template.md` 从 132 行降到约 85 行或更少，且 `tests/unit/spec-doc-review-contracts.test.js` 断言的每一条字符串原样保留。
- R3. 不修改任何惰性 reference 文件、persona 文件、`references/findings-schema.json`，也不修改 `tests/` 下的任何文件。
- R4. subagent 模板主干中 `why_it_matters` 的反模式示例对（"Section X says Y... Reconcile." 与 "Implementers will disagree..." 的对比）在压缩后保留——这是主干中唯一的具体 framing 示例，删掉会让这条规则失去可参照的示范。

### Scope Boundaries

**In scope:** 仅限 `SKILL.md` 和 `subagent-template.md` 内部的文案收紧——压缩 gate 消息、收紧表格周边说明、去重规则表述。

**Out of scope:** 不改动 `synthesis-and-presentation.md`、persona 文件、惰性 reference、roster budget 值、cost-shape 格式、dispatch/isolation 语义、findings schema 或 contract tests 本身。上一轮计划遗留的 decision-primer 增长控制（U5）继续 deferred，不属于本计划范围。

---

## Planning Contract

### Key Technical Decisions

- **KTD1：按 contract-test 映射逐节压缩，而非整体重写。** `tests/unit/spec-doc-review-contracts.test.js` 明确列出了每个文件必须保留的精确字符串和短语模式。把这份测试文件当作压缩边界（压缩其余部分，不动它断言的任何内容），可以避免仅靠通读文案来反推硬约束。
- **KTD2：使用最小化 fresh-source eval，而非上一轮计划的完整矩阵。** 这是对已验证内容做纯文案压缩（不涉及结构或 STOP 锚点变化），因此 1 篇 fixture × 1 个 persona 的单次运行足以捕捉明显的 framing 退化。上一轮 token 优化计划的完整矩阵（2 篇 fixture × 5 个 persona × 3 次运行）是为了应对本计划不涉及的结构性风险（冷路径 STOP 触发、置信度锚点校准）。
- **KTD3：合并冗余的 gate 消息，而非各自独立缩短。** 当前 missing-document gate 和统一 artifact 合同检查把 interactive/headless 两种情形写成两段完整独立的句子；把它们合并成一条带内联分支的消息，可以在不丢失任何一种情形内容的前提下去除重复。

### Assumptions

- 内置 validator 已经报出的 `argument-hint` frontmatter 警告（`unknown_frontmatter_extension`）是既有的 target-owned 字段，不属于本轮压缩范围。

---

## Implementation Units

### U1. 压缩 SKILL.md 主干文案

**Goal:** 在保留 `tests/unit/spec-doc-review-contracts.test.js` 断言的每一条字符串的前提下，把 `skills/spec-doc-review/SKILL.md` 从 257 行压缩到约 170 行。

**Requirements:** R1, R3

**Dependencies:** 无

**Files:**
- `skills/spec-doc-review/SKILL.md`

**Approach:**

逐节推进，每改完一节就对照一次 `tests/unit/spec-doc-review-contracts.test.js` 再进入下一节：

- Frontmatter `description`：收紧为一行，保留触发条件、roster 默认值和负向边界信号。
- Phase 0 标志位表格：保留表格；把 `depth:full`/`depth:lite` 折叠成表格下方的一行说明（"`depth:*` aliases `roster:*`; `roster:` wins when both appear"），不再单独占行。删掉与标志位表格或 Phase 1 gate 措辞重复的 headless 模式文案。
- Phase 1 文档解析与 missing-document gate：把 interactive/headless 两种消息变体合并成一条带内联分支的消息，替代两段完整段落。
- 统一 artifact 合同检查：把四个分支描述（unified-requirements / unified-plan / HTML / 非法 readiness）压缩成更紧凑的列表。原样保留 `artifact_readiness: requirements-only`、`` classify as `unified-requirements` ``、`artifact_readiness: implementation-ready`、`` classify as `unified-plan` ``（contract test 断言）。
- 核心分类规则与 STOP 锚点：不改动（contract test 断言：`content shape.*not its file path`、`Path is a tie-breaker hint`、`document-classification-signals.md`、`classification is genuinely ambiguous`）。
- 角色激活速查表与 STOP 锚点：表格和 STOP 文本不改动（contract test 断言）；只收紧一行引导文案。
- Roster budget 表格与单一条件优先级列表：表格和 escape-hatch 行原样保留（contract test 断言：`roster:lite`、`roster:standard`、`roster:full`、`Apply Roster Budget`、`at most 1`）；收紧优先级列表的引导文案。
- Cost-shape：格式行和 `doc_bytes`/`degraded_inherited` 术语原样保留（contract test 断言）；把字段说明各收紧为一行。
- Phase 2 公告：保留规则语句；删掉示例代码块（规则文本本身已经足够——示例只是重复展示上方 cost-shape 行已经展示过的格式）。
- Build agent list：把 always-on 和条件 persona 的名称列表合并成更紧凑的单行；保留"不要重新扩展列表"的规则语句。
- Dispatch 一节：`fork_turns`/`degraded_inherited`/`Context isolation` 与 `Anti-waste rule` 原样保留（contract test 断言）；收紧模型分层表格的引导文案、每个变量表格行的说明（用短语代替完整句子），以及文档切片说明。
- Decision primer：保留 Round-1 空 primer 代码块和累积语义；把 Round-2+ 模板压缩为一条 applied 示例加一条 rejected 示例（删掉中间重复的示例），并把 `Evidence:` 说明段落收紧到其核心要点（overlap-check 判定的理由）。
- Phase 3-5 指针与 Included References：phase 指针不改动；收紧两个 `@./` include 周边的间距和引导文案。

**Patterns to follow:** 沿用上一轮 token 优化计划自身的主干-惰性 reference 拆分方式（`docs/plans/2026-07-14-001-...`）——本单元只收紧既有主干内的文案，不把内容迁移到新的惰性 reference。

**Test scenarios:**
- Happy path：编辑完成后，`tests/unit/spec-doc-review-contracts.test.js` 在不改动测试文件的前提下全绿通过。
- Edge case：做一次 diff review，确认 contract test 文件中列出的每条字符串（STOP 锚点、roster 表格值、cost-shape 格式、`fork_turns`/`degraded_inherited`、`Anti-waste rule`）与改动前逐字节一致。
- Regression：编辑后行数不超过约 170 行（`wc -l`）。

**Verification:** `npx jest tests/unit/spec-doc-review-contracts.test.js --runInBand` 通过；`wc -l skills/spec-doc-review/SKILL.md` 报告 ≤180（软上限，允许相对 ~170 目标的小幅超出而不阻塞）。

### U2. 压缩 subagent-template.md 主干文案

**Goal:** 在保留 `tests/unit/spec-doc-review-contracts.test.js` 断言的每一条字符串、以及 why_it_matters 反模式示例对的前提下，把 `skills/spec-doc-review/references/subagent-template.md` 从 132 行压缩到约 85 行。

**Requirements:** R2, R3, R4

**Dependencies:** 无（独立于 U1——不同文件）

**Files:**
- `skills/spec-doc-review/references/subagent-template.md`

**Approach:**

- Header 注释：把文件用途说明压缩为一句话。
- Persona 槽位与输出契约 header：把 "Return ONLY valid JSON..." 指令与 schema-conformance 引导语合并；删掉一处空行。
- Schema 硬约束：保留每个 enum 值和 severity-mapping 语句（contract test 断言：`"P0"`、`"P1"`、`"error"`、`"omission"`、`"safe_auto"`、`"gated_auto"`、`"manual"`、evidence-array 与 confidence-exactly 措辞）；把五条约束 bullet 压缩成更紧凑的列表格式。
- 置信度锚点表：表格本身完全不动（contract test 断言：表头行加全部五条锚点行）；把引导句和 "if unsure" 指引行各收紧为一句。原样保留 `subagent-confidence-rubric-detail.md` 和 `If unsure about anchor selection`（contract test 断言），且不引入强制性的 "STOP. Before...confidence...read" 措辞（测试明确断言不得出现）。
- `suggested_fix` 规则：把三条规则 bullet 各收紧为一句；保留"禁止备选菜单"和稻草人 safeguard 的实质内容。
- `why_it_matters` 规则：把四条规则 bullet 各收紧为一行，但原样保留反模式示例对，作为唯一的具体示范（"Section X says Y. Section Z says W. Reconcile." 与 "Implementers will disagree on which tier to apply because..." 的对比）。原样保留惰性 reference 指引句（contract test 断言：`subagent-why-it-matters-guide.md`、`still leads with document structure|cannot name an observable consequence`、`Do not load it when the spine rules already resolve`）。
- `autofix_class` 三档：原样保留三档的定义短语（contract test 断言：`One clear correct fix`、`Concrete fix exists but touches document meaning`、`Requires user judgment`）；把周边示例列表压缩成更紧凑的单行条目。把五条自动提升模式 bullet 各压缩为一行。
- 误报目录：保留全部 10 条条目、各占一行（contract test 断言的子集：pedantic style nitpicks、issues belonging to other personas、speculative future-work concerns、theoretical concerns without baseline、visual-aid removal）；逐条收紧措辞但不删除任何条目。保留 advisory-observations 段落的实质内容。
- Rules 代码块：把十条规则 bullet 各收紧为一行；消除"排除上一轮 deferred 条目"这条规则与误报目录中"Content inside `## Deferred / Open Questions` sections"条目之间的重叠——误报目录条目保留分类定位，这条规则只保留操作指令（不在此处重复分类说明）。
- Review-context 代码块与 context-slots 规则：删掉空行，把五条 context-slot 规则收紧为四行更紧凑的表述。
- Decision-primer 规则：把三条编号规则和 soft-instruction 段落各收紧为一行。

**Patterns to follow:** 与 U1 相同的压缩纪律——收紧解释性文案，不触碰 `tests/unit/spec-doc-review-contracts.test.js` 中的任何字符串。

**Test scenarios:**
- Happy path：编辑完成后，`tests/unit/spec-doc-review-contracts.test.js` 在不改动测试文件的前提下全绿通过。
- Edge case：确认压缩后 why_it_matters 反模式示例对（弱版本和强版本的 framing 语句）原样存在。
- Edge case：确认置信度锚点表的 5 行和"不得包含强制性 STOP...confidence...read"的否定断言依然成立。
- Regression：编辑后行数不超过约 90 行（`wc -l`，软上限，高于 ~85 目标）。

**Verification:** `npx jest tests/unit/spec-doc-review-contracts.test.js --runInBand` 通过；`wc -l skills/spec-doc-review/references/subagent-template.md` 报告 ≤90。

### U3. 验证、最小化 fresh-source eval 并收口

**Goal:** 确认压缩后的两份主干通过全部既有自动化守护，且最小化 fresh-source eval 未显示 finding 质量退化，然后记录结果。

**Requirements:** R1, R2, R3

**Dependencies:** U1, U2

**Files:**
- `CHANGELOG.md`（追加条目）
- `skills/spec-doc-review/SKILL.md`、`skills/spec-doc-review/references/subagent-template.md`（仅当第 3 步的 fresh-source eval 发现退化、需要恢复某处被压缩的段落时才会被触碰）

**Approach:**

1. 运行完整的 contract、unit 与 integration 测试套件（见下方 Verification Contract）。
2. 按 KTD2 运行最小化 fresh-source eval：把当前磁盘上的 `SKILL.md` + `subagent-template.md` + 一个 persona 文件（`coherence-reviewer.md`，选它是因为它是 always-on 且没有特殊激活逻辑，不会干扰结果）注入一个全新的通用子代理，对一篇 fixture 文档跑一次，并与压缩前源码（通过 `git show <before-SHA>:<path>` 取得）跑同一篇 fixture 的结果做定性对比 finding 数量/严重级别/置信度。fixture 使用 `docs/项目审查/2026-07-06-真实状态与提升优先级.md`（在上一轮 token 优化计划的 Verification Contract 中已作为 fixture 1 使用过，形状已知）。
3. 如果 eval 显示明显退化（finding 数量下降 >30%、严重级别或置信度锚点向更保守方向偏移、或 why_it_matters 反模式指引明显未被遵循），恢复导致该退化的具体压缩段落，而不是整体回退文件。
4. 按仓库惯例追加一条 `CHANGELOG.md` 条目（author 取自 `~/.spec-first/.developer`，因为这改变了 skill 的运行时 prompt 内容，需带 `(user-visible)` 标记）。

**Patterns to follow:** 沿用上一轮 token 优化计划的 Fresh-Source Eval 方法（`docs/plans/2026-07-14-001-...`，Verification Contract 一节）——相同的 before/after 注入技术，按 KTD2 缩小规模。

**Test scenarios:**
- Happy path：U1+U2 完成后，contract、unit 与 integration 套件全部通过。
- Regression：最小化 FSE 运行显示的 finding 数量、严重级别分布和置信度分布与压缩前基线相当（无 >30% 的摆动）。
- Test expectation: none，针对 `CHANGELOG.md` 本身的编辑——无行为变化，纯文档性质。

**Verification:** 下方 Verification Contract 中的所有命令通过；FSE 对比结果记录在收口总结中（对话输出或 CHANGELOG 条目中的简短说明），不新建仓库内 artifact 文件。

---

## Verification Contract

| Command | Purpose |
|---|---|
| `npx jest tests/unit/spec-doc-review-contracts.test.js --runInBand` | 确认每一条 STOP 锚点、schema enum、roster/cost-shape 字符串和惰性 reference 指针在压缩后依然存在 |
| `npm run typecheck` | 对 CLI 与脚本做语法检查（本计划不改动代码，但属于仓库标准 gate） |
| `npm run test:unit` | 完整单测套件，捕捉与 doc-review 相邻测试的任何意外交互 |
| `npm run test:integration` | 确认五宿主 runtime 投射集成测试依然通过（未新增或删除 reference 文件） |
| `wc -l skills/spec-doc-review/SKILL.md` | 确认行数 ≤180 |
| `wc -l skills/spec-doc-review/references/subagent-template.md` | 确认行数 ≤90 |

最小化 fresh-source eval（按 KTD2、U3）：1 篇 fixture（`docs/项目审查/2026-07-06-真实状态与提升优先级.md`）× 1 个 persona（`coherence-reviewer`）× 1 次运行（与 KTD2 一致），对比压缩前后的 finding 数量、严重级别分布与置信度分布。

---

## Definition of Done

- [ ] `SKILL.md` 行数不超过约 170 行（软上限 180）；contract-test 断言的每一条字符串原样保留
- [ ] `subagent-template.md` 行数不超过约 85 行（软上限 90）；contract-test 断言的每一条字符串原样保留，包括 why_it_matters 反模式示例对
- [ ] `tests/unit/spec-doc-review-contracts.test.js` 在未改动的前提下通过
- [ ] `npm run typecheck`、`npm run test:unit`、`npm run test:integration` 全部通过
- [ ] 最小化 fresh-source eval 未出现超过 U3 所定阈值的退化
- [ ] 未修改任何惰性 reference、persona 文件、findings schema 或测试文件
- [ ] `CHANGELOG.md` 已更新，带 `(user-visible)` 条目
- [ ] diff 中没有遗留的实验性或废弃尝试内容
