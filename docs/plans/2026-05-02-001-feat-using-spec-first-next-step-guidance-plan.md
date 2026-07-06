---
title: feat: 为 using-spec-first 增加下一步引导
type: feat
status: completed
date: 2026-05-02
spec_id: 2026-05-01-002-using-spec-first-next-step-guidance
origin: docs/brainstorms/2026-05-01-002-using-spec-first-next-step-guidance-requirements.md
---

# feat: 为 using-spec-first 增加下一步引导

## Overview

增强 `using-spec-first`，让用户显式询问“下一步该做什么 / 该用哪个命令”时能得到一个明确入口；也让用户直接描述具体任务但不知道 workflow 时，agent 能按高低置信度选择合适的 `spec-*` workflow。

本计划的核心方案是：继续让 `skills/using-spec-first/SKILL.md` 作为唯一 routing policy source of truth；如需提升 init 后可见性，只在 bootstrap managed block 中增加薄提醒；同时用测试保护 `spec-first:coding-guidelines` 仍然只约束执行姿势，不承担 workflow 路由。

---

## Problem Frame

`spec-first` 的公开 workflow 已经覆盖 ideate、brainstorm、plan、work、debug、review、setup、update、sessions、compound、optimize 等多个入口。新手用户常见困惑不是“不知道自己要做什么”，而是不知道当前应该进入哪个入口，例如刚 init 完不知道第一步跑什么、做完 brainstorm 不知道是否 plan/work、已有 diff 不知道是否 review。

现有 `using-spec-first` 已经是 substantial work 前的 entry governor，但正文更偏向 agent 内部治理，缺少一个明确的用户可见 next-step guide mode。与此同时，`spec-first init --claude|--codex` 会把 language/changelog、bootstrap、coding-guidelines 三类 managed blocks 注入 `CLAUDE.md` 或 `AGENTS.md`。本次设计必须保留这条分层：bootstrap 只提醒进入路由判断，完整路由策略在 `using-spec-first`，coding-guidelines 只约束路由后的执行质量。

---

## Requirements Trace

**Guide mode trigger**
- R1. 在 `using-spec-first` 中显式定义 user next-step guide mode，覆盖“下一步是什么 / 该用哪个命令 / 不知道用哪个 workflow”。
- R2. 覆盖刚 init、刚 brainstorm、已有 plan、已有 work diff、review 后等 handoff 场景。
- R3. 保留用户直接描述任务时的自动入口分流，不要求用户先点名 `spec-*` 或 `spec-*`。

**Routing behavior**
- R4. 每次只推荐一个最匹配公开入口；如果两个解释会实质改变路线，先问一个窄确认问题。
- R5. guide mode 输出包含推荐入口、一个具体原因、下一步动作。
- R6. guide mode 只做 read-only 判断，不创建 brainstorm/plan/task/review/solution artifacts。
- R7. 明确 bug、review、setup、update、已有 plan/task 的 work 等高置信场景可直接说明入口并继续；低置信场景先确认。
- R8. 已经在公开 workflow 内时，不在每一步重启入口分流，除非用户目标变化、workflow 明确 handoff 或请求越界。

**Source and runtime boundary**
- R9. `skills/using-spec-first/SKILL.md` 继续作为唯一 routing policy source of truth。
- R10. 本阶段不新增 `spec-next`、`spec-guide`。
- R11. 不修改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime mirrors。

**User experience**
- R12. 用户输出保持短，不把完整 workflow reference 当作回答。
- R13. 对刚 init 完的新手，优先考虑 readiness/setup；目标仍是想法时走 brainstorm；目标明确但缺方案时走 plan。
- R14. 保留现有负向约束：不采用 `using-superpowers` 的 1% rule，不把 `spec-brainstorm` 当万能默认入口，不把轻量事实问答强制 workflow 化。

**Managed instruction block interaction**
- R15. `spec-first:bootstrap` managed block 保持薄入口提醒；可以承接 next-step guidance 的短触发提示，但不复制完整路由树。
- R16. `spec-first:coding-guidelines` managed block 保持 execution posture contract，不加入 workflow 路由表、next-step 菜单或用户意图分类规则。
- R17. 保留 instruction layering：language/changelog governance -> workflow entry bootstrap -> coding-guidelines。
- R18. 如果 bootstrap 文案变化，同步 contract tests，证明 bootstrap 仍指向 `using-spec-first`，coding-guidelines 仍不替代 workflow entry governance。

**Origin actors:** A1 新手用户，A2 顶层 orchestrator agent，A3 下游 workflow，A4 spec-first 维护者，A5 instruction file 受管 blocks。

**Origin flows:** F1 用户显式询问下一步，F2 用户直接描述具体任务，F3 workflow 完成后的下一步，F4 init 注入后的第一轮任务。

**Origin acceptance examples:** AE1 明确命令选择求助，AE2 测试失败路由到 debug，AE3 登录逻辑含糊时先确认，AE4 brainstorm 后推荐 plan，AE5 不新增 `spec-next/spec-guide` 且不改 runtime mirrors，AE6 init blocks 保持路由/执行分层，AE7 bootstrap 与 coding-guidelines tests 保护边界。

---

## Success Criteria

- 新手用户可以直接描述任务或询问下一步，并得到一个明确、可执行、符合当前宿主语法的 `spec-*` 入口建议。
- Agent 在高置信任务上能自然进入正确 workflow，在低置信任务上能先确认关键分歧，减少错误进入 plan/work/debug 的概率。
- `using-spec-first` 仍保持唯一 routing policy source of truth，没有出现 README、bootstrap block、新 skill 和 runtime mirror 各自维护路由表的漂移风险。
- init 注入后的 instruction file 分层清楚：bootstrap 帮助 agent 记得路由，coding-guidelines 只约束路由后的执行质量。
- 下游实施可以直接按本计划更新 prose contract、测试覆盖和文档，不需要重新发明 guide mode 的触发、边界和输出形态。

---

## Scope Boundaries

- 不新增 workflow command、公开 guide skill、CLI router、状态机或 machine-readable routing engine。
- 不把完整 routing policy 复制进 README、bootstrap、coding-guidelines 或 generated runtime mirrors。
- 不把 `spec-brainstorm` 设为默认总入口。
- 不采用 `using-superpowers` 风格的 “1% chance” 强制 skill 规则。
- 不把轻量事实查询强制路由进 workflow。
- 不编辑 `.claude/`、`.codex/`、`.agents/skills/` generated runtime assets。
- 不让 `spec-first:coding-guidelines` 承担 workflow 选择职责。

### Deferred to Follow-Up Work

- 未来如果新增 `spec-next`，只能作为读取或引用 `using-spec-first` guide mode 的薄壳，不拥有独立路由逻辑。
- 未来如果要做确定性 routing script 或 telemetry recommender，需要单独设计；本阶段仍由 LLM 做语义路由判断。

---

## Graph Readiness

- target_repo: `spec-first`
- status: stale
- source_revision: `beb1f160d8140ee316b4ad29ebfd3bcbd509095a`
- current_revision: `b0d0c15c087f1da414dc7516046bf938f0a92d9d`
- stale: true
- primary_providers: compiled facts 记录 `code-review-graph`、`gitnexus`
- degraded_providers: compiled facts 中无 degraded provider，但 compiled facts 已 stale
- fallback_capabilities: compiled facts 记录 `serena`、`ast-grep` 可作为 bounded local reads 的 partial fallback
- runtime_mcp_evidence: 本会话 live GitNexus query 成功，返回 `src/cli/instruction-bootstrap.js`、`src/cli/coding-guidelines.js`、`tests/unit/instruction-bootstrap.test.js`、`tests/unit/coding-guidelines.test.js`、`tests/unit/using-spec-first-contracts.test.js`、`src/cli/commands/init.js`、`src/cli/plugin.js` 等相关指针
- confidence: medium
- limitations: canonical graph artifacts 的 `source_revision` 与当前 `HEAD` 不一致，且 worktree dirty；本计划主要依据直接源码读取和本会话 GitNexus 证据

---

## Context & Research

### Relevant Code and Patterns

- `skills/using-spec-first/SKILL.md` 已声明 `using-spec-first` 是 standalone meta skill，不是 command-backed workflow，并且只负责 entry routing。
- `skills/using-spec-first/SKILL.md` 已有关键负向约束：不默认 brainstorm、不采用 `using-superpowers` 1% rule、不把轻量请求过度 workflow 化、不暴露 hidden helper skills。
- `src/cli/instruction-bootstrap.js` 生成 Claude/Codex 的 bootstrap managed block，当前已通过“完整策略由 `using-spec-first` 维护”保持薄提醒定位。
- `src/cli/coding-guidelines.js` 生成 coding-guidelines managed block，当前已声明这些准则只约束 workflow routing 后的 execution posture。
- `tests/unit/using-spec-first-contracts.test.js` 是固定 guide-mode prose contract 和负向入口约束的主要测试位置。
- `tests/unit/instruction-bootstrap.test.js` 已覆盖 bootstrap 薄提醒、host entrypoint 拼写、startup reminder scope 和 common anchors。
- `tests/unit/coding-guidelines.test.js` 已覆盖 block 写入、顺序和 drift 行为，可补充 routing 边界断言。
- 如果 README 增加发现性提示，`tests/unit/readme-language-split.test.js` 与 `tests/unit/readme-open-source-entry.test.js` 是保持中英文入口一致性的相关测试。

### Institutional Learnings

- `docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md` 说明新增 workflow entrypoint 会牵涉 command manifest、dual-host governance、adapter 和 runtime asset 边界。这支持本阶段不新增 `spec-next/spec-guide` 的决策。
- `docs/10-prompt/结构化项目角色契约.md` 要求 light contract、explicit boundaries、source/runtime 分离，以及 LLM 负责语义判断。next-step guidance 因此应是 prose policy 和输出契约，不是脚本语义 router。

### External References

- 本计划不需要外部研究。变更属于内部 prompt/workflow governance，已有足够本地模式，不依赖第三方 API 或近期外部规范。

---

## Key Technical Decisions

- 增强 `using-spec-first`，不新增 guide command：这样可以保持 routing policy 单一真源，避免 command/governance/runtime 面扩大。
- 在 `using-spec-first` 中新增具名 user next-step guide mode：让用户显式求助时有稳定行为，同时不改变 workflow surface。
- 采用“高置信直接路由，低置信窄确认”：降低新手负担，同时避免在 bug/需求变更、ideate/brainstorm/plan/work 等边界上误判。
- bootstrap 最多增加一条薄提醒：init 注入文件可以帮助 agent 记得 guide mode 存在，但不拥有第二套路由树。
- coding-guidelines 默认不改正文，只补边界测试：当前 block 已正确定位为 execution posture。
- 本阶段用 prose contract tests，而不是 fixture-heavy LLM eval：目标是守住治理文本和边界，不是实现确定性分类器。
- README 只做发现性说明：如果触碰 README，只说明用户可以直接描述任务或询问该用哪个 workflow，不复制完整 routing matrix。

---

## Open Questions

### Resolved During Planning

- 是否新增 `spec-next` 或 `spec-guide`？结论是不新增；它会形成第二个入口治理面，当前收益不足。
- bootstrap 是否承载完整 next-step guidance？结论是不承载；bootstrap 只做薄触发提醒，并指向 `using-spec-first`。
- coding-guidelines 是否加入 next-step routing？结论是不加入；它继续只约束执行姿势。
- 是否用 fixture-style route simulations 测试？结论是本阶段不需要；source contract assertions 加负向断言足够。
- README 是否更新？结论是如果实施产生用户可见 guidance，建议中英文 README 各加一句发现性提示，但不复制路由表。

### Deferred to Implementation

- `skills/using-spec-first/SKILL.md` 的具体 guide-mode 文案：实施时按现有 skill 风格写短契约。
- 是否在同一实现变更中同步 checked-in `AGENTS.md` 与 `CLAUDE.md` managed blocks：执行时必须保护已有用户修改；如果 dirty 状态让 source-slice sync 不安全，应显式延后。
- prose 改动后是否需要 fresh-source semantic review：等确定性测试通过后再决定，且只能读取磁盘当前 source，不能依赖本会话缓存的 skill 定义。

---

## High-Level Technical Design

> *本表只说明预期方案形态，供审查使用，不是 implementation specification。实施 agent 应把它当作上下文，而不是需要逐字复刻的代码或规则。*

| 用户场景 | 责任归属 | 期望响应形态 | 边界 |
| --- | --- | --- | --- |
| “下一步是什么 / 该用哪个 workflow” | `using-spec-first` guide mode | 推荐一个入口、一个原因、一个下一步动作 | 只读，不创建下游 artifact |
| 明确任务，例如测试失败、review、setup/update 修复 | `using-spec-first` entry routing | 说明选择的 workflow 并继续 | 除非风险或范围不清，不额外确认 |
| 含糊任务，例如“改登录逻辑” | `using-spec-first` entry routing | 先问一个窄确认问题 | 不猜 bug、策略变更、plan、work 的分界 |
| 已在公开 workflow 内 | 当前 workflow 的 `SKILL.md` | 遵循该 workflow handoff | 不在每一步重启入口治理 |
| init 后新会话 | bootstrap 提醒，`using-spec-first` 决策 | bootstrap 指回完整 policy，skill 选择入口 | bootstrap 保持薄，coding-guidelines 不路由 |
| 路由后的执行阶段 | `spec-first:coding-guidelines` | 最小、手术式、可验证执行 | 不提供命令菜单或用户意图分类规则 |

---

## Implementation Units

- U1. **在 using-spec-first 中定义 next-step guide mode**

**Goal:** 给 `using-spec-first` 增加用户可见 guide mode，同时保持其 standalone entry governor 身份。

**Requirements:** R1, R2, R3, R4, R5, R6, R7, R8, R12, R13, R14；覆盖 AE1, AE2, AE3, AE4。

**Dependencies:** None。

**Files:**
- Modify: `skills/using-spec-first/SKILL.md`
- Test: `tests/unit/using-spec-first-contracts.test.js`

**Approach:**
- 在 `Decision Output Contract` 附近新增短章节，例如 `User Next-Step Guide Mode`，说明触发条件、允许行为和输出形态。
- 将 guide mode 定义为 read-only route recommendation behavior，而不是 workflow 本身。
- 加入显式下一步求助、直接高置信任务、低置信含糊任务的简短规则。
- 保留 host entrypoint 拼写边界：Claude 用 `spec-*`，Codex 用 `spec-*`。
- 保留负向约束：不新增 `spec-next/spec-guide`，不采用 1% rule，不把 brainstorm 设为万能默认，不过度路由轻量请求。

**Execution note:** 先或同步更新 contract test expectations，让 source policy drift 能被确定性捕捉。

**Patterns to follow:**
- `skills/using-spec-first/SKILL.md` 现有 `Decision Output Contract`、`Routing Priority`、`Hard Rules`、`Host Surface`。
- `tests/unit/using-spec-first-contracts.test.js` 现有字符串治理断言。

**Test scenarios:**
- Happy path: skill 文本命名 guide mode trigger，例如 next step / which workflow，并要求推荐一个入口和一个原因。
- Happy path: direct task routing 文本允许高置信场景在说明选择后继续。
- Happy path: workflow handoff 文本覆盖 brainstorm 后推荐 plan、已有 diff 时建议 review/work 判断等 next-step 场景。
- Edge case: 含糊任务要求窄确认，而不是列完整 workflow 菜单。
- Error path: guide mode 文本明确只做 read-only recommendation，不在选定 workflow 前写 artifacts 或替下游 workflow 执行实际工作。
- Error path: skill 文本继续禁止 `spec-next`、`spec-guide`、`using-superpowers` 1% rule 和 universal `spec-brainstorm`。
- Integration: Claude 与 Codex runtime transform 后仍保留 guide-mode 章节与 host-specific entrypoint 拼写。

**Verification:**
- Source skill 清楚描述 guide mode；governance tests 证明新文本在 host runtime transform 后仍存在，且没有暴露新命令。

---

- U2. **为 bootstrap 增加薄 guide-mode 提醒**

**Goal:** 让 init-injected bootstrap blocks 知道用户可能会问下一步，但不把 routing policy 从 `using-spec-first` 搬出来。

**Requirements:** R9, R11, R13, R15, R17, R18；覆盖 AE5, AE6, AE7。

**Dependencies:** U1。

**Files:**
- Modify: `src/cli/instruction-bootstrap.js`
- Test: `tests/unit/instruction-bootstrap.test.js`
- Modify or explicitly defer source-sync: `AGENTS.md`, `CLAUDE.md`

**Approach:**
- 在 Claude/Codex bootstrap 中各增加一条简短 bullet：当用户问下一步或不知道 workflow 时，按 `using-spec-first` guide mode 推荐一个公开入口。
- 保留现有 common anchors，不加入 route table、examples matrix 或长命令菜单。
- 保留 Codex startup reminder 的 best-effort、read-only 边界。
- 如果 bootstrap source 变化，checked-in root instruction docs 的 managed bootstrap slices 必须同步更新，或在实施结果中显式说明因为无关 dirty state 延后同步；不能留下未说明的 source drift。
- 同步 `AGENTS.md` / `CLAUDE.md` 时必须使用 generator-aware source-slice update，并保留周边用户内容；不编辑 `.claude/`、`.codex/`、`.agents/skills/`。

**Execution note:** 把 bootstrap 当作 managed block source 来验证 builder 输出，不手工 patch runtime mirrors。

**Patterns to follow:**
- `src/cli/instruction-bootstrap.js` 中现有 `buildZhBootstrapBody()` 与 `buildEnBootstrapBody()` 结构。
- `tests/unit/instruction-bootstrap.test.js` 中现有 thinness assertions。

**Test scenarios:**
- Happy path: Claude 与 Codex bootstrap output 提到 next-step / workflow-choice guidance，并指向 `using-spec-first`。
- Edge case: bootstrap 仍声明自己只是 thin reminder，完整选择策略仍由 `using-spec-first` 维护。
- Error path: bootstrap 不包含 `spec-next`、`spec-guide`、hidden internal skills 用户入口或完整 route classifier。
- Integration: 与现有 block helpers 组合后，managed block 顺序仍是 language/changelog governance -> bootstrap -> coding-guidelines。

**Verification:**
- Bootstrap contract tests 证明 managed block 只增加薄提醒，并保持 host-specific entrypoint 边界。
- 实施结果能证明 `AGENTS.md` / `CLAUDE.md` 的 checked-in managed bootstrap slices 已同步，或明确记录 deferred source-sync reason。

---

- U3. **保护 coding-guidelines 只作为 execution posture**

**Goal:** 防止 `spec-first:coding-guidelines` 漂移成 route selector 或 next-step menu。

**Requirements:** R16, R17, R18；覆盖 AE6, AE7。

**Dependencies:** U1, U2。

**Files:**
- Modify: `tests/unit/coding-guidelines.test.js`
- Modify if wording must be tightened: `src/cli/coding-guidelines.js`

**Approach:**
- 优先不改 `src/cli/coding-guidelines.js` 正文，因为当前已经说明该 block 不替代 workflow entry governance。
- 增加测试，断言中文和英文 generated blocks 都仍然只约束 routing 后的 execution posture。
- 如有必要，增加负向断言：不出现 `spec-next`、`spec-guide`、完整 route table 或 “which workflow” 菜单表达。

**Patterns to follow:**
- `tests/unit/coding-guidelines.test.js` 中现有 block-builder tests。
- `src/cli/coding-guidelines.js` 当前关于 “after workflow routing / 不替代 workflow entry governance” 的边界句。

**Test scenarios:**
- Happy path: 中文和英文 coding-guidelines blocks 仍声明不替代 workflow entry governance。
- Error path: coding-guidelines blocks 不包含 next-step guide triggers、workflow routing menus 或 public entrypoint recommendation rules。
- Integration: combined managed block ordering 仍是 language/changelog governance -> bootstrap -> coding-guidelines。

**Verification:**
- Coding-guidelines tests 证明 routing policy 没有进入 execution-posture block。

---

- U4. **更新用户可见文档与 changelog**

**Goal:** 提升可发现性，但不创造另一份 routing source 或 command surface。

**Requirements:** R5, R9, R10, R11, R12, R14, R15, R16；覆盖 AE1, AE5, AE6。

**Dependencies:** U1；如果 bootstrap 变化则依赖 U2。

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `CHANGELOG.md`
- Test if README changes: `tests/unit/readme-language-split.test.js`
- Test if README changes: `tests/unit/readme-open-source-entry.test.js`

**Approach:**
- 在 first-run/discovery 区域最多加一句短提示：用户可以直接调用已知 workflow，也可以描述任务或问该用哪个 workflow，agent 会按 `using-spec-first` 路由。
- 不在 README 中加入完整 workflow decision tree；README 只提示能力，不拥有 policy。
- 用当前 developer profile 在 `CHANGELOG.md` 记录 user-visible 行为变化。
- 不因文档更新修改 runtime mirrors。

**Patterns to follow:**
- README 当前 first-run guidance 和 host-session workflow entry sections。
- `CHANGELOG.md` 当前记录格式。

**Test scenarios:**
- Happy path: 英文和中文 README guidance 保持并行，并使用 host-session entrypoint 语义，不把 workflow entries 写成 shell commands。
- Edge case: README 不引入 `spec-next`、`spec-guide` 或独立 route table。
- Test expectation: changelog 记录按人工可读格式检查；仓库没有为每条 changelog 文案建立 schema 测试。

**Verification:**
- 如果 README 变化，对应 README tests 证明中英文 first-run guidance 对齐，且没有混淆 shell commands 与 host workflow entries。

---

## System-Wide Impact

- **Interaction graph:** 影响 agent entry routing prose、init-injected instruction reminders，以及保护 source/runtime delivery 的 contract tests；不应影响 CLI 命令执行、graph providers 或下游 workflow 内部逻辑。
- **Error propagation:** 主要失败模式是语义误路由；缓解方式是短输出契约加低置信窄确认，而不是确定性 route script。
- **State lifecycle risks:** guide mode 是 read-only，不应在选定 workflow 前写 artifacts 或改变项目状态。
- **API surface parity:** Claude 和 Codex 入口必须保持差异：Claude `spec-*`，Codex `spec-*`，`using-spec-first` 本身仍是 standalone meta skill。
- **Integration coverage:** `using-spec-first` runtime transform 覆盖、bootstrap builder tests、coding-guidelines block tests 是核心集成安全网。
- **Unchanged invariants:** 不新增 command-backed workflow，不编辑 generated runtime mirrors，不让脚本做语义路由，不改变下游 workflow handoff contracts。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| routing policy 在 skill、bootstrap、README 间重复 | 完整 policy 只保留在 `skills/using-spec-first/SKILL.md`；bootstrap 和 README 只做短指引 |
| guide mode 变成完整命令菜单 | Contract tests 要求一个推荐、一个原因、含糊时窄确认 |
| coding-guidelines 漂移进 routing 文案 | 对 generated coding-guidelines blocks 增加负向断言 |
| 新手便利导致轻量请求被过度 workflow 化 | 保留并测试现有 lightweight-request exclusions |
| checked-in `AGENTS.md` / `CLAUDE.md` 已 dirty | 把 source-sync 当作显式实施步骤；保护用户改动，避免 runtime mirrors |
| stale graph facts 误导计划 | 明确标记 graph facts stale，并依赖直接源码读取和本会话 GitNexus 证据 |

---

## Documentation / Operational Notes

- 用户可见行为变化必须记录到 `CHANGELOG.md`。
- 如果触碰 README，英文与中文入口要一起更新。
- 如果 bootstrap source 改动，checked-in `AGENTS.md` 和 `CLAUDE.md` managed blocks 必须同 PR source-sync，或明确记录 deferred source-sync reason。Generated runtime mirrors 不在范围内。
- 修改 `src/cli/instruction-bootstrap.js` 或 `src/cli/coding-guidelines.js` 中的 builder symbols 前，实施者必须遵守项目 GitNexus upstream impact-analysis 要求，并在结果中说明风险等级。
- 实施后，用户需要刷新 host runtime copies 时，通过 `spec-first init --claude` 或 `spec-first init --codex` 重新生成。

---

## Sources & References

- **Origin document:** `docs/brainstorms/2026-05-01-002-using-spec-first-next-step-guidance-requirements.md`
- Role contract: `docs/10-prompt/结构化项目角色契约.md`
- Source skill: `skills/using-spec-first/SKILL.md`
- Bootstrap source: `src/cli/instruction-bootstrap.js`
- Coding-guidelines source: `src/cli/coding-guidelines.js`
- Contract tests: `tests/unit/using-spec-first-contracts.test.js`
- Bootstrap tests: `tests/unit/instruction-bootstrap.test.js`
- Coding-guidelines tests: `tests/unit/coding-guidelines.test.js`
- README tests: `tests/unit/readme-language-split.test.js`, `tests/unit/readme-open-source-entry.test.js`
- Architecture pattern: `docs/solutions/architecture-patterns/workflow-entrypoint-exposure-contract-2026-04-26.md`
