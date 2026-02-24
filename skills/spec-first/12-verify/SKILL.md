---
name: "spec-first:verify"
description: "定位 Feature 并执行阶段验收校验"
---

# Skill: verify

执行阶段验收校验，评估 Gate 条件与覆盖率缺口。

## 触发条件
- 阶段: 任意（编排层 Skill）
- Command: `/spec-first:verify`

## 执行阶段
- P0: 定位 Feature，加载当前阶段
- P1: 加载矩阵、覆盖率指标、Gate 条件
- P2: 生成校验报告（Gate 评估、SCA、覆盖率缺口）
- P3: 向用户展示校验结果
- P4: 将校验结果写入 findings.md
- P5: 若所有条件满足，建议执行 stage advance

## CLI 依赖
- `spec-first gate check`
- `spec-first matrix check`
- `spec-first metrics coverage`

## 输出路径
- `specs/{featureId}/findings.md`

## 确认策略
- 推荐: auto（只读校验）

## 成功标准
- 校验报告已生成，包含 Gate 评估、矩阵完整性、覆盖率缺口
- 校验结果已写入 `findings.md`
- 若所有条件满足，已建议执行 `stage advance`

## 编排规则
- 可被 orchestrate Skill 调用，作为阶段推进前的预检
