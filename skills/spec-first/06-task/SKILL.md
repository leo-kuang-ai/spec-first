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
- P5: 执行 metrics coverage 检查 FR->TASK 覆盖率，执行 matrix check 检测 orphan 项

## TASK 字段语义

- `Owner`：单一责任人（一个 TASK 仅允许 1 名 owner）
- `Status`：`planned | in_progress | blocked | complete | verified`
- `depends_on`：仅允许引用同一 Feature 下 TASK ID，禁止自然语言依赖
- 任务明细表契约：首个非空单元格为 TASK ID，最后非空单元格为状态

## 并行与用户故事标记

- `[P]`：可并行执行（不依赖其他任务）
- `[US#]`：所属用户故事（可独立交付和测试）

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
- `task_plan.md` 已写入，包含所有 TASK 定义（ID、标题、Owner、工期、依赖、状态）
- 所有 TASK 已通过 `id next TASK` 注册
- `traceability-matrix.md` 已更新，每个 FR 有对应 TASK 引用
- `metrics coverage` C3 (Task Coverage) > 0%

## 示例（P2 输出格式）

```markdown
## Phase 1: Setup（基础设置）
- [ ] TASK-AUTH-001 [P] [US1] 初始化鉴权模块骨架

## Phase 2: User Stories - P1（核心价值）

### US1 — SMS Login (P1)
- [ ] TASK-AUTH-002 [P] [US1] 实现发送验证码 API
- [ ] TASK-AUTH-003 [US1] 实现验证码登录 API

## 任务明细
| Task ID | 标题 | Owner | 预计工期 | traces | depends_on | 验收标准 | 状态 |
|---|---|---|---|---|---|---|---|
| TASK-AUTH-002 | 发送验证码 API | BE | 1d | FR-AUTH-001,DS-AUTH-001 | - | 返回成功并含频控错误码 | planned |
| TASK-AUTH-003 | 验证码登录 API | BE | 1d | FR-AUTH-001,DS-AUTH-002 | TASK-AUTH-002 | 正确登录并覆盖错误路径 | planned |
```
