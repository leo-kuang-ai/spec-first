---
name: "spec-first:task"
description: "定位 Feature 并校验阶段为任务拆解（03_plan）"
---

# Skill: task

将需求拆解为可执行的 TASK 任务清单。

## 触发条件
- 阶段: 03_plan
- Command: `/spec-first:task`

## 执行阶段
- P0: 定位 Feature，校验阶段为 03_plan
- P1: 从矩阵加载 FR 和 DS 条目
- P2: 生成 TASK 拆解，映射到 FR（ID、标题、工期、依赖）
- P3: 与用户确认任务计划
- P4: 将 TASK 写入矩阵和 task_plan.md
- P5: 执行 metrics coverage 检查 FR→TASK 覆盖率，执行 matrix check 检测 orphan 项

## CLI 依赖
- `spec-first id next TASK <abbr> --feature <featureId>`
- `spec-first matrix update`
- `spec-first matrix check`
- `spec-first metrics coverage`

## 输出路径
- `specs/{featureId}/traceability-matrix.md`
- `specs/{featureId}/task_plan.md`

## 确认策略
- 推荐: assisted（任务拆解需人工审阅）

## 成功标准
- `task_plan.md` 已写入，包含所有 TASK 定义（ID、标题、工期、依赖）
- 所有 TASK 已通过 `id next TASK` 注册
- `traceability-matrix.md` 已更新，每个 FR 有对应 TASK 引用
- `metrics coverage` C3 (Task Coverage) > 0%

## 示例（P2 输出格式）

```markdown
| TASK ID | 标题 | Owner | 工期 | depends_on | Status |
|---------|------|-------|------|------------|--------|
| TASK-AUTH-001 | H5 登录页面骨架 | FE | 1d | — | Planned |
| TASK-AUTH-002 | 短信发送 API | BE | 1d | — | Planned |
| TASK-AUTH-003 | 短信登录 API | BE | 1d | TASK-AUTH-002 | Planned |
```
