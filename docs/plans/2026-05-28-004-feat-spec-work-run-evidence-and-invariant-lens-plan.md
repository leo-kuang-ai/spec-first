---
title: spec-work run evidence 闭环 + workflow invariant 守护试点 + plan completion taxonomy 收紧
type: feat
status: completed
date: 2026-05-28
spec_id: 2026-05-28-004-spec-work-run-evidence-and-invariant-lens
origin: docs/09-业界借鉴/2026-05-27-Trellis-纵向钻探与spec-first质量提升分析.md
implements_schemas: ['docs/contracts/workflows/spec-work-run-artifact.schema.json']
---

# spec-work run evidence 闭环 + workflow invariant 守护试点 + plan completion taxonomy 收紧

## Summary

把 `spec-work` closeout 在 durable evidence trigger 命中时真正调用 internal producer，让 `workflow_integrated` 翻 true；同周期落地 Workflow Invariant Lens 试点（先覆盖 `spec-work` 与 `spec-code-review` 两个高风险入口），用 source-time contract test 替代 Trellis 风格 per-turn hook，守护 required-gate 与 reminder 段在 skill 演进中不被悄悄剪掉；同时把 plan completion taxonomy 写进 `plan-template.md` 并由 lint 强制，禁止"producer 已实现但未集成"这类半成品标 `completed`。三件事捆绑发布，作为打破 spec-first 自身"约束衰减"反例的最小完整闭环。

---

## Problem Frame

外部对标文档 `docs/09-业界借鉴/2026-05-27-Trellis-纵向钻探与spec-first质量提升分析.md` §13 把 AI coding 系统的核心承诺压成"用最小确定性机制让下一次 LLM 判断拿到更好的事实、边界、上下文和历史"。在事实/边界/上下文/历史四维中，spec-first 的"历史"维度最弱，最直接的证据就是 `docs/contracts/workflows/spec-work-run-artifact.schema.json` 自 Phase 1B 起一直处于 `producer_available=true / workflow_integrated=false` 状态超过 6 个月：producer 已实现，但 `spec-work` closeout 从来没真正调用它。

这不仅是单个 schema 的实施债，而是一个 **owner 级 meta-反模式**——一份用来防止 LLM "约束衰减" 的 artifact，自己被搁置成了约束衰减的反例。如果 spec-first 允许这种"plan 标 completed → source 半实装"模式继续存在，它批评 Trellis 强状态机时所站立的"light contract + 证据闭环"地基会被自己腐蚀。

更深一层，spec-first 选择不要 Trellis 风格的 per-turn hook（这是正确判断，§9 反向 guard 已论证），但**没有补上对等替代**——即对标文档 §5 提到的 "required gate 必须在 summary / closeout / reminder 同时可见" 这条 source-time contract-test lens。结果是所有 invariant 只活在 SKILL.md 长 prose 中，长会话 attention 衰减时没有任何 deterministic 机制阻止 reminder 段被悄悄剪掉而 gate 段还在——这正是 §5 提到的"高风险静默失败"形态。

---

## Requirements

- R1. `spec-work` closeout 在 4 个 durable evidence trigger（3 个明确结构信号 + 1 个语义兜底）至少 1 项命中时，必然调用 producer 写出 `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/run.json`；未命中或写入失败时必须以 `producer.reason_code` 显式声明，不得静默吞错。
- R2. `workflow_integrated` schema flag 由 fixture-backed integration test 守护翻 true，证明 closeout → producer → run.json 完整路径真实可重现。
- R3. 引入 Workflow Invariant Lens：一类 deterministic contract test，验证指定 high-stakes workflow 中每条 critical invariant 在多个语义锚点同时存在；试点期硬上限 4 条 invariant，覆盖 `spec-work` 与 `spec-code-review`。
- R4. `plan-template.md` 引入 `status` enum：`active | partially-shipped | completed | superseded`，并由 lint 校验声称 `completed` 的 plan 不能引用 `x-spec-first-workflow-integrated=false` 的 schema 作为已实施单元。
- R5. 自我应用：本方案落地后，`docs/plans/2026-05-11-001-feat-trellis-inspired-workflow-quality-plan.md` 的 status 必须从 `completed` 修正为 `partially-shipped`，并附 follow-up 指向本 plan。
- R6. 守护 §11 反向 guard：本方案不引入 per-turn hook、不复制 Trellis active task / `task.json.status`、不扩展 invariant lens 到所有 public workflow、不动 contract depth gate 与 research artifact landing 这两个尚未具备 consumer 的 design question。
- R7. Source / runtime / generated 边界严格遵守：所有改动在 source skill / contracts / src/cli / tests 中完成，不手改 `.claude/`、`.codex/`、`.agents/skills/` 等 generated runtime 镜像。
- R8. Trigger 决策树由 LLM 在 closeout 时按枚举链评估；script 只提供候选信号字段（task-pack 路径存在、validation `not-run` 字段非空、graph evidence grade 等），不替 LLM 做语义判断。

---

## 产品验收 / 成功信号

| 阶段 | 用户结果级成功信号 | 反向验收 |
|------|--------------------|----------|
| 阶段 1 | 跑一次带 task-pack 的 `spec-work` 后，工作树出现 `.spec-first/workflows/spec-work/<workspace>/<run>/run.json`，final response `Artifacts:` 行包含该路径，且 `workflow_integrated=true`。 | 如果 closeout 仍只在 prose 中"建议调用"而 run.json 不落盘，或 final response 不含 `producer.reason_code`，不通过。 |
| 阶段 2 | 删除 `spec-work` SKILL.md 中任意一条 critical reminder 段时，`tests/unit/workflow-invariant-lens.test.js` 必须 fail，并给出 invariant id 与缺失 anchor 的具体定位。 | 如果删除 reminder 后所有 lint 与 unit 仍绿，或 lens 误报合法 prose 改写，不通过。 |
| 阶段 3 | `2026-05-11-001` plan 的 status 在本方案合并 PR 中从 `completed` 改为 `partially-shipped`；新增 lint 拒绝把它改回 `completed` 直到对应 schema flag 翻 true。 | 如果 plan completion taxonomy lint 不能阻止"声明先于实装"的回滚，或 escape hatch 设计成可被滥用的语义判断，不通过。 |

---

## Scope Boundaries

### In scope

- `skills/spec-work/SKILL.md` 与 `skills/spec-work/references/shipping-workflow.md` 中关于 run artifact closeout 的 prose 改写（gate 强度从 SHOULD 升到 MUST + reason_code）。
- `docs/contracts/workflows/spec-work-run-artifact.schema.json` 顶层 metadata 与 `producer.workflow_integrated` 字段的 schema 演进（const→enum）。
- `src/cli/helpers/spec-work-run-artifact.js` 内 `reason_code` enum 扩展。
- 新增 `tests/integration/spec-work-closeout-producer.test.js` fixture-backed integration test。
- 修改 `tests/unit/spec-work-run-artifact-contract.test.js` 与 `tests/unit/spec-work-contracts.test.js` 适应新合同。
- 新增 `tests/fixtures/workflow-invariants/{spec-work,spec-code-review}.json` invariant 清单。
- 新增 `tests/unit/workflow-invariant-lens.test.js` lens 实现。
- 修改 `skills/spec-plan/references/plan-template.md` `status` 字段说明。
- 新增 `tests/unit/plan-status-taxonomy.test.js` lint。
- 修改 `docs/plans/2026-05-11-001-feat-trellis-inspired-workflow-quality-plan.md` frontmatter status 与 follow-up 引用（仅在 U-A 完成后）。
- `CHANGELOG.md` 同步条目。

### Out of scope

- 不引入 per-turn hook、SessionStart 注入器或任何 runtime breadcrumb 机制。
- 不扩展 invariant lens 到 `spec-plan` / `spec-debug` / `spec-brainstorm` / `spec-compound` 等其他 public workflow（试点期硬上限 2 个 workflow / 4 条 invariant）。
- 不实现 `contract depth gate`（compound 升格判断）。
- 不实现 `research artifact landing`（尚无 consumer，是 design question）。
- 不修改 `producer_available` 字段语义。
- 不引入 run.json 的 retention policy 自动化（保留当前手动 prune 边界）。
- 不为 invariant 引入严重度分级、修复建议自动生成或与 review 工具集成。
- 不动 `ai-coding-harness.md` 的六层 Harness 边界。
- 不复制对标文档中 Trellis 的代码、prompt、schema 或大段 prose（AGPL 边界与 clean-room 纪律）。

### 后续单独处理

- Contract depth gate（spec-compound 升格判断）：等本方案落地、`run.json` 实际积累出真实 evidence 后再判断哪些 lesson 该升格为 contract test。
- Research artifact landing：当 `spec-plan` / `spec-debug` 中长 research 出现具体 consumer 时另开 design question plan。
- Invariant lens 扩面：本方案验证机制可维护性后，下一周期再讨论扩展到其他 public workflow。

---

## 假设

- A1. `~/.spec-first/.developer` 已存在（`name=reviewer, lang=zh`），CHANGELOG 作者解析依赖该 profile。
- A2. 当前分支 `leo-2026-05-27-gitnexus-update` 的工作会先收尾再切独立分支执行本方案，不混线。
- A3. Producer 实现 `src/cli/helpers/spec-work-run-artifact.js` 当前可用且通过既有测试。本方案需让 producer 接受 input payload 中显式 `workflow_integrated` 字段（默认 false 兼容历史）；fallback / error 路径硬编码 false 保持不变；这是真实逻辑改动，不是单纯 enum 扩展。
- A4. 当前所有 `docs/plans/*.md` frontmatter 中 `status` 字段已使用 `active | completed | superseded` 三个值（实证：`2026-05-20-001` 用 `superseded`），引入 `partially-shipped` 第四值不会破坏已存在 plan。
- A5. Trigger 决策树中"long task"等模糊判定保留 LLM 语义判断空间，不强制 script 自动化。

---

## 关键技术决策

### D1. 三 unit 同 PR 发布（发布捆绑，非回滚捆绑）

U-A（producer 闭环）+ U-B（invariant lens）+ U-C（completion taxonomy）必须在同一 PR 内交付，不允许分批发布。理由：U-A 是被守护对象，U-B 是守护机制，U-C 是防止该模式重发的纪律——单做任意一项都会让另外两项白做。

**注意区分发布捆绑与回滚捆绑**：本方案是**发布层面捆绑**（必须同 PR 上线），**不是回滚层面捆绑**（U-A 上线后失败可独立回滚而保留 U-B / U-C，因为 U-B / U-C 即使 U-A 翻 false 仍独立有价值）。具体回滚动作见 ## Rollback Procedure。

### D2. U-B 先于 U-A 落地

实施顺序上 lens fixture 与 test 先合，再写 U-A 的 prose 改动。理由：lens 是 prose 改动的护栏，必须先就位才能确保 U-A 上线那一刻起就被守护。

### D3. Schema 直接 const→enum，不引入 deprecation 期

`workflow_integrated` 字段从 `const: false` 改为 `enum: [true, false]`，顶层 `x-spec-first-workflow-integrated` 翻 `true`。理由：当前 reader 不依赖 const 值，schema v1 边界允许此演进；引入 deprecation 期反而会让 producer/consumer 长时间共存两套契约，制造新的"半成品"风险。

### D4. Trigger 决策树由 LLM 评估，不全自动化

4 个 durable evidence trigger（3 个明确结构信号 + 1 个语义兜底）写进 `shipping-workflow.md` Phase 4 Step 2.5 作为 LLM 评估清单；script 只在 producer payload schema 中 enforce `reason_code` 必须在新增 enum 内。理由：`substantive work` 判定本身需要语义评估，强行 script 化会要么过严要么过松。

**减法说明**：原方案设计 7 个 trigger，自审发现后 4 个（degraded-provider / handoff / compaction-resume / long-task）本质是同一个"是否值得留 evidence"的 LLM 判断的不同侧面，拆成独立 enum 制造虚假精度和认知负担。首版合并为单一 `trigger-substantive-work` 语义兜底。reason_code enum 从原方案 9 个（7 trigger + no-trigger-matched + producer-error）降到 6 个（4 trigger + no-trigger-matched + producer-error）。

### D5. Invariant lens 试点期硬上限 4 条 invariant / 2 个 workflow

不在第一版扩面。理由：先验证 lens 机制的可维护性（fixture 维护成本、误报率、prose 改写包容度）再谈覆盖面；扩面延后到下一周期由独立 plan 处理。

### D6. `2026-05-11-001` 状态修正放在 U-C 内、必须在 U-A 完成后

不允许先行修正。理由：lint 与 source 必须同步翻牌，避免出现"声明先于实装"的反向反模式。

### D7. 回滚 trigger（具体 deterministic signal）

整体或部分回滚条件（任一命中即触发，不再以模糊"卡住"判定）：

1. Stage 4 集成测试在 ≥ 3 次合理 fix attempt 后仍 fail（attempt 包括 fixture 调整、producer 接口微调、schema 字段修正；不包括"删除 trigger 让测试通过"这种回避型 fix）。
2. Schema 翻 true 后真实 fresh-source eval 中 ≥ 30% closeout 触发 `producer-error` reason（producer 内部错误率超过可接受阈值）。
3. 本方案改动让其他既有 contract test 倒退 ≥ 2 个，且无法通过本方案范围内的 source 修正补回。
4. 任一 Stage 在 7 自然日内无实质进展（commit / test / review 任一可观测状态变化）。
5. Stage 5 后发现 `2026-05-11-001` 修正引发其他依赖该 plan completed 状态的下游 artifact 失效。

回滚动作分两类：

- **U-A 范围回滚**（命中 #1, #2）：保留 U-B（invariant lens）、U-C（taxonomy lint），回滚 schema flag、producer 接口与 shipping-workflow.md Step 2.5；`2026-05-11-001` 保持 `partially-shipped`（不回到 completed）。
- **整体回滚**（命中 #3, #5）：全部 revert，记录失败原因到本 plan，标 `superseded`。

理由：发布层面捆绑（D1）保证三件事同 PR 上线；回滚层面允许 U-A 失败时保留 U-B / U-C——它们独立有价值，强制整体回滚反而会丢掉已经验证可工作的护栏机制。

### D8. Owner 简化修订（去过度设计）

本 plan 经 owner adversarial 自审后做了 3 处减法，去掉每个 unit 内部的"以防万一"层：

1. **Trigger 7 → 4**：原方案 7 个 trigger 中后 4 个本质是同一 LLM 判断的不同侧面，合并为单一 `trigger-substantive-work` 语义兜底。reason_code enum 9 → 6。
2. **Invariant lens 砍 `aliases[]`**：试点期 4 条 invariant 不需要同义词容错；alias 反而开了"换说法绕过 lens"的口子。首版只匹配 canonical phrase。
3. **Plan taxonomy 砍 escape hatch + `implements_schemas` 改可选**：`partially_shipped_reason` 与 status 字段双重表达，删除；`implements_schemas[]` 从"所有 plan 必填"降为"碰 contract schema 才填的可选字段"。

理由：本方案的目标是消除"plan completed → source 半实装"反模式；plan 自身也不该过度设计。简化后核心 source 改动量基本不变，但认知复杂度和预防性层显著下降，符合角色契约的 "Light contract" 与 CLAUDE.md "简洁优先"。原始设计意图保留在各 Open Question 中作为后续细化候选，不丢失。

---

## 高层技术设计

### 数据流

```text
spec-work Phase 4 closeout
  ├─ Step 2.5 [新增]: Evaluate Durable Evidence Triggers
  │    └─ LLM 按 4 trigger 决策树评估（3 个明确 + 1 个语义兜底）
  │         ├─ 命中 → 构造 closeout payload
  │         │    └─ exec: spec-first internal spec-work-run-artifact write
  │         │         ├─ schema validate (script-owned)
  │         │         ├─ atomic write to .spec-first/workflows/spec-work/.../run.json
  │         │         └─ return artifact path
  │         └─ 未命中 → 设 reason_code=no-trigger-matched
  └─ Step 4 Notify User
       └─ Final Response Artifacts: 行
            └─ run.json 路径 (若已写) | reason_code (若未写)
```

### 4 个 Durable Evidence Trigger 决策链（写入 shipping-workflow.md）

按顺序短路评估，命中即停。**首版只保留 3 个明确的结构信号 + 1 个语义兜底**——原 7-trigger 设计中的 `degraded-provider` / `handoff` / `compaction-resume` / `long-task` 本质都是"这次工作是否重要到值得留 evidence"的不同侧面，LLM 实际判断时不会精确区分，拆成 4 个 enum 是虚假精度。合并为单一语义兜底 `trigger-substantive-work`，由 LLM 判断。

1. `trigger-task-pack`：输入是 task-pack 路径且 validate 通过（最强结构信号）。
2. `trigger-not-run-validation`：Phase 2 任意 verification 状态为 `not-run`（高风险：测试没跑）。
3. `trigger-deferred-follow-up`：closeout 输出含 `deferred_follow_up[]` 非空（必须留痕：有未完成项）。
4. `trigger-substantive-work`：语义兜底。本次工作重要到值得留 evidence——吸收原 degraded-provider（消费过的 graph evidence 是 stale/fallback）、handoff（移交 review/compound/release）、compaction-resume（会话经历过压缩）、long-task（规模/时长足以让上下文被压缩或指令遗忘）四种意图，由 LLM 语义判断，不引入数字阈值。
5. 全部未命中：`no-trigger-matched`，可跳过写 run.json，但 final response 仍需说明 reason_code。

阈值不进 schema enforce——保持语义判断空间。`trigger-substantive-work` **不写具体数字**，避免凭空给阈值反而把决策刚性化。落地 1-2 周后按真实 run.json 数据观察 `trigger-substantive-work` 命中频率是否需要进一步细化（参见 ## Open Questions C-trigger）。

### Invariant Lens 数据结构

`tests/fixtures/workflow-invariants/<workflow>.json`:

```json
[
  {
    "id": "<kebab-case-id>",
    "gate_phrase": "<canonical phrase>",
    "must_appear_in": [
      {"file": "skills/spec-work/SKILL.md", "anchor": "## Run Artifact Boundary"},
      {"file": "skills/spec-work/references/shipping-workflow.md", "anchor": "## Phase 4: Ship It"}
    ]
  }
]
```

**减法说明**：原方案 fixture 设计了 `aliases[]` 字段以容忍 prose 风格改写。自审发现这在 4 条 invariant 的试点期是纯预防性复杂度，且开了"换个说法绕过 lens"的口子，反而削弱守护。首版**砍掉 `aliases[]`**，只匹配 canonical `gate_phrase`（phrase 从当前 SKILL.md 实际文本提取）。如果实际运行误报率高（Open Question C-lens-noise），下个周期再加 alias。

Lens test 逻辑：

- 读 fixture，对每条 invariant：在每个 `must_appear_in[]` 项中定位 anchor heading 起到下一个同级 heading 的段落，搜索 `gate_phrase` 是否出现（大小写不敏感）。
- 任一锚点缺失 → fail，error 给出 invariant id + 缺失 anchor 完整路径 + 建议添加的 phrase。
- 单个 invariant `must_appear_in[]` 长度 ≤ 4，超出报 fixture 自身错误。

### Plan Status Taxonomy Lint 数据结构

`tests/unit/plan-status-taxonomy.test.js` 逻辑：

1. 读 `docs/plans/*.md`，parse YAML frontmatter。
2. 对 `status` 字段：如果非 enum 内值且非 legacy 缺失，fail；legacy 缺失给 warning。
3. 对 `status: completed` **且** frontmatter 含非空 `implements_schemas[]` 的 plan：遍历 `implements_schemas[]` 中每条 schema 路径：
   - 读对应 schema 顶层 `x-spec-first-workflow-integrated`，若为 false 则 fail，要求改为 `partially-shipped` 或把该 schema 移出 `implements_schemas`。
   - **只扫 `implements_schemas[]` 字段，不做 free-text scan**（free-text scan 会把任何提到 schema 的 plan 误判为实施了它）。
4. plan 无 `implements_schemas` 字段（docs-only / 纯 prose plan）时跳过 schema flag 检查——该字段可选，不给所有 plan 强加负担。

---

## 实施单元

### U-A. spec-work Run Artifact 闭环

**目标：** 让 `spec-work` closeout 在 4 个 durable evidence trigger 命中时真实调用 producer 写出 run.json，schema flag 翻 true 由 fixture-backed integration test 守护。

**对应需求：** R1, R2, R7, R8

**依赖：** U-B（invariant lens 必须先就位才能守护 U-A 的 prose 改动）

**文件：**

- 修改: `skills/spec-work/references/shipping-workflow.md`（在 Phase 4 Step 2 后插入 Step 2.5）
- 修改: `skills/spec-work/SKILL.md`（升级 Run Artifact Boundary 段：SHOULD → MUST + reason_code 必填）
- 修改: `docs/contracts/workflows/spec-work-run-artifact.schema.json`（顶层 `x-spec-first-workflow-integrated: true`；`producer.workflow_integrated` 由 `const: false` 改 `enum: [true, false]`；`producer.reason_code` 增加 enum 约束）
- 修改: `src/cli/helpers/spec-work-run-artifact.js`：实证显示该文件**有 10 处硬编码 `workflow_integrated: false`**（grep 确认，集中在 fallback / error / not-implemented payload 路径）。本 unit 必须做：(1) 让 producer 接受 input payload 中显式的 `workflow_integrated` 字段（由调用方在命中 trigger 调用时传入 true）；(2) input 未声明时使用 fallback 默认 false；(3) 所有原 fallback / error 路径保持 false（producer 内部错误情形不应误标 true）。这是真正的逻辑改动，不是单纯 enum 扩展。
- 修改: `tests/unit/spec-work-run-artifact-contract.test.js`：(1) line 115 断言由"workflow_integrated === false"改为"顶层 `x-spec-first-workflow-integrated === true`"；(2) **line 208-211 反向断言必须翻转重写**——原断言验证 schema 拒绝 true（`'value true does not equal const false'`），新断言应验证 true 与 false 同时合法（enum 包含两值）；(3) 增加新 case 验证 producer 在 input 显式声明 `workflow_integrated: true` 时输出 true。
- 修改: `tests/unit/spec-work-run-artifact-producer.test.js`：覆盖新 reason_code enum；line 140 与 146 既有 fallback case 中的 `workflow_integrated: false` 保留——这些是 fallback 路径，仍合法。
- 修改: `tests/unit/spec-work-contracts.test.js`（增加 prose 断言：shipping-workflow.md Phase 4 必含 producer 调用 step）
- 新增: `tests/integration/spec-work-closeout-producer.test.js`（fixture-backed e2e：模拟带 trigger 的 closeout payload，验证写出符合 schema 的 run.json）
- 新增: `tests/fixtures/spec-work-closeout/trigger-task-pack/payload.json`（integration test 输入）
- 新增: `tests/fixtures/spec-work-closeout/trigger-task-pack/expected.json`（integration test 期望输出 shape）

**做法：**

1. 先写 integration test 与 fixture（test-first）。
2. 改 schema：移除 `producer.workflow_integrated` 的 `const`，改 `enum: [true, false]`，顶层 `x-spec-first-workflow-integrated` 与 `description` 同步翻牌。`producer.reason_code` 加 enum 约束（5 个值：`trigger-task-pack` / `trigger-not-run-validation` / `trigger-deferred-follow-up` / `trigger-substantive-work` / `no-trigger-matched`，外加错误码 `producer-error`）。
3. 改 producer 的 reason_code 接受逻辑（schema validate 已经替代大部分 enforce，producer 内部仅需放开旧白名单）。
4. 改 prose：`shipping-workflow.md` Phase 4 Step 2.5 完整写出 7-trigger 决策链与执行命令；`SKILL.md` Run Artifact Boundary 段升级 gate 强度。
5. 跑 integration test 与既有 unit test 全绿。

**执行姿态：** Test-first。先 fail 出 integration test，再做 schema/producer/prose 三处协同改动让其绿。

**遵循模式：**

- `docs/contracts/workflows/spec-work-run-artifact.schema.json` 既有结构。
- `tests/unit/spec-work-run-artifact-producer.test.js` 既有 fixture 风格。
- `docs/contracts/graph-evidence-policy.md` 中 `evidence_grade` / `evidence_posture` enum 设计风格。

**测试场景：**

- 正常路径：task-pack closeout payload 中显式声明 `workflow_integrated=true` → run.json 落盘且通过 schema validate；artifact 中 producer.workflow_integrated=true。
- 边界：no-trigger-matched 路径不写 run.json，但 final response 含 reason_code（contract test 验 prose）。
- 边界：input payload 未声明 `workflow_integrated` → producer 输出 fallback false（向后兼容历史调用方）。
- 错误路径：producer 写入失败时，artifact reason_code=`producer-error`，且 final response 必须显式声明该 reason；任何调用 plan 不得因此被标 completed（**真正的反向 failure mode**）。
- 反向：删除 shipping-workflow.md Step 2.5（producer 调用 step） → `tests/unit/spec-work-contracts.test.js` prose 断言必须 fail；同时 `workflow-invariant-lens.test.js` 也应捕获 reminder/gate 不一致（U-B 守护机制实证）。

**验证：**

- `npm run test:integration`
- `npm run test:unit`
- `npm test`
- 手动 fresh-source eval（实施期具体化）：fresh-source eval 不是 CLI 命令；本方案 Stage 4 验证应在 fresh chat 中以宿主 workflow 触发（Claude `spec-work <task-pack-path>` 或 Codex 等价入口）跑一次 spec-work，验证 closeout 写出 run.json 并被 final response 引用；或退化为直接 `spec-first internal spec-work-run-artifact write --input <fixture>` 验证 schema 通过（不构成端到端实证，只验证 producer 行为）。两种验证路径选择见 ## Open Questions C2。

---

### U-B. Workflow Invariant Lens 试点

**目标：** 引入 source-time deterministic contract test，守护 `spec-work` 与 `spec-code-review` 中 4 条 critical invariant 在 reminder / gate 多锚点同时存在。

**对应需求：** R3, R7

**依赖：** 无（必须先于 U-A 落地）

**文件：**

- 新增: `tests/fixtures/workflow-invariants/spec-work.json`（2 条 invariant）
- 新增: `tests/fixtures/workflow-invariants/spec-code-review.json`（2 条 invariant）
- 新增: `tests/unit/workflow-invariant-lens.test.js`
- 修改: `package.json`（如有必要把 `tests/fixtures/workflow-invariants/` 加入 jest 路径白名单，多数情况下既有配置已覆盖）

**Invariant 清单：**

`spec-work.json`:

1. `id: run-artifact-trigger-required` — `gate_phrase: "durable evidence trigger"` — 必现于 `## Run Artifact Boundary` 与 `## Phase 4: Ship It` 两个锚点。
2. `id: feedback-loop-first` — `gate_phrase: "establish a feedback loop"` — 必现于 Phase 2 执行段与 `## Key Principles` / `## Common Pitfalls` 任一锚点。

`spec-code-review.json`:

1. `id: provider-evidence-advisory` — `gate_phrase: "provider evidence is advisory"` — 必现于 contract summary 与 review 终段。
2. `id: source-validation-required` — `gate_phrase: "diff/source/test"` — 必现于 finding 验证段与 closeout 段。

（最终具体 phrase / anchor 在实施期对照当前 SKILL.md 文本敲定，本节列定向意图。）

**做法：**

1. 先按当前 `spec-work` 与 `spec-code-review` SKILL.md 实际文本提取已存在的 critical phrase，敲定 fixture。
2. 写 lens test：parse markdown heading tree（用既有项目中的 markdown 工具或简单 regex），按 anchor 切片，对每条 invariant 做 canonical `gate_phrase` 匹配（大小写不敏感，无 alias 容错）。
3. 跑 test，确保所有 4 条 invariant 当前都通过（如果不通过，说明 fixture phrase 与现实脱节，调整 fixture 而非改 source）。
4. 反向验证：临时删除 `## Run Artifact Boundary` 段中的 "durable evidence trigger" 关键短语，确认 test 立刻 fail 并报准确位置。

**执行姿态：** Fixture-first。先固化 invariant 清单，再写 test 实现。

**遵循模式：**

- `tests/unit/lint-skill-entrypoints.test.js` 的 source-side prose check 风格。
- `tests/unit/spec-work-contracts.test.js` 的 contract assertion 风格。

**测试场景：**

- 正常：4 条 invariant 全部锚点命中。
- 反向（关键）：人为删除 SKILL.md 中任一 invariant 在某锚点的 phrase → test 必须 fail，error 含 invariant id + 缺失 anchor 路径。
- 边界：invariant fixture 写错 anchor 名 → test 也应 fail（防止 fixture 自身静默失效）。
- 边界：fixture `must_appear_in[]` 长度 > 4 时 fail（防止把 lens 变成"每段都得喊一遍"的 token 浪费）。

**验证：**

- `npm run test:unit`

---

### U-C. Plan Completion Taxonomy 收紧

**目标：** 把 plan completion 状态枚举写进 source 并由 lint 强制；自我应用纪律修正 `2026-05-11-001` 状态。

**对应需求：** R4, R5, R7

**依赖：** U-A 完成（必须先有 schema flag=true，才能让 lint 与现实不冲突）

**文件：**

- 修改: `skills/spec-plan/references/plan-template.md`（`status` 字段说明加 enum 注释；新增可选 "Completion Criteria" 小节模板说明）
- 新增: `tests/unit/plan-status-taxonomy.test.js`
- 修改: `docs/plans/2026-05-11-001-feat-trellis-inspired-workflow-quality-plan.md`（status 由 `completed` 改为 `partially-shipped`；新增 follow-up 引用本 plan）

**做法：**

1. **plan-template.md 引入可选 frontmatter 字段**：plan 在 frontmatter 中通过 `implements_schemas: [<repo-relative path>, ...]` 字段显式列出本 plan 实际实施的 contract schema 路径。**lint 只扫这个字段，不做 free-text scan**——free-text scan 会大量误判（任何 plan 提到一个 schema 都会被关联）。该字段**可选**：docs-only / 纯 prose / 不碰任何 contract schema 的 plan 不填，lint 跳过 schema flag 检查。这避免给所有 plan 强加无谓负担。
2. 写 lint test：扫 `docs/plans/*.md` frontmatter，检查 (a) `status` enum；(b) 仅对 `status: completed` **且** `implements_schemas[]` 非空的 plan，遍历每条路径，读对应 schema 顶层 `x-spec-first-workflow-integrated`，若任一为 false 则 fail，要求改 `partially-shipped` 或把该 schema 移出 `implements_schemas`。
3. 修改 `plan-template.md`：`status: active` 注释改为 `status: active  # active | partially-shipped | completed | superseded`；新增可选 `implements_schemas: []` 字段说明（不实施 contract schema 时省略或留空）；可选 "Completion Criteria" 小节给出"列出本 plan 完成时仍然 deferred 的 schema flag / contract status / runtime asset"模板。
4. 修正 `2026-05-11-001`：frontmatter status 改 `partially-shipped`，新增 `implements_schemas: ['docs/contracts/workflows/spec-work-run-artifact.schema.json']`；正文末尾 "## Status 说明" 段补充修正原因（U3 schema flag 在本方案前长期为 false，由 `2026-05-28-004` 收口）——半成品原因写在正文 ## Status 说明段即可，**不引入单独的 frontmatter reason 字段**。
5. 跑 lint 全绿。

**减法说明**：原方案引入 `partially_shipped_reason` escape hatch frontmatter 字段。自审发现 `status: partially-shipped` 本身已表达"半成品"，再加一个 reason 字段是双重表达；半成品原因写在正文 ## Status 说明段更自然、更可读。首版**砍掉 escape hatch 字段**，`implements_schemas` 也从"所有 plan 必填空数组"降为"碰 contract schema 才填的可选字段"。

**执行姿态：** Test-first。先写 lint 测试覆盖正例与反例，再做实际状态修正。

**遵循模式：**

- 既有 `tests/unit/changelog-format.test.js` 的 frontmatter scan 风格。
- 既有 `tests/unit/init-plan.test.js` 的 plan template fixture 风格。

**测试场景：**

- 正常：当前所有 plan frontmatter 通过 enum 校验。
- 反向（关键）：把 `2026-05-11-001` 改回 `completed`（保留 `implements_schemas` 指向 false-flag schema）时 lint 应 fail，error 提示哪个 schema flag 仍是 false。
- 边界：legacy plan 没有 `status` 字段时 lint 给 warning 不 fail（避免回填式破坏）。
- 边界：plan 没有 `implements_schemas` 字段（docs-only / 纯 prose plan）时 lint 跳过 schema flag 检查，即使 status=completed 也通过。

**验证：**

- `npm run test:unit`
- `npm test`

---

## 系统影响

| 系统面 | 影响 |
| --- | --- |
| Source-of-truth | `skills/spec-work/`、`skills/spec-plan/references/plan-template.md`、`docs/contracts/workflows/spec-work-run-artifact.schema.json`、`src/cli/helpers/spec-work-run-artifact.js` |
| Tests | 新增 1 个 integration test、2 个 unit test、4 个 invariant fixture；修改 3 个既有 contract test |
| Generated runtime | 不直接修改；本 plan 落地后需运行 `spec-first init --claude --codex` 重新生成 host runtime |
| 用户面 | `spec-work` 在 trigger 命中时会真正写出 run.json（user-visible behavior 变化）；`spec-plan` 文档增加新 status enum 说明 |
| 其他 plan | `2026-05-11-001` status 修正（user-visible）；后续 plan 在 frontmatter 中可使用新枚举值 |
| Provider / MCP | 无影响 |
| 双宿主 | 一致：所有改动在 source 完成，`init` 重新生成时 Claude / Codex 同步 |

---

## 风险与依赖

| 风险 | 等级 | 缓解 |
| --- | --- | --- |
| Trigger 决策树写进 prose 后，LLM 在长会话中仍可能漏判 | 中 | U-B lens 守护 trigger 列表与 final response contract 共存；schema 强制 `producer.reason_code` 必填，缺失 producer schema validate 直接拒 |
| Schema 翻 true 后旧版 run.json 仍写 `workflow_integrated=false` | 低 | enum: [true, false] 两值都合法；reader 不依赖 const |
| Invariant lens 误报（prose 风格变化） | 中 | 首版只匹配 canonical phrase（无 alias）；初始只 4 条，owner 维护成本可控；误报率高时下个周期再加 alias（C-lens-noise） |
| Plan taxonomy lint 阻塞历史 plan | 低 | legacy plan 无 `implements_schemas` 字段只 warn 不 fail；docs-only plan 不填该字段，lint 跳过 |
| 本方案自身变成新的"半成品 schema 循环" | 高 | Stage 5 强制 `2026-05-11-001` 修正为 partially-shipped；本方案的 completion 判定也用新 taxonomy；命中 D7 任一 deterministic signal 即回滚 |
| 与 `leo-2026-05-27-gitnexus-update` 分支冲突 | 低 | 严格 Stage 1 → Stage 2 顺序，不混线 |
| `trigger-substantive-work` 语义兜底过宽或过窄 | 中 | 首版不写数字阈值，纯 LLM 判断；落地 1-2 周后按真实 run.json 命中分布观察是否需细化（C-trigger） |
| Integration test fixture 维护成本 | 低 | 只为 `trigger-task-pack` 一条 happy path 写完整 fixture，其余 trigger 通过 unit test 覆盖 |

依赖：

- 假定 `~/.spec-first/.developer` 全局 profile 已就位（CHANGELOG 作者解析）。
- 假定当前 producer 实现稳定，不依赖外部 MCP / 网络。

---

## 分阶段交付

| Stage | 范围 | 完成判据 |
| --- | --- | --- |
| Stage 1 | 当前 `leo-2026-05-27-gitnexus-update` 分支收尾 | 该分支已 merge 或 close |
| Stage 2 | 切新分支 `feat-spec-work-run-evidence-and-invariant-lens`；本 plan 已注册 spec-id 并写入 `docs/plans/` | plan 文件存在且 frontmatter status=active |
| Stage 3 | U-B 落地（fixture + lens test） | `npm run test:unit` 含 lens test 全绿 |
| Stage 4 | U-A 落地（schema + producer wiring + integration test + skill prose） | `npm run test:integration` 与 `npm run test:unit` 全绿；fresh-source eval 跑出真实 run.json |
| Stage 5 | U-C 落地（taxonomy lint + plan-template + 修正 `2026-05-11-001`） | `npm run test:unit` 含 taxonomy lint 全绿；`2026-05-11-001` frontmatter 已改 `partially-shipped` |
| Stage 6 | `spec-first init --claude --codex` 重生成 generated runtime；`npm run lint:skill-entrypoints`；`npm test` 全链路 | 所有 verification 命令通过；CHANGELOG 已更新 |

回滚 trigger 见 D7（具体 deterministic signal 替代模糊"卡住"判定）。

---

## 验证

- `npm run typecheck`
- `npm run lint:skill-entrypoints`
- `npm run test:unit`
- `npm run test:integration`
- `npm test`
- `npm run build`
- 端到端验证（实施期按 Open Questions C2 选择具体路径）：
  - **首选 host-driven**：fresh chat 中以宿主 workflow 入口（Claude `spec-work <task-pack-path>` 或 Codex 等价）跑一次 spec-work，验证 `.spec-first/workflows/spec-work/<workspace>/<run>/run.json` 实际生成并通过 schema validate；final response `Artifacts:` 行包含该路径；`producer.workflow_integrated=true`；`producer.reason_code` 在新 enum 内。
  - **退化 producer-level**：构造命中 `trigger-task-pack` 的 closeout payload fixture，直接 `spec-first internal spec-work-run-artifact write --input <fixture>` 验证 producer 行为。该方式**不构成端到端实证**，仅作为宿主 workflow 验证不可行时的降级。
- `spec-first doctor --claude --codex`：双宿主 runtime 状态绿
- 反向验证：手动临时删除 `spec-work` SKILL.md 中 `## Run Artifact Boundary` 段任一 invariant phrase → `npm run test:unit` 必须 fail 并报具体 invariant id（验证 lens 真守护，不是装饰）

---

## Rollback Procedure

回滚行为按 D7 trigger 分类：

**U-A 范围回滚**（D7 #1, #2 命中）：

1. 回滚 schema：`x-spec-first-workflow-integrated` 改回 `false`、`producer.workflow_integrated` 由 `enum: [true, false]` 改回 `const: false`。
2. 回滚 producer 接口：移除 input 中 `workflow_integrated` 字段接受逻辑；保留 reason_code enum 扩展（这部分独立有价值）。
3. 回滚 `tests/unit/spec-work-run-artifact-contract.test.js` line 115 与 line 208-211 反向断言。
4. 回滚 `shipping-workflow.md` Step 2.5 与 `spec-work/SKILL.md` Run Artifact Boundary 段升级。
5. 保留 U-B（invariant lens 已落地部分）—— 独立有价值，不依赖 U-A 翻牌。
6. 保留 U-C 中 plan-template enum 与 lint；但 `2026-05-11-001` 仍维持 `partially-shipped`（不回到 completed —— 因为它客观上仍是 partially-shipped）。
7. 在 `2026-05-11-001` 中追加 follow-up 说明："本方案 `2026-05-28-004` 在 Stage 4 回滚，run artifact 闭环仍 deferred；下次复活需要重新评估 producer 接口设计"。

**整体回滚**（D7 #3, #5 命中）：

1. 全部 revert U-A、U-B、U-C 改动。
2. 本 plan 标 `superseded`，记录回滚原因。
3. `2026-05-11-001` 维持原 `completed` 状态不动（因为新 lint 也回滚了）—— 但记录"该 plan 实施债仍在"作为长期 follow-up，由后续新 plan 重启。

---

## Open Questions

1. **C-trigger**：`trigger-substantive-work` 语义兜底首版不引入数字阈值，完全靠 LLM 语义判断。落地 1-2 周后看真实 run.json 数据：(a) 命中频率是否合理（过高=噪音，过低=漏写 evidence）；(b) 是否需要把兜底细化回独立 trigger（degraded-provider / handoff / compaction-resume / long-task 是原始拆分意图，留作细化候选）；(c) 是否需要 deterministic 阈值。本周期不预设。
2. **C2**：fresh-source eval 具体执行路径——首版接受两种验证方式（详见 U-A 验证段）；选择交给 Stage 4 实施期，按当时宿主能力决定。如端到端 host-driven workflow 验证不可行，至少做 producer-level fixture 验证。
3. **C3**：`partially-shipped` 新值是否影响 `spec-plan` SKILL 中关于 status 的判断逻辑？Stage 5 落地前必须 grep `skills/spec-plan/` 中所有 `status` 字段判断，如有"假设 status 只有 active/completed/superseded"的硬编码逻辑，同步修正。本 plan 不预测影响面。
4. **C4**：producer 调用延迟若 > 500ms 是否需要 async 路径？暂不优化，按现有 atomic write + schema validate 实测延迟决定；如真成 closeout 体感问题，下个周期单独评估。
5. **C-lens-noise**：Invariant lens 首版只匹配 canonical phrase（无 alias）。如果实际运行中 prose 正常改写频繁触发误报，下个周期评估是否加 `aliases[]`，或改为 markdown 锚点 + 标签注释式守护。试点期 4 条 invariant 容量小，问题暴露后再决定。
6. **C-compaction**（业界对标盲区）：run.json `resume_evidence` 未对接 host compaction 信号，而 Anthropic 把 compaction 列为 long-horizon 第一杠杆。本周期不解决（依赖 U-A 落地 + host 暴露信号）。详见路线图 `O-compaction`。
7. **C-workflow-metric**（业界对标盲区）：成功信号停在"机制通了"，未度量"evidence 是否被下游有效消费"（调用 ≠ 价值），而 workflow-level 质量度量是业界空白。本周期不解决（依赖 U-A 落地 + 真实样本）。详见路线图 `O-workflow-metric`。

---

## Test Expectation

新增/修改测试覆盖：

- `tests/integration/spec-work-closeout-producer.test.js`（新增，1 happy path + 2 边界）
- `tests/unit/workflow-invariant-lens.test.js`（新增，4 invariant + 2 反向 + 2 边界）
- `tests/unit/plan-status-taxonomy.test.js`（新增，正例 + 反例 + escape hatch + legacy）
- `tests/unit/spec-work-run-artifact-contract.test.js`（修改 line 115 周边）
- `tests/unit/spec-work-run-artifact-producer.test.js`（reason_code enum 扩展覆盖）
- `tests/unit/spec-work-contracts.test.js`（增加 prose 断言：shipping-workflow.md Phase 4 必含 producer 调用 step）

不需要新增 e2e 测试——integration test 已覆盖端到端写入路径。

---

## Context & Research

### 相关代码与模式

- `docs/09-业界借鉴/2026-05-27-Trellis-纵向钻探与spec-first质量提升分析.md`：本方案 origin。§5、§8、§13 是核心论点来源；§9、§11 是反向 guard 来源；§10 标注本方案 delta（required-gate visibility 列入"Adds delta to U1 / U8"）。
- `docs/contracts/ai-coding-harness.md`：六层 Harness 边界，本方案动作落在 Execution Harness（U-A run evidence handoff）和 Governance Harness（U-B/U-C source-time guard）。
- `docs/contracts/workflows/spec-work-run-artifact.schema.json`：U-A 改造目标。
- `src/cli/helpers/spec-work-run-artifact.js`：producer 实现，本方案需让其接受 input 中显式 `workflow_integrated` 字段；10 处既有 fallback / error 路径硬编码 false 保持不变。
- `src/cli/commands/internal.js`：subcommand 路由，本方案不改。
- `skills/spec-work/SKILL.md`、`skills/spec-work/references/shipping-workflow.md`：U-A prose 改造目标。
- `skills/spec-plan/references/plan-template.md`：U-C 改造目标。
- `tests/unit/spec-work-run-artifact-contract.test.js`、`tests/unit/spec-work-run-artifact-producer.test.js`、`tests/unit/spec-work-contracts.test.js`、`tests/unit/lint-skill-entrypoints.test.js`、`tests/unit/changelog-format.test.js`：既有测试形态参考。

### 项目沉淀

- `docs/plans/2026-05-11-001-feat-trellis-inspired-workflow-quality-plan.md` U3 段：本方案处理的就是 U3 的"已设计未实装"残留；本方案落地后该 plan 状态需修正。
- `docs/plans/2026-05-20-001-fix-spec-work-skill-quality-plan.md`：`status: superseded` 形态参考。
- `docs/contracts/workflows/fresh-source-eval-checklist.md`：U-A 验证执行依据。
- `docs/contracts/source-runtime-customization-boundary.md`：本方案严格遵守的 source/runtime 边界。
- `docs/contracts/graph-evidence-policy.md`：`trigger-substantive-work` 语义兜底中 degraded 侧面（消费过的 graph evidence 是 stale/fallback）的 evidence_grade / posture 取值依据。

### 外部对照

- 对标文档 §5：把"周期性冗余"从 runtime hook 迁移到 source-time test 的论证，是 U-B 的设计依据。
- 对标文档 §8：journal 的本质是"恢复因果链"，是 U-A 的设计依据。
- 对标文档 §11：明确不复制 Trellis 的 active task / per-turn hook / `task.json.status`，是 R6 的反向 guard 依据。
- AGPL clean-room：本方案不复制 Trellis 任何 prose / schema / prompt。

### 业界一手对标（2026-05-29 检索）

> 检索方式：本会话 WebSearch / exa / WebFetch 均被网络策略阻断，改用本机 `curl` 直接抓取以下公开来源（真实一手内容）。

- [Anthropic *Effective context engineering for AI agents*](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)：long-horizon 三机制 compaction / structured note-taking / sub-agent。U-A run.json 命中 **structured note-taking**；compaction 未对接是盲区（C-compaction）。
- [github/spec-kit](https://github.com/github/spec-kit)：主张 spec 生成 code、持续一致性校验。spec-first 走不同哲学（code 是一等资产、人保留控制），不学其"spec 生成 code"。
- 两份一手文档均无"用 deterministic test 守护 agent 自身 workflow"机制——印证 **U-B 是 spec-first 领先业界的差异化点**。
- workflow-level 质量度量在一手文档与主流 benchmark 中均空白（C-workflow-metric）。

---

## Graph Readiness

- status: degraded-fallback
- source_revision: `8dc7e77627d1f38286d91bf1f4af11831dd6a766`（compiled snapshot）
- current_revision: `8777b576...` (HEAD on `leo-2026-05-27-gitnexus-update`)
- stale: snapshot mismatch（compiled graph 早于当前 HEAD）；`worktree_dirty=clean`
- primary_providers: `gitnexus`
- capabilities: `query/context=full`, `impact=none`, `review=none`
- limitations: snapshot_mismatch, definitions_only_no_process_graph, definitions_only_no_impact_evidence, definitions_only_no_related_tests
- fallback: 直接源码读取（已对照 `src/cli/helpers/spec-work-run-artifact.js`、`docs/contracts/workflows/spec-work-run-artifact.schema.json`、`skills/spec-work/`、`skills/spec-plan/references/plan-template.md`、既有测试文件），grep 与 Read 验证关键字段位置。
- runtime_mcp_evidence: 无（本 plan 撰写期间未调用 GitNexus live query）
- confidence: 高（源码与契约直接读取确认所有断言）；中（Stage 6 generated runtime 重生成的双宿主 diff 影响面需在执行期再确认）
- 后续：如 U-A Stage 4 需要 impact 分析（例如 evaluate spec-work 调用方），可考虑在 implementation 阶段执行 `spec-graph-bootstrap` 刷新；本 plan 撰写阶段直接读源即可。

---

## Downstream Handoff

- 后续 `spec-work` 实施者：按 Stage 1-6 顺序，先 U-B 后 U-A 后 U-C；不允许跳序；回滚 trigger 见 D7。
- `spec-code-review` 实施者：U-B 试点期对 `spec-code-review` 增 2 条 invariant，需对照当前 SKILL.md 实际文本敲定 phrase（不发明 phrase）。
- `spec-compound`：本方案不直接接入；落地后如出现"哪些 lesson 该升格为 contract test"问题，单独评估 contract depth gate（已显式 deferred）。
- 文档面：`README.md` / `README.zh-CN.md` 不需要更新（本方案是治理与 contract 收紧，无需用户面 onboarding 改写）。`CHANGELOG.md` 必更（多个 user-visible 条目）。
- Generated runtime：Stage 6 必跑 `spec-first init --claude --codex` 让双宿主 SKILL.md 内容同步。
- **路线图衔接**：本 plan 是 `docs/06-待办事项/2026-05-28-spec-first-用户体感提升路线图.md` 的必要前置。Stage 6 完成后才允许启动路线图 P-friction（用户摩擦实证审计）的 plan 起草；P-friction 完成后才能决定 P-task-pack-default / P-review-inline / P-graph-primary 是否启动以及优先级。本 plan 实施期不得扩大到路线图后续 candidate 范围。

---

## Plan Sign-off

- Owner: reviewer (per `~/.spec-first/.developer`)
- 起草日期: 2026-05-28
- Origin: 对话级 owner decision → 本 plan
- Status: active
- 启动条件: Stage 1（`leo-2026-05-27-gitnexus-update` 分支收尾）完成
- 终止条件: Stage 6 全部 verification 命令通过、`2026-05-11-001` status 已修正、CHANGELOG 已记录、双宿主 generated runtime 已重生成；或 D7 触发整体回滚
- 完成判定使用本 plan 引入的新 taxonomy：U-A 落地后才允许标 `completed`；任何 schema flag 翻 true 之外的 deferred 项必须显式列入 follow-up
