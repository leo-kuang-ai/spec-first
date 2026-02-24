---
name: "spec-first:code-review"
description: "定位变更范围并执行代码审查"
---

# Skill: code-review

对代码变更执行 4 维度审查（SOLID / 安全 / 性能 / 测试）。

## 触发条件
- 阶段: 04_implement（code Skill 之后）
- Command: `/spec-first:code-review`

## 执行阶段
- P0: 定位 Feature，校验阶段为 04_implement，从 git diff 或 TASK 范围定位变更文件
- P1: 加载 references/ 审查清单、FR/DS 约束
- P2: 按 4 维度（SOLID、安全、性能、测试）生成审查报告
- P3: 与用户确认审查发现
- P4: 将审查结果写入 findings.md
- P5: 审查通过则更新 TASK 状态

## CLI 依赖
- `spec-first metrics coverage`
- `spec-first matrix check`

## 输出路径
- `specs/{featureId}/findings.md`

## 参考清单
- `references/solid-checklist.md`
- `references/security-checklist.md`
- `references/performance-checklist.md`
- `references/testing-checklist.md`

## 确认策略
- 推荐: assisted（审查发现需人工判断）

## 成功标准
- 审查报告已生成，覆盖 4 维度（SOLID/安全/性能/测试）
- 审查发现已写入 `findings.md`
- 通过审查的 TASK 状态已更新
