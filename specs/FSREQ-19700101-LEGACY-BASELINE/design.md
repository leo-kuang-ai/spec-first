---
feature_id: "FSREQ-19700101-LEGACY-BASELINE"
feature_title: "存量系统可分析基线"
scenario: "brownfield-baseline"
scenario_reason: "基于现有 spec-first 仓库的存量能力盘点与风险基线"
traces:
  - "FR-BASE-001"
  - "FR-BASE-002"
  - "FR-BASE-003"
  - "FR-BASE-004"
  - "FR-BASE-005"
created_at: "2026-03-25T01:05:00.000Z"
last_updated: "2026-03-25T01:05:00.000Z"
---

# Design — FSREQ-19700101-LEGACY-BASELINE

> 存量系统可分析基线

## 1. 设计目标与边界

### 1.1 设计目标

本 Design 的目标是把当前 spec-first 仓库的事实底座，收敛成一套可持续维护的基线分析设计，使后续 `task` / `code` / `verify` 阶段都能基于同一份事实源推进。

### 1.2 设计边界

- 只设计“如何形成和维护基线”，不设计业务功能实现
- 只覆盖当前仓库可见事实、宿主安装态与仓库可见外部边界
- 不为未来可能的多租户、插件化或多实现预留投机层次
- 不做产品级回滚或向下兼容方案

### 1.3 设计原则

- 事实优先：运行态资产、代码、技能文档、宿主证据按优先级归档，不静默猜测
- 结构优先：把基线拆成可审查的分层文档与可追溯的 FR/AC
- 边界清晰：仓库内证据、宿主证据、历史材料分层管理，禁止混用
- 低投机：只保留当前交付需要的最小设计层

## 2. 高层架构

### 2.1 架构概览

```text
┌─────────────────────────────────────────────────────────────────────┐
│ FSREQ-19700101-LEGACY-BASELINE 基线分析管道                          │
├─────────────────────────────────────────────────────────────────────┤
│ 1) Evidence Intake                                                   │
│    - runtime 资产 (.spec-first/runtime/first/*)                      │
│    - 仓库代码 / 技能目录 / 现有文档                                   │
│    - 宿主安装态 / 命令注册 / 同步结果 / 健康诊断                     │
│                                                                     │
│ 2) Scope Normalizer                                                  │
│    - 归一为“已确认事实 / 待确认项 / 历史背景”                         │
│    - 记录冲突、缺口与假设边界                                         │
│                                                                     │
│ 3) Baseline Composer                                                 │
│    - 生成 prd.md / spec.md / findings.md / task_plan.md             │
│    - 维护 document-links.yaml                                         │
│                                                                     │
│ 4) Review & Consistency Gate                                         │
│    - spec-review / 格式校验 / 文档关联校验                            │
│    - 将缺口回写 findings.md                                            │
│                                                                     │
│ 5) Boundary Snapshot                                                 │
│    - 宿主安装态与外部边界正式纳入基线证据                             │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 模块边界

| 模块 | 职责 | 不负责 |
|------|------|--------|
| Evidence Intake | 收集 runtime、repo、host、外部边界证据 | 不做事实推断 |
| Scope Normalizer | 统一事实分类、标记假设与待确认项 | 不替代审查结论 |
| Baseline Composer | 产出 prd/spec/findings/task_plan/document-links | 不生成实现代码 |
| Review & Consistency Gate | 校验完整性、一致性、可测性 | 不做业务功能定义 |
| Boundary Snapshot | 记录宿主安装态与外部边界 | 不扩展成部署系统设计 |

## 3. 设计规格

### DS-BASE-001: 证据分层与事实归一化

- **traces**: [FR-BASE-001, FR-BASE-002]
- **模块**: baseline-evidence / scope-normalizer
- **接口**:
  - 输入：runtime 资产、仓库代码、技能文档、宿主安装态、宿主诊断结果
  - 输出：已确认事实、待确认项、历史背景、缺口清单
- **数据模型**:
  - `EvidenceItem (source, path, kind, confidence, notes)`
  - `Fact (statement, evidence_paths, status)`
  - `ScopeDecision (included, excluded, justification)`
- **关键约束**:
  - 证据必须可定位到文件或宿主路径
  - 不允许把推断写成事实
  - 冲突事实必须显式进入 findings，不得静默覆盖

### DS-BASE-002: 宿主安装态与外部边界纳入策略

- **traces**: [FR-BASE-002, FR-BASE-005]
- **模块**: host-boundary / external-boundary-snapshot
- **接口**:
  - 输入：`~/.spec-first`、`~/.codex/skills`、命令注册、同步结果、宿主健康诊断、仓库可见外部集成说明
  - 输出：宿主边界摘要、外部边界摘要、缺失证据列表
- **数据模型**:
  - `HostArtifactSnapshot (path, registered, health, notes)`
  - `ExternalBoundaryRecord (boundary, evidence_paths, coverage, status)`
- **关键约束**:
  - 宿主安装态是正式基线证据来源，不再作为背景杂项
  - 生产/运维信息若仓库内无证据，只记为补充信息，不阻断基线
  - 外部边界证据缺失时，必须在 findings 中留痕

### DS-BASE-003: 基线文档包与追溯链生成

- **traces**: [FR-BASE-003, FR-BASE-004]
- **模块**: baseline-doc-pack / doc-link-sync
- **接口**:
  - 输入：PRD、Spec、Findings、Task Plan、Document Links
  - 输出：可审查的基线包、可解析的引用关系、下一步建议
- **数据模型**:
  - `BaselineDocSet (prd, spec, findings, taskPlan, links)`
  - `LinkEntry (path, kind, stage, references)`
  - `ReviewCheckpoint (stage, outcome, timestamp)`
- **关键约束**:
  - 每个 FR 必须有 upstream REQ
  - 每个 AC 必须对应单一断言，并标注建议测试层级
  - `document-links.yaml` 必须与实际文档保持一致

### DS-BASE-004: 设计一致性与修订策略

- **traces**: [FR-BASE-003, FR-BASE-004, FR-BASE-005]
- **模块**: review-gate / revision-manager
- **接口**:
  - 输入：spec-review 结果、格式校验结果、文档关联校验结果
  - 输出：通过 / 需要修订 / 待澄清 的结论，以及 findings 中的下一步动作
- **数据模型**:
  - `ReviewResult (pass, score, issues, blockers)`
  - `RevisionItem (target, reason, severity, action)`
- **关键约束**:
  - `spec-review` 未通过时只修订文档，不进入设计之后的阶段
  - 回退只影响文档层，不涉及实现回滚
  - 所有高风险不确定项必须在 findings 中显式记录

## 4. 数据与契约

### 4.1 文档包契约

| 产物 | 责任 |
|------|------|
| `prd.md` | 说明范围、价值、边界与验收目标 |
| `spec.md` | 提供 FR/AC、NFR、风险、术语与下一步依据 |
| `findings.md` | 记录决策、证据、风险与下一步动作 |
| `task_plan.md` | 记录后续执行的粗粒度任务与状态 |
| `document-links.yaml` | 保证交付物之间的引用可解析 |
| `checklists/spec-review.md` | 固化审查结果与 C10 分数 |

### 4.2 事实优先级

1. `.spec-first/runtime/first/*` 运行态资产
2. 当前仓库代码与技能文档
3. 宿主安装态与诊断结果
4. 历史分析文档与旧材料

### 4.3 事实冲突处理

- 如果运行态资产与仓库文档冲突，以可复核证据为准，并在 findings 中记录冲突
- 如果宿主边界与仓库文档冲突，优先记录宿主边界事实，再决定是否收窄范围
- 如果历史材料与当前机制冲突，历史材料仅作为背景，不作为当前真源

## 5. 一致性与修订策略

### 5.1 一致性策略

- 先统一事实，再写结论
- 先固定边界，再写需求
- 先完成审查，再推进下一阶段

### 5.2 修订策略

- `spec-review` 发现问题：修订 `spec.md` / `prd.md`
- 设计评审发现问题：修订 `design.md`
- 文档关联断链：先修 `document-links.yaml`，再重新校验
- 宿主边界或外部证据不足：补充证据或保留为 `[NEEDS CLARIFICATION]`

### 5.3 回退策略

- 仅允许文档层回退
- 不回退宿主安装态、不回退代码实现
- 若设计结论被否定，保留 findings 证据链，重新收敛设计

## 6. 风险与未决项

| 风险 | 影响 | 缓解 |
|------|------|------|
| 宿主安装态证据不完整 | 基线完整度下降 | 把缺失项写入 findings，并在 design 中保留边界 |
| 外部边界缺少仓库内证据 | 评审难以闭环 | 仅把可证据化部分纳入正式范围 |
| 历史材料污染当前认知 | 需求与设计漂移 | 历史材料降级为背景，不作为当前真源 |

## 7. 下一步

- 进入 `task` 阶段前，先用 `docs links validate` 与 `spec-first analyze` 复核设计一致性
- 将本 Design 的 DS 映射到后续任务拆解
- 若发现宿主边界证据缺口，在 `findings.md` 中补充后再继续
