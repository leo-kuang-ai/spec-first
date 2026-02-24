---
name: "spec-first:code"
description: "定位进行中的 TASK 并执行代码实现"
---

# Skill: code

按 TASK 规格实现代码，自动关联追踪链路。

## 触发条件
- 阶段: 04_implement
- Command: `/spec-first:code`

## 执行阶段
- P0: 定位 Feature，校验阶段为 04_implement，从 task_plan.md 定位当前进行中的 TASK
- P1: 加载 TASK 上下文、关联的 FR/DS、constitution 约束
- P2: 按规格约束生成实现代码
- P3: 与用户确认代码变更（diff 预览）
- P4: 写入代码文件，更新 task_plan.md 中 TASK 状态
- P5: 自动注入 traces trailer，更新 progress.md

## CLI 依赖
- `spec-first commit`
- `spec-first matrix update`
- `spec-first ai context`

## 输出路径
- 源代码文件（按 TASK 规格）
- `specs/{featureId}/task_plan.md`
- `specs/{featureId}/progress.md`

## 确认策略
- 推荐: strict（Mode N）/ assisted（Mode I）

## 成功标准
- 代码文件已写入，符合 TASK 规格和 DS 约束
- `task_plan.md` 中对应 TASK 状态更新为 Done
- `spec-first commit` 已执行，traces trailer 已注入
- `progress.md` 已更新

## 示例（P2 输出格式）

```markdown
### TASK-AUTH-002: 短信发送 API

**文件**: `src/api/auth/sms/send-otp.ts`
**变更摘要**: 新增 POST /api/auth/sms/send-otp 端点
**关联**: FR-AUTH-001 → DS-AUTH-001
**代码**:
（展示完整实现代码，用户确认后写入）
```
