---
description: 以阶段状态机驱动的编排命令：plan -> skill 执行 -> verify -> stage advance。
---

# /orchestrate - Spec-First 流程编排

## 用法

`/orchestrate <featureId> <task-description>`

## 当前阶段到 Skill 的映射

- 统一规划：`/skill spec-first-plan <featureId> "<task-description>"`
- 统一校验：`/skill spec-first-verify <featureId> [quick|full]`
- 阶段编排：`/skill spec-first-orchestrate <featureId> "<task-description>"`

> 说明：当前最小集合只提供这 3 个跨阶段 Skill。阶段内“产物生成”仍由人工或自定义团队 Skill 完成。

## 编排流程

1. 读取当前阶段
   - `spec-first stage current <featureId>`
2. 调用 `/plan`（或 `/skill spec-first-plan`）生成阶段执行计划并获得确认
3. 执行阶段工作（当前最小集合不内置阶段生产 Skill）
4. 调用 `/verify <featureId> full`（或 `/skill spec-first-verify`）
5. 通过后推进阶段
   - `spec-first stage advance <featureId>`
6. 输出阶段结果与下一步建议

## 停止条件

- 用户未确认计划
- `/verify` 返回 `NOT READY`
- `stage advance` 失败（除非用户明确允许 `--force`）
