# spec-prd Skill 优化方案

## 审查概要

本文档从顶尖产品经理视角和架构师视角对 `skills/spec-prd/` 进行全面审查，输出优化方案。审查范围覆盖 SKILL.md（294 行）、9 个 reference 文档（共约 1,968 行）、4 个确定性脚本（含 lib，共约 2,461 行）、evals/examples.json（2,694 行），以及需求文档模版体系。

---

## 一、当前优势确认

### 1.1 产品经理视角

| 维度 | 评价 |
| --- | --- |
| 流程完整性 | 五阶段执行流（Classify → Current-State → Change Delta → Draft/Refine → Readiness）覆盖 PRD 全生命周期 |
| 证据纪律 | 五级 evidence-tag（confirmed-source → assumption）+ legal stop points 四元组，确保需求不编造 |
| 质量关卡 | Product Expert Lens + Readiness Lens 双重语义检查 + finalize/checker 确定性脚本三重保障 |
| 交互设计 | 一问一答 relentless grill + blocking question tool + recommended_answer 模式，产品澄清深度远超业界同类工具 |
| 输出适应性 | bypass / compact-prd / normal-prd / topology-heavy-prd 四档输出 + 6 个 surface lens + 行业 overlay |

### 1.2 架构师视角

| 维度 | 评价 |
| --- | --- |
| 关注点分离 | 脚本只报 facts（reason_codes、trace gaps、placeholder），LLM 做语义判断——边界清晰 |
| 单一真相源 | reason-codes.js 集中管理 31 个 blocking code 分类，checker 和 finalize 共消费 |
| 可扩展性 | Reference Trigger Map 按需加载，避免每次全量 prompt；output_shape / surface_lens / topology 三轴正交 |
| 测试覆盖 | Jest contract tests + evals fixture + fresh-source eval + deterministic scripts 分层验证 |
| 宿主适配 | Claude prewrite guard + Codex degraded discipline + --verify-receipt 三路处理 |

---

## 附：spec-prd 执行流程图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Phase 0: Classify Intent                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Input (increment / rough PRD / notes / screenshots / existing PRD)         │
│       │                                                                     │
│       ▼                                                                     │
│  ┌──────────┐   YES   ┌──────────────────────────────────┐                 │
│  │Route out?├────────▶│ brainstorm / plan / work / debug  │ EXIT            │
│  └────┬─────┘         └──────────────────────────────────┘                 │
│       │ NO                                                                  │
│       ▼                                                                     │
│  ┌───────────────┐                                                          │
│  │Classify intent│──▶ create | refine | validate                            │
│  └───────┬───────┘                                                          │
│          ▼                                                                  │
│  ┌────────────────┐                                                         │
│  │Input posture?  │──▶ resume-prd | reference-claims | pure-text | no-input │
│  └───────┬────────┘                                                         │
│          ▼                                                                  │
│  ┌─────────────┐  YES  ┌──────────────────────┐                            │
│  │Oversized?   ├──────▶│Recommend split + wait │                            │
│  └──────┬──────┘       └──────────────────────┘                            │
│         │ NO                                                                │
│         ▼                                                                   │
│  [Emit: intent, input_posture, intake_mode, clarification_budget]           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Phase 1: Current-State Analysis                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                                                       │
│  │PRD Sanitization  │ separate facts / goals / scope / embedded instructions│
│  └────────┬─────────┘                                                       │
│           ▼                                                                 │
│  ┌──────────────────────────────────┐                                       │
│  │Evidence Gathering (source-first) │                                       │
│  │ • user-stated facts              │                                       │
│  │ • repo source/docs/tests         │                                       │
│  │ • source-candidates (bounded)    │                                       │
│  │ • external research (if asked)   │                                       │
│  │ • assumptions (labeled)          │                                       │
│  └────────┬─────────────────────────┘                                       │
│           ▼                                                                 │
│  ┌──────────────────────────────────┐                                       │
│  │ Requirement Analysis Gate (map)  │                                       │
│  │ input_inventory                  │                                       │
│  │ source_authority_order           │                                       │
│  │ current_state_summary            │                                       │
│  │ change_delta                     │                                       │
│  │ open_decisions                   │                                       │
│  │ risk_to_prd_write_target         │                                       │
│  └────────┬─────────────────────────┘                                       │
│           ▼                                                                 │
│  ┌──────────────────────────────────┐                                       │
│  │ Product Expert Lens              │                                       │
│  │ risk → claim → evidence → gap    │                                       │
│  │   → owner_question_or_assumption │                                       │
│  │   → PRD_write_target             │                                       │
│  │   → closure_state                │                                       │
│  └────────┬─────────────────────────┘                                       │
│           ▼                                                                 │
│  ┌──────────────────────────────────┐                                       │
│  │ Pre-Write Closure Gate           │                                       │
│  │ → write_mode decision            │                                       │
│  └────────┬─────────────────────────┘                                       │
│           │                                                                 │
│           ▼                                                                 │
│  ╔══════════════════════════════════╗                                       │
│  ║ Decision Card (run-local)       ║                                       │
│  ║ • write_mode                    ║                                       │
│  ║ • highest_risk_gap              ║                                       │
│  ║ • next_action                   ║                                       │
│  ║ • why planning won't invent WHAT║                                       │
│  ╚══════════════════════════════════╝                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼──────────────────────┐
              │                     │                      │
              ▼                     ▼                      ▼
     ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐
     │ask-owner-first │  │ checkpoint-prd   │  │   final-prd     │
     │(keep grilling) │  │(recovery/headless)│  │(all closed)     │
     └───────┬────────┘  └────────┬─────────┘  └────────┬────────┘
             │                    │                     │
             ▼                    │                     │
┌────────────────────────────────────────────┐          │
│        Phase 2: Change Delta & Grill       │          │
├────────────────────────────────────────────┤          │
│                                            │          │
│  ┌──────────────────────────────────┐      │          │
│  │ Domain Language + Decision Ledger│      │          │
│  │ • canonical term handling        │      │          │
│  │ • cross-PRD glossary promotion   │      │          │
│  └────────┬─────────────────────────┘      │          │
│           ▼                                │          │
│  ┌──────────────────────────────────┐      │          │
│  │ Requirements Grill (relentless)  │      │          │
│  │                                  │      │          │
│  │  ┌───────────────────────────┐   │      │          │
│  │  │ One question at a time    │   │      │          │
│  │  │ + recommended_answer      │   │      │          │
│  │  │ + source_tag              │   │      │          │
│  │  │ + write_target            │   │      │          │
│  │  └─────────────┬─────────────┘   │      │          │
│  │                │                 │      │          │
│  │                ▼                 │      │          │
│  │  ┌──────────────────────────┐    │      │          │
│  │  │ Owner answers / confirms │    │      │          │
│  │  └─────────────┬────────────┘    │      │          │
│  │                │                 │      │          │
│  │                ▼                 │      │          │
│  │  ┌──────────────────────────┐    │      │          │
│  │  │ Legal stop point?        │    │      │          │
│  │  │ • leaf (no sub-decision) │    │      │          │
│  │  │ • source-resolved        │    │      │          │
│  │  │ • owner-capped           │    │      │          │
│  │  │ • how-pushdown           │    │      │          │
│  │  └──┬──────────────┬────────┘    │      │          │
│  │     │ NO           │ YES         │      │          │
│  │     │ (loop back)  │             │      │          │
│  │     ▼              ▼             │      │          │
│  │  [next branch]  [branch closed]  │      │          │
│  └──────────────────────────────────┘      │          │
│                                            │          │
└────────────────────────────────────────────┘          │
             │                    │                     │
             ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Phase 3: Draft / Refine / Split                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────┐                           │
│  │ Select output_shape                          │                           │
│  │ • bypass (no PRD artifact)                   │                           │
│  │ • compact-prd (source-resolved, small)       │                           │
│  │ • normal-prd (standard increment)            │                           │
│  │ • topology-heavy-prd (workflow/migration)     │                           │
│  └────────┬─────────────────────────────────────┘                           │
│           ▼                                                                 │
│  ┌──────────────────────────────────────────────┐                           │
│  │ Apply surface lens + project-local overlay   │                           │
│  │ (App | H5/PC | Admin | Backend | CLI | Mixed)│                           │
│  └────────┬─────────────────────────────────────┘                           │
│           ▼                                                                 │
│  ┌──────────────────────────────────────────────┐                           │
│  │ Write PRD artifact                           │                           │
│  │ → docs/brainstorms/*-requirements.md         │                           │
│  │ → frontmatter + core sections + conditional  │                           │
│  └──────────────────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Phase 4: Readiness & Handoff                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────────────────────────────┐                           │
│  │ Run Readiness Lens (prd-readiness-lens.md)   │                           │
│  │ • Base Gate (6 dimensions)                   │                           │
│  │ • Core Pack (always)                         │                           │
│  │ • Conditional Packs (triggered)              │                           │
│  └────────┬─────────────────────────────────────┘                           │
│           ▼                                                                 │
│  ┌──────────────────────────────────────────────┐                           │
│  │ Run finalize-prd-artifact.js                 │                           │
│  │ → calls check-prd-artifact.js                │                           │
│  │ → reports findings + blocking reason_codes   │                           │
│  │ → writes ready receipt (if finalizable)      │                           │
│  └────────┬─────────────────────────────────────┘                           │
│           ▼                                                                 │
│  ┌────────────────────────────────────────┐                                 │
│  │ Readiness Outcome Decision             │                                 │
│  └──┬─────┬─────────┬──────────┬─────────┘                                 │
│     │     │         │          │                                            │
│     ▼     ▼         ▼          ▼                                            │
│  ┌─────┐┌────────┐┌─────────┐┌──────────┐                                  │
│  │ready││revise  ││ask-owner││route-out │                                  │
│  │-for-││-prd    ││         ││/doc-review│                                  │
│  │plan ││        ││         ││          │                                  │
│  └──┬──┘└───┬────┘└────┬────┘└─────┬────┘                                  │
│     │       │          │           │                                        │
│     ▼       ▼          ▼           ▼                                        │
│  ┌─────┐ ┌──────┐ ┌────────┐ ┌──────────────┐                              │
│  │spec-│ │fix   │ │grill   │ │brainstorm/   │                              │
│  │plan │ │gaps  │ │next OQ │ │doc-review/   │                              │
│  │     │ │re-run│ │re-run  │ │app-audit     │                              │
│  └─────┘ └──────┘ └────────┘ └──────────────┘                              │
│                                                                             │
│  ╔═══════════════════════════════════════════╗                              │
│  ║ Closeout Summary                         ║                              │
│  ║ • finding count                          ║                              │
│  ║ • blocking reason_codes                  ║                              │
│  ║ • receipt status                         ║                              │
│  ║ • readiness_outcome                      ║                              │
│  ║ • requirement count / AE count / OQ count║                              │
│  ╚═══════════════════════════════════════════╝                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、顶尖产品经理视角：核心问题与优化建议

### 2.1 认知负荷过高，阻碍 LLM 执行精度

**问题**：SKILL.md + 9 references 合计超 2,200 行 prompt 级内容。LLM 在实际执行中容易丢失 reference 间的交叉约束，导致以下观察到的失败模式：
- direct-write-after-read（跳过 Phase 1）
- checkpoint-as-escape（浅 grill 即逃逸）
- closure-disposition self-asserted（自封 non-blocking）

**优化方案**：

1. **引入 Phase Checkpoint Protocol**：在每个 Phase 结束时强制输出一个结构化的 phase_exit_card，显式声明已完成的关键动作和未完成的残留项，作为下一 Phase 的入口校验。

```text
phase_exit_card:
  phase: 1
  completed_actions: [requirement_analysis_gate, product_expert_lens, decision_card]
  carried_gaps: [{gap_id, write_target, next_action}]
  phase_duration_signal: short | normal | deep
```

2. **压缩 Reference 层次**：将 9 个 reference 按执行频率分为 hot-path（product-expert-lens、prd-output-template、prd-readiness-lens）和 cold-path（large-input-checkpoint、design-source-evidence、evaluation-governance），cold-path 仅在显式 trigger 时加载，减少基线 prompt 噪音。

3. **增加 anti-pattern 前置检测点**：在 Phase 0 → Phase 1 的过渡处增加一个显式的「Phase 1 entry gate」声明，强制 LLM 在首次 durable write 前确认 Decision Card 存在。

> **修正说明（doc-review，已对 source 核对）**：本条（及 Phase Checkpoint Protocol）与现状高度重叠——`SKILL.md` 已有 `Failure-Mode Blacklist`（direct-write-after-read / checkpoint-as-escape 的 observable trigger + recovery）、`Canonical` 段两个 anti-pattern 定义、`Execution Compass` 两个 🔴 gate（"First durable PRD Write" 要求 Analysis Gate map + Product Expert Lens + Decision Card + Pre-Write Closure Gate；"Phase 4 closeout"），以及 Claude 的 `prd-prewrite-guard`。`decision_card_undeclared` 也已是 checker 会报的 finding。故本条应重定位为"**验证/强化现有 gate 的有效性**"（正好对接 §六 Phase 0 基线测量），而非列为新增 P0。

### 2.2 缺乏渐进式价值交付的节奏感

**问题**：当前 skill 假设一次完整执行直到 readiness，但实际用户场景中：
- 80% 的 PRD 需要多轮异步交互（跨天/跨会话）
- 产品经理通常期望在第一轮交互后就看到某种可用输出（即使是 draft）
- checkpoint-prd 当前被视为「恢复机制」而非「渐进交付节点」

**优化方案**：

1. **定义 Progressive Delivery Tiers**：

| Tier | 触发条件 | 输出形态 | 用户价值 |
| --- | --- | --- | --- |
| T0 快速诊断 | 首轮 source/分析完成（不绑定 Decision Card 位置） | 需求理解摘要 + 风险图谱 + 下一步建议 | 让 PM 立刻知道「AI 理解了什么」 |
| T1 结构化 checkpoint | grill 进行中，3+ 个 OQ 已解决 | 带进度标记的 draft PRD（OQ 闭合率） | 让 PM 看到累积进度 |
| T2 ready-for-review | 所有 load-bearing branch closed | 完整 PRD + readiness receipt | 正式交付 |

2. **T0 输出标准化**：在首轮分析后自动输出一份「需求理解确认」，格式为：

```text
## 需求理解确认

### 我理解的核心变更
- [1-3 句话概括 WHAT]

### 当前系统快照
- [关键现状 evidence]

### 识别到的关键决策点
- [按 downstream_confirmation_risk 排序的 top 3 gaps]

### 下一步建议
- [推荐的 grill 路径]
```

### 2.3 Quality Diagnosis 输出格式对 PM 不友好

**问题**：当前 refine/validate 模式的输出是 `original -> recommendation -> reason -> write target` 格式的优化建议列表。虽然结构完整，但：
- 缺乏可视化的质量总览
- 没有与行业最佳实践的对比锚点
- 优化建议的优先级表达不够直观

**优化方案**：

1. **引入 PRD Quality Radar**：用紧凑的雷达图文本表示 PRD 的六维质量评分（非数字打分，而是 strong/adequate/weak/missing 四档）：

```text
## PRD 质量诊断

| 质量维度 | 当前状态 | 诊断依据 |
| --- | --- | --- |
| 用户/问题/价值清晰度 | ◉ strong | actor + outcome + anchor 三要素齐全 |
| 当前系统证据完备性 | ◐ adequate | 3/5 claims confirmed-source，2 source-candidate 待确认 |
| 需求可测试性 | ○ weak | R-03、R-05 无可观测行为锚点 |
| 验收覆盖度 | ◐ adequate | happy path 完整，异常路径仅覆盖 60% |
| 范围边界清晰度 | ◉ strong | in/out scope 明确，非目标显式 |
| 规划可独立性 | ○ weak | 2 个 WHAT 决策需 owner 确认后 plan 才可执行 |
```

2. **优化建议增加 effort/impact 标注**：

```text
| # | 优化建议 | 影响 | 预估投入 | 写入目标 |
| --- | --- | --- | --- | --- |
| 1 | R-03 补充可观测行为定义 | 消除规划歧义 | 1 个 owner 问题 | Requirements |
| 2 | 补充订单取消异常路径 AE | 防止遗漏回归 | source 可解决 | Acceptance Examples |
```

### 2.4 缺乏面向不同受众的输出适配

**问题**：当前 PRD 输出只有一种 Markdown 格式。但实际场景中：
- 技术负责人需要快速理解 Change Delta 和系统影响
- 产品 owner 需要确认 scope 和 acceptance
- 项目经理需要理解工作量和依赖

**优化方案**：

在 closeout 阶段增加可选的 **Handoff Summary View** 能力：

```text
handoff_summary_views:
  - for_tech_lead: Change Delta + topology + source-of-truth + Planning Recheck
  - for_product_owner: Summary + Requirements + Outstanding Questions + Scope Boundaries
  - for_project_manager: Feature Slices + priority distribution + dependency + risk
```

这不改变 PRD artifact 本身，而是在 closeout 时提供不同视角的摘要切片。

---

## 三、架构师视角：技术架构优化

### 3.1 确定性检查器扩展

**问题**：check-prd-artifact.js 当前检测 31 种 blocking reason（以 reason-codes.js 的 `BLOCKING_REASON_CODES` 为准；checker 另会 emit 若干 advisory code，不计入 blocking），但缺少以下高价值确定性检查：

1. **需求唯一性检查**：检测 Requirements 表中语义高度重叠的行（基于关键词重叠率）
2. **Acceptance-Requirement 双向追溯完整性**：当前只检查 R → AE 方向，缺少 AE 反向校验（是否有 AE 没有对应 R）
3. **Evidence freshness decay**：当 source_inputs 中的文件有 git 修改时间远晚于 PRD created 时间，报告 evidence_possibly_stale
4. **Cross-reference integrity**：OQ write_target 引用的 section 是否实际存在于 PRD 中

**优化方案**：

```javascript
// 新增检查项建议（伪代码）
const EXTENDED_CHECKS = [
  'duplicate_requirement_candidate',      // R 表关键词重叠 > 60%
  'orphan_acceptance_example',           // AE 未被任何 R 引用
  'evidence_freshness_advisory',         // source_inputs 修改时间 > PRD created + 30d
  'write_target_section_missing',        // OQ.write_target 指向不存在的 section
  'scope_boundary_contradiction',        // in_scope 与 out_of_scope 存在矛盾项
];
```

注意：这些扩展保持 advisory 性质，不进入 BLOCKING_REASON_CODES，避免过度收紧确定性关卡。

### 3.2 Decision Card 状态机形式化

**问题**：Decision Card 当前是「run-local scratch」，各字段间的合法状态组合没有显式约束。导致 LLM 可能产出自相矛盾的 card（如 `write_mode=final-prd` + `can_enter_spec_plan=no`）。

**优化方案**：

定义合法状态组合表，作为 LLM 的决策约束（不实现为脚本 gate，但可被 checker advisory 检测）：

```text
## Decision Card 合法状态组合

| write_mode | can_enter_spec_plan | clarification_evidence | 合法条件 |
| --- | --- | --- | --- |
| ask-owner-first | no | - | grill 未完成 |
| checkpoint-prd | no | asked-owner / headless-degraded-logged | 保存进度 |
| final-prd | yes | asked-owner / source-proven-no-ask | 所有 branch closed |
| route-out | no | - | 不产出 PRD |

不合法组合（checker advisory）：
- final-prd + can_enter_spec_plan=no → 矛盾
- checkpoint-prd + can_enter_spec_plan=yes → 矛盾
- final-prd + clarification_evidence=skipped → 矛盾
- ask-owner-first + OQ 全 closed → 应升级 write_mode
```

### 3.3 Grill 深度自适应机制

> **修正说明（doc-review）**：本节已被 §7.2 修正取代——§7.2 确立「grill 深度恒定、relentless by default、不引入 soft-cap/skip，只做优先级排序」。以下「深度自适应削减」方向不再采用；保留本节仅作演进记录，实施时以 §7.2 为准。

**问题**：当前 grill 只有「relentless by default」一种模式，缺乏基于输入特征的自适应深度控制。导致：
- 简单 extend 类需求也被深度 grill，浪费 owner 时间
- 复杂 replace/migrate 类需求的 grill 深度可能不够

**优化方案**：

引入 `clarification_budget` 的确定性驱动因素：

```text
## Grill 深度自适应矩阵

| 输入特征 | 建议 budget | 理由 |
| --- | --- | --- |
| topology=add + evidence_depth=confirmed-source + 单一 surface | compact | source 已覆盖，owner 确认即可 |
| topology=extend + 2-3 个 OQ | standard | 常规增量 |
| topology=replace/remove/migrate | deep | 退出策略、兼容性、回滚必须穷举 |
| multi-source input + contradiction | deep | 矛盾需逐一裁决 |
| topology=contract-change + downstream consumers > 2 | deep | 消费者影响必须穷举 |
| clarification_risk_tier=regulated | deep | 合规/资金/安全无法跳过 |
```

这不改变「relentless by default」原则，而是给 LLM 一个选择「何时建议 owner soft-cap」的信号框架。

### 3.4 跨 PRD 知识复用架构

**问题**：当前 domain-glossary 是唯一的跨 PRD 知识复用机制。但实际高频复用场景还包括：
- 相同系统不同增量的 current-state snapshot 复用
- 相同 surface 的标准验收模式复用
- 常见行业/合规要求的 pattern 复用

**优化方案**：

1. **定义 PRD Knowledge Reuse Taxonomy**：

```text
## 知识复用层次

L1 - Domain Glossary（已有）
  → 权威术语表为 repo 根 CONCEPTS.md（全仓多数 skill 的既定权威；见 §8.8 修正）
  → spec-prd 当前实际引用 docs/contracts/domain-glossary.md，二者关系待 §8.8 统一
  → 跨 PRD 术语统一

L4 - Industry Overlay Knowledge（已有雏形）
  → 行业关注点附录（证券行业需求关注点与参考附录）
  → 建议扩展为可配置的 overlay pack
```

> **doc-review 移除 L2/L3**：System State Cache（L2）与 Acceptance Pattern Library（L3）已从本方案删除——L2 是带失效逻辑的跨运行持久化缓存，直接违反本文档 Non-Goal #5「不引入 persistent progress schema」，且 L2/L3 均无当前可指名消费者。若未来出现真实跨 PRD 复用需求，另立独立 opt-in 提案，并说明如何从 aspirational 变 confirmed。

### 3.5 输入预处理管道标准化

**问题**：当前 Large-Input Checkpoint 定义了 Map/Shuffle/Reduce 纪律，但缺少对多模态输入（截图、PDF、会议纪要、设计稿）的标准化预处理管道。

**优化方案**：

```text
## 输入预处理管道

input_preprocessor:
  image/screenshot:
    → OCR / 视觉描述提取
    → 标记为 source-candidate（non-text advisory）
    → 检测 design-source trigger
    
  pdf/doc:
    → 文本提取 + 结构保留
    → 章节识别 + 分块
    → 标记原始 page 引用

  meeting_notes/chat_log:
    → 决策提取（ratified vs discussion 分离）
    → 参与者-观点映射
    → 时序保留
    
  figma/design_url:
    → 触发 design-source-evidence.md
    → 可达性检测
    → 节点级 WHAT 提取（advisory）

  existing_prd (resume-prd):
    → frontmatter 解析
    → OQ/trace 状态恢复
    → evidence freshness 检查
```

### 3.6 Eval 体系增强

**问题**：当前 evals/examples.json 有 12 个 quality buckets 和 14 个 sentinel cases，但：
- 缺少正向高质量输出的 golden sample
- 缺少端到端执行时间/token 效率基线
- 缺少多轮交互场景的 eval fixture

**优化方案**：

1. **补充 Golden Output Fixtures**：为每种 output_shape 提供一个标杆输出样例，作为 fresh-source eval 的比对参考（不是 baseline scoring，而是 reference-guided 判断）。

2. **增加 Interaction Quality Eval Dimensions**：

```json
{
  "interaction_quality_dimensions": [
    "question_relevance_to_write_target",
    "recommended_answer_defensibility",
    "source_first_before_owner_ask",
    "progressive_closure_rate",
    "redundant_question_avoidance",
    "owner_cognitive_load_per_question"
  ]
}
```

3. **Multi-Turn Eval Fixtures**：设计 3-5 个多轮交互 fixture（模拟 owner 回答），验证 grill 收敛性和闭合完整性。

---

## 四、优先级排序（影响 × 可行性）

| 优先级 | 优化项 | 影响面 | 实施复杂度 | 预期收益 |
| --- | --- | --- | --- | --- |
| P0→复核 | 2.1 Phase Checkpoint Protocol（与现状高度重叠，见 §2.1 修正） | 执行精度 | 低（SKILL.md 修改） | 现状已有 Failure-Mode Blacklist / 🔴 gate / prd-prewrite-guard；应先验证现有 gate 有效性再定增量 |
| P0 | 3.2 Decision Card 合法状态组合 | 内部一致性 | 低（reference 补充） | 减少矛盾状态输出 |
| P0 | 2.2 T0 快速诊断输出 | 用户体验 | 中（SKILL.md + template） | 首轮交互即见价值 |
| P1 | 2.3 Quality Radar 可视化 | PM 满意度 | 中（template 扩展） | 质量诊断可读性提升 |
| P1 | 7.2 Grill Priority Signal（问题优先级排序） | 执行效率 | 中（reference 修改） | 关键问题优先闭合，下游质量提升 |
| P1 | 3.1 确定性检查器扩展 | 质量下限 | 中（脚本开发） | 新增 5 项 advisory 检查 |
| P2 | 2.4 Handoff Summary Views | 协作效率 | 低（template 扩展） | 多角色消费 PRD 更高效 |
| P2 | 3.4 跨 PRD 知识复用 | 长期效率 | 高（需新 artifact） | 减少重复 source-reading |
| P2 | 3.5 输入预处理管道 | 多模态覆盖 | 高（需新脚本） | 提升多源输入处理一致性 |
| P2 | 3.6 Eval 体系增强 | 质量保障 | 中（fixture 开发） | 多轮交互质量可衡量 |

---

## 五、不做清单（Non-Goals）

以下方向经审慎评估后明确排除：

1. **不将 grill 流程图化为硬状态机** — 违背 `gate the exits, not the thinking` 原则
2. **不引入数字化质量评分** — PRD 质量是语义判断，数字打分会制造虚假精度
3. **不创建第二个 PRD artifact topology** — 保持 `docs/brainstorms/*-requirements.md → plan → tasks` 单链
4. **不将 checker advisory findings 升级为 BLOCKING** — 保持确定性下限轻量
5. **不引入 persistent progress schema** — 违背 run-local scratch 原则
6. **不自动化 output quality scorecard** — 与 `scripts enforce facts; LLM decides semantic adequacy` 冲突
7. **不创建中心化流程引擎** — spec-first 是 harness，不是 workflow engine

---

## 六、实施路径建议

### Phase 0：基线测量（前置，doc-review 新增）

在推进任何结构性增补前，先在若干真实 spec-prd 运行样本上量化三个 observed failure mode（direct-write-after-read、checkpoint-as-escape、closure-disposition self-asserted）的实测发生率与根因，并确立「direct-write-after-read 失败率」等收益指标的基线。只对数据支持的失败模式推进对应的结构性增补，其余降级为「待数据决定」的观察项。此步用于在铺开全量目录（§四 / §九）前先证伪/收敛，避免在假设需求上过早锁定维护面。

### Phase 1：快速见效（1-2 天）

- 在 SKILL.md 中补充 Phase Checkpoint Protocol 段落
- 在 prd-output-template.md 中补充 Decision Card 合法状态组合表
- 在 SKILL.md Phase 1 出口处增加 T0 快速诊断输出规范

### Phase 2：质量提升（3-5 天）

- 在 prd-readiness-lens.md 中补充 Quality Radar 诊断格式
- 在 domain-language-and-decision-ledger.md 中补充 Grill 深度自适应矩阵
- 开发 check-prd-artifact.js 扩展检查项（advisory）
- 补充 evals golden output fixtures

### Phase 3：架构演进（需评审决策）

- 设计 L2 System State Cache 机制
- 设计输入预处理管道
- 设计 Multi-Turn Eval Fixtures
- 设计 Handoff Summary View 能力

---

## 七、五大结构性缺口逐项深度优化方案

以下对前文识别的五个 PM→开发交付缺口逐一展开，给出具体的实施设计。

### 7.1 缺口 1：「开发可消费性」作为一等质量维度

#### 问题本质

当前 Readiness Lens 的 6 个 Base Gate 维度是：Clarity、Evidence provenance、Traceability、Testability、Boundary integrity、Planning-invention readiness。这些维度确保 PRD 对 **spec-plan**（规划流程）是充分的，但没有确保对 **开发人员**（最终消费者）是高效可消费的。

一份通过全部 31 项 blocking 检查的 PRD，开发拿到后仍可能面临：
- 不知道从哪里开始看（缺乏优先级引导的阅读路径）
- Change Delta 用产品语言描述，无法映射到代码变更范围
- Acceptance Examples 用业务场景语言，缺乏转化为测试 assertion 的技术前提

#### 深度优化方案

**方案 A：在 prd-output-template.md 新增 `## Developer Quick-Start` section**

位置：PRD artifact 的 Summary 之后、Change Delta 之前（仅 normal-prd 和 topology-heavy-prd 触发）。

```markdown
<!-- prd:section=developer_quick_start -->
## Developer Quick-Start

### 变更概览（一句话）
[actor] 在 [surface] 上的 [具体行为] 从 [当前] 变为 [目标]

### 影响范围估计
| 影响区域 | 预期变更类型 | 关键模块/路径提示 |
| --- | --- | --- |
| [area] | extend / replace / add | [source-candidate 路径或模块名] |

### 开发关键路径（按实现优先级）
1. [最核心的行为变更] → 对应 R-01
2. [依赖的状态/权限变更] → 对应 R-02
3. [边界/异常处理] → 对应 R-03

### 验收快速参考
| 场景 | 预期结果 | 对应 AE |
| --- | --- | --- |
| [happy path] | [observable] | AE-01 |
| [关键异常] | [observable] | AE-03 |

### 必须保持不变的行为
- [critical preserved behavior 1]
- [critical preserved behavior 2]

### 开发前需确认的未决项
- [OQ-xx]: [一句话影响描述]
```

**触发规则**：
- normal-prd / topology-heavy-prd → 必须包含
- compact-prd → 可选（当 Change Delta > 3 行时包含）
- bypass → 不包含

**约束**：
- 此 section 是 LLM 从已有 PRD 内容提炼的 **视图**，不引入新信息
- 「影响范围估计」中的路径只使用 `source-candidate` 标签，不伪装为 confirmed
- 不进入 BLOCKING_REASON_CODES，不由 checker 强制校验
- 属于 conditional section，位于 `prd-output-template.md` 的 Conditional Sections 列表中

**方案 B：在 Readiness Lens 增加「Developer Consumability」检查项**

在 `prd-readiness-lens.md` 的 Core Pack 中新增一项 LLM-owned 检查：

```text
- `developer consumability` - 开发能否在 2 分钟内从 PRD 中识别 top-3 实现任务、
  Change Delta 能否映射到可识别的代码区域或模块、核心 AE 是否有足够的技术前提
  让开发直接写 test assertion（或明确标注了需要 plan 阶段补充技术细节）。
  这是 advisory 检查，不阻断 ready-for-planning，但如果开发消费性明显不足，
  建议在 closeout 中标注 `developer_quick_start_recommended: true`。
```

---

### 7.2 缺口 2：Grill 效率与问题排序优化（非深度削减）

#### 问题重新定位

~~原始判断~~：认为 relentless grill 可能「过度追问」低风险 gap，建议按返工成本减少 grill 深度。

**修正后判断**：在 AI coding 管道中，relentless grill 不是「默认选项」——**它是唯一正确选择**。原因：

| AI Coding 管道特征 | 对 grill 深度的影响 |
| --- | --- |
| 提问边际成本接近零（同会话交互） | 没有「省 owner 时间」的经济理由减少问题 |
| 下游 LLM 容忍模糊性极差 | 一个未解 gap 到 spec-plan → LLM 会「发明 WHAT」 |
| gap 传播是指数级（plan→tasks→code→review） | 前置 1 个问题 = 避免下游 N 步重跑 |
| 返工 = 可能需要重跑整条 workflow 链路 | 任何 gap 的实际返工成本都远超传统估算 |

因此：**spec-prd 的 relentless grill 是对 AI coding pipeline 的正确工程投资，不应削弱。**

#### 真正的问题在哪

relentless 是对的，但当前实现有一个可优化点：**问题排序缺乏优先级引导**。

现象：
- grill 可能先追问一个 UI 文案细节，而架构选型 gap 仍未闭合
- 所有 gap 被平权 grill，而非按「下游 pipeline 传播风险」排序
- owner 感知到的不是「问题太多」，而是「关键问题埋在次要问题里」

#### 深度优化方案

**方案：Grill Priority Signal（问题优先级排序，不减少总量）**

在 `domain-language-and-decision-ledger.md` 的 Load-Bearing Gap Triage 段落之后新增：

```text
### Grill Priority Signal（问题优先级排序）

原则：前置澄清尽最大努力——不减少 grill 深度，而是优化 grill 顺序。
在 AI coding pipeline 中，每个未解 gap 的下游传播成本远超传统估算，
因此所有 gap 都应追问到 legal stop point。但追问顺序应按 pipeline 传播风险排序。

pipeline_propagation_risk（追问优先级排序依据）:

  P0 - Architecture-level（下游必然级联失败）:
    - 数据 source-of-truth 选择
    - 状态管理归属（前端/后端/共享）
    - 权限模型/鉴权方式
    - 跨 surface 契约/API 边界
    - 不可逆决策（迁移方向、存储选型、协议选择）
    → 这些 gap 必须最先 grill，因为 spec-plan 无法绕过

  P1 - Behavior-level（下游可能猜错）:
    - 状态流转/边界条件
    - 异常处理策略
    - 并发/幂等/重试语义
    - 数据格式/验证规则
    → 不解决则 spec-work 会做隐式假设

  P2 - Experience-level（下游可做局部调整）:
    - UI 文案/提示语
    - 次要空状态展示
    - 非核心日志格式
    - 低频异常视觉表现
    → 仍然追问（relentless），但排在 P0/P1 之后

使用方式：
- 当存在多个 open gap 时，按 P0 → P1 → P2 顺序追问
- 同优先级内按 affected_prd_section_count 排序（影响多 section 的优先）
- 不跳过任何优先级——P2 gap 也必须达到 legal stop point
- 不引入 soft-cap 或 skip——所有 gap 都必须被解决

约束：
- 这是问题排序优化，不是 grill 深度削减
- 不改变 relentless by default 原则
- 不引入为 checker 或 BLOCKING_REASON_CODES
- owner 仍可随时 hard-cap（owner-capped 是合法停止点之一）
```

**配套：优化 grill 效率的辅助机制**

```text
### Grill Efficiency Enhancements（不减少深度的效率提升）

1. 合并关联问题：
   当多个 gap 指向同一决策点时，合并为一个复合问题而非逐一追问。
   示例：
   - 低效：先问「权限模型是 RBAC 还是 ABAC？」→ 再问「权限数据存在哪？」
   - 高效：「权限模型选择 RBAC 还是 ABAC？以及权限数据的存储位置？
     这两个问题相互关联，一起回答能帮我更准确地理解系统设计。」

2. 提供 recommended_answer 降低 owner 认知负荷：
   每个问题都附带 source-backed 推荐答案，让 owner 可以快速确认/否定。
   owner 确认 = closed；owner 否定 = 追问 follow-up。

3. 进度可见性：
   当 gap 列表较长（> 5 个 open gaps）时，在问题前标注进度：
   "[问题 3/8, P1 级别] ..."
   让 owner 知道还有多少问题需要澄清。

4. 避免重复追问：
   如果 owner 在回答问题 A 时已附带回答了问题 B 的信息，
   将 B 标记为 closure_state=answered-by-implication，不再追问。
```

---

### 7.3 缺口 3：支持协作式 PM-开发交接

#### 问题本质

当前 readiness_outcome 只有 5 种：`ready-for-planning` | `revise-prd` | `ask-owner` | `doc-review` | `route-out`。

但现实中 PM→开发交接有一个高频中间态：**PRD 的产品 WHAT 已经 80% 清晰，但剩余 20% 需要开发输入才能决定**（技术可行性影响产品方案选择）。此时：
- 标记 `ready-for-planning` 太早——plan 会发现 gap
- 标记 `revise-prd` 又太保守——PM 无法独立回答技术问题
- 标记 `ask-owner` 不准确——owner 就是 PM，但 PM 说「我需要开发看看才能决定」

#### 深度优化方案

**方案：不新增 readiness_outcome，而是拆清 tech-input 的 readiness 边界**

核心洞察：问题不是缺少一个新状态，而是当前交接语义把两类不同风险混在一起：

- `non_what_tech_recheck`：开发需要复核技术事实或 HOW 可行性，但不会改变 Requirements、AE、Scope、source-of-truth、fallback、analytics acceptance 等产品 WHAT。
- `what_affecting_tech_decision`：技术可行性会反向改变产品方案、验收、范围、默认行为或 source-of-truth，这类 gap 仍是 PRD-owned WHAT gap。

只有前者可以随 `ready-for-planning` 交接；后者必须保持 `write_mode=checkpoint-prd` 或 `readiness_outcome=ask-owner/revise-prd`，除非已有 owner-capped fallback 且明确说明 planning 不会 invent WHAT。

**在 prd-readiness-lens.md 的 Outcomes 段落增加 Handoff Guidance Protocol**：

```text
### Handoff Guidance Protocol

当 readiness_outcome = ready-for-planning 且存在需要开发复核的非 WHAT 项时，closeout 必须包含 handoff_guidance：

#### 交接包结构

handoff_guidance:
  settled_what:          # 开发可以直接依赖的产品决策
    - [R-xx: 一句话总结]
  
  non_what_tech_recheck: # 可随 ready-for-planning 交接的技术复核项
    - question: [技术可行性问题]
      why_non_what: [为什么不会改变 Requirements / AE / Scope / source-of-truth]
      fallback_if_infeasible: [不可行时的 HOW 调整或需要返回 PRD 的条件]
      affects: [R-xx / AE-xx]

  blocked_what_affecting_tech_decisions: # 不可随 ready 交接；必须 checkpoint / ask-owner / revise-prd
    - question: [会改变产品方案或验收的问题]
      why_blocks_ready: [会改变哪个 WHAT / acceptance / scope / authority]
      next_owner_question: [下一步需要问 owner 或开发+owner 共同裁决的问题]

  planning_recheck:      # 开发需要重新确认的 source 层面事实
    - [Planning Recheck 中的 advisory 项]

  dev_freedom_zone:      # 开发可以自主决定 HOW 的明确范围
    - [scope boundary 内的技术实现自由度]

#### 触发条件

当 PRD 中存在以下情况之一时，必须先分类为 `non_what_tech_recheck` 或 `what_affecting_tech_decision`：
- Outstanding Questions 中有标注 `resolution_requires: tech-input` 的条目
- Planning Recheck 中有 `blocks planning? = conditional on tech feasibility` 的条目
- Evidence And Assumptions 中有 `tag: assumption` 且 `note` 提及技术可行性的条目

#### 与现有流程的关系

- 这不是新的 readiness_outcome，而是 ready 边界的分类纪律
- `non_what_tech_recheck` 不阻断 ready-for-planning，因为产品 WHAT 已定，只是 HOW / source-refresh 需要复核
- `what_affecting_tech_decision` 阻断 ready-for-planning；合法输出是 `checkpoint-prd`、`ask-owner` 或 `revise-prd`
- 如果 `non_what_tech_recheck` 回答为「不可行」且会改变 WHAT，spec-plan 必须返回 spec-prd refine，而不是自行改写需求
- spec-plan 消费此交接包时，优先处理 `non_what_tech_recheck`；看到 `blocked_what_affecting_tech_decisions` 时不得继续当作 ready PRD 消费
```

**配套：在 Outstanding Questions 表增加可选列 `resolution_requires`**

```text
resolution_requires 合法值：
- owner-decision（默认）：需要 PM/产品 owner 决策
- tech-input：需要开发/架构输入；必须进一步分类为 non-WHAT recheck 或 WHAT-affecting decision
- source-recheck：需要重新读取 source 确认
- external-input：需要外部方（设计/合规/法务）输入
```

这个列是 optional 的，不进入 checker 强制检查，但当 `resolution_requires=tech-input` 的 OQ 存在时，closeout 必须反映其分类结果。若分类为 WHAT-affecting，PRD 不得返回 `ready-for-planning`。

---

### 7.4 缺口 4：建立下游→PRD 的反馈闭环

#### 问题本质

当前 spec-first workflow 链路是单向的：
```
PRD → Plan → Tasks → Code → Review → Knowledge
```

没有结构化的反向路径让 plan/work/review 发现的 PRD gap 回溯到 PRD 修订。实际发生的情况是：
- spec-plan 发现 PRD 模糊 → 在 plan 中自行假设（发明 WHAT）
- spec-work 发现 AE 不可实现 → 修改实现偏离 PRD
- spec-code-review 发现需求遗漏 → 在 review 中补充但不回写 PRD

这些都是 spec-prd 极力避免的「planning invents WHAT」问题，但发生在链路下游而非 PRD 阶段。

#### 深度优化方案

**方案：定义 `PRD Revision Signal` 协议，供下游 workflow 消费**

> **修正说明（doc-review，治理红线）**：本协议是**跨 skill contract**——它依赖 spec-plan / spec-work / spec-code-review 主动产出并消费该 signal，但方案把它当作 spec-prd 本地增补处理。若下游三个 skill 的 SKILL.md 不同步改动，此协议即为 AGENTS.md 所述"机制就位但无兑现路径的 aspirational 能力"（无可指名消费者）。实施前必须二选一：(a) 拿到下游 buy-in 并同步修改它们的 source；(b) 显式标注为 aspirational 并写明从 aspirational 变 confirmed 的激活条件。§8.11 已与本节合并为同一入站方向，同此约束。

这不是一个新的 artifact 或中心化流程，而是一个轻量约定，让下游 workflow 在发现 PRD gap 时有标准化的信号格式：

```text
## PRD Revision Signal Protocol

### 信号格式

当下游 workflow（spec-plan / spec-work / spec-code-review）发现消费的 PRD
存在需要产品决策的 gap 时，输出 prd_revision_signal：

prd_revision_signal:
  source_workflow: spec-plan | spec-work | spec-code-review
  prd_artifact: docs/brainstorms/YYYY-MM-DD-NNN-slug-requirements.md
  signal_type: what_invention_needed | ae_untestable | scope_gap | contradiction_found
  description: [一句话描述发现的问题]
  evidence: [具体证据：代码路径 / 测试失败 / 实现矛盾]
  affected_prd_section: [Requirements | AE | Scope | Evidence]
  affected_requirement: [R-xx]
  suggested_action: ask-owner | revise-prd | add-acceptance-example | clarify-scope
  severity: blocking (开发无法继续) | degraded (可带假设继续但有风险)

### 消费方式

1. spec-plan 遇到 WHAT invention：
   - severity=blocking → 暂停 plan，输出 signal，触发 spec-prd refine
   - severity=degraded → 记录 assumption 继续 plan，signal 进入 plan 的 risks

2. spec-work 遇到 AE 不可实现：
   - 输出 signal，标注 `ae_untestable`
   - 在 code 中添加 TODO 标记对应 signal
   - 不自行修改需求

3. spec-code-review 发现需求遗漏：
   - 输出 signal，标注 `scope_gap`
   - review 结论中标注「需要 PRD 补充」
   - 不在 review 中自行补充产品需求

### 回溯触发

当 prd_revision_signal 累积时：
- 1 个 blocking signal → 立即触发 spec-prd refine（resume-prd 模式）
- 3+ 个 degraded signals 指向同一 PRD → 建议触发 spec-prd validate

### 约束

- 这是跨 workflow 约定，不是硬 gate（下游 workflow 可以选择不发 signal）
- signal 不修改 PRD artifact（只有 spec-prd 有权修改）
- signal 的存储和传递依赖宿主能力（Claude session / conversation context）
- 当宿主缺少持久化能力时，降级为在 plan/work/review 输出中显式声明
```

**为什么不用硬 gate**：
- spec-first 原则是 `gate the exits, not the thinking`
- 下游 workflow 不应被 PRD gap 完全阻断（degraded 模式仍可推进）
- 强制阻断会导致简单场景也无法推进（过度工程化）

---

### 7.5 缺口 5：输出叙事优化——按开发消费顺序组织

#### 问题本质

当前 PRD 模板的 section 顺序是**产出逻辑顺序**（先概览、再变更、再需求、再验收），不是**消费逻辑顺序**。

开发拿到 PRD 后的典型阅读行为：
1. 先看「什么在变」和「为什么」（30 秒定位）
2. 再看「影响哪些代码」和「核心需求 top 3」（2 分钟形成工作图景）
3. 然后看详细需求 + AE（精读实施细节）
4. 最后看边界和未决项（防御性阅读）

但 PRD 模板的 Summary → Change Delta → Requirements → AE → Scope → Evidence 顺序迫使开发在第 1 步和第 2 步之间来回跳转。

#### 深度优化方案

**方案 A（推荐）：不改变核心 section 顺序，新增 Developer Quick-Start 聚合视图**

这就是 7.1 中描述的 `## Developer Quick-Start` section。核心设计原则：

1. **不重复，只引用**：Quick-Start 中的每个条目都指向 PRD 内部的具体 R/AE/OQ 编号
2. **不创造新信息**：全部内容从已有 section 提炼，LLM 在 Phase 3 写入 PRD 时同步生成
3. **不影响 checker**：此 section 不进入 machine_section_identity，不参与 trace gap 计算
4. **开发可跳过**：如果开发更习惯按原顺序阅读，可以忽略此 section

**方案 B（互补）：在 closeout 输出中增加「实现建议阅读路径」**

在 Phase 4 closeout summary 中增加一段：

```text
### 建议阅读路径

如果你是即将实施此需求的开发：
1. 先读 Developer Quick-Start（2 分钟建立全局认知）
2. 再读 Change Delta 表格（确认影响范围）
3. 精读 Requirements P0 部分 + 对应 AE（理解核心实现）
4. 扫读 Scope Boundaries + Outstanding Questions（防御性检查）
5. 如果涉及你负责的模块，读 Planning Recheck 中的 source-recheck 项
```

**方案 C（长期演进）：支持 PRD 的多视图渲染**

当宿主支持结构化文档渲染时（如 Markdown 折叠、标签页），同一份 PRD artifact 可以支持：
- **产品视图**：按现有模板顺序
- **开发视图**：按消费优先级重排（Quick-Start → Change Delta → P0 Requirements + AE → Scope → OQ）
- **测试视图**：AE 优先 + Scope Boundaries + 异常路径

这是纯展示层优化，不改变 PRD artifact 结构。当前宿主（Claude/Codex/Qoder）均为纯 Markdown，所以 Phase 1 只做方案 A + B。

---

### 7.6 五大缺口优化总结

| 缺口 | 核心优化 | 实施位置 | 不做 |
| --- | --- | --- | --- |
| 1. 开发可消费性 | Developer Quick-Start section + Readiness 检查 | prd-output-template.md + prd-readiness-lens.md | 不改核心 section 顺序 |
| 2. Grill 优先级排序 | Grill Priority Signal + 效率增强 | domain-language-and-decision-ledger.md | 不削弱 relentless，不引入 soft-cap |
| 3. 协作式交接 | Handoff Guidance Protocol + resolution_requires 列 | prd-readiness-lens.md + prd-output-template.md | 不新增 readiness_outcome |
| 4. 反馈闭环 | PRD Revision Signal Protocol | 跨 workflow 约定文档 | 不硬 gate 下游 workflow |
| 5. 叙事优化 | Developer Quick-Start + 阅读路径建议 | prd-output-template.md + closeout | 不创建第二个 artifact topology |

所有优化遵循 spec-first 核心原则：
- **Light contract**：新增内容是 advisory/conditional，不膨胀 BLOCKING_REASON_CODES
- **Explicit boundaries**：每项优化明确说明「不做什么」
- **Scripts enforce facts; LLM decides adequacy**：不让脚本做开发可消费性的语义判断
- **Gate the exits, not the thinking**：不阻断下游思考，只丰富交接信息

---

## 八、grill-with-docs 集成深度分析与执行流程节点优化

### 8.1 grill-with-docs 上游模式解剖

`grill-with-docs` 是一个 3 层组合模式，不是单一技能：

| 层 | 来源 | 核心行为 |
| --- | --- | --- |
| grilling（追问原语） | `/productivity/grilling/SKILL.md` | 无情一问一答；附推荐答案；**代码能回答的先探索代码，决不问 owner**；决策权归 owner |
| domain-modeling（领域建模） | `/engineering/domain-modeling/SKILL.md` | 5 项主动纪律：挑战术语表、锐化模糊语言、发明具体场景、与代码交叉验证、即时更新 CONTEXT.md |
| 组合（grill-with-docs） | `/engineering/grill-with-docs/SKILL.md` | 用 domain-modeling 纪律驱动 grilling 会话——每个追问都是锐化领域模型的机会 |

**关键发现**：从 `ask-matt/SKILL.md` 的 `idea → ship` 主流看，grill-with-docs 是**第 1 步**，其产出（CONTEXT.md + ADR）是跨会话的持久化知识。spec-prd 将「grill + spec 综合」压缩进一个 workflow，这是正确的，但需要确保上游模式的质量行为在执行流中**结构性可见**而非仅文本提及。

### 8.2 当前集成 vs 上游模式：三个关键差距

`grill-with-docs-integration.md`（313 行）已经捕获了上游行为契约。但 SKILL.md 的执行流并未将上游模式最有价值的三个质量行为**转化为结构性节点**：

#### 差距 A：Source Exploration 缺乏显式关卡

**上游强制行为**："If a fact can be found by exploring the codebase, look it up rather than asking me."

**当前 spec-prd**：Phase 1 提到 "Evidence Gathering (source-first)"，但没有一个显式关卡声明："所有 source 可解的 gap 已穷尽探索，才开始第一个 owner 问题。"

**后果**：LLM 可能在 source-resolvable gap 尚存时就开始追问 owner——浪费 owner 注意力，且 recommended_answer 缺少 source 证据支撑。

#### 差距 B：Scenario Invention 未成为 grill 问题的结构性质量层

> **修正说明（doc-review，已对 source 核对）**：本差距被高估。`grill-with-docs-integration.md` 第 175 行已有相当结构化的 scenario invention 纪律——枚举了 happy path / permission-role edge / state transition / exception-failure / negative acceptance / cross-context handoff 六类场景，绑定到 `Canonical: Four Legal Stop Points`，并要求每个场景"要么暴露 gap 要么确认命名 write target，否则视为 ceremony 跳过"。因此 §8.5 Per-Question Quality Layer 的场景部分**部分是重新包装已有行为**。真正成立的是差距 C（该纪律在 reference 而非 SKILL.md spine 上，spine-visibility 不足）。§8.5 应重定位为"把已有 scenario 纪律上移到 spine 显式化"，而非"新增质量层"。

**上游强制行为**（domain-modeling）："Discuss concrete scenarios — invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts."

**当前 spec-prd**：`grill-with-docs-integration.md` 已有结构化的 scenario 纪律（见上方修正说明），但它位于 reference，未在 SKILL.md 执行脊柱上显式化为**每个 grill 问题的前置质量放大器**。

**理想模式**：每个 grill 问题应是 scenario-backed 的：
1. 先发明一个边界场景探测 gap
2. 用场景锐化问题表述
3. 附 source-backed recommended_answer + 场景证据
4. 问 owner：这个场景下系统应该怎么做？

**收益**：场景驱动的追问让 owner 回答更精确——"用户在 A 场景下点取消但订单已发货时应该怎样？"远优于"取消策略是什么？"

#### 差距 C：5 项 domain-modeling 主动纪律是 side-loaded 而非 spine-integrated

5 项主动行为（challenge glossary、sharpen language、scenarios、cross-reference code、update CONTEXT.md）存在于 reference 文档中，不在执行脊柱上。仅遵循 SKILL.md Phase 2 的 LLM 不会自然产出这些行为带来的质量提升。

### 8.3 执行流程节点评估

#### 当前执行脊柱（4 Phase，~8 个主要节点）

```
Phase 0: Classify → route-out OR create/refine/validate
Phase 1: Sanitize → Evidence → Req Analysis Gate → Product Expert Lens → Pre-Write Closure → Decision Card
Phase 2: Change Delta → Topology → Requirements Grill (loop) → Domain Grill
Phase 3: output_shape → surface lens → Write PRD
Phase 4: Readiness Lens → finalize/checker → outcome
```

#### 五个结构性问题

> **修正说明（doc-review，已对 source 核对）**：问题 #2 的现状描述有误。核对 `SKILL.md` Phase 1 正文，Phase 1 内部**已包含 `Pre-PRD Clarification Loop`（一问一答 grill）**；Decision Card 与 Pre-Write Closure Gate 明写在 "Before the first durable PRD Write"，即**在 Phase 1 的 grill 之后**。grill 实际发生在 Phase 1（Pre-PRD Clarification）与 Phase 2（Domain Grill）**两处**。当前 spine（`...Requirements Grill -> Pre-Write Closure Decision -> PRD Write`）本就是"grill 先于决策"，不存在"先决策后信息"。因此问题 #2 不成立，§8.4 对应的"把 Decision Card 移到 grill 之后"很大程度**已是现状**。真正成立的是 #1（Phase 1 过载）、#3（Phase 2 命名）、#4、#5(部分，见 §8.2 修正)。

| # | 问题 | 描述 | 影响 |
| --- | --- | --- | --- |
| 1 | **Phase 1 过载** | 多个活动挤在一个 Phase：sanitize、evidence、Pre-PRD 澄清 grill、analysis gate、expert lens、decision card、closure gate | LLM 丢失跟踪；"direct-write-after-read" 反模式部分源于 Phase 1 太密集 |
| 2 | ~~**Decision Card 在 Grill 之前**~~（已证伪，见上方修正说明） | 现状 Decision Card / Pre-Write Closure 已在 Phase 1 grill 之后；grill 横跨 Phase 1/2 | 问题不成立 |
| 3 | **Phase 2 命名误导** | 叫"Change Delta & Domain Language"但含第二处 Requirements Grill 循环 | LLM 可能低估 grill 投入，高估 delta/topology |
| 4 | **Source exploration 无关卡** | 代码探索和 owner 追问之间无显式检查点 | source 可解的 gap 可能变成 owner 问题 |
| 5 | **Scenario invention spine-不可见** | 已有场景纪律在 reference 而非 SKILL.md spine 上（见 §8.2 修正） | 仅遵循 SKILL.md 的 LLM 不会自然产出 |

### 8.4 执行流程节点重构方案

> **修正说明（doc-review，已对 source 核对）**：下方"Pre-Write Closure / Decision Card 后移至 grill 之后"与"Product Expert Lens 后移"两项，很大程度**已是现状**（见 §8.3 问题 #2 修正）——当前 Phase 1 已在 grill 之后才做 Decision Card / Pre-Write Closure。因此本节应收敛为"**澄清 Phase 编号与逻辑 spine 的对应关系 + 缓解 Phase 1 过载 + Phase 2 更名 + 新增 Source Resolution Pass**"，而**不是改变控制流时序**。改变时序的净收益接近零，却要承担对 checker/finalize 的回归验证成本，性价比低。保留下文原图仅作意图参考。

**原则**：不增加 Phase 数量（认知负荷已经很高），而是**在现有 4 Phase 内重构**，使 grill-with-docs 质量行为结构性可见。

#### 重构后的执行脊柱

```
Phase 0: Classify & Route（不变）

Phase 1: Input Analysis & Source Exploration（重命名 + 精简）
  ├→ Sanitization（不变）
  ├→ Source-First Evidence Gathering（不变）
  ├→ Requirement Analysis Gate map（不变）
  └→ ★ Source Resolution Pass（新增显式节点）
      "穷尽所有 source 可解的 gap 后才进入 Phase 2。
       每个 gap 经代码探索 → 标记 source-resolved 或升级为 owner 问题。"

Phase 2: Requirements Grill & Closure（重命名——反映真实主活动）
  ├→ Product Expert Lens（从 Phase 1 移入——需要 source resolution 结果才能排序）
  ├→ Requirements Grill（relentless, priority-ordered）
  │   └→ ★ Per-question Quality Layer（新增结构性步骤）:
  │       1. 发明边界场景（probe scenario invention）
  │       2. 与代码/术语表交叉验证（cross-reference）
  │       3. 附 recommended_answer + 场景证据追问 owner
  │       4. 绑定 closure 到 write target
  │       5. 术语结晶 → 即时更新 CONTEXT.md（if triggered）
  ├→ Domain Language Closure（术语/ADR 集中收口）
  ├→ Pre-Write Closure Gate + Decision Card（从 Phase 1 移入——grill 后决策而非 grill 前）
  └→ Change Delta confirmation（轻量，从 Phase 2 开头移到结尾）

Phase 3: Draft / Refine（不变）
Phase 4: Readiness & Handoff（不变）
```

#### 关键调整说明

| 调整 | 理由 | 效果 |
| --- | --- | --- |
| Product Expert Lens → Phase 2 | 需要 source resolution 结果才能准确排序 gap 优先级 | Gap 排序质量提升 |
| Pre-Write Closure Gate → Phase 2 末尾 | write_mode 应在 grill 之后决策，而非 grill 之前 | 消除"先决策后信息"的矛盾 |
| Source Resolution Pass 显式节点 | 强制"代码能答的先答"纪律 | 减少不必要的 owner 问题 |
| Per-question Quality Layer | 使场景发明+交叉验证成为每个追问的固定动作 | 问题质量系统性提升 |
| Phase 2 重命名 | 反映执行重心是 Grill 而非 Change Delta | LLM 正确分配注意力 |

#### 重构后执行流程图

```
┌────────────────────────────────────────────────────────────────────┐
│                    Phase 0: Classify & Route                       │
├────────────────────────────────────────────────────────────────────┤
│  Input → Route out? → Classify intent → Input posture → Split?    │
│  [emit: intent, input_posture, intake_mode]                       │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│              Phase 1: Input Analysis & Source Exploration           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────┐                                              │
│  │ PRD Sanitization │ 分离 facts/goals/scope/指令                  │
│  └────────┬─────────┘                                              │
│           ▼                                                        │
│  ┌──────────────────────────────────┐                              │
│  │ Source-First Evidence Gathering  │                              │
│  │ • user-stated • repo/docs/tests  │                              │
│  │ • source-candidates • assumptions│                              │
│  └────────┬─────────────────────────┘                              │
│           ▼                                                        │
│  ┌──────────────────────────────────┐                              │
│  │ Requirement Analysis Gate (map)  │                              │
│  │ → input_inventory               │                              │
│  │ → open_decisions                 │                              │
│  │ → risk_to_prd_write_target       │                              │
│  └────────┬─────────────────────────┘                              │
│           ▼                                                        │
│  ╔══════════════════════════════════════╗                           │
│  ║ ★ Source Resolution Pass (新增)    ║                           │
│  ║ 对每个 open gap:                   ║                           │
│  ║ • 代码/文档/测试/契约能否回答？     ║                           │
│  ║ • 能 → 标记 source-resolved        ║                           │
│  ║ • 不能 → 升级为 owner_question     ║                           │
│  ║                                    ║                           │
│  ║ EXIT GATE: 所有 source-answerable   ║                           │
│  ║ gap 已穷尽，才进入 Phase 2          ║                           │
│  ╚══════════════════════════════════════╝                           │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│           Phase 2: Requirements Grill & Closure                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────┐                              │
│  │ Product Expert Lens              │                              │
│  │ (用 source resolution 结果排序)  │                              │
│  │ → P0/P1/P2 gap priority queue    │                              │
│  └────────┬─────────────────────────┘                              │
│           ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │ Requirements Grill (relentless, priority-ordered)        │      │
│  │                                                          │      │
│  │  ┌──────────────────────────────────────────────────┐    │      │
│  │  │ ★ Per-Question Quality Layer (新增)              │    │      │
│  │  │                                                  │    │      │
│  │  │  1. 发明边界场景                                 │    │      │
│  │  │     "如果用户在 X 状态下执行 Y 会怎样？"          │    │      │
│  │  │                                                  │    │      │
│  │  │  2. 与代码/术语表交叉验证                        │    │      │
│  │  │     检查场景是否与现有实现/术语矛盾              │    │      │
│  │  │                                                  │    │      │
│  │  │  3. 追问 owner                                   │    │      │
│  │  │     + scenario evidence                          │    │      │
│  │  │     + recommended_answer                         │    │      │
│  │  │     + write_target binding                       │    │      │
│  │  │                                                  │    │      │
│  │  │  4. 术语结晶 → CONTEXT.md (if triggered)         │    │      │
│  │  └──────────────────────────────────────────────────┘    │      │
│  │                                                          │      │
│  │  Owner answers → Legal stop point?                       │      │
│  │  • leaf / source-resolved / owner-capped / how-pushdown  │      │
│  │  NO → next branch (按 P0→P1→P2 顺序)                    │      │
│  │  YES → branch closed                                    │      │
│  └──────────────────────────────────────────────────────────┘      │
│           ▼                                                        │
│  ┌──────────────────────────────────┐                              │
│  │ Domain Language Closure          │                              │
│  │ 术语表/ADR 最终收口              │                              │
│  └────────┬─────────────────────────┘                              │
│           ▼                                                        │
│  ┌──────────────────────────────────┐                              │
│  │ Change Delta Confirmation        │                              │
│  │ keep/extend/replace/remove       │                              │
│  └────────┬─────────────────────────┘                              │
│           ▼                                                        │
│  ╔══════════════════════════════════╗                               │
│  ║ Pre-Write Closure Gate          ║                               │
│  ║ + Decision Card (grill 后决策)  ║                               │
│  ║ • write_mode                    ║                               │
│  ║ • highest_risk_gap              ║                               │
│  ║ • why planning won't invent WHAT║                               │
│  ╚══════════════════════════════════╝                               │
└────────────────────────────────────────────────────────────────────┘
                                │
              ┌─────────────────┼───────────────────┐
              ▼                 ▼                   ▼
     ┌────────────────┐ ┌──────────────┐ ┌──────────────┐
     │ask-owner-first │ │checkpoint-prd│ │  final-prd   │
     │(return to grill)│ │(recovery)    │ │(all closed)  │
     └────────────────┘ └──────────────┘ └──────┬───────┘
                                                ▼
┌────────────────────────────────────────────────────────────────────┐
│              Phase 3: Draft / Refine / Split                       │
├────────────────────────────────────────────────────────────────────┤
│  output_shape → surface lens + overlay → Write PRD artifact       │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│              Phase 4: Readiness & Handoff                          │
├────────────────────────────────────────────────────────────────────┤
│  Readiness Lens → finalize/checker → outcome decision             │
│  → ready-for-planning / revise-prd / ask-owner / doc-review / route-out │
└────────────────────────────────────────────────────────────────────┘
```

### 8.5 Per-Question Quality Layer 详细设计

> **修正说明（doc-review）**：Step 1 场景发明与 Step 2 交叉验证的实质纪律**已存在于** `grill-with-docs-integration.md`（见 §8.2 差距 B 修正）。本节的真实增量是"**把已有纪律从 reference 上移到 SKILL.md spine 显式化**"，而非"从无到有新增质量层"。实施时应引用现有六类场景枚举与 legal-stop-point 绑定，避免造出第二套近义纪律。

这是本次集成分析的核心产出——把 domain-modeling 的 5 项主动纪律（其中场景发明/交叉验证已在 reference 存在）在 grill 循环内**结构性显式化**为步骤：

```text
## Per-Question Quality Layer

每个 grill 问题在提出前，必须经过以下质量层：

### Step 1: Scenario Invention（场景发明）

为当前 gap 发明 1-2 个具体边界场景：
- Happy path scenario: 正常流程下的预期行为
- Edge case scenario: 探测边界/异常/并发/权限的极端情况

格式: "如果 [actor] 在 [state/condition] 下执行 [action]，系统应该 [expected behavior]？"

目的: 让 owner 回答具体场景而非抽象问题。
"取消策略是什么？" → "用户在已发货状态下点击取消，应该阻止还是允许退货流程？"

### Step 2: Cross-Reference（交叉验证）

在提问前检查：
- 场景是否与代码现有实现一致/矛盾？
- 场景中的术语是否在 CONTEXT.md/glossary 中有定义？
- 是否存在已有的 ADR 覆盖了这个决策点？

如果发现矛盾 → 在问题中显式表达：
"代码中 OrderService.cancel() 当前会检查 shipment status 并拒绝已发货订单的取消。
  但你的需求描述提到'允许任何状态的订单取消'——哪个是正确的？"

### Step 3: Ask Owner（追问 owner）

问题格式要求：
- 一次只问一个问题
- 附 scenario evidence（"基于以下场景..."）
- 附 recommended_answer（"我建议...因为代码中已实现 X"）
- 附 write_target binding（"你的回答将写入 PRD 的 [section]"）
- 附 priority signal（"[问题 3/8, P0 级别]"）

### Step 4: Terminology Crystallization（术语结晶）

如果 owner 回答中解决了一个术语歧义：
- 即时更新 CONTEXT.md（if grill-with-docs-integration triggered）
- 或记录到 PRD 的 Domain Notes / Decision Notes section

### Quality Layer 约束

- 这是 quality layer，不是 blocking gate——LLM 判断是否需要完整走完所有步骤
- 简单 gap（如确认一个 flag 的默认值）可以跳过 scenario invention
- 复杂 gap（architecture-level P0）必须完整走完全部步骤
- 不引入 checker 检查——这是 LLM-owned semantic discipline
```

### 8.6 Source Resolution Pass 详细设计

```text
## Source Resolution Pass

位置: Phase 1 末尾，作为 Phase 1 → Phase 2 的显式 EXIT GATE。

### 执行逻辑

对 Requirement Analysis Gate map 中的每个 open_decision / gap:

1. 分类：source-answerable vs owner-required
   - source-answerable: 代码、文档、测试、契约、配置、历史 PRD/plan 能回答
   - owner-required: 涉及产品选择、业务优先级、scope 取舍、设计偏好

2. 对 source-answerable gap 执行 source lookup:
   - 代码探索 (bounded file read / rg / ast-grep)
   - 文档/测试/契约检索
   - 已有 PRD/plan/decision 检索
   - 结果标记: source-resolved + evidence ref

3. 输出 Source Resolution Summary:
   - total_gaps: N
   - source_resolved: M (list with evidence refs)
   - escalated_to_owner: K (list with reason)
   - source_exploration_not_feasible: J (list with reason)

### EXIT GATE 条件

当以下条件满足时进入 Phase 2:
- 所有标记为 source-answerable 的 gap 已探索
- 无法探索的已标注原因（文件不可达/工具不可用/scope 过广）
- escalated_to_owner 列表已就绪供 Product Expert Lens 排序

### 约束

- 这是 LLM-owned discipline gate，不是脚本 gate
- 不阻断无代码库的纯文本输入（此时 source_answerable = 0）
- 不要求穷举整个代码库——bounded exploration 即可
- 时间上不应超过 evidence gathering 本身的投入
- 目的是确保 "先问代码再问人" 的纪律被显式执行
```

### 8.7 集成优化与流程节点重构总结

| 优化维度 | 具体改动 | 影响范围 | 风险 |
| --- | --- | --- | --- |
| Source Resolution Pass | Phase 1 新增显式节点 | SKILL.md Phase 1 | 低——已有 source-first 文本，只是显式化 |
| Per-Question Quality Layer | Phase 2 grill loop 新增结构步骤 | SKILL.md Phase 2 + grill-with-docs-integration.md | 中——需要 LLM 投入更多推理 |
| Product Expert Lens 后移 | 从 Phase 1 移至 Phase 2 开头 | SKILL.md Phase 1/2 重排 | 中——改变现有控制流 |
| Pre-Write Closure 后移 | 从 Phase 1 移至 Phase 2 末尾 | SKILL.md Phase 1/2 重排 | 中——Decision Card 时机变化 |
| Phase 2 重命名 | "Requirements Grill & Closure" | SKILL.md 标题 | 低——纯认知改善 |
| Change Delta 轻量化 | 从 Phase 2 开头移至末尾 | SKILL.md Phase 2 重排 | 低——不改变内容 |

**与现有 7.2 Grill Priority Signal 的关系**：
- 7.2 解决了「追问什么顺序」（P0→P1→P2 排序）
- 8.5 解决了「每个追问怎么问」（scenario + cross-reference + recommended_answer）
- 8.6 解决了「追问前做什么」（source 先行，穷尽代码能回答的）
- 三者互补，共同构成「高质量 grill workflow」的完整设计

**实施优先级**：
- **立即可做**：8.6 Source Resolution Pass + 8.8 术语表命名对齐（仅修改 reference 文字）
- **短期可做**：8.5 Per-Question Quality Layer（修改 SKILL.md Phase 2 + grill-with-docs-integration.md）
- **需评审**：Product Expert Lens 和 Pre-Write Closure Gate 位置调整（改变现有控制流，需验证对 checker/finalize 的影响）

### 8.8 术语表命名错位：CONTEXT.md vs CONCEPTS.md

> **修正说明（doc-review，已对 source 核对）**：本节原立论"项目真正的术语表是 `CONCEPTS.md`"不完整，且与 §3.4 L1 自相矛盾。核对 `skills/spec-prd/` 后，实际是**三个文件并存**：
> - `CONCEPTS.md`（repo 根）— 被 spec-plan / spec-brainstorm / spec-code-review / spec-explain / spec-pov 视为权威词汇表；
> - `docs/contracts/domain-glossary.md` — **spec-prd 当前真正引用的就是它**（`SKILL.md` Phase 2 明写 "read `docs/contracts/domain-glossary.md` when it exists"，`check-glossary-drift.js` 消费它）；
> - `CONTEXT.md` — 仅出现在 grill-with-docs 的上游 snapshot。
>
> 因此本节的改名建议须先解决两件事：(a) 与 §3.4 L1 统一"权威术语表叫什么"的口径（本方案裁定为 `CONCEPTS.md`）；(b) 显式说明 `domain-glossary.md` 与 `CONCEPTS.md` 的关系（合并 / 别名 / 迁移），而非只做 `CONTEXT.md → CONCEPTS.md` 的字面替换——否则会制造第三条术语路径。下文原方案保留，实施时以本修正为准。

#### 问题本质

spec-prd 的 grill-with-docs-integration.md 全文使用上游产物名 `CONTEXT.md`（约 25 处引用）。spec-first 全仓多数 skill 以 repo 根 `CONCEPTS.md` 为权威术语表（由 `spec-compound` 拥有创建权），而 spec-prd 自身当前实际引用的是 `docs/contracts/domain-glossary.md`。三者并存导致术语分散，下游 agent 无法找到统一词汇。

实际后果：如果在一个 spec-first 项目中运行 spec-prd 的 triggered grill 模式，grill 过程中术语结晶后会创建 `CONTEXT.md`，但项目实际的术语表是 `CONCEPTS.md`——**两个文件并行存在，术语分散，下游 agent 无法找到统一词汇**。

当前所有权分布：

```
spec-prd grill  → 写入 CONTEXT.md（上游名称）
spec-compound   → 写入 CONCEPTS.md（spec-first 名称）
spec-plan       → gap-fill CONCEPTS.md（仅已存在时）
spec-brainstorm → gap-fill CONCEPTS.md（仅已存在时）
```

#### 深度优化方案：对齐命名

**方案：将 grill-with-docs-integration.md 中的 `CONTEXT.md` 引用统一为 `CONCEPTS.md`**

核心变更：
1. `grill-with-docs-integration.md` 中所有 `CONTEXT.md` → `CONCEPTS.md`
2. `grill-with-docs-integration.md` 中所有 `CONTEXT-MAP.md` → 保留但标注为 upstream-only（spec-first 项目不使用多 context 模式）
3. `domain-language-and-decision-ledger.md` 中 `CONTEXT.md` 引用 → `CONCEPTS.md`
4. `prd-readiness-lens.md` 中 `CONTEXT.md` 引用 → `CONCEPTS.md`
5. `prd-output-template.md` 中 `CONTEXT.md` 引用 → `CONCEPTS.md`

**所有权边界调整**：

| 操作 | 当前 | 调整后 |
|------|------|--------|
| 创建 CONCEPTS.md | spec-prd 可创建（triggered mode） | spec-prd **不创建**，仅 gap-fill（与 spec-plan/brainstorm 一致） |
| 更新 CONCEPTS.md | spec-prd 可更新（triggered mode） | spec-prd 可更新已有条目（triggered mode），但创建留给 spec-compound |
| 术语决策记录 | PRD-local sections | 不变——仍然写入 PRD-local Glossary/Decision Notes |

**保留上游 snapshot 不改**：`grill-with-docs-integration.md` 中的「Embedded Upstream Source Snapshot」段落保留 `CONTEXT.md` 原文（这是上游 source snapshot，不应修改），只在「Adapted spec-prd rules」部分使用 `CONCEPTS.md`。

#### 约束

- 不改变 spec-compound 的创建权——CONCEPTS.md 的首次创建仍由 spec-compound 或 spec-compound-refresh 拥有
- spec-prd triggered grill 模式可以 **refine 已有 CONCEPTS.md 条目**（与 spec-plan/brainstorm 的 gap-fill 一致）
- 如果 CONCEPTS.md 不存在，spec-prd 术语决策只写入 PRD-local sections，不创建文件
- 上游 snapshot 保留原文，不修改

### 8.9 Grill Session Recovery Protocol

#### 问题本质

Grill 会话本质是长流程——8-15 个追问 + 源码读取 + 场景发明。AI coding 会话常因 context 溢出、宿主重启、用户中断而中断。当前 spec-prd 没有显式设计恢复协议。

spec-first 原则要求："session recovery must rely solely on durable artifacts — not transient dialogue state"。PRD artifact 自带 trace、blocking reason_codes、glossary——天然就是恢复点，但需要显式协议化。

#### 恢复协议

恢复时分 3 步检查：

1. **读 PRD artifact**：定位最后一个写入的 section，确认 `write_mode` 和 `output_shape`
2. **读 trace**：定位 blocking gaps 中 priority 最高的未闭合分支
3. **续接 grill**：从该分支继续执行 Per-Question Quality Layer（8.5）

恢复时的 Decision Card 必须标注 `session_recovered: true`，并声明：
- 上次中断点（哪个 gap、哪个 Phase）
- 已闭合 vs 未闭合 gap 清单
- 下一步动作

#### 恢复源唯一性

| 恢复源 | 可用性 | 理由 |
|--------|--------|------|
| PRD artifact（含 trace + blocking gaps + glossary） | ✅ 唯一恢复源 | durable artifact，checked-in 或 session-local |
| 对话历史 | ❌ 不可依赖 | transient state，可能不可用 |
| 内存 / cache | ❌ 不可依赖 | 宿主可能重启 |
| PRD-local Decision Notes | ✅ 辅助恢复源 | durable，但不如 trace 结构化 |

#### 约束

- 恢复后不重新执行 Phase 0（Classify）和 Phase 1 已完成部分——直接续接中断点
- 如果中断发生在 Phase 1（source resolution），恢复后重新执行 Source Resolution Pass（因为代码可能已变化）
- 如果中断发生在 Phase 2（grill），恢复后从最高优先级 blocking gap 续接
- 恢复后的第一个动作必须展示 task list + 恢复摘要

### 8.10 Context Budget Strategy

#### 问题本质

Source Resolution Pass（8.6）+ Per-Question Quality Layer（8.5）都增加了每个追问的推理成本。一个 10 问题的 grill 会话 + 源码读取 + 场景发明可能逼近 context window 上限。当前方案没有回答：**context 不够时怎么办？**

#### Context 预算估算

粗粒度估算（非精确计量）：

| 消耗项 | 估算 token | 备注 |
|---------|-----------|------|
| SKILL.md resident context | ~8K | 常驻 |
| Phase 1 source reads + analysis | ~15-30K | 取决于 codebase 规模 |
| 每个 grill 问题（含 scenario + cross-ref + recommended_answer） | ~3-5K | 8.5 Per-Question Quality Layer 后 |
| 每个源码读取（source resolution） | ~2-5K | 取决于文件大小 |
| PRD draft write | ~5-10K | 取决于 output_shape |
| Phase 4 checker + finalize | ~3-5K | 确定性脚本输出 |

总计：10 问题 grill ≈ 60-100K token（不含 SKILL.md 常驻）。

#### 降级策略

当剩余 context 不足以完成全量 grill 时，按优先级降级。Context 不足是恢复/交接问题，不是 readiness 豁免：

```
保留（不可跳过）：
  ✓ P0 架构问题（影响后续 plan/code 的 foundation）
  ✓ Source Resolution Pass（代码能答的不消耗 owner 注意力）
  ✓ Phase 4 checker + finalize（确定性验证不可省）

降级（转为 deferred）：
  → P1 行为问题 → PRD-local Outstanding Questions，标记 deferred_context_budget
  → P2 体验问题 → PRD-local Outstanding Questions，标记 deferred_context_budget
  → 低风险 gap → 压缩为 advisory note

ready 边界（不可绕过）：
  → 任何 deferred_context_budget 项只要可能改变 WHAT / acceptance / scope /
    data authority / interface availability / fallback display / analytics，
    必须设置 write_mode=checkpoint-prd、can_enter_spec-plan: no，
    readiness_outcome=ask-owner 或 revise-prd，并写明 next_owner_question
  → 只有已达到 legal stop point，或明确为 non-WHAT Planning Recheck / HOW source-refresh
    的 P1/P2 项，才能随 ready-for-planning 交接

显式声明：
  → Closeout Summary 中记录 "context_budget_limited: N questions deferred"
  → 下游 spec-plan 看到 load-bearing deferred 标记时知道当前 PRD 非 ready，不得自行补 WHAT
```

#### 与 7.2 Grill Priority Signal 的关系

- 7.2 决定「问什么顺序」（P0→P1→P2 排序）
- 8.10 决定「context 不够时如何 checkpoint / non-ready handoff」（保留 P0，defer P1/P2 但不放行 load-bearing WHAT gap）
- 两者互补：7.2 确保高优先级问题先问，8.10 确保 context 不足不会把未闭合 WHAT 推给 spec-plan

### 8.11 Inbound Revision Signal Protocol

#### 问题本质

7.4 Revision Signal 已经是**下游→PRD 的入站**信号（下游 workflow 发现 gap → 触发 spec-prd refine）。spec-first 核心链路本应是闭环：

```
Codebase → Spec → Plan → Tasks → Code → Review → Knowledge
    ↑                                                    |
    +----------------------------------------------------+
```

§7.4 已定义「下游发现 gap → 反馈 spec-prd」这一入站信号（`prd_revision_signal`）。本节（8.11）不新增反向通道，只补充其 artifact 格式细化（`prd_revision_request`）与 spec-prd 侧的处理流程；二者是同一入站方向，实施时应合并为一套协议而非两套。

#### Inbound Revision Request 格式

定义 `prd_revision_request` artifact 格式（advisory，非 blocking）：

```yaml
# prd_revision_request
source_skill: spec-plan | spec-code-review | spec-debug
prd_path: docs/brainstorms/xxx-requirements.md
gap_type: ambiguity | missing_scenario | contradiction | scope_creep | missing_constraint
evidence:
  - source: src/module/file.js:42
    description: "PRD says X but code does Y"
suggested_resolution: "advisory — clarify whether X or Y is intended"
priority: P0 | P1 | P2
```

#### 处理流程

spec-prd 收到 `prd_revision_request` 后：

1. **验证 evidence**：Read 引用的 source:line，确认 gap 真实存在
2. **局部 grill**：仅针对 revision request 的 gap 执行 Phase 2 grill（不重跑整个 PRD）
3. **更新 PRD**：将 resolved gap 写入对应 section，更新 trace
4. **通知下游**：在 Closeout Summary 标注 PRD 已按 revision request 更新，供下游 spec-plan 重新消费（§7.4 是入站信号，本身不含出站通知能力，勿引用为出站）
5. **记录**：在 Decision Notes 中记录 revision request 来源 + 解决结果

#### 与 7.4 的关系（同一入站方向）

```
7.4  : 下游(spec-plan/work/review)发现 gap → 发出 prd_revision_signal → 触发 spec-prd refine
8.11 : 同一入站方向的 artifact 格式细化(prd_revision_request)+ spec-prd 侧处理流程

结论: 7.4 与 8.11 是同一「下游→PRD」入站机制,不是「出站/入站」两套;实施时应合并为单一协议。
```

#### 约束

- Inbound revision request 是 advisory，不 blocking——spec-plan 可以继续基于现有 PRD 制定计划
- spec-prd 处理 revision request 时走 `refine` 路径，不走 `create` 路径
- 如果 revision request 的 evidence 无法验证（source 已变化），标记为 `unverifiable` 并在 Closeout Summary 中声明
- 不新增确定性脚本——revision request 的创建和处理都是 LLM 语义行为

### 8.12 Optimization-to-Source Allocation Map

#### 问题本质

当前 SKILL.md 是 294 行。spec-first 架构原则要求 SKILL.md < 500 行。如果所有优化都内联到 SKILL.md，可能逼近限制。需要显式规划 SKILL.md vs references/ 的分配。

#### 分配原则

- **脊柱节点**（改变执行流结构的）→ SKILL.md（简短 trigger，3-5 行）+ reference（详细设计）
- **行为约束**（改变 LLM 如何推理的）→ SKILL.md（1-2 行 trigger）+ reference（详细步骤）
- **降级策略**（context budget、degraded mode）→ 新建 reference 文件
- **协议定义**（revision signal、recovery protocol）→ 新建 reference 文件

#### 具体分配

| 优化项 | SKILL.md 增量 | 详细设计位置 | SKILL.md 预估行数 |
|--------|--------------|-------------|-----------------|
| Source Resolution Pass（8.6） | Phase 1 出口 trigger | grill-with-docs-integration.md | +5 行 |
| Per-Question Quality Layer（8.5） | Phase 2 grill loop trigger | grill-with-docs-integration.md | +3 行 |
| Grill Priority Signal（7.2） | Phase 2 grill 排序 trigger | 新建 references/grill-priority-signal.md | +2 行 |
| Handoff Guidance（7.3） | Phase 4 closeout trigger | 新建 references/handoff-guidance.md | +2 行 |
| Revision Signal（7.4） | Phase 4 closeout trigger | domain-language-and-decision-ledger.md | +2 行 |
| Developer Quick-Start（7.1） | 不改 SKILL.md | prd-output-template.md | +0 行 |
| 叙事优化（7.5） | 不改 SKILL.md | prd-output-template.md | +0 行 |
| 术语表命名对齐（8.8） | 不改 SKILL.md | 4 个 reference 文件 | +0 行 |
| Session Recovery（8.9） | Phase 0 trigger | 新建 references/session-recovery.md | +2 行 |
| Context Budget（8.10） | Phase 2 trigger | 新建 references/context-budget-strategy.md | +2 行 |
| Inbound Revision Signal（8.11） | Phase 4 trigger | domain-language-and-decision-ledger.md | +2 行 |
| 流程节点重排（8.4） | Phase 1/2 重排 | SKILL.md 直接修改 | +0 行（重排，不新增） |

**预估 SKILL.md 总量**：294 + 20 = **314 行**（远低于 500 行限制）。

#### 新增 reference 文件清单

| 新文件 | 内容 | 加载触发 |
|--------|------|----------|
| references/grill-priority-signal.md | P0→P1→P2 排序规则 + pipeline propagation risk | Phase 2 grill 开始时 |
| references/handoff-guidance.md | PM→开发交接 guidance + Developer Quick-Start | Phase 4 closeout 时 |
| references/session-recovery.md | 恢复协议 3 步检查 + Decision Card 恢复格式 | 会话恢复时 |
| references/context-budget-strategy.md | token 预算估算 + 降级策略 + defer 格式 | Phase 2 grill 过程中按需 |

### 8.13 Verification Plan

#### 问题本质

AGENTS.md 明确要求：

> "Don't rely on in-session typed-agent/skill invocations; use fresh-source eval."
> "fresh-source eval 的可复用 checklist 见 docs/contracts/workflows/fresh-source-eval-checklist.md"

方案提出了大量行为变更，但需要定义**如何验证这些变更确实改善了质量**。

#### 验证策略

**1. Fresh-Source Eval（必做）**

将修改后的 SKILL.md + references 注入一个全新通用 subagent 的 prompt 中，评估 3 个场景：

| 场景 | 验证什么 | 通过标准 |
|------|----------|----------|
| 有明确源码答案的 gap | 是否走了 Source Resolution Pass 而非直接问 owner | gap 标记为 source-resolved，无 owner 问题 |
| 模糊需求 | 是否先发明场景再追问 | 追问前有 scenario_invented 标记 |
| 长会话（模拟 context 不足） | 是否执行了 context budget 降级 | Closeout Summary 有 deferred_context_budget 标记 |

如果宿主缺少 dispatch primitive 或 runtime 无法调用，显式声明未执行原因，不能声称通过。

**2. Contract Test（必做）**

- `check-prd-artifact.js` 的 31 个 blocking reason_codes 覆盖不变（不新增 blocking code）
- `finalize-prd-artifact.js` 的 ready receipt 格式不变
- 现有 Jest contract tests 全部通过
- 新增 2-3 个 contract test 验证新行为（如 source-resolved gap 不出现在 owner questions 中）

**3. Eval Fixture（建议做）**

- evals/examples.json 中新增 2-3 个 fixture：
  1. brownfield 需求 + 有明确源码答案 → 验证 source resolution
  2. 模糊需求 + 多个 P0/P1 gap → 验证 grill priority signal
  3. 长需求 + context 限制 → 验证 context budget 降级

**4. 回归验证**

- 运行 `npm run test:unit` 确保现有测试不回归
- 运行 `npm run lint:skill-entrypoints` 确保入狱治理不违规
- 运行 `npm run typecheck` 确保脚本语法正确

#### 验证矩阵

| 变更类型 | Fresh-source eval | Contract test | Eval fixture | 回归测试 |
|---------|-----------------|---------------|-------------|----------|
| SKILL.md 行为变更 | ✅ | ✅ | ✅ | ✅ |
| Reference 文件修改 | ✅ | — | — | — |
| 确定性脚本修改 | — | ✅ | ✅ | ✅ |
| 新建 reference 文件 | ✅ | — | — | — |

---

## 九、总结

spec-prd 当前已是 production-grade 的 brownfield PRD 工作流，其「分析优先 + 证据驱动 + relentless grill + 确定性验证」的架构在业界同类工具中处于领先水平。

本方案从两个维度回答核心问题：

> **这个流程能否高质量地将产品需求文档转化为开发可直接使用的 PRD？**

### 维度一：交付质量与体验（第七章）

五项补强让流程从「架构优秀」走向「用户体验优秀」：

1. **开发可消费性** — Developer Quick-Start 让开发 2 分钟内建立工作图景
2. **Grill 优先级排序** — 按 pipeline 传播风险排序追问顺序，关键问题最先闭合
3. **协作式交接** — Handoff Guidance 让 PM→开发不再是「扔过墙」
4. **反馈闭环** — PRD Revision Signal 让下游发现的问题能回溯
5. **叙事优化** — 按开发消费顺序提供聚合视图

### 维度二：执行流程质量与 grill-with-docs 集成（第八章）

九项节点优化让 grill 从「仅文本要求 relentless」走向「结构性保证高质量 grill」：

1. **Source Resolution Pass** — 显式关卡确保「先问代码再问人」
2. **Per-Question Quality Layer** — 场景发明+交叉验证让每个问题都是边界探测
3. **流程节点重排** — Product Expert Lens 后移、Decision Card 后移、Phase 2 重命名
4. **术语表命名对齐** — CONTEXT.md → CONCEPTS.md，消除术语分散风险
5. **Session Recovery Protocol** — PRD artifact 为唯一恢复源，3 步检查续接中断点
6. **Context Budget Strategy** — context 不足时保留 P0、defer P1/P2，显式声明未闭合
7. **Inbound Revision Signal** — 下游 skill 可反馈 PRD gap，形成闭环
8. **Source Allocation Map** — SKILL.md 增量 ≤22 行，详细设计在 references
9. **Verification Plan** — fresh-source eval + contract test + eval fixture 三层验证

### 综合实施优先级

| 优先级 | 优化项 | 影响范围 |
| --- | --- | --- |
| 立即可做 | 7.1 Developer Quick-Start + 7.5 叙事优化 + 8.6 Source Resolution Pass + 8.8 术语表命名对齐 + 8.12 Source Allocation Map | prd-output-template.md + SKILL.md Phase 1 + 4 个 reference 文件 |
| 短期可做 | 7.2 Grill Priority Signal + 7.3 Handoff Guidance + 8.5 Per-Question Quality Layer + 8.9 Session Recovery + 8.10 Context Budget | 5 个 reference 文件 + SKILL.md Phase 2 |
| 需评审 | 7.4 Revision Signal + 8.4 流程节点重排 + 8.11 Inbound Revision Signal | 跨 workflow + 控制流重构 + 新增 artifact 格式 |
| 验证（随实施） | 8.13 Verification Plan | fresh-source eval + contract test + eval fixture |

所有优化均在 spec-first 核心约束内运作：不新增硬状态机、不增加 BLOCKING 检查、不突破 source/runtime 边界、不让脚本做语义判断。走「丰富信息 + advisory 建议」路线，而非「硬规则 + 强制中断」路线。

---

## Deferred / Open Questions

### From 2026-07-10 spec-doc-review (best-judgment)

本轮 5-persona spec-doc-review（coherence / feasibility / product-lens / scope-guardian / adversarial）后，以下判断/范围类发现经作者裁决为 **Defer**（同轮另有 6 项已直接改文档：§3.3 标注被 §7.2 取代、§四表行改指 §7.2、§3.4 删除 L2/L3、§六新增 Phase 0 基线测量、§2.2 T0 触发解耦、§8.11 出/入站矛盾修正；1 项 Skip：§7.1/7.3/7.5「开发是否 PRD 消费者」）：

1. **[P0] 认知过载：解药与病因同源（§2.1 / §8.12 / §九）** — 方案以 +17 机制 / +4 reference 治疗自列的「认知负荷过高」。开放问题：是否先落地 §六 Phase 0 基线测量，再据数据收敛到有证据的 P0 子集，而非一次性铺开？「SKILL.md 仅 +22 行」不能作为整体轻量的证明（复杂度被推入 references / 跨协议）。(product-lens + adversarial, conf 100)
2. **[P1] Revision Signal 跨-workflow 范围外溢（§7.4 / §8.11 / §五）** — 7.4+8.11 需 spec-plan/work/review 三方共同实现，无生产者/消费者，逼近「不创建中心化流程引擎」非目标。决策：将该跨-workflow 协议整体拆为独立 opt-in 提案，待至少一个下游承诺消费再设计；spec-prd 本方案只保留自身可独立落地项。(scope-guardian + product-lens + adversarial, conf 100)
3. **[P1] 「80% PRD 需多轮异步交互」无来源载重前提（§2.2）** — 该 80% 支撑 T0 / Session Recovery / Context Budget，且与 §7.2「同会话边际成本近零」矛盾。决策：需真实会话分布数据佐证；在此之前相关跨会话机制降级为 aspirational 并写明激活条件。(product-lens + adversarial, conf 100)
4. **[P2] 多项「新」机制重复既有能力（§7.2 / §8.5 / §3.5）** — Grill 排序 ↔ downstream_confirmation_risk / Load-Bearing Gap Triage；Per-Question 层 ↔ Deep Requirements Grill；输入预处理 ↔ 既有多模态 / design-source / large-input / resume。决策：若确有增量，并入既有 reference 复用既有词汇，不新建平行机制 / 文件。(scope-guardian, conf 75)
5. **[P2] Handoff Views / resolution_requires 无消费者（§2.4 / §7.3）** — 三受众 handoff_summary_views + optional 列是无当前消费者的 config / extensibility，与既有 Handoff Context Slice 重叠。决策：去掉三受众视图与 optional 列；§7.3 的 non_what vs what-affecting 边界纪律并入既有 Handoff Context Slice / Planning Recheck。(scope-guardian, conf 75)
6. **[P2] §8.4 脊柱重排高逆转成本（§8.4 / §8.7）** — 跨 Phase 移动 Product Expert Lens / Decision Card，文档自认需评审、需验证 checker/finalize 影响，支撑仅为主观「Phase 1 过载」判断。决策：保持 §8.4 为需评审；重排前先补 `decision_card_undeclared` / `preflight_sweep_closure` 聚焦 contract test 验证 checker/finalize 影响。(adversarial + feasibility, conf 75)
7. **[P2] Context Budget 阈值基于未测估算（§8.10）** — 降级阈值建立在自认「粗粒度估算」的 60–100K token 上，可能过早触发误 defer 或永不触发。决策：阈值待实测 token 消耗校准；校准前把降级策略标为 advisory。(adversarial, conf 75)
8. **[P2] 新 reference 文件归属矛盾（§7.2 / §7.3 / §7.6 ↔ §8.12）** — 7.2/7.3/7.6 说写入现有文件，§8.12 说新建独立文件并据此计「4 个新文件」。决策：与本节 #4 一并定 inline vs new-file 方向后全文对齐（倾向内联以合 Light contract），同步修正新文件计数与 SKILL.md 加载 trigger。(coherence, conf 75)
9. **[P2] CONTEXT.md→CONCEPTS.md 改名不可机械执行（§8.8）** — 「所有引用」与「保留上游 snapshot」相互矛盾，「25 处」实测 29 且多在 Embedded Upstream Source Snapshot 段，且无「Adapted spec-prd rules」段可定位边界。决策：按源码实际段边界精确重写——Snapshot 段及描述上游 artifact 的段保留原文，仅改 spec-prd 自有适配规则里的项目术语表引用；「25 处」改为按边界分列的两个计数（保留 N / 改写 M）。(feasibility, conf 75)

---

## 十、精简集成提案（可执行落地清单，2026-07-10）

> 结论先行：**本方案不整体集成进 `skills/spec-prd/`**。经与当前 `SKILL.md`（294 行）及 references 逐项核对，并受本仓治理约束限制，只集成下方「10.2 可落地子集」，其余按「10.3 不集成清单」处置。本节是把前九章收敛成的**可执行落地契约**，不改变前文分析，仅作为实施依据。

### 10.1 集成目标与非目标

**Goals**：把 3 项「确定性有价值 + 纯文档 + 折进现有 reference + 不改控制流时序 + 不跨 workflow」的增量并入 spec-prd，让 grill 排序、状态一致性、PM→开发交接边界更清晰。

**Non-Goals（硬边界）**：
- 不新建 reference 文件——会破坏 `spec-prd-contracts.test.js` 的拓扑锁（`references` 用 `toEqual([...9 个文件...])`、`sourceFiles` `toHaveLength(15)`）。§8.12 想新建 4 个文件的方向**否决**。
- 不新增 `BLOCKING_REASON_CODES`——保持确定性下限轻量（对齐 Non-Goal #4）。
- 不改 SKILL.md 控制流时序（§8.4）——doc-review 已证伪其前提，净收益≈0、回归成本高。
- 不单方落地跨-workflow 协议（§7.4 / §8.11）——无下游消费者即 aspirational 空能力。
- 不引入未测阈值机制（§8.10 context budget 阈值）。

### 10.2 可落地子集

| # | 条目 | 落点（现有文件 + 位置） | 加什么（要点） | 性质 | 验证 |
| --- | --- | --- | --- | --- | --- |
| 1 | §3.2 Decision Card 合法状态组合 | `references/prd-output-template.md`，Readiness Self-Check 段之后 | 合法/矛盾组合参考表（如 `final-prd + can_enter_spec_plan=no`、`final-prd + clarification_evidence=skipped` 为矛盾） | advisory，不进 checker | contract test 加一条 `expectContainsAll` 断言该表存在；fresh-source eval：矛盾 card 能被自查发现 |
| 2 | §7.2 Grill Priority Signal | `references/domain-language-and-decision-ledger.md`，Load-Bearing Gap Triage 段之后 | P0 架构 / P1 行为 / P2 体验的**追问排序**（按 pipeline 传播风险），复用既有 `downstream_confirmation_risk` 词汇，显式声明「只排序、不减深度、不 soft-cap、不进 BLOCKING」 | LLM-owned 排序纪律 | contract test 断言排序段存在 + `not.toContain` 削深度/ soft-cap 表述；fresh-source eval：多 gap 时先问架构级 |
| 3 | §7.3 tech-input 交接边界 | `references/prd-readiness-lens.md`，Handoff/Outcomes 段 | `non_what_tech_recheck`（可随 ready 交接）vs `what_affecting_tech_decision`（必须 checkpoint/ask-owner/revise）的分类纪律；**去掉**三受众 `handoff_summary_views` 与 optional 列 | 分类纪律，不新增 readiness_outcome | contract test 断言分类纪律串；fresh-source eval：WHAT-affecting tech gap 不放行 ready-for-planning |
| 4（待定，中风险） | §8.8 术语口径统一 | `grill-with-docs-integration.md` / `domain-language-and-decision-ledger.md` / `prd-readiness-lens.md` / `prd-output-template.md` | **先决策** `CONCEPTS.md`、`docs/contracts/domain-glossary.md`、`CONTEXT.md` 三者关系（合并/别名/迁移），再按段边界精确改写；上游 Embedded Snapshot 段保留原文，不机械 find-replace | 需求先定关系口径 | 落地前单独确认；改后 contract test + glossary-drift 脚本回归 |

§7.1 / §7.5 Developer Quick-Start 列为**可选**：有价值但增加模板篇幅，且与既有 `handoff_context_slice` 部分重叠，非首批。

### 10.3 不集成清单（理由可追溯到方案自身）

| 条目 | 不集成理由 | 依据 |
| --- | --- | --- |
| §2.1 Phase Checkpoint Protocol / §8.4 脊柱重排 | 与现状 Failure-Mode Blacklist / 🔴 gate / Canonical stop points / prd-prewrite-guard 重复；重排净收益≈0、回归成本高 | §2.1、§8.3#2、§8.4 doc-review 修正 |
| §7.4 / §8.11 PRD Revision Signal | 跨 workflow，需 spec-plan/work/review 同步改 source 才有消费者，否则 aspirational 空能力 | Deferred #2 |
| §2.2 T0 / §8.9 Session Recovery / §8.10 Context Budget | 建立在「80% PRD 需多轮异步」无来源前提上，且与「同会话边际成本近零」矛盾；阈值未测 | Deferred #3 / #7 |
| §2.4 Handoff Views / §7.3 optional 列 | 无当前消费者 | Deferred #5 |
| §3.1 checker 扩展 / §3.6 eval 增强 | 需改脚本 + eval 基线，且当前工作树 contract test 不稳定，无法验证 | 本节 10.4 |
| §3.5 输入预处理 / §8.5 场景发明「新增质量层」 | 与既有 multimodal/design-source/large-input 及 grill-with-docs 六类场景纪律重复 | Deferred #4、§8.2/§8.5 doc-review |
| §8.12 新建 4 个 reference 文件 | 破坏 contract test `references` 拓扑锁 | 本节 10.1 Non-Goals |
| §3.3 Grill 深度自适应 | 已被 §7.2 取代 | §3.3 doc-review |

### 10.4 落地前置条件（gate the exits，缺一不落地）

1. **测试可跑**：`tests/unit/spec-prd-contracts.test.js` 与 `tests/jest-setup.js` 在工作树内且 `npx jest tests/unit/spec-prd-contracts.test.js` 可执行（**当前工作树被并行任务 churn，该文件间歇性缺失，暂不满足**）。
2. **每项落地闭环**：读现有 reference 现状 → 增量式添加（不动锁定串）→ 更新/新增对应 contract test 断言 → 跑 contract test → fresh-source eval（dispatch 可用则跑，否则显式记未执行原因）。
3. **source→runtime**：source 改完跑 `spec-first init` 再生 `.claude`/`.codex`/`.agents/skills` 等 runtime mirror，验证无 source/runtime drift；不手改 mirror。
4. **文档纪律**：CHANGELOG 追加 `(user-visible)`；SKILL.md 若有增量核对仍 < 500 行；评估是否需同步 `prd-output-template.md` embedded runtime skeleton（本子集为 reference 增量，通常无需动 skeleton）。

> 实施顺序建议：等工作树稳定、contract test 可跑后，按 10.2 的 1→2→3 逐条落地并各自跑测试；§8.8（第 4 项）先定三文件关系再单独排期；跨-workflow 的 Revision Signal 另立 opt-in 提案。
