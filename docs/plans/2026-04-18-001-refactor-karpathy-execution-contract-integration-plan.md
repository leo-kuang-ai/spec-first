---
title: "refactor: Karpathy execution contract — scoped to spec-code-review change-discipline detection"
type: refactor
status: completed
date: 2026-04-18
supersedes: prior 6-unit version committed at a49fb7c3 (kept in git history)
---

# refactor: Karpathy execution contract — scoped to spec-code-review change-discipline detection

## Overview

把 Karpathy 方法论中 spec-first 尚未稳定覆盖的一小块——**review 阶段的 change-discipline 信号产出**——落到 `spec-code-review` 里，顺带修掉现有 subagent-template 中 `speculative` 一词的歧义，并补一个最小的结构化标签钩子 `dimension_tag`，让 change-discipline finding 至少在 **spec-code-review run artifact** 里可 grep、可抽样，而不是继续停留在无结构 prompt contract。

本次**不再**触碰 `spec-plan`、`spec-brainstorm`、`spec-work`、`lfg` 的源 skill——核实后证实它们已有等价结构或本次修改 ROI 接近零。

## Why This Plan Is A Rewrite

原 6-unit 方案（commit `a49fb7c3`）在代码事实核查后暴露以下问题：

1. **`spec-plan` 源 skill 已包含** Execution Readiness / Starting point / Execution note / explicit assumptions / require assumptions before proceeding（见 `skills/spec-plan/SKILL.md` Line 40/54/200/213/433/434/606/608）。原 Unit 1 的 spec-plan 部分属于重复结构。
2. **`spec-brainstorm` 源 skill 已包含** challenge assumptions / YAGNI / speculative complexity warning / unverified assumption labeling / simplification-as-leverage（Line 26/30/183/270/310）。原 Unit 1 的 spec-brainstorm 部分属于重复结构。
3. **`subagent-template.md:43`** 现有"too speculative → 不报告"合同与原 Unit 3 的"显式报告 speculative complexity"**语义冲突**，原 plan 未识别。
4. **原 Unit 4** 对 `lfg` 添加继承说明是纯装饰：lfg 只是调用 `spec-plan` / `spec-work` / `spec-code-review`，下游 skill 已各自携带合同，lfg 层文本不被执行期消费。
5. **原 Unit 5 byte-equal mirror test** 只覆盖 5 个 skill，但 `docs/10-prompt/skills/` 下有 48 个 mirror。这是 governance inconsistency，不是 minimal viable guard。
6. **`spec-work-beta` 是 spec-work 的同源 fork**（`description: "Same as spec:work but with Codex delegation"`）。把它从 scope 排除但保留 spec-work 改造，制造平行执行路径的治理缝隙。
7. **原方案的验收只是 keyword-present 断言**，外加 Observational Goals 声明"非 gating 且不承担测量基础设施"——等于**改了 prompt 但 6 个月后无法回答有没有用**。

> 本计划把 6 个 unit 缩成 2 个，单一干预点（spec-code-review），并把最小结构化 instrumentation 内建进 findings contract，为后续抽样与是否值得做 durable telemetry 提供依据。

## Problem Frame

Karpathy 方法论核心的四类失误里，**只有一类在 spec-first 当前 source-of-truth 中没有被结构化捕获**：

| 失误类别 | 当前覆盖情况 | 本次处理 |
|---|---|---|
| 静默假设 | `spec-plan` / `spec-brainstorm` 都有 explicit assumptions 结构 | 不改 |
| 过度设计 | `spec-brainstorm` 有 YAGNI + carrying cost 明示 | 不改 |
| 越界改动 | `spec-work` 有"Simplify as You Go"克制条款、`spec-code-review` 有 maintainability reviewer | review 侧未产出稳定信号 → 本次处理 |
| 缺少完成信号 | `spec-plan` 有 Execution Readiness / Starting point / Execution note | 不改 |

所以本次只解决一件事：**让 `spec-code-review` 的 reviewer side 稳定产出 orthogonal edits / over-engineering / assumption leak 三类 change-discipline finding**；并给它们可选的结构化标签，让本地 review artifact 至少能做近端抽样与频率观察。

## Requirements Trace

- R1. 不新增用户可见入口；不改 `spec-plan` / `spec-brainstorm` / `spec-work` / `spec-work-beta` / `lfg` / `using-spec-first`。
- R2. 解决 `subagent-template.md:43` 的 `speculative` 词汇歧义（self-confidence vs diff-quality）。
- R3. 让 reviewer 在分析阶段显式考虑三类 change-discipline 问题，有则作为 finding 输出、无则静默；沿用现有单一 `findings` 数组 + `residual_risks` + `testing_gaps` schema。
- R4. 在 `findings-schema.json` 里加一个**可选**的 `dimension_tag` 字段（`orthogonal_edits | over_engineering | assumption_leak | null`），让 change-discipline finding 有最小机器可读标签，支持本地抽样与后续 durable export。
- R5. Stage 5 Merge findings 与 Stage 6 Synthesize and present 里明确把 change-discipline finding 作为独立维度收口，不让它散入 maintainability 或 residual_risks。
- R6. 所有修改只落在 source-of-truth 与 docs mirror；不触碰 runtime artifact；每个源码 commit 自带 CHANGELOG 条目。

## Scope Boundaries

- 不改 `spec-plan` / `spec-brainstorm` / `spec-work` / `spec-work-beta` / `lfg` 源 skill（已有等价结构或 ROI 接近零）。
- 不改 `using-spec-first` 的 routing 职责。
- 不新增任何 persona、reviewer、command、workflow。
- 不扩 findings-schema 的必填结构，只加**一个可选字段**。
- 不引入 byte-equal mirror 全量测试（如果后续真的要，应作为独立治理任务覆盖全部 48 个 mirror）。
- 不建立外挂测量基础设施（不采基线、不定阈值、不设 acceptance rule）；`dimension_tag` 只提供最小 instrumentation hook，不把 `.spec-first/` 冒充成长期 analytics store。
- 不承诺 reviewer ownership（change-discipline 对所有 reviewer 开放，synthesis 统一收口）。

### Deferred to Separate Tasks

- spec-work 执行前 change boundary preflight：如果 Unit 1-2 ship 后 review 数据显示 orthogonal edits 率仍高，单独立项，**同时覆盖 spec-work 与 spec-work-beta**，不再制造 fork 偏差。
- spec-plan / spec-brainstorm contract 层增强：如未来真出现结构缺口，独立立项。
- lfg pipeline 级质量门：如未来要在 pipeline 级插 gate，独立立项（不是文案修饰）。
- 全量 docs/10-prompt/skills/** byte-equal 守护：48 个 mirror 一起守或都不守；本次不做局部守护。
- 硬性量化阈值（`unplanned_change_ratio` 下降 X% 等）：需先有基线，另立项。

## Context & Research

### Relevant Code and Patterns

- `skills/spec-code-review/SKILL.md`（Stage 5 Merge findings ≈ line 480；Stage 6 Synthesize ≈ line 509）
- `skills/spec-code-review/references/subagent-template.md`（`speculative` 冲突点在 line 43）
- `skills/spec-code-review/references/findings-schema.json`（单一 `findings` 数组 + `residual_risks` + `testing_gaps`；`severity` enum `P0/P1/P2/P3`；`autofix_class` enum `safe_auto/gated_auto/manual/advisory`）
- `skills/spec-code-review/references/review-output-template.md`（最终报告模板）
- `docs/10-prompt/skills/spec-code-review/`（源/镜像 byte-equal 现状由 `diff -q` 验证）
- `tests/unit/spec-review-contracts.test.js`

### Institutional Learnings

- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`：只改 source-of-truth，不改 runtime 副本。
- 原 plan `a49fb7c3`（本计划 supersedes）：保留在 git 历史，用作负面样本——说明"keyword-level contract 堆砌但无测量"的反模式。

### External References

- 无需外部研究。

## Key Technical Decisions

- **单一干预点：`spec-code-review`**。理由：review 是反向信号源；只要 review 可靠地标记 change-discipline，就会形成自然反馈推动上游；前移到 plan/work 阶段是在已有结构上堆叠。

- **不扩 findings-schema 必填结构；只加可选 `dimension_tag`**。理由：既守住 backward compatibility，又为 change-discipline finding 提供最小机器可读钩子。字段对所有 finding 仍是 optional，但**一旦 reviewer 判定该 finding 属于 change-discipline，prompt contract 要求填写主标签**，不能把“可选字段”退化成“随缘不打标”。

- **`dimension_tag` 是最小 instrumentation hook，不冒充完整 observability**。理由：当前 `spec-code-review` 的 run artifact 写到 `.spec-first/workflows/spec-code-review/<run-id>/`，而 `.spec-first/` 在仓库内是 gitignored；且 `mode:report-only` 不写 artifact。这个字段足以支持本地/短周期抽样与未来 durable export，但**单靠本次改动还不能承诺 6 个月后的团队级趋势分析**。

- **subagent-template 里区分两种 `speculative`**：现有 `too speculative to report`（reviewer 自评置信度）改为 `confidence too low to report`；新增的 change-discipline 用 `over_engineering`（不单独用 `speculative`）。理由：消除 semantic collision。

- **Stage 5/6 只消费 compact return 看得到的字段**。因此若要让 synthesis 稳定识别 change-discipline，`dimension_tag` 必须进入 compact return，并在 Stage 5 merge 时保留；只写到 full artifact schema 里不够。

- **Stage 5/6 不新增 tier**，但会显式保留单值 `dimension_tag`。当前 schema 只允许一个 tag，因此 merge 后只保留一个主标签；若 reviewer 对标签有分歧，按最高置信度 finding 选主标签，并在 Reviewer/Issue 文案里保留 disagreement 提示。

- **治理前置不独立成 unit**。CHANGELOG + `docs/08-版本更新/README.md` 与每个 Unit 的源码 commit 一起提交（和仓库现行节奏一致）。

## Alternative Approaches Considered

- **原 6-unit 方案（supersedes）**：prompt 堆砌无测量；存在 `speculative` 歧义、`spec-work-beta` 治理缝隙、48 mirror 局部守护争议、spec-plan/spec-brainstorm 重复结构。

- **标准 do-nothing**：如果 review 阶段的 change-discipline 对 team 并非痛点，当前 maintainability reviewer + residual_risks 已够用。**作为本计划 ship 后的 fallback**——若后续 interactive/autofix run artifact 的抽样里 `dimension_tag` finding rate 极低，说明问题未必存在于 review 阶段，可无损回滚。

- **把合同塞进 `using-spec-first` 让全链路继承**：看起来最省事但混淆 routing 与 execution 职责；且 using-spec-first 不被 reviewer subagent 读到，达不到目标。

- **新增 `change-discipline-reviewer` persona**：扩大 reviewer taxonomy；与本次最小改动原则冲突；且 persona 之间如何合并 finding 会带来新协调成本。

## Open Questions

### Resolved During Planning

- 是否需要改 `spec-plan` / `spec-brainstorm` / `spec-work` / `lfg`？
  不需要。核实后三者已有等价结构或 ROI 接近零。

- 是否必须扩 schema？
  不必扩必填结构，加一个可选 `dimension_tag` 就够。

- `spec-work-beta` 如何处理？
  本次不改 spec-work 体系，所以 beta 自然一致；未来若做 work 侧改造，必须**同步改 beta**。

- `dimension_tag` 要不要进入 compact return？
  要。Stage 5 merge 与 Stage 6 synthesize 只消费 compact return；若 tag 只在 full artifact 里，orchestrator 无法稳定保留 change-discipline 维度。

### Deferred to Implementation

- `dimension_tag` 的枚举值用 `orthogonal_edits | over_engineering | assumption_leak` 还是更细拆分？
  Unit 2 落地时若发现 reviewer 常把某类 finding 塞到多个 tag，再考虑细分；默认用三值 + `null`。

- 团队级长期趋势是否要做 durable export / retention？
  本次不做。若 local artifact 抽样显示此信号有价值，再单独立项，把 merged findings 周期性导出到 tracked path 或统一 telemetry 面。

## Implementation Units

- [x] **Unit 1: Resolve `speculative` term conflict + add qualitative change-discipline prompt to subagent-template**

**Goal:** 让 reviewer 在分析阶段显式考虑 orthogonal edits / over-engineering / assumption leak 三类 change-discipline 问题，并先把 `speculative` 一词在 confidence-self-rating 与 diff-quality 两种语义下的 collision 拆开。此 Unit 只做 reviewer 侧 qualitative contract，不提前改 merge/synthesize 逻辑。

**Requirements:** R1, R2, R3, R6

**Dependencies:** None

**Files:**
- Modify: `skills/spec-code-review/references/subagent-template.md`
- Modify: `docs/10-prompt/skills/spec-code-review/references/subagent-template.md`
- Test: `tests/unit/spec-review-contracts.test.js`

**Approach:**

- 在 `subagent-template` 里：
  - 把现有 confidence-self-rating 区（line 43）改为 `confidence too low to report`，移除 `speculative` 字样。
  - 新增"Change-Discipline Dimensions"一段，要求 reviewer 在分析阶段显式考虑三类问题：`orthogonal_edits`（改动超出 plan 预期边界）、`over_engineering`（未被当前任务要求的 abstraction / indirection / future-proofing）、`assumption_leak`（未声明的前置假设）。有问题→作为 finding 输出，无问题→保持静默、不需空占位。
  - 明确三类问题不允许藏进 maintainability 泛化评论或 residual_risks。
- docs mirror 完全 byte-equal 同步。
- `tests/unit/spec-review-contracts.test.js` 断言：
  - subagent-template 含 `orthogonal_edits` / `over_engineering` / `assumption_leak` 三个关键词。
  - subagent-template 不含 `too speculative`（证明歧义已清除）。

**Execution note:** contract-first — 先把 reviewer 语言合同写清楚，再在 Unit 2 做结构化字段与 orchestrator wiring。

**Starting point:** `skills/spec-code-review/references/subagent-template.md:43` 是 `speculative` 冲突点；先把 reviewer 侧语义拆清，再进入 Unit 2 的 structured wiring。

**Patterns to follow:**

- `skills/spec-code-review/references/subagent-template.md`
- `tests/unit/spec-review-contracts.test.js`

**Test scenarios:**

- Happy path: subagent-template 出现三维度关键词且 `speculative`（旧歧义）被替换。
- Edge case: change-discipline finding 不应被自动升级为 P0/P1；严重度仍由 reviewer 按现有 severity scale 判断。
- Integration: docs mirror 的 subagent-template 与 source 同步，不产生 source/mirror 漂移。

**Verification:**

- `tests/unit/spec-review-contracts.test.js` 通过。
- 人工 review source vs docs mirror byte-equal（`diff -q skills/spec-code-review/references/ docs/10-prompt/skills/spec-code-review/references/` 返回静默）。
- 17 reviewer catalog 不变；本 Unit 只增强 reviewer 共通 prompt，不改变 persona taxonomy。

- [x] **Unit 2: Wire `dimension_tag` end-to-end through schema, compact return, Stage 5/6, and review output**

**Goal:** 在 `findings-schema.json` 里加一个可选字段 `dimension_tag`（enum + null），并把它贯通到 compact return、Stage 5 merge、Stage 6 输出与 review-output-template。目标不是冒充完整 observability，而是让 change-discipline finding 在 orchestrator 看得到、保得住、最终报告里也看得见。Backward compatible——对非 change-discipline finding 仍可省略该字段。

**Requirements:** R4, R5, R6

**Dependencies:** Unit 1（reviewer 已被 prompt 要求考虑三维度；字段与 orchestrator 才有明确语义承接点）

**Files:**

- Modify: `skills/spec-code-review/references/findings-schema.json`
- Modify: `skills/spec-code-review/SKILL.md`
- Modify: `skills/spec-code-review/references/review-output-template.md`
- Modify: `skills/spec-code-review/references/subagent-template.md`
- Modify: `docs/10-prompt/skills/spec-code-review/references/findings-schema.json`
- Modify: `docs/10-prompt/skills/spec-code-review/SKILL.md`
- Modify: `docs/10-prompt/skills/spec-code-review/references/review-output-template.md`
- Modify: `docs/10-prompt/skills/spec-code-review/references/subagent-template.md`
- Test: `tests/unit/spec-review-contracts.test.js`

**Approach:**

- 在 `findings-schema.json` 的 `findings[].properties` 加：

  ```json
  "dimension_tag": {
    "type": ["string", "null"],
    "enum": ["orthogonal_edits", "over_engineering", "assumption_leak", null],
    "default": null,
    "description": "Optional tag for change-discipline findings. null when not applicable or reviewer omitted."
  }
  ```

  放在 `pre_existing` 之后；**不加入 `required` 数组**，保证既有 reviewer 输出仍然合法。
- 在 `subagent-template` 里把 compact return 字段列表扩成：
  `title, severity, file, line, confidence, autofix_class, owner, requires_verification, pre_existing, suggested_fix, dimension_tag (optional for non-change-discipline findings)`.
- 在 `subagent-template` 的 change-discipline 段落加一条强约束：
  > When you report a change-discipline finding, set `dimension_tag` to the primary matching tag (`orthogonal_edits | over_engineering | assumption_leak`) in both the full artifact and the compact return. Omit the field only when no change-discipline dimension applies.
- 在 `spec-code-review` SKILL Stage 5：
  - compact return validation 接受可选 `dimension_tag`
  - merge 后保留单个主标签，不因“接近 maintainability”而丢失
  - 若多个 reviewer 对同一 finding 的 `dimension_tag` 不同，保留最高置信度 finding 的 tag，并在 disagreement 注记里说明
- 在 `spec-code-review` SKILL Stage 6：
  - 明确 tagged finding 的最终呈现规则，避免实现者自行发明格式
  - 推荐做法：在 findings table 的 `Issue` 单元格前缀渲染 `[change-discipline:<dimension_tag>]`
- 更新 `review-output-template.md` 的 example 与 formatting rules，明确上述前缀是合法且期望的输出格式。
- docs mirror byte-equal 同步。
- `tests/unit/spec-review-contracts.test.js` 新增断言：
  - subagent-template 的 compact return 字段列表含 `dimension_tag`
  - schema 的 `findings[].properties` 含 `dimension_tag`。
  - schema `required` 不含 `dimension_tag`（保证可选）。
  - enum 精确匹配三值 + null。
  - SKILL.md Stage 5/6 含 `dimension_tag` / `change-discipline` 保留语句。
  - review-output-template 含 `[change-discipline:<dimension_tag>]`（或等价固定格式）说明。
  - 用一个带 `dimension_tag: null` 的 finding 样例跑 schema 校验通过；用 `dimension_tag: "orthogonal_edits"` 通过；用 `dimension_tag: "garbage"` 失败。

**Execution note:** contract-first — 先确保 structured tag 从 reviewer 到 orchestrator 再到报告是同一个 contract，再用 schema 负例锁死 enum 边界。

**Starting point:** 先读 `skills/spec-code-review/references/subagent-template.md` 的 compact return 字段列表和 `skills/spec-code-review/SKILL.md:480-527` 的 merge/synthesize contract，再去加 schema 字段；否则容易只改 full artifact、忘掉 orchestrator。

**Patterns to follow:**

- `skills/spec-code-review/references/findings-schema.json`
- `skills/spec-code-review/references/subagent-template.md`
- `skills/spec-code-review/SKILL.md`
- `skills/spec-code-review/references/review-output-template.md`
- `tests/unit/spec-review-contracts.test.js`（现有 schema 断言模式）

**Test scenarios:**

- Happy path: change-discipline finding 在 compact return、full artifact、Stage 6 报告三处都能看到一致的主标签。
- Edge case: 非法 enum 值失败；`dimension_tag` 不在 required；非 change-discipline finding 允许省略。
- Integration: source/mirror 的 schema、subagent-template、SKILL、review-output-template 四处同步；merge 后标签不因 dedupe 而丢失。

**Verification:**

- contract test 通过：字段存在、非必填、enum 精确、compact return contract 含 tag、Stage 5/6 与 review output 有固定呈现规则。
- source 与 docs mirror 的 `findings-schema.json` / `subagent-template.md` / `SKILL.md` / `review-output-template.md` byte-equal。
- 手工 sanity check：模拟一份带 tag 的 compact return，验证 merge/synthesize 文案会保留 `[change-discipline:<dimension_tag>]`。
- 手工 host check：在临时目录执行 `spec-first init --claude` 与 `spec-first init --codex`，确认安装后的 `spec-code-review/references/subagent-template.md` 与 `findings-schema.json` 仍带新 contract。

## System-Wide Impact

- **Interaction graph:** 影响面仅限 `spec-code-review` source + docs mirror + contract test。
- **Error propagation:** 若 reviewer 新段落导致 finding 过噪，只影响 review 输出可读性；不影响 correctness / security 等核心维度，无状态/持久化副作用。
- **State lifecycle risks:** 无；只是 prompt + 可选 schema 字段。
- **API surface parity:** 不改 `spec-*`、`spec-*`、双宿主治理 contract；findings-schema 向后兼容。
- **Integration coverage:** Unit 1 只改 reviewer qualitative contract；Unit 2 把 `dimension_tag` 贯通到 compact return / merge / synthesize / output template。adapter 对 schema 是透明的，但 runtime 安装后的 reference files 仍需做 host-level sanity check。
- **Unchanged invariants:** `using-spec-first` routing 不变；`spec-optimize` 不卷入；`spec-work-beta` 与 `spec-work` 自动保持一致（都不改）；17 reviewer catalog 不变。

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| reviewer 过度使用三维度，把普通 maintainability finding 误贴 `dimension_tag` | prompt 只要求“属于三维度时必须打主标签”；不属于则省略；Stage 5 disagreement note 保留审计线索 |
| change-discipline finding 错误升级为 P0/P1 | `severity` 由 reviewer 按现有 severity scale 独立判断；测试断言 tag 不绑死 severity |
| subagent-template 的 `speculative` 替换在 docs mirror 漂移 | 每 Unit 内 source + mirror 同 wave 更新；contract test 断言两侧关键词一致 |
| schema 扩展后 Codex adapter 输出漂移 | schema 是纯 JSON，adapter 默认 passthrough；本次不改 adapter 逻辑；runtime transform 后仍按 byte-equal 人工核对 |
| `dimension_tag` 字段在未来误被改成 free-form string | Unit 2 测试用非法 enum 负例锁死 |
| 把 `.spec-first/` 中的 local artifact 误当作 durable telemetry | 在文档和实现里明确这是 local instrumentation hook；团队级 retention/export 另立项 |

## Documentation / Operational Notes

- 本次属于 review 侧 prompt contract + schema 最小扩展；**不**归类为 significant workflow contract update（不横跨多 workflow，只改 spec-code-review 一条链路）。因此 `docs/08-版本更新/README.md` 可按非强制 cadence 追加；`CHANGELOG.md` 铁律照旧——每 Unit 一条。
- `dimension_tag` 的数据面只覆盖 interactive/autofix 下写出的 run artifact；`report-only` 不产出该数据，`.spec-first/` 也不是 tracked analytics store。任何“月度趋势”“半年对比”都应另有 retention/export 任务支撑。
- 实施完成后运行 `tests/unit/spec-review-contracts.test.js`；core runtime smoke 不需要扩断言（schema 变化对 smoke 透明）。
- **不**跑 markdownlint --fix 对本 plan 文档强制清理；格式告警按仓库现行 cadence 跟进。

## Sources & References

- Superseded plan: `a49fb7c3` 的 6-unit 方案（保留于 git history 作为负面样本）
- Related code: `skills/spec-code-review/SKILL.md`
- Related code: `skills/spec-code-review/references/subagent-template.md`
- Related code: `skills/spec-code-review/references/findings-schema.json`
- Related code: `skills/spec-code-review/references/review-output-template.md`
- Related tests: `tests/unit/spec-review-contracts.test.js`
- Evidence of existing coverage: `skills/spec-plan/SKILL.md` (Execution Readiness @54, Starting point / Execution note @433-434, require explicit assumptions @200-213)
- Evidence of existing coverage: `skills/spec-brainstorm/SKILL.md` (challenge assumptions @26, YAGNI + carrying cost @30, unverified assumption labeling @183)
- Institutional learning: `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`
