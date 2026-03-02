---
name: "spec-first:code-review"
description: "定位变更范围并执行代码审查"
version: 1.0.0
last_updated: {{DATE}}
changelog: Initial version with standardized metadata
---

# Skill: code-review

对代码变更执行两阶段审查：先合规，再质量。

## 两阶段审查协议（P1-14）

### Stage 1: 合规审查（必须先通过）
- traces 是否完整（TASK/FR/DS 映射）
- 验证证据是否新鲜且可复现
- 变更是否符合阶段与流程守卫

### Stage 2: 质量审查（在 Stage 1 通过后执行）
- 4 维度：SOLID / 安全 / 性能 / 测试
- 输出风险等级与修复建议

硬规则：禁止跳过 Stage 1 直接进入 Stage 2。

## 审查反合理化守卫（P1-14）

| AI 的借口 | 封堵 |
|-----------|------|
| "直接看代码质量更高效" | 合规不通过时质量结论无效 |
| "这次改动小，可以省略合规检查" | 改动大小不影响流程约束 |
| "测试命令之前跑过，沿用就行" | 非新鲜证据不得用于当前结论 |

## 触发条件
- 阶段: 04_implement（code Skill 之后）
- Command: `/spec-first:code-review`

## 执行阶段
- P0: 定位 Feature，校验阶段为 04_implement，从 git diff 或 TASK 范围定位变更文件
- P1: 加载 references 审查清单、FR/DS 约束
- P2: 执行 Stage 1（合规）并输出结论
- P3: Stage 1 通过后执行 Stage 2（质量）
- P4: 与用户确认审查发现并写入 findings.md
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
- Stage 1（合规）与 Stage 2（质量）结果均已生成
- 审查顺序可复核（先合规后质量）
- 审查发现已写入 `findings.md`
- 通过审查的 TASK 状态已更新
