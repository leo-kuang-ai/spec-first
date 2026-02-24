---
name: "spec-first:sync"
description: "定位 Feature 并同步追踪矩阵与状态"
---

# Skill: sync

同步追踪矩阵，回填缺失关联并检测 orphan 项。

## 触发条件
- 阶段: 任意（不限阶段）
- Command: `/spec-first:sync`

## 执行阶段
- P0: 定位 Feature，检测变更文件
- P1: 加载矩阵、RFC 状态、缺陷状态
- P2: 生成同步计划（回填矩阵、更新状态）
- P3: 与用户确认同步变更
- P4: 执行回填，更新矩阵行
- P5: 将审计日志写入 findings.md

## CLI 依赖
- `spec-first matrix update`
- `spec-first matrix check`
- `spec-first rfc list`

## 输出路径
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/findings.md`

## 确认策略
- 推荐: assisted（同步会修改矩阵）

## 成功标准
- 同步计划已生成并经用户确认
- `traceability-matrix.md` 已回填更新
- `matrix check` 无 orphan 项
- 审计日志已写入 `findings.md`
