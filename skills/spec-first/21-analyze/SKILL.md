---
name: "spec-first:analyze"
description: "执行跨产物一致性分析并生成分析报告"
version: 1.0.0
last_updated: {{DATE}}
changelog: Initial version with standardized metadata
---

# Skill: analyze

对 `spec.md` / `design.md` / `task_plan.md` / 矩阵执行只读一致性分析，输出严重度分级报告。

## 触发条件
- 阶段: 建议在 03_plan 前后执行（任意阶段可读分析）
- Command: `/spec-first:analyze`

## 执行阶段
- P0: 定位 Feature，收集基础产物路径
- P1: 读取 `spec.md`、`design.md`、`task_plan.md`、`traceability-matrix.md`
- P2: 执行一致性分析（歧义词、覆盖缺口、产物缺失、潜在冲突）
- P3: 与用户确认高严重度项（CRITICAL/HIGH）
- P4: 写入 `reports/analysis-report.md`
- P5: 输出结论摘要与后续修复建议

## 严重度分级
- `CRITICAL`: 必须先修复，阻断推进
- `HIGH`: 高风险，建议当轮修复
- `MEDIUM`: 中风险，可排期处理
- `LOW`: 提示性问题

## 输出路径
- `specs/{featureId}/reports/analysis-report.md`

## 确认策略
- 推荐: assisted（分析发现需要人工裁决）

## 成功标准
- 生成结构化报告（按严重度排序）
- 发现项包含类型、位置、建议
- 报告可被后续 gate 读取并识别 CRITICAL 数量

