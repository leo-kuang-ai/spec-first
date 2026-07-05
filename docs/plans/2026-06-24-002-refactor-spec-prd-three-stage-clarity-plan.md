---
title: "refactor: spec-prd product-expert-led clarification"
type: refactor
status: completed
date: 2026-06-24
spec_id: 2026-06-24-002-spec-prd-product-expert-led-clarification
origin: in-conversation owner target statement (2026-06-24)
supersedes: docs/plans/2026-06-24-001-refactor-spec-prd-two-stage-grill-prd-adapter-plan.md
implements_schemas: []
---

# refactor: spec-prd product-expert-led clarification

## Summary

本方案重新从目标倒推 `spec-prd`，不把当前 `skills/spec-prd/**` 的既有结构当作上限。目标不是“把 grill 和 PRD template 串起来”，而是在需求阶段提前暴露并确认后续 `spec-plan`、任务拆分、`spec-work` 会追问的产品细节，避免下游发明 WHAT。

结论：需要把“顶尖产品专家”的判断能力引入 `spec-prd`，但第一步应作为 **first-class internal Product Expert Lens**，而不是新增 public workflow 或默认独立 agent。它的职责是像资深产品负责人一样识别用户、场景、目标结果、业务约束、范围边界、异常、权限、验收和 owner 决策点，再驱动 Requirements Grill 提问和 PRD 写入。高风险场景可以升级为独立 product reviewer，但默认仍由 `spec-prd` inline 承担。

---

## Decision Brief

- **Recommended approach:** 重构 `spec-prd` 为 `Product Expert Lens -> Requirements Grill -> Standard PRD Write-In -> Readiness Lens`。
- **Key decision:** Product Expert Lens 是 `spec-prd` 的核心判断层，不只是 `prd-output-template.md` 里的输出质量清单；它应在 grill 前产生 load-bearing WHAT gaps，并在 readiness 时验证这些 gaps 是否被关闭或显式 carry。
- **Role boundary:** 不新增 `spec-product-expert`、不暴露 helper agent；必要时只在高风险触发下用 delegated product reviewer 做独立 critique，且最终判断仍回到 `spec-prd` orchestrator。
- **Why this is not over-engineering:** 当前目标的瓶颈不是“问得不够多”，而是“问的问题是否具备顶尖产品判断”。没有产品专家 lens，grill 容易变成机械 checklist，readiness 只能事后发现下游仍会问。

---

## Problem Frame

当前用户目标已经闭合：

```text
澄清需求文档
前置暴露并确认后续技术方案 / 任务 / 开发阶段会追问的产品细节
减少下游确认和 WHAT 发明
```

这要求 `spec-prd` 具备三类能力：

1. **事实校准能力**：源代码、文档、测试、历史 PRD 能回答当前系统是什么。
2. **产品判断能力**：识别目标用户、使用场景、业务结果、优先级、边界、异常、权限、验收和 owner 拍板点。
3. **交付写入能力**：把已闭合的判断写进标准 PRD，并把未闭合项以假设、Outstanding Questions、blocker 或 Planning Recheck 形式显式 carry。

当前实现已经很强地覆盖 1 和 3，也覆盖了部分 2；入口层也已经有 Product Expert Lens 的概念锚点（mental map / Core Principles）。真实缺口不是入口概念为空，而是 canonical source 仍在 `prd-output-template.md`，Phase 1 仍指向旧 `Adaptive Product Expert Lens`，且 grill / readiness / reference trigger 的消费链还没有统一到一个 first-class、default-hot-path 的产品判断接口。这是当前实现可能限制目标的地方。

---

## Target Architecture

```text
+------------------------------+
| spec-prd Orchestrator       |
+--------------+---------------+
               |
               v
+------------------------------+
| Intake + Sanitization        |
| facts / claims / HOW split   |
+--------------+---------------+
               |
               v
+------------------------------+
| Current-State Evidence       |
| source/docs/tests/prior PRDs |
+--------------+---------------+
               |
               v
+------------------------------+
| Product Expert Lens          |
| user, outcome, scope, risk   |
| downstream-confirmation map  |
+--------------+---------------+
               |
               v
+------------------------------+
| Requirements Grill           |
| one source-backed question   |
| per load-bearing WHAT gap    |
+--------------+---------------+
               |
               v
+------------------------------+
| Standard PRD Write-In        |
| decisions into PRD sections  |
+--------------+---------------+
               |
               v
+------------------------------+
| Readiness Lens               |
| would plan/work invent WHAT? |
+--------------+---------------+
               |
       +-------+--------+
       |                |
       v                v
+-------------+   +------------------+
| spec-plan   |   | ask/revise/block |
+-------------+   +------------------+
```

---

## Product Expert Lens Contract

### Responsibilities

- Identify the target user, buyer/operator/admin/developer actor, and the job or workflow being improved.
- State the product outcome: what user-visible or business-visible result changes after the increment.
- Detect load-bearing ambiguity across actor, trigger, happy path, state transition, empty/failure/permission cases, rollout slice, non-goals, metric, and acceptance.
- Challenge vague product terms before they reach PRD sections.
- Rank gaps by downstream confirmation risk, not by checklist completeness.
- Produce the next owner question only when it can close or narrow a named PRD write target.
- Preserve accepted assumptions, owner decisions, and unresolved blockers in PRD-local sections.
- Close with the question: which plan/work confirmations have been eliminated, and which remain explicit handoff boundaries?
- When the input is already a structured/decided PRD, design doc, or conversation synthesis, recognize it and demote its embedded Implementation/Testing decisions to HOW instead of re-asking settled WHAT; keep only the parts that change scope, acceptance, or source-of-truth. (structured-input synthesis — first-class, see U6)

### Non-Responsibilities

- It does not invent market strategy, business priority, industry norms, or product scope without owner/source support.
- It does not replace `spec-brainstorm` for unresolved 0-1 product shape.
- It does not write implementation design, API schema, database changes, task breakdown, or test seams.
- It does not become a public workflow entrypoint by default.
- It does not publish issue trackers or create a second PRD artifact topology.

### Escalation To Reviewer

Use an independent product reviewer only when the PRD has high downstream-risk triggers:

- multi-actor or cross-surface workflow
- permission, compliance, payment, data retention, or irreversible user action
- unclear target user or outcome metric
- owner/source contradiction that affects release scope
- broad release slice where the next question set may exceed a single inline grill loop
- PRD already looks polished but readiness still predicts downstream WHAT invention

**Dispatch boundary (host-aware):** delegated product reviewer 需同时满足"host 有 dispatch 能力"与"用户/父 workflow 显式授权 subagent/delegated review"。任一不满足（dispatch 不可用，或能力在但授权缺失），都只能 inline critique 并记录 reason code（`dispatch_unavailable` / `dispatch_authorization_missing`），不得静默 spawn reviewer、不新增 public workflow、不依赖 reviewer 基建。最终判断始终回到 `spec-prd` orchestrator。注意 `spec-prd` 默认 inline、用户极少显式授权 subagent，escalation 在常态下几乎总落到 inline——因此 inline critique 不能是自评：必须显式切换到对抗/独立产品视角并产出可验证 critique（命名风险 + 受影响 PRD write target），否则 escalation 形同虚设。

### Run-Local Shape (light run-local contract, not persistent schema)

Product Expert Lens 的前置判断必须有可被 grill / readiness 消费的 run-local 形态。**扩展现有 understanding map**（不新造并列 shape），前加 risk 排序字段、后加 closure 字段：

```text
downstream_confirmation_risk -> claim -> evidence/source -> gap
  -> owner_question_or_assumption -> PRD_write_target -> closure_state
```

- `downstream_confirmation_risk`：Lens 用它给 gap 排序（决定先问什么、是否值得问）。
- `closure_state`：closed / narrowed / accepted-assumption / outstanding-question / blocker / route-out。
- 它与现有 `Run-Local Decision Card` 同级：light run-local authoring contract，不持久化、不 emit JSON/artifact、不跨 run 传递。`closure_state` 复用现有 `owner_question_progress` 的同一组枚举（不新造）；净新增字段只有 `downstream_confirmation_risk`。停止用“不成 schema”豁免质疑——判据是“固定字段是否被 test 锁、被固定环节按名消费”，按此它就是 light contract，接受与 Decision Card 同等纪律：contract test 只锁这些字段锚点“存在于 reference”，绝不锁语义内容或排序结果（那是 LLM 判断）。grill 消费它的 gap + write_target，readiness 消费它的 closure_state。

### Product Expert Lens Interface Invariants

保持 Lens 成为深模块：调用方只学习小 interface，产品判断、排序和 evidence 协调复杂度留在 Lens implementation 内。

- 每个进入 grill queue 的 gap 必须绑定 `PRD_write_target`；无法绑定 write target 的 gap 只能留在 Lens 内继续归约，或显式转成 `Outstanding Questions` / blocker / route-out。
- `downstream_confirmation_risk` 只决定下一问排序和 handoff priority，不是分数、schema enum 或 readiness 判定结果。
- grill 只消费 `gap + owner_question_or_assumption + PRD_write_target`；write-in 只消费 `PRD_write_target + closure_state`；readiness 只消费 `closure_state` 与仍会导致 planning/work 发明 WHAT 的 handoff residue。
- 无法排序但会影响 planning 的 load-bearing gap 不得静默丢弃；必须通过 accepted assumption、Outstanding Question、blocker 或 route-out carry。
- Tests 锁 interface 字段、消费方向和 forbidden duplicate surfaces；不锁 Lens 的语义排序结果、问题措辞或产品判断内容。

### Progressive Disclosure Boundary

`product-expert-lens.md` 是默认 authoring 热路径文件，只承载每个 PRD 都需要的产品判断核心：actor/outcome/scope/risk、downstream-confirmation 排序、grill/write/readiness 接口、escalation 边界。它不承载低频分支的完整操作手册。

低频或高上下文分支必须通过清晰 trigger 加载专用 reference 或专用 section：

- large-input / checkpoint / resume 细节放入 `references/large-input-checkpoint.md`，仅在超大、多来源、长链路、resume-risk 触发时加载；`product-expert-lens.md` 只保留“消费 Reduce output 并排 risk”的接口指针。
- design-source / Figma 细节放入 `references/design-source-evidence.md`，仅在前端/UI surface 且输入含设计源 URL / screenshot / exported context 时加载；`product-expert-lens.md` 只保留“设计源可成为 advisory evidence”的接口指针。
- structured-input synthesis（U6）留在 Standard PRD Write-In 路径，因为它是输入形态处理，不是 Product Expert Lens 的第二套分支协议。

这条边界是本方案的 sprawl 控制：默认热路径不因低频能力变长，分支能力不因被拆出而变成 public workflow、第二 artifact topology 或 provider contract。

**§10 最小方案论证（为何独立 file 而非现有 reference 内 trigger-gated section）：** design-source / large-input 的内容**本可挂现有 reference**（design WHAT ∈ `prd-output-template.md` 的 Design/UX Evidence Hook；Map-Reduce ∈ `domain-language-and-decision-ledger.md`），那样 topology 仅 6→7。本方案选独立 file（6→9）的依据是：① 两块内容体量大（design-source 含 URL parse、跨平台 host/tool/auth probe、external+internal card、ASCII flow；large-input 含 Map/Shuffle/Reduce + checkpoint + resume），挂进现有 reference 会让 `prd-output-template.md`（已是 drafting 热路径大文件）与 `domain-language` 显著膨胀，每次触发都被迫整文件加载；② 独立 file 是 trigger-only，仅在前端/超大场景加载，对默认热路径与常规 trigger-load 都更省 context；③ 各自被独立触发条件激活（前端 surface vs 超大输入），是真实 disclosure 边界而非硬凑。**判据（防 file-count sprawl）**：低频分支独立成 file 仅当「实质 implementation 体量 + 独立触发条件 + 独立 locality 收益」三者都成立，否则用现有 reference 内的 trigger-gated section；design-source / large-input 满足三者故独立，未来更小的低频分支默认用 section、不默认拆 file。

### Large-Input Coordination (Map-Reduce × Lens)

超大 / 多来源需求文档不改三段流程，而是在 Current-State Evidence 与 Product Expert Lens 之间复用 domain-language 既有的 **Large-Input Map-Reduce**，并与 Lens 衔接，不新造 chunking 引擎或第二套 shape：

- **顺序**：超大文档先走现有 Map-Reduce 证据归约（Map 保留 `source_ref` → Shuffle 按 actor/flow/contradiction 聚组 → Reduce 合并去重、保留冲突）。Lens 不一次读完全文，只消费 Reduce output。
- **shape 衔接（非并列）**：Reduce output 的 `load_bearing_gap` / `owner_question_candidate` / `affected_write_targets` 首尾接进 Lens 的 `downstream_confirmation_risk` 排序——两个 run-local shape 相接，不是两套并列 lens（同 single-source-of-truth 边界）。
- **bounded context**：分块处理，Reduce 阶段跨块去重 / 冲突协调；Lens 在归约候选上做产品判断，避免一次性吞整个超大文档。
- **Split 衔接**：reduced 结果跨多个 business capability 时，Lens 提供 capability/outcome 维度的语义拆分边界建议，owner 确认后走现有 Lightweight Split Topology（split summary + child PRD），不机械按 size 拆。
- **叠加顺序**：超大文档 + 成型输入（U6）+ 设计源（U7）同时出现时——先 Map-Reduce 归约文本证据 → U7 设计源证据并入（advisory）→ Lens 统一排 risk → U6 在写入阶段对成型/已决策块做 HOW 降级。
- **实现落点 / 边界**：在 `large-input-checkpoint.md` 写清 Map-Reduce → Lens → checkpoint 的条件触发流程；在 `product-expert-lens.md` 只写 Lens 消费 Reduce output 的接口指针；在 `domain-language-and-decision-ledger.md` 的 Map-Reduce 段加一句衔接到 Lens；复用现有 Map-Reduce 与 Split，不新增 schema、脚本 reducer、向量索引或持久 artifact。

### Long-Chain Checkpoint And Resume

长链路 / 超大文档 / 多轮 grill 下，run-local 过程态会随 context 压缩丢失。spec-prd 不新建第二 artifact 或 transcript 抗失忆，而是把 **PRD 文件本身升级为渐进 checkpoint**，并校准 write-timing：

- **触发条件**：仅超大 / 多来源 / 长链路（多轮 owner grill 或分块 Map-Reduce）启用渐进 checkpoint；普通短链路 PRD 仍走现有“闭合后写”，不污染普通路径。
- **归约即落盘**：超大文档时，Map-Reduce 的 reduced candidates 及早物化进 PRD 草稿——**已闭合**进正式 sections，**已归约但未确认**进 `Evidence And Assumptions`（`tag` 承载 evidence tag / confirmation posture、`source` 承载 source_ref）、需 owner 拍板的进 `Outstanding Questions`、跨 planning 须 re-confirm 的进 `Planning Recheck`（具体字段落点见 U8 落点决策，不扩列）；不把全部成果攒在 run-local map 里赌不失忆。
- **进度从 PRD 文件派生**（对应 spec-work 从 git 派生进度）：已写进 sections = 已闭合；Outstanding / Planning Recheck = 未闭合。无需单独 progress 文件或 transcript。
- **source_ref 是恢复锚点**：失忆后 re-read PRD 文件 + 按 `source_ref` 重新定位原文，默认优先按锚点恢复、避免全量重读——这正是现有 Map-Reduce 坚持保留 source_ref 的可恢复价值。**逃生口**：当 `source_ref` stale（原文已改）、缺失或冲突时，允许 degraded 重新归约相关 chunk 并记录原因，不把 source_ref 恢复当作绝对硬承诺。
- **resume 恢复工作态**：中断/失忆后用 resume-prd posture 从 PRD 文件恢复——已闭合 sections + Outstanding/Planning Recheck + source_ref 共同重建工作态，Lens 在此基础上继续排 risk / grill。
- **write-timing 校准**：普通 PRD 闭合后写（避免半成品，现有规则不变）；超大/长链路 PRD 改为“归约即 checkpoint”，与 resume-prd 的增量写一致。
- **边界**：复用单一 PRD artifact + resume-prd，不新增 transcript、scratch 文件、progress schema 或第二 artifact topology；reduced 草稿内容必须带 evidence tag / confirmation posture 和未确认标注，不得伪装成 confirmed。

---

## Downstream Consumption Contract

spec-prd 的唯一判据是下游（spec-plan / spec-write-tasks / spec-work）不再发明 WHAT。该判据的兑现依赖 PRD **持久 sections**，而非 spec-prd 的 run-time handoff 报告，并依赖下游正确消费 advisory 项。本节显式声明这层 handoff 契约（§4 handoff gate 是双向的：产出端与消费端都要 honored）。

- **closeout 三项是 same-session handoff 摘要，不是 PRD 持久 section。** U3 的 `Resolved before planning` / `Still carried` / `planning_would_invent_what` 出现在 Closeout Summary（handoff report），不写进 `docs/brainstorms/*-requirements.md` 的 Core Sections。**跨会话消费契约**：下游不依赖 closeout 报告，而是从 PRD 持久 sections 推断 readiness——`Outstanding Questions` / `Planning Recheck` / `Evidence And Assumptions（source-candidate）` 为空或已显式 carry = ready，非空 = 仍需 owner/source 确认。closeout 三项只在 same-session 直接 handoff 时附加可读摘要，不作为跨会话唯一证明。这意味着 G4「closeout 证明 downstream reduction」的跨会话载体是持久 sections 本身，而非 closeout 文本。
- **advisory 项依赖下游 re-confirm，这是已声明的跨 workflow 依赖，不是静默假设。** U7 设计源 WHAT、U8 reduced candidate 等未校准内容进 `Planning Recheck` / `Evidence And Assumptions（source-candidate / provider_untrusted）`，期望下游在 planning 选 HOW 前 re-read/re-run（`prd-output-template.md` 的 Planning Recheck 语义）。本方案**单侧产出**带齐 evidence tag + source_ref + limitations（满足 §4 handoff gate 产出端）；**消费端**——spec-plan 对 `Planning Recheck` advisory 项做 planning-time re-confirm——是本方案显式依赖的下游契约。若当前 spec-plan 未专门 honor 该 re-confirm 语义，属跨 workflow gap，应在 spec-plan 侧单独立项，**不在本方案内假装已兑现**；不得把「已写进 Planning Recheck」等同于「下游已 re-confirm」。

---

## Goals

- G1. Promote product judgment from passive output-quality checklist to active pre-grill lens.
- G2. Keep source-first discipline: product questions follow source/current-state evidence, not generic PM intuition.
- G3. Ask fewer but sharper owner questions by ranking only load-bearing WHAT gaps.
- G4. Make PRD closeout prove downstream confirmation reduction.
- G5. Keep public workflow surface stable: `spec-prd` remains the entrypoint.

## Non-Goals

- 不新增 public `$product-prd`、`spec-product-expert` 或 `$to-prd`。
- 不把顶尖产品专家做成总是独立 subagent；默认是 inline lens。
- 不照搬外部 `to-prd` 字段表、issue tracker 发布或 no-interview 姿态。
- 不用强状态机锁死每次 PRD 必须经过固定子阶段；lens 是判断层，不是脚本 gate。
- 不让产品专家 lens 覆盖 source/current-state truth 或 owner 决策权。

---

## Requirements

- R1. `SKILL.md` 必须把 Product Expert Lens 作为 `spec-prd` 的目标优先流程层呈现，而不只是 output template 细节。
- R2. Product Expert Lens 必须在 owner question 前识别 downstream-confirmation risks，并把问题绑定到 PRD write target。
- R3. Requirements Grill 继续 source-first、一问一答、recommended answer，但问题优先级由 Product Expert Lens 的 load-bearing risk 驱动；该排序衔接必须落到 grill 行为权威 `grill-with-docs-integration.md`（由 U2 承载），不能只写在 `SKILL.md` 摘要层，否则 Lens 排序与 grill 行为契约各说各话。
- R4. PRD output template 必须消费 Product Expert Lens 的结果，把用户、结果、边界、异常、权限、验收、assumption/blocker 写入标准 sections。
- R5. Readiness Lens 必须判断 PRD 是否仍会让 planning/work 发明 WHAT，并要求 closeout 显式列出已前置解决和仍需 handoff 的确认项。
- R6. 独立 product reviewer 只能作为高风险升级路径，不成为 public workflow 或默认依赖。Dispatch 需同时满足 host 能力与显式 subagent 授权；任一不满足只能 inline 并记录 reason code，不静默 spawn、不依赖 reviewer 基建。contract/eval 必须锁这条边界（无授权 → inline、不新增 public workflow）。
- R7. 本方案必须抽出 `references/product-expert-lens.md`，并把现有 `Adaptive Product Expert Lens` 移动/提升为单一真相源，并**正式改名 `Adaptive Product Expert Lens` → `Product Expert Lens`（owner 决策 2026-06-24）**；同时为低频分支新增触发 reference：`references/design-source-evidence.md` 与 `references/large-input-checkpoint.md`。必须同步更新受影响的 contract tests，逐项明确：① `source topology stays compressed` 的 `sourceFiles` 与 `references` 严格数组**终态**从 10/6 更新为 13/9（新增 product lens、design-source、large-input checkpoint 三个 source references；不新增 public workflow / artifact topology）。**该 test 用 `fs.readdirSync`（`test:178`）读实际文件，`toEqual` + `toHaveLength` 基于磁盘——必须随每个创建 reference 的 U 渐进推进：U1 后 11/7、U7 后 12/8、U8 后 13/9；严禁在 U1 一次改到终态 13/9，否则 design-source/large-input 文件尚未创建、`toEqual` 立即失败（feasibility 硬死结）**；② `examples.json` 的 `source_refs`（`eval fixtures...` test 的 `toEqual` 严格数组）**终态** 6→9，同样随 design-source(U7)/large-input(U8) 的 eval case 落地而 7→8→9 推进，不提前列入尚未产出 case 的 source；③ `canonical lens reuse`：改 `prd-readiness-lens.md` 中“uses prd-output-template.md's Adaptive Product Expert Lens as the quality-dimension source”一句指向 `product-expert-lens.md`，并同步该 test 的断言字符串；④ `entrypoint references only the six source references` 的引用集合与测试标题同步改为 governed source references（6→9），且断言 `design-source-evidence.md` / `large-input-checkpoint.md` 是 trigger-only，不是 authoring 主路径默认加载；⑤ **改名触发的 test 锚点（此前遗漏，必补）**：`'Adaptive product expert lens'`（前 140 行 decision-tree，约 `:260`）、`'adaptive product expert lens'`（全文 references test，约 `:294`）、`'adaptive product lens fit'`（readiness pack，约 `:722`）全部改为对应 `Product Expert Lens` 措辞；⑥ **source 改名**：`prd-output-template.md` 的 `## Adaptive Product Expert Lens` 标题与 canonical 声明句（`:142`/`:158`）、`prd-readiness-lens.md` 的 canonical 句（`:55`）同步去掉 `Adaptive`，且 ③ 的 readiness 句改为 “uses `product-expert-lens.md`'s Product Expert Lens as the quality-dimension source”。改名为等长或更短替换，不新增前 140 行行数。`SKILL.md` 前 140 行预算实测**有余量**：前 140 行（`firstHundredFortyLines`，test `:226`）真正的最后强制锚点是 Phase 0 decision-tree `'Split or continue?'`（`SKILL.md:127`），约 13 行余量；`PRD Sanitization` 由 `phaseOne`（`extractMarkdownSection`，test `:227/:266`）整节校验，**不占** 前 140 行预算（R7 旧表述混淆了两套校验）。U2 仅加 Reference Trigger Map 一条 `product-expert-lens.md` 默认主路径（两条 trigger-only 分支 reference 的 SKILL 引用由 U7/U8 各自加）+ 改名缩短 + Purpose/Core Principle 措辞微调（净增仍应控制在前 140 行外或少量行内），无需放宽 140 阈值。**guard**：仅当未来改动逼近 140 边界或需放宽阈值时再显式论证为容纳重构。现有 test 不得成为阻止合理架构重构的理由，但更新 test 是为容纳重构、不是削弱守护。**test strategy**：采用 replace-not-layer；旧 `prd-output-template.md` lens 细节断言必须删除或改成“引用 `product-expert-lens.md` canonical interface”，不得同时保留新旧两套 canonical test surface。
- R8. source/docs/test 变更必须同步 `CHANGELOG.md`；skill prose 行为语义变更需要 fresh-source eval 或明确 not-run reason。
- R9. Standard PRD Write-In 必须把 Product Expert Lens 识别出的“成型/已决策输入”综合成标准 PRD sections，并把其中的 Implementation/Testing 决策降级为 HOW；只有影响 scope、acceptance、source-of-truth 的部分进入 PRD requirements。这是一等能力，不是可选注解，也不引入 `to-prd` 专名或固定字段表。
- R10. 前端/UI 需求且输入含 Figma（或其他设计源）链接时，spec-prd 必须先检测对应 MCP/tool readiness，而不是直接要求用户截图或把设计链接降级为普通 reference：可用则拉取并提取设计 WHAT（evidence-tag 为 source-candidate / provider_untrusted，需与 code/owner 校准、矛盾暴露），不可用或未授权则 loud 引导用户启用/安装当前宿主的 Figma MCP/plugin，并降级（截图/描述/reference-claim + Planning Recheck），never-block。Figma MCP 当前不是 `spec-mcp-setup` required baseline；除非 runtime setup 后续显式新增 optional `figma` entry，否则不得声称 `spec-mcp-setup` 会安装 Figma。spec-prd 只提取 PRD facts，**不自己执行 MCP 安装**，**不做 PRD/Figma/源码一致性审计**（route 到 `spec-app-consistency-audit`）。套用现有 Capability-Class Evidence Boundary 通用模式，不为 Figma 硬编码独立协议。
- R11. 设计源消费必须形成 run-local 证据链：URL parse → tool discovery → auth/access probe → node-level context fetch or degraded reason → design-WHAT extraction → code/owner reconciliation → PRD write targets / Planning Recheck。该链路是 LLM-owned authoring discipline，不新增 schema、脚本 gate、公共 workflow 或持久 design-source artifact。
- R12. 打包分发后的 `spec-first` 不能假设任何用户环境已经具备 Figma MCP/plugin、Figma Desktop、浏览器登录态、团队访问权限、macOS shell、Windows PowerShell、Node 包管理器或相同 host tool names。设计源能力必须是 **per-run / per-user / per-host / per-OS** 探测结果；本机 `whoami` 成功只能作为当前会话 sample evidence，不得写入长期 contract、测试 fixture、默认说明或 generated runtime。跨平台引导必须使用当前宿主官方 Figma MCP/plugin setup 说明的泛化表述，避免写死 macOS-only 或 Windows-only 命令；Windows/macOS/Linux 缺工具时都应降级到截图、导出 context、本地 `figma-context:<path>` 或 owner 描述。
- R13. 超大 / 多来源需求文档必须复用现有 Large-Input Map-Reduce（保留 `source_ref`、保留冲突），其 Reduce output 衔接进 Product Expert Lens 的 `downstream_confirmation_risk` 排序（两个 run-local shape 首尾相接、非并列）；Lens 消费归约结果而非一次读完全文；跨 capability 时由 Lens 提供语义 Split 边界建议，owner 确认后走现有 Lightweight Split Topology。不新增 chunking 引擎、schema、脚本 reducer 或持久 artifact。由 `large-input-checkpoint.md` 承载完整分支流程，`product-expert-lens.md` 只保留消费 Reduce output 的接口指针，`domain-language-and-decision-ledger.md` 只加一处 Map-Reduce 衔接说明。
- R14. 长链路 / 超大 / 多来源 PRD 必须支持渐进 checkpoint：reduced candidates 及早物化进 PRD 文件（closed 进正式 sections，未确认进 `Evidence And Assumptions` / `Outstanding Questions` / `Planning Recheck`，带 evidence tag / confirmation posture + source_ref），使 PRD 文件成为抗 context-loss 的 checkpoint 与 resume 锚点；进度从 PRD 文件派生，不新增 transcript / progress schema / 第二 artifact。普通短链路 PRD 仍走现有“闭合后写”。由 **U8 / `large-input-checkpoint.md`** 承载（write-timing 校准 `prd-output-template.md` + `SKILL.md` Phase 3；reduced candidate 落点复用现有 `Evidence And Assumptions` / `Planning Recheck` 字段，不扩列；resume 复用 resume-prd posture）。

---

## Proposed Refactor

> 执行顺序（逻辑，非物理排列）：U1 抽 lens → U2 接热路径 → U7 设计源证据（前端场景，先于 grill）→ U6 成型输入综合 → U8 长链路 checkpoint（write-timing）→ U3 closeout → U4 eval → U5 收口。U-ID 一旦分配不重编号，物理排列与执行顺序不必一致。

### U1. Extract Product Expert Lens Into First-Class Reference

**Goal:** 将 `prd-output-template.md` 中的 `Adaptive Product Expert Lens` 从输出模板细节提升为独立或前置 reference，成为 `spec-prd` 的产品判断源。

**Requirements:** R1, R6, R7, R13（R6 dispatch boundary 写在抽出的 `product-expert-lens.md` 的 Escalation 段，由 U4 eval 锁；R13 在 U1 只落 Lens 消费 Reduce output 的接口指针，完整分支流程由 U8 / `large-input-checkpoint.md` 承载）

**Files:**
- Add: `skills/spec-prd/references/product-expert-lens.md`
- Modify: `skills/spec-prd/references/prd-output-template.md`
- Modify: `skills/spec-prd/references/prd-readiness-lens.md`
- Modify: `skills/spec-prd/references/domain-language-and-decision-ledger.md`（Map-Reduce 段加一句：Reduce output 衔接 Lens 排 `downstream_confirmation_risk`，完整细节转入 `large-input-checkpoint.md`）
- Test: `tests/unit/spec-prd-contracts.test.js`

**Decision rule:** 本方案不再保留“是否抽出”的条件分支。`product-expert-lens.md` 是必建 reference，因为 Product Expert Lens 会被 SKILL、output template、readiness lens 和 evals 共同消费；不要为了满足旧 topology test 把它硬塞回 output template。`design-source-evidence.md` 与 `large-input-checkpoint.md` 分别由 U7/U8 新增，是 progressive-disclosure 分支 reference，不是新的 public workflow 或第二 artifact topology。

**Single source of truth:** 这是把现有 `Adaptive Product Expert Lens` **移动/提升**为单一真相源，不是新增第二个 product lens。`prd-output-template.md` 不得保留并列的第二份 lens 维度清单，改为按名引用 Product Expert Lens；同步更新 `tests/unit/spec-prd-contracts.test.js` 的 `canonical lens reuse` 断言指向新位置，避免两个互相漂移的 product lens（与本方案拒绝 `PRD Writer Adapter` 概念重复同源的边界）。实现完成后，任何“旧 output-template lens 仍可作为 fallback 真相源”的措辞都必须删除或改为迁移期 degraded fallback，不得长期存在。

**Sprawl control:** `product-expert-lens.md` 不复制 U7/U8 的完整协议，只保留触发指针和接口字段；分支细节必须落在 trigger-only references。contract tests 应锁“default-hot-path core lens + trigger-only branch references”的结构，避免未来把低频分支重新塞回默认 lens 正文。

### U2. Rewire SKILL Flow And Load Product Expert Lens On The Hot Path

**Goal:** `SKILL.md` 的 Purpose、Workflow、Core Principles、Phase 1/2 **以及 Reference Trigger Map** 明确：先做产品判断，再用 grill 闭合问题；并保证 Product Expert Lens 真正进入 authoring 热路径，而不是抽出后成为孤儿 reference。

**Requirements:** R1, R2, R3, R7

**Files:**
- Modify: `skills/spec-prd/SKILL.md`（Purpose / Core Principles / Execution Flow Phase 1-2 / **Reference Trigger Map**）
- Modify: `skills/spec-prd/references/grill-with-docs-integration.md`（补一句 Lens→grill 排序衔接，见下“Grill 行为权威衔接”）
- Test: `tests/unit/spec-prd-contracts.test.js`

**Expected flow wording:**

```text
Product Expert Lens -> Requirements Grill -> Standard PRD Write-In -> Readiness Lens
```

`Product Expert Lens` 先回答：

```text
下游还会回头问谁用、为什么、何时触发、怎么结束、
失败/权限/边界是什么、验收如何判断、哪些不做、哪些要 owner 拍板吗？
```

**Reference Trigger Map 改动（关键，否则 lens 落不了热路径）:**
- 把 `references/product-expert-lens.md` 加入 Reference Trigger Map，加载层级与 `grill-with-docs-integration.md` 同级——即 **create / refine / validate 的 PRD authoring 主路径默认加载**，而非普通 trigger-load。
- `references/design-source-evidence.md` 与 `references/large-input-checkpoint.md` 的 Reference Trigger Map 引用**不在 U2 一次加全**——它们分别由 **U7/U8 在创建对应文件的同一单元内加**（trigger-only：design-source 仅前端/UI surface 且含设计源 URL/screenshot/exported context 时；large-input 仅超大/多来源/长链路/resume-risk/Map-Reduce 分块时）。这样「文件创建 + SKILL 引用 + source topology test 推进」对每个 reference **原子同步**，避免 U2 引用尚未创建的 file 造成中间态 `entrypoint references`（文本=9）与 `source topology`（fs=7）数字打架。
- 触发措辞参照现有 grill-with-docs 行：rough PRD、draft、reference-claims、resume-prd、pure-text、多来源材料默认加载；wrong-stage / implementation-ready / 已 source-resolved 到无需产品判断时可不加载。
- **Fallback:** 若 lens reference 在迁移期未加载或加载失败，inline 使用 `SKILL.md` 的 Product Expert Lens 摘要并记录 degraded reason code；不得长期退回 `prd-output-template.md` 的旧 lens 作为第二真相源。实现完成后，正常路径必须从 `product-expert-lens.md` 加载。

**Grill 行为权威衔接（关键，否则形成两套提问权威）:**
- `grill-with-docs-integration.md` 是 sustained interview 的行为权威（relentless one-at-a-time、source-first、bind 到 named gap + PRD write target）。当 Product Expert Lens 已产出 `downstream_confirmation_risk` 排序时，grill 按该排序选择下一个 owner question——即“先问拖累下游最重的 load-bearing gap”。
- 只补一句衔接：Lens 排序驱动**提问顺序与取舍**；现有 source-first、一问一答、recommended-answer、CONTEXT/ADR 边界、route-out/Outstanding 规则全部不变。**不在 grill reference 里复制 Lens 维度清单**（单一真相源仍是 `product-expert-lens.md`），只声明“按 Lens 排序消费”。
- 与 R13 在 `domain-language-and-decision-ledger.md` 加一句 Map-Reduce→Lens 衔接同构：都是把 Lens 的产出接到既有行为权威，而非新建第二套权威。
- 该改动是 behavior-prose 变更，纳入 U5 fresh-source eval 覆盖。

**Test scenarios:**
- Happy path: contract test 确认 SKILL.md Reference Trigger Map 列出 `product-expert-lens.md` 且声明 authoring 主路径默认加载。
- Happy path（终态，U7/U8 完成后）: contract test 确认 `design-source-evidence.md` / `large-input-checkpoint.md` 是 trigger-only，未声明普通 PRD authoring 默认加载（U2 单独完成时这两个引用尚未加，属预期中间态）。
- Edge case: 已 source-resolved 的 compact 输入不强制重型 lens（避免过度提问）。
- Error path: contract test 确认 SKILL.md 仍只引用受治理的 reference 集合，并与 R7 的 governed references 更新同步（6→9 references）。
- Error path: grill 衔接只声明“按 Lens 排序提问”，未在 `grill-with-docs-integration.md` 复制第二份 lens 维度清单（单一真相源仍是 `product-expert-lens.md`）。

### U6. Standardize Structured-Input Synthesis And HOW Demotion

> 逻辑上属于 Standard PRD Write-In 环节，执行顺序沿用全局链路：U1 -> U2 -> U7 -> U6 -> U8 -> U3 -> U4 -> U5；U-ID 取下一个未用号，物理位置按逻辑排。

**Goal:** 当输入已是成型 PRD / 设计文档 / 对话综合（已含 Implementation/Testing 决策）时，把它综合成标准 PRD，而不是当作 missing-WHAT 重新追问；把已决策的实现/测试内容降级为 HOW。这补齐 owner mental model 里 `to-prd` 那一半的本体价值，不照搬 to-prd 字段表 / issue tracker / no-interview。

**Requirements:** R9, R4

**Files:**
- Modify: `skills/spec-prd/references/prd-output-template.md`（在 gap-to-target mapping 邻近补“成型/已决策输入”这一反向 case：现有 mapping 全是 missing-WHAT 导向，缺 already-structured-input 的综合 + HOW 降级规则）
- Modify: `skills/spec-prd/references/product-expert-lens.md`（Lens 把“识别输入已成型/已含决策”作为一条判断职责）
- Test: `tests/unit/spec-prd-contracts.test.js`、`skills/spec-prd/evals/examples.json`

**Approach:**
- 在 gap-to-target mapping 旁加一类：输入携带 Implementation/Testing 决策块时默认降级为 HOW，仅保留影响 scope/acceptance/source-of-truth 的部分进 PRD requirements。
- 用现有 WHAT/HOW 分离纪律的“反向补充”表达，不引入 `to-prd` 专名、固定 7 段字段表或负向 fixture 矩阵。
- eval 加 case：implementation-heavy / already-decided 输入被综合为标准 PRD，HOW 被降级，不被当作 missing-WHAT 重问。

**Test scenarios:**
- Happy path: 成型 PRD（含 Implementation Decisions）→ 综合为标准 sections，实现决策降级 HOW，不重复追问已定 WHAT。
- Edge case: 成型输入里某条实现决策实际改变 source-of-truth/scope → 提升为 Decision Notes / Scope Boundaries，而非简单丢弃。
- Error path: source 不含 `to-prd` 专名或固定字段映射表（负向断言用字符串拆分构造）。

**Planned verification:** 运行 `npx jest tests/unit/spec-prd-contracts.test.js --runInBand`、`node skills/spec-prd/scripts/run-evals.js --json`；预期证据是 output template 不出现并列第二份 product lens，且相关 contract/eval 返回成功状态。

---

### U3. Strengthen PRD Closeout And Readiness

**Goal:** closeout 不只输出 counts，还要输出 downstream confirmation reduction，并锁住三项必出。

**Requirements:** R5

**Files:**
- Modify: `skills/spec-prd/references/prd-readiness-lens.md`（Outcomes / handoff entropy 段：加 downstream confirmation reduction 三项）
- Modify: `skills/spec-prd/references/prd-output-template.md`（Closeout Summary：三项作为 handoff 必出）
- Modify: `skills/spec-prd/SKILL.md`（Phase 4 readiness/closeout 摘要锚点）
- Test: `tests/unit/spec-prd-contracts.test.js`

**Closeout 三项必出:**

```text
Resolved before planning:
- actor / workflow / acceptance / permission / exception / scope ...

Still carried:
- Outstanding Questions / blocker / Planning Recheck ...

planning_would_invent_what: yes | no
```

**Modify vs add（实现注意）:** `planning_would_invent_what` 已存在于 `prd-readiness-lens.md`（owner approval closure）与 `prd-output-template.md`，实现时**扩充既有锚点**，不要重复引入新字段；`Resolved before planning` / `Still carried` 是全新子标签，新增到 readiness Outcomes 与 closeout template。

**Script / LLM 边界（关键）:** `check-prd-artifact.js` 只 seed deterministic counts（sections / requirement count / acceptance count / trace gaps）。**downstream confirmation reduction 三项是 LLM-owned 语义判断，绝不让 script 计算**（沿用现有 readiness lens 的 script/LLM 边界）。contract test 只锁"三项锚点/格式必出"，不锁语义内容。

**Test scenarios:**
- Happy path: readiness 输出含 Resolved / Still carried / `planning_would_invent_what` 三项锚点。
- Edge case: 仍有未闭合 load-bearing gap 时 `planning_would_invent_what: yes` 且不 emit ready-for-planning。
- Error path: contract test 不把 `check-prd-artifact.js` 的 counts 当作 readiness 语义判定。

**Planned verification:** 运行 `npx jest tests/unit/spec-prd-contracts.test.js --runInBand`；预期证据是 readiness closeout 三项可见，且相关 contract 返回成功状态。

### U4. Add Evals For Product Judgment Quality

**Goal:** eval 必须能区分"真加了产品判断能力" vs "只加了产品专家名词"——这是兑现整个重构的防滑闸。光有 candidate case 不够，每个 case 必须带 expected 断言。

**Requirements:** R2, R3, R5（验证面）

**Files:**
- Modify: `skills/spec-prd/evals/examples.json`
- Test: `tests/unit/spec-prd-contracts.test.js`（断言新 case 的 coverage_tags / expected / must_not 存在）

**Candidate cases:**

- polished PRD lacks target user and success signal
- backend/platform increment lacks product-level state semantics
- permission-sensitive flow lacks negative acceptance
- multi-actor workflow hides owner decision point
- implementation-heavy note contains HOW but no user outcome
- compact/source-resolved case should not over-question

**Expected 断言（至少三类 positive）:**
- `lens identifies downstream-confirmation risk before owner question`：产品空洞先于 owner question 被识别并按 risk 排序。
- `grill question binds to PRD write target`：每个 owner question 绑定 named gap + PRD write target + closure state。
- `readiness closeout names eliminated vs carried confirmations`：closeout 显式列已前置解决 vs 仍 carry + `planning_would_invent_what`。
- `inline product critique surfaces named risk + write target on escalation`：escalation 触发（高风险但 dispatch 不可用/未授权、常态落 inline）时，inline critique 必须产出可见的 named risk + 受影响 PRD write target，而非空泛认可或自我确认（对应 `:139` 的反自评要求）；这是可观测产物断言，不锁 critique 语义内容。

**负向断言（must_not，防符号化与脱离代码）:**
- `must not ask a source-answerable fact as an owner question`（对标代码 / source-first：可查事实不重问 owner）。
- `must not pass readiness while a load-bearing WHAT gap remains open`。
- `must not introduce a to-prd field table, issue tracker publish, or no-interview posture`。
- `must not silently spawn a product reviewer when dispatch authorization is missing`（锁 R6 dispatch 边界）。

**新 case 的 quality_bucket 决策:** 新增 `product-judgment` coverage tag；是否加入 `case_contract.required_quality_buckets` / `must_not_required_quality_buckets` 必须在实现时显式决策——若加入 required，需同步 `expectCoverageTags`/`expectQualityBuckets` 调用且每个新 case 带满足结构的字段;若仅作额外覆盖则不加 required。

eval 是 examples-as-context / advisory drift 守护，不是语义完整性证明。防 naming-only 滑坡的**真正语义闸门是 U5 的 fresh-source eval**（实测新 subagent 行为）；本单元的 expected/must_not 只防 drift，不能替代行为验证。

**Planned verification:** 运行 `node skills/spec-prd/scripts/run-evals.js --json`；预期证据是新 case 带 expected 与 must_not，且 eval runner 返回成功状态。

### U5. User Docs, Changelog, Runtime, Fresh-Source Eval

**Goal:** 用户手册说明 `spec-prd` 不是模板填充器，而是“产品专家判断 + source-first grill + 标准 PRD 写入 + readiness 守门”。

**Files:**
- Modify: `docs/05-用户手册/22-PRD需求文档质量增强流程.md`
- Modify: `CHANGELOG.md`
- Required: `docs/validation/spec-prd/fresh-source-eval-2026-06-24-product-expert-lens.md`（fresh-source eval 是防 naming-only 滑坡的真闸门——字符串 expected 只防 drift，唯有对新 subagent 注入源文件实测行为能区分“有产品判断 vs 只有名词”。**必覆盖项**：escalation 常态落 inline 时 inline critique 是否真对抗（产出 named risk + 受影响 write target）而非自评（对应 `:139`）；以及 grill 是否按 Lens 排序提问、checkpoint→resume 是否可恢复。behavior-prose 变更后必做；仅当 `docs/contracts/workflows/fresh-source-eval-checklist.md` 确认当前 host 无法执行时才允许 not-run，并记录原因 + 未覆盖 examples + residual risk）
- Generated by command only: `.claude/**`, `.codex/**`, `.agents/skills/**` via `node bin/spec-first.js init --claude --codex -y --lang zh`; do not hand-edit generated runtime mirrors.

Run:

```bash
npx jest tests/unit/spec-prd-contracts.test.js tests/unit/changelog-format.test.js --runInBand
node skills/spec-prd/scripts/run-evals.js --json
node bin/spec-first.js init --claude --codex -y --lang zh
```

---

### U7. Consume External Design Source (Figma) As Capability-Class Evidence

> 服务前端/UI 需求场景；逻辑上属于 Current-State Evidence + Product Expert Lens 的证据源扩展，执行上先于 grill。

**Goal:** 输入含 Figma 链接（或其他设计源）且为前端 surface 时，主动发现设计源、检测对应 MCP/tool readiness、可用则拉取内容提取设计 WHAT 补充需求理解、不可用则引导用户启用/安装当前宿主 Figma MCP/plugin 并降级，全程 never-block PRD。

**Requirements:** R10, R11, R12, R2, R4

**Files:**
- Add: `skills/spec-prd/references/design-source-evidence.md`
- Modify: `skills/spec-prd/references/product-expert-lens.md`（只保留“前端/UI 需求可触发 design-source evidence”的接口指针，不放完整 Figma 协议）
- Modify: `skills/spec-prd/references/prd-output-template.md`（Design / UX Evidence Hook：改为**按名引用** `design-source-evidence.md` 的触发、降级与 **design WHAT 提取清单**，**不在 Design Hook 复制提取维度清单**——`design-source-evidence.md` 是 design 提取的**单一真相源**（§3：避免 template Design Hook 与 design-source-evidence 两份 design 提取清单互相漂移，与 lens 单一真相源同纪律）；保留只提取 PRD facts、一致性审计 route 到 `spec-app-consistency-audit`）
- Modify: `skills/spec-prd/SKILL.md`（保持 graph capability 边界仍引用 `project-graph-consumption.md`；另以 provider-neutral 方式提示前端/UI 输入可触发 external `design-source` evidence，但 **不写 `Figma` 等 provider name**；provider-specific details 只出现在 `design-source-evidence.md`。**本单元同时把 `design-source-evidence.md` 的 Reference Trigger Map trigger-only 引用加入 SKILL，并把 `source topology` test 从 U1 后的 11/7 推进到 12/8——文件创建 + SKILL 引用 + topology test 在 U7 原子落地，见 R7① P1-1 渐进同步**）
- Do not modify: `docs/contracts/project-graph-consumption.md`（该 contract 只管 `project-graph` / `code-graph` provider consumption；`design-source` 不挂进它，避免把设计源误归入项目图证据合同。若未来要抽通用 external-evidence contract，另起方案，不在本轮借 graph contract 扩容）
- Test: `tests/unit/spec-prd-contracts.test.js`、`skills/spec-prd/evals/examples.json`

**Approach:**
- **执行顺序**：设计源链路必须先于 owner grill 运行。先尝试工具发现和只读授权探测；只有探测失败、权限不足、文件不可达、缺 node 选择或当前模式禁止远程 fetch 时，才要求用户提供截图、导出 context、目标 node URL 或关键页面描述。
- **Capability 边界**：`design-source` 是 `spec-prd` run-local external evidence capability，不是 `project-graph-consumption.md` 的新 vocabulary，也不是 `provider-readiness` / `provider-tools-registry` 的新增 baseline。当前实现只做当前 host/tool 的临场探测和 provider_untrusted 记录；只有未来 runtime setup registry 明确新增 optional `figma` provider 时，才同步扩展 setup/readiness schema 或安装路线。
- **发现与解析**：在 Sanitization / Product Expert Lens 前置阶段扫描 `figma.com` URL。`/design/:fileKey?...node-id=...` 提取 `fileKey` 与 `nodeId`（`1-2` 转 `1:2`）；`/design/:fileKey/branch/:branchKey/...` 使用 `branchKey` 作为 `fileKey`；`/make/:fileKey` 可按 Figma MCP 规则使用 `nodeId=0:1`；无 `node-id` 的 design URL 先调用 metadata/page list 定位可选页面，再向 owner 请求 node-specific URL，不猜测节点；FigJam/Slides 等非 design 输入只提取可用的 PRD facts 或降级为 reference-claim。
- **工具/readiness 检测**：先查当前 host 是否暴露 Figma MCP 工具（Codex 用 tool discovery，Claude 用对应 tool lookup），工具存在时用 `whoami` 验证当前用户授权，并用 metadata / node probe 验证文件和节点访问；缺工具、未授权、权限不足、rate limit、文件不可访问、节点缺失、URL 类型不支持都记录具体 degraded reason。该检测必须面向“当前用户当前机器当前 host”，不得把维护者机器上的工具名、账号、team key、访问权限或 OS 当作发布包默认事实。
- **跨平台分发边界**：`spec-first` 发布到其他用户机器后，Figma 能力是 optional external provider，不是 bundled dependency。macOS、Windows、Linux 都可能出现工具未安装、host 未暴露 MCP、Figma Desktop 不可用、企业网络阻断、浏览器/桌面未登录、用户无文件权限、shell 命令不可执行等情况；`spec-prd` 只能探测并给出 host-aware setup guidance 或 artifact fallback。除非官方宿主/插件文档在运行时可见，不在 skill source 中写死 `brew`、`npx`、PowerShell、路径或平台专属安装命令。
- **可用读取**：优先拉取 node-level design context（结构、截图、设计注释、组件/Code Connect hints 等）。若 node-level context 太大或 node 缺失，先取 metadata/page list 缩小范围；必要时再取截图作为辅助理解。当前会话验证过这一探测路径：`tool_search` 可发现官方 Figma MCP，`mcp__figma.whoami` 成功（返回的具体账号名在此省略，避免把 per-user 事实写进长期文档）；该事实只证明当前会话可用，只能作为本计划的 sample evidence，不能进入长期 contract、fixture、默认用户文案或 runtime mirror。
- **设计 WHAT 提取**：从 Figma 内容中只提取 PRD 级事实：页面/入口/导航、default/empty/loading/error/success 状态、交互触发、文案、可见性/权限、响应式、i18n、a11y、设计注释、待确认文案或组件意图。**默认写入 `Evidence And Assumptions` / `Outstanding Questions` / `Planning Recheck`（provider_untrusted，advisory）；仅在经 owner/code reconciliation 确认后，才升级进 `Interaction Requirements` / `Use Cases` / `Acceptance Examples` 等下游直接消费的 load-bearing section**——未校准的设计内容不得直接进入验收。截图、参考代码、design-token、Code Connect hints 只作为理解材料，不进入实现计划或 HOW。
- **不可用降级**：loud 提示“当前 host 未检测到可用 Figma MCP / 未授权 / 无访问权限 / 缺 node-specific URL / 当前模式禁止远程 fetch”，给出下一步：启用或安装当前宿主的官方 Figma MCP/plugin，或提供截图、导出的设计 context、本地 `figma-context:<path>`、关键页面描述。`spec-prd` 不自己装 MCP；Figma 也不是 `spec-mcp-setup` required baseline。若未来 setup registry 显式支持 optional `figma`，才提示 `spec-mcp-setup --only figma` / `spec-mcp-setup --only figma`；否则只提示当前 host/plugin setup，并把链接记为 reference-claim + `Planning Recheck`；never-block。
- **矛盾处理**：Figma 与 source/current UI/owner 决策冲突时，暴露为 `design-source contradiction`，进入 Product Expert Lens 的 downstream-confirmation risk；不得默默用设计稿覆盖代码事实或 owner 目标。
- **边界**：只提取 PRD facts；PRD/Figma/源码一致性审计 route 到 `spec-app-consistency-audit`。
- **模式边界**：默认交互模式可远程读取 Figma；`mode:headless` / `mode:report-only` 不应远程 fetch Figma，除非上游已 materialize 本地 context。缺 context 时记录 degraded coverage。
- **一般化**：以 Figma 为前端首要 case，套用 Capability-Class Evidence Boundary 的 advisory/provider_untrusted 模式，不把 Figma 设计源做成 confirmed scope authority。

**Run-local design source card（light run-local contract, not a persistent schema）:**

这些字段会被 U7 authoring flow 与 tests 按名引用，因此它不是“随手示例”。它与 Decision Card 同级：不持久化、不 emit JSON、不跨 run 传递。为避免把 provider 探测实现细节暴露成调用方必学 interface，将 design-source 分成 **外部 evidence interface** 与 **内部 probe trace**：Product Expert Lens / write-in / readiness 只消费外部 interface；URL parse、host/tool/auth/fetch/setup 细节留在 `design-source-evidence.md` 的私有执行段。contract tests 只锁外部字段锚点与必要 degraded anchors，不锁字段值、排序、提取结论或 provider 结果。

```text
design_source_kind: figma-design | figma-make | figjam | slides | screenshot | exported-context | unknown
source_ref: <url/path/user-provided artifact>
evidence_posture: provider_untrusted | source-candidate | owner-confirmed | degraded-reference-claim
design_what: entry | flow | state | copy | permission | exception | responsive | i18n | accessibility | annotation
reconciliation: source-aligned | owner-confirmed | contradiction | needs-planning-recheck
PRD_write_target: Interaction Requirements | Use Cases | Acceptance Examples | Evidence And Assumptions | Planning Recheck | Outstanding Questions
degraded_reason: missing-tool | unauthorized | permission-denied | rate-limited | fetch-failed | missing-node | no-fetch-mode | unsupported-platform | unknown-host | none
```

**Internal probe trace（private implementation, not external interface）:**

```text
host_surface: codex | claude | other | unknown
platform: darwin | win32 | linux | unknown
parse_result: fileKey | branchKey | nodeId | missing-node | unsupported
tool_status: available | missing | unauthorized | permission-denied | rate-limited | fetch-failed | no-fetch-mode | unsupported-platform | unknown-host
fetch_result: design-context | metadata-only | screenshot-only | user-provided-context | degraded-reference-claim
setup_guidance: current-host-plugin | optional-setup-if-registered | screenshot-or-export | owner-description
```

**ASCII flow:**

```text
PRD input
  |
  v
Scan for front-end/UI surface + design source URL
  |
  +-- no design source --------------------------+
  |                                             |
  v                                             v
Continue normal Product Expert Lens      Product Expert Lens
                                                |
                                                v
                                      Parse Figma URL / node
                                                |
                                                v
                                      Discover Figma MCP/tool
                                      for current host/user/OS
                                                |
                           +--------------------+--------------------+
                           |                                         |
                           v                                         v
                  Tool available + authorized                 Missing / no auth /
                           |                                  no access / no node /
                           v                                  no-fetch mode
                  Fetch node-level context                            |
                           |                                          v
                           v                              Loud setup/context guidance
                  Extract design WHAT                                 |
                           |                                          v
                           v                              reference-claim + Planning Recheck
                  Reconcile with code/owner                           |
                           |                                          |
                           +--------------------+---------------------+
                                                v
                         Write PRD sections / contradictions / owner questions
```

**Test scenarios:**
- Happy path: Figma 链接 + 前端 surface + MCP 可用 → 提取设计 WHAT 写入 PRD，evidence-tag advisory。
- Happy path: 有 Figma URL 时先做 tool discovery / `whoami` / metadata 或 node probe，再决定读取、提问或降级；不得跳过探测直接要求截图。
- Edge case: 维护者本机 Figma MCP 可用但目标用户 Windows/macOS/Linux 环境未安装或未授权 → 每次运行重新探测并降级，不引用维护者账号、team、路径或本机验证事实。
- Edge case: Figma 与现有代码/owner 决策矛盾 → 暴露矛盾，不默默采信设计稿。
- Error path: 无 Figma MCP / 未授权 / 无访问权限 → 引导当前 host 的 Figma MCP/plugin setup 或请求截图/导出 context，并降级，不阻断；不自己执行安装，也不错误声称 required `spec-mcp-setup` 会安装 Figma。
- Error path: 不写死 macOS-only / Windows-only setup 命令；跨平台 guidance 必须是 host-aware 官方插件/MCP 引导或 artifact fallback。
- Error path: 不把 Figma 内容当 confirmed scope authority；不做 PRD/Figma/源码一致性审计（route-out）。
- Error path: 无 node-specific URL 时不猜测节点；先 metadata/page list 或向 owner 请求目标 node。
- Error path: `mode:headless` / `mode:report-only` 不远程 fetch Figma，除非上游已 materialize 本地 context。
- Error path: contract tests 不要求 Product Expert Lens / write-in / readiness 读取 internal probe trace 字段；它们只消费 external evidence interface。

**Planned verification:** contract/eval 应覆盖 URL parse → tool/readiness detect → design context consume / setup guidance → degraded fallback → advisory-tag → contradiction handling → tool-discovery-before-screenshot → per-user/per-host/per-OS detection → no maintainer-local facts in contract → no OS-specific install commands → headless no-fetch → 一致性审计 route-out。

---

### U8. Long-Chain PRD Checkpoint And Resume Discipline

> 服务超大 / 长链路场景；逻辑上属于 write-timing（write-in 环节），执行上贯穿 Map-Reduce 归约到 closeout。**承载 R14（此前停在要求层，无实现单元——本单元闭合落地链路）。**

**Goal:** 超大 / 多来源 / 长 grill 的 PRD，reduced candidates 及早 checkpoint 进 PRD 草稿——closed → 正式 sections；unconfirmed → `Outstanding Questions` / `Planning Recheck` / `Evidence And Assumptions`（带 source_ref + evidence tag / confirmation posture）；resume-prd 从 PRD sections + source_ref 重建工作态。PRD 文件成为抗 context-loss 的外部记忆，而非靠 run-local。

**Requirements:** R14, R13, R5

**Dependencies:** U1, U2, U6（write-in 环节；执行上在 U6 之后、U3 之前）

**Files:**
- Add: `skills/spec-prd/references/large-input-checkpoint.md`
- Modify: `skills/spec-prd/SKILL.md`（Phase 3 Draft / write-timing：超大/长链路改“归约即 checkpoint”，普通 PRD 仍“闭合后写”。**本单元同时把 `large-input-checkpoint.md` 的 Reference Trigger Map trigger-only 引用加入 SKILL，并把 `source topology` test 从 U7 后的 12/8 推进到终态 13/9——文件创建 + SKILL 引用 + topology test 在 U8 原子落地，见 R7① P1-1 渐进同步**）
- Modify: `skills/spec-prd/references/prd-output-template.md`（write-timing 段 + reduced candidate 落点规则；并在 `:245`「new 闭合后写 / resume 增量写」邻近加一句 size 例外指针：超大/长链路按 U8 走归约即 checkpoint，size/chain 轴叠加于 new/resume 之上）
- Modify: `skills/spec-prd/references/prd-readiness-lens.md`（planning-recheck / provenance visibility：reduced candidate 的 evidence tag / confirmation posture + source_ref 可见且仍 advisory）
- Test: `tests/unit/spec-prd-contracts.test.js`
- Eval: `skills/spec-prd/evals/examples.json`

**落点决策（关键，避免实现随意；不扩列、不新增 schema）:**
- reduced-but-unconfirmed candidates 优先写进现有 **`Evidence And Assumptions`**（`claim | tag | source / owner | note`）：`tag` 承载 evidence tag / confirmation posture（`source-candidate` / `assumption`），`source` 承载 `source_ref`，`note` 标“未确认 / 待 owner”。**现有字段已天然编码 evidence posture + source_ref，无需新列。**
- 跨 planning 必须 re-confirm 的写进现有 **`Planning Recheck`**（`item | why recheck | required before | blocks planning?`）：`item` 含 `source_ref`，`why recheck` = “from large-input Map-Reduce, needs owner/source confirmation”，`required before` = planning。
- 已闭合的照常进正式 sections（Requirements / Acceptance / Decision Notes）。
- **不为 checkpoint 新增列、字段、transcript 或 progress schema。**

**External interface vs internal implementation（对齐 U7 design-source 的深模块拆分）:**

`large-input-checkpoint.md` 同 design-source 一样是 trigger-only branch reference，须按深模块拆分——调用方只学外部 interface，Map-Reduce/checkpoint 复杂度留在内部：

- **外部 interface（caller 消费：`product-expert-lens.md` 接口指针 / write-in / readiness）**：Reduce output 消费 shape `load_bearing_gap | owner_question_candidate | affected_write_targets | source_ref`、checkpoint 落点分类结果（已闭合→正式 sections / 未确认→`Evidence And Assumptions` / 跨 planning→`Planning Recheck`）、resume 锚点 `source_ref`。
- **内部 implementation（private to `large-input-checkpoint.md`）**：Map / Shuffle / Reduce 分块算法、跨块去重与冲突归约细节、chunk 协调、checkpoint 写时机内部步骤。
- **test 只锁外部 interface 字段锚点与消费方向**（grill/write-in/readiness 消费哪些外部字段），**不锁** Map-Reduce 内部归约算法、分块策略或归约结论（那是 LLM 语义判断）；与 U7 `:528`「不要求消费方读 internal probe trace」同构。

**Approach:**
- write-timing 二分（**size/chain 轴叠加在 `prd-output-template.md:245` 的 new/resume 轴之上，非并列**）：普通短链路 PRD 闭合后写（现有 new/resume 规则不变）；超大/长链路“归约即 checkpoint”——**`new + 超大` 走带标注 checkpoint，覆盖 new 的“闭合后写”**，但正式 sections 仍只接已闭合项，未确认项进 `Evidence And Assumptions` / `Planning Recheck`（符合 `:245` 避免半成品 durable sections 的本意：未确认项显式标注，不伪装成正式 section）。
- 首次 checkpoint 写入 gate：新 PRD 只创建一个 `docs/brainstorms/*-requirements.md` 草稿，使用标准 frontmatter（`artifact_kind: prd-requirements`, `status: draft`）和最小 skeleton；写入前必须给出目标路径与将落盘的 reduced-candidate 摘要，遵守当前 host 的 mutation/preview-first 边界，不 silent write。refine/resume 既有 PRD 时原地更新并保留 `spec_id` / stable IDs。`mode:report-only`、上游禁止写入、或用户只要求审查时，不创建 checkpoint 文件，只输出 checkpoint-ready preview 并说明 context-loss residual risk。
- resume：re-read PRD 正式 sections + Evidence/Planning Recheck 的 `source_ref` → 重建 understanding map 与 Lens risk 排序，默认优先按锚点恢复、避免全量重读；`source_ref` stale/缺失/冲突时允许 degraded 重新归约相关 chunk（记录原因）。
- 进度从 PRD 文件派生：正式 sections = 闭合；Evidence(source-candidate) / Outstanding / Planning Recheck = 未闭合。

**Test scenarios:**
- Happy path: 超大文档 → reduced candidates 落 `Evidence And Assumptions`（tag=source-candidate, source=source_ref），未一次性等闭合才写。
- Happy path: 首次 checkpoint 创建单一草稿 PRD 前展示目标路径 + reduced-candidate 摘要；resume/refine 既有 PRD 时原地更新并保留身份。
- Edge case: resume-prd re-read PRD + source_ref 重建状态，优先按锚点恢复、避免全量重读。
- Edge case: `source_ref` stale/缺失/冲突 → degraded 重新归约相关 chunk 并记录原因，不把 source_ref 恢复当绝对硬承诺。
- Error path: reduced candidate 未带 source_ref / evidence tag / confirmation posture → 不得伪装成 confirmed section 内容。
- Error path: 普通短链路 PRD 不被强制 checkpoint（write-timing 二分，不污染普通路径）。
- Error path: report-only/headless-no-write 场景不创建草稿，只输出 checkpoint-ready preview + residual risk。
- Error path: 不新增 `Planning Recheck` 新列、transcript 或 progress schema。

**Planned verification:** 运行 `npx jest tests/unit/spec-prd-contracts.test.js --runInBand` + `node skills/spec-prd/scripts/run-evals.js --json`；预期证据是 eval 含 checkpoint→resume 场景，fresh-source eval 覆盖“长链路失忆后从 PRD + source_ref resume”，且相关验证返回成功状态。

---

## Why This Is Better Than Naming-Only

Naming-only 方案假设当前三段 references 已完整解决目标，只缺解释。但用户最新校准指出：不能被当前实现限制。重新从目标看，真正需要强化的是“哪些问题值得问”的产品判断层。没有这个层，Requirements Grill 可能很勤奋但不锋利，Readiness Lens 可能很严格但太晚。

Product Expert Lens 把判断前置：

```text
不是先问一串问题再判断质量；
而是先用顶尖产品判断找出会拖累下游的 WHAT gaps，
再只问能关闭这些 gaps 的问题。
```

---

## Risks And Controls

| Risk | Control |
| --- | --- |
| 产品专家 lens 变成泛泛 PM checklist。 | 只接受会影响 PRD write target 或 downstream confirmation 的问题。 |
| lens 发明行业/业务事实。 | source-first + owner confirmation；行业 norm 只能作为 question 或 assumption。 |
| 新 reviewer 导致 workflow 变重。 | 默认 inline；只在高风险触发下 delegated reviewer。 |
| 过度扩大到 0-1 产品探索。 | unresolved product shape route to `spec-brainstorm`。 |
| 引入新 reference 被旧 topology test 阻止。 | 更新 test，因为 test 守护目标，不应反过来限制合理架构。 |
| 抽 lens 后出现两份 product lens 互相漂移。 | U1 强制单一真相源：移动而非新增，output template 改为按名引用，同步 `canonical lens reuse` 断言。 |
| Product Expert Lens 默认文件承载过多低频分支，导致 skill 变长、变散、触发不稳定。 | Progressive Disclosure Boundary：`product-expert-lens.md` 只承载核心判断与接口；design-source 与 large-input/checkpoint 拆到 trigger-only references，并由 tests 锁“默认加载 vs 触发加载”边界。 |
| Product Expert Lens interface 只列字段、不列消费不变量，导致 grill/write/readiness 各自解释排序和 closure。 | Product Expert Lens Interface Invariants：明确 gap 必须绑定 write target、risk 只排序不评分、各调用方只消费自己的小 interface、无法排序但 load-bearing 的 gap 必须显式 carry。 |
| SKILL.md 改动撑破前 140 行必含锚点预算 / 负向断言自引用。 | 优先扩写现有 mental map 行；负向断言用字符串拆分构造（沿用 retired-anchor test 既有 pattern）。 |
| 成型输入综合被误做成 to-prd 字段表。 | R9/U6 上限为 WHAT/HOW 分离的反向补充，禁 `to-prd` 专名与固定字段表。 |
| design-source card 固定字段被测试/消费，却继续宣称“not a schema”导致 contract 纪律不清。 | U7 明确它是 light run-local contract，不是 persistent schema；tests 只锁字段锚点存在，不锁 provider 结果或语义判断。 |
| design-source card 过宽，把 provider 探测实现细节变成调用方 interface，导致浅模块化。 | U7 将 external evidence interface 与 internal probe trace 分开；Lens / write-in / readiness 只消费 source_ref、evidence posture、design WHAT、reconciliation、write target 与 degraded reason。 |
| Figma 设计稿被当 confirmed scope authority，或 spec-prd 越界做一致性审计 / 自己装 MCP。 | Figma 是 capability-class advisory evidence，与 code/owner 校准；先探测当前 host Figma MCP/plugin，可用则读取，不可用则引导安装当前 host 官方 Figma MCP/plugin 或请求截图/导出 context；除非未来 registry 显式支持 optional `figma`，否则不指向 `spec-mcp-setup`；一致性审计 route 到 `spec-app-consistency-audit`；never-block。 |
| design-source 被误挂到 project-graph/code-graph contract，导致 provider 边界漂移。 | U7 不修改 `project-graph-consumption.md`，设计源边界先由 `product-expert-lens.md` / `prd-output-template.md` 承载；`SKILL.md` 只写 provider-neutral design-source 提示，不把 Figma 或 graph contract 变成 scope authority。 |
| 超大文档下 Lens 与 Map-Reduce 各跑各的（两套并列 shape），或 Lens 试图一次吞整个文档。 | R13 / Large-Input Coordination：Map-Reduce 先归约，Reduce output 首尾接 Lens 排 risk；Lens 只消费归约结果；复用现有 Map-Reduce/Split，不新造。 |
| 长链路/超大文档 context 失忆，run-local 归约成果丢失，需重读整个文档且结果不一致。 | R14 / Long-Chain Checkpoint：超大/长链路时归约即落 PRD 草稿（带 evidence tag / confirmation posture + source_ref），PRD 文件做 checkpoint，resume-prd 优先按 source_ref 恢复；source_ref 失效时 degraded 重归约相关 chunk，不新建 transcript/schema；首次 checkpoint 遵守目标路径预告与 preview/mutation 边界。 |
| 维护者本机 Figma MCP 可用被误写成所有用户可用。 | 明确 per-run / per-user / per-host / per-OS 探测；当前会话 `whoami` 只作 sample evidence，不进长期 contract、fixture、默认文案或 runtime mirror；Windows/macOS/Linux 都必须有 missing/unauthorized fallback。 |

---

## Completion Criteria

- `SKILL.md` 明确 Product Expert Lens 是 `spec-prd` 的 first-class internal flow layer。
- Product Expert Lens 产出的 gap 必须连接到 owner question、PRD write target、readiness closeout。
- Product Expert Lens 的 interface invariants 可见：grill/write-in/readiness 各自只消费小 interface，排序、归约和产品判断复杂度不泄漏给调用方。
- PRD closeout 明确回答“哪些下游确认已前置解决，哪些仍 carry”。
- 高风险场景有 product reviewer escalation rule，但无 public helper workflow。
- Contract tests/evals 覆盖产品判断质量，而不是只覆盖流程命名。
- `product-expert-lens.md` 只包含默认 authoring 所需核心判断与接口；`design-source-evidence.md` / `large-input-checkpoint.md` 为 trigger-only references，普通 PRD authoring 不默认加载其完整细节。
- 前端/UI 输入含 Figma 链接时，contract/eval 覆盖工具发现、授权探测、node context 读取、降级引导、advisory 标记、矛盾暴露、per-user/per-host/per-OS 探测、无维护者本机事实泄漏、跨平台无硬编码安装命令和 headless no-fetch 边界。
- `project-graph-consumption.md` 仍只服务 project/code graph；design-source 不进入 setup/readiness baseline，除非未来另有 optional provider registry 方案。
- 超大 / 长链路 PRD 可从 PRD 文件 sections + `source_ref` resume（reduced candidates 带 evidence tag / confirmation posture），contract/eval 或 fresh-source eval 覆盖 checkpoint → resume，默认优先按锚点恢复、避免全量重读（source_ref 失效时允许 degraded 重归约）、首次 checkpoint 不 silent write、不新建 transcript/progress schema。
- Generated runtime mirrors 通过 generator 刷新，未手改。

---

## Current State Note

`2026-06-24-001` 和 naming-only 思路保留为历史证据，但不再作为目标方案。它们正确识别了 `to-prd adapter` 不应固化，却低估了 Product Expert Lens 对目标实现的必要性。本方案取代它们。

---

## Completion Evidence

- Implementation: `product-expert-lens.md` 成为 `spec-prd` 默认热路径 canonical 产品判断层；`design-source-evidence.md` 与 `large-input-checkpoint.md` 作为 trigger-only references 接入；grill、write-in、readiness、eval、用户手册和 fresh-source eval artifact 已同步。
- Verification: `npx jest tests/unit/spec-prd-contracts.test.js --runInBand`、`node skills/spec-prd/scripts/run-evals.js --json`、`npm run typecheck`、`npx jest tests/unit/changelog-format.test.js tests/unit/task-pack-command.test.js --runInBand`、`git diff --check` 均通过。
- Review: 三个只读 reviewer 完成架构/边界、测试/eval、文档/用户面审查；已修复 `Planning Recheck` producer-side handoff 边界、eval sentinel 覆盖、provider-neutral 热路径、source topology drift 和 fresh-source artifact metadata。
- Runtime boundary: 未手改 `.claude/`、`.codex/` 或 `.agents/skills/` generated runtime mirrors；本次变更保持 source-first。

---

## Sources & References

- Source workflow: [skills/spec-prd/SKILL.md](../../skills/spec-prd/SKILL.md)
- Output template: [skills/spec-prd/references/prd-output-template.md](../../skills/spec-prd/references/prd-output-template.md)
- Grill reference: [skills/spec-prd/references/grill-with-docs-integration.md](../../skills/spec-prd/references/grill-with-docs-integration.md)
- Domain reference: [skills/spec-prd/references/domain-language-and-decision-ledger.md](../../skills/spec-prd/references/domain-language-and-decision-ledger.md)
- Readiness reference: [skills/spec-prd/references/prd-readiness-lens.md](../../skills/spec-prd/references/prd-readiness-lens.md)
- Role contract: [docs/10-prompt/结构化项目角色契约.md](../10-prompt/结构化项目角色契约.md)
