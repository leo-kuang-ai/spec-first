---
date: 2026-05-30
topic: prd-skill
spec_id: 2026-05-30-001-prd-skill
artifact_kind: prd-requirements
status: superseded
superseded_by: docs/brainstorms/2026-05-30-003-spec-prd-owner-final-requirements.md
superseded_note: "本文是架构方向复核(候选1 vs 候选2)与外部竞品 curl 核验的分析输入。最终需求以 003 为准；003 已采纳新增 spec-prd 方向并吸收本文风险。仅作历史分析证据,不再作为 planning source。"
origin:
  - /Users/kuang/xiaobu/claude-skills/prd-generator/SKILL.md
  - /Users/kuang/xiaobu/claude-skills/competitive-analysis/SKILL.md
  - /Users/kuang/xiaobu/skills/docs/prd-skill-competitive-analysis.md
  - docs/业界分析/14.prd-skill-竞品分析-2026-05-30.md
---

# PRD 完善输出 Skill

## Summary

把"已有需求文档细化 / 一句话需求 / 早期想法"高质量转成 PRD-grade requirements。核心差异化是在缺少历史需求知识库时，用 GitNexus + bounded source reads 重建系统现状（业务流程、页面/路由/API、权限、状态/异常），作为需求准确度与完善度的证据输入，并按端类型（App/PC/H5/Admin/Java 后台/CLI）加载差异化关注点。

**承载形态尚未定稿。** 本文档初稿假定"新增独立 `spec-prd` workflow"。经角色契约（`docs/10-prompt/结构化项目角色契约.md`）与现有资产复核后，owner 推荐改为"增强 `spec-brainstorm`（两个可选 reference）"，理由见下方「架构方向复核」。两个方向的需求实质（场景、actors、flows、domain lens、验收）一致，差异只在承载形态与入口治理。这是进入 planning 前必须由 owner 拍板的首要决策。

---

## 架构方向复核（2026-05-30，待 owner 决策）

> 本区块是这轮深度调研的核心结论，用于校准本文档其余部分的承载形态假设。需求实质（下方 Actors / Key Flows / Requirements / Domain lenses / Acceptance Examples）**不随方向变化**；变的只是它落在哪个 workflow、如何暴露入口、是否新增 skill。

### 三个目标场景已被现有链路基本覆盖

| 用户场景 | 现有 `spec-brainstorm` 能力 | 覆盖度 |
|---|---|---|
| 细化/完善已有需求文档 | Phase 0.1 Resume：读已有 `*-requirements.md`、保留决策、原地更新 | 已覆盖 |
| 一句话需求 → 澄清 → 输出文档 | 空描述询问 + 一次一问协作对话 + Phase 3 写 `requirements-capture` | 已覆盖 |
| 只有想法 → 一起分析 | brainstorm（定 WHAT）；要发散方向时前置 `spec-ideate` | 已覆盖（跨两 skill） |

`requirements-capture.md` 已自称 "lightweight PRD without PRD ceremony"，并支持 R/A/F/AE IDs、acceptance examples、success criteria、scope boundaries、triggered PM 字段。

### 四个诉求里，真正的增量只有两个

| 诉求 | 现状 | 判断 |
|---|---|---|
| 质量门 / gap review | `Requirements Readiness Gate` 已于 **2026-05-29** completed（plan `2026-05-29-001`） | 已做，**不应重复**（本文 R18 与之重叠） |
| 完整 PM 字段 | `requirements-capture` 已支持触发式 goals/metrics/risks 等 | 基本覆盖，至多 evidence-gated 小校准 |
| **brownfield 代码理解** | brainstorm 的 graph posture **故意压制**代码理解，只服务 greenfield WHAT | ⭐ **真实盲区**，2026-05-29 竞品报告也未覆盖 |
| **多端 lens（app/pc/h5/admin/Java）** | 全仓库零处提及端差异化关注点 | ⭐ **真实盲区** |

### 候选 1 的 steelman（先把支持新增 skill 的最强论据说足）

不预设结论。候选 1（新增 `spec-prd`）有三条真实论据，必须正面回应而非回避：

1. **心智模型差异。** "我要从代码库生成一份 PRD" 与 "我们一起 brainstorm 要做什么" 是两种用户心智。搜索 "PRD" 的用户不会想到 `brainstorm`。这是候选 1 最强的牌（discoverability）。
2. **重量级 current-state 阶段。** `spec-brainstorm` 刻意保持轻量(graph posture 故意压制代码理解)。一个带系统现状重建的重阶段塞进 brainstorm，可能稀释它的轻量气质。
3. **create/refine/validate 生命周期。** 借鉴 BMAD，一个专用 workflow 承载三 intent 比塞进 brainstorm 更干净。

### 两个候选承载形态（带本轮取证的硬证据）

| 维度 | 候选 1：新增 `spec-prd` skill | 候选 2：增强 `spec-brainstorm`（owner 倾向） |
|---|---|---|
| 多真相源 | **高**：`spec-plan` SKILL.md line 154 已 `search docs/brainstorms/*-requirements.md` 并视为 source-of-truth；两个 producer 写同一 artifact 类正撞角色契约 §7"是否导致多真相源? 必须重构" | 低：单一需求侧 producer |
| 入口治理 | 路由器需在每个"类需求"请求上区分 brainstorm vs spec-prd，长期 routing-ambiguity 税；撞 `using-spec-first` 硬规则 2 | 沿用既有单入口；discoverability 用路由关键词+description 补 |
| 落地成本（取证） | **≥8 登记点**：`skills/spec-prd/SKILL.md`+`templates/claude/commands/spec/prd.md`(新建) + `skills-governance.json`(424 行 dual-host 注册) + `using-spec-first` route map + `README.md` + `README.zh-CN.md` + `AGENTS.md` + 版本规划 §6.1 inventory + contract tests | 小：2 reference + SKILL 触发段 + eval；零 governance/README/路由改动 |
| 与 Readiness Gate | R18 再内置一个 gate，与 2026-05-29 已 completed 的 `Requirements Readiness Gate` 重复造门 | 直接复用 `requirements-capture.md` line 215 的现有 gate |
| 重量级阶段 | 放进新 skill | 用 progressive disclosure：reference 仅在 brownfield+Standard/Deep 触发，greenfield/lightweight 零加载——与 `universal-brainstorming.md` 仅在非软件路由加载同构 |
| 真实增量承载 | brownfield + lens 放进新 skill | `references/brownfield-grounding.md` + `references/surface-lens-palette.md` 按需加载 |

### 对候选 1 三条论据的回应

1. **心智模型/discoverability** — 真实，但不需要新 skill 解决：在 `using-spec-first` route map 增 "PRD / 需求文档完善 / 代码现状辅助需求" 关键词路由到 `spec-brainstorm`，并在 brainstorm SKILL.md `description` 显式点名 PRD。零新 skill。
2. **重量级阶段稀释轻量** — 不成立。brainstorm 已用 scope 分层(Lightweight/Standard/Deep)+条件 reference 控重；2026-05-29 changelog 显示它**已识别"已有产品/系统的工程演化"这一 brownfield 子模式**(只是缺 code-grounding posture)。重阶段由触发式 reference 承载，对轻量 greenfield 零负担。
3. **三 intent 生命周期** — 已被现有链路覆盖:`create`=brainstorm 空描述/协作对话; `refine`=brainstorm Phase 0.1 Resume(读已有 doc、保留决策、原地更新); `validate`=`spec-doc-review`。三者均无需新 skill。

> 类比佐证:`spec-plan` 同样"重"且同样读 requirements，但 spec-first 没有把它拆成 plan-greenfield / plan-brownfield。**重量靠分层+条件 reference 承载，不靠 skill 增殖**——这是已确立的 spec-first 模式。

### Owner 推荐

推荐**候选 2**：把 brownfield current-state grounding 与多端 lens 作为 `spec-brainstorm` 的两个可选 reference 落地，**不新增 skill、不新增 `spec-*` 入口、不新增 schema**。依据角色契约优先级——"清晰边界 > 功能完整""可信证据 > 自动化便利""更小可维护方案 > 更完整设计"，§18 刚完成的 schema budget 纪律，以及本轮取证的成本不对称(≥8 登记点 vs 2 reference)与 `spec-plan` 已消费该 artifact 路径的事实。

**唯一硬风险（两个方向共有）**：brownfield 现状重建不得反向驱动 HOW（schema/endpoint/类名/文件布局仍归 `spec-plan`）。须**复用** `skills/spec-plan/references/graph-evidence-posture.md` 的四轴 evidence 词表(`capability_status`/`evidence_grade`/`evidence_posture`/`freshness_state`)与非法组合矩阵、Scope Authority 子句，**不另造第二套证据词表**(本文 §Current-State Analysis Contract 的五级标签应映射到该四轴，而非平行发明)；并由 fresh-source eval 专门断言"greenfield 不触发该 reference、Requirements 段无实现细节泄漏"。

### 文档读法（重要）

本文档**正文（Requirements / Product Shape / Domain Lens Matrix / U1–U6 / Key Decisions）仍以候选 1 的措辞书写**(沿用初稿)，因为需求实质与方向无关、改写全文成本高且易引入错误。若 owner 选候选 2，按下表做**最小语义映射**即可，不必逐条重写：

| 正文元素（候选 1 措辞） | 候选 2 下的等价落点 |
|---|---|
| R1「`spec-prd` 作为公开 workflow」 | 删除；改为"brainstorm 识别 PRD/brownfield 意图后加载两个 reference" |
| R2 三 intent | create=brainstorm 协作对话; refine=brainstorm Resume; validate=`spec-doc-review` |
| R18 内置 PRD Readiness Gate | 复用 `requirements-capture.md` 现有 Requirements Readiness Gate，仅按 brownfield 补 current-state-accuracy 维度 |
| §Current-State Analysis Contract / §Domain Lens Matrix | 成为 `references/brownfield-grounding.md` 与 `references/surface-lens-palette.md` 内容 |
| §PRD Markdown Output Template | 折叠进 `requirements-capture.md` 的 triggered sections，不新建模板真相源 |
| U1（新建 skill + command + governance） | 删除 |
| U2（4 个 references） | 收敛为 2 个 reference |
| U3（using-spec-first 路由到 spec-prd） | 改为路由关键词指向 `spec-brainstorm` |
| U4（spec-plan 认 artifact_kind） | 多数已满足（plan 已读 `*-requirements.md`），仅确认 frontmatter 容忍 |
| U5/U6（contract tests / README） | 收敛为 brainstorm contract test + eval；README 改动可选 |

### 三场景 × 两增量的直接交叉（回应你的核心目标）

你的目标是"提升产品输出需求质量，产物是 md"。三场景如何吃到两个真实增量：

| 你的场景 | brownfield grounding 增益 | 多端 lens 增益 | 降人工成本点（你的思考 2） |
|---|---|---|---|
| 想法+代码 → 增量需求 | 先重建现状底图，让 owner 在"看懂现状"后再提增量，避免凭空想象 | 按目标端补该端必看现状 | 自动补名词/用例/异常/交互/验收(R21–R26) |
| 一句话需求 | 用 graph+source 把一句话锚到真实流程/角色/状态 | 端 lens 暴露易漏关注点(如 admin 的审计/批量) | 同上，owner 只需确认而非从零写 |
| 完善已有文档 | 对比文档与代码现状，产 gap report | 按端补该文档缺的关注点 | patch-style addendum，保留证据来源 |

---

## Problem Frame

当前 `spec-brainstorm` 能把粗略想法整理为 right-sized requirements，但它不是正式的 PRD 输出 skill，也不是代码/业务流程现状分析输入层。它的 repo scan 是轻量的：读相关文档、相似 artifact、必要时用 GitNexus `query/context` 做 orientation，并要求重要 claim 用源码确认。它不会系统地把当前产品流程、页面路由、API、后台规则、权限、状态、异常路径和已有测试组织成 PRD 输入。

用户提出的三个场景正好暴露了这个缺口：

- 已有需求文档需要进一步细化、完善、优化、补充。
- 只有一句话需求，需要辅助澄清并输出需求文档。
- 只有一个产品想法，需要共同分析、清晰需求并输出需求文档。

对一个已存在代码库来说，PRD 不能只问用户“你想要什么”。如果系统已经有业务流程、数据模型、权限边界、已有页面/API 或后台任务，新需求的准确性取决于 agent 是否理解现状。没有历史需求库时，代码和图谱就是最可靠的 current-state 输入。

---

## Goals

- 生成或完善 PRD-grade requirements，作为 `spec-plan` 的上游 source-of-truth。
- 在 PRD 生成前提供 current-state analysis：现有能力、业务流程、角色/权限、页面/API、状态/异常、约束和可复用模式。
- 支持已有 PRD refinement、一句话需求 create、想法探索到 PRD 三种入口。
- 根据端类型加载差异化关注点：App、PC/H5、Admin、Backend/Java、CLI/DevTool 等。
- 明确 evidence provenance：用户已说事实、源码确认事实、GitNexus pointer、外部研究、agent assumption 必须分开。
- 帮助产品 owner 降低人工补全成本：自动补齐名词解释、产品用例、异常处理、交互约束、验收样例、风险和开放问题。
- 让 PRD 输出可被 `spec-plan`、`spec-doc-review`、`spec-write-tasks` 和后续 review/work 链路稳定消费。

## Non-Goals

- 不替代 `spec-brainstorm` 的开放式 ideation / product shaping。
- 不替代 `spec-plan` 做技术设计、文件改动方案、数据库/API 设计或任务拆解。
- 不创建长期历史需求知识库、中心化需求数据库或状态机。
- 不默认联网做市场/竞品研究；只有用户要求竞品分析或外部研究时才启用。
- 不把 GitNexus 结果当 confirmed truth；图谱结果必须作为 pointer 或 session-local evidence，并由源码/测试/用户确认支撑关键结论。
- 不手改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime。

---

## Actors

- A1. 产品/业务 owner：提供需求意图、业务目标、优先级和不做范围。
- A2. PRD workflow orchestrator：组织澄清、current-state scan、PRD 写作和 readiness gate。
- A3. GitNexus / source evidence provider：提供代码结构、符号、流程、route/API/tool 等 orientation；最终事实仍需源码确认。
- A4. Downstream planner：消费 PRD-grade requirements，输出 implementation plan。
- A5. Reviewer：通过 `spec-doc-review` 或 code review 检查 PRD 的完整性、可验收性和与现有系统的一致性。

---

## Key Flows

- F1. Existing PRD refinement
  - **Trigger:** 用户提供已有需求/PRD 文档路径，要求细化、完善、优化或补充。
  - **Actors:** A1, A2, A3, A5
  - **Steps:** 读取 PRD -> 提取现有结构和 gaps -> 做 current-state scan -> 对比 PRD 与代码/流程现状 -> 输出修订版或 addendum -> 运行 PRD readiness gate。
  - **Outcome:** 原需求被补强为可规划、可验收、证据来源明确的 PRD-grade requirements。
  - **Covered by:** R1, R2, R3, R6, R9

- F2. One-line requirement to PRD
  - **Trigger:** 用户给一句话需求或短 issue。
  - **Actors:** A1, A2, A3
  - **Steps:** 判断端类型和目标 repo/scope -> 最多先问一到三个阻塞问题 -> 使用 GitNexus/source reads 建立 current-state snapshot -> 生成 PRD-grade requirements -> 标记 assumptions/open questions。
  - **Outcome:** 一句话需求变成有 actors、flows、requirements、acceptance examples、scope boundaries 和 current-state evidence 的需求文档。
  - **Covered by:** R1, R2, R4, R5, R6, R8

- F3. Idea to PRD
  - **Trigger:** 用户只有产品想法，仍需要分析方向和需求边界。
  - **Actors:** A1, A2
  - **Steps:** 先进行产品问题澄清；如果产品形态仍不清楚，建议转 `spec-brainstorm`；如果方向足够清楚，则继续 current-state scan 和 PRD 输出。
  - **Outcome:** 不把模糊想法直接包装成伪完整 PRD；明确何时进入 brainstorm，何时可以生成 PRD。
  - **Covered by:** R4, R7, R10

- F4. PRD to downstream plan
  - **Trigger:** PRD readiness gate 通过或用户确认带 assumption 继续。
  - **Actors:** A2, A4, A5
  - **Steps:** 保存 `docs/brainstorms/*-requirements.md` -> 保留 `spec_id`、R/A/F/AE IDs 和 evidence section -> 推荐 `spec-doc-review` 或 `spec-plan`。
  - **Outcome:** PRD 成为现有 spec-first 链路的 Spec 节点，而不是另一个孤立文档。
  - **Covered by:** R6, R9, R11, R12

- F5. PRD detail enrichment
  - **Trigger:** PRD 草稿已有主需求，但缺名词、用例、异常、交互设计或验收细节。
  - **Actors:** A1, A2, A3, A5
  - **Steps:** 识别缺失模块 -> 从现有代码/文档抽取术语和流程 -> 按端类型 lens 补充用例、状态、异常、交互和验收 -> 标注未确认假设 -> 输出可 review 的 MD。
  - **Outcome:** 产品 owner 不需要手工从零补齐 PRD 细节，但仍能看到哪些内容是事实、推断或待确认。
  - **Covered by:** R21, R22, R23, R24, R25, R26

---

## Requirements

**Workflow entry and routing**

- R1. `spec-prd` 必须作为一个公开 workflow command/skill 暴露，首版不拆多个公开 PRD skill。
- R2. `spec-prd` 必须支持 `create`、`refine`、`validate` 三种 intent；intent 可由用户输入和 artifact path 推断，但不确定时只问一个澄清问题。
- R3. 当用户明确提供已有 PRD/requirements 路径时，workflow 必须把该文档作为 primary input，不得从零重写或忽略原文。
- R4. 当输入是一句话需求或想法时，workflow 必须先判断产品形态是否足够清楚；不足以写 PRD 时，应转入或建议 `spec-brainstorm`，而不是生成伪完整文档。

**Current-state analysis**

- R5. PRD 生成或完善前，workflow 必须做 scope-appropriate current-state scan，覆盖相关的现有能力、业务流程、页面/路由/API、权限/角色、状态/异常、配置/后台任务、已有测试或文档。
- R6. Current-state scan 必须区分 `confirmed source read`、`GitNexus pointer`、`user-stated`、`external research`、`assumption` 五类证据来源；未确认事实不得写成系统现状。
- R7. GitNexus evidence 只能作为 orientation 或 session-local pointer；与源码、测试或用户确认冲突时，必须降级并以可复验事实为准。
- R8. Current-state facts 只能约束、提示和暴露风险，不得自动扩大需求范围或把代码现状反向当成产品目标。

**PRD output**

- R9. 输出主 artifact 默认仍落在 `docs/brainstorms/YYYY-MM-DD-NNN-<slug>-requirements.md`，使用 `spec_id` 和 R/A/F/AE IDs，确保 `spec-plan` 可继续消费。
- R10. PRD 内容必须 right-sized：小需求不强行填满完整 PM PRD，大需求必须包含 actors、key flows、requirements、acceptance examples、success criteria、scope boundaries、dependencies/open questions。
- R11. PRD-grade sections 可以额外包含 Current System Snapshot、Change Delta、Goals、Success Metrics、Risks、Dependencies、Launch/Rollout Notes，但无证据内容必须进入 Open Questions 或 Assumptions。
- R12. PRD 不得包含 implementation units、文件改动计划、数据库 schema、接口设计细节或任务拆解，除非需求本身就是技术/架构行为且已明确标为需求约束。

**PRD authoring assistance**

- R21. Workflow 必须为 PRD 输出生成或维护 `名词解释`，术语来源可来自用户输入、现有文档、代码标识符和 UI/API 命名；推断术语必须标注为待确认。
- R22. Workflow 必须输出产品用例或用户场景，每个核心用例至少包含 actor、trigger、precondition、main path、alternative/error path、expected outcome 和 covered requirements。
- R23. Workflow 必须覆盖异常处理：输入异常、权限异常、状态冲突、弱网/超时、重复提交、部分成功、回滚/撤销、兼容/降级，按端类型裁剪。
- R24. Workflow 必须覆盖交互设计约束：入口、信息架构、关键状态、反馈文案、确认/取消、空态/加载/错误态、可访问性或国际化需求；不产出高保真 UI 设计。
- R25. Workflow 必须生成验收样例，条件型行为使用 Given/When/Then 或等价 EARS 风格表达，避免“支持/优化/完善”等不可验收表述。
- R26. Workflow 必须把无法确认的产品细节放入 Open Questions，不得为了文档完整而编造指标、文案、交互、客户反馈或业务规则。

**Domain lenses**

- R13. Workflow 必须按端类型加载差异化关注点，而不是使用一套固定模板覆盖所有系统。
- R14. App / H5 / PC lens 必须关注页面流、导航、状态、弱网/权限、埋点、i18n/accessibility 和多端一致性。
- R15. Admin lens 必须关注角色权限、批量操作、审核/回滚、导入导出、审计日志、表格筛选和危险操作确认。
- R16. Backend / Java lens 必须关注 API contract、数据一致性、幂等、错误码、安全、性能、迁移、观测性和向后兼容。
- R17. CLI / DevTool lens 必须关注命令入口、配置、错误恢复、dry-run/preview-first、日志、跨平台和升级路径。

**Quality gate and handoff**

- R18. Workflow 必须内置 PRD Readiness Gate，检查 ambiguity、evidence provenance、testability、codebase fit、scope boundaries、planning invention risk。
- R19. Readiness gate 失败时，workflow 必须优先提出最小澄清或修订建议；用户可选择带 assumptions 继续，但文档必须记录风险。
- R20. 完成后必须提供下一步：`spec-doc-review`、`spec-plan`、继续 refine、或 done for now；不得直接进入 `spec-work`，除非需求极小且已满足现有 brainstorm direct-to-work 等价条件。

---

## Product Shape

`spec-prd` 是一个面向产品 owner 的 PRD-grade requirements workflow。它不是只“生成文案”，而是一个带证据和质量门的需求协作台。

| 产品场景 | 用户输入 | Skill 核心动作 | 输出 |
| --- | --- | --- | --- |
| 已有 PRD 完善 | PRD/requirements path 或粘贴内容 | 保留原意，抽取 gaps，结合现状补齐细节 | 修订版 requirements 或 addendum |
| 一句话需求 | “给后台加批量导入”这类短描述 | 问最少阻塞问题，扫描现状，补齐 PRD 结构 | PRD-grade requirements |
| 想法成型 | “想做一个更智能的...” | 先判断是否需要 brainstorm；能收敛时进入 PRD 输出 | 需求方向 + PRD 或 brainstorm handoff |
| PRD 质量检查 | 已有文档但不确定是否完整 | 执行 readiness gate 和 codebase fit 检查 | gap report + 修订建议 |

首屏交互不应像问卷。推荐 opening move 是一句 scope summary + 一个最关键问题。例如：

```text
我会先把这个想法和当前代码里的相关流程对齐，再输出可交给 plan 的需求文档。
先确认一个点：这是要改现有流程，还是新增一条独立流程？
```

---

## Current-State Analysis Contract

Current-state analysis 是本 skill 的核心差异化。它给产品 owner 一个“现状底图”，让增量需求建立在真实系统上，而不是纯聊天想象。

### Inputs

- 用户输入：想法、PRD、issue、会议纪要、截图描述或目标模块。
- Repo evidence：代码、测试、docs、plans、solutions、contracts、README、现有 requirements。
- GitNexus evidence：query/context/route/API/tool 等 read-only orientation。
- External evidence：仅在用户显式要求竞品、行业或市场研究时使用。

### Scan Order

1. **Intent and artifact scan:** 读用户输入和已有 PRD，提取目标对象、端类型、业务名词和候选流程。
2. **Repo orientation:** 用 `rg` / GitNexus `query/context` 找相关代码、文档、测试和历史方案。
3. **Source confirmation:** 对关键现状 claim 精确读源码/文档；GitNexus 只做 pointer。
4. **Flow reconstruction:** 还原当前主流程、异常路径、权限/角色、状态和数据/接口边界。
5. **Delta framing:** 区分“现状已有 / 需要新增 / 需要修改 / 不确定 / 不做”。
6. **PRD synthesis:** 把现状和增量需求一起写入 PRD，保留证据来源和 open questions。

### Output Shape

```markdown
## Current System Snapshot

### Existing flows
- CS1. [流程名]
  - **Current behavior:** [当前行为]
  - **Entry points:** [页面/API/命令/后台任务]
  - **Actors / permissions:** [角色与权限]
  - **States / errors:** [状态和异常]
  - **Evidence:** [confirmed source read / GitNexus pointer / user-stated / assumption]

### Change delta
- D1. Keep: [保留的现状]
- D2. Extend: [基于现状扩展]
- D3. Replace: [要替换的行为]
- D4. Unknown: [需要产品确认或 planning 验证]

### Existing constraints
- [业务、合规、技术、兼容、数据、性能、运营约束]
```

### Evidence Rules

| Evidence tag | 可写入 PRD 的强度 | 规则 |
| --- | --- | --- |
| `confirmed-source` | confirmed | 已直接读取源码、测试、文档或合同，可作为现状事实 |
| `user-stated` | confirmed for intent | 用户明确表达的产品意图，可作为需求来源 |
| `gitnexus-pointer` | advisory/session-local | 只能指向候选代码/流程，关键结论需源码确认 |
| `external-research` | advisory 或 confirmed-by-source | 需标注来源和日期，不替代本地产品事实 |
| `assumption` | unconfirmed | 只能进入 Assumptions 或 Open Questions |

---

## PRD Markdown Output Template

`spec-prd` 的最终交付是 Markdown 文档。默认使用 `docs/brainstorms/YYYY-MM-DD-NNN-<slug>-requirements.md`，frontmatter 必须包含 `spec_id`，并可包含 `artifact_kind: prd-requirements`。

```markdown
---
date: YYYY-MM-DD
topic: <slug>
spec_id: YYYY-MM-DD-NNN-<slug>
artifact_kind: prd-requirements
source_prd: <optional path>
target_surface: app | h5 | pc | admin | backend | cli | mixed
evidence_grade: confirmed | mixed | assumption-heavy
---

# <需求标题>

## Summary
[1-3 行：这次要交付什么增量能力。]

## Problem Frame
[为什么要做，当前用户/业务/系统痛点是什么。]

## Current System Snapshot
[当前流程、入口、角色、状态、约束和证据。]

## Goals / Non-Goals
[目标和明确不做。]

## Glossary
| Term | Meaning | Source | Confirmation |
| --- | --- | --- | --- |

## Actors
- A1. [角色]: [职责和权限]

## Key Flows / Use Cases
- F1. [用例名]
  - Trigger:
  - Actor:
  - Preconditions:
  - Main path:
  - Alternative / error path:
  - Outcome:
  - Covered by:

## Requirements
- R1. [可验收需求]

## Interaction / UX Requirements
- [入口、状态、反馈、文案、确认、空态、错误态、可访问性/i18n]

## Exception Handling
| Case | Trigger | Expected behavior | User/system feedback | Covers |
| --- | --- | --- | --- | --- |

## Acceptance Examples
- AE1. Covers R1. Given ..., when ..., then ...

## Success Metrics
- [有证据则写；无证据则进入 Open Questions]

## Risks / Dependencies
- [业务、技术、合规、运营、数据、交付依赖]

## Scope Boundaries
- [不做内容和后续迭代]

## Evidence And Assumptions
- Confirmed:
- GitNexus pointers:
- Assumptions:

## Outstanding Questions
### Resolve Before Planning
- [真正影响产品行为的问题]
### Deferred to Planning
- [技术方案或实现细节问题]
```

---

## Domain Lens Matrix

| Lens | 必看现状 | PRD 必补细节 | 常见异常 | 典型验收 |
| --- | --- | --- | --- | --- |
| App | 页面栈、导航、权限、弱网、离线、埋点、i18n | 空态/加载/错误态、权限弹窗、前后台切换、多端一致性 | 弱网、权限拒绝、重复点击、状态恢复 | 给定网络/权限状态，用户能看到正确反馈 |
| H5 / PC | 路由、表单、响应式、浏览器兼容、登录态 | 表单校验、跳转、浏览器返回、SEO/分享、埋点 | 表单半填、登录过期、刷新、跨端尺寸 | 不同视口和登录态下流程一致 |
| Admin | RBAC、列表筛选、批量操作、审核链路、审计 | 权限矩阵、批量规则、导入导出、危险操作确认 | 部分成功、权限不足、并发编辑、撤销/回滚 | 操作可追踪、可恢复、权限正确 |
| Backend / Java | API、数据模型、状态机、幂等、事务、错误码 | API 行为、数据一致性、兼容、性能、观测性 | 重试、超时、重复提交、并发、部分失败 | 契约稳定，错误码和状态转移可验证 |
| CLI / DevTool | 命令、配置、文件写入、跨平台、dry-run | 参数、预览、确认、日志、回滚、升级路径 | 路径非法、权限不足、中断、非 TTY | dry-run 可预览，失败可恢复 |
| Mixed | 多端/多服务边界、共享状态、事件链路 | source-of-truth、同步策略、降级、数据流 | 一端成功一端失败、延迟一致性 | 跨端行为和状态一致性可解释 |

---

## Interaction Model

`spec-prd` 应尽量降低产品 owner 的输入负担，但不能用自动补全掩盖关键产品决策。

1. **Scope confirmation:** 确认目标端、目标流程、是否改现有能力。
2. **Current-state reveal:** 先给产品 owner 展示现状摘要，而不是直接写最终 PRD。
3. **Gap questions:** 只问会改变产品行为、范围或验收的阻塞问题；一次一个。
4. **Draft PRD:** 输出 Markdown 草稿或对已有 PRD 的 patch-style addendum。
5. **Readiness gate:** 标出缺口、假设和 planning invention risk。
6. **Handoff:** 推荐 `spec-doc-review` 或 `spec-plan`。

产品体验关键点：让产品 owner 先“看懂现状”，再“确认增量”，最后“拿到文档”。这比直接问一长串 PRD 字段更符合目标。

---

## PRD Readiness Gate

PRD ready 的判断不是“章节都填了”，而是“下游不需要发明 WHAT”。

| Dimension | Pass signal | Fail signal |
| --- | --- | --- |
| Current-state accuracy | 关键现状 claim 有 source 或明确 assumption | 把 GitNexus pointer 或猜测写成 confirmed fact |
| Requirement clarity | R-IDs 可被唯一理解 | “优化/支持/完善/相关”等模糊动词无验收 |
| Use-case coverage | 核心 actor 和 flow 都有用例 | 只有功能列表，无触发、路径、结果 |
| Exception coverage | 关键异常有 expected behavior | 异常只写“提示错误”或完全缺失 |
| Interaction readiness | 入口、状态、反馈、取消/确认明确 | UI/交互需要实现者自行发明 |
| Testability | 条件行为有 acceptance examples | 无法判断实现是否满足 |
| Scope boundary | non-goals 和 deferred 清楚 | 相邻需求混入当前版本 |
| Planning handoff | Open Questions 已分类 | 仍有产品问题留给 `spec-plan` 猜 |

---

## Acceptance Examples

- AE1. **Covers R3, R5, R6.** Given 用户提供已有 PRD 路径并要求“完善”，when `spec-prd` 运行，then 输出必须保留原 PRD 的核心意图，补充 current-state snapshot 和 gap report，并明确每个关键补充的 evidence source。
- AE2. **Covers R4, R10, R19.** Given 用户只说“给后台加一个批量导入功能”，when 目标 repo 中已有 admin 表格和导入相关代码，then PRD 应包含 admin lens 下的权限、导入校验、失败行反馈、审计日志和回滚问题；未确认行为进入 Open Questions。
- AE3. **Covers R7, R8.** Given GitNexus 指向某 API 但源码读取发现 route 不存在或已重命名，when 写 Current System Snapshot，then GitNexus claim 必须降级为 stale/advisory pointer，不得作为 confirmed fact 写入。
- AE4. **Covers R9, R20.** Given PRD readiness gate 通过，when workflow 收尾，then artifact 保存在 `docs/brainstorms/*-requirements.md`，保留 `spec_id`，并推荐 `spec-plan` 或 `spec-doc-review` 作为下一步。

---

## Success Criteria

- 用户能从已有 PRD、一句话需求或早期想法得到可规划、可验收、证据来源明确的 PRD-grade requirements。
- 下游 `spec-plan` 不需要重新发明产品行为、边界、核心流程或验收样例。
- 没有历史需求知识库时，workflow 仍能通过代码和 GitNexus orientation 提升需求准确度。
- PRD 中的 current-state claim 可追溯到源码、GitNexus pointer、用户陈述或 assumption。
- 小需求保持轻量，大需求有足够结构，不用一个模板强套所有场景。

---

## Scope Boundaries

- `spec-prd` 是 Spec 节点 workflow，不是 Plan、Tasks、Code 或 Review 节点。
- `spec-brainstorm` 继续负责开放式产品澄清和 problem framing；`spec-prd` 负责 PRD-grade 输出和 codebase-aware 完善。
- `spec-plan` 继续负责技术方案、implementation units、文件路径、测试策略和风险落地。
- `spec-app-consistency-audit` 继续负责移动 App 静态一致性审查；`spec-prd` 可吸收其 lens 思想，但不复用其重型 artifact spine。
- Generated runtime mirror 不作为 source；新增 skill 后通过 `spec-first init` 生成 runtime。

---

## Key Decisions

- 单公开入口：首版用 `spec-prd` 一个 workflow，避免用户在 PRD create/refine/review/current-state 多入口之间选择。
- 单主 artifact：默认输出到 `docs/brainstorms/*-requirements.md`，而不是新增 `docs/prds/` 作为第二真相源。
- Current-state 是 PRD 输入层，不是实现范围扩张器。代码现状只能提供约束、复用机会和风险。
- Domain lenses 作为内部 references 条件加载，不拆成 app-prd/admin-prd/backend-prd 多个 skill。
- 确定性脚本首版可延后。先用 GitNexus + bounded source reads 建立 workflow 语义，后续再把稳定的文件发现和 facts extraction 下沉到 helper。

---

## Implementation Direction

> 下列 U1–U6 是**候选 1**的实现拆解。若选候选 2，按上文「文档读法」映射表收敛为：① 新增 `references/brownfield-grounding.md`（复用 graph-evidence 四轴，不造新词表）② 新增 `references/surface-lens-palette.md`（Domain Lens Matrix 内容）③ `spec-brainstorm/SKILL.md` 加 brownfield 触发段 + 多端识别段 ④ `using-spec-first` 加 PRD 关键词路由 ⑤ brainstorm contract test + fresh-source eval（brownfield 迭代 / greenfield 新建 / admin lens 三 fixture）⑥ CHANGELOG（README 可选）。无 U1 新建 skill、无 governance/AGENTS 改动。

首轮 implementation plan（候选 1）可按以下 units 拆：

- U1. 新增 `skills/spec-prd/SKILL.md`、`templates/claude/commands/spec/prd.md` 和 dual-host governance 注册。
- U2. 新增 references：`current-state-analysis.md`、`prd-template.md`、`domain-lenses.md`、`prd-readiness-gate.md`。
- U3. 更新 `using-spec-first` 路由，把明确 PRD / 需求文档完善 / 现状辅助需求输出路由到 `spec-prd`，保留模糊探索走 `spec-brainstorm`。
- U4. 更新 `spec-plan` intake，确认 `artifact_kind: prd-requirements` 的 `docs/brainstorms/*-requirements.md` 与普通 brainstorm requirements 等价消费。
- U5. 补 contract tests：public workflow summary、governance、skill entrypoint lint、spec-prd boundary、using-spec-first routing、spec-plan PRD artifact intake。
- U6. 更新 README / README.zh-CN / 用户手册 artifact map / CHANGELOG。

---

## 验证计划（落地后必跑）

任一候选落地后，最小验证集：

- `npm run lint:skill-entrypoints` — workflow entrypoint governance 未漂移（候选 1 必跑，因新增公开入口）。
- `npm run test:unit` 中聚焦 contract test — 候选 1：spec-prd boundary + governance + using-spec-first routing + spec-plan PRD intake；候选 2：brainstorm prose contract + brownfield 触发措辞 + 多端识别。
- **Fresh-source eval（核心防线，按 `docs/contracts/workflows/fresh-source-eval-checklist.md`）**，至少三 fixture：
  - **brownfield 迭代**：断言产出 Current System Snapshot 带 evidence grade，且 Requirements 段**无** schema/endpoint/类名泄漏。
  - **greenfield 新建**：断言**不触发** brownfield grounding（候选 2 下不加载该 reference）。
  - **admin lens**：断言加载 admin 关注点（RBAC/批量/审计/部分成功），未误用 app lens。
- Source/runtime 边界检查：确认未手改 `.claude/`、`.codex/`、`.agents/skills/`。
- 双宿主：brainstorm 是核心 workflow，Claude `spec-brainstorm` 与 Codex `spec-brainstorm` 共享同一 SKILL.md body（render-merge），改 source 即双宿主同步，但需各跑一次 fresh-source eval。
- `CHANGELOG.md`：source/doc/test 变更追加记录，作者读 `~/.spec-first/.developer`。

---

## 第三条路（仍悬而未决的前提）

本文档 `origin` 引用的竞品分析基准是 `/Users/kuang/xiaobu/skills` 与 `claude-skills` 仓库（不是 spec-first）。若 owner 真正想要的是**脱离 spec-first 工程链路、面向业务团队的通用 PRD 生成器**（更偏 PM、不绑代码闭环、不要求 GitNexus/源码证据），那它不该进 spec-first，而应回到独立 skill 仓库——这是与候选 1/2 都不同的第三条路。判别问题：**产物是否必须挂到 `Spec → Plan → Tasks → Code` 链路、是否以代码证据为核心差异化？** 是→候选 1/2；否→第三条路。

---

## 外部竞品一手核验（2026-05-30 curl 取证）

上一版本因子 agent 无联网，这五块标为"待补盲区"。现已用 `curl`（GitHub API + 官网原文）一手核验，结论如下，并修正两处旧判断：

| 对象 | 核验结果 | 证据 | 对本需求的含义 |
|---|---|---|---|
| **Tessl**（tessl.io 首页原文） | ⚠️**旧判断错误**。Tessl 现定位是 "Agent Enablement Platform"——skill 的安全扫描/策略门禁/审计、共享 registry/版本治理、eval-backed 持续优化（"Skills are the new code"）。**不是** spec registry，也不做 brownfield PRD。 | tessl.io 首页 | 与本需求无直接竞争；它治理的是 skill 供应链，不是需求文档。报告凡引用"Tessl=Spec Registry 对照"处应更正。 |
| **CodeStable `cs-req`**（★868，liuzhengdongfortest/CodeStable README） | ✅**强佐证候选 2 的判断**。CodeStable 以"软件要素"(需求/架构/特性/决策)为中心；`cs-req` 是**第 1 层长效档案"只记现状"**，另有独立 `cs-brainstorm` 做模糊想法分诊(直接 design / 写 brainstorm.md / 移交 roadmap)。即它**显式分离"现状档案层"与"brainstorm 讨论层"**。 | CodeStable README | 印证"现状层"与"需求塑形层"应是**不同姿态**——支持把 brownfield current-state 做成 brainstorm 的条件 reference，而非混入主流程。但 CodeStable 把它们拆成不同 `cs-*` 命令,是候选 1 的间接支持论据,需在决策时权衡。 |
| **testany-agent-skills**（★73，TestAny-io，非"PRD Studio"） | ✅**业界最强对照**。`testany-eng` 是完整 BRD→UC→PRD→Prototype→API→Guardrails→HLD→Test→Runbook 流水线，**每个 writer 都配一个 reviewer 门禁**(prd-writer/prd-reviewer…)，且有 `TRACEABILITY-METADATA`(字段/枚举/稳定 ID 保持英文)。`prd-writer` 明确支持新功能/第三方集成/**重构/优化**(即 brownfield)。 | testany README | spec-first 的 readiness gate + R/A/F/AE traceability 方向与业界领先实践一致；但 testany 走"每阶段 writer+reviewer 双门禁"的重链路,spec-first 应守住 right-sized,不照搬其十余个 `*-writer/*-reviewer` 入口。 |
| **rapid `requirement-analysis`** | ❓**未能核验**。GitHub 搜索无明确匹配仓库,可能是私有/已改名/非公开。维持"无证据"。 | GitHub search 无命中 | 不作为论据,不在报告中声称其做法。 |
| **code graph 重建现状外部案例** | ✅**确有成熟外部案例**。Sourcegraph 主打 "Code Understanding, Oversight & Evolution",已出 **MCP server**("Code graph knowledge for agents")；CodeScene 出 **CodeHealth MCP Server** 让 AI 助手读其分析。 | sourcegraph.com / codescene.com 首页 | "用 code graph 给 agent 提供现状理解"是业界明确方向(均已做 MCP)。spec-first 的差异化不在"有没有 graph",而在 `graph-evidence-posture.md` 的四轴+非法组合矩阵+Scope Authority"现状不反向扩 scope"这套**证据治理**——这仍是外部案例未见明文化的点。 |

**额外修正**：Spec Kit README 现已有 **"Iterative Enhancement (Brownfield)" preset**(modernize legacy / adapt processes)。故旧报告"Spec Kit 无 current-state 层"应软化为"Spec Kit 已认 brownfield 场景,但未见显式的'现状快照 vs 增量需求'分离与'现状不反向驱动产品'护城规则"。

### 修正后的净判断

1. **brownfield 现状理解**业界已有实做(Sourcegraph/CodeScene 的 MCP、Spec Kit brownfield preset、CodeStable cs-req 的现状档案层)——**它不是无人区**,旧报告"业界普遍偏弱"过强。spec-first 的真实差异化收窄为:**把现状证据分级(四轴)+ 非法组合矩阵 + "现状只约束不反向扩 scope" 的 Scope Authority 明文化**,这一治理层外部案例尚未见等价物。
2. **现状层 vs 需求塑形层应分离**——CodeStable(cs-req vs cs-brainstorm)是有力佐证。这同时是候选 1(独立入口承载现状)的间接论据,decision 时应纳入权衡,不能只当作候选 2 的支持。
3. **PRD 质量门 + traceability**(testany 的 writer/reviewer 门禁 + TRACEABILITY-METADATA)是业界领先实践,spec-first 已有同向资产(Readiness Gate + R/A/F/AE),**应复用,不照搬重链路**。
4. **多端 lens** 本轮 curl 未找到成熟公开的 per-surface 需求 lens 实践,维持"业界弱、spec-first 有差异化空间"判断,但样本仍有限,标 advisory。

---

## Outstanding Questions

### Resolve Before Planning

- [Affects 全文][User decision] **承载形态：候选 1（新增 `spec-prd` skill）还是候选 2（增强 `spec-brainstorm` 的两个 reference，owner 倾向）？** 见「架构方向复核」。此决策改变 U1–U6 的存废与 R1/R18/R20 的措辞，必须先定。
- [Affects R18][Scope] 若选候选 2，本文 R18（内置 PRD Readiness Gate）应**降级为复用** 2026-05-29 已 completed 的 `Requirements Readiness Gate`，不再新建 gate。若选候选 1，需说明为何不复用。
- [Affects origin][Scope] 本需求的真实归属：spec-first 工程链路内（候选 1/2），还是独立通用 PRD 生成器仓库（第三条路）？见「一个仍悬而未决的前提」。
- [Affects R1][User decision] 若仍选候选 1，公开入口名称固定为 `spec-prd`，还是 `spec-requirements` / `spec-prd-refine` 之一？
- [Affects R9][User decision] 是否接受“PRD-grade requirements 仍写入 `docs/brainstorms/*-requirements.md`”作为首版 artifact 策略？

### Deferred to Planning

- [Affects R5][Technical] Current-state scan 首版是否完全由 LLM + GitNexus/source reads 执行，还是同时新增轻量 deterministic helper？
- [Affects R13][Technical] Domain lens references 是否按端类型一个文件，还是一个文件内分 section？
- [Affects R20][Technical] `spec-doc-review` 是否需要新增 PRD-specific reviewer lens，或首版复用 requirements document reviewer？
