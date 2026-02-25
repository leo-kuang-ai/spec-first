---
name: "spec-first:catchup"
description: "定位当前 Feature 并恢复上下文"
---

# Skill: catchup

恢复会话上下文，生成 6 步恢复报告帮助快速续接工作。

## 触发条件
- 阶段: 任意（不限阶段）
- Command: `/spec-first:catchup`

## 执行阶段
- P0: 从 .spec-first/current 定位当前 Feature
- P1: 加载 stage-state.json、task_plan.md、findings.md
- P2: 生成 6 步恢复报告（阶段、任务、发现、缺失文件、风险、建议）
- P3: 向用户展示恢复摘要
- P4: 将恢复结果写入 findings.md
- P5: 无副作用

## CLI 依赖
- `spec-first ai catchup`
- `spec-first stage current <featureId>`

## 输出路径
- `specs/{featureId}/findings.md`

## 确认策略
- 推荐: assisted（恢复摘要写入 findings.md）

## 成功标准
- 6 步恢复报告已生成（阶段、任务、发现、缺失文件、风险、建议）
- 用户确认后恢复摘要已追加到 `findings.md`
