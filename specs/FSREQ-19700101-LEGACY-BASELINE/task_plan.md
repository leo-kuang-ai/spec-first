# Task Plan — FSREQ-19700101-LEGACY-BASELINE

> 存量系统可分析基线

## Plan Status

- summary: 基线设计已冻结，准备执行证据盘点与文档收口
- next_step: 按任务顺序完成盘点、边界、追溯链和一致性复核

## 任务总览

| title | status | summary | next_step | owner | notes |
|---|---|---|---|---|---|
| 现有能力盘点与事实归一化 | done | 已整理 CLI/Core/Skill/Template 与 runtime 资产清单 | 证据已写入 findings.md，可进入宿主边界纳入 | dev | traces: FR-BASE-001,FR-BASE-002 / DS-BASE-001 |
| 宿主安装态与外部边界纳入 | done | 已补齐宿主安装态、命令注册与外部边界摘要 | 证据已写入 findings.md，可进入文档包收口 | dev | traces: FR-BASE-002,FR-BASE-005 / DS-BASE-002 |
| 基线文档包与追溯链收口 | done | 已确保 prd/spec/findings/task_plan/document-links 一致可追溯 | 证据已写入 findings.md，可进入设计一致性复核 | dev | traces: FR-BASE-003,FR-BASE-004 / DS-BASE-003 |
| 设计一致性复核与修订闭环 | done | 已完成 spec/design/review 一致性收口 | 复核结论已写入 findings.md，可进入验证阶段 | qa | traces: FR-BASE-003,FR-BASE-004,FR-BASE-005 / DS-BASE-004 |

## 现有能力盘点与事实归一化

**目标**：形成当前系统能力总览，并将核心模块和 runtime 资产映射到可追溯证据。

**验收标准**：
- [ ] CLI / Core / Skill / Template / Runtime 资产均有明确证据路径
- [ ] 每个核心模块至少有一句责任说明
- [ ] 任何不确定事实都标记为 `[ASSUMED]` 或 `[NEEDS CLARIFICATION]`

**文件清单**：
- Read: `spec.md`
- Read: `design.md`
- Read: `.spec-first/runtime/first/*`
- Modify: `findings.md`

**实施步骤**：
1. 梳理当前仓库的核心模块、技能目录与 runtime 资产。
2. 归纳每个模块的职责，并为关键结论补上证据路径。
3. 将盘点结果写入 `findings.md`，同步当前结论与下一步。

**验证命令**：
```bash
spec-first validate format FSREQ-19700101-LEGACY-BASELINE
```

## 宿主安装态与外部边界纳入

**目标**：把宿主安装态、命令注册、同步结果和仓库可见的外部边界纳入正式基线证据。

**验收标准**：
- [ ] `~/.spec-first` 与 `~/.codex/skills` 的证据在规格中被正式纳入
- [ ] 宿主命令注册与同步结果有明确路径
- [ ] 外部边界缺失项在 `findings.md` 留痕，不静默补全

**文件清单**：
- Read: `spec.md`
- Read: `design.md`
- Read: `findings.md`
- Modify: `findings.md`

**实施步骤**：
1. 记录宿主安装态与命令注册的当前状态。
2. 补充仓库可见外部集成/部署边界的证据摘要。
3. 将缺失或待确认项写入 `findings.md`。

**验证命令**：
```bash
spec-first status FSREQ-19700101-LEGACY-BASELINE
```

## 基线文档包与追溯链收口

**目标**：保证 prd/spec/findings/task_plan/document-links 组成可评审、可追溯的基线包。

**验收标准**：
- [ ] `task_plan.md` 的总览表与设计中的 FR/DS 形成可读映射
- [ ] `document-links.yaml` 与实际文档路径一致
- [ ] 基线包可以直接进入下一阶段审查

**文件清单**：
- Read: `prd.md`
- Read: `spec.md`
- Read: `design.md`
- Read: `task_plan.md`
- Read: `document-links.yaml`
- Modify: `document-links.yaml`

**实施步骤**：
1. 检查基线包中的文档清单与当前文件是否一致。
2. 补齐或修正 document-links.yaml 中的引用关系。
3. 确认任务总览中的 summary 与 next_step 保持一致。

**验证命令**：
```bash
spec-first validate format FSREQ-19700101-LEGACY-BASELINE
```

## 设计一致性复核与修订闭环

**目标**：对 spec/design/review 的一致性做最终复核，并把修订意见回写 findings.md。

**验收标准**：
- [ ] `spec-review` 结果与现有 spec/design 不冲突
- [ ] 高风险或未决项在 `findings.md` 中有明确下一步
- [ ] 设计层没有引入实现级细节

**文件清单**：
- Read: `spec.md`
- Read: `design.md`
- Read: `checklists/spec-review.md`
- Read: `findings.md`
- Modify: `findings.md`

**实施步骤**：
1. 复核设计中的 FR/DS 是否覆盖 spec 的全部范围。
2. 检查 review checklist 结果是否与设计结论一致。
3. 将修订点与下一步动作回写到 findings.md。

**验证命令**：
```bash
spec-first validate format FSREQ-19700101-LEGACY-BASELINE
```
