---
title: "feat: 为 work/debug/code-review workflow 加 anti-rationalization 表"
type: feat
status: completed
date: 2026-06-15
target_repo: spec-first
spec_id: 2026-06-15-001-anti-rationalization-tables
plan_depth: standard
origin: docs/项目审查/2026-06-15-行业对标研究档案.md
referenced_reviews:
  - path: docs/项目审查/2026-06-15-行业对标研究档案.md
    role: origin
    scope: in
    addresses_findings: ["BENCH-borrow-anti-rationalization"]
    note: "本 plan 只处理执行/验证 workflow 的 anti-rationalization 切片;spec/plan/doc-review 覆盖作为后续候选,不在本轮完成声明内。"
  - path: docs/项目审查/2026-06-15-项目Review与优化方案.md
    role: origin
    scope: in
    addresses_findings: ["P1-anti-rationalization"]
    note: "本 plan 是低成本 quick win,不替代 06-15 review 的短期主线整改(demo、定位、release notes、OSS 卫生等)。"
---

# feat: 为 work/debug/code-review workflow 加 anti-rationalization 表

## Summary

把对标 superpowers 验证有效的 **anti-rationalization（Red Flags / Common Rationalizations）表**机制,系统化引入 spec-first 的 work / debug / code-review 三个高价值执行·验证 workflow prompt。这是一次**纯 prompt prose 的 light-contract 借鉴**:每个 workflow 增加一张小表,把该 workflow 里已知的「LLM 偷懒/跳步合理化念头」与「正确动作」配对,降低 fake completion、跳验证、跳复现、跳对抗复核等失败模式。

spec-first 已有此模式的雏形——`CLAUDE.md` 的 workflow 入口治理块有「反合理化红旗(出现这些念头即停)」。本 plan 把雏形提炼为可复用的 per-workflow 模式,落到最该有它的三个 workflow。

**这不是 gate,不是状态机,不是强制 ceremony。** 它是 attention-hardening prose,best-effort,与角色契约「Light contract · Let the LLM decide」一致。

**范围校准:** 06-15 项目 Review 的主线判断是「能力成熟、表达/采纳滞后」,短期优先仍是 demo repo、定位收口、GitHub Releases/精简 release notes 与 OSS 卫生。本 plan 只提前落地行业对标档案中「最低成本」的 anti-rationalization quick win,用于补强执行/验证 workflow 的注意力纪律;它不宣称完成 06-15 review 的主线整改,也不覆盖 spec/plan/doc-review 等全部候选 surface。

---

## Direct Evidence

- target_repo: spec-first
- source_refs: `CLAUDE.md`(反合理化红旗雏形)、`skills/spec-work/SKILL.md`、`skills/spec-debug/SKILL.md`、`skills/spec-code-review/SKILL.md`、`skills/spec-work/references/`、`skills/spec-debug/references/`、`docs/项目审查/2026-06-15-行业对标研究档案.md`(§6 superpowers mechanism)
- evidence_snapshot: 2026-06-15 计划复审时位于 `leo-2026-06-15-review-all` 分支、HEAD `1c94293e`;复审前 `git status --porcelain=v1 --branch` 未显示 dirty path。该信息是 snapshot,执行本 plan 前仍必须刷新 git 状态与 diff。
- worktree_dirty: false at review snapshot;后续 plan 修订本身会产生新的 docs diff,不得把本 snapshot 当作执行时事实。
- discovery_methods: `grep -rln 反合理化/红旗/rationaliz`、`ls skills/*/references`、对标档案 §6/§12
- tests_or_logs: 未跑(规划阶段);现有 `contract-drift-guard` 模式可复用为本特性的漂移守护
- confidence: 高(纯 prose 借鉴,机制清晰,边界与 light-contract 哲学契合)
- limitations: superpowers「94% PR rejection 经验调出」的具体红旗清单未逐条取得;spec-first 的红旗须基于本项目实际失败模式经验派生,不照抄 superpowers 措辞

---

## Context & Research

**对标来源(see origin):** 行业对标档案 §6 superpowers——「每个 skill 含 Red Flags 表、Common Rationalizations 表、Iron Laws、HARD-GATE,专门防 LLM 合理化跳过流程纪律」,基于数百会话经验调优。§12 把它列为 **P1 最低成本高收益**借鉴项。

**优先级口径:** 行业对标档案把 anti-rationalization 归为 P1 借鉴候选,理由是低成本且与 CLAUDE.md 现有红旗雏形契合;项目 Review roadmap 把它放在 M3/P2「可治理外显」mechanism,并把短期 P0/P1 留给可见性、采纳和 release 表达。本 plan 因成本低、边界清晰而可提前执行,但完成后只代表一个执行/验证切片落地,不代表主线 P0/P1 整改完成。

**spec-first 现状:** `CLAUDE.md` workflow 入口治理 managed block 已有「反合理化红旗(出现这些念头即停):「先改个文件就好」→…「该评审但我口头答就行」→…」——但只覆盖**入口路由**层面,且只在 CLAUDE.md(会话启动注入),没有下沉到 work/debug/review **执行时**的偷懒模式。

**边界判断(角色契约 §7「借鉴对标项目时是否同时引入它牺牲的边界」):** superpowers 的 anti-rationalization 表是**纯 prose 纪律,无程序化强制**——这恰好与 spec-first 的 light-contract 哲学同源,**不引入任何被牺牲的边界**(它没有把语义判断脚本化、没有状态机)。这是一次干净借鉴。唯一要守的反模式:不得把红旗表升级为硬 gate 或 mandatory checklist——它是 attention 提醒,LLM 仍做最终判断。

---

## Goals / Non-Goals

**Goals:**
- 在 spec-work / spec-debug / spec-code-review 的 SKILL.md 各加一张 workflow-specific 的 anti-rationalization 表(红旗念头 → 正确动作)。
- 建立可复用的表格式与措辞约定,使红旗基于 spec-first 实际失败模式(fake completion、跳验证、跳复现、跳对抗复核),而非照抄 superpowers。
- 加最小漂移守护测试,断言三个 SKILL.md 含该 section(防后续编辑悄悄删除)。
- 在完成声明中标注 partial resolved:本轮只覆盖 work/debug/code-review 三个执行·验证 workflow,不覆盖 spec/plan/doc-review。

**Non-Goals:**
- 不做程序化 enforcement / gate / 状态机(保持 light contract)。
- 不改 CLAUDE.md 现有入口红旗块(那是入口层,本 plan 是执行层;二者互补不重复)。
- 不覆盖全部 workflow(ideate/brainstorm/plan/doc-review/optimize 等本轮不做,按 80/20 先做执行·验证三件最受偷懒之害的)。
- 不引入 superpowers 的 Iron Laws / HARD-GATE 措辞(那偏强制,与本项目哲学张力大)。
- 不把 section 存在性测试包装成行为有效性证明;它只能防 source prose 漂移,不能证明 future agent 必然少跳步。

---

## Requirements

| R-ID | 需求 | 来源 |
|------|------|------|
| R1 | work/debug/code-review 三个 SKILL.md 各含一张 anti-rationalization 表 | 对标档案 §12 P1 |
| R2 | 每张表的红旗是该 workflow 真实偷懒模式,配「停下来做什么」 | superpowers mechanism |
| R3 | 表是 best-effort prose,显式声明非 gate、不替代 LLM 判断 | 角色契约 §3 light contract |
| R4 | 有漂移守护测试断言 section 存在 | spec-first 既有 contract-drift 惯例 |
| R5 | 双宿主一致(同源 SKILL.md 投射,无 per-host 分支) | 角色契约 §6 |
| R6 | 闭环声明必须标注 partial resolved,避免把 execution/verification 切片说成全部 anti-rationalization 候选完成 | 06-15 review 优先级复核 |

---

## Implementation Units

### U1. 定义 anti-rationalization 表格式与措辞约定

**Goal:** 确立可复用的小约定:表头(红旗念头 | 正确动作)、放置位置(SKILL.md 靠近 workflow 主步骤处)、声明语(best-effort、非 gate),并**定死两个供 U5 断言的硬常量**。
**Requirements:** R2, R3
**Dependencies:** 无
**Files:**
- `docs/contracts/workflows/anti-rationalization-pattern.md`(新增,~35 行,定义模式 + 引用 superpowers origin + 声明 light-contract 边界 + 固定下方两常量)
**Hard constants(U2-U5 必须逐字遵守):**
- **C1 最少红旗条数:** 每张表 **≥3 条**红旗行(`spec-code-review` 受体积约束,取下限 3 条;work/debug 取 3-4 条)。U5 按此阈值断言。
- **C2 Canonical best-effort 声明(逐字文本):** 每张表正下方必须含这一句原文——
  > 这是注意力提醒,不是 gate,也不替代 LLM 判断;最终是否停下、如何处理仍由你按当前证据决定。

  三个 SKILL.md 逐字使用,U5 断言该 literal 子串存在(防被改写成 gate/mandatory 措辞)。
**Approach:** 轻量约定文档,不是 schema。说明:① 表格两列格式(`红旗念头 | 停下来做什么`);② 红旗须 workflow-specific 且经验派生(对齐 honest-closeout / reproduction / advisory≠confirmed 等既有 contract,而非照抄 superpowers);③ 必带 C2 声明原文;④ 满足 C1 条数;⑤ 不得引入 Iron Laws/HARD-GATE 强制措辞;⑥ 本约定只锁 section 形态与边界声明,不把具体红旗语义变成不可演化的硬裁决。供三个 SKILL.md 与未来 workflow 复用。
**Patterns to follow:** `docs/contracts/workflows/` 既有轻量 contract 文档(如 review-closure-traceability.md、honest-closeout.md)的体例。
**Test scenarios:** Test expectation: none -- 纯约定文档,无行为;由 U2-U4 的 section 存在性测试间接覆盖。
**Verification:** 文档存在,被三个 SKILL.md 引用。

### U2. spec-work 加 anti-rationalization 表

**Goal:** 在 spec-work SKILL.md 加 work-specific 红旗表。
**Requirements:** R1, R2, R3, R5
**Dependencies:** U1
**Files:**
- `skills/spec-work/SKILL.md`(加 section)
**Approach:** 红旗清单(**最终定稿,4 条,满足 C1**;经验派生,落在执行偷懒):
1. 「测试大概会过,先声明完成」→ 跑测试读真实输出再声明(对齐 honest-closeout / verification gate)
2. 「这处改动显然对,不用 preview」→ 先 preview-first
3. 「相邻代码顺手改了」→ 精准修改,只碰必须碰的
4. 「孤儿代码留着无所谓」→ 清理自己造成的孤儿

表正下方逐字附 C2 声明原文。
**Patterns to follow:** U1 约定(C1/C2);CLAUDE.md 现有红旗块的「念头→动作」句式。
**Test scenarios:**
- Covers R1/R4. spec-work SKILL.md 含 anti-rationalization section 标题与 ≥3 条红旗(实含 4 条)——由 U5 测试断言。
- 表正下方含 C2 声明 literal(R3)——U5 断言该子串存在。
**Verification:** SKILL.md 含该 section;`npm run lint:skill-entrypoints` 与既有 spec-work contract test 仍通过。

### U3. spec-debug 加 anti-rationalization 表

**Goal:** 在 spec-debug SKILL.md 加 debug-specific 红旗表。
**Requirements:** R1, R2, R3, R5
**Dependencies:** U1
**Files:**
- `skills/spec-debug/SKILL.md`(加 section)
**Approach:** 红旗清单(**最终定稿,3 条,满足 C1**):
1. 「我看出 bug 了,跳过复现」→ 先写复现再修(对齐 spec-debug 既有 root-cause-first / reproduction-before-fix 纪律)
2. 「root cause 很明显」→ 用证据支持 root cause,不靠直觉
3. 「修完了,手测一下就行」→ 留 confirmed evidence,不靠 freeform「tests passed」

表正下方逐字附 C2 声明原文。
**Patterns to follow:** U1 约定(C1/C2);spec-debug 既有 hypothesis ledger / reproduction 纪律。
**Test scenarios:**
- Covers R1/R4. spec-debug SKILL.md 含 section + ≥3 条红旗 + C2 声明 literal——U5 断言。
**Verification:** SKILL.md 含该 section;spec-debug 既有 contract test 通过。

### U4. spec-code-review 加 anti-rationalization 表

**Goal:** 在 spec-code-review SKILL.md 加 review-specific 红旗表。
**Requirements:** R1, R2, R3, R5
**Dependencies:** U1
**Files:**
- `skills/spec-code-review/SKILL.md`(加 section)
**Approach:** 红旗清单(**最终定稿,3 条 = C1 下限**;`spec-code-review` SKILL.md 已 1130 行、被历史审查点名偏大 P1-1,故严守下限不堆砌):
1. 「看着没问题,跳过对抗复核」→ 跑该跑的对抗 / 证伪立场
2. 「这条 finding 大概成立」→ 回源核对再定级(对齐 advisory≠confirmed)
3. 「口头说一下结论就行」→ 产结构化 finding + residual risk

表正下方逐字附 C2 声明原文。本 section 须**紧凑**(一张小表 + 一句声明,不堆砌)。
**Patterns to follow:** U1 约定(C1/C2);spec-code-review 既有 confidence gate / evidence boundary。
**Test scenarios:**
- Covers R1/R4. spec-code-review SKILL.md 含 section + 恰 3 条红旗 + C2 声明 literal——U5 断言。
**Verification:** SKILL.md 含该 section;体积增量 < ~25 行;spec-code-review 既有 contract test 通过。

### U5. 漂移守护测试

**Goal:** 断言三个 SKILL.md 含 anti-rationalization section 与 best-effort 声明,防后续编辑悄删。
**Requirements:** R4
**Dependencies:** U2, U3, U4
**Files:**
- `tests/unit/anti-rationalization-contracts.test.js`(**新增**,不并入 `contract-drift-guard.test.js`)
**落点取舍(为何新建而非并入 contract-drift-guard):** 本特性是独立可复用模式(U1 约定 + 三 skill 投射),单独文件让断言边界清晰、便于未来扩到更多 workflow;并入既有 drift-guard 会混淆「通用 section 漂移」与「本模式专属常量(C1/C2)」两类断言。新建文件复用其 source-read 风格,但不复用其文件。
**Approach:** 读三个 SKILL.md source,对每个断言:① 含 anti-rationalization section 标题;② 只截取该 section 到下一个同级或更高层级 heading 之间的内容,统计 Markdown 表格 **data rows**(排除 header/separator,不得扫描整份 SKILL.md 的其他 `|` 表格);③ 红旗行数满足 C1(work/debug ≥3、code-review 恰 3);④ 含 C2 声明 literal 子串(逐字)。测试只锁 section 存在、data-row 数量和非 gate 边界声明,不锁每条红旗的具体文案语义。经反向删除验证有效(删 section、删声明或删到低于 C1 应 fail)。
**Patterns to follow:** `tests/unit/contract-drift-guard.test.js`、`tests/unit/frontmatter-validator.test.js` 的 source-read 断言风格。
**Test scenarios:**
- 三个 SKILL.md 各含 section 标题 → pass;缺一个 → fail。
- 某 SKILL.md anti-rationalization section 的 data row 数 < C1 阈值 → fail。
- 测试不扫描整份 SKILL.md 里的其他 Markdown 表,避免被既有表格误计为红旗行。
- C2 声明 literal 缺失或被改写 → fail(防红旗表被误升级为 gate 措辞)。
**Verification:** `npx jest anti-rationalization-contracts` 绿;反向删除断言失败。

---

## System-Wide Impact

- **双宿主:** SKILL.md 是同源投射到 Claude(`spec-*`)与 Codex(`spec-*`),无 per-host 分支,改 source 后 `spec-first init` 重生成即双宿主一致。无需 per-host 验证差异(R5 自动满足),但 closeout 时应跑一次 init 确认投射正常。
- **runtime 边界:** 只改 source(skills/、docs/contracts/),不手改 `.claude/`、`.codex/`、`.agents/skills/`。
- **CHANGELOG:** 需新增条目(skill prose 变更,用户可见 workflow 行为)。
- **文档:** 不需改 README(内部 workflow prose,非用户入口变化)。
- **fresh-source eval:** 因修改 `skills/**/SKILL.md` prose,closeout 必须记录 fresh-source eval 状态:能派 fresh read-only reviewer 则 `passed|concerns`;Codex 未获 subagent/persona/delegation 授权时记录 `not_run` + `dispatch_authorization_missing`,不得声称通过。

---

## Risks & Anti-Patterns

| 风险 | 缓解 |
|------|------|
| 红旗表被后续编辑升级为硬 gate / mandatory checklist(违反 light contract) | U1 C2 固定声明原文 + U5 断言该 literal 存在 |
| 照抄 superpowers 措辞而非经验派生(红旗不贴 spec-first 实际失败模式) | U2-U4 红旗已定稿,落在 spec-first 已知失败模式(fake completion/跳复现/跳对抗),并对齐 honest-closeout/reproduction/advisory≠confirmed |
| spec-code-review SKILL.md 体积进一步膨胀(P1-1 已点名) | U4 限增量 < ~25 行,一张小表 |
| 与 CLAUDE.md 入口红旗重复 | 明确分层:CLAUDE.md=入口路由层,本 plan=执行层;措辞不重叠 |
| section 存在性测试被误读为行为有效性证明 | U5 只声明 source-drift guard;验证计划另列 fresh-source eval 状态,长期效果留给语义 eval/质量反馈 |

---

## 落地顺序

U1(约定)→ U2/U3/U4(三 skill,可并行)→ U5(测试)→ `spec-first init` 验投射 → CHANGELOG。

## 验证计划

- `npx jest anti-rationalization-contracts`(新)
- 三个 skill 既有 contract test
- `npm run lint:skill-entrypoints`
- `spec-first init`(确认双宿主投射)
- fresh-source eval status:
  - preferred: fresh read-only reviewer against `skills/spec-work/SKILL.md`、`skills/spec-debug/SKILL.md`、`skills/spec-code-review/SKILL.md` and `docs/contracts/workflows/anti-rationalization-pattern.md`
  - fallback: if Codex dispatch is unavailable/unauthorized, record `fresh_source_eval: not_run` with `reason_code=dispatch_authorization_missing`; unit tests/direct source reads remain valid deterministic checks but do not equal semantic eval pass

## 闭环

本 plan 以行业对标档案 + review 报告为 origin(frontmatter referenced_reviews)。完成后回链 origin,findings `BENCH-borrow-anti-rationalization` / `P1-anti-rationalization` 只可标注为 **PARTIAL RESOLVED(execution/verification workflows)**:work/debug/code-review 三个执行·验证 workflow 已覆盖;spec/plan/doc-review/ideate/brainstorm 等 surface 是否继续引入 anti-rationalization 表,留给后续计划基于真实失败模式和 80/20 成本再判断。

## Completion Evidence

- implementation_scope: 新增 `docs/contracts/workflows/anti-rationalization-pattern.md`,并在 `skills/spec-work/SKILL.md`、`skills/spec-debug/SKILL.md`、`skills/spec-code-review/SKILL.md` 加入 `## Anti-Rationalization Red Flags` 表与 C2 非 gate 声明;新增 `tests/unit/anti-rationalization-contracts.test.js` 做 section-scoped data-row 漂移守护。
- closure_status: `PARTIAL RESOLVED(execution/verification workflows)`;本轮仅覆盖 work/debug/code-review,不覆盖 spec/plan/doc-review/ideate/brainstorm。
- verification: `npx jest tests/unit/anti-rationalization-contracts.test.js tests/unit/workflow-eval-readiness-contracts.test.js tests/unit/scenario-capability-matrix-contracts.test.js tests/unit/changelog-format.test.js tests/unit/plan-status-taxonomy.test.js --runInBand` 通过;`npm run lint:skill-entrypoints` 通过;`spec-first init --claude --codex -y` 通过。
- fresh_source_eval: not_run;reason_code=`dispatch_authorization_missing`;本轮未获 Codex subagent/persona/delegation 授权,因此不声称语义 eval pass。
- generated_runtime: 未手改 generated mirrors;runtime 投射通过 `spec-first init --claude --codex -y` 生成验证,未留下 tracked generated-runtime diff。
- run_artifact: `.spec-first/workflows/spec-work/spec-first/anti-rationalization-tables-20260615-2236/run.json`;validation aggregate=`not-run`,因为 fresh-source eval 与 full default profile(typecheck/unit/smoke/integration)按聚焦验证范围诚实记录为 not-run。
