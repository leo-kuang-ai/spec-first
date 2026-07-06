---
spec_id: 2026-06-09-002-feat-cross-repo-investigation-discipline
status: completed
completion_status: superseded-by-eval
plan_depth: lightweight
type: feat
created: 2026-06-09
---

# feat: Cross-repo 需求影响分析的 agent 调查纪律

> **CLOSEOUT(2026-06-09,spec-work):未执行 U1/U2/U3,回退档1。** plan 的 Assumption A1 经 fresh-source eval **证伪**。
>
> **eval:** 在 `/tmp` 建真实多仓 fixture(3 个独立 git 仓,含一个 grep 命中不了的事件订阅型隐藏下游 `notification-service`),用两个**零纪律**的 fresh subagent 跑跨仓需求影响分析(优惠券结构改造 / 金额元→分)。两个样本**稳定一致**地:① 找到隐藏下游;② 区分 confirmed vs inferred;③ 显式声明盲区(其他订阅者、无 schema、stub 外字段);④ 自评完整性把握。
>
> **结论:** A1 假设"agent 默认不稳定标盲区"不成立——agent 默认就稳定做到了 U1 想固化的全部行为。按 plan A1 自带退出条件 + CLAUDE.md 抗膨胀线 + "可信证据优先于自动化便利",U1 是多余补丁,**不建**。最终落点 = 档1(零建造,现状即满足诉求)。这是一次 work 成功阻止过度工程,不是失败。
>
> **本仓无任何源码/prose 改动。** eval fixture 已清理。

> **Origin:** 本计划来自 2026-06-09 在 `spec-brainstorm` 内的对话式收敛(无独立 requirements 文档)。origin identity 未继承,使用 plan-local `spec_id`。WHAT 决策已沉淀于 memory `project_cross_repo_what_decision`。

---

## Problem Frame

用户在 workspace 根目录开 claude/codex,把需求文档贴进去问"这涉及链路上哪些应用要改造"。agent 今天就能用 direct-evidence(跨子目录 `rg` + 读文件 + 顺调用链推断)给出答案,但存在一个诚实性缺口:

**agent 默认可能甩出"涉及 A、B、C"式的清单,看起来像 confirmed 结论,实则混入了语义猜测,且不主动声明盲区**(如事件订阅类下游、跨语言绑定、需求里没点名的消费方)。用户照此清单改,漏掉的那个上线才炸——而清单的"伪完整感"比没有清单更危险。

这是 brainstorm 反复确认的真实诉求,且已排除所有重型方案:不建跨仓图谱(v1.6.0 已删 CRG)、不建 008 通用推断系统(Gate A 未通过)、不自变代码智能平台。最终固化物 = **一条 prompt 级 agent 调查纪律**,让"区分确认 vs 推断 + 声明盲区"从"靠用户每次提醒"变成"系统默认行为"(档2)。

---

## Direct Evidence

- target_repo: spec-first(本仓)
- source_refs: `skills/using-spec-first/SKILL.md` L241 `### Parent Workspace Direct Reads`;`docs/contracts/workflows/scenario-capability-matrix.md` L64;`docs/05-用户手册/20-研发场景与降级路径.md` L102;`src/cli/instruction-bootstrap.js` L155/187
- current_revision: branch `leo-2026-06-03-ceupdate`(工作树含既有改动)
- worktree_dirty: true(与本计划无关的既有改动)
- discovery_methods: `rg` 定位多仓 prose source-of-truth + 现有纪律 + 测试 pin;direct reads 确认候选落点
- tests_or_logs: 未运行(plan 阶段);相关测试已定位见 U2
- confidence: high(落点与"已存在的一半"均经 direct reads 确认)
- limitations: 未运行 fresh-source eval 验证 agent 当前行为是否真缺这条纪律(见 Assumptions A1,属档2固有风险)

---

## Context & Research

**这条纪律的一半已存在**,plan 必须补缺口、不重复:

| 已存在 | 位置 | 性质 |
|---|---|---|
| 多仓只读用 bounded direct reads + 声明 target-repo 假设 | `using-spec-first` L241 | routing-level,已覆盖"用什么证据" |
| "do not claim impact beyond direct evidence" | `scenario-capability-matrix.md` L64 | 通用 capability 纪律 |
| "不要把 advisory facts 写成 confirmed truth" | 降级路径文档 L102 反模式 | 通用原则 |
| 多仓写入需 explicit target_repo(只读用 bounded reads) | managed bootstrap block(`instruction-bootstrap.js`)| 最小常驻决策集 |

**缺口:** 上述都是通用/routing 级,**没有针对"跨仓需求/影响分析"这个具体动作**说清"输出时必须把 grep-confirmed 与 semantic-inferred 分开标、并显式列出无法仅靠 grep 确认的盲区类别"。本计划补的就是这一条具体纪律。

**加在哪(关键决策,已被证据锁定):** 扩 `using-spec-first` 的 `### Parent Workspace Direct Reads` 段。理由见 Key Decision D1。

---

## Goals

- 在 source-of-truth prose 中固化一条针对跨仓需求/影响分析的 agent 调查纪律:输出必须区分 **confirmed(grep/读文件证实)** vs **inferred(语义推断)**,并显式声明覆盖边界与盲区类别。
- 与已有的 capability-matrix / 降级路径纪律保持一致(引用而非重复)。
- 单次 source 编辑同时覆盖 Claude 与 Codex 双宿主(经 `spec-first init` 镜像)。

## Non-Goals

- 不新建跨仓索引/图谱/推断系统(heavy-C / 008 / CRG 复活)——已被 brainstorm 否决。
- 不新建 agent、不加 CLI 行为、不加 schema。
- 不把这条纪律塞进最小 managed bootstrap block(见 D1 拒绝理由)。
- 不修改 codegraph/graphify provider 边界。
- 不实现"自动从需求文本推断受影响仓"的能力(档2权威机版,违反可信证据原则)。

---

## Key Decision

**D1 — 纪律加在 `using-spec-first` Parent Workspace Direct Reads 段,而非 managed bootstrap block 或新 agent。**

- `question`: 跨仓调查纪律该落在哪个 prose 层?
- `recommended_answer`: 扩 `using-spec-first/SKILL.md` 的 `### Parent Workspace Direct Reads` 段
- `source_tag`: confirmed(direct reads 锁定)
- `chosen_answer`: 同 recommended
- `consequence`: 纪律落在多仓只读路径实际执行处,与 L241 已有的 bounded-reads 指引连续;managed block 保持最小(只留 routing 级一行指针);不引入新资产
- 拒绝 managed block:它是常驻最小决策集,塞 how-to-conduct-analysis 细节会膨胀always-on 上下文,违反其设计("只提供启动提醒和入口锚点")
- 拒绝新 agent:brainstorm 明确 prompt-level 非 system-level,新 agent 是过度工程

---

## Implementation Units

### U1. 在 using-spec-first 固化跨仓调查纪律

**Goal:** 扩 `### Parent Workspace Direct Reads` 段,补入"区分 confirmed vs inferred + 声明盲区"的具体纪律。

**Dependencies:** 无

**Files:**
- `skills/using-spec-first/SKILL.md`(修改 `### Parent Workspace Direct Reads` 段)

**Approach:**
- 在现有"用 bounded direct reads + 声明 target-repo 假设"之后,追加针对跨仓需求/影响分析的纪律:输出受影响仓清单时,必须显式区分 **grep/读文件确认的** 与 **语义推断的**,并声明无法仅靠 direct reads 确认的盲区类别(事件订阅/消息契约类下游、跨语言绑定、生成代码、需求未点名的消费方),提示用户对盲区做 direct reads 或问负责人。
- 引用已有纪律保持一致:与 `scenario-capability-matrix.md` "do not claim impact beyond direct evidence" 及降级路径文档"不把 advisory 写成 confirmed truth"对齐,不重复其措辞。
- 中文为主、术语保留原文,匹配该文件现有 prose 风格与密度。

**Patterns to follow:** 同文件 L241 现有段落的句式与 advisory 口径;降级路径文档反模式条目的"区分 advisory vs confirmed"措辞。

**Test scenarios:**
- Covers WHAT. 新增 prose 包含"confirmed vs inferred"区分语义与"盲区/blind spot/声明边界"语义关键词(具体断言措辞在 U2 与现有测试约定对齐)。
- 新增 prose 未引入"自动推断受影响仓""权威清单"等违反 Non-Goals 的承诺性措辞。

**Verification:** `### Parent Workspace Direct Reads` 段同时保留原有 bounded-reads 指引并新增 confirmed/inferred + 盲区纪律,读起来与既有 advisory 口径连续。

### U2. 更新/补充 prose 契约测试

**Goal:** 让 pin 该 prose 的测试覆盖新纪律,防回归。

**Dependencies:** U1

**Files:**
- `tests/unit/using-spec-first-multi-session-prose.test.js`(优先核对是否已断言该段;按需补断言)
- 如断言落在别处:`tests/unit/workflow-invocation-boundary.test.js` / `tests/unit/lint-skill-entrypoints.test.js`(仅在确认相关时)

**Approach:**
- 先读 `using-spec-first-multi-session-prose.test.js` 确认它是否已对 Parent Workspace 段做断言;若有,补一条断言覆盖 confirmed/inferred + 盲区关键词;若无相关断言,在最贴近的现有 prose 测试中新增最小断言。
- 断言用稳定语义关键词,避免 brittle 全句匹配。

**Test scenarios:**
- 新断言在 U1 prose 存在时通过、删除该纪律时失败(真正 pin 住)。
- 现有断言不被破坏。

**Verification:** `npm run test:unit`(或最窄的相关 Jest 文件)通过。

### U3. 同步 CHANGELOG 与多仓文档

**Goal:** 按仓库规范记录 user-visible prose 变更,并让用户手册多仓说明与新纪律一致。

**Dependencies:** U1

**Files:**
- `CHANGELOG.md`(追加条目,作者读 `~/.spec-first/.developer`,标 `(user-visible)`)
- `docs/05-用户手册/20-研发场景与降级路径.md` 或 `08-三种开发模式.md`(评估是否加一句指向新纪律,仅在确实提升可读性时)

**Approach:**
- CHANGELOG 必加(source prose 变更 + user-visible)。
- 用户手册:多仓模式/降级路径文档若加一句"跨仓影响分析时 agent 会区分确认 vs 推断并声明盲区"能提升用户预期管理,则加;否则记为 follow-up,不强加(避免膨胀)。

**Test scenarios:** Test expectation: none — 文档/CHANGELOG 变更,无行为。

**Verification:** CHANGELOG 条目符合现行格式;若改用户手册,相关 user-manual 契约测试(如存在)通过。

---

## Verification Strategy

- 主验证:`npm run test:unit`(覆盖 prose 契约测试)。
- 双宿主验证:`spec-first init` 后确认 `using-spec-first` 新 prose 正确镜像到 `.claude/` 与 `.agents/skills/`(source→runtime,不手改 runtime)。
- 可选 fresh-source eval(若要验证 agent 实际是否遵循新纪律):按 `docs/contracts/workflows/fresh-source-eval-checklist.md`,把修改后的 `using-spec-first` 段注入全新 subagent,喂一个含隐藏下游消费方的跨仓需求,看它是否区分 confirmed/inferred 并标盲区。未执行时记录原因(档2固有验证边界)。

---

## Assumptions

- **A1(档2固有风险):** 假设 agent 默认**不**稳定主动声明盲区,故这条纪律有价值。若 fresh-source eval 证明 agent 本来就会老实标盲区,则 U1 可能是多余补丁——此时应缩减为更小的 reinforcement 或回退到档1。`source_tag: advisory`,建议执行时先做一次 eval 再决定 prose 力度。
- **A2:** `using-spec-first` 经 `spec-first init` 镜像到双宿主,单次 source 编辑即覆盖 Claude+Codex,无需分别改 runtime。

---

## Scope Boundaries

**In scope:** 一条 prompt 级跨仓调查纪律的 prose 固化 + 测试 + CHANGELOG/docs 同步。

**Outside this product's identity:**
- 任何跨仓索引/图谱/推断 runtime(CRG、008、合并图、公司级知识库)——spec-first 是轻量 harness,这些活该外部 provider 干。
- "需求文本→权威受影响仓清单"自动化——违反可信证据原则。

### Deferred to Follow-Up Work

- 若 A1 的 eval 显示需要更强约束,可评估是否在 work/review agent prompt 中也加一条对应纪律(本计划先只动 using-spec-first 单点)。
