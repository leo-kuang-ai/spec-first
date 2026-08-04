---
title: 超大需求垂直闭环拆分（spec-decompose）- Plan
type: feat
date: 2026-07-28
topic: spec-decompose-vertical-closed-loop
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: spec-brainstorm
execution: code
status: active
deepened: 2026-07-28
---

# 超大需求垂直闭环拆分（spec-decompose）- Plan

## Goal Capsule

- **Objective:** 为 spec-first 补上需求梯子**最上游缺失的一档**：当一个目标大到/模糊到连「需求边界都列不出」（fog）时，先经 `spec-decompose` 做**决策导航清雾**，产出多个各自功能闭环的 right-sized 需求种子，再让每个需求落入既有管线（`spec-brainstorm` 或 `spec-prd` → `spec-plan` → `spec-write-tasks` → `spec-work`）闭环交付。
- **Recommended approach:** `compose + extend`，且**重度复用现有 skill**。`spec-decompose` 本身用 `spec-write-skill` 造；HITL 澄清复用 `spec-prd` 的 owner-question 模型、HITL 评审复用 `spec-proof` hitl-review、AFK 研究复用 `spec-plan` research subagents；持久 tracker 复用 `tracker-defer` 探测、并发隔离复用 `spec-worktree`；分解出的每个需求用 `spec-lfg` 编排执行；路由进 `using-spec-first`。**不新造** HITL、tracker 探测、隔离原语、执行引擎，**不重复** `spec-prd` 已有的 brownfield 拆分。
- **Decision focus:** 决策地图 artifact 落**仓内持久 markdown**（`docs/decompose/`，契合物件优先哲学）+ 可选 issue tracker 投影；fog of war（`Not-yet-specified`/`Out-of-scope`）；每会话一票；与 `spec-prd` brownfield 拆分的边界（spec-decompose 管 fog/huge，spec-prd 管可枚举边界的 oversized PRD）。
- **Verification focus:** 一个 fog/huge 目标经 `spec-decompose` 清雾成 ≥2 个功能闭环需求种子，各自能被 `spec-brainstorm`/`spec-prd` 正常消费并走到 `spec-work` 入口；claim 跨会话无冲突；P0 收紧不破坏 `spec-first tasks validate` 确定性。
- **Largest risk / boundary:** 侵入或复制现有 skill 会破坏 spec-first 的资产——执行管线语义（`spec-plan`/`spec-write-tasks`/`spec-work` 的确定性校验、新鲜度锁、GATE）与 `spec-prd` 的 brownfield 拆分都不动；所有增强以 compose 增量落在**最上游**与**外围**。
- **Stop conditions:** `spec-decompose` 需要改 settled-plan 语义才能成立；或某能力发现已被现有 skill 覆盖（应改为 compose 而非 new）；或 P0 收紧破坏 validator 确定性 / 与「质量判定留 LLM」哲学冲突——停止相应 mutation 并回本 plan 重议。
- **Execution profile:** 分三阶段——P0（task-quality 指南收紧，refactor）→ P1（用 `spec-write-skill` 造 `spec-decompose` 骨架 + 决策地图 + 清雾，compose 现有 HITL/研究）→ P2（持久 tracker + claim + `spec-lfg` 端到端编排 + KAZ dogfood）。
- **Tail ownership:** `spec-write-skill` 负责造 skill、`spec-work` 负责实现、`spec-doc-review` 负责评审、`spec-compound` 负责沉淀；`spec-decompose` 是否晋升正式宿主扩展由维护者（Leo）评审决定。

---

## Product Contract

### Summary

让 spec-first 能处理「连需求边界都列不出」的 fog/huge 目标：先经 `spec-decompose` 清雾分解成多个功能闭环需求种子，再各自走既有管线闭环交付。方案**深度复用现有 skill 生态**——分解产物落 `spec-brainstorm`（greenfield）或 `spec-prd`（brownfield），HITL/研究/追踪/隔离/编排全部 compose 现有能力，执行管线一行不改。

### Problem Frame

spec-first 的需求梯子目前是：`spec-strategy`（STRATEGY.md 锚点）→ `spec-ideate`（创意）→ `spec-brainstorm`（greenfield requirements-only plan，目标是"right-sized"单一 plan）/ `spec-prd`（brownfield PRD）→ `spec-plan`（HOW）→ `spec-write-tasks` → `spec-work`。

**关键事实（深度源码核验后修正）**：spec-first **并非没有需求级拆分**——`spec-prd` 已支持「oversized 初始 PRD → owner 确认边界后拆成 child PRDs」（`spec-prd/SKILL.md` Phase 0 step4、Phase 3，及 `assets/templates/70-large-requirement-index.md` 模板，需 owner 确认拆分边界后才读取）。

**真正的缺口（比"缺拆分"更窄、更准）**：
1. **fog 导航缺失**：`spec-prd` 的拆分前提是"需求边界已可枚举"（能列出 oversized PRD 的模块）；但当目标模糊到**连边界都列不出**（"以 KAZ 为起点做跨市场 UI 组件化"这类），没有任何 skill 提供「决策地图 + fog of war + 逐票清雾」来先把雾拨开。全树 grep `fog of war / wayfinder / decision ticket` 零命中。
2. **跨会话持久认领缺失**：任务 tracker 是 run-local（`spec-work/SKILL.md:138`）；无 claim-by-assignment 让多会话跨时间认领 frontier。
3. **垂直切片是软建议**（`task-quality-guide.md:126` `Prefer`），且无通用 wide-refactor expand-contract（仅 `data-migration-reviewer.md` 的 DB 迁移场景有）。

本方案补这三层，**且能 compose 的绝不 new**。

### Key Decisions

- **KTD1｜`spec-decompose` 只补「fog/huge」这一档，与 `spec-prd` 分工不重叠。** `spec-prd` 管「边界可枚举的 oversized brownfield PRD」拆分；`spec-decompose` 管「边界列不出的 fog/huge 目标」导航。输入信号决定路由，不互相替代。
- **KTD2｜决策地图首选仓内持久 markdown（`docs/decompose/`），契合物件优先哲学**；issue tracker 仅作可选投影（compose `tracker-defer` 探测）。这与 mattpocock wayfinder 的"tracker-only"不同——更 spec-first-native，且无 tracker 环境可用。
- **KTD3｜HITL/AFK 全部 compose 现有交互模型**：HITL 澄清用 `spec-prd` 的 owner-question（一次一问、blocking 工具、Owner Decision Trace），HITL 评审用 `spec-proof` hitl-review，AFK 研究用 `spec-plan` research subagents。**不新造 HITL 概念**。
- **KTD4｜`spec-decompose` 用 `spec-write-skill` 造**（Full apply：authoring-method → authoring-workbench → behavior-contract-design → evaluation-design → delivery-gates），dogfood 自有 authoring 管线。
- **KTD5｜P0 收紧只做"指南级 + 高风险"，不加确定性 validator gate**——尊重 spec-first「质量判定留 LLM」哲学（`spec-write-tasks/SKILL.md:131`），不动 `task-pack-schema` 确定性字段集（避免 parity test 失败）。

### Actors

- **需求 Owner / 维护者（Leo）**：提出 fog/huge 目标，评审决策地图与分解结果，决定晋升。
- **Orchestrator agent（`spec-decompose` 会话）**：逐票清雾、维护决策地图、产出需求种子。
- **下游执行**：每个需求种子经 `spec-brainstorm`/`spec-prd` → `spec-plan` → `spec-write-tasks` → `spec-work`/`spec-lfg`。
- **HITL 决策者**：对 HITL 票（澄清/评审）提供人在环判断（复用 spec-prd/spec-proof 交互）。

### 现有 Skill 生态集成图谱（compose 一览）

| 现有 skill | 在本方案中的角色 | 集成方式 |
| --- | --- | --- |
| `spec-strategy` | 顶层方向锚（STRATEGY.md），spec-decompose 的 Destination 对齐它 | 读作 grounding |
| `spec-ideate` | 创意生成（分解前的发散），与分解（收敛）分工 | 上游可选 |
| **`spec-brainstorm`** | 分解出的 **greenfield** 需求种子的落点 | 下游消费（不改） |
| **`spec-prd`** | 分解出的 **brownfield** 需求种子的落点；**其已有 oversized 拆分与本方案分工**（见 KTD1）；其 owner-question 模型被 HITL 澄清复用 | 下游消费 + 交互模型 compose（不改） |
| `spec-plan` | 需求种子 → HOW plan；其 research subagents 被 AFK 票复用 | 下游 + subagent compose（不改） |
| `spec-proof`（hitl-review） | HITL 文档评审环，评审决策地图/需求种子 | compose（不改） |
| `spec-write-tasks` | 需求 plan → task pack | 下游（不改） |
| `spec-work` | 执行；其 `tracker-defer` 探测被持久 tracker 复用 | 下游 + 探测 compose（不改） |
| `spec-worktree` | 并发认领的 worktree 隔离原语 | **新 caller**：spec-decompose 执行侧需定义 forward invocation + intake contract |
| **`spec-lfg`** | 分解出的**每个垂直需求**的 hands-off 编排（plan→PR，带 STOP Gate） | 编排 compose（不改） |
| `tracker-defer`（spec-work ref） | tracker 探测元组复用（Linear/GitHub/Jira） | compose（不改其残留 file 职责） |
| `spec-sweep` | 佐证 issue tracker 读集成已存在 | 参考（不改） |
| **`spec-write-skill`** | **造 `spec-decompose`** 的 authoring 管线（dogfood） | 用来创建本 skill |
| `spec-doc-review` | 评审决策地图 / 需求种子 / 本 plan | 评审 compose |
| `spec-compound` / `-refresh` | 沉淀 decompose dogfood 学习到 `docs/solutions/` | 收尾 compose |
| `using-spec-first` | 入口路由：fog/huge 目标 → `spec-decompose` | 改 `references/public-route-map.md` 加一条路由 |
| `spec-pov` | （可选）对"是否采用 wayfinder 式分解"做采用门禁verdict | 门禁 compose |

### Requirements

**fog 导航与需求级分解（spec-decompose 核心）**

- R1. 提供决策地图 artifact（仓内持久 markdown），把 fog/huge 目标建模为 Destination + 决策票，显式区分 `Not-yet-specified`（fog of war）与 `Out-of-scope`；可选投影到 issue tracker。
- R2. 清雾工作流**每会话只解一张票**（research 票除外），随 frontier 推进把 fog graduate 成新票，直至通往 Destination 的路径清晰。
- R3. 清雾产出**多个 right-sized 需求种子**（各自功能闭环、可独立交付），每个标注去向（greenfield→`spec-brainstorm` / brownfield→`spec-prd`）并携带 `origin` 指回决策地图。
- R4. 决策票标注 **HITL / AFK** 票型；HITL 澄清复用 `spec-prd` owner-question 交互，HITL 评审复用 `spec-proof`，AFK 研究复用 `spec-plan` research subagents。

**跨会话持久认领（外围）**

- R5. 决策地图与其工单可发布到持久 tracker（compose `tracker-defer` 探测），多会话跨时间 **claim-by-assignment** 认领 frontier；并发执行用 `spec-worktree` 隔离；无 tracker 回退仓内 markdown tracker。

**质量收紧（P0，文档级）**

- R6. `spec-write-tasks/references/task-quality-guide.md` 对**高风险任务**把垂直切片从软 `Prefer`（:126）升为强制，补「demoable alone / cuts every layer」强表述；低风险豁免。
- R7. 把 expand-contract 从 `data-migration-reviewer.md` 的 DB 迁移场景**泛化为通用 wide-refactor 垂直切片例外**，写入同一指南。

**生态接入**

- R8. `using-spec-first/references/public-route-map.md` 增加一条路由：「fog/huge、边界列不出的目标」→ `spec-decompose`。

### Key Flows

1. **fog 清雾流**：fog/huge 目标 →（`using-spec-first` 路由）→ `spec-decompose` 建决策地图 → 逐票清雾（HITL 澄清/评审 + AFK 研究，全部 compose）→ 路径清晰 → 产出 N 个需求种子（各标 greenfield/brownfield 去向）。
2. **需求闭环流（复用既有管线，不改）**：每个需求种子 → `spec-brainstorm` 或 `spec-prd` → `spec-plan` → `spec-write-tasks` → `spec-work`；或整条交 `spec-lfg` hands-off 编排。
3. **并发认领流（P2）**：决策地图/工单发布到持久 tracker → 多会话 claim-by-assignment 认领 frontier → `spec-worktree` 隔离执行。
4. **质量收紧流（P0）**：高风险任务在 `spec-write-tasks` 编译时垂直切片升为契约；wide refactor 走 expand-contract 例外。

### Acceptance Examples

- **AE1（KAZ UI 组件化）**：老板提「以 KAZ 为起点做跨市场 UI 组件化」这一 fog/huge 目标（边界列不出）。`spec-decompose` 建决策地图（Destination=跨市场设计系统防重复建设），逐票清雾（哪些进共享层？哪些留市场定制？采纳治理怎么强制？），产出多个功能闭环需求种子——「共享基础组件层」「市场定制层（支付/合规/RTL）」「采纳治理（adoption gate）」——各标 greenfield/brownfield 去向，分别落入既有管线。
- **AE2（与 spec-prd 分工）**：一个边界已可枚举的 oversized brownfield PRD → 直接走 `spec-prd` 的现有拆分，**不**进 `spec-decompose`；一个边界列不出的 fog 目标 → 进 `spec-decompose`。
- **AE3（fog graduate / claim）**：一票答案使某 fog patch 可立票（从 `Not-yet-specified` 清除并生成新票）；两并发会话认领不同 frontier 票不冲突，各自 `spec-worktree` 隔离执行。

### Success Criteria

- 一个真实 fog/huge 目标经 `spec-decompose` 清雾成 ≥2 个功能闭环需求种子，各自能被 `spec-brainstorm`/`spec-prd` 消费并走到 `spec-work` 入口。
- 跨会话 claim-by-assignment 无重复认领、无丢失票；`spec-worktree` 隔离正确。
- P0 收紧后既有合规 task pack 仍 `validate` 通过；`spec-plan`/`spec-write-tasks`/`spec-work` 既有测试全绿。
- `spec-decompose` 由 `spec-write-skill` 造出并通过其 delivery-gates。

### Scope Boundaries

- **不改 settled-plan 语义**：`spec-plan`/`spec-write-tasks`/`spec-work` 的输入分类、Task Pack Contract、GATE、新鲜度锁一行不动。
- **不重复 `spec-prd` 的 brownfield 拆分**：spec-decompose 只接 fog/huge（边界列不出）的输入；可枚举边界的 oversized PRD 仍归 `spec-prd`。
- **不新造 HITL / tracker 探测 / 隔离原语 / 执行引擎**：全部 compose 现有（`spec-prd`/`spec-proof`/`spec-plan` research/`tracker-defer`/`spec-worktree`/`spec-lfg`）。
- **不把质量 analyzer 变确定性硬 gate**：仅高风险指南级收紧。
- **非目标**：不重写执行管线为图引擎；不做全自动端到端分解（保留 HITL 决策点）；不新造外部权限/凭证体系。

### Dependencies / Assumptions

- 既有管线与上述被 compose 的 skill 稳定可用。
- `tracker-defer` 探测、`spec-worktree` 隔离、`spec-write-skill` authoring 管线存在且可复用。
- mattpocock/skills 仅作外部参考（决策地图/fog/claim 概念来源），落地适配 spec-first 哲学（仓内 artifact + 确定性校验 + GATE）。

### Outstanding Questions

- **OQ1（blocking，P1 前需定）**：决策地图 canonical 落仓内 `docs/decompose/` markdown（推荐，契合物件优先）还是 tracker 为主、markdown 为投影？默认推荐前者。
- **OQ2（deferred）**：`spec-decompose` 是否注册进 `spec-first init` 正式清单？默认先 dogfood（经 `spec-write-skill` 造 + `spec-doc-review` 审 + `spec-compound` 沉淀）再晋升。
- **OQ3（deferred）**：`spec-worktree` 作为新 caller 的 forward invocation + intake contract 由谁定义（spec-decompose 执行侧 or spec-work）？

### Sources / Research

- **外部参考（mattpocock/skills，本地克隆 github.com/mattpocock/skills）**：`skills/engineering/wayfinder/SKILL.md`（决策地图/fog of war/HITL·AFK/claim-by-assignment/one-ticket-per-session）；`skills/engineering/to-tickets/SKILL.md`（tracer-bullet 垂直切片硬规则 + blocking edges + wide-refactor expand-contract）。
- **本仓现有 skill 证据（行级）**：
  - `spec-prd/SKILL.md` —— Phase 0 step4 + Phase 3「oversized PRD → owner 确认边界拆 child PRDs」；`assets/templates/70-large-requirement-index.md`；`references/grill-with-docs-integration.md`（与 mattpocock 同源）；owner-question 模型（Four Legal Stop Points / Owner Decision Trace / closure_disposition）。
  - `spec-proof/references/hitl-review.md` —— 文档 HITL 评审环（upload → annotate → ingest → sync），被 brainstorm/ideate/plan 调用。
  - `spec-plan/references/agents/` —— `web-researcher.md`、`repo-research-analyst.md` 等 research subagents（AFK 票复用）。
  - `spec-work/references/tracker-defer.md` —— tracker 探测元组 `{ tracker_name, confidence, named_sink_available, any_sink_available }`。
  - `spec-worktree/SKILL.md` —— worktree 隔离原语；「未来 caller 必须先定义 forward invocation 与 intake contract」。
  - `spec-write-skill/SKILL.md` —— skill authoring 管线（authoring-method/workbench/behavior-contract-design/evaluation-design/delivery-gates）。
  - `spec-write-tasks/references/task-quality-guide.md:126,132`；`spec-write-tasks/SKILL.md:131`；`spec-work/SKILL.md:138`；`spec-plan/references/agents/data-migration-reviewer.md:13,99`（DB expand-contract）。
- **知识库姊妹篇**：`02_知识主题/04_AI研发与VibOps/Spec-First调研学习/2026-07-28-spec-first-vs-mattpocock-source-deep-analysis.md`。

---

## Planning Contract

### Product Contract Preservation

本 plan 不修改任何现有 skill 的 Product Contract；R1–R8 以 compose 增量落地，被复用 skill 的语义与契约由各自 plan 治理。

### Architecture Posture

`compose + extend`，**compose 优先于 new**。唯一 new 的 source surface 是 `spec-decompose` skill 本身（经由 `spec-write-skill` 造）与 `docs/decompose/` artifact 目录；其余全部是 extend/compose 现有 skill 的交互模型、探测、隔离与编排。

### Key Technical Decisions

- **KTD1（生态位）**：`spec-decompose` 插在梯子最上游（`spec-ideate` 之后、`spec-brainstorm`/`spec-prd` 之前），只接「边界列不出的 fog/huge」；与 `spec-prd` 的 brownfield 拆分按输入信号分工，互不替代。
- **KTD2（artifact 哲学）**：决策地图 canonical 落仓内 `docs/decompose/YYYY-MM-DD-<slug>-map.md`（frontmatter + stable headings，可被 grep/anchor-scan，对齐 `plan-sections.md` wayfinding contract）；tracker 投影可选。区别于 wayfinder 的 tracker-only。
- **KTD3（交互 compose）**：HITL 澄清直接用 `spec-prd` 的 owner-question 交互契约（一次一问、blocking 工具、Owner Decision Trace 绑定）；HITL 评审直接 handoff `spec-proof` hitl-review；AFK 研究直接派 `spec-plan` research subagents。**零新交互概念**。
- **KTD4（自举）**：`spec-decompose` 由 `spec-write-skill` 造（dogfood authoring 管线），由 `spec-doc-review` 审，由 `spec-compound` 沉淀。
- **KTD5（编排 compose）**：分解出的每个垂直需求可整条交 `spec-lfg`（带 STOP Gate 的 hands-off 编排）执行，复用其 return-to-caller 与 gates，不重造编排。
- **KTD6（P0 边界）**：垂直切片强制只加在 task-quality 指南的高风险分支；不动 `task-pack-schema.md` 确定性字段集与 `src/cli/task-pack.js` 白名单。

### High-Level Technical Design

```
                      STRATEGY.md（spec-strategy 锚点）
                            │
                     spec-ideate（创意·发散）
                            │
        ┌───────────────────┴───────────────────┐
        │ 边界可枚举的 oversized 需求              │ 边界列不出的 fog/huge 目标
        ▼                                        ▼
   spec-prd（现有拆分）                    ┌──────────────────────────┐
   （owner 确认边界拆 child PRD）           │  spec-decompose（新增·上游） │
        │                                │  · 决策地图 docs/decompose/ │
        │                                │  · fog of war·每会话一票    │
        │                                │  · HITL 澄清→spec-prd 交互  │
        │                                │  · HITL 评审→spec-proof     │
        │                                │  · AFK 研究→spec-plan subagent│
        │                                └─────────────┬────────────┘
        │                                              │ N 个需求种子（标 greenfield/brownfield）
        └──────────────────────┬───────────────────────┘
                               ▼
              spec-brainstorm（greenfield）/ spec-prd（brownfield）
                               ▼
              spec-plan → spec-write-tasks → spec-work   （执行管线·不改）
                               ▲
              或整条交 spec-lfg（hands-off 编排·STOP Gate·不改）

外围（P2）：决策地图/工单 ──投影──▶ 持久 tracker（compose tracker-defer 探测）
           多会话 claim-by-assignment 认领 frontier ──隔离──▶ spec-worktree（新 caller）
```

### Interface Contracts

- **`spec-decompose` 输出契约**：一组需求种子（requirements-only markdown，或 tracker issue 引用），每个 frontmatter 携带 `artifact_readiness: requirements-only`、`origin: <决策地图 artifact 路径>`、`target_route: brainstorm|prd`。下游 `spec-brainstorm`/`spec-prd` 按既有 requirements-only 契约消费，**不新增 readiness 值**。
- **决策地图 artifact 契约**：`docs/decompose/YYYY-MM-DD-<slug>-map.md`，含 Destination / Notes / Decisions-so-far / Not-yet-specified / Out-of-scope 五个 stable headings + frontmatter（`type: decompose-map`、`status: active|cleared`）。
- **tracker 操作契约（可选投影）**：`map_create / ticket_create / claim(assign) / frontier_query / resolve_close / out_of_scope_close`，底层委派 `tracker-defer` 探测；缺失回退仓内 markdown。
- **P0 指南契约**：`task-quality-guide.md` 新增「高风险任务垂直切片强制 + wide-refactor expand-contract 例外」两节；确定性字段集不动。

### Evidence & Limitations

- wayfinder/to-tickets 是外部参考（verified 源码），其「tracker-only + claim」假设可达 tracker；spec-first 落地以仓内 markdown 为 canonical、tracker 为投影，避免无 tracker 环境退化。
- `spec-prd` 的拆分是**同步、单 PRD 工作流内**的拆分；spec-decompose 的 fog 导航是**跨会话、决策导向**的——两者互补，但 fog graduate 规则与票型划分需 dogfood 校准。
- `spec-worktree` 目前仅 `spec-dogfood` 一个受治理 caller；spec-decompose 执行侧作为新 caller 需先定义 forward invocation + intake contract（OQ3）。
- 本 plan 未经实跑；P0 收紧需保留低风险豁免通道避免误伤合法横向任务。

### Sequencing

- **P0（refactor，先行）**：U1 task-quality 指南收紧（文档级，低风险，先见效）。
- **P1（feat，核心）**：U2 用 `spec-write-skill` 造 `spec-decompose` 骨架 + 决策地图 artifact；U3 清雾工作流（compose HITL/研究）+ 需求种子产出（标 greenfield/brownfield 去向）。
- **P2（feat，连续性）**：U4 持久 tracker 投影 + claim-by-assignment（compose tracker-defer + spec-worktree）；U5 `using-spec-first` 路由接入 + `spec-lfg` 编排 + KAZ 端到端 dogfood。

---

## Implementation Units

### U1. task-quality 垂直切片硬契约 + expand-contract 泛化（P0）

- **Goal:** 高风险任务垂直切片从软 `Prefer` 升为契约，补通用 wide-refactor expand-contract 例外。
- **Requirements:** R6, R7
- **Files:** `.cursor/skills/spec-write-tasks/references/task-quality-guide.md`
- **Approach:** 在 `:126` 段落新增「高风险任务（review_gate: required）必须 vertical slice + demoable alone + cuts every layer」强制表述与低风险豁免；新增一节泛化 expand-contract（引用 `data-migration-reviewer.md` 场景，定义为通用 wide-refactor 例外）。**不改** `task-pack-schema.md` 确定性字段集与 `src/cli/task-pack.js` 白名单。
- **Test Scenarios:** 高风险非垂直切片任务被标记；wide refactor 被引导走 expand-contract；既有合规 pack 仍 `validate` 通过。
- **Verification:** `spec-first tasks validate <既有合规 pack> --json` 仍 `valid`；parity test 绿；强制表述仅作用高风险分支。

### U2. 用 spec-write-skill 造 spec-decompose 骨架 + 决策地图 artifact（P1）

- **Goal:** 经 `spec-write-skill` 创建 `spec-decompose` skill，定义决策地图 artifact 结构。
- **Requirements:** R1, R8（部分）
- **Files:** `.cursor/skills/spec-decompose/SKILL.md`、`.cursor/skills/spec-decompose/references/decision-map-schema.md`、`.cursor/skills/spec-decompose/references/tracker-map.md`、`docs/decompose/`（artifact 目录）
- **Approach:** 走 `spec-write-skill` Full apply（authoring-method → authoring-workbench → behavior-contract-design → evaluation-design → delivery-gates）。SKILL.md 定义触发（边界列不出的 fog/huge）、`Plan, don't do`、五段式 map body、与 `spec-prd` 分工路由；`decision-map-schema.md` 用 stable headings + frontmatter 表达。
- **Test Scenarios:** 对一个 fog/huge 目标产出合法决策地图；map 结构可被 grep 到 stable headings；artifact 落 `docs/decompose/`。
- **Verification:** `spec-write-skill` delivery-gates 通过；决策地图 schema 经 `spec-doc-review` 评审；本地 markdown tracker 回退可用。

### U3. 清雾工作流（compose HITL/研究）+ 需求种子产出（P1）

- **Goal:** 逐票清雾（每会话一票），HITL/AFK 全 compose，产出多个标好去向的需求种子。
- **Requirements:** R2, R3, R4
- **Files:** `.cursor/skills/spec-decompose/SKILL.md`、`.cursor/skills/spec-decompose/references/clearing-workflow.md`
- **Approach:** frontier 计算（无 blocker 未认领票）、每会话一票；HITL 澄清票 handoff `spec-prd` owner-question 交互、HITL 评审票 handoff `spec-proof` hitl-review、AFK 研究票派 `spec-plan` research subagents；收敛后把 Destination 切成多个功能闭环需求种子，各写 requirements-only markdown（`origin` + `target_route: brainstorm|prd`）。
- **Test Scenarios:** 一次会话只解一票；fog 正确 graduate；产出 ≥2 个需求种子且 `target_route` 标注正确、`origin` 可追溯。
- **Verification:** 需求种子能被 `spec-brainstorm`（greenfield）/`spec-prd`（brownfield）按 requirements-only 契约正常消费（dry-run）。

### U4. 持久 tracker 投影 + claim-by-assignment + worktree 隔离（P2）

- **Goal:** 决策地图/工单投影到持久 tracker，多会话 claim-by-assignment 认领，`spec-worktree` 隔离执行。
- **Requirements:** R5
- **Files:** `.cursor/skills/spec-decompose/references/tracker-map.md`、（compose）`.cursor/skills/spec-work/references/tracker-defer.md`、（新 caller intake）`.cursor/skills/spec-worktree/SKILL.md`
- **Approach:** tracker-map 复用 `tracker-defer` 探测元组；claim 通过 assign 实现；为 `spec-decompose` 执行侧在 `spec-worktree` 定义 forward invocation + intake contract（新 caller）；无 tracker 回退仓内 markdown tracker。**不新增**外部权限/凭证。
- **Test Scenarios:** 两会话并发认领不冲突（AE3）；tracker 不可达回退本地；`spec-worktree` 隔离正确。
- **Verification:** GitHub Issues（`gh`）或本地 tracker 上验证 claim/frontier/回退/隔离。

### U5. 入口路由 + spec-lfg 编排 + KAZ 端到端 dogfood（P2）

- **Goal:** `using-spec-first` 接入路由，分解需求交 `spec-lfg` 编排，用 KAZ 用例端到端验证。
- **Requirements:** R8, R3
- **Files:** `.cursor/skills/using-spec-first/references/public-route-map.md`（加一条 fog/huge→spec-decompose 路由）、`docs/solutions/`（dogfood 记录，经 `spec-compound`）
- **Approach:** public-route-map 加一条路由（不改 governor 核心）；用 AE1 的 KAZ 用例跑通「建图→清雾→多需求种子→各进管线 / spec-lfg」。
- **Test Scenarios:** fog/huge 目标被 `using-spec-first` 正确路由到 `spec-decompose`；KAZ 目标拆成共享层/市场定制层/采纳治理等垂直闭环需求，各自独立进管线。
- **Verification:** 端到端 dogfood 记录（`spec-compound` 沉淀）；每个分解需求能独立走到 `spec-work`/`spec-lfg` 入口。

---

## Verification Contract

### Deterministic Gates

- `spec-first tasks validate <既有合规 task pack> --repo <artifact-root> --json` 在 U1 后仍 `task_pack_validity: valid`。
- `task-pack-schema` parity test 通过（确认 U1 未动确定性字段集）。
- `spec-write-skill` delivery-gates 通过（U2 造 skill 合规）；决策地图 frontmatter + stable headings 可 grep。

### Behavioral / Fresh-Source Gates

- `spec-decompose` 对真实 fog/huge 目标产出合法决策地图（U2）。
- 一次清雾会话只解一票、fog 正确 graduate、产出多个标好去向的功能闭环需求种子（U3）。
- 两会话 claim-by-assignment 无冲突 + `spec-worktree` 隔离正确（U4，AE3）。
- `using-spec-first` 正确路由 fog/huge → `spec-decompose`；KAZ 端到端 dogfood 各需求独立进管线（U5）。

### 既有强项回归 Gate

- `spec-plan`/`spec-write-tasks`/`spec-work`/`spec-prd`/`spec-proof`/`spec-worktree` 既有测试套件全绿——证明本方案未改任何被 compose skill 的语义。

---

## System-Wide Impact

| 面 | 状态 |
| --- | --- |
| 新增 skill `spec-decompose`（经 spec-write-skill 造） | in-scope（U2/U3） |
| `docs/decompose/` artifact 目录 | in-scope（U2，新增） |
| `spec-write-tasks/references/task-quality-guide.md` | in-scope（U1，文档级） |
| `using-spec-first/references/public-route-map.md` | in-scope（U5，加一条路由） |
| `spec-worktree`（新 caller intake contract） | in-scope（U4，加 forward invocation） |
| `tracker-defer` 探测 | in-scope：compose 复用（U4），不改其残留 file 职责 |
| `spec-prd` / `spec-proof` / `spec-plan` research / `spec-lfg` | in-scope：compose 交互/编排，**不改其源码语义** |
| `spec-plan`/`spec-write-tasks`/`spec-work` 执行语义 | out-of-scope：一行不改 |
| `task-pack-schema` 确定性字段集 | out-of-scope：不动（避免 parity test 失败） |
| 宿主扩展注册（`spec-first init` 清单） | deferred：OQ2，先 dogfood 再晋升 |

## Risks & Dependencies

- **风险：复制现有 skill 能力**（重复造 HITL/tracker/隔离/编排）→ 以「compose 优先」为硬约束，KTD3/KTD5 明确复用点，Verification 含既有强项回归 Gate。
- **风险：与 spec-prd 拆分职责混淆** → KTD1 明确按输入信号分工（边界可枚举→spec-prd；列不出→spec-decompose）。
- **风险：无 tracker 环境退化** → 仓内 markdown 为 canonical、tracker 为投影。
- **风险：spec-worktree 新 caller 集成未定义** → OQ3，先定义 intake contract 再用。
- **依赖**：被 compose 的各 skill 稳定；`tracker-defer`/`spec-worktree`/`spec-write-skill` 可用。

## Alternative Approaches Considered

- **扩展 `spec-prd` 而不是新建 `spec-decompose`**：否决——`spec-prd` 是 brownfield、同步、单 PRD 工作流，其拆分前提是"边界可枚举"；fog/huge（边界列不出）是不同 altitude、不同交互（决策导航 vs 需求澄清），塞进 spec-prd 会污染其 brownfield 语义与 readiness 契约。分工优于合并。
- **决策地图 tracker-only（照搬 wayfinder）**：否决——无 tracker 环境退化，且不契合物件优先哲学；改仓内 markdown canonical + tracker 投影。
- **塞进 `spec-brainstorm` 作 mode**：否决——brainstorm 目标是"right-sized 单一 plan"，fog 导航是上游不同工作。
- **P0 改 validator 加确定性垂直切片硬 gate**：否决——违背「质量判定留 LLM」哲学，只做指南级高风险收紧。

## Documentation / Operational Notes

- `spec-decompose` 使用文档纳入其 SKILL.md；dogfood 记录经 `spec-compound` 落 `docs/solutions/`。
- 晋升正式宿主扩展前，在知识库同步姊妹篇分析的落地状态。

## Definition of Done

### Global

- 一个真实 fog/huge 目标经 `spec-decompose` 清雾成 ≥2 个功能闭环需求种子，各自被 `spec-brainstorm`/`spec-prd` 消费并走到 `spec-work`/`spec-lfg` 入口。
- 跨会话 claim-by-assignment 无重复认领、无丢失票；`spec-worktree` 隔离正确。
- P0 后既有合规 task pack 仍 `validate` 通过；被 compose 的各 skill 既有测试全绿。
- `spec-decompose` 由 `spec-write-skill` 造出并通过 delivery-gates；无废弃/实验代码残留。

### Per-Unit Done Signals

- **U1:** 高风险垂直切片强制表述入库，既有合规 pack 仍 valid，parity test 绿。
- **U2:** `spec-decompose` 经 `spec-write-skill` 造出，决策地图 artifact 合法、可 grep、本地回退可用。
- **U3:** 每会话一票 + fog graduate + 多需求种子（`target_route`/`origin` 正确）验证通过，可被 brainstorm/prd 消费。
- **U4:** 双会话 claim 无冲突 + tracker 回退正确 + `spec-worktree` 新 caller intake 定义并验证。
- **U5:** `using-spec-first` 路由生效 + KAZ 端到端 dogfood 记录完成（`spec-compound` 沉淀）。
