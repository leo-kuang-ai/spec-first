---
name: "spec-first:plan"
description: "定位 Feature 并加载当前阶段计划"
---

# Skill: plan

生成当前阶段的执行计划，评估风险与下一步骤。

## 触发条件
- 阶段: 任意（编排层 Skill）
- Command: `/spec-first:plan`

## 执行阶段
- P0: 定位 Feature 上下文；存在多个 Feature 时列出供用户选择
- P1: 确认当前 Feature，加载阶段与状态
- P2: 生成执行计划（下一步骤、风险评估、资源分配）
- P3: 与用户确认计划
- P4: 将计划摘要写入 findings.md
- P5: 无副作用

## CLI 依赖
- `spec-first feature list`
- `spec-first feature switch <featureId>`
- `spec-first feature current`
- `spec-first stage current`
- `spec-first metrics health`
- `spec-first doctor`

## 输出路径
- `specs/{featureId}/findings.md`

## 确认策略
- 推荐: assisted（计划需人工审阅）

## 成功标准
- 执行计划已生成，包含下一步骤、风险评估、资源分配
- 已明确目标 featureId 与当前阶段
- 用户确认后计划已写入 `findings.md`

## 编排规则
- 根据当前阶段调度对应 Skill
- 识别阻塞任务并建议解决方案
