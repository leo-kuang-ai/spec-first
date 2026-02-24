---
name: "spec-first:status"
description: "定位当前 Feature 并输出状态概览"
---

# Skill: status

展示 Feature 状态仪表盘（阶段、覆盖率、健康分、任务进度）。

## 触发条件
- 阶段: 任意（不限阶段）
- Command: `/spec-first:status`

## 执行阶段
- P0: 定位当前 Feature
- P1: 加载 stage-state、指标、任务计划、Gate 历史
- P2: 生成状态仪表盘（阶段、覆盖率、健康分、任务、风险）
- P3: 向用户展示状态（无需确认）
- P4: 无写入
- P5: 无副作用

## CLI 依赖
- `spec-first stage current`
- `spec-first metrics health`
- `spec-first feature current`

## 输出路径
- 无（仅展示）

## 确认策略
- 推荐: auto（只读状态查询）

## 成功标准
- 状态仪表盘已展示（阶段、覆盖率、健康分、任务进度、风险）
