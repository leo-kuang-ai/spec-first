---
date: 2026-05-30
author: leokuang
topic: spec-prd-owner-final
spec_id: 2026-05-30-003-spec-prd-owner-final
artifact_kind: prd-requirements
status: ready-for-planning
supersedes_analysis_inputs:
  - docs/brainstorms/2026-05-30-001-prd-skill-requirements.md
  - docs/brainstorms/2026-05-30-002-prd-iteration-skill-requirements.md
  - docs/业界分析/14.prd-skill-竞品分析-2026-05-30.md
source_basis:
  - external-local: claude-skills/prd-generator/SKILL.md
  - external-local: claude-skills/competitive-analysis/SKILL.md
  - external-local: skills/engineering/grill-with-docs/SKILL.md
  - external-local: code_flow/.claude/commands/cf-task/prd.md
  - external-local: code_flow/.claude/commands/cf-task/align.md
  - external-local: code_flow/.claude/commands/cf-task/plan.md
  - external-local: code_flow/.code-flow/specs/shared/prd-template.md
  - external-local: code_flow/.code-flow/specs/shared/_map.md
  - docs/10-prompt/结构化项目角色契约.md
  - skills/spec-brainstorm/SKILL.md
  - skills/spec-brainstorm/references/requirements-capture.md
  - skills/spec-app-consistency-audit/SKILL.md
  - skills/spec-plan/references/graph-evidence-posture.md
  - docs/contracts/graph-evidence-policy.md
  - docs/02-架构设计/需求拆分/大需求拆分.md
  - docs/需求文档模版/原始模版/
  - docs/需求文档模版/标准模版/
relationship_to_vision_roadmap:
  vision_doc: docs/02-架构设计/需求拆分/大需求拆分.md
  diagnosis: docs/brainstorms/2026-05-30-003-spec-prd-关系诊断-vs-大需求拆分.md
  stance: 本文是终态愿景的第一阶段落地真相源(关系 C)。spec-prd v1 = 增量 PRD(默认单文件;超大 PRD 经 owner 确认走轻量多文档拓扑,见 R6d) + 复杂度识别闸;完整 packet/multi-surface/manifest/trace-ledger 为 v2+ 演化,复用愿景文档结构设计,最终载体 v2 再定。
graph_evidence_note: "GitNexus 可用于 query/context orientation；其 evidence 强度按 docs/contracts/graph-evidence-policy.md 分级,stale/dirty-advisory/impact-unavailable 时不得当 fresh impact evidence。(本文撰写时 graph-facts 实测为 dirty-advisory + impact_context=false,但该状态会随 graph 刷新变化,需求约束以 policy 为准,不钉死此快照值。)"
---

# `spec-prd` 增量需求迭代 PRD Skill Owner 最终需求文档

## Summary

最终决策：新增 1 个公开 workflow skill：`spec-prd`。

`spec-brainstorm` 保持 0-1 想法探索、问题定义和 WHAT shaping；`spec-prd` 聚焦已有系统上的增量需求迭代 PRD 输出。它的核心体验是：产品 owner 说出想法后，skill 先结合现有代码和 GitNexus orientation 分析涉及的流程与系统现状，再帮助产品确认增量，最后输出高质量 Markdown PRD。

首版不拆多个 PRD skill。`create`、`refine`、`validate` 是 `spec-prd` 内部 intent；`code-align` 不是平行 intent，而是贯穿全部 intent 的 evidence posture，只有在用户明确要求“先对齐代码现状、暂不输出完整 PRD”时作为子模式运行。首版用 references + fresh-source eval + focused contract tests 控制质量。v1 规划纳入 1 个 eval-gated 内部 readiness reviewer（`spec-requirements-readiness-reviewer`，命名待定），它 own PRD-grade readiness 判断、主要服务 `spec-prd` 自检、不作为用户公开入口；被 `spec-doc-review` 复用是条件能力（须 reviewer 实体化且同步更新 doc-review persona 契约）。其实体化受 eval 校准——先由 orchestrator 执行 readiness lens，只有 fresh-source eval 证明单 orchestrator 自审不稳时才落地为独立 agent。

本次结合 `docs/需求文档模版/标准模版/` 反向校准：`spec-prd` v1 不只是内置通用 App/Admin/Backend surface lens，还必须支持**项目模板库与行业 overlay lens**。在证券行业项目中，surface lens 之上要叠加证券行业检查（监管辖区、客户/账户/产品范围、适当性、AML/KYC、行情、交易、资金清结算、风控、审计留痕、精度与时区）。这些检查是 PRD 作者期的 WHAT 约束，不是技术实现或法务意见替代品。

进一步吸收 `grill-with-docs` 的有效模式，但只吸收其**bounded domain-language grill**：能由代码或既有文档回答的问题先查证再问用户；发现术语冲突、领域边界模糊、用户说法与源码不一致时直接指出；用少量具体场景逼出行为边界。v1 不照搬其 `CONTEXT.md` / ADR 持久化架构，不要求固定 glossary/ADR 目录，也不在 PRD workflow 中即时写长期知识文档；确认后的术语、事实矛盾、硬决策只进入本次 PRD 的 `Glossary`、`Evidence And Assumptions`、`Decision Notes` 或 `Outstanding Questions`。

进一步对比 `code_flow` 的 `cf-task:prd -> align -> plan` 链路后，`spec-prd` v1 吸收其**输入模式判定、轻量绕行、草稿恢复、跳过已知信息、稳定追溯 ID 与摘要自检**。但不照搬 `.code-flow/tasks/<date>/` 任务目录、`.prd.md/.design.md` 后缀契约、PRD 先派生 design 再派生 plan 的中间文档链；在 spec-first 中，PRD 仍是 `docs/brainstorms/*-requirements.md` 的 requirements artifact，HOW 继续归 `spec-plan`。

---

## Owner Decision

| Question | Decision |
| --- | --- |
| 扩展 `spec-brainstorm` 还是新增 skill | 新增 `spec-prd`；`spec-brainstorm` 保持 0-1 边界 |
| 新增几个公开 skill | 1 个：`spec-prd` |
| 是否拆 create/refine/validate/code-align | 不拆；create/refine/validate 为内部 intent，code-align 为 evidence posture / 子模式 |
| 是否新增 agent | v1 新增 1 个 eval-gated 内部 readiness reviewer（非公开入口），实体化受 eval 校准 |
| PRD artifact 放哪里 | 继续放 `docs/brainstorms/*-requirements.md` |
| 是否新增 `docs/prds/` | 不新增 |
| 是否新建 evidence 词表 | 不新建；映射到既有 graph evidence policy |
| 是否默认联网做竞品 | 不默认；仅用户显式要求时启用 |

### Why This Decision

`001/002` 的 Claude 分析指出了真实风险：新增 `spec-prd` 可能带来入口增殖、多真相源、重复 gate、证据词表分叉。最终仍选择新增 `spec-prd`，原因是用户目标已经不是“把 brainstorm 做得更强”，而是“让产品在已有系统上更低成本地产出高质量增量 PRD”。

这是不同产品心智：

- `spec-brainstorm`: 我还不知道要做什么，帮我一起想清楚。
- `spec-prd`: 我已经有增量方向或已有 PRD，帮我结合系统现状写成研发可用 PRD。

风险不通过取消 `spec-prd` 解决，而通过严格边界解决：单入口、共享 artifact、复用 gate、复用 evidence policy、v1 不新增公开 agent 入口（仅允许 1 个 eval-gated 内部 readiness reviewer）。

**外部一手证据(来自 `001` 的 curl 核验,支撑本决策)**：CodeStable `cs-req`(★868)把"现状档案层"与"模糊想法讨论层 `cs-brainstorm`"显式拆成不同入口——这是 `spec-prd`(增量/现状)与 `spec-brainstorm`(0-1)分入口的真实业界先例；Sourcegraph / CodeScene 已出 MCP code-graph server，印证 code-grounding 是业界方向，但均未明文化"现状证据分级 + 现状不反向扩 scope"治理(R11-R13/R40 的差异化点);testany-agent-skills 的 writer+reviewer 门禁印证 readiness lens 方向，但其十余个公开入口是反例，佐证 D1 单入口。Tessl 经核验为 Agent Enablement Platform(skill 治理)，与本需求无直接竞争，不引为论据。

---

## Decision Closure From `002`

`002` 提出的 7 个硬问题是有效的，本稿不把它们留给 planning 猜，而在 owner 需求阶段直接裁决。

| Issue | Final decision | Consequence |
| --- | --- | --- |
| H1. 与 `spec-app-consistency-audit` 重叠 | `spec-prd` 负责 App PRD 作者期的 current-state、Change Delta、异常/交互/验收补齐；`spec-app-consistency-audit` 负责 PRD/Figma/source/route/analytics/i18n 的静态一致性审计 | App lens 不复用 app-audit artifact spine，不自动触发 app-audit；用户显式要求 App 一致性审计时 handoff |
| H2. Requirements Readiness Gate 如何复用 | **v1 by-reference**：`spec-prd` 在自己的 `prd-readiness-lens.md` 内引用既有 Requirements Readiness Gate 的维度清单（不复制全文、不跨读 brainstorm 私有 reference），物理抽取到 `docs/contracts/workflows/requirements-readiness-gate.md` 推迟到 v2 重构 | v1 不动 `spec-brainstorm` source 与双宿主 runtime；contract test 必须断言两处 gate 维度不 drift |
| H3. 与 `spec-brainstorm` 路由冲突 | 同时像 feature idea 和 brownfield PRD 时，若用户给出现有系统锚点且目标是 PRD/需求文档，优先 `spec-prd`；若产品形态、actor、核心 outcome 未定，优先 `spec-brainstorm` | `using-spec-first` 和 skill description 必须加 tie-break fixture |
| H4. `code-align` 分类错误 | `code-align` 降级为 evidence posture / report-only 子模式，不作为第四个平行 intent | intent model 只保留 create/refine/validate |
| H5. Requirement 过多 | PRD 产品需求保留用户可见行为、artifact、quality/handoff；实现纪律下沉 Implementation Direction / Architecture Guardrails | Planning 要瘦身 R 列表，不把 source 注册点当产品需求 |
| H6. 外部一手证据未吸收 | 采用 `001` / 竞品分析结论：业界有 PRD writer、spec workflow、code graph trend，但缺 spec-first 的证据治理和 current-state 不反向扩 scope | 竞品只作为 advisory product-shape evidence，不默认进入每次 PRD run |
| H7. 成功标准不可度量 | 用 handoff quality、doc-review gap、fresh-source eval 和 routing fixture 衡量 `spec-prd` 是否比 brainstorm 更适合增量 PRD | 不编造业务增长指标，度量 workflow 质量 |

---

## 20-Round Analysis Summary

| Round | Question | Decision impact |
| --- | --- | --- |
| 01 | 差异化来自模板还是代码现状？ | 选择 current-state analysis，而不是更长 PRD 模板 |
| 02 | 是否继续扩 `spec-brainstorm`？ | 新增 `spec-prd`，避免 brainstorm 职责膨胀 |
| 03 | 与 App 一致性审计如何分工？ | PRD authoring vs consistency audit 分层 |
| 04 | Readiness Gate 是否复制？ | 抽共享 gate contract，避免 drift |
| 05 | 路由冲突如何判定？ | brownfield PRD tie-break 写入路由 |
| 06 | `code-align` 是否是 intent？ | 改为 posture / 子模式 |
| 07 | 40+ R 是否过度？ | 规划时瘦身，把实现纪律移出产品 R |
| 08 | 竞品研究是否默认联网？ | opt-in，默认只用用户材料和本地证据 |
| 09 | GitNexus 能否当事实？ | dirty-advisory 只作 pointer，关键 claim 要 source confirmation |
| 10 | Artifact 是否新建 `docs/prds/`？ | 不新增，沿用 `docs/brainstorms/*-requirements.md` |
| 11 | 多端是否拆 skill？ | 不拆，使用 domain lens references |
| 12 | 是否新增 agent？ | v1 纳入 1 个 eval-gated 内部 readiness reviewer，实体化受 eval 校准（见 D5/R38）|
| 13 | PRD 是否写 HOW？ | 禁止 implementation units / schema / file plan |
| 14 | 首屏交互怎样最小？ | 现状对齐 + 一个关键 scope 问题 |
| 15 | 已有 PRD refine 如何避免重写目标？ | 保留原意，输出 mismatch/gap 与 addendum |
| 16 | Readiness fail 怎么收尾？ | 最小补齐问题或带 assumptions 风险，不进 `spec-work` |
| 17 | 成功指标怎么设？ | 衡量 handoff quality，不编造业务指标 |
| 18 | 新 workflow 落地成本包括什么？ | 双宿主治理、注册、README、tests、eval、runtime init |
| 19 | `003` 能否 ready for planning？ | 能，但必须吸收 H1-H3 作为显式决策 |
| 20 | 最终 owner 决策是什么？ | 1 个 `spec-prd`，1 个 eval-gated 内部 readiness reviewer（非公开入口），3 intent + code posture，by-reference 复用 gate |

---

## Problem Frame

真实研发中的增量需求通常不是从零开始。产品 owner 说“一句话需求”或给一份已有 PRD 时，最难的不是把文档写长，而是准确理解现有系统：

- 当前有哪些流程、页面、API、权限、状态和异常路径？
- 这次需求是新增、扩展、替换、删除，还是只是补充交互/异常？
- 哪些现状是 confirmed source，哪些只是 GitNexus pointer 或 agent assumption？
- App、H5、Admin、Backend/Java、CLI 等不同端分别容易漏掉什么？

当前 `spec-brainstorm` 的轻量 repo scan 能帮助需求成型，但没有正式产出 current-state snapshot、change delta、code alignment、PRD gap report 和多端 lens。没有历史需求知识库时，代码和图谱就是最可靠的 current-state 输入。`spec-prd` 要补的就是这个 PRD-grade current-state layer。

---

## Goals

- G1. 帮产品 owner 从想法、短需求或已有 PRD 出发，输出 Markdown PRD-grade requirements。
- G2. 在写 PRD 前，结合代码、文档、测试和 GitNexus orientation 分析当前系统现状。
- G3. 让产品先看懂现状，再确认增量，最后拿到 PRD。
- G4. 自动补齐名词解释、产品用例、异常处理、交互设计约束、验收样例、风险、依赖和开放问题。
- G5. 按不同 surface 加载差异化需求关注点：App、H5/PC、Admin、Backend/Java、CLI/DevTool、Mixed。
- G6. 保持 PRD artifact 与 `spec-plan`、`spec-doc-review`、`spec-write-tasks`、`spec-work` 的现有链路兼容。
- G7. 用 source confirmation 和 evidence tags 防止把猜测、过期图谱或行业常识写成系统事实。
- G8. 支持项目内 PRD 模板库作为 human-facing authoring reference，并在 skill references 中沉淀可执行的 template contract；两者不得形成冲突真相源。

## Non-Goals

- NG1. 不替代 `spec-brainstorm` 的 0-1 探索。
- NG2. 不替代 `spec-plan` 做技术设计、文件改动计划、schema、接口字段或任务拆解。
- NG3. 不新增多个公开 PRD skill。
- NG4. v1 不新增长期需求数据库、复杂状态机或中心化 PRD 知识库;不新增用户公开 agent 入口。（v1 允许 1 个 eval-gated 内部 readiness reviewer，见 R38/R39。）
- NG5. 不默认联网做市场/竞品/客户研究。
- NG6. 不新增 `docs/prds/` 作为第二需求真相源。
- NG7. 不手改 `.claude/`、`.codex/`、`.agents/skills/` generated runtime。
- NG8. **v1 不做完整 Requirements Packet / 跨端 Multi-Surface Packet / Parent-Child packet 机制**（packet 目录 / `manifest.json` / `trace-ledger.json` / `25-surfaces` / `35-integration-contracts` 等结构）。v1 产物形态分三档:**普通小/中增量默认单文件 PRD**；**owner 确认的超大初版 PRD 支持轻量多文档拓扑**（原始 PRD by-reference + split summary + child PRD,共享 base `spec_id`,见 R6d,**不含 manifest/trace-ledger 重机制**）；跨端/大需求信号由复杂度识别闸输出 split-decision 建议并 handoff（见 Scope: v1 vs v2）。完整 packet/manifest/trace-ledger 为 v2+ 演化，复用《大需求拆分.md》愿景蓝图。
- NG9. 不把 `grill-with-docs` 的 `CONTEXT.md` / ADR 写入机制做成 `spec-prd` 默认依赖；v1 只读取已有项目语言/决策材料作为 advisory context，不创建长期知识库、不把 PRD workflow 变成 ADR 管理器。

---

## Scope: v1 vs v2（与终态愿景的关系）

本文是《大需求拆分.md》终态愿景的**第一阶段落地真相源**（关系 C，诊断见 `docs/brainstorms/2026-05-30-003-spec-prd-关系诊断-vs-大需求拆分.md`）。范围边界：

| 能力 | v1（本文落地） | v2+（愿景演化，复用《大需求拆分.md》设计） |
| --- | --- | --- |
| 单文件增量 PRD（小/中需求） | ✅ 完整实现 | 保持 |
| Current-State + Change Delta | ✅ 单文档段落 | 升级为 `06-prd/code-alignment.md` 等 packet 内结构 |
| 复杂度识别闸 | ✅ 识别 + split-decision 建议 + handoff | 升级为完整复杂度决策树 + 自动 packet 化 |
| 大需求 Requirements Packet | ❌ 不做（识别后 handoff） | ✅ thin entry + packet 目录 |
| 跨端 Multi-Surface Packet | ❌ 不做（识别后 handoff） | ✅ surfaces + integration-contracts + lane |
| Parent/Child 拆分 | ❌ 不做（识别后 handoff） | ✅ split-decision + child packets |
| packet 最终载体 | 不决定 | v2 再定（spec-prd 长出 vs 回流 brainstorm/spec-requirements）|

**复杂度识别闸（v1 低成本提前埋点）**：`spec-prd` 在 Scope confirmation 阶段检测复杂度信号——
- 大需求信号：requirements 预计 >15-20 条、多 capability、需 roadmap/MVP/phase、后续 plan 会膨胀。
- 跨端信号：涉及多个 surface/team/system、存在共享接口/字段/权限/配置/埋点、需端到端验收才算完成。

命中时**不硬塞单文件**，而是由 LLM 输出 split-decision 建议（说明这是大需求/跨端闭环、建议如何拆）并 handoff，由产品 owner/PM 确认拆分边界、优先级和发布节奏后再落盘子 PRD；不命中则正常单文件 PRD。识别闸只做"识别 + LLM 语义拆分建议 + owner 确认 handoff"，不引入 packet 目录/trace-ledger/集成契约等重机制——那是 v2。脚本、GitNexus 和代码分析只提供页面/接口/流程/权限/状态等事实输入，不负责业务拆分裁决。

**超大 PRD 的 v1 文档拓扑（轻量多文档，不是 packet）**：

同一个大需求共享同一个 base `spec_id` / slug，文件名后缀和 frontmatter `document_role` 区分角色：

```text
docs/brainstorms/
  YYYY-MM-DD-NNN-<slug>-original-prd.md
  YYYY-MM-DD-NNN-<slug>-split-summary-requirements.md
  YYYY-MM-DD-NNN-<slug>-<child-id>-requirements.md
```

1. **原始需求文档 / source input**：PM 提供的原始 PRD 保持 by-reference，优先不改写；若需要归档，使用同一个 base `spec_id`，`artifact_kind: source-input`，`document_role: original-prd`。若只有粘贴内容，`spec-prd` 应在 split summary 中保留原始输入摘要、来源和未确认主张，不把 LLM 重写稿伪装成原文。
2. **拆分汇总需求文档 / split summary**：默认仍写在 `docs/brainstorms/*-requirements.md`，`artifact_kind: prd-requirements`，`document_role: split-summary`，使用同一个 base `spec_id`。它记录拆分依据、子 PRD 列表、每个子 PRD 的范围/依赖/优先级/是否可独立进入 `spec-plan`、owner 确认状态和未决问题。
3. **拆分后的模块需求文档 / child PRD**：每个可独立规划的模块生成自己的 `docs/brainstorms/*-requirements.md`，`artifact_kind: prd-requirements`，`document_role: child-prd`，共享同一个 base `spec_id`，用唯一 `child_id` 区分模块，并用 `parent_spec_id`、`source_prd`、`split_summary` 回链。下游 `spec-plan` 默认消费 child PRD，而不是拿原始超大 PRD 或 split summary 直接规划。

该拓扑只靠 Markdown frontmatter + 文档互链，不新增 `docs/prds/`、不新增 manifest/trace-ledger，也不自动创建完整 Requirements Packet。

---

## Product Shape

`spec-prd` 是一个 PRD-grade requirements workflow，不是普通 PRD 模板生成器。

| Scenario | Input | `spec-prd` behavior | Output |
| --- | --- | --- | --- |
| 已有 PRD 完善 | PRD/requirements path 或粘贴内容 | 保留原意，做 current-state scan，输出 gap report 和修订稿 | PRD addendum 或修订版 requirements |
| 一句话增量需求 | “后台增加批量导入” | 判断 surface 和现有流程，问最少阻塞问题，补齐 PRD | Markdown PRD |
| 想法但依附现有系统 | “让订单异常更清楚” | 先对齐现有流程和异常路径，再确认增量 | Current-state + Change Delta + PRD |
| 初版超大 PRD | PM 给出多模块/多端/多系统 PRD | 先 validate/refine 原文与 current-state，再由 LLM 输出 split-decision 建议，等待 owner 确认后再拆子 PRD | Split-decision report + 子 PRD 草案/待确认清单 |
| 0-1 模糊想法 | “想做一个社区产品” | 转 `spec-brainstorm`，不生成伪完整 PRD | Brainstorm handoff |
| PRD 可规划性检查 | 已有 PRD | 执行 readiness lens 和 codebase fit 检查 | Gap report / 修订建议 |

### Interaction Model

首屏不做长问卷。推荐 opening move：

```text
我会先把这个想法和当前代码里的相关流程对齐，再输出可交给 plan 的 PRD。
先确认一个点：这是要改现有流程，还是新增一条独立流程？
```

体验闭环：

1. **Scope confirmation:** 确认 surface、目标流程、是否改现有能力。
2. **Complexity gate:** 检测大需求/跨端/多 capability 信号；命中时先输出 split-decision 建议，不直接写巨型 PRD。
3. **Current-state reveal:** 展示现状摘要、证据来源、不确定点。
4. **Delta confirmation:** 确认 keep / extend / replace / remove / unknown。
5. **Focused gap questions:** 只问会改变产品行为、范围或验收的问题。
6. **Draft PRD:** 输出 Markdown PRD、patch-style addendum，或在 owner 确认拆分后输出子 PRD 草案。
7. **Readiness and handoff:** 标风险，推荐 `spec-doc-review` 或 `spec-plan`。

---

## Actors

- A1. 产品/业务 owner：提供需求意图、业务目标、优先级、已有 PRD 和决策口径。
- A2. `spec-prd` orchestrator：判断 intent、组织现状扫描、写 PRD、执行 readiness lens、完成 handoff。
- A3. Evidence provider：GitNexus、源码、测试、文档、contracts、README、历史 requirements/plans/solutions。
- A4. Downstream planner：消费 PRD artifact，输出 implementation plan。
- A5. Reviewer：通过 `spec-doc-review` 检查 PRD 完整性、一致性和可规划性。
- A6. Readiness reviewer（内部 helper，eval-gated）：判断 PRD 是否 code-grounded 且 planning-ready（current-state accuracy、change delta clarity、exception/interaction 覆盖、evidence provenance、planning invention risk），主要服务 `spec-prd` 自检；被 `spec-doc-review` 复用是条件能力（须实体化 + 更新 doc-review persona 契约）。非用户公开入口，实体化受 eval 校准。

---

## Key Flows

- F1. Create PRD from increment（intent: `create`）
  - **Trigger:** 用户有明确增量方向、依附现有系统，但还没有 PRD，要求从零写一份。
  - **Steps:** 确认 surface 与目标流程 -> current-state scan -> 确认 Change Delta -> focused gap questions -> 按 core/conditional 模板 synthesize PRD -> readiness lens。
  - **Outcome:** 增量想法变成证据明确、可规划的新 PRD。
  - **Covered by:** R3, R7, R8, R9, R10, R16, R18, R21

- F1b. Existing PRD refinement（intent: `refine`）
  - **Trigger:** 用户提供已有 PRD/requirements，要求细化、完善、优化或补充。
  - **Steps:** 读取原文 -> 抽取已有主张 -> 做 current-state scan -> 输出 mismatch/gap -> 补齐名词、用例、异常、交互、验收 -> 保存 PRD。
  - **Outcome:** 已有 PRD 升级为证据明确、可规划、可验收的 PRD-grade requirements。
  - **Covered by:** R3, R7, R8, R9, R10, R16, R17, R18, R19, R20

- F1c. Oversized initial PRD split-decision（intent: `validate` -> `refine`）
  - **Trigger:** PM 提供初版超大 PRD，涉及多模块、多端、多系统、多个角色或后续 plan 明显会膨胀。
  - **Steps:** 读取原文 -> 抽取模块/角色/流程/规则/验收主张 -> 做 current-state scan -> 运行复杂度识别闸 -> LLM 输出 split-decision 建议（子 PRD 范围、依赖、优先级、是否可独立 plan）-> owner 确认/调整 -> 按确认结果逐个生成或修订子 PRD。
  - **Outcome:** 超大 PRD 先变成可审查的拆分决策，而不是被硬塞成巨型单文件；正式子 PRD 只在 owner 确认边界后落盘。
  - **Covered by:** R6b, R6d, R7, R8, R9, R10, R13, R16, R23

- F2. One-line increment to PRD（intent: `create`，轻量入口）
  - **Trigger:** 用户给一句话增量需求。
  - **Steps:** 判断 surface 和流程 -> 问一个最关键问题 -> current-state scan -> Change Delta -> PRD synthesis -> readiness lens。
  - **Outcome:** 短需求变成可交给 `spec-plan` 的 Markdown PRD。
  - **Covered by:** R3, R7, R9, R10, R16, R18, R21

- F3. Idea routing
  - **Trigger:** 用户只有想法，未说明是 0-1 还是现有系统迭代。
  - **Steps:** 判断是否依附现有系统和目标流程 -> 0-1 转 `spec-brainstorm` -> 增量进入 `spec-prd`。
  - **Outcome:** 不把 0-1 想法伪装成 PRD，也不把增量需求拉回过度 brainstorm。
  - **Covered by:** R5, R6

- F4. Code-aware validation（intent: `validate`）
  - **Trigger:** 用户已有 PRD，但不确定是否能进入研发规划。
  - **Steps:** 检查 current-state accuracy、change delta、异常、交互、验收、scope、evidence provenance -> 输出 gap report。
  - **Outcome:** 产品 owner 知道 PRD 是否 ready，以及最小补齐项。
  - **Covered by:** R7-R13, R31-R33

- F5. Plan handoff
  - **Trigger:** PRD ready 或用户确认带 assumptions 继续。
  - **Steps:** 保存 `docs/brainstorms/*-requirements.md` -> 保留 `spec_id` / R/A/F/AE IDs / evidence section -> 推荐下一步。
  - **Outcome:** PRD 成为 Spec 节点 artifact。
  - **Covered by:** R14, R15, R34, R35

---

## Requirements

**Workflow Entry**

- R1. 必须新增 1 个公开 workflow skill：`spec-prd`。
- R2. `spec-prd` 必须定位为已有系统上的增量需求迭代 PRD 输出，不得成为 `spec-brainstorm` 的换名版。
- R3. `spec-prd` 必须支持三个内部 intent：`create`、`refine`、`validate`。
- R4. `code-align` 必须作为 evidence posture / 子模式处理，不得作为第四个平行 intent；create/refine/validate/code-align 均不得拆成多个公开 skill。
- R5. 0-1 产品探索、目标用户/核心流程未定、产品形态未定时，必须推荐 `spec-brainstorm`。
- R6. `using-spec-first` 后续路由必须区分：0-1 探索走 `spec-brainstorm`；已有系统增量 PRD、已有 PRD 完善、code-aware PRD 检查走 `spec-prd`。当输入同时像 feature idea 和 brownfield PRD 时，若用户给出现有系统锚点且目标是 PRD/需求文档，优先 `spec-prd`；若产品形态、actor、核心 outcome 未定，优先 `spec-brainstorm`。
- R6b. `spec-prd` v1 必须在 Scope confirmation 阶段运行复杂度识别闸：检测到大需求信号（requirements 预计 >15-20 条、多 capability、需 roadmap/MVP/phase）或跨端信号（多 surface/team/system、共享接口/字段/权限/配置/埋点、需端到端验收）时，不得硬塞单文件 PRD，必须输出 split-decision 建议（说明大需求/跨端闭环 + 建议拆法）并 handoff；不命中则走单文件 PRD。识别闸不实现 packet 目录 / trace-ledger / 集成契约（那是 v2，见 Scope: v1 vs v2 与 NG8）。
- R6c. 当 refine 输入低质量（残缺、自相矛盾、或并非 PRD 而是聊天记录/需求邮件/碎片笔记）时，`spec-prd` 不得假装它是完整 PRD 直接 refine：必须先把输入结构化为可识别的主张与缺口，按 `create` 路径补齐，并在文档标注哪些是原始输入、哪些是补全；输入完全无法支撑增量判断时，回到 Scope confirmation 向用户取最小必要信息，不得编造产品意图。
- R6d. 当超大初版 PRD 命中复杂度识别闸并经 owner 确认需要拆分时，`spec-prd` v1 必须采用轻量多文档拓扑：原始 PRD/source input by-reference 保留；新增或更新一个 split summary requirements 文档记录拆分依据与子 PRD 索引；同一大需求共享同一个 base `spec_id` / slug，每个 child PRD 使用 `document_role: child-prd` 与唯一 `child_id` 区分模块，并回链 `parent_spec_id` / `source_prd` / `split_summary`。不得把 split summary 当作完整 Requirements Packet manifest，也不得跳过 owner 确认直接批量落盘 child PRD。
- R6e. `spec-prd` 必须显式处理输入模式：已有 `artifact_kind: prd-requirements` 草稿走恢复/继续 refine，保留既有 `spec_id` 与已分配 trace ID；已有其他 Markdown 可作为参考材料但不得伪装成 PRD；已有 plan/design/task/implementation 文档应提示当前阶段不匹配并建议转 `spec-plan` / `spec-work` / `spec-doc-review`；纯文本走 create；无输入走交互式 scope confirmation。若需求已是清晰技术方案、小脚本或 bugfix，workflow 应提示完整 PRD 可能过重，推荐 compact core PRD、直接 `spec-plan` 或 `spec-work`（视 WHAT/HOW 是否已定），而不是强制跑完整 PRD。

**Current-State Analysis**

- R7. 生成或完善 PRD 前，必须执行 scope-appropriate current-state analysis。
- R8. Current-state analysis 必须覆盖相关现有能力、业务流程、页面/路由/API、权限/角色、状态/异常、配置/后台任务、测试和现有文档。
- R9. Current-state analysis 必须输出 `Current System Snapshot` 和 `Change Delta`。
- R10. Change Delta 必须区分 keep、extend、replace、remove、unknown。
- R11. GitNexus 只能作为 orientation、candidate pointer 或 session-local evidence；关键结论必须由源码、测试、文档、contracts 或用户确认支撑。
- R12. 当 graph facts 为 stale / dirty-advisory，或 impact context 不可用时，不得声称 fresh graph impact evidence；evidence 强度一律按 `docs/contracts/graph-evidence-policy.md` 分级判定，不依赖任何写死的快照值。
- R13. Current-state facts 只能约束需求、提示复用机会和暴露风险，不得自动扩大产品范围。
- R13b. `spec-prd` 必须采用 bounded source-first questioning：用户关于现状、术语或行为的说法若能由代码、测试、文档、contract 或已有项目术语/ADR-like 材料回答，workflow 应先查证再提问；若用户说法与 source-confirmed current state 冲突，必须在 PRD 中显式标注 contradiction / mismatch、source tag 和待 owner 确认的问题，不得静默圆过去。

**PRD Authoring**

- R14. PRD 输出必须是 Markdown 文档，默认路径为 `docs/brainstorms/YYYY-MM-DD-NNN-<slug>-requirements.md`。
- R15. PRD frontmatter 必须包含 `spec_id`，并可包含 `artifact_kind: prd-requirements`、`target_surface`、`evidence_grade`。
- R16. PRD 模板采用 core + conditional 两层，不是统一硬性全填。**Core sections（始终必填）**：Summary、Change Delta、Requirements、Acceptance Examples、Scope Boundaries（含 Non-Goals，小需求可为 compact 单列表）、Evidence And Assumptions——这是下游 `spec-plan` 消费的最小骨架，缺任一项 plan 就得发明 WHAT 或 scope。
- R16b. **Conditional sections（按 target surface 与需求规模决定是否展开）**：Problem Frame、Current System Snapshot、Goals / Success Metrics / Non-Goals 详述、Glossary、Decision Notes、Actors、Use Cases、Interaction Requirements、Exception Handling、Outstanding Questions。小增量可折叠或省略；大需求或对应 surface 命中时必须展开（如 App surface 命中必须含 Interaction Requirements；Backend/Java 命中必须含 Exception Handling 与状态机）。conditional section 一旦展开，其内容仍须满足 R17-R21 的对应要求；被省略项若存在未决点，必须落入 Outstanding Questions，不得静默丢弃。Scope Boundaries 始终在 core（R16），conditional 仅控制其是否拆分 Deferred / Outside-identity 的展开粒度。
- R16c. 每份产出 PRD 应支持 `Success Metrics` / 衡量口径作为 conditional section：用户或证据给出可信业务指标时必须纳入；没有可信指标时不得编造目标值，应写成可观察口径或进入 Assumptions / Outstanding Questions。该要求用于补齐 PRD 文档内容，不替代本文 S1-S5 这些 workflow 质量信号。
- R16d. **模板库与 runtime reference 的分层引用**：区分两类内容,分发边界不同。**(a) 通用骨架**(core+conditional section 清单、6 个 surface lens 机制)由 `spec-prd` 的 `prd-output-template.md` / `domain-lenses.md` **derive 内置并随 skill 分发**——它是模板库通用部分的可分发副本(单向派生、非第二真相源;下游项目装了 `spec-prd` 但没有 `docs/需求文档模版/`,故必须自带骨架),drift test 锁定 runtime reference 与模板库通用骨架语义一致。**(b) 行业/团队 overlay**(如证券 C1-C12、适当性/行情/清结算)**不内置进通用 skill**,而是作为**项目本地模板库**被 by-reference 叠加(见 R30c);`spec-prd` 只内置"如何检测并叠加行业 overlay"的机制,不内置具体行业内容,drift test **不锁**行业 overlay(项目本地,本就允许各异)。`docs/需求文档模版/标准模版/` 在 spec-first 本仓库因此是双重角色:通用骨架的设计种子 + 证券项目本地 overlay 的范例实现。冲突时以当前实现 source 明确声明的 source-of-truth 为准。
- R17. Glossary 展开时必须补齐名词解释，并标明术语来源；术语缺解释而被省略时，须在 Outstanding Questions 标注。
- R17b. 术语处理必须借鉴 bounded domain-language grill：当用户使用模糊或重载词（如账户/客户/用户/订单/交易/申请单）时，workflow 应先检索项目已有 docs/glossary/ADR-like 材料和源码命名；若发现冲突，必须提出推荐 canonical term 与 `_Avoid_` 等价词，等待 owner 确认或写入 Outstanding Questions。不得要求项目必须存在固定 `CONTEXT.md` / `docs/adr/`，也不得为了解决单次 PRD 自动创建这些长期文档。
- R18. 核心产品用例必须包含 actor、trigger、precondition、main path、alternative/error path、outcome、covered requirements。
- R19. 当需求触及异常路径（或 surface 为 Backend/Java、Admin 等异常敏感端）时，Exception Handling 必须展开并覆盖：权限异常、输入异常、状态冲突、弱网/超时、重复提交、部分成功、撤销/回滚、兼容/降级。
- R20. 当需求含用户交互（或 surface 为 App、H5/PC、Admin）时，Interaction Requirements 必须展开并覆盖：入口、状态、反馈文案、确认/取消、空态、加载态、错误态、可访问性或国际化需求。
- R21. 条件型行为必须有 Given/When/Then 或 EARS 等价验收样例。
- R21b. 对领域边界、状态流转、权限/资金/数据/审计影响不清的需求，workflow 必须生成少量具体 scenario grill（通常 1-3 个阻塞问题或边界样例）来迫使范围、actor、状态、异常和验收口径明确；不阻塞实施但仍不确定的问题进入 Outstanding Questions，不把长问卷作为默认体验。
- R21c. 交互式细化必须 right-sized：采用最小阻塞、聚焦提问；一次只问当前最影响范围、行为或验收的关键问题，必要时可合并少量强相关问题，避免滑向长问卷或 coaching。初始输入、参考材料、源码或现有 PRD 已明确的维度不得重复提问；用户回答“你定/随意”时，workflow 应基于 evidence 给出推荐默认值、标注 source tag 或 assumption，并继续推进。每轮对话应更新当前理解，避免把整份 PRD 问卷一次性抛给用户。
- R22. 无证据的 metrics、客户反馈、业务规则、交互文案必须进入 Assumptions 或 Outstanding Questions，不得编造。
- R22b. 当需求触及权限、用户数据、资金/交易、审计或合规时，PRD 必须显式标注涉及的权限边界、数据敏感性与合规点（作为产品约束，不是技术实现）；无法确认时进入 Outstanding Questions，不得默认放行。
- R22c. 当项目或用户明确处于强监管行业（首个落地行业：证券/券商）时，PRD 必须叠加行业 overlay lens：监管辖区/展业地、客户分类、账户类型、产品/市场范围、投资者适当性、AML/KYC、风控、行情权限、交易/订单、资金清结算、审计留痕、数据精度与时区。行业规则只能作为产品约束和待确认项写入 PRD；不得把行业常识、历史经验或外部资料直接写成合规事实。
- R23. PRD 不得包含 implementation units、文件改动计划、数据库 schema、接口字段设计或任务拆解。
- R23b. PRD 必须保留稳定内部 traceability：每条核心产品需求至少被一个 acceptance example 覆盖，反之每个 acceptance 标注其覆盖的 requirement，便于下游 `spec-plan` 直接消费而无需重建 trace。恢复/继续 refine 时既有 `R` / `AE` / `BR` / `NFR` 等 ID 不得复用或跳号；新增项续接当前最大编号。涉及用户故事、功能清单或非功能约束时，PRD 可使用 project-local ID（如 `US-*` / `FEAT-*` / `NFR-*`）作为辅助 trace，但必须映射回 spec-first 的 requirement / acceptance / scope 边界，不新增第二需求真相源。
- R23c. PRD 中每条 current-state claim 必须带 Evidence Contract 定义的 evidence tag（`confirmed-source` / `user-stated` / `gitnexus-pointer` / `external-research` / `assumption`）；未标 tag 的现状描述不得作为 confirmed fact 进入 PRD 主体。
- R23d. PRD 生成语言遵循当前 host 的 language setting（本仓库默认中文）；引用的源码标识符、路径、配置键、协议名保持原文，新生成的说明与结论按 language setting 输出。
- R23e. 只有同时满足 hard-to-reverse、surprising-without-context、real-trade-off 的产品/领域决策，才建议后续 ADR-like 知识沉淀；`spec-prd` v1 默认只在 PRD `Decision Notes` 中记录 `question`、`recommended_answer`、`source_tag`、`chosen_answer`、`consequence`、`deferred_reason`，不得在没有用户明确要求时创建 ADR 或长期 context 文件。
- R23f. PRD 收尾必须包含 trace/readiness 摘要：实际包含的 section、核心需求数、验收样例数、P0/P1/P2 或等价优先级分布、未覆盖 requirement、无来源/无验收的功能项、未确认 NFR/assumption/outstanding question。发现 trace 缺口时必须显式列出并建议补齐或降级，不得静默推荐进入 `spec-plan`。

**Domain Lenses**

- R24. `spec-prd` 必须按 target surface 加载差异化 lens，而不是用单一模板覆盖所有系统；这些 lens 是 PRD 作者期 lens，不替代 `spec-app-consistency-audit` 的 App PRD/Figma/source 一致性审计。
- R25. App lens 必须关注页面栈、导航、权限弹窗、弱网/离线、前后台切换、状态恢复、埋点、i18n/accessibility。
- R26. H5/PC lens 必须关注路由、表单、响应式、浏览器返回、登录态、刷新、SEO/分享、多视口行为。
- R27. Admin lens 必须关注 RBAC、列表筛选、批量操作、导入导出、审核/回滚、审计日志、危险操作确认。
- R28. Backend/Java lens 必须关注 API contract、状态机、幂等、事务、错误码、安全、性能、迁移、观测性、向后兼容。
- R29. CLI/DevTool lens 必须关注命令入口、参数、配置、dry-run/preview-first、日志、跨平台、失败恢复、升级路径。
- R30. Mixed lens 必须关注 source-of-truth、跨端一致性、接口契约、异步同步、降级策略和集成验收。
- R30b. Domain lens 必须支持「surface lens + industry overlay」组合，而不是互斥选择。例如证券 App 下单需求同时命中 App lens（页面栈/交互/弱网）与证券 overlay（适当性/交易时段/行情权限/订单/资金/审计）。
- R30c. `spec-prd` 必须允许项目模板库提供行业/团队特有 lens 作为 authoring reference；这些 reference 是 PRD 作者期输入，不替代 `spec-plan` 的 HOW，也不替代合规/法务最终确认。**分发边界(对应 R16d 分层)**：通用 surface lens 由 skill derive 内置、随 skill 分发；行业/团队 overlay 不内置进通用 skill，而是作为**项目本地模板库**被 by-reference 检测并叠加。下游项目缺该本地模板库时，行业 overlay 优雅缺省（不报错、不臆造行业规则），通用骨架仍可用。`spec-prd` 内置的只是"如何叠加行业 overlay"的机制，不是具体行业内容。

**Quality And Handoff**

- R31. `spec-prd` 必须复用既有 Requirements Readiness Gate。**v1 复用方式为 by-reference**：`spec-prd` 在 `prd-readiness-lens.md` 内引用 gate 的维度清单（不复制全文、不跨读 `spec-brainstorm` 的私有 reference），并追加 PRD-specific lens；把 gate 物理抽取到 `docs/contracts/workflows/requirements-readiness-gate.md` 由 `spec-brainstorm` 与 `spec-prd` 共享，推迟到 v2 重构。无论 v1/v2，contract test 必须断言两处 gate 维度不 drift。
- R32. PRD-specific lens 必须检查 current-state accuracy、change delta clarity、exception coverage、interaction readiness、evidence provenance、planning invention risk、terminology ambiguity、code-claim contradiction、hard-decision unresolved；当行业 overlay 适用时，还必须检查监管/资金/交易/数据/审计边界是否显式标注。
- R33. Readiness 失败时，必须输出最小补齐问题或修订建议；用户选择带 assumptions 继续时，文档必须记录风险。
- R34. 完成后必须推荐下一步：继续 refine、`spec-doc-review`、`spec-plan` 或 done for now；不得直接进入 `spec-work`。
- R35. `spec-plan` 必须能把 `artifact_kind: prd-requirements` 的 `docs/brainstorms/*-requirements.md` 当普通 requirements artifact 消费。

**Skill And Agent Architecture**

- R36. `skills/spec-prd/SKILL.md` 必须保持精简，只保留触发、边界、核心 workflow、reference load 条件和 handoff。
- R37. 详细 current-state contract、PRD template、domain lenses、readiness lens 必须放入 references。
- R38. v1 规划纳入 1 个内部 readiness reviewer agent（暂名 `spec-requirements-readiness-reviewer`）：它 own PRD-grade readiness 判断，主要服务 `spec-prd` 自检，不得作为用户公开入口。其**实体化受 eval 校准**——v1 先由 `spec-prd` orchestrator 依 `prd-readiness-lens.md` 执行 readiness lens；只有 fresh-source eval 证明单 orchestrator 自审稳定失效（漏判、自审盲区）时，才把该 reviewer 落地为独立 agent 文件。**被 `spec-doc-review` 复用是条件能力**：仅当 reviewer 已实体化且按 U6c 同步更新 `spec-doc-review` 的 conditional persona/dispatch 契约后才成立；否则复用范围降级为 `spec-prd` 内部自检。
- R39. 该 reviewer 必须是内部 reviewer/helper，不得作为用户公开入口；其 own 的独有切片是 current-state accuracy、change delta clarity、exception/interaction 覆盖、evidence provenance、planning invention risk，且不得与 `spec-repo-research-analyst`（现状采集）、`spec-spec-flow-analyzer`（flow gap）、`spec-product-lens-reviewer`（产品 premise）重复职责。v1 不为现状采集新增 researcher agent，现状证据采集复用 `spec-repo-research-analyst`。
- R40. 不得新增第二套 evidence enum；PRD evidence tags 必须映射到 `docs/contracts/graph-evidence-policy.md`。
- R41. 不得新增 `docs/prds/` 作为默认真相源。

> **R 分层落地（H5 收口）**：上组 **Skill And Agent Architecture（R36-R41）是架构约束/实现纪律，不是用户可见的产品需求**。Decision Closure H5 裁决"实现纪律下沉"——本文不重排 R 编号以保持 AE/flow 引用稳定，但 planning 应把 R36-R41（及 R4 的"不拆公开 skill"、R23 的 HOW 禁令）当作 **Architecture Guardrails** 对待，不作为对等产品行为去逐条设计验收。真·产品行为需求集中在 R5-R22、R24-R35 及其 b/c/d 扩展项；新增模板库和行业 overlay 要求只补强 PRD 作者期 lens，不改变单入口与 light-contract 边界。

---

## PRD Quality Bar

高质量 PRD 不是章节填满，而是下游不需要发明 WHAT。

| Dimension | Pass signal | Fail signal |
| --- | --- | --- |
| 产品意图 | 用户目标、业务目标、target surface、增量范围明确 | 只有“优化/完善/支持” |
| 现状证据 | 关键 current-state claim 有 confirmed source、user-stated 或明确 assumption | GitNexus pointer 或猜测写成事实 |
| 增量边界 | Change Delta 区分 keep/extend/replace/remove/unknown | 新需求和现有能力混在一起 |
| 用例完整 | 核心 actor、trigger、precondition、main path、exception path、outcome 完整 | 只有功能列表 |
| 异常处理 | 关键异常有 expected behavior 和反馈 | 只写“提示错误” |
| 交互约束 | 入口、状态、反馈、确认/取消、空态/加载/错误态明确 | UI/交互靠实现者猜 |
| 验收样例 | 条件行为有 Given/When/Then 或 EARS 等价样例 | 无法判断实现是否满足 |
| 权限/数据 | 触及权限/数据/资金/审计/合规时显式标注边界与敏感性 | 权限和数据影响隐含、留给实现者猜 |
| Trace | 每条核心需求↔acceptance 互相标注，current-state claim 带 evidence tag | 需求与验收脱节、现状无证据来源 |
| 追溯自检 | 收尾摘要列出需求/验收/优先级/缺口，恢复草稿时 ID 续接不复用 | 新增需求跳号、复用旧 ID、缺口被静默放过 |
| Success Metrics | 有可信证据时给出可观察/可衡量口径；无证据时显式进入 assumptions | 编造增长率、转化率或效率目标 |
| 行业 overlay | 强监管行业命中时显式写辖区、客户/账户/产品范围、资金交易、审计与合规待确认点 | 把行业常识当事实，或把合规/资金交易影响留给 plan 猜 |
| 模板一致性 | skill references 与项目模板库的 core/lens 语义一致 | 人用模板与 skill 输出模板互相漂移 |
| Handoff | `spec-plan` 只需决定 HOW | 产品行为仍留给 planning 发明 |

---

## Evidence Contract

PRD evidence tags 是文档层便捷标签，不是新的 graph evidence contract。

| PRD tag | Meaning | Existing policy mapping |
| --- | --- | --- |
| `confirmed-source` | 已直接读源码、测试、文档或合同 | `confirmed` / plan `evidence_grade=primary` when source confirmed |
| `user-stated` | 用户明确表达的产品意图或业务规则 | confirmed for intent; not graph evidence |
| `gitnexus-pointer` | GitNexus query/context 等 session-local 或 advisory 线索 | `session-local` / `advisory` / `stale`; never primary without source confirmation |
| `external-research` | 用户显式要求的外部资料 | advisory unless directly sourced and dated |
| `assumption` | 未确认推断 | must stay in Assumptions or Outstanding Questions |

---

## Success Signals

这些是首版质量评估信号，不是业务增长指标，也不要求脚本在 v1 自动统计。

- S1. `spec-prd` fresh-source eval 中，brownfield PRD fixtures 不需要 `spec-plan` 发明新的产品行为、scope boundary 或 acceptance example。
- S2. `spec-doc-review` 对 `spec-prd` 产物的 P1/P2 product-gap finding 明显低于同输入直接走普通 `spec-brainstorm` 的对照产物。
- S3. routing fixtures 能稳定区分 0-1 idea、brownfield increment、existing PRD refine、App consistency audit request。
- S4. stale / dirty-advisory GitNexus pointer fixtures 中，PRD 把 provider claim 降级为 pointer 或 assumption，并要求 source confirmation。
- S5. 首版实现不新增 `docs/prds/`、不新增独立 evidence enum、不新增 public PRD 子 skill、不手改 generated runtime mirrors。
- S6. bounded domain-language grill fixtures 中，`spec-prd` 能用源码/文档先回答可查事实，发现术语冲突或代码事实矛盾时输出推荐 canonical term、contradiction 和最小 owner 问题，而不是把用户说法直接写成 confirmed PRD。
- S7. 输入模式与 trace fixtures 中，`spec-prd` 能恢复既有 PRD 草稿、拒绝把 plan/design/task 当 PRD、对小 bugfix 给出轻量绕行建议，并在收尾摘要中暴露 requirement / acceptance / NFR trace 缺口。

---

## Acceptance Examples

- AE1. **Covers R3, R7, R16.** Given 用户要求完善已有 PRD，when `spec-prd` 运行，then workflow 以原 PRD 为 primary input，保留核心意图，做 current-state scan，并按 core/conditional 模板输出补强后的 PRD 或 addendum。
- AE2. **Covers R5-R6.** Given 用户提出 0-1 新产品想法，when 产品形态和核心流程未定，then workflow 推荐 `spec-brainstorm`，不得生成伪完整 PRD。
- AE2b. **Covers R6b.** Given 用户说“给 App+H5+后台做一套带灰度的新业务，帮我写 PRD”，when 复杂度识别闸检测到跨端 + 多 capability 信号，then `spec-prd` v1 不硬塞单文件，而是输出 split-decision 建议（标明这是跨端闭环、建议拆分方式）并 handoff，不在 v1 生成 packet 目录或集成契约。
- AE2c. **Covers R6d.** Given PM 提供一份超大初版 PRD 且 owner 确认需要拆分，when `spec-prd` 继续 refine，then workflow 保留原始 PRD/source input 引用，生成 split summary requirements 文档作为拆分索引，并为每个可独立规划模块生成 child PRD；同组文档共享同一个 base `spec_id`，每个 child PRD 通过唯一 `child_id` 区分并回链 parent/source/summary，不得把 split summary 写成 packet manifest。
- AE3. **Covers R7-R13.** Given 用户只说“后台用户列表增加批量导入”，when 当前系统已有 Admin 列表与权限模式，then PRD 必须输出 Current System Snapshot、Change Delta、权限、导入校验、失败行反馈、审计日志和回滚问题。
- AE4. **Covers R11-R12, R40.** Given GitNexus 指向某 route 但源码读取发现 route 已重命名，when 写现状分析，then GitNexus claim 必须降级为 stale/advisory pointer，不得写成 confirmed fact。
- AE5. **Covers R17, R18, R19, R20, R21.** Given PRD 草稿缺少术语、用例、异常和交互，when refine 完成，then PRD 必须包含 Glossary、Use Cases、Exception Handling、Interaction Requirements 和 Acceptance Examples。
- AE5b. **Covers R22, R23.** Given 用户给的需求里夹带无证据的 metrics/客户反馈和具体接口字段设计，when 写 PRD，then 无证据内容必须进入 Assumptions 或 Outstanding Questions、不得编造，且 PRD 不得包含 implementation units / schema / 接口字段 / 任务拆解。
- AE5c. **Covers R6c.** Given 用户粘贴的是一段需求邮件 / 聊天记录而非结构化 PRD，when 走 refine，then `spec-prd` 先把输入结构化为主张与缺口、按 create 路径补齐并标注原始 vs 补全，输入不足时回到 Scope confirmation 取最小必要信息，不编造产品意图。
- AE5c2. **Covers R6e, R21c, R23b, R23f.** Given 用户传入已有 `artifact_kind: prd-requirements` 草稿，when `spec-prd` 恢复 refine，then workflow 保留 `spec_id` 与既有 trace ID、只询问缺失或模糊维度；given 用户传入 implementation plan / design / task 文档，then workflow 提示阶段不匹配并推荐合适 handoff；given 用户只要修一个明确 bugfix，then workflow 提供 compact PRD / plan / work 的轻量选择。收尾摘要必须列出需求、验收、优先级和 trace 缺口。
- AE5d. **Covers R22b.** Given 需求是“后台导出用户手机号清单”，when 生成 PRD，then 必须显式标注涉及的权限边界、数据敏感性与合规点；无法确认合规口径时进入 Outstanding Questions，不得默认放行。
- AE5e. **Covers R23b, R23c, R23d.** Given PRD 完成，then 每条核心需求至少被一个 acceptance 覆盖且互相标注 trace、每条 current-state claim 带 evidence tag、文档语言遵循 host language setting（默认中文，标识符/路径保留原文）。
- AE5f. **Covers R16c.** Given 用户没有提供可信成功指标，when 生成 PRD，then Success Metrics 只能写可观察口径或进入 Assumptions / Outstanding Questions，不得编造数值目标；given 用户提供已确认目标，then PRD 应把目标写入可衡量口径并标 evidence tag。
- AE5g. **Covers R13b, R17b, R21b, R23e.** Given 用户说“账户下单失败要优化”但项目文档把客户账户、资金账户和登录用户区分为不同概念，且源码只支持整单撤销而用户描述暗示部分撤销，when `spec-prd` 生成 PRD，then workflow 先用源码/文档确认现状，提出推荐 canonical term 和最小 owner 确认问题，把代码事实矛盾写入 Evidence And Assumptions / Outstanding Questions，并只在满足硬决策三条件时把后续 ADR-like 沉淀作为建议，不自动创建长期 context 文件。
- AE6. **Covers R24-R30.** Given target surface 是 Backend/Java，when 生成 PRD，then 输出必须关注 API contract、幂等、事务、错误码、兼容和观测性，而不是套用 App 页面模板。
- AE6b. **Covers R22c, R30b, R30c, R32.** Given 项目行业为证券且用户要求“App 下单页增加风险提示”，when 生成 PRD，then workflow 同时叠加 App lens 与证券 overlay，明确监管辖区/市场/账户/客户分类、适当性/风险揭示、订单/行情/资金影响、审计留痕与待确认合规口径，且不写接口字段或风控算法。
- AE7. **Covers R31-R35.** Given readiness lens 发现产品行为仍未决，when workflow 收尾，then 输出最小补齐问题或记录带 assumptions 继续的风险，并推荐 `spec-doc-review` 或 `spec-plan`。
- AE8. **Covers R36-R41.** Given 规划 `spec-prd` v1，when implementation plan 编写，then 不新增公开 agent 入口、不新增 `docs/prds/`、不新增 evidence enum，并把详细模板放入 references；readiness reviewer 仅作内部 helper，其实体化须有 fresh-source eval 证据。
- AE9. **Covers R6, R24, R31.** Given 用户说“App 订单页增加异常提示，帮我完善 PRD”，when 路由判断，then 进入 `spec-prd` 写 PRD；given 用户说“拿这份 PRD、Figma、源码做一致性审计”，then 推荐 `spec-app-consistency-audit`。
- AE10. **Covers R31.** Given `spec-prd` v1 以 by-reference 复用 readiness gate，when 实现 `prd-readiness-lens.md`，then 它引用既有 gate 的维度清单而非复制全文，且 contract test 断言 `spec-prd` 与 `spec-brainstorm` 两处 gate 维度不 drift。
- AE11. **Covers R16d, U4, U5.** Given `docs/需求文档模版/标准模版/` 已存在人用标准模板，when plan 实现 `prd-output-template.md` 与 `domain-lenses.md`，then 必须明确它们与模板库的关系（derive / reference / intentionally diverge），并用 focused drift check 或 reviewer checklist 防止 core section 与 lens 语义漂移。

---

## Implementation Direction

- U1. v1：在 `skills/spec-prd/references/prd-readiness-lens.md` 内 by-reference 引用既有 Requirements Readiness Gate 维度清单（不抽取、不改 `spec-brainstorm` source）；加 contract test 断言 `spec-prd` 与 `spec-brainstorm` 两处 gate 维度不 drift。物理抽取到 `docs/contracts/workflows/requirements-readiness-gate.md` 列为 v2 重构项。
- U2. 新增 `skills/spec-prd/SKILL.md`，保持精简，只写触发、边界、workflow、reference load 条件和 handoff。
- U3. 新增 `skills/spec-prd/references/current-state-analysis.md`，并在其中定义 source-first questioning 与用户现状主张 / source-confirmed fact 冲突的处理规则。
- U4. 新增 `skills/spec-prd/references/prd-output-template.md`，以 `docs/需求文档模版/标准模版/00-通用增量需求模板.md` 的 core/conditional 分层为 human-facing seed，并明确 source-of-truth 关系；至少覆盖 Success Metrics、Glossary 和 Decision Notes 的 conditional 规则。
- U5. 新增 `skills/spec-prd/references/domain-lenses.md`，明确 App lens 与 `spec-app-consistency-audit` 的边界，并支持 surface lens + industry overlay 组合；首个行业 overlay 以 `docs/需求文档模版/标准模版/90-证券行业需求关注点与参考附录.md` 为 seed。
- U5b. 新增 `skills/spec-prd/references/domain-language-and-decision-ledger.md`，吸收 `grill-with-docs` 的术语校准、代码事实交叉验证、scenario grill 与稀疏 decision note 门槛；明确不要求固定 `CONTEXT.md` / `docs/adr/`，不默认写长期知识文档。
- U6. 新增 `skills/spec-prd/references/prd-readiness-lens.md`，引用共享 gate 并追加 PRD-specific lens，覆盖术语歧义、用户说法与源码矛盾、硬决策未记录风险。
- U6b. readiness reviewer 落地姿态：v1 先由 `spec-prd` orchestrator 依 `prd-readiness-lens.md` 自执行 readiness；plan 用 fresh-source eval 校准是否需实体化 `agents/spec-requirements-readiness-reviewer.agent.md`（受 R38/R39 eval 门槛约束）。
- U6c. 若 reviewer 被实体化且要被 `spec-doc-review` 复用，必须同步更新 `skills/spec-doc-review/SKILL.md` 的 conditional persona 列表与 Dispatch Capability Gate 契约（当前其 reviewer 列表为固定 always-on + 5 个 conditional persona，不含该 reviewer），并补 doc-review persona-selection 的 contract test；若 v1 不实体化，则 R38/R39 的"跨 spec-doc-review 复用"降级为 **spec-prd 内部自检**，doc-review 复用推迟到 reviewer 实体化时。
- U7. 新增 `skills/spec-prd/references/intent-routing.md`，固化 create/refine/validate、code-align posture 和 `spec-brainstorm` tie-break。
- U7b. `intent-routing.md` / `prd-output-template.md` 必须定义超大 PRD 的轻量多文档拓扑：source input by-reference、split summary requirements、child PRD requirements；同一大需求共享 base `spec_id` / slug，child PRD 使用 `child_id` + parent/source/summary 回链，且只在 owner 确认后落盘。
- U7c. `intent-routing.md` 必须定义输入模式与恢复规则：requirements 草稿恢复、其他 Markdown 参考、plan/design/task handoff、纯文本 create、无输入交互、轻量 bugfix / 脚本绕行；`prd-output-template.md` 必须定义 trace/readiness 摘要格式和 ID 续接规则。
- U8. 新增 host command template 与 dual-host governance 注册。
- U9. 更新 `using-spec-first` 路由规则，区分 `spec-brainstorm`、`spec-prd`、`spec-app-consistency-audit`。
- U10. 更新 `spec-plan` intake 文档，确认 `artifact_kind: prd-requirements` 等价消费。
- U11. 补 focused tests：skill entrypoint lint、public workflow registration、routing tie-break、shared gate drift、spec-plan intake、no generated runtime manual edit。
- U12. 增加 fresh-source eval fixtures，其中须包含一组 readiness 自审 fixtures，用于校准是否实体化 readiness reviewer agent（R38 eval 门槛证据）。
- U13. 更新 README / README.zh-CN / 用户手册 artifact map / CHANGELOG。

---

## Evaluation Plan

| Fixture | Input | Expected behavior |
| --- | --- | --- |
| Existing PRD refine | 已有 PRD path，要求“完善” | 保留原意，输出 gap report、current-state snapshot、补齐后的 PRD |
| Oversized initial PRD split | PM 给出一份跨 App/Admin/Backend/资金交易的超大 PRD | 先输出 split-decision；owner 确认后生成 split summary + child PRDs，原始 PRD by-reference 保留，同组文档共享 base `spec_id`，child PRD 以 `child_id` 和 parent/source/summary 回链 |
| One-line Admin iteration | “后台用户列表增加批量导入” | 触发 Admin lens，补权限、导入校验、失败行反馈、审计/回滚问题 |
| 0-1 idea | “想做一个新社区产品” | 推荐 `spec-brainstorm`，不生成伪 PRD |
| Backend/Java change | “给现有订单状态增加取消原因” | 关注状态机、错误码、幂等、兼容、观测性 |
| Low-quality refine input | 粘贴一段需求邮件/聊天记录要求“完善 PRD” | 先结构化为主张+缺口、按 create 补齐、标注原始 vs 补全，不假装是完整 PRD |
| Security-sensitive increment | “后台导出用户手机号清单” | 显式标注权限边界/数据敏感性/合规点，不确定项进 Outstanding Questions |
| Securities industry App order | “证券 App 下单页增加风险提示” | 同时触发 App lens + securities overlay，补适当性、风险揭示、交易时段/订单、资金影响、审计留痕和合规待确认项 |
| Success metrics without evidence | “把转化率提升 30%”但无证据来源 | 不写成 confirmed target，进入 Assumptions 或要求用户确认 |
| Template drift | 人用模板新增行业横切自检但 skill reference 未覆盖 | focused drift check / reviewer checklist 提醒更新 `prd-output-template.md` 或 `domain-lenses.md` |
| Stale GitNexus pointer | GitNexus 与源码不一致 | 降级 GitNexus pointer，以源码为准 |
| Readiness reviewer eval gate | 用户问是否要新增 agent | 回答 v1 仅纳入 1 个内部 readiness reviewer(非公开入口),且实体化须 fresh-source eval 证明 orchestrator 自审失效；现状采集复用 `spec-repo-research-analyst`，不新增 researcher agent |
| Public agent entry boundary | 实现把 readiness reviewer 暴露为 `spec-*` 公开入口 | eval / contract test 失败，要求回到内部 helper 形态 |
| PRD readiness fail | PRD 缺异常和验收 | 输出最小补齐问题或修订建议，不进入 `spec-work` |
| Claude-risk regression | 实现新增 `docs/prds/` 或独立 evidence enum | eval / contract test 失败，要求回到 shared artifact 与 existing evidence policy |
| App audit boundary | “App PRD + Figma + source 一致性审计” | 推荐 `spec-app-consistency-audit`，不把 `spec-prd` 当审计 workflow |
| Brownfield tie-break | “现有后台用户列表增加导入，帮我写 PRD” | 优先 `spec-prd`，不回到泛化 brainstorm |
| Shared gate drift | `spec-brainstorm` 和 `spec-prd` gate wording 不一致 | contract test 失败，要求回到 shared readiness gate |

---

## Risks And Mitigations

> `002` 有 Risks 段，`003` 精简时遗漏。补回，并新增 `003` 特有的 shared-gate 抽取风险——它是本稿唯一会改动 `spec-brainstorm` 既有 source 的决策。

| Risk | Impact | Mitigation |
| --- | --- | --- |
| 两处 readiness gate 维度 drift（v1 by-reference 不抽取，gate 内容存在两份引用） | `spec-prd` 与 `spec-brainstorm` 的 gate 维度可能随时间分叉 | v1 by-reference 不复制全文、只引用维度清单（R31/D7/U1）；**contract test 必须断言两处 gate 维度不 drift**；物理抽取作为 v2 重构消除双份。v1 不动 `spec-brainstorm` source，规避双宿主回归与触动已 completed 的 `2026-05-29-001` plan |
| `spec-prd` 与 `spec-brainstorm` 路由冲突 | 用户不知走哪个入口 | D12 tie-break + routing fixtures（Evaluation Plan 中 Brownfield tie-break / 0-1 idea 两条） |
| `spec-prd` 与 `spec-app-consistency-audit` 边界混淆 | App 场景重复或漏审 | D11 边界 + AE9 + App audit boundary fixture；两 skill 的 When-Not-To-Use 互相点名 |
| PRD 变成实现方案 | 绕过 `spec-plan` source-of-truth | R23 + PRD-specific lens 的 planning invention risk 检查 |
| GitNexus pointer 被写成事实 | 现状不准 | R11/R12/R40 evidence tags + source confirmation；Stale GitNexus pointer fixture |
| 模板过重拖累小需求 | 小需求负担上升 | R16/R16b core+conditional 分层(小增量只填 core)+ references 按需加载 |
| 过早实体化 readiness reviewer agent | 维护成本、上下文膨胀、与现有 agent 重叠 | R38 实体化受 eval 门槛(须 fresh-source eval 证明单 orchestrator 自审失效);R39 划清与 `spec-repo-research-analyst`/`spec-spec-flow-analyzer`/`spec-product-lens-reviewer` 的职责边界;v1 默认 orchestrator-owned |
| readiness reviewer 沦为 `spec-prd` 专属(agent collection 反模式) | 单 skill 私有 agent 增殖 | 设计上 reviewer 的调用契约保持可被 `spec-doc-review` 复用(实体化 + 更新 doc-review persona 契约后启用,见 U6c/R38);非公开入口 |
| 多端 lens 关注点混用 | App/Admin/Backend 需求串味 | R24-R30 lens matrix + 各 surface acceptance fixture |
| 行业 overlay 与 surface lens 漂移 | 证券需求只套 App/Admin/Backend 通用模板，漏掉适当性、资金交易、审计等行业问题 | R22c/R30b/R30c 要求 surface lens + industry overlay 组合；Evaluation 增加 securities fixture |
| 人用模板与 skill reference 多真相源 | `docs/需求文档模版/标准模版/` 与 `skills/spec-prd/references/*` 各自演化，输出不一致 | R16d/U4/U5 明确 source-of-truth 关系；用 drift check 或 reviewer checklist 暴露差异，避免 silent divergence |
| v1 过早实现 packet/multi-surface（范围爆炸成需求编译系统） | 违 light-contract / 80-20，未证明价值就上规模 | NG8 明确 v1 不实现 packet；R6b 复杂度识别闸只做识别+建议+handoff；完整实现推迟 v2（Scope: v1 vs v2）|
| 两文档多真相源（003 与《大需求拆分.md》对立） | 下游不知以哪份为准 | 关系 C 分层：003=增量 PRD 当前真相源，愿景文档降为多阶段路线图（frontmatter 声明 + 关系诊断）|
| 借鉴 grill 后过度追问或写入长期知识库 | owner 体验退化，`spec-prd` 变成 glossary/ADR 管理器 | R13b/R17b/R21b/R23e 限定为 bounded grill：先查证、最多少量阻塞问题、默认写入 PRD artifact，不要求或创建固定 `CONTEXT.md` / ADR |
| 照搬 `cf-task` 的 `.code-flow` 目录和 PRD→design→plan 中间链 | 与 spec-first 现有 `docs/brainstorms` → `spec-plan` artifact 链路冲突，形成第二套任务系统 | 只吸收输入模式、交互节奏和 trace 自检；不引入 `.code-flow/tasks`、`.prd.md/.design.md` 后缀契约或强制 design 中间文档 |

---

## Key Decisions

- D1. 新增 1 个公开 skill：`spec-prd`。
- D2. `spec-brainstorm` 继续负责 0-1 / WHAT shaping。
- D3. `spec-prd` 负责已有系统上的增量需求迭代 PRD 输出。
- D4. create/refine/validate 是内部 intent；code-align 是 evidence posture / 子模式，不拆公开入口。
- D5. v1 纳入 1 个 eval-gated 内部 readiness reviewer（`spec-requirements-readiness-reviewer`，命名待定），非公开入口，主要服务 `spec-prd` 自检；被 `spec-doc-review` 复用为条件能力（须实体化 + 更新 doc-review persona 契约）。实体化受 fresh-source eval 校准，现状采集不新增 agent（复用 `spec-repo-research-analyst`）。
- D6. PRD artifact 默认仍写 `docs/brainstorms/*-requirements.md`。
- D7. v1 以 by-reference 复用既有 Requirements Readiness Gate（`spec-prd` 在 `prd-readiness-lens.md` 引用维度清单 + 追加 PRD-specific lens），物理抽取到 `docs/contracts/workflows/requirements-readiness-gate.md` 推迟到 v2；contract test 断言两处 gate 维度不 drift。
- D8. 复用 graph evidence policy，不新增 evidence 权威体系。
- D9. Current-state analysis 是核心差异化，但不得反向驱动 HOW。
- D10. `001/002` 作为 Claude 侧分析输入；本 `003` 是 owner 当前 planning source。
- D11. `spec-prd` 的 App lens 是 PRD 作者期 lens；PRD/Figma/source 一致性审计继续归 `spec-app-consistency-audit`。
- D12. 路由 tie-break：现有系统锚点 + PRD/需求文档目标优先 `spec-prd`；产品形态/actor/core outcome 未定优先 `spec-brainstorm`。
- D13. 外部竞品研究是 opt-in advisory evidence，不进入默认 PRD run。
- D14. 本文是《大需求拆分.md》终态愿景的第一阶段落地（关系 C）：`spec-prd` v1 = 增量 PRD（默认单文件;超大 PRD 经 owner 确认走轻量多文档拓扑,见 R6d）+ 复杂度识别闸；完整 packet / 跨端 multi-surface / manifest / trace-ledger 推迟 v2，复用愿景文档结构设计，packet 最终载体 v2 再定。两文档分层消除多真相源。
- D15. `docs/需求文档模版/标准模版/` 是 human-facing 标准模板库；`skills/spec-prd/references/prd-output-template.md` 与 `domain-lenses.md` 是 runtime authoring contract。v1 plan 必须声明二者关系并防 drift；证券行业 overlay 作为首个行业示例进入 domain lenses。
- D16. 借鉴 `grill-with-docs` 的 interrogation architecture，不借鉴其 document persistence architecture：`spec-prd` 吸收 bounded domain-language grill、source-first questioning、scenario stress-test 和稀疏 decision note 门槛；不把 `CONTEXT.md` / ADR 作为默认 source-of-truth 或写入目标。
- D17. 借鉴 `cf-task:prd` 的 workflow ergonomics，不借鉴其 artifact topology：吸收输入模式判定、轻量绕行、草稿恢复、跳过已知维度、稳定 ID 续接和 trace/readiness 摘要自检；不引入 `.code-flow/tasks`、`.prd.md/.design.md` 后缀契约或 PRD→design→plan 中间链。

---

## Outstanding Questions

### Resolve Before Planning

- None. 产品形态、skill 数量、agent 策略、artifact 策略、evidence 策略、App audit 边界、shared readiness gate 复用方式、标准模板库关系、证券行业 overlay、bounded domain-language grill、`cf-task` 借鉴边界和 `spec-brainstorm` / `spec-prd` 路由 tie-break 均已收敛。

### Deferred to Planning

- [Affects R31/U1][v2-重构] shared readiness gate 物理抽取到 `docs/contracts/workflows/requirements-readiness-gate.md`（由 `spec-brainstorm` 与 `spec-prd` 共享）已定为 **v2 重构项**：v1 走 by-reference，待 `spec-prd` 上线、确认两处 gate 确有 drift 痛点后再抽取。此项不阻塞 v1 planning。
- [Affects U8][Technical] Claude/Codex command template、dual-host governance 注册点由 `spec-plan` 根据当前 source generator 确认。
- [Affects U10][Technical] `spec-plan` intake 是否需要 contract test fixture 覆盖 `artifact_kind: prd-requirements`。
- [Affects U12][Evaluation] fresh-source eval 用现有 reviewer 机制还是最小 read-only fixture prompt 执行。
- [Affects U4/U5][Technical] `prd-output-template.md` 与 `domain-lenses.md` 是直接引用 `docs/需求文档模版/标准模版/`、复制精简内容，还是建立生成/检查脚本，由 `spec-plan` 在最小维护成本原则下决定；无论选择哪种，必须留下 drift 暴露机制。

---

## 审查校准注记（2026-05-30 全面审查）

本文已作为 planning 唯一 source。全面审查后修复/标注的点，供 plan 阶段注意：

- **结构修复**：上一轮插入 Risks 段时误吞了 `## Key Decisions` 标题与 D1，已还原。
- **Traceability 已修正（不再留给 plan）**：原 Key Flows 的 `Covered by` 与 AE 的 `Covers` 把 meta requirement（R1 skill 存在性、R2 定位、R4 posture）误当 flow/AE 覆盖项，已逐条收窄为真正可验收的行为 R——F1→R3/R7-R10/R16-R20，F2→R3/R7/R9/R10/R16/R18/R21，AE1→R3/R7/R16，AE5 拆出 AE5b 覆盖 R22/R23。meta R 与架构 guardrail（R1/R2/R4、R36-R41）只由 Owner Decision / Key Decisions 承载，不进 flow/AE 行为覆盖（AE8 例外：它专门验收 R36-R41 这组架构约束本身）。
- **事实时效**：R12 与 frontmatter graph note 已从"钉死当前 dirty-advisory 快照"改为"按 graph-evidence-policy 条件判定"，避免 graph 刷新后文档过期。
- **冗余**：Owner Decision 表、Decision Closure、20-Round、Key Decisions(D1-D13)、Risks 之间有内容重复(单入口/无 agent/shared gate/tie-break 各说多遍)。owner-final 保留以自洽，plan 引用时认 Key Decisions(D1-D13)与 Requirements(R)为准，其余为论证过程。

---

## 变更记录（2026-05-30 brainstorm：新增 readiness reviewer agent）

owner 在 `spec-brainstorm` 复审中决定调整一条原已收敛决策：从「v1 不新增 agent」改为「v1 纳入 1 个 eval-gated 内部 readiness reviewer」。

- **决策实质**：新增内部 reviewer helper（暂名 `spec-requirements-readiness-reviewer`），own PRD-grade readiness 判断，主要服务 `spec-prd` 自检、设计上保持可被 `spec-doc-review` 复用（实体化 + 更新 doc-review persona 契约后启用），**非用户公开入口**；实体化受 fresh-source eval 校准——v1 先 orchestrator-owned 执行 `prd-readiness-lens.md`，仅当 eval 证明单 orchestrator 自审稳定失效时才落地为独立 agent。
- **未改动的边界**：单入口 `spec-prd`、PRD artifact 路径、graph evidence policy、domain lens、与 `spec-brainstorm`/`spec-app-consistency-audit` 的 tie-break 均不变；现状采集**不**新增 researcher agent，复用 `spec-repo-research-analyst`。
- **同步更新处**：Summary、Owner Decision 表、20-Round#12、NG4、R38/R39、D5、Actors A6、U6b、U12、Risks（过早实体化 / agent collection 两条）、AE8、Evaluation Plan（readiness reviewer eval gate / public agent entry boundary 两条 fixture）。
- **plan 注意**：R38/R39 是 Architecture Guardrails（按 H5 收口，不作对等产品验收）；reviewer 是否实体化由 plan 阶段 fresh-source eval 决定，不在本需求文档预判。

---

## 变更记录（2026-05-30 brainstorm：PRD 模板刚性收口）

owner 在 `spec-brainstorm` 复审中收口 R16「必须包含 13 section」与 Risks「right-sized」的字面冲突。

- **决策实质**：PRD 模板改为 **core + conditional 两层**——core sections（Summary、Change Delta、Requirements、Acceptance Examples、Scope Boundaries、Evidence And Assumptions）始终必填，作为 `spec-plan` 消费的最小骨架；conditional sections（Problem Frame、Current System Snapshot、Goals / Success Metrics / Non-Goals、Glossary、Actors、Use Cases、Interaction Requirements、Exception Handling、Outstanding Questions）按 target surface 与需求规模决定是否展开。
- **裁剪不丢证据**：conditional section 展开时仍须满足 R17-R21；被省略项若有未决点，必须落入 Outstanding Questions，不得静默丢弃。
- **同步更新处**：R16 拆为 R16(core)+R16b(conditional)；R17/R19/R20 措辞从无条件「必须」校准为「该 section 展开/对应 surface 命中时必须」；Risks 段「模板过重」mitigation 引用 R16/R16b。
- **未改动**：13 个 section 的清单本身不增删；每个 section 的具体文案/字段留给 plan 阶段 `prd-output-template.md`（HOW）。

---

## 变更记录（2026-05-30 brainstorm：与终态愿景分层、确立 v1/v2 范围边界）

owner 选定关系 C：本文是《大需求拆分.md》终态愿景的**第一阶段落地真相源**，两文档从"对立"变"分层"，消除多真相源。

- **决策实质**：`spec-prd` v1 只做单文件增量 PRD + **复杂度识别闸**（检测大需求/跨端信号则输出 split-decision 建议并 handoff，不硬塞单文件、不实现 packet 重机制）；大需求 Requirements Packet、跨端 Multi-Surface Packet、Parent/Child 拆分推迟 **v2+**，届时复用《大需求拆分.md》的 packet/contract 结构设计；packet 最终载体（spec-prd 长出 vs 回流 brainstorm/spec-requirements）推迟到 v2 再定，不阻塞 v1。**（后续修订：本条是引入 v1/v2 边界那轮的历史记录；其后 R6d/R10 增补了"owner 确认的超大 PRD 走轻量多文档拓扑"一档,当前产物形态以 NG8/D14/R6d 的三档表述为准——默认单文件 / 超大轻量多文档 / 完整 packet=v2+。）**
- **关系处理**：给《大需求拆分.md》加 frontmatter + 关系声明，标为多阶段愿景路线图、增量 PRD 层以 003 为准；本文 frontmatter 加 `relationship_to_vision_roadmap` 指针；新增关系诊断文档 `docs/brainstorms/2026-05-30-003-spec-prd-关系诊断-vs-大需求拆分.md`。
- **同步更新处**：新增 `## Scope: v1 vs v2` section、NG8（v1 不实现 packet/multi-surface/拆分）、R6b（复杂度识别闸）、AE2b（识别闸验收）、D14（关系 C 决策）、Risks 两条（v1 过早实现 packet / 多真相源）。
- **未改动**：spec-prd 单入口、单文件 PRD 核心体验、core/conditional 模板、by-reference gate、reviewer 决策、domain lens、路由 tie-break 均不变；本次只新增 v1/v2 边界与识别闸，未推翻任何既有决策。
- **plan 注意**：v1 实现范围以 NG8 + Scope: v1 vs v2 为界；复杂度识别闸（R6b）是 v1 必做的轻量行为，packet 完整实现明确不在 v1。

---

## 变更记录（2026-05-30 brainstorm：完整性补强 7 点）

owner 要求审查"还有哪些需要完善"，按推荐补强 6 点（第 7 点重复运行/幂等留给 plan）。均为新增，未推翻既有决策。

- **intent-flow 对齐**：拆出 F1（create：有增量方向但无 PRD，从零写）与 F1b（refine：完善已有 PRD），F2 标注为 create 轻量入口，F4 标注 = `validate` intent；解决 `create` intent 原先无专属 flow 的结构缺口。
- **安全/权限维度**：新增 R22b——触及权限/数据/资金/审计/合规时 PRD 必须显式标注边界与敏感性，不确定进 Outstanding Questions；AE5d + Quality Bar「权限/数据」行 + Security-sensitive fixture 配套。
- **输入质量边界**：新增 R6c——低质量/非 PRD 输入须先结构化按 create 补齐并标注原始 vs 补全，不足时回 Scope confirmation 取信息、不编造；AE5c + Low-quality refine fixture 配套。
- **PRD 自身 trace**：新增 R23b——requirement↔acceptance 内部 traceability，便于 plan 直接消费。
- **evidence tag 强制**：新增 R23c——每条 current-state claim 必须带 evidence tag，给 R11/R12 治理抓手。
- **语言策略**：新增 R23d——PRD 生成语言遵循 host language setting（默认中文，标识符/路径保留原文）。
- **配套**：AE5e 合并覆盖 R23b/R23c/R23d；Quality Bar 加「Trace」行。
- **plan 注意**：F2 与 F1 同为 create intent（F2 是一句话轻量入口、F1 是完整 create），plan 实现时按同一 intent 处理；重复运行/幂等行为（覆盖 vs 新文件 vs merge）本文未决，留给 plan。

---

## 变更记录（2026-05-31 work：标准 PRD 模板与证券行业 overlay 双向收口）

owner 要求结合 `docs/需求文档模版/标准模版/` 与证券行业属性，反向优化 `spec-prd` skill 需求，并同步优化模板库。

- **决策实质**：`spec-prd` v1 必须支持「surface lens + industry overlay」组合；证券行业作为首个行业 overlay，覆盖监管辖区/展业地、客户分类、账户类型、产品/市场范围、适当性、AML/KYC、风控、行情权限、交易/订单、资金清结算、审计留痕、数据精度与时区。
- **模板关系**：`docs/需求文档模版/标准模版/` 定位为 human-facing 标准模板库；`skills/spec-prd/references/prd-output-template.md` 与 `domain-lenses.md` 定位为 runtime authoring contract。二者不能静默漂移，plan 必须声明 derive/reference/diverge 关系并提供 drift 暴露机制。
- **Success Metrics 收口**：吸收业界 PRD 对标文档的校准提示，新增 R16c——产出 PRD 支持 Success Metrics 作为 conditional section；有可信证据则填，无证据不得编造，进入 Assumptions / Outstanding Questions。
- **同步更新处**：新增 G8、R16c/R16d、R22c、R30b/R30c，扩展 R32、Quality Bar、AE5f/AE6b/AE11、U4/U5、Evaluation Plan、Risks、D15、Deferred to Planning。
- **未改动**：单入口 `spec-prd`、PRD artifact 路径、core/conditional 分层、by-reference readiness gate、readiness reviewer eval 门槛、v1 不做 packet/multi-surface 的边界均不变。

---

## 变更记录（2026-05-31 plan：超大 PRD 拆分文档拓扑收口）

owner 追问“LLM 能否拆分”以及“是否会有原始需求、拆分模块需求、拆分汇总需求多份文档”，补强超大初版 PRD 的 v1 执行边界。

- **决策实质**：`spec-prd` v1 允许 LLM 基于原始 PRD、历史文档、代码现状和 GitNexus pointer 给出语义拆分建议，但拆分边界、优先级和发布节奏必须由产品 owner/PM 确认后才落盘。脚本/工具只提供事实，不做业务拆分裁决。
- **文档拓扑**：超大 PRD 命中复杂度识别闸后采用轻量三层文档：原始 PRD/source input by-reference 保留；split summary requirements 文档记录拆分依据和 child PRD 索引；同一大需求共享一个 base `spec_id` / slug，每个 child PRD 使用唯一 `child_id` 并回链 `parent_spec_id` / `source_prd` / `split_summary`。默认仍在 `docs/brainstorms/*-requirements.md` 下，不新增 `docs/prds/`。
- **边界不变**：这不是完整 Requirements Packet，不新增 manifest/trace-ledger/integration-contracts，也不绕过 owner 确认批量生成 child PRD；v2 才考虑 packet 化。
- **同步更新处**：Scope v1/v2、Product Shape、Interaction Model、F1c、R6d、AE2c、U7b、Evaluation Plan；对应实施计划 `docs/plans/2026-05-31-001-feat-spec-prd-workflow-plan.md` 同步补 R10 和相关 implementation unit。

---

## 变更记录（2026-05-31 work：`grill-with-docs` 提问架构收口）

owner 要求从项目 owner 视角判断 `spec-prd` 是否必要，并深度比较外部 skill `grill-with-docs`(本地调研,未入本仓库)可借鉴内容后，收口为“借鉴提问架构，不借鉴持久化架构”。

- **决策实质**：`spec-prd` v1 吸收 bounded domain-language grill：source-first questioning、术语 canonical term 校准、用户说法与源码事实矛盾处理、1-3 个具体 scenario stress-test、稀疏 decision note 门槛。
- **不采纳部分**：不把 `CONTEXT.md` / ADR 写入机制作为默认 source-of-truth，不要求固定 glossary/ADR 目录，不在 PRD workflow 中自动创建长期知识文档。
- **PRD-local 输出**：确认后的术语、事实矛盾和硬决策只写入本次 PRD 的 `Glossary`、`Evidence And Assumptions`、`Decision Notes` 或 `Outstanding Questions`；只有 hard-to-reverse、surprising-without-context、real-trade-off 同时成立时，才建议后续 ADR-like 沉淀。
- **同步更新处**：新增 NG9、R13b/R17b/R21b/R23e、S6、AE5g、U5b、D16，扩展 Summary、R16b、R32、U3/U4/U6、Risks、Resolve Before Planning；对应实施计划同步新增 plan-R11、`domain-language-and-decision-ledger.md`、U2/U3/U4/U7 验收与 no-default-long-term-doc 边界。
