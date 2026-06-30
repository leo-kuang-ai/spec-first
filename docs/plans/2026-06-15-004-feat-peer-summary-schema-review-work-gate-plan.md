---
title: "feat: peer-session-summary 结构化输出 schema + review→work handoff gate（评估/决策 plan）"
type: feat
status: completed  # 作为「决策/评估 plan」：评估与收口已完成；结论是不开发，非 build 交付
date: 2026-06-15
spec_id: 2026-06-15-004-peer-summary-schema-review-work-gate
---

# feat: peer-session-summary 结构化输出 schema + review→work handoff gate

> **本 plan 已完成为「决策/评估 plan」，不是直接 build plan。** 经 `/spec:doc-review`（5 reviewer 多视角 + 对抗）与痛点证据门检索后，结论已收口为当前不开发，对齐同日 plan 002 立的证据纪律。下方 Implementation Units 保留为「若重启会怎么建」的设计存档，**当前不进入开发，也不作为 active backlog**。

> **完成结论：COMPLETED DECISION（not planned，2026-06-30 收口；原评估 2026-06-15）。** 痛点证据门未达标：`docs/solutions/` + `docs/12-bug分析/` 对「review findings 跨轮/跨会话丢失」与「peer 历史不可结构化消费」两类痛点 **0 条 confirmed 失败记录**（≥3 阈值未达）；唯一邻近记录 `reviewer-dispatch-failure-2026-05-07.md` 反向证明「findings 没丢，只降级了交叉验证」；且 `docs/solutions/architecture-patterns/ai-reviewer-capability-borrowing-gates-2026-06-09.md` **已显式拒绝**为本地单会话 CLI 借鉴「增量复审/carry findings forward」，判定该痛点未被证实。按角色契约 §10（能力↔采纳平衡、证据门优先）与 plan 002 先例，**P1-3、P0-2 均不开发 / 不进入当前 backlog**，非永久否决。**重启条件：** 累计 ≥3 条 confirmed 失败记录落 `docs/solutions/` 或 `docs/12-bug分析/`（标 `review-finding-lost` / `peer-context-drift` 关键词），证明跨会话 finding 丢失或 peer 历史重读是真实高频痛点；届时重启评估，并先修下方 doc-review 暴露的 5 处设计硬伤。

> **doc-review 暴露、重启前必须先修的硬伤（存档）：** ① schema 混入 live-session 字段（`last_heartbeat_at`、`status: active|closed`）泄漏被排除的 P0-1 语义，需删；② P1-3 无接线消费者、两交付物互不喂养（P0-2 不消费 `peer-session-summary.open_findings`）；③ P0-2 确定性牙齿够不到其 motivating 的跨会话痛点；④ `verification_status: pass|fail` 把 historian 的*综述推断*伪装成 confirmed 执行事实；⑤ U3 动 `spec-work/SKILL.md` 前，plan-001 改动必须先 commit。

## Summary

> ⚠️ 以下为已完成决策后的设计存档，描述「若重启会建什么」，非当前交付承诺。

把多轮讨论收敛出的「Loop Context 进化」前两项落地：(1) 给 `spec-sessions` 历史综述加一个**命名的结构化 output_schema**（`peer-session-summary.v1`），让 `spec-work`/`spec-debug`/`spec-compound` 在同一会话内确定性消费 peer 历史，而不是每次解析散文；(2) 把 review→work 这条边锚定为角色契约 §4 第 4 类 **handoff gate**——`spec-work` 启动 preflight 必须对可发现的 review findings 显式表态。

**为何完成为不开发（结论先行）：** 两项的核心论证都依赖「跨会话/跨轮 finding 丢失」这一痛点，而该痛点在本仓库 institutional history 中 0 confirmed 记录，且有一条邻近能力的显式拒绝在先。能力本身廉价、契约对齐，但按项目自己的证据门（plan 002 / §10），证据不足时正确动作是把评估完成为 not planned，并保留带重启条件的设计存档，而不是先建地基。

---

## Decision Brief

- **Recommended approach:** P1-3 用 `spec-sessions` 已有的 `output_schema` 透传机制承载一个命名 schema（return-shape，同会话内消费，不落盘）；P0-2 在 `spec-work` preflight 加一个 review→work handoff gate，以**响亮约定 + 窄确定性辅助**形态落地（不假装硬强制）。
- **Key decisions:** ① peer 输出是 return-shape 不是 durable artifact（用户已确认）；② P0-2 gate 诚实降级为 loud convention，因为 review 产物默认在 OS temp、session-scoped，脚本无法跨会话可靠扫描；③ 两项复用既有契约（`review-finding.v1`、`spec-first-session.v1`、`spec-sessions` output_schema），不新增 producer/freshness/consumer 协议。
- **Validation focus:** 既有 contract test（`spec-sessions-contracts.test.js`、`spec-work-contracts.test.js`）扩展；新增 `peer-session-summary` 契约文档的 shape 校验；双宿主 fresh-source eval 确认 prose 行为；CHANGELOG 同步。
- **Largest risks / boundaries:** `spec-work/SKILL.md`、`spec-code-review/SKILL.md`、`spec-debug/SKILL.md` **当前已被在途工作（今日 001 anti-rationalization plan）修改**，P0-2 必须在那批改动之上做最小增量、避免冲突；P0-1（per-turn / 活跃 peer 注入）是明确 non-goal。

---

## Problem Frame

`spec-sessions` 已能跨 Claude/Codex 读历史会话并产出综述，但综述是**散文**——下游 workflow 无法确定性消费，只能让 LLM 再读一遍。同时 `spec-code-review` 已产出结构化 `review-finding.v1` + `artifact-summary.v1` handoff，但**没有任何机制**强制下一轮 `spec-work` 去消费这些 findings，findings 靠人记得或 Agent 自觉传递，并发多开时尤其容易跨线丢失。

本计划解决这两个具体缺口，且严格限定在角色契约 §7（不重建宿主 primitive）与 §10（80/20）边界内：只接已有的线、加最小契约，不做实时观测层、不做活跃 peer 注入。

> 本计划无 upstream brainstorm requirements 文档；需求来自本仓库多轮架构讨论收敛，已足够清晰直接规划。`spec_id` 为 plan-local 生成。

---

## Requirements

> **优先级标签说明：** `P1-3`、`P0-2` 是本计划上游架构讨论中的条目编号（沿用以保持讨论连续性），不来自 brainstorm requirements 文档。映射固定：`P1-3` = peer-session-summary 结构化输出 schema（地基，排第 1 位先做）；`P0-2` = review→work handoff gate（接线，第 2 位）。两者无 brainstorm R-ID 关系，下文一律以 U1–U4 为实现锚点。

- R1. 定义一个命名的结构化 peer 历史输出 schema `peer-session-summary.v1`，字段含 `schema_version`(const `spec-first.peer-session-summary.v1`)、`session_id`、`agent_kind`、`scope_hint`、`last_heartbeat_at`、`status`(active|closed)、`touched_files`、`open_findings`、`verification_status`。
- R2. `spec-sessions` 能以该 schema 作为可选 `output_schema` 透传给 `spec-session-historian`，并在 Downstream Consumers 标明 work/debug/compound 可消费。
- R3. peer 输出为 **return-shape**（同会话内消费），不落盘、不引入 producer/freshness/consumer 跨会话契约——保持 historian「只返回文本、不写文件」既有边界。
- R4. `spec-work` preflight 新增 review→work handoff gate：对**可发现的** review findings（plan frontmatter `referenced_reviews`、durable residual 文档、同会话传入的 `artifact-summary.v1`/`review-finding.v1`）逐条要求 LLM 显式表态：已处理 / 本轮处理 / 明确跳过（给理由）。
- R5. gate 必须**诚实标注强制度**：review 产物默认 session-scoped/OS-temp，脚本不能跨会话可靠扫描；无可发现产物时 gate 降级为 loud convention（LLM 必须声明「已检查、未发现可发现的上游 review findings」，不得静默跳过）。
- R6. script-owned 与 LLM-owned 边界清晰：脚本只做存在性/freshness/是否已消费的确定性检测；finding 成不成立、要不要处理由 LLM 判断。
- R7. 所有 source 变更同步 `CHANGELOG.md`；schema/contract 变更带 downstream consumer 测试；双宿主（Claude + Codex）prose 行为一致。

---

## Scope Boundaries

- **不做 P0-1（per-turn / 活跃 peer 注入 / SessionStart 注入 handoff 摘要）。** 理由：依赖 P1-3 才有米下锅；增量价值被 worktree 隔离、resume、已有 `spec-first-session.v1` 并发检测三方夹击；活跃 peer 实时感知需 per-turn hook，触及角色契约 §7 宿主商品化边界。本计划完成后若真实痛点反复出现再单独评估。
- 不新建用户可调用 workflow 入口；不暴露 internal helper。
- 不新建文件监听 daemon、build watch、observation 后台进程。
- 不改 `spec-code-review` reviewer JSON schema（`skills/spec-code-review/references/findings-schema.json` 保持权威）。
- 不改 `spec-first-session.v1` live advisory schema（那是「活跃会话感知」，与本计划的「历史综述输出形状」是两个概念）。
- 不手改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime mirror。

### Deferred to Follow-Up Work

- P0-1 开局 peer 注入：独立评估，不在本 spec 链。
- build/test 状态作为 advisory fact 注入 work/debug（原 P1-4）：独立计划。

---

## Decision Completion Criteria

本计划的 `status: completed` 表示「评估/决策已完成」，不是实现交付完成。完成依据：

- 痛点证据门已完成检索：`docs/solutions/` + `docs/12-bug分析/` 对 `review-finding-lost` / `peer-context-drift` 相关 confirmed 失败记录为 0，未达到 ≥3 条重启阈值。
- `/spec:doc-review` 已暴露重启前必须先修的 5 处设计硬伤，并在本文顶部存档。
- 最终结论已明确：`peer-session-summary.v1` 与 `review→work handoff gate` 当前不开发、不进入 active backlog；Implementation Units 仅保留为 future restart design archive。
- 重启条件已明确：未来累计 ≥3 条 confirmed 失败记录后重新评估，并先修本文记录的设计硬伤。
- `CHANGELOG.md` 已记录本次决策收口。

若未来重启并实际 build，必须新开或重开实施计划；不得把本文的 `status: completed` 解读为 `peer-session-summary.md`、`spec-work` handoff gate、测试或 runtime mirror 已交付。

---

## Direct Evidence Readiness

- target_repo: spec-first（当前仓库根 `/Users/kuang/xiaobu/spec-first`，单仓）
- evidence_sources: direct source reads, rg, git status
- source_refs: 见下方 Direct Evidence
- current_revision: `1c94293e`
- worktree_status: dirty（见下，含在途 anti-rationalization 工作）
- confidence: high（契约与 skill 现状均已直接读取确认）
- limitations: 未运行测试（规划阶段不执行）；未读 `spec-debug`/`spec-compound` 全文，仅确认其作为 Downstream Consumers 的引用点

---

## Direct Evidence

- repo_scope: 单仓 spec-first
- source_reads_completed:
  - `docs/contracts/workflows/review-finding.md`（确认 `review-finding.v1` envelope 与 consumption 规则，是 P0-2 可发现 finding 的结构来源）
  - `docs/contracts/sessions/spec-first-session.md`（确认 live advisory schema 与本计划「历史综述」是两个概念，避免混淆）
  - `skills/spec-sessions/SKILL.md`（确认已有 `output_schema` 透传机制：默认 schema + caller schema verbatim 透传；historian 只返回文本）
  - `agents/spec-session-historian.agent.md`（确认 `output_schema` optional、honor verbatim、**never write files**——决定 P1-3 必须是 return-shape）
  - `skills/spec-work/SKILL.md`（确认 preflight/Summary-First Handoff 段落是 gate 落点；已有 `artifact-summary.v1` 消费约定）
  - `skills/spec-code-review/SKILL.md`（确认产出 `review-finding.v1`、artifact 在 OS temp/session-scoped，durable 仅在显式 route 时——这是 P0-2 降级为 loud convention 的根因）
- source_reads_required（实现时）:
  - `skills/spec-debug/SKILL.md`、`skills/spec-compound/SKILL.md`（确认 Downstream Consumers 段落措辞）
  - `tests/unit/spec-sessions-contracts.test.js`、`tests/unit/spec-work-contracts.test.js`（确认断言扩展点）
  - `docs/contracts/workflows/review-closure-traceability.md`（确认 `referenced_reviews` 字段，P0-2 窄确定性辅助的输入）
- commands_or_tools_used: `git status --short`、`git rev-parse`、`rg`/`grep`、`ls docs/contracts/**`
- impact_on_plan: 证据把 P1-3 锁定为「return-shape + 透传既有机制」，把 P0-2 锁定为「loud-convention gate + 窄确定性辅助」，两项都不需新建重契约
- key_findings:
  - `spec-sessions` 的 `output_schema` 机制**已存在**，P1-3 = 定义命名 schema + 选用它，不是造机制
  - historian **契约性地不写文件** → peer 输出只能是 return-shape（与用户选择一致）
  - review artifact 默认 session-scoped/OS-temp → P0-2 不能假装硬 gate
  - `spec-work/SKILL.md`、`spec-code-review/SKILL.md`、`spec-debug/SKILL.md` **已被今日在途工作修改**（git status 显示 M）→ 真实冲突风险
- limitations: 在途修改内容未逐行比对，实现前需 rebase/读 diff 确认 gate 落点未被改动覆盖

---

## Context & Research

### Relevant Code and Patterns

- `spec-sessions` output_schema 透传：`skills/spec-sessions/SKILL.md` Step 6（默认 schema + caller verbatim）——P1-3 直接复用此机制。
- `review-finding.v1` envelope：`docs/contracts/workflows/review-finding.md`——P0-2 可发现 finding 的字段来源。
- `referenced_reviews` 弱追踪：`docs/contracts/workflows/review-closure-traceability.md`——P0-2 窄确定性辅助的输入。
- Summary-First Handoff 段落：`skills/spec-work/SKILL.md`（已消费 `artifact-summary.v1`）——P0-2 gate 自然挂载点。
- 契约文档风格：`docs/contracts/workflows/*.md`（中文、目标/非目标/字段/consumption 规则/与角色契约对齐）——新契约文档 mirror 此结构。

### Institutional Learnings

- `docs/solutions/`：实现前由 `spec-learnings-researcher` 检索 session/handoff/gate 相关既有学习（规划阶段未强制展开）。

### External References

- 无。纯内部契约/workflow 设计，本地模式充分，跳过外部研究。

---

## Key Technical Decisions

- **peer 输出为 return-shape，不落盘**（用户确认）：复用 historian「只返回文本」边界，零新增持久化契约；代价是不跨会话复用，但这正是 P0-1 的范畴，本计划明确不做。
- **`peer-session-summary.v1` 作为 output_schema 而非新 producer artifact**：它是「综述的结构化盛放形状」，不是一个有 freshness/authority 的 confirmed artifact；下游消费时按 advisory 对待。
- **P0-2 是 loud-convention gate，不是硬 gate**：诚实反映角色契约 §4——handoff gate 在缺 runtime 强制时降级为响亮约定。窄确定性辅助仅在 plan `referenced_reviews` 或 durable residual 文档存在时触发，其余靠 LLM 显式表态。
- **gate 措辞强调「表态」不强制「处理」**：script 只卡「必须对每条可发现 finding 表态」，不替 LLM 判断该不该处理（§4 七类轻判断之一）。

---

## Open Questions

### Resolved During Planning

- 下游怎么消费 peer 输出？→ return-shape，同会话内消费（用户确认）。
- peer 输出要不要落盘？→ 不落盘（保持 historian 边界 + 避开 P0-1 territory）。
- P0-2 能不能脚本硬强制？→ 不能，review 产物 session-scoped，降级为 loud convention + 窄确定性辅助。

### Deferred to Implementation

- `peer-session-summary.v1` 各字段的精确 JSON 类型/必填性：实现时对照 `review-finding.v1` 与 `spec-first-session.v1` 既有写法定稿。
- gate 段落在 `spec-work/SKILL.md` 的精确插入位置：取决于在途 anti-rationalization 改动落定后的 preflight 结构，rebase 后确认。
- contract test 的断言粒度：实现时按既有 `spec-sessions-contracts.test.js`/`spec-work-contracts.test.js` 风格定。

---

## Implementation Units

### U1. 定义 peer-session-summary.v1 契约文档

**Goal:** 新增命名结构化输出契约，作为 P1-3 的 source-of-truth schema。

**Requirements:** R1, R3, R6

**Dependencies:** None

**Files:**
- Create: `docs/contracts/workflows/peer-session-summary.md`
- Test: `tests/unit/peer-session-summary-contract.test.js`

**Approach:**
- mirror `docs/contracts/workflows/review-finding.md` 的中文结构：目标 / 非目标 / schema / consumption 规则 / 与角色契约对齐。
- schema 字段：`schema_version`(const `spec-first.peer-session-summary.v1`)、`session_id`、`agent_kind`(claude-code|codex|other)、`scope_hint`、`last_heartbeat_at`、`status`(active|closed)、`touched_files`(array)、`open_findings`(array of compact finding refs)、`verification_status`(pass|fail|not-run|unknown)。
- 明确非目标：不是 durable artifact、不是 producer/consumer 契约、不替代 `spec-first-session.v1` live schema、不授权编造 session 事实。
- 明确 consumption：return-shape，advisory，下游同会话内读取；`open_findings` 与 `review-finding.v1` 字段可对齐但不强绑。

**Patterns to follow:**
- `docs/contracts/workflows/review-finding.md`（结构与「与角色契约对齐」段）
- `docs/contracts/sessions/spec-first-session.md`（字段表写法、advisory 边界声明）

**Test scenarios:**
- Happy path: 契约文档存在且含 `spec-first.peer-session-summary.v1` 版本串、全部 R1 字段名、status/verification_status 枚举值。
- Edge case: 文档显式声明「非 durable artifact / 非 producer 契约」措辞存在（防止后续被误用为落盘 artifact）。
- Edge case: 文档声明与 `spec-first-session.v1` 的区分（防两个 session 概念混淆）。

**Verification:**
- `tests/unit/peer-session-summary-contract.test.js` 通过；契约文档可被 U2 引用。

---

### U2. spec-sessions 选用 peer-session-summary 作为可选 output_schema + 下游标注

**Goal:** 让 `spec-sessions` 能以 `peer-session-summary.v1` 结构返回，并在 Downstream Consumers 标明 work/debug/compound 消费。

**Requirements:** R1, R2, R3, R7

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-sessions/SKILL.md`
- Modify: `agents/spec-session-historian.agent.md`
- Modify: `CHANGELOG.md`
- Test: `tests/unit/spec-sessions-contracts.test.js`（扩展）

**Approach:**
- 在 `spec-sessions` SKILL 的 output_schema 段落补充：当 caller（如 `spec-work`）需要结构化 peer 输出时，可选用 `peer-session-summary.v1`（指向 U1 契约），透传给 historian verbatim（机制已存在，无需改透传逻辑）。
- 在 historian agent prose 补一句：当 `output_schema` 为 `peer-session-summary.v1` 时按字段返回，仍**只返回文本、不写文件**（强调 return-shape 不破坏既有边界）。
- 在两处 Downstream Consumers 标注 `spec-work`/`spec-debug`/`spec-compound` 可消费该结构。
- CHANGELOG 追加条目（developer profile 取 `~/.spec-first/.developer`，取不到回退 git 身份）。

**Patterns to follow:**
- `skills/spec-sessions/SKILL.md` 现有 output_schema 透传写法（默认 schema + caller verbatim）
- 既有 SKILL「Downstream Consumers」段格式

**Test scenarios:**
- Happy path: `spec-sessions` SKILL 引用 `peer-session-summary` 契约路径；Downstream Consumers 含 work/debug/compound。
- Edge case: historian agent 仍保留「never write files」措辞（return-shape 未破坏边界）。
- Edge case: CHANGELOG 含本次条目（仓库 gate：缺 changelog 拒绝 source 变更）。

**Verification:**
- `tests/unit/spec-sessions-contracts.test.js` 扩展断言通过；fresh-source eval 确认 historian 在 `peer-session-summary.v1` 下返回结构化文本且不写盘。

---

### U3. spec-work 新增 review→work handoff gate（loud convention + 窄确定性辅助）

**Goal:** `spec-work` preflight 对可发现的 review findings 强制 LLM 显式表态，锚定角色契约 §4 第 4 类 handoff gate 的 review→work 边。

**Requirements:** R4, R5, R6, R7

**Dependencies:** None（独立可做；建议在 U1/U2 之后落，避免一次改动面过大，但无硬依赖）

**Files:**
- Modify: `skills/spec-work/SKILL.md`
- Modify: `CHANGELOG.md`
- Test: `tests/unit/spec-work-contracts.test.js`（扩展）

**Approach:**
- 在 `spec-work` preflight / Summary-First Handoff 邻近位置新增一段 review→work handoff gate：
  - **确定性辅助（script-owned）**：若 plan frontmatter 含 `referenced_reviews`（见 `review-closure-traceability.md`）、或存在 durable residual review 文档、或同会话传入了 `artifact-summary.v1`/`review-finding.v1`，把这些列为「可发现的待表态 findings」。
  - **LLM-owned**：对每条可发现 finding 显式表态——已处理 / 本轮处理 / 明确跳过（给理由）；不得静默忽略。
  - **降级声明（R5）**：当无可发现产物时，gate 不静默通过——LLM 必须声明「已检查、未发现可发现的上游 review findings」。明确标注本 gate 强制度为 loud convention（review 产物默认 session-scoped/OS-temp，脚本无法跨会话可靠扫描），不假装硬强制。
- 措辞强调 gate 卡「必须表态」而非「必须处理」。
- CHANGELOG 追加条目，标 `(user-visible)`（改变 work 启动时的可见行为）。
- **冲突防护**：`spec-work/SKILL.md` 当前被在途工作修改，实现前先读最新 diff，把 gate 段落插入到不与 anti-rationalization 改动冲突的位置。

**Patterns to follow:**
- `skills/spec-work/SKILL.md` 现有 Summary-First Handoff 与 preflight 段落写法
- 角色契约 §4 五类硬 gate / 七类轻判断的措辞（「响亮约定」「不得静默放行」）

**Test scenarios:**
- Happy path: `spec-work` SKILL 含 review→work handoff gate 段落，且含「显式表态：已处理/本轮处理/明确跳过」三态措辞。
- Edge case: 段落含「无可发现 findings 时必须声明已检查」的 loud-convention 降级措辞（R5）。
- Edge case: 段落区分 script-owned 检测与 LLM-owned 判断（R6），不把「该不该处理」脚本化。
- Edge case: CHANGELOG 含本次条目并标 `(user-visible)`。

**Verification:**
- `tests/unit/spec-work-contracts.test.js` 扩展断言通过；fresh-source eval 确认 work 启动时会对注入的 review findings 逐条表态、对空集声明已检查。

---

### U4. 双宿主 runtime 一致性与全量验证

**Goal:** 确认 source 变更经 `spec-first init` 重生成后 Claude/Codex runtime 无 drift，且主测试链路绿。

**Requirements:** R7

**Dependencies:** U1, U2, U3

**Files:**
- 无新增 source（验证 + 必要时修生成逻辑）
- 可能 Modify: 若发现 runtime 生成遗漏，回到对应 source/generator（不手改 mirror）

**Approach:**
- `spec-first init` 重新生成 runtime，确认 `.claude/`、`.codex/`、`.agents/skills/` 反映新 prose（drift 来源应是 source 或 generator，不手改 mirror）。
- 运行 `npm run test:unit`（含扩展的 contract tests）、`npm run test:smoke`、`npm run lint:skill-entrypoints`。
- `spec-first doctor --claude` / `--codex` 确认 runtime 状态。

**Patterns to follow:**
- CLAUDE.md「常用命令」与「Source 与 Runtime」段；角色契约 §6 冲突处理顺序。

**Test scenarios:**
- Test expectation: none -- 本单元是验证/集成确认，无新行为代码；新行为的断言归 U1/U2/U3 的 contract tests。

**Verification:**
- `npm test` 主链路绿；`spec-first doctor` 双宿主无 drift 报警；fresh-source eval（U2/U3）已记录执行或未执行原因。

---

## System-Wide Impact

- **Interaction graph:** `spec-sessions`(+historian) 输出形状变化影响 `spec-work`/`spec-debug`/`spec-compound` 的消费；`spec-work` preflight gate 影响所有 work 启动路径。
- **Error propagation:** peer 输出为 advisory return-shape，消费方须按线索对待（非 confirmed）；gate 无可发现 findings 时降级为声明，不阻断 work。
- **State lifecycle risks:** 无持久化新增（return-shape）；不引入跨会话状态。
- **API surface parity:** 双宿主——Claude 与 Codex 的 SKILL/agent prose 须经 `spec-first init` 同步；contract 文档宿主中立。
- **Surface coverage:** skills(`spec-sessions`,`spec-work`) -> in-scope；agents(`spec-session-historian`) -> in-scope；contracts -> in-scope；`spec-debug`/`spec-compound` -> in-scope（仅 Downstream Consumers 措辞）；`spec-code-review` reviewer schema -> out-of-scope: 不改；live `spec-first-session.v1` -> out-of-scope: 不同概念。
- **Integration coverage:** fresh-source eval 验证 prose 语义（historian 结构化返回不写盘、work 对 findings 逐条表态），单测覆盖契约 shape。
- **Unchanged invariants:** `spec-code-review` reviewer JSON schema、`spec-first-session.v1` live schema、historian「never write files」边界、generated runtime 不手改原则——均不变。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `spec-work/SKILL.md`、`spec-code-review/SKILL.md`、`spec-debug/SKILL.md` 已被今日在途 anti-rationalization 工作修改，直接编辑可能冲突 | U3 实现前先读最新 diff/rebase；gate 段落插入到不冲突位置；P0-2 与在途工作可串行而非并行落 |
| P0-2 被误解为硬 gate，给用户「已强制」错觉 | 契约与 prose 显式标注 loud-convention 强制度与降级条件（R5）；措辞卡「表态」非「处理」 |
| peer 输出被后续误用为 durable artifact，悄悄长出 producer/freshness 契约 | U1 契约文档显式「非 durable artifact / 非 producer 契约」；historian 保留「never write files」 |
| 两个 session 概念（live advisory vs 历史综述）混淆 | U1 契约文档显式区分；不碰 `spec-first-session.v1` |
| fresh-source eval 不可用（宿主缺 dispatch / 用户禁用 helper agents） | 按 `docs/contracts/workflows/fresh-source-eval-checklist.md` 记录未执行原因，不声称通过 |
| 双宿主 runtime drift | U4 用 `spec-first init` + `doctor` 确认；drift 修在 source/generator |

---

## Documentation / Operational Notes

- `CHANGELOG.md`：U2、U3 各追加条目；U3 标 `(user-visible)`。
- README：本次为内部 workflow/契约演化，不改用户安装/使用面，README 暂不需更新（实现时复核：若 work 启动可见行为需对外说明则补 `README.zh-CN.md`）。
- `docs/`：新增 `docs/contracts/workflows/peer-session-summary.md`。
- 角色契约：本计划在既有 §4 gate 框架内落地，不修改 `docs/10-prompt/结构化项目角色契约.md`。

---

## Sources & References

- Origin document: 无（plan-local spec_id，需求来自多轮架构讨论收敛）
- Related contracts: `docs/contracts/workflows/review-finding.md`、`docs/contracts/workflows/review-closure-traceability.md`、`docs/contracts/sessions/spec-first-session.md`
- Related skills/agents: `skills/spec-sessions/SKILL.md`、`agents/spec-session-historian.agent.md`、`skills/spec-work/SKILL.md`、`skills/spec-code-review/SKILL.md`
- Related tests: `tests/unit/spec-sessions-contracts.test.js`、`tests/unit/spec-work-contracts.test.js`
- Role contract: `docs/10-prompt/结构化项目角色契约.md`（§4 强 gate/轻判断、§7 宿主商品化、§10 80/20）
- Source analysis: `/Users/kuang/xiaobu/spec-first-doc/业界学习/02-竞品对标/harness-engineering/2026-06-15-tma1-v2-coding-agent-loop-spec-first-lsf-skill-analysis.md`（TMA1 v2 Loop Context 启发）
