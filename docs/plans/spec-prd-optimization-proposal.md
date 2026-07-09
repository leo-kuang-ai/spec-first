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
| 单一真相源 | reason-codes.js 集中管理 38 个 blocking code 分类，checker 和 finalize 共消费 |
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

### 2.2 缺乏渐进式价值交付的节奏感

**问题**：当前 skill 假设一次完整执行直到 readiness，但实际用户场景中：
- 80% 的 PRD 需要多轮异步交互（跨天/跨会话）
- 产品经理通常期望在第一轮交互后就看到某种可用输出（即使是 draft）
- checkpoint-prd 当前被视为「恢复机制」而非「渐进交付节点」

**优化方案**：

1. **定义 Progressive Delivery Tiers**：

| Tier | 触发条件 | 输出形态 | 用户价值 |
| --- | --- | --- | --- |
| T0 快速诊断 | 首轮分析完成（Phase 1 Decision Card） | 需求理解摘要 + 风险图谱 + 下一步建议 | 让 PM 立刻知道「AI 理解了什么」 |
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

**问题**：check-prd-artifact.js 当前检测 38 种 blocking reason，但缺少以下高价值确定性检查：

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
  → docs/contracts/domain-glossary.md
  → 跨 PRD 术语统一

L2 - System State Cache（建议新增）
  → 按 module/surface 组织的 confirmed current-state claims
  → 减少重复 source-reading
  → invalidation: 当 source 文件变更时标记 stale

L3 - Acceptance Pattern Library（建议新增）
  → 按 surface lens 组织的通用验收模式（权限、空状态、异常、loading）
  → 减少每次从零构建 AE
  → 使用方式: 作为 recommended default 模板，不是 confirmed truth

L4 - Industry Overlay Knowledge（已有雏形）
  → 行业关注点附录（证券行业需求关注点与参考附录）
  → 建议扩展为可配置的 overlay pack
```

2. **L2 实现路径**：利用 PRD 的 `Evidence And Assumptions` section 中 `confirmed-source` 条目，在 finalize 成功后自动提取到 project-level cache（可选 opt-in），下一个同 surface 的 PRD 可检索复用。

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
| P0 | 2.1 Phase Checkpoint Protocol | 执行精度 | 低（SKILL.md 修改） | 减少 direct-write-after-read 失败率 50%+ |
| P0 | 3.2 Decision Card 合法状态组合 | 内部一致性 | 低（reference 补充） | 减少矛盾状态输出 |
| P0 | 2.2 T0 快速诊断输出 | 用户体验 | 中（SKILL.md + template） | 首轮交互即见价值 |
| P1 | 2.3 Quality Radar 可视化 | PM 满意度 | 中（template 扩展） | 质量诊断可读性提升 |
| P1 | 3.3 Grill 优先级排序 | 执行效率 | 中（reference 修改） | 关键问题优先闭合，下游质量提升 |
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

一份通过全部 38 项 blocking 检查的 PRD，开发拿到后仍可能面临：
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

**方案：不新增 readiness_outcome，而是丰富 `ready-for-planning` 的交接信息**

核心洞察：问题不是缺少一个新状态，而是 `ready-for-planning` 的交接包（handoff）缺少对 spec-plan 的引导信息。

**在 prd-readiness-lens.md 的 Outcomes 段落增加 Handoff Guidance Protocol**：

```text
### Handoff Guidance Protocol

当 readiness_outcome = ready-for-planning 时，closeout 必须包含 handoff_guidance：

#### 交接包结构

hardoff_guidance:
  settled_what:          # 开发可以直接依赖的产品决策
    - [R-xx: 一句话总结]
  
  needs_tech_input:      # 需要开发输入才能最终确认的产品问题
    - question: [技术可行性问题]
      why_blocked: [为什么 PM 无法独自回答]
      fallback_if_infeasible: [如果技术不可行的备选方案]
      affects: [R-xx / AE-xx]
  
  planning_recheck:      # 开发需要重新确认的 source 层面事实
    - [Planning Recheck 中的 advisory 项]
  
  dev_freedom_zone:      # 开发可以自主决定 HOW 的明确范围
    - [scope boundary 内的技术实现自由度]

#### 触发条件

当 PRD 中存在以下情况之一时，needs_tech_input 段不能为空：
- Outstanding Questions 中有标注 `resolution_requires: tech-input` 的条目
- Planning Recheck 中有 `blocks planning? = conditional on tech feasibility` 的条目
- Evidence And Assumptions 中有 `tag: assumption` 且 `note` 提及技术可行性的条目

#### 与现有流程的关系

- 这不是新的 readiness_outcome，而是 ready-for-planning 交接的信息丰富度要求
- needs_tech_input 不阻断 ready-for-planning（产品 WHAT 已定，只是 HOW 影响 WHAT 细节）
- 如果 needs_tech_input 中的问题回答为「不可行」，走 fallback_if_infeasible 路径
  （本质是 plan 过程中的 PRD revision，不是 readiness 失败）
- spec-plan 消费此交接包时，优先处理 needs_tech_input 再展开详细规划
```

**配套：在 Outstanding Questions 表增加可选列 `resolution_requires`**

```text
resolution_requires 合法值：
- owner-decision（默认）：需要 PM/产品 owner 决策
- tech-input：需要开发/架构输入才能做产品决策
- source-recheck：需要重新读取 source 确认
- external-input：需要外部方（设计/合规/法务）输入
```

这个列是 optional 的，不进入 checker 强制检查，但当 `resolution_requires=tech-input` 的 OQ 存在时，closeout 的 `needs_tech_input` 段应反映它。

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

## 八、总结

spec-prd 当前已是 production-grade 的 brownfield PRD 工作流，其「分析优先 + 证据驱动 + relentless grill + 确定性验证」的架构在业界同类工具中处于领先水平。

本方案在保持原有架构优势的基础上，从五个结构性缺口出发，回答了核心问题：

> **这个流程能否高质量地将产品需求文档转化为开发可直接使用的 PRD？**

答案：**能，但需要五项补强才能从「架构优秀」走向「用户体验优秀」：**

1. **开发可消费性** — Developer Quick-Start 让开发 2 分钟内建立工作图景
2. **Grill 优先级排序** — 按 pipeline 传播风险排序追问顺序，关键问题最先闭合
3. **协作式交接** — Handoff Guidance 让 PM→开发不再是「扔过墙」
4. **反馈闭环** — PRD Revision Signal 让下游发现的问题能回溯
5. **叙事优化** — 按开发消费顺序提供聚合视图

所有优化均在 spec-first 核心约束内运作：不新增硬状态机、不增加 BLOCKING 检查、不突破 source/runtime 边界、不让脚本做语义判断。走「丰富信息 + advisory 建议」路线，而非「硬规则 + 强制中断」路线。

实施优先级：
- **立即可做**：7.1（Developer Quick-Start）+ 7.5（叙事优化）— 仅修改 prd-output-template.md
- **短期可做**：7.2（Grill Priority Signal）+ 7.3（Handoff Guidance）— 修改 2 个 reference 文件
- **需评审**：7.4（Revision Signal）— 跨 workflow 约定，需与 spec-plan/work/review skill owner 協商
